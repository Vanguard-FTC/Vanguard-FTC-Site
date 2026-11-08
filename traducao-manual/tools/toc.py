# Gera pt/toc.txt: traduz as entradas do sumário (MsoToc*) a partir dos títulos traduzidos de cada seção.
import json, re, glob
from bs4 import BeautifulSoup
base = 'manual/src'
segs = json.load(open(f'{base}/segs.json', encoding='utf-8'))
tr = {}
for f in glob.glob(f'{base}/pt/c*.txt') + [f'{base}/pt/auto.txt']:
    for l in open(f, encoding='utf-8'):
        m = re.match(r'^(s\d{4}) \| ?(.*)$', l.rstrip('\n'))
        if m: tr[m.group(1)] = m.group(2)
soup = BeautifulSoup(open(f'{base}/en-marked.html', encoding='utf-8').read(), 'lxml')
plain = lambda t: re.sub(r'⟦/?\d+/?⟧', '', t).strip()
out = ['s0001 | Sumário']
for k, v in segs.items():
    if not v['cls'].startswith('MsoToc') or k == 's0001': continue
    href = re.search(r'href="#([^"]+)"', ''.join(v['tags']))
    a = soup.find('a', attrs={'name': href.group(1)}) if href else None
    el = a.find_parent(attrs={'data-sid': True}) if a else None
    if el is None:
        el = soup.find(attrs={'name': href.group(1)}) if href else None
        el = el.find_next(attrs={'data-sid': True}) if el else None
    sid = el['data-sid'] if el else None
    if sid not in tr: print('sem título', k, plain(v['core'])); continue
    title = plain(tr[sid])
    core = v['core']
    m = re.match(r'^(.*?⟦/\d+⟧)', core)            # número + espaço
    num = plain(m.group(1)) if m else ''
    title = re.sub(r'^' + re.escape(num) + r'\s*', '', title) if num else title
    tail = re.search(r'(⟦(\d+)⟧\. ⟦/\2⟧⟦(\d+)⟧\d+⟦/\3⟧)$', core)
    out.append(f"{k} | {m.group(1) if m else ''}{title}{tail.group(1) if tail else ''}")
open(f'{base}/pt/toc.txt', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print(len(out))
