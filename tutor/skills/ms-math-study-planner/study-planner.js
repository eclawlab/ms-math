// MS Math Study Planner/Coordinator (Grades 6-8). No deps.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'ms-math-study-planner');

const VALID_GRADES = ['grade-6', 'grade-7', 'grade-8'];
const VALID_GOALS = ['test-prep', 'topic-mastery', 'grade-level-completion', 'stem-focus', 'catch-up', 'get-ahead'];

const DOMAINS = {
  'numbers': { dataDir: 'ms-math-numbers', skill: 'ms-math-numbers', categories: ['integer-operations', 'fractions-decimals', 'order-of-operations', 'exponents-roots', 'number-properties'] },
  'algebra': { dataDir: 'ms-math-algebra', skill: 'ms-math-algebra', categories: ['variables-expressions', 'one-step-equations', 'multi-step-equations', 'inequalities', 'functions-patterns'] },
  'geometry': { dataDir: 'ms-math-geometry', skill: 'ms-math-geometry', categories: ['angles-lines', 'triangles-polygons', 'area-perimeter', 'volume-surface-area', 'transformations'] },
  'ratios': { dataDir: 'ms-math-ratios', skill: 'ms-math-ratios', categories: ['ratio-basics', 'proportions', 'unit-rates', 'percents', 'percent-applications'] },
  'data': { dataDir: 'ms-math-data', skill: 'ms-math-data', categories: ['data-displays', 'mean-median-mode', 'sampling-inference', 'probability-basics', 'compound-probability'] },
};

const DOMAIN_KEYS = Object.keys(DOMAINS);
const DOMAIN_LABELS = {
  'numbers': '数与运算',
  'algebra': '代数思维',
  'geometry': '几何与测量',
  'ratios': '比例与百分比',
  'data': '数据与概率',
};

const CATEGORY_LABELS = {
  'integer-operations': '整数运算',
  'fractions-decimals': '分数与小数',
  'order-of-operations': '运算顺序',
  'exponents-roots': '指数与平方根',
  'number-properties': '数的性质',
  'variables-expressions': '变量与表达式',
  'one-step-equations': '一步方程',
  'multi-step-equations': '多步方程',
  'inequalities': '不等式',
  'functions-patterns': '函数与规律',
  'angles-lines': '角与线',
  'triangles-polygons': '三角形与多边形',
  'area-perimeter': '面积与周长',
  'volume-surface-area': '体积与表面积',
  'transformations': '图形变换',
  'ratio-basics': '比的基础',
  'proportions': '比例',
  'unit-rates': '单位比率',
  'percents': '百分数',
  'percent-applications': '百分数应用',
  'data-displays': '数据展示',
  'mean-median-mode': '平均数、中位数与众数',
  'sampling-inference': '抽样与推断',
  'probability-basics': '概率基础',
  'compound-probability': '复合概率',
};

// Percentages map to DOMAIN_KEYS order: numbers, algebra, geometry, ratios, data
const TIME_ALLOC = {
  'test-prep':              [22, 22, 18, 20, 18],
  'topic-mastery':          [20, 20, 20, 20, 20],
  'grade-level-completion': [20, 20, 20, 20, 20],
  'stem-focus':             [20, 25, 20, 15, 20],
  'catch-up':               [25, 25, 18, 18, 14],
  'get-ahead':              [15, 25, 20, 18, 22],
};

// ---------------------------------------------------------------------------
// Diagnostic Question Bank — 5 questions per domain, easy to hard
// ---------------------------------------------------------------------------

