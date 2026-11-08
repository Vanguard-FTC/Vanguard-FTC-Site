# Confere um arquivo traduzido (sid<TAB>texto) contra o bloco original: ids e marcadores ⟦n⟧ idênticos.
import sys, re, collections
src, tr = sys.argv[1], sys.argv[2]
orig = dict(l.rstrip('\n').split('\t', 1) for l in open(src, encoding='utf-8') if '\t' in l)
out = {}
import os
auto = os.path.join(os.path.dirname(tr), 'auto.txt')
for l in (open(auto, encoding='utf-8') if os.path.exists(auto) else []):
    m = re.match(r'^(s\d{4}) \| ?(.*)$', l.rstrip('\n'))
    if m and m.group(1) in orig: out[m.group(1)] = m.group(2)
for n, l in enumerate(open(tr, encoding='utf-8'), 1):
    l = l.rstrip('\n')
    if not l.strip(): continue
    m = re.match(r'^(s\d{4}) \| ?(.*)$', l)
    if not m: print('linha inválida', n, l[:80]); continue
    k, v = m.group(1), m.group(2); out[k] = v
ph = lambda t: collections.Counter(re.findall(r'⟦/?\d+/?⟧', t))
bad = 0
for k, v in orig.items():
    if k not in out: print('FALTA', k, v[:80]); bad += 1; continue
    if ph(v) != ph(out[k]): print('MARCADOR', k, '\n  EN:', v[:200], '\n  PT:', out[k][:200]); bad += 1
for k in out:
    if k not in orig: print('EXTRA', k)
print('ok' if not bad else f'{bad} problemas', len(out), '/', len(orig))
