import * as C from "./cycles.js";

const $ = (id) => document.getElementById(id);
const DAY = 86400000, HOUR = 3600000, YEAR = 365.25 * DAY;
const now = new Date();
const iso = (d) => d.toISOString().slice(0, 10);
const f = (v, d = 0) => v.toLocaleString("en", { minimumFractionDigits: d, maximumFractionDigits: d });
const km = (v) => `${f(v)}\u00a0km`;
const arc = (km) => `${f(C.moonDiameter(km), 1)}′`;
const short = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const when = (d) => `${short(d)}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
const hours = (ms) => {
  const h = Math.round(Math.abs(ms) / HOUR);
  return h === 0 ? "under an hour" : h < 48 ? `${h}\u00a0h ${ms < 0 ? "before" : "after"}` : `${f(h / 24, 1)}\u00a0d ${ms < 0 ? "before" : "after"}`;
};

// ---------- now ----------
const aps = C.moonApsides(new Date(now.getTime() - 40 * DAY), new Date(now.getTime() + 470 * DAY));
{
  const r = C.moonDistance(now);
  const nextP = aps.find((a) => a.perigee && a.date > now), nextA = aps.find((a) => !a.perigee && a.date > now);
  const last = [...aps].reverse().find((a) => a.date <= now);
  const trend = last && last.perigee ? "moving out, towards apogee" : "coming in, towards perigee";
  const rows = [
    ["The Moon now", km(r)],
    ["Its width, from the Earth’s centre", arc(r)],
    ["Which way", trend],
    [`Next perigee, ${when(nextP.date)}`, km(nextP.km)],
    [`Next apogee, ${when(nextA.date)}`, km(nextA.km)],
    ["Phase at the next perigee", C.phaseName(C.moonPhase(nextP.date)).toLowerCase()],
  ];
  $("now").innerHTML = rows.map(([a, b], i) => `<tr${i === 0 ? ' class="hit"' : ""}><td>${a}</td><td class="r num">${b}</td></tr>`).join("");
  $("aps").textContent = f(C.APSIDES_PERIOD, 1);
  $("aps-y").textContent = f(C.APSIDES_PERIOD / 365.25, 2);
  $("aps2").textContent = f(C.APSIDES_PERIOD, 1);
  $("aps3").textContent = f(C.APSIDES_PERIOD, 1);
  $("fmc").textContent = f(C.FULL_MOON_CYCLE, 2);
  $("fmc2").textContent = f(1 / (1 / 365.256363 - 1 / C.APSIDES_PERIOD), 2);
}

// ---------- fifteen months of distance ----------
{
  const a = now.getTime() - 15 * DAY, b = a + 15 * 30.44 * DAY;
  const W = 720, H = 300, L = 62, R = 12, T = 14, B = 30, lo = 351000, hi = 408000;
  const X = (t) => L + (t - a) / (b - a) * (W - L - R);
  const Y = (k) => T + (hi - k) / (hi - lo) * (H - T - B);
  let s = "";
  for (let k = 360000; k <= 405000; k += 15000) {
    s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${Y(k).toFixed(1)}" y2="${Y(k).toFixed(1)}"/><text x="${L - 6}" y="${(Y(k) + 4).toFixed(1)}" text-anchor="end">${f(k / 1000)},000</text>`;
  }
  for (let d = new Date(Date.UTC(new Date(a).getUTCFullYear(), new Date(a).getUTCMonth() + 1, 1)); d.getTime() < b; d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))) {
    const x = X(d.getTime()), m = d.getUTCMonth();
    s += `<line class="grid" x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${T}" y2="${H - B}"/>`;
    if (m % 2 === 0) s += `<text x="${x.toFixed(1)}" y="${H - 10}" text-anchor="middle">${m === 0 ? d.getUTCFullYear() : d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}</text>`;
  }
  const pts = [];
  for (let t = a; t <= b; t += 6 * HOUR) pts.push(`${X(t).toFixed(1)},${Y(C.moonDistance(new Date(t))).toFixed(1)}`);
  s += `<polyline class="line thin" points="${pts.join(" ")}"/>`;
  const fulls = C.phasesWithDistance(new Date(a), new Date(b));
  const nearest = fulls.reduce((p, q) => (q.km < p.km ? q : p));
  for (const m of fulls) {
    s += `<circle class="dot open${m === nearest ? " hit" : ""}" cx="${X(m.date.getTime()).toFixed(1)}" cy="${Y(m.km).toFixed(1)}" r="4.5"><title>Full moon, ${short(m.date)}: ${km(m.km)}</title></circle>`;
  }
  const nx = X(nearest.date.getTime());
  s += `<text class="tag" x="${nx.toFixed(1)}" y="${(Y(nearest.km) + 18).toFixed(1)}" text-anchor="${nx > 660 ? "end" : nx < 100 ? "start" : "middle"}">nearest full</text>`;
  const tx = X(now.getTime());
  s += `<line class="today" x1="${tx.toFixed(1)}" x2="${tx.toFixed(1)}" y1="${T}" y2="${H - B}"/>`;
  $("swing").innerHTML = s;
  $("swing-cap").textContent = `The distance from the Earth’s centre to the Moon’s, in kilometres, over fifteen months. The circles are the ${fulls.length} full moons; the red one, on ${short(nearest.date)}, is the nearest of them, at ${km(nearest.km)}. The red line is now.`;
}

