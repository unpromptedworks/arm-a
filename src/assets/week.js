import * as C from "./cycles.js";

const $ = (id) => document.getElementById(id);
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const now = new Date();
const tY = now.getFullYear(), tM = now.getMonth() + 1, tD = now.getDate();
const n = (v) => v.toLocaleString("en");

// ---------- the running count ----------
$("quarter").textContent = (C.SYNODIC_MONTH / 4).toFixed(2);
{
  const jdn = C.julianDayNumber(tY, tM, tD);
  const r = (jdn + 1) % 7;
  $("count").innerHTML = [
    ["Date", `${DAYS[now.getDay()]} ${C.fmtDate(now)}`],
    ["Julian Day Number", n(jdn)],
    ["Plus one, divided by seven", `${n(Math.floor((jdn + 1) / 7))} weeks, remainder ${r}`],
    ["Weekday from the remainder", DAYS[r]],
    ["Weekday of Julian Day 0, 1 January 4713 BC", DAYS[(0 + 1) % 7]],
  ].map(([k, v]) => `<tr><td>${k}</td><td class="r num">${v}</td></tr>`).join("");
}

// ---------- the reforms ----------
// Each change as [name, last old date (Julian) given as its Gregorian
// equivalent, first new date (Gregorian)], and the old date as written.
{
  const rows = [
    ["Gregorian reform", "Thursday 4 October 1582", [1582, 10, 14], "Friday 15 October 1582", [1582, 10, 15]],
    ["Britain and its colonies", "Wednesday 2 September 1752", [1752, 9, 13], "Thursday 14 September 1752", [1752, 9, 14]],
  ];
  $("reforms").innerHTML = rows.map(([what, oldTxt, oldG, newTxt, newG]) => {
    const a = C.julianDayNumber(...oldG), b = C.julianDayNumber(...newG);
    const ok = DAYS[(a + 1) % 7] === oldTxt.split(" ")[0] && DAYS[(b + 1) % 7] === newTxt.split(" ")[0];
    return `<tr><td>${what}</td><td>${oldTxt}</td><td>${newTxt}</td><td class="r num">${n(a)}, ${n(b)}${ok ? "" : " ?"}</td></tr>`;
  }).join("");
}

// ---------- the planetary hours ----------
const PLANETS = C.CHALDEAN;
const ABBR = ["Sa", "Ju", "Ma", "Su", "Ve", "Me", "Mo"];
// Day names in planet order (Chaldean index -> weekday index).
const WEEKDAY_OF = { Saturn: 6, Sun: 0, Moon: 1, Mars: 2, Mercury: 3, Jupiter: 4, Venus: 5 };
function drawHours() {
  const W = 720, H = 230, L = 86, T = 24, R = 4, rowH = 28;
  const cw = (W - L - R) / 24;
  let s = "";
  for (let h = 0; h < 24; h += 1) {
    if (h % 3 === 0) s += `<text x="${(L + (h + 0.5) * cw).toFixed(1)}" y="${T - 8}" text-anchor="middle">${h + 1}</text>`;
  }
  for (let d = 0; d < 7; d++) {
    const y0 = T + d * rowH, first = PLANETS[C.hourRuler(d, 0)];
    s += `<text x="${L - 8}" y="${y0 + rowH / 2 + 4}" text-anchor="end">${DAYS[WEEKDAY_OF[first]]}</text>`;
    for (let h = 0; h < 24; h++) {
      const p = C.hourRuler(d, h), x0 = L + h * cw;
      s += `<rect class="box${h === 0 ? " first" : ""}" x="${(x0 + 1).toFixed(1)}" y="${y0 + 1}" width="${(cw - 2).toFixed(1)}" height="${rowH - 2}"><title>${DAYS[WEEKDAY_OF[first]]}, hour ${h + 1}: ${PLANETS[p]}</title></rect>`;
      s += `<text class="${h === 0 ? "first" : ""}" x="${(x0 + cw / 2).toFixed(1)}" y="${y0 + rowH / 2 + 4}" text-anchor="middle">${ABBR[p]}</text>`;
    }
  }
  $("hours").innerHTML = s;
  $("hours-cap").textContent =
    "The ruler of each of the 24 hours, for seven days from a Saturday whose first hour is Saturn’s. " +
    "Each hour takes the next planet in the Chaldean order: Sa Saturn, Ju Jupiter, Ma Mars, Su Sun, Ve Venus, Me Mercury, Mo Moon. " +
    "The 25th hour, the first of the next day, falls to the Sun, three places on; the first hours, in red, spell out the week.";
}

