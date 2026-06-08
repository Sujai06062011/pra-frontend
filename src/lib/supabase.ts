import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function subscribeToQueue(
  doctorId: string,
  date: string,
  onUpdate: () => void
): () => void {
  const channel = supabase
    .channel(`queue-${doctorId}-${date}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "appointments",
        filter: `doctor_id=eq.${doctorId}`,
      },
      onUpdate
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tokens",
        filter: `doctor_id=eq.${doctorId}`,
      },
      onUpdate
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToQueries(
  doctorId: string,
  onNew: () => void
): () => void {
  const channel = supabase
    .channel(`queries-${doctorId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "patient_queries",
        filter: `doctor_id=eq.${doctorId}`,
      },
      onNew
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToPatients(
  doctorId: string,
  onNew: () => void
): () => void {
  const channel = supabase
    .channel(`patients-${doctorId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "patients",
        filter: `doctor_id=eq.${doctorId}`,
      },
      onNew
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
