const CARDS_COUNT = 6;

const CARD_SIZES = ['hero', 'wide', 'tall', 'tall', 'small', 'small'];

const LAYOUTS = [
  { name: 'a', sizes: ['hero', 'wide', 'tall', 'tall', 'small', 'small'], lines: [3, 3, 4, 4, 3, 3] },
  { name: 'b', sizes: ['hero', 'tall', 'small', 'tall', 'tall', 'small'], lines: [3, 4, 3, 4, 4, 2] },
  { name: 'c', sizes: ['hero', 'strip', 'small', 'small', 'tall', 'wide'], lines: [3, 2, 3, 3, 4, 2] },
  { name: 'd', sizes: ['hero', 'small', 'small', 'tall', 'small', 'tall'], lines: [3, 3, 3, 4, 3, 4] },
  { name: 'e', sizes: ['hero', 'tall', 'tall', 'wide', 'small', 'small'], lines: [3, 4, 4, 3, 3, 3] },
  { name: 'f', sizes: ['hero', 'strip', 'wide', 'tall', 'small', 'small'], lines: [3, 2, 3, 4, 3, 3] },
  { name: 'g', sizes: ['hero', 'tall', 'tall', 'wide', 'small', 'small'], lines: [3, 4, 4, 3, 3, 3] },
  { name: 'h', sizes: ['hero', 'tall', 'tall', 'wide', 'small', 'small'], lines: [3, 4, 4, 3, 3, 3] },
  { name: 'i', sizes: ['hero', 'wide', 'tall', 'tall', 'small', 'small'], lines: [3, 3, 4, 4, 3, 3] },
  { name: 'j', sizes: ['hero', 'tall', 'small', 'tall', 'strip', 'strip'], lines: [3, 4, 3, 4, 2, 2] },
  { name: 'k', sizes: ['hero', 'tall', 'tall', 'tall', 'tall', 'wide'], lines: [3, 4, 4, 4, 4, 3] },
  { name: 'l', sizes: ['wide', 'small', 'hero', 'tall', 'strip', 'strip'], lines: [3, 3, 3, 4, 2, 2] },
];

let currentThemeKey = DEFAULT_THEME;
let currentPalette = THEMES.classic.palette;
let allBookmarks = [];
let settleTimer = 0;

/* ===== Color utilities ===== */

const _colorCache = new Map();

function parseColor(color) {
  if (_colorCache.has(color)) return _colorCache.get(color);
  const temp = document.createElement('div');
  temp.style.color = color;
  temp.style.position = 'absolute';
  temp.style.visibility = 'hidden';
  document.body.appendChild(temp);
  const computed = getComputedStyle(temp).color;
  document.body.removeChild(temp);
  const m = computed.match(/[\d.]+/g);
  const result = (!m || m.length < 3) ? null : [Number(m[0]), Number(m[1]), Number(m[2])];
  _colorCache.set(color, result);
  return result;
}

function isColorDark(color) {
  const rgb = parseColor(color);
  if (!rgb) return false;
  return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) < 140;
}

function colorsAreClose(c1, c2, threshold = 35) {
  const rgb1 = parseColor(c1);
  const rgb2 = parseColor(c2);
  if (!rgb1 || !rgb2) return false;
  const dist = Math.sqrt(
    (rgb1[0] - rgb2[0]) ** 2 +
    (rgb1[1] - rgb2[1]) ** 2 +
    (rgb1[2] - rgb2[2]) ** 2
  );
  return dist < threshold;
}

/* ===== Theme system ===== */

function applyTheme(themeKey) {
  const theme = THEMES[themeKey];
  if (!theme) return;

  currentThemeKey = themeKey;
  currentPalette = theme.palette;

  document.documentElement.setAttribute('data-theme', themeKey);
  document.documentElement.setAttribute('data-theme-type', theme.type);

  const root = document.documentElement;
  Object.entries(theme.cssVars).forEach(([prop, value]) => {
    root.style.setProperty(prop, value);
  });

  root.style.setProperty('--display-font', theme.fonts.display);
  root.style.setProperty('--body-font', theme.fonts.body);
  root.style.setProperty('--brand-font', theme.fonts.display);

  loadFonts(theme.fontUrls);
}

let fontsLoaded = new Set();

function loadFonts(urls) {
  urls.forEach((url) => {
    if (fontsLoaded.has(url)) return;
    fontsLoaded.add(url);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  });
}

