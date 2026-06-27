"use client";

import type { OppStyle, Player, Pos, Side } from "@/lib/types";
import { BALL_R, R } from "@/lib/board";

// ---- CSS background for the small HTML chips (bench + drag ghost) ----
export function chipBackground(side: Side, awayColor: string, awayStyle: OppStyle): string {
  if (side === "home") {
    return "repeating-linear-gradient(90deg, var(--home-blue) 0 24%, var(--home-red) 24% 50%)";
  }
  if (awayStyle === "stripe") {
    return `repeating-linear-gradient(90deg, ${awayColor} 0 24%, #ffffff 24% 50%)`;
  }
  return awayColor;
}

// ---- SVG stripes clipped to the token circle ----
function Stripes({
  cx,
  cy,
  r,
  colors,
  clipId,
}: {
  cx: number;
  cy: number;
  r: number;
  colors: string[];
  clipId: string;
}) {
  const n = 5;
  const w = (2 * r) / n;
  return (
    <g clipPath={`url(#${clipId})`}>
      {Array.from({ length: n }).map((_, i) => (
        <rect
          key={i}
          x={cx - r + i * w}
          y={cy - r}
          width={w + 0.6}
          height={2 * r}
          fill={colors[i % colors.length]}
        />
      ))}
    </g>
  );
}

export function PitchPlayer({
  player,
  awayColor,
  awayStyle,
  selected,
  dragging,
  onPointerDown,
  onRemove,
  pointerActive,
}: {
  player: Player;
  awayColor: string;
  awayStyle: OppStyle;
  selected: boolean;
  dragging: boolean;
  pointerActive: boolean;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  onRemove: (id: string) => void;
}) {
  if (!player.pos) return null;
  const { x: cx, y: cy } = player.pos;
  const clipId = `clip-${player.id}`;
  const isHome = player.side === "home";

  const stripeColors = isHome
    ? ["var(--home-blue)", "var(--home-red)"]
    : [awayColor, "#ffffff"];
  const striped = isHome || awayStyle === "stripe";

  const label =
    player.name.length > 10 ? player.name.slice(0, 9) + "…" : player.name;
  const fs = R * 0.46;
  const pillW = label ? label.length * fs * 0.62 + fs * 1.2 : 0;

  return (
    <g
      onPointerDown={(e) => onPointerDown(e, player.id)}
      style={{
        cursor: pointerActive ? "grab" : "default",
        pointerEvents: pointerActive ? "auto" : "none",
        transformBox: "fill-box",
        transformOrigin: "center",
        transform: dragging ? "scale(1.1)" : "none",
        transition: dragging ? "none" : "transform .1s ease",
        filter: "drop-shadow(0 3px 3px rgba(0,0,0,0.45))",
      }}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={R} />
        </clipPath>
      </defs>

      {/* selection halo */}
      {selected && (
        <circle cx={cx} cy={cy} r={R + 7} fill="none" stroke="var(--accent)" strokeWidth={3} />
      )}

      {/* base fill */}
      {striped ? (
        <Stripes cx={cx} cy={cy} r={R} colors={stripeColors} clipId={clipId} />
      ) : (
        <circle cx={cx} cy={cy} r={R} fill={awayColor} />
      )}

      {/* kit collar (white ring) + dark outline so any kit separates from grass */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#ffffff" strokeWidth={4.5} />
      <circle cx={cx} cy={cy} r={R + 1.5} fill="none" stroke="#0b1220" strokeWidth={2} />

      {/* number — white with dark outline reads on blue, red, white, yellow alike */}
      <text
        x={cx}
        y={cy}
        dy="0.34em"
        textAnchor="middle"
        className="font-display tnum"
        fontWeight={700}
        fontSize={R * 0.96}
        fill="#ffffff"
        stroke="#0b1220"
        strokeWidth={0.7}
        style={{ paintOrder: "stroke" }}
      >
        {player.number}
      </text>

      {/* name pill */}
      {label && (
        <g>
          <rect
            x={cx - pillW / 2}
            y={cy + R + 3}
            width={pillW}
            height={fs * 1.8}
            rx={fs * 0.9}
            fill="rgba(15,23,42,0.92)"
            stroke="rgba(148,163,184,0.35)"
            strokeWidth={0.75}
          />
          <text
            x={cx}
            y={cy + R + 3 + fs * 1.22}
            textAnchor="middle"
            fontSize={fs}
            fill="var(--ink)"
            fontWeight={600}
          >
            {label}
          </text>
        </g>
      )}

      {/* remove (×) badge — only when selected */}
      {selected &&
        (() => {
          const bx = cx + R * 0.72;
          const by = cy - R * 0.72;
          const br = R * 0.5;
          const k = R * 0.2;
          return (
            <g
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove(player.id);
              }}
              style={{ cursor: "pointer" }}
            >
              <circle cx={bx} cy={by} r={br} fill="var(--danger)" stroke="#ffffff" strokeWidth={2.5} />
              <g stroke="#ffffff" strokeWidth={3} strokeLinecap="round">
                <line x1={bx - k} y1={by - k} x2={bx + k} y2={by + k} />
                <line x1={bx - k} y1={by + k} x2={bx + k} y2={by - k} />
              </g>
            </g>
          );
        })()}
    </g>
  );
}

