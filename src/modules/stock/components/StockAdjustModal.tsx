// Importación de dependencias base de React
import React, { useState, useEffect } from "react";
// Importación de iconografía vectorizada
import {
  X,
  Save,
  Loader2,
  ArrowUpCircle,
  ArrowDownCircle,
  SlidersHorizontal,
  Package,
  FileText,
  Activity,
} from "lucide-react";

// Definición de variable de entorno para consumo de API
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000/api";

// Definición de interfaz estructural del ítem en tránsito
export interface StockAdjustItem {
  productId: number;
  branchId: number;
  quantity: number;
  product: {
    name: string;
    sku: string;
  };
}

// Definición de propiedades del componente modal
interface StockAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockItem: StockAdjustItem | null;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  token: string | null;
}

export const StockAdjustModal = ({
  isOpen,
  onClose,
  stockItem,
  onSuccess,
  onError,
  token,
}: StockAdjustModalProps) => {
  // Inicialización de estados de renderizado y animación
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicialización de estados de control transaccional
  const [type, setType] = useState<"ADD" | "SUBTRACT" | "SET">("ADD");
  const [quantity, setQuantity] = useState<number | "">("");
  const [reason, setReason] = useState("");

  // Disparo de efecto secundario para ciclo de vida de apertura
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsAnimating(true), 10);
      // Purga de formulario ante nueva instancia
      setType("ADD");
      setQuantity("");
      setReason("");
      return () => clearTimeout(timer);
    }
  }, [isOpen, stockItem]);

  // Manejo de cierre asíncrono para ejecución de transiciones CSS
  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 300);
  };

  // Ejecución de transacción hacia el motor de backend (Aduana Zod)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockItem || quantity === "" || Number(quantity) <= 0) return;

    setIsSubmitting(true);

    // Conformación de Payload con blindaje de tipado
    const payload = {
      productId: stockItem.productId,
      branchId: stockItem.branchId,
      quantity: Number(quantity),
      type,
      reason: reason.trim() || "Ajuste de stock manual",
    };

    try {
      const response = await fetch(`${API_URL}/stock/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      // Interceptor de errores y mapeo de bloqueos Zod
      if (!response.ok) {
        if (result.details) {
          const camposConError = result.details
            .map((d: { path: string }) => d.path)
            .join(", ");
          throw new Error(`Violación de esquema en: ${camposConError}`);
        }
        throw new Error(result.error || "Fallo transaccional en el servidor");
      }

      onSuccess(`Inventario actualizado con éxito. Movimiento: ${type}`);
      handleClose();
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Error desconocido";
      onError(`ZOD / Backend: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prevención de renderizado fantasma en estado de reposo
  if (!isOpen && !isAnimating) return null;
  if (!stockItem) return null;

  // Calculadora proyectiva de saldo de inventario (Feedback UX)
  const calculateNewStock = () => {
    const q = Number(quantity) || 0;
    if (type === "ADD") return stockItem.quantity + q;
    if (type === "SUBTRACT") return stockItem.quantity - q;
    return q; // Estado SET
  };
  const projectedStock = calculateNewStock();
  const isInvalidSubtraction = type === "SUBTRACT" && projectedStock < 0;

  // Renderizado del árbol DOM
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      {/* Renderizado de velo de desenfoque */}
      <div
        className={`absolute inset-0 bg-slate-900/70 dark:bg-black/80 backdrop-blur-md transition-opacity duration-300 ${isAnimating && isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
      />

      {/* Renderizado del contenedor flotante */}
      <div
        className={`relative w-full max-w-xl bg-white dark:bg-[#0a0f1c] rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col transition-all duration-300 ease-out transform ${isAnimating && isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-8 opacity-0 scale-95"}`}
      >
        {/* Renderizado de cabecera de componente */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-slate-50 to-white dark:from-[#050810] dark:to-[#0a0f1c]">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-brand to-amber-400 text-white rounded-2xl shadow-lg shadow-brand/20">
              <Package size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight leading-tight">
                Ajuste de Inventario
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                SKU: {stockItem.product.sku}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Renderizado de formulario de entrada de datos */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-8 space-y-8 bg-slate-50/30 dark:bg-transparent">
            {/* Visualizador de Contexto Actual */}
            <div className="text-center">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                {stockItem.product.name}
              </h3>
              <div className="inline-flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300">
                <Activity size={16} className="mr-2 text-brand" />
                Stock Físico Actual:{" "}
                <span className="text-lg text-slate-800 dark:text-white ml-2">
                  {stockItem.quantity}
                </span>
              </div>
            </div>

            {/* Selector de Tipo de Movimiento (Radio Buttons) */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setType("ADD")}
                className={`flex flex-col items-center p-4 rounded-2xl border transition-all ${type === "ADD" ? "bg-emerald-50 border-emerald-500 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/50 shadow-md" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300"}`}
              >
                <ArrowUpCircle size={24} className="mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Ingreso (+)
                </span>
              </button>
              <button
                type="button"
                onClick={() => setType("SUBTRACT")}
                className={`flex flex-col items-center p-4 rounded-2xl border transition-all ${type === "SUBTRACT" ? "bg-red-50 border-red-500 text-red-600 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50 shadow-md" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300"}`}
              >
                <ArrowDownCircle size={24} className="mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Egreso (-)
                </span>
              </button>
              <button
                type="button"
                onClick={() => setType("SET")}
                className={`flex flex-col items-center p-4 rounded-2xl border transition-all ${type === "SET" ? "bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/50 shadow-md" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300"}`}
              >
                <SlidersHorizontal size={24} className="mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Fijar (=)
                </span>
              </button>
            </div>

            {/* Grupo de Entradas Cuantitativas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Cantidad a Mover
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black text-center text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all shadow-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Proyección de Saldo
                </label>
                <div
                  className={`w-full px-4 py-4 border rounded-2xl text-xl font-black text-center shadow-inner ${isInvalidSubtraction ? "bg-red-50 border-red-200 text-red-500 dark:bg-red-900/20 dark:border-red-800" : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"}`}
                >
                  {quantity === "" ? stockItem.quantity : projectedStock}
                </div>
              </div>
            </div>

            {/* Entrada de Razón / Justificación */}
            <div>
              <label className="flex items-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                <FileText size={12} className="mr-1" /> Justificación (Opcional)
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Ajuste por merma, Error de conteo previo..."
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand/50 resize-none transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Renderizado de Barra de Controles (Footer) */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#050810] flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 py-3.5 rounded-2xl font-bold text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                quantity === "" ||
                Number(quantity) <= 0 ||
                isInvalidSubtraction
              }
              className={`flex items-center space-x-2 px-8 py-3.5 font-black text-sm rounded-2xl transition-all duration-300 ${quantity !== "" && Number(quantity) > 0 && !isInvalidSubtraction ? "bg-gradient-to-r from-brand to-amber-500 text-white shadow-lg shadow-brand/30 hover:scale-105" : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"}`}
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              <span>
                {isSubmitting ? "Sincronizando..." : "Aplicar Ajuste"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
