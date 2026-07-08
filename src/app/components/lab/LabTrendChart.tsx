import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceArea, ResponsiveContainer, ReferenceLine, Dot,
} from "recharts";

export interface TrendPoint {
  date: string;
  value: number;
  status: string;
}

interface Props {
  parameter_name: string;
  history: TrendPoint[];
  ref_low: number | null;
  ref_high: number | null;
  unit: string;
  trend_direction: string;
  trend_comment: string;
}

function statusColor(status: string): string {
  if (status.includes("Critical")) return "#ef4444";
  if (status === "High" || status === "Low") return "#f97316";
  return "#22c55e";
}

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  const color = statusColor(payload.status);
  return <circle cx={cx} cy={cy} r={5} fill={color} stroke="#fff" strokeWidth={2} />;
};

const CustomTooltip = ({ active, payload, label, unit, ref_low, ref_high }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as TrendPoint;
  const color = statusColor(d.status);
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-[12px]">
      <div className="font-semibold text-slate-700 mb-1">{label}</div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
        <span className="font-bold" style={{ color }}>{d.value} {unit}</span>
      </div>
      <div className="text-slate-500 mt-0.5">Status: {d.status}</div>
      {ref_low != null && ref_high != null && (
        <div className="text-slate-400 mt-0.5">Normal: {ref_low}–{ref_high}</div>
      )}
    </div>
  );
};

export function LabTrendChart({ parameter_name, history, ref_low, ref_high, unit, trend_direction, trend_comment }: Props) {
  if (history.length < 2) return null;

  const vals = history.map(h => h.value);
  const minVal = Math.min(...vals, ref_low ?? Infinity);
  const maxVal = Math.max(...vals, ref_high ?? -Infinity);
  const pad = (maxVal - minVal) * 0.2 || 1;
  const yMin = Math.max(0, minVal - pad);
  const yMax = maxVal + pad;

  const trendIcon = trend_direction === "rising" ? "↑" : trend_direction === "falling" ? "↓" : "→";
  const trendColor = trend_direction === "rising" ? "text-orange-500" : trend_direction === "falling" ? "text-emerald-500" : "text-slate-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-600">{parameter_name}</span>
        <span className={`text-[11px] font-medium ${trendColor}`}>{trendIcon} {trend_comment}</span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={history} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickFormatter={v => {
              const d = new Date(v);
              return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
            }}
          />
          <YAxis domain={[yMin, yMax]} tick={{ fontSize: 10, fill: "#94a3b8" }} width={40} />
          <Tooltip content={<CustomTooltip unit={unit} ref_low={ref_low} ref_high={ref_high} />} />
          {ref_low != null && ref_high != null && (
            <ReferenceArea y1={ref_low} y2={ref_high} fill="#dcfce7" fillOpacity={0.4} />
          )}
          {ref_low != null && (
            <ReferenceLine y={ref_low} stroke="#86efac" strokeDasharray="4 2" strokeWidth={1} />
          )}
          {ref_high != null && (
            <ReferenceLine y={ref_high} stroke="#86efac" strokeDasharray="4 2" strokeWidth={1} />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#6366f1"
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