// ---------- the full moon cycle over thirty years ----------
const y0 = 2010, y1 = 2040;
const fullsLong = C.phasesWithDistance(new Date(Date.UTC(y0, 0, 1)), new Date(Date.UTC(y1, 0, 1)));
// The nearest full moon of each cycle: a local minimum of the sequence.
const minima = (arr) => arr.filter((m, i) => i > 0 && i < arr.length - 1 && m.km < arr[i - 1].km && m.km <= arr[i + 1].km);
{
  const W = 720, H = 300, L = 62, R = 12, T = 14, B = 30, lo = 355000, hi = 408000;
  const a = Date.UTC(y0, 0, 1), b = Date.UTC(y1, 0, 1);
  const X = (t) => L + (t - a) / (b - a) * (W - L - R);
  const Y = (k) => T + (hi - k) / (hi - lo) * (H - T - B);
  let s = "";
  for (let k = 360000; k <= 405000; k += 15000) {
    s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${Y(k).toFixed(1)}" y2="${Y(k).toFixed(1)}"/><text x="${L - 6}" y="${(Y(k) + 4).toFixed(1)}" text-anchor="end">${f(k / 1000)},000</text>`;
  }
  for (let y = y0; y <= y1; y += 5) {
    const x = X(Date.UTC(y, 0, 1));
    s += `<line class="grid" x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${T}" y2="${H - B}"/><text x="${x.toFixed(1)}" y="${H - 10}" text-anchor="middle">${y}</text>`;
  }
  s += `<polyline class="line thin" points="${fullsLong.map((m) => `${X(m.date.getTime()).toFixed(1)},${Y(m.km).toFixed(1)}`).join(" ")}"/>`;
  const mins = minima(fullsLong);
  const best = mins.reduce((p, q) => (q.km < p.km ? q : p));
  for (const m of fullsLong) s += `<circle class="dot ink" cx="${X(m.date.getTime()).toFixed(1)}" cy="${Y(m.km).toFixed(1)}" r="1.6"/>`;
  for (const m of mins) s += `<circle class="dot" cx="${X(m.date.getTime()).toFixed(1)}" cy="${Y(m.km).toFixed(1)}" r="3"><title>${short(m.date)}: ${km(m.km)}</title></circle>`;
  for (const m of fullsLong.filter((m) => m.date.getUTCFullYear() === 2016 && m.date.getUTCMonth() === 10).concat(best === fullsLong.at(-1) ? [] : [best])) {
    s += `<text class="tag" x="${X(m.date.getTime()).toFixed(1)}" y="${(Y(m.km) + 16).toFixed(1)}" text-anchor="middle">${m.date.getUTCFullYear()}</text>`;
  }
  const tx = X(now.getTime());
  s += `<line class="today" x1="${tx.toFixed(1)}" x2="${tx.toFixed(1)}" y1="${T}" y2="${H - B}"/>`;
  $("wave").innerHTML = s;
  const gaps = mins.slice(1).map((m, i) => (m.date - mins[i].date) / DAY);
  const mean = gaps.reduce((p, q) => p + q, 0) / gaps.length;
  $("wave-cap").textContent = `The distance at each of the ${fullsLong.length} full moons from ${y0} to ${y1 - 1}. The red dots are the nearest full moon of each cycle, ${mins.length} of them, on average ${f(mean, 1)} days apart (from ${f(Math.min(...gaps))} to ${f(Math.max(...gaps))}: thirteen or fourteen full moons, since each must be a full moon).`;
}

