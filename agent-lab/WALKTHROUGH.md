# Minimal SWE Agent Walkthrough

This project is a small teaching agent, not a production framework. The core
idea is: keep a conversation list, ask the model what to do, execute any tool
call it requests, append the tool result, and repeat.

## Full Turn Data Flow

1. User input enters `run_agent()`

   The CLI task becomes one history item. With OpenAI Responses it looks like:

   ```python
   {"role": "user", "content": [{"type": "input_text", "text": "..."}]}
   ```

   With DeepSeek Chat Completions it looks like:

   ```python
   {"role": "user", "content": "..."}
   ```

2. `build_prompt()` assembles the request

   It combines:

   - `SYSTEM_PROMPT`: role, tool rules, workspace rule, stopping rule.
   - `history`: user messages, model output items, and tool outputs.
   - `TOOLS`: JSON schemas for `read_file`, `write_file`, and `run_shell`.

   Run with `--dump-prompt --dry-run` to see the exact request before any API
   call:

   ```bash
   python3 minimal_swe_agent.py --dump-prompt --dry-run "List files and summarize."
   ```

   DeepSeek uses the same idea with a different API shape:

   ```bash
   python3 minimal_swe_agent.py --provider deepseek --dump-prompt --dry-run "List files and summarize."
   ```

3. `call_llm()` sends the request

   This is the provider boundary. OpenAI Responses uses:

   ```python
   client.responses.create(**request)
   ```

   DeepSeek uses its OpenAI-compatible Chat Completions endpoint:

   ```python
   client.chat.completions.create(**request)
   ```

   The rest of the agent should not care which provider was used.

4. `extract_function_calls()` parses model output

   Main path uses native API function calling. OpenAI Responses returns items
   such as:

   ```json
   {"type": "function_call", "name": "run_shell", "arguments": "{\"command\":\"ls\"}"}
   ```

   DeepSeek Chat Completions returns tool calls inside an assistant message:

   ```json
   {"role": "assistant", "tool_calls": [{"id": "...", "function": {"name": "run_shell", "arguments": "{\"command\":\"ls\"}"}}]}
   ```

   The file also includes `parse_text_protocol()` as a teaching contrast:

   ```xml
   <tool name="read_file">{"path":"notes.txt"}</tool>
   ```

   That parser shows that function calling is mostly a safer parser hosted by
   the API.

5. `execute_tool()` runs local code

   Tool dispatch is intentionally boring:

   - `read_file` resolves a path inside `workspace/` and returns text.
   - `write_file` resolves a path inside `workspace/` and writes text.
   - `run_shell` runs with `cwd=workspace/` and asks for `y/n` unless `--yolo`
     is set.

6. Tool result returns to context

   OpenAI tool results are appended as:

   ```python
   {"type": "function_call_output", "call_id": "...", "output": "..."}
   ```

   DeepSeek tool results are appended as:

   ```python
   {"role": "tool", "tool_call_id": "...", "content": "..."}
   ```

   This is the observation step: the model can now see what actually happened.

7. Loop decides whether to continue

   `run_agent()` repeats until:

   - the model returns no function calls,
   - `--max-turns` is reached,
   - or the user refuses a shell command and the model later decides to stop.

## Why The Five Pieces Exist

Loop: without a loop, the agent can only ask once and cannot react to tool
results.

Context management: without history, the model forgets what it asked tools to
do and what came back. `compact_context()` drops old tool outputs first because
they are usually bulky.

Prompt assembly: without a printable `build_prompt()`, the system feels
mystical. Seeing the exact request makes the agent teachable.

Output parser: without parsing, assistant text cannot safely become actions.
Function calling makes the action request structured; the XML parser shows the
manual version.

Executor: without an executor, tool calls are only intentions. This is the
trust boundary where the program performs real filesystem or shell effects.

## Quick Checks

```bash
python3 -m py_compile minimal_swe_agent.py
python3 minimal_swe_agent.py --self-test
python3 minimal_swe_agent.py --dump-prompt --dry-run "List the workspace files and summarize them."
```

To run a real v0 task with shell confirmation:

```bash
python3 minimal_swe_agent.py "List the current directory files and summarize them."
```

To use DeepSeek, set the key in your shell and pick the provider:

```bash
python3 -m pip install --upgrade -r requirements.txt
read -s DEEPSEEK_API_KEY
export DEEPSEEK_API_KEY
python3 minimal_swe_agent.py --provider deepseek "List the current directory files and summarize them."
```

To run without shell confirmation prompts:

```bash
python3 minimal_swe_agent.py --yolo "Create a tiny Python project and run one test."
```
