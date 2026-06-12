import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft, Printer, MessageSquare, Plus, Loader2, CheckCircle, AlertCircle,
  Stethoscope, Apple, Pill, FileText, User, Calendar, Hash, Phone, Globe,
  Search, UserX, UserCheck, ChevronRight,
} from "lucide-react";
import { api, type Patient } from "../../../lib/api";
import { MedicineRow, type MedicineFormRow } from "../prescription/MedicineRow";
import {
  DIAGNOSIS_SUGGESTIONS, DIETARY_NOTES_OPTIONS,
  PRECAUTION_OPTIONS,
} from "../../../lib/medicineConstants";
import { useAuth } from "../../../context/AuthContext";

// ─── helpers ────────────────────────────────────────────────────────────────

function makeEmptyMed(): MedicineFormRow {
  return {
    id: crypto.randomUUID(),
    medicine_name: "",
    form: "tablet",
    dosage: "",
    duration_days: 5,
    morning: false,
    afternoon: false,
    evening: false,
    night: false,
    before_food: false,
    instructions: "",
  };
}

function ChipSuggest({
  options, onSelect, onDeselect, currentValue = "",
}: {
  options: string[];
  onSelect: (v: string) => void;
  onDeselect: (v: string) => void;
  currentValue?: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {options.map(opt => {
        const selected = currentValue.toLowerCase().includes(opt.toLowerCase());
        return (
          <button
            key={opt}
            type="button"
            onClick={() => selected ? onDeselect(opt) : onSelect(opt)}
            className={`px-2.5 py-1 text-[11px] rounded-full border font-medium transition-colors ${
              selected
                ? "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300"
            }`}
          >
            {selected ? "✓ " : ""}{opt}
          </button>
        );
      })}
    </div>
  );
}

