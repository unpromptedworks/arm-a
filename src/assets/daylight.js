import * as C from "./cycles.js";

const $ = (id) => document.getElementById(id);
const now = new Date();
const year = now.getFullYear();
const W = 720, H = 300, L = 44, R = 12, T = 14, B = 34;
const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

const daysInYear = (new Date(year + 1, 0, 1) - new Date(year, 0, 1)) / 86400000;
const dayAt = (i) => new Date(year, 0, 1 + i, 12);
const x = (i) => L + (i / (daysInYear - 1)) * (W - L - R);
const y = (h) => T + (1 - h / 24) * (H - T - B);

function series(lat) {
  const pts = [];
  for (let i = 0; i < daysInYear; i++) pts.push(C.dayLength(dayAt(i), lat));
  return pts;
}
const poly = (pts, cls) =>
  `<polyline class="${cls}" points="${pts.map((h, i) => `${x(i).toFixed(1)},${y(h).toFixed(1)}`).join(" ")}"/>`;

function draw(lat) {
  const pts = series(lat);
  let s = "";
  for (let h = 0; h <= 24; h += 6) {
    s += `<line class="${h % 24 ? "grid" : "axis"}" x1="${L}" x2="${W - R}" y1="${y(h)}" y2="${y(h)}"/>`;
    s += `<text x="${L - 8}" y="${y(h) + 4}" text-anchor="end">${h} h</text>`;
  }
  for (let m = 0; m < 12; m++) {
    const i = (new Date(year, m, 1) - new Date(year, 0, 1)) / 86400000;
    s += `<line class="grid" x1="${x(i)}" x2="${x(i)}" y1="${T}" y2="${H - B}"/>`;
    s += `<text x="${x(i + 15)}" y="${H - B + 20}" text-anchor="middle">${MONTHS[m]}</text>`;
  }
  s += poly(series(0), "line ref") + poly(pts, "line");
  const ti = Math.round((new Date(year, now.getMonth(), now.getDate()) - new Date(year, 0, 1)) / 86400000);
  s += `<line class="today" x1="${x(ti)}" x2="${x(ti)}" y1="${T}" y2="${H - B}"/>`;
  s += `<circle class="dot" cx="${x(ti)}" cy="${y(pts[ti])}" r="4"/>`;
  $("chart").innerHTML = s;

  const fmt = (h) => (h === 0 ? "no sunrise" : h === 24 ? "no sunset" : C.fmtHours(h));
  const max = pts.indexOf(Math.max(...pts)), min = pts.indexOf(Math.min(...pts));
  const rows = [["Today", dayAt(ti), pts[ti], true]];
  for (const mk of C.SEASON_MARKS) {
    const d = C.nextSunLongitude(new Date(year, 0, 1), mk.lon);
    rows.push([mk.name, d, C.dayLength(d, lat), false]);
  }
  rows.push(["Longest day", dayAt(max), pts[max], false], ["Shortest day", dayAt(min), pts[min], false]);
  $("marks").innerHTML = rows.map(([name, d, h, hit]) =>
    `<tr${hit ? ' class="hit"' : ""}><td>${name}</td><td>${C.fmtDate(d)}</td><td class="r">${fmt(h)}</td></tr>`
  ).join("");
  const span = pts.filter((h) => h === 24).length, dark = pts.filter((h) => h === 0).length;
  $("chart-cap").textContent =
    `Hours of daylight through ${year} at ${Math.abs(lat).toFixed(1)}° ${lat >= 0 ? "N" : "S"} (solid), against the equator (dashed). The red line is today.` +
    (span ? ` The Sun does not set on ${span} days.` : "") + (dark ? ` It does not rise on ${dark}.` : "");
}

function set(lat, save = true) {
  lat = Math.max(-89, Math.min(89, Number(lat)));
  if (!Number.isFinite(lat)) return;
  $("lat").value = lat;
  $("lat-range").value = lat;
  if (save) C.saveLatitude(lat);
  draw(lat);
}
$("lat-range").addEventListener("input", (e) => set(e.target.value));
$("lat").addEventListener("change", (e) => set(e.target.value));
$("preset").addEventListener("change", (e) => { if (e.target.value) set(e.target.value); });
set(C.savedLatitude(), false);
