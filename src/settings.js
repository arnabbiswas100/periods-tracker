import { saveData } from './data.js';
import { showToast, launchConfetti } from './ui.js';

export function renderSettings(appData, onUpdate) {
  const el = document.getElementById('page-settings');
  el.innerHTML = `
  <div class="space-y-4">
    <h2 class="font-serif text-2xl font-bold grad-pink">Settings ⚙️</h2>

    <!-- Profile -->
    <div class="glass p-5">
      <div class="font-semibold mb-1">💖 Profile</div>
      <p class="text-sm text-secondary mb-1">You: <strong style="color:var(--text-primary)">Kaushiki Sen</strong></p>
      <p class="text-sm text-secondary">Partner: <strong style="color:#fb7185;">Arnab 💕</strong></p>
    </div>

    <!-- Cycle settings -->
    <div class="glass p-5">
      <div class="font-semibold mb-3">🩸 Cycle Settings</div>
      <div class="space-y-3">
        <div>
          <label class="label">Last period start date</label>
          <input id="st-last-period" type="date" class="field" value="${appData.lastPeriodStart || ''}" />
        </div>
        <div>
          <label class="label">Avg. cycle length: <span id="st-cycle-val">${appData.cycleLength}</span> days</label>
          <input id="st-cycle-len" type="range" min="21" max="45" value="${appData.cycleLength}" class="mt-2" />
        </div>
        <div>
          <label class="label">Avg. period duration: <span id="st-period-val">${appData.periodLength}</span> days</label>
          <input id="st-period-len" type="range" min="2" max="10" value="${appData.periodLength}" class="mt-2" />
        </div>
        <button id="st-save-cycle" class="btn-primary text-sm py-2 px-4">Save Cycle Settings</button>
      </div>
    </div>

    <!-- Appearance removed — dark only -->

    <!-- Reminders -->
    <div class="glass p-5">
      <div class="font-semibold mb-3">🔔 Reminders</div>
      <div class="space-y-2 text-sm text-secondary mb-3">
        <p>Enable browser notifications for period reminders, ovulation, and date nights with ${appData.partnerName}.</p>
      </div>
      <button id="st-notif" class="btn-secondary text-sm py-2 px-4">Enable Notifications</button>
    </div>

    <!-- Data management -->
    <div class="glass p-5">
      <div class="font-semibold mb-3">💾 Data Management</div>
      <div class="flex flex-wrap gap-3">
        <button id="st-export-json" class="btn-secondary text-sm py-2 px-3">⬇️ Export JSON</button>
        <button id="st-export-csv"  class="btn-secondary text-sm py-2 px-3">📊 Export CSV</button>
        <button id="st-import"      class="btn-secondary text-sm py-2 px-3">⬆️ Import JSON</button>
        <input id="st-import-file" type="file" accept=".json" class="hidden" />
      </div>
    </div>

    <!-- Danger zone -->
    <div class="glass p-5" style="border-color:rgba(244,63,94,.3);">
      <div class="font-semibold mb-3" style="color:#fb7185;">⚠️ Danger Zone</div>
      <button id="st-clear" class="btn-secondary text-sm py-2 px-4" style="border-color:rgba(244,63,94,.5);color:#fb7185;">Clear All Data</button>
    </div>

    <!-- Fun confetti test -->
    <div class="glass p-4 text-center">
      <p class="text-sm text-secondary mb-3">Celebrate something? 🎊</p>
      <button id="st-confetti" class="btn-primary py-2 px-6">Launch Confetti 🎉</button>
    </div>
  </div>`;

  // Sliders
  const cycleSlider  = document.getElementById('st-cycle-len');
  const periodSlider = document.getElementById('st-period-len');
  cycleSlider.addEventListener('input', () => document.getElementById('st-cycle-val').textContent  = cycleSlider.value);
  periodSlider.addEventListener('input', () => document.getElementById('st-period-val').textContent = periodSlider.value);

  // Save cycle
  document.getElementById('st-save-cycle').addEventListener('click', () => {
    appData.lastPeriodStart = document.getElementById('st-last-period').value;
    appData.cycleLength     = parseInt(cycleSlider.value);
    appData.periodLength    = parseInt(periodSlider.value);
    saveData(appData);
    showToast('🩸 Cycle settings saved!');
    if (onUpdate) onUpdate(appData);
  });

  // Notifications
  document.getElementById('st-notif').addEventListener('click', async () => {
    const perm = await Notification.requestPermission();
    showToast(perm === 'granted' ? '🔔 Notifications enabled!' : '❌ Permission denied');
  });

  // Export JSON
  document.getElementById('st-export-json').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(appData, null, 2)], { type:'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = 'lumina-flow-backup.json'; a.click();
    URL.revokeObjectURL(url);
  });

  // Export CSV
  document.getElementById('st-export-csv').addEventListener('click', () => {
    const rows = [['Date','Flow','Mood','Symptoms','Intimate','Note','Notes']];
    Object.entries(appData.logs).sort().forEach(([d, l]) => {
      rows.push([d, l.flow||'', l.mood||'', (l.symptoms||[]).join(';'), l.intimate||'', l.intimateNote||'', l.notes||'']);
    });
    const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = 'lumina-flow-logs.csv'; a.click();
    URL.revokeObjectURL(url);
  });

  // Import
  document.getElementById('st-import').addEventListener('click', () => document.getElementById('st-import-file').click());
  document.getElementById('st-import-file').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const imported = JSON.parse(ev.target.result);
        Object.assign(appData, imported);
        saveData(appData);
        showToast('✅ Data imported!');
        if (onUpdate) onUpdate(appData);
      } catch { showToast('❌ Invalid file'); }
    };
    reader.readAsText(file);
  });

  // Clear
  document.getElementById('st-clear').addEventListener('click', () => {
    if (!confirm('Delete ALL your data? This cannot be undone.')) return;
    localStorage.removeItem('luminaflow');
    location.reload();
  });

  // Confetti
  document.getElementById('st-confetti').addEventListener('click', launchConfetti);
}
