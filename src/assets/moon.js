import * as C from "./cycles.js";

const $ = (id) => document.getElementById(id);
const now = new Date();
const YEAR = 365.256363; // sidereal year, days
const TROPICAL = 365.24219; // tropical year, days

const row = (sym, how, val) => `<tr><td>${sym}</td><td>${how}</td><td>${val}</td></tr>`;
const synodic = 1 / (1 / C.SIDEREAL_MONTH - 1 / YEAR);
$("derive").innerHTML =
  row("sidereal month", "one orbit against the stars", `${C.SIDEREAL_MONTH} d`) +
  row("year", "one orbit of the Earth (sidereal)", `${YEAR} d`) +
  row("synodic month", "1 / (1/27.321661 − 1/365.256363)", `${synodic.toFixed(5)} d`);

const m235 = 235 * C.SYNODIC_MONTH, y19 = 19 * TROPICAL;
$("metonic").innerHTML =
  row("235 months", "235 × 29.530589", `${m235.toFixed(3)} d`) +
  row("19 years", "19 × 365.24219 (tropical)", `${y19.toFixed(3)} d`) +
  row("difference", "", `${((m235 - y19) * 24).toFixed(2)} h`);
$("golden").textContent = (now.getFullYear() % 19) + 1;

// Month calendar, weeks starting on Monday.
let shown = new Date(now.getFullYear(), now.getMonth(), 1);
function drawMonth() {
  const y = shown.getFullYear(), m = shown.getMonth();
  $("month-name").textContent = shown.toLocaleDateString([], { month: "long", year: "numeric" });
  const days = new Date(y, m + 1, 0).getDate();
  const lead = (new Date(y, m, 1).getDay() + 6) % 7;
  let html = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => `<div class="dow">${d}</div>`).join("");
  html += '<div class="d blank"></div>'.repeat(lead);
  for (let d = 1; d <= days; d++) {
    const noon = new Date(y, m, d, 12);
    const p = C.moonPhase(noon);
    const isToday = noon.toDateString() === now.toDateString();
    html += `<div class="d${isToday ? " today" : ""}">${d}${C.moonSVG(p, 40, `${d}: ${C.phaseName(p)}`)}</div>`;
  }
  $("month").innerHTML = html;
}
$("prev").addEventListener("click", () => { shown = new Date(shown.getFullYear(), shown.getMonth() - 1, 1); drawMonth(); });
$("next").addEventListener("click", () => { shown = new Date(shown.getFullYear(), shown.getMonth() + 1, 1); drawMonth(); });
drawMonth();

// The next thirteen full moons: a little more than a year.
let t = now, rows = "";
for (let i = 0; i < 13; i++) {
  const f = C.nextPhase(t, 0.5);
  rows += `<tr><td>${C.fmtDate(f)}</td><td>${C.fmtTime(f)}</td><td class="r">${((f - now) / 86400000 / C.SYNODIC_MONTH).toFixed(2)}</td></tr>`;
  t = new Date(f.getTime() + 86400000);
}
$("fulls").innerHTML = rows;

// ---------- The true Moon and the mean ----------
const HOUR = 3600000;

