import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { useAuth } from "../../../core/context/AuthContext";
import { useTheme } from "../../../core/context/ThemeContext";
import { api } from "../../../core/api/api";
import {
  Lock,
  Mail,
  Sun,
  Moon,
  Loader2,
  Eye,
  EyeOff,
  Unlock,
  KeyRound,
  Volume2,
  VolumeX,
} from "lucide-react";
import axios from "axios";

// 🛡️ IMPORTACIONES
import logoImg from "../../../assets/images/logo.png";
import ambientSound from "../../../assets/music/waves.mp3";

export const LoginPage = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const waveAudioRef = useRef<HTMLAudioElement | null>(null);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isFormValid = isValidEmail && password.length >= 6;

  // ============================================================================
  // 🌊 MOTOR DE AUDIO SINCRONIZADO
  // ============================================================================
  useEffect(() => {
    waveAudioRef.current = new Audio(ambientSound);
    waveAudioRef.current.loop = true;
    waveAudioRef.current.volume = 0;

    let volumeInterval: ReturnType<typeof setInterval>;

    if (isAudioPlaying && waveAudioRef.current) {
      waveAudioRef.current.play().catch(() => setIsAudioPlaying(false));

      let time = 0;
      volumeInterval = setInterval(() => {
        time += 0.1;
        const swell = 0.22 + Math.sin(time) * 0.12;
        if (waveAudioRef.current)
          waveAudioRef.current.volume = Math.max(0.05, Math.min(swell, 1));
      }, 200);
    } else {
      if (waveAudioRef.current) waveAudioRef.current.pause();
    }

    return () => {
      clearInterval(volumeInterval);
      if (waveAudioRef.current) waveAudioRef.current.pause();
    };
  }, [isAudioPlaying]);

  const toggleAudio = () => setIsAudioPlaying(!isAudioPlaying);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/users/login", { email, password });
      login(response.data.token, response.data.user);

      const redirectPath = sessionStorage.getItem("club_redirect_path");
      if (redirectPath && redirectPath !== "/login") {
        sessionStorage.removeItem("club_redirect_path");
        navigate(redirectPath, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.error ||
            "Revisá tus credenciales, algo no coincide.",
        );
      } else {
        setError("Ocurrió un error de conexión.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // 🎨 ANIMACIONES ORGÁNICAS
  // ============================================================================
  const formVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        type: "spring",
        bounce: 0.4,
        staggerChildren: 0.1,
      },
    },
  };

  const inputVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300 } },
  };

  const wave1: Variants = {
    animate: {
      x: ["0%", "-50%"],
      y: ["0%", "4%", "0%"],
      scaleY: [1, 1.05, 1],
      transition: {
        x: { repeat: Infinity, duration: 20, ease: "linear" },
        y: { repeat: Infinity, duration: 6, ease: "easeInOut" },
      },
    },
  };
  const wave2: Variants = {
    animate: {
      x: ["-50%", "0%"],
      y: ["4%", "0%", "4%"],
      scaleY: [1.05, 1, 1.05],
      transition: {
        x: { repeat: Infinity, duration: 25, ease: "linear" },
        y: { repeat: Infinity, duration: 8, ease: "easeInOut" },
      },
    },
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-1000 overflow-hidden font-sans bg-slate-100 dark:bg-[#04060C]">
      {/* FONDO ANIMADO DE PINTURA */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* OLAS DE PINTURA */}
        <div className="absolute bottom-0 left-0 w-[200%] h-[35vh] opacity-60 dark:opacity-40 mix-blend-multiply dark:mix-blend-screen origin-bottom">
          <motion.div
            variants={wave1}
            animate="animate"
            className="absolute bottom-[-10px] w-full h-full"
          >
            <svg
              viewBox="0 0 2880 400"
              className="w-full h-full drop-shadow-2xl"
              preserveAspectRatio="none"
            >
              <path
                fill="#ea580c"
                d="M0,150 C320,300 420,0 720,100 C1020,200 1120,50 1440,150 C1760,250 1860,0 2160,100 C2460,200 2560,300 2880,150 L2880,400 L0,400 Z"
              ></path>
            </svg>
          </motion.div>
          <motion.div
            variants={wave2}
            animate="animate"
            className="absolute bottom-[-5px] w-full h-full opacity-90"
          >
            <svg
              viewBox="0 0 2880 400"
              className="w-full h-full drop-shadow-2xl"
              preserveAspectRatio="none"
            >
              <path
                fill="#f59e0b"
                d="M0,200 C250,50 450,250 720,150 C990,50 1190,300 1440,200 C1690,100 1890,250 2160,150 C2430,50 2630,300 2880,200 L2880,400 L0,400 Z"
              ></path>
            </svg>
          </motion.div>
          <motion.div
            variants={wave1}
            animate="animate"
            className="absolute bottom-0 w-full h-full opacity-70"
          >
            <svg
              viewBox="0 0 2880 400"
              className="w-full h-full drop-shadow-xl"
              preserveAspectRatio="none"
            >
              <path
                fill="#fbbf24"
                d="M0,250 C400,100 500,350 720,250 C940,150 1040,100 1440,250 C1840,400 1940,150 2160,250 C2380,350 2480,100 2880,250 L2880,400 L0,400 Z"
              ></path>
            </svg>
          </motion.div>
        </div>
      </div>

      {/* BOTONERA FLOTANTE */}
      <div className="absolute top-6 right-6 flex flex-col gap-4 z-50">
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={toggleTheme}
          className="p-4 rounded-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-xl text-slate-700 dark:text-brand hover:scale-110 transition-all duration-300"
        >
          {theme === "light" ? <Moon size={22} /> : <Sun size={22} />}
        </motion.button>
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          onClick={toggleAudio}
          className={`p-4 rounded-full backdrop-blur-xl border shadow-xl transition-all duration-300 hover:scale-110 ${isAudioPlaying ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-400" : "bg-white/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-400"}`}
        >
          {isAudioPlaying ? <Volume2 size={22} /> : <VolumeX size={22} />}
        </motion.button>
      </div>

      {/* ========================================================== */}
      {/* TARJETA DE LOGIN Y EMBLEMA DEL LOGO (Rediseño Estructural) */}
      {/* ========================================================== */}
      <motion.div
        variants={formVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full max-w-[420px] flex flex-col items-center"
      >
        {/* EMBLEMA CIRCULAR FLOTANTE */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-20 mb-[-50px] w-36 h-36 rounded-full bg-[#050300] border-4 border-white/20 dark:border-brand/40 shadow-[0_10px_30px_rgba(245,158,11,0.4)] flex items-center justify-center overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-brand/20 to-transparent pointer-events-none"></div>
          <img
            src={logoImg}
            alt="El Club de la Pintura"
            className="w-28 h-28 object-contain"
          />
        </motion.div>

        {/* FORMULARIO DE CRISTAL */}
        <div className="w-full bg-white/80 dark:bg-[#0a0f1c]/80 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.3)] border border-white/60 dark:border-slate-700/50 pt-16 pb-10 px-8 sm:px-10 relative z-10">
          <motion.div variants={inputVariants} className="text-center mb-8">
            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              Acceso Central
            </h2>
            <p className="text-xs font-bold text-slate-500 mt-2">
              Plataforma operativa en línea.
            </p>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-2xl mb-6 text-sm text-center font-bold"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div variants={inputVariants}>
              <div
                className={`relative group flex items-center border-2 rounded-2xl transition-all duration-300 bg-slate-50/50 dark:bg-black/40 ${isValidEmail ? "border-brand" : "border-slate-200 dark:border-slate-800/80 focus-within:border-brand/50"}`}
              >
                <div
                  className={`pl-4 transition-colors ${isValidEmail ? "text-brand" : "text-slate-400 group-focus-within:text-brand"}`}
                >
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-3 pr-4 py-4 bg-transparent text-slate-900 dark:text-white font-bold outline-none placeholder-slate-400"
                  placeholder="admin@elclub.com"
                  required
                />
              </div>
            </motion.div>

            <motion.div variants={inputVariants}>
              <div
                className={`relative group flex items-center border-2 rounded-2xl transition-all duration-300 bg-slate-50/50 dark:bg-black/40 ${password.length >= 6 ? "border-brand" : "border-slate-200 dark:border-slate-800/80 focus-within:border-brand/50"}`}
              >
                <div
                  className={`pl-4 transition-colors ${password.length >= 6 ? "text-brand" : "text-slate-400 group-focus-within:text-brand"}`}
                >
                  <KeyRound size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3 pr-12 py-4 bg-transparent text-slate-900 dark:text-white font-bold outline-none placeholder-slate-400 tracking-widest"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-brand transition-colors outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </motion.div>

            <motion.div variants={inputVariants} className="pt-2">
              <motion.button
                whileHover={
                  isFormValid
                    ? {
                        scale: 1.03,
                        boxShadow: "0px 15px 30px -5px rgba(245,158,11,0.5)",
                      }
                    : {}
                }
                whileTap={isFormValid ? { scale: 0.95 } : {}}
                type="submit"
                disabled={loading || !isFormValid}
                className={`w-full text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all duration-500 flex justify-center items-center ${isFormValid ? "bg-gradient-to-r from-brand to-amber-500 shadow-xl" : "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed"} ${loading ? "opacity-70 cursor-wait" : ""}`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={20} /> Conectando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 relative z-10">
                    {isFormValid ? <Unlock size={20} /> : <Lock size={20} />}{" "}
                    Iniciar Operación
                  </span>
                )}
              </motion.button>
            </motion.div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
