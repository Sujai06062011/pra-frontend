import { useState, useEffect } from "react";
import {
  X, ExternalLink, MessageSquare, CheckCircle2,
  Loader2, ChevronDown, TrendingUp,
} from "lucide-react";
import { LabTrendChart } from "./LabTrendChart";

const BASE_URL = import.meta.env.VITE_API_URL as string;

interface ParamRow {
  id: string;
  parameter_name: string;
  parameter_category?: string;
  value: number;
  unit?: string;
  ref_low?: number;
  ref_high?: number;
  status: string;
}

interface TrendEntry {
  parameter_name: string;
  unit?: string;
  ref_low: number | null;
  ref_high: number | null;
  history: { date: string; value: number; status: string }[];
  trend_direction: string;
  trend_comment: string;
}

interface ReportDetail {
  report: Record<string, any>;
  patient: Record<string, any>;
  order: Record<string, any> | null;
  extracted_values: ParamRow[];
  trend: TrendEntry[];
}

interface Props {
  reportId: string;
  doctorId: string;
  onClose: () => void;
  onUpdated: () => void;
}

const STATUS_OPTS = ["Pending Review", "Needs Review", "Critical", "Reviewed"];

const statusRowCls = (status: string) => {
  if (status.includes("Critical")) return "bg-rose-50";
  if (status === "High" || status === "Low") return "bg-amber-50/60";
  return "";
};

const statusBadgeCls = (status: string) => {
  if (status.includes("Critical")) return "bg-rose-100 text-rose-700 border-rose-200";
  if (status === "High" || status === "Low") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
};

