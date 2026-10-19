@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (set "PY=py -3") else (set "PY=python")
echo [SmartGrowth] Creating consistent SQLite backup with Python...
%PY% -c "import sqlite3,datetime,pathlib; source=pathlib.Path('backend/data/growth_demo.sqlite3'); dest=pathlib.Path('backups'); dest.mkdir(exist_ok=True); outfile=dest/('smartgrowth-'+datetime.datetime.now().strftime('%%Y%%m%%d-%%H%%M%%S')+'.sqlite3'); assert source.exists(), 'No database yet. Sign in and save a record first.'; s=sqlite3.connect(source); d=sqlite3.connect(outfile); s.backup(d); d.close(); s.close(); print('Saved to',outfile)"
if errorlevel 1 (echo Database backup failed.&pause&exit /b 1)
echo Keep backups private. They include account password hashes and financial records.
pause
