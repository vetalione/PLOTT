import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

// Two badges: the black "Sent" status pill and the
// red counter on the bell. The variant picks the role:
// default is the black pill whose leading icon sits in a green disc (the tick of "Sent"); while
// aria-busy the disc fades away so a spinner shows bare on the black, like "Sending". destructive is the red counter.
// Size, like the shadcn badge it replaces: small for every variant, the counter's size (22 px, 13 px text). The big
// status pill (52 px, 18 px text) is a className on top (see the preview).
// Motion: in a live badge (aria-live, role=status) content that React swaps in (a new key: Sent <-> Sending, 2 -> 3)
// springs in: an icon grows from --plush-pop-scale, a word rises 10 px, both fade in. A badge used as a
// link or button gives on the spring while held and answers the pointer by its colour (a bare badge has no hover). Placing the counter on a button (absolute, ring in the background
// colour) is the caller's className.
// Corners are half the height of one line (a pill on one line, no blob when a long label wraps).
const badgeVariants = cva(
  [
    "group/badge plush-font plush-focus-ring relative inline-flex min-h-5.5 w-fit max-w-full min-w-5.5 shrink-0 items-center justify-center gap-1 rounded-[calc(var(--spacing)*2.75)] px-2 py-0.5 text-center text-(length:--plush-text-xs) leading-tight font-(--plush-weight-semi) wrap-anywhere select-none",
    // Hover colours and shadows on the fast fade; the red ring of an invalid badge keeps the softer fade-in.
    "[transition:scale_var(--plush-dur-spring)_var(--plush-ease-spring),background-color_var(--plush-dur-fast)_var(--plush-ease-fade),box-shadow_var(--plush-badge-shadow-dur,var(--plush-dur-fast))_var(--plush-ease-fade),color_var(--plush-dur-fast)_var(--plush-ease-fade)]",
    "aria-invalid:[--plush-badge-shadow-dur:var(--plush-dur-fade)]",
    "[:is(a,button)&]:active:scale-(--plush-press-scale-pill)",
    // Swapped-in content of a live badge springs in.
    "[&:is([aria-live],[role=status])>*]:[transition:scale_var(--plush-dur-spring)_var(--plush-ease-spring),translate_var(--plush-dur-spring)_var(--plush-ease-spring),opacity_var(--plush-dur-fade)_var(--plush-ease-fade),background-color_var(--plush-dur-fade)_var(--plush-ease-fade),padding_var(--plush-dur-spring)_var(--plush-ease-spring)]",
    // Only once something on the page has focus (:root:focus-within): a freshly loaded page stands still.
    "[:root:focus-within_&:is([aria-live],[role=status])>*]:starting:opacity-0",
    "[:root:focus-within_&:is([aria-live],[role=status])>svg]:starting:scale-(--plush-pop-scale)",
    "[:root:focus-within_&:is([aria-live],[role=status])>:not(svg)]:starting:translate-y-2.5",
    "aria-invalid:ring-(length:--plush-focus-width) aria-invalid:ring-(--plush-danger)",
    // Icons marked as in the original (data-icon inline-start / inline-end) sit 2 px closer to the edge.
    "has-data-[icon=inline-end]:pe-1.5 not-data-[variant=default]:has-data-[icon=inline-start]:ps-1.5",
    "[&>svg]:pointer-events-none [&>svg]:shrink-0 [&>svg]:size-3",
  ],
  {
    variants: {
      variant: {
        // Black, the leading icon in a green disc that sits 3 px inside the pill's edge (concentric). An icon marked as
        // trailing (data-icon="inline-end") stays a plain glyph; the rules for it are more specific than [&>svg], so a
        // caller's [&>svg] sizes (the status pill) still reach the leading icon.
        default: [
          "bg-(--plush-accent) text-(--plush-on-accent) [:is(a[href],button:enabled)&]:hover:bg-(--plush-accent-hover) has-[>svg]:ps-0.75",
          "[&>svg]:size-4 [&>svg]:rounded-(--plush-radius-full) [&>svg]:bg-(--plush-success) [&>svg]:p-0.5 [&>svg]:text-(--plush-on-success)",
          "aria-busy:[&>svg]:bg-transparent aria-busy:[&>svg]:p-0",
          "[&>svg[data-icon=inline-end]]:size-3 [&>svg[data-icon=inline-end]]:bg-transparent [&>svg[data-icon=inline-end]]:p-0 [&>svg[data-icon=inline-end]]:text-current has-[>svg[data-icon=inline-end]:only-of-type]:ps-2",
        ],
        secondary: "bg-(--plush-fill) text-(--plush-ink) [:is(a[href],button:enabled)&]:hover:bg-(--plush-fill-strong)",
        // The counter: 22 px high and at least as wide, 6 px sides.
        destructive: "px-1.5 bg-(--plush-badge) text-(--plush-on-accent) [:is(a[href],button:enabled)&]:hover:bg-(--plush-danger-hover)",
        // White stays white under the pointer, its shadow gets stronger; on a dark surface the face tints one step instead.
        outline:
          "bg-(--plush-surface) text-(--plush-ink) shadow-(--plush-card-shadow) [:is(a[href],button:enabled)&]:hover:shadow-(--plush-active-shadow) [:is(a[href],button:enabled)&]:hover:bg-(--plush-surface-hover)",
        // Text in the colour around it, like the original (white on a dark surface); grey and ink under the pointer.
        ghost: "bg-transparent [:is(a[href],button:enabled)&]:hover:bg-(--plush-fill-strong) [:is(a[href],button:enabled)&]:hover:text-(--plush-ink)",
        link: "bg-transparent text-(--plush-ink) underline-offset-4 [:is(a[href],button:enabled)&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
