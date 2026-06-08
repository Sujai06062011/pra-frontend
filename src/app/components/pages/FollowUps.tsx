import { Phone, Calendar, CheckCircle2, Clock, AlertCircle, MessageCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useFollowUps } from "../../../hooks/usePRAData";

const avatarColors = [
  "from-rose-400 to-pink-500", "from-sky-400 to-blue-500", "from-fuchsia-400 to-purple-500",
  "from-teal-400 to-cyan-500", "from-indigo-400 to-violet-500", "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500", "from-lime-400 to-emerald-500", "from-orange-400 to-amber-500",
];

const statusConfig: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  "pending": { label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock size={11} /> },
  "no_response": { label: "No Response", cls: "bg-rose-50 text-rose-700 border-rose-200", icon: <AlertCircle size={11} /> },
  "completed": { label: "Completed", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 size={11} /> },
};

export function FollowUps() {
  const { data: followUps, loading, error, refetch, triggerWhatsapp, triggerCalls } = useFollowUps();
  const [triggering, setTriggering] = useState<string | null>(null);

  const pending = followUps.filter(f => !f.completed_at);
  const completed = followUps.filter(f => !!f.completed_at);

  const handleTrigger = async (type: "whatsapp" | "calls") => {
    setTriggering(type);
    try {
      if (type === "whatsapp") await triggerWhatsapp();
      else await triggerCalls();
    } finally {
      setTriggering(null);
    }
  };

  return (
    <div className="p-7 space-y-6">
      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <span className="text-[13px] text-rose-700 flex-1">Failed to load follow-ups.</span>
          <button onClick={refetch} className="flex items-center gap-1 text-[12px] font-semibold text-rose-600">
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 border-l-4 border-l-amber-500 p-4 shadow-sm">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border mb-2 bg-amber-50 text-amber-700 border-amber-200">
            <Clock size={11} /> Pending
          </div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, lineHeight: 1 }} className="text-slate-800">{loading ? "…" : pending.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">patients</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 border-l-4 border-l-emerald-500 p-4 shadow-sm">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border mb-2 bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle2 size={11} /> Completed
          </div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, lineHeight: 1 }} className="text-slate-800">{loading ? "…" : completed.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">patients</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col gap-2 justify-center">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Manual Triggers</div>
          <button
            onClick={() => handleTrigger("whatsapp")}
            disabled={triggering !== null}
            className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
          >
            <MessageCircle size={12} /> {triggering === "whatsapp" ? "Sending…" : "Send WhatsApp"}
          </button>
          <button
            onClick={() => handleTrigger("calls")}
            disabled={triggering !== null}
            className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50 transition-colors"
          >
            <Phone size={12} /> {triggering === "calls" ? "Calling…" : "Trigger Calls"}
          </button>
        </div>
      </div>

      {/* Follow-up list */}
      {loading ? (
        <div className="text-center py-10 text-[13px] text-slate-400">Loading follow-ups…</div>
      ) : followUps.length === 0 ? (
        <div className="text-center py-10 text-[13px] text-slate-400">No follow-ups found</div>
      ) : (
      <div className="space-y-3">
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13 }} className="text-slate-600 uppercase tracking-wider">
          Pending ({pending.length})
        </h3>
        <div className="space-y-2">
          {pending.map((f, idx) => {
            const name = f.patients?.name || "Unknown";
            const phone = f.patients?.mobile || "";
            const sc = statusConfig[f.call_status?.toLowerCase() ?? "pending"] || statusConfig["pending"];
            const color = avatarColors[idx % avatarColors.length];
            return (
              <div key={f.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm`}>
                  {name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }} className="text-slate-800">{name}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sc.cls}`}>
                      {sc.icon} {sc.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} /> Added: {f.created_at ? new Date(f.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—"}
                    </span>
                  </div>
                </div>
                <div className="text-[12px] text-slate-400">{phone}</div>
                <div className="flex gap-2 flex-shrink-0">
                  <button className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors">
                    <Phone size={12} /> Call
                  </button>
                  <button className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200">
                    <MessageCircle size={12} /> Note
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Completed section */}
        <details className="group">
          <summary className="cursor-pointer text-[13px] font-semibold text-slate-500 flex items-center gap-2 select-none py-1">
            <CheckCircle2 size={14} className="text-emerald-500" />
            Completed ({completed.length})
            <span className="text-slate-300 group-open:hidden">▸ show</span>
            <span className="text-slate-300 hidden group-open:inline">▾ hide</span>
          </summary>
          <div className="mt-2 space-y-2">
            {completed.map((f, idx) => {
              const name = f.patients?.name || "Unknown";
              const color = avatarColors[idx % avatarColors.length];
              return (
              <div key={f.id} className="bg-slate-50 rounded-xl border border-slate-100 p-4 flex items-center gap-4 opacity-75">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                  {name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-medium text-slate-600">{name}</span>
                  {f.response_notes && (
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">"{f.response_notes}"</div>
                  )}
                </div>
                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
              </div>
              );
            })}
          </div>
        </details>
      </div>
      )}
    </div>
  );
}
