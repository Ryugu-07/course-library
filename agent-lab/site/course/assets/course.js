document.addEventListener("DOMContentLoaded", function () {
  setupTheme();
  setupSidebar();
  setupReadingProgress();
  setupCodeCopy();
  setupLabs();
});

function setupTheme() {
  var button = document.getElementById("theme-toggle");
  if (!button) return;
  button.addEventListener("click", function () {
    var current = document.documentElement.getAttribute("data-theme");
    var next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("agentCourseTheme", next);
  });
}

function setupSidebar() {
  var button = document.getElementById("sidebar-toggle");
  var sidebar = document.getElementById("sidebar");
  var content = document.getElementById("content");
  if (!button || !sidebar || !content) return;
  button.addEventListener("click", function () { sidebar.classList.toggle("open"); });
  content.addEventListener("click", function () { sidebar.classList.remove("open"); });
  sidebar.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () { sidebar.classList.remove("open"); });
  });
}

function setupReadingProgress() {
  var checkbox = document.querySelector("[data-reading-complete]");
  if (!checkbox) return;
  var key = checkbox.getAttribute("data-reading-complete");
  var storageKey = "agentFullCourseProgress";
  var state = readStoredObject(storageKey);
  checkbox.checked = Boolean(state[key]);
  checkbox.addEventListener("change", function () {
    state[key] = checkbox.checked;
    localStorage.setItem(storageKey, JSON.stringify(state));
  });
}

function setupCodeCopy() {
  document.querySelectorAll("pre").forEach(function (block) {
    var wrapper = block.parentElement;
    if (wrapper && wrapper.classList.contains("highlight")) wrapper = wrapper.parentElement;
    var button = document.createElement("button");
    button.className = "code-copy";
    button.type = "button";
    button.textContent = "复制";
    button.style.cssText = "float:right;margin:7px 7px -45px 0;position:relative;z-index:2;background:var(--surface);border:1px solid var(--line);border-radius:5px;color:var(--muted);font-size:12px;min-height:28px;padding:2px 8px";
    block.parentNode.insertBefore(button, block);
    button.addEventListener("click", function () {
      copyText(block.innerText).then(function () {
        button.textContent = "已复制";
        setTimeout(function () { button.textContent = "复制"; }, 1200);
      });
    });
  });
}

function setupLabs() {
  document.querySelectorAll("[data-lab]").forEach(function (root) {
    var name = root.getAttribute("data-lab");
    var builders = {
      loop: buildLoopLab,
      provider: buildProviderLab,
      retry: buildRetryLab,
      context: buildContextLab,
      permission: buildPermissionLab,
      subagents: buildSubagentLab,
      extension: buildExtensionLab,
      eval: buildEvalLab
    };
    if (builders[name]) builders[name](root);
  });
}

function readStoredObject(key) {
  try { return JSON.parse(localStorage.getItem(key) || "{}"); }
  catch (error) { localStorage.removeItem(key); return {}; }
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
  return new Promise(function (resolve, reject) {
    var area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    try { document.execCommand("copy"); resolve(); }
    catch (error) { reject(error); }
    finally { area.remove(); }
  });
}

