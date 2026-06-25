import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Search, Calendar, CheckCircle2, Ban, Video, Building2 } from "lucide-react";
import { api } from "../../../lib/api";
import type { Patient, SlotInfo, BookingResult, SlotsResponse, OnlineSlot, OnlineSlotsResponse } from "../../../lib/api";

const DOCTOR_ID = "8c33abe0-5d2e-4613-9437-c7c375e8d162";

type Step = "select-patient" | "book-slot" | "success";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function formatDateLabel(iso: string) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function SlotGrid({
  slots,
  section,
  selected,
  onSelect,
}: {
  slots: SlotInfo[];
  section: "morning" | "evening";
  selected: string;
  onSelect: (t: string) => void;
}) {
  if (slots.length === 0) return null;
  const label = section === "morning" ? "🌅 Morning" : "🌆 Evening";

  function fmtTime(t: string) {
    const [hStr, mStr] = t.split(":");
    const h = parseInt(hStr);
    const h12 = h % 12 || 12;
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h12}:${mStr} ${ampm}`;
  }
  const firstTime = slots[0].time;
  // end = last slot time + slot duration; approximate by last slot's display
  const lastTime = slots[slots.length - 1].time;
  const range = `${fmtTime(firstTime)} – ${fmtTime(lastTime)}`;

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[13px] font-semibold text-slate-700">{label}</span>
        <span className="text-[11px] text-slate-400">{range}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {slots.map((slot, i) => {
          const isSelected = selected === slot.time;
          const isPast = !!slot.past;
          const isBooked = !slot.available && !isPast;
          const isDisabled = isPast || isBooked;
          const tokenLabel = `${section === "morning" ? "M" : "E"}${i + 1}`;
          const bg = isDisabled
            ? "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed opacity-50"
            : isSelected
            ? "bg-emerald-500 text-white border-emerald-500 shadow-md"
            : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400 cursor-pointer";

          return (
            <button
              key={slot.time}
              disabled={isDisabled}
              title={isPast ? "This time has already passed" : isBooked ? "This slot is fully booked" : `Token ${tokenLabel}`}
              onClick={isDisabled ? undefined : () => onSelect(slot.time)}
              className={`flex flex-col items-center px-3 py-2 rounded-xl border text-[12px] font-semibold transition-all min-w-[64px] ${bg}`}
            >
              <span>{slot.display}</span>
              <span className={`text-[10px] mt-0.5 font-bold ${isDisabled ? "text-gray-400" : isSelected ? "text-emerald-100" : "text-emerald-500"}`}>
                {isPast ? "Past" : isBooked ? "Booked" : tokenLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OnlineSlotSection({
  label,
  slots,
  globalIndex,
  selected,
  onSelect,
}: {
  label: string;
  slots: OnlineSlot[];
  globalIndex: number; // starting O-token offset
  selected: string;
  onSelect: (t: string) => void;
}) {
  if (slots.length === 0) return null;
  const range = `${slots[0].display} – ${slots[slots.length - 1].display}`;
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[13px] font-semibold text-blue-700">{label}</span>
        <span className="text-[11px] text-slate-400">{range}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {slots.map((slot, i) => {
          const isSelected = selected === slot.time;
          const isDisabled = !slot.available || slot.past;
          const tokenLabel = `O${globalIndex + i + 1}`;
          const bg = isDisabled
            ? "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed opacity-50"
            : isSelected
            ? "bg-blue-600 text-white border-blue-600 shadow-md"
            : "bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400 cursor-pointer";
          return (
            <button
              key={slot.time}
              disabled={isDisabled}
              title={slot.past ? "Passed" : !slot.available ? "Booked" : `Token ${tokenLabel}`}
              onClick={isDisabled ? undefined : () => onSelect(slot.time)}
              className={`flex flex-col items-center px-3 py-2 rounded-xl border text-[12px] font-semibold transition-all min-w-[64px] ${bg}`}
            >
              <span>{slot.display}</span>
              <span className={`text-[10px] mt-0.5 font-bold ${isDisabled ? "text-gray-400" : isSelected ? "text-blue-100" : "text-blue-500"}`}>
                {slot.past ? "Past" : !slot.available ? "Booked" : tokenLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function NewAppointment({
  patientId: patientIdProp = "",
  onNavigate,
  onRegisterPatient,
}: {
  patientId?: string;
  onNavigate?: (page: import("../Sidebar").Page) => void;
  onRegisterPatient?: () => void;
} = {}) {
  const params = new URLSearchParams(window.location.search);
  const presetPatientId = patientIdProp || params.get("patient_id") || "";

  const [step, setStep] = useState<Step>(presetPatientId ? "book-slot" : "select-patient");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Booking step state
  const [dateMode, setDateMode] = useState<"today" | "tomorrow" | "other">("today");
  const [customDate, setCustomDate] = useState("");
  const [consultType, setConsultType] = useState<"in_clinic" | "online">("in_clinic");
  const [onlineEnabled, setOnlineEnabled] = useState(false);
  const [slotsResponse, setSlotsResponse] = useState<SlotsResponse | null>(null);
  const [onlineSlotsResponse, setOnlineSlotsResponse] = useState<OnlineSlotsResponse | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [visitType, setVisitType] = useState("New Visit");
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState("");
  const [result, setResult] = useState<BookingResult | null>(null);
  const slotsCache = useRef<Record<string, SlotsResponse>>({});
  const onlineSlotsCache = useRef<Record<string, OnlineSlotsResponse>>({});

  const appointmentDate =
    dateMode === "today" ? todayStr() :
    dateMode === "tomorrow" ? tomorrowStr() :
    customDate;

  // Load doctor's online settings
  useEffect(() => {
    api.doctors.getOnlineSettings(DOCTOR_ID)
      .then(s => setOnlineEnabled(!!s.online_consultation_enabled))
      .catch(() => {});
  }, []);

  // Load preset patient
  useEffect(() => {
    if (presetPatientId) {
      api.patients.get(presetPatientId).then(p => setSelectedPatient(p)).catch(() => {});
    }
  }, [presetPatientId]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (search.length < 2) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.patients.list(DOCTOR_ID, search);
        setSearchResults(res);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 300);
  }, [search]);

  // Load slots when date or consult type changes
  useEffect(() => {
    if (!appointmentDate || step !== "book-slot") return;
    setSelectedSlot("");
    setSlotsLoading(true);

    if (consultType === "online") {
      if (onlineSlotsCache.current[appointmentDate]) {
        setOnlineSlotsResponse(onlineSlotsCache.current[appointmentDate]);
        setSlotsLoading(false);
        return;
      }
      setOnlineSlotsResponse(null);
      api.appointments.onlineSlots(DOCTOR_ID, appointmentDate)
        .then(r => { onlineSlotsCache.current[appointmentDate] = r; setOnlineSlotsResponse(r); })
        .catch(() => {}).finally(() => setSlotsLoading(false));
    } else {
      if (slotsCache.current[appointmentDate]) {
        setSlotsResponse(slotsCache.current[appointmentDate]);
        setSlotsLoading(false);
        return;
      }
      setSlotsResponse(null);
      api.appointments.slots(DOCTOR_ID, appointmentDate)
        .then(r => { slotsCache.current[appointmentDate] = r; setSlotsResponse(r); })
        .catch(() => {}).finally(() => setSlotsLoading(false));
    }
  }, [appointmentDate, step, consultType]);

  const slots: SlotInfo[] = slotsResponse?.slots ?? [];
  const morningSlots = slots.filter(s => s.session === "morning");
  const eveningSlots = slots.filter(s => s.session === "evening");

  const handleBook = async () => {
    if (!selectedPatient) return;
    if (!selectedSlot) { setBookError("Please select a time slot"); return; }
    if (!appointmentDate) { setBookError("Please select a date"); return; }
    setBookError("");
    setBooking(true);
    try {
      const res = await api.appointments.book({
        patient_id: selectedPatient.id,
        doctor_id: DOCTOR_ID,
        appointment_date: appointmentDate,
        appointment_time: selectedSlot,
        visit_type: visitType,
        consultation_type: consultType,
      });
      setResult(res);
      setStep("success");
    } catch (e: unknown) {
      setBookError(`Booking failed: ${e instanceof Error ? e.message : "unknown error"}`);
    } finally {
      setBooking(false);
    }
  };

  const reset = () => {
    setStep("select-patient");
    setSearch("");
    setSearchResults([]);
    setSelectedPatient(null);
    setSelectedSlot("");
    setDateMode("today");
    setCustomDate("");
    setConsultType("in_clinic");
    setVisitType("New Visit");
    setResult(null);
    setBookError("");
  };

  return (
    <div className="flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg">

          {/* ── STEP 1: Select Patient ── */}
          {step === "select-patient" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }} className="text-slate-800 mb-1">
                New Appointment
              </h2>
              <p className="text-[13px] text-slate-500 mb-6">Search for an existing patient</p>

              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Search Patient</label>
              <div className="relative mb-4">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Name or mobile number..."
                  className="w-full pl-9 pr-4 py-3 text-[14px] border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
                />
                {searching && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-emerald-300 border-t-emerald-500 rounded-full animate-spin" />
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2 mb-5">
                  {searchResults.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedPatient(p); setStep("book-slot"); }}
                      className="w-full flex items-center gap-3 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-xl px-4 py-3 transition-all text-left group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0">
                        {p.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-slate-800 group-hover:text-emerald-700">{p.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {p.patient_code && <span className="font-semibold text-violet-600">{p.patient_code} · </span>}
                          {p.age ? `${p.age} yrs · ` : ""}
                          {p.gender === "Male" || p.gender === "M" ? "Male" : p.gender === "Female" || p.gender === "F" ? "Female" : p.gender || ""}
                          {p.mobile ? ` · +91 ${p.mobile}` : ""}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {search.length >= 2 && !searching && searchResults.length === 0 && (
                <div className="text-[13px] text-slate-400 text-center py-3 mb-4">No patients found for "{search}"</div>
              )}

              <div className="border-t border-slate-100 pt-5 mt-2">
                <p className="text-[12px] text-slate-400 mb-2">Patient not found?</p>
                <button
                  onClick={() => onRegisterPatient ? onRegisterPatient() : (window.location.href = "/patients/new")}
                  className="flex items-center gap-2 text-[13px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  + Register New Patient
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Book Slot ── */}
          {step === "book-slot" && selectedPatient && (
            <div className="space-y-4">
              {/* Patient card */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {selectedPatient.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-slate-800">
                    {selectedPatient.name}
                    {selectedPatient.patient_code && (
                      <span className="ml-2 text-[11px] font-semibold text-violet-600">({selectedPatient.patient_code})</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {selectedPatient.age ? `${selectedPatient.age} yrs · ` : ""}
                    {selectedPatient.gender === "M" ? "Male" : selectedPatient.gender === "F" ? "Female" : selectedPatient.gender || ""}
                    {selectedPatient.language ? ` · ${selectedPatient.language}` : ""}
                  </div>
                </div>
                {!presetPatientId && (
                  <button
                    onClick={() => { setSelectedPatient(null); setStep("select-patient"); }}
                    className="text-[12px] text-emerald-600 font-semibold hover:underline"
                  >
                    Change
                  </button>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">

                {/* Visit type: In Clinic / Online */}
                {onlineEnabled && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Consultation Type</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setConsultType("in_clinic"); setSelectedSlot(""); }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold border transition-all ${
                          consultType === "in_clinic"
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
                        }`}
                      >
                        <Building2 size={14} /> In Clinic
                      </button>
                      <button
                        onClick={() => { setConsultType("online"); setSelectedSlot(""); }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold border transition-all ${
                          consultType === "online"
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                        }`}
                      >
                        <Video size={14} /> Online Consultation
                      </button>
                    </div>
                  </div>
                )}

                {/* Date selection */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Appointment Date</label>
                  <div className="flex gap-2 flex-wrap">
                    {(["today", "tomorrow", "other"] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setDateMode(mode)}
                        className={`px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all ${
                          dateMode === mode
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
                        }`}
                      >
                        {mode === "today" ? `Today ${formatDateLabel(todayStr())}` :
                         mode === "tomorrow" ? `Tomorrow ${formatDateLabel(tomorrowStr())}` : "Other"}
                      </button>
                    ))}
                  </div>
                  {dateMode === "other" && (
                    <input
                      type="date"
                      value={customDate}
                      onChange={e => setCustomDate(e.target.value)}
                      min={todayStr()}
                      className="mt-3 w-full px-4 py-2.5 text-[14px] border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
                    />
                  )}
                </div>

                {/* Slots */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Time Slot</label>
                  {slotsLoading ? (
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="w-16 h-12 bg-slate-100 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : consultType === "online" ? (
                    onlineSlotsResponse && !onlineSlotsResponse.enabled ? (
                      <div className="text-[13px] text-slate-400">Online consultations not enabled.</div>
                    ) : onlineSlotsResponse && !onlineSlotsResponse.day_has_hours ? (
                      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                        <Ban size={16} className="text-amber-500 flex-shrink-0" />
                        <div className="text-[13px] font-semibold text-amber-700">
                          No online consultation hours for {new Date(appointmentDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long" })}
                        </div>
                      </div>
                    ) : (onlineSlotsResponse?.slots ?? []).length === 0 ? (
                      <div className="text-[13px] text-slate-400">No online slots available for this date.</div>
                    ) : (() => {
                      const allOnline = onlineSlotsResponse!.slots;
                      const morningOnline = allOnline.filter(s => s.session === "morning");
                      const eveningOnline = allOnline.filter(s => s.session !== "morning");
                      return (
                        <>
                          <OnlineSlotSection label="🌅 Morning" slots={morningOnline} globalIndex={0} selected={selectedSlot} onSelect={setSelectedSlot} />
                          <OnlineSlotSection label="🌆 Evening" slots={eveningOnline} globalIndex={morningOnline.length} selected={selectedSlot} onSelect={setSelectedSlot} />
                        </>
                      );
                    })()
                  ) : slotsResponse?.is_holiday ? (
                    <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                      <Ban size={16} className="text-rose-500 flex-shrink-0" />
                      <div>
                        <div className="text-[13px] font-semibold text-rose-700">
                          {slotsResponse.holiday_name
                            ? slotsResponse.holiday_name
                            : `Clinic is closed on ${new Date(appointmentDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long" })}s`}
                        </div>
                        <div className="text-[12px] text-rose-500 mt-0.5">No appointments available on this date</div>
                      </div>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="text-[13px] text-slate-400">No slots available for this date.</div>
                  ) : (
                    <>
                      {!slotsResponse?.morning_enabled && (
                        <div className="flex items-center gap-2 mb-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[12px] text-amber-700 font-medium">
                          <Ban size={13} className="flex-shrink-0" /> Morning session unavailable on this date
                        </div>
                      )}
                      <SlotGrid slots={morningSlots} section="morning" selected={selectedSlot} onSelect={setSelectedSlot} />
                      {!slotsResponse?.evening_enabled && (
                        <div className="flex items-center gap-2 mb-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[12px] text-amber-700 font-medium">
                          <Ban size={13} className="flex-shrink-0" /> Evening session unavailable on this date
                        </div>
                      )}
                      <SlotGrid slots={eveningSlots} section="evening" selected={selectedSlot} onSelect={setSelectedSlot} />
                    </>
                  )}
                </div>

                {/* Visit type */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Visit Type</label>
                  <div className="flex flex-wrap gap-2">
                    {["New Visit", "Follow-up", "Emergency", "Review"].map(vt => (
                      <button
                        key={vt}
                        onClick={() => setVisitType(vt)}
                        className={`px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all ${
                          visitType === vt
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
                        }`}
                      >
                        {vt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Token preview */}
                {consultType === "online" ? (
                  onlineSlotsResponse && (onlineSlotsResponse.slots.length > 0) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                      {selectedSlot ? (() => {
                        const allOnline = onlineSlotsResponse?.slots ?? [];
                        const oi = allOnline.findIndex(s => s.time === selectedSlot);
                        return (
                          <div className="text-[12px] text-blue-700 font-semibold">
                            Token will be: <span className="text-blue-800 text-[16px]">O{oi + 1}</span>
                          </div>
                        );
                      })() : (
                        <div className="text-[12px] text-blue-700 font-semibold">
                          Available Online Slots: <span className="text-blue-800">{(onlineSlotsResponse?.slots ?? []).filter(s => s.available).length}/{(onlineSlotsResponse?.slots ?? []).length}</span>
                        </div>
                      )}
                      <div className="text-[11px] text-blue-500 mt-0.5">Online Consultation · {formatDate(appointmentDate)}</div>
                    </div>
                  )
                ) : (
                  slots.length > 0 && (() => {
                    const mi = morningSlots.findIndex(s => s.time === selectedSlot);
                    const ei = eveningSlots.findIndex(s => s.time === selectedSlot);
                    const selToken = mi >= 0 ? `M${mi + 1}` : ei >= 0 ? `E${ei + 1}` : null;
                    return (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                        {selToken ? (
                          <div className="text-[12px] text-emerald-600 font-semibold">
                            Token will be: <span className="text-emerald-700 text-[16px]">{selToken}</span>
                          </div>
                        ) : (
                          <>
                            <div className="text-[12px] text-emerald-600 font-semibold">
                              Total Available Morning Tokens: <span className="text-emerald-700">{morningSlots.filter(s => s.available).length}/{morningSlots.length}</span>
                            </div>
                            <div className="text-[12px] text-emerald-600 font-semibold mt-0.5">
                              Total Available Evening Tokens: <span className="text-emerald-700">{eveningSlots.filter(s => s.available).length}/{eveningSlots.length}</span>
                            </div>
                          </>
                        )}
                        <div className="text-[11px] text-emerald-500 mt-0.5">For {formatDate(appointmentDate)}</div>
                      </div>
                    );
                  })()
                )}

                {bookError && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-[13px] text-rose-700">{bookError}</div>
                )}

                <div className="flex gap-3 pt-2">
                  {!presetPatientId && (
                    <button
                      onClick={() => { setSelectedPatient(null); setStep("select-patient"); }}
                      className="flex items-center gap-1.5 px-5 py-2.5 border border-slate-200 text-slate-600 text-[13px] font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                  )}
                  <button
                    onClick={handleBook}
                    disabled={booking || !selectedSlot || (dateMode === "other" && !customDate)}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-semibold rounded-xl shadow-sm shadow-emerald-200 transition-colors disabled:opacity-50"
                  >
                    {booking ? "Booking…" : consultType === "online" ? "Book Online & Send Link →" : "Book & Send WhatsApp →"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {step === "success" && result && selectedPatient && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }} className="text-slate-800 mb-2">
                {result?.consultation_type === "online" ? "Online Consultation Booked! 🎥" : "Appointment Booked!"}
              </h2>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left mt-6 mb-6 space-y-2">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-slate-400">Patient</span>
                  <span className="font-semibold text-slate-800">{result.patient_name}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-slate-400">Date</span>
                  <span className="font-semibold text-slate-800">{formatDate(appointmentDate)}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-slate-400">Time</span>
                  <span className="font-semibold text-slate-800">{slots.find(s => s.time === selectedSlot)?.display || selectedSlot}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-slate-400">Token</span>
                  <span className="font-bold text-emerald-600 text-[16px]">{result.display_token || `#${result.token_number}`}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-slate-400">WhatsApp</span>
                  <span className={`font-semibold ${result.whatsapp_sent ? "text-emerald-600" : "text-amber-600"}`}>
                    {result.whatsapp_sent ? "✅ Sent" : "⚠️ Not sent"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => onNavigate ? onNavigate("appointments") : (window.location.href = "/")}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-semibold rounded-xl transition-colors"
                >
                  <Calendar size={15} /> View Appointments
                </button>
                <button
                  onClick={reset}
                  className="w-full py-2.5 border border-slate-200 text-slate-600 text-[13px] font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  + Book Another Appointment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
