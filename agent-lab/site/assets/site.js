document.addEventListener("DOMContentLoaded", function () {
  var themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var current = document.documentElement.getAttribute("data-theme");
      var next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("agentCourseTheme", next);
    });
  }

  var sidebarToggle = document.getElementById("sidebar-toggle");
  var sidebar = document.getElementById("sidebar");
  var content = document.getElementById("content");
  if (sidebarToggle && sidebar && content) {
    sidebarToggle.addEventListener("click", function () {
      sidebar.classList.toggle("open");
    });
    content.addEventListener("click", function () {
      sidebar.classList.remove("open");
    });
    sidebar.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        sidebar.classList.remove("open");
      });
    });
  }

  document.querySelectorAll(".highlight").forEach(function (block) {
    var btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.type = "button";
    btn.textContent = "复制";
    btn.addEventListener("click", function () {
      var code = block.querySelector("pre").innerText;
      copyText(code).then(function () {
        btn.textContent = "已复制";
        setTimeout(function () { btn.textContent = "复制"; }, 1200);
      });
    });
    block.appendChild(btn);
  });

  document.querySelectorAll(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = tab.getAttribute("data-tab");
      document.querySelectorAll(".tab").forEach(function (item) {
        item.classList.toggle("active", item === tab);
      });
      document.querySelectorAll(".tab-panel").forEach(function (panel) {
        panel.classList.toggle("active", panel.id === "tab-" + target);
      });
    });
  });

  setupInsertionLab();
  setupFeatureLab();
  setupRoadmap();
});

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise(function (resolve, reject) {
    var input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand("copy");
      resolve();
    } catch (error) {
      reject(error);
    } finally {
      document.body.removeChild(input);
    }
  });
}

function setupInsertionLab() {
  var detail = document.getElementById("insertion-detail");
  var nodes = document.querySelectorAll(".insertion-node");
  if (!detail || !nodes.length) return;

  var details = {
    "before-model": {
      title: "模型调用前：准备它这一轮能看到的世界",
      body: "适合加入仓库搜索、记忆检索、规则加载、上下文压缩和敏感信息过滤。",
      question: "先问：这项功能需要给模型补充什么信息？"
    },
    "decision": {
      title: "模型决策时：改变候选动作和选择方式",
      body: "适合加入 Plan 模式、任务拆解、模型路由、最大轮数、预算提示和停止条件。",
      question: "先问：模型要在什么选择之间判断？"
    },
    "before-tool": {
      title: "工具执行前：检查这个动作能不能发生",
      body: "适合加入参数校验、权限规则、人工审批、命令分类、路径和网络策略。",
      question: "先问：最坏情况下，这个动作会伤害什么？"
    },
    "after-tool": {
      title: "工具执行后：把真实结果变成可用观察",
      body: "适合加入输出截断、错误分类、日志摘要、结构化解析和敏感信息脱敏。",
      question: "先问：模型下一轮真正需要看到结果的哪一部分？"
    },
    "between-turns": {
      title: "两轮之间：保存状态并决定是否继续",
      body: "适合加入测试验证、重复调用检测、重试、会话存储、上下文压缩和进度更新。",
      question: "先问：什么证据决定继续、结束或换一种办法？"
    },
    "outside-loop": {
      title: "循环之外：决定任务何时运行以及如何被人控制",
      body: "适合加入定时任务、Webhook、队列、界面、流式事件、通知、恢复和多 Agent 调度。",
      question: "先问：谁启动它，谁能打断它，结果交给谁？"
    }
  };

  nodes.forEach(function (node) {
    node.addEventListener("click", function () {
      var key = node.getAttribute("data-insertion");
      var selected = details[key];
      if (!selected) return;

      nodes.forEach(function (item) {
        var active = item === node;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", active ? "true" : "false");
      });

      detail.replaceChildren();
      var title = document.createElement("strong");
      var body = document.createElement("p");
      var question = document.createElement("span");
      title.textContent = selected.title;
      body.textContent = selected.body;
      question.textContent = selected.question;
      detail.append(title, body, question);
    });
  });
}

