"""Build the offline Colecciones prototype using only Python's standard library."""
from pathlib import Path
import json,base64,hashlib,re
ROOT=Path(__file__).resolve().parents[1]
catalog=json.loads((ROOT/'data/catalog.json').read_text(encoding='utf-8'))
assert catalog['lists']
ids={w['id'] for w in catalog['works']}
assert len(ids)==len(catalog['works'])
for collection in catalog['lists']:
 assert collection['items'] and len(collection['items'])==len(set(collection['items']))
 assert set(collection.get('itemMeta',{}))<=set(collection['items'])
 assert set(collection['items'])<=ids
for w in catalog['works']:
 if w.get('coverFile'):
  image=(ROOT/w['coverFile']).resolve();assert ROOT in image.parents
  w['cover']='data:image/webp;base64,'+base64.b64encode(image.read_bytes()).decode()
  del w['coverFile']
ui=(ROOT/'src/colecciones.html').read_text(encoding='utf-8');assert ui.count('__CATALOG_JSON__')==1
ui=ui.replace('__CATALOG_JSON__',json.dumps(catalog,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c'))
fonts=(ROOT/'src/fonts.css').read_text(encoding='utf-8')
script=re.search(r'<script>([\s\S]*?)</script>',ui).group(1)
digest=base64.b64encode(hashlib.sha256(script.encode()).digest()).decode()
csp="default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'; script-src 'sha256-"+digest+"'; connect-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'"
doc='''<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Colecciones</title><meta name="description" content="Un archivo personal de libros, películas y series por descubrir.">
<meta name="canto-version" content="1.0.1"><meta name="prototype-version" content="0.11.0">
<meta http-equiv="Content-Security-Policy" content="'''+csp+'''">
<style>html{background:#202528}body{margin:0}#canto-colecciones{max-width:1180px;margin:auto;min-height:100vh}</style>
<style data-canto-fonts>'''+fonts+'''</style></head><body>'''+ui+'''
</body></html>\n'''
(ROOT/'index.html').write_text(doc,encoding='utf-8',newline='\n')
print('Built index.html:',len(catalog['lists']),'collections,',len(catalog['works']),'works,',len(doc.encode()),'bytes')
