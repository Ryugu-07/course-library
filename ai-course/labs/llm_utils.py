"""DeepSeek API 公共工具(lab08-10 用)。key 从 labs/.env 读取。"""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(Path(__file__).parent / ".env")

MODEL = "deepseek-chat"


def get_client() -> OpenAI:
    key = os.environ.get("DEEPSEEK_API_KEY", "").strip()
    if not key or key.startswith("sk-你的"):
        sys.exit(
            "❌ 未配置 DEEPSEEK_API_KEY。\n"
            "   1) cp labs/.env.example labs/.env\n"
            "   2) 编辑 labs/.env, 填入你在 platform.deepseek.com 创建的 key"
        )
    return OpenAI(api_key=key, base_url="https://api.deepseek.com")


def chat(client, messages, temperature=0.2, **kw):
    """单轮调用, 返回文本。"""
    resp = client.chat.completions.create(
        model=MODEL, messages=messages, temperature=temperature, **kw
    )
    return resp.choices[0].message.content
