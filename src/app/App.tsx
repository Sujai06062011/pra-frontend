import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import type { Page } from "./components/Sidebar";
import { useQueries, useFollowUps, useTodayAppointments } from "../hooks/usePRAData";
import { Topbar } from "./components/Topbar";
import { Dashboard } from "./components/pages/Dashboard";
import { Appointments } from "./components/pages/Appointments";
import { Queue } from "./components/pages/Queue";
import { Patients } from "./components/pages/Patients";
import { Prescriptions } from "./components/pages/Prescriptions";
import { LabReports } from "./components/pages/LabReports";
import { Queries } from "./components/pages/Queries";
import { FollowUps } from "./components/pages/FollowUps";
import { Reviews } from "./components/pages/Reviews";
import { Analytics } from "./components/pages/Analytics";
import { Settings } from "./components/pages/Settings";
import { ClinicMedicines } from "./components/pages/ClinicMedicines";
import { NewAppointment } from "./components/pages/NewAppointment";
import { PatientRegistration } from "./components/pages/PatientRegistration";
import { PrescriptionWriter } from "./components/pages/PrescriptionWriter";
import { Availability } from "./components/pages/Availability";
import { Dispensary } from "./components/pages/Dispensary";
import { ConsultationsPage } from "./components/pages/ConsultationsPage";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function App() {
  const { doctorId } = useAuth();
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const [newApptPatientId, setNewApptPatientId] = useState<string>("");
  const [rxParams, setRxParams] = useState<{ patientId?: string; appointmentId?: string; prescriptionId?: string }>({});
  const { data: queries } = useQueries();
  const { data: followUps } = useFollowUps();
  const { data: todayAppointments } = useTodayAppointments();
  const [consultationsBadge, setConsultationsBadge] = useState(0);

  const queriesBadge     = queries.filter(q => q.status === "Pending").length;
  const followupsBadge   = followUps.filter(f => !f.completed_at).length;
  const appointmentsBadge = todayAppointments.filter(a => a.status !== "Cancelled").length;

  // Poll today's active consultations for badge count
  useEffect(() => {
    async function fetchBadge() {
      try {
        const res = await api.consultations.today(doctorId);
        const active = res.consultations.filter(c =>
          ["scheduled", "waiting", "in_progress"].includes(c.status)
        ).length;
        setConsultationsBadge(active);
      } catch {/* non-critical */ }
    }
    fetchBadge();
    const t = setInterval(fetchBadge, 60_000);
    return () => clearInterval(t);
  }, [doctorId]);

  const goToNewAppt = (patientId = "") => {
    setNewApptPatientId(patientId);
    setActivePage("new-appointment");
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <Dashboard onNavigate={setActivePage} />;
      case "appointments": return <Appointments onPrescribe={(patientId, appointmentId) => { setRxParams({ patientId, appointmentId }); setActivePage("new-prescription"); }} />;
      case "availability": return <Availability />;
      case "queue": return <Queue onPrescribe={(patientId, appointmentId) => { setRxParams({ patientId, appointmentId }); setActivePage("new-prescription"); }} />;
      case "patients": return <Patients />;
      case "prescriptions": return (
        <Prescriptions
          onNewPrescription={() => { setRxParams({}); setActivePage("new-prescription"); }}
          onEditPrescription={(patientId, prescriptionId) => { setRxParams({ patientId, prescriptionId }); setActivePage("new-prescription"); }}
        />
      );
      case "medicines": return <ClinicMedicines />;
      case "medicines-alerts": return <ClinicMedicines initialTab="alerts" />;
      case "dispensary": return <Dispensary />;
      case "consultations": return <ConsultationsPage />;
      case "lab": return <LabReports />;
      case "queries": return <Queries />;
      case "followups": return <FollowUps />;
      case "reviews": return <Reviews />;
      case "analytics": return <Analytics />;
      case "settings": return <Settings />;
      case "new-appointment": return (
        <NewAppointment
          key={newApptPatientId}
          patientId={newApptPatientId}
          onNavigate={setActivePage}
          onRegisterPatient={() => setActivePage("register-patient")}
        />
      );
      case "new-prescription": return (
        <PrescriptionWriter
          key={JSON.stringify(rxParams)}
          patientId={rxParams.patientId}
          appointmentId={rxParams.appointmentId}
          prescriptionId={rxParams.prescriptionId}
          onNavigate={(p) => setActivePage(p as Page)}
        />
      );
      case "register-patient": return (
        <PatientRegistration
          onNavigate={setActivePage}
          onBookAppointment={(patientId) => goToNewAppt(patientId)}
        />
      );
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        queriesBadge={queriesBadge}
        followupsBadge={followupsBadge}
        appointmentsBadge={appointmentsBadge}
        consultationsBadge={consultationsBadge}
      />
      <div className="lg:ml-60 ml-0 flex flex-col min-h-screen">
        <Topbar activePage={activePage} />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
