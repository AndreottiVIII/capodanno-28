"""Vasi, bruciaincensi, cento antichità, onde, rocce, carpe."""
import math
from lib import *

# ---------------------------------------------------------------- vasi
PROFILES = {
    'balaustro': [(0, 18), (6, 15), (34, 11), (52, 18), (66, 34), (84, 46), (104, 44), (120, 32), (130, 26), (134, 26)],
    'meiping': [(0, 12), (6, 10), (14, 22), (34, 44), (56, 48), (86, 40), (112, 28), (126, 24), (132, 24)],
    'zucca': [(0, 12), (6, 10), (20, 24), (34, 26), (46, 16), (56, 22), (78, 42), (100, 44), (120, 32), (130, 26), (134, 26)],
    'classico': [(0, 24), (6, 20), (26, 13), (44, 26), (62, 42), (80, 46), (100, 38), (116, 28), (122, 28)],
}


def vase(kind, cx, top, ground=None, ink=None, decor='fiore', s=1):
    ground = ground or C['crema']; ink = ink or C['blu']
    prof = PROFILES[kind]; H = prof[-1][0]
    dense = catmull([(w, y) for y, w in prof], 20)   # profilo morbido, senza gradini tra un punto e l'altro

    def wid(y):
        for (w0, y0), (w1, y1) in zip(dense, dense[1:]):
            if y0 <= y <= y1 and y1 > y0:
                return w0 + (w1 - w0) * (y - y0) / (y1 - y0)
        return prof[-1][1] if y >= H else prof[0][1]

    def band(y, h):
        pts = [(cx + wid(yy), top + yy) for yy in range(y, y + h + 1)] + [(cx - wid(yy), top + yy) for yy in range(y + h, y - 1, -1)]
        return poly(pts)
    R = [(cx + wid(y), top + y) for y in range(0, H + 1, 2)]; L = [(cx - wid(y), top + y) for y in range(H, -1, -2)]
    o = [path(poly(R + L), ground, ink, 1.6), path(band(0, 6), ink), path(band(H - 12, 12), ink)]
    widest = max(prof, key=lambda q: q[1])[0]
    if decor != 'liscio':
        # lambrecchini sulla spalla e petali di loto alla base
        ys = int(widest * .45); ws = wid(ys); n = max(4, int(ws / 9))
        o.append(path(f'M{f(cx - wid(ys - 3))} {top + ys - 3} L{f(cx + wid(ys - 3))} {top + ys - 3}', 'none', ink, 1.4))
        for i in range(n):
            x0 = cx - ws * .92 + i * (ws * 1.84 / n); x1 = x0 + ws * 1.84 / n; xm = (x0 + x1) / 2
            o.append(path(f'M{f(x0)} {top + ys - 3} C {f(x0)} {top + ys + 6}, {f(xm - 3)} {top + ys + 9}, {f(xm)} {top + ys + 12} C {f(xm + 3)} {top + ys + 9}, {f(x1)} {top + ys + 6}, {f(x1)} {top + ys - 3}', 'none', ink, 1.2))
        yb = H - 14; wb = wid(yb); nb = max(4, int(wb / 8))
        for i in range(nb):
            x0 = cx - wb * .9 + i * (wb * 1.8 / nb); x1 = x0 + wb * 1.8 / nb; xm = (x0 + x1) / 2
            o.append(path(f'M{f(x0)} {top + yb} C {f(x0)} {top + yb - 10}, {f(xm)} {top + yb - 16}, {f(xm)} {top + yb - 18} C {f(xm)} {top + yb - 16}, {f(x1)} {top + yb - 10}, {f(x1)} {top + yb}', ink if i % 2 else 'none', ink, 1.1))
    if decor == 'fiore':
        o.append(circle(cx, top + widest, 17, 'none', ink, 2))
        o.append(g(''.join(g(ellipse(0, -8, 4, 7, ink), 0, 0, k * 60) for k in range(6)) + circle(0, 0, 3, ground), cx, top + widest))
        o.append(path(f'M{cx - 38} {top + widest - 16} C {cx - 30} {top + widest - 22}, {cx - 22} {top + widest - 12}, {cx - 14} {top + widest - 18} M{cx + 14} {top + widest - 18} C {cx + 22} {top + widest - 12}, {cx + 30} {top + widest - 22}, {cx + 38} {top + widest - 16}', 'none', ink, 1.6))
    elif decor == 'nuvole':
        o.append(g(ruyi(0, 0, .5, 0, ground, ink), cx - 22, top + widest + 6) + g(ruyi(0, 0, .45, 0, ground, ink, 2), cx + 2, top + widest - 12))
    elif decor == 'liscio':
        o.append(path(f'M{cx - wid(widest) + 8} {top + widest - 20} C {cx - wid(widest) + 4} {top + widest}, {cx - wid(widest) + 8} {top + widest + 20}, {cx - wid(widest) + 14} {top + widest + 30}', 'none', C['carta'], 3, ' opacity=".5"'))
    o.append(path(f'M{cx - 34} {top + H + 2} L{cx + 34} {top + H + 2} L{cx + 40} {top + H + 14} L{cx - 40} {top + H + 14} Z', C['legno']))
    return g(''.join(o), 0, 0, 0, s)


