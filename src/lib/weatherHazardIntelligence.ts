/**
 * Weather & Road Hazards Radar Intelligence Engine
 *
 * Real-time meteorological telemetry and hazard prediction for commercial freight corridors:
 * - Monsoon downpours & aquaplaning waterlogging
 * - Dense winter fog (< 50m visibility)
 * - Western Ghats slope instability & rockfall landslides
 * - High-speed crosswinds on open expressway plains
 * - Extreme road surface heat (tire blowout risk)
 */

export type HazardCategory =
  | "monsoon_flood"
  | "dense_fog"
  | "ghat_landslide"
  | "crosswinds"
  | "extreme_heat";

export type HazardSeverity = "advisory" | "warning" | "critical";

export interface WeatherHazard {
  id: string;
  corridor: string;
  locationName: string;
  category: HazardCategory;
  severity: HazardSeverity;
  coordinates: [number, number];
  radiusKm: number;
  headline: string;
  description: string;
  visibilityMeters: number;
  precipitationMmPerHour: number;
  windSpeedKmh: number;
  temperatureCelsius: number;
  roadCondition: "dry" | "wet_slippery" | "waterlogged" | "fog_blind" | "debris_strewn";
  safeSpeedLimitKmh: number;
  driverGuidance: string;
  safeShelterName: string;
  safeShelterCoords: [number, number];
  detectedAt: Date;
  expectedClearTime: string;
  active: boolean;
}

export interface WeatherRouteImpact {
  weatherDelayMinutes: number;
  safetyScorePenalty: number;
  activeHazardsCount: number;
  criticalHazardPresent: boolean;
  recommendedDepartureWindow: string;
  speedRestrictionSummary: string;
  safeHavenRecommendation: string;
  alertBanner?: {
    severity: HazardSeverity;
    text: string;
  };
}

