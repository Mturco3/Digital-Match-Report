# Digital Match Report

A mobile-first web app for football referees. Log goals, cards and substitutions as the match unfolds, then print a clean match summary. Install it on your phone, use it at the pitch, no account needed.

**Live app:** https://mturco3.github.io/Digital-Match-Report/

## How it works

**1. Set up the match.** Enter referee, supervisor, home and away team, category (Juniores, Under 14 to Under 18) and level (Provinciali, Regionali, Regionali Elite), then tap Start.

**2. Follow the match.** The live screen shows the score and one event column per team. Tap the **+** button of a team to add an event:

| Event | What you enter |
|---|---|
| Goal | Minute |
| Yellow or red card | Shirt number, minute |
| Substitution | Shirt number out, shirt number in, minute |

Every event is tagged to the first or second half. The score updates from the goals you log, and a wrong entry can be deleted. Added time for each half and the number of substitutions per team are tracked on the same screen.

**3. Print the report.** Tap **Export** to open a match report with the final score, the events by half and team, added time and substitutions. Print it or save it as a PDF from the browser.

**4. Come back to it later.** Every match is saved on your device. Reopen, review or delete past matches from **Past games**, and end a match to mark it as completed.

**Also included**
- Italian and English interface, switchable at any time.
- Works offline: the app stores its own files on first load, so it keeps running without a connection.
- Installable: add it to your home screen and it opens like a native app.
- Private by design: matches never leave your device. No account, server or tracking.

## How it is built

A static web app with no framework, no build step and no dependencies.

- **Vanilla HTML, CSS and JavaScript** for the interface, with a shared translation table for Italian and English.
- **`localStorage`** keeps each match as a versioned JSON record, so the data format can evolve.
- **A service worker** caches the app files, and a **web app manifest** makes it installable as a PWA.
- **GitHub Pages**, deployed by a GitHub Actions workflow on every push to `main`.
- User-entered text is HTML-escaped before it is shown in the history list or the printed report.

```
referee_scorecard.html / .js   home, match setup and history
game.html / game.js            live match screen, event form, printable report
storage.js                     shared storage helpers
sw.js, manifest.json           offline cache and install support
icons/, tools/                 app icons and the page that generates them
.github/workflows/static.yml   deployment to GitHub Pages
```

To run it locally, serve the folder over HTTP:

```bash
git clone https://github.com/Mturco3/Digital-Match-Report.git
cd Digital-Match-Report
python -m http.server 8000
# open http://localhost:8000
```

## Author

Michele Turco
