"use client"

import * as React from "react"
import {
  DateLib,
  DayPicker,
  getDefaultClassNames,
  useDayPicker,
  type ChevronProps,
  type DayButton,
  type Locale,
  type MonthCaptionProps,
  type MonthGridProps,
  type RootProps,
  type WeekNumberProps,
} from "react-day-picker"

import { cn } from "@/lib/utils"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import type { Button } from "@/components/ui/button"

// Sharp chevron (contract, "Icons"): Hugeicons draws its chevrons as a curve with a round tip; this is the same
// 12 x 6 angle in straight lines, mitred at the tip like the tick. The one drawn path of plush, the same text in every file.
const sharpChevron = (d: string): IconSvgElement => [["path", { d, stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "miter", strokeWidth: 1.5, key: "0" }]]
const ChevronDownSharpIcon = sharpChevron("M6 9L12 15L18 9")
const ChevronUpSharpIcon = sharpChevron("M6 15L12 9L18 15")
const ChevronLeftSharpIcon = sharpChevron("M15 6L9 12L15 18")
const ChevronRightSharpIcon = sharpChevron("M9 6L15 12L9 18")

// Motion is CSS only, started by real state:
// - Selection (mode="single"): one gradient pill under the numbers, anchored to the selected day, glides to the next one.
//   Without anchor positioning (and in multiple/range mode) each selected day pops its own gradient circle in.
// - Month change: the new days and the caption slide in from the side of the pressed arrow (keyboard paging: they
//   fade in). Gated on focus inside the calendar, so nothing moves on page load.
// - Arrow buttons dip under the finger (:active).
// Class strings are written out in full (no interpolation): Tailwind only generates what it finds literally.
// The arrow that brought the new month in still holds focus (click in Chrome and Firefox, Enter, Space):
// :has(.rdp-button_next:focus) slides from the right, :has(.rdp-button_previous:focus) from the left.

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  // Accepted for drop-in compatibility, but the arrows keep their own look whatever the variant;
  // buttonVariants() would bring shadcn colours and its own focus ring. Later: map variants to plush looks.
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()
  const today = props.today

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar plush-font relative isolate w-full max-w-max min-w-0 bg-(--plush-surface) p-2 text-(--plush-ink) in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
        // The selection pill glides only while the calendar is in use (pointer on it, pressed, focus inside); on page load,
        // while fonts swap and on window resize it sits on its day at once. A glide that has started runs to the end.
        "[--plush-calendar-glide:0] [&:is(:focus-within,:hover,:active)]:[--plush-calendar-glide:1]",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      data-button-variant={buttonVariant ?? undefined}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        // One letter per weekday (S M T W T F S); the full name stays in aria-label.
        formatWeekdayName: (weekday, options, dateLib) =>
          (dateLib ?? new DateLib(options)).format(weekday, "ccccc"),
        ...formatters,
      }}
      modifiers={{
        // Days before today are drawn grey; they stay selectable.
        past: (date: Date) => isBeforeToday(date, today),
        ...modifiers,
      }}
      classNames={{
        root: cn("w-full", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months
        ),
        month: cn("flex w-full min-w-0 flex-col gap-3.5", defaultClassNames.month),
        nav: cn(
          "absolute end-0 top-0 z-20 flex items-center gap-2",
          defaultClassNames.nav
        ),
        button_previous: cn(navButton, defaultClassNames.button_previous),
        button_next: cn(navButton, defaultClassNames.button_next),
        month_caption: cn(
          "flex min-h-8 w-full min-w-0 items-center pe-20",
          String.raw`[transition:translate_var(--plush-dur-spring)_var(--plush-ease-spring),opacity_var(--plush-dur-fade)_var(--plush-ease-fade)]`,
          String.raw`starting:in-[.rdp-root:has(.rdp-button\_next:focus)]:translate-x-[18px] starting:in-[.rdp-root:has(.rdp-button\_next:focus)]:opacity-0`,
          String.raw`starting:in-[.rdp-root:has(.rdp-button\_previous:focus)]:-translate-x-[18px] starting:in-[.rdp-root:has(.rdp-button\_previous:focus)]:opacity-0`,
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex min-h-8 w-full flex-wrap items-center gap-1.5 text-(length:--plush-text-md) font-(--plush-weight-semi)",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative inline-flex h-8 items-center rounded-(--plush-radius-full) bg-(--plush-fill) px-3",
          // Hover: the grey pill one step darker, on the quick fade.
          "transition-colors duration-(--plush-dur-fast) ease-(--plush-ease-fade) has-[select:enabled]:hover:bg-(--plush-fill-strong)",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "plush-focus-ring absolute inset-0 w-full cursor-pointer appearance-none rounded-(--plush-radius-full) bg-transparent text-transparent [&>option]:bg-(--plush-surface) [&>option]:text-(--plush-ink)",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "min-w-0 select-none",
          captionLayout === "label"
            ? "text-(length:--plush-text-2xl) leading-tight font-(--plush-weight-semi) break-words"
            : "flex items-center gap-1 text-(length:--plush-text-md) font-(--plush-weight-semi) [&>svg]:size-3.5 [&>svg]:text-(--plush-ink-2)",
          defaultClassNames.caption_label
        ),
        // Block, not table layout: a table never gets narrower than its cells, the 240 px case would overflow.
        month_grid: cn("block w-full border-collapse [&>thead]:block", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weeks: cn("block", defaultClassNames.weeks),
        weekday: cn(
          "block min-h-7 w-14 min-w-0 flex-1 text-center text-(length:--plush-text-sm) leading-tight font-(--plush-weight-medium) break-words text-(--plush-ink-3) select-none",
          defaultClassNames.weekday
        ),
        week: cn("mt-3 flex w-full", defaultClassNames.week),
        week_number_header: cn(
          "w-14 min-w-0 flex-1 select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "w-14 min-w-0 flex-1 text-(length:--plush-text-sm) text-(--plush-ink-3) select-none",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative flex w-14 min-w-0 flex-1 justify-center p-0 text-center select-none",
          // Month change: each new day slides in from the side of the pressed arrow, column by column.
          String.raw`[transition:translate_var(--plush-dur-soft)_var(--plush-ease-soft),opacity_var(--plush-dur-fade)_var(--plush-ease-fade)]`,
          // Gate: focus inside (arrow pressed) or a focused day (keyboard paging); never on page load.
          // mode="single": the selected day is left out and stays put, so the green pill (anchored to it, and painted
          // over any cell that moves) never trails behind or covers its number.
          String.raw`[&:not(:is([data-mode=single]_*):has([data-selected-single=true]))]:starting:in-[.rdp-root:is(:focus-within,:has([data-focused=true]))]:opacity-0`,
          String.raw`[&:not(:is([data-mode=single]_*):has([data-selected-single=true]))]:starting:in-[.rdp-root:has(.rdp-button\_next:focus)]:translate-x-(--plush-slide) [&:not(:is([data-mode=single]_*):has([data-selected-single=true]))]:starting:in-[.rdp-root:has(.rdp-button\_previous:focus)]:-translate-x-(--plush-slide)`,
          String.raw`in-[.rdp-root:has(.rdp-button\_next:focus)]:[transition-delay:calc(var(--plush-stagger)*0.4*(sibling-index()-1))]`,
          String.raw`in-[.rdp-root:has(.rdp-button\_previous:focus)]:[transition-delay:calc(var(--plush-stagger)*0.4*(7-sibling-index()))]`,
          // Range band behind the circles.
          "before:pointer-events-none before:absolute before:inset-y-0 before:bg-(--plush-fill)",
          defaultClassNames.day
        ),
        range_start: cn(
          // In the last column the band would stick out past the circle: there is nothing to join on that side.
          String.raw`before:start-1/2 before:end-0 [&.rdp-range\_end]:before:hidden last:before:hidden`,
          defaultClassNames.range_start
        ),
        range_middle: cn(
          "before:inset-x-0 first:before:rounded-s-(--plush-radius-full) last:before:rounded-e-(--plush-radius-full)",
          defaultClassNames.range_middle
        ),
        range_end: cn(
          String.raw`before:start-0 before:end-1/2 [&.rdp-range\_start]:before:hidden first:before:hidden`,
          defaultClassNames.range_end
        ),
        today: cn(defaultClassNames.today),
        outside: cn(defaultClassNames.outside),
        // On the number only: a disabled day inside a range keeps the band behind it unbroken.
        disabled: cn("[&>button]:opacity-(--plush-disabled-opacity)", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: CalendarRoot,
        Chevron: CalendarChevron,
        DayButton: CalendarDayButtonWithLocale,
        MonthCaption: CalendarMonthCaption,
        MonthGrid: CalendarMonthGrid,
        WeekNumber: CalendarWeekNumber,
        ...components,
      }}
      {...props}
    />
  )
}

