@echo off
REM Install shared types script for Windows
REM This script installs the shared types package to both frontend and backend

echo 🔧 Installing shared types...

REM Build shared types
echo 📦 Building shared types...
cd shared\types
call npm run build
cd ..\..

REM Install to frontend
echo ⚛️ Installing to frontend...
if exist node_modules\@spring-book-club rmdir /s /q node_modules\@spring-book-club
mkdir node_modules\@spring-book-club
xcopy /e /i shared\types node_modules\@spring-book-club\shared-types

REM Install to backend
echo 🔙 Installing to backend...
if exist apps\backend\node_modules\@spring-book-club rmdir /s /q apps\backend\node_modules\@spring-book-club
mkdir apps\backend\node_modules\@spring-book-club
xcopy /e /i shared\types apps\backend\node_modules\@spring-book-club\shared-types

echo ✅ Shared types installed successfully!
echo.
echo 📝 Note: Run this script whenever you update shared types:
echo    scripts\install-shared-types.bat

pause