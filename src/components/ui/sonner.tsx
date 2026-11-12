"use client"

import * as React from "react"
import { cn } from "cn"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  ExclamationMarkIcon,
  Loading03Icon,
  MultiplicationSignIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { Toaster as Sonner, type ToasterProps } from "sonner"

// The toast is a white pill, 60 px high,
// a round coloured dot with a white glyph on the left, the text in semibold ink.
// Sonner keeps its own motion (slide in, stack, expand on hover, swipe away). Its stylesheet is unlayered, so it wins
// over every utility: it owns transition, opacity, transform and outline of the toast <li> and the transition of the
// li's direct children. The plush moves therefore sit one level deeper, keyed to sonner's data attributes:
// - the white surface is the ::before of [data-content], drawn under the whole toast. It starts as a 60 px pill around
//   the dot (data-mounted=false) and unfolds to the full width; when the toast leaves (data-removed) it folds back;
// - the dot pops in from --plush-pop-scale and its glyph is wiped in left to right (the tick draws itself) whenever a
//   new icon appears, also when a promise turns from loading into success or error;
// - title and description come in last, fading and sliding 8 px from the dot's side, and leave first.
// Stacked toasts behind the front one hide their content (sonner does this only for styled toasts) but keep the surface.
// The few `!` below are the places where sonner's stylesheet would otherwise remove the shared focus ring or the press.

const behind = "group-data-[front=false]/toast:group-data-[expanded=false]/toast:opacity-0"

const dot =
  "grid size-8 shrink-0 place-items-center rounded-(--plush-radius-full) [transition:scale_var(--plush-dur-spring)_var(--plush-ease-spring)] starting:scale-(--plush-pop-scale)"
const glyph =
  "[clip-path:inset(0)] [transition:clip-path_var(--plush-dur-slow)_var(--plush-ease-fade)_calc(2.5*var(--plush-stagger))] starting:[clip-path:inset(0_100%_0_0)]"

const icons: ToasterProps["icons"] = {
  success: (
    <span className={cn(dot, "bg-(--plush-success) text-(--plush-on-success)")}>
      <HugeiconsIcon icon={Tick02Icon} size={20} strokeWidth={2.4} className={cn(glyph, "[&_path]:[stroke-linejoin:miter]")} aria-hidden />
    </span>
  ),
  info: (
    <span className={cn(dot, "bg-(--plush-accent) text-(--plush-on-accent)")}>
      {/* Hugeicons has no bare "i" (InfoIcon brings its own ring): the exclamation mark turned upside down is one. */}
      <HugeiconsIcon icon={ExclamationMarkIcon} size={18} strokeWidth={2.4} className={cn(glyph, "rotate-180")} aria-hidden />
    </span>
  ),
  warning: (
    <span className={cn(dot, "bg-(--plush-warning) text-(--plush-on-accent)")}>
      <HugeiconsIcon icon={ExclamationMarkIcon} size={18} strokeWidth={2.4} className={glyph} aria-hidden />
    </span>
  ),
  error: (
    <span className={cn(dot, "bg-(--plush-danger) text-(--plush-on-accent)")}>
      <HugeiconsIcon icon={MultiplicationSignIcon} size={18} strokeWidth={2.4} className={glyph} aria-hidden />
    </span>
  ),
  // Sonner shows this icon only while the toast loads: the glyph turns (plush-spin, the contract's one loop) until the
  // promise settles; with reduced motion it stands still.
  loading: (
    <span className={cn(dot, "bg-(--plush-fill) text-(--plush-ink)")}>
      <HugeiconsIcon
        icon={Loading03Icon}
        size={18}
        strokeWidth={2.4}
        className="animate-[plush-spin_var(--plush-dur-spin)_var(--plush-ease-spin)_infinite]"
        aria-hidden
      />
    </span>
  ),
  close: <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2.4} aria-hidden />,
}

// Text: fades and slides in after the surface has unfolded, leaves at once. Swipes keep sonner's own exit.
const text = cn(
  "translate-x-0 [transition:opacity_var(--plush-dur-fade)_var(--plush-ease-fade)_calc(3*var(--plush-stagger)),translate_var(--plush-dur-spring)_var(--plush-ease-spring)_calc(3*var(--plush-stagger))]",
  "group-data-[mounted=false]/toast:-translate-x-2 group-data-[mounted=false]/toast:opacity-0",
  "group-data-[removed=true]/toast:group-data-[swipe-out=false]/toast:-translate-x-2 group-data-[removed=true]/toast:group-data-[swipe-out=false]/toast:opacity-0",
  "group-data-[removed=true]/toast:[transition:opacity_var(--plush-dur-fast)_var(--plush-ease-fade),translate_var(--plush-dur-spring)_var(--plush-ease-spring)]",
  behind
)

