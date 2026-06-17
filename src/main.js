import './style.css';

import { loadData, saveData, seedSampleData, today } from './data.js';
import { showToast, updateStreak } from './ui.js';
import { renderDashboard } from './dashboard.js';
import { renderLogPage }   from './logPage.js';
import { renderCalendar }  from './calendar.js';
import { renderInsights }  from './insights.js';
import { renderJournal }   from './journal.js';
import { renderSettings }  from './settings.js';
import { initDayLogModal, updateAppData } from './daylog.js';

// ── App state ─────────────────────────────────────────────────────
let appData = loadData();
let currentPage = 'dashboard';

// ── Shared re-render after any data change ─────────────────────────
function onDataChanged(newData) {
  appData = newData;
  updateAppData(appData);
  if (currentPage === 'dashboard') renderDashboard(appData);
  if (currentPage === 'log')       renderLogPage(appData);
  if (currentPage === 'calendar')  renderCalendar(appData);
  if (currentPage === 'insights')  renderInsights(appData);
  if (currentPage === 'journal')   renderJournal(appData);
  if (currentPage === 'settings')  renderSettings(appData, onDataChanged);
}

// ── Navigation ────────────────────────────────────────────────────
function navigate(page) {
  currentPage = page;

  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  document.getElementById('page-' + page)?.classList.add('active');

  if (page === 'dashboard') renderDashboard(appData);
  if (page === 'log')       renderLogPage(appData);
  if (page === 'calendar')  renderCalendar(appData);
  if (page === 'insights')  renderInsights(appData);
  if (page === 'journal')   renderJournal(appData);
  if (page === 'settings')  renderSettings(appData, onDataChanged);
}

// ── Onboarding ────────────────────────────────────────────────────
function showOnboarding() {
  // Pre-fill today's date as a hint
  const todayInput = document.getElementById('ob-last-period');
  if (todayInput && !todayInput.value) {
    const d = new Date(); d.setDate(d.getDate() - 3);
    todayInput.value = d.toISOString().split('T')[0];
  }
  document.getElementById('onboarding-overlay').classList.remove('hidden');
}

function completeOnboarding() {
  const last = document.getElementById('ob-last-period').value;
  const cl   = parseInt(document.getElementById('ob-cycle-len').value) || 28;
  const pl   = parseInt(document.getElementById('ob-period-len').value) || 5;

  if (!last) { showToast('⚠️ Please enter your last period start date'); return; }

  appData.userName        = 'Kaushiki Sen';
  appData.partnerName     = 'Arnab';
  appData.lastPeriodStart = last;
  appData.cycleLength     = cl;
  appData.periodLength    = pl;
  appData.onboarded       = true;

  document.getElementById('onboarding-overlay').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  saveData(appData);
  appData = updateStreak(appData);
  updateAppData(appData);
  renderDashboard(appData);
  showToast('🌸 Welcome, Kaushiki! 💕');
}

// ── Boot ──────────────────────────────────────────────────────────
function boot() {
  // Always dark mode

  // Nav buttons
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.page));
  });

  // Onboarding submit
  document.getElementById('ob-submit').addEventListener('click', completeOnboarding);

  // Day log modal (initialise once)
  initDayLogModal(appData, onDataChanged);

  if (appData.onboarded) {
    document.getElementById('app').classList.remove('hidden');
    appData = updateStreak(appData, streak => {
      import('./ui.js').then(({ launchConfetti }) => {
        launchConfetti();
        showToast(`🔥 ${streak}-day streak! You're on fire!`);
      });
    });
    document.getElementById('streak-badge').textContent = appData.streak || 0;
    renderDashboard(appData);
  } else {
    showOnboarding();
  }
}

document.addEventListener('DOMContentLoaded', boot);
