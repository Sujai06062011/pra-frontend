import { useState, useEffect, useCallback } from "react";
import { Save, Building2, Clock, Bell, MessageSquare, RefreshCw, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const DOCTOR_ID = "8c33abe0-5d2e-4613-9437-c7c375e8d162";
const API_BASE = import.meta.env.VITE_API_URL || "https://web-production-e5f38.up.railway.app";

type ConfigRow = {
  config_key: string;
  config_value: string;
  config_type: string;
  description: string;
  updated_at: string;
};

type SaveState = "idle" | "saving" | "saved" | "error";

// ── helpers ──────────────────────────────────────────────────────
function keyLabel(key: string): string {
  return key
    .replace(/^(clinic|scheduler|feature|template)\./, "")
    .replace(/\./g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function useConfig() {
  const [rows, setRows] = useState<ConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/config/${DOCTOR_ID}`);
      const data = await r.json();
      setRows(data);
    } catch (e) {
      setError("Failed to load config");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  return { rows, loading, error, reload };
}

async function saveKey(key: string, value: string): Promise<boolean> {
  try {
    const r = await fetch(`${API_BASE}/config/${DOCTOR_ID}/${encodeURIComponent(key)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config_value: value }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

async function reloadScheduler(): Promise<boolean> {
  try {
    const r = await fetch(`${API_BASE}/config/reload-scheduler`, { method: "POST" });
    return r.ok;
  } catch {
    return false;
  }
}

// ── sub-components ────────────────────────────────────────────────

function SectionHeader({ icon, title, color }: { icon: React.ReactNode; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center`}>{icon}</div>
      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800">{title}</h3>
    </div>
  );
}

function ConfigField({
  row,
  onChange,
}: {
  row: ConfigRow;
  onChange: (key: string, value: string) => void;
}) {
  const label = keyLabel(row.config_key);

  if (row.config_type === "boolean") {
    return (
      <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
        <div>
          <div className="text-[13px] font-medium text-slate-700">{label}</div>
          {row.description && <div className="text-[11px] text-slate-400">{row.description}</div>}
        </div>
        <input
          type="checkbox"
          checked={row.config_value === "true"}
          onChange={(e) => onChange(row.config_key, e.target.checked ? "true" : "false")}
          className="accent-emerald-500 w-4 h-4 cursor-pointer"
        />
      </div>
    );
  }

  if (row.config_type === "time") {
    return (
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">{label}</label>
        <input
          type="time"
          value={row.config_value}
          onChange={(e) => onChange(row.config_key, e.target.value)}
          className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 bg-white"
        />
        {row.description && <p className="text-[11px] text-slate-400 mt-1">{row.description}</p>}
      </div>
    );
  }

  if (row.config_type === "string" && row.config_key.startsWith("template.")) {
    return (
      <div className="col-span-2">
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">{label}</label>
        <textarea
          rows={5}
          value={row.config_value}
          onChange={(e) => onChange(row.config_key, e.target.value)}
          className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 bg-white font-mono resize-y"
        />
        {row.description && <p className="text-[11px] text-slate-400 mt-1">{row.description}</p>}
      </div>
    );
  }

  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">{label}</label>
      <input
        value={row.config_value}
        onChange={(e) => onChange(row.config_key, e.target.value)}
        className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 bg-white"
      />
      {row.description && <p className="text-[11px] text-slate-400 mt-1">{row.description}</p>}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────

export function Settings() {
  const { rows, loading, error, reload } = useConfig();
  const [localRows, setLocalRows] = useState<ConfigRow[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [reloadState, setReloadState] = useState<SaveState>("idle");

  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  const handleChange = (key: string, value: string) => {
    setLocalRows((prev) =>
      prev.map((r) => (r.config_key === key ? { ...r, config_value: value } : r))
    );
    setSaveState("idle");
  };

  const handleSave = async () => {
    setSaveState("saving");
    const original = rows.reduce<Record<string, string>>((acc, r) => { acc[r.config_key] = r.config_value; return acc; }, {});
    const changed = localRows.filter((r) => r.config_value !== original[r.config_key]);

    const results = await Promise.all(changed.map((r) => saveKey(r.config_key, r.config_value)));
    const allOk = results.every(Boolean);
    setSaveState(allOk ? "saved" : "error");
    if (allOk) {
      await reload();
      setTimeout(() => setSaveState("idle"), 2500);
    }
  };

  const handleReloadScheduler = async () => {
    setReloadState("saving");
    const ok = await reloadScheduler();
    setReloadState(ok ? "saved" : "error");
    setTimeout(() => setReloadState("idle"), 2500);
  };

  if (loading) {
    return (
      <div className="p-7 flex items-center gap-3 text-slate-400 text-[13px]">
        <Loader2 size={16} className="animate-spin" /> Loading settings…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-7 text-red-500 text-[13px]">{error}</div>
    );
  }

  const by = (prefix: string) => localRows.filter((r) => r.config_key.startsWith(prefix));

  const clinicRows      = by("clinic.");
  const schedulerRows   = by("scheduler.");
  const featureFlagRows = by("feature.").filter((r) => r.config_type === "boolean");
  const featureOther    = by("feature.").filter((r) => r.config_type !== "boolean");
  const templateRows    = by("template.");

  return (
    <div className="p-7 space-y-6 max-w-3xl">

      {/* ── Clinic Information ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <SectionHeader
          icon={<Building2 size={16} className="text-emerald-600" />}
          title="Clinic Information"
          color="bg-emerald-50"
        />
        <div className="grid grid-cols-2 gap-4">
          {[...clinicRows, ...featureOther].map((r) => (
            <ConfigField key={r.config_key} row={r} onChange={handleChange} />
          ))}
        </div>
      </div>

      {/* ── Scheduler Timings ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <SectionHeader
          icon={<Clock size={16} className="text-blue-600" />}
          title="Scheduler Timings (IST)"
          color="bg-blue-50"
        />
        <div className="grid grid-cols-2 gap-4">
          {schedulerRows.map((r) => (
            <ConfigField key={r.config_key} row={r} onChange={handleChange} />
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
          <button
            onClick={handleReloadScheduler}
            disabled={reloadState === "saving"}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-[13px] font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors"
          >
            {reloadState === "saving" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : reloadState === "saved" ? (
              <CheckCircle size={14} />
            ) : reloadState === "error" ? (
              <AlertCircle size={14} />
            ) : (
              <RefreshCw size={14} />
            )}
            {reloadState === "saving" ? "Reloading…" : reloadState === "saved" ? "Reloaded!" : reloadState === "error" ? "Error" : "Reload Scheduler"}
          </button>
          <span className="text-[11px] text-slate-400">Save first, then reload scheduler to apply timing changes.</span>
        </div>
      </div>

      {/* ── Feature Flags ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <SectionHeader
          icon={<Bell size={16} className="text-violet-600" />}
          title="Feature Flags"
          color="bg-violet-50"
        />
        <div className="space-y-1">
          {featureFlagRows.map((r) => (
            <ConfigField key={r.config_key} row={r} onChange={handleChange} />
          ))}
        </div>
      </div>

      {/* ── Message Templates ─────────────────────────── */}
      {templateRows.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <SectionHeader
            icon={<MessageSquare size={16} className="text-amber-600" />}
            title="Message Templates"
            color="bg-amber-50"
          />
          <p className="text-[11px] text-slate-400 mb-4">
            Use <code className="bg-slate-100 px-1 rounded">{"{name}"}</code>,{" "}
            <code className="bg-slate-100 px-1 rounded">{"{clinic}"}</code>,{" "}
            <code className="bg-slate-100 px-1 rounded">{"{doctor}"}</code>,{" "}
            <code className="bg-slate-100 px-1 rounded">{"{diagnosis}"}</code>,{" "}
            <code className="bg-slate-100 px-1 rounded">{"{review_link}"}</code> as placeholders.
          </p>
          <div className="grid grid-cols-1 gap-4">
            {templateRows.map((r) => (
              <ConfigField key={r.config_key} row={r} onChange={handleChange} />
            ))}
          </div>
        </div>
      )}

      {/* ── Save Button ───────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saveState === "saving"}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-[13px] font-semibold px-6 py-2.5 rounded-xl shadow-sm shadow-emerald-200 transition-colors"
        >
          {saveState === "saving" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : saveState === "saved" ? (
            <CheckCircle size={15} />
          ) : saveState === "error" ? (
            <AlertCircle size={15} />
          ) : (
            <Save size={15} />
          )}
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved!" : saveState === "error" ? "Save failed" : "Save Settings"}
        </button>
        {saveState === "error" && (
          <span className="text-[12px] text-red-500">Some changes failed to save. Please retry.</span>
        )}
      </div>

    </div>
  );
}
