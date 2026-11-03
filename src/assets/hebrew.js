import * as C from "./cycles.js";

const $ = (id) => document.getElementById(id);
const now = new Date();
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Tishri", "Heshvan", "Kislev", "Tevet", "Shevat", "Adar", "Nisan", "Iyar", "Sivan", "Tammuz", "Av", "Elul"];
const LEAP_MONTHS = ["Tishri", "Heshvan", "Kislev", "Tevet", "Shevat", "Adar I", "Adar II", "Nisan", "Iyar", "Sivan", "Tammuz", "Av", "Elul"];
const thisYear = C.hebrewYearOf(now);
const pad = (n) => String(n).padStart(2, "0");
const utcDay = (d) => `${DAYS[d.getUTCDay()]} ${C.fmtDate(d, { utc: true })}`;
const jerusalem = (d) => {
  const j = new Date(d.getTime() + (2 * 60 + 21) * 60000);
  return `${C.fmtDate(j, { utc: true })}, ${pad(j.getUTCHours())}:${pad(j.getUTCMinutes())}`;
};
const hp = (parts) => `${Math.floor(parts / C.PARTS_HOUR)} h ${parts % C.PARTS_HOUR} p`;

// ---------- the molad ----------
const interval = C.MOLAD_INTERVAL / C.PARTS_DAY;
$("interval").textContent = interval.toFixed(7);
$("synodic").textContent = C.SYNODIC_MONTH.toFixed(7);
$("diff").textContent = `${((interval - C.SYNODIC_MONTH) * 86400).toFixed(1)} seconds`;

{
  // From the month now running, the next thirteen molads.
  let n = C.monthsBeforeYear(thisYear);
  while (C.moladDate(n + 1) < now) n++;
  const firstOf = (Y) => C.monthsBeforeYear(Y);
  const rows = [];
  for (let i = 0; i < 13; i++, n++) {
    let Y = thisYear;
    while (firstOf(Y + 1) <= n) Y++;
    const names = C.isLeapHebrew(Y) ? LEAP_MONTHS : MONTHS;
    const md = C.moladDate(n);
    const nm = C.nextPhase(new Date(md - 2 * 86400000), 0);
    const late = (md - nm) / 3600000;
    rows.push(`<tr${i === 0 ? ' class="hit"' : ""}><td>${names[n - firstOf(Y)]} ${Y}</td><td class="num">${jerusalem(md)}</td>` +
      `<td class="num">${jerusalem(nm)}</td><td class="r num">${late >= 0 ? "" : "−"}${Math.abs(late).toFixed(1)} h</td></tr>`);
  }
  $("molads").innerHTML = rows.join("");
}

// ---------- the nineteen years ----------
{
  const c = C.hebrewCycleYear(thisYear), first = thisYear - c + 1;
  let s = "";
  for (let i = 1; i <= 19; i++) {
    const Y = first + i - 1, leap = C.isLeapHebrew(Y);
    s += `<span class="${leap ? "leap" : ""}${Y === thisYear ? " now" : ""}" title="${Y}: ${leap ? "13 months" : "12 months"}">${i}</span>`;
  }
  $("cycle").innerHTML = s;
  const cycleNo = Math.floor((thisYear - 1) / 19) + 1;
  $("cycle-note").textContent =
    `The current cycle, the ${cycleNo.toLocaleString("en")}th since the epoch, runs from ${first} to ${first + 18}; the dark squares are leap years. ` +
    `This year, ${thisYear}, outlined in red, is year ${c} of it and has ${C.isLeapHebrew(thisYear) ? "thirteen months" : "twelve months"}.`;
}

// ---------- setting the new year ----------
const KIND = { 353: "deficient", 354: "regular", 355: "complete", 383: "deficient", 384: "regular", 385: "complete" };
function show(Y) {
  if (!Number.isInteger(Y) || Y < 2 || Y > 9999) {
    $("answer").textContent = "Choose a year from 2 to 9999.";
    $("steps").innerHTML = "";
    $("year-note").textContent = "";
    return;
  }
  const r = C.roshHashanahSteps(Y);
  const n = C.monthsBeforeYear(Y);
  const rows = [
    ["months before", `⌊(235 × ${Y} − 234) ÷ 19⌋ = ${n.toLocaleString("en")} months since the epoch`, ""],
    ["molad Tishri", `day ${DAYS[r.molad.day % 7]}, ${hp(r.molad.parts)} (from 6 pm the evening before)`, ""],
    ...r.steps.map((s) => [s.rule, `${s.test}: ${s.applies ? "yes" : "no"}`, s.add ? `+${s.add}` : "0"]),
  ];
  $("steps").innerHTML = rows.map(([a, b, c]) => `<tr><td>${a}</td><td>${b}</td><td class="num">${c}</td></tr>`).join("");
  const rh = C.roshHashanah(Y), len = C.hebrewYearLength(Y);
  $("answer").textContent = `1 Tishri ${Y}: ${utcDay(rh)}`;
  const g = rh.getUTCFullYear();
  $("year-note").textContent =
    `Year ${Y} is year ${C.hebrewCycleYear(Y)} of its cycle, ${r.leap ? "a leap year of thirteen months" : "a common year of twelve months"}, ` +
    `and ${len} days long (a ${KIND[len]} year). It begins at sunset the evening before. Its Passover, 15 Nisan, is ${utcDay(C.passover(Y))}. ` +
    (g < 1583 ? "Gregorian dates before 1583 are reckoned backwards." : "");
}
$("year").value = thisYear;
$("year").addEventListener("input", (e) => show(Number(e.target.value)));
show(thisYear);

