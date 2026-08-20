(function (host, factory) {
  "use strict";

  var exported = factory(host);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (host && host.CourseLearning && typeof host.CourseLearning.register === "function") {
    host.CourseLearning.register("convergence-tools", exported.mount);
  }
  if (
    typeof module === "object" && module.exports &&
    typeof require === "function" && require.main === module
  ) {
    try {
      var report = exported.selfTest();
      console.log(
        "convergence-tools self-test: PASS (" + report.checks + " checks, " +
        report.sequencePresets + " sequence presets, " + report.toolCases + " tool cases)"
      );
    } catch (error) {
      console.error("convergence-tools self-test: FAIL\n" + error.stack);
      process.exitCode = 1;
    }
  }
}(
  typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : null,
  function (host) {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";
    var STYLE_ID = "cl-convergence-tools-style";
    var INSTANCE = 0;

    var SEQUENCE_PRESETS = [
      {
        id: "nested-spike",
        label: "nested rare spike",
        formula: "X_n = n I{U <= 1/n}, one common U",
        certificates: { as: "yes", probability: "yes", l1: "no", l2: "no", distribution: "delta0" },
        limit: "0",
        boundary: "a.s. convergence does not upgrade the fixed first and second moments."
      },
      {
        id: "independent-spike",
        label: "independent rare spike",
        formula: "X_n = n I{U_n <= 1/n}, independent U_n",
        certificates: { as: "no", probability: "yes", l1: "no", l2: "no", distribution: "delta0" },
        limit: "no a.s. limit",
        boundary: "The exact no-spike product tends to zero, so spikes occur infinitely often a.s."
      },
      {
        id: "scaled-rademacher",
        label: "scaled Rademacher",
        formula: "X_n = epsilon_n / sqrt(n)",
        certificates: { as: "yes", probability: "yes", l1: "yes", l2: "yes", distribution: "delta0" },
        limit: "0",
        boundary: "Here the deterministic absolute bound is stronger than any finite plot."
      },
      {
        id: "fixed-rademacher",
        label: "fixed Rademacher",
        formula: "X_n = epsilon, epsilon in {-1,+1}",
        certificates: { as: "yes", probability: "yes", l1: "yes", l2: "yes", distribution: "rademacher" },
        limit: "epsilon",
        boundary: "Convergence is to a nondegenerate random variable, not to a constant."
      },
      {
        id: "triangular-rademacher",
        label: "Rademacher triangular array",
        formula: "T_n = (epsilon_n1 + ... + epsilon_nn) / sqrt(n)",
        certificates: { as: "not-claimed", probability: "not-claimed", l1: "not-claimed", l2: "not-claimed", distribution: "normal01" },
        limit: "N(0,1) in distribution",
        boundary: "Each row is exact; the finite lattice is not a proof of the CLT and has no canonical pathwise coupling."
      }
    ];

    var COUNTEREXAMPLE_CLAIMS = [
      {
        id: "p-to-as",
        label: "依概率收敛是否自动给 a.s. 收敛？",
        answer: "independent-spike",
        answerLabel: "independent rare spike"
      },
      {
        id: "as-to-l2",
        label: "a.s. 收敛是否自动给 L2 收敛？",
        answer: "nested-spike",
        answerLabel: "nested rare spike"
      },
      {
        id: "finite-graph",
        label: "有限 n 的图是否证明一般极限定理？",
        answer: "triangular-rademacher",
        answerLabel: "triangular array"
      },
      {
        id: "slutsky-marginals",
        label: "两个非退化边缘能否直接套 Slutsky？",
        answer: "slutsky-bad",
        answerLabel: "two couplings with the same marginals"
      }
    ];

    var TOOL_CASES = [
      {
        id: "slutsky-good",
        tool: "slutsky",
        label: "Slutsky: Y_n -> 1 in probability",
        formula: "X_n = epsilon, Y_n = 1 + eta_n/n",
        expected: { condition: "constant", conclusion: "unique", boundary: "none" }
      },
      {
        id: "slutsky-bad",
        tool: "slutsky",
        label: "Slutsky boundary: both marginals nondegenerate",
        formula: "X_n = R, Y_n = R or -R",
        expected: { condition: "nonconstant", conclusion: "joint", boundary: "coupling" }
      },
      {
        id: "cmt-good",
        tool: "cmt",
        label: "CMT: continuous square at zero",
        formula: "X_n = R/n, g(x) = x^2",
        expected: { condition: "continuous", conclusion: "preserved", boundary: "none" }
      },
      {
        id: "cmt-boundary",
        tool: "cmt",
        label: "CMT boundary: inverse is discontinuous at zero",
        formula: "X_n = 1/n, g(x) = 1/x",
        expected: { condition: "discontinuous", conclusion: "not-certified", boundary: "discontinuity" }
      },
      {
        id: "delta-good",
        tool: "delta",
        label: "Delta: nonzero derivative",
        formula: "T_n = 1 + R/sqrt(n), g(x) = x^2",
        expected: { condition: "nonzero", conclusion: "sqrt", boundary: "none" }
      },
      {
        id: "delta-zero",
        tool: "delta",
        label: "Delta boundary: derivative zero",
        formula: "T_n = R/sqrt(n), g(x) = x^2",
        expected: { condition: "zero", conclusion: "second", boundary: "zero-derivative" }
      }
    ];

    var SEQUENCE_QUESTIONS = [
      {
        key: "as",
        label: "a.s. 收敛证书",
        options: [
          { value: "yes", label: "有" },
          { value: "no", label: "没有" },
          { value: "not-claimed", label: "本页不作此断言" }
        ]
      },
      {
        key: "probability",
        label: "依概率收敛证书",
        options: [
          { value: "yes", label: "有" },
          { value: "no", label: "没有" },
          { value: "not-claimed", label: "本页不作此断言" }
        ]
      },
      {
        key: "norm",
        label: "L1 / L2 证书",
        options: [
          { value: "both", label: "两者都有" },
          { value: "neither", label: "两者都没有" },
          { value: "not-claimed", label: "本页不作此断言" }
        ]
      },
      {
        key: "distribution",
        label: "依分布极限",
        options: [
          { value: "delta0", label: "delta at 0" },
          { value: "rademacher", label: "Rademacher" },
          { value: "normal01", label: "N(0,1)" },
          { value: "not-claimed", label: "本页不作此断言" }
        ]
      },
      {
        key: "counterexample",
        label: "当前反例选择器的答案",
        options: [
          { value: "nested-spike", label: "nested rare spike" },
          { value: "independent-spike", label: "independent rare spike" },
          { value: "triangular-rademacher", label: "triangular array" },
          { value: "slutsky-bad", label: "two couplings" }
        ]
      }
    ];

    var TOOL_QUESTIONS = {
      slutsky: [
        { key: "condition", label: "第二个序列需要收敛到什么？", options: [
          { value: "constant", label: "常数" }, { value: "nonconstant", label: "非退化随机变量" }
        ] },
        { key: "conclusion", label: "当前能否由边缘信息得到唯一结论？", options: [
          { value: "unique", label: "能" }, { value: "joint", label: "不能，需联合结构" }
        ] },
        { key: "boundary", label: "应记录哪一条边界？", options: [
          { value: "none", label: "条件已满足" }, { value: "coupling", label: "相依结构未给出" }
        ] }
      ],
      cmt: [
        { key: "condition", label: "g 在极限点的状态？", options: [
          { value: "continuous", label: "连续" }, { value: "discontinuous", label: "不连续" }
        ] },
        { key: "conclusion", label: "能否直接搬运依分布收敛？", options: [
          { value: "preserved", label: "能" }, { value: "not-certified", label: "不能直接认证" }
        ] },
        { key: "boundary", label: "主要边界？", options: [
          { value: "none", label: "条件已满足" }, { value: "discontinuity", label: "极限点不连续" }
        ] }
      ],
      delta: [
        { key: "condition", label: "g'(theta) 的状态？", options: [
          { value: "nonzero", label: "非零" }, { value: "zero", label: "为零" }
        ] },
        { key: "conclusion", label: "当前应先看哪一种尺度？", options: [
          { value: "sqrt", label: "sqrt(n)" }, { value: "second", label: "n 的二阶尺度" }
        ] },
        { key: "boundary", label: "主要边界？", options: [
          { value: "none", label: "一阶 Delta 可用" }, { value: "zero-derivative", label: "一阶导数消失" }
        ] }
      ]
    };

    var STYLE_TEXT = [
      ".conv-lab{--conv-blue:var(--cl-blue,#315f9d);--conv-green:var(--cl-green,#39734d);--conv-red:var(--cl-red,#b64335);--conv-gold:var(--cl-gold,#9b6a12);--conv-muted:var(--fg-soft,#666);--conv-block:var(--block-bg,var(--bg,#fff));color:var(--fg);line-height:1.5;min-width:0;overflow:hidden}",
      ".conv-lab *,.conv-lab *::before,.conv-lab *::after{box-sizing:border-box}",
      ".conv-lab h3,.conv-lab h4,.conv-lab p{margin-top:0}.conv-lab .conv-intro,.conv-lab .conv-feedback,.conv-lab .conv-note{color:var(--conv-muted);overflow-wrap:anywhere}",
      ".conv-lab .conv-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:14px 0 10px}",
      ".conv-lab button,.conv-lab select,.conv-lab input{font:inherit;letter-spacing:0}.conv-lab button,.conv-lab select{min-width:0;min-height:44px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:inherit;cursor:pointer;overflow-wrap:anywhere}.conv-lab button:hover{border-color:var(--accent)}.conv-lab button[aria-pressed=\"true\"],.conv-lab .conv-primary{background:var(--accent);border-color:var(--accent);color:var(--bg);font-weight:700}.conv-lab button:focus-visible,.conv-lab select:focus-visible,.conv-lab input:focus-visible{outline:3px solid var(--cl-focus,#1769aa);outline-offset:2px}",
      ".conv-lab .conv-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px 14px;margin:12px 0;padding:12px 14px;border-top:2px solid var(--accent);border-bottom:1px solid var(--border);background:var(--conv-block)}.conv-lab .conv-control{display:grid;gap:5px;min-width:0}.conv-lab .conv-control label{color:var(--conv-muted);font-size:13px;font-weight:700}",
      ".conv-lab .conv-gate{margin:15px 0;padding:13px 14px;border-left:3px solid var(--conv-gold);background:var(--conv-block)}.conv-lab .conv-gate h4{margin:0 0 9px;color:var(--accent)}.conv-lab .conv-question-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.conv-lab .conv-question{display:grid;gap:5px;min-width:0}.conv-lab .conv-question label{font-size:13px;font-weight:700;overflow-wrap:anywhere}.conv-lab .conv-question select{width:100%}",
      ".conv-lab .conv-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.conv-lab .conv-actions>*{flex:1 1 150px}.conv-lab .conv-feedback{min-height:1.5em;margin:9px 0 0}.conv-lab .conv-pass{color:var(--conv-green);font-weight:700}.conv-lab .conv-warn{color:var(--conv-red);font-weight:700}",
      ".conv-lab .conv-results{margin-top:16px;padding-top:14px;border-top:1px solid var(--border)}.conv-lab .conv-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:0 0 13px}.conv-lab .conv-metric{min-width:0;padding:9px;border-top:2px solid var(--border);background:var(--conv-block)}.conv-lab .conv-metric:nth-child(3n+1){border-top-color:var(--conv-blue)}.conv-lab .conv-metric:nth-child(3n+2){border-top-color:var(--conv-gold)}.conv-lab .conv-metric:nth-child(3n){border-top-color:var(--conv-green)}.conv-lab .conv-metric span{display:block;color:var(--conv-muted);font-size:11px;overflow-wrap:anywhere}.conv-lab .conv-metric strong{display:block;margin-top:3px;font-size:15px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}",
      ".conv-lab .conv-chart{min-width:0;margin:12px 0;padding:7px;border:1px solid var(--border);border-radius:6px;background:var(--bg);overflow:hidden}.conv-lab .conv-chart svg{display:block;width:100%;height:auto;max-width:100%;color:var(--fg)}.conv-lab .conv-chart svg text{fill:currentColor;font-family:inherit;letter-spacing:0}",
      ".conv-lab .conv-ledger{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:12px}.conv-lab table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}.conv-lab .conv-ledger table{min-width:760px}.conv-lab th,.conv-lab td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top;overflow-wrap:anywhere}.conv-lab th{color:var(--conv-muted);font-size:11px;font-weight:750}",
      ".conv-lab .conv-callout{margin:11px 0 0;padding:10px 12px;border-left:3px solid var(--conv-green);background:var(--conv-block);font-size:13px;line-height:1.65;overflow-wrap:anywhere}.conv-lab .conv-boundary{border-left-color:var(--conv-red)}.conv-lab [hidden]{display:none!important}",
      "@media(max-width:700px){.conv-lab .conv-controls,.conv-lab .conv-question-list{grid-template-columns:minmax(0,1fr)}}@media(max-width:430px){.conv-lab .conv-gate,.conv-lab .conv-controls{padding-left:10px;padding-right:10px}.conv-lab .conv-tabs{grid-template-columns:minmax(0,1fr)}}@media(prefers-reduced-motion:reduce){.conv-lab *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}"
    ].join("\n");

    function finite(value) {
      return typeof value === "number" && isFinite(value);
    }

    function near(left, right, tolerance) {
      var scale = Math.max(1, Math.abs(left), Math.abs(right));
      return Math.abs(left - right) <= (tolerance || 1e-10) * scale;
    }

    function integer(value, minimum, label) {
      var parsed = Number(value);
      if (!finite(parsed) || Math.floor(parsed) !== parsed || parsed < minimum) {
        throw new RangeError(label + " must be an integer >= " + minimum);
      }
      return parsed;
    }

    function findSequence(id) {
      for (var i = 0; i < SEQUENCE_PRESETS.length; i += 1) {
        if (SEQUENCE_PRESETS[i].id === id) return SEQUENCE_PRESETS[i];
      }
      throw new RangeError("unknown sequence: " + id);
    }

    function findTool(id) {
      for (var i = 0; i < TOOL_CASES.length; i += 1) {
        if (TOOL_CASES[i].id === id) return TOOL_CASES[i];
      }
      throw new RangeError("unknown tool case: " + id);
    }

    function findClaim(id) {
      for (var i = 0; i < COUNTEREXAMPLE_CLAIMS.length; i += 1) {
        if (COUNTEREXAMPLE_CLAIMS[i].id === id) return COUNTEREXAMPLE_CLAIMS[i];
      }
      throw new RangeError("unknown counterexample claim: " + id);
    }

    function choose(n, k) {
      var result = 1;
      var j;
      if (k < 0 || k > n) return 0;
      k = Math.min(k, n - k);
      for (j = 1; j <= k; j += 1) result = result * (n - k + j) / j;
      return result;
    }

    function moments(pmf) {
      var mean = 0;
      var absFirst = 0;
      var second = 0;
      var fourth = 0;
      var total = 0;
      pmf.forEach(function (entry) {
        total += entry.probability;
        mean += entry.value * entry.probability;
        absFirst += Math.abs(entry.value) * entry.probability;
        second += entry.value * entry.value * entry.probability;
        fourth += Math.pow(entry.value, 4) * entry.probability;
      });
      return { total: total, mean: mean, absFirst: absFirst, second: second, fourth: fourth };
    }

    function sequencePmf(id, n) {
      integer(n, 1, "n");
      if (id === "nested-spike" || id === "independent-spike") {
        return [{ value: 0, probability: 1 - 1 / n }, { value: n, probability: 1 / n }];
      }
      if (id === "scaled-rademacher") {
        return [{ value: -1 / Math.sqrt(n), probability: 0.5 }, { value: 1 / Math.sqrt(n), probability: 0.5 }];
      }
      if (id === "fixed-rademacher") {
        return [{ value: -1, probability: 0.5 }, { value: 1, probability: 0.5 }];
      }
      if (id === "triangular-rademacher") {
        var result = [];
        for (var sum = -n; sum <= n; sum += 2) {
          result.push({ value: sum / Math.sqrt(n), probability: choose(n, (n + sum) / 2) / Math.pow(2, n) });
        }
        return result;
      }
      throw new RangeError("unknown sequence: " + id);
    }

    function normCertificate(sequence) {
      if (sequence.certificates.l1 === "yes" && sequence.certificates.l2 === "yes") return "both";
      if (sequence.certificates.l1 === "no" && sequence.certificates.l2 === "no") return "neither";
      return "not-claimed";
    }

    function sequenceData(id, n) {
      var sequence = findSequence(id);
      var count = integer(n, 1, "n");
      var pmf = sequencePmf(id, count);
      var stats = moments(pmf);
      var tailProbability = pmf.reduce(function (sum, entry) {
        return sum + (Math.abs(entry.value) > 0.5 ? entry.probability : 0);
      }, 0);
      var noSpikeProduct = id === "independent-spike" ? 1 / count : null;
      return {
        id: id,
        label: sequence.label,
        formula: sequence.formula,
        n: count,
        pmf: pmf,
        stats: stats,
        tailProbability: tailProbability,
        noSpikeProduct: noSpikeProduct,
        certificates: sequence.certificates,
        norm: normCertificate(sequence),
        limit: sequence.limit,
        boundary: sequence.boundary
      };
    }

    function toolData(id) {
      var tool = findTool(id);
      var rows = [];
      var certificate = [];
      if (id === "slutsky-good") {
        rows = [
          { label: "P(Y_n = 1 + 1/n)", value: "1/2", note: "exact" },
          { label: "P(Y_n = 1 - 1/n)", value: "1/2", note: "exact" },
          { label: "X_n + Y_n limit", value: "R + 1", note: "Slutsky" },
          { label: "X_n Y_n limit", value: "R", note: "Slutsky" },
          { label: "X_n / Y_n limit", value: "R", note: "denominator -> 1" }
        ];
        certificate = ["Y_n -> 1 in probability", "constant limit unlocks joint convergence", "CMT applies to sum/product/quotient"];
      } else if (id === "slutsky-bad") {
        rows = [
          { label: "same coupling: X + Y", value: "-2 or +2", note: "P=1/2 each" },
          { label: "opposite coupling: X + Y", value: "0", note: "P=1" },
          { label: "same coupling: X Y", value: "1", note: "P=1" },
          { label: "opposite coupling: X Y", value: "-1", note: "P=1" }
        ];
        certificate = ["both marginals are Rademacher", "neither converges in probability to a constant", "joint coupling is missing"];
      } else if (id === "cmt-good") {
        rows = [
          { label: "P(X_n = +/-1/n)", value: "1/2, 1/2", note: "exact" },
          { label: "g(X_n) = X_n^2", value: "1/n^2", note: "exact" },
          { label: "limit", value: "0", note: "continuous g" }
        ];
        certificate = ["X_n -> 0", "g(x)=x^2 is continuous at 0", "g(X_n) -> 0 by CMT"];
      } else if (id === "cmt-boundary") {
        rows = [
          { label: "X_n", value: "1/n", note: "-> 0" },
          { label: "g(X_n) = 1/X_n", value: "n", note: "diverges" },
          { label: "g at limit", value: "undefined", note: "not continuous at 0" }
        ];
        certificate = ["X_n -> 0", "g is not defined continuously at 0", "CMT cannot certify a finite limit"];
      } else if (id === "delta-good") {
        rows = [
          { label: "T_n", value: "1 +/- 1/sqrt(n)", note: "P=1/2 each" },
          { label: "sqrt(n)(g(T_n)-g(1))", value: "2R + 1/sqrt(n)", note: "exact" },
          { label: "limit variance", value: "4", note: "g'(1)=2" }
        ];
        certificate = ["sqrt(n)(T_n-1) has exact Rademacher law", "g'(1)=2 is nonzero", "first-order Delta gives the scaled limit"];
      } else if (id === "delta-zero") {
        rows = [
          { label: "T_n", value: "+/-1/sqrt(n)", note: "P=1/2 each" },
          { label: "sqrt(n) g(T_n)", value: "1/sqrt(n)", note: "-> 0" },
          { label: "n g(T_n)", value: "1", note: "exact second-order scale" }
        ];
        certificate = ["g'(0)=0", "first-order Delta is degenerate", "the second-order scale n exposes the quadratic term"];
      }
      return {
        id: id,
        tool: tool.tool,
        label: tool.label,
        formula: tool.formula,
        rows: rows,
        certificate: certificate,
        expected: tool.expected,
        boundary: tool.expected.boundary === "none" ? "All displayed hypotheses are present for this toy." : "The displayed missing hypothesis is exactly why the shortcut stops."
      };
    }

    function counterexampleData(id) {
      var claim = findClaim(id);
      var exact = {
        "p-to-as": "For independent spikes, P(no spike from N through M)=(N-1)/M -> 0 while P(X_n != 0)=1/n -> 0.",
        "as-to-l2": "For nested spikes, X_n -> 0 a.s. but E|X_n|=1 and E[X_n^2]=n.",
        "finite-graph": "The triangular row has exact binomial masses and E[T_n^2]=1; neither finite table proves the n -> infinity theorem.",
        "slutsky-marginals": "R,R gives X+Y=2R; R,-R gives X+Y=0. The marginals match but the joint law changes."
      }[id];
      return { id: id, label: claim.label, answer: claim.answer, answerLabel: claim.answerLabel, exact: exact };
    }

    function predictionAnswers(mode, id, claimId) {
      var answers = {};
      if (mode === "sequence") {
        var data = sequenceData(id, 8);
        answers.as = data.certificates.as;
        answers.probability = data.certificates.probability;
        answers.norm = data.norm;
        answers.distribution = data.certificates.distribution;
        answers.counterexample = counterexampleData(claimId).answer;
      } else {
        var tool = toolData(id);
        answers.condition = tool.expected.condition;
        answers.conclusion = tool.expected.conclusion;
        answers.boundary = tool.expected.boundary;
      }
      return answers;
    }

    function scoreAnswers(answers, expected, questions) {
      var correct = 0;
      questions.forEach(function (question) { if (answers[question.key] === expected[question.key]) correct += 1; });
      return { correct: correct, total: questions.length };
    }

    function formatNumber(api, value, digits) {
      if (value === null || value === undefined) return "-";
      if (!finite(value)) return "-";
      if (api && typeof api.format === "function") return api.format(value, digits);
      return value.toFixed(digits === undefined ? 4 : digits).replace(/0+$/, "").replace(/\.$/, "");
    }

    function makeElement(api, doc, tag, attrs, children) {
      if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
      var node = doc.createElement(tag);
      Object.keys(attrs || {}).forEach(function (key) {
        var value = attrs[key];
        if (value === undefined || value === null || value === false) return;
        if (key === "className") node.setAttribute("class", value);
        else if (key === "text") node.textContent = value;
        else if (value === true) node.setAttribute(key, "");
        else node.setAttribute(key, String(value));
      });
      (Array.isArray(children) ? children : [children]).forEach(function (child) {
        if (child !== undefined && child !== null && child !== false) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
      });
      return node;
    }

    function makeSvg(api, doc, tag, attrs, children) {
      if (api && typeof api.svg === "function") return api.svg(tag, attrs || {}, children);
      var node = doc.createElementNS(SVG_NS, tag);
      Object.keys(attrs || {}).forEach(function (key) {
        var value = attrs[key];
        if (value !== undefined && value !== null && value !== false) node.setAttribute(key, String(value));
      });
      (Array.isArray(children) ? children : [children]).forEach(function (child) {
        if (child !== undefined && child !== null && child !== false) node.appendChild(child.nodeType ? child : doc.createTextNode(String(child)));
      });
      return node;
    }

    function clear(node) {
      while (node && node.firstChild) node.removeChild(node.firstChild);
    }

    function replaceChildren(node, children) {
      clear(node);
      (children || []).forEach(function (child) { if (child) node.appendChild(child); });
    }

    function installStyles(doc) {
      if (doc.getElementById(STYLE_ID)) return;
      var style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = STYLE_TEXT;
      (doc.head || doc.documentElement).appendChild(style);
    }

    function metric(api, label, value) {
      return makeElement(api, null, "div", { className: "conv-metric" }, [
        makeElement(api, null, "span", {}, [label]), makeElement(api, null, "strong", {}, [value])
      ]);
    }

    function svgText(api, doc, x, y, text, attrs) {
      var values = { x: x, y: y, "font-size": 11, fill: "var(--fg-soft)", "aria-hidden": "true" };
      Object.keys(attrs || {}).forEach(function (key) { values[key] = attrs[key]; });
      return makeSvg(api, doc, "text", values, [text]);
    }

    function drawSequenceChart(api, doc, data) {
      var width = 700;
      var height = 270;
      var left = 48;
      var right = 674;
      var top = 30;
      var bottom = 220;
      var maximum = data.pmf.reduce(function (value, entry) { return Math.max(value, entry.probability); }, 0);
      var minValue = data.pmf[0].value;
      var maxValue = data.pmf[data.pmf.length - 1].value;
      var span = Math.max(1, maxValue - minValue);
      var svg = makeSvg(api, doc, "svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-label": "exact finite probability mass ledger" });
      svg.appendChild(makeSvg(api, doc, "title", {}, ["exact finite probability masses"]));
      svg.appendChild(makeSvg(api, doc, "desc", {}, ["Bars show exact probabilities for the selected finite n; they are not sampled paths."]));
      svg.appendChild(makeSvg(api, doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, stroke: "currentColor", "stroke-width": 1.2 }));
      var barWidth = Math.min(42, Math.max(8, (right - left) / Math.max(4, data.pmf.length * 1.7)));
      data.pmf.forEach(function (entry, index) {
        var x = left + (right - left) * (entry.value - minValue) / span;
        if (data.pmf.length === 1) x = (left + right) / 2;
        var barHeight = (bottom - top) * entry.probability / Math.max(maximum, 1e-12);
        svg.appendChild(makeSvg(api, doc, "rect", { x: x - barWidth / 2, y: bottom - barHeight, width: barWidth, height: barHeight, fill: index % 2 ? "var(--conv-blue)" : "var(--conv-gold)", opacity: "0.82" }));
        svg.appendChild(svgText(api, doc, x, bottom + 17, formatNumber(api, entry.value, 3), { "text-anchor": "middle", "font-size": 10 }));
        svg.appendChild(svgText(api, doc, x, bottom - barHeight - 5, formatNumber(api, entry.probability, 4), { "text-anchor": "middle", "font-size": 10 }));
      });
      svg.appendChild(svgText(api, doc, left, 17, data.formula + "; n=" + data.n, { "font-size": 13, "font-weight": 700 }));
      svg.appendChild(svgText(api, doc, right, bottom + 37, "value; labels are exact", { "text-anchor": "end", "font-size": 10 }));
      return svg;
    }

    function drawToolChart(api, doc, data) {
      var width = 700;
      var height = 230;
      var svg = makeSvg(api, doc, "svg", { viewBox: "0 0 " + width + " " + height, role: "img", "aria-label": "theorem certificate flow" });
      svg.appendChild(makeSvg(api, doc, "title", {}, ["conclusion certificate"]));
      svg.appendChild(makeSvg(api, doc, "desc", {}, ["A finite toy ledger is followed by a hypothesis check and a conclusion or boundary warning."]));
      var boxes = [
        { x: 22, title: "finite toy", line: data.formula, color: "var(--conv-blue)" },
        { x: 246, title: "hypothesis", line: data.certificate[0], color: "var(--conv-gold)" },
        { x: 470, title: data.expected.boundary === "none" ? "conclusion" : "boundary", line: data.certificate[data.certificate.length - 1], color: data.expected.boundary === "none" ? "var(--conv-green)" : "var(--conv-red)" }
      ];
      boxes.forEach(function (box, index) {
        svg.appendChild(makeSvg(api, doc, "rect", { x: box.x, y: 70, width: 192, height: 78, rx: 5, fill: "var(--bg)", stroke: box.color, "stroke-width": 2 }));
        svg.appendChild(svgText(api, doc, box.x + 96, 94, box.title, { "text-anchor": "middle", "font-size": 12, "font-weight": 700 }));
        svg.appendChild(svgText(api, doc, box.x + 96, 119, box.line, { "text-anchor": "middle", "font-size": 10 }));
        if (index < boxes.length - 1) {
          svg.appendChild(makeSvg(api, doc, "line", { x1: box.x + 192, y1: 109, x2: box.x + 216, y2: 109, stroke: "currentColor", "stroke-width": 1.5 }));
          svg.appendChild(makeSvg(api, doc, "path", { d: "M" + (box.x + 211) + " 104 L" + (box.x + 218) + " 109 L" + (box.x + 211) + " 114", fill: "none", stroke: "currentColor", "stroke-width": 1.5 }));
        }
      });
      svg.appendChild(svgText(api, doc, 350, 34, data.label, { "text-anchor": "middle", "font-size": 14, "font-weight": 700 }));
      svg.appendChild(svgText(api, doc, 350, 190, "finite rows certify this toy only; theorem hypotheses carry the general result", { "text-anchor": "middle", "font-size": 10 }));
      return svg;
    }

    function renderSequenceResults(api, doc, section, data, claimData) {
      replaceChildren(section, []);
      var metrics = makeElement(api, doc, "div", { className: "conv-metrics" });
      metrics.appendChild(metric(api, "sequence", data.label));
      metrics.appendChild(metric(api, "n", String(data.n)));
      metrics.appendChild(metric(api, "E X_n", formatNumber(api, data.stats.mean, 5)));
      metrics.appendChild(metric(api, "E |X_n|", formatNumber(api, data.stats.absFirst, 5)));
      metrics.appendChild(metric(api, "E X_n^2", formatNumber(api, data.stats.second, 5)));
      metrics.appendChild(metric(api, "distribution limit", data.certificates.distribution));
      section.appendChild(metrics);
      section.appendChild(makeElement(api, doc, "div", { className: "conv-chart" }, [drawSequenceChart(api, doc, data)]));
      var ledger = makeElement(api, doc, "div", { className: "conv-ledger" });
      var table = makeElement(api, doc, "table", {});
      table.appendChild(makeElement(api, doc, "thead", {}, [makeElement(api, doc, "tr", {}, [
        makeElement(api, doc, "th", {}, ["value"]), makeElement(api, doc, "th", {}, ["exact probability"]), makeElement(api, doc, "th", {}, ["contribution to E X"]), makeElement(api, doc, "th", {}, ["contribution to E X^2"])
      ])]));
      var body = makeElement(api, doc, "tbody");
      data.pmf.forEach(function (entry) {
        body.appendChild(makeElement(api, doc, "tr", {}, [
          makeElement(api, doc, "td", {}, [formatNumber(api, entry.value, 5)]),
          makeElement(api, doc, "td", {}, [formatNumber(api, entry.probability, 8)]),
          makeElement(api, doc, "td", {}, [formatNumber(api, entry.value * entry.probability, 8)]),
          makeElement(api, doc, "td", {}, [formatNumber(api, entry.value * entry.value * entry.probability, 8)])
        ]));
      });
      table.appendChild(body);
      ledger.appendChild(table);
      section.appendChild(ledger);
      var certificateTable = makeElement(api, doc, "table", {});
      certificateTable.appendChild(makeElement(api, doc, "thead", {}, [makeElement(api, doc, "tr", {}, [makeElement(api, doc, "th", {}, ["mode"]), makeElement(api, doc, "th", {}, ["certificate"]), makeElement(api, doc, "th", {}, ["limit"])] )]));
      var certificateBody = makeElement(api, doc, "tbody");
      [["a.s.", data.certificates.as], ["in probability", data.certificates.probability], ["L1", data.certificates.l1], ["L2", data.certificates.l2], ["in distribution", data.certificates.distribution]].forEach(function (row) {
        certificateBody.appendChild(makeElement(api, doc, "tr", {}, [makeElement(api, doc, "td", {}, [row[0]]), makeElement(api, doc, "td", {}, [row[1]]), makeElement(api, doc, "td", {}, [data.limit])]));
      });
      certificateTable.appendChild(certificateBody);
      ledger.appendChild(makeElement(api, doc, "p", { className: "conv-note" }, ["Conclusion certificate"]));
      ledger.appendChild(certificateTable);
      section.appendChild(makeElement(api, doc, "p", { className: "conv-callout conv-boundary" }, [
        "Boundary: ", data.boundary, " For the independent-spike model, the finite no-spike product is exactly ", data.noSpikeProduct === null ? "not used" : formatNumber(api, data.noSpikeProduct, 6), "."
      ]));
      section.appendChild(makeElement(api, doc, "p", { className: "conv-callout" }, [
        "Counterexample selector: ", claimData.label, " Answer = ", claimData.answerLabel, ". Exact reason: ", claimData.exact
      ]));
      section.appendChild(makeElement(api, doc, "p", { className: "conv-callout" }, [
        "Migration hint: write the target mode and its hypotheses beside every asymptotic claim. A finite PMF, chart, or moment row is a certificate for this toy and this n, not a proof of a general implication."
      ]));
    }

    function renderToolResults(api, doc, section, data) {
      replaceChildren(section, []);
      var metrics = makeElement(api, doc, "div", { className: "conv-metrics" });
      metrics.appendChild(metric(api, "tool", data.tool));
      metrics.appendChild(metric(api, "case", data.label));
      metrics.appendChild(metric(api, "condition", data.expected.condition));
      metrics.appendChild(metric(api, "conclusion", data.expected.conclusion));
      section.appendChild(metrics);
      section.appendChild(makeElement(api, doc, "div", { className: "conv-chart" }, [drawToolChart(api, doc, data)]));
      var ledger = makeElement(api, doc, "div", { className: "conv-ledger" });
      var table = makeElement(api, doc, "table", {});
      table.appendChild(makeElement(api, doc, "thead", {}, [makeElement(api, doc, "tr", {}, [makeElement(api, doc, "th", {}, ["ledger item"]), makeElement(api, doc, "th", {}, ["exact value"]), makeElement(api, doc, "th", {}, ["reading"])] )]));
      var body = makeElement(api, doc, "tbody");
      data.rows.forEach(function (row) {
        body.appendChild(makeElement(api, doc, "tr", {}, [makeElement(api, doc, "td", {}, [row.label]), makeElement(api, doc, "td", {}, [row.value]), makeElement(api, doc, "td", {}, [row.note])]));
      });
      table.appendChild(body);
      ledger.appendChild(table);
      section.appendChild(ledger);
      section.appendChild(makeElement(api, doc, "p", { className: "conv-callout " + (data.expected.boundary === "none" ? "" : "conv-boundary") }, [
        "Certificate: ", data.certificate.join("; "), ". ", data.boundary
      ]));
      section.appendChild(makeElement(api, doc, "p", { className: "conv-callout" }, [
        "Migration hint: Slutsky needs a constant limit, CMT needs continuity at the limit, and first-order Delta needs a nonzero derivative plus a first-order asymptotic input."
      ]));
    }

    function mount(root, api) {
      var doc = root.ownerDocument;
      installStyles(doc);
      root.classList.add("conv-lab");
      var uid = "conv-" + (INSTANCE += 1);
      var state = {
        mode: "sequence",
        sequenceId: "nested-spike",
        n: 8,
        claimId: "p-to-as",
        toolId: "slutsky-good",
        revealed: { sequence: false, tools: false },
        prediction: { sequence: {}, tools: {} }
      };
      var modeButtons = {};
      var sequenceSelect;
      var claimSelect;
      var toolSelect;
      var nInput;
      var nOutput;
      var sequenceGate;
      var toolsGate;
      var sequenceResults;
      var toolsResults;
      var feedback;

      function announce(message) {
        if (api && typeof api.announce === "function") api.announce(root, message);
      }

      function activeQuestions(mode) {
        if (mode === "sequence") return SEQUENCE_QUESTIONS;
        return TOOL_QUESTIONS[findTool(state.toolId).tool];
      }

      function lock(mode) {
        state.revealed[mode] = false;
        state.prediction[mode] = {};
        render();
      }

      function questionNode(mode, question) {
        var id = uid + "-" + mode + "-" + question.key;
        var select = makeElement(api, doc, "select", { id: id, "aria-label": question.label });
        select.appendChild(makeElement(api, doc, "option", { value: "" }, ["请选择"]));
        question.options.forEach(function (option) {
          select.appendChild(makeElement(api, doc, "option", { value: option.value }, [option.label]));
        });
        select.addEventListener("change", function () {
          state.prediction[mode][question.key] = select.value;
          renderGate(mode);
        });
        return { node: makeElement(api, doc, "div", { className: "conv-question" }, [makeElement(api, doc, "label", { htmlFor: id }, [question.label]), select]), select: select };
      }

      var sequenceQuestionNodes = {};
      var toolQuestionNodes = {};
      SEQUENCE_QUESTIONS.forEach(function (question) { sequenceQuestionNodes[question.key] = questionNode("sequence", question); });
      function makeToolQuestions() {
        toolQuestionNodes = {};
        activeQuestions("tools").forEach(function (question) { toolQuestionNodes[question.key] = questionNode("tools", question); });
      }

      function predictionComplete(mode) {
        var questions = activeQuestions(mode);
        return questions.every(function (question) { return state.prediction[mode][question.key]; });
      }

      function renderGate(mode) {
        var questions = activeQuestions(mode);
        var nodes = mode === "sequence" ? sequenceQuestionNodes : toolQuestionNodes;
        questions.forEach(function (question) {
          if (nodes[question.key]) nodes[question.key].select.value = state.prediction[mode][question.key] || "";
        });
        if (state.revealed[mode]) {
          var expected = predictionAnswers(mode, mode === "sequence" ? state.sequenceId : state.toolId, state.claimId);
          var score = scoreAnswers(state.prediction[mode], expected, questions);
          feedback.className = "conv-feedback " + (score.correct === score.total ? "conv-pass" : "conv-warn");
          feedback.textContent = "预测得分 " + score.correct + "/" + score.total + "；现在检查证书和反例。";
        } else {
          feedback.className = "conv-feedback";
          feedback.textContent = predictionComplete(mode) ? "预测已记录，点击“提交预测并揭示”。" : "先完成当前模式的预测门。";
        }
      }

      function render() {
        modeButtons.sequence.setAttribute("aria-pressed", state.mode === "sequence" ? "true" : "false");
        modeButtons.tools.setAttribute("aria-pressed", state.mode === "tools" ? "true" : "false");
        sequenceGate.hidden = state.mode !== "sequence";
        toolsGate.hidden = state.mode !== "tools";
        sequenceResults.hidden = !state.revealed.sequence || state.mode !== "sequence";
        toolsResults.hidden = !state.revealed.tools || state.mode !== "tools";
        sequenceSelect.value = state.sequenceId;
        claimSelect.value = state.claimId;
        toolSelect.value = state.toolId;
        nInput.value = String(state.n);
        nOutput.textContent = String(state.n);
        renderGate(state.mode);
        if (state.revealed.sequence && state.mode === "sequence") {
          renderSequenceResults(api, doc, sequenceResults, sequenceData(state.sequenceId, state.n), counterexampleData(state.claimId));
        } else clear(sequenceResults);
        if (state.revealed.tools && state.mode === "tools") {
          renderToolResults(api, doc, toolsResults, toolData(state.toolId));
        } else clear(toolsResults);
      }

      var shell = makeElement(api, doc, "div", { className: "conv-shell", "aria-labelledby": uid + "-title" });
      shell.appendChild(makeElement(api, doc, "h3", { id: uid + "-title" }, ["Convergence tools: certificate and counterexample selector"]));
      shell.appendChild(makeElement(api, doc, "p", { className: "conv-intro" }, ["所有有限概率和矩由解析 PMF 直接求和；先提交预测，再打开账本。"]));
      var tabs = makeElement(api, doc, "div", { className: "conv-tabs", role: "tablist", "aria-label": "convergence lab mode" });
      modeButtons.sequence = makeElement(api, doc, "button", { type: "button", role: "tab", "aria-pressed": "true" }, ["序列 / 三角阵列"]);
      modeButtons.tools = makeElement(api, doc, "button", { type: "button", role: "tab", "aria-pressed": "false" }, ["Slutsky / CMT / Delta"]);
      tabs.appendChild(modeButtons.sequence);
      tabs.appendChild(modeButtons.tools);
      shell.appendChild(tabs);

      var sequenceControls = makeElement(api, doc, "div", { className: "conv-controls" });
      sequenceSelect = makeElement(api, doc, "select", { "aria-label": "sequence preset" });
      SEQUENCE_PRESETS.forEach(function (preset) { sequenceSelect.appendChild(makeElement(api, doc, "option", { value: preset.id }, [preset.label])); });
      sequenceSelect.addEventListener("change", function () { state.sequenceId = sequenceSelect.value; lock("sequence"); });
      claimSelect = makeElement(api, doc, "select", { "aria-label": "counterexample claim" });
      COUNTEREXAMPLE_CLAIMS.forEach(function (claim) { claimSelect.appendChild(makeElement(api, doc, "option", { value: claim.id }, [claim.label])); });
      claimSelect.addEventListener("change", function () { state.claimId = claimSelect.value; lock("sequence"); });
      nInput = makeElement(api, doc, "input", { type: "range", min: 1, max: 16, step: 1, value: state.n, "aria-label": "finite n" });
      nOutput = makeElement(api, doc, "output", {}, [String(state.n)]);
      nInput.addEventListener("input", function () { state.n = Math.max(1, Math.min(16, Math.round(Number(nInput.value)))); lock("sequence"); });
      sequenceControls.appendChild(makeElement(api, doc, "div", { className: "conv-control" }, [makeElement(api, doc, "label", {}, ["sequence preset"]), sequenceSelect]));
      sequenceControls.appendChild(makeElement(api, doc, "div", { className: "conv-control" }, [makeElement(api, doc, "label", {}, ["counterexample selector"]), claimSelect]));
      sequenceControls.appendChild(makeElement(api, doc, "div", { className: "conv-control" }, [makeElement(api, doc, "label", {}, ["finite n: ", nOutput]), nInput]));
      shell.appendChild(sequenceControls);

      var toolControls = makeElement(api, doc, "div", { className: "conv-controls", hidden: true });
      toolSelect = makeElement(api, doc, "select", { "aria-label": "tool case" });
      TOOL_CASES.forEach(function (tool) { toolSelect.appendChild(makeElement(api, doc, "option", { value: tool.id }, [tool.label])); });
      toolSelect.addEventListener("change", function () { state.toolId = toolSelect.value; state.prediction.tools = {}; state.revealed.tools = false; makeToolQuestions(); rebuildToolGate(); render(); });
      toolControls.appendChild(makeElement(api, doc, "div", { className: "conv-control" }, [makeElement(api, doc, "label", {}, ["tool case"]), toolSelect]));
      shell.appendChild(toolControls);

      function gateShell(mode, title) {
        return makeElement(api, doc, "section", { className: "conv-gate", "aria-label": title }, [makeElement(api, doc, "h4", {}, [title]), makeElement(api, doc, "div", { className: "conv-question-list" })]);
      }
      sequenceGate = gateShell("sequence", "预测门：收敛模式和反例都要先判断");
      var sequenceList = sequenceGate.querySelector(".conv-question-list");
      SEQUENCE_QUESTIONS.forEach(function (question) { sequenceList.appendChild(sequenceQuestionNodes[question.key].node); });
      toolsGate = gateShell("tools", "预测门：先写下定理条件和可得结论");
      var toolsList = toolsGate.querySelector(".conv-question-list");
      makeToolQuestions();
      activeQuestions("tools").forEach(function (question) { toolsList.appendChild(toolQuestionNodes[question.key].node); });
      var actions = makeElement(api, doc, "div", { className: "conv-actions" });
      var submit = makeElement(api, doc, "button", { type: "button", className: "conv-primary" }, ["提交预测并揭示"]);
      var reset = makeElement(api, doc, "button", { type: "button" }, ["重置"]);
      actions.appendChild(submit);
      actions.appendChild(reset);
      sequenceGate.appendChild(actions);
      var toolActions = makeElement(api, doc, "div", { className: "conv-actions" });
      var toolSubmit = makeElement(api, doc, "button", { type: "button", className: "conv-primary" }, ["提交预测并揭示"]);
      var toolReset = makeElement(api, doc, "button", { type: "button" }, ["重置"]);
      toolActions.appendChild(toolSubmit);
      toolActions.appendChild(toolReset);
      toolsGate.appendChild(toolActions);
      shell.appendChild(sequenceGate);
      shell.appendChild(toolsGate);
      feedback = makeElement(api, doc, "p", { className: "conv-feedback", "aria-live": "polite" }, ["先完成当前模式的预测门。"]);
      shell.appendChild(feedback);
      sequenceResults = makeElement(api, doc, "section", { className: "conv-results", hidden: true, "aria-label": "sequence certificate ledger" });
      toolsResults = makeElement(api, doc, "section", { className: "conv-results", hidden: true, "aria-label": "theorem certificate ledger" });
      shell.appendChild(sequenceResults);
      shell.appendChild(toolsResults);
      root.replaceChildren(shell);

      function rebuildToolGate() {
        var list = toolsGate.querySelector(".conv-question-list");
        replaceChildren(list, []);
        makeToolQuestions();
        activeQuestions("tools").forEach(function (question) { list.appendChild(toolQuestionNodes[question.key].node); });
      }

      function setMode(mode) {
        state.mode = mode;
        sequenceControls.hidden = mode !== "sequence";
        toolControls.hidden = mode !== "tools";
        render();
      }
      modeButtons.sequence.addEventListener("click", function () { setMode("sequence"); });
      modeButtons.tools.addEventListener("click", function () { setMode("tools"); });
      function submitCurrent() {
        if (!predictionComplete(state.mode)) {
          feedback.className = "conv-feedback conv-warn";
          feedback.textContent = "还缺判断；当前模式的问题必须全部填写。";
          announce(feedback.textContent);
          return;
        }
        state.revealed[state.mode] = true;
        render();
        announce("证书账本已揭示。");
      }
      function resetLab() {
        state.mode = "sequence";
        state.sequenceId = "nested-spike";
        state.n = 8;
        state.claimId = "p-to-as";
        state.toolId = "slutsky-good";
        state.revealed = { sequence: false, tools: false };
        state.prediction = { sequence: {}, tools: {} };
        rebuildToolGate();
        setMode("sequence");
        announce("已重置序列、反例选择器和预测。");
      }
      submit.addEventListener("click", submitCurrent);
      toolSubmit.addEventListener("click", submitCurrent);
      reset.addEventListener("click", resetLab);
      toolReset.addEventListener("click", resetLab);
      render();
    }

    function selfTest() {
      var checks = 0;
      function assert(condition, message) {
        checks += 1;
        if (!condition) throw new Error(message);
      }
      function close(left, right, message, tolerance) {
        assert(near(left, right, tolerance || 1e-9), message + ": " + left + " vs " + right);
      }

      assert(SEQUENCE_PRESETS.length === 5, "sequence coverage");
      ["nested-spike", "independent-spike", "scaled-rademacher", "fixed-rademacher", "triangular-rademacher"].forEach(function (id) {
        var data = sequenceData(id, 8);
        close(data.stats.total, 1, id + " total probability");
        close(data.stats.mean, id === "nested-spike" || id === "independent-spike" ? 1 : 0, id + " exact mean");
      });
      var nested = sequenceData("nested-spike", 8);
      close(nested.stats.absFirst, 1, "nested spike L1 identity");
      close(nested.stats.second, 8, "nested spike L2 square identity");
      assert(nested.certificates.as === "yes" && nested.certificates.l1 === "no", "nested spike certificates");
      var independent = sequenceData("independent-spike", 8);
      close(independent.noSpikeProduct, 1 / 8, "independent no-spike product endpoint");
      assert(independent.certificates.as === "no" && independent.certificates.probability === "yes", "independent spike certificates");
      var scaled = sequenceData("scaled-rademacher", 4);
      close(scaled.stats.second, 0.25, "scaled Rademacher second moment");
      close(scaled.stats.absFirst, 0.5, "scaled Rademacher L1 moment");
      var fixed = sequenceData("fixed-rademacher", 1);
      close(fixed.stats.second, 1, "fixed Rademacher second moment");
      var triangular = sequenceData("triangular-rademacher", 4);
      close(triangular.stats.total, 1, "triangular row total");
      close(triangular.stats.second, 1, "triangular row variance");
      close(triangular.stats.fourth, 2.5, "triangular row fourth moment 3-2/n");
      assert(triangular.pmf.length === 5, "triangular endpoint support");
      assert(predictionAnswers("sequence", "independent-spike", "p-to-as").counterexample === "independent-spike", "counterexample prediction answer");
      assert(predictionAnswers("sequence", "nested-spike", "as-to-l2").counterexample === "nested-spike", "a.s. to L2 prediction answer");

      var goodSlutsky = toolData("slutsky-good");
      assert(goodSlutsky.expected.condition === "constant" && goodSlutsky.expected.conclusion === "unique", "Slutsky good certificate");
      var badSlutsky = toolData("slutsky-bad");
      assert(badSlutsky.rows[0].value !== badSlutsky.rows[1].value, "Slutsky coupling counterexample differs");
      var cmt = toolData("cmt-boundary");
      assert(cmt.expected.condition === "discontinuous" && cmt.expected.conclusion === "not-certified", "CMT boundary certificate");
      var delta = toolData("delta-zero");
      assert(delta.expected.condition === "zero" && delta.expected.conclusion === "second", "zero derivative Delta certificate");
      close(1 / Math.sqrt(4), 0.5, "sqrt scale endpoint");
      assert(predictionAnswers("tools", "delta-good").condition === "nonzero", "Delta prediction answer");
      assert(counterexampleData("finite-graph").answer === "triangular-rademacher", "finite graph counterexample");
      var threw = false;
      try { sequenceData("missing", 4); } catch (error) { threw = true; }
      assert(threw, "unknown sequence rejected");
      threw = false;
      try { sequenceData("nested-spike", 0); } catch (error) { threw = true; }
      assert(threw, "zero n rejected");
      threw = false;
      try { toolData("missing"); } catch (error) { threw = true; }
      assert(threw, "unknown tool rejected");
      threw = false;
      try { counterexampleData("missing"); } catch (error) { threw = true; }
      assert(threw, "unknown claim rejected");
      return { checks: checks, sequencePresets: SEQUENCE_PRESETS.length, toolCases: TOOL_CASES.length };
    }

    return {
      SEQUENCE_PRESETS: SEQUENCE_PRESETS,
      TOOL_CASES: TOOL_CASES,
      COUNTEREXAMPLE_CLAIMS: COUNTEREXAMPLE_CLAIMS,
      sequencePmf: sequencePmf,
      sequenceData: sequenceData,
      toolData: toolData,
      counterexampleData: counterexampleData,
      predictionAnswers: predictionAnswers,
      mount: mount,
      selfTest: selfTest
    };
  }
));
