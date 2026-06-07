/* ============================================================
   FAY RESOURCE LIBRARY — app.js
   ============================================================

   CONFIGURATION: Replace APPS_SCRIPT_URL with your deployed
   Google Apps Script Web App URL after setup.
   ============================================================ */

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQW684lRpXI3t2guOqdSdeKjR9kpGhneKfEq324_kOyzlI8Nu991CfNiS1o41bUefXFnUoaYrC-3G_9/pub?gid=1828099228&single=true&output=csv';

const CONDITIONS = [
  'Celiac Disease', 'Diabetes', 'Eating Disorders', 'Heart Health',
  'IBS', 'Kidney Disease', 'PCOS', 'Prenatal / Pregnancy',
  'Weight Management', 'Vegan / Vegetarian', 'Food Allergies',
  'High Cholesterol', 'Hypertension', 'Gut Health', 'Cancer Support',
  'Autoimmune', 'Sports Nutrition', 'Mental Health & Nutrition',
];

const RESOURCE_TYPES = [
  'PDF Guide', 'Recipe Collection', 'Meal Plan Template',
  'Grocery Guide', 'Video', 'Handout', 'Worksheet', 'Meal Prep Tool',
];

/* ── Seed data (shown when no Sheets URL is configured) ── */
const SEED_DATA = [
  {
    timestamp: '2024-01-01', npi: '1234567890', name: 'Sarah Chen, RD',
    title: 'IBS-Friendly 7-Day Meal Plan',
    description: 'A complete low-FODMAP meal plan with shopping list and prep tips designed for patients managing IBS symptoms.',
    link: '#', thumbnail: '',
    type: 'Meal Plan Template', conditions: 'IBS,Gut Health',
  },
  {
    timestamp: '2024-01-02', npi: '2345678901', name: 'Maya Patel, RD',
    title: 'PCOS Grocery Shopping Guide',
    description: 'Hormone-balancing foods and what to avoid — organized by section of the grocery store for easy shopping.',
    link: '#', thumbnail: '',
    type: 'Grocery Guide', conditions: 'PCOS,Hormonal Health',
  },
  {
    timestamp: '2024-01-03', npi: '3456789012', name: 'Jennifer Walsh, RD',
    title: 'Celiac-Safe Recipe Collection',
    description: '30 tested gluten-free recipes across breakfast, lunch, dinner, and snacks — all verified safe for celiac disease.',
    link: '#', thumbnail: '',
    type: 'Recipe Collection', conditions: 'Celiac Disease,Food Allergies',
  },
  {
    timestamp: '2024-01-04', npi: '4567890123', name: 'David Kim, RD',
    title: 'Managing Type 2 Diabetes Through Diet',
    description: 'Evidence-based handout covering carbohydrate counting, glycemic index, meal timing, and blood sugar management strategies.',
    link: '#', thumbnail: '',
    type: 'Handout', conditions: 'Diabetes',
  },
  {
    timestamp: '2024-01-05', npi: '5678901234', name: 'Aisha Johnson, RD',
    title: 'Complete Plant-Based Protein Guide',
    description: 'How to meet protein needs on a vegan or vegetarian diet — includes complete protein combinations and sample meals.',
    link: '#', thumbnail: '',
    type: 'PDF Guide', conditions: 'Vegan / Vegetarian,Sports Nutrition',
  },
  {
    timestamp: '2024-01-06', npi: '6789012345', name: 'Robert Torres, RD',
    title: 'Heart-Healthy Meal Planning Basics',
    description: 'Step-by-step template for building heart-healthy meals. Covers sodium, saturated fat, and fiber targets with example menus.',
    link: '#', thumbnail: '',
    type: 'Meal Plan Template', conditions: 'Heart Health,Hypertension,High Cholesterol',
  },
  {
    timestamp: '2024-01-07', npi: '7890123456', name: 'Lisa Chen, RD',
    title: 'Prenatal Nutrition Essentials',
    description: 'Key nutrients for every trimester — folate, iron, calcium, DHA — with food sources and supplement guidance.',
    link: '#', thumbnail: '',
    type: 'Handout', conditions: 'Prenatal / Pregnancy',
  },
  {
    timestamp: '2024-01-08', npi: '8901234567', name: 'Emma Davis, RD',
    title: 'Anti-Inflammatory Starter Kit',
    description: 'A 2-week introduction to anti-inflammatory eating with meal ideas, a pantry list, and foods to limit.',
    link: '#', thumbnail: '',
    type: 'PDF Guide', conditions: 'Autoimmune,Weight Management,Gut Health',
  },
  {
    timestamp: '2024-01-09', npi: '9012345678', name: 'Marcus Williams, RD',
    title: 'Kidney-Friendly Recipe Collection',
    description: 'Recipes designed to meet CKD dietary restrictions — low potassium, low phosphorus, and controlled protein.',
    link: '#', thumbnail: '',
    type: 'Recipe Collection', conditions: 'Kidney Disease',
  },
  {
    timestamp: '2024-01-10', npi: '0123456789', name: 'Sophia Martinez, RD',
    title: 'Intuitive Eating Foundations Worksheet',
    description: 'A guided self-reflection worksheet for patients beginning their intuitive eating journey — includes hunger scale and food journal prompts.',
    link: '#', thumbnail: '',
    type: 'Worksheet', conditions: 'Eating Disorders,Mental Health & Nutrition',
  },
];

