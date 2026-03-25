// Intent Router — classifies student input to the correct math module.
// Keyword trigger matching. No LLM call needed.

const TRIGGERS = {
  'numbers': ['number', 'integer', 'fraction', 'decimal', 'add', 'subtract', 'multiply', 'divide', 'exponent', 'square root', 'absolute value', 'order of operations', 'pemdas', 'rational', 'irrational', 'negative', 'positive', 'percent to decimal', '整数', '分数', '小数', '加法', '减法', '乘法', '除法', '指数', '平方根', '运算顺序', '绝对值'],
  'algebra': ['algebra', 'equation', 'variable', 'expression', 'solve', 'inequality', 'slope', 'intercept', 'linear', 'function', 'graph', 'coordinate', 'y=mx+b', 'system', 'polynomial', '代数', '方程', '变量', '表达式', '求解', '不等式', '斜率', '截距', '线性', '函数', '图像', '坐标'],
  'geometry': ['geometry', 'area', 'perimeter', 'volume', 'angle', 'triangle', 'circle', 'rectangle', 'polygon', 'congruent', 'similar', 'transform', 'reflect', 'rotate', 'translate', 'pythagorean', 'pi', 'radius', 'diameter', '几何', '面积', '周长', '体积', '角', '三角形', '圆', '矩形', '多边形', '全等', '相似', '变换'],
  'ratios': ['ratio', 'proportion', 'percent', 'rate', 'unit rate', 'scale', 'discount', 'tax', 'tip', 'markup', '比', '比例', '百分比', '比率', '单位费率', '比例尺', '折扣', '税'],
  'data': ['data', 'mean', 'median', 'mode', 'range', 'probability', 'statistics', 'histogram', 'scatter plot', 'graph', 'random', 'sample', 'survey', 'box plot', '数据', '平均数', '中位数', '众数', '概率', '统计', '直方图', '散点图', '随机', '样本'],
  'study-planner': ['plan', 'schedule', 'progress', 'what should i study', "what's next", 'what next', 'goals', 'diagnostic', 'review all', '计划', '安排', '进度', '学什么', '下一步', '目标'],
};

// Cross-domain prerequisite gates (Tier 1)
const PREREQUISITE_GATES = [
  {
    id: 'numbers-gates-algebra',
    condition: (mastery, activeModule, recentScores) =>
      activeModule === 'algebra' &&
      (mastery.numbers || 0) < 0.50 &&
      recentScores.length >= 2 &&
      recentScores.slice(-2).every(s => s.pct < 0.60),
    target: 'numbers',
    reason: "运算基础是学代数的关键。我们先把数与运算打扎实。",
    priority: 1,
  },
  {
    id: 'numbers-gates-geometry',
    condition: (mastery, activeModule) =>
      activeModule === 'geometry' &&
      (mastery.numbers || 0) < 0.50,
    target: 'numbers',
    reason: "几何计算需要扎实的运算基础。我们先复习数与运算。",
    priority: 1,
  },
  {
    id: 'numbers-gates-ratios',
    condition: (mastery, activeModule) =>
      activeModule === 'ratios' &&
      (mastery.numbers || 0) < 0.50,
    target: 'numbers',
    reason: "比例计算建立在运算基础上。我们先加强数与运算。",
    priority: 1,
  },
  {
    id: 'ratios-gates-data',
    condition: (mastery, activeModule) =>
      activeModule === 'data' &&
      (mastery.ratios || 0) < 0.50,
    target: 'ratios',
    reason: "统计学需要用到比例和百分比。我们先学好比例。",
    priority: 1,
  },
];

// Smart detours (Tier 2)
const SMART_DETOURS = [
  {
    id: 'numbers-ready-for-algebra',
    condition: (mastery) =>
      (mastery.numbers || 0) >= 0.80 &&
      (mastery.algebra || 0) < 0.60,
    target: 'algebra',
    reason: "你的运算基础很扎实了——我们来看看代数如何把这些规律用字母表达出来。",
    priority: 2,
  },
  {
    id: 'numbers-ready-for-ratios',
    condition: (mastery) =>
      (mastery.numbers || 0) >= 0.80 &&
      (mastery.ratios || 0) < 0.60,
    target: 'ratios',
    reason: "运算能力很强！比例就是运算的延伸——准备好了吗？",
    priority: 2,
  },
  {
    id: 'ratios-ready-for-data',
    condition: (mastery) =>
      (mastery.ratios || 0) >= 0.80 &&
      (mastery.data || 0) < 0.60,
    target: 'data',
    reason: "你的比例知识很扎实——统计和概率正好需要这些。",
    priority: 2,
  },
  {
    id: 'algebra-ready-for-geometry',
    condition: (mastery) =>
      (mastery.algebra || 0) >= 0.80 &&
      (mastery.geometry || 0) < 0.60,
    target: 'geometry',
    reason: "代数学得很好——几何中很多公式都需要代数思维。",
    priority: 2,
  },
];

