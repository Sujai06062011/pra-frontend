import { Phone, Calendar, CheckCircle2, Clock, AlertCircle, MessageCircle } from "lucide-react";

const followUps = [
  { name: "Kavitha S.", age: 36, phone: "+91 43210 98765", lastVisit: "01 Jun 2026", condition: "Post-op check", daysOverdue: 3, attempts: 2, status: "no-response", color: "from-rose-400 to-pink-500" },
  { name: "Dinesh R.", age: 29, phone: "+91 32109 87654", lastVisit: "28 May 2026", condition: "Wants appointment", daysOverdue: 7, attempts: 1, status: "needs-booking", color: "from-sky-400 to-blue-500" },
  { name: "Meena T.", age: 55, phone: "+91 21098 76543", lastVisit: "02 Jun 2026", condition: "Medication review", daysOverdue: 2, attempts: 2, status: "no-response", color: "from-fuchsia-400 to-purple-500" },
  { name: "Ravi Shankar", age: 67, phone: "+91 10987 65432", lastVisit: "28 May 2026", condition: "BP monitoring", daysOverdue: 0, attempts: 0, status: "due-today", color: "from-teal-400 to-cyan-500" },
  { name: "Priya Patel", age: 31, phone: "+91 09876 54321", lastVisit: "25 May 2026", condition: "Allergy treatment", daysOverdue: 0, attempts: 1, status: "due-today", color: "from-indigo-400 to-violet-500" },
  { name: "Suresh Babu", age: 60, phone: "+91 98765 43210", lastVisit: "20 May 2026", condition: "Post-visit", daysOverdue: 0, attempts: 0, status: "scheduled", color: "from-amber-400 to-orange-500" },
  { name: "Lakshmi N.", age: 38, phone: "+91 94321 87654", lastVisit: "18 May 2026", condition: "Thyroid follow-up", daysOverdue: 0, attempts: 0, status: "scheduled", color: "from-emerald-400 to-teal-500" },
  { name: "Geeta Sharma", age: 45, phone: "+91 54321 09876", lastVisit: "15 May 2026", condition: "Resolved", daysOverdue: 0, attempts: 1, status: "resolved", color: "from-lime-400 to-emerald-500" },
  { name: "Mohammed Ali", age: 52, phone: "+91 43210 09876", lastVisit: "12 May 2026", condition: "Arthritis check", daysOverdue: 0, attempts: 2, status: "resolved", color: "from-orange-400 to-amber-500" },
];

const statusConfig = {
  "no-response": { label: "No Response", cls: "bg-rose-50 text-rose-700 border-rose-200", icon: <AlertCircle size={11} /> },
  "needs-booking": { label: "Needs Booking", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: <Calendar size={11} /> },
  "due-today": { label: "Due Today", cls: "bg-blue-50 text-blue-700 border-blue-200", icon: <Clock size={11} /> },
  "scheduled": { label: "Scheduled", cls: "bg-violet-50 text-violet-700 border-violet-200", icon: <Calendar size={11} /> },
  "resolved": { label: "Resolved", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 size={11} /> },
};

const groups = [
  { key: "no-response", label: "No Response", accent: "border-l-rose-500" },
  { key: "needs-booking", label: "Needs Booking", accent: "border-l-amber-500" },
  { key: "due-today", label: "Due Today", accent: "border-l-blue-500" },
  { key: "scheduled", label: "Scheduled", accent: "border-l-violet-500" },
  { key: "resolved", label: "Resolved", accent: "border-l-emerald-500" },
];

export function FollowUps() {
  return (
    <div className="p-7 space-y-6">

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-3">
        {groups.map(g => {
          const count = followUps.filter(f => f.status === g.key).length;
          const sc = statusConfig[g.key as keyof typeof statusConfig];
          return (
            <div key={g.key} className={`bg-white rounded-2xl border border-slate-100 border-l-4 ${g.accent} p-4 shadow-sm`}>
              <div className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border mb-2 ${sc.cls}`}>
                {sc.icon} {g.label}
              </div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, lineHeight: 1 }} className="text-slate-800">{count}</div>
              <div className="text-[11px] text-slate-400 mt-1">patients</div>
            </div>
          );
        })}
      </div>

      {/* Follow-up cards */}
      <div className="space-y-3">
        {groups.filter(g => g.key !== "resolved").map(g => {
          const items = followUps.filter(f => f.status === g.key);
          if (!items.length) return null;
          return (
            <div key={g.key}>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13 }} className="text-slate-600 uppercase tracking-wider mb-2">
                {g.label} ({items.length})
              </h3>
              <div className="space-y-2">
                {items.map((f) => {
                  const sc = statusConfig[f.status as keyof typeof statusConfig];
                  return (
                    <div key={f.name} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm`}>
                        {f.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }} className="text-slate-800">{f.name}</span>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sc.cls}`}>
                            {sc.icon} {sc.label}
                          </span>
                          {f.daysOverdue > 0 && (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                              {f.daysOverdue}d overdue
                            </span>
                          )}
                        </div>
                        <div className="text-[12px] text-slate-500">{f.age} yrs · {f.condition}</div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1"><Calendar size={10} /> Last visit: {f.lastVisit}</span>
                          <span className="flex items-center gap-1"><Phone size={10} /> {f.attempts} attempt{f.attempts !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                      <div className="text-[12px] text-slate-400">{f.phone}</div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors">
                          <Phone size={12} /> Call
                        </button>
                        {f.status === "needs-booking" && (
                          <button className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                            <Calendar size={12} /> Book
                          </button>
                        )}
                        <button className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200">
                          <MessageCircle size={12} /> Note
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Resolved section */}
        <details className="group">
          <summary className="cursor-pointer text-[13px] font-semibold text-slate-500 flex items-center gap-2 select-none py-1">
            <CheckCircle2 size={14} className="text-emerald-500" />
            Resolved ({followUps.filter(f => f.status === "resolved").length})
            <span className="text-slate-300 group-open:hidden">▸ show</span>
            <span className="text-slate-300 hidden group-open:inline">▾ hide</span>
          </summary>
          <div className="mt-2 space-y-2">
            {followUps.filter(f => f.status === "resolved").map(f => (
              <div key={f.name} className="bg-slate-50 rounded-xl border border-slate-100 p-4 flex items-center gap-4 opacity-75">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${f.color} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                  {f.name[0]}
                </div>
                <div className="flex-1">
                  <span className="text-[13px] font-medium text-slate-600">{f.name}</span>
                  <span className="ml-2 text-[11px] text-slate-400">{f.condition}</span>
                </div>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
