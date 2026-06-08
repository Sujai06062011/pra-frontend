import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar
} from "recharts";
import { TrendingUp, TrendingDown, Users, Calendar, Star, Clock } from "lucide-react";

const monthlyData = [
  { month: "Jan", patients: 120, revenue: 145000, newPatients: 38 },
  { month: "Feb", patients: 135, revenue: 162000, newPatients: 42 },
  { month: "Mar", patients: 148, revenue: 178000, newPatients: 51 },
  { month: "Apr", patients: 142, revenue: 171000, newPatients: 45 },
  { month: "May", patients: 168, revenue: 202000, newPatients: 63 },
  { month: "Jun", patients: 187, revenue: 224000, newPatients: 72 },
];

const conditionData = [
  { name: "Fever / Cold", value: 28, color: "#f43f5e" },
  { name: "Hypertension", value: 22, color: "#8b5cf6" },
  { name: "Diabetes", value: 18, color: "#3b82f6" },
  { name: "Respiratory", value: 15, color: "#10b981" },
  { name: "Other", value: 17, color: "#f59e0b" },
];

const ageGroupData = [
  { group: "0–12", count: 42, fill: "#10b981" },
  { group: "13–25", count: 28, fill: "#3b82f6" },
  { group: "26–40", count: 65, fill: "#8b5cf6" },
  { group: "41–60", count: 78, fill: "#f59e0b" },
  { group: "60+", count: 34, fill: "#f43f5e" },
];

const hourlyData = [
  { hour: "8am", count: 2 }, { hour: "9am", count: 8 }, { hour: "10am", count: 15 },
  { hour: "11am", count: 12 }, { hour: "12pm", count: 6 }, { hour: "1pm", count: 4 },
  { hour: "2pm", count: 9 }, { hour: "3pm", count: 11 }, { hour: "4pm", count: 7 },
  { hour: "5pm", count: 3 },
];

const retentionData = [
  { name: "Returned within 30d", value: 72, fill: "#10b981" },
  { name: "Returned within 90d", value: 55, fill: "#3b82f6" },
  { name: "Annual return", value: 40, fill: "#8b5cf6" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-xs">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
            <span className="text-slate-500">{p.name}:</span>
            <span className="font-semibold text-slate-700">{typeof p.value === "number" && p.name?.toLowerCase().includes("revenue") ? `₹${p.value.toLocaleString("en-IN")}` : p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface KpiCardProps { icon: React.ReactNode; label: string; value: string; change: string; up: boolean; color: string; }

function KpiCard({ icon, label, value, change, up, color }: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
        <div className={`flex items-center gap-1 text-[12px] font-semibold ${up ? "text-emerald-600" : "text-rose-600"}`}>
          {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {change}
        </div>
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, lineHeight: 1.2 }} className="text-slate-800">{value}</div>
    </div>
  );
}

export function Analytics() {
  return (
    <div className="p-7 space-y-6">

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard icon={<Users size={20} className="text-emerald-600" />} label="Total Patients (Jun)" value="187" change="+11.3%" up={true} color="bg-emerald-50" />
        <KpiCard icon={<Calendar size={20} className="text-blue-600" />} label="Avg Daily Appts" value="14.2" change="+2.1%" up={true} color="bg-blue-50" />
        <KpiCard icon={<Star size={20} className="text-amber-600" />} label="Patient Satisfaction" value="4.7/5" change="+0.2" up={true} color="bg-amber-50" />
        <KpiCard icon={<Clock size={20} className="text-violet-600" />} label="Avg Consultation" value="18 min" change="-3 min" up={true} color="bg-violet-50" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-3 gap-4">

        {/* Monthly trend */}
        <div className="col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800">Patient Volume Trend</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Jan – Jun 2026</p>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5"><div className="w-3 h-1 rounded bg-emerald-500" /> Total Patients</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-1 rounded bg-blue-400" /> New Patients</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="patients" name="Total Patients" stroke="#10b981" strokeWidth={2} fill="url(#gradGreen)" dot={{ fill: "#10b981", r: 3 }} />
              <Area type="monotone" dataKey="newPatients" name="New Patients" stroke="#3b82f6" strokeWidth={2} fill="url(#gradBlue)" dot={{ fill: "#3b82f6", r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Condition breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800 mb-5">Top Conditions</h3>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={conditionData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} dataKey="value" strokeWidth={0}>
                {conditionData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5">
            {conditionData.map(c => (
              <div key={c.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  <span className="text-slate-500">{c.name}</span>
                </div>
                <span className="font-semibold text-slate-700">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-3 gap-4">

        {/* Age groups */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800 mb-5">Age Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ageGroupData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="group" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={25} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Patients" radius={[6, 6, 0, 0]}>
                {ageGroupData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Peak hours */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800 mb-5">Peak Hours</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={hourlyData}>
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

        {/* Retention */}
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
                <span className="font-semibold text-slate-700">{r.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue trend */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800">Revenue Trend</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Clinic revenue Jan – Jun 2026</p>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-slate-400">Jun 2026</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20 }} className="text-emerald-600">₹2,24,000</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={monthlyData}>
            <defs>
              <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={55} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
