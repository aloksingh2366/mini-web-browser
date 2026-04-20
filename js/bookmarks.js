import { loadFromStorage, saveToStorage, STORAGE_KEYS, titleFromUrl } from './utils.js';

export class BookmarksManager {
  constructor() {
    this.items = loadFromStorage(STORAGE_KEYS.bookmarks, []);
  }

  add(url) {
    if (this.items.some(item => item.url === url)) return;
    this.items.unshift({ title: titleFromUrl(url), url });
    saveToStorage(STORAGE_KEYS.bookmarks, this.items);
  }

  remove(url) {
    this.items = this.items.filter(item => item.url !== url);
    saveToStorage(STORAGE_KEYS.bookmarks, this.items);
  }

  list() {
    return this.items;
  }
}
