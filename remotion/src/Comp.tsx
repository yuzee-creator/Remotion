import React from 'react';
import {useCurrentFrame} from 'remotion';

export const meta = {fps: 30, width: 1080, height: 1920, durationInFrames: 300};

// ===== helper easing (fungsi dari waktu, no state) =====
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const expoOut = (x: number) => {
  x = clamp(x);
  return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
};
const easeIn = (x: number) => clamp(x) * clamp(x);
// spring closed-form (detik)
const spr = (sec: number, w = 16, z = 0.35) => {
  if (sec <= 0) return 0;
  const k = Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * sec) * (Math.cos(w * k * sec) + (z / k) * Math.sin(w * k * sec));
};

const SKIN = '#F0B98D';
const SHOULDER: [number, number] = [300, 905];
const REST: [number, number] = [360, 1225];
const REMOTE0: [number, number] = [880, 1270];

// ===== posisi tangan per frame =====
function handAt(f: number): [number, number] {
  if (f < 60) return REST;
  if (f < 150) {
    const t = f - 60;
    if (t < 8) {
      const a = expoOut(t / 8); // antisipasi: tarik ke belakang
      return [lerp(REST[0], 300, a), lerp(REST[1], 1175, a)];
    }
    if (t < 50) {
      const s = spr((t - 8) / 30, 18, 0.55); // jangkau + overshoot
      const j = t > 26 ? Math.sin(t * 1.9) * 3 : 0; // ngeden
      return [lerp(300, 740, s) + j, lerp(1175, 1235, s)];
    }
    if (t < 60) {
      const a = expoOut((t - 50) / 8); // antisipasi lunge
      return [lerp(740, 710, a), 1237];
    }
    const a = easeIn((t - 60) / 30); // lunge, makin cepat pas cut
    return [lerp(710, 795, a), lerp(1237, 1252, a)];
  }
  if (f < 225) {
    const u = f - 150;
    if (u < 8) {
      const a = expoOut(u / 8);
      return [lerp(795, 815, a), lerp(1252, 1262, a)];
    }
    const s = spr((u - 8) / 30, 12, 0.6); // lemes jatuh
    return [lerp(815, 850, s), lerp(1262, 1335, s)];
  }
  const v = f - 225;
  const th = spr((v - 56) / 30, 16, 0.4);
  return [lerp(REST[0], 390, th), lerp(REST[1], 790, th)];
}

function remoteAt(f: number): {x: number; y: number; r: number} {
  if (f < 150) return {x: REMOTE0[0], y: REMOTE0[1], r: 0};
  const u = f - 150;
  return {x: REMOTE0[0] + 110 * expoOut(u / 22), y: REMOTE0[1], r: 35 * expoOut(u / 22)};
}

// mata duluan, badan nyusul
function eyesAt(f: number): [number, number, number] {
  let ex = 0.7, ey = -0.7, c = 0;
  if (f < 150) {
    if (f >= 12) {
      const a = expoOut((f - 12) / 4);
      ex = lerp(0.7, 0.9, a);
      ey = lerp(-0.7, 0.7, a);
    }
    if (f >= 38 && f < 42) c = 1;
    if (f >= 84 && f < 120) c = 0.35;
    if (f >= 120) c = 0.5;
  } else if (f < 225) {
    ex = 0.9; ey = 0.7; c = 0.5;
  } else {
    const v = f - 225;
    ex = 0.3; ey = 0.5; c = expoOut(v / 14);
  }
  return [ex, ey, c];
}

function Eye({cx, cy, ex, ey, c}: {cx: number; cy: number; ex: number; ey: number; c: number}) {
  const s = 1 - c * 0.92;
  return (
    <g transform={`translate(${cx} ${cy}) scale(1 ${s})`}>
      <ellipse rx={23} ry={24} fill="#FFFFFF" />
      <circle cx={ex * 9} cy={ey * 9} r={10} fill="#1E1E24" />
    </g>
  );
}

