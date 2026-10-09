"""Draghi, fenici, gru, nuvole ruyi, pipistrelli, farfalle, uccelli."""
import math
from lib import *

# ---------------------------------------------------------------- draghi
HEAD = '''
  <path d="M8 -20 C 22 -40, 36 -34, 30 -22 C 46 -34, 54 -20, 40 -12 C 56 -10, 54 6, 38 4 C 50 16, 34 26, 26 14 Z" fill="{mane}" stroke="{mane_l}" stroke-width="1"/>
  <path d="M6 -16 C 14 -34, 30 -46, 48 -50 M24 -36 C 30 -40, 34 -46, 34 -54" fill="none" stroke="#F4EEE2" stroke-width="4" stroke-linecap="round"/>
  <path d="M14 -10 C 4 -26, -24 -26, -38 -14 L -56 -12 C -64 -11, -64 -1, -56 0 L -36 2 C -26 12, 2 14, 14 6 Z" fill="{body}" stroke="{line}" stroke-width="1.6"/>
  <path d="M-36 2 L -58 14 C -46 22, -24 18, -12 10 Z" fill="{body}" stroke="{line}" stroke-width="1.6"/>
  <path d="M-36 2 L -56 10 L -40 8 L -50 14 L -30 8 Z" fill="#8E2A45"/>
  <path d="M-52 -1 L -48 4 L -44 0 M-44 7 L -40 12 L -37 6" fill="none" stroke="#F4EEE2" stroke-width="1.4"/>
  <path d="M-30 -20 C -22 -28, -12 -26, -6 -20" fill="none" stroke="{line}" stroke-width="2.2"/>
  <circle cx="-18" cy="-14" r="5.2" fill="#F4EEE2" stroke="{line}" stroke-width="1"/><circle cx="-19" cy="-14" r="2.6" fill="#1A1410"/>
  <path d="M-58 -10 C -74 -22, -92 -10, -86 4 C -82 14, -96 22, -104 16" fill="none" stroke="{body}" stroke-width="1.6"/>
  <path d="M-52 12 C -62 28, -82 30, -84 44 C -86 54, -100 56, -106 50" fill="none" stroke="{body}" stroke-width="1.6"/>
  <circle cx="-56" cy="-8" r="1.6" fill="{line}"/>'''

DRAGON_COLS = {
    'oro': dict(body=C['oro'], belly=C['oro_chiaro'], line=C['bruno'], plate='#C99A5B', scale=C['oro_scuro'], fin=C['rosso'], fin_l=C['rosso_scuro'], mane=C['rosso'], mane_l=C['rosso_scuro'], leg_l=C['bruno']),
    'azzurro': dict(body=C['azzurro'], belly=C['azzurro_chiaro'], line=C['blu_scuro'], plate='#8FB2DA', scale=C['blu_scuro'], fin=C['oro'], fin_l=C['bruno'], mane=C['oro'], mane_l=C['bruno'], leg_l=C['blu_scuro']),
    'rosso': dict(body=C['rosso'], belly=C['albicocca'], line=C['rosso_scuro'], plate='#E07A62', scale=C['rosso_scuro'], fin=C['oro'], fin_l=C['bruno'], mane=C['oro'], mane_l=C['bruno'], leg_l=C['rosso_scuro']),
    'giada': dict(body=C['giada'], belly='#CFE6D8', line=C['verde_scuro'], plate='#B5D6C3', scale=C['verde_scuro'], fin=C['oro'], fin_l=C['bruno'], mane=C['rosso'], mane_l=C['rosso_scuro'], leg_l=C['verde_scuro']),
}


