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
  patient_id: string;
  visit_id?: string;
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
  total_patients: number;
  pending_followups: number;
  today_completed: number;
  weekly_appointments: { date: string; count: number }[];
  top_diagnoses: { diagnosis: string; count: number }[];
}

export interface QueueStatus {
  current_token: number;
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
  patients?: Pick<Patient, "name" | "mobile">;
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
  },

  appointments: {
    list: (doctorId: string, date?: string, dateFrom?: string, dateTo?: string) => {
      const params = new URLSearchParams({ doctor_id: doctorId });
      if (date) params.set("date", date);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo)   params.set("date_to",   dateTo);
      return req<Appointment[]>(`/appointments?${params}`);
    },
    today: (doctorId: string) =>
      req<Appointment[]>(`/appointments/today?doctor_id=${doctorId}`),
    updateStatus: (id: string, status: Appointment["status"]) =>
      req<Appointment>(`/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
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
    list: (doctorId: string) =>
      req<Query[]>(`/queries?doctor_id=${doctorId}`),
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
};
