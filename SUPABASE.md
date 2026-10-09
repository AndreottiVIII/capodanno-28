# Account e progressi condivisi con Supabase

Servono una decina di minuti, una volta sola. Supabase è gratuito per un uso come questo.
Finché non lo fai, il sito funziona lo stesso: i progressi restano sul dispositivo e la sfida passa per il codice da scambiarsi.

## 1. Crea il progetto

1. Vai su https://supabase.com e accedi (va bene "Continue with GitHub").
2. **New project**. Nome: `capodanno-28`. Region: una europea (per esempio Frankfurt). La password del database generala con il pulsante apposito: non serve ricordarla.
3. Aspetta un paio di minuti che il progetto sia pronto.

## 2. Chiudi le iscrizioni

**Authentication › Sign In / Providers**:

- in **Email**, lascia attivo il provider ma **spegni "Confirm email"**;
- in alto, **spegni "Allow new users to sign up"**.

Così gli unici account sono i due che crei tu, e nessun altro può iscriversi.

## 3. Crea i due account

**Authentication › Users › Add user › Create new user**, due volte:

- la tua email e una password;
- l'email di lei e una password (gliela dai insieme al regalo, o la cambiate dopo).

Spunta **Auto Confirm User**.

## 4. Crea la tabella dei progressi

**SQL Editor › New query**, incolla tutto questo e premi **Run**:

```sql
create table public.progressi (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text,
  colore text,
  dati jsonb not null default '{}'::jsonb,
  aggiornato timestamptz not null default now()
);

alter table public.progressi enable row level security;

-- i due giocatori vedono le perle l'uno dell'altro
create policy "leggono gli utenti entrati" on public.progressi
  for select to authenticated using (true);

-- ognuno scrive solo i propri progressi
create policy "ognuno crea il suo" on public.progressi
  for insert to authenticated with check (auth.uid() = id);
create policy "ognuno aggiorna il suo" on public.progressi
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
```

## 5. Dammi due valori

In **Project Settings › API** (o **Data API**) copia:

- **Project URL**, tipo `https://abcdefghijkl.supabase.co`;
- la chiave **publishable** (comincia con `sb_publishable_`) oppure, se vedi solo quella, la chiave **anon public**.

Queste due si possono mettere nel sito: sono fatte per stare in chiaro, e le regole del punto 4 decidono chi legge e chi scrive. **Non** copiare la chiave `service_role` o `secret`.

Mandameli e li metto io in `js/config.js`, oppure incollali tu lì:

```js
supabase: {
  url: 'https://abcdefghijkl.supabase.co',
  key: 'sb_publishable_...',
},
```

## Come funziona dopo

- Si entra una volta con email e password (in Impostazioni, o direttamente dal benvenuto): poi si resta dentro, anche chiudendo l'app.
- I progressi dello stesso account si uniscono tra computer e telefono senza perdere niente.
- Le perle dell'altro arrivano da sole nella Sfida e nel tappeto. Il codice da scambiare non serve più.
- Offline va tutto lo stesso: i progressi partono appena torna la rete.
