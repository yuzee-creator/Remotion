export const meta = {
  id: "educational-motion",
  title: "Educational Motion",
  durationInFrames: 900,
  fps: 30,
  width: 720,
  height: 1280,
};
/**
 * ============ STYLE KIT: KARTUN POP (9:16, 720x1280, 30fps) ============
 * ATURAN GAYA (dipakai ulang tiap video baru, ganti STORY aja):
 * 1. Semua gerak dihitung dari t = frame/fps. Nol CSS transition.
 * 2. Easing: eo (quart out) = masuk, eio (smootherstep) = kamera/transisi,
 *    bk (spring overshoot) = pop-in.
 * 3. Objek masuk = pop overshoot + jiggle teredam exp(-9d)*sin(24d),
 *    squash&stretch SELALU berlawanan arah (X lebar -> Y pendek).
 * 4. Tiap impact = puff partikel + number kick di kartu + pulse layar ~1%.
 * 5. Kamera zoom-out eksponensial, fokus ke puncak objek hero.
 * 6. Teks: Poppins 700 40px, kata muncul stagger 0.1s, blur 12->0,
 *    geser y 16->0, shadow offset (1,4). 2 warna: gold utk kata kunci, putih sisanya.
 * 7. Palet: navy gelap + coral/pink hero + cream sticker + gold aksen.
 * 8. Karakter: bob idle, kedip tiap 1.7s, kepala miring pelan, pipi blush, ahoge goyang.
 * 9. Detail grafis: highlight tepi atas, garis gelap bawah tiap layer,
 *    3 sisi isometrik, label miring di atas objek.
 * 10. Background: gradient navy + dot grid 60px + glow pink di belakang hero
 *     (makin terang makin tinggi hero).
 * 11. Intro fade dari gelap 0.12s. Durasi aman 5 detik = 150 frame.
 * ======================================================================
 */
import React from "react";
import { AbsoluteFill, Composition, useCurrentFrame, useVideoConfig } from "remotion";

/* ---------- CERITA (ganti bagian ini tiap video baru) ---------- */
const GOLD = "#ffc933";
const WHITE = "#ffffff";
const STORY = {
  handle: "@USERNAMEMU",
  cardHead: "HARI",
  cardSub: "TAHUN 1 M",
  stackLabel: "100.000",
  pill: "BELUM 3 TAHUN",
  titles: [
    { from: 0.35, to: 2.85, parts: [["Rp1 JUTA", GOLD], [" / HARI", WHITE]] as [string, string][] },
    { from: 3.05, to: 99, parts: [["SEJAK ", WHITE], ["TAHUN 1", GOLD]] as [string, string][] },
  ],
};

/* ---------- KONSTANTA GAYA ---------- */
const W = 720, H = 1280, GR = 977;
const FONT = "Poppins, 'Segoe UI', system-ui, sans-serif";
const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700&display=swap');";
const C = {
  bg0: "#141d44", bg1: "#0e1532", dot: "#283462", ground: "#0c1227",
  coral: "#ef4b57", cream: "#f2ebd9", ink: "#141a3a", pink: "#f68ca4", lav: "#9a8ffc",
};

/* ---------- TIMELINE (detik) ---------- */
const BH = 17.8;
const BT = [0, 0.38, 0.62, 0.86, 1.1]; // mulai jatuh
const LD = [0.32, 0.6, 0.84, 1.08, 1.35]; // mendarat
const P0 = 1.35, P1 = 3.85, TP = 3.9, PT = 2.6;

/* ---------- MATH & EASING ---------- */
const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const eo = (t: number) => 1 - Math.pow(1 - cl(t), 4);
const eio = (t: number) => { t = cl(t); return t * t * t * (t * (t * 6 - 15) + 10); };
const bk = (t: number) => { t = cl(t, 0, 2); return t <= 0 ? 0 : 1 - Math.exp(-6 * t) * Math.cos(t * 13); };
const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const camS = (t: number) => { const u = cl((t - P0) / (P1 - P0)); return 0.7 * u + 0.3 * (0.5 - 0.5 * Math.cos(Math.PI * u)); };
const cam = (t: number) => { const s = camS(t); return { z: 4.1 * Math.exp(-1.41 * s), Yb: 864 + 96 * s + 266 * (1 - eo((t - 0.1) / 0.85)) }; };
const ph = (t: number) => 120 - 110 * eio((t - 1.8) / 1.8);
const hh = (t: number) => {
  if (t < P0) return BH * LD.filter((l) => t >= l).length;
  const c = cam(t);
  return (864 + 96 * camS(t) - 500) / c.z; // puncak hero selalu nempel di y=500
};
const val = (t: number) => (t < P0 ? Math.max(1, LD.filter((l) => t >= l).length) : Math.floor(5 + 299 * cl((hh(t) - 89) / 371)));

