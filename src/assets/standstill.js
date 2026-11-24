import * as C from "./cycles.js";

const $ = (id) => document.getElementById(id);
const DAY = 86400000, RAD = Math.PI / 180, YEAR = 365.25 * DAY;
const now = new Date();
const EPS = 23.44, INC = 5.14;
const f = (v, d = 1) => v.toLocaleString("en", { minimumFractionDigits: d, maximumFractionDigits: d });
const deg = (v, d = 2) => `${v < 0 ? "−" : ""}${f(Math.abs(v), d)}°`;
const ns = (v, d = 2) => `${f(Math.abs(v), d)}° ${v >= 0 ? "N" : "S"}`;
const short = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const month = (d) => d.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

// Every turning point from 1990 to 2050, found once and shared.
const t0 = Date.UTC(1990, 0, 1), t1 = Date.UTC(2050, 0, 1);
const all = C.moonExtremes(new Date(t0), new Date(t1));
const north = all.filter((e) => e.north), south = all.filter((e) => !e.north);

// The standstills, alternating major and minor, from 1950 to 2052.
const stands = [];
for (let d = new Date(Date.UTC(1945, 0, 1)); stands.length < 12;) {
  const M = C.nextNodeAt(d, 0), m = C.nextNodeAt(d, 180);
  const first = M < m ? { date: M, major: true } : { date: m, major: false };
  stands.push(first);
  d = new Date(first.date.getTime() + 30 * DAY);
}
const nearest = stands.reduce((a, b) => (Math.abs(b.date - now) < Math.abs(a.date - now) ? b : a));
const nextOf = (major) => stands.find((s) => s.major === major && s.date > now);
const lastOf = (major) => [...stands].reverse().find((s) => s.major === major && s.date <= now);

// ---------- today ----------
{
  const node = C.moonNode(now);
  const ex = C.moonExtremes(new Date(now.getTime() - 14 * DAY), new Date(now.getTime() + 14 * DAY));
  const n = ex.find((e) => e.north), s = ex.find((e) => !e.north);
  const sinceMajor = (now - lastOf(true).date) / YEAR;
  // The simple sum: the Moon's tilt projected on the north–south direction at the equinoxes.
  const simple = EPS + INC * Math.cos(node * RAD);
  const rows = [
    ["The Moon now", `${ns(C.moonPosition(now).decl)}`],
    ["Mean ascending node", `${f(node, 2)}° of longitude`],
    ["Simple reach, 23.44° + 5.14° × cos(node)", deg(simple)],
    [`Farthest north this month, ${short(n.date)}`, ns(n.decl)],
    [`Farthest south this month, ${short(s.date)}`, ns(s.decl)],
    ["Since the last major standstill", `${f(sinceMajor, 1)} years`],
    ["Next minor standstill", month(nextOf(false).date)],
    ["Next major standstill", month(nextOf(true).date)],
  ];
  $("now").innerHTML = rows.map(([a, b], i) => `<tr${i === 3 ? ' class="hit"' : ""}><td>${a}</td><td class="r num">${b}</td></tr>`).join("");
  $("period").textContent = f(C.NODE_PERIOD, 2);
}

