#!/usr/bin/env python3
"""Lokaler Server für das ETF-Rückblick-Tool.

- Serviert die statischen Dateien aus dem Projektordner.
- Bietet /api/prices?symbol=<stooq_symbol> als Proxy, um CORS-Probleme zu vermeiden.
"""

from __future__ import annotations

import csv
import io
import json
import urllib.error
import urllib.parse
import urllib.request
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

HOST = "0.0.0.0"
PORT = 8000
STOOQ_URL = "https://stooq.com/q/d/l/?s={symbol}&i=d"


class AppHandler(SimpleHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802 (HTTP verb name)
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == "/api/prices":
            self.handle_prices_api(parsed.query)
            return

        super().do_GET()

    def handle_prices_api(self, query: str) -> None:
        params = urllib.parse.parse_qs(query)
        symbol = (params.get("symbol") or [""])[0].strip().lower()

        if not symbol:
            self.send_json({"error": "Parameter 'symbol' fehlt."}, status=HTTPStatus.BAD_REQUEST)
            return

        try:
            rows = fetch_stooq_rows(symbol)
        except ValueError as exc:
            self.send_json({"error": str(exc)}, status=HTTPStatus.BAD_REQUEST)
            return
        except RuntimeError as exc:
            self.send_json({"error": str(exc)}, status=HTTPStatus.BAD_GATEWAY)
            return

        self.send_json({"symbol": symbol, "prices": rows})

    def send_json(self, payload: dict, status: HTTPStatus = HTTPStatus.OK) -> None:
        raw = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)


def fetch_stooq_rows(symbol: str) -> list[dict[str, str | float]]:
    url = STOOQ_URL.format(symbol=urllib.parse.quote(symbol, safe=""))
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})

    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            raw_csv = res.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"Kursdaten konnten nicht geladen werden (HTTP {exc.code}).") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError("Kursdaten konnten nicht geladen werden (Netzwerkfehler).") from exc

    reader = csv.DictReader(io.StringIO(raw_csv))
    rows: list[dict[str, str | float]] = []

    for row in reader:
        date = (row.get("Date") or "").strip()
        close_raw = (row.get("Close") or "").strip()
        if not date or not close_raw:
            continue

        try:
            close = float(close_raw)
        except ValueError:
            continue

        rows.append({"date": date, "close": close})

    if len(rows) < 5:
        raise ValueError("Zu wenige Kursdaten gefunden. Bitte Symbol prüfen.")

    return rows


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), AppHandler)
    print(f"Server läuft auf http://{HOST}:{PORT}")
    server.serve_forever()
