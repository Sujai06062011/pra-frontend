import { useState, useMemo, useCallback, useEffect } from "react";
import { Search, CheckCircle2, Clock, XCircle, Activity, RefreshCw, AlertTriangle, Loader2, UserX, ShieldOff, ChevronDown } from "lucide-react";
import { useTodayAppointments, useAppointments, useQueue } from "../../../hooks/usePRAData";
import { useAuth } from "../../../context/AuthContext";
import { useClinicContext } from "../../../hooks/useClinicContext";
import { DoctorSwitcher } from "../DoctorSwitcher";
import { api, type Appointment } from "../../../lib/api";

// ── helpers ──────────────────────────────────────────────
const avatarColors = [
  "from-indigo-400 to-violet-500", "from-pink-400 to-rose-500",
  "from-violet-400 to-purple-500", "from-fuchsia-400 to-pink-500",
  "from-sky-400 to-blue-500", "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500", "from-lime-400 to-emerald-500",
  "from-cyan-400 to-sky-500", "from-rose-400 to-pink-500",
  "from-teal-400 to-cyan-500", "from-orange-400 to-amber-500",
];

function formatMobile(mobile?: string) {
  if (!mobile) return "—";
  const m = mobile.replace(/\D/g, "");
  const local = m.slice(-10);
  return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
}

function getThisWeekRange(): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { dateFrom: fmt(monday), dateTo: fmt(sunday) };
}

function getTomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

type DerivedStatus = "done" | "in-progress" | "waiting" | "cancelled" | "no-show";

function deriveStatus(apt: Appointment, currentToken: number): DerivedStatus {
  if (apt.status === "No-Show") return "no-show";
  if (apt.queue_status === "Cancelled" || apt.status === "Cancelled") return "cancelled";
  if (apt.queue_status === "In Progress") return "in-progress";
  if (apt.queue_status === "Done" || apt.status === "Completed") return "done";
  if (apt.queue_status === "Waiting") return "waiting";
  const t = apt.token_number ?? 0;
  if (currentToken > 0 && t === currentToken) return "in-progress";
  if (t < currentToken) return "done";
  return "waiting";
}

const fmtSlotTime = (t?: string) => {
  if (!t) return "—";
  const h = parseInt(t.slice(0, 2), 10);
  const h12 = h % 12 || 12;
  return `${h12}:${t.slice(3, 5)} ${h >= 12 ? "PM" : "AM"}`;
};