function loadTheme(callback) {
  if (globalThis.chrome?.storage?.local) {
    chrome.storage.local.get([STORAGE_KEY, 'wander-random-theme'], (result) => {
      let key = result[STORAGE_KEY] || DEFAULT_THEME;
      
      if (result['wander-random-theme'] === true) {
        const THEME_ORDER = Object.keys(THEMES);
        key = THEME_ORDER[Math.floor(Math.random() * THEME_ORDER.length)];
        chrome.storage.local.set({ [STORAGE_KEY]: key });
      }
      
      applyTheme(key);
      callback();
    });
  } else {
    applyTheme(DEFAULT_THEME);
    callback();
  }
}

/* ===== Core logic ===== */

function updateDate() {
  const now = new Date();
  const date = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  document.getElementById('headerDate').textContent = date;
}

function flattenBookmarks(nodes, folderPath = '') {
  const results = [];
  for (const node of nodes) {
    const path = folderPath
      ? (node.title ? `${folderPath} / ${node.title}` : folderPath)
      : (node.title || '');
    if (node.url) {
      results.push({ title: node.title || node.url, url: node.url, folder: folderPath || 'Bookmarks' });
    } else if (node.children) {
      results.push(...flattenBookmarks(node.children, path));
    }
  }
  return results;
}

function sample(arr, n) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function shuffleArray(arr) { return sample(arr, arr.length); }

function randomBetween(min, max) { return min + Math.random() * (max - min); }

let lastLayoutName = '';

function pickLayout() {
  const options = LAYOUTS.filter((l) => l.name !== lastLayoutName);
  const layout = options[Math.floor(Math.random() * options.length)] || LAYOUTS[0];
  lastLayoutName = layout.name;
  return layout;
}

function displayDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function cleanFolder(path) {
  return path
    .replace(/^Bookmarks Bar\s*\/?\s*/i, '')
    .replace(/^Other Bookmarks\s*\/?\s*/i, '')
    .replace(/^Mobile Bookmarks\s*\/?\s*/i, '')
    .replace(/^Bookmarks\s*\/?\s*/i, '')
    .trim() || 'Saved';
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function siteInitial(domain) {
  const cleaned = domain.replace(/^[^a-z0-9]+/i, '');
  return (cleaned[0] || '?').toUpperCase();
}

function renderCards(bookmarks) {
  const grid = document.getElementById('cardsGrid');

  if (!bookmarks || bookmarks.length === 0) {
    grid.className = 'board';
    grid.innerHTML = `<div class="empty"><div class="empty-title">Nothing saved yet</div><div class="empty-sub">Save a few sites to Chrome bookmarks and Wander will make a new spread.</div></div>`;
    return;
  }

  const picks = sample(bookmarks, Math.min(CARDS_COUNT, bookmarks.length));
  const canvasColor = THEMES[currentThemeKey]?.cssVars?.['--canvas'];
  let palette = currentPalette;
  if (canvasColor) {
    const safe = palette.filter(c => !colorsAreClose(c, canvasColor));
    if (safe.length >= CARDS_COUNT) palette = safe;
  }
  const colors = shuffleArray(palette);
  const layout = pickLayout();
  const existing = grid.querySelectorAll('.bookmark');

  if (existing.length) {
    grid.classList.add('is-cutting');
    existing.forEach((card, i) => {
      const x = i % 2 === 0 ? '-18px' : '18px';
      const y = i < 3 ? '-10px' : '12px';
      const rotation = i % 2 === 0 ? '-1.4deg' : '1.2deg';
      card.style.transitionDelay = `${i * 24}ms`;
      card.style.opacity = '0';
      card.style.filter = 'blur(2px)';
      card.style.transform = `translate3d(${x}, ${y}, 0) rotate(${rotation}) scale(0.985)`;
    });
    window.setTimeout(() => buildCards(grid, picks, colors, layout, 'deal'), 250);
  } else {
    buildCards(grid, picks, colors, layout, 'enter');
  }
}

function buildCards(grid, picks, colors, layout, mode) {
  window.clearTimeout(settleTimer);
  const stateClass = mode === 'deal' ? ' is-dealing' : mode === 'enter' ? ' is-entering' : '';
  grid.className = `board spread-${layout.name}${stateClass}`;
  grid.innerHTML = '';

  const theme = THEMES[currentThemeKey];
  const inkIsDark = isColorDark(theme.cssVars['--canvas-ink']);

  const sliceModes = ['inward', 'outward', 'random'];
  const sliceMode = sliceModes[Math.floor(Math.random() * sliceModes.length)];

  picks.forEach((bookmark, i) => {
    const link = document.createElement('a');
    const folder = cleanFolder(bookmark.folder);
    const domain = displayDomain(bookmark.url);
    const cardBg = colors[i % colors.length];

    link.className = 'bookmark slot-' + i;
    link.href = bookmark.url;
    link.dataset.size = layout.sizes[i] || CARD_SIZES[i] || 'small';
    link.style.setProperty('--card-bg', cardBg);
    link.style.setProperty('--tilt', '0deg');
    link.style.setProperty('--scale', '1');
    link.style.setProperty('--drift-x', '0px');
    link.style.setProperty('--deal-x', `${randomBetween(-34, 34).toFixed(1)}px`);
    link.style.setProperty('--deal-y', `${randomBetween(18, 46).toFixed(1)}px`);
    link.style.setProperty('--deal-tilt', `${randomBetween(-3.2, 3.2).toFixed(2)}deg`);
    link.style.setProperty('--lines', layout.lines[i] || 4);

    const isLeft = i % 2 === 0;
    const isTop = i < 2;
    const isBottom = i > 3;
    let dir = 'left';
    if (sliceMode === 'random') {
      const dirs = ['top', 'bottom', 'left', 'right'];
      dir = dirs[Math.floor(Math.random() * dirs.length)];
    } else if (sliceMode === 'inward') {
      if (isTop) dir = 'top';
      else if (isBottom) dir = 'bottom';
      else dir = isLeft ? 'left' : 'right';
    } else {
      if (isTop) dir = 'bottom';
      else if (isBottom) dir = 'top';
      else dir = isLeft ? 'right' : 'left';
    }
    link.dataset.sliceDir = dir;

    // Detect dark card and add class for contrast
    if (isColorDark(cardBg)) {
      link.classList.add('is-dark-card');
    } else if (!inkIsDark) {
      link.classList.add('is-light-card');
    }

    // Neon accents for dark/mixed themes
    if (theme.neonAccents) {
      const neonColor = theme.neonAccents[i % theme.neonAccents.length];
      link.style.borderColor = neonColor;
      link.style.boxShadow = `0 0 16px ${neonColor}33, inset 0 0 30px ${neonColor}0a`;
    }

    link.classList.add(theme.layout || 'l-classic');

    let contentHtml = '';
    const num = String(i + 1).padStart(2, '0');
    const fFolder = esc(folder);
    const fTitle = esc(bookmark.title);
    const fDomain = esc(domain);
    const fMark = esc(siteInitial(domain));

    switch (theme.layout) {
      case 'l-minimal':
        contentHtml = `<div class="folder">${fFolder}</div><div class="title">${fTitle}</div><div class="bottom"><span class="domain">${fDomain}</span><span class="number">${num}</span></div>`;
        break;
      case 'l-heavy-header':
        contentHtml = `<div class="header"><span class="folder">${fFolder}</span><span class="number">${num}</span></div><div class="mid"><div class="title">${fTitle}</div></div><div class="bottom"><span class="domain">${fDomain}</span><span class="icon">${fMark}</span></div>`;
        break;
      case 'l-magazine':
        contentHtml = `<div class="top-half"><div class="number">${num}</div></div><div class="bottom-half"><div class="title">${fTitle}</div><div class="folder">${fFolder}</div></div>`;
        break;
      case 'l-brutalist':
        contentHtml = `<div class="top"><span class="folder">${fFolder}</span><span class="number">${num}</span></div><div class="mid"><div class="title">${fTitle}</div></div><div class="bottom"><span class="domain">${fDomain}</span></div>`;
        break;
      case 'l-bento':
        contentHtml = `<div class="cell c-folder"><span class="folder">${fFolder}</span></div><div class="cell c-number">${num}</div><div class="cell c-title"><div class="title">${fTitle}</div><div class="domain">${fDomain}</div></div>`;
        break;
      case 'l-poster':
        contentHtml = `<div class="title">${fTitle}</div><div class="meta"><span class="folder">${fFolder}</span><span class="number">${num}</span></div>`;
        break;
      case 'l-badge':
        contentHtml = `<div class="badge">${num}</div><div class="folder">${fFolder}</div><div class="title">${fTitle}</div><div class="domain" style="margin-top:24px;">${fDomain}</div>`;
        break;
      case 'l-terminal':
        contentHtml = `<div class="folder">${fFolder}</div><div class="title">${fTitle}</div><div class="domain">${fDomain}</div>`;
        break;
      case 'l-index':
        contentHtml = `<div class="folder">${fFolder}.${num}</div><div class="title">${fTitle}</div><div class="bottom">${fDomain}</div>`;
        break;
      case 'l-diagonal':
        contentHtml = `<div class="top-poly"><div class="number" style="font-size:24px; font-weight:800; opacity:1;">${num}</div><div class="folder" style="margin-top:16px; opacity:0.6;">${fFolder}</div></div><div class="bottom-poly"><div class="title">${fTitle}</div><div class="domain" style="margin-top:16px;">${fDomain}</div></div>`;
        break;
      case 'l-classic':
      default:
        contentHtml = `<div class="top"><span class="folder">${fFolder}</span><span class="icon">${fMark}</span></div><div class="mid"><div class="title">${fTitle}</div></div><div class="bottom"><span class="domain">${fDomain}</span><span class="number">${num}</span></div>`;
        break;
    }

    link.innerHTML = `
      <div class="bm-bg-layer"></div>
      <div class="bm-content-layer">
        ${contentHtml}
      </div>
    `;

    // Neon site-mark for themes with neonAccents
    if (theme.neonAccents) {
      const mark = link.querySelector('.site-mark');
      if (mark) {
        const neonColor = theme.neonAccents[i % theme.neonAccents.length];
        mark.style.background = neonColor;
        mark.style.color = isColorDark(neonColor) ? '#F5F0E8' : '#0A0A0A';
      }
    }

    grid.appendChild(link);
  });

  if (mode === 'deal' || mode === 'enter') {
    const delay = mode === 'deal' ? 760 : 860;
    settleTimer = window.setTimeout(() => grid.classList.remove(stateClass.trim()), delay);
  }
}

function updateAmbientGlow() {
  const glow = document.getElementById('ambientGlow');
  if (!glow) return;
  const theme = THEMES[currentThemeKey];
  if (theme && theme.palette && theme.palette.length >= 3) {
    glow.style.setProperty('--glow-1', theme.palette[0]);
    glow.style.setProperty('--glow-2', theme.palette[1]);
    glow.style.setProperty('--glow-3', theme.palette[2]);
  }
}

function setBookmarkCount(count) {
  const label = count === 1 ? '1 bookmark' : `${count} bookmarks`;
  document.getElementById('headerCount').textContent = label;
}

/* ===== Init ===== */

updateDate();

function loadBookmarks(callback) {
  if (globalThis.chrome?.bookmarks?.getTree) {
    chrome.bookmarks.getTree(callback);
    return;
  }
  callback([{
    title: '',
    children: [{
      title: 'Bookmarks Bar',
      children: [
        { title: 'The Shape of Design Systems in Everyday Tools', url: 'https://example.com/design-systems' },
        { title: 'A Field Guide to Product Taste', url: 'https://example.com/product-taste' },
        { title: 'Notes on Quiet Interfaces and Useful Defaults', url: 'https://example.com/quiet-interfaces' },
        { title: 'Japanese Joinery Archive', url: 'https://example.com/joinery' },
        { title: 'Browser Extensions: Small Surfaces, Strong Habits', url: 'https://example.com/extensions' },
        { title: 'Designing with Constraints', url: 'https://example.com/constraints' },
        { title: 'A Long Bookmark Title That Should Wrap Like Editorial Display Type Without Escaping Its Surface', url: 'https://example.com/long-title' },
      ],
    }],
  }]);
}

loadTheme(() => {
  updateAmbientGlow();
  loadBookmarks((tree) => {
    allBookmarks = flattenBookmarks(tree);
    renderCards(allBookmarks);

    if (allBookmarks.length > 0) {
      document.getElementById('footer').style.display = 'flex';
      setBookmarkCount(allBookmarks.length);
    }

    document.getElementById('shuffleBtn').addEventListener('click', (event) => {
      const button = event.currentTarget;
      if (button.disabled) return;
      button.disabled = true;
      button.classList.remove('is-shuffling');
      void button.offsetWidth;
      button.classList.add('is-shuffling');
      renderCards(allBookmarks);
      window.setTimeout(() => {
        button.classList.remove('is-shuffling');
        button.disabled = false;
      }, 780);
    });
  });
});

if (globalThis.chrome?.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'theme-changed') {
      applyTheme(message.theme);
      updateAmbientGlow();
      renderCards(allBookmarks);
    }
  });
}