/* ---------- PARTIKEL (puff / ring / confetti) ---------- */
const CONF = [C.coral, GOLD, C.lav, C.pink];
const Particles: React.FC<{
  t: number; at: number; x: number; y: number; kind: "puff" | "ring" | "confetti";
  n?: number; life?: number; spread?: number; color?: string; seed?: number;
}> = ({ t, at, x, y, kind, n = 10, life = 0.7, spread = 15, color = "255,214,228", seed = 0 }) => {
  const d = t - at;
  if (d < 0 || d > life) return null;
  const f = 1 - d / life;
  const out: React.ReactNode[] = [];
  for (let j = 0; j < n; j++) {
    const r = rnd(j + seed * 7.1);
    if (kind === "puff") {
      const m = j - (n - 1) / 2;
      out.push(<circle key={j} cx={x + m * 10 + m * spread * d} cy={y - (35 + 45 * r) * d + 240 * d * d} r={(2.5 + 2.5 * r) * f} fill={`rgba(${color},${0.85 * f})`} />);
    } else if (kind === "ring") {
      const a = (j / n) * 6.283, rad = 22 + 110 * eo(d / life);
      out.push(<circle key={j} cx={x + Math.cos(a) * rad} cy={y + Math.sin(a) * rad * 0.6} r={5 * f} fill={`rgba(${color},${f})`} />);
    } else {
      const ang = (rnd(j + 1) - 0.5) * Math.PI * 1.2 - Math.PI / 2, sp = 250 + 300 * r;
      const px = x + Math.cos(ang) * sp * d, py = y + Math.sin(ang) * sp * d + 500 * d * d;
      out.push(<rect key={j} x={px - 5} y={py - 3} width={10} height={6} fill={CONF[j % 4]} opacity={f} transform={`rotate(${j * 47 + d * 500} ${px} ${py})`} />);
    }
  }
  return <g>{out}</g>;
};

/* ---------- OBJEK KARTUN ---------- */
const Block: React.FC<{ base: number; h: number; xo?: number; yo?: number; label: string }> = ({ base, h, xo = 0, yo = 0, label }) => {
  const x0 = 303 + xo, x1 = 417 + xo, dx = 25, dy = 12, b = base + yo, top = b - h, n = Math.ceil(h / 7);
  const rows: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const yb = b - i * 7, yt = Math.max(top, yb - 7), ev = i % 2 === 0;
    rows.push(
      <g key={i}>
        <rect x={x0} y={yt} width={x1 - x0} height={yb - yt} fill={ev ? "#ee5f79" : "#e9566f"} />
        <polygon points={`${x1},${yt} ${x1 + dx},${yt - dy} ${x1 + dx},${yb - dy} ${x1},${yb}`} fill={ev ? "#b93f59" : "#ae3852"} />
        <rect x={376 + xo} y={yt} width={18} height={yb - yt} fill="#f3e8df" />
        <line x1={x0} y1={yt + 0.3} x2={x1} y2={yt + 0.3} stroke="rgba(255,160,178,.5)" strokeWidth={0.9} />
        <line x1={x0} y1={yb} x2={x1} y2={yb} stroke="rgba(150,38,66,.75)" strokeWidth={1.1} />
        <line x1={376 + xo} y1={yb} x2={394 + xo} y2={yb} stroke="rgba(175,155,145,.8)" strokeWidth={1} />
        <line x1={x1} y1={yb} x2={x1 + dx} y2={yb - dy} stroke="rgba(105,22,48,.6)" strokeWidth={1} />
      </g>
    );
  }
  return (
    <g>
      {rows}
      <rect x={x0} y={top} width={8} height={h} fill="rgba(255,200,215,.15)" />
      <rect x={x1 - 10} y={top} width={10} height={h} fill="rgba(90,20,45,.16)" />
      <line x1={x0} y1={top} x2={x0} y2={b} stroke="rgba(255,170,190,.5)" strokeWidth={1} />
      <polygon points={`${x0},${top} ${x0 + dx},${top - dy} ${x1 + dx},${top - dy} ${x1},${top}`} fill={C.pink} />
      <polygon points={`${376 + xo},${top} ${401 + xo},${top - dy} ${419 + xo},${top - dy} ${394 + xo},${top}`} fill="#f8eee7" />
      {[0, 76].map((o) => (
        <polygon key={o} points={`${x0 + 6 + o},${top - 2} ${x0 + 17 + o},${top - 6} ${x0 + 25 + o},${top - 6} ${x0 + 14 + o},${top - 2}`} fill="none" stroke="rgba(255,196,212,.8)" strokeWidth={0.9} />
      ))}
      {h > 5 && (
        <text transform={`translate(${x0 + 50} ${top - 6}) matrix(1 0 -.8 .55 0 0)`} fontFamily={FONT} fontWeight={700} fontSize={9.5} fill="rgba(178,60,88,.92)" textAnchor="middle" dominantBaseline="central">{label}</text>
      )}
      <line x1={x0} y1={top} x2={x0 + dx} y2={top - dy} stroke="rgba(255,208,220,.7)" strokeWidth={0.9} />
    </g>
  );
};

