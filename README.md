# 🤖 JARVIS Cyber-HUD

> Голосовой и жестовый ассистент с оригинальной озвучкой Джарвиса из «Железного человека».

---

## 🚀 Быстрый запуск на компьютере (Windows / Mac / Linux)

### Способ 1: Без установки (через start.bat)
1. Скачайте проект или клонируйте репозиторий:
   ```bash
   git clone https://github.com/ВАШ_НИК/jarvis-cyberhud.git
   cd jarvis-cyberhud
   ```
2. Дважды нажмите на файл **`start.bat`** в корне папки.
3. Выберите:
   * **[1]** — Запустить прямо сейчас в браузере / отдельном окне.
   * **[2]** — Собрать в один файл **`JARVIS.exe`** (через PyInstaller).

---

### Способ 2: Запуск через Node.js (для разработчиков)
```bash
npm install
npm run dev
```
Откройте браузер по адресу: `http://localhost:3000`

---

## 🌐 Бесплатный деплой на GitHub Pages (в 1 клик)

Проект уже полностью настроен для GitHub Pages с готовым файлом `.github/workflows/deploy.yml`:

1. Создайте новый репозиторий на **GitHub** (например, `jarvis`).
2. Запушьте код в репозиторий:
   ```bash
   git init
   git add .
   git commit -m "Initial commit JARVIS"
   git branch -M main
   git remote add origin https://github.com/ВАШ_НИК/jarvis.git
   git push -u origin main
   ```
3. В настройках репозитория на GitHub перейдите в:
   **Settings $\rightarrow$ Pages $\rightarrow$ Build and deployment $\rightarrow$ Source** и выберите **GitHub Actions**.
4. GitHub сам соберёт и опубликует сайт. Ссылка будет вида:
   `https://ВАШ_НИК.github.io/jarvis/`
5. JARVIS сразу будет доступен со всеми звуковыми репликами, распознаванием жестов и микрофоном!

---

## 🎙️ Особенности
* **Работа в свёрнутом режиме**: Распознавание речи не засыпает, когда окно браузера свёрнуто или находится на фоне.
* **Оригинальная озвучка**: 200+ аутентичных голосовых ответов Джарвиса.
* **Камера жестов**: Управление через веб-камеру (ладонь, кулак, победа, палец вверх).
* **Мобильная адаптация**: Полная поддержка iPhone (PWA, Dynamic Island safe-areas) и Android.
