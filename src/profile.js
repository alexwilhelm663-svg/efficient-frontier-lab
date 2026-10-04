import { CATALOG, TYPES } from './catalog.js';

export const HORIZONS = Object.freeze({ 0: 'weniger als 1 Jahr', 1: '1–3 Jahre', 3: '3–5 Jahre', 5: '5–10 Jahre', 10: 'mindestens 10 Jahre' });
export const LOSSES = Object.freeze([0, 5, 10, 20, 40, 60, 100]);
export const KNOWLEDGE = Object.freeze(['money', 'stocks', 'gold', 'crypto']);

export function validateProfile(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Bitte beantworte zuerst die Fragen.');
  if (typeof input.horizon !== 'number' || !Object.hasOwn(HORIZONS, input.horizon)) throw new Error('Bitte wähle deinen Anlagezeitraum.');
  for (const key of ['capacity', 'tolerance']) {
    if (!LOSSES.includes(input[key])) throw new Error('Bitte beantworte beide Fragen zu möglichen Verlusten.');
  }
  if (!['yes', 'no', 'unsure'].includes(input.reserve)) throw new Error('Bitte beantworte die Frage zu deinen Rücklagen.');
  if (!Array.isArray(input.types) || !input.types.length || input.types.some(type => !Object.hasOwn(TYPES, type))) throw new Error('Bitte wähle mindestens eine Anlageart.');
  if (!Array.isArray(input.knowledge) || input.knowledge.some(type => !KNOWLEDGE.includes(type))) throw new Error('Die Angaben zum Produktverständnis sind ungültig.');
  return {
    horizon: input.horizon, capacity: input.capacity, tolerance: input.tolerance,
    reserve: input.reserve, types: [...new Set(input.types)], knowledge: [...new Set(input.knowledge)],
  };
}

export function screenProfile(input) {
  const profile = validateProfile(input);
  const loss = Math.min(profile.capacity, profile.tolerance);
  const blockers = [];
  if (profile.reserve !== 'yes') blockers.push('Deine Rücklage für Notfälle und geplante Ausgaben ist noch nicht sicher abgedeckt. Kläre zuerst, welcher Betrag wirklich frei für Anlagen ist.');
  if (loss === 0) blockers.push('Du kannst oder möchtest keinen Verlust tragen. Keines der Produkte in diesem Katalog garantiert den Erhalt deines Geldes.');
  const notices = [
    'Die Prozentangaben steuern nur die Vorauswahl. Sie sind weder gemessene Produktverluste noch eine Verlustgrenze: Auch ein angezeigtes Produkt kann mehr verlieren.',
    'Die Vorschläge sind einzelne Prüf-Kandidaten. Sie ergeben zusammen noch kein auf dich abgestimmtes Portfolio.',
  ];
  if (profile.capacity !== profile.tolerance) notices.unshift('Bei deinen beiden Verlustangaben zählt der niedrigere Wert: ' + loss + ' %.');
  if (blockers.length) notices.unshift('Für benötigtes Geld kommen zunächst verfügbare Bankguthaben infrage. Prüfe Konditionen und die für dich geltende Einlagensicherung.');
  const matches = [];
  const excluded = [];
  for (const asset of CATALOG) {
    const reasons = [...blockers];
    if (!profile.types.includes(asset.type)) reasons.push('Diese Anlageart hast du nicht ausgewählt.');
    if (profile.horizon < asset.minYears) reasons.push('Die App zeigt dieses Produkt erst ab ' + asset.minYears + ' Jahren Anlagezeitraum. Du hast ' + HORIZONS[profile.horizon] + ' angegeben.');
    if (loss < asset.minLoss) reasons.push('Die App verlangt dafür mindestens ' + asset.minLoss + ' % bei beiden Verlustangaben. Dein niedrigerer Wert liegt bei ' + loss + ' %.');
    if (asset.knowledge && !profile.knowledge.includes(asset.knowledge)) reasons.push('Das Verständnis der besonderen Risiken dieser Anlageart ist noch nicht bestätigt.');
    if (reasons.length) {
      excluded.push({ asset, reasons });
    } else {
      const why = [
        'Du hast ' + TYPES[asset.type] + ' zugelassen.',
        'Dein Zeitraum (' + HORIZONS[profile.horizon] + ') erfüllt die Zeitregel für dieses Produkt.',
        'Deine beiden Verlustangaben erfüllen die Auswahlregel ab ' + asset.minLoss + ' %. Das begrenzt mögliche Verluste nicht.',
      ];
      if (asset.knowledge) why.push('Du hast das Verständnis der besonderen Risiken bestätigt.');
      matches.push({ asset, why });
    }
  }
  return { profile, loss, blockers, notices, matches, excluded };
}
