// ===== Configurazione =====
// Progressi online: con js/chiave.js (vedi ONLINE.md) si entra con una password e i progressi sono condivisi.
// Senza: tutto resta sul dispositivo e la sfida passa per un codice da scambiarsi.
const CONFIG = {

  perleFilo: 10,        // perle per chiudere il filo di oggi
  perlePerPietra: 5,    // una pietra di vantaggio ogni 5 perle di scarto
  maxPietre: 4,
  sigillo: 10,          // problemi risolti per guadagnare il sigillo di una tattica

  // Schermata di benvenuto (QR nella scatola: indirizzo del sito + #benvenuto)
  benvenuto: {
    titolo: 'Buon compleanno, [Lei]',
    messaggio: '[Qui il tuo messaggio di compleanno. Due o tre frasi: escono impaginate su un fondo di tappeto, tra il drago e le peonie.]',
    firma: '[nome]',
  },
};