const Squash: React.FC<{ sx: number; sy: number; px: number; py: number; children: React.ReactNode }> = ({ sx, sy, px, py, children }) => (
  <g transform={`translate(${px} ${py}) scale(${sx} ${sy}) translate(${-px} ${-py})`}>{children}</g>
);

const Hand: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    <rect x={x} y={y - 20} width={70} height={40} rx={14} fill="#fbd6bd" />
    <rect x={x + 6} y={y - 26} width={34} height={14} rx={7} fill="#fbd6bd" />
    {[0, 1, 2].map((k) => <line key={k} x1={x + 6} y1={y - 8 + k * 9} x2={x + 30} y2={y - 8 + k * 9} stroke="rgba(200,150,130,.6)" strokeWidth={1} />)}
    <rect x={x + 70} y={y - 34} width={80} height={68} rx={10} fill="#f0e6d8" />
  </g>
);

const Pedestal: React.FC<{ p: number }> = ({ p }) => {
  const x0 = 277, x1 = 443, top = GR - p, r = p > 14 ? 5 : 2;
  return (
    <g>
      <rect x={x0} y={top} width={x1 - x0} height={p} rx={r} fill="#d5c49c" />
      {p > 34 && (<>
        <rect x={x1 - 40} y={top + 8} width={40} height={p - 8} rx={4} fill="#cdbc94" />
        <rect x={x0} y={GR - 22} width={x1 - x0} height={22} rx={4} fill="#cdbc94" />
        <rect x={x0} y={top + 8} width={18} height={p - 30} fill="#dccba3" />
      </>)}
      <rect x={x0} y={top} width={x1 - x0} height={Math.min(10, p)} rx={3} fill="#e8dbb8" />
      <line x1={x0 + 3} y1={top + Math.min(10, p)} x2={x1 - 3} y2={top + Math.min(10, p)} stroke="#b8a67c" strokeWidth={1} />
    </g>
  );
};

const Underground: React.FC = () => (
  <g>
    <rect x={-2000} y={GR} width={5000} height={3000} fill={C.ground} />
    <rect x={-2000} y={GR} width={5000} height={80} fill="#0e142c" />
    <rect x={-2000} y={GR + 80} width={5000} height={2} fill="#182042" />
    <rect x={-2000} y={GR + 255} width={5000} height={2} fill="#182042" />
    {[[20, 1110], [300, 1110], [580, 1110]].map(([x, y]) => (
      <g key={x}><circle cx={x} cy={y} r={18} fill="#1e2852" /><circle cx={x} cy={y} r={12} fill="#0e142c" /><circle cx={x} cy={y} r={7} fill="#1e2852" /><circle cx={x} cy={y} r={3} fill="#0e142c" /></g>
    ))}
    {[130, 415, 697].map((x) => [1070, 1243].map((y) => (
      <g key={`${x}${y}`}><circle cx={x} cy={y} r={10} fill="#564628" /><circle cx={x} cy={y} r={5} fill="#967828" /></g>
    )))}
    {[[245, 1090, 36, 14], [527, 1090, 36, 14], [115, 1180, 36, 14], [395, 1180, 36, 14], [680, 1180, 36, 14], [175, 1125, 20, 8], [455, 1125, 20, 8], [30, 1190, 20, 8], [320, 1190, 20, 8], [600, 1190, 20, 8]].map(([x, y, rx, ry], i) => (
      <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill="#182046" />
    ))}
  </g>
);

