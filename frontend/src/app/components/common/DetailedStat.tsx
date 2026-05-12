import { ReactNode } from "react";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface DetailedStatProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  accentColor?: string;
  className?: string;
}

export function DetailedStat({
  label,
  value,
  subtext,
  icon,
  trend,
  accentColor = "from-blue-500/20 to-transparent",
  className = "",
}: DetailedStatProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative overflow-hidden rounded-lg border border-border/50 bg-gradient-to-br ${accentColor} p-6 ${className}`}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-current/5 to-transparent -mr-10 -mt-10" />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium mb-2">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="font-display text-3xl font-semibold tracking-tight">
              {value}
            </p>
            {trend && (
              <div
                className={`flex items-center gap-1 text-xs font-semibold ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>
                  {trend.isPositive ? "+" : ""}
                  {trend.value}%
                </span>
                {trend.label && (
                  <span className="text-muted-foreground">{trend.label}</span>
                )}
              </div>
            )}
          </div>
          {subtext && (
            <p className="text-xs text-muted-foreground mt-2">{subtext}</p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 ml-4 p-3 rounded-lg bg-current/5">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
