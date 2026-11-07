import * as C from "./cycles.js";

const $ = (id) => document.getElementById(id);
const now = new Date();
const DAY = 86400000;
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const M = C.ISLAMIC_MONTHS;
// The reader's own calendar day, as a UTC midnight.
const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
const utc = (d) => C.fmtDate(d, { utc: true });
const utcDay = (d) => `${DAYS[d.getUTCDay()]} ${utc(d)}`;
const short = (d, dow = true) => `${dow ? DAYS[d.getUTCDay()].slice(0, 3) + " " : ""}${d.getUTCDate()} ${C.fmtDate(d, { utc: true, year: false }).split(" ")[1].slice(0, 3)}`;
const long = (d) => `${short(d)} ${d.getUTCFullYear()}`;
const hijri = (h) => `${h.day} ${M[h.month - 1]} ${h.year} AH`;

// The Umm al-Qura calendar, if this browser carries it.
let uq = null;
try {
  const f = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { timeZone: "UTC", year: "numeric", month: "numeric", day: "numeric" });
  if (f.resolvedOptions().calendar === "islamic-umalqura") {
    uq = (d) => {
      const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
      return { year: parseInt(p.year, 10), month: +p.month, day: +p.day };
    };
  }
} catch (_) { /* not supported */ }
// The first day of month m of year Y by Umm al-Qura, searched near the tabular date.
function uqFirst(Y, m) {
  if (!uq) return null;
  const t = C.islamicToDate(Y, m, 1);
  for (let k = -4; k <= 4; k++) {
    const d = new Date(t.getTime() + k * DAY), h = uq(d);
    if (h.year === Y && h.month === m && h.day === 1) return d;
  }
  return null;
}

// ---------- today ----------
const h = C.islamicFromDate(today);
$("today-hijri").textContent = `Today, by the table: ${hijri(h)}`;
{
  const u = uq && uq(today);
  const left = C.islamicMonthLength(h.year, h.month) - h.day;
  $("today-note").textContent =
    `That is day ${h.day} of ${M[h.month - 1]}, with ${left} day${left === 1 ? "" : "s"} to go in a month of ${C.islamicMonthLength(h.year, h.month)}. ` +
    (u ? (u.year === h.year && u.month === h.month && u.day === h.day
      ? "Your browser’s Umm al-Qura calendar agrees today."
      : `Your browser’s Umm al-Qura calendar makes it ${u.day} ${M[u.month - 1]} ${u.year}.`)
      : "Your browser does not carry the Umm al-Qura calendar, so it cannot be compared here.");
}

// ---------- twelve moons ----------
$("twelve").textContent = `make ${(12 * C.SYNODIC_MONTH).toFixed(2)}`;
{
  const Y = h.year, rows = [];
  const afters = [];
  for (let m = 1; m <= 12; m++) {
    const first = C.islamicToDate(Y, m, 1);
    // The true conjunction before the first day: the next new moon from three days earlier.
    let nm = C.nextPhase(new Date(first.getTime() - 3 * DAY), 0);
    if (nm > first) nm = C.nextPhase(new Date(first.getTime() - 6 * DAY), 0);
    const after = (first - nm) / DAY;
    afters.push(after);
    const cur = m === h.month;
    rows.push(`<tr${cur ? ' class="hit"' : ""}><td>${M[m - 1]}</td><td class="r num">${C.islamicMonthLength(Y, m)}</td>` +
      `<td>${short(first)} ${first.getUTCFullYear()}</td><td class="num">${short(nm, false)} ${String(nm.getUTCHours()).padStart(2, "0")}:${String(nm.getUTCMinutes()).padStart(2, "0")}</td>` +
      `<td class="r num">${after.toFixed(1)}</td></tr>`);
  }
  $("months").innerHTML = rows.join("");
  $("months-note").textContent =
    `The year ${Y} AH is year ${C.islamicCycleYear(Y)} of its thirty, ${C.isLeapIslamic(Y) ? "a leap year of 355 days" : "a common year of 354 days"}. ` +
    `The current month is in red. “Days after” runs from the conjunction to midnight beginning the first day; the month itself begins at sunset the evening before. ` +
    `This year it ranges from ${Math.min(...afters).toFixed(1)} to ${Math.max(...afters).toFixed(1)} days.`;
}

