// ═══ HIZLI KOMBO SİSTEMİ ═══

const DEFAULT_COMBOS = [
    // ── DÜZ KOMBOLAR (Pilav + Tavuk) ──
    {
        id: 'fajita-menu',
        name: 'Fajita Menü',
        emoji: '🌯',
        group: 'duz',
        color: 'fajita',
        items: [
            { name: 'Pilav Porsiyon', portion: 1 },
            { name: 'Fajita Tavuk', portion: 1 }
        ]
    },
    {
        id: 'soslu-menu',
        name: 'Soslu Baharatlı Menü',
        emoji: '🌶️',
        group: 'duz',
        color: 'soslu',
        items: [
            { name: 'Pilav Porsiyon', portion: 1 },
            { name: 'Soslu Baharatlı Tavuk', portion: 1 }
        ]
    },
    {
        id: 'kori-menu',
        name: 'Köri Menü',
        emoji: '🍛',
        group: 'duz',
        color: 'kori',
        items: [
            { name: 'Pilav Porsiyon', portion: 1 },
            { name: 'Köri Tavuk', portion: 1 }
        ]
    },
    {
        id: 'kori-kremali-menu',
        name: 'Köri Kremalı Menü',
        emoji: '🥛',
        group: 'duz',
        color: 'kori-krema',
        items: [
            { name: 'Pilav Porsiyon', portion: 1 },
            { name: 'Köri Kremalı Tavuk', portion: 1 }
        ]
    },
    {
        id: 'tiftik-tavuk-menu',
        name: 'Tiftik Tavuk Menü',
        emoji: '🍗',
        group: 'duz',
        color: 'white',
        items: [
            { name: 'Pilav Porsiyon', portion: 1 },
            { name: 'Tavuk', portion: 1 }
        ]
    },

    // ── NOHUTLU KOMBOLAR ──
    {
        id: 'nohutlu-pilav',
        name: 'Nohutlu Pilav',
        emoji: '🍛',
        group: 'nohutlu',
        color: 'nohut',
        items: [
            { name: 'Pilav Porsiyon', portion: 1 },
            { name: 'Nohut', portion: 1 }
        ]
    },
    {
        id: 'nohutlu-fajita',
        name: 'Nohutlu Fajita Menü',
        emoji: '🌯',
        group: 'nohutlu',
        color: 'fajita',
        items: [
            { name: 'Pilav Porsiyon', portion: 1 },
            { name: 'Fajita Tavuk', portion: 1 },
            { name: 'Nohut', portion: 1 }
        ]
    },
    {
        id: 'nohutlu-soslu',
        name: 'Nohutlu Soslu Menü',
        emoji: '🌶️',
        group: 'nohutlu',
        color: 'soslu',
        items: [
            { name: 'Pilav Porsiyon', portion: 1 },
            { name: 'Soslu Baharatlı Tavuk', portion: 1 },
            { name: 'Nohut', portion: 1 }
        ]
    },
    {
        id: 'nohutlu-kori',
        name: 'Nohutlu Köri Menü',
        emoji: '🍛',
        group: 'nohutlu',
        color: 'kori',
        items: [
            { name: 'Pilav Porsiyon', portion: 1 },
            { name: 'Köri Tavuk', portion: 1 },
            { name: 'Nohut', portion: 1 }
        ]
    },
    {
        id: 'nohutlu-kori-kremali',
        name: 'Nohutlu Köri Kremalı Menü',
        emoji: '🥛',
        group: 'nohutlu',
        color: 'kori-krema',
        items: [
            { name: 'Pilav Porsiyon', portion: 1 },
            { name: 'Köri Kremalı Tavuk', portion: 1 },
            { name: 'Nohut', portion: 1 }
        ]
    },
    {
        id: 'nohutlu-tiftik-tavuk',
        name: 'Nohutlu Tiftik Tavuk Menü',
        emoji: '🍗',
        group: 'nohutlu',
        color: 'white',
        items: [
            { name: 'Pilav Porsiyon', portion: 1 },
            { name: 'Tavuk', portion: 1 },
            { name: 'Nohut', portion: 1 }
        ]
    },

    // ── MISIRLI KOMBOLAR ──
    {
        id: 'misirli-pilav',
        name: 'Mısırlı Pilav',
        emoji: '🌽',
        group: 'misirli',
        color: 'misir',
        items: [
            { name: 'Pilav Porsiyon', portion: 1 },
            { name: 'Mısır', portion: 1 }
        ]
    },
    {
        id: 'misirli-fajita',
        name: 'Mısırlı Fajita Menü',
        emoji: '🌯',
        group: 'misirli',
        color: 'fajita',
        items: [
            { name: 'Pilav Porsiyon', portion: 1 },
            { name: 'Fajita Tavuk', portion: 1 },
            { name: 'Mısır', portion: 1 }
        ]
    },
    {
        id: 'misirli-soslu',
        name: 'Mısırlı Soslu Menü',
        emoji: '🌶️',
        group: 'misirli',
        color: 'soslu',
        items: [
            { name: 'Pilav Porsiyon', portion: 1 },
            { name: 'Soslu Baharatlı Tavuk', portion: 1 },
            { name: 'Mısır', portion: 1 }
        ]
    },
    {
        id: 'misirli-kori',
        name: 'Mısırlı Köri Menü',
        emoji: '🍛',
        group: 'misirli',
        color: 'kori',
        items: [
            { name: 'Pilav Porsiyon', portion: 1 },
            { name: 'Köri Tavuk', portion: 1 },
            { name: 'Mısır', portion: 1 }
        ]
    },
    {
        id: 'misirli-kori-kremali',
        name: 'Mısırlı Köri Kremalı Menü',
        emoji: '🥛',
        group: 'misirli',
        color: 'kori-krema',
        items: [
            { name: 'Pilav Porsiyon', portion: 1 },
            { name: 'Köri Kremalı Tavuk', portion: 1 },
            { name: 'Mısır', portion: 1 }
        ]
    },
    {
        id: 'misirli-tiftik-tavuk',
        name: 'Mısırlı Tiftik Tavuk Menü',
        emoji: '🍗',
        group: 'misirli',
        color: 'white',
        items: [
            { name: 'Pilav Porsiyon', portion: 1 },
            { name: 'Tavuk', portion: 1 },
            { name: 'Mısır', portion: 1 }
        ]
    }
];

