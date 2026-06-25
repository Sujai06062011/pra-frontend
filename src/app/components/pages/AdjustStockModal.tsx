import { useState } from "react";
import { X } from "lucide-react";
import { api, type ClinicMedicine, type MedicineStockBatch } from "../../../lib/api";

const REASONS = [
  { value: "counting_error", label: "Counting error" },
  { value: "damaged",        label: "Damaged / broken tablets" },
  { value: "theft_loss",     label: "Theft / loss" },
  { value: "other",          label: "Other" },
];

const REASON_LABELS: Record<string, string> = {
  counting_error: "Counting error",
  damaged:        "Damaged / broken tablets",
  theft_loss:     "Theft / loss",
};

interface Props {
  batch: MedicineStockBatch;
  medicine: ClinicMedicine;
  onClose: () => void;
  onSaved: () => void;
}

export function AdjustStockModal({ batch, medicine, onClose, onSaved }: Props) {
  const dispenseUnit = medicine.dispense_unit ?? "tablet";

  const [adjustedQuantity, setAdjustedQuantity] = useState(batch.tablets_remaining.toString());
  const [selectedReason, setSelectedReason]     = useState("");
  const [otherReason, setOtherReason]           = useState("");
  const [isSaving, setIsSaving]                 = useState(false);
  const [error, setError]                       = useState("");

  const parsedQty = adjustedQuantity !== "" ? parseInt(adjustedQuantity) : null;
  const diff = parsedQty !== null ? parsedQty - batch.tablets_remaining : null;
  const noChange = parsedQty === batch.tablets_remaining;

  const canSave =
    !isSaving &&
    adjustedQuantity !== "" &&
    parsedQty !== null &&
    parsedQty >= 0 &&
    !noChange &&
    !!selectedReason &&
    (selectedReason !== "other" || !!otherReason.trim());

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    setError("");
    try {
      const reason = selectedReason === "other" ? otherReason.trim() : REASON_LABELS[selectedReason];
      await api.medicines.adjustBatch(batch.id, {
        adjusted_quantity: parsedQty!,
        reason,
        notes: "",
      });
      onSaved();
    } catch (e: any) {
      setError(e.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800">
              Adjust Stock
            </h3>
            <p className="text-[12px] text-slate-400 mt-0.5">{medicine.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500"><X size={18} /></button>
        </div>

        {/* Current quantity */}
        <div className="bg-slate-50 rounded-xl p-4 mb-4">
          <p className="text-[12px] text-slate-500 mb-1">Current remaining</p>
          <p className="text-[28px] font-bold text-slate-800 leading-none">
            {batch.tablets_remaining}
            <span className="text-[13px] font-normal text-slate-500 ml-1">{dispenseUnit}s</span>
          </p>
          {batch.batch_number && (
            <p className="text-[11px] text-slate-400 mt-1">Batch: {batch.batch_number}</p>
          )}
        </div>

        {/* Adjusted quantity */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Correct Quantity *
          </label>
          <p className="text-[11px] text-slate-400 mb-2">Enter the actual quantity you have right now</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              value={adjustedQuantity}
              onChange={e => setAdjustedQuantity(e.target.value)}
              className="w-28 border border-slate-200 rounded-lg px-3 py-2 text-[18px] font-semibold text-center focus:border-orange-400 focus:outline-none"
            />
            <span className="text-[13px] text-slate-500">{dispenseUnit}s</span>
          </div>

          {diff !== null && !noChange && (
            <p className={`mt-2 text-[13px] font-medium ${diff < 0 ? "text-red-600" : "text-emerald-600"}`}>
              {diff < 0
                ? `▼ ${Math.abs(diff)} ${dispenseUnit}s will be removed`
                : `▲ ${diff} ${dispenseUnit}s will be added`}
            </p>
          )}
        </div>

        {/* Reason */}
        <div className="mb-5">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Reason *
          </label>
          <div className="space-y-2">
            {REASONS.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="adjust-reason"
                  value={opt.value}
                  checked={selectedReason === opt.value}
                  onChange={() => setSelectedReason(opt.value)}
                  className="accent-orange-500"
                />
                <span className="text-[13px] text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
          {selectedReason === "other" && (
            <input
              type="text"
              placeholder="Please specify..."
              value={otherReason}
              onChange={e => setOtherReason(e.target.value)}
              className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-[13px] focus:border-orange-400 focus:outline-none"
            />
          )}
        </div>

        {error && <p className="text-[12px] text-red-500 mb-3">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!canSave}
            className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-[13px] font-semibold">
            {isSaving ? "Saving…" : "Save Adjustment"}
          </button>
        </div>
      </div>
    </div>
  );
}