def dragon(segs, col='oro', N=180, width=15):
    """Il drago dello script originale, reso parametrico: segs = curve di Bézier della spina (testa al primo punto)."""
    k = DRAGON_COLS[col]
    pts = []
    for sg in segs:
        for i in range(60): pts.append(cub(*sg, i / 60))
    pts.append(segs[-1][3])
    pts = resample(pts, N)
    ns = normals(pts)
    w = lambda i: width * (1 - i / N) ** 0.8 + 2.5
    L1 = [(p[0] + n[0] * w(i), p[1] + n[1] * w(i)) for i, (p, n) in enumerate(zip(pts, ns))]
    L2 = [(p[0] - n[0] * w(i), p[1] - n[1] * w(i)) for i, (p, n) in enumerate(zip(pts, ns))]
    B = [(p[0] - n[0] * w(i) * .15, p[1] - n[1] * w(i) * .15) for i, (p, n) in enumerate(zip(pts, ns))]
    body = poly(L1 + L2[::-1]); belly = poly(B + L2[::-1])
    fins = []
    for i in range(6, N - 12, 7):
        n = ns[i]; p = L1[i]; ww = w(i) * .9 + 3
        tip = (p[0] + n[0] * ww, p[1] + n[1] * ww)
        fins.append(f'M{P(L1[i - 3])} Q{P(tip)} {P(tip)} L{P(L1[i + 3])} Z')
    scales = []
    for i in range(4, N - 6, 3):
        n = ns[i]; p = pts[i]; cc = (p[0] + n[0] * w(i) * .55, p[1] + n[1] * w(i) * .55); r = w(i) * .32
        scales.append(f'M{f(cc[0] - r * n[1])} {f(cc[1] + r * n[0])} A{f(r)} {f(r)} 0 0 1 {f(cc[0] + r * n[1])} {f(cc[1] - r * n[0])}')
    plates = [f'M{P(B[i])} L{P(L2[i])}' for i in range(3, N - 4, 4)]
    legs = []
    for i in (int(N * .16), int(N * .39), int(N * .6), int(N * .78)):
        n = ns[i]; p = L2[i]; ww = w(i); dx, dy = pts[i + 5][0] - pts[i][0], pts[i + 5][1] - pts[i][1]
        knee = (p[0] - n[0] * 22 + dx * 1.2, p[1] - n[1] * 22 + dy * 1.2)
        foot = (knee[0] - n[0] * 14 - dx * .8, knee[1] - n[1] * 14 - dy * .8)
        lw = max(4, ww * .55)
        legs.append(path(f'M{P(p)} Q{P(knee)} {P(foot)}', 'none', k['leg_l'], lw + 2.4))
        legs.append(path(f'M{P(p)} Q{P(knee)} {P(foot)}', 'none', k['body'], lw))
        ang = math.atan2(foot[1] - knee[1], foot[0] - knee[0])
        for da in (-.8, 0, .8):
            a = ang + da; e = (foot[0] + math.cos(a) * 9, foot[1] + math.sin(a) * 9); c2 = (foot[0] + math.cos(a + .5) * 11, foot[1] + math.sin(a + .5) * 11)
            legs.append(path(f'M{P(foot)} Q{P(e)} {P(c2)}', 'none', C['crema'], 2))
        fl = (knee[0] + n[0] * 2 - dx * 1.6, knee[1] + n[1] * 2 - dy * 1.6)
        legs.append(path(f'M{P(knee)} Q{f(fl[0] + 4)} {f(fl[1] - 6)} {P(fl)} Q{f(fl[0] - 2)} {f(fl[1] + 6)} {f(knee[0] + 3)} {f(knee[1] + 3)} Z', k['fin']))
    e = pts[-1]; ta = math.degrees(math.atan2(pts[-1][1] - pts[-6][1], pts[-1][0] - pts[-6][0])) + 90
    tail = g(path('M0 0 C -10 -24, 14 -34, 6 -52 C 22 -36, 20 -14, 30 -20 C 26 -4, 10 4, 0 0 Z', k['fin'], k['fin_l'], 1), e[0], e[1], ta - 90 + 60)
    # testa orientata come la spina
    d0 = math.degrees(math.atan2(pts[3][1] - pts[0][1], pts[3][0] - pts[0][0]))
    head = g(HEAD.format(**k), pts[0][0], pts[0][1], d0 - (-50))
    return ''.join(legs) + path(''.join(fins), k['fin'], k['fin_l'], .8) + tail + path(body, k['body'], k['line'], 1.6) + path(belly, k['belly']) + \
        path(' '.join(plates), 'none', k['plate'], 1) + path(' '.join(scales), 'none', k['scale'], 1) + path(body, 'none', k['line'], 1.6) + head


SPINE_CLASSIC = [((70, 90), (120, 30), (190, 40), (200, 100)), ((200, 100), (210, 160), (260, 200), (320, 170)), ((320, 170), (380, 140), (380, 90), (350, 60))]


