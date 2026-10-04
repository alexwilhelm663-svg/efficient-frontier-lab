# Validierung – Version 1.0.0

Prüfdatum: 04.10.2026.

## Rechenkern

`npm test`: **19 Tests erfolgreich**, Node 24.19.0. Geprüft werden unter anderem
die Kovarianzformel, analytische Referenzlösungen, Long-only-Grenzen,
Unerreichbarkeit, Seed-Reproduzierbarkeit, gleiche oder negative Renditen,
negative Überschussrenditen, ungültige Korrelationsmatrizen und CSV-Einheiten.

`python scripts/reference-check.py`: **21 Konfigurationen mit 2–6 Assets**, davon
die Originalannahmen sowie 20 unabhängig erzeugte, gültige Korrelationsmodelle.
Der JavaScript-Optimierer wird mit SciPy/SLSQP verglichen:

| Prüfung | Ergebnis |
|---|---|
| Minimum-Varianz plus sieben Zielrenditen je Modell | 168 erfolgreiche Vergleiche |
| Größte absolute Varianzabweichung | 4,04 × 10⁻¹⁴ |
| Maximum-Sharpe je Modell | 21 erfolgreiche Vergleiche |
| Größte absolute Sharpe-Abweichung | 5,49 × 10⁻¹³ |

Zusätzlich liegt der berechnete globale Minimalrisikowert unter dem Risiko aller
10.000 Testmischungen; deren Sharpe-Werte überschreiten das berechnete Maximum
nicht. Ein eigener Test deckt den Rechenkern mit acht Assets ab. Diese Prüfungen
sind keine Garantie für jede extrem schlecht konditionierte Eingabe.

## Browser und Bedienung

`scripts/browser-check.mjs`: erfolgreich in Chromium 134.0.6998.35, ohne
JavaScript-Fehler. Viewports: 1440 × 1050, 768 × 1024 und 390 × 1000 Pixel.

- Standarddarstellung und erwartete Ergebnisse.
- Nicht erreichbares Risikobudget, Rücksetzen und Neuberechnen.
- Ungültige Korrelationsmatrix bei erhaltenem vorherigen Rechenstand.
- CSV-Download mit 5.000 Datenzeilen.
- JSON-Export, gültiger und ungültiger Import.
- Asset-Namen mit HTML-Zeichen werden als Text angezeigt.
- Dezimalwerte außerhalb einfacher Zehntelschritte bleiben gültig.
- Kein horizontaler Überlauf der gesamten Seite in den drei Viewports.
- Der lokale Server liefert interne Projektdateien und Pfadtraversal-Anfragen
  nicht aus.

Die gespeicherten Ansichten `preview-desktop.png`, `preview-tablet.png` und
`preview-mobile.png` dokumentieren das Layout. Desktop und Smartphone wurden
zusätzlich visuell kontrolliert. Safari und Firefox wurden nicht getestet.

Optional reproduzieren:

```bash
npm install --no-save playwright
npx playwright install chromium
node scripts/browser-check.mjs
```

Ein abweichend installierter Chromium-Pfad kann über
`PLAYWRIGHT_CHROMIUM_EXECUTABLE` übergeben werden.

## Bereitstellung

`npm run build` erzeugt die Anwendung in `dist/`. Der GitHub-Testworkflow ist
vorbereitet; ob er auf GitHub erfolgreich läuft, muss nach dem Upload am
tatsächlichen Workflow-Lauf geprüft werden. GitHub Pages wird nur manuell
veröffentlicht. Der lokal getestete Build ist noch kein Nachweis einer
erfolgreichen Veröffentlichung.
