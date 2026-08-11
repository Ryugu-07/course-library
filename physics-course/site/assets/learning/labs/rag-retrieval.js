(function () {
  "use strict";

  if (
    typeof window === "undefined" ||
    !window.CourseLearning ||
    typeof window.CourseLearning.register !== "function"
  ) {
    return;
  }

  var STYLE_ID = "cl-rag-retrieval-styles";
  var INSTANCE = 0;
  var DEFAULTS = {
    queryId: "topk-noise",
    scoreMode: "lexical",
    chunkSize: 14,
    overlap: 2,
    topK: 3,
    budget: 42,
    rerank: false
  };

  /* 每个 fact 既是可审计证据单元，也是结构感知切块的段落边界。 */
  var SOURCES = [
    {
      id: "S1",
      title: "RAG 运行规约",
      facts: [
        {
          id: "citation-truth",
          label: "引用边界",
          text: "citation 只能 指出 来源 位置 不能 保证 来源 内容 本身 为真；回答 只能 主张 证据 明确 支持 的结论。"
        },
        {
          id: "multi-evidence",
          label: "多证据",
          text: "多证据 问题 需要 把 不同 片段 的条件 合并；命中 一个 相关 片段 不等于 答案 完整。"
        }
      ]
    },
    {
      id: "S2",
      title: "分块实验记录",
      facts: [
        {
          id: "chunking-tradeoff",
          label: "分块权衡",
          text: "chunk size 较小 边界 更细 但 一个 事实 可能 跨块；overlap 可以 保留 邻接 上下文 也会 增加 重复 与 context budget。"
        },
        {
          id: "topk-tradeoff",
          label: "top-k 权衡",
          text: "增大 top-k 往往 提高 召回 也可能 带来 噪声 上下文；需要 同时 评估 precision 与 预算。"
        }
      ]
    },
    {
      id: "S3",
      title: "检索评分手册",
      facts: [
        {
          id: "toy-score",
          label: "toy 评分边界",
          text: "lexical score 只数 query 与 chunk 共享 词面；toy semantic score 使用 手工 同义词簇，不是 真实 embedding，也不代表 真实 语义 理解。"
        },
        {
          id: "rerank-boundary",
          label: "重排边界",
          text: "rerank 可以 在 候选 集 内 用 更精细 的 规则 调整 顺序；它 不能 找回 没有 被 召回 的片段。"
        }
      ]
    },
    {
      id: "S4",
      title: "部署检查表",
      facts: [
        {
          id: "budget-abstain",
          label: "预算与拒答",
          text: "answerability 需要 所有 必要 证据 片段 在 context budget 内；缺少 关键 片段 时 应 abstain 而不是 补写。"
        },
        {
          id: "citation-support",
          label: "引用绑定",
          text: "生成 前 应为 每个 结论 绑定 citation；若引用片段 只有 相关 词 而没有 支持 该结论，citation 仍不支持 结论。"
        }
      ]
    },
    {
      id: "S5",
      title: "模型外部事实",
      facts: [
        {
          id: "temperature-boundary",
          label: "采样边界",
          text: "temperature 只改变 采样 分布 的形状；它不会 自动 修复 检索 召回 或 证据 缺口。"
        },
        {
          id: "cache-boundary",
          label: "缓存边界",
          text: "prompt caching 的 成本 与 命中 条件 取决于 服务商 规则；不能 把 某个 折扣 当作 普遍 规律。"
        }
      ]
    },
    {
      id: "S6",
      title: "人工同义词表",
      facts: [
        {
          id: "synonym-table",
          label: "toy 同义词",
          text: "toy 同义词簇 示例：检索 retrieval 查找；证据 evidence 依据；召回 recall 找全；拒答 abstain 放弃回答。"
        }
      ]
    }
  ];

  var QUERIES = [
    {
      id: "topk-noise",
      label: "多证据：top-k 与上下文噪声",
      text: "怎样在提高 top-k 召回时避免噪声并保持答案受支持？",
      terms: ["top-k", "召回", "噪声", "预算", "支持"],
      focusTerms: ["top-k", "噪声", "预算", "支持"],
      requiredFacts: ["topk-tradeoff", "budget-abstain"],
      relevantFacts: ["topk-tradeoff", "budget-abstain", "citation-support"],
      answerable: true,
      supportedAnswer: "先用 top-k 提高候选召回，再检查预算能否装入所有必要片段；噪声过多或关键片段缺失时应 abstain。",
      abstainAnswer: "当前 context 没有覆盖所有必要事实，不能给出完整建议，应 abstain。"
    },
    {
      id: "overlap",
      label: "可回答：overlap 的收益与代价",
      text: "overlap 为什么可能有用又有代价？",
      terms: ["overlap", "有用", "代价", "边界", "重复"],
      focusTerms: ["overlap", "边界", "重复", "预算"],
      requiredFacts: ["chunking-tradeoff"],
      relevantFacts: ["chunking-tradeoff"],
      answerable: true,
      supportedAnswer: "overlap 可以保留跨边界的邻接上下文，但会复制 token、占用更多 context budget；收益与代价要在目标语料上评估。",
      abstainAnswer: "还没有覆盖完整的分块事实，不能安全概括 overlap 的权衡。"
    },
    {
      id: "citation",
      label: "多证据：citation 是否保证真实性",
      text: "citation 能保证来源内容真实并支持每个结论吗？",
      terms: ["citation", "来源", "真实", "支持", "结论"],
      focusTerms: ["citation", "真实", "支持", "结论"],
      requiredFacts: ["citation-truth", "citation-support"],
      relevantFacts: ["citation-truth", "citation-support"],
      answerable: true,
      supportedAnswer: "不能保证来源本身真实；citation 只在实际片段命题级支持结论时，提供可追溯的证据链接。",
      abstainAnswer: "当前只覆盖了部分引用边界，不能把 citation 的作用概括成完整结论。"
    },
    {
      id: "abstain",
      label: "可回答：什么时候应 abstain",
      text: "什么时候应当 abstain 而不是补写？",
      terms: ["abstain", "必要", "证据", "补写", "预算"],
      focusTerms: ["abstain", "必要", "证据", "预算"],
      requiredFacts: ["budget-abstain"],
      relevantFacts: ["budget-abstain", "multi-evidence"],
      answerable: true,
      supportedAnswer: "当必要证据缺失或没有进入 context budget 时，应 abstain，而不是让生成器补写缺口。",
      abstainAnswer: "必要事实未完整进入 context，当前应该 abstain。"
    },
    {
      id: "unknown-dimension",
      label: "不可回答：embedding 维度",
      text: "这套课程使用的 embedding 模型具体是多少维？",
      terms: ["embedding", "模型", "具体", "维度"],
      focusTerms: ["embedding", "维度", "dimension"],
      requiredFacts: [],
      relevantFacts: ["toy-score"],
      answerable: false,
      supportedAnswer: "",
      abstainAnswer: "语料只说明本实验不是实际 embedding，没有给出维度；应明确 abstain。"
    }
  ];

  var SYNONYM_GROUPS = [
    ["检索", "retrieval", "查找"],
    ["证据", "evidence", "依据", "支持", "support"],
    ["召回", "recall", "找全"],
    ["回答", "答案", "结论", "answer"],
    ["拒答", "abstain", "放弃回答"],
    ["噪声", "noise", "无关"],
    ["分块", "切块", "chunk", "chunking"],
    ["重叠", "overlap"],
    ["引用", "citation"],
    ["真实", "真", "为真", "truth"],
    ["预算", "budget"],
    ["向量", "embedding"],
    ["维度", "dimension"],
    ["重排", "rerank"]
  ];

  var FACT_LABELS = Object.create(null);
  var QUERY_LOOKUP = Object.create(null);
  var SYNONYM_LOOKUP = Object.create(null);

  SOURCES.forEach(function (source) {
    source.facts.forEach(function (fact) {
      FACT_LABELS[fact.id] = source.id + " · " + fact.label;
    });
  });
  QUERIES.forEach(function (query) {
    QUERY_LOOKUP[query.id] = query;
  });
  SYNONYM_GROUPS.forEach(function (group, index) {
    var key = "g" + index;
    group.forEach(function (term) {
      SYNONYM_LOOKUP[normaliseToken(term)] = key;
    });
  });

  function normaliseToken(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[，。；：、？！“”‘’（）()［］【】,.!?;:]/g, "")
      .trim();
  }

  function tokenise(value) {
    return String(value || "")
      .split(/\s+/)
      .map(normaliseToken)
      .filter(Boolean);
  }

  function unique(values) {
    var seen = Object.create(null);
    return values.filter(function (value) {
      if (seen[value]) return false;
      seen[value] = true;
      return true;
    });
  }

  function pad(number) {
    return number < 10 ? "0" + number : String(number);
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function pct(value) {
    return value === null ? "n/a" : Math.round(value * 100) + "%";
  }

  function scoreText(value) {
    return Math.round(value * 100) + "%";
  }

  function concept(term, semantic) {
    var normal = normaliseToken(term);
    return semantic && SYNONYM_LOOKUP[normal]
      ? SYNONYM_LOOKUP[normal]
      : "t:" + normal;
  }

  function matchTerms(queryTerms, chunkTerms, semantic) {
    var chunkConcepts = Object.create(null);
    var chunkSet = Object.create(null);
    chunkTerms.forEach(function (term) {
      chunkSet[normaliseToken(term)] = true;
      chunkConcepts[concept(term, semantic)] = true;
    });
    var hits = [];
    var actual = [];
    unique(queryTerms.map(normaliseToken)).forEach(function (term) {
      var key = concept(term, semantic);
      if (!chunkConcepts[key]) return;
      hits.push(term);
      if (!semantic || !SYNONYM_LOOKUP[term]) {
        actual.push(term);
        return;
      }
      var group = SYNONYM_GROUPS[Number(SYNONYM_LOOKUP[term].slice(1))] || [];
      var found = group.map(normaliseToken).find(function (candidate) {
        return chunkSet[candidate];
      });
      actual.push(found || term);
    });
    return {
      hits: hits,
      actual: actual,
      score: queryTerms.length ? hits.length / unique(queryTerms.map(normaliseToken)).length : 0
    };
  }

  function buildChunks(size, overlap) {
    var chunks = [];
    var facts = Object.create(null);
    var chunkNumber = 0;
    var safeSize = clamp(Number(size) || DEFAULTS.chunkSize, 6, 24);
    var safeOverlap = clamp(Number(overlap) || 0, 0, Math.min(6, safeSize - 1));

    SOURCES.forEach(function (source) {
      var tokens = [];
      var spans = [];
      source.facts.forEach(function (fact) {
        var start = tokens.length;
        tokenise(fact.text).forEach(function (token) {
          tokens.push(token);
        });
        var end = tokens.length;
        spans.push({ id: fact.id, start: start, end: end });
        facts[fact.id] = {
          id: fact.id,
          label: fact.label,
          sourceId: source.id,
          start: start,
          end: end,
          length: end - start
        };
      });

      var step = Math.max(1, safeSize - safeOverlap);
      spans.forEach(function (span) {
        var startAt = span.start;
        while (startAt < span.end) {
          var endAt = Math.min(span.end, startAt + safeSize);
          var chunkTokens = tokens.slice(startAt, endAt);
          chunkNumber += 1;
          chunks.push({
            id: "C" + pad(chunkNumber),
            sourceId: source.id,
            sourceTitle: source.title,
            start: startAt,
            end: endAt,
            tokens: chunkTokens,
            text: chunkTokens.join(" "),
            factIds: [span.id],
            completeFactIds:
              startAt === span.start && endAt === span.end ? [span.id] : [],
            order: chunkNumber
          });
          if (endAt === span.end) break;
          startAt += step;
        }
      });
    });

    return { chunks: chunks, facts: facts, size: safeSize, overlap: safeOverlap };
  }

  function sortBy(items, key) {
    return items.slice().sort(function (a, b) {
      var difference = b[key] - a[key];
      return Math.abs(difference) > 1e-9 ? difference : a.order - b.order;
    });
  }

  function coverage(requiredFacts, packed, facts) {
    return requiredFacts.map(function (factId) {
      var fact = facts[factId];
      if (!fact) {
        return { id: factId, label: factId, covered: 0, total: 0, state: "missing" };
      }
      var covered = 0;
      var position;
      for (position = fact.start; position < fact.end; position += 1) {
        if (
          packed.some(function (item) {
            var chunk = item.chunk || item;
            return (
              chunk.sourceId === fact.sourceId &&
              chunk.start <= position &&
              position < chunk.end
            );
          })
        ) {
          covered += 1;
        }
      }
      return {
        id: factId,
        label: facts[factId].label,
        covered: covered,
        total: fact.length,
        state: covered === 0 ? "missing" : covered === fact.length ? "complete" : "partial"
      };
    });
  }

  function hasFact(chunk, factIds) {
    return chunk.factIds.some(function (factId) {
      return factIds.indexOf(factId) !== -1;
    });
  }

  function compute(state) {
    var built = buildChunks(state.chunkSize, state.overlap);
    var query = QUERY_LOOKUP[state.queryId] || QUERIES[0];
    var ranked = built.chunks.map(function (chunk) {
      var match = matchTerms(query.terms, chunk.tokens, state.scoreMode === "semantic");
      return {
        chunk: chunk,
        baseScore: match.score,
        finalScore: match.score,
        match: match,
        rerankBonus: 0,
        order: chunk.order,
        initialRank: 0,
        finalRank: 0,
        inCandidate: false,
        retrieved: false,
        packed: false
      };
    });
    ranked = sortBy(ranked, "baseScore");
    ranked.forEach(function (item, index) {
      item.initialRank = index + 1;
    });

    var candidateCount = Math.min(ranked.length, Math.max(Number(state.topK) + 2, 5));
    var candidate = ranked.slice(0, candidateCount);
    candidate.forEach(function (item) {
      item.inCandidate = true;
    });
    if (state.rerank) {
      candidate.forEach(function (item) {
        var focus = matchTerms(
          query.focusTerms,
          item.chunk.tokens,
          state.scoreMode === "semantic"
        );
        item.rerankBonus = focus.score * 0.24;
        item.finalScore = item.baseScore + item.rerankBonus;
      });
      candidate = sortBy(candidate, "finalScore");
    } else {
      candidate = ranked.slice(0, candidateCount);
    }
    var finalRankItems = state.rerank ? candidate : ranked;
    finalRankItems.forEach(function (item, index) {
      item.finalRank = index + 1;
    });

    var retrieved = candidate.slice(0, clamp(Number(state.topK) || 3, 1, 6));
    retrieved.forEach(function (item) {
      item.retrieved = true;
    });
    var packed = [];
    var skipped = [];
    var used = 0;
    retrieved.forEach(function (item) {
      if (used + item.chunk.tokens.length <= Number(state.budget)) {
        item.packed = true;
        packed.push(item);
        used += item.chunk.tokens.length;
      } else {
        skipped.push(item);
      }
    });

    var factStates = coverage(query.requiredFacts, packed, built.facts);
    var completeCount = factStates.filter(function (item) {
      return item.state === "complete";
    }).length;
    var partialCount = factStates.filter(function (item) {
      return item.state === "partial";
    }).length;
    var relevantCount = packed.filter(function (item) {
      return hasFact(item.chunk, query.relevantFacts);
    }).length;
    var answerableNow =
      query.answerable &&
      query.requiredFacts.length > 0 &&
      completeCount === query.requiredFacts.length;
    var statusText;
    var statusClass;
    if (!query.answerable) {
      statusText = "不可回答 · 应 abstain";
      statusClass = "rr-warn";
    } else if (answerableNow) {
      statusText = "可回答 · 必要证据已覆盖";
      statusClass = "rr-good";
    } else if (partialCount > 0) {
      statusText = "部分证据 · 不能下完整结论";
      statusClass = "rr-warn";
    } else {
      statusText = "缺少证据 · 应 abstain";
      statusClass = "rr-warn";
    }

    return {
      query: query,
      chunks: built.chunks,
      facts: built.facts,
      ranking: ranked,
      candidate: candidate,
      retrieved: retrieved,
      packed: packed,
      skipped: skipped,
      used: used,
      budget: Number(state.budget),
      factStates: factStates,
      completeCount: completeCount,
      relevantCount: relevantCount,
      precision: packed.length ? relevantCount / packed.length : 0,
      recall: query.requiredFacts.length
        ? completeCount / query.requiredFacts.length
        : null,
      answerableNow: answerableNow,
      statusText: statusText,
      statusClass: statusClass
    };
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".cl-rag-retrieval { --rr-bg: var(--bg, #fffdf8); --rr-panel: var(--block-bg, #f4f1e9); --rr-fg: var(--fg, #2e2b25); --rr-soft: var(--fg-soft, #70695e); --rr-border: var(--border, #d8d0c1); --rr-accent: var(--accent, #8a5a2b); --rr-blue: #326e9f; --rr-good: #39734d; --rr-warn: #a54831; margin: 1.5rem 0 2rem; color: var(--rr-fg); font-size: .93rem; line-height: 1.5; }",
      "html[data-theme=\"dark\"] .cl-rag-retrieval { --rr-bg: #202326; --rr-panel: #2d3034; --rr-fg: #eee9df; --rr-soft: #b8b2a7; --rr-border: #555a61; --rr-accent: #d49b61; --rr-blue: #86c7ff; --rr-good: #86cf9b; --rr-warn: #f18c79; }",
      ".cl-rag-retrieval *, .cl-rag-retrieval *::before, .cl-rag-retrieval *::after { box-sizing: border-box; }",
      ".cl-rag-retrieval .rr-shell { overflow: hidden; border: 1px solid var(--rr-border); border-radius: 8px; background: var(--rr-bg); }",
      ".cl-rag-retrieval .rr-header { padding: 1rem 1.1rem .9rem; border-bottom: 1px solid var(--rr-border); background: var(--rr-panel); }",
      ".cl-rag-retrieval .rr-kicker { margin: 0 0 .2rem; color: var(--rr-accent); font-size: .72rem; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; }",
      ".cl-rag-retrieval h3, .cl-rag-retrieval h4 { color: var(--rr-fg); }",
      ".cl-rag-retrieval .rr-header h3 { margin: 0; font-size: 1.2rem; }",
      ".cl-rag-retrieval .rr-header p:last-child { margin: .35rem 0 0; color: var(--rr-soft); }",
      ".cl-rag-retrieval .rr-controls { display: grid; grid-template-columns: minmax(220px, 1.35fr) repeat(4, minmax(125px, 1fr)); gap: .65rem; padding: .85rem 1rem; border-bottom: 1px solid var(--rr-border); background: var(--rr-panel); }",
      ".cl-rag-retrieval .rr-fieldset { min-width: 0; margin: 0; padding: .55rem .65rem .65rem; border: 1px solid var(--rr-border); border-radius: 6px; }",
      ".cl-rag-retrieval .rr-fieldset legend, .cl-rag-retrieval .rr-field-label { padding: 0 .2rem; color: var(--rr-soft); font-size: .76rem; font-weight: 800; }",
      ".cl-rag-retrieval label { color: var(--rr-soft); font-size: .8rem; font-weight: 700; }",
      ".cl-rag-retrieval select, .cl-rag-retrieval button { width: 100%; min-height: 44px; padding: .45rem .6rem; border: 1px solid var(--rr-border); border-radius: 6px; background: var(--rr-bg); color: var(--rr-fg); font: inherit; }",
      ".cl-rag-retrieval select { margin-top: .25rem; }",
      ".cl-rag-retrieval input[type=\"range\"] { display: block; width: 100%; min-height: 44px; margin: .1rem 0 0; accent-color: var(--rr-accent); }",
      ".cl-rag-retrieval button { cursor: pointer; font-size: .82rem; font-weight: 750; }",
      ".cl-rag-retrieval button:hover, .cl-rag-retrieval select:hover { border-color: var(--rr-accent); }",
      ".cl-rag-retrieval button[aria-pressed=\"true\"], .cl-rag-retrieval .rr-primary { border-color: var(--rr-accent); background: var(--rr-accent); color: var(--rr-bg); }",
      ".cl-rag-retrieval button:focus-visible, .cl-rag-retrieval select:focus-visible, .cl-rag-retrieval input:focus-visible { outline: 3px solid var(--rr-blue); outline-offset: 2px; }",
      ".cl-rag-retrieval .rr-mode-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: .35rem; }",
      ".cl-rag-retrieval .rr-control-head { display: flex; justify-content: space-between; gap: .4rem; align-items: baseline; }",
      ".cl-rag-retrieval output { color: var(--rr-accent); font-variant-numeric: tabular-nums; font-weight: 800; }",
      ".cl-rag-retrieval .rr-scale, .cl-rag-retrieval .rr-note { color: var(--rr-soft); font-size: .73rem; }",
      ".cl-rag-retrieval .rr-scale { display: flex; justify-content: space-between; }",
      ".cl-rag-retrieval .rr-note { margin: .4rem 0 0; line-height: 1.4; }",
      ".cl-rag-retrieval .rr-actions { display: grid; gap: .35rem; align-content: end; }",
      ".cl-rag-retrieval .rr-actions button { background: transparent; }",
      ".cl-rag-retrieval .rr-formula { margin: .8rem 1rem 0; padding: .55rem .65rem; border-left: 3px solid var(--rr-accent); background: var(--rr-panel); color: var(--rr-soft); font-size: .8rem; overflow-wrap: anywhere; }",
      ".cl-rag-retrieval .rr-status { display: flex; flex-wrap: wrap; gap: .55rem .75rem; align-items: center; margin: .75rem 1rem 0; padding: .6rem .7rem; border: 1px solid var(--rr-border); background: var(--rr-bg); }",
      ".cl-rag-retrieval .rr-badge { display: inline-flex; align-items: center; min-height: 28px; padding: .18rem .5rem; border-radius: 99px; background: var(--rr-accent); color: var(--rr-bg); font-size: .75rem; font-weight: 850; }",
      ".cl-rag-retrieval .rr-badge.rr-good { background: var(--rr-good); }",
      ".cl-rag-retrieval .rr-badge.rr-warn { background: var(--rr-warn); }",
      ".cl-rag-retrieval .rr-status-copy { color: var(--rr-soft); font-size: .78rem; overflow-wrap: anywhere; }",
      ".cl-rag-retrieval .rr-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: .5rem; margin: .7rem 1rem 0; }",
      ".cl-rag-retrieval .rr-metric { min-width: 0; padding: .55rem .6rem; border-top: 2px solid var(--rr-border); background: var(--rr-panel); }",
      ".cl-rag-retrieval .rr-metric span { display: block; color: var(--rr-soft); font-size: .7rem; }",
      ".cl-rag-retrieval .rr-metric strong { display: block; margin-top: .1rem; color: var(--rr-fg); font-size: .92rem; overflow-wrap: anywhere; }",
      ".cl-rag-retrieval .rr-main { display: grid; grid-template-columns: minmax(0, 1.04fr) minmax(280px, .96fr); gap: .8rem; align-items: start; padding: .8rem 1rem 1rem; }",
      ".cl-rag-retrieval .rr-panel { min-width: 0; padding: .75rem; border: 1px solid var(--rr-border); background: var(--rr-panel); }",
      ".cl-rag-retrieval .rr-panel + .rr-panel { margin-top: .7rem; }",
      ".cl-rag-retrieval .rr-panel h4 { margin: 0 0 .45rem; font-size: .9rem; }",
      ".cl-rag-retrieval .rr-panel-meta { margin: -.2rem 0 .55rem; color: var(--rr-soft); font-size: .76rem; }",
      ".cl-rag-retrieval .rr-answer-status { display: flex; align-items: center; gap: .5rem; margin-bottom: .55rem; color: var(--rr-soft); font-size: .78rem; }",
      ".cl-rag-retrieval .rr-answer-text { margin: 0; color: var(--rr-fg); font-weight: 750; overflow-wrap: anywhere; }",
      ".cl-rag-retrieval .rr-answer-note { margin: .55rem 0 0; color: var(--rr-soft); font-size: .78rem; overflow-wrap: anywhere; }",
      ".cl-rag-retrieval .rr-context-list, .cl-rag-retrieval .rr-evidence-list, .cl-rag-retrieval .rr-chunk-map { display: grid; gap: .45rem; }",
      ".cl-rag-retrieval .rr-context-card, .cl-rag-retrieval .rr-evidence-item, .cl-rag-retrieval .rr-chunk-row { min-width: 0; padding: .55rem .6rem; border: 1px solid var(--rr-border); background: var(--rr-bg); }",
      ".cl-rag-retrieval .rr-context-card.rr-support { border-left: 3px solid var(--rr-good); }",
      ".cl-rag-retrieval .rr-context-card.rr-related { border-left: 3px solid var(--rr-accent); }",
      ".cl-rag-retrieval .rr-context-card.rr-noise { border-left: 3px solid var(--rr-border); }",
      ".cl-rag-retrieval .rr-card-head, .cl-rag-retrieval .rr-chunk-head { display: flex; flex-wrap: wrap; gap: .35rem .55rem; align-items: baseline; justify-content: space-between; }",
      ".cl-rag-retrieval .rr-card-head strong, .cl-rag-retrieval .rr-chunk-head strong { color: var(--rr-fg); font-size: .8rem; }",
      ".cl-rag-retrieval .rr-chip-row { display: flex; flex-wrap: wrap; gap: .25rem .35rem; margin-top: .35rem; }",
      ".cl-rag-retrieval .rr-chip { display: inline-flex; align-items: center; min-height: 24px; padding: .1rem .35rem; border: 1px solid var(--rr-border); border-radius: 99px; color: var(--rr-soft); font-size: .68rem; }",
      ".cl-rag-retrieval .rr-chip.rr-cite { color: var(--rr-blue); border-color: var(--rr-blue); font-weight: 800; }",
      ".cl-rag-retrieval .rr-card-text, .cl-rag-retrieval .rr-chunk-text { margin: .35rem 0 0; color: var(--rr-fg); font-size: .78rem; overflow-wrap: anywhere; }",
      ".cl-rag-retrieval .rr-table-wrap { overflow-x: auto; }",
      ".cl-rag-retrieval table { width: 100%; min-width: 620px; border-collapse: collapse; color: var(--rr-fg); font-size: .74rem; }",
      ".cl-rag-retrieval th, .cl-rag-retrieval td { padding: .38rem .4rem; border-bottom: 1px solid var(--rr-border); text-align: left; vertical-align: top; }",
      ".cl-rag-retrieval th { color: var(--rr-soft); font-size: .69rem; font-weight: 800; white-space: nowrap; }",
      ".cl-rag-retrieval tr.rr-packed td { background: color-mix(in srgb, var(--rr-good) 10%, transparent); }",
      ".cl-rag-retrieval .rr-empty, .cl-rag-retrieval .rr-muted { color: var(--rr-soft); font-size: .78rem; }",
      ".cl-rag-retrieval .rr-boundary { color: var(--rr-blue); font-family: \"SF Mono\", Menlo, Consolas, monospace; font-size: .72rem; }",
      ".cl-rag-retrieval .rr-legend { margin: .55rem 0 0; color: var(--rr-soft); font-size: .72rem; }",
      "@media (max-width: 900px) { .cl-rag-retrieval .rr-controls { grid-template-columns: repeat(2, minmax(0, 1fr)); } .cl-rag-retrieval .rr-main { grid-template-columns: 1fr; } }",
      "@media (max-width: 520px) { .cl-rag-retrieval .rr-controls { grid-template-columns: 1fr; } .cl-rag-retrieval .rr-header, .cl-rag-retrieval .rr-main { padding-left: .7rem; padding-right: .7rem; } .cl-rag-retrieval .rr-status, .cl-rag-retrieval .rr-metrics, .cl-rag-retrieval .rr-formula { margin-left: .7rem; margin-right: .7rem; } }"
    ].join("\n");
    (document.head || document.documentElement).appendChild(style);
  }

  function buildLab(root, api) {
    installStyles();
    INSTANCE += 1;
    root.classList.add("cl-rag-retrieval");

    var state = {
      queryId: DEFAULTS.queryId,
      scoreMode: DEFAULTS.scoreMode,
      chunkSize: DEFAULTS.chunkSize,
      overlap: DEFAULTS.overlap,
      topK: DEFAULTS.topK,
      budget: DEFAULTS.budget,
      rerank: DEFAULTS.rerank
    };
    var refs = { ranges: {}, metrics: {} };
    var prefix = "rr-" + INSTANCE;

    function E(tag, attrs, children) {
      return api.el(tag, attrs, children);
    }

    function chip(label, className) {
      return E("span", { className: "rr-chip" + (className ? " " + className : ""), text: label });
    }

    function makeRange(key, label, min, max, step, formatter) {
      var id = prefix + "-" + key;
      var output = E("output", { text: formatter(state[key]) });
      var input = E("input", {
        id: id,
        type: "range",
        min: min,
        max: max,
        step: step,
        value: state[key],
        "aria-label": label,
        oninput: function () {
          state[key] = Number(this.value);
          render(true);
        }
      });
      refs.ranges[key] = { input: input, output: output, formatter: formatter };
      return E("fieldset", { className: "rr-fieldset" }, [
        E("div", { className: "rr-control-head" }, [
          E("label", { htmlFor: id, text: label }),
          output
        ]),
        input,
        E("div", { className: "rr-scale" }, [
          E("span", { text: String(min) }),
          E("span", { text: String(max) })
        ])
      ]);
    }

    var querySelect = E("select", {
      id: prefix + "-query",
      "aria-label": "固定问题",
      onchange: function () {
        state.queryId = this.value;
        render(true);
      }
    });
    QUERIES.forEach(function (query) {
      querySelect.appendChild(E("option", { value: query.id, text: query.label }));
    });
    var queryField = E("fieldset", { className: "rr-fieldset" }, [
      E("legend", { text: "固定问题（含不可回答题）" }),
      querySelect,
      E("p", { className: "rr-note", text: "词库与 gold evidence 固定，便于比较参数而不是换题。" })
    ]);

    var lexicalButton = E("button", {
      type: "button",
      text: "词面 lexical",
      "aria-pressed": "true",
      onclick: function () {
        state.scoreMode = "lexical";
        render(true);
      }
    });
    var semanticButton = E("button", {
      type: "button",
      text: "toy semantic",
      "aria-pressed": "false",
      onclick: function () {
        state.scoreMode = "semantic";
        render(true);
      }
    });
    var scoringField = E("fieldset", { className: "rr-fieldset" }, [
      E("legend", { text: "透明评分" }),
      E("div", { className: "rr-mode-buttons" }, [lexicalButton, semanticButton]),
      E("p", {
        className: "rr-note",
        text: "semantic 只查页面内人工同义词簇，不是 embedding。"
      })
    ]);

    var rerankButton = E("button", {
      type: "button",
      text: "rerank：关",
      "aria-pressed": "false",
      onclick: function () {
        state.rerank = !state.rerank;
        render(true);
      }
    });
    var rerankField = E("fieldset", { className: "rr-fieldset" }, [
      E("legend", { text: "候选内重排" }),
      rerankButton,
      E("p", {
        className: "rr-note",
        text: "只在 top-k 之外的小候选集内加焦点词分数，不能召回遗漏。"
      })
    ]);

    var resetButton = E("button", {
      type: "button",
      text: "恢复默认",
      onclick: function () {
        Object.keys(DEFAULTS).forEach(function (key) {
          state[key] = DEFAULTS[key];
        });
        render(true);
      }
    });
    var evidencePresetButton = E("button", {
      type: "button",
      text: "完整证据预设",
      onclick: function () {
        state.scoreMode = "semantic";
        state.chunkSize = 24;
        state.overlap = 4;
        state.topK = 6;
        state.budget = 72;
        state.rerank = true;
        render(true);
      }
    });
    var actionField = E("div", { className: "rr-actions" }, [
      evidencePresetButton,
      resetButton
    ]);

    var controls = E("div", { className: "rr-controls" }, [
      queryField,
      scoringField,
      makeRange("chunkSize", "chunk size（toy tokens）", 6, 24, 1, function (value) {
        return value + " tokens";
      }),
      makeRange("overlap", "overlap（tokens）", 0, 6, 1, function (value) {
        return String(value);
      }),
      makeRange("topK", "top-k", 1, 6, 1, function (value) {
        return String(value);
      }),
      makeRange("budget", "context budget（tokens）", 8, 72, 1, function (value) {
        return String(value);
      }),
      rerankField,
      actionField
    ]);

    var statusBadge = E("span", { className: "rr-badge", text: "—" });
    var statusCopy = E("span", { className: "rr-status-copy", text: "—" });
    var status = E("div", { className: "rr-status", "aria-live": "polite" }, [
      statusBadge,
      statusCopy
    ]);

    function makeMetric(key, label) {
      var value = E("strong", { text: "—" });
      refs.metrics[key] = value;
      return E("div", { className: "rr-metric" }, [
        E("span", { text: label }),
        value
      ]);
    }
    var metrics = E("div", { className: "rr-metrics" }, [
      makeMetric("context", "context budget"),
      makeMetric("precision", "context precision"),
      makeMetric("recall", "evidence recall"),
      makeMetric("coverage", "完整 fact 覆盖"),
      makeMetric("answerability", "answerability"),
      makeMetric("citation", "citation 支持结论")
    ]);

    var answerStatusBadge = E("span", { className: "rr-badge", text: "—" });
    var answerText = E("p", { className: "rr-answer-text", text: "—" });
    var citationText = E("p", { className: "rr-answer-note", text: "—" });
    var answerPanel = E("section", { className: "rr-panel" }, [
      E("h4", { text: "安全输出：先问证据是否够" }),
      E("div", { className: "rr-answer-status" }, [
        answerStatusBadge,
        E("span", { text: "这是固定语料的审计标签，不是模型自信度。" })
      ]),
      answerText,
      citationText
    ]);

    var contextMeta = E("p", { className: "rr-panel-meta", text: "—" });
    var contextList = E("div", { className: "rr-context-list" });
    var contextPanel = E("section", { className: "rr-panel" }, [
      E("h4", { text: "实际 context：chunk 边界与 citation" }),
      contextMeta,
      contextList
    ]);

    var evidenceList = E("div", { className: "rr-evidence-list" });
    var evidencePanel = E("section", { className: "rr-panel" }, [
      E("h4", { text: "证据覆盖账本" }),
      evidenceList
    ]);

    var rankingList = E("div");
    var rankingPanel = E("section", { className: "rr-panel" }, [
      E("h4", { text: "检索排名：初排 →（可选）重排" }),
      rankingList
    ]);

    var chunkMapList = E("div", { className: "rr-chunk-map" });
    var chunkMapPanel = E("section", { className: "rr-panel" }, [
      E("h4", { text: "chunk map：方括号是边界" }),
      E("p", {
        className: "rr-panel-meta",
        text: "每行显示来源 token 区间；fact 模拟段落边界，窗口不跨段，overlap 只在段内重复 token。"
      }),
      chunkMapList
    ]);

    var main = E("div", { className: "rr-main" }, [
      E("div", null, [answerPanel, contextPanel]),
      E("div", null, [evidencePanel, rankingPanel, chunkMapPanel])
    ]);
    var shell = E("div", { className: "rr-shell" }, [
      E("div", { className: "rr-header" }, [
        E("p", { className: "rr-kicker", text: "RAG · TOY RETRIEVAL" }),
        E("h3", { text: "同一个词命中，不等于答案被支持" }),
        E("p", {
          text: "固定语料、固定问题、确定性评分；没有远程请求，也没有真实 embedding。"
        })
      ]),
      controls,
      E("p", { className: "rr-formula" }, [
        "词面：共享词数 / query 词数；toy semantic：人工同义词簇命中 / query 概念数；rerank：候选内额外奖励焦点词。"
      ]),
      status,
      metrics,
      main
    ]);
    root.replaceChildren(shell);

    function chunkStatus(item, result) {
      var chunk = item.chunk;
      var requiredHit = hasFact(chunk, result.query.requiredFacts);
      var relevantHit = hasFact(chunk, result.query.relevantFacts);
      var completeHit = chunk.completeFactIds.some(function (factId) {
        return result.query.requiredFacts.indexOf(factId) !== -1;
      });
      if (completeHit) return { label: "支持证据", className: "rr-support" };
      if (requiredHit) return { label: "部分必要证据", className: "rr-related" };
      if (relevantHit) return { label: "相关但不支持完整答案", className: "rr-related" };
      return { label: "噪声 / 无关", className: "rr-noise" };
    }

    function syncControls() {
      querySelect.value = state.queryId;
      lexicalButton.setAttribute("aria-pressed", state.scoreMode === "lexical" ? "true" : "false");
      semanticButton.setAttribute("aria-pressed", state.scoreMode === "semantic" ? "true" : "false");
      rerankButton.setAttribute("aria-pressed", state.rerank ? "true" : "false");
      rerankButton.textContent = state.rerank ? "rerank：开" : "rerank：关";
      Object.keys(refs.ranges).forEach(function (key) {
        refs.ranges[key].input.value = state[key];
        refs.ranges[key].output.textContent = refs.ranges[key].formatter(state[key]);
      });
    }

    function renderAnswer(result) {
      answerStatusBadge.setAttribute("class", "rr-badge " + result.statusClass);
      answerStatusBadge.textContent = result.statusText;
      answerText.textContent = result.answerableNow
        ? result.query.supportedAnswer
        : result.query.abstainAnswer;
      var citationIds = result.packed
        .filter(function (item) {
          return hasFact(item.chunk, result.query.requiredFacts);
        })
        .map(function (item) {
          return item.chunk.id;
        });
      var support = result.answerableNow
        ? "citation 支持结论：是（" + (citationIds.join("、") || "当前片段") + " collectively 覆盖必要事实）"
        : result.query.answerable
        ? "citation 支持结论：否；当前引用只覆盖部分事实或相关词，不能支撑完整答案。"
        : "citation 支持具体维度：否；“不是实际 embedding”不等于有一个维度数字。";
      citationText.textContent =
        support + " 引用提高可追溯性，但不保证来源本身真实。";
    }

    function renderContext(result) {
      contextMeta.textContent =
        "装入 " +
        result.packed.length +
        "/" +
        result.retrieved.length +
        " 个候选 chunk · " +
        result.used +
        "/" +
        result.budget +
        " toy tokens";
      var nodes = result.packed.map(function (item) {
        var statusInfo = chunkStatus(item, result);
        var chunk = item.chunk;
        return E("div", { className: "rr-context-card " + statusInfo.className }, [
          E("div", { className: "rr-card-head" }, [
            E("strong", { text: chunk.id + " · " + chunk.sourceTitle }),
            E("span", { className: "rr-muted", text: "rank #" + item.finalRank + " · " + scoreText(item.finalScore) })
          ]),
          E("p", { className: "rr-card-text", text: "[" + chunk.text + "]" }),
          E("div", { className: "rr-chip-row" }, [
            chip(chunk.id, "rr-cite"),
            chip(statusInfo.label)
          ].concat(chunk.factIds.map(function (factId) {
            return chip(FACT_LABELS[factId] || factId);
          })))
        ]);
      });
      if (!nodes.length) {
        nodes.push(E("p", {
          className: "rr-empty",
          text: "预算小于所有候选 chunk 的整块长度；没有片段进入 context，系统应 abstain。"
        }));
      }
      if (result.skipped.length) {
        nodes.push(E("p", {
          className: "rr-legend",
          text: "候选但因预算跳过：" + result.skipped.map(function (item) {
            return item.chunk.id;
          }).join("、")
        }));
      }
      contextList.replaceChildren.apply(contextList, nodes);
    }

    function renderEvidence(result) {
      var nodes = [];
      if (!result.query.requiredFacts.length) {
        nodes.push(E("p", {
          className: "rr-muted",
          text: "该问题的 gold evidence 为空：相关背景可以被检索到，但语料没有“具体维度”这一支持事实。"
        }));
      } else {
        result.factStates.forEach(function (fact) {
          var label = fact.state === "complete"
            ? "完整"
            : fact.state === "partial"
            ? "部分"
            : "缺失";
          nodes.push(E("div", { className: "rr-evidence-item" }, [
            E("strong", { text: FACT_LABELS[fact.id] || fact.label }),
            E("div", { className: "rr-muted", text: label + " · " + fact.covered + "/" + fact.total + " fact tokens 在 context" })
          ]));
        });
      }
      nodes.push(E("p", {
        className: "rr-legend",
        text: "context precision = 相关装入 chunks / 装入 chunks；evidence recall = 完整覆盖的必要 facts / 必要 facts。两者都不是事实真实性概率。"
      }));
      evidenceList.replaceChildren.apply(evidenceList, nodes);
    }

    function renderRanking(result) {
      var head = E("thead", null, [
        E("tr", null, [
          E("th", { text: "初排" }),
          E("th", { text: "最终" }),
          E("th", { text: "chunk / 来源" }),
          E("th", { text: "score" }),
          E("th", { text: "命中词" }),
          E("th", { text: "context" })
        ])
      ]);
      var body = E("tbody", null, result.ranking.map(function (item) {
        var chunk = item.chunk;
        var contextState = item.packed
          ? "装入"
          : item.retrieved
          ? "候选但超预算"
          : item.inCandidate
          ? "候选"
          : "未入候选";
        var className = item.packed ? "rr-packed" : "";
        return E("tr", { className: className }, [
          E("td", { text: "#" + item.initialRank }),
          E("td", { text: item.finalRank ? "#" + item.finalRank : "—" }),
          E("td", { text: chunk.id + " · " + chunk.sourceId }),
          E("td", { text: scoreText(item.baseScore) + (state.rerank ? " → " + scoreText(item.finalScore) : "") }),
          E("td", { text: item.match.hits.join("、") || "—" }),
          E("td", { text: contextState })
        ]);
      }));
      var note = E("p", {
        className: "rr-legend",
        text: "当前模式：" +
          (state.scoreMode === "lexical" ? "词面共享词" : "人工同义词簇") +
          "；rerank 只作用于前 " +
          result.candidate.length +
          " 个候选。"
      });
      rankingList.replaceChildren(
        E("div", { className: "rr-table-wrap" }, [E("table", null, [head, body])]),
        note
      );
    }

    function renderChunkMap(result) {
      var nodes = result.chunks.map(function (chunk) {
        var item = result.ranking.find(function (candidate) {
          return candidate.chunk.id === chunk.id;
        });
        var stateText = item.packed
          ? " · context"
          : item.retrieved
          ? " · 超预算"
          : item.inCandidate
          ? " · candidate"
          : "";
        var factText = chunk.factIds.map(function (factId) {
          return FACT_LABELS[factId] || factId;
        }).join(" / ");
        return E("div", { className: "rr-chunk-row" }, [
          E("div", { className: "rr-chunk-head" }, [
            E("strong", { text: chunk.id + " · " + chunk.sourceTitle + stateText }),
            E("span", { className: "rr-boundary", text: "[" + chunk.start + ", " + chunk.end + ")" })
          ]),
          E("p", { className: "rr-chunk-text", text: "[" + chunk.text + "]" }),
          E("p", { className: "rr-legend", text: factText || "无 fact 标签" })
        ]);
      });
      chunkMapList.replaceChildren.apply(chunkMapList, nodes);
    }

    function render(announceChange) {
      state.overlap = clamp(state.overlap, 0, Math.min(6, state.chunkSize - 1));
      syncControls();
      var result = compute(state);
      statusBadge.setAttribute("class", "rr-badge " + result.statusClass);
      statusBadge.textContent = result.statusText;
      statusCopy.textContent =
        result.query.text +
        " · " +
        result.chunks.length +
        " chunks · candidate " +
        result.candidate.length +
        " · 实际 context " +
        result.packed.length;
      refs.metrics.context.textContent = result.used + " / " + result.budget;
      refs.metrics.precision.textContent = pct(result.precision);
      refs.metrics.recall.textContent = pct(result.recall);
      refs.metrics.coverage.textContent =
        result.query.requiredFacts.length
          ? result.completeCount + " / " + result.query.requiredFacts.length
          : "n/a";
      refs.metrics.answerability.textContent = result.query.answerable
        ? result.answerableNow ? "支持" : "证据不足"
        : "应 abstain";
      refs.metrics.citation.textContent = result.answerableNow ? "是" : "否";
      renderAnswer(result);
      renderContext(result);
      renderEvidence(result);
      renderRanking(result);
      renderChunkMap(result);
      if (announceChange && api.announce) {
        api.announce(root, result.statusText + "；context " + result.used + "/" + result.budget + " tokens。");
      }
    }

    render(false);
  }

  window.CourseLearning.register("rag-retrieval", buildLab);
})();
