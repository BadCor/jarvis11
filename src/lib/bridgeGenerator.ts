export const PYTHON_BRIDGE_CODE = `# -*- coding: utf-8 -*-
"""
JARVIS Windows Agent & Web Bridge
Автономный локальный мост для управления Windows из веб-интерфейса JARVIS.
Поддерживает CORS для мгновенного приёма команд из браузера на http://127.0.0.1:8765.
"""

import os
import sys
import json
import time
import queue
import random
import ctypes
import datetime
import threading
import subprocess
import webbrowser
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

try:
    import psutil
except ImportError:
    psutil = None

try:
    import pyttsx3
    tts_engine = pyttsx3.init()
    for v in tts_engine.getProperty('voices'):
        if 'irina' in v.name.lower():
            tts_engine.setProperty('voice', v.id)
            break
    tts_engine.setProperty('rate', 190)
except Exception:
    tts_engine = None

WORKSPACE_DIR = os.path.dirname(os.path.abspath(__file__))
gestures_process = None
tts_lock = threading.Lock()

# Windows Virtual Keys
VK_VOLUME_MUTE = 0xAD
VK_VOLUME_DOWN = 0xAE
VK_VOLUME_UP = 0xAF
VK_MEDIA_NEXT = 0xB0
VK_MEDIA_PREV = 0xB1
VK_MEDIA_PLAY_PAUSE = 0xB3
VK_LWIN = 0x5B
VK_LMENU = 0x12  # Alt
VK_F4 = 0x73
VK_TAB = 0x09
VK_DOWN = 0x28
VK_UP = 0x26
VK_D = 0x44
VK_V = 0x56
VK_SHIFT = 0x10
VK_S = 0x53

def press_key(vk):
    if sys.platform == 'win32':
        ctypes.windll.user32.keybd_event(vk, 0, 0, 0)
        time.sleep(0.04)
        ctypes.windll.user32.keybd_event(vk, 0, 2, 0)

def press_combo(*vks):
    if sys.platform == 'win32':
        for vk in vks:
            ctypes.windll.user32.keybd_event(vk, 0, 0, 0)
        time.sleep(0.04)
        for vk in reversed(vks):
            ctypes.windll.user32.keybd_event(vk, 0, 2, 0)

def speak(text):
    if not tts_engine:
        print(f"[JARVIS ГОЛОС]: {text}")
        return
    def _run():
        with tts_lock:
            try:
                tts_engine.say(text)
                tts_engine.runAndWait()
            except Exception as e:
                print(f"[TTS Error]: {e}")
    threading.Thread(target=_run, daemon=True).start()

def get_battery_status():
    if not psutil:
        return "Модуль psutil не установлен. Заряд определить невозможно."
    b = psutil.sensors_battery()
    if not b:
        return "Информация об аккумуляторе недоступна."
    percent = int(b.percent)
    state = "ноутбук подключён к сети" if b.power_plugged else "работа от аккумулятора"
    return f"Заряд аккумулятора {percent} процентов, {state}."

def set_brightness(val):
    val = max(10, min(100, val))
    cmd = f'powershell -NoProfile -Command "(Get-CimInstance -Namespace root/WMI -ClassName WmiMonitorBrightnessMethods).WmiSetBrightness(1, {val})"'
    subprocess.Popen(cmd, shell=True)

def launch_telegram():
    candidates = [
        os.path.expandvars(r"%APPDATA%\\Telegram Desktop\\Telegram.exe"),
        os.path.expandvars(r"%LOCALAPPDATA%\\Telegram Desktop\\Telegram.exe"),
        r"C:\\Program Files\\Telegram Desktop\\Telegram.exe",
    ]
    for c in candidates:
        if os.path.exists(c):
            subprocess.Popen([c])
            return True
    try:
        os.startfile("tg://")
        return True
    except Exception:
        webbrowser.open("https://web.telegram.org/k/")
        return True

def launch_steam():
    candidates = [
        r"C:\\Program Files (x86)\\Steam\\steam.exe",
        r"C:\\Program Files\\Steam\\steam.exe",
        r"D:\\Steam\\steam.exe",
    ]
    for c in candidates:
        if os.path.exists(c):
            subprocess.Popen([c])
            return True
    try:
        os.startfile("steam://")
        return True
    except Exception:
        speak("Steam не найден на этом компьютере.")
        return False

def launch_obs():
    candidates = [
        r"C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe",
        r"C:\\Program Files (x86)\\obs-studio\\bin\\64bit\\obs64.exe",
    ]
    for c in candidates:
        if os.path.exists(c):
            subprocess.Popen([c], cwd=os.path.dirname(c))
            return True
    webbrowser.open("https://obsproject.com")
    return True

def toggle_gestures(enable=True):
    global gestures_process
    gestures_script = os.path.join(WORKSPACE_DIR, "resources", "gestures", "jarvis_gestures.py")
    if not os.path.exists(gestures_script):
        gestures_script = os.path.join(WORKSPACE_DIR, "jarvis_gestures.py")
    
    if enable:
        if gestures_process and gestures_process.poll() is None:
            speak("Управление жестами уже активно.")
            return
        if os.path.exists(gestures_script):
            speak("Управление жестами с камеры включено.")
            gestures_process = subprocess.Popen([sys.executable, gestures_script], cwd=os.path.dirname(gestures_script))
        else:
            speak("Скрипт жестов jarvis_gestures.py не найден.")
    else:
        if gestures_process and gestures_process.poll() is None:
            gestures_process.terminate()
            gestures_process = None
        speak("Управление жестами выключено.")

def execute_command(text):
    text = text.lower().strip()
    print(f"[JARVIS CMD]: {text}")

    # 1. Запуск программ
    if any(w in text for w in ["телеграм", "телегу", "telegram", "тг"]):
        speak("Открываю Telegram")
        launch_telegram()
    elif any(w in text for w in ["стим", "steam"]):
        speak("Запускаю Steam")
        launch_steam()
    elif any(w in text for w in ["обс", "obs", "стрим"]):
        speak("Запускаю OBS Studio")
        launch_obs()
    elif any(w in text for w in ["браузер", "хром", "chrome", "яндекс браузер"]):
        speak("Открываю браузер")
        webbrowser.open("https://www.google.com")
    elif any(w in text for w in ["дискорд", "discord"]):
        speak("Открываю Discord")
        os.system("start discord:// || start https://discord.com/app")
    elif any(w in text for w in ["калькулятор", "посчитай", "calc"]):
        speak("Калькулятор готов")
        subprocess.Popen("calc.exe")
    elif any(w in text for w in ["блокнот", "заметки", "notepad"]):
        speak("Открываю Блокнот")
        subprocess.Popen("notepad.exe")
    elif any(w in text for w in ["проводник", "компьютер", "диск", "папки"]):
        speak("Открываю Проводник")
        subprocess.Popen("explorer.exe")
    elif any(w in text for w in ["диспетчер задач", "процессы"]):
        speak("Диспетчер задач")
        subprocess.Popen("taskmgr.exe")
    elif any(w in text for w in ["настройки", "параметры"]):
        speak("Параметры Windows")
        subprocess.Popen("start ms-settings:", shell=True)
    elif any(w in text for w in ["камера", "вебка"]):
        speak("Запускаю камеру")
        subprocess.Popen("start microsoft.windows.camera:", shell=True)
    elif any(w in text for w in ["пэйнт", "пейнт", "paint"]):
        speak("Открываю Paint")
        subprocess.Popen("mspaint.exe")
    elif any(w in text for w in ["терминал", "консоль", "powershell"]):
        speak("Терминал запущен")
        subprocess.Popen("wt.exe" if os.system("where wt >nul 2>&1") == 0 else "powershell.exe")

    # 2. Веб-платформы и сайты
    elif any(w in text for w in ["ютуб", "youtube"]):
        speak("Открываю YouTube")
        webbrowser.open("https://www.youtube.com")
    elif any(w in text for w in ["музыка", "яндекс музыка"]):
        speak("Включаю Яндекс Музыку")
        webbrowser.open("https://music.yandex.ru")
    elif any(w in text for w in ["кинопоиск", "фильмы"]):
        speak("Открываю Кинопоиск")
        webbrowser.open("https://www.kinopoisk.ru")
    elif any(w in text for w in ["вконтакте", "вк"]):
        speak("ВКонтакте")
        webbrowser.open("https://vk.com")
    elif any(w in text for w in ["гитхаб", "github"]):
        speak("Открываю GitHub")
        webbrowser.open("https://github.com")
    elif any(w in text for w in ["вайлдберриз", "вайлдбериз", "вб"]):
        speak("Wildberries")
        webbrowser.open("https://www.wildberries.ru")
    elif any(w in text for w in ["озон", "ozon"]):
        speak("Ozon")
        webbrowser.open("https://www.ozon.ru")
    elif any(w in text for w in ["авито"]):
        speak("Авито")
        webbrowser.open("https://www.avito.ru")

    # 3. ИИ-платформы
    elif any(w in text for w in ["чат гпт", "чатгпт", "chatgpt", "gpt"]):
        speak("Открываю ChatGPT")
        webbrowser.open("https://chatgpt.com")
    elif any(w in text for w in ["дипсик", "дипсиг", "deepseek"]):
        speak("Запускаю DeepSeek")
        webbrowser.open("https://chat.deepseek.com")
    elif any(w in text for w in ["клод", "claude"]):
        speak("Открываю Claude")
        webbrowser.open("https://claude.ai")

    # 4. Поиск в сети
    elif text.startswith("найди в гугле") or text.startswith("погугли"):
        q = re.sub(r"^(найди в гугле|погугли)\\s*", "", text)
        speak(f"Ищу в Google: {q}")
        webbrowser.open(f"https://www.google.com/search?q={q}")
    elif text.startswith("найди на ютубе"):
        q = re.sub(r"^найди на ютубе\\s*", "", text)
        speak(f"Ищу на YouTube: {q}")
        webbrowser.open(f"https://www.youtube.com/results?search_query={q}")

    # 5. Управление звуком и медиа
    elif any(w in text for w in ["громче", "прибавь звук", "сделай громче"]):
        for _ in range(5): press_key(VK_VOLUME_UP)
        speak("Звук прибавлен")
    elif any(w in text for w in ["тише", "убавь звук", "сделай тише"]):
        for _ in range(5): press_key(VK_VOLUME_DOWN)
        speak("Звук убавлен")
    elif any(w in text for w in ["выключи звук", "без звука", "заглуши"]):
        press_key(VK_VOLUME_MUTE)
        speak("Звук отключен")
    elif any(w in text for w in ["пауза", "стоп музыка", "продолжи", "играй"]):
        press_key(VK_MEDIA_PLAY_PAUSE)
    elif any(w in text for w in ["следующий трек", "следующая песня"]):
        press_key(VK_MEDIA_NEXT)
    elif any(w in text for w in ["предыдущий трек", "предыдущая песня"]):
        press_key(VK_MEDIA_PREV)

    # 6. Окна и система
    elif any(w in text for w in ["сверни всё", "сверни все", "рабочий стол"]):
        press_combo(VK_LWIN, VK_D)
        speak("Свернул все окна")
    elif any(w in text for w in ["сверни", "сверни окно"]):
        press_combo(VK_LWIN, VK_DOWN)
    elif any(w in text for w in ["разверни", "на весь экран"]):
        press_combo(VK_LWIN, VK_UP)
    elif any(w in text for w in ["закрой окно", "закрой это"]):
        press_combo(VK_LMENU, VK_F4)
    elif any(w in text for w in ["скриншот", "снимок экрана"]):
        press_combo(VK_LWIN, VK_SHIFT, VK_S)
    elif any(w in text for w in ["буфер", "буфер обмена", "история буфера"]):
        press_combo(VK_LWIN, VK_V)
    elif any(w in text for w in ["очисти корзину"]):
        os.system('powershell -NoProfile -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"')
        speak("Корзина очищена.")
    elif any(w in text for w in ["сколько батареи", "заряд", "уровень заряда", "батарея"]):
        info = get_battery_status()
        speak(info)

    # 7. Управление жестами
    elif any(w in text for w in ["включи жесты", "запусти жесты"]):
        toggle_gestures(True)
    elif any(w in text for w in ["выключи жесты", "отключи жесты"]):
        toggle_gestures(False)

    # 8. Время
    elif any(w in text for w in ["который час", "сколько времени", "время"]):
        now = datetime.datetime.now()
        speak(f"Сейчас {now.hour} часов {now.minute} минут.")
    else:
        speak("Команда принята, сэр.")


class JarvisBridgeHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        data = {
            "status": "online",
            "server": "JARVIS Windows Bridge 2.0",
            "time": datetime.datetime.now().isoformat(),
            "platform": sys.platform
        }
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8", errors="replace").strip()
        
        if self.path in ["/command", "/"]:
            if body:
                threading.Thread(target=execute_command, args=(body,), daemon=True).start()
            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            resp = {"success": True, "command": body}
            self.wfile.write(json.dumps(resp).encode("utf-8"))
        else:
            self.send_response(404)
            self._send_cors_headers()
            self.end_headers()

    def log_message(self, format, *args):
        pass


def main():
    port = 8765
    print("=" * 60)
    print(f"[*] JARVIS Windows Bridge запущен на порту {port}")
    print(f"[*] Готов принимать команды из веб-интерфейса JARVIS")
    print("=" * 60)
    speak("Системы Джарвис инициализированы. Связь с веб-интерфейсом установлена.")

    server = ThreadingHTTPServer(("127.0.0.1", port), JarvisBridgeHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\\n[!] Мост остановлен пользователем.")
        if gestures_process:
            gestures_process.terminate()

if __name__ == "__main__":
    main()
`;

export const BAT_START_CODE = `@echo off
title JARVIS Windows Bridge
cd /d "%~dp0"
echo ========================================================
echo   Zapusk lokalnogo agenta JARVIS dlya Windows
echo   Port: 8765 (CORS vkluchen)
echo ========================================================
python jarvis_bridge.py
if %errorlevel% neq 0 (
    echo.
    echo [Oshibka] Proverte, chto Python ustanovlen i dobavlen v PATH.
    pause
)
`;
