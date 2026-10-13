"""Parse the official LND Lazio group compositions (season 2026/27) into raw group lists.

Input: the Comunicati Ufficiali PDFs downloaded from comunicatilazio.it, named
reg_19.pdf, reg_33.pdf, reg_45.pdf (CRL, regional) in <reg_dir> and cu_4.pdf
(Delegazione di Roma) in <rome_dir>. Needs pdfplumber.

Usage: python extract_groups.py <reg_dir> <rome_dir> <out raw_groups.json>
"""
import json
import re
import sys
from pathlib import Path

import pdfplumber

REG = Path(sys.argv[1])
ROME = Path(sys.argv[2])
OUT = Path(sys.argv[3])

SECTIONS = [
    (re.compile(r'CAMPIONATO\s+(DI\s+)?PRIMA\s+CATEGORIA', re.I), ('Prima Categoria', None)),
    (re.compile(r'CAMPIONATO\s+(DI\s+)?SECONDA\s+CATEGORIA', re.I), ('Seconda Categoria', None)),
    (re.compile(r'CAMPIONATO\s+(DI\s+)?TERZA\s+CATEGORIA', re.I), ('Terza Categoria', None)),
    (re.compile(r'JUNIORES\s+UNDER\s+19\s+REGIONALE\s+\W?B\W?', re.I), ('Juniores', 'Regionali')),
    (re.compile(r'REGIONALE\s+JUNIORES\s+UNDER\s+19\s+\W?A\W?', re.I), ('Juniores', 'Regionali Elite')),
    (re.compile(r'UNDER\s+19\s+PROV', re.I), ('Juniores', 'Provinciali'))
]
STOP = re.compile(r'^(\d+\.\s|Si allega|Pubblicato|ALLEGATI|IL\s+(SEGRETARIO|DELEGATO|PRESIDENTE)|AVVISO)', re.I)
NOISE = re.compile(r'^(CRL|DPLND|COMPOSIZIONE|Per esigenze|A seguito|composizione|di seguito|COMUNICATO)', re.I)
GROUP = re.compile(r'GIRONE\W*([A-Z])\b')


def lines_of(page, mid):
    words = page.extract_words(keep_blank_chars=False, use_text_flow=False)
    rows = {}
    for word in words:
        col = 0 if word['x0'] < mid else 1
        key = (col, round(word['top'] / 3))
        rows.setdefault(key, []).append(word)
    out = []
    for (col, ykey), ws in rows.items():
        ws.sort(key=lambda w: w['x0'])
        text = ' '.join(w['text'] for w in ws)
        out.append({'col': col, 'top': min(w['top'] for w in ws), 'text': re.sub(r'\s+', ' ', text).strip()})
    return out


def parse_pdf(path, pages, numbered, section_default=None):
    """Return list of (category, level, group, [names])."""
    result = []
    current_section = section_default
    with pdfplumber.open(str(path)) as pdf:
        for page_no in pages:
            page = pdf.pages[page_no]
            mid = page.width / 2
            lines = lines_of(page, mid)
            # headings across the full width
            headings = []
            breaks = []
            full_rows = {}
            for word in page.extract_words():
                full_rows.setdefault(round(word['top'] / 3), []).append(word)
            for ws in full_rows.values():
                ws.sort(key=lambda w: w['x0'])
                text = ' '.join(w['text'] for w in ws)
                top = min(w['top'] for w in ws)
                if GROUP.search(text) and text.upper().startswith('GIRONE'):
                    continue
                if STOP.match(text):
                    breaks.append(top)
                for rx, sect in SECTIONS:
                    if rx.search(text):
                        headings.append((top, sect))
                        breaks.append(top)
            headings.sort()
            groups = {}
            for col in (0, 1):
                col_lines = sorted([l for l in lines if l['col'] == col], key=lambda l: l['top'])
                cur = None
                limit = None
                for line in col_lines:
                    text = line['text']
                    if cur is not None and limit is not None and line['top'] >= limit - 1:
                        cur = None
                    if STOP.match(text) and not GROUP.search(text):
                        cur = None
                        continue
                    m = GROUP.search(text)
                    if m and text.upper().startswith('GIRONE'):
                        sect = current_section
                        for top, s in headings:
                            if top < line['top']:
                                sect = s
                        cur = (sect, m.group(1), col, line['top'])
                        groups[cur] = []
                        later = [b for b in breaks if b > line['top'] + 1]
                        limit = min(later) if later else None
                        continue
                    if cur is None or NOISE.match(text):
                        continue
                    name = re.sub(r'^\d+\s+', '', text) if numbered else text
                    if name and not re.fullmatch(r'\d+', name):
                        groups[cur].append(name)
            for (sect, letter, col, top), names in sorted(groups.items(), key=lambda kv: (kv[0][3], kv[0][2])):
                result.append((sect, letter, names))
            for top, s in headings:
                current_section = s
    return result


def merge_split_names(names):
    return [n for n in names if n]


data = {}


def add(sect, letter, names, source):
    if sect is None:
        print('WARNING: group without section', letter, source)
        return
    key = (sect[0], sect[1], letter)
    data[key] = {'category': sect[0], 'level': sect[1], 'group': letter, 'teams': merge_split_names(names), 'source': source}


# Initial compositions
for sect, letter, names in parse_pdf(REG / 'reg_33.pdf', range(1, 9), False):
    add(sect, letter, names, 'CRL C.U. 33 del 04/09/2026')
for sect, letter, names in parse_pdf(REG / 'reg_19.pdf', [4], False):
    add(sect, letter, names, 'CRL C.U. 19 del 27/08/2026')
# Revisions of 15/09/2026 replace the affected groups
for sect, letter, names in parse_pdf(REG / 'reg_45.pdf', [1, 2, 3], False):
    add(sect, letter, names, 'CRL C.U. 45 del 15/09/2026')
# Rome provincial
for sect, letter, names in parse_pdf(ROME / 'cu_4.pdf', [1, 2], True):
    add(sect, letter, names, 'DP Roma C.U. 4 del 01/10/2026')

OUT.write_text(json.dumps(list(data.values()), ensure_ascii=False, indent=1), encoding='utf-8')
for key, g in sorted(data.items()):
    print(key, len(g['teams']), g['source'])