const COMBO_GROUP_LABELS = {
    'duz': '⚡ Düz Kombolar',
    'nohutlu': '🧆 Nohutlu Kombolar',
    'misirli': '🌽 Mısırlı Kombolar'
};

let activeCombos = [];

// ── Komboları yükle (DB'den veya varsayılanlardan) ──
async function loadCombos() {
    try {
        const saved = await getAllCombos();
        if (saved.length > 0) {
            activeCombos = saved;
        } else {
            activeCombos = JSON.parse(JSON.stringify(DEFAULT_COMBOS));
            // İlk kurulumda varsayılanları DB'ye kaydet
            for (const combo of activeCombos) {
                await saveCombo(combo);
            }
        }
    } catch (err) {
        console.error('Kombo yükleme hatası:', err);
        activeCombos = JSON.parse(JSON.stringify(DEFAULT_COMBOS));
    }
}

// ── Kombo fiyatını hesapla (güncel ürün fiyatları ile) ──
function getComboPrice(combo, categories) {
    let total = 0;
    combo.items.forEach(ci => {
        const product = findProductByName(ci.name, categories);
        if (product) {
            total += Math.round(product.price * ci.portion);
        }
    });
    return total;
}

// ── Ürünü kategorilerde bul ──
function findProductByName(name, categories) {
    for (const cat of categories) {
        for (const item of cat.items) {
            if (item.name === name) return item;
        }
    }
    return null;
}

