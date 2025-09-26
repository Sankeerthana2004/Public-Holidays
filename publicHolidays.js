// publicHolidays.js
// Simplified classic look: no images, just text-based holiday cards

const countrySelect = document.getElementById('countrySelect');
const yearInput = document.getElementById('yearInput');
const monthSelect = document.getElementById('monthSelect');
const fetchBtn = document.getElementById('fetchBtn');

const loading = document.getElementById('loading');
const errorBox = document.getElementById('error');
const holidaysSection = document.getElementById('holidaysSection');
const resultsContainer = document.getElementById('resultsContainer');

const API_BASE = 'https://date.nager.at/api/v3';
const CURRENT_YEAR = new Date().getFullYear();

// show/hide helpers
function setLoading(on) { loading.classList.toggle('hidden', !on); }
function showError(msg) {
  errorBox.classList.remove('hidden');
  errorBox.textContent = msg;
}
function clearError() {
  errorBox.classList.add('hidden');
  errorBox.textContent = '';
}

// load country list
async function loadCountries() {
  try {
    const res = await fetch(`${API_BASE}/AvailableCountries`);
    const data = await res.json();
    data.sort((a,b) => a.name.localeCompare(b.name));
    countrySelect.innerHTML = '<option value="">Choose a country...</option>';
    data.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.countryCode;
      opt.textContent = `${c.name} (${c.countryCode})`;
      countrySelect.appendChild(opt);
    });
  } catch {
    countrySelect.innerHTML = '<option value="">Could not load countries</option>';
  }
}

// format date nicely
function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday:'short', year:'numeric', month:'short', day:'numeric' });
}

// create classic card
function createCard(h) {
  const card = document.createElement('div');
  card.className = 'holiday-card';

  const title = document.createElement('h3');
  title.textContent = h.name || 'Holiday';
  card.appendChild(title);

  const dateP = document.createElement('p');
  dateP.innerHTML = `<strong>Date:</strong> ${formatDate(h.date)}`;
  card.appendChild(dateP);

  if (h.localName && h.localName !== h.name) {
    const localP = document.createElement('p');
    localP.innerHTML = `<strong>Local name:</strong> ${h.localName}`;
    card.appendChild(localP);
  }

  const meta = document.createElement('div');
  meta.className = 'h-meta';
  const types = Array.isArray(h.types) && h.types.length ? h.types.join(', ') : 'N/A';
  const region = (h.counties && h.counties.length) ? `Applies to: ${h.counties.join(', ')}` : (h.global ? 'Nationwide' : 'Regional');
  meta.innerHTML = `<span class="meta-pill">${types}</span> <span class="meta-pill">${region}</span>${h.launchYear ? ` <span class="meta-pill">Since ${h.launchYear}</span>` : ''}`;
  card.appendChild(meta);

  const desc = document.createElement('p');
  desc.className = 'h-desc';
  let text = `Observed on ${new Date(h.date + 'T00:00:00').toLocaleDateString(undefined, { month:'long', day:'numeric', year:'numeric' })}. `;
  if (h.localName && h.localName !== h.name) text += `Locally known as ${h.localName}. `;
  if (h.launchYear) text += `First observed in ${h.launchYear}. `;
  text += h.global ? 'Observed nationwide.' : 'Observed regionally.';
  desc.textContent = text;
  card.appendChild(desc);

  return card;
}

// group holidays
function groupByMonth(holidays) {
  const groups = {};
  holidays.forEach(h => {
    const m = new Date(h.date).getMonth() + 1;
    if (!groups[m]) groups[m] = [];
    groups[m].push(h);
  });
  return Object.entries(groups).map(([m, list]) => [Number(m), list]).sort((a,b) => a[0]-b[0]);
}

// render holidays
function renderHolidays(holidays, filterMonth='all') {
  resultsContainer.innerHTML = '';

  if (!holidays || holidays.length === 0) {
    resultsContainer.textContent = 'No holidays found.';
    holidaysSection.classList.remove('hidden');
    return;
  }

  let filtered = holidays;
  if (filterMonth !== 'all') {
    filtered = holidays.filter(h => new Date(h.date).getMonth() + 1 === Number(filterMonth));
  }

  const grouped = groupByMonth(filtered);
  grouped.forEach(([month, items]) => {
    const monthDiv = document.createElement('div');
    monthDiv.className = 'month-group';

    const header = document.createElement('div');
    header.className = 'month-header';
    header.textContent = new Date(2020, month-1).toLocaleString(undefined,{month:'long'}) + ` (${items.length})`;
    monthDiv.appendChild(header);

    const body = document.createElement('div');
    body.className = 'month-body';

    items.sort((a,b)=> new Date(a.date)-new Date(b.date));
    items.forEach(h => body.appendChild(createCard(h)));

    monthDiv.appendChild(body);
    resultsContainer.appendChild(monthDiv);
  });

  holidaysSection.classList.remove('hidden');
}

// fetch holidays
async function fetchHolidays(country, year) {
  clearError();
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/PublicHolidays/${year}/${country}`);
    const data = await res.json();
    setLoading(false);
    renderHolidays(data, monthSelect.value);
  } catch {
    setLoading(false);
    showError('Could not load holidays. Try again later.');
  }
}

// search handler
function onSearch() {
  const country = countrySelect.value;
  const year = yearInput.value || CURRENT_YEAR;
  if (!country) return showError('Please select a country.');
  if (!/^\d{4}$/.test(year)) return showError('Invalid year.');
  fetchHolidays(country, year);
}

// init
function init() {
  yearInput.value = CURRENT_YEAR;
  loadCountries();
  fetchBtn.addEventListener('click', onSearch);
  yearInput.addEventListener('keydown', e => { if (e.key==='Enter') onSearch(); });
}
document.addEventListener('DOMContentLoaded', init);