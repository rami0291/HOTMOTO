// Generates two of the site's background drawings (site/brand/drawings/): map.svg, a survey map
// (contours, rivers that run down the same height field's valleys, roads and a railway, the grid with its
// coordinates, spot heights, a scale bar), and engine.svg, a parallel twin's exploded view with its parts
// list. The third, moto.svg (the motorcycle's side elevation), is drawn by hand, not here. Each drawing is
// one ink with a few opacities: the web uses them as masks over a light grey (components/ui/Graphic.tsx
// Drawing), so the theme picks the colour. The figures in the drawings are measured from the drawings
// themselves. The same seeds give the same drawings.
//
// Usage: node scripts/drawings.ts
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const OUT = path.join(import.meta.dirname, "../site/brand/drawings");
const n = (v: number) => +v.toFixed(1);
const MONO = `font-family="ui-monospace, Menlo, Consolas, monospace"`;

type Pt = [number, number];
const line = (pts: Pt[]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${n(x)} ${n(y)}`).join("");

/** xorshift32: the same seed, the same sequence. */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

/** Bank lines either side of a path, `width(i)` apart. */
function banks(pts: Pt[], width: (i: number) => number): [Pt[], Pt[]] {
  const left: Pt[] = [];
  const right: Pt[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)]!;
    const b = pts[Math.min(pts.length - 1, i + 1)]!;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const w = width(i) / 2;
    left.push([p[0] - (dy / len) * w, p[1] + (dx / len) * w]);
    right.push([p[0] + (dy / len) * w, p[1] - (dx / len) * w]);
  });
  return [left, right];
}

// ---------------------------------------------------------------------------------------------------
// The survey map
// ---------------------------------------------------------------------------------------------------

function map(): string {
  const W = 1600;
  const H = 1000;
  const r = rng(29);
  const hills = Array.from({ length: 11 }, () => ({ x: r() * W, y: r() * H, s: (0.1 + r() * 0.22) * W, a: (r() < 0.3 ? -1 : 1) * (0.5 + r()) }));
  const f = (x: number, y: number) => {
    let v = 0;
    for (const b of hills) v += b.a * Math.exp(-((x - b.x) ** 2 + (y - b.y) ** 2) / (b.s * b.s));
    return v + 0.06 * Math.sin(x / 41 + y / 57) + 0.035 * Math.sin(x / 17 - y / 23);
  };

  // Contours by marching squares; every fifth is an index contour.
  const cell = 8;
  const cols = Math.ceil(W / cell) + 1;
  const rows = Math.ceil(H / cell) + 1;
  const g: number[][] = [];
  let lo = Infinity;
  let hi = -Infinity;
  for (let j = 0; j < rows; j++) {
    g[j] = [];
    for (let i = 0; i < cols; i++) {
      const v = f(i * cell, j * cell);
      g[j]![i] = v;
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
  }
  const LEVELS = 24;
  const out: string[] = [];
  for (let k = 1; k <= LEVELS; k++) {
    const L = lo + ((hi - lo) * k) / (LEVELS + 1);
    let d = "";
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const a = g[j]![i]!, b = g[j]![i + 1]!, c = g[j + 1]![i + 1]!, e = g[j + 1]![i]!;
        const p: number[] = [];
        if (a < L !== b < L) p.push((i + (L - a) / (b - a)) * cell, j * cell);
        if (b < L !== c < L) p.push((i + 1) * cell, (j + (L - b) / (c - b)) * cell);
        if (e < L !== c < L) p.push((i + (L - e) / (c - e)) * cell, (j + 1) * cell);
        if (a < L !== e < L) p.push(i * cell, (j + (L - a) / (e - a)) * cell);
        for (let q = 0; q + 3 < p.length; q += 4) d += `M${n(p[q]!)} ${n(p[q + 1]!)}L${n(p[q + 2]!)} ${n(p[q + 3]!)}`;
      }
    }
    const index = k % 5 === 0;
    out.push(`<path d="${d}" fill="none" stroke="#000" stroke-width="${index ? 1.4 : 0.8}" opacity="${index ? 0.75 : 0.4}"/>`);
  }

  // Rivers: from high ground, follow the slope down with a little momentum until the water leaves the
  // sheet or settles in a hollow (a lake).
  const metres = (v: number) => Math.round(80 + ((v - lo) / (hi - lo)) * 1820);
  const sample = Array.from({ length: 400 }, () => [r() * W, r() * H] as Pt).sort((p, q) => f(q[0], q[1]) - f(p[0], p[1]));
  const sources: Pt[] = [];
  for (const p of sample) {
    if (sources.length >= 6) break;
    if (sources.every((s) => Math.hypot(s[0] - p[0], s[1] - p[1]) > 220)) sources.push(p);
  }
  for (const [sx, sy] of sources) {
    let x = sx;
    let y = sy;
    let vx = 0;
    let vy = 0;
    const pts: Pt[] = [[x, y]];
    let lake: Pt | null = null;
    for (let step = 0; step < 900; step++) {
      const e = 2;
      const gx = (f(x + e, y) - f(x - e, y)) / (2 * e);
      const gy = (f(x, y + e) - f(x, y - e)) / (2 * e);
      const gl = Math.hypot(gx, gy) || 1e-9;
      vx = vx * 0.86 - (gx / gl) * 0.14 + (r() - 0.5) * 0.09;
      vy = vy * 0.86 - (gy / gl) * 0.14 + (r() - 0.5) * 0.09;
      const v = Math.hypot(vx, vy) || 1;
      x += (vx / v) * 5;
      y += (vy / v) * 5;
      pts.push([x, y]);
      if (x < -20 || y < -20 || x > W + 20 || y > H + 20) break;
      if (step > 40) {
        const back = pts[pts.length - 40]!;
        if (Math.hypot(back[0] - x, back[1] - y) < 30) {
          lake = [x, y];
          break;
        }
      }
    }
    if (pts.length < 30) continue;
    const thin = pts.filter((_, i) => i % 2 === 0);
    const [left, right] = banks(thin, (i) => 1.5 + (i / thin.length) * 5);
    out.push(`<path d="${line(left)}${line(right)}" fill="none" stroke="#000" stroke-width="1.1" opacity="0.95"/>`);
    if (lake) out.push(`<ellipse cx="${n(lake[0])}" cy="${n(lake[1])}" rx="26" ry="15" fill="none" stroke="#000" stroke-width="1.1"/><path d="M${n(lake[0] - 16)} ${n(lake[1] - 3)}h32M${n(lake[0] - 12)} ${n(lake[1] + 4)}h24" stroke="#000" stroke-width="0.8" opacity="0.7"/>`);
  }

  // Two roads (double lines) and a railway (a line with sleepers), each a gentle curve across the sheet.
  const curve = (a: Pt, b: Pt, c: Pt, d: Pt): Pt[] =>
    Array.from({ length: 120 }, (_, i) => {
      const t = i / 119;
      const u = 1 - t;
      return [u ** 3 * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t ** 3 * d[0], u ** 3 * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t ** 3 * d[1]];
    });
  for (const road of [curve([-20, 640], [420, 520], [760, 900], [1620, 700]), curve([980, -20], [900, 320], [1260, 540], [1180, 1020])]) {
    const [left, right] = banks(road, () => 6);
    out.push(`<path d="${line(left)}${line(right)}" fill="none" stroke="#000" stroke-width="0.9" opacity="0.85"/>`);
  }
  const rail = curve([-20, 180], [500, 260], [1000, 80], [1620, 240]);
  out.push(`<path d="${line(rail)}" fill="none" stroke="#000" stroke-width="1.3" opacity="0.85"/>`);
  let ties = "";
  rail.forEach((p, i) => {
    if (i % 3) return;
    const q = rail[Math.min(rail.length - 1, i + 1)]!;
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const len = Math.hypot(dx, dy) || 1;
    ties += `M${n(p[0] - (dy / len) * 5)} ${n(p[1] + (dx / len) * 5)}L${n(p[0] + (dy / len) * 5)} ${n(p[1] - (dx / len) * 5)}`;
  });
  out.push(`<path d="${ties}" stroke="#000" stroke-width="1" opacity="0.85"/>`);

  // The grid: one minute of arc every 160 units, crosses on the intersections, coordinates on two edges.
  let grid = "";
  let crosses = "";
  const labels: string[] = [];
  for (let x = 160, i = 1; x < W; x += 160, i++) {
    grid += `M${x} 0V${H}`;
    labels.push(`<text x="${x + 4}" y="14">139°${String(30 + i).padStart(2, "0")}'E</text>`);
  }
  for (let y = 160, j = 1; y < H; y += 160, j++) {
    grid += `M0 ${y}H${W}`;
    labels.push(`<text x="4" y="${y - 4}">35°${String(48 - j).padStart(2, "0")}'N</text>`);
  }
  for (let x = 160; x < W; x += 160) for (let y = 160; y < H; y += 160) crosses += `M${x - 6} ${y}h12M${x} ${y - 6}v12`;
  out.push(`<path d="${grid}" stroke="#000" stroke-width="0.6" stroke-dasharray="2 6" opacity="0.6"/>`);
  out.push(`<path d="${crosses}" stroke="#000" stroke-width="1.2"/>`);

  // Spot heights on the summits.
  const peaks: Array<Pt & { v?: number }> = [];
  for (let y = 40; y < H - 40; y += 20) {
    for (let x = 40; x < W - 40; x += 20) {
      const v = f(x, y);
      if ([[-20, 0], [20, 0], [0, -20], [0, 20], [-20, -20], [20, 20], [-20, 20], [20, -20]].every(([dx, dy]) => f(x + dx!, y + dy!) < v)) peaks.push([x, y]);
    }
  }
  peaks
    .sort((p, q) => f(q[0], q[1]) - f(p[0], p[1]))
    .slice(0, 8)
    .forEach(([x, y]) => {
      out.push(`<path d="M${x} ${y - 6}L${x + 6} ${y + 5}H${x - 6}Z" fill="#000"/>`);
      labels.push(`<text x="${x + 9}" y="${y + 4}">${metres(f(x, y)).toLocaleString("en-US")}</text>`);
    });

  // Scale bar (500 m to 160 units: the grid's minute of latitude is about 1.85 km, drawn here at a third)
  // and a north arrow.
  out.push(`<path d="M40 ${H - 40}h320M40 ${H - 48}v16M200 ${H - 46}v12M360 ${H - 48}v16" stroke="#000" stroke-width="1.2"/><path d="M40 ${H - 40}h160" stroke="#000" stroke-width="5"/>`);
  labels.push(`<text x="40" y="${H - 54}">0</text><text x="190" y="${H - 54}">250</text><text x="340" y="${H - 54}">500 M</text>`);
  out.push(`<path d="M${W - 60} ${H - 110}l14 46l-14 -12l-14 12Z" fill="#000"/><circle cx="${W - 60}" cy="${H - 82}" r="30" fill="none" stroke="#000" stroke-width="1"/>`);
  labels.push(`<text x="${W - 64}" y="${H - 120}">N</text><text x="${W - 230}" y="${H - 30}">SHEET 35-139 · CONTOUR 76 M · JGD2011</text>`);

  return svg(W, H, out.join("") + `<g ${MONO} font-size="11" fill="#000">${labels.join("")}</g>`);
}

