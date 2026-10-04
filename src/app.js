import { DEFAULT_CONFIG, analyse, bestWithinRisk, portfolioStats, portfoliosToCsv, validateConfig } from './portfolio.js';
import { PortfolioChart } from './chart.js';

const $ = id => document.getElementById(id);
const pct = (value, digits = 2) => `${(value * 100).toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`;
const number = (value, digits = 3) => value.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const colors = ['#c3f071', '#6cb8cd', '#eab487'];
let config = structuredClone(DEFAULT_CONFIG), result = null, dirty = false;
const chart = new PortfolioChart($('chart'), $('chart-tooltip'));

function el(tag, props = {}, children = []) {
  const e = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => { if (k === 'text') e.textContent = v; else if (k === 'class') e.className = v; else e.setAttribute(k, v); });
  children.forEach(child => e.append(child));
  return e;
}
function showError(message) { $('error').textContent = message; $('error').hidden = false; }
function hideError() { $('error').hidden = true; }

function populateForm(value) {
  const cards = value.assets.map((asset, i) => {
    const name = el('input', { id: `name-${i}`, value: asset.name, maxlength: 60, required: '', 'aria-label': `Name Asset ${String.fromCharCode(65 + i)}` });
    const group = el('div', { class: 'asset-card' }, [
      el('label', { class: 'asset-name' }, [el('span', { class: `asset-badge ${['a', 'b', 'c'][i]}`, text: String.fromCharCode(65 + i) }), name]),
      el('div', { class: 'input-grid two' }, [
        el('label', { text: 'Erwartete Rendite, %' }, [el('input', { id: `return-${i}`, type: 'number', min: -100, max: 500, step: 'any', value: +(asset.expectedReturn * 100).toPrecision(12), required: '' })]),
        el('label', { text: 'Risiko (Volatilität), %' }, [el('input', { id: `vol-${i}`, type: 'number', min: 0.1, max: 500, step: 'any', value: +(asset.volatility * 100).toPrecision(12), required: '' })]),
      ]),
    ]);
    return group;
  });
  $('asset-inputs').replaceChildren(...cards);
  for (const [i, j] of [[0, 1], [0, 2], [1, 2]]) $(`corr-${i}-${j}`).value = value.correlation[i][j];
  $('risk-free').value = +(value.riskFreeRate * 100).toPrecision(12);
  if (![...$('sample-count').options].some(option => +option.value === value.count)) $('sample-count').add(new Option(value.count.toLocaleString('de-DE'), value.count));
  $('sample-count').value = value.count;
  $('seed').value = value.seed;
  $('risk-budget-number').value = +(value.riskBudget * 100).toFixed(5);
  syncRiskSlider(value.riskBudget);
}
function syncRiskSlider(budget) {
  const max = Math.max(30, ...config.assets.map(a => a.volatility * 110), budget * 100);
  $('risk-budget').max = Math.ceil(max);
  $('risk-budget').value = budget * 100;
}
function readForm() {
  const assets = [0, 1, 2].map(i => ({ name: $(`name-${i}`).value.trim(), expectedReturn: +$(`return-${i}`).value / 100, volatility: +$(`vol-${i}`).value / 100 }));
  const correlation = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (const [i, j] of [[0, 1], [0, 2], [1, 2]]) correlation[i][j] = correlation[j][i] = +$(`corr-${i}-${j}`).value;
  const riskInput = $('risk-budget-number');
  if (riskInput.value === '' || !riskInput.checkValidity()) throw new Error('Bitte ein gültiges Risikobudget eingeben.');
  return validateConfig({ assets, correlation, riskFreeRate: +$('risk-free').value / 100, count: +$('sample-count').value, seed: +$('seed').value, riskBudget: +riskInput.value / 100 });
}
function markDirty() {
  dirty = true;
  $('input-status').textContent = 'Eingaben geändert · Ergebnisse zeigen den letzten berechneten Stand.';
  $('sample-badge').textContent = 'Änderungen noch nicht berechnet';
}

