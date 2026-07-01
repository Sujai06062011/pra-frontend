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
  a.status === "Completed" || (!a.returned_at && a.queue_status === "Done");

const isInProgress = (a: Appointment): boolean =>
  a.status === "In Progress" || a.queue_status === "In Progress";

export const isLate = (a: Appointment): boolean => a.status === "Late";

/**
 * Waiting patients who returned after being marked Late sort before
 * regular Waiting patients. Within each group, sort by token time.
 */
const byQueuePriority = (a: Appointment, b: Appointment): number => {
  // Returned-late patients (have returned_at) go before plain Waiting
  const aReturned = !isLate(a) && !!a.returned_at;
  const bReturned = !isLate(b) && !!b.returned_at;
  if (aReturned !== bReturned) return aReturned ? -1 : 1;
  // Within same group, sort by returned_at time (earliest first) for returned,
  // or by slot time for regular waiting
  if (aReturned && bReturned) {
    return (a.returned_at ?? "").localeCompare(b.returned_at ?? "");
  }
  return byTime(a, b);
};

/** All active (non-cancelled, non-no-show) appointments */
export const getActiveAppointments = (appointments: Appointment[]): Appointment[] =>
  appointments
    .filter(a => a.status !== "Cancelled" && a.status !== "No-Show")
    .sort(byTime);

/** The appointment currently being served */
export const getCurrentAppointment = (appointments: Appointment[]): Appointment | null =>
  appointments.find(a => a.status !== "Cancelled" && isInProgress(a)) ?? null;

/** First appointment of the day (earliest slot, not cancelled/no-show/late) */
export const getFirstAppointment = (appointments: Appointment[]): Appointment | null =>
  getActiveAppointments(appointments).find(a => !isLate(a)) ?? null;

/** First appointment of the day that hasn't been seen yet (excludes Late) */
export const getFirstPendingAppointment = (appointments: Appointment[]): Appointment | null =>
  getActiveAppointments(appointments)
    .find(a => !isDone(a) && !isInProgress(a) && !isLate(a)) ?? null;

export interface SessionMove {
  appointment: Appointment;
  crossSession: boolean;
  targetSession: "morning" | "evening" | null;
}

/**
 * NEXT: next appointment to serve after current.
 * Priority order within the same session:
 *   1. Returned-late patients (returned_at set), sorted by return time
 *   2. Regular Waiting patients, sorted by slot time (after current)
 *   3. Late patients are skipped (not ready yet)
 * Then falls through to other session if same session exhausted.
 */
export const getNextAppointment = (
  currentAppointment: Appointment,
  allAppointments: Appointment[]
): SessionMove | null => {
  const active = getActiveAppointments(allAppointments);
  const curTime = currentAppointment.appointment_time ?? "";
  const currentSession = getSession(currentAppointment.appointment_time);

  const isPending = (a: Appointment) => !isDone(a) && !isInProgress(a) && !isLate(a);

  // Candidates in same session: pending (not late) patients
  const sameSessionCandidates = active
    .filter(a => getSession(a.appointment_time) === currentSession && isPending(a))
    .sort(byQueuePriority);

  // Returned patients whose slot was already passed jump ahead (they were skipped)
  const skippedReturned = sameSessionCandidates.find(
    a => !!a.returned_at && (a.appointment_time ?? "") <= curTime
  );
  if (skippedReturned) {
    return { appointment: skippedReturned, crossSession: false, targetSession: null };
  }

  // Regular waiting: next by slot time (includes returned patients with future slots)
  const regularNext = sameSessionCandidates.find(
    a => (a.appointment_time ?? "") > curTime
  );
  if (regularNext) {
    return { appointment: regularNext, crossSession: false, targetSession: null };
  }

  // Cross to other session — sort by slot time only (no intra-session serving reference)
  const otherSession = currentSession === "morning" ? "evening" : "morning";
  const otherSessionCandidates = active
    .filter(a => getSession(a.appointment_time) === otherSession && isPending(a))
    .sort(byTime);
  if (otherSessionCandidates.length > 0) {
    return { appointment: otherSessionCandidates[0], crossSession: true, targetSession: otherSession };
  }

  return null; // all done (Late patients remain but are not served yet)
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

/** True when every non-late active appointment today has been seen */
export const isAllDone = (appointments: Appointment[]): boolean => {
  const active = getActiveAppointments(appointments).filter(a => !isLate(a));
  return active.length > 0 && active.every(isDone);
};
