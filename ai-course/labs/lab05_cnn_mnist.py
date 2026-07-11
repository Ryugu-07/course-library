"""
lab05 · PyTorch CNN 识别手写数字（配第 05 讲）

  1. 在 M 系列芯片(MPS)上训练一个小 CNN
  2. 与全连接 MLP 对比: 参数量少一个数量级, 准确率反而更高
  3. 可视化第一层卷积核——网络自己学出的"特征探测器"

数据: 优先下载 MNIST(28×28, 约12MB); 网络不通则自动退回 sklearn
自带的 digits 数据集(8×8, 离线)。两者结论一致。

运行: .venv/bin/python labs/lab05_cnn_mnist.py
"""
import time

import numpy as np
import matplotlib.pyplot as plt
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, TensorDataset

from _common import save_and_show, OUTPUT

device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
print(f"设备: {device}  (mps = Apple 芯片的 GPU 加速)")
torch.manual_seed(0)

# ---------- 数据: MNIST(在线) 或 digits(离线兜底) ----------
def load_data():
    try:
        from torchvision import datasets, transforms
        tf = transforms.ToTensor()
        root = OUTPUT / "data"
        tr = datasets.MNIST(root, train=True, download=True, transform=tf)
        te = datasets.MNIST(root, train=False, download=True, transform=tf)
        # 只取 12000 训练样本, 保证 1-2 分钟跑完(想跑全量自己改)
        Xtr = tr.data[:12000].float().unsqueeze(1) / 255.0
        ytr = tr.targets[:12000]
        Xte = te.data[:2000].float().unsqueeze(1) / 255.0
        yte = te.targets[:2000]
        return Xtr, ytr, Xte, yte, 28, "MNIST"
    except Exception as e:
        print(f"  (MNIST 下载失败: {type(e).__name__}, 改用离线 digits 数据集)")
        from sklearn.datasets import load_digits
        from sklearn.model_selection import train_test_split
        d = load_digits()
        X = torch.tensor(d.images, dtype=torch.float32).unsqueeze(1) / 16.0
        y = torch.tensor(d.target)
        Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, random_state=0)
        return Xtr, ytr, Xte, yte, 8, "digits(8×8)"

Xtr, ytr, Xte, yte, side, name = load_data()
print(f"数据集: {name}  训练 {len(Xtr)} 张 / 测试 {len(Xte)} 张, 尺寸 {side}×{side}")
train_loader = DataLoader(TensorDataset(Xtr, ytr), batch_size=128, shuffle=True)

# ---------- 两个选手 ----------
class MLPBaseline(nn.Module):
    """全连接基线: 把图拉平, 无视空间结构(第05讲第1节的反面教材)"""
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Flatten(),
            nn.Linear(side * side, 256), nn.ReLU(),
            nn.Linear(256, 10),
        )
    def forward(self, x):
        return self.net(x)

class SmallCNN(nn.Module):
    """卷积-池化-卷积-池化-全连接: LeNet 的迷你后代"""
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(1, 16, 3, padding=1)   # 16 个 3×3 特征探测器
        self.conv2 = nn.Conv2d(16, 32, 3, padding=1)
        self.fc = nn.Linear(32 * (side // 4) ** 2, 10)
    def forward(self, x):
        x = F.max_pool2d(F.relu(self.conv1(x)), 2)    # 尺寸减半
        x = F.max_pool2d(F.relu(self.conv2(x)), 2)    # 再减半
        return self.fc(x.flatten(1))

def count_params(m):
    return sum(p.numel() for p in m.parameters())

def train_eval(model, epochs=3):
    model = model.to(device)
    opt = torch.optim.Adam(model.parameters(), lr=1e-3)
    t0 = time.time()
    for ep in range(epochs):
        model.train()
        for xb, yb in train_loader:
            xb, yb = xb.to(device), yb.to(device)
            loss = F.cross_entropy(model(xb), yb)   # 交叉熵: 第07讲会再见到它
            opt.zero_grad(); loss.backward(); opt.step()
    model.eval()
    with torch.no_grad():
        acc = (model(Xte.to(device)).argmax(1).cpu() == yte).float().mean().item()
    return acc, time.time() - t0

print("\n== 对决: 全连接 vs CNN ==")
for Model in [MLPBaseline, SmallCNN]:
    m = Model()
    acc, sec = train_eval(m)
    print(f"  {Model.__name__:12s} 参数 {count_params(m):>8,d}  测试准确率 {acc:.4f}  用时 {sec:.1f}s")
print("  → 归纳偏置的胜利: 参数更少, 准确率更高(第05讲第2节)")

# ---------- 可视化第一层卷积核 ----------
cnn = SmallCNN()
train_eval(cnn, epochs=3)
filters = cnn.conv1.weight.detach().cpu().numpy()   # [16, 1, 3, 3]
fig, axes = plt.subplots(2, 8, figsize=(12, 3.2))
for i, ax in enumerate(axes.ravel()):
    ax.imshow(filters[i, 0], cmap="gray")
    ax.axis("off")
fig.suptitle("第一层学出的 16 个 3×3 卷积核——没人设计它们, 反向传播自己找到的边缘/斑点探测器")
save_and_show(fig, "lab05_filters.png")

# 顺手看几个预测
with torch.no_grad():
    pred = cnn(Xte[:8].to(device)).argmax(1).cpu()
fig, axes = plt.subplots(1, 8, figsize=(12, 2))
for i, ax in enumerate(axes):
    ax.imshow(Xte[i, 0], cmap="gray"); ax.axis("off")
    ax.set_title(f"预测:{pred[i].item()}\n真:{yte[i].item()}", fontsize=9)
save_and_show(fig, "lab05_predictions.png")

print("""
== 动手改改 ==
1. 把 conv1 的 16 个核减到 4 个: 准确率掉多少? 特征探测器不够用了。
2. 给 MLP 加参数(256→2048): 能追上 CNN 吗? 代价是什么?
3. (进阶)把训练图整体右移 2 像素再测试: 谁掉得少? 平移等变性的实证。
""")
