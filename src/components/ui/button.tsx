import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

// The black "Pay $24.00" button and the
// round icon buttons.
// default = the black button (--plush-accent). outline = the white button: the edge of white things is drawn with
// the card shadow instead of a border (--card-border: none), and the original's outline is "background plus edge".
// secondary = the grey button (--plush-fill). Held down, every button gives on the spring and
// springs back with a small overshoot (round ones deeper); colours fade.
// Sizes: default = 56 px, 18 px text, 28 px sides; the original's steps keep their ratio to it:
// xs 42, sm 50, lg 64; icon sizes match the text sizes (icon = a 56 px circle).
// Icons: Hugeicons fill much of their box, so the box is about 0.8 of the wanted glyph size (16 next to
// 18 px text, 18 in the 56 px circle).
// A label that wraps keeps corners of half the size's height (a pill on one line, no blob on three).
const buttonVariants = cva(
  [
    "group/button plush-font plush-focus-ring relative inline-flex max-w-full min-w-0 shrink-0 items-center justify-center py-2 text-center leading-tight font-(--plush-weight-semi) wrap-anywhere select-none",
    // Hover and press colours and shadows on the fast fade; the red ring of an invalid button keeps the softer fade-in.
    "[transition:scale_var(--plush-dur-spring)_var(--plush-ease-spring),background-color_var(--plush-dur-fast)_var(--plush-ease-fade),box-shadow_var(--plush-button-shadow-dur,var(--plush-dur-fast))_var(--plush-ease-fade),color_var(--plush-dur-fast)_var(--plush-ease-fade),opacity_var(--plush-dur-fade)_var(--plush-ease-fade)]",
    "aria-invalid:[--plush-button-shadow-dur:var(--plush-dur-fade)]",
    // Press: pills give a little, round icon buttons more (--plush-button-press, set by the icon sizes), links not at all.
    "active:not-disabled:not-aria-[haspopup]:scale-[var(--plush-button-press,var(--plush-press-scale-pill))]",
    // Hover (mouse only, Tailwind's hover: sits in @media (hover: hover)): each variant changes face, shadow or colour;
    // the round icon sizes also grow a little on the spring. Pressing beats both.
    "disabled:pointer-events-none disabled:opacity-(--plush-disabled-opacity) aria-busy:cursor-progress",
    "aria-invalid:ring-(length:--plush-focus-width) aria-invalid:ring-(--plush-danger)",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default: "bg-(--plush-accent) text-(--plush-on-accent) hover:bg-(--plush-accent-hover)",
        // Hover keeps the white face (a grey one sank into the grey tile, 240 on 243) and lifts it: the soft card shadow
        // turns into the knob shadow, a visible edge on the tile and on white. Held down it darkens from white.
        // On a dark surface (plush-on-dark) a shadow does not show: there the face tints one step, still lighter than held down.
        outline:
          "bg-(--plush-surface) text-(--plush-ink) shadow-(--plush-card-shadow) hover:shadow-(--plush-active-shadow) hover:not-active:bg-(--plush-surface-hover) active:bg-(--plush-surface-press) aria-expanded:shadow-(--plush-active-shadow)",
        secondary:
          "bg-(--plush-fill) text-(--plush-ink) hover:bg-(--plush-fill-strong) active:bg-(--plush-fill-press) aria-expanded:bg-(--plush-fill-strong)",
        // Text in the colour around it, like the original (white on a dark surface); grey and ink under the pointer, the
        // stronger grey, so it shows on the grey tile too (--plush-fill is almost the tile's colour).
        ghost:
          "bg-transparent hover:bg-(--plush-fill-strong) hover:text-(--plush-ink) active:bg-(--plush-fill-press) active:text-(--plush-ink) aria-expanded:bg-(--plush-fill-strong) aria-expanded:text-(--plush-ink)",
        destructive: "bg-(--plush-danger) text-(--plush-on-accent) hover:bg-(--plush-danger-hover)",
        link: "bg-transparent text-(--plush-ink) underline-offset-4 [--plush-button-press:1] hover:underline",
      },
      size: {
        default:
          "min-h-(--plush-h-btn) rounded-[calc(var(--plush-h-btn)/2)] gap-2 px-7 text-(length:--plush-text-btn) leading-tight has-data-[icon=inline-end]:pe-6 has-data-[icon=inline-start]:ps-6 [&_svg:not([class*='size-'])]:size-4",
        xs: "min-h-(--plush-h-chip) rounded-[calc(var(--plush-h-chip)/2)] gap-1.5 px-4 text-(length:--plush-text-md) has-data-[icon=inline-end]:pe-3.5 has-data-[icon=inline-start]:ps-3.5 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "min-h-(--plush-h-btn-sm) rounded-[calc(var(--plush-h-btn-sm)/2)] gap-2 px-6 text-(length:--plush-text-xl) has-data-[icon=inline-end]:pe-5 has-data-[icon=inline-start]:ps-5 [&_svg:not([class*='size-'])]:size-4",
        lg: "min-h-(--plush-h-btn-lg) rounded-[calc(var(--plush-h-btn-lg)/2)] gap-2.5 px-8 text-(length:--plush-text-2xl) has-data-[icon=inline-end]:pe-7 has-data-[icon=inline-start]:ps-7 [&_svg:not([class*='size-'])]:size-4.5",
        icon: "size-(--plush-h-icon) rounded-(--plush-radius-full) p-0 hover:scale-(--plush-hover-grow) [--plush-button-press:var(--plush-press-scale)] [&_svg:not([class*='size-'])]:size-4.5",
        "icon-xs":
          "size-(--plush-h-chip) rounded-(--plush-radius-full) p-0 hover:scale-(--plush-hover-grow) [--plush-button-press:var(--plush-press-scale)] [&_svg:not([class*='size-'])]:size-4",
        "icon-sm":
          "size-(--plush-h-btn-sm) rounded-(--plush-radius-full) p-0 hover:scale-(--plush-hover-grow) [--plush-button-press:var(--plush-press-scale)] [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-(--plush-h-btn-lg) rounded-(--plush-radius-full) p-0 hover:scale-(--plush-hover-grow) [--plush-button-press:var(--plush-press-scale)] [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