const DIAGNOSTIC_BANK = {
  'numbers': [
    {
      difficulty: 1,
      question: '计算：-3 + 8 = ?',
      expected: '5。将正数8与负数-3相加，因为8比3大，结果为正：8 - 3 = 5。',
      category: 'integer-operations',
    },
    {
      difficulty: 2,
      question: '计算：2/3 + 1/4 = ?',
      expected: '11/12。先通分：2/3 = 8/12，1/4 = 3/12，所以 8/12 + 3/12 = 11/12。',
      category: 'fractions-decimals',
    },
    {
      difficulty: 3,
      question: '计算：3 + 4 × 2 - (6 ÷ 3) = ?',
      expected: '9。先算括号内：6 ÷ 3 = 2；再算乘法：4 × 2 = 8；最后从左到右：3 + 8 - 2 = 9。',
      category: 'order-of-operations',
    },
    {
      difficulty: 4,
      question: '简化：√72 = ?',
      expected: '6√2。因为 72 = 36 × 2，所以 √72 = √36 × √2 = 6√2。',
      category: 'exponents-roots',
    },
    {
      difficulty: 5,
      question: '证明：任何两个连续整数的积一定是偶数。',
      expected: '两个连续整数中必有一个是偶数。偶数可以写成2k的形式，所以两个连续整数的积一定包含因子2，因此一定是偶数。形式化：设两个连续整数为n和n+1，则n(n+1)中n和n+1必有一个为偶数，所以乘积为偶数。',
      category: 'number-properties',
    },
  ],
  'algebra': [
    {
      difficulty: 1,
      question: '如果 x + 5 = 12，那么 x = ?',
      expected: 'x = 7。等式两边同时减去5：x = 12 - 5 = 7。',
      category: 'one-step-equations',
    },
    {
      difficulty: 2,
      question: '化简表达式：3(2x + 4) - 5x = ?',
      expected: 'x + 12。先分配律展开：6x + 12 - 5x，合并同类项：(6x - 5x) + 12 = x + 12。',
      category: 'variables-expressions',
    },
    {
      difficulty: 3,
      question: '解方程：2(x - 3) + 4 = 3x - 1',
      expected: 'x = -1。展开左边：2x - 6 + 4 = 3x - 1，即 2x - 2 = 3x - 1，移项：-2 + 1 = 3x - 2x，得 x = -1。',
      category: 'multi-step-equations',
    },
    {
      difficulty: 4,
      question: '解不等式并在数轴上表示：-2x + 6 > 10',
      expected: 'x < -2。两边减6：-2x > 4，两边除以-2（注意变号）：x < -2。在数轴上，-2处画空心圆，向左画箭头。',
      category: 'inequalities',
    },
    {
      difficulty: 5,
      question: '一个数列的前几项为：2, 5, 10, 17, 26, ...。求第n项的通项公式，并求第10项。',
      expected: '通项公式为 aₙ = n² + 1。验证：a₁ = 1+1=2, a₂ = 4+1=5, a₃ = 9+1=10, a₄ = 16+1=17, a₅ = 25+1=26。第10项 = 100 + 1 = 101。',
      category: 'functions-patterns',
    },
  ],
  'geometry': [
    {
      difficulty: 1,
      question: '两条直线相交形成的对顶角有什么关系？如果其中一个角是65°，其对顶角是多少度？',
      expected: '对顶角相等。如果一个角是65°，对顶角也是65°。相邻的两个角互补，即65° + 115° = 180°。',
      category: 'angles-lines',
    },
    {
      difficulty: 2,
      question: '一个三角形的两个角分别是45°和90°，求第三个角。这是什么类型的三角形？',
      expected: '第三个角 = 180° - 45° - 90° = 45°。这是一个等腰直角三角形（两个45°角相等，且有一个90°直角）。',
      category: 'triangles-polygons',
    },
    {
      difficulty: 3,
      question: '一个梯形的上底为6厘米，下底为10厘米，高为4厘米。求它的面积。',
      expected: '面积 = (上底 + 下底) × 高 ÷ 2 = (6 + 10) × 4 ÷ 2 = 16 × 4 ÷ 2 = 32平方厘米。',
      category: 'area-perimeter',
    },
    {
      difficulty: 4,
      question: '一个圆柱体的底面半径为3厘米，高为8厘米。求它的体积和表面积。（π取3.14）',
      expected: '体积 = πr²h = 3.14 × 9 × 8 = 226.08立方厘米。表面积 = 2πr² + 2πrh = 2 × 3.14 × 9 + 2 × 3.14 × 3 × 8 = 56.52 + 150.72 = 207.24平方厘米。',
      category: 'volume-surface-area',
    },
    {
      difficulty: 5,
      question: '在坐标平面上，三角形ABC的顶点为A(1,1)、B(4,1)、C(2,5)。将三角形绕原点顺时针旋转90°，求变换后各顶点的坐标。',
      expected: '顺时针旋转90°的变换规则：(x,y)→(y,-x)。所以A(1,1)→A\'(1,-1)，B(4,1)→B\'(1,-4)，C(2,5)→C\'(5,-2)。',
      category: 'transformations',
    },
  ],
  'ratios': [
    {
      difficulty: 1,
      question: '一个班级有男生12人，女生18人。男生与女生的比是多少？化简到最简比。',
      expected: '男生与女生的比 = 12:18。最大公因数是6，所以最简比 = 2:3。',
      category: 'ratio-basics',
    },
    {
      difficulty: 2,
      question: '如果 3/5 = x/20，求x的值。',
      expected: 'x = 12。交叉相乘：3 × 20 = 5 × x，即60 = 5x，所以x = 12。或者注意到20是5的4倍，所以x = 3 × 4 = 12。',
      category: 'proportions',
    },
    {
      difficulty: 3,
      question: '小明骑自行车3小时骑了45公里。求他的速度（单位比率），以及按此速度5小时能骑多远？',
      expected: '速度 = 45 ÷ 3 = 15公里/小时。5小时能骑 15 × 5 = 75公里。',
      category: 'unit-rates',
    },
    {
      difficulty: 4,
      question: '一件商品原价200元，先涨价25%，再打八折（即降价20%）。最终价格是多少？和原价比是涨了还是跌了？',
      expected: '涨价25%后：200 × 1.25 = 250元。再降价20%：250 × 0.8 = 200元。最终价格和原价相同，都是200元。这说明先涨25%再降20%恰好回到原价。',
      category: 'percents',
    },
    {
      difficulty: 5,
      question: '银行存款年利率为3%，按复利计算。存入10000元，3年后本金和利息共多少元？（精确到小数点后两位）',
      expected: '复利公式：A = P(1+r)ⁿ = 10000 × (1.03)³ = 10000 × 1.092727 = 10927.27元。3年共获利息 927.27元。',
      category: 'percent-applications',
    },
  ],
  'data': [
    {
      difficulty: 1,
      question: '以下是5名同学的数学成绩：85, 92, 78, 96, 89。请用条形图或折线图的方式描述这组数据，并说明哪种图表更合适，为什么？',
      expected: '条形图更合适，因为这是离散的个体数据对比。条形图能直观比较每位同学的成绩差异。折线图通常用于表示随时间变化的趋势。',
      category: 'data-displays',
    },
    {
      difficulty: 2,
      question: '求以下数据的平均数、中位数和众数：4, 7, 7, 9, 3, 7, 5, 12',
      expected: '平均数 = (4+7+7+9+3+7+5+12) ÷ 8 = 54 ÷ 8 = 6.75。排序后：3,4,5,7,7,7,9,12。中位数 = (7+7)/2 = 7（中间两个数的平均值）。众数 = 7（出现3次，最多）。',
      category: 'mean-median-mode',
    },
    {
      difficulty: 3,
      question: '一所学校有1200名学生。要调查学生对课间活动的偏好，以下哪种抽样方式更好？(A) 调查所有七年级学生 (B) 从每个年级随机抽取40名学生。请解释原因。',
      expected: '(B)更好。从每个年级随机抽取学生是分层随机抽样，能更好地代表全校学生。(A)只调查七年级，样本有偏差，不能代表其他年级学生的偏好。',
      category: 'sampling-inference',
    },
    {
      difficulty: 4,
      question: '一个袋子里有3个红球、4个蓝球和5个绿球。随机取一个球，求取到红球或蓝球的概率。',
      expected: '总球数 = 3 + 4 + 5 = 12。红球或蓝球 = 3 + 4 = 7个。概率 = 7/12 ≈ 0.583 或约58.3%。',
      category: 'probability-basics',
    },
    {
      difficulty: 5,
      question: '掷两枚骰子，求点数之和为7的概率。列出所有可能的组合。',
      expected: '两枚骰子共有6×6=36种等可能结果。点数之和为7的组合：(1,6)(2,5)(3,4)(4,3)(5,2)(6,1)，共6种。概率 = 6/36 = 1/6 ≈ 16.7%。',
      category: 'compound-probability',
    },
  ],
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// ---------------------------------------------------------------------------
// File I/O
// ---------------------------------------------------------------------------

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function profilePath(id) {
  return path.join(DATA_DIR, String(id).replace(/[^a-zA-Z0-9_-]/g, '_') + '.json');
}

function loadProfile(id) {
  const fp = profilePath(id);
  if (fs.existsSync(fp)) {
    try { return JSON.parse(fs.readFileSync(fp, 'utf8')); }
    catch { fs.renameSync(fp, fp + '.corrupt.' + Date.now()); }
  }
  return {
    studentId: id,
    grade: null,
    goal: null,
    dailyBudget: 30,
    createdAt: new Date().toISOString(),
    plans: [],
    assessments: [],
    diagnosticResults: [],
  };
}

function saveProfile(p) {
  ensureDataDir();
  fs.writeFileSync(profilePath(p.studentId), JSON.stringify(p, null, 2), 'utf8');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr, n) {
  return shuffle(arr).slice(0, Math.min(n, arr.length));
}

function allocateMinutes(budget, percents) {
  const raw = percents.map(p => budget * p / 100);
  const floored = raw.map(v => Math.floor(v));
  let leftover = budget - floored.reduce((a, b) => a + b, 0);
  const fracs = raw.map((v, i) => ({ i, f: v - floored[i] })).sort((a, b) => b.f - a.f);
  for (const { i } of fracs) {
    if (leftover <= 0) break;
    floored[i]++;
    leftover--;
  }
  return floored;
}

function progressBar(pct, width) {
  width = width || 10;
  const filled = Math.round(pct / 100 * width);
  const empty = width - filled;
  return '\u2588'.repeat(filled) + '\u2591'.repeat(empty);
}

function masteryLabel(pct) {
  if (pct >= 90) return 'mastered';
  if (pct >= 70) return 'proficient';
  if (pct >= 40) return 'developing';
  if (pct > 0) return 'emerging';
  return 'not-started';
}

// ---------------------------------------------------------------------------
// Domain data scanning
// ---------------------------------------------------------------------------

function scanDomainData(dataDir) {
  const fullPath = path.join(__dirname, '..', '..', 'data', dataDir);
  if (!fs.existsSync(fullPath)) return { found: false, students: {} };
  const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.json'));
  const students = {};
  for (const f of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(fullPath, f), 'utf8'));
      const sid = data.studentId || f.replace(/\.json$/, '');
      const skills = data.skills || {};
      let totalMastery = 0, count = 0;
      for (const [, info] of Object.entries(skills)) {
        if (info.mastery !== undefined) { totalMastery += info.mastery; count++; }
      }
      const avgMastery = count > 0 ? Math.round(totalMastery / count * 100) : 0;
      const assessCount = (data.assessments || []).length;
      const lastAssess = assessCount > 0 ? data.assessments[assessCount - 1].date : null;
      const categoryMastery = {};
      for (const [cat, info] of Object.entries(skills)) {
        categoryMastery[cat] = info.mastery !== undefined ? Math.round(info.mastery * 100) : 0;
      }
      students[sid] = {
        avgMastery,
        skillCount: count,
        assessments: assessCount,
        lastActivity: lastAssess,
        categoryMastery,
      };
    } catch { /* skip corrupt files */ }
  }
  return { found: true, students };
}

