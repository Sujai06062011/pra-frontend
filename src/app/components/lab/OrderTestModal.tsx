import { useState } from "react";
import { X, FlaskConical, ChevronDown, CheckCircle2 } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL as string;

const COMMON_TESTS = [
  "CBC", "CBC + ESR", "LFT", "KFT", "HbA1c",
  "Lipid Profile", "Thyroid Profile (T3,T4,TSH)",
  "Vitamin D + B12", "Urine Routine", "Blood Sugar (FBS/PPBS)",
  "Uric Acid", "PSA", "Creatinine", "Electrolytes", "CRP",
];

const CATEGORIES = ["Blood", "Urine", "Imaging", "Cardiac", "Thyroid", "Diabetes", "Liver", "Kidney", "Other"];
const PRIORITIES = ["Routine", "Urgent", "STAT", "Pre-procedure"];

interface Patient { id: string; name: string; age?: number; patient_code?: string; }

interface Props {
  doctorId: string;
  patients: Patient[];
  onClose: () => void;
  onSuccess: () => void;
}

export function OrderTestModal({ doctorId, patients, onClose, onSuccess }: Props) {
  const [patientId, setPatientId] = useState("");
  const [testName, setTestName] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("Routine");
  const [labType, setLabType] = useState<"external" | "inhouse">("external");
  const [labName, setLabName] = useState("");
  const [notes, setNotes] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const filtered = COMMON_TESTS.filter(t =>
    testName && t.toLowerCase().includes(testName.toLowerCase()) && t !== testName
  );

  const handleSubmit = async () => {
    if (!patientId) { setError("Select a patient"); return; }
    if (!testName) { setError("Enter a test name"); return; }
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/lab/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          doctor_id: doctorId,
          test_name: testName,
          test_category: category || null,
          priority,
          lab_type: labType,
          lab_name: labName || null,
          notes: notes || null,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.detail || "Failed to create order");
      }
      setDone(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const priorityColors: Record<string, string> = {
    "Routine":       "bg-slate-100 text-slate-600 border-slate-200",
    "Urgent":        "bg-amber-50 text-amber-600 border-amber-200",
    "STAT":          "bg-rose-50 text-rose-600 border-rose-200",
    "Pre-procedure": "bg-blue-50 text-blue-600 border-blue-200",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17 }} className="text-slate-800">
            Order a Test
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {done ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17 }} className="text-slate-800">
                Order Created
              </div>
              <p className="text-[13px] text-slate-500">
                The test order has been recorded. You can track it in the My Orders tab.
              </p>
              <div className="flex gap-3 justify-center pt-2">
                <button onClick={onSuccess}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-[13px] font-semibold hover:bg-indigo-700 transition-colors">
                  View Orders
                </button>
                <button onClick={() => { setDone(false); setTestName(""); setNotes(""); }}
                  className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 text-[13px] font-semibold hover:bg-slate-50 transition-colors">
                  Order Another
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Patient */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Patient *</label>
                <div className="relative">
                  <select value={patientId} onChange={e => setPatientId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-700 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-300">
                    <option value="">Select patient…</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.age ? ` (${p.age} yrs)` : ""}{p.patient_code ? ` · ${p.patient_code}` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Test name */}
              <div className="space-y-1.5 relative">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Test Name *</label>
                <input
                  value={testName}
                  onChange={e => { setTestName(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="e.g. CBC, Thyroid Profile…"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                {showSuggestions && filtered.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-xl shadow-lg mt-1 overflow-hidden">
                    {filtered.slice(0, 5).map(t => (
                      <button key={t} onMouseDown={() => { setTestName(t); setShowSuggestions(false); }}
                        className="w-full text-left px-3 py-2 text-[12px] text-slate-700 hover:bg-indigo-50 transition-colors">
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setCategory(c === category ? "" : c)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                        category === c ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-500 border-slate-200 hover:border-indigo-300"
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Priority</label>
                <div className="grid grid-cols-2 gap-2">
                  {PRIORITIES.map(p => (
                    <button key={p} onClick={() => setPriority(p)}
                      className={`py-2 rounded-xl text-[12px] font-semibold border transition-all ${
                        priority === p ? priorityColors[p] + " ring-2 ring-offset-1 ring-indigo-300" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                      }`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lab type */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Lab Type</label>
                <div className="flex rounded-xl border border-slate-200 p-1 gap-1">
                  {[["external", "External Lab"], ["inhouse", "In-house Lab"]] as const}
                  {(["external", "inhouse"] as const).map(lt => (
                    <button key={lt} onClick={() => setLabType(lt)}
                      className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${
                        labType === lt ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
                      }`}>
                      {lt === "external" ? "External Lab" : "In-house Lab"}
                    </button>
                  ))}
                </div>
              </div>

              {labType === "external" && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Lab Name</label>
                  <input
                    value={labName} onChange={e => setLabName(e.target.value)}
                    placeholder="e.g. Thyrocare, SRL, Lal Pathlabs"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Notes (optional)</label>
                <textarea
                  value={notes} onChange={e => setNotes(e.target.value)}
                  rows={2} placeholder="Special instructions…"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                />
              </div>

              {error && (
                <div className="text-[12px] text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-[13px] font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  <FlaskConical size={14} />
                  {loading ? "Creating…" : "Create Order"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
