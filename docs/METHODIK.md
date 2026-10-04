# Rechenmodell und Abgrenzung

## Größen und Einheiten

Alle Eingaben im Rechenkern sind jährliche Dezimalwerte: `0.07` bedeutet 7 %.
Die Oberfläche rechnet Prozentwerte beim Einlesen um. Der CSV-Export bleibt bei
Dezimalwerten und kennzeichnet die Einheiten in den Spaltennamen.

Für Gewichte `w`, erwartete Renditen `μ`, Standardabweichungen `σ` und
Korrelationen `ρ` gelten:

```text
Σ[i,j] = ρ[i,j] · σ[i] · σ[j]
Rendite = wᵀ μ
Varianz = wᵀ Σ w
Volatilität = sqrt(Varianz)
Sharpe = (Rendite − Vergleichszins) / Volatilität
```

Es gilt `w[i] ≥ 0` und `sum(w) = 1`. Rendite meint hier die erwartete einfache
Periodenrendite, nicht geometrische Wachstumsrate oder CAGR. Alle Größen beziehen
sich auf denselben Einjahreshorizont. Es werden keine Tagesdaten annualisiert.

## Simulation und Optimierung sind getrennt

Die Simulation zieht mit Mulberry32 und einem konfigurierbaren Seed positive
Exponentialvariablen und normalisiert sie. Das ergibt Dirichlet(1,…,1), also
eine Gleichverteilung auf dem Gewichts-Simplex. Normalisierte gleichverteilte
Zahlen hätten eine andere, zur Mitte verzerrte Gewichtsverteilung.

Die Stichproben-Hülle behält nur Punkte, deren Rendite höher ist als bei allen
Punkten mit geringerem oder gleichem Risiko. Bei gleichem Risiko wird die höchste
Rendite zuerst geprüft. Diese Hülle hängt von Stichprobe und Seed ab. Sie ist
eine Näherung, kein Beweis für die optimale Portfoliomischung.

Der Optimierer minimiert für jede Zielrendite die quadratische Varianz unter
Budget-, Zielrendite- und Long-only-Bedingungen. Er enumeriert sämtliche
nichtleeren Teilmengen aktiver Assets. Pro Teilmenge löst er die Gleichungen des
quadratischen Problems; negative Gewichte werden verworfen. Anschließend wird
der kleinste zulässige Varianzwert gewählt. Bei positiv definiter Kovarianzmatrix
enthält diese vollständige Suche das globale Optimum bis auf Gleitkommafehler.
Die Kurve zeigt 121 solcher Lösungen, verbunden durch Linien. Die Linien zwischen
Stützpunkten sind eine Darstellung, keine zusätzlichen Optimierungsresultate.

Die Enumeration ist für 2–8 Assets begrenzt (maximal 255 Teilmengen). Laufzeit
und Speicher dürfen nicht unbemerkt exponentiell mit großen Universen wachsen.
Renditen werden pro Teilmenge zentriert und skaliert, um numerische Auslöschung
bei ähnlichen Erwartungswerten zu verringern.

## Referenzportfolios

- **Minimum-Varianz:** Optimierung ohne Renditeziel.
- **Effizienzkurve:** Zielrenditen vom Minimum-Varianz-Portfolio bis zur höchsten
  Asset-Rendite. Der untere, ineffiziente Ast wird nicht gezeichnet.
- **Maximum-Sharpe:** Tangentialportfolio auf jeder zulässigen aktiven Teilmenge
  plus die einzelnen Assets vergleichen. Wenn alle Überschussrenditen
  nichtpositiv sind, liegt das Maximum bei einem einzelnen Asset. In diesem
  Sonderfall muss es nicht auf dem effizienten Ast liegen.
- **Risikobudget:** Höchste erreichbare Rendite mit Volatilität kleiner oder gleich
  dem Budget. 64 Bisektionsschritte auf dem effizienten Ast. Ein Budget unter dem
  globalen Minimum ist unerreichbar und ergibt `null`. Bei ausreichend großem
  Budget wird das Portfolio mit maximaler Rendite gewählt; zusätzliche
  Risikokapazität erzwingt keine weitere Volatilität.

## Eingabegates

Namen müssen vorhanden und eindeutig, Zahlen endlich und Gewichte nichtnegativ
sein. Korrelationen müssen symmetrisch sein, zwischen −1 und 1 liegen und eine
Einheitsdiagonale besitzen. Ein Cholesky-Test verlangt eine positiv definite
Matrix. Singuläre/redundante Asset-Universen werden ausdrücklich abgelehnt,
anstatt stillschweigend eine Regularisierung einzusetzen. Nahezu singuläre
Matrizen können numerisch empfindlich bleiben; Ergebnisse sind keine
beliebig genaue symbolische Lösung.

Fehlgeschlagene Eingaben ersetzen den letzten gültigen Rechenstand nicht.
Änderungen werden als noch nicht berechnet markiert. JSON-Importe werden vor der
Übernahme validiert. JSON-Export speichert die aktuell validierten Formulareingaben;
CSV-Export speichert die zuletzt berechnete Simulation. Diagramm und Tabelle
arbeiten ebenfalls mit dem zuletzt berechneten Stand.

## Was das Modell nicht sagt

Ein mathematisch optimales Portfolio ist nur relativ zu den Eingaben optimal.
Schätzfehler in erwarteten Renditen können Gewichtungen stark verändern. Ein
niedrigeres Schwankungsmaß bedeutet weder garantierten Kapitalerhalt noch einen
kleineren maximalen Verlust. Aus der Optimierung folgt kein günstiger
Einstiegszeitpunkt. Eine spätere Verbindung zu einem Elliott-System muss diese
Portfolioebene von Trend-, Regel- und Setup-Prüfungen getrennt halten.