// ---------- sixty years ----------
{
  const W = 720, H = 320, L = 44, R = 12, T = 14, B = 30;
  const X = (t) => L + (t - t0) / (t1 - t0) * (W - L - R);
  const Y = (d) => T + (30 - d) / 60 * (H - T - B);
  let s = "";
  for (const d of [-30, -20, -10, 0, 10, 20, 30]) {
    s += `<line class="${d ? "grid" : "axis"}" x1="${L}" x2="${W - R}" y1="${Y(d)}" y2="${Y(d)}"/><text x="${L - 6}" y="${Y(d) + 4}" text-anchor="end">${d < 0 ? "−" : d > 0 ? "+" : ""}${Math.abs(d)}°</text>`;
  }
  for (let y = 1990; y <= 2050; y += 10) {
    const x = X(Date.UTC(y, 0, 1));
    s += `<line class="grid" x1="${x}" x2="${x}" y1="${T}" y2="${H - B}"/><text x="${x}" y="${H - 10}" text-anchor="middle">${y}</text>`;
  }
  for (const e of [EPS, -EPS]) s += `<line class="line ref" x1="${L}" x2="${W - R}" y1="${Y(e).toFixed(1)}" y2="${Y(e).toFixed(1)}"/>`;
  const line = (pts) => `<polyline class="line thin" points="${pts.map((e) => `${X(e.date.getTime()).toFixed(1)},${Y(e.decl).toFixed(1)}`).join(" ")}"/>`;
  s += line(north) + line(south);
  for (const st of stands.filter((x) => x.date >= t0 && x.date <= t1)) {
    const x = X(st.date.getTime());
    s += `<text class="tag" x="${x.toFixed(1)}" y="${(st.major ? Y(0) - 6 : Y(0) + 14).toFixed(1)}" text-anchor="middle">${st.major ? "major" : "minor"}</text>`;
    s += `<circle class="dot ink" cx="${x.toFixed(1)}" cy="${Y(0)}" r="3"/>`;
  }
  const tx = X(now.getTime());
  s += `<line class="today" x1="${tx.toFixed(1)}" x2="${tx.toFixed(1)}" y1="${T}" y2="${H - B}"/>`;
  $("reach").innerHTML = s;
  const hi = north.reduce((a, b) => (b.decl > a.decl ? b : a)), lo = south.reduce((a, b) => (b.decl < a.decl ? b : a));
  $("reach-cap").textContent = `The Moon’s farthest north (upper line) and farthest south (lower line) in each month from 1990 to 2049, ${north.length} of each. The dashed lines are the Sun’s limits, ±23.44°; the red line is today. The farthest north of the sixty years is ${ns(hi.decl)} on ${short(hi.date)}, the farthest south ${ns(lo.decl)} on ${short(lo.date)}.`;
}

// ---------- the standstills ----------
{
  // At a major standstill, the greatest reach within a year; at a minor one, the least.
  const farthest = (st, isNorth) => {
    const ex = C.moonExtremes(new Date(st.date.getTime() - YEAR), new Date(st.date.getTime() + YEAR)).filter((e) => e.north === isNorth);
    return ex.reduce((a, b) => (Math.abs(b.decl) > Math.abs(a.decl) === st.major ? b : a));
  };
  $("list").innerHTML = stands.map((st) => {
    const n = farthest(st, true), s = farthest(st, false);
    const hit = st === nearest;
    return `<tr${hit ? ' class="hit"' : ""}><td>${st.major ? "Major" : "Minor"}</td><td>${month(st.date)}</td><td class="r num">${ns(n.decl)}, ${month(n.date).split(" ")[0].slice(0, 3)}</td><td class="r num">${ns(s.decl)}, ${month(s.date).split(" ")[0].slice(0, 3)}</td></tr>`;
  }).join("");
  $("list-note").textContent = "For a major standstill the columns give the greatest declination within a year of the node’s date; for a minor one, the least of the monthly turning points. Each month is the turning point’s own, which can fall in the year before or after.";
}

