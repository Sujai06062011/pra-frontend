import { Pill, CheckCircle2, Clock, Plus, RefreshCw, Eye, Hash } from "lucide-react";
import { usePrescriptions } from "../../../hooks/usePRAData";
import type { Medicine } from "../../../lib/api";

const avatarColors = [
  "from-sky-400 to-blue-500", "from-emerald-400 to-teal-500", "from-amber-400 to-orange-500",
  "from-lime-400 to-emerald-500", "from-teal-400 to-cyan-500", "from-rose-400 to-pink-500",
  "from-indigo-400 to-violet-500",
];

function timingLabel(m: Medicine): string {
  const slots = [];
  if (m.morning)   slots.push("🌅 Morning");
  if (m.afternoon) slots.push("☀️ Afternoon");
  if (m.evening)   slots.push("🌆 Evening");
  if (m.night)     slots.push("🌙 Night");
  return slots.length ? slots.join("  ") : "As needed";
}

function daysLeft(endDate?: string): number | null {
  if (!endDate) return null;
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  return diff;
}

interface PrescriptionsProps {
  onNewPrescription?: () => void;
  onEditPrescription?: (patientId: string, prescriptionId: string) => void;
}

export function Prescriptions({ onNewPrescription, onEditPrescription }: PrescriptionsProps = {}) {
  const { data: prescriptions, loading, error, refetch } = usePrescriptions();

  const withDays = prescriptions.map(p => ({ ...p, days: daysLeft(p.prescription_date) }));

  return (
    <div className="p-7 space-y-5">
      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <span className="text-[13px] text-rose-700 flex-1">Failed to load prescriptions.</span>
          <button onClick={refetch} className="flex items-center gap-1 text-[12px] font-semibold text-rose-600">
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: loading ? "…" : prescriptions.length, cls: "bg-emerald-50 border-emerald-200 text-emerald-700", icon: <CheckCircle2 size={13} /> },
          { label: "With Medicines", value: loading ? "…" : prescriptions.filter(p => (p.prescription_medicines?.length ?? 0) > 0).length, cls: "bg-blue-50 border-blue-200 text-blue-700", icon: <Pill size={13} /> },
          { label: "This Week", value: loading ? "…" : prescriptions.filter(p => {
              if (!p.prescription_date) return false;
              const d = new Date(p.prescription_date);
              const now = new Date();
              return (now.getTime() - d.getTime()) < 7 * 86400000;
            }).length, cls: "bg-amber-50 border-amber-200 text-amber-700", icon: <Clock size={13} /> },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.cls}`}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 30, lineHeight: 1 }}>{s.value}</div>
            <div className="text-[11px] font-semibold mt-1 opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800">Prescriptions</h3>
        <button
          onClick={onNewPrescription}
          className="flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-sm"
        >
          <Plus size={15} /> New Prescription
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[13px] text-slate-400">Loading prescriptions…</div>
      ) : prescriptions.length === 0 ? (
        <div className="text-center py-12 text-[13px] text-slate-400">No prescriptions found</div>
      ) : (
      <div className="grid grid-cols-2 gap-4">
        {withDays.map((p, idx) => {
          const name = p.patients?.name || "Unknown";
          const color = avatarColors[idx % avatarColors.length];
          const meds = p.prescription_medicines ?? [];
          const dateStr = p.prescription_date
            ? new Date(p.prescription_date).toLocaleDateString("en-IN", { dateStyle: "medium" })
            : "—";
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm`}>
                  {name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }} className="text-slate-800">{name}</span>
                    {p.patients?.patient_code && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                        <Hash size={9} />{p.patients.patient_code}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                      <CheckCircle2 size={10} /> Active
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Prescribed: {dateStr}</div>
                </div>
                <button
                  onClick={() => onEditPrescription ? onEditPrescription(p.patient_id, p.id) : (() => { const params = new URLSearchParams({ patient_id: p.patient_id, prescription_id: p.id }); window.location.href = `/prescriptions/new?${params}`; })()}
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex-shrink-0"
                >
                  <Eye size={12} /> View
                </button>
              </div>

              {/* Medicines with timing dots */}
              {meds.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {meds.map((m, i) => (
                    <div key={m.id ?? i} className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2 text-[12px]">
                        <Pill size={11} className="text-emerald-500 flex-shrink-0" />
                        <span className="text-slate-700 font-medium">{m.medicine_name}</span>
                        {m.dosage && <span className="text-slate-400">· {m.dosage}</span>}
                        {m.duration_days && <span className="text-slate-400">· {m.duration_days}d</span>}
                      </div>
                      <div className="pl-5 text-[11px] text-slate-400">{timingLabel(m)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[12px] text-slate-400 mb-3">No medicines listed</div>
              )}

              {p.general_notes && (
                <div className="text-[11px] text-slate-500 bg-slate-50 rounded-lg px-3 py-2 mt-2">
                  📝 {p.general_notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
