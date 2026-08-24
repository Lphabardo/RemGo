// ============================================
// SUPABASE
// ============================================
const SB_URL = 'https://nnltklrgemdoldwnlehg.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ubHRrbHJnZW1kb2xkd25sZWhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NzU5NTgsImV4cCI6MjEwMzE1MTk1OH0.b_Pl-enHhNtOjSezWRBagZ8zQPKYqkfSuW_fqHMpB_4';

const sb = window.supabase.createClient(SB_URL, SB_KEY);

const ICONS = {
    'santekhniki': '🚿',
    'elektriki': '⚡',
    'otdelochniki': '🎨',
    'plitochniki': '🔲',
    'mastera-na-chas': '🛠️',
    'mebelshchiki': '🪑'
};

let masters = [], cats = [], dists = [];

// ============================================
// ЗАГРУЗКА
// ============================================
async function init() {
    try {
        await loadCats();
        await loadDists();
        await loadMasters();
    } catch (e) {
        console.error(e);
        showErr('Ошибка подключения к базе');
    }
}

async function loadCats() {
    const { data, error } = await sb.from('categories').select('*').order('display_order');
    if (error) { console.error(error); showErr('Категории: ' + error.message); return; }
    if (!data || !data.length) { showErr('Категории не найдены'); return; }
    cats = data;
    renderCats(data);
    fillSelect('filter-category', data, 'Все категории');
}

async function loadDists() {
    const { data, error } = await sb.from('districts').select('*').eq('is_active', true).order('display_order');
    if (error) { console.error(error); return; }
    dists = data || [];
    fillSelect('filter-district', dists, 'Все районы');
}

async function loadMasters() {
    const grid = document.getElementById('masters-grid');
    grid.innerHTML = '<div class="loading">Загрузка мастеров...</div>';

    const { data, error } = await sb
        .from('profiles')
        .select('*, categories(name, slug), districts(name, slug)')
        .eq('is_active', true)
        .order('rating', { ascending: false });

    if (error) { grid.innerHTML = '<div class="loading" style="color:#D00000">Ошибка: ' + error.message + '</div>'; return; }
    masters = data || [];
    renderMasters(masters);
}

// ============================================
// РЕНДЕР
// ============================================
function renderCats(list) {
    document.getElementById('categories-grid').innerHTML = list.map(c => `
        <div class="category-card" data-id="${c.id}" onclick="pickCat('${c.id}')">
            <span class="category-icon">${ICONS[c.slug] || '🔧'}</span>
            <div class="category-name">${c.name}</div>
        </div>
    `).join('');
}

function fillSelect(id, list, def) {
    const el = document.getElementById(id);
    el.innerHTML = '<option value="">' + def + '</option>' + list.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
}

function renderMasters(list) {
    const grid = document.getElementById('masters-grid');
    document.getElementById('masters-count').textContent = list.length ? '(' + list.length + ')' : '';

    if (!list.length) {
        grid.innerHTML = '<div class="loading">Пока нет мастеров. <a href="register.html" style="color:#E85D04">Будьте первым!</a></div>';
        return;
    }

    grid.innerHTML = list.map(m => {
        const photo = m.photo_url
            ? `<img src="${m.photo_url}" alt="${m.name}" class="master-photo" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'master-photo-placeholder\\'>👷</div>'">`
            : `<div class="master-photo-placeholder">👷</div>`;
        const verified = m.is_verified ? `<span class="master-verified">✓ Проверен</span>` : '';
        const tg = m.telegram_username ? `https://t.me/${m.telegram_username.replace('@','')}` : '#';

        return `
        <div class="master-card" data-id="${m.id}">
            <div class="master-photo-wrap">${photo}${verified}</div>
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
                    <a href="${tg}" target="_blank" class="btn-tg">Telegram</a>
                </div>
            </div>
        </div>`;
    }).join('');

    // Навешиваем клики через JS — работает и на телефоне, и на компе
    document.querySelectorAll('.master-card').forEach(card => {
        card.addEventListener('click', function(e) {
            // Если клик был по ссылке или кнопке внутри — не переходим
            if (e.target.closest('a') || e.target.closest('.master-actions')) return;
            const id = this.dataset.id;
            if (id) window.location.href = 'master.html?id=' + id;
        });
    });
}

function showErr(msg) {
    document.getElementById('categories-grid').innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:20px;color:#D00000;background:#FFF5F5;border-radius:12px;">⚠️ ${msg}</div>`;
}

// ============================================
// ФИЛЬТРЫ
// ============================================
function pickCat(id) {
    document.getElementById('filter-category').value = id;
    filter();
    document.querySelectorAll('.category-card').forEach(c => c.classList.toggle('active', c.dataset.id === id));
}

function filter() {
    const c = document.getElementById('filter-category').value;
    const d = document.getElementById('filter-district').value;
    let f = masters;
    if (c) f = f.filter(m => m.category_id === c);
    if (d) f = f.filter(m => m.district_id === d);
    renderMasters(f);
}

document.getElementById('filter-category').addEventListener('change', filter);
document.getElementById('filter-district').addEventListener('change', filter);
document.getElementById('btn-reset').addEventListener('click', () => {
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-district').value = '';
    document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
    renderMasters(masters);
});

init();
