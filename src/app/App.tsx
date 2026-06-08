import { useState } from "react";
import { Sidebar, type Page } from "./components/Sidebar";
import { useQueries, useFollowUps } from "../hooks/usePRAData";
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

// New Appointment modal
function NewAppointmentModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl p-7 w-full max-w-md">
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18 }} className="text-slate-800 mb-5">
          New Appointment
        </h2>
        <div className="space-y-4">
          {[
            { label: "Patient Name", placeholder: "Enter patient name", type: "text" },
            { label: "Age", placeholder: "Age in years", type: "number" },
            { label: "Phone", placeholder: "+91 XXXXX XXXXX", type: "tel" },
            { label: "Appointment Date", placeholder: "", type: "date" },
            { label: "Time Slot", placeholder: "", type: "time" },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">{f.label}</label>
              <input
                type={f.type}
                placeholder={f.placeholder}
                className="w-full px-3 py-2.5 text-[13px] border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
              />
            </div>
          ))}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Visit Type</label>
            <select className="w-full px-3 py-2.5 text-[13px] border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 bg-white">
              <option>Follow-up</option>
              <option>New Visit</option>
              <option>Referral</option>
              <option>Emergency</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[13px] font-semibold shadow-sm shadow-emerald-200 transition-colors"
          >
            Book Appointment
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const [showModal, setShowModal] = useState(false);
  const { data: queries } = useQueries();
  const { data: followUps } = useFollowUps();
  const queriesBadge = queries.filter(q => q.status === "Pending").length;
  const followupsBadge = followUps.filter(f => !f.completed_at).length;

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <Dashboard onNavigate={setActivePage} />;
      case "appointments": return <Appointments onNewAppointment={() => setShowModal(true)} />;
      case "queue": return <Queue />;
      case "patients": return <Patients />;
      case "prescriptions": return <Prescriptions />;
      case "lab": return <LabReports />;
      case "queries": return <Queries />;
      case "followups": return <FollowUps />;
      case "reviews": return <Reviews />;
      case "analytics": return <Analytics />;
      case "settings": return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar activePage={activePage} onNavigate={setActivePage} queriesBadge={queriesBadge} followupsBadge={followupsBadge} />
      <div className="ml-60 flex flex-col min-h-screen">
        <Topbar activePage={activePage} onNewAppointment={() => setShowModal(true)} />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
      {showModal && <NewAppointmentModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
