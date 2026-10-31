import * as C from "./cycles.js";

const $ = (id) => document.getElementById(id);
const thisYear = new Date().getFullYear();
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ---------- the leap rule for one year ----------
function show(Y) {
  if (!Number.isInteger(Y) || Y < 1 || Y > 9999) {
    $("answer").textContent = "Choose a year from 1 to 9999.";
    $("steps").innerHTML = "";
    $("year-note").textContent = "";
    return;
  }
  const by4 = Y % 4 === 0, by100 = Y % 100 === 0, by400 = Y % 400 === 0;
  const rows = [
    ["Y mod 4", Y % 4, by4 ? "divisible by 4: leap, unless…" : "not divisible by 4: common"],
  ];
  if (by4) rows.push(["Y mod 100", Y % 100, by100 ? "a century year: common, unless…" : "not a century year: leap"]);
  if (by100) rows.push(["Y mod 400", Y % 400, by400 ? "divisible by 400: leap after all" : "not divisible by 400: common"]);
  $("steps").innerHTML = rows.map(([rule, v, note]) =>
    `<tr><td>${rule}</td><td>${v} <span class="note">· ${note}</span></td><td class="num">${v === 0 ? "yes" : "no"}</td></tr>`
  ).join("");
  const g = C.isLeapGregorian(Y), j = C.isLeapJulian(Y);
  $("answer").textContent = `${Y} is a ${g ? "leap" : "common"} year of ${g ? 366 : 365} days`;
  const days = DAYS[C.weekday(Y, 1, 1)];
  const parts = [`1 January ${Y} is a ${days} in the Gregorian calendar.`];
  if (g !== j) parts.push(`The Julian calendar ${j ? "keeps it as leap" : "makes it common"}: one of the years where the two rules part.`);
  if (Y < 1583) parts.push("The Gregorian calendar began in 1582; for earlier years the rule is run backwards, as historians’ “proleptic” calendar does.");
  else parts.push(`Its calendar comes round again, date for weekday, in ${C.sameCalendarAfter(Y)}.`);
  $("year-note").textContent = parts.join(" ");
}
$("year").value = thisYear;
$("year").addEventListener("input", (e) => show(Number(e.target.value)));
show(thisYear);

// ---------- the equinox through four centuries ----------
// Hours after midnight UT on 19 March at which the equinox arrives.
function drawDrift() {
  const W = 720, H = 300, L = 54, R = 22, T = 12, B = 34;
  const Y0 = 1800, Y1 = 2200;
  const pts = [];
  for (let Y = Y0; Y <= Y1; Y++) {
    const eq = C.nextSunLongitude(new Date(Date.UTC(Y, 2, 10)), 0);
    pts.push([Y, (eq - Date.UTC(Y, 2, 19)) / 3600000, eq]);
  }
  const hMin = 0, hMax = 72;
  const x = (Y) => L + ((Y - Y0) / (Y1 - Y0)) * (W - L - R);
  const y = (h) => T + ((h - hMin) / (hMax - hMin)) * (H - T - B);
  let s = "";
  for (let h = hMin; h <= hMax; h += 24) {
    s += `<line class="${h % 72 ? "grid" : "axis"}" x1="${L}" x2="${W - R}" y1="${y(h)}" y2="${y(h)}"/>`;
    if (h < hMax) s += `<text x="${L - 8}" y="${y(h + 12) + 4}" text-anchor="end">${19 + h / 24} Mar</text>`;
  }
  for (let Y = Y0; Y <= Y1; Y += 50) {
    s += `<line class="grid" x1="${x(Y)}" x2="${x(Y)}" y1="${T}" y2="${H - B}"/>`;
    s += `<text x="${x(Y)}" y="${H - B + 20}" text-anchor="middle">${Y}</text>`;
  }
  s += `<polyline class="line" points="${pts.map(([Y, h]) => `${x(Y).toFixed(1)},${y(h).toFixed(1)}`).join(" ")}"/>`;
  const now = pts.find(([Y]) => Y === thisYear);
  if (now) {
    s += `<line class="today" x1="${x(thisYear)}" x2="${x(thisYear)}" y1="${T}" y2="${H - B}"/>`;
    s += `<circle class="dot" cx="${x(thisYear)}" cy="${y(now[1])}" r="4"/>`;
  }
  $("drift").innerHTML = s;
  const early = pts.reduce((a, b) => (b[1] < a[1] ? b : a)), late = pts.reduce((a, b) => (b[1] > a[1] ? b : a));
  const when = (p) => `${C.fmtDate(p[2], { utc: true })}, ${p[2].toISOString().slice(11, 16)} UT`;
  $("drift-cap").textContent =
    `The moment of the March equinox each year from ${Y0} to ${Y1}, down the page as it falls later in March. ` +
    `Each step of the saw is a leap day; the jumps at 1900 and 2100 are century years with no leap day, and 2000, a leap year, has none. ` +
    `Latest in the span: ${when(late)}. Earliest: ${when(early)}.` +
    (now ? ` This year, marked in red: ${when(now)}.` : "");
}
setTimeout(drawDrift, 30);

