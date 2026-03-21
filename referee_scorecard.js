const STORAGE_VERSION = 1;
const STORAGE_INDEX_KEY = 'refcard_games_index';
const STORAGE_GAME_PREFIX = 'refcard_game_';
const SAVE_DEBOUNCE_MS = 350;
const LANG_KEY = 'refcard_lang';

const CATEGORY_OPTIONS = ['Juniores', 'Under 18', 'Under 17', 'Under 16', 'Under 15', 'Under 15'];
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
    pastGames: 'Partite salvate',
    endGame: 'Fine gara',
    firstHalf: '1° tempo',
    secondHalf: '2° tempo',
    historyTitle: 'Partite salvate',
    addEvent: 'Aggiungi evento',
    typeCard: 'Cartellino',
    typeGoal: 'Goal',
    typeSub: 'Sostituzione',
    typeAddTime: 'Recupero',
    lblCardType: 'Tipo cartellino',
    yellow: 'Giallo',
    red: 'Rosso',
    cancel: 'Annulla',
    saveEvent: 'Aggiungi evento',
    alertTeams: 'Inserisci entrambe le squadre.',
    alertCard: 'Inserisci giocatore e minuto.',
    alertGoal: 'Inserisci il minuto.',
    alertSub: 'Compila tutti i campi della sostituzione.',
    alertAddTime: 'Inserisci i minuti di recupero.',
    alertLoad: 'Impossibile caricare questa partita.',
    confirmDelete: 'Eliminare questa partita dalla cronologia locale?',
    noEvents: 'Nessun evento',
    noSavedGames: 'Nessuna partita salvata',
    statusCompleted: 'Completata',
    statusInProgress: 'In corso',
    open: 'Apri',
    delete: 'Elimina',
    refPrefix: 'Arb',
    yellowCard: 'Cartellino giallo',
    redCard: 'Cartellino rosso',
    goal: 'Goal',
    addedTime: 'Recupero',
    halfSuffix: 'tempo'
  },
  en: {
    homeSubtitle: 'Offline scorecard',
    homeNewGame: 'New game',
    homeHistory: 'Past games',
    setupSubtitle: 'Match scorecard',
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
    pastGames: 'Past games',
    endGame: 'End game',
    firstHalf: '1st half',
    secondHalf: '2nd half',
    historyTitle: 'Past games',
    addEvent: 'Add event',
    typeCard: 'Card',
    typeGoal: 'Goal',
    typeSub: 'Substitution',
    typeAddTime: 'Added time',
    lblCardType: 'Card type',
    yellow: 'Yellow',
    red: 'Red',
    cancel: 'Cancel',
    saveEvent: 'Add event',
    alertTeams: 'Please enter both team names.',
    alertCard: 'Enter player and minute.',
    alertGoal: 'Enter the minute.',
    alertSub: 'Fill all substitution fields.',
    alertAddTime: 'Enter the added minutes.',
    alertLoad: 'Could not load this game.',
    confirmDelete: 'Delete this game from local history?',
    noEvents: 'No events yet',
    noSavedGames: 'No saved games yet',
    statusCompleted: 'Completed',
    statusInProgress: 'In progress',
    open: 'Open',
    delete: 'Delete',
    refPrefix: 'Ref',
    yellowCard: 'Yellow card',
    redCard: 'Red card',
    goal: 'Goal',
    addedTime: 'Added time',
    halfSuffix: 'half'
  }
};

let currentLang = localStorage.getItem(LANG_KEY) || 'it';

function tr(key) {
  return TEXT[currentLang][key] || key;
}

function getDefaultState() {
  return {
    gameId: null,
    status: 'in-progress',
    createdAt: null,
    updatedAt: null,
    referee: '',
    supervisor: '',
    category: '',
    level: '',
    home: 'Home',
    away: 'Away',
    scoreHome: 0,
    scoreAway: 0,
    half: 1,
    events: [],
    currentTeam: 'home',
    currentType: 'card',
    currentCardType: 'yellow'
  };
}

let state = getDefaultState();
let saveTimer = null;

function safeParse(jsonText, fallback) {
  try {
    return JSON.parse(jsonText);
  } catch (error) {
    return fallback;
  }
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function setPlaceholder(id, value) {
  const element = document.getElementById(id);
  if (element) element.placeholder = value;
}

function populateSelect(selectId, options) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const previousValue = select.value;
  select.innerHTML = '';

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = tr('selectPlaceholder');
  select.appendChild(defaultOption);

  options.forEach(optionText => {
    const option = document.createElement('option');
    option.value = optionText;
    option.textContent = optionText;
    select.appendChild(option);
  });

  if (previousValue && options.includes(previousValue)) {
    select.value = previousValue;
  }
}

