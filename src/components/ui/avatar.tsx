"use client"

import * as React from "react"
import { cn } from "cn"
import { Avatar as AvatarPrimitive } from "radix-ui"

// Three sizes: sm 28 (chat), default 32 (list rows), lg 46 (the stack). Letters are white and
// semibold on a colour: the fallback is the black accent unless a colour is passed (bg-(--plush-pink) …).
// In a group every circle wears a ring in the colour of the surface behind it (--plush-avatar-ring-color on the group or any
// parent, default --plush-bg) and overlaps its neighbour; with more than four circles and the plus (six children on) the stack huddles closer, on the soft spring.
// A circle that joins a stack in use (hovered, or focus inside it, e.g. on its plus button) comes out of its right neighbour:
// it starts there at --plush-pop-scale and grows in on the spring while the neighbour slides aside to make room, and its fallback
// colours in from white. The gate keeps a stack still on page load (@starting-style fires on first paint as well).

// Circle size and letter size of each step. The group sets them from the avatars it holds, so its count matches them.
const sizes = {
  self: "[--plush-avatar-size:var(--plush-avatar)] [--plush-avatar-text:var(--plush-text-md)] data-[size=sm]:[--plush-avatar-size:var(--plush-avatar-sm)] data-[size=sm]:[--plush-avatar-text:var(--plush-text-xs)] data-[size=lg]:[--plush-avatar-size:var(--plush-avatar-lg)] data-[size=lg]:[--plush-avatar-text:var(--plush-text-avatar-lg)]",
  group:
    "[--plush-avatar-size:var(--plush-avatar)] [--plush-avatar-text:var(--plush-text-md)] has-data-[size=sm]:[--plush-avatar-size:var(--plush-avatar-sm)] has-data-[size=sm]:[--plush-avatar-text:var(--plush-text-xs)] has-data-[size=lg]:[--plush-avatar-size:var(--plush-avatar-lg)] has-data-[size=lg]:[--plush-avatar-text:var(--plush-text-avatar-lg)]",
}

function Avatar({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: "default" | "sm" | "lg"
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        "group/avatar plush-font plush-focus-ring relative flex size-(--plush-avatar-size) shrink-0 rounded-(--plush-radius-full) text-(length:--plush-avatar-text) select-none",
        sizes.self,
        // An avatar that is itself a link (asChild on an <a href>) grows a little under the pointer, on the spring.
        "[transition:scale_var(--plush-dur-spring)_var(--plush-ease-spring)] [a[href]&]:hover:scale-(--plush-hover-grow)",
        // In a group: the ring, and springs for making room (margin), growing in and ducking (scale) and fading.
        "in-data-[slot=avatar-group]:ring-[length:var(--plush-avatar-ring)] in-data-[slot=avatar-group]:ring-[color:var(--plush-avatar-ring-color,var(--plush-bg))]",
        "in-data-[slot=avatar-group]:[transition:margin_var(--plush-dur-soft)_var(--plush-ease-soft),scale_var(--plush-dur-spring)_var(--plush-ease-spring),opacity_var(--plush-dur-fade)_var(--plush-ease-fade)]",
        // Entry: lies on its right neighbour (margin end = minus one step) at the pop scale, then makes room and grows.
        // Gated on the group being hovered or holding focus, i.e. a stack in use.
        "starting:in-[[data-slot=avatar-group]:is(:hover,:focus-within)]:me-[calc(var(--plush-avatar-overlap-now)_-_var(--plush-avatar-size))]",
        "starting:in-[[data-slot=avatar-group]:is(:hover,:focus-within)]:scale-(--plush-pop-scale)",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        "aspect-square size-full rounded-(--plush-radius-full) object-cover",
        // Radix mounts the image once it has loaded: it fades in over the fallback's place.
        "[transition:opacity_var(--plush-dur-fade)_var(--plush-ease-fade)] starting:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center overflow-hidden rounded-(--plush-radius-full) bg-(--plush-accent) leading-none font-(--plush-weight-semi) text-(--plush-on-accent)",
        // Joining a stack: white like the plus it comes out of, colours in one stagger later (0.3 s smoothstep).
        "[transition:background-color_var(--plush-dur-slow)_var(--plush-ease-fade)_var(--plush-stagger),color_var(--plush-dur-slow)_var(--plush-ease-fade)_var(--plush-stagger)]",
        "starting:in-[[data-slot=avatar-group]:is(:hover,:focus-within)]:bg-(--plush-surface) starting:in-[[data-slot=avatar-group]:is(:hover,:focus-within)]:text-transparent",
        className
      )}
      {...props}
    />
  )
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-(--plush-radius-full) bg-(--plush-badge) text-(--plush-on-accent) ring-2 ring-[color:var(--plush-avatar-ring-color,var(--plush-bg))] select-none",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group plush-font flex",
        sizes.group,
        // Overlap: 12 of 46 px (a quarter, like shadcn's 8 of 32); from six children on (a fifth person next to the plus) 18 of 46 px
        // (34 → 28 px apart once the fifth one joins).
        "[--plush-avatar-overlap-now:calc(var(--plush-avatar-size)*var(--plush-avatar-overlap))]",
        "has-[>:nth-child(6)]:[--plush-avatar-overlap-now:calc(var(--plush-avatar-size)*var(--plush-avatar-overlap-tight))]",
        "*:not-first:ms-[calc(-1*var(--plush-avatar-overlap-now))]",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "plush-font plush-focus-ring relative flex size-[var(--plush-avatar-size,var(--plush-avatar))] shrink-0 items-center justify-center rounded-(--plush-radius-full) bg-(--plush-surface) text-[length:var(--plush-avatar-text,var(--plush-text-md))] leading-none font-(--plush-weight-semi) text-(--plush-ink)",
        "ring-[length:var(--plush-avatar-ring)] ring-[color:var(--plush-avatar-ring-color,var(--plush-bg))]",
        "[&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
        // Moves with the stack; a button or link inside it makes the circle a round button: under the pointer it grows a
        // little and its shadow gets stronger, under the finger it gives, the whole circle with it.
        "[transition:margin_var(--plush-dur-soft)_var(--plush-ease-soft),scale_var(--plush-dur-spring)_var(--plush-ease-spring),background-color_var(--plush-dur-fast)_var(--plush-ease-fade),box-shadow_var(--plush-dur-fast)_var(--plush-ease-fade)]",
        "hover:has-[button:enabled,a[href]]:scale-(--plush-hover-grow) hover:has-[button:enabled,a[href]]:bg-(--plush-surface-hover) hover:has-[button:enabled,a[href]]:shadow-(--plush-active-shadow)",
        "has-[button:enabled:active,a[href]:active]:scale-(--plush-press-scale)",
        // A disabled button inside fades its content only: a see-through circle would show the one beneath.
        "has-disabled:*:opacity-(--plush-disabled-opacity)",
        className
      )}
      {...props}
    />
  )
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
}
