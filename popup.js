(function () {
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
        const isRandom = result['wander-random-theme'] === true;
        randomToggle.checked = isRandom;
        buildList(list, current, isInitial);
      });
    } else {
      buildList(list, DEFAULT_THEME, isInitial);
    }

    randomToggle.onchange = (e) => {
      const isRandom = e.target.checked;
      if (storage) {
        storage.set({ 'wander-random-theme': isRandom });
      }
    };
  }

  function buildList(list, current, isInitial) {
    THEME_ORDER.forEach((key) => {
      const theme = THEMES[key];
      if (!theme) return;

      const option = document.createElement('div');
      option.className = 'theme-option' + (key === current ? ' is-active' : '');
      option.dataset.theme = key;

      let swatchesHtml = '<div class="theme-swatches">';
      theme.preview.forEach((color) => {
        swatchesHtml += `<div class="theme-swatch" style="background:${color}"></div>`;
      });
      swatchesHtml += '</div>';

      option.innerHTML = `
        ${swatchesHtml}
        <span class="theme-name">${theme.name}</span>
        <div class="theme-check">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 10l4 4 8-8"/>
          </svg>
        </div>
      `;

      option.addEventListener('click', () => selectTheme(key));
      list.appendChild(option);
    });

    // Scroll active theme into view only on initial render
    if (isInitial) {
      const active = list.querySelector('.is-active');
      if (active) {
        active.scrollIntoView({ block: 'nearest' });
      }
    }
  }

  function updateActiveState(key) {
    const list = document.getElementById('themeList');
    Array.from(list.children).forEach(option => {
      if (option.dataset.theme === key) {
        option.classList.add('is-active');
      } else {
        option.classList.remove('is-active');
      }
    });
    const randomToggle = document.getElementById('randomToggle');
    if (randomToggle) randomToggle.checked = false;
  }

  function selectTheme(key) {
    const storage = globalThis.chrome?.storage?.local;
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
})();
