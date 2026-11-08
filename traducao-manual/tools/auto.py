# Traduções automáticas de células repetitivas (tabelas), idênticas em todo o manual.
import json, re, sys
segs = json.load(open('manual/src/segs.json', encoding='utf-8'))
D = {
 '1⟦0⟧st⟦/0⟧ Place': '1⟦0⟧º⟦/0⟧ Lugar', '2⟦0⟧nd⟦/0⟧ Place': '2⟦0⟧º⟦/0⟧ Lugar', '3⟦0⟧rd⟦/0⟧ Place': '3⟦0⟧º⟦/0⟧ Lugar',
 '(2⟦1⟧nd⟦/1⟧ Place*)': '(2⟦1⟧º⟦/1⟧ Lugar*)', '(3⟦1⟧rd⟦/1⟧ Place*)': '(3⟦1⟧º⟦/1⟧ Lugar*)',
 'Optional*': 'Opcional*', 'Required': 'Obrigatório', 'Encouraged': 'Incentivado',
 'Inspire Award': 'Prêmio Inspire', 'Think Award': 'Prêmio Think', 'Connect Award': 'Prêmio Connect',
 'Reach Award': 'Prêmio Reach', 'Sustain Award': 'Prêmio Sustain', 'Design Award': 'Prêmio Design',
 'Innovate Award': 'Prêmio Innovate', 'Control Award': 'Prêmio Control', 'Judges’ Choice Award': 'Prêmio Escolha dos Juízes (Judges’ Choice)',
 'TA Awards': 'Prêmios TA', 'MCI Awards': 'Prêmios MCI', 'Yes': 'Sim', 'No': 'Não', 'N/A': 'N/A',
}
out = []
for k, v in segs.items():
    if v['cls'].startswith('MsoToc'): continue
    if v['core'] in D: out.append(f"{k} | {D[v['core']]}")
open('manual/src/pt/auto.txt', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print(len(out))
