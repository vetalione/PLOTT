"use client";

import * as React from "react";
import { Confetti, type ConfettiHandle } from "./confetti";

export type WishButtonState = "idle" | "charging" | "done";

// Loose elliptical orbits around the button. Each turns at its own pace and direction, so together
// they read as one living, never-repeating scribble.
const RINGS = [
  { rx: 146, ry: 118, tilt: 0, dur: 26, stroke: "url(#wish-green)", width: 2.6, opacity: 0.95 },
  { rx: 120, ry: 146, tilt: 40, dur: -19, stroke: "url(#wish-pink)", width: 1.8, opacity: 0.8 },
  { rx: 152, ry: 128, tilt: 75, dur: 33, stroke: "url(#wish-green)", width: 1.4, opacity: 0.6 },
  { rx: 126, ry: 140, tilt: 120, dur: -24, stroke: "#141414", width: 1, opacity: 0.16 },
  { rx: 142, ry: 114, tilt: 160, dur: 41, stroke: "url(#wish-pink)", width: 1.1, opacity: 0.45 },
  { rx: 132, ry: 152, tilt: 15, dur: -37, stroke: "#141414", width: 0.8, opacity: 0.1 },
];

// A few sparks riding the orbits.
const SPARKS = [
  { r: 150, angle: 20, size: 3.2, dur: 30, fill: "#16c26b" },
  { r: 128, angle: 150, size: 2.4, dur: -22, fill: "#ee4a92" },
  { r: 156, angle: 250, size: 2, dur: 44, fill: "#b8e62e" },
  { r: 122, angle: 310, size: 1.8, dur: -35, fill: "#141414" },
];

export function WishButton({
  state,
  onPress,
  label,
}: {
  state: WishButtonState;
  onPress: () => void;
  label: string;
}) {
  const ringsRef = React.useRef<SVGSVGElement>(null);
  const confetti = React.useRef<ConfettiHandle>(null);

  // Speed the orbits up while the wish is on its way; playbackRate changes without a visual jump.
  React.useEffect(() => {
    const rate = state === "charging" ? 9 : 1;
    ringsRef.current?.getAnimations({ subtree: true }).forEach((animation) => {
      try {
        animation.updatePlaybackRate(rate);
      } catch {
        animation.playbackRate = rate;
      }
    });
    if (state === "done") confetti.current?.fire({ count: 110, power: 1.15 });
  }, [state]);

  return (
    <div className="wish-stage" data-state={state}>
      <div className="wish-glow" />
      <svg ref={ringsRef} className="wish-rings" viewBox="-170 -170 340 340" aria-hidden>
        <defs>
          <linearGradient id="wish-green" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#16c26b" />
            <stop offset="1" stopColor="#b8e62e" />
          </linearGradient>
          <linearGradient id="wish-pink" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ee4a92" />
            <stop offset="1" stopColor="#f5a524" />
          </linearGradient>
        </defs>
        {RINGS.map((ring, i) => (
          <g key={i} transform={`rotate(${ring.tilt})`}>
            <g
              className="wish-ring"
              style={
                {
                  "--d": `${Math.abs(ring.dur)}s`,
                  animationDirection: ring.dur < 0 ? "reverse" : "normal",
                } as React.CSSProperties
              }
            >
              <ellipse
                rx={ring.rx}
                ry={ring.ry}
                fill="none"
                stroke={ring.stroke}
                strokeWidth={ring.width}
                opacity={ring.opacity}
              />
            </g>
          </g>
        ))}
        {SPARKS.map((spark, i) => (
          <g
            key={i}
            className="wish-ring"
            style={
              {
                "--d": `${Math.abs(spark.dur)}s`,
                animationDirection: spark.dur < 0 ? "reverse" : "normal",
              } as React.CSSProperties
            }
          >
            <circle
              cx={Math.cos((spark.angle * Math.PI) / 180) * spark.r}
              cy={Math.sin((spark.angle * Math.PI) / 180) * spark.r}
              r={spark.size}
              fill={spark.fill}
            />
          </g>
        ))}
      </svg>

      <Confetti ref={confetti} className="pointer-events-none absolute -inset-x-16 -inset-y-10 z-10 h-[calc(100%+5rem)] w-[calc(100%+8rem)]" />

      <div className="wish-socket">
        <span className="wish-shockwave" />
        <button
          type="button"
          className="wish-btn"
          onClick={onPress}
          disabled={state !== "idle"}
          aria-label={label}
          aria-busy={state === "charging"}
        >
          <svg className="wish-glyph" viewBox="0 0 24 24" aria-hidden>
            <path className="stem" d="M12 3.2v8.3" />
            <path className="arc" d="M6.6 6.9a7.6 7.6 0 1 0 10.8 0" />
            <path className="check" pathLength={1} d="M5.5 12.6l4.4 4.4 8.6-9.4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
