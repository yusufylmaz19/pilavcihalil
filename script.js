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
        phone: "+90 212 555 00 00",
        hours: "Her gün: 11:00 - 23:00",
        mapText: '<iframe width="100%" height="100%" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://maps.google.com/maps?q=40.9655,29.2620&hl=tr&z=14&output=embed"></iframe>'
    }
};

// --- RENDER FUNCTIONS ---

document.addEventListener('DOMContentLoaded', () => {
    renderLogo();
    renderHero();
    renderAbout();
    renderMenu();
    renderContact();
    document.getElementById('year').textContent = new Date().getFullYear();
    setupMobileNav();
});

function renderLogo() {
    // SVG Logo Creation
    const logoContainer = document.getElementById('logo-container');
    const svgLogo = `
    <svg viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg">
        <!-- Icon: A stylized bowl with steam -->
        <circle cx="50" cy="60" r="30" fill="#e67e22" />
        <path d="M20 60 Q50 90 80 60" fill="#fff" />
        <path d="M35 25 Q45 10 55 25 T75 25" stroke="#e67e22" stroke-width="3" fill="none" />
        <path d="M25 35 Q35 20 45 35 T65 35" stroke="#e67e22" stroke-width="3" fill="none" />
        
        <!-- Text -->
        <text x="90" y="50" font-family="Oswald, sans-serif" font-size="30" fill="#2c3e50" font-weight="bold">PİLAVCI</text>
        <text x="90" y="80" font-family="Oswald, sans-serif" font-size="24" fill="#e67e22" font-weight="bold">HALİL USTA</text>
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
