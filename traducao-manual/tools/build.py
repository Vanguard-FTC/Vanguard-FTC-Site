# Monta o HTML traduzido: troca o texto de cada bloco marcado pela tradução, preservando a marcação original.
import sys, re, json, glob, html
from bs4 import BeautifulSoup
base = sys.argv[1]            # pasta src
segs = json.load(open(f'{base}/segs.json', encoding='utf-8'))
tr = {}
for f in sorted(glob.glob(f'{base}/pt/*.txt')):
    for l in open(f, encoding='utf-8'):
        m = re.match(r'^(s\d{4}) \| ?(.*)$', l.rstrip('\n'))
        if m: tr[m.group(1)] = m.group(2)
soup = BeautifulSoup(open(f'{base}/en-marked.html', encoding='utf-8').read(), 'lxml')

def rebuild(sid, core):
    s = segs[sid]; tags = s['tags']
    txt = s['pre'] + core + s['suf']
    def rep(m):
        i, slash_end = int(m.group(2)), m.group(3)
        if m.group(1):              # fechamento
            name = re.match(r'<(\w+)', tags[i]).group(1); return f'</{name}>'
        if slash_end: return tags[i]
        return tags[i]
    # escapa o texto e depois insere as tags
    parts = re.split(r'(⟦/?\d+/?⟧)', txt)
    out = ''
    for p in parts:
        m = re.fullmatch(r'⟦(/?)(\d+)(/?)⟧', p)
        out += rep(m) if m else p.replace('&', '&amp;').replace('&amp;lt;', '&lt;').replace('&amp;gt;', '&gt;').replace('&amp;amp;', '&amp;')
    return out

done = 0
for el in soup.find_all(attrs={'data-sid': True}):
    sid = el['data-sid']
    if sid in tr:
        el.clear()
        frag = BeautifulSoup(rebuild(sid, tr[sid]), 'html.parser')
        for c in list(frag.contents): el.append(c)
        done += 1
    del el['data-sid']
print('traduzidos', done, 'de', len(segs))
soup.html['lang'] = 'pt-BR'
open(f'{base}/pt-raw.html', 'w', encoding='utf-8').write(str(soup))