function applyLanguage() {
  document.documentElement.lang = currentLang;

  setText('lang-toggle-btn', currentLang === 'it' ? 'EN' : 'IT');
  setText('home-subtitle', tr('homeSubtitle'));
  setText('go-new-game-btn', tr('homeNewGame'));
  setText('go-history-btn', tr('homeHistory'));
  setText('setup-subtitle', tr('setupSubtitle'));
  setText('lbl-referee', tr('lblReferee'));
  setText('lbl-supervisor', tr('lblSupervisor'));
  setText('lbl-home', tr('lblHome'));
  setText('lbl-away', tr('lblAway'));
  setText('lbl-category', tr('lblCategory'));
  setText('lbl-level', tr('lblLevel'));
  setPlaceholder('inp-referee', tr('placeholderName'));
  setPlaceholder('inp-supervisor', tr('placeholderName'));
  setPlaceholder('inp-home', tr('placeholderHome'));
  setPlaceholder('inp-away', tr('placeholderAway'));
  setText('start-match-btn', tr('start'));
  setText('go-history-from-match-btn', tr('pastGames'));
  setText('end-game-btn', tr('endGame'));
  setText('history-title', tr('historyTitle'));
  setText('lbl-type-card', tr('typeCard'));
  setText('lbl-type-goal', tr('typeGoal'));
  setText('lbl-type-sub', tr('typeSub'));
  setText('lbl-type-addtime', tr('typeAddTime'));
  setText('lbl-card-type', tr('lblCardType'));
  setText('ct-yellow', tr('yellow'));
  setText('ct-red', tr('red'));
  setText('cancel-event-btn', tr('cancel'));
  setText('save-event-btn', tr('saveEvent'));

  const atHalf = document.getElementById('f-at-half');
  if (atHalf) {
    atHalf.innerHTML = `
      <option value="1">${tr('firstHalf')}</option>
      <option value="2">${tr('secondHalf')}</option>
    `;
  }

  populateSelect('inp-category', CATEGORY_OPTIONS);
  populateSelect('inp-level', LEVEL_OPTIONS);

  applyStateToMatchUI();
  if (document.getElementById('history-screen').classList.contains('active')) renderHistoryList();
}

function toggleLanguage() {
  currentLang = currentLang === 'it' ? 'en' : 'it';
  localStorage.setItem(LANG_KEY, currentLang);
  applyLanguage();
}

function generateGameId() {
  return 'g_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
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

function buildSnapshotFromState() {
  return {
    referee: state.referee,
    supervisor: state.supervisor,
    category: state.category,
    level: state.level,
    home: state.home,
    away: state.away,
    scoreHome: state.scoreHome,
    scoreAway: state.scoreAway,
    half: state.half,
    events: state.events
  };
}

function saveCurrentGame() {
  if (!state.gameId) return;

  const now = Date.now();
  if (!state.createdAt) state.createdAt = now;
  state.updatedAt = now;

  const record = {
    version: STORAGE_VERSION,
    id: state.gameId,
    status: state.status,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
    snapshot: buildSnapshotFromState()
  };

  localStorage.setItem(getStorageKey(state.gameId), JSON.stringify(record));
  upsertGameInIndex(state.gameId);
}

function scheduleSave() {
  if (!state.gameId) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveCurrentGame();
    saveTimer = null;
  }, SAVE_DEBOUNCE_MS);
}

function saveNow() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  saveCurrentGame();
}

function getGameRecord(gameId) {
  const raw = localStorage.getItem(getStorageKey(gameId));
  if (!raw) return null;

  const record = safeParse(raw, null);
  if (!record || record.version !== STORAGE_VERSION || !record.snapshot) return null;
  if (!Array.isArray(record.snapshot.events)) return null;

  return record;
}

function getAllGameRecords() {
  const gameIds = getGameIndex();
  const validRecords = [];

  gameIds.forEach(gameId => {
    const record = getGameRecord(gameId);
    if (record) {
      validRecords.push(record);
    } else {
      removeGameFromIndex(gameId);
      localStorage.removeItem(getStorageKey(gameId));
    }
  });

  return validRecords.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

function deleteGame(gameId) {
  localStorage.removeItem(getStorageKey(gameId));
  removeGameFromIndex(gameId);
}

function resetRuntimeState() {
  state = getDefaultState();
}

function formatDate(epochMs) {
  if (!epochMs) return '—';
  return new Date(epochMs).toLocaleString();
}

function switchScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.toggle('active', screen.id === screenId);
  });
}

