import * as C from "./cycles.js";

const now = new Date();
const $ = (id) => document.getElementById(id);
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

$("today-date").textContent = `${DAYS[now.getDay()]}, ${C.fmtDate(now)}`;

// The Moon
const phase = C.moonPhase(now);
const age = C.moonAge(now);
$("moon-pic").innerHTML = C.moonSVG(phase, 84);
$("moon-name").textContent = C.phaseName(phase);
$("moon-age").textContent = `${age.toFixed(1)} days old, ${Math.round(C.moonIllumination(phase) * 100)}% lit`;
const full = C.nextPhase(now, 0.5), newm = C.nextPhase(now, 0);
const [first, second] = full < newm ? [["Full", full], ["New", newm]] : [["New", newm], ["Full", full]];
$("moon-next").textContent =
  `${first[0]} moon on ${C.fmtDate(first[1], { year: false })}; ${second[0].toLowerCase()} on ${C.fmtDate(second[1], { year: false })}.`;
const ecl = C.eclipsesFrom(now, 1)[0];
$("eclipse-next").innerHTML = `Next eclipse: <a href="eclipses.html">${ecl.kind} eclipse of the ${ecl.solar ? "Sun" : "Moon"}</a>, ${C.fmtDate(ecl.date)}.`;

// Daylight
const lat = C.savedLatitude();
const len = C.dayLength(now, lat);
const yesterday = C.dayLength(new Date(now - 86400000), lat);
$("day-len").textContent = len === 0 ? "No sunrise" : len === 24 ? "No sunset" : C.fmtHours(len);
$("day-where").textContent = `at ${Math.abs(lat).toFixed(1)}° ${lat >= 0 ? "north" : "south"}`;
const diff = Math.round((len - yesterday) * 60 * 10) / 10;
$("day-trend").textContent = Math.abs(diff) < 0.1
  ? "About the same as yesterday."
  : `${Math.abs(diff).toFixed(1)} minutes ${diff > 0 ? "longer" : "shorter"} than yesterday.`;

// The season
const mark = C.nextSeasonMark(now);
const n = C.daysUntil(mark.date, now);
$("season-name").textContent = mark.name;
$("season-when").textContent = `${C.fmtDate(mark.date)} at ${C.fmtTime(mark.date)}, in ${n} day${n === 1 ? "" : "s"}`;
let y = now.getFullYear();
let e = C.easter(y);
if (e < new Date(now.getFullYear(), now.getMonth(), now.getDate())) e = C.easter(++y);
$("easter-next").textContent = `Next Easter (Western): ${C.fmtDate(e, { utc: true })}.`;
