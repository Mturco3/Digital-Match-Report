const STORAGE_VERSION = 1;
const STORAGE_INDEX_KEY = 'refcard_games_index';
const STORAGE_GAME_PREFIX = 'refcard_game_';
const STORAGE_ACTIVE_GAME_KEY = 'refcard_active_game';
const LANG_KEY = 'refcard_lang';

function safeParse(jsonText, fallback) {
  try {
    return JSON.parse(jsonText);
  } catch {
    return fallback;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

const CATEGORY_OPTIONS = ['Juniores', 'Under 18', 'Under 17', 'Under 16', 'Under 15', 'Under 14', 'Prima Categoria', 'Seconda Categoria', 'Terza Categoria'];
const CATEGORIES_WITHOUT_LEVEL = ['Prima Categoria', 'Seconda Categoria', 'Terza Categoria'];
const CATEGORY_LABELS = {
  en: {
    'Prima Categoria': 'First Category',
    'Seconda Categoria': 'Second Category',
    'Terza Categoria': 'Third Category'
  }
};

function categoryLabel(category, lang) {
  const labels = CATEGORY_LABELS[lang] || {};
  return labels[category] || category;
}

function hasLevel(category) {
  return !CATEGORIES_WITHOUT_LEVEL.includes(category);
}

function splitFullName(fullName) {
  const text = String(fullName || '').trim();
  if (!text || text === '—') return { first: '', last: '' };
  const space = text.indexOf(' ');
  if (space === -1) return { first: '', last: text };
  return { first: text.slice(0, space), last: text.slice(space + 1).trim() };
}

function joinName(name) {
  return [name.first, name.last].filter(Boolean).join(' ') || '—';
}

function readPersonName(snapshot, key) {
  const first = snapshot[key + 'First'];
  const last = snapshot[key + 'Last'];
  if (typeof first === 'string' || typeof last === 'string') {
    return { first: first || '', last: last || '' };
  }
  return splitFullName(snapshot[key]);
}
