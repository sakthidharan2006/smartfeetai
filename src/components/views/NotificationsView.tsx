import { useState } from "react";
import { Bell, Check, X, Settings, Filter, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NotificationItem {
  id: number;
  type: "alert" | "info" | "success";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const initialNotifications: NotificationItem[] = [
  { id: 1, type: "alert", title: "Low Tire Pressure Alert", description: "TRK-7834 front left tire at 28 PSI", time: "2 minutes ago", read: false },
  { id: 2, type: "alert", title: "Low Fuel Warning", description: "TRK-7834 fuel level at 18%", time: "5 minutes ago", read: false },
  { id: 3, type: "info", title: "Trip Completed", description: "TRK-2847 completed Mumbai to Pune route", time: "1 hour ago", read: false },
  { id: 4, type: "success", title: "Maintenance Complete", description: "TRK-4521 oil change completed successfully", time: "3 hours ago", read: true },
  { id: 5, type: "info", title: "Driver Check-in", description: "Suresh Kumar started shift at 06:30 AM", time: "6 hours ago", read: true },
];

type FilterKey = "all" | "unread" | "alert" | "info" | "success";

interface NotificationsViewProps {
  onNavigate?: (view: string) => void;
}

export function NotificationsView({ onNavigate }: NotificationsViewProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [filter, setFilter] = useState<FilterKey>("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const visible = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.type === filter;
  });

  const markAllRead = () => {
    if (unreadCount === 0) {
      toast.info("No unread notifications");
      return;
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success(`${unreadCount} notifications marked as read`);
  };

  const dismiss = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success("Notification dismissed");
  };

  const clearAll = () => {
    if (!notifications.length) {
      toast.info("Nothing to clear");
      return;
    }
    setNotifications([]);
    toast.success("All notifications cleared");
  };

  const toggleRead = (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight text-foreground">Notifications</h1>
          <p className="text-muted-foreground">{unreadCount} unread notifications</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={markAllRead}>
            <Check className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="secondary" size="sm" onClick={clearAll}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onNavigate?.("settings")}>
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </Button>
        </div>
      </div>

      {/* Notification List */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Recent Notifications</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                {filter === "all" ? "Filter" : `Filter: ${filter}`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Show</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
                <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="unread">Unread</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="alert">Alerts</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="info">Info</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="success">Completed</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="divide-y divide-border">
          {visible.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "p-4 hover:bg-secondary/20 transition-colors flex items-start gap-4",
                !notification.read && "bg-primary/5"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  notification.type === "alert"
                    ? "bg-danger/20"
                    : notification.type === "success"
                    ? "bg-success/20"
                    : "bg-info/20"
                )}
              >
                <Bell
                  className={cn(
                    "w-5 h-5",
                    notification.type === "alert"
                      ? "text-danger"
                      : notification.type === "success"
                      ? "text-success"
                      : "text-info"
                  )}
                />
              </div>
              <button
                type="button"
                onClick={() => toggleRead(notification.id)}
                className="flex-1 min-w-0 text-left"
              >
                <div className="flex items-center gap-2">
                  {!notification.read && <span className="w-2 h-2 rounded-full bg-primary" />}
                  <p className="font-medium">{notification.title}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{notification.description}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {notification.time}
                </p>
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                aria-label="Dismiss notification"
                onClick={() => dismiss(notification.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {visible.length === 0 && (
            <p className="p-8 text-center text-muted-foreground">No notifications to show</p>
          )}
        </div>
      </div>
    </div>
  );
}
