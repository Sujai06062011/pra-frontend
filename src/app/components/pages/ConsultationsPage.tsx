import { useState, useEffect, useCallback } from "react";
import {
  Video, Plus, Loader2, Clock, CheckCircle, AlertCircle,
  Send, Copy, PhoneCall, CalendarDays, Search, X,
} from "lucide-react";
import { api, type Consultation, type ConsultationStatus } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import { VideoConsultationModal } from "./VideoConsultationModal";

// ── helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

const STATUS_CONFIG: Record<ConsultationStatus, { label: string; cls: string }> = {
  scheduled:   { label: "Scheduled",       cls: "bg-slate-100 text-slate-600 border-slate-200" },
  waiting:     { label: "Patient Waiting", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  in_progress: { label: "In Progress",     cls: "bg-green-100 text-green-700 border-green-200" },
  completed:   { label: "Completed",       cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  missed:      { label: "Missed",          cls: "bg-red-100 text-red-600 border-red-200" },
  cancelled:   { label: "Cancelled",       cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

function StatusBadge({ status }: { status: ConsultationStatus }) {
  const { label, cls } = STATUS_CONFIG[status] ?? STATUS_CONFIG.scheduled;
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>
  );
}

type Tab = "today" | "upcoming" | "past";

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9000] bg-slate-800 text-white text-[13px] font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
      <CheckCircle size={15} className="text-emerald-400" /> {message}
    </div>
  );
}

// ── Consultation Card ─────────────────────────────────────────────────────────

