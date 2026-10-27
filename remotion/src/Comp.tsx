import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const meta = {
  id: "educational-motion",
  title: "Educational Motion",
  durationInFrames: 900,
  fps: 30,
  width: 720,
  height: 1280,
};

const W = 720;
const H = 1280;

const C = {
  bg: "#08132F",
  pink: "#FF718D",
  cream: "#FFF4D7",
  yellow: "#FFC247",
  orange: "#FF8C42",
  white: "#F8F7F2",
  muted: "#9AA9CA",
};

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const stars = Array.from({ length: 74 }, (_, i) => ({
  x: (i * 137.5 + 31) % W,
  y: (i * 83.7 + 17) % H,
  r: i % 7 === 0 ? 2 : i % 3 === 0 ? 1.4 : 0.8,
  phase: (i * 13) % 90,
}));

function Background() {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 52% 42%, #202447 0%, #08132F 67%)",
      }}
    >
      {stars.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: s.x,
            top: s.y,
            width: s.r * 2,
            height: s.r * 2,
            borderRadius: 99,
            background: "#D8E2FF",
            opacity:
              0.15 +
              0.35 * ((Math.sin((frame + s.phase) / 17) + 1) / 2),
          }}
        />
      ))}

      <div
        style={{
          position: "absolute",
          left: -130,
          top: 280,
          width: 980,
          height: 520,
          background:
            "radial-gradient(ellipse, rgba(255,94,137,.10), transparent 68%)",
          transform: `translateX(${Math.sin(frame / 95) * 22}px)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 125,
          background:
            "linear-gradient(180deg, #111B3B 0%, #080F27 100%)",
          borderTop: "2px solid rgba(255,255,255,.12)",
        }}
      />

      {Array.from({ length: 36 }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            bottom: 40 + (i % 3) * 17,
            left: i * 23 - ((frame * 1.2) % 23),
            width: 12,
            height: 5,
            borderRadius: 5,
            background: "#25345F",
            opacity: 0.9,
            transform: `rotate(${i % 2 ? 24 : -24}deg)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
}

function DayCard({
  value,
  sub,
  frame,
}: {
  value: string;
  sub: string;
  frame: number;
}) {
  const pop = spring({
    frame: Math.max(0, frame),
    fps: 30,
    config: { damping: 13, stiffness: 150 },
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 80,
        left: 52,
        width: 180,
        borderRadius: 13,
        overflow: "hidden",
        background: C.cream,
        color: "#18203B",
        boxShadow: "0 10px 30px #0005",
        transform: `translateY(${interpolate(pop, [0, 1], [22, 0])}px) scale(${interpolate(pop, [0, 1], [.92, 1])})`,
        opacity: pop,
      }}
    >
      <div
        style={{
          background: "#F44F67",
          color: "white",
          fontSize: 17,
          fontWeight: 900,
          letterSpacing: 2,
          textAlign: "center",
          padding: "7px 0",
        }}
      >
        HARI
      </div>

      <div
        style={{
          fontSize: 34,
          lineHeight: 1.05,
          fontWeight: 900,
          textAlign: "center",
          paddingTop: 8,
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          textAlign: "center",
          letterSpacing: 1,
          padding: "5px 0 12px",
        }}
      >
        {sub}
      </div>
    </div>
  );
}

function Bar({
  x,
  height,
  label,
  frame,
  delay = 0,
  color = C.pink,
}: {
  x: number;
  height: number;
  label: string;
  frame: number;
  delay?: number;
  color?: string;
}) {
  const p = spring({
    frame: Math.max(0, frame - delay),
    fps: 30,
    config: { damping: 18, stiffness: 95, mass: 0.9 },
  });

  const h = height * p;

  return (
    <g>
      <rect
        x={x - 4}
        y={790 - h}
        width={112}
        height={h}
        rx={5}
        fill={color}
        opacity={0.12}
      />

      <rect
        x={x}
        y={790 - h}
        width={104}
        height={h}
        rx={4}
        fill={color}
      />

      <rect
        x={x + 10}
        y={790 - h + 8}
        width={12}
        height={Math.max(0, h - 16)}
        fill="#FFFFFF"
        opacity={0.18}
      />

      {h > 36 &&
        Array.from({ length: Math.floor(h / 22) }, (_, i) => (
          <line
            key={i}
            x1={x + 4}
            x2={x + 100}
            y1={790 - h + i * 22 + 20}
            y2={790 - h + i * 22 + 20}
            stroke="#8D2849"
            strokeWidth={1.5}
            opacity={0.32}
          />
        ))}

      <text
        x={x + 52}
        y={790 - h - 20}
        textAnchor="middle"
        fontSize="21"
        fontWeight="900"
        fill={C.yellow}
      >
        {label}
      </text>
    </g>
  );
}

