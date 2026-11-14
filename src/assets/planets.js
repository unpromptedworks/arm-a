import * as C from "./cycles.js";

const $ = (id) => document.getElementById(id);
const DAY = 86400000, YEAR = 365.2422;
const now = new Date();
const RAD = Math.PI / 180;
const f = (v, d = 2) => v.toLocaleString("en", { minimumFractionDigits: d, maximumFractionDigits: d });
const P = C.NAKED_EYE;

// ---------- the periods ----------
{
  const E = C.siderealPeriod("Earth");
  $("periods").innerHTML = P.map((p) => {
    const T = C.siderealPeriod(p), S = C.synodicPeriod(p);
    const formula = C.INFERIOR(p) ? `1 / (1/${f(T)} − 1/${f(E)})` : `1 / (1/${f(E)} − 1/${f(T)})`;
    return `<tr><td>${p}</td><td class="r num">${f(T)}</td><td>${formula}</td><td class="r num">${f(S)}</td><td class="r num">${f(S / YEAR, 3)}</td></tr>`;
  }).join("");
  $("earth-year").textContent = f(E);
}

// ---------- tonight ----------
const ahead = new Date(now.getTime() + 2 * 400 * DAY);
const events = Object.fromEntries(P.map((p) => [p, C.planetEvents(p, now, ahead)]));
{
  const where = (g) => g.elong < 12 ? "lost in the Sun" : g.east ? "evening" : "morning";
  $("tonight").innerHTML = P.map((p) => {
    const g = C.planetFromEarth(p, now), next = events[p][0];
    return `<tr><td>${p}</td><td class="r num">${g.elong.toFixed(0)}°</td><td>${where(g)}</td><td class="r num">${f(g.dist)}</td><td>${next ? `${next.kind}, ${C.fmtDate(next.date)}` : "—"}</td></tr>`;
  }).join("");
  drawPlan();
}