def vaso(v):
    if v == 2:
        return svg(200, 200, vase('balaustro', 100, 40, decor='fiore'))
    if v == 3:
        return svg(200, 200, vase('meiping', 100, 40, decor='nuvole'))
    if v == 4:
        return svg(200, 200, vase('zucca', 100, 36, C['oro'], C['bruno'], 'fiore'))
    if v == 5:   # con rami di pruno
        b = branch([(100, 165), (96, 120), (86, 80), (60, 40), (20, 20)], 7, 2) + branch([(102, 165), (108, 120), (130, 70), (170, 40)], 6, 2) + branch([(88, 84), (120, 60)], 3, 1.5)
        return svg(200, 300, b + ''.join(plum(x, y, s) for x, y, s in [(60, 40, 1.1), (20, 22, .9), (170, 40, 1), (120, 62, .9), (140, 52, .8), (84, 70, .8)]) + vase('meiping', 100, 150, decor='fiore'))
    if v == 6:
        return svg(200, 200, vase('classico', 100, 40, C['celadon'], C['verde_scuro'], 'liscio'))
    if v == 7:
        return svg(300, 220, vase('balaustro', 90, 60, decor='fiore', s=1) + g(vase('meiping', 0, 0, C['crema'], C['rosso_scuro'], 'nuvole'), 200, 70, 0, 1))
    raise ValueError(v)


# ---------------------------------------------------------------- bruciaincensi
def censer(body=None, line=None, lion=False, smoke=False):
    body = body or C['bronzo']; line = line or C['bronzo_scuro']
    o = []
    if smoke:
        o.append(path('M0 -60 C -20 -90, 20 -110, 0 -140 C -16 -160, 10 -180, 24 -190 M10 -60 C 30 -86, 8 -104, 26 -126', 'none', C['grigio'], 3, ' opacity=".8"'))
    o.append(path('M-40 0 L -46 40 L -38 40 L -30 6 M40 0 L 46 40 L 38 40 L 30 6 M-6 8 L -4 44 L 4 44 L 6 8', body, line, 1.4))   # tre piedi
    o.append(path('M-56 -30 C -58 0, -30 14, 0 14 C 30 14, 58 0, 56 -30 Z', body, line, 1.6))
    o.append(path('M-50 -14 C -20 -4, 20 -4, 50 -14', 'none', C['oro'], 2))
    o.append(path('M-62 -32 L 62 -32 L 58 -24 L -58 -24 Z', body, line, 1.4))
    o.append(path('M-56 -32 C -70 -46, -74 -26, -60 -24 M56 -32 C 70 -46, 74 -26, 60 -24', 'none', line, 4))   # manici
    o.append(path('M-40 -32 C -36 -56, 36 -56, 40 -32 Z', body, line, 1.4))   # coperchio
    o.append(path('M-24 -40 C -16 -46, -8 -40, 0 -46 C 8 -40, 16 -46, 24 -40', 'none', C['oro'], 1.6))
    if lion:
        o.append(path('M-12 -50 C -16 -66, -4 -74, 4 -70 C 14 -72, 18 -60, 12 -50 Z', C['oro'], C['bruno'], 1.4) + circle(-2, -64, 2, C['bruno']) + path('M-8 -58 C -4 -54, 4 -54, 8 -58', 'none', C['bruno'], 1.2))
    else:
        o.append(circle(0, -52, 6, C['oro'], C['bruno'], 1.4))
    o.append(g(''.join(ellipse(0, -6, 3, 6, C['oro'], 'none', 1, k * 72) for k in range(5)), 0, -10, 0, 1.2))
    return ''.join(o)


def incensiere(v):
    if v == 1:
        return svg(200, 160, g(censer(), 100, 100))
    if v == 2:
        return svg(200, 180, g(censer(lion=True), 100, 120))
    if v == 3:
        return svg(200, 300, g(censer(smoke=True), 100, 240))
    if v == 4:
        return svg(220, 180, g(censer(C['oro_scuro'], C['bruno'], lion=True), 110, 110, 0, 1.1) + ruyi(10, 170, .6))
    raise ValueError(v)


