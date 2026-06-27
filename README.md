# Coach Board — 4-a-side Tactics

A drag-and-drop tactics board for showing a kids' 4-a-side (U7) team where to
stand in real game situations, and for drawing simple football concepts. Built
for a tablet at the touchline, but works on laptop and phone too.

Next.js (App Router) + Tailwind v4. Single client page, no backend — everything
persists to `localStorage`.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

## What it does

- **Pitch** — green turf, white lines, halfway line + centre circle, goals top &
  bottom, no boxes (they don't play with them yet).
- **Players** — drag from the side benches onto the pitch. Your team wears the
  blue/red vertical-stripe kit; the opposition is configurable (colour + solid or
  stripe). Max **4 per side** on the pitch at once.
- **Names** — tap a player on the pitch to rename or take them off.
- **Ball** — drag it anywhere; "Center ball" re-spots it.
- **Draw** — Arrow, Line, X and Circle tools to show runs, passes and space, in
  yellow / white / black / blue.
- **Situations** — ready-made teaching setups (Kick-off, Spread out, Don't all
  chase the ball, Get back, Make it big) that load positions + a caption.
- **Undo / Clear drawings / Reset board**, and the whole board is remembered
  between visits.

Touch-first: all dragging uses Pointer Events, so mouse, touch and pen behave
identically and the page never scrolls mid-drag.

## Where things live

- `components/TacticsBoard.tsx` — the board: state, pointer-drag, drawing, layout.
- `components/Token.tsx` — SVG pitch tokens (kits, ball) + the HTML bench chips.
- `lib/board.ts` — constants, defaults, `localStorage`, helpers.
- `lib/situations.ts` — the teaching presets (edit these to add your own).
- `lib/types.ts` — shared types.

Coordinates are stored in pitch units (`0..900` × `0..600`); the SVG scales
uniformly, so the layout is resolution-independent.

The design plan and review live in [PLAN.md](PLAN.md).
