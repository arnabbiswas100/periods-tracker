import './style.css';

import { loadData, saveData, today }   from './data.js';
import { showToast, updateStreak }     from './ui.js';
import { renderDashboard }             from './dashboard.js';
import { renderLogPage }               from './logPage.js';
import { renderCalendar }              from './calendar.js';
import { renderInsights }              from './insights.js';
import { renderJournal }               from './journal.js';
import { renderSettings }              from './settings.js';
import { initDayLogModal, updateAppData } from './daylog.js';
import { cloudLoad, cloudSave, isSupabaseReady } from './supabase.js';
import { registerSW, requestNotificationPermission, subscribeToPush, scheduleCycleNotifications } from './notifications.js';

// ── App state ─────────────────────────────────────────────────────
let appData = loadData();
let currentPage = 'dashboard';
let swReg = null;

// ── Shared save: localStorage + Supabase ──────────────────────────
export function persistData(data) {
  saveData(data);
  cloudSave(data).catch(() => {}); // fire-and-forget, non-blocking
}

// ── Re-render after any data change ───────────────────────────────
function onDataChanged(newData) {
  appData = newData;
  updateAppData(appData);
  persistData(appData);
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
  const todayInput = document.getElementById('ob-last-period');
  if (todayInput && !todayInput.value) {
    const d = new Date(); d.setDate(d.getDate() - 3);
    todayInput.value = d.toISOString().split('T')[0];
  }
  document.getElementById('onboarding-overlay').classList.remove('hidden');
}

async function completeOnboarding() {
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
  persistData(appData);
  appData = updateStreak(appData);
  updateAppData(appData);
  renderDashboard(appData);
  showToast('🌸 Welcome, Kaushiki! 💕');

  // Ask for notifications after onboarding
  setTimeout(() => askForNotifications(), 3000);
}

// ── Notifications prompt ──────────────────────────────────────────
async function askForNotifications() {
  if (!swReg || Notification.permission !== 'default') return;
  showToast('💌 Enable notifications to get period reminders!', 6000);
  setTimeout(async () => {
    const perm = await requestNotificationPermission();
    if (perm === 'granted') {
      await subscribeToPush(swReg);
      await scheduleCycleNotifications(appData);
      showToast('🔔 Notifications on! We\'ll remind you about your cycle 💕');
    }
  }, 2000);
}

// ── Boot ──────────────────────────────────────────────────────────
async function boot() {
  // 1. Register service worker first (PWA + push)
  swReg = await registerSW();

  // 2. Try loading cloud data if Supabase is configured
  if (isSupabaseReady()) {
    const cloud = await cloudLoad();
    if (cloud && cloud.onboarded) {
      // Cloud data takes priority — merge into localStorage
      appData = { ...appData, ...cloud };
      saveData(appData);
    }
  }

  // 3. Wire up nav
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.page));
  });

  // 4. Onboarding submit
  document.getElementById('ob-submit').addEventListener('click', completeOnboarding);

  // 5. Day log modal
  initDayLogModal(appData, onDataChanged);

  // 6. Boot into app or onboarding
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

    // Schedule today's cycle notifications (non-blocking)
    if (swReg) scheduleCycleNotifications(appData).catch(() => {});

    // If notifications not yet asked, gently prompt after 5s
    setTimeout(() => askForNotifications(), 5000);
  } else {
    showOnboarding();
  }
}

document.addEventListener('DOMContentLoaded', boot);
