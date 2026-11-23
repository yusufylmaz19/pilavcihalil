// Firestore settings koleksiyonu boşsa varsayılan değerlerle doldur
async function seedSettings() {
  const existing = await getSettings();
  if (existing) return;
  await saveSettings(defaultSettings);
}

// Firestore products koleksiyonu boşsa data.json'dan seed et
async function seedProducts() {
  const existing = await getAllProducts();
  if (existing.length > 0) return;

  const writes = [];
  defaultCategories.forEach((cat, catIdx) => {
    cat.items.forEach((item, itemIdx) => {
      writes.push(
        saveProduct({
          name: item.name,
          emoji: item.emoji || "🍽️",
          desc: item.desc || "",
          price: item.price || 0,
          hasPortions: item.hasPortions !== undefined ? item.hasPortions : true,
          color: item.color || "",
          category: cat.id,
          categoryLabel: cat.label,
          order: catIdx * 100 + itemIdx,
          isCustom: false,
        }),
      );
    });
  });
  await Promise.all(writes);
}

async function initApp() {
  try {
    const resp = await fetch("data.json");
    const data = await resp.json();
    menuData = data;
    defaultCategories = JSON.parse(JSON.stringify(data.menu.categories));
    defaultSettings = JSON.parse(
      JSON.stringify({
        restaurant: data.restaurant,
        contact: data.contact,
        platforms: data.platforms,
      }),
    );

    // Firestore'da ayar yoksa varsayılan değerlerle doldur
    await seedSettings();
    await loadCategories();

    // Firestore'da ürün yoksa data.json'dan yükle
    await seedProducts();

    // Komboları yükle
    if (typeof loadCombos === "function") {
      await loadCombos();
    }

    const merged = await getMergedCategories();
    buildMenuPanel(merged);

    // Kombo panelini oluştur
    if (typeof buildCombosPanel === "function") {
      buildCombosPanel(merged);
    }

    loadAutoZSettings();
  } catch (err) {
    console.error("Başlatma hatası:", err);
  }
}

// initApp, auth.js tarafından giriş onaylandıktan sonra çağrılır.

// Diğer bir cihazdan yapılan değişiklikleri gerektiğinde elle al.
// Normal kullanım cache üzerinden ilerlediği için her sayfa yenilemede okuma yapılmaz.
async function refreshAdminData() {
  const btn = document.getElementById('btn-refresh-data');
  if (btn) btn.disabled = true;
  try {
    _invalidate('settings');
    _invalidate('products');
    _invalidate('combos');
    _invalidateHistory();

    const [settings, , combos] = await Promise.all([
      getSettings(),
      getAllProducts(),
      getAllCombos()
    ]);
    activeCombos = combos;
    applyCategories(settings);
    const merged = await getMergedCategories();
    buildMenuPanel(merged);
    buildCombosPanel(merged);
    showToast('Firebase verileri yenilendi.', 'success');
  } catch (err) {
    console.error('Veri yenileme hatası:', err);
    showToast('Veriler yenilenemedi.', '');
  } finally {
    if (btn) btn.disabled = false;
  }
}
