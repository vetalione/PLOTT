"use client";

import useSWR, { mutate } from "swr";
import useSWRInfinite from "swr/infinite";
import type { WishDTO } from "./wishes";

export type Me = {
  user: {
    id: string;
    isGuest: boolean;
    email: string | null;
    instagram: string | null;
    hasPassword: boolean;
    isAdmin: boolean;
  } | null;
  features: { email: boolean };
};

export type Stats = {
  totals: { wishes: number; done: number; claps: number };
  mine: { wishes: number; done: number; claps: number } | null;
  series: { day: string; wished: number; done: number }[];
  months: { month: string; wished: number; done: number }[];
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(url, {
    ...rest,
    headers: json !== undefined ? { "Content-Type": "application/json", ...rest.headers } : rest.headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error ?? "Что-то пошло не так. Попробуй ещё раз.", res.status);
  return data as T;
}

const fetcher = <T,>(url: string) => api<T>(url);

export const useMe = () => useSWR<Me>("/api/me", fetcher, { revalidateOnFocus: false });
export const useMyWishes = () => useSWR<{ wishes: WishDTO[] }>("/api/wishes", fetcher);
export type FeedPage = { wishes: WishDTO[]; nextOffset: number | null };
export const usePublicWishes = (sort: "new" | "top") =>
  useSWRInfinite<FeedPage>(
    (index, previous: FeedPage | null) => {
      if (previous && previous.nextOffset === null) return null;
      return `/api/wishes/public?sort=${sort}&offset=${index === 0 ? 0 : previous!.nextOffset}`;
    },
    fetcher,
    { revalidateFirstPage: false },
  );
export const useStats = () => useSWR<Stats>("/api/stats", fetcher);

/** After anything that changes who the viewer is or what they own. */
export const refreshAll = () => mutate(() => true);

export function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