function el(tag, className, text) {
  var node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function setMarkup(root, markup) {
  root.innerHTML = markup;
}

function buildLoopLab(root) {
  setMarkup(root, `
    <div class="lab-toolbar">
      <label>任务场景<select data-loop-task><option value="files">列出目录并总结</option><option value="bug">修复失败测试</option></select></label>
      <button type="button" data-loop-prev>上一步</button>
      <button class="primary" type="button" data-loop-next>下一步</button>
      <button type="button" data-loop-reset>重新开始</button>
    </div>
    <div class="lab-output">
      <div class="loop-stage-list" data-loop-stages></div>
      <div class="lab-grid" style="margin-top:16px">
        <div class="lab-pane"><h3>当前发生什么</h3><div class="lab-kv" data-loop-detail></div></div>
        <div class="lab-pane"><h3>history 里现在有什么</h3><div class="history-stack" data-loop-history></div></div>
      </div>
    </div>
    <p class="lab-status" data-loop-status aria-live="polite"></p>
  `);
  var taskSelect = root.querySelector("[data-loop-task]");
  var stagesRoot = root.querySelector("[data-loop-stages]");
  var detailRoot = root.querySelector("[data-loop-detail]");
  var historyRoot = root.querySelector("[data-loop-history]");
  var statusRoot = root.querySelector("[data-loop-status]");
  var index = 0;
  var scenarios = {
    files: [
      {phase:0, title:"接收目标", actor:"Human → Runtime", data:"列出 workspace 文件并总结", history:[["user","用户任务","列出目录并总结"]]},
      {phase:1, title:"组装请求", actor:"Runtime", data:"SYSTEM_PROMPT + history + TOOLS", history:[["user","用户任务","列出目录并总结"]]},
      {phase:2, title:"模型选工具", actor:"LLM", data:'tool_call: list_files({"path":"."})', history:[["user","用户任务","列出目录并总结"],["assistant","工具调用","list_files(.)"]]},
      {phase:3, title:"本地执行", actor:"Executor", data:"检查路径 → 扫描 workspace → 返回文件名", history:[["user","用户任务","列出目录并总结"],["assistant","工具调用","list_files(.)"],["tool","工具结果","README.md, app.py, tests/"]]},
      {phase:4, title:"观察回填", actor:"Runtime → LLM", data:"真实目录结果进入下一轮上下文", history:[["user","用户任务","列出目录并总结"],["assistant","工具调用","list_files(.)"],["tool","工具结果","README.md, app.py, tests/"]]},
      {phase:2, title:"模型继续读取", actor:"LLM", data:'tool_call: read_file({"path":"README.md"})', history:[["user","用户任务","列出目录并总结"],["assistant","工具调用","list_files(.)"],["tool","工具结果","README.md, app.py, tests/"],["assistant","工具调用","read_file(README.md)"]]},
      {phase:4, title:"形成最终回答", actor:"LLM → Human", data:"没有新的工具调用，循环结束并输出总结", history:[["user","用户任务","列出目录并总结"],["tool","工具结果","README 描述了一个本地服务"],["assistant","最终回答","这是一个带测试的本地服务项目"]]}
    ],
    bug: [
      {phase:0,title:"接收目标",actor:"Human → Runtime",data:"修复当前失败测试",history:[["user","用户任务","修复当前失败测试"]]},
      {phase:1,title:"组装请求",actor:"Runtime",data:"注入项目规则、工具定义和任务历史",history:[["user","用户任务","修复当前失败测试"]]},
      {phase:2,title:"模型先取证",actor:"LLM",data:'tool_call: run_shell({"command":"pytest -q"})',history:[["user","用户任务","修复当前失败测试"],["assistant","工具调用","pytest -q"]]},
      {phase:3,title:"执行测试",actor:"Executor",data:"退出码 1；AssertionError: expected 3, got 2",history:[["user","用户任务","修复当前失败测试"],["tool","失败观察","expected 3, got 2"]]},
      {phase:4,title:"失败成为观察",actor:"Runtime → LLM",data:"错误文本不是终点，而是下一轮的上下文",history:[["user","用户任务","修复当前失败测试"],["tool","失败观察","expected 3, got 2"]]},
      {phase:2,title:"模型修改代码",actor:"LLM",data:"read_file → apply_patch；修改最小相关位置",history:[["tool","失败观察","expected 3, got 2"],["assistant","工具调用","apply_patch(app.py)"]]},
      {phase:3,title:"重新验证",actor:"Executor",data:"pytest -q → 12 passed；git diff 只含一处逻辑修改",history:[["assistant","工具调用","pytest -q"],["tool","验证证据","12 passed"]]},
      {phase:4,title:"带证据结束",actor:"LLM → Human",data:"报告根因、修改和测试结果",history:[["tool","验证证据","12 passed"],["assistant","最终回答","修复边界条件，12 项测试通过"]]}
    ]
  };
  var phaseNames = ["目标", "Prompt", "决策", "执行", "观察"];

  function render() {
    var steps = scenarios[taskSelect.value];
    index = Math.max(0, Math.min(index, steps.length - 1));
    var current = steps[index];
    stagesRoot.replaceChildren();
    phaseNames.forEach(function (name, phase) {
      var box = el("div", "loop-stage" + (phase === current.phase ? " current" : ""));
      box.append(el("span", "", "阶段 " + (phase + 1)), el("strong", "", name), el("p", "", ["任务进入系统","把现场打包","选择下一动作","真实世界执行","结果改变下一轮"][phase]));
      stagesRoot.append(box);
    });
    detailRoot.replaceChildren();
    [["步骤",(index + 1) + " / " + steps.length],["主角",current.actor],["事件",current.title],["数据",current.data]].forEach(function (row) {
      var item = el("div"); item.append(el("strong","",row[0]),el("span","",row[1])); detailRoot.append(item);
    });
    historyRoot.replaceChildren();
    current.history.forEach(function (item) {
      var row = el("div", "history-item " + item[0]); row.append(el("strong","",item[1]),el("span","",item[2])); historyRoot.append(row);
    });
    statusRoot.textContent = index === steps.length - 1 ? "循环结束：模型没有再请求工具，并且已有完成证据。" : "当前步骤完成后，结果会决定下一步，而不是按固定剧本播放。";
    root.querySelector("[data-loop-prev]").disabled = index === 0;
    root.querySelector("[data-loop-next]").disabled = index === steps.length - 1;
  }
  taskSelect.addEventListener("change", function () { index = 0; render(); });
  root.querySelector("[data-loop-prev]").addEventListener("click", function () { index -= 1; render(); });
  root.querySelector("[data-loop-next]").addEventListener("click", function () { index += 1; render(); });
  root.querySelector("[data-loop-reset]").addEventListener("click", function () { index = 0; render(); });
  render();
}

function buildProviderLab(root) {
  setMarkup(root, `
    <div class="lab-toolbar"><label>Provider<select data-provider><option value="openai">OpenAI Responses</option><option value="deepseek">DeepSeek Chat Completions</option><option value="anthropic">Anthropic Messages</option></select></label></div>
    <div class="lab-output lab-grid"><div class="lab-pane"><h3>发给模型的请求</h3><pre><code data-provider-request></code></pre></div><div class="lab-pane"><h3>模型返回的工具意图</h3><pre><code data-provider-call></code></pre></div></div>
    <div class="lab-pane"><h3>执行后怎样回填</h3><pre><code data-provider-result></code></pre><p class="lab-status" data-provider-status></p></div>
  `);
  var packets = {
    openai: {
      request:{model:"gpt-model",instructions:"You are a coding agent.",input:[{role:"user",content:"List files"}],tools:[{type:"function",name:"list_files",parameters:{type:"object",properties:{path:{type:"string"}}}}]},
      call:{type:"function_call",call_id:"call_01",name:"list_files",arguments:'{"path":"."}'},
      result:{type:"function_call_output",call_id:"call_01",output:"README.md\napp.py"}
    },
    deepseek: {
      request:{model:"deepseek-model",messages:[{role:"system",content:"You are a coding agent."},{role:"user",content:"List files"}],tools:[{type:"function",function:{name:"list_files",parameters:{type:"object",properties:{path:{type:"string"}}}}}]},
      call:{id:"call_01",type:"function",function:{name:"list_files",arguments:'{"path":"."}'}},
      result:{role:"tool",tool_call_id:"call_01",content:"README.md\napp.py"}
    },
    anthropic: {
      request:{model:"claude-model",system:"You are a coding agent.",messages:[{role:"user",content:"List files"}],tools:[{name:"list_files",input_schema:{type:"object",properties:{path:{type:"string"}}}}]},
      call:{type:"tool_use",id:"toolu_01",name:"list_files",input:{path:"."}},
      result:{role:"user",content:[{type:"tool_result",tool_use_id:"toolu_01",content:"README.md\napp.py"}]}
    }
  };
  function render() {
    var key = root.querySelector("[data-provider]").value;
    var packet = packets[key];
    root.querySelector("[data-provider-request]").textContent = JSON.stringify(packet.request,null,2);
    root.querySelector("[data-provider-call]").textContent = JSON.stringify(packet.call,null,2);
    root.querySelector("[data-provider-result]").textContent = JSON.stringify(packet.result,null,2);
    root.querySelector("[data-provider-status]").textContent = "变化的是 API 方言；不变的是“声明工具 → 模型填参数 → 宿主执行 → 按 call id 回填结果”。";
  }
  root.querySelector("[data-provider]").addEventListener("change", render);
  render();
}

function buildRetryLab(root) {
  setMarkup(root, `
    <div class="lab-toolbar">
      <label>最大轮数 <input type="range" min="1" max="8" value="4" data-retry-turns><span data-retry-turns-value>4</span></label>
      <label>故障模式<select data-retry-pattern><option value="recover">第二次恢复</option><option value="repeat">重复同一错误</option><option value="always">持续失败</option></select></label>
      <label><span>退避策略</span><select data-retry-backoff><option value="on">开启</option><option value="off">关闭</option></select></label>
      <button class="primary" type="button" data-retry-run>运行状态机</button>
    </div>
    <div class="lab-output"><div class="state-timeline" data-retry-timeline></div><p class="lab-status" data-retry-status aria-live="polite"></p></div>
  `);
  var turns = root.querySelector("[data-retry-turns]");
  function run() {
    var maxTurns = Number(turns.value);
    var pattern = root.querySelector("[data-retry-pattern]").value;
    var backoff = root.querySelector("[data-retry-backoff]").value === "on";
    var timeline = root.querySelector("[data-retry-timeline]");
    timeline.replaceChildren();
    var repeated = 0;
    var outcome = "max_turns";
    for (var i = 1; i <= maxTurns; i += 1) {
      var failed = pattern === "always" || pattern === "repeat" || (pattern === "recover" && i === 1);
      var message = failed ? (pattern === "repeat" ? "同一条无效 patch 再次被拒绝" : "工具返回临时错误") : "工具成功，验证通过";
      var row = el("div", "state-event" + (failed ? " failed" : ""));
      row.append(el("strong","","第 " + i + " 轮 · " + (failed ? "失败" : "成功")),el("span","",message + (failed && backoff ? "；等待 " + Math.pow(2,i-1) + " 个时间单位后重试" : "")));
      timeline.append(row);
      if (!failed) { outcome = "complete"; break; }
      if (pattern === "repeat") repeated += 1;
      if (repeated >= 2) { outcome = "repeat_guard"; break; }
    }
    var labels = {complete:"完成：成功证据出现，停止循环。",repeat_guard:"停止：重复行为检测器发现系统没有取得新信息。",max_turns:"停止：达到最大轮数，保留失败记录并报告阻塞。"};
    root.querySelector("[data-retry-status]").textContent = labels[outcome];
  }
  turns.addEventListener("input", function () { root.querySelector("[data-retry-turns-value]").textContent = turns.value; });
  root.querySelector("[data-retry-run]").addEventListener("click", run);
  run();
}

function buildContextLab(root) {
  setMarkup(root, `
    <div class="lab-toolbar">
      <label>窗口<select data-context-window><option value="8000">8k</option><option value="32000" selected>32k</option><option value="128000">128k</option></select></label>
      <label>历史 <input type="range" min="0" max="60" value="28" data-context-history><span data-value="history">28%</span></label>
      <label>文件 <input type="range" min="0" max="60" value="34" data-context-files><span data-value="files">34%</span></label>
      <label>日志 <input type="range" min="0" max="60" value="22" data-context-logs><span data-value="logs">22%</span></label>
      <label>策略<select data-context-strategy><option value="none">不处理</option><option value="drop">丢弃旧工具输出</option><option value="summary">摘要压缩</option><option value="subagent">把噪声工作交给子 Agent</option></select></label>
    </div>
    <div class="lab-output">
      <div class="budget-bar" aria-label="上下文占用"><span class="budget-segment budget-system" data-segment="system">规则</span><span class="budget-segment budget-history" data-segment="history">历史</span><span class="budget-segment budget-files" data-segment="files">文件</span><span class="budget-segment budget-tools" data-segment="logs">日志</span><span class="budget-segment budget-free" data-segment="free">空闲</span></div>
      <div class="lab-kv" data-context-kv></div><p class="lab-status" data-context-status></p>
    </div>
  `);
  function render() {
    var windowSize = Number(root.querySelector("[data-context-window]").value);
    var values = {
      system: 12,
      history: Number(root.querySelector("[data-context-history]").value),
      files: Number(root.querySelector("[data-context-files]").value),
      logs: Number(root.querySelector("[data-context-logs]").value)
    };
    var strategy = root.querySelector("[data-context-strategy]").value;
    if (strategy === "drop") values.logs *= .25;
    if (strategy === "summary") { values.history *= .38; values.logs *= .4; }
    if (strategy === "subagent") { values.files *= .55; values.logs *= .18; }
    var used = values.system + values.history + values.files + values.logs;
    var free = Math.max(0, 100 - used);
    ["system","history","files","logs"].forEach(function (key) { root.querySelector('[data-segment="'+key+'"]').style.width = Math.min(values[key],100) + "%"; });
    root.querySelector('[data-segment="free"]').style.width = free + "%";
    ["history","files","logs"].forEach(function (key) { root.querySelector('[data-value="'+key+'"]').textContent = root.querySelector('[data-context-'+key+']').value + "%"; });
    var kv = root.querySelector("[data-context-kv]"); kv.replaceChildren();
    [["有效占用",Math.round(used) + "% ≈ " + Math.round(windowSize * used / 100).toLocaleString() + " tokens"],["剩余空间",Math.round(free) + "%"],["采用策略",root.querySelector("[data-context-strategy]").selectedOptions[0].textContent]].forEach(function(row){var item=el("div");item.append(el("strong","",row[0]),el("span","",row[1]));kv.append(item);});
    var status = root.querySelector("[data-context-status]");
    if (used > 100) { status.className="lab-status budget-warning"; status.textContent="上下文溢出：重要目标可能被截断，模型也可能在摘要后失去早期细节。"; }
    else if (free < 15) { status.className="lab-status budget-warning"; status.textContent="高压区：下一次大工具输出就可能触发压缩。"; }
    else { status.className="lab-status"; status.textContent="当前还有工作空间。注意：空闲多并不等于相关性高。"; }
  }
  root.querySelectorAll("input,select").forEach(function(control){control.addEventListener("input",render);control.addEventListener("change",render);});
  render();
}

function buildPermissionLab(root) {
  setMarkup(root, `
    <div class="lab-toolbar">
      <label>动作<select data-permission-action><option value="read">读取文件</option><option value="edit">修改文件</option><option value="shell">运行普通命令</option><option value="network">访问网络</option><option value="destructive">删除大量文件</option></select></label>
      <label>目标<select data-permission-target><option value="workspace">当前 workspace</option><option value="git">.git 目录</option><option value="outside">workspace 外部</option><option value="home">用户主目录</option></select></label>
      <label>审批策略<select data-permission-policy><option value="on-request">需要时询问</option><option value="never">不允许询问</option><option value="always">每次都询问</option></select></label>
      <label>沙箱<select data-permission-sandbox><option value="workspace">workspace-write</option><option value="read-only">read-only</option><option value="full">full access</option></select></label>
    </div>
    <div class="lab-output"><div class="permission-result" data-permission-result><strong></strong><p></p></div><div class="permission-layers" data-permission-layers></div></div>
  `);
  function render() {
    var action = root.querySelector("[data-permission-action]").value;
    var target = root.querySelector("[data-permission-target]").value;
    var policy = root.querySelector("[data-permission-policy]").value;
    var sandbox = root.querySelector("[data-permission-sandbox]").value;
    var sandboxPass = sandbox === "full" || (sandbox === "workspace" && target === "workspace" && action !== "network" && action !== "destructive") || (sandbox === "read-only" && action === "read" && target === "workspace");
    if (target === "git" && action !== "read") sandboxPass = false;
    var dangerous = action === "destructive" || target === "home" || target === "git" || target === "outside" || action === "network";
    var decision;
    if (action === "destructive" && policy === "never") decision = "deny";
    else if (sandboxPass && policy !== "always" && !dangerous) decision = "allow";
    else if (!sandboxPass && policy === "never") decision = "deny";
    else decision = "ask";
    var result = root.querySelector("[data-permission-result]");
    result.className = "permission-result " + decision;
    var labels = {allow:["ALLOW · 自动执行","策略允许，动作也在沙箱技术边界内。"],ask:["ASK · 请求人类批准","动作需要扩大权限或策略要求显式确认。批准后仍要经过实际执行边界。"],deny:["DENY · 拒绝执行","当前策略不允许升级权限，或者动作属于不可接受风险。"]};
    result.querySelector("strong").textContent = labels[decision][0];
    result.querySelector("p").textContent = labels[decision][1];
    var layers = root.querySelector("[data-permission-layers]"); layers.replaceChildren();
    [["工具规则",dangerous?"需要审查":"普通动作",!dangerous],["审批策略",policy === "never"?"不能询问":policy === "always"?"必须询问":"按需询问",decision !== "deny"],["沙箱边界",sandboxPass?"技术上可达":"当前不可达",sandboxPass]].forEach(function(row){var box=el("div",row[2]?"pass":"stop");box.append(el("strong","",row[0]),el("span","",row[1]));layers.append(box);});
  }
  root.querySelectorAll("select").forEach(function(select){select.addEventListener("change",render);}); render();
}

function buildSubagentLab(root) {
  var tasks = [
    {id:"auth",label:"探索认证流程",kind:"read",target:"auth",noise:28},
    {id:"tests",label:"运行并归纳测试",kind:"read",target:"tests",noise:35},
    {id:"api",label:"实现 API 修改",kind:"write",target:"server",noise:24},
    {id:"ui",label:"实现前端修改",kind:"write",target:"web",noise:24},
    {id:"review",label:"独立审查最终 diff",kind:"read",target:"review",noise:20},
    {id:"same",label:"另一项任务也修改 server/auth.py",kind:"write",target:"server",noise:26}
  ];
  setMarkup(root, `
    <div class="lab-toolbar"><label>执行模式<select data-agent-mode><option value="single">单 Agent 顺序执行</option><option value="subagents">子 Agent 并行</option><option value="worktrees">子 Agent + 独立 worktree</option></select></label></div>
    <div class="lab-output lab-grid"><div class="lab-pane"><h3>选择任务</h3><div class="task-pool" data-task-pool></div></div><div class="lab-pane"><h3>调度结果</h3><div class="agent-lanes" data-agent-lanes></div><p class="lab-status" data-agent-status></p></div></div>
  `);
  var pool = root.querySelector("[data-task-pool]");
  tasks.forEach(function(task,index){var label=el("label");var input=el("input");input.type="checkbox";input.value=task.id;input.checked=index<5;label.append(input,el("span","",task.label));pool.append(label);});
  function render() {
    var mode = root.querySelector("[data-agent-mode]").value;
    var selected = tasks.filter(function(task){return pool.querySelector('input[value="'+task.id+'"]').checked;});
    var lanes = root.querySelector("[data-agent-lanes]"); lanes.replaceChildren();
    var conflicts = [];
    if (mode === "single") {
      var lane=el("div","agent-lane main");lane.append(el("strong","","主 Agent"),el("span","",selected.map(function(t){return t.label;}).join(" → ") || "没有任务"));lanes.append(lane);
    } else {
      var main=el("div","agent-lane main");main.append(el("strong","","主 Agent"),el("span","","保留需求、接口决策和最终汇总"));lanes.append(main);
      selected.forEach(function(task,index){var lane=el("div","agent-lane"+(task.id==="review"?" review":""));lane.append(el("strong","","子 Agent "+(index+1)),el("span","",task.label+(mode==="worktrees"&&task.kind==="write"?" · 独立 worktree":"")));lanes.append(lane);});
      var writeTargets={};selected.filter(function(t){return t.kind==="write";}).forEach(function(t){if(writeTargets[t.target])conflicts.push(t.target);writeTargets[t.target]=true;});
    }
    var totalNoise=selected.reduce(function(sum,t){return sum+t.noise;},0);
    var mainNoise=mode==="single"?totalNoise:Math.round(totalNoise*.28);
    var status=root.querySelector("[data-agent-status]");
    if(conflicts.length&&mode==="subagents")status.textContent="冲突警告：多个 Agent 会写同一目标。并行更快，但结果可能互相覆盖。";
    else if(conflicts.length&&mode==="worktrees")status.textContent="写入已隔离，但合并时仍要解决同一文件的语义冲突。主上下文噪声约从 "+totalNoise+" 降到 "+mainNoise+"。";
    else status.textContent="当前拆分可独立执行。主上下文噪声约从 "+totalNoise+" 降到 "+mainNoise+"。";
  }
  root.querySelector("[data-agent-mode]").addEventListener("change",render);pool.querySelectorAll("input").forEach(function(input){input.addEventListener("change",render);});render();
}

function buildExtensionLab(root) {
  setMarkup(root, `
    <div class="lab-toolbar">
      <label>核心需求<select data-extension-need><option value="rule">每次都遵守项目规则</option><option value="workflow">复用一套复杂工作方法</option><option value="external">访问外部数据或执行外部动作</option><option value="enforce">在工具前后强制运行检查</option><option value="share">给团队安装整套能力</option><option value="schedule">定时或持续运行</option><option value="isolate">把噪声任务隔离出去</option></select></label>
      <label>作用范围<select data-extension-scope><option value="repo">当前仓库</option><option value="personal">个人所有项目</option><option value="team">整个团队</option></select></label>
      <label>副作用<select data-extension-risk><option value="read">主要读取</option><option value="write">会修改外部状态</option><option value="enforce">必须机械执行</option></select></label>
    </div>
    <div class="lab-output"><div class="mechanism-result"><span>首选机制</span><strong data-extension-winner></strong><p data-extension-reason></p></div><div class="mechanism-score" data-extension-scores></div></div>
  `);
  var mechanisms=["AGENTS.md","Skill","MCP","Hook","Plugin","Automation","Subagent"];
  var base={rule:[95,35,5,20,20,5,5],workflow:[20,95,25,25,45,10,25],external:[5,25,100,20,45,15,15],enforce:[20,35,15,100,50,10,10],share:[15,55,45,45,100,15,20],schedule:[5,20,20,20,30,100,20],isolate:[5,25,10,10,20,10,100]};
  var reasons={"AGENTS.md":"规则应在每次任务开始前自动进入项目上下文。","Skill":"这是可复用的方法论，适合按需加载说明、参考资料和脚本。","MCP":"能力位于 Agent 外部，需要标准化工具或资源连接。","Hook":"要求不能依赖模型自觉，应该在生命周期节点机械执行。","Plugin":"需要把多种能力和配置作为安装单元交给团队。","Automation":"触发器来自时间或外部事件，而不是当前对话。","Subagent":"主要价值是独立上下文、专业角色或并行执行。"};
  function render(){var need=root.querySelector("[data-extension-need]").value;var scope=root.querySelector("[data-extension-scope]").value;var risk=root.querySelector("[data-extension-risk]").value;var scores=base[need].slice();if(scope==="team")scores[4]+=12;if(scope==="repo")scores[0]+=6;if(risk==="enforce")scores[3]+=15;if(risk==="write")scores[2]+=8;var max=Math.max.apply(null,scores);var winner=mechanisms[scores.indexOf(max)];root.querySelector("[data-extension-winner]").textContent=winner;root.querySelector("[data-extension-reason]").textContent=reasons[winner]+" 实际系统允许组合机制，而不是强迫一种机制包办全部问题。";var list=root.querySelector("[data-extension-scores]");list.replaceChildren();mechanisms.forEach(function(name,i){var row=el("div","mechanism-score-row");row.append(el("span","",name));var track=el("div","mechanism-track");var fill=el("span","mechanism-fill");fill.style.width=Math.min(scores[i],100)+"%";track.append(fill);row.append(track,el("strong","",Math.min(scores[i],100)));list.append(row);});}
  root.querySelectorAll("select").forEach(function(select){select.addEventListener("change",render);});render();
}

function buildEvalLab(root) {
  setMarkup(root, `
    <div class="lab-toolbar">
      <label>任务数量 <input type="range" min="20" max="200" value="80" data-eval-tasks><span data-eval-task-value>80</span></label>
      <label>工具临时故障率 <input type="range" min="0" max="30" value="12" data-eval-flaky><span data-eval-flaky-value>12%</span></label>
      <label>候选版策略<select data-eval-strategy><option value="retry">重试 + 验证</option><option value="context">压缩 + 工具输出治理</option><option value="safety">沙箱 + 审批</option><option value="all">全部组合</option></select></label>
    </div>
    <div class="lab-output"><div class="eval-comparison"><div class="eval-version"><h3>基线 v0</h3><div data-eval-base></div></div><div class="eval-version candidate"><h3>候选 v1</h3><div data-eval-candidate></div></div></div><div class="release-decision" data-release-decision></div><p class="lab-status">这里是教学模拟分数，不代表任何真实产品基准。重点是学习如何定义可比较的验收信号。</p></div>
  `);
  function renderRows(target,metrics){target.replaceChildren();[["任务成功",metrics.success,"%"],["错误完成",metrics.falseComplete,"%"],["安全事件",metrics.incidents," 次"],["平均成本",metrics.cost,"x"]].forEach(function(row){var line=el("div","eval-row");line.append(el("span","",row[0]));var track=el("div","eval-track");var fill=el("span","eval-fill");var width=row[0]==="平均成本"?Math.min(row[1]*50,100):row[0]==="安全事件"?Math.min(row[1]*10,100):row[1];fill.style.width=width+"%";track.append(fill);line.append(track,el("strong","",row[1]+row[2]));target.append(line);});}
  function render(){var tasks=Number(root.querySelector("[data-eval-tasks]").value);var flaky=Number(root.querySelector("[data-eval-flaky]").value);var strategy=root.querySelector("[data-eval-strategy]").value;root.querySelector("[data-eval-task-value]").textContent=tasks;root.querySelector("[data-eval-flaky-value]").textContent=flaky+"%";var baseMetrics={success:Math.max(45,Math.round(72-flaky*.55)),falseComplete:18,incidents:Math.max(1,Math.round(tasks*.045)),cost:1};var candidate={success:baseMetrics.success,falseComplete:baseMetrics.falseComplete,incidents:baseMetrics.incidents,cost:1};if(strategy==="retry"||strategy==="all"){candidate.success+=11;candidate.falseComplete-=9;candidate.cost+=.22;}if(strategy==="context"||strategy==="all"){candidate.success+=7;candidate.falseComplete-=4;candidate.cost-=.12;}if(strategy==="safety"||strategy==="all"){candidate.incidents=Math.max(0,candidate.incidents-Math.round(tasks*.035));candidate.cost+=.05;}candidate.success=Math.min(96,candidate.success);candidate.falseComplete=Math.max(2,candidate.falseComplete);candidate.cost=Math.max(.7,Number(candidate.cost.toFixed(2)));renderRows(root.querySelector("[data-eval-base]"),baseMetrics);renderRows(root.querySelector("[data-eval-candidate]"),candidate);var pass=candidate.success>=baseMetrics.success+5&&candidate.falseComplete<=12&&candidate.incidents<=baseMetrics.incidents;var decision=root.querySelector("[data-release-decision]");decision.className="release-decision "+(pass?"pass":"hold");decision.textContent=pass?"建议进入小流量试运行：核心指标改善，风险没有恶化。":"暂缓发布：至少一个验收门槛没有通过。";}
  root.querySelectorAll("input,select").forEach(function(control){control.addEventListener("input",render);control.addEventListener("change",render);});render();
}
