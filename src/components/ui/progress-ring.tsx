"use client"

import * as React from "react"
import { cn } from "cn"
import { Progress as ProgressPrimitive } from "radix-ui"

// A ring in the green gradient (
// the arc springs to each new step on the soft spring, round ends, the number in the middle).
// Same base and interface as the shadcn progress: Radix Progress sets role="progressbar", aria-valuenow, data-state and
// data-value; the children are drawn in the middle of the ring.
// - The arc is a dashed circle (pathLength 100) whose dash length is --plush-ring-value (value / max, 0 to 1) times 100,
//   so a new value glides on the soft spring. Its overshoot past 100 % only lengthens the dash, the ring stays closed.
// - In a box of 120 (r 50, stroke 10) the ring keeps half a stroke of room inside its box: 110 px across.
// - Turned -90 deg so it starts at 12 o'clock; the gradient turns with it (green bottom left, lime top right).
// - At 0 and while indeterminate the arc fades out (a round cap would leave a dot); there is no endless spinner.
// - Size, stroke and track colour are variables, set on the ring or on any container around it:
//   --plush-ring-size (default --plush-ring, 120 px), --plush-ring-stroke (default --plush-ring-stroke-part of the size: 10 px),
//   --plush-ring-track (default --plush-fill-strong; on a dark surface --plush-on-accent-track).
// - The middle is made for a short value: its text is --plush-ring-text-part of the size (30 px) and wraps inside the inner circle. Longer words
//   bring their own smaller text size, or they grow past the ring (the box grows with them, nothing is cut off).
//   Its digits are tabular, so a changing number does not shift the text around it.
// - Optional part ProgressRingValue: the ring's own value as a rolling number (like the counter's digits, CSS only). The
//   whole number goes into --plush-ring-number (registered below), which glides on the arc's soft spring; each
//   digit cell stacks 0-9 and places every glyph from that gliding number, so the digits roll up when the value grows and
//   down when it shrinks. A value set on load is simply there. The cells reserve room for the largest value (as many
//   digits as max), so "1/12" and "10/12" keep the slash in one place; a leading zero stays invisible.

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

const ProgressRingContext = React.createContext<{ value: number | null; max: number } | null>(null)

// Registers --plush-ring-number as a number, so its transition glides. A React <style> with an href lands in <head> once per page (also in
// the server HTML), however often it renders. Not in tokens.css: the shadcn CLI writes @property into globals.css again on
// every add.
const ringNumberProperty = (
  <style href="plush-property-ring-number" precedence="plush">
    {'@property --plush-ring-number { syntax: "<number>"; inherits: true; initial-value: 0; }'}
  </style>
)

// Same href and text as in accordion.tsx, so React keeps one.
// Registers --plush-pop-armed as a number (a 0s transition with a delay flips it, the pop keyframes read it). A React <style> with an href lands in <head> once per page (also in
// the server HTML), however often it renders. Not in tokens.css: the shadcn CLI writes @property into globals.css again on
// every add.
const popArmedProperty = (
  <style href="plush-property-pop-armed" precedence="plush">
    {'@property --plush-pop-armed { syntax: "<number>"; inherits: false; initial-value: 0; }'}
  </style>
)

