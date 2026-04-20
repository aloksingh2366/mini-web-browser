# Mini Web Browser

A web-based mini browser built with vanilla HTML/CSS/JavaScript, including a lightweight AdBlock engine.

## Features

- Address bar with URL validation and suggestions
- Navigation controls: Back, Forward, Reload, Stop
- Multi-tab support with add/remove tabs
- Page rendering in an iframe
- Loading and error indicators
- AdBlock support with EasyList-style filters
- AdBlock toggle and custom filter rules
- Blocking of common tracker/analytics domains
- Bookmark management (add/remove)
- Browsing history panel
- Persistent settings with LocalStorage
- Responsive desktop/tablet UI

## Project Structure

```
mini-web-browser/
├── index.html
├── css/
│   ├── styles.css
│   └── responsive.css
├── js/
│   ├── main.js
│   ├── browser.js
│   ├── adblock.js
│   ├── tabs.js
│   ├── history.js
│   ├── bookmarks.js
│   └── utils.js
├── data/
│   └── adblock-filters.txt
└── README.md
```

## Run Locally

Use any static file server:

```bash
python -m http.server 8000
```

Then open: `http://localhost:8000`

## AdBlock Notes

- Default filters load from `data/adblock-filters.txt`
- Add custom filters in **Settings** (one rule per line)
- Supports common EasyList-style syntax:
  - `||domain.com^`
  - wildcard path rules like `*/ads/*`
  - exception rules like `@@||allowed.com^`

Because this app runs in a browser sandbox, network interception is best-effort and limited by same-origin restrictions for cross-origin iframe content.
