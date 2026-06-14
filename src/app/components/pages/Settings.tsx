import { useState, useEffect, useCallback } from "react";
import { Save, Building2, Clock, Bell, MessageSquare, RefreshCw, CheckCircle, AlertCircle, Loader2, ShieldAlert, CalendarDays, Sun, Moon } from "lucide-react";
import type { DaySchedule } from "../../../lib/api";

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

const SLOT_KEY_ORDER = [
  "clinic.slot_start_morning",
  "clinic.slot_end_morning",
  "clinic.slot_start_evening",
  "clinic.slot_end_evening",
  "clinic.slot_duration_minutes",
  "clinic.max_per_slot",
];

// ── helpers ──────────────────────────────────────────────────────
function keyLabel(key: string): string {
  return key
    .replace(/^(clinic|scheduler|feature|template)\./, "")
    .replace(/\./g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Weekly Schedule ───────────────────────────────────────────────

const DAYS_META = [
  { key: "monday",    label: "Mon",  full: "Monday" },
  { key: "tuesday",   label: "Tue",  full: "Tuesday" },
  { key: "wednesday", label: "Wed",  full: "Wednesday" },
  { key: "thursday",  label: "Thu",  full: "Thursday" },
  { key: "friday",    label: "Fri",  full: "Friday" },
  { key: "saturday",  label: "Sat",  full: "Saturday" },
  { key: "sunday",    label: "Sun",  full: "Sunday" },
];

function DayRow({
  day,
  onChange,
}: {
  day: DaySchedule;
  onChange: (updates: Partial<DaySchedule>) => void;
}) {
  return (
    <div className={`rounded-xl border p-3 transition-colors ${day.is_closed ? "bg-slate-50 border-slate-100" : "bg-white border-slate-100"}`}>
      {/* Row header */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-[13px] font-bold text-slate-700 w-10 flex-shrink-0">
          {DAYS_META.find(d => d.key === day.day_of_week)?.label}
        </span>
        <button
          type="button"
          onClick={() => onChange({ is_closed: !day.is_closed })}
          className={`px-3 py-1 rounded-lg text-[12px] font-semibold border transition-colors ${
            day.is_closed
              ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
              : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
          }`}
        >
          {day.is_closed ? "Closed" : "Open"}
        </button>
        {day.is_closed && (
          <span className="text-[11px] text-slate-400">No appointments this day</span>
        )}
      </div>

      {!day.is_closed && (
        <div className="grid grid-cols-2 gap-3 pl-13" style={{ paddingLeft: "52px" }}>
          {/* Morning */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Sun size={12} className="text-amber-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Morning</span>
              <button
                type="button"
                onClick={() => onChange({ morning_enabled: !day.morning_enabled })}
                className={`ml-auto px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  day.morning_enabled
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                }`}
              >
                {day.morning_enabled ? "On" : "Off"}
              </button>
            </div>
            {day.morning_enabled ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="time"
                  value={day.morning_start}
                  onChange={e => onChange({ morning_start: e.target.value })}
                  className="flex-1 px-2 py-1.5 text-[12px] border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
                />
                <span className="text-[11px] text-slate-400">–</span>
                <input
                  type="time"
                  value={day.morning_end}
                  onChange={e => onChange({ morning_end: e.target.value })}
                  className="flex-1 px-2 py-1.5 text-[12px] border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
                />
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 pl-1">Not available</span>
            )}
          </div>

          {/* Evening */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Moon size={12} className="text-indigo-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Evening</span>
              <button
                type="button"
                onClick={() => onChange({ evening_enabled: !day.evening_enabled })}
                className={`ml-auto px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  day.evening_enabled
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                }`}
              >
                {day.evening_enabled ? "On" : "Off"}
              </button>
            </div>
            {day.evening_enabled ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="time"
                  value={day.evening_start}
                  onChange={e => onChange({ evening_start: e.target.value })}
                  className="flex-1 px-2 py-1.5 text-[12px] border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
                />
                <span className="text-[11px] text-slate-400">–</span>
                <input
                  type="time"
                  value={day.evening_end}
                  onChange={e => onChange({ evening_end: e.target.value })}
                  className="flex-1 px-2 py-1.5 text-[12px] border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
                />
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 pl-1">Not available</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function WeeklyScheduleSection() {
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [local, setLocal] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    fetch(`${API_BASE}/schedule?doctor_id=${DOCTOR_ID}`)
      .then(r => r.json())
      .then((data: DaySchedule[]) => { setSchedule(data); setLocal(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateDay = (dayKey: string, updates: Partial<DaySchedule>) => {
    setLocal(prev => prev.map(d => d.day_of_week === dayKey ? { ...d, ...updates } : d));
    setSaveState("idle");
  };

  const handleSave = async () => {
    setSaveState("saving");
    try {
      const changed = local.filter((ls, i) => JSON.stringify(ls) !== JSON.stringify(schedule[i]));
      await Promise.all(
        changed.map(day =>
          fetch(`${API_BASE}/schedule`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              doctor_id: DOCTOR_ID,
              day_of_week: day.day_of_week,
              is_closed: day.is_closed,
              morning_enabled: day.morning_enabled,
              morning_start: day.morning_start || null,
              morning_end: day.morning_end || null,
              evening_enabled: day.evening_enabled,
              evening_start: day.evening_start || null,
              evening_end: day.evening_end || null,
            }),
          })
        )
      );
      setSchedule(local);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("error");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-3 text-slate-400 text-[13px]">
          <Loader2 size={16} className="animate-spin" /> Loading weekly schedule…
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
          <CalendarDays size={16} className="text-teal-600" />
        </div>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800">
          Weekly Schedule
        </h3>
      </div>
      <p className="text-[12px] text-slate-400 mb-4 ml-10">
        Set default clinic hours per day. These apply across all future dates unless overridden in Availability.
      </p>

      <div className="space-y-2">
        {local.map(day => (
          <DayRow
            key={day.day_of_week}
            day={day}
            onChange={(updates) => updateDay(day.day_of_week, updates)}
          />
        ))}
      </div>

      <div className="mt-5 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saveState === "saving"}
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          {saveState === "saving" ? <Loader2 size={14} className="animate-spin" />
            : saveState === "saved" ? <CheckCircle size={14} />
            : saveState === "error" ? <AlertCircle size={14} />
            : <Save size={14} />}
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved!" : saveState === "error" ? "Save failed" : "Save Weekly Schedule"}
        </button>
        {saveState === "error" && (
          <span className="text-[12px] text-red-500">Failed to save. Please retry.</span>
        )}
      </div>
    </div>
  );
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

type SaveKeyResult = { ok: true } | { ok: false; blocked?: string };

async function saveKey(key: string, value: string): Promise<SaveKeyResult> {
  try {
    const r = await fetch(`${API_BASE}/config/${DOCTOR_ID}/${encodeURIComponent(key)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config_value: value }),
    });
    if (r.status === 409) {
      const body = await r.json().catch(() => ({}));
      return { ok: false, blocked: body.message || "Active appointments exist — cannot change slot settings." };
    }
    return r.ok ? { ok: true } : { ok: false };
  } catch {
    return { ok: false };
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
  const [blockedMessage, setBlockedMessage] = useState("");

  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  const handleChange = (key: string, value: string) => {
    setLocalRows((prev) =>
      prev.map((r) => (r.config_key === key ? { ...r, config_value: value } : r))
    );
    setSaveState("idle");
    setBlockedMessage("");
  };

  const handleSave = async () => {
    setSaveState("saving");
    setBlockedMessage("");
    const original = rows.reduce<Record<string, string>>((acc, r) => { acc[r.config_key] = r.config_value; return acc; }, {});
    const changed = localRows.filter((r) => r.config_value !== original[r.config_key]);

    const results = await Promise.all(changed.map((r) => saveKey(r.config_key, r.config_value)));

    const blocked = results.find((r): r is { ok: false; blocked: string } => !r.ok && !!("blocked" in r && r.blocked));
    if (blocked) {
      setSaveState("error");
      setBlockedMessage(blocked.blocked!);
      return;
    }

    const allOk = results.every((r) => r.ok);
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
  const byKey = (key: string) => localRows.find((r) => r.config_key === key);

  // Clinic info: name fields first, then slot fields in explicit order, then numeric
  const clinicInfoRows = [
    byKey("clinic.doctor_name"),
    byKey("clinic.name"),
  ].filter(Boolean) as ConfigRow[];

  const slotRows = SLOT_KEY_ORDER
    .map((k) => byKey(k))
    .filter(Boolean) as ConfigRow[];

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
        {/* Doctor & clinic name */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {[...clinicInfoRows, ...featureOther].map((r) => (
            <ConfigField key={r.config_key} row={r} onChange={handleChange} />
          ))}
        </div>
        {/* Slot configuration in fixed order */}
        <div className="border-t border-slate-100 pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Slot Configuration</p>
          <div className="grid grid-cols-2 gap-4">
            {slotRows.map((r) => (
              <ConfigField key={r.config_key} row={r} onChange={handleChange} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Weekly Schedule ───────────────────────────── */}
      <WeeklyScheduleSection />

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

      {/* ── Blocked warning ───────────────────────────── */}
      {blockedMessage && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <ShieldAlert size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-[13px] font-semibold text-amber-800 mb-0.5">Slot settings locked</div>
            <div className="text-[12px] text-amber-700">{blockedMessage}</div>
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
        {saveState === "error" && !blockedMessage && (
          <span className="text-[12px] text-red-500">Some changes failed to save. Please retry.</span>
        )}
      </div>

    </div>
  );
}
