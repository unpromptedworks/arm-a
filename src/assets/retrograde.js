import * as C from "./cycles.js";

const $ = (id) => document.getElementById(id);
const DAY = 86400000, RAD = Math.PI / 180;
const now = new Date();
const P = C.NAKED_EYE;
const f = (v, d = 1) => v.toLocaleString("en", { minimumFractionDigits: d, maximumFractionDigits: d });
const fd = (d) => C.fmtDate(d);
const short = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const wrap = (v) => ((v % 360) + 540) % 360 - 180;

// The present or next spell for each planet.
const spells = Object.fromEntries(P.map((p) => [p, C.retrogrades(p, now, new Date(now.getTime() + 800 * DAY))]));
const current = (p) => spells[p][0];

// ---------- today ----------
{
  $("now").innerHTML = P.map((p) => {
    const v = C.dailyMotion(p, now), s = current(p), on = s && s.start <= now;
    return `<tr${on ? ' class="hit"' : ""}><td>${p}</td><td class="r num">${v < 0 ? "−" : "+"}${f(Math.abs(v), 3)}</td><td>${on ? "retrograde" : "direct"}</td><td>${s ? short(s.start) : "—"}</td><td>${s ? short(s.end) : "—"}</td><td class="r num">${s ? Math.round(s.days) : ""}</td></tr>`;
  }).join("");
}

// ---------- three years of spells ----------
{
  const W = 720, H = 210, L = 72, R = 12, T = 14, B = 30, row = (H - T - B) / P.length;
  const t0 = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1), t1 = t0 + 3 * 365.25 * DAY;
  const X = (t) => L + (t - t0) / (t1 - t0) * (W - L - R);
  let s = "";
  for (let y = new Date(t0).getUTCFullYear() + 1; Date.UTC(y, 0, 1) <= t1; y++) {
    const x = X(Date.UTC(y, 0, 1));
    s += `<line class="grid" x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${T}" y2="${H - B}"/><text x="${x.toFixed(1)}" y="${H - 10}" text-anchor="middle">${y}</text>`;
  }
  P.forEach((p, i) => {
    const y = T + i * row;
    s += `<text x="${L - 8}" y="${(y + row / 2 + 4).toFixed(1)}" text-anchor="end">${p}</text>`;
    s += `<line class="axis" x1="${L}" x2="${W - R}" y1="${(y + row / 2).toFixed(1)}" y2="${(y + row / 2).toFixed(1)}"/>`;
    for (const sp of C.retrogrades(p, new Date(t0), new Date(t1))) {
      const a = Math.max(X(sp.start.getTime()), L), b = Math.min(X(sp.end.getTime()), W - R);
      if (b <= a) continue;
      s += `<rect class="bar${p === "Mars" ? " hit" : ""}" x="${a.toFixed(1)}" y="${(y + row * 0.25).toFixed(1)}" width="${(b - a).toFixed(1)}" height="${(row * 0.5).toFixed(1)}"><title>${p} retrograde ${fd(sp.start)} to ${fd(sp.end)}, ${Math.round(sp.days)} days</title></rect>`;
    }
  });
  const tx = X(now.getTime());
  s += `<line class="today" x1="${tx.toFixed(1)}" x2="${tx.toFixed(1)}" y1="${T - 4}" y2="${H - B}"/>`;
  $("strip").innerHTML = s;
  $("strip-cap").textContent = `Every retrograde spell of the five planets for three years from ${short(new Date(t0))}. Each bar runs from the station where the planet turns west to the one where it turns east again. The red line is today. Mars, red, goes retrograde least often; Mercury three or four times a year.`;
}

