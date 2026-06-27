# Football Tactics Board — Design Plan

A coaching whiteboard for a 4-a-side (U7) team. The coach (Tim) drags players
onto a pitch to show his son's team where to stand in real game situations, and
draws arrows/zones to explain football concepts. Everyone on the team is new to
the game, so the tool has to read instantly to a 6-year-old looking over a
shoulder, and be operable one-handed on a tablet at the side of a pitch.

**Stack:** Next.js (App Router) + Tailwind. Single client page. No backend —
state persists to `localStorage`. Deployable as a static site.

---

## 1. Who this is for and how it gets used

- **Primary user:** Tim, coaching at the touchline or at the kitchen table, on a
  **tablet (landscape)** or laptop. Sometimes a phone.
- **Over-the-shoulder audience:** 5–7 year-olds. The picture must be obvious
  without reading. Tokens, the ball, and arrows carry the meaning; text is
  secondary.
- **Core loop:** set up a situation (drag players + ball) → draw movement →
  talk through it → reset or load the next situation.

Design consequence: **the pitch is the product.** Everything else is a rail that
serves it. Chrome stays out of the way. Touch targets are large. Nothing
depends on hover (tablets have no hover).

---

## 2. Layout

### Tablet / desktop (landscape, primary target)

```
┌──────────────────────────────────────────────────────────────┐
│  TOP BAR: title ·  [Move ▸ Arrow · Line · X · Circle]  ·  ⚽   │
│           · Undo · Clear drawings · Reset board                │
├──────────┬───────────────────────────────────────┬────────────┤
│ AWAY      │                                       │  HOME       │
│ (rail)    │              PITCH                     │  (rail)     │
│           │        vertical, attack ↑             │             │
│ ◎ ◎ ◎     │   ┌─────────────────────────────┐     │   ◎ ◎ ◎     │
│ ◎ ◎ ◎     │   │  goal ▔▔▔▔▔                  │     │   ◎ ◎ ◎     │
│           │   │                              │     │             │
│ colour    │   │  · · · · · · · · · · (½ line)│     │  + add      │
│ swatches  │   │                              │     │  – remove   │
│ solid/    │   │              ⚽               │     │  team name  │
│ stripe    │   │  goal ▁▁▁▁▁                  │     │             │
│           │   └─────────────────────────────┘     │             │
└──────────┴───────────────────────────────────────┴────────────┘
```

- **Pitch centered**, vertical orientation (one goal top, one bottom). Vertical
  reads as "defenders near our goal at the bottom, attackers up top," which is
  the mental model for teaching positioning. The long edges (left/right) are the
  **sidelines** — so the benches sitting against them read literally as players
  waiting on the touchline.
- **HOME rail (right):** your team's bench (squad not on the pitch), add/remove
  player, edit team name. Home is on the right under the coach's dominant hand.
- **AWAY rail (left):** opposition bench, colour + style controls.
- **Top bar:** drawing-tool selector, ball, and board actions (Undo / Clear
  drawings / Reset).

### Phone (portrait fallback)

- Pitch on top, full width.
- Benches + tools collapse into a **bottom sheet** with three tabs: **Home**,
  **Away**, **Draw**. One thumb reaches everything. The pitch never shrinks
  below ~60% of the viewport height.

---

## 3. The pitch

SVG, rendered from a fixed logical coordinate box (e.g. `0 0 680 1050`, ~2:3)
and scaled to fit. Everything positioned in **percentages** so it's
resolution-independent and survives resize/rotate.

Markings (4-a-side, no boxes):
- **Turf:** green with subtle alternating mow stripes (very low contrast, just
  texture — not loud).
- **Border / boards:** a dark rounded frame around the turf (the "rink" look of
  small-sided pitches), so the green pops off the page.
