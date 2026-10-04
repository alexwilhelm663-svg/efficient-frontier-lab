# Efficient Frontier Lab

Ein interaktives Portfolio-Labor mit deutscher Oberfläche. Es zeigt, wie Rendite,
Volatilität und Korrelation die optimale Mischung aus drei Assets verändern.
Die Anwendung rechnet vollständig im Browser, ohne Konto, API-Schlüssel,
Marktdatenabruf oder externe JavaScript-Abhängigkeiten.

Inspiriert durch [QuantFinanceToGo, Teil 13: Efficient Frontier](https://vm.tiktok.com/ZGdCREGyc/).
Eigenständige Implementierung; Video, Ton und fremder Quellcode sind nicht enthalten.

## Sofort starten

Voraussetzung: Node.js 22 oder neuer. Ein `npm install` ist nicht erforderlich.

```bash
git clone https://github.com/alexwilhelm663-svg/efficient-frontier-lab.git
cd efficient-frontier-lab
npm start
```

Danach **http://127.0.0.1:8080** öffnen. Der Server lauscht ausschließlich lokal.
Nicht per Doppelklick auf `index.html` starten: JavaScript-Module benötigen einen
HTTP-Server. Ein einmal geladener Tab rechnet ohne weitere Netzwerkanfragen.
Die Anwendung ist keine installierbare PWA und besitzt keinen Offline-Cache.

## Was funktioniert?

- Drei frei benennbare Assets mit jährlicher erwarteter Rendite und Volatilität.
- Veränderbare Korrelationen, Vergleichszins, Risikobudget, Stichprobengröße und Seed.
- Standardmäßig 5.000 reproduzierbare, gleichverteilt gezogene Portfoliogewichte.
- Berechnete Long-only-Effizienzkurve und separat einblendbare Stichproben-Hülle.
- Minimum-Varianz-Portfolio, Maximum-Sharpe-Portfolio und optimale Mischung im Risikobudget.
- Kennzahlentabelle, Gewichtungen und Diagramm mit Punktinformationen.
- JSON-Import/-Export der Annahmen und CSV-Export der simulierten Portfolios.
- Responsive Darstellung für Smartphone und Desktop.
- Ungültige Korrelationsmatrizen und unerreichbare Risikobudgets werden ausdrücklich gemeldet.

## Startannahmen aus dem Video

| Asset | Erwartete Rendite p.a. | Volatilität p.a. |
|---|---:|---:|
| A, anleihenähnlich | 4 % | 6 % |
| B, aktienähnlich | 7 % | 18 % |
| C, risikoreichere Aktien | 11 % | 25 % |

Korrelation A–B = 0, A–C = 0, B–C = 0,5. Vergleichszins: 3 %.
Dies sind **angenommene Modellwerte**, keine aktuellen Marktkennzahlen.
Der Seed 42 gehört zu dieser Implementierung. Der ursprüngliche Zufallsgenerator
des Videos liegt nicht vor; seine Zahl von 825 Hüllenpunkten wird daher nicht
als identischer Reproduktionswert versprochen.

Für diese Annahmen liefert der Rechenkern:

| Portfolio | Rendite p.a. | Volatilität p.a. | Sharpe | A / B / C |
|---|---:|---:|---:|---|
| Geringstes Risiko | 4,4013 % | 5,6738 % | 0,2470 | 89,42 / 8,48 / 2,10 % |
| Beste Sharpe-Ratio | 6,1093 % | 8,4518 % | 0,3679 | 63,82 / 10,59 / 25,59 % |
| Risikobudget 18 % | 9,0590 % | 18,0000 % | 0,3366 | 19,59 / 14,23 / 66,17 % |

Gewichte sind gerundet. Das Modell erzeugt keine Kauf-/Verkaufssignale.

## Entwicklung und Prüfung

```bash
npm test
npm run build
npm run analyse
node scripts/analyse.mjs examples/video-assumptions.json > result.json
```

`npm test` nutzt den eingebauten Node-Test-Runner. Der optionale unabhängige
Vergleich mit SciPy benötigt Python sowie NumPy und SciPy:

```bash
python -m pip install numpy scipy
python scripts/reference-check.py
```

Der Rechenkern unterstützt 2–8 Assets; die Oberfläche und ihr JSON-Import sind
bewusst auf drei Assets begrenzt. Für größere Modelle sollte ein spezialisierter
QP-Solver eingesetzt werden. Details: [Methodik](docs/METHODIK.md),
[Validierung](docs/VALIDIERUNG.md) und [Roadmap](docs/ROADMAP.md).

## GitHub-Projekt

[Repository](https://github.com/alexwilhelm663-svg/efficient-frontier-lab) ·
[Tests](https://github.com/alexwilhelm663-svg/efficient-frontier-lab/actions) ·
[Desktop-Vorschau](docs/preview-desktop.png) · [Smartphone-Vorschau](docs/preview-mobile.png)

Das Projekt ist eigenständig. Die `Test`-Action prüft Änderungen auf Node 22 und 24.

### Optionale Veröffentlichung als Webseite

`npm run build` erzeugt die statische Anwendung in `dist/`. Für GitHub Pages unter
**Settings → Pages → Source** „GitHub Actions“ auswählen und anschließend unter
**Actions → Publish Pages (manual) → Run workflow** starten. Es gibt absichtlich
keinen automatischen Deploy bei einem Push. Die Pages-Verfügbarkeit für private
Repositories hängt vom GitHub-Tarif ab; eine veröffentlichte Seite kann öffentlich
sein. Das Anlegen eines privaten Repositorys veröffentlicht noch keine Webseite.

### Android / Termux

```bash
pkg install nodejs-lts unzip
termux-setup-storage
unzip ~/storage/downloads/efficient-frontier-lab-v1.0.0.zip -d ~/
cd ~/efficient-frontier-lab
npm start
```

Anschließend dieselbe lokale Adresse im Android-Browser öffnen. Nach Download
der Laufzeit und des Projekts braucht die Anwendung keine externen Daten.

## Grenzen

Erwartete Renditen sind Eingaben, keine Vorhersagen. Historische Daten werden in
Version 1 nicht importiert oder automatisch geschätzt. Volatilität ist kein
maximaler Verlust; Extremereignisse, Kosten, Steuern, Liquidität und Änderungen
der Korrelationen fehlen. Long-only, 100 % investiert, kein Hebel. Der
Vergleichszins ist nur eine Sharpe-Referenz; Cash ist kein zusätzliches Asset.
Eingaben werden nicht automatisch gespeichert: zum Aufbewahren JSON exportieren.

## Quellen

- [QuantFinanceToGo: Ausgangsvideo](https://www.tiktok.com/@quantfinancetogo/video/7692678212295396640), Beschreibung abgerufen am 04.10.2026.
- [Harry Markowitz (1952), Portfolio Selection, Journal of Finance 7(1), 77–91](https://doi.org/10.1111/j.1540-6261.1952.tb01525.x).
- [GitHub: Custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), geprüft am 04.10.2026.

Es wurde keine Open-Source-Lizenz festgelegt. Vor einer öffentlichen Freigabe
kann der Repository-Inhaber eine passende Lizenz ergänzen.
