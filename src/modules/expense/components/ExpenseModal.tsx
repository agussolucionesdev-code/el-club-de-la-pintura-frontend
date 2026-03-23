import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  ArrowDownRight,
  Tags,
  AlignLeft,
  AlertCircle,
} from "lucide-react";
import { neuroToast } from "../../../shared/utils/neuroToast";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000/api";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string | null;
  activeCashRegisterId: number | null;
  branchId: number; // 🛡️ AGREGAMOS EL ID DE LA SUCURSAL
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  token,
  activeCashRegisterId,
  branchId,
}) => {
  const [amountInCents, setAmountInCents] = useState<number>(0);

  const [formData, setFormData] = useState({
    category: "SUPPLIER_PAYMENT",
    description: "",
    receiptNumber: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmountInCents(0);
      setFormData({
        category: "SUPPLIER_PAYMENT",
        description: "",
        receiptNumber: "",
      });
    }
  }, [isOpen]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    const numericValue = parseInt(rawValue, 10);
    setAmountInCents(isNaN(numericValue) ? 0 : numericValue);
  };

  const formattedAmount = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amountInCents / 100);

  const realAmount = amountInCents / 100;

  const isReadyToSubmit =
    realAmount > 0 &&
    formData.description.trim().length >= 3 &&
    activeCashRegisterId &&
    !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReadyToSubmit) return;

    setIsSubmitting(true);
    try {
      // 🛡️ EL PAYLOAD PERFECTO (Ahora sí viaja el ID de la Caja)
      const payload = {
        amount: realAmount,
        category: formData.category,
        reason: formData.description.trim(),
        type: "VARIABLE",
        branchId: branchId,
        cashRegisterId: activeCashRegisterId, // <-- ESTA ES LA LLAVE QUE FALTABA
      };

      const response = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok)
        throw new Error(result.error || "Fallo al registrar el gasto.");

      neuroToast(
        result.message || "Egreso registrado correctamente.",
        "success",
      );
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Error al procesar el egreso.";
      // 🛡️ Mostramos exactamente el error que manda el servidor (Fondos Insuficientes)
      neuroToast(errorMsg, "error", "Operación rechazada.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const categories = [
    { id: "SUPPLIER_PAYMENT", label: "Pago Proveedor" },
    { id: "UTILITIES", label: "Servicios/Impuestos" },
    { id: "SALARY", label: "Sueldos/Adelantos" },
    { id: "LOGISTICS", label: "Fletes/Logística" },
    { id: "MAINTENANCE", label: "Mantenimiento" },
    { id: "OTHER", label: "Gastos Varios" },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
        >
          <div className="p-5 bg-rose-50/50 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
                <ArrowDownRight size={24} />
              </div>
              <div>
                <h2 className="text-lg font-black text-rose-600 dark:text-rose-400 leading-tight">
                  Registrar Egreso
                </h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Salida de dinero de Caja
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-rose-500 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                Monto a retirar de la caja
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountInCents || ""}
                  onChange={handleAmountChange}
                  autoFocus
                  className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10"
                />
                <div
                  className={`w-full bg-slate-50 dark:bg-slate-900/50 border rounded-xl px-4 py-4 text-3xl font-black text-right tracking-tight transition-all ${realAmount > 0 ? "border-rose-300 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-900/10" : "border-slate-200 dark:border-slate-700 text-slate-400"}`}
                >
                  {formattedAmount}
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1 uppercase">
                <AlertCircle size={12} /> Tipee los números de corrido
                (incluyendo centavos)
              </p>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                <Tags size={14} /> Categoría del Gasto
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, category: cat.id })
                    }
                    className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${formData.category === cat.id ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400" : "border-slate-200 dark:border-slate-800 text-slate-400 bg-white dark:bg-slate-900 hover:border-rose-200"}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                <AlignLeft size={14} /> Detalle o Motivo
              </label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-white focus:border-rose-500 focus:ring-1 outline-none"
                placeholder="Ej: Pago de factura de luz / Viáticos fletero"
              />
            </div>

            <button
              type="submit"
              disabled={!isReadyToSubmit}
              className={`w-full py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center space-x-2 mt-4
                ${
                  isSubmitting
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-wait"
                    : !activeCashRegisterId
                      ? "bg-red-100 dark:bg-red-900/30 text-red-500 cursor-not-allowed"
                      : !isReadyToSubmit
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                        : "bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/30 hover:scale-[1.02]"
                }`}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <ArrowDownRight size={20} />
              )}
              <span>
                {!activeCashRegisterId
                  ? "CAJA CERRADA"
                  : "CONFIRMAR SALIDA DE DINERO"}
              </span>
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
