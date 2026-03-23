import React, { useState, useRef, useCallback } from "react";
import {
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  Sparkles,
  Target,
  Zap,
  Crosshair,
  Network,
  ShieldCheck,
  LineChart,
  Lightbulb,
  Cpu,
  Layers,
} from "lucide-react";
import { useAuth } from "../../../core/context/AuthContext";
// 🛡️ IMPORTAMOS EL COMPONENTE COMPARTIDO QUE CREASTE
import { CyberHeader } from "../../../shared/components/CyberHeader";
// 🛡️ IMPORTAMOS EL FORMATEADOR GLOBAL
import { formatCurrency } from "../../../shared/utils/formatters";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  delay: string;
}

// --- 1. GENERADOR DE FRASES ---
const getGreetingPhrases = (name: string): string[] => {
  const currentHour = new Date().getHours();
  const timeOfDay =
    currentHour >= 5 && currentHour < 12
      ? "Buenos días"
      : currentHour >= 12 && currentHour < 20
        ? "Buenas tardes"
        : "Buenas noches";

  return [
    `¡${timeOfDay}, ${name}! Tranquilidad total, tu inventario está asegurado.`,
    `¡Qué gusto verte, ${name}! Todo el sistema trabaja para tu negocio.`,
    `Bienvenido a tu Bóveda Estratégica, ${name}. Todo está bajo control.`,
    `¡${timeOfDay}, ${name}! Te preparamos un resumen detallado de hoy.`,
    `Hola ${name}. Tus métricas están seguras, precisas y actualizadas.`,
    `¡Excelente jornada, ${name}! El flujo de caja está fluyendo perfectamente.`,
    `Acceso administrador concedido. ${name}, el control es todo tuyo.`,
    `¡${timeOfDay}! El Club de la Pintura está monitoreado al 100%, ${name}.`,
    `Relajate, ${name}. La trazabilidad inteligente de tu stock está activa.`,
    `Hola ${name}. Desplegando tus estadísticas con precisión milimétrica.`,
    `¡Hola de nuevo, ${name}! Optimizamos los procesos para que rindas más.`,
    `Tu panel de control te espera, ${name}. Listo para tomar decisiones.`,
    `¡${timeOfDay}, ${name}! El motor analítico está protegiendo tus datos.`,
    `Bienvenido, ${name}. Las operaciones de hoy están en orden.`,
    `Sistemas estables y seguros. Adelante con la gestión, ${name}.`,
  ];
};

const extractFirstName = (fullName: string): string => fullName.split(" ")[0];

