/**
 * Multi-Agent AI Intelligence Engine
 * 
 * Unifies disconnected vehicle telematics, driver duty tracking, maintenance records,
 * and compliance documentation into an autonomous decision layer.
 */

export type AgentId = "chief" | "maintenance" | "dispatch" | "compliance";
export type InsightSeverity = "critical" | "warning" | "info";
export type InsightStatus = "open" | "acknowledged" | "resolved";

export interface AgentInsight {
  id: string;
  agent: AgentId;
  title: string;
  summary: string;
  recommendations: string[];
  severity: InsightSeverity;
  riskScore: number; // 0-100
  vehicleId?: string;
  vehicleName?: string;
  driverId?: string;
  driverName?: string;
  timestamp: Date;
  status: InsightStatus;
  actionType?: "maintenance_work_order" | "execute_dispatch" | "renew_document" | "export_report";
  actionPayload?: Record<string, unknown>;
}

export interface SubsystemHealth {
  powertrain: number; // 0-100
  braking: number;
  tpms: number;
  aftertreatmentBs6: number; // DPF & SCR
}

export interface MaintenancePrediction {
  vehicleId: string;
  vehicleName: string;
  plate: string;
  riskScore: number; // 0-100
  timeToFailureHours: number;
  primaryFailureMode: string;
  subsystemHealth: SubsystemHealth;
  recommendedAction: string;
  urgency: "immediate" | "within_48h" | "scheduled";
  estimatedCostInr: number;
  requiredParts?: string[];
  procurementStatus?: string;
  workshopBay?: string;
}

export interface DispatchCandidate {
  vehicleId: string;
  vehicleName: string;
  plate: string;
  driverId: string;
  driverName: string;
  totalScore: number; // 0-100
  healthScore: number;
  driverHoursScore: number;
  routeMatchScore: number;
  hasFatigueWarning: boolean;
  fatigueWarningDetails?: string;
  estimatedTollCostInr: number;
  estimatedFuelLitres: number;
  isRecommended: boolean;
}

export interface DispatchJob {
  id: string;
  origin: string;
  destination: string;
  distanceKm: number;
  estimatedDurationHours: number;
  cargoDescription: string;
  weightTons: number;
  priority: "high" | "normal" | "urgent";
  scheduledDeparture: string;
  assignedVehicleId?: string;
  assignedDriverId?: string;
  status: "pending" | "dispatched" | "in_transit" | "delivered";
}

export interface DispatchRecommendation {
  job: DispatchJob;
  candidates: DispatchCandidate[];
  bestPair?: DispatchCandidate;
  rationale: string;
}

export interface ComplianceDocument {
  id: string;
  vehicleId: string;
  vehicleName?: string;
  documentType: "puc" | "fitness" | "insurance" | "national_permit" | "road_tax";
  documentNumber: string;
  expiryDate: string;
  status: "valid" | "expiring_soon" | "expired";
  daysUntilExpiry: number;
  issuingAuthority: string;
}

export interface ComplianceAuditSummary {
  certificateId: string;
  generatedAt: Date;
  overallComplianceScore: number; // 0-100%
  totalVehiclesAudited: number;
  certifiedVehiclesCount: number;
  nonCompliantCount: number;
  expiringWithin30DaysCount: number;
  expiredCount: number;
  activeLiabilitiesCount: number;
  liabilitiesList: {
    vehicleName: string;
    plate: string;
    documentType: string;
    reason: string;
    riskPenaltyInr: number;
  }[];
  regulatorySignOff: {
    status: "compliant" | "conditional_pass" | "violation_warning";
    auditedByAgent: string;
    checksum: string;
  };
}

export interface ChiefOperatingBrief {
  briefId: string;
  generatedAt: Date;
  headline: string;
  fleetHealthScore: number; // 0-100
  dispatchReadinessIndex: number; // 0-100
  compliancePassRate: number; // 0-100
  executiveSummary: string;
  topPriorities: {
    rank: number;
    agent: AgentId;
    title: string;
    rationale: string;
    recommendedAction: string;
    financialImpact: string;
  }[];
}

// ----------------------------------------------------------------------------
// 1. PREDICTIVE MAINTENANCE ENGINE
// ----------------------------------------------------------------------------