// The offset of every true new and full moon from the mean, over three years.
{
  const W = 720, H = 260, L = 44, R = 12, T = 14, B = 34;
  const k0 = C.nextPhaseK(now, 0) - 1, n = 38;
  const pts = [];
  for (let i = 0; i < n; i++) {
    for (const q of [0, 0.5]) {
      const k = k0 + i + q;
      pts.push({ q, t: C.truePhase(k), h: (C.truePhase(k) - C.meanPhase(k)) / HOUR });
    }
  }
  const t0 = pts[0].t.getTime(), t1 = pts[pts.length - 1].t.getTime();
  const x = (t) => L + ((t - t0) / (t1 - t0)) * (W - L - R);
  const y = (h) => T + ((16 - h) / 32) * (H - T - B);
  let s = "";
  for (let h = -16; h <= 16; h += 8) {
    s += `<line class="${h ? "grid" : "axis"}" x1="${L}" x2="${W - R}" y1="${y(h)}" y2="${y(h)}"/>`;
    s += `<text x="${L - 8}" y="${y(h) + 4}" text-anchor="end">${h > 0 ? "+" : h < 0 ? "−" : ""}${Math.abs(h)} h</text>`;
  }
  for (let yr = new Date(t0).getFullYear() + 1; new Date(yr, 0, 1) < t1; yr++) {
    const xx = x(new Date(yr, 0, 1).getTime());
    s += `<line class="grid" x1="${xx}" x2="${xx}" y1="${T}" y2="${H - B}"/>`;
    s += `<text x="${xx}" y="${H - B + 20}" text-anchor="middle">${yr}</text>`;
  }
  s += `<polyline class="line ref" points="${pts.filter((p) => p.q === 0.5).map((p) => `${x(p.t).toFixed(1)},${y(p.h).toFixed(1)}`).join(" ")}"/>`;
  s += `<polyline class="line thin" points="${pts.filter((p) => p.q === 0).map((p) => `${x(p.t).toFixed(1)},${y(p.h).toFixed(1)}`).join(" ")}"/>`;
  for (const p of pts) {
    s += `<circle class="${p.q ? "dot open" : "dot ink"}" cx="${x(p.t).toFixed(1)}" cy="${y(p.h).toFixed(1)}" r="3.5"/>`;
  }
  $("drift").innerHTML = s;
}

// The next full moon's corrections, term by term.
{
  const k = C.nextPhaseK(now, 0.5);
  const mean = C.meanPhase(k), tru = C.truePhase(k);
  const sym = ["M", "M′", "F", "Ω"];
  const argText = (a) => {
    if (a === "planets") return "fourteen planetary terms";
    const parts = a.map((m, i) => (m ? [m < 0 ? "−" : "+", `${Math.abs(m) === 1 ? "" : Math.abs(m)}${sym[i]}`] : null)).filter(Boolean);
    const text = parts.map(([sign, term], i) => (i ? ` ${sign} ${term}` : sign === "−" ? `−${term}` : term)).join("");
    return `sin(${text})`;
  };
  const what = (a) => {
    const key = String(a);
    if (key === "0,1,0,0") return "the Moon’s elliptical orbit";
    if (key === "1,0,0,0") return "the Earth’s elliptical orbit";
    if (key === "0,2,0,0") return "the Moon’s ellipse, second harmonic";
    if (key === "0,0,2,0") return "the tilt of the Moon’s orbit";
    if (key === "planets") return "the pull of the planets";
    return "";
  };
  const hrs = (d) => `${d < 0 ? "−" : "+"}${Math.abs(d * 24).toFixed(2)}`;
  const terms = C.phaseCorrections(k);
  const shown = terms.slice(0, 6), rest = terms.slice(6).reduce((s, t) => s + t.days, 0);
  const total = terms.reduce((s, t) => s + t.days, 0);
  let html = `<tr><td>mean full moon</td><td>${C.fmtDate(mean)}, ${C.fmtTime(mean)}</td><td class="r"></td></tr>`;
  for (const t of shown) html += `<tr><td>${argText(t.args)}</td><td>${what(t.args)}</td><td class="r">${hrs(t.days)}</td></tr>`;
  html += `<tr><td>${terms.length - shown.length} more terms</td><td></td><td class="r">${hrs(rest)}</td></tr>`;
  html += `<tr><td>total correction</td><td></td><td class="r">${hrs(total)}</td></tr>`;
  html += `<tr><td><strong>true full moon</strong></td><td><strong>${C.fmtDate(tru)}, ${C.fmtTime(tru)}</strong></td><td class="r"></td></tr>`;
  $("working").innerHTML = html;
  $("working-title").textContent = `The full moon of ${C.fmtDate(tru)}, worked out`;
}
