import { getPredictions, addDays, diffDays, today } from './data.js';

let currentYear, currentMonth;

export function renderCalendar(appData) {
  const el = document.getElementById('page-calendar');
  const now = new Date();
  if (!currentYear)  currentYear  = now.getFullYear();
  if (!currentMonth) currentMonth = now.getMonth();

  el.innerHTML = `
  <div class="space-y-4">
    <h2 class="font-serif text-2xl font-bold grad-pink">Calendar 📅</h2>

    <!-- Legend -->
    <div class="glass p-3 flex flex-wrap gap-3 text-xs">
      <span><span class="inline-block w-3 h-3 rounded-sm mr-1" style="background:rgba(244,63,94,.5);"></span>Period</span>
      <span><span class="inline-block w-3 h-3 rounded-sm mr-1" style="background:rgba(244,63,94,.15);border:1px dashed rgba(244,63,94,.5);"></span>Predicted</span>
      <span><span class="inline-block w-3 h-3 rounded-sm mr-1" style="background:rgba(45,212,191,.4);"></span>Ovulation</span>
      <span><span class="inline-block w-3 h-3 rounded-sm mr-1" style="background:rgba(45,212,191,.15);"></span>Fertile</span>
      <span>💕 Intimate day</span>
    </div>

    <!-- Month nav -->
    <div class="glass p-4">
      <div class="flex items-center justify-between mb-4">
        <button id="cal-prev" class="btn-secondary py-1 px-3 text-sm">← Prev</button>
        <div class="font-semibold" id="cal-month-label"></div>
        <button id="cal-next" class="btn-secondary py-1 px-3 text-sm">Next →</button>
      </div>
      <!-- Weekday headers -->
      <div class="grid grid-cols-7 gap-1 mb-2">
        ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div class="text-center text-xs font-medium text-secondary py-1">${d}</div>`).join('')}
      </div>
      <!-- Calendar grid -->
      <div class="grid grid-cols-7 gap-1" id="cal-grid"></div>
    </div>

    <!-- Tap info -->
    <div id="cal-day-detail" class="glass p-4 hidden">
      <div class="font-semibold mb-2" id="cal-detail-date"></div>
      <div id="cal-detail-body" class="text-sm text-secondary"></div>
    </div>
  </div>`;

  document.getElementById('cal-prev').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    buildCalGrid(appData);
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    buildCalGrid(appData);
  });

  buildCalGrid(appData);
}

function buildCalGrid(appData) {
  const pred = getPredictions(appData);
  const t    = today();

  // Build set of classified dates
  const dateClasses = {};
  const addClass    = (d, cls) => { if (!dateClasses[d]) dateClasses[d] = new Set(); dateClasses[d].add(cls); };

  // Actual period logs
  Object.entries(appData.logs).forEach(([d, log]) => {
    if (log.flow && log.flow !== 'none') addClass(d, 'period');
    if (log.intimate && log.intimate !== 'no') addClass(d, 'intimate');
  });

  // Predictions
  if (pred) {
    // Fertile window
    let d = pred.fertileStart;
    while (d <= pred.fertileEnd) { addClass(d, 'fertile'); d = addDays(d, 1); }
    addClass(pred.nextOvulation, 'ovulation');

    // Predicted next period
    for (let i = 0; i < appData.periodLength; i++) {
      addClass(addDays(pred.nextPeriod, i), 'predicted');
    }
  }

  // Build grid
  const year = currentYear, month = currentMonth;
  const label = new Date(year, month, 1).toLocaleDateString('en-IN', { month:'long', year:'numeric' });
  document.getElementById('cal-month-label').textContent = label;

  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = '';
  for (let i = 0; i < firstDay; i++) html += `<div class="cal-day empty"></div>`;
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const classes = dateClasses[dateStr] || new Set();
    const cls     = [...classes].join(' ');
    const isToday = dateStr === t;
    html += `<div class="cal-day ${cls} ${isToday ? 'today' : ''}" data-date="${dateStr}">${day}</div>`;
  }

  const grid = document.getElementById('cal-grid');
  grid.innerHTML = html;

  grid.querySelectorAll('.cal-day:not(.empty)').forEach(cell => {
    cell.addEventListener('click', () => showDayDetail(cell.dataset.date, appData));
    cell.addEventListener('dblclick', () => {
      document.dispatchEvent(new CustomEvent('open-daylog', { detail: { date: cell.dataset.date } }));
    });
  });
}

function showDayDetail(dateStr, appData) {
  const box  = document.getElementById('cal-day-detail');
  const log  = appData.logs[dateStr];
  const dateLabel = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' });
  document.getElementById('cal-detail-date').textContent = dateLabel;

  if (!log) {
    document.getElementById('cal-detail-body').innerHTML = `<p>No data for this day. <button class="btn-primary text-xs py-1 px-3 ml-2" id="cal-log-btn">Log it</button></p>`;
    document.getElementById('cal-log-btn')?.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('open-daylog', { detail: { date: dateStr } }));
    });
  } else {
    document.getElementById('cal-detail-body').innerHTML = `
      <div class="space-y-1">
        ${log.flow ? `<div>Flow: <strong>${log.flow}</strong></div>` : ''}
        ${log.mood ? `<div>Mood: <strong>${log.mood}</strong></div>` : ''}
        ${log.symptoms?.length ? `<div>Symptoms: ${log.symptoms.join(', ')}</div>` : ''}
        ${log.intimate && log.intimate !== 'no' ? `<div>💕 Intimate ${log.intimate === 'during' ? '(during period)' : ''} ${log.intimateNote ? `— "${log.intimateNote}"` : ''}</div>` : ''}
        ${log.notes ? `<div>📝 ${log.notes}</div>` : ''}
        <button class="btn-secondary text-xs py-1 px-3 mt-2" id="cal-edit-btn">Edit this day</button>
      </div>`;
    document.getElementById('cal-edit-btn')?.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('open-daylog', { detail: { date: dateStr } }));
    });
  }
  box.classList.remove('hidden');
}
