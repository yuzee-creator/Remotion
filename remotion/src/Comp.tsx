import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/* ════════════════════════════════════════════════════════════
   "KENAPA APEL JATUH?" — scene demo explainer 2D (flat vector)
   Alur: apel muncul → jatuh & memantul → Bobi bereaksi →
         apel melompat → dunia berubah jadi diagram gravitasi
   ════════════════════════════════════════════════════════════ */

export const meta = { fps: 30, width: 1280, height: 720, durationInFrames: 330 };

/* ───────────── KONSTANTA ───────────── */
const W = 1280;
const H = 720;
const FONT = '"Arial Black", Arial, Helvetica, sans-serif';

const C = {
  ink: '#1F2347',
  skyTop: '#5EC2FF',
  skyBot: '#CFF1FF',
  spaceTop: '#171A55',
  spaceBot: '#4A2C93',
  sun: '#FFD23F',
  cloud: '#FFFFFF',
  hillFar: '#A6E8AE',
  hillNear: '#86D895',
  grassLight: '#7BE58A',
  grassDark: '#3FB962',
  oceanLight: '#6CC4FF',
  ocean: '#2F9BFF',
  land: '#5FD068',
  trunk: '#B07840',
  leaf: '#3FC15F',
  leafLight: '#6BE087',
  apple: '#FF4757',
  stem: '#7A4A24',
  appleLeaf: '#2ED573',
  bobi: '#FFB703',
  bobiBelly: '#FFE29A',
  bobiCheek: '#FF8FA3',
  bobiFoot: '#FF9F1C',
  coral: '#FF5D73',
  yellow: '#FFD166',
  mint: '#6BE3B0',
  white: '#FFFFFF',
  wipe: ['#FF6B6B', '#FFD166', '#4ECDC4', '#6C5CE7'],
};

const GROUND_Y = 545; // permukaan tanah
const G0 = { cy: 1144, rx: 3000, ry: 600 }; // tanah: bukit sangat landai
const G1 = { cy: 1010, rx: 420, ry: 420 }; // tanah → planet Bumi
const EARTH = { x: 640, y: 1010, r: 420 };
const APPLE_R = 41;
const HANG = { x: 356, y: 350 }; // posisi apel menggantung
const SPACE_APPLE = { x: 640, y: 245 }; // posisi apel di diagram
const BOBI_X = 960;
const TREE_X = 250;
const REST_Y = GROUND_Y - APPLE_R;
const ROLL = 0.9; // derajat putaran apel per piksel
const ROT_JUMP0 = (650 - HANG.x) * ROLL;
const EARTH_PT = {
  x: EARTH.x + EARTH.r * Math.cos((-123 * Math.PI) / 180),
  y: EARTH.y + EARTH.r * Math.sin((-123 * Math.PI) / 180),
};

// Timeline (frame @30fps)
const TL = {
  treePop: 8,
  sunPop: 6,
  bobiIn: 14,
  applePop: 30,
  shake: 52,
  drop: 68,
  land1: 84,
  land2: 106,
  land3: 120,
  bobiJump: 86,
  appleAnt: 164,
  exit: 168,
  space: 170,
  morph: 174,
  jump: 176,
  jumpDur: 30,
  landSpace: 206,
  ring: 210,
  chipApple: 218,
  lineApple: 220,
  chipEarth: 236,
  lineEarth: 238,
  arrow: 252,
  arrowDur: 24,
  chipGrav: 272,
  tug: 276,
};

/* ───────────── HELPER ANIMASI ───────────── */
type F = { frame: number; fps: number };
type Cam = { cx: number; cy: number; z: number };
type Seg = { d: number; to: number; ease: (t: number) => number };

const CL = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const E = {
  lin: (t: number) => t,
  inOut: Easing.inOut(Easing.cubic),
  out: Easing.out(Easing.cubic),
  in: Easing.in(Easing.cubic),
  inQ: Easing.in(Easing.quad),
  outQ: Easing.out(Easing.quad),
};

/** progres 0→1 antara start & start+dur */
const prog = (frame: number, start: number, dur: number, easing: (t: number) => number = E.lin) =>
  interpolate(frame, [start, start + dur], [0, 1], { ...CL, easing });

/** pop-in elastis (spring): 0 sebelum start, overshoot lalu settle di 1 */
const pop = (f: F, start: number, damping = 9, stiffness = 170, mass = 0.6) =>
  f.frame < start
    ? 0
    : spring({ frame: f.frame - start, fps: f.fps, config: { damping, stiffness, mass } });

/** gerakan berurutan (mis. jatuh → pantul → pantul kecil) */
const chain = (frame: number, start: number, from: number, segs: Seg[]) => {
  let t = frame - start;
  let cur = from;
  for (const s of segs) {
    if (t <= s.d) return cur + (s.to - cur) * s.ease(clamp(t / s.d));
    t -= s.d;
    cur = s.to;
  }
  return cur;
};

