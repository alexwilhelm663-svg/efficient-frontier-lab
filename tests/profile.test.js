import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG, TYPES, CATALOG_DATE } from '../src/catalog.js';
import { screenProfile, validateProfile, HORIZONS, LOSSES, KNOWLEDGE } from '../src/profile.js';

const base = {
  horizon: 10, capacity: 40, tolerance: 40, reserve: 'yes',
  types: ['money', 'bonds', 'equity'], knowledge: ['money'],
};
const run = overrides => screenProfile({ ...base, ...overrides });
const ids = result => result.matches.map(item => item.asset.id).sort();

test('a long-term profile gets concrete funds with identifiers and personal reasons', () => {
  const result = run();
  assert.deepEqual(ids(result), ['all-world', 'cash-rate', 'euro-short', 'global-bond']);
  for (const match of result.matches) {
    assert.ok(match.asset.identifier);
    assert.ok(match.asset.source.startsWith('https://'));
    assert.equal(match.why.length >= 3, true);
  }
});
test('financial capacity restricts a willing investor', () => {
  const result = run({ capacity: 5, tolerance: 100 });
  assert.equal(result.loss, 5);
  assert.deepEqual(ids(result), ['cash-rate', 'euro-short']);
  assert.match(result.notices[0], /niedrigere Wert: 5 %/);
});
test('emotional tolerance restricts a wealthy investor', () => {
  assert.deepEqual(ids(run({ capacity: 100, tolerance: 5 })), ['cash-rate', 'euro-short']);
});
test('zero loss on either answer excludes every catalogue product', () => {
  for (const key of ['capacity', 'tolerance']) {
    const result = run({ [key]: 0 });
    assert.equal(result.matches.length, 0);
    assert.equal(result.excluded.length, CATALOG.length);
    assert.ok(result.blockers.some(text => text.includes('keinen Verlust')));
  }
});
test('no or uncertain reserve blocks every product even with maximum appetite', () => {
  for (const reserve of ['no', 'unsure']) {
    const result = run({ reserve, capacity: 100, tolerance: 100, types: Object.keys(TYPES), knowledge: [...KNOWLEDGE] });
    assert.equal(result.matches.length, 0);
    assert.ok(result.excluded.every(item => item.reasons.some(reason => reason.includes('Rücklage'))));
  }
});
test('short horizon cannot be overridden by high loss tolerance', () => {
  assert.deepEqual(ids(run({ horizon: 0, capacity: 100, tolerance: 100, types: Object.keys(TYPES), knowledge: [...KNOWLEDGE] })), ['cash-rate']);
});
test('five-year profile excludes long-term equity and includes longer bonds', () => {
  assert.deepEqual(ids(run({ horizon: 5 })), ['cash-rate', 'euro-short', 'global-bond']);
});
test('a product type is never silently opted in', () => {
  assert.deepEqual(ids(run({ types: ['bonds'] })), ['euro-short', 'global-bond']);
});
test('swap ETF requires understanding even at a low screening threshold', () => {
  assert.equal(ids(run({ knowledge: [] })).includes('cash-rate'), false);
});
test('optional assets require explicit type, understanding, time and loss answers', () => {
  for (const id of ['gold', 'microsoft', 'bitcoin']) {
    const asset = CATALOG.find(asset => asset.id === id);
    const full = { horizon: 10, capacity: 100, tolerance: 100, types: [asset.type], knowledge: [asset.knowledge] };
    assert.deepEqual(ids(run(full)), [id]);
    assert.deepEqual(ids(run({ ...full, knowledge: [] })), []);
    assert.deepEqual(ids(run({ ...full, horizon: 1 })), []);
    assert.deepEqual(ids(run({ ...full, capacity: 20 })), []);
    assert.deepEqual(ids(run({ ...full, tolerance: 20 })), []);
    assert.deepEqual(ids(run({ ...full, types: ['equity'] })).filter(value => value === id), []);
  }
});
test('no matching candidates is a valid, explained result', () => {
  const result = run({ horizon: 1, types: ['equity'] });
  assert.equal(result.matches.length, 0);
  assert.ok(result.excluded.find(item => item.asset.id === 'all-world').reasons.some(reason => reason.includes('10 Jahren')));
});
test('missing and malformed profiles cannot silently become safe defaults', () => {
  for (const input of [null, {}, [], { ...base, horizon: '' }, { ...base, horizon: '10' }, { ...base, horizon: NaN }, { ...base, capacity: -1 }, { ...base, tolerance: 101 }, { ...base, tolerance: null }, { ...base, reserve: true }, { ...base, types: [] }, { ...base, types: ['unknown'] }, { ...base, knowledge: ['unknown'] }, { ...base, knowledge: null }]) {
    assert.throws(() => validateProfile(input));
  }
});
test('validated input is copied and cannot mutate caller arrays', () => {
  const input = { ...base, types: ['equity', 'equity'], knowledge: [] };
  const copy = structuredClone(input);
  const result = validateProfile(input);
  assert.deepEqual(result.types, ['equity']);
  result.knowledge.push('stocks');
  assert.deepEqual(input, copy);
});
test('catalogue has unique identities, sources, valid dates, and no invented returns', () => {
  assert.equal(new Set(CATALOG.map(asset => asset.id)).size, CATALOG.length);
  assert.equal(new Set(CATALOG.map(asset => asset.identifier)).size, CATALOG.length);
  for (const asset of CATALOG) {
    assert.equal(asset.checkedAt, CATALOG_DATE);
    assert.ok(Number.isFinite(Date.parse(asset.checkedAt)));
    assert.ok(Object.hasOwn(TYPES, asset.type));
    assert.ok(Object.hasOwn(HORIZONS, asset.minYears));
    assert.ok(LOSSES.includes(asset.minLoss));
    assert.ok(asset.risks.length > 50);
    assert.ok(asset.source.startsWith('https://'));
    for (const key of ['expectedReturn', 'volatility', 'maxLoss', 'weight']) assert.equal(Object.hasOwn(asset, key), false);
  }
});
test('every supported horizon/loss combination is partitioned without duplicates and respects all gates', () => {
  for (const horizon of Object.keys(HORIZONS).map(Number)) {
    for (const capacity of LOSSES) {
      for (const tolerance of LOSSES) {
        for (const reserve of ['yes', 'no', 'unsure']) {
          const result = run({ horizon, capacity, tolerance, reserve, types: Object.keys(TYPES), knowledge: [...KNOWLEDGE] });
          const all = [...result.matches, ...result.excluded].map(item => item.asset.id);
          assert.equal(all.length, CATALOG.length);
          assert.equal(new Set(all).size, CATALOG.length);
          for (const { asset } of result.matches) {
            assert.equal(reserve, 'yes');
            assert.ok(capacity >= asset.minLoss && tolerance >= asset.minLoss);
            assert.ok(horizon >= asset.minYears);
          }
          assert.ok(result.excluded.every(item => item.reasons.length > 0));
        }
      }
    }
  }
});
