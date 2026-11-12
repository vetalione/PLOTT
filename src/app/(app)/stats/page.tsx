"use client";

import * as React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDataTransferVerticalIcon } from "@hugeicons/core-free-icons";
import { PageHeader } from "@/components/app-shell";
import { TimeChart } from "@/components/time-chart";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { plural, useStats } from "@/lib/client";

const compact = (n: number) =>
  n >= 10_000 ? `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1).replace(".0", "")}K` : n.toLocaleString("ru-RU");

export default function StatsPage() {
  const { data } = useStats();
  const [series, setSeries] = React.useState<"wished" | "done">("wished");
  const [range, setRange] = React.useState<"all" | "30d">("all");
  const mine = data?.mine;
  const hasWishes = Boolean(mine && mine.wishes > 0);

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader title="Статистика" />

      <section
        aria-label="Мои желания"
        className="rise plush-on-dark flex items-center gap-5 rounded-(--plush-radius-panel) bg-(--plush-accent) p-6 text-(--plush-on-accent) [--i:1] [--plush-ring-size:112px] [--plush-ring-track:var(--plush-on-accent-track)]"
      >
        <ProgressRing value={mine?.done ?? 0} max={Math.max(1, mine?.wishes ?? 0)} aria-label="Доля исполненных желаний">
          <span className="tabular-nums">
            {mine?.done ?? 0}/{mine?.wishes ?? 0}
          </span>
        </ProgressRing>
        <div className="min-w-0">
          {hasWishes ? (
            <>
              <p className="text-(length:--plush-text-2xl) leading-tight font-(--plush-weight-semi)">
                {mine!.done === mine!.wishes ? "Всё сбылось!" : mine!.done > 0 ? "Мечты сбываются" : "Всё впереди"}
              </p>
              <p className="mt-1.5 text-(length:--plush-text-md) text-(--plush-on-accent-2)">
                {mine!.done} из {mine!.wishes} {plural(mine!.wishes, "желания", "желаний", "желаний")} исполнено
                {mine!.claps > 0 && ` · тебя поддержали ${mine!.claps} ${plural(mine!.claps, "раз", "раза", "раз")}`}
              </p>
            </>
          ) : (
            <>
              <p className="text-(length:--plush-text-2xl) leading-tight font-(--plush-weight-semi)">Твой круг желаний</p>
              <p className="mt-1.5 text-(length:--plush-text-md) text-(--plush-on-accent-2)">
                Загадай первое — и кольцо начнёт заполняться.
              </p>
              <Button variant="outline" size="xs" className="mt-3" asChild>
                <Link href="/">Загадать</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      <section aria-label="Все участники" className="rise mt-3 grid grid-cols-3 gap-3 [--i:2]">
        {[
          { label: "Загадано", value: data?.totals.wishes },
          { label: "Исполнено", value: data?.totals.done },
          { label: "Поддержка", value: data?.totals.claps },
        ].map((tile) => (
          <div key={tile.label} className="rounded-(--plush-radius-card) bg-(--plush-panel) px-4 py-4">
            <p className="text-[26px] leading-none font-(--plush-weight-semi) tabular-nums">
              {tile.value === undefined ? "–" : compact(tile.value)}
            </p>
            <p className="mt-2 truncate text-(length:--plush-text-xs) text-(--plush-ink-2)">{tile.label}</p>
          </div>
        ))}
      </section>

      <section className="rise mt-3 rounded-(--plush-radius-sheet) bg-(--plush-surface) p-(--plush-pad) shadow-(--plush-card-shadow) [--i:3]">
        <div className="mb-4 flex gap-2" role="group" aria-label="Что показывать">
          {(
            [
              { value: "wished", label: "Загаданные" },
              { value: "done", label: "Исполненные" },
            ] as const
          ).map((option) => (
            <Button
              key={option.value}
              size="xs"
              variant={series === option.value ? "default" : "secondary"}
              aria-pressed={series === option.value}
              onClick={() => setSeries(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        {data ? (
          <TimeChart
            label={series === "wished" ? "Загаданные желания" : "Исполненные желания"}
            unit={range === "all" ? "month" : "day"}
            rangeLabel={range === "all" ? "за всё время" : "за 30 дней"}
            aside={
              <button
                type="button"
                onClick={() => setRange(range === "all" ? "30d" : "all")}
                aria-label={`Период: ${range === "all" ? "всё время" : "30 дней"}. Переключить`}
                className="plush-focus-ring flex h-8 items-center gap-1 rounded-full bg-(--plush-fill) px-3 text-(length:--plush-text-sm) font-(--plush-weight-semi) text-(--plush-ink) [transition:background-color_var(--plush-dur-fast)_var(--plush-ease-fade),scale_var(--plush-dur-spring)_var(--plush-ease-spring)] hover:bg-(--plush-fill-strong) active:scale-(--plush-press-scale-pill)"
              >
                {range === "all" ? "за всё время" : "за 30 дней"}
                <HugeiconsIcon icon={ArrowDataTransferVerticalIcon} size={14} strokeWidth={2} aria-hidden />
              </button>
            }
            points={
              range === "all"
                ? data.months.map((m) => ({ key: m.month, value: m[series] }))
                : data.series.map((d) => ({ key: d.day, value: d[series] }))
            }
          />
        ) : (
          <div className="h-[244px] animate-pulse rounded-(--plush-radius-row) bg-(--plush-panel)" />
        )}
      </section>
    </main>
  );
}
