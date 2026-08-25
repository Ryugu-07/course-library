(function (root) {
  "use strict";

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function positionAt(time) {
    return time * time;
  }

  function secantSlope(time, delta) {
    if (delta === 0) {
      throw new Error("delta must be non-zero");
    }
    return (positionAt(time + delta) - positionAt(time)) / delta;
  }

  function gradientAt(parameter, target) {
    return 2 * (parameter - target);
  }

  function lossAt(parameter, target) {
    return Math.pow(parameter - target, 2);
  }

  function gradientStep(parameter, learningRate, target) {
    return parameter - learningRate * gradientAt(parameter, target);
  }

  function gradientMode(learningRate) {
    if (learningRate <= 0.5) {
      return "monotonic";
    }
    if (learningRate <= 1) {
      return "oscillate";
    }
    return "diverge";
  }

  function softmax(scores) {
    if (!Array.isArray(scores) || scores.length === 0) {
      throw new Error("softmax needs at least one score");
    }
    var maximum = Math.max.apply(null, scores);
    var exponentials = scores.map(function (score) { return Math.exp(score - maximum); });
    var total = exponentials.reduce(function (sum, value) { return sum + value; }, 0);
    return exponentials.map(function (value) { return value / total; });
  }

  function entropy(probabilities) {
    return -probabilities.reduce(function (sum, value) {
      return value > 0 ? sum + value * Math.log(value) : sum;
    }, 0);
  }

  function attentionDistribution(scores, scaled, dimension) {
    var divisor = scaled ? Math.sqrt(dimension) : 1;
    return softmax(scores.map(function (score) { return score / divisor; }));
  }

  function causalWeights(queryIndex, masked) {
    var tokenCount = 5;
    var allowed = [];
    var scores = [];
    for (var keyIndex = 0; keyIndex < tokenCount; keyIndex += 1) {
      if (masked && keyIndex > queryIndex) {
        continue;
      }
      var score = 1.2 - Math.abs(queryIndex - keyIndex) * 0.34;
      if (queryIndex === 3 && keyIndex === 4) {
        score += 2.5;
      }
      if (queryIndex === 4 && keyIndex === 1) {
        score += 0.8;
      }
      allowed.push(keyIndex);
      scores.push(score);
    }

    var distribution = softmax(scores);
    var weights = new Array(tokenCount).fill(0);
    allowed.forEach(function (keyIndex, index) {
      weights[keyIndex] = distribution[index];
    });
    return weights;
  }

  function selfTest() {
    var checks = [];
    function check(name, condition) {
      if (!condition) {
        throw new Error("ELI18 self-test failed: " + name);
      }
      checks.push(name);
    }

    check("position function", positionAt(3) === 9);
    check("one-second secant", secantSlope(2, 1) === 5);
    check("secant approaches derivative", Math.abs(secantSlope(2, 0.001) - 4) < 0.002);
    check("gradient step follows derivative", Math.abs(gradientStep(-2, 0.2, 3)) < 1e-12);
    check("small learning rate is monotonic", gradientMode(0.2) === "monotonic");
    check("medium learning rate oscillates", gradientMode(0.7) === "oscillate");
    check("large learning rate diverges", gradientMode(1.1) === "diverge");

    var scores = [0.3, -0.4, 4.2, -0.1, -0.3, 1.1, 1.6];
    var scaled = attentionDistribution(scores, true, 4);
    var unscaled = attentionDistribution(scores, false, 4);
    check("attention sums to one", Math.abs(scaled.reduce(function (sum, value) { return sum + value; }, 0) - 1) < 1e-12);
    check("scaling prevents over-sharpening", entropy(scaled) > entropy(unscaled));
    check("causal mask blocks future", causalWeights(3, true)[4] === 0);
    check("unmasked attention can leak", causalWeights(3, false)[4] > 0.5);

    return { passed: checks.length, checks: checks };
  }

  var api = {
    clamp: clamp,
    positionAt: positionAt,
    secantSlope: secantSlope,
    gradientAt: gradientAt,
    lossAt: lossAt,
    gradientStep: gradientStep,
    gradientMode: gradientMode,
    softmax: softmax,
    entropy: entropy,
    attentionDistribution: attentionDistribution,
    causalWeights: causalWeights,
    selfTest: selfTest
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.ELI18Demo = api;

  if (typeof document === "undefined") {
    return;
  }

  var SVG_NS = "http://www.w3.org/2000/svg";

  function query(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function queryAll(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function createSvg(name, attributes) {
    var element = document.createElementNS(SVG_NS, name);
    Object.keys(attributes || {}).forEach(function (key) {
      element.setAttribute(key, String(attributes[key]));
    });
    return element;
  }

  function setActiveButtons(buttons, activeButton, selectedAttribute) {
    buttons.forEach(function (button) {
      var active = button === activeButton;
      button.classList.toggle("is-active", active);
      button.setAttribute(selectedAttribute || "aria-pressed", String(active));
    });
  }

  function formatNumber(value, digits) {
    var rounded = Number(value).toFixed(digits);
    return rounded.replace("-", "−");
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
    var trackButtons = queryAll("[data-track]");
    var panels = queryAll("[data-panel]");

    trackButtons.forEach(function (button) {
      button.tabIndex = button.classList.contains("is-active") ? 0 : -1;
      button.addEventListener("click", function () {
        var target = button.getAttribute("data-track");
        trackButtons.forEach(function (candidate) {
          var active = candidate === button;
          candidate.classList.toggle("is-active", active);
          candidate.setAttribute("aria-selected", String(active));
          candidate.tabIndex = active ? 0 : -1;
        });
        panels.forEach(function (panel) {
          var active = panel.getAttribute("data-panel") === target;
          panel.hidden = !active;
          panel.classList.toggle("is-active", active);
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
    installTabKeyboard(query(".track-switch"));

    var themeButton = query("#theme-toggle");
    function updateThemeLabel() {
      themeButton.setAttribute(
        "aria-label",
        document.documentElement.getAttribute("data-theme") === "dark" ? "切换到浅色" : "切换到深色"
      );
    }
    updateThemeLabel();
    themeButton.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      updateThemeLabel();
      try {
        localStorage.setItem("eli18-theme", next);
      } catch (error) {
        // Theme persistence is optional in privacy-restricted browsers.
      }
    });
  }

  function mountPrediction(group, getCorrectAnswer, feedbackSelector, explanations) {
    var buttons = queryAll('[data-prediction="' + group + '"]');
    var feedback = query(feedbackSelector);

    function reset(message) {
      buttons.forEach(function (button) {
        button.classList.remove("is-selected", "is-correct", "is-wrong");
      });
      feedback.textContent = message;
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var answer = button.getAttribute("data-answer");
        var correct = getCorrectAnswer();
        buttons.forEach(function (candidate) {
          candidate.classList.remove("is-selected", "is-correct", "is-wrong");
        });
        button.classList.add("is-selected", answer === correct ? "is-correct" : "is-wrong");
        feedback.textContent = answer === correct ? explanations.correct : explanations.wrong;
      });
    });
    return reset;
  }

  function mountSecant() {
    var slider = query("#delta-time");
    var output = query("#delta-time-output");
    var curve = query("#position-curve");
    var secant = query("#secant-line");
    var tangent = query("#tangent-line");
    var bracket = query("#delta-bracket");
    var fixedPoint = query("#fixed-point");
    var movingPoint = query("#moving-point");
    var fixedLabel = query("#fixed-label");
    var movingLabel = query("#moving-label");
    var deltaLabel = query("#delta-label");
    var coordinateOutput = query("#moving-coordinate");
    var slopeOutput = query("#secant-slope");
    var reading = query("#secant-reading");
    var grid = query("#secant-plot .grid-lines");
    var time0 = 2;

    function x(time) {
      return 82 + time / 5 * 608;
    }

    function y(position) {
      return 360 - position / 25 * 285;
    }

    for (var timeTick = 0; timeTick <= 5; timeTick += 1) {
      grid.appendChild(createSvg("line", { x1: x(timeTick), y1: 70, x2: x(timeTick), y2: 360 }));
      var timeText = createSvg("text", { x: x(timeTick), y: 380, "text-anchor": "middle" });
      timeText.textContent = String(timeTick);
      grid.appendChild(timeText);
    }
    for (var positionTick = 0; positionTick <= 25; positionTick += 5) {
      grid.appendChild(createSvg("line", { x1: 82, y1: y(positionTick), x2: 690, y2: y(positionTick) }));
      var positionText = createSvg("text", { x: 68, y: y(positionTick) + 4, "text-anchor": "end" });
      positionText.textContent = String(positionTick);
      grid.appendChild(positionText);
    }

    var curvePoints = [];
    for (var time = 0; time <= 5.001; time += 0.05) {
      curvePoints.push((curvePoints.length ? "L" : "M") + " " + x(time).toFixed(1) + " " + y(positionAt(time)).toFixed(1));
    }
    curve.setAttribute("d", curvePoints.join(" "));

    var tangentStart = 1;
    var tangentEnd = 4.4;
    tangent.setAttribute("x1", x(tangentStart).toFixed(1));
    tangent.setAttribute("y1", y(positionAt(time0) + 4 * (tangentStart - time0)).toFixed(1));
    tangent.setAttribute("x2", x(tangentEnd).toFixed(1));
    tangent.setAttribute("y2", y(positionAt(time0) + 4 * (tangentEnd - time0)).toFixed(1));

    function render() {
      var delta = Number(slider.value);
      var time1 = time0 + delta;
      var position0 = positionAt(time0);
      var position1 = positionAt(time1);
      var slope = secantSlope(time0, delta);
      var fixedX = x(time0);
      var fixedY = y(position0);
      var movingX = x(time1);
      var movingY = y(position1);

      output.textContent = delta.toFixed(2) + " 秒";
      coordinateOutput.textContent = "（" + time1.toFixed(2) + " s，" + position1.toFixed(2) + " m）";
      slopeOutput.textContent = slope.toFixed(2) + " m/s";
      secant.setAttribute("x1", fixedX.toFixed(1));
      secant.setAttribute("y1", fixedY.toFixed(1));
      secant.setAttribute("x2", movingX.toFixed(1));
      secant.setAttribute("y2", movingY.toFixed(1));
      fixedPoint.setAttribute("cx", fixedX.toFixed(1));
      fixedPoint.setAttribute("cy", fixedY.toFixed(1));
      movingPoint.setAttribute("cx", movingX.toFixed(1));
      movingPoint.setAttribute("cy", movingY.toFixed(1));
      fixedLabel.setAttribute("x", (fixedX - 13).toFixed(1));
      fixedLabel.setAttribute("y", (fixedY + 26).toFixed(1));
      movingLabel.setAttribute("x", (movingX + 10).toFixed(1));
      movingLabel.setAttribute("y", (movingY - 13).toFixed(1));
      movingLabel.textContent = "t=" + time1.toFixed(2);
      bracket.setAttribute("x1", fixedX.toFixed(1));
      bracket.setAttribute("x2", movingX.toFixed(1));
      bracket.setAttribute("y1", "405");
      bracket.setAttribute("y2", "405");
      deltaLabel.setAttribute("x", ((fixedX + movingX) / 2).toFixed(1));
      deltaLabel.setAttribute("y", "427");
      deltaLabel.setAttribute("text-anchor", "middle");
      deltaLabel.textContent = "Δt=" + delta.toFixed(2);

      if (delta <= 0.1) {
        reading.textContent = "割线几乎贴住切线；平均速度已经非常接近 4 m/s，但 Δt 仍然不是 0。";
      } else if (delta <= 0.5) {
        reading.textContent = "时间窗缩小后，区间平均开始逼近 2 秒处的局部变化率。";
      } else {
        reading.textContent = "这条割线仍跨越明显区间，斜率混合了这段时间里的速度变化。";
      }
    }

    slider.addEventListener("input", render);
    mountPrediction("secant", function () { return "decrease"; }, "#secant-prediction-feedback", {
      correct: "正确。对 s=t² 而言，右侧割线斜率从 6 逐渐降向 4。",
      wrong: "再看函数的弯曲方向：越往右越陡，缩短右侧区间会去掉较快的后半段。"
    });
    render();
  }

  function mountCorner() {
    var buttons = queryAll("[data-corner-side]");
    var line = query("#corner-tangent");
    var result = query("#corner-result");
    var copy = query("#corner-copy");

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var side = button.getAttribute("data-corner-side");
        setActiveButtons(buttons, button);
        if (side === "left") {
          line.setAttribute("x1", "120");
          line.setAttribute("y1", "92");
          line.setAttribute("x2", "290");
          line.setAttribute("y2", "237");
          result.textContent = "左导数 = −1";
          copy.textContent = "从负数一侧走向 0，图像一直向右下方倾斜，所以斜率是 −1。";
        } else {
          line.setAttribute("x1", "342");
          line.setAttribute("y1", "237");
          line.setAttribute("x2", "512");
          line.setAttribute("y2", "92");
          result.textContent = "右导数 = +1";
          copy.textContent = "从 0 走向正数一侧，图像向右上方倾斜，所以斜率是 +1。";
        }
      });
    });
  }

  function mountGradient() {
    var slider = query("#learning-rate");
    var rateOutput = query("#learning-rate-output");
    var curve = query("#loss-curve");
    var tangent = query("#gradient-tangent");
    var point = query("#parameter-point");
    var label = query("#parameter-label");
    var trailElement = query("#gradient-trail");
    var targetLine = query("#gradient-plot .target-line");
    var targetLabel = query("#target-label");
    var parameterOutput = query("#parameter-value");
    var gradientOutput = query("#gradient-value");
    var lossOutput = query("#loss-value");
    var statusOutput = query("#gradient-status");
    var parameter = -2;
    var target = 3;
    var trail = [parameter];

    function x(value) {
      return 82 + (value + 5) / 13 * 608;
    }

    function y(loss) {
      return 360 - clamp(loss, 0, 64) / 64 * 285;
    }

    var curvePoints = [];
    for (var value = -5; value <= 8.001; value += 0.1) {
      curvePoints.push((curvePoints.length ? "L" : "M") + " " + x(value).toFixed(1) + " " + y(lossAt(value, target)).toFixed(1));
    }
    curve.setAttribute("d", curvePoints.join(" "));
    targetLine.setAttribute("x1", x(target).toFixed(1));
    targetLine.setAttribute("x2", x(target).toFixed(1));
    targetLine.setAttribute("y1", "65");
    targetLine.setAttribute("y2", "360");
    targetLabel.setAttribute("x", (x(target) + 9).toFixed(1));
    targetLabel.setAttribute("y", "88");

    function describeMode(rate) {
      if (Math.abs(rate - 0.5) < 1e-9) {
        return "此二次函数上一步到位";
      }
      if (rate < 0.5) {
        return "单调靠近";
      }
      if (rate < 1) {
        return "震荡靠近";
      }
      if (Math.abs(rate - 1) < 1e-9) {
        return "等幅震荡，不收敛";
      }
      return "震荡发散";
    }

    function render() {
      var rate = Number(slider.value);
      var gradient = gradientAt(parameter, target);
      var loss = lossAt(parameter, target);
      var visibleParameter = clamp(parameter, -5, 8);
      var pointX = x(visibleParameter);
      var pointY = y(loss);
      rateOutput.textContent = rate.toFixed(2);
      parameterOutput.textContent = formatNumber(parameter, 3) + (parameter < -5 || parameter > 8 ? "（图外）" : "");
      gradientOutput.textContent = formatNumber(gradient, 3);
      lossOutput.textContent = formatNumber(loss, 3);
      statusOutput.textContent = describeMode(rate);
      point.setAttribute("cx", pointX.toFixed(1));
      point.setAttribute("cy", pointY.toFixed(1));
      label.setAttribute("x", (pointX + 12).toFixed(1));
      label.setAttribute("y", Math.max(55, pointY - 13).toFixed(1));
      label.textContent = "w=" + formatNumber(parameter, 2);

      var left = visibleParameter - 1.2;
      var right = visibleParameter + 1.2;
      tangent.setAttribute("x1", x(left).toFixed(1));
      tangent.setAttribute("y1", y(loss + gradient * (left - visibleParameter)).toFixed(1));
      tangent.setAttribute("x2", x(right).toFixed(1));
      tangent.setAttribute("y2", y(loss + gradient * (right - visibleParameter)).toFixed(1));

      trailElement.replaceChildren();
      trail.slice(-12).forEach(function (trailValue, index) {
        var visibleTrail = clamp(trailValue, -5, 8);
        trailElement.appendChild(createSvg("circle", {
          cx: x(visibleTrail).toFixed(1),
          cy: y(lossAt(trailValue, target)).toFixed(1),
          r: Math.max(3, 6 - index * 0.15).toFixed(1)
        }));
      });
    }

    var resetPrediction = mountPrediction("gradient", function () {
      return gradientMode(Number(slider.value));
    }, "#gradient-prediction-feedback", {
      correct: "判断正确。现在更新几步，检查轨迹是否符合预测。",
      wrong: "这个判断与当前学习率不符。试着看误差倍数 1−2α 的绝对值。"
    });

    function step(times) {
      var rate = Number(slider.value);
      for (var index = 0; index < times; index += 1) {
        parameter = gradientStep(parameter, rate, target);
        trail.push(parameter);
      }
      render();
    }

    slider.addEventListener("input", function () {
      resetPrediction("学习率变了，请重新预测。当前状态：" + describeMode(Number(slider.value)) + "。");
      render();
    });
    query("#gradient-step").addEventListener("click", function () { step(1); });
    query("#gradient-five").addEventListener("click", function () { step(5); });
    query("#gradient-reset").addEventListener("click", function () {
      parameter = -2;
      trail = [parameter];
      render();
    });
    render();
  }

  function mountAttention() {
    var tokens = ["小猫", "趴在", "毯子", "上", "因为", "它", "很暖"];
    var profiles = {
      reference: {
        position: "“它”",
        scores: [0.3, -0.4, 4.2, -0.1, -0.3, 1.1, 1.6]
      },
      agent: {
        position: "“趴在”",
        scores: [4.0, 2.7, 0.2, -0.3, -0.4, 0.5, -0.2]
      }
    };
    var mode = "reference";
    var scaled = true;
    var queryButtons = queryAll("[data-attention-query]");
    var bars = query("#attention-bars");
    var scaleButton = query("#scale-toggle");
    var positionOutput = query("#query-position");
    var topOutput = query("#top-attention");
    var entropyOutput = query("#attention-entropy");

    function render() {
      var profile = profiles[mode];
      var weights = attentionDistribution(profile.scores, scaled, 4);
      var maximum = Math.max.apply(null, weights);
      var topIndex = weights.indexOf(maximum);
      bars.replaceChildren();
      weights.forEach(function (weight, index) {
        var row = document.createElement("div");
        row.className = "attention-row" + (index === topIndex ? " is-top" : "");
        var token = document.createElement("span");
        token.textContent = tokens[index];
        var track = document.createElement("div");
        track.className = "attention-track";
        var fill = document.createElement("i");
        fill.className = "attention-fill";
        fill.style.width = (weight * 100).toFixed(1) + "%";
        track.appendChild(fill);
        var output = document.createElement("output");
        output.textContent = Math.round(weight * 100) + "%";
        row.appendChild(token);
        row.appendChild(track);
        row.appendChild(output);
        bars.appendChild(row);
      });
      positionOutput.textContent = profile.position;
      topOutput.textContent = tokens[topIndex] + " · " + Math.round(maximum * 100) + "%";
      entropyOutput.textContent = entropy(weights).toFixed(2);
      scaleButton.textContent = scaled ? "使用缩放 ÷√d" : "未缩放（用于对比）";
      scaleButton.classList.toggle("is-active", scaled);
      scaleButton.setAttribute("aria-pressed", String(scaled));
    }

    queryButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        mode = button.getAttribute("data-attention-query");
        setActiveButtons(queryButtons, button);
        render();
      });
    });
    scaleButton.addEventListener("click", function () {
      scaled = !scaled;
      render();
    });
    mountPrediction("attention", function () { return "sharper"; }, "#attention-prediction-feedback", {
      correct: "正确。更大的分数差经过指数函数后会被进一步放大，分布更尖锐。",
      wrong: "试比较 exp(1) 与 exp(4)：指数函数会放大分数差，而不是把它们压平。"
    });
    render();
  }

  function mountMask() {
    var tokens = ["今天", "下雨", "所以", "带", "雨伞"];
    var table = query("#mask-matrix");
    var positionButtons = queryAll("[data-sequence-index]");
    var toggle = query("#causal-toggle");
    var result = query("#mask-result");
    var copy = query("#mask-copy");
    var queryIndex = 3;
    var masked = true;

    function renderTable() {
      table.replaceChildren();
      var caption = document.createElement("caption");
      caption.textContent = "每一行是查询位置，每一列是它试图读取的位置";
      table.appendChild(caption);
      var head = document.createElement("thead");
      var headRow = document.createElement("tr");
      headRow.appendChild(document.createElement("th"));
      tokens.forEach(function (token) {
        var heading = document.createElement("th");
        heading.scope = "col";
        heading.textContent = token;
        headRow.appendChild(heading);
      });
      head.appendChild(headRow);
      table.appendChild(head);

      var body = document.createElement("tbody");
      tokens.forEach(function (token, rowIndex) {
        var row = document.createElement("tr");
        row.classList.toggle("is-query", rowIndex === queryIndex);
        var rowHeading = document.createElement("th");
        rowHeading.scope = "row";
        rowHeading.textContent = token;
        row.appendChild(rowHeading);
        var weights = causalWeights(rowIndex, masked);
        weights.forEach(function (weight, columnIndex) {
          var cell = document.createElement("td");
          var isMasked = masked && columnIndex > rowIndex;
          cell.classList.toggle("masked", isMasked);
          cell.style.setProperty("--cell-weight", Math.round(8 + weight * 82) + "%");
          cell.textContent = isMasked ? "遮住" : Math.round(weight * 100) + "%";
          row.appendChild(cell);
        });
        body.appendChild(row);
      });
      table.appendChild(body);
    }

    function render() {
      setActiveButtons(positionButtons, positionButtons[queryIndex]);
      toggle.classList.toggle("is-active", masked);
      toggle.setAttribute("aria-pressed", String(masked));
      toggle.textContent = masked ? "因果掩码：开启" : "因果掩码：关闭";
      if (masked) {
        result.textContent = "“" + tokens[queryIndex] + "”只能读取自己和左侧";
        copy.textContent = queryIndex === tokens.length - 1
          ? "最后一个位置没有更右侧的未来词，但训练规则仍保持一致。"
          : "右侧未来位置被写入 −∞，经过 softmax 后权重变成 0。当前位置必须只依靠已经出现的上下文。";
      } else {
        var weights = causalWeights(queryIndex, false);
        var futureWeight = weights.slice(queryIndex + 1).reduce(function (sum, value) { return sum + value; }, 0);
        result.textContent = "未来信息泄漏：" + Math.round(futureWeight * 100) + "% 权重来自右侧";
        copy.textContent = "关闭掩码后，当前位置可以直接读取尚未预测的词。训练损失会显得更低，但模型在真实生成时拿不到这些答案。";
      }
      renderTable();
    }

    positionButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        queryIndex = Number(button.getAttribute("data-sequence-index"));
        render();
      });
    });
    toggle.addEventListener("click", function () {
      masked = !masked;
      render();
    });
    render();
  }

  function mountTransformerBlocks() {
    var details = {
      embedding: {
        label: "词元与位置信息",
        title: "先把离散符号变成连续向量",
        copy: "词元嵌入提供内容特征，位置信息让模型区分先后顺序。没有位置信息时，重新排列输入会让注意力输出跟着同样排列，它自身无法知道谁先谁后。",
        formula: "H₀ = TokenEmbedding(tokens) + PositionEncoding"
      },
      attention: {
        label: "多头注意力",
        title: "并行学习多组检索规则",
        copy: "每个头拥有不同的 WQ、WK、WV，产生不同的信息混合结果；这些结果拼接后再投影回模型维度。",
        formula: "MultiHead(Q,K,V)=Concat(head₁,…,headₕ)Wₒ"
      },
      residual1: {
        label: "残差路径",
        title: "保留原信息，也让深层网络更容易训练",
        copy: "注意力输出与输入相加，使后续层既能读取新聚合的信息，也能沿近似恒等路径保留旧表示。归一化帮助控制数值尺度。",
        formula: "H′ = Norm(H + Attention(H))"
      },
      mlp: {
        label: "逐位置前馈网络",
        title: "对每个位置独立做非线性变换",
        copy: "注意力负责跨位置交换信息；MLP 在每个位置上使用相同参数扩展、激活并压回特征维度。它通常占据大量参数。",
        formula: "FFN(x)=W₂ σ(W₁x+b₁)+b₂"
      },
      residual2: {
        label: "第二条残差路径",
        title: "把局部变换叠加回主信息流",
        copy: "前馈结果再次与输入相加并归一化。许多这样的块堆叠起来，逐层改写每个词元的上下文表示。",
        formula: "H下一层 = Norm(H′ + FFN(H′))"
      }
    };
    var buttons = queryAll("[data-block]");
    var panel = query("#block-detail");

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var detail = details[button.getAttribute("data-block")];
        setActiveButtons(buttons, button);
        query(".detail-label", panel).textContent = detail.label;
        query("h3", panel).textContent = detail.title;
        query("p:not(.detail-label)", panel).textContent = detail.copy;
        query("code", panel).textContent = detail.formula;
      });
    });
  }

  function mountQuizzes() {
    var feedback = {
      "math-1": {
        correct: "正确。极限保留 h≠0，只研究 h 趋近 0 时结果趋向哪里。",
        wrong: "关键是定义域：分母为 0 时差商本身不存在。"
      },
      "math-2": {
        correct: "正确。左右变化率必须汇合到同一个有限值，导数才存在。",
        wrong: "函数值和正负号都不是关键；要比较从两侧得到的斜率极限。"
      },
      "math-3": {
        correct: "正确。方向可以对，但步长仍可能大到跨过低谷并放大误差。",
        wrong: "导数和目标没有突然改变；问题出在更新步长。"
      },
      "ai-1": {
        correct: "正确。Q 与 K 产生权重，真正被加权求和的是 V。",
        wrong: "回看 O=softmax(QKᵀ/√d)V：矩阵权重最终乘在 V 上。"
      },
      "ai-2": {
        correct: "正确。缩放控制点积分布的幅度，让 softmax 和梯度保持可用。",
        wrong: "softmax 才负责归一化；除以 √d 主要控制数值尺度。"
      },
      "ai-3": {
        correct: "正确。并行训练时答案已在右侧，必须显式阻断这条信息路径。",
        wrong: "掩码控制可见性，不改变句子长度，也不限制注意力头数量。"
      }
    };
    var completed = new Set();
    var progress = query("#course-progress");

    queryAll(".quiz").forEach(function (quiz) {
      var quizId = quiz.getAttribute("data-quiz");
      var correct = quiz.getAttribute("data-correct");
      var buttons = queryAll("[data-choice]", quiz);
      var output = query("output", quiz);

      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          var choice = button.getAttribute("data-choice");
          buttons.forEach(function (candidate) { candidate.classList.remove("is-wrong"); });
          if (choice === correct) {
            button.classList.add("is-correct");
            completed.add(quizId);
            output.textContent = feedback[quizId].correct;
          } else {
            button.classList.add("is-wrong");
            output.textContent = feedback[quizId].wrong;
          }
          progress.textContent = "理解检查 " + completed.size + " / 6";
        });
      });
    });
  }

  function mount() {
    mountNavigation();
    mountSecant();
    mountCorner();
    mountGradient();
    mountAttention();
    mountMask();
    mountTransformerBlocks();
    mountQuizzes();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
}(typeof window !== "undefined" ? window : globalThis));
