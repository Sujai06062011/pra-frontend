import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://gvagwplrmurbvwjnvckf.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: { eventsPerSecond: 10 }
  }
});

export function subscribeToQueue(doctorId: string, date: string, onUpdate: () => void): () => void {
  if (!SUPABASE_ANON_KEY) return () => {};
  try {
    const channel = supabase
      .channel(`queue-${doctorId}-${date}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "appointments",
        filter: `doctor_id=eq.${doctorId}`,
      }, () => onUpdate())
      .on("postgres_changes", {
        event: "*", schema: "public", table: "tokens",
        filter: `doctor_id=eq.${doctorId}`,
      }, () => onUpdate())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  } catch (e) {
    console.warn("Realtime queue subscription failed:", e);
    return () => {};
  }
}

export function subscribeToQueries(doctorId: string, onNew: () => void): () => void {
  if (!SUPABASE_ANON_KEY) return () => {};
  try {
    const channel = supabase
      .channel(`queries-${doctorId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "queries",
        filter: `doctor_id=eq.${doctorId}`,
      }, () => onNew())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  } catch (e) {
    console.warn("Realtime queries subscription failed:", e);
    return () => {};
  }
}

export function subscribeToPatients(doctorId: string, onNew: () => void): () => void {
  if (!SUPABASE_ANON_KEY) return () => {};
  try {
    const channel = supabase
      .channel(`patients-${doctorId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "patients",
      }, () => onNew())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  } catch (e) {
    console.warn("Realtime patients subscription failed:", e);
    return () => {};
  }
}
