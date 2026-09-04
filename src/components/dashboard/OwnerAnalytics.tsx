import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Truck, Search, Filter, AlertTriangle, Fuel, MapPin, Shield,
  TrendingUp, TrendingDown, BarChart3, Camera, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSimulation } from "@/contexts/SimulationContext";
import { TheftAlert, TheftAlertCard } from "@/components/dashboard/TheftAlertCard";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, PieChart, Pie, Cell
} from "recharts";

interface OwnerAnalyticsProps {
  theftAlerts: TheftAlert[];
  onAcknowledge: (id: string) => void;
  onResolve: (id: string, notes: string) => void;
  onNavigateToVehicle?: (vehicleId: string) => void;
}

export function OwnerAnalytics({ theftAlerts, onAcknowledge, onResolve, onNavigateToVehicle }: OwnerAnalyticsProps) {
  const { vehicleCards, fleetStats, isSimulating } = useSimulation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [resolveNotes, setResolveNotes] = useState<Record<string, string>>({});

  // Fleet table data
  const filteredVehicles = useMemo(() => {
    let filtered = vehicleCards;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(q) || v.plate.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter(v => v.status === statusFilter);
    }
    return filtered;
  }, [vehicleCards, searchQuery, statusFilter]);

  // Analytics mock data
  const theftTrendData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map(day => ({
      day,
      incidents: Math.floor(Math.random() * 5),
      fuelSaved: Math.round(Math.random() * 50 + 20),
    }));
  }, []);

  const incidentsByTruck = useMemo(() => {
    const counts: Record<string, number> = {};
    theftAlerts.forEach(a => {
      counts[a.vehicleName] = (counts[a.vehicleName] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name: name.split(" ").slice(0, 2).join(" "), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [theftAlerts]);

  const incidentTypeData = useMemo(() => {
    const counts = { fuel_theft: 0, unauthorized_access: 0, route_deviation: 0, tampering: 0 };
    theftAlerts.forEach(a => { counts[a.type]++; });
    return [
      { name: "Fuel Theft", value: counts.fuel_theft || 3, color: "hsl(var(--danger))" },
      { name: "Unauthorized", value: counts.unauthorized_access || 2, color: "hsl(var(--warning))" },
      { name: "Route Deviation", value: counts.route_deviation || 1, color: "hsl(var(--info))" },
      { name: "Tampering", value: counts.tampering || 1, color: "hsl(var(--primary))" },
    ];
  }, [theftAlerts]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-success text-success-foreground";
      case "idle": return "bg-warning text-warning-foreground";
      case "maintenance": return "bg-info text-info-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getLastAlert = (vehicleId: string) => {
    const alert = theftAlerts.find(a => a.vehicleId === vehicleId);
    return alert ? alert.title.split("—")[0].trim() : "No alerts";
  };

  const unresolved = theftAlerts.filter(a => !a.isAcknowledged);
  const resolved = theftAlerts.filter(a => a.isAcknowledged);

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-danger/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
            <div>
              <p className="text-2xl font-bold text-danger">{unresolved.length}</p>
              <p className="text-xs text-muted-foreground">Active Threats</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{resolved.length}</p>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Fuel className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">₹{Math.round(Math.random() * 15000 + 8000).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Fuel Savings (est.)</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center">
              <Camera className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{theftAlerts.length}</p>
              <p className="text-xs text-muted-foreground">Total Incidents</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="fleet" className="space-y-4">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="fleet">Fleet Overview</TabsTrigger>
          <TabsTrigger value="alerts">
            Live Alerts
            {unresolved.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-danger text-danger-foreground rounded-full">{unresolved.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Fleet Overview Table */}
        <TabsContent value="fleet">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search trucks..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-1">
                {["all", "active", "idle", "maintenance", "offline"].map(s => (
                  <Button key={s} size="sm" variant={statusFilter === s ? "default" : "secondary"} className="text-xs capitalize" onClick={() => setStatusFilter(s)}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Fuel Level</TableHead>
                  <TableHead>Last Alert</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Speed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map(v => (
                  <TableRow key={v.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => onNavigateToVehicle?.(v.id)}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{v.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{v.plate}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{v.driver}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-secondary overflow-hidden">
                          <div className={cn("h-full rounded-full", v.fuel > 50 ? "bg-success" : v.fuel > 25 ? "bg-warning" : "bg-danger")} style={{ width: `${v.fuel}%` }} />
                        </div>
                        <span className="text-xs font-mono">{v.fuel}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{getLastAlert(v.id)}</TableCell>
                    <TableCell>
                      <span className={cn("text-xs font-bold px-2 py-1 rounded-full capitalize", getStatusColor(v.status))}>
                        {v.status}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{v.speed} km/h</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Live Alert Feed */}
        <TabsContent value="alerts">
          <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin">
            {theftAlerts.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Shield className="w-12 h-12 text-success mx-auto mb-3" />
                <p className="text-lg font-semibold">All Clear</p>
                <p className="text-sm text-muted-foreground">No theft incidents detected</p>
              </div>
            ) : (
              theftAlerts.map((alert, i) => (
                <div key={alert.id}>
                  <TheftAlertCard alert={alert} index={i} onAcknowledge={onAcknowledge} />
                  {!alert.isAcknowledged && (
                    <div className="flex items-center gap-2 mt-2 ml-4">
                      <Input
                        placeholder="Resolution notes..."
                        value={resolveNotes[alert.id] || ""}
                        onChange={e => setResolveNotes(prev => ({ ...prev, [alert.id]: e.target.value }))}
                        className="text-xs h-7 max-w-xs"
                      />
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => {
                        onResolve(alert.id, resolveNotes[alert.id] || "Resolved");
                        setResolveNotes(prev => { const n = { ...prev }; delete n[alert.id]; return n; });
                      }}>
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Theft Trend */}
            <div className="glass-card p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Theft Incidents This Week
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={theftTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                    <Bar dataKey="incidents" fill="hsl(var(--danger))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Incident Types */}
            <div className="glass-card p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Incident Types
              </h3>
              <div className="h-48 flex items-center">
                <ResponsiveContainer width="60%" height="100%">
                  <PieChart>
                    <Pie data={incidentTypeData} cx="50%" cy="50%" outerRadius={70} dataKey="value" stroke="none">
                      {incidentTypeData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {incidentTypeData.map(d => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <span className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="font-bold ml-auto">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Trucks by Incidents */}
            <div className="glass-card p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" />
                Top Trucks by Incident Count
              </h3>
              <div className="space-y-3">
                {(incidentsByTruck.length > 0 ? incidentsByTruck : [
                  { name: "Tata Prima", count: 3 },
                  { name: "BharatBenz 4228R", count: 2 },
                  { name: "Ashok Leyland", count: 1 },
                ]).map((truck, i) => (
                  <div key={truck.name} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                    <span className="text-sm flex-1">{truck.name}</span>
                    <div className="w-24 h-2 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-danger rounded-full" style={{ width: `${(truck.count / Math.max(...(incidentsByTruck.length > 0 ? incidentsByTruck : [{ count: 3 }]).map(t => t.count))) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold">{truck.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fuel Savings */}
            <div className="glass-card p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Fuel className="w-4 h-4 text-success" />
                Estimated Fuel Savings
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={theftTrendData}>
                    <defs>
                      <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} unit="L" />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                    <Area type="monotone" dataKey="fuelSaved" stroke="hsl(var(--success))" fill="url(#fuelGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