// ---------- the loop of one planet ----------
const MIDDLE = (p) => (C.INFERIOR(p) ? "inferior conjunction" : "opposition");
function drawLoop(p) {
  const sp = current(p);
  const pad = sp.days * 0.6, a = sp.start.getTime() - pad * DAY, b = sp.end.getTime() + pad * DAY;
  const mid = C.planetEvents(p, sp.start, sp.end).find((e) => e.kind === MIDDLE(p));
  const steps = 240, pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = new Date(a + (b - a) * i / steps);
    pts.push({ t, lon: C.longitudeOfDate(p, t), lat: C.planetFromEarth(p, t).lat });
  }
  const ref = sp.startLon;
  const xs = pts.map((q) => wrap(q.lon - ref)), ys = pts.map((q) => q.lat);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)], [y0, y1] = [Math.min(...ys), Math.max(...ys)];
  const W = 720, M = 40;
  const k = Math.min((W - 2 * M) / (x1 - x0), 240 / Math.max(y1 - y0, 0.5));
  const H = Math.max(190, Math.round((y1 - y0) * k + 2 * M + 34));
  $("sky").setAttribute("viewBox", `0 0 ${W} ${H}`);
  const cxm = (x0 + x1) / 2, cym = (y0 + y1) / 2;
  const X = (dl) => W / 2 - (dl - cxm) * k; // east (greater longitude) to the left
  const Y = (lat) => (H - 20) / 2 - (lat - cym) * k;
  let s = "";
  // Degree grid every 1, 2 or 5 degrees.
  const g = k > 40 ? 1 : k > 15 ? 2 : 5;
  for (let d = Math.ceil((x0 - 30) / g) * g; d <= x1 + 30; d += g) {
    const x = X(d); if (x < 4 || x > W - 4) continue;
    const lon = ((ref + d) % 360 + 360) % 360;
    s += `<line class="grid" x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="8" y2="${H - 28}"/><text x="${x.toFixed(1)}" y="${H - 10}" text-anchor="middle">${Math.round(lon)}°</text>`;
  }
  s += `<path class="line" d="${pts.map((q, i) => `${i ? "L" : "M"}${X(xs[i]).toFixed(1)},${Y(ys[i]).toFixed(1)}`).join("")}"/>`;
  // Station and middle marks first, so month labels can keep clear of them.
  const marks = [[sp.start, "turns west"], [sp.end, "turns east"], ...(mid ? [[mid.date, MIDDLE(p)]] : [])]
    .map(([date, label]) => ({ date, label, x: X(wrap(C.longitudeOfDate(p, date) - ref)), y: Y(C.planetFromEarth(p, date).lat) }));
  // A tick at the first of each month, labelled unless crowded.
  let lastLab = -99;
  pts.forEach((q, i) => {
    if (!i) return;
    const prev = pts[i - 1].t;
    if (q.t.getUTCMonth() === prev.getUTCMonth()) return;
    const x = X(xs[i]), y = Y(ys[i]);
    s += `<circle class="dot ink" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5"/>`;
    if (Math.abs(x - lastLab) > 46 && marks.every((m) => Math.hypot(m.x - x, m.y - y) > 40)) {
      s += `<text x="${x.toFixed(1)}" y="${(y + 16).toFixed(1)}" text-anchor="middle">${q.t.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}</text>`;
      lastLab = x;
    }
  });
  for (const m of marks) {
    const anchor = m.x < 90 ? "start" : m.x > W - 90 ? "end" : "middle";
    const tx = anchor === "start" ? m.x - 6 : anchor === "end" ? m.x + 6 : m.x;
    s += `<circle class="dot" cx="${m.x.toFixed(1)}" cy="${m.y.toFixed(1)}" r="4.5"/><text class="tag" x="${tx.toFixed(1)}" y="${(m.y - 11).toFixed(1)}" text-anchor="${anchor}">${m.label}</text>`;
  }
  s += `<text x="10" y="20">← east</text><text x="${W - 10}" y="20" text-anchor="end">west →</text>`;
  $("sky").innerHTML = s;
  const latSpan = y1 - y0;
  $("sky-cap").textContent = `${p} from ${short(new Date(a))} to ${short(new Date(b))}, in ecliptic longitude of date (along the foot) and latitude, one scale for both; a dot marks the first of each month. It turns west on ${fd(sp.start)} at ${f(sp.startLon)}°, runs back ${f(sp.arc)}° in ${Math.round(sp.days)} days and turns east on ${fd(sp.end)}${mid ? `, with its ${MIDDLE(p)} on ${fd(mid.date)}` : ""}. Its latitude changes by ${f(latSpan)}° over the picture.`;
  drawAbove(p, sp, a, b);
}