def drago(v):
    if v == 2:   # tra le nuvole
        body = ''.join(ruyi(x, y, s, 0, None, None, 3) for x, y, s in [(40, 280, 1.2), (330, 60, 1.1), (400, 260, 1.3), (180, 40, .9)])
        body += g(dragon([((80, 110), (130, 40), (210, 60), (220, 130)), ((220, 130), (230, 200), (300, 220), (350, 170)), ((350, 170), (400, 120), (370, 80), (330, 90))]), 10, 20)
        body += ''.join(cloud_band(x, y, L, 1) for x, y, L in [(30, 200, 90), (250, 300, 120)])
        return svg(480, 360, body)
    if v == 3:   # azzurro
        return svg(460, 330, g(dragon(SPINE_CLASSIC, 'azzurro'), 60, 30) + pearl(38, 148) + ''.join(ruyi(x, y, s) for x, y, s in [(300, 270, 1.2), (30, 270, 1), (390, 40, .8)]))
    if v == 4:   # draghi gemelli con la perla al centro
        one = dragon([((70, 90), (110, 30), (170, 50), (180, 110)), ((180, 110), (190, 170), (230, 200), (260, 160))], 'oro', 140, 13)
        return svg(520, 300, g(one, 290, 30, 0, 1, sx=-1, sy=1) + g(one, 230, 30) + pearl(260, 70, 1.1) + ruyi(220, 280, 1.1) + ruyi(40, 270, .8) + ruyi(420, 270, .8))
    if v == 5:   # drago dell'acqua
        return svg(460, 360, g(dragon([((70, 110), (120, 50), (190, 60), (200, 120)), ((200, 120), (210, 180), (260, 210), (320, 180)), ((320, 180), (380, 150), (380, 110), (350, 90))], 'giada'), 50, 0) +
                   waves(0, 290, 460, 4) + crest(10, 250, 1.1) + crest(330, 248, 1.2, 0))
    if v == 6:   # arrotolato nel tondo
        sp = []
        for i in range(5):
            a0 = math.radians(-120 + i * 80); a1 = math.radians(-120 + (i + 1) * 80); r0 = 120 - i * 18; r1 = 120 - (i + 1) * 18
            p0 = (200 + math.cos(a0) * r0, 200 + math.sin(a0) * r0); p1 = (200 + math.cos(a1) * r1, 200 + math.sin(a1) * r1)
            t0 = (-math.sin(a0), math.cos(a0)); t1 = (-math.sin(a1), math.cos(a1)); k = r0 * .55
            sp.append((p0, (p0[0] + t0[0] * k, p0[1] + t0[1] * k), (p1[0] - t1[0] * k, p1[1] - t1[1] * k), p1))
        return svg(400, 400, roundel(200, 200, 186) + dragon(sp, 'oro', 200, 13) + ''.join(ruyi(200 + math.cos(math.radians(a)) * 160, 200 + math.sin(math.radians(a)) * 160 + 10, .55, 0) for a in (20, 140, 260)))
    if v == 7:   # drago rosso
        return svg(460, 330, g(dragon([((80, 80), (140, 20), (200, 50), (200, 110)), ((200, 110), (200, 170), (270, 210), (330, 170)), ((330, 170), (390, 130), (370, 80), (330, 70))], 'rosso'), 50, 40) + pearl(60, 150) + ruyi(330, 285, 1.1) + ruyi(20, 280, .9))
    raise ValueError(v)


# ---------------------------------------------------------------- nuvole
def nuvola(v):
    if v == 1:
        return svg(260, 150, ruyi(70, 110, 2.2) + ruyi(170, 60, 1.1, 0, C['giada'], C['pino'], 2))
    if v == 2:
        return svg(420, 120, cloud_band(10, 40, 330, 1.1) + ruyi(330, 100, 1))
    if v == 3:
        return svg(320, 220, ruyi(150, 180, 3.6) + ruyi(40, 110, 1.2, -10) + ruyi(250, 90, 1, 15, C['giada'], C['pino'], 2))
    if v == 4:  # a spirale
        o = ''
        for i, a in enumerate(range(0, 360, 60)):
            r = 70; x = 160 + math.cos(math.radians(a)) * r; y = 150 + math.sin(math.radians(a)) * r
            o += ruyi(x - 20, y + 14, .8, a + 90, C['giada'] if i % 2 else C['azzurro_chiaro'], C['pino'])
        sp = [(160 + math.cos(t) * (4 + t * 7), 150 + math.sin(t) * (4 + t * 7)) for t in [i * .2 for i in range(40)]]
        return svg(320, 300, o + path(poly(sp, False), 'none', C['oro'], 3) + circle(160, 150, 6, C['oro']))
    if v == 5:  # d'oro
        return svg(300, 180, ruyi(110, 140, 2.4, 0, C['oro'], C['bruno']) + ruyi(220, 70, 1.2, 0, C['oro_chiaro'], C['bruno'], 2) + ruyi(20, 70, .9, 0, C['oro'], C['bruno']))
    raise ValueError(v)