// --- 2. MOTOR 3D (Tarjetas de Métricas) ---
const Card3D = ({
  title,
  value,
  subtitle,
  icon: Icon,
  delay,
}: KpiCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768) return;
    if (!cardRef.current || !glareRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateY = (x / rect.width - 0.5) * 20;
    const rotateX = (y / rect.height - 0.5) * -20;

    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    glareRef.current.style.opacity = "1";
    glareRef.current.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.6) 0%, transparent 60%)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (cardRef.current && glareRef.current) {
      cardRef.current.style.transform =
        "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
      glareRef.current.style.opacity = "0";
    }
  }, []);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-36 md:h-48 opacity-0 animate-fade-in-up group z-10 hover:z-50 transition-all duration-300"
      style={{ animationDelay: delay }}
    >
      <div
        ref={cardRef}
        className="w-full h-full relative rounded-2xl md:rounded-[2rem] bg-white dark:bg-slate-900/60 backdrop-blur-3xl border border-slate-100 dark:border-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.04)] dark:shadow-glass-dark group-hover:border-amber-300/80 dark:group-hover:border-white/10 group-hover:shadow-[0_20px_40px_rgba(245,158,11,0.15)] dark:group-hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          ref={glareRef}
          className="absolute inset-0 pointer-events-none opacity-0 mix-blend-overlay transition-opacity duration-300 z-0 hidden md:block"
        ></div>

        <div
          className="absolute inset-0 p-5 md:p-7 flex flex-col justify-between z-10"
          style={{ transform: "translateZ(40px)" }}
        >
          <div className="flex justify-between items-start">
            <p className="text-[10px] md:text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] drop-shadow-sm">
              {title}
            </p>
            <div
              className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all duration-300 ${isHovered ? "bg-gradient-to-br from-brand to-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.6)] md:scale-110" : "bg-amber-50 dark:bg-slate-800 text-amber-600 dark:text-brand shadow-sm"}`}
            >
              <Icon
                size={20}
                strokeWidth={2.5}
                className="md:w-[24px] md:h-[24px]"
              />
            </div>
          </div>
          <div style={{ transform: "translateZ(30px)" }}>
            <h3 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tighter truncate drop-shadow-md">
              {value}
            </h3>
            <p className="text-xs md:text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center mt-1 md:mt-2">
              <TrendingUp
                size={14}
                className="mr-1 md:mr-1.5 md:w-[16px] md:h-[16px]"
              />
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DashboardPage = () => {
  const { user } = useAuth();

  // Generamos la lista de frases para el componente CyberHeader
  const headerPhrases = user?.name
    ? getGreetingPhrases(extractFirstName(user.name))
    : ["Panel estratégico en línea. Conectando..."];

  // Configuración de Etiquetas usando clases utilitarias de Tailwind (incluyendo el delay arbitrario)
  const dashboardTags = [
    {
      text: "Sincronización Total",
      icon: Network,
      delay: "[animation-delay:500ms]",
    },
    { text: "Dinámico", icon: Zap, delay: "[animation-delay:600ms]" },
    { text: "Práctico", icon: Crosshair, delay: "[animation-delay:700ms]" },
    { text: "Flexible", icon: Layers, delay: "[animation-delay:800ms]" },
    { text: "Eficaz", icon: Target, delay: "[animation-delay:900ms]" },
    { text: "Innovador", icon: Lightbulb, delay: "[animation-delay:1000ms]" },
    { text: "Seguro", icon: ShieldCheck, delay: "[animation-delay:1100ms]" },
    { text: "Automatizado", icon: Cpu, delay: "[animation-delay:1200ms]" },
    { text: "Escalable", icon: TrendingUp, delay: "[animation-delay:1300ms]" },
  ];

  return (
    <div className="relative min-h-full bg-[#F4F7F9] dark:bg-[#030712] p-4 md:p-6 lg:p-10 overflow-hidden transition-colors duration-700 w-full">
      {/* Resplandor de fondo corporativo */}
      <div className="absolute top-[-10%] left-[-10%] w-[50rem] h-[50rem] bg-amber-400/10 dark:bg-brand/5 rounded-full blur-[150px] opacity-70 pointer-events-none"></div>

      <div className="relative z-10 max-w-[1400px] mx-auto w-full">
        {/* 🛡️ INYECCIÓN DEL COMPONENTE CYBERHEADER */}
        <CyberHeader
          phrases={headerPhrases}
          labelIcon={Sparkles}
          labelText="Inteligencia Operativa"
          tags={dashboardTags}
        />

        {/* TARJETAS KPI 3D */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-10 md:mb-16 relative z-10 mt-8">
          <Card3D
            title="Caja Actual"
            // 🛡️ APLICAMOS EL FORMATEADOR GLOBAL: Pasamos el número crudo y él se encarga
            value={formatCurrency(1458200.5)}
            subtitle="Actualizado hace 1m"
            icon={DollarSign}
            delay="100ms"
          />
          <Card3D
            title="Órdenes"
            value="24"
            subtitle="Logística operativa"
            icon={ShoppingCart}
            delay="200ms"
          />
          <Card3D
            title="Stock Crítico"
            value="12 ítems"
            subtitle="Requiere acción"
            icon={Package}
            delay="300ms"
          />
          <Card3D
            title="Nuevas Cuentas"
            value="+5"
            subtitle="Crecimiento semanal"
            icon={Users}
            delay="400ms"
          />
        </div>

        {/* LIENZO ANALÍTICO */}
        <div
          className="w-full h-[300px] md:h-[450px] relative rounded-2xl md:rounded-[2.5rem] bg-white dark:bg-slate-900/40 backdrop-blur-3xl border border-slate-100 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-2xl overflow-hidden opacity-0 animate-fade-in-up flex flex-col items-center justify-center group hover:shadow-[0_20px_50px_rgba(245,158,11,0.08)] dark:hover:shadow-[0_30px_70px_rgba(0,0,0,0.15)] hover:border-amber-200/50 dark:hover:border-slate-700/50 transition-all duration-700 z-0"
          style={{ animationDelay: "1400ms" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 to-transparent dark:from-brand/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

          <div className="p-6 md:p-8 rounded-full bg-amber-50 dark:bg-slate-800/50 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-700 relative z-10 border border-amber-100 dark:border-slate-700">
            <LineChart
              size={48}
              className="md:w-[72px] md:h-[72px] text-amber-600 dark:text-brand drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]"
            />
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white mb-2 md:mb-4 tracking-tight relative z-10 text-center px-4">
            Motor Analítico Cuántico
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-xs md:text-lg uppercase tracking-widest relative z-10 text-center px-4">
            Renderizando gráficas estadísticas...
          </p>
        </div>
      </div>
    </div>
  );
};
