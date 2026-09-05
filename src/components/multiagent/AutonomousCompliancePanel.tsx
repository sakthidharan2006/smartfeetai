import { useState } from "react";
import { ComplianceAuditSummary, ComplianceDocument } from "@/lib/multiAgentIntelligence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  FileCheck,
  ShieldAlert,
  ShieldCheck,
  Download,
  Printer,
  AlertTriangle,
  CheckCircle2,
  Clock,
  IndianRupee,
  ClipboardList,
  FileText,
  History,
  Sparkles,
  UserCheck,
  Check,
} from "lucide-react";
import { downloadCsv } from "@/lib/exportCsv";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  summary: ComplianceAuditSummary;
  documents: ComplianceDocument[];
}

interface InspectionSummary {
  id: string;
  vehicle: string;
  plate: string;
  driver: string;
  type: "Pre-Trip Roadworthiness" | "Post-Trip Inspection" | "Interstate Clearance";
  timestamp: string;
  status: "Passed" | "Conditional Pass" | "Action Required";
  score: number;
  items: { name: string; status: "pass" | "caution" | "fail"; reading?: string }[];
  auditedBy: string;
}

interface IncidentNarrative {
  id: string;
  title: string;
  vehicle: string;
  timestamp: string;
  severity: "critical" | "warning" | "advisory";
  category: "Aquaplaning Near-Miss" | "Engine Thermal Drift" | "Border Gate Checkpost";
  narrativeText: string;
  telematicsEvidence: string[];
  preventativeMitigation: string;
}

interface AuditTrailEntry {
  id: string;
  timestamp: string;
  agent: "Chief Coordinator" | "Predictive Maintenance" | "Smart Dispatch" | "Compliance Agent";
  action: string;
  vehicleId: string;
  sha256Hash: string;
  status: "Verified" | "Logged";
}

const MOCK_INSPECTIONS: InspectionSummary[] = [
  {
    id: "INS-2026-0891",
    vehicle: "Tata Prima 4928.S",
    plate: "MH-12-RN-4821",
    driver: "Rajesh Sharma",
    type: "Pre-Trip Roadworthiness",
    timestamp: "Today 05:45 AM",
    status: "Passed",
    score: 98,
    auditedBy: "Autonomous Compliance Agent v2.4",
    items: [
      { name: "Pneumatic Dual-Circuit Brakes", status: "pass", reading: "8.2 bar air reserve" },
      { name: "All 10 TPMS Wheel Pressures", status: "pass", reading: "118-122 PSI" },
      { name: "BS-VI AdBlue DEF Reservoir", status: "pass", reading: "88% level (28L)" },
      { name: "AIS-140 GPS & Panic Button", status: "pass", reading: "Heartbeat synced" },
      { name: "Digital FASTag Electronic Toll Latch", status: "pass", reading: "₹4,200 active balance" },
    ],
  },
  {
    id: "INS-2026-0892",
    vehicle: "Ashok Leyland 4923",
    plate: "GJ-05-CD-5678",
    driver: "Vikram Singh",
    type: "Interstate Clearance",
    timestamp: "Today 07:15 AM",
    status: "Passed",
    score: 95,
    auditedBy: "Autonomous Compliance Agent v2.4",
    items: [
      { name: "All-India National Permit (Form 48)", status: "pass", reading: "Valid to 2026-05" },
      { name: "Commercial Vehicle Insurance", status: "pass", reading: "Policy active" },
      { name: "BS-VI DPF Soot Saturation", status: "pass", reading: "24g / 100g (Clear)" },
      { name: "SLD Speed Governor (80 km/h)", status: "pass", reading: "Calibrated & locked" },
    ],
  },
  {
    id: "INS-2026-0893",
    vehicle: "Mahindra Blazo X 46",
    plate: "RJ-14-EF-9012",
    driver: "Amit Patel",
    type: "Post-Trip Inspection",
    timestamp: "Yesterday 11:30 PM",
    status: "Action Required",
    score: 68,
    auditedBy: "Autonomous Compliance Agent v2.4",
    items: [
      { name: "Quarterly Road Tax Clearance", status: "fail", reading: "Overdue (Hold placed)" },
      { name: "Front Left Brake Pad Lining", status: "caution", reading: "4.1 mm (Near limit)" },
      { name: "Engine Coolant Recovery Reservoir", status: "pass", reading: "Level normal" },
    ],
  },
];