function drawPlan() {
  const W = 720, H = 400, cx = W / 2, cy = H / 2, s = 105; // px per au for the inner planets
  const jd = C.toJD(now);
  let out = "";
  for (const p of ["Mercury", "Venus", "Earth", "Mars"]) {
    let path = "";
    for (let i = 0; i <= 120; i++) {
      const h = C.heliocentric(p, jd + i / 120 * C.siderealPeriod(p));
      path += `${i ? "L" : "M"}${(cx + h.x * s).toFixed(1)},${(cy - h.y * s).toFixed(1)}`;
    }
    out += `<path class="ring" d="${path}"/>`;
  }
  out += `<circle class="dot" cx="${cx}" cy="${cy}" r="7"/><text x="${cx + 10}" y="${cy - 8}">Sun</text>`;
  const G = C.heliocentric("Earth", jd), gx = cx + G.x * s, gy = cy - G.y * s;
  for (const p of P) {
    const g = C.planetFromEarth(p, now), h = C.heliocentric(p, jd);
    let x = cx + h.x * s, y = cy - h.y * s, label = p;
    if (!["Mercury", "Venus", "Mars"].includes(p)) {
      // Outer planets off the chart: an arrow from the Earth along the line of sight.
      const k = 1.75 / Math.hypot(g.x, g.y);
      x = gx + g.x * k * s; y = gy - g.y * k * s;
      label = `to ${p}`;
      out += `<line class="line ref" x1="${gx.toFixed(1)}" y1="${gy.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
      out += `<text x="${(x + (x > gx ? 6 : -6)).toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${x > gx ? "start" : "end"}">${label}</text>`;
      continue;
    }
    out += `<line class="line ref" x1="${gx.toFixed(1)}" y1="${gy.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
    out += `<circle class="dot ink" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5"/><text x="${(x + 8).toFixed(1)}" y="${(y + 4).toFixed(1)}">${label}</text>`;
  }
  out += `<circle class="dot open hit" cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" r="5.5"/><text class="tag" x="${(gx + (gx - cx) / Math.hypot(gx - cx, gy - cy) * 22).toFixed(1)}" y="${(gy + (gy - cy) / Math.hypot(gx - cx, gy - cy) * 22 + 4).toFixed(1)}" text-anchor="middle">earth</text>`;
  out += `<text x="${W - 8}" y="${H - 10}" text-anchor="end">March equinox direction →</text>`;
  $("plan").innerHTML = out;
  $("plan-cap").textContent = `The inner planets on their orbits on ${C.fmtDate(now)}, seen from above the north pole of the ecliptic, to scale; dashed lines run from the Earth to each planet. Jupiter and Saturn are far off the page; their lines show only the direction to look.`;
}

// ---------- the coming events ----------
{
  const rows = [];
  for (const p of P) for (const e of events[p]) rows.push([p, e]);
  rows.sort((a, b) => a[1].date - b[1].date);
  $("events").innerHTML = rows.filter(([, e]) => e.date - now < 400 * DAY).map(([p, e]) =>
    `<tr><td>${C.fmtDate(e.date)}</td><td>${p}</td><td>${e.kind}</td><td class="r num">${e.kind.startsWith("greatest") ? `${e.elong.toFixed(1)}°` : `${f(e.dist)} au`}</td></tr>`).join("");
}

// ---------- Venus: the eight years ----------
{
  // The last inferior conjunction before today starts the eight years.
  const back = C.planetEvents("Venus", new Date(now.getTime() - 600 * DAY), now).filter((e) => e.kind === "inferior conjunction").at(-1);
  const end = new Date(back.date.getTime() + 8 * YEAR * DAY + 10 * DAY);
  const ics = [back, ...C.planetEvents("Venus", new Date(back.date.getTime() + DAY), end).filter((e) => e.kind === "inferior conjunction")];
  const W = 720, H = 360, r = 150;
  let s = "";
  // Left: Venus as seen from the Earth over eight years, the Earth at the centre.
  const lx = 180, ly = 180, ks = r / 1.75;
  let path = "";
  for (let t = back.date.getTime(), i = 0; t <= back.date.getTime() + 8 * YEAR * DAY; t += 2 * DAY, i++) {
    const g = C.planetFromEarth("Venus", new Date(t));
    path += `${i ? "L" : "M"}${(lx + g.x * ks).toFixed(1)},${(ly - g.y * ks).toFixed(1)}`;
  }
  s += `<path class="line thin" d="${path}"/>`;
  s += `<circle class="dot open hit" cx="${lx}" cy="${ly}" r="4"/><text class="tag" x="${lx}" y="${ly + 18}" text-anchor="middle">earth</text>`;
  ics.slice(0, 5).forEach((e) => s += `<circle class="dot" cx="${(lx + e.x * ks).toFixed(1)}" cy="${(ly - e.y * ks).toFixed(1)}" r="3.5"/>`);
  // Right: the direction from the Sun of each inferior conjunction, joined in order.
  const rx = 540, ry = 180;
  s += `<circle class="ring" cx="${rx}" cy="${ry}" r="${r * 0.8}"/>`;
  const pts = ics.slice(0, 6).map((e) => [rx + Math.cos(e.helioLon * RAD) * r * 0.8, ry - Math.sin(e.helioLon * RAD) * r * 0.8]);
  s += `<path class="line" d="${pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("")}"/>`;
  pts.slice(0, 5).forEach(([x, y], i) => {
    const e = ics[i], lab = `${e.date.getFullYear()}`;
    const ox = (x - rx) * 0.16, oy = (y - ry) * 0.16;
    s += `<circle class="dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4"/><text x="${(x + ox).toFixed(1)}" y="${(y + oy + 4).toFixed(1)}" text-anchor="middle">${lab}</text>`;
  });
  s += `<circle class="dot ink" cx="${rx}" cy="${ry}" r="4"/><text x="${rx}" y="${ry + 18}" text-anchor="middle">Sun</text>`;
  $("pentagram").innerHTML = s;
  $("pentagram-cap").textContent = `Left: Venus’s path around the Earth for the eight years from its inferior conjunction of ${C.fmtDate(back.date)}, computed every two days; the red dots are the five inferior conjunctions, where it swings closest. Right: the direction of each of those conjunctions from the Sun, joined in order of time; the sixth, ${C.fmtDate(ics[5]?.date ?? end)}, falls just short of the first.`;

  const rows = ics.slice(0, 6).map((e, i) => {
    const shift = i ? ((e.helioLon - ics[i - 1].helioLon + 540) % 360 - 180) : null;
    return `<tr${i === 5 ? ' class="hit"' : ""}><td>${C.fmtDate(e.date)}</td><td class="r num">${e.helioLon.toFixed(1)}°</td><td class="r num">${shift === null ? "" : `${shift > 0 ? "+" : "−"}${Math.abs(shift).toFixed(1)}°`}</td><td class="r num">${i ? Math.round((e.date - ics[i - 1].date) / DAY) : ""}</td><td class="r num">${f(e.dist, 3)}</td></tr>`;
  });
  $("venus").innerHTML = rows.join("");
  const S = C.synodicPeriod("Venus"), T = C.siderealPeriod("Venus");
  $("venus-8").textContent = `${f(5 * S, 1)} days`;
  $("venus-yr").textContent = `${f(8 * YEAR, 1)} days`;
  $("venus-off").textContent = f(8 * YEAR - 5 * S, 1);
  $("venus-13").textContent = f(13 * T, 1);
  if (ics[5]) $("venus-drift").textContent = f(Math.abs((ics[5].helioLon - ics[0].helioLon + 540) % 360 - 180), 1);
}

// ---------- Mars: the oppositions ----------
{
  const opp = C.planetEvents("Mars", new Date(Date.UTC(1990, 0, 1)), new Date(Date.UTC(2050, 11, 31))).filter((e) => e.kind === "opposition");
  const W = 720, H = 280, L = 48, R = 12, T = 18, B = 34;
  const y0 = 0.3, y1 = 0.75; // nearest at the top
  const X = (d) => L + (d.getUTCFullYear() + d.getUTCMonth() / 12 - 1990) / 61 * (W - L - R);
  const Y = (v) => T + (v - y0) / (y1 - y0) * (H - T - B);
  let s = "";
  for (const v of [0.4, 0.5, 0.6, 0.7]) s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end">${v.toFixed(1)}</text>`;
  for (let yr = 1990; yr <= 2050; yr += 10) s += `<text x="${X(new Date(Date.UTC(yr, 0, 1)))}" y="${H - 12}" text-anchor="middle">${yr}</text>`;
  s += `<line class="axis" x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/>`;
  for (const e of opp) {
    const x = X(e.date), close = e.dist < 0.4;
    s += `<rect class="bar${close ? " hit" : ""}" x="${(x - 3).toFixed(1)}" y="${Y(e.dist).toFixed(1)}" width="6" height="${(H - B - Y(e.dist)).toFixed(1)}"><title>${C.fmtDate(e.date)}: ${f(e.dist, 3)} au</title></rect>`;
    if (close) s += `<text class="tag" x="${x.toFixed(1)}" y="${(Y(e.dist) - 6).toFixed(1)}" text-anchor="middle">${e.date.getUTCFullYear()}</text>`;
  }
  const tx = X(now);
  s += `<line class="today" x1="${tx}" x2="${tx}" y1="${T}" y2="${H - B}"/>`;
  $("mars").innerHTML = s;
  const close = opp.filter((e) => e.dist < 0.4).map((e) => e.date.getUTCFullYear());
  const gaps = close.slice(1).map((y, i) => y - close[i]);
  $("mars-cap").textContent = `The Earth–Mars distance at each opposition, 1990–2050, in astronomical units, on a scale that runs from 0.75 at the foot to 0.3 at the top, so that a taller bar is a nearer Mars. Red: within 0.4 au, the perihelic oppositions of ${close.join(", ")}, ${gaps.join(" and ")} years apart. The red line is today.`;
  const next = opp.filter((e) => e.date > now).slice(0, 6);
  $("mars-next").innerHTML = next.map((e, i) => {
    const prev = i ? next[i - 1] : opp[opp.indexOf(e) - 1];
    return `<tr${e.dist < 0.4 ? ' class="hit"' : ""}><td>${C.fmtDate(e.date)}</td><td class="r num">${Math.round((e.date - prev.date) / DAY)}</td><td class="r num">${f(e.dist, 3)}</td><td class="r num">${f(e.dist * 149.5978707, 1)}</td></tr>`;
  }).join("");
  const S = C.synodicPeriod("Mars");
  $("mars-79").textContent = `${f(37 * S, 0)} days`;
  $("mars-79y").textContent = `${f(79 * YEAR, 0)} days`;
}

// ---------- the returns ----------
{
  // For each planet, the whole numbers of years up to 100 that come
  // nearer than any shorter span to a whole number of synodic periods.
  $("returns").innerHTML = P.map((p) => {
    const S = C.synodicPeriod(p);
    let best = Infinity;
    const found = [];
    for (let y = 1; y <= 100; y++) {
      const n = Math.round(y * YEAR / S), off = y * YEAR - n * S;
      if (n > 0 && Math.abs(off) < best) { best = Math.abs(off); found.push([y, n, off]); }
    }
    return found.filter(([, , off]) => Math.abs(off) < 12).slice(-3).map(([y, n, off]) =>
      `<tr><td>${p}</td><td class="r num">${y}</td><td class="r num">${n}</td><td class="r num">${off > 0 ? "+" : "−"}${f(Math.abs(off), 1)}</td></tr>`).join("");
  }).join("");
}
