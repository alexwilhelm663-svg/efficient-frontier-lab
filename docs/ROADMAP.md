# Projektplan

## Version 1.0 – implementiert

- [x] Unabhängiger Rechenkern mit validierten jährlichen Annahmen.
- [x] Seed-basierte Simulation und separate Stichproben-Hülle.
- [x] Optimierte Long-only-Effizienzkurve, Minimum-Varianz und Maximum-Sharpe.
- [x] Höchste Rendite im gewählten Risikobudget.
- [x] Deutsche Oberfläche für Desktop und Smartphone.
- [x] JSON-Annahmen und CSV-Export.
- [x] Node-Tests, unabhängiger SciPy-Abgleich und CI-Workflow.
- [x] Manueller GitHub-Pages-Workflow vorbereitet.

## Mögliche nächste Ausbaustufe

1. **Eigene historische Daten:** bereinigte Kurs-CSV importieren, gemeinsame
   Handelstage prüfen, fehlende Werte sichtbar machen und einfache Renditen
   konsistent annualisieren. Krypto mit 365 Tagen und Aktien mit Handelstagen
   nicht unkontrolliert zusammenführen.
2. **Stabilität statt Scheingenauigkeit:** Schätzunsicherheit, Korrelationsstress,
   Bootstrap-Bänder und Gewichtssensitivität zeigen.
3. **Praktische Grenzen:** maximale Einzelgewichte, Transaktionskosten,
   Umschichtungsgrenzen und ein explizites Cash-Asset modellieren.
4. **Optionaler Elliott-Anschluss:** technische Signale können später die
   zulässigen Assets oder Gewichtungsgrenzen beeinflussen. Bestehende
   Wellenregeln, Invalidation und 1–2-Setups bleiben eigenständig. Vor Nutzung
   Point-in-Time-Daten und Walk-forward-Prüfung einführen.

Diese Erweiterungen sind nicht Bestandteil der ausgelieferten Version 1.0.