/* ── State ── */
let allResources = [];
let selectedConditions = new Set();
let selectedTypes = new Set();

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', () => {
  buildDropdown('condition', CONDITIONS, selectedConditions);
  buildDropdown('type', RESOURCE_TYPES, selectedTypes);
  loadResources();
});

/* ── Load resources from published CSV ── */
async function loadResources() {
  try {
    const res  = await fetch(SHEET_CSV_URL);
    const text = await res.text();
    const rows = parseCSV(text);
    console.log('Sheets CSV response:', rows);
    const data = rows.length ? rows : [...SEED_DATA];
    allResources = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (err) {
    console.error('Failed to load CSV:', err);
    allResources = [...SEED_DATA];
  }
  handleNewParam();
  renderCards();
}

/* ── CSV parser ── */
const HEADER_MAP = {
  'timestamp':     'timestamp',
  'npi number':    'npi',
  'npi':           'npi',
  'name':          'name',
  'resource title':'title',
  'title':         'title',
  'description':   'description',
  'resource link': 'link',
  'link':          'link',
  'thumbnail url': 'thumbnail',
  'thumbnail':     'thumbnail',
  'resource type': 'type',
  'type':          'type',
  'conditions':    'conditions',
};

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  const headers = rawHeaders.map(h => HEADER_MAP[h] || h);
  return lines.slice(1).map(line => {
    const values = line.match(/(".*?"|[^,]+)(?=,|$)/g) || [];
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (values[i] || '').trim().replace(/^"|"$/g, '');
    });
    return obj;
  }).filter(r => r.title);
}

