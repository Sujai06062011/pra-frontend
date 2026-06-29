import { useState, useEffect } from "react";
import {
  CheckCircle2, Clock, AlertCircle, MessageCircle, RefreshCw,
  Calendar, XCircle, Activity
} from "lucide-react";
import { api, type FollowUp, type FollowUpSummary } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

const avatarColors = [
  "from-rose-400 to-pink-500", "from-sky-400 to-blue-500", "from-fuchsia-400 to-purple-500",
  "from-teal-400 to-cyan-500", "from-indigo-400 to-violet-500", "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500", "from-lime-400 to-emerald-500", "from-orange-400 to-amber-500",
];

type FilterTab = "all" | "pending" | "whatsapp_sent" | "recovered" | "recovering" | "needs_appointment" | "no_response";
type DaysRange = 7 | 30 | 0;

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  "Pending":          { label: "Pending",           cls: "bg-amber-50 text-amber-700 border-amber-200",    icon: <Clock size={11} /> },
  "Whatsapp-Sent":    { label: "WA Sent",            cls: "bg-blue-50 text-blue-700 border-blue-200",       icon: <MessageCircle size={11} /> },
  "Recovered":        { label: "Recovered",          cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 size={11} /> },
  "Recovering":       { label: "Recovering",         cls: "bg-violet-50 text-violet-700 border-violet-200", icon: <Activity size={11} /> },
  "Needs Appointment":{ label: "Needs Appt",         cls: "bg-orange-50 text-orange-700 border-orange-200", icon: <Calendar size={11} /> },
  "Booked":           { label: "Booked",             cls: "bg-teal-50 text-teal-700 border-teal-200",       icon: <CheckCircle2 size={11} /> },
  "No Response":      { label: "No Response",        cls: "bg-rose-50 text-rose-700 border-rose-200",       icon: <AlertCircle size={11} /> },
  "Completed":        { label: "Completed",          cls: "bg-slate-50 text-slate-600 border-slate-200",    icon: <CheckCircle2 size={11} /> },
  "Call-Triggered":   { label: "Call Triggered",     cls: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: <Activity size={11} /> },
};

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all",               label: "All" },
  { key: "pending",           label: "Pending" },
  { key: "whatsapp_sent",     label: "WA Sent" },
  { key: "recovered",         label: "Recovered" },
  { key: "recovering",        label: "Recovering" },
  { key: "needs_appointment", label: "Needs Appt" },
  { key: "no_response",       label: "No Response" },
];

const EMPTY_SUMMARY: FollowUpSummary = {
  total: 0, awaiting_reply: 0, resolved: 0, needs_attention: 0,
  pending: 0, whatsapp_sent: 0, recovered: 0, recovering: 0,
  needs_appointment: 0, booked: 0, no_response: 0, completed: 0, call_triggered: 0,
};

export function FollowUps() {
  const { doctorId } = useAuth();
  const [days, setDays] = useState<DaysRange>(7);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [summary, setSummary] = useState<FollowUpSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = async () => {
    if (!doctorId) return;
    setLoading(true);
    setError(false);
    try {
      const [rows, sum] = await Promise.all([
        api.followups.listFiltered(doctorId, days === 0 ? 3650 : days, activeTab),
        api.followups.summary(doctorId, days === 0 ? 3650 : days),
      ]);
      setFollowUps(rows);
      setSummary(sum);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [doctorId, days, activeTab]);

  const daysLabel = days === 0 ? "All time" : days === 7 ? "7 days" : "30 days";

  return (
    <div className="p-4 sm:p-7 space-y-6">
      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <span className="text-[13px] text-rose-700 flex-1">Failed to load follow-ups.</span>
          <button onClick={load} className="flex items-center gap-1 text-[12px] font-semibold text-rose-600">
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {([7, 30, 0] as DaysRange[]).map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${days === d ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {d === 0 ? "All time" : d === 7 ? "7 days" : "30 days"}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Awaiting Reply",  value: summary.awaiting_reply,  accent: "border-l-amber-400",   dot: "bg-amber-400",   icon: <Clock size={14} className="text-amber-500" /> },
          { label: "Recovered",       value: summary.recovered,        accent: "border-l-emerald-400", dot: "bg-emerald-400", icon: <CheckCircle2 size={14} className="text-emerald-500" /> },
          { label: "Still Recovering",value: summary.recovering + summary.needs_appointment, accent: "border-l-violet-400", dot: "bg-violet-400", icon: <Activity size={14} className="text-violet-500" /> },
          { label: "No Response",     value: summary.no_response,      accent: "border-l-rose-400",    dot: "bg-rose-400",    icon: <XCircle size={14} className="text-rose-500" /> },
        ].map(c => (
          <div key={c.label} className={`bg-white rounded-2xl border border-slate-100 border-l-4 ${c.accent} p-4 shadow-sm`}>
            <div className="flex items-center gap-2 mb-2">{c.icon}<span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{c.label}</span></div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, lineHeight: 1 }} className="text-slate-800">{loading ? "…" : c.value}</div>
            <div className="text-[11px] text-slate-400 mt-1">{daysLabel}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {FILTER_TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${activeTab === tab.key ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {tab.label}
            {tab.key === "all" && !loading && <span className="ml-1.5 opacity-70">{summary.total}</span>}
            {tab.key === "pending" && !loading && <span className="ml-1.5 opacity-70">{summary.pending}</span>}
            {tab.key === "whatsapp_sent" && !loading && <span className="ml-1.5 opacity-70">{summary.whatsapp_sent}</span>}
            {tab.key === "recovered" && !loading && <span className="ml-1.5 opacity-70">{summary.recovered}</span>}
            {tab.key === "recovering" && !loading && <span className="ml-1.5 opacity-70">{summary.recovering}</span>}
            {tab.key === "needs_appointment" && !loading && <span className="ml-1.5 opacity-70">{summary.needs_appointment}</span>}
            {tab.key === "no_response" && !loading && <span className="ml-1.5 opacity-70">{summary.no_response}</span>}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-10 text-[13px] text-slate-400">Loading follow-ups…</div>
      ) : followUps.length === 0 ? (
        <div className="text-center py-10 text-[13px] text-slate-400">No follow-ups found</div>
      ) : (
        <div className="space-y-2">
          {followUps.map((f, idx) => {
            const name = f.patients?.name || "Unknown";
            const phone = f.patients?.mobile || "";
            const status = f.call_status || "Pending";
            const sc = STATUS_CONFIG[status] || STATUS_CONFIG["Pending"];
            const color = avatarColors[idx % avatarColors.length];
            const scheduledDate = f.scheduled_date
              ? new Date(f.scheduled_date + "T00:00:00").toLocaleDateString("en-IN", { dateStyle: "medium" })
              : null;
            const createdDate = f.created_at
              ? new Date(f.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })
              : "—";
            return (
              <div key={f.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm text-[13px]`}>
                  {name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }} className="text-slate-800">{name}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sc.cls}`}>
                      {sc.icon} {sc.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1"><Calendar size={10} /> Added: {createdDate}</span>
                    {scheduledDate && <span className="flex items-center gap-1"><Clock size={10} /> Scheduled: {scheduledDate}</span>}
                    {f.response && <span className="text-slate-400">· {f.response}</span>}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 flex-shrink-0 hidden sm:block">{phone}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
