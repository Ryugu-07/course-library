(function () {
  "use strict";

  var registry = Object.create(null);
  var booted = false;
  var MODE_KEY = "course-reading-mode";

  function appendChildren(node, children) {
    if (children === undefined || children === null) return node;
    if (!Array.isArray(children)) children = [children];
    children.forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child.nodeType ? child : document.createTextNode(String(child)));
    });
    return node;
  }

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", value);
      else if (key === "htmlFor") node.setAttribute("for", value);
      else if (key === "text") node.textContent = value;
      else if (key.slice(0, 2) === "on" && typeof value === "function") {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function el(tag, attrs, children) {
    return appendChildren(setAttributes(document.createElement(tag), attrs), children);
  }

  function svg(tag, attrs, children) {
    return appendChildren(
      setAttributes(document.createElementNS("http://www.w3.org/2000/svg", tag), attrs),
      children
    );
  }

  function format(value, digits) {
    if (!Number.isFinite(value)) return "-";
    var places = digits === undefined ? 3 : digits;
    if (Math.abs(value) > 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 10000)) {
      return value.toExponential(Math.min(places, 4));
    }
    var text = value.toFixed(places);
    return text.indexOf(".") === -1
      ? text
      : text.replace(/0+$/, "").replace(/\.$/, "");
  }

  function announce(root, message) {
    var live = root.querySelector("[data-cl-live]");
    if (!live) {
      live = el("p", { className: "cl-sr-only", "data-cl-live": true, "aria-live": "polite" });
      root.appendChild(live);
    }
    live.textContent = "";
    window.setTimeout(function () { live.textContent = message; }, 20);
  }

  var api = { el: el, svg: svg, format: format, announce: announce };

  function storedMode() {
    try {
      return localStorage.getItem(MODE_KEY) === "reference" ? "reference" : "learn";
    } catch (error) {
      return "learn";
    }
  }

  function setMode(mode, toolbar) {
    var next = mode === "reference" ? "reference" : "learn";
    document.documentElement.setAttribute("data-reading-mode", next);
    try { localStorage.setItem(MODE_KEY, next); } catch (error) { /* file:// may deny storage */ }
    if (toolbar) {
      toolbar.querySelectorAll("[data-reading-mode-value]").forEach(function (button) {
        var active = button.getAttribute("data-reading-mode-value") === next;
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
      var note = toolbar.querySelector("[data-reading-mode-note]");
      if (note) {
        note.textContent = next === "learn"
          ? "保留直觉、推导、边界和互动实验"
          : "收起学习层，只看定义、公式与结论";
      }
    }
    document.dispatchEvent(new CustomEvent("course:reading-mode", { detail: { mode: next } }));
  }

  function mountModeControl(marker) {
    var title = el("strong", { text: "阅读方式" });
    var note = el("span", { "data-reading-mode-note": true });
    var intro = el("div", { className: "cl-mode-copy" }, [title, note]);
    var group = el("div", { className: "cl-segmented", role: "group", "aria-label": "阅读方式" });
    [["learn", "学习"], ["reference", "速查"]].forEach(function (item) {
      var button = el("button", {
        type: "button",
        "data-reading-mode-value": item[0],
        text: item[1],
        onclick: function () { setMode(item[0], marker); }
      });
      group.appendChild(button);
    });
    marker.classList.add("cl-reading-toolbar");
    marker.setAttribute("aria-label", "页面阅读模式");
    marker.replaceChildren(intro, group);
    setMode(storedMode(), marker);
  }

  function mountLab(root) {
    if (root.getAttribute("data-cl-mounted") === "true") return;
    var name = root.getAttribute("data-learning-lab");
    var builder = registry[name];
    if (!builder) return;
    var fallback = root.textContent.trim();
    root.setAttribute("data-cl-mounted", "true");
    try {
      builder(root, api);
    } catch (error) {
      root.removeAttribute("data-cl-mounted");
      root.setAttribute("data-cl-error", "true");
      root.textContent = fallback || "交互组件暂时无法加载，请阅读本节的静态推导。";
      if (window.console && console.error) console.error("Learning lab failed:", name, error);
    }
  }

  function boot() {
    if (booted) return;
    booted = true;
    document.querySelectorAll("[data-learning-page]").forEach(mountModeControl);
    document.querySelectorAll("[data-learning-lab]").forEach(mountLab);
  }

  window.CourseLearning = {
    register: function (name, builder) {
      registry[name] = builder;
      if (booted) document.querySelectorAll('[data-learning-lab="' + name + '"]').forEach(mountLab);
    },
    api: api
  };

  document.documentElement.setAttribute("data-reading-mode", storedMode());
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
