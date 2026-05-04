let menuData = null;
let defaultCategories = [];

async function getMergedCategories() {
    const overrides = await getAllProducts();
    const overrideMap = {};
    const customProducts = [];
    overrides.forEach(p => {
        if (p.isCustom) {
            customProducts.push(p);
        } else {
            overrideMap[p.name] = p;
        }
    });

    const merged = defaultCategories.map(cat => {
        const items = cat.items.map(item => {
            const ov = overrideMap[item.name];
            if (ov) {
                return { ...item, price: ov.price, desc: ov.desc, emoji: ov.emoji, hasPortions: ov.hasPortions !== undefined ? ov.hasPortions : item.hasPortions, _modified: true };
            }
            return { ...item };
        });
        return { ...cat, items };
    });

    const customByCat = {};
    customProducts.forEach(p => {
        const catId = p.category || 'ozel';
        if (!customByCat[catId]) customByCat[catId] = [];
        customByCat[catId].push(p);
    });

    for (const [catId, products] of Object.entries(customByCat)) {
        const existingCat = merged.find(c => c.id === catId);
        if (existingCat) {
            products.forEach(p => {
                existingCat.items.push({ name: p.name, emoji: p.emoji, desc: p.desc, price: p.price, hasPortions: p.hasPortions, _modified: true, _custom: true });
            });
        } else {
            merged.push({
                id: catId,
                label: '⭐ Özel Ürünler',
                items: products.map(p => ({ name: p.name, emoji: p.emoji, desc: p.desc, price: p.price, hasPortions: p.hasPortions, _modified: true, _custom: true }))
            });
        }
    }

    return merged;
}

