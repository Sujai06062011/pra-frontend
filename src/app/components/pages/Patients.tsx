import { useState } from "react";
import { Search, Filter, ChevronDown, Phone, Calendar, FileText, User } from "lucide-react";

const patients = [
  { id: 1, name: "Sujaikumar", age: 43, gender: "M", phone: "+91 98765 43210", lastVisit: "04 Jun 2026", visits: 12, condition: "Hypertension", color: "from-violet-400 to-purple-500", status: "Active" },
  { id: 2, name: "Poornima", age: 43, gender: "F", phone: "+91 94321 87654", lastVisit: "04 Jun 2026", visits: 8, condition: "Thyroid", color: "from-pink-400 to-rose-500", status: "Active" },
  { id: 3, name: "Rajesh Kumar", age: 35, gender: "M", phone: "+91 76543 21098", lastVisit: "04 Jun 2026", visits: 3, condition: "Fever", color: "from-sky-400 to-blue-500", status: "Active" },
  { id: 4, name: "Ananya Devi", age: 28, gender: "F", phone: "+91 65432 10987", lastVisit: "28 May 2026", visits: 5, condition: "Diabetes", color: "from-emerald-400 to-teal-500", status: "Active" },
  { id: 5, name: "Mohammed Ali", age: 52, gender: "M", phone: "+91 54321 09876", lastVisit: "15 May 2026", visits: 21, condition: "Arthritis", color: "from-amber-400 to-orange-500", status: "Active" },
  { id: 6, name: "Kavitha S.", age: 36, gender: "F", phone: "+91 43210 98765", lastVisit: "10 May 2026", visits: 7, condition: "Follow-up", color: "from-rose-400 to-pink-500", status: "Follow-up Due" },
  { id: 7, name: "Dinesh R.", age: 29, gender: "M", phone: "+91 32109 87654", lastVisit: "02 May 2026", visits: 4, condition: "Respiratory", color: "from-cyan-400 to-sky-500", status: "Follow-up Due" },
  { id: 8, name: "Meena T.", age: 55, gender: "F", phone: "+91 21098 76543", lastVisit: "29 Apr 2026", visits: 15, condition: "BP + Sugar", color: "from-fuchsia-400 to-purple-500", status: "Follow-up Due" },
  { id: 9, name: "Ravi Shankar", age: 67, gender: "M", phone: "+91 10987 65432", lastVisit: "25 Apr 2026", visits: 34, condition: "Cardiac", color: "from-teal-400 to-cyan-500", status: "Active" },
  { id: 10, name: "Priya Patel", age: 31, gender: "F", phone: "+91 09876 54321", lastVisit: "20 Apr 2026", visits: 2, condition: "Allergy", color: "from-indigo-400 to-violet-500", status: "Inactive" },
];

const statusStyle: Record<string, string> = {
  "Active": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Follow-up Due": "bg-amber-50 text-amber-700 border-amber-200",
  "Inactive": "bg-slate-100 text-slate-500 border-slate-200",
};

export function Patients() {
  const [search, setSearch] = useState("");
  const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.condition.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-7 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or condition…"
            className="pl-8 pr-4 py-2 text-[13px] bg-white border border-slate-200 rounded-xl w-full text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-[13px] text-slate-600 bg-white hover:bg-slate-50 transition-colors">
          <Filter size={14} /> Filter <ChevronDown size={13} />
        </button>
        <div className="ml-auto text-[13px] text-slate-500">
          <span className="font-semibold text-slate-700">{filtered.length}</span> patients
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3">
        {[
          { label: "Total Patients", value: patients.length, cls: "bg-slate-50 border-slate-200 text-slate-700" },
          { label: "Active", value: patients.filter(p => p.status === "Active").length, cls: "bg-emerald-50 border-emerald-200 text-emerald-700" },
          { label: "Follow-up Due", value: patients.filter(p => p.status === "Follow-up Due").length, cls: "bg-amber-50 border-amber-200 text-amber-700" },
          { label: "Inactive", value: patients.filter(p => p.status === "Inactive").length, cls: "bg-slate-100 border-slate-200 text-slate-500" },
        ].map(s => (
          <div key={s.label} className={`px-4 py-2 border rounded-xl text-[12px] font-semibold ${s.cls}`}>
            {s.value} {s.label}
          </div>
        ))}
      </div>

      {/* Patient cards grid */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center text-white text-lg font-bold shadow-sm flex-shrink-0`}>
                {p.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }} className="text-slate-800 truncate">{p.name}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusStyle[p.status]}`}>{p.status}</span>
                </div>
                <div className="text-[12px] text-slate-400 mt-0.5">{p.age} yrs · {p.gender === "M" ? "Male" : "Female"}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">Condition</div>
                <div className="text-[12px] font-semibold text-slate-700 mt-0.5">{p.condition}</div>
              </div>
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">Total Visits</div>
                <div className="text-[12px] font-semibold text-slate-700 mt-0.5">{p.visits} visits</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3">
              <Calendar size={11} className="text-slate-300" />
              Last visit: {p.lastVisit}
            </div>

            <div className="flex gap-2">
              <button className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 transition-all">
                <User size={11} /> Profile
              </button>
              <button className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 transition-all">
                <FileText size={11} /> Records
              </button>
              <button className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 transition-all">
                <Phone size={11} /> {p.phone}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