function aggregateProgress(studentId) {
  const results = {};
  let overallTotal = 0, overallSum = 0, domainCount = 0;

  for (const key of DOMAIN_KEYS) {
    const domain = DOMAINS[key];
    const scan = scanDomainData(domain.dataDir);
    const studentData = scan.found && scan.students[studentId] ? scan.students[studentId] : null;
    const mastery = studentData ? studentData.avgMastery : 0;

    results[key] = {
      label: DOMAIN_LABELS[key],
      skill: domain.skill,
      found: scan.found,
      mastery,
      assessments: studentData ? studentData.assessments : 0,
      lastActivity: studentData ? studentData.lastActivity : null,
      status: masteryLabel(mastery),
      categoryMastery: studentData ? studentData.categoryMastery : {},
    };

    overallSum += mastery;
    domainCount++;
    if (studentData && mastery >= 70) overallTotal++;
  }

  const overallMastery = domainCount > 0 ? Math.round(overallSum / domainCount) : 0;
  return { studentId, skills: results, overallMastery, domainsProficient: overallTotal, totalDomains: domainCount };
}

// ---------------------------------------------------------------------------
// Diagnostic generation
// ---------------------------------------------------------------------------

function generateDiagnostic(studentId, grade) {
  grade = grade || 'grade-7';
  const questions = [];
  let questionNumber = 1;

  for (const key of DOMAIN_KEYS) {
    const bank = DIAGNOSTIC_BANK[key];
    if (!bank || bank.length === 0) continue;

    const domainQuestions = bank.map(q => ({
      questionNumber: questionNumber++,
      domain: key,
      domainLabel: DOMAIN_LABELS[key],
      difficulty: q.difficulty,
      category: q.category,
      categoryLabel: CATEGORY_LABELS[q.category] || q.category,
      question: q.question,
      expectedAnswer: q.expected,
    }));
    questions.push(...domainQuestions);
  }

  return {
    studentId,
    grade,
    totalQuestions: questions.length,
    questionsPerDomain: 5,
    domains: DOMAIN_KEYS.map(k => DOMAIN_LABELS[k]),
    instructions: '逐题展示问题。学生作答后，与预期答案对比并评分。每个模块内题目从易（1）到难（5）递进。',
    questions,
  };
}

