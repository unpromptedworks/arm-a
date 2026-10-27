import * as C from "./cycles.js";

const $ = (id) => document.getElementById(id);
const now = new Date();
const RAD = Math.PI / 180;
const INCLINATION = 5.145; // degrees, the mean tilt of the Moon's orbit

const label = (e) => e.solar
  ? `${e.kind[0].toUpperCase()}${e.kind.slice(1)} eclipse of the Sun`
  : `${e.kind[0].toUpperCase()}${e.kind.slice(1)} eclipse of the Moon`;
const minutes = (m) => `${Math.floor(m / 60)} h ${String(Math.round(m % 60)).padStart(2, "0")} min`;
const sign = (x, d) => `${x < 0 ? "−" : "+"}${Math.abs(x).toFixed(d)}`;

// ---------- The coming eclipses ----------
const coming = C.eclipsesFrom(now, 16);
$("coming").innerHTML = coming.map((e) => {
  let mag = e.magnitude === undefined ? "" : e.magnitude.toFixed(3).replace("-", "−");
  let note = "";
  if (!e.solar && e.kind !== "penumbral") {
    note = e.kind === "total" ? `, totality ${minutes(2 * e.semi.total)}` : `, ${minutes(2 * e.semi.partial)} in the umbra`;
  }
  if (e.solar && e.kind !== "partial" && !e.central) note = ", grazing a polar region";
  return `<tr><td>${C.fmtDate(e.date)}</td><td>${C.fmtTime(e.date)}</td>` +
    `<td>${label(e)}${note}</td><td class="r">${mag}</td><td class="r">${C.sarosNumber(e.k)}</td></tr>`;
}).join("");

// ---------- Eclipse seasons ----------
{
  const W = 720, H = 280, L = 44, R = 12, T = 14, B = 34;
  const k0 = C.nextPhaseK(now, 0) - 1, n = 38;
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const k = k0 + i / 2;
    // The Moon's latitude, from its argument of latitude F: sin β = sin i · sin F.
    const F = ((160.7108 + 390.67050284 * k) % 360) * RAD;
    const lat = Math.asin(Math.sin(INCLINATION * RAD) * Math.sin(F)) / RAD;
    pts.push({ k, solar: i % 2 === 0, t: C.truePhase(k), lat, ecl: C.eclipseAt(k) });
  }
  const t0 = pts[0].t.getTime(), t1 = pts[pts.length - 1].t.getTime();
  const x = (t) => L + ((t - t0) / (t1 - t0)) * (W - L - R);
  const y = (b) => T + ((6 - b) / 12) * (H - T - B);
  let s = "";
  for (let b = -6; b <= 6; b += 3) {
    s += `<line class="${b ? "grid" : "axis"}" x1="${L}" x2="${W - R}" y1="${y(b)}" y2="${y(b)}"/>`;
    s += `<text x="${L - 8}" y="${y(b) + 4}" text-anchor="end">${b > 0 ? "+" : b < 0 ? "−" : ""}${Math.abs(b)}°</text>`;
  }
  for (let yr = new Date(t0).getFullYear() + 1; new Date(yr, 0, 1) < t1; yr++) {
    const xx = x(new Date(yr, 0, 1).getTime());
    s += `<line class="grid" x1="${xx}" x2="${xx}" y1="${T}" y2="${H - B}"/>`;
    s += `<text x="${xx}" y="${H - B + 20}" text-anchor="middle">${yr}</text>`;
  }
  for (const p of pts) {
    const cx = x(p.t).toFixed(1), cy = y(p.lat).toFixed(1);
    const cls = p.ecl ? (p.solar ? "dot" : "dot open hit") : p.solar ? "dot ink" : "dot open";
    s += `<circle class="${cls}" cx="${cx}" cy="${cy}" r="${p.ecl ? 4.5 : 3}"/>`;
    if (p.ecl) s += `<text class="tag" x="${cx}" y="${(+cy - 9).toFixed(1)}" text-anchor="middle">${p.solar ? "S" : "L"}</text>`;
  }
  $("seasons").innerHTML = s;
}

