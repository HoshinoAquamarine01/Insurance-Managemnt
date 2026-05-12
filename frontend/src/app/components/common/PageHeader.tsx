import { ReactNode } from "react";
import { motion } from "motion/react";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({
  title,
  description,
  children,
  action,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-6"
    >
      <div className="flex-1 space-y-2">
        <h1
          className="font-display text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl"
          style={{ letterSpacing: "-0.02em" }}
        >
          {title}
        </h1>
        {description && (
          <p className="max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2 md:mt-0">{action}</div>}
      {children}
    </motion.div>
  );
}
