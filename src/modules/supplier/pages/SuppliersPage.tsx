import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Factory,
  Search,
  Plus,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Edit,
  PackageSearch,
  Building2,
  Hash,
  ChevronLeft,
  ChevronRight,
  Filter,
  Trash2,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";
import { CyberHeader } from "../../../shared/components/CyberHeader";
import { neuroToast } from "../../../shared/utils/neuroToast";
import { SupplierModal } from "../components/SupplierModal";
import type { SupplierProfile } from "../components/SupplierModal";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000/api";

const getBrandColors = (name: string) => {
  const colors = [
    "from-blue-500 to-indigo-600",
    "from-emerald-400 to-teal-600",
    "from-amber-400 to-orange-500",
    "from-rose-400 to-red-600",
    "from-purple-500 to-pink-600",
    "from-cyan-400 to-blue-500",
    "from-fuchsia-500 to-purple-700",
    "from-slate-600 to-slate-800",
  ];
  const charCodeSum = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[charCodeSum % colors.length];
};

export const SuppliersPage = () => {
  const token = localStorage.getItem("club_token");
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState<SupplierProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] =
    useState<SupplierProfile | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteSecurityWord, setDeleteSecurityWord] = useState("");
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/suppliers?limit=3000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (response.ok) {
        const data = Array.isArray(result.data) ? result.data : result || [];
        // 🛡️ ORDEN ALFABÉTICO AUTOMÁTICO
        const sortedData = data.sort((a: SupplierProfile, b: SupplierProfile) =>
          a.companyName.localeCompare(b.companyName),
        );
        setSuppliers(sortedData);
      } else {
        throw new Error("Fallo en la lectura de la API");
      }
    } catch (error) {
      console.error(error);
      neuroToast(
        "Error de conexión",
        "error",
        "Fallo al cargar el directorio.",
      );
    } finally {
      setIsLoading(false);
      setSelectedIds([]);
    }
  }, [token]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleOpenModal = (supplier?: SupplierProfile) => {
    setSelectedSupplier(supplier || null);
    setIsModalOpen(true);
  };

  const handleImageError = (companyName: string) => {
    setImageErrors((prev) => ({ ...prev, [companyName]: true }));
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === filteredSuppliers.length) setSelectedIds([]);
    else setSelectedIds(filteredSuppliers.map((s) => s.id));
  };

  const executeDelete = async () => {
    const isTotal = isDeletingAll || selectedIds.length === suppliers.length;
    const wordRequired = isTotal ? "vaciar" : "eliminar";

    if (deleteSecurityWord.toLowerCase() !== wordRequired) {
      neuroToast(
        "Seguridad",
        "warning",
        `Debes escribir '${wordRequired.toUpperCase()}' para confirmar.`,
      );
      return;
    }

    try {
      neuroToast("Procesando...", "info", "Eliminando proveedores...");

      const deletePromises = selectedIds.map((id) =>
        fetch(`${API_URL}/suppliers/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }),
      );

      await Promise.all(deletePromises);

      neuroToast(
        "Limpieza Exitosa",
        "success",
        `Se eliminaron ${selectedIds.length} proveedores.`,
      );
      setIsDeleteModalOpen(false);
      setDeleteSecurityWord("");
      fetchSuppliers(); // Recarga la lista ordenada
    } catch (error: unknown) {
      console.error("Error en eliminación:", error);
      neuroToast(
        "Fallo crítico",
        "error",
        "No se pudo eliminar el proveedor. Revisá si tiene productos asociados.",
      );
    }
  };

  // 🛡️ FILTRO SÚPER-POTENTE
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const sTerm = searchTerm.toLowerCase();
      const matchesSearch =
        s.companyName.toLowerCase().includes(sTerm) ||
        (s.cuit && s.cuit.includes(sTerm)) ||
        (s.contactName && s.contactName.toLowerCase().includes(sTerm)) ||
        (s.email && s.email.toLowerCase().includes(sTerm)) ||
        (s.phone && s.phone.includes(sTerm)) ||
        (s.address && s.address.toLowerCase().includes(sTerm));

      const matchesBrand =
        selectedBrand === "ALL" || s.companyName === selectedBrand;

      return matchesSearch && matchesBrand;
    });
  }, [suppliers, searchTerm, selectedBrand]);

  const paginatedSuppliers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSuppliers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSuppliers, currentPage]);

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const uniqueBrands = useMemo(
    () =>
      Array.from(new Set(suppliers.map((s) => s.companyName)))
        .filter(Boolean)
        .sort(),
    [suppliers],
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#030712] p-4 flex flex-col transition-colors duration-700">
      <div className="max-w-[1700px] mx-auto w-full flex-1 flex flex-col space-y-6">
        <CyberHeader
          phrases={[
            "Directorio ERP de Marcas y Proveedores",
            "Gestión Integral de Suministros y Precios",
          ]}
          labelIcon={Building2}
          labelText="Directorio de Proveedores"
          tags={[
            {
              text: `MARCAS REGISTRADAS: ${suppliers.length}`,
              icon: Factory,
              delay: "text-brand",
            },
            {
              text: `RESULTADOS: ${filteredSuppliers.length}`,
              icon: Hash,
              delay: "text-blue-500",
            },
          ]}
        />

        <div className="flex flex-col xl:flex-row items-center justify-between space-y-4 xl:space-y-0 xl:space-x-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-3 shadow-sm transition-all duration-300">
          <div className="flex-1 w-full flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar por Marca, CUIT, Mail, Viajante, Teléfono o Dirección..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-800/50 pl-11 pr-4 py-3 rounded-2xl text-sm font-bold text-slate-700 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
              />
            </div>

            <div className="relative md:w-64 shrink-0">
              <Filter
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <select
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-800/50 pl-11 pr-4 py-3 rounded-2xl text-sm font-bold text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/50 appearance-none cursor-pointer truncate"
              >
                <option value="ALL">Todas las Marcas</option>
                {uniqueBrands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 w-full xl:w-auto shrink-0 mt-4 xl:mt-0">
            {selectedIds.length > 0 && (
              <button
                onClick={() => {
                  if (selectedIds.length === 0) toggleAll();
                  setIsDeletingAll(
                    selectedIds.length === 0 ||
                      selectedIds.length === filteredSuppliers.length,
                  );
                  setIsDeleteModalOpen(true);
                }}
                className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm uppercase flex items-center space-x-2 transition-all shadow-lg shadow-red-600/30 hover:scale-105"
                title="Eliminar proveedores seleccionados"
              >
                <ShieldAlert size={18} />
                <span className="hidden md:inline">
                  {selectedIds.length > 0
                    ? `Borrar (${selectedIds.length})`
                    : "Eliminar Todo"}
                </span>
              </button>
            )}

            <button
              onClick={() => handleOpenModal()}
              className="w-full md:w-auto px-8 py-3 bg-brand hover:bg-amber-600 text-white rounded-2xl font-black text-sm uppercase flex items-center justify-center space-x-2 transition-all shadow-lg shadow-brand/30 hover:scale-105"
            >
              <Plus size={18} /> <span>Nueva Marca</span>
            </button>
          </div>
        </div>

        {filteredSuppliers.length > itemsPerPage && (
          <div className="flex items-center justify-center space-x-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm transition-all duration-300">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-3 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800/70 text-slate-700 dark:text-white rounded-xl transition-colors border border-slate-200 dark:border-slate-700 ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-black text-slate-700 dark:text-white">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-3 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800/70 text-slate-700 dark:text-white rounded-xl transition-colors border border-slate-200 dark:border-slate-700 ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-brand" size={48} />
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10">
            <Building2
              size={64}
              className="text-slate-300 dark:text-slate-700 mb-4"
            />
            <h3 className="text-xl font-black text-slate-700 dark:text-white">
              Directorio Vacío
            </h3>
            <p className="text-slate-500 mt-2">
              No se encontraron proveedores o marcas con esa búsqueda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
            <AnimatePresence>
              {paginatedSuppliers.map((s, idx) => {
                // 🛡️ SOLUCIÓN NOMBRES: Ahora usa guiones bajos (_) para coincidir con tus archivos
                const safeImageName = s.companyName
                  .toLowerCase()
                  .trim()
                  .replace(/\s+/g, "_");

                const isSelected = selectedIds.includes(s.id);

                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`bg-white dark:bg-[#0a0f1c] border rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group flex flex-col relative ${isSelected ? "border-brand ring-2 ring-brand/50 dark:shadow-brand/20" : "border-slate-200 dark:border-slate-800 shadow-slate-200/20 dark:shadow-black/40 hover:border-brand/30"}`}
                  >
                    <div className="absolute top-4 right-4 z-20">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(s.id)}
                        className="w-5 h-5 rounded-md border-slate-300 text-brand focus:ring-brand accent-brand cursor-pointer shadow-md"
                      />
                    </div>

                    <div className="h-28 w-full relative overflow-hidden flex items-center justify-center bg-white dark:bg-white border-b border-slate-100 dark:border-slate-700/50 p-3">
                      {!imageErrors[s.companyName] ? (
                        <img
                          src={`/logos/${safeImageName}.png`}
                          alt={`Logo ${s.companyName}`}
                          // 🛡️ SOLUCIÓN CSS LOGOS: object-contain hace que respete proporciones sin cortarse
                          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                          onError={() => handleImageError(s.companyName)}
                        />
                      ) : (
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${getBrandColors(s.companyName)} flex items-center justify-center`}
                        >
                          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <span className="text-4xl font-black text-white drop-shadow-md z-10 tracking-tighter">
                            {s.companyName.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-6 flex-1 flex flex-col space-y-4">
                      <div className="mb-4">
                        <h3
                          className="text-xl font-black text-slate-800 dark:text-white leading-tight truncate pr-6"
                          title={s.companyName}
                        >
                          {s.companyName}
                        </h3>
                        <div className="flex items-center text-xs font-bold text-slate-400 mt-1">
                          <Hash size={12} className="mr-1" /> CUIT:{" "}
                          {s.cuit || "S/D"}
                        </div>
                      </div>

                      <div className="space-y-3 flex-1 text-slate-600 dark:text-slate-300">
                        {s.contactName && (
                          <div className="flex items-center text-sm font-medium bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            <Building2
                              size={16}
                              className="text-brand mr-3 shrink-0"
                            />
                            <span className="truncate">
                              Contacto: <b>{s.contactName}</b>
                            </span>
                          </div>
                        )}
                        {s.phone && (
                          <div className="flex items-center text-sm font-medium bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            <Phone
                              size={16}
                              className="text-brand mr-3 shrink-0"
                            />
                            <span className="truncate">
                              Tel: <b>{s.phone}</b>
                            </span>
                          </div>
                        )}

                        {s.email && (
                          <div className="flex items-center text-sm font-medium">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 mr-3 shrink-0">
                              <Mail size={14} />
                            </div>
                            <span className="truncate" title={s.email}>
                              {s.email}
                            </span>
                          </div>
                        )}
                        {s.address && (
                          <div className="flex items-center text-sm font-medium">
                            <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500 mr-3 shrink-0">
                              <MapPin size={14} />
                            </div>
                            <span
                              className="truncate text-xs"
                              title={s.address}
                            >
                              {s.address}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 shrink-0">
                      <button
                        onClick={() => handleOpenModal(s)}
                        className="p-4 flex items-center justify-center gap-2 text-xs font-black uppercase text-slate-500 hover:text-brand hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-r border-slate-100 dark:border-slate-800"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() =>
                          navigate(
                            `/price-lists?brand=${encodeURIComponent(s.companyName)}`,
                          )
                        }
                        className="p-4 flex items-center justify-center gap-2 text-xs font-black uppercase text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors border-r border-slate-100 dark:border-slate-800"
                        title="Ver Tarifas Asociadas"
                      >
                        <PackageSearch size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedIds([s.id]);
                          setIsDeletingAll(false);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-4 flex items-center justify-center gap-2 text-xs font-black uppercase text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Eliminar Proveedor"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/80 dark:bg-black/90 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0a0f1c] rounded-3xl shadow-2xl max-w-md w-full border border-red-200 dark:border-red-900 overflow-hidden"
            >
              <div className="p-6 flex items-center space-x-4 border-b border-slate-100 dark:border-slate-800 bg-red-50 dark:bg-red-900/10">
                <div className="p-3 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-red-800 dark:text-red-400">
                    Peligro Crítico
                  </h3>
                  <p className="text-xs font-bold text-red-600/70 dark:text-red-500/70">
                    Borrado de Directorio
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 text-center">
                  Estás a punto de borrar{" "}
                  <b>
                    {selectedIds.length > 0
                      ? selectedIds.length
                      : suppliers.length}{" "}
                    proveedores
                  </b>
                  . Si tienen productos asociados, la acción podría fallar por
                  seguridad referencial.
                </p>

                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-bold text-slate-500 mb-2 text-center">
                    Para confirmar, escribí la palabra{" "}
                    <span className="text-red-500 font-black">
                      "{isDeletingAll ? "VACIAR" : "ELIMINAR"}"
                    </span>
                  </p>
                  <input
                    type="text"
                    value={deleteSecurityWord}
                    onChange={(e) => setDeleteSecurityWord(e.target.value)}
                    placeholder="Escribí aquí..."
                    className="w-full text-center font-black tracking-widest uppercase bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-red-600 dark:text-red-400 focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>

              <div className="p-6 pt-0 flex space-x-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={executeDelete}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg shadow-red-600/30 transition-colors"
                >
                  Confirmar Destrucción
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
