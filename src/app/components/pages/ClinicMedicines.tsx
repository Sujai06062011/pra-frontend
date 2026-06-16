import { useState, useEffect } from "react";
import { Search, Plus, Edit2, X, Loader2, CheckCircle, Package } from "lucide-react";
import { api, type ClinicMedicine } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import { MEDICINE_CATEGORIES, MEDICINE_FORM_OPTIONS } from "../../../lib/medicineConstants";
import { AddStockModal } from "./AddStockModal";
import { MedicineStockDrawer } from "./MedicineStockDrawer";

const FORM_COLOR: Record<string, string> = {
  tablet:  "bg-blue-50 text-blue-600",
  liquid:  "bg-cyan-50 text-cyan-600",
  inhaler: "bg-violet-50 text-violet-600",
  topical: "bg-amber-50 text-amber-700",
  other:   "bg-slate-100 text-slate-500",
};

const PURCHASE_UNITS = ["strip", "bottle", "vial", "tube", "box"];
const DISPENSE_UNITS = ["tablet", "capsule", "ml", "vial", "sachet", "tube"];

function StockBadge({ medicine }: { medicine: ClinicMedicine }) {
  const dispenseUnit = medicine.dispense_unit ?? "tablet";
  if (medicine.total_stock === null || medicine.total_stock === undefined) return null;

  if (medicine.stock_status === "out_of_stock") {
    return <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Out of stock</span>;
  }
  if (medicine.stock_status === "low_stock") {
    return <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">⚠️ Low: {medicine.total_stock} {dispenseUnit}s</span>;
  }
  if (medicine.stock_status === "expiring_soon") {
    return <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">🟡 Expiring soon</span>;
  }
  if (medicine.stock_status === "expired") {
    return <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">🔴 Expired batch</span>;
  }
  return <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✅ {medicine.total_stock} {dispenseUnit}s</span>;
}

interface MedicineModalProps {
  medicine?: ClinicMedicine;
  doctorId: string;
  onSave: (m: ClinicMedicine) => void;
  onClose: () => void;
}

