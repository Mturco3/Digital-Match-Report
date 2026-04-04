# Digital Referee Card

A mobile-first, offline-capable digital scorecard for football referees. Track scores, log match events, and generate a match report — all from your browser, no installation required.

**Live platform:** https://mturco3.github.io/Digital-Match-Report/

---

## Features

- **Match setup** — enter referee, supervisor, team names, category, and level before kick-off
- **Live scoreboard** — increment/decrement goals for home and away teams in real time
- **Match events** — log yellow cards, red cards, and other incidents with timestamps
- **Match timer** — built-in match clock
- **End-of-game summary** — review and export a full match report at the final whistle
- **Match history** — saved games stored locally in the browser (no account needed)
- **Bilingual UI** — switch between Italian and English at any time
- **Offline support** — works without an internet connection once loaded

## How to Use

1. Open the app at https://mturco3.github.io/Digital-Match-Report/
2. Tap **New Game** and fill in the match details
3. Use the in-game controls to track score and events during the match
4. Tap **End Game** when the match is over to view and save the summary
5. Access previous matches from **Saved Games** on the home screen

## Tech Stack

- Vanilla HTML, CSS, and JavaScript — no frameworks or build tools
- `localStorage` for persistent match history
- Deployed via GitHub Pages

## Local Development

Clone the repo and open `referee_scorecard.html` directly in a browser — no server required.

```bash
git clone https://github.com/Mturco3/Digital-Match-Report.git
cd Digital-Match-Report
# open referee_scorecard.html in your browser
```