// ---------------------------------------------------------------------------
// Progress display
// ---------------------------------------------------------------------------

function formatProgressDashboard(studentId) {
  const agg = aggregateProgress(studentId);
  const lines = [];

  lines.push(`数学学习进度面板: ${studentId}`);
  lines.push('='.repeat(55));
  lines.push('');

  const maxLabelLen = Math.max(...DOMAIN_KEYS.map(k => DOMAIN_LABELS[k].length));

  for (const key of DOMAIN_KEYS) {
    const info = agg.skills[key];
    const label = info.label.padEnd(maxLabelLen);
    const bar = progressBar(info.mastery, 10);
    const pctStr = (info.mastery + '%').padStart(4);
    lines.push(`${label}  ${bar} ${pctStr}  [${info.status}]`);
  }

  lines.push('');
  lines.push(`总体: ${agg.overallMastery}% -- ${agg.domainsProficient}/${agg.totalDomains} 个模块达到熟练`);

  // Identify weakest domains for focus recommendation
  const weakest = DOMAIN_KEYS
    .map(k => ({ key: k, label: DOMAIN_LABELS[k], mastery: agg.skills[k].mastery }))
    .sort((a, b) => a.mastery - b.mastery)
    .filter(d => d.mastery < 70)
    .slice(0, 2);

  if (weakest.length > 0) {
    lines.push(`建议优先学习: ${weakest.map(w => w.label).join(' 和 ')}`);
  }

  return { display: lines.join('\n'), data: agg };
}

