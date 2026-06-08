import { useState } from "react";
import type { Page } from "../Sidebar";
import {
  CalendarDays, Hash, Pill, Phone, FlaskConical, MessageCircle,
  TrendingUp, TrendingDown, ChevronRight, AlertTriangle, X,
  CheckCircle2, Clock, XCircle, ArrowRight, Activity
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const weekData = [
  { day: "Mon", appointments: 8, walkins: 3, completed: 9 },
  { day: "Tue", appointments: 11, walkins: 5, completed: 13 },
  { day: "Wed", appointments: 9, walkins: 4, completed: 11 },
  { day: "Thu", appointments: 12, walkins: 6, completed: 14 },
  { day: "Fri", appointments: 0, walkins: 0, completed: 0 },
  { day: "Sat", appointments: 0, walkins: 0, completed: 0 },
];

const monthTrend = [
  { week: "Wk 1", patients: 42 },
  { week: "Wk 2", patients: 56 },
  { week: "Wk 3", patients: 48 },
  { week: "Wk 4", patients: 67 },
];

const visitTypes = [
  { name: "Follow-up", value: 45, color: "#10b981" },
  { name: "New Visit", value: 30, color: "#3b82f6" },
  { name: "Referral", value: 15, color: "#8b5cf6" },
  { name: "Emergency", value: 10, color: "#f43f5e" },
];

const appointments = [
  { token: 3, name: "Sujaikumar", age: 43, gender: "M", time: "9:30 AM", status: "done", color: "from-violet-400 to-purple-500" },
  { token: 4, name: "Poornima", age: 43, gender: "F", time: "9:45 AM", status: "done", color: "from-pink-400 to-rose-500" },
  { token: 5, name: "Rajesh Kumar", age: 35, gender: "M", time: "10:00 AM", status: "in-progress", color: "from-sky-400 to-blue-500" },
  { token: 6, name: "Ananya Devi", age: 28, gender: "F", time: "10:15 AM", status: "waiting", color: "from-emerald-400 to-teal-500" },
  { token: 7, name: "Mohammed Ali", age: 52, gender: "M", time: "10:30 AM", status: "waiting", color: "from-amber-400 to-orange-500" },
];

const attentionItems = [
  { name: "Kavitha S.", sub: "No response · 3 days overdue", type: "call", urgency: "red" },
  { name: "Dinesh R.", sub: "Requested appointment booking", type: "book", urgency: "amber" },
  { name: "Meena T.", sub: "No response · 2 days overdue", type: "call", urgency: "red" },
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

export function Dashboard({ onNavigate }: { onNavigate?: (page: Page) => void }) {
  const [alertVisible, setAlertVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<"today" | "week" | "month">("today");
  const [queueToken, setQueueToken] = useState(5);

  return (
    <div className="p-7 space-y-6">

      {/* Alert bar */}
      {alertVisible && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={16} className="text-amber-600" />
          </div>
          <p className="flex-1 text-[13px] text-slate-700">
            <span className="font-semibold text-amber-700">3 patients</span> have not responded to follow-up calls ·{" "}
            <span className="font-semibold text-amber-700">2 prescriptions</span> ending today ·{" "}
            <span className="font-semibold text-amber-700">5 queries</span> awaiting doctor reply
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
        <StatCard
          icon={<CalendarDays size={20} className="text-emerald-600" />}
          title="Today's Appointments"
          value={12}
          unit="total"
          accent="bg-gradient-to-r from-emerald-400 to-teal-400"
          accentBg="bg-emerald-50"
          details={[
            { dot: "bg-emerald-500", label: "10 Confirmed" },
            { dot: "bg-rose-500", label: "2 Cancelled" },
          ]}
        />

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
                {queueToken}
              </div>
            </div>
            <div className="w-px h-14 bg-slate-100" />
            <div className="flex-1 space-y-1.5">
              {[{ l: "Waiting", v: "7 patients" }, { l: "Avg Wait", v: "~35 mins" }, { l: "Total Today", v: "12 tokens" }].map((s) => (
                <div key={s.l} className="flex justify-between text-[12px]">
                  <span className="text-slate-400">{s.l}</span>
                  <span className="font-semibold text-slate-700">{s.v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setQueueToken((t) => Math.max(1, t - 1))}
              className="px-3 py-1.5 text-[12px] font-semibold border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => setQueueToken((t) => t + 1)}
              className="flex-1 py-1.5 text-[12px] font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-sm shadow-emerald-200 transition-colors"
            >
              Next Token →
            </button>
          </div>
        </div>

        {/* Medicine Alerts */}
        <StatCard
          icon={<Pill size={20} className="text-amber-600" />}
          title="Medicine Alerts"
          value={5}
          unit="active"
          accent="bg-gradient-to-r from-amber-400 to-orange-400"
          accentBg="bg-amber-50"
          details={[
            { dot: "bg-rose-500", label: "2 Ending Today" },
            { dot: "bg-amber-500", label: "3 Tomorrow" },
          ]}
        />

        {/* Follow-ups */}
        <StatCard
          icon={<Phone size={20} className="text-violet-600" />}
          title="Post-Visit Follow-ups"
          value={8}
          unit="pending"
          accent="bg-gradient-to-r from-violet-400 to-purple-400"
          accentBg="bg-violet-50"
          details={[
            { dot: "bg-rose-500", label: "3 No Response" },
            { dot: "bg-amber-500", label: "2 Needs Appt" },
            { dot: "bg-emerald-500", label: "15 Resolved" },
          ]}
        />

        {/* Lab Reports */}
        <StatCard
          icon={<FlaskConical size={20} className="text-blue-600" />}
          title="Lab Reports"
          value={7}
          unit="pending review"
          accent="bg-gradient-to-r from-blue-400 to-sky-400"
          accentBg="bg-blue-50"
          details={[
            { dot: "bg-blue-500", label: "3 New Today" },
            { dot: "bg-emerald-500", label: "24 Reviewed" },
          ]}
        />

        {/* Patient Queries */}
        <StatCard
          icon={<MessageCircle size={20} className="text-rose-600" />}
          title="Patient Queries"
          value={5}
          unit="unanswered"
          accent="bg-gradient-to-r from-rose-400 to-pink-400"
          accentBg="bg-rose-50"
          details={[
            { dot: "bg-rose-500", label: "2 New Today" },
            { dot: "bg-emerald-500", label: "12 Answered" },
          ]}
        />
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-5 gap-4">

        {/* Appointments Table */}
        <div className="col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800">
                Today's Appointments
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">04 June 2026 · 12 total</p>
            </div>
            <button
              onClick={() => onNavigate?.("appointments")}
              className="flex items-center gap-1 text-[12px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              See all <ArrowRight size={13} />
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/60">
                {["Token", "Patient", "Time", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 px-5 py-3 border-b border-slate-100">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => {
                const s = statusConfig[apt.status as keyof typeof statusConfig];
                return (
                  <tr key={apt.token} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer group">
                    <td className="px-5 py-3.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold ${apt.status === "in-progress" ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200" : "bg-slate-100 text-slate-600"}`}>
                        {apt.token}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${apt.color} flex items-center justify-center text-white text-[12px] font-bold shadow-sm`}>
                          {apt.name[0]}
                        </div>
                        <div>
                          <div className="text-[13px] font-medium text-slate-800">{apt.name}</div>
                          <div className="text-[11px] text-slate-400">{apt.age} yrs · {apt.gender === "M" ? "Male" : "Female"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-500">{apt.time}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.cls}`}>
                        {s.icon}{s.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button className={`text-[11px] font-semibold px-3 py-1 rounded-lg border transition-all ${
                        apt.status === "in-progress"
                          ? "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                          : "border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600"
                      }`}>
                        {apt.status === "in-progress" ? "Prescribe" : "View"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-600">3</span>
            </div>
            {attentionItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.urgency === "red" ? "bg-rose-500" : "bg-amber-500"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-slate-800">{item.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{item.sub}</div>
                </div>
                <button className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                  item.type === "call"
                    ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                }`}>
                  {item.type === "call" ? "📞 Call" : "📅 Book"}
                </button>
              </div>
            ))}
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
