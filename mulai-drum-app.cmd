@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instal Node.js versi 20 atau lebih baru dahulu.
  pause
  exit /b 1
)
echo Buka http://127.0.0.1:8765 di Chrome atau Edge.
echo Tekan Ctrl+C atau tutup jendela ini untuk berhenti.
node scripts/server.cjs
pause
