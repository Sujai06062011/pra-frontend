import { useState, useCallback } from "react";
import { ChevronRight, ChevronLeft, Clock, Users, CheckCircle2, Activity, RefreshCw, AlertTriangle, UserX } from "lucide-react";
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

function minutesSince(appointmentTime?: string): number {
  if (!appointmentTime) return 0;
  const now = new Date();
  const [h, m] = appointmentTime.split(":").map(Number);
  const scheduled = new Date(now);
  scheduled.setHours(h, m, 0, 0);
  return Math.max(0, Math.floor((now.getTime() - scheduled.getTime()) / 60000));
}

// Queue sort: In Progress → Waiting → No-Show → Done → Cancelled
const Q_ORDER: Record<string, number> = {
  "in-progress": 0,
  waiting:       1,
  done:          2,
  "no-show":     3,
  cancelled:     4,
};

function queueStatus(p: Appointment): string {
  if (p.status === "Cancelled") return "cancelled";
  if (p.status === "No-Show") return "no-show";
  if (p.status === "In Progress" || p.queue_status === "In Progress") return "in-progress";
  if (p.status === "Completed" || p.queue_status === "Done") return "done";
  return "waiting";
}

function tokenNum(tok?: string | number | null): number {
  const s = String(tok ?? ""); const m = s.match(/(\d+)$/); return m ? parseInt(m[1], 10) : 0;
}

function sortQueue(appts: Appointment[]): Appointment[] {
  return [...appts].sort((a, b) => {
    const sd = (Q_ORDER[queueStatus(a)] ?? 9) - (Q_ORDER[queueStatus(b)] ?? 9);
    return sd !== 0 ? sd : tokenNum(a.display_token ?? a.token_number) - tokenNum(b.display_token ?? b.token_number);
  });
}

// ── Toast ────────────────────────────────────────────────
function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-[13px] font-semibold bg-amber-600 text-white">
      <UserX size={15} /> {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  );
}

