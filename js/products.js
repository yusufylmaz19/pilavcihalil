let menuData = null;
let defaultCategories = [];
let managedCategories = [];

function categoryNameKey(label) {
    return String(label || '').replace(/^[^\p{L}\p{N}]+/u, '').trim().toLocaleLowerCase('tr-TR');
}

function applyCategories(settings, products = []) {
    const saved = settings?.categories;
    const source = Array.isArray(saved) ? saved : [...defaultCategories, { id: 'ozel', label: '⭐ Özel' }];
    const result = [];
    const knownIds = new Set();
    const add = raw => {
        if (!raw?.id || knownIds.has(raw.id)) return;
        const key = categoryNameKey(raw.label);
        const existing = result.find(c => categoryNameKey(c.label) === key);
        const ids = [raw.id, ...(raw.aliases || [])].filter(Boolean);
        ids.forEach(id => knownIds.add(id));
        if (existing) {
            existing.aliases = [...new Set([...(existing.aliases || []), ...ids.filter(id => id !== existing.id)])];
        } else {
            result.push({ id: raw.id, label: raw.label || raw.id, visible: raw.visible !== false, aliases: ids.filter(id => id !== raw.id) });
        }
    };
    source.forEach(add);
    products.forEach(p => {
        const id = p.category || 'ozel';
        if (!knownIds.has(id)) add({ id, label: p.categoryLabel || defaultCategories.find(c => c.id === id)?.label || id });
    });
    managedCategories = result;
}

async function loadCategories() {
    const [settings, products] = await Promise.all([getSettings(), getAllProducts()]);
    applyCategories(settings, products);
}

function categoryOptions(selected) {
    return managedCategories.map(c => `<option value="${escapeCategoryHtml(c.id)}" ${c.id === selected ? 'selected' : ''}>${escapeCategoryHtml(c.label)}</option>`).join('');
}

function escapeCategoryHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch]);
}

// Tüm ürünleri Firestore'dan çek, kategori sırasını defaultCategories'e göre koru
async function getMergedCategories(includeHidden = false) {
    const products = await getAllProducts();

    const catMap = {};
    const catOrder = [];

    // Kategori sırasını data.json'dan al
    managedCategories.forEach(cat => {
        catMap[cat.id] = { id: cat.id, label: cat.label, items: [] };
        catOrder.push(cat.id);
    });

    products.forEach(p => {
        const originalId = p.category || 'ozel';
        const catId = managedCategories.find(c => c.id === originalId || c.aliases?.includes(originalId))?.id || originalId;
        if (!catMap[catId]) {
            catMap[catId] = { id: catId, label: p.categoryLabel || '⭐ Özel', items: [] };
            catOrder.push(catId);
        }
        catMap[catId].items.push({ ...p, _catId: catId });
    });

    // Kategori içindeki ürünleri order'a göre sırala
    Object.values(catMap).forEach(cat => {
        cat.items.sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    return catOrder
        .filter(id => catMap[id] && catMap[id].items.length > 0 && (includeHidden || managedCategories.find(c => c.id === id)?.visible !== false))
        .map(id => catMap[id]);
}

function buildMenuPanel(categories) {
    const panel = document.getElementById('menu-panel');
    panel.innerHTML = '';

    categories.forEach(cat => {
        const storageKey = `cat_collapsed_${cat.id}`;
        const isCollapsed = localStorage.getItem(storageKey) === 'true';

        const title = document.createElement('div');
        title.className = `cat-title ${isCollapsed ? 'collapsed' : ''}`;
        title.innerHTML = `
            <span>${cat.label}</span>
            <span class="cat-toggle-icon">▼</span>
        `;

        const grid = document.createElement('div');
        grid.className = 'items-grid';
        if (isCollapsed) grid.style.display = 'none';

        title.onclick = () => {
            const nowCollapsed = grid.style.display !== 'none';
            grid.style.display = nowCollapsed ? 'none' : 'grid';
            title.classList.toggle('collapsed', nowCollapsed);
            localStorage.setItem(storageKey, nowCollapsed);
        };

        panel.appendChild(title);
        panel.appendChild(grid);

        cat.items.forEach(item => {
            item._catId = cat.id;
            item._catLabel = cat.label;
            const btn = document.createElement('div');
            btn.className = 'item-btn';
            if (item.color) {
                btn.setAttribute('data-color', item.color);
            }
            
            const hasPortions = item.hasPortions;
            
            btn.innerHTML = `
                <div class="item-main">
                    <div class="emoji">${item.emoji}</div>
                    <div class="name">${item.name}</div>
                    <div class="price">₺${item.price}</div>
                </div>
                ${hasPortions ? `
                <div class="item-portions" id="portions-${item.name.replace(/\s/g, '_')}">
                    <div class="ps-btn" data-p="0.5">Yarım</div>
                    ${item._catId === 'tavuklar' || item.category === 'tavuklar' ? '<div class="ps-btn" data-p="0.75">0.75</div>' : ''}
                    <div class="ps-btn" data-p="1">Tam</div>
                    <div class="ps-btn" data-p="1.5">1.5</div>
                </div>
                ` : ''}
            `;
            
            if (hasPortions) {
                const pBtns = btn.querySelectorAll('.ps-btn');
                pBtns.forEach(pBtn => {
                    pBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        addToCart(item, parseFloat(pBtn.dataset.p));
                        createRipple(e, pBtn);
                    });
                });
                
                // Porsiyonlu ürünün kartına tıklandığında da varsayılan olarak TAM ekle
                btn.addEventListener('click', (e) => {
                    addToCart(item, 1);
                    createRipple(e, btn);
                });
            } else {
                btn.addEventListener('click', (e) => {
                    addToCart(item, 1);
                    createRipple(e, btn);
                });
            }

            btn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showQuickEdit(e, item);
            });
            
            let longPressTimer;
            btn.addEventListener('touchstart', (e) => {
                longPressTimer = setTimeout(() => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    showQuickEdit({ clientX: touch.clientX, clientY: touch.clientY }, item);
                }, 600);
            }, { passive: false });
            btn.addEventListener('touchend', () => clearTimeout(longPressTimer));
            btn.addEventListener('touchmove', () => clearTimeout(longPressTimer));
            grid.appendChild(btn);
        });
        panel.appendChild(grid);
    });
}

