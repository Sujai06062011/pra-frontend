/// <reference types="vite/client" />

export {};

declare global {
  interface Window {
    JitsiMeetExternalAPI: new (domain: string, options: Record<string, unknown>) => {
      addEventListener: (event: string, listener: (data?: unknown) => void) => void;
      executeCommand: (command: string, ...args: unknown[]) => void;
      dispose: () => void;
    };
  }
}
