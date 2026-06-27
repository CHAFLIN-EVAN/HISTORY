@echo off
chcp 65001 >nul
title 个人历史资料库

:: Wait a moment for dev server to start, then open browser
start "" http://localhost:5173

:: Start dev server (will keep the window open)
cd /d "%~dp0"
call npm run dev

pause