# ---------------------------------------------------------------- fenici
def phoenix(cols=None, wing_up=True, tail_curl=1.0):
    """Fenice rivolta a sinistra, centro del corpo in (0,0), coda verso destra."""
    k = cols or dict(body=C['rosso'], line=C['rosso_scuro'], wing=C['oro'], wing_l=C['bruno'], tail1=C['giada'], tail2=C['azzurro'], eye=C['oro'])
    o = []
    # piume della coda: lunghe, morbide, con l'occhio
    for i, (dx, dy, c) in enumerate([(220, -60, k['tail1']), (240, 10, k['tail2']), (200, 70, k['tail1'])]):
        sp = [(10, 0), (70, dy * .3 - 10), (140, dy * .8 + 20 * tail_curl), (dx, dy), (dx + 20, dy - 30 * tail_curl)]
        d, pts, ns, ws = tapered(sp, 10, 2, 50)
        o.append(path(d, c, k['line'], 1.2))
        for j in range(8, 46, 6):
            p = pts[j]; n = ns[j]; ww = ws[j] + 6
            o.append(path(f'M{P(p)} L{f(p[0] + n[0] * ww)} {f(p[1] + n[1] * ww)} M{P(p)} L{f(p[0] - n[0] * ww)} {f(p[1] - n[1] * ww)}', 'none', c, 1.4))
        e = pts[-6]
        o.append(ellipse(e[0], e[1], 9, 11, k['eye'], k['line'], 1.2) + circle(e[0], e[1], 4.5, k['line']) + circle(e[0], e[1], 2, k['tail2']))
    # ala
    wing = 'M-6 -6 C 10 -50, 50 -80, 96 -86 C 80 -70, 92 -62, 70 -52 C 84 -46, 76 -38, 56 -34 C 66 -26, 54 -20, 36 -18 C 30 -6, 10 2, -6 -6 Z' if wing_up else \
        'M-6 -2 C 20 -20, 60 -16, 100 -2 C 84 4, 92 12, 70 14 C 80 22, 66 26, 50 22 C 54 32, 38 32, 26 24 C 14 22, 0 12, -6 -2 Z'
    o.append(path(wing, k['wing'], k['wing_l'], 1.4))
    o.append(path('M10 -16 C 30 -40, 56 -60, 84 -76 M20 -14 C 40 -32, 54 -42, 66 -48 M28 -12 C 40 -22, 46 -28, 50 -32' if wing_up else 'M8 0 C 30 -6, 60 -6, 92 -2 M14 8 C 34 8, 50 10, 62 14', 'none', k['wing_l'], 1))
    # corpo e collo
    o.append(path('M-50 -40 C -40 -50, -26 -46, -24 -34 C -20 -16, -6 -14, 14 -10 C 30 -6, 30 14, 10 18 C -14 22, -34 10, -36 -10 C -38 -24, -44 -30, -50 -32 Z', k['body'], k['line'], 1.5))
    o.append(path('M-14 0 C -6 8, 6 10, 16 6', 'none', k['line'], 1))
    # testa, becco, cresta, bargigli
    o.append(path('M-50 -40 L -64 -36 L -50 -33 Z', k['wing'], k['wing_l'], 1))
    o.append(circle(-44, -38, 2.6, C['crema']) + circle(-44.5, -38, 1.3, C['nero']))
    o.append(path('M-42 -46 C -46 -58, -36 -64, -34 -56 M-38 -47 C -36 -60, -26 -62, -28 -52 M-34 -46 C -26 -56, -18 -54, -22 -46', 'none', k['wing'], 2.2))
    o.append(circle(-34, -57, 2.6, k['wing']) + circle(-28, -54, 2.4, k['wing']) + circle(-22, -48, 2.2, k['wing']))
    o.append(path('M-48 -32 C -50 -24, -44 -20, -42 -26', k['body'], k['line'], 1))
    # zampe
    o.append(path('M0 18 L -6 40 M-6 40 L -14 46 M-6 40 L -4 48 M10 16 L 12 40 M12 40 L 4 46 M12 40 L 16 48', 'none', C['oro_scuro'], 2.2))
    return ''.join(o)


