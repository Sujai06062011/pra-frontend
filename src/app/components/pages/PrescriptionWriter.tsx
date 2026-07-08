import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft, MessageSquare, Plus, Loader2, CheckCircle, AlertCircle,
  Stethoscope, Apple, Pill, User, Calendar, Mic, Square, FileDown,
  Search, UserX, UserCheck, ChevronRight, ClipboardList,
} from "lucide-react";
import { api, type Patient, type VisitVitals } from "../../../lib/api";
import { VitalsSection } from "../shared/VitalsSection";
import { MedicineRow, makeDefaultTimings, type MedicineFormRow } from "../prescription/MedicineRow";
import { useAuth } from "../../../context/AuthContext";

// ─── helpers ────────────────────────────────────────────────────────────────

function makeEmptyMed(): MedicineFormRow {
  return {
    id: crypto.randomUUID(),
    medicine_name: "",
    form: "tablet",
    dosage: "",
    duration_days: 5,
    timings: makeDefaultTimings(),
    instructions: "",
  };
}


function SectionCard({
  icon, title, accent, children, headerAction,
}: {
  icon: React.ReactNode; title: string; accent: string; children: React.ReactNode;
  headerAction?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className={`px-5 py-3.5 flex items-center gap-2.5 border-b ${accent}`}>
        <span className="opacity-80">{icon}</span>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13 }} className="text-slate-800">
          {title}
        </h3>
        {headerAction && <div className="ml-auto">{headerAction}</div>}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

// ─── AI Recorder ─────────────────────────────────────────────────────────────

interface ExtractedData {
  chief_complaint?: string | null;
  diagnosis?: string | null;
  past_history?: string | null;
  allergies?: string | null;
  lab_findings?: string | null;
  dietary_instructions?: string | null;
  precautions?: string | null;
  medicines?: Array<{
    name: string; strength?: string | null; duration_days?: number;
    morning?: boolean; afternoon?: boolean; evening?: boolean; night?: boolean;
    instructions?: string | null;
  }>;
  vitals?: {
    temperature?: string | null; bp?: string | null;
    pulse?: string | null; spo2?: string | null; weight?: string | null;
  };
}

type RecorderState = "idle" | "recording" | "processing" | "done" | "error";

