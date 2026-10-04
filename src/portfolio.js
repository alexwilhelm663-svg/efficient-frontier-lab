/** Markowitz mean/variance calculations. All inputs are annual decimal rates. */
export const DEFAULT_CONFIG = {
  assets: [
    { name: 'A · Anleihen', expectedReturn: 0.04, volatility: 0.06 },
    { name: 'B · Aktien', expectedReturn: 0.07, volatility: 0.18 },
    { name: 'C · Wachstumsaktien', expectedReturn: 0.11, volatility: 0.25 },
  ],
  correlation: [[1, 0, 0], [0, 1, 0.5], [0, 0.5, 1]],
  riskFreeRate: 0.03,
  count: 5000,
  seed: 42,
  riskBudget: 0.18,
};

const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const matvec = (a, x) => a.map(row => dot(row, x));

function positiveDefinite(matrix) {
  const n = matrix.length;
  const l = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let x = matrix[i][j];
      for (let k = 0; k < j; k++) x -= l[i][k] * l[j][k];
      if (i === j) {
        if (x <= 1e-10) return false;
        l[i][j] = Math.sqrt(x);
      } else l[i][j] = x / l[j][j];
    }
  }
  return true;
}

export function validateConfig(config) {
  if (!config || !Array.isArray(config.assets) || config.assets.length < 2 || config.assets.length > 8) {
    throw new Error('Bitte 2 bis 8 Assets angeben. Die Oberfläche zeigt drei Assets.');
  }
  const n = config.assets.length;
  const names = new Set();
  for (const a of config.assets) {
    if (!a || typeof a.name !== 'string' || !a.name.trim() || a.name.length > 60) {
      throw new Error('Jedes Asset benötigt einen Namen mit 1 bis 60 Zeichen.');
    }
    if (names.has(a.name.trim())) throw new Error('Die Asset-Namen müssen eindeutig sein.');
    names.add(a.name.trim());
    if (!Number.isFinite(a.expectedReturn) || a.expectedReturn < -1 || a.expectedReturn > 5) {
      throw new Error('Erwartete Renditen müssen zwischen −100 % und 500 % liegen.');
    }
    if (!Number.isFinite(a.volatility) || a.volatility < 0.001 || a.volatility > 5) {
      throw new Error('Volatilitäten müssen zwischen 0,1 % und 500 % liegen.');
    }
  }
  const c = config.correlation;
  if (!Array.isArray(c) || c.length !== n || c.some(row => !Array.isArray(row) || row.length !== n)) {
    throw new Error('Die Korrelationsmatrix passt nicht zur Asset-Anzahl.');
  }
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (!Number.isFinite(c[i][j]) || Math.abs(c[i][j]) > 1 || Math.abs(c[i][j] - c[j][i]) > 1e-10) {
        throw new Error('Korrelationen müssen symmetrisch sein und zwischen −1 und +1 liegen.');
      }
    }
    if (Math.abs(c[i][i] - 1) > 1e-10) throw new Error('Die Diagonale der Korrelationsmatrix muss 1 sein.');
  }
  if (!positiveDefinite(c)) {
    throw new Error('Diese Korrelationsmatrix ist nicht positiv definit. Bitte die Korrelationen ändern; exakt redundante Assets werden nicht unterstützt.');
  }
  if (!Number.isFinite(config.riskFreeRate) || config.riskFreeRate < -1 || config.riskFreeRate > 5) {
    throw new Error('Der Vergleichszins muss zwischen −100 % und 500 % liegen.');
  }
  if (!Number.isInteger(config.count) || config.count < 100 || config.count > 30000) {
    throw new Error('Bitte 100 bis 30.000 simulierte Portfolios wählen.');
  }
  if (!Number.isInteger(config.seed) || config.seed < 0 || config.seed > 4294967295) {
    throw new Error('Der Seed muss eine ganze Zahl zwischen 0 und 4.294.967.295 sein.');
  }
  if (!Number.isFinite(config.riskBudget) || config.riskBudget < 0 || config.riskBudget > 5) {
    throw new Error('Das Risikobudget muss zwischen 0 % und 500 % liegen.');
  }
  return config;
}

