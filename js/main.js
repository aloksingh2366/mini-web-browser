import { AdBlockEngine } from './adblock.js';
import { BookmarksManager } from './bookmarks.js';
import { BrowserController } from './browser.js';
import { HistoryManager } from './history.js';
import { TabsManager } from './tabs.js';

const elements = {
  addressBar: document.getElementById('addressBar'),
  addressSuggestions: document.getElementById('addressSuggestions'),
  goBtn: document.getElementById('goBtn'),
  webFrame: document.getElementById('webFrame'),
  backBtn: document.getElementById('backBtn'),
  forwardBtn: document.getElementById('forwardBtn'),
  reloadBtn: document.getElementById('reloadBtn'),
  stopBtn: document.getElementById('stopBtn'),
  tabsList: document.getElementById('tabsList'),
  newTabBtn: document.getElementById('newTabBtn'),
  bookmarksPanel: document.getElementById('bookmarksPanel'),
  historyPanel: document.getElementById('historyPanel'),
  bookmarksList: document.getElementById('bookmarksList'),
  historyList: document.getElementById('historyList'),
  bookmarkPageBtn: document.getElementById('bookmarkPageBtn'),
  toggleBookmarksBtn: document.getElementById('toggleBookmarksBtn'),
  toggleHistoryBtn: document.getElementById('toggleHistoryBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  settingsDialog: document.getElementById('settingsDialog'),
  adblockToggle: document.getElementById('adblockToggle'),
  customFilters: document.getElementById('customFilters'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  blockedCount: document.getElementById('blockedCount'),
  loadingIndicator: document.getElementById('loadingIndicator'),
  errorBanner: document.getElementById('errorBanner')
};

async function bootstrap() {
  const tabs = new TabsManager();
  const history = new HistoryManager();
  const bookmarks = new BookmarksManager();
  const adblock = new AdBlockEngine();
  await adblock.initialize();

  const browser = new BrowserController({ tabs, history, bookmarks, adblock, elements });
  const adSettings = adblock.getSettings();

  elements.addressBar.setAttribute('list', 'addressSuggestions');
  elements.adblockToggle.checked = Boolean(adSettings.enabled);
  elements.customFilters.value = adSettings.customFilters || '';

  elements.goBtn.addEventListener('click', () => browser.navigate(elements.addressBar.value));
  elements.addressBar.addEventListener('keydown', event => {
    if (event.key === 'Enter') browser.navigate(elements.addressBar.value);
  });

  elements.backBtn.addEventListener('click', () => browser.back());
  elements.forwardBtn.addEventListener('click', () => browser.forward());
  elements.reloadBtn.addEventListener('click', () => browser.reload());
  elements.stopBtn.addEventListener('click', () => browser.stop());

  elements.newTabBtn.addEventListener('click', () => browser.addTab());

  elements.tabsList.addEventListener('click', event => {
    const closeId = event.target.dataset.closeId;
    if (closeId) {
      browser.closeTab(closeId);
      return;
    }

    const tabButton = event.target.closest('[data-tab-id]');
    if (tabButton) browser.switchTab(tabButton.dataset.tabId);
  });

  elements.bookmarkPageBtn.addEventListener('click', () => browser.toggleBookmark());

  elements.toggleBookmarksBtn.addEventListener('click', () => {
    elements.bookmarksPanel.classList.toggle('hidden');
  });

  elements.toggleHistoryBtn.addEventListener('click', () => {
    elements.historyPanel.classList.toggle('hidden');
  });

  elements.bookmarksList.addEventListener('click', event => {
    const target = event.target;

    if (target.dataset.removeBookmark) {
      bookmarks.remove(target.dataset.removeBookmark);
      browser.renderBookmarks();
      return;
    }

    if (target.dataset.bookmarkUrl) {
      event.preventDefault();
      browser.navigate(target.dataset.bookmarkUrl);
    }
  });

  elements.historyList.addEventListener('click', event => {
    const target = event.target;
    if (target.dataset.historyUrl) {
      event.preventDefault();
      browser.navigate(target.dataset.historyUrl);
    }
  });

  elements.settingsBtn.addEventListener('click', () => {
    elements.settingsDialog.showModal();
  });

  elements.saveSettingsBtn.addEventListener('click', async event => {
    event.preventDefault();
    await browser.setSettings({
      enabled: elements.adblockToggle.checked,
      customFilters: elements.customFilters.value
    });
    elements.settingsDialog.close();
  });
}

bootstrap();