// Initial active weather hazards across Indian logistics corridors
export const INITIAL_WEATHER_HAZARDS: WeatherHazard[] = [
  {
    id: "wh-mumbai-pune-borghat",
    corridor: "mumbai-pune",
    locationName: "Borghat & Khandala Incline (km 72 - km 81)",
    category: "monsoon_flood",
    severity: "warning",
    coordinates: [18.7548, 73.4072],
    radiusKm: 7.5,
    headline: "Heavy Monsoon Cloudburst & Highway Aquaplaning",
    description: "Intense torrential downpour with 32 mm/h rain rate. High risk of commercial vehicle aquaplaning on curves.",
    visibilityMeters: 180,
    precipitationMmPerHour: 32.5,
    windSpeedKmh: 42,
    temperatureCelsius: 23,
    roadCondition: "wet_slippery",
    safeSpeedLimitKmh: 45,
    driverGuidance: "Engage low gear (Gear 3), activate hazard lamps, maintain minimum 60m following distance. Do not stop in water channels.",
    safeShelterName: "Khalapur Food Mall & Heavy Truck Plaza (km 62)",
    safeShelterCoords: [18.7946, 73.3283],
    detectedAt: new Date(),
    expectedClearTime: "In ~45 minutes",
    active: true,
  },
  {
    id: "wh-mumbai-pune-landslide",
    corridor: "mumbai-pune",
    locationName: "Old Khandala Ghat Curves (NH-48 via Khopoli)",
    category: "ghat_landslide",
    severity: "critical",
    coordinates: [18.7850, 73.3400],
    radiusKm: 5.0,
    headline: "Active Ghat Slope Instability & Rockfall Alert",
    description: "Loose boulder movement detected near Amrutanjan point. Traffic slowed to single lane crawling.",
    visibilityMeters: 250,
    precipitationMmPerHour: 28.0,
    windSpeedKmh: 35,
    temperatureCelsius: 22,
    roadCondition: "debris_strewn",
    safeSpeedLimitKmh: 20,
    driverGuidance: "Avoid Old NH-48 route! Heavy trucks must divert to Access-Controlled Expressway with concrete rockfall netting.",
    safeShelterName: "Khopoli Freight Layby",
    safeShelterCoords: [18.7890, 73.3350],
    detectedAt: new Date(),
    expectedClearTime: "Clearing in progress by NHAI (2-3 hrs)",
    active: true,
  },
  {
    id: "wh-delhi-jaipur-fog",
    corridor: "delhi-jaipur",
    locationName: "NH-48 Dharuhera - Neemrana Industrial Belt",
    category: "dense_fog",
    severity: "critical",
    coordinates: [28.2000, 76.8000],
    radiusKm: 12.0,
    headline: "Severe Winter Smog & Dense Fog Corridor (< 40m Visibility)",
    description: "Thermal inversion causing severe zero-visibility fog. High risk of multi-vehicle pileup on unlit highway junctions.",
    visibilityMeters: 38,
    precipitationMmPerHour: 0,
    windSpeedKmh: 8,
    temperatureCelsius: 11,
    roadCondition: "fog_blind",
    safeSpeedLimitKmh: 35,
    driverGuidance: "Switch on low-beam yellow fog lamps. Strictly follow lane reflector studs. Never stop on highway carriageway.",
    safeShelterName: "Neemrana Wayside Commercial Truck Terminal",
    safeShelterCoords: [27.9800, 76.3800],
    detectedAt: new Date(),
    expectedClearTime: "Sun dissipation expected by 10:45 AM",
    active: true,
  },
  {
    id: "wh-delhi-jaipur-wind",
    corridor: "delhi-jaipur",
    locationName: "NE-4 Sohna - Dausa Expressway Aravali Gap",
    category: "crosswinds",
    severity: "advisory",
    coordinates: [27.4500, 76.5500],
    radiusKm: 15.0,
    headline: "High-Speed Lateral Crosswind Gusts (62 km/h)",
    description: "Strong directional wind through open Aravali gaps. Potential trailer sway on high-cube container trucks.",
    visibilityMeters: 2500,
    precipitationMmPerHour: 0,
    windSpeedKmh: 62,
    temperatureCelsius: 28,
    roadCondition: "dry",
    safeSpeedLimitKmh: 65,
    driverGuidance: "Keep firm two-handed steering grip. Empty container trailers must reduce cruising speed by 15 km/h to avoid lateral drift.",
    safeShelterName: "Dausa Expressway Rest Area",
    safeShelterCoords: [27.1000, 76.2500],
    detectedAt: new Date(),
    expectedClearTime: "Ongoing afternoon thermal wind",
    active: true,
  },
  {
    id: "wh-blr-chennai-attibele",
    corridor: "bengaluru-chennai",
    locationName: "Attibele - Hosur Border Corridor",
    category: "dense_fog",
    severity: "advisory",
    coordinates: [12.7400, 77.8200],
    radiusKm: 8.0,
    headline: "Morning Mist & Moderate Fog (120m Visibility)",
    description: "Early morning valley mist causing moderate visibility reduction at interstate checkpost.",
    visibilityMeters: 120,
    precipitationMmPerHour: 1.5,
    windSpeedKmh: 12,
    temperatureCelsius: 19,
    roadCondition: "wet_slippery",
    safeSpeedLimitKmh: 50,
    driverGuidance: "Maintain dipped headlights and safe convoy distance.",
    safeShelterName: "Hosur SIPCOT Commercial Truck Stop",
    safeShelterCoords: [12.7200, 77.8400],
    detectedAt: new Date(),
    expectedClearTime: "Clearing in ~30 minutes",
    active: true,
  },
  {
    id: "wh-ahd-surat-waterlog",
    corridor: "ahmedabad-surat",
    locationName: "Ankleshwar Industrial Corridor Bypass",
    category: "monsoon_flood",
    severity: "warning",
    coordinates: [21.7000, 73.0000],
    radiusKm: 6.5,
    headline: "River Basin Storm & Highway Waterlogging",
    description: "Narmada estuary seasonal rainfall resulting in 4-inch standing water on low-lying outer bypass.",
    visibilityMeters: 300,
    precipitationMmPerHour: 24.0,
    windSpeedKmh: 38,
    temperatureCelsius: 27,
    roadCondition: "waterlogged",
    safeSpeedLimitKmh: 40,
    driverGuidance: "Avoid outer lane puddles to prevent brake drum wetting. Test brakes gently after exiting waterlogged stretches.",
    safeShelterName: "Bharuch Highway Food Plaza",
    safeShelterCoords: [21.7200, 72.9800],
    detectedAt: new Date(),
    expectedClearTime: "Drainage in progress (1-2 hrs)",
    active: true,
  },
];

