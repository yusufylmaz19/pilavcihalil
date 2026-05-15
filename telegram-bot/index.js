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

async function getAllReceipts() {
  const snap = await db.collection('receipts').orderBy('date', 'asc').get();
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
    const trHour = new Date(new Date(r.date).getTime() + TR_OFFSET_MS).getUTCHours();
    const h = trHour.toString().padStart(2, '0') + ':00';
    if (!hourMap[h]) hourMap[h] = { count: 0, total: 0 };
    hourMap[h].count++; hourMap[h].total += r.total || 0;
  });
  const sortedHours  = Object.entries(hourMap).sort((a, b) => a[0].localeCompare(b[0]));
  const maxHourCount = Math.max(...sortedHours.map(([, v]) => v.count));
  const busyHour     = [...sortedHours].sort((a, b) => b[1].count - a[1].count)[0];

  // Günlük dağılım
  const dayMapD = {};
  receipts.forEach(r => {
    const trDate = new Date(new Date(r.date).getTime() + TR_OFFSET_MS);
    const key = trDate.toISOString().slice(0, 10);
    const dl = `${String(trDate.getUTCDate()).padStart(2,'0')}.${String(trDate.getUTCMonth()+1).padStart(2,'0')}`;
    const dn = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'][trDate.getUTCDay()];
    if (!dayMapD[key]) dayMapD[key] = { label: `${dl} ${dn}`, count: 0, total: 0 };
    dayMapD[key].count++; dayMapD[key].total += r.total || 0;
  });
  const sortedDays  = Object.entries(dayMapD).sort((a, b) => a[0].localeCompare(b[0]));
  const maxDayCount = sortedDays.length > 0 ? Math.max(...sortedDays.map(([, v]) => v.count)) : 1;
  const dayRows     = sortedDays.map(([, v]) => {
    const b  = bar(v.count, maxDayCount, 8);
    const ct = padL(v.count, 2);
    return `${v.label}  ${b}  ${ct} fiş  ₺${fmt(v.total)}`;
  }).join('\n');

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
    sortedDays.length > 1 ? `\n<b>📅 GÜNLÜK DAĞILIM</b>\n<pre>${dayRows}</pre>` : null,
    ``,
    `<b>💵 Alınan Nakit:</b> ₺${fmt(totalPaid)}   <b>Para Üstü:</b> ₺${fmt(totalChange)}`,
  ].filter(l => l !== null).join('\n');
}

// ── Inline klavye ──
const REPORT_KEYBOARD = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '📊 Bugün',         callback_data: 'z_bugun'  },
        { text: '📅 Dün',           callback_data: 'z_dun'    },
      ],
      [
        { text: '📆 Bu Hafta',      callback_data: 'z_hafta'  },
        { text: '🗓️ Bu Ay',         callback_data: 'z_ay'     },
      ],
      [
        { text: '📌 Özel Aralık',   callback_data: 'ozel_aralik' },
      ],
      [
        { text: '💵 Hızlı Ciro',    callback_data: 'ciro'     },
        { text: '🌐 Tüm Zamanlar', callback_data: 'tumzaman' },
      ],
    ],
  },
};

// ── Bot komut menüsünü Telegram'a kaydet ──
bot.setMyCommands([
  { command: 'start',     description: '🤖 Ana menü ve butonlar' },
  { command: 'zraporu',   description: '🧾 Bugünün Z raporu' },
  { command: 'ciro',      description: '💵 Hızlı ciro özeti' },
  { command: 'tumzaman',  description: '🌐 Tüm zamanlar haftalık analiz' },
]);