/** osilasi teredam setelah benturan → dipakai untuk squash & stretch */
const wobble = (frame: number, hit: number, amp: number) => {
  const t = frame - hit;
  if (t < 0 || t > 24) return 0;
  return amp * Math.exp(-t * 0.22) * Math.cos(t * 0.75);
};

const spaceT = (frame: number) => prog(frame, TL.space, 40, E.inOut);
const morphT = (frame: number) => prog(frame, TL.morph, 42, E.inOut);

/* ───────────── KAMERA & PARALLAX ───────────── */
const CAM_KEYS: (Cam & { f: number })[] = [
  { f: 0, cx: 640, cy: 360, z: 1 },
  { f: 60, cx: 640, cy: 360, z: 1 },
  { f: 98, cx: 600, cy: 400, z: 1.2 },
  { f: 150, cx: 780, cy: 415, z: 1.22 },
  { f: 176, cx: 700, cy: 400, z: 1.35 },
  { f: 210, cx: 640, cy: 360, z: 1 },
];

const cameraAt = (frame: number): Cam => {
  let i = 0;
  while (i < CAM_KEYS.length - 2 && frame >= CAM_KEYS[i + 1].f) i++;
  const a = CAM_KEYS[i];
  const b = CAM_KEYS[i + 1];
  const t = prog(frame, a.f, b.f - a.f, E.inOut);
  let cy = lerp(a.cy, b.cy, t);
  // guncangan kecil saat apel menghantam tanah
  const s1 = frame - TL.land1;
  if (s1 >= 0 && s1 < 16) cy += 5 * Math.exp(-0.28 * s1) * Math.sin(s1 * 2.2);
  const s2 = frame - TL.land2;
  if (s2 >= 0 && s2 < 12) cy += 2.5 * Math.exp(-0.3 * s2) * Math.sin(s2 * 2.2);
  return { cx: lerp(a.cx, b.cx, t), cy, z: lerp(a.z, b.z, t) };
};

/** p = 0 diam, p < 1 jauh (latar), p > 1 dekat (foreground) */
const layerTf = (cam: Cam, p: number) => {
  const z = 1 + (cam.z - 1) * p;
  const cx = 640 + (cam.cx - 640) * p;
  const cy = 360 + (cam.cy - 360) * p;
  return `translate(640 360) scale(${z}) translate(${-cx} ${-cy})`;
};

/* ───────────── LOGIKA GERAK (murni berdasarkan frame) ───────────── */
const treeRot = (frame: number) => {
  const shake = interpolate(frame, [TL.shake, TL.shake + 6, 64, TL.drop], [0, 1, 1, 0], CL);
  return 0.9 * Math.sin(frame * 0.07) + 3.4 * Math.sin(frame * 1.25) * shake;
};

const rotAroundTree = (frame: number, px: number, py: number) => {
  const a = (treeRot(frame) * Math.PI) / 180;
  const dx = px - TREE_X;
  const dy = py - GROUND_Y;
  return {
    x: TREE_X + dx * Math.cos(a) - dy * Math.sin(a),
    y: GROUND_Y + dx * Math.sin(a) + dy * Math.cos(a),
  };
};

const applePos = (frame: number) => {
  // 1) lompatan di motion path (kurva Bezier) menuju diagram
  if (frame >= TL.jump) {
    const t = E.inOut(prog(frame, TL.jump, TL.jumpDur));
    const u = 1 - t;
    const x = u * u * 650 + 2 * u * t * 600 + t * t * SPACE_APPLE.x;
    let y = u * u * REST_Y + 2 * u * t * -120 + t * t * SPACE_APPLE.y;
    if (frame >= TL.landSpace) {
      y += Math.sin(frame * 0.11) * 6 * prog(frame, 214, 16); // melayang pelan
      const g = frame - TL.tug;
      if (g >= 0) y += 26 * Math.exp(-0.14 * g) * Math.sin(0.55 * g); // "ditarik" gravitasi
    }
    return { x, y };
  }
  // 2) menggantung di pohon + anticipation (ditarik ke atas sebelum lepas)
  if (frame < TL.drop) {
    const ant = interpolate(frame, [58, 66, TL.drop], [0, 1, 0], CL);
    const p = rotAroundTree(frame, HANG.x, HANG.y);
    return { x: p.x, y: p.y - 10 * ant };
  }
  // 3) jatuh → pantul → pantul kecil → menggelinding
  const x = chain(frame, TL.drop, HANG.x, [
    { d: 38, to: 520, ease: E.lin },
    { d: 14, to: 590, ease: E.lin },
    { d: 30, to: 650, ease: E.outQ },
  ]);
  const y = chain(frame, TL.drop, HANG.y, [
    { d: 16, to: REST_Y, ease: E.inQ },
    { d: 11, to: REST_Y - 120, ease: E.outQ },
    { d: 11, to: REST_Y, ease: E.inQ },
    { d: 7, to: REST_Y - 46, ease: E.outQ },
    { d: 7, to: REST_Y, ease: E.inQ },
  ]);
  return { x, y };
};

