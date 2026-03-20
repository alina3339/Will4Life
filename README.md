# Estate Planner — Web Version

UK estate planning suite that runs entirely in your browser. No server needed.
Host on GitHub Pages, Netlify, or any static file host.

## Quick Start (Local)

Open `index.html` in your browser. That's it — no build step, no server, no dependencies.

Or use any local server:
```bash
# Python
python3 -m http.server 8000

# Node
npx serve .

# PHP
php -S localhost:8000
```

Then open http://localhost:8000

## Deploy to GitHub Pages

1. Create a new GitHub repository
2. Push these files to the `main` branch:
   ```
   git init
   git add .
   git commit -m "Estate Planner web app"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/estate-planner.git
   git push -u origin main
   ```
3. Go to your repo **Settings > Pages**
4. Under "Source", select **Deploy from a branch**
5. Choose **main** branch, **/ (root)** folder
6. Click **Save**
7. Your app will be live at `https://YOUR-USERNAME.github.io/estate-planner/`

## Files

```
index.html    — App shell, error catcher, script loader
styles.css    — All CSS (no external dependencies)
storage.js    — Browser storage API (IndexedDB)
app.js        — Full application logic
```

Total size: ~70KB. Zero external dependencies. Works offline after first load.

## How Storage Works

All data is stored in your browser's IndexedDB:
- **Customers** — each customer record with their complete estate plan
- **Brand settings** — your company branding
- **Audit log** — every action logged with timestamp

Data never leaves your browser. There is no server, no database, no cloud.

**Important:** Clearing browser data will delete all stored information.
Use the GDPR Export feature to back up customer data regularly.

## Differences from Desktop Version

| Feature | Desktop (Electron) | Web (Browser) |
|---------|-------------------|---------------|
| Storage | Encrypted files on disk | IndexedDB (browser) |
| Email | .eml draft files | mailto: links |
| Backups | Automatic file backups | Manual export |
| Encryption | AES-256-GCM at rest | Browser-managed |
| GDPR Export | Save dialog | Download file |
| GDPR Delete | Secure overwrite | IndexedDB delete |
| Audit Log | Persistent file | IndexedDB (session) |
| Offline | Always | After first load |

## Features

- **Branding** — logo upload, company details, 6 colour themes
- **Will Writing** — 13 sections covering personal details, mirror wills,
  family, executors & trustees, guardians, specific legacies, property trusts,
  residuary estate, business interests, funeral wishes, admin provisions,
  execution witnesses, and additional wishes
- **Power of Attorney** — Health & Welfare LPA, Property & Financial LPA
- **Trust & Probate** — trust setup, trustees, assets, probate guidance
- **Estate Planning** — asset inventory, liabilities, net estate, distribution
- **Inheritance Tax** — valuation, allowances, estimated IHT, planning tips
- **Review & Approve** — draft preview, email, approval workflow, final sign-off
- **Customer Management** — multi-customer with search
- **GDPR Compliance** — consent capture, data export, right to erasure, audit log

## Browser Support

Any modern browser: Chrome, Firefox, Edge, Safari (2020+).
Requires IndexedDB support (all modern browsers).
