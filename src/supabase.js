import { createClient } from '@supabase/supabase-js';

// ── These come from environment variables ─────────────────────────
// In dev: create a .env.local file with these values
// In Render: set them in the Environment Variables section
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || '';
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON || '';

export const supabase = SUPABASE_URL && SUPABASE_ANON
  ? createClient(SUPABASE_URL, SUPABASE_ANON)
  : null;

export const isSupabaseReady = () => !!supabase;

// ── Anonymous auth — no email/password needed ─────────────────────
// Supabase creates a real JWT session so RLS policies work properly
export async function ensureAuth() {
  if (!supabase) return null;

  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session.user;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) { console.warn('[Supabase] Auth error:', error.message); return null; }
  return data.user;
}

// ── Save full app state to Supabase ───────────────────────────────
export async function cloudSave(appData) {
  if (!supabase) return;
  const user = await ensureAuth();
  if (!user) return;

  // Upsert settings row
  await supabase.from('user_settings').upsert({
    user_id: user.id,
    last_period_start: appData.lastPeriodStart,
    cycle_length: appData.cycleLength,
    period_length: appData.periodLength,
    streak: appData.streak || 0,
    last_log_date: appData.lastLogDate,
    onboarded: appData.onboarded,
  }, { onConflict: 'user_id' });

  // Upsert all log entries in one batch
  const logRows = Object.entries(appData.logs).map(([date, log]) => ({
    user_id: user.id, date,
    flow: log.flow, mood: log.mood,
    symptoms: log.symptoms || [],
    intimate: log.intimate, intimate_note: log.intimateNote,
    notes: log.notes,
  }));
  if (logRows.length) await supabase.from('cycle_logs').upsert(logRows, { onConflict: 'user_id,date' });

  // Upsert journal entries
  const jRows = (appData.journalEntries || []).map((e, i) => ({
    user_id: user.id,
    sort_order: i,
    date: e.date, title: e.title, body: e.body, color: e.color,
  }));
  if (jRows.length) await supabase.from('journal_entries').upsert(jRows, { onConflict: 'user_id,sort_order' });
}

// ── Load full app state from Supabase ─────────────────────────────
export async function cloudLoad() {
  if (!supabase) return null;
  const user = await ensureAuth();
  if (!user) return null;

  const [settingsRes, logsRes, journalRes] = await Promise.all([
    supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
    supabase.from('cycle_logs').select('*').eq('user_id', user.id),
    supabase.from('journal_entries').select('*').eq('user_id', user.id).order('sort_order'),
  ]);

  if (settingsRes.error && settingsRes.error.code !== 'PGRST116') {
    console.warn('[Supabase] Load error:', settingsRes.error.message);
    return null;
  }

  const s = settingsRes.data;
  const logs = {};
  (logsRes.data || []).forEach(r => {
    logs[r.date] = {
      flow: r.flow, mood: r.mood, symptoms: r.symptoms || [],
      intimate: r.intimate, intimateNote: r.intimate_note, notes: r.notes,
    };
  });

  return {
    lastPeriodStart: s?.last_period_start || null,
    cycleLength:     s?.cycle_length     || 28,
    periodLength:    s?.period_length    || 5,
    streak:          s?.streak           || 0,
    lastLogDate:     s?.last_log_date    || null,
    onboarded:       s?.onboarded        || false,
    logs,
    journalEntries: (journalRes.data || []).map(r => ({
      date: r.date, title: r.title, body: r.body, color: r.color,
    })),
  };
}
