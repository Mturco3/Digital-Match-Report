const STORAGE_VERSION = 1;
const STORAGE_INDEX_KEY = 'refcard_games_index';
const STORAGE_GAME_PREFIX = 'refcard_game_';
const STORAGE_ACTIVE_GAME_KEY = 'refcard_active_game';
const LANG_KEY = 'refcard_lang';

const TEXT = {
  it: {
    pastGames: 'Partite salvate',
    endGame: 'Fine gara',
    addEvent: 'Aggiungi evento',
    typeCard: 'Cartellino',
    typeGoal: 'Goal',
    typeSub: 'Sostituzione',
    lblCardType: 'Tipo cartellino',
    lblEventHalf: 'Tempo',
    lblCardNumber: 'Numero giocatore',
    lblMinute: 'Minuto',
    lblSubOut: 'Numero uscita',
    lblSubIn: 'Numero entrata',
    yellow: 'Giallo',
    red: 'Rosso',
    cancel: 'Annulla',
    saveEvent: 'Aggiungi evento',
    firstHalf: '1° tempo',
    secondHalf: '2° tempo',
    halfDividerSecond: '2° tempo',
    alertCard: 'Inserisci numero e minuto.',
    alertGoal: 'Inserisci il minuto.',
    alertSub: 'Compila tutti i campi della sostituzione.',
    alertNoGame: 'Nessuna partita attiva trovata.',
    yellowCard: 'Cartellino giallo',
    redCard: 'Cartellino rosso',
    goal: 'Goal',
    refPrefix: 'Arb',
    noEvents: 'Nessun evento',
    addedFirst: 'Recupero primo tempo',
    addedSecond: 'Recupero secondo tempo',
    totalSubsHome: 'Totale cambi casa',
    totalSubsAway: 'Totale cambi ospiti'
  },
  en: {
    pastGames: 'Past games',
    endGame: 'End game',
    addEvent: 'Add event',
    typeCard: 'Card',
    typeGoal: 'Goal',
    typeSub: 'Substitution',
    lblCardType: 'Card type',
    lblEventHalf: 'Half',
    lblCardNumber: 'Shirt number',
    lblMinute: 'Minute',
    lblSubOut: 'Number out',
    lblSubIn: 'Number in',
    yellow: 'Yellow',
    red: 'Red',
    cancel: 'Cancel',
    saveEvent: 'Add event',
    firstHalf: '1st half',
    secondHalf: '2nd half',
    halfDividerSecond: '2nd half',
    alertCard: 'Enter shirt number and minute.',
    alertGoal: 'Enter the minute.',
    alertSub: 'Fill all substitution fields.',
    alertNoGame: 'No active game found.',
    yellowCard: 'Yellow card',
    redCard: 'Red card',
    goal: 'Goal',
    refPrefix: 'Ref',
    noEvents: 'No events yet',
    addedFirst: 'Added time first half',
    addedSecond: 'Added time second half',
    totalSubsHome: 'Total home subs',
    totalSubsAway: 'Total away subs'
  }
};

let currentLang = localStorage.getItem(LANG_KEY) || 'it';
let state = null;

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

function normalizeEvent(event) {
  const half = Number(event.half || 1) === 2 ? 2 : 1;
  return { ...event, half };
}

function loadActiveGame() {
  const activeId = localStorage.getItem(STORAGE_ACTIVE_GAME_KEY);
  if (!activeId) return null;

  const raw = localStorage.getItem(getStorageKey(activeId));
  const record = safeParse(raw, null);
  if (!record || record.version !== STORAGE_VERSION || !record.snapshot) return null;

  const snapshot = record.snapshot;
  return {
    gameId: record.id,
    status: record.status || 'in-progress',
    createdAt: record.createdAt || Date.now(),
    updatedAt: record.updatedAt || Date.now(),
    referee: snapshot.referee || '—',
    supervisor: snapshot.supervisor || '—',
    category: snapshot.category || '—',
    level: snapshot.level || '—',
    home: snapshot.home || 'Home',
    away: snapshot.away || 'Away',
    scoreHome: Number.isFinite(snapshot.scoreHome) ? snapshot.scoreHome : 0,
    scoreAway: Number.isFinite(snapshot.scoreAway) ? snapshot.scoreAway : 0,
    addedTimeFirst: Number.isFinite(snapshot.addedTimeFirst) ? snapshot.addedTimeFirst : 0,
    addedTimeSecond: Number.isFinite(snapshot.addedTimeSecond) ? snapshot.addedTimeSecond : 0,
    half: snapshot.half === 2 ? 2 : 1,
    events: Array.isArray(snapshot.events) ? snapshot.events.filter(event => event.type !== 'addtime').map(normalizeEvent) : [],
    currentTeam: 'home',
    currentType: 'card',
    currentCardType: 'yellow'
  };
}

