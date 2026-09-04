import { Bell, Search, User, PanelLeftClose, PanelLeft, LogOut, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/hooks/useSidebar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, useCallback } from "react";
import { allNavItems } from "@/components/layout/MobileSidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ResponsiveHeaderProps {
  onNavigate: (view: string) => void;
}

export function ResponsiveHeader({ onNavigate }: ResponsiveHeaderProps) {
  const { isCollapsed, toggle, isMobile } = useSidebar();
  const { profile, role, signOut } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery("");
    }
  }, [searchOpen]);

  const filteredItems = searchQuery.trim()
    ? allNavItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allNavItems;

  const handleSearchSelect = useCallback((id: string) => {
    onNavigate(id);
    setSearchOpen(false);
    setSearchQuery("");
  }, [onNavigate]);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      <header className={cn(
        "sticky top-0 z-30 h-16 border-b border-border bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 flex items-center px-4 md:px-8 gap-4 transition-all duration-300",
        isMobile ? "ml-0" : (isCollapsed ? "ml-20" : "ml-64")
      )}>
        {/* Toggle button for desktop */}
        {!isMobile && (
          <Button variant="ghost" size="icon" onClick={toggle} className="shrink-0">
            {isCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </Button>
        )}

        {isMobile && <div className="w-10" />}

        {/* Search trigger - desktop */}
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden sm:flex flex-1 max-w-md items-center gap-2 h-9 px-3 rounded-lg border border-border bg-muted/40 text-muted-foreground text-sm hover:bg-muted hover:border-primary/40 transition-colors"
        >
          <Search className="w-4 h-4" />
          <span className="text-[13px]">Search fleet, drivers, pages…</span>
          <kbd className="ml-auto hidden md:inline-flex h-5 items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </button>

        {/* Search trigger - mobile */}
        <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setSearchOpen(true)}>
          <Search className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-2 md:gap-4 ml-auto">
          {/* Live indicator */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            <span className="text-muted-foreground font-medium">Live</span>
          </div>

          <ThemeToggle withLabel />

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => onNavigate("notifications")}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
          </Button>

          {/* Account dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 outline-none">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium">{profile?.full_name || "User"}</p>
                  <p className="text-xs text-muted-foreground capitalize">{role || "Fleet Manager"}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:ring-2 hover:ring-primary/50 transition-all">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{profile?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate("settings")}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate("notifications")}>
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Search overlay / command palette */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
          <div className="relative w-full max-w-lg mx-4 bg-popover border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center border-b border-border px-3">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pages, vehicles, drivers..."
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12"
              />
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => setSearchOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="max-h-72 overflow-y-auto p-2">
              {filteredItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No results found.</p>
              ) : (
                filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSearchSelect(item.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-accent transition-colors text-left"
                  >
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <span>{item.label}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
