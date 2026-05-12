import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "./utils";

/**
 * Badge Variants - Status indicators aligned with DESIGN.md
 * Includes status-specific variants for insurance contracts & payments
 */
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-pill border px-3 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-[color,background-color] overflow-hidden",
  {
    variants: {
      variant: {
        // Default - Brand Teal
        default:
          "border-transparent bg-brand-50 text-brand-700 [a&]:hover:bg-brand-100 font-semibold",

        // Secondary - Neutral Gray
        secondary:
          "border-transparent bg-neutral-100 text-neutral-700 [a&]:hover:bg-neutral-200",

        // Destructive - Red (for errors, cancellations)
        destructive:
          "border-transparent bg-red-100 text-red-800 [a&]:hover:bg-red-200 font-semibold",

        // Outline - Border only
        outline: "border-current text-foreground [a&]:hover:bg-neutral-50",

        // Success - Green (Active, Paid, Confirmed)
        success:
          "border-transparent bg-green-100 text-green-800 [a&]:hover:bg-green-200 font-semibold",

        // Warning - Amber (Pending, Expiring, Attention)
        warning:
          "border-transparent bg-amber-100 text-amber-900 [a&]:hover:bg-amber-200 font-semibold",

        // Info - Blue (Information, New)
        info: "border-transparent bg-info/10 text-info [a&]:hover:bg-info/20",

        // Pending - Yellow/Amber for approval
        pending:
          "border-transparent bg-amber-100 text-amber-900 [a&]:hover:bg-amber-200 font-semibold",

        // Expired - Gray/Slate
        expired:
          "border-transparent bg-neutral-200 text-neutral-700 [a&]:hover:bg-neutral-300",

        // Role-specific badges
        creator:
          "border-transparent bg-orange-100 text-orange-800 [a&]:hover:bg-orange-200 font-semibold",

        accountant:
          "border-transparent bg-purple-100 text-purple-800 [a&]:hover:bg-purple-200 font-semibold",

        supervisor:
          "border-transparent bg-indigo-100 text-indigo-800 [a&]:hover:bg-indigo-200 font-semibold",

        admin:
          "border-transparent bg-slate-200 text-slate-800 [a&]:hover:bg-slate-300 font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "info"
  | "pending"
  | "expired"
  | "creator"
  | "accountant"
  | "supervisor"
  | "admin";

interface BadgeProps extends React.ComponentProps<"span"> {
  variant?: BadgeVariant;
  asChild?: boolean;
}

function Badge({ className, variant, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
