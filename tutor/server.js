// MS Math Tutor — Express server.
// Serves the student UI, wraps the orchestrator as a REST API,
// and serves PhET interactive simulations from the math lab.

const express = require('express');
const path = require('path');
const fs = require('fs');
const Orchestrator = require('./lib/orchestrator');

const app = express();
const orch = new Orchestrator();

// Root of the math lab (parent of tutor/)
const LAB_ROOT = path.resolve(__dirname, '..');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── PhET Simulation Catalog ──────────────────────────────────────────────────
const topics = [
  {
    id: 'numbers-operations', title: '数与运算', icon: '🔢', color: '#e74c3c',
    description: '探索整数、分数、小数的运算规律。',
    sims: [
      { slug: 'arithmetic',            title: '算术',         desc: '练习乘法、因数分解和除法运算。' },
      { slug: 'make-a-ten',            title: '凑十法',       desc: '用凑十策略来理解加法。' },
      { slug: 'fractions-intro',       title: '分数入门',     desc: '通过多种图形表示来探索分数的基本概念。' },
      { slug: 'build-a-fraction',      title: '搭建分数',     desc: '用各种部件搭建分数和混合数。' },
      { slug: 'number-line-integers',  title: '数轴上的整数', desc: '在数轴上探索整数的位置和运算。' },
      { slug: 'number-line-operations',title: '数轴运算',     desc: '在数轴上进行加减运算，理解正负数。' },
    ]
  },
  {
    id: 'algebraic-thinking', title: '代数思维', icon: '📊', color: '#f39c12',
    description: '学习用字母和符号表达数学关系。',
    sims: [
      { slug: 'equality-explorer',        title: '等式探索',         desc: '用天平模型理解等式的含义和求解方程。' },
      { slug: 'equality-explorer-basics', title: '等式探索：基础',   desc: '以简化的方式探索等式和平衡的概念。' },
      { slug: 'function-builder',         title: '函数构建器',       desc: '通过输入输出模式来理解函数的概念。' },
      { slug: 'function-builder-basics',  title: '函数构建器：基础', desc: '以简化的方式探索函数的输入和输出。' },
      { slug: 'graphing-lines',           title: '画直线',           desc: '探索斜率、截距和直线方程的关系。' },
      { slug: 'graphing-slope-intercept',title: '斜截式画图',       desc: '用斜截式 y = mx + b 来画直线。' },
      { slug: 'graphing-quadratics',     title: '二次函数图像',     desc: '探索二次函数的标准式、顶点式和图像特征。' },
      { slug: 'expression-exchange',     title: '表达式交换',       desc: '用代币和变量来简化代数表达式。' },
    ]
  },
  {
    id: 'geometry-measurement', title: '几何与测量', icon: '📐', color: '#3498db',
    description: '探索形状、面积、体积和几何变换。',
    sims: [
      { slug: 'area-model-introduction',  title: '面积模型入门',     desc: '用面积模型来理解乘法。' },
      { slug: 'area-model-algebra',       title: '面积模型与代数',   desc: '用面积模型来理解代数乘法和因式分解。' },
      { slug: 'area-model-multiplication',title: '面积模型乘法',     desc: '用面积模型来探索多位数乘法。' },
      { slug: 'area-model-decimals',      title: '面积模型与小数',   desc: '用面积模型来理解小数乘法。' },
      { slug: 'vector-addition',          title: '向量加法',         desc: '探索一维和二维空间中的向量加法。' },
      { slug: 'trig-tour',               title: '三角之旅',         desc: '探索正弦、余弦和正切函数。' },
    ]
  },
  {
    id: 'ratios-proportions', title: '比例与百分比', icon: '⚖️', color: '#9b59b6',
    description: '理解比、比例和百分比的概念与应用。',
    sims: [
      { slug: 'ratio-and-proportion',  title: '比和比例',     desc: '通过可视化探索比的概念和比例关系。' },
      { slug: 'unit-rates',            title: '单位费率',     desc: '比较购物和日常生活中的单位费率。' },
      { slug: 'proportion-playground', title: '比例游乐场',   desc: '用各种表示方法探索比例关系。' },
    ]
  },
  {
    id: 'data-probability', title: '数据与概率', icon: '🎲', color: '#1abc9c',
    description: '收集数据、分析统计特征、探索概率。',
    sims: [
      { slug: 'plinko-probability',        title: '弹珠概率',       desc: '通过弹珠板来可视化概率分布。' },
      { slug: 'mean-share-and-balance',    title: '均值与平衡',     desc: '通过平衡来理解平均数的概念。' },
      { slug: 'center-and-variability',    title: '集中与离散',     desc: '探索数据的集中趋势和离散程度。' },
      { slug: 'estimation',               title: '估算',           desc: '练习数量和计算的估算技巧。' },
      { slug: 'least-squares-regression', title: '最小二乘回归',   desc: '用散点图和回归线来探索数据关系。' },
    ]
  }
];

