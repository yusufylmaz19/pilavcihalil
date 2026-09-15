// ── Firebase Firestore DB katmanı ──
// IndexedDB'nin yerini Firestore alıyor; fonksiyon imzaları aynı kaldı.

const RECEIPTS_COL = 'receipts';
const PRODUCTS_COL = 'products';
const COMBOS_COL   = 'combos';

// ── Uygulama cache'i (Firestore okuma sayısını azaltır) ──
const _cache = {};
const _inflight = {};
const CACHE_TTL = 60 * 60 * 1000;
const HISTORY_CACHE_TTL = 5 * 60 * 1000;
const STORAGE_PREFIX = 'maxpilav_db_v2_';
const _historyPages = {};

function _clone(data) {
    return data == null ? data : JSON.parse(JSON.stringify(data));
}

function _getCached(key) {
    let entry = _cache[key];
    if (!entry) {
        try {
            entry = JSON.parse(localStorage.getItem(STORAGE_PREFIX + key));
            if (entry) _cache[key] = entry;
        } catch (_) {}
    }
    if (!entry) return null;
    const ttl = key.startsWith('history:') || key === 'receiptCount' ? HISTORY_CACHE_TTL : CACHE_TTL;
    if (Date.now() - entry.ts > ttl) { _invalidate(key); return null; }
    return _clone(entry.data);
}
function _setCache(key, data) {
    const entry = { data: _clone(data), ts: Date.now() };
    _cache[key] = entry;
    if (!key.startsWith('history:') && key !== 'receiptCount') {
        try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry)); } catch (_) {}
    }
}
function _invalidate(key) {
    delete _cache[key];
    delete _inflight[key];
    try { localStorage.removeItem(STORAGE_PREFIX + key); } catch (_) {}
}
function _invalidateHistory() {
    Object.keys(_cache).filter(key => key.startsWith('history:') || key === 'receiptCount').forEach(_invalidate);
    Object.keys(_historyPages).forEach(key => delete _historyPages[key]);
}
function _once(key, loader) {
    if (!_inflight[key]) _inflight[key] = Promise.resolve().then(loader).finally(() => delete _inflight[key]);
    return _inflight[key];
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
    const cached = _getCached('history:all');
    if (cached) return cached;
    try {
        return await _once('history:all', async () => {
            const snap = await getFirestore().collection(RECEIPTS_COL).orderBy('date', 'desc').get();
            const data = snap.docs.map(d => d.data());
            _setCache('history:all', data);
            return data;
        });
    } catch (err) {
        console.error('getHistory hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Adisyonlar yüklenemedi: ' + (err.message || err), '');
        throw err;
    }
}

async function addReceipt(receipt) {
    try {
        await getFirestore().collection(RECEIPTS_COL).doc(receipt.id).set(receipt);
        _invalidateHistory();
    } catch (err) {
        console.error('addReceipt hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Adisyon kaydedilemedi: ' + (err.message || err), '');
        throw err;
    }
}

async function removeReceipt(id) {
    try {
        await getFirestore().collection(RECEIPTS_COL).doc(id).delete();
        _invalidateHistory();
    } catch (err) {
        console.error('removeReceipt hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Adisyon silinemedi: ' + (err.message || err), '');
        throw err;
    }
}

async function getReceiptCount() {
    const cached = _getCached('receiptCount');
    if (cached !== null) return cached;
    try {
        return await _once('receiptCount', async () => {
            const snap = await getFirestore().collection(RECEIPTS_COL).count().get();
            const count = snap.data().count;
            _setCache('receiptCount', count);
            return count;
        });
    } catch (err) {
        console.warn('count() metodu basarisiz oldu, fallback kullaniliyor:', err);
        try {
            const snap = await getFirestore().collection(RECEIPTS_COL).get();
            return snap.size;
        } catch (e) {
            console.error('getReceiptCount hatası:', e);
            if (typeof showToast === 'function') showToast('❌ Adisyon sayısı alınamadı: ' + (e.message || e), '');
            throw e;
        }
    }
}

