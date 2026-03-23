import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  DollarSign,
  CreditCard,
  Save,
  Loader2,
  AlertCircle,
  HandCoins,
} from "lucide-react";
import { neuroToast } from "../../../shared/utils/neuroToast";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000/api";

// ============================================================================
// TIPADO ESTRICTO (ERP Level): Reemplazamos el "any" por el molde exacto
// ============================================================================
export interface PendingAccount {
  id: number;
  balance: number;
  totalAmount: number;
  branchId: number;
  pickedUpBy?: string | null;
  createdAt: string;
  customer?: {
    id: number;
    name: string;
    type: string;
    phone?: string | null;
  } | null;
  user?: {
    name: string;
  } | null;
}

interface AccountPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: PendingAccount | null; // <-- ¡ADIÓS AL ANY!
  onSuccess: () => void;
  token: string | null;
  activeCashRegisterId: number;
}

export const AccountPaymentModal: React.FC<AccountPaymentModalProps> = ({
  isOpen,
  onClose,
  account,
  onSuccess,
  token,
  activeCashRegisterId,
}) => {
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER">(
    "CASH",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !account) return null;

  const parsedAmount = Math.abs(Number(amount) || 0);
  const newBalance = account.balance - parsedAmount;

  // Blindaje Poka-Yoke
  const isInvalidAmount = parsedAmount <= 0 || parsedAmount > account.balance;
  const isReadyToSubmit =
    !isInvalidAmount && !isSubmitting && activeCashRegisterId > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReadyToSubmit) return;

    setIsSubmitting(true);
    try {
      const payload = {
        saleId: account.id,
        amount: parsedAmount,
        paymentMethod,
        cashRegisterId: activeCashRegisterId,
        branchId: account.branchId,
      };

      const response = await fetch(`${API_URL}/payments/account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Fallo al registrar la integración de saldo.",
        );
      }

      neuroToast(result.message || "Pago registrado con éxito.", "success");
      onSuccess();
      onClose();
      setAmount("");
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Error desconocido al cobrar.";
      neuroToast(errorMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes("-")) return;
    setAmount(val);
  };

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
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <HandCoins size={24} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                  Integración de Saldo
                </h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Ticket #{account.id}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black uppercase text-slate-400">
                  Titular de Cuenta
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-white">
                  {account.customer?.name || "Consumidor Final"}
                </span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black uppercase text-slate-400">
                  Autorizado (Retiró)
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-white">
                  {account.pickedUpBy || "No especificado"}
                </span>
              </div>

              <div className="h-px w-full bg-slate-200 dark:bg-slate-700/50 mb-4"></div>

              <div className="flex justify-between items-end">
                <span className="text-xs font-black uppercase text-slate-500">
                  Saldo Pendiente
                </span>
                <span className="text-3xl font-black text-red-500">
                  ${account.balance.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`flex items-center justify-center space-x-2 py-3.5 rounded-xl border-2 transition-all hover:scale-[1.02] ${paymentMethod === "CASH" ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-md" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400"}`}
              >
                <DollarSign size={18} />{" "}
                <span className="font-black text-xs uppercase tracking-wide">
                  Efectivo
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("TRANSFER")}
                className={`flex items-center justify-center space-x-2 py-3.5 rounded-xl border-2 transition-all hover:scale-[1.02] ${paymentMethod === "TRANSFER" ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-md" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400"}`}
              >
                <CreditCard size={18} />{" "}
                <span className="font-black text-xs uppercase tracking-wide">
                  Transferencia
                </span>
              </button>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">
                Monto a integrar hoy
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-400 font-black text-lg">$</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max={account.balance}
                  value={amount}
                  onChange={handleAmountChange}
                  required
                  className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-xl pl-8 pr-4 py-4 text-2xl font-black focus:outline-none focus:ring-1 transition-all ${parsedAmount > account.balance ? "border-red-400 text-red-500 focus:border-red-500" : "border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:border-emerald-500"}`}
                />
              </div>
              {parsedAmount > account.balance && (
                <p className="text-xs font-bold text-red-500 mt-2 flex items-center gap-1">
                  <AlertCircle size={14} /> El pago no puede superar la deuda.
                </p>
              )}
            </div>

            <AnimatePresence>
              {parsedAmount > 0 && parsedAmount <= account.balance && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/50 flex justify-between items-center text-emerald-800 dark:text-emerald-300 mt-4"
                >
                  <span className="text-xs font-bold">
                    Nuevo Saldo Restante:
                  </span>
                  <span className="font-black">
                    ${newBalance.toLocaleString()}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={!isReadyToSubmit}
              className={`w-full py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center space-x-2 mt-2
                ${
                  isSubmitting
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-wait"
                    : !activeCashRegisterId
                      ? "bg-red-100 dark:bg-red-900/30 text-red-500 cursor-not-allowed"
                      : isInvalidAmount
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                        : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:scale-[1.02]"
                }`}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Save size={20} />
              )}
              <span>
                {!activeCashRegisterId
                  ? "ERROR: CAJA CERRADA"
                  : isInvalidAmount
                    ? "INGRESÁ UN MONTO VÁLIDO"
                    : "REGISTRAR INTEGRACIÓN OFICIAL"}
              </span>
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