def fenice(v):
    if v == 1:
        return svg(400, 260, ruyi(30, 230, 1) + g(phoenix(), 110, 130) + ruyi(300, 250, .9))
    if v == 2:   # sulla roccia
        return svg(360, 330, rock(120, 250, 1.3, seed=4) + g(phoenix(wing_up=False), 130, 120, 0, .9) + leaf(60, 300, -40, 1.2) + leaf(180, 300, -140, 1.1, C['giada']))
    if v == 3:   # con peonie
        return svg(420, 320, g(phoenix(), 140, 120, 0, .95) + leaf(80, 280, -150, 1.6) + leaf(80, 280, -40, 1.4, C['giada']) + peony(80, 280, 1.3) + bud(170, 300, 160, 1) + peony(330, 280, .9, 20))
    if v == 4:   # coppia
        a = phoenix(); b = phoenix(dict(body=C['oro'], line=C['bruno'], wing=C['rosso'], wing_l=C['rosso_scuro'], tail1=C['rosa'], tail2=C['giada'], eye=C['rosso']), wing_up=False)
        return svg(480, 340, g(a, 140, 110, 0, .85) + g(b, 330, 230, 0, .85, sx=-.85, sy=.85) + ruyi(220, 190, .9))
    if v == 5:   # nel tondo
        return svg(400, 400, roundel(200, 200, 186) + g(phoenix(), 150, 200, -10, .95) + ruyi(250, 330, .8) + ruyi(80, 110, .7))
    raise ValueError(v)


# ---------------------------------------------------------------- gru
def crane(pose='vola'):
    """Gru: corpo bianco, collo e coda neri, corona rossa. Testa a sinistra."""
    o = []
    if pose == 'vola':
        o.append(path('M0 0 C 30 -60, 90 -110, 170 -120 C 150 -96, 160 -86, 130 -76 C 146 -66, 136 -58, 110 -52 C 120 -44, 104 -36, 84 -34 C 70 -18, 30 -4, 0 0 Z', C['carta'], C['grigio_scuro'], 1.4))
        o.append(path('M120 -112 C 148 -116, 160 -118, 170 -120 C 150 -96, 160 -86, 130 -76 C 146 -66, 136 -58, 110 -52', C['nero'], C['nero'], 1))
        o.append(path('M10 10 C 40 30, 100 40, 170 30 C 150 46, 156 54, 128 56 C 136 66, 120 70, 98 64 C 80 70, 40 50, 10 10 Z', C['carta'], C['grigio_scuro'], 1.4))
        o.append(path('M140 34 C 160 32, 166 31, 170 30 C 150 46, 156 54, 128 56', C['nero'], C['nero'], 1))
    o.append(ellipse(10, 4, 40, 18, C['carta'], C['grigio_scuro'], 1.4, -8))
    o.append(path('M44 0 C 60 -4, 74 6, 80 16 C 66 12, 58 14, 46 10 Z', C['nero'], C['nero'], 1))   # coda
    neck, *_ = tapered([(-22, -2), (-36, -10), (-40, -24), (-46, -38), (-52, -44)], 6, 4.5, 30)
    o.append(path(neck, C['nero'], C['nero'], 1))  # collo
    o.append(path('M-56 -42 L -82 -36 L -56 -38 Z', C['oro_scuro']))
    o.append(circle(-52, -46, 4, C['rosso']) + circle(-54, -41, 1.3, C['crema']))
    if pose == 'sta':
        o.append(path('M4 18 L 0 70 M0 70 L -10 76 M0 70 L 8 76 M16 16 L 22 70 M22 70 L 14 76 M22 70 L 30 76', 'none', C['grigio_scuro'], 2.2))
    elif pose == 'danza':
        o.append(path('M4 18 L -4 64 M-4 64 L -14 70 M-4 64 L 4 70 M16 16 L 40 50 L 30 74', 'none', C['grigio_scuro'], 2.2))
        o.append(path('M-6 -6 C -40 -60, -20 -100, 30 -120 C 20 -96, 34 -88, 10 -76 C 30 -70, 18 -60, 0 -54 C 8 -40, -4 -30, -6 -6 Z', C['carta'], C['grigio_scuro'], 1.4))
        o.append(path('M20 -114 L 30 -120 C 20 -96, 34 -88, 10 -76', C['nero'], C['nero'], 1))
    else:
        o.append(path('M40 10 L 100 22 M40 14 L 100 30', 'none', C['grigio_scuro'], 2.2))
    return ''.join(o)