// The same rule as a star: the planets round a circle in Chaldean
// order, and a line from each day's planet to the next, three places on.
function drawStar() {
  const W = 720, H = 340, cx = W / 2, cy = H / 2 + 4, r = 128;
  const at = (i, rr = r) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 7;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  };
  let s = `<circle class="ring" cx="${cx}" cy="${cy}" r="${r}"/>`;
  const order = [...Array(7)].map((_, d) => C.hourRuler(d, 0)); // Chaldean indices, day by day
  const pts = [...order, order[0]].map((i) => at(i).map((v) => v.toFixed(1)).join(",")).join(" ");
  s += `<polyline class="line" points="${pts}"/>`;
  const todayIdx = PLANETS.findIndex((p) => WEEKDAY_OF[p] === now.getDay());
  PLANETS.forEach((p, i) => {
    const [x, y] = at(i), [lx, ly] = at(i, r + 26);
    const anchor = lx < cx - 10 ? "end" : lx > cx + 10 ? "start" : "middle";
    s += `<circle class="${i === todayIdx ? "dot" : "node"}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5"/>`;
    s += `<text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="${anchor}"${i === todayIdx ? ' class="first"' : ""}>${p} · ${DAYS[WEEKDAY_OF[p]]}</text>`;
  });
  $("star").innerHTML = s;
  $("star-cap").textContent =
    "The seven planets round a circle in the Chaldean order, slowest at the top and clockwise. " +
    "Following the line, each step jumps three places, and the days come out in the order of the week: Saturday, Sunday, Monday and on round. " +
    `Today, ${DAYS[now.getDay()]}, is ${PLANETS[todayIdx]}’s day, marked in red.`;
}

$("names").innerHTML = [
  ["Sun", "diēs Sōlis", "dimanche", "Sunday"],
  ["Moon", "diēs Lūnae", "lundi", "Monday"],
  ["Mars", "diēs Mārtis", "mardi", "Tuesday, Tiw’s day"],
  ["Mercury", "diēs Mercuriī", "mercredi", "Wednesday, Woden’s day"],
  ["Jupiter", "diēs Iovis", "jeudi", "Thursday, Thunor’s day"],
  ["Venus", "diēs Veneris", "vendredi", "Friday, Frig’s day"],
  ["Saturn", "diēs Sāturnī", "samedi", "Saturday, Saturn’s day"],
].map((r, i) => `<tr${i === now.getDay() ? ' class="hit"' : ""}>${r.map((c, j) => `<td>${j === 1 ? `<em>${c}</em>` : c}</td>`).join("")}</tr>`).join("");

// ---------- the Doomsday rule ----------
const REF_NAME = ["3 January (4 in a leap year)", "the last day of February", "14 March", "4 April", "9 May", "6 June",
  "11 July", "8 August", "5 September", "10 October", "7 November", "12 December"];
