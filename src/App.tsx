import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider, useAuth } from "./core/context/AuthContext";
import { ThemeProvider } from "./core/context/ThemeContext";

import { LoginPage } from "./modules/auth/pages/LoginPage";
import { MainLayout } from "./shared/layouts/MainLayout";
import { DashboardPage } from "./modules/dashboard/pages/DashboardPage";
import { ProductsPage } from "./modules/products/pages/ProductsPage";
import { POSPage } from "./modules/pos/pages/POSPage";
import { InventoryPage } from "./modules/stock/pages/InventoryPage";
import { CashRegisterPage } from "./modules/cash-register/pages/CashRegisterPage";

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          {/* ========================================================== */}
          {/* MOTOR GLOBAL DE NOTIFICACIONES (NEURO-DISEÑO) */}
          {/* ========================================================== */}
          <Toaster
            position="top-right"
            toastOptions={{
              // Duración de 4 segundos
              duration: 4000,
              // Clases globales para todas las alertas (Glassmorphism)
              className:
                "!bg-white/90 dark:!bg-[#0a0f1c]/90 !backdrop-blur-xl !shadow-[0_20px_50px_rgba(0,0,0,0.15)] !border !border-slate-200 dark:!border-slate-800 !rounded-3xl !px-6 !py-4 !text-sm !font-black !tracking-tight !text-slate-800 dark:!text-white",
              success: {
                iconTheme: {
                  primary: "#10b981", // Verde Esmeralda (Éxito)
                  secondary: "#ffffff",
                },
                className:
                  "!bg-emerald-50/95 dark:!bg-emerald-950/90 !border-emerald-200 dark:!border-emerald-800 !text-emerald-700 dark:!text-emerald-400",
              },
              error: {
                iconTheme: {
                  primary: "#ef4444", // Rojo Peligro
                  secondary: "#ffffff",
                },
                className:
                  "!bg-red-50/95 dark:!bg-red-950/90 !border-red-200 dark:!border-red-800 !text-red-700 dark:!text-red-400",
              },
            }}
          />

          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />

            <Route path="/" element={<MainLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/sales" element={<POSPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/caja" element={<CashRegisterPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