def pine_branch(x, y, s=1, flip=False):
    tufts = [(60, -10, -20, 1.2), (110, -30, 10, 1), (150, 0, 30, 1.1), (30, 10, -40, .9)]
    o = branch([(0, 20), (50, 10), (100, -10), (160, -20)], 10, 4) + branch([(100, -10), (130, 10), (160, 20)], 5, 2)
    o += ''.join(pine_tuft(a, b, r, sc) for a, b, r, sc in tufts)
    return g(o, x, y, 0, s, sx=-s if flip else s, sy=s)


def gru(v):
    if v == 1:
        return svg(380, 240, g(crane('vola'), 120, 150) + ruyi(250, 220, .9))
    if v == 2:
        return svg(380, 320, pine_branch(10, 250, 1.4) + g(crane('sta'), 200, 150, 0, 1))
    if v == 3:
        return svg(300, 320, g(crane('danza'), 150, 200) + ruyi(30, 300, .8) + ruyi(200, 300, .7))
    if v == 4:
        return svg(420, 300, g(crane('vola'), 120, 140, 0, .8) + g(crane('sta'), 260, 190, 0, .9, sx=-.9, sy=.9) + leaf(250, 280, -170, 1.1))
    if v == 5:
        return svg(420, 280, cloud_band(20, 200, 200) + ruyi(300, 90, 1.2) + g(crane('vola'), 170, 140, -10, .9) + ruyi(40, 70, .8))
    raise ValueError(v)


# ---------------------------------------------------------------- pipistrelli
def bat(col=None, line=None):
    col = col or C['rosso']; line = line or C['rosso_scuro']
    wing = 'M0 0 C 12 -20, 40 -30, 70 -20 C 62 -12, 66 -4, 56 2 C 60 8, 56 14, 46 14 C 46 20, 40 24, 30 20 C 24 28, 12 22, 6 12 Z'
    o = g(path(wing, col, line, 1.4) + path('M8 -4 C 26 -14, 46 -18, 66 -18 M14 4 C 28 0, 40 2, 52 4', 'none', line, 1)) + g(path(wing, col, line, 1.4) + path('M8 -4 C 26 -14, 46 -18, 66 -18 M14 4 C 28 0, 40 2, 52 4', 'none', line, 1), 0, 0, 0, 1, sx=-1, sy=1)
    o += ellipse(0, 4, 9, 14, col, line, 1.4) + path('M-6 -8 L -9 -18 L -2 -10 M6 -8 L 9 -18 L 2 -10', col, line, 1.2)
    o += circle(-3, -4, 1.6, C['oro']) + circle(3, -4, 1.6, C['oro']) + path('M-6 16 C -3 22, 3 22, 6 16', 'none', line, 1.2)
    return o


def coin(x, y, r, s=1):
    return g(circle(0, 0, r, C['oro'], C['bruno'], 1.6) + circle(0, 0, r * .8, 'none', C['bruno'], 1) + f'<rect x="{f(-r * .28)}" y="{f(-r * .28)}" width="{f(r * .56)}" height="{f(r * .56)}" fill="{C["bruno"]}"/>' +
             ''.join(path(f'M{f(math.cos(math.radians(a)) * r * .45)} {f(math.sin(math.radians(a)) * r * .45)} l{f(math.cos(math.radians(a)) * 4)} {f(math.sin(math.radians(a)) * 4)}', 'none', C['bruno'], 2) for a in (0, 90, 180, 270)), x, y, 0, s)