function SectionCard({
  icon, title, accent, children,
}: {
  icon: React.ReactNode; title: string; accent: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className={`px-5 py-3.5 flex items-center gap-2.5 border-b ${accent}`}>
        <span className="opacity-80">{icon}</span>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13 }} className="text-slate-800">
          {title}
        </h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
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
    notes: "",
    dietary_instructions: "",
    precautions: "",
  });
  const [medicines, setMedicines] = useState<MedicineFormRow[]>([makeEmptyMed()]);

  // Save state
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedPrescriptionId, setSavedPrescriptionId] = useState("");

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
            notes:                v.notes || "",
            dietary_instructions: pres.dietary_instructions || "",
            precautions:          pres.precautions || "",
          });
        } else {
          setForm(f => ({ ...f, dietary_instructions: pres.dietary_instructions || "", precautions: pres.precautions || "" }));
        }
        const meds: MedicineFormRow[] = ((pres.prescription_medicines ?? []) as any[]).map((m: any) => ({
          id: crypto.randomUUID(),
          medicine_name: m.medicine_name || "",
          form: "tablet",
          dosage: m.dosage || "",
          duration_days: m.duration_days ?? 5,
          morning: !!m.morning,
          afternoon: !!m.afternoon,
          evening: !!m.evening,
          night: !!m.night,
          before_food: !!m.before_food,
          instructions: m.instructions || "",
        }));
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

  // Medicine handlers
  const addMedicine = () => setMedicines(prev => [...prev, makeEmptyMed()]);
  const updateMedicine = useCallback((idx: number, updated: MedicineFormRow) => {
    setMedicines(prev => prev.map((m, i) => i === idx ? updated : m));
  }, []);
  const removeMedicine = (idx: number) => {
    setMedicines(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  };

  const appendChip = (field: keyof typeof form, val: string) =>
    setForm(prev => ({ ...prev, [field]: prev[field] ? `${prev[field]}, ${val}` : val }));
  const removeChip = (field: keyof typeof form, val: string) =>
    setForm(prev => ({ ...prev, [field]: prev[field].split(",").map(s => s.trim()).filter(s => s.toLowerCase() !== val.toLowerCase()).join(", ") }));

  // ── PRINT ───────────────────────────────────────────────
  function handlePrint() {
    const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const medLines = medicines.filter(m => m.medicine_name.trim()).map((m, i) => {
      const times = [m.morning && "Morning", m.afternoon && "Afternoon", m.evening && "Evening", m.night && "Night"].filter(Boolean).join(" + ");
      return `<div class="medicine"><p><strong>${i+1}. ${m.medicine_name}</strong> — ${m.dosage || ""}</p><p style="color:#555">${times || "—"} | ${m.before_food ? "Before food" : "After food"} | ${m.duration_days} days</p>${m.instructions ? `<p style="color:#777;font-style:italic">${m.instructions}</p>` : ""}</div>`;
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
    const missingTiming = validMeds.find(m => !m.morning && !m.afternoon && !m.evening && !m.night);
    if (missingTiming) newErrors.timing = `Select timing for "${missingTiming.medicine_name}"`;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setSaving(true);

    const medPayload = validMeds.map((m, i) => ({
      medicine_name: m.medicine_name, dosage: m.dosage, duration_days: m.duration_days,
      morning: m.morning, afternoon: m.afternoon, evening: m.evening, night: m.night,
      before_food: m.before_food, instructions: m.instructions, sort_order: i + 1,
    }));

    try {
      if (isEditMode) {
        const result = await api.prescriptions.update(prescriptionId, {
          patient_id: patient?.id || patientId || undefined,
          visit_id: visitId || undefined,
          chief_complaint: form.chief_complaint,
          diagnosis: form.diagnosis,
          notes: form.notes,
          dietary_instructions: form.dietary_instructions,
          precautions: form.precautions,
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
        dietary_instructions: form.dietary_instructions,
        precautions:          form.precautions,
        general_notes:        form.notes,
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
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
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
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Printer size={13} /> Print
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
      <div className="max-w-6xl mx-auto px-6 py-6 flex gap-6">

        {/* LEFT — main form */}
        <div className="flex-1 space-y-5 min-w-0">

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
            <SectionCard icon={<Stethoscope size={16} className="text-blue-600" />} title="Visit Details" accent="bg-blue-50 border-blue-100">
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
                <p className="text-[10px] text-slate-400 mt-1.5 mb-0.5">Quick select:</p>
                <ChipSuggest
                  options={DIAGNOSIS_SUGGESTIONS}
                  currentValue={form.diagnosis}
                  onSelect={v => setForm(f => ({ ...f, diagnosis: f.diagnosis ? `${f.diagnosis}, ${v}` : v }))}
                  onDeselect={v => removeChip("diagnosis", v)}
                />
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
                <p className="text-[10px] text-slate-400 mt-1.5 mb-0.5">Quick select:</p>
                <ChipSuggest options={DIETARY_NOTES_OPTIONS} currentValue={form.dietary_instructions} onSelect={v => appendChip("dietary_instructions", v)} onDeselect={v => removeChip("dietary_instructions", v)} />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Precautions</label>
                <input
                  value={form.precautions}
                  onChange={e => setForm(f => ({ ...f, precautions: e.target.value }))}
                  placeholder="e.g. Complete bed rest for 2 days"
                  className="w-full px-3.5 py-2.5 text-[13px] border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-shadow"
                />
                <p className="text-[10px] text-slate-400 mt-1.5 mb-0.5">Quick select:</p>
                <ChipSuggest options={PRECAUTION_OPTIONS} currentValue={form.precautions} onSelect={v => appendChip("precautions", v)} onDeselect={v => removeChip("precautions", v)} />
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
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Printer size={14} /> Print Prescription
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

        {/* RIGHT — patient info sidebar */}
        <div className="w-72 flex-shrink-0 space-y-4">
          {(patient || linkedPatient) ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-20">
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 px-5 py-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3 text-white text-xl font-bold">
                  {(patient?.name || linkedPatient?.name || "?")[0]}
                </div>
                <div className="text-white font-bold text-[15px] leading-snug">{patient?.name || linkedPatient?.name}</div>
                {patient?.patient_code && (
                  <div className="mt-1 inline-flex items-center gap-1 text-[11px] bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">
                    <Hash size={9} /> {patient.patient_code}
                  </div>
                )}
              </div>
              <div className="px-5 py-4 space-y-3">
                {[
                  { icon: <User size={12} />, label: "Age / Gender", value: [patient?.age || linkedPatient?.age ? `${patient?.age || linkedPatient?.age} yrs` : null, patient?.gender === "M" ? "Male" : patient?.gender === "F" ? "Female" : patient?.gender].filter(Boolean).join(" · ") || "—" },
                  { icon: <Phone size={12} />, label: "Mobile", value: patient?.mobile || linkedPatient?.mobile || "—" },
                  { icon: <Globe size={12} />, label: "Language", value: patient?.language ? patient.language.charAt(0).toUpperCase() + patient.language.slice(1) : "English" },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0 mt-0.5">{icon}</div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{label}</div>
                      <div className="text-[13px] text-slate-700 font-medium mt-0.5">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mx-4 mb-4 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                  <MessageSquare size={11} /> WhatsApp will be sent in{" "}
                  <span className="capitalize">{patient?.language || "english"}</span>
                </div>
              </div>
            </div>
          ) : isWalkin ? (
            <div className="bg-white rounded-2xl border border-amber-200 p-5 sticky top-20">
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
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sticky top-20">
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <User size={20} className="text-slate-400" />
                </div>
                <p className="text-[13px] text-slate-400">Search for a patient above</p>
                <p className="text-[11px] text-slate-300 mt-1">or continue as walk-in</p>
              </div>
            </div>
          )}

          {/* Summary */}
          {formActive && (form.chief_complaint || form.diagnosis) && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-[290px]">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <FileText size={13} className="text-slate-400" />
                <span className="text-[12px] font-bold text-slate-600">Summary</span>
              </div>
              <div className="px-4 py-3 space-y-2">
                {form.chief_complaint && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Complaint</div>
                    <div className="text-[12px] text-slate-700 mt-0.5 line-clamp-2">{form.chief_complaint}</div>
                  </div>
                )}
                {form.diagnosis && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Diagnosis</div>
                    <div className="text-[12px] text-slate-700 mt-0.5 font-medium">{form.diagnosis}</div>
                  </div>
                )}
                {medicines.filter(m => m.medicine_name.trim()).length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Medicines</div>
                    {medicines.filter(m => m.medicine_name.trim()).map(m => (
                      <div key={m.id} className="text-[12px] text-slate-700 mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                        {m.medicine_name}
                        {m.dosage && <span className="text-slate-400 text-[11px]">· {m.dosage}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