function showQuickEdit(e, item) {
    closeQuickEdit();
    const popup = document.createElement('div');
    popup.className = 'quick-edit-popup';
    popup.id = 'quick-edit-popup';

    let x = e.clientX, y = e.clientY;
    popup.style.left = Math.min(x, window.innerWidth - 250) + 'px';
    popup.style.top = Math.min(y, window.innerHeight - 200) + 'px';

    popup.innerHTML = `
        <div class="qe-title">${item.emoji} ${item.name}</div>
        <div class="qe-row"><label>Ürün Adı</label><input type="text" id="qe-name" value="${item.name}" maxlength="80" /></div>
        <div class="qe-row"><label>Fiyat</label><input type="number" id="qe-price" value="${item.price}" min="0" /></div>
        <div class="qe-row"><label>Porsiyon Seçeneği</label><input type="checkbox" id="qe-hasPortions" ${item.hasPortions ? 'checked' : ''} style="width: auto; transform: scale(1.3); margin-left: 10px;" /></div>
        <div class="qe-row"><label>Açıklama</label><input type="text" id="qe-desc" value="${item.desc || ''}" /></div>
        <div class="qe-row"><label>Emoji</label><input type="text" id="qe-emoji" value="${item.emoji}" /></div>
        <div class="qe-row"><label>Renk</label>
            <select id="qe-color">
                <option value="">Varsayılan</option>
                <option value="white" ${item.color === 'white' ? 'selected' : ''}>Beyaz</option>
                <option value="nohut" ${item.color === 'nohut' ? 'selected' : ''}>Nohut Sarısı</option>
                <option value="misir" ${item.color === 'misir' ? 'selected' : ''}>Mısır Sarısı</option>
                <option value="kori" ${item.color === 'kori' ? 'selected' : ''}>Köri</option>
                <option value="kori-krema" ${item.color === 'kori-krema' ? 'selected' : ''}>Köri Kremalı</option>
                <option value="fajita" ${item.color === 'fajita' ? 'selected' : ''}>Fajita</option>
                <option value="soslu" ${item.color === 'soslu' ? 'selected' : ''}>Soslu</option>
                <option value="kola" ${item.color === 'kola' ? 'selected' : ''}>Kola</option>
                <option value="soda" ${item.color === 'soda' ? 'selected' : ''}>Soda</option>
                <option value="meyve" ${item.color === 'meyve' ? 'selected' : ''}>Meyve Suyu</option>
                <option value="salgam" ${item.color === 'salgam' ? 'selected' : ''}>Şalgam</option>
                <option value="su" ${item.color === 'su' ? 'selected' : ''}>Su</option>
                <option value="cay" ${item.color === 'cay' ? 'selected' : ''}>Çay</option>
            </select>
        </div>
        <div class="qe-btns">
            <button class="qe-cancel" onclick="closeQuickEdit()">İptal</button>
            <button class="qe-save" id="qe-save-btn">💾 Kaydet</button>
        </div>
    `;
    document.body.appendChild(popup);

    document.getElementById('qe-save-btn').addEventListener('click', async () => {
        const newName = document.getElementById('qe-name').value.trim();
        const newPrice = parseFloat(document.getElementById('qe-price').value) || 0;
        const newDesc = document.getElementById('qe-desc').value.trim();
        const newEmoji = document.getElementById('qe-emoji').value.trim() || item.emoji;
        const newHasPortions = document.getElementById('qe-hasPortions').checked;
        const newColor = document.getElementById('qe-color').value;

        if (!newName) {
            showToast('❌ Ürün adı boş olamaz!', '');
            return;
        }
        if (newName.includes('/')) {
            showToast('❌ Ürün adında / karakteri kullanılamaz!', '');
            return;
        }
        const products = await getAllProducts();
        if (newName.toLocaleLowerCase('tr-TR') !== item.name.toLocaleLowerCase('tr-TR') && products.some(p => p.name.toLocaleLowerCase('tr-TR') === newName.toLocaleLowerCase('tr-TR'))) {
            showToast('❌ Bu isimde bir ürün zaten var!', '');
            return;
        }

        await renameProduct(item.name, {
            name: newName,
            emoji: newEmoji,
            desc: newDesc,
            price: newPrice,
            category: item._catId || '',
            categoryLabel: item._catLabel || item.categoryLabel || '',
            isCustom: !!(item.isCustom || item._custom),
            hasPortions: newHasPortions,
            color: newColor,
            order: item.order ?? 999
        });

        closeQuickEdit();
        if (typeof loadCombos === 'function') await loadCombos();
        showToast(`✅ ${newName} güncellendi!`, 'success');
        await refreshMenu();
    });

    setTimeout(() => {
        document.addEventListener('click', quickEditOutsideHandler);
    }, 100);
}