// ---------- the next nearest full moons ----------
{
  const span = C.phasesWithDistance(new Date(now.getTime() - 500 * DAY), new Date(now.getTime() + 12 * YEAR));
  const ap = C.moonApsides(new Date(now.getTime() - 500 * DAY), new Date(now.getTime() + 12 * YEAR + 30 * DAY)).filter((a) => a.perigee);
  const next = minima(span).filter((m) => m.date > now).slice(0, 10);
  $("next").innerHTML = next.map((m, i) => {
    const p = ap.reduce((x, y) => (Math.abs(y.date - m.date) < Math.abs(x.date - m.date) ? y : x));
    return `<tr${i === 0 ? ' class="hit"' : ""}><td>${short(m.date)}</td><td class="r num">${km(m.km)}</td><td class="r num">${f(C.moonDiameter(m.km), 2)}′</td><td class="r num">${hours(m.date - p.date)}</td></tr>`;
  }).join("");
}

// ---------- perigees and apogees against the phase ----------
{
  const all = C.moonApsides(new Date(Date.UTC(2000, 0, 1)), new Date(Date.UTC(2050, 0, 1)));
  const W = 720, H = 360, L = 62, R = 12, T = 14, B = 44;
  // Two bands with a break between them, so both ranges can be read.
  const bands = [{ lo: 403500, hi: 407200, top: T, h: 100 }, { lo: 355800, hi: 371000, top: T + 130, h: H - B - T - 130 }];
  const Y = (k) => {
    const band = k > 390000 ? bands[0] : bands[1];
    return band.top + (band.hi - k) / (band.hi - band.lo) * band.h;
  };
  const X = (p) => L + p * (W - L - R);
  let s = "";
  for (const [k, band] of [[404000, 0], [405000, 0], [406000, 0], [407000, 0], [357500, 1], [360000, 1], [362500, 1], [365000, 1], [367500, 1], [370000, 1]]) {
    s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${Y(k).toFixed(1)}" y2="${Y(k).toFixed(1)}"/><text x="${L - 6}" y="${(Y(k) + 4).toFixed(1)}" text-anchor="end">${f(k)}</text>`;
  }
  for (const [p, name] of [[0, "new"], [0.25, "first quarter"], [0.5, "full"], [0.75, "last quarter"], [1, "new"]]) {
    const x = X(p);
    s += `<line class="grid" x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${T}" y2="${H - B}"/><text x="${x.toFixed(1)}" y="${H - 24}" text-anchor="${p === 0 ? "start" : p === 1 ? "end" : "middle"}">${name}</text>`;
  }
  s += `<text x="${(L + W - R) / 2}" y="${H - 6}" text-anchor="middle">the Moon’s phase at the moment</text>`;
  s += `<text class="tag" x="${W - R - 4}" y="${bands[0].top + 12}" text-anchor="end">apogees</text><text class="tag" x="${W - R - 4}" y="${bands[1].top + 12}" text-anchor="end">perigees</text>`;
  const phased = all.map((e) => ({ ...e, phase: C.moonPhase(e.date) }));
  for (const e of phased) s += `<circle class="dot ink" cx="${X(e.phase).toFixed(1)}" cy="${Y(e.km).toFixed(1)}" r="1.4"/>`;
  $("scatter").innerHTML = s;
  const per = phased.filter((e) => e.perigee), apo = phased.filter((e) => !e.perigee);
  const syzygy = (e) => Math.min(Math.abs(e.phase - 0.5), e.phase, 1 - e.phase) < 0.05;
  const quarter = (e) => Math.abs(Math.abs(e.phase - 0.5) - 0.25) < 0.05;
  const avg = (arr) => arr.reduce((p, q) => p + q.km, 0) / arr.length;
  $("scatter-cap").textContent = `Each dot is one of the ${per.length} perigees (lower band) or ${apo.length} apogees (upper band) from 2000 to 2049, placed across by the Moon’s phase at that moment and up by its distance. The bands have different scales. Perigees within a day and a half of new or full moon average ${km(avg(per.filter(syzygy)))}, those near the quarters ${km(avg(per.filter(quarter)))}; for apogees the figures are ${km(avg(apo.filter(syzygy)))} and ${km(avg(apo.filter(quarter)))}.`;

  const centuryFulls = C.phasesWithDistance(new Date(Date.UTC(1900, 0, 1)), new Date(Date.UTC(2101, 0, 1)));
  const top = [...centuryFulls].sort((p, q) => p.km - q.km).slice(0, 10);
  $("closest").innerHTML = top.map((m) => `<tr${m.date.getUTCFullYear() === 2016 ? ' class="hit"' : ""}><td>${short(m.date)}</td><td class="r num">${km(m.km)}</td></tr>`).join("");
  const sorted = [...centuryFulls].sort((p, q) => p.km - q.km);
  const nth = (n) => ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"][n] || `number ${n + 1}`;
  const rank2016 = nth(sorted.findIndex((m) => iso(m.date) === "2016-11-14"));
  const in21 = centuryFulls.filter((m) => m.date.getUTCFullYear() > 2000).reduce((p, q) => (q.km < p.km ? q : p));
  $("closest-text").textContent = `Of all ${f(centuryFulls.length)} full moons from 1900 to 2100, the ten nearest are below. None comes closer than ${km(top[0].km)}. The nearest of the twenty-first century falls on ${short(in21.date)}, at ${km(in21.km)}. The famous one of 14 November 2016, the nearest since January 1948, ranks ${rank2016} of the ${f(centuryFulls.length)}.`;
}

