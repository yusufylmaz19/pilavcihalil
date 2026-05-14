// ═══════════════════════════════════════
// GOOGLE AUTH YÖNETİMİ
// ═══════════════════════════════════════

const ADMIN_EMAILS = [
    'yusufylmaz15@gmail.com',
    'maxpilavhalilusta@gmail.com'
];

function signInWithGoogle() {
    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="login-spinner"></span> Giriş yapılıyor...';

    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).catch(err => {
        console.error('Giriş hatası:', err);
        btn.disabled = false;
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Google ile Giriş Yap';
    const errEl = document.getElementById('login-error');
    if (errEl) errEl.textContent = '⚠️ Giriş başarısız. Tekrar dene.';
    });
}

function adminSignOut() {
    firebase.auth().signOut();
}

// ── Auth durum gözlemcisi ──
firebase.auth().onAuthStateChanged(function(user) {
    const loginScreen = document.getElementById('login-screen');
    const appContent  = document.getElementById('app-content');
    const errEl       = document.getElementById('login-error');
    const userNameEl  = document.getElementById('topbar-user-name');

    if (user && ADMIN_EMAILS.includes(user.email)) {
        // Yetkili kullanıcı → paneli aç
        loginScreen.style.display = 'none';
        appContent.style.display  = '';

        if (userNameEl) userNameEl.textContent = user.displayName || user.email;

        // initApp henüz çalışmadıysa çağır
        if (!window._appInitialized) {
            window._appInitialized = true;
            if (typeof initApp === 'function') {
                initApp().catch(function(err) {
                    console.error('Uygulama yüklenemedi:', err);
                    window._appInitialized = false;
                    firebase.auth().signOut();
                });
            }
        }
    } else if (user) {
        // Giriş yapıldı ama yetkisiz
        window._unauthorizedSignOut = true;
        firebase.auth().signOut();
    } else {
        // Çıkış yapıldı / giriş yok
        loginScreen.style.display = 'flex';
        appContent.style.display  = 'none';
        if (userNameEl) userNameEl.textContent = '';
        window._appInitialized = false;

        // Butonu varsayılan hale getir
        const btn = document.getElementById('login-btn');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Google ile Giriş Yap';
        }

        if (window._unauthorizedSignOut) {
            window._unauthorizedSignOut = false;
            if (errEl) errEl.textContent = '⛔ Bu hesabın erişim yetkisi bulunmuyor.';
            if (typeof showToast === 'function') showToast('⛔ Yetkisiz hesap. Giriş reddedildi.', '');
        } else {
            if (errEl) errEl.textContent = '';
        }
    }
});