# ---------------------------------------------------------------- cento antichità
def books():
    o = ''
    for i, (c, w) in enumerate([(C['blu'], 120), (C['oro'], 110), (C['rosso'], 116)]):
        y = -i * 20
        o += f'<rect x="{-w / 2}" y="{y - 18}" width="{w}" height="18" fill="{c}" stroke="{C["blu_scuro"]}" stroke-width="1.4"/>'
        o += path(f'M{-w / 2 + 14} {y - 18} V {y} M{w / 2 - 14} {y - 18} V {y}', 'none', C['crema'], 2)
        o += f'<rect x="{-12}" y="{y - 14}" width="24" height="10" fill="{C["crema"]}" stroke="{C["blu_scuro"]}" stroke-width="1"/>'
    return o


def scroll():
    return f'<rect x="-70" y="-14" width="140" height="28" fill="{C["avorio"]}" stroke="{C["bruno"]}" stroke-width="1.4"/>' + \
        path('M-56 -6 C -40 -10, -30 4, -14 -2 M0 -8 L 4 6 L 10 -6', 'none', C['grigio_scuro'], 1.4) + \
        ''.join(f'<rect x="{x}" y="-20" width="10" height="40" rx="3" fill="{C["legno"]}"/>' + circle(x + 5, -22, 4, C['oro']) + circle(x + 5, 22, 4, C['oro']) for x in (-80, 70)) + \
        path('M-70 14 C -60 30, -40 36, -30 30', 'none', C['rosso'], 2)


def goboard():
    o = f'<rect x="-60" y="-50" width="120" height="100" fill="{C["legno"]}"/>' + f'<rect x="-60" y="-60" width="120" height="100" fill="#D9AE6B" stroke="{C["bruno"]}" stroke-width="1.6"/>'
    o += ''.join(path(f'M{-50 + i * 12.5} -50 V 30 M-50 {-50 + i * 10} H 50', 'none', C['bruno'], .8) for i in range(9))
    o += circle(-25, -30, 5, C['nero']) + circle(0, -10, 5, C['carta'], C['grigio_scuro'], .8) + circle(12.5, -20, 5, C['nero']) + circle(-12.5, 0, 5, C['carta'], C['grigio_scuro'], .8)
    o += ellipse(-90, 30, 22, 16, C['legno'], C['bruno'], 1.4) + ellipse(90, 30, 22, 16, C['legno'], C['bruno'], 1.4) + ellipse(-90, 24, 18, 6, C['nero']) + ellipse(90, 24, 18, 6, C['carta'])
    return o


def ruyi_sceptre():
    d, *_ = tapered([(-80, 30), (-30, 20), (20, 0), (60, -20)], 5, 4, 30)
    return path(d, C['giada'], C['verde_scuro'], 1.4) + g(ruyi(0, 0, .9, 0, C['giada'], C['verde_scuro']), 50, -10, -20) + circle(-20, 18, 6, C['rosso'], C['rosso_scuro'], 1) + path('M-80 30 C -90 40, -84 56, -74 50', 'none', C['rosso'], 2)


def brushes():
    o = ''
    for a in (-18, -6, 6, 18):
        o += g(f'<rect x="-3" y="-90" width="6" height="80" fill="{C["bronzo"]}" stroke="{C["bronzo_scuro"]}" stroke-width="1"/>' + path('M-3 -90 C -5 -100, 0 -110, 0 -114 C 0 -110, 5 -100, 3 -90 Z', C['nero']), 0, 0, a)
    return o + path('M-30 -30 L 30 -30 L 26 30 L -26 30 Z', C['crema'], C['blu'], 1.6) + path('M-28 -20 H 28 M-27 18 H 27', 'none', C['blu'], 3) + g(ruyi(0, 0, .4, 0, C['crema'], C['blu']), -8, 6)


def guqin():
    o = path('M-110 -14 C -60 -22, 60 -22, 110 -10 L 104 14 C 60 20, -60 20, -106 14 Z', C['legno'], C['nero'], 1.6)
    o += ''.join(path(f'M-100 {-8 + i * 4} L 100 {-6 + i * 4}', 'none', C['oro_chiaro'], .8) for i in range(7))
    o += ''.join(circle(-60 + i * 12, -16, 1.8, C['crema']) for i in range(10))
    return o + path('M104 14 C 116 30, 110 44, 98 46', 'none', C['rosso'], 2.5)