function Remote({x, y, r}: {x: number; y: number; r: number}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <rect x={-55} y={-22} width={110} height={44} rx={10} fill="#2A2A2E" />
      <circle cx={-32} cy={0} r={7} fill="#E04A3F" />
      <circle cx={-8} cy={0} r={7} fill="#F2C14E" />
      <circle cx={16} cy={0} r={7} fill="#6FCF97" />
      <rect x={34} y={-6} width={12} height={12} rx={3} fill="#8A8A92" />
    </g>
  );
}

export default function Comp() {
  const f = useCurrentFrame();
  const shot = f < 60 ? 1 : f < 150 ? 2 : f < 225 ? 3 : 4;

  // mood warna: hangat -> tegang -> dingin (gagal) -> kuning (gag)
  const pal: Record<number, [string, string]> = {
    1: ['#F4DDB0', '#D9A66B'],
    2: ['#F0B27A', '#C7834C'],
    3: ['#8DA9C4', '#5E7C99'],
    4: ['#F7E08A', '#D9B45A'],
  };
  const [wall, floor] = pal[shot];

  // kamera: 1 aksi per shot, cut on action
  let cx = 470, cy = 1060, sc = 1.1;
  if (shot === 1) {
    sc = 1.1 + 0.04 * (f / 60);
  } else if (shot === 2) {
    const t = (f - 60) / 90;
    cx = lerp(470, 560, t); cy = 1100; sc = 1.15 + 0.1 * t;
  } else if (shot === 3) {
    const u = (f - 150) / 75;
    cx = 880; cy = 1265; sc = 2.2 + 0.05 * u;
  } else {
    const v = (f - 225) / 75;
    cx = 250; cy = 890; sc = 1.9 + 0.1 * v;
  }

  // tangan + blur arah gerak
  const [hx, hy] = handAt(f);
  const [px] = handAt(f - 1);
  const armBlur = clamp(Math.abs(hx - px) * 0.12, 0, 8);
  const dist = Math.hypot(hx - SHOULDER[0], hy - SHOULDER[1]);
  const stretch = clamp(dist / 480);
  const sag = 70 * (1 - stretch);
  const armW = 46 - 12 * stretch;
  const v4 = f - 225;
  const th = shot === 4 ? spr((v4 - 56) / 30, 16, 0.4) : 0;

  // remote
  let rem = remoteAt(f);
  const remPrev = remoteAt(f - 1);
  let remBlurX = clamp(Math.abs(rem.x - remPrev.x) * 0.2, 0, 10);
  let remBlurY = 0;

  // kepala
  const [ex, ey, closed] = eyesAt(f);
  let dx = 0, dy = 0, sx = 1, sy = 1;
  if (f < 60) dx = 10 * expoOut((f - 18) / 12);
  else if (f < 225) dx = 10 + (f >= 84 && f < 120 ? Math.sin(f * 2.3) * 2 : 0);
  const breathe = f < 60 ? 1 + Math.sin(f * 0.12) * 0.02 : 1;

  // gag shot 4: remote jatuh pas orangnya udah nyerah
  let showFallRemote = false;
  if (shot === 4) {
    dy = 6 * expoOut((v4 - 10) / 12);
    const A = 5357;
    const y0 = 420, yHit = 794;
    const tHit = 40 / 30 + Math.sqrt((yHit - y0) / A);
    const tt = v4 / 30;
    showFallRemote = tt > 40 / 30;
    if (tt < tHit) {
      const tau = tt - 40 / 30;
      rem = {x: 195, y: y0 + A * tau * tau, r: 0};
      remBlurY = clamp(2 * A * tau * 0.003, 0, 9);
      remBlurX = 0;
    } else {
      const w = tt - tHit;
      rem = {
        x: 195,
        y: yHit - 55 * Math.exp(-4 * w) * Math.abs(Math.sin(w * 14)),
        r: 12 * (1 - Math.exp(-6 * w)),
      };
      remBlurX = 0;
      const q = 0.2 * Math.exp(-5 * w) * Math.cos(w * 25);
      sy = 1 - q; sx = 1 + q * 0.7;
    }
  }

  const H: [number, number] = [190 + dx, 900 + dy];

  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{background: wall}}>
      <defs>
        <filter id="armB" filterUnits="userSpaceOnUse" x={-500} y={-500} width={2500} height={3000}>
          <feGaussianBlur stdDeviation={`${armBlur} 0`} />
        </filter>
        <filter id="remB" filterUnits="userSpaceOnUse" x={-500} y={-500} width={2500} height={3000}>
          <feGaussianBlur stdDeviation={`${remBlurX} ${remBlurY}`} />
        </filter>
      </defs>
      <g transform={`translate(540 960) scale(${sc}) translate(${-cx} ${-cy})`}>
        {/* tembok & lantai */}
        <rect x={-800} y={-400} width={2800} height={1600} fill={wall} />
        <rect x={-800} y={1200} width={2800} height={1600} fill={floor} />

        {/* sofa */}
        <rect x={40} y={760} width={700} height={260} rx={40} fill="#A8432F" />
        <rect x={40} y={980} width={700} height={220} rx={36} fill="#C2543A" />
        <rect x={20} y={900} width={70} height={300} rx={30} fill="#8E3626" />

        {/* badan */}
        <g transform={`translate(410 940) scale(1 ${breathe}) translate(-410 -940)`}>
          <rect x={230} y={880} width={360} height={120} rx={60} fill="#2F5D62" />
        </g>
        <rect x={560} y={905} width={230} height={90} rx={45} fill="#3B3B52" />
        <circle cx={805} cy={950} r={42} fill="#E8E4DC" />

        {/* bayangan remote */}
        {shot < 4 && (
          <ellipse cx={rem.x} cy={1305} rx={70} ry={10} fill="#000000" opacity={0.18} />
        )}

        {/* remote di lantai */}
        {shot < 4 && (
          <g filter="url(#remB)">
            <Remote x={rem.x} y={rem.y} r={rem.r} />
          </g>
        )}

        {/* lengan */}
        <g filter="url(#armB)">
          <path
            d={`M ${SHOULDER[0]} ${SHOULDER[1]} Q ${(SHOULDER[0] + hx) / 2} ${(SHOULDER[1] + hy) / 2 + sag} ${hx} ${hy}`}
            stroke={SKIN}
            strokeWidth={armW}
            strokeLinecap="round"
            fill="none"
          />
          <circle cx={hx} cy={hy} r={34} fill={SKIN} />
          {th > 0.3 && <rect x={hx - 9} y={hy - 62} width={18} height={40} rx={9} fill={SKIN} />}
        </g>
        <circle cx={SHOULDER[0]} cy={SHOULDER[1]} r={46} fill="#2F5D62" />

        {/* kepala (squash & stretch) */}
        <g transform={`translate(${H[0]} 984) scale(${sx} ${sy}) translate(${-H[0]} -984)`}>
          <circle cx={H[0]} cy={H[1]} r={84} fill={SKIN} />
          <path
            d={`M ${H[0] - 84} ${H[1] - 8} A 84 84 0 0 1 ${H[0] + 84} ${H[1] - 8} Q ${H[0]} ${H[1] - 40} ${H[0] - 84} ${H[1] - 8} Z`}
            fill="#2A1E1A"
          />
          <Eye cx={H[0] - 28} cy={H[1] + 6} ex={ex} ey={ey} c={closed} />
          <Eye cx={H[0] + 30} cy={H[1] + 6} ex={ex} ey={ey} c={closed} />
          <ellipse
            cx={H[0] + 4}
            cy={H[1] + 50}
            rx={14}
            ry={shot === 4 && v4 > 48 ? 12 : 4}
            fill="#6B2E2E"
          />
        </g>

        {/* remote jatuh (gag) */}
        {shot === 4 && showFallRemote && (
          <g filter="url(#remB)">
            <Remote x={rem.x} y={rem.y} r={rem.r} />
          </g>
        )}
      </g>
    </svg>
  );
}