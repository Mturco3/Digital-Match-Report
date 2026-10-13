"""Turn the raw group lists from extract_groups.py into data/teams.json.

One entry per club with all its competitions. Names are cleaned (legal prefixes
and suffixes removed); the official spelling is kept in the "official" field.
Colours are generated, not real kit colours. A logo path is set when a file named
<id>.png, .webp or .svg exists in the logos directory (optional third argument).

Usage: python build_teams_json.py <raw_groups.json> <out teams.json> [logos_dir]
"""
import hashlib
import json
import re
import sys
import unicodedata
from pathlib import Path

RAW = Path(sys.argv[1])
OUT = Path(sys.argv[2])
LOGOS = Path(sys.argv[3]) if len(sys.argv) > 3 else None

SMALL = {'di', 'del', 'della', 'dello', 'dei', 'delle', 'da', 'de', 'la', 'il', 'lo', 'le', 'e', 'al', 'dal', 'in', 'a', 'ad'}
ACRONYMS = {'AISA', 'ACROS', 'LUISS', 'MYSP', 'DLF', 'GDZ', 'JFC', 'CVN', 'FMA', 'CSL', 'OIR', 'OMC', 'SPQV', 'RDP', 'LVPA',
            'TSS', 'AS', 'AC', 'FC', 'SS', 'DM', 'CRAL', 'UNDICI', 'ELIS', 'LB69', 'II', 'III', 'IV', 'VII', 'SC', 'ASR', 'SSD'}
PREFIX = re.compile(
    r'^(A\.?S\.?D\.?|U\.?S\.?D\.?|S\.?S\.?D\.?|SSDARL|SSDRL|ASDPOL|A\.?P\.?D\.?|A\.?C\.?D\.?|F\.?C\.?D\.?|G\.?S\.?D\.?|'
    r'ASR|A\.?S\.?R\.?|SPDARL|ACSD|C\.?S\.?|A\.?S\.?|A\.?C\.?|ASD|S\.?D\.?|A\.?)(?=\s)\s*',
    re.I)
SUFFIX = re.compile(
    r'\s+(A\.?S\.?D\.?|ASD|S\.?S\.?D\.?R?\.?L?\.?|SSDARL|SSDRL|S\.?R\.?L\.?|S\.R\.|A\.?\s?R\.?L\.?|ARL|APS|USD|RDP)\s*$',
    re.I)


def strip_accents(text):
    return ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')


def slugify(text):
    text = strip_accents(text).lower()
    return re.sub(r'[^a-z0-9]+', '-', text).strip('-')


def title_token(token, first):
    if token.lower() == 'pol.':
        return 'Pol.'
    bare = re.sub(r'[^A-Za-z0-9]', '', token).upper()
    if bare in ACRONYMS or (re.search(r'\.', token) and len(bare) <= 4 and token.upper() == token):
        return token.upper()
    low = token.lower()
    if not first and low in SMALL:
        return low
    out = []
    for part in re.split(r"([\-'/])", low):
        out.append(part[:1].upper() + part[1:] if part and part not in "-'/" else part)
    return ''.join(out)


def clean_name(official):
    name = re.sub(r'\s+', ' ', official).strip()
    name = re.sub(r'^A\.D\.\s?POLISPORTIVA', 'POLISPORTIVA', name)
    name = re.sub(r'\s+S\.?S\.?D\.?\s?A\.?\s?R\.?L\.?$', '', name)
    name = re.sub(r'\bPOL\.\s?D\.', 'POL.', name)
    name = re.sub(r'^POLASD\s', '', name)
    name = re.sub(r'^C\.S\.V\.\s', 'CSV ', name)
    name = re.sub(r'\b([A-Z]{1,5})\.(?=[A-Z]{2,})', r'\1. ', name)
    name = re.sub(r"CITTA'\s*DI", 'CITTÀ DI', name, flags=re.I)
    name = re.sub(r'\bCITTA\b', 'CITTÀ', name, flags=re.I)
    changed = True
    while changed:
        changed = False
        match = PREFIX.match(name)
        if match and len(name) > match.end():
            name = name[match.end():]
            changed = True
        match = SUFFIX.search(name)
        if match and match.start() > 0:
            name = name[:match.start()]
            changed = True
    name = re.sub(r'^(POL\.\s?D\.|POL\.|P\.)\s*', 'POL. ', name, flags=re.I) if re.match(r'^(POL\.|P\.)\s', name, re.I) else name
    name = re.sub(r'\bS\.\s?(?=[A-Z]{3})', 'S. ', name)
    tokens = name.split(' ')
    result = ' '.join(title_token(t, i == 0) for i, t in enumerate(tokens)).strip()
    result = re.sub(r'^A\.D\. ', '', result)
    return OVERRIDES.get(result, result)


OVERRIDES = {'Csv Breda': 'CSV Breda', 'Poggio Moiano Asdpol': 'Poggio Moiano', 'ASS. Sport. Ponte di Nona': 'Ass. Sport. Ponte di Nona',
             'D. Pino Puglisi Nettuno II': 'Don Pino Puglisi Nettuno II', 'LUISS': 'LUISS'}

PALETTE = ['#1b5e20', '#0d47a1', '#b71c1c', '#e65100', '#4a148c', '#006064', '#880e4f', '#33691e',
           '#1a237e', '#bf360c', '#004d40', '#3e2723', '#827717', '#01579b', '#311b92', '#c62828']


def color_for(slug):
    digest = hashlib.sha1(slug.encode('utf-8')).digest()
    return PALETTE[digest[0] % len(PALETTE)]


def find_logo(club_id):
    if LOGOS is None:
        return None
    for extension in ('png', 'webp', 'svg'):
        if (LOGOS / (club_id + '.' + extension)).exists():
            return 'assets/logos/' + club_id + '.' + extension
    return None


groups = json.loads(RAW.read_text(encoding='utf-8'))
clubs = {}
for group in groups:
    for official in group['teams']:
        name = clean_name(official)
        key = slugify(name)
        club = clubs.setdefault(key, {'id': key, 'name': name, 'official': [], 'competitions': []})
        if official not in club['official']:
            club['official'].append(official)
        club['competitions'].append({'category': group['category'], 'level': group['level'], 'group': group['group']})

teams = []
for key, club in sorted(clubs.items()):
    teams.append({
        'id': club['id'],
        'name': club['name'],
        'official': club['official'][0] if len(club['official']) == 1 else club['official'],
        'competitions': club['competitions'],
        'city': None,
        'logo': find_logo(club['id']),
        'color': color_for(club['id']),
        'colorSource': 'generated'
    })

doc = {
    'season': '2026/2027',
    'region': 'Lazio',
    'generatedFrom': sorted({g['source'] for g in groups}),
    'teams': teams
}
lines = ['{']
lines.append('"season": ' + json.dumps(doc['season']) + ',')
lines.append('"region": ' + json.dumps(doc['region']) + ',')
lines.append('"generatedFrom": ' + json.dumps(doc['generatedFrom'], ensure_ascii=False) + ',')
lines.append('"teams": [')
lines.append(',\n'.join(json.dumps(t, ensure_ascii=False, separators=(',', ':')) for t in teams))
lines.append(']')
lines.append('}')
OUT.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('clubs', len(teams), 'entries', sum(len(c['competitions']) for c in teams))
