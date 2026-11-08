# Adiciona capa com o aviso de tradução não oficial ao HTML traduzido.
from bs4 import BeautifulSoup
src = 'manual/src/pt-raw.html'
s = BeautifulSoup(open(src, encoding='utf-8').read(), 'lxml')
cover = BeautifulSoup('''
<div style="page-break-after:always;text-align:center;font-family:Calibri,Arial,sans-serif;padding-top:2.2in">
 <p style="font-size:30pt;font-weight:bold;margin:0">Manual de Competição</p>
 <p style="font-size:22pt;margin:8pt 0 0">BIOBUZZ™ apresentado pela RTX</p>
 <p style="font-size:16pt;margin:6pt 0 0"><i>FIRST</i>® Tech Challenge – Temporada 2026-2027</p>
 <p style="font-size:13pt;margin:18pt 0 0;color:#444">Versão do original: TU08</p>
 <div style="margin:0.9in auto 0;max-width:5.2in;border:2pt solid #b00020;border-radius:6pt;padding:14pt 18pt;color:#b00020;font-size:13pt;font-weight:bold">
  Tradução não oficial, sujeita a erros. Em caso de dúvida, consulte o manual oficial da <i>FIRST</i> em inglês.
 </div>
 <p style="font-size:11pt;margin:0.5in 0 0;color:#444">Tradução para o português feita pela equipe Vanguard (FTC).<br>
 Manual oficial: ftc-resources.firstinspires.org/ftc/game/manual</p>
</div>''', 'html.parser')
s.body.insert(0, cover)
open('manual/src/pt-final.html', 'w', encoding='utf-8').write(str(s))