// ---------- the slow drift ----------
{
  const cycleDays = 235 * interval;
  const meanYear = cycleDays / 19;
  $("cycle-days").textContent = cycleDays.toFixed(4);
  $("mean-year").textContent = meanYear.toFixed(4);
  $("excess").textContent = (meanYear - 365.2425).toFixed(4);
  $("per-day").textContent = Math.round(1 / (meanYear - 365.2425));
}
function drawDrift() {
  const W = 720, H = 300, L = 54, R = 22, T = 12, B = 34;
  const G0 = 1900, G1 = 2300;
  const pts = [];
  for (let G = G0; G <= G1; G++) {
    const p = C.passover(G + 3760);
    pts.push([G, (p - Date.UTC(G, 2, 21)) / 86400000, p]);
  }
  const lo = 0, hi = 40;
  const x = (G) => L + ((G - G0) / (G1 - G0)) * (W - L - R);
  const y = (d) => T + ((d - lo) / (hi - lo)) * (H - T - B);
  const label = (d) => { const t = new Date(Date.UTC(2001, 2, 21 + d)); return C.fmtDate(t, { year: false, utc: true }).replace("March", "Mar").replace("April", "Apr"); };
  let s = "";
  for (let d = lo; d <= hi; d += 10) {
    s += `<line class="${d === lo || d === hi ? "axis" : "grid"}" x1="${L}" x2="${W - R}" y1="${y(d)}" y2="${y(d)}"/>`;
    s += `<text x="${L - 8}" y="${y(d) + 4}" text-anchor="end">${label(d)}</text>`;
  }
  for (let G = G0; G <= G1; G += 50) {
    s += `<line class="grid" x1="${x(G)}" x2="${x(G)}" y1="${T}" y2="${H - B}"/>`;
    s += `<text x="${x(G)}" y="${H - B + 20}" text-anchor="middle">${G}</text>`;
  }
  const g = now.getFullYear();
  for (const [G, d] of pts) if (G !== g) s += `<circle class="pt" cx="${x(G).toFixed(1)}" cy="${y(d).toFixed(1)}" r="1.7"/>`;
  // The average over each nineteen-year cycle, centred on its middle year.
  const avgPts = [];
  for (let i = 9; i < pts.length - 9; i++) {
    let t = 0;
    for (let j = i - 9; j <= i + 9; j++) t += pts[j][1];
    avgPts.push(`${x(pts[i][0]).toFixed(1)},${y(t / 19).toFixed(1)}`);
  }
  s += `<polyline class="line" points="${avgPts.join(" ")}"/>`;
  const cur = pts.find(([G]) => G === g);
  if (cur) {
    s += `<line class="today" x1="${x(g)}" x2="${x(g)}" y1="${T}" y2="${H - B}"/>`;
    s += `<circle class="dot" cx="${x(g)}" cy="${y(cur[1])}" r="4"/>`;
  }
  $("drift").innerHTML = s;
  const early = pts.reduce((a, b) => (b[1] < a[1] ? b : a)), late = pts.reduce((a, b) => (b[1] > a[1] ? b : a));
  const firstC = pts.slice(0, 19), lastC = pts.slice(-19);
  const avg = (a) => a.reduce((t, p) => t + p[1], 0) / a.length;
  $("drift-cap").textContent =
    `The Gregorian date of the first day of Passover, 15 Nisan, each year from ${G0} to ${G1}, later in spring further down. ` +
    `Earliest in the span: ${C.fmtDate(early[2], { utc: true })}. Latest: ${C.fmtDate(late[2], { utc: true })}. ` +
    `The line is the average over each nineteen years: it falls ${(avg(lastC) - avg(firstC)).toFixed(1)} days later in ${G1 - 18}–${G1} than in ${G0}–${G0 + 18}.` +
    (cur ? ` This year, marked in red: ${C.fmtDate(cur[2], { utc: true })}.` : "");
}
setTimeout(drawDrift, 30);

// ---------- Passover and Easter ----------
{
  const g0 = now.getFullYear(), rows = [];
  for (let G = g0; G < g0 + 12; G++) {
    const p = C.passover(G + 3760), e = C.easter(G);
    const d = Math.round((e - p) / 86400000);
    rows.push(`<tr${Math.abs(d) > 14 ? ' class="hit"' : ""}><td class="num">${G}</td><td>${utcDay(p)}</td><td>${utcDay(e)}</td>` +
      `<td class="r num">${d < 0 ? "−" : ""}${Math.abs(d)} day${Math.abs(d) === 1 ? "" : "s"}</td></tr>`);
  }
  $("feasts").innerHTML = rows.join("");
}
