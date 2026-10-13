const TEAMS_URL = 'data/teams.json';
const DEFAULT_HOME_COLOR = '#1a6b3a';
const DEFAULT_AWAY_COLOR = '#1565c0';
const COLOR_PRESETS = ['#1a6b3a', '#c62828', '#1565c0', '#f9a825', '#6a1b9a', '#ef6c00', '#212121', '#00838f', '#ad1457', '#8d6e63'];
const MIN_COLOR_DISTANCE = 30;
const CREST_SKIP_WORDS = ['a', 'ac', 'as', 'asd', 'calcio', 'club', 'da', 'de', 'dei', 'del', 'della', 'delle', 'dello', 'di', 'e', 'fc', 'football', 'il', 'la', 'le', 'lo', 'pol', 'ssd'];

let teamsPromise = null;

function loadTeams() {
  if (!teamsPromise) {
    teamsPromise = fetch(TEAMS_URL)
      .then(response => (response.ok ? response.json() : { teams: [] }))
      .then(data => (Array.isArray(data.teams) ? data.teams : []))
      .catch(() => []);
  }
  return teamsPromise;
}

function normalizeText(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isHexColor(value) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}

function hexToRgb(hex) {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToLab(rgb) {
  const linear = rgb.map(channel => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const x = (linear[0] * 0.4124 + linear[1] * 0.3576 + linear[2] * 0.1805) / 0.95047;
  const y = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  const z = (linear[0] * 0.0193 + linear[1] * 0.1192 + linear[2] * 0.9505) / 1.08883;
  const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

function colorDistance(hexA, hexB) {
  const a = rgbToLab(hexToRgb(hexA));
  const b = rgbToLab(hexToRgb(hexB));
  return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2));
}

function colorsTooSimilar(hexA, hexB) {
  return colorDistance(hexA, hexB) < MIN_COLOR_DISTANCE;
}

function pickDistinctColor(color, otherColor) {
  if (!colorsTooSimilar(color, otherColor)) return color;
  const candidates = COLOR_PRESETS.filter(preset => !colorsTooSimilar(preset, otherColor));
  candidates.sort((a, b) => colorDistance(a, color) - colorDistance(b, color));
  return candidates[0] || color;
}

function readableTextColor(hex) {
  const rgb = hexToRgb(hex);
  const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  return luminance > 0.6 ? '#1a1a1a' : '#ffffff';
}

function teamInitials(name) {
  const words = normalizeText(name).split(' ').filter(Boolean);
  const significant = words.filter(word => !CREST_SKIP_WORDS.includes(word));
  const pool = significant.length ? significant : words;
  if (!pool.length) return '?';
  if (pool.length === 1) return pool[0].slice(0, 2).toUpperCase();
  return (pool[0][0] + pool[1][0]).toUpperCase();
}

function crestHtml(name, color, logo, size) {
  const safeName = escapeHtml(name || '');
  const fill = isHexColor(color) ? color : DEFAULT_HOME_COLOR;
  if (logo) {
    return `<img class="crest" src="${escapeHtml(logo)}" alt="${safeName}" width="${size}" height="${size}" />`;
  }
  const text = readableTextColor(fill);
  const initials = escapeHtml(teamInitials(name));
  return `<svg class="crest" width="${size}" height="${size}" viewBox="0 0 40 40" role="img" aria-label="${safeName}">` +
    `<circle cx="20" cy="20" r="18.5" fill="${fill}" stroke="rgba(255,255,255,0.85)" stroke-width="2"/>` +
    `<text x="20" y="25.5" text-anchor="middle" font-size="16" font-weight="700" font-family="Helvetica Neue, Arial, sans-serif" fill="${text}">${initials}</text>` +
    '</svg>';
}

function competitionMatches(competition, category, level) {
  if (category && competition.category !== category) return false;
  if (category && hasLevel(category) && level && competition.level !== level) return false;
  return true;
}

function searchTeams(teams, query, category, level, limit) {
  const tokens = normalizeText(query).split(' ').filter(Boolean);
  const results = [];
  teams.forEach(team => {
    const competitions = team.competitions.filter(competition => competitionMatches(competition, category, level));
    if (!competitions.length) return;
    const haystack = normalizeText(team.name + ' ' + (Array.isArray(team.official) ? team.official.join(' ') : team.official));
    if (!tokens.every(token => haystack.includes(token))) return;
    const startsWith = tokens.length > 0 && normalizeText(team.name).startsWith(tokens[0]);
    results.push({ team, competitions, rank: startsWith ? 0 : 1 });
  });
  results.sort((a, b) => a.rank - b.rank || a.team.name.localeCompare(b.team.name, 'it'));
  return results.slice(0, limit);
}
