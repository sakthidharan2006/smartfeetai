import { BarChart3, Download, Calendar, TrendingUp, Fuel, DollarSign, Clock, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { downloadCsv } from "@/lib/exportCsv";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const monthlyData = [
  { month: "Jan", miles: 45000, fuel: 3200, cost: 12500 },
  { month: "Feb", miles: 48000, fuel: 3400, cost: 13200 },
  { month: "Mar", miles: 52000, fuel: 3600, cost: 14100 },
  { month: "Apr", miles: 49000, fuel: 3300, cost: 13600 },
  { month: "May", miles: 55000, fuel: 3800, cost: 15200 },
  { month: "Jun", miles: 58000, fuel: 4000, cost: 16000 },
];

const vehicleUtilization = [
  { name: "Active", value: 75 },
  { name: "Idle", value: 15 },
  { name: "Maintenance", value: 10 },
];

const COLORS = ["hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--info))"];

const efficiencyTrend = [
  { week: "W1", efficiency: 6.8 },
  { week: "W2", efficiency: 7.1 },
  { week: "W3", efficiency: 6.9 },
  { week: "W4", efficiency: 7.3 },
  { week: "W5", efficiency: 7.5 },
  { week: "W6", efficiency: 7.2 },
];

const RANGES = ["Last 7 days", "Last 30 days", "Last 6 months", "Year to date"];

export function ReportsView() {
  const [range, setRange] = useState(RANGES[1]);

  const handleExport = () => {
    const ok = downloadCsv(`fleet-report-${new Date().toISOString().slice(0, 10)}`, monthlyData);
    toast[ok ? "success" : "error"](ok ? `Report exported (${range})` : "Nothing to export");
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive fleet performance insights</p>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                {range}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {RANGES.map((r) => (
                <DropdownMenuItem key={r} onClick={() => { setRange(r); toast.info(`Showing ${r.toLowerCase()}`); }}>
                  {r}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Truck className="w-4 h-4" />
            <span className="text-sm">Total Miles</span>
          </div>
          <p className="text-2xl font-bold">307,000</p>
          <p className="text-sm text-success flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +12% vs last month
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Fuel className="w-4 h-4" />
            <span className="text-sm">Fuel Consumed</span>
          </div>
          <p className="text-2xl font-bold">21,300 gal</p>
          <p className="text-sm text-success flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> 7.2 mpg avg
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Operating Cost</span>
          </div>
          <p className="text-2xl font-bold">$84,600</p>
          <p className="text-sm text-muted-foreground">$0.28 per mile</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Uptime</span>
          </div>
          <p className="text-2xl font-bold">96.8%</p>
          <p className="text-sm text-success flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +2.1% improvement
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Monthly Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="milesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="miles" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#milesGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vehicle Utilization */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Vehicle Utilization</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehicleUtilization}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {vehicleUtilization.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {vehicleUtilization.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="text-sm text-muted-foreground">{item.name}: {item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fuel Efficiency Trend */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Fuel Efficiency Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={efficiencyTrend}>
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} domain={[6, 8]} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="efficiency" stroke="hsl(var(--success))" strokeWidth={3} dot={{ fill: 'hsl(var(--success))', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Monthly Costs</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
