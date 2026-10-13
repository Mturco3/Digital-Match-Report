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
    totalSubsAway: 'Totale cambi ospiti',
    exportBtn: 'Esporta',
    exportTitle: 'Rapporto gara',
    exportScore: 'Risultato',
    exportEvents: 'Eventi',
    exportNoEvents: 'Nessun evento registrato',
    exportHalf1: '1° Tempo',
    exportHalf2: '2° Tempo',
    exportAddedTime: 'Recupero',
    exportSubs: 'Sostituzioni',
    exportMinute: 'Min',
    exportPrint: 'Stampa',
    exportClose: 'Chiudi',
    confirmDeleteEvent: 'Eliminare questo evento?',
    warnSecondYellowTitle: 'Seconda ammonizione',
    warnSecondYellow: "Il #{player} è già stato ammonito ({minute}'). Seconda ammonizione = espulsione.",
    warnConfirm: 'Conferma e registra il rosso',
    secondYellowBadge: '2° giallo',
    redSecondYellow: 'Rosso per doppia ammonizione'
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
    totalSubsAway: 'Total away subs',
    exportBtn: 'Export',
    exportTitle: 'Match Report',
    exportScore: 'Score',
    exportEvents: 'Events',
    exportNoEvents: 'No events recorded',
    exportHalf1: '1st Half',
    exportHalf2: '2nd Half',
    exportAddedTime: 'Added time',
    exportSubs: 'Substitutions',
    exportMinute: 'Min',
    exportPrint: 'Print',
    exportClose: 'Close',
    confirmDeleteEvent: 'Delete this event?',
    warnSecondYellowTitle: 'Second yellow card',
    warnSecondYellow: "Player #{player} already has a yellow card ({minute}'). A second yellow means a sending-off.",
    warnConfirm: 'Confirm and record the red card',
    secondYellowBadge: '2nd yellow',
    redSecondYellow: 'Red for second yellow'
  }
};

let currentLang = localStorage.getItem(LANG_KEY) || 'it';
let state = null;

