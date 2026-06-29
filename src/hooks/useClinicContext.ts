import { useState, useEffect } from "react";

const BASE_URL = import.meta.env.VITE_API_URL as string;

export interface ClinicContext {
  doctor_id: string;
  doctor_name: string;
  specialty: string;
  clinic_name: string;
  whatsapp_number: string;
  role: string;
  multi_doctor_enabled: boolean;
}

const DEFAULT_CONTEXT: ClinicContext = {
  doctor_id: "8c33abe0-5d2e-4613-9437-c7c375e8d162",
  doctor_name: "Dr. Kumar",
  specialty: "Paediatrics",
  clinic_name: "Dr. Kumar Child Care Clinic",
  whatsapp_number: "",
  role: "doctor",
  multi_doctor_enabled: false,
};

export function useClinicContext(doctorId: string): {
  context: ClinicContext;
  loading: boolean;
} {
  const [context, setContext] = useState<ClinicContext>(DEFAULT_CONTEXT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!doctorId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch(`${BASE_URL}/api/me/context?doctor_id=${encodeURIComponent(doctorId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data && !data.error) {
          setContext({
            doctor_id:             data.doctor_id          ?? DEFAULT_CONTEXT.doctor_id,
            doctor_name:           data.doctor_name         ?? DEFAULT_CONTEXT.doctor_name,
            specialty:             data.specialty           ?? DEFAULT_CONTEXT.specialty,
            clinic_name:           data.clinic_name         ?? DEFAULT_CONTEXT.clinic_name,
            whatsapp_number:       data.whatsapp_number     ?? DEFAULT_CONTEXT.whatsapp_number,
            role:                  data.role                ?? DEFAULT_CONTEXT.role,
            multi_doctor_enabled:  data.multi_doctor_enabled ?? false,
          });
        }
      })
      .catch(() => {
        // Silently fall back to default — never crash existing flow
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [doctorId]);

  return { context, loading };
}
