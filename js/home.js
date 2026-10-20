const LEVEL_OPTIONS = ['Provinciali', 'Regionali', 'Regionali Elite'];
const RECENT_GAMES_COUNT = 3;

const TEXT = {
  it: {
    homeSubtitle: 'Scheda offline',
    homeNewGame: 'Nuova partita',
    homeHistory: 'Partite salvate',
    setupSubtitle: 'Scheda gara',
    secOfficials: 'Ufficiali di gara',
    secTeams: 'Squadre',
    secCompetition: 'Competizione',
    lblReferee: 'Arbitro',
    lblSupervisor: 'Osservatore',
    lblHome: 'Squadra casa',
    lblAway: 'Squadra ospite',
    lblCategory: 'Categoria',
    lblLevel: 'Livello',
    lblGroup: 'Girone',
    allGroups: 'Tutti i gironi',
    placeholderFirstName: 'Nome',
    placeholderLastName: 'Cognome',
    placeholderTeam: 'Cerca o scrivi il nome',
    lblColor: 'Colore',
    group: 'Girone',
    colorTooSimilar: 'Colori troppo simili: scegline uno diverso.',
    noTeamFound: 'Nessuna squadra trovata: verrà usato il nome inserito.',
    selectPlaceholder: 'Seleziona',
    start: 'Inizia',
    historyTitle: 'Partite salvate',
    recentTitle: 'Partite recenti',
    resume: 'Riprendi',
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
    secOfficials: 'Match officials',
    secTeams: 'Teams',
    secCompetition: 'Competition',
    lblReferee: 'Referee',
    lblSupervisor: 'Supervisor',
    lblHome: 'Home team',
    lblAway: 'Away team',
    lblCategory: 'Category',
    lblLevel: 'Level',
    lblGroup: 'Group',
    allGroups: 'All groups',
    placeholderFirstName: 'First name',
    placeholderLastName: 'Last name',
    placeholderTeam: 'Search or type a name',
    lblColor: 'Colour',
    group: 'Group',
    colorTooSimilar: 'Colours are too similar: pick a different one.',
    noTeamFound: 'No team found: the typed name will be used.',
    selectPlaceholder: 'Select',
    start: 'Start',
    historyTitle: 'Past games',
    recentTitle: 'Recent games',
    resume: 'Resume',
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

function populateSelect(selectId, options, labelFor) {
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
    option.textContent = labelFor ? labelFor(value) : value;
    select.appendChild(option);
  });

  if (prev && options.includes(prev)) select.value = prev;
}

function applyLanguage() {
  document.documentElement.lang = currentLang;
  document.getElementById('lang-it-btn').classList.toggle('active', currentLang === 'it');
  document.getElementById('lang-en-btn').classList.toggle('active', currentLang === 'en');
  document.getElementById('lang-it-btn').setAttribute('aria-pressed', String(currentLang === 'it'));
  document.getElementById('lang-en-btn').setAttribute('aria-pressed', String(currentLang === 'en'));
  document.getElementById('home-subtitle').textContent = tr('homeSubtitle');
  document.getElementById('go-new-game-btn').textContent = tr('homeNewGame');
  document.getElementById('go-history-btn').textContent = tr('homeHistory');
  document.getElementById('setup-subtitle').textContent = tr('setupSubtitle');
  document.getElementById('sec-officials').textContent = tr('secOfficials');
  document.getElementById('sec-teams').textContent = tr('secTeams');
  document.getElementById('sec-competition').textContent = tr('secCompetition');
  document.getElementById('lbl-referee').textContent = tr('lblReferee');
  document.getElementById('lbl-supervisor').textContent = tr('lblSupervisor');
  document.getElementById('lbl-home').textContent = tr('lblHome');
  document.getElementById('lbl-away').textContent = tr('lblAway');
  document.getElementById('lbl-category').textContent = tr('lblCategory');
  document.getElementById('lbl-level').textContent = tr('lblLevel');
  document.getElementById('lbl-group').textContent = tr('lblGroup');
  document.getElementById('start-match-btn').textContent = tr('start');
  document.getElementById('history-title').textContent = tr('historyTitle');
  document.getElementById('recent-title').textContent = tr('recentTitle');
  renderRecentList();

  setNamePlaceholders('referee');
  setNamePlaceholders('supervisor');
  applyTeamPickerLanguage();

  populateSelect('inp-category', CATEGORY_OPTIONS, value => categoryLabel(value, currentLang));
  populateSelect('inp-level', LEVEL_OPTIONS);
  updateLevelVisibility();
  if (document.getElementById('history-screen').classList.contains('active')) renderHistoryList();
}

function setNamePlaceholders(prefix) {
  const first = document.getElementById('inp-' + prefix + '-first');
  const last = document.getElementById('inp-' + prefix + '-last');
  first.placeholder = tr('placeholderFirstName');
  first.setAttribute('aria-label', tr('placeholderFirstName'));
  last.placeholder = tr('placeholderLastName');
  last.setAttribute('aria-label', tr('placeholderLastName'));
}

function updateLevelVisibility() {
  const category = document.getElementById('inp-category').value;
  const showLevel = hasLevel(category);
  document.getElementById('level-group').hidden = !showLevel;
  document.getElementById('category-row').classList.toggle('single', !showLevel);
  if (!showLevel) document.getElementById('inp-level').value = '';
  refreshGroupOptions();
}