function ProgressRing({
  className,
  style,
  value,
  max,
  children,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const gradientId = `plush-ring-${React.useId().replace(/[^a-zA-Z0-9-]/g, "")}`
  // A value beyond 0..max is held at that end (Radix would log an error and drop it); anything not a number is indeterminate.
  const limit = typeof max === "number" && max > 0 ? max : 100
  const safe = typeof value === "number" && !Number.isNaN(value) ? Math.min(limit, Math.max(0, value)) : null
  const ratio = safe === null ? 0 : safe / limit

  return (
    <>
      {ringNumberProperty}
      {popArmedProperty}
      <ProgressPrimitive.Root
        data-slot="progress-ring"
        value={safe}
        max={limit}
        className={cn(
          "group/progress-ring plush-font relative inline-grid min-h-(--plush-ring-d) w-(--plush-ring-d) max-w-full shrink-0 place-items-center text-center",
          "[--plush-ring-d:var(--plush-ring-size,var(--plush-ring))] [--plush-ring-w:var(--plush-ring-stroke,calc(var(--plush-ring-d)*var(--plush-ring-stroke-part)))]",
          // Reaching 100 %: the ring pops once (plush-pop) as the arc arrives. --plush-pop-armed stays 1 for the length of the pop
          // after a change to complete and is 0 on a ring that loads complete, so that one stays still.
          "[--plush-pop-peak:var(--plush-pop-peak-progress)] [--plush-pop-armed:1] data-[state=complete]:[--plush-pop-armed:0]",
          "data-[state=complete]:[transition:--plush-pop-armed_0s_linear_calc(2*var(--plush-beat)_+_var(--plush-dur-pop))]",
          "data-[state=complete]:animate-[plush-pop_var(--plush-dur-pop)_var(--plush-ease-fade)_calc(2*var(--plush-beat))]",
          className
        )}
        style={{ "--plush-ring-value": ratio, ...style } as React.CSSProperties}
        {...props}
      >
        <ProgressRingContext.Provider value={{ value: safe, max: limit }}>
        <svg
          aria-hidden="true"
          focusable="false"
          className="pointer-events-none col-start-1 row-start-1 size-(--plush-ring-d) -rotate-90 overflow-visible fill-none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" className="[stop-color:var(--plush-select-a)]" />
              <stop offset="1" className="[stop-color:var(--plush-select-b)]" />
            </linearGradient>
          </defs>
          <circle
            data-slot="progress-ring-track"
            className="[cx:50%] [cy:50%] [r:calc(50%_-_var(--plush-ring-w))] [stroke-width:var(--plush-ring-w)] [stroke:var(--plush-ring-track,var(--plush-fill-strong))]"
          />
          <ProgressPrimitive.Indicator asChild>
            <circle
              data-slot="progress-ring-indicator"
              pathLength={100}
              stroke={`url(#${gradientId})`}
              strokeLinecap="round"
              className={cn(
                "[cx:50%] [cy:50%] [r:calc(50%_-_var(--plush-ring-w))] [stroke-width:var(--plush-ring-w)]",
                "[stroke-dasharray:calc(var(--plush-ring-value)*100)_100]",
                "[transition:stroke-dasharray_var(--plush-dur-soft)_var(--plush-ease-soft),opacity_var(--plush-dur-fade)_var(--plush-ease-fade)]",
                // Down to 0: the arc shrinks first and fades one beat later.
                "data-[value=0]:opacity-0 data-[value=0]:[transition:stroke-dasharray_var(--plush-dur-soft)_var(--plush-ease-soft),opacity_var(--plush-dur-fade)_var(--plush-ease-fade)_var(--plush-beat)]",
                "data-[state=indeterminate]:opacity-0"
              )}
            />
          </ProgressPrimitive.Indicator>
        </svg>
        <div
          data-slot="progress-ring-label"
          className="col-start-1 row-start-1 max-w-[calc(var(--plush-ring-d)_-_3*var(--plush-ring-w))] min-w-0 text-[length:calc(var(--plush-ring-d)*var(--plush-ring-text-part))] leading-[normal] font-(--plush-weight-semi) text-balance break-words tabular-nums hyphens-auto"
        >
          {children}
        </div>
        </ProgressRingContext.Provider>
      </ProgressPrimitive.Root>
    </>
  )
}

// The ring's value as a rolling whole number (see top of file). Indeterminate: nothing.
// ponytail: every place rolls; a CSS number keeps about six significant digits, so a max above 999 999 would blur the
// lowest digit while it turns. Upgrade path: let only the lowest four places roll and write the higher ones as text (counter.tsx).
function ProgressRingValue({ className, style, ...props }: React.ComponentProps<"span">) {
  const ring = React.useContext(ProgressRingContext)
  if (!ring) throw new Error("ProgressRingValue must be used within <ProgressRing>")
  if (ring.value === null) return null
  const shown = Math.round(ring.value)
  const places = String(Math.floor(ring.max)).length
  return (
    <span
      data-slot="progress-ring-value"
      style={{ "--plush-ring-number": shown, ...style } as React.CSSProperties}
      className={cn(
        "inline-flex tabular-nums [transition:--plush-ring-number_var(--plush-dur-soft)_var(--plush-ease-soft)]",
        className
      )}
      {...props}
    >
      <span className="sr-only">{shown}</span>
      {Array.from({ length: places }, (_, i) => (
        <ProgressRingDigit key={places - 1 - i} place={places - 1 - i} />
      ))}
    </span>
  )
}

// One digit cell: the lowest place follows the number, a higher place holds floor(number / 10^place) and turns over while
// the places below it pass from 9 to 0 (as in counter.tsx).
function ProgressRingDigit({ place }: { place: number }) {
  return (
    <span
      aria-hidden="true"
      style={{ "--plush-ring-place": 10 ** place } as React.CSSProperties}
      className={cn(
        "grid overflow-y-clip select-none",
        "[--plush-ring-pos:calc(round(down,var(--plush-ring-number)/var(--plush-ring-place),1)_+_clamp(0,mod(var(--plush-ring-number),var(--plush-ring-place))_-_var(--plush-ring-place)_+_1,1))]",
        // A leading zero (a higher place while the number is below it) is not shown; it fades in over the last step.
        "[--plush-ring-shown:clamp(0,var(--plush-ring-number)_-_var(--plush-ring-place)_+_1,1)]"
      )}
    >
      {DIGITS.map((digit) => (
        <span
          key={digit}
          style={{ "--plush-ring-digit": digit, "--plush-ring-lead": digit === 0 && place > 0 ? 1 : 0 } as React.CSSProperties}
          className={cn(
            "col-start-1 row-start-1",
            // d: how far this glyph is from the shown position, -5 .. 5 around the wheel. Far glyphs wait one roll away.
            "[--plush-ring-d:calc(mod(var(--plush-ring-digit)_-_var(--plush-ring-pos)_+_5,10)_-_5)]",
            "[translate:0_calc(clamp(-1,var(--plush-ring-d),1)*var(--plush-roll))]",
            // Visible within 0.6 of a step, smoothstep; a leading zero times --plush-ring-shown.
            "[--plush-ring-o:clamp(0,1_-_max(var(--plush-ring-d),-1*var(--plush-ring-d))/.6,1)]",
            "[opacity:calc(var(--plush-ring-o)*var(--plush-ring-o)*(3_-_2*var(--plush-ring-o))*(1_-_var(--plush-ring-lead)*(1_-_var(--plush-ring-shown))))]"
          )}
        >
          {digit}
        </span>
      ))}
    </span>
  )
}

export { ProgressRing, ProgressRingValue }
