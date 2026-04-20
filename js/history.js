import { loadFromStorage, saveToStorage, STORAGE_KEYS } from './utils.js';

export class HistoryManager {
  constructor(limit = 200) {
    this.limit = limit;
    this.items = loadFromStorage(STORAGE_KEYS.history, []);
  }

  add(url) {
    const now = new Date().toISOString();
    this.items.unshift({ url, visitedAt: now });
    this.items = this.items.slice(0, this.limit);
    saveToStorage(STORAGE_KEYS.history, this.items);
  }

  list() {
    return this.items;
  }
}
