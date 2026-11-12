"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "cn";
import { plural } from "@/lib/client";

type Point = { key: string; value: number };
type Unit = "day" | "month";

const niceMax = (max: number) => {
  if (max <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 4, 5, 10].find((m) => m * pow >= max) ?? 10;
  return step * pow;
};

// Keys are "YYYY-MM-DD" for days and "YYYY-MM" for months.
const toDate = (key: string) => parseISO(key.length === 7 ? `${key}-01` : key);
const axisLabel = (key: string, unit: Unit) =>
  format(toDate(key), unit === "day" ? "d MMM" : "LLL yyyy", { locale: ru }).replace(".", "");
const fullLabel = (key: string, unit: Unit) =>
  format(toDate(key), unit === "day" ? "d MMMM, EEEEEE" : "LLLL yyyy", { locale: ru });

/**
 * Counts per day or per month as thin columns on one baseline. One series, so no legend: the control
 * above the chart names it. The whole slot of a period is its hover target; arrow keys walk the
 * periods; a hidden table mirrors the data.
 */
export function TimeChart({
  points,
  label,
  unit,
  rangeLabel,
  aside,
}: {
  points: Point[];
  label: string;
  unit: Unit;
  rangeLabel: string;
  /** Shown beside the total while no column is picked, e.g. a control that switches the range. */
  aside?: React.ReactNode;
}) {
  const [active, setActive] = React.useState<number | null>(null);
  const top = niceMax(Math.max(0, ...points.map((p) => p.value)));
  const ticks = [top, top / 2, 0];
  const current = active !== null ? points[active] : null;
  const wishes = (n: number) => `${n} ${plural(n, "желание", "желания", "желаний")}`;

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const from = active ?? points.length - 1;
    setActive(Math.min(points.length - 1, Math.max(0, from + (event.key === "ArrowRight" ? 1 : -1))));
  };

  return (
    <figure className="m-0">
      <div className="flex h-9 items-center justify-between gap-3" aria-live="polite">
        {current ? (
          <>
            <span className="text-(length:--plush-text-2xl) font-(--plush-weight-semi) tabular-nums">{wishes(current.value)}</span>
            <span className="text-(length:--plush-text-sm) text-(--plush-ink-2)">{fullLabel(current.key, unit)}</span>
          </>
        ) : (
          <>
            <span className="text-(length:--plush-text-2xl) font-(--plush-weight-semi) tabular-nums">
              {wishes(points.reduce((sum, p) => sum + p.value, 0))}
            </span>
            {aside ?? <span className="text-(length:--plush-text-sm) text-(--plush-ink-2)">{rangeLabel}</span>}
          </>
        )}
      </div>

      <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-2">
        <div className="relative h-40 w-5 text-right text-[11px] tabular-nums text-(--plush-ink-3)" aria-hidden>
          {ticks.map((tick, i) => (
            <span key={tick} className="absolute right-0 -translate-y-1/2" style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}>
              {tick}
            </span>
          ))}
        </div>

        <div
          role="img"
          tabIndex={0}
          aria-label={`${label}, ${rangeLabel}, ${unit === "day" ? "по дням" : "по месяцам"}. Стрелки влево и вправо переключают столбцы.`}
          className="plush-focus-ring relative h-40 rounded-md outline-offset-4"
          onKeyDown={onKeyDown}
          onBlur={() => setActive(null)}
          onPointerLeave={() => setActive(null)}
        >
          {ticks.map((tick, i) => (
            <span
              key={tick}
              className="absolute inset-x-0 h-px bg-(--plush-line)"
              style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-end">
            {points.map((point, i) => (
              <div
                key={point.key}
                className="flex h-full min-w-0 flex-1 items-end justify-center"
                onPointerEnter={() => setActive(i)}
                onPointerDown={() => setActive(i)}
              >
                <div
                  className={cn(
                    "w-full max-w-6 rounded-t-[4px] bg-[#16a35c] [transition:height_var(--plush-dur-soft)_var(--plush-ease-soft),opacity_var(--plush-dur-fast)_var(--plush-ease-fade)]",
                    points.length > 40 ? "mx-[0.5px]" : "mx-px",
                    active !== null && active !== i && "opacity-35",
                  )}
                  style={{ height: `${(point.value / top) * 100}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        <div />
        <div className="mt-2 flex justify-between text-[11px] text-(--plush-ink-3)" aria-hidden>
          <span>{axisLabel(points[0].key, unit)}</span>
          {points.length > 2 && <span>{axisLabel(points[Math.floor(points.length / 2)].key, unit)}</span>}
          <span>{axisLabel(points[points.length - 1].key, unit)}</span>
        </div>
      </div>

      <table className="sr-only">
        <caption>
          {label}, {rangeLabel}
        </caption>
        <thead>
          <tr>
            <th scope="col">{unit === "day" ? "День" : "Месяц"}</th>
            <th scope="col">Количество</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.key}>
              <th scope="row">{fullLabel(point.key, unit)}</th>
              <td>{point.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
