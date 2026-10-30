/**
 * KineticTypography.tsx — SATU FILE, siap pakai.
 * 15 detik • 9:16 • 1080x1920 • 30 fps • 120 BPM • hitam / putih / merah
 *
 * PASANG (src/Root.tsx):
 *   import {Composition} from 'remotion';
 *   import {KineticTypography, KINETIC_CONFIG} from './KineticTypography';
 *
 *   export const RemotionRoot = () => (
 *     <Composition id={KINETIC_CONFIG.id} component={KineticTypography}
 *       durationInFrames={KINETIC_CONFIG.durationInFrames} fps={KINETIC_CONFIG.fps}
 *       width={KINETIC_CONFIG.width} height={KINETIC_CONFIG.height} />
 *   );
 *
 * MUSIK: taruh beat.wav / lagu 120 BPM di /public, lalu isi AUDIO_SRC di bawah.
 * RENDER: npx remotion render src/index.ts KineticTypography out/kinetic.mp4 --codec=h264 --crf=16
 */
import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/* ───────────────────────── CONFIG ───────────────────────── */

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION_IN_FRAMES = 450;
const BPM = 120;
const BEAT = (FPS * 60) / BPM; // 15 frame

// Contoh: 'beat.wav' (file di /public). null = tanpa audio.
const AUDIO_SRC: string | null = null;
const AUDIO_START_FROM_SEC = 0;

const SAFE_X = 80;
const SAFE_Y = 220;
const MAX_TEXT_WIDTH = WIDTH - SAFE_X * 2;
const SHOW_SAFE_GUIDES = false;

const COLORS = {black: '#050505', white: '#F5F3EE', red: '#E10B1F'};

const SCENES = {
  hook: {from: 0, dur: 60},
  hours: {from: 60, dur: 90},
  pillars: {from: 150, dur: 90},
  start: {from: 240, dur: 120},
  cta: {from: 360, dur: 90},
} as const;
const CUTS = [60, 150, 240, 360];

export const meta = {
  id: 'KineticTypography',
  title: 'Kinetic Typography 15s',
  width: WIDTH,
  height: HEIGHT,
  fps: FPS,
  durationInFrames: DURATION_IN_FRAMES,
};

export const KINETIC_CONFIG = {
  id: 'KineticTypography',
  durationInFrames: DURATION_IN_FRAMES,
  fps: FPS,
  width: WIDTH,
  height: HEIGHT,
};

/* ───────────────────────── FONTS ───────────────────────── */

// Tanpa import font eksternal (biar jalan di Remotion Studio HP): pakai font sistem tebal.
const DISPLAY = `Anton, Impact, 'Arial Narrow Bold', 'Roboto Condensed', 'Arial Black', sans-serif`;
const BODY = `Inter, Roboto, 'Helvetica Neue', Arial, sans-serif`;

/* ───────────────────────── HELPERS ───────────────────────── */

const clampOpts = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const easeOutExpo = Easing.bezier(0.16, 1, 0.3, 1);
const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

const progress = (
  frame: number,
  start: number,
  dur: number,
  easing: (t: number) => number = easeOutExpo,
) => interpolate(frame, [start, start + dur], [0, 1], {...clampOpts, easing});

const beatPulse = (frame: number, decay = 7) => {
  const phase = (((frame % BEAT) + BEAT) % BEAT) / BEAT;
  return Math.exp(-phase * decay);
};

const fitFontSize = (text: string, desired: number, maxWidth = MAX_TEXT_WIDTH, charWidth = 0.52) =>
  Math.min(desired, Math.floor(maxWidth / (text.length * charWidth)));

/* ───────────────────────── KOMPONEN ───────────────────────── */

const MaskReveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down';
  style?: React.CSSProperties;
}> = ({children, delay = 0, duration = 14, direction = 'up', style}) => {
  const frame = useCurrentFrame();
  const p = progress(frame, delay, duration, easeOutExpo);
  const from = direction === 'up' ? 115 : -115;
  return (
    <div style={{overflow: 'hidden', padding: '0.04em 0', ...style}}>
      <div style={{transform: `translateY(${(1 - p) * from}%)`}}>{children}</div>
    </div>
  );
};

