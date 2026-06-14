const BASE_URL = import.meta.env.VITE_API_URL as string;

export interface Patient {
  id: string;
  doctor_id: string;
  name: string;
  mobile: string;
  age?: number;
  gender?: string;
  patient_code?: string;
  family_head_mobile?: string;
  language?: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  appointment_date: string;
  appointment_time?: string;
  token_number?: number;
  display_token?: string | null;
  queue_status?: "Waiting" | "In Progress" | "Done" | "Cancelled" | "No-Show";
  status: "Confirmed" | "In Progress" | "Completed" | "Cancelled" | "No-Show";
  patients?: Patient;
  created_at: string;
}

export interface Token {
  doctor_id: string;
  appointment_date: string;
  current_token: number;
}

export interface Medicine {
  id?: string;
  medicine_name: string;
  dosage: string;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  night: boolean;
  before_food?: boolean;
  duration_days?: number;
  instructions?: string;
}

export interface Prescription {
  id: string;
  doctor_id: string;
  patient_id: string | null;
  visit_id?: string;
  walkin_name?: string;
  walkin_age?: number;
  walkin_complaint?: string;
  walkin_diagnosis?: string;
  prescription_date?: string;
  general_notes?: string;
  precautions?: string;
  dietary_instructions?: string;
  prescription_medicines?: Medicine[];
  created_at: string;
  patients?: Pick<Patient, "name" | "mobile" | "patient_code">;
}

export interface FollowUp {
  id: string;
  doctor_id: string;
  patient_id: string;
  visit_id?: string;
  scheduled_date?: string;
  channel?: string;
  call_status?: "Pending" | "Completed";
  response_notes?: string;
  created_at: string;
  completed_at?: string | null;
  patients?: Pick<Patient, "name" | "mobile" | "language">;
}

export interface Review {
  id: string;
  doctor_id: string;
  patient_id: string;
  visit_id?: string;
  rating?: number;
  feedback?: string;
  created_at: string;
  patients?: Pick<Patient, "name" | "mobile">;
}

export interface DashboardStats {
  today_appointments: number;
  current_token: number;
  current_display_token?: string | null;
  total_patients: number;
  pending_followups: number;
  today_completed: number;
  weekly_appointments: { date: string; count: number }[];
  top_diagnoses: { diagnosis: string; count: number }[];
}

export interface QueueStatus {
  current_token: number;
  current_display?: string | null;
  total_today: number;
  waiting: number;
  completed: number;
  appointments: Appointment[];
}

export interface Doctor {
  id: string;
  name: string;
  clinic_name: string;
  whatsapp_number?: string;
  clinic_timings?: string;
  clinic_address?: string;
  email?: string;
  mobile?: string;
}

export interface VisitVitals {
  id?: string;
  visit_id?: string;
  patient_id?: string;
  doctor_id?: string;
  temperature_f?: number | string | null;
  weight_kg?: number | string | null;
  height_cm?: number | string | null;
  spo2_percent?: number | string | null;
  bp_systolic?: number | string | null;
  bp_diastolic?: number | string | null;
  pulse_bpm?: number | string | null;
  key_findings?: string | null;
  recorded_by_role?: string;
  recorded_at?: string;
  updated_at?: string;
}

export interface Visit {
  id: string;
  patient_id: string;
  doctor_id?: string;
  appointment_id?: string;
  visit_date?: string;
  chief_complaint?: string;
  symptoms?: string;
  diagnosis?: string;
  notes?: string;
  visit_status?: string;
  created_at: string;
  appointments?: { appointment_date: string; token_number: number };
}

export interface Query {
  id: string;
  doctor_id: string;
  patient_id: string;
  question: string;
  reply?: string;
  replied_at?: string;
  replied_by?: string;
  status: "Pending" | "Closed";
  priority?: string;
  created_at: string;
  patients?: Pick<Patient, "name" | "mobile" | "patient_code" | "age" | "gender" | "language" | "created_at">;
}

export interface ClinicMedicine {
  id: string;
  name: string;
  category: string;
  dosages: string[];
  form: "tablet" | "liquid" | "inhaler" | "topical" | "other";
  usage_count: number;
  is_active: boolean;
}

export interface PatientRegistrationPayload {
  name: string;
  mobile: string;
  date_of_birth: string;
  gender: string;
  language: string;
  email?: string;
  city?: string;
  family_head_mobile?: string;
  doctor_id: string;
}

export interface SlotInfo {
  time: string;
  display: string;
  session: "morning" | "evening";
  booked_count: number;
  max: number;
  past?: boolean;
  available: boolean;
}

