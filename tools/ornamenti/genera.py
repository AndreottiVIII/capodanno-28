"""Genera i 100 motivi in img/orn/. drago-1, peonia-1 e vaso-1 sono i disegni originali della bozza e non si toccano.
Uso: python tools/ornamenti/genera.py [famiglia ...]
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import write
from registro import registro
import fam_cielo, fam_flora, fam_cose

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FUN = {
    'drago': fam_cielo.drago, 'nuvola': fam_cielo.nuvola, 'fenice': fam_cielo.fenice, 'gru': fam_cielo.gru,
    'pipistrello': fam_cielo.pipistrello, 'farfalla': fam_cielo.farfalla, 'uccello': fam_cielo.uccello,
    'peonia': fam_flora.peonia, 'loto': fam_flora.loto, 'pruno': fam_flora.pruno, 'bambu': fam_flora.bambu,
    'crisantemo': fam_flora.crisantemo, 'pino': fam_flora.pino,
    'vaso': fam_cose.vaso, 'incensiere': fam_cose.incensiere, 'antichita': fam_cose.antichita,
    'onda': fam_cose.onda, 'roccia': fam_cose.roccia, 'carpa': fam_cose.carpa,
}
ORIGINALI = {'drago-1', 'peonia-1', 'vaso-1'}

if __name__ == '__main__':
    solo = set(sys.argv[1:])
    n = 0
    for o in registro():
        if o['id'] in ORIGINALI or (solo and o['fam'] not in solo):
            continue
        write(os.path.join(ROOT, o['file']), FUN[o['fam']](o['v']))
        n += 1
    print('generati', n)
