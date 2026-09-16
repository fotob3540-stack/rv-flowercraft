from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

HOST = "0.0.0.0"
PORT = 8080

class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

if __name__ == "__main__":
    print(f"RV FLOWERCRAFT V21 berjalan di http://127.0.0.1:{PORT}")
    print(f"Akses LAN: http://<IP-HP>:{PORT}")
    ThreadingHTTPServer((HOST, PORT), NoCacheHandler).serve_forever()
