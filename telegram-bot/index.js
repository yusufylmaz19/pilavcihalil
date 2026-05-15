require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');
const express = require('express');
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

const WEBHOOK_URL   = process.env.WEBHOOK_URL;    // örn: https://kasa-bot.onrender.com
const SECRET_TOKEN  = process.env.WEBHOOK_SECRET;  // istediğin rastgele bir şifre

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

// ── İzin verilen chat ID'leri (güvenlik) ──
// ALLOWED_CHAT_IDS env: "123456,789012" gibi virgülle ayrılmış
const ALLOWED_IDS = (process.env.ALLOWED_CHAT_IDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

function isAllowed(chatId) {
  if (ALLOWED_IDS.length === 0) return true; // kısıtlama yoksa herkese açık
  return ALLOWED_IDS.includes(String(chatId));
}

// ── Tarih aralığı yardımcıları ──
function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return { start, end, label: start.toLocaleDateString('tr-TR') };
}

function yesterdayRange() {
  const now = new Date();
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  const start = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0);
  const end   = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59);
  return { start, end, label: start.toLocaleDateString('tr-TR') };
}

function weekRange() {
  const now = new Date();
  const day = now.getDay() || 7;
  const start = new Date(now);
  start.setDate(now.getDate() - day + 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return {
    start,
    end,
    label: `${start.toLocaleDateString('tr-TR')} - ${end.toLocaleDateString('tr-TR')}`,
  };
}

function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return {
    start,
    end,
    label: start.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
  };
}

// ── Firestore'dan fiş çekme ──
async function getReceipts(start, end) {
  const snap = await db
    .collection('receipts')
    .where('date', '>=', start.toISOString())
    .where('date', '<=', end.toISOString())
    .orderBy('date', 'desc')
    .get();
  return snap.docs.map(d => d.data());
}

// ── Z Raporu hesaplama ve metin oluşturma ──
function buildZReport(receipts, label) {
  if (receipts.length === 0) {
    return `📭 *${label}* için kayıtlı hesap bulunamadı.`;
  }

  const totalRevenue = receipts.reduce((s, r) => s + (r.total || 0), 0);
  const totalItems   = receipts.reduce((s, r) => s + (r.itemCount || 0), 0);
  const avgTicket    = totalRevenue / receipts.length;
  const totalNakit   = receipts.filter(r => r.paymentType !== 'kart').reduce((s, r) => s + (r.total || 0), 0);
  const totalKart    = receipts.filter(r => r.paymentType === 'kart').reduce((s, r) => s + (r.total || 0), 0);
  const totalPaid    = receipts.reduce((s, r) => s + (r.paid || 0), 0);
  const totalChange  = receipts.reduce((s, r) => s + (r.change || 0), 0);

  // Ürün dökümü
  const productMap = {};
  receipts.forEach(r => {
    (r.items || []).forEach(it => {
      if (!productMap[it.name]) productMap[it.name] = { qty: 0, revenue: 0, emoji: it.emoji || '' };
      productMap[it.name].qty += it.qty;
      productMap[it.name].revenue += (it.price || 0) * it.qty;
    });
  });

  const sortedProducts = Object.entries(productMap).sort((a, b) => b[1].qty - a[1].qty);
  const topSeller = sortedProducts[0];

  // Saat bazlı dağılım
  const hourMap = {};
  receipts.forEach(r => {
    const h = new Date(r.date).getHours().toString().padStart(2, '0') + ':00';
    if (!hourMap[h]) hourMap[h] = { count: 0, total: 0 };
    hourMap[h].count++;
    hourMap[h].total += r.total || 0;
  });

  const busyHour = Object.entries(hourMap).sort((a, b) => b[1].count - a[1].count)[0];

  // Ürün tablosu (en fazla 10 satır)
  const productLines = sortedProducts.slice(0, 10)
    .map(([name, d]) => `  ${d.emoji} ${name}: ${d.qty} adet — ₺${d.revenue.toFixed(2)}`)
    .join('\n');

  return `
🧾 *Z RAPORU — ${label}*
${'─'.repeat(30)}
📊 *Genel Özet*
  • Toplam Ciro  : ₺${totalRevenue.toFixed(2)}
  • Fiş Sayısı   : ${receipts.length}
  • Ürün Adedi   : ${totalItems}
  • Ort. Fiş     : ₺${avgTicket.toFixed(2)}

💰 *Ödeme Dökümü*
  • Nakit        : ₺${totalNakit.toFixed(2)}
  • Kredi Kartı  : ₺${totalKart.toFixed(2)}
  • Alınan Nakit : ₺${totalPaid.toFixed(2)}
  • Para Üstü    : ₺${totalChange.toFixed(2)}
${topSeller ? `\n🏆 *En Çok Satan*\n  ${topSeller[1].emoji} ${topSeller[0]} — ${topSeller[1].qty} adet` : ''}
${busyHour ? `\n⏰ *En Yoğun Saat*\n  ${busyHour[0]} — ${busyHour[1].count} fiş` : ''}

📦 *Ürün Bazlı Döküm*
${productLines || '  —'}
${'─'.repeat(30)}
`.trim();
}

