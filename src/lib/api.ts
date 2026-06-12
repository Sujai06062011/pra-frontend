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
  queue_status?: "Waiting" | "In Progress" | "Done" | "Cancelled";
  status: "Confirmed" | "Cancelled";
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
  booked_count: number;
  max: number;
  available: boolean;
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
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
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
      req<SlotInfo[]>(`/appointments/slots?doctor_id=${doctorId}&date=${date}`),
    nextToken: (doctorId: string, date: string) =>
      req<{ token: number }>(`/appointments/next-token?doctor_id=${doctorId}&date=${date}`),
    book: (data: BookAppointmentPayload) =>
      req<BookingResult>("/appointments/book", { method: "POST", body: JSON.stringify(data) }),
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

  visits: {
    getByPatient: (patientId: string) =>
      req<Visit[]>(`/patients/${patientId}/visits`),
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
};