const statusConfig: Record<DerivedStatus, { label: string; icon: React.ReactNode; cls: string }> = {
  "done":        { label: "Seen",        icon: <CheckCircle2 size={11} />, cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  "in-progress": { label: "In Progress", icon: <Activity size={11} />,     cls: "bg-blue-50 text-blue-700 border border-blue-200" },
  "waiting":     { label: "Waiting",     icon: <Clock size={11} />,        cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  "cancelled":   { label: "Cancelled",   icon: <XCircle size={11} />,      cls: "bg-rose-50 text-rose-600 border border-rose-200" },
  "no-show":     { label: "No Show",     icon: <UserX size={11} />,        cls: "bg-orange-50 text-orange-600 border border-orange-200" },
};

type DateTab = "today" | "tomorrow" | "week" | "all";
type StatusFilter = "all" | DerivedStatus;

function isSelectable(status: DerivedStatus): boolean {
  return status === "waiting" || status === "cancelled" === false && status !== "done" && status !== "in-progress";
}

// actually: selectable = waiting or confirmed-ish (not done, not in-progress, not cancelled)
function canSelect(status: DerivedStatus): boolean {
  return status === "waiting";
}

// ── sort ─────────────────────────────────────────────────
const STATUS_ORDER: Record<DerivedStatus, number> = {
  "in-progress": 0,
  waiting:       1,
  done:          2,
  "no-show":     3,
  cancelled:     4,
};

function tokenNum(token?: string | number | null): number {
  if (token == null) return 0;
  const s = String(token);
  const m = s.match(/(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

function sortAppointments<T extends { derivedStatus: DerivedStatus; display_token?: string | null; token_number?: number | null }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const sd = STATUS_ORDER[a.derivedStatus] - STATUS_ORDER[b.derivedStatus];
    if (sd !== 0) return sd;
    return tokenNum(a.display_token ?? a.token_number) - tokenNum(b.display_token ?? b.token_number);
  });
}

// ── Toast ────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-[13px] font-semibold ${type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
      {type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  );
}

// ── Confirmation Modal ───────────────────────────────────
interface ModalProps {
  appointments: (Appointment & { derivedStatus: DerivedStatus })[];
  onConfirm: () => void;
  onBack: () => void;
  isCancelling: boolean;
}

function CancelModal({ appointments, onConfirm, onBack, isCancelling }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle size={18} className="text-amber-600" />
            </div>
            <div>
              <div className="text-[15px] font-bold text-slate-800">Cancel Appointments</div>
              <div className="text-[12px] text-slate-500">{appointments.length} appointment{appointments.length !== 1 ? "s" : ""} selected</div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 max-h-64 overflow-y-auto space-y-2">
          {appointments.map(apt => (
            <div key={apt.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <div>
                <div className="text-[13px] font-semibold text-slate-700">{apt.patients?.name ?? "Unknown"}</div>
                <div className="text-[11px] text-slate-400">Token {apt.display_token || apt.token_number || "—"}</div>
              </div>
              <div className="text-[12px] font-medium text-slate-500">{fmtSlotTime(apt.appointment_time)}</div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 bg-amber-50 border-t border-amber-100">
          <div className="flex items-start gap-2 text-[12px] text-amber-700">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            WhatsApp notification will be sent to all patients
          </div>
        </div>

        <div className="px-6 py-4 flex gap-3">
          <button
            onClick={onBack}
            disabled={isCancelling}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            disabled={isCancelling}
            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 text-white text-[13px] font-semibold hover:bg-rose-600 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isCancelling ? <><Loader2 size={14} className="animate-spin" /> Cancelling…</> : "Confirm Cancel + Notify"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── main ─────────────────────────────────────────────────
export function Appointments({ onNewAppointment, onPrescribe }: { onNewAppointment?: () => void; onPrescribe?: (patientId: string, appointmentId: string) => void }) {
  const { doctorId } = useAuth();
  const { context: clinicCtx } = useClinicContext(doctorId);
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctorId);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("waiting");
  const [dateTab, setDateTab]     = useState<DateTab>("today");

  // Animation: IDs just cancelled in the current action (for flash highlight)
  const [justCancelledIds, setJustCancelledIds] = useState<Set<string>>(new Set());

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [blockPrompt, setBlockPrompt] = useState<{
    date: string;
    hasMorning: boolean;
    hasEvening: boolean;
    hasBoth: boolean;
  } | null>(null);
  const [blocking, setBlocking] = useState(false);

  const weekRange = useMemo(() => getThisWeekRange(), []);
  const tomorrowDate = useMemo(() => getTomorrowDate(), []);

  const todayHook    = useTodayAppointments(selectedDoctorId);
  const tomorrowHook = useAppointments(tomorrowDate, undefined, undefined, selectedDoctorId);
  const weekHook     = useAppointments(undefined, weekRange.dateFrom, weekRange.dateTo, selectedDoctorId);
  const allHook      = useAppointments(undefined, undefined, undefined, selectedDoctorId);

  const activeHook =
    dateTab === "today"    ? todayHook    :
    dateTab === "tomorrow" ? tomorrowHook :
    dateTab === "week"     ? weekHook     : allHook;

  const { data: rawAppointments, loading, error, refetch } = activeHook;

  const { data: queue } = useQueue();
  const currentToken = queue.current_token ?? 0;

  const appointments: (Appointment & { derivedStatus: DerivedStatus })[] = useMemo(() => {
    const mapped = (rawAppointments ?? []).map((a, idx) => ({
      ...a,
      _colorIdx: idx,
      derivedStatus: deriveStatus(a, currentToken),
    }));
    return sortAppointments(mapped);
  }, [rawAppointments, currentToken]);

  // Auto-fallback: if default "waiting" filter yields nothing, show "all"
  useEffect(() => {
    if (statusFilter === "waiting" && !loading && appointments.length > 0) {
      const hasWaiting = appointments.some(a => a.derivedStatus === "waiting");
      if (!hasWaiting) setStatusFilter("all");
    }
  }, [appointments, loading, statusFilter]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return appointments.filter(a => {
      const qDigits = q.replace(/\D/g, "");
      const matchSearch = !q || (
        (a.patients?.name ?? "").toLowerCase().includes(q) ||
        (qDigits.length > 0 && (a.patients?.mobile ?? "").replace(/\D/g, "").includes(qDigits)) ||
        (a.patients?.patient_code ?? "").toLowerCase().includes(q)
      );
      const matchStatus = statusFilter === "all" || a.derivedStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [appointments, search, statusFilter]);

  const counts: Record<StatusFilter, number> = useMemo(() => ({
    all:           appointments.length,
    done:          appointments.filter(a => a.derivedStatus === "done").length,
    "in-progress": appointments.filter(a => a.derivedStatus === "in-progress").length,
    waiting:       appointments.filter(a => a.derivedStatus === "waiting").length,
    cancelled:     appointments.filter(a => a.derivedStatus === "cancelled").length,
    "no-show":     appointments.filter(a => a.derivedStatus === "no-show").length,
  }), [appointments]);

  // Selectable rows = waiting only (not done / in-progress / cancelled)
  const selectableFiltered = filtered.filter(a => canSelect(a.derivedStatus));

  const allChecked = selectableFiltered.length > 0 && selectableFiltered.every(a => selectedIds.has(a.id));
  const someChecked = selectableFiltered.some(a => selectedIds.has(a.id));

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allChecked) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableFiltered.map(a => a.id)));
    }
  };

  const selectGroup = (group: "morning" | "evening") => {
    const ids = selectableFiltered
      .filter(a => {
        const h = a.appointment_time ? parseInt(a.appointment_time.slice(0, 2), 10) : 0;
        return group === "morning" ? h < 13 : h >= 13;
      })
      .map(a => a.id);
    setSelectedIds(new Set(ids));
  };

  const selectAll = () => setSelectedIds(new Set(selectableFiltered.map(a => a.id)));

  const handleStatusChange = useCallback(async (id: string, status: Appointment["status"]) => {
    try {
      await api.appointments.updateStatus(id, status);
      refetch();
      setOpenActionMenu(null);
    } catch {
      // silent — refetch will show current state
    }
  }, [refetch]);

  const selectedAppointments = filtered.filter(a => selectedIds.has(a.id));

  // Clear selection on tab change
  const handleTabChange = (tab: DateTab) => {
    setDateTab(tab);
    setSelectedIds(new Set());
  };

  const handleConfirmCancel = useCallback(async () => {
    setIsCancelling(true);
    try {
      const ids = Array.from(selectedIds);

      // Capture session info before clearing selection
      const cancelledAppts = selectedAppointments;
      const cancelDate = cancelledAppts[0]?.appointment_date ?? new Date().toISOString().slice(0, 10);
      const hasMorning = cancelledAppts.some(a => {
        const h = a.appointment_time ? parseInt(a.appointment_time.slice(0, 2), 10) : 0;
        return h < 13;
      });
      const hasEvening = cancelledAppts.some(a => {
        const h = a.appointment_time ? parseInt(a.appointment_time.slice(0, 2), 10) : 0;
        return h >= 13;
      });

      let result: { cancelled: string[]; failed: string[]; whatsapp_sent: number; whatsapp_failed: number };

      try {
        result = await api.appointments.bulkCancel(ids, "doctor_unavailable", true);
      } catch {
        const cancelled: string[] = [];
        const failed: string[] = [];
        for (const id of ids) {
          try {
            await api.appointments.updateStatus(id, "Cancelled");
            cancelled.push(id);
          } catch {
            failed.push(id);
          }
        }
        result = { cancelled, failed, whatsapp_sent: 0, whatsapp_failed: 0 };
      }

      setShowModal(false);
      setSelectedIds(new Set());

      const cancelledSet = new Set(result.cancelled);
      setJustCancelledIds(cancelledSet);

      setTimeout(() => {
        setJustCancelledIds(new Set());
        refetch();
      }, 2000);

      const msg = result.failed.length === 0
        ? `${result.cancelled.length} appointment${result.cancelled.length !== 1 ? "s" : ""} cancelled. WhatsApp sent to ${result.whatsapp_sent} patient${result.whatsapp_sent !== 1 ? "s" : ""}.`
        : `${result.cancelled.length} cancelled, ${result.failed.length} failed. WhatsApp sent to ${result.whatsapp_sent}.`;

      setToast({ msg, type: result.failed.length === 0 ? "success" : "error" });

      // Show block prompt only for today/tomorrow tabs (single date)
      if (dateTab === "today" || dateTab === "tomorrow") {
        setBlockPrompt({ date: cancelDate, hasMorning, hasEvening, hasBoth: hasMorning && hasEvening });
      }
    } finally {
      setIsCancelling(false);
    }
  }, [selectedIds, selectedAppointments, dateTab, refetch]);

  const handleBlock = async (blockType: "morning" | "evening" | "full_day") => {
    if (!blockPrompt) return;
    setBlocking(true);
    try {
      await api.availability.blockFromCancel(selectedDoctorId, blockPrompt.date, blockType);
      const label = blockType === "morning" ? "Morning" : blockType === "evening" ? "Evening" : "Full day";
      setToast({ msg: `${label} slots blocked. New bookings for this period are disabled.`, type: "success" });
      setBlockPrompt(null);
    } catch {
      setToast({ msg: "Failed to block slots. Please try again.", type: "error" });
    } finally {
      setBlocking(false);
    }
  };

  return (
    <div className="p-7 space-y-5">
      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Block prompt — appears after bulk cancel */}
      {blockPrompt && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-700">
            <ShieldOff size={15} className="text-slate-500" />
            Block remaining open slots?
          </div>
          <p className="text-[12px] text-slate-500">
            This will prevent new bookings via WhatsApp and the appointment form.
          </p>
          <div className="flex flex-wrap gap-2">
            {blockPrompt.hasMorning && (
              <button
                onClick={() => handleBlock("morning")}
                disabled={blocking}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-[12px] font-semibold rounded-xl transition-colors"
              >
                Block Morning Slots
              </button>
            )}
            {blockPrompt.hasEvening && (
              <button
                onClick={() => handleBlock("evening")}
                disabled={blocking}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-[12px] font-semibold rounded-xl transition-colors"
              >
                Block Evening Slots
              </button>
            )}
            {blockPrompt.hasBoth && (
              <button
                onClick={() => handleBlock("full_day")}
                disabled={blocking}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-[12px] font-semibold rounded-xl transition-colors"
              >
                Block Full Day
              </button>
            )}
            <button
              onClick={() => setBlockPrompt(null)}
              className="px-4 py-2 border border-slate-200 text-slate-600 text-[12px] font-semibold rounded-xl hover:bg-slate-100 transition-colors"
            >
              Keep Slots Open
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showModal && (
        <CancelModal
          appointments={selectedAppointments}
          onConfirm={handleConfirmCancel}
          onBack={() => setShowModal(false)}
          isCancelling={isCancelling}
        />
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <span className="text-[13px] text-rose-700 flex-1">Failed to load appointments.</span>
          <button onClick={refetch} className="flex items-center gap-1 text-[12px] font-semibold text-rose-600">
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, mobile or patient code…"
              className="pl-8 pr-4 py-2 text-[13px] bg-white border border-slate-200 rounded-xl w-full text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
            />
          </div>
        </div>
        {clinicCtx.multi_doctor_enabled && (
          <DoctorSwitcher
            clinicWhatsapp={clinicCtx.whatsapp_number}
            selectedDoctorId={selectedDoctorId}
            onSelect={(id) => setSelectedDoctorId(id)}
          />
        )}
      </div>

      {/* Date tabs + Status filter row */}
      <div className="flex items-center justify-between gap-4">
        {/* Date tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
          {(["today", "tomorrow", "week", "all"] as DateTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                dateTab === tab
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab === "today" ? "Today" : tab === "tomorrow" ? "Tomorrow" : tab === "week" ? "This Week" : "All"}
            </button>
          ))}
        </div>

        {/* Status filter pills */}
        <div className="flex gap-2">
          {(["all", "in-progress", "waiting", "done", "no-show", "cancelled"] as StatusFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-all ${
                statusFilter === f
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600"
              }`}
            >
              {f === "in-progress" ? "In Progress" : f === "no-show" ? "No Show" : f === "done" ? "Seen" : f.charAt(0).toUpperCase() + f.slice(1)}{" "}
              <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${statusFilter === f ? "bg-white/25" : "bg-slate-100 text-slate-400"}`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectableFiltered.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5">
          <span className="text-[12px] font-semibold text-slate-500 mr-1">Bulk action:</span>
          <button onClick={selectAll} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors">Cancel All</button>
          <button onClick={() => selectGroup("morning")} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors">Cancel Morning</button>
          <button onClick={() => selectGroup("evening")} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors">Cancel Evening</button>
          {selectedIds.size > 0 && (
            <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-[11px] text-slate-400 hover:text-slate-600 transition-colors">Clear selection</button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="min-w-[700px] w-full">
          <thead>
            <tr className="bg-slate-50">
              {/* Checkbox header */}
              <th className="px-4 py-3.5 border-b border-slate-100 w-10">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={el => { if (el) el.indeterminate = !allChecked && someChecked; }}
                  onChange={toggleAll}
                  disabled={selectableFiltered.length === 0}
                  className="w-3.5 h-3.5 accent-emerald-500 cursor-pointer disabled:cursor-not-allowed"
                />
              </th>
              {["Token", "Patient", "Contact", "Date", "Time", "Type", "Status"].map(h => (
                <th key={h} className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 px-5 py-3.5 border-b border-slate-100">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-[13px] text-slate-400">Loading appointments…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-[13px] text-slate-400">No appointments found</td>
              </tr>
            ) : (
              filtered.map((apt, idx) => {
                const s = statusConfig[apt.derivedStatus];
                const patientName = apt.patients?.name ?? "Unknown";
                const color = avatarColors[idx % avatarColors.length];
                const dateStr = apt.appointment_date
                  ? new Date(apt.appointment_date + "T00:00:00").toLocaleDateString("en-IN", { dateStyle: "medium" })
                  : "—";

                const isCancelled = apt.derivedStatus === "cancelled";
                const isNoShow = apt.derivedStatus === "no-show";
                const isUncancellable = apt.derivedStatus === "done" || apt.derivedStatus === "in-progress" || isNoShow;
                const isSelected = selectedIds.has(apt.id);
                const isJustCancelled = justCancelledIds.has(apt.id);

                return (
                  <tr
                    key={apt.id}
                    style={{ transition: "background-color 0.4s ease-in-out" }}
                    className={`border-b border-slate-50 cursor-pointer ${
                      isJustCancelled
                        ? "bg-red-100 border-l-2 border-l-red-300"
                        : isSelected
                        ? "bg-amber-50 border-l-2 border-l-amber-400"
                        : isCancelled
                        ? "bg-rose-50"
                        : isNoShow
                        ? "bg-orange-50/40"
                        : "hover:bg-emerald-50/30"
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(apt.id)}
                        disabled={!canSelect(apt.derivedStatus)}
                        title={isUncancellable ? "Cannot cancel — appointment is already in progress or done" : isCancelled ? "Already cancelled" : undefined}
                        className="w-3.5 h-3.5 accent-emerald-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold ${isCancelled ? "bg-slate-200 text-slate-400" : apt.derivedStatus === "in-progress" ? "bg-emerald-500 text-white shadow-sm" : "bg-slate-100 text-slate-500"}`}>
                        {apt.display_token || apt.token_number || "—"}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white text-[12px] font-bold shadow-sm ${isCancelled ? "opacity-50" : ""}`}>
                          {patientName[0]}
                        </div>
                        <div>
                          <div className={`text-[13px] font-medium text-slate-800 ${isCancelled ? "opacity-60 line-through" : ""}`}>{patientName}</div>
                          <div className="text-[11px] text-slate-400">
                            {apt.patients?.age ? `${apt.patients.age} yrs` : ""}
                            {apt.patients?.age && apt.patients?.gender ? " · " : ""}
                            {apt.patients?.gender === "M" ? "Male" : apt.patients?.gender === "F" ? "Female" : ""}
                            {apt.patients?.patient_code ? ` · ${apt.patients.patient_code}` : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-500">
                      {formatMobile(apt.patients?.mobile)}
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-500">{dateStr}</td>
                    <td className="px-5 py-3.5 text-[12px] font-medium text-slate-600">{fmtSlotTime(apt.appointment_time)}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
                        New Visit
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="relative flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.cls}`}>
                          {s.icon} {s.label}
                        </span>
                        {(apt.derivedStatus === "waiting" || apt.derivedStatus === "in-progress") && (
                          <div className="relative">
                            <button
                              onClick={e => { e.stopPropagation(); setOpenActionMenu(openActionMenu === apt.id ? null : apt.id); }}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                              <ChevronDown size={13} />
                            </button>
                            {openActionMenu === apt.id && (
                              <div className="absolute right-0 top-7 z-50 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[140px]">
                                <button onClick={() => handleStatusChange(apt.id, "Completed")} className="w-full text-left px-3 py-2 text-[12px] text-emerald-700 hover:bg-emerald-50 flex items-center gap-2">
                                  <CheckCircle2 size={12} /> Mark as Seen
                                </button>
                                <button onClick={() => handleStatusChange(apt.id, "No-Show")} className="w-full text-left px-3 py-2 text-[12px] text-orange-600 hover:bg-orange-50 flex items-center gap-2">
                                  <UserX size={12} /> Mark as No Show
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Floating bottom bar when selection is active */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-slate-800 text-white px-5 py-3 rounded-2xl shadow-2xl">
          <span className="text-[13px] font-semibold">
            {selectedIds.size} appointment{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-1.5 rounded-xl bg-rose-500 text-white text-[12px] font-bold hover:bg-rose-600 transition-colors"
          >
            Cancel Selected
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-[12px] text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
