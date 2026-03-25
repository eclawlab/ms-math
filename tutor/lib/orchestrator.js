// MS Math Orchestrator — multi-turn conversational tutor over 5 math domains.
// Turn pipeline: Route → Load → State → Wrap → Respond.
// No external deps beyond Node.js. Uses module CLIs via child_process.

const state = require('./state');
const router = require('./router');
const loader = require('./loader');
const wrapper = require('./wrapper');

class Orchestrator {
  constructor() {
    this.sessions = {};
  }

  // ── Session Management ──

  startSession(studentId, grade, tutorId) {
    let session = state.loadSession(studentId);
    const isNew = session.turnCount === 0 && !session.activeModule && !session.onboarded;

    if (isNew && tutorId) session.tutor = tutorId;
    if (grade) session.grade = grade;
    this.sessions[studentId] = session;
    state.saveSession(session);

    // Ensure profile exists in all modules
    for (const mod of state.CONTENT_MODULES) {
      try { loader.startStudent(mod, studentId, session.grade); } catch { /* ok */ }
    }

    const message = wrapper.presentWelcome(session, isNew);

    // If new student, start onboarding
    if (isNew && !session.onboarded) {
      session.onboardingStep = 0;
      state.saveSession(session);
      const q1 = wrapper.getOnboardingQuestion(session.tutor, 0);
      return { session, message: message + '\n\n' + q1 };
    }

    return { session, message };
  }

  // ── Main Turn Pipeline ──

