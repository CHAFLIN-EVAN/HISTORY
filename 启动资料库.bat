@echo off
chcp 65001 >nul
title 个人历史资料库

cd /d "%~dp0"

echo 正在启动个人历史资料库...
echo.
start "" http://localhost:5173

echo 启动开发服务器中，请稍候...
npx vite --port 5173 --host

pause
