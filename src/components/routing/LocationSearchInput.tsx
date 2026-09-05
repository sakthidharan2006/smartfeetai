import React, { useState, useEffect, useRef } from "react";
import {
  IndianLocation,
  searchIndianLocations,
  INDIAN_LOCATIONS,
  POPULAR_INDIAN_FREIGHT_HUBS,
} from "@/data/indianLocations";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Navigation,
  Search,
  X,
  Building2,
  Anchor,
  Factory,
  Globe,
  Check,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationSearchInputProps {
  value: string;
  onChange: (value: string, coords?: [number, number]) => void;
  placeholder?: string;
  iconType?: "origin" | "destination";
  className?: string;
  disabled?: boolean;
}

export function LocationSearchInput({
  value,
  onChange,
  placeholder = "Search any city or location in India...",
  iconType = "origin",
  className,
  disabled = false,
}: LocationSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const [onlineResults, setOnlineResults] = useState<IndianLocation[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep internal search term in sync with prop value
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter local Indian locations
  const filteredLocations = React.useMemo(() => {
    let list = searchIndianLocations(searchTerm, 25);
    if (selectedRegion !== "All") {
      list = list.filter((l) => l.region === selectedRegion);
    }
    return list;
  }, [searchTerm, selectedRegion]);

  // Debounced live geocoding query fallback to Nominatim (India only)
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 3) {
      setOnlineResults([]);
      return;
    }

    // If local results are already found, don't spam the API unless fewer than 2 results
    if (filteredLocations.length >= 4) {
      setOnlineResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        const query = encodeURIComponent(searchTerm.trim());
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${query}&countrycodes=in&format=json&addressdetails=1&limit=4`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );
        if (resp.ok) {
          const data = await resp.json();
          const mapped: IndianLocation[] = data.map((item: any) => ({
            id: `osm-${item.place_id}`,
            name: item.name || item.display_name.split(",")[0],
            state: item.address?.state || item.address?.state_district || "India",
            region: "Central",
            category: "Commercial Center",
            coordinates: [parseFloat(item.lat), parseFloat(item.lon)],
            aliases: [],
            displayName: item.display_name.split(",").slice(0, 3).join(", "),
          }));
          setOnlineResults(mapped);
        }
      } catch {
        // Silently fail on network block or offline
        setOnlineResults([]);
      } finally {
        setIsSearchingOnline(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [searchTerm, filteredLocations.length]);

  const handleSelect = (loc: IndianLocation) => {
    setSearchTerm(loc.displayName);
    onChange(loc.displayName, loc.coordinates);
    setIsOpen(false);
  };

  const handleCustomInput = (customText: string) => {
    setSearchTerm(customText);
    onChange(customText);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchTerm("");
    onChange("");
    inputRef.current?.focus();
    setIsOpen(true);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Port City":
        return <Anchor className="w-3 h-3 text-cyan-500" />;
      case "Industrial Corridor":
        return <Factory className="w-3 h-3 text-amber-500" />;
      case "Major Metro":
        return <Building2 className="w-3 h-3 text-emerald-500" />;
      default:
        return <MapPin className="w-3 h-3 text-primary" />;
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Input Field */}
      <div className="relative flex items-center">
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
          {iconType === "origin" ? (
            <MapPin className="w-4 h-4 text-emerald-500" />
          ) : (
            <Navigation className="w-4 h-4 text-rose-500" />
          )}
        </div>

        <Input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={searchTerm}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            handleCustomInput(e.target.value);
            setIsOpen(true);
          }}
          className={cn(
            "pl-8 pr-16 h-9 text-xs transition-colors bg-background border-border/70 focus:border-primary",
            isOpen && "ring-1 ring-primary/40 border-primary"
          )}
        />

        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* Autocomplete Recommendation Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-popover/95 backdrop-blur-md border border-border shadow-2xl rounded-lg overflow-hidden animate-in fade-in-50 zoom-in-95 max-h-80 flex flex-col">
          {/* Regional Filter Bar */}
          <div className="p-1.5 bg-muted/40 border-b border-border/50 flex items-center justify-between gap-1 overflow-x-auto text-[11px]">
            <span className="text-[10px] uppercase font-mono text-muted-foreground pl-1 hidden sm:inline">
              Filter:
            </span>
            <div className="flex items-center gap-1">
              {["All", "South", "North", "West", "East", "Central"].map((region) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => setSelectedRegion(region)}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-medium transition-colors whitespace-nowrap",
                    selectedRegion === region
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          {/* Locations List */}
          <div className="overflow-y-auto flex-1 divide-y divide-border/30 p-1">
            {/* Online geocoding indicator */}
            {isSearchingOnline && (
              <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
                <Search className="w-3 h-3 animate-spin text-primary" />
                Searching all India towns & highway junctions...
              </div>
            )}

            {/* Local India Database Results */}
            {filteredLocations.map((loc) => {
              const isSelected = value.toLowerCase() === loc.displayName.toLowerCase();
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => handleSelect(loc)}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground flex items-center justify-between gap-2 text-xs transition-colors group",
                    isSelected && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1 rounded bg-muted/60 text-muted-foreground group-hover:text-primary">
                      {getCategoryIcon(loc.category)}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground group-hover:text-primary">
                          {loc.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          • {loc.state}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {loc.category} {loc.aliases.length > 0 && `(${loc.aliases[0]})`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-border/60">
                      {loc.region}
                    </Badge>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>
                </button>
              );
            })}

            {/* Online Nominatim Geocoded Results (if any extra locations found) */}
            {onlineResults.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => handleSelect(loc)}
                className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground flex items-center justify-between gap-2 text-xs transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1 rounded bg-primary/10 text-primary">
                    <Globe className="w-3 h-3" />
                  </div>
                  <div className="truncate">
                    <div className="font-medium text-foreground truncate">{loc.displayName}</div>
                    <div className="text-[10px] text-muted-foreground">Geocoded Location (India)</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-primary/30 text-primary">
                  Live GPS
                </Badge>
              </button>
            ))}

            {/* No matches */}
            {filteredLocations.length === 0 && onlineResults.length === 0 && !isSearchingOnline && (
              <div className="p-3 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  No predefined city match for &ldquo;{searchTerm}&rdquo;
                </p>
                {searchTerm.trim().length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 gap-1"
                    onClick={() => {
                      onChange(searchTerm.trim());
                      setIsOpen(false);
                    }}
                  >
                    <Sparkles className="w-3 h-3 text-primary" />
                    Use &ldquo;{searchTerm.trim()}&rdquo; as custom location
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Quick Hubs Footer */}
          <div className="p-1.5 bg-muted/20 border-t border-border/40 text-[10px] text-muted-foreground flex items-center justify-between">
            <span>{INDIAN_LOCATIONS.length}+ Verified Indian Freight Hubs</span>
            <span className="font-mono">Type any city, town, or state</span>
          </div>
        </div>
      )}
    </div>
  );
}
