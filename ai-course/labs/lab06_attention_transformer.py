"""
lab06 · 注意力机制与 mini char-GPT（配第 06 讲）

  1. 纯 numpy 实现缩放点积注意力, 可视化注意力矩阵
  2. 用 PyTorch 搭一个迷你 GPT(约30行核心代码), 语料就用本课程的
     讲义 markdown ——训练几分钟, 看它从乱码进化到"机器学习腔"的胡话

运行: .venv/bin/python labs/lab06_attention_transformer.py
"""
import math
import time
from pathlib import Path

import numpy as np
import matplotlib.pyplot as plt
import torch
import torch.nn as nn
import torch.nn.functional as F

from _common import save_and_show

# ============================================================
# Part 1 · numpy 注意力: Attention(Q,K,V) = softmax(QKᵀ/√d)V
# ============================================================
def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)   # 数值稳定
    e = np.exp(x)
    return e / e.sum(axis=axis, keepdims=True)

def attention(Q, K, V):
    d_k = Q.shape[-1]
    scores = Q @ K.T / np.sqrt(d_k)           # [n, n] 两两相关度
    A = softmax(scores)                        # 每行是一个概率分布
    return A @ V, A                            # 加权求和 + 返回权重矩阵

def demo_attention():
    # 手造一个微型例子: 5 个"词", 已带位置信息的 8 维表示。
    # 我们故意让"它"的向量与"猫"相近——注意力应该会发现这一点。
    words = ["猫", "追", "老鼠", "而", "它"]
    rng = np.random.default_rng(1)
    X = rng.normal(0, 1, (5, 8))
    X[4] = X[0] + rng.normal(0, 0.3, 8)        # "它" ≈ "猫" + 小扰动

    # 简化: 直接用 X 当 Q=K=V(真实 Transformer 里有三个学习的投影矩阵)
    out, A = attention(X, X, X)

    print("== Part 1: 注意力矩阵(每行=该词对各词的关注权重) ==")
    header = "        " + "".join(f"{w:>6s}" for w in words)
    print(header)
    for i, w in enumerate(words):
        print(f"  {w:>4s}: " + "".join(f"{A[i,j]:6.2f}" for j in range(5)))
    print(f'  → 看"它"那一行: 对"猫"的权重最高(除自身外)——指代关系被内积捕捉。')

    fig, ax = plt.subplots(figsize=(5, 4.2))
    im = ax.imshow(A, cmap="YlOrBr")
    ax.set_xticks(range(5), words); ax.set_yticks(range(5), words)
    ax.set_title('注意力矩阵: 行=query, 列=key')
    fig.colorbar(im)
    save_and_show(fig, "lab06_attention_matrix.png")

# ============================================================
# Part 2 · mini char-GPT(逐字符生成中文)
# ============================================================
class CausalSelfAttention(nn.Module):
    """多头自注意力 + 因果掩码(不许偷看未来), 第06讲 3.1-3.3 节的直译"""
    def __init__(self, d, n_head, block):
        super().__init__()
        self.n_head, self.d = n_head, d
        self.qkv = nn.Linear(d, 3 * d)                 # 一次算出 Q,K,V
        self.proj = nn.Linear(d, d)
        mask = torch.tril(torch.ones(block, block))    # 下三角=允许看
        self.register_buffer("mask", mask)

    def forward(self, x):
        B, T, d = x.shape
        q, k, v = self.qkv(x).split(d, dim=2)
        # 拆成多头: [B, T, d] → [B, head, T, d/head]
        q = q.view(B, T, self.n_head, -1).transpose(1, 2)
        k = k.view(B, T, self.n_head, -1).transpose(1, 2)
        v = v.view(B, T, self.n_head, -1).transpose(1, 2)
        att = q @ k.transpose(-2, -1) / math.sqrt(d // self.n_head)  # ÷√d_k
        att = att.masked_fill(self.mask[:T, :T] == 0, float("-inf")) # 因果掩码
        att = F.softmax(att, dim=-1)
        y = (att @ v).transpose(1, 2).reshape(B, T, d)
        return self.proj(y)

class Block(nn.Module):
    """Transformer 块: 残差 + LayerNorm 包住 注意力 与 FFN(第06讲3.5节)"""
    def __init__(self, d, n_head, block):
        super().__init__()
        self.ln1, self.ln2 = nn.LayerNorm(d), nn.LayerNorm(d)
        self.attn = CausalSelfAttention(d, n_head, block)
        self.ffn = nn.Sequential(nn.Linear(d, 4 * d), nn.GELU(), nn.Linear(4 * d, d))

    def forward(self, x):
        x = x + self.attn(self.ln1(x))    # y = x + F(x): ResNet 的遗产
        x = x + self.ffn(self.ln2(x))
        return x

class MiniGPT(nn.Module):
    def __init__(self, vocab, d=128, n_head=4, n_layer=4, block=64):
        super().__init__()
        self.block = block
        self.tok_emb = nn.Embedding(vocab, d)          # 词嵌入
        self.pos_emb = nn.Embedding(block, d)          # (可学习的)位置编码
        self.blocks = nn.Sequential(*[Block(d, n_head, block) for _ in range(n_layer)])
        self.ln = nn.LayerNorm(d)
        self.head = nn.Linear(d, vocab)                # 输出: 下一字符的分布

    def forward(self, idx):
        B, T = idx.shape
        pos = torch.arange(T, device=idx.device)
        x = self.tok_emb(idx) + self.pos_emb(pos)
        return self.head(self.ln(self.blocks(x)))

    @torch.no_grad()
    def generate(self, idx, n_new, temperature=0.8):
        for _ in range(n_new):
            logits = self(idx[:, -self.block:])[:, -1] / temperature  # 温度(第08讲)
            probs = F.softmax(logits, dim=-1)
            idx = torch.cat([idx, torch.multinomial(probs, 1)], dim=1)
        return idx

def load_corpus():
    """语料 = 本课程全部讲义(自指涉的浪漫): 约几十万字符的中文 ML 文本"""
    lecture_dir = Path(__file__).parent.parent / "lectures"
    text = "\n".join(p.read_text(encoding="utf-8") for p in sorted(lecture_dir.glob("*.md")))
    return text

def train_minigpt(d=128, n_layer=4, steps=1500, log=True):
    """训练入口。lab07 会 import 这个函数扫不同模型规模。"""
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    text = load_corpus()
    chars = sorted(set(text))
    stoi = {c: i for i, c in enumerate(chars)}
    itos = {i: c for c, i in stoi.items()}
    data = torch.tensor([stoi[c] for c in text], dtype=torch.long)
    n_val = len(data) // 10
    train_data, val_data = data[:-n_val], data[-n_val:]
    if log:
        print(f"  语料 {len(text):,} 字符, 字表 {len(chars)} | 模型 d={d}, {n_layer} 层")

    block, batch = 64, 48
    def get_batch(split):
        src = train_data if split == "train" else val_data
        ix = torch.randint(len(src) - block - 1, (batch,))
        x = torch.stack([src[i:i + block] for i in ix])
        y = torch.stack([src[i + 1:i + block + 1] for i in ix])  # 目标=右移一位
        return x.to(device), y.to(device)

    model = MiniGPT(len(chars), d=d, n_head=4, n_layer=n_layer, block=block).to(device)
    n_params = sum(p.numel() for p in model.parameters())
    opt = torch.optim.AdamW(model.parameters(), lr=3e-4)

    def sample(prompt="机器学习", n=120):
        idx = torch.tensor([[stoi.get(c, 0) for c in prompt]], device=device)
        out = model.generate(idx, n)[0].tolist()
        return "".join(itos[i] for i in out)

    t0 = time.time()
    for step in range(steps + 1):
        x, y = get_batch("train")
        logits = model(x)
        loss = F.cross_entropy(logits.view(-1, logits.size(-1)), y.view(-1))
        opt.zero_grad(); loss.backward(); opt.step()
        if log and step % 300 == 0:
            with torch.no_grad():
                xv, yv = get_batch("val")
                vl = F.cross_entropy(model(xv).view(-1, logits.size(-1)), yv.view(-1))
            print(f"  step {step:5d}  train={loss.item():.3f}  val={vl.item():.3f}  [{time.time()-t0:.0f}s]")
            if step in (0, 300, steps):
                print(f"    生成示例: {sample()[:80]}…")

    # 返回验证损失(平均多个 batch, lab07 用)
    with torch.no_grad():
        vls = []
        for _ in range(20):
            xv, yv = get_batch("val")
            out = model(xv)
            vls.append(F.cross_entropy(out.view(-1, out.size(-1)), yv.view(-1)).item())
    return n_params, float(np.mean(vls)), sample

if __name__ == "__main__":
    demo_attention()
    print("\n== Part 2: 训练 mini char-GPT(约 2-4 分钟) ==")
    n_params, val_loss, sample = train_minigpt()
    print(f"\n  参数量 {n_params:,}  最终验证损失 {val_loss:.3f}")
    print("  ——step 0 是均匀乱码, 几百步后学会常用字搭配, 最后说出'机器学习腔'的胡话。")
    print("  它只是在预测下一个字符, 却顺带学出了词汇、标点、markdown 格式(第07讲第1节的微缩版)。\n")
    for prompt in ["机器学习", "神经网络", "注意力"]:
        print(f"  「{prompt}」→ {sample(prompt, 60)}")
    print("""
== 动手改改 ==
1. temperature 改成 0.1 和 1.5 各生成一次: 对照第08讲第1节的公式解释现象。
2. 把 n_layer 减到 1: 生成质量的下降肉眼可见吗? val loss 差多少?
3. 把因果掩码那行注释掉再训练: loss 会低得离谱——为什么这是"作弊"?
""")
