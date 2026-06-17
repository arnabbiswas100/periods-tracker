// ─── Data shape ───────────────────────────────────────────────────
const DEFAULT_DATA = {
  userName: 'Kaushiki Sen',
  partnerName: 'Arnab', // hardcoded
  cycleLength: 28,
  periodLength: 5,
  lastPeriodStart: null,
  logs: {},           // { 'YYYY-MM-DD': LogEntry }
  cycles: [],         // [{ start, end, length }]
  reminders: [],
  journalEntries: [], // [{ date, title, body, color }]
  theme: 'dark',
  onboarded: false,
  streak: 0,
  lastLogDate: null,
};

/** Load from localStorage, fall back to defaults */
export function loadData() {
  try {
    const raw = localStorage.getItem('luminaflow');
    return raw ? { ...DEFAULT_DATA, ...JSON.parse(raw) } : structuredClone(DEFAULT_DATA);
  } catch {
    return structuredClone(DEFAULT_DATA);
  }
}

/** Persist to localStorage */
export function saveData(data) {
  localStorage.setItem('luminaflow', JSON.stringify(data));
}

/** No sample data — Kaushiki starts fresh */
export function seedSampleData(data) {
  return data;
}

// ─── Date helpers ─────────────────────────────────────────────────
export function today() {
  return new Date().toISOString().split('T')[0];
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export function diffDays(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86_400_000);
}

export function fmtDate(d) {
  if (!d) return '—';
  const [y, m, dd] = d.split('-');
  return `${dd}/${m}/${y}`;
}

export function fmtDateLong(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
}

// ─── Cycle helpers ────────────────────────────────────────────────
export function getPhase(cycleDay, periodLen) {
  if (cycleDay <= periodLen) return 'menstrual';
  if (cycleDay <= 13)        return 'follicular';
  if (cycleDay <= 16)        return 'ovulation';
  return 'luteal';
}

export function phaseInfo(phase, partner = 'Arnab') {
  return {
    menstrual:  { label:'Menstrual',  emoji:'🩸', color:'#fb7185', desc:`Rest & restore. ${partner} cuddles are perfect right now! 🫂` },
    follicular: { label:'Follicular', emoji:'🌱', color:'#a78bfa', desc:'Energy rising, feeling fresh and social! ✨' },
    ovulation:  { label:'Ovulation',  emoji:'🌟', color:'#2dd4bf', desc:`Peak energy! You might be extra attracted to ${partner} right now 🔥` },
    luteal:     { label:'Luteal',     emoji:'🌙', color:'#fbbf24', desc:`PMS territory — be kind to yourself. ${partner} hugs help! 💛` },
  }[phase] || { label:'Follicular', emoji:'🌱', color:'#a78bfa', desc:'Energy rising! ✨' };
}

/**
 * Smart predictions — uses actual log history to:
 * - Find real last period start from logged flow data
 * - Calculate average cycle length from historical cycles
 * - Adjust period length from logged flow days
 */
export function getPredictions(data) {
  // Find most recent day with period flow logged
  const flowDays = Object.entries(data.logs)
    .filter(([, l]) => l.flow && l.flow !== 'none')
    .map(([d]) => d)
    .sort();

  // Detect cycle starts: a flow day with no flow the day before
  const cycleStarts = flowDays.filter((d, i) => {
    if (i === 0) return true;
    return diffDays(flowDays[i - 1], d) > 2; // gap > 2 days = new cycle
  });

  // Use detected start or fall back to user-provided
  const last = cycleStarts.length > 0
    ? cycleStarts[cycleStarts.length - 1]
    : data.lastPeriodStart;

  if (!last) return null;

  // Calculate smart avg cycle length from history
  let cl = data.cycleLength;
  if (cycleStarts.length >= 2) {
    const lengths = [];
    for (let i = 1; i < cycleStarts.length; i++) {
      lengths.push(diffDays(cycleStarts[i - 1], cycleStarts[i]));
    }
    const avg = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
    if (avg >= 21 && avg <= 45) cl = avg; // sanity check
  }

  // Calculate smart period length from logged flow streak
  let pl = data.periodLength;
  if (cycleStarts.length > 0) {
    const lastStart = cycleStarts[cycleStarts.length - 1];
    let streak = 0;
    for (let i = 0; i <= 12; i++) {
      const d = addDays(lastStart, i);
      if (data.logs[d]?.flow && data.logs[d].flow !== 'none') streak++;
      else if (i > 0) break;
    }
    if (streak > 0) pl = streak;
  }

  const t               = today();
  const nextPeriod      = addDays(last, cl);
  const nextOvulation   = addDays(last, cl - 14);
  const fertileStart    = addDays(nextOvulation, -3);
  const fertileEnd      = addDays(nextOvulation, 1);
  const pmsStart        = addDays(nextPeriod, -5);
  const cycleDay        = Math.max(1, diffDays(last, t) + 1);
  const daysUntilPeriod = diffDays(t, nextPeriod);
  const daysUntilOvulation = diffDays(t, nextOvulation);
  const phase = getPhase(cycleDay, pl);

  return { nextPeriod, nextOvulation, fertileStart, fertileEnd, pmsStart,
           cycleDay, daysUntilPeriod, daysUntilOvulation, phase, cl, pl,
           detectedCycles: cycleStarts.length };
}

export function getJumpPrediction(phase, partner = 'Arnab') {
  if (phase === 'ovulation')  return `🔥 HIGH chance of jumping ${partner} today — peak desire!`;
  if (phase === 'follicular') return `💕 Moderate — energy up, attraction building for ${partner}`;
  if (phase === 'luteal')     return `🌙 Low-ish — you might just want ${partner}'s cuddles instead`;
  return `🩸 Period phase — comfort from ${partner} > everything else`;
}

// ─── Emoji helpers ────────────────────────────────────────────────
export function moodEmoji(m) {
  return { happy:'😊', lovey:'🥰', irritable:'😤', sad:'😢', anxious:'😰', energetic:'⚡', calm:'🧘', horny:'🔥' }[m] || '💭';
}

export function flowEmoji(f) {
  return { spotting:'🔴', light:'💧', medium:'🌊', heavy:'🌊🌊', none:'🌙' }[f] || '🌙';
}
