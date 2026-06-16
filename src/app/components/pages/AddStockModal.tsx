import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { api, type ClinicMedicine } from "../../../lib/api";

const MONTHS = [
  { value: "01", label: "January" }, { value: "02", label: "February" },
  { value: "03", label: "March" }, { value: "04", label: "April" },
  { value: "05", label: "May" }, { value: "06", label: "June" },
  { value: "07", label: "July" }, { value: "08", label: "August" },
  { value: "09", label: "September" }, { value: "10", label: "October" },
  { value: "11", label: "November" }, { value: "12", label: "December" },
];

function getYears() {
  const now = new Date().getFullYear();
  return Array.from({ length: 8 }, (_, i) => now + i);
}

interface Props {
  medicine: ClinicMedicine;
  onClose: () => void;
  onSaved: () => void;
}

export function AddStockModal({ medicine, onClose, onSaved }: Props) {
  const tabletsPerStrip = medicine.tablets_per_strip ?? 10;
  const purchaseUnit = medicine.purchase_unit ?? "strip";
  const dispenseUnit = medicine.dispense_unit ?? "tablet";

  const today = new Date().toISOString().slice(0, 10);

  const [batchNumber, setBatchNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [stripsReceived, setStripsReceived] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [dateReceived, setDateReceived] = useState(today);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const tabletsCalculated = stripsReceived ? parseInt(stripsReceived) * tabletsPerStrip : null;

  const expiryDate = expiryYear && expiryMonth ? `${expiryYear}-${expiryMonth}-01` : null;
  const daysUntilExpiry = expiryDate
    ? Math.floor((new Date(expiryDate).getTime() - Date.now()) / 86400000)
    : null;

  const canSave = !!expiryMonth && !!expiryYear && !!stripsReceived && parseInt(stripsReceived) > 0;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      await api.medicines.addStock(medicine.id, {
        batch_number: batchNumber || undefined,
        expiry_date: expiryDate!,
        strips_received: parseInt(stripsReceived),
        purchase_price_per_strip: purchasePrice ? parseFloat(purchasePrice) : undefined,
        supplier_name: supplierName || undefined,
        invoice_number: invoiceNumber || undefined,
        date_received: dateReceived,
      });
      onSaved();
    } catch (e: any) {
      setError(e.message || "Failed to save stock");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800">
              Add Stock
            </h3>
            <p className="text-[12px] text-slate-400 mt-0.5">{medicine.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500"><X size={18} /></button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Batch Number</label>
            <input
              value={batchNumber}
              onChange={e => setBatchNumber(e.target.value)}
              placeholder="e.g. CP2024A123"
              className="w-full px-3 py-2.5 text-[13px] border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Expiry Date *</label>
            <div className="flex gap-2">
              <select
                value={expiryMonth}
                onChange={e => setExpiryMonth(e.target.value)}
                className="flex-1 px-3 py-2 text-[13px] border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                <option value="">Month</option>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select
                value={expiryYear}
                onChange={e => setExpiryYear(e.target.value)}
                className="flex-1 px-3 py-2 text-[13px] border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                <option value="">Year</option>
                {getYears().map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              {purchaseUnit.charAt(0).toUpperCase() + purchaseUnit.slice(1)}s Received *
            </label>
            <input
              type="number"
              min="1"
              value={stripsReceived}
              onChange={e => setStripsReceived(e.target.value)}
              placeholder="e.g. 50"
              className="w-full px-3 py-2.5 text-[13px] border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Total {dispenseUnit.charAt(0).toUpperCase() + dispenseUnit.slice(1)}s
              <span className="text-[10px] text-slate-400 ml-1 normal-case font-normal">(auto-calculated)</span>
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-700">
              {tabletsCalculated !== null ? tabletsCalculated : "—"}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{tabletsPerStrip} {dispenseUnit}s per {purchaseUnit}</p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Price per {purchaseUnit} (₹)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={purchasePrice}
              onChange={e => setPurchasePrice(e.target.value)}
              className="w-full px-3 py-2.5 text-[13px] border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Date Received</label>
            <input
              type="date"
              value={dateReceived}
              onChange={e => setDateReceived(e.target.value)}
              className="w-full px-3 py-2.5 text-[13px] border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Supplier Name</label>
            <input
              value={supplierName}
              onChange={e => setSupplierName(e.target.value)}
              placeholder="e.g. ABC Pharma"
              className="w-full px-3 py-2.5 text-[13px] border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Invoice Number</label>
            <input
              value={invoiceNumber}
              onChange={e => setInvoiceNumber(e.target.value)}
              placeholder="e.g. INV-2024-0892"
              className="w-full px-3 py-2.5 text-[13px] border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>
        </div>

        {expiryDate && daysUntilExpiry !== null && daysUntilExpiry < 90 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-[13px] text-yellow-700">
            ⚠️ This batch expires in {daysUntilExpiry} days. Are you sure you want to add this stock?
          </div>
        )}

        {error && <p className="mt-3 text-[12px] text-red-500">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Add to Stock"}
          </button>
        </div>
      </div>
    </div>
  );
}
