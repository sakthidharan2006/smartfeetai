import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  /** show the "Light"/"Dark" label from this breakpoint up */
  withLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ withLabel = false, className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Light mode" : "Dark mode";

  return (
    <Button
      variant="ghost"
      size={withLabel ? "sm" : "icon"}
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      title={label}
      className={cn(
        "relative shrink-0 rounded-full transition-colors",
        withLabel
          ? "h-9 gap-2 px-2 sm:px-3 rounded-lg"
          : "h-9 w-9 sm:h-10 sm:w-10",
        className
      )}
    >
      <span className="relative block h-[18px] w-[18px] sm:h-5 sm:w-5">
        <Sun
          className={cn(
            "absolute inset-0 h-full w-full transition-all duration-300 ease-out",
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"
          )}
        />
        <Moon
          className={cn(
            "absolute inset-0 h-full w-full transition-all duration-300 ease-out",
            isDark ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"
          )}
        />
      </span>
      {withLabel && (
        <span className="hidden text-sm font-medium sm:inline">{isDark ? "Light" : "Dark"}</span>
      )}
    </Button>
  );
}
