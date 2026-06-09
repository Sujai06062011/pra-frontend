import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { PrescriptionWriter } from "./app/components/pages/PrescriptionWriter.tsx";
import "./styles/index.css";
import { AuthProvider } from "./context/AuthContext.tsx";

const pathname = window.location.pathname;

const RootComponent =
  pathname.startsWith("/prescriptions/new") ? PrescriptionWriter : App;

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <RootComponent />
  </AuthProvider>
);