// ---------------------------------------------------------------------------------------------------
// The engine: a parallel twin, exploded along its cylinder axes (front view, 2:1)
// ---------------------------------------------------------------------------------------------------

function engine(): string {
  const W = 940;
  const H = 1340;
  const CY = [330, 530]; // cylinder axes, bore 80 at 2:1
  const BORE = 160;
  const out: string[] = [];
  const thin = `fill="none" stroke="#000" stroke-width="1.6"`;
  const bold = `fill="none" stroke="#000" stroke-width="3"`;
  const hidden = `fill="none" stroke="#000" stroke-width="1.4" stroke-dasharray="10 6" opacity="0.7"`;
  const centre = `fill="none" stroke="#000" stroke-width="1.2" stroke-dasharray="28 6 4 6" opacity="0.7"`;
  const labels: string[] = [];
  const parts: Array<{ y: number; x: number; name: string }> = [];

  for (const c of CY) out.push(`<path d="M${c} 40V1300" ${centre}/>`);

  // 01 Cam cover.
  out.push(`<rect x="200" y="70" width="460" height="54" ${bold}/><path d="M200 97H660" ${thin}/>`);
  for (const x of [222, 330, 430, 530, 638]) out.push(`<circle cx="${x}" cy="84" r="6" ${thin}/>`);
  parts.push({ y: 97, x: 660, name: "CAM COVER" });

  // 02 Camshafts with their lobes and the cam sprocket.
  for (const y of [170, 214]) {
    out.push(`<path d="M190 ${y - 7}H690M190 ${y + 7}H690" ${thin}/>`);
    for (const c of CY) for (const dx of [-36, 36]) out.push(`<ellipse cx="${c + dx}" cy="${y}" rx="13" ry="22" ${thin}/>`);
  }
  out.push(`<circle cx="720" cy="192" r="38" ${thin}/><circle cx="720" cy="192" r="10" ${thin}/>`);
  parts.push({ y: 192, x: 758, name: "CAMSHAFT ×2" });

  // 03 Cylinder head: chambers, valves and springs, plugs.
  out.push(`<rect x="190" y="270" width="480" height="110" ${bold}/>`);
  for (const c of CY) {
    out.push(`<path d="M${c - 70} 380A70 40 0 0 1 ${c + 70} 380" ${thin}/><rect x="${c - 8}" y="252" width="16" height="40" ${thin}/>`);
    for (const dx of [-36, 36]) {
      let spring = `M${c + dx - 12} 286`;
      for (let i = 1; i <= 6; i++) spring += `L${c + dx + (i % 2 ? 12 : -12)} ${286 + i * 8}`;
      out.push(`<path d="M${c + dx} 280V368M${c + dx - 14} 372H${c + dx + 14}" ${thin}/><path d="${spring}" ${thin}/>`);
    }
  }
  parts.push({ y: 325, x: 670, name: "CYLINDER HEAD" });

  // 04 Head gasket.
  out.push(`<rect x="196" y="428" width="468" height="12" ${thin}/>`);
  for (const c of CY) out.push(`<ellipse cx="${c}" cy="434" rx="${BORE / 2 + 2}" ry="5" ${thin}/>`);
  parts.push({ y: 434, x: 664, name: "HEAD GASKET" });

  // 05 Cylinder block: fins, hidden bores.
  out.push(`<rect x="200" y="490" width="460" height="170" ${bold}/>`);
  let fins = "";
  for (let y = 506; y < 660; y += 14) fins += `M200 ${y}H190M660 ${y}H670`;
  out.push(`<path d="${fins}" ${thin}/>`);
  for (const c of CY) out.push(`<path d="M${c - BORE / 2} 490V660M${c + BORE / 2} 490V660" ${hidden}/>`);
  parts.push({ y: 575, x: 670, name: "CYLINDER BLOCK" });

  // 06 Pistons: crown, ring grooves, pin boss.
  for (const c of CY) {
    out.push(`<path d="M${c - 78} 820V728Q${c} 710 ${c + 78} 728V820Z" ${bold}/><path d="M${c - 78} 742H${c + 78}M${c - 78} 752H${c + 78}M${c - 78} 762H${c + 78}" ${thin}/><circle cx="${c}" cy="792" r="18" ${thin}/>`);
  }
  parts.push({ y: 770, x: 608, name: "PISTON ×2" });

  // 07 Connecting rods.
  for (const c of CY) {
    out.push(`<circle cx="${c}" cy="880" r="24" ${thin}/><circle cx="${c}" cy="880" r="12" ${thin}/><circle cx="${c}" cy="1010" r="48" ${bold}/><circle cx="${c}" cy="1010" r="28" ${thin}/><path d="M${c - 14} 902L${c - 26} 966M${c + 14} 902L${c + 26} 966M${c - 48} 1010H${c + 48}" ${thin}/>`);
  }
  parts.push({ y: 1010, x: 578, name: "CON ROD ×2" });

  // 08 Crankshaft: 180° crank, webs and counterweights, main journals.
  const MAIN = 1120;
  const THROW = 68; // stroke 68 at 2:1 → half-stroke of 34
  out.push(`<path d="M150 ${MAIN - 13}H720M150 ${MAIN + 13}H720" ${bold}/>`);
  CY.forEach((c, i) => {
    const pin = MAIN + (i ? THROW : -THROW);
    out.push(`<rect x="${c - 18}" y="${Math.min(pin, MAIN) - 14}" width="36" height="${THROW + 28}" ${thin}/>`);
    for (const dx of [-44, 26]) out.push(`<rect x="${c + dx}" y="${MAIN - 70}" width="18" height="140" ${bold}/>`);
    out.push(`<path d="M${c - 60} ${MAIN + (i ? -40 : 40)}A60 50 0 0 ${i ? 1 : 0} ${c + 60} ${MAIN + (i ? -40 : 40)}" ${thin}/>`);
  });
  out.push(`<circle cx="740" cy="${MAIN}" r="30" ${thin}/>`);
  parts.push({ y: MAIN, x: 770, name: "CRANKSHAFT" });

  // 09 Crankcase with its bearing saddles.
  out.push(`<path d="M170 1220H230A30 30 0 0 0 290 1220H400A30 30 0 0 0 460 1220H600A30 30 0 0 0 660 1220H700V1300H170Z" ${bold}/>`);
  for (const x of [200, 350, 520, 680]) out.push(`<circle cx="${x}" cy="1276" r="7" ${thin}/>`);
  parts.push({ y: 1260, x: 700, name: "CRANKCASE" });

  // Explosion arrows between the parts.
  for (const c of CY) for (const y of [146, 250, 412, 470, 690, 850, 1060, 1190]) out.push(`<path d="M${c - 6} ${y - 10}L${c} ${y}L${c + 6} ${y - 10}" ${thin}/>`);

  // Callouts: numbered boxes on the right with leaders to their parts.
  parts.forEach((p, i) => {
    const y = 80 + i * 140;
    out.push(`<path d="M${p.x + 4} ${p.y}L760 ${y + 14}H786" ${thin}/><circle cx="${p.x + 4}" cy="${p.y}" r="4" fill="#000"/><rect x="786" y="${y}" width="28" height="28" ${thin}/>`);
    labels.push(`<text x="800" y="${y + 19}" text-anchor="middle" font-size="14">${String(i + 1).padStart(2, "0")}</text><text x="822" y="${y + 19}" font-size="11">${p.name}</text>`);
  });

  // The engine's figures, from the drawing: bore 80 and stroke 68 give 683 cc for two cylinders.
  const cc = Math.round(2 * Math.PI * (8 / 2) ** 2 * 6.8);
  labels.push(`<text x="40" y="30" font-size="14">FIG. E-02  PARALLEL TWIN · EXPLODED VIEW · 2:1</text>`);
  labels.push(`<text x="40" y="1328" font-size="13">BORE 80 × STROKE 68 · 180° CRANK · ${cc} CC</text>`);

  return svg(W, H, out.join("") + `<g ${MONO} fill="#000">${labels.join("")}</g>`);
}

function svg(w: number, h: number, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>\n`;
}

mkdirSync(OUT, { recursive: true });
for (const [name, draw] of [["map", map], ["engine", engine]] as const) {
  const file = path.join(OUT, `${name}.svg`);
  const text = draw();
  writeFileSync(file, text);
  console.log(`${path.relative(process.cwd(), file)}  ${(text.length / 1024).toFixed(0)} KB`);
}