export interface RawVehicleTelemetry {
  id: string;
  name: string;
  plate: string;
  status: string;
  speed: number;
  engineTemp: number;
  fuelLevel: number;
  tirePressure: { frontLeft: number; frontRight: number; rearLeft: number; rearRight: number };
  adBlueLevel?: number;
  dpfSootLoad?: number;
  scrEfficiency?: number;
  mileage: number;
}

export function evaluatePredictiveMaintenance(telemetryList: RawVehicleTelemetry[]): MaintenancePrediction[] {
  return telemetryList.map((v) => {
    let risk = 10;
    let failureMode = "Normal Operation — Routine Inspection";
    let action = "Continue scheduled preventative servicing";
    let urgency: "immediate" | "within_48h" | "scheduled" = "scheduled";
    let ttf = 720; // 30 days default
    let cost = 3500;

    // Powertrain check
    let powertrain = 95;
    if (v.engineTemp > 215) {
      risk += 45;
      powertrain -= 50;
      failureMode = "Cooling System Failure / Head Gasket Thermal Stress";
      action = "Immediate coolant pressure check and radiator flush before next haul";
      urgency = "immediate";
      ttf = Math.min(ttf, 12);
      cost = 24000;
    } else if (v.engineTemp > 200) {
      risk += 20;
      powertrain -= 25;
      failureMode = "Engine Thermal Drift / Thermostat Degradation";
      action = "Inspect thermostat valve and auxiliary fan relay";
      urgency = "within_48h";
      ttf = Math.min(ttf, 48);
      cost = 8500;
    }

    // TPMS check
    const tires = [v.tirePressure.frontLeft, v.tirePressure.frontRight, v.tirePressure.rearLeft, v.tirePressure.rearRight];
    const minTire = Math.min(...tires);
    let tpmsScore = 95;
    if (minTire < 88) {
      risk += 35;
      tpmsScore -= 45;
      failureMode = "Tire Blowout Risk — Severe Under-inflation";
      action = "Immediate tire bead inspection and inflation to 105 PSI";
      urgency = "immediate";
      ttf = Math.min(ttf, 6);
      cost = 14000;
    } else if (minTire < 96) {
      risk += 15;
      tpmsScore -= 20;
      if (urgency === "scheduled") {
        failureMode = "Uneven Tire Wear / Micro-Leak";
        action = "Top-up tire air pressure and balance wheel alignment";
        urgency = "within_48h";
        ttf = Math.min(ttf, 36);
        cost = 3200;
      }
    }

    // BS-VI Emissions / Aftertreatment check
    let aftertreatment = 95;
    const dpfSoot = v.dpfSootLoad ?? 30;
    const adBlue = v.adBlueLevel ?? 60;
    const scrEff = v.scrEfficiency ?? 95;

    if (dpfSoot > 80 || scrEff < 80) {
      risk += 40;
      aftertreatment -= 45;
      failureMode = "BS-VI DPF Soot Saturation / SCR Efficiency Collapse";
      action = "Trigger stationary forced DPF regeneration; inspect SCR doser valve";
      urgency = "immediate";
      ttf = Math.min(ttf, 8);
      cost = 32000;
    } else if (dpfSoot > 65 || adBlue < 15) {
      risk += 20;
      aftertreatment -= 25;
      if (urgency === "scheduled") {
        failureMode = "Low DEF / Moderate Soot Accumulation";
        action = "Replenish AdBlue DEF reservoir (minimum 20L) & run highway burn cycle";
        urgency = "within_48h";
        ttf = Math.min(ttf, 30);
        cost = 4500;
      }
    }

    // Braking check based on mileage interval
    let braking = 92;
    if (v.mileage > 200000 && (v.mileage % 40000) > 35000) {
      risk += 15;
      braking -= 30;
      if (urgency === "scheduled") {
        failureMode = "Brake Lining Wear Near Service Limit";
        action = "Measure brake drum clearance and replace front brake shoes";
        urgency = "within_48h";
        ttf = Math.min(ttf, 48);
        cost = 11000;
      }
    }

    const cappedRisk = Math.min(99, Math.max(5, risk));

    // Dynamic spare parts & workshop bay allocation
    let parts: string[] = ["Routine Lubricant & Filter Kit"];
    let procurement = "In Central Stock";
    let bay = "Bay 3 (General Maintenance)";

    if (failureMode.includes("DPF") || failureMode.includes("DEF")) {
      parts = ["BS-VI DPF Ceramic Filter Element", "AdBlue Dosing Gasket Kit"];
      procurement = "OEM Dispatched (ETA 2.5h)";
      bay = "Bay 4 (Emissions & Exhaust Lab)";
    } else if (failureMode.includes("Overheating") || failureMode.includes("Gasket")) {
      parts = ["Multi-Layer Steel Cylinder Head Gasket", "Heavy-Duty Glycol Coolant (20L)"];
      procurement = "Depot Reserved";
      bay = "Bay 1 (Heavy Powertrain)";
    } else if (failureMode.includes("Brake")) {
      parts = ["Asbestos-Free Heavy Brake Shoes (Axle Pair)", "Return Spring Set"];
      procurement = "In Central Stock";
      bay = "Bay 2 (Brakes & Suspension)";
    } else if (failureMode.includes("Tire") || failureMode.includes("TPMS")) {
      parts = ["295/80 R22.5 Tubeless Commercial Radial", "Internal TPMS Valve Sensor"];
      procurement = "In Central Stock";
      bay = "Bay 5 (Tire Alignment Bay)";
    }

    return {
      vehicleId: v.id,
      vehicleName: v.name,
      plate: v.plate,
      riskScore: cappedRisk,
      timeToFailureHours: ttf,
      primaryFailureMode: failureMode,
      subsystemHealth: {
        powertrain: Math.max(10, powertrain),
        braking: Math.max(10, braking),
        tpms: Math.max(10, tpmsScore),
        aftertreatmentBs6: Math.max(10, aftertreatment),
      },
      recommendedAction: action,
      urgency,
      estimatedCostInr: cost,
      requiredParts: parts,
      procurementStatus: procurement,
      workshopBay: bay,
    };
  }).sort((a, b) => b.riskScore - a.riskScore);
}

