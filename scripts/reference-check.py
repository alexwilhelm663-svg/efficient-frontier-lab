"""Optional independent numerical check: python -m pip install numpy scipy."""
import json
from pathlib import Path
import subprocess
import numpy as np
from scipy.optimize import minimize

ROOT = Path(__file__).resolve().parents[1]
rng = np.random.default_rng(20261004)
cases = [json.loads((ROOT / 'examples/video-assumptions.json').read_text())]
for case in range(20):
    n = 2 + case % 5
    x = rng.normal(size=(n, n))
    cov = x @ x.T + np.eye(n) * 0.7
    d = np.sqrt(np.diag(cov))
    corr = cov / np.outer(d, d)
    np.fill_diagonal(corr, 1.0)
    mu = rng.uniform(-0.1, 0.3, n)
    vol = rng.uniform(0.04, 0.6, n)
    cases.append(dict(assets=[dict(name=f'Asset {i}', expectedReturn=float(mu[i]), volatility=float(vol[i])) for i in range(n)], correlation=corr.tolist(), riskFreeRate=0.03, count=100, seed=42, riskBudget=0.18))

code = """
import {readFileSync} from 'node:fs';
import {createModel,minimumVariance,maximumSharpe,efficientFrontier} from './src/portfolio.js';
const cs=JSON.parse(readFileSync(0,'utf8'));
console.log(JSON.stringify(cs.map(c=>{const m=createModel(c);return {min:minimumVariance(m),max:maximumSharpe(m),frontier:efficientFrontier(m,7)};})));
"""
run = subprocess.run(['node', '--input-type=module', '-e', code], input=json.dumps(cases), capture_output=True, text=True, cwd=ROOT, check=True)
results = json.loads(run.stdout)
checked, max_variance_error, max_sharpe_error = 0, 0.0, 0.0
for c, result in zip(cases, results):
    mu = np.array([a['expectedReturn'] for a in c['assets']])
    vol = np.array([a['volatility'] for a in c['assets']])
    cov = np.outer(vol, vol) * np.array(c['correlation'])
    n = len(mu)
    base_constraint = dict(type='eq', fun=lambda w: w.sum() - 1, jac=lambda w: np.ones(n))
    for point in [result['min'], *result['frontier']]:
        constraints = [base_constraint]
        if point is not result['min']:
            target = point['expectedReturn']
            constraints.append(dict(type='eq', fun=lambda w, t=target: w @ mu - t, jac=lambda w: mu))
            lo, hi = np.argmin(mu), np.argmax(mu)
            w0 = np.zeros(n); w0[hi] = (target - mu[lo]) / (mu[hi] - mu[lo]); w0[lo] = 1 - w0[hi]
        else:
            w0 = np.ones(n) / n
        opt = minimize(lambda w: w @ cov @ w, w0, jac=lambda w: 2 * cov @ w, bounds=[(0, 1)] * n, constraints=constraints, method='SLSQP', options=dict(ftol=1e-13, maxiter=1000))
        if not opt.success:
            raise AssertionError(opt.message)
        err = abs(opt.fun - point['variance'])
        max_variance_error = max(max_variance_error, err)
        assert err < 1e-8, (err, c)
        checked += 1
    def negative_sharpe(w):
        return -(w @ mu - c['riskFreeRate']) / np.sqrt(w @ cov @ w)
    opt = minimize(negative_sharpe, np.ones(n) / n, bounds=[(0, 1)] * n, constraints=[base_constraint], method='SLSQP', options=dict(ftol=1e-13, maxiter=1000))
    if not opt.success:
        raise AssertionError(opt.message)
    err = abs(-opt.fun - result['max']['sharpe'])
    max_sharpe_error = max(max_sharpe_error, err)
    assert err < 1e-7, (err, c)
print(json.dumps(dict(cases=len(cases), variance_checks=checked, max_variance_error=max_variance_error, max_sharpe_error=max_sharpe_error), indent=2))
