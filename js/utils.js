export const STORAGE_KEYS = {
  tabs: 'miniBrowser.tabs',
  activeTabId: 'miniBrowser.activeTabId',
  bookmarks: 'miniBrowser.bookmarks',
  settings: 'miniBrowser.settings',
  history: 'miniBrowser.history'
};

export const DEFAULT_HOME = 'https://example.com';

export function createId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeUrl(input) {
  const value = (input || '').trim();
  if (!value) {
    return { valid: false, error: 'Please enter a URL.' };
  }

  try {
    const withProtocol = /^(https?:)?\/\//i.test(value) ? value : `https://${value}`;
    const parsed = new URL(withProtocol);
    if (!/^https?:$/.test(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are supported.' };
    }
    return { valid: true, url: parsed.href };
  } catch {
    return { valid: false, error: 'Invalid URL format.' };
  }
}

export function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function loadFromStorage(key, fallback) {
  return safeJsonParse(localStorage.getItem(key), fallback);
}

export function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function titleFromUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return url;
  }
}
