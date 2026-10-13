# Team data (data/teams.json)

`data/teams.json` is the team list behind the searchable team field on the setup page.
It is generated from the official group compositions published by LND Lazio
(season 2026/2027). The site never fetches anything from the web at run time; the
file is a static asset cached by the service worker.

## What is covered

| Competition | Source |
|---|---|
| Prima Categoria (8 groups, Lazio) | CRL C.U. 33 of 04/09/2026 |
| Seconda Categoria (10 groups, Lazio) | CRL C.U. 33, groups A, B, C, E, I, L replaced by C.U. 45 of 15/09/2026 |
| Juniores Regionali Elite (Under 19 Regionale A, 2 groups) | CRL C.U. 19 of 27/08/2026 |
| Juniores Regionali (Under 19 Regionale B, 6 groups) | CRL C.U. 33, groups D and E replaced by C.U. 45 |
| Juniores Provinciali (Under 19 Provinciale Roma, 3 groups) | Delegazione di Roma C.U. 4 of 01/10/2026 |
| Terza Categoria (Roma, 3 groups) | Delegazione di Roma C.U. 4 |

Not covered: Under 14-18, other provincial delegations (Latina, Frosinone, Rieti,
Viterbo) for Juniores Provinciali and Terza Categoria, women's and five-a-side
championships, clubs that withdrew after the lists were published (the list shows
the compositions as published).

## Fields

- `id`: slug of the cleaned name, also the name of an optional logo file
- `name`: cleaned display name; `official`: spelling in the communiqué
- `competitions`: list of `{category, level, group}`. `category` and `level` use the
  same values as the setup form (`Juniores` + `Provinciali` / `Regionali` /
  `Regionali Elite`; Prima, Seconda and Terza Categoria have no level)
- `city`: not available in the communiqués, always `null`
- `logo`: path under `assets/logos/` or `null`
- `color`, `colorSource`: a generated default colour (not the real kit colour); the
  user can change it on the setup page

## How to update

1. Download the communiqués from https://lazio.lnd.it/comunicati/ (the PDFs live
   under `comunicatilazio.it/storage/comunicati/<season>/...`).
2. Put the regional PDFs in one folder (`reg_19.pdf`, `reg_33.pdf`, `reg_45.pdf`)
   and the Roma one as `cu_4.pdf` in another. Adjust the page ranges and file names
   in `extract_groups.py` if the numbers differ in a new season.
3. `pip install pdfplumber`, then:

```
python extract_groups.py <reg_dir> <rome_dir> raw_groups.json
python build_teams_json.py raw_groups.json ../../data/teams.json ../../assets/logos
```

4. Check the printed group sizes (Prima 16 teams per group, Terza and Provinciali
   15-16) and open the setup page to see the result.
5. Bump `CACHE_NAME` in `sw.js` so installed copies pick up the new file.

## Logos

Logos are optional. Drop a file named `<id>.png` (or `.webp` / `.svg`, about
128x128) into `assets/logos/` and rerun `build_teams_json.py` with the logos folder
as third argument. Teams without a logo get a generated crest (initials on the
team colour). No logo files are shipped at the moment.