function quickEditOutsideHandler(e) {
    const popup = document.getElementById('quick-edit-popup');
    if (popup && !popup.contains(e.target)) {
        closeQuickEdit();
    }
}

function closeQuickEdit() {
    const popup = document.getElementById('quick-edit-popup');
    if (popup) popup.remove();
    document.removeEventListener('click', quickEditOutsideHandler);
}

async function refreshMenu() {
    const merged = await getMergedCategories();
    buildMenuPanel(merged);
    if (typeof buildCombosPanel === 'function') {
        buildCombosPanel(merged);
    }
}

function openProductManager() {
    document.getElementById('prod-overlay').classList.add('show');
    renderProductList();
}

function closeProductManager() {
    document.getElementById('prod-overlay').classList.remove('show');
}

function closeProdOutside(e) {
    if (e.target === document.getElementById('prod-overlay')) closeProductManager();
}

async function renderProductList() {
    const body = document.getElementById('prod-body');
    const categories = await getMergedCategories(true);

    let html = '';
    categories.forEach(cat => {
        html += `<div class="prod-cat-title">${cat.label}</div>`;
        cat.items.forEach(item => {
            html += buildProdCard(item, cat.id);
        });
    });

    if (!html) {
        html = '<div style="text-align:center;padding:40px;color:var(--text2);">Henüz ürün yok.</div>';
    }

    body.innerHTML = html;
}

