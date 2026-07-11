@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if errorlevel 1 goto no_python

start "" "http://127.0.0.1:8778/"
echo Course library is running at http://127.0.0.1:8778/
echo Keep this window open while reading. Press Ctrl+C to stop.
py -m http.server 8778
goto end

:no_python
echo Python was not found. Opening the static entry page directly.
echo Install Python later for the most reliable browser experience.
start "" "%~dp0index.html"
pause

:end
endlocal
