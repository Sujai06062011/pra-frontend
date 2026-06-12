import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, Clock, Users, CheckCircle2, Activity, RefreshCw, AlertTriangle } from "lucide-react";
import { useQueue } from "../../../hooks/usePRAData";
import type { Appointment } from "../../../lib/api";

const avatarColors = [
  "from-violet-400 to-purple-500", "from-pink-400 to-rose-500", "from-sky-400 to-blue-500",
  "from-emerald-400 to-teal-500", "from-amber-400 to-orange-500", "from-lime-400 to-emerald-500",
  "from-cyan-400 to-sky-500",
];

// ── queue navigation (slot TIME order) ───────────────────
// current_token identifies the serving appointment; Next/Prev walk the
// non-cancelled appointments sorted by appointment_time, not token number.
const byTime = (a: Appointment, b: Appointment) =>
  (a.appointment_time ?? "").localeCompare(b.appointment_time ?? "");

function activeByTime(appointments: Appointment[]): Appointment[] {
  return appointments.filter(t => t.status !== "Cancelled" && t.token_number).sort(byTime);
}

function getNextToken(current: number, appointments: Appointment[]): { token: number; skipped: Appointment[] } | null {
  const active = activeByTime(appointments);
  if (!active.length) return null;
  const idx = current > 0 ? active.findIndex(t => t.token_number === current) : -1;
  const next = active[idx + 1];
  if (!next) return null;
  return { token: next.token_number ?? 0, skipped: [] };
}

function getPrevToken(current: number, appointments: Appointment[]): { token: number; skipped: Appointment[] } | null {
  if (current <= 0) return null;
  const active = activeByTime(appointments);
  const idx = active.findIndex(t => t.token_number === current);
  if (idx <= 0) return { token: 0, skipped: [] }; // back to "not started"
  return { token: active[idx - 1].token_number ?? 0, skipped: [] };
}

const fmtTime = (t?: string) => {
  if (!t) return "";
  const h = parseInt(t.slice(0, 2), 10);
  const h12 = h % 12 || 12;
  return `${h12}:${t.slice(3, 5)} ${h >= 12 ? "PM" : "AM"}`;
};

// ── toast ─────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-amber-500 text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-200 animate-fade-in">
      <AlertTriangle size={15} /> {message}
    </div>
  );
}

