(function (root) {
  "use strict";

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function hillStep(position, rate) {
    var stepRate = rate === undefined ? 0.7 : rate;
    return 50 + (position - 50) * stepRate;
  }

  function trainStep(guess, target, rate) {
    var learningRate = rate === undefined ? 0.35 : rate;
    return guess - learningRate * (guess - target);
  }

  function softmax(logits, temperature) {
    if (!Array.isArray(logits) || logits.length === 0) {
      throw new Error("softmax needs at least one score");
    }
    if (!(temperature > 0)) {
      throw new Error("temperature must be greater than zero");
    }

    var scaled = logits.map(function (value) { return value / temperature; });
    var maximum = Math.max.apply(null, scaled);
    var exponentials = scaled.map(function (value) { return Math.exp(value - maximum); });
    var total = exponentials.reduce(function (sum, value) { return sum + value; }, 0);
    return exponentials.map(function (value) { return value / total; });
  }

  function nextRandom(seed) {
    var nextSeed = (Math.imul(seed >>> 0, 1664525) + 1013904223) >>> 0;
    return { seed: nextSeed, value: nextSeed / 4294967296 };
  }

  var attentionProfiles = {
    reference: {
      question: "“它”更像在说谁？",
      answer: "垫子",
      weights: { "小猫": 0.18, "躺在": 0.12, "垫子": 0.96, "上": 0.36, "因为": 0.44, "它": 0.78, "很暖": 0.64 }
    },
    action: {
      question: "谁在做“躺”这个动作？",
      answer: "小猫",
      weights: { "小猫": 0.98, "躺在": 0.86, "垫子": 0.38, "上": 0.18, "因为": 0.08, "它": 0.16, "很暖": 0.08 }
    }
  };

  function selfTest() {
    var checks = [];

    function check(name, condition) {
      if (!condition) {
        throw new Error("ELI5 self-test failed: " + name);
      }
      checks.push(name);
    }

    check("clamp lower bound", clamp(-2, 0, 10) === 0);
    check("clamp upper bound", clamp(15, 0, 10) === 10);
    check("hill step approaches valley", Math.abs(hillStep(10) - 50) < Math.abs(10 - 50));
    check("learning step approaches target", Math.abs(trainStep(20, 80) - 80) < 60);

    var cool = softmax([2.6, 1.1, 0.4, -0.2], 0.5);
    var warm = softmax([2.6, 1.1, 0.4, -0.2], 1.6);
    var probabilitySum = cool.reduce(function (sum, value) { return sum + value; }, 0);
    check("softmax sums to one", Math.abs(probabilitySum - 1) < 1e-12);
    check("cool temperature is more decisive", cool[0] > warm[0]);

    var random = nextRandom(7);
    check("seeded random stays in range", random.value >= 0 && random.value < 1);
    check("seeded random advances", random.seed !== 7);
    check("reference answer is the mat", attentionProfiles.reference.answer === "垫子");
    check("action answer is the cat", attentionProfiles.action.answer === "小猫");

    return { passed: checks.length, checks: checks };
  }

  var api = {
    clamp: clamp,
    hillStep: hillStep,
    trainStep: trainStep,
    softmax: softmax,
    nextRandom: nextRandom,
    attentionProfiles: attentionProfiles,
    selfTest: selfTest
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.ELI5Demo = api;

  if (typeof document === "undefined") {
    return;
  }

  function query(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function queryAll(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function setPressed(buttons, activeButton) {
    buttons.forEach(function (button) {
      var active = button === activeButton;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function installTabKeyboard(container) {
    var tabs = queryAll('[role="tab"]', container);
    tabs.forEach(function (tab, index) {
      tab.addEventListener("keydown", function (event) {
        var direction = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
        if (!direction) {
          return;
        }
        event.preventDefault();
        tabs[(index + direction + tabs.length) % tabs.length].focus();
      });
    });
  }

  function mountNavigation() {
    var depthButtons = queryAll("[data-depth-button]");
    depthButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        document.body.setAttribute("data-depth", button.getAttribute("data-depth-button"));
        setPressed(depthButtons, button);
      });
    });

    var trackButtons = queryAll("[data-track-button]");
    var trackPanels = queryAll("[data-track-panel]");
    trackButtons.forEach(function (button) {
      button.tabIndex = button.classList.contains("is-active") ? 0 : -1;
      button.addEventListener("click", function () {
        var target = button.getAttribute("data-track-button");
        trackButtons.forEach(function (candidate) {
          var active = candidate === button;
          candidate.classList.toggle("is-active", active);
          candidate.setAttribute("aria-selected", String(active));
          candidate.tabIndex = active ? 0 : -1;
        });
        trackPanels.forEach(function (panel) {
          var active = panel.getAttribute("data-track-panel") === target;
          panel.hidden = !active;
          panel.classList.toggle("is-active", active);
        });
      });
    });

    queryAll(".scene-tabs").forEach(function (tabList, tabListIndex) {
      var buttons = queryAll("[data-scene-button]", tabList);
      var coursePanel = tabList.closest(".course-panel");
      var panels = queryAll("[data-scene-panel]", coursePanel);

      buttons.forEach(function (button, buttonIndex) {
        if (!button.id) {
          button.id = "scene-tab-" + tabListIndex + "-" + buttonIndex;
        }
        var controlled = query("#" + button.getAttribute("aria-controls"));
        if (controlled) {
          controlled.setAttribute("aria-labelledby", button.id);
        }
        button.tabIndex = button.classList.contains("is-active") ? 0 : -1;

        button.addEventListener("click", function () {
          var target = button.getAttribute("data-scene-button");
          buttons.forEach(function (candidate) {
            var active = candidate === button;
            candidate.classList.toggle("is-active", active);
            candidate.setAttribute("aria-selected", String(active));
            candidate.tabIndex = active ? 0 : -1;
          });
          panels.forEach(function (panel) {
            var active = panel.getAttribute("data-scene-panel") === target;
            panel.hidden = !active;
            panel.classList.toggle("is-active", active);
          });
        });
      });
    });

    queryAll('[role="tablist"]').forEach(installTabKeyboard);

    var themeButton = query("#theme-toggle");
    themeButton.setAttribute(
      "aria-label",
      document.documentElement.getAttribute("data-theme") === "dark" ? "切换到浅色" : "切换到深色"
    );
    themeButton.addEventListener("click", function () {
      var rootElement = document.documentElement;
      var nextTheme = rootElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      rootElement.setAttribute("data-theme", nextTheme);
      themeButton.setAttribute("aria-label", nextTheme === "dark" ? "切换到浅色" : "切换到深色");
      try {
        localStorage.setItem("eli5-theme", nextTheme);
      } catch (error) {
        // Theme persistence is optional in privacy-restricted browsers.
      }
    });
  }

  function mountElevator() {
    var floor = 0;
    var car = query("#elevator-car");
    var carLabel = query("#elevator-car-label");
    var readout = query("#floor-readout");

    function render() {
      car.setAttribute("transform", "translate(0 " + (-48 * floor) + ")");
      carLabel.textContent = (floor > 0 ? "+" : "") + floor + " 层";
      readout.textContent = floor === 0 ? "大厅 · 0" : (floor > 0 ? "楼上 · +" + floor : "地下 · " + floor);
    }

    query("#floor-down").addEventListener("click", function () {
      floor = clamp(floor - 1, -3, 3);
      render();
    });
    query("#floor-up").addEventListener("click", function () {
      floor = clamp(floor + 1, -3, 3);
      render();
    });
    query("#floor-reset").addEventListener("click", function () {
      floor = 0;
      render();
    });
    render();
  }

  function mountSlope() {
    var slider = query("#slope-position");
    var ball = query("#slope-ball");
    var tangent = query("#slope-tangent");
    var arrowLine = query("#direction-arrow line");
    var arrowHead = query("#direction-arrow path");
    var readout = query("#slope-readout");

    function geometry(position) {
      var x = 72 + 5.76 * position;
      var y = 304 - 0.0864 * Math.pow(position - 50, 2);
      var slope = -0.03 * (position - 50);
      return { x: x, y: y, slope: slope };
    }

    function render() {
      var position = Number(slider.value);
      var point = geometry(position);
      var radius = 58;
      tangent.setAttribute("x1", (point.x - radius).toFixed(1));
      tangent.setAttribute("y1", (point.y - point.slope * radius).toFixed(1));
      tangent.setAttribute("x2", (point.x + radius).toFixed(1));
      tangent.setAttribute("y2", (point.y + point.slope * radius).toFixed(1));
      ball.setAttribute("transform", "translate(" + (point.x - 216).toFixed(1) + " " + (point.y - 221).toFixed(1) + ")");

      var direction = position < 48 ? 1 : position > 52 ? -1 : 0;
      var startX = point.x;
      var endX = point.x + direction * 62;
      var arrowY = Math.max(58, point.y - 53);
      arrowLine.setAttribute("x1", startX.toFixed(1));
      arrowLine.setAttribute("y1", arrowY.toFixed(1));
      arrowLine.setAttribute("x2", endX.toFixed(1));
      arrowLine.setAttribute("y2", arrowY.toFixed(1));
      if (direction === 0) {
        arrowHead.setAttribute("d", "");
      } else {
        var wing = -direction * 14;
        arrowHead.setAttribute("d", "M " + endX.toFixed(1) + " " + arrowY.toFixed(1) + " L " + (endX + wing).toFixed(1) + " " + (arrowY - 10).toFixed(1) + " M " + endX.toFixed(1) + " " + arrowY.toFixed(1) + " L " + (endX + wing).toFixed(1) + " " + (arrowY + 10).toFixed(1));
      }
      readout.textContent = position < 48 ? "左坡 · 往右下" : position > 52 ? "右坡 · 往左下" : "谷底附近";
    }

    slider.addEventListener("input", render);
    query("#slope-step").addEventListener("click", function () {
      slider.value = String(Math.round(hillStep(Number(slider.value))));
      render();
    });
    query("#slope-reset").addEventListener("click", function () {
      slider.value = "22";
      render();
    });
    render();
  }

  function mountChance() {
    var slider = query("#red-count");
    var countOutput = query("#red-count-output");
    var balls = queryAll("#chance-balls circle");
    var drawnBall = query("#drawn-ball");
    var drawnLabel = query("#drawn-label");
    var historyElement = query("#draw-history");
    var summary = query("#chance-summary");
    var history = [];

    function resetHistory() {
      history = [];
      drawnBall.setAttribute("class", "is-empty");
      drawnLabel.textContent = "还没抽";
      renderHistory();
    }

    function renderHistory() {
      var redCount = Number(slider.value);
      countOutput.textContent = redCount + " / 10";
      balls.forEach(function (ball, index) {
        ball.setAttribute("class", index < redCount ? "is-red" : "is-blue");
      });

      historyElement.replaceChildren();
      history.slice(-12).forEach(function (isRed) {
        var dot = document.createElement("span");
        dot.className = "history-dot" + (isRed ? " is-red" : "");
        dot.setAttribute("aria-label", isRed ? "红球" : "蓝球");
        historyElement.appendChild(dot);
      });

      if (!history.length) {
        summary.textContent = "理论机会：" + (redCount * 10) + "%。还没有实验记录。";
        return;
      }
      var reds = history.filter(Boolean).length;
      summary.textContent = "抽了 " + history.length + " 次：红球 " + reds + " 次，实验比例 " + Math.round(reds / history.length * 100) + "%。";
    }

    slider.addEventListener("input", resetHistory);
    query("#draw-ball").addEventListener("click", function () {
      var isRed = Math.random() < Number(slider.value) / 10;
      history.push(isRed);
      drawnBall.setAttribute("class", isRed ? "is-red" : "is-blue");
      drawnLabel.textContent = isRed ? "红球" : "蓝球";
      renderHistory();
    });
    query("#draw-reset").addEventListener("click", resetHistory);
    resetHistory();
  }

  function mountLearning() {
    var slider = query("#target-position");
    var targetOutput = query("#target-output");
    var targetMarker = query("#target-marker");
    var guessMarker = query("#guess-marker");
    var errorLine = query("#error-line");
    var errorLabel = query("#error-label");
    var trailElement = query("#learning-trail");
    var summary = query("#learning-summary");
    var guess = 25;
    var trail = [guess];

    function coordinate(value) {
      return 88 + 5.44 * value;
    }

    function format(value) {
      return Math.round(value * 10) / 10;
    }

    function render() {
      var target = Number(slider.value);
      var guessX = coordinate(guess);
      var targetX = coordinate(target);
      var error = Math.abs(target - guess);
      targetOutput.textContent = String(target);
      targetMarker.setAttribute("transform", "translate(" + (targetX - 496).toFixed(1) + " 0)");
      guessMarker.setAttribute("transform", "translate(" + (guessX - 224).toFixed(1) + " 0)");
      errorLine.setAttribute("x1", guessX.toFixed(1));
      errorLine.setAttribute("x2", targetX.toFixed(1));
      errorLabel.setAttribute("x", ((guessX + targetX) / 2).toFixed(1));
      errorLabel.textContent = "还差 " + format(error);
      summary.textContent = "猜测 " + format(guess) + "，目标 " + target + "，误差 " + format(error) + "。";

      trailElement.replaceChildren();
      trail.slice(-10).forEach(function (value, index) {
        var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", coordinate(value).toFixed(1));
        circle.setAttribute("cy", String(250 - Math.min(index, 5) * 4));
        circle.setAttribute("r", "5");
        trailElement.appendChild(circle);
      });
    }

    function learn(times) {
      var target = Number(slider.value);
      for (var index = 0; index < times; index += 1) {
        guess = trainStep(guess, target);
        trail.push(guess);
      }
      render();
    }

    slider.addEventListener("input", function () {
      trail = [guess];
      render();
    });
    query("#learn-once").addEventListener("click", function () { learn(1); });
    query("#learn-five").addEventListener("click", function () { learn(5); });
    query("#learning-reset").addEventListener("click", function () {
      guess = 25;
      slider.value = "75";
      trail = [guess];
      render();
    });
    render();
  }

  function mountAttention() {
    var tokens = queryAll("[data-token]");
    var modeButtons = queryAll("[data-attention-mode]");
    var question = query("#attention-question");
    var feedback = query("#attention-feedback");
    var mode = "reference";

    function render() {
      var profile = attentionProfiles[mode];
      question.textContent = profile.question;
      feedback.textContent = "点一个词作答。";
      tokens.forEach(function (token) {
        var weight = profile.weights[token.getAttribute("data-token")];
        token.style.setProperty("--attention-bg", Math.round(10 + weight * 45) + "%");
        token.style.setProperty("--attention-border", Math.round(15 + weight * 65) + "%");
        token.style.setProperty("--attention-lift", (-Math.round(weight * 8)) + "px");
        token.classList.remove("is-correct", "is-wrong");
        token.setAttribute("aria-label", token.textContent + "，注意力 " + Math.round(weight * 100) + "%");
      });
    }

    modeButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        mode = button.getAttribute("data-attention-mode");
        setPressed(modeButtons, button);
        render();
      });
    });

    tokens.forEach(function (token) {
      token.addEventListener("click", function () {
        var answer = token.getAttribute("data-token");
        var correct = answer === attentionProfiles[mode].answer;
        tokens.forEach(function (candidate) { candidate.classList.remove("is-correct", "is-wrong"); });
        token.classList.add(correct ? "is-correct" : "is-wrong");
        feedback.textContent = correct ? "对。这个问题下，它最相关。" : "再看看问题。亮度是模型给出的线索。";
      });
    });
    render();
  }

  function mountNextWord() {
    var words = ["雨伞", "外套", "西瓜", "枕头"];
    var logits = [2.6, 1.1, 0.4, -0.2];
    var rows = queryAll(".word-row");
    var slider = query("#temperature");
    var temperatureOutput = query("#temperature-output");
    var chosenWord = query("#chosen-word");
    var summary = query("#word-summary");
    var probabilities = [];

    function renderDistribution() {
      var temperature = Number(slider.value);
      probabilities = softmax(logits, temperature);
      temperatureOutput.textContent = temperature.toFixed(1);
      rows.forEach(function (row, index) {
        var percent = probabilities[index] * 100;
        query("i", row).style.width = percent.toFixed(1) + "%";
        query("output", row).textContent = Math.round(percent) + "%";
      });
      summary.textContent = temperature < 0.8 ? "低温：更常选最像的词。" : temperature > 1.2 ? "高温：冷门词也更有机会。" : "中等温度：稳妥中留一点变化。";
    }

    function resetChoice() {
      chosenWord.textContent = "_____";
      rows.forEach(function (row) { row.classList.remove("is-picked"); });
      renderDistribution();
    }

    slider.addEventListener("input", function () {
      rows.forEach(function (row) { row.classList.remove("is-picked"); });
      chosenWord.textContent = "_____";
      renderDistribution();
    });
    query("#pick-word").addEventListener("click", function () {
      var draw = Math.random();
      var cumulative = 0;
      var pickedIndex = probabilities.length - 1;
      for (var index = 0; index < probabilities.length; index += 1) {
        cumulative += probabilities[index];
        if (draw <= cumulative) {
          pickedIndex = index;
          break;
        }
      }
      rows.forEach(function (row, index) { row.classList.toggle("is-picked", index === pickedIndex); });
      chosenWord.textContent = words[pickedIndex];
      summary.textContent = "这次选了“" + words[pickedIndex] + "”，它当时有 " + Math.round(probabilities[pickedIndex] * 100) + "% 的机会。";
    });
    query("#word-reset").addEventListener("click", resetChoice);
    resetChoice();
  }

  function mount() {
    mountNavigation();
    mountElevator();
    mountSlope();
    mountChance();
    mountLearning();
    mountAttention();
    mountNextWord();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
}(typeof window !== "undefined" ? window : globalThis));
