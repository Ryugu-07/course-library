(function () {
  "use strict";

  var STYLE_ID = "cl-transformer-styles";
  var TOKENS = ["猫", "追", "老鼠", "它"];
  var SQRT_DK = Math.sqrt(2);
  var EMBEDDINGS = [
    [1.0, 0.2, 0.8, -0.1],
    [0.6, 1.0, -0.3, 0.4],
    [0.1, 0.9, 0.7, 0.8],
    [0.8, -0.2, 0.9, 0.3]
  ];
  var HEADS = [
    {
      label: "头 1",
      note: "偏向内容相似度",
      wq: [[0.9, 0.1], [0.1, 0.8], [0.7, -0.2], [-0.1, 0.6]],
      wk: [[0.8, 0.2], [0.0, 0.9], [0.6, -0.1], [-0.2, 0.7]],
      wv: [[1.0, 0.0], [0.0, 1.0], [0.5, 0.5], [-0.5, 0.3]]
    },
    {
      label: "头 2",
      note: "偏向关系 / 位置线索",
      wq: [[0.2, 0.9], [0.8, -0.1], [-0.4, 0.6], [0.7, 0.2]],
      wk: [[0.1, 0.8], [0.9, 0.1], [-0.3, 0.7], [0.6, 0.4]],
      wv: [[0.4, -0.2], [0.1, 0.8], [0.9, 0.2], [0.2, 0.6]]
    }
  ];

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function formatNumber(value, digits, api) {
    if (!finite(value)) {
      return "−∞";
    }
    if (api && typeof api.format === "function") {
      try {
        return api.format(value, digits);
      } catch (error) {
        // The host formatter is optional.
      }
    }
    var places = typeof digits === "number" ? digits : 3;
    var rounded = Math.abs(value) < Math.pow(10, -(places + 1)) ? 0 : value;
    return rounded.toFixed(places);
  }

  function dot(left, right) {
    var total = 0;
    for (var i = 0; i < left.length; i += 1) {
      total += left[i] * right[i];
    }
    return total;
  }

  function project(vector, matrix) {
    var result = [];
    for (var column = 0; column < matrix[0].length; column += 1) {
      var total = 0;
      for (var row = 0; row < vector.length; row += 1) {
        total += vector[row] * matrix[row][column];
      }
      result.push(total);
    }
    return result;
  }

  function softmax(scores) {
    var largest = -Infinity;
    scores.forEach(function (score) {
      if (score > largest) {
        largest = score;
      }
    });
    if (!finite(largest)) {
      return scores.map(function () { return 0; });
    }
    var exponentials = scores.map(function (score) {
      return finite(score) ? Math.exp(score - largest) : 0;
    });
    var total = exponentials.reduce(function (sum, value) { return sum + value; }, 0);
    return exponentials.map(function (value) { return total ? value / total : 0; });
  }

  function headComputation(head, causal) {
    var q = EMBEDDINGS.map(function (row) { return project(row, head.wq); });
    var k = EMBEDDINGS.map(function (row) { return project(row, head.wk); });
    var v = EMBEDDINGS.map(function (row) { return project(row, head.wv); });
    var scores = [];
    var weights = [];
    var outputs = [];

    for (var query = 0; query < TOKENS.length; query += 1) {
      var scoreRow = [];
      for (var key = 0; key < TOKENS.length; key += 1) {
        scoreRow.push(causal && key > query ? -Infinity : dot(q[query], k[key]) / SQRT_DK);
      }
      scores.push(scoreRow);
      var weightRow = softmax(scoreRow);
      weights.push(weightRow);
      var output = [0, 0];
      for (var valueIndex = 0; valueIndex < TOKENS.length; valueIndex += 1) {
        output[0] += weightRow[valueIndex] * v[valueIndex][0];
        output[1] += weightRow[valueIndex] * v[valueIndex][1];
      }
      outputs.push(output);
    }
    return { q: q, k: k, v: v, scores: scores, weights: weights, outputs: outputs };
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".cl-transformer { --cl-tf-bg: var(--bg, #faf6ee); --cl-tf-panel: var(--block-bg, #f5f0e3); --cl-tf-border: var(--border, #e0d7c4); --cl-tf-fg: var(--fg, #2c2a26); --cl-tf-soft: var(--fg-soft, #6b6557); --cl-tf-accent: var(--accent, #8a5a2b); --cl-tf-blue: #2d6f9f; --cl-tf-green: #4d8658; margin: 1.5rem 0 2rem; color: var(--cl-tf-fg); font-size: .93rem; line-height: 1.5; }",
      ".cl-transformer * { box-sizing: border-box; }",
      ".cl-transformer .cl-tf-shell { border: 1px solid var(--cl-tf-border); border-radius: 8px; overflow: hidden; background: var(--cl-tf-bg); }",
      ".cl-transformer .cl-tf-header { padding: 1.1rem 1.25rem .95rem; border-bottom: 1px solid var(--cl-tf-border); background: var(--cl-tf-panel); }",
      ".cl-transformer .cl-tf-kicker { margin: 0 0 .2rem; color: var(--cl-tf-accent); font-size: .75rem; font-weight: 800; letter-spacing: 0; text-transform: uppercase; }",
      ".cl-transformer h3 { margin: 0; color: var(--cl-tf-fg); font-size: 1.2rem; }",
      ".cl-transformer .cl-tf-header p { margin: .35rem 0 0; color: var(--cl-tf-soft); }",
      ".cl-transformer .cl-tf-controls { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(220px, .85fr) minmax(200px, .9fr); gap: .8rem; padding: .9rem 1.1rem; border-bottom: 1px solid var(--cl-tf-border); background: var(--cl-tf-panel); }",
      ".cl-transformer .cl-tf-fieldset { min-width: 0; margin: 0; padding: .65rem .7rem .7rem; border: 1px solid var(--cl-tf-border); border-radius: 6px; }",
      ".cl-transformer .cl-tf-fieldset legend { padding: 0 .25rem; color: var(--cl-tf-soft); font-size: .78rem; font-weight: 700; }",
      ".cl-transformer .cl-tf-token-buttons { display: flex; flex-wrap: wrap; gap: .45rem; }",
      ".cl-transformer .cl-tf-token { min-width: 3rem; padding: .42rem .68rem; color: var(--cl-tf-accent); background: var(--cl-tf-bg); }",
      ".cl-transformer .cl-tf-token[aria-pressed=true] { color: var(--cl-tf-bg); background: var(--cl-tf-accent); }",
      ".cl-transformer button { border: 1px solid var(--cl-tf-accent); border-radius: 8px; cursor: pointer; font: inherit; font-size: .85rem; font-weight: 700; }",
      ".cl-transformer button:hover, .cl-transformer button:focus-visible { filter: brightness(1.08); }",
      ".cl-transformer .cl-tf-mask-label { display: flex; align-items: flex-start; gap: .55rem; min-height: 44px; color: var(--cl-tf-fg); font-size: .84rem; }",
      ".cl-transformer .cl-tf-mask-label input { margin-top: .25rem; accent-color: var(--cl-tf-accent); }",
      ".cl-transformer .cl-tf-mask-note { margin: .35rem 0 0 1.45rem; color: var(--cl-tf-soft); font-size: .76rem; }",
      ".cl-transformer .cl-tf-shapes { display: flex; flex-wrap: wrap; gap: .4rem; align-items: center; color: var(--cl-tf-soft); font: .77rem ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }",
      ".cl-transformer .cl-tf-shape { padding: .25rem .4rem; border: 1px solid var(--cl-tf-border); border-radius: 6px; background: var(--cl-tf-bg); }",
      ".cl-transformer .cl-tf-body { padding: 1rem; }",
      ".cl-transformer .cl-tf-heads { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .85rem; }",
      ".cl-transformer .cl-tf-head-card, .cl-transformer .cl-tf-output-card, .cl-transformer .cl-tf-boundary { border: 1px solid var(--cl-tf-border); border-radius: 6px; background: var(--cl-tf-panel); }",
      ".cl-transformer .cl-tf-head-card { padding: .75rem; overflow: hidden; }",
      ".cl-transformer .cl-tf-head-heading { display: flex; justify-content: space-between; gap: .5rem; align-items: baseline; margin-bottom: .15rem; }",
      ".cl-transformer .cl-tf-head-heading h4 { margin: 0; color: var(--cl-tf-accent); font-size: .95rem; }",
      ".cl-transformer .cl-tf-head-heading span { color: var(--cl-tf-soft); font-size: .72rem; }",
      ".cl-transformer .cl-tf-shape-line { margin: 0 0 .62rem; color: var(--cl-tf-soft); font: .72rem ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }",
      ".cl-transformer .cl-tf-matrix-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .4rem; margin-bottom: .75rem; }",
      ".cl-transformer .cl-tf-matrix-wrap { min-width: 0; }",
      ".cl-transformer .cl-tf-matrix-label { margin: 0 0 .22rem; color: var(--cl-tf-soft); font: 700 .72rem ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }",
      ".cl-transformer table { width: 100%; border-collapse: collapse; margin: 0; font-size: .68rem; table-layout: fixed; }",
      ".cl-transformer th, .cl-transformer td { border: 1px solid var(--cl-tf-border); padding: .22rem .15rem; text-align: center; vertical-align: middle; }",
      ".cl-transformer th { color: var(--cl-tf-soft); background: var(--cl-tf-bg); font-weight: 700; }",
      ".cl-transformer td { color: var(--cl-tf-fg); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }",
      ".cl-transformer .cl-tf-attention-block { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .55rem; }",
      ".cl-transformer .cl-tf-attention-title { margin: 0 0 .22rem; color: var(--cl-tf-soft); font-size: .72rem; font-weight: 700; }",
      ".cl-transformer .cl-tf-score-cell { font-size: .64rem; }",
      ".cl-transformer .cl-tf-heat-cell { background: rgba(45, 111, 159, var(--cl-tf-strength)); color: var(--cl-tf-fg); font-weight: 700; }",
      ".cl-transformer .cl-tf-heat-cell.cl-tf-row-selected { outline: 2px solid var(--cl-tf-accent); outline-offset: -2px; }",
      ".cl-transformer .cl-tf-heat-cell.cl-tf-masked { color: var(--cl-tf-soft); background: repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(120, 120, 120, .1) 4px, rgba(120, 120, 120, .1) 8px); }",
      ".cl-transformer .cl-tf-query-readout { margin-top: .7rem; padding: .5rem .55rem; border: 1px solid var(--cl-tf-border); border-radius: 8px; color: var(--cl-tf-soft); background: var(--cl-tf-bg); font-size: .76rem; }",
      ".cl-transformer .cl-tf-query-readout strong { color: var(--cl-tf-accent); }",
      ".cl-transformer .cl-tf-output-card { margin-top: .85rem; padding: .8rem; }",
      ".cl-transformer .cl-tf-output-card h4 { margin: 0 0 .45rem; color: var(--cl-tf-accent); font-size: .92rem; }",
      ".cl-transformer .cl-tf-output-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .65rem; }",
      ".cl-transformer .cl-tf-output-vector { min-width: 0; padding: .55rem; border: 1px solid var(--cl-tf-border); border-radius: 8px; background: var(--cl-tf-bg); }",
      ".cl-transformer .cl-tf-output-vector h5 { margin: 0 0 .25rem; color: var(--cl-tf-soft); font-size: .75rem; }",
      ".cl-transformer .cl-tf-vector { color: var(--cl-tf-fg); font: .78rem ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; word-break: break-word; }",
      ".cl-transformer .cl-tf-contribution { margin: .35rem 0 0; color: var(--cl-tf-soft); font-size: .7rem; line-height: 1.45; }",
      ".cl-transformer .cl-tf-boundary { margin-top: .85rem; padding: .75rem .8rem; color: var(--cl-tf-soft); font-size: .78rem; }",
      ".cl-transformer .cl-tf-boundary strong { color: var(--cl-tf-accent); }",
      ".cl-transformer .cl-tf-announce { min-height: 1.25em; margin: .7rem 0 0; color: var(--cl-tf-soft); font-size: .78rem; }",
      "@media (max-width: 850px) { .cl-transformer .cl-tf-controls, .cl-transformer .cl-tf-heads, .cl-transformer .cl-tf-output-grid { grid-template-columns: 1fr; } }",
      "@media (max-width: 560px) { .cl-transformer .cl-tf-attention-block, .cl-transformer .cl-tf-matrix-row { grid-template-columns: 1fr; } .cl-transformer .cl-tf-body { padding: .75rem; } .cl-transformer .cl-tf-controls { padding: .75rem; } }"
    ].join("\n");
    (document.head || document.documentElement).appendChild(style);
  }

  function matrixHtml(label, matrix, api) {
    var html = '<div class="cl-tf-matrix-wrap"><p class="cl-tf-matrix-label">' + label + '</p><table aria-label="' + label + '"><tbody>';
    matrix.forEach(function (row) {
      html += "<tr>";
      row.forEach(function (value) {
        html += "<td>" + formatNumber(value, 2, api) + "</td>";
      });
      html += "</tr>";
    });
    return html + "</tbody></table></div>";
  }

  function attentionTable(label, matrix, state, isScore, api) {
    var html = '<div><p class="cl-tf-attention-title">' + label + '</p><table aria-label="' + label + '"><thead><tr><th scope="col">q\\k</th>';
    TOKENS.forEach(function (token) {
      html += '<th scope="col">' + token + "</th>";
    });
    html += "</tr></thead><tbody>";
    matrix.forEach(function (row, query) {
      html += '<tr><th scope="row">' + TOKENS[query] + "</th>";
      row.forEach(function (value, key) {
        var masked = state.causal && key > query;
        var selectedRow = query === state.query;
        var strength = isScore ? 0.08 : Math.max(0.06, Math.min(0.82, value));
        var className = isScore ? "cl-tf-score-cell" : "cl-tf-heat-cell";
        if (selectedRow && !isScore) {
          className += " cl-tf-row-selected";
        }
        if (masked) {
          className += " cl-tf-masked";
        }
        var shown = masked ? "—" : formatNumber(value, isScore ? 2 : 3, api);
        var aria = TOKENS[query] + " 读取 " + TOKENS[key] + "：" + (masked ? "已屏蔽" : shown);
        html += '<td class="' + className + '" style="--cl-tf-strength:' + strength.toFixed(3) + '" aria-label="' + aria + '">' + shown + "</td>";
      });
      html += "</tr>";
    });
    return html + "</tbody></table></div>";
  }

  function vectorText(vector, api) {
    return "[" + vector.map(function (value) { return formatNumber(value, 3, api); }).join(", ") + "]";
  }

  function contributionText(weights, query, api) {
    return TOKENS.map(function (token, key) {
      var masked = weights[query][key] === 0;
      return token + " × " + (masked ? "0" : formatNumber(weights[query][key], 3, api));
    }).join("　");
  }

  function buildInterface(root) {
    root.innerHTML = [
      '<div class="cl-tf-shell">',
      '  <header class="cl-tf-header">',
      '    <p class="cl-tf-kicker">scaled dot-product attention · 固定玩具权重</p>',
      '    <h3>选择一个 query，看它如何混合 value</h3>',
      '    <p>句子是「猫 追 老鼠 它」。点击 query，比较两个头的分数、softmax 权重与输出向量。</p>',
      '  </header>',
      '  <div class="cl-tf-controls">',
      '    <fieldset class="cl-tf-fieldset">',
      '      <legend>当前 query token</legend>',
      '      <div class="cl-tf-token-buttons" role="group" aria-label="选择 query token">',
      '        <button type="button" class="cl-tf-token" data-cl-tf-query="0" aria-pressed="true">猫</button>',
      '        <button type="button" class="cl-tf-token" data-cl-tf-query="1" aria-pressed="false">追</button>',
      '        <button type="button" class="cl-tf-token" data-cl-tf-query="2" aria-pressed="false">老鼠</button>',
      '        <button type="button" class="cl-tf-token" data-cl-tf-query="3" aria-pressed="false">它</button>',
      '      </div>',
      '    </fieldset>',
      '    <fieldset class="cl-tf-fieldset">',
      '      <legend>解码约束</legend>',
      '      <label class="cl-tf-mask-label"><input type="checkbox" data-cl-tf-causal> <span><strong>开启 causal mask</strong><br>query 只能看自己与左侧 token</span></label>',
      '      <p class="cl-tf-mask-note" data-cl-tf-mask-note>关闭：这是双向 self-attention 的可视化。</p>',
      '    </fieldset>',
      '    <fieldset class="cl-tf-fieldset">',
      '      <legend>形状账本</legend>',
      '      <div class="cl-tf-shapes"><span class="cl-tf-shape">X: 4×4</span><span class="cl-tf-shape">Q,K,V: 4×2 / head</span><span class="cl-tf-shape">S,A: 4×4</span><span class="cl-tf-shape">O: 4×4</span></div>',
      '    </fieldset>',
      '  </div>',
      '  <div class="cl-tf-body">',
      '    <div class="cl-tf-heads" data-cl-tf-heads></div>',
      '    <section class="cl-tf-output-card">',
      '      <h4 data-cl-tf-output-title>当前 query 的输出混合</h4>',
      '      <div class="cl-tf-output-grid" data-cl-tf-output></div>',
      '    </section>',
      '    <div class="cl-tf-boundary"><strong>读图提醒：</strong>这些 Wᴽ、Wᴷ、Wⱽ 是手写的确定性玩具权重，不代表训练后的真实语义头。softmax 只把分数变成权重；它不会自动证明“它”一定指向“猫”。</div>',
      '    <p class="cl-tf-announce" data-cl-tf-announce aria-live="polite"></p>',
      '  </div>',
      '</div>'
    ].join("");
    return {
      queryButtons: Array.prototype.slice.call(root.querySelectorAll("[data-cl-tf-query]")),
      causal: root.querySelector("[data-cl-tf-causal]"),
      maskNote: root.querySelector("[data-cl-tf-mask-note]"),
      heads: root.querySelector("[data-cl-tf-heads]"),
      outputTitle: root.querySelector("[data-cl-tf-output-title]"),
      output: root.querySelector("[data-cl-tf-output]"),
      announce: root.querySelector("[data-cl-tf-announce]")
    };
  }

  function renderHeads(refs, state, computations, api) {
    refs.heads.innerHTML = "";
    computations.forEach(function (result, index) {
      var head = HEADS[index];
      var card = document.createElement("section");
      card.className = "cl-tf-head-card";
      card.innerHTML = [
        '<div class="cl-tf-head-heading"><h4>' + head.label + '</h4><span>' + head.note + " · toy</span></div>",
        '<p class="cl-tf-shape-line">Wᴽ,Wᴷ,Wⱽ ∈ R⁴×²　→　Q,K,V ∈ R⁴×²　→　S,A ∈ R⁴×⁴</p>',
        '<div class="cl-tf-matrix-row">',
        matrixHtml("Q [4×2]", result.q, api),
        matrixHtml("K [4×2]", result.k, api),
        matrixHtml("V [4×2]", result.v, api),
        "</div>",
        '<div class="cl-tf-attention-block">',
        attentionTable("分数 S = QKᵀ / √2", result.scores, state, true, api),
        attentionTable("权重 A = softmax(S)", result.weights, state, false, api),
        "</div>",
        '<div class="cl-tf-query-readout"><strong>' + TOKENS[state.query] + '</strong> 的本头输出 O[q] = ' + vectorText(result.outputs[state.query], api) + '<br>权重：' + contributionText(result.weights, state.query, api) + "</div>"
      ].join("");
      refs.heads.appendChild(card);
    });
  }

  function renderOutput(refs, state, computations, api) {
    var first = computations[0].outputs[state.query];
    var second = computations[1].outputs[state.query];
    var concatenated = first.concat(second);
    refs.outputTitle.textContent = "当前 query「" + TOKENS[state.query] + "」的输出混合";
    refs.output.innerHTML = [
      '<div class="cl-tf-output-vector"><h5>头 1 · O₁[q] ∈ R²</h5><div class="cl-tf-vector">' + vectorText(first, api) + '</div><p class="cl-tf-contribution">Σ A₁[q,k]V₁[k]</p></div>',
      '<div class="cl-tf-output-vector"><h5>头 2 · O₂[q] ∈ R²</h5><div class="cl-tf-vector">' + vectorText(second, api) + '</div><p class="cl-tf-contribution">Σ A₂[q,k]V₂[k]</p></div>',
      '<div class="cl-tf-output-vector"><h5>Concat · O[q] ∈ R⁴</h5><div class="cl-tf-vector">' + vectorText(concatenated, api) + '</div><p class="cl-tf-contribution">后续还会经过 Wᴼ（这里省略）</p></div>'
    ].join("");
  }

  function announce(api, refs, root, message) {
    refs.announce.textContent = message;
    if (api && typeof api.announce === "function") {
      try {
        api.announce(root, message);
      } catch (error) {
        // Announcing is optional.
      }
    }
  }

  function registerLab() {
    if (!window.CourseLearning || typeof window.CourseLearning.register !== "function") {
      return;
    }
    window.CourseLearning.register("transformer", function (root, api) {
      if (!root || !root.querySelector || typeof document === "undefined") {
        return;
      }
      root.classList.add("cl-transformer");
      installStyles();
      var state = { query: 0, causal: false };
      var refs = buildInterface(root);

      function update() {
        var computations = HEADS.map(function (head) { return headComputation(head, state.causal); });
        refs.queryButtons.forEach(function (button, index) {
          button.setAttribute("aria-pressed", index === state.query ? "true" : "false");
        });
        refs.maskNote.textContent = state.causal ? "开启：每一行的未来 key 被置为 −∞，softmax 后权重为 0。" : "关闭：这是双向 self-attention 的可视化。";
        renderHeads(refs, state, computations, api);
        renderOutput(refs, state, computations, api);
        return computations;
      }

      update();
      refs.queryButtons.forEach(function (button, index) {
        button.addEventListener("click", function () {
          state.query = index;
          update();
          announce(api, refs, root, "已选择 query「" + TOKENS[index] + "」；看橙色行如何改变输出混合。 ");
        });
      });
      refs.causal.addEventListener("change", function () {
        state.causal = refs.causal.checked;
        update();
        announce(api, refs, root, state.causal ? "因果 mask 开启：未来 token 不再能向当前 query 传值。" : "因果 mask 关闭：每个位置都能读取整行上下文。 ");
      });
    });
  }

  if (typeof window !== "undefined") {
    if (window.CourseLearning && typeof window.CourseLearning.register === "function") {
      registerLab();
    } else {
      window.addEventListener("courselearning-ready", registerLab, { once: true });
    }
  }
})();
