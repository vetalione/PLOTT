"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { MailSend01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { refreshAll, useMe } from "@/lib/client";

type Mode = "signup" | "login" | "link" | "reset" | "sent";
type OpenOptions = { mode?: "signup" | "login"; reason?: string };

const AuthDialogContext = React.createContext<{ open: (opts?: OpenOptions) => void } | null>(null);

export function useAuthDialog() {
  const ctx = React.useContext(AuthDialogContext);
  if (!ctx) throw new Error("useAuthDialog must be used inside <AuthDialogProvider>");
  return ctx;
}

const ERRORS: Record<string, string> = {
  USER_ALREADY_EXISTS: "Такой email уже зарегистрирован. Попробуй войти.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Такой email уже зарегистрирован. Попробуй войти.",
  INVALID_EMAIL_OR_PASSWORD: "Неверный email или пароль.",
  INVALID_EMAIL: "Проверь адрес почты.",
  PASSWORD_TOO_SHORT: "Пароль должен быть не короче 6 символов.",
  PASSWORD_TOO_LONG: "Пароль слишком длинный.",
};

const describe = (error: { code?: string; message?: string; status?: number } | null) =>
  (error?.code && ERRORS[error.code]) ||
  (error?.status === 429 ? "Слишком много попыток. Подожди минуту." : "Не получилось. Попробуй ещё раз.");

export function AuthDialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>("signup");
  const [reason, setReason] = React.useState<string | undefined>();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [instagram, setInstagram] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { data: me } = useMe();
  const emailFlows = me?.features.email ?? false;

  const open = React.useCallback((opts?: OpenOptions) => {
    setMode(opts?.mode ?? "signup");
    setReason(opts?.reason);
    setError(null);
    setPassword("");
    setOpen(true);
  }, []);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        const handle = instagram.trim().replace(/^@/, "");
        const { error } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: email.trim().split("@")[0] || "Друг",
          instagram: handle || undefined,
        });
        if (error) {
          // People who came over from the old app have an account but no password yet: a link gets them in.
          if (error.code?.startsWith("USER_ALREADY_EXISTS") && emailFlows) {
            setMode("link");
            return setError("Этот email уже зарегистрирован. Отправим ссылку для входа — пароль не нужен.");
          }
          return setError(describe(error));
        }
        await refreshAll();
        setOpen(false);
        toast.success("Добро пожаловать! Желания сохранены.");
      } else if (mode === "login") {
        const { error } = await authClient.signIn.email({ email: email.trim(), password });
        if (error) return setError(describe(error));
        await refreshAll();
        setOpen(false);
        toast.success("С возвращением!");
      } else if (mode === "link") {
        const { error } = await authClient.signIn.magicLink({ email: email.trim(), callbackURL: "/wishes" });
        if (error) return setError(describe(error));
        setMode("sent");
      } else if (mode === "reset") {
        const { error } = await authClient.requestPasswordReset({
          email: email.trim(),
          redirectTo: "/reset-password",
        });
        if (error) return setError(describe(error));
        setMode("sent");
      }
    } catch {
      setError("Нет связи с сервером. Попробуй ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  const title = {
    signup: "Регистрация",
    login: "Вход",
    link: "Вход по ссылке",
    reset: "Сброс пароля",
    sent: "Проверь почту",
  }[mode];

  const description = {
    signup: reason ?? "Сохрани свои желания и поддерживай желания других.",
    login: reason ?? "Рады видеть снова.",
    link: "Пришлём на почту волшебную ссылку — пароль не понадобится.",
    reset: "Пришлём ссылку, по которой можно задать новый пароль.",
    sent: `Мы отправили письмо на ${email.trim()}. Ссылка действует один час.`,
  }[mode];

  return (
    <AuthDialogContext.Provider value={{ open }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          {(mode === "signup" || mode === "login") && (
            <Tabs value={mode} onValueChange={(v) => switchMode(v as Mode)}>
              <TabsList className="w-full">
                <TabsTrigger value="signup" className="flex-1">
                  Регистрация
                </TabsTrigger>
                <TabsTrigger value="login" className="flex-1">
                  Вход
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {mode === "sent" ? (
            <div className="grid justify-items-center gap-4 py-2">
              <span className="grid size-16 place-items-center rounded-full bg-(image:--plush-select-fill) text-(--plush-on-select) shadow-(--plush-select-gloss)">
                <HugeiconsIcon icon={MailSend01Icon} size={28} strokeWidth={2} aria-hidden />
              </span>
              <Button variant="secondary" className="w-full" onClick={() => setOpen(false)}>
                Понятно
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-3" noValidate={false}>
              <Input
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                placeholder="Электронная почта"
                aria-label="Электронная почта"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {(mode === "signup" || mode === "login") && (
                <Input
                  type="password"
                  name="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  placeholder={mode === "signup" ? "Пароль, от 6 символов" : "Пароль"}
                  aria-label="Пароль"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
              {mode === "signup" && (
                <Input
                  name="instagram"
                  autoComplete="off"
                  autoCapitalize="none"
                  placeholder="Instagram-ник (необязательно)"
                  aria-label="Instagram-ник, необязательно"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                />
              )}

              {error && (
                <p role="alert" className="px-1 text-(length:--plush-text-sm) text-(--plush-danger)">
                  {error}
                </p>
              )}

              <Button type="submit" className="mt-1 w-full" disabled={busy} aria-busy={busy}>
                {
                  {
                    signup: "Зарегистрироваться",
                    login: "Войти",
                    link: "Отправить ссылку",
                    reset: "Отправить ссылку",
                  }[mode]
                }
              </Button>

              {mode === "login" && emailFlows && (
                <div className="flex justify-between gap-2">
                  <Button type="button" variant="link" size="xs" className="px-1" onClick={() => switchMode("link")}>
                    Войти по ссылке
                  </Button>
                  <Button type="button" variant="link" size="xs" className="px-1 text-(--plush-ink-2)" onClick={() => switchMode("reset")}>
                    Забыли пароль?
                  </Button>
                </div>
              )}
              {(mode === "link" || mode === "reset") && (
                <Button type="button" variant="link" size="xs" className="justify-self-start px-1" onClick={() => switchMode("login")}>
                  ← Назад ко входу
                </Button>
              )}
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AuthDialogContext.Provider>
  );
}
