# WealthFM

A small set of carefully built financial tools, alongside an independent channel.
Fully client-side — no backend, no data capture, no accounts.

## Live URLs

- `/` — landing page
- `/mortgage` — MortgageDESK (residential & buy-to-let calculator)
- `/fire` — FIRE Desk (in build)
- `/trade` — Trade Desk (in build)

## Structure

```
src/
├── main.jsx              ← React Router setup
├── pages/                ← one file per route
│   ├── Landing.jsx
│   ├── Mortgage.jsx
│   ├── Fire.jsx          ← placeholder "coming soon"
│   ├── Trade.jsx         ← placeholder "coming soon"
│   └── NotFound.jsx
├── shared/               ← components used across pages
│   ├── Header.jsx        ← shared nav (also exports YT_URL)
│   ├── Footer.jsx        ← shared footer + legal disclaimer
│   └── ComingSoon.jsx    ← used by FIRE and Trade
└── styles/global.css
```

## Local development

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Adding the YouTube channel URL

Set the channel URL in one place — `src/shared/Header.jsx`:

```jsx
export const YT_URL = "https://youtube.com/@yourchannel";
```

Every YouTube button across the site reads from this constant.

## Launching a tool

When a tool is ready to go live (e.g. Mortgage Desk is already wired up),
edit `src/pages/Landing.jsx` and change that tool's `status` in the TOOLS
array from `"soon"` or `"build"` to `"live"`. The card on the landing page
becomes a real link, and the tool is reachable at its `/...` URL.

## Deploy

This is a static SPA. Vercel auto-detects the Vite framework.
Build command: `npm run build` · Output directory: `dist`
The included `vercel.json` ensures client-side routes work on refresh/direct-link.

## Disclaimer

MortgageDESK and all tools on this site are information and calculation tools only.
They do not provide financial, mortgage, tax or legal advice. Always consult an
FCA-authorised adviser before making financial decisions.
