import { fmtDateLong, saveData, today } from './data.js';
import { showToast, launchConfetti, updateStreak } from './ui.js';

let _appData = null;
let _onSaved = null;
let dlFlow = 'none', dlMood = null, dlIntimate = null;

export function initDayLogModal(appData, onSaved) {
  _appData = appData;
  _onSaved = onSaved;

  document.getElementById('daylog-close').addEventListener('click', close);
  document.getElementById('dl-cancel').addEventListener('click', close);
  document.getElementById('dl-save').addEventListener('click', save);

  document.getElementById('dl-flow-pills').addEventListener('click', e => {
    const btn = e.target.closest('[data-flow]');
    if (!btn) return;
    document.querySelectorAll('#dl-flow-pills [data-flow]').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    dlFlow = btn.dataset.flow;
  });

  document.getElementById('dl-moods').addEventListener('click', e => {
    const card = e.target.closest('[data-mood]');
    if (!card) return;
    document.querySelectorAll('#dl-moods [data-mood]').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    dlMood = card.dataset.mood;
  });

  document.getElementById('dl-symptoms').addEventListener('click', e => {
    const chip = e.target.closest('[data-sym]');
    if (chip) chip.classList.toggle('active');
  });

  document.getElementById('dl-intimate-pills').addEventListener('click', e => {
    const btn = e.target.closest('[data-intimate]');
    if (!btn) return;
    document.querySelectorAll('#dl-intimate-pills [data-intimate]').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    dlIntimate = btn.dataset.intimate;
    document.getElementById('dl-intimate-note').classList.toggle('hidden', dlIntimate === 'no');
  });

  document.addEventListener('open-daylog', e => open(e.detail.date));
  document.addEventListener('update-appdata', e => { _appData = e.detail; });
}

export function updateAppData(data) {
  _appData = data;
}

function open(dateStr) {
  dlFlow = 'none'; dlMood = null; dlIntimate = null;

  document.getElementById('dl-date').value = dateStr;
  document.getElementById('daylog-title').textContent = `Log — ${fmtDateLong(dateStr)}`;
  document.getElementById('dl-notes').value = '';
  document.getElementById('dl-intimate-note').value = '';
  document.getElementById('dl-intimate-note').classList.add('hidden');

  document.querySelectorAll('#dl-flow-pills [data-flow]').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('#dl-moods [data-mood]').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('#dl-symptoms [data-sym]').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('#dl-intimate-pills [data-intimate]').forEach(b => b.classList.remove('selected'));

  const existing = _appData.logs[dateStr];
  if (existing) {
    dlFlow     = existing.flow || 'none';
    dlMood     = existing.mood || null;
    dlIntimate = existing.intimate || null;

    document.querySelector(`#dl-flow-pills [data-flow="${dlFlow}"]`)?.classList.add('selected');
    if (dlMood) document.querySelector(`#dl-moods [data-mood="${dlMood}"]`)?.classList.add('active');
    (existing.symptoms || []).forEach(s => {
      document.querySelector(`#dl-symptoms [data-sym="${s}"]`)?.classList.add('active');
    });
    if (dlIntimate) {
      document.querySelector(`#dl-intimate-pills [data-intimate="${dlIntimate}"]`)?.classList.add('selected');
      if (dlIntimate !== 'no') document.getElementById('dl-intimate-note').classList.remove('hidden');
    }
    document.getElementById('dl-intimate-note').value = existing.intimateNote || '';
    document.getElementById('dl-notes').value = existing.notes || '';
  }

  document.getElementById('daylog-overlay').classList.remove('hidden');
}

function close() {
  document.getElementById('daylog-overlay').classList.add('hidden');
}

function save() {
  const dateStr = document.getElementById('dl-date').value;
  const syms    = [...document.querySelectorAll('#dl-symptoms [data-sym].active')].map(c => c.dataset.sym);

  _appData.logs[dateStr] = {
    flow: dlFlow,
    mood: dlMood,
    symptoms: syms,
    intimate: dlIntimate,
    intimateNote: document.getElementById('dl-intimate-note').value,
    notes: document.getElementById('dl-notes').value,
  };

  _appData = updateStreak(_appData, streak => {
    launchConfetti();
    showToast(`🔥 ${streak}-day streak! You're amazing!`);
  });

  saveData(_appData);
  close();

  if (dlIntimate === 'during') {
    launchConfetti();
    showToast('💕 Logged! You two are brave & beautiful 🩸💕');
  } else {
    showToast('✨ Day logged!');
  }

  if (_onSaved) _onSaved(_appData);
}
