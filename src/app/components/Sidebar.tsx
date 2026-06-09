import {
  LayoutDashboard, CalendarDays, Users, Hash, Pill, FlaskConical,
  MessageCircle, Phone, Star, BarChart3, Settings, ChevronRight,
  Stethoscope, LogOut, Tablets
} from "lucide-react";

export type Page =
  | "dashboard" | "appointments" | "queue" | "patients"
  | "prescriptions" | "medicines" | "lab" | "queries" | "followups"
  | "reviews" | "analytics" | "settings";

interface NavItem { icon: React.ReactNode; label: string; page: Page; badge?: number; badgeColor?: string; }

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: "Main",
    items: [
      { icon: <LayoutDashboard size={16} />, label: "Overview", page: "dashboard" },
      { icon: <CalendarDays size={16} />, label: "Appointments", page: "appointments", badgeColor: "teal" },
      { icon: <Hash size={16} />, label: "Queue", page: "queue" },
      { icon: <Users size={16} />, label: "Patients", page: "patients" },
    ],
  },
  {
    label: "Clinical",
    items: [
      { icon: <Pill size={16} />, label: "Prescriptions", page: "prescriptions" },
      { icon: <Tablets size={16} />, label: "Medicines", page: "medicines" },
      { icon: <FlaskConical size={16} />, label: "Lab Reports", page: "lab", badgeColor: "blue" },
      { icon: <MessageCircle size={16} />, label: "Queries", page: "queries", badgeColor: "red" },
    ],
  },
  {
    label: "Outreach",
    items: [
      { icon: <Phone size={16} />, label: "Follow-ups", page: "followups", badgeColor: "amber" },
      { icon: <Star size={16} />, label: "Reviews", page: "reviews" },
      { icon: <BarChart3 size={16} />, label: "Analytics", page: "analytics" },
    ],
  },
  {
    label: "Settings",
    items: [
      { icon: <Settings size={16} />, label: "Clinic Settings", page: "settings" },
    ],
  },
];

const badgeStyles: Record<string, string> = {
  teal: "bg-emerald-100 text-emerald-700",
  blue: "bg-blue-100 text-blue-700",
  red: "bg-rose-100 text-rose-600",
  amber: "bg-amber-100 text-amber-700",
};

export function Sidebar({
  activePage,
  onNavigate,
  queriesBadge = 0,
  followupsBadge = 0,
  appointmentsBadge = 0,
}: {
  activePage: Page;
  onNavigate: (p: Page) => void;
  queriesBadge?: number;
  followupsBadge?: number;
  appointmentsBadge?: number;
}) {
  const dynamicBadges: Partial<Record<Page, number>> = {
    queries: queriesBadge,
    followups: followupsBadge,
    appointments: appointmentsBadge,
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-slate-100 flex flex-col z-50 shadow-sm">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
            <Stethoscope size={18} className="text-white" />
          </div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 17, letterSpacing: -0.5 }} className="text-slate-800">
              PRA
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 leading-none">Patient Relationship Assistant</div>
          </div>
        </div>

        {/* Clinic badge */}
        <div className="mt-4 px-3 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
          <div className="text-xs font-semibold text-emerald-700">Dr. Kumar Child Care</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Dr. Rajkumar · Paediatrics</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navSections.map((section) => (
          <div key={section.label}>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-2 mb-2">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = activePage === item.page;
                return (
                  <button
                    key={item.page}
                    onClick={() => onNavigate(item.page)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group ${
                      isActive
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                  >
                    <span className={isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"}>
                      {item.icon}
                    </span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {(() => {
                      const count = dynamicBadges[item.page] ?? item.badge;
                      return count ? (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/25 text-white" : badgeStyles[item.badgeColor || "teal"]}`}>
                          {count}
                        </span>
                      ) : null;
                    })()}
                    {isActive && <ChevronRight size={14} className="text-white/70" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            RK
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-700 truncate">Dr. Rajkumar</div>
            <div className="text-[10px] text-slate-400">Admin · Reception</div>
          </div>
          <button className="text-slate-300 hover:text-slate-500 transition-colors">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
