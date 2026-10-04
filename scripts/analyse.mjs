import { readFile } from 'node:fs/promises';
import { analyse, DEFAULT_CONFIG } from '../src/portfolio.js';
try {
  const config = process.argv[2] ? JSON.parse(await readFile(process.argv[2], 'utf8')) : DEFAULT_CONFIG;
  const result = analyse(config);
  process.stdout.write(JSON.stringify({ assumptions: config, simulatedPortfolios: result.cloud.length, sampledEnvelopePoints: result.envelope.length, minimumVariance: result.minimum, maximumSharpe: result.maximumSharpe, withinRiskBudget: result.selected, frontier: result.frontier }, null, 2) + '\n');
} catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
