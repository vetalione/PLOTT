"use client";

import * as React from "react";
import Link from "next/link";
import { mutate } from "swr";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { useAuthDialog } from "@/components/auth-dialog";
import { Confetti, type ConfettiHandle } from "@/components/confetti";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyWishCard, PublicWishCard, WishSkeleton } from "@/components/wish-card";
import { api, ApiError, type FeedPage, useMe, useMyWishes, usePublicWishes } from "@/lib/client";
import type { WishDTO } from "@/lib/wishes";

type Scope = "all" | "mine";

export default function WishesPage() {
  const { data: me } = useMe();
  const auth = useAuthDialog();
  const [scope, setScope] = React.useState<Scope>("all");
  const [sort, setSort] = React.useState<"new" | "top">("new");
  const [status, setStatus] = React.useState<"wished" | "done">("wished");
  const [celebrating, setCelebrating] = React.useState<WishDTO | null>(null);
  const [deleting, setDeleting] = React.useState<WishDTO | null>(null);
  const confetti = React.useRef<ConfettiHandle>(null);

  const mine = useMyWishes();
  const feed = usePublicWishes(sort);
  const canClap = Boolean(me?.user && !me.user.isGuest);

  const myWishes = mine.data?.wishes ?? [];
  const shown = myWishes.filter((w) => w.status === status);
  const counts = {
    wished: myWishes.filter((w) => w.status === "wished").length,
    done: myWishes.filter((w) => w.status === "done").length,
  };

  // Offset paging can repeat a wish when new ones arrive between pages, so keep the first sighting only.
  const pages = feed.data ?? [];
  const seen = new Set<string>();
  const feedWishes = pages.flatMap((page) => page.wishes).filter((w) => !seen.has(w.id) && seen.add(w.id));
  const hasMore = pages.length > 0 && pages[pages.length - 1].nextOffset !== null;

  const refreshWishes = () =>
    Promise.all([
      mutate((key) => typeof key === "string" && (key === "/api/wishes" || key === "/api/stats")),
      feed.mutate(),
    ]);

  async function clap(wish: WishDTO) {
    if (!canClap) {
      auth.open({ mode: "signup", reason: "Зарегистрируйся, чтобы поддерживать желания других." });
      return;
    }
    const patch = (list: FeedPage[] | undefined, change: (w: WishDTO) => WishDTO) =>
      (list ?? []).map((page) => ({ ...page, wishes: page.wishes.map((w) => (w.id === wish.id ? change(w) : w)) }));
    try {
      await feed.mutate(
        async (current) => {
          const result = await api<{ clapped: boolean; clapsCount: number }>(`/api/wishes/${wish.id}/clap`, { method: "POST" });
          return patch(current, (w) => ({ ...w, ...result }));
        },
        {
          optimisticData: (current) =>
            patch(current, (w) => ({
              ...w,
              clapped: !w.clapped,
              clapsCount: Math.max(0, w.clapsCount + (w.clapped ? -1 : 1)),
            })),
          rollbackOnError: true,
          revalidate: false,
        },
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) auth.open({ mode: "login" });
      else toast.error(error instanceof Error ? error.message : "Не получилось.");
    }
  }

  async function setDone(wish: WishDTO, done: boolean) {
    try {
      await api(`/api/wishes/${wish.id}`, { method: "PATCH", json: { status: done ? "done" : "wished" } });
      if (done) setCelebrating(wish);
      await refreshWishes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не получилось.");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await api(`/api/wishes/${deleting.id}`, { method: "DELETE" });
      setDeleting(null);
      await refreshWishes();
      toast.success("Желание удалено");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не получилось.");
    }
  }

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader title="Желания" />

      <Tabs value={scope} onValueChange={(v) => setScope(v as Scope)} className="rise mb-5 [--i:1]">
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">
            Все
          </TabsTrigger>
          <TabsTrigger value="mine" className="flex-1">
            Мои{myWishes.length > 0 ? ` · ${myWishes.length}` : ""}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {scope === "all" ? (
        <section aria-label="Желания всех">
          <Chips
            value={sort}
            onChange={setSort}
            options={[
              { value: "new", label: "Новые" },
              { value: "top", label: "Топ" },
            ]}
          />
          <ul className="grid gap-3" key={sort}>
            {!feed.data && [0, 1, 2, 3].map((i) => <WishSkeleton key={i} />)}
            {feedWishes.map((wish, i) => (
              <PublicWishCard key={wish.id} wish={wish} index={i % 30} onClap={clap} />
            ))}
          </ul>
          {hasMore && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-4 w-full"
              disabled={feed.isValidating}
              onClick={() => feed.setSize(feed.size + 1)}
            >
              Показать ещё
            </Button>
          )}
          {feed.data && feedWishes.length === 0 && (
            <Empty title="Пока тихо" text="Здесь появятся желания, которыми поделились другие. Стань первым." cta="Загадать желание" />
          )}
        </section>
      ) : (
        <section aria-label="Мои желания">
          <Chips
            value={status}
            onChange={setStatus}
            options={[
              { value: "wished", label: `Загаданные${counts.wished ? ` · ${counts.wished}` : ""}` },
              { value: "done", label: `Исполненные${counts.done ? ` · ${counts.done}` : ""}` },
            ]}
          />
          <ul className="grid gap-3" key={status}>
            {!mine.data && [0, 1].map((i) => <WishSkeleton key={i} />)}
            {shown.map((wish, i) => (
              <MyWishCard
                key={wish.id}
                wish={wish}
                index={i}
                onDone={(w) => setDone(w, true)}
                onUndo={(w) => setDone(w, false)}
                onDelete={setDeleting}
              />
            ))}
          </ul>
          {mine.data && shown.length === 0 && (
            status === "wished" ? (
              <Empty title="Здесь пока нет желаний" text="Загадай первое — кнопка уже ждёт." cta="Загадать желание" />
            ) : (
              <Empty title="Исполненных пока нет" text="Отметь желание исполненным, и оно появится здесь." />
            )
          )}
        </section>
      )}

      {/* Marking a wish as fulfilled deserves a moment. */}
      <Dialog
        open={celebrating !== null}
        onOpenChange={(open) => !open && setCelebrating(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="overflow-hidden text-center"
          onOpenAutoFocus={() => window.setTimeout(() => confetti.current?.fire({ count: 140, power: 1.25 }), 120)}
        >
          <Confetti ref={confetti} />
          <div className="mx-auto mt-3 grid size-20 place-items-center rounded-full bg-(image:--plush-select-fill) text-[40px] shadow-(--plush-select-gloss)" aria-hidden>
            🎉
          </div>
          <DialogHeader className="items-center">
            <DialogTitle className="text-[26px] leading-tight">Поздравляем!</DialogTitle>
            <DialogDescription className="text-balance">
              «{celebrating?.text}» — исполнено. Пусть все твои мечты сбываются!
            </DialogDescription>
          </DialogHeader>
          <Button className="relative z-20 w-full" onClick={() => setCelebrating(null)}>
            Ура!
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить желание?</DialogTitle>
            <DialogDescription>«{deleting?.text}» исчезнет навсегда, вместе с аплодисментами.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => setDeleting(null)}>
              Оставить
            </Button>
            <Button variant="destructive" size="sm" className="flex-1" onClick={confirmDelete}>
              Удалить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Chips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="rise mb-4 flex gap-2 [--i:2]" role="group">
      {options.map((option) => (
        <Button
          key={option.value}
          size="xs"
          variant={value === option.value ? "default" : "secondary"}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

function Empty({ title, text, cta }: { title: string; text: string; cta?: string }) {
  return (
    <div className="rise grid justify-items-center gap-1.5 rounded-(--plush-radius-card) bg-(--plush-panel) px-6 py-10 text-center [--i:3]">
      <p className="text-(length:--plush-text-xl) font-(--plush-weight-semi)">{title}</p>
      <p className="max-w-[28ch] text-(length:--plush-text-md) text-(--plush-ink-2) text-balance">{text}</p>
      {cta && (
        <Button size="sm" className="mt-4" asChild>
          <Link href="/">{cta}</Link>
        </Button>
      )}
    </div>
  );
}