  processTurn(studentId, input) {
    let session = this.sessions[studentId] || state.loadSession(studentId);
    state.incrementTurn(session);
    state.addToHistory(session, 'user', input);

    // ── Onboarding: collect study profile answers ──
    // Only run onboarding for truly new students (onboarded === false, not undefined)
    if (session.onboarded === false && session.onboardingStep !== undefined) {
      return this._handleOnboardingAnswer(session, input);
    }

    const lower = input.toLowerCase();

    // ── Meta-intent detection (Chinese + English) ──
    const isProgressQuery = /\b(progress|how am i doing|report|score|show my|dashboard)\b/.test(lower) || /进度|成绩|表现|得分|做得怎么样/.test(lower);
    const isNextQuery = /\b(what should i|what's next|what next|recommend|suggest)\b/.test(lower) || /接下来|下一步|学什么|推荐|建议/.test(lower);
    const isReviewQuery = /\b(review|spaced|due|refresh)\b/.test(lower) || /复习|回顾|到期|温习/.test(lower);
    const isLabQuery = /\b(lab|experiment|simulate|virtual lab)\b/.test(lower) || /实验|模拟|动手做/.test(lower);
    const isCERQuery = /\b(cer|claim|evidence|reasoning|explain why|mathematical explanation)\b/.test(lower) || /主张|证据|推理|数学解释/.test(lower);
    const isDiagramQuery = /\b(diagram|label|draw|number.line)\b/.test(lower) || /图表|标注|画图|数轴/.test(lower);
    const isVocabQuery = /\b(vocab|vocabulary|define|definition|key terms|word)\b/.test(lower) || /词汇|术语|定义|关键词/.test(lower);
    const isHintQuery = /\b(hint|help me|clue|stuck)\b/.test(lower) || /提示|帮我|线索|卡住|不会/.test(lower);
    const isExplicitSwitch = /\b(switch|change|let's do|can we do|move to|instead|different)\b/.test(lower) || /换|切换|我想学|想学|转到|改学/.test(lower);

    const peekRoute = router.route(input, null);
    const isModuleSwitchRequest = isExplicitSwitch ||
      (peekRoute.module && peekRoute.module !== session.activeModule && peekRoute.confidence !== 'none');

    // ── Frustration support ──
    const frustrationMsg = wrapper.checkFrustration(session);
    if (frustrationMsg && !this._isDirectAnswer(input)) {
      const frustrationChoice = this._parseFrustrationChoice(input);
      if (frustrationChoice) {
        const result = this._handleFrustrationChoice(session, frustrationChoice);
        if (result) return result;
      }
    }

    // ── CER phase: collect steps ──
    if (session.phase === 'cer' && session.currentCER && !isModuleSwitchRequest) {
      return this._handleCERInput(session, input);
    }

    // ── Lab phase: collect observations ──
    if (session.phase === 'lab' && session.currentLab && !isModuleSwitchRequest) {
      return this._handleLabInput(session, input);
    }

    // ── Diagram phase: collect labels ──
    if (session.phase === 'diagram' && session.currentDiagram && !isModuleSwitchRequest) {
      return this._handleDiagramInput(session, input);
    }

    // ── Exercise phase: treat input as answer ──
    const isMetaIntent = isProgressQuery || isNextQuery || isModuleSwitchRequest ||
      isReviewQuery || isLabQuery || isCERQuery || isDiagramQuery || isVocabQuery;

    if (session.phase === 'exercise' && session.currentExercise && !isMetaIntent) {
      return this._handleExerciseAnswer(session, input);
    }

    // ── Hint during exercise ──
    if (session.phase === 'exercise' && isHintQuery && session.activeModule && session.activeSkill) {
      return this._handleHint(session);
    }

    // ── Progress/Next queries ──
    if (session.activeModule && (isProgressQuery || isNextQuery)) {
      let response = '';
      if (isProgressQuery) {
        response = this._handleProgress(session);
      } else {
        response = this._handleNextSkills(session);
      }
      state.addToHistory(session, 'assistant', response);
      state.saveSession(session);
      this.sessions[studentId] = session;
      return { message: response.trim(), session };
    }

    // ── Review query ──
    if (isReviewQuery && session.activeModule) {
      return this._handleReview(session);
    }

    // ── Route the input ──
    const routeResult = router.route(input, session.activeModule);

    if (!routeResult.module) {
      const msg = wrapper.askForClarification();
      state.addToHistory(session, 'assistant', msg);
      state.saveSession(session);
      this.sessions[studentId] = session;
      return { message: msg, session };
    }

    // Module switch?
    const switching = routeResult.module !== session.activeModule;
    let response = '';

    if (switching && session.activeModule) {
      if (session.phase === 'exercise' && session.currentExercise) {
        const ex = session.currentExercise;
        if (ex.total > 0) {
          response += wrapper.presentExerciseSummary({
            score: ex.score, total: ex.total, skill: ex.skill
          }) + '\n\n';
        }
        session.currentExercise = null;
        session.phase = 'idle';
      }

      const crossRule = router.evaluateCrossModuleRules(
        state.aggregateMastery(studentId),
        session.activeModule
      );
      response += wrapper.presentModuleSwitch(
        session.activeModule,
        routeResult.module,
        crossRule ? crossRule.reason : null
      ) + '\n\n';
    }

    state.setModule(session, routeResult.module);

    // ── Dispatch by specific intent ──
    if (isLabQuery && routeResult.module !== 'study-planner') {
      response += this._handleLabStart(session);
    } else if (isCERQuery && routeResult.module !== 'study-planner') {
      response += this._handleCERStart(session);
    } else if (isDiagramQuery && routeResult.module !== 'study-planner') {
      response += this._handleDiagramStart(session);
    } else if (isVocabQuery && routeResult.module !== 'study-planner') {
      response += this._handleVocab(session);
    } else if (/\b(lesson|teach|learn|explain)\b/.test(lower) || /课程|教我|学习|讲解|上课/.test(lower)) {
      response += this._handleLesson(session);
    } else if (/\b(practice|exercise|quiz|drill|try|test me)\b/.test(lower) || /练习|做题|测试|考考|试试/.test(lower)) {
      response += this._handleExerciseStart(session);
    } else if (routeResult.module === 'study-planner') {
      response += this._handleStudyPlanner(session);
    } else {
      // Apply learning preference from study profile
      const pref = session.studyProfile && session.studyProfile.learningPref;
      if (pref === 'hands-on' && routeResult.module !== 'study-planner') {
        const labResult = this._handleLabStart(session);
        // Fall back to exercise if lab fails
        if (labResult.includes('出了点问题')) {
          response += this._handleExerciseStart(session);
        } else {
          response += labResult;
        }
      } else {
        response += this._handleExerciseStart(session);
      }
    }

    state.addToHistory(session, 'assistant', response);
    state.saveSession(session);
    this.sessions[studentId] = session;

    return { message: response.trim(), session };
  }

  // ── Onboarding Handler ──

  _handleOnboardingAnswer(session, input) {
    const result = state.advanceOnboarding(session, input);

    let response = '';

    if (result.retry) {
      // Could not parse answer — ask again
      response = '请选择 A、B 或 C 哦！\n\n' + wrapper.getOnboardingQuestion(session.tutor, result.step);
    } else if (result.done) {
      // Onboarding complete — show summary
      response = wrapper.getOnboardingSummary(session.tutor, session.studyProfile);
    } else {
      // Ask next question
      response = wrapper.getOnboardingQuestion(session.tutor, result.step);
    }

    state.addToHistory(session, 'assistant', response);
    state.saveSession(session);
    this.sessions[session.studentId] = session;
    return { message: response.trim(), session };
  }

  // ── Exercise Handlers ──

  _handleExerciseAnswer(session, input) {
    const item = state.getCurrentItem(session);
    if (!item) {
      session.phase = 'idle';
      session.currentExercise = null;
      const msg = "这组题做完了！想开始新的练习吗？";
      state.addToHistory(session, 'assistant', msg);
      state.saveSession(session);
      return { message: msg, session };
    }

    const ex = session.currentExercise;
    const expected = item.a || item.answer || item.expected;
    const checkResult = loader.checkAnswer(
      ex.moduleName, session.studentId, ex.type || item.type || 'short',
      typeof expected === 'object' ? JSON.stringify(expected) : String(expected),
      input, ex.skill
    );

    let response = '';
    const isCorrect = checkResult.correct || checkResult.result === 'correct';

    if (isCorrect) {
      response = wrapper.affirmCorrect(item, ex.type || item.type, input, {
        studentName: session.studentId,
        streak: session.correctStreak + 1,
        tutor: session.tutor,
      });

      const result = state.advanceExercise(session, true);

      if (result.done) {
        this._recordResult(session, result);
        response += '\n\n' + wrapper.presentExerciseSummary(result, {
          studentName: session.studentId,
        });
      } else {
        response += '\n\n' + wrapper.presentExerciseItem(
          result.nextItem, ex.type || result.nextItem.type, ex.instruction, {
            studentName: session.studentId,
            itemNumber: ex.currentIndex + 1,
            totalItems: ex.items.length,
            streak: session.correctStreak,
            tutor: session.tutor,
          }
        );
      }
    } else {
      state.incrementAttempt(session);
      const attempt = state.getAttemptCount(session);
      const maxAttempts = this._getMaxAttempts(session);

      const feedback = wrapper.explainWrong(item, ex.type || item.type, input, attempt, {
        studentName: session.studentId,
        tutor: session.tutor,
      }, maxAttempts);

      response = feedback.text;

      if (feedback.revealAnswer) {
        const result = state.advanceExercise(session, false);

        if (result.done) {
          this._recordResult(session, result);
          response += '\n\n' + wrapper.presentExerciseSummary(result, {
            studentName: session.studentId,
          });
        } else {
          response += '\n\n' + wrapper.presentExerciseItem(
            result.nextItem, ex.type || result.nextItem.type, ex.instruction, {
              studentName: session.studentId,
              itemNumber: ex.currentIndex + 1,
              totalItems: ex.items.length,
              streak: session.correctStreak,
              tutor: session.tutor,
            }
          );
        }
      }
    }

    state.addToHistory(session, 'assistant', response);
    state.saveSession(session);
    this.sessions[session.studentId] = session;
    return { message: response.trim(), session };
  }

  _handleExerciseStart(session) {
    const exerciseData = loader.generateExercise(
      session.activeModule, session.studentId, session.activeSkill
    );

    if (exerciseData.error) {
      return `加载练习时出了点问题：${exerciseData.error}。想试试别的吗？`;
    }

    if (exerciseData.message) {
      return exerciseData.message + " 想试试其他领域吗？";
    }

    state.setExercise(session, exerciseData);
    session.activeSkill = exerciseData.skill;

    const items = exerciseData.items || exerciseData.questions || [];
    if (items.length === 0) {
      return "这个知识点暂时没有练习题。想换个话题吗？";
    }

    // Store items in the exercise
    session.currentExercise.items = items;

    const intro = `我们来练习「${wrapper.formatSkillName(exerciseData.skill)}」吧！一共 ${items.length} 道题，一题一题来。\n`;
    const firstItem = wrapper.presentExerciseItem(
      items[0], exerciseData.type || items[0].type, exerciseData.instruction, {
        studentName: session.studentId,
        itemNumber: 1,
        totalItems: items.length,
        streak: session.correctStreak,
        tutor: session.tutor,
      }
    );

    return intro + '\n' + firstItem;
  }

  // ── Lesson Handler ──

  _handleLesson(session) {
    const lesson = loader.generateLesson(session.activeModule, session.studentId);

    if (lesson.error) {
      return `加载课程时出了点问题：${lesson.error}。我们直接做练习吧。`;
    }

    if (lesson.targetSkill) {
      session.activeSkill = lesson.targetSkill.skill || lesson.targetSkill;
    }

    if (lesson.exercise && lesson.exercise.items) {
      state.setExercise(session, lesson.exercise);
    }

    return wrapper.presentLesson(lesson, { studentName: session.studentId });
  }

  // ── CER Handlers ──

  _handleCERStart(session) {
    const cerData = loader.getCER(session.activeModule, session.studentId);
    if (cerData.error) {
      return `加载CER活动时出了点问题：${cerData.error}。想做练习吗？`;
    }

    state.setCER(session, cerData);
    return wrapper.presentCER(cerData);
  }

  _handleCERInput(session, input) {
    const result = state.advanceCER(session, input);
    let response = '';

    if (!result) {
      session.phase = 'idle';
      response = "CER出了点问题。要再试一次吗？";
    } else if (result.done) {
      // Check the CER with the module
      const scores = loader.checkCER(
        session.activeModule, session.studentId,
        session.currentCER.topic,
        result.claim, result.evidence, result.reasoning
      );
      session.currentCER.scores = scores;
      response = wrapper.presentCERFeedback(scores);
      session.currentCER = null;
    } else {
      response = wrapper.presentCERStep(result.nextStep);
    }

    state.addToHistory(session, 'assistant', response);
    state.saveSession(session);
    this.sessions[session.studentId] = session;
    return { message: response.trim(), session };
  }

  // ── Diagram Handlers ──

  _handleDiagramStart(session) {
    const topic = session.activeSkill || null;
    const diagramData = loader.getDiagram(session.activeModule, session.studentId, topic);
    if (diagramData.error) {
      return `加载图表时出了点问题：${diagramData.error}。想做练习吗？`;
    }

    state.setDiagram(session, diagramData);
    return wrapper.presentDiagram(diagramData);
  }

  _handleDiagramInput(session, input) {
    // Parse label answers: "A=gravity, B=friction" or JSON
    let answers;
    try {
      answers = JSON.parse(input);
    } catch {
      answers = {};
      const pairs = input.split(/[,;]\s*/);
      for (const pair of pairs) {
        const match = pair.match(/^\s*([A-Za-z])\s*[=:]\s*(.+)\s*$/);
        if (match) answers[match[1].toUpperCase()] = match[2].trim();
      }
    }

    const results = loader.checkDiagram(
      session.activeModule, session.studentId,
      session.currentDiagram.topic,
      JSON.stringify(answers)
    );

    const response = wrapper.presentDiagramFeedback(results);
    session.currentDiagram = null;
    session.phase = 'idle';

    state.addToHistory(session, 'assistant', response);
    state.saveSession(session);
    this.sessions[session.studentId] = session;
    return { message: response.trim(), session };
  }

  // ── Lab Handlers ──

  _handleLabStart(session) {
    const labData = loader.getLab(session.activeModule, session.studentId);
    if (labData.error) {
      return `加载实验时出了点问题：${labData.error}。想做练习吗？`;
    }

    state.setLab(session, labData);

    let response = wrapper.presentLab(labData);
    // Present first step
    if (labData.firstStep || (labData.procedure && labData.procedure[0])) {
      const step = labData.firstStep || labData.procedure[0];
      response += '\n\n' + wrapper.presentLabStep(step, 1, session.currentLab.totalSteps);
    }
    return response;
  }

  _handleLabInput(session, input) {
    const result = state.advanceLab(session, input);
    let response = '';

    if (!result) {
      session.phase = 'idle';
      response = "实验出了点问题。要再试一次吗？";
    } else if (result.done) {
      response = wrapper.presentLabComplete(result.observations);
      session.currentLab = null;
    } else {
      // Get next step from module
      const stepData = loader.getLab(session.activeModule, session.studentId, session.currentLab.labId);
      if (stepData.step || stepData.instruction) {
        response = wrapper.presentLabStep(stepData, result.step, session.currentLab.totalSteps);
      } else {
        response = wrapper.presentLabStep(
          { instruction: `继续第 ${result.step} 步。你观察到了什么？` },
          result.step, session.currentLab.totalSteps
        );
      }
    }

    state.addToHistory(session, 'assistant', response);
    state.saveSession(session);
    this.sessions[session.studentId] = session;
    return { message: response.trim(), session };
  }

  // ── Vocab Handler ──

  _handleVocab(session) {
    const topic = session.activeSkill || null;
    const vocabData = loader.getVocab(session.activeModule, session.studentId, topic);
    if (vocabData.error) {
      return `加载词汇时出了点问题：${vocabData.error}`;
    }
    return wrapper.presentVocab(vocabData);
  }

  // ── Hint Handler ──

  _handleHint(session) {
    const hintData = loader.getHint(session.activeModule, session.studentId, session.activeSkill);
    let response = '';

    if (hintData.error || !hintData.hint) {
      // Fallback: use wrapper's built-in hint
      const item = state.getCurrentItem(session);
      if (item) {
        response = item.hint || item.formula || '想想日常生活中这个数学概念是怎么体现的。';
      } else {
        response = "想想你在生活中观察到的数学规律。";
      }
    } else {
      response = `提示：${hintData.hint}`;
    }

    state.addToHistory(session, 'assistant', response);
    state.saveSession(session);
    this.sessions[session.studentId] = session;
    return { message: response.trim(), session };
  }

  // ── Review Handler ──

  _handleReview(session) {
    const reviewData = loader.getReview(session.activeModule, session.studentId);
    const response = wrapper.presentReview(reviewData);
    state.addToHistory(session, 'assistant', response);
    state.saveSession(session);
    this.sessions[session.studentId] = session;
    return { message: response.trim(), session };
  }

  // ── Progress/Next/Study Planner ──

  _handleProgress(session) {
    const progress = loader.getProgress(session.activeModule, session.studentId);
    if (progress.error) return `加载进度时出了点问题：${progress.error}`;
    return wrapper.presentProgress(progress, { studentName: session.studentId });
  }

  _handleNextSkills(session) {
    // Use the module's built-in next recommendation
    const catalog = loader.getCatalog(session.activeModule, session.grade);
    if (catalog && catalog.next) {
      return wrapper.presentNextSkills(catalog);
    }
    // Fallback to study planner recommendation
    const rec = loader.getRecommendation(session.studentId);
    if (rec && !rec.error) {
      return typeof rec === 'string' ? rec : (rec.text || rec.recommendation || JSON.stringify(rec));
    }
    return "继续在当前领域练习——你正在打好扎实的基础！";
  }

  _handleStudyPlanner(session) {
    const mastery = state.aggregateMastery(session.studentId);
    const lines = ["以下是你在各个数学领域的学习情况：\n"];

    for (const [mod, val] of Object.entries(mastery)) {
      const label = val >= 0.90 ? '已掌握' : val >= 0.80 ? '熟练' : val >= 0.60 ? '进步中' : val > 0 ? '入门中' : '未开始';
      lines.push(`  ${wrapper.formatModuleName(mod)}: ${(val * 100).toFixed(0)}% (${label})`);
    }

    const crossRule = router.evaluateCrossModuleRules(mastery, session.activeModule);
    if (crossRule) {
      lines.push(`\n我的建议：${crossRule.reason}`);
      lines.push(`想进入${wrapper.formatModuleName(crossRule.target)}学习吗？`);
    } else {
      const sorted = Object.entries(mastery).sort((a, b) => a[1] - b[1]);
      if (sorted.length > 0 && sorted[0][1] < 0.80) {
        lines.push(`\n建议重点学习${wrapper.formatModuleName(sorted[0][0])}——这个领域最需要提升。`);
      } else {
        lines.push("\n你各方面都做得很好！选一个继续精进吧。");
      }
    }

    return lines.join('\n');
  }

  // ── Frustration ──

  _handleFrustrationChoice(session, choice) {
    let msg;
    switch (choice) {
      case 'easier':
        session.consecutiveWrong = 0;
        msg = "我们来试个简单一点的。";
        msg += this._handleExerciseStart(session);
        break;
      case 'switch':
        session.consecutiveWrong = 0;
        session.currentExercise = null;
        session.phase = 'idle';
        msg = this._handleStudyPlanner(session);
        break;
      case 'break':
        session.consecutiveWrong = 0;
        session.currentExercise = null;
        session.phase = 'idle';
        msg = "好主意——休息一下吧。准备好了就告诉我你想探索什么。";
        break;
      default:
        msg = null;
    }

    if (msg) {
      state.addToHistory(session, 'assistant', msg);
      state.saveSession(session);
      this.sessions[session.studentId] = session;
      return { message: msg.trim(), session };
    }
    return null;
  }

  // ── Helpers ──

  _getMaxAttempts(session) {
    const profile = session.studyProfile;
    if (!profile) return 2;
    if (profile.struggleResponse === 'persistent') return 3;
    if (profile.struggleResponse === 'hint-seeker') return 1;
    return 2;
  }

  _recordResult(session, result) {
    const ex = session.currentExercise;
    if (!ex) return;
    try {
      loader.recordAssessment(ex.moduleName, session.studentId, ex.skill, result.score, result.total);
    } catch (err) {
      console.error(`Assessment recording failed: ${err.message}`);
    }
  }

  _isDirectAnswer(input) {
    return input.trim().split(/\s+/).length <= 5;
  }

  _parseFrustrationChoice(input) {
    const lower = input.toLowerCase();
    if (/\b(easier|simpl|1)\b/.test(lower) || /简单|容易/.test(lower)) return 'easier';
    if (/\b(switch|different|2)\b/.test(lower) || /换|切换|其他/.test(lower)) return 'switch';
    if (/\b(break|stop|pause|3)\b/.test(lower) || /休息|停|暂停/.test(lower)) return 'break';
    return null;
  }

  // ── Public API (for Express server) ──

  getSessionData(studentId) {
    return this.sessions[studentId] || state.loadSession(studentId);
  }

  getMasteryData(studentId) {
    return state.aggregateMastery(studentId);
  }
}

module.exports = Orchestrator;
