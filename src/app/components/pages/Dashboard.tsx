import { useState, useCallback } from "react";
import type { Page } from "../Sidebar";
import {
  CalendarDays, Hash, Pill, Phone, FlaskConical, MessageCircle,
  TrendingUp, TrendingDown, ChevronRight, AlertTriangle, X,
  CheckCircle2, Clock, XCircle, ArrowRight, Activity, RefreshCw
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { useDashboardStats, useAppointments, useTodayAppointments, useQueries, useFollowUps } from "../../../hooks/usePRAData";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";

const visitTypes = [
  { name: "Follow-up", value: 45, color: "#10b981" },
  { name: "New Visit", value: 30, color: "#3b82f6" },
  { name: "Referral", value: 15, color: "#8b5cf6" },
  { name: "Emergency", value: 10, color: "#f43f5e" },
];


const avatarColors = [
  "from-violet-400 to-purple-500", "from-pink-400 to-rose-500", "from-sky-400 to-blue-500",
  "from-emerald-400 to-teal-500", "from-amber-400 to-orange-500", "from-cyan-400 to-sky-500",
];

const statusConfig = {
  done: { label: "Done", icon: <CheckCircle2 size={12} />, cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  "in-progress": { label: "In Progress", icon: <Activity size={12} />, cls: "bg-blue-50 text-blue-700 border border-blue-200" },
  waiting: { label: "Waiting", icon: <Clock size={12} />, cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  cancelled: { label: "Cancelled", icon: <XCircle size={12} />, cls: "bg-rose-50 text-rose-700 border border-rose-200" },
};

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  unit?: string;
  accent: string;
  accentBg: string;
  details: { dot: string; label: string }[];
  extra?: React.ReactNode;
}

function StatCard({ icon, title, value, unit, accent, accentBg, details, extra }: StatCardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer`}>
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent}`} />
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${accentBg} flex items-center justify-center`}>{icon}</div>
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">{title}</div>
      {extra ?? (
        <div className="flex items-end gap-2 mb-3">
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 34, lineHeight: 1 }} className="text-slate-800">{value}</span>
          {unit && <span className="text-sm text-slate-400 mb-1">{unit}</span>}
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        {details.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
            <div className={`w-1.5 h-1.5 rounded-full ${d.dot}`} />
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-xs">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-500">{p.name}:</span>
            <span className="font-semibold text-slate-700">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Date helpers
function getWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diffToMon = (day === 0 ? -6 : 1 - day);
  const mon = new Date(now); mon.setDate(now.getDate() + diffToMon); mon.setHours(0,0,0,0);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return { from: mon.toISOString().slice(0,10), to: sun.toISOString().slice(0,10) };
}
function getMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
  const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0,10);
  return { from, to };
}

export function Dashboard({ onNavigate }: { onNavigate?: (page: Page) => void }) {
  const { doctorId } = useAuth();
  const [alertVisible, setAlertVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<"today" | "week" | "month">("today");

  const { data: stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats();
  const { data: todayAppts, loading: apptsLoading, error: apptsError } = useTodayAppointments();

  // Range-filtered appointments for week/month tabs
  const week  = getWeekRange();
  const month = getMonthRange();
  const { data: weekAppts,  loading: weekLoading  } = useAppointments(undefined, week.from,  week.to);
  const { data: monthAppts, loading: monthAppts2 } = useAppointments(undefined, month.from, month.to);

  const tabAppts   = activeTab === "today" ? todayAppts  : activeTab === "week" ? weekAppts  : monthAppts;
  const tabLoading = activeTab === "today" ? apptsLoading : activeTab === "week" ? weekLoading : monthAppts2;

  const { data: queries } = useQueries();
  const { data: followUps } = useFollowUps();

  const pendingQueries = queries.filter(q => q.status === "Pending");
  const pendingFollowUps = followUps.filter(f => !f.completed_at);
  const attentionTotal = pendingQueries.length + pendingFollowUps.length;

  const weekData = stats.weekly_appointments.map((d) => ({
    day: new Date(d.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short" }),
    appointments: d.count,
    walkins: 0,
    completed: 0,
  }));

  const tabLabel = activeTab === "today" ? "Today" : activeTab === "week" ? "This Week" : "This Month";
  const tabCount = tabAppts.length;

  return (
    <div className="p-7 space-y-6">

      {/* Error banner */}
      {(statsError || apptsError) && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-rose-600 flex-shrink-0" />
          <p className="flex-1 text-[13px] text-rose-700">Failed to load dashboard data.</p>
          <button onClick={refetchStats} className="flex items-center gap-1 text-[12px] font-semibold text-rose-600 hover:text-rose-700">
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {/* Alert bar */}
      {alertVisible && stats.pending_followups > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={16} className="text-amber-600" />
          </div>
          <p className="flex-1 text-[13px] text-slate-700">
            <span className="font-semibold text-amber-700">{stats.pending_followups} follow-ups</span> pending
          </p>
          <button onClick={() => setAlertVisible(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(["today", "week", "month"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-5 py-2 rounded-lg text-[13px] font-semibold transition-all capitalize ${
              activeTab === t ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "today" ? "Today" : t === "week" ? "This Week" : "This Month"}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">

        {/* Appointments */}
        <div onClick={() => onNavigate?.("appointments")} className="cursor-pointer">
          <StatCard
            icon={<CalendarDays size={20} className="text-emerald-600" />}
            title="Today's Appointments"
            value={statsLoading ? "—" : stats.today_appointments}
            unit="total"
            accent="bg-gradient-to-r from-emerald-400 to-teal-400"
            accentBg="bg-emerald-50"
            details={[
              { dot: "bg-emerald-500", label: `${statsLoading ? "—" : stats.today_completed} Completed` },
              { dot: "bg-rose-500", label: `${statsLoading ? "—" : stats.today_appointments - stats.today_completed} Remaining` },
            ]}
          />
        </div>

        {/* Live Queue */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden cursor-pointer">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400" />
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Hash size={20} className="text-emerald-600" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Live Queue</span>
          </div>
          <div className="flex items-center gap-5 mb-3">
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Now Serving</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 44, lineHeight: 1, color: "#10b981" }} className="drop-shadow-sm">
                {statsLoading ? "—" : stats.current_token}
              </div>
            </div>
            <div className="w-px h-14 bg-slate-100" />
            <div className="flex-1 space-y-1.5">
              {[
                { l: "Total Today", v: statsLoading ? "—" : `${stats.today_appointments} tokens` },
                { l: "Completed", v: statsLoading ? "—" : `${stats.today_completed}` },
              ].map((s) => (
                <div key={s.l} className="flex justify-between text-[12px]">
                  <span className="text-slate-400">{s.l}</span>
                  <span className="font-semibold text-slate-700">{s.v}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => onNavigate?.("queue")}
            className="w-full py-1.5 text-[12px] font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-sm shadow-emerald-200 transition-colors"
          >
            Manage Queue →
          </button>
        </div>

        {/* Total Patients */}
        <div onClick={() => onNavigate?.("patients")} className="cursor-pointer">
          <StatCard
            icon={<Phone size={20} className="text-violet-600" />}
            title="Total Patients"
            value={statsLoading ? "—" : stats.total_patients}
            unit="registered"
            accent="bg-gradient-to-r from-violet-400 to-purple-400"
            accentBg="bg-violet-50"
            details={[
              { dot: "bg-violet-500", label: `${statsLoading ? "—" : stats.pending_followups} follow-ups pending` },
            ]}
          />
        </div>

        {/* Follow-ups */}
        <div onClick={() => onNavigate?.("followups")} className="cursor-pointer">
          <StatCard
            icon={<Phone size={20} className="text-violet-600" />}
            title="Post-Visit Follow-ups"
            value={statsLoading ? "—" : stats.pending_followups}
            unit="pending"
            accent="bg-gradient-to-r from-violet-400 to-purple-400"
            accentBg="bg-violet-50"
            details={[
              { dot: "bg-rose-500", label: "Pending action" },
            ]}
          />
        </div>

        {/* Lab Reports */}
        <StatCard
          icon={<FlaskConical size={20} className="text-blue-600" />}
          title="Lab Reports"
          value="—"
          unit="pending review"
          accent="bg-gradient-to-r from-blue-400 to-sky-400"
          accentBg="bg-blue-50"
          details={[
            { dot: "bg-blue-500", label: "Coming soon" },
          ]}
        />

        {/* Patient Queries */}
        <div onClick={() => onNavigate?.("queries")} className="cursor-pointer">
          <StatCard
            icon={<MessageCircle size={20} className="text-rose-600" />}
            title="Patient Queries"
            value={statsLoading ? "—" : pendingQueries.length}
            unit="unanswered"
            accent="bg-gradient-to-r from-rose-400 to-pink-400"
            accentBg="bg-rose-50"
            details={[
              { dot: "bg-rose-500", label: "Check queries tab" },
            ]}
          />
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-5 gap-4">

        {/* Appointments Table */}
        <div className="col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800">
                {tabLabel} Appointments
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{tabLoading ? "…" : `${tabCount} total`}</p>
            </div>
            <button
              onClick={() => onNavigate?.("appointments")}
              className="flex items-center gap-1 text-[12px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              See all <ArrowRight size={13} />
            </button>
          </div>
          {tabLoading ? (
            <div className="px-5 py-8 text-center text-[13px] text-slate-400">Loading appointments…</div>
          ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/60">
                {["Token", "Patient", "Date", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 px-5 py-3 border-b border-slate-100">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(tabAppts.length === 0) ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-[13px] text-slate-400">No appointments for this period</td></tr>
              ) : tabAppts.slice(0, 8).map((apt, idx) => {
                const patientName = apt.patients?.name || "Unknown";
                const patientAge = apt.patients?.age;
                const currentToken = stats.current_token ?? 0;
                const t = apt.token_number ?? 0;
                const mappedStatus: string =
                  apt.status === "Cancelled" ? "cancelled" :
                  t <= currentToken           ? "done" :
                  t === currentToken + 1      ? "in-progress" :
                                                "waiting";
                const s = statusConfig[mappedStatus as keyof typeof statusConfig];
                const color = avatarColors[idx % avatarColors.length];
                return (
                  <tr key={apt.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer group">
                    <td className="px-5 py-3.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold ${mappedStatus === "in-progress" ? "bg-emerald-500 text-white shadow-sm" : "bg-slate-100 text-slate-600"}`}>
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
                          {patientAge && <div className="text-[11px] text-slate-400">{patientAge} yrs</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-400">
                      {apt.appointment_date ? new Date(apt.appointment_date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.cls}`}>
                        {s.icon}{s.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button className="text-[11px] font-semibold px-3 py-1 rounded-lg border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 transition-all">
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          )}
        </div>

        {/* Right panels */}
        <div className="col-span-2 space-y-4">

          {/* Needs Attention */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }} className="text-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 bg-rose-100 rounded-md flex items-center justify-center">
                  <AlertTriangle size={11} className="text-rose-600" />
                </span>
                Needs Attention
              </h3>
              {attentionTotal > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-600">{attentionTotal}</span>
              )}
            </div>
            {attentionTotal === 0 ? (
              <div className="px-4 py-6 text-center text-[12px] text-slate-400">All clear — nothing needs attention</div>
            ) : (
              <>
                {pendingFollowUps.slice(0, 3).map((f, i) => (
                  <div key={f.id ?? i} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="w-2 h-2 rounded-full flex-shrink-0 bg-rose-500" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-slate-800">{f.patients?.name ?? "Patient"}</div>
                      <div className="text-[11px] text-slate-400 truncate">Follow-up pending</div>
                    </div>
                    <button className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors">
                      📞 Call
                    </button>
                  </div>
                ))}
                {pendingQueries.slice(0, 3).map((q, i) => (
                  <div key={q.id ?? i} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="w-2 h-2 rounded-full flex-shrink-0 bg-amber-500" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-slate-800">{q.patients?.name ?? "Patient"}</div>
                      <div className="text-[11px] text-slate-400 truncate">Query awaiting reply</div>
                    </div>
                    <button className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">
                      💬 Reply
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Week bar chart */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }} className="text-slate-800">
                This Week
              </h3>
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                <TrendingUp size={12} /> +18% vs last
              </span>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={weekData} barSize={14} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={20} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="appointments" name="Booked" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="walkins" name="Walk-ins" fill="#c7f3e8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Visit type donut */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }} className="text-slate-800 mb-3">
              Visit Types
            </h3>
            <div className="flex items-center gap-3">
              <ResponsiveContainer width={90} height={90}>
                <PieChart>
                  <Pie data={visitTypes} cx="50%" cy="50%" innerRadius={28} outerRadius={42} dataKey="value" strokeWidth={0}>
                    {visitTypes.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {visitTypes.map((vt) => (
                  <div key={vt.name} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: vt.color }} />
                      <span className="text-slate-500">{vt.name}</span>
                    </div>
                    <span className="font-semibold text-slate-700">{vt.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
