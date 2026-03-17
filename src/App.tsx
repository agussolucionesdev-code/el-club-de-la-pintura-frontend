import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./core/context/AuthContext";
import { ThemeProvider } from "./core/context/ThemeContext";
import { LoginPage } from "./modules/auth/pages/LoginPage";
import { MainLayout } from "./shared/layouts/MainLayout";
import { DashboardPage } from "./modules/dashboard/pages/DashboardPage";
import { ProductsPage } from "./modules/products/pages/ProductsPage";
import { POSPage } from "./modules/pos/pages/POSPage"; // <-- IMPORTAMOS LA NUEVA TERMINAL

// Un pequeño componente para evitar que Cristian vuelva al Login si ya está adentro
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
          <Routes>
            {/* Rutas Públicas */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />

            {/* Rutas Protegidas (Adentro del Sistema) */}
            <Route path="/" element={<MainLayout />}>
              {/* Cuando entra a "/", carga el Dashboard */}
              <Route index element={<DashboardPage />} />
              <Route path="/products" element={<ProductsPage />} />

              {/* NUEVA RUTA: TERMINAL DE VENTAS */}
              <Route path="/sales" element={<POSPage />} />
            </Route>

            {/* Cualquier otra cosa rara, lo mandamos al home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
