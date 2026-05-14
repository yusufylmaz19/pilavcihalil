// Firebase Compat SDK ile başlatma (CDN üzerinden yüklenir, import gerekmez)
const firebaseConfig = {
    apiKey: "AIzaSyDwJ7SQYtKsUa9WdSaslUbHTLzjbIAiTnY",
    authDomain: "max-pilav.firebaseapp.com",
    projectId: "max-pilav",
    storageBucket: "max-pilav.firebasestorage.app",
    messagingSenderId: "612481177612",
    appId: "1:612481177612:web:fdd6735071d9416ca8b629",
    measurementId: "G-FNPD0P0G6T"
};

firebase.initializeApp(firebaseConfig);

try {
    firebase.analytics();
} catch (e) {
    // Analytics yüklenemezse sessizce devam et
}