const navButton = cn(
  "plush-focus-ring inline-flex size-(--plush-cal-nav) shrink-0 cursor-pointer items-center justify-center rounded-(--plush-radius-full) bg-(--plush-fill) p-0 text-(--plush-ink) select-none",
  String.raw`[transition:scale_var(--plush-dur-spring)_var(--plush-ease-spring),background-color_var(--plush-dur-fade)_var(--plush-ease-fade),opacity_var(--plush-dur-fade)_var(--plush-ease-fade)]`,
  // Hover: a round icon button, so it may grow a little on the spring, and its grey goes one step darker on the quick
  // fade. Pressed wins (gated the same way, later in the sheet). Nothing while disabled (no earlier or later month).
  "not-aria-disabled:hover:scale-(--plush-hover-grow) not-aria-disabled:hover:bg-(--plush-fill-strong)",
  String.raw`not-aria-disabled:hover:[transition:scale_var(--plush-dur-spring)_var(--plush-ease-spring),background-color_var(--plush-dur-fast)_var(--plush-ease-fade),opacity_var(--plush-dur-fade)_var(--plush-ease-fade)]`,
  "not-aria-disabled:active:scale-(--plush-press-scale) not-aria-disabled:active:bg-(--plush-fill-press)",
  "aria-disabled:cursor-default aria-disabled:opacity-(--plush-disabled-opacity)"
)

