import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SimulatedVehicle } from '@/hooks/useRealtimeSimulation';

export interface TollCrossing {
  id: string;
  vehicleId: string;
  vehicleName: string;
  tollGateName: string;
  highway: string;
  amount: number;
  previousBalance: number;
  newBalance: number;
  status: 'success' | 'insufficient_balance' | 'inactive_tag';
  timestamp: Date;
  sections: SectionCrossing[];
}

export interface SectionCrossing {
  sectionName: string;
  crossedAt: Date;
  speed: number;
}

export interface FastTagAccount {
  id: string;
  vehicleId: string;
  vehicleName: string;
  tagNumber: string;
  balance: number;
  issuerBank: string;
  isActive: boolean;
}

export interface TollNotification {
  id: string;
  vehicleName: string;
  tollGateName: string;
  type: 'crossing' | 'low_balance' | 'payment_failure';
  title: string;
  message: string;
  amount?: number;
  remainingBalance?: number;
  isRead: boolean;
  timestamp: Date;
}

export interface TollGate {
  id: string;
  name: string;
  highway: string;
  latitude: number;
  longitude: number;
  state: string;
  rate_heavy_truck: number;
  rate_medium_truck: number;
  rate_light_truck: number;
  rate_container: number;
}

// Haversine distance in meters
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const DETECTION_RADIUS_M = 100;
const COOLDOWN_MS = 60000; // 1 min cooldown per vehicle per toll

