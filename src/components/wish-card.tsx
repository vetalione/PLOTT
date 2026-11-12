"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowTurnBackwardIcon,
  Calendar03Icon,
  Clapping01Icon,
  Delete02Icon,
  InstagramIcon,
  Tick02Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import type { WishDTO } from "@/lib/wishes";
import { formatDue } from "./due-date";

const shortDate = (iso: string) => {
  const date = parseISO(iso);
  const pattern = date.getFullYear() === new Date().getFullYear() ? "d MMM" : "d MMM yyyy";
  return format(date, pattern, { locale: ru }).replace(".", "");
};

function Meta({ icon, children }: { icon?: Parameters<typeof HugeiconsIcon>[0]["icon"]; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      {icon && <HugeiconsIcon icon={icon} size={14} strokeWidth={2} aria-hidden />}
      {children}
    </span>
  );
}

function DoneBadge() {
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-full bg-(image:--plush-select-fill) pr-2.5 pl-1.5 text-(length:--plush-text-xs) font-(--plush-weight-semi) text-(--plush-on-select) shadow-(--plush-select-gloss)">
      <HugeiconsIcon icon={Tick02Icon} size={14} strokeWidth={2.6} aria-hidden />
      Исполнено
    </span>
  );
}

// `tone` (globals.css) rings the card in its author's colour and gives it a soft glow of the same hue.
const card =
  "tone rise flex items-center gap-3 rounded-(--plush-radius-card) bg-(--plush-surface) py-4 pr-4 pl-(--plush-pad)";

const toneStyle = (wish: WishDTO, index: number) =>
  ({ "--i": Math.min(index, 8), "--hue": wish.hue }) as React.CSSProperties;

/** Wishes are usually a line or two; the rare essay folds until someone asks for all of it. */
function WishText({ text, muted }: { text: string; muted?: boolean }) {
  const long = text.length > 220;
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <p
        className={cn(
          "text-(length:--plush-text-xl) leading-snug font-(--plush-weight-semi) whitespace-pre-line wrap-anywhere",
          long && !open && "line-clamp-5",
          muted && "text-(--plush-ink-2)",
        )}
      >
        {text.trim()}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="plush-focus-ring mt-1 rounded-sm text-(length:--plush-text-sm) font-(--plush-weight-semi) text-(--plush-ink-2) hover:text-(--plush-ink)"
        >
          {open ? "Свернуть" : "Показать полностью"}
        </button>
      )}
    </>
  );
}

