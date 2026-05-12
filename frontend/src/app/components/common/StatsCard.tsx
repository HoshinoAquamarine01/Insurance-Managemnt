import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader } from "../ui/card";
import { motion } from "motion/react";

interface StatsCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon: ReactNode;
  bgColor?: string;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive?: boolean;
  };
  className?: string;
}

export function StatsCard({
  label,
  value,
  description,
  icon,
  bgColor = "bg-secondary",
  iconColor = "text-primary",
  trend,
  className = "",
}: StatsCardProps) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card
        className={`relative overflow-hidden rounded-3xl border-border/70 shadow-sm transition-shadow hover:shadow-lg ${className}`}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-3 pt-6">
          <CardDescription className="text-sm font-medium md:text-base">
            {label}
          </CardDescription>
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${bgColor}`}
          >
            <div className={`h-5 w-5 ${iconColor}`}>{icon}</div>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="flex items-end gap-2">
            <div
              className="font-display text-3xl font-semibold md:text-4xl"
              style={{ letterSpacing: "-0.01em" }}
            >
              {value}
            </div>
            {trend && (
              <div
                className={`text-xs font-medium pb-1 ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </div>
            )}
          </div>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