// Directory layout mapping: slug → category sub-folder
const categoryDirs = {
  'numbers': [
    'arithmetic','make-a-ten','fractions-intro','fractions-equality',
    'fractions-mixed-numbers','build-a-fraction','fraction-matcher',
    'number-line-integers','number-line-operations','number-line-distance',
    'number-play','number-compare',
  ],
  'algebra': [
    'equality-explorer','equality-explorer-basics','equality-explorer-two-variables',
    'expression-exchange','function-builder','function-builder-basics',
    'graphing-lines','graphing-slope-intercept','graphing-quadratics',
    'curve-fitting',
  ],
  'geometry': [
    'area-model-introduction','area-model-algebra','area-model-multiplication',
    'area-model-decimals','area-model-common','vector-addition',
    'vector-addition-equations','trig-tour',
  ],
  'ratios': [
    'ratio-and-proportion','unit-rates','proportion-playground',
  ],
  'data-probability': [
    'plinko-probability','mean-share-and-balance','center-and-variability',
    'estimation','least-squares-regression',
  ],
  'framework': [
    'alpenglow','aqua','assert','axon','babel','bamboo','binder','blast','brand',
    'chains','chipper','community','decaf','description-demo','dot','example-sim',
    'fenster','griddle','joist','kite','mobius','perennial','perennial-alias',
    'phet-core','phet-info','phet-lib','phetcommon','phetmarks','qa','quake',
    'query-string-machine','rosetta','scenery','scenery-lab-demo','scenery-phet',
    'nitroglycerin','sherpa','simula-rasa','skiffle','sun','tambo','tandem','tangible','tappi',
    'tasks','twixt','utterance-queue','vegas','vibe','wilder',
    'inverse-square-law-common',
  ],
};

const slugToCategory = {};
for (const [cat, slugs] of Object.entries(categoryDirs)) {
  for (const s of slugs) slugToCategory[s] = cat;
}

const MIME_TYPES = {
  '.html': 'text/html',       '.css': 'text/css',
  '.js':   'text/javascript',  '.mjs': 'text/javascript',
  '.ts':   'text/javascript',
  '.json': 'application/json', '.png': 'image/png',
  '.jpg':  'image/jpeg',       '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',        '.svg': 'image/svg+xml',
  '.ico':  'image/x-icon',     '.webp': 'image/webp',
  '.mp3':  'audio/mpeg',       '.wav': 'audio/wav',
  '.ogg':  'audio/ogg',        '.woff': 'font/woff',
  '.woff2':'font/woff2',       '.ttf':  'font/ttf',
};

// ── API Routes ──