/** Gaussian elimination with partial pivoting; small dense positive-definite systems. */
function solve(matrix, rhs) {
  const n = rhs.length;
  const a = matrix.map((row, i) => [...row, rhs[i]]);
  for (let k = 0; k < n; k++) {
    let pivot = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(a[i][k]) > Math.abs(a[pivot][k])) pivot = i;
    if (Math.abs(a[pivot][k]) < 1e-18) throw new Error('Numerisch singuläre Kovarianzmatrix.');
    [a[k], a[pivot]] = [a[pivot], a[k]];
    const d = a[k][k];
    for (let j = k; j <= n; j++) a[k][j] /= d;
    for (let i = 0; i < n; i++) {
      if (i === k) continue;
      const f = a[i][k];
      for (let j = k; j <= n; j++) a[i][j] -= f * a[k][j];
    }
  }
  return a.map(row => row[n]);
}

export function createModel(config) {
  validateConfig(config);
  const assets = config.assets.map(a => ({ ...a, name: a.name.trim() }));
  const mu = assets.map(a => a.expectedReturn);
  const covariance = config.correlation.map((row, i) => row.map((c, j) => c * assets[i].volatility * assets[j].volatility));
  const faces = [];
  for (let mask = 1; mask < (1 << assets.length); mask++) {
    const indices = assets.map((_, i) => i).filter(i => mask & (1 << i));
    const sub = indices.map(i => indices.map(j => covariance[i][j]));
    const returns = indices.map(i => mu[i]);
    const one = indices.map(() => 1);
    const invOne = solve(sub, one);
    // Center and scale returns: avoids cancellation when asset means nearly coincide.
    const base = Math.min(...returns);
    const scale = Math.max(...returns) - base;
    const z = returns.map(r => scale > 1e-12 ? (r - base) / scale : 0);
    const invZ = solve(sub, z);
    const a = dot(one, invOne), b = dot(one, invZ), c = dot(z, invZ);
    faces.push({ indices, returns, base, scale, invOne, invZ, a, b, c, determinant: a * c - b * b });
  }
  return { assets, mu, covariance, riskFreeRate: config.riskFreeRate, faces };
}

function assess(model, weights) {
  const expectedReturn = dot(weights, model.mu);
  const variance = dot(weights, matvec(model.covariance, weights));
  const volatility = Math.sqrt(Math.max(0, variance));
  return { weights, expectedReturn, volatility, variance, sharpe: (expectedReturn - model.riskFreeRate) / volatility };
}

export function portfolioStats(model, weights) {
  if (!Array.isArray(weights) || weights.length !== model.assets.length || weights.some(w => !Number.isFinite(w) || w < 0) || Math.abs(weights.reduce((a, b) => a + b, 0) - 1) > 1e-8) {
    throw new Error('Gewichte müssen nichtnegativ sein und zusammen 100 % ergeben.');
  }
  return assess(model, [...weights]);
}

function expand(model, face, small) {
  if (small.some(w => !Number.isFinite(w) || w < -1e-9)) return null;
  const positive = small.map(w => Math.max(0, w));
  const total = positive.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;
  const weights = model.assets.map(() => 0);
  face.indices.forEach((index, j) => { weights[index] = positive[j] / total; });
  return assess(model, weights);
}

/** Enumerate every simplex face; select the feasible global quadratic minimum. */
export function minimumVariance(model, targetReturn = null) {
  if (targetReturn !== null && (!Number.isFinite(targetReturn) || targetReturn < Math.min(...model.mu) - 1e-10 || targetReturn > Math.max(...model.mu) + 1e-10)) {
    throw new Error('Die Zielrendite ist mit diesen Assets nicht erreichbar.');
  }
  let best = null;
  for (const face of model.faces) {
    let small;
    if (targetReturn === null) {
      small = face.invOne.map(x => x / face.a);
    } else if (face.scale <= 1e-12) {
      if (Math.abs(face.base - targetReturn) > 1e-10) continue;
      small = face.invOne.map(x => x / face.a);
    } else {
      if (targetReturn < face.base - 1e-10 || targetReturn > face.base + face.scale + 1e-10) continue;
      const z = (targetReturn - face.base) / face.scale;
      if (face.determinant <= 0) continue;
      const l = (face.c - face.b * z) / face.determinant;
      const g = (face.a * z - face.b) / face.determinant;
      small = face.invOne.map((x, i) => l * x + g * face.invZ[i]);
    }
    const candidate = expand(model, face, small);
    if (!candidate || (targetReturn !== null && Math.abs(candidate.expectedReturn - targetReturn) > 1e-8)) continue;
    if (!best || candidate.variance < best.variance) best = candidate;
  }
  if (!best) throw new Error('Für diese Zielrendite wurde kein numerisch stabiles Portfolio gefunden.');
  return best;
}

