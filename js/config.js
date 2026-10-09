// ===== Configurazione =====
// Con Supabase configurato: si entra con email e password e i progressi sono condivisi.
// Senza: tutto resta sul dispositivo e la sfida passa per un codice da scambiarsi.
// Come si crea il progetto Supabase: vedi SUPABASE.md.
const CONFIG = {
  supabase: {
    url: '',   // Project URL, es. 'https://abcdefghijkl.supabase.co'
    key: '',   // chiave "publishable" (o "anon"): è fatta per stare nel sito, non è segreta
  },

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
