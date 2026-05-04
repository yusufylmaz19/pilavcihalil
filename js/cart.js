let cart = [];

function getPortionLabel(p) {
    if (p === 0.5) return '½';
    if (p === 1) return '1';
    if (p === 1.5) return '1½';
    return p.toString();
}

function getPortionText(p) {
    if (p === 0.5) return 'Yarım';
    if (p === 1) return 'Tam';
    if (p === 1.5) return '1.5';
    return p.toString();
}

function calcItemPrice(item) {
    return Math.round(item.basePrice * item.portion);
}

function setPaymentType(type) {
    document.getElementById('payment-type').value = type;
    const btns = document.querySelectorAll('.pay-seg-btn');
    if(btns.length >= 2) {
        btns[0].classList.toggle('active', type === 'nakit');
        btns[1].classList.toggle('active', type === 'kart');
    }
}

function addToCart(item, portion) {
    const existing = cart.find(c => c.name === item.name && c.portion === portion);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({
            name: item.name,
            emoji: item.emoji,
            basePrice: item.price,
            portion: portion,
            qty: 1
        });
    }
    renderCart();
    showToast(`${item.emoji} ${item.name} ${getPortionLabel(portion)} eklendi`, 'success');
}

function updateCartQty(index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }
    renderCart();
}

function clearCart() {
    cart = [];
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-items');
    const countEl = document.getElementById('cart-count');
    const totalEl = document.getElementById('cart-total');
    const saveBtn = document.getElementById('btn-save');

    const totalItems = cart.reduce((s, c) => s + c.qty, 0);
    const totalPrice = cart.reduce((s, c) => s + calcItemPrice(c) * c.qty, 0);

    countEl.textContent = totalItems;
    totalEl.textContent = '₺' + totalPrice;
    saveBtn.disabled = cart.length === 0;

    // Reset ödeme alanı
    const paidAmountEl = document.getElementById('paid-amount');
    if(paidAmountEl) paidAmountEl.value = '';
    calcChange();

    if (cart.length === 0) {
        container.innerHTML = `<div class="cart-empty"><div class="empty-icon">🛒</div>Sipariş oluşturup hesaba ekleyin</div>`;
        return;
    }

    container.innerHTML = cart.map((c, i) => {
        const unitPrice = calcItemPrice(c);
        const lineTotal = unitPrice * c.qty;
        const portionBadge = c.portion !== 1 ? `<span class="portion-tag">${getPortionText(c.portion)}</span>` : '';
        return `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${c.emoji} ${c.name} ${portionBadge}</div>
                <div class="cart-item-price">₺${c.basePrice} × ${getPortionLabel(c.portion)} = ₺${unitPrice}</div>
            </div>
            <div class="qty-controls">
                <button class="qty-btn minus" onclick="updateCartQty(${i}, -1)">−</button>
                <span class="qty-val">${c.qty}</span>
                <button class="qty-btn" onclick="updateCartQty(${i}, 1)">+</button>
            </div>
            <div class="cart-item-total">₺${lineTotal}</div>
        </div>`;
    }).join('');
}

function calcChange() {
    const totalPrice = cart.reduce((s, c) => s + calcItemPrice(c) * c.qty, 0);
    const paidInput = document.getElementById('paid-amount');
    const paid = parseFloat(paidInput ? paidInput.value : 0) || 0;
    const change = paid - totalPrice;
    const changeEl = document.getElementById('change-val');
    const changeRow = document.getElementById('change-row');

    if (paid > 0) {
        changeEl.textContent = '₺' + change.toFixed(2);
        changeRow.style.display = 'flex';
        if (change < 0) {
            changeEl.style.color = '#ef4444';
        } else {
            changeEl.style.color = '#22c55e';
        }
    } else {
        changeEl.textContent = '₺0';
        changeEl.style.color = 'var(--text2)';
    }
}

async function saveReceipt() {
    if (cart.length === 0) return;

    const now = new Date();
    const count = await getReceiptCount();
    const counter = (count + 1).toString().padStart(4, '0');
    const id = `MP-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${counter}`;

    const total = cart.reduce((s, c) => s + calcItemPrice(c) * c.qty, 0);
    const paidInput = document.getElementById('paid-amount');
    const paid = parseFloat(paidInput.value) || 0;
    const change = paid > 0 ? paid - total : 0;

    const receiptItems = cart.map(c => ({
        name: c.name + (c.portion !== 1 ? ' (' + getPortionText(c.portion) + ')' : ''),
        emoji: c.emoji,
        price: calcItemPrice(c),
        basePrice: c.basePrice,
        portion: c.portion,
        qty: c.qty
    }));

    const paymentType = document.getElementById('payment-type').value;

    const receipt = {
        id: id,
        date: now.toISOString(),
        items: receiptItems,
        total: total,
        itemCount: cart.reduce((s, c) => s + c.qty, 0),
        paid: paid,
        change: change,
        paymentType: paymentType
    };

    try {
        await addReceipt(receipt);
        showReceipt(receipt);
        cart = [];
        renderCart();
        setPaymentType('nakit');
        showToast('✅ Hesap kaydedildi!', 'success');
    } catch (err) {
        console.error('Hesap kaydedilemedi:', err);
        showToast('❌ Kayıt hatası!', '');
    }
}

function showReceipt(receipt) {
    const d = new Date(receipt.date);
    const timeStr = d.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' });
    const dateStr = d.toLocaleDateString('tr-TR', { day:'2-digit', month:'2-digit', year:'numeric' });

    const box = document.getElementById('receipt-box');
    box.innerHTML = `
        <div class="r-header">
            <div class="r-shop">Max Pilav Halil Usta</div>
            <div class="r-sub">Sultanbeyli / İstanbul</div>
        </div>
        <hr class="r-divider"/>
        <div class="r-row"><span>Fiş No:</span><span>${receipt.id}</span></div>
        <div class="r-row"><span>Tarih:</span><span>${dateStr}</span></div>
        <div class="r-row"><span>Saat:</span><span>${timeStr}</span></div>
        <div class="r-row"><span>Ürün Sayısı:</span><span>${receipt.itemCount}</span></div>
        <hr class="r-divider"/>
        ${receipt.items.map(it => `
            <div class="r-row">
                <span>${it.name} x${it.qty}</span>
                <span>₺${it.price * it.qty}</span>
            </div>
        `).join('')}
        <hr class="r-divider"/>
        <div class="r-total-row">
            <span>TOPLAM</span>
            <span>₺${receipt.total.toFixed(2)}</span>
        </div>
        <div class="r-row" style="font-size:10px;">
            <span>Ödeme Tipi:</span>
            <span>${receipt.paymentType === 'kart' ? 'Kredi Kartı' : 'Nakit'}</span>
        </div>
        ${receipt.paid > 0 ? `
        <div class="r-row"><span>Alınan:</span><span>₺${receipt.paid.toFixed(2)}</span></div>
        <div class="r-row" style="font-weight:900;color:#000"><span>Para Üstü:</span><span>₺${receipt.change.toFixed(2)}</span></div>
        ` : ''}
        <div class="r-footer">Afiyet olsun! • Max Pilav Halil Usta</div>
    `;

    document.getElementById('receipt-overlay').classList.add('show');
}

function printReceipt() {
    window.print();
}

function closeReceipt() {
    document.getElementById('receipt-overlay').classList.remove('show');
}