// ---------- the ripple ----------
{
  const c = nearest.date.getTime(), a = c - 1.5 * YEAR, b = c + 1.5 * YEAR;
  const ex = C.moonExtremes(new Date(a), new Date(b)).filter((e) => e.north);
  const ecl = C.eclipsesFrom(new Date(a), 12).filter((e) => e.date.getTime() <= b);
  const W = 720, H = 280, L = 44, R = 12, T = 26, B = 30;
  const lo = Math.floor(Math.min(...ex.map((e) => e.decl)) * 2) / 2 - 0.25, hi = Math.ceil(Math.max(...ex.map((e) => e.decl)) * 2) / 2 + 0.25;
  const X = (t) => L + (t - a) / (b - a) * (W - L - R);
  const Y = (d) => T + (hi - d) / (hi - lo) * (H - T - B);
  let s = "";
  for (let d = Math.ceil(lo * 2) / 2; d <= hi; d += 0.5) {
    s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${Y(d).toFixed(1)}" y2="${Y(d).toFixed(1)}"/><text x="${L - 6}" y="${(Y(d) + 4).toFixed(1)}" text-anchor="end">${f(d, 1)}°</text>`;
  }
  for (let y = new Date(a).getUTCFullYear() + 1; Date.UTC(y, 0, 1) <= b; y++) {
    const x = X(Date.UTC(y, 0, 1));
    s += `<line class="grid" x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${T}" y2="${H - B}"/><text x="${x.toFixed(1)}" y="${H - 10}" text-anchor="middle">${y}</text>`;
  }
  for (const e of ecl) {
    const x = X(e.date.getTime());
    s += `<line class="line ref hit" x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${T - 4}" y2="${H - B}"><title>${e.solar ? "Solar" : "Lunar"} eclipse, ${short(e.date)}</title></line>`;
    s += `<text class="tag" x="${x.toFixed(1)}" y="${T - 8}" text-anchor="middle">${e.solar ? "☉" : "☾"}</text>`;
  }
  s += `<polyline class="line" points="${ex.map((e) => `${X(e.date.getTime()).toFixed(1)},${Y(e.decl).toFixed(1)}`).join(" ")}"/>`;
  for (const e of ex) s += `<circle class="dot ink" cx="${X(e.date.getTime()).toFixed(1)}" cy="${Y(e.decl).toFixed(1)}" r="2.2"><title>${short(e.date)}: ${ns(e.decl)}</title></circle>`;
  const sx = X(c);
  s += `<line class="axis" x1="${sx.toFixed(1)}" x2="${sx.toFixed(1)}" y1="${H - B - 4}" y2="${H - B + 4}"/>`;
  s += `<text class="tag" x="${sx.toFixed(1)}" y="${H - B - 8}" text-anchor="middle">${nearest.major ? "major" : "minor"} standstill</text>`;
  if (now.getTime() > a && now.getTime() < b) {
    const tx = X(now.getTime());
    s += `<line class="today" x1="${tx.toFixed(1)}" x2="${tx.toFixed(1)}" y1="${T}" y2="${H - B}"/>`;
  }
  $("ripple").innerHTML = s;
  $("ripple-cap").textContent = `The Moon’s farthest north in each month for eighteen months either side of the ${nearest.major ? "major" : "minor"} standstill of ${month(nearest.date)}. The red dashed lines are eclipses, ☉ of the Sun and ☾ of the Moon.`;

  // Where the ripple peaks (major) or dips (minor), and how near each is to an eclipse.
  const peaks = ex.filter((e, i) => i > 0 && i < ex.length - 1 &&
    (nearest.major ? e.decl > ex[i - 1].decl && e.decl >= ex[i + 1].decl : e.decl < ex[i - 1].decl && e.decl <= ex[i + 1].decl));
  const gaps = peaks.map((p) => Math.min(...ecl.map((e) => Math.abs(e.date - p.date) / DAY)));
  const swing = Math.max(...ex.map((e) => e.decl)) - Math.min(...ex.map((e) => e.decl));
  $("ripple-text").textContent = `Over these three years the monthly reach changes by only ${f(swing, 2)}° in all, which is why the turning points seem to stand still. Within that, it ${nearest.major ? "peaks" : "dips"} ${peaks.length} times, about every six months: ${peaks.map((p) => short(p.date)).join(", ")}. Each of those turns falls within ${Math.ceil(Math.max(...gaps))} days of an eclipse. Eclipses come when the Sun stands at a node, about every 173 days, so the rocking of the tilt keeps time with the eclipse seasons.`;
}

// ---------- the horizon ----------
const bearing = (decl, lat, h0) => {
  const c = (Math.sin(decl * RAD) - Math.sin(lat * RAD) * Math.sin(h0 * RAD)) / (Math.cos(lat * RAD) * Math.cos(h0 * RAD));
  return c >= 1 ? 0 : c <= -1 ? 180 : Math.acos(c) / RAD;
};
const never = (decl, lat, h0) => {
  const c = (Math.sin(decl * RAD) - Math.sin(lat * RAD) * Math.sin(h0 * RAD)) / (Math.cos(lat * RAD) * Math.cos(h0 * RAD));
  return c >= 1 ? (lat > 0 ? "never sets" : "never rises") : c <= -1 ? (lat > 0 ? "never rises" : "never sets") : "";
};
const MOON_H0 = 0.125, SUN_H0 = -0.833;
const majorN = north.reduce((a, b) => (b.decl > a.decl ? b : a)).decl, majorS = south.reduce((a, b) => (b.decl < a.decl ? b : a)).decl;
const minorAt = stands.find((s) => !s.major && s.date > t0 && s.date < t1).date;
const near = (arr, t) => arr.filter((e) => Math.abs(e.date - t) < YEAR);
const minorN = Math.min(...near(north, minorAt).map((e) => e.decl)), minorS = Math.max(...near(south, minorAt).map((e) => e.decl));
const monthEx = C.moonExtremes(new Date(now.getTime() - 14 * DAY), new Date(now.getTime() + 14 * DAY));
const nowN = monthEx.find((e) => e.north).decl, nowS = monthEx.find((e) => !e.north).decl;

