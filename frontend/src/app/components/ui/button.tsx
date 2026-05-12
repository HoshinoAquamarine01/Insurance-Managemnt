import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "./utils";

/**
 * Button Variants - Aligned with DESIGN.md system
 * Uses design system colors: Brand Teal (#0d9488), Error (#ef4444), etc.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-600 aria-invalid:ring-error/20 dark:aria-invalid:ring-error/40 aria-invalid:border-error min-h-[32px]",
  {
    variants: {
      variant: {
        // Primary - Brand Teal - Main actions
        default:
          "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-subtle hover:shadow-medium",

        // Destructive - Error Red - Delete, cancel, dangerous actions
        destructive:
          "bg-error text-white hover:bg-red-600 active:bg-red-700 focus-visible:ring-error/20 dark:focus-visible:ring-error/40",

        // Outline - Bordered - Secondary actions
        outline:
          "border-2 border-brand-600 text-brand-600 bg-white hover:bg-brand-50 active:bg-brand-100 dark:bg-white dark:border-brand-400 dark:text-brand-600 dark:hover:bg-brand-50",

        // Secondary - Ghost with background - Tertiary actions
        secondary:
          "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-600",

        // Ghost - No background - Links and subtle actions
        ghost:
          "text-brand-600 hover:bg-brand-50 active:bg-brand-100 dark:text-brand-400 dark:hover:bg-neutral-700",

        // Link - Underline only
        link: "text-brand-600 underline-offset-4 hover:underline dark:text-brand-400",

        // Success - Green - Positive confirmations
        success:
          "bg-success text-white hover:bg-green-600 active:bg-green-700 shadow-subtle hover:shadow-medium",

        // Warning - Amber - Caution actions
        warning:
          "bg-warning text-neutral-900 hover:bg-amber-500 active:bg-amber-600 shadow-subtle hover:shadow-medium",
      },
      size: {
        // Small - 28px height
        sm: "h-7 rounded-md gap-1.5 px-3 text-xs has-[>svg]:px-2.5 font-medium",

        // Default/Medium - 32px height
        default: "h-8 px-4 py-2 has-[>svg]:px-3 text-sm",

        // Large - 36px height
        lg: "h-9 rounded-md px-6 has-[>svg]:px-4 text-base",

        // Icon-only - 32px square
        icon: "size-8 rounded-md",

        // Icon Small - 28px square
        icon_sm: "size-7 rounded-md",

        // Icon Large - 40px square
        icon_lg: "size-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link"
  | "success"
  | "warning";

type ButtonSize = "default" | "sm" | "lg" | "icon" | "icon_sm" | "icon_lg";

interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant,
    size,
    asChild = false,
    isLoading = false,
    disabled,
    children,
    ...props
  },
  ref,
) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg
            className="animate-spin"
            width="16"
            height="16"
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              opacity="0.3"
            />
            <path
              d="M12 2a10 10 0 0110 10"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
          {children && <span>{children}</span>}
        </span>
      ) : (
        children
      )}
    </Comp>
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };
