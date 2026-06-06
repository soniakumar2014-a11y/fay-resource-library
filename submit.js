/* ============================================================
   FAY RESOURCE LIBRARY — submit.js
   ============================================================
   CONFIGURATION: Replace with your Apps Script Web App URL.
   ============================================================ */

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyeNt8zjoEKMzk_i8TAuynDX91qWxNh4kigDrU_lIJ4xkp15_Yd3VaN74nyQpey1jks/exec';

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
    label.textContent = count
      ? `${count} selected`
      : (key === 'type' ? 'Select type…' : 'Select conditions…');
    updateChiclets();
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

/* ── Submit ── */
async function handleSubmit(e) {
  e.preventDefault();
  if (!validate()) return;

  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.textContent = 'Submitting…';

  const payload = {
    timestamp: new Date().toISOString(),
    npi:         document.getElementById('npi').value.trim(),
    name:        document.getElementById('rd-name').value.trim(),
    title:       document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
    link:        document.getElementById('resource-link').value.trim() || '[file upload]',
    thumbnail:   document.getElementById('thumbnail').value.trim(),
    type:        [...selectedTypes].join(', '),
    conditions:  [...selectedConditions].join(','),
  };

  try {
    if (APPS_SCRIPT_URL && APPS_SCRIPT_URL !== 'YOUR_APPS_SCRIPT_URL_HERE') {
      /* Apps Script requires text/plain with no-cors — JSON encoded as a plain string */
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });
    } else {
      /* Demo mode: store in sessionStorage so library can pick it up */
      const existing = JSON.parse(sessionStorage.getItem('fay_resources') || '[]');
      existing.unshift(payload);
      sessionStorage.setItem('fay_resources', JSON.stringify(existing));
    }

    document.getElementById('success-banner').style.display = 'block';
    btn.textContent = 'Submitted!';
    setTimeout(() => {
      window.location.href = 'index.html?new=1';
    }, 1500);
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Submit Resource';
    alert('Something went wrong. Please try again.');
  }
}

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(s) {
  return String(s || '').replace(/'/g,"\\'").replace(/"/g,'&quot;');
}
