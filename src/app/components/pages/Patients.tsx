import { useState, useEffect, useRef } from "react";
import { Search, Filter, ChevronDown, Phone, Calendar, FileText, User, RefreshCw } from "lucide-react";
import { usePatients } from "../../../hooks/usePRAData";

const avatarColors = [
  "from-violet-400 to-purple-500", "from-pink-400 to-rose-500", "from-sky-400 to-blue-500",
  "from-emerald-400 to-teal-500", "from-amber-400 to-orange-500", "from-rose-400 to-pink-500",
  "from-cyan-400 to-sky-500", "from-fuchsia-400 to-purple-500", "from-teal-400 to-cyan-500",
  "from-indigo-400 to-violet-500",
];

export function Patients() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [search]);

  const { data: patients, loading, error, refetch } = usePatients(debouncedSearch || undefined);

  return (
    <div className="p-7 space-y-5">
      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <span className="text-[13px] text-rose-700 flex-1">Failed to load patients.</span>
          <button onClick={refetch} className="flex items-center gap-1 text-[12px] font-semibold text-rose-600">
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or mobile…"
            className="pl-8 pr-4 py-2 text-[13px] bg-white border border-slate-200 rounded-xl w-full text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-[13px] text-slate-600 bg-white hover:bg-slate-50 transition-colors">
          <Filter size={14} /> Filter <ChevronDown size={13} />
        </button>
        <div className="ml-auto text-[13px] text-slate-500">
          <span className="font-semibold text-slate-700">{loading ? "…" : patients.length}</span> patients
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3">
        <div className="px-4 py-2 border rounded-xl text-[12px] font-semibold bg-slate-50 border-slate-200 text-slate-700">
          {loading ? "…" : patients.length} Total Patients
        </div>
      </div>

      {/* Patient cards grid */}
      {loading ? (
        <div className="text-center py-12 text-[13px] text-slate-400">Loading patients…</div>
      ) : patients.length === 0 ? (
        <div className="text-center py-12 text-[13px] text-slate-400">No patients found</div>
      ) : (
      <div className="grid grid-cols-2 gap-4">
        {patients.map((p, idx) => {
          const color = avatarColors[idx % avatarColors.length];
          return (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white text-lg font-bold shadow-sm flex-shrink-0`}>
                {p.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }} className="text-slate-800 truncate">{p.name}</span>
                  {p.patient_code && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-slate-50 border-slate-200 text-slate-500">{p.patient_code}</span>
                  )}
                </div>
                <div className="text-[12px] text-slate-400 mt-0.5">
                  {p.age ? `${p.age} yrs · ` : ""}
                  {p.gender === "M" ? "Male" : p.gender === "F" ? "Female" : ""}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">Mobile</div>
                <div className="text-[12px] font-semibold text-slate-700 mt-0.5">{p.mobile || "—"}</div>
              </div>
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">Registered</div>
                <div className="text-[12px] font-semibold text-slate-700 mt-0.5">
                  {p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 transition-all">
                <User size={11} /> Profile
              </button>
              <button className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 transition-all">
                <FileText size={11} /> Records
              </button>
              {p.mobile && (
                <button className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 transition-all">
                  <Phone size={11} /> {p.mobile}
                </button>
              )}
            </div>
          </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