- **Touchlines + goal lines:** white, ~2px.
- **Halfway line** across the middle + **centre circle** + centre spot.
- **Two goals:** white goal frame drawn on the top and bottom goal lines. No
  6-yard or 18-yard boxes (they don't play with them yet).
- No penalty spots, no arcs. Authentic to their actual pitch.

`touch-action: none` on the pitch surface so dragging a player never scrolls the
page.

---

## 4. Players (tokens)

A token is a **circle, ~9% of pitch width** (comfortably >44px touch target on
tablet), with a soft drop shadow and a thin white ring for separation from the
turf.

- **Home (your team):** **vertical blue/red stripes** (their real kit). White
  ring. A **number** in the middle (tabular, bold). Optional **name pill**
  below the token.
- **Away (opposition):** default **solid gray**. Colour is configurable from a
  small palette (gray, red, blue, green, black, orange, yellow). Style toggle:
  - **Solid** → filled circle in the chosen colour.
  - **Stripe** → vertical stripes of the chosen colour over white.
  Number in the middle. Always a contrasting ring so a white/yellow kit still
  separates from the turf.
- **Names:** short pill under the token, truncated with ellipsis past ~10 chars;
  full name shown when the token is selected. Names are optional — a token works
  as just a number.
- **Ball:** classic white-with-black-pentagons football, slightly smaller than a
  token, its own drop shadow so it floats above players.

Selected token gets a highlight ring + a small inline toolbar (rename ·
remove-from-pitch).

---

## 5. Interaction model (the core engineering decision)

**Use Pointer Events (`pointerdown/move/up`), not HTML5 drag-and-drop.** HTML5
DnD is unreliable/janky on touch; pointer events give one code path for mouse,
touch, and pen, and let us control the page from scrolling mid-drag.

- **Place from bench:** press a bench token → it lifts and follows the finger →
  release over the pitch to place; release off-pitch returns it to the bench.
- **Move on pitch:** press and drag any placed token or the ball.
- **Snap:** free placement (no grid). Tokens can't be dragged outside the turf
  (clamped to the touchline).
- **4-per-side cap:** the bench shows how many remain. When 4 are already on the
  pitch, the bench tokens go dim and a press gives a gentle toast: *"4 players
  max on the pitch."* No hard error.
- **Select:** a tap (press with no drag) selects a token → inline rename /
  remove.
- **Ball:** always exactly one, draggable, never removed (Reset re-centers it).

State (positions, names, colours, drawings) is held in React state and mirrored
to `localStorage` so a refresh at the touchline doesn't lose the setup.

---

## 6. Drawing layer

A vector overlay above the pitch, below the tokens' drag interactions only when
a draw tool is active (the top-bar **tool mode** switches the pitch between
"move things" and "draw").

Tools:
- **Move** (default): drag players/ball, no drawing.
- **Arrow:** drag from A to B → line with an arrowhead. For runs and passes.
- **Line:** drag A to B → plain line (e.g. a defensive line, "stay behind this").
- **X:** tap to drop an X (a spot to avoid, or "mark this player / this space").
- **Circle:** drag to size a circle (highlight a zone — "this is your space").

- Drawing colour defaults to **bright yellow** (max contrast on green); a small
  swatch row offers yellow / white / black.
- Each shape is a vector object in percent coords (survives resize).
- **Undo** removes the last shape (and last placement). **Clear drawings**
  removes all shapes but leaves players. **Reset board** clears everything and
  re-centers the ball.

---

## 7. Situations library (what makes it *teach*, not just draw)

The stated goal is explaining concepts, not only a blank whiteboard. A
**Situations** menu loads a named setup: player positions + ball + optional
drawing + a one-line caption shown in a banner over/under the pitch.

Starter set tuned for brand-new U7s:
- **Kick-off** — where everyone starts.
- **Spread out (use the whole pitch)** — the #1 U7 lesson: don't bunch.
- **Don't all chase the ball (the swarm)** — show the swarm vs. shape.
- **Defending — get back / goal-side.**
- **Attacking — make the pitch big.**

Each is a preset the coach can load, then tweak live. This is the feature that
turns a whiteboard into a coaching aid. **Recommended in v1** because it's the
explicit ask ("visual explanations of different football concepts").

---

## 8. Visual system

- **Surface / chrome:** dark slate (`#0f172a`–`#1e293b`) so the green pitch is
  the hero. Rails and top bar are slightly lighter slate cards.
- **Pitch green:** mid-grass `#2e7d32`-ish with a subtle lighter mow stripe.
- **Lines:** white at ~85% opacity.
- **Home accent:** the team's blue/red.
- **Type:** **Space Grotesk** for the wordmark, headings, and token numbers
  (sporty, distinctive, real tabular figures via `font-feature-settings:
  "tnum"`); **Inter** for UI labels/body. No `system-ui` as the primary face —
  this named pairing is what keeps it off the "default font" slop flag.
- **Spacing:** 8px scale. Buttons ≥44px tall. Generous rail padding.
- **Motion:** tokens lift (scale + shadow) on grab; settle on drop. Toasts fade.
  No gratuitous animation.

---

## 9. States & edge cases (designed, not afterthoughts)

- **First load (empty pitch):** benches full, ball at center, a soft hint over
  the pitch: *"Drag players onto the pitch to set up a situation."* Hint clears
  on first placement.
- **4-per-side reached:** bench dims + toast (above).
- **Long names:** truncate to pill; full name on select.
- **Light opposition kit (white/yellow):** enforce a contrasting ring + shadow.
- **Undo/Clear with nothing to undo:** controls disabled (not hidden).
- **Rotate / resize tablet:** percentage coords reflow; nothing jumps off-pitch.
- **Reset board:** asks for nothing destructive-feeling but is one tap to undo
  via Undo? (No — Reset is a clean slate; guard with a small confirm.)
- **Accidental page scroll/zoom while dragging:** prevented via `touch-action`
  and pointer capture.

---

## 9b. Interaction state table

| Feature | First load / empty | In progress | Blocked / limit | Done |
|---|---|---|---|---|
| Place player from bench | Hint: "Drag players onto the pitch…" | Token lifts (scale + shadow), follows finger | 4 on pitch → bench dims + toast "4 players max" | Token settles on turf; bench count drops |
| Move token / ball | — | Token lifts, page scroll locked | Clamped at touchline (can't leave turf) | Rests at new spot; state saved |
| Drop off-pitch | — | Ghost drifts back toward bench | — | Snaps back to bench, no placement |
| Draw shape | Tool active → pitch in "draw" mode | Live preview follows finger | — | Shape committed to overlay |
| Undo / Clear | Disabled when nothing to undo/clear | — | — | Last item removed (Undo) / all shapes gone (Clear) |
| Reset board | — | Small confirm: "Clear the board?" | — | Players to bench, ball centered, drawings cleared |
| Rename player | Tap token → inline field | Typing | Empty allowed (number only) | Pill shows name; truncates >10 chars |
| Load situation | Menu of named concepts | Players ease into shape | — | Caption banner shows the concept's one-liner |

## 9c. User journey (the teaching arc)

| Step | Coach does | Kid sees / feels | Plan supports it |
|---|---|---|---|
| 1 | Opens app at the touchline | Green pitch, ball in the middle — "that's our pitch" | Pitch is the hero; empty-state hint |
| 2 | Taps "Spread out" | Players jump wide; caption "Use the WHOLE pitch" | Situations library + caption banner |
| 3 | Drags a player, adds an arrow | One token glides; a yellow run appears | Pointer-drag + Arrow tool |
| 4 | "Now you try" — hands tablet over | Big tokens, obvious tools, nothing breaks on a stray tap | 44px targets; only Reset is destructive (guarded) |
| 5 | Reopens next week | Last setup is still there | localStorage persistence |

Time horizons: 5-sec visceral (the pitch reads instantly), 5-min behavioral (load
a concept → tweak → explain), 5-year reflective (it's *their* team, names and all,
and it remembers).

## 10. Accessibility

- Touch targets ≥44px; tokens larger.
- Colour is never the only signal: opposition also differs by **style** (solid
  vs stripe) and number, not just hue, so a red/green-colourblind coach can tell
  teams apart.
- Controls are real buttons with labels (keyboard-focusable on desktop).
- Contrast: white lines on green, dark UI text on slate cards, all checked.

---

## 11. Build order (suggested)

1. Pitch SVG + responsive scaling + visual system.
2. Token component (home stripes, away solid/stripe, ball) + bench rails.
3. Pointer-event drag/place/move + 4-cap + clamp + localStorage.
4. Select → rename / remove; add/remove player; team names; opposition
   colour/style controls.
5. Drawing layer (tools, undo, clear) + tool-mode switch.
6. Situations library + caption banner.
7. Phone bottom-sheet layout + polish pass.

---

## Resolved design decisions

- **Visual direction: Variant A ("Coach Board")** — approved from the comparison
  board. Dark slate chrome; labeled top toolbar (Move · Arrow · Line · X · Circle
  + Ball + Undo · Clear · Reset); OPPOSITION left rail (bench + KIT colour swatches
  + Solid/Stripe); YOUR TEAM right rail (editable name + bench + Add/Remove). Home
  tokens render the blue/red vertical-stripe kit cleanly — **build tokens and
  chrome to match A.**
- **Pitch orientation: vertical play, goals top & bottom**, drawn to fill the
  landscape frame, benches against the left/right sidelines. (Resolved by mockups —
  all three converged here.)
- **Bench placement: side rails** — opposition left, your team right. (Resolved by
  mockups.)
- **Situations library ships in v1** — starter set + caption banner (below).
- **Caption banner:** a slim strip above the pitch (Variant B's "Coach Tip"
  pattern, restyled to A's look) showing the current situation's one-liner; empty
  in freeform mode.
- **Typeface:** Space Grotesk (wordmark/headings/numbers) + Inter (UI). Named to
  avoid the default-font slop flag.

## Situations library — v1 content

Each loads positions + ball + optional drawing + a caption. Authored for
brand-new U7s. Stored as static preset data in percent coords; loading one is
non-destructive (the coach drags from there). A "Freeform" entry clears the caption.

1. **Kick-off** — "Where we all start." Ball on the centre spot.
2. **Spread out** — "Use the WHOLE pitch." Players wide, not bunched.
3. **Don't all chase the ball** — "Only ONE of us goes for it." Swarm vs. shape.
4. **Get back (defend)** — "Run back, goal-side." Players between ball and our goal.
5. **Make it big (attack)** — "Stretch them — go wide." Players spread high.

## Responsive breakpoints

- **≥1024px (tablet landscape / desktop):** full three-zone layout (rails + pitch).
- **640–1023px (tablet portrait / large phone):** rails narrow; bench tokens wrap
  to 2 cols; toolbar labels shrink to icons with tooltips.
- **<640px (phone):** pitch on top (≥60% of viewport height); rails + tools become
  a bottom sheet with **Home / Away / Draw** tabs.

## Accessibility — keyboard fallback for drag

Pointer drag is primary. Keyboard parity: Tab to a bench token → Enter "picks it
up" → arrow keys nudge across the pitch in 2% steps → Enter to drop. Same for
moving placed tokens. Not the main path, but the board isn't mouse-only on desktop.

## What already exists

Greenfield — nothing to reuse. No DESIGN.md yet; §8 + the resolved decisions above
ARE the starting design system. Extract them into a short DESIGN.md early in the
build so colours, type, spacing, and token sizes have one home.

## NOT in scope (v1)

- **Goalkeeper / boxes / arcs** — they don't play with them (explicitly out).
- **Multiplayer / sharing / accounts** — local-only, localStorage.
- **Sequenced "play" animation** (frame-by-frame movement playback) — drawings are
  static; tempting v2, not v1.
- **Custom home-kit editor** — home is fixed to the blue/red stripe kit; only the
  opposition colour/style is configurable.
- **Export to image / PDF** — nice later; not v1.

## Approved Mockups

| Screen | Mockup Path | Direction | Notes |
|---|---|---|---|
| Tactics board (main) | ~/.gstack/projects/football-tactics/designs/board-20260627/variant-A.png | Variant A "Coach Board" — dark chrome, labeled toolbar, opposition/your-team side rails, blue/red striped home tokens, yellow run arrow | Add a slim caption banner above the pitch for Situations; otherwise build to match A |

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 0 | — | — |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | clean | score 6/10 → 9/10, 6 decisions |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

Per-pass: Info Arch 8→9 · States 7→9 (state table added) · Journey 7→9 (storyboard
added) · AI-Slop 9→9 (typeface named) · Design System 5→8 (decisions = nascent
system; DESIGN.md to be extracted in build) · Responsive/A11y 8→9 (breakpoints +
keyboard fallback). Variant A approved; Situations v1 confirmed.

- **VERDICT:** DESIGN REVIEW CLEAR — 6/10 → 9/10, ready to implement. Eng review not
  run; recommended before ship, not gating this greenfield plan.

NO UNRESOLVED DECISIONS
