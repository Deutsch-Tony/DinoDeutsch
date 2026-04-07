const state = {
  mode: 'explain',
  topic: 'grammar',
  history: [],
  knowledge: { grammar: [], vocab: [], listening: [] }
};

const modeLabels = { explain: 'Giai thich', practice: 'Luyen tap', quiz: 'Mini quiz', plan: 'Lo trinh' };
const topicLabels = { grammar: 'Grammatik', vocab: 'Wortschatz', listening: 'Hören', mixed: 'Tong hop' };
const quickSuggestions = {
  grammar: [
    'Giai thich Akkusativ ngan gon kem 2 vi du A1.',
    'So sanh Perfekt voi Praeteritum de hoc nhanh hon.',
    'Tao 3 bai tap dien vao cho trong ve weil va dass.'
  ],
  vocab: [
    'Cho minh 8 tu vung A1 ve gia dinh kem nghia Viet.',
    'Tao mini quiz 5 cau tu vung chu de nha cua.',
    'Gom 6 tu vung do an thanh mot doan hoi thoai ngan.'
  ],
  listening: [
    'Tom tat bai nghe gioi thieu ban than va chi ra tu khoa.',
    'Cho checklist shadowing 5 phut cho bai nghe A1.',
    'Rut ra 5 cum hay nghe trong bai mua do o quan cafe.'
  ],
  mixed: [
    'Lap mot buoi hoc 15 phut gom grammar, vocab va nghe.',
    'Chi ra diem nen hoc tiep neu minh dang o A2.',
    'Tao mini quiz tong hop cho buoi hoc hom nay.'
  ]
};

const els = {};

window.addEventListener('DOMContentLoaded', async () => {
  cacheElements();
  bindInteractions();
  renderSuggestions();
  appendMessage('assistant', renderWelcomeMessage());
  renderStatus('Dang nap du lieu hoc...', false);

  try {
    await loadKnowledge();
    renderStats();
    renderStatus('Assistant da san sang. Hay hoi kem level, chu de hoac ten bai de tra loi sat du lieu hon.', false);
  } catch (error) {
    renderStatus('Khong tai duoc du lieu hoc local. Kiem tra lai /data/*.json.', true);
    appendMessage('assistant', `<p><strong>Loi tai du lieu:</strong> ${escapeHtml(error.message)}</p>`);
  }
});

function cacheElements() {
  els.modeGrid = document.getElementById('modeGrid');
  els.topicList = document.getElementById('topicList');
  els.topicBadge = document.getElementById('topicBadge');
  els.modeBadge = document.getElementById('modeBadge');
  els.status = document.getElementById('statusText');
  els.stats = document.getElementById('stats');
  els.messages = document.getElementById('messages');
  els.suggestions = document.getElementById('suggestions');
  els.form = document.getElementById('form');
  els.input = document.getElementById('input');
  els.clearButton = document.getElementById('clearChatButton');
  els.subline = document.getElementById('subline');
}

function bindInteractions() {
  els.modeGrid?.querySelectorAll('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.mode || 'explain'));
  });
  els.topicList?.querySelectorAll('[data-topic]').forEach((button) => {
    button.addEventListener('click', () => setTopic(button.dataset.topic || 'grammar'));
  });
  document.querySelectorAll('[data-prompt]').forEach((button) => {
    button.addEventListener('click', () => {
      const prompt = button.dataset.prompt || '';
      els.input.value = prompt;
      void handleAsk(prompt);
    });
  });
  els.form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    await handleAsk(els.input.value.trim());
  });
  els.clearButton?.addEventListener('click', () => {
    state.history = [];
    els.messages.innerHTML = '';
    appendMessage('assistant', renderWelcomeMessage());
    renderSuggestions();
    renderStatus('Da xoa hoi thoai. Ban co the bat dau lai tu bat ky chu de nao.', false);
  });
}

async function loadKnowledge() {
  const [grammarRes, vocabRes, listeningRes] = await Promise.all([
    fetch('/data/grammar.json'),
    fetch('/data/vocab.json'),
    fetch('/data/listening.json')
  ]);
  if (!grammarRes.ok || !vocabRes.ok || !listeningRes.ok) {
    throw new Error('Mot trong cac file du lieu khong doc duoc.');
  }
  const [grammarRaw, vocabRaw, listeningRaw] = await Promise.all([
    grammarRes.json(),
    vocabRes.json(),
    listeningRes.json()
  ]);
  state.knowledge.grammar = flattenGrammar(grammarRaw);
  state.knowledge.vocab = flattenVocab(vocabRaw);
  state.knowledge.listening = flattenListening(listeningRaw);
}

