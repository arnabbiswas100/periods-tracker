// ─── Confetti ─────────────────────────────────────────────────────
export function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors  = ['#fb7185', '#a78bfa', '#2dd4bf', '#fbbf24', '#e879f9'];
  const pieces  = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    r: Math.random() * 6 + 3,
    d: Math.random() * 120,
    color: colors[Math.floor(Math.random() * colors.length)],
    tilt: Math.random() * 10 - 10,
    tiltAngleIncrement: Math.random() * 0.07 + 0.05,
    tiltAngle: 0,
  }));
  let angle = 0;
  let frame;
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    angle += 0.01;
    pieces.forEach(p => {
      p.tiltAngle += p.tiltAngleIncrement;
      p.y += (Math.cos(angle + p.d) + 1.5) * 2;
      p.x += Math.sin(angle) * 1.5;
      p.tilt = Math.sin(p.tiltAngle) * 12;
      ctx.beginPath();
      ctx.lineWidth   = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
      ctx.stroke();
      if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
    });
    frame = requestAnimationFrame(draw);
  };
  draw();
  setTimeout(() => { cancelAnimationFrame(frame); ctx.clearRect(0, 0, canvas.width, canvas.height); }, 3500);
}

// ─── Toast ────────────────────────────────────────────────────────
export function showToast(msg, duration = 5000) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration);
}

// ─── Theme ────────────────────────────────────────────────────────
export function applyTheme(t) {
  document.body.classList.toggle('light-mode', t === 'light');
  document.documentElement.classList.toggle('dark', t !== 'light');
  document.getElementById('theme-btn').textContent = t === 'dark' ? '🌙' : '☀️';
}

// ─── Streak ───────────────────────────────────────────────────────
import { today, addDays } from './data.js';
import { saveData } from './data.js';

export function updateStreak(appData, onMilestone) {
  const t = today();
  if (appData.lastLogDate === t) return appData;
  if (appData.lastLogDate === addDays(t, -1)) {
    appData.streak = (appData.streak || 0) + 1;
  } else {
    appData.streak = 1;
  }
  appData.lastLogDate = t;
  saveData(appData);
  document.getElementById('streak-badge').textContent = appData.streak;
  if (appData.streak > 0 && appData.streak % 7 === 0 && onMilestone) {
    onMilestone(appData.streak);
  }
  return appData;
}