def pipistrello(v):
    if v == 1:
        return svg(240, 140, g(bat(), 120, 70, 0, 1.4))
    if v == 2:  # cinque pipistrelli intorno al carattere della longevità (un tondo)
        o = roundel(160, 160, 60, C['oro'], 3) + circle(160, 160, 46, C['rosso'], C['rosso_scuro'], 1.5) + path('M136 140 H184 M136 160 H184 M136 180 H184 M150 130 V190 M170 130 V190', 'none', C['oro'], 3)
        for k in range(5):
            a = math.radians(-90 + k * 72); o += g(bat(), 160 + math.cos(a) * 112, 160 + math.sin(a) * 112, math.degrees(a) + 90, .9)
        return svg(320, 320, o)
    if v == 3:
        return svg(240, 200, g(bat(), 120, 70, 0, 1.3) + path('M120 92 L 120 120', 'none', C['oro_scuro'], 1.5) + coin(120, 150, 26))
    if v == 4:
        return svg(360, 200, g(bat(), 80, 120, -15, 1) + g(bat(C['oro'], C['bruno']), 200, 70, 10, .9) + g(bat(), 300, 140, 20, .8) + ruyi(150, 190, .7))
    raise ValueError(v)


# ---------------------------------------------------------------- farfalle
def butterfly(c1, c2, line, spots):
    up = 'M0 0 C 10 -36, 50 -60, 70 -40 C 82 -26, 64 -6, 0 0 Z'
    lo = 'M0 4 C 24 6, 54 22, 46 44 C 38 60, 12 46, 0 4 Z'
    one = path(up, c1, line, 1.4) + path(lo, c2, line, 1.4) + path('M8 -4 C 30 -24, 48 -36, 62 -38 M8 6 C 22 16, 34 30, 40 42', 'none', line, 1) + \
        circle(52, -32, 6, spots, line, 1) + circle(30, 30, 5, spots, line, 1) + circle(52, -32, 2.2, line)
    return g(one) + g(one, 0, 0, 0, 1, sx=-1, sy=1) + ellipse(0, 6, 4, 20, C['nero']) + path('M-2 -12 C -6 -26, -12 -30, -16 -32 M2 -12 C 6 -26, 12 -30, 16 -32', 'none', C['nero'], 1.4)


def farfalla(v):
    if v == 1:
        return svg(200, 160, g(butterfly(C['azzurro'], C['azzurro_chiaro'], C['blu_scuro'], C['oro']), 100, 80, 0, 1.2))
    if v == 2:
        return svg(320, 200, g(butterfly(C['rosa'], C['rosa_chiaro'], C['rosa_scuro'], C['giada']), 100, 110, -20, .9) + g(butterfly(C['oro'], C['oro_chiaro'], C['bruno'], C['rosso']), 230, 80, 15, .75))
    if v == 3:
        b = branch([(0, 160), (80, 120), (160, 110), (260, 60)], 9, 3) + ''.join(plum(x, y, s) for x, y, s in [(90, 116, 1.2), (150, 108, 1), (210, 86, 1.1), (250, 62, .9), (40, 140, .9)])
        return svg(300, 220, b + g(butterfly(C['giada'], C['celadon'], C['verde_scuro'], C['rosa']), 190, 160, 10, .8))
    if v == 4:
        return svg(200, 160, g(butterfly(C['oro'], C['oro_chiaro'], C['bruno'], C['rosso']), 100, 80, 0, 1.2))
    if v == 5:
        return svg(200, 160, g(butterfly('#5A3D6E', '#8E6AA8', '#2E1E3A', C['oro']), 100, 80, 0, 1.2))
    raise ValueError(v)


# ---------------------------------------------------------------- uccelli
def bird(body, belly, line, wing, tail_len=60, tail_col=None, crest_col=None, beak=None, long_tail=False):
    """Uccellino posato, testa a sinistra, zampe in (0, 18)."""
    tail_col = tail_col or wing; beak = beak or C['oro_scuro']
    o = []
    if long_tail:
        for i, a in enumerate((-8, 4, 14)):
            d, *_ = tapered([(20, 0), (60, 8 + a), (110, 20 + a * 2), (150 + i * 10, 40 + a * 3)], 5, 1.5, 30)
            o.append(path(d, tail_col, line, 1))
    else:
        o.append(path(f'M18 -2 L {18 + tail_len} 12 L {14 + tail_len} 20 L 14 8 Z', tail_col, line, 1.2))
    o.append(ellipse(0, 0, 26, 15, body, line, 1.4, -14))
    o.append(path('M-14 6 C -4 16, 14 14, 22 4 C 10 8, -4 8, -14 6 Z', belly))
    o.append(path('M-6 -8 C 10 -18, 30 -14, 34 2 C 20 -2, 6 -2, -6 -8 Z', wing, line, 1.2))
    o.append(circle(-24, -10, 11, body, line, 1.4))
    o.append(path('M-34 -12 L -46 -8 L -34 -6 Z', beak))
    o.append(circle(-27, -12, 2.2, C['crema']) + circle(-27.5, -12, 1.1, C['nero']))
    if crest_col: o.append(path('M-22 -20 C -20 -34, -10 -36, -8 -28 C -12 -30, -16 -26, -16 -20 Z', crest_col, line, 1))
    o.append(path('M-4 12 L -6 22 M4 12 L 4 22', 'none', C['oro_scuro'], 1.8))
    return ''.join(o)


