import { useState, useCallback, useRef } from "react";
import { api, type ClinicMedicine } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export type { ClinicMedicine };

export function useMedicineSearch() {
  const { doctorId } = useAuth();
  const [results, setResults] = useState<ClinicMedicine[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.medicines.search(doctorId, query, 8);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);
  }, [doctorId]);

  const clear = useCallback(() => setResults([]), []);

  const addNewMedicine = useCallback(async (name: string, form = "tablet") => {
    return api.medicines.add({ doctor_id: doctorId, name, form, category: "Other", dosages: [] });
  }, [doctorId]);

  const incrementUsage = useCallback((medicineId: string) => {
    api.medicines.incrementUsage(medicineId).catch(() => {});
  }, []);

  return { results, loading, search, clear, addNewMedicine, incrementUsage };
}
