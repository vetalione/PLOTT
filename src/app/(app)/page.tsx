"use client";

import * as React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon, InstagramIcon, ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { cn } from "cn";
import { toast } from "sonner";
import { useAuthDialog } from "@/components/auth-dialog";
import { DueDateDialog, formatDue } from "@/components/due-date";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { WishButton, type WishButtonState } from "@/components/wish-button";
import { authClient } from "@/lib/auth-client";
import { api, refreshAll, useMe } from "@/lib/client";

const MAX = 280;
// Long enough to feel like the wish is travelling somewhere, short enough not to be a wait.
const RITUAL_MS = 1500;

export default function WishPage() {
  const { data: me } = useMe();
  const auth = useAuthDialog();
  const [text, setText] = React.useState("");
  const [dueDate, setDueDate] = React.useState<string | null>(null);
  const [isPublic, setPublic] = React.useState(true);
  const [showAuthor, setShowAuthor] = React.useState(true);
  const [state, setState] = React.useState<WishButtonState>("idle");
  const [dateOpen, setDateOpen] = React.useState(false);
  // The calendar reads today's date, so it is only rendered once someone asks for it (never in the prerender).
  const [dateMounted, setDateMounted] = React.useState(false);
  const [shake, setShake] = React.useState(false);
  const textarea = React.useRef<HTMLTextAreaElement>(null);

  const isGuest = !me?.user || me.user.isGuest;
  const instagram = me?.user?.instagram ?? null;

  async function makeWish() {
    const wish = text.trim();
    if (!wish) {
      setShake(true);
      textarea.current?.focus();
      window.setTimeout(() => setShake(false), 450);
      return;
    }
    setState("charging");
    try {
      // First wish of a visitor: give them a guest session so the wish has an owner.
      if (!me?.user) {
        const { error } = await authClient.signIn.anonymous();
        if (error) throw new Error("Не удалось начать сессию. Попробуй ещё раз.");
      }
      await Promise.all([
        api("/api/wishes", { method: "POST", json: { text: wish, dueDate, isPublic, showAuthor } }),
        new Promise((resolve) => window.setTimeout(resolve, RITUAL_MS)),
      ]);
      setState("done");
      void refreshAll();
    } catch (error) {
      setState("idle");
      toast.error(error instanceof Error ? error.message : "Не получилось загадать. Попробуй ещё раз.");
    }
  }

  function reset() {
    setText("");
    setDueDate(null);
    setState("idle");
    window.setTimeout(() => textarea.current?.focus(), 50);
  }

  const done = state === "done";

  return (
    <main className="flex flex-1 flex-col">
      <header className="rise flex items-center justify-between pt-2">
        <span className="flex items-center gap-2 text-(length:--plush-text-2xl) font-(--plush-weight-semi) tracking-[0.04em]">
          <LogoMark className="size-6" />
          PLOTT
        </span>
        {isGuest && me && (
          <Button variant="secondary" size="xs" onClick={() => auth.open({ mode: "login" })}>
            Войти
          </Button>
        )}
      </header>

      <div className="flex flex-1 flex-col justify-center gap-6 py-6">
        {done ? (
          <section key="done" className="rise grid gap-5 text-center" aria-live="polite">
            <div>
              <h1 className="text-[30px] leading-[1.1] font-(--plush-weight-semi) tracking-[-0.01em] text-balance">
                Желание загадано!
              </h1>
              <p className="mx-auto mt-2 max-w-[30ch] text-(length:--plush-text-lg) text-(--plush-ink-2) text-balance">
                Пусть оно обязательно сбудется{dueDate ? ` до ${formatDue(dueDate)}` : ""}.
              </p>
            </div>
          </section>
        ) : (
          <section key="form" className="rise grid gap-3">
            <h1 className="sr-only">Загадай желание</h1>
            <div
              className={cn(
                "rounded-(--plush-radius-sheet) bg-(--plush-surface) p-(--plush-pad) shadow-(--plush-card-shadow)",
                shake && "shake",
              )}
            >
              <div className="flex items-baseline justify-between text-(length:--plush-text-sm) text-(--plush-ink-3)">
                <label htmlFor="wish">Я хочу…</label>
                <span className={cn("text-(length:--plush-text-xs) tabular-nums", text.length < MAX - 60 && "opacity-0")} aria-hidden>
                  {text.length}/{MAX}
                </span>
              </div>
              <textarea
                id="wish"
                ref={textarea}
                value={text}
                maxLength={MAX}
                rows={3}
                disabled={state !== "idle"}
                onChange={(e) => setText(e.target.value)}
                placeholder="жить у моря и видеть закат каждый вечер"
                className="mt-1 block field-sizing-content max-h-48 min-h-[4.5rem] w-full resize-none bg-transparent text-[22px] leading-[1.25] font-(--plush-weight-semi) tracking-[-0.01em] outline-none placeholder:text-(--plush-ink-3)/70"
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDateMounted(true);
                    setDateOpen(true);
                  }}
                  disabled={state !== "idle"}
                  className="plush-focus-ring flex h-(--plush-h-chip) items-center gap-2 rounded-full bg-(--plush-fill) px-3 text-(length:--plush-text-md) font-(--plush-weight-semi) [transition:background-color_var(--plush-dur-fast)_var(--plush-ease-fade),scale_var(--plush-dur-spring)_var(--plush-ease-spring)] hover:bg-(--plush-fill-strong) active:scale-(--plush-press-scale-pill)"
                >
                  <HugeiconsIcon icon={Calendar03Icon} size={18} strokeWidth={2} aria-hidden />
                  {dueDate ? `до ${formatDue(dueDate)}` : "Без срока"}
                </button>
                <label className="flex h-(--plush-h-chip) cursor-pointer items-center gap-2 rounded-full bg-(--plush-fill) py-1 pr-2 pl-3 text-(length:--plush-text-md) font-(--plush-weight-semi)">
                  <HugeiconsIcon icon={isPublic ? ViewIcon : ViewOffSlashIcon} size={18} strokeWidth={2} aria-hidden />
                  {isPublic ? "Видно всем" : "Только мне"}
                  <Switch size="sm" checked={isPublic} onCheckedChange={setPublic} disabled={state !== "idle"} aria-label="Сделать видимым для всех" />
                </label>
                {/* Signing is a choice: without it a public wish shows only the author's colour. */}
                {isPublic && instagram && (
                  <label className="flex h-(--plush-h-chip) max-w-full cursor-pointer items-center gap-2 rounded-full bg-(--plush-fill) py-1 pr-2 pl-3 text-(length:--plush-text-md) font-(--plush-weight-semi)">
                    <HugeiconsIcon icon={InstagramIcon} size={18} strokeWidth={2} aria-hidden className="shrink-0" />
                    <span className="truncate">{showAuthor ? `@${instagram}` : "Анонимно"}</span>
                    <Switch size="sm" checked={showAuthor} onCheckedChange={setShowAuthor} disabled={state !== "idle"} aria-label="Подписать желание моим Instagram" />
                  </label>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="rise grid justify-items-center gap-1 [--i:1]">
          <WishButton state={state} onPress={makeWish} label="Загадать желание" />
          <p className="-mt-3 h-6 text-(length:--plush-text-lg) text-(--plush-ink-2)" aria-live="polite">
            {state === "idle" && "Нажми, чтобы загадать"}
            {state === "charging" && "Отправляем во вселенную…"}
          </p>
        </section>

        {done && (
          <section className="rise grid gap-3 [--i:2]">
            <div className="flex gap-3">
              <Button size="sm" className="flex-1 px-3 text-(length:--plush-text-lg)" onClick={reset}>
                Загадать ещё
              </Button>
              <Button variant="outline" size="sm" className="flex-1 px-3 text-(length:--plush-text-lg)" asChild>
                <Link href="/wishes">Желания других</Link>
              </Button>
            </div>
            {isGuest && (
              <div className="flex items-center gap-3 rounded-(--plush-radius-card) bg-(--plush-panel) py-3.5 pr-3.5 pl-(--plush-pad)">
                <p className="min-w-0 flex-1 text-(length:--plush-text-sm) leading-snug text-(--plush-ink-2)">
                  <span className="block text-(length:--plush-text-md) font-(--plush-weight-semi) text-(--plush-ink)">
                    Сохрани свои желания
                  </span>
                  Пока они живут только в этом браузере.
                </p>
                <Button
                  variant="outline"
                  size="xs"
                  className="shrink-0"
                  onClick={() => auth.open({ mode: "signup", reason: "Желания, которые ты уже загадал, сохранятся в аккаунте." })}
                >
                  Сохранить
                </Button>
              </div>
            )}
          </section>
        )}
      </div>

      {dateMounted && (
        <DueDateDialog open={dateOpen} onOpenChange={setDateOpen} value={dueDate} onChange={setDueDate} />
      )}
    </main>
  );
}
