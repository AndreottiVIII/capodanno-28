"""Peonie, loti, pruni, bambù, crisantemi, pini: rami asimmetrici che escono dai bordi."""
import math
from lib import *

WHITE_PEONY = (C['carta'], C['grigio_scuro'], C['crema'], '#C9B79A', C['rosa_chiaro'], C['rosa_scuro'])
CRIMSON = ('#D9506A', C['vino'], C['cremisi'], C['vino'], C['vino'], '#5A1428')


def peonia(v):
    if v == 2:   # una peonia rosa sola, con foglie
        return svg(280, 260, branch([(140, 260), (140, 200), (130, 140)], 6, 4, C['verde_scuro']) + leaf(136, 190, -150, 1.8) + leaf(136, 190, -30, 1.7, C['giada']) + leaf(134, 160, -110, 1.3) + peony(130, 120, 2.1))
    if v == 3:   # peonie bianche
        return svg(360, 300, branch([(0, 280), (90, 220), (170, 170), (260, 100)], 8, 4) + leaf(120, 200, -160, 1.6) + leaf(120, 200, -60, 1.5, C['giada']) + leaf(220, 130, -20, 1.4) +
                   peony(120, 200, 1.5, 10, WHITE_PEONY) + peony(250, 100, 1.2, -20, WHITE_PEONY) + bud(300, 60, 30, 1.1, C['crema'], C['grigio_scuro']))
    if v == 4:   # ramo che esce dal bordo destro
        b = branch([(420, 20), (350, 50), (280, 110), (200, 150), (110, 170)], 12, 4) + branch([(300, 96), (300, 160), (320, 220)], 5, 3) + branch([(220, 144), (190, 100), (160, 80)], 4, 2)
        lv = ''.join(leaf(x, y, a, s, c) for x, y, a, s, c in [(300, 100, 150, 2, C['verde']), (300, 100, 220, 1.8, C['giada']), (200, 150, 110, 1.6, C['verde']), (200, 150, 20, 1.5, C['giada']), (160, 80, 200, 1.2, C['verde'])])
        return svg(420, 260, b + lv + peony(300, 100, 1.5) + peony(200, 150, 1.15, 15) + bud(320, 222, 170, 1.1) + bud(160, 78, -40, .9) + ''.join(plum(x, y, s) for x, y, s in [(380, 34, 1), (110, 170, .9)]))
    if v == 5:   # in boccio
        return svg(240, 260, branch([(120, 260), (118, 180), (110, 110)], 5, 3, C['verde_scuro']) + leaf(118, 200, -150, 1.5) + leaf(118, 200, -35, 1.4, C['giada']) +
                   bud(110, 108, 0, 3) + bud(160, 150, 30, 1.6) + branch([(118, 190), (140, 170), (158, 152)], 3, 2, C['verde_scuro']))
    if v == 6:   # cremisi
        return svg(340, 280, branch([(0, 60), (80, 90), (170, 150), (240, 230)], 9, 4) + leaf(170, 150, 140, 1.7) + leaf(170, 150, 40, 1.6, C['giada']) + leaf(80, 90, 90, 1.3) +
                   peony(170, 150, 1.6, 0, CRIMSON) + peony(80, 92, 1.05, 30, CRIMSON) + bud(250, 236, 140, 1.2, '#D9506A', C['vino']))
    raise ValueError(v)