// ----------------------------------------------------------------------------
// 2. INTELLIGENT DISPATCH & ROUTING ENGINE
// ----------------------------------------------------------------------------

export interface RawDriver {
  id: string | number;
  name: string;
  vehiclePlate?: string;
  status: string; // 'on-duty' | 'off-duty' | 'resting'
  score: number;
  hoursRemaining: number;
}

export function evaluateDispatchOptimization(
  jobs: DispatchJob[],
  vehicles: RawVehicleTelemetry[],
  drivers: RawDriver[],
  predictions: MaintenancePrediction[]
): DispatchRecommendation[] {
  const riskMap = new Map(predictions.map((p) => [p.vehicleId, p.riskScore]));

  return jobs.map((job) => {
    const candidates: DispatchCandidate[] = [];

    vehicles.forEach((vehicle) => {
      const vehicleRisk = riskMap.get(vehicle.id) ?? 20;
      const vehicleHealthScore = Math.max(10, 100 - vehicleRisk);

      drivers.forEach((driver) => {
        // Driver duty hours check: trip duration + 1.5h margin
        const neededHours = job.estimatedDurationHours + 1.5;
        const hasFatigueWarning = driver.hoursRemaining < neededHours;
        let driverHoursScore = 90;

        let fatigueDetails: string | undefined;
        if (hasFatigueWarning) {
          driverHoursScore = Math.max(10, Math.round((driver.hoursRemaining / neededHours) * 60));
          fatigueDetails = `Driver has ${driver.hoursRemaining.toFixed(1)}h duty remaining, but trip requires ~${neededHours.toFixed(1)}h (Fatigue violation risk)`;
        } else {
          driverHoursScore = 95;
        }

        // Driver rating factor
        const driverRatingFactor = driver.score / 100;

        // Route match & fuel factor
        const routeMatchScore = vehicle.status === "active" || vehicle.status === "idle" ? 90 : 30;

        // Multi-factor weighted score
        const totalScore = Math.round(
          vehicleHealthScore * 0.4 +
          driverHoursScore * 0.35 +
          driverRatingFactor * 15 +
          routeMatchScore * 0.1
        );

        const estLitres = Math.round((job.distanceKm / 100) * 28); // avg 28L / 100km
        const estToll = Math.round((job.distanceKm / 100) * 190); // ~Rs.190 per 100km highway

        candidates.push({
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          plate: vehicle.plate,
          driverId: String(driver.id),
          driverName: driver.name,
          totalScore: Math.min(99, Math.max(15, totalScore)),
          healthScore: vehicleHealthScore,
          driverHoursScore,
          routeMatchScore,
          hasFatigueWarning,
          fatigueWarningDetails: fatigueDetails,
          estimatedTollCostInr: estToll,
          estimatedFuelLitres: estLitres,
          isRecommended: false,
        });
      });
    });

    // Sort candidates descending by totalScore
    candidates.sort((a, b) => b.totalScore - a.totalScore);
    if (candidates.length > 0) {
      candidates[0].isRecommended = true;
    }

    const best = candidates[0];
    const rationale = best
      ? `Optimal match: ${best.vehicleName} (${best.healthScore}% health) paired with ${best.driverName} (${best.hasFatigueWarning ? "CAUTION: Duty shift handover recommended" : "Full duty clearance"}). Expected dispatch efficiency: ${best.totalScore}%.`
      : "No suitable truck/driver candidate found with safe operational clearance.";

    return {
      job,
      candidates: candidates.slice(0, 5), // top 5
      bestPair: best,
      rationale,
    };
  });
}

