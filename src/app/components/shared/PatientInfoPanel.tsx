import { useEffect, useState } from "react";
import { X, Phone, Calendar, Pill, MessageCircle, CheckCircle2 } from "lucide-react";
import { api, type Patient, type Visit, type Prescription, type Query } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

function formatMobile(mobile: string) {
  const m = mobile.replace(/\D/g, "");
  const local = m.slice(-10);
  return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
}

function ComplaintChips({ text }: { text: string }) {
  const chips = text.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {chips.map((chip, i) => (
        <span key={i} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
          {chip}
        </span>
      ))}
    </div>
  );
}

function TimingDots({ m }: { m: { morning?: boolean; afternoon?: boolean; evening?: boolean; night?: boolean } }) {
  const parts: string[] = [];
  if (m.morning)   parts.push("M");
  if (m.afternoon) parts.push("A");
  if (m.evening)   parts.push("E");
  if (m.night)     parts.push("N");
  return (
    <span className="text-[11px] font-mono font-semibold text-slate-500">
      {parts.join(" · ") || "—"}
    </span>
  );
}

interface Props {
  patientId: string;
  onClose: () => void;
}

export function PatientInfoPanel({ patientId, onClose }: Props) {
  const { doctorId } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setPatient(null);
    setVisits([]);
    setPrescriptions([]);
    setQueries([]);

    Promise.all([
      api.patients.get(patientId),
      api.visits.getByPatient(patientId),
      api.prescriptions.list(doctorId, patientId),
      api.queries.list(doctorId, patientId),
    ]).then(([pat, vis, rxs, qs]) => {
      setPatient(pat);
      setVisits(vis);
      setPrescriptions(rxs);
      setQueries(qs);
    }).catch(console.error).finally(() => setLoading(false));
  }, [patientId, doctorId]);

  return (
    <div className="w-80 flex-shrink-0 bg-white border-l border-slate-100 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13 }} className="text-slate-800">
          Patient Info
        </span>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
          <X size={15} />
        </button>
      </div>

      {loading ? (
        <div className="p-5 text-[13px] text-slate-400">Loading…</div>
      ) : !patient ? (
        <div className="p-5 text-[13px] text-slate-400">Patient not found</div>
      ) : (
        <div className="p-5 space-y-5">

          {/* ── Patient basic info ─── */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-base shadow-sm flex-shrink-0">
                {patient.name[0]}
              </div>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }} className="text-slate-800">
                  {patient.name}
                </div>
                {patient.patient_code && (
                  <div className="text-[11px] font-mono text-slate-400">{patient.patient_code}</div>
                )}
              </div>
            </div>

            <div className="text-[12px] text-slate-500 mb-2">
              {[
                patient.age ? `${patient.age} yrs` : null,
                patient.gender,
                patient.language,
              ].filter(Boolean).join(" · ")}
            </div>

            {patient.mobile && (
              <a
                href={`tel:+${patient.mobile}`}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 hover:underline"
              >
                <Phone size={11} /> {formatMobile(patient.mobile)}
              </a>
            )}

            {patient.created_at && (
              <div className="text-[11px] text-slate-400 mt-1.5">
                Registered {new Date(patient.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
              </div>
            )}
          </div>

          {/* ── Recent visits ─── */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Calendar size={12} className="text-slate-400" />
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 11 }} className="text-slate-500 uppercase tracking-wide">
                Recent Visits
              </span>
            </div>
            {visits.length === 0 ? (
              <p className="text-[12px] text-slate-400">No visits found</p>
            ) : (
              <div className="space-y-2">
                {visits.map(v => {
                  const dateStr = v.appointments?.appointment_date
                    ? new Date(v.appointments.appointment_date).toLocaleDateString("en-IN", { dateStyle: "medium" })
                    : v.visit_date
                    ? new Date(v.visit_date).toLocaleDateString("en-IN", { dateStyle: "medium" })
                    : "—";
                  return (
                    <div key={v.id} className="bg-slate-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-semibold text-slate-700">{dateStr}</span>
                        {v.appointments?.token_number && (
                          <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            #{v.appointments.token_number}
                          </span>
                        )}
                      </div>
                      {v.diagnosis && (
                        <div className="text-[11px] font-semibold text-rose-600 mb-1">🔴 {v.diagnosis}</div>
                      )}
                      {v.chief_complaint && <ComplaintChips text={v.chief_complaint} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Active prescriptions ─── */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Pill size={12} className="text-slate-400" />
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 11 }} className="text-slate-500 uppercase tracking-wide">
                Active Prescriptions
              </span>
            </div>
            {prescriptions.length === 0 ? (
              <p className="text-[12px] text-slate-400">No prescriptions</p>
            ) : (
              <div className="space-y-2">
                {prescriptions.slice(0, 2).map(rx => (
                  <div key={rx.id} className="bg-slate-50 rounded-xl p-3">
                    <div className="text-[10px] text-slate-400 mb-1.5">
                      {rx.prescription_date
                        ? new Date(rx.prescription_date).toLocaleDateString("en-IN", { dateStyle: "medium" })
                        : ""}
                    </div>
                    {(rx.prescription_medicines ?? []).slice(0, 4).map((med, i) => (
                      <div key={i} className="flex items-center justify-between py-0.5">
                        <span className="text-[12px] text-slate-700 truncate max-w-[160px]">{med.medicine_name}</span>
                        <TimingDots m={med} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Previous queries ─── */}
          {queries.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <MessageCircle size={12} className="text-slate-400" />
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 11 }} className="text-slate-500 uppercase tracking-wide">
                  Previous Queries
                </span>
              </div>
              <div className="space-y-2">
                {queries.slice(0, 4).map(q => (
                  <div key={q.id} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[11px] text-slate-600 leading-relaxed">{q.question}</p>
                    {q.reply && (
                      <div className="flex items-start gap-1 mt-1.5">
                        <CheckCircle2 size={10} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-[11px] text-emerald-700 leading-relaxed">{q.reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