function doom(Y, m, d) {
  if (!(Y >= 1583 && Y <= 9999)) {
    $("dd-answer").textContent = "Choose a date from 1583 to 9999.";
    $("dd-steps").innerHTML = "";
    $("dd-note").textContent = "";
    return;
  }
  const s = C.doomsdaySteps(Y, m, d);
  const refDay = m === 1 ? (s.leap ? 4 : 3) : s.ref;
  const refTxt = m === 1 ? `${refDay} January` : m === 2 ? `${refDay} February` : REF_NAME[m - 1];
  const diff = d - refDay;
  const rows = [
    ["anchor", `century ${s.c}: 2 + 5 × (${s.c} mod 4) = 2 + 5 × ${s.c % 4}, mod 7`, `${s.anchor} · ${DAYS[s.anchor]}`],
    ["a", `${String(s.yy).padStart(2, "0")} ÷ 12, whole part`, s.a],
    ["b", `${String(s.yy).padStart(2, "0")} mod 12`, s.b],
    ["c", `b ÷ 4, whole part`, s.q],
    ["doomsday", `anchor + a + b + c = ${s.anchor + s.a + s.b + s.q}, mod 7`, `${s.doomsday} · ${DAYS[s.doomsday]}`],
    ["in month", `doomsday in ${MONTHS[m - 1]}: ${refTxt}`, `${diff >= 0 ? "+" : "−"}${Math.abs(diff)} days`],
    ["weekday", `${s.doomsday} ${diff >= 0 ? "+" : "−"} ${Math.abs(diff)}, mod 7`, `${s.dow} · ${DAYS[s.dow]}`],
  ];
  $("dd-steps").innerHTML = rows.map(([k, w, v]) => `<tr><td>${k}</td><td>${w}</td><td class="num">${v}</td></tr>`).join("");
  $("dd-answer").textContent = `${d} ${MONTHS[m - 1]} ${Y} is a ${DAYS[s.dow]}`;
  const check = C.weekday(Y, m, d);
  $("dd-note").textContent =
    `In your head the sums shrink: ${s.a} twelves, ${s.b} over and ${s.q} fours make ${s.a + s.b + s.q}, or ${(s.a + s.b + s.q) % 7} once sevens are cast out. ` +
    (check === s.dow ? "Your browser’s own calendar agrees." : `Your browser’s calendar says ${DAYS[check]}.`) +
    " Days before 1583 are left out: the rule is for the Gregorian calendar, which began in October 1582.";
}
const iso = (Y, m, d) => `${String(Y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
$("when").value = iso(tY, tM, tD);
$("when").addEventListener("input", (e) => {
  const [Y, m, d] = e.target.value.split("-").map(Number);
  if (Y && m && d) doom(Y, m, d);
});
doom(tY, tM, tD);

// ---------- ISO weeks ----------
function drawIso() {
  const w = C.isoWeek(tY, tM, tD);
  $("iso-today").textContent = `Today is ${DAYS[now.getDay()]} of week ${w.week} of ${w.year}, written ${w.year}-W${String(w.week).padStart(2, "0")}-${w.dow}.`;
  const Y0 = 2001, cols = 20, rows = 20;
  const W = 720, H = 360, L = 50, T = 10, R = 6, B = 6;
  const cw = (W - L - R) / cols, rh = (H - T - B) / rows;
  let s = "", count = 0;
  const long = [];
  for (let i = 0; i < 400; i++) {
    const Y = Y0 + i, c = i % cols, r = Math.floor(i / cols);
    if (c === 0) s += `<text x="${L - 8}" y="${(T + r * rh + rh / 2 + 4).toFixed(1)}" text-anchor="end">${Y}</text>`;
    const is53 = C.isoWeeksInYear(Y) === 53;
    if (is53) { count++; long.push(Y); }
    s += `<rect class="box${is53 ? " long" : ""}${Y === tY ? " now" : ""}" x="${(L + c * cw + 1).toFixed(1)}" y="${(T + r * rh + 1).toFixed(1)}" width="${(cw - 2).toFixed(1)}" height="${(rh - 2).toFixed(1)}"><title>${Y}: ${is53 ? 53 : 52} weeks</title></rect>`;
  }
  $("iso").innerHTML = s;
  const next = long.filter((Y) => Y >= tY).slice(0, 6);
  const gaps = long.slice(1).map((Y, i) => Y - long[i]);
  const gapSet = [...new Set(gaps)].sort((a, b) => a - b);
  $("iso-cap").textContent =
    `The four hundred years from ${Y0} to ${Y0 + 399}, twenty to a row; the ${count} with 53 ISO weeks are filled in red` +
    (tY >= Y0 && tY < Y0 + 400 ? `, and this year is outlined` : "") + ". " +
    `They come ${gapSet.slice(0, -1).join(", ")} or ${gapSet.at(-1)} years apart. ` +
    `Next: ${next.join(", ")}. ` +
    `On average a year is 146,097 ÷ 7 ÷ 400 = ${(146097 / 7 / 400).toFixed(4)} weeks, and ${count} ÷ 400 = ${(count / 400).toFixed(4)} is the fraction past 52.`;
}

setTimeout(() => { drawHours(); drawStar(); drawIso(); }, 20);
