(function (host) {
  "use strict";

  /*
   * Teaching cards for one question: a Lean success report is three separate
   * answers plus an exploit label. Cards are invented ledgers. They are not
   * excerpts from any repository.
   *
   * q1: kernel accepted a finished proof with no sorryAx, no custom axiom,
   *     and no native-compiler axiom.
   * q2: the formal statement and the definitions it uses are the stated target.
   * q3: an accompanying English argument was checked. "na" means there is none.
   * q4: exploit id.
   */
  var QUESTIONS = [
    {
      id: "q1",
      prompt: "核心是否接受一份完成的證明，而且依賴裡沒有 sorryAx、沒有自訂 axiom、也沒有編譯器公理？"
    },
    {
      id: "q2",
      prompt: "形式化語句，以及它用到的定義，就是卡片上的目標嗎？"
    },
    {
      id: "q3",
      prompt: "若卡片另附英文論證，這次檢查有沒有核對那段英文？"
    },
    {
      id: "q4",
      prompt: "這張卡片的空子屬於哪一類？"
    }
  ];

  var ANSWERS = {
    q1: [
      { id: "yes", label: "是" },
      { id: "no", label: "否" }
    ],
    q2: [
      { id: "yes", label: "是" },
      { id: "no", label: "否" }
    ],
    q3: [
      { id: "yes", label: "是" },
      { id: "no", label: "否" },
      { id: "na", label: "不適用" }
    ],
    q4: [
      { id: "none", label: "沒有這類空子" },
      { id: "sorry", label: "sorry 或自訂 axiom" },
      { id: "weaken", label: "改弱或換掉語句" },
      { id: "redefine", label: "改掉定義" },
      { id: "native", label: "核心之外的編譯器捷徑" },
      { id: "ci", label: "改檢查腳本或環境" }
    ]
  };

  var CARDS = [
    {
      id: "and-swap",
      title: "甲 · 合取交換，證明項寫完",
      body: "目標句是「由 p ∧ q 得到 q ∧ p」。證明是 And.intro，沒有 sorry，沒有新的 axiom，沒有 native_decide。沒有另外一篇英文論文。",
      key: { q1: "yes", q2: "yes", q3: "na", q4: "none" },
      why: "這是完成的證明項。核心回答的就是卡片上的那句，沒有第二份英文可對。"
    },
    {
      id: "sorry-hole",
      title: "乙 · 同一句，證明寫 sorry",
      body: "目標句仍是「由 p ∧ q 得到 q ∧ p」。檔案能被 Lean 讀完，退出碼可以是 0，但有 warning，而且公理清單是 sorryAx。沒有英文論文。",
      key: { q1: "no", q2: "yes", q3: "na", q4: "sorry" },
      why: "語句沒被換掉，可是證明沒有做完。退出碼 0 只表示工具沒把 warning 當成錯誤。"
    },
    {
      id: "weakened",
      title: "丙 · 英文是 n+1 > n，Lean 證了 n+0 = n",
      body: "英文目標是「每個自然數 n 都滿足 n+1 > n」，英文論證也在談這一句。Lean 檔案證明的是「每個自然數 n 都滿足 n+0 = n」，證明項本身完整，沒有 sorry。",
      key: { q1: "yes", q2: "no", q3: "no", q4: "weaken" },
      why: "核心誠實地接受了另一句真命題。它沒有檢查英文那一句，也沒有檢查英文論證。"
    },
    {
      id: "redefined",
      title: "丁 · 把公理 B 改成恆真的 def",
      body: "原本 B 是一條幾何關係的 axiom。檔案把它改成 def B := 恆為 True，再用幾行證明目標。型別看起來還在，#print axioms 不再列出 B。英文幾何論證沒有被重讀。",
      key: { q1: "yes", q2: "no", q3: "no", q4: "redefine" },
      why: "核心接受的是新定義下的定理。定義變了，語句就不是原來的目標。"
    },
    {
      id: "native",
      title: "戊 · 用 native_decide 證明一個可計算等式",
      body: "目標句就是卡片上的等式，沒有英文論文。證明策略是 native_decide。在本講實測的 Lean 4.26.0 上，公理清單會出現 Lean.ofReduceBool 與 Lean.trustCompiler。",
      key: { q1: "no", q2: "yes", q3: "na", q4: "native" },
      why: "語句沒變，但這份接受多信了編譯器。它不是「只有小核心」的通過。"
    },
    {
      id: "ci-forge",
      title: "己 · 證明仍是 sorry，腳本卻寫下通過",
      body: "目標句沒改，證明仍是 sorry。評分程式以 root 跑這份 Lean，檔案裡的 #eval 在闡述階段改寫了 reward 檔。報告寫通過。沒有英文論文。",
      key: { q1: "no", q2: "yes", q3: "na", q4: "ci" },
      why: "核心並沒有接受一份完成的證明。通過二字是環境被改寫之後的報告。"
    }
  ];

  function labelOf(questionId, answerId) {
    var options = ANSWERS[questionId] || [];
    var found = options.filter(function (option) { return option.id === answerId; })[0];
    return found ? found.label : "未選";
  }

  function grade(card, given) {
    var details = QUESTIONS.map(function (question) {
      var expected = card.key[question.id];
      var actual = given[question.id] || "";
      return {
        id: question.id,
        prompt: question.prompt,
        expected: expected,
        actual: actual,
        match: actual === expected
      };
    });
    var matched = details.filter(function (detail) { return detail.match; }).length;
    return { matched: matched, total: details.length, details: details };
  }

  function validateLedger() {
    var errors = [];
    if (CARDS.length !== 6) errors.push("expected 6 cards");
    var ids = {};
    CARDS.forEach(function (card) {
      if (ids[card.id]) errors.push("duplicate " + card.id);
      ids[card.id] = true;
      QUESTIONS.forEach(function (question) {
        var answer = card.key[question.id];
        var known = (ANSWERS[question.id] || []).some(function (option) {
          return option.id === answer;
        });
        if (!known) errors.push(card.id + " " + question.id + " invalid");
      });
      if (card.key.q4 === "none" && (card.key.q1 !== "yes" || card.key.q2 !== "yes")) {
        errors.push(card.id + " clean card must pass q1 and q2");
      }
      if ((card.key.q4 === "sorry" || card.key.q4 === "native" || card.key.q4 === "ci") && card.key.q1 !== "no") {
        errors.push(card.id + " q1 should fail");
      }
      if ((card.key.q4 === "weaken" || card.key.q4 === "redefine") && card.key.q2 !== "no") {
        errors.push(card.id + " q2 should fail");
      }
      var result = grade(card, card.key);
      if (result.matched !== result.total) errors.push(card.id + " does not grade its own key");
    });
    ["and-swap", "sorry-hole", "weakened", "redefined", "native", "ci-forge"].forEach(function (id) {
      if (!ids[id]) errors.push("missing " + id);
    });
    return errors;
  }

  function buildLab(root, api) {
    var styleId = "cl-lean-claim-styles";
    if (!document.getElementById(styleId)) {
      var style = api.el("style", { id: styleId });
      style.textContent = [
        ".lean-claim { display: grid; gap: 14px; min-width: 0; }",
        ".lean-claim .lean-cards, .lean-claim .lean-actions { display: flex; flex-wrap: wrap; gap: 8px; }",
        ".lean-claim button, .lean-claim select { min-height: 44px; }",
        ".lean-claim .lean-cards button { flex: 1 1 180px; text-align: left; }",
        ".lean-claim .lean-card, .lean-claim .lean-result {",
        "  border: 1px solid var(--border); border-radius: 8px; padding: 12px; background: var(--bg); min-width: 0;",
        "}",
        ".lean-claim p, .lean-claim li { overflow-wrap: anywhere; }",
        ".lean-claim .lean-q { display: grid; gap: 6px; margin: 0 0 10px; }",
        ".lean-claim .lean-q span { font-weight: 650; }",
        ".lean-claim svg { max-width: 100%; height: auto; }",
        ".lean-claim .lean-hit { color: var(--cl-green); font-weight: 700; }",
        ".lean-claim .lean-miss { color: var(--cl-red); font-weight: 700; }"
      ].join("\n");
      document.head.appendChild(style);
    }

    var state = {
      cardId: CARDS[0].id,
      given: {},
      revealed: false
    };

    function card() {
      return CARDS.filter(function (item) { return item.id === state.cardId; })[0];
    }

    function choose(id) {
      state.cardId = id;
      state.given = {};
      state.revealed = false;
      draw();
    }

    function drawGates(result) {
      var width = 640;
      var height = 168;
      var boxes = [
        { id: "q1", name: "完成的證明項" },
        { id: "q2", name: "語句就是目標" },
        { id: "q3", name: "英文被核對" }
      ];
      var svg = api.svg("svg", {
        viewBox: "0 0 " + width + " " + height,
        role: "img",
        width: "100%",
        "aria-label": "三道關的目前判斷"
      });
      boxes.forEach(function (box, index) {
        var x = 16 + index * 208;
        var shown = state.revealed ? labelOf(box.id, result.details.filter(function (detail) {
          return detail.id === box.id;
        })[0].expected) : "？";
        svg.appendChild(api.svg("rect", {
          x: x, y: 16, width: 192, height: 120, rx: 10,
          fill: "color-mix(in srgb, currentColor 8%, transparent)",
          stroke: "currentColor",
          "stroke-width": 2
        }));
        svg.appendChild(api.svg("text", {
          x: x + 96, y: 58, "text-anchor": "middle", "font-size": 16
        }, box.name));
        svg.appendChild(api.svg("text", {
          x: x + 96, y: 98, "text-anchor": "middle", "font-size": 28
        }, shown));
      });
      return svg;
    }

    function draw() {
      var current = card();
      var result = grade(current, state.given);
      var ready = QUESTIONS.every(function (question) { return state.given[question.id]; });
      var nodes = [
        api.el("div", { className: "lean-cards", role: "group", "aria-label": "選擇教學卡片" }, CARDS.map(function (item) {
          return api.el("button", {
            type: "button",
            "aria-pressed": item.id === current.id ? "true" : "false",
            text: item.title,
            onclick: function () { choose(item.id); }
          });
        })),
        api.el("article", { className: "lean-card" }, [
          api.el("h3", { text: current.title }),
          api.el("p", { text: current.body }),
          api.el("p", { text: "這是教學卡片，不是任何倉庫裡的檔案。先選四個答案，再對答案。" })
        ]),
        drawGates(result)
      ];
      QUESTIONS.forEach(function (question) {
        var select = api.el("select", {
          "aria-label": question.prompt,
          onchange: function (event) {
            state.given[question.id] = event.target.value;
            state.revealed = false;
            draw();
          }
        }, [api.el("option", { value: "", text: "請選擇" })].concat(
          ANSWERS[question.id].map(function (option) {
            return api.el("option", {
              value: option.id,
              selected: state.given[question.id] === option.id ? "selected" : null,
              text: option.label
            });
          })
        ));
        select.value = state.given[question.id] || "";
        nodes.push(api.el("label", { className: "lean-q" }, [
          api.el("span", { text: question.prompt }),
          select
        ]));
      });
      nodes.push(api.el("div", { className: "lean-actions" }, [
        api.el("button", {
          type: "button",
          className: "cl-primary",
          text: "對答案",
          onclick: function () {
            if (!ready) {
              api.announce(root, "還有題目沒選。");
              return;
            }
            state.revealed = true;
            draw();
            api.announce(root, "對中 " + grade(card(), state.given).matched + " 題，共 4 題。");
          }
        }),
        api.el("button", {
          type: "button",
          text: "重選這一張",
          onclick: function () {
            state.given = {};
            state.revealed = false;
            draw();
          }
        })
      ]));
      if (state.revealed) {
        nodes.push(api.el("section", { className: "lean-result" }, [
          api.el("h3", { text: "對中 " + result.matched + " / " + result.total }),
          api.el("ul", {}, result.details.map(function (detail) {
            return api.el("li", {}, [
              api.el("span", {
                className: detail.match ? "lean-hit" : "lean-miss",
                text: detail.match ? "一致 " : "不一致 "
              }),
              api.el("span", {
                text: detail.prompt + " 你選了" + labelOf(detail.id, detail.actual) + "，卡片答案是" + labelOf(detail.id, detail.expected) + "。"
              })
            ]);
          })),
          api.el("p", { text: current.why })
        ]));
      }
      root.replaceChildren(api.el("div", { className: "lean-claim" }, nodes));
    }

    draw();
  }

  if (host && host.CourseLearning && typeof host.CourseLearning.register === "function") {
    host.CourseLearning.register("lean-claim-ledger", buildLab);
  }

  var exported = { CARDS: CARDS, QUESTIONS: QUESTIONS, grade: grade, validateLedger: validateLedger };
  if (typeof module !== "undefined" && module.exports) module.exports = exported;
  host.LeanClaimLedger = exported;

  if (typeof process !== "undefined" && process.argv && process.argv.indexOf("--self-check") !== -1) {
    var errors = validateLedger();
    if (errors.length) {
      console.error(errors.join("\n"));
      process.exit(1);
    }
    console.log("lean-claim-ledger self-check ok");
  }
})(typeof window !== "undefined" ? window : globalThis);
