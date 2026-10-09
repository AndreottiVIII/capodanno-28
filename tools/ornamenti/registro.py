"""Registro dei 100 motivi del tappeto.

Fonte unica: nomi, famiglie, ordine e soglie di sblocco.
Genera js/ornamenti.js (per il sito) e ORNAMENTI.md (tabella leggibile).
Uso: python tools/ornamenti/registro.py
"""
import json, math, os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# famiglia: (carattere cinese, nome della famiglia, [varianti])
FAMIGLIE = {
    'drago': ('龍', 'Draghi', [
        'Drago con la perla', 'Drago tra le nuvole', 'Drago azzurro', 'Draghi gemelli',
        'Drago dell\'acqua', 'Drago arrotolato nel tondo', 'Drago rosso'],),
    'peonia': ('牡', 'Peonie', [
        'Peonie e pruno', 'Peonia rosa sola', 'Peonie bianche', 'Ramo di peonie dal bordo',
        'Peonia in boccio', 'Peonie cremisi']),
    'vaso': ('瓶', 'Vasi', [
        'Vaso con crisantemi', 'Vaso a balaustro', 'Vaso a meiping', 'Vaso a zucca',
        'Vaso con rami di pruno', 'Vaso celadon', 'Coppia di vasi']),
    'nuvola': ('雲', 'Nuvole ruyi', [
        'Nuvola ruyi', 'Nuvole in fila', 'Nuvola grande', 'Nuvole a spirale', 'Nuvola d\'oro']),
    'fenice': ('鳳', 'Fenici', [
        'Fenice in volo', 'Fenice sulla roccia', 'Fenice e peonie', 'Fenici in coppia', 'Fenice nel tondo']),
    'gru': ('鶴', 'Gru', [
        'Gru in volo', 'Gru sul pino', 'Gru che danza', 'Coppia di gru', 'Gru con le nuvole']),
    'loto': ('蓮', 'Loti', [
        'Fiore di loto', 'Loto e foglie', 'Loto in boccio', 'Stagno di loti', 'Loto bianco']),
    'carpa': ('鯉', 'Carpe', [
        'Carpa che salta', 'Carpe in cerchio', 'Carpa d\'oro', 'Carpa tra le onde', 'Carpa e loto']),
    'pruno': ('梅', 'Pruni', [
        'Ramo di pruno', 'Pruno in fiore dal bordo', 'Pruno sulla neve', 'Pruno e luna', 'Pruno nodoso']),
    'bambu': ('竹', 'Bambù', [
        'Canne di bambù', 'Bambù al vento', 'Bambù e roccia', 'Germogli di bambù', 'Boschetto di bambù']),
    'crisantemo': ('菊', 'Crisantemi', [
        'Crisantemo d\'oro', 'Crisantemi in mazzo', 'Crisantemo ragno', 'Crisantemo bianco', 'Crisantemi e roccia']),
    'pino': ('松', 'Pini', [
        'Ramo di pino', 'Pino sulla roccia', 'Pino storto', 'Aghi di pino', 'Pino e luna']),
    'pipistrello': ('蝠', 'Pipistrelli della fortuna', [
        'Pipistrello rosso', 'Cinque pipistrelli', 'Pipistrello con la moneta', 'Pipistrelli in volo']),
    'farfalla': ('蝶', 'Farfalle', [
        'Farfalla azzurra', 'Due farfalle', 'Farfalla e pruno', 'Farfalla d\'oro', 'Farfalla notturna']),
    'incensiere': ('爐', 'Bruciaincensi', [
        'Bruciaincenso a tre piedi', 'Bruciaincenso col leone', 'Bruciaincenso fumante', 'Bruciaincenso di bronzo']),
    'onda': ('波', 'Onde', [
        'Onde e spuma', 'Onda alta', 'Onde a scaglie', 'Mare con roccia']),
    'roccia': ('石', 'Rocce', [
        'Roccia del lago Tai', 'Roccia con orchidea', 'Roccia traforata', 'Roccia e funghi']),
    'uccello': ('鳥', 'Uccelli', [
        'Gazza sul pruno', 'Rondini', 'Pavone', 'Martin pescatore', 'Passeri sul bambù', 'Fagiano dorato']),
    'antichita': ('寶', 'Cento antichità', [
        'Libri legati', 'Rotolo di pittura', 'Scacchiera di go', 'Ruyi di giada', 'Moneta antica',
        'Pennelli nel vaso', 'Corda musicale (guqin)', 'Nodo infinito']),
}

# I primi quattro sono già sbloccati: sono quelli della bozza approvata
GRATIS = [('drago', 0), ('peonia', 0), ('vaso', 0), ('nuvola', 0)]


def ordine():
    """Giro a ruota sulle famiglie, così il tappeto si riempie di cose diverse."""
    fams = list(FAMIGLIE.keys())
    resto = {f: list(range(len(FAMIGLIE[f][-1]))) for f in fams}
    out = []
    for f, i in GRATIS:
        out.append((f, i)); resto[f].remove(i)
    # dopo i gratuiti, prima le famiglie nuove (fenice per prima, come nella bozza)
    giro = ['fenice', 'gru', 'loto', 'carpa', 'pruno', 'bambu', 'crisantemo', 'pino', 'pipistrello',
            'farfalla', 'incensiere', 'onda', 'roccia', 'uccello', 'antichita', 'drago', 'peonia', 'vaso', 'nuvola']
    while any(resto.values()):
        for f in giro:
            if resto[f]:
                out.append((f, resto[f].pop(0)))
    return out


def soglia(k):
    """Perle della coppia per il motivo k (0-based). Primo dopo i gratuiti a 20, l'ultimo a circa 6000."""
    if k < len(GRATIS):
        return 0
    x = k - len(GRATIS) + 1
    return int(round(20 * x ** 1.25 / 10.0)) * 10


def registro():
    reg = []
    for k, (f, i) in enumerate(ordine()):
        han, fam, varianti = FAMIGLIE[f][0], FAMIGLIE[f][1], FAMIGLIE[f][-1]
        reg.append({'id': f'{f}-{i + 1}', 'fam': f, 'famNome': fam, 'han': han, 'v': i + 1,
                    'nome': varianti[i], 'soglia': soglia(k), 'file': f'img/orn/{f}-{i + 1}.svg'})
    return reg


if __name__ == '__main__':
    reg = registro()
    assert len(reg) == 100, len(reg)
    with open(os.path.join(ROOT, 'js', 'ornamenti.js'), 'w', encoding='utf-8') as fh:
        fh.write('// ===== Registro dei 100 motivi (generato da tools/ornamenti/registro.py: non modificare a mano) =====\n')
        fh.write('const ORN = ' + json.dumps(reg, ensure_ascii=False, indent=0).replace('\n', '') + ';\n')
    with open(os.path.join(ROOT, 'ORNAMENTI.md'), 'w', encoding='utf-8') as fh:
        fh.write('# I 100 motivi del tappeto\n\nSi sbloccano con le perle della coppia (le tue più quelle dell\'altro telefono). ')
        fh.write('Generato da `tools/ornamenti/registro.py`.\n\n| # | Motivo | Famiglia | Perle |\n|---|---|---|---|\n')
        for k, o in enumerate(reg):
            fh.write(f"| {k + 1} | {o['nome']} | {o['han']} {o['famNome']} | {o['soglia'] or 'subito'} |\n")
    print('ok', len(reg), 'ultimo a', reg[-1]['soglia'])