function drawHorizon(lat) {
  const rows = [
    { name: "The Sun through the year", n: EPS, s: -EPS, h0: SUN_H0, sun: true },
    { name: "The Moon at a minor standstill", n: minorN, s: minorS, h0: MOON_H0 },
    { name: "The Moon this month", n: nowN, s: nowS, h0: MOON_H0, hit: true },
    { name: "The Moon at a major standstill", n: majorN, s: majorS, h0: MOON_H0 },
  ];
  const W = 720, H = 300, L = 24, R = 24, T = 40, B = 40, rowH = (H - T - B) / rows.length;
  const X = (az) => L + az / 180 * (W - L - R);
  let s = `<line class="axis" x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/>`;
  for (const [az, t] of [[0, "N"], [45, "NE"], [90, "E"], [135, "SE"], [180, "S"]]) {
    s += `<line class="grid" x1="${X(az)}" x2="${X(az)}" y1="${T - 10}" y2="${H - B}"/><text x="${X(az)}" y="${H - B + 20}" text-anchor="middle">${t}</text>`;
  }
  s += `<text x="${X(90)}" y="${T - 18}" text-anchor="middle">The eastern horizon, where each rises</text>`;
  rows.forEach((r, i) => {
    const y = T + i * rowH + rowH / 2;
    const a = bearing(r.n, lat, r.h0), b = bearing(r.s, lat, r.h0);
    s += `<rect class="bar${r.hit ? " hit" : r.sun ? " march" : ""}" x="${X(a).toFixed(1)}" y="${(y - 5).toFixed(1)}" width="${Math.max(1.5, X(b) - X(a)).toFixed(1)}" height="10"/>`;
    s += `<text x="${Math.min(X(a), W - R - 230).toFixed(1)}" y="${(y - 11).toFixed(1)}">${r.name}</text>`;
    r.a = a; r.b = b;
  });
  $("horizon").innerHTML = s;
  $("horizon-cap").textContent = `Where on the eastern horizon the Sun and the Moon rise at ${ns(lat, 1)}: each bar runs from the most northerly rising to the most southerly. Setting is the mirror image in the west. The red bar is this month’s.`;

  const peak = (d) => 90 - Math.abs(lat - d);
  const fmtAlt = (v) => (v <= 0 ? "below the horizon" : deg(v, 1));
  $("rise").innerHTML = rows.map((r) => {
    const far = [never(r.n, lat, r.h0), never(r.s, lat, r.h0)];
    const az = `${far[0] ? far[0] : deg(r.a, 1)} to ${far[1] ? far[1] : deg(r.b, 1)}`;
    const alts = [peak(r.n), peak(r.s)].sort((x, y) => y - x);
    return `<tr${r.hit ? ' class="hit"' : ""}><td>${r.name}</td><td class="r num">${deg(r.n)} to ${deg(r.s)}</td><td class="r num">${az}</td><td class="r num">${fmtAlt(alts[0])} to ${fmtAlt(alts[1])}</td></tr>`;
  }).join("");
}

function set(lat, save = true) {
  lat = Math.max(-89, Math.min(89, Number(lat)));
  if (!Number.isFinite(lat)) return;
  $("lat").value = lat;
  $("lat-range").value = lat;
  if (save) C.saveLatitude(lat);
  drawHorizon(lat);
}
$("lat-range").addEventListener("input", (e) => set(e.target.value));
$("lat").addEventListener("change", (e) => set(e.target.value));
set(C.savedLatitude(), false);
