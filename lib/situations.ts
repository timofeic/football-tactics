// Starter "Situations" — the teaching presets. Coordinates are in pitch units
// (x: 0..900 left→right, y: 0..600 top→bottom). Our team (home) attacks the TOP
// goal (y≈0) and defends the BOTTOM goal (y≈600). Authored for brand-new U7s:
// each one shows the *good* shape, and the caption says the lesson in kid words.
import type { Situation } from "./types";

export const SITUATIONS: Situation[] = [
  {
    id: "kickoff",
    title: "Kick-off",
    text: "Where we all start. One player on the ball, the rest spread out behind.",
    home: [
      { x: 450, y: 330 }, // on the ball
      { x: 250, y: 420 },
      { x: 650, y: 420 },
      { x: 450, y: 180 },
    ],
    away: [
      { x: 300, y: 170 },
      { x: 600, y: 170 },
      { x: 450, y: 90 },
      { x: 450, y: 250 },
    ],
    ball: { x: 450, y: 300 },
  },
  {
    id: "spread",
    title: "Spread out",
    text: "Use the WHOLE pitch — don't all bunch together. Make it big!",
    home: [
      { x: 150, y: 320 },
      { x: 750, y: 320 },
      { x: 450, y: 150 },
      { x: 450, y: 470 },
    ],
    ball: { x: 450, y: 300 },
  },
  {
    id: "dont-chase",
    title: "Don't all chase the ball",
    text: "Only ONE of us goes for the ball. The others keep their shape and wait.",
    home: [
      { x: 330, y: 300 }, // the one who presses
      { x: 600, y: 320 },
      { x: 450, y: 470 },
      { x: 470, y: 150 },
    ],
    ball: { x: 280, y: 270 },
    shapes: [
      { kind: "circle", color: "#facc15", x: 305, y: 285, r: 80 },
      { kind: "x", color: "#f87171", x: 600, y: 460 },
    ],
  },
  {
    id: "defend",
    title: "Get back (defend)",
    text: "Run back and get goal-side — stay between the ball and our goal.",
    home: [
      { x: 450, y: 430 }, // pressing the ball
      { x: 300, y: 500 },
      { x: 600, y: 500 },
      { x: 450, y: 545 },
    ],
    away: [
      { x: 450, y: 360 },
      { x: 300, y: 400 },
      { x: 600, y: 400 },
      { x: 450, y: 470 },
    ],
    ball: { x: 450, y: 470 },
  },
  {
    id: "attack",
    title: "Make it big (attack)",
    text: "Stretch them — go wide and high so we have space to play forward.",
    home: [
      { x: 150, y: 240 },
      { x: 750, y: 240 },
      { x: 450, y: 110 },
      { x: 450, y: 380 },
    ],
    ball: { x: 450, y: 200 },
    shapes: [
      { kind: "arrow", color: "#facc15", x1: 450, y1: 360, x2: 450, y2: 150 },
    ],
  },
  {
    id: "kickin-attack",
    title: "Kick-in — our ball",
    text: "Our kick-in from the side: the kicker stands on the line, the rest spread out and give options. Don't all run to the ball!",
    home: [
      { x: 905, y: 300 }, // the kicker, on the touchline (out of play)
      { x: 720, y: 175 }, // option up the line (forward)
      { x: 545, y: 300 }, // central option
      { x: 655, y: 430 }, // safe option behind
    ],
    away: [
      { x: 700, y: 125 },
      { x: 530, y: 235 },
      { x: 470, y: 385 },
    ],
    ball: { x: 884, y: 300 }, // on the touchline
    shapes: [{ kind: "arrow", color: "#facc15", x1: 878, y1: 295, x2: 750, y2: 190 }],
  },
  {
    id: "kickin-defend",
    title: "Kick-in — their ball",
    text: "Their kick-in from the side: get goal-side and mark up. ONE of us presses the ball, the rest don't ball-watch.",
    home: [
      { x: 815, y: 360 }, // presses the kicker
      { x: 705, y: 470 }, // marks the down-line option, goal-side
      { x: 545, y: 385 }, // marks central, goal-side
      { x: 455, y: 505 }, // covers in front of our goal
    ],
    away: [
      { x: 905, y: 300 }, // their kicker, on the touchline
      { x: 730, y: 425 }, // their option down the line
      { x: 560, y: 300 }, // their central option
    ],
    ball: { x: 884, y: 300 },
  },
  {
    id: "goalkick-attack",
    title: "Goal kick — our ball",
    text: "Our goal kick (taken from the line): the other team has to stay in their own half — so spread WIDE and play it out, don't just boot it!",
    home: [
      { x: 360, y: 605 }, // the taker, on the goal line
      { x: 150, y: 470 }, // wide left to receive
      { x: 740, y: 470 }, // wide right to receive
      { x: 470, y: 330 }, // central outlet, higher up
    ],
    away: [
      // the whole opposition retreated into their own half (above halfway)
      { x: 230, y: 215 },
      { x: 450, y: 150 },
      { x: 670, y: 215 },
      { x: 450, y: 265 },
    ],
    ball: { x: 360, y: 568 }, // on the goal line
    shapes: [{ kind: "arrow", color: "#facc15", x1: 360, y1: 566, x2: 165, y2: 470 }],
  },
];
