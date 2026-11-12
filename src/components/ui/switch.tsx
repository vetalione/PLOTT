"use client"

import * as React from "react"
import { cn } from "cn"
import { Switch as SwitchPrimitive } from "radix-ui"

// The track stays --plush-control-off; the green ink is its own layer that fades in on top (::before).
// The knob is placed by both edges: the edge in the direction of travel rides the spring, the trailing edge the calm
// spring, so the knob stretches on the way and lands at knob width. Held down (pointer or Space) it widens 6 px
// towards the middle and keeps 1 px to the rim, like iOS.
function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch plush-font plush-focus-ring relative inline-flex h-(--plush-switch-h) w-(--plush-switch-w) shrink-0 items-center rounded-(--plush-radius-full) bg-(--plush-control-off)",
        // Geometry. default 52 x 32, knob 28, inset 2; sm = 3/4 of it with the same inset (39 x 24, knob 20).
        "[--plush-switch-w:var(--plush-toggle-w)] [--plush-switch-h:var(--plush-toggle-h)] [--plush-switch-knob:var(--plush-knob)]",
        "data-[size=sm]:[--plush-switch-w:var(--plush-toggle-w-sm)] data-[size=sm]:[--plush-switch-h:var(--plush-toggle-h-sm)]",
        "data-[size=sm]:[--plush-switch-knob:var(--plush-knob-sm)]",
        "[--plush-switch-inset:calc((var(--plush-switch-h)_-_var(--plush-switch-knob))/2)]",
        "[--plush-switch-far:calc(var(--plush-switch-w)_-_var(--plush-switch-h)_+_var(--plush-switch-inset))]",
        // Held: --plush-knob-stretch wider (0.3 of the travel, as in toggleTo; sm 3/4 of it), outer edge 1 px from the rim.
        "[--plush-switch-stretch:var(--plush-knob-stretch)] data-[size=sm]:[--plush-switch-stretch:calc(var(--plush-knob-stretch)*.75)]",
        "[--plush-switch-near-held:calc(var(--plush-switch-inset)/2)]",
        "[--plush-switch-far-held:calc(var(--plush-switch-far)_-_var(--plush-switch-stretch)_+_var(--plush-switch-inset)/2)]",
        // Green ink as its own layer, faded in.
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-(image:--plush-select-fill) before:shadow-(--plush-select-gloss) before:opacity-0",
        "before:[transition:opacity_var(--plush-dur-fade)_var(--plush-ease-fade),filter_var(--plush-dur-fast)_var(--plush-ease-fade)] data-[state=checked]:before:opacity-100",
        // Hover (mouse only, never disabled; also over its <label>): the off track one step darker, the green layer only
        // a little brighter (the knob grows, see the thumb). --plush-control-hover is the grey of an empty control under the pointer.
        "enabled:data-[state=unchecked]:hover:bg-(--plush-control-hover) enabled:hover:before:brightness-(--plush-hover-bright)",
        // Larger hit area, as in the original.
        "after:absolute after:-inset-x-3 after:-inset-y-2",
        "data-disabled:cursor-not-allowed data-disabled:opacity-(--plush-disabled-opacity)",
        // Error: the library's red edge, a 2 px ring right outside the track (on or off), faded in. The black focus ring
        // stays as it is and sits just outside the red one.
        "[transition:box-shadow_var(--plush-dur-fade)_var(--plush-ease-fade),background-color_var(--plush-dur-fast)_var(--plush-ease-fade)] aria-invalid:ring-(length:--plush-focus-width) aria-invalid:ring-(--plush-danger)",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none absolute top-(--plush-switch-inset) bottom-(--plush-switch-inset) block rounded-(--plush-radius-full) bg-(--plush-surface) shadow-(--plush-shadow-knob)",
          "left-(--plush-switch-inset) right-(--plush-switch-far)",
          "[transition:left_var(--plush-dur-spring)_var(--plush-ease-spring),right_var(--plush-dur-calm)_var(--plush-ease-calm),box-shadow_var(--plush-dur-fade)_var(--plush-ease-fade),scale_var(--plush-dur-spring)_var(--plush-ease-spring)]",
          "data-[state=checked]:left-(--plush-switch-far) data-[state=checked]:right-(--plush-switch-inset) data-[state=checked]:shadow-(--plush-select-knob-shadow)",
          "data-[state=checked]:[transition:left_var(--plush-dur-calm)_var(--plush-ease-calm),right_var(--plush-dur-spring)_var(--plush-ease-spring),box-shadow_var(--plush-dur-fade)_var(--plush-ease-fade),scale_var(--plush-dur-spring)_var(--plush-ease-spring)]",
          // Hover over the switch: the knob grows a little on the spring; not while held (the held knob reaches the rim).
          "[@media(hover:hover)]:group-[:enabled:hover:not(:active)]/switch:scale-(--plush-hover-grow)",
          "group-enabled/switch:group-active/switch:left-(--plush-switch-near-held) group-enabled/switch:group-active/switch:right-(--plush-switch-far-held) group-enabled/switch:group-active/switch:shadow-(--plush-select-knob-shadow)",
          "group-enabled/switch:group-active/switch:data-[state=checked]:left-(--plush-switch-far-held) group-enabled/switch:group-active/switch:data-[state=checked]:right-(--plush-switch-near-held)",
          "group-enabled/switch:group-active/switch:[transition:left_var(--plush-dur-spring)_var(--plush-ease-spring),right_var(--plush-dur-spring)_var(--plush-ease-spring),box-shadow_var(--plush-dur-fade)_var(--plush-ease-fade),scale_var(--plush-dur-spring)_var(--plush-ease-spring)]"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
