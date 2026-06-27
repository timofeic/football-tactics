// Shared types for the tactics board.
// All on-pitch coordinates live in SVG unit space: x in [0, PW], y in [0, PH]
// (see lib/board.ts). The pitch SVG scales uniformly, so unit coords are
// resolution-independent — no percentage math needed at render time.

export type Side = "home" | "away";
export type Tool = "move" | "arrow" | "line" | "x" | "circle";
export type OppStyle = "solid" | "stripe";

export interface Pos {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  side: Side;
  number: number;
  name: string; // "" when unnamed
  pos: Pos | null; // null = on the bench
}

export type Shape =
  | { id: string; kind: "arrow" | "line"; color: string; x1: number; y1: number; x2: number; y2: number }
  | { id: string; kind: "x"; color: string; x: number; y: number }
  | { id: string; kind: "circle"; color: string; x: number; y: number; r: number };

export interface Caption {
  title: string;
  text: string;
}

export interface BoardState {
  players: Player[];
  ball: Pos;
  shapes: Shape[];
  homeName: string;
  awayName: string;
  awayColor: string; // hex
  awayStyle: OppStyle;
  drawColor: string; // hex
  caption: Caption | null;
}

// Distributive Omit so each union member keeps its own fields.
type WithoutId<T> = T extends unknown ? Omit<T, "id"> : never;
export type ShapeInit = WithoutId<Shape>;

export interface Situation {
  id: string;
  title: string;
  text: string;
  home: Pos[]; // up to 4
  away?: Pos[]; // up to 4
  ball: Pos;
  shapes?: ShapeInit[];
}
