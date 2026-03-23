import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Search,
  Plus,
  Loader2,
  User,
  FileText,
  Phone,
} from "lucide-react";
import { CyberHeader } from "../../../shared/components/CyberHeader";
import { neuroToast } from "../../../shared/utils/neuroToast";

// 🛡️ CORRECCIÓN 1: Importamos el Modal y el 'type' por separado
import { CustomerModal } from "../components/CustomerModal";
import type { CustomerProfile } from "../components/CustomerModal";

// 🛡️ CORRECCIÓN 2: Eliminamos la importación fantasma de 'useAuth'

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000/api";

// 🛡️ CORRECCIÓN 3: Le enseñamos a TypeScript cómo es exactamente el cliente que llega del Backend (Chau "any")
export interface CustomerListItem extends CustomerProfile {
  activeDebt: number;
}

export const CustomersPage = () => {
  const token = localStorage.getItem("club_token");

  // 🛡️ Aplicamos el tipado estricto al estado
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerProfile | null>(null);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (response.ok) {
        setCustomers(result.data || []);
      }
    } catch (error) {
      console.log(error);
      neuroToast("Error al cargar el directorio de clientes.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleOpenModal = (customer?: CustomerProfile) => {
    setSelectedCustomer(customer || null);
    setIsModalOpen(true);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.document && c.document.includes(searchTerm)),
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#030712] p-4 flex flex-col transition-colors duration-700">
      <div className="max-w-[1700px] mx-auto w-full flex-1 flex flex-col space-y-6">
        <CyberHeader
          phrases={[
            "Directorio Comercial",
            "Gestión de Contratistas",
            "Base de Datos de Clientes",
          ]}
          labelIcon={Building2}
          labelText="Directorio de Clientes"
          tags={[
            {
              text: `CLIENTES ACTIVOS: ${customers.length}`,
              icon: FileText,
              delay: "text-brand",
            },
          ]}
        />

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-sm flex items-center w-full md:w-1/2">
            <Search className="ml-4 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por Razón Social o CUIT/DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent px-4 py-3 font-bold text-slate-700 dark:text-white placeholder-slate-400 focus:outline-none"
            />
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="w-full md:w-auto px-8 py-4 bg-brand hover:bg-amber-600 text-white rounded-2xl font-black text-sm uppercase flex items-center justify-center space-x-2 transition-all shadow-lg shadow-brand/30 hover:scale-[1.02]"
          >
            <Plus size={20} /> <span>Nuevo Cliente</span>
          </button>
        </div>

        <div className="bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-xl overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-200 dark:border-slate-800">
                  <th className="p-6">Razón Social / Nombre</th>
                  <th className="p-6 text-center">Perfil</th>
                  <th className="p-6">Contacto</th>
                  <th className="p-6 text-right">Riesgo Financiero</th>
                  <th className="p-6 text-center">Acciones</th>
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
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs"
                    >
                      Aún no hay clientes registrados.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="p-6">
                        <p className="font-bold text-slate-800 dark:text-white leading-tight">
                          {c.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-black uppercase mt-1">
                          ID Fiscal: {c.document || "No Registrado"}
                        </p>
                      </td>
                      <td className="p-6 text-center">
                        <span
                          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-[10px] font-black uppercase ${c.type === "CONTRACTOR" ? "bg-amber-500/10 text-amber-500" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}
                        >
                          {c.type === "CONTRACTOR" ? (
                            <Building2 size={12} />
                          ) : (
                            <User size={12} />
                          )}
                          <span>
                            {c.type === "CONTRACTOR"
                              ? "Contratista"
                              : "Consumidor"}
                          </span>
                        </span>
                      </td>
                      <td className="p-6">
                        {c.phone ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                            <Phone size={14} className="text-brand" /> {c.phone}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Sin teléfono
                          </span>
                        )}
                      </td>
                      <td className="p-6 text-right">
                        {c.activeDebt > 0 ? (
                          <p className="text-sm font-black text-red-500">
                            ${c.activeDebt.toLocaleString()}
                          </p>
                        ) : (
                          <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">
                            Al día
                          </span>
                        )}
                      </td>
                      <td className="p-6 text-center">
                        <button
                          onClick={() => handleOpenModal(c)}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-brand hover:text-white text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCustomers}
        token={token}
        customerToEdit={selectedCustomer}
      />
    </div>
  );
};
