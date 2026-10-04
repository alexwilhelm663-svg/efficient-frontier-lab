import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG, createModel, validateConfig, portfolioStats, minimumVariance, maximumSharpe, efficientFrontier, bestWithinRisk, simulate, paretoEnvelope, portfoliosToCsv, analyse } from '../src/portfolio.js';
const copy = () => structuredClone(DEFAULT_CONFIG);
const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, `${a} != ${b}`);
const model = createModel(copy());

test('single-asset metrics preserve the video assumptions', () => {
  const b = portfolioStats(model, [0, 1, 0]);
  close(b.expectedReturn, 0.07); close(b.volatility, 0.18); close(b.sharpe, 2 / 9);
});
test('covariance includes both cross terms', () => {
  const p = portfolioStats(model, [0, 0.5, 0.5]);
  close(p.expectedReturn, 0.09);
  close(p.variance, 0.25 * 0.18 ** 2 + 0.25 * 0.25 ** 2 + 2 * 0.25 * 0.5 * 0.18 * 0.25);
});
test('two independent assets match the analytic minimum-variance solution', () => {
  const c = copy(); c.assets = [{ name: 'X', expectedReturn: 0.04, volatility: 0.1 }, { name: 'Y', expectedReturn: 0.1, volatility: 0.2 }]; c.correlation = [[1, 0], [0, 1]];
  const p = minimumVariance(createModel(c));
  close(p.weights[0], 0.8); close(p.weights[1], 0.2); close(p.variance, 0.008);
});
test('video minimum is about 5.67% risk with about 4.40% return', () => {
  const p = minimumVariance(model);
  assert.ok(p.volatility > 0.056 && p.volatility < 0.057);
  assert.ok(p.expectedReturn > 0.043 && p.expectedReturn < 0.045);
  close(p.weights.reduce((a, b) => a + b, 0), 1);
});
test('risk-constrained optimum at 18% improves over asset B', () => {
  const p = bestWithinRisk(model, 0.18);
  close(p.volatility, 0.18, 1e-8);
  assert.ok(p.expectedReturn > 0.09 && p.expectedReturn < 0.093);
  assert.ok(p.sharpe > 0.33 && p.sharpe < 0.35);
});
test('unattainable risk budget returns null; large budget selects maximum return', () => {
  assert.equal(bestWithinRisk(model, 0.01), null);
  const p = bestWithinRisk(model, 2); close(p.expectedReturn, 0.11); close(p.weights[2], 1);
});
test('frontier has increasing risk and return, is feasible, and begins at GMV', () => {
  const f = efficientFrontier(model);
  close(f[0].volatility, minimumVariance(model).volatility);
  for (let i = 0; i < f.length; i++) {
    assert.ok(f[i].weights.every(w => w >= 0));
    close(f[i].weights.reduce((a, b) => a + b, 0), 1);
    if (i > 0) { assert.ok(f[i].volatility >= f[i - 1].volatility - 1e-10); assert.ok(f[i].expectedReturn >= f[i - 1].expectedReturn); }
  }
});
test('exact solutions dominate 10,000 independently sampled mixtures', () => {
  const cloud = simulate(model, 10000, 9876), gmv = minimumVariance(model), sharpe = maximumSharpe(model);
  for (const p of cloud) { assert.ok(p.volatility >= gmv.volatility - 1e-10); assert.ok(p.sharpe <= sharpe.sharpe + 1e-10); }
  for (const p of cloud.filter((_, i) => i % 100 === 0)) {
    const optimal = minimumVariance(model, p.expectedReturn);
    assert.ok(optimal.variance <= p.variance + 1e-10);
  }
});
test('sampling is seeded and uniform over simplex in expectation', () => {
  assert.deepEqual(simulate(model, 10, 42), simulate(model, 10, 42));
  assert.notDeepEqual(simulate(model, 10, 42), simulate(model, 10, 43));
  const cloud = simulate(model, 10000, 0);
  model.assets.forEach((_, i) => close(cloud.reduce((s, p) => s + p.weights[i], 0) / cloud.length, 1 / 3, 0.02));
});
test('Pareto sample ties retain the higher return and discard dominated points', () => {
  const p = [{ volatility: 0.1, expectedReturn: 0.04 }, { volatility: 0.1, expectedReturn: 0.05 }, { volatility: 0.2, expectedReturn: 0.045 }, { volatility: 0.3, expectedReturn: 0.08 }];
  assert.deepEqual(paretoEnvelope(p), [p[1], p[3]]);
});
test('equal expected returns reduce frontier to a single minimum-risk point', () => {
  const c = copy(); c.assets.forEach(a => { a.expectedReturn = 0.05; }); const m = createModel(c);
  assert.equal(efficientFrontier(m).length, 1);
  close(maximumSharpe(m).volatility, minimumVariance(m).volatility);
  close(bestWithinRisk(m, 0.2).volatility, minimumVariance(m).volatility);
});
test('all nonpositive excess returns select the best vertex for Sharpe', () => {
  const c = copy(); c.riskFreeRate = 0.2; const m = createModel(c), best = maximumSharpe(m);
  assert.ok(best.sharpe < 0); assert.ok(best.weights.includes(1));
  simulate(m, 2000, 7).forEach(p => assert.ok(p.sharpe <= best.sharpe + 1e-10));
});
test('negative asset returns still produce a finite efficient frontier', () => {
  const c = copy(); c.assets.forEach(a => { a.expectedReturn -= 0.2; }); const m = createModel(c);
  efficientFrontier(m).forEach(p => assert.ok(Number.isFinite(p.sharpe) && p.expectedReturn < 0));
});
test('valid negative correlations are supported', () => {
  const c = copy(); c.correlation = [[1, -0.3, 0], [-0.3, 1, 0.2], [0, 0.2, 1]];
  assert.ok(minimumVariance(createModel(c)).volatility < minimumVariance(model).volatility);
});
test('impossible, asymmetric and singular correlation matrices are rejected', () => {
  for (const correlation of [[[1, 0.9, 0.9], [0.9, 1, -0.9], [0.9, -0.9, 1]], [[1, 0.1, 0], [0.2, 1, 0], [0, 0, 1]], [[1, 1, 1], [1, 1, 1], [1, 1, 1]]]) {
    const c = copy(); c.correlation = correlation; assert.throws(() => createModel(c));
  }
});
test('invalid numerical inputs and portfolio weights fail explicitly', () => {
  for (const value of [NaN, Infinity, -1, 0]) { const c = copy(); c.assets[0].volatility = value; assert.throws(() => validateConfig(c)); }
  for (const weights of [[0.5, 0.5], [-0.1, 0.5, 0.6], [0.2, 0.2, 0.2], [NaN, 0, 1]]) assert.throws(() => portfolioStats(model, weights));
  assert.throws(() => minimumVariance(model, 0.2));
  assert.throws(() => bestWithinRisk(model, NaN));
  assert.throws(() => simulate(model, 0, 42));
});
test('the core supports eight assets within its declared limit', () => {
  const c = copy(); c.assets = Array.from({ length: 8 }, (_, i) => ({ name: `Asset ${i}`, expectedReturn: 0.02 + i * 0.01, volatility: 0.08 + i * 0.02 })); c.correlation = c.assets.map((_, i) => c.assets.map((_, j) => i === j ? 1 : 0.2));
  const m = createModel(c), p = minimumVariance(m); assert.equal(p.weights.length, 8); close(p.weights.reduce((a, b) => a + b, 0), 1);
  assert.ok(maximumSharpe(m).sharpe >= portfolioStats(m, Array(8).fill(1 / 8)).sharpe);
});
test('CSV uses explicit decimal units, escaped names, and all portfolio weights', () => {
  const c = copy(); c.assets[0].name = 'A, "Example"'; const m = createModel(c);
  const csv = portfoliosToCsv(m, simulate(m, 2, 42));
  assert.ok(csv.includes('"weight_A, ""Example"""')); assert.ok(csv.startsWith('"expected_return_decimal"'));
  assert.equal(csv.trim().split('\n').length, 3);
});
test('analysis does not mutate user assumptions; optimal results ignore seed', () => {
  const c = copy(), before = copy(), r1 = analyse(c); assert.deepEqual(c, before);
  c.seed = 555; const r2 = analyse(c);
  assert.deepEqual(r1.minimum, r2.minimum); assert.deepEqual(r1.frontier, r2.frontier);
});
