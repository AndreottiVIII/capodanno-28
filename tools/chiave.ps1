# Prepara la chiave dei progressi online e la pubblica.
# Uso, dalla cartella capodanno-28:  .\tools\chiave.ps1
# 1) apre il Blocco note su token-progressi.txt: incolli la chiave GitHub, salvi e chiudi
# 2) chiede la password due volte senza mostrarla (non viene scritta in nessun file)
# 3) cifra la chiave in js/chiave.js e la pubblica
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$tok = Join-Path $root "token-progressi.txt"
if (-not (Test-Path $tok) -or -not (Get-Content $tok -Raw).Trim()) {
  Set-Content -Path $tok -Value "" -Encoding ascii
  Write-Host "Si apre il Blocco note: incolla la chiave GitHub (comincia con github_pat_), salva con Ctrl+S e chiudi." -ForegroundColor Yellow
  Start-Process notepad.exe $tok -Wait
}
$t = (Get-Content $tok -Raw).Trim()
if (-not ($t.StartsWith("github_pat_") -or $t.StartsWith("ghp_"))) { Write-Host "In token-progressi.txt non c'e' una chiave GitHub. Riprova." -ForegroundColor Red; exit 1 }
function Leggi($msg) { $s = Read-Host $msg -AsSecureString; [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)) }
$p1 = Leggi "Scegli la password di Capodanno 28 (almeno 8 caratteri)"
$p2 = Leggi "Riscrivila per conferma"
if ($p1 -ne $p2) { Write-Host "Le due password non coincidono. Riprova." -ForegroundColor Red; exit 1 }
if ($p1.Length -lt 8) { Write-Host "Troppo corta: almeno 8 caratteri." -ForegroundColor Red; exit 1 }
$env:CP28_PASSWORD = $p1
try { python tools\cifra_chiave.py } finally { Remove-Item Env:CP28_PASSWORD -ErrorAction SilentlyContinue }
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$ErrorActionPreference = "Continue"   # git scrive avvisi (CRLF) su stderr: non sono errori
git add js/chiave.js
git commit -m "Chiave online cifrata`n`nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
Write-Host "Fatto: tra un minuto il sito chiede la password. Ricordatela tutti e due." -ForegroundColor Green
