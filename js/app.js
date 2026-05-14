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

document.addEventListener("DOMContentLoaded", initApp);