// ---------------------------------------------------------------------------
// Weekly plan generation
// ---------------------------------------------------------------------------

function generateWeeklyPlan(profile) {
  const goal = profile.goal || 'topic-mastery';
  const grade = profile.grade || 'grade-7';
  const budget = profile.dailyBudget || 30;
  const baseAlloc = TIME_ALLOC[goal] || TIME_ALLOC['topic-mastery'];
  const weeklyMinutes = allocateMinutes(budget * 5, baseAlloc);

  const agg = aggregateProgress(profile.studentId);

  // Sort domains by mastery (weakest first) for prioritized scheduling
  const domainPriority = DOMAIN_KEYS
    .map((k, i) => ({
      key: k,
      label: DOMAIN_LABELS[k],
      skill: DOMAINS[k].skill,
      mastery: agg.skills[k].mastery,
      categories: DOMAINS[k].categories,
      categoryMastery: agg.skills[k].categoryMastery || {},
      weeklyMinutes: weeklyMinutes[i],
      idx: i,
    }))
    .sort((a, b) => a.mastery - b.mastery);

  // Build day-by-day plan
  const days = [];
  const remaining = [...weeklyMinutes];
  const assignedCategories = {};

  for (let d = 0; d < 5; d++) {
    // Friday is review/spaced repetition day
    if (d === 4) {
      // Find the strongest domain for spaced repetition review
      const strongest = [...domainPriority].sort((a, b) => b.mastery - a.mastery)[0];
      const weakest = domainPriority[0];
      days.push({
        day: DAY_NAMES[d],
        label: '复习日',
        slots: [
          {
            activity: 'Review',
            skill: strongest.skill,
            domain: strongest.label,
            topic: '间隔重复复习',
            minutes: Math.round(budget * 0.5),
            reason: 'spaced-repetition',
          },
          {
            activity: 'Practice',
            skill: weakest.skill,
            domain: weakest.label,
            topic: '薄弱环节针对性练习',
            minutes: budget - Math.round(budget * 0.5),
            reason: 'reinforcement',
          },
        ],
        totalMinutes: budget,
      });
      continue;
    }

    // Pick the two domains with the most remaining time allocation
    const ranked = DOMAIN_KEYS
      .map((k, i) => ({ key: k, idx: i, rem: remaining[i], label: DOMAIN_LABELS[k], skill: DOMAINS[k].skill, categories: DOMAINS[k].categories, categoryMastery: agg.skills[k].categoryMastery || {} }))
      .filter(s => s.rem > 0)
      .sort((a, b) => b.rem - a.rem);

    const slotCount = budget >= 40 ? 3 : 2;
    const chosen = ranked.slice(0, slotCount);
    const perSlot = Math.floor(budget / chosen.length);
    let extra = budget - perSlot * chosen.length;
    const slots = [];

    for (const c of chosen) {
      const mins = perSlot + (extra > 0 ? 1 : 0);
      if (extra > 0) extra--;
      const actual = Math.min(mins, c.rem);

      // Pick the weakest unassigned category in this domain
      const usedCats = assignedCategories[c.key] || [];
      const availCats = c.categories.filter(cat => !usedCats.includes(cat));
      const catPool = availCats.length > 0 ? availCats : c.categories;

      // Sort by mastery (weakest first)
      const sortedCats = catPool
        .map(cat => ({ cat, mastery: c.categoryMastery[cat] || 0 }))
        .sort((a, b) => a.mastery - b.mastery);

      const chosenCat = sortedCats[0].cat;
      if (!assignedCategories[c.key]) assignedCategories[c.key] = [];
      assignedCategories[c.key].push(chosenCat);

      const isFoundation = sortedCats[0].mastery === 0 && c.categories.indexOf(chosenCat) <= 1;

      slots.push({
        activity: 'Study',
        skill: c.skill,
        domain: c.label,
        topic: CATEGORY_LABELS[chosenCat] || chosenCat,
        category: chosenCat,
        minutes: actual,
        reason: isFoundation ? 'foundation' : 'weakest-area',
      });
      remaining[c.idx] -= actual;
    }

    days.push({
      day: DAY_NAMES[d],
      slots,
      totalMinutes: slots.reduce((s, sl) => s + sl.minutes, 0),
    });
  }

  // Build display text
  const displayLines = [];
  displayLines.push(`${profile.studentId} 的周学习计划:`);
  for (const day of days) {
    for (const slot of day.slots) {
      const reason = slot.reason === 'foundation' ? '(从这里开始 -- 基础)' :
                     slot.reason === 'spaced-repetition' ? '(间隔重复)' :
                     slot.reason === 'reinforcement' ? '(巩固强化)' : '';
      displayLines.push(`${day.day}: ${slot.skill} -- ${slot.topic} ${reason}`.trim());
    }
  }

  return {
    weekOf: new Date().toISOString().slice(0, 10),
    goal,
    grade,
    dailyBudget: budget,
    allocation: DOMAIN_KEYS.map((k, i) => ({
      domain: DOMAIN_LABELS[k],
      skill: DOMAINS[k].skill,
      percent: baseAlloc[i],
      weeklyMinutes: weeklyMinutes[i],
    })),
    days,
    display: displayLines.join('\n'),
  };
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

function generateRecommendations(studentId) {
  const agg = aggregateProgress(studentId);
  const profile = loadProfile(studentId);

  // Rank all categories across all domains by mastery (weakest first)
  const allCategories = [];
  for (const key of DOMAIN_KEYS) {
    const domain = DOMAINS[key];
    const info = agg.skills[key];
    for (const cat of domain.categories) {
      const catMastery = info.categoryMastery[cat] || 0;
      allCategories.push({
        domain: key,
        domainLabel: DOMAIN_LABELS[key],
        skill: domain.skill,
        category: cat,
        categoryLabel: CATEGORY_LABELS[cat] || cat,
        mastery: catMastery,
        domainMastery: info.mastery,
      });
    }
  }

  allCategories.sort((a, b) => a.mastery - b.mastery);

  // Cross-module learning progression hints for math
  const crossModuleHints = {
    'fractions-decimals': '分数与小数是学习比例与百分比的基础，建议先掌握。',
    'variables-expressions': '变量与表达式是代数的起点，也是函数学习的基础。',
    'integer-operations': '整数运算是所有数学学习的根基，务必牢固掌握。',
    'ratio-basics': '比的概念与分数紧密相关，建议在掌握分数后学习。',
    'proportions': '比例是连接算术与代数的桥梁，也是几何相似的基础。',
    'area-perimeter': '面积与周长的计算需要扎实的运算基础。',
    'probability-basics': '概率基础需要用到分数和比的知识。',
    'one-step-equations': '一步方程是多步方程和不等式的前置知识。',
    'functions-patterns': '函数与规律综合了代数思维的各方面能力。',
  };

  // Take top 3, ensuring diversity across domains when possible
  const recommendations = [];
  const usedDomains = new Set();

  // First pass: one from each weakest domain
  for (const c of allCategories) {
    if (recommendations.length >= 3) break;
    if (!usedDomains.has(c.domain)) {
      usedDomains.add(c.domain);
      const isFoundation = DOMAINS[c.domain].categories.indexOf(c.category) === 0;
      const hint = crossModuleHints[c.category] || '';
      recommendations.push({
        rank: recommendations.length + 1,
        skill: c.skill,
        domain: c.domainLabel,
        topic: c.categoryLabel,
        category: c.category,
        currentMastery: c.mastery,
        reasoning: c.mastery === 0
          ? `尚未开始。${isFoundation ? '这是基础知识点，建议从这里开始。' : '先从' + c.domainLabel + '的基础知识学起。'}${hint ? ' ' + hint : ''}`
          : c.mastery < 40
            ? `初步了解 (${c.mastery}%)。需要针对性练习来加深理解。${hint ? ' ' + hint : ''}`
            : c.mastery < 70
              ? `发展中 (${c.mastery}%)。再加强复习即可达到熟练水平。${hint ? ' ' + hint : ''}`
              : `已熟练 (${c.mastery}%)。继续巩固以达到精通。`,
      });
    }
  }

  // Second pass: fill remaining slots if needed
  for (const c of allCategories) {
    if (recommendations.length >= 3) break;
    if (!recommendations.find(r => r.category === c.category)) {
      const hint = crossModuleHints[c.category] || '';
      recommendations.push({
        rank: recommendations.length + 1,
        skill: c.skill,
        domain: c.domainLabel,
        topic: c.categoryLabel,
        category: c.category,
        currentMastery: c.mastery,
        reasoning: c.mastery === 0
          ? `尚未开始。从这里入手填补知识空白。${hint ? ' ' + hint : ''}`
          : `当前 ${c.mastery}% -- 多加练习将巩固理解。${hint ? ' ' + hint : ''}`,
      });
    }
  }

  return {
    studentId,
    grade: profile.grade,
    overallMastery: agg.overallMastery,
    recommendations,
  };
}

// ---------------------------------------------------------------------------
// Full report
// ---------------------------------------------------------------------------

function generateReport(studentId) {
  const profile = loadProfile(studentId);
  const agg = aggregateProgress(studentId);
  const recs = generateRecommendations(studentId);

  // Identify strengths and weaknesses
  const sorted = DOMAIN_KEYS
    .map(k => ({ key: k, label: DOMAIN_LABELS[k], mastery: agg.skills[k].mastery }))
    .sort((a, b) => b.mastery - a.mastery);

  const strengths = sorted.filter(d => d.mastery >= 70).map(d => d.label);
  const weaknesses = sorted.filter(d => d.mastery < 40).map(d => d.label);

  return {
    studentId,
    grade: profile.grade,
    goal: profile.goal,
    dailyBudget: profile.dailyBudget,
    createdAt: profile.createdAt,
    overallMastery: agg.overallMastery,
    domainsProficient: agg.domainsProficient,
    totalDomains: agg.totalDomains,
    strengths,
    weaknesses,
    domainDetails: DOMAIN_KEYS.map(k => {
      const info = agg.skills[k];
      return {
        domain: info.label,
        skill: DOMAINS[k].skill,
        mastery: info.mastery,
        status: info.status,
        assessments: info.assessments,
        lastActivity: info.lastActivity,
        categories: DOMAINS[k].categories.map(cat => ({
          name: CATEGORY_LABELS[cat] || cat,
          mastery: info.categoryMastery[cat] || 0,
        })),
      };
    }),
    recommendations: recs.recommendations,
    diagnosticHistory: (profile.diagnosticResults || []).slice(-10).reverse(),
    planHistory: (profile.plans || []).slice(-5).reverse().map(p => ({
      generated: p.generated,
      goal: p.plan.goal,
      weekOf: p.plan.weekOf,
    })),
    currentPlan: profile.plans && profile.plans.length
      ? profile.plans[profile.plans.length - 1].plan
      : null,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

class StudyPlanner {
  start(id, grade) {
    const p = loadProfile(id);
    if (grade) {
      if (!VALID_GRADES.includes(grade)) {
        throw new Error(`未知年级: ${grade}。可选: ${VALID_GRADES.join(', ')}`);
      }
      p.grade = grade;
    }
    if (!p.grade) p.grade = 'grade-7';
    if (!p.goal) p.goal = 'topic-mastery';
    saveProfile(p);
    return {
      action: 'start',
      profile: {
        studentId: p.studentId,
        grade: p.grade,
        goal: p.goal,
        dailyBudget: p.dailyBudget,
        createdAt: p.createdAt,
      },
      prompt: '欢迎！使用 set-goal 自定义学习目标，然后运行 diagnostic 进行初始评估，或运行 plan 生成每周学习计划。',
    };
  }

  diagnostic(id) {
    const p = loadProfile(id);
    const diag = generateDiagnostic(id, p.grade || 'grade-7');
    p.diagnosticResults.push({
      date: new Date().toISOString(),
      grade: diag.grade,
      totalQuestions: diag.totalQuestions,
    });
    saveProfile(p);
    return diag;
  }

  plan(id) {
    const p = loadProfile(id);
    if (!p.grade) throw new Error('请先设置年级: start <id> <grade>');
    const plan = generateWeeklyPlan(p);
    p.plans.push({ generated: new Date().toISOString(), plan });
    saveProfile(p);
    return plan;
  }

  progress(id) {
    const result = formatProgressDashboard(id);
    const p = loadProfile(id);
    return {
      studentId: id,
      grade: p.grade,
      goal: p.goal,
      display: result.display,
      ...result.data,
    };
  }

  recommend(id) {
    return generateRecommendations(id);
  }

  report(id) {
    return generateReport(id);
  }

  goals(id) {
    const p = loadProfile(id);
    return {
      studentId: id,
      currentGoal: p.goal,
      availableGoals: VALID_GOALS,
      descriptions: {
        'test-prep': '均衡复习所有模块，为考试做准备',
        'topic-mastery': '每个模块平均分配时间，追求深入理解',
        'grade-level-completion': '系统覆盖本年级所有课程标准',
        'stem-focus': '加强代数与数据分析，为理科学习打基础',
        'catch-up': '优先补强数与运算和代数基础，填补知识空白',
        'get-ahead': '探索进阶代数和数据分析等高阶内容',
      },
    };
  }

  setGoal(id, goal) {
    if (!VALID_GOALS.includes(goal)) {
      throw new Error(`未知目标: ${goal}。可选: ${VALID_GOALS.join(', ')}`);
    }
    const p = loadProfile(id);
    p.goal = goal;
    saveProfile(p);
    return { studentId: id, goal, message: `目标已设置为"${goal}"。运行 plan 生成新的每周学习计划。` };
  }

  students() {
    ensureDataDir();
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json') && !f.includes('.corrupt.'));
    const studentList = files.map(f => {
      const id = f.replace(/\.json$/, '');
      try {
        const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'));
        return {
          studentId: id,
          grade: data.grade,
          goal: data.goal,
          createdAt: data.createdAt,
          planCount: (data.plans || []).length,
          diagnosticCount: (data.diagnosticResults || []).length,
        };
      } catch {
        return { studentId: id, error: 'corrupt-profile' };
      }
    });
    return { count: studentList.length, students: studentList };
  }
}

module.exports = StudyPlanner;

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (require.main === module) {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const sp = new StudyPlanner();
  const out = d => console.log(JSON.stringify(d, null, 2));

  try {
    switch (cmd) {
      case 'start': {
        const [, id, grade] = args;
        if (!id) throw new Error('Usage: start <id> [grade]');
        out(sp.start(id, grade || undefined));
        break;
      }
      case 'diagnostic': {
        const [, id] = args;
        if (!id) throw new Error('Usage: diagnostic <id>');
        out(sp.diagnostic(id));
        break;
      }
      case 'plan': {
        const [, id] = args;
        if (!id) throw new Error('Usage: plan <id>');
        out(sp.plan(id));
        break;
      }
      case 'progress': {
        const [, id] = args;
        if (!id) throw new Error('Usage: progress <id>');
        out(sp.progress(id));
        break;
      }
      case 'recommend': {
        const [, id] = args;
        if (!id) throw new Error('Usage: recommend <id>');
        out(sp.recommend(id));
        break;
      }
      case 'report': {
        const [, id] = args;
        if (!id) throw new Error('Usage: report <id>');
        out(sp.report(id));
        break;
      }
      case 'goals': {
        const [, id] = args;
        if (!id) throw new Error('Usage: goals <id>');
        out(sp.goals(id));
        break;
      }
      case 'set-goal': {
        const [, id, goal] = args;
        if (!id || !goal) throw new Error('Usage: set-goal <id> <goal>');
        out(sp.setGoal(id, goal));
        break;
      }
      case 'students': {
        out(sp.students());
        break;
      }
      default:
        out({
          usage: 'node study-planner.js <command> [args]',
          commands: ['start', 'diagnostic', 'plan', 'progress', 'recommend', 'report', 'goals', 'set-goal', 'students'],
          goals: VALID_GOALS,
          grades: VALID_GRADES,
          domains: DOMAIN_KEYS.map(k => `${k}: ${DOMAIN_LABELS[k]}`),
        });
    }
  } catch (err) {
    out({ error: err.message });
    process.exit(1);
  }
}
