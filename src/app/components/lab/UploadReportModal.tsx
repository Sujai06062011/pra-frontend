import { useState, useRef, useCallback } from "react";
import { X, Upload, FileText, Camera, CheckCircle2, Loader2, ChevronDown } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL as string;

const COMMON_TESTS = [
  "CBC", "CBC + ESR", "LFT", "KFT", "HbA1c",
  "Lipid Profile", "Thyroid Profile (T3,T4,TSH)",
  "Vitamin D + B12", "Urine Routine", "Blood Sugar (FBS/PPBS)",
  "Uric Acid", "PSA", "ECG", "Creatinine", "Electrolytes",
];

interface Patient { id: string; name: string; age?: number; patient_code?: string; }

interface Props {
  doctorId: string;
  patients: Patient[];
  onClose: () => void;
  onSuccess: () => void;
}

type Mode = "pdf" | "photo";
type Stage = "form" | "uploading" | "ocr" | "done" | "error";

export function UploadReportModal({ doctorId, patients, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>("pdf");
  const [stage, setStage] = useState<Stage>("form");
  const [error, setError] = useState("");

  const [patientId, setPatientId] = useState("");
  const [testName, setTestName] = useState("");
  const [labName, setLabName] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [result, setResult] = useState<{ status: string; summary: string } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = COMMON_TESTS.filter(t =>
    testName && t.toLowerCase().includes(testName.toLowerCase()) && t !== testName
  );

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  const handleSubmit = async () => {
    if (!patientId) { setError("Please select a patient"); return; }
    if (!file) { setError("Please select a file"); return; }
    if (!testName) { setError("Please enter a test name"); return; }
    setError("");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("patient_id", patientId);
    fd.append("doctor_id", doctorId);
    fd.append("test_name", testName);
    if (labName) fd.append("lab_name", labName);
    if (reportDate) fd.append("report_date", reportDate);

    const endpoint = mode === "pdf" ? "/api/lab/upload" : "/api/lab/upload-photo";

    try {
      setStage("uploading");
      await new Promise(r => setTimeout(r, 600));
      setStage("ocr");

      const res = await fetch(`${BASE_URL}${endpoint}`, { method: "POST", body: fd });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.detail || `Upload failed (${res.status})`);
      }
      const data = await res.json();
      setResult({ status: data.status, summary: data.result_summary || "" });
      setStage("done");
    } catch (e: any) {
      setError(e.message || "Upload failed");
      setStage("error");
    }
  };

  const statusColors: Record<string, string> = {
    "Critical":       "text-rose-600 bg-rose-50 border-rose-200",
    "Needs Review":   "text-amber-600 bg-amber-50 border-amber-200",
    "Pending Review": "text-blue-600 bg-blue-50 border-blue-200",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17 }} className="text-slate-800">
            Upload Lab Report
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Done state */}
          {stage === "done" && result && (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18 }} className="text-slate-800">
                Report Uploaded
              </div>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold border ${statusColors[result.status] || "text-slate-600 bg-slate-50 border-slate-200"}`}>
                {result.status}
              </div>
              {result.summary && (
                <p className="text-[13px] text-slate-600 max-w-xs mx-auto">{result.summary}</p>
              )}
              <div className="flex gap-3 justify-center pt-2">
                <button onClick={onSuccess} className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-[13px] font-semibold hover:bg-indigo-700 transition-colors">
                  View Reports
                </button>
                <button onClick={() => { setStage("form"); setFile(null); setResult(null); }}
                  className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 text-[13px] font-semibold hover:bg-slate-50 transition-colors">
                  Upload Another
                </button>
              </div>
            </div>
          )}

          {/* Processing states */}
          {(stage === "uploading" || stage === "ocr") && (
            <div className="text-center py-10 space-y-4">
              <Loader2 size={40} className="mx-auto text-indigo-500 animate-spin" />
              <div className="space-y-1">
                <div className="text-[14px] font-semibold text-slate-700">
                  {stage === "uploading" ? "Uploading file…" : "OCR & AI extraction in progress…"}
                </div>
                <div className="text-[12px] text-slate-400">
                  {stage === "ocr" ? "Extracting lab values — this takes ~10 seconds" : "Uploading to secure storage"}
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className={`h-full bg-indigo-500 rounded-full transition-all duration-1000 ${stage === "ocr" ? "w-3/4" : "w-1/3"}`} />
              </div>
            </div>
          )}

          {/* Form */}
          {(stage === "form" || stage === "error") && (
            <>
              {/* Mode toggle */}
              <div className="flex rounded-xl border border-slate-200 p-1 gap-1">
                {(["pdf", "photo"] as Mode[]).map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-semibold transition-all ${mode === m ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}>
                    {m === "pdf" ? <FileText size={14} /> : <Camera size={14} />}
                    {m === "pdf" ? "PDF Upload" : "Photo / Camera"}
                  </button>
                ))}
              </div>

              {/* Patient */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Patient *</label>
                <div className="relative">
                  <select
                    value={patientId}
                    onChange={e => setPatientId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-700 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  >
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
                  placeholder="e.g. CBC, HbA1c, Thyroid Profile…"
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

              {/* Lab name + date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Lab Name</label>
                  <input
                    value={labName} onChange={e => setLabName(e.target.value)}
                    placeholder="e.g. Thyrocare"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Report Date</label>
                  <input
                    type="date" value={reportDate} onChange={e => setReportDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>

              {/* File drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  dragOver ? "border-indigo-400 bg-indigo-50" :
                  file ? "border-emerald-300 bg-emerald-50" :
                  "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                }`}
              >
                <input
                  ref={fileRef} type="file"
                  accept={mode === "pdf" ? ".pdf,image/*" : "image/*"}
                  className="hidden"
                  onChange={e => e.target.files?.[0] && setFile(e.target.files[0])}
                />
                {file ? (
                  <div className="space-y-1">
                    <CheckCircle2 size={28} className="mx-auto text-emerald-500" />
                    <div className="text-[13px] font-semibold text-emerald-700">{file.name}</div>
                    <div className="text-[11px] text-emerald-500">{(file.size / 1024).toFixed(0)} KB</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload size={28} className="mx-auto text-slate-300" />
                    <div className="text-[13px] font-medium text-slate-500">
                      {mode === "pdf" ? "Drop PDF or image here, or click to browse" : "Drop photo here, or click to browse"}
                    </div>
                    <div className="text-[11px] text-slate-300">PDF, JPG, PNG, HEIC</div>
                  </div>
                )}
              </div>

              {error && (
                <div className="text-[12px] text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSubmit}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-[13px] font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                  <Upload size={14} /> Upload & Extract
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