// ---------- the 400-year cycle ----------
function drawThirteenths() {
  const n = C.thirteenths();
  const days400 = (Date.UTC(2401, 0, 1) - Date.UTC(2001, 0, 1)) / 86400000;
  $("days400").textContent = days400.toLocaleString("en");
  $("weeks400").textContent = (days400 / 7).toLocaleString("en");
  const W = 720, H = 260, L = 44, R = 8, T = 12, B = 36;
  const lo = 680, hi = 690;
  const bw = (W - L - R) / 7;
  const y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const max = Math.max(...n);
  let s = "";
  for (let v = lo; v <= hi; v += 2) {
    s += `<line class="${v === lo ? "axis" : "grid"}" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/>`;
    s += `<text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  }
  n.forEach((v, i) => {
    const bx = L + i * bw;
    s += `<rect class="bar${v === max ? " hit" : ""}" x="${(bx + 10).toFixed(1)}" y="${y(v).toFixed(1)}" width="${(bw - 20).toFixed(1)}" height="${(y(lo) - y(v)).toFixed(1)}"><title>${DAYS[i]}: ${v}</title></rect>`;
    s += `<text x="${(bx + bw / 2).toFixed(1)}" y="${(y(v) - 6).toFixed(1)}" text-anchor="middle">${v}</text>`;
    s += `<text x="${(bx + bw / 2).toFixed(1)}" y="${H - B + 18}" text-anchor="middle">${DAYS[i]}</text>`;
  });
  $("thirteen").innerHTML = s;
  const best = n.indexOf(max), least = n.indexOf(Math.min(...n));
  $("thirteen-cap").textContent =
    `On which weekday the 13th of the month falls, counted over all 4,800 months of one 400-year cycle just now. ` +
    `The scale starts at 680, not zero: the differences are a few in a thousand. ` +
    `${DAYS[best]} is the commonest (${max} times), ${DAYS[least]} among the rarest (${n[least]}).`;

  let nextFri = null;
  for (let t = new Date(); !nextFri; t = new Date(t.getFullYear(), t.getMonth() + 1, 1)) {
    const c = new Date(t.getFullYear(), t.getMonth(), 13);
    if (c >= new Date(new Date().toDateString()) && c.getDay() === 5) nextFri = c;
  }
  let nextLeapSkip = thisYear + 1;
  while (!(nextLeapSkip % 4 === 0 && !C.isLeapGregorian(nextLeapSkip))) nextLeapSkip++;
  let feb29 = thisYear;
  while (!C.isLeapGregorian(feb29) || (feb29 === thisYear && new Date() > new Date(thisYear, 1, 29))) feb29++;
  const facts = [
    ["Next 29 February", `${DAYS[C.weekday(feb29, 2, 29)]} 29 February ${feb29}`],
    ["Next Friday the 13th", `${C.fmtDate(nextFri)}`],
    [`Next year with the same calendar as ${thisYear}`, C.sameCalendarAfter(thisYear)],
    ["Next fourth year that is not leap", nextLeapSkip],
    ["Leap days in one 400-year cycle", 400 / 4 - 3],
    ["Average Gregorian year", `${(days400 / 400).toFixed(4)} days`],
  ];
  $("facts").innerHTML = facts.map(([a, b]) => `<tr><td>${a}</td><td class="r num">${b}</td></tr>`).join("");
}
drawThirteenths();

// ---------- Old Style and New ----------
const lagRows = [1582, 1700, 1800, 1900, 2100, 2200, 2300, 2500];
const current = Math.max(...lagRows.filter((Y) => Y <= thisYear));
$("lag").innerHTML = lagRows.map((Y) => {
  const label = Y === 1582 ? "15 October 1582" : `${Y}`;
  const hit = Y === current;
  return `<tr${hit ? ' class="hit"' : ""}><td>${label}</td><td class="r num">${C.julianLag(Y)} days</td></tr>`;
}).join("");
