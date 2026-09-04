import {
  Bot,
  Truck, 
  Gauge, 
  Fuel, 
  AlertTriangle, 
  MapPin, 
  Settings, 
  Users, 
  BarChart3,
  Bell,
  Video,
  Wrench,
  Route,
  Home,
  Package,
  Landmark,
  FileCheck,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
};

export const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "ai-intelligence", label: "Multi-Agent AI Ops", icon: Bot },
  { id: "fleet", label: "Fleet Overview", icon: Truck },
  { id: "tracking", label: "Live Tracking", icon: MapPin },
  { id: "routes", label: "Routes & Trips", icon: Route },
  { id: "diagnostics", label: "Diagnostics", icon: Gauge },
  { id: "fuel", label: "Fuel Monitor", icon: Fuel },
  { id: "loadhistory", label: "Load History", icon: Package },
  { id: "tollmanagement", label: "Toll Management", icon: Landmark },
  { id: "compliance", label: "Compliance", icon: FileCheck },
  { id: "cargodoor", label: "Cargo Door Security", icon: ShieldCheck },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
  { id: "cctv", label: "CCTV Feeds", icon: Video },
  { id: "alerts", label: "Alerts", icon: AlertTriangle },
  { id: "drivers", label: "Drivers", icon: Users },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  alertCount?: number;
}

export function Sidebar({ activeItem, onItemClick, alertCount = 3 }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src="/webwheels-logo.png" alt="SmartFleet AI" className="w-10 h-10 rounded-xl" />
          <div>
            <h1 className="font-bold text-lg text-foreground tracking-tight">SmartFleet AI</h1>
            <p className="text-xs text-muted-foreground font-medium">Intelligent Tracking</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto scrollbar-thin">
        <div className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={cn(
                "nav-link w-full",
                activeItem === item.id && "nav-link-active"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {item.id === "alerts" && alertCount > 0 && (
                <span className="ml-auto bg-danger text-danger-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                  {alertCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        <button 
          onClick={() => onItemClick("notifications")}
          className={cn("nav-link w-full", activeItem === "notifications" && "nav-link-active")}
        >
          <Bell className="w-5 h-5" />
          <span className="font-medium">Notifications</span>
          {alertCount > 0 && (
            <span className="ml-auto bg-danger text-danger-foreground text-xs font-bold px-2 py-0.5 rounded-full">
              {alertCount}
            </span>
          )}
        </button>
        <button 
          onClick={() => onItemClick("settings")}
          className={cn("nav-link w-full", activeItem === "settings" && "nav-link-active")}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </aside>
  );
}
