"use client"

import * as React from "react"
import { cn } from "cn"
import { HugeiconsIcon } from "@hugeicons/react"
import { MinusSignIcon, PlusSignIcon } from "@hugeicons/core-free-icons"

// No shadcn original: a number between a minus and a plus button, a spinbutton after the WAI-ARIA pattern.
// - The value is the one piece of React state (controlled or not). All motion is CSS: the whole-number part of the shown
//   value is written into --plush-counter-value, a registered <number> that glides to each new value (People on the spring,
//   the big amount on the calm spring). Every digit cell holds 0-9 stacked in one grid cell and places
//   each glyph from that gliding number: the digit at the current position stands, its neighbours wait one roll distance
//   above and below, so the number rolls up when it grows and down when it shrinks. Only the lowest digit turns all the way;
//   a higher digit turns while the one below it passes 9 (odometer, like the tens in the amount tile). Leaving and coming
//   digits cross-fade over the first and last 0.6 of a step.
// - People pops a little on each step: the number grows by --plush-counter-pop at the middle of a step and is back at 1 on
//   every whole value, so it rests.
// - The buttons give under the finger on the spring and darken a little; at min and max they are
//   disabled. They stay out of the tab order: the spinbutton takes the keys (arrows, Page Up/Down, Home/End).
// - Currency sign, separators and the fraction ("$", ".00") stand still; they change at once when the value needs it.
// - The amount shrinks to fit when its row is narrower than the number (root is an inline-size container).
// - The number has a fixed line height (--plush-leading), so it sits the same in every font.

// Registers --plush-counter-value as a number, so its transition glides. A React <style> with an href lands in <head> once per page (also in
// the server HTML), however often it renders. Not in tokens.css: the shadcn CLI writes @property into globals.css again on
// every add.
const counterValueProperty = (
  <style href="plush-property-counter-value" precedence="plush">
    {'@property --plush-counter-value { syntax: "<number>"; inherits: true; initial-value: 0; }'}
  </style>
)
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
// A CSS number keeps about six significant digits (measured in Chrome: 123456789 came out as 123457000). The lowest four
// roll, which leaves two decimals for a smooth turn; higher digits stand and change at once.
const ROLLING_DIGITS = 4

type CounterContextValue = {
  value: number
  min: number
  max: number
  disabled: boolean
  format: Intl.NumberFormat
  stepBy: (amount: number) => void
  setValue: (next: number) => void
  largeStep: number
  step: number
}

const CounterContext = React.createContext<CounterContextValue | null>(null)

function useCounter(part: string) {
  const context = React.useContext(CounterContext)
  if (!context) throw new Error(`${part} must be used within <Counter>`)
  return context
}

const decimals = (n: number) => {
  const s = String(n)
  return s.includes(".") ? s.length - s.indexOf(".") - 1 : 0
}

