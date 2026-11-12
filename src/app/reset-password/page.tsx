"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(
    token ? null : "Ссылка недействительна или устарела. Запроси новую на экране входа.",
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    setBusy(false);
    if (error) {
      setError("Ссылка недействительна или устарела. Запроси новую на экране входа.");
      return;
    }
    router.replace("/profile");
  }

  return (
    <form
      onSubmit={submit}
      className="grid w-full gap-3 rounded-(--plush-radius-sheet) bg-(--plush-surface) p-(--plush-pad) shadow-(--plush-card-shadow)"
    >
      <h1 className="py-1 text-(length:--plush-text-2xl) font-(--plush-weight-semi)">Новый пароль</h1>
      <Input
        type="password"
        autoComplete="new-password"
        placeholder="Новый пароль, от 6 символов"
        aria-label="Новый пароль"
        required
        minLength={6}
        disabled={!token}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && (
        <p role="alert" className="px-1 text-(length:--plush-text-sm) text-(--plush-danger)">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy || !token || password.length < 6}>
        Сохранить пароль
      </Button>
      <Button variant="link" size="xs" asChild>
        <Link href="/">На главную</Link>
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="plush-font mx-auto grid min-h-dvh w-full max-w-(--app-column) place-items-center px-5">
      <React.Suspense>
        <ResetForm />
      </React.Suspense>
    </main>
  );
}