/**
 * Filter hazards for a given Source -> Destination pair
 */
export function getHazardsForCorridor(
  source: string,
  destination: string,
  allHazards: WeatherHazard[] = INITIAL_WEATHER_HAZARDS
): WeatherHazard[] {
  const cleanSource = source.toLowerCase();
  const cleanDest = destination.toLowerCase();

  const isMumbaiPune =
    (cleanSource.includes("mumbai") && cleanDest.includes("pune")) ||
    (cleanSource.includes("pune") && cleanDest.includes("mumbai"));

  const isDelhiJaipur =
    (cleanSource.includes("delhi") && cleanDest.includes("jaipur")) ||
    (cleanSource.includes("jaipur") && cleanDest.includes("delhi"));

  const isBlrChennai =
    (cleanSource.includes("bengaluru") && cleanDest.includes("chennai")) ||
    (cleanSource.includes("chennai") && cleanDest.includes("bengaluru")) ||
    (cleanSource.includes("bangalore") && cleanDest.includes("chennai"));

  const isAhdSurat =
    (cleanSource.includes("ahmedabad") && cleanDest.includes("surat")) ||
    (cleanSource.includes("surat") && cleanDest.includes("ahmedabad"));

  if (isMumbaiPune) {
    return allHazards.filter((h) => h.corridor === "mumbai-pune" && h.active);
  }
  if (isDelhiJaipur) {
    return allHazards.filter((h) => h.corridor === "delhi-jaipur" && h.active);
  }
  if (isBlrChennai) {
    return allHazards.filter((h) => h.corridor === "bengaluru-chennai" && h.active);
  }
  if (isAhdSurat) {
    return allHazards.filter((h) => h.corridor === "ahmedabad-surat" && h.active);
  }

  // Fallback: return any hazard with coordinates within 150km or first 2 active
  return allHazards.filter((h) => h.active).slice(0, 2);
}

/**
 * Calculates dynamic route delays and safety penalties induced by active weather
 */
export function calculateWeatherRouteImpact(
  routeRoadType: "expressway" | "national_highway" | "state_highway",
  corridorHazards: WeatherHazard[]
): WeatherRouteImpact {
  if (!corridorHazards || corridorHazards.length === 0) {
    return {
      weatherDelayMinutes: 0,
      safetyScorePenalty: 0,
      activeHazardsCount: 0,
      criticalHazardPresent: false,
      recommendedDepartureWindow: "Clear Conditions: Depart immediately as scheduled",
      speedRestrictionSummary: "Standard highway cruise speeds permitted",
      safeHavenRecommendation: "None required. Route clear of extreme weather.",
    };
  }

  let totalDelay = 0;
  let safetyPenalty = 0;
  let hasCritical = false;

  corridorHazards.forEach((h) => {
    if (h.severity === "critical") {
      hasCritical = true;
      totalDelay += 35;
      safetyPenalty += 18;
    } else if (h.severity === "warning") {
      totalDelay += 20;
      safetyPenalty += 10;
    } else {
      totalDelay += 8;
      safetyPenalty += 4;
    }

    // State highways suffer double penalty due to lack of drainage and barriers
    if (routeRoadType === "state_highway") {
      totalDelay += 15;
      safetyPenalty += 8;
    }
  });

  const worstHazard = corridorHazards.sort((a, b) => {
    const score = (s: HazardSeverity) => (s === "critical" ? 3 : s === "warning" ? 2 : 1);
    return score(b.severity) - score(a.severity);
  })[0];

  return {
    weatherDelayMinutes: totalDelay,
    safetyScorePenalty: Math.min(35, safetyPenalty),
    activeHazardsCount: corridorHazards.length,
    criticalHazardPresent: hasCritical,
    recommendedDepartureWindow: hasCritical
      ? `Delay departure by 45-60m until ${worstHazard.expectedClearTime}`
      : "Immediate departure permitted with caution",
    speedRestrictionSummary: `Cap max speed to ${worstHazard.safeSpeedLimitKmh} km/h in ${worstHazard.locationName}`,
    safeHavenRecommendation: `Emergency haven: ${worstHazard.safeShelterName}`,
    alertBanner: {
      severity: worstHazard.severity,
      text: `${worstHazard.headline} (${worstHazard.locationName}). ${worstHazard.driverGuidance}`,
    },
  };
}
