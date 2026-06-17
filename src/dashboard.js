import { getPredictions, phaseInfo, getJumpPrediction, moodEmoji, flowEmoji, fmtDate, today } from './data.js';

export function renderDashboard(appData) {
  const el   = document.getElementById('page-dashboard');
  const pred = getPredictions(appData);
  const p    = appData.partnerName;

  if (!pred) {
    el.innerHTML = `<div class="text-center py-20 text-4xl">🌸<br><span class="text-lg mt-4 block text-secondary">Complete setup to see your dashboard</span></div>`;
    return;
  }

  const pi       = phaseInfo(pred.phase, p);
  const jump     = getJumpPrediction(pred.phase, p);
  const todayLog = appData.logs[today()] || {};

  el.innerHTML = `
  <div class="space-y-4">

    <!-- Greeting -->
    <div class="glass p-5">
      <p class="text-xs font-medium mb-1 text-secondary">
        ${new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}
      </p>
      <h2 class="font-serif text-2xl font-bold grad-pink mb-1">
        ${appData.userName ? `Hey ${appData.userName} 💕` : 'Hey gorgeous 💕'}
      </h2>
      <p class="text-sm text-secondary">Here's what your body is doing today</p>
    </div>

    <!-- Phase hero -->
    <div class="glass p-6 relative overflow-hidden" style="background:linear-gradient(135deg,${pi.color}22,${pi.color}10);">
      <div style="position:absolute;right:-20px;top:-20px;font-size:80px;opacity:.15;">${pi.emoji}</div>
      <div class="text-xs font-semibold uppercase tracking-widest mb-1" style="color:${pi.color};">Current Phase</div>
      <div class="font-serif text-3xl font-bold mb-1" style="color:${pi.color};">${pi.emoji} ${pi.label}</div>
      <div class="text-sm mb-3 text-secondary">Cycle Day <strong>${pred.cycleDay}</strong> of ${appData.cycleLength}</div>
      <p class="text-sm">${pi.desc}</p>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-2 gap-3">
      <div class="stat-card">
        <div class="text-2xl mb-1">${pred.daysUntilPeriod <= 0 ? '🩸' : '⏳'}</div>
        <div class="font-bold text-xl grad-pink">${pred.daysUntilPeriod <= 0 ? 'Now' : `${pred.daysUntilPeriod} days`}</div>
        <div class="text-xs mt-1 text-secondary">Next period</div>
        <div class="text-xs text-secondary">${fmtDate(pred.nextPeriod)}</div>
      </div>
      <div class="stat-card">
        <div class="text-2xl mb-1">🌟</div>
        <div class="font-bold text-xl grad-purple">${pred.daysUntilOvulation <= 0 ? 'Passed' : `${pred.daysUntilOvulation} days`}</div>
        <div class="text-xs mt-1 text-secondary">Ovulation</div>
        <div class="text-xs text-secondary">${fmtDate(pred.nextOvulation)}</div>
      </div>
    </div>

    <!-- Jump prediction -->
    <div class="glass p-4" style="border-color:rgba(251,113,133,.3);">
      <div class="text-xs font-semibold mb-1 grad-gold">🔮 ${p} Attraction Forecast</div>
      <div class="text-sm">${jump}</div>
    </div>

    <!-- Today's log -->
    <div class="glass p-5">
      <div class="flex items-center justify-between mb-3">
        <div class="font-semibold">Today's Log</div>
        <button class="btn-primary text-sm py-2 px-4" id="dash-quick-log">+ Quick Log</button>
      </div>
      ${todayLog.flow
        ? `<div class="flex flex-wrap gap-2">
            <span class="sym-chip active">Flow: ${todayLog.flow}</span>
            ${todayLog.mood ? `<span class="sym-chip active">${moodEmoji(todayLog.mood)} ${todayLog.mood}</span>` : ''}
            ${(todayLog.symptoms || []).slice(0, 3).map(s => `<span class="sym-chip">${s}</span>`).join('')}
            ${todayLog.intimate && todayLog.intimate !== 'no' ? '<span class="sym-chip active">💕 Intimate</span>' : ''}
           </div>
           ${todayLog.notes ? `<p class="text-xs mt-2 text-secondary">📝 ${todayLog.notes}</p>` : ''}`
        : `<p class="text-sm text-secondary">Nothing logged yet today — how are you feeling? 🌸</p>`
      }
    </div>

    <!-- Upcoming windows -->
    <div class="glass p-4">
      <div class="font-semibold text-sm mb-3">Upcoming Windows</div>
      <div class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span style="color:#2dd4bf;">🌿 Fertile window</span>
          <span class="text-xs text-secondary">${fmtDate(pred.fertileStart)} – ${fmtDate(pred.fertileEnd)}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span style="color:#fbbf24;">🌙 PMS starts</span>
          <span class="text-xs text-secondary">${fmtDate(pred.pmsStart)}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span style="color:#fb7185;">🩸 Next period</span>
          <span class="text-xs text-secondary">${fmtDate(pred.nextPeriod)}</span>
        </div>
      </div>
    </div>

  </div>`;

  document.getElementById('dash-quick-log')?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('open-daylog', { detail: { date: today() } }));
  });
}