// ── No Show Modal ────────────────────────────────────────
function NoShowModal({
  appointment,
  onConfirm,
  onClose,
  busy,
}: {
  appointment: Appointment;
  onConfirm: (sendWhatsapp: boolean) => void;
  onClose: () => void;
  busy: boolean;
}) {
  const name = appointment.patients?.name ?? "Patient";
  const mins = minutesSince(appointment.appointment_time);
  const token = appointment.display_token || appointment.token_number || "—";
  const time  = fmtTime(appointment.appointment_time);
  const firstName = name.split(" ")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle size={18} className="text-amber-600" />
            </div>
            <div>
              <div className="text-[15px] font-bold text-slate-800">Mark as No Show?</div>
              <div className="text-[12px] text-slate-500">This will log a follow-up call task</div>
            </div>
          </div>
        </div>

        {/* Patient info */}
        <div className="px-6 py-4 space-y-1">
          <div className="text-[14px] font-semibold text-slate-800">{name}</div>
          <div className="text-[12px] text-slate-500">
            Token: <span className="font-semibold text-slate-700">{token}</span>
            {time && <> · Scheduled: <span className="font-semibold text-slate-700">{time}</span></>}
          </div>
          {mins > 0 && (
            <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-700">
              <Clock size={11} /> {mins} min{mins !== 1 ? "s" : ""} since scheduled time
            </div>
          )}
        </div>

        {/* WhatsApp preview */}
        <div className="mx-6 mb-4 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">WhatsApp message preview</div>
          <div className="text-[12px] text-slate-600 leading-relaxed">
            Hi {firstName} 👋, we noticed you missed your appointment{time ? ` at ${time}` : ""} today. Please reply to reschedule at your convenience.
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => onConfirm(true)}
              disabled={busy}
              className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-[13px] font-semibold hover:bg-amber-600 transition-colors disabled:opacity-60"
            >
              No Show + WhatsApp
            </button>
            <button
              onClick={() => onConfirm(false)}
              disabled={busy}
              className="flex-1 px-4 py-2.5 rounded-xl border border-amber-300 text-amber-700 text-[13px] font-semibold hover:bg-amber-50 transition-colors disabled:opacity-60"
            >
              No Show Only
            </button>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 text-[13px] text-slate-500 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [actionError, setActionError] = useState("");

  // No Show state
  const [noShowTarget, setNoShowTarget] = useState<Appointment | null>(null);
  const [noShowBusy, setNoShowBusy] = useState(false);
  const [justNoShowedIds, setJustNoShowedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  // Optimistic overrides: id → "No-Show" so UI updates immediately
  const [optimisticNoShows, setOptimisticNoShows] = useState<Set<string>>(new Set());

  const currentPatient = getCurrentAppointment(appointments);
  const firstPatient = getFirstAppointment(appointments);
  const allDone = isAllDone(appointments);
  const prevResult = currentPatient ? getPrevAppointment(currentPatient, appointments) : null;

  const isNextDisabled = loading || busy || allDone;
  const isPrevDisabled = loading || busy || !currentPatient || !prevResult;

  const runTransition = async (steps: () => Promise<void>) => {
    setBusy(true);
    setActionError("");
    try {
      await steps();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Queue update failed");
      refetch();
    } finally {
      setBusy(false);
    }
  };

  const advanceToAppointment = (target: Appointment, previous: Appointment | null) =>
    runTransition(async () => {
      await api.appointments.updateStatus(target.id, "In Progress");
      if (previous) await api.appointments.updateStatus(previous.id, "Completed");
      await setToken(target.token_number ?? 0);
    });

  const revertToAppointment = (current: Appointment, prev: Appointment) =>
    runTransition(async () => {
      await api.appointments.updateStatus(prev.id, "In Progress");
      await api.appointments.updateStatus(current.id, "Confirmed");
      await setToken(prev.token_number ?? 0);
    });

  const finishLastPatient = (current: Appointment) =>
    runTransition(async () => {
      await api.appointments.updateStatus(current.id, "Completed");
      await setToken(0);
    });

  const handleNext = async () => {
    const current = getCurrentAppointment(appointments);
    if (!current) {
      const first = getFirstPendingAppointment(appointments);
      if (!first) return;
      await advanceToAppointment(first, null);
      return;
    }
    const next = getNextAppointment(current, appointments);
    if (!next) { await finishLastPatient(current); return; }
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
    if (!prev) return;
    if (prev.crossSession && prev.targetSession) {
      setPendingAction({ type: "prev", targetAppointment: prev.appointment, targetSession: prev.targetSession });
      setShowSessionPopup(true);
      return;
    }
    await revertToAppointment(current, prev.appointment);
  };

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

  const handleSessionCancel = () => { setShowSessionPopup(false); setPendingAction(null); };

  // ── No Show confirm ──────────────────────────────────────
  const handleNoShowConfirm = useCallback(async (sendWhatsapp: boolean) => {
    if (!noShowTarget) return;
    setNoShowBusy(true);
    try {
      const result = await api.appointments.noShow(noShowTarget.id, sendWhatsapp);
      const token = noShowTarget.display_token || noShowTarget.token_number || "";
      const name  = noShowTarget.patients?.name ?? "Patient";

      // Optimistic update
      setOptimisticNoShows(prev => new Set(prev).add(noShowTarget.id));

      // Flash amber highlight
      setJustNoShowedIds(new Set([noShowTarget.id]));
      setTimeout(() => {
        setJustNoShowedIds(new Set());
        refetch();
      }, 2000);

      setNoShowTarget(null);
      setToast(
        result.whatsapp_sent
          ? `${token} marked as No Show. WhatsApp sent to ${name}.`
          : `${token} marked as No Show.`
      );
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "No Show update failed");
      setNoShowTarget(null);
    } finally {
      setNoShowBusy(false);
    }
  }, [noShowTarget, refetch]);

  const eveningWaitingCount = appointments.filter(p =>
    isEvening(p.appointment_time) &&
    p.status !== "Cancelled" && p.status !== "No-Show" && p.status !== "Completed" && p.queue_status !== "Done"
  ).length;

  // Apply optimistic no-shows then sort
  const displayAppointments = sortQueue(
    appointments.map(p =>
      optimisticNoShows.has(p.id) ? { ...p, status: "No-Show" as const } : p
    )
  );

  // Waiting count excludes No-Show patients
  const waitingCount = displayAppointments.filter(p => queueStatus(p) === "waiting").length;

  return (
    <div className="p-7 space-y-6">
      {/* Toast */}
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      {/* No Show Modal */}
      {noShowTarget && (
        <NoShowModal
          appointment={noShowTarget}
          onConfirm={handleNoShowConfirm}
          onClose={() => setNoShowTarget(null)}
          busy={noShowBusy}
        />
      )}

      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <span className="text-[13px] text-rose-700 flex-1">Failed to load queue data.</span>
          <button onClick={refetch} className="flex items-center gap-1 text-[12px] font-semibold text-rose-600">
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {actionError && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <span className="text-[13px] text-amber-800 flex-1">Queue update failed: {actionError}</span>
          <button onClick={() => setActionError("")} className="text-[12px] font-semibold text-amber-700">Dismiss</button>
        </div>
      )}

      {/* Hero queue display */}
      <div className="flex flex-col md:grid md:grid-cols-3 gap-4">
        {/* Now Serving card */}
        <div className="md:col-span-1 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200 flex flex-col items-center justify-center gap-1">
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
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          {[
            { icon: <Users size={18} className="text-blue-600" />, label: "Waiting", value: loading ? "—" : waitingCount, sub: "in queue", bg: "bg-blue-50", border: "border-blue-100" },
            { icon: <Clock size={18} className="text-amber-600" />, label: "Avg Wait Time", value: "—", sub: "estimate", bg: "bg-amber-50", border: "border-amber-100" },
            { icon: <CheckCircle2 size={18} className="text-emerald-600" />, label: "Completed", value: loading ? "—" : data.completed, sub: "today", bg: "bg-emerald-50", border: "border-emerald-100" },
            { icon: <Activity size={18} className="text-violet-600" />, label: "Total Tokens", value: loading ? "—" : data.total_today, sub: "issued", bg: "bg-violet-50", border: "border-violet-100" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-3 md:p-5 overflow-hidden min-w-0 flex flex-col gap-1`}>
              <div className="w-9 h-9 md:w-10 md:h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">{s.icon}</div>
              <div className="min-w-0">
                <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">{s.label}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, lineHeight: 1.2 }} className="text-2xl text-slate-800">{s.value}</div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">{s.sub}</div>
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
            {displayAppointments.map((p, idx) => {
              const qs = queueStatus(p);
              const isCancelled = qs === "cancelled";
              const isNoShow    = qs === "no-show";
              const isCurrent   = qs === "in-progress";
              const isDone      = qs === "done";
              const isWaiting   = qs === "waiting";
              const isFlashing  = justNoShowedIds.has(p.id);
              const color = avatarColors[idx % avatarColors.length];
              const name = p.patients?.name || "Unknown";

              return (
                <div
                  key={p.id}
                  style={{ transition: "background-color 0.4s ease-in-out" }}
                  className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-5 py-3.5 transition-colors ${
                    isFlashing  ? "bg-amber-100" :
                    isCancelled ? "opacity-40 bg-white" :
                    isNoShow    ? "bg-amber-50/60" :
                    isCurrent   ? "bg-emerald-50" : "hover:bg-slate-50"
                  }`}
                >
                  {/* Line 1 on mobile: token + avatar + name/age */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Token number */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[14px] font-bold flex-shrink-0 ${
                      isCancelled ? "bg-slate-200 text-slate-400" :
                      isNoShow    ? "bg-amber-100 text-amber-500" :
                      isCurrent   ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200" :
                      isDone      ? "bg-slate-100 text-slate-400" :
                                    "bg-slate-100 text-slate-600"
                    }`}>
                      {p.display_token || p.token_number || "—"}
                    </div>

                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white text-[13px] font-bold shadow-sm flex-shrink-0 ${(isCancelled || isNoShow) ? "opacity-50" : ""}`}>
                      {name[0]}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[13px] font-medium text-slate-800 ${isCancelled ? "line-through" : ""}`}>
                          {name}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">CURRENT</span>
                        )}
                      </div>
                      {p.patients?.age && <div className="text-[11px] text-slate-400">{p.patients.age} yrs</div>}
                    </div>
                  </div>

                  {/* Line 2 on mobile: time + badges */}
                  <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
                    {/* Slot time */}
                    <div className="text-[12px] font-medium text-slate-500 sm:w-20 sm:text-right">
                      {fmtTime(p.appointment_time)}
                    </div>

                    {/* Badge / actions */}
                    {isCancelled && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                        Cancelled
                      </span>
                    )}
                    {isNoShow && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <UserX size={11} /> No Show
                      </span>
                    )}
                    {!isCancelled && !isNoShow && isDone && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={11} /> Seen
                      </span>
                    )}
                    {!isCancelled && !isNoShow && isCurrent && (
                      <>
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
                      </>
                    )}
                    {isWaiting && (
                      <>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock size={11} /> Waiting
                        </span>
                        <button
                          onClick={() => setNoShowTarget(p)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-orange-300 text-orange-600 hover:bg-orange-50 transition-colors"
                        >
                          <UserX size={11} /> No Show
                        </button>
                      </>
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