export function useTollDetection(vehicles: SimulatedVehicle[], enabled: boolean = true) {
  const [crossings, setCrossings] = useState<TollCrossing[]>([]);
  const [fastTagAccounts, setFastTagAccounts] = useState<FastTagAccount[]>([]);
  const [tollNotifications, setTollNotifications] = useState<TollNotification[]>([]);
  const [tollGates, setTollGates] = useState<TollGate[]>([]);
  const lastCrossingRef = useRef<Map<string, number>>(new Map()); // key: vehicleId-tollId
  const notifCountRef = useRef(0);

  // Load toll gates and fasttag accounts
  useEffect(() => {
    if (!enabled) return;
    
    const loadData = async () => {
      const [gatesRes, tagsRes] = await Promise.all([
        supabase.from('toll_gates').select('*').eq('is_active', true),
        supabase.from('fasttag_accounts').select('*'),
      ]);

      if (gatesRes.data) {
        setTollGates(gatesRes.data as TollGate[]);
      }
      if (tagsRes.data) {
        setFastTagAccounts(tagsRes.data.map((t: any) => ({
          id: t.id,
          vehicleId: t.vehicle_id,
          vehicleName: t.vehicle_name,
          tagNumber: t.tag_number,
          balance: Number(t.balance),
          issuerBank: t.issuer_bank,
          isActive: t.is_active,
        })));
      }
    };
    loadData();
  }, [enabled]);

  // Subscribe to realtime toll notifications
  useEffect(() => {
    const channel = supabase
      .channel('toll-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'toll_notifications' }, (payload) => {
        const n = payload.new as any;
        setTollNotifications(prev => [{
          id: n.id,
          vehicleName: n.vehicle_name,
          tollGateName: n.toll_gate_name,
          type: n.notification_type,
          title: n.title,
          message: n.message,
          amount: n.amount ? Number(n.amount) : undefined,
          remainingBalance: n.remaining_balance ? Number(n.remaining_balance) : undefined,
          isRead: false,
          timestamp: new Date(n.created_at),
        }, ...prev].slice(0, 100));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const processTollCrossing = useCallback(async (
    vehicle: SimulatedVehicle,
    gate: TollGate,
    fastTag: FastTagAccount,
  ) => {
    const key = `${vehicle.id}-${gate.id}`;
    const now = Date.now();
    const lastTime = lastCrossingRef.current.get(key) || 0;
    if (now - lastTime < COOLDOWN_MS) return;
    lastCrossingRef.current.set(key, now);

    // Determine rate by vehicle type
    const rate = vehicle.type === 'Medium Truck' ? gate.rate_medium_truck : gate.rate_heavy_truck;
    const prevBalance = fastTag.balance;
    const status = prevBalance >= rate ? 'success' : 'insufficient_balance';
    const newBalance = status === 'success' ? prevBalance - rate : prevBalance;

    // Generate section crossings
    const sectionTimestamps: SectionCrossing[] = [
      { sectionName: 'Entry Gate', crossedAt: new Date(now - 30000), speed: Math.max(10, vehicle.speed - 30) },
      { sectionName: 'Weighbridge', crossedAt: new Date(now - 20000), speed: 5 },
      { sectionName: 'Payment Booth', crossedAt: new Date(now - 10000), speed: 0 },
      { sectionName: 'Exit Gate', crossedAt: new Date(now), speed: Math.min(20, vehicle.speed) },
    ];

    notifCountRef.current += 1;
    const crossing: TollCrossing = {
      id: `toll-${now}-${notifCountRef.current}`,
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      tollGateName: gate.name,
      highway: gate.highway,
      amount: rate,
      previousBalance: prevBalance,
      newBalance,
      status: status as 'success' | 'insufficient_balance',
      timestamp: new Date(),
      sections: sectionTimestamps,
    };

    setCrossings(prev => [crossing, ...prev].slice(0, 200));

    // Update local fasttag balance
    if (status === 'success') {
      setFastTagAccounts(prev => prev.map(ft =>
        ft.vehicleId === vehicle.id ? { ...ft, balance: newBalance } : ft
      ));
    }

    // Persist to database
    try {
      // Insert toll transaction
      const { data: txData } = await supabase.from('toll_transactions').insert({
        vehicle_id: vehicle.id,
        vehicle_name: vehicle.name,
        toll_gate_id: gate.id,
        fasttag_account_id: fastTag.id,
        amount: rate,
        previous_balance: prevBalance,
        new_balance: newBalance,
        status,
        vehicle_type: vehicle.type,
      }).select().single();

      // Update fasttag balance
      if (status === 'success') {
        await supabase.from('fasttag_accounts')
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq('id', fastTag.id);

        // Insert fasttag transaction
        await supabase.from('fasttag_transactions').insert({
          fasttag_account_id: fastTag.id,
          transaction_type: 'debit',
          amount: rate,
          previous_balance: prevBalance,
          new_balance: newBalance,
          description: `Toll charge at ${gate.name} (${gate.highway})`,
          toll_transaction_id: txData?.id,
        });
      }

      // Create notification
      const notifTitle = status === 'success'
        ? `Toll Crossed: ${gate.name}`
        : `⚠️ Payment Failed: ${gate.name}`;
      const notifMessage = status === 'success'
        ? `${vehicle.name} crossed ${gate.name} on ${gate.highway}. ₹${rate} deducted. Balance: ₹${newBalance}`
        : `${vehicle.name} has insufficient FastTag balance (₹${prevBalance}) for ₹${rate} toll at ${gate.name}`;

      // Add local notification
      const localNotif: TollNotification = {
        id: `tn-${now}-${notifCountRef.current}`,
        vehicleName: vehicle.name,
        tollGateName: gate.name,
        type: status === 'success' ? 'crossing' : 'payment_failure',
        title: notifTitle,
        message: notifMessage,
        amount: rate,
        remainingBalance: newBalance,
        isRead: false,
        timestamp: new Date(),
      };
      setTollNotifications(prev => [localNotif, ...prev].slice(0, 100));

      // Low balance warning
      if (newBalance < 500 && status === 'success') {
        const lowBalNotif: TollNotification = {
          id: `tn-low-${now}`,
          vehicleName: vehicle.name,
          tollGateName: gate.name,
          type: 'low_balance',
          title: `⚠️ Low FastTag Balance: ${vehicle.name}`,
          message: `FastTag balance is ₹${newBalance}. Recharge recommended to avoid toll failures.`,
          remainingBalance: newBalance,
          isRead: false,
          timestamp: new Date(),
        };
        setTollNotifications(prev => [lowBalNotif, ...prev].slice(0, 100));
      }
    } catch (err) {
      console.error('Failed to persist toll crossing:', err);
    }
  }, []);

  // Check vehicles against toll gates
  useEffect(() => {
    if (!enabled || tollGates.length === 0 || fastTagAccounts.length === 0) return;

    const activeVehicles = vehicles.filter(v => v.status === 'active' && v.speed > 0);
    
    for (const vehicle of activeVehicles) {
      for (const gate of tollGates) {
        const dist = getDistanceMeters(vehicle.latitude, vehicle.longitude, gate.latitude, gate.longitude);
        if (dist <= DETECTION_RADIUS_M) {
          const fastTag = fastTagAccounts.find(ft => ft.vehicleId === vehicle.id);
          if (fastTag) {
            processTollCrossing(vehicle, gate, fastTag);
          }
        }
      }
    }
  }, [vehicles, tollGates, fastTagAccounts, enabled, processTollCrossing]);

  const markNotificationRead = useCallback((id: string) => {
    setTollNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const rechargeFastTag = useCallback(async (vehicleId: string, amount: number) => {
    const account = fastTagAccounts.find(ft => ft.vehicleId === vehicleId);
    if (!account) return;

    const newBalance = account.balance + amount;
    setFastTagAccounts(prev => prev.map(ft =>
      ft.vehicleId === vehicleId ? { ...ft, balance: newBalance } : ft
    ));

    await supabase.from('fasttag_accounts')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', account.id);

    await supabase.from('fasttag_transactions').insert({
      fasttag_account_id: account.id,
      transaction_type: 'credit',
      amount,
      previous_balance: account.balance,
      new_balance: newBalance,
      description: `FastTag recharge of ₹${amount}`,
    });
  }, [fastTagAccounts]);

  return {
    crossings,
    fastTagAccounts,
    tollNotifications,
    tollGates,
    unreadTollNotifications: tollNotifications.filter(n => !n.isRead).length,
    markNotificationRead,
    rechargeFastTag,
  };
}
