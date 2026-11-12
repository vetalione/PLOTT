"use client"

import * as React from "react"
import { cn } from "cn"
import { HugeiconsIcon } from "@hugeicons/react"
import { MultiplicationSignIcon } from "@hugeicons/core-free-icons"
import { Dialog as DialogPrimitive } from "radix-ui"

import { Button } from "@/components/ui/button"

// The content is the white sheet: 32 px corners, soft card shadow, 20 px inset, a 20 px title and the round grey close
// button on the right of the title line. The content rises by its own
// height on the soft spring while it fades in, its direct children rise --plush-slide on the spring one stagger apart,
// the close button with the first one. Closing, the sheet drops by its own height while it fades;
// the overlay only fades. Rise and drop come from @starting-style and data-state; Radix waits for
// the fade-out animation before it unmounts.

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return (
    <DialogPrimitive.Trigger
      data-slot="dialog-trigger"
      className={cn("plush-focus-ring", className)}
      {...props}
    />
  )
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return (
    <DialogPrimitive.Close
      data-slot="dialog-close"
      className={cn("plush-focus-ring", className)}
      {...props}
    />
  )
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        // The dim: --plush-scrim (tokens.css). It sits on z-50 like the content; what opens later (a menu or tooltip from
        // inside the dialog, a nested dialog) lands above it by DOM order, toasts above everything (sonner's own layer).
        "fixed inset-0 isolate z-50 bg-(--plush-scrim)",
        "data-[state=open]:animate-[plush-fade-in_var(--plush-dur-fade)_var(--plush-ease-fade)]",
        "data-[state=closed]:animate-[plush-fade-out_var(--plush-dur-slow)_var(--plush-ease-fade)_both]",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  container,
  onInteractOutside,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  /** Optional element the portal renders into (default: document.body, as in the original). */
  container?: React.ComponentProps<typeof DialogPrimitive.Portal>["container"]
}) {
  return (
    <DialogPortal container={container}>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "plush-font plush-focus-ring fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-2*var(--plush-pad))] w-full max-w-[calc(100%-2*var(--plush-pad))] -translate-x-1/2 -translate-y-1/2 gap-3.5 rounded-(--plush-radius-sheet) bg-(--plush-surface) p-(--plush-pad) text-(length:--plush-text-md) leading-snug font-(--plush-weight-medium) break-words text-(--plush-ink) shadow-(--plush-card-shadow) sm:max-w-(--plush-w-dialog)",
          // Taller than the window: the sheet keeps a --plush-pad margin and its content scrolls. The parts start
          // --plush-slide lower, which would overflow a short sheet for a moment, so scrolling switches on once they are up
          // (no scrollbar flashing where scrollbars take room).
          "overflow-y-auto overscroll-contain starting:overflow-y-hidden",
          // Rise and fade in; drop and fade out (see top of file). The drop is left out with reduced motion.
          "starting:translate-y-1/2 [transition:translate_var(--plush-dur-soft)_var(--plush-ease-soft),overflow-y_0s_linear_calc(8*var(--plush-stagger))_allow-discrete]",
          "data-[state=open]:animate-[plush-fade-in_var(--plush-dur-fade)_var(--plush-ease-fade)]",
          "data-[state=closed]:pointer-events-none data-[state=closed]:animate-[plush-fade-out_var(--plush-dur-slow)_var(--plush-ease-fade)_both]",
          "motion-safe:data-[state=closed]:translate-y-1/2 data-[state=closed]:[transition:translate_var(--plush-dur-drop)_var(--plush-ease-drop)]",
          // The parts settle one after another.
          "*:min-w-0 *:not-data-[slot=dialog-close]:starting:translate-y-(--plush-slide) *:not-data-[slot=dialog-close]:starting:opacity-0",
          "*:not-data-[slot=dialog-close]:[transition:translate_var(--plush-dur-spring)_var(--plush-ease-spring)_calc((sibling-index()+.5)*var(--plush-stagger)),opacity_var(--plush-dur-fade)_var(--plush-ease-fade)_calc((sibling-index()+.5)*var(--plush-stagger))]",
          // Keep long titles clear of the close button.
          "[&:has(>[data-slot=dialog-close])>[data-slot=dialog-header]]:pr-10",
          className
        )}
        onInteractOutside={(event) => {
          onInteractOutside?.(event)
          // A toast lies above the dialog (sonner's layer): pressing it, its action or its close button keeps the dialog open.
          if (event.target instanceof Element && event.target.closest("[data-sonner-toaster]")) event.preventDefault()
        }}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            {/* Our grey round button (secondary), 32 px, its glyph grey until hovered; it grows a little under the pointer like every round icon button. */}
            <Button
              variant="secondary"
              size="icon-xs"
              className={cn(
                "absolute top-(--plush-pad) right-(--plush-pad) size-8 text-(--plush-ink-2) hover:text-(--plush-ink)",
                "starting:translate-y-(--plush-slide) starting:opacity-0",
                "[transition:translate_var(--plush-dur-spring)_var(--plush-ease-spring)_calc(1.5*var(--plush-stagger)),opacity_var(--plush-dur-fade)_var(--plush-ease-fade)_calc(1.5*var(--plush-stagger)),scale_var(--plush-dur-spring)_var(--plush-ease-spring),background-color_var(--plush-dur-fast)_var(--plush-ease-fade),color_var(--plush-dur-fast)_var(--plush-ease-fade)]"
              )}
            >
              <HugeiconsIcon icon={MultiplicationSignIcon} size={16} strokeWidth={2.4} aria-hidden className="size-4" />
              <span className="sr-only">Закрыть</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        // A button pair: side by side, sharing the width.
        "flex flex-col-reverse gap-3 *:min-w-0 sm:flex-row sm:justify-end sm:*:flex-1",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="secondary" size="sm" className="px-7">
            Close
          </Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        // 24 px lines with 4 px above and below: the first line sits centred on the 32 px close button.
        "py-1 text-(length:--plush-text-2xl) leading-6 font-(--plush-weight-semi) break-words text-(--plush-ink)",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-(length:--plush-text-md) leading-snug font-(--plush-weight-medium) break-words text-(--plush-ink-2) *:[a]:underline *:[a]:underline-offset-3 *:[a]:[transition:color_var(--plush-dur-fast)_var(--plush-ease-fade)] *:[a]:hover:text-(--plush-ink)",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
