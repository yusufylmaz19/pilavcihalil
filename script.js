// --- DYNAMIC CONTENT CONFIGURATION ---
// Buradaki bilgileri değiştirerek site içeriğini güncelleyebilirsin.
const siteContent = {
    hero: {
        title: "Pilavcı Halil Usta",
        slogan: "Efsane Lezzet, Sokaktan Sofranıza",
        buttonText: "Menüyü Gör"
    },
    about: {
        title: "Hikayemiz",
        text: "1995 yılından beri değişmeyen lezzet anlayışımızla, en kaliteli pirinçleri ve en taze etleri buluşturuyoruz. Pilavcı Halil Usta olarak, sokak lezzetlerinin samimiyetini modern bir sunumla birleştiriyoruz. Dededen toruna geçen tariflerimizle, her tabakta aynı sıcaklığı ve lezzeti garanti ediyoruz. Bizim için pilav sadece bir yemek değil, bir tutkudur.",
        imageUrl: "https://mlvv4auutja6.i.optimole.com/cb:RXfe.4dc38/w:1000/h:560/q:mauto/f:best/https://market.amasyaeturunleri.com.tr/wp-content/uploads/evde-lezzetler-kavurmali-pilav-1.jpg" // Placeholder chef/kitchen image
    },
    menu: [
        {
            name: "Meşhur Tavuk Pilav",
            description: "Tereyağlı nohutlu pilav üzerine didiklenmiş özel soslu tavuk.",
            price: "75 TL",
            image: "https://cdn.getiryemek.com/restaurants/1759922837110_1125x522.webp"
        },
        {
            name: "Kavurmalı Pilav",
            description: "Dana kavurma ile servis edilen efsane lezzet.",
            price: "120 TL",
            image: "https://mlvv4auutja6.i.optimole.com/cb:RXfe.4dc38/w:1000/h:560/q:mauto/f:best/https://market.amasyaeturunleri.com.tr/wp-content/uploads/evde-lezzetler-kavurmali-pilav-1.jpg"
        },
        {
            name: "Mercimek Çorbası",
            description: "Sıcacık, ev yapımı süzme mercimek çorbası.",
            price: "40 TL",
            image: "https://www.kevserinmutfagi.com/wp-content/uploads/2011/04/en_kolay_mercimek_corbasi1.jpg"
        },
        {
            name: "Kelle Paça",
            description: "Şifa kaynağı, bol sarımsaklı kelle paça.",
            price: "90 TL",
            image: "https://imgrosetta.mynet.com.tr/file/16798956/16798956-1200xauto.jpg"
        },
        {
            name: "Bol Köpüklü Ayran",
            description: "Yayık ayranı, pilavın en iyi eşlikçisi.",
            price: "15 TL",
            image: "https://www.acibadem.com.tr/hayat/Images/YayinMakaleler/bol-kopuklu-ayran-susurluk-ayrani-nedir_342508_1.jpg"
        },
        {
            name: "Turşu Tabağı",
            description: "Karışık mevsim turşuları.",
            price: "20 TL",
            image: "https://www.sozen.com.tr/wp-content/uploads/2021/12/karisik-tursu-edit-scaled.jpg"
        }
    ],
    contact: {
        address: "Lezzet Mahallesi, Pilavcılar Caddesi No: 10, Sultanbeyli / İstanbul",
        phone: "+90 534 498 29 27",
        hours: "Her gün: 11:00 - 23:00",
        mapText: '<iframe width="100%" height="100%" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://maps.google.com/maps?q=40.9655,29.2620&hl=tr&z=14&output=embed"></iframe>'
    },
    bulkOrder: {
        title: "Toplu Yemek & Organizasyon",
        text: "Düğün, nişan, mevlüt, iş yeri yemekleri ve özel günleriniz için toplu pilav siparişi alıyoruz. Özel araçlarımızla sıcak teslimat yapıyoruz.",
        whatsappMessage: "Merhaba, toplu yemek organizasyonu hakkında bilgi almak istiyorum."
    },
    socials: {
        whatsapp: "905344982927", // Telefon numarasını buraya girin (başında + olmadan)
        instagram: "https://instagram.com",
        facebook: "https://facebook.com"
    }
};

// --- RENDER FUNCTIONS ---

document.addEventListener('DOMContentLoaded', () => {
    renderLogo();
    renderHero();
    renderAbout();
    renderMenu();
    renderBulkOrder();
    renderContact();
    renderSocials();
    renderFloatingWhatsapp();
    document.getElementById('year').textContent = new Date().getFullYear();
    setupMobileNav();
});

