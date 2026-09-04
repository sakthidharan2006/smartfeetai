import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSimulation } from '@/contexts/SimulationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  Upload,
  FileText,
  MapPin,
  Truck,
  Weight,
  IndianRupee,
  Plus,
  Image,
  Loader2,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Pencil,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { downloadCsv } from '@/lib/exportCsv';
import { Download } from 'lucide-react';

interface LoadSlip {
  id: string;
  driver_id: string;
  vehicle_id: string;
  vehicle_name: string;
  origin: string;
  destination: string;
  load_description: string;
  weight_kg: number | null;
  bill_image_url: string | null;
  slip_number: string | null;
  amount: number | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const DEFAULT_LOAD_SLIPS: LoadSlip[] = [
  {
    id: "slip-1",
    driver_id: "driver-1",
    vehicle_id: "1",
    vehicle_name: "Tata Prima 4928.S (MH-12-AB-1234)",
    origin: "Mumbai JNPT Port",
    destination: "Pune Chakan Auto Hub",
    load_description: "Automotive components & precision castings",
    weight_kg: 18500,
    bill_image_url: null,
    slip_number: "LS-2024-00412",
    amount: 32000,
    status: "approved",
    notes: "Verified weight bridge slip #WB-9921",
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "slip-2",
    driver_id: "driver-2",
    vehicle_id: "2",
    vehicle_name: "Ashok Leyland 4923 (GJ-05-CD-5678)",
    origin: "Surat Textile Market",
    destination: "Ahmedabad Wholesale Depot",
    load_description: "Apparel and cotton bales",
    weight_kg: 14200,
    bill_image_url: null,
    slip_number: "LS-2024-00413",
    amount: 24500,
    status: "pending",
    notes: "Awaiting e-way bill verification",
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: "slip-3",
    driver_id: "driver-3",
    vehicle_id: "3",
    vehicle_name: "Mahindra Blazo X 46 (RJ-14-EF-9012)",
    origin: "Jaipur Industrial Estate",
    destination: "Delhi Okhla Phase III",
    load_description: "Ceramics and sanitaryware",
    weight_kg: 22000,
    bill_image_url: null,
    slip_number: "LS-2024-00414",
    amount: 38000,
    status: "approved",
    notes: "Fragile cargo with corner protector padding",
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
];

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-warning/10 text-warning border-warning/30' },
  approved: { label: 'Approved', icon: CheckCircle, color: 'bg-success/10 text-success border-success/30' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'bg-destructive/10 text-destructive border-destructive/30' },
};

export function LoadHistoryView() {
  const { user } = useAuth();
  const { isDriver, vehicleCards } = useSimulation();
  const { canEdit, canDelete, canApprove, isAdmin } = usePermissions();
  const [loadSlips, setLoadSlips] = useState<LoadSlip[]>(DEFAULT_LOAD_SLIPS);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editSlip, setEditSlip] = useState<LoadSlip | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteSlip, setDeleteSlip] = useState<LoadSlip | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState({
    vehicleId: '',
    vehicleName: '',
    origin: '',
    destination: '',
    loadDescription: '',
    weightKg: '',
    slipNumber: '',
    amount: '',
    notes: '',
  });
  const [billFile, setBillFile] = useState<File | null>(null);

  const fetchLoadSlips = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('load_slips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        setLoadSlips(prev => prev.length > 0 ? prev : DEFAULT_LOAD_SLIPS);
      } else {
        setLoadSlips(data as LoadSlip[]);
      }
    } catch {
      setLoadSlips(prev => prev.length > 0 ? prev : DEFAULT_LOAD_SLIPS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoadSlips();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File too large. Max 5MB.');
        return;
      }
      setBillFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!form.origin || !form.destination || !form.loadDescription) {
      toast.error('Please fill in origin, destination, and load description.');
      return;
    }

    setSubmitting(true);
    let imageUrl: string | null = null;

    if (billFile && user) {
      try {
        const ext = billFile.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('load-slips')
          .upload(filePath, billFile);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('load-slips')
            .getPublicUrl(filePath);
          imageUrl = urlData.publicUrl;
        }
      } catch {
        // use local preview
      }
    }

    const payload = {
      driver_id: user?.id || 'sim-driver',
      vehicle_id: form.vehicleId || 'unassigned',
      vehicle_name: form.vehicleName || vehicleCards[0]?.name || 'Tata Prima 4928.S',
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      load_description: form.loadDescription.trim(),
      weight_kg: form.weightKg ? parseFloat(form.weightKg) : null,
      bill_image_url: imageUrl || previewImage,
      slip_number: form.slipNumber.trim() || `LS-${Date.now().toString().slice(-5)}`,
      amount: form.amount ? parseFloat(form.amount) : null,
      notes: form.notes.trim() || null,
      status: 'pending',
    };

    try {
      const { error } = await supabase.from('load_slips').insert(payload);
      if (error) throw error;
      fetchLoadSlips();
    } catch {
      // Local optimistic update
      const newSlip: LoadSlip = {
        ...payload,
        id: `slip-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      setLoadSlips(prev => [newSlip, ...prev]);
    }

    toast.success('Load slip submitted successfully!');
    setDialogOpen(false);
    setForm({ vehicleId: '', vehicleName: '', origin: '', destination: '', loadDescription: '', weightKg: '', slipNumber: '', amount: '', notes: '' });
    setBillFile(null);
    setPreviewImage(null);
    setSubmitting(false);
  };

  const handleStatusUpdate = async (slipId: string, newStatus: string) => {
    try {
      await supabase
        .from('load_slips')
        .update({ status: newStatus })
        .eq('id', slipId);
    } catch {
      // ignore
    }
    setLoadSlips(prev => prev.map(s => s.id === slipId ? { ...s, status: newStatus } : s));
    toast.success(`Load slip marked as ${newStatus}`);
  };

  const handleSaveEdit = async () => {
    if (!editSlip) return;
    setSavingEdit(true);
    try {
      await supabase
        .from('load_slips')
        .update({
          origin: editSlip.origin,
          destination: editSlip.destination,
          load_description: editSlip.load_description,
          vehicle_name: editSlip.vehicle_name,
          slip_number: editSlip.slip_number || null,
          weight_kg: editSlip.weight_kg,
          amount: editSlip.amount,
          notes: editSlip.notes,
          status: editSlip.status,
        })
        .eq('id', editSlip.id);
    } catch {
      // ignore
    }
    setLoadSlips(prev => prev.map(s => s.id === editSlip.id ? { ...editSlip } : s));
    setSavingEdit(false);
    toast.success('Load slip updated');
    setEditSlip(null);
  };

  const handleDelete = async () => {
    if (!deleteSlip) return;
    try {
      await supabase.from('load_slips').delete().eq('id', deleteSlip.id);
    } catch {
      // ignore
    }
    setLoadSlips(prev => prev.filter(s => s.id !== deleteSlip.id));
    toast.success('Load slip deleted');
    setDeleteSlip(null);
  };

  const handleExportCsv = () => {
    downloadCsv(
      `load-slips-${new Date().toISOString().slice(0, 10)}`,
      loadSlips.map(s => ({
        SlipNumber: s.slip_number || s.id,
        Vehicle: s.vehicle_name,
        Origin: s.origin,
        Destination: s.destination,
        Cargo: s.load_description,
        Weight_Kg: s.weight_kg ?? '',
        Amount_INR: s.amount ?? '',
        Status: s.status,
        Date: s.created_at,
      }))
    );
    toast.success("Load slips exported as CSV");
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight text-foreground">
            {isDriver ? 'My Load History' : 'Load History & Cargo Slips'}
          </h1>
          <p className="text-muted-foreground">
            {isDriver
              ? 'Upload bills and track your load deliveries'
              : 'Review, approve and manage cargo delivery slips for the fleet'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={handleExportCsv}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Upload Load Slip
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Submit Load Bill / Slip
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {/* Vehicle selector */}
                <div className="space-y-2">
                  <Label>Vehicle</Label>
                  <Select
                    value={form.vehicleId}
                    onValueChange={(v) => {
                      const vc = vehicleCards.find(c => c.id === v);
                      setForm(f => ({ ...f, vehicleId: v, vehicleName: vc?.name || '' }));
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                    <SelectContent>
                      {vehicleCards.map(vc => (
                        <SelectItem key={vc.id} value={vc.id}>{vc.name} ({vc.plate})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Origin</Label>
                    <Input
                      placeholder="e.g. Mumbai, MH"
                      value={form.origin}
                      onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Destination</Label>
                    <Input
                      placeholder="e.g. Pune, MH"
                      value={form.destination}
                      onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Load Description</Label>
                  <Textarea
                    placeholder="Describe the load (e.g. 20 pallets of cement bags)"
                    value={form.loadDescription}
                    onChange={e => setForm(f => ({ ...f, loadDescription: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 15000"
                      value={form.weightKg}
                      onChange={e => setForm(f => ({ ...f, weightKg: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Slip No.</Label>
                    <Input
                      placeholder="e.g. LS-4521"
                      value={form.slipNumber}
                      onChange={e => setForm(f => ({ ...f, slipNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (₹)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 25000"
                      value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input
                    placeholder="Any additional notes"
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>

                {/* Bill Image Upload */}
                <div className="space-y-2">
                  <Label>Bill / Slip Photo</Label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    {previewImage ? (
                      <img src={previewImage} alt="Bill preview" className="max-h-40 mx-auto rounded-lg object-contain" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Upload className="w-8 h-8" />
                        <p className="text-sm font-medium">Click to upload bill photo</p>
                        <p className="text-xs">JPG, PNG up to 5MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                <Button onClick={handleSubmit} className="w-full" disabled={submitting}>
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    <><Upload className="w-4 h-4 mr-2" /> Submit Load Slip</>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Load Slips List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : loadSlips.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">No Load Slips Yet</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {isDriver
                ? 'Upload your first load bill or slip to get started.'
                : 'No drivers have submitted any load slips yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loadSlips.map((slip) => {
            const statusConf = STATUS_CONFIG[slip.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConf.icon;
            return (
              <Card key={slip.id} className="glass-card overflow-hidden group hover:border-primary/30 transition-all">
                {/* Bill Image */}
                {slip.bill_image_url && (
                  <div className="relative h-40 bg-secondary/30 overflow-hidden">
                    <img
                      src={slip.bill_image_url}
                      alt="Load bill"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <a
                      href={slip.bill_image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-2 right-2 bg-background/80 backdrop-blur p-1.5 rounded-lg hover:bg-background"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                  </div>
                )}

                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{slip.load_description}</CardTitle>
                      {slip.slip_number && (
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">#{slip.slip_number}</p>
                      )}
                    </div>
                    <Badge variant="outline" className={cn("text-xs", statusConf.color)}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConf.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Route */}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">{slip.origin}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-foreground font-medium">{slip.destination}</span>
                  </div>

                  {/* Vehicle */}
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{slip.vehicle_name}</span>
                  </div>

                  {/* Weight & Amount */}
                  <div className="flex items-center gap-4 text-sm">
                    {slip.weight_kg && (
                      <div className="flex items-center gap-1.5">
                        <Weight className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-mono">{slip.weight_kg.toLocaleString()} kg</span>
                      </div>
                    )}
                    {slip.amount && (
                      <div className="flex items-center gap-1">
                        <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-mono font-medium">{slip.amount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Date */}
                  <p className="text-xs text-muted-foreground">
                    {new Date(slip.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>

                  {/* Approval actions */}
                  {canApprove && slip.status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t border-border/50">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-success hover:bg-success/10"
                        onClick={() => handleStatusUpdate(slip.id, 'approved')}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-destructive hover:bg-destructive/10"
                        onClick={() => handleStatusUpdate(slip.id, 'rejected')}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {/* Admin / owner management actions */}
                  {(canEdit || canDelete) && (
                    <div className="flex gap-2 pt-2 border-t border-border/50">
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setEditSlip({ ...slip })}
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1.5" />
                          Edit
                        </Button>
                      )}
                      {canApprove && slip.status !== 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleStatusUpdate(slip.id, 'pending')}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                          Reset
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteSlip(slip)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit dialog (admin / owner) */}
      <Dialog open={!!editSlip} onOpenChange={(o) => !o && setEditSlip(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              Edit Load Slip
            </DialogTitle>
          </DialogHeader>
          {editSlip && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Origin</Label>
                  <Input
                    value={editSlip.origin}
                    onChange={e => setEditSlip(s => s && { ...s, origin: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Destination</Label>
                  <Input
                    value={editSlip.destination}
                    onChange={e => setEditSlip(s => s && { ...s, destination: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Load Description</Label>
                <Textarea
                  value={editSlip.load_description}
                  onChange={e => setEditSlip(s => s && { ...s, load_description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Vehicle</Label>
                <Input
                  value={editSlip.vehicle_name}
                  onChange={e => setEditSlip(s => s && { ...s, vehicle_name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    value={editSlip.weight_kg ?? ''}
                    onChange={e => setEditSlip(s => s && { ...s, weight_kg: e.target.value ? parseFloat(e.target.value) : null })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slip No.</Label>
                  <Input
                    value={editSlip.slip_number ?? ''}
                    onChange={e => setEditSlip(s => s && { ...s, slip_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    value={editSlip.amount ?? ''}
                    onChange={e => setEditSlip(s => s && { ...s, amount: e.target.value ? parseFloat(e.target.value) : null })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editSlip.status}
                  onValueChange={(v) => setEditSlip(s => s && { ...s, status: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={editSlip.notes ?? ''}
                  onChange={e => setEditSlip(s => s && { ...s, notes: e.target.value })}
                />
              </div>
              <Button onClick={handleSaveEdit} className="w-full" disabled={savingEdit}>
                {savingEdit ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : 'Save Changes'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation (admin) */}
      <AlertDialog open={!!deleteSlip} onOpenChange={(o) => !o && setDeleteSlip(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this load slip?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteSlip?.load_description} — {deleteSlip?.origin} → {deleteSlip?.destination}.
              This permanently removes the record from load history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