const appleLook = (f: F) => {
  const { frame } = f;
  const p = applePos(frame);
  const q = applePos(frame - 1);
  const speed = Math.hypot(p.x - q.x, p.y - q.y);
  const stretch = clamp(speed / 46) * 0.2;
  const a =
    wobble(frame, TL.land1, 1) +
    wobble(frame, TL.land2, 0.6) +
    wobble(frame, TL.land3, 0.3) +
    wobble(frame, TL.landSpace, 0.8) +
    interpolate(frame, [TL.appleAnt, TL.appleAnt + 10, TL.jump], [0, 1.1, 0], CL); // anticipation
  const sy = (1 - 0.32 * a) * (1 + stretch);
  const sx = (1 + 0.26 * a) * (1 - 0.55 * stretch);

  const wig =
    frame < TL.drop
      ? 14 * Math.sin(frame * 1.3) * interpolate(frame, [TL.shake, TL.shake + 6, 64, TL.drop], [0, 1, 1, 0], CL) +
        treeRot(frame)
      : 0;
  const rot =
    frame < TL.drop
      ? wig
      : frame < TL.jump
        ? (p.x - HANG.x) * ROLL
        : lerp(ROT_JUMP0, 720, E.inOut(prog(frame, TL.jump, TL.jumpDur)));

  const S = pop(f, TL.applePop, 8, 200, 0.5) * (1 + 0.22 * pop(f, TL.landSpace, 7, 150, 0.6));
  return { x: p.x, y: p.y, sx, sy, rot, S, pivotY: frame < TL.drop ? -APPLE_R : 0 };
};

const bobiX = (f: F) =>
  lerp(1500, BOBI_X, pop(f, TL.bobiIn, 12, 90, 0.9)) +
  chain(f.frame, TL.exit, 0, [
    { d: 6, to: -22, ease: E.out },
    { d: 28, to: 600, ease: E.in },
  ]);

const bobiJumpY = (frame: number) =>
  chain(frame, TL.bobiJump, 0, [
    { d: 12, to: -74, ease: E.outQ },
    { d: 12, to: 0, ease: E.inQ },
  ]);

/* ───────────── LATAR ───────────── */
const Sky: React.FC<{ frame: number }> = ({ frame }) => {
  const s = spaceT(frame);
  const top = interpolateColors(s, [0, 1], [C.skyTop, C.spaceTop]);
  const bot = interpolateColors(s, [0, 1], [C.skyBot, C.spaceBot]);
  return (
    <g>
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bot} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#skyGrad)" />
    </g>
  );
};

const Stars: React.FC<{ frame: number }> = ({ frame }) => {
  const s = spaceT(frame);
  if (s < 0.02) return null;
  return (
    <g>
      {Array.from({ length: 34 }, (_, i) => {
        const x = (i * 197 + 61) % W;
        const y = (i * 113 + 23) % 470;
        const r = 1.8 + (i % 3);
        const o = s * (0.5 + 0.5 * Math.sin(frame * 0.12 + i * 1.7));
        return <circle key={i} cx={x} cy={y} r={r} fill={C.white} opacity={clamp(o)} />;
      })}
    </g>
  );
};

const Sun: React.FC<{ f: F }> = ({ f }) => {
  const { frame } = f;
  const s = spaceT(frame);
  const sc = pop(f, TL.sunPop, 8, 140, 0.7);
  const op = 1 - clamp(s * 1.6);
  if (op <= 0.01 || sc < 0.01) return null;
  return (
    <g transform={`translate(1090 ${118 - 260 * s}) scale(${sc})`} opacity={op}>
      <g transform={`rotate(${frame * 0.8})`}>
        {Array.from({ length: 12 }, (_, i) => (
          <line
            key={i}
            x1={0}
            y1={-70}
            x2={0}
            y2={-92}
            stroke={C.sun}
            strokeWidth={9}
            strokeLinecap="round"
            transform={`rotate(${i * 30})`}
          />
        ))}
      </g>
      <circle r={54} fill={C.sun} stroke={C.ink} strokeWidth={5} />
      <circle cx={-18} cy={-8} r={6} fill={C.ink} />
      <circle cx={18} cy={-8} r={6} fill={C.ink} />
      <path d="M-18 14 Q0 32 18 14" fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
      <circle cx={-34} cy={10} r={8} fill="#FF9F43" opacity={0.7} />
      <circle cx={34} cy={10} r={8} fill="#FF9F43" opacity={0.7} />
    </g>
  );
};

const CLOUDS = [
  { x: 120, y: 110, s: 1.1, v: 0.35 },
  { x: 640, y: 70, s: 0.85, v: 0.25 },
  { x: 960, y: 210, s: 0.75, v: 0.3 },
];

