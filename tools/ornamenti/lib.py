"""Forme di base per i motivi Nichols: tutto SVG piatto, contorni scuri, colori pieni."""
import math, random

# Tavolozza dei tappeti (costante per tutti i motivi: si leggono su blu, melanzana e giada)
C = dict(
    oro='#E2B05C', oro_chiaro='#F3D79A', oro_scuro='#9A6A26', bruno='#7A4E1C',
    rosso='#C8402A', rosso_scuro='#7A2418', cinabro='#B8361F',
    rosa='#E8909F', rosa_chiaro='#F4C3C6', rosa_scuro='#A8425A', cremisi='#C9566F', vino='#8E2A45',
    crema='#F4EEE2', avorio='#F7E6CC', carta='#FBF6EA',
    giada='#86BBA2', verde='#4E8F78', verde_scuro='#24493E', pino='#2F5E4F',
    blu='#2D4F8E', azzurro='#5B8FC9', azzurro_chiaro='#A9C7E8', blu_scuro='#1F3A66',
    legno='#4A2E26', bronzo='#8C6A3A', bronzo_scuro='#4F3A1E', celadon='#9CC5A8',
    albicocca='#E9A774', nero='#1A1410', grigio='#B9B2A6', grigio_scuro='#6E675C',
)


def f(v):
    return f'{v:.1f}'.rstrip('0').rstrip('.') if isinstance(v, float) else str(v)


def P(p):
    return f'{f(p[0])} {f(p[1])}'


def svg(w, h, body, defs=''):
    d = f'<defs>{defs}</defs>' if defs else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{d}{body}</svg>'


def g(content, x=0, y=0, rot=0, s=1, sx=None, sy=None, extra=''):
    t = []
    if x or y: t.append(f'translate({f(x)} {f(y)})')
    if rot: t.append(f'rotate({f(rot)})')
    if sx is not None or sy is not None: t.append(f'scale({f(sx if sx is not None else s)} {f(sy if sy is not None else s)})')
    elif s != 1: t.append(f'scale({f(s)})')
    tr = f' transform="{" ".join(t)}"' if t else ''
    return f'<g{tr}{extra}>{content}</g>'


def path(d, fill='none', stroke='none', w=1, extra=''):
    sw = f' stroke-width="{f(w)}"' if stroke != 'none' else ''
    return f'<path d="{d}" fill="{fill}" stroke="{stroke}"{sw} stroke-linecap="round" stroke-linejoin="round"{extra}/>'


def circle(x, y, r, fill='none', stroke='none', w=1, extra=''):
    sw = f' stroke-width="{f(w)}"' if stroke != 'none' else ''
    return f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r)}" fill="{fill}" stroke="{stroke}"{sw}{extra}/>'


def ellipse(x, y, rx, ry, fill='none', stroke='none', w=1, rot=0):
    sw = f' stroke-width="{f(w)}"' if stroke != 'none' else ''
    tr = f' transform="rotate({f(rot)} {f(x)} {f(y)})"' if rot else ''
    return f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="{f(rx)}" ry="{f(ry)}" fill="{fill}" stroke="{stroke}"{sw}{tr}/>'


# ---------- curve ----------
def cub(p0, c1, c2, p1, t):
    u = 1 - t
    return (u ** 3 * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t ** 3 * p1[0],
            u ** 3 * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t ** 3 * p1[1])


def catmull(pts, steps=12):
    """Curva morbida che passa per tutti i punti."""
    if len(pts) < 3:
        return list(pts)
    out = []
    ext = [pts[0]] + list(pts) + [pts[-1]]
    for i in range(1, len(ext) - 2):
        p0, p1, p2, p3 = ext[i - 1], ext[i], ext[i + 1], ext[i + 2]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        for k in range(steps):
            out.append(cub(p1, c1, c2, p2, k / steps))
    out.append(pts[-1])
    return out


