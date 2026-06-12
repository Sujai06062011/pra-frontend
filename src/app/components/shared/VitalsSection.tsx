import { Thermometer, Ruler, Activity, Heart, Wind, FileText } from "lucide-react";
import type { VisitVitals } from "../../../lib/api";

// Always-editable inline vitals grid. No internal fetch/save — the parent
// (prescription writer) owns the state, loads existing vitals for the visit
// and saves them together with the prescription. `editable=false` renders a
// read-only view (future role-based access).
interface VitalsSectionProps {
  vitals: VisitVitals;
  onChange: (field: keyof VisitVitals, value: string) => void;
  editable?: boolean;
}

export function VitalsSection({ vitals, onChange, editable = true }: VitalsSectionProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border-b border-blue-100">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-blue-800 text-sm">Vitals & Examination</span>
          <span className="text-xs text-blue-500 font-normal">(optional — saved with prescription)</span>
        </div>
        {vitals.recorded_at && (
          <span className="text-xs text-blue-400">
            Recorded by {vitals.recorded_by_role || "doctor"} ·{" "}
            {new Date(vitals.recorded_at).toLocaleTimeString("en-IN", {
              hour: "2-digit", minute: "2-digit", hour12: true,
            })}
          </span>
        )}
      </div>

      <div className="p-4">
        {/* Row 1: Temp, Weight, Height */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <VitalField
            icon={<Thermometer className="w-3.5 h-3.5 text-red-500" />}
            label="Temperature"
            value={vitals.temperature_f}
            unit="°F"
            placeholder="98.6"
            field="temperature_f"
            editable={editable}
            onChange={onChange}
            inputType="decimal"
            alertAbove={100.4}
          />
          <VitalField
            icon={<span className="text-sm">⚖️</span>}
            label="Weight"
            value={vitals.weight_kg}
            unit="kg"
            placeholder="60"
            field="weight_kg"
            editable={editable}
            onChange={onChange}
            inputType="decimal"
          />
          <VitalField
            icon={<Ruler className="w-3.5 h-3.5 text-green-500" />}
            label="Height"
            value={vitals.height_cm}
            unit="cm"
            placeholder="170"
            field="height_cm"
            editable={editable}
            onChange={onChange}
            inputType="decimal"
          />
        </div>

        {/* Row 2: SpO2, BP, Pulse */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <VitalField
            icon={<Wind className="w-3.5 h-3.5 text-blue-500" />}
            label="SpO2"
            value={vitals.spo2_percent}
            unit="%"
            placeholder="98"
            field="spo2_percent"
            editable={editable}
            onChange={onChange}
            inputType="integer"
            alertBelow={94}
          />

          {/* BP — two fields */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1 mb-1">
              <Heart className="w-3.5 h-3.5 text-pink-500" />
              <span className="text-xs text-gray-500 font-medium">Blood Pressure</span>
            </div>
            {editable ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  placeholder="120"
                  value={vitals.bp_systolic ?? ""}
                  onChange={e => onChange("bp_systolic", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:border-blue-400 focus:outline-none"
                />
                <span className="text-gray-400 text-xs">/</span>
                <input
                  type="number"
                  placeholder="80"
                  value={vitals.bp_diastolic ?? ""}
                  onChange={e => onChange("bp_diastolic", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:border-blue-400 focus:outline-none"
                />
                <span className="text-xs text-gray-400">mmHg</span>
              </div>
            ) : (
              <div className="text-sm font-semibold text-gray-800">
                {vitals.bp_systolic && vitals.bp_diastolic
                  ? `${vitals.bp_systolic}/${vitals.bp_diastolic}`
                  : <span className="text-gray-300 font-normal">—</span>}
                {vitals.bp_systolic && vitals.bp_diastolic && (
                  <span className="text-xs text-gray-400 font-normal ml-1">mmHg</span>
                )}
              </div>
            )}
          </div>

          <VitalField
            icon={<Activity className="w-3.5 h-3.5 text-orange-500" />}
            label="Pulse"
            value={vitals.pulse_bpm}
            unit="bpm"
            placeholder="72"
            field="pulse_bpm"
            editable={editable}
            onChange={onChange}
            inputType="integer"
          />
        </div>

        {/* Key findings */}
        <div>
          <div className="flex items-center gap-1 mb-1">
            <FileText className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-xs text-gray-500 font-medium">Key Findings from Report</span>
            <span className="text-xs text-gray-400">(optional)</span>
          </div>
          {editable ? (
            <textarea
              placeholder="e.g. Hb: 9.2, WBC: 11000, Platelets: 1.8L, X-ray: clear"
              value={vitals.key_findings ?? ""}
              onChange={e => onChange("key_findings", e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:border-blue-400 focus:outline-none placeholder:text-gray-300"
            />
          ) : (
            <div className="text-sm text-gray-700 min-h-[36px]">
              {vitals.key_findings || <span className="text-gray-300">—</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── VitalField sub-component ───────────────────

interface VitalFieldProps {
  icon: React.ReactNode;
  label: string;
  value?: number | string | null;
  unit: string;
  placeholder: string;
  field: keyof VisitVitals;
  editable: boolean;
  onChange: (field: keyof VisitVitals, value: string) => void;
  inputType: "decimal" | "integer";
  alertAbove?: number;
  alertBelow?: number;
}

function VitalField({
  icon, label, value, unit, placeholder,
  field, editable, onChange, inputType,
  alertAbove, alertBelow,
}: VitalFieldProps) {
  const numValue = value !== null && value !== undefined && value !== ""
    ? parseFloat(String(value))
    : null;

  const isAlert = numValue !== null && !Number.isNaN(numValue) && (
    (alertAbove !== undefined && numValue > alertAbove) ||
    (alertBelow !== undefined && numValue < alertBelow)
  );

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1 mb-1">
        {icon}
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        {isAlert && <span className="text-xs text-red-500">⚠️</span>}
      </div>

      {editable ? (
        <div className="flex items-center gap-1">
          <input
            type="number"
            step={inputType === "decimal" ? "0.1" : "1"}
            placeholder={placeholder}
            value={value ?? ""}
            onChange={e => onChange(field, e.target.value)}
            className={`w-full border rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none ${
              isAlert
                ? "border-red-300 text-red-600 font-semibold focus:border-red-400"
                : "border-gray-200 focus:border-blue-400"
            }`}
          />
          <span className="text-xs text-gray-400 whitespace-nowrap">{unit}</span>
        </div>
      ) : (
        <div className={`text-sm font-semibold ${isAlert ? "text-red-600" : "text-gray-800"}`}>
          {value !== null && value !== undefined && value !== "" ? (
            <>
              {value}
              <span className="text-xs text-gray-400 font-normal ml-1">{unit}</span>
            </>
          ) : (
            <span className="text-gray-300 font-normal">—</span>
          )}
        </div>
      )}
    </div>
  );
}

export default VitalsSection;