// ── Komboyu sepete ekle ──
function addComboToCart(comboId, categories) {
    const combo = activeCombos.find(c => c.id === comboId);
    if (!combo) return;

    let addedCount = 0;
    combo.items.forEach(ci => {
        const product = findProductByName(ci.name, categories);
        if (product) {
            addToCart(product, ci.portion);
            addedCount++;
        }
    });

    if (addedCount > 0) {
        showToast(`⚡ ${combo.emoji} ${combo.name} eklendi (${addedCount} ürün)`, 'success');
    }
}

// ── Kombo panelini oluştur (grup başlıklarıyla) ──
function buildCombosPanel(categories) {
    const panel = document.getElementById('menu-panel');
    if (!panel || activeCombos.length === 0) return;

    // Komboları gruplara ayır
    const groups = {};
    const groupOrder = ['duz', 'nohutlu', 'misirli'];

    activeCombos.forEach(combo => {
        const g = combo.group || 'duz';
        if (!groups[g]) groups[g] = [];
        groups[g].push(combo);
    });

    // Ana container
    let comboContainer = document.getElementById('combo-container');
    if (!comboContainer) {
        comboContainer = document.createElement('div');
        comboContainer.id = 'combo-container';
        panel.insertBefore(comboContainer, panel.firstChild);
    } else {
        comboContainer.innerHTML = '';
    }

    groupOrder.forEach(groupId => {
        const combos = groups[groupId];
        if (!combos || combos.length === 0) return;

        const storageKey = `combo_collapsed_${groupId}`;
        const isCollapsed = localStorage.getItem(storageKey) === 'true';

        // Grup başlığı
        const title = document.createElement('div');
        title.className = `cat-title combo-cat-title ${isCollapsed ? 'collapsed' : ''}`;
        title.innerHTML = `
            <span>${COMBO_GROUP_LABELS[groupId] || `⚡ ${groupId}`}</span>
            <span class="cat-toggle-icon">▼</span>
        `;
        
        // Grid
        const grid = document.createElement('div');
        grid.className = 'items-grid combo-grid';
        if (isCollapsed) grid.style.display = 'none';

        title.onclick = () => {
            const nowCollapsed = grid.style.display !== 'none';
            grid.style.display = nowCollapsed ? 'none' : 'grid';
            title.classList.toggle('collapsed', nowCollapsed);
            localStorage.setItem(storageKey, nowCollapsed);
        };

        comboContainer.appendChild(title);

        combos.forEach(combo => {
            const totalPrice = getComboPrice(combo, categories);
            const itemNames = combo.items.map(ci => {
                const pLabel = ci.portion === 0.5 ? '½' : ci.portion === 1.5 ? '1½' : '';
                return pLabel ? `${ci.name} (${pLabel})` : ci.name;
            });

            const btn = document.createElement('div');
            btn.className = 'item-btn combo-btn';
            if (combo.color) {
                btn.setAttribute('data-color', combo.color);
            }
            btn.innerHTML = `
                <div class="item-main">
                    <div class="emoji">${combo.emoji}</div>
                    <div class="name">${combo.name}</div>
                    <div class="price">₺${totalPrice}</div>
                </div>
                <div class="combo-contents">${itemNames.join(' + ')}</div>
            `;

            btn.addEventListener('click', (e) => {
                addComboToCart(combo.id, categories);
                createRipple(e, btn);
            });

            btn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                openComboEditor(combo.id);
            });

            grid.appendChild(btn);
        });

        comboContainer.appendChild(grid);
    });
}

// ═══ KOMBO YÖNETİMİ ═══

function openComboManager() {
    document.getElementById('combo-overlay').classList.add('show');
    renderComboList();
}

function closeComboManager() {
    document.getElementById('combo-overlay').classList.remove('show');
}

