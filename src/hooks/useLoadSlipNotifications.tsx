import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { playMessageTone } from '@/lib/sounds';
import { Package } from 'lucide-react';

/**
 * Requests browser notification permission and shows native + toast
 * notifications to owners when a driver submits a new load slip.
 */
export function useLoadSlipNotifications() {
  const { user, role } = useAuth();
  const permissionRef = useRef<NotificationPermission>('default');

  // Request permission on mount (owners only)
  useEffect(() => {
    if (role !== 'owner') return;
    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
      Notification.requestPermission().then(p => {
        permissionRef.current = p;
      });
    } else {
      permissionRef.current = Notification.permission;
    }
  }, [role]);

  const showNotification = useCallback((slip: {
    vehicle_name: string;
    origin: string;
    destination: string;
    load_description: string;
  }) => {
    const title = '📦 New Load Slip Submitted';
    const body = `${slip.vehicle_name}: ${slip.load_description}\n${slip.origin} → ${slip.destination}`;

    // In-app toast
    toast.info(title, {
      description: body,
      duration: 8000,
      icon: <Package className="w-4 h-4 text-primary" />,
    });

    // Play a gentle notification tone (distinct from alert sirens)
    playMessageTone();

    // Browser push notification
    if (permissionRef.current === 'granted') {
      try {
        new Notification(title, {
          body: `${slip.vehicle_name}: ${slip.load_description} — ${slip.origin} → ${slip.destination}`,
          icon: '/favicon.ico',
          tag: 'load-slip-' + Date.now(),
        });
      } catch {
        // Notification not supported in this context
      }
    }
  }, []);

  // Subscribe to realtime inserts on load_slips
  useEffect(() => {
    if (!user || role !== 'owner') return;

    const channel = supabase
      .channel('load-slips-owner')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'load_slips' },
        (payload) => {
          const slip = payload.new as {
            vehicle_name: string;
            origin: string;
            destination: string;
            load_description: string;
            driver_id: string;
          };
          // Don't notify if the owner somehow inserted it themselves
          if (slip.driver_id !== user.id) {
            showNotification(slip);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, role, showNotification]);
}
