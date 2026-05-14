// ── Firebase Firestore DB katmanı ──
// IndexedDB'nin yerini Firestore alıyor; fonksiyon imzaları aynı kaldı.

const RECEIPTS_COL = 'receipts';
const PRODUCTS_COL = 'products';
const COMBOS_COL   = 'combos';

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
    } catch (err) {
        console.error('saveProduct hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Ürün kaydedilemedi: ' + (err.message || err), '');
        throw err;
    }
}

async function removeProduct(name) {
    try {
        await getFirestore().collection(PRODUCTS_COL).doc(name).delete();
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
    } catch (err) {
        console.error('clearAllProducts hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Ürünler temizlenemedi: ' + (err.message || err), '');
        throw err;
    }
}

// ── Combo CRUD ──
async function getAllCombos() {
    try {
        const snap = await getFirestore().collection(COMBOS_COL).get();
        return snap.docs.map(d => d.data());
    } catch (err) {
        console.error('getAllCombos hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Kombolar yüklenemedi: ' + (err.message || err), '');
        throw err;
    }
}

async function saveCombo(combo) {
    try {
        await getFirestore().collection(COMBOS_COL).doc(combo.id).set(combo);
    } catch (err) {
        console.error('saveCombo hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Kombo kaydedilemedi: ' + (err.message || err), '');
        throw err;
    }
}

async function removeCombo(id) {
    try {
        await getFirestore().collection(COMBOS_COL).doc(id).delete();
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
    } catch (err) {
        console.error('clearAllCombos hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Kombolar temizlenemedi: ' + (err.message || err), '');
        throw err;
    }
}

// ── Settings CRUD ──
const SETTINGS_COL = 'settings';

async function getSettings() {
    try {
        const doc = await getFirestore().collection(SETTINGS_COL).doc('main').get();
        return doc.exists ? doc.data() : null;
    } catch (err) {
        console.error('getSettings hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Ayarlar yüklenemedi: ' + (err.message || err), '');
        throw err;
    }
}

async function saveSettings(data) {
    try {
        await getFirestore().collection(SETTINGS_COL).doc('main').set(data, { merge: true });
    } catch (err) {
        console.error('saveSettings hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Ayarlar kaydedilemedi: ' + (err.message || err), '');
        throw err;
    }
}