function saveState() {
  const now = Date.now();
  const record = {
    version: STORAGE_VERSION,
    id: state.gameId,
    status: state.status,
    createdAt: state.createdAt,
    updatedAt: now,
    snapshot: {
      referee: state.referee,
      supervisor: state.supervisor,
      category: state.category,
      level: state.level,
      home: state.home,
      away: state.away,
      scoreHome: state.scoreHome,
      scoreAway: state.scoreAway,
      addedTimeFirst: state.addedTimeFirst,
      addedTimeSecond: state.addedTimeSecond,
      half: state.half,
      events: state.events.map(normalizeEvent)
    }
  };

  state.updatedAt = now;
  localStorage.setItem(getStorageKey(state.gameId), JSON.stringify(record));
  upsertGameInIndex(state.gameId);
}

function applyLanguage() {
  document.documentElement.lang = currentLang;
  document.getElementById('go-history-from-match-btn').textContent = tr('pastGames');
  document.getElementById('end-game-btn').textContent = tr('endGame');
  document.getElementById('lang-it-btn').classList.toggle('active', currentLang === 'it');
  document.getElementById('lang-en-btn').classList.toggle('active', currentLang === 'en');

  document.getElementById('lbl-added-first').textContent = tr('addedFirst');
  document.getElementById('lbl-added-second').textContent = tr('addedSecond');
  document.getElementById('lbl-subs-home').textContent = tr('totalSubsHome');
  document.getElementById('lbl-subs-away').textContent = tr('totalSubsAway');

  document.getElementById('lbl-type-card').textContent = tr('typeCard');
  document.getElementById('lbl-type-goal').textContent = tr('typeGoal');
  document.getElementById('lbl-type-sub').textContent = tr('typeSub');
  document.getElementById('lbl-card-type').textContent = tr('lblCardType');
  document.getElementById('lbl-event-half').textContent = tr('lblEventHalf');
  document.getElementById('lbl-card-number').textContent = tr('lblCardNumber');
  document.getElementById('lbl-minute-card').textContent = tr('lblMinute');
  document.getElementById('lbl-minute-goal').textContent = tr('lblMinute');
  document.getElementById('lbl-sub-out').textContent = tr('lblSubOut');
  document.getElementById('lbl-sub-in').textContent = tr('lblSubIn');
  document.getElementById('lbl-minute-sub').textContent = tr('lblMinute');
  document.getElementById('ct-yellow').textContent = tr('yellow');
  document.getElementById('ct-red').textContent = tr('red');
  document.getElementById('cancel-event-btn').textContent = tr('cancel');
  document.getElementById('save-event-btn').textContent = tr('saveEvent');

  const halfSelect = document.getElementById('f-event-half');
  const prev = halfSelect.value || String(state.half || 1);
  halfSelect.innerHTML = `
    <option value="1">${tr('firstHalf')}</option>
    <option value="2">${tr('secondHalf')}</option>
  `;
  halfSelect.value = prev;

  renderMatch();
}

function setLanguage(lang) {
  if (lang !== 'it' && lang !== 'en') return;
  currentLang = lang;
  localStorage.setItem(LANG_KEY, currentLang);
  applyLanguage();
}

function renderSummary() {
  document.getElementById('summary-added-first').value = state.addedTimeFirst;
  document.getElementById('summary-added-second').value = state.addedTimeSecond;

  const subsHome = state.events.filter(event => event.type === 'sub' && event.team === 'home').length;
  const subsAway = state.events.filter(event => event.type === 'sub' && event.team === 'away').length;
  document.getElementById('summary-subs-home').textContent = String(subsHome);
  document.getElementById('summary-subs-away').textContent = String(subsAway);
}

function renderMatch() {
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

  renderSummary();
  renderAllEvents();
}

function selectType(type) {
  state.currentType = type;
  ['card', 'goal', 'sub'].forEach(t => {
    document.getElementById('type-' + t).classList.toggle('selected', t === type);
    document.getElementById('fields-' + t).classList.toggle('is-hidden', t !== type);
  });
}

function selectCardType(type) {
  state.currentCardType = type;
  document.getElementById('ct-yellow').classList.toggle('selected', type === 'yellow');
  document.getElementById('ct-red').classList.toggle('selected', type === 'red');
}

function openModal(team) {
  state.currentTeam = team;
  document.getElementById('modal-title').textContent = `${tr('addEvent')} – ${team === 'home' ? state.home : state.away}`;
  selectType('card');
  selectCardType('yellow');

  ['f-card-player', 'f-card-min', 'f-goal-min', 'f-sub-out', 'f-sub-in', 'f-sub-min'].forEach(id => {
    const element = document.getElementById(id);
    if (element) element.value = '';
  });

  document.getElementById('f-event-half').value = String(state.half || 1);
  document.getElementById('event-modal').classList.add('open');
}

function closeModal() {
  document.getElementById('event-modal').classList.remove('open');
}