const Clouds: React.FC<{ frame: number }> = ({ frame }) => {
  const s = spaceT(frame);
  const op = 1 - clamp(s * 1.5);
  if (op <= 0.01) return null;
  return (
    <g opacity={op} transform={`translate(0 ${-170 * s})`}>
      {CLOUDS.map((c, i) => {
        const x = ((c.x + frame * c.v + 300) % 1800) - 300;
        return (
          <g key={i} transform={`translate(${x} ${c.y}) scale(${c.s})`}>
            <ellipse cx={38} cy={16} rx={62} ry={16} fill="#E3F4FF" />
            <ellipse cx={38} cy={8} rx={64} ry={24} fill={C.cloud} />
            <circle cx={18} cy={-8} r={26} fill={C.cloud} />
            <circle cx={52} cy={-22} r={32} fill={C.cloud} />
            <circle cx={86} cy={-4} r={22} fill={C.cloud} />
          </g>
        );
      })}
    </g>
  );
};

const Hills: React.FC<{ frame: number }> = ({ frame }) => {
  const t = E.in(spaceT(frame));
  return (
    <g transform={`translate(0 ${t * 300})`}>
      <ellipse cx={180} cy={650} rx={560} ry={200} fill={C.hillFar} />
      <ellipse cx={1050} cy={670} rx={600} ry={220} fill={C.hillNear} />
    </g>
  );
};

/* ───────────── TANAH → BUMI (morph) ───────────── */
const Ground: React.FC<{ frame: number }> = ({ frame }) => {
  const t = morphT(frame);
  const rx = lerp(G0.rx, G1.rx, E.out(t));
  const ry = lerp(G0.ry, G1.ry, t);
  const cy = lerp(G0.cy, G1.cy, t);
  const off = lerp(26, 10, t);
  const light = interpolateColors(t, [0, 1], [C.grassLight, C.oceanLight]);
  const dark = interpolateColors(t, [0, 1], [C.grassDark, C.ocean]);
  const land = clamp((t - 0.5) * 2);
  const spin = frame * 0.18;
  const BLOBS = [
    { a: -110, r: 70 },
    { a: -72, r: 92 },
    { a: -36, r: 60 },
    { a: -2, r: 80 },
    { a: 38, r: 66 },
    { a: 74, r: 76 },
  ];
  return (
    <g>
      <defs>
        <clipPath id="groundClip">
          <ellipse cx={640} cy={cy + off} rx={rx} ry={ry} />
        </clipPath>
      </defs>
      <ellipse cx={640} cy={cy} rx={rx} ry={ry} fill={light} stroke={C.ink} strokeWidth={6} />
      <ellipse cx={640} cy={cy + off} rx={rx} ry={ry} fill={dark} stroke={C.ink} strokeWidth={6} />
      <g clipPath="url(#groundClip)" opacity={land} transform={`rotate(${spin} 640 ${cy + off})`}>
        {BLOBS.map((b, i) => (
          <circle
            key={i}
            cx={640 + ry * 0.8 * Math.cos((b.a * Math.PI) / 180)}
            cy={cy + off + ry * 0.8 * Math.sin((b.a * Math.PI) / 180)}
            r={b.r}
            fill={C.land}
          />
        ))}
      </g>
      <circle
        cx={640}
        cy={cy + off}
        r={ry + 16}
        fill="none"
        stroke="#8FE0FF"
        strokeWidth={8}
        opacity={0.35 * land}
      />
    </g>
  );
};

const groundTopAt = (x: number) => G0.cy - G0.ry * Math.sqrt(1 - Math.pow((x - 640) / G0.rx, 2));

const FLOWERS = [
  { x: 90, c: '#FF6B9A', h: 58, d: 0 },
  { x: 470, c: '#FFD166', h: 70, d: 3 },
  { x: 810, c: '#A78BFA', h: 62, d: 6 },
  { x: 1160, c: '#FF9F43', h: 66, d: 9 },
];

const Flower: React.FC<{ f: F; x: number; c: string; h: number; d: number }> = ({ f, x, c, h, d }) => {
  const { frame } = f;
  const s = pop(f, TL.treePop + 6 + d, 8, 170, 0.5) * (1 - clamp(morphT(frame) * 3));
  if (s < 0.01) return null;
  const by = groundTopAt(x) + 6;
  const tx = x + Math.sin(frame * 0.08 + x) * 5;
  const ty = by - h;
  const petals = Array.from({ length: 5 }, (_, k) => ({
    px: tx + 11 * Math.cos((k * 72 * Math.PI) / 180),
    py: ty + 11 * Math.sin((k * 72 * Math.PI) / 180),
  }));
  return (
    <g transform={`translate(${x} ${by}) scale(${s}) translate(${-x} ${-by})`}>
      <path d={`M${x} ${by} Q${x} ${by - h * 0.5} ${tx} ${ty}`} fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
      <path d={`M${x} ${by} Q${x} ${by - h * 0.5} ${tx} ${ty}`} fill="none" stroke="#2E9E4F" strokeWidth={4.5} strokeLinecap="round" />
      {petals.map((p, i) => (
        <circle key={`o${i}`} cx={p.px} cy={p.py} r={9} fill={C.ink} stroke={C.ink} strokeWidth={4} />
      ))}
      {petals.map((p, i) => (
        <circle key={`f${i}`} cx={p.px} cy={p.py} r={9} fill={c} />
      ))}
      <circle cx={tx} cy={ty} r={7} fill={C.sun} stroke={C.ink} strokeWidth={3} />
    </g>
  );
};

