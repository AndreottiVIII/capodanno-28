# Progressi online

Come la classifica del quiz Aia o non Aia: i progressi stanno in un repository GitHub **privato**, e il sito ci scrive con una chiave che può toccare solo quello. La chiave è cifrata con una password: senza la password non serve a niente, quindi si può pubblicare.

Ognuno di voi entra una volta per dispositivo: scrive la password, sceglie chi è, e da lì resta dentro.

## Una volta sola (dieci minuti)

1. **Il repository.** Su https://github.com/new crea `capodanno-28-progressi`, **Private**, con **Add README** acceso.
2. **La chiave.** Su https://github.com/settings/personal-access-tokens/new:
   - Token name: `capodanno-28 progressi`
   - Expiration: **Custom**, la data più lontana possibile (un anno)
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

## Ogni anno

La chiave scade dopo un anno (ottobre 2027). Ripeti i passi 2, 3 e 5 con la stessa password: i progressi restano dove sono. Claude non crea chiavi: questa la fai tu.

## Come funziona

- Ogni giocatore ha il suo file: `progressi/<nome>.json`. Si vedono le perle l'uno dell'altro, ma ognuno scrive solo il suo.
- Computer e telefono della stessa persona si uniscono senza perdere niente: le perle di ogni dispositivo si sommano.
- Senza rete va tutto lo stesso: i progressi partono quando torna.
- Se qualcuno scoprisse la password potrebbe sporcare i file: si recuperano dalla storia del repository. In quel caso: nuova chiave (passi 2-5) e nuova password.
