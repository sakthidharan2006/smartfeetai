import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSimulation } from "@/contexts/SimulationContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AgentId,
  AgentInsight,
  ChiefOperatingBrief,
  ComplianceAuditSummary,
  ComplianceDocument,
  DispatchJob,
  DispatchRecommendation,
  MaintenancePrediction,
  RawDriver,
  RawVehicleTelemetry,
  evaluateComplianceAudit,
  evaluateDispatchOptimization,
  evaluatePredictiveMaintenance,
  synthesizeChiefBrief,
} from "@/lib/multiAgentIntelligence";

const INITIAL_DISPATCH_JOBS: DispatchJob[] = [
  {
    id: "JOB-101",
    origin: "Bhiwandi Logistics Hub, Mumbai",
    destination: "Chakan Industrial Zone, Pune",
    distanceKm: 165,
    estimatedDurationHours: 3.5,
    cargoDescription: "Automotive Precision Assemblies & Engine Blocks",
    weightTons: 18.5,
    priority: "urgent",
    scheduledDeparture: "Today, 14:00",
    status: "pending",
  },
  {
    id: "JOB-102",
    origin: "Sanand GIDC, Ahmedabad",
    destination: "Hazira Port, Surat",
    distanceKm: 275,
    estimatedDurationHours: 4.8,
    cargoDescription: "Chemical Polymer Pellets (Export Container)",
    weightTons: 24.0,
    priority: "high",
    scheduledDeparture: "Today, 16:30",
    status: "pending",
  },
  {
    id: "JOB-103",
    origin: "Whitefield ICD, Bengaluru",
    destination: "Sriperumbudur Auto Cluster, Chennai",
    distanceKm: 340,
    estimatedDurationHours: 6.2,
    cargoDescription: "Solar Inverters & Lithium Battery Packs",
    weightTons: 15.2,
    priority: "normal",
    scheduledDeparture: "Tomorrow, 06:00",
    status: "pending",
  },
  {
    id: "JOB-104",
    origin: "Okhla Phase III, New Delhi",
    destination: "Sitapura Industrial Area, Jaipur",
    distanceKm: 290,
    estimatedDurationHours: 5.1,
    cargoDescription: "High-Value Consumer Electronics & Displays",
    weightTons: 11.8,
    priority: "high",
    scheduledDeparture: "Tomorrow, 08:00",
    status: "pending",
  },
];

const INITIAL_DRIVERS: RawDriver[] = [
  { id: "DRV-1", name: "Suresh Kumar", vehiclePlate: "MH-12-AB-1234", status: "on-duty", score: 94, hoursRemaining: 7.0 },
  { id: "DRV-2", name: "Amit Patel", vehiclePlate: "GJ-05-CD-5678", status: "on-duty", score: 88, hoursRemaining: 4.2 },
  { id: "DRV-3", name: "Ravi Verma", vehiclePlate: "RJ-14-EF-9012", status: "off-duty", score: 91, hoursRemaining: 10.5 },
  { id: "DRV-4", name: "Vikram Singh", vehiclePlate: "KA-01-GH-3456", status: "on-duty", score: 84, hoursRemaining: 3.5 },
  { id: "DRV-5", name: "Manoj Yadav", vehiclePlate: "TN-09-IJ-7890", status: "resting", score: 92, hoursRemaining: 8.0 },
  { id: "DRV-6", name: "Gurpreet Singh", vehiclePlate: "DL-01-KL-2345", status: "on-duty", score: 96, hoursRemaining: 6.5 },
];

const SEED_DOCUMENTS: ComplianceDocument[] = [
  { id: "DOC-1", vehicleId: "1", documentType: "puc", documentNumber: "PUC-MH12-9842", expiryDate: "2026-11-15", status: "valid", daysUntilExpiry: 72, issuingAuthority: "RTO Pune, Maharashtra" },
  { id: "DOC-2", vehicleId: "1", documentType: "fitness", documentNumber: "FIT-MH12-2309", expiryDate: "2027-02-28", status: "valid", daysUntilExpiry: 178, issuingAuthority: "RTO Pune" },
  { id: "DOC-3", vehicleId: "2", documentType: "national_permit", documentNumber: "NP-GJ05-4412", expiryDate: "2026-09-14", status: "expiring_soon", daysUntilExpiry: 11, issuingAuthority: "Transport Commissioner Gujarat" },
  { id: "DOC-4", vehicleId: "2", documentType: "insurance", documentNumber: "INS-GJ05-9988", expiryDate: "2026-12-31", status: "valid", daysUntilExpiry: 118, issuingAuthority: "New India Assurance" },
  { id: "DOC-5", vehicleId: "4", documentType: "puc", documentNumber: "PUC-KA01-1120", expiryDate: "2026-08-20", status: "expired", daysUntilExpiry: -14, issuingAuthority: "RTO Bangalore Central" },
  { id: "DOC-6", vehicleId: "4", documentType: "road_tax", documentNumber: "TAX-KA01-7781", expiryDate: "2026-10-30", status: "valid", daysUntilExpiry: 56, issuingAuthority: "Karnataka Transport Dept" },
  { id: "DOC-7", vehicleId: "5", documentType: "fitness", documentNumber: "FIT-TN09-6612", expiryDate: "2026-09-10", status: "expiring_soon", daysUntilExpiry: 7, issuingAuthority: "RTO Chennai South" },
  { id: "DOC-8", vehicleId: "6", documentType: "insurance", documentNumber: "INS-DL01-5544", expiryDate: "2027-01-15", status: "valid", daysUntilExpiry: 134, issuingAuthority: "ICICI Lombard" },
];

