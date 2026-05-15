require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');
const express = require('express');
const cron = require('node-cron');
const app = express();
app.use(express.json());

// ── Firebase Admin başlatma ──
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'max-pilav',
});

const db = admin.firestore();

// ── Telegram Bot başlatma (Webhook modu) ──
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) throw new Error('TELEGRAM_BOT_TOKEN env değişkeni eksik!');

const WEBHOOK_URL   = process.env.WEBHOOK_URL;  
const SECRET_TOKEN  = process.env.WEBHOOK_SECRET;

const bot = new TelegramBot(TOKEN);

if (WEBHOOK_URL) {
  bot.setWebHook(`${WEBHOOK_URL}/bot${TOKEN}`, {
    secret_token: SECRET_TOKEN || undefined,
  });

  app.post(`/bot${TOKEN}`, (req, res) => {
    // Telegram'dan gelmeyen istekleri reddet
    if (SECRET_TOKEN && req.headers['x-telegram-bot-api-secret-token'] !== SECRET_TOKEN) {
      return res.sendStatus(403);
    }
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
} else {
  // Lokal geliştirme için polling
  bot.startPolling();
}

app.get('/', (_req, res) => res.send('Kasa Bot çalışıyor 🤖'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🤖 Kasa Bot webhook sunucusu port ${PORT}'de çalışıyor...`));

const ALLOWED_IDS = (process.env.ALLOWED_CHAT_IDS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

const HTML = { parse_mode: 'HTML' };

// ── Yardımcılar ──
function isAllowed(chatId) {
  return ALLOWED_IDS.length === 0 || ALLOWED_IDS.includes(String(chatId));
}
function fmt(n)        { return Number(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function padR(s, n)    { s = String(s); return s + ' '.repeat(Math.max(0, n - s.length)); }
function padL(s, n)    { s = String(s); return ' '.repeat(Math.max(0, n - s.length)) + s; }
function bar(v, max, w=10) {
  const f = max > 0 ? Math.round((v / max) * w) : 0;
  return '█'.repeat(f) + '░'.repeat(w - f);
}

// ── Türkiye saati (UTC+3) yardımcıları ──
const TR_OFFSET_MS = 3 * 60 * 60 * 1000;

// Şu anki zamanı Türkiye saatiyle UTC Date olarak döner
function trNow() {
  return new Date(Date.now() + TR_OFFSET_MS);
}

// Türkiye'deki bir günün UTC başlangıç/bitiş anlarını hesaplar
function trDayRange(y, m, d) {
  const start = new Date(Date.UTC(y, m, d,  0,  0,  0) - TR_OFFSET_MS);
  const end   = new Date(Date.UTC(y, m, d, 23, 59, 59) - TR_OFFSET_MS);
  return { start, end };
}

function trDateLabel(y, m, d) {
  return new Date(Date.UTC(y, m, d)).toLocaleDateString('tr-TR', { timeZone: 'UTC' });
}

// ── Tarih aralıkları ──
function todayRange() {
  const t = trNow();
  const y = t.getUTCFullYear(), m = t.getUTCMonth(), d = t.getUTCDate();
  return { ...trDayRange(y, m, d), label: trDateLabel(y, m, d) };
}
function yesterdayRange() {
  const t = trNow(); t.setUTCDate(t.getUTCDate() - 1);
  const y = t.getUTCFullYear(), m = t.getUTCMonth(), d = t.getUTCDate();
  return { ...trDayRange(y, m, d), label: trDateLabel(y, m, d) };
}
function weekRange() {
  const t   = trNow();
  const dow = t.getUTCDay() || 7;
  const mon = new Date(t); mon.setUTCDate(t.getUTCDate() - dow + 1);
  const { start } = trDayRange(mon.getUTCFullYear(), mon.getUTCMonth(), mon.getUTCDate());
  const { end }   = trDayRange(t.getUTCFullYear(),   t.getUTCMonth(),   t.getUTCDate());
  const label = `${trDateLabel(mon.getUTCFullYear(), mon.getUTCMonth(), mon.getUTCDate())} – ${trDateLabel(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate())}`;
  return { start, end, label };
}
function monthRange() {
  const t = trNow();
  const y = t.getUTCFullYear(), m = t.getUTCMonth(), d = t.getUTCDate();
  const { start } = trDayRange(y, m, 1);
  const { end }   = trDayRange(y, m, d);
  const label = new Date(Date.UTC(y, m, 1)).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return { start, end, label };
}
function rangeFromParam(p) {
  if (p === 'dun')   return yesterdayRange();
  if (p === 'hafta') return weekRange();
  if (p === 'ay')    return monthRange();
  return todayRange();
}

// ── Firestore ──
async function getReceipts(start, end) {
  const snap = await db.collection('receipts')
    .where('date', '>=', start.toISOString())
    .where('date', '<=', end.toISOString())
    .orderBy('date', 'desc').get();
  return snap.docs.map(d => d.data());
}

// ── Rapor oluşturucu ──
function buildZReport(receipts, label) {
  if (receipts.length === 0)
    return `📭 <b>${label}</b> için kayıtlı hesap bulunamadı.`;

  const totalRevenue = receipts.reduce((s, r) => s + (r.total || 0), 0);
  const totalItems   = receipts.reduce((s, r) => s + (r.itemCount || 0), 0);
  const avgTicket    = totalRevenue / receipts.length;
  const totalNakit   = receipts.filter(r => r.paymentType !== 'kart').reduce((s, r) => s + (r.total || 0), 0);
  const totalKart    = receipts.filter(r => r.paymentType === 'kart').reduce((s, r) => s + (r.total || 0), 0);
  const totalPaid    = receipts.reduce((s, r) => s + (r.paid || 0), 0);
  const totalChange  = receipts.reduce((s, r) => s + (r.change || 0), 0);
  const nakitPct     = totalRevenue > 0 ? Math.round((totalNakit / totalRevenue) * 100) : 0;
  const kartPct      = 100 - nakitPct;

  // Ürün dökümü
  const productMap = {};
  receipts.forEach(r => (r.items || []).forEach(it => {
    if (!productMap[it.name]) productMap[it.name] = { qty: 0, revenue: 0 };
    productMap[it.name].qty     += it.qty;
    productMap[it.name].revenue += (it.price || 0) * it.qty;
  }));
  const sortedProducts = Object.entries(productMap).sort((a, b) => b[1].qty - a[1].qty);
  const topSeller = sortedProducts[0];

  // Saat dağılımı
  const hourMap = {};
  receipts.forEach(r => {
    const h = new Date(r.date).getHours().toString().padStart(2, '0') + ':00';
    if (!hourMap[h]) hourMap[h] = { count: 0, total: 0 };
    hourMap[h].count++; hourMap[h].total += r.total || 0;
  });
  const sortedHours  = Object.entries(hourMap).sort((a, b) => a[0].localeCompare(b[0]));
  const maxHourCount = Math.max(...sortedHours.map(([, v]) => v.count));
  const busyHour     = [...sortedHours].sort((a, b) => b[1].count - a[1].count)[0];

  // Ürün tablosu
  const SEP = '─'.repeat(34);
  const productRows = sortedProducts.slice(0, 10).map(([name, d], i) => {
    const n = padR(`${i + 1}. ${name.slice(0, 16)}`, 20);
    const q = padL(d.qty, 4);
    const t = padL(`₺${fmt(d.revenue)}`, 10);
    return `${n}${q}  ${t}`;
  }).join('\n');

  // Saat tablosu
  const hourRows = sortedHours.map(([h, v]) => {
    const b  = bar(v.count, maxHourCount, 8);
    const ct = padL(v.count, 2);
    return `${h}  ${b}  ${ct} fiş  ₺${fmt(v.total)}`;
  }).join('\n');

  return [
    `🧾 <b>Z RAPORU</b>`,
    `📅 <b>${label}</b>`,
    ``,
    `<b>📊 GENEL ÖZET</b>`,
    `<pre>`,
    `Toplam Ciro   ${padL('₺' + fmt(totalRevenue), 12)}`,
    `Fis Sayisi    ${padL(receipts.length, 12)}`,
    `Urun Adedi    ${padL(totalItems, 12)}`,
    `Ort. Fis      ${padL('₺' + fmt(avgTicket), 12)}`,
    `</pre>`,
    ``,
    `<b>💳 ÖDEME DÖKÜMÜ</b>`,
    `<pre>`,
    `Nakit  ${bar(totalNakit, totalRevenue, 10)}  %${nakitPct}  ₺${fmt(totalNakit)}`,
    `Kart   ${bar(totalKart,  totalRevenue, 10)}  %${kartPct}  ₺${fmt(totalKart)}`,
    `</pre>`,
    topSeller ? `🏆 <b>En Çok Satan:</b> ${topSeller[0]} — ${topSeller[1].qty} adet` : '',
    busyHour  ? `⏰ <b>En Yoğun Saat:</b> ${busyHour[0]} — ${busyHour[1].count} fiş` : '',
    ``,
    `<b>📦 ÜRÜN DÖKÜMÜ</b>`,
    `<pre>`,
    `${padR('Urun', 20)}${padL('Adet', 4)}  ${padL('Tutar', 10)}`,
    SEP,
    productRows,
    SEP,
    `${padR('TOPLAM', 20)}${padL(totalItems, 4)}  ${padL('₺' + fmt(totalRevenue), 10)}`,
    `</pre>`,
    ``,
    `<b>⏰ SAAT DAĞILIMI</b>`,
    `<pre>${hourRows}</pre>`,
    ``,
    `<b>💵 Alınan Nakit:</b> ₺${fmt(totalPaid)}   <b>Para Üstü:</b> ₺${fmt(totalChange)}`,
  ].filter(l => l !== null).join('\n');
}

// ── Inline klavye ──
const REPORT_KEYBOARD = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '📊 Bugün',    callback_data: 'z_bugun' },
        { text: '📅 Dün',      callback_data: 'z_dun'   },
      ],
      [
        { text: '📆 Bu Hafta', callback_data: 'z_hafta' },
        { text: '🗓️ Bu Ay',    callback_data: 'z_ay'    },
      ],
      [
        { text: '💵 Hızlı Ciro', callback_data: 'ciro' },
      ],
    ],
  },
};

// ── /start & /yardim ──
bot.onText(/\/(start|yardim|help)/i, (msg) => {
  if (!isAllowed(msg.chat.id)) return;
  const text = [
    `👋 <b>Merhaba! Ben Kasa Bot.</b>`,
    `Max Pilav kasa raporlarını Telegram'dan takip et.`,
    ``,
    `<b>Komutlar:</b>`,
    `<pre>`,
    `/zraporu          Bugünün Z raporu`,
    `/zraporu bugun    Bugün`,
    `/zraporu dun      Dün`,
    `/zraporu hafta    Bu hafta`,
    `/zraporu ay       Bu ay`,
    `/ciro             Hizli ciro ozeti`,
    `</pre>`,
    `Ya da aşağıdaki butonları kullan 👇`,
  ].join('\n');
  bot.sendMessage(msg.chat.id, text, { ...HTML, ...REPORT_KEYBOARD });
});

// ── /ciro ──
async function sendCiro(chatId) {
  const { start, end, label } = todayRange();
  const wait = await bot.sendMessage(chatId, '⏳ Veriler çekiliyor…', HTML);
  try {
    const receipts     = await getReceipts(start, end);
    const totalRevenue = receipts.reduce((s, r) => s + (r.total || 0), 0);
    const totalNakit   = receipts.filter(r => r.paymentType !== 'kart').reduce((s, r) => s + (r.total || 0), 0);
    const totalKart    = receipts.filter(r => r.paymentType === 'kart').reduce((s, r) => s + (r.total || 0), 0);
    const nakitPct     = totalRevenue > 0 ? Math.round((totalNakit / totalRevenue) * 100) : 0;

    const text = receipts.length === 0
      ? `📭 <b>${label}</b> için henüz hesap yok.`
      : [
          `💵 <b>GÜNLÜK CİRO — ${label}</b>`,
          ``,
          `<pre>`,
          `Toplam Ciro   ${padL('₺' + fmt(totalRevenue), 12)}`,
          `Fis Sayisi    ${padL(receipts.length, 12)}`,
          `</pre>`,
          `<pre>`,
          `Nakit  ${bar(totalNakit, totalRevenue, 10)}  %${nakitPct}  ₺${fmt(totalNakit)}`,
          `Kart   ${bar(totalKart,  totalRevenue, 10)}  %${100-nakitPct}  ₺${fmt(totalKart)}`,
          `</pre>`,
        ].join('\n');

    bot.editMessageText(text, { chat_id: chatId, message_id: wait.message_id, ...HTML });
  } catch (err) {
    console.error(err);
    bot.editMessageText('❌ Veriler alınamadı: ' + err.message, { chat_id: chatId, message_id: wait.message_id });
  }
}

bot.onText(/\/ciro/, (msg) => { if (isAllowed(msg.chat.id)) sendCiro(msg.chat.id); });

// ── /zraporu ──
async function sendZReport(chatId, param) {
  const range = rangeFromParam(param);
  const wait  = await bot.sendMessage(chatId, '⏳ Z Raporu hazırlanıyor…', HTML);
  try {
    const receipts = await getReceipts(range.start, range.end);
    const text     = buildZReport(receipts, range.label);
    bot.editMessageText(text, { chat_id: chatId, message_id: wait.message_id, ...HTML });
  } catch (err) {
    console.error(err);
    bot.editMessageText('❌ Rapor oluşturulamadı: ' + err.message, { chat_id: chatId, message_id: wait.message_id });
  }
}

bot.onText(/\/zraporu(?:\s+(\w+))?/, (msg, match) => {
  if (!isAllowed(msg.chat.id)) return;
  sendZReport(msg.chat.id, (match[1] || 'bugun').toLowerCase());
});

// ── Inline buton callback ──
bot.on('callback_query', async (query) => {
  if (!isAllowed(query.message.chat.id)) return;
  await bot.answerCallbackQuery(query.id);
  const chatId = query.message.chat.id;
  if (query.data === 'ciro') {
    sendCiro(chatId);
  } else if (query.data.startsWith('z_')) {
    sendZReport(chatId, query.data.replace('z_', ''));
  }
});

// ── Bilinmeyen komutlar ──
bot.on('message', (msg) => {
  if (!isAllowed(msg.chat.id)) return;
  if (msg.text && msg.text.startsWith('/') && !/^\/(start|yardim|help|zraporu|ciro)/.test(msg.text))
    bot.sendMessage(msg.chat.id, '❓ Bilinmeyen komut. /yardim yaz.', HTML);
});

// ── Otomatik gün sonu Z raporu ──
// DAILY_REPORT_TIME_TR = "HH:MM" formatında Türkiye saati (örn: "23:00", "17:30")
const dailyTimeTR  = (process.env.DAILY_REPORT_TIME_TR || '23:00').split(':');
const dailyHourTR  = parseInt(dailyTimeTR[0], 10);
const dailyMinTR   = parseInt(dailyTimeTR[1] || '0', 10);
const dailyHourUTC = (dailyHourTR - 3 + 24) % 24;

cron.schedule(`${dailyMinTR} ${dailyHourUTC} * * *`, async () => {
  console.log(`🕐 Otomatik gün sonu Z raporu gönderiliyor (TR ${dailyHourTR}:${String(dailyMinTR).padStart(2,'0')})...`);
  const range = todayRange();
  try {
    const receipts = await getReceipts(range.start, range.end);
    const text = [
      `🌙 <b>GÜN SONU RAPORU</b>`,
      buildZReport(receipts, range.label),
    ].join('\n');
    for (const chatId of ALLOWED_IDS) {
      await bot.sendMessage(chatId, text, HTML);
    }
  } catch (err) {
    console.error('Otomatik rapor hatası:', err);
  }
}, { timezone: 'UTC' });

console.log(`🤖 Kasa Bot çalışıyor... (Otomatik rapor: her gece TR ${dailyHourTR}:${String(dailyMinTR).padStart(2,'0')})`);
