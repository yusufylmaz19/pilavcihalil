const DB_NAME = 'MaxPilavDB';
const DB_VERSION = 2;
const STORE_NAME = 'receipts';
const PRODUCT_STORE = 'products';
let db = null;

function openDB() {
    return new Promise((resolve, reject) => {
        if (db) { resolve(db); return; }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const database = e.target.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('date', 'date', { unique: false });
            }
            if (!database.objectStoreNames.contains(PRODUCT_STORE)) {
                database.createObjectStore(PRODUCT_STORE, { keyPath: 'name' });
            }
        };
        request.onsuccess = (e) => {
            db = e.target.result;
            resolve(db);
        };
        request.onerror = (e) => {
            console.error('IndexedDB açılamadı:', e.target.error);
            reject(e.target.error);
        };
    });
}

// ── Receipt CRUD ──
async function getHistory() {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => {
            const results = request.result || [];
            results.sort((a, b) => new Date(b.date) - new Date(a.date));
            resolve(results);
        };
        request.onerror = () => reject(request.error);
    });
}

async function addReceipt(receipt) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.add(receipt);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function removeReceipt(id) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function getReceiptCount() {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// ── Product CRUD (IndexedDB) ──
async function getAllProducts() {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(PRODUCT_STORE, 'readonly');
        const store = tx.objectStore(PRODUCT_STORE);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

async function saveProduct(product) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(PRODUCT_STORE, 'readwrite');
        const store = tx.objectStore(PRODUCT_STORE);
        const request = store.put(product);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function removeProduct(name) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(PRODUCT_STORE, 'readwrite');
        const store = tx.objectStore(PRODUCT_STORE);
        const request = store.delete(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function clearAllProducts() {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction(PRODUCT_STORE, 'readwrite');
        const store = tx.objectStore(PRODUCT_STORE);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}
