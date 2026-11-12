"use client"

import * as React from "react"
import { cn } from "cn"
import { Progress as ProgressPrimitive } from "radix-ui"

// The fill is drawn by its width, so the green line always runs across the filled part only; it glides
// to a new value on the calm spring.
// Two differences to the shadcn original, both needed for the states Radix sets:
// - value goes to the root as well, so Radix sets aria-valuenow and data-state (loading, complete, indeterminate); the
//   original keeps it back, and every bar reads as indeterminate.
// - the fill is value / max (clamped), so a full bar and data-state=complete agree for any max.
// Complete: the fill lights up once (a light veil that fades out) when the fill has nearly arrived. Only a change to
// complete shows it: the veil is hidden in every other state and turns visible after a delay, without a transition of its
// own, so a bar that loads complete stays still.
// Indeterminate (no value): the green line lies faint across the whole track, at rest. No endless loop (contract).
function Progress({
  className,
  value,
  max,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  // Radix logs an error and drops a value outside 0..max (and a max <= 0); here a value beyond either end is held at
  // that end, so 150 of 100 is a full, complete bar and -20 an empty one; anything not a number is indeterminate.
  const total = typeof max === "number" && max > 0 ? max : 100
  const safe = typeof value === "number" && !Number.isNaN(value) ? Math.min(total, Math.max(0, value)) : null
  const percent = safe === null ? 0 : (safe / total) * 100

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={safe}
      max={total}
      className={cn(
        "plush-font relative flex h-(--plush-track) w-full items-center overflow-x-hidden rounded-(--plush-radius-full) bg-(--plush-fill-strong)",
        // Indeterminate: the green line across the whole track, faint and still; fades out when a value arrives.
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-(image:--plush-select-line) before:opacity-0",
        "before:transition-opacity before:duration-(--plush-dur-fade) before:ease-(--plush-ease-fade)",
        "data-[state=indeterminate]:before:opacity-(--plush-plate-opacity)",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "relative h-full shrink-0 rounded-(--plush-radius-full) bg-(image:--plush-select-line) shadow-(--plush-select-gloss)",
          "[transition:width_var(--plush-dur-calm)_var(--plush-ease-calm)]",
          // The light-up at complete: hidden at full strength in every other state; at complete it turns visible two
          // beats later (the fill is then ~90 % of the way) and fades out.
          "after:pointer-events-none after:absolute after:inset-0 after:invisible after:rounded-[inherit] after:bg-(--plush-flash)",
          "data-[state=complete]:after:visible data-[state=complete]:after:opacity-0",
          "data-[state=complete]:after:[transition:opacity_var(--plush-dur-slow)_var(--plush-ease-fade)_calc(2*var(--plush-beat)),visibility_0s_calc(2*var(--plush-beat))]"
        )}
        style={{ width: `${percent}%` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