/** A wish in the public feed: the text, who and when, and the applause button. */
export function PublicWishCard({
  wish,
  index,
  onClap,
}: {
  wish: WishDTO;
  index: number;
  onClap: (wish: WishDTO) => void;
}) {
  const [pop, setPop] = React.useState(0);
  const done = wish.status === "done";

  return (
    <li className={card} style={toneStyle(wish, index)}>
      <div className="min-w-0 flex-1">
        <WishText text={wish.text} />
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-(length:--plush-text-xs) text-(--plush-ink-3)">
          <span className="tone-dot" title="Цвет автора: у всех желаний одного человека он одинаковый" aria-hidden />
          {wish.instagram ? (
            <a
              href={`https://instagram.com/${wish.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram автора: ${wish.instagram}`}
              className="plush-focus-ring inline-flex h-6 max-w-full items-center gap-1 rounded-full bg-(--plush-fill) pr-2.5 pl-1.5 font-(--plush-weight-semi) text-(--plush-ink) [transition:background-color_var(--plush-dur-fast)_var(--plush-ease-fade),scale_var(--plush-dur-spring)_var(--plush-ease-spring)] hover:bg-(--plush-fill-strong) active:scale-(--plush-press-scale-pill)"
            >
              <HugeiconsIcon icon={InstagramIcon} size={14} strokeWidth={2} aria-hidden className="shrink-0" />
              <span className="truncate">{wish.instagram}</span>
            </a>
          ) : (
            wish.mine && <Meta>твоё</Meta>
          )}
          <Meta>{shortDate(wish.createdAt)}</Meta>
          {wish.dueDate && !done && <Meta icon={Calendar03Icon}>до {formatDue(wish.dueDate)}</Meta>}
          {done && <DoneBadge />}
        </div>
      </div>

      <button
        type="button"
        aria-pressed={wish.clapped}
        aria-label={wish.clapped ? `Убрать аплодисменты, сейчас ${wish.clapsCount}` : `Поддержать, сейчас ${wish.clapsCount}`}
        onClick={() => {
          if (!wish.clapped) setPop((n) => n + 1);
          onClap(wish);
        }}
        className={cn(
          "plush-focus-ring flex h-12 min-w-[4.25rem] shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-(length:--plush-text-lg) font-(--plush-weight-semi) tabular-nums select-none",
          "[transition:background-color_var(--plush-dur-fast)_var(--plush-ease-fade),color_var(--plush-dur-fast)_var(--plush-ease-fade),scale_var(--plush-dur-spring)_var(--plush-ease-spring)] active:scale-(--plush-press-scale)",
          wish.clapped
            ? "bg-(image:--plush-select-fill) text-(--plush-on-select) shadow-(--plush-select-gloss)"
            : "bg-(--plush-fill) text-(--plush-ink) hover:bg-(--plush-fill-strong)",
        )}
      >
        <span key={pop} className={cn("grid", pop > 0 && "animate-[app-pop_420ms_var(--plush-ease-spring)]")}>
          <HugeiconsIcon icon={Clapping01Icon} size={20} strokeWidth={1.9} aria-hidden />
        </span>
        {wish.clapsCount}
      </button>
    </li>
  );
}

/** One of the viewer's own wishes: fulfil it, bring it back, or let it go. */
export function MyWishCard({
  wish,
  index,
  onDone,
  onUndo,
  onDelete,
}: {
  wish: WishDTO;
  index: number;
  onDone: (wish: WishDTO) => void;
  onUndo: (wish: WishDTO) => void;
  onDelete: (wish: WishDTO) => void;
}) {
  const done = wish.status === "done";

  return (
    <li className={card} style={toneStyle(wish, index)}>
      <div className="min-w-0 flex-1">
        <WishText text={wish.text} muted={done} />
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-(length:--plush-text-xs) text-(--plush-ink-3)">
          {done ? (
            <>
              <DoneBadge />
              {wish.doneAt && <Meta>{shortDate(wish.doneAt)}</Meta>}
            </>
          ) : (
            <>
              {wish.dueDate && <Meta icon={Calendar03Icon}>до {formatDue(wish.dueDate)}</Meta>}
              <Meta icon={wish.isPublic ? ViewIcon : ViewOffSlashIcon}>{wish.isPublic ? "Публичное" : "Личное"}</Meta>
            </>
          )}
          {wish.clapsCount > 0 && <Meta icon={Clapping01Icon}>{wish.clapsCount}</Meta>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-(--plush-ink-3)"
          aria-label={`Удалить желание «${wish.text}»`}
          onClick={() => onDelete(wish)}
        >
          <HugeiconsIcon icon={Delete02Icon} size={18} strokeWidth={1.9} aria-hidden />
        </Button>
        {done ? (
          <Button variant="secondary" size="icon-sm" aria-label="Вернуть в загаданные" onClick={() => onUndo(wish)}>
            <HugeiconsIcon icon={ArrowTurnBackwardIcon} size={20} strokeWidth={2} aria-hidden />
          </Button>
        ) : (
          <Button size="icon-sm" aria-label={`Отметить исполненным «${wish.text}»`} onClick={() => onDone(wish)}>
            <HugeiconsIcon icon={Tick02Icon} size={22} strokeWidth={2.4} aria-hidden />
          </Button>
        )}
      </div>
    </li>
  );
}

export function WishSkeleton() {
  return (
    <li className="h-[92px] animate-pulse rounded-(--plush-radius-card) bg-(--plush-panel)" aria-hidden />
  );
}
