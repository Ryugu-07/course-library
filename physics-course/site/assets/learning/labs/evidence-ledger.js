(function (host) {
  "use strict";

  /*
   * Evidence-chain audit desk for teaching only.
   * Every record below is fictional and embedded locally.  There is no network
   * lookup, no random source, and no claim that any identifier resolves online.
   */
  var EPSILON = 1e-12;
  var STYLE_ID = "cl-evidence-ledger-styles";
  var INSTANCE_COUNT = 0;
  var STATUS = {
    PASS: "PASS",
    WARN: "WARN",
    BLOCK: "BLOCK",
    PENDING: "PENDING"
  };
  var CLAIM_SUPPORT = {
    SUPPORTED: "SUPPORTED",
    UNSUPPORTED: "UNSUPPORTED",
    UNVERIFIED: "UNVERIFIED"
  };

  var GUARD_STAGES = [
    { id: "identity-metadata", label: "身份元数据", shortLabel: "身份" },
    { id: "scope-entailment", label: "论断范围 / 蕴含", shortLabel: "范围" },
    { id: "quote-locator", label: "引文 / 定位", shortLabel: "定位" },
    { id: "provenance-policy", label: "溯源 / 目标政策", shortLabel: "溯源" }
  ];

  var TARGET_POLICIES = {
    unknown: {
      id: "unknown",
      label: "目标政策：未知 / 未指定",
      requirement: "submission-ready 必须为 false；先确认具体目标的当前政策。"
    },
    teaching: {
      id: "teaching",
      label: "课程演练：虚构记录",
      requirement: "只作教学演练；明确标注虚构，不把它放入真实参考文献。"
    },
    draft: {
      id: "draft",
      label: "作者草稿：逐条核对",
      requirement: "作者逐条打开来源，核对身份、定位、支持范围和保密环境。"
    },
    submission: {
      id: "submission",
      label: "具体投稿目标：以当前政策为准",
      requirement: "投稿前核对目标期刊/会议当前政策，并记录申报、引用与保密边界。"
    }
  };

  function clone(value) {
    if (Array.isArray(value)) return value.map(clone);
    if (value && typeof value === "object") {
      var result = {};
      Object.keys(value).forEach(function (key) { result[key] = clone(value[key]); });
      return result;
    }
    return value;
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function stageNumber(value) {
    var number = Number(value);
    if (!finite(number)) return 0;
    return Math.max(0, Math.min(GUARD_STAGES.length, Math.floor(number)));
  }

  function sourceRecord(id, title, metadata, study, evidence, quote, provenance) {
    return {
      id: id,
      title: title,
      type: provenance.sourceType,
      fictional: true,
      metadata: metadata,
      study: study,
      evidence: evidence,
      quote: quote,
      provenance: provenance
    };
  }

  var CLEAN_SOURCE = sourceRecord(
    "FIC-SRC-01",
    "教学记录：工具 A/B 固定任务计时（虚构）",
    {
      status: "resolved",
      identifier: "FIC-DOI-001",
      identifierKind: "DOI-like teaching identifier",
      recordIdentity: "consistent",
      titleMatch: true,
      authorMatch: true,
      yearMatch: true,
      discoveryTriageOnly: false,
      referenceEligible: true,
      note: "resolved 是内置教学状态，不是网络解析结果。"
    },
    {
      sample: "12 名虚构学习者；固定任务集 T-12",
      design: "非随机的描述性计时记录",
      population: "仅这 12 名教学参与者与 T-12",
      timeUnit: "秒"
    },
    {
      summary: "在同一套 12 个任务上，A 的平均完成时间为 82 秒，B 为 97 秒。",
      locator: "Table 2 / mean-time row",
      abstractOnly: false,
      fullTextOpened: true
    },
    {
      suppliedText: "在固定任务集 T-12 上，A 组平均完成时间为 82 秒，B 组为 97 秒。",
      originalText: "在固定任务集 T-12 上，A 组平均完成时间为 82 秒，B 组为 97 秒。",
      locator: "p. 4, Table 2, mean-time row",
      expectedLocator: "p. 4, Table 2, mean-time row",
      sourceOpened: true,
      locatorValid: true,
      textMatchesOriginal: true
    },
    {
      sourceType: "primary",
      sourceOpened: true,
      primaryOpened: true,
      chainComplete: true,
      version: "v1.0-teaching",
      captured: "内置教学记录",
      origin: "课程演练数据，不是真实研究"
    }
  );

  var PRESETS = {
    clean: {
      id: "clean",
      label: "干净链条",
      description: "虚构记录、身份字段一致、原文定位相符，论断主动停在样本与描述性范围内。",
      sources: [CLEAN_SOURCE],
      claim: {
        original: "在这份虚构的 12 条 T-12 记录中，工具 A 的平均完成时间低于工具 B；这是描述性差异，不主张因果或外推。",
        revised: "在内置的虚构 T-12 任务记录（12 条、非随机描述性计时）中，A 的平均完成时间为 82 秒，B 为 97 秒；该记录不识别因果效应，也不外推到其他任务或人群。",
        relation: "direct"
      },
      scopeRows: [
        { id: "sample", label: "样本 / 任务", claim: "12 条 T-12 记录", evidence: "study.sample 明确为 12 名、固定 T-12", supported: true },
        { id: "causal", label: "因果强度", claim: "描述性差异，不说 A 导致", evidence: "study.design 标为非随机描述性记录", supported: true },
        { id: "external", label: "外推边界", claim: "不外推到其他任务或人群", evidence: "study.population 只覆盖 T-12 与 12 名参与者", supported: true }
      ],
      policy: {
        checkedTargets: ["teaching", "draft"],
        latestCheckedTargets: ["teaching", "draft"],
        approvedEnvironment: true,
        environmentApproval: "机构或目标明确批准的环境",
        environmentApproved: true,
        confidentialMaterial: false,
        candidateReferenceUsed: false,
        disclosurePlanned: true
      }
    },

    scope: {
      id: "scope",
      label: "scope inflation：样本 / 因果 / 外推越界",
      description: "同一份小型虚构记录被写成全体研究生、因果效果和普遍外推。",
      sources: [sourceRecord(
        "FIC-SRC-02",
        "教学记录：工具 A/B 固定任务计时（虚构，观察性）",
        clone(CLEAN_SOURCE.metadata),
        clone(CLEAN_SOURCE.study),
        clone(CLEAN_SOURCE.evidence),
        clone(CLEAN_SOURCE.quote),
        clone(CLEAN_SOURCE.provenance)
      )],
      claim: {
        original: "工具 A 因果性地提高了所有研究生在所有科研任务中的效率。",
        revised: "在这份虚构的 12 名参与者、T-12 固定任务的观察性记录中，A 组平均完成时间较低；该记录未识别因果效应，也不支持外推到其他人群或任务。",
        relation: "overreach"
      },
      scopeRows: [
        { id: "sample", label: "样本 / 任务", claim: "所有研究生、所有科研任务", evidence: "证据只有 12 名参与者与固定 T-12", supported: false, reason: "样本和任务范围被扩大" },
        { id: "causal", label: "因果强度", claim: "A 因果性地提高效率", evidence: "记录是非随机描述性计时", supported: false, reason: "观察性差异不能单独识别因果效应" },
        { id: "external", label: "外推边界", claim: "适用于所有科研任务", evidence: "没有跨任务、跨人群验证", supported: false, reason: "外部效度越过证据范围" }
      ],
      policy: clone(PRESETS && PRESETS.clean ? PRESETS.clean.policy : {
        checkedTargets: ["teaching", "draft"], latestCheckedTargets: ["teaching", "draft"],
        approvedEnvironment: true, environmentApproval: "机构或目标明确批准的环境",
        environmentApproved: true, confidentialMaterial: false, candidateReferenceUsed: false, disclosurePlanned: true
      })
    },

    metadata: {
      id: "metadata",
      label: "元数据不一致 / 未解析",
      description: "候选记录的标题、作者与年份对不上；状态未解析不是证伪，但身份尚未建立。",
      sources: [sourceRecord(
        "FIC-SRC-03",
        "候选记录：工具 A/B 计时（虚构，身份待核）",
        {
          status: "unresolved",
          identifier: "FIC-DOI-003",
          identifierKind: "DOI-like teaching identifier",
          recordIdentity: "inconsistent",
          titleMatch: false,
          authorMatch: false,
          yearMatch: false,
          discoveryTriageOnly: true,
          referenceEligible: false,
          claimedTitle: "工具 A/B 在科研任务中的普遍效率提升",
          catalogTitle: "工具 A/B 固定任务计时",
          mismatches: ["标题表述不一致", "作者字段未匹配", "年份字段未解析"],
          note: "未解析不等于证伪；它只表示此刻不能把候选记录当作已确认身份。"
        },
        {
          sample: "候选摘要声称有 12 条记录，但原文尚未打开",
          design: "未知",
          population: "未知",
          timeUnit: "未知"
        },
        {
          summary: "AI 候选摘要称：A 比 B 快。",
          locator: "候选摘要，无原文定位",
          abstractOnly: true,
          fullTextOpened: false
        },
        {
          suppliedText: "A 比 B 快。",
          originalText: "尚未打开原文，无法填写",
          locator: "候选摘要 / 无页码",
          expectedLocator: "待打开原文后填写",
          sourceOpened: false,
          locatorValid: false,
          textMatchesOriginal: false
        },
        {
          sourceType: "candidate",
          sourceOpened: false,
          primaryOpened: false,
          chainComplete: false,
          version: "candidate-0",
          captured: "检索候选卡片",
          origin: "教学用候选，不是真实研究"
        }
      )],
      claim: {
        original: "虚构记录 FIC-SRC-03 证明工具 A 比 B 快。",
        revised: "在 FIC-SRC-03 的身份元数据、原文和定位核对完成前，不提交该论断；若核对通过，也只能按原文支持范围限定表述。",
        relation: "unverified"
      },
      scopeRows: [
        { id: "sample", label: "样本 / 任务", claim: "记录中的样本范围", evidence: "候选卡片未打开原文，样本未知", supported: true },
        { id: "causal", label: "因果强度", claim: "不把候选摘要写成因果证明", evidence: "目前只有候选摘要，不足以判定", supported: true },
        { id: "external", label: "外推边界", claim: "不作外推", evidence: "原文范围尚未确认", supported: true }
      ],
      policy: {
        checkedTargets: ["teaching", "draft"],
        latestCheckedTargets: ["teaching", "draft"],
        approvedEnvironment: true,
        environmentApproval: "机构或目标明确批准的环境",
        environmentApproved: true,
        confidentialMaterial: false,
        candidateReferenceUsed: false,
        disclosurePlanned: true
      }
    },

    locator: {
      id: "locator",
      label: "引文定位 / 原文不匹配",
      description: "论断范围尚可，但把候选摘要句和错误页码写成原文引文。",
      sources: [sourceRecord(
        "FIC-SRC-04",
        "教学记录：工具 A/B 固定任务计时（虚构，定位陷阱）",
        clone(CLEAN_SOURCE.metadata),
        clone(CLEAN_SOURCE.study),
        clone(CLEAN_SOURCE.evidence),
        {
          suppliedText: "在 T-12 任务中，A 组的平均完成时间为 82 秒，B 组为 97 秒。",
          originalText: "在固定任务集 T-12 上，A 组平均完成时间为 82 秒，B 组为 97 秒。",
          locator: "p. 2, Abstract, last sentence",
          expectedLocator: "p. 4, Table 2, mean-time row",
          sourceOpened: true,
          locatorValid: false,
          textMatchesOriginal: false
        },
        clone(CLEAN_SOURCE.provenance)
      )],
      claim: {
        original: "在虚构的 T-12 记录中，A 的平均完成时间为 82 秒，B 为 97 秒。",
        revised: "在打开 FIC-SRC-04 原文并核对 p. 4 Table 2 的准确措辞与行定位后，才能提交这条限定为 T-12 的描述性论断。",
        relation: "direct"
      },
      scopeRows: [
        { id: "sample", label: "样本 / 任务", claim: "只谈 T-12 记录", evidence: "study.sample 为固定 T-12", supported: true },
        { id: "causal", label: "因果强度", claim: "描述性时间差，不说因果", evidence: "study.design 为非随机描述性记录", supported: true },
        { id: "external", label: "外推边界", claim: "不外推", evidence: "claim 只限定 T-12", supported: true }
      ],
      policy: {
        checkedTargets: ["teaching", "draft"],
        latestCheckedTargets: ["teaching", "draft"],
        approvedEnvironment: true,
        environmentApproval: "机构或目标明确批准的环境",
        environmentApproved: true,
        confidentialMaterial: false,
        candidateReferenceUsed: false,
        disclosurePlanned: true
      }
    },

    secondary: {
      id: "secondary",
      label: "二手转引：尚未回到原始记录",
      description: "二手教学综述的身份和引文可核对，但论证依赖原始记录时仍须打开 primary source。",
      sources: [sourceRecord(
        "FIC-SRC-05",
        "教学综述：工具 A/B 计时记录摘要（虚构，二手）",
        clone(CLEAN_SOURCE.metadata),
        {
          sample: "二手综述转引 12 名参与者与 T-12",
          design: "二手摘要，未替代原始设计信息",
          population: "原始记录的范围尚待核对",
          timeUnit: "秒"
        },
        {
          summary: "二手综述报告：原始教学记录中的 A 平均时间低于 B。",
          locator: "p. 3, summary paragraph"
        },
        {
          suppliedText: "二手综述报告原始记录中 A 的平均时间低于 B。",
          originalText: "二手综述报告原始记录中 A 的平均时间低于 B。",
          locator: "p. 3, summary paragraph",
          expectedLocator: "p. 3, summary paragraph",
          sourceOpened: true,
          locatorValid: true,
          textMatchesOriginal: true
        },
        {
          sourceType: "secondary",
          sourceOpened: true,
          primaryOpened: false,
          chainComplete: false,
          version: "v1.0-secondary-teaching",
          captured: "内置二手教学综述",
          origin: "课程演练数据，不是真实研究",
          secondaryOf: "FIC-SRC-01"
        }
      )],
      claim: {
        original: "二手教学综述报告，原始记录中工具 A 的平均完成时间低于 B。",
        revised: "二手综述只能作为检索线索；在打开并核对其所转引的 FIC-SRC-01 原始记录前，不把这条内容作为已完成的证据链提交。",
        relation: "secondary-report"
      },
      scopeRows: [
        { id: "sample", label: "样本 / 任务", claim: "明确说这是二手摘要转引", evidence: "source.type = secondary，范围被标为待核对", supported: true },
        { id: "causal", label: "因果强度", claim: "不把转引写成因果证明", evidence: "claim 仅报告二手综述所述", supported: true },
        { id: "external", label: "外推边界", claim: "不外推", evidence: "没有额外外部验证", supported: true }
      ],
      policy: {
        checkedTargets: ["teaching", "draft"],
        latestCheckedTargets: ["teaching", "draft"],
        approvedEnvironment: true,
        environmentApproval: "机构或目标明确批准的环境",
        environmentApproved: true,
        confidentialMaterial: false,
        candidateReferenceUsed: false,
        disclosurePlanned: true
      }
    }
  };

  /* The scope preset reuses the clean policy without relying on initialization order. */
  PRESETS.scope.policy = clone(PRESETS.clean.policy);

  function getPreset(id) {
    var preset = PRESETS[id];
    if (!preset) throw new Error("未知教学预设: " + id);
    return clone(preset);
  }

  function getPolicy(id) {
    return TARGET_POLICIES[id] || TARGET_POLICIES.unknown;
  }

  function provenanceSupportAssessment(source) {
    var provenance = source.provenance || {};
    var quote = source.quote || {};
    var primaryChain = source.type === "primary" &&
      provenance.primaryOpened === true &&
      provenance.chainComplete === true &&
      quote.sourceOpened === true &&
      quote.abstractOnly !== true &&
      quote.fullTextOpened !== false;
    if (primaryChain) {
      return {
        status: CLAIM_SUPPORT.SUPPORTED,
        detail: "primary source 已打开，provenance 链条闭合，支持关系可继续使用。"
      };
    }
    if (source.type === "secondary" && provenance.primaryOpened !== true) {
      return {
        status: CLAIM_SUPPORT.UNVERIFIED,
        detail: "二手转引尚未回到 primary source；支持链未闭合。"
      };
    }
    return {
      status: CLAIM_SUPPORT.UNVERIFIED,
      detail: "primary/provenance 支持链尚未闭合；当前不能把来源当作已核实支持。"
    };
  }

  function claimSupportAssessment(identity, scope, quote, provenanceSupport) {
    if (scope.status === STATUS.BLOCK) {
      return {
        status: CLAIM_SUPPORT.UNSUPPORTED,
        detail: "当前论断超出证据范围或不被证据蕴含；先缩小样本、因果和外推主张。"
      };
    }
    if (identity.status === STATUS.BLOCK || quote.status === STATUS.BLOCK ||
        provenanceSupport.status !== CLAIM_SUPPORT.SUPPORTED) {
      return {
        status: CLAIM_SUPPORT.UNVERIFIED,
        detail: "身份、原文定位或 primary/provenance 支持链尚未完成；这不是论断已被证伪。"
      };
    }
    if (scope.status !== STATUS.PASS) {
      return {
        status: CLAIM_SUPPORT.UNVERIFIED,
        detail: "scope/entailment 仍有警告；当前限定论断尚未获得完整支持。"
      };
    }
    return {
      status: CLAIM_SUPPORT.SUPPORTED,
      detail: "身份、scope/entailment、原文定位和 primary/provenance 支持链均通过。"
    };
  }

  function evaluateIdentity(source) {
    var metadata = source.metadata || {};
    var resolved = metadata.status === "resolved";
    var consistent = metadata.recordIdentity === "consistent" &&
      metadata.titleMatch !== false && metadata.authorMatch !== false && metadata.yearMatch !== false;
    var discoveryOnly = metadata.discoveryTriageOnly === true || metadata.referenceEligible === false;
    if (!resolved || !consistent || discoveryOnly) {
      var details = [];
      if (!resolved) details.push("DOI/元数据未解析");
      if (!consistent) details.push("标题、作者或年份字段不一致");
      if (discoveryOnly) details.push("候选 DOI/标题匹配只能作 discovery triage，不能直接进入参考文献");
      return {
        id: "identity-metadata",
        label: "身份元数据",
        status: STATUS.BLOCK,
        detail: details.join("；") + "。未解析不等于证伪；当前只能把它留作候选。",
        action: "打开来源并逐字段核对身份；不要把候选直接写入参考文献。",
        note: "即使 DOI/元数据可解析，也只证明记录身份，不证明研究真实或支持当前论断；候选仍不能直接入参考文献。"
      };
    }
    return {
      id: "identity-metadata",
      label: "身份元数据",
      status: STATUS.PASS,
      detail: "教学模拟字段互相一致；记录身份可继续核对。",
      action: "保留 identifier、标题、作者、年份和版本的审计记录。",
      note: "resolved 只证明记录身份，不证明研究真实存在或支持论断；它也不是研究质量评分。"
    };
  }

  function evaluateScope(preset, identity) {
    var rows = preset.scopeRows || [];
    var unsupported = rows.filter(function (row) { return !row.supported; });
    var relation = preset.claim && preset.claim.relation;
    if (unsupported.length) {
      return {
        id: "scope-entailment",
        label: "论断范围 / 蕴含",
        status: STATUS.BLOCK,
        detail: unsupported.map(function (row) { return row.label + "：" + (row.reason || "证据不足"); }).join("；"),
        action: "把样本、因果强度和外推边界改写到证据实际覆盖的范围。",
        rows: rows,
        relation: relation
      };
    }
    if (identity.status === STATUS.BLOCK || relation === "unverified") {
      return {
        id: "scope-entailment",
        label: "论断范围 / 蕴含",
        status: STATUS.WARN,
        detail: "文字暂未越过已声明的范围，但来源身份或原文尚未确认，支持关系只能算临时。",
        action: "先修复身份与原文核对，再把支持关系升级为 PASS。",
        rows: rows,
        relation: relation
      };
    }
    return {
      id: "scope-entailment",
      label: "论断范围 / 蕴含",
      status: relation === "partial" ? STATUS.WARN : STATUS.PASS,
      detail: relation === "partial" ? "证据只部分蕴含当前措辞，需加限定词。" : "样本、因果强度和外推边界均与证据相配。",
      action: relation === "partial" ? "补上限定词，避免把相关、描述或局部结果写成更强命题。" : "保留分子、分母、设计和适用域的原始口径。",
      rows: rows,
      relation: relation
    };
  }

  function evaluateQuote(source) {
    var quote = source.quote || {};
    if (!quote.sourceOpened) {
      return {
        id: "quote-locator",
        label: "引文 / 定位",
        status: STATUS.BLOCK,
        detail: "原文尚未打开；摘要或 AI 匹配只能做检索分诊，不能代替打开原文。",
        action: "打开原文，逐字核对引文、页码/表格/段落和版本。",
        quote: quote
      };
    }
    if (quote.abstractOnly === true || quote.fullTextOpened === false) {
      return {
        id: "quote-locator",
        label: "引文 / 定位",
        status: STATUS.BLOCK,
        detail: "当前只有摘要或候选匹配；摘要不足以核对全文范围，不能代替打开原文。",
        action: "打开全文并核对上下文、限制条件、定位和版本，再重跑审计。",
        quote: quote
      };
    }
    if (!quote.locatorValid || !quote.textMatchesOriginal) {
      var mismatch = [];
      if (!quote.textMatchesOriginal) mismatch.push("引文文字与原文不匹配");
      if (!quote.locatorValid) mismatch.push("定位不匹配或不可复核");
      return {
        id: "quote-locator",
        label: "引文 / 定位",
        status: STATUS.BLOCK,
        detail: mismatch.join("；") + "。当前候选不能直接作为引用。",
        action: "回到原文，修正 quote、locator、版本和上下文，再重跑审计。",
        quote: quote
      };
    }
    return {
      id: "quote-locator",
      label: "引文 / 定位",
      status: STATUS.PASS,
      detail: "原文已打开；引文文字、定位和当前版本相符。",
      action: "把定位和核对日期留在证据账本，不只保留格式化引用。",
      quote: quote
    };
  }

  function evaluateProvenancePolicy(preset, source, targetPolicyId) {
    var provenance = source.provenance || {};
    var policy = preset.policy || {};
    var target = getPolicy(targetPolicyId);
    var blocks = [];
    var warnings = [];
    var policyKnown = targetPolicyId !== "unknown";
    var policyChecked = (policy.checkedTargets || []).indexOf(targetPolicyId) >= 0;
    var policyLatest = (policy.latestCheckedTargets || []).indexOf(targetPolicyId) >= 0;
    if (source.type === "secondary" && !provenance.primaryOpened) {
      blocks.push("这是二手转引，原始记录尚未打开；二手来源不能替代 primary source");
    }
    if (!provenance.chainComplete) {
      warnings.push("provenance 链条尚未闭合");
    }
    var approvedEnvironment = (policy.approvedEnvironment === true || policy.environmentApproved === true) && Boolean(policy.environmentApproval);
    if (policy.confidentialMaterial && !approvedEnvironment) {
      blocks.push("保密材料只可进入机构或目标明确批准的环境；当前未记录获批准环境");
    }
    if (policy.candidateReferenceUsed) {
      blocks.push("候选记录已直接进入参考文献；候选不得直接提交");
    }
    if (!policyKnown) {
      warnings.push("目标政策未知；submission-ready=false，但这不是论断事实性的 BLOCK");
    } else if (!policyChecked) {
      warnings.push("目标政策“" + target.label + "”尚未在这份教学记录中核对；submission-ready=false");
    }
    if (policyKnown && !policyLatest) {
      warnings.push("政策检查不是永久事实；需确认目标的最新版本");
    }
    if (!policy.disclosurePlanned) warnings.push("尚未记录 AI 使用与作者责任边界");
    if (blocks.length) {
      return {
        id: "provenance-policy",
        label: "溯源 / 目标政策",
        status: STATUS.BLOCK,
        detail: blocks.concat(warnings).join("；") + "。",
        action: "补齐来源链、打开原始记录、使用获批准环境，并按目标政策重新核对。",
        target: target,
        provenance: provenance,
        policy: {
          status: STATUS.BLOCK,
          known: policyKnown,
          checked: policyChecked,
          latestChecked: policyLatest,
          target: target,
          record: policy
        }
      };
    }
    if (warnings.length) {
      return {
        id: "provenance-policy",
        label: "溯源 / 目标政策",
        status: STATUS.WARN,
        detail: warnings.join("；") + "。政策随目标变化，不能用课程默认值替代目标核对。",
        action: "在提交前记录目标政策版本、申报要求和保密环境。",
        target: target,
        provenance: provenance,
        policy: {
          status: STATUS.WARN,
          known: policyKnown,
          checked: policyChecked,
          latestChecked: policyLatest,
          target: target,
          record: policy
        }
      };
    }
    return {
      id: "provenance-policy",
      label: "溯源 / 目标政策",
      status: STATUS.PASS,
      detail: "来源链闭合，未把候选直接入参考文献，目标政策和环境记录已匹配。",
      action: "保留审计轨迹；作者仍对每条论断、引用和申报负责。",
      target: target,
      provenance: provenance,
      policy: {
        status: STATUS.PASS,
        known: policyKnown,
        checked: policyChecked,
        latestChecked: policyLatest,
        target: target,
        record: policy
      }
    };
  }

  function matrixFor(preset, identity, scope, source) {
    return (preset.scopeRows || []).map(function (row) {
      var status = row.supported ? STATUS.PASS : STATUS.BLOCK;
      var reason = row.supported ? "证据范围内" : (row.reason || "证据不足");
      if (identity.status === STATUS.BLOCK && status === STATUS.PASS) {
        status = STATUS.WARN;
        reason = "范围暂可对齐，但身份未确认，不能把来源当作已采纳证据";
      }
      if (source.metadata && source.metadata.referenceEligible === false) {
        status = STATUS.BLOCK;
        reason = "候选只能作 discovery triage；未完成身份与全文核对，不得直接入参考文献";
      }
      return {
        id: row.id,
        dimension: row.label,
        claim: row.claim,
        source: source.id,
        evidence: row.evidence,
        status: status,
        reason: reason
      };
    });
  }

  function submissionFor(stageLimit, guards) {
    if (stageLimit < GUARD_STAGES.length) {
      return {
        state: "NOT_RUN",
        label: "待完成四关",
        detail: "审计尚未跑完；不能把未执行的检查当成通过。",
        reasons: ["还有 " + (GUARD_STAGES.length - stageLimit) + " 个 guard 未执行"]
      };
    }
    var blocks = guards.filter(function (guard) { return guard.status === STATUS.BLOCK; });
    var warnings = guards.filter(function (guard) { return guard.status === STATUS.WARN; });
    if (blocks.length) {
      return {
        state: "BLOCKED",
        label: "不可直接提交",
        detail: "存在阻断项；先修复证据链，再提交论断。",
        reasons: blocks.map(function (guard) { return guard.label + "：" + guard.detail; })
      };
    }
    if (warnings.length) {
      return {
        state: "REVISE",
        label: "修订后再提交",
        detail: "没有硬阻断，但仍有未解决的边界或政策警告。",
        reasons: warnings.map(function (guard) { return guard.label + "：" + guard.detail; })
      };
    }
    return {
      state: "READY",
      label: "可提交（限定论断）",
      detail: "四关均 PASS；这只表示当前虚构教学账本的论断链条自洽，作者仍承担最终责任。",
      reasons: []
    };
  }

  function audit(input, options) {
    var preset = typeof input === "string" ? getPreset(input) : clone(input);
    assert(preset && preset.id && Array.isArray(preset.sources) && preset.sources.length > 0, "输入必须包含 sources");
    options = options || {};
    var stageLimit = options.guardStage === undefined ? GUARD_STAGES.length : stageNumber(options.guardStage);
    var targetPolicyId = TARGET_POLICIES[options.targetPolicy] ? options.targetPolicy : "unknown";
    var source = preset.sources[0];
    var identity = evaluateIdentity(source);
    var scope = evaluateScope(preset, identity);
    var quote = evaluateQuote(source);
    var provenance = evaluateProvenancePolicy(preset, source, targetPolicyId);
    var provenanceSupport = provenanceSupportAssessment(source);
    var claimSupport = claimSupportAssessment(identity, scope, quote, provenanceSupport);
    var calculatedGuards = [identity, scope, quote, provenance];
    var guards = calculatedGuards.map(function (guard, index) {
      var executed = stageLimit > index;
      var result = clone(guard);
      result.stage = index + 1;
      result.executed = executed;
      result.visibleStatus = executed ? guard.status : STATUS.PENDING;
      return result;
    });
    var firstNonPass = null;
    var firstBlock = null;
    calculatedGuards.some(function (guard, index) {
      if (guard.status !== STATUS.PASS && !firstNonPass) {
        firstNonPass = { index: index, id: guard.id, label: guard.label, status: guard.status };
      }
      if (guard.status === STATUS.BLOCK && !firstBlock) {
        firstBlock = { index: index, id: guard.id, label: guard.label, status: guard.status };
      }
      return Boolean(firstNonPass && firstBlock);
    });
    var submission = submissionFor(stageLimit, calculatedGuards);
    var submissionReady = stageLimit === GUARD_STAGES.length && submission.state === "READY";
    var trace = [
      { stage: 0, label: "载入教学记录", status: "INFO", text: "仅使用内置虚构记录；不访问网络，不声称真实文献。" }
    ];
    guards.forEach(function (guard) {
      trace.push({
        stage: guard.stage,
        label: guard.label,
        status: guard.executed ? guard.status : STATUS.PENDING,
        text: guard.executed ? guard.detail : "待执行；先预测这一关是否会失败。"
      });
    });
    if (stageLimit === GUARD_STAGES.length) {
      trace.push({ stage: 5, label: "提交判定", status: submission.state, text: submission.detail });
    }
    return {
      preset: { id: preset.id, label: preset.label, description: preset.description },
      source: clone(source),
      originalClaim: preset.claim.original,
      revisedClaim: preset.claim.revised,
      guards: guards,
      claimSourceMatrix: matrixFor(preset, identity, scope, source),
      auditTrace: trace,
      targetPolicy: getPolicy(targetPolicyId),
      submission: submission,
      submissionReady: submissionReady,
      claimSupport: claimSupport,
      claimFactual: claimSupport,
      firstNonPass: firstNonPass,
      firstBlock: firstBlock,
      blockingReasons: calculatedGuards.filter(function (guard) { return guard.status === STATUS.BLOCK; }).map(function (guard) { return guard.detail; }),
      warnings: calculatedGuards.filter(function (guard) { return guard.status === STATUS.WARN; }).map(function (guard) { return guard.detail; }),
      identity: identity,
      scope: scope,
      quote: quote,
      provenance: provenance,
      execution: {
        completed: stageLimit,
        total: GUARD_STAGES.length,
        next: stageLimit < GUARD_STAGES.length ? GUARD_STAGES[stageLimit] : null
      }
    };
  }

  function selfTest() {
    var clean = audit("clean", { guardStage: 4, targetPolicy: "draft" });
    assert(clean.guards.every(function (guard) { return guard.status === STATUS.PASS; }), "clean all pass");
    assert(clean.submission.state === "READY", "clean ready");
    assert(clean.source.fictional === true, "clean fictional marker");
    assert(clean.identity.note.indexOf("不证明研究真实") >= 0, "identity limitation");
    assert(clean.claimSourceMatrix.length === 3, "claim source matrix");
    assert(clean.claimSupport.status === CLAIM_SUPPORT.SUPPORTED, "clean claim support");

    var scope = audit("scope", { guardStage: 4, targetPolicy: "draft" });
    assert(scope.firstNonPass.id === "scope-entailment", "scope first failure");
    assert(scope.scope.status === STATUS.BLOCK, "scope blocks");
    assert(scope.submission.state === "BLOCKED", "scope submission blocked");
    assert(scope.claimSupport.status === CLAIM_SUPPORT.UNSUPPORTED, "scope claim support unsupported");
    assert(scope.revisedClaim.indexOf("未识别因果效应") >= 0, "scope qualified claim");
    assert(scope.claimSourceMatrix.filter(function (row) { return row.status === STATUS.BLOCK; }).length === 3, "scope matrix blocks");

    var metadata = audit("metadata", { guardStage: 4, targetPolicy: "draft" });
    assert(metadata.firstNonPass.id === "identity-metadata", "metadata first failure");
    assert(metadata.identity.status === STATUS.BLOCK, "metadata blocks");
    assert(metadata.identity.detail.indexOf("未解析不等于证伪") >= 0, "unresolved is not disproof");
    assert(metadata.claimSupport.status === CLAIM_SUPPORT.UNVERIFIED, "metadata claim support unverified");

    var locator = audit("locator", { guardStage: 4, targetPolicy: "draft" });
    assert(locator.firstNonPass.id === "quote-locator", "locator first failure");
    assert(locator.quote.status === STATUS.BLOCK, "locator blocks");
    assert(locator.quote.detail.indexOf("不匹配") >= 0, "locator mismatch detail");
    assert(locator.claimSupport.status === CLAIM_SUPPORT.UNVERIFIED, "locator claim support unverified");

    var secondary = audit("secondary", { guardStage: 4, targetPolicy: "draft" });
    assert(secondary.firstNonPass.id === "provenance-policy", "secondary first failure");
    assert(secondary.provenance.status === STATUS.BLOCK, "secondary blocks");
    assert(secondary.provenance.detail.indexOf("二手转引") >= 0, "secondary reason");
    assert(secondary.claimSupport.status === CLAIM_SUPPORT.UNVERIFIED, "secondary claim support unverified");

    var policy = audit("clean", { guardStage: 4, targetPolicy: "submission" });
    assert(policy.provenance.status === STATUS.WARN, "unchecked submission policy warns");
    assert(policy.claimSupport.status === CLAIM_SUPPORT.SUPPORTED, "unchecked policy leaves claim support supported");
    assert(policy.submissionReady === false && policy.submission.state === "REVISE", "policy submission requires revision");

    var unknownPolicy = audit("clean", { guardStage: 4 });
    assert(unknownPolicy.provenance.status === STATUS.WARN, "unknown policy is a warning guard");
    assert(unknownPolicy.claimSupport.status === CLAIM_SUPPORT.SUPPORTED, "unknown policy does not block claim support");
    assert(unknownPolicy.submissionReady === false, "unknown policy is not submission-ready");

    var progressive = audit("scope", { guardStage: 1, targetPolicy: "draft" });
    assert(progressive.guards[0].executed === true, "progressive first executed");
    assert(progressive.guards[1].executed === false && progressive.guards[1].visibleStatus === STATUS.PENDING, "progressive pending");
    assert(progressive.submission.state === "NOT_RUN", "progressive not ready");

    return { checks: 29, presets: Object.keys(PRESETS).length, status: "ok" };
  }

  var pureModel = {
    STATUS: STATUS,
    CLAIM_SUPPORT: CLAIM_SUPPORT,
    GUARD_STAGES: GUARD_STAGES,
    TARGET_POLICIES: TARGET_POLICIES,
    PRESETS: PRESETS,
    getPreset: getPreset,
    audit: audit,
    analyze: audit,
    selfTest: selfTest
  };

  if (typeof module === "object" && module.exports) {
    module.exports = pureModel;
    if (typeof require !== "undefined" && require.main === module && process.argv.indexOf("--self-test") !== -1) {
      var report = selfTest();
      console.log("evidence-ledger self-test: " + report.status + " (" + report.checks + " checks, " + report.presets + " presets)");
    }
  }

  if (!host || !host.CourseLearning || typeof host.CourseLearning.register !== "function") return;

  var doc = host.document;
  var api = host.CourseLearning.api || {};

  function setAttributes(node, attrs) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "className") node.setAttribute("class", String(value));
      else if (key === "text") node.textContent = String(value);
      else if (key.slice(0, 2) === "on" && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (value === true) node.setAttribute(key, "");
      else node.setAttribute(key, String(value));
    });
    return node;
  }

  function append(node, children) {
    if (children === undefined || children === null) return node;
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === undefined || child === null || child === false) return;
      node.appendChild(child && child.nodeType ? child : doc.createTextNode(String(child)));
    });
    return node;
  }

  function el(tag, attrs, children) {
    if (api && typeof api.el === "function") return api.el(tag, attrs || {}, children);
    return append(setAttributes(doc.createElement(tag), attrs || {}), children);
  }

  function clear(node) {
    if (typeof node.replaceChildren === "function") node.replaceChildren();
    else while (node.firstChild) node.removeChild(node.firstChild);
  }

  function statusText(status) {
    if (status === STATUS.PASS) return "PASS";
    if (status === STATUS.WARN) return "WARN";
    if (status === STATUS.BLOCK) return "BLOCK";
    if (status === STATUS.PENDING) return "待执行";
    return status || "—";
  }

  function statusClass(status) {
    return String(status || "pending").toLowerCase();
  }

  function installStyles() {
    if (doc.getElementById(STYLE_ID)) return;
    var style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".el-lab { --el-panel: var(--block-bg, #f4f1e9); --el-muted: var(--fg-soft, #6b6557); --el-border: var(--border, #d7d0c2); --el-accent: var(--accent, #315f9d); --el-pass: var(--cl-green, #39734d); --el-warn: var(--cl-gold, #9b6a12); --el-block: var(--cl-red, #b64335); max-width: 100%; min-width: 0; margin: 1.5rem 0 2rem; color: var(--fg); line-height: 1.5; overflow: hidden; }",
      ".el-lab *, .el-lab *::before, .el-lab *::after { box-sizing: border-box; }",
      ".el-shell { max-width: 100%; min-width: 0; overflow: hidden; border: 1px solid var(--el-border); border-radius: 8px; background: var(--bg); }",
      ".el-header { padding: 1rem 1.1rem .9rem; border-bottom: 1px solid var(--el-border); background: var(--el-panel); }",
      ".el-kicker { margin: 0 0 .25rem; color: var(--el-accent); font-size: .75rem; font-weight: 800; letter-spacing: .04em; }",
      ".el-header h3 { margin: 0; color: var(--fg); font-size: 1.2rem; }",
      ".el-header p { margin: .4rem 0 0; color: var(--el-muted); }",
      ".el-toolbar { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: .7rem; padding: .8rem 1.1rem; border-bottom: 1px solid var(--el-border); background: var(--bg); }",
      ".el-control { display: grid; gap: .25rem; min-width: 0; color: var(--el-muted); font-size: .78rem; font-weight: 700; }",
      ".el-control select, .el-lab button { min-width: 0; min-height: 44px; border: 1px solid var(--el-border); border-radius: 6px; background: var(--bg); color: var(--fg); font: inherit; }",
      ".el-control select { width: 100%; padding: .5rem .65rem; }",
      ".el-lab button { padding: .5rem .75rem; cursor: pointer; line-height: 1.25; overflow-wrap: anywhere; }",
      ".el-lab button:hover { border-color: var(--el-accent); }",
      ".el-lab button:focus-visible, .el-lab select:focus-visible { outline: 3px solid var(--cl-focus, #1769aa); outline-offset: 2px; }",
      ".el-lab button.el-primary, .el-lab button[aria-pressed=true] { border-color: var(--el-accent); background: var(--el-accent); color: var(--bg); }",
      ".el-lab button:disabled { cursor: not-allowed; opacity: .55; }",
      ".el-actions { display: flex; flex-wrap: wrap; gap: .5rem; grid-column: 1 / -1; }",
      ".el-actions > * { flex: 1 1 11rem; }",
      ".el-prediction { padding: .85rem 1.1rem; border-bottom: 1px solid var(--el-border); background: var(--bg); }",
      ".el-prediction h4, .el-section-title { margin: 0; color: var(--fg); font-size: .95rem; }",
      ".el-prediction p { margin: .35rem 0 .65rem; color: var(--el-muted); font-size: .82rem; }",
      ".el-prediction-buttons { display: grid; grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr)); gap: .45rem; }",
      ".el-prediction-buttons button { font-size: .78rem; }",
      ".el-feedback { margin-top: .6rem; padding: .55rem .65rem; border-left: 3px solid var(--el-accent); background: var(--el-panel); color: var(--fg); font-size: .8rem; }",
      ".el-flow { padding: .8rem 1.1rem .7rem; border-bottom: 1px solid var(--el-border); }",
      ".el-flow svg { display: block; width: 100%; height: auto; color: var(--fg); }",
      ".el-flow rect { fill: var(--el-panel); stroke: var(--el-border); stroke-width: 1.5; }",
      ".el-flow text { fill: currentColor; font-family: inherit; font-size: 13px; font-weight: 700; text-anchor: middle; }",
      ".el-flow .el-flow-node[data-status=pass] rect { fill: color-mix(in srgb, var(--el-pass) 16%, var(--bg)); stroke: var(--el-pass); }",
      ".el-flow .el-flow-node[data-status=warn] rect { fill: color-mix(in srgb, var(--el-warn) 16%, var(--bg)); stroke: var(--el-warn); }",
      ".el-flow .el-flow-node[data-status=block] rect { fill: color-mix(in srgb, var(--el-block) 16%, var(--bg)); stroke: var(--el-block); }",
      ".el-flow .el-flow-node[data-status=pending] rect { fill: var(--el-panel); stroke: var(--el-border); }",
      ".el-flow .el-flow-arrow { stroke: var(--el-border); stroke-width: 1.5; }",
      ".el-main { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr); gap: .85rem; padding: 1rem 1.1rem 1.1rem; }",
      ".el-card { min-width: 0; padding: .75rem; border: 1px solid var(--el-border); background: var(--el-panel); }",
      ".el-card + .el-card { margin-top: .7rem; }",
      ".el-card h4 { margin: 0 0 .5rem; color: var(--fg); font-size: .9rem; }",
      ".el-card p { margin: .45rem 0 0; color: var(--fg); font-size: .8rem; overflow-wrap: anywhere; }",
      ".el-muted { color: var(--el-muted) !important; }",
      ".el-guards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .45rem; margin-bottom: .7rem; }",
      ".el-guard { min-width: 0; padding: .55rem; border: 1px solid var(--el-border); background: var(--bg); }",
      ".el-guard-head { display: flex; justify-content: space-between; gap: .35rem; align-items: start; }",
      ".el-guard strong { min-width: 0; color: var(--fg); font-size: .8rem; }",
      ".el-guard small { display: block; margin-top: .25rem; color: var(--el-muted); font-size: .74rem; overflow-wrap: anywhere; }",
      ".el-status { flex: 0 0 auto; font-size: .7rem; font-weight: 800; letter-spacing: .03em; }",
      ".el-status.pass, .el-status.supported, .el-status.ready { color: var(--el-pass); } .el-status.warn, .el-status.unverified, .el-status.revise { color: var(--el-warn); } .el-status.block, .el-status.unsupported, .el-status.blocked { color: var(--el-block); } .el-status.pending { color: var(--el-muted); }",
      ".el-table-wrap { max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }",
      ".el-table { width: 100%; min-width: 540px; border-collapse: collapse; font-size: .75rem; font-variant-numeric: tabular-nums; }",
      ".el-table th, .el-table td { padding: .4rem .45rem; border-bottom: 1px solid var(--el-border); text-align: left; vertical-align: top; overflow-wrap: anywhere; }",
      ".el-table th { color: var(--el-muted); font-weight: 750; white-space: nowrap; }",
      ".el-table td { color: var(--fg); }",
      ".el-table .pass { color: var(--el-pass); font-weight: 800; } .el-table .warn { color: var(--el-warn); font-weight: 800; } .el-table .block { color: var(--el-block); font-weight: 800; }",
      ".el-claim { padding: .65rem .7rem; border-left: 3px solid var(--el-accent); background: var(--bg); font-size: .82rem; overflow-wrap: anywhere; }",
      ".el-claim + .el-claim { margin-top: .55rem; border-left-color: var(--el-pass); }",
      ".el-trace { display: grid; gap: .35rem; margin: 0; padding: 0; list-style: none; }",
      ".el-trace li { display: grid; grid-template-columns: 4.2rem minmax(0, 1fr); gap: .5rem; padding: .45rem .5rem; border-bottom: 1px solid var(--el-border); font-size: .76rem; }",
      ".el-trace li:last-child { border-bottom: 0; } .el-trace strong { color: var(--el-muted); } .el-trace span { overflow-wrap: anywhere; }",
      ".el-reasons { margin: .45rem 0 0; padding-left: 1.1rem; color: var(--el-block); font-size: .78rem; }",
      ".el-note { color: var(--el-muted) !important; font-size: .76rem !important; }",
      "@media (max-width: 760px) { .el-toolbar, .el-main { grid-template-columns: minmax(0, 1fr); } .el-actions { grid-column: auto; } .el-prediction-buttons { grid-template-columns: repeat(2, minmax(0, 1fr)); } .el-main { padding-left: .75rem; padding-right: .75rem; } .el-toolbar, .el-prediction, .el-flow { padding-left: .75rem; padding-right: .75rem; } }",
      "@media (max-width: 420px) { .el-guards { grid-template-columns: minmax(0, 1fr); } .el-prediction-buttons { grid-template-columns: minmax(0, 1fr); } .el-actions > * { flex-basis: 100%; } }"
    ].join("\n");
    doc.head.appendChild(style);
  }

  function makeSvg(result) {
    var svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 640 94");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "四阶段论文证据链审计流程");
    var xPositions = [7, 165, 323, 481];
    result.guards.forEach(function (guard, index) {
      if (index > 0) {
        var line = doc.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", String(xPositions[index - 1] + 142));
        line.setAttribute("y1", "40");
        line.setAttribute("x2", String(xPositions[index] - 8));
        line.setAttribute("y2", "40");
        line.setAttribute("class", "el-flow-arrow");
        svg.appendChild(line);
      }
      var group = doc.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("class", "el-flow-node");
      group.setAttribute("data-status", statusClass(guard.executed ? guard.status : STATUS.PENDING));
      var rect = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", String(xPositions[index]));
      rect.setAttribute("y", "18");
      rect.setAttribute("width", "142");
      rect.setAttribute("height", "44");
      rect.setAttribute("rx", "5");
      group.appendChild(rect);
      var title = doc.createElementNS("http://www.w3.org/2000/svg", "text");
      title.setAttribute("x", String(xPositions[index] + 71));
      title.setAttribute("y", "36");
      title.textContent = guard.label;
      group.appendChild(title);
      var state = doc.createElementNS("http://www.w3.org/2000/svg", "text");
      state.setAttribute("x", String(xPositions[index] + 71));
      state.setAttribute("y", "52");
      state.setAttribute("font-size", "10");
      state.textContent = statusText(guard.executed ? guard.status : STATUS.PENDING);
      group.appendChild(state);
      svg.appendChild(group);
    });
    return svg;
  }

  function table(title, headers, rows) {
    return el("section", { className: "el-card" }, [
      el("h4", { text: title }),
      el("div", { className: "el-table-wrap" }, [
        el("table", { className: "el-table" }, [
          el("thead", {}, [el("tr", {}, headers.map(function (header) { return el("th", { scope: "col", text: header }); }))]),
          el("tbody", {}, rows)
        ])
      ])
    ]);
  }

  function mount(root) {
    installStyles();
    INSTANCE_COUNT += 1;
    var id = "el-" + INSTANCE_COUNT;
    var state = { presetId: "clean", targetPolicy: "draft", guardStage: 0, prediction: null };
    var shell = el("div", { className: "el-lab el-shell", id: id });
    var header = el("header", { className: "el-header" }, [
      el("p", { className: "el-kicker", text: "FICTIONAL EVIDENCE LEDGER · NO NETWORK" }),
      el("h3", { text: "论文证据链审计台" }),
      el("p", { text: "完全虚构的教学记录；先预测哪一关会失败，再逐阶段执行四个 guard。" })
    ]);
    var presetSelect = el("select", { id: id + "-preset", "aria-label": "选择虚构教学预设" }, Object.keys(PRESETS).map(function (key) {
      return el("option", { value: key, text: PRESETS[key].label });
    }));
    var policySelect = el("select", { id: id + "-policy", "aria-label": "选择目标政策" }, Object.keys(TARGET_POLICIES).map(function (key) {
      return el("option", { value: key, text: TARGET_POLICIES[key].label });
    }));
    var runButton = el("button", { type: "button", className: "el-primary", text: "运行下一关（0/4）" });
    var allButton = el("button", { type: "button", text: "运行完整审计" });
    var resetButton = el("button", { type: "button", text: "重置并重新预测" });
    var toolbar = el("div", { className: "el-toolbar" }, [
      el("label", { className: "el-control", htmlFor: id + "-preset" }, ["教学预设", presetSelect]),
      el("label", { className: "el-control", htmlFor: id + "-policy" }, ["目标政策（会变化）", policySelect]),
      el("div", { className: "el-actions" }, [runButton, allButton, resetButton])
    ]);
    var predictionFeedback = el("div", { className: "el-feedback", "aria-live": "polite", text: "尚未提交预测。" });
    var predictionOptions = GUARD_STAGES.concat([{ id: "none", label: "全部四关 PASS" }]);
    var predictionButtons = predictionOptions.map(function (stage) {
      return el("button", { type: "button", text: stage.label, "data-prediction": stage.id });
    });
    var prediction = el("section", { className: "el-prediction" }, [
      el("h4", { text: "先预测：哪一关最先不是 PASS？" }),
      el("p", { text: "预测不会改变模型；它只把你的注意力放在“身份—支持—原文—政策”的顺序上。干净链条可以预测“没有失败”。" }),
      el("div", { className: "el-prediction-buttons" }, predictionButtons),
      predictionFeedback
    ]);
    var flow = el("section", { className: "el-flow" }, [makeSvg(audit("clean", { guardStage: 0, targetPolicy: "draft" }))]);
    var progress = el("p", { className: "el-note", "aria-live": "polite", text: "" });
    var guardPanel = el("div", { className: "el-guards" });
    var matrixPanel = el("div");
    var claimsPanel = el("div");
    var sourcePanel = el("div");
    var tracePanel = el("div");
    var left = el("div", {}, [
      el("section", { className: "el-card" }, [el("h4", { text: "四关状态" }), guardPanel, progress]),
      matrixPanel,
      tracePanel
    ]);
    var right = el("div", {}, [claimsPanel, sourcePanel]);
    var main = el("main", { className: "el-main" }, [left, right]);
    shell.appendChild(header);
    shell.appendChild(toolbar);
    shell.appendChild(prediction);
    shell.appendChild(flow);
    shell.appendChild(main);
    root.replaceChildren(shell);

    function choosePrediction(idValue) {
      state.prediction = idValue;
      render();
    }

    function renderGuard(guard) {
      var visible = guard.executed ? guard.status : STATUS.PENDING;
      return el("div", { className: "el-guard", "data-status": statusClass(visible) }, [
        el("div", { className: "el-guard-head" }, [
          el("strong", { text: guard.label }),
          el("span", { className: "el-status " + statusClass(visible), text: statusText(visible) })
        ]),
        el("small", { text: guard.executed ? guard.detail : "待执行；当前只显示预测前的等待状态。" })
      ]);
    }

    function renderMatrix(result) {
      return table("claim-source matrix", ["维度", "原论断片段", "来源", "证据范围", "结果"], result.claimSourceMatrix.map(function (row) {
        return el("tr", {}, [
          el("td", { text: row.dimension }),
          el("td", { text: row.claim }),
          el("td", { text: row.source }),
          el("td", { text: row.evidence + "；" + row.reason }),
          el("td", { className: statusClass(row.status), text: statusText(row.status) })
        ]);
      }));
    }

    function renderClaims(result) {
      var submissionClass = result.submission.state === "READY" ? "pass" : (result.submission.state === "BLOCKED" ? "block" : "warn");
      return el("section", { className: "el-card" }, [
        el("h4", { text: "原论断 → 限定论断" }),
        el("div", { className: "el-claim", text: "原论断：" + result.originalClaim }),
        el("div", { className: "el-claim", text: "修订后：" + result.revisedClaim }),
        el("p", { className: "el-note", text: "限定论断不是替证据辩护；它把主张缩回证据真正覆盖的范围。" }),
        el("h4", { className: "el-section-title", text: "可提交状态" }),
        el("p", { className: "el-status " + submissionClass, text: result.submission.label }),
        el("p", { className: "el-status " + statusClass(result.claimFactual.status), text: "论断事实性：" + statusText(result.claimFactual.status) }),
        el("p", { text: result.submission.detail }),
        el("p", { className: "el-note", text: "政策 guard 独立于论断事实性：政策未知时 submission-ready=false，但不自动 BLOCK 论断事实性。" }),
        result.submission.reasons.length ? el("ul", { className: "el-reasons" }, result.submission.reasons.map(function (reason) { return el("li", { text: reason }); })) : null
      ]);
    }

    function renderSource(result) {
      var source = result.source;
      var metadata = source.metadata || {};
      var quote = source.quote || {};
      return el("section", { className: "el-card" }, [
        el("h4", { text: "来源卡片（内置虚构，不访问网络）" }),
        el("p", { text: source.id + " · " + source.title }),
        el("p", { className: "el-note", text: "类型：" + source.type + "；身份状态：" + metadata.status + "；identifier：" + (metadata.identifier || "—") }),
        el("p", { className: "el-note", text: "study：" + (source.study ? source.study.sample : "—") + "；design：" + (source.study ? source.study.design : "—") }),
        el("p", { className: "el-note", text: "引文：" + (quote.suppliedText || "—") }),
        el("p", { className: "el-note", text: "定位：" + (quote.locator || "—") + "；预期：" + (quote.expectedLocator || "—") }),
        el("p", { className: "el-note", text: "边界提醒：候选 DOI/标题匹配只能做 discovery triage；摘要不足以核对全文范围；候选不得直接进入参考文献。" }),
        el("p", { className: "el-note", text: "DOI/元数据 resolved 只证明记录身份，不证明研究真实或支持论断；未解析不等于证伪。" })
      ]);
    }

    function renderTrace(result) {
      return el("section", { className: "el-card" }, [
        el("h4", { text: "审计轨迹" }),
        el("ol", { className: "el-trace" }, result.auditTrace.map(function (entry) {
          var className = entry.status === "INFO" ? "el-muted" : "el-status " + statusClass(entry.status);
          return el("li", {}, [
            el("strong", { text: entry.stage === 0 ? "开始" : "第 " + entry.stage + " 关" }),
            el("span", {}, [el("span", { className: className, text: statusText(entry.status) + " · " }), entry.label + "：" + entry.text])
          ]);
        }))
      ]);
    }

    function renderPrediction(result) {
      var full = audit(state.presetId, { guardStage: 4, targetPolicy: state.targetPolicy });
      predictionButtons.forEach(function (button) {
        var selected = button.getAttribute("data-prediction") === state.prediction;
        button.setAttribute("aria-pressed", selected ? "true" : "false");
      });
      if (!state.prediction) {
        predictionFeedback.textContent = "尚未提交预测。";
        return;
      }
      var actual = full.firstNonPass ? full.firstNonPass.id : "none";
      var correct = state.prediction === actual;
      var predictedLabel = predictionOptions.filter(function (stage) { return stage.id === state.prediction; })[0];
      var actualLabel = actual === "none" ? "全部四关 PASS" : full.firstNonPass.label + "（" + full.firstNonPass.status + "）";
      predictionFeedback.textContent = (correct ? "预测命中：" : "预测未命中：") +
        "你选了“" + (predictedLabel ? predictedLabel.label : "—") + "”；模型的首个非 PASS 是“" + actualLabel + "”。";
    }

    function render() {
      var result = audit(state.presetId, { guardStage: state.guardStage, targetPolicy: state.targetPolicy });
      presetSelect.value = state.presetId;
      policySelect.value = state.targetPolicy;
      guardPanel.replaceChildren.apply(guardPanel, result.guards.map(renderGuard));
      progress.textContent = "已执行 " + result.execution.completed + "/" + result.execution.total + "；目标政策：" + result.targetPolicy.label + "。" +
        (result.execution.next ? " 下一关：" + result.execution.next.label + "。" : " 四关已执行完毕。");
      claimsPanel.replaceChildren(renderClaims(result));
      sourcePanel.replaceChildren(renderSource(result));
      matrixPanel.replaceChildren(renderMatrix(result));
      tracePanel.replaceChildren(renderTrace(result));
      clear(flow);
      flow.appendChild(makeSvg(result));
      runButton.textContent = state.guardStage < GUARD_STAGES.length
        ? "运行下一关（" + state.guardStage + "/" + GUARD_STAGES.length + "）"
        : "四关已执行（4/4）";
      runButton.disabled = state.guardStage === GUARD_STAGES.length;
      allButton.disabled = state.guardStage === GUARD_STAGES.length;
      renderPrediction(result);
    }

    predictionButtons.forEach(function (button) {
      button.addEventListener("click", function () { choosePrediction(button.getAttribute("data-prediction")); });
    });
    presetSelect.addEventListener("change", function () {
      state.presetId = presetSelect.value;
      state.guardStage = 0;
      state.prediction = null;
      render();
    });
    policySelect.addEventListener("change", function () {
      state.targetPolicy = policySelect.value;
      state.guardStage = 0;
      state.prediction = null;
      render();
    });
    runButton.addEventListener("click", function () {
      state.guardStage = Math.min(GUARD_STAGES.length, state.guardStage + 1);
      render();
    });
    allButton.addEventListener("click", function () {
      state.guardStage = GUARD_STAGES.length;
      render();
    });
    resetButton.addEventListener("click", function () {
      state.guardStage = 0;
      state.prediction = null;
      render();
    });
    render();
  }

  host.CourseLearning.register("evidence-ledger", mount);
})(typeof window !== "undefined" ? window : null);
