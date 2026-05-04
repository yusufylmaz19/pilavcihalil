// ── IndexedDB: read products for menu merge ──
const DB_NAME = 'MaxPilavDB';
const DB_VERSION = 2;
const PRODUCT_STORE = 'products';

function openProductDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('receipts')) {
                const store = db.createObjectStore('receipts', { keyPath: 'id' });
                store.createIndex('date', 'date', { unique: false });
            }
            if (!db.objectStoreNames.contains(PRODUCT_STORE)) {
                db.createObjectStore(PRODUCT_STORE, { keyPath: 'name' });
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

async function getProductOverrides() {
    try {
        const db = await openProductDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(PRODUCT_STORE, 'readonly');
            const store = tx.objectStore(PRODUCT_STORE);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => resolve([]); // fail silently
        });
    } catch (e) {
        return [];
    }
}

function mergeMenuCategories(defaultCats, overrides) {
    const overrideMap = {};
    const customProducts = [];
    overrides.forEach(p => {
        if (p.isCustom) customProducts.push(p);
        else overrideMap[p.name] = p;
    });

    const merged = defaultCats.map(cat => {
        const items = cat.items.map(item => {
            const ov = overrideMap[item.name];
            return ov ? { ...item, price: ov.price, desc: ov.desc, emoji: ov.emoji } : { ...item };
        });
        return { ...cat, items };
    });

    // Group custom products by category
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
                existingCat.items.push({ name: p.name, emoji: p.emoji, desc: p.desc, price: p.price });
            });
        } else {
            merged.push({
                id: catId,
                label: '⭐ Özel Ürünler',
                items: products.map(p => ({ name: p.name, emoji: p.emoji, desc: p.desc, price: p.price }))
            });
        }
    }

    return merged;
}

// ── Load data.json, merge with IndexedDB, and build page ──
async function initPage() {
    try {
        const resp = await fetch('data.json');
        const data = await resp.json();
        const overrides = await getProductOverrides();
        data.menu.categories = mergeMenuCategories(data.menu.categories, overrides);
        buildPage(data);
    } catch (err) {
        console.error('Sayfa yüklenemedi:', err);
    }
}

initPage();

