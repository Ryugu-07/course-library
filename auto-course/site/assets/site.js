// 数学渲染 + 主题切换 + 代码复制 + 移动端侧栏
document.addEventListener("DOMContentLoaded", function () {
  // KaTeX: arithmatex(generic) 输出 \( \) 与 \[ \]
  if (window.renderMathInElement) {
    renderMathInElement(document.getElementById("content"), {
      delimiters: [
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true },
      ],
      throwOnError: false,
    });
  }

  // 主题切换
  var toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      var next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    });
  }

  // 代码块复制按钮
  document.querySelectorAll(".highlight").forEach(function (block) {
    var btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.textContent = "复制";
    btn.addEventListener("click", function () {
      var code = block.querySelector("pre").innerText;
      navigator.clipboard.writeText(code).then(function () {
        btn.textContent = "已复制";
        setTimeout(function () { btn.textContent = "复制"; }, 1200);
      });
    });
    block.appendChild(btn);
  });

  // 移动端侧栏
  var sbToggle = document.getElementById("sidebar-toggle");
  var sidebar = document.getElementById("sidebar");
  if (sbToggle && sidebar) {
    sbToggle.addEventListener("click", function () {
      sidebar.classList.toggle("open");
    });
    document.getElementById("content").addEventListener("click", function () {
      sidebar.classList.remove("open");
    });
  }
});