function closeComboOutside(e) {
    if (e.target === document.getElementById('combo-overlay')) closeComboManager();
}

async function renderComboList() {
    const body = document.getElementById('combo-body');
    if (!body) return;

    const categories = await getMergedCategories();
    let html = '';
    let currentGroup = '';

    activeCombos.forEach(combo => {
        const g = combo.group || 'duz';
        if (g !== currentGroup) {
            currentGroup = g;
            html += `<div class="prod-cat-title">${COMBO_GROUP_LABELS[g] || g}</div>`;
        }

        const totalPrice = getComboPrice(combo, categories);
        const itemList = combo.items.map(ci => {
            const p = findProductByName(ci.name, categories);
            const pLabel = ci.portion === 0.5 ? 'Yarım' : ci.portion === 1.5 ? '1.5' : 'Tam';
            const unitPrice = p ? Math.round(p.price * ci.portion) : 0;
            return `<span class="combo-item-tag">${ci.name} (${pLabel}) ₺${unitPrice}</span>`;
        }).join('');

        html += `
        <div class="combo-card" id="combo-card-${combo.id}">
            <div class="combo-card-header">
                <span class="combo-card-emoji">${combo.emoji}</span>
                <span class="combo-card-name">${combo.name}</span>
                <span class="combo-card-price">₺${totalPrice}</span>
            </div>
            <div class="combo-card-items">${itemList}</div>
            <div class="combo-card-actions">
                <button onclick="openComboEditor('${combo.id}')" title="Düzenle">✏️</button>
                <button class="del" onclick="deleteCombo('${combo.id}')" title="Sil">🗑️</button>
            </div>
        </div>`;
    });

    if (activeCombos.length === 0) {
        html = '<div style="text-align:center;padding:40px;color:var(--text2);">Henüz kombo yok. "➕ Yeni Kombo" ile ekleyin.</div>';
    }

    body.innerHTML = html;
}

async function deleteCombo(id) {
    if (!confirm('Bu komboyu silmek istediğinize emin misiniz?')) return;
    await removeCombo(id);
    activeCombos = activeCombos.filter(c => c.id !== id);
    showToast('🗑️ Kombo silindi', '');
    await renderComboList();
    await refreshMenu();
}

async function resetAllCombos() {
    if (!confirm('Tüm komboları varsayılana döndürmek istediğinize emin misiniz?')) return;
    await clearAllCombos();
    activeCombos = JSON.parse(JSON.stringify(DEFAULT_COMBOS));
    for (const combo of activeCombos) {
        await saveCombo(combo);
    }
    showToast('🔄 Kombolar varsayılana döndürüldü', 'success');
    await renderComboList();
    await refreshMenu();
}

// ── Kombo Ekleme / Düzenleme Formu ──
function openComboEditor(comboId) {
    const existing = comboId ? activeCombos.find(c => c.id === comboId) : null;
    const isNew = !existing;

    const overlay = document.getElementById('combo-edit-overlay');
    overlay.classList.add('show');

    const title = document.getElementById('combo-edit-title');
    title.textContent = isNew ? '➕ Yeni Kombo Oluştur' : `✏️ ${existing.name} Düzenle`;

    document.getElementById('combo-edit-id').value = existing ? existing.id : '';
    document.getElementById('combo-edit-name').value = existing ? existing.name : '';
    document.getElementById('combo-edit-emoji').value = existing ? existing.emoji : '🍛';

    // Grup seçimi
    const groupSelect = document.getElementById('combo-edit-group');
    if (groupSelect) {
        groupSelect.value = existing ? (existing.group || 'duz') : 'duz';
    }

    // Renk seçimi
    const colorSelect = document.getElementById('combo-edit-color');
    if (colorSelect) {
        colorSelect.value = existing ? (existing.color || '') : '';
    }

    // Ürün seçim listesini oluştur
    renderComboItemSelector(existing ? existing.items : []);
}

