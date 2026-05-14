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
    const snap = await getFirestore()
        .collection(RECEIPTS_COL)
        .orderBy('date', 'desc')
        .get();
    return snap.docs.map(d => d.data());
}

async function addReceipt(receipt) {
    await getFirestore().collection(RECEIPTS_COL).doc(receipt.id).set(receipt);
}

async function removeReceipt(id) {
    await getFirestore().collection(RECEIPTS_COL).doc(id).delete();
}

async function getReceiptCount() {
    const snap = await getFirestore().collection(RECEIPTS_COL).get();
    return snap.size;
}

// ── Product CRUD ──
const CATEGORY_ORDER = ['pilavlar', 'tavuklar', 'yan-urunler', 'corbalar', 'icecekler'];

async function getAllProducts() {
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
}

async function saveProduct(product) {
    await getFirestore().collection(PRODUCTS_COL).doc(product.name).set(product);
}

async function removeProduct(name) {
    await getFirestore().collection(PRODUCTS_COL).doc(name).delete();
}

async function clearAllProducts() {
    const snap = await getFirestore().collection(PRODUCTS_COL).get();
    const batch = getFirestore().batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
}

// ── Combo CRUD ──
async function getAllCombos() {
    const snap = await getFirestore().collection(COMBOS_COL).get();
    return snap.docs.map(d => d.data());
}

async function saveCombo(combo) {
    await getFirestore().collection(COMBOS_COL).doc(combo.id).set(combo);
}

async function removeCombo(id) {
    await getFirestore().collection(COMBOS_COL).doc(id).delete();
}

async function clearAllCombos() {
    const snap = await getFirestore().collection(COMBOS_COL).get();
    const batch = getFirestore().batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
}

// ── Settings CRUD ──
const SETTINGS_COL = 'settings';

async function getSettings() {
    const doc = await getFirestore().collection(SETTINGS_COL).doc('main').get();
    return doc.exists ? doc.data() : null;
}

async function saveSettings(data) {
    await getFirestore().collection(SETTINGS_COL).doc('main').set(data, { merge: true });
}
