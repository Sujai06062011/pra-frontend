import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { api, type ClinicMedicine, type MedicineStockBatch } from "../../../lib/api";

const MONTHS = [
  { value: "01", label: "January" }, { value: "02", label: "February" },
  { value: "03", label: "March" },   { value: "04", label: "April" },
  { value: "05", label: "May" },     { value: "06", label: "June" },
  { value: "07", label: "July" },    { value: "08", label: "August" },
  { value: "09", label: "September" },{ value: "10", label: "October" },
  { value: "11", label: "November" },{ value: "12", label: "December" },
];

function getYears() {
  const now = new Date().getFullYear();
  return Array.from({ length: 8 }, (_, i) => now + i);
}

function parseExpiry(expiryDate: string) {
  const parts = expiryDate?.split("-") ?? [];
  return { year: parts[0] ?? "", month: parts[1] ?? "" };
}

interface Props {
  batch: MedicineStockBatch;
  medicine: ClinicMedicine;
  stripsEditable: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EditBatchModal({ batch, medicine, stripsEditable, onClose, onSaved }: Props) {
  const tabletsPerStrip = medicine.tablets_per_strip ?? 10;
  const purchaseUnit = medicine.purchase_unit ?? "strip";
  const dispenseUnit = medicine.dispense_unit ?? "tablet";

  const { year: initYear, month: initMonth } = parseExpiry(batch.expiry_date);

  const [batchNumber, setBatchNumber]             = useState(batch.batch_number ?? "");
  const [expiryMonth, setExpiryMonth]             = useState(initMonth);
  const [expiryYear, setExpiryYear]               = useState(initYear);
  const [stripsReceived, setStripsReceived]       = useState(batch.strips_received?.toString() ?? "");
  const [purchasePrice, setPurchasePrice]         = useState(batch.purchase_price_per_strip?.toString() ?? "");
  const [supplierName, setSupplierName]           = useState(batch.supplier_name ?? "");
  const [invoiceNumber, setInvoiceNumber]         = useState(batch.invoice_number ?? "");
  const [dateReceived, setDateReceived]           = useState(batch.date_received ?? "");
  const [isSaving, setIsSaving]                   = useState(false);
  const [error, setError]                         = useState("");

  const tabletsCalc = stripsReceived && stripsEditable
    ? parseInt(stripsReceived) * tabletsPerStrip
    : null;

  async function handleSave() {
    if (!expiryMonth || !expiryYear) { setError("Expiry date is required"); return; }
    setIsSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        batch_number: batchNumber || undefined,
        expiry_date: `${expiryYear}-${expiryMonth}-01`,
        purchase_price_per_strip: purchasePrice ? parseFloat(purchasePrice) : undefined,
        supplier_name: supplierName || undefined,
        invoice_number: invoiceNumber || undefined,
        date_received: dateReceived || undefined,
      };
      if (stripsEditable && stripsReceived) {
        body.strips_received = parseInt(stripsReceived);
      }
      await api.medicines.editBatch(batch.id, body as Parameters<typeof api.medicines.editBatch>[1]);
      onSaved();
    } catch (e: any) {
      setError(e.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  const inputCls = "w-full px-3 py-2.5 text-[13px] border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300";
  const labelCls = "block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800">
              Edit Stock Batch
            </h3>
            <p className="text-[12px] text-slate-400 mt-0.5">{medicine.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          {/* Batch number */}
          <div>
            <label className={labelCls}>Batch Number</label>
            <input value={batchNumber} onChange={e => setBatchNumber(e.target.value)}
              placeholder="e.g. CP2024A123" className={inputCls} />
          </div>

          {/* Expiry date */}
          <div>
            <label className={labelCls}>Expiry Date *</label>
            <div className="flex gap-2">
              <select value={expiryMonth} onChange={e => setExpiryMonth(e.target.value)}
                className="flex-1 px-3 py-2 text-[13px] border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
                <option value="">Month</option>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select value={expiryYear} onChange={e => setExpiryYear(e.target.value)}
                className="flex-1 px-3 py-2 text-[13px] border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
                <option value="">Year</option>
                {getYears().map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* Strips received */}
          <div>
            <label className={labelCls}>
              {purchaseUnit.charAt(0).toUpperCase() + purchaseUnit.slice(1)}s Received
              {!stripsEditable && <span className="ml-2 text-[10px] text-slate-400 font-normal normal-case">(locked)</span>}
            </label>
            {stripsEditable ? (
              <>
                <input type="number" min="1" value={stripsReceived}
                  onChange={e => setStripsReceived(e.target.value)} className={inputCls} />
                {tabletsCalc !== null && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    = {tabletsCalc} {dispenseUnit}s total
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] text-slate-500">
                  {batch.strips_received} {purchaseUnit}s
                </div>
                <p className="text-[11px] text-amber-600 mt-1">
                  ⚠️ Quantity locked — stock has already been dispensed from this batch. Use <strong>Adjust Stock</strong> to correct the remaining quantity.
                </p>
              </>
            )}
          </div>

          {/* Purchase price */}
          <div>
            <label className={labelCls}>Purchase Price per {purchaseUnit} (₹)</label>
            <input type="number" step="0.01" placeholder="0.00" value={purchasePrice}
              onChange={e => setPurchasePrice(e.target.value)} className={inputCls} />
          </div>

          {/* Supplier */}
          <div>
            <label className={labelCls}>Supplier Name</label>
            <input value={supplierName} onChange={e => setSupplierName(e.target.value)}
              placeholder="e.g. ABC Pharma" className={inputCls} />
          </div>

          {/* Invoice */}
          <div>
            <label className={labelCls}>Invoice Number</label>
            <input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)}
              placeholder="e.g. INV-2024-0892" className={inputCls} />
          </div>

          {/* Date received */}
          <div>
            <label className={labelCls}>Date Received</label>
            <input type="date" value={dateReceived} onChange={e => setDateReceived(e.target.value)} className={inputCls} />
          </div>

          {error && <p className="text-[12px] text-red-500">{error}</p>}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving || !expiryMonth || !expiryYear}
            className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2">
            {isSaving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
