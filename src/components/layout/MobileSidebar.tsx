import { 
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
  ShieldCheck,
  X,
  Menu,
  LogOut,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/hooks/useSidebar";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

export type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
};

export const allNavItems: NavItem[] = [
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

export const NAV_GROUPS: { label: string; ids: string[] }[] = [
  { label: "Operations", ids: ["dashboard", "ai-intelligence", "fleet", "tracking", "routes"] },
  { label: "Vehicle Health", ids: ["diagnostics", "fuel", "maintenance"] },
  { label: "Cargo & Compliance", ids: ["loadhistory", "tollmanagement", "compliance", "cargodoor"] },
  { label: "Security & People", ids: ["cctv", "alerts", "drivers", "reports"] },
];

// Driver-accessible views
const DRIVER_NAV_IDS = ['dashboard', 'ai-intelligence', 'tracking', 'routes', 'diagnostics', 'fuel', 'loadhistory', 'tollmanagement', 'compliance', 'cargodoor', 'cctv', 'alerts', 'drivers'];

interface MobileSidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  alertCount?: number;
}

export function MobileSidebar({ activeItem, onItemClick, alertCount = 3 }: MobileSidebarProps) {
  const { isOpen, close, toggle, isMobile, isCollapsed } = useSidebar();
  const { profile, role, signOut } = useAuth();

  const navItems = role === 'driver' 
    ? allNavItems.filter(item => DRIVER_NAV_IDS.includes(item.id))
    : allNavItems;

  const groupedNav = NAV_GROUPS.map((group) => ({
    label: group.label,
    items: group.ids
      .map((id) => navItems.find((item) => item.id === id))
      .filter((item): item is NavItem => Boolean(item)),
  })).filter((group) => group.items.length > 0);

  const handleItemClick = (item: string) => {
    onItemClick(item);
    if (isMobile) {
      close();
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Mobile overlay sidebar
  if (isMobile) {
    return (
      <>
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 lg:hidden"
          onClick={toggle}
        >
          <Menu className="w-6 h-6" />
        </Button>

        {/* Overlay */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
              onClick={close}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <AnimatePresence>
          {isOpen && (
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-screen w-72 bg-sidebar border-r border-sidebar-border flex flex-col z-50"
            >
              {/* Logo */}
              <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="/webwheels-logo.png" alt="SmartFleet AI" className="w-10 h-10 rounded-xl" />
                  <div>
                    <h1 className="font-display font-semibold text-lg text-sidebar-foreground tracking-tight">SmartFleet AI</h1>
                    <p className="text-xs text-sidebar-foreground/60 font-medium">Intelligent Tracking</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={close}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* User info */}
              {profile && (
                <div className="p-4 border-b border-sidebar-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
                      <Users className="w-5 h-5 text-sidebar-foreground/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{profile.full_name}</p>
                      <p className="text-xs text-sidebar-foreground/60 capitalize">{role}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <nav className="flex-1 px-3 pb-4 overflow-y-auto scrollbar-thin">
                {groupedNav.map((group) => (
                  <div key={group.label}>
                    <p className="nav-group-label">{group.label}</p>
                    <div className="space-y-1">
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item.id)}
                          className={cn(
                            "nav-link w-full touch-manipulation",
                            activeItem === item.id && "nav-link-active"
                          )}
                        >
                          <item.icon className="w-[18px] h-[18px]" />
                          <span className="font-medium">{item.label}</span>
                          {item.id === "alerts" && alertCount > 0 && (
                            <span className="ml-auto bg-danger text-danger-foreground text-[11px] font-bold px-2 py-0.5 rounded-full">
                              {alertCount}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>

              {/* Bottom Actions */}
              <div className="p-4 border-t border-sidebar-border space-y-1">
                <button 
                  onClick={() => handleItemClick("notifications")}
                  className={cn("nav-link w-full touch-manipulation", activeItem === "notifications" && "nav-link-active")}
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
                  onClick={() => handleItemClick("settings")}
                  className={cn("nav-link w-full touch-manipulation", activeItem === "settings" && "nav-link-active")}
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Settings</span>
                </button>
                <button 
                  onClick={handleSignOut}
                  className="nav-link w-full touch-manipulation !text-danger hover:bg-danger/10"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop sidebar (collapsible)
  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-50 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn("border-b border-sidebar-border", isCollapsed ? "p-4" : "px-5 py-6")}>
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <img src="/webwheels-logo.png" alt="SmartFleet AI" className="w-10 h-10 rounded-xl shrink-0" />
          {!isCollapsed && (
            <div>
              <h1 className="font-display font-bold text-lg text-sidebar-foreground tracking-tight">SmartFleet AI</h1>
              <p className="text-[11px] uppercase tracking-[0.16em] text-sidebar-foreground/45 font-semibold">Fleet Console</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 overflow-y-auto scrollbar-thin pb-4", isCollapsed ? "px-2 pt-3" : "px-3")}>
        {groupedNav.map((group) => (
          <div key={group.label}>
            {isCollapsed ? (
              <div className="my-3 mx-2 h-px bg-sidebar-border" />
            ) : (
              <p className="nav-group-label">{group.label}</p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={cn(
                    "nav-link w-full",
                    isCollapsed && "justify-center px-2",
                    activeItem === item.id && "nav-link-active"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="w-[18px] h-[18px] shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="font-medium">{item.label}</span>
                      {item.id === "alerts" && alertCount > 0 && (
                        <span className="ml-auto bg-danger text-danger-foreground text-[11px] font-bold px-2 py-0.5 rounded-full">
                          {alertCount}
                        </span>
                      )}
                    </>
                  )}
                  {isCollapsed && item.id === "alerts" && alertCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        <button 
          onClick={() => handleItemClick("notifications")}
          className={cn(
            "nav-link w-full relative",
            isCollapsed && "justify-center px-2",
            activeItem === "notifications" && "nav-link-active"
          )}
          title={isCollapsed ? "Notifications" : undefined}
        >
          <Bell className="w-5 h-5 shrink-0" />
          {!isCollapsed && (
            <>
              <span className="font-medium">Notifications</span>
              {alertCount > 0 && (
                <span className="ml-auto bg-danger text-danger-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                  {alertCount}
                </span>
              )}
            </>
          )}
        </button>
        <button 
          onClick={() => handleItemClick("settings")}
          className={cn(
            "nav-link w-full",
            isCollapsed && "justify-center px-2",
            activeItem === "settings" && "nav-link-active"
          )}
          title={isCollapsed ? "Settings" : undefined}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="font-medium">Settings</span>}
        </button>
        <button 
          onClick={handleSignOut}
          className={cn(
            "nav-link w-full !text-danger hover:bg-danger/10",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? "Sign Out" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
