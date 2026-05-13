const CARDS_COUNT = 6;

const PALETTE = [
  'oklch(82% 0.086 87)',  // aged straw
  'oklch(45% 0.071 139)', // deep leaf
  'oklch(74% 0.058 21)',  // dusty clay
  'oklch(84% 0.057 263)', // pale periwinkle
  'oklch(69% 0.047 191)', // weathered blue
  'oklch(78% 0.056 57)',  // warm kraft
];

const CARD_SIZES = ['hero', 'wide', 'tall', 'tall', 'small', 'small'];

const LAYOUTS = [
  {
    name: 'a',
    sizes: ['hero', 'wide', 'tall', 'tall', 'small', 'small'],
    lines: [3, 3, 4, 4, 3, 3],
  },
  {
    name: 'b',
    sizes: ['hero', 'tall', 'small', 'tall', 'tall', 'small'],
    lines: [3, 4, 3, 4, 4, 2],
  },
  {
    name: 'c',
    sizes: ['hero', 'strip', 'small', 'small', 'tall', 'wide'],
    lines: [3, 2, 3, 3, 4, 2],
  },
  {
    name: 'd',
    sizes: ['hero', 'small', 'small', 'tall', 'small', 'tall'],
    lines: [3, 3, 3, 4, 3, 4],
  },
];

function updateDate() {
  const now = new Date();
  const date = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  document.getElementById('headerDate').textContent = date;
}

function flattenBookmarks(nodes, folderPath = '') {
  const results = [];

  for (const node of nodes) {
    const path = folderPath
      ? (node.title ? `${folderPath} / ${node.title}` : folderPath)
      : (node.title || '');

    if (node.url) {
      results.push({
        title: node.title || node.url,
        url: node.url,
        folder: folderPath || 'Bookmarks',
      });
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

function shuffleArray(arr) {
  return sample(arr, arr.length);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

let lastLayoutName = '';

function pickLayout() {
  const options = LAYOUTS.filter((layout) => layout.name !== lastLayoutName);
  const layout = options[Math.floor(Math.random() * options.length)] || LAYOUTS[0];
  lastLayoutName = layout.name;
  return layout;
}

function displayDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
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
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function siteInitial(domain) {
  const cleaned = domain.replace(/^[^a-z0-9]+/i, '');
  return (cleaned[0] || '?').toUpperCase();
}

function renderCards(bookmarks) {
  const grid = document.getElementById('cardsGrid');

  if (!bookmarks || bookmarks.length === 0) {
    grid.className = 'board';
    grid.innerHTML = `<div class="empty">
      <div class="empty-title">Nothing saved yet</div>
      <div class="empty-sub">Save a few sites to Chrome bookmarks and Wander will make a new spread.</div>
    </div>`;
    return;
  }

  const picks = sample(bookmarks, Math.min(CARDS_COUNT, bookmarks.length));
  const colors = shuffleArray(PALETTE);
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

  picks.forEach((bookmark, i) => {
    const link = document.createElement('a');
    const folder = cleanFolder(bookmark.folder);
    const domain = displayDomain(bookmark.url);

    link.className = `bookmark slot-${i}`;
    link.href = bookmark.url;
    link.dataset.size = layout.sizes[i] || CARD_SIZES[i] || 'small';
    link.style.setProperty('--card-bg', colors[i % colors.length]);
    link.style.setProperty('--tilt', '0deg');
    link.style.setProperty('--scale', '1');
    link.style.setProperty('--drift-x', '0px');
    link.style.setProperty('--deal-x', `${randomBetween(-34, 34).toFixed(1)}px`);
    link.style.setProperty('--deal-y', `${randomBetween(18, 46).toFixed(1)}px`);
    link.style.setProperty('--deal-tilt', `${randomBetween(-3.2, 3.2).toFixed(2)}deg`);
    link.style.setProperty('--lines', layout.lines[i] || 4);

    link.innerHTML = `
      <div class="bookmark-top">
        <span class="folder">${esc(folder)}</span>
        <span class="site-mark" aria-hidden="true">${esc(siteInitial(domain))}</span>
      </div>
      <div class="title">${esc(bookmark.title)}</div>
      <div class="bookmark-bottom">
        <span class="domain">${esc(domain)}</span>
        <span class="issue">${String(i + 1).padStart(2, '0')}</span>
      </div>
    `;

    grid.appendChild(link);
  });

  if (mode === 'deal' || mode === 'enter') {
    const className = mode === 'deal' ? 'is-dealing' : 'is-entering';
    const delay = mode === 'deal' ? 620 : 760;
    settleTimer = window.setTimeout(() => grid.classList.remove(className), delay);
  }
}

function setBookmarkCount(count) {
  const label = count === 1 ? '1 bookmark' : `${count} bookmarks`;
  document.getElementById('headerCount').textContent = label;
}

let allBookmarks = [];
let settleTimer = 0;

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
