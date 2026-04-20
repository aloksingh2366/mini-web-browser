import { escapeHtml, normalizeUrl, titleFromUrl } from './utils.js';

export class BrowserController {
  constructor({ tabs, history, bookmarks, adblock, elements }) {
    this.tabs = tabs;
    this.history = history;
    this.bookmarks = bookmarks;
    this.adblock = adblock;
    this.elements = elements;

    this.bindFrameEvents();
    this.renderAll();
    this.loadCurrentTab(false);
  }

  bindFrameEvents() {
    this.elements.webFrame.addEventListener('load', () => {
      this.hideLoading();
      this.hideError();

      try {
        this.adblock.installRequestInterception(this.elements.webFrame.contentWindow);
      } catch {
        // Cross-origin frame access is restricted by the browser.
      }

      this.updateControls();
      this.renderSuggestions();
    });

    this.elements.webFrame.addEventListener('error', () => {
      this.hideLoading();
      this.showError('Page failed to load.');
    });
  }

  activeTab() {
    return this.tabs.active();
  }

  navigate(inputUrl, { pushHistory = true } = {}) {
    const result = normalizeUrl(inputUrl);
    if (!result.valid) {
      this.showError(result.error);
      return;
    }

    const url = result.url;
    if (this.adblock.shouldBlock(url)) {
      this.showError('Blocked by AdBlock.');
      this.renderBlockedCount();
      return;
    }

    const tab = this.activeTab();
    this.tabs.updateUrl(tab.id, url, pushHistory);
    this.history.add(url);

    this.elements.addressBar.value = url;
    this.showLoading();
    this.hideError();
    this.elements.webFrame.src = url;

    this.renderAll();
  }

  loadCurrentTab(pushHistory = false) {
    const tab = this.activeTab();
    if (!tab) return;
    this.elements.addressBar.value = tab.currentUrl;
    this.navigate(tab.currentUrl, { pushHistory });
  }

  switchTab(tabId) {
    this.tabs.setActive(tabId);
    this.loadCurrentTab(false);
  }

  addTab() {
    this.tabs.add();
    this.loadCurrentTab(false);
  }

  closeTab(tabId) {
    this.tabs.remove(tabId);
    this.loadCurrentTab(false);
  }

  back() {
    const url = this.tabs.goBack(this.activeTab().id);
    if (url) this.navigate(url, { pushHistory: false });
  }

  forward() {
    const url = this.tabs.goForward(this.activeTab().id);
    if (url) this.navigate(url, { pushHistory: false });
  }

  reload() {
    this.showLoading();
    this.elements.webFrame.src = this.activeTab().currentUrl;
  }

  stop() {
    try {
      this.elements.webFrame.contentWindow?.stop();
    } catch {
      this.elements.webFrame.src = 'about:blank';
    }
    this.hideLoading();
  }

  toggleBookmark() {
    const url = this.activeTab().currentUrl;
    const exists = this.bookmarks.list().some(item => item.url === url);
    if (exists) {
      this.bookmarks.remove(url);
    } else {
      this.bookmarks.add(url);
    }
    this.renderBookmarks();
  }

  setSettings(nextSettings) {
    return this.adblock.updateSettings(nextSettings).then(() => {
      this.renderBlockedCount();
    });
  }

  showLoading() {
    this.elements.loadingIndicator.classList.remove('hidden');
  }

  hideLoading() {
    this.elements.loadingIndicator.classList.add('hidden');
  }

  showError(message) {
    this.elements.errorBanner.textContent = message;
    this.elements.errorBanner.classList.remove('hidden');
  }

  hideError() {
    this.elements.errorBanner.classList.add('hidden');
  }

  renderTabs() {
    const tabHtml = this.tabs.list().map(tab => {
      const active = tab.id === this.activeTab().id ? 'active' : '';
      const safeUrl = escapeHtml(tab.currentUrl);
      const safeTitle = escapeHtml(titleFromUrl(tab.currentUrl));
      const safeTabId = escapeHtml(tab.id);
      return `
        <button class="tab ${active}" data-tab-id="${safeTabId}" title="${safeUrl}">
          <span class="tab-title">${safeTitle}</span>
          <span class="tab-close" data-close-id="${safeTabId}">×</span>
        </button>`;
    }).join('');

    this.elements.tabsList.innerHTML = tabHtml;
  }

  renderBookmarks() {
    this.elements.bookmarksList.innerHTML = this.bookmarks.list().map(item => `
      <li class="panel-item">
        <a class="panel-link" href="#" data-bookmark-url="${escapeHtml(item.url)}" title="${escapeHtml(item.url)}">${escapeHtml(item.title)}</a>
        <button data-remove-bookmark="${escapeHtml(item.url)}" title="Remove">✕</button>
      </li>
    `).join('');
  }

  renderHistory() {
    this.elements.historyList.innerHTML = this.history.list().map(item => `
      <li class="panel-item">
        <a class="panel-link" href="#" data-history-url="${escapeHtml(item.url)}" title="${escapeHtml(item.url)}">${escapeHtml(titleFromUrl(item.url))}</a>
        <small>${new Date(item.visitedAt).toLocaleString()}</small>
      </li>
    `).join('');
  }

  renderSuggestions() {
    const links = [
      ...this.bookmarks.list().map(item => item.url),
      ...this.history.list().map(item => item.url)
    ];

    const unique = [...new Set(links)].slice(0, 20);
    this.elements.addressSuggestions.innerHTML = unique.map(url => `<option value="${escapeHtml(url)}"></option>`).join('');
  }

  renderBlockedCount() {
    this.elements.blockedCount.textContent = String(this.adblock.getBlockedCount());
  }

  updateControls() {
    const tab = this.activeTab();
    this.elements.backBtn.disabled = tab.historyIndex <= 0;
    this.elements.forwardBtn.disabled = tab.historyIndex >= tab.history.length - 1;
  }

  renderAll() {
    this.renderTabs();
    this.renderBookmarks();
    this.renderHistory();
    this.renderSuggestions();
    this.renderBlockedCount();
    this.updateControls();
  }
}
