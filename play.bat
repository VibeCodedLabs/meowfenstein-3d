@echo off
rem Double-click to play: starts a tiny local web server and opens the game.
cd /d "%~dp0"
start "" http://localhost:8123
python -m http.server 8123
