// ── Push Notification Module ─────────────────────────────────────────
// Uses Web Push API — no third-party service needed.
// Service worker (public/sw.js) handles the push events.

import { supabase, ensureAuth } from './supabase.js';
import { getPredictions, diffDays, today } from './data.js';

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC || '';

// ── Register service worker ────────────────────────────────────────
export async function registerSW() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[SW] Registered:', reg.scope);
    return reg;
  } catch (e) {
    console.warn('[SW] Registration failed:', e);
    return null;
  }
}

// ── Request notification permission ───────────────────────────────
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return await Notification.requestPermission();
}

// ── Subscribe to Web Push ─────────────────────────────────────────
export async function subscribeToPush(reg) {
  if (!reg || !VAPID_PUBLIC) return null;
  try {
    const existing = await reg.pushManager.getSubscription();
    if (existing) return existing;

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    });

    // Save subscription to Supabase so server can send push later
    if (supabase) {
      const user = await ensureAuth();
      if (user) {
        await supabase.from('push_subscriptions').upsert({
          user_id: user.id,
          subscription: JSON.stringify(sub),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      }
    }
    return sub;
  } catch (e) {
    console.warn('[Push] Subscribe failed:', e);
    return null;
  }
}

// ── Schedule local in-app notifications based on cycle ────────────
// These fire immediately as system notifications when the app is open.
export async function scheduleCycleNotifications(appData) {
  const perm = Notification.permission;
  if (perm !== 'granted') return;

  const pred = getPredictions(appData);
  if (!pred) return;

  const t = today();
  const msgs = [];

  // Today IS ovulation day
  if (pred.nextOvulation === t) {
    msgs.push({ title: 'Lumina Flow 🌟', body: `It's your ovulation day! Peak fertility & energy — and you're probably craving Arnab right now 🔥` });
  }

  // Period in 3 days
  if (pred.daysUntilPeriod === 3) {
    msgs.push({ title: 'Lumina Flow 🩸', body: 'Your period is coming in 3 days. Stock up on pads, chocolate, and Arnab cuddles 💕' });
  }

  // Period today
  if (pred.daysUntilPeriod <= 0 && pred.cycleDay === 1) {
    msgs.push({ title: 'Lumina Flow 🩸', body: "Your period may have started today! Don't forget to log it 💕" });
  }

  // PMS window
  if (t === pred.pmsStart) {
    msgs.push({ title: 'Lumina Flow 🌙', body: 'PMS season begins — be gentle with yourself. Arnab hugs > everything 💛' });
  }

  // Fertile window start
  if (t === pred.fertileStart) {
    msgs.push({ title: 'Lumina Flow 🌿', body: 'Your fertile window starts today. High attraction, high energy — use it! 💚' });
  }

  // Show each notification with a small delay between them
  const reg = await navigator.serviceWorker.ready;
  msgs.forEach((m, i) => {
    setTimeout(() => {
      reg.showNotification(m.title, {
        body: m.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
      });
    }, i * 2000);
  });
}

// ── Helper ────────────────────────────────────────────────────────
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}
