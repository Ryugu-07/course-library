"""
lab09 · 手搓一个智能体循环（配第 09 讲）★ 需要 DeepSeek API key

不用任何 agent 框架, 纯手工实现完整的 agent loop:
  工具注册(JSON Schema) → 模型决定调用 → 宿主执行 → 结果回填 → 循环
每一步都打印出来——看懂这 100 行, "智能体"三个字就祛魅了。

任务示例: 模型需要自己决定先读文件、再逐项计算、最后对比预算下结论。

运行: .venv/bin/python labs/lab09_agent_loop.py
"""
import ast
import json
import operator
from pathlib import Path

from llm_utils import get_client, MODEL

client = get_client()
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

# ---------- 准备一个"环境": 账单文件 ----------
EXPENSES = DATA_DIR / "expenses.txt"
EXPENSES.write_text(
    "2026年上半年支出记录(元)\n"
    "1月: 房租 2300, 伙食 1450, 交通 320, 书籍 210\n"
    "2月: 房租 2300, 伙食 1680, 交通 280, 书籍 95\n"
    "3月: 房租 2300, 伙食 1520, 交通 350, 书籍 460\n"
    "4月: 房租 2400, 伙食 1490, 交通 300, 书籍 120\n"
    "5月: 房租 2400, 伙食 1610, 交通 330, 书籍 380\n"
    "6月: 房租 2400, 伙食 1550, 交通 290, 书籍 150\n",
    encoding="utf-8",
)

# ---------- 工具实现(宿主侧的真实代码; 模型只能"填表"请求调用) ----------
def tool_calculator(expression: str) -> str:
    """安全的四则运算求值(不用 eval, 用 AST 白名单——防注入的正确姿势)"""
    ops = {ast.Add: operator.add, ast.Sub: operator.sub,
           ast.Mult: operator.mul, ast.Div: operator.truediv}
    def ev(node):
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return node.value
        if isinstance(node, ast.BinOp) and type(node.op) in ops:
            return ops[type(node.op)](ev(node.left), ev(node.right))
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub):
            return -ev(node.operand)
        raise ValueError(f"不允许的表达式节点: {type(node).__name__}")
    try:
        return str(ev(ast.parse(expression, mode="eval").body))
    except Exception as e:
        return f"计算出错: {e}"     # 报错也回喂给模型, 让它自己修(第08讲: 错误恢复)

def tool_read_file(filename: str) -> str:
    """只允许读 data/ 目录(最小权限原则, 第09讲第5节)"""
    path = (DATA_DIR / Path(filename).name)
    if not path.exists():
        return f"文件不存在: {filename}。可用文件: {[p.name for p in DATA_DIR.iterdir()]}"
    return path.read_text(encoding="utf-8")

TOOLS_IMPL = {"calculator": tool_calculator, "read_file": tool_read_file}

# 工具的"说明书": 模型看的就是这份 JSON Schema(第09讲1.2节)
TOOLS_SCHEMA = [
    {"type": "function", "function": {
        "name": "calculator",
        "description": "计算四则运算表达式, 如 '2300*6 + 1450'",
        "parameters": {"type": "object", "properties": {
            "expression": {"type": "string", "description": "算术表达式"}},
            "required": ["expression"]},
    }},
    {"type": "function", "function": {
        "name": "read_file",
        "description": "读取数据目录下的文本文件内容",
        "parameters": {"type": "object", "properties": {
            "filename": {"type": "string", "description": "文件名, 如 expenses.txt"}},
            "required": ["filename"]},
    }},
]

# ---------- 智能体循环本体 ----------
def run_agent(task: str, max_rounds=8):
    messages = [
        {"role": "system", "content":
         "你是一个严谨的助手。解决任务时优先使用工具获取事实和计算, "
         "不要心算多位数乘加。得到足够信息后给出最终结论。"},
        {"role": "user", "content": task},
    ]
    for rnd in range(1, max_rounds + 1):
        print(f"\n──── 第 {rnd} 轮 ────")
        resp = client.chat.completions.create(
            model=MODEL, messages=messages, tools=TOOLS_SCHEMA, temperature=0.0)
        msg = resp.choices[0].message

        if not msg.tool_calls:                     # 不再调工具 = 给出最终回答
            print(f"🎯 最终回答:\n{msg.content}")
            return msg.content

        messages.append(msg)                       # 模型的调用意图进入历史
        for tc in msg.tool_calls:                  # 宿主执行每个工具调用
            args = json.loads(tc.function.arguments)
            print(f"🤖 模型请求: {tc.function.name}({args})")
            result = TOOLS_IMPL[tc.function.name](**args)
            shown = result if len(result) < 200 else result[:200] + "…"
            print(f"🔧 工具返回: {shown}")
            messages.append({                      # 结果回填(第09讲的第4步握手)
                "role": "tool", "tool_call_id": tc.id, "content": result})
    print("⚠️ 达到轮数上限, 强制停机(第08讲: 停机条件)")

if __name__ == "__main__":
    run_agent(
        "数据目录里有我上半年的支出记录 expenses.txt。请帮我:"
        "1) 算出每个月的总支出; 2) 算出月平均支出;"
        "3) 判断月平均是否超过预算 4800 元, 给出结论和最大的节流项建议。"
    )
    print("""
== 动手改改 ==
1. 把任务改成不需要文件的纯计算题: 模型还会去读文件吗?(好模型不会)
2. 故意把 expenses.txt 删掉再跑: 观察模型怎么处理"文件不存在"并自救。
3. 给它加第三个工具 write_file(把结论存盘), 体会"给智能体加能力=写个函数+一段schema"。
4. 把 max_rounds 改成 2: 观察任务没做完被掐断的样子——预算控制的现实。
""")
