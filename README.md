# ETF-Sparplan Rückblick (A2PKXG)

Kleines Web-Tool, um rückblickend zu simulieren, wie sich ein monatlicher Sparbetrag (z. B. 430 €) in einem ETF entwickelt hätte.

## Wichtig: gegen "Failed to fetch"

Die App nutzt einen lokalen Backend-Proxy (`/api/prices`), damit es **keine CORS-Fehler** beim Laden der Stooq-Kurse gibt.
Darum bitte **nicht** mit reinem Static Hosting starten, sondern mit dem Python-Server unten.

## Features

- Verwendet historische Tageskurse von Stooq (Close-Kurse)
- Monatliche Sparrate ab frei wählbarem Startmonat
- Optionale Einmalanlage zu Beginn
- Vergleich mit hypothetisch "abbezahlter" Hypothek (Summe der Monatsraten)
- Ergebniskennzahlen + einfacher Verlaufsgraf

## Lokal starten

```bash
python server.py
```

Dann im Browser öffnen:

```text
http://localhost:8000
```

## Beispiel

- Symbol: `a2pkxg.de`
- Startmonat: `2012-01`
- Enddatum: heute
- Monatliche Rate: `430`

Das Tool zeigt dann, wie viel investiert worden wäre und welchen Depotwert du mit den realen Kursdaten gehabt hättest.

## Deployment-Hinweis

Wenn du die App auf einem Server betreibst, muss derselbe Prozess sowohl die statischen Dateien als auch den Endpoint `/api/prices` ausliefern.