function renderMetrics() {
  const { minimum, maximumSharpe, selected } = result;
  const cards = [
    ['Rendite im Risikobudget', selected ? pct(selected.expectedReturn) : '—', selected ? `bei ${pct(selected.volatility)} Volatilität` : 'Budget unter dem Minimum'],
    ['Geringstes Risiko', pct(minimum.volatility), `${pct(minimum.expectedReturn)} erwartete Rendite`],
    ['Beste Sharpe-Ratio', number(maximumSharpe.sharpe), `${pct(maximumSharpe.volatility)} Volatilität`],
  ];
  $('metrics').replaceChildren(...cards.map(([label, value, note]) => el('article', { class: 'metric' }, [el('p', { class: 'metric-label', text: label }), el('div', { class: 'metric-value', text: value }), el('p', { class: 'metric-note', text: note })])));
}
function renderBudget() {
  const { selected, minimum, maximumSharpe, model } = result;
  const box = $('budget-result');
  box.replaceChildren();
  if (!selected) {
    box.append(el('p', { class: 'unavailable', text: `Dieses Budget ist nicht erreichbar. Die geringste mögliche Volatilität beträgt ${pct(minimum.volatility)}. Ein Cash-Asset ist in diesem Modell nicht enthalten.` }));
    return;
  }
  const p = el('p', { class: 'budget-copy' });
  p.append('Unter deinen Annahmen sind bis zu ', el('strong', { text: `${pct(selected.expectedReturn)} Rendite p.a.` }), ' bei ', el('strong', { text: `${pct(selected.volatility)} Volatilität` }), ' erreichbar.');
  const bar = el('div', { class: 'allocation-bar', 'aria-hidden': 'true' });
  const allocations = el('div', { class: 'allocations' });
  selected.weights.forEach((w, i) => {
    const segment = el('span'); segment.style.width = `${w * 100}%`; segment.style.background = colors[i]; bar.append(segment);
    const dot = el('i', { class: 'allocation-dot', 'aria-hidden': 'true' }); dot.style.background = colors[i];
    allocations.append(el('span', {}, [dot, el('span', { text: `${String.fromCharCode(65 + i)} ${model.assets[i].name.replace(/^[ABC] · /, '')}` }), el('b', { text: pct(w, 1) })]));
  });
  box.append(p, bar, allocations);
  if (maximumSharpe.sharpe <= 0) box.append(el('p', { class: 'field-hint', text: 'Kein Asset hat eine erwartete Rendite über dem Vergleichszins. Auch die beste Sharpe-Ratio ist deshalb nicht positiv.' }));
  const benchmark = model.assets[1];
  if (Math.abs(config.riskBudget - benchmark.volatility) < 0.0001 && selected.expectedReturn > benchmark.expectedReturn + 1e-8) {
    box.append(el('p', { class: 'field-hint', text: `Gegenüber Asset B allein: +${number((selected.expectedReturn - benchmark.expectedReturn) * 100, 2)} Prozentpunkte erwartete Rendite bei höchstens gleichem Risiko.` }));
  }
}
function renderTable() {
  const headers = ['Portfolio', 'Rendite p.a.', 'Risiko p.a.', 'Sharpe', ...result.model.assets.map((_, i) => `Gewicht ${String.fromCharCode(65 + i)}`)];
  $('comparison-head').replaceChildren(el('tr', {}, headers.map(text => el('th', { scope: 'col', text }))));
  const rows = [
    ['Dein Risikobudget', result.selected, true],
    ['Geringstes Risiko', result.minimum],
    ['Beste Sharpe-Ratio', result.maximumSharpe],
    ...result.model.assets.map((a, i) => [a.name, portfolioStats(result.model, result.model.assets.map((_, j) => +(i === j)))]),
  ];
  $('comparison-body').replaceChildren(...rows.map(([label, p, highlight]) => {
    const values = p ? [pct(p.expectedReturn), pct(p.volatility), number(p.sharpe), ...p.weights.map(w => pct(w, 1))] : ['Nicht erreichbar', '—', '—', ...result.model.assets.map(() => '—')];
    return el('tr', { class: highlight ? 'highlight' : '' }, [el('th', { scope: 'row', text: label }), ...values.map(text => el('td', { text }))]);
  }));
}
function render() {
  renderMetrics(); renderBudget(); renderTable();
  chart.setData(result, $('show-envelope').checked);
  $('envelope-count').textContent = `${result.envelope.length.toLocaleString('de-DE')} Punkte auf der Stichproben-Hülle`;
  if (!dirty) $('sample-badge').textContent = `${config.count.toLocaleString('de-DE')} Portfolios · Seed ${config.seed}`;
}
function calculate(next) {
  const computed = analyse(next);
  config = structuredClone(next); result = computed; dirty = false;
  syncRiskSlider(config.riskBudget); hideError(); render();
  $('input-status').textContent = 'Berechnet · Modellannahmen, keine Marktdaten oder Prognosen.';
}
function download(name, data, type) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = el('a', { href: url, download: name });
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$('config-form').addEventListener('input', event => { if (event.target.id !== 'import-config') markDirty(); });
$('config-form').addEventListener('submit', async event => {
  event.preventDefault();
  const button = $('calculate'); button.disabled = true;
  await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
  try { calculate(readForm()); } catch (error) { showError(error.message); }
  finally { button.disabled = false; }
});
$('reset').addEventListener('click', () => {
  const next = structuredClone(DEFAULT_CONFIG); config = next;
  populateForm(next); calculate(next); $('input-status').textContent = 'Beispiel aus dem Video · angenommene Werte';
});
$('show-envelope').addEventListener('change', () => chart.setData(result, $('show-envelope').checked));
function updateBudget(value) {
  if (!Number.isFinite(value) || value < 0 || value > 5) { showError('Das Risikobudget muss zwischen 0 % und 500 % liegen.'); return; }
  config.riskBudget = value;
  result.selected = bestWithinRisk(result.model, value);
  $('risk-budget-number').value = +(value * 100).toFixed(5); syncRiskSlider(value);
  // Do not dismiss validation errors concerning uncommitted assumptions.
  if (!dirty) hideError();
  render();
}
$('risk-budget').addEventListener('input', event => updateBudget(+event.target.value / 100));
$('risk-budget-number').addEventListener('change', event => {
  if (event.target.value === '' || !event.target.checkValidity()) { showError('Bitte ein Risikobudget zwischen 0 % und 500 % eingeben.'); return; }
  updateBudget(+event.target.value / 100);
});
$('save-config').addEventListener('click', () => {
  try {
    if (!$('config-form').reportValidity()) return;
    const current = readForm();
    download('frontier-annahmen.json', JSON.stringify(current, null, 2) + '\n', 'application/json');
  } catch (error) { showError(error.message); }
});
$('import-config').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > 100000) throw new Error('Die JSON-Datei darf höchstens 100 KB groß sein.');
    const next = JSON.parse(await file.text()); validateConfig(next);
    if (next.assets.length !== 3) throw new Error('Die Oberfläche benötigt genau drei Assets. Der Rechenkern unterstützt bis zu acht.');
    // Apply only after validation and successful calculation.
    calculate(next); populateForm(config);
  } catch (error) { showError(`Import fehlgeschlagen: ${error.message}`); }
  finally { event.target.value = ''; }
});
$('download-csv').addEventListener('click', () => {
  download('frontier-portfolios.csv', portfoliosToCsv(result.model, result.cloud), 'text/csv;charset=utf-8');
});

populateForm(config);
try { calculate(config); $('input-status').textContent = 'Beispiel aus dem Video · angenommene Werte'; }
catch (error) { showError(error.message); }