// ---------- The next eclipse, worked out ----------
{
  const e = coming[0];
  const row = (a, b, c) => `<tr><td>${a}</td><td>${b}</td><td>${c}</td></tr>`;
  let html = row("k", e.solar ? "whole k: a new moon" : "k + ½: a full moon", e.k);
  html += row("F", "the Moon’s argument of latitude", `${e.F.toFixed(2)}°`);
  html += row("|sin F|", "more than 0.36 and there is no eclipse", Math.abs(e.sinF).toFixed(4));
  html += row("time", "mean phase + 17 periodic terms, − ΔT", `${C.fmtDate(e.date)}, ${C.fmtTime(e.date)}`);
  html += row("P", "7 terms in sin M, sin M′, sin 2F₁ …", sign(e.P, 4));
  html += row("Q", "5.2207 + 5 terms in cos M, cos M′ …", e.Q.toFixed(4));
  html += row("γ", "(P cos F₁ + Q sin F₁)(1 − 0.0048 |cos F₁|)", sign(e.gamma, 4));
  html += row("u", "0.0059 + 4 terms in cos M, cos M′ …", sign(e.u, 4));
  if (e.solar) {
    if (e.kind === "partial") {
      html += row("test", `|γ| between 0.9972 + |u| and 1.5433 + u`, "partial");
      html += row("magnitude", "(1.5433 + u − |γ|) / (0.5461 + 2u)", e.magnitude.toFixed(3));
    } else {
      html += row("test", e.central ? "|γ| < 0.9972: the axis meets the Earth" : "|γ| just over 0.9972: an edge grazes", e.central ? "central" : "non-central");
      html += row("kind", e.kind === "total" ? "u < 0: the shadow cone reaches the Earth" : e.kind === "hybrid" ? "0 < u < 0.00464 √(1 − γ²)" : "u > 0: the cone ends short of the Earth", e.kind);
    }
  } else {
    html += row("penumbral mag.", "(1.5573 + u − |γ|) / 0.5450", e.penumbral.toFixed(3));
    html += row("umbral mag.", "(1.0128 − u − |γ|) / 0.5450", e.magnitude.toFixed(3));
    html += row("kind", "umbral ≥ 1 total, > 0 partial, else penumbral", e.kind);
    for (const [stage, h] of [["penumbral", `1.5573 + u`], ["partial", `1.0128 − u`], ["total", `0.4678 − u`]]) {
      if (e.semi[stage]) html += row(`${stage} phase`, `2 × (60 / n) √((${h})² − γ²) minutes`, minutes(2 * e.semi[stage]));
    }
  }
  $("working").innerHTML = html;
  $("working-title").textContent = `The ${e.solar ? "eclipse of the Sun" : "eclipse of the Moon"} of ${C.fmtDate(e.date)}, worked out`;
}

// ---------- The saros ----------
{
  const row = (a, b, c) => `<tr><td>${a}</td><td>${b}</td><td>${c}</td></tr>`;
  const syn = 223 * C.SYNODIC_MONTH, dra = 242 * C.DRACONIC_MONTH, ano = 239 * C.ANOMALISTIC_MONTH;
  const ey = 19 * C.ECLIPSE_YEAR;
  const d = (v) => `${v.toFixed(3)} d`;
  const off = (v) => `${sign((v - syn) * 24, 1)} h`;
  $("saros").innerHTML =
    row("223 synodic months", `223 × ${C.SYNODIC_MONTH}`, d(syn)) +
    row("242 draconic months", `242 × ${C.DRACONIC_MONTH} (${off(dra)})`, d(dra)) +
    row("239 anomalistic months", `239 × ${C.ANOMALISTIC_MONTH} (${off(ano)})`, d(ano)) +
    row("19 eclipse years", `19 × ${C.ECLIPSE_YEAR} (${off(ey)})`, d(ey));
}

// ---------- One family ----------
{
  const e = coming[0];
  const rows = [];
  for (let j = -4; j <= 4; j++) {
    const f = C.eclipseAt(e.k + 223 * j);
    if (!f) continue;
    const when = j === 0 ? "the next" : j < 0 ? `${-j} saros back` : `${j} saros on`;
    rows.push(`<tr${j === 0 ? ' class="hit"' : ""}><td>${when}</td><td>${C.fmtDate(f.date, { utc: true })}</td><td>${label(f)}</td><td class="r">${sign(f.gamma, 4)}</td></tr>`);
  }
  $("family").innerHTML = rows.join("");
  $("family-title").textContent = `Saros ${C.sarosNumber(e.k)}: the next eclipse and its family`;
}
