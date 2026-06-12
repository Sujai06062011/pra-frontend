import { useState } from "react";
import { ChevronRight, ChevronLeft, Clock, Users, CheckCircle2, Activity, RefreshCw } from "lucide-react";
import { useQueue } from "../../../hooks/usePRAData";
import { api } from "../../../lib/api";
import type { Appointment } from "../../../lib/api";
import {
  isEvening,
  getActiveAppointments,
  getCurrentAppointment,
  getFirstAppointment,
  getFirstPendingAppointment,
  getNextAppointment,
  getPrevAppointment,
  isAllDone,
  patientName,
} from "../../../utils/queueUtils";

const avatarColors = [
  "from-violet-400 to-purple-500", "from-pink-400 to-rose-500", "from-sky-400 to-blue-500",
  "from-emerald-400 to-teal-500", "from-amber-400 to-orange-500", "from-lime-400 to-emerald-500",
  "from-cyan-400 to-sky-500",
];

const fmtTime = (t?: string) => {
  if (!t) return "";
  const h = parseInt(t.slice(0, 2), 10);
  const h12 = h % 12 || 12;
  return `${h12}:${t.slice(3, 5)} ${h >= 12 ? "PM" : "AM"}`;
};

// ── component ─────────────────────────────────────────────
export function Queue({ onPrescribe }: { onPrescribe?: (patientId: string, appointmentId: string) => void } = {}) {
  const { data, loading, error, refetch, setToken } = useQueue();
  const appointments = data.appointments;

  // Session transition popup
  const [showSessionPopup, setShowSessionPopup] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "next" | "prev";
    targetAppointment: Appointment;
    targetSession: "morning" | "evening";
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const currentPatient = getCurrentAppointment(appointments);
  const firstPatient = getFirstAppointment(appointments);
  const allDone = isAllDone(appointments);
  const prevResult = currentPatient ? getPrevAppointment(currentPatient, appointments) : null;

  // Next disabled only when everyone is done; Prev when there is nothing to go back to
  const isNextDisabled = loading || busy || allDone;
  const isPrevDisabled = loading || busy || !currentPatient || !prevResult;

  // ── status transitions (uses existing endpoints) ────────
  // PATCH /appointments/{id}/status + POST /queue/set-token via setToken().
  // DB statuses: "Completed" = Done, "Confirmed" = Waiting.
  const advanceToAppointment = async (target: Appointment, previous: Appointment | null) => {
    setBusy(true);
    try {
      if (previous) await api.appointments.updateStatus(previous.id, "Completed");
      await api.appointments.updateStatus(target.id, "In Progress");
      await setToken(target.token_number ?? 0); // syncs tokens table + refetches
    } finally {
      setBusy(false);
    }
  };

  const revertToAppointment = async (current: Appointment, prev: Appointment) => {
    setBusy(true);
    try {
      await api.appointments.updateStatus(current.id, "Confirmed"); // back to Waiting
      await api.appointments.updateStatus(prev.id, "In Progress");  // Done → In Progress
      await setToken(prev.token_number ?? 0);
    } finally {
      setBusy(false);
    }
  };

  const finishLastPatient = async (current: Appointment) => {
    setBusy(true);
    try {
      await api.appointments.updateStatus(current.id, "Completed");
      await setToken(0);
    } finally {
      setBusy(false);
    }
  };

  // ── Next / Prev handlers ─────────────────────────────────
  const handleNext = async () => {
    const current = getCurrentAppointment(appointments);

    // Start of day — no one In Progress yet
    if (!current) {
      const first = getFirstPendingAppointment(appointments);
      if (!first) return;
      await advanceToAppointment(first, null);
      return;
    }

    const next = getNextAppointment(current, appointments);

    // Last patient finished — mark them done, day complete
    if (!next) {
      await finishLastPatient(current);
      return;
    }

    if (next.crossSession && next.targetSession) {
      setPendingAction({ type: "next", targetAppointment: next.appointment, targetSession: next.targetSession });
      setShowSessionPopup(true);
      return;
    }

    await advanceToAppointment(next.appointment, current);
  };

  const handlePrev = async () => {
    const current = getCurrentAppointment(appointments);
    if (!current) return;

    const prev = getPrevAppointment(current, appointments);
    if (!prev) return; // already at first patient (button disabled anyway)

    if (prev.crossSession && prev.targetSession) {
      setPendingAction({ type: "prev", targetAppointment: prev.appointment, targetSession: prev.targetSession });
      setShowSessionPopup(true);
      return;
    }

    await revertToAppointment(current, prev.appointment);
  };

  // ── session popup confirm/cancel ─────────────────────────
  const handleSessionConfirm = async () => {
    if (!pendingAction) return;
    const current = getCurrentAppointment(appointments);

    if (pendingAction.type === "next") {
      await advanceToAppointment(pendingAction.targetAppointment, current);
    } else if (current) {
      await revertToAppointment(current, pendingAction.targetAppointment);
    }

    setShowSessionPopup(false);
    setPendingAction(null);
  };

  const handleSessionCancel = () => {
    setShowSessionPopup(false);
    setPendingAction(null);
  };

  const eveningWaitingCount = appointments.filter(p =>
    isEvening(p.appointment_time) &&
    p.status !== "Cancelled" && p.status !== "Completed" && p.queue_status !== "Done"
  ).length;

  return (
    <div className="p-7 space-y-6">
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
        {/* Now Serving card */}
        <div className="col-span-1 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200 flex flex-col items-center justify-center gap-1">
          {loading ? (
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 56, lineHeight: 1 }}>…</div>
          ) : currentPatient ? (
            <>
              <div className="text-xs font-semibold opacity-80 uppercase tracking-widest">Now Serving</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 64, lineHeight: 1.1 }}>
                {currentPatient.display_token || currentPatient.token_number}
              </div>
              <div className="font-semibold text-base text-center">{patientName(currentPatient)}</div>
              <div className="text-[12px] opacity-70">
                {isEvening(currentPatient.appointment_time) ? "🌙 Evening Session" : "🌅 Morning Session"}
              </div>
            </>
          ) : allDone ? (
            <>
              <div className="text-4xl mb-1">🎉</div>
              <div className="text-lg font-semibold">All done for today!</div>
              <div className="text-[12px] opacity-70">All patients have been seen</div>
            </>
          ) : firstPatient ? (
            <>
              <div className="text-xs font-semibold opacity-80 uppercase tracking-widest mb-1">Tap Next to begin</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 48, lineHeight: 1 }} className="opacity-40">
                {firstPatient.display_token || firstPatient.token_number}
              </div>
              <div className="text-base font-medium opacity-60">{patientName(firstPatient)}</div>
              <div className="text-[12px] opacity-50">First patient today</div>
            </>
          ) : (
            <div className="text-[13px] opacity-70">No appointments today</div>
          )}

          <div className="flex gap-3 mt-4 w-full">
            <button
              onClick={handlePrev}
              disabled={isPrevDisabled}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[13px] font-semibold transition-colors ${
                isPrevDisabled
                  ? "opacity-40 cursor-not-allowed bg-white/10 text-white/60"
                  : "bg-white/20 hover:bg-white/30 text-white cursor-pointer"
              }`}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              onClick={handleNext}
              disabled={isNextDisabled}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[13px] font-semibold transition-colors ${
                isNextDisabled
                  ? "opacity-40 cursor-not-allowed bg-white/30 text-white/70"
                  : "bg-white text-emerald-700 hover:bg-emerald-50 cursor-pointer shadow-sm"
              }`}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="col-span-2 grid grid-cols-2 gap-4">
          {[
            { icon: <Users size={22} className="text-blue-600" />, label: "Waiting", value: loading ? "—" : data.waiting, sub: "patients in queue", bg: "bg-blue-50", border: "border-blue-100" },
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

      {/* Session transition popup */}
      {showSessionPopup && pendingAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl">
            <div className="text-4xl text-center mb-3">
              {pendingAction.targetSession === "evening" ? "🌙" : "🌅"}
            </div>

            <h3 className="text-lg font-semibold text-center text-slate-900 mb-2">
              {pendingAction.type === "next"
                ? pendingAction.targetSession === "evening"
                  ? "Morning session complete!"
                  : "Go back to morning session?"
                : pendingAction.targetSession === "morning"
                  ? "Go back to morning session?"
                  : "Jump to evening session?"}
            </h3>

            <p className="text-sm text-center text-slate-500 mb-6">
              {pendingAction.type === "next" && pendingAction.targetSession === "evening" && (
                <>
                  {eveningWaitingCount} evening patient{eveningWaitingCount === 1 ? "" : "s"} waiting
                  <span className="block mt-1 text-indigo-500">
                    Starting with {pendingAction.targetAppointment.display_token}{" "}
                    {patientName(pendingAction.targetAppointment)}
                  </span>
                </>
              )}
              {pendingAction.type === "next" && pendingAction.targetSession === "morning" && (
                <>
                  Morning patients are still pending
                  <span className="block mt-1 text-amber-500">
                    Next is {pendingAction.targetAppointment.display_token}{" "}
                    {patientName(pendingAction.targetAppointment)}
                  </span>
                </>
              )}
              {pendingAction.type === "prev" && (
                <>
                  Going back to {pendingAction.targetAppointment.display_token}{" "}
                  {patientName(pendingAction.targetAppointment)}
                  <span className="block mt-1 text-amber-500">
                    Current patient will be set back to Waiting
                  </span>
                </>
              )}
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleSessionCancel}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSessionConfirm}
                disabled={busy}
                className={`flex-1 py-3 px-4 rounded-xl text-white font-medium transition-colors ${
                  pendingAction.targetSession === "evening"
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-amber-500 hover:bg-amber-600"
                }`}
              >
                {pendingAction.type === "next"
                  ? pendingAction.targetSession === "evening"
                    ? "Start Evening →"
                    : "Go Back →"
                  : "← Go Back"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