def loto(v):
    stem = lambda x0, y0, x1, y1: path(f'M{x0} {y0} C {x0 + 4} {(y0 + y1) / 2}, {x1 - 6} {(y0 + y1) / 2}, {x1} {y1}', 'none', C['verde_scuro'], 5) + path(f'M{x0} {y0} C {x0 + 4} {(y0 + y1) / 2}, {x1 - 6} {(y0 + y1) / 2}, {x1} {y1}', 'none', C['verde'], 3)
    if v == 1:
        return svg(240, 240, stem(120, 240, 120, 150) + lotus(120, 150, 1.7))
    if v == 2:
        return svg(320, 260, stem(160, 260, 160, 130) + stem(100, 260, 80, 190) + stem(230, 260, 250, 170) + lotus_leaf(80, 190, 46) + lotus_leaf(250, 172, 52) + lotus(160, 130, 1.5))
    if v == 3:
        return svg(200, 260, stem(100, 260, 100, 130) + lotus(100, 130, 1.8, open_=.3) + leaf(100, 210, -40, 1.2, kind='tonda'))
    if v == 4:   # stagno
        return svg(420, 240, waves(0, 190, 420, 3, 1, C['blu'], C['blu_scuro']) + lotus_leaf(70, 190, 50) + lotus_leaf(340, 196, 44) + lotus_leaf(220, 205, 36) +
                   stem(150, 200, 150, 120) + lotus(150, 120, 1.3) + stem(280, 200, 290, 140) + lotus(290, 140, 1, open_=.3) + stem(40, 200, 30, 140) + lotus(30, 140, .9, C['carta'], C['rosa_chiaro'], C['grigio_scuro']))
    if v == 5:
        return svg(240, 240, stem(120, 240, 120, 150) + lotus_leaf(60, 210, 40) + lotus(120, 150, 1.7, C['carta'], C['rosa_chiaro'], C['grigio_scuro']))
    raise ValueError(v)


def pruno(v):
    if v == 1:
        b = branch([(0, 240), (60, 180), (140, 150), (240, 80), (320, 60)], 12, 3) + branch([(140, 150), (170, 190), (230, 200)], 5, 2) + branch([(240, 80), (250, 30)], 4, 2)
        return svg(330, 260, b + ''.join(plum(x, y, s) for x, y, s in [(60, 180, 1.4), (140, 150, 1.2), (200, 110, 1.3), (250, 32, 1), (320, 60, 1.1), (230, 200, 1), (172, 188, .8)]) + ''.join(circle(x, y, 3.2, '#E2A15C') for x, y in [(100, 160), (290, 70), (210, 196)]))
    if v == 2:   # dal bordo in alto
        b = branch([(140, 0), (150, 60), (120, 120), (60, 170), (0, 190)], 12, 3) + branch([(150, 60), (210, 90), (270, 90)], 6, 2) + branch([(120, 120), (150, 170), (170, 220)], 5, 2)
        return svg(290, 240, b + ''.join(plum(x, y, s, C['rosa'], C['rosa_scuro'], C['oro']) for x, y, s in [(150, 60, 1.4), (210, 90, 1.2), (270, 90, 1), (120, 120, 1.3), (60, 170, 1.1), (170, 220, 1), (150, 168, .9)]))
    if v == 3:   # sulla neve
        snow = path('M0 230 C 60 210, 120 226, 180 214 C 240 204, 290 222, 320 214 L 320 260 L 0 260 Z', C['carta'], C['grigio'], 1.2)
        b = branch([(40, 240), (60, 170), (110, 120), (200, 90), (290, 40)], 12, 3) + path('M70 168 C 80 162, 92 162, 100 166 M150 104 C 160 98, 176 98, 184 102', 'none', C['carta'], 4)
        return svg(320, 260, snow + b + ''.join(plum(x, y, s, C['carta'], C['grigio_scuro'], C['rosso']) for x, y, s in [(60, 170, 1.3), (110, 122, 1.2), (200, 90, 1.3), (290, 40, 1.1), (250, 66, .9)]))
    if v == 4:   # con la luna
        return svg(320, 280, circle(200, 110, 80, C['avorio'], C['oro'], 2) + circle(200, 110, 70, 'none', C['oro_chiaro'], 1) + plum_branch_simple())
    if v == 5:   # nodoso
        b = branch([(20, 260), (40, 200), (20, 150), (60, 100), (140, 80), (200, 40), (270, 30)], 18, 3) + path('M40 200 C 50 190, 46 180, 38 176 M30 150 C 44 146, 50 136, 48 128', 'none', C['nero'], 1.5)
        return svg(290, 270, b + branch([(60, 100), (40, 50)], 5, 2) + ''.join(plum(x, y, s) for x, y, s in [(40, 48, 1.1), (140, 80, 1.3), (200, 40, 1.2), (270, 30, 1), (60, 104, .9), (100, 90, .8)]))
    raise ValueError(v)