def endless_knot():
    o = ''
    for i in range(4):
        o += path(f'M{-36 + i * 24} -48 L {-36 + i * 24} 48', 'none', C['rosso_scuro'], 9) + path(f'M-48 {-36 + i * 24} L 48 {-36 + i * 24}', 'none', C['rosso_scuro'], 9)
        o += path(f'M{-36 + i * 24} -48 L {-36 + i * 24} 48', 'none', C['rosso'], 5) + path(f'M-48 {-36 + i * 24} L 48 {-36 + i * 24}', 'none', C['rosso'], 5)
    return g(o + path('M-36 -48 C -36 -64, -60 -64, -60 -48 C -60 -36, -48 -36, -48 -36 M36 48 C 36 64, 60 64, 60 48 C 60 36, 48 36, 48 36', 'none', C['rosso'], 5), 0, 0, 45, .8) + \
        path('M0 56 L -8 90 M0 56 L 8 90 M0 56 L 0 96', 'none', C['rosso'], 2.4)


def antichita(v):
    from fam_cielo import coin
    if v == 1: return svg(180, 120, g(books(), 90, 100))
    if v == 2: return svg(200, 100, g(scroll(), 100, 50))
    if v == 3: return svg(260, 150, g(goboard(), 130, 80))
    if v == 4: return svg(200, 120, g(ruyi_sceptre(), 100, 60))
    if v == 5: return svg(160, 160, coin(80, 80, 60) + path('M80 140 C 70 150, 74 160, 84 158', 'none', C['rosso'], 2.4))
    if v == 6: return svg(140, 200, g(brushes(), 70, 160))
    if v == 7: return svg(260, 100, g(guqin(), 130, 46))
    if v == 8: return svg(140, 200, g(endless_knot(), 70, 80))
    raise ValueError(v)


# ---------------------------------------------------------------- onde e rocce
def onda(v):
    if v == 1: return svg(360, 120, waves(0, 50, 360, 4) + crest(20, 6, 1) + crest(220, 10, .9))
    if v == 2: return svg(260, 220, waves(0, 160, 260, 4) + crest(30, 40, 2.4))
    if v == 3: return svg(300, 140, waves(0, 0, 300, 9, 1, C['blu'], C['blu_scuro']))
    if v == 4: return svg(320, 240, rock(160, 140, 1.3, seed=5) + waves(0, 170, 320, 4) + crest(10, 130, .9) + crest(240, 128, .9))
    raise ValueError(v)


def orchid(x, y, s=1):
    lv = ''.join(path(f'M0 0 C {a * .4} -40, {a} -80, {a * 1.4} -100', 'none', C['verde'], 3) for a in (-40, -10, 30, 60))
    fl = ''.join(g(path('M0 0 C -6 -8, -4 -16, 0 -18 C 4 -16, 6 -8, 0 0 Z', C['albicocca'], C['bruno'], 1).replace('/>', '/>') * 1, 0, 0, a) for a in (0, 72, 144, 216, 288))
    return g(lv + g(fl + circle(0, 0, 2, C['rosso']), 20, -70) + g(fl + circle(0, 0, 2, C['rosso']), 46, -86, 0, .8), x, y, 0, s)


def lingzhi(x, y, s=1):
    cap = lambda: path('M-24 0 C -24 -18, 24 -18, 24 0 C 14 -4, -14 -4, -24 0 Z', C['bruno'], C['nero'], 1.2) + path('M-18 -4 C -10 -10, 10 -10, 18 -4 M-10 -8 C -4 -12, 4 -12, 10 -8', 'none', C['oro'], 1)
    return g(path('M0 0 L 0 30', 'none', C['bruno'], 3) + cap() + g(cap(), -22, 18, -20, .7) + g(cap(), 22, 22, 20, .6), x, y, 0, s)


def roccia(v):
    if v == 1: return svg(160, 220, rock(80, 130, 1.5, seed=2))
    if v == 2: return svg(220, 220, rock(80, 140, 1.2, seed=6) + orchid(140, 210, 1))
    if v == 3: return svg(160, 220, rock(80, 130, 1.5, C['azzurro_chiaro'], C['blu_scuro'], 5, seed=8))
    if v == 4: return svg(220, 220, rock(100, 130, 1.3, seed=12) + lingzhi(170, 170, 1) + lingzhi(40, 190, .8))
    raise ValueError(v)