function isBeforeToday(date: Date, today: Date | undefined) {
  const t = today ?? new Date()
  return date.getTime() < new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime()
}

// Components live at module level: a new function per render would remount every day and break the transitions.
function CalendarRoot({ className, rootRef, ...props }: RootProps) {
  return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />
}

// The grid of one month plus the selection pill of mode="single": the pill is anchored to the selected day, so it
// glides when the selection moves. Scoped per grid, so several months and several calendars never share it, and
// positioned inside the grid, so a caption that wraps differently never drags it along.
function CalendarMonthGrid(props: MonthGridProps) {
  return (
    <div className="group/plush-grid relative [anchor-scope:--plush-calendar-selected]">
      <table {...props} />
      <span
        aria-hidden="true"
        data-slot="plush-calendar-selection"
        className={cn(
          "pointer-events-none invisible absolute z-0 hidden scale-60 rounded-(--plush-radius-full) bg-(image:--plush-select-fill) opacity-0 shadow-(--plush-select-gloss)",
          "[position-anchor:--plush-calendar-selected] top-[anchor(top)] left-[anchor(left)] h-[anchor-size(height)] w-[anchor-size(width)]",
          String.raw`[transition:top_calc(var(--plush-dur-spring)*var(--plush-calendar-glide))_var(--plush-ease-spring),left_calc(var(--plush-dur-spring)*var(--plush-calendar-glide))_var(--plush-ease-spring),width_calc(var(--plush-dur-soft)*var(--plush-calendar-glide))_var(--plush-ease-soft),height_calc(var(--plush-dur-soft)*var(--plush-calendar-glide))_var(--plush-ease-soft),scale_var(--plush-dur-spring)_var(--plush-ease-spring),opacity_var(--plush-dur-fade)_var(--plush-ease-fade),filter_var(--plush-dur-fast)_var(--plush-ease-fade)]`,
          "supports-[anchor-scope:all]:group-data-[mode=single]/calendar:block",
          // Hover on the selected day: the green stays and only lightens, on the quick fade (pointer devices only).
          "[@media(hover:hover)]:group-has-[[data-selected-single=true]:enabled:hover]/plush-grid:brightness-(--plush-hover-bright)",
          "group-has-data-[selected-single=true]/plush-grid:visible group-has-data-[selected-single=true]/plush-grid:scale-100 group-has-data-[selected-single=true]/plush-grid:opacity-100"
        )}
      />
    </div>
  )
}

// 16 px with the library stroke (1:10 of the box), so the sharp chevron stays open in the small round buttons.
function CalendarChevron({ className, orientation, size = 16, ...props }: ChevronProps) {
  const icon =
    orientation === "left"
      ? ChevronLeftSharpIcon
      : orientation === "right"
        ? ChevronRightSharpIcon
        : orientation === "up"
          ? ChevronUpSharpIcon
          : ChevronDownSharpIcon
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={2.4}
      aria-hidden
      className={cn("size-4 shrink-0", className)}
      {...props}
    />
  )
}