/* ── If redirected from submit form, highlight newest card ── */
function handleNewParam() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('new') === '1') {
    allResources.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    history.replaceState(null, '', window.location.pathname);
    setTimeout(() => {
      const first = document.querySelector('.card');
      if (first) {
        first.classList.add('new-card');
        first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }
}

/* ── Filter & render ── */
function getFiltered() {
  return allResources.filter(r => {
    const rConditions = (r.conditions || '').split(',').map(s => s.trim());
    const rType = (r.type || '').trim();

    const condMatch = selectedConditions.size === 0 ||
      [...selectedConditions].some(c => rConditions.includes(c));
    const typeMatch = selectedTypes.size === 0 || selectedTypes.has(rType);

    return condMatch && typeMatch;
  });
}

function renderCards() {
  const grid = document.getElementById('grid');
  const filtered = getFiltered();

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <strong>No resources found</strong>
        <p>Try adjusting your filters or <a href="submit.html" target="_blank">submit a new resource</a>.</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map((r, i) => cardHTML(r, i)).join('');
}

function cardHTML(r, i) {
  const tags = (r.conditions || '').split(',').map(c => c.trim()).filter(Boolean);
  const imgSection = r.thumbnail
    ? `<img src="${r.thumbnail}" alt="${r.title}" />`
    : `<div class="card-img-placeholder">
        ${docIcon()}
        <span>${r.type || 'Resource'}</span>
      </div>`;

  return `
    <div class="card" style="animation-delay:${i * 0.04}s">
      <div class="card-header">
        <span class="card-badge">${escHtml(r.type || 'Resource')}</span>
        <div class="card-title">${escHtml(r.title)}</div>
        <div class="card-desc">${escHtml(r.description)}</div>
      </div>
      <div class="card-img" onclick="openModal('${escAttr(r.title)}')">
        ${imgSection}
        <div class="card-img-overlay"><span>View Resource</span></div>
      </div>
      <div class="card-footer">
        <div class="card-tags">
          ${tags.map(t => `<span class="tag">${escHtml(t)}</span>`).join('')}
        </div>
        <div class="card-rd">Contributed by ${escHtml(r.name || 'Anonymous RD')}</div>
      </div>
    </div>`;
}

function docIcon() {
  return `<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="4" width="20" height="26" rx="3" fill="currentColor" opacity="0.15"/>
    <path d="M8 4h12l6 6v18a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <path d="M20 4v6h6" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <line x1="10" y1="15" x2="26" y2="15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="10" y1="19" x2="26" y2="19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="10" y1="23" x2="20" y2="23" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`;
}

/* ── Modal ── */
function openModal(title) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal').style.display = 'flex';
}

function closeModal(e) {
  if (e.target === document.getElementById('modal')) {
    document.getElementById('modal').style.display = 'none';
  }
}

/* ── Dropdown builder ── */
function buildDropdown(key, options, selectedSet) {
  const trigger  = document.getElementById(`${key}Trigger`);
  const dropdown = document.getElementById(`${key}Dropdown`);
  const search   = document.getElementById(`${key}Search`);
  const optsList = document.getElementById(`${key}Options`);
  const label    = trigger.querySelector('.ms-label');
  const origLabel = label.textContent;

  function renderOptions(filter = '') {
    const q = filter.toLowerCase();
    const visible = options.filter(o => o.toLowerCase().includes(q));
    optsList.innerHTML = visible.map(o => `
      <label class="ms-option">
        <input type="checkbox" value="${escAttr(o)}" ${selectedSet.has(o) ? 'checked' : ''}
          onchange="toggleOption('${key}', '${escAttr(o)}', this.checked)" />
        ${escHtml(o)}
      </label>`).join('');
  }

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = dropdown.classList.contains('open');
    closeAllDropdowns();
    if (!isOpen) {
      dropdown.classList.add('open');
      trigger.classList.add('open');
      search.value = '';
      renderOptions();
      search.focus();
    }
  });

  search.addEventListener('input', () => renderOptions(search.value));

  renderOptions();

  window[`refreshDropdown_${key}`] = () => {
    renderOptions(search.value);
    const count = selectedSet.size;
    label.textContent = count ? `${origLabel} (${count})` : origLabel;
    updateChiclets();
    renderCards();
  };
}

function toggleOption(key, value, checked) {
  const map = { condition: selectedConditions, type: selectedTypes };
  if (checked) map[key].add(value);
  else map[key].delete(value);
  window[`refreshDropdown_${key}`]();
}

function closeAllDropdowns() {
  document.querySelectorAll('.ms-dropdown').forEach(d => d.classList.remove('open'));
  document.querySelectorAll('.ms-trigger').forEach(t => t.classList.remove('open'));
}

document.addEventListener('click', closeAllDropdowns);

/* ── Chiclets ── */
function updateChiclets() {
  const container = document.getElementById('chiclets');
  const all = [
    ...[...selectedConditions].map(v => ({ v, key: 'condition' })),
    ...[...selectedTypes].map(v => ({ v, key: 'type' })),
  ];
  container.innerHTML = all.map(({ v, key }) => `
    <span class="chiclet">
      ${escHtml(v)}
      <button class="chiclet-remove" onclick="removeFilter('${key}','${escAttr(v)}')" aria-label="Remove">×</button>
    </span>`).join('');
}

function removeFilter(key, value) {
  const map = { condition: selectedConditions, type: selectedTypes };
  map[key].delete(value);
  window[`refreshDropdown_${key}`]();
}

/* ── JSONP helper (bypasses CORS for Apps Script GET) ── */
function fetchJSONP(url) {
  return new Promise((resolve, reject) => {
    const cbName = 'fay_cb_' + Date.now();
    const script = document.createElement('script');
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('JSONP timeout'));
    }, 8000);

    window[cbName] = data => {
      cleanup();
      resolve(data);
    };

    function cleanup() {
      clearTimeout(timeout);
      delete window[cbName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    script.onerror = () => { cleanup(); reject(new Error('JSONP script error')); };
    script.src = `${url}?callback=${cbName}`;
    document.head.appendChild(script);
  });
}

/* ── Utils ── */
function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(s) {
  return String(s || '').replace(/'/g,"\\'").replace(/"/g,'&quot;');
}
