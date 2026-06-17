import Chart from 'chart.js/auto';

const chartInstances = {};

function destroyChart(id) {
  if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; }
}

export function renderInsights(appData) {
  const el = document.getElementById('page-insights');
  const p  = appData.partnerName;
  const logs = Object.values(appData.logs);

  // Stat counts
  const total     = logs.length;
  const intimate  = logs.filter(l => l.intimate && l.intimate !== 'no').length;
  const during    = logs.filter(l => l.intimate === 'during').length;
  const horny     = logs.filter(l => (l.symptoms || []).includes('horny-arnab')).length;
  const craving   = logs.filter(l => (l.symptoms || []).includes('crave-arnab')).length;
  const avgCycle  = appData.cycleLength;

  el.innerHTML = `
  <div class="space-y-4">
    <h2 class="font-serif text-2xl font-bold grad-pink">Insights 📊</h2>

    <!-- Headline stats -->
    <div class="grid grid-cols-2 gap-3">
      <div class="stat-card"><div class="text-xl mb-1">📆</div><div class="font-bold grad-pink">${avgCycle} days</div><div class="text-xs mt-1 text-secondary">Avg. cycle</div></div>
      <div class="stat-card"><div class="text-xl mb-1">📝</div><div class="font-bold grad-purple">${total}</div><div class="text-xs mt-1 text-secondary">Days logged</div></div>
      <div class="stat-card"><div class="text-xl mb-1">💕</div><div class="font-bold" style="color:#fb7185;">${intimate}</div><div class="text-xs mt-1 text-secondary">Intimate days with ${p}</div></div>
      <div class="stat-card"><div class="text-xl mb-1">🔥</div><div class="font-bold" style="color:#fbbf24;">${horny}</div><div class="text-xs mt-1 text-secondary">Times super horny for ${p}</div></div>
    </div>

    <!-- Fun facts -->
    <div class="glass p-4" style="border-color:rgba(251,113,133,.3);">
      <div class="font-semibold mb-2 grad-gold">💕 ${p} Stats</div>
      <div class="space-y-2 text-sm text-secondary">
        <div>🩸💕 Period intimacy count: <strong style="color:#fb7185;">${during}</strong></div>
        <div>🔥 Days craving ${p}'s touch: <strong style="color:#e879f9;">${craving}</strong></div>
        <div>💕 Total intimate moments: <strong style="color:#a78bfa;">${intimate}</strong></div>
      </div>
    </div>

    <!-- Mood chart -->
    <div class="glass p-4">
      <div class="font-semibold mb-3">Mood Distribution</div>
      <div class="chart-box"><canvas id="chart-mood"></canvas></div>
    </div>

    <!-- Symptom chart -->
    <div class="glass p-4">
      <div class="font-semibold mb-3">Top Symptoms</div>
      <div class="chart-box"><canvas id="chart-symptoms"></canvas></div>
    </div>

    <!-- Flow chart -->
    <div class="glass p-4">
      <div class="font-semibold mb-3">Flow Intensity History</div>
      <div class="chart-box"><canvas id="chart-flow"></canvas></div>
    </div>
  </div>`;

  // Small delay to ensure DOM is ready
  requestAnimationFrame(() => buildCharts(logs, p));
}

function buildCharts(logs, partner) {
  const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#c4b5d4', font: { family: 'Inter', size: 11 } } } },
  };

  // ── Mood pie ──────────────────────────────────────────────────
  destroyChart('mood');
  const moodCounts = {};
  logs.forEach(l => { if (l.mood) moodCounts[l.mood] = (moodCounts[l.mood] || 0) + 1; });
  const moodLabels = Object.keys(moodCounts);
  const moodColors = ['#fb7185','#a78bfa','#2dd4bf','#fbbf24','#e879f9','#60a5fa','#34d399','#f97316'];
  if (moodLabels.length) {
    chartInstances.mood = new Chart(document.getElementById('chart-mood'), {
      type: 'doughnut',
      data: {
        labels: moodLabels,
        datasets: [{ data: moodLabels.map(m => moodCounts[m]), backgroundColor: moodColors, borderWidth: 0 }],
      },
      options: { ...chartDefaults, cutout: '65%' },
    });
  }

  // ── Symptom bar ───────────────────────────────────────────────
  destroyChart('symptoms');
  const symCounts = {};
  logs.forEach(l => (l.symptoms || []).forEach(s => { symCounts[s] = (symCounts[s] || 0) + 1; }));
  const symEntries = Object.entries(symCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (symEntries.length) {
    chartInstances.symptoms = new Chart(document.getElementById('chart-symptoms'), {
      type: 'bar',
      data: {
        labels: symEntries.map(([s]) => s.replace('-arnab', ` (${partner})`).replace(/-/g,' ')),
        datasets: [{
          data: symEntries.map(([, c]) => c),
          backgroundColor: 'rgba(167,139,250,.5)',
          borderColor: '#a78bfa',
          borderWidth: 1,
          borderRadius: 6,
        }],
      },
      options: {
        ...chartDefaults,
        scales: {
          x: { ticks: { color:'#c4b5d4', font:{ size:9 } }, grid:{ color:'rgba(255,255,255,.05)' } },
          y: { ticks: { color:'#c4b5d4' }, grid:{ color:'rgba(255,255,255,.05)' }, beginAtZero:true },
        },
        plugins: { legend: { display: false } },
      },
    });
  }

  // ── Flow line chart ───────────────────────────────────────────
  destroyChart('flow');
  const flowMap = { none:0, spotting:1, light:2, medium:3, heavy:4 };
  const flowEntries = Object.entries({})
    .concat(Object.entries(
      Object.fromEntries(
        Object.entries(
          logs.reduce((acc, l, i) => { acc[i] = l; return acc; }, {})
        ).filter(([, l]) => l.flow && l.flow !== 'none')
      )
    ));

  // Simpler: collect last 20 flow-logged days
  const flowDays = Object.entries(
    Object.fromEntries(
      Object.entries(
        // build from appData.logs directly; we get logs array so rebuild with index as key
        {}
      )
    )
  );

  // Direct approach using the raw logs param
  const flowData = logs
    .filter(l => l.flow && l.flow !== 'none')
    .slice(-14)
    .map((l, i) => ({ x: `Day ${i + 1}`, y: flowMap[l.flow] || 0 }));

  if (flowData.length) {
    chartInstances.flow = new Chart(document.getElementById('chart-flow'), {
      type: 'line',
      data: {
        labels: flowData.map(d => d.x),
        datasets: [{
          label: 'Flow',
          data: flowData.map(d => d.y),
          borderColor: '#fb7185',
          backgroundColor: 'rgba(251,113,133,.15)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#fb7185',
          pointRadius: 4,
        }],
      },
      options: {
        ...chartDefaults,
        scales: {
          x: { ticks: { color:'#c4b5d4', font:{ size:10 } }, grid:{ color:'rgba(255,255,255,.05)' } },
          y: { ticks: { color:'#c4b5d4', callback: v => ['—','Spotting','Light','Medium','Heavy'][v] || '' }, grid:{ color:'rgba(255,255,255,.05)' }, min:0, max:4 },
        },
      },
    });
  }
}
