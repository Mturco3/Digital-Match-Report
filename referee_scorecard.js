const STORAGE_VERSION = 1;
const STORAGE_INDEX_KEY = 'refcard_games_index';
const STORAGE_GAME_PREFIX = 'refcard_game_';
const STORAGE_ACTIVE_GAME_KEY = 'refcard_active_game';
const LANG_KEY = 'refcard_lang';

const CATEGORY_OPTIONS = ['Juniores', 'Under 18', 'Under 17', 'Under 16', 'Under 15', 'Under 14'];
const LEVEL_OPTIONS = ['Provinciali', 'Regionali', 'Regionali Elite'];

const TEXT = {
  it: {
    homeSubtitle: 'Scheda offline',
    homeNewGame: 'Nuova partita',
    homeHistory: 'Partite salvate',
    setupSubtitle: 'Scheda gara',
    lblReferee: 'Arbitro',
    lblSupervisor: 'Osservatore',
    lblHome: 'Squadra casa',
    lblAway: 'Squadra ospite',
    lblCategory: 'Categoria',
    lblLevel: 'Livello',
    placeholderName: 'Nome completo',
    placeholderHome: 'Casa',
    placeholderAway: 'Trasferta',
    selectPlaceholder: 'Seleziona',
    start: 'Inizia',
    historyTitle: 'Partite salvate',
    noSavedGames: 'Nessuna partita salvata',
    statusCompleted: 'Completata',
    statusInProgress: 'In corso',
    open: 'Apri',
    delete: 'Elimina',
    confirmDelete: 'Eliminare questa partita dalla cronologia locale?',
    alertTeams: 'Inserisci entrambe le squadre.'
  },
  en: {
    homeSubtitle: 'Offline scorecard',
    homeNewGame: 'New game',
    homeHistory: 'Past games',
    setupSubtitle: 'Match setup',
    lblReferee: 'Referee',
    lblSupervisor: 'Supervisor',
    lblHome: 'Home team',
    lblAway: 'Away team',
    lblCategory: 'Category',
    lblLevel: 'Level',
    placeholderName: 'Full name',
    placeholderHome: 'Home',
    placeholderAway: 'Away',
    selectPlaceholder: 'Select',
    start: 'Start',
    historyTitle: 'Past games',
    noSavedGames: 'No saved games yet',
    statusCompleted: 'Completed',
    statusInProgress: 'In progress',
    open: 'Open',
    delete: 'Delete',
    confirmDelete: 'Delete this game from local history?',
    alertTeams: 'Please enter both team names.'
  }
};

let currentLang = localStorage.getItem(LANG_KEY) || 'it';

function tr(key) {
  return TEXT[currentLang][key] || key;
}

function safeParse(jsonText, fallback) {
  try {
    return JSON.parse(jsonText);
  } catch {
    return fallback;
  }
}

function getStorageKey(gameId) {
  return STORAGE_GAME_PREFIX + gameId;
}

function getGameIndex() {
  const raw = localStorage.getItem(STORAGE_INDEX_KEY);
  const parsed = safeParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

function setGameIndex(gameIds) {
  localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(gameIds));
}

function upsertGameInIndex(gameId) {
  const index = getGameIndex().filter(id => id !== gameId);
  index.unshift(gameId);
  setGameIndex(index);
}

function removeGameFromIndex(gameId) {
  const index = getGameIndex().filter(id => id !== gameId);
  setGameIndex(index);
}

function getGameRecord(gameId) {
  const raw = localStorage.getItem(getStorageKey(gameId));
  if (!raw) return null;
  const record = safeParse(raw, null);
  if (!record || record.version !== STORAGE_VERSION || !record.snapshot) return null;
  return record;
}

function getAllGameRecords() {
  const ids = getGameIndex();
  const records = [];
  ids.forEach(id => {
    const rec = getGameRecord(id);
    if (rec) records.push(rec);
    else {
      removeGameFromIndex(id);
      localStorage.removeItem(getStorageKey(id));
    }
  });
  return records.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

function deleteGame(gameId) {
  localStorage.removeItem(getStorageKey(gameId));
  removeGameFromIndex(gameId);
  if (localStorage.getItem(STORAGE_ACTIVE_GAME_KEY) === gameId) {
    localStorage.removeItem(STORAGE_ACTIVE_GAME_KEY);
  }
}

function generateGameId() {
  return 'g_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function switchScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.toggle('active', screen.id === screenId);
  });
}

function populateSelect(selectId, options) {
  const select = document.getElementById(selectId);
  const prev = select.value;
  select.innerHTML = '';

  const first = document.createElement('option');
  first.value = '';
  first.textContent = tr('selectPlaceholder');
  select.appendChild(first);

  options.forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });

  if (prev && options.includes(prev)) select.value = prev;
}

