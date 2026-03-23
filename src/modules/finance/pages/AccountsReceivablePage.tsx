import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  ShieldAlert,
  FileText,
  HandCoins,
} from "lucide-react";
import { CyberHeader } from "../../../shared/components/CyberHeader";
import { neuroToast } from "../../../shared/utils/neuroToast";

// 🛡️ CORRECCIÓN 1: Separamos la importación del componente y la interfaz (usando 'import type')
import { AccountPaymentModal } from "../components/AccountPaymentModal";
import type { PendingAccount } from "../components/AccountPaymentModal";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000/api";

export const AccountsReceivablePage = () => {
  // 🛡️ CORRECCIÓN 2: Eliminamos la extracción del 'user' fantasma que no usábamos
  const token = localStorage.getItem("club_token");

  const [accounts, setAccounts] = useState<PendingAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [activeCashRegisterId] = useState<number>(1);
  const [selectedAccount, setSelectedAccount] = useState<PendingAccount | null>(
    null,
  );

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/sales/pending/0`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (response.ok) {
        setAccounts(result.data || []);
      }
    } catch (error) {
      console.log(error);
      neuroToast(
        "Fallo de comunicación al cargar cuentas corrientes.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const filteredAccounts = accounts.filter((acc) => {
    const s = searchTerm.toLowerCase();
    const customerMatch = acc.customer?.name.toLowerCase().includes(s) || false;
    const pickedMatch = acc.pickedUpBy?.toLowerCase().includes(s) || false;
    return customerMatch || pickedMatch;
  });

  const totalInStreet = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const calculateAging = (dateString: string) => {
    const createdDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7)
      return {
        text: "Vigente",
        days: diffDays,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        icon: CheckCircle,
      };
    if (diffDays <= 15)
      return {
        text: "Atención",
        days: diffDays,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        icon: Clock,
      };
    return {
      text: "Crítico",
      days: diffDays,
      color: "text-red-500",
      bg: "bg-red-500/10",
      icon: ShieldAlert,
    };
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#030712] p-4 flex flex-col transition-colors duration-700">
      <div className="max-w-[1700px] mx-auto w-full flex-1 flex flex-col space-y-6">
        <CyberHeader
          phrases={[
            "Control Financiero Estricto",
            "Gestión de Riesgo Comercial",
            "Cuentas Corrientes Activas",
          ]}
          labelIcon={HandCoins}
          labelText="Radar de Cuentas Corrientes"
          tags={[
            {
              text: `CAPITAL EN LA CALLE: $${totalInStreet.toLocaleString()}`,
              icon: AlertTriangle,
              delay: "text-amber-500",
            },
            {
              text: `CUENTAS ACTIVAS: ${accounts.length}`,
              icon: FileText,
              delay: "text-brand",
            },
          ]}
        />

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-2 shadow-sm flex items-center">
          <Search className="ml-4 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por Contratista o Persona que retiró..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent px-4 py-4 font-bold text-slate-700 dark:text-white placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-xl overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-200 dark:border-slate-800">
                  <th className="p-6">Titular (Empresa/Cliente)</th>
                  <th className="p-6">Autorizado (Retiró)</th>
                  <th className="p-6 text-center">Riesgo (Aging)</th>
                  <th className="p-6 text-right">Saldo Pendiente</th>
                  <th className="p-6 text-center">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center">
                      <Loader2
                        className="animate-spin mx-auto text-brand"
                        size={32}
                      />
                    </td>
                  </tr>
                ) : filteredAccounts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs"
                    >
                      No hay cuentas pendientes. ¡Excelente!
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((acc) => {
                    const aging = calculateAging(acc.createdAt);

                    return (
                      <tr
                        key={acc.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors"
                      >
                        <td className="p-6">
                          <p className="font-bold text-slate-800 dark:text-white leading-tight">
                            {acc.customer?.name || "Consumidor Final"}
                          </p>
                          <p className="text-[10px] text-slate-500 font-black uppercase mt-1">
                            Ticket #{acc.id} • Vendedor: {acc.user?.name}
                          </p>
                        </td>
                        <td className="p-6">
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 inline-flex items-center gap-2">
                            {acc.pickedUpBy || "No especificado"}
                          </span>
                        </td>
                        <td className="p-6 text-center">
                          <div
                            className={`inline-flex items-center space-x-1.5 ${aging.color} ${aging.bg} px-4 py-2 rounded-xl text-[10px] font-black uppercase`}
                          >
                            <aging.icon size={15} />{" "}
                            <span>
                              {aging.text} ({aging.days} días)
                            </span>
                          </div>
                        </td>
                        <td className="p-6 text-right">
                          <p className="text-xl font-black text-red-500">
                            ${acc.balance.toLocaleString()}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                            De original: ${acc.totalAmount.toLocaleString()}
                          </p>
                        </td>
                        <td className="p-6 text-center">
                          <button
                            onClick={() => setSelectedAccount(acc)}
                            className="px-5 py-2.5 bg-brand/10 hover:bg-brand text-brand hover:text-white rounded-xl text-xs font-black uppercase transition-all shadow-sm hover:shadow-brand/30"
                          >
                            Integrar Saldo
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AccountPaymentModal
        isOpen={!!selectedAccount}
        onClose={() => setSelectedAccount(null)}
        account={selectedAccount}
        onSuccess={fetchAccounts}
        token={token}
        activeCashRegisterId={activeCashRegisterId}
      />
    </div>
  );
};