export function maximumSharpe(model) {
  const vertices = model.assets.map((_, i) => assess(model, model.assets.map((_, j) => +(i === j))));
  let best = vertices.reduce((a, b) => b.sharpe > a.sharpe ? b : a);
  // When every excess return is nonpositive, the best ratio occurs at a vertex
  // (triangle inequality for covariance-induced norm).
  if (Math.max(...model.mu) <= model.riskFreeRate) return best;
  for (const face of model.faces) {
    const invExcess = face.invOne.map((x, i) => (face.base - model.riskFreeRate) * x + face.scale * face.invZ[i]);
    const total = invExcess.reduce((a, b) => a + b, 0);
    if (total <= 0) continue;
    const candidate = expand(model, face, invExcess.map(x => x / total));
    if (candidate && candidate.sharpe > best.sharpe) best = candidate;
  }
  return best;
}

export function efficientFrontier(model, count = 121) {
  if (!Number.isInteger(count) || count < 2 || count > 2000) throw new Error('Die Kurve benötigt 2 bis 2.000 Stützpunkte.');
  const minimum = minimumVariance(model);
  const max = Math.max(...model.mu);
  if (Math.abs(max - minimum.expectedReturn) < 1e-12) return [minimum];
  return Array.from({ length: count }, (_, i) => minimumVariance(model, minimum.expectedReturn + (max - minimum.expectedReturn) * i / (count - 1)));
}

export function bestWithinRisk(model, riskBudget) {
  if (!Number.isFinite(riskBudget) || riskBudget < 0) throw new Error('Das Risikobudget muss nichtnegativ sein.');
  const minimum = minimumVariance(model);
  if (riskBudget < minimum.volatility - 1e-10) return null;
  const max = minimumVariance(model, Math.max(...model.mu));
  if (max.volatility <= riskBudget + 1e-10) return max;
  let low = minimum.expectedReturn, high = max.expectedReturn, best = minimum;
  for (let i = 0; i < 64; i++) {
    const mid = (low + high) / 2;
    const p = minimumVariance(model, mid);
    if (p.volatility <= riskBudget) { low = mid; best = p; } else high = mid;
  }
  return best;
}

function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Dirichlet(1,...,1): uniform over the simplex, rather than normalized uniform draws. */
export function simulate(model, count = 5000, seed = 42) {
  if (!Number.isInteger(count) || count < 1 || count > 30000 || !Number.isInteger(seed) || seed < 0 || seed > 4294967295) throw new Error('Ungültige Simulationsparameter.');
  const random = seededRandom(seed);
  return Array.from({ length: count }, () => {
    const raw = model.assets.map(() => -Math.log(Math.max(Number.MIN_VALUE, 1 - random())));
    const total = raw.reduce((a, b) => a + b, 0);
    const weights = total > 0 ? raw.map(x => x / total) : raw.map(() => 1 / raw.length);
    return assess(model, weights);
  });
}

/** Non-dominated sample points only; not the exact Markowitz frontier. */
export function paretoEnvelope(portfolios) {
  const sorted = [...portfolios].sort((a, b) => a.volatility - b.volatility || b.expectedReturn - a.expectedReturn);
  let bestReturn = -Infinity;
  return sorted.filter(p => {
    if (p.expectedReturn <= bestReturn + 1e-12) return false;
    bestReturn = p.expectedReturn;
    return true;
  });
}

export function analyse(config) {
  const model = createModel(config);
  const cloud = simulate(model, config.count, config.seed);
  return {
    model, cloud, envelope: paretoEnvelope(cloud),
    frontier: efficientFrontier(model), minimum: minimumVariance(model),
    maximumSharpe: maximumSharpe(model), selected: bestWithinRisk(model, config.riskBudget),
  };
}

export function portfoliosToCsv(model, portfolios) {
  const quote = value => {
    let s = String(value);
    if (/^[=+@\-\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replaceAll('"', '""')}"`;
  };
  const headers = ['expected_return_decimal', 'volatility_decimal', 'sharpe', ...model.assets.map(a => `weight_${a.name}`)];
  return [headers.map(quote).join(','), ...portfolios.map(p => [p.expectedReturn, p.volatility, p.sharpe, ...p.weights].map(x => x.toPrecision(12)).join(','))].join('\n') + '\n';
}