const SlamWord: React.FC<{
  text: string;
  start: number;
  size: number;
  color?: string;
  rotateFrom?: number;
  fromScale?: number;
  letterSpacing?: string;
}> = ({text, start, size, color = COLORS.white, rotateFrom = -5, fromScale = 2.4, letterSpacing = '0'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = Math.max(0, frame - start);
  const s = spring({frame: local, fps, config: {damping: 13, stiffness: 240, mass: 0.55}});
  const opacity = interpolate(frame, [start, start + 2], [0, 1], clampOpts);
  const scale = interpolate(s, [0, 1], [fromScale, 1]);
  const rotate = interpolate(s, [0, 1], [rotateFrom, 0]);
  const blur = interpolate(local, [0, 7], [16, 0], clampOpts);
  return (
    <div
      style={{
        fontFamily: DISPLAY,
        fontSize: size,
        lineHeight: 0.98,
        color,
        letterSpacing,
        whiteSpace: 'nowrap',
        opacity,
        transform: `scale(${scale}) rotate(${rotate}deg)`,
        filter: `blur(${blur}px)`,
      }}
    >
      {text}
    </div>
  );
};

const Letters: React.FC<{
  text: string;
  size: number;
  color: string;
  delay: number;
  stagger?: number;
  duration?: number;
}> = ({text, size, color, delay, stagger = 3, duration = 16}) => (
  <div style={{display: 'flex', justifyContent: 'center'}}>
    {text.split('').map((ch, i) => (
      <MaskReveal key={i} delay={delay + i * stagger} duration={duration}>
        <span
          style={{
            display: 'block',
            fontFamily: DISPLAY,
            fontSize: size,
            lineHeight: 1.05,
            color,
            whiteSpace: 'pre',
          }}
        >
          {ch}
        </span>
      </MaskReveal>
    ))}
  </div>
);

const WIPE_HALF = 8;
const WipePanel: React.FC = () => {
  const f = useCurrentFrame();
  const y =
    f < WIPE_HALF
      ? interpolate(f, [0, WIPE_HALF], [100, 0], {...clampOpts, easing: Easing.in(Easing.quad)})
      : interpolate(f, [WIPE_HALF, WIPE_HALF * 2], [0, -100], {...clampOpts, easing: Easing.out(Easing.quad)});
  return (
    <AbsoluteFill style={{transform: `translateY(${y}%)`, backgroundColor: COLORS.red}}>
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 10, backgroundColor: COLORS.white}} />
      <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 10, backgroundColor: COLORS.white}} />
    </AbsoluteFill>
  );
};
const Wipe: React.FC<{at: number}> = ({at}) => (
  <Sequence from={at - WIPE_HALF} durationInFrames={WIPE_HALF * 2}>
    <WipePanel />
  </Sequence>
);

const corner = (pos: React.CSSProperties): React.CSSProperties => ({
  position: 'absolute',
  width: 44,
  height: 44,
  borderStyle: 'solid',
  borderColor: COLORS.white,
  borderWidth: 0,
  opacity: 0.45,
  ...pos,
});

