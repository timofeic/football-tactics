// Board constants, defaults, persistence and small helpers.
import type { BoardState, Player, Pos, Side } from "./types";

// Pitch logical size (SVG units). Landscape 3:2, goals on the top & bottom
// edges — attack is up/down, which is how we talk about positioning.
export const PW = 900;
export const PH = 600;

export const R = 34; // player token radius (units)
export const BALL_R = 21;
export const LINE = 16; // touchline / goal-line inset (matches the boards frame)
export const VIEW_PAD = 56; // out-of-play margin baked into the SVG viewBox

export const MAX_ON_PITCH = 4;
export const MIN_SQUAD = 4;
export const MAX_SQUAD = 9;

export const AWAY_COLORS = [
  { name: "Gray", hex: "#6b7280" },
  { name: "Red", hex: "#dc2626" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Green", hex: "#16a34a" },
  { name: "Black", hex: "#111827" },
  { name: "Orange", hex: "#ea580c" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Purple", hex: "#7c3aed" },
];

export const DRAW_COLORS = ["#facc15", "#ffffff", "#0f172a", "#38bdf8"];

const STORAGE_KEY = "coachboard.v1";

let _seq = 0;
export function uid(prefix = "id"): string {
  _seq += 1;
  return `${prefix}-${_seq}-${Math.floor(performance.now())}`;
}

export function isLight(hex: string): boolean {
  const c = hex.replace("#", "");
  if (c.length < 6) return false;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

export function clamp(x: number, y: number, radius = R): Pos {
  // Allow a token to sit on the line and up to its full radius out of play, so
  // you can show kick-ins and goal kicks taken from the line. The out-of-play
  // margin (VIEW_PAD) keeps these tokens visible inside the SVG viewBox.
  return {
    x: Math.max(LINE - radius, Math.min(PW - LINE + radius, x)),
    y: Math.max(LINE - radius, Math.min(PH - LINE + radius, y)),
  };
}

export function pitchCount(players: Player[], side: Side): number {
  return players.filter((p) => p.side === side && p.pos).length;
}

function makeSquad(side: Side, n: number): Player[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${side}-${i + 1}`,
    side,
    number: i + 1,
    name: "",
    pos: null,
  }));
}

export function defaultBoard(): BoardState {
  return {
    players: [...makeSquad("home", 7), ...makeSquad("away", 7)],
    ball: { x: PW / 2, y: PH / 2 },
    shapes: [],
    homeName: "Our Team",
    awayName: "Opposition",
    awayColor: "#6b7280",
    awayStyle: "solid",
    drawColor: "#facc15",
    caption: null,
  };
}

export function loadBoard(): BoardState {
  if (typeof window === "undefined") return defaultBoard();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultBoard();
    const parsed = JSON.parse(raw);
    // Shallow-merge over defaults so an older/partial save still loads.
    return { ...defaultBoard(), ...parsed };
  } catch {
    return defaultBoard();
  }
}

export function saveBoard(board: BoardState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  } catch {
    // ignore quota / private-mode errors — the board still works in memory
  }
}