export interface SlotsResponse {
  is_holiday: boolean;
  holiday_name: string | null;
  morning_enabled: boolean;
  evening_enabled: boolean;
  slots: SlotInfo[];
}

export interface AvailabilitySession {
  enabled: boolean;
  start: string;
  end: string;
}

export interface AvailabilityInfo {
  date: string;
  is_holiday: boolean;
  holiday_name: string | null;
  has_override: boolean;
  morning: AvailabilitySession;
  evening: AvailabilitySession;
}

export interface DaySchedule {
  day_of_week: string;
  is_closed: boolean;
  morning_enabled: boolean;
  morning_start: string;
  morning_end: string;
  evening_enabled: boolean;
  evening_start: string;
  evening_end: string;
  has_override: boolean;
}

export interface ScheduleDayPayload {
  doctor_id: string;
  day_of_week: string;
  is_closed: boolean;
  morning_enabled: boolean;
  morning_start: string | null;
  morning_end: string | null;
  evening_enabled: boolean;
  evening_start: string | null;
  evening_end: string | null;
}

export interface AvailabilityPayload {
  doctor_id: string;
  availability_date: string;
  is_holiday?: boolean;
  holiday_name?: string | null;
  morning_enabled?: boolean;
  morning_start?: string | null;
  morning_end?: string | null;
  evening_enabled?: boolean;
  evening_start?: string | null;
  evening_end?: string | null;
  reason?: string | null;
  created_by?: string | null;
}

export interface BookAppointmentPayload {
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  visit_type: string;
}

export interface BookingResult {
  appointment_id: string;
  token_number: number;
  display_token?: string | null;
  patient_name: string;
  whatsapp_sent: boolean;
}

export interface PrescriptionWritePayload {
  patient_id: string;
  doctor_id?: string;
  appointment_id?: string;
  chief_complaint: string;
  diagnosis: string;
  notes?: string;
  dietary_instructions?: string;
  precautions?: string;
  medicines: {
    medicine_name: string;
    dosage: string;
    duration_days: number;
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
    night: boolean;
    before_food: boolean;
    instructions?: string;
    sort_order: number;
  }[];
}

export interface PrescriptionWriteResult {
  prescription_id: string;
  visit_id: string;
  whatsapp_sent: boolean;
  patient_name: string;
}

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json())?.detail ?? ""; } catch { /* non-JSON error body */ }
    throw new Error(detail || `API error ${res.status}: ${path}`);
  }
  return res.json();
}