function applyLanguage() {
  document.documentElement.lang = currentLang;
  document.getElementById('lang-it-btn').classList.toggle('active', currentLang === 'it');
  document.getElementById('lang-en-btn').classList.toggle('active', currentLang === 'en');
  document.getElementById('home-subtitle').textContent = tr('homeSubtitle');
  document.getElementById('go-new-game-btn').textContent = tr('homeNewGame');
  document.getElementById('go-history-btn').textContent = tr('homeHistory');
  document.getElementById('setup-subtitle').textContent = tr('setupSubtitle');
  document.getElementById('lbl-referee').textContent = tr('lblReferee');
  document.getElementById('lbl-supervisor').textContent = tr('lblSupervisor');
  document.getElementById('lbl-home').textContent = tr('lblHome');
  document.getElementById('lbl-away').textContent = tr('lblAway');
  document.getElementById('lbl-category').textContent = tr('lblCategory');
  document.getElementById('lbl-level').textContent = tr('lblLevel');
  document.getElementById('start-match-btn').textContent = tr('start');
  document.getElementById('history-title').textContent = tr('historyTitle');

  document.getElementById('inp-referee').placeholder = tr('placeholderName');
  document.getElementById('inp-supervisor').placeholder = tr('placeholderName');
  document.getElementById('inp-home').placeholder = tr('placeholderHome');
  document.getElementById('inp-away').placeholder = tr('placeholderAway');

  populateSelect('inp-category', CATEGORY_OPTIONS);
  populateSelect('inp-level', LEVEL_OPTIONS);
  if (document.getElementById('history-screen').classList.contains('active')) renderHistoryList();
}

function setLanguage(lang) {
  if (lang !== 'it' && lang !== 'en') return;
  currentLang = lang;
  localStorage.setItem(LANG_KEY, currentLang);
  applyLanguage();
}

function buildRecordFromForm() {
  const home = document.getElementById('inp-home').value.trim();
  const away = document.getElementById('inp-away').value.trim();
  if (!home || !away) {
    alert(tr('alertTeams'));
    return null;
  }

  const now = Date.now();
  const gameId = generateGameId();
  return {
    version: STORAGE_VERSION,
    id: gameId,
    status: 'in-progress',
    createdAt: now,
    updatedAt: now,
    snapshot: {
      referee: document.getElementById('inp-referee').value.trim() || '—',
      supervisor: document.getElementById('inp-supervisor').value.trim() || '—',
      category: document.getElementById('inp-category').value || '—',
      level: document.getElementById('inp-level').value || '—',
      home,
      away,
      scoreHome: 0,
      scoreAway: 0,
      addedTimeFirst: 0,
      addedTimeSecond: 0,
      half: 1,
      events: []
    }
  };
}

function startGame() {
  const record = buildRecordFromForm();
  if (!record) return;
  localStorage.setItem(getStorageKey(record.id), JSON.stringify(record));
  upsertGameInIndex(record.id);
  localStorage.setItem(STORAGE_ACTIVE_GAME_KEY, record.id);
  window.location.href = 'game.html';
}

function renderHistoryList() {
  const list = document.getElementById('history-list');
  const records = getAllGameRecords();

  if (!records.length) {
    list.innerHTML = `<div class="empty-state history-empty">${tr('noSavedGames')}</div>`;
    return;
  }

  list.innerHTML = records.map(record => {
    const snap = record.snapshot || {};
    const status = record.status === 'completed' ? tr('statusCompleted') : tr('statusInProgress');
    const details = [snap.category || '—', snap.level || '—', new Date(record.updatedAt).toLocaleString()].join(' · ');
    return `
      <article class="history-card">
        <div class="history-card-top">
          <div class="history-teams">${snap.home || 'Home'} vs ${snap.away || 'Away'}</div>
          <span class="history-status ${record.status === 'completed' ? 'done' : 'open'}">${status}</span>
        </div>
        <div class="history-meta">${details}</div>
        <div class="history-score">${snap.scoreHome || 0} – ${snap.scoreAway || 0}</div>
        <div class="history-actions">
          <button class="btn-small btn-open" data-action="open" data-id="${record.id}">${tr('open')}</button>
          <button class="btn-small btn-delete" data-action="delete" data-id="${record.id}">${tr('delete')}</button>
        </div>
      </article>
    `;
  }).join('');
}

function handleHistoryClick(event) {
  const action = event.target.dataset.action;
  const id = event.target.dataset.id;
  if (!action || !id) return;

  if (action === 'open') {
    localStorage.setItem(STORAGE_ACTIVE_GAME_KEY, id);
    window.location.href = 'game.html';
    return;
  }

  if (action === 'delete') {
    if (!confirm(tr('confirmDelete'))) return;
    deleteGame(id);
    renderHistoryList();
  }
}

function initFromHash() {
  if (window.location.hash === '#history') {
    renderHistoryList();
    switchScreen('history-screen');
  }
}

function bindUI() {
  document.getElementById('lang-it-btn').addEventListener('click', () => setLanguage('it'));
  document.getElementById('lang-en-btn').addEventListener('click', () => setLanguage('en'));
  document.getElementById('go-new-game-btn').addEventListener('click', () => switchScreen('setup-screen'));
  document.getElementById('go-history-btn').addEventListener('click', () => {
    renderHistoryList();
    switchScreen('history-screen');
  });
  document.getElementById('back-home-from-setup-btn').addEventListener('click', () => switchScreen('home-screen'));
  document.getElementById('back-home-from-history-btn').addEventListener('click', () => switchScreen('home-screen'));
  document.getElementById('start-match-btn').addEventListener('click', startGame);
  document.getElementById('history-list').addEventListener('click', handleHistoryClick);
}

function init() {
  bindUI();
  applyLanguage();
  initFromHash();
}

init();