// ── /start & /yardim ──
bot.onText(/\/(start|yardim|help)/i, (msg) => {
  if (!isAllowed(msg.chat.id)) return;
  const text = `
👋 *Merhaba!* Kasa Bot burada.

Kullanabileceğin komutlar:

/zraporu — Bugünün Z raporu
/zraporu bugun — Bugün
/zraporu dun — Dün
/zraporu hafta — Bu hafta
/zraporu ay — Bu ay
/ciro — Günlük hızlı ciro özeti
  `.trim();
  bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
});

// ── /ciro — hızlı özet ──
bot.onText(/\/ciro/, async (msg) => {
  if (!isAllowed(msg.chat.id)) return;
  const { start, end, label } = todayRange();
  try {
    bot.sendMessage(msg.chat.id, '⏳ Veriler çekiliyor...');
    const receipts = await getReceipts(start, end);
    const totalRevenue = receipts.reduce((s, r) => s + (r.total || 0), 0);
    const totalNakit   = receipts.filter(r => r.paymentType !== 'kart').reduce((s, r) => s + (r.total || 0), 0);
    const totalKart    = receipts.filter(r => r.paymentType === 'kart').reduce((s, r) => s + (r.total || 0), 0);

    const text = receipts.length === 0
      ? `📭 *${label}* için henüz hesap yok.`
      : `💵 *Günlük Ciro — ${label}*\n\n  • Toplam : ₺${totalRevenue.toFixed(2)}\n  • Nakit  : ₺${totalNakit.toFixed(2)}\n  • Kart   : ₺${totalKart.toFixed(2)}\n  • Fiş    : ${receipts.length}`;

    bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error(err);
    bot.sendMessage(msg.chat.id, '❌ Veriler alınamadı: ' + err.message);
  }
});

// ── /zraporu [bugun|dun|hafta|ay] ──
bot.onText(/\/zraporu(?:\s+(\w+))?/, async (msg, match) => {
  if (!isAllowed(msg.chat.id)) return;
  const param = (match[1] || 'bugun').toLowerCase();

  let range;
  if (param === 'dun')         range = yesterdayRange();
  else if (param === 'hafta')  range = weekRange();
  else if (param === 'ay')     range = monthRange();
  else                         range = todayRange(); // bugun veya default

  try {
    await bot.sendMessage(msg.chat.id, '⏳ Z Raporu hazırlanıyor...');
    const receipts = await getReceipts(range.start, range.end);
    const text = buildZReport(receipts, range.label);
    bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error(err);
    bot.sendMessage(msg.chat.id, '❌ Rapor oluşturulamadı: ' + err.message);
  }
});

// ── Bilinmeyen komutlar ──
bot.on('message', (msg) => {
  if (!isAllowed(msg.chat.id)) return;
  if (msg.text && msg.text.startsWith('/') && !/^\/(start|yardim|help|zraporu|ciro)/.test(msg.text)) {
    bot.sendMessage(msg.chat.id, '❓ Bilinmeyen komut. /yardim ile komutları görebilirsin.');
  }
});

console.log('🤖 Kasa Bot çalışıyor...');