// ---------- thirty years ----------
{
  const tab = C.ISLAMIC_CYCLE_DAYS / 360, diff = C.SYNODIC_MONTH - tab;
  $("tab-month").textContent = tab.toFixed(7);
  $("syn-month").textContent = C.SYNODIC_MONTH.toFixed(7);
  $("short").textContent = `${(diff * 86400).toFixed(1)} seconds`;
  $("per-day").textContent = (Math.round(1 / (diff * 12) / 100) * 100).toLocaleString("en");

  const c = C.islamicCycleYear(h.year), first = h.year - c + 1;
  let s = "";
  for (let i = 1; i <= 30; i++) {
    const Y = first + i - 1, leap = C.isLeapIslamic(Y);
    s += `<span class="${leap ? "leap" : ""}${Y === h.year ? " now" : ""}" title="${Y}: ${leap ? "355 days" : "354 days"}">${i}</span>`;
  }
  $("cycle").innerHTML = s;
  $("cycle-note").textContent =
    `The current cycle runs from ${first} to ${first + 29} AH, that is from ${utc(C.islamicToDate(first, 1, 1))} to ${utc(new Date(C.islamicToDate(first + 30, 1, 1).getTime() - DAY))}; ` +
    `the dark squares are leap years. This year, ${h.year}, outlined in red, is year ${c}.`;
}

// ---------- any date ----------
function show(value) {
  const m = /^(\d{4,})-(\d{2})-(\d{2})$/.exec(value || "");
  const d = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
  if (m) d.setUTCFullYear(+m[1]); // years before 100
  if (!d || isNaN(d) || d < C.islamicToDate(1, 1, 1)) {
    $("answer").textContent = "Choose a date from 19 July 622 onwards.";
    $("steps").innerHTML = "";
    return;
  }
  const r = C.islamicFromDate(d);
  const S = C.islamicRD(r.year, 1, 1) - C.islamicRD(1, 1, 1), into = r.days - S;
  const startM = C.islamicRD(r.year, r.month, 1) - C.islamicRD(r.year, 1, 1);
  const n = (v) => v.toLocaleString("en");
  const rows = [
    ["days since epoch", `from 1 Muharram 1 (16 July 622, Julian) to ${utc(d)}`, n(r.days)],
    ["year", `⌊(30 × ${n(r.days)} + 10,646) ÷ 10,631⌋: thirty years hold 10,631 days`, `${r.year}`],
    ["1 Muharram", `${r.year - 1} × 354 + ⌊(3 + 11 × ${r.year}) ÷ 30⌋ days since epoch`, n(S)],
    ["into the year", `${n(r.days)} − ${n(S)}`, `${into} days`],
    ["month", `${r.month - 1} whole months of 30 and 29 days make ${startM} days`, M[r.month - 1]],
    ["day", `${into} − ${startM} + 1`, `${r.day}`],
  ];
  $("steps").innerHTML = rows.map(([a, b, c]) => `<tr><td>${a}</td><td>${b}</td><td class="num">${c}</td></tr>`).join("");
  $("answer").textContent = hijri(r);
}
const iso = (d) => d.toISOString().slice(0, 10);
$("when").value = iso(today);
$("when").addEventListener("input", (e) => show(e.target.value));
show(iso(today));

// ---------- through the seasons ----------
const meanYear = C.ISLAMIC_CYCLE_DAYS / 30, gap = 365.2425 - meanYear;
$("mean-year").textContent = meanYear.toFixed(4);
$("gap").textContent = gap.toFixed(4);
$("circuit-g").textContent = (meanYear / gap).toFixed(1);
$("circuit-h").textContent = (365.2425 / gap).toFixed(1);
$("gain").textContent = (gap / 365.2425).toFixed(4);

