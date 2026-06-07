# Fay Nutrition Resource Library

A POC built for the Fay BizOps case study (Part 1). Dietitians can browse and submit nutrition resources. The key requirement is a live dynamic connection: form submission → card appears in the library.

**Live URL:** https://fay-resource-library.vercel.app
**GitHub:** https://github.com/soniakumar201/fay-resource-library

---

## Running Locally

```bash
bash /Users/soniakumar/fay-resource-library/run_local.sh
```

Then open **http://localhost:8080** in Safari.

> Do NOT open `index.html` directly as a file — this causes CORS errors with the Google Sheets fetch.

---

## File Structure

| File | Purpose |
|---|---|
| `index.html` | Patient-facing library page — card grid, filters, modal |
| `submit.html` | RD submission form — all fields, validation |
| `style.css` | All shared styles. Edit CSS variables at the top to change colors/fonts globally |
| `app.js` | Library logic — fetches TSV from Google Sheets, renders cards, handles filters |
| `submit.js` | Form logic — validates fields, POSTs to Google Form URL |
| `run_local.sh` | Starts a local Python server for development |
| `Code.gs` | Google Apps Script (reference only — not used in production) |

---

## Architecture

**Reading (library → data):**
`app.js` fetches the Google Sheet as a published TSV → parses rows → renders cards sorted newest first.

**Writing (form → data):**
`submit.html` validates fields, then builds a hidden HTML form and POSTs directly to the Google Form URL → Google writes the row to the "Form Responses 1" tab automatically → library reads it on next load.

**No server, no backend code in production.** Everything runs on Google's infrastructure.

```
User submits form
    → POST to Google Form URL (submit.js)
    → Google writes row to "Form Responses 1" sheet tab
    → User navigates back to library
    → app.js fetches published TSV from that tab
    → New card renders at top
```

---

## How to Edit Common Things

### Add or remove conditions
In `app.js` AND `submit.js`, edit the `CONDITIONS` array near the top of each file:
```js
const CONDITIONS = [
  'Celiac Disease', 'Diabetes', ...
];
```

### Add or remove resource types
Same pattern — edit the `RESOURCE_TYPES` array in both `app.js` and `submit.js`.

### Change colors
Edit the CSS variables at the top of `style.css` — one change updates the whole site:
```css
:root {
  --purple:       #6B4EFF;
  --purple-light: #EDE9FF;
  --bg:           #FAFAFA;
  ...
}
```

### Change the Google Sheet being read
In `app.js`, update `SHEET_CSV_URL`. The `gid=` parameter controls which tab is read.

### Change where form submissions go
In `submit.js`, update `GOOGLE_FORM_URL` and the `FIELD_IDS` map if form fields change.

---

## Decision Log

| Decision | Choice | Reason |
|---|---|---|
| Hosting | GitHub + Vercel | Free, public URL, auto-deploys on every GitHub push |
| Writing data | Google Form POST | No CORS issues — POSTs go directly to Google's servers, no custom backend needed |
| Reading data | Google Sheets published TSV | Public URL, no auth, no CORS issues. TSV chosen over CSV because CSV parsing breaks on empty fields (blank thumbnail shifts all subsequent columns) |
| Sheet tab | "Form Responses 1" (gid=1828099228) | Google Form writes to its own tab, not Sheet1. Library reads from there so submissions and seed data are unified |
| Tech stack | Plain HTML + CSS + vanilla JS | No build tools, no framework — easy to edit and iterate without software dev setup |
| Style | Purple/lavender palette, Inter font, 3-col grid | Matches Fay brand; confirmed purple palette from live site |
| Card click behavior | Modal popup ("this is a placeholder link") | Per original mockup UX note — no direct link navigation in POC |
| Local dev | `python3 -m http.server 8080` | `file://` URLs cause CORS errors; local server fixes this |
| Apps Script (abandoned) | Replaced by Google Form + TSV | Apps Script had unresolvable CORS errors in Safari on both localhost and Vercel |

---

## Known Limitations / Future Improvements

- **After form submit:** Google shows a brief confirmation page before user navigates back manually. A real product would redirect automatically.
- **No auth:** Anyone with the Google Form URL can submit. Production would add NPI validation against a provider database.
- **TSV URL is public:** Anyone can read all submission data. Fine for POC, not for production with real patient/provider data.
- **Conditions list is hardcoded:** Both `app.js` and `submit.js` need to be updated in sync. A shared config file would be cleaner.
- **File uploads:** The form accepts a file field but only stores a URL — actual file hosting not implemented in POC.
- **Google Sheets caching:** Published TSV can cache for a few minutes. New submissions may not appear instantly on library reload.