function applyStateToMatchUI() {
  document.getElementById('disp-home').textContent = state.home;
  document.getElementById('disp-away').textContent = state.away;
  document.getElementById('col-home-name').textContent = state.home;
  document.getElementById('col-away-name').textContent = state.away;
  document.getElementById('fab-home-label').textContent = state.home;
  document.getElementById('fab-away-label').textContent = state.away;

  document.getElementById('score-home').textContent = state.scoreHome;
  document.getElementById('score-away').textContent = state.scoreAway;

  const parts = [];
  if (state.category && state.category !== '—') parts.push(state.category);
  if (state.level && state.level !== '—') parts.push(state.level);
  if (state.referee && state.referee !== '—') parts.push(`${tr('refPrefix')}: ${state.referee}`);
  document.getElementById('match-meta-text').textContent = parts.join(' · ') || '—';

  setHalf(state.half, false);
  renderAllEvents();
}

function fillSetupForm() {
  document.getElementById('inp-referee').value = state.referee === '—' ? '' : state.referee;
  document.getElementById('inp-supervisor').value = state.supervisor === '—' ? '' : state.supervisor;
  document.getElementById('inp-home').value = state.home === 'Home' ? '' : state.home;
  document.getElementById('inp-away').value = state.away === 'Away' ? '' : state.away;
  document.getElementById('inp-category').value = state.category === '—' ? '' : state.category;
  document.getElementById('inp-level').value = state.level === '—' ? '' : state.level;
}

function startNewGameFlow() {
  resetRuntimeState();
  fillSetupForm();
  switchScreen('setup-screen');
}

function showHistoryScreen() {
  renderHistoryList();
  switchScreen('history-screen');
}

function startMatch() {
  const home = document.getElementById('inp-home').value.trim();
  const away = document.getElementById('inp-away').value.trim();
  if (!home || !away) {
    alert(tr('alertTeams'));
    return;
  }

  const now = Date.now();
  state.gameId = generateGameId();
  state.status = 'in-progress';
  state.createdAt = now;
  state.updatedAt = now;
  state.referee = document.getElementById('inp-referee').value.trim() || '—';
  state.supervisor = document.getElementById('inp-supervisor').value.trim() || '—';
  state.home = home;
  state.away = away;
  state.category = document.getElementById('inp-category').value || '—';
  state.level = document.getElementById('inp-level').value || '—';
  state.scoreHome = 0;
  state.scoreAway = 0;
  state.half = 1;
  state.events = [];

  applyStateToMatchUI();
  switchScreen('match-screen');
  saveNow();
}

function resumeGame(gameId) {
  const record = getGameRecord(gameId);
  if (!record) {
    alert(tr('alertLoad'));
    renderHistoryList();
    return;
  }

  resetRuntimeState();
  state.gameId = record.id;
  state.status = record.status || 'in-progress';
  state.createdAt = record.createdAt || Date.now();
  state.updatedAt = record.updatedAt || Date.now();

  const snapshot = record.snapshot;
  state.referee = snapshot.referee || '—';
  state.supervisor = snapshot.supervisor || '—';
  state.category = snapshot.category || '—';
  state.level = snapshot.level || '—';
  state.home = snapshot.home || 'Home';
  state.away = snapshot.away || 'Away';
  state.scoreHome = Number.isFinite(snapshot.scoreHome) ? snapshot.scoreHome : 0;
  state.scoreAway = Number.isFinite(snapshot.scoreAway) ? snapshot.scoreAway : 0;
  state.half = snapshot.half === 2 ? 2 : 1;
  state.events = Array.isArray(snapshot.events) ? snapshot.events : [];

  applyStateToMatchUI();
  switchScreen('match-screen');
}

function endGame() {
  if (!state.gameId) return;
  state.status = 'completed';
  saveNow();
  showHistoryScreen();
}

function setHalf(h, shouldSave = true) {
  state.half = h;
  document.getElementById('btn-1h').classList.toggle('active', h === 1);
  document.getElementById('btn-2h').classList.toggle('active', h === 2);
  document.getElementById('btn-1h').textContent = tr('firstHalf');
  document.getElementById('btn-2h').textContent = tr('secondHalf');
  document.getElementById('half-label').textContent = h === 1 ? tr('firstHalf') : tr('secondHalf');

  if (shouldSave) scheduleSave();
}

