// ═══════════════════════════════════════
// AYARLAR YÖNETİMİ
// ═══════════════════════════════════════

function openSettings() {
    document.getElementById('settings-overlay').classList.add('show');
    loadSettingsForm();
}

function closeSettings() {
    document.getElementById('settings-overlay').classList.remove('show');
}

function closeSettingsOutside(e) {
    if (e.target === document.getElementById('settings-overlay')) closeSettings();
}

async function loadSettingsForm() {
    const body = document.getElementById('settings-body');
    body.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">⏳ Yükleniyor...</div>';

    const settings = await getSettings();
    const s = settings || {};
    const r = s.restaurant || {};
    const c = s.contact || {};
    const platforms = s.platforms || [];

    const phones = c.phones || [{}, {}];
    const p1 = phones[0] || {};
    const p2 = phones[1] || {};
    const hours = c.hours || [{}, {}];
    const h1 = hours[0] || {};
    const h2 = hours[1] || {};

    const fp = (theme) => platforms.find(p => p.theme === theme) || {};
    const ys = fp('yemeksepeti');
    const ty = fp('trendyol');
    const gt = fp('getir');

    const esc = (v) => (v || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');

    body.innerHTML = `
<div class="settings-section">
  <div class="settings-section-title">🏪 Restoran Bilgileri</div>
  <div class="srow"><label>Restoran Adı</label><input type="text" id="s-name" value="${esc(r.name)}" /></div>
  <div class="srow"><label>Slogan</label><input type="text" id="s-slogan" value="${esc(r.slogan)}" /></div>
  <div class="srow"><label>Hero Badge</label><input type="text" id="s-hero-badge" value="${esc(r.hero_badge)}" /></div>
  <div class="srow"><label>Kısa Açıklama</label><textarea id="s-hero-desc" rows="2">${r.hero_desc || ''}</textarea></div>
</div>

<div class="settings-section">
  <div class="settings-section-title">📞 İletişim</div>
  <div class="srow"><label>Telefon 1 (Ana Hat)</label><input type="text" id="s-phone1" value="${esc(p1.number)}" placeholder="+90 555 000 00 00" /></div>
  <div class="srow"><label>Tel 1 Etiketi</label><input type="text" id="s-phone1-label" value="${esc(p1.label)}" placeholder="Ana Hat" /></div>
  <div class="srow"><label>Tel 1 WhatsApp mı?</label>
    <div style="display:flex;align-items:center;gap:10px;padding:8px 0">
      <input type="checkbox" id="s-phone1-wa" ${p1.whatsapp ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--orange)" />
      <span style="font-size:0.85rem;color:var(--text-muted)">WhatsApp aktif</span>
    </div>
  </div>
  <div class="srow"><label>Telefon 2</label><input type="text" id="s-phone2" value="${esc(p2.number)}" placeholder="+90 555 000 00 01" /></div>
  <div class="srow"><label>Tel 2 Etiketi</label><input type="text" id="s-phone2-label" value="${esc(p2.label)}" placeholder="İkinci Hat" /></div>
  <div class="srow"><label>E-posta</label><input type="email" id="s-email" value="${esc((c.email || {}).address)}" /></div>
  <div class="srow"><label>Adres</label><textarea id="s-address" rows="2">${(c.address || {}).text || ''}</textarea></div>
  <div class="srow"><label>Google Maps Linki</label><input type="url" id="s-maps-link" value="${esc((c.address || {}).maps_link)}" /></div>
  <div class="srow"><label>Maps Embed URL</label><input type="url" id="s-maps-embed" value="${esc((c.address || {}).maps_embed)}" /></div>
</div>

<div class="settings-section">
  <div class="settings-section-title">🕐 Çalışma Saatleri</div>
  <div class="srow"><label>Gün 1 (ör: Pzt–Cmt)</label><input type="text" id="s-h1-day" value="${esc(h1.day)}" placeholder="Pazartesi – Cumartesi" /></div>
  <div class="srow hours-row-inline">
    <label>Saatler</label>
    <div style="display:flex;gap:10px;align-items:center">
      <input type="time" id="s-h1-open" value="${h1.open || '11:30'}" style="flex:1" />
      <span style="color:var(--text-muted)">–</span>
      <input type="time" id="s-h1-close" value="${h1.close || '01:30'}" style="flex:1" />
    </div>
  </div>
  <div class="srow"><label>Gün 2 (ör: Pazar)</label><input type="text" id="s-h2-day" value="${esc(h2.day)}" placeholder="Pazar" /></div>
  <div class="srow hours-row-inline">
    <label>Saatler</label>
    <div style="display:flex;gap:10px;align-items:center">
      <input type="time" id="s-h2-open" value="${h2.open || '11:30'}" style="flex:1" />
      <span style="color:var(--text-muted)">–</span>
      <input type="time" id="s-h2-close" value="${h2.close || '00:00'}" style="flex:1" />
    </div>
  </div>
</div>

<div class="settings-section">
  <div class="settings-section-title">🛵 Sipariş Platformları</div>
  <div class="platform-srow">
    <span class="pf-name">🍽️ Yemeksepeti</span>
    <input type="url" id="s-ys-url" value="${esc(ys.href)}" placeholder="https://www.yemeksepeti.com/..." />
    <label class="pf-check"><input type="checkbox" id="s-ys-active" ${ys.active !== false ? 'checked' : ''} style="accent-color:var(--orange)" /> Aktif</label>
  </div>
  <div class="platform-srow">
    <span class="pf-name">🟠 Trendyol Go</span>
    <input type="url" id="s-ty-url" value="${esc(ty.href)}" placeholder="https://tgoyemek.com/..." />
    <label class="pf-check"><input type="checkbox" id="s-ty-active" ${ty.active !== false ? 'checked' : ''} style="accent-color:var(--orange)" /> Aktif</label>
  </div>
  <div class="platform-srow">
    <span class="pf-name">🟣 Getir Yemek</span>
    <input type="url" id="s-gt-url" value="${esc(gt.href)}" placeholder="https://getir.com/..." />
    <label class="pf-check"><input type="checkbox" id="s-gt-active" ${gt.active !== false ? 'checked' : ''} style="accent-color:var(--orange)" /> Aktif</label>
  </div>
</div>
    `;
}

async function saveSettingsForm() {
    const btn = document.getElementById('settings-save-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Kaydediliyor...';

    try {
        const phone1Num = document.getElementById('s-phone1').value.trim();
        const phone1Label = document.getElementById('s-phone1-label').value.trim() || 'Ana Hat';
        const phone1WA = document.getElementById('s-phone1-wa').checked;
        const phone2Num = document.getElementById('s-phone2').value.trim();
        const phone2Label = document.getElementById('s-phone2-label').value.trim() || 'İkinci Hat';

        const buildTel = (n) => 'tel:' + n.replace(/\s/g, '');
        const buildWA = (n) => 'https://wa.me/' + n.replace(/[\s+\-()]/g, '');

        const data = {
            restaurant: {
                name: document.getElementById('s-name').value.trim(),
                slogan: document.getElementById('s-slogan').value.trim(),
                hero_badge: document.getElementById('s-hero-badge').value.trim(),
                hero_desc: document.getElementById('s-hero-desc').value.trim(),
                logo: 'assets/logo.png',
                hero_image: 'assets/hero.png',
                pdf_menu: 'assets/Max_Pilav_Halil_Usta_Menu.pdf'
            },
            contact: {
                phones: [
                    {
                        id: 'phone-main',
                        number: phone1Num,
                        href: buildTel(phone1Num),
                        label: phone1Label,
                        whatsapp: phone1WA,
                        whatsapp_href: phone1WA ? buildWA(phone1Num) : ''
                    },
                    {
                        id: 'phone-2',
                        number: phone2Num,
                        href: buildTel(phone2Num),
                        label: phone2Label,
                        whatsapp: false,
                        whatsapp_href: ''
                    }
                ],
                email: {
                    address: document.getElementById('s-email').value.trim(),
                    href: 'mailto:' + document.getElementById('s-email').value.trim()
                },
                address: {
                    text: document.getElementById('s-address').value.trim(),
                    maps_embed: document.getElementById('s-maps-embed').value.trim(),
                    maps_link: document.getElementById('s-maps-link').value.trim()
                },
                hours: [
                    {
                        day: document.getElementById('s-h1-day').value.trim(),
                        open: document.getElementById('s-h1-open').value,
                        close: document.getElementById('s-h1-close').value
                    },
                    {
                        day: document.getElementById('s-h2-day').value.trim(),
                        open: document.getElementById('s-h2-open').value,
                        close: document.getElementById('s-h2-close').value
                    }
                ]
            },
            platforms: [
                {
                    id: 'platform-yemeksepeti', name: 'Yemeksepeti', cta: 'Hemen sipariş ver →',
                    emoji: '🍽️', theme: 'yemeksepeti',
                    href: document.getElementById('s-ys-url').value.trim(),
                    active: document.getElementById('s-ys-active').checked
                },
                {
                    id: 'platform-trendyol', name: 'Trendyol Go', cta: 'Hemen sipariş ver →',
                    emoji: '🟠', theme: 'trendyol',
                    href: document.getElementById('s-ty-url').value.trim(),
                    active: document.getElementById('s-ty-active').checked
                },
                {
                    id: 'platform-getir', name: 'Getir Yemek', cta: 'Hemen sipariş ver →',
                    emoji: '🟣', theme: 'getir',
                    href: document.getElementById('s-gt-url').value.trim(),
                    active: document.getElementById('s-gt-active').checked
                },
                {
                    id: 'platform-tel', name: 'Telefonla Sipariş',
                    cta: phone1Num, emoji: '📞', theme: 'tel',
                    href: buildTel(phone1Num), active: true
                }
            ]
        };

        await saveSettings(data);
        showToast('Ayarlar kaydedildi!', 'success');
        closeSettings();
    } catch (err) {
        console.error('Ayarlar kaydedilemedi:', err);
        showToast('Kaydetme hatası!', '');
    } finally {
        btn.disabled = false;
        btn.textContent = '💾 Kaydet';
    }
}