def resample(pts, n):
    L = [0]
    for i in range(1, len(pts)): L.append(L[-1] + math.dist(pts[i], pts[i - 1]))
    tot = L[-1] or 1; res = []; j = 0
    for k in range(n + 1):
        d = tot * k / n
        while j < len(L) - 2 and L[j + 1] < d: j += 1
        fr = (d - L[j]) / max(1e-9, L[j + 1] - L[j])
        res.append((pts[j][0] + fr * (pts[j + 1][0] - pts[j][0]), pts[j][1] + fr * (pts[j + 1][1] - pts[j][1])))
    return res


def normals(pts):
    out = []
    for i in range(len(pts)):
        a = pts[max(0, i - 1)]; b = pts[min(len(pts) - 1, i + 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]; l = math.hypot(dx, dy) or 1
        out.append((dy / l, -dx / l))
    return out


def poly(pts, close=True):
    return 'M' + ' L'.join(P(q) for q in pts) + (' Z' if close else '')


def smooth_d(pts, close=False):
    return poly(catmull(pts, 8), close)


def tapered(spine, w0, w1, n=60, power=1.0):
    """Striscia che si assottiglia lungo una spina: rami, code, corpi. Restituisce (contorno, punti, normali, larghezze)."""
    pts = resample(catmull(spine, 16), n)
    ns = normals(pts)
    ws = [w0 + (w1 - w0) * (i / n) ** power for i in range(n + 1)]
    A = [(p[0] + q[0] * w, p[1] + q[1] * w) for p, q, w in zip(pts, ns, ws)]
    B = [(p[0] - q[0] * w, p[1] - q[1] * w) for p, q, w in zip(pts, ns, ws)]
    return poly(A + B[::-1]), pts, ns, ws


def branch(spine, w0, w1, color=None, outline=None):
    d, *_ = tapered(spine, w0 / 2, w1 / 2, 40)
    return path(d, color or C['legno'], outline or 'none', 1)


# ---------- foglie e fiori ----------
def leaf(x, y, ang, s=1, fill=None, line=None, kind='peonia'):
    fill = fill or C['verde']; line = line or C['verde_scuro']
    if kind == 'stretta':   # bambù, orchidea
        d = 'M0 0 C 14 -5, 46 -6, 70 0 C 46 5, 14 5, 0 0 Z'; vein = 'M4 0 L64 0'
    elif kind == 'tonda':    # loto visto di lato
        d = 'M0 0 C 6 -16, 34 -20, 44 0 C 34 20, 6 16, 0 0 Z'; vein = 'M3 0 L40 0'
    else:
        d = 'M0 0 C 10 -11, 36 -13, 56 0 C 36 11, 10 11, 0 0 Z'; vein = 'M3 0 L52 0 M18 0 L28 -6 M30 0 L40 -5 M18 0 L28 6 M30 0 L40 5'
    return g(path(d, fill, line, 1.2) + path(vein, 'none', line, .9), x, y, ang, s)


def peony(x, y, s=1, rot=0, cols=None):
    cols = cols or (C['rosa_chiaro'], C['rosa_scuro'], C['rosa'], C['rosa_scuro'], C['cremisi'], C['vino'])
    out = []
    for k in range(9):
        out.append(ellipse(0, -27, 15, 19, cols[0], cols[1], 1.2).replace('/>', f' transform="rotate({k * 40})"/>'))
    for k in range(7):
        out.append(ellipse(0, -17, 11, 13, cols[2], cols[3], 1).replace('/>', f' transform="rotate({20 + k * 51})"/>'))
    for k in range(5):
        out.append(ellipse(0, -9, 8, 9, cols[4], cols[5], 1).replace('/>', f' transform="rotate({10 + k * 72})"/>'))
    out.append(circle(0, 0, 6, cols[5]))
    out.append(circle(0, -3, 1.6, '#F2C46B') + circle(3, 1.5, 1.6, '#F2C46B') + circle(-3, 1.5, 1.6, '#F2C46B'))
    return g(''.join(out), x, y, rot, s)


def bud(x, y, ang, s=1, col=None, line=None):
    col = col or C['rosa']; line = line or C['rosa_scuro']
    return g(ellipse(0, -8, 9, 13, col, line, 1) + path('M-9 -2 C -6 6, 6 6, 9 -2 C 5 2, -5 2, -9 -2 Z', C['verde'], C['verde_scuro'], 1), x, y, ang, s)


def plum(x, y, s=1, col=None, line=None, center=None):
    col = col or C['avorio']; line = line or '#C99A5B'; center = center or '#E2A15C'
    petals = ''.join(circle(math.cos(math.radians(-90 + k * 72)) * 5.5, math.sin(math.radians(-90 + k * 72)) * 5.5, 5, col, line, .8) for k in range(5))
    stamens = ''.join(path(f'M0 0 L{f(math.cos(math.radians(k * 45)) * 5)} {f(math.sin(math.radians(k * 45)) * 5)}', 'none', center, .6) for k in range(8))
    return g(petals + circle(0, 0, 2.6, center) + stamens, x, y, 0, s)


def chrysanthemum(x, y, s=1, outer=None, inner=None, line=None, n=22, spider=False):
    outer = outer or C['oro']; inner = inner or C['oro_chiaro']; line = line or C['oro_scuro']
    o = []
    if spider:
        for k in range(n):
            a = k * 360 / n
            o.append(path(f'M0 0 C 4 -10, -2 -22, 3 -30 C 5 -27, 3 -24, 4 -20', 'none', line, 3.2).replace('/>', f' transform="rotate({f(a)})"/>'))
            o.append(path(f'M0 0 C 4 -10, -2 -22, 3 -30 C 5 -27, 3 -24, 4 -20', 'none', outer, 1.8).replace('/>', f' transform="rotate({f(a)})"/>'))
    else:
        for k in range(n):
            o.append(ellipse(0, -15, 2.8, 12, outer, line, .6).replace('/>', f' transform="rotate({f(k * 360 / n)})"/>'))
    for k in range(16):
        o.append(ellipse(0, -9, 2.4, 8, inner, line, .5).replace('/>', f' transform="rotate({f(k * 360 / 16 + 11)})"/>'))
    o.append(circle(0, 0, 5, line))
    return g(''.join(o), x, y, 0, s)


def lotus(x, y, s=1, col=None, tip=None, line=None, open_=1.0):
    col = col or C['rosa_chiaro']; tip = tip or C['rosa']; line = line or C['rosa_scuro']
    o = []
    angs = [-70, -40, -14, 14, 40, 70] if open_ > .5 else [-28, 0, 28]
    for a in angs:
        sp = 1 - abs(a) / 140
        o.append(g(path('M0 0 C -14 -14, -12 -40, 0 -56 C 12 -40, 14 -14, 0 0 Z', col, line, 1.2) + path('M0 -56 C -5 -48, -6 -42, -6 -38 C -3 -42, 3 -42, 6 -38 C 6 -42, 5 -48, 0 -56 Z', tip), 0, 0, a * open_, 1, sx=1, sy=sp))
    o.append(g(path('M0 0 C -12 -14, -10 -42, 0 -60 C 10 -42, 12 -14, 0 0 Z', col, line, 1.2) + path('M0 -60 C -5 -52, -6 -45, -6 -40 C -3 -44, 3 -44, 6 -40 C 6 -45, 5 -52, 0 -60 Z', tip)))
    o.append(path('M-14 -2 C -8 -8, 8 -8, 14 -2 C 8 2, -8 2, -14 -2 Z', C['oro'], C['oro_scuro'], 1))
    return g(''.join(o), x, y, 0, s)


def lotus_leaf(x, y, r, s=1, tilt=.45, col=None, line=None):
    col = col or C['verde']; line = line or C['verde_scuro']
    veins = ''.join(path(f'M0 0 L{f(math.cos(math.radians(a)) * r * .92)} {f(math.sin(math.radians(a)) * r * .92)}', 'none', line, 1) for a in range(0, 360, 30))
    rim = path(f'M{-r} 0 A {r} {r} 0 0 1 {r} 0 A {r} {r} 0 0 1 {-r} 0 Z', col, line, 1.4)
    return g(g(rim + veins + circle(0, 0, 3, line), 0, 0, 0, 1, sx=1, sy=tilt), x, y, 0, s)


def bamboo(x0, y0, x1, y1, w, n=5, col=None, line=None):
    col = col or C['verde']; line = line or C['verde_scuro']
    o = []
    for i in range(n):
        ax = x0 + (x1 - x0) * i / n; ay = y0 + (y1 - y0) * i / n; bx = x0 + (x1 - x0) * (i + 1) / n; by = y0 + (y1 - y0) * (i + 1) / n
        o.append(path(f'M{f(ax)} {f(ay)} L{f(bx)} {f(by)}', 'none', line, w + 2.4))
        o.append(path(f'M{f(ax)} {f(ay)} L{f(bx)} {f(by)}', 'none', col, w))
        ang = math.atan2(by - ay, bx - ax); nx, ny = -math.sin(ang), math.cos(ang)
        o.append(path(f'M{f(bx - nx * (w / 2 + 1.5))} {f(by - ny * (w / 2 + 1.5))} L{f(bx + nx * (w / 2 + 1.5))} {f(by + ny * (w / 2 + 1.5))}', 'none', line, 2.2))
    return ''.join(o)


def pine_tuft(x, y, ang, s=1, col=None, line=None):
    """Ventaglio di aghi di pino, come nei tappeti: un semicerchio di tratti."""
    col = col or C['pino']; line = line or C['verde_scuro']
    o = [path('M-26 0 A 26 26 0 0 1 26 0 Z', col, line, 1.2)]
    for a in range(-80, 81, 16):
        o.append(path(f'M0 0 L{f(math.sin(math.radians(a)) * 24)} {f(-math.cos(math.radians(a)) * 24)}', 'none', C['giada'], 1.1))
    return g(''.join(o), x, y, ang, s)


def ruyi(x, y, s=1, rot=0, fill=None, line=None, lobes=3):
    """Nuvola ruyi: tre lobi a fungo con riccioli interni."""
    fill = fill or C['giada']; line = line or C['pino']
    if lobes == 3:
        d = 'M0 0 C -18 -4, -22 -26, -6 -30 C -2 -46, 22 -48, 26 -32 C 42 -36, 52 -16, 38 -4 C 30 4, 10 4, 0 0 Z'
        curls = 'M10 -14 C 6 -22, 16 -26, 18 -18 C 19 -14, 14 -12, 12 -15 M-6 -14 C -10 -20, -2 -24, 0 -18 M26 -14 C 24 -20, 32 -22, 32 -16'
    else:
        d = 'M0 0 C -7 -16, 13 -24, 19 -9 C 22 -27, 48 -26, 46 -6 C 60 -13, 70 4, 56 12 L 2 12 C -10 12, -12 1, 0 0 Z'
        curls = 'M8 4 C 8 -4, 18 -4, 18 3 M28 2 C 28 -9, 42 -9, 42 1'
    return g(path(d, fill, line, 1.5) + path(curls, 'none', line, 1.3), x, y, rot, s)


def cloud_band(x, y, length, s=1, fill=None, line=None):
    """Nuvola lunga a riccioli in fila (fascia)."""
    fill = fill or C['giada']; line = line or C['pino']
    n = max(2, int(length / 30)); d = f'M0 10 '
    for i in range(n):
        cx = i * 30
        d += f'C {cx} -4, {cx + 26} -8, {cx + 30} 6 '
    d += f'C {n * 30 + 14} 10, {n * 30 + 10} 22, {n * 30 - 6} 20 L 4 20 C -8 20, -10 12, 0 10 Z'
    curls = ' '.join(f'M{i * 30 + 10} 12 C {i * 30 + 8} 4, {i * 30 + 20} 2, {i * 30 + 20} 10' for i in range(n))
    return g(path(d, fill, line, 1.4) + path(curls, 'none', line, 1.2), x, y, 0, s)


def waves(x, y, w, rows=3, s=1, fill=None, line=None, foam=None):
    """Onde a scaglie (motivo del mare): file di archi sovrapposti."""
    fill = fill or C['azzurro']; line = line or C['blu_scuro']; foam = foam or C['crema']
    o = []
    for r in range(rows):
        off = 15 if r % 2 else 0
        for i in range(-1, int(w / 30) + 1):
            cx = i * 30 + off; cy = r * 14
            o.append(path(f'M{cx - 15} {cy + 14} A 15 15 0 0 1 {cx + 15} {cy + 14} Z', fill, line, 1.2))
            o.append(path(f'M{cx - 9} {cy + 14} A 9 9 0 0 1 {cx + 9} {cy + 14}', 'none', foam, 1.1))
            o.append(path(f'M{cx - 4} {cy + 14} A 4 4 0 0 1 {cx + 4} {cy + 14}', 'none', foam, 1))
    clip = f'<clipPath id="wc{x}{y}"><rect x="0" y="0" width="{w}" height="{rows * 14 + 14}"/></clipPath>'
    return g(clip + f'<g clip-path="url(#wc{x}{y})">' + ''.join(o) + '</g>', x, y, 0, s)


def crest(x, y, s=1, rot=0, fill=None, line=None, foam=None):
    """Cresta d'onda con artigli di spuma."""
    fill = fill or C['azzurro']; line = line or C['blu_scuro']; foam = foam or C['crema']
    d = 'M0 40 C 4 10, 30 -6, 56 2 C 70 6, 76 18, 66 26 C 60 18, 50 16, 44 22 C 52 22, 56 30, 50 36 C 44 30, 34 30, 30 40 Z'
    claws = 'M66 26 C 72 22, 78 24, 80 30 M50 36 C 56 34, 62 36, 62 42 M56 2 C 64 -2, 72 2, 74 8'
    return g(path(d, fill, line, 1.5) + path('M10 36 C 14 18, 32 6, 50 10', 'none', foam, 1.4) + path(claws, 'none', foam, 2), x, y, rot, s)


def rock(x, y, s=1, fill=None, line=None, holes=3, seed=1):
    """Roccia del lago Tai: profilo bitorzoluto con buchi."""
    fill = fill or C['grigio']; line = line or C['grigio_scuro']
    rnd = random.Random(seed)
    pts = []
    for k in range(14):
        a = math.pi * 2 * k / 14
        r = 1 + rnd.uniform(-.18, .22)
        pts.append((math.cos(a) * 34 * r, math.sin(a) * 52 * r - 10))
    o = [path(smooth_d(pts + pts[:1], True), fill, line, 1.6)]
    for h in range(holes):
        hx = rnd.uniform(-16, 16); hy = rnd.uniform(-44, 14); hr = rnd.uniform(4, 9)
        o.append(ellipse(hx, hy, hr, hr * 1.4, C['grigio_scuro'], line, 1, rnd.uniform(-30, 30)))
    o.append(path('M-20 -30 C -12 -20, -16 -6, -8 4 M14 -40 C 20 -30, 12 -18, 18 -6', 'none', line, 1.1))
    return g(''.join(o), x, y, 0, s)


def roundel(cx, cy, r, line=None, w=2.4, fill='none'):
    line = line or C['oro']
    return circle(cx, cy, r, fill, line, w) + circle(cx, cy, r - 6, 'none', line, 1)


def flame(x, y, s=1, rot=0, fill=None, line=None):
    fill = fill or C['rosso']; line = line or C['rosso_scuro']
    d = 'M0 0 C -8 -10, -4 -22, 4 -30 C 4 -20, 12 -18, 12 -26 C 20 -14, 16 -4, 8 0 Z'
    return g(path(d, fill, line, 1), x, y, rot, s)


def pearl(x, y, s=1):
    fl = ''.join(flame(0, 0, .8, a, C['albicocca'], C['rosso_scuro']) for a in range(0, 360, 45))
    return g(fl + circle(0, 0, 12, C['crema'], '#C99A5B', 1.4) + path('M0 0 C 0 -5, 6 -5, 6 0 C 6 6, -4 7, -6 0 C -7 -8, 4 -11, 9 -4', 'none', '#C99A5B', 1.3), x, y, 0, s)


def write(path_, content):
    with open(path_, 'w', encoding='utf-8') as fh:
        fh.write(content)