const button =
  "plush-focus-ring inline-flex min-h-(--plush-h-chip-sm) max-w-full shrink-0 cursor-pointer items-center justify-center rounded-(--plush-radius-full) px-3.5 py-1.5 text-(length:--plush-text-sm) leading-tight font-(--plush-weight-semi) break-words [transition:scale_var(--plush-dur-spring)_var(--plush-ease-spring),background-color_var(--plush-dur-fast)_var(--plush-ease-fade),opacity_var(--plush-dur-fade)_var(--plush-ease-fade)_calc(3*var(--plush-stagger))]! active:scale-(--plush-press-scale-pill) group-data-[mounted=false]/toast:opacity-0 group-data-[removed=true]/toast:opacity-0 group-data-[removed=true]/toast:group-data-[swipe-out=false]/toast:[transition:scale_var(--plush-dur-spring)_var(--plush-ease-spring),background-color_var(--plush-dur-fast)_var(--plush-ease-fade),opacity_var(--plush-dur-fast)_var(--plush-ease-fade)]!"

const classNames: NonNullable<NonNullable<ToasterProps["toastOptions"]>["classNames"]> = {
  toast: cn(
    // pointer-events-auto: a modal dialog sets pointer-events: none on <body>; the toast lies above the dialog and has
    // to stay pressable there (sonner's own pointer-events: none on hidden toasts still wins, its stylesheet is unlayered).
    "group/toast plush-font plush-focus-ring! pointer-events-auto flex min-h-(--plush-h-toast) flex-wrap w-(--width) max-w-full min-w-0 items-center gap-3 rounded-(--plush-radius-sheet) py-3 ps-3.5 pe-4.5 text-(--plush-ink) shadow-none! break-words"
  ),
  icon: cn("relative grid size-8 shrink-0 place-items-center", behind),
  // The surface: absolute against the li, under everything in it, its width on a spring.
  content: cn(
    // At least 8rem wide so buttons wrap before the text gets narrow, but never wider than the toast (large root font).
    "flex min-w-[min(--spacing(32),100%)] flex-1 flex-col gap-0.5",
    "before:pointer-events-none before:absolute before:inset-y-0 before:start-0 before:-z-1 before:w-full before:rounded-(--plush-radius-sheet) before:bg-(--plush-surface) before:shadow-(--plush-card-shadow)",
    "before:[transition:width_var(--plush-dur-spring)_var(--plush-ease-spring)_var(--plush-stagger)]",
    "group-data-[mounted=false]/toast:before:w-(--plush-h-toast)",
    "group-data-[removed=true]/toast:group-data-[swipe-out=false]/toast:before:w-(--plush-h-toast) group-data-[removed=true]/toast:before:[transition:width_var(--plush-dur-spring)_var(--plush-ease-spring)]"
  ),
  title: cn("text-(length:--plush-text-lg) leading-snug font-(--plush-weight-semi) text-(--plush-ink)", text),
  description: cn("text-(length:--plush-text-sm) leading-snug font-(--plush-weight-medium) text-(--plush-ink-2)", text),
  // Under the pointer: the black action turns --plush-accent-hover, the grey cancel one step darker.
  actionButton: cn(button, "bg-(--plush-accent) text-(--plush-on-accent) hover:bg-(--plush-accent-hover)", behind),
  cancelButton: cn(button, "bg-(--plush-fill) text-(--plush-ink) hover:bg-(--plush-fill-strong)", behind),
  closeButton: cn(
    "plush-focus-ring absolute -start-1 -top-1 z-1 grid size-6 cursor-pointer place-items-center rounded-(--plush-radius-full) bg-(--plush-surface) text-(--plush-ink-2) shadow-(--plush-shadow-knob)",
    // A round icon button: under the pointer it grows a little and its grey glyph turns ink; pressing beats that.
    "[transition:scale_var(--plush-dur-spring)_var(--plush-ease-spring),background-color_var(--plush-dur-fast)_var(--plush-ease-fade),color_var(--plush-dur-fast)_var(--plush-ease-fade),opacity_var(--plush-dur-fade)_var(--plush-ease-fade)]! hover:not-active:not-data-[disabled=true]:scale-(--plush-hover-grow) hover:not-data-[disabled=true]:bg-(--plush-surface-hover) hover:not-data-[disabled=true]:text-(--plush-ink) active:scale-(--plush-press-scale)",
    "data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-(--plush-disabled-opacity)",
    behind
  ),
}

const Toaster = ({ className, icons: iconsProp, toastOptions, ...props }: ToasterProps) => {
  // Your toastOptions and icons are merged into ours (class names joined), so passing a duration keeps the look.
  const merged = { ...classNames }
  for (const [key, value] of Object.entries(toastOptions?.classNames ?? {})) {
    merged[key as keyof typeof merged] = cn(merged[key as keyof typeof merged], value)
  }

  return (
    <Sonner
      className={cn("toaster group plush-font", className)}
      icons={{ ...icons, ...iconsProp }}
      toastOptions={{ unstyled: true, ...toastOptions, classNames: merged }}
      {...props}
    />
  )
}

export { Toaster }
