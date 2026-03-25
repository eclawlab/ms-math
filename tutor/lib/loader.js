// Module Loader — three-tier lazy loading for math modules.
// T0: routing table (always loaded)
// T1: module descriptor (loaded after routing)
// T2: exercise/lesson/lab/CER content (loaded on demand from module CLI)

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PROMPTS_DIR = path.join(__dirname, '..', 'prompts');
const SKILLS_DIR = path.join(__dirname, '..', 'skills');

const MODULE_MAP = {
  'numbers': { dir: 'ms-math-numbers', script: 'numbers.js' },
  'algebra': { dir: 'ms-math-algebra', script: 'algebra.js' },
  'geometry': { dir: 'ms-math-geometry', script: 'geometry.js' },
  'ratios': { dir: 'ms-math-ratios', script: 'ratios.js' },
  'data': { dir: 'ms-math-data', script: 'data.js' },
  'study-planner': { dir: 'ms-math-study-planner', script: 'study-planner.js' },
};

// ── T0: Static Prompt Loading ──

function loadPersona() {
  return fs.readFileSync(path.join(PROMPTS_DIR, 'base-persona.txt'), 'utf8').trim();
}

function loadRoutingTable() {
  return fs.readFileSync(path.join(PROMPTS_DIR, 'routing-table.txt'), 'utf8').trim();
}

// ── Module CLI Execution ──

function getModulePath(moduleName) {
  const info = MODULE_MAP[moduleName];
  if (!info) return null;
  return path.join(SKILLS_DIR, info.dir, info.script);
}

/**
 * Execute a module CLI command and return parsed JSON output.
 */
function execModule(moduleName, args = []) {
  const scriptPath = getModulePath(moduleName);
  if (!scriptPath || !fs.existsSync(scriptPath)) {
    return { error: `Module ${moduleName} not found at ${scriptPath}` };
  }

  try {
    const result = execFileSync('node', [scriptPath, ...args], {
      encoding: 'utf8',
      timeout: 10000,
      cwd: path.dirname(scriptPath),
    });

    // Try to parse as JSON
    try {
      return JSON.parse(result.trim());
    } catch {
      // Return raw text if not JSON
      return { text: result.trim() };
    }
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString().trim() : '';
    const stdout = err.stdout ? err.stdout.toString().trim() : '';
    // Try parsing stdout even on error (some modules output JSON to stdout)
    if (stdout) {
      try { return JSON.parse(stdout); } catch { /* fall through */ }
    }
    return { error: `${moduleName} command failed: ${stderr || stdout || err.message}` };
  }
}

// ── T2: Content Generation via Module CLI ──

function startStudent(moduleName, studentId, grade) {
  return execModule(moduleName, ['start', studentId, grade || 'grade-7']);
}

function generateLesson(moduleName, studentId) {
  return execModule(moduleName, ['lesson', studentId]);
}

function generateExercise(moduleName, studentId, skill) {
  const args = ['exercise', studentId];
  if (skill) args.push(skill);
  return execModule(moduleName, args);
}

function checkAnswer(moduleName, studentId, type, expected, answer, skill) {
  const args = ['check', studentId, type, expected, answer];
  if (skill) args.push(skill);
  return execModule(moduleName, args);
}

function recordAssessment(moduleName, studentId, skill, score, total, hints) {
  const args = ['record', studentId, skill, String(score), String(total)];
  if (hints) args.push(String(hints));
  return execModule(moduleName, args);
}

function getProgress(moduleName, studentId) {
  return execModule(moduleName, ['progress', studentId]);
}

function getReview(moduleName, studentId) {
  return execModule(moduleName, ['review', studentId]);
}

function getHint(moduleName, studentId, skill) {
  return execModule(moduleName, ['hint', studentId, skill]);
}

function getDiagram(moduleName, studentId, topic) {
  const args = ['diagram', studentId];
  if (topic) args.push(topic);
  return execModule(moduleName, args);
}

function checkDiagram(moduleName, studentId, topic, answersJson) {
  return execModule(moduleName, ['diagram-check', studentId, topic, answersJson]);
}

function getCER(moduleName, studentId, topic) {
  const args = ['cer', studentId];
  if (topic) args.push(topic);
  return execModule(moduleName, args);
}

function checkCER(moduleName, studentId, topic, claim, evidence, reasoning) {
  return execModule(moduleName, ['cer-check', studentId, topic, claim, evidence, reasoning]);
}

function getVocab(moduleName, studentId, topic) {
  const args = ['vocab', studentId];
  if (topic) args.push(topic);
  return execModule(moduleName, args);
}

function getLab(moduleName, studentId, labName) {
  const args = ['lab', studentId];
  if (labName) args.push(labName);
  return execModule(moduleName, args);
}

function getCatalog(moduleName, grade) {
  const args = ['catalog'];
  if (grade) args.push(grade);
  return execModule(moduleName, args);
}

function getStudents(moduleName) {
  return execModule(moduleName, ['students']);
}

// ── Study Planner ──

function getDiagnostic(studentId) {
  return execModule('study-planner', ['diagnostic', studentId]);
}

function getPlan(studentId) {
  return execModule('study-planner', ['plan', studentId]);
}

function getRecommendation(studentId) {
  return execModule('study-planner', ['recommend', studentId]);
}

// ── Prompt Assembly ──

function assemblePrompt(session, sessionBlock) {
  const parts = [loadPersona(), '', sessionBlock];

  if (session.activeModule) {
    const catalog = getCatalog(session.activeModule, session.grade);
    if (catalog && !catalog.error) {
      const skills = catalog.skills || catalog;
      if (typeof skills === 'object') {
        const allSkills = Object.values(skills).flat();
        const display = allSkills.length > 12
          ? allSkills.slice(0, 12).join(', ') + ` (+${allSkills.length - 12} more)`
          : allSkills.join(', ');
        parts.push('', `[MODULE: ${session.activeModule}]`, `skills: ${display}`);
      }
    }
  }

  return parts.join('\n');
}

function estimateTokens(text) {
  return Math.ceil((text || '').length / 4);
}

const TOKEN_BUDGET = 2000;

module.exports = {
  loadPersona,
  loadRoutingTable,
  getModulePath,
  execModule,
  startStudent,
  generateLesson,
  generateExercise,
  checkAnswer,
  recordAssessment,
  getProgress,
  getReview,
  getHint,
  getDiagram,
  checkDiagram,
  getCER,
  checkCER,
  getVocab,
  getLab,
  getCatalog,
  getStudents,
  getDiagnostic,
  getPlan,
  getRecommendation,
  assemblePrompt,
  estimateTokens,
  TOKEN_BUDGET,
  MODULE_MAP,
};