function Counter({
  className,
  children,
  value: valueProp,
  defaultValue = 0,
  onValueChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  largeStep = step * 10,
  disabled = false,
  locale = "en-US",
  formatOptions,
  size = "default",
  variant = "default",
  name,
  ...props
}: Omit<React.ComponentProps<"div">, "defaultValue"> & {
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** Page Up / Page Down. */
  largeStep?: number
  disabled?: boolean
  /** A fixed locale keeps the server and the browser on the same text. */
  locale?: string
  formatOptions?: Intl.NumberFormatOptions
  size?: "default" | "lg"
  variant?: "default" | "secondary"
  /** Submitted with a form under this name (a hidden input); the form's reset brings back defaultValue. */
  name?: string
}) {
  const [inner, setInner] = React.useState(defaultValue)
  const value = valueProp ?? inner
  const format = React.useMemo(() => new Intl.NumberFormat(locale, formatOptions), [locale, formatOptions])

  const setValue = (next: number) => {
    const p = 10 ** Math.max(decimals(step), decimals(value))
    const clamped = Math.min(max, Math.max(min, Math.round(next * p) / p))
    if (disabled || clamped === value || Number.isNaN(clamped)) return
    if (valueProp === undefined) setInner(clamped)
    onValueChange?.(clamped)
  }

  // Form reset, like a native field: back to defaultValue (controlled: asked for through onValueChange).
  const input = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    const form = input.current?.form
    if (!form) return
    const onReset = () => {
      if (valueProp === undefined) setInner(defaultValue)
      else if (valueProp !== defaultValue) onValueChange?.(defaultValue)
    }
    form.addEventListener("reset", onReset)
    return () => form.removeEventListener("reset", onReset)
  }, [name, valueProp, defaultValue, onValueChange])

  return (
    <>
      {counterValueProperty}
      <CounterContext.Provider
        value={{ value, min, max, disabled, format, setValue, stepBy: (n) => setValue(value + n), step, largeStep }}
      >
        <div
          role="group"
          data-slot="counter"
          data-size={size}
          data-variant={variant}
          data-disabled={disabled ? "" : undefined}
          className={cn(
            // No own ink: the number takes the colour of the text around it (black on the tiles, white on a dark card).
            "group/counter plush-font flex w-full max-w-full min-w-0 items-center gap-(--plush-counter-gap) [container-type:inline-size]",
            // default = the People tile: white raised buttons 44, number 40, 16 apart, rolls 16 px (.4em), pops 1.08.
            // lg = the amount tile: buttons 52 (--plush-h-step) at the edges, number 60, rolls 40 px (.67em), no pop.
            "justify-center [--plush-counter-btn:var(--plush-h-step-sm)] [--plush-counter-text:var(--plush-text-counter)] [--plush-counter-gap:--spacing(4)] [--plush-counter-roll:var(--plush-roll)] [--plush-counter-pop:calc(var(--plush-pop-peak-counter)_-_1)]",
            "data-[size=lg]:justify-between data-[size=lg]:[--plush-counter-btn:var(--plush-h-step)] data-[size=lg]:[--plush-counter-text:var(--plush-text-counter-lg)] data-[size=lg]:[--plush-counter-gap:--spacing(2)] data-[size=lg]:[--plush-counter-roll:var(--plush-roll-lg)] data-[size=lg]:[--plush-counter-pop:0]",
            // Buttons: white with the card shadow (on a grey tile) or the grey fill (on a white card, like the amount).
            "[--plush-counter-btn-bg:var(--plush-surface)] [--plush-counter-btn-shadow:var(--plush-card-shadow)] [--plush-counter-btn-press:var(--plush-surface-press)]",
            "data-[variant=secondary]:[--plush-counter-btn-bg:var(--plush-fill)] data-[variant=secondary]:[--plush-counter-btn-shadow:none] data-[variant=secondary]:[--plush-counter-btn-press:var(--plush-fill-press)]",
            // Hover, like the library's button: the white one stays white and takes the stronger shadow (grey on a dark ground), the grey one turns
            // one grey darker.
            "[--plush-counter-btn-hover-bg:var(--plush-surface-hover)] [--plush-counter-btn-hover-shadow:var(--plush-active-shadow)]",
            "data-[variant=secondary]:[--plush-counter-btn-hover-bg:var(--plush-fill-strong)] data-[variant=secondary]:[--plush-counter-btn-hover-shadow:none]",
            className
          )}
          {...props}
        >
          {children}
          {name !== undefined && <input ref={input} type="hidden" name={name} value={value} disabled={disabled} />}
        </div>
      </CounterContext.Provider>
    </>
  )
}