function refreshGroupOptions() {
  loadTeams().then(teams => {
    const select = document.getElementById('inp-group');
    const previous = select.value;
    const category = document.getElementById('inp-category').value;
    const level = hasLevel(category) ? document.getElementById('inp-level').value : '';
    const groups = category ? groupsFor(teams, category, level) : [];
    select.innerHTML = [`<option value="">${escapeHtml(tr('allGroups'))}</option>`]
      .concat(groups.map(group => `<option value="${escapeHtml(group)}">${escapeHtml(tr('group') + ' ' + group)}</option>`))
      .join('');
    select.value = groups.includes(previous) ? previous : '';
    document.getElementById('group-group').hidden = !groups.length;
    refreshTeamPickers();
  });
}

function readFormName(prefix) {
  return {
    first: document.getElementById('inp-' + prefix + '-first').value.trim(),
    last: document.getElementById('inp-' + prefix + '-last').value.trim()
  };
}

function setLanguage(lang) {
  if (lang !== 'it' && lang !== 'en') return;
  currentLang = lang;
  localStorage.setItem(LANG_KEY, currentLang);
  applyLanguage();
}

function buildRecordFromForm() {
  const homeTeam = teamPickers.home.getValue();
  const awayTeam = teamPickers.away.getValue();
  const home = homeTeam.name;
  const away = awayTeam.name;
  if (!home || !away) {
    alert(tr('alertTeams'));
    return null;
  }

  const referee = readFormName('referee');
  const supervisor = readFormName('supervisor');
  const category = document.getElementById('inp-category').value;
  const level = hasLevel(category) ? document.getElementById('inp-level').value : '';

  const now = Date.now();
  const gameId = generateGameId();
  return {
    version: STORAGE_VERSION,
    id: gameId,
    status: 'in-progress',
    createdAt: now,
    updatedAt: now,
    snapshot: {
      referee: joinName(referee),
      supervisor: joinName(supervisor),
      refereeFirst: referee.first,
      refereeLast: referee.last,
      supervisorFirst: supervisor.first,
      supervisorLast: supervisor.last,
      category: category || '—',
      level: level || '—',
      home,
      away,
      homeColor: homeTeam.color,
      awayColor: awayTeam.color,
      homeLogo: homeTeam.logo,
      awayLogo: awayTeam.logo,
      homeTeamId: homeTeam.teamId,
      awayTeamId: awayTeam.teamId,
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
    const detailParts = [];
    if (snap.category && snap.category !== '—') detailParts.push(categoryLabel(snap.category, currentLang));
    if (snap.level && snap.level !== '—') detailParts.push(snap.level);
    detailParts.push(new Date(record.updatedAt).toLocaleString());
    const details = escapeHtml(detailParts.join(' · '));
    return `
      <article class="history-card">
        <div class="history-card-top">
          <div class="history-teams">${escapeHtml(snap.home || 'Home')} vs ${escapeHtml(snap.away || 'Away')}</div>
          <span class="history-status ${record.status === 'completed' ? 'done' : 'open'}">${status}</span>
        </div>
        <div class="history-meta">${details}</div>
        <div class="history-score">${snap.scoreHome || 0} – ${snap.scoreAway || 0}</div>
        <div class="history-actions">
          <button class="btn-small btn-open" data-action="open" data-id="${escapeHtml(record.id)}">${tr('open')}</button>
          <button class="btn-small btn-delete" data-action="delete" data-id="${escapeHtml(record.id)}">${tr('delete')}</button>
        </div>
      </article>
    `;
  }).join('');
}

function renderRecentList() {
  const section = document.getElementById('recent-section');
  const records = getAllGameRecords().slice(0, RECENT_GAMES_COUNT);
  section.hidden = records.length === 0;

  document.getElementById('recent-list').innerHTML = records.map(record => {
    const snap = record.snapshot || {};
    const isDone = record.status === 'completed';
    const status = isDone ? tr('statusCompleted') : tr('statusInProgress');
    const action = isDone ? tr('open') : tr('resume');
    return `
      <button type="button" class="history-card recent-card" data-id="${escapeHtml(record.id)}">
        <span class="history-card-top">
          <span class="history-teams">${escapeHtml(snap.home || 'Home')} vs ${escapeHtml(snap.away || 'Away')}</span>
          <span class="history-status ${isDone ? 'done' : 'open'}">${status}</span>
        </span>
        <span class="history-meta">${escapeHtml(new Date(record.updatedAt).toLocaleString())}</span>
        <span class="recent-bottom">
          <span class="history-score">${snap.scoreHome || 0} – ${snap.scoreAway || 0}</span>
          <span class="recent-action">${action} →</span>
        </span>
      </button>
    `;
  }).join('');
}

function openGame(gameId) {
  localStorage.setItem(STORAGE_ACTIVE_GAME_KEY, gameId);
  window.location.href = 'game.html';
}

function handleRecentClick(event) {
  const card = event.target.closest('.recent-card');
  if (card) openGame(card.dataset.id);
}

function handleHistoryClick(event) {
  const action = event.target.dataset.action;
  const id = event.target.dataset.id;
  if (!action || !id) return;

  if (action === 'open') {
    openGame(id);
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
  document.getElementById('inp-category').addEventListener('change', updateLevelVisibility);
  document.getElementById('inp-level').addEventListener('change', refreshGroupOptions);
  document.getElementById('inp-group').addEventListener('change', refreshTeamPickers);
  document.getElementById('start-match-btn').addEventListener('click', startGame);
  document.getElementById('history-list').addEventListener('click', handleHistoryClick);
  document.getElementById('recent-list').addEventListener('click', handleRecentClick);
}

function init() {
  initTeamPickers();
  bindUI();
  applyLanguage();
  initFromHash();
}

init();
