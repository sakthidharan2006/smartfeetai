import { findLocationCoordinates } from "@/data/indianLocations";
import { getHaversineDistanceKm } from "./routeIntelligence";

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
  {
    id: "wh-chn-cbe-ranipet",
    corridor: "chennai-coimbatore",
    locationName: "NH-48 Sriperumbudur–Ranipet Industrial Stretch (km 76)",
    category: "monsoon_flood",
    severity: "warning",
    coordinates: [12.9200, 79.3300],
    radiusKm: 10.0,
    headline: "Monsoon Downpour & Standing Water in Outer Lanes",
    description: "Sudden seasonal downpour (31 mm/h). Standing water in low-lying sections increases truck braking distance.",
    visibilityMeters: 220,
    precipitationMmPerHour: 31.0,
    windSpeedKmh: 36,
    temperatureCelsius: 26,
    roadCondition: "wet_slippery",
    safeSpeedLimitKmh: 45,
    driverGuidance: "Maintain 60m following distance. Avoid sudden lane changes on wet expansion joints.",
    safeShelterName: "Ranipet SIPCOT Logistics Layby (km 82)",
    safeShelterCoords: [12.9300, 79.3400],
    detectedAt: new Date(),
    expectedClearTime: "In ~40 minutes",
    active: true,
  },
  {
    id: "wh-chn-cbe-thoppur",
    corridor: "chennai-coimbatore",
    locationName: "NH-544 Thoppur–Dharmapuri Ghat Pass (km 282)",
    category: "ghat_landslide",
    severity: "critical",
    coordinates: [11.9600, 78.0800],
    radiusKm: 6.0,
    headline: "Thoppur S-Curves Steep Incline & Heavy Convoy Braking Caution",
    description: "High downhill momentum zone with heavy truck queueing. Slick tarmac from mountain drizzle.",
    visibilityMeters: 350,
    precipitationMmPerHour: 14.0,
    windSpeedKmh: 28,
    temperatureCelsius: 24,
    roadCondition: "wet_slippery",
    safeSpeedLimitKmh: 35,
    driverGuidance: "Shift to Gear 2/3 before gradient begins. Rely on auxiliary exhaust brake, avoid continuous service brake friction.",
    safeShelterName: "Thoppur Highway Food Mall & Truck Rest Area",
    safeShelterCoords: [11.9700, 78.0900],
    detectedAt: new Date(),
    expectedClearTime: "Clearing in 1 hr",
    active: true,
  },
  {
    id: "wh-chn-cbe-avinashi",
    corridor: "chennai-coimbatore",
    locationName: "NH-544 Avinashi–Tirupur Expressway Belt (km 435)",
    category: "crosswinds",
    severity: "advisory",
    coordinates: [11.1900, 77.2700],
    radiusKm: 12.0,
    headline: "Lateral Crosswind Gusts (48 km/h) & Spray",
    description: "Open highway plain crosswinds causing trailer drift on empty container chassis.",
    visibilityMeters: 2000,
    precipitationMmPerHour: 0,
    windSpeedKmh: 48,
    temperatureCelsius: 28,
    roadCondition: "dry",
    safeSpeedLimitKmh: 65,
    driverGuidance: "Maintain center of lane. High-cube trailers keep firm two-handed grip.",
    safeShelterName: "Avinashi Toll Commercial Truck Plaza",
    safeShelterCoords: [11.2000, 77.2800],
    detectedAt: new Date(),
    expectedClearTime: "Ongoing afternoon breeze",
    active: true,
  },
];

/**
 * Generates dynamic, realistic meteorological and road hazards for ANY Source -> Destination across India
 */
