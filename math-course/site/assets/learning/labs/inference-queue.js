(function (host) {
  "use strict";

  var DT_MS = 100;
  var PREFILL_TOKENS_PER_TICK = 24;
  var DECODE_SLOTS = 3;
  var KV_TOKEN_MB = 0.25;
  var KV_BUDGET_TOKENS = 72;
  var OBSERVATION_GRACE_MS = 1400;
  var MAX_TICKS = 2400;
  var STYLE_ID = "cl-inference-queue-styles";
  var INSTANCE_COUNT = 0;

  /*
   * One deterministic ledger. `at` is a normalized arrival coordinate: the
   * trace is rescaled so its 15 inter-arrival intervals span
   * 15 / arrivalRate seconds. Nothing here is a vendor measurement.
   */
  var REQUEST_LEDGER = [
    { id: "R01", at: 0.00, prompt: 18, output: 12, kind: "长请求" },
    { id: "R02", at: 0.10, prompt: 6, output: 2, kind: "短请求" },
    { id: "R03", at: 0.22, prompt: 5, output: 3, kind: "短请求" },
    { id: "R04", at: 0.38, prompt: 7, output: 2, kind: "短请求" },
    { id: "R05", at: 0.95, prompt: 10, output: 5, kind: "中请求" },
    { id: "R06", at: 1.08, prompt: 5, output: 2, kind: "短请求" },
    { id: "R07", at: 1.22, prompt: 6, output: 4, kind: "中请求" },
    { id: "R08", at: 2.10, prompt: 16, output: 8, kind: "长请求" },
    { id: "R09", at: 2.20, prompt: 5, output: 2, kind: "短请求" },
    { id: "R10", at: 2.33, prompt: 8, output: 3, kind: "短请求" },
    { id: "R11", at: 3.15, prompt: 12, output: 6, kind: "中请求" },
    { id: "R12", at: 3.28, prompt: 5, output: 2, kind: "短请求" },
    { id: "R13", at: 3.40, prompt: 6, output: 3, kind: "短请求" },
    { id: "R14", at: 4.30, prompt: 9, output: 4, kind: "中请求" },
    { id: "R15", at: 4.40, prompt: 5, output: 2, kind: "短请求" },
    { id: "R16", at: 4.52, prompt: 7, output: 3, kind: "短请求" }
  ];
  var LEDGER_SPAN = REQUEST_LEDGER[REQUEST_LEDGER.length - 1].at - REQUEST_LEDGER[0].at;
  var LEDGER_INTERVALS = REQUEST_LEDGER.length - 1;

  var MODES = {
    immediate: { label: "立即服务（单请求）", short: "立即" },
    static: { label: "静态 batching", short: "静态" },
    continuous: { label: "连续 / dynamic batching", short: "连续" }
  };

  var DEFAULTS = {
    mode: "continuous",
    arrivalRate: 1.2,
    batchSize: 4,
    waitTicks: 2,
    slo: 1600
  };

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function round(value, digits) {
    var factor = Math.pow(10, digits || 0);
    return Math.round(value * factor) / factor;
  }

  function normalizeOptions(options) {
    options = options || {};
    var rate = Number(options.arrivalRate);
    var batch = Number(options.batchSize);
    var wait = Number(options.waitTicks);
    var slo = Number(options.slo);
    return {
      mode: MODES[options.mode] ? options.mode : DEFAULTS.mode,
      arrivalRate: finite(rate) ? clamp(rate, 0.5, 15) : DEFAULTS.arrivalRate,
      batchSize: finite(batch) ? clamp(Math.round(batch), 1, 6) : DEFAULTS.batchSize,
      waitTicks: finite(wait) ? clamp(Math.round(wait), 0, 6) : DEFAULTS.waitTicks,
      slo: finite(slo) ? clamp(Math.round(slo / 100) * 100, 800, 3000) : DEFAULTS.slo
    };
  }

  function buildRequests(arrivalRate) {
    return REQUEST_LEDGER.map(function (spec, index) {
      return {
        index: index,
        id: spec.id,
        normalizedArrival: spec.at,
        arrivalMs: LEDGER_SPAN > 0
          ? ((spec.at - REQUEST_LEDGER[0].at) / LEDGER_SPAN) * LEDGER_INTERVALS * 1000 / arrivalRate
          : 0,
        promptTokens: spec.prompt,
        outputTokens: spec.output,
        kind: spec.kind,
        phase: "queued",
        prefillStartMs: null,
        prefillDoneMs: null,
        firstTokenMs: null,
        finishMs: null,
        generatedTokens: 0,
        kvTokens: 0,
        reservedKvTokens: 0,
        readyAtTick: null,
        lastServedTick: -1
      };
    });
  }

  function totalCachedTokens(requests) {
    return requests.reduce(function (sum, request) {
      return sum + (request.phase === "done" ? 0 : request.kvTokens);
    }, 0);
  }

  function reservedTokens(requests) {
    return requests.reduce(function (sum, request) {
      return sum + (request.phase === "done" ? 0 : request.reservedKvTokens);
    }, 0);
  }

  function queueAgeReady(queue, nowMs, waitTicks, batchSize) {
    if (!queue.length) return false;
    if (queue.length >= batchSize) return true;
    return waitTicks === 0 || nowMs - queue[0].arrivalMs >= waitTicks * DT_MS - 0.0001;
  }

  function requestIds(requests) {
    return requests.map(function (request) { return request.id; });
  }

  function startPrefill(state, mode, options, tick, nowMs, trace) {
    if (state.prefill || !state.queue.length) return false;
    if (mode === "immediate" && (state.active.length || state.prefill)) return false;
    if (mode === "static" && state.active.length) return false;
    var effectiveWait = mode === "immediate" ? 0 : options.waitTicks;
    var effectiveBatch = mode === "immediate" ? 1 : options.batchSize;
    if (!queueAgeReady(state.queue, nowMs, effectiveWait, effectiveBatch)) return false;

    var count = Math.min(effectiveBatch, state.queue.length);
    var available = KV_BUDGET_TOKENS - reservedTokens(state.requests);
    var reserveTotal = 0;
    var batch = [];
    for (var index = 0; index < count; index += 1) {
      var request = state.queue[index];
      var requestReserve = request.promptTokens + request.outputTokens;
      if (reserveTotal + requestReserve > available) break;
      batch.push(request);
      reserveTotal += requestReserve;
    }
    if (!batch.length) {
      trace.notes.push("KV 预算阻塞");
      return false;
    }
    if (batch.length < count) trace.notes.push("KV 预算将微批截成 FIFO 前缀");
    state.queue.splice(0, batch.length);
    var promptTotal = batch.reduce(function (sum, request) { return sum + request.promptTokens; }, 0);

    batch.forEach(function (request) {
      request.phase = "prefill";
      request.prefillStartMs = nowMs;
      request.reservedKvTokens = request.promptTokens + request.outputTokens;
      request.kvTokens = 0;
    });
    state.prefill = {
      batch: batch,
      totalPrompt: promptTotal,
      donePrompt: 0,
      startTick: tick,
      startMs: nowMs
    };
    trace.prefillStart = requestIds(batch).join("、");
    trace.notes.push(mode === "static" ? "静态 batch 封存" : mode === "continuous" ? "动态微批进入 prefill" : "单请求进入 prefill");
    return true;
  }

  function completePrefill(state, tick, nowMs, trace) {
    if (!state.prefill) return;
    var work = Math.min(PREFILL_TOKENS_PER_TICK, state.prefill.totalPrompt - state.prefill.donePrompt);
    state.prefill.donePrompt += work;
    var ratio = state.prefill.totalPrompt === 0 ? 1 : state.prefill.donePrompt / state.prefill.totalPrompt;
    state.prefill.batch.forEach(function (request) {
      request.kvTokens = Math.min(request.promptTokens, Math.floor(request.promptTokens * ratio));
    });
    trace.prefillWork = work;
    if (state.prefill.donePrompt < state.prefill.totalPrompt) return;

    state.prefill.batch.forEach(function (request) {
      request.phase = "ready";
      request.prefillDoneMs = nowMs + DT_MS;
      request.readyAtTick = tick;
      request.kvTokens = request.promptTokens;
      state.active.push(request);
    });
    trace.prefillDone = requestIds(state.prefill.batch).join("、");
    state.prefill = null;
  }

  function decodeOneTick(state, mode, tick, nowMs, trace) {
    var candidates = state.active.filter(function (request) {
      return request.phase === "ready" && request.readyAtTick < tick;
    });
    if (!candidates.length) return;
    candidates.sort(function (left, right) {
      return left.lastServedTick - right.lastServedTick || left.index - right.index;
    });
    var slots = mode === "immediate" ? 1 : DECODE_SLOTS;
    var selected = candidates.slice(0, slots);
    selected.forEach(function (request) {
      request.generatedTokens += 1;
      request.kvTokens = request.promptTokens + request.generatedTokens;
      request.lastServedTick = tick;
      if (request.firstTokenMs === null) request.firstTokenMs = nowMs + DT_MS;
      if (request.generatedTokens >= request.outputTokens) {
        request.finishMs = nowMs + DT_MS;
        request.phase = "done";
        trace.done.push(request.id);
      }
    });
    trace.decode = selected.map(function (request) { return request.id; });
    state.active = state.active.filter(function (request) { return request.phase !== "done"; });
  }

  function percentile(values, probability) {
    if (!values.length) return null;
    var sorted = values.slice().sort(function (left, right) { return left - right; });
    var index = Math.max(0, Math.min(sorted.length - 1, Math.ceil(probability * sorted.length) - 1));
    return sorted[index];
  }

  function completedRequests(requests) {
    return requests.filter(function (request) { return request.finishMs !== null; });
  }

  function metricValues(requests, field) {
    return completedRequests(requests).map(function (request) { return request[field]; }).filter(finite);
  }

  function calculateConcurrency(requests, observationWindowMs) {
    var observed = requests.filter(function (request) {
      return request.arrivalMs <= observationWindowMs + 0.0001;
    });
    if (!observed.length || observationWindowMs <= 0) {
      return { average: 0, peak: 0 };
    }
    var points = [];
    observed.forEach(function (request) {
      var endMs = request.finishMs === null
        ? observationWindowMs
        : Math.min(request.finishMs, observationWindowMs);
      if (endMs <= request.arrivalMs) return;
      points.push({ time: request.arrivalMs, delta: 1, order: 1 });
      points.push({ time: endMs, delta: -1, order: 0 });
    });
    points.sort(function (left, right) { return left.time - right.time || left.order - right.order; });
    var current = 0;
    var peak = 0;
    var previous = 0;
    var area = 0;
    points.forEach(function (point) {
      area += current * Math.max(0, point.time - previous);
      current += point.delta;
      peak = Math.max(peak, current);
      previous = point.time;
    });
    return { average: area / observationWindowMs, peak: peak };
  }

  function summarize(requests, options, mode, state) {
    var completed = completedRequests(requests);
    var completedMakespanMs = completed.reduce(function (latest, request) {
      return Math.max(latest, request.finishMs || 0);
    }, 0);
    var lastArrivalMs = requests.reduce(function (latest, request) { return Math.max(latest, request.arrivalMs); }, 0);
    var observationWindowMs = lastArrivalMs + OBSERVATION_GRACE_MS;
    var unfinished = requests.filter(function (request) { return request.finishMs === null; });
    var completedCount = completed.length;
    var goodCount = completed.filter(function (request) { return request.e2eMs <= options.slo; }).length;
    var concurrency = calculateConcurrency(requests, observationWindowMs);
    var seconds = observationWindowMs / 1000;
    var e2e = metricValues(requests, "e2eMs");
    var ttft = metricValues(requests, "ttftMs");
    var tpot = metricValues(requests, "tpotMs");
    var queueAtEnd = state.queue.length;
    var unfinishedQueue = unfinished.filter(function (request) { return request.phase === "queued"; }).length;
    var unfinishedPrefill = unfinished.filter(function (request) { return request.phase === "prefill"; }).length;
    var unfinishedDecode = unfinished.filter(function (request) { return request.phase === "ready"; }).length;
    return {
      mode: mode,
      completed: completedCount,
      total: requests.length,
      unfinished: unfinished.length,
      unfinishedQueue: unfinishedQueue,
      unfinishedPrefill: unfinishedPrefill,
      unfinishedDecode: unfinishedDecode,
      backlogAtEnd: queueAtEnd,
      inFlightAtEnd: unfinished.length,
      good: goodCount,
      goodputRatio: requests.length ? goodCount / requests.length : 0,
      goodputRps: seconds ? goodCount / seconds : 0,
      throughputRps: seconds ? completedCount / seconds : 0,
      tokenThroughput: seconds ? completed.reduce(function (sum, request) { return sum + request.outputTokens; }, 0) / seconds : 0,
      makespanMs: observationWindowMs,
      completedMakespanMs: completedMakespanMs,
      observationWindowMs: observationWindowMs,
      lastArrivalMs: lastArrivalMs,
      peakQueue: state.peakQueue,
      queueAtEnd: queueAtEnd,
      averageConcurrency: concurrency.average,
      peakConcurrency: concurrency.peak,
      peakKvTokens: state.peakKvTokens,
      peakKvMb: state.peakKvTokens * KV_TOKEN_MB,
      peakReservedTokens: state.peakReservedTokens,
      peakReservedMb: state.peakReservedTokens * KV_TOKEN_MB,
      kvBudgetMb: KV_BUDGET_TOKENS * KV_TOKEN_MB,
      p50E2e: percentile(e2e, 0.50),
      p95E2e: percentile(e2e, 0.95),
      p99E2e: percentile(e2e, 0.99),
      p50Ttft: percentile(ttft, 0.50),
      p95Ttft: percentile(ttft, 0.95),
      p99Ttft: percentile(ttft, 0.99),
      p50Tpot: percentile(tpot, 0.50),
      p95Tpot: percentile(tpot, 0.95),
      tailSampleCount: completedCount,
      tailCoverage: requests.length ? completedCount / requests.length : 0,
      tailCensored: unfinished.length > 0,
      overloadedWindow: unfinished.length > 0 || queueAtEnd > 0,
      holWarning: holWarning(requests, mode)
    };
  }

  function holWarning(requests, mode) {
    var first = requests[0];
    var shortAfter = requests.slice(1, 4).filter(function (request) { return request.outputTokens <= 3; });
    if (!first || !shortAfter.length) return false;
    var firstDone = first.finishMs || Infinity;
    if (mode === "immediate") {
      return shortAfter.every(function (request) {
        return request.finishMs === null || request.finishMs >= firstDone;
      });
    }
    if (mode === "static") {
      var firstBatch = requests.filter(function (request) {
        return request.prefillStartMs === first.prefillStartMs;
      });
      var firstBatchDone = firstBatch.reduce(function (latest, request) {
        return Math.max(latest, request.finishMs || Infinity);
      }, 0);
      var later = requests.find(function (request) {
        return request.prefillStartMs !== null && request.prefillStartMs !== first.prefillStartMs;
      });
      return Boolean(later && isFinite(firstBatchDone) && later.prefillStartMs >= firstBatchDone);
    }
    return false;
  }

  function enrichRequests(requests, options) {
    requests.forEach(function (request) {
      request.censored = request.finishMs === null;
      request.queueDelayMs = request.prefillStartMs === null
        ? null
        : Math.max(0, request.prefillStartMs - request.arrivalMs);
      request.prefillMs = request.prefillDoneMs === null || request.prefillStartMs === null
        ? null
        : request.prefillDoneMs - request.prefillStartMs;
      request.ttftMs = request.firstTokenMs === null
        ? null
        : request.firstTokenMs - request.arrivalMs;
      request.tpotMs = request.finishMs !== null && request.outputTokens > 1
        ? (request.finishMs - request.firstTokenMs) / (request.outputTokens - 1)
        : null;
      request.decodeMs = request.finishMs === null || request.firstTokenMs === null
        ? null
        : request.finishMs - request.firstTokenMs;
      request.e2eMs = request.finishMs === null
        ? null
        : request.finishMs - request.arrivalMs;
      request.sloMet = request.finishMs === null ? null : request.e2eMs <= options.slo;
      request.status = request.finishMs !== null
        ? "completed"
        : request.phase === "queued"
          ? "queued"
          : request.phase === "prefill"
            ? "prefill"
            : "decoding";
    });
  }

  function simulate(rawOptions) {
    var options = normalizeOptions(rawOptions);
    var mode = options.mode;
    var requests = buildRequests(options.arrivalRate);
    var lastArrivalMs = requests.reduce(function (latest, request) { return Math.max(latest, request.arrivalMs); }, 0);
    var observationWindowMs = lastArrivalMs + OBSERVATION_GRACE_MS;
    var state = {
      requests: requests,
      queue: [],
      active: [],
      prefill: null,
      nextArrival: 0,
      peakQueue: 0,
      peakKvTokens: 0,
      peakReservedTokens: 0,
      events: [],
      timeline: [],
      tick: 0,
      observationWindowMs: observationWindowMs
    };

    while (
      state.tick < MAX_TICKS &&
      (state.tick + 1) * DT_MS <= observationWindowMs + 0.0001 &&
      (state.nextArrival < requests.length || state.queue.length || state.active.length || state.prefill)
    ) {
      var tick = state.tick;
      var nowMs = tick * DT_MS;
      var trace = {
        tick: tick,
        timeMs: nowMs,
        arrivals: [],
        prefillStart: "",
        prefillWork: 0,
        prefillDone: "",
        decode: [],
        done: [],
        queue: 0,
        active: 0,
        kvTokens: 0,
        notes: []
      };

      while (
        state.nextArrival < requests.length &&
        requests[state.nextArrival].arrivalMs <= nowMs + 0.0001
      ) {
        var arriving = requests[state.nextArrival];
        arriving.phase = "queued";
        state.queue.push(arriving);
        trace.arrivals.push(arriving.id);
        state.nextArrival += 1;
      }
      state.peakQueue = Math.max(state.peakQueue, state.queue.length);

      decodeOneTick(state, mode, tick, nowMs, trace);
      if (mode === "static" && state.active.length === 0 && state.prefill === null) {
        startPrefill(state, mode, options, tick, nowMs, trace);
      } else if (mode === "continuous" && state.prefill === null) {
        startPrefill(state, mode, options, tick, nowMs, trace);
      } else if (mode === "immediate" && state.active.length === 0 && state.prefill === null) {
        startPrefill(state, mode, options, tick, nowMs, trace);
      }
      completePrefill(state, tick, nowMs, trace);
      state.peakQueue = Math.max(state.peakQueue, state.queue.length);
      state.peakKvTokens = Math.max(state.peakKvTokens, totalCachedTokens(requests));
      state.peakReservedTokens = Math.max(state.peakReservedTokens, reservedTokens(requests));
      trace.queue = state.queue.length;
      trace.active = state.active.length + (state.prefill ? state.prefill.batch.length : 0);
      trace.kvTokens = totalCachedTokens(requests);
      if (!trace.arrivals.length && !trace.prefillStart && !trace.prefillWork && !trace.prefillDone && !trace.decode.length && !trace.done.length && !trace.notes.length) {
        trace.notes.push("空闲 tick");
      }
      state.events.push(trace);
      state.timeline.push({
        tick: tick,
        timeMs: nowMs,
        queue: state.queue.length,
        active: trace.active,
        kvTokens: trace.kvTokens
      });
      state.tick += 1;
    }

    enrichRequests(requests, options);
    return {
      options: options,
      constants: {
        dtMs: DT_MS,
        prefillTokensPerTick: PREFILL_TOKENS_PER_TICK,
        decodeSlots: DECODE_SLOTS,
        kvTokenMb: KV_TOKEN_MB,
        kvBudgetTokens: KV_BUDGET_TOKENS,
        kvBudgetMb: KV_BUDGET_TOKENS * KV_TOKEN_MB,
        observationGraceMs: OBSERVATION_GRACE_MS
      },
      requests: requests,
      events: state.events,
      timeline: state.timeline,
      stats: summarize(requests, options, mode, state),
      terminatedByGuard: state.tick >= MAX_TICKS,
      observationWindowMs: observationWindowMs
    };
  }

  var pureModel = {
    constants: {
      dtMs: DT_MS,
      prefillTokensPerTick: PREFILL_TOKENS_PER_TICK,
      decodeSlots: DECODE_SLOTS,
      kvTokenMb: KV_TOKEN_MB,
      kvBudgetTokens: KV_BUDGET_TOKENS,
      kvBudgetMb: KV_BUDGET_TOKENS * KV_TOKEN_MB,
      observationGraceMs: OBSERVATION_GRACE_MS
    },
    ledger: REQUEST_LEDGER,
    simulate: simulate
  };

  if (typeof module === "object" && module.exports) {
    module.exports = pureModel;
    return;
  }

  if (!host || !host.CourseLearning || typeof host.CourseLearning.register !== "function") return;

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".cl-inference-queue { --iq-blue: #356f9b; --iq-amber: #a56b13; --iq-green: #39734d; --iq-red: #b64335; --iq-muted: var(--fg-soft); margin: 1.4rem 0 2rem; color: var(--fg); }",
      "html[data-theme=\"dark\"] .cl-inference-queue { --iq-blue: #86c8f1; --iq-amber: #e4b55f; --iq-green: #79c798; --iq-red: #f08c7d; }",
      ".cl-inference-queue *, .cl-inference-queue *::before, .cl-inference-queue *::after { box-sizing: border-box; }",
      ".cl-inference-queue .iq-shell { min-width: 0; overflow: hidden; border: 1px solid var(--border); border-radius: 8px; background: var(--bg); }",
      ".cl-inference-queue .iq-header { padding: 1.05rem 1.1rem .9rem; border-bottom: 1px solid var(--border); background: var(--block-bg); }",
      ".cl-inference-queue .iq-kicker { margin: 0 0 .25rem; color: var(--accent); font-size: .76rem; font-weight: 800; letter-spacing: .04em; }",
      ".cl-inference-queue h3, .cl-inference-queue h4 { color: var(--fg); }",
      ".cl-inference-queue .iq-header h3 { margin: 0; font-size: 1.2rem; }",
      ".cl-inference-queue .iq-header p { margin: .42rem 0 0; color: var(--fg-soft); line-height: 1.55; }",
      ".cl-inference-queue .iq-controls { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .7rem; padding: .85rem 1.05rem; border-bottom: 1px solid var(--border); background: var(--block-bg); }",
      ".cl-inference-queue .iq-control { min-width: 0; display: grid; gap: .25rem; }",
      ".cl-inference-queue .iq-control > label, .cl-inference-queue .iq-control > span { color: var(--fg-soft); font-size: .78rem; font-weight: 700; }",
      ".cl-inference-queue .iq-control output { color: var(--accent); font-variant-numeric: tabular-nums; }",
      ".cl-inference-queue input[type=range] { display: block; width: 100%; min-height: 44px; margin: 0; accent-color: var(--accent); }",
      ".cl-inference-queue select, .cl-inference-queue button { min-height: 44px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--fg); font: inherit; }",
      ".cl-inference-queue select { width: 100%; padding: .45rem .55rem; }",
      ".cl-inference-queue button { padding: .45rem .7rem; cursor: pointer; font-size: .82rem; font-weight: 700; }",
      ".cl-inference-queue button:hover, .cl-inference-queue select:hover { border-color: var(--accent); }",
      ".cl-inference-queue button:focus-visible, .cl-inference-queue select:focus-visible, .cl-inference-queue input:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
      ".cl-inference-queue .iq-modes, .cl-inference-queue .iq-presets { display: flex; flex-wrap: wrap; gap: .45rem; align-items: center; }",
      ".cl-inference-queue .iq-mode-control, .cl-inference-queue .iq-modes { grid-column: 1 / -1; }",
      ".cl-inference-queue .iq-modes button[aria-pressed=true], .cl-inference-queue .iq-presets button[aria-pressed=true] { border-color: var(--accent); background: var(--accent); color: var(--bg); }",
      ".cl-inference-queue .iq-presets { grid-column: 1 / -1; padding-top: .1rem; }",
      ".cl-inference-queue .iq-body { min-width: 0; padding: 1rem 1.05rem 1.1rem; }",
      ".cl-inference-queue .iq-note { margin: 0 0 .8rem; padding: .65rem .75rem; border-left: 3px solid var(--accent); background: var(--block-bg); color: var(--fg-soft); font-size: .82rem; line-height: 1.55; }",
      ".cl-inference-queue .iq-metrics { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: .5rem; margin: .75rem 0 1rem; }",
      ".cl-inference-queue .iq-metric { min-width: 0; padding: .58rem .6rem; border-top: 2px solid var(--border); background: var(--block-bg); }",
      ".cl-inference-queue .iq-metric[data-kind=tail] { border-top-color: var(--iq-red); }",
      ".cl-inference-queue .iq-metric[data-kind=throughput] { border-top-color: var(--iq-blue); }",
      ".cl-inference-queue .iq-metric[data-kind=memory] { border-top-color: var(--iq-amber); }",
      ".cl-inference-queue .iq-metric[data-kind=good] { border-top-color: var(--iq-green); }",
      ".cl-inference-queue .iq-metric span { display: block; color: var(--fg-soft); font-size: .7rem; line-height: 1.35; }",
      ".cl-inference-queue .iq-metric strong { display: block; margin-top: .16rem; overflow-wrap: anywhere; color: var(--fg); font-size: .94rem; font-variant-numeric: tabular-nums; }",
      ".cl-inference-queue .iq-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: .85rem; align-items: start; }",
      ".cl-inference-queue .iq-card { min-width: 0; padding: .75rem; border: 1px solid var(--border); border-radius: 7px; background: var(--block-bg); }",
      ".cl-inference-queue .iq-card h4 { margin: 0 0 .55rem; font-size: .9rem; }",
      ".cl-inference-queue .iq-chart-wrap { min-width: 0; overflow: hidden; border: 1px solid var(--border); border-radius: 5px; background: var(--bg); }",
      ".cl-inference-queue .iq-chart { display: block; width: 100%; height: auto; color: var(--fg); }",
      ".cl-inference-queue .iq-chart text { fill: currentColor; font-family: inherit; letter-spacing: 0; }",
      ".cl-inference-queue .iq-legend { display: flex; flex-wrap: wrap; gap: .45rem .85rem; margin: .55rem 0 0; color: var(--fg-soft); font-size: .73rem; }",
      ".cl-inference-queue .iq-key { display: inline-flex; align-items: center; gap: .3rem; }",
      ".cl-inference-queue .iq-swatch { width: .85rem; height: .55rem; border-radius: 2px; background: var(--iq-blue); }",
      ".cl-inference-queue .iq-swatch.queue { background: var(--fg-soft); opacity: .65; } .cl-inference-queue .iq-swatch.prefill { background: var(--iq-amber); } .cl-inference-queue .iq-swatch.miss { background: var(--iq-red); }",
      ".cl-inference-queue .iq-table-scroll { max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }",
      ".cl-inference-queue table { width: 100%; border-collapse: collapse; font-size: .75rem; font-variant-numeric: tabular-nums; }",
      ".cl-inference-queue th, .cl-inference-queue td { padding: .42rem .45rem; border-bottom: 1px solid var(--border); text-align: right; white-space: nowrap; }",
      ".cl-inference-queue th:first-child, .cl-inference-queue td:first-child { text-align: left; }",
      ".cl-inference-queue th { color: var(--fg-soft); font-size: .7rem; font-weight: 750; }",
      ".cl-inference-queue td.iq-miss { color: var(--iq-red); font-weight: 750; } .cl-inference-queue td.iq-hit { color: var(--iq-green); font-weight: 750; }",
      ".cl-inference-queue .iq-trace { max-height: 280px; overflow: auto; }",
      ".cl-inference-queue .iq-trace td { white-space: normal; vertical-align: top; }",
      ".cl-inference-queue .iq-foot { margin: .75rem 0 0; color: var(--fg-soft); font-size: .74rem; line-height: 1.55; }",
      ".cl-inference-queue .iq-sr-only { position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0, 0, 0, 0) !important; white-space: nowrap !important; border: 0 !important; }",
      "@media (max-width: 1100px) { .cl-inference-queue .iq-controls { grid-template-columns: repeat(2, minmax(0, 1fr)); } .cl-inference-queue .iq-metrics { grid-template-columns: repeat(3, minmax(0, 1fr)); } .cl-inference-queue .iq-grid { grid-template-columns: minmax(0, 1fr); } }",
      "@media (max-width: 560px) { .cl-inference-queue .iq-controls, .cl-inference-queue .iq-body { padding-left: .75rem; padding-right: .75rem; } .cl-inference-queue .iq-controls { grid-template-columns: minmax(0, 1fr); } .cl-inference-queue .iq-modes, .cl-inference-queue .iq-presets { grid-column: auto; } .cl-inference-queue .iq-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } .cl-inference-queue .iq-header { padding-left: .8rem; padding-right: .8rem; } }"
    ].join("\n");
    (document.head || document.documentElement).appendChild(style);
  }

  function text(value) {
    return value === null || value === undefined ? "—" : String(value);
  }

  function formatMs(value, api) {
    return finite(value) ? api.format(value, 0) + " ms" : "—";
  }

  function formatNumber(value, digits, api) {
    return finite(value) ? api.format(value, digits) : "—";
  }

  function metric(api, label, kind) {
    var value = api.el("strong", { text: "—" });
    return {
      node: api.el("div", { className: "iq-metric", "data-kind": kind }, [
        api.el("span", { text: label }), value
      ]),
      value: value
    };
  }

  function svgText(api, x, y, content, attrs) {
    var values = Object.assign({ x: x, y: y, "font-size": 11, "aria-hidden": "true" }, attrs || {});
    return api.svg("text", values, [content]);
  }

  function buildChart(result, api, chartId) {
    var width = 860;
    var height = 470;
    var left = 58;
    var right = 18;
    var top = 28;
    var bottom = 38;
    var plotWidth = width - left - right;
    var plotHeight = height - top - bottom;
    var maxTime = result.stats.makespanMs || 1;
    var titleId = chartId + "-title";
    var descId = chartId + "-desc";
    var children = [
      api.svg("title", { id: titleId }, ["固定请求账本的服务时间线"]),
      api.svg("desc", { id: descId }, ["灰色为排队，金色为 prefill，蓝色为 decode；每行一个请求；未完成请求延伸到观察窗口并以红色虚线标记。"]),
      api.svg("rect", { x: 0, y: 0, width: width, height: height, fill: "transparent" })
    ];
    var rows = result.requests.length;
    var rowHeight = plotHeight / rows;
    var x = function (time) { return left + (time / maxTime) * plotWidth; };
    var y = function (index) { return top + index * rowHeight + rowHeight * 0.2; };

    for (var tick = 0; tick <= 5; tick += 1) {
      var tickTime = maxTime * tick / 5;
      var tickX = x(tickTime);
      children.push(api.svg("line", {
        x1: tickX, y1: top - 4, x2: tickX, y2: height - bottom,
        stroke: "currentColor", "stroke-opacity": tick === 0 ? 0.35 : 0.12, "stroke-width": 1
      }));
      children.push(svgText(api, tickX, height - 13, round(tickTime, 0) + "ms", { "text-anchor": "middle", "font-size": 10 }));
    }
    children.push(svgText(api, left, 16, "arrival → finish / observed", { "font-size": 11, "font-weight": "700" }));

    result.requests.forEach(function (request, index) {
      var rowY = y(index);
      var barHeight = Math.max(8, rowHeight * 0.58);
      var finish = request.finishMs === null ? maxTime : request.finishMs;
      var arrival = request.arrivalMs;
      var start = request.prefillStartMs === null ? finish : request.prefillStartMs;
      var prefillDone = request.prefillDoneMs === null ? start : request.prefillDoneMs;
      var first = request.firstTokenMs === null ? prefillDone : request.firstTokenMs;
      if (finish <= arrival) finish = arrival + DT_MS;
      children.push(svgText(api, left - 7, rowY + barHeight * 0.72, request.id, { "text-anchor": "end", "font-size": 10, "font-weight": "700" }));
      children.push(api.svg("rect", { x: x(arrival), y: rowY, width: Math.max(1, x(start) - x(arrival)), height: barHeight, rx: 2, fill: "var(--fg-soft)", "fill-opacity": 0.55 }));
      children.push(api.svg("rect", { x: x(start), y: rowY, width: Math.max(1, x(prefillDone) - x(start)), height: barHeight, rx: 2, fill: "var(--iq-amber)" }));
      children.push(api.svg("rect", { x: x(first), y: rowY, width: Math.max(1, x(finish) - x(first)), height: barHeight, rx: 2, fill: "var(--iq-blue)", "fill-opacity": request.censored ? 0.35 : 1 }));
      if (request.sloMet === false || request.censored) {
        children.push(api.svg("rect", { x: x(arrival), y: rowY - 2, width: Math.max(2, x(finish) - x(arrival)), height: barHeight + 4, rx: 3, fill: "none", stroke: "var(--iq-red)", "stroke-width": 1.5, "stroke-dasharray": request.censored ? "5 3" : "none" }));
      }
    });
    return api.svg("svg", {
      className: "iq-chart",
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      "aria-labelledby": titleId + " " + descId,
      focusable: "false"
    }, children);
  }

  function modeButton(api, mode, current, onChange) {
    return api.el("button", {
      type: "button",
      text: MODES[mode].label,
      "aria-pressed": current === mode ? "true" : "false",
      onclick: function () { onChange(mode); }
    });
  }

  function compareTable(api, results, selectedMode) {
    var head = api.el("thead", {}, [api.el("tr", {}, [
      api.el("th", { text: "策略" }),
      api.el("th", { text: "E2E p50" }),
      api.el("th", { text: "E2E p95" }),
      api.el("th", { text: "SLO goodput" }),
      api.el("th", { text: "请求/s" }),
      api.el("th", { text: "峰值 KV" }),
      api.el("th", { text: "未完成 / backlog" })
    ])]);
    var body = api.el("tbody");
    Object.keys(MODES).forEach(function (mode) {
      var result = results[mode];
      var row = api.el("tr", { className: mode === selectedMode ? "iq-selected" : "" }, [
        api.el("th", { scope: "row", text: MODES[mode].short }),
        api.el("td", { text: formatMs(result.stats.p50E2e, api) + (result.stats.tailCensored ? "†" : "") }),
        api.el("td", { text: formatMs(result.stats.p95E2e, api) + (result.stats.tailCensored ? "†" : "") }),
        api.el("td", { text: formatNumber(result.stats.goodputRatio * 100, 0, api) + "% / " + formatNumber(result.stats.goodputRps, 2, api) + " req/s" }),
        api.el("td", { text: formatNumber(result.stats.throughputRps, 2, api) }),
        api.el("td", { text: formatNumber(result.stats.peakKvMb, 2, api) + " MB cache / " + formatNumber(result.stats.peakReservedMb, 2, api) + " MB reserved" }),
        api.el("td", { text: result.stats.unfinished + " / " + result.stats.backlogAtEnd })
      ]);
      body.appendChild(row);
    });
    return api.el("div", { className: "iq-table-scroll" }, [api.el("table", {}, [head, body])]);
  }

  function requestTable(api, result) {
    var head = api.el("thead", {}, [api.el("tr", {}, [
      api.el("th", { text: "请求" }),
      api.el("th", { text: "到达" }),
      api.el("th", { text: "排队" }),
      api.el("th", { text: "prefill" }),
      api.el("th", { text: "TTFT" }),
      api.el("th", { text: "TPOT" }),
      api.el("th", { text: "E2E" }),
      api.el("th", { text: "SLO" }),
      api.el("th", { text: "KV" }),
      api.el("th", { text: "状态" })
    ])]);
    var body = api.el("tbody");
    result.requests.forEach(function (request) {
      body.appendChild(api.el("tr", {}, [
        api.el("th", { scope: "row", text: request.id + " · " + request.kind }),
        api.el("td", { text: formatMs(request.arrivalMs, api) }),
        api.el("td", { text: formatMs(request.queueDelayMs, api) }),
        api.el("td", { text: formatMs(request.prefillMs, api) }),
        api.el("td", { text: formatMs(request.ttftMs, api) }),
        api.el("td", { text: formatMs(request.tpotMs, api) }),
        api.el("td", { text: request.finishMs === null ? "未完成†" : formatMs(request.e2eMs, api) }),
        api.el("td", { className: request.sloMet === true ? "iq-hit" : "iq-miss", text: request.sloMet === true ? "通过" : request.sloMet === false ? "超时" : "—" }),
        api.el("td", { text: formatNumber(request.kvTokens, 0, api) + " tok" }),
        api.el("td", { text: request.status === "completed" ? "完成" : request.status === "queued" ? "队列" : request.status === "prefill" ? "prefill" : "decode" })
      ]));
    });
    return api.el("div", { className: "iq-table-scroll" }, [api.el("table", {}, [head, body])]);
  }

  function traceTable(api, result) {
    var meaningful = result.events.filter(function (event) {
      return event.arrivals.length || event.prefillStart || event.prefillDone || event.decode.length || event.done.length || event.notes.indexOf("空闲 tick") === -1;
    });
    var display = meaningful.length > 32 ? meaningful.slice(0, 20).concat(meaningful.slice(-12)) : meaningful;
    var body = api.el("tbody");
    display.forEach(function (event, index) {
      var note = event.notes.join("；");
      if (meaningful.length > 32 && index === 20) {
        note = "…中间 " + (meaningful.length - 32) + " 个事件 tick 已折叠…；" + (note || "该行是折叠后的首条记录");
      }
      body.appendChild(api.el("tr", {}, [
        api.el("th", { scope: "row", text: "t=" + event.tick + " / " + event.timeMs + "ms" }),
        api.el("td", { text: event.arrivals.join("、") || "—" }),
        api.el("td", { text: event.prefillStart || "—" }),
        api.el("td", { text: event.decode.join("、") || "—" }),
        api.el("td", { text: event.done.join("、") || "—" }),
        api.el("td", { text: "q=" + event.queue + ", active=" + event.active + ", KV=" + event.kvTokens + " · " + (note || "—") })
      ]));
    });
    return api.el("div", { className: "iq-table-scroll iq-trace" }, [api.el("table", {}, [
      api.el("thead", {}, [api.el("tr", {}, [
        api.el("th", { text: "tick" }), api.el("th", { text: "到达" }), api.el("th", { text: "prefill" }), api.el("th", { text: "decode" }), api.el("th", { text: "完成" }), api.el("th", { text: "账本" })
      ])]), body
    ])]);
  }

  function buildLab(root, api) {
    installStyles();
    root.classList.add("cl-inference-queue");
    var instanceId = "iq-" + (++INSTANCE_COUNT);
    var state = {
      mode: DEFAULTS.mode,
      arrivalRate: DEFAULTS.arrivalRate,
      batchSize: DEFAULTS.batchSize,
      waitTicks: DEFAULTS.waitTicks,
      slo: DEFAULTS.slo
    };

    var modeButtons = api.el("div", { className: "iq-modes", role: "group", "aria-label": "服务策略" });
    var rateOutput = api.el("output", { text: "" });
    var batchOutput = api.el("output", { text: "" });
    var waitOutput = api.el("output", { text: "" });
    var sloOutput = api.el("output", { text: "" });
    var modeControl = api.el("div", { className: "iq-control iq-mode-control" }, [api.el("span", { text: "详细账本策略" }), modeButtons]);
    var rateInput = api.el("input", { type: "range", min: "0.5", max: "15", step: "0.1", value: state.arrivalRate, "aria-label": "名义到达率" });
    var batchInput = api.el("input", { type: "range", min: "1", max: "6", step: "1", value: state.batchSize, "aria-label": "最大 batch 大小" });
    var waitInput = api.el("input", { type: "range", min: "0", max: "6", step: "1", value: state.waitTicks, "aria-label": "最大等待 tick" });
    var sloInput = api.el("input", { type: "range", min: "800", max: "3000", step: "100", value: state.slo, "aria-label": "SLO" });
    var controls = [
      modeControl,
      api.el("div", { className: "iq-control" }, [api.el("label", { htmlFor: instanceId + "-rate", text: "到达率 λ" }), rateOutput, rateInput]),
      api.el("div", { className: "iq-control" }, [api.el("label", { htmlFor: instanceId + "-batch", text: "最大 batch" }), batchOutput, batchInput]),
      api.el("div", { className: "iq-control" }, [api.el("label", { htmlFor: instanceId + "-wait", text: "收集 / 最大等待" }), waitOutput, waitInput]),
      api.el("div", { className: "iq-control" }, [api.el("label", { htmlFor: instanceId + "-slo", text: "E2E SLO" }), sloOutput, sloInput])
    ];
    rateInput.id = instanceId + "-rate";
    batchInput.id = instanceId + "-batch";
    waitInput.id = instanceId + "-wait";
    sloInput.id = instanceId + "-slo";

    var presets = api.el("div", { className: "iq-presets", role: "group", "aria-label": "固定场景" });
    var presetButtons = [];
    var output = api.el("div", { className: "iq-output" });
    var shell = api.el("div", { className: "iq-shell" }, [
      api.el("div", { className: "iq-header" }, [
        api.el("p", { className: "iq-kicker", text: "CourseLearning · inference-queue" }),
        api.el("h3", { text: "同一份 toy ledger，换调度策略" }),
        api.el("p", { text: "固定硬件容量：每 tick prefill 24 token、decode 3 个并行 slot、KV-cache 预算 72 token。数值只用于推理服务的概念实验，不是任何厂商或产品的 benchmark。" })
      ]),
      api.el("div", { className: "iq-controls" }, controls.concat([presets])),
      api.el("div", { className: "iq-body" }, [output])
    ]);

    root.replaceChildren(shell);

    function setState(partial) {
      var next = normalizeOptions(Object.assign({}, state, partial));
      state.mode = next.mode;
      state.arrivalRate = next.arrivalRate;
      state.batchSize = next.batchSize;
      state.waitTicks = next.waitTicks;
      state.slo = next.slo;
      rateInput.value = state.arrivalRate;
      batchInput.value = state.batchSize;
      waitInput.value = state.waitTicks;
      sloInput.value = state.slo;
      render();
    }

    function presetButton(label, values, tracksState) {
      var button = api.el("button", { type: "button", text: label });
      button.addEventListener("click", function () { setState(values); });
      presets.appendChild(button);
      if (tracksState) presetButtons.push({ button: button, values: normalizeOptions(values) });
    }

    presetButton("平稳：连续 batching", { mode: "continuous", arrivalRate: 1.2, batchSize: 4, waitTicks: 2, slo: 1600 }, true);
    presetButton("过载：窗口末仍未完成", { mode: "continuous", arrivalRate: 15, batchSize: 4, waitTicks: 1, slo: 1400 }, true);
    presetButton("头阻塞：单请求 / FCFS", { mode: "immediate", arrivalRate: 1.2, batchSize: 1, waitTicks: 0, slo: 1600 }, true);
    presetButton("重置", DEFAULTS, false);

    Object.keys(MODES).forEach(function (mode) {
      modeButtons.appendChild(modeButton(api, mode, state.mode, function (value) { setState({ mode: value }); }));
    });
    rateInput.addEventListener("input", function () { setState({ arrivalRate: Number(rateInput.value) }); });
    batchInput.addEventListener("input", function () { setState({ batchSize: Number(batchInput.value) }); });
    waitInput.addEventListener("input", function () { setState({ waitTicks: Number(waitInput.value) }); });
    sloInput.addEventListener("input", function () { setState({ slo: Number(sloInput.value) }); });

    function render() {
      var options = normalizeOptions(state);
      var results = {};
      Object.keys(MODES).forEach(function (mode) {
        results[mode] = simulate(Object.assign({}, options, { mode: mode }));
      });
      var result = results[options.mode];
      rateOutput.textContent = formatNumber(options.arrivalRate, 1, api) + " req/s";
      batchOutput.textContent = options.mode === "immediate" ? "1（策略固定）" : options.batchSize + " 条";
      waitOutput.textContent = options.waitTicks + " tick = " + (options.waitTicks * DT_MS) + " ms";
      sloOutput.textContent = options.slo + " ms";
      modeButtons.querySelectorAll("button").forEach(function (button, index) {
        var mode = Object.keys(MODES)[index];
        button.setAttribute("aria-pressed", mode === options.mode ? "true" : "false");
      });
      presetButtons.forEach(function (item) {
        var values = item.values;
        var active = values.mode === options.mode &&
          values.arrivalRate === options.arrivalRate &&
          values.batchSize === options.batchSize &&
          values.waitTicks === options.waitTicks &&
          values.slo === options.slo;
        item.button.setAttribute("aria-pressed", active ? "true" : "false");
      });

      var peakNote = result.stats.peakQueue > 0
        ? "峰值队列 " + result.stats.peakQueue + "；先看尾延迟与 goodput，再谈吞吐。"
        : "此设置下没有形成等待队列；仍要检查 KV-cache 与 SLO。";
      var censorNote = result.stats.tailCensored
        ? "† 尾延迟只来自已完成的 " + result.stats.tailSampleCount + "/" + result.stats.total + " 个请求，不能当作全体 p95/p99；观察窗口末仍有 " + result.stats.unfinished + " 个未完成（队列 " + result.stats.backlogAtEnd + "，prefill " + result.stats.unfinishedPrefill + "，decode " + result.stats.unfinishedDecode + ")."
        : "本次观察窗口内 ledger 的 16/16 个请求都完成，尾延迟覆盖全体请求。";
      var boundaryNote = result.stats.holWarning
        ? "观察到头阻塞边界：R01 是长请求，R02–R04 是短请求；当前策略让短请求不能在 R01 完成前释放。"
        : options.mode === "continuous"
          ? "连续 batching 让短请求进入 ready 集，和长请求竞争后续 decode 服务机会；这不是降低了每个 token 的工作量。"
          : "当前窗口没有触发预设的头阻塞判据；请仍以请求级完成时刻核对，而不是只看策略名称。";
      if (result.terminatedByGuard) boundaryNote = "模拟达到安全 tick 上限；把它当作过载警报，而不是无限等待的真实测量。";

      var tailMarker = result.stats.tailCensored ? "†" : "";
      var metrics = [
        metric(api, "E2E p50", "tail"), metric(api, "E2E p95", "tail"), metric(api, "E2E p99", "tail"),
        metric(api, "TTFT p95", "tail"), metric(api, "goodput / SLO", "good"), metric(api, "峰值并发", "throughput"),
        metric(api, "请求吞吐", "throughput"), metric(api, "decode token 吞吐", "throughput"), metric(api, "平均并发 L", "throughput"),
        metric(api, "峰值 KV-cache", "memory"), metric(api, "未完成 / backlog", "memory"), metric(api, "峰值队列", "memory"), metric(api, "SLO 通过", "good")
      ];
      metrics[0].value.textContent = formatMs(result.stats.p50E2e, api) + tailMarker;
      metrics[1].value.textContent = formatMs(result.stats.p95E2e, api) + tailMarker;
      metrics[2].value.textContent = formatMs(result.stats.p99E2e, api) + tailMarker;
      metrics[3].value.textContent = formatMs(result.stats.p95Ttft, api);
      metrics[4].value.textContent = formatNumber(result.stats.goodputRps, 2, api) + " req/s";
      metrics[5].value.textContent = formatNumber(result.stats.peakConcurrency, 0, api);
      metrics[6].value.textContent = formatNumber(result.stats.throughputRps, 2, api) + " req/s";
      metrics[7].value.textContent = formatNumber(result.stats.tokenThroughput, 2, api) + " tok/s";
      metrics[8].value.textContent = formatNumber(result.stats.averageConcurrency, 2, api);
      metrics[9].value.textContent = formatNumber(result.stats.peakKvMb, 2, api) + " cache；" + formatNumber(result.stats.peakReservedMb, 2, api) + " / " + formatNumber(result.stats.kvBudgetMb, 2, api) + " MB reserved";
      metrics[10].value.textContent = result.stats.unfinished + " / " + result.stats.backlogAtEnd;
      metrics[11].value.textContent = formatNumber(result.stats.peakQueue, 0, api);
      metrics[12].value.textContent = result.stats.good + " / " + result.stats.total + "（" + formatNumber(result.stats.goodputRatio * 100, 0, api) + "%）";

      var note = api.el("p", { className: "iq-note", text: peakNote + " " + boundaryNote + " " + censorNote });
      var chartCard = api.el("section", { className: "iq-card" }, [
        api.el("h4", { text: MODES[options.mode].label + "：时间线与阶段账本" }),
        api.el("div", { className: "iq-chart-wrap" }, [buildChart(result, api, instanceId + "-chart")]),
        api.el("div", { className: "iq-legend", "aria-label": "时间线图例" }, [
          api.el("span", { className: "iq-key" }, [api.el("i", { className: "iq-swatch queue", "aria-hidden": "true" }), "排队 / queue delay"]),
          api.el("span", { className: "iq-key" }, [api.el("i", { className: "iq-swatch prefill", "aria-hidden": "true" }), "prefill / TTFT 前半段"]),
          api.el("span", { className: "iq-key" }, [api.el("i", { className: "iq-swatch", "aria-hidden": "true" }), "decode / TPOT"]),
          api.el("span", { className: "iq-key" }, [api.el("i", { className: "iq-swatch miss", "aria-hidden": "true" }), "红框：超过 SLO"])
        ])
      ]);
      var compareCard = api.el("section", { className: "iq-card" }, [
        api.el("h4", { text: "同一 λ、batch、wait、SLO 下的三策略对照" }),
        compareTable(api, results, options.mode),
        api.el("p", { className: "iq-foot", text: "吞吐分母是固定观察窗口（最后到达 + 1.4 s），而不是把未完成请求删掉后的幸运 makespan；goodput 只计在 SLO 内完成的请求。† 表示尾延迟只来自已完成样本，存在删失。不要把它们读成稳定系统的长期服务率。" })
      ]);
      var requestCard = api.el("section", { className: "iq-card" }, [
        api.el("h4", { text: "请求级账本：把 TTFT、TPOT、E2E 拆开" }),
        requestTable(api, result)
      ]);
      var traceCard = api.el("section", { className: "iq-card" }, [
        api.el("h4", { text: "tick / event 审计：调度器每一步做了什么" }),
        traceTable(api, result),
        api.el("p", { className: "iq-foot", text: "每个 tick 先接收到达，再给既有 decode 请求发 token，随后按策略启动可接纳的 prefill，最后推进 prefill；所以刚完成 prefill 的请求从下一个 tick 才能拿到首 token。观察窗口结束时仍在队列、prefill 或 decode 的请求会保留为未完成，不会被尾延迟统计偷偷丢掉。" })
      ]);
      output.replaceChildren(
        note,
        api.el("div", { className: "iq-metrics" }, metrics.map(function (item) { return item.node; })),
        api.el("div", { className: "iq-grid" }, [chartCard, compareCard]),
        requestCard,
        traceCard
      );
      api.announce(root, MODES[options.mode].short + "策略已更新：E2E p95 " + formatMs(result.stats.p95E2e, api) + "，SLO 通过 " + result.stats.good + "/" + result.stats.total);
    }

    render();
  }

  host.CourseLearning.register("inference-queue", buildLab);
})(typeof window !== "undefined" ? window : null);
