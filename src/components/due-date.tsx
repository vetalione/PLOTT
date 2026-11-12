"use client";

import * as React from "react";
import { addMonths, addYears, endOfYear, format, isSameDay, parseISO, startOfToday } from "date-fns";
import { ru } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const toISODate = (date: Date) => format(date, "yyyy-MM-dd");
export const formatDue = (iso: string) => {
  const date = parseISO(iso);
  return format(date, date.getFullYear() === new Date().getFullYear() ? "d MMMM" : "d MMMM yyyy", { locale: ru });
};

export function DueDateDialog({
  open,
  onOpenChange,
  value,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const today = startOfToday();
  const selected = value ? parseISO(value) : undefined;
  const [month, setMonth] = React.useState<Date>(selected ?? today);

  const presets = [
    { label: "Через месяц", date: addMonths(today, 1) },
    { label: "К Новому году", date: endOfYear(today) },
    { label: "Через год", date: addYears(today, 1) },
  ];

  const pick = (date: Date | null) => {
    onChange(date ? toISODate(date) : null);
    if (date) setMonth(date);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Исполнить до</DialogTitle>
          <DialogDescription>Срок помогает желанию стать планом. Можно и без него.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              type="button"
              size="xs"
              variant={selected && isSameDay(selected, preset.date) ? "default" : "secondary"}
              onClick={() => pick(preset.date)}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <Calendar
          mode="single"
          locale={ru}
          weekStartsOn={1}
          today={today}
          month={month}
          onMonthChange={setMonth}
          selected={selected}
          onSelect={(date) => pick(date ?? null)}
          disabled={{ before: today }}
          showOutsideDays={false}
          className="mx-auto p-0"
        />

        <div className="flex gap-3">
          <Button type="button" variant="secondary" size="sm" className="flex-1" onClick={() => { pick(null); onOpenChange(false); }}>
            Без срока
          </Button>
          <Button type="button" size="sm" className="flex-1" onClick={() => onOpenChange(false)}>
            Готово
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
