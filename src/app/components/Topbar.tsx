import { Bell, Search, Plus, Calendar } from "lucide-react";
import type { Page } from "./Sidebar";

const pageTitles: Record<Page, string> = {
  dashboard: "Overview",
  appointments: "Appointments",
  availability: "Availability Management",
  queue: "Live Queue",
  patients: "Patients",
  prescriptions: "Prescriptions",
  lab: "Lab Reports",
  queries: "Patient Queries",
  followups: "Follow-ups",
  reviews: "Reviews",
  analytics: "Analytics",
  settings: "Clinic Settings",
  medicines: "Medicines",
  "new-appointment": "New Appointment",
  "register-patient": "Register Patient",
  "new-prescription": "New Prescription",
};

export function Topbar({ activePage }: { activePage: Page }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-7 gap-4 sticky top-0 z-40 shadow-sm">
      <div className="flex-1">
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17 }} className="text-slate-800">
          {pageTitles[activePage]}
        </h1>
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search patients, reports…"
          className="pl-8 pr-4 py-1.5 text-[13px] bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 w-56 transition-all"
        />
      </div>

      {/* Date */}
      <div className="hidden lg:flex items-center gap-1.5 text-[12px] text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
        <Calendar size={13} className="text-emerald-500" />
        {dateStr}
      </div>

      {/* Live dot */}
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-emerald-600">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        Live
      </div>

      {/* Bell */}
      <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
        <Bell size={17} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
      </button>

    </header>
  );
}
