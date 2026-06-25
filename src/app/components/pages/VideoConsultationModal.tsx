import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Loader2, X, Video, PhoneOff, FileText } from "lucide-react";
import { api, type Consultation } from "../../../lib/api";

interface Props {
  consultation: Consultation;
  onClose: () => void;
  onComplete: () => void;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

function formatDuration(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function VideoConsultationModal({ consultation, onClose, onComplete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef       = useRef<InstanceType<Window["JitsiMeetExternalAPI"]> | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [duration, setDuration]     = useState(0);
  const [notes, setNotes]           = useState("");
  const [showNotes, setShowNotes]   = useState(false);
  const [ending, setEnding]         = useState(false);

  useEffect(() => {
    initJitsi();
    const timer = setInterval(() => setDuration(d => d + 1), 1000);
    return () => {
      clearInterval(timer);
      apiRef.current?.dispose();
    };
  }, []);

  async function initJitsi() {
    try {
      setIsLoading(true);
      setError(null);

      const data = await api.consultations.doctorToken(consultation.id);
      await loadScript(`https://8x8.vc/${data.app_id}/external_api.js`);

      if (!containerRef.current) return;

      const jitsiApi = new window.JitsiMeetExternalAPI("8x8.vc", {
        roomName: `${data.app_id}/${data.room_id}`,
        jwt: data.token,
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableDeepLinking: true,
          prejoinPageEnabled: false,
          disableInviteFunctions: true,
          enableWelcomePage: false,
          toolbarButtons: [
            "microphone", "camera", "desktop",
            "chat", "hangup", "settings", "tileview", "fullscreen",
          ],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          DEFAULT_REMOTE_DISPLAY_NAME: consultation.patients?.name ?? "Patient",
          TOOLBAR_ALWAYS_VISIBLE: true,
        },
        userInfo: {
          displayName: "Dr. Rajkumar",
          email: "doctor@praclinic.in",
        },
      });

      jitsiApi.addEventListener("videoConferenceJoined", () => setIsLoading(false));
      jitsiApi.addEventListener("readyToClose", () => handleEndCall());

      apiRef.current = jitsiApi;
      setIsLoading(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[JaaS]", err);
      setError(msg);
      setIsLoading(false);
    }
  }

  async function handleEndCall() {
    if (ending) return;
    setEnding(true);
    try {
      apiRef.current?.executeCommand("hangup");
      apiRef.current?.dispose();
      apiRef.current = null;
    } catch {/* ignore */ }
    try {
      await api.consultations.complete(consultation.id, notes);
    } catch (e) {
      console.error("complete consultation failed", e);
    }
    onComplete();
  }

  const patientName = consultation.patients?.name ?? "Patient";

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-gray-900 z-[9999] flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 text-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <Video size={16} className="text-blue-400" />
          <span className="text-blue-300 font-semibold text-[14px]">Online Consultation</span>
          <span className="text-gray-300 text-[13px]">· {patientName}</span>
          <span className="bg-green-700 text-white text-[11px] px-2 py-0.5 rounded-full font-mono">
            {formatDuration(duration)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNotes(n => !n)}
            className={`flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg transition-colors ${
              showNotes ? "bg-slate-600 text-white" : "text-gray-300 hover:text-white hover:bg-slate-700"
            }`}
          >
            <FileText size={13} /> Notes
          </button>
          <button
            onClick={handleEndCall}
            disabled={ending}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors"
          >
            <PhoneOff size={14} /> {ending ? "Ending…" : "End Call"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Video area */}
        <div className="flex-1 relative bg-gray-900">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4">
              <Loader2 size={36} className="animate-spin text-blue-400" />
              <p className="text-[15px] font-medium">Connecting to consultation room…</p>
              <p className="text-[13px] text-gray-400">Waiting for {patientName} to join</p>
            </div>
          )}
          {error && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4">
              <p className="text-red-400 text-[14px]">⚠️ Failed to connect: {error}</p>
              <button
                onClick={initJitsi}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-[13px] font-semibold"
              >
                Retry
              </button>
              <button onClick={onClose} className="text-gray-400 text-[12px] hover:text-white">
                <X size={14} className="inline mr-1" /> Cancel
              </button>
            </div>
          )}
          <div ref={containerRef} className="w-full h-full" />
        </div>

        {/* Notes panel */}
        {showNotes && (
          <div className="w-72 bg-gray-800 flex flex-col flex-shrink-0 border-l border-gray-700">
            <div className="px-4 py-3 border-b border-gray-700">
              <p className="text-[13px] font-semibold text-white">Consultation Notes</p>
              <p className="text-[11px] text-gray-400">{patientName}</p>
            </div>
            <div className="flex-1 p-3">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Clinical notes, observations, plan…"
                className="w-full h-full bg-gray-700 text-white text-[13px] rounded-lg p-3 resize-none placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="px-3 pb-4 text-[11px] text-gray-400 text-center">
              Notes are saved when you end the call
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
