import { ChevronRight, ChevronLeft, Clock, Users, CheckCircle2, Activity, RefreshCw } from "lucide-react";
import { useQueue } from "../../../hooks/usePRAData";

const avatarColors = [
  "from-violet-400 to-purple-500", "from-pink-400 to-rose-500", "from-sky-400 to-blue-500",
  "from-emerald-400 to-teal-500", "from-amber-400 to-orange-500", "from-lime-400 to-emerald-500",
  "from-cyan-400 to-sky-500",
];

export function Queue() {
  const { data, loading, error, refetch, callNext, setToken } = useQueue();
  const current = data.current_token;
  const currentPatient = data.appointments.find(p => p.token_number === current);

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
        {/* Current token hero */}
        <div className="col-span-1 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200 flex flex-col items-center justify-center gap-2">
          <div className="text-sm font-semibold opacity-80 uppercase tracking-widest">Now Serving</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 80, lineHeight: 1 }}>
            {loading ? "…" : current}
          </div>
          {currentPatient && (
            <div className="text-center">
              <div className="font-semibold text-base">{currentPatient.patients?.name || "—"}</div>
            </div>
          )}
          <div className="flex gap-3 mt-4 w-full">
            <button
              onClick={() => current > 1 && setToken(current - 1)}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-[13px] font-semibold transition-colors"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              onClick={() => callNext()}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-white text-emerald-700 text-[13px] font-semibold hover:bg-emerald-50 transition-colors shadow-sm"
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
        ) : data.appointments.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px] text-slate-400">No appointments today</div>
        ) : (
        <div className="divide-y divide-slate-50">
          {data.appointments.map((p, idx) => {
            const isCurrent = p.token_number === current;
            const isDone = p.status === "completed";
            const color = avatarColors[idx % avatarColors.length];
            const name = p.patients?.name || "Unknown";
            return (
              <div
                key={p.id}
                className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${isCurrent ? "bg-emerald-50" : "hover:bg-slate-50"}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[14px] font-bold flex-shrink-0 ${
                  isCurrent ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200" :
                  isDone ? "bg-slate-100 text-slate-400" : "bg-slate-100 text-slate-600"
                }`}>
                  {p.token_number ?? "—"}
                </div>
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white text-[13px] font-bold shadow-sm flex-shrink-0`}>
                  {name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-slate-800">{name}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">CURRENT</span>
                    )}
                  </div>
                  {p.patients?.age && <div className="text-[11px] text-slate-400">{p.patients.age} yrs</div>}
                </div>
                <div>
                  {isDone && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={11} /> Done
                    </span>
                  )}
                  {!isDone && isCurrent && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      <Activity size={11} /> In Progress
                    </span>
                  )}
                  {!isDone && !isCurrent && (
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
    </div>
  );
}
