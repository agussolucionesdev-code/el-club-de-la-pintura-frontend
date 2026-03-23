/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => void;
  logout: (force?: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("club_user");
    const storedToken = localStorage.getItem("club_token");
    if (storedUser && storedToken) {
      return JSON.parse(storedUser);
    }
    return null;
  });

  const login = (token: string, userData: User) => {
    localStorage.setItem("club_token", token);
    localStorage.setItem("club_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = (force = false) => {
    if (force) {
      // Si forzamos la salida, guardamos dónde estaba el usuario
      sessionStorage.setItem("club_redirect_path", window.location.pathname);
    }
    localStorage.removeItem("club_token");
    localStorage.removeItem("club_user");
    setUser(null);

    if (force) {
      window.location.href = "/login";
    }
  };

  // ============================================================================
  // 🛡️ MOTOR GLOBAL DE INTERCEPCIÓN (Escudo 401/403)
  // ============================================================================
  useEffect(() => {
    // Guardamos el fetch original del navegador
    const originalFetch = window.fetch;

    // Lo reemplazamos con nuestro fetch blindado
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      // Si el servidor responde que el token venció o no hay permisos
      if (response.status === 401 || response.status === 403) {
        const url =
          typeof args[0] === "string"
            ? args[0]
            : args[0] instanceof Request
              ? args[0].url
              : "";

        // Evitamos interceptar la ruta de login para no hacer un bucle infinito
        if (!url.includes("/login")) {
          // 1. Guardamos la ruta actual en la "mochila" (Session Storage)
          sessionStorage.setItem(
            "club_redirect_path",
            window.location.pathname,
          );

          // 2. Destruimos la sesión muerta
          localStorage.removeItem("club_token");
          localStorage.removeItem("club_user");
          setUser(null);

          // 3. Teletransportamos al login forzosamente
          window.location.href = "/login";
        }
      }
      return response;
    };

    // Limpieza al desmontar para no dejar basura en memoria
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
};
