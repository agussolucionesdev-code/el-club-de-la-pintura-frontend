import { useState, useEffect, useCallback } from "react";
import {
  ArrowDownRight,
  Search,
  Plus,
  Loader2,
  ReceiptText,
  LockKeyhole,
} from "lucide-react";
import { CyberHeader } from "../../../shared/components/CyberHeader";
import { neuroToast } from "../../../shared/utils/neuroToast";
import { ExpenseModal } from "../components/ExpenseModal";
import { useAuth } from "../../../core/context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000/api";

// 🛡️ CORRECCIÓN 1: Cambiamos 'description' por 'reason'
export interface ExpenseItem {
  id: number;
  amount: number;
  category: string;
  reason: string;
  receiptNumber?: string | null;
  cashRegisterId: number;
  createdAt: string;
  user?: {
    name: string;
  } | null;
}

interface ExtendedUser {
  id: number;
  name: string;
  branches?: { id: number; name: string }[];
}

export const ExpensesPage = () => {
  const token = localStorage.getItem("club_token");
  const { user } = useAuth();

  const currentUser = user as ExtendedUser | null;
  const currentBranchId = currentUser?.branches?.[0]?.id || 1;

  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [activeCashRegisterId, setActiveCashRegisterId] = useState<
    number | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const checkRegisterStatus = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(
        `${API_URL}/cash-registers/${currentBranchId}/active`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const json = await res.json();
        setActiveCashRegisterId(
          json.data && json.data.id ? Number(json.data.id) : null,
        );
      }
    } catch (e) {
      console.log(e);
      console.log("Error al verificar caja");
    }
  }, [currentBranchId, token]);

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/expenses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (response.ok) {
        setExpenses(result.data || []);
      }
    } catch (error) {
      console.log(error);
      neuroToast("Error de conexión al cargar los gastos.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    checkRegisterStatus();
    fetchExpenses();
  }, [checkRegisterStatus, fetchExpenses]);

  // 🛡️ CORRECCIÓN 2: Buscamos por 'reason' con protección por si viene vacío
  const filteredExpenses = expenses.filter(
    (e) =>
      (e.reason && e.reason.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.receiptNumber &&
        e.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const totalExpenses = filteredExpenses.reduce(
    (sum, exp) => sum + exp.amount,
    0,
  );

  const categoryNames: Record<string, string> = {
    SUPPLIER_PAYMENT: "Pago Proveedor",
    UTILITIES: "Servicios/Impuestos",
    SALARY: "Sueldos",
    LOGISTICS: "Fletes/Logística",
    MAINTENANCE: "Mantenimiento",
    OTHER: "Varios",
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#030712] p-4 flex flex-col transition-colors duration-700">
      <div className="max-w-[1700px] mx-auto w-full flex-1 flex flex-col space-y-6">
        <CyberHeader
          phrases={[
            "Control de Flujo de Caja",
            "Libro Diario de Egresos",
            "Auditoría de Gastos",
          ]}
          labelIcon={ArrowDownRight}
          labelText="Gastos Operativos"
          tags={[
            {
              text: `TOTAL EGRESOS: $${totalExpenses.toLocaleString("es-AR")}`,
              icon: ReceiptText,
              delay: "text-rose-500",
            },
          ]}
        />

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-sm flex items-center w-full md:w-1/2">
            <Search className="ml-4 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por detalle o número de comprobante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent px-4 py-3 font-bold text-slate-700 dark:text-white placeholder-slate-400 focus:outline-none"
            />
          </div>

          <button
            onClick={() =>
              activeCashRegisterId
                ? setIsModalOpen(true)
                : neuroToast("Debe abrir la caja primero", "error")
            }
            className={`w-full md:w-auto px-8 py-4 rounded-2xl font-black text-sm uppercase flex items-center justify-center space-x-2 transition-all 
              ${activeCashRegisterId ? "bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 hover:scale-[1.02]" : "bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed"}`}
          >
            {activeCashRegisterId ? (
              <Plus size={20} />
            ) : (
              <LockKeyhole size={20} />
            )}
            <span>
              {activeCashRegisterId ? "Registrar Egreso" : "Caja Cerrada"}
            </span>
          </button>
        </div>

        <div className="bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-xl overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-200 dark:border-slate-800">
                  <th className="p-6">Fecha y Turno</th>
                  <th className="p-6">Detalle del Gasto</th>
                  <th className="p-6 text-center">Categoría</th>
                  <th className="p-6 text-right">Monto Retirado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center">
                      <Loader2
                        className="animate-spin mx-auto text-rose-500"
                        size={32}
                      />
                    </td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs"
                    >
                      No hay egresos registrados.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr
                      key={exp.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="p-6">
                        <p className="font-bold text-slate-800 dark:text-white leading-tight">
                          {new Date(exp.createdAt).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-[10px] text-slate-500 font-black uppercase mt-1">
                          Caja ID: {exp.cashRegisterId} • Carga:{" "}
                          {exp.user?.name}
                        </p>
                      </td>
                      <td className="p-6">
                        {/* 🛡️ CORRECCIÓN 3: Imprimimos 'reason' en lugar de 'description' */}
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          {exp.reason || "Sin detalle"}
                        </p>
                        {exp.receiptNumber && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            <ReceiptText size={10} /> Comp: {exp.receiptNumber}
                          </span>
                        )}
                      </td>
                      <td className="p-6 text-center">
                        <span className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl">
                          {categoryNames[exp.category] || "Gasto"}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <p className="text-xl font-black text-rose-600 dark:text-rose-400">
                          - ${Number(exp.amount).toLocaleString("es-AR")}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchExpenses}
        token={token}
        activeCashRegisterId={activeCashRegisterId}
        branchId={currentBranchId}
      />
    </div>
  );
};
