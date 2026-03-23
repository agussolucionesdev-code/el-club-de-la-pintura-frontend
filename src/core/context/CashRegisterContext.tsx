import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000/api";

interface ExtendedUser {
  id: number;
  name: string;
  branches?: { id: number; name: string }[];
}

interface CashRegister {
  id: number;
  status: "OPEN" | "CLOSED";
  expectedBalance: number;
  branchId: number;
}

interface CashRegisterContextType {
  activeRegister: CashRegister | null;
  checkRegister: () => Promise<void>;
  isLoadingRegister: boolean;
}

const CashRegisterContext = createContext<CashRegisterContextType | undefined>(
  undefined,
);

// 🛡️ CORRECCIÓN: Agregado el 'export' a CashRegisterProvider
export const CashRegisterProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [activeRegister, setActiveRegister] = useState<CashRegister | null>(
    null,
  );
  const [isLoadingRegister, setIsLoadingRegister] = useState(true);

  const checkRegister = useCallback(async () => {
    const token = localStorage.getItem("club_token");
    if (!token || !user) {
      setActiveRegister(null);
      setIsLoadingRegister(false);
      return;
    }

    try {
      const currentUser = user as ExtendedUser | null;
      const branchId = currentUser?.branches?.[0]?.id || 1;
      const timestamp = new Date().getTime();

      const res = await fetch(
        `${API_URL}/cash-registers/${branchId}/active?_t=${timestamp}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );

      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.id) {
          setActiveRegister({
            id: Number(json.data.id),
            status: "OPEN",
            expectedBalance: json.data.currentExpectedBalance || 0,
            branchId: branchId,
          });
        } else {
          setActiveRegister(null);
        }
      } else {
        setActiveRegister(null);
      }
    } catch (error) {
      console.error("Error global de caja:", error);
      setActiveRegister(null);
    } finally {
      setIsLoadingRegister(false);
    }
  }, [user]);

  useEffect(() => {
    checkRegister();
    const interval = setInterval(checkRegister, 5000);
    window.addEventListener("focus", checkRegister);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", checkRegister);
    };
  }, [checkRegister]);

  return (
    <CashRegisterContext.Provider
      value={{ activeRegister, checkRegister, isLoadingRegister }}
    >
      {children}
    </CashRegisterContext.Provider>
  );
};

// 🛡️ CORRECCIÓN: Agregado el 'export' a useCashRegister
// eslint-disable-next-line react-refresh/only-export-components
export const useCashRegister = () => {
  const context = useContext(CashRegisterContext);
  if (!context) {
    throw new Error(
      "useCashRegister debe usarse dentro de un CashRegisterProvider",
    );
  }
  return context;
};