function buildMenuPanel(categories) {
    const panel = document.getElementById('menu-panel');
    panel.innerHTML = '';

    categories.forEach(cat => {
        const title = document.createElement('div');
        title.className = 'cat-title';
        title.textContent = cat.label;
        panel.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'items-grid';

        cat.items.forEach(item => {
            item._catId = cat.id;
            const btn = document.createElement('div');
            btn.className = 'item-btn';
            
            const hasPortions = item.hasPortions;
            
            btn.innerHTML = `
                <div class="item-main">
                    <div class="emoji">${item.emoji}</div>
                    <div class="name">${item.name}</div>
                    <div class="price">₺${item.price}</div>
                </div>
                ${hasPortions ? `
                <div class="item-portions" id="portions-${item.name.replace(/\\s/g, '_')}">
                    <div class="ps-btn" data-p="0.5">Yarım</div>
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
        <div class="qe-row"><label>Fiyat</label><input type="number" id="qe-price" value="${item.price}" min="0" /></div>
        <div class="qe-row"><label>Açıklama</label><input type="text" id="qe-desc" value="${item.desc || ''}" /></div>
        <div class="qe-row"><label>Emoji</label><input type="text" id="qe-emoji" value="${item.emoji}" /></div>
        <div class="qe-row"><label>Porsiyon Seçeneği</label><input type="checkbox" id="qe-hasPortions" ${item.hasPortions ? 'checked' : ''} style="width:auto; margin-left: 10px; transform: scale(1.3);" /></div>
        <div class="qe-btns">
            <button class="qe-cancel" onclick="closeQuickEdit()">İptal</button>
            <button class="qe-save" id="qe-save-btn">💾 Kaydet</button>
        </div>
    `;
    document.body.appendChild(popup);

    document.getElementById('qe-save-btn').addEventListener('click', async () => {
        const newPrice = parseFloat(document.getElementById('qe-price').value) || 0;
        const newDesc = document.getElementById('qe-desc').value.trim();
        const newEmoji = document.getElementById('qe-emoji').value.trim() || item.emoji;
        const newHasPortions = document.getElementById('qe-hasPortions').checked;

        await saveProduct({
            name: item.name,
            emoji: newEmoji,
            desc: newDesc,
            price: newPrice,
            category: item._catId || '',
            isCustom: !!item._custom,
            hasPortions: newHasPortions
        });

        closeQuickEdit();
        showToast(`✅ ${item.name} güncellendi!`, 'success');
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
    const overrides = await getAllProducts();
    const overrideMap = {};
    overrides.forEach(p => { overrideMap[p.name] = p; });

    let html = '';

    defaultCategories.forEach(cat => {
        html += `<div class="prod-cat-title">${cat.label}</div>`;
        cat.items.forEach(item => {
            const ov = overrideMap[item.name];
            const isModified = !!ov && !ov.isCustom;
            const displayItem = ov ? { ...item, price: ov.price, desc: ov.desc, emoji: ov.emoji } : item;
            html += buildProdCard(displayItem, cat.id, isModified, false);
        });
    });

    const customProducts = overrides.filter(p => p.isCustom);
    if (customProducts.length > 0) {
        html += `<div class="prod-cat-title">⭐ Özel (Eklenen) Ürünler</div>`;
        customProducts.forEach(p => {
            html += buildProdCard({ name: p.name, emoji: p.emoji, desc: p.desc, price: p.price, _catId: p.category }, p.category, true, true);
        });
    }

    body.innerHTML = html;
}

function buildProdCard(item, catId, isModified, isCustom) {
    const modBadge = isModified ? `<span class="prod-modified-badge">${isCustom ? 'ÖZEL' : 'DÜZENLENDI'}</span>` : '';
    const escapedName = item.name.replace(/'/g, "\\\\'");
    return `
    <div class="prod-card ${isCustom ? 'custom' : ''}" id="pcard-${item.name.replace(/\\s/g, '_')}">
        <div class="prod-emoji">${item.emoji}</div>
        <div class="prod-info">
            <div class="prod-name">${item.name}${modBadge}</div>
            <div class="prod-desc">${item.desc || ''}</div>
        </div>
        <div class="prod-price-badge">₺${item.price}</div>
        <div class="prod-actions">
            <button title="Düzenle" onclick="toggleEditForm('${escapedName}', '${catId}', ${isCustom})">✏️</button>
            ${isCustom ? `<button class="del" title="Sil" onclick="deleteCustomProduct('${escapedName}')">🗑️</button>` : ''}
            ${isModified && !isCustom ? `<button title="Varsayılana dön" onclick="resetProduct('${escapedName}')">↩️</button>` : ''}
        </div>
    </div>`;
}

function toggleEditForm(name, catId, isCustom) {
    const cardId = 'pcard-' + name.replace(/\\s/g, '_');
    const card = document.getElementById(cardId);
    if (!card) return;

    const existing = card.querySelector('.prod-edit-form');
    if (existing) {
        existing.classList.toggle('show');
        card.classList.toggle('editing');
        return;
    }

    let currentItem = null;
    defaultCategories.forEach(cat => {
        cat.items.forEach(item => {
            if (item.name === name) currentItem = { ...item };
        });
    });

    const priceText = card.querySelector('.prod-price-badge').textContent.replace('₺', '');
    const descText = card.querySelector('.prod-desc').textContent;
    const emojiText = card.querySelector('.prod-emoji').textContent.trim();

    const form = document.createElement('div');
    form.className = 'prod-edit-form show';
    form.innerHTML = `
        <div class="prod-edit-row"><label>Emoji</label><input type="text" id="pedit-emoji-${name.replace(/\\s/g, '_')}" value="${emojiText}" /></div>
        <div class="prod-edit-row"><label>Porsiyon Seçeneği</label><input type="checkbox" id="pedit-hasPortions-${name.replace(/\\s/g, '_')}" ${currentItem.hasPortions ? 'checked' : ''} style="width: auto; transform: scale(1.3); margin-left: 10px;" /></div>
        <div class="prod-edit-row"><label>Açıklama</label><input type="text" id="pedit-desc-${name.replace(/\\s/g, '_')}" value="${descText}" /></div>
        <div class="prod-edit-row"><label>Fiyat (₺)</label><input type="number" id="pedit-price-${name.replace(/\\s/g, '_')}" value="${priceText}" min="0" /></div>
        ${isCustom ? `<div class="prod-edit-row"><label>Kategori</label>
            <select id="pedit-cat-${name.replace(/\\s/g, '_')}">
                ${defaultCategories.map(c => `<option value="${c.id}" ${c.id === catId ? 'selected' : ''}>${c.label}</option>`).join('')}
                <option value="ozel" ${catId === 'ozel' ? 'selected' : ''}>⭐ Özel</option>
            </select>
        </div>` : ''}
        <div class="prod-edit-btns">
            ${!isCustom ? `<button class="btn-reset-prod" onclick="resetProduct('${name.replace(/'/g, "\\\\'")}')">↩️ Varsayılan</button>` : ''}
            <button class="btn-cancel-prod" onclick="this.closest('.prod-edit-form').classList.remove('show'); this.closest('.prod-card').classList.remove('editing');">İptal</button>
            <button class="btn-save-prod" onclick="saveEditedProduct('${name.replace(/'/g, "\\\\'")}', '${catId}', ${isCustom})">💾 Kaydet</button>
        </div>
    `;

    card.appendChild(form);
    card.classList.add('editing');
    card.style.flexWrap = 'wrap';
}

async function saveEditedProduct(name, catId, isCustom) {
    const safeName = name.replace(/\\s/g, '_');
    const emoji = document.getElementById('pedit-emoji-' + safeName)?.value.trim() || '🍽️';
    const desc = document.getElementById('pedit-desc-' + safeName)?.value.trim() || '';
    const price = parseFloat(document.getElementById('pedit-price-' + safeName)?.value) || 0;
    const newCat = document.getElementById('pedit-cat-' + safeName)?.value || catId;
    const hasPortions = document.getElementById('pedit-hasPortions-' + safeName)?.checked ?? false;

    await saveProduct({
        name: name,
        emoji: emoji,
        desc: desc,
        price: price,
        category: newCat,
        isCustom: isCustom,
        hasPortions: hasPortions
    });

    showToast(`✅ ${name} kaydedildi!`, 'success');
    await renderProductList();
    await refreshMenu();
}

async function resetProduct(name) {
    await removeProduct(name);
    showToast(`↩️ ${name} varsayılana döndürüldü`, '');
    await renderProductList();
    await refreshMenu();
}

async function deleteCustomProduct(name) {
    if (!confirm(`"${name}" ürününü silmek istediğinize emin misiniz?`)) return;
    await removeProduct(name);
    showToast(`🗑️ ${name} silindi`, '');
    await renderProductList();
    await refreshMenu();
}

async function resetAllProducts() {
    if (!confirm('Tüm ürün değişikliklerini silip varsayılana dönmek istediğinize emin misiniz?')) return;
    await clearAllProducts();
    showToast('🔄 Tüm ürünler varsayılana döndürüldü', 'success');
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
            <div class="prod-edit-row"><label>Kategori</label>
                <select id="pnew-cat">
                    ${defaultCategories.map(c => `<option value="${c.id}">${c.label}</option>`).join('')}
                    <option value="ozel">⭐ Özel</option>
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

    if (!name) {
        showToast('❌ Ürün adı boş olamaz!', '');
        return;
    }

    const allProds = await getAllProducts();
    const exists = allProds.some(p => p.name === name) || defaultCategories.some(c => c.items.some(i => i.name === name));
    if (exists) {
        showToast('❌ Bu isimde bir ürün zaten var!', '');
        return;
    }

    await saveProduct({
        name, emoji, desc, price, category, isCustom: true, hasPortions
    });

    showToast(`✅ ${name} eklendi!`, 'success');
    await renderProductList();
    await refreshMenu();
}
