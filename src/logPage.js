import { today, fmtDateLong, flowEmoji, moodEmoji } from './data.js';

export function renderLogPage(appData) {
  const el   = document.getElementById('page-log');
  const logs = Object.entries(appData.logs)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 30);

  const intimateDuring = Object.values(appData.logs).filter(l => l.intimate === 'during').length;
  const intimateTotal  = Object.values(appData.logs).filter(l => l.intimate && l.intimate !== 'no').length;
  const hornyDays      = Object.values(appData.logs).filter(l => (l.symptoms || []).includes('horny-arnab')).length;

  el.innerHTML = `
  <div class="space-y-4">

    <div class="flex items-center justify-between">
      <h2 class="font-serif text-2xl font-bold grad-pink">Cycle Log 📝</h2>
      <button id="log-add-btn" class="btn-primary text-sm py-2 px-4">+ Log Today</button>
    </div>

    <div class="grid grid-cols-3 gap-2">
      <div class="stat-card text-center">
        <div class="text-xl">💕</div>
        <div class="font-bold grad-pink">${intimateTotal}</div>
        <div class="text-xs mt-1 text-secondary">Intimate days</div>
      </div>
      <div class="stat-card text-center">
        <div class="text-xl">🩸💕</div>
        <div class="font-bold" style="color:#fb7185;">${intimateDuring}</div>
        <div class="text-xs mt-1 text-secondary">Period intimacy</div>
      </div>
      <div class="stat-card text-center">
        <div class="text-xl">🔥</div>
        <div class="font-bold" style="color:#fbbf24;">${hornyDays}</div>
        <div class="text-xs mt-1 text-secondary">Horny days</div>
      </div>
    </div>

    <div class="glass p-4">
      <div class="font-semibold mb-3">Recent Entries</div>
      ${logs.length === 0
        ? `<p class="text-sm text-secondary">No entries yet — tap + Log Today! 🌸</p>`
        : logs.map(([date, log]) => `
          <div class="flex items-start gap-3 py-3 border-b cursor-pointer hover:opacity-80 transition-opacity log-row"
               style="border-color:var(--glass-border);" data-date="${date}">
            <div class="text-center min-w-[44px]">
              <div class="text-xs font-bold text-secondary">
                ${new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { month:'short' })}
              </div>
              <div class="text-xl font-bold">${new Date(date + 'T00:00:00').getDate()}</div>
            </div>
            <div class="flex-1">
              <div class="flex flex-wrap gap-1 mb-1">
                ${log.flow && log.flow !== 'none' ? `<span class="sym-chip active" style="padding:2px 8px;font-size:.75rem;">${flowEmoji(log.flow)} ${log.flow}</span>` : ''}
                ${log.mood ? `<span class="sym-chip" style="padding:2px 8px;font-size:.75rem;">${moodEmoji(log.mood)} ${log.mood}</span>` : ''}
                ${log.intimate && log.intimate !== 'no' ? `<span class="sym-chip" style="padding:2px 8px;font-size:.75rem;border-color:rgba(251,113,133,.5);">💕 ${log.intimate === 'during' ? 'Period intimacy' : 'Intimate'}</span>` : ''}
              </div>
              ${log.intimateNote ? `<p class="text-xs mb-1" style="color:#e879f9;">💕 "${log.intimateNote}"</p>` : ''}
              ${log.notes ? `<p class="text-xs text-secondary">${log.notes}</p>` : ''}
            </div>
          </div>`).join('')}
    </div>
  </div>`;

  document.getElementById('log-add-btn')?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('open-daylog', { detail: { date: today() } }));
  });

  el.querySelectorAll('.log-row').forEach(row => {
    row.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('open-daylog', { detail: { date: row.dataset.date } }));
    });
  });
}
