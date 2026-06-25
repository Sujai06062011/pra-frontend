import { useState, useRef, useEffect } from "react";
import { X, Search, Plus } from "lucide-react";
import { useMedicineSearch, type ClinicMedicine } from "../../../hooks/useMedicineSearch";
import { ALL_DOSAGE_OPTIONS, DURATION_OPTIONS } from "../../../lib/medicineConstants";

export interface TimingEntry {
  enabled: boolean;
  qty: number;
  before_food: boolean;
}

export interface MedicineFormRow {
  id: string;
  medicine_id?: string;
  medicine_name: string;
  form: string;
  dosage: string;
  duration_days: number;
  timings: {
    morning:   TimingEntry;
    afternoon: TimingEntry;
    evening:   TimingEntry;
    night:     TimingEntry;
  };
  instructions: string;
}

export function makeDefaultTimings(): MedicineFormRow["timings"] {
  return {
    morning:   { enabled: false, qty: 1, before_food: false },
    afternoon: { enabled: false, qty: 1, before_food: false },
    evening:   { enabled: false, qty: 1, before_food: false },
    night:     { enabled: false, qty: 1, before_food: false },
  };
}

interface Props {
  index: number;
  medicine: MedicineFormRow;
  onChange: (updated: MedicineFormRow) => void;
  onRemove: () => void;
  error?: string;
}

const TIMING_CONFIG = [
  { key: "morning"   as const, label: "Morning",   icon: "🌅", pillOn: "bg-amber-100 text-amber-700 border-amber-300" },
  { key: "afternoon" as const, label: "Afternoon",  icon: "☀️", pillOn: "bg-orange-100 text-orange-700 border-orange-300" },
  { key: "evening"   as const, label: "Evening",    icon: "🌆", pillOn: "bg-purple-100 text-purple-700 border-purple-300" },
  { key: "night"     as const, label: "Night",      icon: "🌙", pillOn: "bg-blue-100 text-blue-700 border-blue-300" },
];