function drawAbove(p, sp, a, b) {
  const W = 720, top = 400, cx = W / 2, cy = top / 2, n = 9, rowH = 15, H = top + 50 + n * rowH;
  const el = C.PLANET_ELEMENTS[p], far = Math.max(el[0] * (1 + el[1]), 1.02);
  const s = 180 / far; // px per au
  const jd0 = C.toJD(new Date(a));
  let out = "";
  for (const q of ["Earth", p]) {
    let path = "";
    for (let i = 0; i <= 120; i++) {
      const h = C.heliocentric(q, jd0 + i / 120 * C.siderealPeriod(q));
      path += `${i ? "L" : "M"}${(cx + h.x * s).toFixed(1)},${(cy - h.y * s).toFixed(1)}`;
    }
    out += `<path class="ring" d="${path}"/>`;
  }
  out += `<circle class="dot ink" cx="${cx}" cy="${cy}" r="5"/><text x="${cx + 8}" y="${cy - 8}">Sun</text>`;
  const dirs = [];
  for (let i = 0; i < n; i++) {
    const t = new Date(a + (b - a) * i / (n - 1)), jd = C.toJD(t);
    const E = C.heliocentric("Earth", jd), Q = C.heliocentric(p, jd);
    const ex = E.x * s, ey = E.y * s, dx = (Q.x - E.x) * s, dy = (Q.y - E.y) * s;
    const retro = t >= sp.start && t <= sp.end;
    // The line of sight runs on past the planet; the stars are too far off to draw.
    let k = Math.min(1.6, 215 / Math.hypot(dx, dy) + 0.05);
    while (k > 1.05 && (Math.abs(ex + dx * k) > cx - 30 || Math.abs(ey + dy * k) > cy - 22)) k -= 0.02;
    const lx = cx + ex + dx * k, ly = cy - (ey + dy * k);
    out += `<line class="line ref${retro ? " hit" : ""}" x1="${(cx + ex).toFixed(1)}" y1="${(cy - ey).toFixed(1)}" x2="${lx.toFixed(1)}" y2="${ly.toFixed(1)}"/>`;
    out += `<circle class="dot open" cx="${(cx + ex).toFixed(1)}" cy="${(cy - ey).toFixed(1)}" r="3"/><circle class="dot ink" cx="${(cx + Q.x * s).toFixed(1)}" cy="${(cy - Q.y * s).toFixed(1)}" r="3"/>`;
    out += `<text class="${retro ? "tag" : ""}" x="${(lx + dx / Math.hypot(dx, dy) * 10).toFixed(1)}" y="${(ly - dy / Math.hypot(dx, dy) * 10 + 4).toFixed(1)}" text-anchor="middle">${i + 1}</text>`;
    dirs.push([Math.atan2(dy, dx) / RAD, retro, t]);
  }
  // Below: the direction of each line of sight, one row per step, east on the left.
  const d0 = dirs[0][0], rel = dirs.map(([d]) => wrap(d - d0));
  const lo = Math.min(...rel), hi = Math.max(...rel), L = 120, R = 40;
  const X = (v) => W - R - (v - lo) / (hi - lo || 1) * (W - L - R);
  const y0 = top + 30;
  out += `<text x="${L}" y="${y0 - 12}">← east</text><text x="${W - R}" y="${y0 - 12}" text-anchor="end">west →</text>`;
  out += `<path class="line thin" d="${rel.map((v, i) => `${i ? "L" : "M"}${X(v).toFixed(1)},${(y0 + i * rowH).toFixed(1)}`).join("")}"/>`;
  rel.forEach((v, i) => {
    const y = y0 + i * rowH, [, retro, t] = dirs[i];
    out += `<text class="${retro ? "tag" : ""}" x="10" y="${(y + 4).toFixed(1)}">${i + 1}. ${t.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}</text>`;
    out += `<circle class="dot${retro ? "" : " ink"}" cx="${X(v).toFixed(1)}" cy="${y.toFixed(1)}" r="3.5"/>`;
  });
  const svg = $("above");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = out;
  $("above-cap").textContent = `Above: the same weeks seen from above the north pole of the ecliptic, the orbits to scale. Open circles are the Earth, black dots ${p}, at nine equal steps of ${Math.round((b - a) / DAY / (n - 1))} days, and each dashed line is a line of sight from the Earth through ${p}, numbered in order of time. Below: the direction of each line, the only thing the stars show us, spread out across ${f(hi - lo)}°. The red lines and rows fall while ${p} is retrograde, and there the directions run backwards.`;
}

