@echo off
chcp 65001 > nul
title JARVIS — Сборка EXE
color 0A

echo ================================================================
echo           🔨 АВТОМАТИЧЕСКАЯ СБОРКА JARVIS.EXE
echo ================================================================
echo.

:: 1. Проверяем наличие Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ОШИБКА] Python не установлен или не добавлен в PATH!
    echo Скачайте и установите Python с python.org (обязательно отметьте "Add python.exe to PATH").
    echo.
    pause
    exit /b 1
)

echo [1/3] Установка необходимых библиотек для сборки (PyInstaller, PyWebView)...
python -m pip install --upgrade pip >nul 2>&1
python -m pip install pyinstaller pywebview

:: 2. Проверяем наличие веб-сборки dist
echo.
echo [2/3] Проверка веб-дистрибутива...
if not exist "dist\index.html" (
    echo Сборка веб-файлов проекта через npm run build...
    call npm run build
    if not exist "dist\index.html" (
        echo [ОШИБКА] Не удалось собрать dist. Убедитесь, что установлен Node.js.
        pause
        exit /b 1
    )
)

:: 3. Очистка предыдущей сборки если была
if exist "build" rmdir /s /q "build" >nul 2>&1

:: 4. Запуск сборщика PyInstaller
echo.
echo [3/3] Компиляция автономного JARVIS.exe...
python -m PyInstaller --noconfirm --onedir --windowed --name "JARVIS" --distpath "bin" --add-data "dist;dist" launcher.py

echo.
echo ================================================================
if exist "bin\JARVIS\JARVIS.exe" (
    echo [УСПЕХ] Сборка успешно завершена!
    echo Исполняемый файл находится здесь: bin\JARVIS\JARVIS.exe
    echo Вы можете переместить папку bin\JARVIS в любое место или создать ярлык на рабочем столе.
    echo ================================================================
    echo.
    set /p run_now="Запустить JARVIS.exe сейчас? (y/n): "
    if /i "%run_now%"=="y" start "" "bin\JARVIS\JARVIS.exe"
) else (
    echo [!] Проверьте вывод ошибок консоли выше.
    echo ================================================================
)
pause