// ── component ─────────────────────────────────────────────
export function Queue({ onPrescribe }: { onPrescribe?: (patientId: string, appointmentId: string) => void } = {}) {
  const { data, loading, error, refetch, setToken } = useQueue();
  const [toast, setToast] = useState("");

  const current = data.current_token;
  const appointments = data.appointments;

  // In-progress = the appointment whose token equals current_token (0 = not started)
  const currentPatient = current > 0
    ? appointments.find(p => (p.token_number ?? 0) === current && p.status !== "Cancelled")
    : undefined;

  const handleNext = async () => {
    const result = getNextToken(current, appointments);
    if (!result) return;
    await setToken(result.token);
    if (result.skipped.length > 0) {
      const names = result.skipped.map(s => `#${s.token_number} (${s.patients?.name ?? "?"})`).join(", ");
      setToast(`Skipped ${names} — Cancelled`);
    }
  };

  const handlePrev = async () => {
    const result = getPrevToken(current, appointments);
    if (!result) return;
    await setToken(result.token);
    if (result.skipped.length > 0) {
      const names = result.skipped.map(s => `#${s.token_number} (${s.patients?.name ?? "?"})`).join(", ");
      setToast(`Skipped ${names} — Cancelled`);
    }
  };

  const waitingCount = data.waiting;

  return (
    <div className="p-7 space-y-6">
      {toast && <Toast message={toast} onDone={() => setToast("")} />}

      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <span className="text-[13px] text-rose-700 flex-1">Failed to load queue data.</span>
          <button onClick={refetch} className="flex items-center gap-1 text-[12px] font-semibold text-rose-600">
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {/* Hero queue display */}
      <div className="grid grid-cols-3 gap-4">
        {/* Current token hero */}
        <div className="col-span-1 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200 flex flex-col items-center justify-center gap-2">
          <div className="text-sm font-semibold opacity-80 uppercase tracking-widest">Now Serving</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 80, lineHeight: 1 }}>
            {loading ? "…" : (current > 0 ? (data.current_display || current) : "—")}
          </div>
          {currentPatient && (
            <div className="text-center">
              <div className="font-semibold text-base">{currentPatient.patients?.name || "—"}</div>
            </div>
          )}
          <div className="flex gap-3 mt-4 w-full">
            <button
              onClick={handlePrev}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-[13px] font-semibold transition-colors"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-white text-emerald-700 text-[13px] font-semibold hover:bg-emerald-50 transition-colors shadow-sm"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="col-span-2 grid grid-cols-2 gap-4">
          {[
            { icon: <Users size={22} className="text-blue-600" />, label: "Waiting", value: loading ? "—" : waitingCount, sub: "patients in queue", bg: "bg-blue-50", border: "border-blue-100" },
            { icon: <Clock size={22} className="text-amber-600" />, label: "Avg Wait Time", value: "—", sub: "current estimate", bg: "bg-amber-50", border: "border-amber-100" },
            { icon: <CheckCircle2 size={22} className="text-emerald-600" />, label: "Completed", value: loading ? "—" : data.completed, sub: "today so far", bg: "bg-emerald-50", border: "border-emerald-100" },
            { icon: <Activity size={22} className="text-violet-600" />, label: "Total Tokens", value: loading ? "—" : data.total_today, sub: "issued today", bg: "bg-violet-50", border: "border-violet-100" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-5 flex items-center gap-4`}>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">{s.icon}</div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{s.label}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, lineHeight: 1.2 }} className="text-slate-800">{s.value}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Queue list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800">
            Today's Queue
          </h3>
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center text-[13px] text-slate-400">Loading queue…</div>
        ) : appointments.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px] text-slate-400">No appointments today</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {appointments.map((p, idx) => {
              const isCancelled = p.status === "Cancelled";
              const isCurrent = p.queue_status === "In Progress" && !isCancelled;
              const isDone = p.queue_status === "Done" && !isCancelled;
              const color = avatarColors[idx % avatarColors.length];
              const name = p.patients?.name || "Unknown";
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
                    isCancelled ? "opacity-40" :
                    isCurrent   ? "bg-emerald-50" : "hover:bg-slate-50"
                  }`}
                >
                  {/* Token number */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[14px] font-bold flex-shrink-0 ${
                    isCancelled ? "bg-slate-200 text-slate-400" :
                    isCurrent   ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200" :
                    isDone      ? "bg-slate-100 text-slate-400" :
                                  "bg-slate-100 text-slate-600"
                  }`}>
                    {p.display_token || p.token_number || "—"}
                  </div>

                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white text-[13px] font-bold shadow-sm flex-shrink-0`}>
                    {name[0]}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[13px] font-medium text-slate-800 ${isCancelled ? "line-through" : ""}`}>
                        {name}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">CURRENT</span>
                      )}
                    </div>
                    {p.patients?.age && <div className="text-[11px] text-slate-400">{p.patients.age} yrs</div>}
                  </div>

                  {/* Slot time */}
                  <div className="text-[12px] font-medium text-slate-500 w-20 text-right">
                    {fmtTime(p.appointment_time)}
                  </div>

                  {/* Badge / actions */}
                  <div>
                    {isCancelled && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                        Cancelled
                      </span>
                    )}
                    {!isCancelled && isDone && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={11} /> Seen
                      </span>
                    )}
                    {!isCancelled && isCurrent && (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          <Activity size={11} /> In Progress
                        </span>
                        <button
                          onClick={() => {
                            if (onPrescribe) { onPrescribe(p.patient_id, p.id); }
                            else { const params = new URLSearchParams({ patient_id: p.patient_id, appointment_id: p.id }); window.location.href = `/prescriptions/new?${params}`; }
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm"
                        >
                          ✍️ Prescribe
                        </button>
                      </div>
                    )}
                    {!isCancelled && !isDone && !isCurrent && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock size={11} /> Waiting
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