/* ───────────── POHON ───────────── */
const CANOPY = [
  { x: 250, y: 255, r: 92 },
  { x: 176, y: 305, r: 66 },
  { x: 326, y: 305, r: 66 },
  { x: 250, y: 318, r: 70 },
];

const Tree: React.FC<{ f: F }> = ({ f }) => {
  const { frame } = f;
  const s = pop(f, TL.treePop, 9, 120, 0.8);
  const out = chain(frame, TL.exit - 2, 0, [
    { d: 6, to: 14, ease: E.out },
    { d: 30, to: -760, ease: E.in },
  ]);
  if (s < 0.001 || out < -740) return null;
  return (
    <g
      transform={`translate(${out} 0) translate(${TREE_X} ${GROUND_Y}) scale(${s}) rotate(${treeRot(frame)}) translate(${-TREE_X} ${-GROUND_Y})`}
    >
      <path
        d="M224 548 Q232 450 238 330 L268 330 Q270 450 278 548 Z"
        fill={C.trunk}
        stroke={C.ink}
        strokeWidth={6}
        strokeLinejoin="round"
      />
      <path d="M246 470 Q250 430 252 390" fill="none" stroke="#8A5A2B" strokeWidth={5} strokeLinecap="round" />
      {CANOPY.map((c, i) => (
        <circle key={`o${i}`} cx={c.x} cy={c.y} r={c.r} fill={C.ink} stroke={C.ink} strokeWidth={12} />
      ))}
      {CANOPY.map((c, i) => (
        <circle key={`f${i}`} cx={c.x} cy={c.y} r={c.r} fill={C.leaf} />
      ))}
      <circle cx={222} cy={222} r={30} fill={C.leafLight} opacity={0.7} />
      <circle cx={158} cy={290} r={18} fill={C.leafLight} opacity={0.7} />
      <circle cx={300} cy={268} r={14} fill={C.leafLight} opacity={0.7} />
    </g>
  );
};

const FallingLeaves: React.FC<{ frame: number }> = ({ frame }) => (
  <g>
    {[0, 1, 2].map((i) => {
      const t = frame - (TL.shake + 2 + i * 4);
      if (t < 0 || t > 36) return null;
      const x = 270 + i * 48 + Math.sin(t * 0.3 + i) * 26;
      const y = 300 + t * 6.2;
      return (
        <g key={i} transform={`translate(${x} ${y}) rotate(${t * 12 + i * 40}) scale(0.7)`} opacity={1 - prog(t, 26, 10)}>
          <path d="M0 -14 Q16 0 0 14 Q-16 0 0 -14 Z" fill={C.leaf} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        </g>
      );
    })}
  </g>
);

/* ───────────── APEL ───────────── */
const AppleArt: React.FC = () => (
  <g>
    <path
      d="M0 -34 C20 -48 48 -30 44 0 C40 34 18 46 0 40 C-18 46 -40 34 -44 0 C-48 -30 -20 -48 0 -34 Z"
      fill={C.apple}
      stroke={C.ink}
      strokeWidth={5}
      strokeLinejoin="round"
    />
    <ellipse cx={-22} cy={-12} rx={7} ry={12} fill={C.white} opacity={0.8} transform="rotate(25 -22 -12)" />
    <path d="M0 -34 Q2 -50 12 -58" fill="none" stroke={C.stem} strokeWidth={6} strokeLinecap="round" />
    <path
      d="M10 -52 Q26 -72 46 -58 Q32 -42 10 -52 Z"
      fill={C.appleLeaf}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
  </g>
);

const Apple: React.FC<{ f: F }> = ({ f }) => {
  const s = appleLook(f);
  if (s.S < 0.001) return null;
  return (
    <g
      transform={`translate(${s.x} ${s.y}) scale(${s.S}) translate(0 ${APPLE_R}) scale(${s.sx} ${s.sy}) translate(0 ${-APPLE_R}) rotate(${s.rot} 0 ${s.pivotY})`}
    >
      <AppleArt />
    </g>
  );
};

const Shadows: React.FC<{ f: F }> = ({ f }) => {
  const { frame } = f;
  if (frame < TL.applePop || frame >= TL.jump + 8) return null;
  const p = applePos(frame);
  const h = clamp((REST_Y - p.y) / 260);
  const fade = 1 - prog(frame, TL.jump, 8);
  const sc = pop(f, TL.applePop, 8, 200, 0.5);
  return (
    <ellipse
      cx={p.x}
      cy={GROUND_Y + 4}
      rx={38 * (1 - h * 0.5) * sc}
      ry={7 * (1 - h * 0.5) * sc}
      fill={C.ink}
      opacity={0.22 * (1 - h * 0.6) * fade}
    />
  );
};