function saveEvent() {
  const half = parseInt(document.getElementById('f-event-half').value, 10) || 1;
  const event = { team: state.currentTeam, type: state.currentType, half };

  if (event.type === 'card') {
    const player = document.getElementById('f-card-player').value.trim();
    const minute = document.getElementById('f-card-min').value.trim();
    if (!player || !minute) return alert(tr('alertCard'));
    event.player = player;
    event.cardType = state.currentCardType;
    event.minute = parseInt(minute, 10);
  } else if (event.type === 'goal') {
    const minute = document.getElementById('f-goal-min').value.trim();
    if (!minute) return alert(tr('alertGoal'));
    event.minute = parseInt(minute, 10);
    if (event.team === 'home') state.scoreHome += 1;
    else state.scoreAway += 1;
  } else if (event.type === 'sub') {
    const outNumber = document.getElementById('f-sub-out').value.trim();
    const inNumber = document.getElementById('f-sub-in').value.trim();
    const minute = document.getElementById('f-sub-min').value.trim();
    if (!outNumber || !inNumber || !minute) return alert(tr('alertSub'));
    event.playerOut = outNumber;
    event.playerIn = inNumber;
    event.minute = parseInt(minute, 10);
  }

  state.half = half;
  state.events.push(normalizeEvent(event));
  saveState();
  renderMatch();
  closeModal();
}

function createEventNode(event) {
  const node = document.createElement('div');
  node.className = 'event-item' + (event.team === 'away' ? ' away' : '');

  let iconClass = '';
  let iconText = '';
  let playerText = '';
  let detailText = '';
  let minuteText = '';

  if (event.type === 'card') {
    iconClass = event.cardType;
    iconText = event.cardType === 'yellow' ? 'Y' : 'R';
    playerText = '#' + event.player;
    detailText = event.cardType === 'yellow' ? tr('yellowCard') : tr('redCard');
    minuteText = `${event.minute}'`;
  } else if (event.type === 'goal') {
    iconClass = 'goal';
    iconText = '⚽';
    playerText = tr('goal');
    minuteText = `${event.minute}'`;
  } else if (event.type === 'sub') {
    iconClass = 'sub';
    iconText = '↕';
    playerText = `↑ #${event.playerIn}`;
    detailText = `↓ #${event.playerOut}`;
    minuteText = `${event.minute}'`;
  }

  node.innerHTML = `
    <div class="event-icon ${iconClass}">${iconText}</div>
    <div class="event-info">
      <div class="event-player">${playerText}</div>
      ${detailText ? `<div class="event-detail">${detailText}</div>` : ''}
    </div>
    ${minuteText ? `<div class="event-min">${minuteText}</div>` : ''}
  `;

  return node;
}

function renderEventsForList(listId, events) {
  const list = document.getElementById(listId);
  list.innerHTML = '';

  const firstHalfEvents = events.filter(event => event.half === 1);
  const secondHalfEvents = events.filter(event => event.half === 2);

  firstHalfEvents.forEach(event => list.appendChild(createEventNode(event)));

  if (firstHalfEvents.length && secondHalfEvents.length) {
    const divider = document.createElement('div');
    divider.className = 'half-divider';
    divider.textContent = tr('halfDividerSecond');
    list.appendChild(divider);
  }

  secondHalfEvents.forEach(event => list.appendChild(createEventNode(event)));

  if (!firstHalfEvents.length && !secondHalfEvents.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = tr('noEvents');
    list.appendChild(empty);
  }
}

function renderAllEvents() {
  renderEventsForList('events-home', state.events.filter(event => event.team === 'home'));
  renderEventsForList('events-away', state.events.filter(event => event.team === 'away'));
}

function goHistory() {
  saveState();
  window.location.href = 'referee_scorecard.html#history';
}

function endGame() {
  state.status = 'completed';
  saveState();
  window.location.href = 'referee_scorecard.html#history';
}

function handleSummaryInput(event) {
  if (event.target.id === 'summary-added-first') {
    state.addedTimeFirst = Math.max(0, parseInt(event.target.value || '0', 10) || 0);
    event.target.value = state.addedTimeFirst;
  }

  if (event.target.id === 'summary-added-second') {
    state.addedTimeSecond = Math.max(0, parseInt(event.target.value || '0', 10) || 0);
    event.target.value = state.addedTimeSecond;
  }

  saveState();
}

function bindUI() {
  document.getElementById('lang-it-btn').addEventListener('click', () => setLanguage('it'));
  document.getElementById('lang-en-btn').addEventListener('click', () => setLanguage('en'));

  document.getElementById('go-history-from-match-btn').addEventListener('click', goHistory);
  document.getElementById('end-game-btn').addEventListener('click', endGame);

  document.getElementById('summary-added-first').addEventListener('change', handleSummaryInput);
  document.getElementById('summary-added-second').addEventListener('change', handleSummaryInput);

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

  window.addEventListener('beforeunload', saveState);
}

function init() {
  state = loadActiveGame();
  if (!state) {
    alert(tr('alertNoGame'));
    window.location.href = 'referee_scorecard.html';
    return;
  }

  bindUI();
  applyLanguage();
}

init();