// ---------- the two discs ----------
{
  const span = C.phasesWithDistance(now, new Date(now.getTime() + 15 * YEAR));
  const near = span.reduce((p, q) => (q.km < p.km ? q : p)), far = span.reduce((p, q) => (q.km > p.km ? q : p));
  const dn = C.moonDiameter(near.km), df = C.moonDiameter(far.km);
  const scale = 180 / dn; // pixels per minute of arc
  let s = "";
  const disc = (cx, d, label, sub) => `<circle class="disc" cx="${cx}" cy="110" r="${(d * scale / 2).toFixed(1)}"/>` +
    `<text x="${cx}" y="220" text-anchor="middle">${label}</text><text x="${cx}" y="236" text-anchor="middle">${sub}</text>`;
  s += disc(200, dn, `Nearest, ${short(near.date)}`, `${km(near.km)}, ${f(dn, 1)}′`);
  s += disc(520, df, `Farthest, ${short(far.date)}`, `${km(far.km)}, ${f(df, 1)}′`);
  $("discs").innerHTML = s;
  $("discs-cap").textContent = `The nearest and farthest full moons from now to ${now.getUTCFullYear() + 15}, to one scale. The near one is ${f((dn / df - 1) * 100)}% wider and covers ${f(((dn / df) ** 2 - 1) * 100)}% more sky, so it sends that much more light.`;
}

// ---------- the saros ----------
{
  $("s239").textContent = f(239 * C.ANOMALISTIC_MONTH, 2);
  $("sgap").textContent = f((239 * C.ANOMALISTIC_MONTH - 223 * C.SYNODIC_MONTH) * 24, 1);
  const ecl = C.eclipsesFrom(now, 6);
  $("saros").innerHTML = ecl.map((e) => {
    const before = C.eclipseAt(e.k - 223);
    const kind = e.solar ? "Sun" : "Moon";
    return `<tr><td>${kind}, ${short(e.date)}</td><td class="r num">${km(C.moonDistance(e.date))}</td><td>${before ? short(before.date) : "—"}</td><td class="r num">${before ? km(C.moonDistance(before.date)) : "—"}</td></tr>`;
  }).join("");
}
