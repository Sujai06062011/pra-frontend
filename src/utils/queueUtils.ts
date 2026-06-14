import type { Appointment } from "../lib/api";

// Pure queue helpers — no React, no API calls.
// Queue order follows slot TIME (slot-position tokens M1/E1…), not the
// integer token_number, which is booking order and can disagree with it.

export const isEvening = (appointmentTime?: string): boolean =>
  (appointmentTime ?? "") >= "13:00:00";

export const getSession = (appointmentTime?: string): "morning" | "evening" =>
  isEvening(appointmentTime) ? "evening" : "morning";

export const patientName = (a: Appointment): string => a.patients?.name ?? "Patient";

const byTime = (a: Appointment, b: Appointment) =>
  (a.appointment_time ?? "").localeCompare(b.appointment_time ?? "");

const isDone = (a: Appointment): boolean =>
  a.status === "Completed" || a.queue_status === "Done";

const isInProgress = (a: Appointment): boolean =>
  a.status === "In Progress" || a.queue_status === "In Progress";

/** All active (non-cancelled, non-no-show) appointments sorted by slot time */
export const getActiveAppointments = (appointments: Appointment[]): Appointment[] =>
  appointments.filter(a => a.status !== "Cancelled" && a.status !== "No-Show").sort(byTime);

/** The appointment currently being served */
export const getCurrentAppointment = (appointments: Appointment[]): Appointment | null =>
  appointments.find(a => a.status !== "Cancelled" && isInProgress(a)) ?? null;

/** First appointment of the day (earliest slot, not cancelled) */
export const getFirstAppointment = (appointments: Appointment[]): Appointment | null =>
  getActiveAppointments(appointments)[0] ?? null;

/** First appointment of the day that hasn't been seen yet */
export const getFirstPendingAppointment = (appointments: Appointment[]): Appointment | null =>
  getActiveAppointments(appointments).find(a => !isDone(a) && !isInProgress(a)) ?? null;

export interface SessionMove {
  appointment: Appointment;
  crossSession: boolean;
  targetSession: "morning" | "evening" | null;
}

/**
 * NEXT: next appointment to serve after current (cancelled skipped silently).
 * Same session first; otherwise the other session's first pending → crossSession.
 */
export const getNextAppointment = (
  currentAppointment: Appointment,
  allAppointments: Appointment[]
): SessionMove | null => {
  const active = getActiveAppointments(allAppointments);
  const curTime = currentAppointment.appointment_time ?? "";
  const currentSession = getSession(currentAppointment.appointment_time);

  const sameSessionNext = active.find(a =>
    (a.appointment_time ?? "") > curTime &&
    getSession(a.appointment_time) === currentSession &&
    !isDone(a) && !isInProgress(a)
  );
  if (sameSessionNext) {
    return { appointment: sameSessionNext, crossSession: false, targetSession: null };
  }

  const otherSession = currentSession === "morning" ? "evening" : "morning";
  const otherSessionNext = active.find(a =>
    getSession(a.appointment_time) === otherSession &&
    !isDone(a) && !isInProgress(a)
  );
  if (otherSessionNext) {
    return { appointment: otherSessionNext, crossSession: true, targetSession: otherSession };
  }

  return null; // all done
};

/**
 * PREV: previous served appointment before current (cancelled skipped silently).
 * Same session first; otherwise the other session's last served → crossSession.
 */
export const getPrevAppointment = (
  currentAppointment: Appointment,
  allAppointments: Appointment[]
): SessionMove | null => {
  const active = getActiveAppointments(allAppointments);
  const curTime = currentAppointment.appointment_time ?? "";
  const currentSession = getSession(currentAppointment.appointment_time);

  const sameSessionPrev = [...active].reverse().find(a =>
    (a.appointment_time ?? "") < curTime &&
    getSession(a.appointment_time) === currentSession &&
    (isDone(a) || isInProgress(a)) && a.id !== currentAppointment.id
  );
  if (sameSessionPrev) {
    return { appointment: sameSessionPrev, crossSession: false, targetSession: null };
  }

  const otherSession = currentSession === "morning" ? "evening" : "morning";
  const otherSessionPrev = [...active].reverse().find(a =>
    getSession(a.appointment_time) === otherSession &&
    (isDone(a) || isInProgress(a)) && a.id !== currentAppointment.id
  );
  if (otherSessionPrev) {
    return { appointment: otherSessionPrev, crossSession: true, targetSession: otherSession };
  }

  return null; // already at the very first patient
};

/** True when every active appointment today has been seen */
export const isAllDone = (appointments: Appointment[]): boolean => {
  const active = getActiveAppointments(appointments);
  return active.length > 0 && active.every(isDone);
};
