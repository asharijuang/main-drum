@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js tidak ditemukan. HTML tetap bisa dibuka langsung.
  echo Untuk MIDI yang memerlukan localhost, instal Node.js lalu jalankan lagi.
  pause
  exit /b 1
)
echo Drum Companion akan berjalan di http://127.0.0.1:8765
echo Buka alamat tersebut di Chrome atau Edge. Tutup jendela ini untuk berhenti.
node serve-drum-app.cjs
pause