function flattenGrammar(raw) {
  return (raw.levels || []).flatMap((levelEntry) =>
    (levelEntry.sections || []).flatMap((section) =>
      (section.lessons || []).map((lesson) => ({
        type: 'grammar',
        level: levelEntry.level,
        group: section.group,
        title: lesson.title,
        summary: lesson.summary,
        pattern: lesson.pattern,
        examples: lesson.examples || [],
        mistakes: lesson.mistakes || [],
        text: [levelEntry.level, section.group, lesson.title, lesson.summary, lesson.pattern, ...(lesson.examples || []), ...(lesson.mistakes || [])].join(' ')
      }))
    )
  );
}

function flattenVocab(raw) {
  return Object.entries(raw).flatMap(([level, topics]) =>
    Object.entries(topics || {}).flatMap(([topic, words]) =>
      (words || []).map((entry) => ({
        type: 'vocab',
        level,
        topic,
        title: entry.word,
        word: entry.word,
        gender: entry.gender,
        vi: entry.vi,
        en: entry.en,
        ipa: entry.ipa,
        example: entry.example,
        text: [level, topic, entry.word, entry.vi, entry.en, entry.example, entry.pos].join(' ')
      }))
    )
  );
}

function flattenListening(raw) {
  return (raw.levels || []).flatMap((levelEntry) =>
    (levelEntry.tracks || []).flatMap((track) =>
      (track.lessons || []).map((lesson) => ({
        type: 'listening',
        level: levelEntry.level,
        group: track.group,
        title: lesson.title,
        scenario: lesson.scenario,
        goal: lesson.goal,
        transcript: lesson.transcript || [],
        listenFor: lesson.listenFor || [],
        duration: lesson.duration,
        text: [levelEntry.level, track.group, lesson.title, lesson.scenario, lesson.goal, ...(lesson.transcript || []), ...(lesson.listenFor || [])].join(' ')
      }))
    )
  );
}

function setMode(mode) {
  state.mode = mode;
  els.modeGrid?.querySelectorAll('[data-mode]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.mode === mode);
  });
  els.modeBadge.textContent = modeLabels[mode] || modeLabels.explain;
  renderSuggestions();
}

function setTopic(topic) {
  state.topic = topic;
  els.topicList?.querySelectorAll('[data-topic]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.topic === topic);
  });
  els.topicBadge.textContent = topicLabels[topic] || topicLabels.grammar;
  els.subline.textContent = topic === 'mixed'
    ? 'Assistant dang tong hop du lieu tu grammar, vocab va listening.'
    : `Assistant dang uu tien du lieu ${topicLabels[topic]}.`;
  renderSuggestions();
}

async function handleAsk(prompt) {
  const question = String(prompt || '').trim();
  if (!question) return;
  if (els.input.value.trim()) els.input.value = '';
  appendMessage('user', `<p>${escapeHtml(question)}</p>`);
  renderStatus('Dang tong hop cau tra loi tu kho du lieu hoc...', false);
  const answer = buildAnswer(question);
  state.history.push({ role: 'user', content: question });
  state.history.push({ role: 'assistant', content: answer.plain });
  appendMessage('assistant', answer.html, answer.chips);
  renderStatus(`Da tra loi bang nguon ${topicLabels[answer.topicUsed] || 'Tong hop'} voi ${answer.matchCount} muc du lieu lien quan.`, false);
}

function buildAnswer(question) {
  const topicUsed = state.topic === 'mixed' ? inferTopic(question) : state.topic;
  const records = searchRecords(topicUsed, question);
  if (!records.length) {
    return {
      topicUsed,
      matchCount: 0,
      plain: 'Chua tim thay muc du lieu khop voi cau hoi. Hay noi ro hon level, chu de hoac ten bai.',
      html: `<p>Minh chua tim thay muc du lieu that su khop voi cau hoi nay.</p><div class="answer-block"><h3>Thu hoi lai theo mot trong 3 cach nay</h3><ul><li>them level: <strong>A1, A2, B1, B2</strong></li><li>them chu de: <strong>gia dinh, Perfekt, mua do, gioi thieu ban than</strong></li><li>hoi ro muc tieu: <strong>giai thich, tao bai tap, tom tat bai nghe</strong></li></ul></div>`,
      chips: ['Can cu the hon', topicLabels[topicUsed] || 'Tong hop']
    };
  }
  if (topicUsed === 'grammar') return buildGrammarAnswer(records);
  if (topicUsed === 'vocab') return buildVocabAnswer(records);
  return buildListeningAnswer(records);
}
