import { useState } from "react";
import { ComplianceAuditSummary, ComplianceDocument } from "@/lib/multiAgentIntelligence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileCheck, ShieldAlert, ShieldCheck, Download, Printer, AlertTriangle, CheckCircle2, Clock, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  summary: ComplianceAuditSummary;
  documents: ComplianceDocument[];
}

export function AutonomousCompliancePanel({ summary, documents }: Props) {
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const handlePrint = () => {
    window.print();
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
              Autonomous Compliance & Audit Generator
            </h3>
            <p className="text-xs text-muted-foreground">
              Audits vehicle PUC, fitness, national permits, and insurance policies against Motor Vehicles Act standards.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-8 text-xs bg-emerald-600 text-white hover:bg-emerald-700 gap-1.5"
            onClick={() => setReportModalOpen(true)}
          >
            <Download className="w-3.5 h-3.5" />
            Export Certified Audit Report
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border border-border">
          <CardContent className="p-3">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Compliance Score</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold font-mono text-emerald-500">{summary.overallComplianceScore}%</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{summary.certifiedVehiclesCount} of {summary.totalVehiclesAudited} vehicles certified</p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-3">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Expiring in 30 Days</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold font-mono text-amber-500">{summary.expiringWithin30DaysCount}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Automated renewal queued</p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-3">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Expired Violations</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold font-mono text-destructive">{summary.expiredCount}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Immediate impound risk</p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-3">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Statutory Liabilities</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold font-mono text-foreground">{summary.activeLiabilitiesCount}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Flagged for dispatch hold</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Compliance Liabilities */}
      {summary.liabilitiesList.length > 0 && (
        <Card className="border border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-destructive" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Critical Regulatory Liabilities (Immediate Dispatch Hold Required)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.liabilitiesList.map((liab, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-md border border-destructive/20 bg-background/80 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <span>{liab.vehicleName}</span>
                    <Badge variant="outline" className="text-[10px] font-mono border-destructive/40 text-destructive">
                      {liab.plate}
                    </Badge>
                    <Badge variant="destructive" className="text-[10px]">
                      {liab.documentType} EXPIRED
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{liab.reason}</p>
                </div>

                <div className="text-right">
                  <span className="font-mono text-destructive font-semibold">
                    Potential Fine: ₹{liab.riskPenaltyInr.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Document Ledger Table */}
      <Card className="border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">
            Vehicle Document Ledger & Expiry Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/80 text-muted-foreground font-medium">
                  <th className="py-2 pr-3">Vehicle ID</th>
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