export function generateDynamicCorridorHazards(source: string, destination: string): WeatherHazard[] {
  const srcClean = source.trim();
  const destClean = destination.trim();
  const srcCity = srcClean.split(",")[0].trim();
  const destCity = destClean.split(",")[0].trim();

  const srcCoords = findLocationCoordinates(srcClean);
  const destCoords = findLocationCoordinates(destClean);

  const directDistKm = Math.max(30, getHaversineDistanceKm(srcCoords, destCoords));
  const highwayDistKm = Math.round(directDistKm * 1.25);

  const dLat = destCoords[0] - srcCoords[0];
  const dLng = destCoords[1] - srcCoords[1];

  // Point 1 at ~35% of distance
  const p1Coords: [number, number] = [
    Number((srcCoords[0] + dLat * 0.35).toFixed(4)),
    Number((srcCoords[1] + dLng * 0.35).toFixed(4)),
  ];

  // Point 2 at ~72% of distance
  const p2Coords: [number, number] = [
    Number((srcCoords[0] + dLat * 0.72).toFixed(4)),
    Number((srcCoords[1] + dLng * 0.72).toFixed(4)),
  ];

  const avgLat = (srcCoords[0] + destCoords[0]) / 2;
  const isNorthernBelt = avgLat > 24.5;
  const isSouthernBelt = avgLat < 16.0;

  const h1Category: HazardCategory = isNorthernBelt ? "dense_fog" : "monsoon_flood";
  const h2Category: HazardCategory = isSouthernBelt ? "ghat_landslide" : isNorthernBelt ? "extreme_heat" : "crosswinds";

  const hazard1: WeatherHazard = {
    id: `dyn-wh-1-${srcCity.toLowerCase()}-${destCity.toLowerCase()}`,
    corridor: `${srcCity.toLowerCase()}-${destCity.toLowerCase()}`,
    locationName: `${srcCity}–${destCity} Expressway Sector (km ${Math.round(highwayDistKm * 0.35)})`,
    category: h1Category,
    severity: "warning",
    coordinates: p1Coords,
    radiusKm: 9.0,
    headline:
      h1Category === "dense_fog"
        ? `Dense Morning Smog & Visibility Drop (< 50m)`
        : `Monsoon Aquaplaning Risk & Heavy Downpour`,
    description:
      h1Category === "dense_fog"
        ? `Low-visibility winter inversion layer observed on highway stretch. High risk of chain collision on multi-axle freight.`
        : `Intense localized showers with standing water pockets along outer lanes. Potential hydroplaning risk.`,
    visibilityMeters: h1Category === "dense_fog" ? 45 : 220,
    precipitationMmPerHour: h1Category === "dense_fog" ? 0 : 34.0,
    windSpeedKmh: h1Category === "dense_fog" ? 9 : 38,
    temperatureCelsius: h1Category === "dense_fog" ? 14 : 25,
    roadCondition: h1Category === "dense_fog" ? "fog_blind" : "waterlogged",
    safeSpeedLimitKmh: 45,
    driverGuidance:
      h1Category === "dense_fog"
        ? `Activate yellow fog lamps and strictly track lane edge markers. Maintain 70m vehicle following distance.`
        : `Reduce speed to 45 km/h. Avoid abrupt braking in water channels. Check tire grip and brake drum clearance.`,
    safeShelterName: `${srcCity} Outer Bypass Commercial Truck Haven & Food Plaza`,
    safeShelterCoords: [
      Number((p1Coords[0] - 0.02).toFixed(4)),
      Number((p1Coords[1] - 0.02).toFixed(4)),
    ],
    detectedAt: new Date(),
    expectedClearTime: "In ~50 minutes",
    active: true,
  };

  const hazard2: WeatherHazard = {
    id: `dyn-wh-2-${srcCity.toLowerCase()}-${destCity.toLowerCase()}`,
    corridor: `${srcCity.toLowerCase()}-${destCity.toLowerCase()}`,
    locationName: `Interstate Highway Corridor approaching ${destCity} (km ${Math.round(highwayDistKm * 0.72)})`,
    category: h2Category,
    severity: "critical",
    coordinates: p2Coords,
    radiusKm: 12.0,
    headline:
      h2Category === "ghat_landslide"
        ? `Ghat Curve Slippage & Rolling Debris Warning`
        : h2Category === "extreme_heat"
        ? `Extreme Road Surface Temperature Warning (Tire Blowout Risk)`
        : `High-Speed Lateral Crosswind Gusts (58 km/h)`,
    description:
      h2Category === "ghat_landslide"
        ? `Ghat section pavement slick from seepage; heavy commercial vehicles crawling on single lane.`
        : h2Category === "extreme_heat"
        ? `Highway tarmac surface exceeding 52°C. High risk of tire delamination and thermal blowout under full axle load.`
        : `Strong lateral crosswinds across open elevated plains. Risk of trailer sway on high-cube container haulers.`,
    visibilityMeters: 1200,
    precipitationMmPerHour: h2Category === "ghat_landslide" ? 22 : 0,
    windSpeedKmh: h2Category === "crosswinds" ? 58 : 24,
    temperatureCelsius: h2Category === "extreme_heat" ? 44 : 26,
    roadCondition: h2Category === "ghat_landslide" ? "debris_strewn" : "dry",
    safeSpeedLimitKmh: h2Category === "ghat_landslide" ? 30 : 55,
    driverGuidance:
      h2Category === "ghat_landslide"
        ? `Use auxiliary engine retarder/exhaust brake on declines. Do not overtake on blind hairpins.`
        : h2Category === "extreme_heat"
        ? `Check TPMS wheel temperatures. Halt at nearest layby if tire temperature exceeds 85°C. Do not bleed hot tire pressure.`
        : `Firm two-handed steering grip required. High-cube trailers reduce speed by 15 km/h.`,
    safeShelterName: `${destCity} Highway Authority Heavy Freight Rest Terminal`,
    safeShelterCoords: [
      Number((p2Coords[0] + 0.02).toFixed(4)),
      Number((p2Coords[1] + 0.02).toFixed(4)),
    ],
    detectedAt: new Date(),
    expectedClearTime: "Ongoing regional condition",
    active: true,
  };

  return [hazard1, hazard2];
}

/**
 * Filter or dynamically synthesize hazards for a given Source -> Destination pair across India
 */
export function getHazardsForCorridor(
  source: string,
  destination: string,
  allHazards: WeatherHazard[] = INITIAL_WEATHER_HAZARDS
): WeatherHazard[] {
  if (!source || !destination) {
    return allHazards.filter((h) => h.active);
  }

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

  const isChnCbe =
    (cleanSource.includes("chennai") && cleanDest.includes("coimbatore")) ||
    (cleanSource.includes("coimbatore") && cleanDest.includes("chennai"));

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
  if (isChnCbe) {
    return allHazards.filter((h) => h.corridor === "chennai-coimbatore" && h.active);
  }

  // Dynamic Synthesis for ANY other arbitrary Indian Source -> Destination corridor
  return generateDynamicCorridorHazards(source, destination);
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
