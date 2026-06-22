const webpush = require('web-push');

const VAPID_PUBLIC = process.env.VAPID_PUBLIC;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE;
const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL;
const SYNC_KEY = process.env.FIREBASE_SYNC_KEY;

const IDLE_THRESHOLD_MS = 8 * 60 * 60 * 1000; // 8 小時沒讀就提醒

if (!VAPID_PUBLIC || !VAPID_PRIVATE || !FIREBASE_DB_URL || !SYNC_KEY) {
  console.log('Missing env vars, skipping');
  process.exit(0);
}

webpush.setVapidDetails('mailto:kevin10021125@gmail.com', VAPID_PUBLIC, VAPID_PRIVATE);

async function run() {
  // 1. 取得推播訂閱
  const subRes = await fetch(`${FIREBASE_DB_URL}/sync/${SYNC_KEY}/pushSub.json`);
  if (!subRes.ok) { console.log('No subscription found'); return; }
  const subData = await subRes.json();
  if (!subData?.sub) { console.log('No subscription'); return; }

  // 2. 距離上次讀書超過 8 小時才發
  const logRes = await fetch(`${FIREBASE_DB_URL}/sync/${SYNC_KEY}/lastReadTime.json`);
  if (logRes.ok) {
    const lastReadTime = await logRes.json();
    if (lastReadTime) {
      const idleMs = Date.now() - lastReadTime;
      const idleHours = (idleMs / 3600000).toFixed(1);
      if (idleMs < IDLE_THRESHOLD_MS) {
        console.log(`Read ${idleHours}h ago, skip`);
        return;
      }
      console.log(`Last read ${idleHours}h ago, sending reminder`);
    }
  }

  // 3. 發送 push
  const sub = JSON.parse(subData.sub);
  const messages = [
    { title: '📚 距離上次聽書超過 8 小時了', body: '保持習慣，連讀紀錄等你維護 🔥' },
    { title: '📖 書在等你', body: '每天一點，累積大量知識。打開有聲書繼續吧！' },
    { title: '🔥 別讓火焰熄滅', body: '今天還沒達標，再聽一段吧！' },
  ];
  const msg = messages[new Date().getDay() % messages.length];

  try {
    await webpush.sendNotification(sub, JSON.stringify(msg));
    console.log('Push sent successfully');
  } catch (e) {
    console.error('Push failed:', e.statusCode, e.body);
  }
}

run().catch(console.error);
