// Importación de enrutadores y ganchos de navegación de React Router
import {
  Outlet,
  Navigate,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
// Importación de gestores de estado locales
import { useState } from "react";
// Importación de proveedores de contexto globales (Autenticación y Tema)
import { useAuth } from "../../core/context/AuthContext";
import { useTheme } from "../../core/context/ThemeContext";
// Importación de iconografía vectorizada
import {
  Sun,
  Moon,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Power,
  Menu,
  PackageSearch,
  Calculator,
  Building2,
  HandCoins,
  Factory,
  ArrowDownRight,
  FileSpreadsheet, // <-- INYECCIÓN FASE 4: Ícono para Listas de Precios
} from "lucide-react";
// Importación de recursos gráficos estáticos
import logoImg from "../../assets/images/logo.png";

export const MainLayout = () => {
  // Extracción de credenciales y métodos de sesión
  const { user, isAuthenticated, logout } = useAuth();
  // Extracción de estado y alternador de tema visual
  const { theme, toggleTheme } = useTheme();

  // Inicialización de controladores de navegación
  const navigate = useNavigate();
  const location = useLocation();

  // Inicialización de estado para despliegue de menú en dispositivos móviles
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Ejecución de barrera de seguridad (Redirección si no hay sesión activa)
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Ejecución de purga de sesión y redirección a login
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Configuración estructural del mapa de navegación principal
  const navLinks = [
    { path: "/", icon: LayoutDashboard, label: "Bóveda Estratégica" },
    { path: "/sales", icon: ShoppingCart, label: "Terminal de Ventas" },
    { path: "/caja", icon: Calculator, label: "Caja Registradora" },
    {
      path: "/cuentas-corrientes",
      icon: HandCoins,
      label: "Cuentas Corrientes",
    },
    { path: "/gastos", icon: ArrowDownRight, label: "Gastos y Egresos" },
    { path: "/products", icon: Package, label: "Catálogo Maestro" },
    {
      path: "/inventory",
      icon: PackageSearch,
      label: "Auditoría de Inventario",
    },
    { path: "/customers", icon: Building2, label: "Directorio Clientes" },
    { path: "/proveedores", icon: Factory, label: "Directorio Proveedores" },
    { path: "/price-lists", icon: FileSpreadsheet, label: "Listas de Precios" }, // <-- INYECCIÓN: Link ETL de Precios
  ];

  // Renderizado del árbol DOM (Layout Principal)
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#030712] transition-colors duration-500 overflow-hidden font-sans w-full">
      {/* Renderizado condicional de velo oscuro para menú móvil */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Construcción de Barra Lateral (Sidebar) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#050810] border-r border-slate-800/80 flex flex-col shadow-[20px_0_40px_-15px_rgba(0,0,0,0.5)] transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        {/* Renderizado de Logotipo Empresarial */}
        <div className="h-28 md:h-32 w-full bg-[#000000] flex items-center justify-center relative overflow-hidden group border-b border-brand/20 p-4 shrink-0">
          <div className="absolute inset-0 bg-gradient-to-b from-brand/10 to-transparent opacity-40"></div>
          <img
            src={logoImg}
            alt="El Club de la Pintura"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 relative z-10 opacity-95"
          />
        </div>

        {/* Renderizado iterativo de enlaces de navegación */}
        <nav className="flex-1 overflow-y-auto py-6 md:py-8 px-4 md:px-5 space-y-2 md:space-y-3 custom-scrollbar">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-4 px-4 py-3 md:py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${isActive ? "bg-brand/10 text-brand border border-brand/20 shadow-sm" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
              >
                {/* Indicador visual de ruta activa */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand rounded-r-full shadow-[0_0_10px_#F59E0B]"></div>
                )}
                <item.icon
                  size={20}
                  className={`md:w-[22px] md:h-[22px] shrink-0 ${isActive ? "drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] text-brand" : "group-hover:scale-110 transition-transform duration-300"}`}
                />
                <span className="font-bold text-xs md:text-sm tracking-wide truncate">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Tarjeta de Identidad de Usuario (Footer del Sidebar) */}
        <div className="p-4 md:p-6 border-t border-white/5 bg-[#03050a] min-h-[90px] md:min-h-[100px] flex items-center shrink-0">
          <div className="flex w-full items-center space-x-3 md:space-x-4 bg-[#0a0f1c] p-2.5 md:p-3 rounded-2xl border border-white/5 shadow-sm">
            <div className="relative shrink-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white font-black text-lg md:text-xl shadow-lg ring-2 ring-white/10">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-emerald-500 rounded-full border-2 border-[#0a0f1c] animate-pulse"></div>
            </div>
            <div className="flex-1 flex flex-col justify-center min-w-0">
              <p className="text-xs md:text-sm font-black text-white break-words leading-tight">
                {user?.name}
              </p>
              <p className="text-[9px] md:text-[10px] font-black text-brand uppercase tracking-widest mt-1 truncate">
                {user?.role || "USUARIO"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Contenedor de Vista Principal y Cabecera Superior */}
      <div className="flex-1 flex flex-col relative w-full overflow-hidden">
        {/* Construcción de Cabecera Superior (Top Bar) */}
        <header className="h-20 md:h-24 bg-white/80 dark:bg-[#030712]/80 backdrop-blur-2xl border-b border-slate-200 dark:border-slate-800/50 flex items-center justify-between px-4 md:px-10 transition-colors duration-500 z-10 sticky top-0 shrink-0">
          <div className="flex items-center space-x-3 md:space-x-0">
            {/* Disparador de menú para dispositivos móviles */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <Menu size={20} />
            </button>
            <div className="flex flex-col">
              <span className="hidden md:flex text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-500 mb-1 items-center">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>{" "}
                Conexión Encriptada
              </span>
              <div className="text-lg md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 tracking-tight truncate max-w-[200px] md:max-w-none">
                Control Estratégico
              </div>
            </div>
          </div>

          {/* Botonera de acciones globales (Tema y Desconexión) */}
          <div className="flex items-center space-x-2 md:space-x-6">
            <button
              onClick={toggleTheme}
              className="p-2.5 md:p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:scale-110 hover:shadow-md transition-all duration-300"
            >
              {theme === "light" ? (
                <Moon size={18} className="md:w-[22px] md:h-[22px]" />
              ) : (
                <Sun size={18} className="md:w-[22px] md:h-[22px]" />
              )}
            </button>
            <button
              onClick={handleLogout}
              className="group flex items-center space-x-2 md:space-x-3 px-3 py-2 md:px-6 md:py-3 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></div>
              <Power
                size={18}
                strokeWidth={2.5}
                className="relative z-10 md:w-[20px] md:h-[20px]"
              />
              <span className="hidden md:inline font-bold text-sm tracking-wide relative z-10">
                Desconectar
              </span>
            </button>
          </div>
        </header>

        {/* Montaje de Vistas Enrutadas (Router Outlet) */}
        <main className="flex-1 overflow-y-auto relative z-0 scroll-smooth w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