const HUD: React.FC = () => {
  const frame = useCurrentFrame();
  const prog = interpolate(frame, [0, DURATION_IN_FRAMES - 1], [0, 1], clampOpts);
  const beatIdx = Math.floor(frame / BEAT) % 4;
  const pulse = beatPulse(frame);
  return (
    <AbsoluteFill>
      <div style={corner({top: 48, left: 48, borderTopWidth: 3, borderLeftWidth: 3})} />
      <div style={corner({top: 48, right: 48, borderTopWidth: 3, borderRightWidth: 3})} />
      <div style={corner({bottom: 48, left: 48, borderBottomWidth: 3, borderLeftWidth: 3})} />
      <div style={corner({bottom: 48, right: 48, borderBottomWidth: 3, borderRightWidth: 3})} />
      <div
        style={{
          position: 'absolute',
          top: 96,
          left: SAFE_X,
          right: SAFE_X,
          height: 4,
          backgroundColor: 'rgba(245,243,238,0.18)',
        }}
      >
        <div style={{width: `${prog * 100}%`, height: '100%', backgroundColor: COLORS.red}} />
      </div>
      <div style={{position: 'absolute', top: 120, right: SAFE_X, display: 'flex', gap: 8}}>
        {[0, 1, 2, 3].map((i) => {
          const active = i === beatIdx;
          return (
            <div
              key={i}
              style={{
                width: 14,
                height: 14,
                backgroundColor: active ? COLORS.red : 'rgba(245,243,238,0.25)',
                transform: `scale(${active ? 1 + 0.4 * pulse : 1})`,
              }}
            />
          );
        })}
      </div>
      {SHOW_SAFE_GUIDES ? (
        <div
          style={{
            position: 'absolute',
            left: SAFE_X,
            right: SAFE_X,
            top: SAFE_Y,
            bottom: SAFE_Y,
            border: '2px dashed rgba(0,255,255,0.7)',
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 100%)'}}
  />
);

/* ───────────────────────── SCENE 1: HOOK (0–2 dtk) ───────────────────────── */

const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, SCENES.hook.dur], [1, 1.1], clampOpts);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${zoom})`}}>
        <SlamWord text="BERHENTI" start={0} size={fitFontSize('BERHENTI', 230)} rotateFrom={-5} />
        <div style={{paddingLeft: '0.35em', margin: '14px 0'}}>
          <SlamWord text="JADI" start={BEAT} size={120} letterSpacing="0.35em" rotateFrom={4} fromScale={1.8} />
        </div>
        <SlamWord
          text="PENONTON."
          start={BEAT * 2}
          size={fitFontSize('PENONTON.', 230)}
          color={COLORS.red}
          rotateFrom={-3}
        />
      </div>
    </AbsoluteFill>
  );
};

/* ───────────────────────── SCENE 2: 24 JAM (2–5 dtk) ───────────────────────── */

const HoursScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: Math.max(0, frame - BEAT), fps, config: {damping: 11, stiffness: 200, mass: 0.7}});
  const heroOpacity = interpolate(frame, [BEAT, BEAT + 2], [0, 1], clampOpts);
  const drift = progress(frame, BEAT + 10, 80, easeInOut);
  const heroScale = interpolate(s, [0, 1], [0.35, 1]) + drift * 0.08;
  const heroRot = interpolate(s, [0, 1], [-9, 0]) - drift * 2;
  const lineP = progress(frame, BEAT * 2, 14, easeOutExpo);

  const support: React.CSSProperties = {
    fontFamily: DISPLAY,
    fontSize: 100,
    lineHeight: 1.05,
    color: COLORS.white,
    letterSpacing: '0.03em',
    whiteSpace: 'nowrap',
    textAlign: 'center',
  };

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <MaskReveal delay={0}>
        <div style={{...support, fontSize: 110, letterSpacing: '0.12em', paddingLeft: '0.12em'}}>LU PUNYA</div>
      </MaskReveal>
      <div
        style={{
          fontFamily: DISPLAY,
          fontSize: fitFontSize('24 JAM', 340),
          lineHeight: 1,
          color: COLORS.red,
          whiteSpace: 'nowrap',
          opacity: heroOpacity,
          transform: `scale(${heroScale}) rotate(${heroRot}deg)`,
          margin: '10px 0 24px',
        }}
      >
        24 JAM
      </div>
      <div
        style={{
          width: 520,
          height: 8,
          backgroundColor: COLORS.white,
          transform: `scaleX(${lineP})`,
          transformOrigin: 'left center',
          marginBottom: 36,
        }}
      />
      <MaskReveal delay={BEAT * 3}>
        <div style={support}>SAMA KAYA</div>
      </MaskReveal>
      <MaskReveal delay={BEAT * 4}>
        <div style={support}>
          ORANG SUKSES<span style={{color: COLORS.red}}>.</span>
        </div>
      </MaskReveal>
    </AbsoluteFill>
  );
};

/* ───────────────────────── SCENE 3: PILAR (5–8 dtk) ───────────────────────── */

const WORD_DUR = 30;
const PILLARS = [
  {word: 'FOKUS.', size: 330, color: COLORS.white, rotateFrom: -7},
  {word: 'KONSISTEN.', size: 230, color: COLORS.red, rotateFrom: 6},
  {word: 'EKSEKUSI.', size: 250, color: COLORS.white, rotateFrom: -5},
];

const Pillar: React.FC<{index: number; word: string; size: number; color: string; rotateFrom: number}> = ({
  index,
  word,
  size,
  color,
  rotateFrom,
}) => {
  const f = useCurrentFrame();
  const fs = fitFontSize(word, size);
  const enter = interpolate(f, [0, 9], [0.55, 1], {...clampOpts, easing: easeOutExpo});
  const hold = interpolate(f, [9, WORD_DUR], [0, 0.12], clampOpts);
  const exit = interpolate(f, [WORD_DUR - 6, WORD_DUR], [0, 0.7], {...clampOpts, easing: easeInOut});
  const scale = enter + hold + exit + 0.04 * beatPulse(f, 9);
  const rotate = interpolate(f, [0, 9], [rotateFrom, 0], {...clampOpts, easing: easeOutExpo});
  const opacity =
    interpolate(f, [0, 3], [0, 1], clampOpts) * interpolate(f, [WORD_DUR - 6, WORD_DUR], [1, 0], clampOpts);
  const ghostScale = 1.5 + interpolate(f, [0, WORD_DUR], [0, 0.25], clampOpts);

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div
        style={{
          position: 'absolute',
          fontFamily: DISPLAY,
          fontSize: fs,
          lineHeight: 1,
          color: 'transparent',
          WebkitTextStroke: `3px ${COLORS.white}`,
          whiteSpace: 'nowrap',
          opacity: 0.14 * opacity,
          transform: `scale(${ghostScale}) rotate(${-rotate * 0.6}deg)`,
        }}
      >
        {word}
      </div>
      <div style={{opacity, transform: `scale(${scale}) rotate(${rotate}deg)`, textAlign: 'center'}}>
        <div
          style={{
            fontFamily: BODY,
            fontWeight: 700,
            fontSize: 34,
            letterSpacing: '0.3em',
            color: COLORS.red,
            marginBottom: 20,
            paddingLeft: '0.3em',
          }}
        >
          0{index + 1} / 03
        </div>
        <div style={{fontFamily: DISPLAY, fontSize: fs, lineHeight: 1, color, whiteSpace: 'nowrap'}}>{word}</div>
      </div>
    </AbsoluteFill>
  );
};

const PillarsScene: React.FC = () => (
  <AbsoluteFill>
    {PILLARS.map((p, i) => (
      <Sequence key={p.word} from={i * WORD_DUR} durationInFrames={WORD_DUR}>
        <Pillar index={i} {...p} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

/* ───────────────────────── SCENE 4: MULAI (8–12 dtk) ───────────────────────── */

const StartScene: React.FC = () => {
  const frame = useCurrentFrame();
  const groupZoom = 1 + 0.1 * progress(frame, BEAT * 4, 60, easeInOut);
  const groupRot = -2.5 * progress(frame, BEAT * 2, 90, easeInOut);
  const barP = progress(frame, BEAT * 2, 14, easeOutExpo);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `scale(${groupZoom}) rotate(${groupRot}deg)`,
        }}
      >
        <Letters text="MULAI" size={fitFontSize('MULAI', 380)} color={COLORS.white} delay={0} stagger={3} />
        <div
          style={{
            width: 760,
            height: 14,
            backgroundColor: COLORS.red,
            transform: `scaleX(${barP})`,
            transformOrigin: 'left center',
            margin: '10px 0 22px',
          }}
        />
        <MaskReveal delay={BEAT * 3}>
          <div
            style={{
              fontFamily: DISPLAY,
              fontSize: 100,
              lineHeight: 1.05,
              letterSpacing: '0.2em',
              paddingLeft: '0.2em',
              color: COLORS.white,
              whiteSpace: 'nowrap',
            }}
          >
            DARI YANG
          </div>
        </MaskReveal>
        <Letters text="ADA." size={fitFontSize('ADA.', 380)} color={COLORS.red} delay={BEAT * 4} stagger={4} />
      </div>
    </AbsoluteFill>
  );
};

/* ───────────────────────── SCENE 5: CTA (12–15 dtk) ───────────────────────── */

const CTA_WORD = 'SEKARANG.';
const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const fs = fitFontSize(CTA_WORD, 400);
  const reveal = progress(frame, 0, 18, easeOutExpo);
  const scale = interpolate(reveal, [0, 1], [1.15, 1], clampOpts);
  const echoP = progress(frame, BEAT, 16, easeOutExpo);
  const barP = progress(frame, BEAT * 2, 12, easeOutExpo);

  const echo: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: DISPLAY,
    fontSize: fs,
    lineHeight: 1,
    color: 'transparent',
    WebkitTextStroke: `3px ${COLORS.white}`,
    whiteSpace: 'nowrap',
  };

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{position: 'relative', width: '100%', height: fs * 1.2}}>
        <div style={{...echo, top: -fs * 0.95 * echoP, opacity: 0.12 * echoP}}>{CTA_WORD}</div>
        <div style={{...echo, top: fs * 0.95 * echoP, opacity: 0.07 * echoP}}>{CTA_WORD}</div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            textAlign: 'center',
            fontFamily: DISPLAY,
            fontSize: fs,
            lineHeight: 1,
            color: COLORS.white,
            whiteSpace: 'nowrap',
            clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)`,
            transform: `scale(${scale})`,
          }}
        >
          SEKARANG<span style={{color: COLORS.red}}>.</span>
        </div>
      </div>
      <div
        style={{
          width: 120,
          height: 6,
          backgroundColor: COLORS.red,
          transform: `scaleX(${barP})`,
          margin: '70px 0 34px',
        }}
      />
      <MaskReveal delay={BEAT * 2 + 6}>
        <div
          style={{
            fontFamily: BODY,
            fontWeight: 700,
            fontSize: 44,
            letterSpacing: '0.22em',
            paddingLeft: '0.22em',
            color: COLORS.white,
            whiteSpace: 'nowrap',
          }}
        >
          KOMEN <span style={{color: COLORS.red}}>•</span> SHARE <span style={{color: COLORS.red}}>•</span> FOLLOW
        </div>
      </MaskReveal>
    </AbsoluteFill>
  );
};

