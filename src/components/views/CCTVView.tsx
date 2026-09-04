import { Video, Play, Pause, Maximize2, Volume2, VolumeX, Camera, AlertTriangle, Download, History, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useSimulation } from "@/contexts/SimulationContext";
import { toast } from "sonner";

export function CCTVView() {
  const { vehicles, isDriver } = useSimulation();

  // Generate cameras from simulation vehicles
  const cameras = vehicles.flatMap((v) => [
    {
      id: `${v.id}-dash`,
      name: `${v.plate} - Dashboard`,
      vehicle: v.name,
      status: v.status === 'active' ? 'live' as const : v.status === 'idle' ? 'recording' as const : 'offline' as const,
      hasAlert: v.engineTemp > 210 || v.fuelLevel < 20,
      alertText: v.engineTemp > 210 ? 'Engine Overheat Warning' : v.fuelLevel < 20 ? 'Low Fuel Alert' : '',
    },
    {
      id: `${v.id}-rear`,
      name: `${v.plate} - Rear Cam`,
      vehicle: v.name,
      status: v.status === 'active' ? 'live' as const : 'offline' as const,
      hasAlert: false,
      alertText: '',
    },
  ]);

  const [selectedCameraId, setSelectedCameraId] = useState(cameras[0]?.id || '');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const selectedCamera = cameras.find(c => c.id === selectedCameraId) || cameras[0];
  const liveCount = cameras.filter(c => c.status === 'live').length;

  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen);
    toast.info(!isFullscreen ? "Entered camera fullscreen mode" : "Exited camera fullscreen mode");
  };

  const handleDownloadRecording = () => {
    toast.success(`Exporting 1080p recording for ${selectedCamera?.name}`, {
      description: "Clip archived from onboard SD / Cloud DVR (H.265 encoded).",
    });
  };

  const handleViewHistory = () => {
    toast.info(`Playback timeline: ${selectedCamera?.name}`, {
      description: "Previous clips available: 08:00 AM (Departed Depot), 10:30 AM (Highway Toll), 01:15 PM (Fuel Halt).",
    });
  };

  const handleTakeSnapshot = () => {
    toast.success(`Snapshot captured from ${selectedCamera?.name}`, {
      description: `Frame saved to incident evidence folder at ${new Date().toLocaleTimeString()}.`,
    });
  };

  if (cameras.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>No vehicles assigned to view CCTV feeds.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight text-foreground">CCTV Feeds</h1>
          <p className="text-muted-foreground">
            {isDriver ? 'Your vehicle camera feeds' : 'Live and recorded camera feeds from all vehicles'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleTakeSnapshot}>
            <Camera className="w-4 h-4 mr-2" />
            Capture Snapshot
          </Button>
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            <span className="text-sm font-medium text-success">{liveCount} Live</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Video Player */}
        <div className="xl:col-span-2 space-y-4">
          <div className={cn("glass-card overflow-hidden transition-all", isFullscreen && "fixed inset-4 z-50 bg-background/95 p-4 flex flex-col justify-center")}>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-background flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Live Feed: {selectedCamera?.name}</p>
                  {selectedCamera?.status === "live" && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-success">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                      </span>
                      <span className="text-sm font-medium">LIVE</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" onClick={() => setIsPlaying(!isPlaying)}>
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setIsMuted(!isMuted)}>
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </Button>
                    <span className="text-sm font-mono">LIVE</span>
                  </div>
                  <Button size="icon" variant="ghost" onClick={handleFullscreenToggle}>
                    <Maximize2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {selectedCamera?.hasAlert && (
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-danger/90 text-danger-foreground">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">{selectedCamera.alertText}</span>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{selectedCamera?.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedCamera?.vehicle}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleDownloadRecording}>
                  <Download className="w-4 h-4 mr-1.5" />
                  Download Recording
                </Button>
                <Button variant="secondary" size="sm" onClick={handleViewHistory}>
                  <History className="w-4 h-4 mr-1.5" />
                  View History
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Camera Grid */}
        <div className="space-y-4">
          <h3 className="font-semibold">All Cameras ({cameras.length})</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin">
            {cameras.map((camera) => (
              <button
                key={camera.id}
                onClick={() => setSelectedCameraId(camera.id)}
                className={cn(
                  "w-full glass-card p-3 text-left transition-all",
                  selectedCameraId === camera.id ? "border-primary/50 bg-primary/5" : "hover:border-primary/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      camera.status === "live" ? "bg-success/20" :
                      camera.status === "recording" ? "bg-info/20" : "bg-muted"
                    )}>
                      <Video className={cn(
                        "w-5 h-5",
                        camera.status === "live" ? "text-success" :
                        camera.status === "recording" ? "text-info" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{camera.name}</p>
                      <p className="text-xs text-muted-foreground">{camera.vehicle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {camera.hasAlert && (
                      <AlertTriangle className="w-4 h-4 text-danger" />
                    )}
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full capitalize",
                      camera.status === "live" ? "bg-success/20 text-success" :
                      camera.status === "recording" ? "bg-info/20 text-info" : "bg-muted text-muted-foreground"
                    )}>
                      {camera.status}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