# ---------------------------------------------------------------- carpe
def carp(body=None, line=None, fin=None, curve=0.0):
    """Carpa rivolta a sinistra, corpo lungo una spina incurvata."""
    body = body or C['albicocca']; line = line or C['rosso_scuro']; fin = fin or C['rosso']
    sp = [(-60, 0), (-20, -6 - 30 * curve), (30, -2 - 40 * curve), (70, 14 + 10 * curve)]
    N = 60
    pts = resample(catmull(sp, 16), N); ns = normals(pts)
    ws = [26 * math.sin(math.pi * (.1 + .82 * i / N)) ** .9 * (1 - .55 * (i / N) ** 2) + 2 for i in range(N + 1)]   # muso tondo, pancia piena, coda sottile
    A = [(p[0] + q[0] * w, p[1] + q[1] * w) for p, q, w in zip(pts, ns, ws)]
    B = [(p[0] - q[0] * w, p[1] - q[1] * w) for p, q, w in zip(pts, ns, ws)]
    t0 = (pts[0][0] - pts[2][0], pts[0][1] - pts[2][1]); l0 = math.hypot(*t0) or 1; t0 = (t0[0] / l0, t0[1] / l0)
    nose = (pts[0][0] + t0[0] * ws[0] * 1.6, pts[0][1] + t0[1] * ws[0] * 1.6)
    d = f'M{P(B[0])} Q{P(nose)} {P(A[0])} L' + ' L'.join(P(q) for q in A[1:] + B[::-1]) + ' Z'
    o = []
    e = pts[-1]
    ta = math.degrees(math.atan2(pts[-1][1] - pts[-5][1], pts[-1][0] - pts[-5][0]))
    o.append(g(path('M0 0 C 16 -20, 34 -30, 40 -24 C 30 -10, 30 10, 40 24 C 34 30, 16 20, 0 0 Z', fin, line, 1.2) + path('M4 0 L 34 -18 M4 0 L 30 0 M4 0 L 34 18', 'none', line, .8), e[0], e[1], ta))
    o.append(path(d, body, line, 1.6))
    for j in range(10, 52, 6):   # scaglie
        for side in (-0.5, 0, .5):
            p = pts[j]; n = ns[j]; cc = (p[0] + n[0] * ws[j] * side, p[1] + n[1] * ws[j] * side); r = ws[j] * .3
            o.append(path(f'M{f(cc[0] - r * n[0])} {f(cc[1] - r * n[1])} A {f(r)} {f(r)} 0 0 0 {f(cc[0] + r * n[0])} {f(cc[1] + r * n[1])}', 'none', line, .9))
    p = pts[22]; n = ns[22]
    o.append(path(f'M{P(p)} C {f(p[0] + n[0] * 30 + 10)} {f(p[1] + n[1] * 30)}, {f(p[0] + n[0] * 34 + 30)} {f(p[1] + n[1] * 26)}, {f(p[0] + 34)} {f(p[1] + n[1] * 6)} Z', fin, line, 1))   # dorsale
    o.append(circle(pts[3][0] + 4, pts[3][1] - 6, 4, C['crema'], line, 1) + circle(pts[3][0] + 3, pts[3][1] - 6, 2, C['nero']))
    o.append(path(f'M{f(pts[0][0])} {f(pts[0][1] + 6)} C {f(pts[0][0] - 14)} {f(pts[0][1] + 14)}, {f(pts[0][0] - 20)} {f(pts[0][1] + 30)}, {f(pts[0][0] - 8)} {f(pts[0][1] + 36)}', 'none', line, 1.4))   # barbigli
    o.append(path(f'M{f(pts[10][0])} {f(pts[10][1] - 14)} C {f(pts[10][0] + 4)} {f(pts[10][1] - 4)}, {f(pts[10][0] + 4)} {f(pts[10][1] + 6)}, {f(pts[10][0])} {f(pts[10][1] + 14)}', 'none', line, 1.2))
    return ''.join(o)


def carpa(v):
    if v == 1:
        return svg(300, 260, waves(0, 200, 300, 4) + crest(20, 170, 1) + g(carp(curve=.6), 150, 110, -35, 1.3))
    if v == 2:
        return svg(300, 300, roundel(150, 150, 140) + g(carp(curve=.5), 150, 90, 0, 1) + g(carp(C['crema'], C['grigio_scuro'], C['rosso'], .5), 150, 210, 180, 1))
    if v == 3:
        return svg(300, 180, g(carp(C['oro'], C['bruno'], C['oro_scuro'], .2), 140, 90, 0, 1.3))
    if v == 4:
        return svg(320, 240, waves(0, 180, 320, 4, 1, C['blu'], C['blu_scuro']) + crest(200, 130, 1.2) + g(carp(curve=.4), 130, 110, -15, 1.2))
    if v == 5:
        from fam_flora import loto
        return svg(320, 240, lotus_leaf(240, 190, 50) + lotus(240, 150, 1, C['rosa_chiaro']) + g(carp(curve=.3), 120, 140, 10, 1.2))
    raise ValueError(v)