/* ───────────────────────── COMPOSITION UTAMA ───────────────────────── */

export const KineticTypography: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = beatPulse(frame);
  const flash = 0.08 * Math.exp(-(frame % (BEAT * 4)) * 0.45);

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.black}}>
      {AUDIO_SRC ? (
        <Audio
          src={staticFile(AUDIO_SRC)}
          startFrom={Math.round(AUDIO_START_FROM_SEC * FPS)}
          volume={(f) => interpolate(f, [DURATION_IN_FRAMES - 15, DURATION_IN_FRAMES], [1, 0], clampOpts)}
        />
      ) : null}

      <AbsoluteFill style={{transform: `scale(${1 + 0.012 * pulse})`}}>
        <Sequence from={SCENES.hook.from} durationInFrames={SCENES.hook.dur}>
          <HookScene />
        </Sequence>
        <Sequence from={SCENES.hours.from} durationInFrames={SCENES.hours.dur}>
          <HoursScene />
        </Sequence>
        <Sequence from={SCENES.pillars.from} durationInFrames={SCENES.pillars.dur}>
          <PillarsScene />
        </Sequence>
        <Sequence from={SCENES.start.from} durationInFrames={SCENES.start.dur}>
          <StartScene />
        </Sequence>
        <Sequence from={SCENES.cta.from} durationInFrames={SCENES.cta.dur}>
          <CtaScene />
        </Sequence>
      </AbsoluteFill>

      <Vignette />
      <AbsoluteFill style={{backgroundColor: COLORS.white, opacity: flash}} />
      {CUTS.map((at) => (
        <Wipe key={at} at={at} />
      ))}
      <HUD />
    </AbsoluteFill>
  );
};

export default KineticTypography;