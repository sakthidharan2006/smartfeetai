import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  CreditCard, 
  MapPin, 
  IndianRupee, 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  ArrowDownRight, 
  ArrowUpRight,
  Wallet,
  Clock,
  Download,
} from "lucide-react";
import { useSimulation } from "@/contexts/SimulationContext";
import { TollCrossing, TollNotification, FastTagAccount } from "@/hooks/useTollDetection";
import { downloadCsv } from "@/lib/exportCsv";
import { toast } from "sonner";

export function TollManagementView() {
  const { 
    tollCrossings: crossings, 
    fastTagAccounts, 
    tollNotifications, 
    tollGates,
    unreadTollNotifications,
    markTollNotificationRead: markNotificationRead,
    rechargeFastTag,
    isDriver,
  } = useSimulation();

  const [rechargeVehicle, setRechargeVehicle] = useState<string>('');
  const [rechargeAmount, setRechargeAmount] = useState<string>('');

  const totalTollSpent = crossings.filter(c => c.status === 'success').reduce((s, c) => s + c.amount, 0);
  const totalCrossings = crossings.length;
  const failedCrossings = crossings.filter(c => c.status !== 'success').length;
  const totalFastTagBalance = fastTagAccounts.reduce((s, ft) => s + ft.balance, 0);

  const handleRecharge = async () => {
    const amt = parseFloat(rechargeAmount);
    if (rechargeVehicle && amt > 0) {
      await rechargeFastTag(rechargeVehicle, amt);
      setRechargeAmount('');
      setRechargeVehicle('');
    }
  };

  const handleExportTolls = () => {
    downloadCsv(
      `toll-log-${new Date().toISOString().slice(0, 10)}`,
      crossings.map(c => ({
        Vehicle: c.vehicleName,
        TollGate: c.tollGateName,
        Highway: c.highway,
        Amount: c.amount,
        BalanceAfter: c.newBalance,
        Status: c.status,
        Time: c.timestamp.toISOString(),
      }))
    );
    toast.success("Toll crossings log exported as CSV");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-tight text-foreground">
            {isDriver ? 'My Toll History' : 'Toll Gate Management'}
          </h2>
          <p className="text-muted-foreground">
            {isDriver ? 'Your toll crossings & FastTag balance' : 'Track toll crossings, FastTag balances & transactions'}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleExportTolls}>
          <Download className="w-4 h-4 mr-2" />
          Export Log
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Toll Spent</p>
                <p className="text-2xl font-display font-semibold tracking-tight text-foreground">₹{totalTollSpent.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-danger" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Crossings</p>
                <p className="text-2xl font-display font-semibold tracking-tight text-foreground">{totalCrossings}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Failed Payments</p>
                <p className="text-2xl font-display font-semibold tracking-tight text-foreground">{failedCrossings}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total FastTag Balance</p>
                <p className="text-2xl font-display font-semibold tracking-tight text-foreground">₹{totalFastTagBalance.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="crossings" className="w-full">
        <TabsList className="bg-secondary">
          <TabsTrigger value="crossings">Toll Crossings</TabsTrigger>
          <TabsTrigger value="fasttag">FastTag Accounts</TabsTrigger>
          <TabsTrigger value="notifications" className="relative">
            Notifications
            {unreadTollNotifications > 0 && (
              <span className="ml-1.5 bg-danger text-danger-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadTollNotifications}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="tollgates">Toll Gates</TabsTrigger>
        </TabsList>

        {/* Toll Crossings Tab */}
        <TabsContent value="crossings" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Recent Toll Crossings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {crossings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No toll crossings yet</p>
                  <p className="text-sm">Crossings will appear here when vehicles pass through toll gates</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Toll Gate</TableHead>
                        <TableHead>Highway</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Balance After</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Sections</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {crossings.map((c) => (
                        <CrossingRow key={c.id} crossing={c} />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FastTag Accounts Tab */}
        <TabsContent value="fasttag" className="mt-4">
          <div className="space-y-4">
            {!isDriver && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ArrowUpRight className="w-5 h-5 text-success" />
                    Recharge FastTag
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Vehicle</label>
                      <select
                        value={rechargeVehicle}
                        onChange={e => setRechargeVehicle(e.target.value)}
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                      >
                        <option value="">Select vehicle</option>
                        {fastTagAccounts.map(ft => (
                          <option key={ft.vehicleId} value={ft.vehicleId}>
                            {ft.vehicleName} (₹{ft.balance.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Amount (₹)</label>
                      <Input
                        type="number"
                        placeholder="1000"
                        value={rechargeAmount}
                        onChange={e => setRechargeAmount(e.target.value)}
                        className="w-32"
                      />
                    </div>
                    <Button onClick={handleRecharge} disabled={!rechargeVehicle || !rechargeAmount}>
                      <IndianRupee className="w-4 h-4 mr-1" /> Recharge
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fastTagAccounts.map(ft => (
                <FastTagCard key={ft.id} account={ft} onQuickRecharge={rechargeFastTag} />
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Toll Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tollNotifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No notifications yet</p>
                  <p className="text-sm">Toll crossing alerts will appear here in real-time</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {tollNotifications.map(n => (
                    <NotificationItem key={n.id} notification={n} onRead={markNotificationRead} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Toll Gates Tab */}
        <TabsContent value="tollgates" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Registered Toll Gates ({tollGates.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Highway</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Heavy Truck</TableHead>
                      <TableHead>Medium Truck</TableHead>
                      <TableHead>Container</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tollGates.map(g => (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">{g.name}</TableCell>
                        <TableCell>{g.highway}</TableCell>
                        <TableCell>{g.state}</TableCell>
                        <TableCell>₹{g.rate_heavy_truck}</TableCell>
                        <TableCell>₹{g.rate_medium_truck}</TableCell>
                        <TableCell>₹{g.rate_container}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CrossingRow({ crossing }: { crossing: TollCrossing }) {
  const [expanded, setExpanded] = useState(false);
  const timeStr = crossing.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setExpanded(!expanded)}>
        <TableCell className="font-medium">{crossing.vehicleName}</TableCell>
        <TableCell>{crossing.tollGateName}</TableCell>
        <TableCell>{crossing.highway}</TableCell>
        <TableCell className="font-semibold">₹{crossing.amount}</TableCell>
        <TableCell>₹{crossing.newBalance.toLocaleString()}</TableCell>
        <TableCell>
          {crossing.status === 'success' ? (
            <Badge className="bg-success/20 text-success border-0"><CheckCircle className="w-3 h-3 mr-1" />Success</Badge>
          ) : (
            <Badge className="bg-danger/20 text-danger border-0"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>
          )}
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">{timeStr}</TableCell>
        <TableCell className="text-xs text-muted-foreground">{crossing.sections.length} sections</TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={8} className="bg-muted/30 p-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-4">
                {crossing.sections.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="font-medium">{s.sectionName}</span>
                    <span className="text-muted-foreground">
                      {s.crossedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="text-xs text-muted-foreground">({s.speed} km/h)</span>
                    {i < crossing.sections.length - 1 && <span className="text-muted-foreground">→</span>}
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 ml-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadCsv(`toll-receipt-${crossing.id}`, [{
                    Vehicle: crossing.vehicleName,
                    TollGate: crossing.tollGateName,
                    Highway: crossing.highway,
                    Amount: crossing.amount,
                    BalanceAfter: crossing.newBalance,
                    Time: crossing.timestamp.toISOString(),
                  }]);
                  toast.success(`Receipt downloaded for ${crossing.tollGateName}`);
                }}
              >
                <Download className="w-3.5 h-3.5 mr-1" /> Receipt
              </Button>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function FastTagCard({ account, onQuickRecharge }: { account: FastTagAccount; onQuickRecharge?: (id: string, amt: number) => void }) {
  const isLow = account.balance < 500;
  return (
    <Card className={`bg-card border ${isLow ? 'border-danger/50' : 'border-border'}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">{account.vehicleName}</span>
          </div>
          <Badge className={account.isActive ? 'bg-success/20 text-success border-0' : 'bg-muted text-muted-foreground border-0'}>
            {account.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Tag: {account.tagNumber}</p>
          <p className="text-xs text-muted-foreground">Bank: {account.issuerBank}</p>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">Balance</span>
          <span className={`text-xl font-bold ${isLow ? 'text-danger' : 'text-success'}`}>
            ₹{account.balance.toLocaleString()}
          </span>
        </div>
        {isLow && (
          <div className="flex items-center gap-1.5 text-xs text-danger">
            <AlertTriangle className="w-3 h-3" />
            Low balance — recharge recommended
          </div>
        )}
        {onQuickRecharge && (
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs h-8 mt-1"
            onClick={() => onQuickRecharge(account.vehicleId, 1000)}
          >
            <ArrowUpRight className="w-3.5 h-3.5 mr-1 text-success" /> Recharge ₹1,000
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function NotificationItem({ notification, onRead }: { notification: TollNotification; onRead: (id: string) => void }) {
  const icon = notification.type === 'crossing' 
    ? <CheckCircle className="w-5 h-5 text-success" /> 
    : notification.type === 'low_balance'
    ? <AlertTriangle className="w-5 h-5 text-warning" />
    : <XCircle className="w-5 h-5 text-danger" />;

  return (
    <div 
      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${notification.isRead ? 'bg-transparent' : 'bg-primary/5'}`}
      onClick={() => onRead(notification.id)}
    >
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${notification.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
        <div className="flex items-center gap-3 mt-1">
          {notification.amount && (
            <span className="text-xs font-semibold text-foreground">₹{notification.amount}</span>
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {notification.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
      {!notification.isRead && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
    </div>
  );
}