// A new key per month remounts the caption, so the new title slides in like the days (label layout only:
// a remount would take focus away from the dropdowns).
function CalendarMonthCaption({ calendarMonth, displayIndex, ...props }: MonthCaptionProps) {
  const { dayPickerProps } = useDayPicker()
  const label = (dayPickerProps.captionLayout ?? "label") === "label"
  void displayIndex
  return <div key={label ? calendarMonth.date.getTime() : "caption"} {...props} />
}

function CalendarWeekNumber({ children, ...props }: WeekNumberProps) {
  return (
    <td {...props}>
      <div className="flex aspect-square w-full items-center justify-center text-center">
        {children}
      </div>
    </td>
  )
}

function CalendarDayButtonWithLocale(props: React.ComponentProps<typeof DayButton>) {
  const { dayPickerProps } = useDayPicker()
  return <CalendarDayButton locale={dayPickerProps.locale} {...props} />
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <button
      ref={ref}
      type="button"
      data-slot="button"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      data-plush-past={modifiers.past || undefined}
      className={cn(
        "plush-focus-ring relative z-10 flex aspect-square w-full max-w-(--plush-cal-day) min-w-0 cursor-pointer items-center justify-center rounded-(--plush-radius-full) border-0 bg-transparent p-0 text-(length:--plush-text-xl) leading-none font-(--plush-weight-medium) text-(--plush-ink)",
        String.raw`[transition:background-color_var(--plush-dur-fast)_var(--plush-ease-fade),color_var(--plush-dur-fade)_var(--plush-ease-fade),font-weight_var(--plush-dur-fade)_var(--plush-ease-fade)]`,
        "data-[plush-past=true]:text-(--plush-ink-3) group-data-[outside=true]/day:text-(--plush-ink-3) disabled:cursor-default",
        // Grey surfaces: today, hover, keyboard focus. Never on the selected day, the pill lies under it.
        "group-data-[today=true]/day:font-(--plush-weight-semi) group-data-[today=true]/day:text-(--plush-ink) group-data-[today=true]/day:not-data-[selected-single=true]:bg-(--plush-fill)",
        "not-disabled:not-data-[selected-single=true]:hover:bg-(--plush-fill) not-data-[selected-single=true]:focus-visible:bg-(--plush-fill)",
        "group-data-[today=true]/day:not-disabled:not-data-[selected-single=true]:hover:bg-(--plush-fill-strong) group-data-[today=true]/day:not-data-[selected-single=true]:focus-visible:bg-(--plush-fill-strong)",
        // A day inside a range lies on the grey band: under the pointer its circle is one step darker than the band.
        "data-[range-middle=true]:bg-transparent not-disabled:not-data-[selected-single=true]:data-[range-middle=true]:hover:bg-(--plush-fill-strong)",
        // Selected: dark number, semibold, on the green gradient (its own circle, or the pill in mode="single").
        "data-[selected-single=true]:font-(--plush-weight-semi) data-[selected-single=true]:text-(--plush-on-select) data-[range-start=true]:font-(--plush-weight-semi) data-[range-start=true]:text-(--plush-on-select) data-[range-end=true]:font-(--plush-weight-semi) data-[range-end=true]:text-(--plush-on-select)",
        "data-[selected-single=true]:[anchor-name:--plush-calendar-selected]",
        "before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:scale-50 before:rounded-(--plush-radius-full) before:bg-(image:--plush-select-fill) before:opacity-0 before:shadow-(--plush-select-gloss)",
        String.raw`before:[transition:scale_var(--plush-dur-spring)_var(--plush-ease-spring),opacity_var(--plush-dur-fade)_var(--plush-ease-fade),filter_var(--plush-dur-fast)_var(--plush-ease-fade)]`,
        // Hover on a day with its own green circle (range ends, multiple mode, no anchor positioning): only lighter.
        "not-disabled:hover:before:brightness-(--plush-hover-bright)",
        "data-[selected-single=true]:before:scale-100 data-[selected-single=true]:before:opacity-100 data-[range-start=true]:before:scale-100 data-[range-start=true]:before:opacity-100 data-[range-end=true]:before:scale-100 data-[range-end=true]:before:opacity-100",
        "supports-[anchor-scope:all]:group-data-[mode=single]/calendar:before:hidden",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
