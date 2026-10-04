# Frontier Lab · Asset-Finder

**Konkrete Anlageideen nach deinem Risikoprofil.** Die deutsche Startseite fragt
nach Anlagezeitraum, finanziell tragbaren Verlusten, persönlicher Verlusttoleranz,
Rücklagen und gewünschten Anlagearten. Danach zeigt sie benannte Produkte mit
ISIN oder Kürzel, Erklärung, Risiken und Originalquelle.

Die App läuft auf deinem Gerät. Kein Konto, kein API-Schlüssel, keine
Laufzeit-Abhängigkeiten und keine Übertragung deiner Profilantworten.

## Lokal starten

Node.js 22 oder neuer und Git installieren, dann:

```bash
git clone https://github.com/alexwilhelm663-svg/efficient-frontier-lab.git
cd efficient-frontier-lab
npm start
```

Im Browser **http://127.0.0.1:8080** öffnen. Ein npm install ist nicht nötig.
Der Server lauscht nur auf 127.0.0.1. Mit Strg+C beendest du ihn.

### Vorhandene Installation aktualisieren

Server zuerst mit Strg+C stoppen, dann im Projektordner:

```bash
git pull --ff-only
npm start
```

Anschließend den Tab neu laden.

### Android mit Termux

```bash
pkg update
pkg install -y git nodejs-lts
cd ~
git clone https://github.com/alexwilhelm663-svg/efficient-frontier-lab.git
cd efficient-frontier-lab
npm start
```

Bei einer vorhandenen Git-Installation genügt die Aktualisierung oben.
Wurde die alte Version nur als ZIP entpackt, klone das Repository in einen
neuen Ordner, zum Beispiel mit git clone URL efficient-frontier-lab-v2.

## Was du bekommst

- Eine verständliche Risikoabfrage ohne vorausgefülltes persönliches Profil.
- Sieben konkrete Kataloganlagen: Welt-Aktien-ETF, zwei Anleihen-ETFs,
  Euro-Overnight-ETF, Gold-ETC, Microsoft-Aktie und Bitcoin.
- Auswahl nach Zeitraum, beiden Verlustangaben, Rücklagen und erlaubten Anlagearten.
- Zusätzliche Verständnisabfragen für Swap-ETF, Einzelaktie, Gold-ETC und Krypto.
- Produktkarten mit Kennung, individuellen Auswahlgründen, Risiken und Anbieterlink.
- Nachvollziehbare Ausschlussgründe für alle übrigen Katalogprodukte.
- Löschbare Eingaben und optionaler JSON-Download deiner Auswahl.
- Das bisherige [Rechenlabor](lab.html) als getrennte Seite für eigene Modellannahmen.

Die Liste ist **eine regelbasierte Vorauswahl aus einem kleinen Katalog**.
Sie ist keine Suche über den ganzen Markt, keine Renditeprognose, keine
Kaufzeitpunktanalyse und keine vollständige persönliche Anlageberatung.
Die Auswahlregeln sind in der App sichtbar: [Details und Quellen](docs/ASSET-FINDER.md).

## Datenschutz

Alle Antworten bleiben im Arbeitsspeicher des geöffneten Tabs. Es gibt kein
Tracking, keine Cookies, keine Speicherung im Browser-Speicher und keinen
Profil-Upload. Neuladen oder „Zurücksetzen“ löscht die Antworten aus der App.
Die optional heruntergeladene JSON-Datei enthält deine Antworten: Bewahre sie
privat auf und lade sie nicht in das öffentliche Repository.

Beim Öffnen eines Anbieterlinks verlässt du die App; dabei werden keine
Profilantworten an den Link angehängt. Der App-Start benötigt den lokalen Server.
Es gibt keinen Service Worker oder installierbaren Offline-Cache.

## Grenzen der Auswahl

Die niedrigere von finanzieller Verlusttragfähigkeit und persönlicher
Verlusttoleranz entscheidet. Ohne gesicherte Rücklage oder bei 0 % Verlust
erscheint kein Katalogprodukt als Vorschlag.

**Ein angezeigtes Produkt kann mehr verlieren als dein angegebener Prozentwert.**
Die Regeln sind redaktionelle Filter, keine empirischen Verlustgrenzen und keine
offiziellen Risikoindikatoren. Die Vorschläge ergeben zusammen noch kein
abgestimmtes Portfolio. Einkommen, Schulden, vorhandene Anlagen, Steuern,
Nachhaltigkeitswünsche, Broker-Verfügbarkeit und Kosten werden nicht vollständig
berücksichtigt. Die App handelt nicht und sendet keine Orders.

Produktnamen, Kennungen und Struktur wurden am **04.10.2026** bei den verlinkten
Originalquellen geprüft. Es gibt keine automatische Aktualisierung; nach sechs
Monaten erscheint ein zusätzlicher Hinweis in den Ergebnissen. Aktuelle Kosten
und Produktunterlagen müssen vor einer Entscheidung beim Anbieter geprüft werden.

## Rechenlabor

Das Labor unter /lab.html zeigt, wie frei eingegebene Rendite-, Schwankungs- und
Korrelationsannahmen die mathematische Portfoliomischung verändern. Seine
Startwerte A/B/C sind ein Lernbeispiel aus dem
[Ausgangsvideo](https://vm.tiktok.com/ZGdCREGyc/), keine Kennzahlen der echten
Kataloganlagen. Das Risikoprofil wird nicht in Modellvolatilität umgerechnet.
Es werden keine erfundenen Renditen auf echte Produktnamen übertragen.

Die bisherige Optimierung, JSON-/CSV-Exporte und Beispielrechnung bleiben
verfügbar. Näheres: [Methodik](docs/METHODIK.md),
[Validierung des Rechenkerns](docs/VALIDIERUNG.md) und
[frühere Labor-Vorschau](docs/preview-desktop.png).

## Entwicklung und Tests

```bash
npm test
npm run build
npm run analyse
```

Der Node-Test-Runner prüft Rechenkern und Profilauswahl ohne Zusatzpakete.
Der Build kopiert beide Seiten, Styles und Module nach dist/.

Optionale Browserprüfung:

```bash
npm install --no-save --package-lock=false --ignore-scripts playwright@1.51.1
npx --no-install playwright install chromium
npm run test:browser
```

GitHub Actions prüft Node 22 und 24 sowie beide Seiten in Chromium.
Die Browserprüfung deckt Auswahl, Ausschlüsse, Änderung/Löschen des Profils,
JSON-Download, Navigation, externe Netzwerkanfragen und Bildschirmbreiten bis
320 Pixel ab. Screenshots werden als CI-Artefakt ui-previews gespeichert.

Der unabhängige SciPy-Vergleich des Rechenkerns ist weiterhin optional:

```bash
python -m pip install numpy scipy
python scripts/reference-check.py
```

## Optional als Webseite veröffentlichen

npm run build erzeugt dist/. Für GitHub Pages unter **Settings → Pages → Source**
„GitHub Actions“ wählen und **Actions → Publish Pages (manual) → Run workflow**
starten. Ein Push veröffentlicht nicht automatisch eine Webseite. Alle Pfade
funktionieren auch unter einem GitHub-Pages-Projektpfad.

[Repository](https://github.com/alexwilhelm663-svg/efficient-frontier-lab) ·
[Tests](https://github.com/alexwilhelm663-svg/efficient-frontier-lab/actions) ·
[Weitere Schritte](docs/ROADMAP.md)

Eigenständige Implementierung. Video, Ton und fremder Quellcode sind nicht
enthalten. Eine Open-Source-Lizenz hat der Repository-Inhaber noch nicht festgelegt.
