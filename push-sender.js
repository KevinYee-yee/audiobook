const webpush = require('web-push');

const VAPID_PUBLIC = process.env.VAPID_PUBLIC;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE;
const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL;
const SYNC_KEY = process.env.FIREBASE_SYNC_KEY;

if (!VAPID_PUBLIC || !VAPID_PRIVATE || !FIREBASE_DB_URL || !SYNC_KEY) {
  console.log('Missing env vars, skipping');
  process.exit(0);
}

webpush.setVapidDetails('mailto:kevin10021125@gmail.com', VAPID_PUBLIC, VAPID_PRIVATE);

async function run() {
  // 1. 取得推播訂閱
  const subUrl = `${FIREBASE_DB_URL}/sync/${SYNC_KEY}/pushSub.json`;
  const subRes = await fetch(subUrl);
  if (!subRes.ok) { console.log('No subscription found'); return; }
  const subData = await subRes.json();
  if (!subData?.sub) { console.log('No subscription'); return; }

  // 2. 檢查今天有沒有讀書（lastReadDate）
  const today = new Date().toISOString().slice(0, 10);
  const logUrl = `${FIREBASE_DB_URL}/sync/${SYNC_KEY}/lastReadDate.json`;
  const logRes = await fetch(logUrl);
  if (logRes.ok) {
    const lastRead = await logRes.json();
    if (lastRead === today) { console.log('Already read today, skip'); return; }
  }

  // 3. 發送 push
  const sub = JSON.parse(subData.sub);
  const messages = [
    { title: '📚 今天還沒聽書！', body: `保持你的閱讀習慣，連讀紀錄等你來維護 🔥` },
    { title: '📖 書在等你', body: '每天一點，累積大量知識。打開有聲書繼續吧！' },
    { title: '🔥 別讓火焰熄滅', body: '你的連讀紀錄需要你今天繼續！' },
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
