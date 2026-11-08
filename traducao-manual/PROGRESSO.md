# Tradução do Manual de Competição FTC 2026-2027 (BIOBUZZ, TU08) — progresso

Fonte: HTML oficial (cm-html) + PDF TU08 em manual/en.pdf; figuras em manual/src/files/.
Pipeline (rodar a partir da pasta scratchpad):
1. tools/segment.py  -> manual/src/segs.json + en-marked.html + chunks/cNN.txt (30 blocos)
2. Traduzir: manual/src/pt/cNN.txt  (formato "sNNNN | texto", marcadores ⟦n⟧ intocados)
   - células repetitivas: tools/auto.py -> pt/auto.txt
   - conferir: python3 -I tools/check.py manual/src/chunks/cNN.txt manual/src/pt/cNN.txt
3. tools/build.py manual/src -> pt-raw.html ; depois render (tools/render.js) com aviso de tradução não oficial
   na capa e no rodapé de todas as páginas; sumário (MsoToc) traduzir a partir dos títulos.

Concluídos: c00–c25 (até 13.5.1).  Próximo: c26 (a partir de s2230).
Glossário adotado: ROBOT=ROBÔ, MATCH=PARTIDA, ALLIANCE=ALIANÇA, FIELD=CAMPO, REFEREE=ÁRBITRO,
INSPECTOR=INSPETOR, STUDENT=ESTUDANTE, PORTFOLIO=PORTFÓLIO, HOME REGION=REGIÃO DE ORIGEM,
COMPONENT=COMPONENTE, MECHANISM=MECANISMO, OPERATOR CONSOLE=CONSOLE DO OPERADOR, ROBOT SIGN=PLACA DO ROBÔ,
FIELD STAFF=EQUIPE DE CAMPO, JUDGE=JUIZ, VERBAL WARNING=ADVERTÊNCIA VERBAL, FABRICATED ITEM=ITEM FABRICADO,
Judge Advisor=Coordenador de JUÍZES, Lead Coach 1/2=Treinador Principal 1/2, Program Delivery Partner=Parceiro de Entrega do Programa,
Gracious Professionalism=Profissionalismo Cortês, nomes de prêmios mantidos (Prêmio Inspire, Think, Connect...).
Modalidade: must = "deve(m)"; should (em regras) = "deveria(m)"; may = "pode(m)"; may not = "não pode(m)".
Glossário (c10+): DRIVE TEAM=EQUIPE DE PILOTAGEM, DRIVER=PILOTO, DRIVE COACH=TREINADOR DE PILOTAGEM, HUMAN PLAYER=JOGADOR HUMANO,
SCORING ELEMENT=ELEMENTO DE PONTUAÇÃO, ALLIANCE AREA=ÁREA DA ALIANÇA, LOADING ZONE=ZONA DE CARREGAMENTO, ALLIANCE CAPTAIN=CAPITÃO DA ALIANÇA,
LAUNCH=LANÇAR/LANÇAMENTO, TIP/TIPPED=TOMBAMENTO/TOMBADA (HIVE TIP=TOMBAMENTO DA HIVE), RANKING POINTS=PONTOS DE CLASSIFICAÇÃO (RP),
MINOR FOUL=FALTA LEVE, MAJOR FOUL=FALTA GRAVE, YELLOW/RED CARD=CARTÃO AMARELO/VERMELHO, DISABLED=DESATIVADO, DISQUALIFIED=DESCLASSIFICADO,
ARENA FAULT=FALHA DA ARENA, SURROGATE=SUBSTITUTA, CONTROL=CONTROLAR/CONTROLE, PIN=PRENSAR/PRENSAGEM, STARTING CONFIGURATION=CONFIGURAÇÃO INICIAL,
"Violation:"=Violação:, "per instance"=por ocorrência, "if STRATEGIC"=se ESTRATÉGICO, STRATEGIC=ESTRATÉGICO, MOMENTARY=MOMENTÂNEO, CONTINUOUS=CONTÍNUO, REPEATED=REPETIDO, Head REFEREE=ÁRBITRO Principal.
Mantidos em inglês: TILE, DRIVER STATION, ROBOT CONTROLLER, OpMode, AUTO, TELEOP, LEAVE, PARK, SWARM, POLLINATOR, GARDEN, CELL, AprilTag.
Números com vírgula decimal (2,5 cm); in. = pol.
Elementos do jogo (POLLEN, NECTAR, FLOWER, HIVE, GARDEN...) — manter em inglês (nomes próprios do jogo).

## Arquivos nesta branch
- traducao-manual/manual/en.pdf — manual oficial TU08 (inglês)
- traducao-manual/manual/src/en-local.html — HTML oficial (cm-html) com imagens apontando para files/
- traducao-manual/manual/src/files/ — figuras do manual
- traducao-manual/segs.json, chunks/ — gerados por tools/segment.py a partir de en-local.html
- traducao-manual/pt/ — traduções (c00–c25 + auto.txt)
Obs.: os scripts usam caminhos "manual/src/..." relativos à pasta de trabalho; ajuste conforme a nova estrutura
(ex.: copiar segs.json, chunks/ e pt/ para manual/src/ antes de rodar check.py/build.py).