function setupFeatureLab() {
  var lab = document.querySelector("[data-feature-lab]");
  if (!lab) return;

  var storageKey = "agentFeatureDesignDraft";
  var templateSelect = document.getElementById("feature-template");
  var saveButton = document.getElementById("feature-save");
  var copyButton = document.getElementById("feature-copy");
  var resetButton = document.getElementById("feature-reset");
  var status = document.getElementById("feature-status");
  var previewName = document.getElementById("feature-preview-name");
  var preview = document.getElementById("feature-preview");
  var statusTimer;

  var fields = [
    { key: "name", id: "feature-name", label: "功能名称" },
    { key: "trigger", id: "feature-trigger", label: "触发条件" },
    { key: "context", id: "feature-context", label: "所需上下文" },
    { key: "decision", id: "feature-decision", label: "决策规则" },
    { key: "tools", id: "feature-tools", label: "可调用工具" },
    { key: "state", id: "feature-state", label: "中间状态" },
    { key: "verification", id: "feature-verification", label: "成功验证" },
    { key: "permission", id: "feature-permission", label: "权限边界" },
    { key: "failure", id: "feature-failure", label: "失败处理" },
    { key: "output", id: "feature-output", label: "用户输出" }
  ];

  var templates = {
    "test-repair": {
      name: "自动修复测试失败",
      trigger: "用户要求修复，或者测试命令返回非零退出码。",
      context: "失败日志、相关源码、测试文件、当前 diff、项目规则。",
      decision: "先定位根因，再选择最小修改；证据不足时继续搜索，不直接猜测。",
      tools: "search_text、read_file、apply_patch、run_shell、read_git_diff。",
      state: "当前根因假设、已经尝试的修改、失败测试、剩余尝试次数。",
      verification: "原失败测试通过；相关测试和静态检查没有新增失败。",
      permission: "只修改当前仓库；默认不联网；危险命令和仓库外写入必须审批。",
      failure: "最多尝试三轮；重复失败时停止修改，报告证据、尝试和阻塞点。",
      output: "根因、修改摘要、diff、验证结果、没有覆盖到的剩余风险。"
    },
    "project-memory": {
      name: "项目记忆",
      trigger: "任务结束、用户明确纠正 Agent，或者发现可复用的项目事实。",
      context: "本轮目标、关键决定、验证结果、已有记忆和项目规则。",
      decision: "只保存未来仍有价值且可以核验的信息；临时日志和猜测不进入长期记忆。",
      tools: "read_memory、write_memory、search_memory、validate_memory。",
      state: "候选记忆、来源、更新时间、置信度、适用目录和过期条件。",
      verification: "写入前与源码或配置核对；读取后在使用前再次验证当前状态。",
      permission: "不保存 API key、个人隐私和原始敏感日志；用户可以查看、修改和删除。",
      failure: "记忆冲突时保留两个来源并请求确认；过期内容降权或删除。",
      output: "本轮新增、更新和忽略了哪些记忆，以及每条信息的来源。"
    },
    "review-agent": {
      name: "子 Agent 代码审查",
      trigger: "实现完成并生成 diff 后，由主 Agent 发起只读审查。",
      context: "用户需求、项目规则、最终 diff、相关测试结果，不提供无关过程日志。",
      decision: "只报告可定位、可复现、会影响行为的问题；按严重度排序。",
      tools: "read_file、search_text、read_git_diff、run_read_only_checks。",
      state: "候选问题、证据位置、严重度、是否已被测试覆盖。",
      verification: "每个发现必须指向具体文件位置，并说明触发路径或失败场景。",
      permission: "只读；不能修改文件、提交代码或访问生产系统。",
      failure: "上下文不足时返回需要补充的材料，不把不确定猜测包装成结论。",
      output: "按严重度排列的发现、文件位置、理由，以及剩余测试缺口。"
    },
    "visual-check": {
      name: "网页视觉验收",
      trigger: "前端修改完成并成功启动本地开发服务器后。",
      context: "验收目标、修改后的页面 URL、目标桌面与手机尺寸、现有设计规范。",
      decision: "先检查页面是否正常加载，再检查溢出、重叠、可读性和关键交互。",
      tools: "start_server、open_browser、set_viewport、click、screenshot、read_console。",
      state: "服务器地址、当前视口、已检查交互、发现的问题和修复轮次。",
      verification: "桌面和手机均无横向溢出、遮挡和控制台错误；关键交互产生预期状态。",
      permission: "只访问本地站点和明确允许的资源；不使用已登录账户执行外部操作。",
      failure: "页面空白时先检查资源和控制台；服务器异常时保留日志并停止视觉结论。",
      output: "检查过的视口、交互结果、截图证据、已修复问题和残余风险。"
    },
    blank: {
      name: "",
      trigger: "",
      context: "",
      decision: "",
      tools: "",
      state: "",
      verification: "",
      permission: "",
      failure: "",
      output: ""
    }
  };

  function readFields() {
    var result = {};
    fields.forEach(function (field) {
      result[field.key] = document.getElementById(field.id).value.trim();
    });
    return result;
  }

  function writeFields(data) {
    fields.forEach(function (field) {
      document.getElementById(field.id).value = data[field.key] || "";
    });
    renderPreview();
  }

  function renderPreview() {
    var data = readFields();
    previewName.textContent = data.name || "未命名功能";
    preview.replaceChildren();
    fields.slice(1).forEach(function (field) {
      var term = document.createElement("dt");
      var description = document.createElement("dd");
      term.textContent = field.label;
      description.textContent = data[field.key] || "尚未填写";
      preview.append(term, description);
    });
  }

  function showStatus(message) {
    window.clearTimeout(statusTimer);
    status.textContent = message;
    statusTimer = window.setTimeout(function () {
      status.textContent = "";
    }, 2200);
  }

  function asMarkdown() {
    var data = readFields();
    var lines = ["# Agent 功能设计卡：" + (data.name || "未命名功能"), ""];
    fields.slice(1).forEach(function (field, index) {
      lines.push("## " + (index + 1) + " · " + field.label);
      lines.push(data[field.key] || "尚未填写");
      lines.push("");
    });
    return lines.join("\n");
  }

  fields.forEach(function (field) {
    document.getElementById(field.id).addEventListener("input", renderPreview);
  });

  templateSelect.addEventListener("change", function () {
    writeFields(templates[templateSelect.value]);
    showStatus("已载入示例，可以直接修改。");
  });

  saveButton.addEventListener("click", function () {
    localStorage.setItem(storageKey, JSON.stringify(readFields()));
    showStatus("草稿已保存在这个浏览器中。");
  });

  copyButton.addEventListener("click", function () {
    copyText(asMarkdown()).then(function () {
      showStatus("设计卡已复制。");
    }).catch(function () {
      showStatus("复制失败，请检查浏览器权限。");
    });
  });

  resetButton.addEventListener("click", function () {
    localStorage.removeItem(storageKey);
    templateSelect.value = "blank";
    writeFields(templates.blank);
    showStatus("设计卡已清空。");
  });

  var saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      templateSelect.value = "blank";
      writeFields(JSON.parse(saved));
      showStatus("已恢复上次保存的草稿。");
    } catch (error) {
      localStorage.removeItem(storageKey);
      writeFields(templates[templateSelect.value]);
    }
  } else {
    writeFields(templates[templateSelect.value]);
  }
}

function setupRoadmap() {
  var checkboxes = document.querySelectorAll("[data-roadmap]");
  if (!checkboxes.length) return;

  var storageKey = "agentLearningRoadmap";
  var saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
  } catch (error) {
    localStorage.removeItem(storageKey);
  }

  checkboxes.forEach(function (checkbox) {
    var key = checkbox.getAttribute("data-roadmap");
    checkbox.checked = Boolean(saved[key]);
    checkbox.addEventListener("change", function () {
      saved[key] = checkbox.checked;
      localStorage.setItem(storageKey, JSON.stringify(saved));
    });
  });
}
