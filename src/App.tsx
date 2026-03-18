// Importación de módulos base de React y enrutamiento
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// Importación de proveedores de contexto global
import { AuthProvider, useAuth } from "./core/context/AuthContext";
import { ThemeProvider } from "./core/context/ThemeContext";
// Importación de vistas principales del sistema
import { LoginPage } from "./modules/auth/pages/LoginPage";
import { MainLayout } from "./shared/layouts/MainLayout";
import { DashboardPage } from "./modules/dashboard/pages/DashboardPage";
import { ProductsPage } from "./modules/products/pages/ProductsPage";
import { POSPage } from "./modules/pos/pages/POSPage";
import { InventoryPage } from "./modules/stock/pages/InventoryPage"; // <-- IMPORTACIÓN DE NUEVA VISTA

// Definición de componente de enrutamiento para restricción de usuarios autenticados
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

function App() {
  // Renderizado del árbol de rutas de la aplicación
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Declaración de rutas de acceso público */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />

            {/* Declaración de rutas bajo protección de sesión */}
            <Route path="/" element={<MainLayout />}>
              {/* Asignación de vista por defecto (Dashboard) */}
              <Route index element={<DashboardPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/sales" element={<POSPage />} />

              {/* ASIGNACIÓN DE NUEVA RUTA: GESTOR DE INVENTARIO */}
              <Route path="/inventory" element={<InventoryPage />} />
            </Route>

            {/* Redirección por defecto ante rutas inexistentes (Fallback) */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