const Character: React.FC<{ t: number; pt: number; cx?: number }> = ({ t, pt, cx = 505 }) => {
  const s = t > pt ? bk((t - pt) / 0.4) : 0;
  if (s < 0.02) return null;
  const bob = Math.sin(t * 6.5) * 1.3;
  const q = 0.12 * Math.exp(-9 * (t - pt)) * Math.sin(24 * (t - pt));
  const sw = Math.sin(t * 5 - 0.9) * 2.5 + q * 30;
  const hx = cx + Math.sin(t * 3.2) * 1.2, hy = 868;
  const lg = Math.sin(t * 6.5 - 1.4) * 3 + q * 40;
  const blink = t % 1.7 < 0.1;
  return (
    <g transform={`translate(${cx} ${GR + bob}) scale(${s * (1 - q)} ${s * (1 + q)}) translate(${-cx} ${-GR})`}>
      <ellipse cx={cx} cy={GR} rx={30} ry={4} fill={C.ground} />
      {[-11, 11].map((l) => (
        <g key={l}>
          <rect x={cx + l - 7} y={950} width={14} height={22} rx={3} fill="#6b74a3" />
          <rect x={cx + l - 11 + (l < 0 ? -2 : 2)} y={967} width={22} height={10} rx={4} fill="#e9e3d2" />
        </g>
      ))}
      <rect x={cx - 35} y={893} width={70} height={54} rx={25} fill={C.lav} />
      <ellipse cx={cx} cy={936} rx={38} ry={21} fill={C.lav} />
      <ellipse cx={cx - 38.5} cy={929 + sw} rx={10.5} ry={11} fill="#fcd9bf" />
      <ellipse cx={cx + 38.5} cy={929 - sw} rx={10.5} ry={11} fill="#fcd9bf" />
      <ellipse cx={hx} cy={hy} rx={34} ry={30} fill="#fde0c8" />
      <path d={`M ${hx - 34} ${hy} A 34 30 0 0 1 ${hx + 34} ${hy} Z`} fill="#3b2f4d" />
      <ellipse cx={hx} cy={hy + 13} rx={31} ry={17} fill="#fde0c8" />
      <polygon points={`${hx - 3},${hy - 28} ${hx + 3 + lg * 0.5},${hy - 44} ${hx + 15 + lg},${hy - 42 + Math.abs(lg) * 0.3} ${hx + 9 + lg * 0.6},${hy - 36} ${hx + 8},${hy - 26}`} fill="#3b2f4d" />
      {[-13, 13].map((e) => blink
        ? <line key={e} x1={hx + e - 4} y1={hy + 4} x2={hx + e + 4} y2={hy + 4} stroke="#3a2430" strokeWidth={2} />
        : <circle key={e} cx={hx + e} cy={hy + 4} r={3.4} fill="#3a2430" />)}
      {[-22, 22].map((e) => (
        <g key={e}><ellipse cx={hx + e} cy={hy + 13} rx={10} ry={7} fill="rgba(245,150,150,.25)" /><ellipse cx={hx + e} cy={hy + 13} rx={7} ry={5} fill="rgba(245,140,140,.35)" /></g>
      ))}
      <line x1={hx - 6} y1={hy + 17} x2={hx + 6} y2={hy + 17} stroke="#5a3a3a" strokeWidth={2} strokeLinecap="round" />
    </g>
  );
};

/* ---------- STICKER / HUD ---------- */
const Card: React.FC<{ t: number; head: string; sub: string; value: number }> = ({ t, head, sub, value }) => {
  const s = bk(t / 0.45);
  if (s <= 0) return null;
  const kb = LD.reduce((m, l) => (t >= l ? Math.max(m, Math.exp(-12 * (t - l))) : m), 0);
  const tx = { fontFamily: FONT, fontWeight: 700, textAnchor: "middle" as const, dominantBaseline: "central" as const };
  return (
    <g transform={`translate(173 205) scale(${s}) translate(-173 -205)`}>
      <rect x={42} y={140} width={267} height={146} rx={22} fill="rgba(5,8,20,.47)" />
      <rect x={40} y={133} width={267} height={145} rx={22} fill={C.cream} />
      <rect x={40} y={133} width={267} height={39} rx={20} fill={C.coral} />
      <rect x={40} y={152} width={267} height={20} fill={C.coral} />
      <text x={176} y={153} fontSize={21} letterSpacing={6} fill="#fff5f0" {...tx}>{head}</text>
      <g transform={`translate(173 208) scale(${1 + 0.2 * kb})`}><text fontSize={50} fill={C.ink} {...tx}>{value}</text></g>
      <text x={173} y={255} fontSize={22} fill="#4b4f70" {...tx}>{sub}</text>
    </g>
  );
};