// Tier 3: Difficulty adjustments
const DIFFICULTY_ADJUSTMENTS = [
  {
    id: 'numbers-accelerates-algebra',
    condition: (mastery, activeModule) =>
      (mastery.numbers || 0) >= 0.85 && activeModule === 'algebra',
    adjustments: { skipBasicArithmetic: true, complexityBias: 'high' },
  },
  {
    id: 'algebra-accelerates-geometry',
    condition: (mastery, activeModule) =>
      (mastery.algebra || 0) >= 0.85 && activeModule === 'geometry',
    adjustments: { skipBasicFormulas: true, complexityBias: 'high' },
  },
  {
    id: 'low-numbers-scaffolds-algebra',
    condition: (mastery, activeModule) =>
      (mastery.numbers || 0) < 0.40 && activeModule === 'algebra',
    adjustments: { addArithmeticReview: true, complexityBias: 'low' },
  },
  {
    id: 'low-ratios-scaffolds-data',
    condition: (mastery, activeModule) =>
      (mastery.ratios || 0) < 0.40 && activeModule === 'data',
    adjustments: { addRatioReview: true, complexityBias: 'low' },
  },
];

const CROSS_MODULE_RULES = [...PREREQUISITE_GATES, ...SMART_DETOURS];

/**
 * Route student input to a module.
 */
function route(input, currentModule) {
  const lower = input.toLowerCase();
  const scores = {};

  for (const [mod, triggers] of Object.entries(TRIGGERS)) {
    const matched = triggers.filter(t => lower.includes(t));
    if (matched.length > 0) {
      scores[mod] = { count: matched.length, triggers: matched };
    }
  }

  const entries = Object.entries(scores);

  if (entries.length === 0) {
    if (/\b(help|start|begin|hi|hello|hey)\b/i.test(lower) && !currentModule) {
      return { module: 'study-planner', confidence: 'low', triggers: ['greeting/help'] };
    }
    if (currentModule) {
      return { module: currentModule, confidence: 'continuation', triggers: [] };
    }
    return { module: null, confidence: 'none', triggers: [] };
  }

  if (entries.length === 1) {
    const [mod, data] = entries[0];
    return { module: mod, confidence: 'high', triggers: data.triggers };
  }

  if (currentModule && scores[currentModule]) {
    return { module: currentModule, confidence: 'medium', triggers: scores[currentModule].triggers };
  }

  entries.sort((a, b) => b[1].count - a[1].count);
  const [bestMod, bestData] = entries[0];
  return { module: bestMod, confidence: entries[0][1].count > 1 ? 'high' : 'medium', triggers: bestData.triggers };
}

/**
 * Evaluate cross-module routing rules.
 */
function evaluateCrossModuleRules(mastery, activeModule, options = {}) {
  const recentScores = (options.recentScores || []).map(s => ({
    ...s,
    pct: s.pct != null ? s.pct : (s.total > 0 ? s.score / s.total : 0),
  }));
  const lastDetour = options.lastDetour || null;

  for (const rule of CROSS_MODULE_RULES) {
    if (lastDetour && rule.target === lastDetour.from) continue;

    const match = rule.condition.length >= 3
      ? rule.condition(mastery, activeModule, recentScores)
      : rule.condition(mastery, activeModule);

    if (match) {
      return { target: rule.target, reason: rule.reason, priority: rule.priority, ruleId: rule.id };
    }
  }
  return null;
}

/**
 * Evaluate Tier 3 difficulty adjustments.
 */
function evaluateDifficultyAdjustments(mastery, activeModule) {
  const adjustments = {};
  for (const rule of DIFFICULTY_ADJUSTMENTS) {
    if (rule.condition(mastery, activeModule)) {
      Object.assign(adjustments, rule.adjustments);
    }
  }
  return adjustments;
}

function isModuleSwitch(input, currentModule) {
  const switchPatterns = [
    /\b(switch|change|let's do|can we do|how about|move to|try)\b/i,
    /\b(instead|different|something else|another topic)\b/i,
  ];
  const wantsSwitch = switchPatterns.some(p => p.test(input));
  if (!wantsSwitch) return false;
  const result = route(input, null);
  return result.module && result.module !== currentModule;
}

module.exports = {
  route,
  evaluateCrossModuleRules,
  evaluateDifficultyAdjustments,
  isModuleSwitch,
  TRIGGERS,
  PREREQUISITE_GATES,
  SMART_DETOURS,
  DIFFICULTY_ADJUSTMENTS,
};
