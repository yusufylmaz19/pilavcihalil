// ── Firebase Firestore DB katmanı ──
// IndexedDB'nin yerini Firestore alıyor; fonksiyon imzaları aynı kaldı.

const RECEIPTS_COL = 'receipts';
const PRODUCTS_COL = 'products';
const COMBOS_COL   = 'combos';

// ── Bellek Cache (Firestore okuma sayısını azaltır) ──
const _cache = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 dakika

function _getCached(key) {
    const entry = _cache[key];
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL) { delete _cache[key]; return null; }
    return entry.data;
}
function _setCache(key, data) {
    _cache[key] = { data: JSON.parse(JSON.stringify(data)), ts: Date.now() };
}
function _invalidate(key) {
    delete _cache[key];
}

function getFirestore() {
    return firebase.firestore();
}

// app.js'de çağrılan openDB() artık gerekmiyor ama geriye dönük uyumluluk için boş bırakıldı
function openDB() {
    return Promise.resolve();
}

// ── Receipt CRUD ──
async function getHistory() {
    try {
        const snap = await getFirestore()
            .collection(RECEIPTS_COL)
            .orderBy('date', 'desc')
            .get();
        return snap.docs.map(d => d.data());
    } catch (err) {
        console.error('getHistory hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Adisyonlar yüklenemedi: ' + (err.message || err), '');
        throw err;
    }
}

async function addReceipt(receipt) {
    try {
        await getFirestore().collection(RECEIPTS_COL).doc(receipt.id).set(receipt);
    } catch (err) {
        console.error('addReceipt hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Adisyon kaydedilemedi: ' + (err.message || err), '');
        throw err;
    }
}

async function removeReceipt(id) {
    try {
        await getFirestore().collection(RECEIPTS_COL).doc(id).delete();
    } catch (err) {
        console.error('removeReceipt hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Adisyon silinemedi: ' + (err.message || err), '');
        throw err;
    }
}

async function getReceiptCount() {
    try {
        const snap = await getFirestore().collection(RECEIPTS_COL).get();
        return snap.size;
    } catch (err) {
        console.error('getReceiptCount hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Adisyon sayısı alınamadı: ' + (err.message || err), '');
        throw err;
    }
}

// ── Product CRUD ──
const CATEGORY_ORDER = ['pilavlar', 'tavuklar', 'yan-urunler', 'corbalar', 'icecekler'];

async function getAllProducts() {
    const cached = _getCached('products');
    if (cached) return cached;
    try {
        const snap = await getFirestore().collection(PRODUCTS_COL).get();
        const products = snap.docs.map(d => d.data());
        products.sort((a, b) => {
            const ai = CATEGORY_ORDER.indexOf(a.category || '');
            const bi = CATEGORY_ORDER.indexOf(b.category || '');
            const catDiff = (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
            if (catDiff !== 0) return catDiff;
            return (a.order || 0) - (b.order || 0);
        });
        _setCache('products', products);
        return products;
    } catch (err) {
        console.error('getAllProducts hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Ürünler yüklenemedi: ' + (err.message || err), '');
        throw err;
    }
}

async function saveProduct(product) {
    try {
        await getFirestore().collection(PRODUCTS_COL).doc(product.name).set(product);
        _invalidate('products');
    } catch (err) {
        console.error('saveProduct hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Ürün kaydedilemedi: ' + (err.message || err), '');
        throw err;
    }
}

async function removeProduct(name) {
    try {
        await getFirestore().collection(PRODUCTS_COL).doc(name).delete();
        _invalidate('products');
    } catch (err) {
        console.error('removeProduct hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Ürün silinemedi: ' + (err.message || err), '');
        throw err;
    }
}

async function clearAllProducts() {
    try {
        const snap = await getFirestore().collection(PRODUCTS_COL).get();
        const batch = getFirestore().batch();
        snap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        _invalidate('products');
    } catch (err) {
        console.error('clearAllProducts hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Ürünler temizlenemedi: ' + (err.message || err), '');
        throw err;
    }
}

// ── Combo CRUD ──
async function getAllCombos() {
    const cached = _getCached('combos');
    if (cached) return cached;
    try {
        const snap = await getFirestore().collection(COMBOS_COL).get();
        const combos = snap.docs.map(d => d.data());
        _setCache('combos', combos);
        return combos;
    } catch (err) {
        console.error('getAllCombos hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Kombolar yüklenemedi: ' + (err.message || err), '');
        throw err;
    }
}

async function saveCombo(combo) {
    try {
        await getFirestore().collection(COMBOS_COL).doc(combo.id).set(combo);
        _invalidate('combos');
    } catch (err) {
        console.error('saveCombo hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Kombo kaydedilemedi: ' + (err.message || err), '');
        throw err;
    }
}

async function removeCombo(id) {
    try {
        await getFirestore().collection(COMBOS_COL).doc(id).delete();
        _invalidate('combos');
    } catch (err) {
        console.error('removeCombo hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Kombo silinemedi: ' + (err.message || err), '');
        throw err;
    }
}

async function clearAllCombos() {
    try {
        const snap = await getFirestore().collection(COMBOS_COL).get();
        const batch = getFirestore().batch();
        snap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        _invalidate('combos');
    } catch (err) {
        console.error('clearAllCombos hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Kombolar temizlenemedi: ' + (err.message || err), '');
        throw err;
    }
}

// ── Settings CRUD ──
const SETTINGS_COL = 'settings';

async function getSettings() {
    const cached = _getCached('settings');
    if (cached) return cached;
    try {
        const doc = await getFirestore().collection(SETTINGS_COL).doc('main').get();
        const data = doc.exists ? doc.data() : null;
        if (data) _setCache('settings', data);
        return data;
    } catch (err) {
        console.error('getSettings hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Ayarlar yüklenemedi: ' + (err.message || err), '');
        throw err;
    }
}

async function saveSettings(data) {
    try {
        await getFirestore().collection(SETTINGS_COL).doc('main').set(data, { merge: true });
        _invalidate('settings');
    } catch (err) {
        console.error('saveSettings hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Ayarlar kaydedilemedi: ' + (err.message || err), '');
        throw err;
    }
}