function MedicineModal({ medicine, doctorId, onSave, onClose }: MedicineModalProps) {
  const editing = !!medicine;
  const [name, setName]           = useState(medicine?.name || "");
  const [category, setCategory]   = useState(medicine?.category || "Other");
  const [form, setForm]           = useState<ClinicMedicine["form"]>(medicine?.form || "tablet");
  const [dosages, setDosages]     = useState<string[]>(medicine?.dosages || [""]);
  const [purchaseUnit, setPurchaseUnit] = useState(medicine?.purchase_unit ?? "strip");
  const [dispenseUnit, setDispenseUnit] = useState(medicine?.dispense_unit ?? "tablet");
  const [tabletsPerStrip, setTabletsPerStrip] = useState(medicine?.tablets_per_strip?.toString() ?? "10");
  const [threshold, setThreshold] = useState(medicine?.low_stock_threshold?.toString() ?? "");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  function addDosage() { setDosages(prev => [...prev, ""]); }
  function removeDosage(i: number) { setDosages(prev => prev.filter((_, j) => j !== i)); }
  function updateDosage(i: number, v: string) { setDosages(prev => prev.map((d, j) => j === i ? v : d)); }

  async function handleSubmit() {
    if (!name.trim()) { setError("Medicine name is required"); return; }
    setSaving(true);
    try {
      const cleanDosages = dosages.filter(d => d.trim());
      const payload = {
        name: name.trim(),
        category,
        form: form as ClinicMedicine["form"],
        dosages: cleanDosages,
        purchase_unit: purchaseUnit,
        dispense_unit: dispenseUnit,
        tablets_per_strip: parseInt(tabletsPerStrip) || 10,
        low_stock_threshold: threshold.trim() ? parseInt(threshold) : null,
      };
      let result: ClinicMedicine;
      if (editing && medicine) {
        result = await api.medicines.update(medicine.id, payload);
      } else {
        result = await api.medicines.add({ doctor_id: doctorId, ...payload });
      }
      onSave(result);
    } catch (e: any) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800">
            {editing ? "Edit Medicine" : "Add New Medicine"}
          </h3>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Medicine Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Paracetamol 500mg"
              className="w-full px-3 py-2.5 text-[13px] border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300">
                {MEDICINE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Form</label>
              <select value={form} onChange={e => setForm(e.target.value as ClinicMedicine["form"])}
                className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300">
                {MEDICINE_FORM_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Dosage Options</label>
            <div className="space-y-2">
              {dosages.map((d, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={d}
                    onChange={e => updateDosage(i, e.target.value)}
                    placeholder={`e.g. ${form === "liquid" ? "5ml" : "1 tablet"}`}
                    className="flex-1 px-3 py-2 text-[13px] border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                  <button onClick={() => removeDosage(i)} className="text-slate-300 hover:text-red-400 px-2"><X size={14} /></button>
                </div>
              ))}
              <button onClick={addDosage} className="flex items-center gap-1.5 text-[12px] text-emerald-600 hover:text-emerald-700">
                <Plus size={13} /> Add dosage option
              </button>
            </div>
          </div>

          {/* Stock tracking section */}
          <div className="border-t border-slate-100 pt-4 mt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Stock Tracking</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Purchase Unit</label>
                <select value={purchaseUnit} onChange={e => setPurchaseUnit(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300">
                  {PURCHASE_UNITS.map(u => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Dispense Unit</label>
                <select value={dispenseUnit} onChange={e => setDispenseUnit(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300">
                  {DISPENSE_UNITS.map(u => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  {dispenseUnit.charAt(0).toUpperCase() + dispenseUnit.slice(1)}s/{purchaseUnit}
                </label>
                <input type="number" min="1" value={tabletsPerStrip} onChange={e => setTabletsPerStrip(e.target.value)} placeholder="10"
                  className="w-full px-3 py-2.5 text-[13px] border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Low Stock Alert Threshold (optional)</label>
              <div className="flex items-center gap-2">
                <input type="number" min="1" placeholder="e.g. 100" value={threshold} onChange={e => setThreshold(e.target.value)}
                  className="w-32 px-3 py-2 text-[13px] border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                <span className="text-[12px] text-slate-500">{dispenseUnit}s</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Alert when stock falls below this amount</p>
            </div>
          </div>

          {error && <p className="text-[12px] text-red-500">{error}</p>}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-600 hover:bg-slate-50">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ClinicMedicines() {
  const { doctorId } = useAuth();
  const [medicines, setMedicines]           = useState<ClinicMedicine[]>([]);
  const [categories, setCategories]         = useState<string[]>([]);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTab, setActiveTab]           = useState<"active" | "inactive">("active");
  const [showModal, setShowModal]           = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<ClinicMedicine | undefined>();
  const [confirmDeactivate, setConfirmDeactivate] = useState<ClinicMedicine | null>(null);
  const [addStockFor, setAddStockFor]       = useState<ClinicMedicine | null>(null);
  const [stockDrawerFor, setStockDrawerFor] = useState<ClinicMedicine | null>(null);

  async function loadMedicines() {
    setLoading(true);
    try {
      const [meds, cats] = await Promise.all([
        api.medicines.list(doctorId, 500),
        api.medicines.categories(doctorId),
      ]);
      setMedicines(meds);
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadMedicines(); }, [doctorId]);

  const activeMedicines   = medicines.filter(m => m.is_active !== false);
  const inactiveMedicines = medicines.filter(m => m.is_active === false);
  const tabMedicines      = activeTab === "active" ? activeMedicines : inactiveMedicines;

  const filtered = tabMedicines.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = activeCategory === "All" || m.category === activeCategory;
    return matchSearch && matchCat;
  });

  async function handleDeactivate(m: ClinicMedicine) {
    await api.medicines.deactivate(m.id);
    setMedicines(prev => prev.map(x => x.id === m.id ? { ...x, is_active: false } : x));
    setConfirmDeactivate(null);
  }

  async function handleActivate(m: ClinicMedicine) {
    await api.medicines.activate(m.id);
    setMedicines(prev => prev.map(x => x.id === m.id ? { ...x, is_active: true } : x));
  }

  function handleSaved(saved: ClinicMedicine) {
    setMedicines(prev => {
      const idx = prev.findIndex(m => m.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...saved };
        return copy;
      }
      return [saved, ...prev];
    });
    setShowModal(false);
    setEditingMedicine(undefined);
    api.medicines.categories(doctorId).then(setCategories).catch(() => {});
  }

  return (
    <div className="p-7">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20 }} className="text-slate-800">
            Clinic Medicines
          </h2>
          <p className="text-[12px] text-slate-400 mt-0.5">{activeMedicines.length} active medicines in your formulary</p>
        </div>
        <button
          onClick={() => { setEditingMedicine(undefined); setShowModal(true); }}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl shadow-sm shadow-emerald-200 transition-colors"
        >
          <Plus size={14} /> Add New Medicine
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search medicines..."
            className="w-full pl-8 pr-3 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </div>
      </div>

      {/* Active / Inactive tabs */}
      <div className="flex border-b border-slate-200 mb-4">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2 text-[13px] font-medium border-b-2 transition-colors ${
            activeTab === "active"
              ? "border-emerald-500 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Active ({activeMedicines.length})
        </button>
        <button
          onClick={() => setActiveTab("inactive")}
          className={`px-4 py-2 text-[13px] font-medium border-b-2 transition-colors ml-4 ${
            activeTab === "inactive"
              ? "border-red-400 text-red-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Inactive ({inactiveMedicines.length})
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-5">
        {["All", ...categories].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
              activeCategory === cat
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-500 hover:border-emerald-200 hover:text-emerald-600"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Medicine grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-emerald-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-[13px]">No medicines found</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {filtered.map(m => (
            <div key={m.id} className={`bg-white border rounded-2xl p-4 hover:shadow-md transition-shadow ${m.is_active === false ? "border-slate-200 opacity-75" : "border-slate-200"}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => setStockDrawerFor(m)}
                    className="text-[13px] font-semibold text-slate-800 leading-snug hover:text-emerald-700 text-left"
                  >
                    {m.name}
                  </button>
                  <p className="text-[11px] text-slate-400 mt-0.5">{m.category}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${FORM_COLOR[m.form] || FORM_COLOR.other}`}>
                  {m.form}
                </span>
              </div>

              {/* Stock badge */}
              <div className="mb-2">
                <StockBadge medicine={m} />
              </div>

              {m.dosages?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {m.dosages.map(d => (
                    <span key={d} className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-full text-[11px] text-slate-500">{d}</span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => { setEditingMedicine(m); setShowModal(true); }}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  <Edit2 size={12} /> Edit
                </button>

                {m.is_active !== false && (
                  <button
                    onClick={() => setAddStockFor(m)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    <Package size={12} /> Add Stock
                  </button>
                )}

                {m.is_active !== false ? (
                  <button
                    onClick={() => setConfirmDeactivate(m)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-500 transition-colors ml-auto"
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    onClick={() => handleActivate(m)}
                    className="flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 transition-colors ml-auto font-medium"
                  >
                    Activate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      {showModal && (
        <MedicineModal
          medicine={editingMedicine}
          doctorId={doctorId}
          onSave={handleSaved}
          onClose={() => { setShowModal(false); setEditingMedicine(undefined); }}
        />
      )}

      {/* Deactivate confirm */}
      {confirmDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setConfirmDeactivate(null)} />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-bold text-slate-800 mb-2">Deactivate Medicine?</h3>
            <p className="text-[13px] text-slate-500 mb-2">
              <strong>{confirmDeactivate.name}</strong> will no longer appear in prescription search.
            </p>
            <p className="text-[12px] text-slate-400 mb-5">Existing prescriptions are not affected. You can re-activate it from the Inactive tab.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeactivate(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={() => handleDeactivate(confirmDeactivate)} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[13px] font-semibold">Deactivate</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Stock modal */}
      {addStockFor && (
        <AddStockModal
          medicine={addStockFor}
          onClose={() => setAddStockFor(null)}
          onSaved={() => { setAddStockFor(null); loadMedicines(); }}
        />
      )}

      {/* Stock drawer */}
      {stockDrawerFor && (
        <MedicineStockDrawer
          medicine={stockDrawerFor}
          onClose={() => setStockDrawerFor(null)}
          onUpdated={() => loadMedicines()}
        />
      )}
    </div>
  );
}
