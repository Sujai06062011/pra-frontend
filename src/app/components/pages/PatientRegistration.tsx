import { useState, useEffect } from "react";
import { ArrowLeft, Search, CheckCircle2, Users, User, Calendar, Phone } from "lucide-react";
import { api } from "../../../lib/api";
import type { Patient } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";

type Step = "lookup" | "new-patient" | "family-member" | "success";

function calcAge(dob: string): number | null {
  if (!dob) return null;
  const born = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - born.getFullYear() -
    ((today.getMonth() * 100 + today.getDate()) < (born.getMonth() * 100 + born.getDate()) ? 1 : 0);
  return isNaN(age) ? null : age;
}

function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T | "";
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all ${
            value === opt
              ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
              : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-600"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function ProgressBar({ step }: { step: Step }) {
  const steps: Step[] = ["lookup", "new-patient", "success"];
  const familySteps: Step[] = ["lookup", "family-member", "success"];
  const isFam = step === "family-member";
  const active = isFam ? familySteps : steps;
  const labels = ["Mobile Lookup", isFam ? "Family Member" : "Patient Details", "Success"];
  const currentIdx = active.indexOf(step);

  return (
    <div className="flex items-center gap-3 mb-8">
      {labels.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-all ${
              i < currentIdx
                ? "bg-emerald-500 text-white"
                : i === currentIdx
                ? "bg-emerald-500 text-white ring-4 ring-emerald-100"
                : "bg-slate-200 text-slate-500"
            }`}
          >
            {i < currentIdx ? "✓" : i + 1}
          </div>
          <span
            className={`text-[12px] font-semibold ${
              i === currentIdx ? "text-slate-800" : "text-slate-400"
            }`}
          >
            {label}
          </span>
          {i < labels.length - 1 && (
            <div className={`flex-1 h-0.5 w-8 ${i < currentIdx ? "bg-emerald-400" : "bg-slate-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export function PatientRegistration({
  onNavigate,
  onBookAppointment,
}: {
  onNavigate?: (page: import("../Sidebar").Page) => void;
  onBookAppointment?: (patientId: string) => void;
} = {}) {
  const { doctorId: DOCTOR_ID } = useAuth();
  const [step, setStep] = useState<Step>("lookup");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobile, setMobile] = useState(""); // kept for registration form
  const [searching, setSearching] = useState(false);
  const [lookupResult, setLookupResult] = useState<Patient[] | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [familyHead, setFamilyHead] = useState<Patient | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "Other" | "">("");
  const [language, setLanguage] = useState<"Tamil" | "English" | "Hindi" | "">("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [relationship, setRelationship] = useState<"Spouse" | "Son" | "Daughter" | "Parent" | "Other" | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [registeredPatient, setRegisteredPatient] = useState<Patient | null>(null);

  const age = calcAge(dob);

  const handleLookup = async () => {
    const q = searchQuery.trim();
    if (!q) { setLookupError("Enter a name, mobile number, or patient code"); return; }
    setLookupError("");
    setSearching(true);
    try {
      const isPhoneSearch = /^\d[\d\s\-+()]{6,}$/.test(q);
      let results: Patient[];
      if (isPhoneSearch) {
        const digits = q.replace(/\D/g, "");
        results = await api.patients.lookup(digits);
        setMobile(digits); // pre-fill for registration
      } else {
        results = await api.patients.list(DOCTOR_ID, q);
        setMobile(""); // clear mobile since we searched by name/code
      }
      setLookupResult(results);
    } catch {
      setLookupError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) { setSubmitError("Name is required"); return; }
    if (!dob) { setSubmitError("Date of birth is required"); return; }
    if (!gender) { setSubmitError("Gender is required"); return; }
    if (!language) { setSubmitError("Language is required"); return; }
    setSubmitError("");
    setSubmitting(true);

    const normalizedMobile = familyHead
      ? (familyHead.mobile || "").replace(/\s/g, "")
      : mobile.replace(/\s/g, "");

    try {
      const patient = await api.patients.register({
        name: name.trim(),
        mobile: normalizedMobile,
        date_of_birth: dob,
        gender,
        language,
        email: email || undefined,
        city: city || undefined,
        family_head_mobile: familyHead ? normalizedMobile : undefined,
        doctor_id: DOCTOR_ID,
      });
      setRegisteredPatient(patient);
      setStep("success");
    } catch (e: unknown) {
      setSubmitError(`Registration failed: ${e instanceof Error ? e.message : "unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSearchQuery(""); setMobile("");
    setLookupResult(null);
    setName(""); setDob(""); setGender(""); setLanguage(""); setEmail(""); setCity(""); setRelationship("");
    setFamilyHead(null);
    setStep("lookup");
  };

  return (
    <div className="flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <ProgressBar step={step} />

          {/* ── STEP 1: Mobile Lookup ── */}
          {step === "lookup" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }} className="text-slate-800 mb-1">
                Register Patient
              </h2>
              <p className="text-[13px] text-slate-500 mb-7">Search by mobile number, name, or patient code</p>

              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Search Patient
              </label>
              <div className="flex gap-2 mb-1">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setLookupResult(null); }}
                    onKeyDown={e => e.key === "Enter" && handleLookup()}
                    placeholder="Mobile number, name or patient code…"
                    className="w-full pl-9 pr-4 py-2.5 text-[14px] border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleLookup}
                  disabled={searching}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-semibold rounded-xl shadow-sm shadow-emerald-200 transition-colors disabled:opacity-50"
                >
                  {searching ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Search size={14} />
                  )}
                  Search
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mb-3 mt-1">Tip: type digits only for mobile lookup · type letters to search by name or code</p>
              {lookupError && <p className="text-[12px] text-rose-600 mb-3">{lookupError}</p>}

              {/* Results */}
              {lookupResult !== null && lookupResult.length === 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mt-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold text-[14px] mb-1">
                    <CheckCircle2 size={16} /> No patient found
                  </div>
                  <p className="text-[13px] text-emerald-600 mb-4">
                    {mobile ? "This mobile number is not registered." : "No matching patient found."} Register as a new patient?
                  </p>
                  {!mobile && (
                    <div className="mb-3">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Mobile Number (required to register)</label>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-600 flex-shrink-0">
                          <Phone size={13} className="mr-1.5 text-slate-400" /> +91
                        </div>
                        <input
                          value={mobile}
                          onChange={e => setMobile(e.target.value)}
                          placeholder="99999 99999"
                          className="flex-1 px-4 py-2 text-[13px] border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
                          maxLength={15}
                        />
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => setStep("new-patient")}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-semibold rounded-xl transition-colors"
                  >
                    Register as New Patient →
                  </button>
                </div>
              )}

              {lookupResult !== null && lookupResult.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mt-2 space-y-3">
                  <div className="flex items-center gap-2 text-blue-700 font-semibold text-[13px]">
                    <Users size={15} /> Found {lookupResult.length} patient{lookupResult.length !== 1 ? "s" : ""}
                  </div>
                  {lookupResult.map(p => (
                    <div key={p.id} className="bg-white border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0">
                        {p.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-slate-800">{p.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {p.patient_code && <span className="font-semibold text-violet-600">{p.patient_code} · </span>}
                          {p.age ? `${p.age} yrs · ` : ""}
                          {p.gender === "Male" || p.gender === "M" ? "Male" : p.gender === "Female" || p.gender === "F" ? "Female" : p.gender}
                        </div>
                        {p.mobile && <div className="text-[11px] text-slate-400 mt-0.5">{p.mobile}</div>}
                      </div>
                      <button
                        onClick={() => { setFamilyHead(p); if (p.mobile) setMobile(p.mobile.replace(/\D/g, "")); setStep("family-member"); }}
                        className="flex-shrink-0 px-3 py-1.5 border border-blue-300 text-blue-600 text-[11px] font-semibold rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
                      >
                        + Add Family
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => { setFamilyHead(null); setLookupResult(null); setStep("new-patient"); }}
                    className="w-full py-2.5 border border-emerald-400 text-emerald-600 text-[13px] font-semibold rounded-xl hover:bg-emerald-50 transition-colors"
                  >
                    + Register as New Patient
                  </button>
                  <button
                    onClick={() => { setMobile(""); setLookupResult(null); }}
                    className="w-full py-2 border border-slate-200 text-slate-600 text-[13px] font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    ← Search different number
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2A: New Patient Form ── */}
          {step === "new-patient" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }} className="text-slate-800 mb-1">
                New Patient Details
              </h2>
              {mobile ? (
                <div className="flex items-center gap-2 text-[13px] text-slate-500 mb-7">
                  <Phone size={13} className="text-emerald-500" />
                  Mobile: <span className="font-semibold text-slate-700">+91 {mobile}</span>
                </div>
              ) : (
                <div className="mb-7">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Mobile Number *</label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-600 flex-shrink-0">
                      <Phone size={13} className="mr-1.5 text-slate-400" /> +91
                    </div>
                    <input
                      value={mobile}
                      onChange={e => setMobile(e.target.value)}
                      placeholder="99999 99999"
                      className="flex-1 px-4 py-2 text-[13px] border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
                      maxLength={15}
                    />
                  </div>
                </div>
              )}

              <PatientForm
                name={name} setName={setName}
                dob={dob} setDob={setDob}
                age={age}
                gender={gender} setGender={setGender}
                language={language} setLanguage={setLanguage}
                email={email} setEmail={setEmail}
                city={city} setCity={setCity}
                error={submitError}
              />

              <div className="flex gap-3 mt-7">
                <button
                  onClick={() => { setStep("lookup"); setSubmitError(""); }}
                  className="flex items-center gap-1.5 px-5 py-2.5 border border-slate-200 text-slate-600 text-[13px] font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={handleRegister}
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-semibold rounded-xl shadow-sm shadow-emerald-200 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Registering…" : "Register Patient →"}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2B: Family Member Form ── */}
          {step === "family-member" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }} className="text-slate-800 mb-2">
                Add Family Member
              </h2>

              {familyHead && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6">
                  <div className="text-[11px] font-semibold text-blue-500 uppercase tracking-wider mb-1">Adding family member to:</div>
                  <div className="text-[13px] font-semibold text-slate-800">{familyHead.name} {familyHead.patient_code ? `(${familyHead.patient_code})` : ""}</div>
                  <div className="text-[12px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone size={11} /> +91 {familyHead.mobile}
                  </div>
                </div>
              )}

              <div className="mb-5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Relationship *</label>
                <PillGroup
                  options={["Spouse", "Son", "Daughter", "Parent", "Other"] as const}
                  value={relationship}
                  onChange={setRelationship}
                />
              </div>

              <PatientForm
                name={name} setName={setName}
                dob={dob} setDob={setDob}
                age={age}
                gender={gender} setGender={setGender}
                language={language} setLanguage={setLanguage}
                email={email} setEmail={setEmail}
                city={city} setCity={setCity}
                error={submitError}
              />

              <div className="flex gap-3 mt-7">
                <button
                  onClick={() => { setStep("lookup"); setSubmitError(""); }}
                  className="flex items-center gap-1.5 px-5 py-2.5 border border-slate-200 text-slate-600 text-[13px] font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={handleRegister}
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-semibold rounded-xl shadow-sm shadow-emerald-200 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Registering…" : "Add Family Member →"}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Success ── */}
          {step === "success" && registeredPatient && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22 }} className="text-slate-800 mb-2">
                Patient Registered Successfully!
              </h2>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left mt-6 mb-6 space-y-2">
                <div className="flex items-center gap-2 text-[13px]">
                  <User size={14} className="text-slate-400 flex-shrink-0" />
                  <span className="font-semibold text-slate-800">{registeredPatient.name}</span>
                </div>
                {registeredPatient.patient_code && (
                  <div className="flex items-center gap-2 text-[13px]">
                    <span className="text-slate-400">🪪</span>
                    <span className="font-semibold text-violet-700">{registeredPatient.patient_code}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-[13px] text-slate-600">
                  <span className="text-slate-400">🎂</span>
                  {registeredPatient.age ? `${registeredPatient.age} yrs · ` : ""}
                  {registeredPatient.gender === "M" ? "Male" : registeredPatient.gender === "F" ? "Female" : registeredPatient.gender}
                </div>
                <div className="flex items-center gap-2 text-[13px] text-slate-600">
                  <Phone size={13} className="text-slate-400" />
                  +91 {registeredPatient.mobile}
                </div>
                {registeredPatient.language && (
                  <div className="flex items-center gap-2 text-[13px] text-slate-600">
                    <span className="text-slate-400">🗣</span>
                    {registeredPatient.language}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => onBookAppointment ? onBookAppointment(registeredPatient.id) : (window.location.href = `/appointments/new?patient_id=${registeredPatient.id}`)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-semibold rounded-xl shadow-sm shadow-emerald-200 transition-colors"
                >
                  <Calendar size={15} /> Book Appointment for this patient
                </button>
                <button
                  onClick={resetForm}
                  className="w-full py-2.5 border border-slate-200 text-slate-600 text-[13px] font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  + Register Another Patient
                </button>
                <button
                  onClick={() => onNavigate ? onNavigate("patients") : (window.location.href = "/")}
                  className="w-full py-2 text-slate-400 text-[12px] hover:text-slate-600 transition-colors"
                >
                  ← Back to Patients
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Shared form fields component
function PatientForm({
  name, setName, dob, setDob, age,
  gender, setGender, language, setLanguage,
  email, setEmail, city, setCity, error,
}: {
  name: string; setName: (v: string) => void;
  dob: string; setDob: (v: string) => void;
  age: number | null;
  gender: "Male" | "Female" | "Other" | ""; setGender: (v: "Male" | "Female" | "Other") => void;
  language: "Tamil" | "English" | "Hindi" | ""; setLanguage: (v: "Tamil" | "English" | "Hindi") => void;
  email: string; setEmail: (v: string) => void;
  city: string; setCity: (v: string) => void;
  error: string;
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Full Name *</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter full name"
          className="w-full px-4 py-2.5 text-[14px] border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Date of Birth *</label>
          <input
            type="date"
            value={dob}
            onChange={e => setDob(e.target.value)}
            className="w-full px-4 py-2.5 text-[14px] border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
          />
        </div>
        <div className="w-28 flex-shrink-0">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Age</label>
          <div className="w-full px-4 py-2.5 text-[14px] border border-slate-100 rounded-xl bg-slate-50 text-slate-600">
            {age !== null ? `${age} yrs` : "—"}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Gender *</label>
        <PillGroup options={["Male", "Female", "Other"] as const} value={gender} onChange={setGender} />
      </div>

      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Language *</label>
        <PillGroup options={["Tamil", "English", "Hindi"] as const} value={language} onChange={setLanguage} />
      </div>

      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Email (optional)</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="email@example.com"
          className="w-full px-4 py-2.5 text-[14px] border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">City (optional)</label>
        <input
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="Chennai, Coimbatore..."
          className="w-full px-4 py-2.5 text-[14px] border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
        />
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-[13px] text-rose-700">
          {error}
        </div>
      )}
    </div>
  );
}