def plum_branch_simple():
    b = branch([(0, 270), (80, 220), (150, 180), (260, 120), (320, 110)], 12, 3) + branch([(150, 180), (170, 230), (220, 250)], 5, 2)
    return b + ''.join(plum(x, y, s) for x, y, s in [(80, 220, 1.3), (150, 180, 1.2), (220, 148, 1.3), (300, 114, 1.1), (220, 250, 1), (172, 226, .9)])


def bamboo_leaves(spots, col=None):
    return ''.join(leaf(x, y, a, s, col or (C['verde'] if i % 2 else C['giada']), kind='stretta') for i, (x, y, a, s) in enumerate(spots))


def bambu(v):
    if v == 1:
        return svg(240, 320, bamboo(80, 320, 90, 0, 14, 6) + bamboo(150, 320, 140, 40, 10, 5) + bamboo_leaves([(90, 70, 200, 1), (90, 70, 160, 1.1), (88, 120, 220, .9), (140, 100, -20, 1), (140, 100, 20, .9), (142, 160, -40, 1)]))
    if v == 2:   # al vento
        return svg(320, 300, bamboo(60, 300, 120, 20, 12, 6) + bamboo_leaves([(116, 40, 10, 1.2), (116, 40, 30, 1), (110, 80, 5, 1.1), (110, 80, 25, 1), (100, 130, 15, 1.1), (100, 130, -5, 1), (90, 180, 20, 1)]) + path('M180 60 C 220 50, 260 60, 300 50 M190 110 C 230 104, 270 110, 300 100', 'none', C['giada'], 1.2))
    if v == 3:   # con roccia
        return svg(300, 320, rock(90, 250, 1.1, seed=11) + bamboo(190, 320, 200, 20, 11, 6) + bamboo(230, 320, 240, 90, 8, 4) + bamboo_leaves([(198, 50, 200, 1.1), (198, 50, 160, 1), (196, 110, 200, 1), (240, 120, -20, 1), (240, 120, 20, .9)]))
    if v == 4:   # germogli
        shoot = lambda x, h: path(f'M{x - 12} 260 C {x - 10} {260 - h * .5}, {x - 4} {260 - h * .9}, {x} {260 - h} C {x + 4} {260 - h * .9}, {x + 10} {260 - h * .5}, {x + 12} 260 Z', C['albicocca'], C['bruno'], 1.4) + \
            ''.join(path(f'M{x - 11} {260 - h * t} C {x - 4} {260 - h * t - 8}, {x + 4} {260 - h * t - 8}, {x + 11} {260 - h * t}', 'none', C['bruno'], 1) for t in (.2, .4, .6))
        return svg(260, 270, shoot(70, 110) + shoot(140, 160) + shoot(200, 90) + bamboo_leaves([(140, 100, -60, .8), (140, 100, -120, .8)]))
    if v == 5:   # boschetto
        o = ''.join(bamboo(x, 320, x + d, 0, w, 6) for x, d, w in [(40, 6, 9), (90, -4, 12), (150, 8, 10), (210, -6, 13), (260, 4, 8)])
        return svg(300, 320, o + bamboo_leaves([(46, 60, 200, 1), (86, 40, -20, 1.1), (156, 70, 200, 1), (204, 30, -20, 1.1), (262, 90, 200, .9), (90, 120, 20, 1), (210, 140, 160, 1)]))
    raise ValueError(v)


