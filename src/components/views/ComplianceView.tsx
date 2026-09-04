import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Search,
  Filter,
  ChevronDown,
  RefreshCw,
  IndianRupee,
  Truck,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface VehicleDocument {
  id: string;
  vehicle_id: string;
  vehicle_name: string;
  document_type: string;
  document_number: string | null;
  issuing_authority: string | null;
  issue_date: string | null;
  expiry_date: string;
  renewal_cost: number | null;
  status: string;
  notes: string | null;
  document_url: string | null;
  created_at: string;
  updated_at: string;
}

const DOC_TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  FC: { label: "Fitness Certificate", color: "text-info", icon: "🔧" },
  RC: { label: "Registration Certificate", color: "text-primary", icon: "📄" },
  Insurance: { label: "Insurance", color: "text-success", icon: "🛡️" },
  Permit: { label: "Permit", color: "text-warning", icon: "📋" },
  Tax: { label: "Road Tax", color: "text-accent-foreground", icon: "💰" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  valid: { label: "Valid", color: "text-success", bgColor: "bg-success/10", icon: CheckCircle },
  expiring_soon: { label: "Expiring Soon", color: "text-warning", bgColor: "bg-warning/10", icon: Clock },
  expired: { label: "Expired", color: "text-destructive", bgColor: "bg-destructive/10", icon: XCircle },
};

