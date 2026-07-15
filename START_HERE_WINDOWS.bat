@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is not installed. Install Node 20.19+ or 22.12+ first.& pause & exit /b 1)
if not exist node_modules call npm ci
if not exist .env call npm run setup
call npm run build
call npm run doctor
call npm start
pause
