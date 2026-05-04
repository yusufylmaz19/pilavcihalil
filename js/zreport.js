function openZReport() {
    document.getElementById('zreport-overlay').classList.add('show');
    setZReportRange('today');
}

function closeZReport() {
    document.getElementById('zreport-overlay').classList.remove('show');
}

function closeZReportOutside(e) {
    if (e.target === document.getElementById('zreport-overlay')) closeZReport();
}

function setZReportRange(val) {
    document.getElementById('zreport-range').value = val;
    const btns = document.querySelectorAll('#zr-range-container .pay-seg-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`#zr-range-container .pay-seg-btn[data-val="${val}"]`);
    if(activeBtn) activeBtn.classList.add('active');
    
    document.getElementById('zreport-custom-dates').style.display = val === 'custom' ? 'flex' : 'none';
    if (val !== 'custom') generateZReport();
}

function getDateRange() {
    const sel = document.getElementById('zreport-range').value;
    const now = new Date();
    let start, end;

    if (sel === 'today') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (sel === 'yesterday') {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        start = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0);
        end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59);
    } else if (sel === 'week') {
        const day = now.getDay() || 7;
        start = new Date(now);
        start.setDate(now.getDate() - day + 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (sel === 'month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else {
        const sv = document.getElementById('zreport-start').value;
        const ev = document.getElementById('zreport-end').value;
        if (!sv || !ev) return null;
        start = new Date(sv + 'T00:00:00');
        end = new Date(ev + 'T23:59:59');
    }
    return { start, end };
}

async function generateZReport() {
    const range = getDateRange();
    if (!range) {
        document.getElementById('zreport-body').innerHTML = '<div class="history-empty">📅 Tarih aralığı seçin</div>';
        return;
    }

    const allReceipts = await getHistory();
    const filtered = allReceipts.filter(r => {
        const d = new Date(r.date);
        return d >= range.start && d <= range.end;
    });

    const body = document.getElementById('zreport-body');

    if (filtered.length === 0) {
        body.innerHTML = '<div class="history-empty">📭 Seçilen tarihte hesap bulunamadı</div>';
        return;
    }

    const totalRevenue = filtered.reduce((s, r) => s + r.total, 0);
    const totalItems = filtered.reduce((s, r) => s + r.itemCount, 0);
    const avgTicket = totalRevenue / filtered.length;
    const totalPaid = filtered.reduce((s, r) => s + (r.paid || 0), 0);
    const totalChange = filtered.reduce((s, r) => s + (r.change || 0), 0);
    const totalNakit = filtered.filter(r => r.paymentType !== 'kart').reduce((s, r) => s + r.total, 0);
    const totalKart = filtered.filter(r => r.paymentType === 'kart').reduce((s, r) => s + r.total, 0);

    const productMap = {};
    filtered.forEach(r => {
        r.items.forEach(it => {
            if (!productMap[it.name]) {
                productMap[it.name] = { qty: 0, revenue: 0, emoji: it.emoji || '' };
            }
            productMap[it.name].qty += it.qty;
            productMap[it.name].revenue += it.price * it.qty;
        });
    });

    const sortedProducts = Object.entries(productMap).sort((a, b) => b[1].qty - a[1].qty);
    const topSeller = sortedProducts[0];

    const hourMap = {};
    filtered.forEach(r => {
        const h = new Date(r.date).getHours();
        const key = h.toString().padStart(2, '0') + ':00';
        if (!hourMap[key]) hourMap[key] = { count: 0, total: 0 };
        hourMap[key].count++;
        hourMap[key].total += r.total;
    });

    const dateLabel = range.start.toLocaleDateString('tr-TR', { day:'2-digit', month:'2-digit', year:'numeric' })
        + (range.start.toDateString() !== range.end.toDateString()
            ? ' - ' + range.end.toLocaleDateString('tr-TR', { day:'2-digit', month:'2-digit', year:'numeric' })
            : '');

    body.innerHTML = `
        <div class="zr-summary">
            <div class="zr-date-label">📅 ${dateLabel}</div>
            <div class="zr-stats-grid">
                <div class="zr-stat">
                    <div class="zr-stat-val">₺${totalRevenue.toFixed(2)}</div>
                    <div class="zr-stat-label">Toplam Ciro</div>
                </div>
                <div class="zr-stat">
                    <div class="zr-stat-val">${filtered.length}</div>
                    <div class="zr-stat-label">Fiş Sayısı</div>
                </div>
                <div class="zr-stat">
                    <div class="zr-stat-val">${totalItems}</div>
                    <div class="zr-stat-label">Ürün Adedi</div>
                </div>
                <div class="zr-stat">
                    <div class="zr-stat-val">₺${avgTicket.toFixed(2)}</div>
                    <div class="zr-stat-label">Ort. Fiş</div>
                </div>
            </div>
            ${topSeller ? `<div class="zr-top-seller">🏆 En Çok Satan: <strong>${topSeller[1].emoji} ${topSeller[0]}</strong> (${topSeller[1].qty} adet)</div>` : ''}
        </div>

        <div class="zr-section-title">📦 Ürün Bazlı Döküm</div>
        <table class="zr-table">
            <thead><tr><th>Ürün</th><th>Adet</th><th>Tutar</th></tr></thead>
            <tbody>
                ${sortedProducts.map(([name, data]) => `
                    <tr>
                        <td>${data.emoji} ${name}</td>
                        <td>${data.qty}</td>
                        <td>₺${data.revenue.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr><td><strong>TOPLAM</strong></td><td><strong>${totalItems}</strong></td><td><strong>₺${totalRevenue.toFixed(2)}</strong></td></tr>
            </tfoot>
        </table>

        <div class="zr-section-title">🕐 Saat Bazlı Dağılım</div>
        <table class="zr-table">
            <thead><tr><th>Saat</th><th>Fiş</th><th>Tutar</th></tr></thead>
            <tbody>
                ${Object.entries(hourMap).sort((a,b) => a[0].localeCompare(b[0])).map(([h, data]) => `
                    <tr><td>${h}</td><td>${data.count}</td><td>₺${data.total.toFixed(2)}</td></tr>
                `).join('')}
            </tbody>
        </table>

        <div class="zr-section-title">💰 Ödeme Özeti</div>
        <div class="zr-payment-summary">
            <div class="zr-pay-row"><span>Toplam Ciro:</span><span>₺${totalRevenue.toFixed(2)}</span></div>
            <div class="zr-pay-row"><span>Nakit Tahsilat:</span><span style="color:#22c55e;">₺${totalNakit.toFixed(2)}</span></div>
            <div class="zr-pay-row"><span>Kredi Kartı:</span><span style="color:#3b82f6;">₺${totalKart.toFixed(2)}</span></div>
            <hr style="border:none; border-top:1px solid var(--border); margin: 6px 0;" />
            <div class="zr-pay-row" style="color:var(--text3); font-size:0.8rem;"><span>Alınan Nakit:</span><span>₺${totalPaid.toFixed(2)}</span></div>
            <div class="zr-pay-row" style="color:var(--text3); font-size:0.8rem;"><span>Verilen Para Üstü:</span><span>₺${totalChange.toFixed(2)}</span></div>
        </div>
    `;

    prepareZPrintBox(dateLabel, filtered, totalRevenue, totalItems, avgTicket, sortedProducts, totalPaid, totalChange, hourMap, totalNakit, totalKart);
}

function prepareZPrintBox(dateLabel, receipts, totalRevenue, totalItems, avgTicket, sortedProducts, totalPaid, totalChange, hourMap, totalNakit, totalKart) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' });
    const topSeller = sortedProducts[0];

    document.getElementById('zprint-box').innerHTML = `
        <div class="r-header">
            <div class="r-shop">MAX PİLAV HALİL USTA</div>
            <div class="r-sub">Sultanbeyli / İstanbul</div>
        </div>
        <hr class="r-divider"/>
        <div style="text-align:center;font-weight:900;font-size:14px;margin:2mm 0">═══ Z RAPORU ═══</div>
        <hr class="r-divider"/>
        <div class="r-row"><span>Tarih:</span><span>${dateLabel}</span></div>
        <div class="r-row"><span>Rapor Saati:</span><span>${timeStr}</span></div>
        <div class="r-row"><span>Fiş Sayısı:</span><span>${receipts.length}</span></div>
        <div class="r-row"><span>Toplam Ürün:</span><span>${totalItems}</span></div>
        <hr class="r-divider"/>
        <div style="font-weight:900;font-size:11px;margin:1mm 0">ÜRÜN DÖKÜM:</div>
        ${sortedProducts.map(([name, data]) => `
            <div class="r-row"><span>${name} x${data.qty}</span><span>₺${data.revenue.toFixed(2)}</span></div>
        `).join('')}
        <hr class="r-divider"/>
        <div class="r-total-row"><span>TOPLAM CİRO</span><span>₺${totalRevenue.toFixed(2)}</span></div>
        <div class="r-row"><span>Nakit Tahsilat:</span><span>₺${totalNakit.toFixed(2)}</span></div>
        <div class="r-row"><span>Kredi Kartı:</span><span>₺${totalKart.toFixed(2)}</span></div>
        <hr class="r-divider"/>
        <div class="r-row"><span>Ort. Fiş Tutarı:</span><span>₺${avgTicket.toFixed(2)}</span></div>
        <div class="r-row" style="font-size:10px;"><span>Alınan Nakit:</span><span>₺${totalPaid.toFixed(2)}</span></div>
        <div class="r-row" style="font-size:10px;"><span>Para Üstü Top.:</span><span>₺${totalChange.toFixed(2)}</span></div>
        ${topSeller ? `
        <hr class="r-divider"/>
        <div class="r-row"><span>🏆 En Çok Satan:</span><span>${topSeller[0]}</span></div>
        <div class="r-row"><span>Adet:</span><span>${topSeller[1].qty}</span></div>
        ` : ''}
        <hr class="r-divider"/>
        <div style="font-weight:900;font-size:11px;margin:1mm 0">SAAT DAĞILIMI:</div>
        ${Object.entries(hourMap).sort((a,b) => a[0].localeCompare(b[0])).map(([h, data]) => `
            <div class="r-row"><span>${h}</span><span>${data.count} fiş / ₺${data.total.toFixed(2)}</span></div>
        `).join('')}
        <hr class="r-divider"/>
        <div class="r-footer">Z Raporu • Max Pilav Halil Usta</div>
    `;
}

function previewZReport() {
    document.getElementById('zprint-overlay').classList.add('show');
}

function printZReport() {
    window.print();
}

function closeZPrint() {
    document.getElementById('zprint-overlay').classList.remove('show');
}

let autoZFired = false;

function loadAutoZSettings() {
    const saved = localStorage.getItem('autoZPrint');
    if (saved) {
        const s = JSON.parse(saved);
        const toggle = document.getElementById('auto-zprint-toggle');
        const timeInput = document.getElementById('auto-zprint-time');
        if(toggle) toggle.checked = s.enabled;
        if(timeInput) timeInput.value = s.time || '23:30';
    }
    updateAutoZStatus();
}

function saveAutoZSettings() {
    const enabled = document.getElementById('auto-zprint-toggle').checked;
    const time = document.getElementById('auto-zprint-time').value;
    localStorage.setItem('autoZPrint', JSON.stringify({ enabled, time }));
    autoZFired = false;
    updateAutoZStatus();
    if (enabled) {
        showToast(`⏰ Z Raporu saat ${time}'de otomatik yazdırılacak`, 'success');
    } else {
        showToast('⏰ Otomatik yazdırma kapatıldı', '');
    }
}

function updateAutoZStatus() {
    const statusEl = document.getElementById('auto-zprint-status');
    const toggle = document.getElementById('auto-zprint-toggle');
    if(!statusEl || !toggle) return;
    const enabled = toggle.checked;
    const time = document.getElementById('auto-zprint-time').value;
    if (enabled) {
        statusEl.textContent = `✅ Aktif • ${time}`;
        statusEl.style.color = '#22c55e';
    } else {
        statusEl.textContent = 'Kapalı';
        statusEl.style.color = '#707085';
    }
}

setInterval(() => {
    const saved = localStorage.getItem('autoZPrint');
    if (!saved) return;
    const s = JSON.parse(saved);
    if (!s.enabled) return;

    const now = new Date();
    const [targetH, targetM] = s.time.split(':').map(Number);
    const nowH = now.getHours();
    const nowM = now.getMinutes();

    if (nowH === targetH && nowM === targetM && !autoZFired) {
        autoZFired = true;
        autoTriggerZReport();
    }

    if (nowH === 0 && nowM === 0) {
        autoZFired = false;
    }
}, 30000);

async function autoTriggerZReport() {
    playNotificationSound();
    showToast('⏰ Gün sonu Z Raporu hazırlanıyor...', 'success');
    setZReportRange('today');
    document.getElementById('zprint-overlay').classList.add('show');
    await downloadZReportPDF();
    setTimeout(() => {
        playNotificationSound();
        window.print();
    }, 1000);
}

function playNotificationSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const playBeep = (time, freq, duration) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = freq;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.4, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
            osc.start(time);
            osc.stop(time + duration);
        };
        const now = ctx.currentTime;
        playBeep(now, 880, 0.15);
        playBeep(now + 0.2, 880, 0.15);
        playBeep(now + 0.4, 1175, 0.3);
    } catch (e) {
        console.warn('Ses çalınamadı:', e);
    }
}

