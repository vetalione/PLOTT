"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Logout01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { useAuthDialog } from "@/components/auth-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { api, refreshAll, useMe } from "@/lib/client";

const sheet = "rise rounded-(--plush-radius-sheet) bg-(--plush-surface) p-(--plush-pad) shadow-(--plush-card-shadow)";

export default function ProfilePage() {
  const { data: me, mutate } = useMe();
  const auth = useAuthDialog();
  const user = me?.user && !me.user.isGuest ? me.user : null;

  if (!me) {
    return (
      <main className="flex flex-1 flex-col">
        <PageHeader title="Профиль" />
        <div className="h-48 animate-pulse rounded-(--plush-radius-sheet) bg-(--plush-panel)" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex flex-1 flex-col">
        <PageHeader title="Профиль" />
        <section className={`${sheet} grid justify-items-center gap-2 py-10 text-center [--i:1]`}>
          <Avatar size="lg">
            <AvatarFallback>?</AvatarFallback>
          </Avatar>
          <p className="mt-2 text-(length:--plush-text-2xl) font-(--plush-weight-semi)">Ты здесь как гость</p>
          <p className="max-w-[30ch] text-(length:--plush-text-md) text-(--plush-ink-2) text-balance">
            Зарегистрируйся, чтобы сохранить желания и поддерживать других.
          </p>
          <div className="mt-5 grid w-full gap-3">
            <Button onClick={() => auth.open({ mode: "signup" })}>Зарегистрироваться</Button>
            <Button variant="secondary" onClick={() => auth.open({ mode: "login" })}>
              У меня уже есть аккаунт
            </Button>
          </div>
        </section>
      </main>
    );
  }

  async function signOut() {
    await authClient.signOut();
    await refreshAll();
    toast("Ты вышел из аккаунта");
  }

  return (
    <main className="flex flex-1 flex-col gap-3">
      <PageHeader title="Профиль" />

      <section className={`${sheet} -mt-5 flex items-center gap-4 [--i:1]`}>
        <Avatar size="lg">
          <AvatarFallback>{(user.email ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-(length:--plush-text-xl) font-(--plush-weight-semi)">{user.email}</p>
          <p className="truncate text-(length:--plush-text-md) text-(--plush-ink-2)">
            {user.instagram ? `@${user.instagram}` : "Instagram не указан"}
          </p>
        </div>
      </section>

      <InstagramForm key={user.instagram ?? ""} initial={user.instagram ?? ""} onSaved={() => mutate()} />
      <PasswordForm hasPassword={user.hasPassword} onSaved={() => mutate()} />

      <Button variant="secondary" className="rise mt-2 [--i:4]" onClick={signOut}>
        <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} data-icon="inline-start" aria-hidden />
        Выйти
      </Button>
    </main>
  );
}

function InstagramForm({ initial, onSaved }: { initial: string; onSaved: () => void }) {
  const [value, setValue] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await api("/api/me", { method: "PATCH", json: { instagram: value } });
      onSaved();
      toast.success("Сохранено!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не получилось сохранить.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className={`${sheet} grid gap-3 [--i:2]`}>
      <div>
        <h2 className="text-(length:--plush-text-xl) font-(--plush-weight-semi)">Instagram</h2>
        <p className="mt-0.5 text-(length:--plush-text-sm) text-(--plush-ink-2)">Ник виден рядом с твоими публичными желаниями.</p>
      </div>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="@nickname"
        aria-label="Instagram-ник"
        autoCapitalize="none"
        autoComplete="off"
      />
      <Button type="submit" variant="outline" size="sm" disabled={busy || value.trim().replace(/^@/, "") === initial}>
        Сохранить
      </Button>
    </form>
  );
}

function PasswordForm({ hasPassword, onSaved }: { hasPassword: boolean; onSaved: () => void }) {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await api("/api/account/password", { method: "POST", json: { currentPassword: current, newPassword: next } });
      setCurrent("");
      setNext("");
      onSaved();
      toast.success(hasPassword ? "Пароль изменён" : "Пароль задан");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не получилось сменить пароль.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className={`${sheet} grid gap-3 [--i:3]`}>
      <div>
        <h2 className="text-(length:--plush-text-xl) font-(--plush-weight-semi)">{hasPassword ? "Смена пароля" : "Задать пароль"}</h2>
        {!hasPassword && (
          <p className="mt-0.5 text-(length:--plush-text-sm) text-(--plush-ink-2)">
            Сейчас ты входишь по ссылке из письма. С паролем будет быстрее.
          </p>
        )}
      </div>
      {hasPassword && (
        <Input
          type="password"
          autoComplete="current-password"
          placeholder="Текущий пароль"
          aria-label="Текущий пароль"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      )}
      <Input
        type="password"
        autoComplete="new-password"
        placeholder="Новый пароль, от 6 символов"
        aria-label="Новый пароль"
        required
        minLength={6}
        value={next}
        onChange={(e) => setNext(e.target.value)}
      />
      <Button type="submit" variant="outline" size="sm" disabled={busy || next.length < 6}>
        {hasPassword ? "Изменить" : "Задать пароль"}
      </Button>
    </form>
  );
}