function closeComboEditor() {
    document.getElementById('combo-edit-overlay').classList.remove('show');
}

function closeComboEditOutside(e) {
    if (e.target === document.getElementById('combo-edit-overlay')) closeComboEditor();
}

function renderComboItemSelector(selectedItems) {
    const container = document.getElementById('combo-items-list');
    container.innerHTML = '';

    // Mevcut seçili ürünleri göster
    selectedItems.forEach((ci, index) => {
        container.appendChild(createComboItemRow(ci, index));
    });

    // "Ürün Ekle" butonu
    const addBtn = document.createElement('button');
    addBtn.className = 'combo-add-item-btn';
    addBtn.textContent = '➕ Ürün Ekle';
    addBtn.onclick = () => {
        const newRow = createComboItemRow({ name: '', portion: 1 }, container.querySelectorAll('.combo-item-row').length);
        container.insertBefore(newRow, addBtn);
    };
    container.appendChild(addBtn);
}

function createComboItemRow(ci, index) {
    const row = document.createElement('div');
    row.className = 'combo-item-row';

    // Tüm ürünlerin listesi
    let options = '<option value="">Ürün Seçin...</option>';
    if (defaultCategories) {
        defaultCategories.forEach(cat => {
            cat.items.forEach(item => {
                const selected = item.name === ci.name ? 'selected' : '';
                options += `<option value="${item.name}" ${selected}>${item.emoji} ${item.name} (₺${item.price})</option>`;
            });
        });
    }

    row.innerHTML = `
        <select class="combo-item-select" data-index="${index}">
            ${options}
        </select>
        <select class="combo-portion-select" data-index="${index}">
            <option value="0.5" ${ci.portion === 0.5 ? 'selected' : ''}>Yarım</option>
            <option value="1" ${ci.portion === 1 ? 'selected' : ''}>Tam</option>
            <option value="1.5" ${ci.portion === 1.5 ? 'selected' : ''}>1.5</option>
        </select>
        <button class="combo-remove-item" onclick="this.parentElement.remove()">✕</button>
    `;

    return row;
}

async function saveComboFromEditor() {
    const idInput = document.getElementById('combo-edit-id').value.trim();
    const name = document.getElementById('combo-edit-name').value.trim();
    const emoji = document.getElementById('combo-edit-emoji').value.trim() || '🍛';
    const group = document.getElementById('combo-edit-group')?.value || 'duz';
    const color = document.getElementById('combo-edit-color')?.value || '';

    if (!name) {
        showToast('❌ Kombo adı boş olamaz!', '');
        return;
    }

    // Seçili ürünleri topla
    const rows = document.querySelectorAll('.combo-item-row');
    const items = [];
    rows.forEach(row => {
        const productName = row.querySelector('.combo-item-select')?.value;
        const portion = parseFloat(row.querySelector('.combo-portion-select')?.value) || 1;
        if (productName) {
            items.push({ name: productName, portion: portion });
        }
    });

    if (items.length < 2) {
        showToast('❌ Kombo en az 2 ürün içermelidir!', '');
        return;
    }

    // ID oluştur (yeni ise)
    const id = idInput || name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-üöçğışİÜÖÇĞŞ]/gi, '')
        .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ş/g, 's')
        + '-' + Date.now();

    const combo = { id, name, emoji, group, color, items };

    await saveCombo(combo);

    // activeCombos'u güncelle
    const existingIdx = activeCombos.findIndex(c => c.id === id);
    if (existingIdx >= 0) {
        activeCombos[existingIdx] = combo;
    } else {
        activeCombos.push(combo);
    }

    showToast(`✅ ${name} kaydedildi!`, 'success');
    closeComboEditor();

    // Kombo yönetim modalı açıksa listeyi yenile
    if (document.getElementById('combo-overlay')?.classList.contains('show')) {
        await renderComboList();
    }
    await refreshMenu();
}
