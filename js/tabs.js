import { createId, DEFAULT_HOME, loadFromStorage, saveToStorage, STORAGE_KEYS, titleFromUrl } from './utils.js';

export class TabsManager {
  constructor() {
    this.tabs = loadFromStorage(STORAGE_KEYS.tabs, []);
    this.activeTabId = localStorage.getItem(STORAGE_KEYS.activeTabId);

    if (!this.tabs.length) {
      const id = createId('tab');
      this.tabs.push({ id, title: 'Home', currentUrl: DEFAULT_HOME, history: [DEFAULT_HOME], historyIndex: 0 });
      this.activeTabId = id;
      this.persist();
    }

    if (!this.tabs.some(tab => tab.id === this.activeTabId)) {
      this.activeTabId = this.tabs[0]?.id;
    }
  }

  persist() {
    saveToStorage(STORAGE_KEYS.tabs, this.tabs);
    localStorage.setItem(STORAGE_KEYS.activeTabId, this.activeTabId || '');
  }

  list() {
    return this.tabs;
  }

  active() {
    return this.tabs.find(tab => tab.id === this.activeTabId) || this.tabs[0];
  }

  setActive(tabId) {
    if (this.tabs.some(tab => tab.id === tabId)) {
      this.activeTabId = tabId;
      this.persist();
    }
  }

  add(url = DEFAULT_HOME) {
    const id = createId('tab');
    const title = titleFromUrl(url);
    this.tabs.push({ id, title, currentUrl: url, history: [url], historyIndex: 0 });
    this.activeTabId = id;
    this.persist();
    return id;
  }

  remove(tabId) {
    if (this.tabs.length === 1) return;
    const index = this.tabs.findIndex(tab => tab.id === tabId);
    if (index === -1) return;

    this.tabs.splice(index, 1);

    if (this.activeTabId === tabId) {
      const fallbackTab = this.tabs[Math.max(0, index - 1)];
      this.activeTabId = fallbackTab?.id || null;
    }

    this.persist();
  }

  updateUrl(tabId, url, pushHistory = true) {
    const tab = this.tabs.find(item => item.id === tabId);
    if (!tab) return;

    tab.currentUrl = url;
    tab.title = titleFromUrl(url);

    if (pushHistory) {
      tab.history = tab.history.slice(0, tab.historyIndex + 1);
      tab.history.push(url);
      tab.historyIndex = tab.history.length - 1;
    }

    this.persist();
  }

  goBack(tabId) {
    const tab = this.tabs.find(item => item.id === tabId);
    if (!tab || tab.historyIndex <= 0) return null;
    tab.historyIndex -= 1;
    tab.currentUrl = tab.history[tab.historyIndex];
    this.persist();
    return tab.currentUrl;
  }

  goForward(tabId) {
    const tab = this.tabs.find(item => item.id === tabId);
    if (!tab || tab.historyIndex >= tab.history.length - 1) return null;
    tab.historyIndex += 1;
    tab.currentUrl = tab.history[tab.historyIndex];
    this.persist();
    return tab.currentUrl;
  }
}
