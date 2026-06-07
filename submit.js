/* ============================================================
   FAY RESOURCE LIBRARY — submit.js
   ============================================================
   CONFIGURATION: Replace with your Apps Script Web App URL.
   ============================================================ */

const CONDITIONS = [
  'Anorexia Nervosa', 'ARFID', 'Autoimmune', 'Bariatric',
  'Binge Eating Disorder', 'Bulimia', 'Cancer / Oncology', 'Diabetes',
  'Eating Disorders & Disordered Eating', 'Fertility', 'Gluten Free',
  'Gut Health', 'IBS', 'PCOS', 'Pediatric',
  'Perimenopause & Menopause', 'Postpartum', 'Pregnancy', 'Renal',
  'Sports Nutrition', 'Thyroid Health', 'Transplant', 'Vegan',
  'Vegetarian', 'Weight Loss',
];

const RESOURCE_TYPES = [
  'Recipes', 'Patient Handout', 'Grocery Guide',
  'Meal Prep Tool', 'Worksheet', 'Meal Plan Template',
];

let selectedConditions = new Set();
let selectedTypes = new Set();

document.addEventListener('DOMContentLoaded', () => {
  buildDropdown('type', RESOURCE_TYPES, selectedTypes);
  buildDropdown('condition', CONDITIONS, selectedConditions);

  document.getElementById('submit-form').addEventListener('submit', handleSubmit);
});

/* ── Dropdown builder (same logic as app.js, self-contained) ── */
function buildDropdown(key, options, selectedSet) {
  const trigger  = document.getElementById(`${key}Trigger`);
  const dropdown = document.getElementById(`${key}Dropdown`);
  const search   = document.getElementById(`${key}Search`);
  const optsList = document.getElementById(`${key}Options`);
  const label    = trigger.querySelector('.ms-label');

  const isSingle = key === 'type';

  function renderOptions(filter = '') {
    const q = filter.toLowerCase();
    const visible = options.filter(o => o.toLowerCase().includes(q));
    const inputType = isSingle ? 'radio' : 'checkbox';
    optsList.innerHTML = visible.map(o => `
      <label class="ms-option">
        <input type="${inputType}" value="${escAttr(o)}" ${selectedSet.has(o) ? 'checked' : ''}
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
    label.textContent = count
      ? (key === 'type' ? [...selectedSet][0] : `${count} selected`)
      : (key === 'type' ? 'Select type…' : 'Select conditions…');
    updateChiclets();
  };
}

function toggleOption(key, value, checked) {
  const map = { condition: selectedConditions, type: selectedTypes };
  if (key === 'type' && checked) map[key].clear();
  if (checked) map[key].add(value);
  else map[key].delete(value);
  if (key === 'type') closeAllDropdowns();
  window[`refreshDropdown_${key}`]();
}

function closeAllDropdowns() {
  document.querySelectorAll('.ms-dropdown').forEach(d => d.classList.remove('open'));
  document.querySelectorAll('.ms-trigger').forEach(t => t.classList.remove('open'));
}
document.addEventListener('click', closeAllDropdowns);

function updateChiclets() {
  const container = document.getElementById('chiclets');
  const all = [
    ...[...selectedTypes].map(v => ({ v, key: 'type' })),
    ...[...selectedConditions].map(v => ({ v, key: 'condition' })),
  ];
  container.innerHTML = all.map(({ v, key }) => `
    <span class="chiclet">
      ${escHtml(v)}
      <button type="button" class="chiclet-remove"
        onclick="toggleOption('${key}','${escAttr(v)}',false);document.querySelector('[value=\\'${escAttr(v)}\\']') && (document.querySelector('[value=\\'${escAttr(v)}\\']').checked=false)"
        aria-label="Remove">×</button>
    </span>`).join('');
}

/* ── Validation ── */
function clearErrors() {
  document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
  document.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));
}

function setError(fieldId, errorId, msg) {
  const field = document.getElementById(fieldId);
  const err   = document.getElementById(errorId);
  if (field) field.classList.add('field-error');
  if (err)   err.textContent = msg;
}

function validate() {
  clearErrors();
  let valid = true;

  const npi = document.getElementById('npi').value.trim();
  if (!npi) {
    setError('npi', 'npi-error', 'NPI is required.');
    valid = false;
  } else if (!/^\d{10}$/.test(npi)) {
    setError('npi', 'npi-error', 'NPI must be exactly 10 digits.');
    valid = false;
  }

  if (!document.getElementById('rd-name').value.trim()) {
    setError('rd-name', 'name-error', 'Name is required.');
    valid = false;
  }

  if (!document.getElementById('title').value.trim()) {
    setError('title', 'title-error', 'Resource title is required.');
    valid = false;
  }

  if (!document.getElementById('description').value.trim()) {
    setError('description', 'description-error', 'Description is required.');
    valid = false;
  }

  const link = document.getElementById('resource-link').value.trim();
  const file = document.getElementById('resource-file').files[0];
  if (!link && !file) {
    setError('resource-link', 'link-error', 'Provide a file upload or a link URL.');
    valid = false;
  }

  if (selectedTypes.size === 0) {
    document.getElementById('type-error').textContent = 'Please select a resource type.';
    valid = false;
  }

  if (selectedConditions.size === 0) {
    document.getElementById('condition-error').textContent = 'Please select at least one condition.';
    valid = false;
  }

  return valid;
}

const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/1c2GOwv3gHsAUkoGNVYN6yVpDc8Mj0xpV22w-Hs0qriE/formResponse';

const FIELD_IDS = {
  npi:         'entry.1725633455',
  name:        'entry.668716972',
  title:       'entry.1304838667',
  description: 'entry.1708620029',
  link:        'entry.220443743',
  thumbnail:   'entry.1041535302',
  type:        'entry.1270780311',
  conditions:  'entry.1148700554',
};

/* ── Submit ── */
function handleSubmit(e) {
  e.preventDefault();
  if (!validate()) return;

  const values = {
    npi:         document.getElementById('npi').value.trim(),
    name:        document.getElementById('rd-name').value.trim(),
    title:       document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
    link:        document.getElementById('resource-link').value.trim() || '[file upload]',
    thumbnail:   document.getElementById('thumbnail').value.trim(),
    type:        [...selectedTypes].join(', '),
    conditions:  [...selectedConditions].join(','),
  };

  /* Build a hidden form and submit it to Google Forms */
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = GOOGLE_FORM_URL;

  Object.entries(FIELD_IDS).forEach(([key, entryId]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = entryId;
    input.value = values[key] || '';
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(s) {
  return String(s || '').replace(/'/g,"\\'").replace(/"/g,'&quot;');
}
