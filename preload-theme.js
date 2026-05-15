(function () {
  const cachedKey = 'wander-preload-theme';
  const cachedRandomKey = 'wander-preload-random-theme';
  const root = document.documentElement;
  let revealed = false;

  root.style.visibility = 'hidden';
  root.dataset.themeResolving = 'true';

  function rememberThemePreference(themeKey, isRandomEnabled) {
    try {
      localStorage.setItem(cachedKey, themeKey);
      localStorage.setItem(cachedRandomKey, String(isRandomEnabled));
    } catch {
      // Preload cache is an optimization only.
    }
  }

  function reveal() {
    if (revealed) return;
    revealed = true;
    root.style.visibility = '';
    delete root.dataset.themeResolving;
  }

  function applyPreloadTheme(themeKey) {
    const resolvedKey = THEMES[themeKey] ? themeKey : DEFAULT_THEME;
    const theme = THEMES[resolvedKey];

    root.setAttribute('data-theme', resolvedKey);
    root.setAttribute('data-theme-type', theme.type);
    Object.entries(theme.cssVars).forEach(([prop, value]) => {
      root.style.setProperty(prop, value);
    });
    root.style.setProperty('--display-font', theme.fonts.display);
    root.style.setProperty('--body-font', theme.fonts.body);
    root.style.setProperty('--brand-font', theme.fonts.display);
    preloadFonts(theme.fontUrls);
  }

  function normalizedFontUrl(url) {
    if (url.includes('display=')) {
      return url.replace(/([?&])display=[^&]+/, '$1display=optional');
    }
    return url + (url.includes('?') ? '&' : '?') + 'display=optional';
  }

  function preloadFonts(urls) {
    urls.forEach((url) => {
      const href = normalizedFontUrl(url);
      if (Array.from(document.querySelectorAll('link[data-wander-font]')).some((link) => link.dataset.wanderFont === href)) return;

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.dataset.wanderFont = href;
      document.head.appendChild(link);
    });
  }

  try {
    const cachedRandom = localStorage.getItem(cachedRandomKey);
    const hasCachedMode = cachedRandom !== null;
    const isRandom = hasCachedMode ? cachedRandom !== 'false' : true;
    const cachedTheme = localStorage.getItem(cachedKey);
    const themeKey = isRandom
      ? THEME_ORDER[Math.floor(Math.random() * THEME_ORDER.length)]
      : cachedTheme || DEFAULT_THEME;

    applyPreloadTheme(themeKey);
    reveal();

    if (globalThis.chrome?.storage?.local) {
      chrome.storage.local.get([STORAGE_KEY, 'wander-random-theme'], (result) => {
        const isStoredRandom = result['wander-random-theme'] !== false;
        const storedTheme = result[STORAGE_KEY] || DEFAULT_THEME;
        const resolvedTheme = isStoredRandom ? themeKey : storedTheme;

        applyPreloadTheme(resolvedTheme);
        rememberThemePreference(resolvedTheme, isStoredRandom);
        reveal();
      });
    } else {
      rememberThemePreference(themeKey, isRandom);
      reveal();
    }
  } catch {
    applyPreloadTheme(DEFAULT_THEME);
    reveal();
  }
})();
