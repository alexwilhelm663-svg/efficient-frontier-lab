/**
 * Small, editorial product catalogue. No live quotes or expected returns.
 * Identity/structure checked against the linked primary sources on checkedAt.
 * Screening thresholds are OUR app rules, not issuer risk forecasts or KID SRI.
 */
export const CATALOG_DATE = '2026-10-04';
export const TYPES = Object.freeze({
  money: 'Geldmarkt-ETFs', bonds: 'Anleihen-ETFs', equity: 'Aktien-ETFs',
  stocks: 'Einzelaktien', gold: 'Gold-ETCs', crypto: 'Krypto',
});
export const CATALOG = [
  {
    id: 'all-world', type: 'equity',
    name: 'Vanguard FTSE All-World UCITS ETF (USD) Accumulating',
    identifier: 'ISIN IE00BK5BQT80', shortName: 'Weltweit in Aktien',
    role: 'Breiter Aktienbaustein für langfristigen Vermögensaufbau.',
    description: 'Bündelt Aktien großer und mittelgroßer Unternehmen aus Industrie- und Schwellenländern. Erträge werden wieder angelegt.',
    risks: 'Aktienkurse können stark und über Jahre fallen. Währungsrisiken bleiben auch beim Kauf in Euro bestehen.',
    minYears: 10, minLoss: 40, knowledge: null,
    sourceLabel: 'Vanguard · Produkt und Dokumente',
    source: 'https://global.vanguard.com/de-de/investment-products/etf/equities/9679/ftse-all-world-ucits-etf-usd-accumulating',
  },
  {
    id: 'euro-short', type: 'bonds',
    name: 'iShares € Govt Bond 0–1yr UCITS ETF EUR (Dist)',
    identifier: 'ISIN IE00B3FH7618', shortName: 'Kurz laufende Euro-Staatsanleihen',
    role: 'Anleihenbaustein mit kurzen Restlaufzeiten.',
    description: 'Investiert in auf Euro lautende Staatsanleihen mit Restlaufzeiten von bis zu einem Jahr. Erträge werden ausgeschüttet.',
    risks: 'Zinsänderungen, Zahlungsausfälle und Handelskosten können Verluste verursachen. Auch dieser ETF hat keine Kapitalgarantie.',
    minYears: 1, minLoss: 5, knowledge: null,
    sourceLabel: 'iShares · Produkt und Dokumente',
    source: 'https://www.ishares.com/uk/individual/en/products/251741/ishares-govt-bond-0-1yr-ucits-etf',
  },
  {
    id: 'global-bond', type: 'bonds',
    name: 'iShares Core Global Aggregate Bond UCITS ETF EUR Hedged (Acc)',
    identifier: 'ISIN IE00BDBRDM35', shortName: 'Weltweit gestreute Anleihen',
    role: 'Breiter Anleihenbaustein für mehrere Jahre.',
    description: 'Enthält globale Anleihen mit Investment-Grade-Rating. Diese Anteilsklasse sichert Währungsrisiken gegenüber dem Euro ab und legt Erträge wieder an.',
    risks: 'Längere Laufzeiten können bei steigenden Zinsen deutliche Kursverluste verursachen. Bonitätsrisiken bleiben; die Währungsabsicherung ist nicht perfekt.',
    minYears: 5, minLoss: 20, knowledge: null,
    sourceLabel: 'iShares · Produkt und Dokumente',
    source: 'https://www.ishares.com/uk/individual/en/products/291770/ishares-core-global-aggregate-bond-ucits-etf',
  },
  {
    id: 'cash-rate', type: 'money',
    name: 'Xtrackers II EUR Overnight Rate Swap UCITS ETF 1C',
    identifier: 'ISIN LU0290358497', shortName: 'Am Euro-Tagesgeldsatz orientiert',
    role: 'Möglicher Baustein zum kurzfristigen Anlegen freier Mittel.',
    description: 'Bildet über Tauschgeschäfte die Entwicklung eines Euro-Übernachtzinssatzes ab. Erträge werden wieder angelegt.',
    risks: 'Kein Bankguthaben und keine Einlagensicherung. Risiken durch Tauschpartner, veränderte Zinsen, Handelsspannen und Gebühren; Verluste sind möglich.',
    minYears: 0, minLoss: 5, knowledge: 'money',
    sourceLabel: 'Xtrackers · Funktionsweise und Produkt',
    source: 'https://etf.dws.com/en-lu/knowledge/focus-topics/overnight-etfs-an-alternative-to-easy-access-savings-accounts/',
  },
  {
    id: 'gold', type: 'gold',
    name: 'iShares Physical Gold ETC',
    identifier: 'ISIN IE00B4ND3602', shortName: 'Physisch besichertes Gold',
    role: 'Zusätzlicher Goldbaustein, kein vollständiges Portfolio.',
    description: 'Bietet Zugang zur Goldpreisentwicklung. Ein ETC ist eine Schuldverschreibung und kein UCITS-Fonds.',
    risks: 'Goldpreis und Wechselkurse können stark schwanken. Es gibt keine laufenden Zinserträge. Auch die rechtliche Struktur und der Emittent bringen Risiken mit.',
    minYears: 5, minLoss: 40, knowledge: 'gold',
    sourceLabel: 'iShares · Produkt und Dokumente',
    source: 'https://www.ishares.com/de/privatanleger/de/produkte/258441/?siteEntryPassthrough=true',
  },
  {
    id: 'microsoft', type: 'stocks',
    name: 'Microsoft Corporation · Stammaktie',
    identifier: 'NASDAQ: MSFT', shortName: 'Einzelnes Unternehmen',
    role: 'Einzelaktien-Beispiel aus dem Katalog, kein breit gestreuter Aktienbaustein.',
    description: 'Direkte Beteiligung an Microsoft. Die App prüft keine Unternehmensbewertung und behauptet keinen günstigen Kaufzeitpunkt.',
    risks: 'Unternehmens-, Branchen- und Währungsrisiko; ein Totalverlust ist möglich. Ein zusätzlicher Kauf erhöht die Microsoft-Konzentration gegenüber einem Welt-ETF.',
    minYears: 10, minLoss: 100, knowledge: 'stocks',
    sourceLabel: 'Microsoft · Anlegerinformationen',
    source: 'https://www.microsoft.com/en-us/investor/faq.aspx',
  },
  {
    id: 'bitcoin', type: 'crypto',
    name: 'Bitcoin · direkter Bestand',
    identifier: 'BTC · Kryptowährung', shortName: 'Spekulative Kryptowährung',
    role: 'Spekulative Ergänzung, kein Ersatz für Rücklagen.',
    description: 'Gemeint ist Bitcoin selbst, kein ETF, Zertifikat oder Hebelprodukt. Handelsplatz und Verwahrung werden hier nicht ausgewählt.',
    risks: 'Extreme Kursschwankungen bis zum Totalverlust. Verlust von Schlüsseln sowie Ausfälle oder Angriffe bei Verwahrern können zum Verlust des Bestands führen.',
    minYears: 10, minLoss: 100, knowledge: 'crypto',
    sourceLabel: 'Bitcoin.org · Funktionsweise und Risiken',
    source: 'https://bitcoin.org/en/faq',
  },
].map(asset => Object.freeze({ ...asset, checkedAt: CATALOG_DATE }));
Object.freeze(CATALOG);