const sourceBadge: Record<string, { label: string; icon: string; cls: string }> = {
  dashboard_upload: { label: "Upload",    icon: "📤", cls: "bg-blue-50 text-blue-600 border-blue-200" },
  whatsapp_patient: { label: "WhatsApp",  icon: "📱", cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  photo_ocr:        { label: "Photo OCR", icon: "📷", cls: "bg-purple-50 text-purple-600 border-purple-200" },
  inhouse_lab:      { label: "In-house",  icon: "🏥", cls: "bg-teal-50 text-teal-600 border-teal-200" },
};

export function ReportDetailModal({ reportId, doctorId, onClose, onUpdated }: Props) {
  const [data, setData] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState(false);
  const [showTrend, setShowTrend] = useState(false);

  useEffect(() => {
    fetch(`${BASE_URL}/api/lab/reports/${reportId}?doctor_id=${doctorId}`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setStatus(d.report?.status || "Pending Review");
        setNotes(d.report?.doctor_notes || "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [reportId, doctorId]);

  const saveNotes = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await fetch(`${BASE_URL}/api/lab/reports/${reportId}?doctor_id=${doctorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctor_notes: notes }),
      });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (s: string) => {
    setStatus(s);
    await fetch(`${BASE_URL}/api/lab/reports/${reportId}?doctor_id=${doctorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s }),
    });
    onUpdated();
  };

  const markReviewed = async () => {
    await updateStatus("Reviewed");
    onClose();
  };

  const sendToPatient = async () => {
    setSending(true);
    try {
      await saveNotes();
      const r = await fetch(
        `${BASE_URL}/api/lab/reports/${reportId}/send-patient?doctor_id=${doctorId}`,
        { method: "POST" }
      );
      if (r.ok) setSentOk(true);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl p-10 flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-indigo-500 animate-spin" />
          <span className="text-[13px] text-slate-500">Loading report…</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const r = data.report;
  const pat = data.patient;
  const params = data.extracted_values || [];
  const trends = data.trend || [];
  const pdfUrl = r.pdf_url || "";
  const imgUrl = r.image_url || "";
  const src = sourceBadge[r.report_source] || sourceBadge.dashboard_upload;
  const criticalCount = params.filter(p => p.status?.includes("Critical")).length;
  const abnormalParams = params.filter(p => p.status !== "Normal");
  const normalParams   = params.filter(p => p.status === "Normal");

  const reportStatusCls: Record<string, string> = {
    "Critical":       "bg-rose-50 text-rose-700 border-rose-200",
    "Needs Review":   "bg-amber-50 text-amber-700 border-amber-200",
    "Pending Review": "bg-blue-50 text-blue-700 border-blue-200",
    "Reviewed":       "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }} className="text-slate-800">
                {r.test_name || r.report_name || "Lab Report"}
              </h2>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${src.cls}`}>
                {src.icon} {src.label}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${reportStatusCls[status] || ""}`}>
                {status}
              </span>
            </div>
            <div className="text-[12px] text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{pat.name}{pat.age ? ` · ${pat.age} yrs` : ""}{pat.gender ? ` · ${pat.gender}` : ""}</span>
              {r.lab_name && <span>· {r.lab_name}</span>}
              {r.received_date && <span>· Received {r.received_date}</span>}
            </div>
            {data.order && (
              <div className="text-[11px] text-indigo-500 mt-0.5">
                Ordered {data.order.ordered_at} · {data.order.priority}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 ml-4 shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* PDF / image */}
          {(pdfUrl || imgUrl) && (
            <div className="flex gap-2">
              {pdfUrl && (
                <a href={pdfUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-indigo-600 hover:text-indigo-800 border border-indigo-200 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                  <ExternalLink size={12} /> View Full PDF
                </a>
              )}
              {imgUrl && !pdfUrl && (
                <a href={imgUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 bg-slate-50 px-3 py-1.5 rounded-lg transition-colors">
                  <ExternalLink size={12} /> View Image
                </a>
              )}
            </div>
          )}

          {/* Summary */}
          {r.result_summary && (
            <div className="bg-slate-50 rounded-xl px-4 py-3 text-[13px] text-slate-600 border border-slate-100">
              {r.result_summary}
            </div>
          )}

          {/* Parameters table */}
          {params.length > 0 && (
            <div>
              <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Results ({params.length} parameters)
              </h3>
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {["Parameter", "Value", "Unit", "Reference", "Status"].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {params.map(p => (
                      <tr key={p.id} className={`border-b border-slate-50 ${statusRowCls(p.status)}`}>
                        <td className="px-3 py-2 font-medium text-slate-700">{p.parameter_name}</td>
                        <td className={`px-3 py-2 font-bold ${p.status.includes("Critical") ? "text-rose-600" : p.status !== "Normal" ? "text-amber-600" : "text-slate-700"}`}>
                          {p.value}
                        </td>
                        <td className="px-3 py-2 text-slate-400">{p.unit || "—"}</td>
                        <td className="px-3 py-2 text-slate-400">
                          {p.ref_low != null && p.ref_high != null ? `${p.ref_low}–${p.ref_high}` : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadgeCls(p.status)}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Trend charts */}
          {trends.length > 0 && (
            <div>
              <button
                onClick={() => setShowTrend(v => !v)}
                className="flex items-center gap-2 text-[12px] font-semibold text-indigo-600 hover:text-indigo-800 mb-3"
              >
                <TrendingUp size={14} />
                {showTrend ? "Hide" : "Show"} Trend Charts ({trends.length} parameters)
                <ChevronDown size={14} className={`transition-transform ${showTrend ? "rotate-180" : ""}`} />
              </button>
              {showTrend && (
                <div className="space-y-6 border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                  {trends.map(t => (
                    <LabTrendChart key={t.parameter_name} {...t} unit={t.unit || ""} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Doctor notes */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Doctor's Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={saveNotes}
              rows={3}
              placeholder="Add clinical notes, advice, or comments…"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
            {saving && <span className="text-[11px] text-slate-400">Saving…</span>}
          </div>

          {/* Status selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Report Status
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTS.map(s => (
                <button key={s} onClick={() => updateStatus(s)}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-all ${
                    status === s
                      ? (reportStatusCls[s] || "bg-slate-100 text-slate-600 border-slate-200") + " ring-2 ring-offset-1 ring-indigo-300"
                      : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 shrink-0">
          <button
            onClick={sendToPatient}
            disabled={sending || sentOk}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold border transition-all ${
              sentOk
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
            } disabled:opacity-70`}
          >
            {sending ? <Loader2 size={13} className="animate-spin" /> : sentOk ? <CheckCircle2 size={13} /> : <MessageSquare size={13} />}
            {sentOk ? `Sent to ${pat.name?.split(" ")[0]}` : sending ? "Sending…" : "Send Summary to Patient"}
          </button>

          <button
            onClick={markReviewed}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-[12px] font-semibold hover:bg-emerald-700 transition-colors ml-auto"
          >
            <CheckCircle2 size={13} /> Mark as Reviewed
          </button>
        </div>
      </div>
    </div>
  );
}
