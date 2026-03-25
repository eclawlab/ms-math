// 初中数学导师 — 前端应用
(function () {
  'use strict';

  // ── State ──
  let studentId = '';
  let grade = 'grade-7';
  let tutorId = 'methodical';
  let currentSession = null;

  // ── DOM ──
  const loginScreen = document.getElementById('login-screen');
  const appScreen = document.getElementById('app-screen');
  const loginName = document.getElementById('login-name');
  const loginGrade = document.getElementById('login-grade');
  const loginBtn = document.getElementById('login-btn');
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const typing = document.getElementById('typing');
  const studentInfo = document.getElementById('student-info');

  // ── Login ──

  loginBtn.addEventListener('click', startSession);
  loginName.addEventListener('keypress', e => { if (e.key === 'Enter') startSession(); });

  // ── Tutor Selection ──
  document.querySelectorAll('.tutor-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.tutor-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      tutorId = card.dataset.tutor;
    });
  });

  async function startSession() {
    const name = loginName.value.trim();
    if (!name) { loginName.focus(); return; }

    studentId = name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, '_');
    grade = loginGrade.value;

    loginBtn.disabled = true;
    loginBtn.textContent = '正在启动...';

    try {
      const res = await api('/api/start', { studentId, grade, tutorId });
      currentSession = res.session;

      // Switch screens
      loginScreen.style.display = 'none';
      appScreen.style.display = 'block';
      const tutorNames = { methodical: '艾老师', competitive: '马老师', creative: '苏老师' };
      studentInfo.textContent = `${name} — ${grade.replace('grade-', '')}年级 — ${tutorNames[tutorId] || tutorId}`;

      addMessage('tutor', res.message);
      updateSidebar(res.mastery, res.session);
      chatInput.focus();
    } catch (err) {
      loginBtn.disabled = false;
      loginBtn.textContent = '开始学习';
      alert('启动会话失败: ' + err.message);
    }
  }

  // ── Chat ──

  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });

  async function sendMessage() {
    const msg = chatInput.value.trim();
    if (!msg) return;

    addMessage('student', msg);
    chatInput.value = '';
    chatInput.disabled = true;
    sendBtn.disabled = true;
    showTyping();

    try {
      const res = await api('/api/turn', { studentId, message: msg });
      currentSession = res.session;

      hideTyping();
      addMessage('tutor', res.message);
      updateSidebar(res.mastery, res.session);
      updateDomainNav(res.session);
    } catch (err) {
      hideTyping();
      addMessage('tutor', '出了点问题，请再试一次？');
    }

    chatInput.disabled = false;
    sendBtn.disabled = false;
    chatInput.focus();
  }

  // ── Quick Actions ──

  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      chatInput.value = btn.dataset.msg;
      sendMessage();
    });
  });

  // ── Domain Nav ──

  document.querySelectorAll('.domain-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      chatInput.value = `我想学习${btn.textContent}`;
      sendMessage();
    });
  });

  function updateDomainNav(session) {
    document.querySelectorAll('.domain-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.domain === session?.activeModule);
    });
  }

  // ── Messages ──

  function addMessage(role, text) {
    const div = document.createElement('div');
    div.className = `message ${role}`;

    const sender = document.createElement('div');
    sender.className = 'sender';
    const tutorNames = { methodical: '艾老师', competitive: '马老师', creative: '苏老师' };
    sender.textContent = role === 'tutor' ? (tutorNames[tutorId] || '老师') : '你';

    const content = document.createElement('div');
    content.className = 'content';
    content.textContent = text;

    div.appendChild(sender);
    div.appendChild(content);

    // Insert before typing indicator
    chatMessages.insertBefore(div, typing);
    scrollToBottom();
  }

  function showTyping() { typing.classList.add('show'); scrollToBottom(); }
  function hideTyping() { typing.classList.remove('show'); }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }

  // ── Sidebar Updates ──

  function updateSidebar(mastery, session) {
    updateMasteryBars(mastery);
    updateSessionInfo(session);
    updateRecentResults(session);
  }

  function updateMasteryBars(mastery) {
    const container = document.getElementById('mastery-bars');
    if (!mastery) return;

    const domains = [
      { key: 'numbers', label: '数与运算' },
      { key: 'algebra', label: '代数' },
      { key: 'geometry', label: '几何' },
      { key: 'ratios', label: '比例' },
      { key: 'data', label: '数据' },
    ];

    container.innerHTML = domains.map(d => {
      const pct = Math.round((mastery[d.key] || 0) * 100);
      const level = pct >= 80 ? 'high' : pct >= 50 ? 'mid' : 'low';
      return `
        <div class="mastery-domain">
          <div class="mastery-label">
            <span class="name">${d.label}</span>
            <span class="pct">${pct}%</span>
          </div>
          <div class="mastery-bar">
            <div class="fill ${level}" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  function updateSessionInfo(session) {
    if (!session) return;

    document.getElementById('info-module').textContent =
      formatModule(session.activeModule) || '—';
    document.getElementById('info-skill').textContent =
      formatSkill(session.activeSkill) || '—';

    const phaseMap = {
      idle: '空闲', exercise: '练习', lesson: '课程',
      lab: '实验', cer: 'CER', diagram: '图表', review: '复习'
    };
    document.getElementById('info-phase').textContent =
      phaseMap[session.phase] || session.phase || '空闲';

    const streakEl = document.getElementById('info-streak');
    const streak = session.correctStreak || 0;
    if (streak >= 5) {
      streakEl.innerHTML = `<span class="streak-badge hot">${streak} 连对！</span>`;
    } else if (streak >= 3) {
      streakEl.innerHTML = `<span class="streak-badge">${streak} 连对</span>`;
    } else {
      streakEl.textContent = streak;
    }
  }

  function updateRecentResults(session) {
    const container = document.getElementById('recent-results');
    if (!session?.recentResults?.length) {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">暂无成绩</p>';
      return;
    }

    container.innerHTML = session.recentResults.slice().reverse().map(r => {
      const pct = r.total > 0 ? Math.round(r.score / r.total * 100) : 0;
      const level = pct >= 80 ? 'good' : pct >= 60 ? 'ok' : 'low';
      return `
        <div class="recent-result">
          <span class="skill">${formatSkill(r.skill)}</span>
          <span class="score ${level}">${r.score}/${r.total}</span>
        </div>
      `;
    }).join('');
  }

  // ── Math Lab Panel ──

  const labToggleBtn = document.getElementById('lab-toggle-btn');
  const labPanel = document.getElementById('lab-panel');
  const labCloseBtn = document.getElementById('lab-close-btn');
  const labSearch = document.getElementById('lab-search');
  const labTopics = document.getElementById('lab-topics');
  const chatPanel = document.querySelector('.chat-panel');
  const simOverlay = document.getElementById('sim-overlay');
  const simFrame = document.getElementById('sim-frame');
  const simOverlayTitle = document.getElementById('sim-overlay-title');
  const simOverlayClose = document.getElementById('sim-overlay-close');

  let labLoaded = false;

  labToggleBtn.addEventListener('click', () => {
    const opening = !labPanel.classList.contains('open');
    labPanel.classList.toggle('open', opening);
    chatPanel.style.display = opening ? 'none' : '';
    labToggleBtn.classList.toggle('active', opening);
    if (opening && !labLoaded) loadLabCatalog();
  });

  labCloseBtn.addEventListener('click', () => {
    labPanel.classList.remove('open');
    chatPanel.style.display = '';
    labToggleBtn.classList.remove('active');
  });

  async function loadLabCatalog() {
    try {
      const res = await api('/api/simulations');
      renderLabCatalog(res.topics);
      labLoaded = true;
    } catch (err) {
      labTopics.innerHTML = '<p style="color:var(--danger);padding:20px;">加载模拟实验失败。</p>';
    }
  }

  function renderLabCatalog(topicsList) {
    labTopics.innerHTML = topicsList.map(topic => {
      const simCards = topic.sims.map(sim => `
        <div class="lab-sim-card" data-slug="${sim.slug}" data-title="${sim.title}" data-search="${sim.title.toLowerCase()} ${sim.desc.toLowerCase()}">
          <div class="lab-sim-thumb">
            <img src="/${sim.slug}/assets/${sim.slug}-screenshot.png" alt="${sim.title}" loading="lazy"
                 onerror="this.style.display='none'" />
            <div class="lab-sim-play">▶</div>
          </div>
          <div class="lab-sim-info">
            <h4>${sim.title}</h4>
            <p>${sim.desc}</p>
          </div>
        </div>
      `).join('');

      return `
        <div class="lab-topic" data-topic-id="${topic.id}">
          <div class="lab-topic-header">
            <span class="lab-topic-icon">${topic.icon}</span>
            <h3>${topic.title}</h3>
            <span class="lab-topic-count">${topic.sims.length} 个模拟</span>
          </div>
          <div class="lab-sim-grid">${simCards}</div>
        </div>
      `;
    }).join('');

    // Click handlers for sim cards
    labTopics.querySelectorAll('.lab-sim-card').forEach(card => {
      card.addEventListener('click', () => {
        const slug = card.dataset.slug;
        const title = card.dataset.title;
        openSimulation(slug, title);
      });
    });
  }

  // Search within lab
  labSearch.addEventListener('input', () => {
    const q = labSearch.value.toLowerCase().trim();
    const cards = labTopics.querySelectorAll('.lab-sim-card');
    cards.forEach(card => {
      const show = !q || card.dataset.search.includes(q);
      card.classList.toggle('hidden', !show);
    });
    labTopics.querySelectorAll('.lab-topic').forEach(topic => {
      const hasVisible = topic.querySelectorAll('.lab-sim-card:not(.hidden)').length > 0;
      topic.style.display = hasVisible ? '' : 'none';
    });
  });

  // Open simulation in new tab (PhET sims need full page context)
  function openSimulation(slug, title) {
    window.open(`/${slug}/${slug}_en.html?esbuild`, '_blank');
  }

  // Close sim overlay
  simOverlayClose.addEventListener('click', closeSimOverlay);
  simOverlay.addEventListener('click', e => { if (e.target === simOverlay) closeSimOverlay(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSimOverlay(); });

  function closeSimOverlay() {
    simOverlay.classList.remove('open');
    simFrame.src = '';
  }

  // ── Helpers ──

  function formatModule(mod) {
    if (!mod) return null;
    const names = {
      numbers: '数与运算',
      algebra: '代数',
      geometry: '几何',
      ratios: '比例',
      data: '数据',
      'study-planner': '学习计划',
    };
    return names[mod] || mod;
  }

  function formatSkill(skill) {
    if (!skill) return null;
    return skill.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  async function api(url, body) {
    const res = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: '请求失败' }));
      throw new Error(err.error || '请求失败');
    }
    return res.json();
  }
})();