export function MedicineRow({ index, medicine, onChange, onRemove, error }: Props) {
  const [query, setQuery]               = useState(medicine.medicine_name);
  const [showDropdown, setShowDropdown] = useState(false);
  const [manualDosage, setManualDosage] = useState(
    !!medicine.dosage && !ALL_DOSAGE_OPTIONS.includes(medicine.dosage)
  );
  const [dosageOptions, setDosageOptions] = useState<string[]>([]);
  const { results, loading, search, clear } = useMedicineSearch();
  const inputRef   = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleQueryChange(val: string) {
    setQuery(val);
    onChange({ ...medicine, medicine_name: val, medicine_id: undefined });
    search(val);
    setShowDropdown(true);
  }

  function selectMedicine(med: ClinicMedicine) {
    const options = med.dosages?.length ? med.dosages : getDosageOptionsForForm(med.form);
    setDosageOptions(options);
    setQuery(med.name);
    setShowDropdown(false);
    clear();
    onChange({ ...medicine, medicine_id: med.id, medicine_name: med.name, form: med.form, dosage: options[0] || "" });
    setManualDosage(false);
  }

  function addNewMedicine() {
    setShowDropdown(false);
    clear();
    onChange({ ...medicine, medicine_name: query });
  }

  function getDosageOptionsForForm(form: string): string[] {
    if (form === "liquid")  return ["2.5ml", "5ml", "7.5ml", "10ml", "15ml"];
    if (form === "inhaler") return ["1 puff", "2 puffs"];
    if (form === "topical") return ["Apply thin layer", "Apply twice daily"];
    return ["½ tablet", "1 tablet", "1½ tablets", "2 tablets"];
  }

  function toggleTiming(key: keyof MedicineFormRow["timings"]) {
    const t = medicine.timings[key];
    onChange({
      ...medicine,
      timings: { ...medicine.timings, [key]: { ...t, enabled: !t.enabled } },
    });
  }

  function updateTimingField<K extends keyof TimingEntry>(
    key: keyof MedicineFormRow["timings"],
    field: K,
    value: TimingEntry[K]
  ) {
    onChange({
      ...medicine,
      timings: { ...medicine.timings, [key]: { ...medicine.timings[key], [field]: value } },
    });
  }

  const qtyUnit = medicine.form === "liquid" ? "ml" : medicine.form === "inhaler" ? "puff(s)" : "tab(s)";
  const allDosages = [...new Set([...dosageOptions, ...ALL_DOSAGE_OPTIONS])];

  return (
    <div className={`bg-white border rounded-2xl p-5 space-y-4 ${error ? "border-red-300" : "border-slate-200"}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Medicine #{index + 1}
        </span>
        <button onClick={onRemove} className="text-slate-300 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50">
          <X size={15} />
        </button>
      </div>

      {/* Medicine search */}
      <div className="relative" ref={dropdownRef}>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Medicine Name</label>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onFocus={() => query.length >= 2 && setShowDropdown(true)}
            placeholder="Search medicine..."
            className="w-full pl-8 pr-3 py-2.5 text-[13px] border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
          />
        </div>
        {showDropdown && (results.length > 0 || loading || query.length >= 2) && (
          <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            {loading && <div className="px-4 py-2.5 text-[12px] text-slate-400">Searching…</div>}
            {results.map(med => (
              <button key={med.id} onMouseDown={() => selectMedicine(med)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-emerald-50 text-left transition-colors">
                <span className="text-[13px] text-slate-700 font-medium">{med.name}</span>
                <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{med.form}</span>
              </button>
            ))}
            {!loading && query.length >= 2 && (
              <button onMouseDown={addNewMedicine}
                className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 text-[12px] text-emerald-600 font-medium border-t border-slate-100">
                <Plus size={13} /> Add "{query}" as new medicine
              </button>
            )}
          </div>
        )}
      </div>

      {/* Strength + Duration */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Strength</label>
          {manualDosage ? (
            <input value={medicine.dosage} onChange={e => onChange({ ...medicine, dosage: e.target.value })}
              placeholder="e.g. 5ml"
              className="w-full px-3 py-2 text-sm min-h-[44px] border border-emerald-300 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          ) : (
            <select value={medicine.dosage}
              onChange={e => {
                if (e.target.value === "__manual__") { setManualDosage(true); onChange({ ...medicine, dosage: "" }); }
                else onChange({ ...medicine, dosage: e.target.value });
              }}
              style={{ color: '#1e293b' }}
              className="w-full px-3 py-2 text-sm min-h-[44px] border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300">
              <option value="" style={{ color: '#1e293b' }}>Select strength</option>
              {allDosages.map(d => <option key={d} value={d} style={{ color: '#1e293b' }}>{d}</option>)}
              <option value="__manual__" style={{ color: '#1e293b' }}>✏️ Enter manually</option>
            </select>
          )}
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Duration</label>
          <div className="flex items-center gap-2">
            <select value={medicine.duration_days}
              onChange={e => onChange({ ...medicine, duration_days: Number(e.target.value) })}
              style={{ color: '#1e293b' }}
              className="flex-1 px-3 py-2 text-sm min-h-[44px] border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300">
              {DURATION_OPTIONS.map(d => <option key={d} value={d} style={{ color: '#1e293b' }}>{d}</option>)}
            </select>
            <span className="text-[12px] text-slate-400 whitespace-nowrap">days</span>
          </div>
        </div>
      </div>

      {/* Per-timing dose + food timing */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
          When &amp; How Much
        </label>
        <div className="space-y-2">
          {TIMING_CONFIG.map(({ key, label, icon, pillOn }) => {
            const t = medicine.timings[key];
            return (
              <div key={key} className={`rounded-xl border transition-all ${t.enabled ? "border-emerald-200 bg-emerald-50/40" : "border-slate-100 bg-slate-50/40"}`}>
                {/* Toggle row */}
                <button
                  type="button"
                  onClick={() => toggleTiming(key)}
                  className="w-full flex items-center justify-between px-3 py-2"
                >
                  <span className={`text-[13px] font-medium ${t.enabled ? "text-slate-800" : "text-slate-400"}`}>
                    {icon} {label}
                  </span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    t.enabled ? pillOn : "bg-white text-slate-300 border-slate-200"
                  }`}>
                    {t.enabled ? "ON" : "OFF"}
                  </span>
                </button>

                {/* Expanded detail when ON */}
                {t.enabled && (
                  <div className="flex items-center gap-3 px-3 pb-2.5 border-t border-emerald-100 pt-2">
                    {/* Qty */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={t.qty}
                        onChange={e => updateTimingField(key, "qty", parseFloat(e.target.value) || 1)}
                        className="w-14 px-2 py-1.5 text-[13px] font-semibold border border-slate-200 rounded-lg text-center bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      />
                      <span className="text-[11px] text-slate-500">{qtyUnit}</span>
                    </div>

                    {/* Food timing */}
                    <div className="flex gap-1.5 ml-auto">
                      <button
                        type="button"
                        onClick={() => updateTimingField(key, "before_food", true)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                          t.before_food
                            ? "bg-amber-100 text-amber-700 border-amber-300"
                            : "bg-white text-slate-400 border-slate-200 hover:border-amber-200"
                        }`}
                      >
                        🌅 Before food
                      </button>
                      <button
                        type="button"
                        onClick={() => updateTimingField(key, "before_food", false)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                          !t.before_food
                            ? "bg-teal-100 text-teal-700 border-teal-300"
                            : "bg-white text-slate-400 border-slate-200 hover:border-teal-200"
                        }`}
                      >
                        🍽 After food
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
          Special Instructions <span className="normal-case font-normal text-slate-300">(optional)</span>
        </label>
        <input
          value={medicine.instructions}
          onChange={e => onChange({ ...medicine, instructions: e.target.value })}
          placeholder="e.g. Crush and mix with honey for small children"
          className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-300"
        />
      </div>

      {error && <p className="text-[12px] text-red-500">{error}</p>}
    </div>
  );
}
