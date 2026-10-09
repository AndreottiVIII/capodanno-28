"""QR per la scatola del goban: apre la schermata di benvenuto.
Produce stampa/qr-benvenuto.svg (solo il codice, vettoriale) e stampa/biglietto-qr.png (biglietto 10×10 cm a 300 dpi).
Uso: python tools/qr.py [indirizzo]
"""
import os, sys, io
import segno
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = sys.argv[1] if len(sys.argv) > 1 else 'https://andreottiviii.github.io/capodanno-28/#benvenuto'
OUT = os.path.join(ROOT, 'stampa'); os.makedirs(OUT, exist_ok=True)
FIELD, GOLD, RED, PAPER, INK = (20, 33, 61), (226, 176, 92), (184, 54, 31), (247, 230, 204), (20, 33, 61)

qr = segno.make(URL, error='h')
qr.save(os.path.join(OUT, 'qr-benvenuto.svg'), scale=10, border=2, dark='#14213D', light='#F7E6CC')

# biglietto: fondo blu, greca d'oro, sigillo, QR su carta
S = 1181  # 10 cm a 300 dpi
im = Image.new('RGB', (S, S), FIELD); d = ImageDraw.Draw(im)
step = S / 22; w = 7
for i in range(22):
    for (x, y, rot) in ((i * step, 0, 0), (i * step, S - step, 2), (0, i * step, 3), (S - step, i * step, 1)):
        pts = [(0, .9), (.8, .9), (.8, .1), (.25, .1), (.25, .62), (.56, .62), (.56, .38)]
        q = []
        for px, py in pts:
            if rot == 0: q.append((x + px * step, y + py * step))
            elif rot == 1: q.append((x + (1 - py) * step, y + px * step))
            elif rot == 2: q.append((x + (1 - px) * step, y + (1 - py) * step))
            else: q.append((x + py * step, y + (1 - px) * step))
        d.line(q, fill=GOLD, width=w)
buf = io.BytesIO(); qr.save(buf, kind='png', scale=14, border=2, dark='#14213D', light='#F7E6CC'); buf.seek(0)
q = Image.open(buf).convert('RGB'); qs = int(S * .52); q = q.resize((qs, qs), Image.NEAREST)
qx = (S - qs) // 2; qy = int(S * .30)
d.rectangle([qx - 14, qy - 14, qx + qs + 14, qy + qs + 14], outline=GOLD, width=4)
im.paste(q, (qx, qy))
han = ImageFont.truetype(r'C:\Windows\Fonts\msyhbd.ttc', 46)
serif = ImageFont.truetype(r'C:\Windows\Fonts\georgia.ttf', 64)
small = ImageFont.truetype(r'C:\Windows\Fonts\georgia.ttf', 34)
sx, sy, ss = S // 2 - 52, int(S * .085), 104
d.rectangle([sx, sy, sx + ss, sy + ss], fill=RED); d.rectangle([sx + 7, sy + 7, sx + ss - 7, sy + ss - 7], outline=PAPER, width=3)
for i, ch in enumerate('圍棋'):
    bb = d.textbbox((0, 0), ch, font=han); d.text((S / 2 - (bb[2] - bb[0]) / 2 - bb[0], sy + 8 + i * 46 - bb[1] + 2), ch, font=han, fill=PAPER)
for text, font, y, col in (('Per te', serif, int(S * .215), PAPER), ('Inquadra con la fotocamera', small, int(S * .855), GOLD)):
    bb = d.textbbox((0, 0), text, font=font); d.text((S / 2 - (bb[2] - bb[0]) / 2 - bb[0], y - bb[1]), text, font=font, fill=col)
im.save(os.path.join(OUT, 'biglietto-qr.png'), dpi=(300, 300))
print('ok', URL)
