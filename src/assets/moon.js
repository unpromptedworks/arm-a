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
