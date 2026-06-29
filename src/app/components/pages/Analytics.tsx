import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar
} from "recharts";
import { TrendingUp, TrendingDown, Users, Calendar, Star, Activity, RefreshCw } from "lucide-react";
import { api, type AnalyticsSummary } from "../../../lib/api";

const DOCTOR_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"];
const CONDITION_COLORS = ["#f43f5e", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#06b6d4"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-xs">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
            <span className="text-slate-500">{p.name}:</span>
            <span className="font-semibold text-slate-700">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: number | null;
  color: string;
  loading: boolean;
  sub?: string;
}

function KpiCard({ icon, label, value, change, color, loading, sub }: KpiCardProps) {
  const up = change !== null && change !== undefined && change >= 0;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
        {change !== null && change !== undefined && !loading && (
          <div className={`flex items-center gap-1 text-[12px] font-semibold ${up ? "text-emerald-600" : "text-rose-600"}`}>
            {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, lineHeight: 1.2 }} className="text-slate-800">
        {loading ? "—" : value}
      </div>
      {sub && !loading && <div className="text-[11px] text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

const EMPTY: AnalyticsSummary = {
  kpis: { total_patients_month: 0, patients_seen_month: 0, total_patients_change: null, avg_daily_appts: 0, avg_daily_change: null, avg_satisfaction: null, followup_rate: 0 },
  monthly_trend: [],
  appts_by_doctor: [],
  age_distribution: [],
  peak_hours: [],
  top_conditions: [],
  retention: { d30: 0, d90: 0, all_time: 0 },
  doctor_names: [],
};

export function Analytics() {
  const [data, setData] = useState<AnalyticsSummary>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.analytics.summary();
      setData(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const { kpis, monthly_trend, appts_by_doctor, age_distribution, peak_hours, top_conditions, retention, doctor_names } = data;

  const retentionData = [
    { name: "Returned w/in 30d", value: retention.d30,    fill: "#10b981" },
    { name: "Returned w/in 90d", value: retention.d90,    fill: "#3b82f6" },
    { name: "Ever returned",     value: retention.all_time, fill: "#8b5cf6" },
  ];

  const currentMonth = new Date().toLocaleString("en-IN", { month: "short" }) + " " + new Date().getFullYear();

  return (
    <div className="p-4 sm:p-7 space-y-6">

      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <span className="text-[13px] text-rose-700 flex-1">Failed to load analytics.</span>
          <button onClick={load} className="flex items-center gap-1 text-[12px] font-semibold text-rose-600">
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={<Users size={20} className="text-emerald-600" />}
          label="Total Patients"
          value={String(kpis.total_patients_month)}
          change={kpis.total_patients_change}
          color="bg-emerald-50"
          loading={loading}
          sub={loading ? undefined : `${kpis.patients_seen_month} seen this month`}
        />
        <KpiCard
          icon={<Calendar size={20} className="text-blue-600" />}
          label="Avg Daily Appts"
          value={String(kpis.avg_daily_appts)}
          change={kpis.avg_daily_change}
          color="bg-blue-50"
          loading={loading}
        />
        <KpiCard
          icon={<Star size={20} className="text-amber-600" />}
          label="Patient Satisfaction"
          value={kpis.avg_satisfaction !== null ? `${kpis.avg_satisfaction}/5` : "No reviews"}
          color="bg-amber-50"
          loading={loading}
        />
        <KpiCard
          icon={<Activity size={20} className="text-violet-600" />}
          label="Follow-up Rate"
          value={`${kpis.followup_rate}%`}
          color="bg-violet-50"
          loading={loading}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Monthly trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800">Patient Volume Trend</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Last 6 months · clinic-wide</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <div className="flex items-center gap-1.5"><div className="w-3 h-1 rounded bg-slate-400" /> <span className="hidden sm:inline">Total</span></div>
              {doctor_names.map((n, i) => (
                <div key={n} className="flex items-center gap-1.5">
                  <div className="w-3 h-1 rounded" style={{ background: DOCTOR_COLORS[i] }} /> <span className="hidden sm:inline">{n}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthly_trend}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
                {doctor_names.map((_, i) => (
                  <linearGradient key={i} id={`gradDoc${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={DOCTOR_COLORS[i]} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={DOCTOR_COLORS[i]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" name="Total" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 2" fill="url(#gradTotal)" dot={false} />
              {doctor_names.map((name, i) => (
                <Area key={name} type="monotone" dataKey={name} name={name} stroke={DOCTOR_COLORS[i]} strokeWidth={2} fill={`url(#gradDoc${i})`} dot={{ fill: DOCTOR_COLORS[i], r: 3 }} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Conditions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800 mb-5">Top Conditions</h3>
          {top_conditions.length === 0 ? (
            <div className="text-center py-8 text-[12px] text-slate-400">No diagnosis data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={top_conditions} cx="50%" cy="50%" innerRadius={38} outerRadius={62} dataKey="value" strokeWidth={0}>
                    {top_conditions.map((_, i) => <Cell key={i} fill={CONDITION_COLORS[i % CONDITION_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}%`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {top_conditions.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: CONDITION_COLORS[i % CONDITION_COLORS.length] }} />
                      <span className="text-slate-500">{c.name}</span>
                    </div>
                    <span className="font-semibold text-slate-700">{c.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Age Distribution */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800 mb-5">Age Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={age_distribution} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="group" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={25} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Patients" radius={[6, 6, 0, 0]}>
                {age_distribution.map((_, i) => (
                  <Cell key={i} fill={DOCTOR_COLORS[i % DOCTOR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Peak Hours */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800 mb-5">Peak Hours</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={peak_hours}>
              <defs>
                <linearGradient id="gradPeak" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={20} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" name="Patients" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradPeak)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Patient Retention */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800 mb-5">Patient Retention</h3>
          <ResponsiveContainer width="100%" height={140}>
            <RadialBarChart cx="50%" cy="50%" innerRadius={25} outerRadius={72} data={retentionData} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" background={{ fill: "#f1f5f9" }} cornerRadius={6} />
              <Tooltip formatter={(v) => [`${v}%`, ""]} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5">
            {retentionData.map(r => (
              <div key={r.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: r.fill }} />
                  <span className="text-slate-500">{r.name}</span>
                </div>
                <span className="font-semibold text-slate-700">{loading ? "—" : `${r.value}%`}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Appointments by Doctor */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800">Appointments by Doctor</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Last 6 months · per doctor</p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            {doctor_names.map((n, i) => (
              <div key={n} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: DOCTOR_COLORS[i] }} />
                Dr. {n}
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={appts_by_doctor} barSize={18} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={25} />
            <Tooltip content={<CustomTooltip />} />
            {doctor_names.map((name, i) => (
              <Bar key={name} dataKey={name} name={name} fill={DOCTOR_COLORS[i]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