function openModal(team) {
  state.currentTeam = team;
  document.getElementById('modal-title').textContent =
    `${tr('addEvent')} – ${team === 'home' ? state.home : state.away}`;

  selectType('card');
  selectCardType('yellow');
  ['f-card-player', 'f-card-min', 'f-goal-min', 'f-sub-out', 'f-sub-in', 'f-sub-min', 'f-at-mins']
    .forEach(id => {
      const element = document.getElementById(id);
      if (element) element.value = '';
    });
  document.getElementById('f-at-half').value = state.half;

  document.getElementById('event-modal').classList.add('open');
}

function closeModal() {
  document.getElementById('event-modal').classList.remove('open');
}

function selectType(type) {
  state.currentType = type;
  ['card', 'goal', 'sub', 'addtime'].forEach(t => {
    document.getElementById('type-' + t).classList.toggle('selected', t === type);
    document.getElementById('fields-' + t).classList.toggle('is-hidden', t !== type);
  });
}

function selectCardType(type) {
  state.currentCardType = type;
  document.getElementById('ct-yellow').classList.toggle('selected', type === 'yellow');
  document.getElementById('ct-red').classList.toggle('selected', type === 'red');
}

function saveEvent() {
  const team = state.currentTeam;
  const type = state.currentType;
  const event = { team, type, half: state.half };

  if (type === 'card') {
    const player = document.getElementById('f-card-player').value.trim();
    const min = document.getElementById('f-card-min').value.trim();
    if (!player || !min) {
      alert(tr('alertCard'));
      return;
    }
    event.cardType = state.currentCardType;
    event.player = player;
    event.minute = parseInt(min, 10);
  } else if (type === 'goal') {
    const min = document.getElementById('f-goal-min').value.trim();
    if (!min) {
      alert(tr('alertGoal'));
      return;
    }
    event.minute = parseInt(min, 10);

    if (team === 'home') state.scoreHome += 1;
    else state.scoreAway += 1;
    document.getElementById('score-home').textContent = state.scoreHome;
    document.getElementById('score-away').textContent = state.scoreAway;
  } else if (type === 'sub') {
    const out = document.getElementById('f-sub-out').value.trim();
    const inn = document.getElementById('f-sub-in').value.trim();
    const min = document.getElementById('f-sub-min').value.trim();
    if (!out || !inn || !min) {
      alert(tr('alertSub'));
      return;
    }
    event.playerOut = out;
    event.playerIn = inn;
    event.minute = parseInt(min, 10);
  } else if (type === 'addtime') {
    const half = document.getElementById('f-at-half').value;
    const mins = document.getElementById('f-at-mins').value.trim();
    if (!mins) {
      alert(tr('alertAddTime'));
      return;
    }
    event.atHalf = parseInt(half, 10);
    event.atMins = parseInt(mins, 10);
  }

  state.events.push(event);
  renderEvent(event);
  closeModal();
  scheduleSave();
}

function renderEvent(event) {
  const list = document.getElementById('events-' + event.team);
  const element = document.createElement('div');
  element.className = 'event-item' + (event.team === 'away' ? ' away' : '');

  let iconClass = '';
  let iconText = '';
  let playerText = '';
  let detailText = '';
  let minuteText = '';

  if (event.type === 'card') {
    iconClass = event.cardType;
    iconText = event.cardType === 'yellow' ? 'Y' : 'R';
    playerText = event.player;
    detailText = event.cardType === 'yellow' ? tr('yellowCard') : tr('redCard');
    minuteText = event.minute + "'";
  } else if (event.type === 'goal') {
    iconClass = 'goal';
    iconText = '⚽';
    playerText = tr('goal');
    minuteText = event.minute + "'";
  } else if (event.type === 'sub') {
    iconClass = 'sub';
    iconText = '↕';
    playerText = '↑ ' + event.playerIn;
    detailText = '↓ ' + event.playerOut;
    minuteText = event.minute + "'";
  } else if (event.type === 'addtime') {
    iconClass = 'addtime';
    iconText = '+' + event.atMins;
    playerText = tr('addedTime');
    detailText = `${event.atHalf === 1 ? '1' : '2'}° ${tr('halfSuffix')}`;
  }

  element.innerHTML = `
      <div class="event-icon ${iconClass}">${iconText}</div>
      <div class="event-info">
        <div class="event-player">${playerText}</div>
        ${detailText ? `<div class="event-detail">${detailText}</div>` : ''}
      </div>
      ${minuteText ? `<div class="event-min">${minuteText}</div>` : ''}
    `;

  const empty = list.querySelector('.empty-state');
  if (empty) empty.remove();

  list.appendChild(element);
}

