import { useState, useEffect, useCallback } from "react";
import {
  Thermometer, Ruler, Activity, Heart, Wind, FileText,
  Edit2, Check, X,
} from "lucide-react";
import { api, type VisitVitals } from "../../../lib/api";

interface VitalsSectionProps {
  visitId: string;
  patientId: string;       // reserved for vitals-history view later
  editable?: boolean;      // false = read-only (future role-based access)
  onVitalsSaved?: (vitals: VisitVitals) => void;
}

export function VitalsSection({
  visitId,
  editable = true,
  onVitalsSaved,
}: VitalsSectionProps) {
  const [vitals, setVitals] = useState<VisitVitals>({});
  const [isEditing, setIsEditing] = useState(false);
  const [hasExistingVitals, setHasExistingVitals] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editBuffer, setEditBuffer] = useState<VisitVitals>({});

  const fetchVitals = useCallback(async () => {
    try {
      const data = await api.visits.getVitals(visitId);
      if (data.vitals) {
        setVitals(data.vitals);
        setHasExistingVitals(true);
        setIsEditing(false);
      } else {
        setHasExistingVitals(false);
        setIsEditing(true); // auto-open for editing when empty
      }
    } catch (err) {
      console.error("Failed to fetch vitals", err);
      setIsEditing(true);
    }
  }, [visitId]);

  useEffect(() => {
    if (visitId) fetchVitals();
  }, [visitId, fetchVitals]);

  const handleEdit = () => {
    setEditBuffer({ ...vitals });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditBuffer({});
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = hasExistingVitals ? { ...vitals, ...editBuffer } : editBuffer;
      const data = await api.visits.saveVitals(visitId, {
        ...payload,
        recorded_by_role: "doctor",
      });
      if (data.success) {
        setVitals(data.vitals || payload);
        setHasExistingVitals(true);
        setIsEditing(false);
        setEditBuffer({});
        onVitalsSaved?.(data.vitals || payload);
      }
    } catch (err) {
      console.error("Failed to save vitals", err);
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof VisitVitals, value: string) => {
    setEditBuffer(prev => ({ ...prev, [field]: value }));
  };

  const currentData = isEditing ? { ...vitals, ...editBuffer } : vitals;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border-b border-blue-100">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-blue-800 text-sm">Vitals & Examination</span>
          <span className="text-xs text-blue-500 font-normal">(optional)</span>
        </div>

        {hasExistingVitals && !isEditing && editable && (
          <button
            onClick={handleEdit}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            <Edit2 className="w-3 h-3" /> Edit
          </button>
        )}

        {isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1 text-xs text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded-lg font-medium disabled:opacity-50"
            >
              <Check className="w-3 h-3" /> {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      {/* Vitals grid */}
      <div className="p-4">
        {/* Row 1: Temp, Weight, Height */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <VitalField
            icon={<Thermometer className="w-3.5 h-3.5 text-red-500" />}
            label="Temperature"
            value={currentData.temperature_f}
            unit="°F"
            placeholder="98.6"
            field="temperature_f"
            isEditing={isEditing}
            onChange={updateField}
            inputType="decimal"
            alertAbove={100.4}
          />
          <VitalField
            icon={<span className="text-sm">⚖️</span>}
            label="Weight"
            value={currentData.weight_kg}
            unit="kg"
            placeholder="60"
            field="weight_kg"
            isEditing={isEditing}
            onChange={updateField}
            inputType="decimal"
          />
          <VitalField
            icon={<Ruler className="w-3.5 h-3.5 text-green-500" />}
            label="Height"
            value={currentData.height_cm}
            unit="cm"
            placeholder="170"
            field="height_cm"
            isEditing={isEditing}
            onChange={updateField}
            inputType="decimal"
          />
        </div>

        {/* Row 2: SpO2, BP, Pulse */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <VitalField
            icon={<Wind className="w-3.5 h-3.5 text-blue-500" />}
            label="SpO2"
            value={currentData.spo2_percent}
            unit="%"
            placeholder="98"
            field="spo2_percent"
            isEditing={isEditing}
            onChange={updateField}
            inputType="integer"
            alertBelow={94}
          />

          {/* BP — two fields */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1 mb-1">
              <Heart className="w-3.5 h-3.5 text-pink-500" />
              <span className="text-xs text-gray-500 font-medium">Blood Pressure</span>
            </div>
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  placeholder="120"
                  value={currentData.bp_systolic ?? ""}
                  onChange={e => updateField("bp_systolic", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:border-blue-400 focus:outline-none"
                />
                <span className="text-gray-400 text-xs">/</span>
                <input
                  type="number"
                  placeholder="80"
                  value={currentData.bp_diastolic ?? ""}
                  onChange={e => updateField("bp_diastolic", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:border-blue-400 focus:outline-none"
                />
                <span className="text-xs text-gray-400">mmHg</span>
              </div>
            ) : (
              <div className="text-sm font-semibold text-gray-800">
                {currentData.bp_systolic && currentData.bp_diastolic
                  ? `${currentData.bp_systolic}/${currentData.bp_diastolic}`
                  : <span className="text-gray-300 font-normal">—</span>}
                {currentData.bp_systolic && currentData.bp_diastolic && (
                  <span className="text-xs text-gray-400 font-normal ml-1">mmHg</span>
                )}
              </div>
            )}
          </div>

          <VitalField
            icon={<Activity className="w-3.5 h-3.5 text-orange-500" />}
            label="Pulse"
            value={currentData.pulse_bpm}
            unit="bpm"
            placeholder="72"
            field="pulse_bpm"
            isEditing={isEditing}
            onChange={updateField}
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
          {isEditing ? (
            <textarea
              placeholder="e.g. Hb: 9.2, WBC: 11000, Platelets: 1.8L, X-ray: clear"
              value={currentData.key_findings ?? ""}
              onChange={e => updateField("key_findings", e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:border-blue-400 focus:outline-none placeholder:text-gray-300"
            />
          ) : (
            <div className="text-sm text-gray-700 min-h-[36px]">
              {currentData.key_findings || <span className="text-gray-300">—</span>}
            </div>
          )}
        </div>

        {/* Recorded-by indicator */}
        {hasExistingVitals && !isEditing && vitals.recorded_at && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Recorded by {vitals.recorded_by_role || "doctor"} ·{" "}
              {new Date(vitals.recorded_at).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
          </div>
        )}
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
  isEditing: boolean;
  onChange: (field: keyof VisitVitals, value: string) => void;
  inputType: "decimal" | "integer";
  alertAbove?: number;
  alertBelow?: number;
}

function VitalField({
  icon, label, value, unit, placeholder,
  field, isEditing, onChange, inputType,
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
      </div>

      {isEditing ? (
        <div className="flex items-center gap-1">
          <input
            type="number"
            step={inputType === "decimal" ? "0.1" : "1"}
            placeholder={placeholder}
            value={value ?? ""}
            onChange={e => onChange(field, e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:border-blue-400 focus:outline-none"
          />
          <span className="text-xs text-gray-400 whitespace-nowrap">{unit}</span>
        </div>
      ) : (
        <div className={`text-sm font-semibold ${isAlert ? "text-red-600" : "text-gray-800"}`}>
          {value !== null && value !== undefined && value !== "" ? (
            <>
              {value}
              <span className="text-xs text-gray-400 font-normal ml-1">{unit}</span>
              {isAlert && <span className="ml-1 text-xs text-red-500">⚠️</span>}
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