const Dust: React.FC<{ frame: number; hit: number; x: number; size: number }> = ({ frame, hit, x, size }) => {
  const t = frame - hit;
  if (t < 0 || t > 16) return null;
  return (
    <g opacity={(1 - t / 16) * 0.9}>
      {[-1, 1].map((s) => (
        <g key={s}>
          {[0, 1, 2].map((k) => (
            <circle
              key={k}
              cx={x + s * (14 + t * (2.6 + k * 0.9))}
              cy={GROUND_Y - 6 - k * 5 - t * 0.4}
              r={(5 + k * 2 + t * 0.5) * size}
              fill={C.white}
            />
          ))}
        </g>
      ))}
    </g>
  );
};

/* ───────────── BOBI (karakter) ───────────── */
const Arm: React.FC<{ side: number; angle: number }> = ({ side, angle }) => {
  const a = (angle * Math.PI) / 180;
  const hx = side * (56 + 34 * Math.sin(a));
  const hy = -58 + 34 * Math.cos(a);
  return (
    <g>
      <line x1={side * 52} y1={-58} x2={hx} y2={hy} stroke={C.ink} strokeWidth={17} strokeLinecap="round" />
      <line x1={side * 52} y1={-58} x2={hx} y2={hy} stroke={C.bobi} strokeWidth={7} strokeLinecap="round" />
    </g>
  );
};

const Bobi: React.FC<{ f: F }> = ({ f }) => {
  const { frame } = f;
  const x = bobiX(f);
  if (x > 1450) return null;
  const jy = bobiJumpY(frame);
  const px = bobiX({ frame: frame - 1, fps: f.fps });
  const vJ = Math.abs(jy - bobiJumpY(frame - 1));
  const vX = clamp(Math.abs(x - px) / 45);

  const a =
    wobble(frame, 44, 0.6) +
    wobble(frame, 110, 0.9) +
    interpolate(frame, [80, 86, 87], [0, 0.8, 0], CL) + // jongkok sebelum lompat
    interpolate(frame, [164, 170, 171], [0, 0.7, 0], CL); // jongkok sebelum kabur
  const breath = 0.025 * Math.sin(frame * 0.14);
  const sy = (1 - 0.28 * a + breath) * (1 + clamp(vJ / 10) * 0.14) * (1 - vX * 0.12);
  const sx = (1 + 0.22 * a - breath * 0.6) * (1 - clamp(vJ / 10) * 0.08) * (1 + vX * 0.3);

  const ap = applePos(frame);
  const lookX = clamp((ap.x - x) / 320, -1, 1) * 5;
  const lookY = clamp((ap.y - (GROUND_Y - 84 + jy)) / 250, -1, 1) * 4;
  const react = prog(frame, TL.land1, 3);
  const wide = 1 + 0.45 * react * (1 - prog(frame, 140, 12));
  const blink = frame % 70 < 4 && react === 0 ? 0.15 : 1;
  const open = react * (1 - prog(frame, 136, 8));
  const raise = interpolate(frame, [84, 92, 112, 122], [0, 1, 1, 0], CL);
  const armA = lerp(22, 150, E.out(raise));
  const sway = 6 * Math.sin(frame * 0.2) - 30 * raise;
  const ex = pop(f, 88, 7, 200, 0.5) * (1 - prog(frame, 138, 6));
  const flick = 0.5 + 0.5 * Math.sin(frame * 1.4);
  const shock = frame >= 88 && frame < 122 ? flick : 0;
  const shScale = clamp(1 + jy / 200, 0.4, 1);

  return (
    <g>
      <ellipse cx={x} cy={GROUND_Y + 4} rx={58 * shScale} ry={10 * shScale} fill={C.ink} opacity={0.2} />
      <g transform={`translate(${x} ${GROUND_Y + jy}) scale(${sx} ${sy})`}>
        <ellipse cx={-26} cy={-4} rx={19} ry={11} fill={C.bobiFoot} stroke={C.ink} strokeWidth={5} />
        <ellipse cx={26} cy={-4} rx={19} ry={11} fill={C.bobiFoot} stroke={C.ink} strokeWidth={5} />
        <Arm side={-1} angle={armA} />
        <Arm side={1} angle={armA} />
        <g transform={`rotate(${sway} 0 -122)`}>
          <path d="M0 -122 Q-4 -140 2 -154" fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
          <path d="M0 -122 Q-4 -140 2 -154" fill="none" stroke={C.leaf} strokeWidth={4} strokeLinecap="round" />
          <path d="M2 -152 Q-26 -176 -40 -150 Q-16 -138 2 -152 Z" fill={C.leaf} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
          <path d="M2 -152 Q30 -178 44 -152 Q20 -138 2 -152 Z" fill={C.leafLight} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        </g>
        <ellipse cx={0} cy={-64} rx={62} ry={64} fill={C.bobi} stroke={C.ink} strokeWidth={6} />
        <ellipse cx={0} cy={-40} rx={36} ry={30} fill={C.bobiBelly} />
        <circle cx={-40} cy={-60} r={10} fill={C.bobiCheek} opacity={0.9} />
        <circle cx={40} cy={-60} r={10} fill={C.bobiCheek} opacity={0.9} />
        {[-1, 1].map((s) => (
          <g key={s} transform={`translate(${s * 22} -86) scale(${wide} ${wide * blink})`}>
            <circle r={17} fill={C.white} stroke={C.ink} strokeWidth={4} />
            <circle cx={lookX} cy={lookY} r={8} fill={C.ink} />
            <circle cx={lookX + 3} cy={lookY - 3} r={2.8} fill={C.white} />
          </g>
        ))}
        <path
          d="M-15 -58 Q0 -42 15 -58"
          fill="none"
          stroke={C.ink}
          strokeWidth={5}
          strokeLinecap="round"
          opacity={1 - open}
        />
        {open > 0.02 && (
          <g>
            <ellipse cx={0} cy={-50} rx={11 * open} ry={14 * open} fill={C.ink} />
            <ellipse cx={0} cy={-45} rx={6 * open} ry={5 * open} fill={C.coral} />
          </g>
        )}
        {ex > 0.01 && (
          <g transform={`translate(0 -196) scale(${ex})`}>
            <rect x={-9} y={-44} width={18} height={34} rx={9} fill={C.coral} stroke={C.ink} strokeWidth={4} />
            <circle cx={0} cy={6} r={10} fill={C.coral} stroke={C.ink} strokeWidth={4} />
          </g>
        )}
        {shock > 0.01 &&
          [-140, -110, -70, -40].map((deg) => (
            <line
              key={deg}
              x1={Math.cos((deg * Math.PI) / 180) * 80}
              y1={-64 + Math.sin((deg * Math.PI) / 180) * 80}
              x2={Math.cos((deg * Math.PI) / 180) * 104}
              y2={-64 + Math.sin((deg * Math.PI) / 180) * 104}
              stroke={C.ink}
              strokeWidth={5}
              strokeLinecap="round"
              opacity={shock}
            />
          ))}
      </g>
    </g>
  );
};