const MOCK_NARRATIVES: IncidentNarrative[] = [
  {
    id: "INC-NAR-4821",
    title: "Khandala Ghat Aquaplaning Telematics Event & Autonomous Mitigation",
    vehicle: "Tata Prima 4928.S (MH-12-RN-4821)",
    timestamp: "Today 06:14 AM",
    severity: "warning",
    category: "Aquaplaning Near-Miss",
    narrativeText:
      "At 06:14:22 AM on Mumbai–Pune NH-48 Borghat descent (km 74.2), telematics sensors registered sudden differential wheel slip on rear tractor axle during heavy 34 mm/h cloudburst precipitation. The vehicle's EBS modulated braking across individual wheels within 240 milliseconds, recovering lateral traction. Concurrently, the Autonomous Dispatch & Weather Radar Agent triggered an immediate in-cab voice speed restriction warning to driver Rajesh Sharma, capping descent speed from 58 km/h to 35 km/h and averting trailer jackknife.",
    telematicsEvidence: [
      "06:14:21 AM: Forward weather radar detected 34 mm/h precipitation (Pavement friction dropped to 0.38).",
      "06:14:22 AM: Wheel speed disparity detected (Drive axle 1: 58 km/h, Drive axle 2: 51 km/h).",
      "06:14:23 AM: Autonomous Safety Agent issued speed cap & low-gear downshift command.",
      "06:14:28 AM: Vehicle stabilized with zero body damage or freight shift.",
    ],
    preventativeMitigation:
      "Auto-assigned Khalapur Freight Layby for pre-scheduled wheel torque verification before continuing haul.",
  },
  {
    id: "INC-NAR-5678",
    title: "NH-48 Dharuhera Low-Visibility Smog Near-Miss & Safe Haven Route",
    vehicle: "Ashok Leyland 4923 (GJ-05-CD-5678)",
    timestamp: "Today 04:30 AM",
    severity: "critical",
    category: "Border Gate Checkpost",
    narrativeText:
      "During early morning transit on Delhi–Jaipur corridor near Neemrana, forward optical sensors and NHAI telemetry reported zero-visibility winter smog (< 25 meters). The Chief Coordinator Agent identified high risk of highway multi-truck pileup. The system automatically overrode the driver's default cruise route and directed the hauler into Neemrana Wayside Commercial Truck Terminal 1.8 km ahead, avoiding high-speed highway congestion.",
    telematicsEvidence: [
      "04:30:10 AM: Ambient visibility plunged from 180m to 22m across a 12 km stretch.",
      "04:30:15 AM: Radar detected 4 stationary trucks in outer lane 350m ahead.",
      "04:30:20 AM: Autonomous Dispatch Agent rerouted truck to exit 74 layby.",
    ],
    preventativeMitigation:
      "Automated SMS notification dispatched to consignee updating delivery SLA by +45 minutes without penalty.",
  },
];

const MOCK_AUDIT_TRAIL: AuditTrailEntry[] = [
  {
    id: "AUD-9901",
    timestamp: "Today 07:18:12 AM",
    agent: "Compliance Agent",
    action: "Generated SHA-256 Digitally Signed CMVR Fleet Audit Certificate (Cert #CERT-2026-0905)",
    vehicleId: "Fleet-Wide",
    sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    status: "Verified",
  },
  {
    id: "AUD-9902",
    timestamp: "Today 06:45:00 AM",
    agent: "Smart Dispatch",
    action: "Dispatched Tata Prima (MH-12-RN-4821) with Suresh Kumar on Mumbai ➔ Pune corridor (Score: 95/100)",
    vehicleId: "MH-12-RN-4821",
    sha256Hash: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
    status: "Verified",
  },
  {
    id: "AUD-9903",
    timestamp: "Today 06:15:30 AM",
    agent: "Predictive Maintenance",
    action: "Automated Work Order WO-2026-081 created for DPF Soot Saturation; reserved Bay 4 & OEM Filter",
    vehicleId: "MH-12-RN-4821",
    sha256Hash: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
    status: "Verified",
  },
  {
    id: "AUD-9904",
    timestamp: "Today 05:50:00 AM",
    agent: "Chief Coordinator",
    action: "Arbitrated conflict: Held Mahindra Blazo from dispatch due to expired Road Tax Section 192A risk",
    vehicleId: "RJ-14-EF-9012",
    sha256Hash: "fb8e20fc2e4c3f248c60c39bd652f3c1347298ab97b8b80d736d7249b38c20e9",
    status: "Verified",
  },
];