const dayOfYear = (d) => (d - Date.UTC(d.getUTCFullYear(), 0, 1)) / DAY;
const midSolstice = (d) => Math.abs(dayOfYear(d) + 14 - 171) <= 5.5;
const yearFrac = (d) => d.getUTCFullYear() + dayOfYear(d) / 365.25;
function drawDrift() {
  const W = 720, H = 320, L = 54, R = 22, T = 12, B = 34, G0 = 1950, G1 = 2100;
  const x = (t) => L + ((t - G0) / (G1 - G0)) * (W - L - R);
  const y = (doy) => T + (doy / 366) * (H - T - B);
  let s = "";
  const marks = [["Jan", 0], ["Apr", 90], ["Jul", 181], ["Oct", 273], ["Dec 31", 365]];
  for (const [n, d] of marks) {
    s += `<line class="${d === 0 || d === 365 ? "axis" : "grid"}" x1="${L}" x2="${W - R}" y1="${y(d)}" y2="${y(d)}"/>`;
    s += `<text x="${L - 8}" y="${y(d) + 4}" text-anchor="end">${n}</text>`;
  }
  for (let G = G0; G <= G1; G += 25) {
    s += `<line class="grid" x1="${x(G)}" x2="${x(G)}" y1="${T}" y2="${H - B}"/>`;
    s += `<text x="${x(G)}" y="${H - B + 20}" text-anchor="middle">${G}</text>`;
  }
  // Solstices, roughly, as reference lines.
  for (const [n, d] of [["June solstice", 171], ["December solstice", 354]]) {
    s += `<line class="line ref" x1="${L}" x2="${W - R}" y1="${y(d)}" y2="${y(d)}"/>`;
    s += `<text class="tag" x="${W - R - 4}" y="${y(d) - 4}" text-anchor="end">${n}</text>`;
  }
  const Y0 = C.islamicFromDate(new Date(Date.UTC(G0, 0, 1))).year, Y1 = C.islamicFromDate(new Date(Date.UTC(G1, 0, 1))).year;
  const pts = [];
  for (let Y = Y0; Y <= Y1; Y++) {
    const d = C.islamicToDate(Y, 9, 1);
    if (d.getUTCFullYear() < G0 || d.getUTCFullYear() >= G1) continue;
    pts.push([Y, d]);
  }
  let curY = null;
  for (const [Y, d] of pts) {
    const cur = Math.abs(d - now) < 200 * DAY && (curY === null);
    if (cur) curY = [Y, d];
    s += `<circle class="${cur ? "dot" : "pt"}" cx="${x(yearFrac(d)).toFixed(1)}" cy="${y(dayOfYear(d)).toFixed(1)}" r="${cur ? 4 : 2.2}"/>`;
  }
  s += `<line class="today" x1="${x(yearFrac(now))}" x2="${x(yearFrac(now))}" y1="${T}" y2="${H - B}"/>`;
  $("drift").innerHTML = s;
  $("drift-cap").textContent =
    `The first day of Ramadan, by the tabular calendar, for each Islamic year from ${pts[0][0]} to ${pts.at(-1)[0]} AH: the year across, the day of the year down. ` +
    `Each year it comes about eleven days earlier, so the dots climb. Ramadan was last centred on the June solstice, its middle within six days of 21 June, in ` +
    `${pts.filter(([, d]) => d < now && midSolstice(d)).at(-1)?.[1].getUTCFullYear() ?? "—"}, and will be again in ` +
    `${pts.find(([, d]) => d > now && midSolstice(d))?.[1].getUTCFullYear() ?? "—"}.` +
    (curY ? ` The red dot is the nearest Ramadan, ${curY[0]} AH.` : "");
}

