"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Tabs as TabsPrimitive } from "radix-ui"

// The white pill glides to the chosen tab. It is drawn twice, as two spans at the end of the list, both anchored (CSS
// anchor positioning) to the active trigger: the lower one (plush-tabs-pill) rides the quick spring, the upper one
// (plush-tabs-pill-trail) the soft one. Together they cover the span between them, so in either direction the leading
// edge springs first and the trailing edge follows: the pill stretches as it leaves and closes up at the target.
// Only the lower layer casts the shadow, so at rest it is exactly one pill. Real elements, not
// ::before/::after of the list: Safari starts no transition on a pseudo-element that a :has() rule restyles at the same
// moment, so the pill jumped there. Browsers without anchor positioning get a plain white fill on the active trigger,
// like the original. Held down, the pill gives a little (--plush-press-scale-wide); new content fades in.

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs plush-font flex min-w-0 gap-3 data-[orientation=horizontal]:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  [
    "group/tabs-list plush-focus-ring relative isolate inline-flex w-fit max-w-full items-center justify-center text-(--plush-ink-2) [anchor-scope:--plush-tabs-pill]",
    "group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col group-data-[orientation=vertical]/tabs:items-stretch",
    // More tabs than fit side by side (even with their words wrapped) go on to a second row instead of sticking out.
    "group-data-[orientation=horizontal]/tabs:flex-wrap",
    // The pill glides only while the bar is in use (pointer on it, pressed, focus inside). On page load, while fonts swap and
    // when the window is resized it sits on its tab at once instead of trailing. A glide that has started runs to the end:
    // only its duration is switched, never the transition itself.
    "[--plush-tabs-glide:0] [&:is(:focus-within,:hover,:active)]:[--plush-tabs-glide:1]",
  ],
  {
    variants: {
      variant: {
        // The grey bar: 5 px around the tabs.
        default: "rounded-(--plush-radius-sheet) bg-(--plush-fill-strong) p-1.25",
        // No bar: the pill becomes a green line under the active tab (beside it when vertical).
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Both layers of the pill (see top of file): anchored to the active trigger on all four sides, under the words.
const tabsPill = [
  "pointer-events-none absolute -z-10 opacity-0",
  "[position-anchor:--plush-tabs-pill] top-[anchor(top)] right-[anchor(right)] bottom-[anchor(bottom)] left-[anchor(left)]",
  "not-supports-[anchor-name:--plush-tabs-pill]:hidden supports-[anchor-name:--plush-tabs-pill]:group-has-[[data-state=active]]/tabs-list:opacity-100",
  // Held down on the active tab (pointer or Space): the pill gives a little.
  "group-has-[[data-state=active]:enabled:active]/tabs-list:[scale:var(--plush-press-scale-wide)]",
]

// Heading for the first or last tab, the outer edge of both layers rides the calm spring: its ~1 % overshoot stays
// inside the bar's padding (the pill keeps 2 px from the bar's edge), so nothing has to be clipped.
const tabsPillLead = [
  "[transition:top_calc(var(--plush-dur-spring)*var(--plush-tabs-glide))_var(--plush-ease-spring),right_calc(var(--plush-dur-spring)*var(--plush-tabs-glide))_var(--plush-ease-spring),bottom_calc(var(--plush-dur-spring)*var(--plush-tabs-glide))_var(--plush-ease-spring),left_calc(var(--plush-dur-spring)*var(--plush-tabs-glide))_var(--plush-ease-spring),scale_var(--plush-dur-spring)_var(--plush-ease-spring),opacity_var(--plush-dur-fade)_var(--plush-ease-fade)]",
  "group-has-[>[data-state=active]:nth-child(1_of_[role=tab])]/tabs-list:[transition:top_calc(var(--plush-dur-calm)*var(--plush-tabs-glide))_var(--plush-ease-calm),right_calc(var(--plush-dur-spring)*var(--plush-tabs-glide))_var(--plush-ease-spring),bottom_calc(var(--plush-dur-spring)*var(--plush-tabs-glide))_var(--plush-ease-spring),left_calc(var(--plush-dur-calm)*var(--plush-tabs-glide))_var(--plush-ease-calm),scale_var(--plush-dur-spring)_var(--plush-ease-spring),opacity_var(--plush-dur-fade)_var(--plush-ease-fade)]",
  "group-has-[>[data-state=active]:nth-last-child(1_of_[role=tab])]/tabs-list:[transition:top_calc(var(--plush-dur-spring)*var(--plush-tabs-glide))_var(--plush-ease-spring),right_calc(var(--plush-dur-calm)*var(--plush-tabs-glide))_var(--plush-ease-calm),bottom_calc(var(--plush-dur-calm)*var(--plush-tabs-glide))_var(--plush-ease-calm),left_calc(var(--plush-dur-spring)*var(--plush-tabs-glide))_var(--plush-ease-spring),scale_var(--plush-dur-spring)_var(--plush-ease-spring),opacity_var(--plush-dur-fade)_var(--plush-ease-fade)]",
]
const tabsPillTrail = [
  "[transition:top_calc(var(--plush-dur-soft)*var(--plush-tabs-glide))_var(--plush-ease-soft),right_calc(var(--plush-dur-soft)*var(--plush-tabs-glide))_var(--plush-ease-soft),bottom_calc(var(--plush-dur-soft)*var(--plush-tabs-glide))_var(--plush-ease-soft),left_calc(var(--plush-dur-soft)*var(--plush-tabs-glide))_var(--plush-ease-soft),scale_var(--plush-dur-soft)_var(--plush-ease-soft),opacity_var(--plush-dur-fade)_var(--plush-ease-fade)]",
  "group-has-[>[data-state=active]:nth-child(1_of_[role=tab])]/tabs-list:[transition:top_calc(var(--plush-dur-calm)*var(--plush-tabs-glide))_var(--plush-ease-calm),right_calc(var(--plush-dur-soft)*var(--plush-tabs-glide))_var(--plush-ease-soft),bottom_calc(var(--plush-dur-soft)*var(--plush-tabs-glide))_var(--plush-ease-soft),left_calc(var(--plush-dur-calm)*var(--plush-tabs-glide))_var(--plush-ease-calm),scale_var(--plush-dur-soft)_var(--plush-ease-soft),opacity_var(--plush-dur-fade)_var(--plush-ease-fade)]",
  "group-has-[>[data-state=active]:nth-last-child(1_of_[role=tab])]/tabs-list:[transition:top_calc(var(--plush-dur-soft)*var(--plush-tabs-glide))_var(--plush-ease-soft),right_calc(var(--plush-dur-calm)*var(--plush-tabs-glide))_var(--plush-ease-calm),bottom_calc(var(--plush-dur-calm)*var(--plush-tabs-glide))_var(--plush-ease-calm),left_calc(var(--plush-dur-soft)*var(--plush-tabs-glide))_var(--plush-ease-soft),scale_var(--plush-dur-soft)_var(--plush-ease-soft),opacity_var(--plush-dur-fade)_var(--plush-ease-fade)]",
]

const tabsPillVariants = {
  // White pill; only the lower layer casts the active shadow (never clipped).
  default: {
    lead: "rounded-(--plush-radius-card) bg-(--plush-surface) shadow-(--plush-active-shadow)",
    trail: "rounded-(--plush-radius-card) bg-(--plush-surface)",
  },
  // Green line along the bottom of the list (along its right edge when vertical).
  line: {
    lead: "rounded-(--plush-radius-full) group-data-[orientation=horizontal]/tabs:top-auto group-data-[orientation=horizontal]/tabs:bottom-0 group-data-[orientation=horizontal]/tabs:h-0.5 group-data-[orientation=horizontal]/tabs:bg-(image:--plush-select-line) group-data-[orientation=vertical]/tabs:right-0 group-data-[orientation=vertical]/tabs:left-auto group-data-[orientation=vertical]/tabs:w-0.5 group-data-[orientation=vertical]/tabs:bg-(image:--plush-select-up)",
    trail: "rounded-(--plush-radius-full) group-data-[orientation=horizontal]/tabs:top-auto group-data-[orientation=horizontal]/tabs:bottom-0 group-data-[orientation=horizontal]/tabs:h-0.5 group-data-[orientation=horizontal]/tabs:bg-(image:--plush-select-line) group-data-[orientation=vertical]/tabs:right-0 group-data-[orientation=vertical]/tabs:left-auto group-data-[orientation=vertical]/tabs:w-0.5 group-data-[orientation=vertical]/tabs:bg-(image:--plush-select-up)",
  },
}

function TabsList({
  className,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  const pill = tabsPillVariants[variant ?? "default"]
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    >
      {children}
      <span aria-hidden="true" data-slot="plush-tabs-pill" className={cn(tabsPill, tabsPillLead, pill.lead)} />
      <span aria-hidden="true" data-slot="plush-tabs-pill-trail" className={cn(tabsPill, tabsPillTrail, pill.trail)} />
    </TabsPrimitive.List>
  )
}

// Radix focuses a tab from script on mousedown (so Safari focuses it at all), and Chrome counts that as keyboard focus:
// a mouse click showed the ring. Focusing it here first with focusVisible: false keeps the ring for the keyboard, as on
// every other button; Radix's own call then finds the tab focused already and still does the activating.
const focusByPointer: FocusOptions & { focusVisible?: boolean } = { focusVisible: false }

function TabsTrigger({
  className,
  onMouseDown,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      onMouseDown={(event) => {
        onMouseDown?.(event)
        if (!event.defaultPrevented && !props.disabled && event.button === 0 && !event.ctrlKey) {
          event.currentTarget.focus(focusByPointer)
        }
      }}
      className={cn(
        "plush-focus-ring relative inline-flex min-h-(--plush-h-tab) flex-1 items-center justify-center gap-1.5 rounded-(--plush-radius-card) px-3 py-2 text-center text-(length:--plush-text-xl) leading-tight font-(--plush-weight-semi) break-words text-(--plush-ink-2) select-none",
        // The words take the ink of the pill: the tab it leaves greys at once, the one it reaches darkens as it arrives.
        "[transition:color_var(--plush-dur-fast)_var(--plush-ease-fade)] hover:text-(--plush-ink) data-[state=active]:text-(--plush-ink) data-[state=active]:[transition:color_var(--plush-dur-slow)_var(--plush-ease-fade)]",
        "data-[state=active]:[anchor-name:--plush-tabs-pill]",
        "not-supports-[anchor-name:--plush-tabs-pill]:group-data-[variant=default]/tabs-list:data-[state=active]:bg-(--plush-surface) not-supports-[anchor-name:--plush-tabs-pill]:group-data-[variant=default]/tabs-list:data-[state=active]:shadow-(--plush-active-shadow)",
        "not-supports-[anchor-name:--plush-tabs-pill]:group-data-[variant=line]/tabs-list:data-[state=active]:underline not-supports-[anchor-name:--plush-tabs-pill]:group-data-[variant=line]/tabs-list:data-[state=active]:decoration-(--plush-select-a)",
        "disabled:cursor-not-allowed disabled:opacity-(--plush-disabled-opacity) disabled:hover:text-(--plush-ink-2)",
        // Line variant on a dark ground (plush-on-dark): no light bar behind the words, so they take the light inks.
        "in-[.plush-on-dark]:group-data-[variant=line]/tabs-list:text-(--plush-on-accent-2) in-[.plush-on-dark]:group-data-[variant=line]/tabs-list:enabled:hover:text-(--plush-on-accent) in-[.plush-on-dark]:group-data-[variant=line]/tabs-list:data-[state=active]:text-(--plush-on-accent)",
        "group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start group-data-[orientation=vertical]/tabs:px-4 group-data-[orientation=vertical]/tabs:text-left",
        "has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4.5",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "plush-focus-ring min-w-0 flex-1 text-(length:--plush-text-md) leading-snug break-words",
        // New content fades in (Radix skips it on first mount); the old one leaves at once, so nothing jumps.
        "data-[state=active]:animate-[plush-fade-in_var(--plush-dur-slow)_var(--plush-ease-fade)]",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
