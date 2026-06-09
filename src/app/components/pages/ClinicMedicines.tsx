import { useState, useEffect } from "react";
import { Search, Plus, Edit2, EyeOff, X, Loader2, CheckCircle } from "lucide-react";
import { api, type ClinicMedicine } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import { MEDICINE_CATEGORIES, MEDICINE_FORM_OPTIONS } from "../../../lib/medicineConstants";

const FORM_COLOR: Record<string, string> = {
  tablet:  "bg-blue-50 text-blue-600",
  liquid:  "bg-cyan-50 text-cyan-600",
  inhaler: "bg-violet-50 text-violet-600",
  topical: "bg-amber-50 text-amber-700",
  other:   "bg-slate-100 text-slate-500",
};

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
  const [form, setForm]           = useState(medicine?.form || "tablet");
  const [dosages, setDosages]     = useState<string[]>(medicine?.dosages || [""]);
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
      let result: ClinicMedicine;
      if (editing && medicine) {
        result = await api.medicines.update(medicine.id, { name: name.trim(), category, form: form as ClinicMedicine["form"], dosages: cleanDosages });
      } else {
        result = await api.medicines.add({ doctor_id: doctorId, name: name.trim(), category, form: form as ClinicMedicine["form"], dosages: cleanDosages });
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
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-md mx-4">
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
              <select value={form} onChange={e => setForm(e.target.value)}
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
  const [medicines, setMedicines]       = useState<ClinicMedicine[]>([]);
  const [categories, setCategories]     = useState<string[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showModal, setShowModal]       = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<ClinicMedicine | undefined>();
  const [confirmDeactivate, setConfirmDeactivate] = useState<ClinicMedicine | null>(null);

  async function loadMedicines() {
    setLoading(true);
    try {
      const [meds, cats] = await Promise.all([
        api.medicines.list(doctorId, 200),
        api.medicines.categories(doctorId),
      ]);
      setMedicines(meds);
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadMedicines(); }, [doctorId]);

  const filtered = medicines.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = activeCategory === "All" || m.category === activeCategory;
    return matchSearch && matchCat;
  });

  async function handleDeactivate(m: ClinicMedicine) {
    await api.medicines.deactivate(m.id);
    setMedicines(prev => prev.filter(x => x.id !== m.id));
    setConfirmDeactivate(null);
  }

  function handleSaved(saved: ClinicMedicine) {
    setMedicines(prev => {
      const idx = prev.findIndex(m => m.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    setShowModal(false);
    setEditingMedicine(undefined);
    // Refresh categories
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
          <p className="text-[12px] text-slate-400 mt-0.5">{medicines.length} medicines in your formulary</p>
        </div>
        <button
          onClick={() => { setEditingMedicine(undefined); setShowModal(true); }}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl shadow-sm shadow-emerald-200 transition-colors"
        >
          <Plus size={14} /> Add New Medicine
        </button>
      </div>

      {/* Search + category filter */}
      <div className="flex gap-3 mb-5">
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

      {/* Category tabs */}
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
            <div key={m.id} className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 leading-snug">{m.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{m.category}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${FORM_COLOR[m.form] || FORM_COLOR.other}`}>
                  {m.form}
                </span>
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
                <button
                  onClick={() => setConfirmDeactivate(m)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-500 transition-colors ml-auto"
                >
                  <EyeOff size={12} /> Deactivate
                </button>
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
            <p className="text-[13px] text-slate-500 mb-5">
              <strong>{confirmDeactivate.name}</strong> will be hidden from prescription search. You can re-activate it later.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeactivate(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={() => handleDeactivate(confirmDeactivate)} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[13px] font-semibold">Deactivate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