function buildProdCard(item, catId) {
    const escapedName = item.name.replace(/'/g, "\\'");
    return `
    <div class="prod-card" id="pcard-${item.name.replace(/\s/g, '_')}">
        <div class="prod-emoji">${item.emoji}</div>
        <div class="prod-info">
            <div class="prod-name">${item.name}</div>
            <div class="prod-desc">${item.desc || ''}</div>
        </div>
        <div class="prod-price-badge">₺${item.price}</div>
        <div class="prod-actions">
            <button title="Düzenle" onclick="toggleEditForm('${escapedName}', '${catId}')">✏️</button>
            <button class="del" title="Sil" onclick="deleteProduct('${escapedName}')">🗑️</button>
        </div>
    </div>`;
}

async function toggleEditForm(name, catId) {
    const cardId = 'pcard-' + name.replace(/\s/g, '_');
    const card = document.getElementById(cardId);
    if (!card) return;

    const existing = card.querySelector('.prod-edit-form');
    if (existing) {
        existing.classList.toggle('show');
        card.classList.toggle('editing');
        return;
    }

    // Ürün bilgisini Firestore'dan al
    const allProds = await getAllProducts();
    const currentItem = allProds.find(p => p.name === name) || { name, emoji: '🍽️', price: 0, desc: '', hasPortions: true, color: '', category: catId };

    const priceText = currentItem.price;
    const descText = currentItem.desc || '';
    const emojiText = currentItem.emoji || '🍽️';

    const form = document.createElement('div');
    form.className = 'prod-edit-form show';
    form.innerHTML = `
        <div class="prod-edit-row"><label>Ürün Adı</label><input type="text" id="pedit-name-${name.replace(/\s/g, '_')}" value="${currentItem.name}" maxlength="80" /></div>
        <div class="prod-edit-row"><label>Emoji</label><input type="text" id="pedit-emoji-${name.replace(/\s/g, '_')}" value="${emojiText}" /></div>
        <div class="prod-edit-row"><label>Porsiyon Seçeneği</label><input type="checkbox" id="pedit-hasPortions-${name.replace(/\s/g, '_')}" ${currentItem.hasPortions ? 'checked' : ''} style="width: auto; transform: scale(1.3); margin-left: 10px;" /></div>
        <div class="prod-edit-row"><label>Açıklama</label><input type="text" id="pedit-desc-${name.replace(/\s/g, '_')}" value="${descText}" /></div>
        <div class="prod-edit-row"><label>Fiyat (₺)</label><input type="number" id="pedit-price-${name.replace(/\s/g, '_')}" value="${priceText}" min="0" /></div>
        <div class="prod-edit-row"><label>Renk</label>
            <select id="pedit-color-${name.replace(/\s/g, '_')}">
                <option value="">Varsayılan</option>
                <option value="white" ${currentItem.color === 'white' ? 'selected' : ''}>Beyaz</option>
                <option value="nohut" ${currentItem.color === 'nohut' ? 'selected' : ''}>Nohut Sarısı</option>
                <option value="misir" ${currentItem.color === 'misir' ? 'selected' : ''}>Mısır Sarısı</option>
                <option value="kori" ${currentItem.color === 'kori' ? 'selected' : ''}>Köri</option>
                <option value="kori-krema" ${currentItem.color === 'kori-krema' ? 'selected' : ''}>Köri Kremalı</option>
                <option value="fajita" ${currentItem.color === 'fajita' ? 'selected' : ''}>Fajita</option>
                <option value="soslu" ${currentItem.color === 'soslu' ? 'selected' : ''}>Soslu</option>
                <option value="kola" ${currentItem.color === 'kola' ? 'selected' : ''}>Kola</option>
                <option value="soda" ${currentItem.color === 'soda' ? 'selected' : ''}>Soda</option>
                <option value="meyve" ${currentItem.color === 'meyve' ? 'selected' : ''}>Meyve Suyu</option>
                <option value="salgam" ${currentItem.color === 'salgam' ? 'selected' : ''}>Şalgam</option>
                <option value="su" ${currentItem.color === 'su' ? 'selected' : ''}>Su</option>
                <option value="cay" ${currentItem.color === 'cay' ? 'selected' : ''}>Çay</option>
            </select>
        </div>
        <div class="prod-edit-row"><label>Kategori</label>
            <select id="pedit-cat-${name.replace(/\s/g, '_')}">
                ${categoryOptions(currentItem.category || catId)}
            </select>
        </div>
        <div class="prod-edit-btns">
            <button class="btn-cancel-prod" onclick="this.closest('.prod-edit-form').classList.remove('show'); this.closest('.prod-card').classList.remove('editing');">İptal</button>
            <button class="btn-save-prod" onclick="saveEditedProduct('${name.replace(/'/g, "\\'")}', '${catId}')">💾 Kaydet</button>
        </div>
    `;

    card.appendChild(form);
    card.classList.add('editing');
    card.style.flexWrap = 'wrap';
}

async function saveEditedProduct(name, catId) {
    const safeName = name.replace(/\s/g, '_');
    const newName = document.getElementById('pedit-name-' + safeName)?.value.trim() || '';
    const emoji = document.getElementById('pedit-emoji-' + safeName)?.value.trim() || '🍽️';
    const desc = document.getElementById('pedit-desc-' + safeName)?.value.trim() || '';
    const price = parseFloat(document.getElementById('pedit-price-' + safeName)?.value) || 0;
    const newCat = document.getElementById('pedit-cat-' + safeName)?.value || catId;
    const hasPortions = document.getElementById('pedit-hasPortions-' + safeName)?.checked ?? false;
    const color = document.getElementById('pedit-color-' + safeName)?.value || '';

    if (!newName) {
        showToast('❌ Ürün adı boş olamaz!', '');
        return;
    }
    if (newName.includes('/')) {
        showToast('❌ Ürün adında / karakteri kullanılamaz!', '');
        return;
    }

    // Mevcut order değerini koru
    const allProds = await getAllProducts();
    const existing = allProds.find(p => p.name === name);
    if (newName.toLocaleLowerCase('tr-TR') !== name.toLocaleLowerCase('tr-TR') && allProds.some(p => p.name.toLocaleLowerCase('tr-TR') === newName.toLocaleLowerCase('tr-TR'))) {
        showToast('❌ Bu isimde bir ürün zaten var!', '');
        return;
    }
    const catLabel = managedCategories.find(c => c.id === newCat)?.label || '⭐ Özel';

    await renameProduct(name, {
        name: newName,
        emoji,
        desc,
        price,
        category: newCat,
        categoryLabel: catLabel,
        isCustom: existing ? (existing.isCustom || false) : false,
        hasPortions,
        color,
        order: existing?.order ?? 999
    });

    if (typeof loadCombos === 'function') await loadCombos();
    showToast(`✅ ${newName} kaydedildi!`, 'success');
    await renderProductList();
    await refreshMenu();
}

async function deleteProduct(name) {
    if (!confirm(`"${name}" ürününü silmek istediğinize emin misiniz?`)) return;
    await removeProduct(name);
    showToast(`🗑️ ${name} silindi`, '');
    await renderProductList();
    await refreshMenu();
}

function showAddProductForm() {
    const body = document.getElementById('prod-body');
    const existingForm = document.getElementById('add-product-form');
    if (existingForm) { existingForm.remove(); return; }

    const form = document.createElement('div');
    form.id = 'add-product-form';
    form.className = 'prod-card editing';
    form.style.flexWrap = 'wrap';
    form.style.borderColor = 'var(--green)';
    form.innerHTML = `
        <div style="width:100%;font-weight:700;font-size:0.9rem;margin-bottom:8px;">➕ Yeni Ürün Ekle</div>
        <div class="prod-edit-form show" style="border-top:none;margin-top:0;padding-top:0;">
            <div class="prod-edit-row"><label>İsim</label><input type="text" id="pnew-name" placeholder="Ürün adı" /></div>
            <div class="prod-edit-row"><label>Emoji</label><input type="text" id="pnew-emoji" value="🍽️" /></div>
            <div class="prod-edit-row"><label>Porsiyon Seçeneği</label><input type="checkbox" id="pnew-hasPortions" checked style="width: auto; transform: scale(1.3); margin-left: 10px;" /></div>
            <div class="prod-edit-row"><label>Açıklama</label><input type="text" id="pnew-desc" placeholder="Kısa açıklama" /></div>
            <div class="prod-edit-row"><label>Fiyat (₺)</label><input type="number" id="pnew-price" placeholder="0" min="0" /></div>
            <div class="prod-edit-row"><label>Renk</label>
                <select id="pnew-color">
                    <option value="">Varsayılan</option>
                    <option value="white">Beyaz</option>
                    <option value="nohut">Nohut Sarısı</option>
                    <option value="misir">Mısır Sarısı</option>
                    <option value="kori">Köri</option>
                    <option value="kori-krema">Köri Kremalı</option>
                    <option value="fajita">Fajita</option>
                    <option value="soslu">Soslu</option>
                    <option value="kola">Kola</option>
                    <option value="soda">Soda</option>
                    <option value="meyve">Meyve Suyu</option>
                    <option value="salgam">Şalgam</option>
                    <option value="su">Su</option>
                    <option value="cay">Çay</option>
                </select>
            </div>
            <div class="prod-edit-row"><label>Kategori</label>
                <select id="pnew-cat">
                    ${categoryOptions()}
                </select>
            </div>
            <div class="prod-edit-btns">
                <button class="btn-cancel-prod" onclick="document.getElementById('add-product-form').remove()">İptal</button>
                <button class="btn-save-prod" onclick="addNewProduct()">💾 Ekle</button>
            </div>
        </div>
    `;
    body.insertBefore(form, body.firstChild);
    document.getElementById('pnew-name').focus();
}

async function addNewProduct() {
    const name = document.getElementById('pnew-name').value.trim();
    const emoji = document.getElementById('pnew-emoji').value.trim() || '🍽️';
    const desc = document.getElementById('pnew-desc').value.trim();
    const price = parseFloat(document.getElementById('pnew-price').value) || 0;
    const category = document.getElementById('pnew-cat').value;
    const hasPortions = document.getElementById('pnew-hasPortions').checked;
    const color = document.getElementById('pnew-color').value;

    if (!name) {
        showToast('❌ Ürün adı boş olamaz!', '');
        return;
    }

    const allProds = await getAllProducts();
    if (allProds.some(p => p.name === name)) {
        showToast('❌ Bu isimde bir ürün zaten var!', '');
        return;
    }

    const catLabel = managedCategories.find(c => c.id === category)?.label || '⭐ Özel';

    await saveProduct({
        name, emoji, desc, price,
        category,
        categoryLabel: catLabel,
        isCustom: true,
        hasPortions,
        color,
        order: 9999
    });

    showToast(`✅ ${name} eklendi!`, 'success');
    document.getElementById('add-product-form')?.remove();
    await renderProductList();
    await refreshMenu();
}

function showCategoryManager() {
    const body = document.getElementById('prod-body');
    body.innerHTML = `<div class="category-manager">
        <div class="category-manager-head"><h3>Kategoriler</h3><button type="button" class="btn-cancel-prod" onclick="renderProductList()">Ürünlere dön</button></div>
        <p>Sıralamak için tutamacı sürükleyin. Gizlenen kategorinin ürünleri saklanır.</p>
        <div id="category-rows"></div>
        <form id="category-add-form" class="category-add-form">
            <input name="label" required maxlength="60" placeholder="Yeni kategori adı (emoji ekleyebilirsiniz)" aria-label="Yeni kategori adı">
            <button type="submit" class="btn-save-prod">+ Kategori ekle</button>
        </form>
    </div>`;
    document.getElementById('category-add-form').onsubmit = addCategory;
    renderCategoryRows();
}

function renderCategoryRows() {
    const rows = document.getElementById('category-rows');
    if (!rows) return;
    rows.innerHTML = '';
    managedCategories.forEach(cat => {
        const row = document.createElement('div');
        row.className = 'category-row';
        row.dataset.categoryId = cat.id;
        const handle = document.createElement('button');
        handle.type = 'button';
        handle.className = 'category-drag-handle';
        handle.textContent = '⠿';
        handle.title = 'Sürükleyerek sırala';
        handle.setAttribute('aria-label', `${cat.label} kategorisini sürükleyerek sırala`);
        handle.onpointerdown = event => startCategoryDrag(event, row, handle);
        row.appendChild(handle);
        const label = document.createElement('input');
        label.value = cat.label;
        label.maxLength = 60;
        label.setAttribute('aria-label', 'Kategori adı');
        row.appendChild(label);
        const button = (caption, title, handler, disabled = false) => {
            const el = document.createElement('button');
            el.type = 'button'; el.textContent = caption; el.title = title; el.disabled = disabled;
            el.onclick = handler; row.appendChild(el);
        };
        button('Kaydet', 'Adı güncelle', () => updateCategory(cat.id, label.value));
        button(cat.visible === false ? 'Göster' : 'Gizle', 'Menü görünürlüğü', () => toggleCategoryVisibility(cat.id));
        button('Sil', 'Kategoriyi sil', () => deleteCategory(cat.id));
        rows.appendChild(row);
    });
}

function startCategoryDrag(event, row, handle) {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    event.preventDefault();
    const rows = row.parentElement;
    const originalOrder = [...rows.children].map(el => el.dataset.categoryId);
    row.classList.add('dragging');
    const onMove = moveEvent => {
        const target = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY)?.closest('.category-row');
        if (!target || target === row || target.parentElement !== rows) return;
        const midpoint = target.getBoundingClientRect().top + target.offsetHeight / 2;
        rows.insertBefore(row, moveEvent.clientY < midpoint ? target : target.nextSibling);
    };
    const onEnd = async () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onEnd);
        window.removeEventListener('pointercancel', onCancel);
        row.classList.remove('dragging');
        const order = [...rows.children].map(el => el.dataset.categoryId);
        if (order.every((id, index) => id === originalOrder[index])) return;
        const byId = new Map(managedCategories.map(cat => [cat.id, cat]));
        try {
            await persistCategories(order.map(id => byId.get(id)));
            showToast('Kategori sırası kaydedildi.', 'success');
        } catch (error) {
            renderCategoryRows();
        }
    };
    const onCancel = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onEnd);
        window.removeEventListener('pointercancel', onCancel);
        renderCategoryRows();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onCancel);
}