function AIRecorder({ onExtracted, apiBase }: {
  onExtracted: (data: ExtractedData) => void;
  apiBase: string;
}) {
  const [state, setState]           = useState<RecorderState>("idle");
  const [seconds, setSeconds]       = useState(0);
  const [transcript, setTranscript] = useState("");
  const [showTx, setShowTx]         = useState(false);
  const [errMsg, setErrMsg]         = useState("");
  const mediaRef  = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const start = async () => {
    setErrMsg(""); setTranscript(""); setShowTx(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current  = mr;
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        setState("processing");
        await process();
      };
      mr.start(200);
      setState("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } catch (e: any) {
      setErrMsg(e?.message?.includes("denied") ? "Microphone permission denied" : "Could not access microphone");
      setState("error");
    }
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRef.current?.stop();
  };

  const process = async () => {
    try {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const fd = new FormData();
      fd.append("audio", blob, "recording.webm");

      const txRes = await fetch(`${apiBase}/prescriptions/transcribe`, { method: "POST", body: fd });
      if (!txRes.ok) throw new Error("Transcription failed");
      const { transcript: tx } = await txRes.json();
      setTranscript(tx);

      const exRes = await fetch(`${apiBase}/prescriptions/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: tx }),
      });
      if (!exRes.ok) throw new Error("Extraction failed");
      const extracted: ExtractedData = await exRes.json();
      onExtracted(extracted);
      setState("done");
    } catch (e: any) {
      setErrMsg(e?.message || "Processing failed");
      setState("error");
    }
  };

  if (state === "idle" || state === "error") return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        title="Record consultation to auto-fill prescription"
        onClick={start}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 text-[12px] font-semibold rounded-lg transition-colors"
      >
        <Mic size={13} className="text-slate-500" /> AI Recorder
      </button>
      {state === "error" && errMsg && (
        <span className="text-[10px] text-red-500">{errMsg}</span>
      )}
    </div>
  );

  if (state === "recording") return (
    <button
      type="button"
      onClick={stop}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[12px] font-bold rounded-lg animate-pulse transition-colors"
    >
      <Square size={11} fill="white" /> Stop ({fmt(seconds)})
    </button>
  );

  if (state === "processing") return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-slate-500 font-medium">
      <Loader2 size={13} className="animate-spin text-blue-500" /> Transcribing…
    </div>
  );

  // done
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-emerald-600 font-semibold">✅ Auto-filled</span>
        <button
          type="button"
          onClick={() => { setState("idle"); setTranscript(""); }}
          className="text-[11px] text-slate-400 hover:text-slate-600 underline"
        >
          Reset
        </button>
      </div>
      {transcript && (
        <button
          type="button"
          onClick={() => setShowTx(v => !v)}
          className="text-[11px] text-slate-400 hover:text-slate-600 underline"
        >
          {showTx ? "Hide" : "View"} transcript
        </button>
      )}
      {showTx && transcript && (
        <div className="mt-1 max-w-xs text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2 leading-relaxed text-right">
          {transcript}
        </div>
      )}
    </div>
  );
}

// ─── Patient Lookup Panel ────────────────────────────────────────────────────

type LookupMode = "idle" | "searching" | "found" | "not_found" | "linked" | "walkin";

interface FoundPatient {
  patient_id: string;
  name: string;
  age?: number;
  gender?: string;
  mobile: string;
  patient_code?: string;
  last_visit_date?: string;
}

const avatarColorsLookup = [
  "bg-violet-500", "bg-emerald-500", "bg-sky-500", "bg-pink-500",
  "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500",
];

function PatientLookupPanel({
  onLinked,
  onWalkin,
  onRegisterPatient,
}: {
  onLinked: (p: FoundPatient) => void;
  onWalkin: () => void;
  onRegisterPatient: (mobile: string) => void;
}) {
  const [mobile, setMobile] = useState("");
  const [mode, setMode] = useState<LookupMode>("idle");
  const [results, setResults] = useState<FoundPatient[]>([]);
  const [linked, setLinked] = useState<FoundPatient | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    if (!mobile.trim()) return;
    setMode("searching");
    setResults([]);
    try {
      const list = await api.patients.search(mobile.trim());
      setResults(list);
      setMode("found");
    } catch {
      setMode("not_found");
    }
  };

  const handleLink = (p: FoundPatient) => {
    setLinked(p);
    setMode("linked");
    onLinked(p);
  };

  const genderLabel = (g?: string) => g === "M" ? "Male" : g === "F" ? "Female" : g || "";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 flex items-center gap-2.5 border-b bg-slate-50 border-slate-100">
        <User size={14} className="text-slate-500 opacity-80" />
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13 }} className="text-slate-800">
          Link Patient
        </h3>
      </div>
      <div className="p-5 space-y-4">
        {/* Search row */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[12px] font-semibold">+91</span>
            <input
              ref={inputRef}
              type="tel"
              value={mobile}
              onChange={e => setMobile(e.target.value.replace(/\D/g, ""))}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Mobile number"
              disabled={mode === "linked"}
              className="w-full pl-11 pr-4 py-2.5 text-[13px] border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={mode === "searching" || mode === "linked" || !mobile.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-[13px] font-semibold rounded-xl transition-colors"
          >
            {mode === "searching" ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
            Search
          </button>
        </div>

        {/* Skip link */}
        {mode !== "linked" && (
          <div className="text-right -mt-1">
            <button
              onClick={onWalkin}
              className="text-[12px] text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors"
            >
              Skip → Walk-in
            </button>
          </div>
        )}

        {/* Multiple results */}
        {mode === "found" && results.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
              {results.length} patient{results.length > 1 ? "s" : ""} found — select one
            </p>
            {results.map((p, idx) => (
              <div key={p.patient_id} className="bg-slate-50 border border-slate-200 hover:border-emerald-300 rounded-xl p-3 flex items-center gap-3 transition-colors">
                <div className={`w-9 h-9 rounded-xl ${avatarColorsLookup[idx % avatarColorsLookup.length]} flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0`}>
                  {p.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 text-[13px] flex items-center gap-1.5">
                    {p.name}
                    {p.patient_code && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">{p.patient_code}</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {[p.age ? `${p.age} yrs` : null, genderLabel(p.gender)].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <button
                  onClick={() => handleLink(p)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-semibold rounded-lg transition-colors flex-shrink-0"
                >
                  <UserCheck size={12} /> Select
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Linked confirmation */}
        {mode === "linked" && linked && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
            <div>
              <div className="font-semibold text-emerald-800 text-[13px]">Patient linked: {linked.name}</div>
              <div className="text-[11px] text-emerald-600 mt-0.5">Prescription form is ready below</div>
            </div>
          </div>
        )}

        {/* Not found */}
        {mode === "not_found" && (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
              <UserX size={18} className="text-amber-500 flex-shrink-0" />
              <div>
                <div className="font-semibold text-amber-800 text-[13px]">Patient not registered.</div>
                <div className="text-[11px] text-amber-600 mt-0.5">No patient found with mobile {mobile}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onRegisterPatient(mobile)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border border-blue-200 bg-blue-50 text-blue-700 text-[12px] font-semibold rounded-xl hover:bg-blue-100 transition-colors"
              >
                <ChevronRight size={13} /> Register Patient
              </button>
              <button
                onClick={onWalkin}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border border-slate-200 bg-white text-slate-600 text-[12px] font-semibold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Continue as Walk-in
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Walk-in info panel ──────────────────────────────────────────────────────

function WalkinPanel({ name, age, onChangeName, onChangeAge }: {
  name: string; age: number | ""; onChangeName: (v: string) => void; onChangeAge: (v: number | "") => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 flex items-center gap-2.5 border-b bg-amber-50 border-amber-100">
        <User size={14} className="text-amber-500 opacity-80" />
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13 }} className="text-amber-800">
          Walk-in Patient
        </h3>
        <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-700">No registration</span>
      </div>
      <div className="p-5 flex gap-4">
        <div className="flex-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Patient Name *</label>
          <input
            value={name}
            onChange={e => onChangeName(e.target.value)}
            placeholder="e.g. Ramesh Kumar"
            className="w-full px-3.5 py-2.5 text-[13px] border border-slate-200 rounded-xl text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
          />
        </div>
        <div className="w-28">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Age</label>
          <input
            type="number"
            min={0}
            max={120}
            value={age}
            onChange={e => onChangeAge(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="yrs"
            className="w-full px-3.5 py-2.5 text-[13px] border border-slate-200 rounded-xl text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Live Prescription Preview ──────────────────────────────────────────────

interface PreviewProps {
  clinicName: string;
  doctorName: string;
  patientName: string;
  patientAge?: number | string;
  patientGender?: string;
  vitals: VisitVitals;
  chiefComplaint: string;
  diagnosis: string;
  pastHistory: string;
  allergies: string;
  labFindings: string;
  medicines: MedicineFormRow[];
  dietary: string;
  precautions: string;
  notes: string;
  followupDate: string;
}

function timingDoseStr(m: MedicineFormRow): string {
  const slots = [
    m.timings.morning.enabled   && `M(${m.timings.morning.qty})`,
    m.timings.afternoon.enabled && `A(${m.timings.afternoon.qty})`,
    m.timings.evening.enabled   && `E(${m.timings.evening.qty})`,
    m.timings.night.enabled     && `N(${m.timings.night.qty})`,
  ].filter(Boolean) as string[];
  return slots.join("-") || "—";
}

function foodStr(m: MedicineFormRow): string {
  const first = [m.timings.morning, m.timings.afternoon, m.timings.evening, m.timings.night].find(t => t.enabled);
  return first ? (first.before_food ? "Before food" : "After food") : "";
}

function PrescriptionPreview({
  clinicName, doctorName, patientName, patientAge, patientGender,
  vitals, chiefComplaint, diagnosis, pastHistory, allergies, labFindings,
  medicines, dietary, precautions, notes, followupDate,
}: PreviewProps) {
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const validMeds = medicines.filter(m => m.medicine_name.trim());
  const genderLabel = patientGender === "M" ? "Male" : patientGender === "F" ? "Female" : patientGender || "";

  const vitalsRow = [
    vitals.bp_systolic && vitals.bp_diastolic && `BP: ${vitals.bp_systolic}/${vitals.bp_diastolic} mmHg`,
    vitals.pulse_bpm && `Pulse: ${vitals.pulse_bpm} bpm`,
    vitals.temperature_f && `Temp: ${vitals.temperature_f}°F`,
    vitals.weight_kg && `Wt: ${vitals.weight_kg} kg`,
    vitals.height_cm && `Ht: ${vitals.height_cm} cm`,
    vitals.spo2_percent && `SpO2: ${vitals.spo2_percent}%`,
  ].filter(Boolean) as string[];

  const adviceLines = [dietary, precautions, notes].filter(Boolean);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-20 text-slate-800" style={{ fontFamily: "Georgia, serif", fontSize: 12 }}>

      {/* Clinic header */}
      <div className="px-5 pt-4 pb-3 border-b-2 border-slate-800">
        <div className="text-[15px] font-bold leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>{clinicName || "Clinic Name"}</div>
        <div className="text-[11px] text-slate-600 mt-0.5" style={{ fontFamily: "sans-serif" }}>{doctorName}</div>
        <div className="text-[10px] text-slate-400 mt-0.5" style={{ fontFamily: "sans-serif" }}>Date: {today}</div>
      </div>

      <div className="px-5 py-3 space-y-3">

        {/* Patient info row */}
        <div className="flex items-center gap-3 text-[11px] border border-slate-200 rounded-lg px-3 py-2 bg-slate-50" style={{ fontFamily: "sans-serif" }}>
          <span className="font-semibold text-slate-700 flex-1 truncate">{patientName || "Patient Name"}</span>
          {patientAge && <span className="text-slate-500 flex-shrink-0">{patientAge} yrs</span>}
          {genderLabel && <span className="text-slate-500 flex-shrink-0">{genderLabel}</span>}
        </div>

        {/* Vitals bar */}
        {vitalsRow.length > 0 && (
          <div className="border-l-4 border-teal-500 pl-3 py-1 bg-teal-50 rounded-r-lg text-[10px] text-teal-800 leading-relaxed" style={{ fontFamily: "sans-serif" }}>
            {vitalsRow.join("  ·  ")}
          </div>
        )}

        {/* Rx symbol */}
        <div className="text-[28px] font-bold text-slate-800 leading-none" style={{ fontFamily: "Georgia, serif" }}>℞</div>

        {/* Chief Complaints */}
        {chiefComplaint && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1" style={{ fontFamily: "sans-serif" }}>Chief Complaints</div>
            <div className="text-[12px] text-slate-700">{chiefComplaint}</div>
          </div>
        )}

        {/* Diagnosis */}
        {diagnosis && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1" style={{ fontFamily: "sans-serif" }}>Diagnosis</div>
            <div className="text-[12px] font-semibold text-indigo-700">{diagnosis}</div>
          </div>
        )}

        {/* History */}
        {(pastHistory || allergies || labFindings) && (
          <div className="bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 space-y-1" style={{ fontFamily: "sans-serif" }}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1">History</div>
            {pastHistory && <div className="text-[10px] text-slate-600"><span className="font-semibold text-slate-700">Past History: </span>{pastHistory}</div>}
            {allergies && (
              <div className="text-[10px]">
                <span className="font-semibold text-slate-700">Allergies: </span>
                <span className={allergies.toUpperCase() === "NKDA" ? "text-slate-500" : "text-red-600 font-semibold"}>{allergies}</span>
              </div>
            )}
            {labFindings && <div className="text-[10px] text-slate-600"><span className="font-semibold text-slate-700">Investigations: </span>{labFindings}</div>}
          </div>
        )}

        {/* Medicines */}
        {validMeds.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5" style={{ fontFamily: "sans-serif" }}>Medicines</div>
            <table className="w-full border-collapse" style={{ fontFamily: "sans-serif" }}>
              <thead>
                <tr className="border-b border-slate-300 text-[9px] uppercase tracking-wider text-slate-400">
                  <th className="text-left pb-1 w-5">#</th>
                  <th className="text-left pb-1">Medicine</th>
                  <th className="text-left pb-1 w-12">Dose</th>
                  <th className="text-left pb-1 w-10">Days</th>
                </tr>
              </thead>
              <tbody>
                {validMeds.map((m, i) => (
                  <tr key={m.id} className="border-b border-dashed border-slate-100 align-top">
                    <td className="py-1.5 text-slate-400 text-[10px]">{i + 1}</td>
                    <td className="py-1.5">
                      <div className="text-[11px] font-semibold text-slate-800">{m.medicine_name}{m.dosage ? ` ${m.dosage}` : ""}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{timingDoseStr(m)}{foodStr(m) ? ` · ${foodStr(m)}` : ""}</div>
                      {m.instructions && <div className="text-[9px] text-slate-400 italic">{m.instructions}</div>}
                    </td>
                    <td className="py-1.5 text-[10px] text-slate-600">{timingDoseStr(m)}</td>
                    <td className="py-1.5 text-[10px] text-slate-600">{m.duration_days}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Advice */}
        {adviceLines.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1" style={{ fontFamily: "sans-serif" }}>Advice</div>
            {adviceLines.map((line, i) => (
              <div key={i} className="text-[11px] text-slate-700">{line}</div>
            ))}
          </div>
        )}

        {/* Follow-up */}
        {followupDate && (
          <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2 text-[11px]" style={{ fontFamily: "sans-serif" }}>
            <span className="font-semibold text-green-700">Follow-up Review: </span>
            <span className="text-green-800">{new Date(followupDate + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
        )}

        {/* Doctor signature */}
        <div className="pt-3 border-t border-slate-200 text-right" style={{ fontFamily: "sans-serif" }}>
          <div className="text-[11px] font-bold text-slate-800">{doctorName}</div>
          <div className="text-[9px] text-slate-400 mt-0.5">Signature</div>
        </div>

        {/* Footer */}
        <div className="text-center text-[9px] text-slate-300 border-t border-slate-100 pt-2" style={{ fontFamily: "sans-serif" }}>
          Computer-generated prescription · {clinicName}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface PrescriptionWriterProps {
  patientId?: string;
  appointmentId?: string;
  prescriptionId?: string;
  onNavigate?: (page: string) => void;
}

export function PrescriptionWriter({
  patientId: patientIdProp,
  appointmentId: appointmentIdProp,
  prescriptionId: prescriptionIdProp,
  onNavigate,
}: PrescriptionWriterProps = {}) {
  const { doctorId, clinicName, doctorName } = useAuth();
  const urlParams = new URLSearchParams(window.location.search);
  const patientId      = patientIdProp || urlParams.get("patient_id") || "";
  const appointmentId  = appointmentIdProp || urlParams.get("appointment_id") || "";
  const prescriptionId = prescriptionIdProp || urlParams.get("prescription_id") || "";
  const isEditMode     = !!prescriptionId;
  const needsLookup    = !isEditMode && !patientId; // show patient lookup panel

  // Patient state
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visitId, setVisitId] = useState<string>("");
  const [loadingPatient, setLoadingPatient] = useState(!!patientId || isEditMode);

  // Walk-in / lookup state
  const [isWalkin, setIsWalkin] = useState(false);
  const [walkinName, setWalkinName] = useState("");
  const [walkinAge, setWalkinAge] = useState<number | "">("");
  const [linkedPatient, setLinkedPatient] = useState<{ patient_id: string; name: string; age?: number; mobile: string } | null>(null);
  const [showLookup, setShowLookup] = useState(needsLookup);

  // Form
  const [form, setForm] = useState({
    chief_complaint: "",
    diagnosis: "",
    past_history: "",
    allergies: "",
    lab_findings: "",
    notes: "",
    dietary_instructions: "",
    precautions: "",
    followup_date: "",
  });
  const [medicines, setMedicines] = useState<MedicineFormRow[]>([makeEmptyMed()]);
  const [vitalsForm, setVitalsForm] = useState<VisitVitals>({});

  // Save state
  const [saving, setSaving]       = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg]   = useState("");
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [savedPrescriptionId, setSavedPrescriptionId] = useState("");

  // Right panel tab
  const [rightTab, setRightTab] = useState<"patient" | "preview">("patient");

  // PDF button
  const [pdfLoading, setPdfLoading] = useState(false);

  // Load patient/prescription for edit or pre-linked modes
  useEffect(() => {
    if (isEditMode) {
      api.prescriptions.getDetail(prescriptionId).then(pres => {
        if (!pres) { setLoadingPatient(false); return; }
        // Detect walk-in: no patient_id but has walkin_name
        if (!pres.patient_id && (pres as any).walkin_name) {
          setIsWalkin(true);
          setWalkinName((pres as any).walkin_name || "");
          setWalkinAge((pres as any).walkin_age || "");
          setShowLookup(false);
          setLoadingPatient(false);
        } else {
          if (pres.patients) setPatient(pres.patients as unknown as Patient);
          else if (pres.patient_id) api.patients.get(pres.patient_id).then(setPatient).catch(() => {});
        }
        const v = (pres as any).visits;
        if (v) {
          setVisitId(v.id || "");
          setForm({
            chief_complaint:      v.chief_complaint || "",
            diagnosis:            v.diagnosis || "",
            past_history:         v.past_history || "",
            allergies:            v.allergies || "",
            lab_findings:         v.lab_findings || "",
            notes:                v.notes || "",
            dietary_instructions: pres.dietary_instructions || "",
            precautions:          pres.precautions || "",
            followup_date:        pres.followup_date || "",
          });
        } else {
          setForm(f => ({ ...f, dietary_instructions: pres.dietary_instructions || "", precautions: pres.precautions || "", followup_date: pres.followup_date || "" }));
        }
        const meds: MedicineFormRow[] = ((pres.prescription_medicines ?? []) as any[]).map((m: any) => {
          const bf = !!m.before_food;
          const tdRaw = m.timing_details || {};
          return {
            id: crypto.randomUUID(),
            medicine_id: m.medicine_id || undefined,
            medicine_name: m.medicine_name || "",
            form: "tablet",
            dosage: m.dosage || "",
            duration_days: m.duration_days ?? 5,
            timings: {
              morning:   { enabled: !!m.morning,   qty: tdRaw.morning?.qty   ?? (m.qty_per_dose ?? 1), before_food: tdRaw.morning?.before_food   ?? bf },
              afternoon: { enabled: !!m.afternoon, qty: tdRaw.afternoon?.qty ?? (m.qty_per_dose ?? 1), before_food: tdRaw.afternoon?.before_food ?? bf },
              evening:   { enabled: !!m.evening,   qty: tdRaw.evening?.qty   ?? (m.qty_per_dose ?? 1), before_food: tdRaw.evening?.before_food   ?? bf },
              night:     { enabled: !!m.night,     qty: tdRaw.night?.qty     ?? (m.qty_per_dose ?? 1), before_food: tdRaw.night?.before_food     ?? bf },
            },
            instructions: m.instructions || "",
          };
        });
        setMedicines(meds.length > 0 ? meds : [makeEmptyMed()]);
        setLoadingPatient(false);
      }).catch(() => setLoadingPatient(false));
    } else if (patientId) {
      api.patients.get(patientId).then(p => {
        setPatient(p);
        setLoadingPatient(false);
      }).catch(() => setLoadingPatient(false));
    }
  }, [prescriptionId, patientId]);

  // Derived: effective patient for display
  const displayName = patient?.name || linkedPatient?.name || (isWalkin ? walkinName : null);
  const formActive = isEditMode || !!patient || !!linkedPatient || isWalkin;
  const effectivePatientIdForVisit = patient?.id || linkedPatient?.patient_id || "";

  // Ensure a visit exists once a real patient is active, so vitals can be
  // recorded before the prescription is saved. The prescription save passes
  // this visit_id through and the backend completes the visit.
  const creatingVisitRef = useRef(false);
  useEffect(() => {
    if (isEditMode || isWalkin || !effectivePatientIdForVisit || visitId || creatingVisitRef.current) return;
    creatingVisitRef.current = true;
    api.visits.create({
      patient_id: effectivePatientIdForVisit,
      doctor_id: doctorId,
      appointment_id: appointmentId || undefined,
    })
      .then(v => setVisitId(v.id))
      .catch(err => console.error("Failed to create visit", err))
      .finally(() => { creatingVisitRef.current = false; });
  }, [isEditMode, isWalkin, effectivePatientIdForVisit, visitId, doctorId, appointmentId]);

  // Load existing vitals for the visit (edit mode / reload)
  useEffect(() => {
    if (!visitId) return;
    api.visits.getVitals(visitId)
      .then(d => { if (d.vitals) setVitalsForm(d.vitals); })
      .catch(() => {});
  }, [visitId]);

  const updateVital = (field: keyof VisitVitals, value: string) =>
    setVitalsForm(prev => ({ ...prev, [field]: value }));

  const VITAL_VALUE_KEYS: (keyof VisitVitals)[] = [
    "temperature_f", "weight_kg", "height_cm", "spo2_percent",
    "bp_systolic", "bp_diastolic", "pulse_bpm", "key_findings",
  ];
  const hasAnyVital = VITAL_VALUE_KEYS.some(
    k => vitalsForm[k] !== undefined && vitalsForm[k] !== null && vitalsForm[k] !== ""
  );

  // Medicine handlers
  const addMedicine = () => setMedicines(prev => [...prev, makeEmptyMed()]);
  const updateMedicine = useCallback((idx: number, updated: MedicineFormRow) => {
    setMedicines(prev => prev.map((m, i) => i === idx ? updated : m));
  }, []);
  const removeMedicine = (idx: number) => {
    setMedicines(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  };


  // ── AI RECORDER extracted data → form ────────────────────
  function handleExtracted(data: ExtractedData) {
    if (data.chief_complaint)       setForm(f => ({ ...f, chief_complaint:       data.chief_complaint! }));
    if (data.diagnosis)             setForm(f => ({ ...f, diagnosis:             data.diagnosis! }));
    if (data.past_history)          setForm(f => ({ ...f, past_history:          data.past_history! }));
    if (data.allergies)             setForm(f => ({ ...f, allergies:             data.allergies! }));
    if (data.lab_findings)          setForm(f => ({ ...f, lab_findings:          data.lab_findings! }));
    if (data.dietary_instructions)  setForm(f => ({ ...f, dietary_instructions:  data.dietary_instructions! }));
    if (data.precautions)           setForm(f => ({ ...f, precautions:           data.precautions! }));

    if (data.vitals) {
      const v = data.vitals;
      setVitalsForm(prev => {
        const next = { ...prev };
        if (v.temperature) {
          const t = parseFloat(v.temperature);
          if (!isNaN(t)) next.temperature_f = String(t);
        }
        if (v.bp) {
          const [sys, dia] = v.bp.split("/");
          if (sys) next.bp_systolic = sys.trim();
          if (dia) next.bp_diastolic = dia.trim();
        }
        if (v.pulse)  next.pulse_bpm = v.pulse.replace(/\D/g, "");
        if (v.spo2)   next.spo2_percent = v.spo2.replace(/\D/g, "");
        if (v.weight) next.weight_kg = v.weight.replace(/[^\d.]/g, "");
        return next;
      });
    }

    if (data.medicines && data.medicines.length > 0) {
      const newMeds: MedicineFormRow[] = data.medicines.map(m => ({
        id: crypto.randomUUID(),
        medicine_name: m.name || "",
        form: "tablet",
        dosage: m.strength || "",
        duration_days: m.duration_days ?? 5,
        timings: {
          morning:   { enabled: !!m.morning,   qty: 1, before_food: false },
          afternoon: { enabled: !!m.afternoon, qty: 1, before_food: false },
          evening:   { enabled: !!m.evening,   qty: 1, before_food: false },
          night:     { enabled: !!m.night,     qty: 1, before_food: false },
        },
        instructions: m.instructions || "",
      }));
      setMedicines(newMeds.length > 0 ? newMeds : [makeEmptyMed()]);
    }
  }

  // ── GENERATE PDF ─────────────────────────────────────────
  const API_BASE = import.meta.env.VITE_API_URL as string;

  async function handleGeneratePdf() {
    setPdfLoading(true);
    try {
      const patName = patient?.name || linkedPatient?.name || walkinName || "";
      const payload = {
        clinic_name:           clinicName,
        doctor_name:           doctorName,
        patient_name:          patName,
        patient_age:           patient?.age || linkedPatient?.age || walkinAge || "",
        patient_gender:        patient?.gender || "",
        patient_code:          patient?.patient_code || "",
        visit_date:            new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        chief_complaint:       form.chief_complaint,
        diagnosis:             form.diagnosis,
        dietary_instructions:  form.dietary_instructions,
        precautions:           form.precautions,
        notes:                 form.notes,
        medicines:             medicines.filter(m => m.medicine_name.trim()).map(m => ({
          medicine_name: m.medicine_name, dosage: m.dosage,
          morning: m.timings.morning.enabled, afternoon: m.timings.afternoon.enabled,
          evening: m.timings.evening.enabled, night: m.timings.night.enabled,
          before_food: m.timings.morning.before_food,
          duration_days: m.duration_days, instructions: m.instructions,
        })),
        vitals: {
          temperature_f: vitalsForm.temperature_f, weight_kg: vitalsForm.weight_kg,
          height_cm: vitalsForm.height_cm, spo2_percent: vitalsForm.spo2_percent,
          bp_systolic: vitalsForm.bp_systolic, bp_diastolic: vitalsForm.bp_diastolic,
          pulse_bpm: vitalsForm.pulse_bpm,
        },
      };
      const res = await fetch(`${API_BASE}/prescriptions/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`PDF generation failed (${res.status})`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (e: any) {
      setErrorMsg(e?.message || "PDF generation failed");
    } finally {
      setPdfLoading(false);
    }
  }

  // ── PRINT ───────────────────────────────────────────────
  function handlePrint() {
    const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const medLines = medicines.filter(m => m.medicine_name.trim()).map((m, i) => {
      const { morning, afternoon, evening, night } = m.timings;
      const timingParts = (
        [
          morning.enabled   && `Morning (${morning.qty})`,
          afternoon.enabled && `Afternoon (${afternoon.qty})`,
          evening.enabled   && `Evening (${evening.qty})`,
          night.enabled     && `Night (${night.qty})`,
        ] as (string | false)[]
      ).filter(Boolean).join(" + ");
      const firstEnabled = [morning, afternoon, evening, night].find(t => t.enabled);
      const foodStr = firstEnabled ? (firstEnabled.before_food ? "Before food" : "After food") : "";
      return `<div class="medicine"><p><strong>${i+1}. ${m.medicine_name}</strong> — ${m.dosage || ""}</p><p style="color:#555">${timingParts || "—"} | ${foodStr} | ${m.duration_days} days</p>${m.instructions ? `<p style="color:#777;font-style:italic">${m.instructions}</p>` : ""}</div>`;
    }).join("");
    const patName = patient?.name || linkedPatient?.name || walkinName || "—";
    const patAge = patient?.age || linkedPatient?.age || walkinAge || "—";
    const html = `<html><head><title>Prescription</title><style>body{font-family:serif;padding:24px;max-width:420px;font-size:13px}h2{font-size:15px;margin:0 0 2px}p{margin:3px 0}.divider{border-top:1px solid #000;margin:10px 0}.medicine{margin:8px 0;padding:6px 0;border-bottom:1px dashed #eee}.footer{margin-top:24px;text-align:right}@media print{body{padding:0}}</style></head><body><h2>${clinicName}</h2><p>${doctorName}</p><div class="divider"></div><p><strong>Patient:</strong> ${patName} &nbsp;&nbsp; <strong>Date:</strong> ${today}</p><p><strong>Age:</strong> ${patAge} yrs${patient?.patient_code ? ` &nbsp;&nbsp; <strong>Code:</strong> ${patient.patient_code}` : ""}</p><div class="divider"></div><p><strong>Complaint:</strong> ${form.chief_complaint}</p><p><strong>Diagnosis:</strong> ${form.diagnosis}</p><div class="divider"></div><p><strong>Rx</strong></p>${medLines}<div class="divider"></div>${form.dietary_instructions ? `<p><strong>Diet:</strong> ${form.dietary_instructions}</p>` : ""}${form.precautions ? `<p><strong>Precautions:</strong> ${form.precautions}</p>` : ""}${form.notes ? `<p><strong>Notes:</strong> ${form.notes}</p>` : ""}<div class="divider"></div><p>Follow up in 3 days if not improving.</p><div class="footer"><p>${doctorName}</p><p style="color:#999">(Signature)</p></div></body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.print();
  }

  // ── SAVE ────────────────────────────────────────────────
  async function handleSave() {
    const newErrors: Record<string, string> = {};
    if (isWalkin && !walkinName.trim()) newErrors.walkin_name = "Patient name is required for walk-in";
    if (!form.chief_complaint.trim()) newErrors.chief_complaint = "Chief complaint is required";
    if (!form.diagnosis.trim()) newErrors.diagnosis = "Diagnosis is required";
    const validMeds = medicines.filter(m => m.medicine_name.trim());
    if (validMeds.length === 0) newErrors.medicines = "Add at least one medicine";
    const missingTiming = validMeds.find(m =>
      !m.timings.morning.enabled && !m.timings.afternoon.enabled &&
      !m.timings.evening.enabled && !m.timings.night.enabled
    );
    if (missingTiming) newErrors.timing = `Select timing for "${missingTiming.medicine_name}"`;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setSaving(true);

    const medPayload = validMeds.map((m, i) => {
      const { morning, afternoon, evening, night } = m.timings;
      // Build timing_details only for enabled timings
      const timing_details: Record<string, { qty: number; before_food: boolean }> = {};
      if (morning.enabled)   timing_details.morning   = { qty: morning.qty,   before_food: morning.before_food };
      if (afternoon.enabled) timing_details.afternoon = { qty: afternoon.qty, before_food: afternoon.before_food };
      if (evening.enabled)   timing_details.evening   = { qty: evening.qty,   before_food: evening.before_food };
      if (night.enabled)     timing_details.night     = { qty: night.qty,     before_food: night.before_food };
      // Backward-compat global fields: use first enabled timing's before_food, sum qty as qty_per_dose
      const firstEnabled = [morning, afternoon, evening, night].find(t => t.enabled);
      return {
        medicine_id:    m.medicine_id || undefined,
        medicine_name:  m.medicine_name,
        dosage:         m.dosage,
        qty_per_dose:   firstEnabled?.qty ?? 1,
        duration_days:  m.duration_days,
        morning:        morning.enabled,
        afternoon:      afternoon.enabled,
        evening:        evening.enabled,
        night:          night.enabled,
        before_food:    firstEnabled?.before_food ?? false,
        timing_details,
        instructions:   m.instructions,
        sort_order:     i + 1,
      };
    });

    // Vitals save together with the prescription (best-effort, non-blocking)
    if (visitId && hasAnyVital) {
      try {
        await api.visits.saveVitals(visitId, { ...vitalsForm, recorded_by_role: "doctor" });
      } catch (e) {
        console.error("Vitals save failed", e);
      }
    }

    try {
      if (isEditMode) {
        const result = await api.prescriptions.update(prescriptionId, {
          patient_id: patient?.id || patientId || undefined,
          visit_id: visitId || undefined,
          chief_complaint: form.chief_complaint,
          diagnosis: form.diagnosis,
          past_history: form.past_history,
          allergies: form.allergies,
          lab_findings: form.lab_findings,
          notes: form.notes,
          dietary_instructions: form.dietary_instructions,
          precautions: form.precautions,
          followup_date: form.followup_date || null,
          medicines: medPayload,
        });
        setSuccessMsg(`Prescription updated!${result.whatsapp_sent ? " WhatsApp sent." : ""}`);
        setTimeout(() => setSuccessMsg(""), 4000);
        return;
      }

      // New prescription
      const effectivePatientId = patient?.id || patientId || linkedPatient?.patient_id || null;
      const result = await api.prescriptions.createNew({
        doctor_id:            doctorId,
        patient_id:           isWalkin ? null : effectivePatientId,
        visit_id:             visitId || null,
        appointment_id:       appointmentId || null,
        is_walkin:            isWalkin,
        walkin_name:          isWalkin ? walkinName : null,
        walkin_age:           isWalkin && walkinAge !== "" ? Number(walkinAge) : null,
        chief_complaint:      form.chief_complaint,
        diagnosis:            form.diagnosis,
        past_history:         form.past_history,
        allergies:            form.allergies,
        lab_findings:         form.lab_findings,
        dietary_instructions: form.dietary_instructions,
        precautions:          form.precautions,
        general_notes:        form.notes,
        followup_date:        form.followup_date || null,
        medicines:            medPayload,
      });

      for (const m of medicines) {
        if (m.medicine_id) api.medicines.incrementUsage(m.medicine_id).catch(() => {});
      }

      if (isWalkin) {
        setSavedPrescriptionId(result.prescription_id);
        setSuccessMsg("Prescription saved.");
      } else {
        setSuccessMsg("Prescription saved. Sending WhatsApp to patient…");
        try {
          await api.prescriptions.sendWhatsapp(result.prescription_id);
          setSuccessMsg("Prescription saved. WhatsApp sent ✓");
        } catch {
          setSuccessMsg("Prescription saved. (WhatsApp could not be sent)");
        }
        setTimeout(() => { if (onNavigate) onNavigate("prescriptions"); else window.location.href = "/"; }, 2500);
      }

    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to save prescription");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────
  if (loadingPatient) {
    return (
      <div className="h-full flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/20" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center gap-2 md:gap-4 flex-wrap">
          <button
            onClick={() => { if (onNavigate) onNavigate("prescriptions"); else window.history.back(); }}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-[13px] px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={15} /> Back
          </button>

          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
              <Stethoscope size={13} className="text-white" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-emerald-800 leading-none">{clinicName}</div>
              <div className="text-[10px] text-emerald-600 mt-0.5">{doctorName}</div>
            </div>
          </div>

          <div className="flex-1">
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16 }} className="text-slate-800">
              {isEditMode ? "Edit Prescription" : "New Prescription"}
              {displayName && (
                <span className="font-normal text-slate-500 text-[14px] ml-2">
                  — {displayName}
                  {patient?.patient_code && (
                    <span className="ml-1.5 text-[11px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-semibold">
                      {patient.patient_code}
                    </span>
                  )}
                  {isWalkin && (
                    <span className="ml-1.5 text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Walk-in</span>
                  )}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Calendar size={10} /> {today}
              </span>
              {isEditMode && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">✏️ Editing</span>
              )}
            </div>
          </div>

          {successMsg && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] font-semibold px-3.5 py-2 rounded-xl">
              <CheckCircle size={15} /> {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-[13px] px-3.5 py-2 rounded-xl">
              <AlertCircle size={15} /> {errorMsg}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleGeneratePdf}
              disabled={pdfLoading}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-[12px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              {pdfLoading ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
              {pdfLoading ? "Building…" : "PDF"}
            </button>
            {formActive && (
              <button
                onClick={handleSave}
                disabled={saving || !!savedPrescriptionId}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-[13px] font-bold px-5 py-2 rounded-xl shadow-md shadow-emerald-200 transition-all active:scale-95"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                {saving ? "Saving…" : isWalkin ? "Save Prescription" : "Save & Send WhatsApp"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      {(successMsg || errorMsg) && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-[13px] font-semibold border ${
          successMsg ? "bg-emerald-500 text-white border-emerald-600" : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {successMsg ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {successMsg || errorMsg}
        </div>
      )}

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row gap-6">

        {/* LEFT — main form */}
        <div className="flex-1 space-y-5 min-w-0 w-full">

          {/* Patient lookup (only when no patient from props/URL) */}
          {showLookup && !isWalkin && (
            <PatientLookupPanel
              onLinked={(p) => { setLinkedPatient(p); setShowLookup(false); }}
              onWalkin={() => { setIsWalkin(true); setShowLookup(false); }}
              onRegisterPatient={(mob) => {
                if (onNavigate) onNavigate("register-patient");
                else window.location.href = `/patients/new?mobile=${mob}`;
              }}
            />
          )}

          {/* Walk-in fields */}
          {isWalkin && (
            <WalkinPanel
              name={walkinName}
              age={walkinAge}
              onChangeName={setWalkinName}
              onChangeAge={setWalkinAge}
            />
          )}

          {/* Form — dims until patient is determined */}
          <div className={`space-y-5 transition-opacity ${formActive ? "opacity-100" : "opacity-40 pointer-events-none"}`}>

            {/* Visit Details */}
            <SectionCard
              icon={<Stethoscope size={16} className="text-blue-600" />}
              title="Visit Details"
              accent="bg-blue-50 border-blue-100"
              headerAction={<AIRecorder onExtracted={handleExtracted} apiBase={API_BASE} />}
            >
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Chief Complaint <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={2}
                  value={form.chief_complaint}
                  onChange={e => setForm(f => ({ ...f, chief_complaint: e.target.value }))}
                  placeholder="e.g. Fever for 2 days, cough and cold..."
                  className={`w-full px-3.5 py-2.5 text-[13px] border rounded-xl text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 resize-none transition-shadow ${errors.chief_complaint ? "border-red-300 bg-red-50/30" : "border-slate-200 hover:border-slate-300"}`}
                />
                {errors.chief_complaint && <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} /> {errors.chief_complaint}</p>}
              </div>

              {/* Vitals & Examination — always editable, saved with the prescription */}
              {visitId && !isWalkin && (
                <VitalsSection
                  vitals={vitalsForm}
                  onChange={updateVital}
                  editable={true}
                />
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Diagnosis <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.diagnosis}
                  onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
                  placeholder="Primary diagnosis"
                  className={`w-full px-3.5 py-2.5 text-[13px] border rounded-xl text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-shadow ${errors.diagnosis ? "border-red-300 bg-red-50/30" : "border-slate-200 hover:border-slate-300"}`}
                />
                {errors.diagnosis && <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} /> {errors.diagnosis}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Additional Notes</label>
                <input
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any additional clinical notes..."
                  className="w-full px-3.5 py-2.5 text-[13px] border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-shadow"
                />
              </div>
            </SectionCard>

            {/* History */}
            <SectionCard icon={<ClipboardList size={16} className="text-purple-500" />} title="History" accent="bg-purple-50 border-purple-100">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Past Medical & Surgical History</label>
                <textarea
                  value={form.past_history}
                  onChange={e => setForm(f => ({ ...f, past_history: e.target.value }))}
                  placeholder="e.g. Diabetic & hypertensive for 10 years, appendix surgery 15 years ago"
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-[13px] border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 resize-none transition-shadow"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Allergies</label>
                <input
                  value={form.allergies}
                  onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))}
                  placeholder="e.g. NKDA / Penicillin allergy"
                  className="w-full px-3.5 py-2.5 text-[13px] border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Lab / Investigation Findings</label>
                <input
                  value={form.lab_findings}
                  onChange={e => setForm(f => ({ ...f, lab_findings: e.target.value }))}
                  placeholder="e.g. No abnormalities in platelet, WBC normal"
                  className="w-full px-3.5 py-2.5 text-[13px] border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-shadow"
                />
              </div>
            </SectionCard>

            {/* Dietary & Precautions */}
            <SectionCard icon={<Apple size={16} className="text-orange-500" />} title="Dietary & Precautions" accent="bg-orange-50 border-orange-100">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Dietary Instructions</label>
                <input
                  value={form.dietary_instructions}
                  onChange={e => setForm(f => ({ ...f, dietary_instructions: e.target.value }))}
                  placeholder="e.g. Avoid oily and spicy food, drink plenty of fluids"
                  className="w-full px-3.5 py-2.5 text-[13px] border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Precautions</label>
                <input
                  value={form.precautions}
                  onChange={e => setForm(f => ({ ...f, precautions: e.target.value }))}
                  placeholder="e.g. Complete bed rest for 2 days"
                  className="w-full px-3.5 py-2.5 text-[13px] border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-shadow"
                />
              </div>
            </SectionCard>

            {/* Follow-up */}
            <SectionCard icon={<Calendar size={16} className="text-green-500" />} title="Follow-up Review" accent="bg-green-50 border-green-100">
              <div>
                <div className="flex gap-2 flex-wrap mb-2">
                  {[3, 5, 7, 14, 30].map(days => {
                    const d = new Date(); d.setDate(d.getDate() + days);
                    const val = d.toISOString().split("T")[0];
                    const active = form.followup_date === val;
                    return (
                      <button key={days} type="button"
                        onClick={() => setForm(f => ({ ...f, followup_date: active ? "" : val }))}
                        className={`px-3 py-1.5 text-[12px] rounded-lg border font-medium transition-all ${active ? "bg-green-500 border-green-500 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-600"}`}>
                        {days}d
                      </button>
                    );
                  })}
                </div>
                <input
                  type="date"
                  value={form.followup_date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e => setForm(f => ({ ...f, followup_date: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-[13px] border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition-shadow"
                />
                {form.followup_date && (
                  <p className="text-[11px] text-green-600 mt-1">
                    Review on {new Date(form.followup_date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                )}
              </div>
            </SectionCard>

            {/* Medicines */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-sm">
                    <Pill size={14} className="text-white" />
                  </div>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14 }} className="text-slate-800">Medicines</h3>
                  <span className="text-[11px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-semibold">
                    {medicines.filter(m => m.medicine_name.trim()).length} added
                  </span>
                </div>
              </div>

              {(errors.medicines || errors.timing) && (
                <div className="mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-[12px] text-red-600 font-medium">
                  <AlertCircle size={13} />{errors.medicines || errors.timing}
                </div>
              )}

              {medicines.map((med, idx) => (
                <MedicineRow key={med.id} index={idx} medicine={med} onChange={updated => updateMedicine(idx, updated)} onRemove={() => removeMedicine(idx)} />
              ))}

              <button
                type="button"
                onClick={addMedicine}
                className="w-full mt-3 py-4 border-2 border-dashed border-violet-200 rounded-2xl text-[13px] text-violet-500 font-semibold hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50/50 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add Another Medicine
              </button>
            </div>

            {/* Bottom action bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <button
                onClick={() => { if (onNavigate) onNavigate("dashboard"); else window.location.href = "/"; }}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <div className="flex-1" />
              {(isWalkin || savedPrescriptionId) && (
                <button
                  onClick={handleGeneratePdf}
                  disabled={pdfLoading}
                  className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  {pdfLoading ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                  {pdfLoading ? "Building…" : "PDF Prescription"}
                </button>
              )}
              {!savedPrescriptionId && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-60 text-white text-[13px] font-bold px-6 py-2.5 rounded-xl shadow-md shadow-emerald-200 transition-all active:scale-95"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <MessageSquare size={15} />}
                  {saving ? "Saving…" : isWalkin ? "Save Prescription" : "Save & Send WhatsApp"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — Patient info / Preview tab panel */}
        <div className="w-full md:w-80 md:flex-shrink-0 space-y-3">

          {/* Tab toggle */}
          <div className="flex rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden sticky top-20">
            {(["patient", "preview"] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setRightTab(tab)}
                className={`flex-1 py-2.5 text-[12px] font-semibold transition-colors ${
                  rightTab === tab
                    ? "bg-slate-800 text-white"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {tab === "patient" ? "👤 Patient" : "📄 Preview"}
              </button>
            ))}
          </div>

          {/* Patient tab */}
          {rightTab === "patient" && (
            <>
              {(patient || linkedPatient) ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-20">
                  <div className="bg-gradient-to-br from-violet-500 to-purple-600 px-5 py-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3 text-white text-xl font-bold">
                      {(patient?.name || linkedPatient?.name || "?")[0]}
                    </div>
                    <div className="text-white font-bold text-[15px] leading-snug">{patient?.name || linkedPatient?.name}</div>
                    {patient?.patient_code && (
                      <div className="mt-1 inline-flex items-center gap-1 text-[11px] bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">
                        # {patient.patient_code}
                      </div>
                    )}
                  </div>
                  <div className="px-5 py-4 space-y-3 text-[13px]">
                    <div className="text-slate-500">
                      {[patient?.age || linkedPatient?.age ? `${patient?.age || linkedPatient?.age} yrs` : null,
                        patient?.gender === "M" ? "Male" : patient?.gender === "F" ? "Female" : patient?.gender
                      ].filter(Boolean).join(" · ") || "—"}
                    </div>
                    <div className="text-slate-500">{patient?.mobile || linkedPatient?.mobile || "—"}</div>
                    <div className="text-slate-500 capitalize">{patient?.language || "English"}</div>
                  </div>
                  <div className="mx-4 mb-4 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                      <MessageSquare size={11} /> WhatsApp in <span className="capitalize">{patient?.language || "english"}</span>
                    </div>
                  </div>
                </div>
              ) : isWalkin ? (
                <div className="bg-white rounded-2xl border border-amber-200 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                      <User size={14} className="text-amber-600" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-slate-700">{walkinName || "Walk-in patient"}</div>
                      {walkinAge !== "" && <div className="text-[11px] text-slate-400">{walkinAge} yrs</div>}
                    </div>
                  </div>
                  <div className="text-[11px] text-amber-600 mt-2 flex items-center gap-1">
                    <AlertCircle size={11} /> No WhatsApp — walk-in patient
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <User size={20} className="text-slate-400" />
                    </div>
                    <p className="text-[13px] text-slate-400">Search for a patient above</p>
                    <p className="text-[11px] text-slate-300 mt-1">or continue as walk-in</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Preview tab */}
          {rightTab === "preview" && (
            <PrescriptionPreview
              clinicName={clinicName}
              doctorName={doctorName}
              patientName={patient?.name || linkedPatient?.name || walkinName}
              patientAge={patient?.age || linkedPatient?.age || walkinAge || undefined}
              patientGender={patient?.gender || undefined}
              vitals={vitalsForm}
              chiefComplaint={form.chief_complaint}
              diagnosis={form.diagnosis}
              pastHistory={form.past_history}
              allergies={form.allergies}
              labFindings={form.lab_findings}
              medicines={medicines}
              dietary={form.dietary_instructions}
              precautions={form.precautions}
              notes={form.notes}
              followupDate={form.followup_date}
            />
          )}
        </div>
      </div>
    </div>
  );
}