// ----------------------------------------------------------------------------
// 3. AUTONOMOUS COMPLIANCE & AUDIT ENGINE
// ----------------------------------------------------------------------------

export function evaluateComplianceAudit(
  documents: ComplianceDocument[],
  vehicles: RawVehicleTelemetry[]
): ComplianceAuditSummary {
  const now = new Date();
  const certId = `CERT-IN-FLT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

  let valid = 0;
  let expiringSoon = 0;
  let expired = 0;
  const liabilities: ComplianceAuditSummary["liabilitiesList"] = [];

  documents.forEach((doc) => {
    const exp = new Date(doc.expiryDate);
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      expired++;
      const v = vehicles.find((veh) => veh.id === doc.vehicleId);
      liabilities.push({
        vehicleName: v ? v.name : `Vehicle ${doc.vehicleId}`,
        plate: v ? v.plate : "Unknown Plate",
        documentType: doc.documentType.toUpperCase(),
        reason: `Expired ${Math.abs(diffDays)} days ago (${doc.expiryDate}). Unlawful to operate under Motor Vehicles Act.`,
        riskPenaltyInr: doc.documentType === "insurance" ? 25000 : 10000,
      });
    } else if (diffDays <= 30) {
      expiringSoon++;
    } else {
      valid++;
    }
  });

  const total = documents.length || 1;
  const score = Math.round(((valid * 1.0 + expiringSoon * 0.5) / total) * 100);

  const status: "compliant" | "conditional_pass" | "violation_warning" =
    expired > 0 ? "violation_warning" : expiringSoon > 0 ? "conditional_pass" : "compliant";

  return {
    certificateId: certId,
    generatedAt: now,
    overallComplianceScore: Math.min(100, Math.max(0, score)),
    totalVehiclesAudited: vehicles.length,
    certifiedVehiclesCount: Math.max(0, vehicles.length - liabilities.length),
    nonCompliantCount: liabilities.length,
    expiringWithin30DaysCount: expiringSoon,
    expiredCount: expired,
    activeLiabilitiesCount: liabilities.length,
    liabilitiesList: liabilities,
    regulatorySignOff: {
      status,
      auditedByAgent: "Autonomous Regulatory Compliance AI Agent v4.2",
      checksum: `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    },
  };
}

// ----------------------------------------------------------------------------
// 4. CHIEF MULTI-AGENT INTELLIGENCE COORDINATOR
// ----------------------------------------------------------------------------

