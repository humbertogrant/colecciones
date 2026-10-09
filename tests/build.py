"""Exercise the standalone builder with Unicode and a non-UTF-8 locale."""
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
output = ROOT / 'test-results'
output.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(prefix='build-', dir=output) as temporary:
    fixture = Path(temporary)
    for directory in ('scripts', 'src', 'data', 'assets'):
        (fixture / directory).mkdir()
    shutil.copyfile(ROOT / 'scripts/build.py', fixture / 'scripts/build.py')
    for icon in ('favicon.svg', 'favicon-32.png'):
        shutil.copyfile(ROOT / 'assets' / icon, fixture / 'assets' / icon)
    catalog = {
        'works': [{'id': 'unicode', 'title': 'España — 漢字 </script>'}],
        'lists': [{'items': ['unicode']}],
    }
    (fixture / 'data/catalog.json').write_text(json.dumps(catalog, ensure_ascii=False), encoding='utf-8')
    (fixture / 'src/colecciones.html').write_text(
        '<script type="application/json" data-catalog>__CATALOG_JSON__</script>\n'
        '<script>\nconst label = "Recuerdo — 漢字";\n</script>', encoding='utf-8')
    (fixture / 'src/fonts.css').write_text('/* Tipografía */', encoding='utf-8')
    environment = {**os.environ, 'PYTHONUTF8': '0', 'PYTHONCOERCECLOCALE': '0', 'LC_ALL': 'C'}
    command = [sys.executable, '-X', 'utf8=0', str(fixture / 'scripts/build.py')]
    subprocess.run(command, env=environment, check=True, capture_output=True)
    first = (fixture / 'index.html').read_bytes()
    document = first.decode('utf-8')
    assert b'\r\n' not in first
    embedded = re.search(r'data-catalog>(.*?)</script>', document).group(1)
    assert json.loads(embedded) == catalog
    assert '</script>' not in embedded
    script = re.search(r'<script>(.*?)</script>', document, re.S).group(1)
    digest = base64.b64encode(hashlib.sha256(script.encode('utf-8')).digest()).decode('ascii')
    assert "script-src 'sha256-" + digest + "'" in document
    subprocess.run(command, env=environment, check=True, capture_output=True)
    assert first == (fixture / 'index.html').read_bytes()
print('PASS: Unicode build with UTF-8 mode disabled, safe catalog embedding, CSP hash, deterministic output.')
