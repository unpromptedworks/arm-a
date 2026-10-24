const L = require('../public/lunar.js');
// Reference times (UTC) from public almanac values, tolerance 90 minutes.
const ref = [
  ['2000-01-06T18:14:00Z', 'new'], ['2024-01-11T11:57:00Z', 'new'],
  ['2024-01-25T17:54:00Z', 'full'], ['2024-04-08T18:21:00Z', 'new'],
  ['2024-04-23T23:49:00Z', 'full'],
  ['2024-01-18T03:52:00Z', 'first'], ['2024-01-04T03:30:00Z', 'last'],
  ['2024-04-15T19:13:00Z', 'first'], ['2024-04-02T03:15:00Z', 'last'],
];
let bad = 0;
for (const [t, type] of ref) {
  const d = new Date(t);
  const m = L.phasesBetween(new Date(d - 3 * 864e5), new Date(+d + 3 * 864e5)).find(x => x.type === type);
  const diff = m ? Math.abs(m.date - d) / 6e4 : Infinity;
  console.log(t, type, m && m.date.toISOString(), Math.round(diff) + ' min');
  if (diff > 90) bad++;
}
const s = L.state(new Date('2024-01-25T17:54:00Z'));
if (Math.abs(s.lit - 1) > 0.02) { console.log('lit', s.lit); bad++; }
if (bad) { console.error('check failed'); process.exit(1); }
console.log('check ok');
