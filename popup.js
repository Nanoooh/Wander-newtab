(function () {
  const PRELOAD_THEME_KEY = 'wander-preload-theme';
  const PRELOAD_RANDOM_THEME_KEY = 'wander-preload-random-theme';

  const THEME_GROUPS = [
    { label: 'Original', keys: ['classic'] },
    { label: 'Light - Soft / Elegant', keys: ['soft-editorial', 'cartesian', 'blue-professional', 'longtable'] },
    { label: 'Light - Bold / Graphic', keys: ['neo-grid-bold', 'creative-mode', 'block-frame', 'bold-poster', 'raw-grid', 'peoples-platform'] },
    { label: 'Light - Playful / Warm', keys: ['capsule', 'daisy-days', 'scatterbrain', 'retro-zine'] },
    { label: 'Light - Specialty', keys: ['pin-and-paper', 'retro-windows', 'sakura-chroma', 'stencil-tablet', 'cobalt-grid'] },
    { label: 'Dark', keys: ['broadside', 'pink-script', 'vellum'] },
    { label: 'Mixed', keys: ['coral', 'editorial-tri-tone', 'signal'] },
  ];

  function rememberThemePreference(themeKey, isRandomEnabled) {
    try {
      localStorage.setItem(PRELOAD_THEME_KEY, themeKey);
      localStorage.setItem(PRELOAD_RANDOM_THEME_KEY, String(isRandomEnabled));
    } catch {
      // Preload cache is an optimization only; settings are still stored in chrome.storage.
    }
  }

  function render(isInitial = false) {
    const list = document.getElementById('themeList');
    const count = document.getElementById('themeCount');
    const randomToggle = document.getElementById('randomToggle');
    list.innerHTML = '';
    count.textContent = THEME_ORDER.length + ' styles';

    const storage = globalThis.chrome?.storage?.local;

    if (storage) {
      storage.get([STORAGE_KEY, 'wander-random-theme'], (result) => {
        const current = result[STORAGE_KEY] || DEFAULT_THEME;
        const isRandom = result['wander-random-theme'] !== false;
        randomToggle.checked = isRandom;
        updateCurrentPanel(current, isRandom);
        buildList(list, current, isInitial);
      });
    } else {
      updateCurrentPanel(DEFAULT_THEME, false);
      buildList(list, DEFAULT_THEME, isInitial);
    }

    randomToggle.onchange = (e) => {
      const isRandom = e.target.checked;
      if (storage) {
        storage.set({ 'wander-random-theme': isRandom });
      }
      const active = document.querySelector('.theme-option.is-active');
      const themeKey = active?.dataset.theme || DEFAULT_THEME;
      rememberThemePreference(themeKey, isRandom);
      updateCurrentPanel(themeKey, isRandom);
    };
  }

  function buildList(list, current, isInitial) {
    THEME_GROUPS.forEach((group) => {
      const groupEl = document.createElement('section');
      groupEl.className = 'theme-group';
      groupEl.setAttribute('aria-label', group.label);
      groupEl.innerHTML = `<div class="group-label">${escapeHtml(group.label)}</div>`;

      group.keys.forEach((key) => {
        const theme = THEMES[key];
        if (!theme) return;

        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'theme-option' + (key === current ? ' is-active' : '');
        option.dataset.theme = key;
        option.setAttribute('aria-pressed', key === current ? 'true' : 'false');
        option.title = `${theme.name} - ${themeMeta(theme)}`;

        let swatchesHtml = '<div class="theme-swatches">';
        theme.preview.forEach((color) => {
          swatchesHtml += `<div class="theme-swatch" style="background:${color}"></div>`;
        });
        swatchesHtml += '</div>';

        option.innerHTML = `
          ${swatchesHtml}
          <span class="theme-name">${escapeHtml(theme.name)}</span>
          <span class="theme-check" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 10l4 4 8-8"/>
            </svg>
          </span>
          <span class="theme-type">${escapeHtml(themeMeta(theme))}</span>
          <span class="selected-mark">Selected</span>
        `;

        option.addEventListener('click', () => selectTheme(key));
        groupEl.appendChild(option);
      });
      list.appendChild(groupEl);
    });

    if (isInitial) list.scrollTop = 0;
  }

  function updateActiveState(key) {
    const list = document.getElementById('themeList');
    Array.from(list.querySelectorAll('.theme-option')).forEach(option => {
      if (option.dataset.theme === key) {
        option.classList.add('is-active');
        option.setAttribute('aria-pressed', 'true');
      } else {
        option.classList.remove('is-active');
        option.setAttribute('aria-pressed', 'false');
      }
    });
    const randomToggle = document.getElementById('randomToggle');
    if (randomToggle) randomToggle.checked = false;
    updateCurrentPanel(key, false);
  }

  function selectTheme(key) {
    const storage = globalThis.chrome?.storage?.local;
    rememberThemePreference(key, false);
    if (storage) {
      storage.set({ [STORAGE_KEY]: key, 'wander-random-theme': false }, () => {
        globalThis.chrome?.runtime?.sendMessage?.({ type: 'theme-changed', theme: key });
        updateActiveState(key);
      });
    } else {
      updateActiveState(key);
    }
  }

  render(true);

  function updateCurrentPanel(key, isRandom) {
    const theme = THEMES[key] || THEMES[DEFAULT_THEME];
    const name = document.getElementById('currentName');
    const meta = document.getElementById('currentMeta');
    const mode = document.getElementById('currentMode');
    if (!theme || !name || !meta || !mode) return;

    name.textContent = theme.name;
    meta.textContent = themeMeta(theme);
    mode.textContent = isRandom ? 'Random' : 'Manual';
  }

  function themeMeta(theme) {
    return [
      formatToken(theme.scheme),
      formatToken(theme.layout),
      formatToken(theme.type),
    ].filter(Boolean).join(' / ');
  }

  function formatToken(value) {
    return String(value || '')
      .replace(/^l-/, '')
      .split('-')
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
