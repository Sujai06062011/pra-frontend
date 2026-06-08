import { useState } from "react";
import { Search, Filter, CheckCircle2, Clock, XCircle, Activity, ChevronDown, Plus } from "lucide-react";

const allAppointments = [
  { token: 1, name: "Suresh Babu", age: 60, gender: "M", time: "9:00 AM", type: "Follow-up", status: "done", color: "from-indigo-400 to-violet-500", phone: "+91 98765 43210" },
  { token: 2, name: "Lakshmi N.", age: 38, gender: "F", time: "9:15 AM", type: "New Visit", status: "done", color: "from-pink-400 to-rose-500", phone: "+91 94321 87654" },
  { token: 3, name: "Sujaikumar", age: 43, gender: "M", time: "9:30 AM", type: "Follow-up", status: "done", color: "from-violet-400 to-purple-500", phone: "+91 99887 65432" },
  { token: 4, name: "Poornima", age: 43, gender: "F", time: "9:45 AM", type: "Referral", status: "done", color: "from-fuchsia-400 to-pink-500", phone: "+91 87654 32109" },
  { token: 5, name: "Rajesh Kumar", age: 35, gender: "M", time: "10:00 AM", type: "New Visit", status: "in-progress", color: "from-sky-400 to-blue-500", phone: "+91 76543 21098" },
  { token: 6, name: "Ananya Devi", age: 28, gender: "F", time: "10:15 AM", type: "Follow-up", status: "waiting", color: "from-emerald-400 to-teal-500", phone: "+91 65432 10987" },
  { token: 7, name: "Mohammed Ali", age: 52, gender: "M", time: "10:30 AM", type: "Emergency", status: "waiting", color: "from-amber-400 to-orange-500", phone: "+91 54321 09876" },
  { token: 8, name: "Geeta Sharma", age: 45, gender: "F", time: "11:00 AM", type: "Follow-up", status: "waiting", color: "from-lime-400 to-emerald-500", phone: "+91 43210 98765" },
  { token: 9, name: "Ravi Shankar", age: 67, gender: "M", time: "11:30 AM", type: "New Visit", status: "waiting", color: "from-cyan-400 to-sky-500", phone: "+91 32109 87654" },
  { token: 10, name: "Priya Patel", age: 31, gender: "F", time: "12:00 PM", type: "Referral", status: "waiting", color: "from-rose-400 to-pink-500", phone: "+91 21098 76543" },
  { token: 11, name: "Vikram Nair", age: 49, gender: "M", time: "12:30 PM", type: "Follow-up", status: "waiting", color: "from-teal-400 to-cyan-500", phone: "+91 10987 65432" },
  { token: 12, name: "Sunita Devi", age: 55, gender: "F", time: "1:00 PM", type: "New Visit", status: "cancelled", color: "from-orange-400 to-amber-500", phone: "+91 09876 54321" },
];

const statusConfig = {
  done: { label: "Done", icon: <CheckCircle2 size={11} />, cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  "in-progress": { label: "In Progress", icon: <Activity size={11} />, cls: "bg-blue-50 text-blue-700 border border-blue-200" },
  waiting: { label: "Waiting", icon: <Clock size={11} />, cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  cancelled: { label: "Cancelled", icon: <XCircle size={11} />, cls: "bg-rose-50 text-rose-600 border border-rose-200" },
};

const typeColors: Record<string, string> = {
  "Follow-up": "bg-violet-50 text-violet-700",
  "New Visit": "bg-sky-50 text-sky-700",
  "Referral": "bg-emerald-50 text-emerald-700",
  "Emergency": "bg-rose-50 text-rose-700",
};

export function Appointments({ onNewAppointment }: { onNewAppointment?: () => void }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = allAppointments.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || a.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    all: allAppointments.length,
    done: allAppointments.filter(a => a.status === "done").length,
    "in-progress": allAppointments.filter(a => a.status === "in-progress").length,
    waiting: allAppointments.filter(a => a.status === "waiting").length,
    cancelled: allAppointments.filter(a => a.status === "cancelled").length,
  };

  return (
    <div className="p-7 space-y-5">
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
            <Filter size={14} />
            Filter
            <ChevronDown size={13} />
          </button>
        </div>
        <button
          onClick={onNewAppointment}
          className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-semibold px-4 py-2 rounded-xl shadow-sm shadow-emerald-200 transition-colors"
        >
          <Plus size={15} /> New Appointment
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "in-progress", "waiting", "done", "cancelled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-all ${
              filter === f
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600"
            }`}
          >
            {f === "in-progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}{" "}
            <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${filter === f ? "bg-white/25" : "bg-slate-100 text-slate-400"}`}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              {["Token", "Patient", "Contact", "Time", "Type", "Status", "Action"].map((h) => (
                <th key={h} className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 px-5 py-3.5 border-b border-slate-100">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((apt) => {
              const s = statusConfig[apt.status as keyof typeof statusConfig];
              return (
                <tr key={apt.token} className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors cursor-pointer">
                  <td className="px-5 py-3.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold ${apt.status === "in-progress" ? "bg-emerald-500 text-white shadow-sm" : "bg-slate-100 text-slate-500"}`}>
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
                  <td className="px-5 py-3.5 text-[12px] text-slate-500">{apt.phone}</td>
                  <td className="px-5 py-3.5 text-[12px] text-slate-500">{apt.time}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${typeColors[apt.type]}`}>{apt.type}</span>
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
                      {apt.status === "in-progress" && (
                        <button className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all">
                          Prescribe
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
