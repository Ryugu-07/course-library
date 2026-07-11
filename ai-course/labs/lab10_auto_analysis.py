"""
lab10 · 微型数据分析智能体（配第 15 讲, 收官实验）★ 需要 DeepSeek API key

给模型一个 CSV 和一个工具 run_python(code), 让它自主决定:
写什么分析代码 → 执行 → 看输出 → 决定下一步 → …… → 提交分析报告。
这是 lab09 的循环 + 真实生产力任务的合体。

⚠️ 本实验会执行模型生成的 Python 代码(仅限教学演示, 代码与输出全程
打印可审计; 生产环境须用沙箱隔离——第14讲坑6的工程版)。

运行: .venv/bin/python labs/lab10_auto_analysis.py
"""
import contextlib
import io
import json
from pathlib import Path

import numpy as np
import pandas as pd

from llm_utils import get_client, MODEL

client = get_client()
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
CSV = DATA_DIR / "sales.csv"

# ---------- 合成一份有"故事"的销售数据 ----------
def make_dataset():
    rng = np.random.default_rng(3)
    rows = []
    for month in range(1, 13):
        for region in ["华东", "华南", "华北", "西南"]:
            for product in ["A", "B", "C"]:
                base = {"A": 100, "B": 60, "C": 30}[product]
                seasonal = 1 + 0.3 * np.sin((month - 3) / 12 * 2 * np.pi)
                boost = 1.6 if (region == "华南" and product == "B" and month >= 7) else 1.0
                units = max(0, int(rng.normal(base * seasonal * boost, base * 0.15)))
                price = {"A": 199, "B": 349, "C": 899}[product] * (0.9 if month == 11 else 1)
                rows.append([f"2025-{month:02d}", region, product, units, round(units * price, 2)])
    df = pd.DataFrame(rows, columns=["月份", "地区", "产品", "销量", "销售额"])
    df.to_csv(CSV, index=False)

make_dataset()
print(f"数据已生成: {CSV} ({CSV.stat().st_size} 字节)")
print("(数据里埋了两个规律等模型去发现: 华南 B 产品下半年爆发 / 11 月降价)")

# ---------- 唯一的工具: 执行 Python ----------
EXEC_NS = {"pd": pd, "np": np, "CSV_PATH": str(CSV)}   # 持久命名空间: 变量跨轮保留

def run_python(code: str) -> str:
    print("  ┌─ 模型写的代码 ─────────────")
    for line in code.strip().splitlines():
        print(f"  │ {line}")
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf):
            exec(code, EXEC_NS)                        # 教学演示; 生产须沙箱
        out = buf.getvalue().strip() or "(代码执行成功, 无输出——记得用 print)"
    except Exception as e:
        out = f"执行报错: {type(e).__name__}: {e}"
    print(f"  └─ 输出: {out[:400]}{'…' if len(out) > 400 else ''}")
    return out[:3000]                                  # 截断防上下文爆炸(第08讲)

TOOLS_SCHEMA = [{"type": "function", "function": {
    "name": "run_python",
    "description": "执行 Python 代码分析数据。pandas(pd)/numpy(np) 已导入, "
                   "CSV 路径在变量 CSV_PATH。用 print 输出你想看的结果。变量跨调用保留。",
    "parameters": {"type": "object", "properties": {
        "code": {"type": "string", "description": "要执行的 Python 代码"}},
        "required": ["code"]},
}}]

# ---------- 分析智能体循环 ----------
def analyze(max_rounds=10):
    messages = [
        {"role": "system", "content":
         "你是数据分析师。流程: 先探索数据结构, 再分维度深入, 发现异常规律要验证。"
         "每轮只写一小段代码(第15讲: 小步走)。分析充分后, 不再调用工具, "
         "直接输出最终报告: 3-5 条量化发现 + 每条附支撑数字。"},
        {"role": "user", "content": "请分析这份 2025 年销售数据, 找出最重要的规律和异常。"},
    ]
    for rnd in range(1, max_rounds + 1):
        print(f"\n════ 第 {rnd} 轮 ════")
        resp = client.chat.completions.create(
            model=MODEL, messages=messages, tools=TOOLS_SCHEMA, temperature=0.2)
        msg = resp.choices[0].message
        if not msg.tool_calls:
            print(f"\n📊 最终分析报告:\n{msg.content}")
            return
        messages.append(msg)
        for tc in msg.tool_calls:
            result = run_python(json.loads(tc.function.arguments)["code"])
            messages.append({"role": "tool", "tool_call_id": tc.id, "content": result})
    print("⚠️ 达到轮数上限")

if __name__ == "__main__":
    analyze()
    print("""
验收它的报告(第15讲三条红线的演练):
  - 它发现"华南 B 下半年爆发"和"11 月降价"了吗? 漏了哪个?
  - 随机挑它报告里的一个数字, 自己用 pandas 验算一遍——真的对吗?
  - 它有没有把相关说成因果?

== 动手改改 ==
1. 往 make_dataset 里再埋一个规律(比如某地区 3 月数据缺失), 看它能否发现。
2. 把 system 提示里的"先探索"删掉: 分析质量下降吗? (方法论是提示词的一部分)
3. 让它最后把报告写入 data/report.md(给它加一个 write_file 工具, 参考 lab09)。

🎓 十个实验到此全部完成。回看 lab01 的多项式拟合——你已经从
"手工找一条曲线"走到了"指挥一个会自己写代码的智能体"。
""")
