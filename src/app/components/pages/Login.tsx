import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pinRef = useRef<HTMLInputElement>(null);

  useEffect(() => { pinRef.current?.focus(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !pin.trim()) {
      setError("Enter username and PIN");
      return;
    }
    setLoading(true);
    setError("");
    const err = await login(username, pin);
    setLoading(false);
    if (err) setError(err);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
          >
            <span className="text-white text-2xl font-bold">P</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">PARRO</h1>
          <p className="text-slate-500 text-sm mt-1">Engage. Retain. Grow</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-5"
        >
          <h2 className="text-lg font-semibold text-slate-700 text-center">Staff Login</h2>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Username</label>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === "Enter" && pinRef.current?.focus()}
              placeholder="e.g. drkumar"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400
                         focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">PIN</label>
            <input
              ref={pinRef}
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="••••"
              maxLength={8}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400
                         focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-sm tracking-widest"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all
                       bg-emerald-500 hover:bg-emerald-600 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Contact admin to reset your PIN
        </p>
      </div>
    </div>
  );
}
