"""Monta o index.html a partir dos arquivos em src/.
Uso: python scripts/build.py
"""
from pathlib import Path
raiz = Path(__file__).resolve().parent.parent
src = raiz / "src"
corpo = (src / "shell.html").read_text(encoding="utf-8")
js = "\n".join((src / n).read_text(encoding="utf-8") for n in ["engine.js", "core.js", "qprof.js", "app.js"])
html = ('<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        '<style>:root{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}'
        'body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n</head>\n<body>\n'
        + corpo + "\n<script>\n" + js + "\n</script>\n</body>\n</html>\n")
(raiz / "index.html").write_text(html, encoding="utf-8")
print("index.html gerado:", len(html), "bytes")