export function AutonomousCompliancePanel({ summary, documents }: Props) {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedNarrative, setSelectedNarrative] = useState<IncidentNarrative | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleExportAuditTrail = () => {
    const data = MOCK_AUDIT_TRAIL.map((a) => ({
      Audit_ID: a.id,
      Timestamp: a.timestamp,
      Agent: a.agent,
      Action_Description: a.action,
      Vehicle_Ref: a.vehicleId,
      SHA256_Checksum: a.sha256Hash,
      Integrity_Status: a.status,
    }));
    downloadCsv("SmartFleet_Autonomous_Audit_Trail.csv", data);
    toast.success("Audit Trail Exported", {
      description: "Downloaded immutable CSV log with SHA-256 checksum verification.",
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-500">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Autonomous Compliance & Regulatory Documentation Agent
            </h3>
            <p className="text-xs text-muted-foreground">
              Auto-generates official audit certificates, pre/post-trip inspection summaries, GenAI incident narratives, and immutable action trails.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
            onClick={handleExportAuditTrail}
          >
            <Download className="w-3.5 h-3.5" /> Export Audit Trail (CSV)
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs bg-emerald-600 text-white hover:bg-emerald-700 gap-1.5"
            onClick={() => setReportModalOpen(true)}
          >
            <FileText className="w-3.5 h-3.5" />
            Certify & View Official Audit
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border border-border bg-card">
          <CardContent className="p-3">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Compliance Score</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold font-mono text-emerald-500">{summary.overallComplianceScore}%</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{summary.certifiedVehiclesCount} of {summary.totalVehiclesAudited} vehicles certified</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardContent className="p-3">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Expiring in 30 Days</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold font-mono text-amber-500">{summary.expiringWithin30DaysCount}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Automated renewal queued</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardContent className="p-3">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Expired Violations</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold font-mono text-destructive">{summary.expiredCount}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Immediate impound risk</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardContent className="p-3">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Statutory Liabilities</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold font-mono text-foreground">{summary.activeLiabilitiesCount}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Flagged for dispatch hold</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Compliance Sub-Tabs: Certificate, Inspections, Narratives, Audit Trail */}
      <Tabs defaultValue="certificate" className="space-y-4">
        <TabsList className="bg-muted/60 p-1 border border-border grid grid-cols-2 sm:grid-cols-4 w-full">
          <TabsTrigger value="certificate" className="text-xs gap-1.5 py-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Audit & Liabilities</span>
          </TabsTrigger>
          <TabsTrigger value="inspections" className="text-xs gap-1.5 py-1.5">
            <ClipboardList className="w-3.5 h-3.5 text-sky-500" />
            <span>Inspection Summaries</span>
          </TabsTrigger>
          <TabsTrigger value="narratives" className="text-xs gap-1.5 py-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>GenAI Incident Narratives</span>
          </TabsTrigger>
          <TabsTrigger value="audit-trail" className="text-xs gap-1.5 py-1.5">
            <History className="w-3.5 h-3.5 text-primary" />
            <span>Autonomous Audit Trail</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Audit & Liabilities */}
        <TabsContent value="certificate" className="space-y-4 mt-0">
          {summary.liabilitiesList.length > 0 && (
            <Card className="border border-destructive/30 bg-destructive/5">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-destructive" />
                  <CardTitle className="text-sm font-semibold text-destructive">
                    Active Regulatory Liabilities (MV Act Section 192A Risk)
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {summary.liabilitiesList.map((lia, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-md bg-card/80 border border-destructive/20 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{lia.vehicleName}</span>
                        <Badge variant="outline" className="text-[10px] font-mono border-destructive/30 text-destructive">
                          {lia.plate}
                        </Badge>
                        <span className="uppercase text-[10px] text-muted-foreground font-mono">
                          {lia.documentType}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{lia.reason}</p>
                    </div>
                    <Badge variant="destructive" className="font-mono text-xs">
                      Penalty Risk: ₹{lia.riskPenaltyInr.toLocaleString("en-IN")}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Documents Table */}
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">
                Fleet Document Verification Ledger ({documents.length} Records)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-medium">
                      <th className="py-2 pr-3">Vehicle</th>
                      <th className="py-2 px-3">Document Type</th>
                      <th className="py-2 px-3">Doc Number</th>
                      <th className="py-2 px-3">Expiry Date</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 pl-3">Issuing Authority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {documents.map((doc) => {
                      const isExp = doc.status === "expired";
                      const isSoon = doc.status === "expiring_soon";

                      return (
                        <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2 pr-3 font-mono font-medium">Vehicle #{doc.vehicleId}</td>
                          <td className="py-2 px-3 uppercase font-semibold text-foreground">{doc.documentType.replace("_", " ")}</td>
                          <td className="py-2 px-3 font-mono text-muted-foreground">{doc.documentNumber}</td>
                          <td className="py-2 px-3 font-mono">{doc.expiryDate}</td>
                          <td className="py-2 px-3">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-mono",
                                isExp
                                  ? "bg-destructive/10 text-destructive border-destructive/30"
                                  : isSoon
                                  ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                                  : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                              )}
                            >
                              {isExp ? "Expired" : isSoon ? `Expiring (${doc.daysUntilExpiry}d)` : "Valid"}
                            </Badge>
                          </td>
                          <td className="py-2 pl-3 text-muted-foreground">{doc.issuingAuthority}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Inspection Summaries */}
        <TabsContent value="inspections" className="space-y-3 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {MOCK_INSPECTIONS.map((ins) => (
              <Card key={ins.id} className="border border-border bg-card flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant="outline" className="text-[10px] font-mono border-primary/20 text-primary">
                        {ins.id}
                      </Badge>
                      <CardTitle className="text-sm font-semibold text-foreground mt-1">
                        {ins.vehicle}
                      </CardTitle>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {ins.plate} • {ins.driver}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        "text-[10px] font-mono",
                        ins.status === "Passed"
                          ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                          : "bg-destructive/15 text-destructive border-destructive/30"
                      )}
                      variant="outline"
                    >
                      {ins.status} ({ins.score}%)
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{ins.type} • {ins.timestamp}</span>
                </CardHeader>

                <CardContent className="space-y-2.5 text-xs">
                  <div className="space-y-1.5 p-2 rounded bg-muted/40 border border-border/50">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Critical Checklist Telemetry</p>
                    {ins.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground truncate">{item.name}:</span>
                        <span className="font-mono text-foreground font-medium">{item.reading}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-2 rounded bg-primary/5 border border-primary/10 text-[10px] text-muted-foreground flex items-center justify-between font-mono">
                    <span>Certified: {ins.auditedBy}</span>
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> Signed Off
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 3: GenAI Incident Narratives */}
        <TabsContent value="narratives" className="space-y-3 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MOCK_NARRATIVES.map((nar) => (
              <Card key={nar.id} className="border border-border bg-card space-y-2">
                <CardHeader className="pb-1">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-[10px] font-mono border-amber-500/30 text-amber-500">
                      {nar.category}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">{nar.timestamp}</span>
                  </div>
                  <CardTitle className="text-sm font-semibold text-foreground mt-1">
                    {nar.title}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground font-mono">{nar.vehicle}</p>
                </CardHeader>

                <CardContent className="space-y-3 text-xs">
                  <div className="p-3 rounded-md bg-muted/40 border border-border/60 text-muted-foreground leading-relaxed text-[11px]">
                    <div className="flex items-center gap-1.5 text-foreground font-semibold mb-1">
                      <Sparkles className="w-3 h-3 text-primary" /> Autonomous Telematics Reconstruction:
                    </div>
                    {nar.narrativeText}
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Sensor Correlation Timeline:</p>
                    <ul className="space-y-1 pl-2 text-[10px] text-muted-foreground font-mono border-l-2 border-primary/40">
                      {nar.telematicsEvidence.map((ev, idx) => (
                        <li key={idx} className="pl-1.5">{ev}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-2 rounded bg-emerald-500/5 border border-emerald-500/20 text-[10px] text-muted-foreground">
                    <strong className="text-emerald-500">Preventative Mitigation:</strong> {nar.preventativeMitigation}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 4: Autonomous Operations Audit Trail */}
        <TabsContent value="audit-trail" className="space-y-3 mt-0">
          <Card className="border border-border">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">
                  Immutable Multi-Agent Action Audit Trail
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Tamper-evident chronological record of all autonomous decisions with SHA-256 integrity verification.
                </p>
              </div>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleExportAuditTrail}>
                <Download className="w-3 h-3" /> Export CSV
              </Button>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-medium">
                      <th className="py-2 pr-3">Timestamp</th>
                      <th className="py-2 px-3">Agent</th>
                      <th className="py-2 px-3">Autonomous Action</th>
                      <th className="py-2 px-3">Vehicle</th>
                      <th className="py-2 px-3">SHA-256 Hash</th>
                      <th className="py-2 pl-3">Integrity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono text-[11px]">
                    {MOCK_AUDIT_TRAIL.map((a) => (
                      <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">{a.timestamp}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                            {a.agent}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-foreground font-sans text-xs">{a.action}</td>
                        <td className="py-2 px-3 text-muted-foreground">{a.vehicleId}</td>
                        <td className="py-2 px-3 text-muted-foreground truncate max-w-[140px]" title={a.sha256Hash}>
                          {a.sha256Hash.slice(0, 16)}...
                        </td>
                        <td className="py-2 pl-3">
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
                            <Check className="w-2.5 h-2.5 mr-1" /> {a.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Official Audit Modal */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-500" />
                <DialogTitle className="text-base font-bold">
                  Official Fleet Compliance Audit Certificate
                </DialogTitle>
              </div>
              <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5" /> Print / Save PDF
              </Button>
            </div>
          </DialogHeader>

          <div className="p-4 border rounded-lg bg-card space-y-4 text-xs font-sans">
            <div className="border-b pb-3 flex justify-between items-start">
              <div>
                <h2 className="text-base font-bold text-foreground tracking-tight">SMARTFLEET AI REGULATORY AUDIT</h2>
                <p className="text-muted-foreground text-[11px]">Motor Vehicles Act (1988) & Central Motor Vehicles Rules (CMVR) Compliance</p>
                <p className="text-muted-foreground text-[11px] font-mono mt-1">Certificate ID: {summary.certificateId}</p>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 font-mono text-xs">
                  Score: {summary.overallComplianceScore}%
                </Badge>
                <p className="text-muted-foreground text-[10px] mt-1">Audited: {new Date(summary.generatedAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 p-2.5 rounded bg-muted/40 font-mono text-center">
              <div>
                <span className="text-muted-foreground text-[10px]">Vehicles Inspected</span>
                <p className="text-sm font-bold text-foreground">{summary.totalVehiclesAudited}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-[10px]">Certified Clear</span>
                <p className="text-sm font-bold text-emerald-500">{summary.certifiedVehiclesCount}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-[10px]">Liabilities Flagged</span>
                <p className="text-sm font-bold text-destructive">{summary.activeLiabilitiesCount}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Statutory Audit Findings:</h4>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Total documents scrutinized: {documents.length} (PUC, Fitness, Insurance, National Permit, Road Tax).</li>
                <li>Vehicles with active validity clearance are authorized for interstate commercial operation.</li>
                {summary.expiredCount > 0 ? (
                  <li className="text-destructive font-medium">
                    {summary.expiredCount} vehicle(s) flagged with expired statutory documents. Dispatch held to prevent confiscation under Section 192A.
                  </li>
                ) : (
                  <li className="text-emerald-500 font-medium">Zero expired regulatory documents detected across active operational fleet.</li>
                )}
                <li>{summary.expiringWithin30DaysCount} document(s) scheduled for automated digital renewal within the 30-day grace corridor.</li>
              </ul>
            </div>

            <div className="border-t pt-3 flex justify-between items-end text-[10px] text-muted-foreground font-mono">
              <div>
                <p>Auditing Agent: {summary.regulatorySignOff.auditedByAgent}</p>
                <p>Digital Checksum: {summary.regulatorySignOff.checksum}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">AUTOMATICALLY SIGNED & CERTIFIED</p>
                <p>SmartFleet AI Compliance Gateway</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
