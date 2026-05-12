import { ReactNode } from "react";
import { Button } from "../ui/button";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-16 text-center ${className}`}
    >
      {icon && (
        <div className="mb-5 rounded-full bg-secondary p-5 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-xl font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mb-5 max-w-md text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-1 px-5">
          {action.label}
        </Button>
      )}
    </div>
  );
}
