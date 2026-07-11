"""
lab08 · 提示词工程对照实验（配第 08 讲）★ 需要 DeepSeek API key

三组实验, 用数据验证讲义的论断:
  A. 直接作答 vs 思维链(CoT): 多步算术的准确率对比
  B. 温度: 同一问题在 T=0 与 T=1.4 下的输出稳定性
  C. 自洽性(self-consistency): 多次采样投票能否救回难题

花费预估: 约 50 次调用, deepseek-chat 价位下 < 0.1 元。

运行: .venv/bin/python labs/lab08_prompt_engineering.py
"""
import random
import re
from collections import Counter

from llm_utils import get_client, chat

client = get_client()
random.seed(7)

# ---------- 出题: 程序生成算术题, 真值由 Python 算, 绝对可靠 ----------
def make_problems(n=8):
    probs = []
    for _ in range(n):
        a, b, c, d = (random.randint(37, 98) for _ in range(4))
        expr = f"{a} * {b} + {c} * {d}"
        probs.append((f"计算 {a} × {b} + {c} × {d}", eval(expr)))
    return probs

PROBLEMS = make_problems()

def extract_answer(text):
    """约定模型最后输出'最终答案: <数字>', 从中提取。"""
    m = re.findall(r"最终答案[:：]\s*(-?[\d,]+)", text)
    if m:
        return int(m[-1].replace(",", ""))
    nums = re.findall(r"-?\d+", text)          # 兜底: 取最后一个数字
    return int(nums[-1]) if nums else None

def solve(question, mode, temperature=0.0):
    if mode == "direct":
        sys_p = "直接给出计算结果, 禁止写任何过程或解释。格式: 最终答案: <数字>"
    else:  # cot
        sys_p = "先一步步写出计算过程, 最后一行输出: 最终答案: <数字>"
    text = chat(client, [
        {"role": "system", "content": sys_p},
        {"role": "user", "content": question},
    ], temperature=temperature)
    return extract_answer(text), text

# ---------- 实验 A: 直接作答 vs 思维链 ----------
print("== 实验 A: 直接作答 vs 思维链(8 道多步算术) ==")
score = {"direct": 0, "cot": 0}
for q, truth in PROBLEMS:
    row = f"  {q:32s} 真值={truth:>6d}"
    for mode in ["direct", "cot"]:
        ans, _ = solve(q, mode)
        ok = ans == truth
        score[mode] += ok
        row += f"  {mode}={'✓' if ok else f'✗({ans})'}"
    print(row)
print(f"  准确率: 直接作答 {score['direct']}/{len(PROBLEMS)}  vs  思维链 {score['cot']}/{len(PROBLEMS)}")
print("  原理(第08讲2.③): 每个 token 计算量固定, '禁止过程'等于逼模型一步心算;")
print("  思维链把中间结果写进上下文 = 外置工作记忆。\n")

# ---------- 实验 B: 温度与稳定性 ----------
print("== 实验 B: 温度(同一题各采样 3 次) ==")
q = "用一句话(15字内)描述机器学习是什么?"
for T in [0.0, 1.4]:
    print(f"  T={T}:")
    for i in range(3):
        out = chat(client, [{"role": "user", "content": q}], temperature=T)
        print(f"    {i+1}. {out.strip()[:50]}")
print("  → T=0 几乎逐字复现, T=1.4 五花八门。分类/抽取任务用低温, 创意任务用高温。\n")

# ---------- 实验 C: 自洽性投票 ----------
print("== 实验 C: 自洽性(难题采样 5 条思维链, 多数投票) ==")
a, b = 847, 963
q, truth = f"计算 {a} × {b}", a * b
votes = []
for i in range(5):
    ans, _ = solve(q, "cot", temperature=1.0)   # 高温制造多样性
    votes.append(ans)
    print(f"  采样{i+1}: {ans} {'✓' if ans == truth else '✗'}")
majority = Counter(votes).most_common(1)[0][0]
print(f"  真值={truth}  多数票={majority} {'✓ 投票答对' if majority == truth else '✗ 这次投票也没救回来'}")
print("  原理(第08讲2.④): 错误各错各的, 正确殊途同归——bagging 式降方差。")

print("""
== 动手改改 ==
1. 把实验A的数字位数加大(randint 上限改 998): 两种模式的差距拉大了吗?
2. 实验C的采样数从 5 加到 9: 投票正确率更稳了吗? 代价是什么?
3. 给实验A加第三种模式: few-shot(在 system 里塞两个带完整过程的例题)。
""")