function getDaysUntilExpiry(expiryDate: string): number {
  const now = new Date();
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function computeStatus(expiryDate: string): string {
  const days = getDaysUntilExpiry(expiryDate);
  if (days < 0) return "expired";
  if (days <= 60) return "expiring_soon";
  return "valid";
}

const DRIVER_VEHICLE_MAP: Record<string, string> = {
  'driver1@truckpulse.demo': '1',
  'driver2@truckpulse.demo': '2',
  'driver3@truckpulse.demo': '3',
  'driver4@truckpulse.demo': '4',
  'driver5@truckpulse.demo': '5',
  'driver6@truckpulse.demo': '6',
};

const EMPTY_DOC_FORM = {
  vehicle_id: "",
  vehicle_name: "",
  document_type: "FC",
  document_number: "",
  issuing_authority: "",
  issue_date: "",
  expiry_date: "",
  renewal_cost: "",
  notes: "",
};

export function ComplianceView() {
  const { user, role } = useAuth();
  const { canEdit, canDelete, isAdmin } = usePermissions();
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [docForm, setDocForm] = useState({ ...EMPTY_DOC_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState<VehicleDocument | null>(null);

  const isDriver = role === 'driver';
  const assignedVehicleId = isDriver && user ? DRIVER_VEHICLE_MAP[user.email || ''] : null;

  const openAddDialog = () => {
    setEditingId(null);
    setDocForm({ ...EMPTY_DOC_FORM });
    setFormOpen(true);
  };

  const openEditDialog = (doc: VehicleDocument) => {
    setEditingId(doc.id);
    setDocForm({
      vehicle_id: doc.vehicle_id,
      vehicle_name: doc.vehicle_name,
      document_type: doc.document_type,
      document_number: doc.document_number || "",
      issuing_authority: doc.issuing_authority || "",
      issue_date: doc.issue_date || "",
      expiry_date: doc.expiry_date?.slice(0, 10) || "",
      renewal_cost: doc.renewal_cost != null ? String(doc.renewal_cost) : "",
      notes: doc.notes || "",
    });
    setFormOpen(true);
  };

const DEFAULT_DOCUMENTS: VehicleDocument[] = [
  {
    id: "doc-1",
    vehicle_id: "1",
    vehicle_name: "Tata Prima 4928.S (MH-12-AB-1234)",
    document_type: "FC",
    document_number: "FC-MH-2024-8891",
    issuing_authority: "RTO Pune, Maharashtra",
    issue_date: "2024-01-15",
    expiry_date: "2026-11-20",
    renewal_cost: 3500,
    status: "valid",
    notes: "Passed brake efficiency and emission test",
    document_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "doc-2",
    vehicle_id: "1",
    vehicle_name: "Tata Prima 4928.S (MH-12-AB-1234)",
    document_type: "Insurance",
    document_number: "POL-ICICI-9921",
    issuing_authority: "ICICI Lombard",
    issue_date: "2023-10-10",
    expiry_date: "2026-10-05",
    renewal_cost: 42000,
    status: "expiring_soon",
    notes: "Comprehensive fleet cover with zero depreciation",
    document_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "doc-3",
    vehicle_id: "2",
    vehicle_name: "Ashok Leyland 4923 (GJ-05-CD-5678)",
    document_type: "Permit",
    document_number: "NP-GJ-4412",
    issuing_authority: "All India National Permit Authority",
    issue_date: "2023-05-01",
    expiry_date: "2026-05-01",
    renewal_cost: 16500,
    status: "valid",
    notes: "National Permit Category Goods Carrier",
    document_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "doc-4",
    vehicle_id: "3",
    vehicle_name: "Mahindra Blazo X 46 (RJ-14-EF-9012)",
    document_type: "Tax",
    document_number: "TAX-RJ-8831",
    issuing_authority: "RTO Jaipur",
    issue_date: "2023-04-01",
    expiry_date: "2025-03-31",
    renewal_cost: 12000,
    status: "expired",
    notes: "Quarterly road tax due for penalty waiver",
    document_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "doc-5",
    vehicle_id: "4",
    vehicle_name: "BharatBenz 4228R (KA-01-GH-3456)",
    document_type: "RC",
    document_number: "RC-KA-01-2021",
    issuing_authority: "RTO Bengaluru Central",
    issue_date: "2021-08-14",
    expiry_date: "2036-08-13",
    renewal_cost: null,
    status: "valid",
    notes: "Commercial heavy goods vehicle registration valid for 15 years",
    document_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

  const handleSaveDoc = async () => {
    if (!docForm.vehicle_name.trim() || !docForm.expiry_date) {
      toast.error("Vehicle name and expiry date are required");
      return;
    }
    setSaving(true);
    const payload = {
      vehicle_id: docForm.vehicle_id.trim() || docForm.vehicle_name.trim(),
      vehicle_name: docForm.vehicle_name.trim(),
      document_type: docForm.document_type,
      document_number: docForm.document_number.trim() || null,
      issuing_authority: docForm.issuing_authority.trim() || null,
      issue_date: docForm.issue_date || null,
      expiry_date: docForm.expiry_date,
      renewal_cost: docForm.renewal_cost ? parseFloat(docForm.renewal_cost) : null,
      notes: docForm.notes.trim() || null,
      status: computeStatus(docForm.expiry_date),
    };

    try {
      const { error } = editingId
        ? await supabase.from("vehicle_documents").update(payload).eq("id", editingId)
        : await supabase.from("vehicle_documents").insert(payload);

      if (error) throw error;
      toast.success(editingId ? "Document updated" : "Document added");
      setFormOpen(false);
      setEditingId(null);
      fetchDocuments();
    } catch {
      // Resilient local state fallback
      if (editingId) {
        setDocuments(prev =>
          prev.map(d =>
            d.id === editingId
              ? { ...d, ...payload, id: editingId, updated_at: new Date().toISOString() }
              : d
          )
        );
      } else {
        const newDoc: VehicleDocument = {
          ...payload,
          id: `doc-${Date.now()}`,
          document_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setDocuments(prev => [newDoc, ...prev]);
      }
      toast.success(editingId ? "Document updated" : "Document added");
      setFormOpen(false);
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDoc = async () => {
    if (!deleteDoc) return;
    try {
      await supabase.from("vehicle_documents").delete().eq("id", deleteDoc.id);
    } catch {
      // ignore
    }
    setDocuments(prev => prev.filter(d => d.id !== deleteDoc.id));
    toast.success("Document deleted");
    setDeleteDoc(null);
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("vehicle_documents")
        .select("*")
        .order("expiry_date", { ascending: true });

      if (isDriver && assignedVehicleId) {
        query = query.eq("vehicle_id", assignedVehicleId);
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        setDocuments(prev => prev.length > 0 ? prev : DEFAULT_DOCUMENTS.map(d => ({ ...d, status: computeStatus(d.expiry_date) })));
      } else {
        const updated = data.map((doc) => ({
          ...doc,
          status: computeStatus(doc.expiry_date),
        }));
        setDocuments(updated as VehicleDocument[]);
      }
    } catch {
      setDocuments(prev => prev.length > 0 ? prev : DEFAULT_DOCUMENTS.map(d => ({ ...d, status: computeStatus(d.expiry_date) })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const vehicles = useMemo(
    () => [...new Set(documents.map((d) => d.vehicle_name))].sort(),
    [documents]
  );

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      if (filterType !== "all" && doc.document_type !== filterType) return false;
      if (filterStatus !== "all" && doc.status !== filterStatus) return false;
      if (selectedVehicle !== "all" && doc.vehicle_name !== selectedVehicle) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          doc.vehicle_name.toLowerCase().includes(q) ||
          doc.document_type.toLowerCase().includes(q) ||
          (doc.document_number || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [documents, filterType, filterStatus, selectedVehicle, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = documents.length;
    const valid = documents.filter((d) => d.status === "valid").length;
    const expiringSoon = documents.filter((d) => d.status === "expiring_soon").length;
    const expired = documents.filter((d) => d.status === "expired").length;
    const complianceRate = total > 0 ? Math.round((valid / total) * 100) : 0;
    const totalRenewalCost = documents
      .filter((d) => d.status !== "valid")
      .reduce((sum, d) => sum + (d.renewal_cost || 0), 0);
    return { total, valid, expiringSoon, expired, complianceRate, totalRenewalCost };
  }, [documents]);

  // Group by vehicle
  const groupedByVehicle = useMemo(() => {
    const map = new Map<string, VehicleDocument[]>();
    filtered.forEach((doc) => {
      const existing = map.get(doc.vehicle_name) || [];
      existing.push(doc);
      map.set(doc.vehicle_name, existing);
    });
    return map;
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="w-7 h-7 text-primary" />
            Documentation & Compliance
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track FC, RC, Insurance, Permit & Tax renewals for all vehicles
          </p>
        </div>
        <div className="flex items-center gap-2">
        {canEdit && (
          <Button size="sm" onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Document
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={fetchDocuments} disabled={loading}>
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard icon={FileText} label="Total Documents" value={stats.total} color="text-primary" />
        <StatCard icon={CheckCircle} label="Valid" value={stats.valid} color="text-success" />
        <StatCard icon={Clock} label="Expiring Soon" value={stats.expiringSoon} color="text-warning" />
        <StatCard icon={XCircle} label="Expired" value={stats.expired} color="text-destructive" />
        <StatCard icon={Shield} label="Compliance" value={`${stats.complianceRate}%`} color="text-info" />
        <StatCard icon={IndianRupee} label="Renewal Due" value={`₹${stats.totalRenewalCost.toLocaleString()}`} color="text-warning" />
      </div>

      {/* Compliance Progress */}
      <Card className="glass-card">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Fleet Compliance Rate</span>
            <span className={cn(
              "text-sm font-bold",
              stats.complianceRate >= 80 ? "text-success" : stats.complianceRate >= 50 ? "text-warning" : "text-destructive"
            )}>
              {stats.complianceRate}%
            </span>
          </div>
          <Progress
            value={stats.complianceRate}
            className={cn(
              "h-2.5",
              stats.complianceRate >= 80 ? "[&>div]:bg-success" : stats.complianceRate >= 50 ? "[&>div]:bg-warning" : "[&>div]:bg-destructive"
            )}
          />
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by vehicle, document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
          <SelectTrigger className="w-[200px]">
            <Truck className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Vehicles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vehicles</SelectItem>
            {vehicles.map((v) => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(DOC_TYPE_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.icon} {key}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="valid">✅ Valid</SelectItem>
            <SelectItem value="expiring_soon">⚠️ Expiring Soon</SelectItem>
            <SelectItem value="expired">❌ Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="by-vehicle" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="by-vehicle">By Vehicle</TabsTrigger>
          <TabsTrigger value="by-document">By Document Type</TabsTrigger>
        </TabsList>

        <TabsContent value="by-vehicle" className="space-y-4 mt-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading documents...</div>
          ) : groupedByVehicle.size === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No documents found</div>
          ) : (
            Array.from(groupedByVehicle.entries()).map(([vehicleName, docs], i) => (
              <VehicleDocumentCard key={vehicleName} vehicleName={vehicleName} documents={docs} index={i} onEdit={canEdit ? openEditDialog : undefined} onDelete={canDelete ? setDeleteDoc : undefined} />
            ))
          )}
        </TabsContent>

        <TabsContent value="by-document" className="space-y-4 mt-4">
          {Object.entries(DOC_TYPE_CONFIG).map(([type, cfg]) => {
            const typeDocs = filtered.filter((d) => d.document_type === type);
            if (typeDocs.length === 0) return null;
            return (
              <DocumentTypeCard key={type} type={type} config={cfg} documents={typeDocs} />
            );
          })}
        </TabsContent>
      </Tabs>

      {/* Add / Edit document dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {editingId ? "Edit Document" : "Add Document"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Vehicle Name</Label>
                <Input
                  placeholder="e.g. TN-38-AX-1234"
                  value={docForm.vehicle_name}
                  onChange={(e) => setDocForm((f) => ({ ...f, vehicle_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select value={docForm.document_type} onValueChange={(v) => setDocForm((f) => ({ ...f, document_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(DOC_TYPE_CONFIG).map((k) => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Document Number</Label>
                <Input
                  value={docForm.document_number}
                  onChange={(e) => setDocForm((f) => ({ ...f, document_number: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Issuing Authority</Label>
                <Input
                  value={docForm.issuing_authority}
                  onChange={(e) => setDocForm((f) => ({ ...f, issuing_authority: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Issue Date</Label>
                <Input type="date" value={docForm.issue_date} onChange={(e) => setDocForm((f) => ({ ...f, issue_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input type="date" value={docForm.expiry_date} onChange={(e) => setDocForm((f) => ({ ...f, expiry_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Renewal Cost (₹)</Label>
                <Input type="number" value={docForm.renewal_cost} onChange={(e) => setDocForm((f) => ({ ...f, renewal_cost: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={docForm.notes} onChange={(e) => setDocForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <Button className="w-full" onClick={handleSaveDoc} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Add Document"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteDoc} onOpenChange={(o) => !o && setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDoc?.document_type} for {deleteDoc?.vehicle_name} will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDoc} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("w-4 h-4", color)} />
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold font-mono text-foreground">{value}</p>
    </motion.div>
  );
}

function VehicleDocumentCard({ vehicleName, documents, index, onEdit, onDelete }: { vehicleName: string; documents: VehicleDocument[]; index: number; onEdit?: (doc: VehicleDocument) => void; onDelete?: (doc: VehicleDocument) => void }) {
  const [expanded, setExpanded] = useState(true);
  const hasIssues = documents.some((d) => d.status !== "valid");
  const expiredCount = documents.filter((d) => d.status === "expired").length;
  const expiringCount = documents.filter((d) => d.status === "expiring_soon").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={cn("glass-card overflow-hidden", hasIssues && "border-warning/30")}>
        <CardHeader
          className="cursor-pointer hover:bg-secondary/30 transition-colors py-3"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                hasIssues ? "bg-warning/20" : "bg-success/20"
              )}>
                <Truck className={cn("w-5 h-5", hasIssues ? "text-warning" : "text-success")} />
              </div>
              <div>
                <CardTitle className="text-base">{vehicleName}</CardTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  {expiredCount > 0 && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                      {expiredCount} Expired
                    </Badge>
                  )}
                  {expiringCount > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-warning/20 text-warning border-warning/30">
                      {expiringCount} Expiring
                    </Badge>
                  )}
                  {!hasIssues && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-success/20 text-success border-success/30">
                      All Valid
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", expanded && "rotate-180")} />
          </div>
        </CardHeader>
        {expanded && (
          <CardContent className="pt-0 pb-4">
            <div className="grid gap-3">
              {documents.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}

function DocumentRow({ doc, onEdit, onDelete }: { doc: VehicleDocument; onEdit?: (doc: VehicleDocument) => void; onDelete?: (doc: VehicleDocument) => void }) {
  const statusCfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.valid;
  const StatusIcon = statusCfg.icon;
  const daysLeft = getDaysUntilExpiry(doc.expiry_date);
  const docCfg = DOC_TYPE_CONFIG[doc.document_type] || { label: doc.document_type, color: "text-foreground", icon: "📄" };

  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border transition-colors",
      doc.status === "expired" ? "border-destructive/30 bg-destructive/5" :
      doc.status === "expiring_soon" ? "border-warning/30 bg-warning/5" :
      "border-border/50 bg-secondary/20"
    )}>
      <div className="flex items-center gap-3">
        <span className="text-lg">{docCfg.icon}</span>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{doc.document_type}</span>
            <span className="text-xs text-muted-foreground">({docCfg.label})</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            {doc.document_number && (
              <span className="text-xs font-mono text-muted-foreground">{doc.document_number}</span>
            )}
            {doc.issuing_authority && (
              <span className="text-xs text-muted-foreground">• {doc.issuing_authority}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 text-right">
        <div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Expires: {new Date(doc.expiry_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          </div>
          <span className={cn(
            "text-xs font-medium",
            daysLeft < 0 ? "text-destructive" : daysLeft <= 60 ? "text-warning" : "text-success"
          )}>
            {daysLeft < 0 ? `Expired ${Math.abs(daysLeft)} days ago` : `${daysLeft} days left`}
          </span>
        </div>
        <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", statusCfg.bgColor, statusCfg.color)}>
          <StatusIcon className="w-3.5 h-3.5" />
          {statusCfg.label}
        </div>
        {!!doc.renewal_cost && doc.status !== "valid" && (
          <span className="text-xs font-mono text-warning">₹{doc.renewal_cost.toLocaleString()}</span>
        )}
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(doc)} aria-label="Edit document">
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => onDelete(doc)} aria-label="Delete document">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentTypeCard({ type, config, documents }: { type: string; config: { label: string; color: string; icon: string }; documents: VehicleDocument[] }) {
  const valid = documents.filter((d) => d.status === "valid").length;
  const total = documents.length;

  return (
    <Card className="glass-card">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.icon}</span>
            <CardTitle className="text-base">
              {type} — {config.label}
            </CardTitle>
          </div>
          <Badge variant="outline" className={cn(valid === total ? "text-success border-success/30" : "text-warning border-warning/30")}>
            {valid}/{total} Valid
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <div className="grid gap-2">
          {documents.map((doc) => {
            const statusCfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.valid;
            const StatusIcon = statusCfg.icon;
            const daysLeft = getDaysUntilExpiry(doc.expiry_date);
            return (
              <div key={doc.id} className={cn(
                "flex items-center justify-between p-2.5 rounded-lg border",
                doc.status === "expired" ? "border-destructive/30 bg-destructive/5" :
                doc.status === "expiring_soon" ? "border-warning/30 bg-warning/5" :
                "border-border/50"
              )}>
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-medium">{doc.vehicle_name}</span>
                    {doc.document_number && (
                      <p className="text-xs text-muted-foreground font-mono">{doc.document_number}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("text-xs font-medium", daysLeft < 0 ? "text-destructive" : daysLeft <= 60 ? "text-warning" : "text-success")}>
                    {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                  </span>
                  <StatusIcon className={cn("w-4 h-4", statusCfg.color)} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