function TinyPerson({
  x,
  y,
  frame,
}: {
  x: number;
  y: number;
  frame: number;
}) {
  const bob = Math.sin(frame / 5) * 3;
  const walk = Math.sin(frame / 3.4) * 8;

  return (
    <g transform={`translate(${x},${y + bob})`}>
      <ellipse
        cx="0"
        cy="0"
        rx="17"
        ry="4"
        fill="#020817"
        opacity=".4"
      />

      <circle cx="0" cy="-45" r="12" fill="#F2C8A5" />

      <path
        d="M-11 -49 Q-10 -63 2 -59 Q13 -57 11 -47"
        fill="#302A3C"
      />

      <circle cx="4" cy="-45" r="1.5" fill="#17203C" />

      <path
        d="M-8 -31 Q0 -37 8 -31 L11 -7 L-11 -7 Z"
        fill="#9E8BFF"
      />

      <path
        d={`M-6 -7 L${-9 + walk * .4} 12 M6 -7 L${9 - walk * .4} 12`}
        stroke="#E8E7FF"
        strokeWidth="5"
        strokeLinecap="round"
      />

      <path
        d={`M-8 -27 L${-16 - walk * .35} -14 M8 -27 L${16 + walk * .35} -17`}
        stroke="#F2C8A5"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </g>
  );
}

