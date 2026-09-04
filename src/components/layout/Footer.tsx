import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn("py-4 px-4 md:px-6 border-t border-border", className)}>
      <p className="text-center text-sm text-muted-foreground">
        All Rights Reserved{" "}
        <span className="font-bold text-primary">Tekvibe Solutions Ltd</span>{" "}
        2026
      </p>
    </footer>
  );
}
