# Extrai os trechos traduzíveis do HTML oficial (Word) preservando toda a marcação.
import sys, re, json
from bs4 import BeautifulSoup, NavigableString, Tag, Comment
src, out_html, out_json = sys.argv[1:4]
soup = BeautifulSoup(open(src, encoding='utf-8').read(), 'lxml')
BLOCKS = {'p','h1','h2','h3','h4','h5','li','td','th','caption'}
KEEP_STYLE = ('color','background','font-weight','font-style','vertical-align','text-decoration')
for sp in soup.body.find_all('span'):
    st = (sp.get('style') or '').lower()
    if not sp.get('class') and not any(k in st for k in KEEP_STYLE):
        sp.unwrap()
for c in soup.body.find_all(string=lambda s: isinstance(s, Comment)): c.extract()

def open_tag(t):
    attrs = ''.join(f' {k}="{(" ".join(v) if isinstance(v, list) else v)}"' for k, v in t.attrs.items())
    return f'<{t.name}{attrs}>'

segs = {}
n = 0
for el in soup.body.find_all(BLOCKS):
    if el.find(BLOCKS) or not re.search(r'[A-Za-z]{2,}', el.get_text()): continue
    tags = []
    def ser(node):
        out = ''
        for c in node.children:
            if isinstance(c, NavigableString):
                out += str(c).replace(' ', ' ').replace('<','&lt;').replace('>','&gt;')
            elif isinstance(c, Tag):
                i = len(tags)
                if c.name in ('br','img'):
                    tags.append(str(c)); out += f'⟦{i}/⟧'
                else:
                    tags.append(open_tag(c)); out += f'⟦{i}⟧' + ser(c) + f'⟦/{i}⟧'
        return out
    core = re.sub(r'\s+', ' ', ser(el)).strip()
    pre = suf = ''
    while True:   # tira invólucros que cobrem o trecho inteiro
        m = re.match(r'^⟦(\d+)⟧(.*)⟦/\1⟧$', core)
        if not m or '⟦/%s⟧' % m.group(1) in m.group(2): break
        pre += f'⟦{m.group(1)}⟧'; suf = f'⟦/{m.group(1)}⟧' + suf; core = m.group(2).strip()
    n += 1; sid = f's{n:04d}'
    el['data-sid'] = sid
    segs[sid] = {'pre': pre, 'suf': suf, 'core': core, 'tags': tags, 'tag': el.name, 'cls': ' '.join(el.get('class') or [])}
open(out_html, 'w', encoding='utf-8').write(str(soup))
json.dump(segs, open(out_json, 'w', encoding='utf-8'), ensure_ascii=False)
print(len(segs), sum(len(v['core']) for v in segs.values()), sum(v['core'].count('⟦') for v in segs.values()))
