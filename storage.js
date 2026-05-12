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