export function useMultiAgentIntelligence() {
  const { vehicleCards, isDriver } = useSimulation();

  const [jobs, setJobs] = useState<DispatchJob[]>(INITIAL_DISPATCH_JOBS);
  const [drivers, setDrivers] = useState<RawDriver[]>(INITIAL_DRIVERS);
  const [documents, setDocuments] = useState<ComplianceDocument[]>(SEED_DOCUMENTS);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeAgentFilter, setActiveAgentFilter] = useState<AgentId | "all">("all");
  const [lastRunTime, setLastRunTime] = useState<Date>(new Date());
  const [insights, setInsights] = useState<AgentInsight[]>([]);

  // Telemetry mapper
  const rawTelemetry: RawVehicleTelemetry[] = useMemo(() => {
    return vehicleCards.map((v) => ({
      id: v.id,
      name: v.name,
      plate: v.plate,
      status: v.status,
      speed: v.speed,
      engineTemp: v.engineTemp,
      fuelLevel: v.fuel,
      tirePressure: {
        frontLeft: v.tirePressure.fl,
        frontRight: v.tirePressure.fr,
        rearLeft: v.tirePressure.rl,
        rearRight: v.tirePressure.rr,
      },
      adBlueLevel: v.adBlueLevel,
      dpfSootLoad: v.id === "4" ? 82 : v.id === "2" ? 65 : 28,
      scrEfficiency: v.id === "4" ? 81 : 96,
      mileage: v.mileage,
    }));
  }, [vehicleCards]);

  // Evaluate Agents
  const predictions: MaintenancePrediction[] = useMemo(() => {
    return evaluatePredictiveMaintenance(rawTelemetry);
  }, [rawTelemetry]);

  const dispatches: DispatchRecommendation[] = useMemo(() => {
    return evaluateDispatchOptimization(jobs, rawTelemetry, drivers, predictions);
  }, [jobs, rawTelemetry, drivers, predictions]);

  const complianceSummary: ComplianceAuditSummary = useMemo(() => {
    return evaluateComplianceAudit(documents, rawTelemetry);
  }, [documents, rawTelemetry]);

  const chiefBrief: ChiefOperatingBrief = useMemo(() => {
    return synthesizeChiefBrief(predictions, dispatches, complianceSummary, rawTelemetry.length);
  }, [predictions, dispatches, complianceSummary, rawTelemetry.length]);

  // Seed Initial Insights based on agent analysis
  useEffect(() => {
    const initialInsights: AgentInsight[] = [];

    // Predictive Maintenance Insights
    const topRisk = predictions[0];
    if (topRisk && topRisk.riskScore >= 50) {
      initialInsights.push({
        id: `INS-MAINT-${topRisk.vehicleId}`,
        agent: "maintenance",
        title: `Impending Component Failure: ${topRisk.vehicleName}`,
        summary: `Sensor telemetry indicates ${topRisk.primaryFailureMode}. Estimated Time-to-Failure: ~${topRisk.timeToFailureHours}h. Failure risk score: ${topRisk.riskScore}%.`,
        recommendations: [
          topRisk.recommendedAction,
          "Flag vehicle to prevent long-distance assignment until inspected",
          `Prepare garage work order (Est. repair: ₹${topRisk.estimatedCostInr.toLocaleString("en-IN")})`,
        ],
        severity: topRisk.riskScore >= 70 ? "critical" : "warning",
        riskScore: topRisk.riskScore,
        vehicleId: topRisk.vehicleId,
        vehicleName: topRisk.vehicleName,
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        status: "open",
        actionType: "maintenance_work_order",
        actionPayload: { vehicleId: topRisk.vehicleId, task: topRisk.primaryFailureMode, priority: topRisk.urgency },
      });
    }

    // Dispatch Optimization Insights
    const fatigueJob = dispatches.find((d) => d.bestPair?.hasFatigueWarning);
    if (fatigueJob && fatigueJob.bestPair) {
      initialInsights.push({
        id: `INS-DISP-${fatigueJob.job.id}`,
        agent: "dispatch",
        title: `Dispatch Conflict Detected on ${fatigueJob.job.origin} → ${fatigueJob.job.destination}`,
        summary: fatigueJob.bestPair.fatigueWarningDetails || "Driver duty hours limit exceeded.",
        recommendations: [
          "Swap to alternate secondary driver with 8+ duty hours remaining",
          "Authorize dispatch after mandatory 8-hour rest break interval",
          "Alternative route available saving 35 minutes via Expressway bypass",
        ],
        severity: "warning",
        riskScore: 65,
        vehicleId: fatigueJob.bestPair.vehicleId,
        vehicleName: fatigueJob.bestPair.vehicleName,
        driverId: fatigueJob.bestPair.driverId,
        driverName: fatigueJob.bestPair.driverName,
        timestamp: new Date(Date.now() - 35 * 60 * 1000),
        status: "open",
        actionType: "execute_dispatch",
        actionPayload: { jobId: fatigueJob.job.id, vehicleId: fatigueJob.bestPair.vehicleId, driverId: fatigueJob.bestPair.driverId },
      });
    }

    // Compliance Audit Insights
    if (complianceSummary.liabilitiesList.length > 0) {
      const topLiab = complianceSummary.liabilitiesList[0];
      initialInsights.push({
        id: `INS-COMP-${topLiab.plate}`,
        agent: "compliance",
        title: `Regulatory Non-Compliance: ${topLiab.vehicleName} (${topLiab.documentType})`,
        summary: topLiab.reason,
        recommendations: [
          `Initiate fast-track ${topLiab.documentType} renewal with authorized RTO portal`,
          "Hold dispatch approval to prevent impoundment and statutory fine",
          "Automated digital renewal documentation generated and ready for submission",
        ],
        severity: "critical",
        riskScore: 88,
        vehicleName: topLiab.vehicleName,
        timestamp: new Date(Date.now() - 50 * 60 * 1000),
        status: "open",
        actionType: "renew_document",
        actionPayload: { plate: topLiab.plate, documentType: topLiab.documentType },
      });
    }

    setInsights(initialInsights);
  }, [predictions, dispatches, complianceSummary]);

  // Action Handlers
  const runAllAgents = useCallback(() => {
    setIsAnalyzing(true);
    toast.info("Multi-Agent AI Analysis Initiated", {
      description: "Predictive Maintenance, Dispatch, and Compliance agents analyzing fleet telemetry...",
    });

    setTimeout(() => {
      setIsAnalyzing(false);
      setLastRunTime(new Date());
      toast.success("Multi-Agent Analysis Complete", {
        description: `Chief AI Coordinator synthesized brief: ${chiefBrief.headline}`,
      });
    }, 1200);
  }, [chiefBrief.headline]);

  const applyDispatchRecommendation = useCallback((jobId: string, vehicleId: string, driverId: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, assignedVehicleId: vehicleId, assignedDriverId: driverId, status: "dispatched" } : j))
    );
    const matchedJob = jobs.find((j) => j.id === jobId);
    const matchedDriver = drivers.find((d) => String(d.id) === driverId);
    toast.success("AI Dispatch Recommendation Executed", {
      description: `Dispatched ${matchedJob?.origin || "trip"} to ${matchedJob?.destination} with driver ${matchedDriver?.name || driverId}.`,
    });
  }, [jobs, drivers]);

  const schedulePreventativeMaintenance = useCallback((vehicleId: string, task: string, priority: string) => {
    toast.success("Maintenance Work Order Auto-Generated", {
      description: `Preventative order scheduled for Vehicle #${vehicleId}: ${task} (Priority: ${priority.toUpperCase()}). Vehicle placed on maintenance hold.`,
    });

    // Mark corresponding insight resolved if present
    setInsights((prev) =>
      prev.map((ins) => (ins.vehicleId === vehicleId && ins.agent === "maintenance" ? { ...ins, status: "resolved" } : ins))
    );
  }, []);

  const acknowledgeInsight = useCallback((id: string) => {
    setInsights((prev) => prev.map((ins) => (ins.id === id ? { ...ins, status: "acknowledged" } : ins)));
    toast.info("Insight acknowledged");
  }, []);

  const resolveInsight = useCallback((id: string) => {
    setInsights((prev) => prev.map((ins) => (ins.id === id ? { ...ins, status: "resolved" } : ins)));
    toast.success("Insight marked as resolved");
  }, []);

  return {
    isDriver,
    rawTelemetry,
    predictions,
    dispatches,
    complianceSummary,
    chiefBrief,
    insights,
    jobs,
    drivers,
    documents,
    isAnalyzing,
    lastRunTime,
    activeAgentFilter,
    setActiveAgentFilter,
    runAllAgents,
    applyDispatchRecommendation,
    schedulePreventativeMaintenance,
    acknowledgeInsight,
    resolveInsight,
  };
}