function tr(key) {
  return TEXT[currentLang][key] || key;
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
  const referee = readPersonName(snapshot, 'referee');
  const supervisor = readPersonName(snapshot, 'supervisor');
  return {
    gameId: record.id,
    status: record.status || 'in-progress',
    createdAt: record.createdAt || Date.now(),
    updatedAt: record.updatedAt || Date.now(),
    referee: joinName(referee),
    supervisor: joinName(supervisor),
    refereeFirst: referee.first,
    refereeLast: referee.last,
    supervisorFirst: supervisor.first,
    supervisorLast: supervisor.last,
    category: snapshot.category || '—',
    level: snapshot.level || '—',
    home: snapshot.home || 'Home',
    away: snapshot.away || 'Away',
    homeColor: isHexColor(snapshot.homeColor) ? snapshot.homeColor : DEFAULT_HOME_COLOR,
    awayColor: isHexColor(snapshot.awayColor) ? snapshot.awayColor : DEFAULT_AWAY_COLOR,
    homeLogo: snapshot.homeLogo || null,
    awayLogo: snapshot.awayLogo || null,
    homeTeamId: snapshot.homeTeamId || null,
    awayTeamId: snapshot.awayTeamId || null,
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
      refereeFirst: state.refereeFirst,
      refereeLast: state.refereeLast,
      supervisorFirst: state.supervisorFirst,
      supervisorLast: state.supervisorLast,
      category: state.category,
      level: state.level,
      home: state.home,
      away: state.away,
      homeColor: state.homeColor,
      awayColor: state.awayColor,
      homeLogo: state.homeLogo,
      awayLogo: state.awayLogo,
      homeTeamId: state.homeTeamId,
      awayTeamId: state.awayTeamId,
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
  document.getElementById('export-btn').textContent = tr('exportBtn');
  document.getElementById('lang-it-btn').classList.toggle('active', currentLang === 'it');
  document.getElementById('lang-en-btn').classList.toggle('active', currentLang === 'en');
  document.getElementById('lang-it-btn').setAttribute('aria-pressed', String(currentLang === 'it'));
  document.getElementById('lang-en-btn').setAttribute('aria-pressed', String(currentLang === 'en'));

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

  const modal = document.getElementById('event-modal');
  if (modal && modal.classList.contains('open') && state) {
    document.getElementById('modal-title').textContent = `${tr('addEvent')} – ${state.currentTeam === 'home' ? state.home : state.away}`;
  }

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

  document.documentElement.style.setProperty('--home-color', state.homeColor);
  document.documentElement.style.setProperty('--away-color', state.awayColor);
  document.documentElement.style.setProperty('--home-ink', readableTextColor(state.homeColor));
  document.documentElement.style.setProperty('--away-ink', readableTextColor(state.awayColor));
  document.getElementById('crest-disp-home').innerHTML = crestHtml(state.home, state.homeColor, state.homeLogo, 34);
  document.getElementById('crest-disp-away').innerHTML = crestHtml(state.away, state.awayColor, state.awayLogo, 34);

  document.getElementById('score-home').textContent = state.scoreHome;
  document.getElementById('score-away').textContent = state.scoreAway;

  const parts = [];
  if (state.category && state.category !== '—') parts.push(categoryLabel(state.category, currentLang));
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

function eventOrderKey(event, index) {
  return event.half * 100000 + (Number(event.minute) || 0) * 100 + index;
}

function yellowEventsFor(team, player) {
  return state.events
    .map((event, index) => ({ event, index }))
    .filter(({ event }) => event.type === 'card' && event.cardType === 'yellow' && event.team === team && event.player === player)
    .sort((a, b) => eventOrderKey(a.event, a.index) - eventOrderKey(b.event, b.index))
    .map(({ event }) => event);
}

function secondYellowEvents() {
  const second = new Set();
  const seen = new Set();
  state.events
    .map((event, index) => ({ event, index }))
    .filter(({ event }) => event.type === 'card' && event.cardType === 'yellow')
    .sort((a, b) => eventOrderKey(a.event, a.index) - eventOrderKey(b.event, b.index))
    .forEach(({ event }) => {
      const key = event.team + ':' + event.player;
      if (seen.has(key)) second.add(event);
      seen.add(key);
    });
  return second;
}

function hasSecondYellow(team, player) {
  return yellowEventsFor(team, player).length >= 2;
}

function commitEvents(events, half) {
  state.half = half;
  events.forEach(event => state.events.push(normalizeEvent(event)));
  saveState();
  renderMatch();
  closeModal();
}

function openSecondYellowWarning(yellowEvent, previousYellow) {
  state.pendingYellow = yellowEvent;
  document.getElementById('warn-title').textContent = tr('warnSecondYellowTitle');
  document.getElementById('warn-text').textContent = tr('warnSecondYellow')
    .replace('{player}', yellowEvent.player)
    .replace('{minute}', previousYellow.minute);
  document.getElementById('warn-confirm-btn').textContent = tr('warnConfirm');
  document.getElementById('warn-cancel-btn').textContent = tr('cancel');
  document.getElementById('warn-modal').classList.add('open');
}

function closeSecondYellowWarning() {
  state.pendingYellow = null;
  document.getElementById('warn-modal').classList.remove('open');
}

function confirmSecondYellow() {
  const yellow = state.pendingYellow;
  closeSecondYellowWarning();
  if (!yellow) return;
  const red = { ...yellow, cardType: 'red', secondYellow: true };
  commitEvents([yellow, red], yellow.half);
}

function saveEvent() {
  const half = parseInt(document.getElementById('f-event-half').value, 10) || 1;
  const event = { team: state.currentTeam, type: state.currentType, half };

  if (event.type === 'card') {
    const playerRaw = parseInt(document.getElementById('f-card-player').value, 10);
    const minuteRaw = parseInt(document.getElementById('f-card-min').value, 10);
    if (isNaN(playerRaw) || playerRaw < 1 || playerRaw > 99 || isNaN(minuteRaw) || minuteRaw < 1 || minuteRaw > 120) return alert(tr('alertCard'));
    event.player = String(playerRaw);
    event.cardType = state.currentCardType;
    event.minute = minuteRaw;
    if (event.cardType === 'yellow') {
      const previous = yellowEventsFor(event.team, event.player)[0];
      if (previous) return openSecondYellowWarning(event, previous);
    }
  } else if (event.type === 'goal') {
    const minuteRaw = parseInt(document.getElementById('f-goal-min').value, 10);
    if (isNaN(minuteRaw) || minuteRaw < 1 || minuteRaw > 120) return alert(tr('alertGoal'));
    event.minute = minuteRaw;
    if (event.team === 'home') state.scoreHome += 1;
    else state.scoreAway += 1;
  } else if (event.type === 'sub') {
    const outRaw = parseInt(document.getElementById('f-sub-out').value, 10);
    const inRaw = parseInt(document.getElementById('f-sub-in').value, 10);
    const minuteRaw = parseInt(document.getElementById('f-sub-min').value, 10);
    if (isNaN(outRaw) || outRaw < 1 || outRaw > 99 || isNaN(inRaw) || inRaw < 1 || inRaw > 99 || isNaN(minuteRaw) || minuteRaw < 1 || minuteRaw > 120) return alert(tr('alertSub'));
    event.playerOut = String(outRaw);
    event.playerIn = String(inRaw);
    event.minute = minuteRaw;
  }

  commitEvents([event], half);
}

function createEventNode(event, originalIndex, secondYellows) {
  const node = document.createElement('div');
  node.className = 'event-item' + (event.team === 'away' ? ' away' : '');

  let iconClass = '';
  let iconText = '';
  let playerText = '';
  let detailText = '';
  let minuteText = '';
  let badgeText = '';

  if (event.type === 'card') {
    iconClass = event.cardType;
    iconText = event.cardType === 'yellow' ? 'Y' : 'R';
    playerText = '#' + event.player;
    detailText = event.cardType === 'yellow' ? tr('yellowCard') : tr('redCard');
    minuteText = `${event.minute}'`;
    if (event.cardType === 'yellow' && secondYellows.has(event)) {
      iconClass += ' second';
      badgeText = tr('secondYellowBadge');
    } else if (event.cardType === 'red' && event.secondYellow && hasSecondYellow(event.team, event.player)) {
      detailText = tr('redSecondYellow');
    }
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
      ${badgeText ? `<div class="event-badge">${badgeText}</div>` : ''}
    </div>
    ${minuteText ? `<div class="event-min">${minuteText}</div>` : ''}
    <button class="event-delete-btn" data-index="${originalIndex}" aria-label="Delete event">×</button>
  `;

  return node;
}

function renderEventsForList(listId, indexedEvents, secondYellows) {
  const list = document.getElementById(listId);
  list.innerHTML = '';

  const firstHalf = indexedEvents.filter(({ event }) => event.half === 1);
  const secondHalf = indexedEvents.filter(({ event }) => event.half === 2);

  firstHalf.forEach(({ event, index }) => list.appendChild(createEventNode(event, index, secondYellows)));

  if (firstHalf.length && secondHalf.length) {
    const divider = document.createElement('div');
    divider.className = 'half-divider';
    divider.textContent = tr('halfDividerSecond');
    list.appendChild(divider);
  }

  secondHalf.forEach(({ event, index }) => list.appendChild(createEventNode(event, index, secondYellows)));

  if (!firstHalf.length && !secondHalf.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = tr('noEvents');
    list.appendChild(empty);
  }
}

function renderAllEvents() {
  const indexed = state.events.map((event, index) => ({ event, index }));
  const secondYellows = secondYellowEvents();
  renderEventsForList('events-home', indexed.filter(({ event }) => event.team === 'home'), secondYellows);
  renderEventsForList('events-away', indexed.filter(({ event }) => event.team === 'away'), secondYellows);
}

function deleteEvent(index) {
  if (!confirm(tr('confirmDeleteEvent'))) return;
  const event = state.events[index];
  if (!event) return;
  if (event.type === 'goal') {
    if (event.team === 'home') state.scoreHome = Math.max(0, state.scoreHome - 1);
    else state.scoreAway = Math.max(0, state.scoreAway - 1);
  }
  state.events.splice(index, 1);
  saveState();
  renderMatch();
}

function exportMatch() {
  const date = new Date(state.updatedAt).toLocaleString(currentLang === 'it' ? 'it-IT' : 'en-GB');
  const subsHome = state.events.filter(e => e.type === 'sub' && e.team === 'home').length;
  const subsAway = state.events.filter(e => e.type === 'sub' && e.team === 'away').length;

  const secondYellows = secondYellowEvents();

  function eventRow(event) {
    let desc = '';
    if (event.type === 'card') {
      desc = `${event.cardType === 'yellow' ? tr('yellowCard') : tr('redCard')} — #${event.player}`;
      if (event.cardType === 'yellow' && secondYellows.has(event)) desc += ` (${tr('secondYellowBadge')})`;
      else if (event.cardType === 'red' && event.secondYellow && hasSecondYellow(event.team, event.player)) desc += ` (${tr('redSecondYellow')})`;
    } else if (event.type === 'goal') {
      desc = tr('goal');
    } else if (event.type === 'sub') {
      desc = `↑ #${event.playerIn} / ↓ #${event.playerOut}`;
    }
    return `<tr><td>${event.minute}'</td><td>${desc}</td></tr>`;
  }

  function halfRows(halfNum) {
    const events = state.events.filter(e => e.half === halfNum);
    if (!events.length) return `<tr><td colspan="2" style="color:#888;font-style:italic">${tr('exportNoEvents')}</td></tr>`;
    const homeRows = events.filter(e => e.team === 'home').map(eventRow).join('');
    const awayRows = events.filter(e => e.team === 'away').map(eventRow).join('');
    return `
      <tr class="team-header home"><td colspan="2">${escapeHtml(state.home)}</td></tr>${homeRows}
      <tr class="team-header away"><td colspan="2">${escapeHtml(state.away)}</td></tr>${awayRows}
    `;
  }

  const addedInfo = [
    state.addedTimeFirst ? `${tr('exportHalf1')}: +${state.addedTimeFirst}'` : '',
    state.addedTimeSecond ? `${tr('exportHalf2')}: +${state.addedTimeSecond}'` : ''
  ].filter(Boolean).join(' &nbsp;|&nbsp; ');

  const html = `<!DOCTYPE html><html lang="${currentLang}"><head><meta charset="UTF-8"/>
  <title>${tr('exportTitle')}</title>
  <style>
    body{font-family:'Helvetica Neue',sans-serif;color:#1a1a1a;max-width:600px;margin:40px auto;padding:0 20px}
    h1{font-size:22px;color:#0f4225;margin-bottom:4px}
    .meta{font-size:12px;color:#666;letter-spacing:1px;text-transform:uppercase;margin-bottom:20px}
    .score-box{background:#0f4225;color:#fff;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px}
    .score-teams{display:flex;justify-content:space-between;gap:12px;font-size:16px;font-weight:700;margin-bottom:8px}
    .score-team{display:flex;align-items:center;gap:8px}
    .crest{flex-shrink:0}
    .score-nums{font-size:40px;font-weight:700;letter-spacing:4px}
    h2{font-size:14px;text-transform:uppercase;letter-spacing:2px;color:#0f4225;margin:20px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px}
    table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px}
    td{padding:6px 8px;border-bottom:1px solid #eee}
    td:first-child{color:#888;font-style:italic;width:48px;white-space:nowrap}
    .team-header td{font-weight:700;color:#0f4225;background:#f0f7f3;font-size:12px;text-transform:uppercase;letter-spacing:1px}
    .team-header.home td{border-left:6px solid ${state.homeColor}}
    .team-header.away td{border-left:6px solid ${state.awayColor}}
    .added{font-size:12px;color:#666;margin-bottom:16px}
    .actions{margin-top:32px;display:flex;gap:12px}
    button{padding:10px 20px;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit}
    .btn-print{background:#0f4225;color:#fff}
    .btn-close{background:#eee;color:#333}
    @media print{.actions{display:none}}
  </style>
  </head><body>
  <h1>${tr('exportTitle')}</h1>
  <div class="meta">${date}${state.referee && state.referee !== '—' ? ' &nbsp;·&nbsp; ' + tr('refPrefix') + ': ' + escapeHtml(state.referee) : ''}${state.category && state.category !== '—' ? ' &nbsp;·&nbsp; ' + escapeHtml(categoryLabel(state.category, currentLang)) : ''}</div>
  <div class="score-box">
    <div class="score-teams"><span class="score-team">${crestHtml(state.home, state.homeColor, state.homeLogo, 28)}${escapeHtml(state.home)}</span><span class="score-team">${escapeHtml(state.away)}${crestHtml(state.away, state.awayColor, state.awayLogo, 28)}</span></div>
    <div class="score-nums">${state.scoreHome} – ${state.scoreAway}</div>
  </div>
  ${addedInfo ? `<div class="added">${tr('exportAddedTime')}: ${addedInfo}</div>` : ''}
  <h2>${tr('exportHalf1')}</h2>
  <table>${halfRows(1)}</table>
  <h2>${tr('exportHalf2')}</h2>
  <table>${halfRows(2)}</table>
  <h2>${tr('exportSubs')}</h2>
  <table>
    <tr><td>${escapeHtml(state.home)}</td><td>${subsHome}</td></tr>
    <tr><td>${escapeHtml(state.away)}</td><td>${subsAway}</td></tr>
  </table>
  <div class="actions">
    <button class="btn-print" onclick="window.print()">${tr('exportPrint')}</button>
    <button class="btn-close" onclick="window.close()">${tr('exportClose')}</button>
  </div>
  </body></html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

function goHistory() {
  saveState();
  window.location.href = 'index.html#history';
}

function endGame() {
  state.status = 'completed';
  saveState();
  window.location.href = 'index.html#history';
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
  document.getElementById('export-btn').addEventListener('click', exportMatch);

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
  document.getElementById('warn-confirm-btn').addEventListener('click', confirmSecondYellow);
  document.getElementById('warn-cancel-btn').addEventListener('click', closeSecondYellowWarning);
  document.getElementById('save-event-btn').addEventListener('click', saveEvent);

  document.getElementById('event-modal').addEventListener('click', function (event) {
    if (event.target === this) closeModal();
  });

  document.getElementById('match-screen').addEventListener('click', function (event) {
    const btn = event.target.closest('.event-delete-btn');
    if (btn) deleteEvent(parseInt(btn.dataset.index, 10));
  });

  window.addEventListener('beforeunload', saveState);
}

function init() {
  state = loadActiveGame();
  if (!state) {
    alert(tr('alertNoGame'));
    window.location.href = 'index.html';
    return;
  }

  bindUI();
  applyLanguage();
}

init();
