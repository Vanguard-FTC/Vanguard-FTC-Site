import sys, pymupdf
src, dst = sys.argv[1], sys.argv[2]
doc = pymupdf.open(src)
COLOR = tuple(c/255 for c in (0x1F,0x1E,0x1D))
RIGHT = 549.8
fonts = {}
for xref, ext, typ, name, *_ in doc[0].get_fonts(full=True):
    if 'Semibold' in name: fonts['semi'] = doc.extract_font(xref)[3]
    elif 'RegularItalic' in name: fonts['ital'] = doc.extract_font(xref)[3]
    elif 'SansPrint-Regular' in name: fonts['reg'] = doc.extract_font(xref)[3]
F = {k: pymupdf.Font(fontbuffer=v) for k, v in fonts.items()}

def kind(span):
    if span['font'].startswith('AnthropicSansPrint-Semib'): return 'semi'
    if span['flags'] & 2: return 'ital'
    return 'reg'

# (página, trecho que identifica o parágrafo, [(antigo, novo), ...])
EDITS = [
    # capa: versão oficial atual e sem o nome de arquivo interno
    (1, 'Versão: TU06', [('TU06', 'TU08')]),
    (1, 'FTC_VANGUARD', [('Tradução para o português do manual original em inglês (FTC_VANGUARD.pdf).',
                          'Tradução não oficial para o português do Manual de Competição oficial em inglês.')]),
    # 1.4.1 "only make it more difficult to enable introductory play experiences" (regência corrigida, sentido literal mantido)
    (7, 'apenas dificultam', [('apenas dificultam possibilitar experiências de jogo introdutórias',
                               'apenas tornam mais difícil possibilitar experiências de jogo introdutórias')]),
    # 1.7.1 "will always defer to measurements using imperial units" (defer to = submeter-se a; "remeter" = fazer referência)
    (15, 'remeterão', [('sempre remeterão às medidas', 'sempre se submeterão às medidas')]),
    # 1.7.4 frase sem verbo; mantém "como interpretar" do original
    (18, 'como interpretar a Regra G', [('Não temos certeza de como interpretar a Regra G?? se aplica',
                                         'Não temos certeza de como interpretar se a Regra G?? se aplica')]),
]

for pno, key, reps in EDITS:
    page = doc[pno-1]
    all_lines = sorted([l for b in page.get_text('dict')['blocks'] if 'lines' in b for l in b['lines']],
                       key=lambda l: (round(l['spans'][0]['origin'][1], 1), l['spans'][0]['origin'][0]))
    idx = next(i for i, l in enumerate(all_lines) if key in ''.join(s['text'] for s in l['spans']))
    same = lambda a, b: abs(a['spans'][0]['origin'][0] - b['spans'][0]['origin'][0]) < 1 and 16.5 < b['spans'][0]['origin'][1] - a['spans'][0]['origin'][1] < 19.5
    i0 = idx
    while i0 > 0 and same(all_lines[i0-1], all_lines[i0]): i0 -= 1
    i1 = idx
    while i1 < len(all_lines)-1 and same(all_lines[i1], all_lines[i1+1]): i1 += 1
    lines = all_lines[i0:i1+1]
    x0 = lines[0]['spans'][0]['origin'][0]
    base0 = lines[0]['spans'][0]['origin'][1]
    lh = (lines[1]['spans'][0]['origin'][1] - base0) if len(lines) > 1 else 17.97
    size = lines[0]['spans'][0]['size']
    # runs (tipo de fonte, texto)
    runs = []
    for i, l in enumerate(lines):
        for s in l['spans']:
            k, t = kind(s), s['text']
            if runs and runs[-1][0] == k: runs[-1][1] += t
            else: runs.append([k, t])
        if i < len(lines)-1 and not runs[-1][1].endswith(' '): runs[-1][1] += ' '
    for old, new in reps:
        hit = False
        for r in runs:
            if old in r[1]: r[1] = r[1].replace(old, new); hit = True
        assert hit, (pno, old)
    for c in set(''.join(r[1] for r in runs)):
        for k in {r[0] for r in runs}:
            if c.strip() and not F[k].has_glyph(ord(c)): print('SEM GLIFO', pno, k, repr(c))
    # quebra de linha
    words = []
    for k, t in runs:
        for w in t.split(' '):
            if w: words.append((k, w))
    out, cur, curw = [], [], 0
    sp = lambda k: F[k].text_length(' ', size)
    for k, w in words:
        wl = F[k].text_length(w, size)
        add = wl + (sp(k) if cur else 0)
        if cur and x0 + curw + add > RIGHT:
            out.append(cur); cur, curw = [], 0; add = wl
        cur.append((k, w)); curw += add
    if cur: out.append(cur)
    assert len(out) <= len(lines) + 0, (pno, 'linhas a mais', len(out), len(lines))
    for l in lines: page.add_redact_annot(pymupdf.Rect(l['bbox']) + (0, 0.5, 0, 0.5))
    page.apply_redactions(images=0, graphics=0, text=0)
    for k, v in fonts.items(): page.insert_font(fontname='V'+k, fontbuffer=v)
    for i, line in enumerate(out):
        x, y = x0, base0 + i*lh
        for j, (k, w) in enumerate(line):
            t = w if j == 0 else ' ' + w
            for ch in t:
                kk = k if F[k].has_glyph(ord(ch)) or not ch.strip() else 'reg'
                bold = kk != k and k == 'semi'
                page.insert_text((x, y), ch, fontname='V'+kk, fontsize=size, color=COLOR,
                                 render_mode=2 if bold else 0, border_width=0.035 if bold else 1, fill=COLOR if bold else None)
                x += F[kk].text_length(ch, size)
    print('ok', pno, len(lines), '->', len(out))
doc.set_metadata({**doc.metadata, 'title': 'Manual de Competição FIRST Tech Challenge 2026-2027 – BIOBUZZ (Tradução não oficial para o Português)'})
doc.save(dst, garbage=3, deflate=True)
