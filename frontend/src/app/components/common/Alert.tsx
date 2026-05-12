import { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  InfoIcon,
  AlertTriangle,
  X,
} from "lucide-react";
import { motion } from "motion/react";

interface AlertProps {
  type?: "info" | "success" | "warning" | "error";
  title?: string;
  message: string;
  icon?: ReactNode;
  onClose?: () => void;
  className?: string;
}

const alertConfig = {
  info: {
    bgColor: "bg-blue-50 border-blue-200",
    textColor: "text-blue-900",
    icon: <InfoIcon className="w-5 h-5 text-blue-500" />,
  },
  success: {
    bgColor: "bg-green-50 border-green-200",
    textColor: "text-green-900",
    icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
  },
  warning: {
    bgColor: "bg-yellow-50 border-yellow-200",
    textColor: "text-yellow-900",
    icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  },
  error: {
    bgColor: "bg-red-50 border-red-200",
    textColor: "text-red-900",
    icon: <AlertCircle className="w-5 h-5 text-red-500" />,
  },
};

export function Alert({
  type = "info",
  title,
  message,
  icon,
  onClose,
  className = "",
}: AlertProps) {
  const config = alertConfig[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-start gap-3 p-4 rounded-lg border ${config.bgColor} ${config.textColor} ${className}`}
    >
      <div className="flex-shrink-0 pt-0.5">{icon || config.icon}</div>
      <div className="flex-1">
        {title && <p className="font-semibold text-sm mb-1">{title}</p>}
        <p className="text-sm">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-current hover:opacity-70 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}
