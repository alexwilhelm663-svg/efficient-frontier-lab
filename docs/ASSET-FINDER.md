# Asset-Finder: Auswahlregeln und Quellen

Version 2 ergänzt das Rechenlabor um eine konkrete Produktvorauswahl.
Produktkennungen und Struktur wurden am 04.10.2026 anhand der verlinkten
Primärquellen geprüft. Finanzprofile und Antworten echter Nutzer werden
weder an GitHub übertragen noch im Katalog gespeichert.

## Ablauf

1. Eingaben auf Vollständigkeit, erlaubte Werte und Typen prüfen.
2. Den kleineren Wert aus finanzieller Verlusttragfähigkeit und persönlicher
   Verlusttoleranz verwenden. Das sind unterschiedliche Fragen.
3. Fehlende oder unsichere Rücklagen sowie ein Verlustwert von 0 schließen alle
   Katalogprodukte aus.
4. Für jedes Produkt Anlageart, Mindestzeitraum und interne Verlustschwelle
   prüfen. Wo vorgesehen, muss das Produktverständnis ausdrücklich bestätigt sein.
5. Erfüllte Regeln und alle Ausschlussgründe anzeigen.

Die Unterscheidung von finanzieller Situation, Verlusttragfähigkeit, Zielen,
Risikotoleranz und Kenntnissen orientiert sich an den in
[MiFID II Artikel 25 beschriebenen Dimensionen](https://www.esma.europa.eu/publications-and-data/interactive-single-rulebook/mifid-ii/article-25-assessment-suitability-and).
Die App implementiert **keine vollständige aufsichtsrechtliche Eignungsprüfung**.

## Regeln dieser App

| Anlage | Zeitraum ab | Beide Verlustangaben ab | Zusätzliches Verständnis |
|---|---:|---:|---|
| Vanguard FTSE All-World | 10 Jahre | 40 % | — |
| iShares Euro-Staatsanleihen 0–1 Jahr | 1 Jahr | 5 % | — |
| iShares Global Aggregate Bond, EUR Hedged | 5 Jahre | 20 % | — |
| Xtrackers EUR Overnight Swap | kein Mindestzeitraum | 5 % | Swap und fehlende Einlagensicherung |
| iShares Physical Gold ETC | 5 Jahre | 40 % | ETC-Struktur und Goldrisiken |
| Microsoft-Stammaktie | 10 Jahre | 100 % | Unternehmens- und Totalverlustrisiko |
| Bitcoin direkt | 10 Jahre | 100 % | Verwahrung und Totalverlustrisiko |

Diese Werte sind **redaktionelle Auswahlregeln**, keine kalibrierten
Verlustprognosen, historischen Drawdowns, Volatilitäten oder SRI-Klassen.
Sie dürfen nicht als Kapitalgarantie verstanden werden. Insbesondere impliziert
die 5-%-Schwelle für einen Fonds nicht, dass sein Verlust auf 5 % begrenzt ist.
Auch ein langer Anlagezeitraum garantiert keine Erholung.

Die Regeln wählen für breite Aktienanlagen einen langen Zeitraum und für
Einzelaktien/Krypto die ausdrückliche Tragfähigkeit eines Totalverlusts. Auch
Fonds und ETCs sind nicht vor einem Totalverlust geschützt. Für sehr kurze
Zeiträume können Handelskosten bei einem Overnight-ETF den Zinsertrag übersteigen;
Kosten und benötigte Verfügbarkeit müssen separat geprüft werden.

Horizon-Bänder werden mit ihrer unteren Grenze bewertet: „5–10 Jahre“ erfüllt
beispielsweise die 10-Jahres-Regel nicht. Eine fehlende Antwort wird niemals als
0, als Zustimmung oder als bereits erstelltes Profil interpretiert.

## Begrenzter Katalog, keine Rangliste

Der Katalog zeigt sieben Beispiele unterschiedlicher Anlagearten. Eine
Aufnahme ist keine Behauptung, dieses Produkt sei der beste oder günstigste
Vertreter seiner Art. Das konkrete Aktienbeispiel Microsoft wurde nicht anhand
einer Bewertung oder Ertragsprognose ausgewählt. Bitcoin steht für direkten
Bestand; ein bestimmter Broker, Verwahrer oder börsengehandeltes Produkt ist
damit nicht gemeint.

Die Vorauswahl liefert keine Allokation. Der Kauf aller angezeigten Anlagen ist
kein daraus abgeleiteter Vorschlag. Insbesondere erhöht eine zusätzliche
Einzelaktie deren Konzentration gegenüber einem bereits breit gestreuten ETF.
Bestehende Positionen, Liquidität, Einkommen und Verbindlichkeiten,
Nachhaltigkeitspräferenzen, Steuern, Kosten sowie Wohnsitz- und Vertriebsregeln
werden nicht vollständig erhoben. Die Vorauswahl allein genügt daher nicht
für eine abschließende Kaufentscheidung.

## Produktquellen

| Produkt / Kennung | Primärquelle |
|---|---|
| Vanguard FTSE All-World UCITS ETF (USD) Accumulating / IE00BK5BQT80 | [Vanguard](https://global.vanguard.com/de-de/investment-products/etf/equities/9679/ftse-all-world-ucits-etf-usd-accumulating) |
| iShares € Govt Bond 0–1yr UCITS ETF EUR (Dist) / IE00B3FH7618 | [iShares](https://www.ishares.com/uk/individual/en/products/251741/ishares-govt-bond-0-1yr-ucits-etf) |
| iShares Core Global Aggregate Bond UCITS ETF EUR Hedged (Acc) / IE00BDBRDM35 | [iShares](https://www.ishares.com/uk/individual/en/products/291770/ishares-core-global-aggregate-bond-ucits-etf) |
| Xtrackers II EUR Overnight Rate Swap UCITS ETF 1C / LU0290358497 | [Xtrackers](https://etf.dws.com/en-lu/knowledge/focus-topics/overnight-etfs-an-alternative-to-easy-access-savings-accounts/) |
| iShares Physical Gold ETC / IE00B4ND3602 | [iShares](https://www.ishares.com/de/privatanleger/de/produkte/258441/?siteEntryPassthrough=true) |
| Microsoft-Stammaktie / NASDAQ: MSFT | [Microsoft Investor Relations](https://www.microsoft.com/en-us/investor/faq.aspx) |
| Bitcoin / BTC, direkter Bestand | [Bitcoin.org FAQ](https://bitcoin.org/en/faq) und [Verwahrung](https://bitcoin.org/en/secure-your-wallet) |

Die Links liefern aktuelle Dokumente; die App liest sie nicht automatisch aus.
Es werden keine Live-Preise, aktuellen laufenden Kosten oder erwarteten
Renditen vorgetäuscht. Geprüfte Produktangaben stehen getrennt von unseren Regeln
in src/catalog.js. Eine Folgeversion sollte die Quellen regelmäßig neu prüfen.

## Datenschutz und Bedienung

Alle Antworten existieren nur im geöffneten Tab. Keine Cookies, kein Analytics,
kein localStorage, kein sessionStorage, kein Profil-Upload. Ein Neuladen setzt
das Formular zurück. „Zurücksetzen“ löscht Antworten und Ergebnis. Bei einer
Änderung verschwinden bisherige Kandidaten bis zur erneuten Berechnung, damit
kein veralteter Vorschlag zu einem neuen Profil angezeigt wird.

Der optionale JSON-Download enthält Profil und Begründungen und bleibt als
Datei beim Nutzer. Anbieterlinks enthalten keine Antworten. Browsertests prüfen,
dass der gesamte Frage-/Ergebnisablauf keine externen Requests erzeugt.

## Abgrenzung zum Rechenlabor

lab.html, src/app.js, src/chart.js und src/portfolio.js bleiben das mathematische
Lernwerkzeug aus V1. Eine Portfolio-Volatilität pro Jahr ist keine Aussage über
einen maximal tragbaren Verlust. Daher gibt es keine Umrechnung der Profilwerte
in den Volatilitätsregler und keine automatische Übernahme der realen Katalognamen
in die hypothetischen Renditeannahmen.