function CounterValue({ className, style, onKeyDown, ...props }: React.ComponentProps<"div">) {
  const { value, min, max, disabled, format, setValue, step, largeStep } = useCounter("CounterValue")
  const parts = format.formatToParts(value)
  const text = parts.map((part) => part.value).join("")
  const whole = parts.filter((part) => part.type === "integer").map((part) => part.value).join("")
  // Width of the text in em, on the generous side: a digit cell about .67 (Open Runde), dots and commas narrow, every other sign wide.
  const ems = [...text].reduce((sum, ch) => sum + (/[0-9]/.test(ch) ? 0.68 : /[.,\s]/.test(ch) ? 0.32 : 0.95), 0)

  // Whole-number digits roll (keyed by their place, so a cell stays the same element while it turns); the rest stands.
  const cells: React.ReactNode[] = []
  let place = /^[0-9]+$/.test(whole) ? whole.length : -1
  parts.forEach((part, index) => {
    if (part.type !== "integer" || place < 0) {
      cells.push(<span key={`${part.type}-${index}`}>{part.value}</span>)
      return
    }
    for (let i = 0; i < part.value.length; i++) {
      place -= 1
      cells.push(
        place < ROLLING_DIGITS ? (
          <CounterDigit key={`digit-${place}`} place={place} />
        ) : (
          <span key={`fixed-${place}`}>{part.value[i]}</span>
        )
      )
    }
  })
  // The digits above the rolling ones key the rolling part: when they change, it starts afresh instead of turning
  // through a million values.
  const high = whole.slice(0, -ROLLING_DIGITS)
  const rolling = Number(whole.slice(-ROLLING_DIGITS)) || 0

  return (
    <div
      role="spinbutton"
      data-slot="counter-value"
      tabIndex={disabled ? -1 : 0}
      aria-valuenow={value}
      aria-valuemin={Number.isFinite(min) ? min : undefined}
      aria-valuemax={Number.isFinite(max) ? max : undefined}
      aria-valuetext={text}
      aria-disabled={disabled || undefined}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented || disabled) return
        const next = {
          ArrowUp: value + step,
          ArrowDown: value - step,
          PageUp: value + largeStep,
          PageDown: value - largeStep,
          Home: Number.isFinite(min) ? min : undefined,
          End: Number.isFinite(max) ? max : undefined,
        }[event.key]
        if (next === undefined) return
        event.preventDefault()
        setValue(next)
      }}
      style={{ "--plush-counter-ems": ems, ...style } as React.CSSProperties}
      className={cn(
        "plush-focus-ring min-w-8 shrink-0 rounded-(--plush-radius-row) text-center font-(--plush-weight-semi) tabular-nums select-none",
        "group-data-[size=lg]/counter:tracking-[-1px]",
        // Fits the row: never larger than the size's number, smaller when the row is narrower than the number.
        "text-[length:min(var(--plush-counter-text),calc((100cqi_-_2*var(--plush-counter-btn)_-_2*var(--plush-counter-gap))/var(--plush-counter-ems)))]",
        // After the size on purpose: cn drops a line height that comes before a text size.
        "leading-(--plush-leading)",
        "aria-disabled:opacity-(--plush-disabled-opacity)",
        // Invalid (on the value or on the whole counter): the red ring of the other fields, faded in like theirs,
        // the focus ring stays outside it.
        "[transition:box-shadow_var(--plush-dur-fade)_var(--plush-ease-fade)]",
        "aria-invalid:ring-(length:--plush-focus-width) aria-invalid:ring-(--plush-danger) group-aria-invalid/counter:ring-(length:--plush-focus-width) group-aria-invalid/counter:ring-(--plush-danger)",
        className
      )}
      {...props}
    >
      <span
        key={high}
        aria-hidden="true"
        style={{ "--plush-counter-value": rolling } as React.CSSProperties}
        className={cn(
          "flex justify-center [scale:calc(1_+_var(--plush-counter-pop)*sin(mod(var(--plush-counter-value),1)*pi))]",
          "[transition:--plush-counter-value_var(--plush-dur-spring)_var(--plush-ease-spring)]",
          "group-data-[size=lg]/counter:[transition:--plush-counter-value_var(--plush-dur-calm)_var(--plush-ease-calm)]"
        )}
      >
        {cells}
      </span>
    </div>
  )
}