export const Comp: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const intro = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 110 },
  });

  const headlineOpacity = interpolate(
    frame,
    [8, 24, 90, 110],
    [0, 1, 1, 0],
    clamp
  );

  const counter = Math.round(
    interpolate(
      frame,
      [0, 150, 300, 450, 600, 750, 899],
      [1, 12, 68, 1043, 413152, 739891, 1000000],
      clamp
    )
  );

  const chartShift = interpolate(
    frame,
    [180, 430, 700, 899],
    [0, -45, -95, -140],
    clamp
  );

  const pulse = 1 + Math.sin(frame / 7) * 0.025;

  return (
    <AbsoluteFill
      style={{
        width: W,
        height: H,
        overflow: "hidden",
        fontFamily: "Arial, Helvetica, sans-serif",
        color: C.white,
      }}
    >
      <Background />

      <DayCard
        value={counter.toLocaleString("id-ID")}
        sub={
          frame < 150
            ? "TAHUN 1 M"
            : frame < 360
              ? "TAHUN 3 M"
              : "PERJALANAN WAKTU"
        }
        frame={frame}
      />

      <div
        style={{
          position: "absolute",
          top: 205,
          left: 52,
          right: 45,
          textAlign: "left",
          opacity: headlineOpacity,
          transform: `translateY(${interpolate(frame, [8, 28], [20, 0], clamp)}px)`,
        }}
      >
        <div
          style={{
            fontSize: 23,
            fontWeight: 800,
            color: C.cream,
            letterSpacing: 2,
          }}
        >
          BAYANGKAN JIKA
        </div>

        <div
          style={{
            fontSize: 56,
            fontWeight: 1000,
            lineHeight: 1.04,
            color: C.yellow,
            textShadow: "0 4px 22px #FF9A3040",
          }}
        >
          WAKTU TERUS
        </div>

        <div
          style={{
            fontSize: 56,
            fontWeight: 1000,
            lineHeight: 1.04,
            color: C.yellow,
          }}
        >
          BERJALAN
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 790,
          height: 3,
          background: "#D6D9E8",
          opacity: 0.7,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 794,
          height: 3,
          background: C.pink,
          opacity: 0.8,
        }}
      />

      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{
          position: "absolute",
          inset: 0,
          overflow: "visible",
          transform: `translateX(${chartShift}px)`,
        }}
      >
        <Bar x={90} height={125} label="12" frame={frame} delay={25} />
        <Bar x={245} height={230} label="68" frame={frame} delay={65} />
        <Bar x={400} height={330} label="1.043" frame={frame} delay={110} />
        <Bar
          x={555}
          height={410}
          label="1 M"
          frame={frame}
          delay={155}
          color={C.orange}
        />

        <line
          x1="0"
          y1="790"
          x2="850"
          y2="790"
          stroke="#F2F3FA"
          strokeWidth="2"
          opacity=".75"
        />

        {[0, 200, 400, 600, 800].map((n) => (
          <g key={n}>
            <line
              x1={n}
              x2={n}
              y1="790"
              y2="803"
              stroke="#F2F3FA"
              strokeWidth="2"
              opacity=".7"
            />
            <text
              x={n}
              y="827"
              fill={C.muted}
              fontSize="14"
              textAnchor="middle"
            >
              {n}
            </text>
          </g>
        ))}

        <TinyPerson x={210} y={790} frame={frame} />
      </svg>

      <div
        style={{
          position: "absolute",
          top: 875,
          left: 52,
          right: 52,
          opacity: interpolate(
            frame,
            [115, 135, 245, 270],
            [0, 1, 1, 0],
            clamp
          ),
        }}
      >
        <div
          style={{
            fontSize: 20,
            color: C.cream,
            fontWeight: 800,
            letterSpacing: 1,
          }}
        >
          AWALNYA TERASA BIASA
        </div>

        <div
          style={{
            fontSize: 44,
            color: C.yellow,
            fontWeight: 1000,
            lineHeight: 1.1,
            marginTop: 8,
          }}
        >
          TAPI ANGKANYA
        </div>

        <div
          style={{
            fontSize: 44,
            color: C.yellow,
            fontWeight: 1000,
            lineHeight: 1.1,
          }}
        >
          TERUS MEMBESAR
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 875,
          left: 52,
          right: 52,
          opacity: interpolate(
            frame,
            [265, 290, 430, 450],
            [0, 1, 1, 0],
            clamp
          ),
        }}
      >
        <div
          style={{
            fontSize: 20,
            color: C.cream,
            fontWeight: 800,
          }}
        >
          SETELAH BERTAHUN-TAHUN
        </div>

        <div
          style={{
            fontSize: 64,
            color: C.yellow,
            fontWeight: 1000,
            lineHeight: 1.1,
          }}
        >
          1.000.000+
        </div>

        <div
          style={{
            fontSize: 23,
            color: C.white,
            fontWeight: 700,
            marginTop: 10,
          }}
        >
          Perubahan kecil bisa jadi besar.
        </div>
      </div>

      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{
          position: "absolute",
          inset: 0,
          opacity: interpolate(
            frame,
            [420, 455, 850, 880],
            [0, 1, 1, 0],
            clamp
          ),
        }}
      >
        <path
          d="M65 1050 L650 1050 L650 870 Z"
          fill={C.pink}
          opacity=".10"
        />

        <path
          d={`M65 1050 L${interpolate(
            frame,
            [430, 700, 850],
            [65, 360, 650],
            clamp
          )} ${interpolate(
            frame,
            [430, 700, 850],
            [1050, 965, 870],
            clamp
          )}`}
          stroke={C.pink}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />

        <circle
          cx={interpolate(
            frame,
            [430, 700, 850],
            [65, 360, 650],
            clamp
          )}
          cy={interpolate(
            frame,
            [430, 700, 850],
            [1050, 965, 870],
            clamp
          )}
          r={9 * pulse}
          fill={C.yellow}
        />

        <text x="65" y="1090" fill={C.muted} fontSize="17">
          AWAL
        </text>

        <text
          x="650"
          y="1090"
          fill={C.muted}
          fontSize="17"
          textAnchor="end"
        >
          SEKARANG
        </text>

        <text
          x="360"
          y="820"
          fill={C.yellow}
          fontSize="43"
          fontWeight="900"
          textAnchor="middle"
        >
          TERUS MENINGKAT
        </text>

        <text
          x="360"
          y="860"
          fill={C.cream}
          fontSize="22"
          fontWeight="700"
          textAnchor="middle"
        >
          sedikit demi sedikit
        </text>
      </svg>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `rgba(5, 12, 31, ${interpolate(
            frame,
            [850, 885],
            [0, 0.72],
            clamp
          )})`,
          opacity: interpolate(frame, [850, 875], [0, 1], clamp),
        }}
      >
        <div
          style={{
            fontSize: 23,
            color: C.cream,
            fontWeight: 800,
            letterSpacing: 4,
          }}
        >
          INTINYA
        </div>

        <div
          style={{
            marginTop: 15,
            fontSize: 62,
            fontWeight: 1000,
            color: C.yellow,
            textAlign: "center",
            lineHeight: 1.05,
          }}
        >
          HAL BESAR
          <br />
          BUTUH WAKTU
        </div>

        <div
          style={{
            marginTop: 24,
            width: 230,
            height: 5,
            borderRadius: 5,
            background: C.pink,
            transform: `scaleX(${intro})`,
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 28,
          right: 32,
          fontSize: 13,
          letterSpacing: 2,
          color: "#A7B2D2",
          fontWeight: 800,
          opacity: 0.65,
        }}
      >
        INFO MOTION • 2D
      </div>
    </AbsoluteFill>
  );
};

export default Comp;