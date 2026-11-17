"use client";

import * as React from "react";
import { Moon } from "./moon";

// The moments the moon touches down, as fractions of its run. They follow real bounce timing
// (each hop lasts as long as its height allows), which is what makes the roll feel physical.
const IMPACTS = [0.216, 0.566, 0.828];

// Little stars kicked up at each touchdown: direction and colour (moon yellow, Moonchat green).
const SPARKS = [
  { dx: -46, dy: -54, color: "#f7d32a" },
  { dx: -14, dy: -78, color: "#12a150" },
  { dx: 22, dy: -66, color: "#f7d32a" },
  { dx: 52, dy: -40, color: "#12a150" },
];

/**
 * An easter egg for wishes that mention Moonchat: the group's moon rolls across the screen,
 * bouncing along the navigation bar, and is gone. Purely decorative, never in the way of a tap.
 */
export function MoonRoll({ onDone }: { onDone: () => void }) {
  // Sized to the screen once; the spin matches the distance covered, so the moon rolls rather than slides.
  const [run] = React.useState(() => {
    const size = Math.round(Math.min(150, Math.max(96, window.innerWidth * 0.3)));
    const distance = window.innerWidth + size;
    return {
      size,
      turns: distance / (Math.PI * size),
      seconds: Math.min(6.5, Math.max(3.6, distance / 190)),
    };
  });

  return (
    <div
      className="moon-roll"
      aria-hidden
      style={
        {
          "--moon-size": `${run.size}px`,
          "--moon-turns": `${run.turns}turn`,
          "--moon-dur": `${run.seconds}s`,
        } as React.CSSProperties
      }
    >
      {IMPACTS.flatMap((at, hop) =>
        SPARKS.map((spark, i) => (
          <span
            key={`${hop}-${i}`}
            className="moon-spark"
            style={
              {
                "--at": at,
                "--dx": `${spark.dx * (1 - hop * 0.22)}px`,
                "--dy": `${spark.dy * (1 - hop * 0.22)}px`,
                color: spark.color,
              } as React.CSSProperties
            }
          />
        )),
      )}
      <div className="moon-roll-x" onAnimationEnd={(event) => event.target === event.currentTarget && onDone()}>
        <div className="moon-roll-y">
          <div className="moon-roll-squash">
            <div className="moon-roll-glow" />
            <div className="moon-roll-spin">
              <Moon className="block h-full w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
