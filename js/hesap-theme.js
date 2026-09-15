(() => {
  const root = document.documentElement;

  function applyTheme(theme) {
    root.dataset.theme = theme;
    localStorage.setItem('max-admin-theme', theme);
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    const light = theme === 'light';
    toggle.setAttribute('aria-label', light ? 'Koyu temaya geç' : 'Açık temaya geç');
    toggle.innerHTML = `<i data-lucide="${light ? 'moon' : 'sun'}"></i>`;
    window.lucide?.createIcons();
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(root.dataset.theme || 'dark');
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
    });
    window.lucide?.createIcons();
  });
})();