async function getHistoryPaged(page = 1, pageSize = 10) {
    try {
        const totalCount = await getReceiptCount();
        const cacheKey = String(pageSize);
        const pageCache = _historyPages[cacheKey] ||= {};
        for (let current = 1; current <= page; current++) {
            if (pageCache[current]) continue;
            let query = getFirestore().collection(RECEIPTS_COL).orderBy('date', 'desc').limit(pageSize);
            const previous = pageCache[current - 1];
            if (current > 1) {
                if (!previous?.lastDoc) break;
                query = query.startAfter(previous.lastDoc);
            }
            const snap = await _once(`history:page:${pageSize}:${current}`, () => query.get());
            pageCache[current] = {
                items: snap.docs.map(doc => doc.data()),
                lastDoc: snap.docs[snap.docs.length - 1] || null
            };
        }
        const pageDocs = pageCache[page]?.items || [];
        
        return {
            items: pageDocs,
            totalCount: totalCount,
            totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
            currentPage: page
        };
    } catch (err) {
        console.error('getHistoryPaged hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Adisyonlar yüklenemedi: ' + (err.message || err), '');
        throw err;
    }
}

// ── Product CRUD ──
const CATEGORY_ORDER = ['pilavlar', 'tavuklar', 'yan-urunler', 'corbalar', 'icecekler'];

async function getAllProducts() {
    const cached = _getCached('products');
    if (cached) return cached;
    try {
        return await _once('products', async () => {
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
        });
    } catch (err) {
        console.error('getAllProducts hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Ürünler yüklenemedi: ' + (err.message || err), '');
        throw err;
    }
}

async function saveProduct(product) {
    try {
        await getFirestore().collection(PRODUCTS_COL).doc(product.name).set(product);
        const cached = _getCached('products');
        if (cached) {
            const index = cached.findIndex(item => item.name === product.name);
            if (index >= 0) cached[index] = product; else cached.push(product);
            _setCache('products', cached);
        } else _invalidate('products');
    } catch (err) {
        console.error('saveProduct hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Ürün kaydedilemedi: ' + (err.message || err), '');
        throw err;
    }
}

async function getReceiptsByDateRange(start, end) {
    const startISO = start.toISOString();
    const endISO = end.toISOString();
    const key = `history:range:${startISO}:${endISO}`;
    const cached = _getCached(key);
    if (cached) return cached;
    try {
        return await _once(key, async () => {
            const snap = await getFirestore().collection(RECEIPTS_COL)
                .where('date', '>=', startISO)
                .where('date', '<=', endISO)
                .orderBy('date', 'desc')
                .get();
            const receipts = snap.docs.map(doc => doc.data());
            _setCache(key, receipts);
            return receipts;
        });
    } catch (err) {
        console.error('getReceiptsByDateRange hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Rapor verileri yüklenemedi: ' + (err.message || err), '');
        throw err;
    }
}

async function getReceiptById(id) {
    for (const pages of Object.values(_historyPages)) {
        for (const page of Object.values(pages)) {
            const receipt = page.items?.find(item => item.id === id);
            if (receipt) return _clone(receipt);
        }
    }
    const doc = await getFirestore().collection(RECEIPTS_COL).doc(id).get();
    return doc.exists ? doc.data() : null;
}