function renderLogo() {
    // SVG Logo Creation
    const logoContainer = document.getElementById('logo-container');
    const svgLogo = `
    <svg viewBox="0 0 300 80" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(10, 5) scale(0.9)">
            <!-- Steam -->
            <path d="M25 20 Q30 5 35 20 T45 20" stroke="#e67e22" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M40 15 Q45 0 50 15 T60 15" stroke="#e67e22" stroke-width="3" fill="none" stroke-linecap="round"/>
            
            <!-- Rice -->
            <path d="M15 40 Q40 10 65 40" fill="#fff" stroke="#e67e22" stroke-width="2"/>
            
            <!-- Bowl -->
            <path d="M10 40 Q40 80 70 40" fill="#2c3e50" />
            <line x1="10" y1="40" x2="70" y2="40" stroke="#2c3e50" stroke-width="2"/>
        </g>
        
        <!-- Text -->
        <text x="80" y="45" font-family="Oswald, sans-serif" font-size="28" fill="#2c3e50" font-weight="bold">PİLAVCI</text>
        <text x="80" y="72" font-family="Oswald, sans-serif" font-size="22" fill="#e67e22" font-weight="bold" letter-spacing="1">HALİL USTA</text>
    </svg>
    `;
    logoContainer.innerHTML = svgLogo;
}

function renderHero() {
    const heroContainer = document.getElementById('hero-content');
    heroContainer.innerHTML = `
        <h1>${siteContent.hero.title}</h1>
        <p>${siteContent.hero.slogan}</p>
        <a href="#menu" class="btn">${siteContent.hero.buttonText}</a>
    `;
}

function renderAbout() {
    const aboutContainer = document.getElementById('about-content');
    aboutContainer.innerHTML = `
        <h2 class="section-title">${siteContent.about.title}</h2>
        <div class="about-wrapper">
            <div class="about-text">
                <p>${siteContent.about.text}</p>
            </div>
            <div class="about-image">
                <img src="${siteContent.about.imageUrl}" alt="Pilavcı Halil Usta Mutfak">
            </div>
        </div>
    `;
}

function renderMenu() {
    const menuGrid = document.getElementById('menu-grid');
    let menuHTML = '';

    siteContent.menu.forEach(item => {
        menuHTML += `
            <div class="menu-card">
                <div class="menu-img" style="background-image: url('${item.image}');"></div>
                <div class="menu-info">
                    <h3>${item.name}</h3>
                    <p>${item.description}</p>
                    <span class="price">${item.price}</span>
                </div>
            </div>
        `;
    });

    menuGrid.innerHTML = menuHTML;
}

function renderContact() {
    const contactContainer = document.getElementById('contact-content');
    contactContainer.innerHTML = `
        <div class="contact-info">
            <div class="info-item">
                <div>
                    <h4>Adres</h4>
                    <p>${siteContent.contact.address}</p>
                </div>
            </div>
            <div class="info-item">
                <div>
                    <h4>Telefon</h4>
                    <p>${siteContent.contact.phone}</p>
                </div>
            </div>
            <div class="info-item">
                <div>
                    <h4>Çalışma Saatleri</h4>
                    <p>${siteContent.contact.hours}</p>
                </div>
            </div>
        </div>
        <div class="contact-map">
            <div class="map-placeholder">
                ${siteContent.contact.mapText}
            </div>
        </div>
    `;
}

function renderBulkOrder() {
    const container = document.getElementById('bulk-order-content');
    const waLink = `https://wa.me/${siteContent.socials.whatsapp}?text=${encodeURIComponent(siteContent.bulkOrder.whatsappMessage)}`;

    container.innerHTML = `
        <div class="bulk-order-wrapper">
            <div class="bulk-text">
                <h2 class="section-title" style="color: #fff; text-align: left; margin-bottom: 20px;">${siteContent.bulkOrder.title}</h2>
                <p>${siteContent.bulkOrder.text}</p>
                <a href="${waLink}" target="_blank" class="btn btn-whatsapp">
                    <i class="fab fa-whatsapp"></i> Fiyat Teklifi Al
                </a>
            </div>
            <div class="bulk-icon">
                <i class="fas fa-truck-moving"></i>
            </div>
        </div>
    `;
}

function renderSocials() {
    const container = document.getElementById('social-links');
    container.innerHTML = `
        <a href="${siteContent.socials.instagram}" target="_blank"><i class="fab fa-instagram"></i></a>
        <a href="${siteContent.socials.facebook}" target="_blank"><i class="fab fa-facebook-f"></i></a>
        <a href="https://wa.me/${siteContent.socials.whatsapp}" target="_blank"><i class="fab fa-whatsapp"></i></a>
    `;
}

function renderFloatingWhatsapp() {
    const container = document.getElementById('floating-whatsapp');
    container.innerHTML = `
        <a href="https://wa.me/${siteContent.socials.whatsapp}" class="float-wa" target="_blank">
            <i class="fab fa-whatsapp my-float"></i>
        </a>
    `;
}

function setupMobileNav() {
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li');

    burger.addEventListener('click', () => {
        // Toggle Nav
        nav.classList.toggle('nav-active');

        // Animate Links
        navLinks.forEach((link, index) => {
            if (link.style.animation) {
                link.style.animation = '';
            } else {
                link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
            }
        });

        // Burger Animation
        burger.classList.toggle('toggle');
    });
}
