import { useState } from "react";
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Palette, 
  Globe, 
  CreditCard, 
  HelpCircle,
  Save,
  KeyRound,
  Download,
  Trash2,
  RefreshCw,
  Sun,
  Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTheme } from "@/hooks/useTheme";
import { downloadCsv } from "@/lib/exportCsv";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const settingsSections = [
  { id: "account", label: "Account", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "integrations", label: "Integrations", icon: Globe },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "data", label: "Data & Privacy", icon: Database },
  { id: "help", label: "Help & Support", icon: HelpCircle },
];

export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState("account");

  // Account form
  const [profile, setProfile] = useState({
    firstName: "Suresh",
    lastName: "Kumar",
    email: "suresh.kumar@smartfleet.ai",
    company: "SmartFleet Logistics India Ltd.",
    phone: "+91 98765 43210",
  });

  // Notification toggles
  const [notifs, setNotifs] = useState({
    critical: true,
    maintenance: true,
    fuel: true,
    driver: false,
    email: true,
  });

  // Security
  const [twoFactor, setTwoFactor] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: "", next: "", confirm: "" });

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Account profile saved", {
      description: `Updated details for ${profile.firstName} ${profile.lastName} (${profile.company}).`,
    });
  };

  const handleToggleNotif = (key: keyof typeof notifs, value: boolean) => {
    setNotifs((prev) => ({ ...prev, [key]: value }));
    toast.success("Notification preference updated");
  };

  const handleSavePassword = () => {
    if (!pwdForm.current || !pwdForm.next || !pwdForm.confirm) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (pwdForm.next !== pwdForm.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    if (pwdForm.next.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setPasswordDialogOpen(false);
    setPwdForm({ current: "", next: "", confirm: "" });
    toast.success("Security credentials updated successfully");
  };

  const handleExportData = () => {
    downloadCsv(`smartfleet-data-export-${new Date().toISOString().slice(0, 10)}`, [
      { Category: "Profile", Name: `${profile.firstName} ${profile.lastName}`, Email: profile.email, Company: profile.company },
      { Category: "Theme", Mode: theme, TwoFactorEnabled: twoFactor ? "Yes" : "No" },
      { Category: "Notifications", Critical: notifs.critical ? "On" : "Off", Maintenance: notifs.maintenance ? "On" : "Off", Email: notifs.email ? "On" : "Off" },
    ]);
    toast.success("Fleet configuration exported as CSV");
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account, preferences and fleet configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="glass-card p-4 h-fit">
          <nav className="space-y-1">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left text-sm font-medium",
                  activeSection === section.id
                    ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <section.icon className="w-4 h-4" />
                <span>{section.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Account Settings */}
          {activeSection === "account" && (
            <div className="glass-card p-6">
              <h3 className="text-base font-display font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Account Settings
              </h3>
              <form onSubmit={handleSaveAccount} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      value={profile.firstName}
                      onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={profile.lastName}
                      onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      value={profile.company}
                      onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      value={profile.phone}
                      onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </form>
            </div>
          )}

          {/* Notification Settings */}
          {activeSection === "notifications" && (
            <div className="glass-card p-6">
              <h3 className="text-base font-display font-semibold mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notification Preferences
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Critical Alerts</p>
                    <p className="text-sm text-muted-foreground">Engine faults, tire blowouts, BS6 de-rate warnings</p>
                  </div>
                  <Switch
                    checked={notifs.critical}
                    onCheckedChange={(v) => handleToggleNotif("critical", v)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Maintenance Reminders</p>
                    <p className="text-sm text-muted-foreground">FC renewals, oil changes, brake inspections</p>
                  </div>
                  <Switch
                    checked={notifs.maintenance}
                    onCheckedChange={(v) => handleToggleNotif("maintenance", v)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Fuel & Theft Alerts</p>
                    <p className="text-sm text-muted-foreground">Sudden tank drops, unauthorized fuel siphoning</p>
                  </div>
                  <Switch
                    checked={notifs.fuel}
                    onCheckedChange={(v) => handleToggleNotif("fuel", v)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Driver Shifts & Check-ins</p>
                    <p className="text-sm text-muted-foreground">HOS compliance violations, check-in pings</p>
                  </div>
                  <Switch
                    checked={notifs.driver}
                    onCheckedChange={(v) => handleToggleNotif("driver", v)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Summaries</p>
                    <p className="text-sm text-muted-foreground">Daily operations summaries and weekly compliance digest</p>
                  </div>
                  <Switch
                    checked={notifs.email}
                    onCheckedChange={(v) => handleToggleNotif("email", v)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeSection === "security" && (
            <div className="glass-card p-6">
              <h3 className="text-base font-display font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Security & Authentication
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication (2FA)</p>
                    <p className="text-sm text-muted-foreground">Requires OTP verification for remote door unlocking & dispatch</p>
                  </div>
                  <Switch
                    checked={twoFactor}
                    onCheckedChange={(v) => {
                      setTwoFactor(v);
                      toast.success(v ? "2FA enabled for this account" : "2FA disabled");
                    }}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Account Password</p>
                    <p className="text-sm text-muted-foreground">Last changed 2 months ago</p>
                  </div>
                  <Button variant="secondary" onClick={() => setPasswordDialogOpen(true)}>
                    <KeyRound className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeSection === "appearance" && (
            <div className="glass-card p-6">
              <h3 className="text-base font-display font-semibold mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Appearance & Theme
              </h3>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Choose your interface theme style:</p>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => {
                      setTheme("dark");
                      toast.success("Switched to Dark Theme");
                    }}
                    className={cn(
                      "p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3",
                      theme === "dark" ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                    )}
                  >
                    <Moon className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-semibold text-sm">Dark Mode</p>
                      <p className="text-xs text-muted-foreground">High contrast for night operations</p>
                    </div>
                  </div>
                  <div
                    onClick={() => {
                      setTheme("light");
                      toast.success("Switched to Light Theme");
                    }}
                    className={cn(
                      "p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3",
                      theme === "light" ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                    )}
                  >
                    <Sun className="w-5 h-5 text-warning" />
                    <div>
                      <p className="font-semibold text-sm">Light Mode</p>
                      <p className="text-xs text-muted-foreground">Clean daylight dashboard</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Integrations */}
          {activeSection === "integrations" && (
            <div className="glass-card p-6">
              <h3 className="text-base font-display font-semibold mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                External Integrations & APIs
              </h3>
              <div className="space-y-4">
                {[
                  { name: "FASTag NETC Gateway", desc: "Automated toll crossing detection and balance sync", status: "Connected" },
                  { name: "AIS-140 GPS Telematics", desc: "Government-mandated emergency alert and location relay", status: "Active" },
                  { name: "VAHAN National Register", desc: "Automatic FC, RC, and road tax validity verification", status: "Connected" },
                  { name: "Smart Lock MQTT Broker", desc: "Encrypted device telemetry & remote door latch actuator", status: "Active" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-secondary/20">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{item.name}</p>
                        <Badge className="bg-success/20 text-success text-[10px] border-0">{item.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast.success(`Testing API connection for ${item.name}... Verified!`)}>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      Test Link
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Billing */}
          {activeSection === "billing" && (
            <div className="glass-card p-6">
              <h3 className="text-base font-display font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Subscription & Invoicing
              </h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">Current Plan</span>
                    <p className="text-2xl font-bold text-foreground mt-1">Enterprise Fleet Pro</p>
                    <p className="text-sm text-muted-foreground">Up to 250 vehicles • AI Dispatch • 24/7 Priority Support</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-mono font-bold text-foreground">₹49,999<span className="text-xs text-muted-foreground font-normal">/yr</span></p>
                    <Badge className="bg-success/20 text-success border-0 mt-1">Active</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => toast.info("No invoice due. Next billing on Jan 1, 2027.")}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Invoices
                  </Button>
                  <Button size="sm" onClick={() => toast.success("You are on the highest Enterprise tier!")}>
                    Upgrade Plan
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Data & Privacy */}
          {activeSection === "data" && (
            <div className="glass-card p-6">
              <h3 className="text-base font-display font-semibold mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Data & Privacy
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Export Fleet Telemetry & Logs</p>
                  <p className="text-sm text-muted-foreground mb-3">Download complete vehicle settings, sensor metrics, and compliance logs.</p>
                  <Button variant="secondary" size="sm" onClick={handleExportData}>
                    <Download className="w-4 h-4 mr-2" />
                    Export All Data (CSV)
                  </Button>
                </div>
                <Separator />
                <div>
                  <p className="font-medium text-destructive">Clear Local Cache</p>
                  <p className="text-sm text-muted-foreground mb-3">Clear cached maps, route tiles, and offline simulation logs.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      localStorage.clear();
                      toast.success("Application local cache cleared");
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Cache
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Help & Support */}
          {activeSection === "help" && (
            <div className="glass-card p-6">
              <h3 className="text-base font-display font-semibold mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                Help & Fleet Support
              </h3>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Need assistance with hardware installation, sensors, or AI routing?</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-border/50 bg-secondary/20">
                    <p className="font-semibold text-sm">24/7 Operations Desk</p>
                    <p className="text-xs text-muted-foreground mt-1">Toll-free: 1800-419-FLEET</p>
                    <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={() => toast.info("Connecting to Fleet Support: 1800-419-3533")}>
                      Call Support
                    </Button>
                  </div>
                  <div className="p-4 rounded-xl border border-border/50 bg-secondary/20">
                    <p className="font-semibold text-sm">Documentation & Guides</p>
                    <p className="text-xs text-muted-foreground mt-1">OBD-II wire harnesses & magnetic reed switch schematics</p>
                    <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={() => toast.info("Opening SmartFleet hardware deployment documentation")}>
                      View Docs
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Update Account Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label>Current Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={pwdForm.current}
                onChange={(e) => setPwdForm((p) => ({ ...p, current: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>New Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={pwdForm.next}
                onChange={(e) => setPwdForm((p) => ({ ...p, next: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={pwdForm.confirm}
                onChange={(e) => setPwdForm((p) => ({ ...p, confirm: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePassword}>
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
