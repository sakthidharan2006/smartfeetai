import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "danger";
  delay?: number;
  /** Dense single-row presentation for command-center layouts */
  compact?: boolean;
}


const variantStyles = {
  default: "from-primary/20 to-primary/5 border-primary/20",
  success: "from-success/20 to-success/5 border-success/20",
  warning: "from-warning/20 to-warning/5 border-warning/20",
  danger: "from-danger/20 to-danger/5 border-danger/20",
};

const iconStyles = {
  default: "bg-primary/20 text-primary",
  success: "bg-success/20 text-success",
  warning: "bg-warning/20 text-warning",
  danger: "bg-danger/20 text-danger",
};

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  variant = "default",
  delay = 0,
  compact = false,
}: StatCardProps) {
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay }}
        className="glass-card px-3.5 py-3 flex items-center gap-3 min-w-0"
      >
        <div className={cn("shrink-0 p-2 rounded-lg", iconStyles[variant])}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="metric-label truncate">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-lg sm:text-xl font-semibold font-mono tabular-nums tracking-tight text-foreground leading-tight">
              {value}
            </p>
            {trend && (
              <span className={cn(
                "text-[11px] font-semibold",
                trend.isPositive ? "text-success" : "text-danger"
              )}>
                {trend.isPositive ? "↑" : "↓"}{Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "glass-card p-5 bg-gradient-to-br",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-xl", iconStyles[variant])}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
            trend.isPositive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
          )}>
            <span>{trend.isPositive ? "↑" : "↓"}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="metric-label">{title}</p>
        <p className="metric-value text-foreground">{value}</p>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </motion.div>

  );
}
