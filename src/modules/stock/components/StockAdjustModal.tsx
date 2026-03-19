import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  PackagePlus,
  PackageMinus,
  Save,
  Loader2,
  ArrowRight,
  ShieldAlert,
  MessageSquareText,
  Package,
  UserCircle,
  Hand,
} from "lucide-react";

// 🛡️ NUEVO: Importamos el contexto de autenticación para saber quién está operando
import { useAuth } from "../../../core/context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000/api";

interface StockAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockItem: {
    productId: number;
    branchId: number;
    quantity: number;
    product: {
      name: string;
      sku: string;
      category?: string;
      imageUrl?: string;
    };
  } | null;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  token: string | null;
}

const ADD_PRESETS = [
  "Sobrante por Conteo",
  "Ingreso Inicial",
  "Devolución Interna",
  "Otro Motivo",
];
const SUBTRACT_PRESETS = [
  "Mercadería Dañada",
  "Producto Vencido",
  "Consumo Interno",
  "Faltante por Conteo",
  "Otro Motivo",
];

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  isOpen,
  onClose,
  stockItem,
  onSuccess,
  onError,
  token,
}) => {
  // 🛡️ NUEVO: Extraemos los datos del usuario actual
  const { user } = useAuth();

  const [adjustmentType, setAdjustmentType] = useState<"ADD" | "SUBTRACT">(
    "ADD",
  );
  const [quantity, setQuantity] = useState<string>("1");

  const [presetReason, setPresetReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [internalConsumer, setInternalConsumer] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setPresetReason("");
    setCustomReason("");
    setInternalConsumer("");
  }, [adjustmentType]);

  if (!isOpen || !stockItem) return null;

  const parsedQuantity = Math.abs(Number(quantity) || 0);

  const projectedStock =
    adjustmentType === "ADD"
      ? stockItem.quantity + parsedQuantity
      : stockItem.quantity - parsedQuantity;

  const isNegativeProjection = projectedStock < 0;

  let finalReason = presetReason;
  if (presetReason === "Otro Motivo") finalReason = customReason.trim();
  if (presetReason === "Consumo Interno")
    finalReason = `Consumo Interno: ${internalConsumer.trim()}`;

  const isInternalValid =
    presetReason === "Consumo Interno"
      ? internalConsumer.trim().length >= 2
      : true;
  const isCustomValid =
    presetReason === "Otro Motivo" ? customReason.trim().length >= 3 : true;
  const isReasonValid = presetReason !== "" && isInternalValid && isCustomValid;

  const isReadyToSubmit =
    parsedQuantity > 0 &&
    isReasonValid &&
    !isNegativeProjection &&
    !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReadyToSubmit) return;

    setIsSubmitting(true);
    try {
      const payload = {
        productId: Number(stockItem.productId),
        branchId: Number(stockItem.branchId) || 1,
        userId: Number(user?.id || 1), // 🛡️ ACÁ ESTÁ LA CLAVE: Mandamos el ID de quien hace el ajuste
        quantity: Number(parsedQuantity),
        type: adjustmentType === "ADD" ? "ADD" : "SUBTRACT",
        reason: finalReason.substring(0, 250),
      };

      const response = await fetch(`${API_URL}/stock/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      let result;
      const textResponse = await response.text();
      try {
        result = JSON.parse(textResponse);
      } catch (parseError) {
        console.error("Error de parseo en servidor:", parseError);
        throw new Error("Ocurrió un error de comunicación con el servidor.");
      }

      if (!response.ok) {
        let zodErrorMsg = "";
        if (result.details && Array.isArray(result.details)) {
          zodErrorMsg = result.details
            .map((d: { message: string }) => d.message)
            .join(" | ");
        }

        const backendError = (result.error || "").toLowerCase();

        if (
          response.status === 403 ||
          backendError.includes("shift") ||
          backendError.includes("register") ||
          backendError.includes("caja")
        ) {
          throw new Error(
            "Operación bloqueada: La CAJA registradora no está abierta.",
          );
        }

        throw new Error(
          zodErrorMsg ||
            result.error ||
            "Fallo transaccional (Error 400). Revisá los datos.",
        );
      }

      onSuccess(result.message || "El inventario se actualizó correctamente.");
      onClose();
      setQuantity("1");
      setPresetReason("");
      setCustomReason("");
      setInternalConsumer("");
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Error al procesar el ajuste.";
      onError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes("-")) return;
    setQuantity(val);
  };

  const currentPresets =
    adjustmentType === "ADD" ? ADD_PRESETS : SUBTRACT_PRESETS;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
        >
          <div className="p-5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                Ajuste de Inventario
              </h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Auditoría Logística
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div
              className={`p-4 rounded-2xl border transition-colors duration-300 ${isNegativeProjection ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40" : "bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800"}`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-1">
                  {stockItem.product.imageUrl ? (
                    <img
                      src={stockItem.product.imageUrl}
                      alt={stockItem.product.name}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <Package
                      className="text-slate-300 dark:text-slate-500"
                      size={24}
                    />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black text-brand uppercase tracking-widest bg-brand/10 px-2 py-0.5 rounded-md">
                      {stockItem.product.sku}
                    </span>
                    {stockItem.product.category && (
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-md truncate">
                        {stockItem.product.category}
                      </span>
                    )}
                  </div>
                  <p
                    className="text-sm font-bold text-slate-800 dark:text-white truncate"
                    title={stockItem.product.name}
                  >
                    {stockItem.product.name}
                  </p>
                </div>
              </div>

              <div
                className={`flex items-center justify-center space-x-4 py-3 rounded-xl border shadow-sm relative z-10 transition-colors ${isNegativeProjection ? "bg-red-100/50 dark:bg-red-900/40 border-red-200 dark:border-red-800" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"}`}
              >
                <div className="flex flex-col items-center w-24">
                  <span className="text-[10px] font-black text-slate-400 uppercase">
                    Stock Físico
                  </span>
                  <span className="text-xl font-black text-slate-700 dark:text-slate-300">
                    {stockItem.quantity}
                  </span>
                </div>
                <ArrowRight
                  size={20}
                  className={
                    isNegativeProjection
                      ? "text-red-400"
                      : "text-slate-300 dark:text-slate-600"
                  }
                />
                <div className="flex flex-col items-center w-24">
                  <span className="text-[10px] font-black text-slate-400 uppercase">
                    Stock Final
                  </span>
                  <span
                    className={`text-2xl font-black transition-colors ${isNegativeProjection ? "text-red-600 dark:text-red-400" : "text-brand"}`}
                  >
                    {projectedStock}
                  </span>
                </div>
              </div>

              <AnimatePresence>
                {isNegativeProjection && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="flex items-start space-x-2 text-left bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 p-3 rounded-xl"
                  >
                    <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                    <p className="text-xs font-bold leading-tight">
                      La cantidad a descontar supera las existencias físicas del
                      sistema.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAdjustmentType("ADD")}
                className={`flex items-center justify-center space-x-2 py-3.5 rounded-xl border-2 transition-all hover:scale-[1.02] ${adjustmentType === "ADD" ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/10" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:border-emerald-500/50"}`}
              >
                <PackagePlus size={18} />{" "}
                <span className="font-black text-xs uppercase tracking-wide">
                  Ingresar
                </span>
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType("SUBTRACT")}
                className={`flex items-center justify-center space-x-2 py-3.5 rounded-xl border-2 transition-all hover:scale-[1.02] ${adjustmentType === "SUBTRACT" ? "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 shadow-md shadow-red-500/10" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:border-red-500/50"}`}
              >
                <PackageMinus size={18} />{" "}
                <span className="font-black text-xs uppercase tracking-wide">
                  Descontar
                </span>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                  ¿Qué cantidad exacta vas a{" "}
                  {adjustmentType === "ADD" ? "sumar al" : "descontar del"}{" "}
                  stock físico?
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={handleQuantityChange}
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e") e.preventDefault();
                  }}
                  required
                  className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-xl px-4 py-3 text-lg font-black focus:outline-none focus:ring-1 transition-all ${isNegativeProjection ? "border-red-400 text-red-500 focus:border-red-500 focus:ring-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:border-brand focus:ring-brand"}`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <MessageSquareText size={14} />{" "}
                    <span>Motivo del Ajuste</span>
                  </label>

                  <AnimatePresence>
                    {!presetReason && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-1 text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md animate-pulse"
                      >
                        <Hand size={12} className="rotate-90" /> Requerido
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {currentPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPresetReason(preset)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer hover:scale-[1.03] ${
                        presetReason === preset
                          ? "bg-brand text-white border-brand shadow-md shadow-brand/30"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand/40 hover:bg-brand/5"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {presetReason === "Consumo Interno" && (
                    <motion.div
                      key="interno"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-3"
                    >
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <UserCircle size={18} />
                        </div>
                        <input
                          type="text"
                          placeholder="¿Quién utilizará este material? (Ej: Cristian, Empleado...)"
                          value={internalConsumer}
                          onChange={(e) => setInternalConsumer(e.target.value)}
                          required
                          className="w-full bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all shadow-inner"
                        />
                      </div>
                    </motion.div>
                  )}

                  {presetReason === "Otro Motivo" && (
                    <motion.div
                      key="otro"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-3"
                    >
                      <input
                        type="text"
                        placeholder="¿Qué sucedió con este producto? Detallar brevemente..."
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        required
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all shadow-inner"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isReadyToSubmit}
              className={`w-full py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center space-x-2 
                ${
                  isSubmitting
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-wait"
                    : isNegativeProjection
                      ? "bg-red-100 dark:bg-red-900/30 text-red-400 dark:text-red-500 cursor-not-allowed border border-red-200 dark:border-red-800/50"
                      : parsedQuantity <= 0
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                        : !isReasonValid
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                          : "bg-brand hover:bg-amber-600 text-white shadow-lg shadow-brand/30 hover:scale-[1.02]"
                }`}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Save size={20} />
              )}
              <span>
                {isSubmitting
                  ? "GUARDANDO CAMBIOS..."
                  : isNegativeProjection
                    ? "STOCK FINAL INVÁLIDO"
                    : parsedQuantity <= 0
                      ? "INGRESÁ UNA CANTIDAD"
                      : !isReasonValid
                        ? "SELECCIONÁ UN MOTIVO PARA CONTINUAR"
                        : "CONFIRMAR AJUSTE DE INVENTARIO"}
              </span>
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