// ── /start & /yardim ──
bot.onText(/\/(start|yardim|help)/i, (msg) => {
  if (!isAllowed(msg.chat.id)) return;
  const text = [
    `👋 <b>Merhaba! Ben Kasa Bot.</b>`,
    `Max Pilav kasa raporlarını Telegram'dan takip et.`,
    ``,
    `<b>Komutlar:</b>`,
    `<pre>`,
    `/zraporu             Bugünün Z raporu`,
    `/zraporu bugun       Bugün`,
    `/zraporu dun         Dün`,
    `/zraporu hafta       Bu hafta`,
    `/zraporu ay          Bu ay`,
    `/zraporu 10.05       10 Mayıs (tek gün)`,
    `/zraporu 01.05 15.05 1–15 Mayıs arası`,
    `/ciro                Hızlı ciro özeti`,
    `/tumzaman            Tüm zamanlar analizi`,
    `</pre>`,
    `📌 <b>Özel tarih:</b> <code>/zraporu GG.AA</code> veya <code>/zraporu GG.AA.YYYY GG.AA.YYYY</code>`,
    ``,
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

// ── /tumzaman ──
function buildWeekdayReport(receipts) {
  if (receipts.length === 0) return '📭 Hiç kayıt bulunamadı.';

  const DAYS  = ['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];
  const SHORT = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
  const data  = Array(7).fill(null).map(() => ({ count: 0, total: 0 }));

  receipts.forEach(r => {
    const trDate = new Date(new Date(r.date).getTime() + TR_OFFSET_MS);
    const dow = trDate.getUTCDay();
    const idx = dow === 0 ? 6 : dow - 1;
    data[idx].count++;
    data[idx].total += r.total || 0;
  });

  const maxCount   = Math.max(...data.map(d => d.count));
  const totalRev   = data.reduce((s, d) => s + d.total, 0);
  const totalFis   = data.reduce((s, d) => s + d.count, 0);
  const ranked     = data.map((d, i) => ({ ...d, name: DAYS[i] })).sort((a, b) => b.count - a.count);

  const dayRows = DAYS.map((_, i) => {
    const d  = data[i];
    const b  = bar(d.count, maxCount, 8);
    const ct = padL(d.count, 4);
    const avg = d.count > 0 ? fmt(d.total / d.count) : '0,00';
    return `${SHORT[i]}  ${b}  ${ct} fiş  ₺${fmt(d.total)}`;
  }).join('\n');

  const avgRows = DAYS.map((_, i) => {
    const d = data[i];
    const avg = d.count > 0 ? fmt(d.total / d.count) : '-';
    const pct = totalFis > 0 ? Math.round((d.count / totalFis) * 100) : 0;
    return `${SHORT[i]}  ${padL('%' + pct, 4)}  Ort.fiş ₺${padL(avg, 10)}`;
  }).join('\n');

  // Saatlik dağılım
  const hourMap = {};
  receipts.forEach(r => {
    const trHour = new Date(new Date(r.date).getTime() + TR_OFFSET_MS).getUTCHours();
    const h = trHour.toString().padStart(2, '0') + ':00';
    if (!hourMap[h]) hourMap[h] = { count: 0, total: 0 };
    hourMap[h].count++; hourMap[h].total += r.total || 0;
  });
  const sortedHours  = Object.entries(hourMap).sort((a, b) => a[0].localeCompare(b[0]));
  const maxHourCount = Math.max(...sortedHours.map(([, v]) => v.count));
  const busyHour     = [...sortedHours].sort((a, b) => b[1].count - a[1].count)[0];
  const hourRows     = sortedHours.map(([h, v]) => {
    const b  = bar(v.count, maxHourCount, 8);
    const ct = padL(v.count, 4);
    return `${h}  ${b}  ${ct} fiş  ₺${fmt(v.total)}`;
  }).join('\n');

  const firstDate = new Date(new Date(receipts[0].date).getTime() + TR_OFFSET_MS);
  const firstLabel = `${String(firstDate.getUTCDate()).padStart(2,'0')}.${String(firstDate.getUTCMonth()+1).padStart(2,'0')}.${firstDate.getUTCFullYear()}`;

  const medals = ['🥇','🥈','🥉'];

  return [
    `🌐 <b>TÜM ZAMANLAR ANALİZİ</b>`,
    `📅 <b>${firstLabel} – bugün  (${totalFis} fiş)</b>`,
    ``,
    `<b>📊 GENEL</b>`,
    `<pre>`,
    `Toplam Ciro   ${padL('₺' + fmt(totalRev), 12)}`,
    `Fis Sayisi    ${padL(totalFis, 12)}`,
    `Ort. Fis      ${padL('₺' + (totalFis > 0 ? fmt(totalRev / totalFis) : '0'), 12)}`,
    `</pre>`,
    ``,
    `<b>📅 GÜNLÜK FİŞ DAĞILIMI</b>`,
    `<pre>${dayRows}</pre>`,
    ``,
    `<b>📈 GÜN BAZLI ORT. FİŞ</b>`,
    `<pre>${avgRows}</pre>`,
    ``,
    ranked.slice(0, 3).map((d, i) => `${medals[i]} <b>${d.name}</b> — ${d.count} fiş  ₺${fmt(d.total)}`).join('\n'),
    ``,
    `<b>⏰ SAATLİK DAĞILIM</b>`,
    busyHour ? `🔥 <b>En Yoğun Saat:</b> ${busyHour[0]} — ${busyHour[1].count} fiş` : '',
    `<pre>${hourRows}</pre>`,
  ].join('\n');
}

async function sendTumZaman(chatId) {
  const wait = await bot.sendMessage(chatId, '⏳ Tüm veriler çekiliyor…', HTML);
  try {
    const receipts = await getAllReceipts();
    const text     = buildWeekdayReport(receipts);
    bot.editMessageText(text, { chat_id: chatId, message_id: wait.message_id, ...HTML });
  } catch (err) {
    console.error(err);
    bot.editMessageText('❌ Veriler alınamadı: ' + err.message, { chat_id: chatId, message_id: wait.message_id });
  }
}

bot.onText(/\/tumzaman/, (msg) => { if (isAllowed(msg.chat.id)) sendTumZaman(msg.chat.id); });

// ── /zraporu ──
function parseCustomRange(param) {
  // Format: "DD.MM" veya "DD.MM.YYYY" veya "DD.MM.YYYY DD.MM.YYYY"
  const p = param.trim();
  const single = p.match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?$/);
  const range  = p.match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?\s+(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?$/);
  const now    = trNow();
  const cy     = now.getUTCFullYear();

  if (range) {
    const y1 = parseInt(range[3]  || cy);
    const y2 = parseInt(range[6]  || cy);
    const r1 = trDayRange(y1, parseInt(range[2])-1,  parseInt(range[1]));
    const r2 = trDayRange(y2, parseInt(range[5])-1,  parseInt(range[4]));
    return {
      start: r1.start,
      end:   r2.end,
      label: `${trDateLabel(y1, parseInt(range[2])-1, parseInt(range[1]))} – ${trDateLabel(y2, parseInt(range[5])-1, parseInt(range[4]))}`,
    };
  }
  if (single) {
    const y = parseInt(single[3] || cy);
    const r = trDayRange(y, parseInt(single[2])-1, parseInt(single[1]));
    return { ...r, label: trDateLabel(y, parseInt(single[2])-1, parseInt(single[1])) };
  }
  return null;
}

async function sendZReport(chatId, param) {
  const range = parseCustomRange(param) || rangeFromParam(param);
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

bot.onText(/\/zraporu(?:\s+(.+))?/, (msg, match) => {
  if (!isAllowed(msg.chat.id)) return;
  sendZReport(msg.chat.id, (match[1] || 'bugun').trim().toLowerCase());
});

// ── Inline buton callback ──
bot.on('callback_query', async (query) => {
  if (!isAllowed(query.message.chat.id)) return;
  await bot.answerCallbackQuery(query.id);
  const chatId = query.message.chat.id;
  if (query.data === 'ozel_aralik') {
    bot.sendMessage(chatId,
      `📌 <b>Özel Aralık Kullanımı</b>\n\n` +
      `Tek gün:\n<code>/zraporu 10.05</code>\n\n` +
      `Tarih aralığı:\n<code>/zraporu 01.05 15.05</code>\n\n` +
      `Yıllı format:\n<code>/zraporu 01.01.2026 31.01.2026</code>`,
      HTML);
  } else if (query.data === 'ciro') {
    sendCiro(chatId);
  } else if (query.data === 'tumzaman') {
    sendTumZaman(chatId);
  } else if (query.data.startsWith('z_')) {
    sendZReport(chatId, query.data.replace('z_', ''));
  }
});

// ── Bilinmeyen komutlar ──
bot.on('message', (msg) => {
  if (!isAllowed(msg.chat.id)) return;
  if (msg.text && msg.text.startsWith('/') && !/^\/(start|yardim|help|zraporu|ciro|tumzaman)/.test(msg.text))
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
