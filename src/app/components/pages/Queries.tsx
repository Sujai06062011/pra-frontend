import { MessageCircle, Send, Clock, CheckCircle2 } from "lucide-react";
import { useState } from "react";

const queries = [
  { id: 1, patient: "Ananya Devi", age: 28, query: "Doctor, I've been having mild chest pain for 2 days after the medication. Should I continue the course?", time: "2 hours ago", status: "unanswered", priority: "high", color: "from-emerald-400 to-teal-500" },
  { id: 2, patient: "Kavitha S.", age: 36, query: "My throat is still sore after 5 days of antibiotics. Should I come in again?", time: "4 hours ago", status: "unanswered", priority: "medium", color: "from-rose-400 to-pink-500" },
  { id: 3, patient: "Suresh Babu", age: 60, query: "What are the dietary restrictions I should follow with this new BP medication?", time: "Yesterday", status: "unanswered", priority: "low", color: "from-indigo-400 to-violet-500" },
  { id: 4, patient: "Lakshmi N.", age: 38, query: "Can I take the thyroid tablet at night instead of morning?", time: "Yesterday", status: "unanswered", priority: "low", color: "from-pink-400 to-rose-500" },
  { id: 5, patient: "Mohammed Ali", age: 52, query: "The knee pain is worsening. Should I take the painkiller more frequently?", time: "2 days ago", status: "unanswered", priority: "high", color: "from-amber-400 to-orange-500" },
  { id: 6, patient: "Geeta Sharma", age: 45, query: "Can I continue my exercise routine while on these vitamins?", time: "3 days ago", status: "answered", priority: "low", reply: "Yes, you can continue your exercise routine. No restrictions with Vitamin D supplements.", color: "from-lime-400 to-emerald-500" },
  { id: 7, patient: "Ravi Shankar", age: 67, query: "I feel dizzy when I get up. Is this a side effect of the blood pressure medicine?", time: "3 days ago", status: "answered", priority: "medium", reply: "This could be postural hypotension. Please rise slowly. Come in if it persists.", color: "from-teal-400 to-cyan-500" },
];

const priorityStyle: Record<string, string> = {
  high: "bg-rose-50 text-rose-600 border-rose-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-50 text-slate-500 border-slate-200",
};

export function Queries() {
  const [replyMap, setReplyMap] = useState<Record<number, string>>({});
  const unanswered = queries.filter(q => q.status === "unanswered");
  const answered = queries.filter(q => q.status === "answered");

  return (
    <div className="p-7 space-y-5">
      <div className="grid grid-cols-3 gap-3 mb-2">
        {[
          { label: "Unanswered", value: unanswered.length, cls: "bg-rose-50 border-rose-200 text-rose-700" },
          { label: "High Priority", value: unanswered.filter(q => q.priority === "high").length, cls: "bg-amber-50 border-amber-200 text-amber-700" },
          { label: "Answered Today", value: answered.length, cls: "bg-emerald-50 border-emerald-200 text-emerald-700" },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.cls}`}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 30, lineHeight: 1 }}>{s.value}</div>
            <div className="text-[11px] font-semibold mt-1 opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13 }} className="text-slate-600 uppercase tracking-wider">
        Unanswered ({unanswered.length})
      </h3>

      <div className="space-y-3">
        {unanswered.map((q) => (
          <div key={q.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${q.color} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm`}>
                {q.patient[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }} className="text-slate-800">{q.patient}</span>
                  <span className="text-[11px] text-slate-400">{q.age} yrs</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${priorityStyle[q.priority]}`}>{q.priority}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Clock size={10} /> {q.time}
                </div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl px-4 py-3 mb-3">
              <div className="flex items-start gap-2">
                <MessageCircle size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-[13px] text-slate-700 leading-relaxed">{q.query}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                value={replyMap[q.id] || ""}
                onChange={e => setReplyMap(m => ({ ...m, [q.id]: e.target.value }))}
                placeholder="Type your reply…"
                className="flex-1 px-3 py-2 text-[13px] border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 bg-white"
              />
              <button className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-semibold rounded-xl shadow-sm transition-colors">
                <Send size={13} /> Send
              </button>
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13 }} className="text-slate-600 uppercase tracking-wider">
        Answered ({answered.length})
      </h3>

      <div className="space-y-3">
        {answered.map((q) => (
          <div key={q.id} className="bg-slate-50 rounded-2xl border border-slate-100 p-5 opacity-80">
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${q.color} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                {q.patient[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-slate-700">{q.patient}</span>
                  <span className="text-[11px] text-slate-400">{q.time}</span>
                  <CheckCircle2 size={13} className="text-emerald-500 ml-auto" />
                </div>
                <p className="text-[12px] text-slate-500 mt-1">{q.query}</p>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 flex items-start gap-2">
              <CheckCircle2 size={12} className="text-emerald-600 mt-0.5 flex-shrink-0" />
              <p className="text-[12px] text-emerald-700">{q.reply}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
