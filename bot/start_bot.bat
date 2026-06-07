@echo off
cd /d D:\CLAUDE\laboratory\bot
:loop
python main.py
timeout /t 5 /nobreak
goto loop
