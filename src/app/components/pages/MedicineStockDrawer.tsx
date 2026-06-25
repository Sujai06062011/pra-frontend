import { useState, useEffect } from "react";
import { X, Loader2, Plus } from "lucide-react";
import { api, type ClinicMedicine, type MedicineStockBatch, type StockTransaction } from "../../../lib/api";
import { AddStockModal } from "./AddStockModal";
import { EditBatchModal } from "./EditBatchModal";
import { AdjustStockModal } from "./AdjustStockModal";

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const date = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${date}, ${time}`;
}

interface Props {
  medicine: ClinicMedicine;
  onClose: () => void;
  onUpdated: () => void;
}

export function MedicineStockDrawer({ medicine, onClose, onUpdated }: Props) {
  const dispenseUnit = medicine.dispense_unit ?? "tablet";
  const [batches, setBatches] = useState<MedicineStockBatch[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);
  const [thresholdInput, setThresholdInput] = useState(medicine.low_stock_threshold?.toString() ?? "");
  const [isSavingThreshold, setIsSavingThreshold] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);
  const [editingBatch, setEditingBatch] = useState<(MedicineStockBatch & { strips_editable: boolean }) | null>(null);
  const [adjustingBatch, setAdjustingBatch] = useState<MedicineStockBatch | null>(null);
  const [writeoffBatch, setWriteoffBatch] = useState<MedicineStockBatch | null>(null);
  const [writeoffQty, setWriteoffQty] = useState("");
  const [writeoffReason, setWriteoffReason] = useState("expired");
  const [savingWriteoff, setSavingWriteoff] = useState(false);

  async function loadData() {
    setLoadingBatches(true);
    setLoadingTx(true);
    try {
      const [b, t] = await Promise.all([
        api.medicines.getStock(medicine.id),
        api.medicines.getTransactions(medicine.id),
      ]);
      setBatches(b);
      setTransactions(t.slice(0, 10));
    } finally {
      setLoadingBatches(false);
      setLoadingTx(false);
    }
  }

  useEffect(() => { loadData(); }, [medicine.id]);

  async function openEditBatch(b: MedicineStockBatch) {
    try {
      const res = await api.medicines.editBatch(b.id, {});
      setEditingBatch({ ...b, strips_editable: res.strips_editable });
    } catch {
      setEditingBatch({ ...b, strips_editable: false });
    }
  }

  async function saveThreshold() {
    setIsSavingThreshold(true);
    try {
      await api.medicines.setThreshold(medicine.id, thresholdInput.trim() ? parseInt(thresholdInput) : null);
      onUpdated();
    } finally {
      setIsSavingThreshold(false);
    }
  }

  async function clearThreshold() {
    await api.medicines.setThreshold(medicine.id, null);
    setThresholdInput("");
    onUpdated();
  }

  async function handleWriteoff() {
    if (!writeoffBatch || !writeoffQty) return;
    setSavingWriteoff(true);
    try {
      await api.medicines.writeoff(medicine.id, writeoffBatch.id, writeoffReason, parseInt(writeoffQty));
      setWriteoffBatch(null);
      setWriteoffQty("");
      loadData();
      onUpdated();
    } finally {
      setSavingWriteoff(false);
    }
  }

  const expiryRowClass = (status: string) => {
    if (status === "expired") return "bg-red-50";
    if (status === "expiring_soon") return "bg-yellow-50";
    return "";
  };
  const expiryTextClass = (status: string) => {
    if (status === "expired") return "text-red-700 font-medium";
    if (status === "expiring_soon") return "text-yellow-700";
    return "text-slate-600";
  };
  const expiryLabel = (status: string) => {
    if (status === "expired") return "🔴 Expired";
    if (status === "expiring_soon") return "🟡 Soon";
    return "🟢 Good";
  };

  const txTypeLabel = (type: string) => {
    if (type === "purchase") return { label: "Purchase", cls: "text-emerald-600" };
    if (type === "dispensed") return { label: "Dispensed", cls: "text-blue-600" };
    if (type === "expired_writeoff") return { label: "Write-off", cls: "text-red-600" };
    return { label: type, cls: "text-slate-500" };
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800">
              {medicine.name}
            </h3>
            <p className="text-[12px] text-slate-400 mt-0.5">{medicine.category} · {medicine.form}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddStock(true)}
              className="flex items-center gap-1.5 text-[12px] bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-medium"
            >
              <Plus size={13} /> Add Stock
            </button>
            <button onClick={onClose} className="text-slate-300 hover:text-slate-500"><X size={18} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* Low stock threshold */}
          <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl">
            <div className="flex-1">
              <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                Low Stock Alert Threshold
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Get alerted when stock falls below this amount
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                placeholder="e.g. 100"
                value={thresholdInput}
                onChange={e => setThresholdInput(e.target.value)}
                className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-[13px] text-center focus:border-orange-400 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500">{dispenseUnit}s</span>
              <button
                onClick={saveThreshold}
                disabled={!thresholdInput || isSavingThreshold}
                className="px-3 py-1.5 bg-orange-500 text-white text-[12px] font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {isSavingThreshold ? "Saving…" : "Save"}
              </button>
              {medicine.low_stock_threshold && (
                <button
                  onClick={clearThreshold}
                  className="px-2 py-1.5 text-[12px] text-slate-400 hover:text-slate-600"
                  title="Remove threshold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          {medicine.low_stock_threshold && (
            <p className="text-[11px] text-orange-600 -mt-4 px-1">
              Currently alerting when below <strong>{medicine.low_stock_threshold}</strong> {dispenseUnit}s
            </p>
          )}

          {/* Stock batches */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Stock Batches (FIFO order)</p>
            {loadingBatches ? (
              <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-emerald-500" /></div>
            ) : batches.length === 0 ? (
              <div className="text-center py-6 text-[13px] text-slate-400">No stock added yet</div>
            ) : (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-3 py-2 text-slate-500 font-semibold">Batch</th>
                      <th className="text-left px-3 py-2 text-slate-500 font-semibold">Expiry</th>
                      <th className="text-right px-3 py-2 text-slate-500 font-semibold">Remaining</th>
                      <th className="text-center px-3 py-2 text-slate-500 font-semibold">Status</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map(b => (
                      <tr key={b.id} className={`border-b border-slate-100 last:border-0 ${expiryRowClass(b.expiry_status)}`}>
                        <td className="px-3 py-2.5 text-slate-700 font-medium">{b.batch_number || "—"}</td>
                        <td className={`px-3 py-2.5 ${expiryTextClass(b.expiry_status)}`}>{formatDate(b.expiry_date)}</td>
                        <td className="px-3 py-2.5 text-right text-slate-700">{b.tablets_remaining} {dispenseUnit}s</td>
                        <td className="px-3 py-2.5 text-center">{expiryLabel(b.expiry_status)}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <button
                              onClick={() => openEditBatch(b)}
                              className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setAdjustingBatch(b)}
                              className="text-[11px] text-orange-600 hover:text-orange-800 font-medium"
                            >
                              Adjust
                            </button>
                            <button
                              onClick={() => { setWriteoffBatch(b); setWriteoffQty(b.tablets_remaining.toString()); }}
                              className="text-[11px] text-red-500 hover:text-red-700 font-medium"
                            >
                              Write off
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Transaction history */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Recent Transactions</p>
            {loadingTx ? (
              <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-slate-400" /></div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-4 text-[13px] text-slate-400">No transactions yet</div>
            ) : (
              <div className="space-y-1">
                {transactions.map(tx => {
                  const { label, cls } = txTypeLabel(tx.transaction_type);
                  return (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-50">
                      <div>
                        <span className={`text-[12px] font-medium ${cls}`}>{label}</span>
                        {tx.notes && <span className="text-[11px] text-slate-400 ml-2">{tx.notes}</span>}
                        <div className="text-[11px] text-slate-400">{formatDateTime(tx.created_at)}</div>
                      </div>
                      <span className={`text-[13px] font-semibold ${tx.quantity_change > 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {tx.quantity_change > 0 ? "+" : ""}{tx.quantity_change}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Write-off modal */}
      {writeoffBatch && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setWriteoffBatch(null)} />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-bold text-slate-800 mb-1">Write Off Stock</h3>
            <p className="text-[12px] text-slate-500 mb-4">Batch {writeoffBatch.batch_number || "—"} · {writeoffBatch.tablets_remaining} {dispenseUnit}s remaining</p>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">Reason</label>
                <select value={writeoffReason} onChange={e => setWriteoffReason(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl bg-white text-slate-700">
                  <option value="expired">Expired</option>
                  <option value="damaged">Damaged</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">Quantity ({dispenseUnit}s)</label>
                <input type="number" min="1" max={writeoffBatch.tablets_remaining} value={writeoffQty} onChange={e => setWriteoffQty(e.target.value)}
                  className="w-full px-3 py-2.5 text-[13px] border border-slate-200 rounded-xl text-slate-700" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setWriteoffBatch(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-600">Cancel</button>
              <button onClick={handleWriteoff} disabled={savingWriteoff || !writeoffQty}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-[13px] font-semibold">
                {savingWriteoff ? "Writing off…" : "Write Off"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddStock && (
        <AddStockModal
          medicine={medicine}
          onClose={() => setShowAddStock(false)}
          onSaved={() => { setShowAddStock(false); loadData(); onUpdated(); }}
        />
      )}

      {editingBatch && (
        <EditBatchModal
          batch={editingBatch}
          medicine={medicine}
          stripsEditable={editingBatch.strips_editable}
          onClose={() => setEditingBatch(null)}
          onSaved={() => { setEditingBatch(null); loadData(); onUpdated(); }}
        />
      )}

      {adjustingBatch && (
        <AdjustStockModal
          batch={adjustingBatch}
          medicine={medicine}
          onClose={() => setAdjustingBatch(null)}
          onSaved={() => { setAdjustingBatch(null); loadData(); onUpdated(); }}
        />
      )}
    </>
  );
}