def crisantemo(v):
    stem = lambda x, y0, y1: path(f'M{x} {y0} C {x - 6} {(y0 + y1) / 2}, {x + 6} {(y0 + y1) / 2}, {x} {y1}', 'none', C['verde_scuro'], 4)
    if v == 1:
        return svg(220, 260, stem(110, 260, 100) + leaf(110, 200, -150, 1.4, kind='peonia') + leaf(108, 170, -30, 1.3, C['giada']) + chrysanthemum(110, 100, 2.2))
    if v == 2:
        return svg(300, 260, stem(150, 260, 110) + stem(100, 260, 140) + stem(210, 260, 120) + leaf(150, 210, -150, 1.3) + leaf(150, 200, -30, 1.3, C['giada']) +
                   chrysanthemum(100, 140, 1.4) + chrysanthemum(210, 120, 1.5, C['rosa'], C['rosa_chiaro'], C['rosa_scuro']) + chrysanthemum(150, 100, 1.7))
    if v == 3:
        return svg(240, 260, stem(120, 260, 110) + leaf(120, 200, -150, 1.3) + leaf(120, 190, -30, 1.2, C['giada']) + chrysanthemum(120, 110, 2.3, C['albicocca'], C['oro_chiaro'], C['bruno'], 26, spider=True))
    if v == 4:
        return svg(220, 260, stem(110, 260, 100) + leaf(110, 200, -150, 1.4) + leaf(108, 170, -30, 1.3, C['giada']) + chrysanthemum(110, 100, 2.2, C['carta'], C['crema'], C['grigio_scuro']))
    if v == 5:
        return svg(320, 300, rock(110, 230, 1.1, seed=3) + stem(220, 300, 140) + stem(250, 300, 190) + leaf(220, 240, -150, 1.3) + leaf(230, 230, -30, 1.3, C['giada']) +
                   chrysanthemum(220, 140, 1.6) + chrysanthemum(250, 190, 1.2, C['carta'], C['crema'], C['grigio_scuro']))
    raise ValueError(v)


def pino(v):
    from fam_cielo import pine_branch
    if v == 1:
        return svg(340, 180, pine_branch(10, 110, 1.8))
    if v == 2:
        trunk = branch([(120, 300), (130, 220), (110, 160), (150, 110), (220, 80)], 22, 6) + path('M126 250 C 134 246, 132 236, 124 232 M118 180 C 130 176, 132 166, 124 160', 'none', C['nero'], 1.4)
        return svg(320, 320, rock(80, 270, 1, seed=9) + trunk + ''.join(pine_tuft(x, y, a, s) for x, y, a, s in [(220, 80, 20, 1.6), (170, 100, -10, 1.4), (110, 160, -40, 1.3), (260, 70, 40, 1.2)]))
    if v == 3:
        trunk = branch([(40, 300), (80, 240), (60, 180), (140, 150), (200, 160), (260, 120)], 18, 5)
        return svg(300, 310, trunk + ''.join(pine_tuft(x, y, a, s) for x, y, a, s in [(260, 120, 20, 1.5), (200, 160, 0, 1.3), (140, 150, -20, 1.3), (60, 180, -60, 1.2)]))
    if v == 4:
        return svg(260, 160, ''.join(pine_tuft(x, y, a, s, C['pino'] if i % 2 else C['verde']) for i, (x, y, a, s) in enumerate([(60, 90, -30, 1.6), (130, 70, 0, 1.8), (200, 90, 30, 1.6), (100, 130, -10, 1.3), (170, 130, 15, 1.3)])))
    if v == 5:
        return svg(340, 300, circle(220, 110, 76, C['avorio'], C['oro'], 2) + pine_branch(10, 230, 1.7) + ruyi(40, 90, .8, 0, C['azzurro_chiaro'], C['blu_scuro']))
    raise ValueError(v)
