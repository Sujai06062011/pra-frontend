import { useState, useEffect, useCallback } from "react";
import {
  Save, Building2, Clock, Bell, MessageSquare, RefreshCw,
  CheckCircle, AlertCircle, Loader2, ShieldAlert, CalendarDays,
  Sun, Moon, Copy,
} from "lucide-react";
import type { ClinicScheduleResponse, ClinicScheduleDay, ClinicScheduleSession } from "../../../lib/api";

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

// ── Generic helpers ───────────────────────────────────────────────────────────

function keyLabel(key: string): string {
  return key
    .replace(/^(clinic|scheduler|feature|template)\./, "")
    .replace(/\./g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function genTimeOptions(start: string, end: string, dur: number): string[] {
  const opts: string[] = [];
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let cur = sh * 60 + sm;
  const endMin = eh * 60 + em;
  while (cur <= endMin) {
    const h = Math.floor(cur / 60);
    const mn = cur % 60;
    opts.push(`${String(h).padStart(2, "0")}:${String(mn).padStart(2, "0")}`);
    cur += dur;
  }
  return opts;
}

// ── Config (non-schedule rows) ────────────────────────────────────────────────

function useConfig() {
  const [rows, setRows] = useState<ConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/config/${DOCTOR_ID}`);
      const data = await r.json();
      // Exclude per-day schedule rows — those are managed by WeeklyScheduleSection
      setRows((data as ConfigRow[]).filter(row => !row.config_key.startsWith("clinic.schedule.")));
    } catch {
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

// ── UI sub-components ─────────────────────────────────────────────────────────

function SectionHeader({ icon, title, color }: { icon: React.ReactNode; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center`}>{icon}</div>
      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800">{title}</h3>
    </div>
  );
}

function ConfigField({ row, onChange }: { row: ConfigRow; onChange: (key: string, value: string) => void }) {
  const label = keyLabel(row.config_key);
  if (row.config_type === "boolean") {
    return (
      <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
        <div>
          <div className="text-[13px] font-medium text-slate-700">{label}</div>
          {row.description && <div className="text-[11px] text-slate-400">{row.description}</div>}
        </div>
        <input type="checkbox" checked={row.config_value === "true"}
          onChange={(e) => onChange(row.config_key, e.target.checked ? "true" : "false")}
          className="accent-emerald-500 w-4 h-4 cursor-pointer" />
      </div>
    );
  }
  if (row.config_type === "time") {
    return (
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">{label}</label>
        <input type="time" value={row.config_value} onChange={(e) => onChange(row.config_key, e.target.value)}
          className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 bg-white" />
        {row.description && <p className="text-[11px] text-slate-400 mt-1">{row.description}</p>}
      </div>
    );
  }
  if (row.config_type === "string" && row.config_key.startsWith("template.")) {
    return (
      <div className="col-span-2">
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">{label}</label>
        <textarea rows={5} value={row.config_value} onChange={(e) => onChange(row.config_key, e.target.value)}
          className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 bg-white font-mono resize-y" />
        {row.description && <p className="text-[11px] text-slate-400 mt-1">{row.description}</p>}
      </div>
    );
  }
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">{label}</label>
      <input value={row.config_value} onChange={(e) => onChange(row.config_key, e.target.value)}
        className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 bg-white" />
      {row.description && <p className="text-[11px] text-slate-400 mt-1">{row.description}</p>}
    </div>
  );
}

// ── Weekly Schedule Section ───────────────────────────────────────────────────

const DAYS_META = [
  { key: "monday",    label: "Mon", full: "Monday" },
  { key: "tuesday",  label: "Tue", full: "Tuesday" },
  { key: "wednesday",label: "Wed", full: "Wednesday" },
  { key: "thursday", label: "Thu", full: "Thursday" },
  { key: "friday",   label: "Fri", full: "Friday" },
  { key: "saturday", label: "Sat", full: "Saturday" },
  { key: "sunday",   label: "Sun", full: "Sunday" },
];