async function persistCategories(next) {
    await saveSettings({ categories: next });
    managedCategories = next;
    renderCategoryRows();
    await refreshMenu();
}

async function addCategory(event) {
    event.preventDefault();
    const input = event.currentTarget.elements.label;
    const label = input.value.trim();
    if (!label) return;
    if (managedCategories.some(c => categoryNameKey(c.label) === categoryNameKey(label))) {
        showToast('Bu kategori adı zaten var.', ''); return;
    }
    const id = 'kategori-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    await persistCategories([{ id, label, visible: true }, ...managedCategories]);
    input.value = '';
    showToast('Kategori eklendi.', 'success');
}

async function updateCategory(id, rawLabel) {
    const label = rawLabel.trim();
    if (!label || managedCategories.some(c => c.id !== id && categoryNameKey(c.label) === categoryNameKey(label))) {
        showToast('Geçerli ve benzersiz bir kategori adı girin.', ''); return;
    }
    await persistCategories(managedCategories.map(c => c.id === id ? { ...c, label } : c));
    showToast('Kategori güncellendi.', 'success');
}

async function toggleCategoryVisibility(id) {
    await persistCategories(managedCategories.map(c => c.id === id ? { ...c, visible: c.visible === false } : c));
}

async function deleteCategory(id) {
    const products = await getAllProducts();
    const cat = managedCategories.find(c => c.id === id);
    if (products.some(p => p.category === id || cat?.aliases?.includes(p.category))) {
        showToast('Önce bu kategorideki ürünleri başka kategoriye taşıyın.', ''); return;
    }
    if (!cat || !confirm(`"${cat.label}" kategorisini silmek istiyor musunuz?`)) return;
    await persistCategories(managedCategories.filter(c => c.id !== id));
    showToast('Kategori silindi.', 'success');
}