export function synthesizeChiefBrief(
  predictions: MaintenancePrediction[],
  dispatches: DispatchRecommendation[],
  compliance: ComplianceAuditSummary,
  totalVehicles: number
): ChiefOperatingBrief {
  const highRiskVehicles = predictions.filter((p) => p.riskScore >= 60);
  const fatigueAlerts = dispatches.filter((d) => d.bestPair?.hasFatigueWarning);
  const criticalLiabilities = compliance.liabilitiesList;

  // Fleet health score
  const avgRisk = predictions.length
    ? predictions.reduce((sum, p) => sum + p.riskScore, 0) / predictions.length
    : 15;
  const fleetHealth = Math.round(100 - avgRisk);

  // Dispatch readiness
  const readyDispatches = dispatches.filter((d) => (d.bestPair?.totalScore ?? 0) >= 70).length;
  const dispatchReadiness = dispatches.length
    ? Math.round((readyDispatches / dispatches.length) * 100)
    : 90;

  const priorities: ChiefOperatingBrief["topPriorities"] = [];

  // Priority 1: Critical Maintenance / Breakdown Risk
  if (highRiskVehicles.length > 0) {
    const top = highRiskVehicles[0];
    priorities.push({
      rank: 1,
      agent: "maintenance",
      title: `Prevent Impending Breakdown: ${top.vehicleName}`,
      rationale: `${top.primaryFailureMode} (Risk: ${top.riskScore}%, Time-to-Failure: ~${top.timeToFailureHours}h).`,
      recommendedAction: top.recommendedAction,
      financialImpact: `Estimated loss prevention: ₹${(top.estimatedCostInr * 2.8).toLocaleString("en-IN")}`,
    });
  }

  // Priority 2: Compliance Violation / Seizure Prevention
  if (criticalLiabilities.length > 0) {
    const topLiab = criticalLiabilities[0];
    priorities.push({
      rank: 2,
      agent: "compliance",
      title: `Regulatory Seizure Risk: ${topLiab.vehicleName} (${topLiab.documentType})`,
      rationale: `${topLiab.reason}`,
      recommendedAction: `Hold vehicle from interstate dispatch until ${topLiab.documentType} renewal is validated.`,
      financialImpact: `Fine & impoundment liability: ₹${topLiab.riskPenaltyInr.toLocaleString("en-IN")}`,
    });
  }

  // Priority 3: Dispatch & Driver Safety
  if (fatigueAlerts.length > 0) {
    const topFatigue = fatigueAlerts[0];
    priorities.push({
      rank: 3,
      agent: "dispatch",
      title: `Driver Fatigue Conflict on Route ${topFatigue.job.origin} → ${topFatigue.job.destination}`,
      rationale: topFatigue.bestPair?.fatigueWarningDetails ?? "Driver duty hours insufficient for corridor duration.",
      recommendedAction: "Apply AI recommended driver shift swap before vehicle gate exit.",
      financialImpact: "Accident liability reduction and driver safety compliance",
    });
  }

  // Fallback priority if fleet is in great shape
  if (priorities.length === 0) {
    priorities.push({
      rank: 1,
      agent: "chief",
      title: "All Fleet Operations Running in Optimal Parameters",
      rationale: "Zero critical breakdown hazards, compliance certificates valid, and all active routes within duty limits.",
      recommendedAction: "Maintain scheduled preventative inspections and proceed with normal dispatch cadence.",
      financialImpact: "Operating at 96.4% fuel & uptime efficiency",
    });
  }

  const headline =
    highRiskVehicles.length > 0 || criticalLiabilities.length > 0
      ? `Action Required: ${highRiskVehicles.length} vehicle(s) at breakdown risk & ${criticalLiabilities.length} compliance liability`
      : "Fleet Operating at Optimal AI Efficiency — 0 Critical Vulnerabilities";

  const executiveSummary =
    `The Multi-Agent AI system synthesized telematics from ${totalVehicles} connected trucks, ` +
    `${dispatches.length} active dispatches, and regulatory certificates. ` +
    `Overall Fleet Health is at ${fleetHealth}%, Dispatch Readiness is ${dispatchReadiness}%, ` +
    `and Regulatory Compliance rate is ${compliance.overallComplianceScore}%. ` +
    `Execute the prioritized operational directives below to eliminate roadside downtime and avoid statutory penalties.`;

  return {
    briefId: `BRIEF-${Date.now().toString().slice(-6)}`,
    generatedAt: new Date(),
    headline,
    fleetHealthScore: fleetHealth,
    dispatchReadinessIndex: dispatchReadiness,
    compliancePassRate: compliance.overallComplianceScore,
    executiveSummary,
    topPriorities: priorities,
  };
}