function ConsultationCard({
  c,
  onJoin,
  onSendLink,
  onLinkCopied,
  onCancel,
  onNoShow,
}: {
  c: Consultation;
  onJoin: (c: Consultation) => void;
  onSendLink: (id: string) => void;
  onLinkCopied: () => void;
  onCancel: (id: string) => void;
  onNoShow: (id: string) => void;
}) {
  const isJoinable = c.status !== "completed" && c.status !== "cancelled" && c.status !== "missed";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        {/* Left info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <StatusBadge status={c.status} />
          </div>
          <p className="font-semibold text-slate-800 text-[14px]">{c.patients?.name ?? "—"}</p>
          <p className="text-[12px] text-slate-400 mt-0.5">{formatTime(c.scheduled_at)}</p>
          {c.chief_complaint && (
            <p className="text-[11px] text-slate-400 mt-1 italic">"{c.chief_complaint}"</p>
          )}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {c.patient_link_sent && (
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle size={11} /> Link sent
              </span>
            )}
            {c.duration_minutes && (
              <span className="text-[11px] text-slate-400">{c.duration_minutes} min call</span>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex flex-col gap-2 items-end flex-shrink-0">
          {isJoinable && (
            <button
              onClick={() => onJoin(c)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold rounded-xl shadow-md shadow-blue-200 animate-pulse transition-colors"
            >
              <PhoneCall size={14} /> Join Now
            </button>
          )}
          {(c.status === "scheduled" || c.status === "waiting") && (
            <button
              onClick={() => onSendLink(c.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 text-blue-600 text-[12px] font-medium rounded-xl hover:bg-blue-50 transition-colors"
            >
              <Send size={12} />
              {c.patient_link_sent ? "Resend Link" : "Send Link"}
            </button>
          )}
          {c.room_url && c.status !== "completed" && c.status !== "cancelled" && c.status !== "missed" && (
            <button
              onClick={() => { navigator.clipboard.writeText(c.room_url); onLinkCopied(); }}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Copy size={11} /> Copy link
            </button>
          )}
          {(c.status === "scheduled" || c.status === "waiting") && (
            <div className="flex items-center gap-2 mt-1 pt-1 border-t border-slate-100">
              <button
                onClick={() => onNoShow(c.id)}
                className="text-[11px] text-amber-600 hover:text-amber-700 font-medium transition-colors"
              >
                No Show
              </button>
              <span className="text-slate-200">|</span>
              <button
                onClick={() => onCancel(c.id)}
                className="text-[11px] text-red-500 hover:text-red-600 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── New Consultation Modal ────────────────────────────────────────────────────

function NewConsultationModal({ doctorId, onCreated, onClose }: {
  doctorId: string;
  onCreated: (msg: string) => void;
  onClose: () => void;
}) {
  const [mobile, setMobile]         = useState("");
  const [patient, setPatient]       = useState<{ id: string; name: string; mobile: string } | null>(null);
  const [searching, setSearching]   = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [complaint, setComplaint]   = useState("");
  const [sendNow, setSendNow]       = useState(true);
  const [creating, setCreating]     = useState(false);
  const [searchErr, setSearchErr]   = useState("");

  async function searchPatient() {
    if (!mobile.trim()) return;
    setSearching(true);
    setSearchErr("");
    setPatient(null);
    try {
      const results = await api.patients.search(mobile.trim());
      if (results.length === 0) {
        setSearchErr("No patient found with this mobile number.");
      } else {
        const r = results[0];
        setPatient({ id: r.patient_id, name: r.name, mobile: r.mobile });
      }
    } catch {
      setSearchErr("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  async function handleCreate() {
    if (!patient || !scheduledAt) return;
    setCreating(true);
    try {
      const res = await api.consultations.create({
        patient_id:      patient.id,
        doctor_id:       doctorId,
        scheduled_at:    new Date(scheduledAt).toISOString(),
        chief_complaint: complaint,
      });
      if (sendNow) {
        await api.consultations.sendLink(res.consultation.id);
      }
      onCreated(sendNow ? "Consultation created & link sent! ✓" : "Consultation created ✓");
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[8000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16 }} className="text-slate-800">
            New Online Consultation
          </h2>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          {/* Patient search */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
              Patient Mobile
            </label>
            <div className="flex gap-2">
              <input
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                onKeyDown={e => e.key === "Enter" && searchPatient()}
                placeholder="919047099959"
                className="flex-1 px-3 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                onClick={searchPatient}
                disabled={searching || !mobile.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-[12px] font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {searching ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                Search
              </button>
            </div>
            {searchErr && <p className="text-[11px] text-red-500 mt-1">{searchErr}</p>}
            {patient && (
              <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-[13px] font-semibold text-slate-800">{patient.name}</p>
                <p className="text-[11px] text-slate-500">{patient.mobile}</p>
              </div>
            )}
          </div>

          {/* Date & time */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* Chief complaint */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
              Chief Complaint <span className="text-slate-300 normal-case font-normal">(optional)</span>
            </label>
            <input
              value={complaint}
              onChange={e => setComplaint(e.target.value)}
              placeholder="Reason for consultation"
              className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* Send link toggle */}
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-100">
            <input
              type="checkbox"
              checked={sendNow}
              onChange={e => setSendNow(e.target.checked)}
              className="accent-blue-600 w-4 h-4"
            />
            <div>
              <p className="text-[13px] font-medium text-slate-700">Send WhatsApp link now</p>
              <p className="text-[11px] text-slate-400">Patient gets the join link immediately</p>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!patient || !scheduledAt || creating}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-[13px] font-bold transition-colors flex items-center justify-center gap-2"
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Video size={14} />}
            {creating ? "Creating…" : "Create Consultation"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ConsultationsPage() {
  const { doctorId } = useAuth();
  const [tab, setTab]                   = useState<Tab>("today");
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading]           = useState(true);
  const [toast, setToast]               = useState("");
  const [showNew, setShowNew]           = useState(false);
  const [activeConsultation, setActiveConsultation] = useState<Consultation | null>(null);
  const [dateFilter, setDateFilter]     = useState("");
  const [searchQ, setSearchQ]           = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "today") {
        const res = await api.consultations.today(doctorId);
        setConsultations(res.consultations);
      } else {
        const today = new Date().toISOString().slice(0, 10);
        const params: { status?: string; date?: string; date_from?: string; date_to?: string } = {};
        if (dateFilter) params.date = dateFilter;
        if (tab === "upcoming") {
          params.status = "scheduled,waiting,in_progress";
          if (!dateFilter) params.date_from = today;
        }
        if (tab === "past") {
          params.status = "completed,missed,cancelled,scheduled";
          if (!dateFilter) params.date_to = today;
        }
        const res = await api.consultations.list(doctorId, params);
        setConsultations(res.consultations);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [doctorId, tab, dateFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = consultations.filter(c => {
    if (!searchQ.trim()) return true;
    const q = searchQ.toLowerCase();
    return (
      (c.patients?.name || "").toLowerCase().includes(q) ||
      (c.patients?.mobile || "").toLowerCase().includes(q)
    );
  });

  async function handleCancel(id: string) {
    try {
      await api.consultations.cancel(id);
      setToast("Consultation cancelled");
      load();
    } catch { setToast("Failed to cancel"); }
  }

  async function handleNoShow(id: string) {
    try {
      await api.consultations.noShow(id);
      setToast("Marked as no show");
      load();
    } catch { setToast("Failed to mark no show"); }
  }

  async function handleSendLink(id: string) {
    try {
      await api.consultations.sendLink(id);
      setToast("WhatsApp link sent ✓");
      load();
    } catch {
      setToast("Failed to send link");
    }
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "today",    label: "Today",    icon: <CalendarDays size={13} /> },
    { key: "upcoming", label: "Upcoming", icon: <Clock size={13} /> },
    { key: "past",     label: "Past",     icon: <CheckCircle size={13} /> },
  ];

  return (
    <div className="min-h-full bg-slate-50 p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <Video size={18} className="text-white" />
            </div>
            <div>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20 }} className="text-slate-800">
                Consultations
              </h1>
              <p className="text-[12px] text-slate-400">Online video consultations via 8x8</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all ${
                tab === t.key
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-200"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search by name or mobile…"
              className="w-full pl-8 pr-3 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          {tab !== "today" && (
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="px-3 py-2 text-[13px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          )}
          {(searchQ || dateFilter) && (
            <button
              onClick={() => { setSearchQ(""); setDateFilter(""); }}
              className="flex items-center gap-1 text-[12px] text-slate-500 hover:text-slate-700 px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Video size={22} className="text-slate-400" />
            </div>
            {searchQ || dateFilter ? (
              <>
                <p className="text-[14px] font-semibold text-slate-600">No consultations match</p>
                <p className="text-[12px] text-slate-400 mt-1">Try a different search or date</p>
              </>
            ) : (
              <>
                <p className="text-[14px] font-semibold text-slate-600">
                  No {tab === "past" ? "past" : tab === "upcoming" ? "upcoming" : "today's"} consultations
                </p>
                <p className="text-[12px] text-slate-400 mt-1">
                  Create a consultation using the button above
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(c => (
              <ConsultationCard
                key={c.id}
                c={c}
                onJoin={setActiveConsultation}
                onSendLink={handleSendLink}
                onLinkCopied={() => setToast("Patient link copied ✓")}
                onCancel={handleCancel}
                onNoShow={handleNoShow}
              />
            ))}
          </div>
        )}
      </div>

      {/* New consultation modal */}
      {showNew && (
        <NewConsultationModal
          doctorId={doctorId}
          onClose={() => setShowNew(false)}
          onCreated={msg => { setShowNew(false); setToast(msg); load(); }}
        />
      )}

      {/* Video modal */}
      {activeConsultation && (
        <VideoConsultationModal
          consultation={activeConsultation}
          onClose={() => setActiveConsultation(null)}
          onComplete={() => {
            setActiveConsultation(null);
            setToast("Consultation completed ✓");
            load();
          }}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast("")} />}
    </div>
  );
}
