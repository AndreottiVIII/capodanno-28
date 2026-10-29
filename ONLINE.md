# Progressi online

Come la classifica del quiz Aia o non Aia: i progressi stanno in un repository GitHub **privato**, e il sito ci scrive con una chiave che può toccare solo quello. La chiave è cifrata con una password: senza la password non serve a niente, quindi si può pubblicare.

Ognuno di voi entra una volta per dispositivo: scrive la password, sceglie chi è, e da lì resta dentro.

## Una volta sola (dieci minuti)

1. **Il repository.** Su https://github.com/new crea `capodanno-28-progressi`, **Private**, con **Add README** acceso.
2. **La chiave.** Su https://github.com/settings/personal-access-tokens/new:
   - Token name: `capodanno-28 progressi`
   - Expiration: **No expiration** (la chiave tocca solo il repository dei progressi)
   - Repository access: **Only select repositories** → `capodanno-28-progressi`
   - Permissions › Repository permissions › **Contents: Read and write** (Metadata si mette da sola)
   - **Generate token** e copialo.
3. **Salvala sul PC.** Incollala da sola in `capodanno-28/token-progressi.txt` (il file è escluso da git, non finisce online).
4. **Scegli la password.** Almeno 8 caratteri, una che ricordate tutti e due: a lei la dai con il regalo. Non scriverla in nessun file.
5. **Cifra la chiave.** In PowerShell, nella cartella `capodanno-28`:

   ```
   $env:CP28_PASSWORD="la-password"; python tools\cifra_chiave.py
   ```

   Scrive `js/chiave.js`. Poi dimmi "fatto" e pubblico io (oppure: `git add js/chiave.js`, commit, push).

## Se serve cambiarla

La chiave non scade. Se la password finisse in mani sbagliate: revoca la chiave su https://github.com/settings/personal-access-tokens, poi ripeti i passi 2-5 con una password nuova. I progressi restano dove sono. Claude non crea chiavi: questa la fai tu.

Scorciatoia per i passi 3-5: `powershell -ExecutionPolicy Bypass -File .\tools\chiave.ps1` apre il Blocco note per la chiave, chiede la password senza mostrarla, cifra e pubblica.

## Come funziona

- Ogni giocatore ha il suo file: `progressi/<nome>.json`. Si vedono le perle l'uno dell'altro, ma ognuno scrive solo il suo.
- Computer e telefono della stessa persona si uniscono senza perdere niente: le perle di ogni dispositivo si sommano.
- Senza rete va tutto lo stesso: i progressi partono quando torna.
- Se qualcuno scoprisse la password potrebbe sporcare i file: si recuperano dalla storia del repository. In quel caso: nuova chiave (passi 2-5) e nuova password.
