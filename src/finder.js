import { CATALOG, CATALOG_DATE, TYPES } from './catalog.js';
import { HORIZONS, LOSSES, screenProfile } from './profile.js';

const $ = id => document.getElementById(id);
const form = $('profile-form');
let currentResult = null;
const dateLabel = iso => iso.split('-').reverse().join('.');
function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}
for (const id of ['capacity', 'tolerance']) {
  for (const loss of LOSSES) {
    const text = loss === 0 ? '0 % – kein Verlust' : loss + ' % – ' + (loss * 100).toLocaleString('de-DE') + ' € bei 10.000 €';
    $(id).append(new Option(text, String(loss)));
  }
}
function syncKnowledge() {
  const selected = new Set([...form.querySelectorAll('[name="types"]:checked')].map(input => input.value));
  let visible = 0;
  for (const label of form.querySelectorAll('.knowledge-item')) {
    label.hidden = !selected.has(label.dataset.for);
    const input = label.querySelector('input');
    input.disabled = label.hidden;
    if (label.hidden) input.checked = false;
    else visible++;
  }
  $('knowledge-section').hidden = visible === 0;
}
function invalidate(message = '') {
  currentResult = null;
  $('result-content').hidden = true;
  $('asset-results').replaceChildren();
  $('excluded-results').replaceChildren();
  $('initial-state').hidden = false;
  $('form-error').hidden = true;
  $('update-status').textContent = message;
}
form.addEventListener('input', () => {
  const hadResult = currentResult !== null || $('update-status').textContent.length > 0;
  syncKnowledge();
  invalidate(hadResult ? 'Antworten geändert. Klicke auf „Meine Anlageideen anzeigen“, um neu auszuwählen.' : '');
});
$('clear-profile').addEventListener('click', () => {
  form.reset();
  syncKnowledge();
  invalidate('Profil gelöscht.');
  $('horizon').focus();
});
function readProfile() {
  const data = new FormData(form);
  const numeric = key => data.get(key) === '' ? NaN : Number(data.get(key));
  return {
    horizon: numeric('horizon'), capacity: numeric('capacity'), tolerance: numeric('tolerance'),
    reserve: data.get('reserve'), types: data.getAll('types'), knowledge: data.getAll('knowledge'),
  };
}
function list(items) {
  const ul = node('ul');
  items.forEach(item => ul.append(node('li', item)));
  return ul;
}
function renderCard({ asset, why }, index) {
  const article = node('article', undefined, 'panel candidate');
  article.dataset.assetId = asset.id;
  const top = node('div', undefined, 'candidate-top');
  top.append(node('span', TYPES[asset.type], 'tag'), node('span', String(index + 1).padStart(2, '0'), 'number'));
  const heading = node('h3', asset.name);
  heading.id = 'asset-' + asset.id;
  article.setAttribute('aria-labelledby', heading.id);
  article.append(top, heading, node('div', asset.identifier, 'identifier'), node('p', asset.role, 'role'), node('p', asset.description));
  const risk = node('p', undefined, 'risk');
  risk.append(node('strong', 'Das Risiko: '), document.createTextNode(asset.risks));
  article.append(risk);
  const details = node('details');
  details.append(node('summary', 'Warum erscheint diese Anlage?'), list(why));
  article.append(details);
  const bottom = node('div', undefined, 'candidate-bottom');
  const link = node('a', asset.sourceLabel + ' ↗', 'source-link');
  link.href = asset.source; link.target = '_blank'; link.rel = 'noopener noreferrer';
  const date = node('time', 'Geprüft: ' + dateLabel(asset.checkedAt)); date.dateTime = asset.checkedAt;
  bottom.append(link, date); article.append(bottom);
  return article;
}
function render(result) {
  $('initial-state').hidden = true;
  $('result-content').hidden = false;
  $('results-title').textContent = result.matches.length
    ? result.matches.length + (result.matches.length === 1 ? ' Anlage zum Prüfen' : ' Anlagen zum Prüfen')
    : 'Kein passender Vorschlag';
  $('profile-summary').textContent = 'Zeitraum: ' + HORIZONS[result.profile.horizon] + ' · Niedrigere Verlustangabe: ' + result.loss + ' % · Ohne Rangfolge';
  const notices = $('notices');
  notices.replaceChildren();
  if (result.blockers.length) {
    const warning = node('div', undefined, 'notice warning');
    result.blockers.forEach(text => warning.append(node('p', text)));
    notices.append(warning);
  } else if (!result.matches.length) {
    notices.append(node('p', 'Keine Anlage aus dem kleinen Katalog erfüllt alle deine Angaben. Unter „Nicht angezeigt“ siehst du die Gründe.', 'notice'));
  }
  const note = node('div', undefined, 'notice');
  result.notices.forEach(text => note.append(node('p', text)));
  if (Date.now() - Date.parse(CATALOG_DATE + 'T00:00:00Z') > 180 * 86400000) {
    note.append(node('p', 'Die Produktprüfung ist älter als sechs Monate. Prüfe die aktuellen Angaben und Dokumente bei den verlinkten Anbietern.'));
  }
  notices.append(note);
  $('asset-results').replaceChildren(...result.matches.map(renderCard));
  $('excluded-title').textContent = 'Nicht angezeigt: ' + result.excluded.length + ' Anlagen · Gründe ansehen';
  $('excluded').hidden = result.excluded.length === 0;
  $('excluded').open = false;
  $('excluded-results').replaceChildren(...result.excluded.map(({ asset, reasons }) => {
    const div = node('div', undefined, 'excluded-item');
    div.dataset.assetId = asset.id;
    div.append(node('h3', asset.name), list(reasons));
    return div;
  }));
  $('update-status').textContent = 'Auswahl aktualisiert.';
  $('results-title').focus({ preventScroll: true });
  if (matchMedia('(max-width: 800px)').matches) $('result-content').scrollIntoView({ block: 'start' });
}
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  try {
    const result = screenProfile(readProfile());
    currentResult = result;
    $('form-error').hidden = true;
    render(result);
  } catch (error) {
    invalidate();
    $('form-error').textContent = error.message;
    $('form-error').hidden = false;
  }
});
$('edit-profile').addEventListener('click', () => {
  $('profile-title').scrollIntoView({ block: 'start' });
  $('horizon').focus({ preventScroll: true });
});
$('export-result').addEventListener('click', () => {
  if (!currentResult) return;
  const data = {
    version: 2, catalogueCheckedAt: CATALOG_DATE,
    note: 'Private Profildaten. Auswahlregeln sind keine Verlustprognose oder vollständige Eignungsprüfung.',
    profile: currentResult.profile, loss: currentResult.loss, notices: currentResult.notices,
    matches: currentResult.matches.map(({ asset, why }) => ({ name: asset.name, identifier: asset.identifier, source: asset.source, risks: asset.risks, why })),
    excluded: currentResult.excluded.map(({ asset, reasons }) => ({ name: asset.name, reasons })),
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = node('a'); link.href = url; link.download = 'meine-anlageideen.json';
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
for (const asset of CATALOG) {
  const tr = node('tr');
  const th = node('th', asset.name); th.scope = 'row';
  tr.append(th, node('td', asset.minYears === 0 ? 'Kein Mindestzeitraum' : asset.minYears + ' Jahre'), node('td', asset.minLoss + ' %'), node('td', asset.knowledge ? TYPES[asset.type] : '–'));
  $('rules-body').append(tr);
}
// Start blank even when a browser tries restoring form controls from session history.
form.reset();
syncKnowledge();
