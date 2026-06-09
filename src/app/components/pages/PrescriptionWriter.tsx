import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Printer, MessageSquare, Plus, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { api, type Patient } from "../../../lib/api";
import { MedicineRow, type MedicineFormRow } from "../prescription/MedicineRow";
import {
  DIAGNOSIS_SUGGESTIONS, DIETARY_NOTES_OPTIONS,
  PRECAUTION_OPTIONS,
} from "../../../lib/medicineConstants";
import { useAuth } from "../../../context/AuthContext";

const DOCTOR_ID = "8c33abe0-5d2e-4613-9437-c7c375e8d162";

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

function ChipSuggest({ options, onSelect }: { options: string[]; onSelect: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onSelect(opt)}
          className="px-2.5 py-1 text-[11px] bg-slate-100 text-slate-600 rounded-full hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function PrescriptionWriter() {
  const { doctorId, clinicName, doctorName } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const patientId     = params.get("patient_id") || "";
  const appointmentId = params.get("appointment_id") || "";

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    chief_complaint: "",
    diagnosis: "",
    notes: "",
    dietary_instructions: "",
    precautions: "",
  });
  const [medicines, setMedicines] = useState<MedicineFormRow[]>([makeEmptyMed()]);

  useEffect(() => {
    if (!patientId) { setLoadingPatient(false); return; }
    api.patients.get(patientId).then(p => {
      setPatient(p);
      setLoadingPatient(false);
    }).catch(() => setLoadingPatient(false));
  }, [patientId]);

  const addMedicine = () => setMedicines(prev => [...prev, makeEmptyMed()]);
  const updateMedicine = useCallback((idx: number, updated: MedicineFormRow) => {
    setMedicines(prev => prev.map((m, i) => i === idx ? updated : m));
  }, []);
  const removeMedicine = (idx: number) => {
    setMedicines(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  };

  const appendChip = (field: keyof typeof form, val: string) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field] ? `${prev[field]}, ${val}` : val,
    }));
  };

  // ── PRINT ──────────────────────────────────────────────
  function handlePrint() {
    const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const medLines = medicines.filter(m => m.medicine_name.trim()).map((m, i) => {
      const times = [m.morning && "Morning", m.afternoon && "Afternoon", m.evening && "Evening", m.night && "Night"]
        .filter(Boolean).join(" + ");
      const food = m.before_food ? "Before food" : "After food";
      return `
        <div class="medicine" style="margin:8px 0;padding:6px 0;border-bottom:1px dashed #eee">
          <p><strong>${i+1}. ${m.medicine_name}</strong> — ${m.dosage || ""}</p>
          <p style="color:#555">${times || "—"} | ${food} | ${m.duration_days} days</p>
          ${m.instructions ? `<p style="color:#777;font-style:italic">${m.instructions}</p>` : ""}
        </div>`;
    }).join("");

    const html = `<html><head><title>Prescription</title>
      <style>
        body{font-family:serif;padding:24px;max-width:420px;font-size:13px}
        h2{font-size:15px;margin:0 0 2px}
        p{margin:3px 0}
        .divider{border-top:1px solid #000;margin:10px 0}
        .footer{margin-top:24px;text-align:right}
        @media print{body{padding:0}}
      </style></head><body>
      <h2>${clinicName}</h2>
      <p>${doctorName} · Paediatrics</p>
      <div class="divider"></div>
      <p><strong>Patient:</strong> ${patient?.name || ""} &nbsp;&nbsp; <strong>Date:</strong> ${today}</p>
      <p><strong>Code:</strong> ${patient?.patient_code || "—"} &nbsp;&nbsp; <strong>Age:</strong> ${patient?.age || "—"} yrs</p>
      <div class="divider"></div>
      <p><strong>Complaint:</strong> ${form.chief_complaint}</p>
      <p><strong>Diagnosis:</strong> ${form.diagnosis}</p>
      <div class="divider"></div>
      <p><strong>Rx</strong></p>
      ${medLines}
      <div class="divider"></div>
      ${form.dietary_instructions ? `<p><strong>Diet:</strong> ${form.dietary_instructions}</p>` : ""}
      ${form.precautions ? `<p><strong>Precautions:</strong> ${form.precautions}</p>` : ""}
      ${form.notes ? `<p><strong>Notes:</strong> ${form.notes}</p>` : ""}
      <div class="divider"></div>
      <p>Follow up in 3 days if not improving.</p>
      <div class="footer"><p>${doctorName}</p><p style="color:#999">(Signature)</p></div>
    </body></html>`;

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.print();
  }

  // ── SAVE ───────────────────────────────────────────────
  async function handleSave() {
    const newErrors: Record<string, string> = {};
    if (!form.chief_complaint.trim()) newErrors.chief_complaint = "Chief complaint is required";
    if (!form.diagnosis.trim()) newErrors.diagnosis = "Diagnosis is required";
    const validMeds = medicines.filter(m => m.medicine_name.trim());
    if (validMeds.length === 0) newErrors.medicines = "Add at least one medicine";
    const missingTiming = validMeds.find(m => !m.morning && !m.afternoon && !m.evening && !m.night);
    if (missingTiming) newErrors.timing = `Select timing for "${missingTiming.medicine_name}"`;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setSaving(true);

    try {
      const result = await api.prescriptions.write({
        patient_id:           patientId,
        doctor_id:            doctorId,
        appointment_id:       appointmentId || undefined,
        chief_complaint:      form.chief_complaint,
        diagnosis:            form.diagnosis,
        notes:                form.notes,
        dietary_instructions: form.dietary_instructions,
        precautions:          form.precautions,
        medicines: validMeds.map((m, i) => ({
          medicine_name: m.medicine_name,
          dosage:        m.dosage,
          duration_days: m.duration_days,
          morning:       m.morning,
          afternoon:     m.afternoon,
          evening:       m.evening,
          night:         m.night,
          before_food:   m.before_food,
          instructions:  m.instructions,
          sort_order:    i + 1,
        })),
      });

      // Increment usage for DB-linked medicines
      for (const m of medicines) {
        if (m.medicine_id) api.medicines.incrementUsage(m.medicine_id).catch(() => {});
      }

      setSuccessMsg(`✅ Prescription saved! ${result.whatsapp_sent ? "WhatsApp sent." : ""}`);
      setTimeout(() => { window.location.href = "/"; }, 2200);

    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save prescription");
    } finally {
      setSaving(false);
    }
  }

  if (loadingPatient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-4 shadow-sm">
        <button onClick={() => window.history.back()} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-[13px]">
          <ArrowLeft size={15} /> Back
        </button>
        <div className="flex-1">
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800">
            New Prescription
            {patient && (
              <span className="font-normal text-slate-500 ml-2">
                — {patient.name}
                {patient.patient_code && ` (${patient.patient_code})`}
                {patient.age && ` · ${patient.age} yrs`}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400">{today}</div>
        </div>
        {successMsg && (
          <div className="flex items-center gap-1.5 text-emerald-600 text-[13px] font-medium">
            <CheckCircle size={15} /> {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-1.5 text-red-500 text-[13px]">
            <AlertCircle size={15} /> {errorMsg}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-6 py-6 flex gap-6">

        {/* LEFT — main form */}
        <div className="flex-1 space-y-5">

          {/* Visit Details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-[13px] font-bold text-slate-700">Visit Details</h3>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Chief Complaint <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={2}
                value={form.chief_complaint}
                onChange={e => setForm(f => ({ ...f, chief_complaint: e.target.value }))}
                placeholder="Patient's main complaint..."
                className={`w-full px-3 py-2.5 text-[13px] border rounded-xl text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none ${errors.chief_complaint ? "border-red-300" : "border-slate-200"}`}
              />
              {errors.chief_complaint && <p className="text-[11px] text-red-500 mt-1">{errors.chief_complaint}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Diagnosis <span className="text-red-400">*</span>
              </label>
              <input
                value={form.diagnosis}
                onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
                placeholder="Primary diagnosis"
                className={`w-full px-3 py-2.5 text-[13px] border rounded-xl text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-300 ${errors.diagnosis ? "border-red-300" : "border-slate-200"}`}
              />
              {errors.diagnosis && <p className="text-[11px] text-red-500 mt-1">{errors.diagnosis}</p>}
              <ChipSuggest
                options={DIAGNOSIS_SUGGESTIONS}
                onSelect={v => setForm(f => ({ ...f, diagnosis: f.diagnosis ? `${f.diagnosis}, ${v}` : v }))}
              />
            </div>
          </div>

          {/* Dietary & Precautions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-[13px] font-bold text-slate-700">Dietary & Precautions</h3>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Dietary Instructions</label>
              <input
                value={form.dietary_instructions}
                onChange={e => setForm(f => ({ ...f, dietary_instructions: e.target.value }))}
                placeholder="e.g. Avoid oily and spicy food"
                className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
              <ChipSuggest options={DIETARY_NOTES_OPTIONS} onSelect={v => appendChip("dietary_instructions", v)} />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Precautions</label>
              <input
                value={form.precautions}
                onChange={e => setForm(f => ({ ...f, precautions: e.target.value }))}
                placeholder="e.g. Complete bed rest for 2 days"
                className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
              <ChipSuggest options={PRECAUTION_OPTIONS} onSelect={v => appendChip("precautions", v)} />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Additional Notes</label>
              <input
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any additional notes..."
                className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
          </div>

          {/* Medicines */}
          <div className="space-y-3">
            <h3 className="text-[13px] font-bold text-slate-700 px-1">Medicines</h3>
            {errors.medicines && <p className="text-[12px] text-red-500 px-1">{errors.medicines}</p>}
            {errors.timing   && <p className="text-[12px] text-red-500 px-1">{errors.timing}</p>}

            {medicines.map((med, idx) => (
              <MedicineRow
                key={med.id}
                index={idx}
                medicine={med}
                onChange={updated => updateMedicine(idx, updated)}
                onRemove={() => removeMedicine(idx)}
              />
            ))}

            <button
              type="button"
              onClick={addMedicine}
              className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-[13px] text-slate-400 hover:border-emerald-300 hover:text-emerald-500 hover:bg-emerald-50/50 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={15} /> Add Another Medicine
            </button>
          </div>

          {/* Action bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Printer size={14} /> Print
            </button>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="ml-auto flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl shadow-sm shadow-emerald-200 transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
              {saving ? "Saving…" : "Save & Send WhatsApp"}
            </button>
          </div>
        </div>

        {/* RIGHT — patient info panel */}
        <div className="w-72 flex-shrink-0">
          {patient && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sticky top-20 space-y-4">
              <h3 className="text-[13px] font-bold text-slate-700">Patient Info</h3>
              <div className="space-y-2.5">
                {[
                  ["Name", patient.name],
                  ["Code", patient.patient_code || "—"],
                  ["Age", patient.age ? `${patient.age} yrs` : "—"],
                  ["Gender", patient.gender || "—"],
                  ["Mobile", patient.mobile],
                  ["Language", patient.language || "English"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start gap-2">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 w-16 pt-0.5 flex-shrink-0">{label}</span>
                    <span className="text-[13px] text-slate-700 font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!patient && !loadingPatient && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-[13px] text-slate-400">No patient linked. Pass patient_id in URL.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
