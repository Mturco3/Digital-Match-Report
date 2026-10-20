const teamPickers = {};
const PICKER_RESULT_LIMIT = 40;

function createTeamPicker(side, otherSide, defaultColor) {
  const input = document.getElementById('inp-' + side);
  const list = document.getElementById('list-' + side);
  const crestSlot = document.getElementById('crest-' + side);
  const swatches = document.getElementById('swatches-' + side);
  const colorInput = document.getElementById('color-' + side);
  const warning = document.getElementById('warn-' + side);
  const picker = {
    teams: [],
    teamId: null,
    logo: null,
    color: defaultColor,
    results: [],
    activeIndex: -1
  };
  let closeTimer = null;

  function currentScope() {
    return {
      category: document.getElementById('inp-category').value,
      level: document.getElementById('inp-level').value,
      group: document.getElementById('inp-group').value
    };
  }

  function competitionLabel(competition, showCategory) {
    const parts = [];
    if (showCategory) {
      parts.push(categoryLabel(competition.category, currentLang));
      if (competition.level) parts.push(competition.level);
    }
    parts.push(tr('group') + ' ' + competition.group);
    return parts.join(' · ');
  }

  function renderCrest() {
    crestSlot.innerHTML = crestHtml(input.value, picker.color, picker.logo, 32);
  }

  function renderSwatches() {
    swatches.innerHTML = COLOR_PRESETS.map(preset => {
      const checked = preset.toLowerCase() === picker.color.toLowerCase();
      return `<button type="button" class="swatch${checked ? ' selected' : ''}" role="radio" aria-checked="${checked}" aria-label="${preset}" data-color="${preset}" style="--swatch:${preset}"></button>`;
    }).join('');
    colorInput.value = picker.color;
  }

  function renderWarning() {
    const other = teamPickers[otherSide];
    const similar = other && colorsTooSimilar(picker.color, other.color);
    warning.textContent = similar ? tr('colorTooSimilar') : '';
    warning.hidden = !similar;
    warning.classList.toggle('is-warning', Boolean(similar));
  }

  function renderAll() {
    renderCrest();
    renderSwatches();
    renderWarning();
  }

  function closeList() {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    picker.activeIndex = -1;
  }

  function setActive(index) {
    picker.activeIndex = index;
    list.querySelectorAll('[role="option"]').forEach((node, i) => {
      node.setAttribute('aria-selected', String(i === index));
      node.classList.toggle('active', i === index);
    });
    if (index >= 0) {
      input.setAttribute('aria-activedescendant', 'opt-' + side + '-' + index);
      const node = document.getElementById('opt-' + side + '-' + index);
      if (node) node.scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  function renderList() {
    if (!picker.teams.length) {
      closeList();
      return;
    }
    const scope = currentScope();
    const query = input.value.trim();
    picker.results = searchTeams(picker.teams, query, scope.category, scope.level, scope.group, PICKER_RESULT_LIMIT);
    if (!picker.results.length) {
      list.innerHTML = query ? `<li class="combo-empty" role="presentation">${escapeHtml(tr('noTeamFound'))}</li>` : '';
    } else {
      list.innerHTML = picker.results.map(({ team, competitions }, index) => {
        const meta = competitionLabel(competitions[0], !scope.category);
        return `<li id="opt-${side}-${index}" class="combo-option" role="option" aria-selected="false" data-index="${index}">` +
          crestHtml(team.name, team.color, team.logo, 24) +
          `<span class="combo-name">${escapeHtml(team.name)}</span>` +
          `<span class="combo-meta">${escapeHtml(meta)}</span></li>`;
      }).join('');
    }
    list.hidden = !picker.results.length && !query;
    input.setAttribute('aria-expanded', String(!list.hidden));
    picker.activeIndex = -1;
  }

  function setColor(color) {
    picker.color = color;
    renderAll();
    const other = teamPickers[otherSide];
    if (other) other.refreshWarning();
  }

  function selectTeam(team) {
    input.value = team.name;
    picker.teamId = team.id;
    picker.logo = team.logo || null;
    closeList();
    setColor(isHexColor(team.color) ? team.color : picker.color);
  }

  input.addEventListener('input', () => {
    picker.teamId = null;
    picker.logo = null;
    renderCrest();
    renderList();
  });

  input.addEventListener('focus', () => {
    clearTimeout(closeTimer);
    renderList();
  });

  input.addEventListener('blur', () => {
    closeTimer = setTimeout(closeList, 150);
  });

  input.addEventListener('keydown', event => {
    const count = picker.results.length;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (list.hidden) renderList();
      if (count) setActive((picker.activeIndex + 1) % count);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (count) setActive(picker.activeIndex <= 0 ? count - 1 : picker.activeIndex - 1);
    } else if (event.key === 'Enter' && !list.hidden && picker.activeIndex >= 0) {
      event.preventDefault();
      selectTeam(picker.results[picker.activeIndex].team);
    } else if (event.key === 'Escape') {
      closeList();
    }
  });

  list.addEventListener('mousedown', event => {
    event.preventDefault();
  });

  list.addEventListener('click', event => {
    const option = event.target.closest('[role="option"]');
    if (!option) return;
    const entry = picker.results[Number(option.dataset.index)];
    if (entry) selectTeam(entry.team);
  });

  swatches.addEventListener('click', event => {
    const swatch = event.target.closest('.swatch');
    if (swatch) setColor(swatch.dataset.color);
  });

  colorInput.addEventListener('input', () => {
    setColor(colorInput.value);
  });

  picker.refresh = function refresh() {
    if (document.activeElement === input) renderList();
  };
  picker.refreshWarning = renderWarning;
  picker.applyLanguage = function applyPickerLanguage() {
    colorInput.setAttribute('aria-label', tr('lblColor'));
    document.getElementById('color-label-' + side).textContent = tr('lblColor');
    input.placeholder = tr('placeholderTeam');
    renderAll();
    picker.refresh();
  };
  picker.setTeams = function setTeams(teams) {
    picker.teams = teams;
  };
  picker.getValue = function getValue() {
    return {
      name: input.value.trim(),
      teamId: picker.teamId,
      logo: picker.logo,
      color: picker.color
    };
  };

  teamPickers[side] = picker;
  renderAll();
  return picker;
}

function initTeamPickers() {
  createTeamPicker('home', 'away', DEFAULT_HOME_COLOR);
  createTeamPicker('away', 'home', DEFAULT_AWAY_COLOR);
  loadTeams().then(teams => {
    teamPickers.home.setTeams(teams);
    teamPickers.away.setTeams(teams);
  });
}

function refreshTeamPickers() {
  Object.values(teamPickers).forEach(picker => picker.refresh());
}

function applyTeamPickerLanguage() {
  Object.values(teamPickers).forEach(picker => picker.applyLanguage());
}
