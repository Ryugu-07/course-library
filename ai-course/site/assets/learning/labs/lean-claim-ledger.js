(function (host) {
  "use strict";

  /*
   * Teaching cards for one question: a Lean success report is three separate
   * answers plus a risk/trust-boundary label. Cards are invented ledgers. They are not
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
      prompt: "依本課公理規則，核心是否接受證明，且只依賴 propext、Classical.choice、Quot.sound 的子集？"
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
      prompt: "這張卡片呈現哪一類問題或信任變化？"
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
      { id: "none", label: "沒有這類問題" },
      { id: "sorry", label: "sorry 或自訂 axiom" },
      { id: "weaken", label: "改弱或換掉語句" },
      { id: "redefine", label: "改掉定義" },
      { id: "native", label: "額外信任原生編譯器" },
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
      body: "英文目標是「每個自然數 n 都滿足 n+1 > n」，英文論證也在談這一句。Lean 檔案證明的是「每個自然數 n 都滿足 n+0 = n」，證明項已由核心檢查，公理符合本課限制。",
      key: { q1: "yes", q2: "no", q3: "no", q4: "weaken" },
      why: "核心誠實地接受了另一句真命題。它沒有檢查英文那一句，也沒有檢查英文論證。"
    },
    {
      id: "redefined",
      title: "丁 · 把目標關係 B 改成恆真定義",
      body: "教學假設：原本 B 的定義是一個待研究的關係。檔案把它改成恆為 True，再以 True.intro 證明新目標；核心接受且不依賴額外公理。型別看起來還在，原英文論證沒有被核對。",
      key: { q1: "yes", q2: "no", q3: "no", q4: "redefine" },
      why: "核心接受的是新定義下的定理。定義變了，語句就不是原來的目標。"
    },
    {
      id: "native",
      title: "戊 · 用 native_decide 證明一個可計算等式",
      body: "目標句就是卡片上的等式，沒有英文論文。證明策略是 native_decide。本課用 Lean 4.31.0 實測，公理清單出現該次原生計算的 _native.native_decide.ax_1_1 公理。",
      key: { q1: "no", q2: "yes", q3: "na", q4: "native" },
      why: "語句沒變，也有證明項，但它額外信任原生計算。本課第一問排除這類公理，所以選否；不表示等式為假或 native_decide 天然無效。"
    },
    {
      id: "ci-forge",
      title: "己 · 證明仍是 sorry，腳本卻寫下通過",
      body: "目標句沒改，證明仍是 sorry。評分程式以 root 跑這份 Lean，檔案裡的 #eval 在闡述階段改寫了 reward 檔。報告寫通過。沒有英文論文。",
      key: { q1: "no", q2: "yes", q3: "na", q4: "ci" },
      why: "證明仍依賴 sorryAx，不合本課完成規則。報告上的通過又由被測程式改寫，不能當作核心檢查結論。"
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
        { id: "q1", name: "依本課公理規則通過" },
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
          api.el("p", { text: "教學卡片：本課只接受標準邏輯公理，不接受 sorryAx、自訂公理或原生計算公理。先選四個答案；「不合本課規則」不等於數學命題為假。" })
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
