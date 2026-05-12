import * as React from "react";

import { cn } from "./utils";

/**
 * Card Component - Follows DESIGN.md system
 * Uses design system colors and spacing tokens
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col gap-6 rounded-lg border transition-all duration-200",
        "bg-[var(--color-background)] text-[var(--color-foreground)] border-[var(--color-border)] shadow-[var(--shadow-subtle)]",
        "hover:shadow-[var(--shadow-medium)]",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5",
        "px-[var(--spacing-lg)] pt-[var(--spacing-lg)]",
        "has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-[var(--spacing-lg)]",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <h4
      data-slot="card-title"
      className={cn(
        "text-h3 leading-none font-semibold",
        "text-[var(--color-neutral-900)]",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <p
      data-slot="card-description"
      className={cn(
        "text-sm leading-relaxed",
        "text-[var(--color-neutral-500)]",
        className,
      )}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        "px-[var(--spacing-lg)]",
        "[&:last-child]:pb-[var(--spacing-lg)]",
        className,
      )}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center justify-between gap-[var(--spacing-md)]",
        "px-[var(--spacing-lg)] pb-[var(--spacing-lg)]",
        "[.border-t]:pt-[var(--spacing-lg)]",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
