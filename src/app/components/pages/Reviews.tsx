import { Star, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useReviews } from "../../../hooks/usePRAData";

const avatarColors = [
  "from-rose-400 to-pink-500", "from-teal-400 to-cyan-500", "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500", "from-indigo-400 to-violet-500", "from-violet-400 to-purple-500",
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
  const { data: reviews, loading, error, refetch } = useReviews();

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length
    : 0;

  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    stars: `${star}★`,
    count: reviews.filter(r => r.rating === star).length,
    fill: star >= 4 ? "#10b981" : star === 3 ? "#f59e0b" : "#f43f5e",
  }));

  return (
    <div className="p-7 space-y-6">
      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <span className="text-[13px] text-rose-700 flex-1">Failed to load reviews.</span>
          <button onClick={refetch} className="flex items-center gap-1 text-[12px] font-semibold text-rose-600">
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="flex flex-col sm:grid sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white shadow-lg shadow-amber-200 sm:col-span-1 flex flex-col items-center justify-center text-center">
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 52, lineHeight: 1 }}>
            {loading ? "…" : avgRating.toFixed(1)}
          </div>
          <Stars n={Math.round(avgRating)} size={16} />
          <div className="text-sm opacity-80 mt-2">Overall Rating</div>
          <div className="text-xs opacity-70 mt-0.5">{loading ? "…" : reviews.length} reviews</div>
        </div>

        {/* Rating distribution */}
        <div className="sm:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }} className="text-slate-800 mb-4">Rating Breakdown</h3>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={ratingDist} layout="vertical" barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="stars" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={25} />
              <Tooltip formatter={(v) => [v, "Reviews"]} />
              <Bar dataKey="count" name="Reviews" radius={[0, 4, 4, 0]} fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="sm:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col justify-center gap-2">
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28 }} className="text-slate-800">
            {loading ? "…" : reviews.length}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Reviews</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {reviews.filter(r => (r.rating ?? 0) >= 4).length} positive · {reviews.filter(r => (r.rating ?? 0) <= 3).length} neutral/negative
          </div>
        </div>
      </div>

      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800">Recent Reviews</h3>

      {loading ? (
        <div className="text-center py-10 text-[13px] text-slate-400">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-[13px] text-slate-400">No reviews yet</div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reviews.map((r, idx) => {
          const name = r.patients?.name || "Patient";
          const color = avatarColors[idx % avatarColors.length];
          const dateStr = r.created_at
            ? new Date(r.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })
            : "—";
          return (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm`}>
                  {name[0]}
                </div>
                <div className="flex-1">
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }} className="text-slate-800">{name}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Stars n={r.rating ?? 0} size={12} />
                    <span className="text-[11px] text-slate-400">{dateStr}</span>
                  </div>
                </div>
              </div>
              {r.feedback && (
                <p className="text-[13px] text-slate-600 leading-relaxed italic">"{r.feedback}"</p>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
