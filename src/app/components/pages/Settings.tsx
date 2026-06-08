import { Save, Building2, Clock, Bell, MessageSquare, Phone } from "lucide-react";

export function Settings() {
  return (
    <div className="p-7 space-y-6 max-w-3xl">

      {/* Clinic Info */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
            <Building2 size={16} className="text-emerald-600" />
          </div>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800">Clinic Information</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Clinic Name", value: "Dr. Kumar Child Care" },
            { label: "Doctor Name", value: "Dr. Rajkumar" },
            { label: "Specialisation", value: "Paediatrics" },
            { label: "Registration No.", value: "TN-MED-2008-4521" },
            { label: "City", value: "Coimbatore" },
            { label: "Phone", value: "+91 98765 43210" },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">{f.label}</label>
              <input
                defaultValue={f.value}
                className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 bg-white"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Working Hours */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Clock size={16} className="text-blue-600" />
          </div>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800">Working Hours</h3>
        </div>
        <div className="space-y-3">
          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
            <div key={day} className="flex items-center gap-4">
              <div className="w-24 text-[13px] font-medium text-slate-600">{day}</div>
              <input defaultValue="9:00 AM" className="px-3 py-1.5 text-[13px] border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 w-24" />
              <span className="text-slate-400">to</span>
              <input defaultValue="6:00 PM" className="px-3 py-1.5 text-[13px] border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 w-24" />
              <label className="flex items-center gap-2 text-[13px] text-slate-500 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-emerald-500 w-4 h-4" />
                Open
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
            <Bell size={16} className="text-violet-600" />
          </div>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }} className="text-slate-800">Notification Settings</h3>
        </div>
        <div className="space-y-3">
          {[
            { label: "Appointment reminders (WhatsApp)", sub: "Send 24h and 2h before", checked: true },
            { label: "Prescription end alerts", sub: "Notify 2 days before course ends", checked: true },
            { label: "Post-visit follow-up (auto call)", sub: "3 days after visit", checked: true },
            { label: "Lab report arrival notification", sub: "Alert when reports are ready", checked: false },
            { label: "No-show SMS alert", sub: "Patient missed appointment", checked: true },
            { label: "5-star review request", sub: "Ask after resolved consultation", checked: false },
          ].map(n => (
            <div key={n.label} className="flex items-center gap-4 py-2 border-b border-slate-50 last:border-0">
              <div className="flex-1">
                <div className="text-[13px] font-medium text-slate-700">{n.label}</div>
                <div className="text-[11px] text-slate-400">{n.sub}</div>
              </div>
              <input type="checkbox" defaultChecked={n.checked} className="accent-emerald-500 w-4 h-4 cursor-pointer" />
            </div>
          ))}
        </div>
      </div>

      <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-semibold px-6 py-2.5 rounded-xl shadow-sm shadow-emerald-200 transition-colors">
        <Save size={15} /> Save Settings
      </button>
    </div>
  );
}
