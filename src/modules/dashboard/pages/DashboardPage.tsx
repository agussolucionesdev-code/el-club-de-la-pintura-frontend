import React, { useState, useRef, useEffect, useCallback } from "react";
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

interface KpiCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  delay: string;
}
interface ValueTagProps {
  text: string;
  animationClass: string;
  delay: string;
  icon: React.ElementType;
}

// --- 1. DICCIONARIO DE SALUDOS EMPÁTICOS Y TRANQUILIZADORES ---
const getGreetingPhrase = (name: string): string => {
  const currentHour = new Date().getHours();
  const timeOfDay =
    currentHour >= 5 && currentHour < 12
      ? "Buenos días"
      : currentHour >= 12 && currentHour < 20
        ? "Buenas tardes"
        : "Buenas noches";
  const phrases = [
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
  return phrases[Math.floor(Math.random() * phrases.length)];
};
const extractFirstName = (fullName: string): string => fullName.split(" ")[0];

// --- 2. ETIQUETAS (Diseño intacto, adaptables) ---
const ValueTag = ({
  text,
  animationClass,
  delay,
  icon: Icon,
}: ValueTagProps) => (
  <div
    className={`opacity-0 ${animationClass} flex items-center space-x-2 bg-white dark:bg-slate-800/80 backdrop-blur-xl border border-slate-100 dark:border-slate-700/50 px-3 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl shadow-sm hover:border-amber-300 dark:hover:border-slate-700/50 hover:shadow-[0_8px_20px_rgba(245,158,11,0.2)] dark:hover:shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:-translate-y-1 text-slate-800 dark:text-slate-200 font-bold text-[10px] md:text-xs tracking-wide transition-all duration-300 cursor-default shrink-0`}
    style={{ animationDelay: delay }}
  >
    <Icon
      size={14}
      className="text-amber-600 dark:text-brand md:w-[16px] md:h-[16px]"
    />
    <span>{text}</span>
  </div>
);

// --- 3. MOTOR 3D (Fluido, con Linterna y Brillo en Modo Claro) ---
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
  const [personalizedGreeting] = useState(() =>
    user?.name
      ? getGreetingPhrase(extractFirstName(user.name))
      : "Panel estratégico en línea",
  );

  const [visibleChars, setVisibleChars] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  // --- 4. SECUENCIA CIBER-SENSORIAL (AUDIO + TIPEO PERFECTO) ---
  useEffect(() => {
    let typingInterval: ReturnType<typeof setInterval> | null = null;
    let audioCtx: AudioContext | null = null;
    let sequenceStarted = false;

    const startSequence = () => {
      if (sequenceStarted) return;
      sequenceStarted = true;
      setIsTyping(true);

      // --- VOZ ---
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(personalizedGreeting);
        utterance.lang = "es-AR";
        utterance.rate = 0.95;
        const voices = window.speechSynthesis.getVoices();
        const bestVoice =
          voices.find(
            (v) =>
              v.lang.includes("es") &&
              (v.name.includes("Google") || v.name.includes("Sabina")),
          ) || voices.find((v) => v.lang.includes("es"));
        if (bestVoice) utterance.voice = bestVoice;
        window.speechSynthesis.speak(utterance);
      }

      // --- EFECTO MÁQUINA DE ESCRIBIR (Ahora avanza letra a letra) ---
      let currentIdx = 0;
      typingInterval = setInterval(() => {
        setVisibleChars(currentIdx + 1);

        // Sonido de tecla suave
        if (personalizedGreeting[currentIdx] !== " ") {
          try {
            if (!audioCtx) {
              const AudioContextClass =
                window.AudioContext ||
                (
                  window as unknown as {
                    webkitAudioContext: typeof AudioContext;
                  }
                ).webkitAudioContext;
              audioCtx = new AudioContextClass();
            }
            if (audioCtx.state === "suspended") audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = "sine";
            osc.frequency.setValueAtTime(
              500 + Math.random() * 100,
              audioCtx.currentTime,
            );
            gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(
              0.001,
              audioCtx.currentTime + 0.03,
            );
            osc.start();
            osc.stop(audioCtx.currentTime + 0.03);
          } catch (e) {
            console.log(e);
            /* Silencio seguro */
          }
        }

        currentIdx++;
        if (currentIdx >= personalizedGreeting.length) {
          if (typingInterval) clearInterval(typingInterval);
          setIsTyping(false); // Detiene el cursor cuando termina
        }
      }, 45); // Velocidad fluida
    };

    // GATILLO UNIVERSAL
    const unlockAndStart = () => {
      startSequence();
      document.removeEventListener("click", unlockAndStart);
      document.removeEventListener("keydown", unlockAndStart);
    };

    if (navigator.userActivation && navigator.userActivation.hasBeenActive) {
      setTimeout(startSequence, 300);
    } else {
      document.addEventListener("click", unlockAndStart, { once: true });
      document.addEventListener("keydown", unlockAndStart, { once: true });
    }

    return () => {
      if (typingInterval) clearInterval(typingInterval);
      window.speechSynthesis.cancel();
      if (audioCtx) audioCtx.close();
      document.removeEventListener("click", unlockAndStart);
      document.removeEventListener("keydown", unlockAndStart);
    };
  }, [personalizedGreeting]);

  return (
    <div className="relative min-h-full bg-[#F4F7F9] dark:bg-[#030712] p-4 md:p-6 lg:p-10 overflow-hidden transition-colors duration-700 w-full">
      <div className="absolute top-[-10%] left-[-10%] w-[50rem] h-[50rem] bg-amber-400/10 dark:bg-brand/5 rounded-full blur-[150px] opacity-70 pointer-events-none"></div>

      <div className="relative z-10 max-w-[1400px] mx-auto w-full">
        <div className="mb-10 md:mb-16 flex flex-col justify-start">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 md:space-x-2.5 md:px-4 md:py-2 rounded-lg md:rounded-xl bg-white dark:bg-brand/10 border border-slate-200 dark:border-brand/20 text-amber-600 dark:text-brand text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mb-4 md:mb-6 shadow-sm w-fit transition-colors duration-500">
            <Sparkles
              size={14}
              className="animate-pulse md:w-[16px] md:h-[16px]"
            />
            <span>Inteligencia Operativa</span>
          </div>

          {/* ============================================================== */}
          {/* SOLUCIÓN EFECTO BOLÍGRAFO: El cursor sigue al texto dinámicamente */}
          {/* ============================================================== */}
          <div className="relative mb-6 md:mb-10 w-full max-w-5xl">
            {/* Texto Fantasma (Invisible): Solo sirve para sostener el layout y que la página no salte */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black leading-[1.6] md:leading-[1.8] tracking-[0.05em] md:tracking-[0.08em] pr-2 md:pr-4 opacity-0 pointer-events-none break-words w-full">
              {personalizedGreeting}
            </h1>

            {/* Texto Real + Cursor Inteligente */}
            <div className="absolute top-0 left-0 w-full h-full flex items-start">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black text-slate-800 dark:text-white leading-[1.6] md:leading-[1.8] tracking-[0.05em] md:tracking-[0.08em] pr-2 md:pr-4 drop-shadow-sm break-words w-full">
                {/* Cortamos la frase dinámicamente letra por letra */}
                {personalizedGreeting.substring(0, visibleChars)}

                {/* El cursor se ancla al lado de la última letra visible */}
                <span
                  className={`inline-block align-text-bottom ml-1 w-[3px] md:w-[4px] h-[0.9em] bg-brand rounded-sm ${isTyping ? "animate-pulse" : "hidden"}`}
                ></span>
              </h1>
            </div>
          </div>

          {/* ETIQUETAS */}
          <div className="flex flex-wrap gap-2 md:gap-4 mt-2">
            <ValueTag
              text="Sincronización Total"
              icon={Network}
              animationClass="animate-slide-in-left"
              delay="500ms"
            />
            <ValueTag
              text="Dinámico"
              icon={Zap}
              animationClass="animate-slide-in-left"
              delay="600ms"
            />
            <ValueTag
              text="Práctico"
              icon={Crosshair}
              animationClass="animate-slide-in-bottom"
              delay="700ms"
            />
            <ValueTag
              text="Flexible"
              icon={Layers}
              animationClass="animate-slide-in-bottom"
              delay="800ms"
            />
            <ValueTag
              text="Eficaz"
              icon={Target}
              animationClass="animate-slide-in-bottom"
              delay="900ms"
            />
            <ValueTag
              text="Innovador"
              icon={Lightbulb}
              animationClass="animate-slide-in-bottom"
              delay="1000ms"
            />
            <ValueTag
              text="Seguro"
              icon={ShieldCheck}
              animationClass="animate-slide-in-right"
              delay="1100ms"
            />
            <ValueTag
              text="Automatizado"
              icon={Cpu}
              animationClass="animate-slide-in-right"
              delay="1200ms"
            />
            <ValueTag
              text="Escalable"
              icon={TrendingUp}
              animationClass="animate-slide-in-right"
              delay="1300ms"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-10 md:mb-16 relative z-10">
          <Card3D
            title="Caja Actual"
            value="$ 1.458.200"
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