export const api = {
  dashboard: {
    getStats: (doctorId: string) =>
      req<DashboardStats>(`/dashboard/stats?doctor_id=${doctorId}`),
  },

  patients: {
    list: (doctorId: string, search?: string) => {
      const params = new URLSearchParams({ doctor_id: doctorId });
      if (search) params.set("search", search);
      return req<Patient[]>(`/patients?${params}`);
    },
    get: (id: string) => req<Patient>(`/patients/${id}`),
    getFamilyMembers: (headMobile: string) =>
      req<Patient[]>(`/patients/family/${headMobile}`),
    lookup: (mobile: string) =>
      req<Patient[]>(`/patients/lookup?mobile=${encodeURIComponent(mobile)}`),
    register: (data: PatientRegistrationPayload) =>
      req<Patient>("/patients/register", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Pick<Patient, "name" | "mobile" | "age" | "gender" | "language"> & { date_of_birth?: string; email?: string; address?: string; [key: string]: unknown }>) =>
      req<Patient>(`/patients/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    search: (mobile: string) =>
      req<{ patient_id: string; name: string; age?: number; gender?: string; mobile: string; patient_code?: string; last_visit_date?: string }[]>(`/patients/search?mobile=${encodeURIComponent(mobile)}`),
  },

  appointments: {
    list: (doctorId: string, date?: string, dateFrom?: string, dateTo?: string, patientId?: string) => {
      const params = new URLSearchParams({ doctor_id: doctorId });
      if (date) params.set("date", date);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo)   params.set("date_to",   dateTo);
      if (patientId) params.set("patient_id", patientId);
      return req<Appointment[]>(`/appointments?${params}`);
    },
    today: (doctorId: string) =>
      req<Appointment[]>(`/appointments/today?doctor_id=${doctorId}`),
    updateStatus: (id: string, status: Appointment["status"]) =>
      req<Appointment>(`/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    slots: (doctorId: string, date: string) =>
      req<SlotsResponse>(`/appointments/slots?doctor_id=${doctorId}&date=${date}`),
    nextToken: (doctorId: string, date: string) =>
      req<{ token: number }>(`/appointments/next-token?doctor_id=${doctorId}&date=${date}`),
    book: (data: BookAppointmentPayload) =>
      req<BookingResult>("/appointments/book", { method: "POST", body: JSON.stringify(data) }),
    noShow: (id: string, send_whatsapp: boolean) =>
      req<{ success: boolean; appointment_id: string; status: string; whatsapp_sent: boolean; followup_created: boolean }>(
        `/appointments/${id}/no-show`,
        { method: "POST", body: JSON.stringify({ send_whatsapp }) }
      ),
    bulkCancel: (appointment_ids: string[], reason = "doctor_unavailable", notify_whatsapp = true) =>
      req<{ cancelled: string[]; failed: string[]; whatsapp_sent: number; whatsapp_failed: number }>(
        "/appointments/bulk-cancel",
        { method: "POST", body: JSON.stringify({ appointment_ids, reason, notify_whatsapp }) }
      ),
  },

  visits: {
    getByPatient: (patientId: string) =>
      req<Visit[]>(`/patients/${patientId}/visits`),
    create: (data: { patient_id: string; doctor_id: string; appointment_id?: string | null }) =>
      req<Visit>("/visits", { method: "POST", body: JSON.stringify(data) }),
    getVitals: (visitId: string) =>
      req<{ vitals: VisitVitals | null }>(`/visits/${visitId}/vitals`),
    saveVitals: (visitId: string, vitals: VisitVitals) =>
      req<{ success: boolean; vitals: VisitVitals | null }>(`/visits/${visitId}/vitals`, {
        method: "POST",
        body: JSON.stringify(vitals),
      }),
    vitalsHistory: (patientId: string) =>
      req<{ history: (VisitVitals & { visits?: { visit_date?: string; chief_complaint?: string } })[] }>(
        `/patients/${patientId}/vitals-history`
      ),
  },

  queue: {
    status: (doctorId: string, date?: string) => {
      const params = new URLSearchParams({ doctor_id: doctorId });
      if (date) params.set("date", date);
      return req<QueueStatus>(`/queue/status?${params}`);
    },
    callNext: (doctorId: string) =>
      req<{ token: number }>("/queue/next", {
        method: "POST",
        body: JSON.stringify({ doctor_id: doctorId }),
      }),
    callPrev: (doctorId: string) =>
      req<{ token: number }>("/queue/prev", {
        method: "POST",
        body: JSON.stringify({ doctor_id: doctorId }),
      }),
    setToken: (doctorId: string, token: number) =>
      req<{ token: number }>("/queue/set-token", {
        method: "POST",
        body: JSON.stringify({ doctor_id: doctorId, token }),
      }),
  },

  prescriptions: {
    list: (doctorId: string, patientId?: string) => {
      const params = new URLSearchParams({ doctor_id: doctorId });
      if (patientId) params.set("patient_id", patientId);
      return req<Prescription[]>(`/prescriptions?${params}`);
    },
    create: (data: Partial<Prescription>) =>
      req<Prescription>("/prescriptions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getActive: (doctorId: string) =>
      req<Prescription[]>(`/prescriptions/active?doctor_id=${doctorId}`),
    write: (data: PrescriptionWritePayload) =>
      req<PrescriptionWriteResult>("/prescriptions/write", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    createNew: (data: {
      doctor_id: string;
      patient_id?: string | null;
      visit_id?: string | null;
      appointment_id?: string | null;
      is_walkin: boolean;
      walkin_name?: string | null;
      walkin_age?: number | null;
      chief_complaint: string;
      diagnosis: string;
      dietary_instructions: string;
      precautions: string;
      general_notes: string;
      medicines: PrescriptionWritePayload["medicines"];
    }) =>
      req<{ prescription_id: string }>("/prescriptions", { method: "POST", body: JSON.stringify(data) }),
    sendWhatsapp: (prescriptionId: string) =>
      req<{ sent: boolean; mobile?: string; error?: string }>(`/prescriptions/${prescriptionId}/send-whatsapp`, { method: "POST" }),
    getDetail: (prescriptionId: string) =>
      req<Prescription & { visits?: { id: string; chief_complaint: string; diagnosis: string; notes: string } }>(`/prescriptions/${prescriptionId}/detail`),
    update: (prescriptionId: string, data: {
      patient_id?: string;
      visit_id?: string;
      chief_complaint: string;
      diagnosis: string;
      notes: string;
      dietary_instructions: string;
      precautions: string;
      medicines: PrescriptionWritePayload["medicines"];
    }) =>
      req<{ ok: boolean; prescription_id: string; whatsapp_sent: boolean }>(`/prescriptions/${prescriptionId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },

  medicines: {
    search: (doctorId: string, query: string, limit = 8) =>
      req<ClinicMedicine[]>(`/medicines?doctor_id=${doctorId}&search=${encodeURIComponent(query)}&limit=${limit}`),
    list: (doctorId: string, limit = 100) =>
      req<ClinicMedicine[]>(`/medicines?doctor_id=${doctorId}&limit=${limit}`),
    categories: (doctorId: string) =>
      req<string[]>(`/medicines/categories?doctor_id=${doctorId}`),
    add: (data: Partial<ClinicMedicine> & { doctor_id: string }) =>
      req<ClinicMedicine>("/medicines", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<ClinicMedicine>) =>
      req<ClinicMedicine>(`/medicines/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deactivate: (id: string) =>
      req<{ ok: boolean }>(`/medicines/${id}`, { method: "DELETE" }),
    incrementUsage: (id: string) =>
      req<{ ok: boolean }>(`/medicines/${id}/increment-usage`, { method: "PATCH" }),
  },

  followups: {
    list: (doctorId: string) =>
      req<FollowUp[]>(`/followups?doctor_id=${doctorId}`),
    pending: (doctorId: string) =>
      req<FollowUp[]>(`/followups/pending?doctor_id=${doctorId}`),
    triggerWhatsapp: () =>
      req<{ status: string }>("/trigger/followup-whatsapp", { method: "POST" }),
    triggerCalls: () =>
      req<{ status: string }>("/trigger/followup-calls", { method: "POST" }),
  },

  queries: {
    list: (doctorId: string, patientId?: string) => {
      const params = new URLSearchParams({ doctor_id: doctorId });
      if (patientId) params.set("patient_id", patientId);
      return req<Query[]>(`/queries?${params}`);
    },
    pending: (doctorId: string) =>
      req<Query[]>(`/queries/pending?doctor_id=${doctorId}`),
    answer: (id: string, answer: string) =>
      req<Query>(`/queries/${id}/answer`, {
        method: "PATCH",
        body: JSON.stringify({ answer }),
      }),
  },

  reviews: {
    list: (doctorId: string) =>
      req<Review[]>(`/reviews?doctor_id=${doctorId}`),
  },

  doctor: {
    get: (doctorId: string) => req<Doctor>(`/doctor/${doctorId}`),
    update: (doctorId: string, data: Partial<Doctor>) =>
      req<Doctor>(`/doctor/${doctorId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  triggers: {
    morningReminders: () =>
      req<{ status: string }>("/trigger/morning-reminders", { method: "POST" }),
    eveningReminders: () =>
      req<{ status: string }>("/trigger/evening-reminders", { method: "POST" }),
    visitSummary: () =>
      req<{ status: string }>("/trigger/visit-summary", { method: "POST" }),
    reviewRequests: () =>
      req<{ status: string }>("/trigger/review-requests", { method: "POST" }),
  },

  availability: {
    get: (doctorId: string, date: string) =>
      req<AvailabilityInfo>(`/availability?doctor_id=${doctorId}&date=${date}`),
    range: (doctorId: string, startDate: string, endDate: string) =>
      req<AvailabilityInfo[]>(`/availability/range?doctor_id=${doctorId}&start_date=${startDate}&end_date=${endDate}`),
    set: (payload: AvailabilityPayload) =>
      req<AvailabilityInfo>("/availability", { method: "POST", body: JSON.stringify(payload) }),
    delete: (doctorId: string, date: string) =>
      req<{ deleted: boolean; date: string }>(`/availability/${date}?doctor_id=${doctorId}`, { method: "DELETE" }),
    blockFromCancel: (doctorId: string, date: string, blockType: "morning" | "evening" | "full_day") =>
      req<AvailabilityInfo>("/availability/block-from-cancel", {
        method: "POST",
        body: JSON.stringify({ doctor_id: doctorId, date, block_type: blockType }),
      }),
  },

  schedule: {
    get: (doctorId: string) =>
      req<DaySchedule[]>(`/schedule?doctor_id=${doctorId}`),
    setDay: (payload: ScheduleDayPayload) =>
      req<DaySchedule>("/schedule", { method: "POST", body: JSON.stringify(payload) }),
    deleteDay: (doctorId: string, dayOfWeek: string) =>
      req<{ deleted: boolean; day_of_week: string }>(`/schedule/${dayOfWeek}?doctor_id=${doctorId}`, { method: "DELETE" }),
  },
};