const Pill: React.FC<{ t: number; at: number; text: string; x: number; y: number }> = ({ t, at, text, x, y }) => {
  const s = t > at ? bk((t - at) / 0.35) : 0;
  if (s <= 0) return null;
  const hw = Math.max(60, (text.length * 17.7) / 2);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-hw + 2} y={-16} width={hw * 2} height={42} rx={21} fill="rgba(5,8,20,.43)" />
      <rect x={-hw} y={-21} width={hw * 2} height={42} rx={21} fill={C.cream} />
      <text y={1} fontFamily={FONT} fontWeight={700} fontSize={23} fill={C.ink} textAnchor="middle" dominantBaseline="central">{text}</text>
    </g>
  );
};

const Handle: React.FC<{ x: number; y: number; a: number; right: boolean; text: string }> = ({ x, y, a, right, text }) => {
  if (a <= 0.02) return null;
  const c = "#f0f0fa";
  return (
    <g opacity={a}>
      <rect x={x - 20} y={y - 20} width={40} height={40} rx={10} fill="none" stroke={c} strokeWidth={4} />
      <circle cx={x} cy={y} r={9} fill="none" stroke={c} strokeWidth={4} />
      <circle cx={x + 13} cy={y - 12} r={3} fill={c} />
      <text x={right ? x + 22 : x - 20} y={right ? y + 36 : y + 64} textAnchor={right ? "end" : "start"} dominantBaseline="central" fontFamily={FONT} fontWeight={700} fontSize={17} fill={c}>{text}</text>
    </g>
  );
};

const Titles: React.FC<{ t: number }> = ({ t }) => (
  <>
    {STORY.titles.map((ln, k) => {
      const al = Math.min(cl((t - ln.from) / 0.28), ln.to < 90 ? cl((ln.to - t) / 0.28) : 1);
      if (al <= 0.02) return null;
      return (
        <div key={k} style={{ position: "absolute", left: 0, right: 0, top: 368, transform: "translateY(-50%)", display: "flex", justifyContent: "center", opacity: al, filter: `blur(${(1 - al) * 12}px)`, fontFamily: FONT, fontWeight: 700, fontSize: 40, whiteSpace: "pre" }}>
          {ln.parts.map(([txt, col], i) => {
            const pa = cl((t - ln.from - i * 0.1) / 0.25);
            return <span key={i} style={{ color: col, opacity: pa, transform: `translateY(${(1 - eo(pa)) * 16}px)`, textShadow: "1px 4px 0 rgba(5,8,22,.55)" }}>{txt}</span>;
          })}
        </div>
      );
    })}
  </>
);

