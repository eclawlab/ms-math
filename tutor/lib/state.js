// Session State Manager — math orchestrator.
// Persistent module state in skills data dirs. Session state is ephemeral.

const fs = require('fs');
const path = require('path');

const SESSION_DIR = path.join(process.env.HOME, 'data', 'sessions');

const MODULE_ABBREVS = {
  'numbers': 'numb',
  'algebra': 'algb',
  'geometry': 'geom',
  'ratios': 'rati',
  'data': 'data',
  'study-planner': 'plan',
};

const MODULES = Object.keys(MODULE_ABBREVS);
const CONTENT_MODULES = MODULES.filter(m => m !== 'study-planner');

const MODULE_LABELS = {
  'numbers': 'Numbers',
  'algebra': 'Algebra',
  'geometry': 'Geometry',
  'ratios': 'Ratios',
  'data': 'Data',
  'study-planner': 'Study Plan',
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ── Session Object ──

function createSession(studentId, grade, tutorId) {
  return {
    studentId,
    grade: grade || 'grade-7',
    goal: 'on-level',
    tutor: tutorId || 'methodical',
    studyProfile: null,
    onboarded: false,
    onboardingStep: 0,
    activeModule: null,
    activeSkill: null,
    phase: 'idle',
    turnCount: 0,
    correctStreak: 0,
    consecutiveWrong: 0,
    recentResults: [],
    currentExercise: null,
    currentLab: null,
    currentCER: null,
    currentDiagram: null,
    reviewQueue: [],
    history: [],
    historySummary: '',
    lastDetour: null,
    difficultyAdjustments: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function loadSession(studentId) {
  ensureDir(SESSION_DIR);
  const file = path.join(SESSION_DIR, `${String(studentId).replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
  if (fs.existsSync(file)) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch { return createSession(studentId); }
  }
  return createSession(studentId);
}

function saveSession(session) {
  ensureDir(SESSION_DIR);
  session.updatedAt = new Date().toISOString();
  const file = path.join(SESSION_DIR, `${String(session.studentId).replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
  fs.writeFileSync(file, JSON.stringify(session, null, 2));
}

// ── Mastery Aggregation ──

function aggregateMastery(studentId) {
  const DATA_ROOT = path.join(process.env.HOME, 'data');
  const mastery = {};

  for (const mod of CONTENT_MODULES) {
    const profilePath = path.join(DATA_ROOT, `ms-math-${mod}`, `${studentId}.json`);
    if (!fs.existsSync(profilePath)) {
      mastery[mod] = 0;
      continue;
    }
    try {
      const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
      const skills = profile.skills || {};
      const vals = Object.values(skills).map(s => s.mastery || 0);
      mastery[mod] = vals.length > 0
        ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 100) / 100
        : 0;
    } catch {
      mastery[mod] = 0;
    }
  }
  return mastery;
}

// ── Session Block for Prompt ──

const MODULE_DEPS = {
  'numbers': ['algebra'],
  'algebra': ['numbers', 'ratios'],
  'geometry': ['numbers', 'ratios'],
  'ratios': ['numbers', 'algebra'],
  'data': ['numbers', 'ratios'],
  'study-planner': [],
};

function computeSessionBlock(session) {
  const mastery = aggregateMastery(session.studentId);

  let masteryLine;
  if (session.activeModule && MODULE_DEPS[session.activeModule]) {
    const relevant = [session.activeModule, ...MODULE_DEPS[session.activeModule]];
    masteryLine = relevant
      .filter(mod => mastery[mod] !== undefined)
      .map(mod => `${MODULE_ABBREVS[mod] || mod.slice(0, 4)} ${(mastery[mod] || 0).toFixed(2)}`)
      .join(' | ');
  } else {
    masteryLine = Object.entries(mastery)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3)
      .map(([mod, val]) => `${MODULE_ABBREVS[mod] || mod.slice(0, 4)} ${val.toFixed(2)}`)
      .join(' | ');
  }

  const recentLine = session.recentResults.length > 0
    ? session.recentResults.slice(-2)
        .map(r => `${r.skill} ${r.score}/${r.total}`)
        .join(' | ')
    : 'none';

  const mood = session.consecutiveWrong >= 2 ? 'struggling'
    : session.turnCount > 0 ? 'engaged' : 'idle';

  return [
    '[SESSION]',
    `student: ${session.studentId} | grade: ${session.grade} | goal: ${session.goal}`,
    `module: ${session.activeModule || 'none'} | skill: ${session.activeSkill || 'none'} | turn: ${session.turnCount}`,
    `phase: ${session.phase}`,
    `mastery: ${masteryLine}`,
    `recent: ${recentLine}`,
    `streak: ${session.correctStreak} | mood: ${mood}`,
    session.historySummary ? `context: ${session.historySummary}` : null,
    '[/SESSION]',
  ].filter(Boolean).join('\n');
}

function getFullMastery(studentId) {
  return aggregateMastery(studentId);
}

// ── History Management ──

const HISTORY_WINDOW = 14;

function summarizeMessages(messages) {
  const topics = new Set();
  const skills = new Set();
  let corrections = 0;
  let correct = 0;

  for (const msg of messages) {
    const text = (msg.content || '').toLowerCase();
    const skillMatch = text.match(/\b(?:skill|topic|lesson|exercise):\s*([^\n.]+)/i);
    if (skillMatch) skills.add(skillMatch[1].trim());
    if (/\b(correct|right|great job|well done|exactly)\b/.test(text)) correct++;
    if (/\b(incorrect|wrong|not quite|try again|actually)\b/.test(text)) corrections++;
    if (msg.role === 'user' && text.length > 10) {
      const clause = text.slice(0, 80).replace(/[^\w\s]/g, '').trim();
      if (clause.length > 5) topics.add(clause);
    }
  }

  const parts = [];
  if (topics.size > 0) parts.push(`topics: ${[...topics].slice(-3).join('; ')}`);
  if (skills.size > 0) parts.push(`skills: ${[...skills].join(', ')}`);
  if (correct > 0 || corrections > 0) parts.push(`correct: ${correct}, wrong: ${corrections}`);
  parts.push(`msgs: ${messages.length}`);
  return parts.join(' | ');
}

function addToHistory(session, role, content) {
  session.history.push({ role, content });
  if (typeof session.historySummary === 'undefined') session.historySummary = '';

  if (session.history.length > HISTORY_WINDOW) {
    const overflow = session.history.splice(0, session.history.length - HISTORY_WINDOW);
    const overflowSummary = summarizeMessages(overflow);
    if (session.historySummary) {
      session.historySummary += ' || ' + overflowSummary;
    } else {
      session.historySummary = overflowSummary;
    }
    if (session.historySummary.length > 300) {
      session.historySummary = session.historySummary.slice(-300);
      const firstSep = session.historySummary.indexOf(' || ');
      if (firstSep > 0 && firstSep < 100) {
        session.historySummary = session.historySummary.slice(firstSep + 4);
      }
    }
  }
}

function getHistory(session) {
  const result = [];
  if (session.historySummary) {
    result.push({ role: 'system', content: `[Earlier session summary] ${session.historySummary}` });
  }
  return result.concat(session.history.slice());
}

// ── Exercise State ──

function setExercise(session, exerciseData) {
  session.currentExercise = {
    moduleName: session.activeModule,
    skill: exerciseData.skill,
    type: exerciseData.type,
    instruction: exerciseData.instruction,
    items: exerciseData.items || [],
    currentIndex: 0,
    score: 0,
    total: 0,
    attempts: 0,
  };
  session.phase = 'exercise';
}

function getCurrentItem(session) {
  const ex = session.currentExercise;
  if (!ex || ex.currentIndex >= ex.items.length) return null;
  return ex.items[ex.currentIndex];
}

function advanceExercise(session, correct) {
  const ex = session.currentExercise;
  if (!ex) return null;

  if (correct) {
    ex.score++;
    session.correctStreak++;
    session.consecutiveWrong = 0;
  } else {
    session.correctStreak = 0;
    session.consecutiveWrong++;
  }
  ex.total++;
  ex.attempts = 0;
  ex.currentIndex++;

  if (ex.currentIndex >= ex.items.length) {
    session.phase = 'review';
    session.recentResults.push({ skill: ex.skill, score: ex.score, total: ex.total });
    if (session.recentResults.length > 5) session.recentResults.shift();
    return { done: true, score: ex.score, total: ex.total, skill: ex.skill };
  }
  return { done: false, nextItem: ex.items[ex.currentIndex] };
}

function incrementAttempt(session) {
  if (session.currentExercise) session.currentExercise.attempts++;
}

function getAttemptCount(session) {
  return session.currentExercise ? session.currentExercise.attempts : 0;
}

// ── Lab State ──

function setLab(session, labData) {
  session.currentLab = {
    labId: labData.id || labData.labId,
    title: labData.title,
    step: 1,
    totalSteps: labData.totalSteps || labData.procedure?.length || 5,
    observations: [],
    predictions: [],
  };
  session.phase = 'lab';
}

function advanceLab(session, observation) {
  if (!session.currentLab) return null;
  if (observation) session.currentLab.observations.push(observation);
  session.currentLab.step++;
  if (session.currentLab.step > session.currentLab.totalSteps) {
    session.phase = 'review';
    return { done: true, observations: session.currentLab.observations };
  }
  return { done: false, step: session.currentLab.step };
}

// ── CER State ──

function setCER(session, cerData) {
  session.currentCER = {
    topic: cerData.topic,
    phenomenon: cerData.phenomenon,
    step: 'claim',
    claim: null,
    evidence: null,
    reasoning: null,
    scores: null,
  };
  session.phase = 'cer';
}

function advanceCER(session, content) {
  if (!session.currentCER) return null;
  const cer = session.currentCER;

  switch (cer.step) {
    case 'claim':
      cer.claim = content;
      cer.step = 'evidence';
      return { done: false, nextStep: 'evidence' };
    case 'evidence':
      cer.evidence = content;
      cer.step = 'reasoning';
      return { done: false, nextStep: 'reasoning' };
    case 'reasoning':
      cer.reasoning = content;
      cer.step = 'complete';
      session.phase = 'review';
      return { done: true, claim: cer.claim, evidence: cer.evidence, reasoning: cer.reasoning };
    default:
      return null;
  }
}

// ── Diagram State ──

function setDiagram(session, diagramData) {
  session.currentDiagram = {
    topic: diagramData.topic,
    diagram: diagramData.diagram,
    labels: {},
    expected: diagramData.expected || {},
  };
  session.phase = 'diagram';
}

// ── Cross-Module Support ──

function getRecentPerformance(session, n = 3) {
  return session.recentResults.slice(-n).map(r => ({
    ...r,
    pct: r.total > 0 ? r.score / r.total : 0,
  }));
}

function recordDetour(session, fromModule, toModule, reason) {
  session.lastDetour = { from: fromModule, to: toModule, reason, exerciseCount: 0 };
}

function tickDetour(session) {
  if (!session.lastDetour) return;
  session.lastDetour.exerciseCount++;
  if (session.lastDetour.exerciseCount >= 2) session.lastDetour = null;
}

function setDifficultyAdjustments(session, adjustments) {
  session.difficultyAdjustments = adjustments || {};
}

// ── Phase Transitions ──

function setPhase(session, phase) {
  session.phase = phase;
}

function setModule(session, moduleName, skill) {
  session.activeModule = moduleName;
  session.activeSkill = skill || null;
  if (session.phase === 'idle' || session.phase === 'review') {
    session.phase = 'idle';
  }
}

function incrementTurn(session) {
  session.turnCount++;
}

// ── Onboarding ──

const ONBOARDING_KEYS = ['learningPref', 'struggleResponse', 'studyPace'];
const ANSWER_MAP = {
  learningPref: { a: 'hands-on', b: 'examples-first', c: 'trial-and-error' },
  struggleResponse: { a: 'persistent', b: 'hint-seeker', c: 'skip-and-return' },
  studyPace: { a: 'steady', b: 'variable', c: 'intensive' },
};

function parseOnboardingAnswer(input) {
  const lower = input.trim().toLowerCase();
  if (/^a\b/.test(lower) || lower.includes('动手') || lower.includes('实战') || lower.includes('摸摸') || lower.includes('慢慢') || lower.includes('稳') || lower.includes('每天') || lower.includes('自己') || lower.includes('死磕') || lower.includes('坐下')) return 'a';
  if (/^b\b/.test(lower) || lower.includes('例子') || lower.includes('观察') || lower.includes('提示') || lower.includes('线索') || lower.includes('看状态') || lower.includes('心情') || lower.includes('看别人')) return 'b';
  if (/^c\b/.test(lower) || lower.includes('做题') || lower.includes('直接') || lower.includes('冒险') || lower.includes('随便') || lower.includes('跳过') || lower.includes('快') || lower.includes('一口气') || lower.includes('停不下')) return 'c';
  return null;
}

function advanceOnboarding(session, input) {
  const step = session.onboardingStep || 0;
  if (step >= 3) return { done: true };

  const answer = parseOnboardingAnswer(input);
  if (!answer) return { done: false, retry: true, step };

  const key = ONBOARDING_KEYS[step];
  const value = ANSWER_MAP[key][answer];

  if (!session.studyProfile) session.studyProfile = {};
  session.studyProfile[key] = value;
  session.onboardingStep = step + 1;

  if (session.onboardingStep >= 3) {
    session.onboarded = true;
    return { done: true, studyProfile: session.studyProfile };
  }

  return { done: false, step: session.onboardingStep };
}

module.exports = {
  createSession,
  loadSession,
  saveSession,
  computeSessionBlock,
  aggregateMastery,
  getFullMastery,
  addToHistory,
  getHistory,
  setExercise,
  getCurrentItem,
  advanceExercise,
  incrementAttempt,
  getAttemptCount,
  setLab,
  advanceLab,
  setCER,
  advanceCER,
  setDiagram,
  getRecentPerformance,
  recordDetour,
  tickDetour,
  setDifficultyAdjustments,
  setPhase,
  setModule,
  incrementTurn,
  MODULES,
  CONTENT_MODULES,
  MODULE_ABBREVS,
  MODULE_LABELS,
  MODULE_DEPS,
  HISTORY_WINDOW,
  summarizeMessages,
  advanceOnboarding,
  parseOnboardingAnswer,
  ONBOARDING_KEYS,
};
