import { createContext, useContext } from "react";

interface AuthContextValue {
  doctorId: string;
  doctorName: string;
  clinicName: string;
}

const AuthContext = createContext<AuthContextValue>({
  doctorId: "8c33abe0-5d2e-4613-9437-c7c375e8d162",
  doctorName: "Dr. Kumar",
  clinicName: "Dr. Kumar Child Care Clinic",
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider
      value={{
        doctorId: "8c33abe0-5d2e-4613-9437-c7c375e8d162",
        doctorName: "Dr. Kumar",
        clinicName: "Dr. Kumar Child Care Clinic",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