/* ───────────── DIAGRAM ───────────── */
const Chip: React.FC<{
  cx: number;
  cy: number;
  text: string;
  bg: string;
  fg: string;
  s: number;
  rot?: number;
  tail?: boolean;
}> = ({ cx, cy, text, bg, fg, s, rot = 0, tail = false }) => {
  if (s < 0.001) return null;
  const w = text.length * 21 + 56;
  const h = 62;
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rot}) scale(${s})`}>
      {tail && (
        <polygon
          points={`${-w / 2 + 4},-15 ${-w / 2 - 24},0 ${-w / 2 + 4},15`}
          fill={bg}
          stroke={C.white}
          strokeWidth={5}
          strokeLinejoin="round"
        />
      )}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={bg} stroke={C.white} strokeWidth={5} />
      <text x={0} y={11} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={32} fill={fg}>
        {text}
      </text>
    </g>
  );
};

const Link: React.FC<{ x1: number; y1: number; x2: number; y2: number; p: number }> = ({ x1, y1, x2, y2, p }) => {
  if (p <= 0.001) return null;
  const L = Math.hypot(x2 - x1, y2 - y1);
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={C.white}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={L}
        strokeDashoffset={L * (1 - p)}
      />
      <circle cx={x2} cy={y2} r={8 * clamp((p - 0.9) * 10)} fill={C.white} />
    </g>
  );
};

const Diagram: React.FC<{ f: F }> = ({ f }) => {
  const { frame } = f;
  if (frame < TL.landSpace) return null;
  const ap = applePos(frame);
  const ringS = pop(f, TL.ring, 8, 150, 0.6);
  const sApple = pop(f, TL.chipApple, 8, 170, 0.6);
  const sEarth = pop(f, TL.chipEarth, 8, 170, 0.6);
  const sGrav = pop(f, TL.chipGrav, 6, 150, 0.7);
  const lA = E.out(prog(frame, TL.lineApple, 16));
  const lE = E.out(prog(frame, TL.lineEarth, 16));
  const g = E.out(prog(frame, TL.arrow, TL.arrowDur));
  const flow = clamp((g - 0.95) * 20);
  const gt = frame - TL.chipGrav;
  const wob = gt >= 0 ? -5 * Math.sin(gt * 0.55) * Math.exp(-0.13 * gt) : 0;

  const ax = 640;
  const y0 = 340;
  const tipY = lerp(y0, 584, g);

  return (
    <g>
      <Link x1={374} y1={245} x2={566} y2={245} p={lA} />
      <Link x1={304} y1={590} x2={EARTH_PT.x} y2={EARTH_PT.y} p={lE} />

      {g > 0.001 && (
        <g>
          <line x1={ax} y1={y0} x2={ax} y2={Math.max(y0, tipY - 30)} stroke={C.white} strokeWidth={26} strokeLinecap="round" />
          <line x1={ax} y1={y0} x2={ax} y2={Math.max(y0, tipY - 30)} stroke={C.coral} strokeWidth={18} strokeLinecap="round" />
          <line
            x1={ax}
            y1={y0 + 8}
            x2={ax}
            y2={Math.max(y0 + 8, tipY - 36)}
            stroke="#FFE3E8"
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray="1 26"
            strokeDashoffset={-frame * 3}
            opacity={flow}
          />
          <polygon
            points={`${ax},${tipY} ${ax - 34},${tipY - 40} ${ax + 34},${tipY - 40}`}
            fill={C.coral}
            stroke={C.white}
            strokeWidth={5}
            strokeLinejoin="round"
          />
        </g>
      )}

      <circle cx={ap.x} cy={ap.y} r={76 * ringS} fill={C.white} opacity={0.08} />
      <circle
        cx={ap.x}
        cy={ap.y}
        r={76 * ringS}
        fill="none"
        stroke={C.yellow}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray="16 12"
        strokeDashoffset={-frame * 1.4}
      />

      <Chip cx={300 - 140 * (1 - clamp(sApple))} cy={245} text="Apel" bg={C.yellow} fg={C.ink} s={sApple} />
      <Chip cx={230 - 140 * (1 - clamp(sEarth))} cy={590} text="Bumi" bg={C.mint} fg={C.ink} s={sEarth} />
      <Chip cx={880} cy={460} text="Gravitasi" bg={C.coral} fg={C.white} s={sGrav} rot={wob} tail />
    </g>
  );
};

/* ───────────── FOREGROUND & TRANSISI ───────────── */
const Front: React.FC<{ frame: number }> = ({ frame }) => {
  const t = E.in(morphT(frame));
  if (t >= 1) return null;
  return (
    <g transform={`translate(0 ${t * 320})`}>
      {Array.from({ length: 24 }, (_, i) => {
        const x = -100 + i * 62;
        const h = 46 + ((i * 37) % 34);
        const sw = Math.sin(frame * 0.07 + i) * 5;
        return (
          <polygon
            key={i}
            points={`${x},${H + 10} ${x + 17 + sw},${H - h} ${x + 34},${H + 10}`}
            fill="#2AA64F"
            stroke={C.ink}
            strokeWidth={4}
            strokeLinejoin="round"
          />
        );
      })}
      <circle cx={50} cy={730} r={90} fill="#23A04B" stroke={C.ink} strokeWidth={5} />
      <circle cx={1230} cy={738} r={100} fill="#23A04B" stroke={C.ink} strokeWidth={5} />
      <circle cx={26} cy={690} r={16} fill="#4BD37B" opacity={0.8} />
      <circle cx={1200} cy={690} r={18} fill="#4BD37B" opacity={0.8} />
    </g>
  );
};

const Wipe: React.FC<{ frame: number }> = ({ frame }) => (
  <g>
    {C.wipe.map((c, i) => {
      const t = prog(frame, i * 3, 16, E.inOut);
      if (t >= 1) return null;
      return <rect key={i} x={i * 320 - 1} y={-(H + 10) * t} width={322} height={H + 4} fill={c} />;
    })}
  </g>
);

/* ───────────── KOMPOSISI UTAMA ───────────── */
const Comp: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const f: F = { frame, fps };
  const cam = cameraAt(frame);

  const ap1 = applePos(TL.land1).x;
  const ap2 = applePos(TL.land2).x;
  const bobiLandX = bobiX({ frame: 110, fps });

  return (
    <AbsoluteFill style={{ backgroundColor: C.skyTop }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        style={{ display: 'block' }}
      >
        <Sky frame={frame} />
        <g transform={layerTf(cam, 0.3)}>
          <Stars frame={frame} />
          <Sun f={f} />
        </g>
        <g transform={layerTf(cam, 0.5)}>
          <Clouds frame={frame} />
        </g>
        <g transform={layerTf(cam, 0.7)}>
          <Hills frame={frame} />
        </g>

        <g transform={layerTf(cam, 1)}>
          <Ground frame={frame} />
          {FLOWERS.map((fl) => (
            <Flower key={fl.x} f={f} x={fl.x} c={fl.c} h={fl.h} d={fl.d} />
          ))}
          <Tree f={f} />
          <FallingLeaves frame={frame} />
          <Shadows f={f} />
          <Bobi f={f} />
          <Dust frame={frame} hit={TL.land1} x={ap1} size={1.1} />
          <Dust frame={frame} hit={TL.land2} x={ap2} size={0.8} />
          <Dust frame={frame} hit={110} x={bobiLandX} size={0.9} />
          <Diagram f={f} />
          <Apple f={f} />
        </g>

        <g transform={layerTf(cam, 1.35)}>
          <Front frame={frame} />
        </g>

        <Wipe frame={frame} />
      </svg>
    </AbsoluteFill>
  );
};

export default Comp;