function TimeDropdown({
  value, onChange, options, disabled,
}: {
  value: string; onChange: (v: string) => void; options: string[]; disabled?: boolean;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
      className="px-2.5 py-1.5 text-[12px] border border-slate-200 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed min-w-[96px]">
      {options.map(o => <option key={o} value={o}>{fmt12(o)}</option>)}
    </select>
  );
}

function SessionRow({
  label, icon, session, boundary, duration, onChange, disabled,
}: {
  label: string;
  icon: React.ReactNode;
  session: ClinicScheduleSession;
  boundary: { start: string; end: string };
  duration: number;
  onChange: (updates: Partial<ClinicScheduleSession>) => void;
  disabled?: boolean;
}) {
  const startOpts = genTimeOptions(boundary.start, boundary.end, duration).slice(0, -1);
  const endOpts = genTimeOptions(boundary.start, boundary.end, duration).filter(o => o > session.start);

  const startOutOfBounds = session.enabled && session.start < boundary.start;
  const endOutOfBounds = session.enabled && session.end > boundary.end;
  const hasError = startOutOfBounds || endOutOfBounds;

  return (
    <div className={`flex flex-col gap-1.5 ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        <button type="button"
          onClick={() => onChange({ enabled: !session.enabled })}
          className={`ml-auto px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border transition-colors ${
            session.enabled
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200"
          }`}>
          {session.enabled ? "On" : "Off"}
        </button>
      </div>
      {session.enabled ? (
        <div className="flex items-center gap-2 flex-wrap">
          <TimeDropdown value={session.start} onChange={v => onChange({ start: v })} options={startOpts} />
          <span className="text-[11px] text-slate-400">–</span>
          <TimeDropdown value={session.end} onChange={v => onChange({ end: v })} options={endOpts} />
          {hasError && (
            <span className="text-[11px] text-rose-500">
              Cannot exceed clinic hours {fmt12(boundary.start)}–{fmt12(boundary.end)}
            </span>
          )}
        </div>
      ) : (
        <span className="text-[11px] text-slate-400 pl-1">Not available</span>
      )}
    </div>
  );
}

function DayRow({
  dayMeta, dayData, boundaries, duration, onChange, onCopyToWeekdays,
}: {
  dayMeta: typeof DAYS_META[0];
  dayData: ClinicScheduleDay;
  boundaries: ClinicScheduleResponse["boundaries"];
  duration: number;
  onChange: (updates: Partial<ClinicScheduleDay> | { morning?: Partial<ClinicScheduleSession>; evening?: Partial<ClinicScheduleSession> }) => void;
  onCopyToWeekdays: () => void;
}) {
  const isWeekday = !["saturday", "sunday"].includes(dayMeta.key);

  return (
    <div className={`rounded-xl border p-3.5 transition-all ${dayData.enabled ? "bg-white border-slate-100" : "bg-slate-50 border-slate-100"}`}>
      {/* Row header */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[13px] font-bold text-slate-700 w-9">{dayMeta.label}</span>
        <button type="button"
          onClick={() => onChange({ enabled: !dayData.enabled })}
          className={`px-3 py-1 rounded-lg text-[12px] font-semibold border transition-colors ${
            dayData.enabled
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
          }`}>
          {dayData.enabled ? "Open" : "Closed"}
        </button>

        {dayData.enabled && isWeekday && (
          <button type="button" onClick={onCopyToWeekdays}
            className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-emerald-600 transition-colors">
            <Copy size={11} /> Copy to all weekdays
          </button>
        )}
        {dayData.enabled && !isWeekday && (
          <span className="ml-auto text-[11px] text-slate-400">{dayMeta.full}</span>
        )}
      </div>

      {dayData.enabled ? (
        <div className="grid grid-cols-2 gap-4 pl-12">
          <SessionRow
            label="Morning" icon={<Sun size={12} className="text-amber-500" />}
            session={dayData.morning}
            boundary={{ start: boundaries.morning_start, end: boundaries.morning_end }}
            duration={duration}
            onChange={updates => onChange({ morning: { ...dayData.morning, ...updates } })}
          />
          <SessionRow
            label="Evening" icon={<Moon size={12} className="text-indigo-500" />}
            session={dayData.evening}
            boundary={{ start: boundaries.evening_start, end: boundaries.evening_end }}
            duration={duration}
            onChange={updates => onChange({ evening: { ...dayData.evening, ...updates } })}
          />
        </div>
      ) : (
        <p className="pl-12 text-[12px] text-slate-400">Clinic closed on {dayMeta.full}s</p>
      )}
    </div>
  );
}

function WeeklyScheduleSection() {
  const [remote, setRemote] = useState<ClinicScheduleResponse | null>(null);
  const [local, setLocal]   = useState<ClinicScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveMsg, setSaveMsg] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/clinic/schedule?doctor_id=${DOCTOR_ID}`)
      .then(r => r.json())
      .then((d: ClinicScheduleResponse) => {
        setRemote(d);
        setLocal(JSON.parse(JSON.stringify(d)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateLocal = (updates: Partial<ClinicScheduleResponse>) => {
    if (!local) return;
    setLocal({ ...local, ...updates });
    setSaveState("idle");
  };

  const updateDay = (dayKey: string, updates: Partial<ClinicScheduleDay>) => {
    if (!local) return;
    setLocal({
      ...local,
      schedule: { ...local.schedule, [dayKey]: { ...local.schedule[dayKey], ...updates } },
    });
    setSaveState("idle");
  };

  const copyToWeekdays = (srcKey: string) => {
    if (!local) return;
    const src = local.schedule[srcKey];
    const newSchedule = { ...local.schedule };
    ["monday","tuesday","wednesday","thursday","friday"].forEach(d => {
      newSchedule[d] = {
        ...newSchedule[d],
        morning: { ...src.morning },
        evening: { ...src.evening },
      };
    });
    setLocal({ ...local, schedule: newSchedule });
    setSaveState("idle");
  };

  const handleSave = async () => {
    if (!local) return;
    setSaveState("saving");
    setSaveMsg("");
    try {
      const r = await fetch(`${API_BASE}/clinic/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_id: DOCTOR_ID,
          slot_duration_minutes: local.slot_duration_minutes,
          max_per_slot: local.max_per_slot,
          schedule: local.schedule,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || "Save failed");
      }
      const updated: ClinicScheduleResponse = await r.json();
      setRemote(updated);
      setLocal(JSON.parse(JSON.stringify(updated)));
      setSaveState("saved");
      setSaveMsg("Weekly schedule saved.");
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (e) {
      setSaveState("error");
      setSaveMsg(e instanceof Error ? e.message : "Save failed");
    }
  };

  const handleReset = () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    if (!local) return;
    const b = local.boundaries;
    const newSchedule: Record<string, ClinicScheduleDay> = {};
    DAYS_META.forEach(({ key }) => {
      const open = key !== "sunday";
      newSchedule[key] = {
        enabled: open,
        morning: { enabled: open, start: b.morning_start, end: b.morning_end },
        evening: { enabled: open, start: b.evening_start, end: b.evening_end },
      };
    });
    setLocal({ ...local, schedule: newSchedule });
    setConfirmReset(false);
    setSaveState("idle");
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

  if (!local) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <SectionHeader
        icon={<CalendarDays size={16} className="text-teal-600" />}
        title="Weekly Schedule"
        color="bg-teal-50"
      />
      <p className="text-[12px] text-slate-400 mb-5 -mt-2">
        Set default clinic hours per day. These apply to all future dates unless overridden in Availability.
      </p>

      {/* Global settings */}
      <div className="flex items-center gap-6 mb-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Slot Duration</label>
          <div className="flex items-center gap-2">
            <select
              value={local.slot_duration_minutes}
              onChange={e => updateLocal({ slot_duration_minutes: Number(e.target.value) })}
              className="px-3 py-1.5 text-[13px] border border-slate-200 rounded-xl text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              {[5, 10, 15, 20, 30].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <span className="text-[12px] text-slate-500">minutes</span>
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Max Per Slot</label>
          <div className="flex items-center gap-2">
            <select
              value={local.max_per_slot}
              onChange={e => updateLocal({ max_per_slot: Number(e.target.value) })}
              className="px-3 py-1.5 text-[13px] border border-slate-200 rounded-xl text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              {[1,2,3,4,5,6,7,8,9,10].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <span className="text-[12px] text-slate-500">bookings</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 ml-auto leading-relaxed">
          Boundary hours<br />
          <span className="font-semibold text-slate-600">
            Morning {fmt12(local.boundaries.morning_start)}–{fmt12(local.boundaries.morning_end)}<br />
            Evening {fmt12(local.boundaries.evening_start)}–{fmt12(local.boundaries.evening_end)}
          </span>
        </div>
      </div>

      {/* Per-day rows */}
      <div className="space-y-2">
        {DAYS_META.map(dm => (
          <DayRow
            key={dm.key}
            dayMeta={dm}
            dayData={local.schedule[dm.key]}
            boundaries={local.boundaries}
            duration={local.slot_duration_minutes}
            onChange={updates => updateDay(dm.key, updates as Partial<ClinicScheduleDay>)}
            onCopyToWeekdays={() => copyToWeekdays(dm.key)}
          />
        ))}
      </div>

      {/* Save message */}
      {saveState !== "idle" && saveMsg && (
        <div className={`mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium ${
          saveState === "saved"
            ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
            : "bg-rose-50 border border-rose-200 text-rose-700"
        }`}>
          {saveState === "saved" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {saveMsg}
        </div>
      )}

      {/* Footer */}
      <div className="mt-5 flex items-center gap-4 flex-wrap">
        <button onClick={handleSave} disabled={saveState === "saving"}
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-colors">
          {saveState === "saving" ? <Loader2 size={14} className="animate-spin" />
            : saveState === "saved" ? <CheckCircle size={14} />
            : saveState === "error" ? <AlertCircle size={14} />
            : <Save size={14} />}
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved!" : saveState === "error" ? "Error — retry" : "Save Weekly Schedule"}
        </button>

        {!confirmReset ? (
          <button onClick={() => setConfirmReset(true)}
            className="text-[13px] text-slate-400 hover:text-slate-600 transition-colors underline-offset-2 hover:underline">
            Reset to Default
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            <span className="text-[12px] text-rose-700">Reset Mon–Sat to full hours, Sun to closed?</span>
            <button onClick={handleReset} className="text-[12px] font-semibold text-rose-600 hover:text-rose-800">Yes, reset</button>
            <button onClick={() => setConfirmReset(false)} className="text-[12px] text-slate-500 hover:text-slate-700">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Settings component ───────────────────────────────────────────────────

export function Settings() {
  const { rows, loading, error, reload } = useConfig();
  const [localRows, setLocalRows] = useState<ConfigRow[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [reloadState, setReloadState] = useState<SaveState>("idle");
  const [blockedMessage, setBlockedMessage] = useState("");

  useEffect(() => { setLocalRows(rows); }, [rows]);

  const handleChange = (key: string, value: string) => {
    setLocalRows(prev => prev.map(r => r.config_key === key ? { ...r, config_value: value } : r));
    setSaveState("idle");
    setBlockedMessage("");
  };

  const handleSave = async () => {
    setSaveState("saving");
    setBlockedMessage("");
    const original = rows.reduce<Record<string, string>>((acc, r) => { acc[r.config_key] = r.config_value; return acc; }, {});
    const changed = localRows.filter(r => r.config_value !== original[r.config_key]);

    const results = await Promise.all(changed.map(r => saveKey(r.config_key, r.config_value)));
    const blocked = results.find((r): r is { ok: false; blocked: string } => !r.ok && !!("blocked" in r && r.blocked));
    if (blocked) {
      setSaveState("error");
      setBlockedMessage(blocked.blocked!);
      return;
    }
    const allOk = results.every(r => r.ok);
    setSaveState(allOk ? "saved" : "error");
    if (allOk) { await reload(); setTimeout(() => setSaveState("idle"), 2500); }
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
  if (error) return <div className="p-7 text-red-500 text-[13px]">{error}</div>;

  const by = (prefix: string) => localRows.filter(r => r.config_key.startsWith(prefix));
  const byKey = (key: string) => localRows.find(r => r.config_key === key);

  const clinicInfoRows = [byKey("clinic.doctor_name"), byKey("clinic.name")].filter(Boolean) as ConfigRow[];
  const featureOther    = by("feature.").filter(r => r.config_type !== "boolean");
  const schedulerRows   = by("scheduler.");
  const featureFlagRows = by("feature.").filter(r => r.config_type === "boolean");
  const templateRows    = by("template.");

  return (
    <div className="p-7 space-y-6 max-w-3xl">

      {/* ── Clinic Information ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <SectionHeader icon={<Building2 size={16} className="text-emerald-600" />} title="Clinic Information" color="bg-emerald-50" />
        <div className="grid grid-cols-2 gap-4">
          {[...clinicInfoRows, ...featureOther].map(r => (
            <ConfigField key={r.config_key} row={r} onChange={handleChange} />
          ))}
        </div>
      </div>

      {/* ── Weekly Schedule (merged) ───────────────────── */}
      <WeeklyScheduleSection />

      {/* ── Scheduler Timings ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <SectionHeader icon={<Clock size={16} className="text-blue-600" />} title="Scheduler Timings (IST)" color="bg-blue-50" />
        <div className="grid grid-cols-2 gap-4">
          {schedulerRows.map(r => <ConfigField key={r.config_key} row={r} onChange={handleChange} />)}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
          <button onClick={handleReloadScheduler} disabled={reloadState === "saving"}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-[13px] font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors">
            {reloadState === "saving" ? <Loader2 size={14} className="animate-spin" />
              : reloadState === "saved" ? <CheckCircle size={14} />
              : reloadState === "error" ? <AlertCircle size={14} />
              : <RefreshCw size={14} />}
            {reloadState === "saving" ? "Reloading…" : reloadState === "saved" ? "Reloaded!" : reloadState === "error" ? "Error" : "Reload Scheduler"}
          </button>
          <span className="text-[11px] text-slate-400">Save first, then reload scheduler to apply timing changes.</span>
        </div>
      </div>

      {/* ── Feature Flags ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <SectionHeader icon={<Bell size={16} className="text-violet-600" />} title="Feature Flags" color="bg-violet-50" />
        <div className="space-y-1">
          {featureFlagRows.map(r => <ConfigField key={r.config_key} row={r} onChange={handleChange} />)}
        </div>
      </div>

      {/* ── Message Templates ─────────────────────────── */}
      {templateRows.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <SectionHeader icon={<MessageSquare size={16} className="text-amber-600" />} title="Message Templates" color="bg-amber-50" />
          <p className="text-[11px] text-slate-400 mb-4">
            Use <code className="bg-slate-100 px-1 rounded">{"{name}"}</code>,{" "}
            <code className="bg-slate-100 px-1 rounded">{"{clinic}"}</code>,{" "}
            <code className="bg-slate-100 px-1 rounded">{"{doctor}"}</code>,{" "}
            <code className="bg-slate-100 px-1 rounded">{"{diagnosis}"}</code>,{" "}
            <code className="bg-slate-100 px-1 rounded">{"{review_link}"}</code> as placeholders.
          </p>
          <div className="grid grid-cols-1 gap-4">
            {templateRows.map(r => <ConfigField key={r.config_key} row={r} onChange={handleChange} />)}
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

      {/* ── Save Button (non-schedule rows) ───────────── */}
      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={saveState === "saving"}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-[13px] font-semibold px-6 py-2.5 rounded-xl shadow-sm shadow-emerald-200 transition-colors">
          {saveState === "saving" ? <Loader2 size={15} className="animate-spin" />
            : saveState === "saved" ? <CheckCircle size={15} />
            : saveState === "error" ? <AlertCircle size={15} />
            : <Save size={15} />}
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved!" : saveState === "error" ? "Save failed" : "Save Settings"}
        </button>
        {saveState === "error" && !blockedMessage && (
          <span className="text-[12px] text-red-500">Some changes failed to save. Please retry.</span>
        )}
      </div>

    </div>
  );
}
