import { useState, useEffect } from "react";

const BASE_URL = import.meta.env.VITE_API_URL as string;

interface Doctor {
  id: string;
  name: string;
  specialty?: string;
  specialty_display?: string;
  clinic_name?: string;
}

interface DoctorSwitcherProps {
  clinicWhatsapp: string;
  selectedDoctorId: string;
  onSelect: (doctorId: string, doctorName: string) => void;
}

export function DoctorSwitcher({
  clinicWhatsapp,
  selectedDoctorId,
  onSelect,
}: DoctorSwitcherProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!clinicWhatsapp) return;
    fetch(
      `${BASE_URL}/api/doctors?clinic_whatsapp=${encodeURIComponent(clinicWhatsapp)}`
    )
      .then((r) => (r.ok ? r.json() : { doctors: [] }))
      .then((d) => setDoctors(d.doctors || []))
      .catch(() => setDoctors([]));
  }, [clinicWhatsapp]);

  if (doctors.length < 2) return null;

  const current = doctors.find((d) => d.id === selectedDoctorId);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
      >
        <span>{current?.name ?? "Select Doctor"}</span>
        <svg
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-0 z-10 mt-1 min-w-[180px] rounded-lg border border-gray-200 bg-white shadow-lg"
          onBlur={() => setOpen(false)}
        >
          {doctors.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => {
                onSelect(doc.id, doc.name);
                setOpen(false);
              }}
              className={`flex w-full flex-col px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                doc.id === selectedDoctorId ? "bg-blue-50 font-medium text-blue-700" : "text-gray-700"
              }`}
            >
              <span>{doc.name}</span>
              {(doc.specialty_display ?? doc.specialty) && (
                <span className="text-xs text-gray-400">
                  {doc.specialty_display ?? doc.specialty}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
