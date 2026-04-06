#!/usr/bin/env python3
"""serve_spa.py — Threaded SPA HTTP server with SPA routing.
All GET requests that don't match a real file are redirected to /index.html.
"""

import os
import socketserver
import http.server

PORT = 8000
DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")


class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        path = self.translate_path(self.path)
        if os.path.isfile(path):
            return super().do_GET()
        self.path = "/index.html"
        return super().do_GET()

    def log_message(self, format, *args):
        if args[0] != "/favicon.ico":
            print(f"[serve_spa] {args[0]}", flush=True)


if __name__ == "__main__":
    os.chdir(DIRECTORY)
    with ThreadedTCPServer(("", PORT), SPAHandler) as httpd:
        print(f"[serve_spa] Serving on http://0.0.0.0:{PORT}", flush=True)
        httpd.serve_forever()