{
  const pick = $("pick");
  pick.innerHTML = P.map((p) => `<button type="button" data-p="${p}" aria-pressed="${p === "Mars"}">${p}</button>`).join(" ");
  pick.addEventListener("click", (e) => {
    const p = e.target.closest("button")?.dataset.p;
    if (!p) return;
    for (const b of pick.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.p === p));
    drawLoop(p);
  });
  drawLoop("Mars");
}

// ---------- eight loops of Mars, 2003 to 2018 ----------
{
  const list = C.retrogrades("Mars", new Date(Date.UTC(2003, 0, 1)), new Date(Date.UTC(2018, 11, 31)));
  const W = 720, H = 300, cols = 4, cw = W / cols, ch = H / 2, k = 7; // px per degree, the same for all
  let s = "";
  list.forEach((sp, i) => {
    const ox = (i % cols) * cw, oy = Math.floor(i / cols) * ch;
    const pad = sp.days * 0.45, a = sp.start.getTime() - pad * DAY, b = sp.end.getTime() + pad * DAY;
    const pts = [];
    for (let j = 0; j <= 160; j++) {
      const t = new Date(a + (b - a) * j / 160);
      pts.push([C.longitudeOfDate("Mars", t), C.planetFromEarth("Mars", t).lat]);
    }
    const midLon = sp.startLon - sp.arc / 2;
    const lats = pts.map((q) => q[1]), midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const X = (lon) => ox + cw / 2 - wrap(lon - midLon) * k, Y = (lat) => oy + ch / 2 - 6 - (lat - midLat) * k;
    s += `<path class="line" d="${pts.map(([lo, la], j) => `${j ? "L" : "M"}${X(lo).toFixed(1)},${Y(la).toFixed(1)}`).join("")}"/>`;
    for (const [lo, la] of [[sp.startLon, null], [sp.endLon, null]]) {
      const t = lo === sp.startLon ? sp.start : sp.end;
      s += `<circle class="dot" cx="${X(lo).toFixed(1)}" cy="${Y(C.planetFromEarth("Mars", t).lat).toFixed(1)}" r="3"/>`;
    }
    s += `<text x="${(ox + cw / 2).toFixed(1)}" y="${(oy + ch - 26).toFixed(1)}" text-anchor="middle">${sp.start.getUTCFullYear()}${sp.end.getUTCFullYear() !== sp.start.getUTCFullYear() ? `–${String(sp.end.getUTCFullYear()).slice(2)}` : ""}</text>`;
    s += `<text class="tag" x="${(ox + cw / 2).toFixed(1)}" y="${(oy + ch - 10).toFixed(1)}" text-anchor="middle">${f(sp.arc)}° · ${Math.round(sp.days)} days</text>`;
  });
  $("mars-loops").innerHTML = s;
  $("mars-loops-cap").textContent = `Mars’s ${list.length} retrograde spells from 2003 to 2018, each centred on its own patch of sky with east on the left, all at ${k} pixels to the degree in both directions; red dots are the stations. Under each: the arc it runs back and the days it takes.`;
}

// ---------- 2000 to 2050 ----------
{
  const PUB = { Mercury: "22", Venus: "41", Mars: "72", Jupiter: "121", Saturn: "138" };
  const a = new Date(Date.UTC(2000, 0, 1)), b = new Date(Date.UTC(2050, 0, 1)), span = (b - a) / DAY;
  $("stats").innerHTML = P.map((p) => {
    const r = C.retrogrades(p, a, b).filter((x) => x.start >= a && x.end <= b);
    const d = r.map((x) => x.days), arc = r.map((x) => x.arc), mean = d.reduce((u, v) => u + v, 0) / d.length;
    const share = d.reduce((u, v) => u + v, 0) / span;
    return `<tr><td>${p}</td><td class="r num">${r.length}</td><td class="r num">${f(mean)}</td><td class="r num">${f(Math.min(...d))}–${f(Math.max(...d))}</td><td class="r num">${f(Math.min(...arc))}–${f(Math.max(...arc))}</td><td class="r num">${Math.round(share * 100)}%</td><td class="r num">${PUB[p]}</td></tr>`;
  }).join("");
}