const lat = C.savedLatitude();
const ramadanDaylight = (Y) => {
  const start = C.islamicToDate(Y, 9, 1).getTime(), n = C.islamicMonthLength(Y, 9);
  let t = 0;
  for (let i = 0; i < n; i++) t += C.dayLength(new Date(start + (i + 0.5) * DAY), lat);
  return t / n;
};
const where = `${Math.abs(lat).toFixed(1)}° ${lat >= 0 ? "north" : "south"}`;
function drawFast() {
  const W = 720, H = 260, L = 54, R = 22, T = 12, B = 34;
  const Y0 = h.year - 40, Y1 = h.year + 40;
  const vals = [];
  for (let Y = Y0; Y <= Y1; Y++) vals.push([Y, ramadanDaylight(Y)]);
  const lo = Math.max(0, Math.floor(Math.min(...vals.map((v) => v[1])) - 1)), hi = Math.min(24, Math.ceil(Math.max(...vals.map((v) => v[1])) + 1));
  const x = (Y) => L + ((Y - Y0) / (Y1 - Y0)) * (W - L - R);
  const y = (v) => H - B - ((v - lo) / (hi - lo)) * (H - T - B);
  let s = "";
  const step = hi - lo > 12 ? 4 : hi - lo > 6 ? 2 : 1;
  for (let v = lo; v <= hi; v += step) {
    s += `<line class="${v === lo ? "axis" : "grid"}" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/>`;
    s += `<text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v} h</text>`;
  }
  for (let Y = Math.ceil(Y0 / 10) * 10; Y <= Y1; Y += 10) {
    const g = C.islamicToDate(Y, 9, 1).getUTCFullYear();
    s += `<line class="grid" x1="${x(Y)}" x2="${x(Y)}" y1="${T}" y2="${H - B}"/>`;
    s += `<text x="${x(Y)}" y="${H - B + 20}" text-anchor="middle">${g}</text>`;
  }
  s += `<polyline class="line" points="${vals.map(([Y, v]) => `${x(Y).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}"/>`;
  const cur = vals.find(([Y]) => Y === (C.islamicToDate(h.year, 9, 1) < today && h.month > 9 ? h.year + 1 : h.year));
  s += `<line class="today" x1="${x(cur[0])}" x2="${x(cur[0])}" y1="${T}" y2="${H - B}"/>`;
  s += `<circle class="dot" cx="${x(cur[0])}" cy="${y(cur[1])}" r="4"/>`;
  $("fast").innerHTML = s;
  const mx = vals.reduce((a, b) => (b[1] > a[1] ? b : a)), mn = vals.reduce((a, b) => (b[1] < a[1] ? b : a));
  $("fast-cap").textContent =
    `Mean daylight through Ramadan at ${where}, from ${Y0} to ${Y1} AH, each labelled by the Gregorian year its Ramadan begins in. ` +
    `Longest in the span: ${mx[0]} AH (${C.islamicToDate(mx[0], 9, 1).getUTCFullYear()}), ${C.fmtHours(mx[1])}. ` +
    `Shortest: ${mn[0]} AH (${C.islamicToDate(mn[0], 9, 1).getUTCFullYear()}), ${C.fmtHours(mn[1])}. The red line marks the coming Ramadan, ${cur[0]} AH.`;
}

{
  const startY = C.islamicToDate(h.year, 10, 1) <= today ? h.year + 1 : h.year;
  const rows = [];
  let differ = 0;
  for (let Y = startY; Y < startY + 12; Y++) {
    const r = C.islamicToDate(Y, 9, 1), e = C.islamicToDate(Y, 10, 1), u = uqFirst(Y, 9);
    const off = u ? Math.round((u - r) / DAY) : 0;
    if (off) differ++;
    rows.push(`<tr><td class="num">${Y}</td><td>${long(r)}</td>` +
      `<td>${u ? (off ? `${short(u, false)} (${off > 0 ? "+" : "−"}${Math.abs(off)})` : "same") : "—"}</td>` +
      `<td>${long(e)}</td><td class="r num">${C.fmtHours(ramadanDaylight(Y)).replace(" min", "")}</td></tr>`);
  }
  $("ramadans").innerHTML = rows.join("");
  $("ramadan-note").textContent =
    `1 Ramadan and 1 Shawwal, the feast of Eid al-Fitr that ends the fast, are by the table. Daylight is the mean from sunrise to sunset through the month at ${where}. ` +
    (uq ? `Umm al-Qura dates are from your browser; they differ from the table in ${differ} of these twelve years, by the days shown. ` +
      "Most Muslims follow a sighting or a national calendar, so the day kept locally can differ from both." : "Your browser does not carry the Umm al-Qura calendar.");
}
setTimeout(() => { drawDrift(); drawFast(); }, 30);

// ---------- two clocks ----------
{
  const rows = [];
  const startG = now.getUTCFullYear() - 40;
  for (let G = startG; rows.length < 6; G++) {
    const a = C.islamicFromDate(new Date(Date.UTC(G, 0, 1)));
    const nY = a.year + 1, n1 = C.islamicToDate(nY, 1, 1), n2 = C.islamicToDate(nY + 1, 1, 1);
    if (n2.getUTCFullYear() === G) {
      rows.push(`<tr${G === now.getUTCFullYear() ? ' class="hit"' : ""}><td class="num">${G}</td><td>1 Muharram ${nY}: ${utc(n1)}</td><td>1 Muharram ${nY + 1}: ${utc(n2)}</td></tr>`);
    }
  }
  $("doubles").innerHTML = rows.join("");
  // The first Gregorian year in which an Islamic year of the same number begins.
  let G = now.getUTCFullYear();
  while (C.islamicFromDate(new Date(Date.UTC(G, 11, 31))).year < G) G++;
  $("meet").textContent = `AD ${G}, when 1 Muharram ${G} falls on ${utc(C.islamicToDate(G, 1, 1))}`;
}
