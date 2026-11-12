"use client"

import * as React from "react"
import { cn } from "cn"
import { Tooltip as TooltipPrimitive } from "radix-ui"

// The black bubble is its own layer under the text. Opening, it starts as a dot (--plush-tooltip-dot) on the edge that faces the
// trigger (any data-side) and grows out: first it moves to the middle, then it gets its height,
// then its width (the calm spring), and last the arrow and the text come in. Closing runs the other way round: text,
// arrow, width, height, and the dot sinks back to the trigger while it fades. One CSS transition per property, the
// start values in @starting-style; Radix waits for the delayed fade-out of the content before it unmounts.

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      className={cn("plush-focus-ring", className)}
      {...props}
    />
  )
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "group/tooltip plush-font relative isolate z-50 inline-flex w-fit max-w-42 min-w-0 origin-(--radix-tooltip-content-transform-origin) items-center px-3.5 py-2.5 text-center text-(length:--plush-text-md) leading-5 font-(--plush-weight-semi) text-balance text-(--plush-on-accent) has-data-[slot=kbd]:pr-1.5",
          // Where the dot sits: in the middle of the edge that faces the trigger. Only data-side is known when the start
          // values are taken (the trigger size and the arrow position arrive a frame later), so align start/end and
          // collision shifts start from the middle of the edge, not from the arrow.
          "data-[side=top]:[--plush-tooltip-x:50%] data-[side=top]:[--plush-tooltip-y:100%] data-[side=bottom]:[--plush-tooltip-x:50%] data-[side=bottom]:[--plush-tooltip-y:0%]",
          "data-[side=left]:[--plush-tooltip-x:100%] data-[side=left]:[--plush-tooltip-y:50%] data-[side=right]:[--plush-tooltip-x:0%] data-[side=right]:[--plush-tooltip-y:50%]",
          // In: a fade while the dot leaves the trigger. Out: the fade waits until the bubble is a dot again.
          "animate-[plush-fade-in_var(--plush-dur-fade)_var(--plush-ease-fade)]",
          "data-[state=closed]:pointer-events-none data-[state=closed]:animate-[plush-fade-out_var(--plush-dur-fade)_var(--plush-ease-fade)_calc(5.5*var(--plush-stagger))_both]",
          className
        )}
        {...props}
      >
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-1/2 left-1/2 -z-1 h-full w-full -translate-1/2 rounded-(--plush-radius-tooltip) bg-(--plush-accent)",
            "starting:top-(--plush-tooltip-y) starting:left-(--plush-tooltip-x) starting:size-(--plush-tooltip-dot)",
            "group-data-[state=closed]/tooltip:top-(--plush-tooltip-y) group-data-[state=closed]/tooltip:left-(--plush-tooltip-x) group-data-[state=closed]/tooltip:size-(--plush-tooltip-dot)",
            "[transition:top_var(--plush-dur-soft)_var(--plush-ease-soft),left_var(--plush-dur-soft)_var(--plush-ease-soft),height_var(--plush-dur-soft)_var(--plush-ease-soft)_var(--plush-stagger),width_var(--plush-dur-calm)_var(--plush-ease-calm)_calc(2*var(--plush-stagger))]",
            "group-data-[state=closed]/tooltip:[transition:width_var(--plush-dur-calm)_var(--plush-ease-calm)_calc(1.5*var(--plush-stagger)),height_var(--plush-dur-soft)_var(--plush-ease-soft)_calc(2.5*var(--plush-stagger)),top_var(--plush-dur-soft)_var(--plush-ease-soft)_calc(4.5*var(--plush-stagger)),left_var(--plush-dur-soft)_var(--plush-ease-soft)_calc(4.5*var(--plush-stagger))]"
          )}
        />
        <span
          className={cn(
            "flex min-w-0 items-center justify-center gap-1.5 wrap-anywhere",
            "starting:opacity-0 group-data-[state=closed]/tooltip:opacity-0",
            "[transition:opacity_var(--plush-dur-fade)_var(--plush-ease-fade)_calc(5.5*var(--plush-stagger))] group-data-[state=closed]/tooltip:[transition:opacity_var(--plush-dur-fade)_var(--plush-ease-fade)]"
          )}
        >
          {children}
        </span>
        <TooltipPrimitive.Arrow
          className={cn(
            "size-3 translate-y-[calc(-50%_-_1px)] rotate-45 rounded-xs bg-(--plush-accent) fill-(--plush-accent)",
            "starting:scale-0 group-data-[state=closed]/tooltip:scale-0",
            "[transition:scale_var(--plush-dur-spring)_var(--plush-ease-spring)_calc(4.5*var(--plush-stagger))] group-data-[state=closed]/tooltip:[transition:scale_var(--plush-dur-spring)_var(--plush-ease-spring)_var(--plush-stagger)]"
          )}
        />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
