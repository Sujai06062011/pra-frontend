import { useState, useMemo } from "react";
import { Search, Filter, CheckCircle2, Clock, XCircle, Activity, ChevronDown, Plus, RefreshCw } from "lucide-react";
import { useTodayAppointments, useAppointments, useQueue } from "../../../hooks/usePRAData";
import { type Appointment } from "../../../lib/api";

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
  const day = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { dateFrom: fmt(monday), dateTo: fmt(sunday) };
}

type DerivedStatus = "done" | "in-progress" | "waiting" | "cancelled";

function deriveStatus(apt: Appointment, currentToken: number): DerivedStatus {
  if (apt.status === "Cancelled") return "cancelled";
  const t = apt.token_number ?? 0;
  if (t <= currentToken) return "done";
  if (t === currentToken + 1) return "in-progress";
  return "waiting";
}

const statusConfig: Record<DerivedStatus, { label: string; icon: React.ReactNode; cls: string }> = {
  done:          { label: "Done",        icon: <CheckCircle2 size={11} />, cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  "in-progress": { label: "In Progress", icon: <Activity size={11} />,     cls: "bg-blue-50 text-blue-700 border border-blue-200" },
  waiting:       { label: "Waiting",     icon: <Clock size={11} />,        cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  cancelled:     { label: "Cancelled",   icon: <XCircle size={11} />,      cls: "bg-rose-50 text-rose-600 border border-rose-200" },
};

type DateTab = "today" | "week" | "all";
type StatusFilter = "all" | DerivedStatus;

// ── main ─────────────────────────────────────────────────
export function Appointments({ onNewAppointment }: { onNewAppointment?: () => void }) {
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateTab, setDateTab]     = useState<DateTab>("today");

  const weekRange = useMemo(() => getThisWeekRange(), []);

  // Always call all three hooks (rules of hooks); only use the active one
  const todayHook = useTodayAppointments();
  const weekHook  = useAppointments(undefined, weekRange.dateFrom, weekRange.dateTo);
  const allHook   = useAppointments();

  const activeHook =
    dateTab === "today" ? todayHook :
    dateTab === "week"  ? weekHook  : allHook;

  const { data: rawAppointments, loading, error, refetch } = activeHook;

  // Queue status to derive "done / in-progress / waiting"
  const { data: queue } = useQueue();
  const currentToken = queue.current_token ?? 0;

  // Derive status and filter
  const appointments: (Appointment & { derivedStatus: DerivedStatus })[] = useMemo(() =>
    (rawAppointments ?? []).map((a, idx) => ({
      ...a,
      _colorIdx: idx,
      derivedStatus: deriveStatus(a, currentToken),
    })),
    [rawAppointments, currentToken]
  );

  const filtered = useMemo(() => {
    return appointments.filter(a => {
      const matchSearch = !search || (a.patients?.name ?? "").toLowerCase().includes(search.toLowerCase());
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
  }), [appointments]);

  return (
    <div className="p-7 space-y-5">
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
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search patient…"
              className="pl-8 pr-4 py-2 text-[13px] bg-white border border-slate-200 rounded-xl w-full text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-[13px] text-slate-600 bg-white hover:bg-slate-50 transition-colors">
            <Filter size={14} /> Filter <ChevronDown size={13} />
          </button>
        </div>
        <button
          onClick={onNewAppointment}
          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-semibold px-4 py-2 rounded-xl shadow-sm shadow-emerald-200 transition-colors"
        >
          <Plus size={15} /> New Appointment
        </button>
      </div>

      {/* Date tabs + Status filter row */}
      <div className="flex items-center justify-between gap-4">
        {/* Date tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
          {(["today", "week", "all"] as DateTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setDateTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                dateTab === tab
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab === "today" ? "Today" : tab === "week" ? "This Week" : "All"}
            </button>
          ))}
        </div>

        {/* Status filter pills */}
        <div className="flex gap-2">
          {(["all", "in-progress", "waiting", "done", "cancelled"] as StatusFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-all ${
                statusFilter === f
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600"
              }`}
            >
              {f === "in-progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}{" "}
              <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${statusFilter === f ? "bg-white/25" : "bg-slate-100 text-slate-400"}`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              {["Token", "Patient", "Contact", "Date", "Type", "Status", "Action"].map(h => (
                <th key={h} className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 px-5 py-3.5 border-b border-slate-100">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-[13px] text-slate-400">Loading appointments…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-[13px] text-slate-400">No appointments found</td>
              </tr>
            ) : (
              filtered.map((apt, idx) => {
                const s = statusConfig[apt.derivedStatus];
                const patientName = apt.patients?.name ?? "Unknown";
                const color = avatarColors[idx % avatarColors.length];
                const dateStr = apt.appointment_date
                  ? new Date(apt.appointment_date + "T00:00:00").toLocaleDateString("en-IN", { dateStyle: "medium" })
                  : "—";

                return (
                  <tr key={apt.id} className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors cursor-pointer">
                    <td className="px-5 py-3.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold ${apt.derivedStatus === "in-progress" ? "bg-emerald-500 text-white shadow-sm" : "bg-slate-100 text-slate-500"}`}>
                        {apt.token_number ?? "—"}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white text-[12px] font-bold shadow-sm`}>
                          {patientName[0]}
                        </div>
                        <div>
                          <div className="text-[13px] font-medium text-slate-800">{patientName}</div>
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
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
                        New Visit
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.cls}`}>
                        {s.icon} {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2">
                        <button className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 transition-all">
                          View
                        </button>
                        {apt.derivedStatus === "in-progress" && (
                          <button
                            onClick={() => {
                              const params = new URLSearchParams({ patient_id: apt.patient_id, appointment_id: apt.id });
                              window.location.href = `/prescriptions/new?${params}`;
                            }}
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all"
                          >
                            Prescribe
                          </button>
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
  );
}
