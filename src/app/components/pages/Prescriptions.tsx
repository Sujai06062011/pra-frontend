import { Pill, AlertTriangle, CheckCircle2, Clock, Plus } from "lucide-react";

const prescriptions = [
  { id: 1, patient: "Rajesh Kumar", age: 35, drugs: ["Paracetamol 500mg × 3/day", "Cetirizine 10mg × 1/night"], startDate: "01 Jun 2026", endDate: "07 Jun 2026", daysLeft: 3, status: "active", color: "from-sky-400 to-blue-500" },
  { id: 2, patient: "Ananya Devi", age: 28, drugs: ["Metformin 500mg × 2/day", "Glimepride 2mg × 1/morning"], startDate: "01 Jun 2026", endDate: "30 Jun 2026", daysLeft: 26, status: "active", color: "from-emerald-400 to-teal-500" },
  { id: 3, patient: "Mohammed Ali", age: 52, drugs: ["Aceclofenac 100mg × 2/day", "Pantoprazole 40mg × 1/day"], startDate: "28 May 2026", endDate: "04 Jun 2026", daysLeft: 0, status: "ending-today", color: "from-amber-400 to-orange-500" },
  { id: 4, patient: "Geeta Sharma", age: 45, drugs: ["Vitamin D3 60K IU × weekly", "Methylcobalamin 500mg × 1/day"], startDate: "28 May 2026", endDate: "28 Jul 2026", daysLeft: 54, status: "active", color: "from-lime-400 to-emerald-500" },
  { id: 5, patient: "Ravi Shankar", age: 67, drugs: ["Telmisartan 40mg × 1/morning", "Aspirin 75mg × 1/day", "Atorvastatin 20mg × 1/night"], startDate: "01 Jun 2026", endDate: "30 Jun 2026", daysLeft: 26, status: "active", color: "from-teal-400 to-cyan-500" },
  { id: 6, patient: "Kavitha S.", age: 36, drugs: ["Amoxicillin 500mg × 3/day"], startDate: "29 May 2026", endDate: "05 Jun 2026", daysLeft: 1, status: "ending-soon", color: "from-rose-400 to-pink-500" },
  { id: 7, patient: "Suresh Babu", age: 60, drugs: ["Amlodipine 5mg × 1/day", "Losartan 50mg × 1/day"], startDate: "15 Apr 2026", endDate: "14 Jun 2026", daysLeft: 10, status: "active", color: "from-indigo-400 to-violet-500" },
];

const statusConfig = {
  "active": { label: "Active", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 size={11} /> },
  "ending-today": { label: "Ends Today", cls: "bg-rose-50 text-rose-700 border-rose-200", icon: <AlertTriangle size={11} /> },
  "ending-soon": { label: "Ends Tomorrow", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock size={11} /> },
};

export function Prescriptions() {
  return (
    <div className="p-7 space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active", value: prescriptions.filter(p => p.status === "active").length, cls: "bg-emerald-50 border-emerald-200 text-emerald-700" },
          { label: "Ends Today", value: prescriptions.filter(p => p.status === "ending-today").length, cls: "bg-rose-50 border-rose-200 text-rose-700" },
          { label: "Ends Tomorrow", value: prescriptions.filter(p => p.status === "ending-soon").length, cls: "bg-amber-50 border-amber-200 text-amber-700" },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.cls}`}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 30, lineHeight: 1 }}>{s.value}</div>
            <div className="text-[11px] font-semibold mt-1 opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800">Active Prescriptions</h3>
        <button className="flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-sm">
          <Plus size={15} /> New Prescription
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {prescriptions.map((p) => {
          const sc = statusConfig[p.status as keyof typeof statusConfig];
          return (
            <div key={p.id} className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-shadow ${p.status === "ending-today" ? "border-rose-200" : p.status === "ending-soon" ? "border-amber-200" : "border-slate-100"}`}>
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm`}>
                  {p.patient[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }} className="text-slate-800">{p.patient}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sc.cls}`}>
                      {sc.icon} {sc.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{p.age} yrs · {p.startDate} → {p.endDate}</div>
                </div>
                {p.daysLeft > 0 && (
                  <div className="text-right flex-shrink-0">
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, lineHeight: 1 }} className={p.daysLeft <= 2 ? "text-rose-600" : "text-slate-700"}>{p.daysLeft}</div>
                    <div className="text-[10px] text-slate-400">days left</div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 mb-4">
                {p.drugs.map((drug, i) => (
                  <div key={i} className="flex items-center gap-2 text-[12px]">
                    <Pill size={11} className="text-emerald-500 flex-shrink-0" />
                    <span className="text-slate-700">{drug}</span>
                  </div>
                ))}
              </div>

              {/* Duration bar */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Progress</span>
                  <span>{p.daysLeft > 0 ? `${p.daysLeft} days remaining` : "Ends today"}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${p.daysLeft === 0 ? "bg-rose-500" : p.daysLeft <= 2 ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.max(5, 100 - (p.daysLeft / 30) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