def plum_branch(w=320, flip=False):
    b = branch([(0, 200), (90, 150), (180, 140), (300, 70)], 12, 3) + branch([(120, 146), (140, 100), (170, 70)], 5, 2) + branch([(200, 132), (250, 140), (290, 160)], 5, 2)
    b += ''.join(plum(x, y, s) for x, y, s in [(100, 146, 1.3), (160, 74, 1.1), (230, 110, 1.2), (290, 72, 1), (285, 158, .9), (60, 172, 1), (140, 100, .8)])
    b += ''.join(circle(x, y, 3, '#E2A15C') for x, y in [(180, 128), (250, 92), (40, 186)])
    return g(b, w if flip else 0, 0, 0, 1, sx=-1 if flip else 1, sy=1)


def uccello(v):
    if v == 1:  # gazza sul pruno
        return svg(340, 240, plum_branch() + g(bird(C['nero'], C['crema'], C['nero'], C['blu'], 70, C['blu_scuro']), 150, 118, -6))
    if v == 2:  # rondini
        sw = lambda: path('M0 0 C 20 -20, 50 -24, 70 -16 C 50 -10, 36 -4, 20 4 C 40 10, 60 26, 74 40 C 50 34, 24 24, 0 12 Z', C['blu_scuro'], C['nero'], 1.2) + ellipse(-4, 6, 12, 8, C['crema'], C['nero'], 1) + circle(-14, 2, 6, C['rosso'], C['nero'], 1)
        return svg(340, 200, g(sw(), 80, 80, -10, 1.2) + g(sw(), 220, 130, 15, .9) + cloud_band(130, 170, 120, .8))
    if v == 3:  # pavone
        o = ''
        for a in range(-80, 81, 16):
            r = math.radians(a - 90); x = math.cos(r) * 120; y = math.sin(r) * 120
            o += path(f'M0 0 L{f(x)} {f(y)}', 'none', C['verde_scuro'], 2)
            o += ellipse(x, y, 13, 16, C['verde'], C['verde_scuro'], 1.2, a) + ellipse(x, y, 8, 10, C['oro'], 'none', 1, a) + circle(x, y, 4.5, C['blu'])
        return svg(320, 300, g(o, 170, 190) + g(bird(C['blu'], C['azzurro'], C['blu_scuro'], C['verde'], 30, C['verde'], C['blu']), 150, 210, 0, 1.4))
    if v == 4:  # martin pescatore
        return svg(300, 220, branch([(0, 160), (120, 150), (300, 120)], 8, 3) + g(bird(C['azzurro'], C['albicocca'], C['blu_scuro'], C['blu'], 26, C['blu'], beak=C['nero']), 150, 132, -10, 1.4) + lotus_leaf(60, 200, 34))
    if v == 5:  # passeri sul bambù
        bb = bamboo(220, 240, 250, 10, 9, 6) + ''.join(leaf(x, y, a, 1, C['verde'], kind='stretta') for x, y, a in [(240, 90, 160), (240, 90, 200), (236, 160, 150), (236, 160, 210)])
        return svg(320, 250, bb + branch([(40, 140), (160, 130), (240, 120)], 6, 3) + g(bird(C['bronzo'], C['avorio'], C['bronzo_scuro'], C['bruno'], 30), 90, 120, -4) + g(bird(C['bronzo'], C['avorio'], C['bronzo_scuro'], C['bruno'], 30), 170, 112, 4, .9))
    if v == 6:  # fagiano dorato
        return svg(380, 240, rock(110, 200, .9, seed=7) + g(bird(C['oro'], C['rosso'], C['bruno'], C['rosso'], 0, C['oro'], C['oro'], long_tail=True), 110, 110, -6, 1.3))
    raise ValueError(v)
