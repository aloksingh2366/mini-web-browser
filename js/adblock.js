import { loadFromStorage, saveToStorage, STORAGE_KEYS } from './utils.js';

const DEFAULT_SETTINGS = {
  enabled: true,
  customFilters: ''
};

const TRACKER_HOSTS = [
  'google-analytics.com',
  'googletagmanager.com',
  'doubleclick.net',
  'facebook.net',
  'adsystem.com',
  'hotjar.com'
];

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+*?.\-]/g, '\\$&');
}

function toRegexPattern(rule) {
  return new RegExp(
    escapeRegex(rule)
      .replace(/\\\*/g, '.*')
      .replace(/\\\^/g, '(?:[^\\w\\d_.%-]|$)')
      .replace(/^\\\|\\\|/, 'https?:\\/\\/(?:[^/]+\\.)?')
      .replace(/^\\\|/, '^')
      .replace(/\\\|$/, '$'),
    'i'
  );
}

function parseRule(line) {
  const raw = line.trim();
  if (!raw || raw.startsWith('!')) return null;

  const exception = raw.startsWith('@@');
  const rule = exception ? raw.slice(2) : raw;

  if (rule.startsWith('||')) {
    return { type: 'domain', exception, value: rule.slice(2).replace(/\^.*$/, '') };
  }

  if (rule.startsWith('/') && rule.endsWith('/') && rule.length > 2) {
    try {
      return { type: 'regex', exception, value: new RegExp(rule.slice(1, -1), 'i') };
    } catch {
      return null;
    }
  }

  return { type: 'pattern', exception, value: toRegexPattern(rule) };
}

function ruleMatches(rule, url) {
  if (rule.type === 'domain') {
    return url.hostname === rule.value || url.hostname.endsWith(`.${rule.value}`);
  }

  if (rule.type === 'regex') {
    return rule.value.test(url.href);
  }

  return rule.value.test(url.href);
}

export class AdBlockEngine {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS, ...loadFromStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS) };
    this.rules = [];
    this.blockedCount = 0;
  }

  async initialize() {
    const remoteFilters = await this.loadDefaultFilters();
    const custom = this.settings.customFilters.split('\n');
    this.rules = [...remoteFilters, ...custom]
      .map(parseRule)
      .filter(Boolean);
  }

  async loadDefaultFilters() {
    try {
      const response = await fetch('./data/adblock-filters.txt');
      if (!response.ok) return [];
      const text = await response.text();
      return text.split('\n');
    } catch {
      return [];
    }
  }

  isEnabled() {
    return Boolean(this.settings.enabled);
  }

  updateSettings(next) {
    this.settings = { ...this.settings, ...next };
    saveToStorage(STORAGE_KEYS.settings, this.settings);
    return this.initialize();
  }

  getSettings() {
    return { ...this.settings };
  }

  getBlockedCount() {
    return this.blockedCount;
  }

  shouldBlock(urlString) {
    if (!this.isEnabled()) return false;

    let url;
    try {
      url = new URL(urlString);
    } catch {
      return false;
    }

    if (TRACKER_HOSTS.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))) {
      this.blockedCount += 1;
      return true;
    }

    const exceptions = this.rules.filter(rule => rule.exception);
    if (exceptions.some(rule => ruleMatches(rule, url))) {
      return false;
    }

    const blockers = this.rules.filter(rule => !rule.exception);
    if (blockers.some(rule => ruleMatches(rule, url))) {
      this.blockedCount += 1;
      return true;
    }

    return false;
  }

  installRequestInterception(targetWindow) {
    if (!targetWindow || targetWindow.__miniBrowserAdBlockPatched) return;
    const engine = this;

    const originalFetch = targetWindow.fetch?.bind(targetWindow);
    if (originalFetch) {
      targetWindow.fetch = (input, init) => {
        const requestUrl = typeof input === 'string' ? input : input?.url;
        if (requestUrl && engine.shouldBlock(requestUrl)) {
          return Promise.reject(new Error('Blocked by AdBlock'));
        }
        return originalFetch(input, init);
      };
    }

    const XHR = targetWindow.XMLHttpRequest;
    if (XHR && XHR.prototype) {
      const originalOpen = XHR.prototype.open;
      XHR.prototype.open = function patchedOpen(method, url, ...rest) {
        if (url && engine.shouldBlock(url)) {
          throw new Error('Blocked by AdBlock');
        }
        return originalOpen.call(this, method, url, ...rest);
      };
    }

    targetWindow.__miniBrowserAdBlockPatched = true;
  }
}
