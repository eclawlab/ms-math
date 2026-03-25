// 对话包装器 — 将结构化模块输出转换为导师的对话。
// 数学专用：处理练习、CER、图表、实验、词汇、进度。

// ── 工具函数 ──

function formatSkillName(skill) {
  if (!skill) return '这个知识点';
  return skill.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatModuleName(mod) {
  if (!mod) return '新的主题';
  const names = {
    'numbers': '数与运算',
    'algebra': '代数思维',
    'geometry': '几何与测量',
    'ratios': '比例与百分比',
    'data': '数据与概率',
    'study-planner': '你的学习计划',
  };
  return names[mod] || mod.replace(/-/g, ' ');
}

function extractHint(rule) {
  if (!rule) return '这里涉及的数学概念';
  const clause = rule.split(/[.;]/)[0].trim();
  const words = clause.split(' ');
  if (words.length <= 10) return clause.toLowerCase();
  return words.slice(0, 8).join(' ').toLowerCase() + '...';
}

// ── 导师定义 ──

const TUTORS = {
  methodical: {
    id: 'methodical',
    name: '艾老师',
    title: 'Mx. Ellis',
    style: '循序渐进型',
    description: '耐心细致，一步一步带你学，把复杂概念拆成小块。',
    affirmations: ['完全正确！', '答对了！', '做得好！', '没错！', '非常棒！', '很好！', '数学思维很到位！'],
    wrongFirst: '不太对哦——不过思路不错。',
    wrongReveal: '不错的尝试——我来给你讲解一下。',
    encourageAfterReveal: '别担心——理解解析和答对一样重要。我们继续！',
    streakMild: '你状态很好，继续加油！',
    streakHot: '太厉害了！给你来道难一点的。',
    welcomeNew: (name) => [
      `你好${name ? '，' + name : ''}！我是艾老师，你的数学导师。`,
      '',
      '我教数与运算、代数、几何、比例和数据统计——适合6到8年级的同学。',
      '',
      '在开始之前，我想先了解一下你的学习习惯，这样我能更好地帮助你。',
    ].join('\n'),
    welcomeBack: (name, mod) => {
      const parts = [`欢迎回来${name ? '，' + name : ''}！`];
      if (mod) { parts.push(`上次我们在学习${formatModuleName(mod)}。`); parts.push('继续上次的内容，还是试试别的？'); }
      else parts.push('今天想学什么？');
      return parts.join(' ');
    },
    askQ1: '你平时喜欢怎么学新东西？\n\nA) 动手试试看\nB) 先看例子再自己做\nC) 直接做题，错了再学',
    askQ2: '遇到不会的题，你通常会怎么做？\n\nA) 自己多想一会儿\nB) 看提示或问人\nC) 先跳过，回头再看',
    askQ3: '你觉得自己学东西的节奏是？\n\nA) 喜欢慢慢来，一步一步\nB) 看状态，有时快有时慢\nC) 喜欢快节奏，一口气学很多',
    onboardingSummary: (profile) => {
      const parts = ['好的，我了解你了！根据你的学习习惯，我会这样安排：\n'];
      if (profile.learningPref === 'hands-on') parts.push('- 多安排动手练习和探索，让你在做中学。');
      else if (profile.learningPref === 'examples-first') parts.push('- 先给你看例子，再让你自己练习。');
      else parts.push('- 直接上题，边做边学，错了我来讲解。');
      if (profile.studyPace === 'steady') parts.push('- 每次练习少一点，稳扎稳打。');
      else if (profile.studyPace === 'intensive') parts.push('- 每次多做几道题，高效学习。');
      else parts.push('- 根据你的状态灵活调整节奏。');
      parts.push('\n现在，你想从哪个领域开始？数与运算、代数、几何、比例还是数据统计？');
      return parts.join('\n');
    },
  },
  competitive: {
    id: 'competitive',
    name: '马老师',
    title: 'Coach Ma',
    style: '挑战激励型',
    description: '充满活力，用挑战和竞争激发你的学习动力。',
    affirmations: ['漂亮！', '得分！', '命中！', '又对了！', '连击！', '太猛了！', '数学达人！'],
    wrongFirst: '差一点——别放弃，再冲一次！',
    wrongReveal: '这道确实难——看看正确答案，下次拿下它！',
    encourageAfterReveal: '记住这个知识点，下回见到它你就能秒杀了！',
    streakMild: '连续答对，手感来了！',
    streakHot: '火力全开！来道boss级的！',
    welcomeNew: (name) => [
      `嘿${name ? '，' + name : ''}！我是马老师，你的数学教练！`,
      '',
      '数与运算、代数、几何、比例、数据——五大关卡等你来挑战！',
      '',
      '开始之前，让我先摸摸你的底，看看你是什么类型的选手。',
    ].join('\n'),
    welcomeBack: (name, mod) => {
      const parts = [`${name ? name + '，' : ''}你回来了！准备好继续闯关了吗？`];
      if (mod) { parts.push(`上次你在攻克${formatModuleName(mod)}。`); parts.push('继续还是换个战场？'); }
      else parts.push('今天想挑战哪个关卡？');
      return parts.join(' ');
    },
    askQ1: '先告诉我，你是哪种类型的选手？\n\nA) 实战派——动手试试就知道了\nB) 观察派——先看别人怎么做\nC) 冒险派——直接上，错了再说',
    askQ2: '遇到难题的时候，你会怎么做？\n\nA) 死磕到底，不服输\nB) 找找线索和提示\nC) 先跳过，回头再战',
    askQ3: '你的学习节奏是？\n\nA) 稳扎稳打，一步一个脚印\nB) 看心情，状态好就猛冲\nC) 高强度训练，一口气搞定',
    onboardingSummary: (profile) => {
      const parts = ['收到！你的选手档案建好了：\n'];
      if (profile.learningPref === 'hands-on') parts.push('- 你是实战型选手，我会多安排动手挑战！');
      else if (profile.learningPref === 'examples-first') parts.push('- 你是策略型选手，先看攻略再上场！');
      else parts.push('- 你是冒险型选手，直接实战出真知！');
      if (profile.studyPace === 'steady') parts.push('- 训练计划：少量多次，稳步提升。');
      else if (profile.studyPace === 'intensive') parts.push('- 训练计划：高强度冲刺，快速升级！');
      else parts.push('- 训练计划：灵活调整，按状态冲刺。');
      parts.push('\n选个战场开始吧！数与运算、代数、几何、比例还是数据统计？');
      return parts.join('\n');
    },
  },
  creative: {
    id: 'creative',
    name: '苏老师',
    title: 'Ms. Su',
    style: '故事创意型',
    description: '用故事和生活场景把数学变得生动有趣。',
    affirmations: ['说得太好了！', '你发现了！', '就是这样！', '聪明！', '你的数学直觉很棒！', '奇妙吧？', '你像数学家一样思考！'],
    wrongFirst: '嗯，不太对——但你的想法很有意思。',
    wrongReveal: '这个答案确实不容易想到——来看看背后的故事。',
    encourageAfterReveal: '数学的美妙就在于：每个"错误"都让你离真相更近一步。',
    streakMild: '你越来越有感觉了！',
    streakHot: '简直像数学家一样思考！来个更有趣的挑战！',
    welcomeNew: (name) => [
      `你好${name ? '，' + name : ''}！我是苏老师。`,
      '',
      '你有没有想过，为什么蜂巢是六边形的？为什么打折时先算百分比？为什么音乐和分数有关系？',
      '',
      '这些都是数学！在开始探索之前，我想先了解一下你是怎么学习的。',
    ].join('\n'),
    welcomeBack: (name, mod) => {
      const parts = [`${name ? name + '，' : ''}又见面了！`];
      if (mod) { parts.push(`上次我们一起探索了${formatModuleName(mod)}的奥秘。`); parts.push('想继续那个故事，还是开始新的冒险？'); }
      else parts.push('今天想探索什么奥秘？');
      return parts.join(' ');
    },
    askQ1: '想象你面前有一个从没见过的神奇谜题——你会怎么做？\n\nA) 先摸摸按按，动手试试\nB) 先观察别人怎么解\nC) 随便试试看会发生什么',
    askQ2: '如果你在解一个谜题，卡住了，你会？\n\nA) 坐下来慢慢想，不着急\nB) 找找有没有线索提示\nC) 先去做别的，灵感来了再回来',
    askQ3: '你看一本很好看的书，会怎么读？\n\nA) 每天读一点，慢慢享受\nB) 看心情，有时候一口气看好几章\nC) 停不下来，一口气看完！',
    onboardingSummary: (profile) => {
      const parts = ['太棒了，我已经了解你了！\n'];
      if (profile.learningPref === 'hands-on') parts.push('- 你喜欢动手探索——我会带你做很多有趣的数学活动！');
      else if (profile.learningPref === 'examples-first') parts.push('- 你喜欢先看故事再动手——我会先给你讲个数学小故事，再一起练习。');
      else parts.push('- 你喜欢自己发现——我会让你直接体验，在"犯错"中找到规律。');
      if (profile.studyPace === 'steady') parts.push('- 我们慢慢来，像读一本好书一样享受每个知识点。');
      else if (profile.studyPace === 'intensive') parts.push('- 你精力充沛！我们一起快节奏地探索更多奥秘。');
      else parts.push('- 我们随心所欲，跟着好奇心走。');
      parts.push('\n你最好奇哪个领域？数与运算、代数、几何、比例还是数据统计？');
      return parts.join('\n');
    },
  },
};

// ── 练习题展示 ──

function presentExerciseItem(item, type, instruction, context = {}) {
  const { itemNumber, totalItems, streak } = context;
  const tutor = TUTORS[(context && context.tutor) || 'methodical'] || TUTORS.methodical;
  const parts = [];

  if (itemNumber && totalItems) {
    parts.push(`（第 ${itemNumber} 题，共 ${totalItems} 题）`);
  }

  if (streak >= 3 && streak < 5) {
    parts.push(tutor.streakMild);
  } else if (streak >= 5) {
    parts.push(tutor.streakHot);
  }

  switch (type) {
    case 'short':
    case 'open':
      parts.push(item.q || item.prompt || instruction);
      break;

    case 'tf':
      parts.push(item.q || item.prompt);
      parts.push('\n（判断对错）');
      break;

    case 'multi':
      parts.push(item.q || item.prompt);
      if (item.options && item.options.length > 0) {
        parts.push(`\n选项：${item.options.join('  /  ')}`);
      }
      break;

    case 'fill-in-choice':
      parts.push(item.prompt || instruction);
      if (item.options && item.options.length > 0) {
        parts.push(`\n选项：${item.options.join('  /  ')}`);
      }
      break;

    case 'calculation':
      parts.push(item.q || item.prompt);
      if (item.formula) {
        parts.push(`\n（提示：${item.formula}）`);
      }
      break;

    default:
      parts.push(item.q || item.prompt || item.question || instruction || '你觉得呢？');
      if (item.options && item.options.length > 0) {
        parts.push(`\n选项：${item.options.join('  /  ')}`);
      }
      break;
  }

  return parts.join('\n');
}

// ── 答案反馈 ──

function affirmCorrect(item, type, studentAnswer, context = {}) {
  const { streak } = context;
  const tutor = TUTORS[(context && context.tutor) || 'methodical'] || TUTORS.methodical;
  const affirmations = tutor.affirmations;

  const idx = Math.min((streak || 0), affirmations.length - 1);
  const parts = [affirmations[idx]];

  if (item.explanation) {
    parts.push(item.explanation);
  } else if (item.rule) {
    parts.push(item.rule);
  } else if (item.concept) {
    parts.push(`这就是「${item.concept}」的核心概念。`);
  }

  return parts.join(' ');
}

function explainWrong(item, type, studentAnswer, attempt, context = {}, maxAttempts = 2) {
  const tutor = TUTORS[(context && context.tutor) || 'methodical'] || TUTORS.methodical;
  const parts = [];
  let revealAnswer = false;

  if (attempt < maxAttempts) {
    parts.push(tutor.wrongFirst);

    if (item.misconception) {
      parts.push(`这里有一个常见误解：${item.misconception}。想想正确的解法是什么。`);
    } else if (item.hint) {
      parts.push(`提示：${item.hint}`);
    } else if (item.formula) {
      parts.push(`试试用这个公式：${item.formula}`);
    } else if (item.rule) {
      parts.push(`想一想：${extractHint(item.rule)}`);
    } else {
      parts.push('想想我们学过的方法，再试一次！');
    }

    parts.push('\n再试一次吧！');
  } else {
    revealAnswer = true;
    parts.push(tutor.wrongReveal);

    const answer = item.a || item.answer || item.expected;
    if (Array.isArray(answer)) {
      parts.push(`正确答案是：${answer[0]}`);
    } else {
      parts.push(`正确答案是：${answer}`);
    }

    if (item.explanation) {
      parts.push(item.explanation);
    } else if (item.rule) {
      parts.push(item.rule);
    }

    if (item.misconception) {
      parts.push(`注意这个常见错误：${item.misconception}`);
    }

    parts.push('\n' + tutor.encourageAfterReveal);
  }

  return { text: parts.join('\n'), revealAnswer };
}

// ── 课程展示 ──

function presentLesson(lesson, context = {}) {
  const parts = [];

  if (lesson.targetSkill) {
    const skillName = formatSkillName(lesson.targetSkill.skill || lesson.targetSkill);
    parts.push(`今天我们来学习「${skillName}」。`);
  }

  if (lesson.phenomenon) {
    parts.push(`\n有个有趣的现象：${lesson.phenomenon}`);
    parts.push("你觉得这里发生了什么？");
  }

  if (lesson.teach || (lesson.lessonPlan && lesson.lessonPlan.teach)) {
    parts.push(`\n${lesson.teach || lesson.lessonPlan.teach}`);
  }

  if (!lesson.phenomenon) {
    parts.push("\n准备好做练习了吗？我会一题一题来。");
  }

  return parts.join('\n');
}

// ── CER 展示 ──

function presentCER(cerData) {
  const parts = [];
  parts.push("让我们用「主张-证据-推理」（CER）的方式来写一个数学论证。\n");
  parts.push(`现象：${cerData.phenomenon || cerData.topic}`);
  if (cerData.scaffold) {
    parts.push(`\n${cerData.scaffold}`);
  }
  parts.push("\n先说说你的主张——你认为结论是什么？为什么？");
  return parts.join('\n');
}

function presentCERStep(step) {
  switch (step) {
    case 'evidence':
      return "主张说得好！现在说说支持它的证据是什么？想想我们课上学过的数据、计算或事实。";
    case 'reasoning':
      return "证据找得不错！现在把它们联系起来——解释为什么你的证据能支持你的主张。用上我们学过的数学概念。";
    case 'complete':
      return "很棒，CER 写完了！让我来看看你的作品...";
    default:
      return "你觉得呢？";
  }
}

function presentCERFeedback(scores) {
  const parts = ["你的数学论证评分如下：\n"];

  const labels = { 0: '需要改进', 1: '还在进步', 2: '不错', 3: '优秀' };

  if (scores.claim !== undefined) parts.push(`  主张：${labels[scores.claim] || scores.claim}/3`);
  if (scores.evidence !== undefined) parts.push(`  证据：${labels[scores.evidence] || scores.evidence}/3`);
  if (scores.reasoning !== undefined) parts.push(`  推理：${labels[scores.reasoning] || scores.reasoning}/3`);

  if (scores.feedback) {
    parts.push(`\n${scores.feedback}`);
  }

  const total = (scores.claim || 0) + (scores.evidence || 0) + (scores.reasoning || 0);
  if (total >= 7) {
    parts.push("\n出色的数学思维！你的推理能力已经很强了。");
  } else if (total >= 5) {
    parts.push("\n做得不错！你的数学论述能力在进步。");
  } else {
    parts.push("\n好的开始！CER 需要多练习——每一次都会写得更好。");
  }

  return parts.join('\n');
}

// ── 图表标注 ──

function presentDiagram(diagramData) {
  const parts = [];
  parts.push(`标注这个「${formatSkillName(diagramData.topic || '数学')}」图表：\n`);
  parts.push(diagramData.diagram || diagramData.ascii || '[图表]');
  parts.push("\n填写空白处。格式：A=答案, B=答案, ...");
  return parts.join('\n');
}

function presentDiagramFeedback(results) {
  const parts = [];
  let correct = 0;
  let total = 0;

  for (const [label, data] of Object.entries(results.labels || results)) {
    total++;
    if (data.correct) {
      correct++;
      parts.push(`  ${label}：正确！${data.expected || ''}`);
    } else {
      parts.push(`  ${label}：正确答案是"${data.expected}"。${data.explanation || ''}`);
    }
  }

  if (correct === total) {
    return `完美——全部 ${total} 个标注都对了！你对这个图表非常熟悉。` + '\n' + parts.join('\n');
  }
  return `你答对了 ${total} 个标注中的 ${correct} 个。\n` + parts.join('\n');
}

// ── 实验展示 ──

function presentLab(labData) {
  const parts = [];
  parts.push(`虚拟实验：${labData.title || labData.name}\n`);
  if (labData.purpose) parts.push(`目的：${labData.purpose}\n`);
  if (labData.materials) parts.push(`材料：${labData.materials}\n`);
  parts.push("我们会一步步来。准备好开始第一步了吗？");
  return parts.join('\n');
}

function presentLabStep(stepData, stepNum, totalSteps) {
  const parts = [`（第 ${stepNum} 步，共 ${totalSteps} 步）\n`];
  parts.push(stepData.instruction || stepData.prompt || stepData);
  if (stepData.question) {
    parts.push(`\n${stepData.question}`);
  }
  return parts.join('\n');
}

function presentLabComplete(observations) {
  const parts = ["实验完成得很好！\n"];
  if (observations && observations.length > 0) {
    parts.push("你的观察记录：");
    observations.forEach((obs, i) => parts.push(`  ${i + 1}. ${obs}`));
  }
  parts.push("\n想用 CER（主张-证据-推理）的方式写一个实验报告吗？");
  return parts.join('\n');
}

// ── 词汇展示 ──

function presentVocab(vocabData) {
  const parts = ["我们先来学几个关键的数学术语：\n"];

  const terms = vocabData.terms || vocabData;
  if (Array.isArray(terms)) {
    terms.forEach(t => {
      if (typeof t === 'string') {
        parts.push(`  - ${t}`);
      } else {
        parts.push(`  - ${t.term}：${t.definition || t.simplified || ''}`);
        if (t.cognate) parts.push(`    （英文：${t.cognate}）`);
      }
    });
  }

  parts.push("\n这些词你认识吗？我们开始练习吧！");
  return parts.join('\n');
}

// ── 进度展示 ──

function presentProgress(progress, context = {}) {
  const parts = [];

  if (progress.mastered !== undefined && progress.total !== undefined) {
    const pct = progress.overallPct || 0;
    parts.push(`你已经掌握了 ${progress.total} 个知识点中的 ${progress.mastered} 个（${pct}%）。`);

    if (pct >= 90) parts.push("太棒了——你快全部学完了！");
    else if (pct >= 70) parts.push("进步很大！已经完成三分之二以上了。");
    else if (pct >= 40) parts.push("进展不错，继续保持！");
    else parts.push("你正在打好基础——每掌握一个知识点都是进步。");
  }

  if (progress.skills) {
    const mastered = [];
    const developing = [];

    for (const [cat, skills] of Object.entries(progress.skills)) {
      for (const [sk, data] of Object.entries(skills || {})) {
        if (!data) continue;
        if (data.label === 'mastered') mastered.push(formatSkillName(sk));
        else if (data.label === 'developing' || data.label === 'emerging') developing.push(formatSkillName(sk));
      }
    }

    if (mastered.length > 0) {
      parts.push(`\n你的强项：${mastered.slice(0, 3).join('、')}${mastered.length > 3 ? `，还有 ${mastered.length - 3} 个` : ''}。`);
    }
    if (developing.length > 0) {
      parts.push(`建议重点练习：${developing.slice(0, 3).join('、')}。`);
    }
  }

  return parts.join('\n');
}

function presentNextSkills(nextData) {
  if (!nextData.next || nextData.next.length === 0) {
    return "太厉害了——你已经掌握了这个级别的所有知识点！准备好挑战更高难度了吗？";
  }

  const top = nextData.next.slice(0, 3);
  const parts = ["我建议你接下来学习："];

  top.forEach((s, i) => {
    const name = formatSkillName(s.skill);
    const status = s.label || (s.mastery > 0 ? '学习中' : '新知识');
    parts.push(`  ${i + 1}. ${name}（${status}）`);
  });

  parts.push('\n选一个吧？或者说「开始」，我来帮你选最合适的。');
  return parts.join('\n');
}

// ── 练习总结 ──

function presentExerciseSummary(result, context = {}) {
  const { score, total, skill } = result;
  const pct = total > 0 ? Math.round(score / total * 100) : 0;
  const parts = [];

  parts.push(`「${formatSkillName(skill)}」练习完成：${score}/${total} 正确（${pct}%）。`);

  if (pct >= 90) parts.push("优秀！你对这个知识点掌握得很扎实。");
  else if (pct >= 80) parts.push("做得很好——已经很熟练了。");
  else if (pct >= 60) parts.push("不错！再多练习一下就能完全掌握了。");
  else parts.push("这个确实有难度，但这就是为什么要练习。每次都会进步的。");

  parts.push('\n想再来一轮，还是换个新的知识点？');
  return parts.join('\n');
}

// ── 欢迎 ──

function presentWelcome(session, isNew) {
  const tutor = TUTORS[session.tutor] || TUTORS.methodical;

  if (isNew) {
    return tutor.welcomeNew(session.studentId);
  }
  return tutor.welcomeBack(session.studentId, session.activeModule);
}

// ── 模块切换 ──

function presentModuleSwitch(fromModule, toModule, reason) {
  const parts = [];
  if (fromModule) parts.push(`好的，我们先离开${formatModuleName(fromModule)}。`);
  parts.push(`现在进入${formatModuleName(toModule)}。`);
  if (reason) parts.push(reason);
  return parts.join(' ');
}

function askForClarification() {
  return "你对哪个数学话题感兴趣？我们有数与运算、代数、几何、比例和数据统计。";
}

// ── 挫折处理 ──

function checkFrustration(session) {
  if (session.consecutiveWrong >= 3) {
    return [
      "嘿，这道题确实挺难的。这很正常——数学本来就需要多练习。",
      '',
      "你想：",
      "  1. 试一道简单一点的题",
      "  2. 换一个知识领域",
      "  3. 休息一下",
      '',
      "你选哪个？",
    ].join('\n');
  }
  return null;
}

// ── 复习（间隔重复）──

function presentReview(reviewData) {
  if (!reviewData || reviewData.error) {
    return "目前没有需要复习的知识点——你都跟上了！";
  }

  if (reviewData.due && reviewData.due.length === 0) {
    return "目前没有到期需要复习的知识点。做得好，继续保持！";
  }

  const parts = ["间隔复习时间到！以下知识点需要回顾一下：\n"];
  const items = reviewData.due || reviewData.skills || [];
  items.slice(0, 5).forEach((item, i) => {
    const name = typeof item === 'string' ? item : (item.skill || item.topic);
    parts.push(`  ${i + 1}. ${formatSkillName(name)}`);
  });
  parts.push("\n准备开始复习吗？我会逐个考你。");
  return parts.join('\n');
}

// ── 入学引导 ──

function getOnboardingQuestion(tutorId, questionIndex) {
  const tutor = TUTORS[tutorId] || TUTORS.methodical;
  const questions = [tutor.askQ1, tutor.askQ2, tutor.askQ3];
  return questions[questionIndex] || null;
}

function getOnboardingSummary(tutorId, studyProfile) {
  const tutor = TUTORS[tutorId] || TUTORS.methodical;
  return tutor.onboardingSummary(studyProfile);
}

function getTutorName(tutorId) {
  const tutor = TUTORS[tutorId] || TUTORS.methodical;
  return tutor.name;
}

module.exports = {
  presentExerciseItem,
  affirmCorrect,
  explainWrong,
  presentLesson,
  presentCER,
  presentCERStep,
  presentCERFeedback,
  presentDiagram,
  presentDiagramFeedback,
  presentLab,
  presentLabStep,
  presentLabComplete,
  presentVocab,
  presentProgress,
  presentNextSkills,
  presentExerciseSummary,
  presentWelcome,
  presentModuleSwitch,
  askForClarification,
  checkFrustration,
  presentReview,
  formatSkillName,
  formatModuleName,
  getOnboardingQuestion,
  getOnboardingSummary,
  getTutorName,
  TUTORS,
};
