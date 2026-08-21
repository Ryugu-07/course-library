(function (root, factory) {
  "use strict";

  var exported = factory(root);
  if (typeof module === "object" && module.exports) module.exports = exported;
  if (root && root.CourseLearning && typeof root.CourseLearning.register === "function") {
    root.CourseLearning.register("black-scholes-hedge", exported.mount);
  }
  if (typeof module === "object" && module.exports && typeof require === "function" && require.main === module) {
    try {
      var report = exported.selfTest();
      process.stdout.write("black-scholes-hedge self-test: PASS (" + report.checks + " checks)" + String.fromCharCode(10));
    } catch (error) {
      process.stderr.write("black-scholes-hedge self-test: FAIL" + String.fromCharCode(10) + error.stack + String.fromCharCode(10));
      process.exitCode = 1;
    }
  }
})(typeof window !== "undefined" ? window : null, function (root) {
  "use strict";

  var DEFAULTS = {
    S0: 100,
    K: 100,
    r: 0.05,
    sigma: 0.2,
    T: 1,
    mu: 0.08,
    steps: 12,
    seed: 43017
  };
  var PRESETS = [
    { id: "baseline", label: "基准：12 次调仓", S0: 100, K: 100, r: 0.05, sigma: 0.2, T: 1, mu: 0.08, steps: 12, seed: 43017 },
    { id: "fine", label: "细分：32 次调仓", S0: 100, K: 100, r: 0.05, sigma: 0.2, T: 1, mu: 0.08, steps: 32, seed: 43017 },
    { id: "stress", label: "压力：高波动", S0: 100, K: 100, r: 0.03, sigma: 0.45, T: 1, mu: 0.03, steps: 12, seed: 43017 },
    { id: "zero-vol", label: "边界：sigma=0", S0: 100, K: 105, r: 0.04, sigma: 0, T: 1, mu: 0.04, steps: 12, seed: 43017 }
  ];
  var PRESET_FIELDS = ["S0", "K", "r", "sigma", "T", "mu", "steps"];
  var SQRT_TWO_PI = Math.sqrt(2 * Math.PI);
  var SERIAL = 0;

  function finite(value) {
    return Number.isFinite(value);
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function numberOr(value, fallback) {
    return finite(Number(value)) ? Number(value) : fallback;
  }

  function normalizeConfig(input) {
    var source = input || {};
    return {
      S0: clamp(numberOr(source.S0, DEFAULTS.S0), 1, 250),
      K: clamp(numberOr(source.K, DEFAULTS.K), 1, 250),
      r: clamp(numberOr(source.r, DEFAULTS.r), -0.05, 0.2),
      sigma: clamp(numberOr(source.sigma, DEFAULTS.sigma), 0, 0.8),
      T: clamp(numberOr(source.T, DEFAULTS.T), 0, 3),
      mu: clamp(numberOr(source.mu, DEFAULTS.mu), -0.2, 0.3),
      steps: Math.round(clamp(numberOr(source.steps, DEFAULTS.steps), 1, 48)),
      seed: Math.floor(Math.abs(numberOr(source.seed, DEFAULTS.seed))) >>> 0
    };
  }

  function erf(value) {
    var sign = value < 0 ? -1 : 1;
    var x = Math.abs(value);
    var t = 1 / (1 + 0.3275911 * x);
    var polynomial = (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
    return sign * (1 - polynomial * Math.exp(-x * x));
  }

  function normalCdf(value) {
    if (value === Infinity) return 1;
    if (value === -Infinity) return 0;
    return 0.5 * (1 + erf(value / Math.sqrt(2)));
  }

  function normalPdf(value) {
    return Math.exp(-0.5 * value * value) / SQRT_TWO_PI;
  }

  function kinkDelta(value) {
    if (value > 0) return 1;
    if (value < 0) return 0;
    return 0.5;
  }

  function greekMeta(status, value, reason, details) {
    var metadata = { status: status, value: value };
    if (reason) metadata.reason = reason;
    if (details) {
      Object.keys(details).forEach(function (key) { metadata[key] = details[key]; });
    }
    return metadata;
  }

  function availableGreekMetadata(greeks) {
    return Object.keys(greeks).reduce(function (metadata, key) {
      metadata[key] = greekMeta("available", greeks[key]);
      return metadata;
    }, {});
  }

  function samePresetConfig(left, right) {
    return PRESET_FIELDS.every(function (key) { return left[key] === right[key]; });
  }

  function boundaryResult(S, K, r, sigma, T) {
    if (T === 0) {
      var terminalDifference = S - K;
      var terminalDelta = kinkDelta(terminalDifference);
      var terminalAtm = Math.abs(terminalDifference) < 1e-12;
      var callThetaAtMaturity = terminalDifference > 0 ? -r * K : terminalDifference < 0 ? 0 : null;
      var putThetaAtMaturity = terminalDifference < 0 ? r * K : terminalDifference > 0 ? 0 : null;
      var callGreeksAtMaturity = {
        delta: terminalDelta,
        gamma: terminalAtm ? null : 0,
        vega: terminalAtm ? null : 0,
        theta: callThetaAtMaturity,
        rho: 0
      };
      var putGreeksAtMaturity = {
        delta: terminalDelta - 1,
        gamma: terminalAtm ? null : 0,
        vega: terminalAtm ? null : 0,
        theta: putThetaAtMaturity,
        rho: 0
      };
      return {
        status: "maturity-boundary",
        boundary: terminalAtm
          ? "T=0 payoff boundary at S=K: delta uses a midpoint display convention; gamma, vega and theta are unavailable"
          : "T=0 payoff boundary: theta is a one-sided tau downarrow 0 limit; gamma and vega are ordinary zero away from the kink",
        d1: null,
        d2: null,
        call: Math.max(terminalDifference, 0),
        put: Math.max(-terminalDifference, 0),
        greeks: { call: callGreeksAtMaturity, put: putGreeksAtMaturity },
        greekMetadata: {
          call: {
            delta: terminalAtm
              ? greekMeta("one-sided", terminalDelta, "payoff kink; displayed midpoint is a convention", { left: 0, right: 1, convention: "midpoint" })
              : greekMeta("available", terminalDelta),
            gamma: terminalAtm
              ? greekMeta("unavailable", null, "payoff kink has no ordinary finite gamma")
              : greekMeta("available", 0),
            vega: terminalAtm
              ? greekMeta("unavailable", null, "volatility sensitivity is not a regular finite Greek at the terminal kink")
              : greekMeta("available", 0),
            theta: terminalAtm
              ? greekMeta("unavailable", null, "theta has no finite two-sided value at the terminal kink")
              : greekMeta("one-sided", callThetaAtMaturity, "only the pre-maturity tau downarrow 0 side is defined"),
            rho: greekMeta("available", 0)
          },
          put: {
            delta: terminalAtm
              ? greekMeta("one-sided", terminalDelta - 1, "payoff kink; displayed midpoint is a convention", { left: -1, right: 0, convention: "midpoint" })
              : greekMeta("available", terminalDelta - 1),
            gamma: terminalAtm
              ? greekMeta("unavailable", null, "payoff kink has no ordinary finite gamma")
              : greekMeta("available", 0),
            vega: terminalAtm
              ? greekMeta("unavailable", null, "volatility sensitivity is not a regular finite Greek at the terminal kink")
              : greekMeta("available", 0),
            theta: terminalAtm
              ? greekMeta("unavailable", null, "theta has no finite two-sided value at the terminal kink")
              : greekMeta("one-sided", putThetaAtMaturity, "only the pre-maturity tau downarrow 0 side is defined"),
            rho: greekMeta("available", 0)
          }
        }
      };
    }
    if (sigma === 0) {
      var discountedStrike = K * Math.exp(-r * T);
      var forwardDifference = S - discountedStrike;
      var deterministicDelta = kinkDelta(forwardDifference);
      var forwardAtm = Math.abs(forwardDifference) < 1e-12;
      var callTheta = Math.abs(forwardDifference) < 1e-12 ? 0 : forwardDifference > 0 ? -r * discountedStrike : 0;
      var putTheta = Math.abs(forwardDifference) < 1e-12 ? 0 : forwardDifference < 0 ? r * discountedStrike : 0;
      var forwardAtmVega = S * normalPdf(0) * Math.sqrt(T);
      var callGreeksAtZeroVol = {
        delta: deterministicDelta,
        gamma: forwardAtm ? null : 0,
        vega: forwardAtm ? forwardAtmVega : 0,
        theta: forwardAtm ? null : callTheta,
        rho: forwardAtm ? null : T * discountedStrike * (forwardDifference > 0 ? 1 : 0)
      };
      var putGreeksAtZeroVol = {
        delta: deterministicDelta - 1,
        gamma: forwardAtm ? null : 0,
        vega: forwardAtm ? forwardAtmVega : 0,
        theta: forwardAtm ? null : putTheta,
        rho: forwardAtm ? null : -T * discountedStrike * (forwardDifference < 0 ? 1 : 0)
      };
      return {
        status: "zero-volatility-boundary",
        boundary: forwardAtm
          ? "sigma=0 forward-ATM: delta is one-sided, vega is a sigma downarrow 0 one-sided value, and gamma/theta/rho are unavailable"
          : "sigma=0: deterministic discounted intrinsic value; delta, gamma and vega are regular away from the forward kink",
        d1: null,
        d2: null,
        call: Math.max(forwardDifference, 0),
        put: Math.max(-forwardDifference, 0),
        greeks: { call: callGreeksAtZeroVol, put: putGreeksAtZeroVol },
        greekMetadata: {
          call: {
            delta: forwardAtm
              ? greekMeta("one-sided", deterministicDelta, "forward payoff kink; displayed midpoint is a convention", { left: 0, right: 1, convention: "midpoint" })
              : greekMeta("available", deterministicDelta),
            gamma: forwardAtm
              ? greekMeta("unavailable", null, "discounted-intrinsic kink has no ordinary finite gamma")
              : greekMeta("available", 0),
            vega: forwardAtm
              ? greekMeta("one-sided", forwardAtmVega, "volatility is constrained to sigma >= 0; this is the right derivative")
              : greekMeta("available", 0),
            theta: forwardAtm
              ? greekMeta("unavailable", null, "discounted-intrinsic kink has no finite two-sided theta")
              : greekMeta("available", callTheta),
            rho: forwardAtm
              ? greekMeta("unavailable", null, "discounted-intrinsic kink has no finite two-sided rho")
              : greekMeta("available", callGreeksAtZeroVol.rho)
          },
          put: {
            delta: forwardAtm
              ? greekMeta("one-sided", deterministicDelta - 1, "forward payoff kink; displayed midpoint is a convention", { left: -1, right: 0, convention: "midpoint" })
              : greekMeta("available", deterministicDelta - 1),
            gamma: forwardAtm
              ? greekMeta("unavailable", null, "discounted-intrinsic kink has no ordinary finite gamma")
              : greekMeta("available", 0),
            vega: forwardAtm
              ? greekMeta("one-sided", forwardAtmVega, "volatility is constrained to sigma >= 0; this is the right derivative")
              : greekMeta("available", 0),
            theta: forwardAtm
              ? greekMeta("unavailable", null, "discounted-intrinsic kink has no finite two-sided theta")
              : greekMeta("available", putTheta),
            rho: forwardAtm
              ? greekMeta("unavailable", null, "discounted-intrinsic kink has no finite two-sided rho")
              : greekMeta("available", putGreeksAtZeroVol.rho)
          }
        }
      };
    }
    return null;
  }

  function blackScholes(S, K, r, sigma, T) {
    S = Math.max(0, numberOr(S, DEFAULTS.S0));
    K = Math.max(1e-12, numberOr(K, DEFAULTS.K));
    r = numberOr(r, DEFAULTS.r);
    sigma = Math.max(0, numberOr(sigma, DEFAULTS.sigma));
    T = Math.max(0, numberOr(T, DEFAULTS.T));
    var boundary = boundaryResult(S, K, r, sigma, T);
    var result;
    if (boundary) {
      result = boundary;
    } else if (S === 0) {
      var discounted = K * Math.exp(-r * T);
      result = {
        status: "zero-spot-boundary",
        boundary: "S=0: the call is worthless and the put is the discounted strike",
        d1: -Infinity,
        d2: -Infinity,
        call: 0,
        put: discounted,
        greeks: {
          call: { delta: 0, gamma: 0, vega: 0, theta: 0, rho: 0 },
          put: { delta: -1, gamma: 0, vega: 0, theta: r * discounted, rho: -T * discounted }
        }
      };
    } else {
      var rootT = Math.sqrt(T);
      var sigmaRootT = sigma * rootT;
      var d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / sigmaRootT;
      var d2 = d1 - sigmaRootT;
      var discountedStrikeRegular = K * Math.exp(-r * T);
      var call = S * normalCdf(d1) - discountedStrikeRegular * normalCdf(d2);
      var put = call - S + discountedStrikeRegular;
      var pdf = normalPdf(d1);
      var callDelta = normalCdf(d1);
      result = {
        status: "regular",
        boundary: "GBM / constant sigma / constant r interior formula",
        d1: d1,
        d2: d2,
        call: call,
        put: put,
        greeks: {
          call: {
            delta: callDelta,
            gamma: pdf / (S * sigmaRootT),
            vega: S * pdf * rootT,
            theta: -S * pdf * sigma / (2 * rootT) - r * discountedStrikeRegular * normalCdf(d2),
            rho: K * T * Math.exp(-r * T) * normalCdf(d2)
          },
          put: {
            delta: callDelta - 1,
            gamma: pdf / (S * sigmaRootT),
            vega: S * pdf * rootT,
            theta: -S * pdf * sigma / (2 * rootT) + r * discountedStrikeRegular * normalCdf(-d2),
            rho: -K * T * Math.exp(-r * T) * normalCdf(-d2)
          }
        }
      };
    }
    if (!result.greekMetadata) {
      result.greekMetadata = {
        call: availableGreekMetadata(result.greeks.call),
        put: availableGreekMetadata(result.greeks.put)
      };
    }
    result.parityTarget = S - K * Math.exp(-r * T);
    result.parityResidual = result.call - result.put - result.parityTarget;
    result.inputs = { S: S, K: K, r: r, sigma: sigma, T: T };
    return result;
  }

  function nextUniform(state) {
    state.value = (1664525 * state.value + 1013904223) >>> 0;
    return (state.value + 1) / 4294967297;
  }

  function nextNormal(state) {
    var u1 = Math.max(1e-12, nextUniform(state));
    var u2 = nextUniform(state);
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  function generatePath(config) {
    var normalized = normalizeConfig(config);
    if (normalized.T === 0) return { prices: [normalized.S0], shocks: [], dt: 0 };
    var dt = normalized.T / normalized.steps;
    var state = { value: normalized.seed >>> 0 };
    var prices = [normalized.S0];
    var shocks = [];
    var i;
    for (i = 0; i < normalized.steps; i += 1) {
      var z = normalized.sigma === 0 ? 0 : nextNormal(state);
      var grossLogReturn = (normalized.mu - 0.5 * normalized.sigma * normalized.sigma) * dt + normalized.sigma * Math.sqrt(dt) * z;
      prices.push(prices[prices.length - 1] * Math.exp(grossLogReturn));
      shocks.push(z);
    }
    return { prices: prices, shocks: shocks, dt: dt };
  }

  function discreteDeltaHedge(input) {
    var config = normalizeConfig(input);
    var pricing = blackScholes(config.S0, config.K, config.r, config.sigma, config.T);
    var path = generatePath(config);
    var rows = [];
    var shares = pricing.greeks.call.delta;
    var cash = pricing.call - shares * config.S0;
    var n = path.prices.length - 1;
    var dt = path.dt;
    var growth = Math.exp(config.r * dt);
    function rowAt(index, cashBefore, trade, optionValue, payoff) {
      var time = index * dt;
      var stock = path.prices[index];
      var remaining = Math.max(0, config.T - time);
      var target = blackScholes(stock, config.K, config.r, config.sigma, remaining).greeks.call.delta;
      var portfolio = shares * stock + cash;
      return {
        index: index,
        time: time,
        stock: stock,
        remaining: remaining,
        targetDelta: target,
        shares: shares,
        cashBeforeRebalance: cashBefore,
        trade: trade,
        cash: cash,
        portfolio: portfolio,
        modelValue: optionValue,
        payoff: payoff,
        hedgeError: portfolio - optionValue,
        terminalError: payoff === null ? null : portfolio - payoff
      };
    }
    rows.push(rowAt(0, cash, 0, pricing.call, n === 0 ? Math.max(config.S0 - config.K, 0) : null));
    var i;
    for (i = 1; i <= n; i += 1) {
      var cashBefore = cash * growth;
      var stock = path.prices[i];
      var remaining = Math.max(0, config.T - i * dt);
      var targetDelta = blackScholes(stock, config.K, config.r, config.sigma, remaining).greeks.call.delta;
      var trade = i < n ? targetDelta - shares : 0;
      if (i < n) {
        cash = cashBefore - trade * stock;
        shares = targetDelta;
      } else {
        cash = cashBefore;
      }
      var payoff = i === n ? Math.max(stock - config.K, 0) : null;
      var optionValue = i === n ? payoff : blackScholes(stock, config.K, config.r, config.sigma, remaining).call;
      rows.push(rowAt(i, cashBefore, trade, optionValue, payoff));
    }
    var terminal = rows[rows.length - 1];
    return {
      config: config,
      pricing: pricing,
      path: path,
      rows: rows,
      terminalError: terminal.terminalError,
      maxAbsHedgeError: rows.reduce(function (maximum, row) { return Math.max(maximum, Math.abs(row.hedgeError)); }, 0),
      assumptions: [
        "GBM stock dynamics with scenario drift mu",
        "constant r and sigma",
        "frictionless complete market",
        "continuous hedging is the theorem; this ledger rebalances only at a finite grid"
      ],
      scenarioNote: "The finite-grid terminal error is a path scenario, not a Black-Scholes theorem or a worst-case bound."
    };
  }

  var STYLE_ID = "cl-black-scholes-hedge-styles";
  var STYLE_TEXT = [
    ".bsh-lab{--bsh-blue:#2f6f9f;--bsh-green:#39734d;--bsh-gold:#a36a16;--bsh-red:#b3483b;--bsh-soft:var(--fg-soft,#6f6a60);max-width:100%;min-width:0;color:var(--fg);line-height:1.55;overflow-wrap:anywhere}",
    "html[data-theme=\"dark\"] .bsh-lab{--bsh-blue:#82c8ff;--bsh-green:#7bc48c;--bsh-gold:#e3b45f;--bsh-red:#f08d7d;--bsh-soft:#b8b2a7}",
    ".bsh-lab *,.bsh-lab *::before,.bsh-lab *::after{box-sizing:border-box}.bsh-lab [hidden]{display:none!important}.bsh-lab h3{margin:0;font-size:1.18rem;letter-spacing:0}.bsh-lab p{margin:.65rem 0}.bsh-intro,.bsh-note,.bsh-feedback,.bsh-boundary{color:var(--bsh-soft);font-size:13px;line-height:1.7}.bsh-gate{margin:14px 0;padding:12px 14px;border-left:3px solid var(--bsh-gold);background:var(--bg)}.bsh-gate fieldset{border:0;min-width:0;margin:12px 0 0;padding:0}.bsh-gate legend{margin-bottom:7px;font-weight:700;line-height:1.5}.bsh-choice-row,.bsh-actions,.bsh-presets{display:flex;flex-wrap:wrap;gap:7px}.bsh-actions{margin-top:12px}.bsh-lab button{font:inherit;line-height:1.3;cursor:pointer;color:var(--fg);background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:7px 10px;min-height:44px}.bsh-lab button:hover{border-color:var(--bsh-blue)}.bsh-lab button[aria-pressed=\"true\"]{border-color:var(--bsh-blue);background:var(--bg);font-weight:700}.bsh-lab button:disabled{cursor:default;opacity:.65}.bsh-primary{border-color:var(--bsh-blue)!important;background:var(--bsh-blue)!important;color:#fff!important;font-weight:700}.bsh-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:10px;margin:12px 0}.bsh-control{min-width:0}.bsh-control label{display:block;font-size:13px;color:var(--bsh-soft);margin-bottom:4px}.bsh-control output{color:var(--fg);font-weight:700}.bsh-control input{display:block;width:100%;accent-color:var(--bsh-blue)}.bsh-scale{display:flex;justify-content:space-between;color:var(--bsh-soft);font-size:11px}.bsh-presets{margin:10px 0}.bsh-presets button[aria-pressed=\"true\"]{border-color:var(--bsh-gold);font-weight:700}.bsh-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:8px;margin:14px 0}.bsh-metric{border-top:2px solid var(--bsh-blue);padding:7px 8px;background:var(--bg)}.bsh-metric span{display:block;color:var(--bsh-soft);font-size:12px}.bsh-metric strong{display:block;font-size:1.08rem;color:var(--fg);overflow-wrap:anywhere}.bsh-frame{border:1px solid var(--border);background:var(--bg);padding:7px;min-width:0}.bsh-chart{width:100%;height:auto;display:block}.bsh-chart text{font-family:inherit;fill:var(--fg-soft,#6f6a60);font-size:11px}.bsh-axis{stroke:var(--border);stroke-width:1}.bsh-grid{stroke:var(--border);stroke-width:1;stroke-dasharray:3 4}.bsh-stock{fill:none;stroke:var(--bsh-blue);stroke-width:2.5}.bsh-portfolio{fill:none;stroke:var(--bsh-gold);stroke-width:2}.bsh-error{fill:none;stroke:var(--bsh-red);stroke-width:2.5}.bsh-strike,.bsh-zero{stroke:var(--bsh-green);stroke-width:1.5;stroke-dasharray:5 4}.bsh-chart-title{fill:var(--fg)!important;font-weight:700}.bsh-legend{display:flex;flex-wrap:wrap;gap:12px;color:var(--bsh-soft);font-size:12px;margin:7px 0}.bsh-swatch{display:inline-block;width:20px;height:3px;vertical-align:middle;margin-right:4px;background:var(--bsh-blue)}.bsh-swatch-gold{background:var(--bsh-gold)}.bsh-swatch-red{background:var(--bsh-red)}.bsh-swatch-green{background:var(--bsh-green)}.bsh-table-wrap{overflow-x:auto;max-width:100%;margin-top:12px}.bsh-table{border-collapse:collapse;width:100%;min-width:700px;font-size:12px}.bsh-table caption{text-align:left;color:var(--bsh-soft);padding:5px 0}.bsh-table th,.bsh-table td{border:1px solid var(--border);padding:6px 7px;text-align:right;white-space:nowrap}.bsh-table th:first-child,.bsh-table td:first-child{text-align:left}.bsh-table th{background:var(--block-bg);color:var(--fg)}.bsh-table td.bsh-negative{color:var(--bsh-red)}.bsh-boundary{border-left:3px solid var(--bsh-green);padding-left:10px}.bsh-footnote{font-size:12px;color:var(--bsh-soft)}.bsh-lab input:focus-visible,.bsh-lab button:focus-visible{outline:2px solid var(--bsh-blue);outline-offset:2px}@media(max-width:600px){.bsh-choice-row,.bsh-actions{display:grid;grid-template-columns:1fr}.bsh-choice-row button,.bsh-actions button{width:100%}.bsh-table{font-size:11px}.bsh-frame{padding:3px}.bsh-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}"
  ].join("");

  function format(value, digits) {
    if (!finite(value)) return "-";
    var places = digits === undefined ? 4 : digits;
    if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(Math.min(places, 4));
    return value.toFixed(places).replace(/0+$/, "").replace(/\.$/, "");
  }

  function greekText(result, side, key, digits) {
    var metadata = result.greekMetadata && result.greekMetadata[side] && result.greekMetadata[side][key];
    if (metadata && metadata.status === "unavailable") return "unavailable";
    if (metadata && metadata.status === "one-sided") return format(metadata.value, digits) + " (one-sided)";
    return format(result.greeks[side][key], digits);
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function append(node, children) {
    if (children === undefined || children === null) return node;
    if (!Array.isArray(children)) children = [children];
    children.forEach(function (child) {
      if (child !== undefined && child !== null && child !== false) node.appendChild(child.nodeType ? child : node.ownerDocument.createTextNode(String(child)));
    });
    return node;
  }

  function element(doc, tag, attrs, children) {
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", value);
      else if (key === "htmlFor") node.setAttribute("for", value);
      else if (key === "text") node.textContent = value;
      else node.setAttribute(key, value === true ? "" : String(value));
    });
    return append(node, children);
  }

  function svgElement(doc, tag, attrs, children) {
    var node = doc.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value !== undefined && value !== null) node.setAttribute(key === "className" ? "class" : key, String(value));
    });
    return append(node, children);
  }

  function installStyles(doc) {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE_TEXT;
    doc.head.appendChild(style);
  }

  function metric(doc, label, value) {
    return element(doc, "div", { className: "bsh-metric" }, [element(doc, "span", {}, label), element(doc, "strong", {}, value)]);
  }

  function drawChart(doc, svg, result, uid) {
    clear(svg);
    var width = 780;
    var height = 390;
    var left = 55;
    var right = 758;
    var top = 30;
    var middle = 195;
    var bottom = 350;
    var rows = result.rows;
    var maxStock = Math.max(result.config.K, Math.max.apply(null, rows.map(function (row) { return row.stock; }))) * 1.1;
    var errorScale = Math.max(0.01, Math.max.apply(null, rows.map(function (row) { return Math.abs(row.hedgeError); })) * 1.25);
    function x(index) { return left + (rows.length === 1 ? 0.5 : index / (rows.length - 1)) * (right - left); }
    function yStock(value) { return middle - (value / maxStock) * (middle - top); }
    function yError(value) { return bottom - ((value + errorScale) / (2 * errorScale)) * (bottom - middle - 20); }
    function path(key, mapper) {
      return rows.map(function (row, index) { return (index ? "L" : "M") + x(index).toFixed(2) + "," + mapper(row[key]).toFixed(2); }).join(" ");
    }
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-labelledby", uid + "-chart-title " + uid + "-chart-desc");
    svg.appendChild(svgElement(doc, "title", { id: uid + "-chart-title" }, "GBM 价格路径与离散对冲误差"));
    svg.appendChild(svgElement(doc, "desc", { id: uid + "-chart-desc" }, "上图是固定 seed 的股票价格路径和执行价，下图是离散对冲组合相对 Black-Scholes 价值的误差；终点误差是场景读数。"));
    [0, maxStock / 2, maxStock].forEach(function (value) {
      var y = yStock(value);
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: y, x2: right, y2: y, className: "bsh-grid" }));
      svg.appendChild(svgElement(doc, "text", { x: left - 8, y: y + 4, "text-anchor": "end" }, format(value, 1)));
    });
    [0, errorScale, -errorScale].forEach(function (value) {
      var y = yError(value);
      svg.appendChild(svgElement(doc, "line", { x1: left, y1: y, x2: right, y2: y, className: value === 0 ? "bsh-zero" : "bsh-grid" }));
      svg.appendChild(svgElement(doc, "text", { x: left - 8, y: y + 4, "text-anchor": "end" }, format(value, 2)));
    });
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: middle, x2: right, y2: middle, className: "bsh-axis" }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: bottom, x2: right, y2: bottom, className: "bsh-axis" }));
    svg.appendChild(svgElement(doc, "path", { d: path("stock", yStock), className: "bsh-stock" }));
    svg.appendChild(svgElement(doc, "line", { x1: left, y1: yStock(result.config.K), x2: right, y2: yStock(result.config.K), className: "bsh-strike" }));
    svg.appendChild(svgElement(doc, "path", { d: path("portfolio", yStock), className: "bsh-portfolio" }));
    svg.appendChild(svgElement(doc, "path", { d: path("hedgeError", yError), className: "bsh-error" }));
    svg.appendChild(svgElement(doc, "text", { x: left, y: 18, className: "bsh-chart-title" }, "价格与组合价值"));
    svg.appendChild(svgElement(doc, "text", { x: right, y: 18, "text-anchor": "end" }, "蓝 S；金组合；绿 K"));
    svg.appendChild(svgElement(doc, "text", { x: left, y: middle + 18, className: "bsh-chart-title" }, "离散标记误差 = 组合 − 理论期权价值"));
    svg.appendChild(svgElement(doc, "text", { x: right, y: bottom + 27, "text-anchor": "end" }, "时间 t"));
    rows.forEach(function (row, index) {
      if (index === 0 || index === rows.length - 1 || index % Math.max(1, Math.floor(rows.length / 6)) === 0) {
        svg.appendChild(svgElement(doc, "text", { x: x(index), y: bottom + 14, "text-anchor": "middle" }, format(row.time, 2)));
      }
    });
  }

  function tableFor(doc, result) {
    var table = element(doc, "table", { className: "bsh-table" });
    table.appendChild(element(doc, "caption", {}, "有限网格对冲账本；最后一行不在到期时再平仓，保留真正的 terminal hedge error。"));
    table.appendChild(element(doc, "thead", {}, element(doc, "tr", {}, ["t", "S", "target delta", "shares", "cash", "portfolio", "model/payoff", "error"].map(function (label) {
      return element(doc, "th", { scope: "col" }, label);
    }))));
    var body = element(doc, "tbody");
    result.rows.forEach(function (row) {
      body.appendChild(element(doc, "tr", {}, [
        element(doc, "td", {}, format(row.time, 3)),
        element(doc, "td", {}, format(row.stock, 4)),
        element(doc, "td", {}, format(row.targetDelta, 5)),
        element(doc, "td", {}, format(row.shares, 5)),
        element(doc, "td", {}, format(row.cash, 5)),
        element(doc, "td", {}, format(row.portfolio, 5)),
        element(doc, "td", {}, format(row.modelValue, 5)),
        element(doc, "td", { className: row.hedgeError < 0 ? "bsh-negative" : "" }, format(row.hedgeError, 6))
      ]));
    });
    table.appendChild(body);
    return table;
  }

  function mount(rootNode, api) {
    var doc = rootNode.ownerDocument || document;
    installStyles(doc);
    SERIAL += 1;
    var uid = "bsh-" + SERIAL;
    var config = normalizeConfig(DEFAULTS);
    var predictions = { drift: null, discrete: null, zero: null, parity: null };
    var questions = [
      { key: "drift", prompt: "Black-Scholes 的欧式价格使用哪个漂移？", choices: [["r", "风险中性漂移 r"], ["mu", "历史/场景漂移 mu"], ["none", "不需要漂移"]], answer: "r" },
      { key: "discrete", prompt: "有限次调仓的 terminal error 应怎样读？", choices: [["scenario", "一条路径的场景读数"], ["theorem", "连续定理本身"], ["zero", "必定为 0"]], answer: "scenario" },
      { key: "zero", prompt: "sigma=0 且 T>0 时发生什么？", choices: [["deterministic", "风险中性路径确定，价格退化为折现内在价值"], ["blowup", "公式发散"], ["same", "仍有随机波动"]], answer: "deterministic" },
      { key: "parity", prompt: "put-call parity 需要完整的 GBM 假设吗？", choices: [["no", "不需要；它来自到期现金流与无套利"], ["yes", "需要 sigma>0"], ["mu", "需要知道 mu"]], answer: "no" }
    ];
    var shell = element(doc, "div", { className: "bsh-lab" });
    shell.appendChild(element(doc, "h3", {}, "Black-Scholes 定价与离散 delta 对冲"));
    shell.appendChild(element(doc, "p", { className: "bsh-intro" }, "先把定价公式、连续复制和有限网格场景分开；揭示后再调参。路径由固定 seed 生成，因此同样参数会得到同一份账本。"));
    var gate = element(doc, "form", { className: "bsh-gate", "aria-labelledby": uid + "-gate-title" });
    gate.appendChild(element(doc, "strong", { id: uid + "-gate-title" }, "预测门：先判断量词、边界与无套利关系"));
    var choices = [];
    questions.forEach(function (question, questionIndex) {
      var field = element(doc, "fieldset");
      field.appendChild(element(doc, "legend", {}, (questionIndex + 1) + ". " + question.prompt));
      var row = element(doc, "div", { className: "bsh-choice-row" });
      question.choices.forEach(function (choice) {
        var button = element(doc, "button", { type: "button", "aria-pressed": "false" }, choice[1]);
        button.addEventListener("click", function () {
          predictions[question.key] = choice[0];
          choices.forEach(function (item) {
            if (item.key === question.key) item.button.setAttribute("aria-pressed", item.value === choice[0] ? "true" : "false");
          });
          feedback.textContent = "预测已记录；四项都选择后才揭示结果。";
        });
        choices.push({ key: question.key, value: choice[0], button: button });
        row.appendChild(button);
      });
      field.appendChild(row);
      gate.appendChild(field);
    });
    var gateActions = element(doc, "div", { className: "bsh-actions" });
    var reveal = element(doc, "button", { type: "submit", className: "bsh-primary" }, "提交预测并揭示");
    var resetGate = element(doc, "button", { type: "button" }, "重置");
    var feedback = element(doc, "p", { className: "bsh-feedback", "aria-live": "polite" }, "四项预测完成后，结果账本才会出现。");
    gateActions.appendChild(reveal);
    gateActions.appendChild(resetGate);
    gate.appendChild(gateActions);
    gate.appendChild(feedback);
    shell.appendChild(gate);

    var experiment = element(doc, "section", { hidden: "hidden", "aria-labelledby": uid + "-results-title" });
    experiment.appendChild(element(doc, "h3", { id: uid + "-results-title" }, "确定性实验台：公式 Greeks 与有限网格账本"));
    experiment.appendChild(element(doc, "p", { className: "bsh-note" }, "定价端固定使用 r；平价核对的是 C-P=S0-K exp(-rT)，其中到期债券现金流为 K、当前价为 K exp(-rT)；路径端用 mu 生成一个 GBM 场景。市场假设是无摩擦、完备、常数 r/sigma、连续可交易；这里的有限次调仓只是对连续理论的数值压力测试。"));
    var presetRow = element(doc, "div", { className: "bsh-presets", role: "group", "aria-label": "教学预设" });
    PRESETS.forEach(function (preset) {
      var button = element(doc, "button", { type: "button", "aria-pressed": preset.id === "baseline" ? "true" : "false" }, preset.label);
      button.addEventListener("click", function () { config = normalizeConfig(preset); render(); });
      presetRow.appendChild(button);
    });
    experiment.appendChild(presetRow);
    var controls = element(doc, "div", { className: "bsh-controls" });
    var inputs = {};
    function addRange(key, label, min, max, step, digits) {
      var id = uid + "-" + key;
      var input = element(doc, "input", { id: id, type: "range", min: min, max: max, step: step, "aria-label": label });
      var output = element(doc, "output", { for: id });
      var wrapper = element(doc, "div", { className: "bsh-control" }, [
        element(doc, "label", { htmlFor: id }, [label + " = ", output]),
        input,
        element(doc, "div", { className: "bsh-scale" }, [element(doc, "span", {}, String(min)), element(doc, "span", {}, String(max))])
      ]);
      input.addEventListener("input", function () { config[key] = Number(input.value); render(); });
      controls.appendChild(wrapper);
      inputs[key] = { input: input, output: output, digits: digits };
    }
    addRange("S0", "S0", 40, 180, 1, 1);
    addRange("K", "K", 40, 180, 1, 1);
    addRange("r", "r", -0.05, 0.2, 0.005, 3);
    addRange("sigma", "sigma", 0, 0.8, 0.01, 2);
    addRange("T", "T", 0, 3, 0.05, 2);
    addRange("mu", "scenario mu", -0.2, 0.3, 0.01, 2);
    addRange("steps", "rebalance steps", 1, 48, 1, 0);
    experiment.appendChild(controls);
    var metrics = element(doc, "div", { className: "bsh-metrics" });
    var boundaryNote = element(doc, "p", { className: "bsh-boundary", "aria-live": "polite" });
    var frame = element(doc, "div", { className: "bsh-frame" });
    var svg = svgElement(doc, "svg", { className: "bsh-chart", viewBox: "0 0 780 390" });
    frame.appendChild(svg);
    var legend = element(doc, "div", { className: "bsh-legend" }, [
      element(doc, "span", {}, [element(doc, "i", { className: "bsh-swatch" }), "股票 S"]),
      element(doc, "span", {}, [element(doc, "i", { className: "bsh-swatch bsh-swatch-gold" }), "对冲组合"]),
      element(doc, "span", {}, [element(doc, "i", { className: "bsh-swatch bsh-swatch-red" }), "误差"]),
      element(doc, "span", {}, [element(doc, "i", { className: "bsh-swatch bsh-swatch-green" }), "执行价 / 零线"])
    ]);
    var tableWrap = element(doc, "div", { className: "bsh-table-wrap" });
    var interpretation = element(doc, "p", { className: "bsh-footnote", "aria-live": "polite" });
    var reset = element(doc, "button", { type: "button" }, "重新预测");
    reset.addEventListener("click", resetAll);
    experiment.appendChild(metrics);
    experiment.appendChild(boundaryNote);
    experiment.appendChild(frame);
    experiment.appendChild(legend);
    experiment.appendChild(tableWrap);
    experiment.appendChild(interpretation);
    experiment.appendChild(reset);
    shell.appendChild(experiment);
    rootNode.replaceChildren(shell);

    function syncInputs() {
      Object.keys(inputs).forEach(function (key) {
        inputs[key].input.value = String(config[key]);
        inputs[key].output.textContent = format(config[key], inputs[key].digits);
      });
    }

    function render() {
      var result = discreteDeltaHedge(config);
      syncInputs();
      presetRow.querySelectorAll("button").forEach(function (button, index) {
        var preset = PRESETS[index];
        button.setAttribute("aria-pressed", samePresetConfig(preset, config) ? "true" : "false");
      });
      metrics.replaceChildren(
        metric(doc, "call", format(result.pricing.call, 5)),
        metric(doc, "put", format(result.pricing.put, 5)),
        metric(doc, "parity residual", format(result.pricing.parityResidual, 8)),
        metric(doc, "delta", greekText(result.pricing, "call", "delta", 5)),
        metric(doc, "gamma", greekText(result.pricing, "call", "gamma", 5)),
        metric(doc, "vega", greekText(result.pricing, "call", "vega", 5)),
        metric(doc, "theta", greekText(result.pricing, "call", "theta", 5)),
        metric(doc, "rho", greekText(result.pricing, "call", "rho", 5)),
        metric(doc, "terminal error", format(result.terminalError, 6))
      );
      boundaryNote.textContent = result.pricing.status === "regular"
        ? "当前在正则区域：d1/d2 与五个常用 Greeks 可用；put 由 parity 核对。"
        : result.pricing.boundary;
      drawChart(doc, svg, result, uid);
      tableWrap.replaceChildren(tableFor(doc, result));
      interpretation.textContent = Math.abs(result.terminalError) < 1e-8
        ? "当前场景的离散终点误差在数值容差内为 0；这通常来自 sigma=0 的确定性退化，不应推广到随机有限网格。"
        : "终点误差 = 最后持仓组合 − 到期 payoff。增加调仓次数常会改变这条固定路径的误差，但一条路径和有限网格都不是连续复制定理的证明。";
    }

    function resetAll() {
      config = normalizeConfig(DEFAULTS);
      predictions = { drift: null, discrete: null, zero: null, parity: null };
      choices.forEach(function (item) { item.button.setAttribute("aria-pressed", "false"); });
      reveal.disabled = false;
      experiment.setAttribute("hidden", "hidden");
      feedback.className = "bsh-feedback";
      feedback.textContent = "四项预测完成后，结果账本才会出现。";
      syncInputs();
    }

    gate.addEventListener("submit", function (event) {
      event.preventDefault();
      var missing = questions.filter(function (question) { return predictions[question.key] === null; });
      if (missing.length) {
        feedback.className = "bsh-feedback bsh-boundary";
        feedback.textContent = "还缺 " + missing.length + " 项预测。";
        return;
      }
      var correct = questions.reduce(function (sum, question) { return sum + (predictions[question.key] === question.answer ? 1 : 0); }, 0);
      reveal.disabled = true;
      experiment.removeAttribute("hidden");
      feedback.textContent = "已揭示：" + correct + "/" + questions.length + " 项命中；现在可以调参。";
      feedback.className = "bsh-feedback" + (correct === questions.length ? " bsh-boundary" : "");
      render();
      if (api && typeof api.announce === "function") api.announce(rootNode, feedback.textContent);
    });
    resetGate.addEventListener("click", resetAll);
    render();
  }

  function predictionAnswers() {
    return { drift: "r", discrete: "scenario", zero: "deterministic", parity: "no" };
  }

  function close(left, right, tolerance) {
    return Math.abs(left - right) <= (tolerance === undefined ? 1e-8 : tolerance);
  }

  function selfTest() {
    var checks = 0;
    function assert(condition, message) {
      checks += 1;
      if (!condition) throw new Error(message);
    }
    assert(close(normalCdf(0), 0.5, 2e-7), "normal CDF at zero");
    assert(close(normalCdf(1.9599639845), 0.975, 2e-5), "normal CDF calibration");
    var base = blackScholes(100, 100, 0.05, 0.2, 1);
    assert(close(base.call, 10.45058, 2e-4), "European call formula");
    assert(close(base.put, 5.57353, 2e-4), "European put from parity");
    assert(close(base.parityResidual, 0, 1e-10), "put-call parity residual");
    assert(base.status === "regular" && base.d1 > base.d2, "regular d1/d2 status");
    assert(base.greeks.call.delta > 0 && base.greeks.call.delta < 1, "call delta range");
    assert(close(base.greeks.call.gamma, base.greeks.put.gamma, 1e-12), "gamma parity");
    assert(close(base.greeks.call.vega, base.greeks.put.vega, 1e-12), "vega parity");
    assert(close(base.greeks.call.delta - base.greeks.put.delta, 1, 1e-12), "delta parity");
    assert(close(base.greeks.call.rho - base.greeks.put.rho, 100 * Math.exp(-0.05), 1e-8), "rho parity");
    assert(base.greekMetadata.call.gamma.status === "available" && base.greekMetadata.call.vega.status === "available", "regular Greek metadata");
    var atMaturity = blackScholes(110, 100, 0.05, 0.2, 0);
    assert(atMaturity.status === "maturity-boundary" && atMaturity.call === 10 && atMaturity.put === 0, "T=0 payoff boundary");
    assert(atMaturity.greeks.call.delta === 1 && atMaturity.greeks.call.gamma === 0, "T=0 delta and gamma boundary");
    assert(atMaturity.greekMetadata.call.theta.status === "one-sided" && close(atMaturity.greeks.call.theta, -5), "T=0 one-sided theta");
    var atKink = blackScholes(100, 100, 0.05, 0.2, 0);
    assert(atKink.greeks.call.delta === 0.5 && atKink.greekMetadata.call.delta.status === "one-sided", "maturity kink delta convention");
    assert(atKink.greeks.call.gamma === null && atKink.greekMetadata.call.gamma.status === "unavailable", "maturity kink gamma unavailable");
    assert(atKink.greeks.call.theta === null && atKink.greekMetadata.call.theta.status === "unavailable", "maturity kink theta unavailable");
    var zeroVol = blackScholes(100, 105, 0.04, 0, 1);
    assert(zeroVol.status === "zero-volatility-boundary", "sigma=0 status");
    assert(close(zeroVol.call, Math.max(100 - 105 * Math.exp(-0.04), 0), 1e-12), "sigma=0 discounted intrinsic");
    assert(zeroVol.greeks.call.gamma === 0 && zeroVol.greeks.call.vega === 0, "sigma=0 curvature and vega boundary");
    assert(zeroVol.greekMetadata.call.gamma.status === "available" && zeroVol.greekMetadata.call.vega.status === "available", "sigma=0 regular boundary metadata");
    var forwardAtm = blackScholes(100 * Math.exp(-0.04), 100, 0.04, 0, 1);
    assert(forwardAtm.greeks.call.delta === 0.5 && forwardAtm.greekMetadata.call.delta.status === "one-sided", "sigma=0 forward-ATM delta");
    assert(forwardAtm.greeks.call.gamma === null && forwardAtm.greekMetadata.call.gamma.status === "unavailable", "sigma=0 forward-ATM gamma unavailable");
    assert(close(forwardAtm.greeks.call.vega, forwardAtm.inputs.S * normalPdf(0), 1e-12) && forwardAtm.greekMetadata.call.vega.status === "one-sided", "sigma=0 forward-ATM one-sided vega");
    assert(forwardAtm.greeks.call.theta === null && forwardAtm.greeks.call.rho === null, "sigma=0 forward-ATM unavailable time/rate Greeks");
    var zeroVolInMoney = blackScholes(110, 100, 0.04, 0, 1);
    assert(close(zeroVolInMoney.greeks.call.rho, 100 * Math.exp(-0.04), 1e-12), "sigma=0 call rho boundary");
    var atZeroSpot = blackScholes(0, 100, 0.05, 0.2, 1);
    assert(atZeroSpot.call === 0 && close(atZeroSpot.put, 100 * Math.exp(-0.05), 1e-12), "S=0 boundary");
    var hedge = discreteDeltaHedge(DEFAULTS);
    var repeat = discreteDeltaHedge(DEFAULTS);
    assert(JSON.stringify(hedge) === JSON.stringify(repeat), "seeded hedge determinism");
    assert(hedge.rows.length === DEFAULTS.steps + 1, "hedge row count");
    assert(close(hedge.rows[0].portfolio, hedge.pricing.call, 1e-10), "initial self-financing value");
    assert(close(hedge.rows[0].hedgeError, 0, 1e-10), "initial mark error");
    assert(hedge.rows.every(function (row) { return finite(row.stock) && finite(row.portfolio) && finite(row.hedgeError); }), "finite hedge ledger");
    assert(hedge.rows[hedge.rows.length - 1].payoff !== null, "terminal payoff recorded");
    assert(close(hedge.terminalError, hedge.rows[hedge.rows.length - 1].portfolio - hedge.rows[hedge.rows.length - 1].payoff, 1e-12), "terminal error definition");
    var deterministic = discreteDeltaHedge({ S0: 100, K: 90, r: 0.04, sigma: 0, T: 1, mu: 0.04, steps: 16, seed: 9 });
    assert(Math.abs(deterministic.terminalError) < 1e-8, "zero-vol deterministic hedge closes");
    var zeroTime = discreteDeltaHedge({ S0: 90, K: 100, r: 0.05, sigma: 0.2, T: 0, steps: 16, seed: 9 });
    assert(zeroTime.rows.length === 1 && zeroTime.terminalError === 0, "T=0 hedge boundary");
    assert(samePresetConfig(PRESETS[0], normalizeConfig(PRESETS[0])), "baseline preset comparison");
    ["S0", "K", "r", "sigma", "T", "mu", "steps"].forEach(function (key) {
      var changed = normalizeConfig(PRESETS[0]);
      changed[key] = key === "steps" ? changed[key] + 1 : changed[key] + (key === "sigma" || key === "T" ? 0.01 : 1);
      assert(!samePresetConfig(PRESETS[0], changed), "preset comparison includes " + key);
    });
    var answers = predictionAnswers();
    assert(answers.drift === "r" && answers.discrete === "scenario", "prediction gate pricing answers");
    assert(answers.zero === "deterministic" && answers.parity === "no", "prediction gate boundary answers");
    return { checks: checks, presets: PRESETS.length };
  }

  return {
    DEFAULTS: DEFAULTS,
    PRESETS: PRESETS,
    normalizeConfig: normalizeConfig,
    samePresetConfig: samePresetConfig,
    normalCdf: normalCdf,
    normalPdf: normalPdf,
    blackScholes: blackScholes,
    generatePath: generatePath,
    discreteDeltaHedge: discreteDeltaHedge,
    predictionAnswers: predictionAnswers,
    selfTest: selfTest,
    mount: mount
  };
});