function renderEmptyStates() {
  ['home', 'away'].forEach(team => {
    const list = document.getElementById('events-' + team);
    if (list.children.length > 0) return;

    const div = document.createElement('div');
    div.className = 'empty-state';
    div.textContent = tr('noEvents');
    list.appendChild(div);
  });
}

function renderAllEvents() {
  ['home', 'away'].forEach(team => {
    const list = document.getElementById('events-' + team);
    list.innerHTML = '';
  });

  state.events.forEach(renderEvent);
  renderEmptyStates();
}

function renderHistoryList() {
  const historyList = document.getElementById('history-list');
  const records = getAllGameRecords();

  if (!records.length) {
    historyList.innerHTML = `<div class="empty-state history-empty">${tr('noSavedGames')}</div>`;
    return;
  }

  historyList.innerHTML = records.map(record => {
    const snap = record.snapshot;
    const statusLabel = record.status === 'completed' ? tr('statusCompleted') : tr('statusInProgress');
    const details = [snap.category || '—', snap.level || '—', formatDate(record.updatedAt)].join(' · ');

    return `
      <article class="history-card" data-game-id="${record.id}">
        <div class="history-card-top">
          <div class="history-teams">${snap.home} vs ${snap.away}</div>
          <span class="history-status ${record.status === 'completed' ? 'done' : 'open'}">${statusLabel}</span>
        </div>
        <div class="history-meta">${details}</div>
        <div class="history-score">${snap.scoreHome || 0} – ${snap.scoreAway || 0}</div>
        <div class="history-actions">
          <button class="btn-small btn-open" data-action="open" data-game-id="${record.id}">${tr('open')}</button>
          <button class="btn-small btn-delete" data-action="delete" data-game-id="${record.id}">${tr('delete')}</button>
        </div>
      </article>
    `;
  }).join('');
}

function handleHistoryClick(event) {
  const action = event.target.dataset.action;
  const gameId = event.target.dataset.gameId;
  if (!action || !gameId) return;

  if (action === 'open') {
    resumeGame(gameId);
    return;
  }

  if (action === 'delete') {
    const confirmed = confirm(tr('confirmDelete'));
    if (!confirmed) return;
    deleteGame(gameId);
    renderHistoryList();
  }
}

function bindUI() {
  document.getElementById('lang-toggle-btn').addEventListener('click', toggleLanguage);
  document.getElementById('go-new-game-btn').addEventListener('click', startNewGameFlow);
  document.getElementById('go-history-btn').addEventListener('click', showHistoryScreen);
  document.getElementById('back-home-from-setup-btn').addEventListener('click', () => switchScreen('home-screen'));
  document.getElementById('back-home-from-history-btn').addEventListener('click', () => switchScreen('home-screen'));

  document.getElementById('start-match-btn').addEventListener('click', startMatch);
  document.getElementById('go-history-from-match-btn').addEventListener('click', () => {
    saveNow();
    showHistoryScreen();
  });
  document.getElementById('end-game-btn').addEventListener('click', endGame);

  document.getElementById('btn-1h').addEventListener('click', () => setHalf(1));
  document.getElementById('btn-2h').addEventListener('click', () => setHalf(2));

  document.getElementById('home-fab').addEventListener('click', () => openModal('home'));
  document.getElementById('away-fab').addEventListener('click', () => openModal('away'));

  document.querySelectorAll('.type-btn').forEach(button => {
    button.addEventListener('click', () => selectType(button.dataset.type));
  });

  document.querySelectorAll('.card-type-btn').forEach(button => {
    button.addEventListener('click', () => selectCardType(button.dataset.cardType));
  });

  document.getElementById('cancel-event-btn').addEventListener('click', closeModal);
  document.getElementById('save-event-btn').addEventListener('click', saveEvent);

  document.getElementById('event-modal').addEventListener('click', function (event) {
    if (event.target === this) closeModal();
  });

  document.getElementById('history-list').addEventListener('click', handleHistoryClick);

  window.addEventListener('beforeunload', saveNow);
}

function init() {
  bindUI();
  applyLanguage();
  switchScreen('home-screen');
}

init();
