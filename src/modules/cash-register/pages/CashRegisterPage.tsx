import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  Lock,
  Unlock,
  DollarSign,
  Clock,
  ShieldCheck,
  Banknote,
  Calculator,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast"; // <-- LIBRERÍA MÁGICA

import { useAuth } from "../../../core/context/AuthContext";
import { CyberHeader } from "../../../shared/components/CyberHeader";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000/api";

interface ActiveShift {
  id: number;
  initialBalance: number;
  currentExpectedBalance: number;
  openingTime: string;
  status: string;
  user?: { name: string };
}
interface ExtendedUser {
  id: number;
  name: string;
  email: string;
  role: string;
  branches?: { id: number; name: string }[];
}

export const CashRegisterPage = () => {
  const { user } = useAuth();
  const token = localStorage.getItem("club_token");

  const currentUser = user as ExtendedUser | null;
  const currentBranchId = currentUser?.branches?.[0]?.id || 1;

  const [activeShift, setActiveShift] = useState<ActiveShift | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [initialBalance, setInitialBalance] = useState<string>("0");
  const [actualBalance, setActualBalance] = useState<string>("");
  const [observations, setObservations] = useState<string>("");
  const [isClosing, setIsClosing] = useState(false);

  const fetchShiftStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(
        `${API_URL}/cash-registers/${currentBranchId}/active?_t=${timestamp}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      const result = await response.json();
      if (response.ok && result.data) {
        setActiveShift(result.data);
      } else {
        setActiveShift(null);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al conectar con el servidor de caja.");
    } finally {
      setIsLoading(false);
    }
  }, [currentBranchId, token]);

  useEffect(() => {
    fetchShiftStatus();
  }, [fetchShiftStatus]);

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(initialBalance) < 0)
      return toast.error("El fondo inicial no puede ser negativo.");

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/cash-registers/open`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          initialBalance: Number(initialBalance),
          branchId: currentBranchId,
          userId: currentUser?.id || 1,
        }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      toast.success(result.message);
      fetchShiftStatus();
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Error al abrir la caja.";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    if (actualBalance === "")
      return toast.error("Debes declarar el dinero físico contado.");

    if (
      !window.confirm(
        "¿Estás seguro de cerrar el turno? Esta acción sellará la caja y registrará las diferencias.",
      )
    )
      return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/cash-registers/${activeShift.id}/close`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            actualBalance: Number(actualBalance),
            observations,
          }),
        },
      );
      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      toast.success("Turno cerrado y arqueado con éxito. ¡Buen descanso!");
      setIsClosing(false);
      setActualBalance("");
      setObservations("");
      fetchShiftStatus();
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Error al realizar el arqueo.";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] p-4 flex flex-col transition-colors duration-700">
      <div className="max-w-[1200px] mx-auto w-full flex-1 flex flex-col space-y-6">
        <CyberHeader
          phrases={[
            "Control Financiero Ciego",
            "Seguridad de Valores",
            "Registro Contable",
          ]}
          labelIcon={Wallet}
          labelText="Tesorería y Turnos"
          tags={[
            {
              text: activeShift ? "TURNO ACTIVO" : "CAJA CERRADA",
              icon: activeShift ? Unlock : Lock,
              delay: activeShift ? "text-emerald-500" : "text-slate-500",
            },
          ]}
        />

        {isLoading && !activeShift ? (
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Loader2 className="text-brand w-12 h-12" />
            </motion.div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {!activeShift ? (
              <motion.div
                key="open-shift"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex items-center justify-center"
              >
                <div className="bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-xl p-8 md:p-12 max-w-lg w-full">
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center border border-brand/20">
                      <Lock className="text-brand w-10 h-10" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-black text-center text-slate-800 dark:text-white mb-2">
                    Apertura de Turno
                  </h2>
                  <p className="text-center text-slate-500 dark:text-slate-400 text-sm font-medium mb-8 leading-relaxed">
                    Para comenzar a registrar ventas, declara el fondo de cambio
                    físico con el que inicia la caja hoy.
                  </p>

                  <form onSubmit={handleOpenShift} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                        Fondo de Cambio Inicial ($)
                      </label>
                      <div className="relative">
                        <DollarSign
                          className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                          size={24}
                        />
                        <input
                          type="number"
                          value={initialBalance}
                          onChange={(e) => setInitialBalance(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          min="0"
                          step="100"
                          required
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-14 pr-6 py-5 text-3xl font-black text-slate-800 dark:text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-5 bg-brand hover:bg-amber-600 text-white rounded-2xl font-black text-lg transition-all shadow-lg shadow-brand/30 flex items-center justify-center space-x-2 disabled:opacity-70"
                    >
                      {isLoading ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Unlock />
                      )}
                      <span>Habilitar Caja Registradora</span>
                    </button>
                  </form>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="active-shift"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative z-10">
                      <div className="flex items-center space-x-3 mb-8">
                        <ShieldCheck className="text-emerald-500 w-8 h-8" />
                        <div>
                          <h3 className="text-xl font-black text-slate-800 dark:text-white">
                            Turno Protegido Activo
                          </h3>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                            Operador:{" "}
                            {activeShift.user?.name || "Cajero Principal"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                            Apertura
                          </p>
                          <div className="flex items-center space-x-2 text-slate-800 dark:text-white">
                            <Clock size={20} className="text-slate-400" />
                            <span className="text-lg font-bold">
                              {new Date(
                                activeShift.openingTime,
                              ).toLocaleTimeString("es-AR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                            Fondo de Cambio
                          </p>
                          <div className="flex items-center space-x-2 text-slate-800 dark:text-white">
                            <Banknote size={20} className="text-emerald-500" />
                            <span className="text-lg font-bold">
                              $
                              {activeShift.initialBalance.toLocaleString(
                                "es-AR",
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {!isClosing && (
                      <button
                        onClick={() => setIsClosing(true)}
                        className="w-full relative z-10 py-5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-50 dark:hover:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg transition-all shadow-xl flex items-center justify-center space-x-3"
                      >
                        <Calculator size={24} />{" "}
                        <span>Iniciar Arqueo y Cierre de Caja</span>
                      </button>
                    )}
                  </div>

                  {!isClosing ? (
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-[2.5rem] p-8 shadow-lg flex flex-col items-center justify-center text-center">
                      <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                        <DollarSign className="text-emerald-600 dark:text-emerald-400 w-10 h-10" />
                      </div>
                      <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-2">
                        Dinero Esperado en Cajón
                      </p>
                      <h4 className="text-4xl font-black text-emerald-800 dark:text-emerald-300">
                        $
                        {activeShift.currentExpectedBalance.toLocaleString(
                          "es-AR",
                        )}
                      </h4>
                      <p className="text-xs font-bold text-emerald-600/70 dark:text-emerald-400/70 mt-4 leading-relaxed max-w-[200px]">
                        Esta cifra incluye el fondo inicial más todas las ventas
                        en efectivo registradas hoy.
                      </p>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-[2.5rem] p-8 shadow-xl flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-3 text-red-600 dark:text-red-400 mb-6">
                          <Lock size={24} />{" "}
                          <h3 className="text-lg font-black">Sellar Turno</h3>
                        </div>
                        <p className="text-sm font-bold text-red-800/70 dark:text-red-300/80 mb-6">
                          Contá los billetes en la caja registradora e ingresá
                          el monto total físico.
                        </p>
                        <div className="space-y-4 mb-6">
                          <div className="relative">
                            <DollarSign
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                              size={20}
                            />
                            <input
                              type="number"
                              placeholder="Dinero físico contado..."
                              value={actualBalance}
                              onChange={(e) => setActualBalance(e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 py-4 text-xl font-black text-slate-800 dark:text-white focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all"
                            />
                          </div>
                          <textarea
                            placeholder="Observaciones (Opcional)"
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                            rows={3}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all resize-none"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setIsClosing(false)}
                          className="px-4 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleCloseShift}
                          disabled={isLoading}
                          className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-sm shadow-lg shadow-red-600/30 transition-all flex justify-center items-center"
                        >
                          {isLoading ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            "Confirmar Cierre"
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
