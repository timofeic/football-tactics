"use client";

import { useEffect, useRef, useState } from "react";
import type { BoardState, Pos, Shape, Side, Tool } from "@/lib/types";
import {
  AWAY_COLORS,
  BALL_R,
  DRAW_COLORS,
  MAX_ON_PITCH,
  MAX_SQUAD,
  MIN_SQUAD,
  PH,
  PW,
  R,
  VIEW_PAD,
  clamp,
  defaultBoard,
  loadBoard,
  pitchCount,
  saveBoard,
  uid,
} from "@/lib/board";
import { SITUATIONS } from "@/lib/situations";
import type { Situation } from "@/lib/types";
import { ChipToken, PitchBall, PitchPlayer } from "./Token";

/* ----------------------------- small UI atoms ---------------------------- */

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const c = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "move":
      return (
        <svg {...c}>
          <path d="M12 2v20M2 12h20" />
          <path d="M9 5l3-3 3 3M9 19l3 3 3-3M5 9l-3 3 3 3M19 9l3 3-3 3" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...c}>
          <path d="M5 19L19 5" />
          <path d="M11 5h8v8" />
        </svg>
      );
    case "line":
      return (
        <svg {...c}>
          <path d="M5 19L19 5" />
        </svg>
      );
    case "x":
      return (
        <svg {...c}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case "circle":
      return (
        <svg {...c}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
    case "ball":
      return (
        <svg {...c}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7l4.3 3.1-1.6 5.1H9.3L7.7 10.1z" />
        </svg>
      );
    case "undo":
      return (
        <svg {...c}>
          <path d="M9 14L4 9l5-5" />
          <path d="M4 9h9a6 6 0 0 1 0 12H7" />
        </svg>
      );
    case "clear":
      return (
        <svg {...c}>
          <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
        </svg>
      );
    case "reset":
      return (
        <svg {...c}>
          <path d="M21 12a9 9 0 1 1-2.6-6.4" />
          <path d="M21 4v5h-5" />
        </svg>
      );
    case "plus":
      return (
        <svg {...c}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "minus":
      return (
        <svg {...c}>
          <path d="M5 12h14" />
        </svg>
      );
    case "chevron-left":
      return (
        <svg {...c}>
          <path d="M15 6l-6 6 6 6" />
        </svg>
      );
    case "chevron-right":
      return (
        <svg {...c}>
          <path d="M9 6l6 6-6 6" />
        </svg>
      );
    default:
      return null;
  }
}

function ToolButton({
  active,
  onClick,
  label,
  name,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  name: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-pressed={active}
      className={`flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition ${
        active
          ? "bg-[var(--accent)] text-slate-900"
          : "text-[var(--ink)] hover:bg-[var(--slate-700)]"
      }`}
    >
      <Icon name={name} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function ActionButton({
  onClick,
  label,
  name,
  disabled,
  danger,
}: {
  onClick: () => void;
  label: string;
  name: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-35 ${
        danger
          ? "text-[var(--danger)] hover:bg-[var(--danger)]/15"
          : "text-[var(--ink)] hover:bg-[var(--slate-700)]"
      }`}
    >
      <Icon name={name} />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

/* ------------------------------- pitch art ------------------------------- */

const B = 16; // dark border ("boards") thickness
const TX = B;
const TY = B;
const TW = PW - 2 * B;
const TH = PH - 2 * B;

function PitchMarkings() {
  const cx = PW / 2;
  const cy = PH / 2;
  const goalW = 168;
  const goalD = 26;
  const stripes = 8;
  const bandH = TH / stripes;
  return (
    <g pointerEvents="none">
      {/* boards frame */}
      <rect x={0} y={0} width={PW} height={PH} rx={26} fill="#0c1a12" />
      {/* turf + mow stripes (clipped to a rounded rect) */}
      <defs>
        <clipPath id="turf">
          <rect x={TX} y={TY} width={TW} height={TH} rx={14} />
        </clipPath>
      </defs>
      <g clipPath="url(#turf)">
        <rect x={TX} y={TY} width={TW} height={TH} fill="#2f8a3e" />
        {Array.from({ length: stripes }).map((_, i) => (
          <rect
            key={i}
            x={TX}
            y={TY + i * bandH}
            width={TW}
            height={bandH}
            fill={i % 2 === 0 ? "#33954420" : "#2a7d3700"}
          />
        ))}
      </g>

      {/* white markings */}
      <g stroke="var(--line)" strokeWidth={3} fill="none" opacity={0.92}>
        <rect x={TX} y={TY} width={TW} height={TH} rx={14} />
        <line x1={TX} y1={cy} x2={TX + TW} y2={cy} />
        <circle cx={cx} cy={cy} r={74} />
      </g>
      <circle cx={cx} cy={cy} r={5} fill="var(--line)" opacity={0.92} />

      {/* goals (top + bottom), opening into the pitch */}
      {[TY, TY + TH - goalD].map((gy, gi) => (
        <g key={gi} stroke="var(--line)" strokeWidth={3} fill="rgba(255,255,255,0.10)">
          <rect x={cx - goalW / 2} y={gy} width={goalW} height={goalD} />
          <g strokeWidth={1} opacity={0.5}>
            <line x1={cx - goalW / 6} y1={gy} x2={cx - goalW / 6} y2={gy + goalD} />
            <line x1={cx + goalW / 6} y1={gy} x2={cx + goalW / 6} y2={gy + goalD} />
            <line x1={cx - goalW / 2} y1={gy + goalD / 2} x2={cx + goalW / 2} y2={gy + goalD / 2} />
          </g>
        </g>
      ))}
    </g>
  );
}

function renderShape(s: Shape, key: string, opacity = 1) {
  switch (s.kind) {
    case "line":
      return (
        <line
          key={key}
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke={s.color}
          strokeWidth={4.5}
          strokeLinecap="round"
          opacity={opacity}
        />
      );
    case "arrow":
      return (
        <line
          key={key}
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke={s.color}
          strokeWidth={4.5}
          strokeLinecap="round"
          markerEnd="url(#arrowhead)"
          opacity={opacity}
        />
      );
    case "x": {
      const d = 18;
      return (
        <g key={key} stroke={s.color} strokeWidth={6} strokeLinecap="round" opacity={opacity}>
          <line x1={s.x - d} y1={s.y - d} x2={s.x + d} y2={s.y + d} />
          <line x1={s.x - d} y1={s.y + d} x2={s.x + d} y2={s.y - d} />
        </g>
      );
    }
    case "circle":
      return (
        <circle
          key={key}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill={s.color}
          fillOpacity={0.12}
          stroke={s.color}
          strokeWidth={4.5}
          opacity={opacity}
        />
      );
  }
}

/* ------------------------------ transient drag --------------------------- */

type DragInfo =
  | { type: "token"; id: string; offX: number; offY: number; sx: number; sy: number; moved: boolean; pushed: boolean }
  | { type: "ball"; offX: number; offY: number; sx: number; sy: number; moved: boolean; pushed: boolean }
  | { type: "bench"; id: string; side: Side }
  | { type: "draw"; kind: Tool; sx: number; sy: number; cur: Shape | null };

interface Doc {
  board: BoardState;
  past: BoardState[];
}

const TOOLS: { id: Tool; label: string }[] = [
  { id: "move", label: "Move" },
  { id: "arrow", label: "Arrow" },
  { id: "line", label: "Line" },
  { id: "x", label: "X" },
  { id: "circle", label: "Circle" },
];

/* -------------------------------- the board ------------------------------ */

export default function TacticsBoard() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<DragInfo | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [doc, setDoc] = useState<Doc>(() => ({ board: defaultBoard(), past: [] }));
  const [ready, setReady] = useState(false);
  const [tool, setTool] = useState<Tool>("move");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeDrag, setActiveDrag] = useState<{ kind: "token" | "ball"; id?: string } | null>(null);
  const [preview, setPreview] = useState<Shape | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number; player: BoardState["players"][number] } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [situationsOpen, setSituationsOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [mobileTab, setMobileTab] = useState<Side>("home");
  const [awayOpen, setAwayOpen] = useState(true);
  const [homeOpen, setHomeOpen] = useState(true);

  const board = doc.board;
  const canUndo = doc.past.length > 0;

  // Load saved board after mount (keeps SSR markup === first client render).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDoc({ board: loadBoard(), past: [] });
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveBoard(board);
  }, [board, ready]);

  /* ---- state mutators ---- */
  const commit = (fn: (b: BoardState) => BoardState) =>
    setDoc((d) => ({ board: fn(d.board), past: [...d.past.slice(-49), d.board] }));
  const live = (fn: (b: BoardState) => BoardState) => setDoc((d) => ({ ...d, board: fn(d.board) }));
  const pushHistory = () => setDoc((d) => ({ ...d, past: [...d.past.slice(-49), d.board] }));
  const undo = () =>
    setDoc((d) => (d.past.length ? { board: d.past[d.past.length - 1], past: d.past.slice(0, -1) } : d));

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1900);
  };

  const capture = (el: Element | null | undefined, pointerId: number) => {
    try {
      el?.setPointerCapture(pointerId);
    } catch {
      /* some browsers throw for synthetic / detached pointers — drag still works */
    }
  };

  /* ---- coordinate helpers ---- */
  const toUnits = (clientX: number, clientY: number): Pos => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };
  const pointInPitch = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return false;
    const r = svg.getBoundingClientRect();
    return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
  };

  /* ---- pitch token / ball drag (move mode) ---- */
  const onPlayerDown = (e: React.PointerEvent, id: string) => {
    if (tool !== "move") return;
    e.preventDefault();
    e.stopPropagation();
    capture(svgRef.current, e.pointerId);
    const p = board.players.find((pl) => pl.id === id);
    if (!p || !p.pos) return;
    const u = toUnits(e.clientX, e.clientY);
    dragRef.current = { type: "token", id, offX: u.x - p.pos.x, offY: u.y - p.pos.y, sx: u.x, sy: u.y, moved: false, pushed: false };
    setActiveDrag({ kind: "token", id });
  };

  const onBallDown = (e: React.PointerEvent) => {
    if (tool !== "move") return;
    e.preventDefault();
    e.stopPropagation();
    capture(svgRef.current, e.pointerId);
    const u = toUnits(e.clientX, e.clientY);
    dragRef.current = { type: "ball", offX: u.x - board.ball.x, offY: u.y - board.ball.y, sx: u.x, sy: u.y, moved: false, pushed: false };
    setActiveDrag({ kind: "ball" });
  };

  const buildShape = (kind: Tool, sx: number, sy: number, u: Pos, color: string): Shape | null => {
    switch (kind) {
      case "x":
        return { id: "pv", kind: "x", color, x: u.x, y: u.y };
      case "circle":
        return { id: "pv", kind: "circle", color, x: sx, y: sy, r: Math.hypot(u.x - sx, u.y - sy) };
      case "arrow":
      case "line":
        return { id: "pv", kind, color, x1: sx, y1: sy, x2: u.x, y2: u.y };
      default:
        return null;
    }
  };

  const onSurfaceDown = (e: React.PointerEvent) => {
    if (tool === "move") {
      setSelectedId(null);
      return;
    }
    e.preventDefault();
    capture(svgRef.current, e.pointerId);
    const u = toUnits(e.clientX, e.clientY);
    const cur = buildShape(tool, u.x, u.y, u, board.drawColor);
    dragRef.current = { type: "draw", kind: tool, sx: u.x, sy: u.y, cur };
    setPreview(cur);
  };

  const onSvgMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    if (d.type === "token" || d.type === "ball") {
      const u = toUnits(e.clientX, e.clientY);
      const rad = d.type === "ball" ? BALL_R : R;
      const pos = clamp(u.x - d.offX, u.y - d.offY, rad);
      if (!d.moved && Math.hypot(u.x - d.sx, u.y - d.sy) > 4) {
        d.moved = true;
        if (selectedId) setSelectedId(null);
      }
      if (d.moved && !d.pushed) {
        d.pushed = true;
        pushHistory();
      }
      if (!d.moved) return;
      if (d.type === "ball") live((b) => ({ ...b, ball: pos }));
      else live((b) => ({ ...b, players: b.players.map((p) => (p.id === d.id ? { ...p, pos } : p)) }));
    } else if (d.type === "draw") {
      const u = toUnits(e.clientX, e.clientY);
      d.cur = buildShape(d.kind, d.sx, d.sy, u, board.drawColor);
      setPreview(d.cur);
    }
  };

  const onSvgUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    setActiveDrag(null);
    try {
      svgRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    if (!d) return;
    if (d.type === "token" && !d.moved) {
      setSelectedId(d.id);
    } else if (d.type === "draw") {
      const s = d.cur;
      setPreview(null);
      if (!s) return;
      const big =
        s.kind === "x" ||
        (s.kind === "circle" && s.r >= 10) ||
        ((s.kind === "line" || s.kind === "arrow") && Math.hypot(s.x2 - s.x1, s.y2 - s.y1) >= 12);
      if (big) commit((b) => ({ ...b, shapes: [...b.shapes, { ...s, id: uid("s") }] }));
    }
  };

  /* ---- bench → pitch drag ---- */
  const onBenchDown = (e: React.PointerEvent, player: BoardState["players"][number]) => {
    e.preventDefault();
    capture(e.currentTarget as Element, e.pointerId);
    dragRef.current = { type: "bench", id: player.id, side: player.side };
    setGhost({ x: e.clientX, y: e.clientY, player });
  };
  const onBenchMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.type !== "bench") return;
    setGhost((g) => (g ? { ...g, x: e.clientX, y: e.clientY } : g));
  };
  const onBenchUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    setGhost(null);
    try {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    if (!d || d.type !== "bench") return;
    if (!pointInPitch(e.clientX, e.clientY)) return;
    if (pitchCount(board.players, d.side) >= MAX_ON_PITCH) {
      showToast(`Only ${MAX_ON_PITCH} ${d.side === "home" ? "of your players" : "opponents"} on the pitch at once`);
      return;
    }
    const u = toUnits(e.clientX, e.clientY);
    const pos = clamp(u.x, u.y, R);
    commit((b) => ({ ...b, players: b.players.map((p) => (p.id === d.id ? { ...p, pos } : p)) }));
  };

  /* ---- roster + board actions ---- */
  const addPlayer = (side: Side) =>
    commit((b) => {
      const squad = b.players.filter((p) => p.side === side);
      if (squad.length >= MAX_SQUAD) return b;
      const num = Math.max(0, ...squad.map((p) => p.number)) + 1;
      return { ...b, players: [...b.players, { id: uid(side), side, number: num, name: "", pos: null }] };
    });
  const removePlayer = (side: Side) =>
    commit((b) => {
      const squad = b.players.filter((p) => p.side === side);
      if (squad.length <= MIN_SQUAD) return b;
      const victim = [...squad].sort((a, z) => (a.pos ? 1 : 0) - (z.pos ? 1 : 0) || z.number - a.number)[0];
      if (selectedId === victim.id) setSelectedId(null);
      return { ...b, players: b.players.filter((p) => p.id !== victim.id) };
    });
  const renamePlayer = (id: string, name: string) =>
    live((b) => ({ ...b, players: b.players.map((p) => (p.id === id ? { ...p, name } : p)) }));
  const setNumber = (id: string, raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 2);
    if (digits === "") return; // ignore empty so the field can't be blanked
    const number = Math.max(1, Math.min(99, parseInt(digits, 10)));
    live((b) => ({ ...b, players: b.players.map((p) => (p.id === id ? { ...p, number } : p)) }));
  };
  const takeOff = (id: string) => {
    commit((b) => ({ ...b, players: b.players.map((p) => (p.id === id ? { ...p, pos: null } : p)) }));
    setSelectedId(null);
  };
  const centerBall = () => commit((b) => ({ ...b, ball: { x: PW / 2, y: PH / 2 } }));
  const clearDrawings = () => commit((b) => ({ ...b, shapes: [] }));
  const clearCaption = () => live((b) => ({ ...b, caption: null }));
  const resetBoard = () => {
    commit((b) => ({
      ...b,
      players: b.players.map((p) => ({ ...p, pos: null })),
      ball: { x: PW / 2, y: PH / 2 },
      shapes: [],
      caption: null,
    }));
    setSelectedId(null);
    setConfirmReset(false);
    setTool("move");
  };

  const loadSituation = (sit: Situation) => {
    commit((b) => {
      const home = b.players.filter((p) => p.side === "home").sort((a, z) => a.number - z.number);
      const away = b.players.filter((p) => p.side === "away").sort((a, z) => a.number - z.number);
      const homeSet = home.map((p, i) => ({ ...p, pos: sit.home[i] ?? null }));
      const awaySet = away.map((p, i) => ({ ...p, pos: sit.away ? sit.away[i] ?? null : null }));
      return {
        ...b,
        players: [...homeSet, ...awaySet],
        ball: sit.ball,
        caption: { title: sit.title, text: sit.text },
        shapes: sit.shapes ? sit.shapes.map((s) => ({ ...s, id: uid("s") }) as Shape) : [],
      };
    });
    setSelectedId(null);
    setTool("move");
    setSituationsOpen(false);
  };

  /* ---- keyboard niceties ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      } else if (e.key === "Escape") {
        setSelectedId(null);
        setSituationsOpen(false);
        setConfirmReset(false);
      } else if ((e.key === "Backspace" || e.key === "Delete") && selectedId) {
        e.preventDefault();
        takeOff(selectedId);
      } else if (e.key === "v" || e.key === "m") setTool("move");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  /* ---- derived ---- */
  const selected = board.players.find((p) => p.id === selectedId && p.pos) ?? null;
  const boardEmpty = board.players.every((p) => !p.pos) && board.shapes.length === 0 && !board.caption;
  const moveActive = tool === "move";

  /* ---- rail (used in desktop asides + mobile tabs) ---- */
  const renderRail = (side: Side, onCollapse?: () => void) => {
    const isHome = side === "home";
    const squad = board.players.filter((p) => p.side === side).sort((a, z) => a.number - z.number);
    const bench = squad.filter((p) => !p.pos);
    const onPitch = squad.length - bench.length;
    const full = onPitch >= MAX_ON_PITCH;
    return (
      <div className="flex h-full flex-col gap-3">
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              {isHome ? "Your Team" : "Opposition"}
            </span>
            {onCollapse && (
              <button
                onClick={onCollapse}
                title="Collapse panel"
                aria-label="Collapse panel"
                className="-mr-1 rounded p-1 text-[var(--muted)] transition hover:bg-[var(--slate-700)] hover:text-[var(--ink)]"
              >
                <Icon name={isHome ? "chevron-right" : "chevron-left"} size={16} />
              </button>
            )}
          </div>
          <input
            value={isHome ? board.homeName : board.awayName}
            onChange={(e) =>
              live((b) => (isHome ? { ...b, homeName: e.target.value } : { ...b, awayName: e.target.value }))
            }
            className="w-full rounded-md border border-[var(--slate-700)] bg-[var(--slate-800)] px-2 py-1.5 text-sm font-medium text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            aria-label={isHome ? "Your team name" : "Opposition name"}
          />
        </div>

        {!isHome && (
          <div className="space-y-2 rounded-lg border border-[var(--slate-700)] bg-[var(--slate-900)]/50 p-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Kit colour</div>
            <div className="flex flex-wrap gap-1.5">
              {AWAY_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => live((b) => ({ ...b, awayColor: c.hex }))}
                  title={c.name}
                  aria-label={c.name}
                  className={`h-6 w-6 rounded-full border transition ${
                    board.awayColor === c.hex
                      ? "border-white ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--slate-900)]"
                      : "border-black/40"
                  }`}
                  style={{ background: c.hex }}
                />
              ))}
            </div>
            <div className="flex gap-1 rounded-md bg-[var(--slate-800)] p-1">
              {(["solid", "stripe"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => live((b) => ({ ...b, awayStyle: st }))}
                  className={`flex-1 rounded px-2 py-1 text-xs font-medium capitalize transition ${
                    board.awayStyle === st ? "bg-[var(--accent)] text-slate-900" : "text-[var(--ink)] hover:bg-[var(--slate-700)]"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          <span>Bench</span>
          <span className={onPitch >= MAX_ON_PITCH ? "text-[var(--accent)]" : ""}>{onPitch}/4 on pitch</span>
        </div>

        <div className="grid min-h-[60px] grid-cols-3 content-start gap-2 overflow-auto thin-scroll">
          {bench.map((p) => (
            <button
              key={p.id}
              onPointerDown={(e) => onBenchDown(e, p)}
              onPointerMove={onBenchMove}
              onPointerUp={onBenchUp}
              className="no-pan grid cursor-grab place-items-center rounded-lg p-1 hover:bg-[var(--slate-800)] active:cursor-grabbing"
              title={full ? "4 on the pitch already" : "Drag onto the pitch"}
            >
              <ChipToken player={p} awayColor={board.awayColor} awayStyle={board.awayStyle} dimmed={full} />
            </button>
          ))}
          {bench.length === 0 && (
            <div className="col-span-3 py-2 text-center text-xs text-[var(--muted)]">Everyone&apos;s on the pitch.</div>
          )}
        </div>

        <div className="mt-auto flex gap-2 pt-1">
          <button
            onClick={() => addPlayer(side)}
            disabled={squad.length >= MAX_SQUAD}
            className="flex flex-1 items-center justify-center gap-1 rounded-md bg-[var(--add)] px-2 py-1.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-35"
          >
            <Icon name="plus" size={16} /> Add
          </button>
          <button
            onClick={() => removePlayer(side)}
            disabled={squad.length <= MIN_SQUAD}
            className="flex flex-1 items-center justify-center gap-1 rounded-md border border-[var(--slate-600)] px-2 py-1.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--slate-800)] disabled:opacity-35"
          >
            <Icon name="minus" size={16} /> Remove
          </button>
        </div>
      </div>
    );
  };

  /* ------------------------------- render -------------------------------- */
  return (
    <div className="flex h-full flex-col">
      {/* top toolbar */}
      <header className="z-20 flex flex-wrap items-center gap-2 border-b border-[var(--slate-700)] bg-[var(--slate-900)]/85 px-3 py-2 backdrop-blur">
        <div className="mr-1 font-display text-lg font-bold tracking-tight">
          COACH<span className="text-[var(--accent)]">BOARD</span>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-[var(--slate-800)] p-1">
          {TOOLS.map((t) => (
            <ToolButton
              key={t.id}
              active={tool === t.id}
              label={t.label}
              name={t.id}
              onClick={() => {
                setTool(t.id);
                if (t.id !== "move") setSelectedId(null);
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-1" title="Pen colour">
          {DRAW_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => live((b) => ({ ...b, drawColor: c }))}
              aria-label={`Pen colour ${c}`}
              className={`h-6 w-6 rounded-full border transition ${
                board.drawColor === c
                  ? "border-white ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--slate-900)]"
                  : "border-black/40"
              }`}
              style={{ background: c }}
            />
          ))}
        </div>

        {/* situations */}
        <div className="relative">
          <button
            onClick={() => setSituationsOpen((v) => !v)}
            className="flex h-9 items-center gap-1.5 rounded-md border border-[var(--slate-600)] px-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--slate-800)]"
          >
            Situations
            <span className="text-[var(--muted)]">▾</span>
          </button>
          {situationsOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setSituationsOpen(false)} />
              <div className="absolute left-0 top-full z-40 mt-1 w-72 overflow-hidden rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] p-1 shadow-2xl">
                {SITUATIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => loadSituation(s)}
                    className="block w-full rounded-md px-3 py-2 text-left transition hover:bg-[var(--slate-700)]"
                  >
                    <div className="font-display text-sm font-semibold text-[var(--ink)]">{s.title}</div>
                    <div className="text-xs text-[var(--muted)]">{s.text}</div>
                  </button>
                ))}
                <button
                  onClick={() => {
                    clearCaption();
                    setSituationsOpen(false);
                  }}
                  className="block w-full rounded-md px-3 py-2 text-left text-xs text-[var(--muted)] transition hover:bg-[var(--slate-700)]"
                >
                  Freeform — clear the caption
                </button>
              </div>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <ActionButton onClick={centerBall} label="Center ball" name="ball" />
          <ActionButton onClick={undo} label="Undo" name="undo" disabled={!canUndo} />
          <ActionButton onClick={clearDrawings} label="Clear" name="clear" disabled={board.shapes.length === 0} />
          <div className="relative">
            <ActionButton onClick={() => setConfirmReset((v) => !v)} label="Reset" name="reset" danger />
            {confirmReset && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setConfirmReset(false)} />
                <div className="absolute right-0 top-full z-40 mt-1 w-52 rounded-lg border border-[var(--slate-700)] bg-[var(--slate-800)] p-3 shadow-2xl">
                  <div className="mb-2 text-sm text-[var(--ink)]">Clear the whole board?</div>
                  <div className="flex gap-2">
                    <button
                      onClick={resetBoard}
                      className="flex-1 rounded-md bg-[var(--danger)] px-2 py-1.5 text-sm font-semibold text-white hover:brightness-110"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setConfirmReset(false)}
                      className="flex-1 rounded-md border border-[var(--slate-600)] px-2 py-1.5 text-sm text-[var(--ink)] hover:bg-[var(--slate-700)]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* body */}
      <div className="flex min-h-0 flex-1">
        {awayOpen ? (
          <aside className="hidden w-48 shrink-0 flex-col border-r border-[var(--slate-700)] bg-[var(--slate-900)]/50 p-3 md:flex lg:w-60">
            {renderRail("away", () => setAwayOpen(false))}
          </aside>
        ) : (
          <button
            onClick={() => setAwayOpen(true)}
            title="Show opposition panel"
            aria-label="Show opposition panel"
            className="hidden w-10 shrink-0 flex-col items-center gap-3 border-r border-[var(--slate-700)] bg-[var(--slate-900)]/50 py-3 text-[var(--muted)] transition hover:bg-[var(--slate-800)] hover:text-[var(--ink)] md:flex"
          >
            <Icon name="chevron-right" size={18} />
            <span className="select-none text-[10px] font-semibold uppercase tracking-wider [writing-mode:vertical-rl]">
              Opposition
            </span>
          </button>
        )}

        <main className="relative flex min-w-0 flex-1 flex-col items-stretch p-2 sm:p-3">
          {board.caption && (
            <div className="mb-2 flex items-center gap-3 rounded-lg border border-[var(--slate-700)] bg-[var(--slate-850)] px-3 py-2">
              <span className="font-display font-semibold text-[var(--accent)]">{board.caption.title}</span>
              <span className="text-sm text-[var(--ink)]">{board.caption.text}</span>
              <button
                onClick={clearCaption}
                className="ml-auto rounded p-1 text-[var(--muted)] hover:bg-[var(--slate-700)] hover:text-[var(--ink)]"
                aria-label="Clear caption"
              >
                ✕
              </button>
            </div>
          )}

          <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
            <svg
              ref={svgRef}
              viewBox={`${-VIEW_PAD} ${-VIEW_PAD} ${PW + 2 * VIEW_PAD} ${PH + 2 * VIEW_PAD}`}
              preserveAspectRatio="xMidYMid meet"
              className="no-pan h-full w-full"
              onPointerMove={onSvgMove}
              onPointerUp={onSvgUp}
              onPointerCancel={onSvgUp}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth={28}
                  markerHeight={20}
                  refX={22}
                  refY={9}
                  orient="auto-start-reverse"
                  markerUnits="userSpaceOnUse"
                >
                  <path d="M0,0 L26,9 L0,18 Z" fill="context-stroke" />
                </marker>
              </defs>

              <PitchMarkings />

              {/* draw / deselect surface (below tokens) — covers the out-of-play margin too */}
              <rect
                x={-VIEW_PAD}
                y={-VIEW_PAD}
                width={PW + 2 * VIEW_PAD}
                height={PH + 2 * VIEW_PAD}
                fill="transparent"
                onPointerDown={onSurfaceDown}
                style={{ cursor: moveActive ? "default" : "crosshair" }}
              />

              {/* committed drawings */}
              <g pointerEvents="none">{board.shapes.map((s) => renderShape(s, s.id))}</g>
              {/* live preview */}
              {preview && <g pointerEvents="none">{renderShape(preview, "preview", 0.75)}</g>}

              {/* players */}
              {board.players
                .filter((p) => p.pos)
                .map((p) => (
                  <PitchPlayer
                    key={p.id}
                    player={p}
                    awayColor={board.awayColor}
                    awayStyle={board.awayStyle}
                    selected={p.id === selectedId}
                    dragging={activeDrag?.kind === "token" && activeDrag.id === p.id}
                    pointerActive={moveActive}
                    onPointerDown={onPlayerDown}
                    onRemove={takeOff}
                  />
                ))}

              {/* ball */}
              <PitchBall
                ball={board.ball}
                dragging={activeDrag?.kind === "ball"}
                pointerActive={moveActive}
                onPointerDown={onBallDown}
              />
            </svg>

            {/* empty-state hint */}
            {boardEmpty && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center p-4">
                <div className="max-w-xs rounded-xl bg-[var(--slate-900)]/75 px-4 py-3 text-center text-sm text-[var(--muted)] ring-1 ring-white/10">
                  Drag players from the sides onto the pitch.
                  <br />
                  Or pick a <span className="font-semibold text-[var(--ink)]">Situation</span> to load a ready-made shape.
                </div>
              </div>
            )}

            {/* selected-player control bar */}
            {selected && (
              <div className="absolute bottom-3 left-1/2 z-10 flex w-max max-w-[95vw] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-xl border border-[var(--slate-700)] bg-[var(--slate-900)]/95 px-3 py-2 shadow-2xl backdrop-blur">
                <ChipToken player={selected} awayColor={board.awayColor} awayStyle={board.awayStyle} size={32} />
                <label className="flex items-center gap-1 text-sm text-[var(--muted)]">
                  <span className="font-display">#</span>
                  <input
                    inputMode="numeric"
                    value={selected.number}
                    onChange={(e) => setNumber(selected.id, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    aria-label="Player number"
                    className="tnum w-12 rounded-md border border-[var(--slate-700)] bg-[var(--slate-800)] px-2 py-1 text-center text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                  />
                </label>
                <input
                  autoFocus
                  value={selected.name}
                  onChange={(e) => renamePlayer(selected.id, e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="Add name"
                  maxLength={20}
                  className="w-24 rounded-md border border-[var(--slate-700)] bg-[var(--slate-800)] px-2 py-1 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] sm:w-28"
                />
                <button
                  onClick={() => takeOff(selected.id)}
                  className="rounded-md border border-[var(--slate-600)] px-2.5 py-1 text-sm text-[var(--ink)] hover:bg-[var(--slate-800)]"
                >
                  Take off
                </button>
                <button
                  onClick={() => setSelectedId(null)}
                  className="rounded-md bg-[var(--accent)] px-2.5 py-1 text-sm font-semibold text-slate-900 hover:brightness-110"
                >
                  Done
                </button>
              </div>
            )}

            {/* toast */}
            {toast && (
              <div className="pointer-events-none absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-[var(--slate-900)]/95 px-4 py-2 text-sm shadow-lg ring-1 ring-white/10">
                {toast}
              </div>
            )}
          </div>
        </main>

        {homeOpen ? (
          <aside className="hidden w-48 shrink-0 flex-col border-l border-[var(--slate-700)] bg-[var(--slate-900)]/50 p-3 md:flex lg:w-60">
            {renderRail("home", () => setHomeOpen(false))}
          </aside>
        ) : (
          <button
            onClick={() => setHomeOpen(true)}
            title="Show your team panel"
            aria-label="Show your team panel"
            className="hidden w-10 shrink-0 flex-col items-center gap-3 border-l border-[var(--slate-700)] bg-[var(--slate-900)]/50 py-3 text-[var(--muted)] transition hover:bg-[var(--slate-800)] hover:text-[var(--ink)] md:flex"
          >
            <Icon name="chevron-left" size={18} />
            <span className="select-none text-[10px] font-semibold uppercase tracking-wider [writing-mode:vertical-rl]">
              Your Team
            </span>
          </button>
        )}
      </div>

      {/* mobile bench panel */}
      <div className="border-t border-[var(--slate-700)] bg-[var(--slate-900)] md:hidden">
        <div className="flex">
          {(["home", "away"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setMobileTab(s)}
              className={`flex-1 py-2 text-sm font-semibold transition ${
                mobileTab === s ? "border-b-2 border-[var(--accent)] text-[var(--ink)]" : "text-[var(--muted)]"
              }`}
            >
              {s === "home" ? "Your Team" : "Opposition"}
            </button>
          ))}
        </div>
        <div className="max-h-[40vh] overflow-auto p-3 thin-scroll">{renderRail(mobileTab)}</div>
      </div>

      {/* drag ghost */}
      {ghost && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2"
          style={{ left: ghost.x, top: ghost.y }}
        >
          <ChipToken player={ghost.player} awayColor={board.awayColor} awayStyle={board.awayStyle} size={54} />
        </div>
      )}
    </div>
  );
}
