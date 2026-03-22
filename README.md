# ETF-Sparplan Rückblick (A2PKXG)

Kleines Web-Tool, um rückblickend zu simulieren, wie sich ein monatlicher Sparbetrag (z. B. 430 €) in einem ETF entwickelt hätte.

## Features

- Verwendet historische Tageskurse von Stooq (Close-Kurse)
- Monatliche Sparrate ab frei wählbarem Startmonat
- Optionale Einmalanlage zu Beginn
- Vergleich mit hypothetisch "abbezahlter" Hypothek (Summe der Monatsraten)
- Ergebniskennzahlen + einfacher Verlaufsgraf

## Lokal starten

```bash
python -m http.server 8000
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

## Hinweis

- Daten kommen direkt von `stooq.com`.
- Falls ein Symbol nicht gefunden wird, ein anderes Stooq-Symbol eingeben (z. B. `vwce.de`).