// One digit cell. pos = the digit it shows (fractional while it turns): the lowest cell (place 0) follows the number; a
// higher cell holds floor(value / 10^place) and turns over while the cells below it pass from 9 to 0.
function CounterDigit({ place }: { place: number }) {
  return (
    <span
      style={{ "--plush-counter-place": 10 ** place } as React.CSSProperties}
      className={cn(
        "grid overflow-y-clip",
        "[--plush-counter-pos:calc(round(down,var(--plush-counter-value)/var(--plush-counter-place),1)_+_clamp(0,mod(var(--plush-counter-value),var(--plush-counter-place))_-_var(--plush-counter-place)_+_1,1))]"
      )}
    >
      {DIGITS.map((digit) => (
        <span
          key={digit}
          style={{ "--plush-counter-digit": digit } as React.CSSProperties}
          className={cn(
            "col-start-1 row-start-1",
            // d: how far this glyph is from the shown position, -5 .. 5 around the wheel. Far glyphs wait one roll away.
            "[--plush-counter-d:calc(mod(var(--plush-counter-digit)_-_var(--plush-counter-pos)_+_5,10)_-_5)]",
            "[translate:0_calc(clamp(-1,var(--plush-counter-d),1)*var(--plush-counter-roll))]",
            // Visible within 0.6 of a step, smoothstep.
            "[--plush-counter-o:clamp(0,1_-_max(var(--plush-counter-d),-1*var(--plush-counter-d))/.6,1)]",
            "[opacity:calc(var(--plush-counter-o)*var(--plush-counter-o)*(3_-_2*var(--plush-counter-o)))]"
          )}
        >
          {digit}
        </span>
      ))}
    </span>
  )
}

const buttonClassName = cn(
  "plush-focus-ring relative inline-flex size-(--plush-counter-btn) shrink-0 items-center justify-center rounded-(--plush-radius-full) bg-(--plush-counter-btn-bg) text-(--plush-ink) shadow-(--plush-counter-btn-shadow) select-none",
  "[transition:scale_var(--plush-dur-spring)_var(--plush-ease-spring),background-color_var(--plush-dur-fast)_var(--plush-ease-fade),box-shadow_var(--plush-dur-fast)_var(--plush-ease-fade)]",
  "active:not-disabled:scale-(--plush-press-scale) active:not-disabled:bg-(--plush-counter-btn-press)",
  // Hover (mouse only; a button at min or max is disabled and stays still): grows a little on the spring and takes the
  // variant's hover face (root variables); pressing wins.
  "enabled:not-active:hover:scale-(--plush-hover-grow) enabled:not-active:hover:bg-(--plush-counter-btn-hover-bg) enabled:hover:shadow-(--plush-counter-btn-hover-shadow)",
  "disabled:cursor-not-allowed disabled:opacity-(--plush-disabled-opacity)",
  // Icons at the library's 16 px (18 px on the large counter); the stroke is 1:10 of the box (contract, "Icons").
  "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 group-data-[size=lg]/counter:[&_svg:not([class*='size-'])]:size-4.5"
)

function CounterDecrement({
  className,
  children,
  disabled,
  onClick,
  ...props
}: React.ComponentProps<"button">) {
  const counter = useCounter("CounterDecrement")
  return (
    <button
      type="button"
      data-slot="counter-decrement"
      tabIndex={-1}
      aria-label="Decrease"
      disabled={disabled || counter.disabled || counter.value <= counter.min}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) counter.stepBy(-counter.step)
      }}
      className={cn(buttonClassName, className)}
      {...props}
    >
      {children ?? <HugeiconsIcon icon={MinusSignIcon} size={16} strokeWidth={2.4} aria-hidden />}
    </button>
  )
}

function CounterIncrement({
  className,
  children,
  disabled,
  onClick,
  ...props
}: React.ComponentProps<"button">) {
  const counter = useCounter("CounterIncrement")
  return (
    <button
      type="button"
      data-slot="counter-increment"
      tabIndex={-1}
      aria-label="Increase"
      disabled={disabled || counter.disabled || counter.value >= counter.max}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) counter.stepBy(counter.step)
      }}
      className={cn(buttonClassName, className)}
      {...props}
    >
      {children ?? <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2.4} aria-hidden />}
    </button>
  )
}

export { Counter, CounterDecrement, CounterIncrement, CounterValue }
