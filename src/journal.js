import { saveData, today } from './data.js';
import { showToast } from './ui.js';

export function renderJournal(appData) {
  const el = document.getElementById('page-journal');
  const entries = (appData.journalEntries || []).slice().reverse();

  el.innerHTML = `
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="font-serif text-2xl font-bold grad-pink">Journal 📖</h2>
      <button id="journal-add" class="btn-primary text-sm py-2 px-4">+ New Entry</button>
    </div>

    <!-- Add entry form (hidden by default) -->
    <div id="journal-form" class="glass p-5 hidden">
      <div class="space-y-3">
        <div>
          <label class="label">Title</label>
          <input id="jf-title" type="text" placeholder="e.g. Day 2 — soft morning 🌸" class="field" />
        </div>
        <div>
          <label class="label">Color accent</label>
          <div class="flex gap-2" id="jf-colors">
            ${['#fb7185','#a78bfa','#2dd4bf','#fbbf24','#e879f9'].map(c =>
              `<button class="w-7 h-7 rounded-full jf-color-btn transition-all hover:scale-110 border-2 border-transparent" data-color="${c}" style="background:${c};"></button>`
            ).join('')}
          </div>
        </div>
        <div>
          <label class="label">Entry</label>
          <textarea id="jf-body" rows="5" placeholder="Write anything, it's just for you (and maybe Arnab 💕)..." class="field resize-none"></textarea>
        </div>
        <div class="flex gap-3">
          <button id="jf-save" class="btn-primary flex-1">Save Entry 💾</button>
          <button id="jf-cancel" class="btn-secondary flex-1">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Entry list -->
    <div id="journal-list">
      ${entries.length === 0
        ? `<div class="glass p-8 text-center text-secondary">No journal entries yet.<br>Start writing your story 📖✨</div>`
        : entries.map((e, i) => `
          <div class="glass p-5 journal-entry" style="border-color:${e.color || '#fb7185'};">
            <div class="flex items-start justify-between mb-2">
              <div>
                <div class="font-semibold">${e.title || 'Untitled'}</div>
                <div class="text-xs text-secondary">${new Date((e.date || today()) + 'T00:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</div>
              </div>
              <button class="text-xs text-secondary hover:opacity-100 opacity-60 j-delete" data-idx="${appData.journalEntries.length - 1 - i}">🗑</button>
            </div>
            <p class="text-sm text-secondary leading-relaxed">${e.body || ''}</p>
          </div>`).join('')}
    </div>
  </div>`;

  let selectedColor = '#fb7185';

  document.getElementById('journal-add').addEventListener('click', () => {
    document.getElementById('journal-form').classList.toggle('hidden');
    document.getElementById('jf-title').value = '';
    document.getElementById('jf-body').value  = '';
  });

  document.getElementById('jf-cancel').addEventListener('click', () => {
    document.getElementById('journal-form').classList.add('hidden');
  });

  document.getElementById('jf-colors').addEventListener('click', e => {
    const btn = e.target.closest('.jf-color-btn');
    if (!btn) return;
    document.querySelectorAll('.jf-color-btn').forEach(b => b.style.borderColor = 'transparent');
    btn.style.borderColor = '#fff';
    selectedColor = btn.dataset.color;
  });

  document.getElementById('jf-save').addEventListener('click', () => {
    const title = document.getElementById('jf-title').value.trim();
    const body  = document.getElementById('jf-body').value.trim();
    if (!body) { showToast('⚠️ Write something first!'); return; }
    appData.journalEntries.push({ date: today(), title, body, color: selectedColor });
    saveData(appData);
    showToast('📖 Journal entry saved!');
    renderJournal(appData);
  });

  el.querySelectorAll('.j-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      appData.journalEntries.splice(idx, 1);
      saveData(appData);
      showToast('🗑 Entry deleted');
      renderJournal(appData);
    });
  });
}
