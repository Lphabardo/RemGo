// ============================================
// НАСТРОЙКИ SUPABASE
// ============================================
const SUPABASE_URL = 'https://nnltklrgemdoldwnlehg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ubHRrbHJnZW1kb2xkd25sZWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NzU5NTgsImV4cCI6MjEwMzE1MTk1OH0.b_Pl-enHhNtOjSezWRBagZ8zQPKYqkfSuW_fqHMpB_4';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const CATEGORY_ICONS = {
    'santekhniki': '🚿',
    'elektriki': '⚡',
    'otdelochniki': '🎨',
    'plitochniki': '🔲',
    'mastera-na-chas': '🛠️',
    'mebelshchiki': '🪑'
};

let allMasters = [];
let allCategories = [];
let allDistricts = [];

function showError(msg) {
    document.getElementById('categories-grid').innerHTML = 
        `<div style="grid-column:1/-1; text-align:center; padding:20px; color:#D00000; background:#FFF5F5; border-radius:12px;">
            ⚠️ ${msg}<br><small style="color:#666">Проверьте политики RLS в Supabase</small>
        </div>`;
    document.getElementById('masters-grid').innerHTML = 
        `<div class="loading" style="color:#D00000">Не удалось загрузить данные</div>`;
}

// ============================================
// ЗАГРУЗКА
// ============================================
async function init() {
    try {
        await loadCategories();
        await loadDistricts();
        await loadMasters();
    } catch (e) {
        console.error(e);
        showError('Ошибка подключения к базе данных');
    }
}

async function loadCategories() {
    const { data, error } = await supabaseClient
        .from('categories')
        .select('*')
        .order('display_order');

    if (error) {
        console.error('Ошибка категорий:', error);
        showError('Ошибка загрузки категорий: ' + error.message);
        return;
    }

    if (!data || data.length === 0) {
        showError('Категории не найдены — проверьте таблицу в Supabase');
        return;
    }

    allCategories = data;
    renderCategories(data);
    fillCategorySelect(data);
}

async function loadDistricts() {
    const { data, error } = await supabaseClient
        .from('districts')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

    if (error) {
        console.error('Ошибка районов:', error);
        return;
    }

    allDistricts = data || [];
    fillDistrictSelect(allDistricts);
}

async function loadMasters() {
    const grid = document.getElementById('masters-grid');
    grid.innerHTML = '<div class="loading">Загрузка мастеров...</div>';

    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*, categories(name, slug), districts(name, slug)')
        .eq('is_active', true)
        .order('rating', { ascending: false });

    if (error) {
        console.error('Ошибка мастеров:', error);
        grid.innerHTML = '<div class="loading" style="color:#D00000">Ошибка: ' + error.message + '</div>';
        return;
    }

    allMasters = data || [];
    renderMasters(allMasters);
}

// ============================================
// РЕНДЕР
// ============================================
function renderCategories(cats) {
    const grid = document.getElementById('categories-grid');
    grid.innerHTML = cats.map(cat => `
        <div class="category-card" data-id="${cat.id}" data-slug="${cat.slug}" onclick="selectCategory('${cat.id}')">
            <span class="category-icon">${CATEGORY_ICONS[cat.slug] || '🔧'}</span>
            <div class="category-name">${cat.name}</div>
        </div>
    `).join('');
}

function fillCategorySelect(cats) {
    const select = document.getElementById('filter-category');
    select.innerHTML = '<option value="">Все категории</option>' + 
        cats.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
}

function fillDistrictSelect(districts) {
    const select = document.getElementById('filter-district');
    select.innerHTML = '<option value="">Все районы</option>' + 
        districts.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
}

function renderMasters(masters) {
    const grid = document.getElementById('masters-grid');
    const countEl = document.getElementById('masters-count');

    countEl.textContent = masters.length > 0 ? `(${masters.length})` : '';

    if (masters.length === 0) {
        grid.innerHTML = '<div class="loading">Пока нет мастеров в этой категории. <a href="register.html" style="color:#E85D04">Будьте первым!</a></div>';
        return;
    }

    grid.innerHTML = masters.map(m => {
        const photo = m.photo_url
            ? `<img src="${m.photo_url}" alt="${m.name}" class="master-photo" loading="lazy" onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'master-photo-placeholder\\'>👷</div>'">`
            : `<div class="master-photo-placeholder">👷</div>`;

        const verified = m.is_verified
            ? `<span class="master-verified">✓ Проверен</span>` : '';

        const tgLink = m.telegram_username
            ? `https://t.me/${m.telegram_username.replace('@', '')}`
            : '#';

        return `
        <div class="master-card">
            <div class="master-photo-wrap">
                ${photo}
                ${verified}
            </div>
            <div class="master-body">
                <div class="master-name">${m.name}</div>
                <div class="master-meta">
                    <span class="master-category">${m.categories?.name || 'Мастер'}</span>
                    <span class="master-rating">★ ${m.rating}</span>
                </div>
                <div class="master-district">📍 ${m.districts?.name || 'Одесса'}</div>
                <div class="master-price">от ${m.price_from || '—'} грн</div>
                <div class="master-actions">
                    <a href="tel:${m.phone}" class="btn-call">Позвонить</a>
                    <a href="${tgLink}" target="_blank" class="btn-tg">Telegram</a>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// ============================================
// ФИЛЬТРЫ
// ============================================
function selectCategory(catId) {
    document.getElementById('filter-category').value = catId;
    applyFilters();
    document.querySelectorAll('.category-card').forEach(card => {
        card.classList.toggle('active', card.dataset.id === catId);
    });
}

function applyFilters() {
    const catId = document.getElementById('filter-category').value;
    const distId = document.getElementById('filter-district').value;

    let filtered = allMasters;
    if (catId) filtered = filtered.filter(m => m.category_id === catId);
    if (distId) filtered = filtered.filter(m => m.district_id === distId);

    renderMasters(filtered);
}

document.getElementById('filter-category').addEventListener('change', applyFilters);
document.getElementById('filter-district').addEventListener('change', applyFilters);
document.getElementById('btn-reset').addEventListener('click', () => {
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-district').value = '';
    document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
    renderMasters(allMasters);
});

init();
