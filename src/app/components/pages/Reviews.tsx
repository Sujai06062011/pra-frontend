import { Star } from "lucide-react";
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const reviews = [
  { name: "Kavitha S.", rating: 5, comment: "Dr. Rajkumar was very thorough and patient. The staff was also extremely helpful. Highly recommend!", date: "03 Jun 2026", color: "from-rose-400 to-pink-500", source: "Google" },
  { name: "Ravi Shankar", rating: 5, comment: "Excellent diagnosis. He took the time to explain everything clearly to me and my family.", date: "02 Jun 2026", color: "from-teal-400 to-cyan-500", source: "WhatsApp" },
  { name: "Ananya Devi", rating: 4, comment: "Great doctor. The wait time was a bit long but the consultation was worth it.", date: "01 Jun 2026", color: "from-emerald-400 to-teal-500", source: "Google" },
  { name: "Mohammed Ali", rating: 5, comment: "Been coming here for 3 years. Always reliable, always caring. Best clinic in Coimbatore.", date: "31 May 2026", color: "from-amber-400 to-orange-500", source: "Practo" },
  { name: "Priya Patel", rating: 4, comment: "Very good experience. The receptionist was friendly and helped with my insurance queries.", date: "30 May 2026", color: "from-indigo-400 to-violet-500", source: "Google" },
  { name: "Suresh Babu", rating: 5, comment: "Quick response on WhatsApp queries too! Modern clinic with a personal touch.", date: "28 May 2026", color: "from-violet-400 to-purple-500", source: "WhatsApp" },
];

const ratingDist = [
  { stars: "5★", count: 42, fill: "#10b981" },
  { stars: "4★", count: 18, fill: "#3b82f6" },
  { stars: "3★", count: 5, fill: "#f59e0b" },
  { stars: "2★", count: 1, fill: "#f43f5e" },
  { stars: "1★", count: 0, fill: "#94a3b8" },
];

const sourceData = [
  { name: "Google", value: 38, fill: "#4285F4" },
  { name: "Practo", value: 22, fill: "#2e7d32" },
  { name: "WhatsApp", value: 28, fill: "#25D366" },
  { name: "In-Clinic", value: 12, fill: "#8b5cf6" },
];

function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} fill={i <= n ? "#f59e0b" : "none"} stroke={i <= n ? "#f59e0b" : "#d1d5db"} />
      ))}
    </div>
  );
}

export function Reviews() {
  return (
    <div className="p-7 space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white shadow-lg shadow-amber-200 col-span-1 flex flex-col items-center justify-center text-center">
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 52, lineHeight: 1 }}>4.7</div>
          <Stars n={5} size={16} />
          <div className="text-sm opacity-80 mt-2">Overall Rating</div>
          <div className="text-xs opacity-70 mt-0.5">66 reviews</div>
        </div>

        {/* Rating distribution */}
        <div className="col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }} className="text-slate-800 mb-4">Rating Breakdown</h3>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={ratingDist} layout="vertical" barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="stars" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={25} />
              <Tooltip formatter={(v) => [v, "Reviews"]} />
              <Bar dataKey="count" name="Reviews" radius={[0, 4, 4, 0]}>
                {ratingDist.map((entry, i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Source breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }} className="text-slate-800 mb-4">By Source</h3>
          <div className="space-y-3">
            {sourceData.map(s => (
              <div key={s.name}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-slate-600 font-medium">{s.name}</span>
                  <span className="text-slate-500">{s.value}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full">
                  <div className="h-full rounded-full" style={{ width: `${s.value}%`, background: s.fill }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review cards */}
      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800">Recent Reviews</h3>
      <div className="grid grid-cols-2 gap-4">
        {reviews.map((r) => (
          <div key={r.name} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm`}>
                {r.name[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }} className="text-slate-800">{r.name}</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{r.source}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Stars n={r.rating} size={12} />
                  <span className="text-[11px] text-slate-400">{r.date}</span>
                </div>
              </div>
            </div>
            <p className="text-[13px] text-slate-600 leading-relaxed italic">"{r.comment}"</p>
          </div>
        ))}
      </div>
    </div>
  );
}