// Start or resume a session
app.post('/api/start', (req, res) => {
  try {
    const { studentId, grade, tutorId } = req.body;
    if (!studentId) return res.status(400).json({ error: 'studentId required' });
    const result = orch.startSession(studentId, grade, tutorId);
    res.json({
      message: result.message,
      session: sanitizeSession(result.session),
      mastery: orch.getMasteryData(studentId),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Process a student turn
app.post('/api/turn', (req, res) => {
  try {
    const { studentId, message } = req.body;
    if (!studentId || !message) return res.status(400).json({ error: 'studentId and message required' });
    const result = orch.processTurn(studentId, message);
    res.json({
      message: result.message,
      session: sanitizeSession(result.session),
      mastery: orch.getMasteryData(studentId),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get mastery dashboard data
app.get('/api/progress/:studentId', (req, res) => {
  try {
    const mastery = orch.getMasteryData(req.params.studentId);
    const session = orch.getSessionData(req.params.studentId);
    res.json({
      mastery,
      session: sanitizeSession(session),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get session state
app.get('/api/session/:studentId', (req, res) => {
  try {
    const session = orch.getSessionData(req.params.studentId);
    res.json({ session: sanitizeSession(session) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Simulation Catalog API ──

app.get('/api/simulations', (req, res) => {
  res.json({ topics });
});

// ── PhET Simulation File Serving ──
// Rewrites flat slug URLs to category sub-folders and serves static sim files.

app.get('/sim/:slug/*', (req, res, next) => {
  const slug = req.params.slug;
  const rest = req.params[0];
  const cat = slugToCategory[slug];
  if (!cat) { res.status(404).send('Simulation not found'); return; }

  const filePath = path.join(LAB_ROOT, cat, slug, rest);
  serveLabFile(filePath, res, next);
});

// Serve framework/shared lib files: /sim-lib/:lib/*
app.get('/sim-lib/:lib/*', (req, res, next) => {
  const lib = req.params.lib;
  const rest = req.params[0];
  const cat = slugToCategory[lib];
  if (!cat) { res.status(404).send('Library not found'); return; }

  const filePath = path.join(LAB_ROOT, cat, lib, rest);
  serveLabFile(filePath, res, next);
});

// Flat URL rewriting (for PhET relative paths like ../chipper/, ../joist/, etc.)
// When a sim opens at /sim/slug/file.html, its ../lib references resolve to /sim/lib/...
// But we also need the original flat URL pattern where /slug/file → /category/slug/file
// and /chipper/... → /framework/chipper/...  so that PhET's relative paths work.
app.use((req, res, next) => {
  const segments = req.path.split('/').filter(Boolean);
  if (segments.length >= 1) {
    const first = segments[0];
    // Skip known routes
    if (['api', 'css', 'js', 'sim', 'sim-lib'].includes(first)) return next();
    const cat = slugToCategory[first];
    if (cat) {
      const rest = segments.slice(1).join('/');
      const filePath = path.join(LAB_ROOT, cat, first, rest);
      return serveLabFile(filePath, res, next);
    }
  }
  next();
});

function serveLabFile(filePath, res, next) {
  const resolved = path.resolve(filePath);
  // Security: only allow files under LAB_ROOT
  if (!resolved.startsWith(LAB_ROOT)) {
    res.status(403).send('Forbidden');
    return;
  }
  fs.stat(resolved, (err, stats) => {
    if (err || !stats.isFile()) { res.status(404).send('Not found'); return; }
    const ext = path.extname(resolved).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.set({
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
    });
    fs.createReadStream(resolved).pipe(res);
  });
}

// Strip heavy data from session for frontend
function sanitizeSession(session) {
  if (!session) return null;
  return {
    studentId: session.studentId,
    grade: session.grade,
    goal: session.goal,
    tutor: session.tutor,
    onboarded: session.onboarded,
    studyProfile: session.studyProfile,
    activeModule: session.activeModule,
    activeSkill: session.activeSkill,
    phase: session.phase,
    turnCount: session.turnCount,
    correctStreak: session.correctStreak,
    consecutiveWrong: session.consecutiveWrong,
    recentResults: session.recentResults,
    currentLab: session.currentLab ? { labId: session.currentLab.labId, step: session.currentLab.step, totalSteps: session.currentLab.totalSteps } : null,
    currentCER: session.currentCER ? { topic: session.currentCER.topic, step: session.currentCER.step } : null,
    currentDiagram: session.currentDiagram ? { topic: session.currentDiagram.topic } : null,
  };
}

// ── Start Server ──

const PORT = process.env.PORT || 3901;
app.listen(PORT, () => {
  console.log('');
  console.log('  ┌──────────────────────────────────────────────────┐');
  console.log('  │                                                  │');
  console.log('  │   📐  MS Math Tutor + Lab                       │');
  console.log('  │                                                  │');
  console.log(`  │   ➜  http://localhost:${PORT}                       │`);
  console.log('  │                                                  │');
  console.log('  └──────────────────────────────────────────────────┘');
  console.log('');
});
