let historyGrouping = 'day';
let currentHistoryPage = 1;
let historyPageSize = 100;
let totalHistoryPages = 1;

async function toggleHistory() {
    const overlay = document.getElementById('history-overlay');
    const isOpen = overlay.classList.contains('show');
    if (isOpen) {
        overlay.classList.remove('show');
    } else {
        await renderHistory(1);
        overlay.classList.add('show');
    }
}

function closeHistoryOutside(e) {
    if (e.target === document.getElementById('history-overlay')) {
        toggleHistory();
    }
}

async function setHistoryGrouping(mode) {
    historyGrouping = mode;
    const btns = document.querySelectorAll('#history-grouping-tabs .pay-seg-btn');
    btns.forEach(b => {
        b.classList.toggle('active', b.textContent.toLowerCase().includes(mode === 'day' ? 'gün' : mode === 'week' ? 'hafta' : 'ay'));
    });
    await renderHistory(1);
}

function getWeekKey(date) {
    const d = new Date(date);
    const day = d.getDay() || 7;
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() - day + 1);
    const start = new Date(d);
    d.setDate(d.getDate() + 6);
    const end = new Date(d);
    return `${start.toLocaleDateString('tr-TR', {day:'2-digit', month:'2-digit'})} - ${end.toLocaleDateString('tr-TR', {day:'2-digit', month:'2-digit', year:'numeric'})} Haftası`;
}

async function prevHistoryPage() {
    if (currentHistoryPage > 1) {
        await renderHistory(currentHistoryPage - 1);
    }
}

async function nextHistoryPage() {
    if (currentHistoryPage < totalHistoryPages) {
        await renderHistory(currentHistoryPage + 1);
    }
}

async function changeHistoryPageSize(val) {
    historyPageSize = parseInt(val) || 10;
    await renderHistory(1);
}

async function renderHistory(page = 1) {
    currentHistoryPage = page;
    const body = document.getElementById('history-body');
    const footer = document.getElementById('history-footer');
    
    // Yükleniyor spinner'ı göster
    body.innerHTML = `
        <div class="history-empty">
            <div class="login-spinner"></div>
            <div style="margin-top: 10px;">Adisyonlar yükleniyor...</div>
        </div>
    `;
    if (footer) footer.innerHTML = '';

    try {
        const pagedData = await getHistoryPaged(currentHistoryPage, historyPageSize);
        const history = pagedData.items;
        totalHistoryPages = pagedData.totalPages;

        if (history.length === 0) {
            body.innerHTML = '<div class="history-empty">📭 Henüz kayıtlı hesap yok</div>';
            if (footer) footer.innerHTML = '';
            return;
        }

        // Grouping logic
        const groups = {};
        history.forEach(r => {
            const d = new Date(r.date);
            let key = '';
            if (historyGrouping === 'day') {
                key = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
            } else if (historyGrouping === 'week') {
                key = getWeekKey(d);
            } else {
                key = d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
            }
            if (!groups[key]) groups[key] = [];
            groups[key].push(r);
        });

        let html = '';
        const sortedKeys = Object.keys(groups); // Assuming history is already sorted by date desc

        for (const group of sortedKeys) {
            const receipts = groups[group];
            const groupTotal = receipts.reduce((sum, r) => sum + r.total, 0);
            
            html += `
                <div class="history-group-title">
                    <span>📅 ${group}</span>
                    <span class="group-total-badge">Toplam: ₺${groupTotal.toFixed(2)}</span>
                </div>
            `;

            receipts.forEach(r => {
                const d = new Date(r.date);
                const timeStr = d.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' });
                const dateStr = d.toLocaleDateString('tr-TR', { day:'2-digit', month:'2-digit', year:'numeric' });
                const itemsSummary = r.items.map(it => `${it.name} x${it.qty}`).join(', ');

                const pt = r.paymentType === 'kart' ? '💳 Kart' : '💵 Nakit';
                const ptColor = r.paymentType === 'kart' ? '#3b82f6' : '#22c55e';
                const cardClass = r.paymentType === 'kart' ? 'hc-kart' : 'hc-nakit';

                html += `
                    <div class="history-card ${cardClass}">
                        <div class="history-card-top">
                            <span class="history-card-id">${r.id}</span>
                            <span class="history-card-time">${dateStr} • ${timeStr}</span>
                        </div>
                        <div class="history-card-items">${itemsSummary}</div>
                        <div class="history-card-bottom">
                            <span class="history-card-total">₺${r.total.toFixed(2)} <span style="font-size:0.75rem; color:${ptColor}; margin-left:4px;">(${pt})</span></span>
                            <div class="history-card-actions">
                                <button class="hc-btn" onclick="viewReceipt('${r.id}')">🧾 Görüntüle</button>
                                <button class="hc-btn delete" onclick="deleteReceipt('${r.id}')">🗑️ Sil</button>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        body.innerHTML = html;
        body.scrollTop = 0; // Sayfa değişince listenin başına kaydır

        // Sabit alt sayfalama alanını güncelle
        if (footer) {
            footer.innerHTML = `
                <div class="history-footer-wrap">
                    <div class="hp-size-selector">
                        <span>Sayfa Başı:</span>
                        <select class="hp-select" id="history-page-size-select" onchange="changeHistoryPageSize(this.value)">
                            <option value="10" ${historyPageSize === 10 ? 'selected' : ''}>10</option>
                            <option value="20" ${historyPageSize === 20 ? 'selected' : ''}>20</option>
                            <option value="50" ${historyPageSize === 50 ? 'selected' : ''}>50</option>
                            <option value="100" ${historyPageSize === 100 ? 'selected' : ''}>100</option>
                        </select>
                    </div>
                    <div class="hp-controls">
                        <button class="hp-btn" onclick="prevHistoryPage()" ${currentHistoryPage === 1 ? 'disabled' : ''}>◀ Geri</button>
                        <span class="hp-info">Sayfa ${currentHistoryPage} / ${totalHistoryPages} (${pagedData.totalCount} adisyon)</span>
                        <button class="hp-btn" onclick="nextHistoryPage()" ${currentHistoryPage === totalHistoryPages ? 'disabled' : ''}>İleri ▶</button>
                    </div>
                </div>
            `;
        }
    } catch (err) {
        console.error('renderHistory hatası:', err);
        body.innerHTML = '<div class="history-empty">❌ Adisyonlar yüklenemedi!</div>';
        if (footer) footer.innerHTML = '';
    }
}

async function viewReceipt(id) {
    try {
        const doc = await getFirestore().collection(RECEIPTS_COL).doc(id).get();
        if (doc.exists) {
            showReceipt(doc.data());
        } else {
            showToast('❌ Adisyon bulunamadı', '');
        }
    } catch (err) {
        console.error('viewReceipt hatası:', err);
        showToast('❌ Adisyon yüklenemedi', '');
    }
}

async function deleteReceipt(id) {
    if (!confirm('Bu hesabı silmek istediğinize emin misiniz?')) return;
    try {
        await removeReceipt(id);
        await renderHistory(currentHistoryPage);
        showToast('🗑️ Hesap silindi', '');
    } catch (err) {
        console.error('Silme hatası:', err);
        showToast('❌ Silme hatası!', '');
    }
}