// Ürün adı aynı zamanda belge kimliği olduğu için yeniden adlandırmayı atomik yap.
// Ürünü kullanan kombolar da yeni ada geçirilir; geçmiş adisyonlara dokunulmaz.
async function renameProduct(oldName, product) {
    const newName = product.name.trim();
    if (!oldName || oldName === newName) {
        await saveProduct({ ...product, name: newName });
        return;
    }

    try {
        const db = getFirestore();
        const oldRef = db.collection(PRODUCTS_COL).doc(oldName);
        const newRef = db.collection(PRODUCTS_COL).doc(newName);
        const cachedProducts = _getCached('products');
        if (cachedProducts) {
            if (cachedProducts.some(item => item.name === newName)) throw new Error('Bu isimde bir ürün zaten var.');
        } else {
            const newDoc = await newRef.get();
            if (newDoc.exists) throw new Error('Bu isimde bir ürün zaten var.');
        }

        const cachedCombos = _getCached('combos');
        const comboDocs = cachedCombos
            ? cachedCombos.map(combo => ({ id: combo.id, data: () => combo, ref: db.collection(COMBOS_COL).doc(combo.id) }))
            : (await db.collection(COMBOS_COL).get()).docs;
        const batch = db.batch();
        batch.set(newRef, { ...product, name: newName });
        batch.delete(oldRef);

        comboDocs.forEach(doc => {
            const combo = doc.data();
            if (!(combo.items || []).some(item => item.name === oldName)) return;
            const items = combo.items.map(item => item.name === oldName ? { ...item, name: newName } : item);
            batch.update(doc.ref, { items });
        });

        await batch.commit();
        if (cachedProducts) {
            _setCache('products', cachedProducts.map(item => item.name === oldName ? { ...product, name: newName } : item));
        } else _invalidate('products');
        if (cachedCombos) {
            _setCache('combos', cachedCombos.map(combo => ({
                ...combo,
                items: (combo.items || []).map(item => item.name === oldName ? { ...item, name: newName } : item)
            })));
        } else _invalidate('combos');
    } catch (err) {
        console.error('renameProduct hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Ürün adı güncellenemedi: ' + (err.message || err), '');
        throw err;
    }
}

async function removeProduct(name) {
    try {
        await getFirestore().collection(PRODUCTS_COL).doc(name).delete();
        const cached = _getCached('products');
        if (cached) _setCache('products', cached.filter(product => product.name !== name));
        else _invalidate('products');
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
        _setCache('products', []);
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
        return await _once('combos', async () => {
            const snap = await getFirestore().collection(COMBOS_COL).get();
            const combos = snap.docs.map(d => d.data());
            _setCache('combos', combos);
            return combos;
        });
    } catch (err) {
        console.error('getAllCombos hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Kombolar yüklenemedi: ' + (err.message || err), '');
        throw err;
    }
}

async function saveCombo(combo) {
    try {
        await getFirestore().collection(COMBOS_COL).doc(combo.id).set(combo);
        const cached = _getCached('combos');
        if (cached) {
            const index = cached.findIndex(item => item.id === combo.id);
            if (index >= 0) cached[index] = combo; else cached.push(combo);
            _setCache('combos', cached);
        } else _invalidate('combos');
    } catch (err) {
        console.error('saveCombo hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Kombo kaydedilemedi: ' + (err.message || err), '');
        throw err;
    }
}

async function removeCombo(id) {
    try {
        await getFirestore().collection(COMBOS_COL).doc(id).delete();
        const cached = _getCached('combos');
        if (cached) _setCache('combos', cached.filter(combo => combo.id !== id));
        else _invalidate('combos');
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
        _setCache('combos', []);
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
        return await _once('settings', async () => {
            const doc = await getFirestore().collection(SETTINGS_COL).doc('main').get();
            const data = doc.exists ? doc.data() : null;
            if (data) _setCache('settings', data);
            return data;
        });
    } catch (err) {
        console.error('getSettings hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Ayarlar yüklenemedi: ' + (err.message || err), '');
        throw err;
    }
}

async function saveSettings(data) {
    try {
        await getFirestore().collection(SETTINGS_COL).doc('main').set(data, { merge: true });
        _setCache('settings', { ...(_getCached('settings') || {}), ...data });
    } catch (err) {
        console.error('saveSettings hatası:', err);
        if (typeof showToast === 'function') showToast('❌ Ayarlar kaydedilemedi: ' + (err.message || err), '');
        throw err;
    }
}
