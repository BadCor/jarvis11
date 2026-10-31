import os, sys, threading, webbrowser, time
from http.server import SimpleHTTPRequestHandler, HTTPServer
import socket

def find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]

def run_server(port, directory):
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=directory, **kwargs)
        def log_message(self, format, *args):
            pass # Silent log

    httpd = HTTPServer(('127.0.0.1', port), Handler)
    httpd.serve_forever()

def get_bundle_dir():
    # If frozen with PyInstaller:
    if getattr(sys, 'frozen', False):
        # When --onedir is used, sys.executable is inside the bundle directory
        base = getattr(sys, '_MEIPASS', os.path.dirname(sys.executable))
    else:
        base = os.path.dirname(os.path.abspath(__file__))

    # Check potential dist folder locations
    candidates = [
        os.path.join(base, "dist"),
        os.path.join(base, "_internal", "dist"),
        base
    ]
    for c in candidates:
        if os.path.exists(os.path.join(c, "index.html")):
            return c
    return base

def main():
    target_dir = get_bundle_dir()
    print(f"[*] Запуск JARVIS из каталога: {target_dir}")

    port = find_free_port()
    t = threading.Thread(target=run_server, args=(port, target_dir), daemon=True)
    t.start()

    url = f"http://127.0.0.1:{port}"
    time.sleep(0.3)

    # Try pywebview if installed for native window, otherwise open default browser
    opened_native = False
    try:
        import webview
        window = webview.create_window(
            title="JARVIS Cyber-HUD",
            url=url,
            width=1280,
            height=820,
            resizable=True,
            fullscreen=False,
            background_color="#050B14"
        )
        opened_native = True
        webview.start()
    except Exception as e:
        opened_native = False

    if not opened_native:
        print(f"[*] JARVIS открыт в браузере: {url}")
        webbrowser.open(url)
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass

if __name__ == '__main__':
    main()
