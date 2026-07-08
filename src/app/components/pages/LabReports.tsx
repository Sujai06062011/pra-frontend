import React, { useState, useEffect, useCallback } from "react";
import {
  FlaskConical, Eye, AlertCircle, CheckCircle2, Clock,
  Upload, PlusCircle, RefreshCw, TrendingUp,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { UploadReportModal } from "../lab/UploadReportModal";
import { OrderTestModal } from "../lab/OrderTestModal";
import { ReportDetailModal } from "../lab/ReportDetailModal";

const BASE_URL = import.meta.env.VITE_API_URL as string;

interface Patient { id: string; name: string; age?: number; patient_code?: string; }

interface ReportRow {
  id: string;
  patient_name: string;
  patient_age?: number;
  test_name: string;
  lab_name?: string;
  received_date?: string;
  report_source: string;
  status: string;
  result_summary?: string;
  has_critical?: boolean;
  has_abnormal?: boolean;
  whatsapp_sent_to_patient?: boolean;
}

interface Counts {
  critical: number;
  needs_review: number;
  pending_review: number;
  reviewed: number;
  total: number;
}

interface OrderRow {
  id: string;
  test_name: string;
  test_category?: string;
  priority: string;
  lab_type: string;
  lab_name?: string;
  status: string;
  notes?: string;
  ordered_at: string;
  patients?: { name: string; age?: number; patient_code?: string };
}

type FilterTab = "all" | "my_orders" | "patient_initiated" | "preprocedure";

const STATUS_META: Record<string, { label: string; cls: string; rowCls: string; icon: React.ReactNode }> = {
  "Critical":       { label: "Critical",      cls: "bg-rose-50 text-rose-700 border-rose-200",     rowCls: "bg-rose-50/30",  icon: <AlertCircle size={11} /> },
  "Needs Review":   { label: "Needs Review",  cls: "bg-amber-50 text-amber-700 border-amber-200",  rowCls: "bg-amber-50/30", icon: <Eye size={11} /> },
  "Pending Review": { label: "Pending Review",cls: "bg-blue-50 text-blue-700 border-blue-200",     rowCls: "",               icon: <Clock size={11} /> },
  "Reviewed":       { label: "Reviewed",      cls: "bg-emerald-50 text-emerald-700 border-emerald-200", rowCls: "", icon: <CheckCircle2 size={11} /> },
};

const SOURCE_META: Record<string, { label: string; icon: string }> = {
  dashboard_upload: { label: "Upload",    icon: "📤" },
  whatsapp_patient: { label: "WhatsApp",  icon: "📱" },
  photo_ocr:        { label: "Photo",     icon: "📷" },
  inhouse_lab:      { label: "In-house",  icon: "🏥" },
};

const avatarColors = [
  "from-sky-400 to-blue-500", "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500", "from-rose-400 to-pink-500",
  "from-teal-400 to-cyan-500", "from-indigo-400 to-violet-500",
  "from-lime-400 to-emerald-500",
];

function getColor(name: string) {
  let hash = 0;
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function LabReports() {
  const { doctorId } = useAuth();

  const [reports, setReports] = useState<ReportRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [counts, setCounts] = useState<Counts>({ critical: 0, needs_review: 0, pending_review: 0, reviewed: 0, total: 0 });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");

  const [showUpload, setShowUpload] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      if (filterTab === "my_orders") {
        const data = await fetch(`${BASE_URL}/api/lab/orders?doctor_id=${doctorId}`).then(r => r.json());
        setOrders(data.orders || []);
      } else {
        const params = new URLSearchParams({ doctor_id: doctorId });
        if (filterStatus) params.set("status", filterStatus);
        if (filterTab === "patient_initiated") params.set("source", "whatsapp_patient");
        if (filterTab === "preprocedure") params.set("priority", "Pre-procedure");

        const data = await fetch(`${BASE_URL}/api/lab/reports?${params}`).then(r => r.json());
        setReports(data.reports || []);
        setCounts(data.counts || { critical: 0, needs_review: 0, pending_review: 0, reviewed: 0, total: 0 });
      }
    } catch {
      // keep existing data on error
    } finally {
      setLoading(false);
    }
  }, [doctorId, filterStatus, filterTab]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    if (!doctorId) return;
    fetch(`${BASE_URL}/patients?doctor_id=${doctorId}&limit=100`)
      .then(r => r.json())
      .then(d => setPatients(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [doctorId]);

  const TABS: { key: FilterTab; label: string }[] = [
    { key: "all",               label: "All Reports" },
    { key: "my_orders",         label: "My Orders" },
    { key: "patient_initiated", label: "Patient Initiated" },
    { key: "preprocedure",      label: "Pre-procedure" },
  ];

  const STAT_CARDS = [
    { key: "Critical",       count: counts.critical,       cls: "bg-rose-50 border-rose-200 text-rose-700",     filterKey: "Critical" },
    { key: "Needs Review",   count: counts.needs_review,   cls: "bg-amber-50 border-amber-200 text-amber-700",  filterKey: "Needs Review" },
    { key: "Pending Review", count: counts.pending_review, cls: "bg-blue-50 border-blue-200 text-blue-700",     filterKey: "Pending Review" },
    { key: "Reviewed",       count: counts.reviewed,       cls: "bg-emerald-50 border-emerald-200 text-emerald-700", filterKey: "Reviewed" },
  ];

  return (
    <div className="p-7 space-y-5">

      {/* Stat cards — clickable to filter */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map(s => (
          <button
            key={s.key}
            onClick={() => setFilterStatus(filterStatus === s.filterKey ? null : s.filterKey)}
            className={`rounded-2xl border p-4 text-left transition-all ${s.cls} ${filterStatus === s.filterKey ? "ring-2 ring-offset-2 ring-indigo-300 shadow-md" : "hover:shadow-sm"}`}
          >
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 30, lineHeight: 1 }}>
              {loading ? "—" : s.count}
            </div>
            <div className="text-[11px] font-semibold mt-1 opacity-80">{s.key}</div>
          </button>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {/* Header row */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800">
              Lab Reports
            </h3>
            <span className="text-[12px] text-slate-400">{loading ? "…" : `${counts.total} total`}</span>
            {filterStatus && (
              <button onClick={() => setFilterStatus(null)}
                className="text-[11px] text-indigo-500 hover:text-indigo-700 border border-indigo-200 bg-indigo-50 px-2 py-0.5 rounded-full">
                {filterStatus} ×
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchReports} title="Refresh"
              className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={() => setShowOrder(true)}
              className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
              <PlusCircle size={13} /> Order Test
            </button>
            <button onClick={() => setShowUpload(true)}
              className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all">
              <Upload size={13} /> Upload Report
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="px-5 border-b border-slate-100 flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setFilterTab(t.key)}
              className={`py-2.5 px-3 text-[12px] font-semibold whitespace-nowrap border-b-2 transition-all ${
                filterTab === t.key ? "border-indigo-500 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Orders table — My Orders tab */}
        {filterTab === "my_orders" && (
          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full">
              <thead>
                <tr className="bg-slate-50">
                  {["Patient", "Test", "Category", "Priority", "Lab", "Status", "Ordered"].map(h => (
                    <th key={h} className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 px-5 py-3 border-b border-slate-100">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-[13px] text-slate-400">
                    <RefreshCw size={20} className="mx-auto mb-2 animate-spin text-indigo-300" /> Loading orders…
                  </td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-[13px] text-slate-400">
                    <FlaskConical size={28} className="mx-auto mb-2 text-slate-200" /> No orders yet
                  </td></tr>
                ) : orders.map(o => {
                  const pat = o.patients;
                  const color = getColor(pat?.name || "?");
                  const priorityCls: Record<string, string> = {
                    "Routine": "bg-slate-100 text-slate-600",
                    "Urgent": "bg-amber-50 text-amber-600",
                    "STAT": "bg-rose-50 text-rose-600",
                    "Pre-procedure": "bg-blue-50 text-blue-600",
                  };
                  const statusCls: Record<string, string> = {
                    "Ordered": "bg-blue-50 text-blue-600 border-blue-200",
                    "Collected": "bg-purple-50 text-purple-600 border-purple-200",
                    "Processing": "bg-amber-50 text-amber-600 border-amber-200",
                    "Ready": "bg-emerald-50 text-emerald-600 border-emerald-200",
                    "Delivered": "bg-slate-100 text-slate-500 border-slate-200",
                  };
                  return (
                    <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white text-[12px] font-bold shadow-sm shrink-0`}>
                            {(pat?.name || "?")[0]}
                          </div>
                          <div>
                            <div className="text-[13px] font-medium text-slate-800">{pat?.name || "—"}</div>
                            {pat?.age && <div className="text-[11px] text-slate-400">{pat.age} yrs{pat.patient_code ? ` · ${pat.patient_code}` : ""}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] font-medium text-slate-700">{o.test_name}</td>
                      <td className="px-5 py-3.5 text-[12px] text-slate-500">{o.test_category || "—"}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${priorityCls[o.priority] || "bg-slate-100 text-slate-500"}`}>
                          {o.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-slate-500">{o.lab_name || (o.lab_type === "inhouse" ? "In-house" : "—")}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusCls[o.status] || "bg-slate-50 text-slate-500 border-slate-200"}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-slate-400">
                        {o.ordered_at ? new Date(o.ordered_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Reports table — all other tabs */}
        {filterTab !== "my_orders" && (
        <div className="overflow-x-auto">
          <table className="min-w-[700px] w-full">
            <thead>
              <tr className="bg-slate-50">
                {["Patient", "Test", "Source", "Lab / Received", "Result", "Status", ""].map(h => (
                  <th key={h} className="text-left text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 px-5 py-3 border-b border-slate-100">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[13px] text-slate-400">
                    <RefreshCw size={20} className="mx-auto mb-2 animate-spin text-indigo-300" />
                    Loading reports…
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[13px] text-slate-400">
                    <FlaskConical size={28} className="mx-auto mb-2 text-slate-200" />
                    No reports found
                    {filterStatus && ` with status "${filterStatus}"`}
                  </td>
                </tr>
              ) : (
                reports.map(r => {
                  const sm = STATUS_META[r.status] || STATUS_META["Pending Review"];
                  const src = SOURCE_META[r.report_source] || SOURCE_META.dashboard_upload;
                  const color = getColor(r.patient_name);
                  return (
                    <tr key={r.id}
                      onClick={() => setDetailId(r.id)}
                      className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer ${sm.rowCls}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white text-[12px] font-bold shadow-sm shrink-0`}>
                            {r.patient_name[0]}
                          </div>
                          <div>
                            <div className="text-[13px] font-medium text-slate-800">{r.patient_name}</div>
                            {r.patient_age && <div className="text-[11px] text-slate-400">{r.patient_age} yrs</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-700">
                          <FlaskConical size={12} className="text-slate-400 shrink-0" />
                          {r.test_name}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] text-slate-500">{src.icon} {src.label}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-[12px] text-slate-600">{r.lab_name || "—"}</div>
                        {r.received_date && <div className="text-[11px] text-slate-400">{r.received_date}</div>}
                      </td>
                      <td className="px-5 py-3.5 max-w-[180px]">
                        {r.result_summary ? (
                          <div className="flex items-start gap-1">
                            {r.has_critical && <AlertCircle size={11} className="text-rose-500 mt-0.5 shrink-0" />}
                            {!r.has_critical && r.has_abnormal && <TrendingUp size={11} className="text-amber-500 mt-0.5 shrink-0" />}
                            <span className={`text-[12px] line-clamp-2 ${r.has_critical ? "text-rose-600 font-semibold" : "text-slate-600"}`}>
                              {r.result_summary}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[12px] text-slate-400 italic">Awaiting review</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${sm.cls}`}>
                          {sm.icon} {sm.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setDetailId(r.id)}
                          className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-all">
                          <Eye size={11} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Modals */}
      {showUpload && doctorId && (
        <UploadReportModal
          doctorId={doctorId}
          patients={patients}
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); fetchReports(); }}
        />
      )}

      {showOrder && doctorId && (
        <OrderTestModal
          doctorId={doctorId}
          patients={patients}
          onClose={() => setShowOrder(false)}
          onSuccess={() => { setShowOrder(false); setFilterTab("my_orders"); fetchReports(); }}
        />
      )}

      {detailId && doctorId && (
        <ReportDetailModal
          reportId={detailId}
          doctorId={doctorId}
          onClose={() => setDetailId(null)}
          onUpdated={fetchReports}
        />
      )}
    </div>
  );
}
