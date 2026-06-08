import { MessageCircle, Send, Clock, CheckCircle2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useQueries } from "../../../hooks/usePRAData";

const avatarColors = [
  "from-emerald-400 to-teal-500", "from-rose-400 to-pink-500", "from-indigo-400 to-violet-500",
  "from-pink-400 to-rose-500", "from-amber-400 to-orange-500", "from-lime-400 to-emerald-500",
  "from-teal-400 to-cyan-500",
];

export function Queries() {
  const { data: queries, loading, error, refetch, answer } = useQueries();
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<Record<string, boolean>>({});

  const unanswered = queries.filter(q => q.status === "pending");
  const answered = queries.filter(q => q.status === "answered");

  const handleSend = async (id: string) => {
    const text = replyMap[id];
    if (!text?.trim()) return;
    setSending(m => ({ ...m, [id]: true }));
    try {
      await answer(id, text);
      setReplyMap(m => { const n = { ...m }; delete n[id]; return n; });
    } finally {
      setSending(m => ({ ...m, [id]: false }));
    }
  };

  return (
    <div className="p-7 space-y-5">
      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <span className="text-[13px] text-rose-700 flex-1">Failed to load queries.</span>
          <button onClick={refetch} className="flex items-center gap-1 text-[12px] font-semibold text-rose-600">
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-2">
        {[
          { label: "Unanswered", value: loading ? "…" : unanswered.length, cls: "bg-rose-50 border-rose-200 text-rose-700" },
          { label: "Total Queries", value: loading ? "…" : queries.length, cls: "bg-amber-50 border-amber-200 text-amber-700" },
          { label: "Answered", value: loading ? "…" : answered.length, cls: "bg-emerald-50 border-emerald-200 text-emerald-700" },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.cls}`}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 30, lineHeight: 1 }}>{s.value}</div>
            <div className="text-[11px] font-semibold mt-1 opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13 }} className="text-slate-600 uppercase tracking-wider">
        Unanswered ({loading ? "…" : unanswered.length})
      </h3>

      {loading ? (
        <div className="text-center py-8 text-[13px] text-slate-400">Loading queries…</div>
      ) : (
      <div className="space-y-3">
        {unanswered.length === 0 && (
          <div className="text-center py-6 text-[13px] text-slate-400">No pending queries</div>
        )}
        {unanswered.map((q, idx) => {
          const patientName = q.patients?.name || "Unknown";
          const color = avatarColors[idx % avatarColors.length];
          return (
          <div key={q.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm`}>
                {patientName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }} className="text-slate-800">{patientName}</span>
                  {q.patients?.mobile && <span className="text-[11px] text-slate-400">{q.patients.mobile}</span>}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Clock size={10} /> {q.created_at ? new Date(q.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : ""}
                </div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl px-4 py-3 mb-3">
              <div className="flex items-start gap-2">
                <MessageCircle size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-[13px] text-slate-700 leading-relaxed">{q.question}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                value={replyMap[q.id] || ""}
                onChange={e => setReplyMap(m => ({ ...m, [q.id]: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handleSend(q.id)}
                placeholder="Type your reply…"
                className="flex-1 px-3 py-2 text-[13px] border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 bg-white"
              />
              <button
                onClick={() => handleSend(q.id)}
                disabled={sending[q.id]}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-[13px] font-semibold rounded-xl shadow-sm transition-colors"
              >
                <Send size={13} /> Send
              </button>
            </div>
          </div>
          );
        })}
      </div>
      )}

      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13 }} className="text-slate-600 uppercase tracking-wider">
        Answered ({loading ? "…" : answered.length})
      </h3>

      <div className="space-y-3">
        {answered.map((q, idx) => {
          const patientName = q.patients?.name || "Unknown";
          const color = avatarColors[idx % avatarColors.length];
          return (
          <div key={q.id} className="bg-slate-50 rounded-2xl border border-slate-100 p-5 opacity-80">
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                {patientName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-slate-700">{patientName}</span>
                  <span className="text-[11px] text-slate-400">
                    {q.created_at ? new Date(q.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" }) : ""}
                  </span>
                  <CheckCircle2 size={13} className="text-emerald-500 ml-auto" />
                </div>
                <p className="text-[12px] text-slate-500 mt-1">{q.question}</p>
              </div>
            </div>
            {q.answer && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 flex items-start gap-2">
              <CheckCircle2 size={12} className="text-emerald-600 mt-0.5 flex-shrink-0" />
              <p className="text-[12px] text-emerald-700">{q.answer}</p>
            </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}
