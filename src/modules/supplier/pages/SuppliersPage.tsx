import { useState, useEffect, useCallback } from "react";
import {
  Factory,
  Search,
  Plus,
  Loader2,
  FileText,
  Phone,
  UserCircle,
  MapPin,
} from "lucide-react";
import { CyberHeader } from "../../../shared/components/CyberHeader";
import { neuroToast } from "../../../shared/utils/neuroToast";
import { SupplierModal } from "../components/SupplierModal";
import type { SupplierProfile } from "../components/SupplierModal";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000/api";

export const SuppliersPage = () => {
  const token = localStorage.getItem("club_token");

  const [suppliers, setSuppliers] = useState<SupplierProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] =
    useState<SupplierProfile | null>(null);

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/suppliers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      // 🛡️ El backend de 'getSuppliers' devuelve un array directo, no envuelto en 'data' según tu controller
      if (response.ok) {
        setSuppliers(Array.isArray(result) ? result : result.data || []);
      }
    } catch (error) {
      console.log(error);
      neuroToast(
        "Error de conexión al servidor.",
        "error",
        "Fallo de comunicación.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleOpenModal = (supplier?: SupplierProfile) => {
    setSelectedSupplier(supplier || null);
    setIsModalOpen(true);
  };

  // 🛡️ FILTRO ADAPTADO A COMPANYNAME Y CUIT
  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.cuit && s.cuit.includes(searchTerm)) ||
      (s.contactName &&
        s.contactName.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#030712] p-4 flex flex-col transition-colors duration-700">
      <div className="max-w-[1700px] mx-auto w-full flex-1 flex flex-col space-y-6">
        <CyberHeader
          phrases={[
            "Logística y Suministros",
            "Cadena de Abastecimiento",
            "Directorio de Fábricas",
          ]}
          labelIcon={Factory}
          labelText="Proveedores Oficiales"
          tags={[
            {
              text: `PROVEEDORES ACTIVOS: ${suppliers.length}`,
              icon: FileText,
              delay: "text-indigo-500",
            },
          ]}
        />

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-sm flex items-center w-full md:w-1/2">
            <Search className="ml-4 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por Fábrica, CUIT o Viajante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent px-4 py-3 font-bold text-slate-700 dark:text-white placeholder-slate-400 focus:outline-none"
            />
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm uppercase flex items-center justify-center space-x-2 transition-all shadow-lg shadow-indigo-600/30 hover:scale-[1.02]"
          >
            <Plus size={20} /> <span>Agregar Fábrica</span>
          </button>
        </div>

        <div className="bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-xl overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-200 dark:border-slate-800">
                  <th className="p-6">Fábrica / Razón Social</th>
                  <th className="p-6">Viajante (Contacto)</th>
                  <th className="p-6">Medios de Comunicación</th>
                  <th className="p-6 text-center">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center">
                      <Loader2
                        className="animate-spin mx-auto text-indigo-500"
                        size={32}
                      />
                    </td>
                  </tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs"
                    >
                      No hay proveedores registrados en la base de datos.
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="p-6">
                        {/* 🛡️ CORRECCIÓN: IMPRIMIMOS companyName y cuit */}
                        <p className="font-bold text-slate-800 dark:text-white text-lg leading-tight">
                          {s.companyName}
                        </p>
                        <p className="text-[10px] text-slate-500 font-black uppercase mt-1">
                          CUIT: {s.cuit || "No Registrado"}
                        </p>
                      </td>
                      <td className="p-6">
                        {s.contactName ? (
                          <span className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                            <UserCircle size={16} className="text-indigo-500" />{" "}
                            {s.contactName}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Sin asignar
                          </span>
                        )}
                      </td>
                      <td className="p-6 space-y-1">
                        {s.phone && (
                          <p className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                            <Phone size={13} className="text-slate-400" />{" "}
                            {s.phone}
                          </p>
                        )}
                        {s.address && (
                          <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                            <MapPin size={12} /> {s.address}
                          </p>
                        )}
                        {!s.phone && !s.address && (
                          <span className="text-xs text-slate-400">
                            Sin datos
                          </span>
                        )}
                      </td>
                      <td className="p-6 text-center">
                        <button
                          onClick={() => handleOpenModal(s)}
                          className="px-5 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl text-xs font-black uppercase transition-all shadow-sm"
                        >
                          Editar Ficha
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

      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSuppliers}
        token={token}
        supplierToEdit={selectedSupplier}
      />
    </div>
  );
};
