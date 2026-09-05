import { Route, Clock, MapPin, ChevronRight, Calendar, Play, CheckCircle, Sparkles, CloudRain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSimulation } from "@/contexts/SimulationContext";
import { useState } from "react";
import { QuickFormDialog } from "@/components/common/QuickFormDialog";
import { AIRouteOptimizer } from "@/components/routing/AIRouteOptimizer";
import { WeatherHazardRadarPanel } from "@/components/routing/WeatherHazardRadarPanel";
import { RouteOption } from "@/lib/routeIntelligence";

export function RoutesView() {
  const { vehicleCards, isDriver } = useSimulation();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [tripOpen, setTripOpen] = useState(false);
  const [adoptedTrips, setAdoptedTrips] = useState<{
    id: string;
    from: string;
    to: string;
    vehicle: string;
    driver: string;
    status: string;
    progress: number;
    distance: string;
    eta: string;
    startTime: string;
  }[]>([]);
  const [corridorSource, setCorridorSource] = useState("Mumbai, Maharashtra");
  const [corridorDest, setCorridorDest] = useState("Pune, Maharashtra");

  // Generate trips from simulation vehicles
  const indianRoutes = [
    { from: 'Mumbai', to: 'Pune', distance: '150 km', eta: '2h 45m' },
    { from: 'Ahmedabad', to: 'Surat', distance: '265 km', eta: '4h 10m' },
    { from: 'Jaipur', to: 'Delhi', distance: '281 km', eta: '4h 30m' },
    { from: 'Bengaluru', to: 'Chennai', distance: '346 km', eta: '5h 20m' },
    { from: 'Chennai', to: 'Hyderabad', distance: '630 km', eta: '9h 15m' },
    { from: 'Delhi', to: 'Gurugram', distance: '32 km', eta: '45m' },
  ];

  const baseTrips = vehicleCards.map((v, i) => {
    const route = indianRoutes[i % indianRoutes.length];
    const isActive = v.status === 'active';
    const isMaintenance = v.status === 'maintenance';
    return {
      id: v.id,
      from: route.from,
      to: route.to,
      vehicle: `${v.name} (${v.plate})`,
      driver: 'Assigned Driver',
      status: isActive ? 'in-progress' : isMaintenance ? 'scheduled' : 'completed',
      progress: isActive ? Math.min(95, Math.max(10, v.speed + 20)) : isMaintenance ? 0 : 100,
      distance: route.distance,
      eta: isActive ? route.eta : isMaintenance ? '—' : 'Completed',
      startTime: isActive ? 'Today 06:30 AM' : isMaintenance ? 'Tomorrow 05:00 AM' : 'Yesterday',
    };
  });

  const trips = [...adoptedTrips, ...baseTrips];

  const handleAdoptRoute = (route: RouteOption, src: string, dest: string) => {
    const newTrip = {
      id: `TRIP-AI-${Date.now().toString().slice(-4)}`,
      from: src.split(",")[0],
      to: dest.split(",")[0],
      vehicle: "Tata Prima 4928.S (MH-12-AB-1234)",
      driver: "Suresh Kumar",
      status: "in-progress",
      progress: 15,
      distance: `${route.distanceKm} km`,
      eta: route.formattedDuration,
      startTime: "Just Now (AI Dispatched)",
    };
    setAdoptedTrips((prev) => [newTrip, ...prev]);
  };

  const activeTrips = trips.filter(t => t.status === 'in-progress').length;
  const completedTrips = trips.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight text-foreground">
            {isDriver ? 'My Trips' : 'Routes & Trips'}
          </h1>
          <p className="text-muted-foreground">
            {isDriver ? 'Your scheduled and active trips' : 'Manage and track all scheduled and active trips'}
          </p>
        </div>
        {!isDriver && (
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => setScheduleOpen(true)}>
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </Button>
            <Button size="sm" onClick={() => setTripOpen(true)}>
              <Route className="w-4 h-4 mr-2" />
              New Trip
            </Button>
          </div>
        )}
      </div>

      <QuickFormDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        title="Schedule Trip"
        description="Plan a future trip for a vehicle."
        submitLabel="Schedule Trip"
        successMessage={(v) => `Trip scheduled${v.date ? ` for ${v.date}` : ""}`}
        onSubmit={(v) => {
          const newTrip = {
            id: `SCH-${Date.now().toString().slice(-4)}`,
            from: v.origin || "Mumbai",
            to: v.destination || "Pune",
            vehicle: v.vehicle || "Tata Prima (MH-12-AB-1234)",
            driver: "Assigned Driver",
            status: "scheduled",
            progress: 0,
            distance: "180 km",
            eta: v.date || "Scheduled",
            startTime: v.date ? `Scheduled for ${v.date}` : "Upcoming",
          };
          setAdoptedTrips(prev => [newTrip, ...prev]);
        }}
        fields={[
          { name: "vehicle", label: "Vehicle", placeholder: "MH-12-AB-1234", required: true },
          { name: "date", label: "Date", type: "date", required: true },
          { name: "origin", label: "Origin", placeholder: "Mumbai" },
          { name: "destination", label: "Destination", placeholder: "Pune" },
        ]}
      />
      <QuickFormDialog
        open={tripOpen}
        onOpenChange={setTripOpen}
        title="New Trip"
        submitLabel="Create Trip"
        successMessage={(v) => `Trip created: ${v.origin || "?"} to ${v.destination || "?"}`}
        onSubmit={(v) => {
          const newTrip = {
            id: `TRIP-${Date.now().toString().slice(-4)}`,
            from: v.origin || "Mumbai",
            to: v.destination || "Pune",
            vehicle: v.vehicle || "Tata Prima (MH-12-AB-1234)",
            driver: v.driver || "Suresh Kumar",
            status: "in-progress",
            progress: 10,
            distance: "210 km",
            eta: "3h 30m",
            startTime: "Just Now",
          };
          setAdoptedTrips(prev => [newTrip, ...prev]);
        }}
        fields={[
          { name: "vehicle", label: "Vehicle", placeholder: "MH-12-AB-1234", required: true },
          { name: "driver", label: "Driver", placeholder: "Suresh Kumar" },
          { name: "origin", label: "Origin", placeholder: "Mumbai", required: true },
          { name: "destination", label: "Destination", placeholder: "Pune", required: true },
          { name: "cargo", label: "Cargo", placeholder: "Steel coils - 24 t" },
        ]}
      />

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="optimizer" className="space-y-5">
        <TabsList className="bg-secondary/40 border border-border p-1">
          <TabsTrigger value="optimizer" className="text-xs flex items-center gap-1.5 px-3">
            <Route className="w-3.5 h-3.5" /> AI Route Optimizer & Map
          </TabsTrigger>
          <TabsTrigger value="weather-radar" className="text-xs flex items-center gap-1.5 px-3">
            <CloudRain className="w-3.5 h-3.5 text-sky-400" /> Weather & Road Hazards Radar
          </TabsTrigger>
          <TabsTrigger value="trips" className="text-xs flex items-center gap-1.5 px-3">
            <Clock className="w-3.5 h-3.5" /> Scheduled & Active Trips ({trips.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: AI Route Optimizer */}
        <TabsContent value="optimizer" className="space-y-6 mt-0">
          <AIRouteOptimizer
            initialSource={corridorSource}
            initialDestination={corridorDest}
            onCorridorChange={(s, d) => {
              setCorridorSource(s);
              setCorridorDest(d);
            }}
            onSelectRoute={handleAdoptRoute}
            canDispatch={!isDriver}
          />
        </TabsContent>

        {/* Tab 2: Weather & Hazards Radar */}
        <TabsContent value="weather-radar" className="space-y-4 mt-0">
          <WeatherHazardRadarPanel
            source={corridorSource}
            destination={corridorDest}
            onCorridorChange={(s, d) => {
              setCorridorSource(s);
              setCorridorDest(d);
            }}
          />
        </TabsContent>

        {/* Tab 3: Active & Scheduled Trips */}
        <TabsContent value="trips" className="space-y-6 mt-0">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Active Trips</p>
              <p className="text-3xl font-bold text-primary">{activeTrips}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Scheduled Today</p>
              <p className="text-3xl font-bold">{trips.length}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Completed Today</p>
              <p className="text-3xl font-bold text-success">{completedTrips}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Distance</p>
              <p className="text-3xl font-bold">1,840 km</p>
            </div>
          </div>

          {/* Trips List */}
          <div className="space-y-4">
            {trips.map((trip) => (
              <div 
                key={trip.id} 
                className="glass-card p-5 hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => {
                  toast.info(`Trip: ${trip.from} → ${trip.to}`, {
                    description: `Vehicle: ${trip.vehicle} • Status: ${trip.status} • Distance: ${trip.distance} • ETA: ${trip.eta}`,
                  });
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      trip.status === "in-progress" ? "bg-primary/20" :
                      trip.status === "completed" ? "bg-success/20" : "bg-secondary"
                    }`}>
                      {trip.status === "completed" ? (
                        <CheckCircle className="w-6 h-6 text-success" />
                      ) : trip.status === "in-progress" ? (
                        <Play className="w-6 h-6 text-primary" />
                      ) : (
                        <Clock className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-lg font-semibold">
                        <span>{trip.from}</span>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        <span>{trip.to}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{trip.vehicle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{trip.startTime}</p>
                    <p className="font-mono font-bold">{trip.distance}</p>
                  </div>
                </div>
                
                {trip.status === "in-progress" && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{trip.progress}% • ETA: {trip.eta}</span>
                    </div>
                    <Progress value={trip.progress} className="h-2 [&>div]:bg-primary" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
