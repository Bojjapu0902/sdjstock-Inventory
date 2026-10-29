@echo off
cd /d C:\xampp\htdocs\Websites\sdjstock-Inventory_new2

echo Removing lock files...
del /f .git\index.lock 2>nul
del /f .git\HEAD.lock 2>nul

echo Adding chat.js...
git add Server/routes/chat.js

echo Committing...
git commit -m "Update Gemini model to gemini-3.8-flash"

echo Pushing...
git push origin main

echo Done!
pause