export function PitchBall({
  ball,
  dragging,
  onPointerDown,
  pointerActive,
}: {
  ball: Pos;
  dragging: boolean;
  pointerActive: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  const { x: cx, y: cy } = ball;
  const r = BALL_R;
  // simple classic football: white circle, central black pentagon + spokes
  const pent = Array.from({ length: 5 }).map((_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return [cx + r * 0.34 * Math.cos(a), cy + r * 0.34 * Math.sin(a)];
  });
  const spokes = Array.from({ length: 5 }).map((_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5 + Math.PI / 5;
    return [cx + r * 0.92 * Math.cos(a), cy + r * 0.92 * Math.sin(a)];
  });
  const pentPath = "M" + pent.map((p) => `${p[0]},${p[1]}`).join(" L") + " Z";

  return (
    <g
      onPointerDown={onPointerDown}
      style={{
        cursor: pointerActive ? "grab" : "default",
        pointerEvents: pointerActive ? "auto" : "none",
        transformBox: "fill-box",
        transformOrigin: "center",
        transform: dragging ? "scale(1.15)" : "none",
        transition: dragging ? "none" : "transform .1s ease",
        filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.55))",
      }}
    >
      <circle cx={cx} cy={cy} r={r} fill="#ffffff" stroke="#0b1220" strokeWidth={1.5} />
      <path d={pentPath} fill="#111827" />
      {pent.map((p, i) => (
        <line
          key={i}
          x1={p[0]}
          y1={p[1]}
          x2={spokes[i][0]}
          y2={spokes[i][1]}
          stroke="#111827"
          strokeWidth={1.4}
        />
      ))}
    </g>
  );
}

// ---- HTML chip for the bench and the drag ghost ----
export function ChipToken({
  player,
  awayColor,
  awayStyle,
  size = 46,
  dimmed = false,
}: {
  player: Player;
  awayColor: string;
  awayStyle: OppStyle;
  size?: number;
  dimmed?: boolean;
}) {
  return (
    <div
      className="relative grid place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: chipBackground(player.side, awayColor, awayStyle),
        boxShadow: "inset 0 0 0 3px #fff, inset 0 0 0 4.5px #0b1220, 0 2px 4px rgba(0,0,0,0.4)",
        opacity: dimmed ? 0.4 : 1,
      }}
    >
      <span
        className="font-display tnum font-bold"
        style={{
          fontSize: size * 0.42,
          color: "#fff",
          textShadow: "0 0 2px #0b1220, 0 0 2px #0b1220",
        }}
      >
        {player.number}
      </span>
    </div>
  );
}