async function downloadZReportPDF() {
    const element = document.getElementById('zprint-box');
    if (!element || !element.innerHTML.trim()) {
        showToast('❌ Önce rapor oluşturun', '');
        return;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('tr-TR', { day:'2-digit', month:'2-digit', year:'numeric' }).replace(/\\./g, '-');
    const timeStr = now.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' }).replace(':', '');

    const htmlContent = '<!DOCTYPE html>'
    + '<html><head>'
    + '<meta charset="UTF-8">'
    + '<title>Z Raporu - ' + dateStr + '<\\/title>'
    + '<style>'
    + '@page { size: 80mm auto; margin: 0; }'
    + '* { margin:0; padding:0; box-sizing:border-box; }'
    + 'body { width:80mm; margin:0 auto; font-family: Arial Black, Helvetica Neue, Arial, sans-serif; font-size:12px; font-weight:900; color:#000; line-height:1.5; -webkit-print-color-adjust: exact; }'
    + '.receipt-box { width:72mm; margin:4mm auto; padding:0; }'
    + '.r-header { text-align:center; margin-bottom:3mm; }'
    + '.r-shop { font-size:16px; font-weight:900; text-transform:uppercase; letter-spacing:0.5px; }'
    + '.r-sub { font-size:11px; font-weight:700; margin-top:1mm; }'
    + '.r-divider { border:none; border-top:2px dashed #000; margin:2.5mm 0; }'
    + '.r-row { display:flex; justify-content:space-between; padding:0.8mm 0; font-size:12px; font-weight:700; }'
    + '.r-total-row { display:flex; justify-content:space-between; font-weight:900; font-size:15px; padding:2mm 0; border-top:2px solid #000; border-bottom:2px solid #000; margin:1.5mm 0; }'
    + '.r-footer { text-align:center; margin-top:3mm; font-size:10px; font-weight:700; }'
    + 'div, span { font-weight:900 !important; color:#000 !important; }'
    + '<' + '/style>'
    + '<' + '/head><body>'
    + '<div class="receipt-box">' + element.innerHTML + '<' + '/div>'
    + '<' + 'script>window.onload=function(){window.print();}<' + '/script>'
    + '<' + '/body><' + '/html>';

    const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');

    if (win) {
        showToast('📄 PDF penceresi açıldı → "PDF olarak kaydet" seçin', 'success');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = `Z-Raporu_${dateStr}_${timeStr}.html`;
        a.click();
        showToast('📄 HTML olarak indirildi, tarayıcıda açıp PDF yapabilirsiniz', 'success');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
}
