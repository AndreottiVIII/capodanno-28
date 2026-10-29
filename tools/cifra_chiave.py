"""Cifra la chiave GitHub dei progressi online e scrive js/chiave.js.

La chiave (token "fine-grained" con accesso al solo repository dei progressi) sta in
token-progressi.txt, nella cartella del progetto, ed è esclusa da git.
La password NON va scritta in nessun file: si passa con la variabile CP28_PASSWORD.
Cifratura come il quiz: PBKDF2-SHA256 600000 giri -> AES-256-GCM.

Uso (PowerShell):  $env:CP28_PASSWORD="la-password"; python tools/cifra_chiave.py
"""
import base64, json, os, secrets, sys
from pathlib import Path

try:
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
except ImportError:
    sys.exit("Manca il pacchetto 'cryptography': pip install cryptography")

ROOT = Path(__file__).resolve().parent.parent
REPO = 'AndreottiVIII/capodanno-28-progressi'
GIRI = 600000

password = os.environ.get('CP28_PASSWORD', '')
if len(password) < 8:
    sys.exit('Manca la password (almeno 8 caratteri): imposta prima $env:CP28_PASSWORD')
f = ROOT / 'token-progressi.txt'
if not f.exists():
    sys.exit(f'Manca {f.name}: incolla lì dentro la chiave GitHub, da sola su una riga')
token = f.read_text(encoding='utf-8').strip()
if not token.startswith(('github_pat_', 'ghp_')):
    sys.exit('La chiave in token-progressi.txt non sembra una chiave GitHub')

salt, iv = secrets.token_bytes(16), secrets.token_bytes(12)
key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=GIRI).derive(password.encode('utf-8'))
ct = AESGCM(key).encrypt(iv, token.encode('utf-8'), None)   # il tag GCM è in coda, come vuole il browser
b = lambda x: base64.b64encode(x).decode('ascii')
dati = {'repo': REPO, 'giri': GIRI, 'salt': b(salt), 'iv': b(iv), 'ct': b(ct)}
(ROOT / 'js' / 'chiave.js').write_text(
    '// Chiave per i progressi online, cifrata con la password (la genera tools/cifra_chiave.py).\n'
    '// Senza la password non serve a niente: si può pubblicare.\n'
    f'var CHIAVE_ONLINE = {json.dumps(dati)};\n', encoding='utf-8')
print('Fatto: js/chiave.js aggiornato. Ora pubblica (git add js/chiave.js, commit, push).')
