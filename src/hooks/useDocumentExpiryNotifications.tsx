import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Checks for vehicle documents expiring within 30 days and alerts the fleet owner.
 * Runs once on mount.
 */
export function useDocumentExpiryNotifications() {
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    async function checkExpiring() {
      // Only notify owners/admins
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const isOwnerOrAdmin = roles?.some(
        (r) => r.role === "owner" || r.role === "admin"
      );
      if (!isOwnerOrAdmin) return;

      // Get documents expiring within 30 days
      const today = new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const { data: docs, error } = await supabase
        .from("vehicle_documents")
        .select("*")
        .lte("expiry_date", thirtyDaysFromNow.toISOString().split("T")[0])
        .gte("expiry_date", today.toISOString().split("T")[0])
        .order("expiry_date", { ascending: true });

      if (error || !docs || docs.length === 0) return;

      // Also check expired
      const { data: expiredDocs } = await supabase
        .from("vehicle_documents")
        .select("*")
        .lt("expiry_date", today.toISOString().split("T")[0])
        .order("expiry_date", { ascending: false })
        .limit(10);

      const expiredCount = expiredDocs?.length || 0;

      // Floating toasts disabled to avoid interrupting screen presentation.
      // Document expiry is tracked and reviewed directly inside the Compliance view.
    }

    // Small delay to not block initial render
    const timer = setTimeout(checkExpiring, 3000);
    return () => clearTimeout(timer);
  }, []);
}
