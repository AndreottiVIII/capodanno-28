"""Icone dell'app: sigillo rosso 圍棋 su fondo blu di Tientsin con bordo a greca d'oro.
Uso: python tools/icone.py
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIELD, GOLD, RED, PAPER = (20, 33, 61), (226, 176, 92), (184, 54, 31), (247, 230, 204)
FONTS = [r'C:\Windows\Fonts\msyhbd.ttc', r'C:\Windows\Fonts\simsun.ttc']


def greca(d, x0, y0, x1, y1, step, w):
    """Bordo a meandro: un tassello a uncino ripetuto lungo i quattro lati."""
    def hook(x, y, s, rot):
        pts = [(0, .9), (.8, .9), (.8, .1), (.25, .1), (.25, .62), (.56, .62), (.56, .38)]
        out = []
        for px, py in pts:
            if rot == 0: out.append((x + px * s, y + py * s))
            elif rot == 1: out.append((x + (1 - py) * s, y + px * s))
            elif rot == 2: out.append((x + (1 - px) * s, y + (1 - py) * s))
            else: out.append((x + py * s, y + (1 - px) * s))
        d.line(out, fill=GOLD, width=w, joint='curve')
    n = int((x1 - x0) // step)
    for i in range(n):
        hook(x0 + i * step, y0, step, 0)
        hook(x0 + i * step, y1 - step, step, 2)
        hook(x0, y0 + i * step, step, 3)
        hook(x1 - step, y0 + i * step, step, 1)


def icon(size, maskable=False):
    S = size * 4
    im = Image.new('RGB', (S, S), FIELD)
    d = ImageDraw.Draw(im)
    pad = S * (0.12 if maskable else 0.0)
    if not maskable:
        step = S / 16
        greca(d, 0, 0, S, S, step, max(4, int(S / 110)))
    inner = S * (0.56 if maskable else 0.66)
    x0 = (S - inner) / 2
    d.rectangle([x0, x0, x0 + inner, x0 + inner], fill=RED)
    m = inner * 0.06
    d.rectangle([x0 + m, x0 + m, x0 + inner - m, x0 + inner - m], outline=PAPER, width=max(3, int(S / 140)))
    font = None
    for f in FONTS:
        if os.path.exists(f):
            font = ImageFont.truetype(f, int(inner * 0.36)); break
    for i, ch in enumerate('圍棋'):
        bb = d.textbbox((0, 0), ch, font=font)
        w, h = bb[2] - bb[0], bb[3] - bb[1]
        cy = x0 + inner * (0.29 + 0.42 * i)
        d.text((S / 2 - w / 2 - bb[0], cy - h / 2 - bb[1]), ch, font=font, fill=PAPER)
    return im.resize((size, size), Image.LANCZOS)


if __name__ == '__main__':
    out = os.path.join(ROOT, 'img')
    icon(192).save(os.path.join(out, 'icon-192.png'))
    icon(512).save(os.path.join(out, 'icon-512.png'))
    icon(512, maskable=True).save(os.path.join(out, 'icon-maskable-512.png'))
    icon(180).save(os.path.join(out, 'apple-touch-icon.png'))
    print('ok')
