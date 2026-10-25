import * as C from "./cycles.js";

const $ = (id) => document.getElementById(id);
const thisYear = new Date().getFullYear();

const RULES = [
  ["a", "Y mod 19", "place in the 19-year lunar cycle"],
  ["b", "Y div 100", "century"],
  ["c", "Y mod 100", "year in the century"],
  ["d", "b div 4", ""],
  ["e", "b mod 4", ""],
  ["f", "(b + 8) div 25", ""],
  ["g", "(b − f + 1) div 3", "the Moon’s century correction"],
  ["h", "(19a + b − d − g + 15) mod 30", "days from 21 March to the full moon, nearly"],
  ["i", "c div 4", ""],
  ["k", "c mod 4", ""],
  ["l", "(32 + 2e + 2i − h − k) mod 7", "days on to the Sunday"],
  ["m", "(a + 11h + 22l) div 451", "a rare correction"],
  ["n", "(h + l − 7m + 114) div 31", "month"],
  ["o", "(h + l − 7m + 114) mod 31", "day, less one"],
];

function show(Y) {
  if (!Number.isInteger(Y) || Y < 1583 || Y > 9999) {
    $("answer").textContent = "Choose a year from 1583 to 9999.";
    return;
  }
  const s = C.easterSteps(Y);
  $("steps").innerHTML = RULES.map(([k, rule, note]) =>
    `<tr><td>${k}</td><td>${rule}${note ? ` <span class="note">· ${note}</span>` : ""}</td><td class="num">${s[k]}</td></tr>`
  ).join("");
  $("answer").textContent = `Easter ${Y}: ${C.fmtDate(C.easter(Y), { utc: true })}`;
}
$("year").value = thisYear;
$("year").addEventListener("input", (e) => show(Number(e.target.value)));
show(thisYear);

// Count the whole cycle in slices so the page stays responsive.
const CYCLE = 5700000, START = 1583, SLICE = 300000;
const counts = new Map();
for (let d = 22; d <= 31; d++) counts.set(300 + d, 0);
for (let d = 1; d <= 25; d++) counts.set(400 + d, 0);
let done = 0;
function slice() {
  const end = Math.min(done + SLICE, CYCLE);
  for (let y = START + done; y < START + end; y++) {
    const s = C.easterSteps(y);
    const key = s.month * 100 + s.day;
    counts.set(key, counts.get(key) + 1);
  }
  done = end;
  $("hist-cap").textContent = `Counting the cycle… ${Math.round((done / CYCLE) * 100)}%`;
  if (done < CYCLE) setTimeout(slice, 0); else drawHist();
}
setTimeout(slice, 50);

function drawHist() {
  const W = 720, H = 280, L = 40, R = 8, T = 12, B = 40;
  const keys = [...counts.keys()];
  const max = Math.max(...counts.values());
  const top = keys.reduce((a, b) => (counts.get(b) > counts.get(a) ? b : a));
  const low = keys.reduce((a, b) => (counts.get(b) < counts.get(a) ? b : a));
  const bw = (W - L - R) / keys.length;
  const pct = (k) => (counts.get(k) / CYCLE) * 100;
  const yMax = Math.ceil((max / CYCLE) * 100);
  const y = (p) => T + (1 - p / yMax) * (H - T - B);
  let s = "";
  for (let p = 0; p <= yMax; p++) {
    s += `<line class="${p ? "grid" : "axis"}" x1="${L}" x2="${W - R}" y1="${y(p)}" y2="${y(p)}"/>`;
    s += `<text x="${L - 6}" y="${y(p) + 4}" text-anchor="end">${p}%</text>`;
  }
  const easterNow = C.easterSteps(thisYear);
  const nowKey = easterNow.month * 100 + easterNow.day;
  keys.forEach((k, i) => {
    const cls = k === nowKey ? "bar hit" : k < 400 ? "bar march" : "bar";
    s += `<rect class="${cls}" x="${(L + i * bw + 1).toFixed(1)}" y="${y(pct(k)).toFixed(1)}" width="${(bw - 2).toFixed(1)}" height="${(y(0) - y(pct(k))).toFixed(1)}"><title>${k % 100} ${k < 400 ? "March" : "April"}: ${pct(k).toFixed(3)}%</title></rect>`;
    const d = k % 100;
    if (d === 22 || d === 1 || d === 25 || d % 5 === 0) {
      s += `<text x="${(L + i * bw + bw / 2).toFixed(1)}" y="${H - B + 16}" text-anchor="middle">${d}</text>`;
    }
  });
  s += `<text x="${L + 5 * bw}" y="${H - 6}" text-anchor="middle">March</text>`;
  s += `<text x="${L + 22.5 * bw}" y="${H - 6}" text-anchor="middle">April</text>`;
  $("hist").innerHTML = s;
  const name = (k) => `${k % 100} ${k < 400 ? "March" : "April"}`;
  $("hist-cap").textContent =
    `How often Easter falls on each date across one full cycle of ${CYCLE.toLocaleString("en")} years, counted just now. ` +
    `March dates are grey; this year’s date is red. The commonest is ${name(top)} (${pct(top).toFixed(2)}%), the rarest ${name(low)} (${pct(low).toFixed(2)}%).`;

  const nextOn = (month, day) => {
    for (let Y = thisYear; Y < thisYear + 20000; Y++) {
      const s = C.easterSteps(Y);
      if (s.month === month && s.day === day) return Y;
    }
    return "—";
  };
  const facts = [
    ["Next Easter on 22 March, the earliest date", nextOn(3, 22)],
    ["Next Easter on 25 April, the latest date", nextOn(4, 25)],
    [`Next Easter on ${name(top)}, the commonest`, nextOn(Math.floor(top / 100), top % 100)],
    [`Years in the cycle on ${name(low)}`, counts.get(low).toLocaleString("en")],
  ];
  $("facts").innerHTML = facts.map(([a, b]) => `<tr><td>${a}</td><td class="r num">${b}</td></tr>`).join("");
}
