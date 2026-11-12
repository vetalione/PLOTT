import * as React from "react"
import { cn } from "cn"

// The field:
// a white pill with the soft card shadow, 17 px medium text. The selection highlight (the green
// ink at 30 %) is the native text selection here, and the caret takes the green ink as well. Focus shows the
// shared ring; it fades in and settles outward on the spring. Icons (lens, tick) are not part of the field: they sit
// in a wrapper next to it and the field gets room for them through className (see the preview).
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "plush-font plush-focus-ring h-(--plush-h-field) w-full min-w-0 rounded-(--plush-radius-full) bg-(--plush-surface) px-4.5 py-3 text-(length:--plush-text-xl) font-(--plush-weight-medium) text-(--plush-ink) shadow-(--plush-card-shadow)",
        "caret-(--plush-select-a) placeholder:text-(--plush-ink-2) selection:bg-(--plush-select-mark) selection:text-(--plush-on-select)",
        // The ring starts transparent and tight, so focusing fades it in while it springs out to its offset.
        "outline-offset-0 outline-transparent",
        "[transition:outline-offset_var(--plush-dur-spring)_var(--plush-ease-spring),outline-color_var(--plush-dur-fade)_var(--plush-ease-fade),background-color_var(--plush-dur-fade)_var(--plush-ease-fade),color_var(--plush-dur-fade)_var(--plush-ease-fade),box-shadow_var(--plush-dur-fade)_var(--plush-ease-fade)]",
        // Hover (pointer devices only; not disabled or read-only): the pill stays white and its shadow turns into the knob
        // shadow, like the white button (on a dark ground, plush-on-dark, its face turns grey: --plush-surface-hover). It comes in on the quick fade; the red edge (its own ring) stays on top of it.
        "enabled:not-[[readonly]]:hover:bg-(--plush-surface-hover) enabled:not-[[readonly]]:hover:shadow-(--plush-active-shadow) enabled:not-[[readonly]]:hover:[transition:outline-offset_var(--plush-dur-spring)_var(--plush-ease-spring),outline-color_var(--plush-dur-fade)_var(--plush-ease-fade),background-color_var(--plush-dur-fast)_var(--plush-ease-fade),color_var(--plush-dur-fade)_var(--plush-ease-fade),box-shadow_var(--plush-dur-fast)_var(--plush-ease-fade)]",
        // type="search": no browser clear button (Chrome draws a blue ×), the field keeps its own look.
        "[&::-webkit-search-cancel-button]:appearance-none",
        // type="file": the button is a grey chip inside the pill, concentric with it.
        "file:-ms-1.5 file:me-2.5 file:inline-flex file:h-(--plush-h-chip-sm) file:items-center file:rounded-(--plush-radius-full) file:border-0 file:bg-(--plush-fill) file:px-3.5 file:text-(length:--plush-text-md) file:font-(--plush-weight-semi) file:text-(--plush-ink)",
        "file:transition-colors file:duration-(--plush-dur-fast) file:ease-(--plush-ease-fade) enabled:hover:file:bg-(--plush-fill-strong)",
        "disabled:cursor-not-allowed disabled:bg-(--plush-fill) disabled:text-(--plush-ink-3) disabled:shadow-none disabled:placeholder:text-(--plush-ink-3) disabled:file:bg-(--plush-fill-strong) disabled:file:text-(--plush-ink-3)",
        // Error: the library's red edge, a 2 px ring right outside the pill, faded in. The black focus ring stays black and
        // springs out just outside it.
        "aria-invalid:ring-(length:--plush-focus-width) aria-invalid:ring-(--plush-danger)",
        // Browser autofill: Chrome and Safari paint the field light blue or yellow with !important. A surface-coloured inset
        // shadow covers that paint (behind the text, under the card shadow and the red edge) and the text stays ink.
        "autofill:shadow-[inset_0_0_0_100vmax_var(--plush-surface),var(--plush-card-shadow)] autofill:[-webkit-text-fill-color:var(--plush-ink)]",
        // Autofilled and hovered: the cover stays, under the hover shadow.
        "enabled:not-[[readonly]]:autofill:hover:shadow-[inset_0_0_0_100vmax_var(--plush-surface-hover),var(--plush-active-shadow)]",
        // type="date"/"time": the part being edited is marked in the green selection ink instead of the system blue.
        "[&::-webkit-datetime-edit-day-field:focus]:bg-(--plush-select-mark) [&::-webkit-datetime-edit-month-field:focus]:bg-(--plush-select-mark) [&::-webkit-datetime-edit-year-field:focus]:bg-(--plush-select-mark)",
        "[&::-webkit-datetime-edit-hour-field:focus]:bg-(--plush-select-mark) [&::-webkit-datetime-edit-minute-field:focus]:bg-(--plush-select-mark) [&::-webkit-datetime-edit-meridiem-field:focus]:bg-(--plush-select-mark)",
        "[&::-webkit-datetime-edit-day-field:focus]:text-(--plush-on-select) [&::-webkit-datetime-edit-month-field:focus]:text-(--plush-on-select) [&::-webkit-datetime-edit-year-field:focus]:text-(--plush-on-select)",
        "[&::-webkit-datetime-edit-hour-field:focus]:text-(--plush-on-select) [&::-webkit-datetime-edit-minute-field:focus]:text-(--plush-on-select) [&::-webkit-datetime-edit-meridiem-field:focus]:text-(--plush-on-select)",
        className
      )}
      {...props}
    />
  )
}

export { Input }