function buildPage(d) {
    const r = d.restaurant;
    const c = d.contact;

    // ── Hero ──
    document.getElementById('hero-bg').style.backgroundImage = `url('${r.hero_image}')`;
    document.getElementById('nav-logo-img').src = r.logo;
    document.getElementById('nav-brand-name').textContent = r.name.split(' ').slice(0, 2).join(' ');
    document.getElementById('nav-brand-sub').textContent = r.name.split(' ').slice(2).join(' ');
    document.getElementById('hero-badge').textContent = r.hero_badge;
    document.title = r.name + ' | Sultanbeyli';

    const parts = r.name.split(' ');
    const firstName = parts.slice(0, 2).join(' ');
    const lastName = parts.slice(2).join(' ');
    document.getElementById('hero-title').innerHTML =
        `${firstName}<br/><span>${lastName}</span>`;
    document.getElementById('hero-sub').textContent = r.hero_desc;

    // ── Footer ──
    document.getElementById('footer-name').textContent = r.name;
    document.getElementById('footer-slogan').textContent = r.slogan;
    document.getElementById('footer-copy').textContent =
        `© ${new Date().getFullYear()} ${r.name}. Tüm hakları saklıdır.`;

    // ── Float WA button ──
    const mainPhone = c.phones.find(p => p.whatsapp);
    if (mainPhone) {
        document.getElementById('float-call-btn').href = mainPhone.whatsapp_href;
    }

    // ── Platforms ──
    const pg = document.getElementById('platforms-grid');
    d.platforms.forEach(p => {
        const a = document.createElement('a');
        a.id = p.id;
        a.href = p.active ? p.href : '#';
        if (p.href !== '#' && p.active) {
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener');
        }
        a.className = `platform-card card-${p.theme} reveal`;
        a.innerHTML = `
  <div class="platform-icon">${p.emoji}</div>
  <div class="platform-info">
    <div class="platform-name">${p.name}</div>
    <div class="platform-cta">${p.cta}</div>
  </div>`;
        pg.appendChild(a);
    });

    // ── Menu tabs & panels (now uses merged data) ──
    const tabsEl = document.getElementById('menu-tabs');
    const panelsEl = document.getElementById('menu-panels');

    d.menu.categories.forEach((cat, idx) => {
        // tab button
        const btn = document.createElement('button');
        btn.className = 'menu-tab' + (idx === 0 ? ' active' : '');
        btn.textContent = cat.label;
        btn.setAttribute('data-target', cat.id);
        btn.addEventListener('click', () => switchTab(cat.id, btn));
        tabsEl.appendChild(btn);

        // panel
        const panel = document.createElement('div');
        panel.id = `panel-${cat.id}`;
        panel.className = 'menu-panel' + (idx === 0 ? ' active' : '');

        const grid = document.createElement('div');
        grid.className = 'menu-grid';

        cat.items.forEach((item, i) => {
            const card = document.createElement('div');
            card.className = 'menu-card reveal';
            card.style.animationDelay = `${i * 0.04}s`;
            const priceHTML = item.price
                ? `<div class="menu-price">₺${item.price}</div>`
                : '';
            card.innerHTML = `
    <div class="menu-emoji">${item.emoji}</div>
    <div class="menu-info">
      <div class="menu-name">${item.name}</div>
      <div class="menu-tag">${item.desc}</div>
    </div>
    ${priceHTML}`;
            grid.appendChild(card);
        });

        panel.appendChild(grid);
        panelsEl.appendChild(panel);
    });

    // Footer platform links
    const fl = document.getElementById('footer-links');
    d.platforms.filter(p => p.active && p.href !== '#').forEach(p => {
        const a = document.createElement('a');
        a.href = p.href;
        a.textContent = p.name;
        a.target = '_blank';
        a.rel = 'noopener';
        fl.appendChild(a);
    });

    // ── Contact card ──
    const cc = document.getElementById('contact-card');

    // Phones
    let phonesHTML = `<h3>📍 İletişim Bilgileri</h3>`;
    phonesHTML += `<div class="contact-item">
<div class="ci-icon">📞</div>
<div>
  <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:6px">Telefon</div>`;

    c.phones.forEach(ph => {
        phonesHTML += `<div class="phone-block">
  <a href="${ph.href}">${ph.number}</a>
  ${ph.whatsapp ? `<span class="phone-main-tag">WhatsApp</span>` : ''}
  <span style="font-size:0.78rem;color:var(--text-muted);margin-left:4px">${ph.label}</span>
  ${ph.whatsapp ? `<br/><a href="${ph.whatsapp_href}" target="_blank" rel="noopener" class="wp-link">💬 WhatsApp'tan Yaz</a>` : ''}
</div>`;
    });
    phonesHTML += `</div></div>`;

    // Email
    phonesHTML += `<div class="contact-item">
<div class="ci-icon">✉️</div>
<div>
  <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px">E-posta</div>
  <a href="${c.email.href}">${c.email.address}</a>
</div>
</div>`;

    // Address
    phonesHTML += `<div class="contact-item">
<div class="ci-icon">📍</div>
<div>
  <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px">Adres</div>
  <span>${c.address.text}</span>
</div>
</div>`;

    // Hours
    phonesHTML += `<div class="contact-item">
<div class="ci-icon">🕐</div>
<div style="flex:1">
  <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:8px">Çalışma Saatleri</div>`;
    c.hours.forEach(h => {
        phonesHTML += `<div class="hours-row">
  <span class="hours-day">${h.day}</span>
  <span class="hours-time">${h.open} – ${h.close}</span>
</div>`;
    });
    phonesHTML += `</div></div>`;

    // Platform quick links
    phonesHTML += `<div style="margin-top:20px;display:flex;flex-direction:column;gap:10px;">`;
    d.platforms.filter(p => p.active && p.theme !== 'tel' && p.href !== '#').forEach(p => {
        const colors = {
            yemeksepeti: { c: '#ff6b9e', b: 'rgba(255,50,100,0.3)' },
            trendyol: { c: '#ffb84d', b: 'rgba(255,155,0,0.3)' },
            getir: { c: '#8b9dff', b: 'rgba(100,120,255,0.3)' }
        };
        const col = colors[p.theme] || { c: 'var(--orange)', b: 'rgba(255,107,26,0.3)' };
        phonesHTML += `<a href="${p.href}" target="_blank" rel="noopener"
  class="map-open-btn" style="color:${col.c};border-color:${col.b}">
  ${p.emoji} ${p.name}'te Sipariş Ver
</a>`;
    });
    phonesHTML += `</div>`;

    cc.innerHTML = phonesHTML;

    // ── Map col ──
    const mapCol = document.getElementById('map-col');
    mapCol.innerHTML = `
<div class="map-wrapper">
  <iframe title="Max Pilav Konumu"
    src="${c.address.maps_embed}"
    allowfullscreen="" loading="lazy"
    referrerpolicy="no-referrer-when-downgrade"></iframe>
</div>
<a id="link-maps" href="${c.address.maps_link}" target="_blank" rel="noopener" class="map-open-btn">
  📍 Google Maps'te Aç
</a>`;

    // ── Re-init intersection observer after DOM build ──
    initReveal();
}

// ── Menu tab switch ──
function switchTab(id, btn) {
    document.querySelectorAll('.menu-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.menu-tab').forEach(b => b.classList.remove('active'));
    document.getElementById('panel-' + id).classList.add('active');
    btn.classList.add('active');

    document.querySelectorAll(`#panel-${id} .menu-card`).forEach((card, i) => {
        card.style.animation = 'none';
        void card.offsetHeight;
        card.style.animation = `fadeIn 0.35s ${i * 0.04}s ease both`;
    });
}

// ── Scroll reveal ──
function initReveal() {
    const revealEls = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                io.unobserve(e.target);
            }
        });
    }, { threshold: 0.1 });
    revealEls.forEach(el => io.observe(el));
}

// ── Navbar shrink on scroll ──
window.addEventListener('scroll', () => {
    document.getElementById('navbar').style.padding =
        window.scrollY > 60 ? '8px 24px' : '14px 24px';
});

// ── Stars ──
const starsEl = document.getElementById('stars');
if (starsEl) {
    for (let i = 0; i < 60; i++) {
        const s = document.createElement('div');
        s.className = 'star';
        s.style.cssText = `
    left:${Math.random() * 100}%;top:${Math.random() * 100}%;
    --d:${2 + Math.random() * 4}s;--delay:${Math.random() * 3}s;
    width:${1 + Math.random() * 2}px;height:${1 + Math.random() * 2}px;`;
        starsEl.appendChild(s);
    }
}
