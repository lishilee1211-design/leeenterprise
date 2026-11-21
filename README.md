# M/s Lee Enterprise — website, client portal & office app

Live site: https://lishilee1211-design.github.io/leeenterprise/

| Page | What it is |
|---|---|
| `index.html` | Company website (Lee Enterprise + T.N Consultant work) |
| `work.html` | Client portal (project code) and owner project updates |
| `expenses.html` | Staff expense tally (Lee / T.N) and owner approval |
| `manager.html` | AI Manager (needs `ANTHROPIC_API_KEY` in the Apps Script) |
| `card.html` | Visiting card with QR code |

- `config.js` holds the Google Apps Script backend link.
- `apps-script/Code.gs` is the backend code (Google Sheet "Lee Enterprise Office").
- `android/` is the Android app. Every push builds a new APK: **Actions → Build APK → Artifacts → LeeEnterprise-apk**.
