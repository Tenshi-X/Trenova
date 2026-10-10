import { readFileSync } from 'node:fs';
import { worstCaseCostIdr } from '../src/lib/analysis/core.ts';

const file = process.argv[2];
if (!file) throw new Error('Provide a file containing real, human-reviewed old/new sample pairs.');
const samples = JSON.parse(readFileSync(file, 'utf8')).samples;
if (!Array.isArray(samples) || samples.length < 5) throw new Error('At least five captured sample pairs are required.');
const dimensions = ['dataFaithfulness','reasonClarity','setupUsefulness','waitConditions'];
const failures = [];
for (const sample of samples) {
  const score = (scores) => dimensions.reduce((total, dimension) => {
    const value = scores?.[dimension];
    if (!Number.isFinite(value) || value < 0 || value > 5) throw new Error(`${sample.id}: invalid human score ${dimension}`);
    return total + value;
  }, 0);
  if (typeof sample.reviewer !== 'string' || !sample.reviewer.trim()) failures.push(`${sample.id}: missing reviewer`);
  if (score(sample.newScores) <= score(sample.oldScores) || sample.newScores.dataFaithfulness < 4) failures.push(`${sample.id}: quality did not improve`);
  const usage = sample.newUsage;
  if (![usage?.input,usage?.candidate,usage?.thinking].every((value) => Number.isInteger(value) && value >= 0)) throw new Error(`${sample.id}: invalid actual token metadata`);
  const output = usage.candidate + usage.thinking;
  const cost = worstCaseCostIdr(usage.input,output,20000);
  if (usage.input > 4000 || output > 1900 || cost > 500) failures.push(`${sample.id}: token/cost limit exceeded`);
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`${samples.length} human-reviewed pairs passed quality and cost checks.`);
