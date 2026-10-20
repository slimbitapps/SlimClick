"""Macht aus docs/PROMPT.md eine schöne Seite mit Kopier-Knöpfen: docs/PROMPT.html
  python3 scripts/prompt-html.py [AUSGABE.html]
Nach jeder Änderung an PROMPT.md neu ausführen.
"""
import html, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
md = open(os.path.join(ROOT, 'docs', 'PROMPT.md')).read()
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'docs', 'PROMPT.html')
e = html.escape

intro = md.split('---')[0]
intro_lines = [l for l in intro.splitlines()[1:] if l.strip()]
bold = lambda s: re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', re.sub(r'[„"](.+?)[“"]', r'„\1“', e(s)))
parts = re.findall(r'^## (.+?)\n+```\n(.*?)\n```', md, re.S | re.M)
when = {1: 'Neue App starten – deine Idee kommt unten ans Ende.', 2: 'Wenn die App veröffentlicht ist und Videos kommen sollen.'}
cards = []
for i, (title, body) in enumerate(parts, 1):
    cards.append(f'''<section class="card">
  <div class="top"><span class="num">{i}</span><div><h2>{e(title)}</h2><p>{when.get(i, '')}</p></div>
  <button data-t="p{i}">Kopieren</button></div>
  <pre id="p{i}">{e(body)}</pre>
</section>''')

steps = [('1', 'Teil 1 kopieren', 'Knopf „Kopieren“, in eine neue Sitzung einfügen und deine App-Idee ganz unten anhängen.'),
         ('2', 'Testen', 'Claude baut die App und gibt dir eine Testversion für Mac und Windows.'),
         ('3', '„Go“ schreiben', 'Dann wird alles automatisch auf GitHub veröffentlicht.'),
         ('4', 'Teil 2 für Videos', 'Sprechtext einsprechen, Aufnahme schicken – du bekommst ein fertiges ZIP.')]
steps_html = ''.join(f'<div class="step"><span>{n}</span><b>{e(t)}</b><p>{bold(d)}</p></div>' for n, t, d in steps)

page = f'''<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SlimBit Prompt</title>
<style>
:root{{--bg:#f4f5f8;--card:#fff;--ink:#16171c;--mut:#666b78;--line:#e3e5ec;--code:#f7f8fb;--a1:#ff7a59;--a2:#ff3d77}}
@media (prefers-color-scheme:dark){{:root{{--bg:#111216;--card:#1b1c22;--ink:#eef0f5;--mut:#9aa0ad;--line:#2b2d35;--code:#15161b}}}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 Inter,-apple-system,"Segoe UI",sans-serif}}
.wrap{{max-width:980px;margin:0 auto;padding:40px 16px 60px}}
header{{display:flex;align-items:center;gap:16px;margin-bottom:28px}}
.logo{{width:54px;height:54px;border-radius:16px;background:linear-gradient(135deg,var(--a1),var(--a2));display:grid;place-items:center;color:#fff;font-weight:800;font-size:24px;flex:none}}
h1{{margin:0;font-size:28px;letter-spacing:-.02em}} header p{{margin:2px 0 0;color:var(--mut)}}
.steps{{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}}
.step{{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px 16px}}
.step span{{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,var(--a1),var(--a2));color:#fff;font-weight:700;font-size:13px;margin-right:6px}}
.step p{{margin:6px 0 0;color:var(--mut);font-size:14px}}
.card{{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:20px;margin-bottom:22px;box-shadow:0 1px 3px rgba(0,0,0,.04)}}
.top{{display:flex;align-items:center;gap:14px;margin-bottom:14px}} .top>div{{flex:1}}
.num{{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,var(--a1),var(--a2));color:#fff;display:grid;place-items:center;font-weight:800;font-size:18px;flex:none}}
h2{{margin:0;font-size:20px}} .top p{{margin:2px 0 0;color:var(--mut);font-size:14px}}
button{{border:0;border-radius:12px;padding:11px 20px;font:600 15px inherit;font-family:inherit;color:#fff;cursor:pointer;background:linear-gradient(135deg,var(--a1),var(--a2));transition:transform .1s}}
button:active{{transform:scale(.96)}} button.ok{{background:#22a55b}}
pre{{margin:0;background:var(--code);border:1px solid var(--line);border-radius:14px;padding:16px;white-space:pre-wrap;word-break:break-word;font:13.5px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace;max-height:520px;overflow:auto}}
footer{{color:var(--mut);font-size:13px;text-align:center}}
@media (max-width:760px){{.steps{{grid-template-columns:1fr 1fr}}.top{{flex-wrap:wrap}}button{{width:100%}}}}
</style></head><body><div class="wrap">
<header><div class="logo">S</div><div><h1>SlimBit Prompt</h1><p>{bold(intro_lines[0]) if intro_lines else ''}</p></div></header>
<div class="steps">{steps_html}</div>
{''.join(cards)}
<footer>SlimBit Apps · SlimBitApps@gmail.com · Quelle: docs/PROMPT.md im Repo slimbitapps/SlimClick</footer>
</div>
<script>
document.querySelectorAll('button[data-t]').forEach(b=>b.onclick=async()=>{{
  const t=document.getElementById(b.dataset.t).innerText;
  try{{await navigator.clipboard.writeText(t)}}catch(_){{const a=document.createElement('textarea');a.value=t;document.body.append(a);a.select();document.execCommand('copy');a.remove()}}
  b.textContent='✓ Kopiert';b.classList.add('ok');setTimeout(()=>{{b.textContent='Kopieren';b.classList.remove('ok')}},1800);
}});
</script></body></html>
'''
open(OUT, 'w').write(page)
print('→', OUT)
