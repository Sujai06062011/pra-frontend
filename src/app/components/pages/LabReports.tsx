import { FlaskConical, Eye, Download, AlertCircle, CheckCircle2, Clock } from "lucide-react";

const reports = [
  { id: 1, patient: "Rajesh Kumar", age: 35, test: "CBC + ESR", lab: "Apex Diagnostics", ordered: "03 Jun 2026", received: "04 Jun 2026", status: "critical", result: "WBC 14,200 — Elevated", color: "from-sky-400 to-blue-500" },
  { id: 2, patient: "Ananya Devi", age: 28, test: "HbA1c + Lipid Profile", lab: "SRL Diagnostics", ordered: "02 Jun 2026", received: "04 Jun 2026", status: "review", result: "HbA1c 7.2%", color: "from-emerald-400 to-teal-500" },
  { id: 3, patient: "Mohammed Ali", age: 52, test: "Uric Acid + KFT", lab: "Thyrocare", ordered: "02 Jun 2026", received: "04 Jun 2026", status: "review", result: "Uric Acid 8.1 mg/dL", color: "from-amber-400 to-orange-500" },
  { id: 4, patient: "Kavitha S.", age: 36, test: "Thyroid Profile (T3,T4,TSH)", lab: "Lal Pathlabs", ordered: "01 Jun 2026", received: "03 Jun 2026", status: "pending", result: "Awaiting doctor review", color: "from-rose-400 to-pink-500" },
  { id: 5, patient: "Ravi Shankar", age: 67, test: "ECG + Echo Report", lab: "City Heart Centre", ordered: "30 May 2026", received: "02 Jun 2026", status: "pending", result: "Awaiting doctor review", color: "from-teal-400 to-cyan-500" },
  { id: 6, patient: "Geeta Sharma", age: 45, test: "Vitamin D + B12", lab: "Dr. Lal Pathlabs", ordered: "28 May 2026", received: "30 May 2026", status: "done", result: "Vit D: 18 ng/mL (Low)", color: "from-lime-400 to-emerald-500" },
  { id: 7, patient: "Suresh Babu", age: 60, test: "PSA", lab: "Metropolis", ordered: "25 May 2026", received: "27 May 2026", status: "done", result: "PSA: 1.8 ng/mL (Normal)", color: "from-indigo-400 to-violet-500" },
];

const statusConfig = {
  critical: { label: "Critical", cls: "bg-rose-50 text-rose-700 border-rose-200", icon: <AlertCircle size={11} /> },
  review: { label: "Needs Review", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: <Eye size={11} /> },
  pending: { label: "Pending Review", cls: "bg-blue-50 text-blue-700 border-blue-200", icon: <Clock size={11} /> },
  done: { label: "Reviewed", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 size={11} /> },
};

export function LabReports() {
  return (
    <div className="p-7 space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Critical", count: reports.filter(r => r.status === "critical").length, cls: "bg-rose-50 border-rose-200 text-rose-700" },
          { label: "Needs Review", count: reports.filter(r => r.status === "review").length, cls: "bg-amber-50 border-amber-200 text-amber-700" },
          { label: "Pending Review", count: reports.filter(r => r.status === "pending").length, cls: "bg-blue-50 border-blue-200 text-blue-700" },
          { label: "Reviewed", count: reports.filter(r => r.status === "done").length, cls: "bg-emerald-50 border-emerald-200 text-emerald-700" },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.cls}`}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 30, lineHeight: 1 }}>{s.count}</div>
            <div className="text-[11px] font-semibold mt-1 opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800">Pending & Recent Reports</h3>
          <span className="text-[12px] text-slate-400">{reports.length} total</span>
        </div>
        <div className="overflow-x-auto">
        <table className="min-w-[600px] w-full">
          <thead>
            <tr className="bg-slate-50">
              {["Patient", "Test", "Lab", "Received", "Result", "Status", "Action"].map(h => (
                <th key={h} className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 px-5 py-3 border-b border-slate-100">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => {
              const sc = statusConfig[r.status as keyof typeof statusConfig];
              return (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${r.color} flex items-center justify-center text-white text-[12px] font-bold shadow-sm`}>
                        {r.patient[0]}
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-slate-800">{r.patient}</div>
                        <div className="text-[11px] text-slate-400">{r.age} yrs</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-700">
                      <FlaskConical size={13} className="text-slate-400" /> {r.test}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-slate-500">{r.lab}</td>
                  <td className="px-5 py-3.5 text-[12px] text-slate-500">{r.received}</td>
                  <td className="px-5 py-3.5 text-[12px] text-slate-600 max-w-[160px]">
                    <span className={r.status === "critical" ? "font-semibold text-rose-600" : ""}>{r.result}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${sc.cls}`}>
                      {sc.icon} {sc.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2">
                      <button className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 transition-all">
                        <Eye size={11} /> View
                      </button>
                      <button className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-400 hover:border-slate-300 transition-all">
                        <Download size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
