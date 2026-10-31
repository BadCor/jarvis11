@echo off
chcp 65001 > nul
title JARVIS — Запуск и сборка EXE
color 0B

echo ================================================================
echo           🤖 JARVIS CYBER-HUD — WINDOWS LAUNCHER ^& BUILDER
echo ================================================================
echo.

:: 1. Проверяем наличие Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Python не обнаружен в PATH.
    echo Попытка открыть веб-версию напрямую в браузере...
    goto try_node
)

:: Проверяем, собран ли dist, если нет — собираем
if not exist "dist\index.html" (
    echo [1/3] Первичная сборка веб-модулей проекта (npm run build)...
    call npm run build
)

:: Меню выбора
echo Выберите действие:
echo   [1] Запустить JARVIS прямо сейчас
echo   [2] Собрать автономный JARVIS.exe (для запуска в 1 клик без консолей)
echo   [3] Запустить сервер разработки (npm run dev)
echo.
set /p user_choice="Введите номер (по умолчанию 1): "

if "%user_choice%"=="2" goto build_exe
if "%user_choice%"=="3" goto dev_mode

:run_now
echo.
echo [*] Запуск JARVIS через launcher.py...
python launcher.py
goto end

:build_exe
echo.
call build_exe.bat
goto end

:dev_mode
echo.
echo [*] Запуск в режиме разработки...
call npm run dev
goto end

:try_node
if exist "dist\index.html" (
    echo [*] Открытие dist\index.html в вашем браузере...
    start "" "dist\index.html"
) else (
    echo [*] Сборка проекта...
    call npm run build
    start "" "dist\index.html"
)

:end
echo.
echo Нажмите любую клавишу для выхода...
pause > nul