/* ---------- KOMPOSISI UTAMA ---------- */
export const MyVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = Math.min(frame / fps, durationInFrames / fps - 1 / fps);
  const { z, Yb } = cam(t), p = ph(t), base = GR - p, hs = hh(t);
  const topY = Yb - hs * z;
  const pu = t > TP ? Math.exp(-(t - TP) * 9) * Math.sin((t - TP) * 30) * 0.012 : 0;
  const gs = cl(0.25 + 0.6 * cl(hs / 460) + (t > TP ? 0.2 * Math.exp(-(t - TP) * 6) : 0));
  const gy = cl(topY + 70, 260, 720);

  const cn = LD.filter((l) => t >= l).length;
  const st = BH * cn;
  const d0 = cn > 0 ? t - LD[cn - 1] : 0;
  const sq = Math.exp(-9 * d0) * Math.cos(24 * d0);
  const lbl = STORY.stackLabel;
  const fallH = (Yb - st * z + 220) / z;

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg1, overflow: "hidden", fontFamily: FONT }}>
      <style>{FONT_IMPORT}</style>
      <AbsoluteFill style={{ transform: `scale(${1 + pu})` }}>
        {/* background */}
        <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.bg0}, ${C.bg1})` }} />
        <AbsoluteFill style={{ backgroundImage: `radial-gradient(circle, ${C.dot} 2px, transparent 2.6px)`, backgroundSize: "60px 60px", backgroundPosition: "0 10px" }} />
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 330px 420px at 360px ${gy}px, rgba(106,58,85,${gs}) 0%, rgba(106,58,85,${gs * 0.3}) 50%, rgba(106,58,85,0) 100%)` }} />

        {/* dunia (kena kamera) */}
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          <g transform={`matrix(${z} 0 0 ${z} ${360 - 360 * z} ${Yb - base * z})`}>
            <Underground />
            <Pedestal p={p} />
            <rect x={292} y={base - 2} width={138} height={4} rx={2} fill="#b3a279" />
            {t < P0 ? (
              <g>
                {cn > 0 && st - BH > 0.5 && (
                  <Squash sx={1 + 0.02 * sq} sy={1 - 0.03 * sq} px={360} py={base}><Block base={base} h={st - BH} label={lbl} /></Squash>
                )}
                {cn > 0 && (
                  <Squash sx={1 + 0.1 * sq} sy={1 - 0.2 * sq} px={360} py={base - (st - BH)}>
                    <Block base={base - (st - BH)} h={BH} yo={-8 * Math.exp(-9 * d0) * Math.sin(26 * d0)} label={lbl} />
                  </Squash>
                )}
                {BT.map((ts, k) => {
                  if (!(t >= ts && t < LD[k])) return null;
                  const u = (t - ts) / (LD[k] - ts);
                  if (k === 0) {
                    const xo = 260 * (1 - eo(u));
                    return <g key={k}><Block base={base} h={BH} xo={xo} label={lbl} /><Hand x={442 + xo} y={base - 8} /></g>;
                  }
                  const yo = -(1 - u * u) * fallH;
                  return (
                    <Squash key={k} sx={1 - 0.12 * u * u} sy={1 + 0.3 * u * u} px={360} py={base - st + yo}>
                      <Block base={base - st} h={BH} yo={yo} label={lbl} />
                    </Squash>
                  );
                })}
                {t > LD[0] && t < LD[0] + 0.3 && <Hand x={442 + 260 * eio((t - LD[0]) / 0.3)} y={base - 8} />}
              </g>
            ) : (
              <g transform={`translate(360 ${base}) matrix(1 0 ${0.025 * Math.sin((t - P0) * 14) * Math.exp(-(t - P0) * 2.2)} 1 0 0) translate(-360 ${-base})`}>
                <Block base={base} h={hs} label={lbl} />
              </g>
            )}
            {LD.map((te, k) => <Particles key={k} t={t} at={te} x={360} y={base - BH * (k + 1)} kind="puff" seed={k} />)}
            <Character t={t} pt={PT} />
            {t > P0 && t < P1 + 0.1 && [0, 1, 2].map((k) => {
              const i = Math.round(t * 30);
              return <circle key={k} cx={300 + rnd(i * 3 + k) * 140} cy={base - hs + rnd(i * 5 + k + 9) * 50 - 30} r={3} fill="#ffdce6" />;
            })}
            <line x1={-2000} y1={GR} x2={3000} y2={GR} stroke="#d7daeb" strokeWidth={2 / z} />
          </g>
        </svg>

        {/* HUD (tanpa kamera) */}
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          <Card t={t} head={STORY.cardHead} sub={STORY.cardSub} value={val(t)} />
          <Pill t={t} at={TP} text={STORY.pill} x={560} y={427} />
          <Particles t={t} at={TP} x={560} y={427} kind="ring" n={8} life={0.6} color="255,211,107" />
          <Particles t={t} at={TP} x={360} y={300} kind="confetti" n={18} life={1.1} />
          <Handle x={672} y={296} a={cl((3 - t) / 0.3) * cl((t - 0.4) / 0.3)} right text={STORY.handle} />
          <Handle x={110} y={870} a={cl((t - 3.3) / 0.3)} right={false} text={STORY.handle} />
        </svg>

        <Titles t={t} />
      </AbsoluteFill>
      {t < 0.12 && <AbsoluteFill style={{ backgroundColor: `rgba(10,14,34,${1 - t / 0.12})` }} />}
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => (
  <Composition id="MyVideo" component={MyVideo} durationInFrames={150} fps={30} width={720} height={1280} />
);

export default Comp;