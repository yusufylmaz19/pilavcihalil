async function initApp() {
    try {
        await openDB();
        const resp = await fetch('data.json');
        const data = await resp.json();
        menuData = data;
        defaultCategories = JSON.parse(JSON.stringify(data.menu.categories));
        const merged = await getMergedCategories();
        buildMenuPanel(merged);
        loadAutoZSettings();
    } catch (err) {
        console.error('Başlatma hatası:', err);
    }
}

document.addEventListener('DOMContentLoaded', initApp);
