import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSpreadsheet,
  Search,
  CloudUpload,
  Loader2,
  Filter,
  RefreshCw,
  Tag,
  AlertTriangle,
  CalendarDays,
  ShieldAlert,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { CyberHeader } from "../../../shared/components/CyberHeader";
import { neuroToast } from "../../../shared/utils/neuroToast";
import { ExcelImportManager } from "../components/ExcelImportManager";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000/api";

interface ProductMetadata {
  cashPriceRaw?: number | string;
  installments2Raw?: number | string;
  installments3Raw?: number | string;
  installments6Raw?: number | string;
  installments12Raw?: number | string;
  lastListUpdate?: string;
  [key: string]: unknown;
}

interface ProductListItem {
  id: number;
  sku: string;
  name: string;
  brand: string;
  costPrice: number;
  metadata?: unknown;
}

const formatDisplayDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  if (dateStr.includes("/")) return dateStr;
  const parts = dateStr.split("-");
  if (parts.length >= 3) {
    return `${parts[2].substring(0, 2)}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const PriceListsPage = () => {
  const token = localStorage.getItem("club_token");
  const [searchParams, setSearchParams] = useSearchParams();
  const initialBrand = searchParams.get("brand") || "ALL";

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [suppliers, setSuppliers] = useState<
    { id: number; companyName: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🛡️ ESTADOS DE FILTROS, ORDEN Y PAGINACIÓN
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // ESTADOS DE BORRADO
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteSecurityWord, setDeleteSecurityWord] = useState("");
  // Diferenciamos si es borrado selectivo o vaciado total
  const [deleteMode, setDeleteMode] = useState<"selected" | "all">("selected");

  const fetchPriceList = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/products?limit=3000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (response.ok) {
        setProducts(result.data || []);
      }
    } catch (error) {
      console.log("Error fetching price list:", error);
      neuroToast("Error de red", "error", "No se pudo cargar la lista.");
    } finally {
      setIsLoading(false);
      setSelectedIds([]);
    }
  }, [token]);

  useEffect(() => {
    fetchPriceList();

    fetch(`${API_URL}/suppliers?limit=3000`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) =>
        setSuppliers(Array.isArray(data) ? data : data.data || []),
      )
      .catch((err) => console.error("Error obteniendo proveedores:", err));
  }, [fetchPriceList, token]);

  const getSafeMetadata = (rawMeta: unknown): ProductMetadata => {
    if (!rawMeta) return {};
    if (typeof rawMeta === "string") {
      try {
        const parsed = JSON.parse(rawMeta);
        return typeof parsed === "object" && parsed !== null
          ? (parsed as ProductMetadata)
          : {};
      } catch {
        return {};
      }
    }
    return typeof rawMeta === "object" && rawMeta !== null
      ? (rawMeta as ProductMetadata)
      : {};
  };

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBrand = e.target.value;
    setSelectedBrand(newBrand);
    setCurrentPage(1);
    if (newBrand === "ALL") searchParams.delete("brand");
    else searchParams.set("brand", newBrand);
    setSearchParams(searchParams);
  };

  const filteredAndSortedProducts = useMemo(() => {
    const result = products.filter((p) => {
      const meta = getSafeMetadata(p.metadata);
      const safeDate = formatDisplayDate(meta.lastListUpdate);
      const sTerm = searchTerm.toLowerCase();

      const matchesSearch =
        p.name.toLowerCase().includes(sTerm) ||
        (p.sku && p.sku.toLowerCase().includes(sTerm)) ||
        (p.brand && p.brand.toLowerCase().includes(sTerm)) ||
        (safeDate && safeDate.includes(sTerm));

      const matchesBrand = selectedBrand === "ALL" || p.brand === selectedBrand;
      return matchesSearch && matchesBrand;
    });

    result.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (sortOrder === "asc") return nameA.localeCompare(nameB);
      return nameB.localeCompare(nameA);
    });

    return result;
  }, [products, searchTerm, selectedBrand, sortOrder]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedProducts.slice(
      startIndex,
      startIndex + itemsPerPage,
    );
  }, [filteredAndSortedProducts, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);

  const uniqueBrands = useMemo(() => {
    const supplierBrands = suppliers.map((s) => s.companyName);
    const productBrands = products.map((p) => p.brand);
    return Array.from(new Set([...supplierBrands, ...productBrands]))
      .filter(Boolean)
      .sort();
  }, [suppliers, products]);

  const toggleSelection = (id: number) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );

  const toggleAll = () =>
    selectedIds.length === paginatedProducts.length
      ? setSelectedIds([])
      : setSelectedIds(paginatedProducts.map((p) => p.id));

  // 💣 EJECUTOR DE VACIADO / BORRADO
  const executeDelete = async () => {
    const wordRequired = deleteMode === "all" ? "vaciar" : "eliminar";

    if (deleteSecurityWord.toLowerCase() !== wordRequired) {
      neuroToast(
        "Seguridad",
        "warning",
        `Debes escribir '${wordRequired.toUpperCase()}' para confirmar.`,
      );
      return;
    }

    try {
      neuroToast(
        "Procesando...",
        "info",
        deleteMode === "all"
          ? "Vaciando catálogo entero..."
          : "Eliminando selección...",
      );

      if (deleteMode === "all") {
        // 💣 NUCLEAR: Borra todo con 1 sola petición
        const response = await fetch(`${API_URL}/products/delete-all`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("No se pudo vaciar la lista.");
        const data = await response.json();
        neuroToast(
          "Limpieza Extrema",
          "success",
          `Se eliminaron ${data.deletedCount} artículos de un plumazo.`,
        );
      } else {
        // BORRADO SELECTIVO: Borra solo los seleccionados
        await Promise.all(
          selectedIds.map((id) =>
            fetch(`${API_URL}/products/${id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            }),
          ),
        );
        neuroToast(
          "Limpieza Exitosa",
          "success",
          `Se eliminaron ${selectedIds.length} artículos.`,
        );
      }

      setIsDeleteModalOpen(false);
      setDeleteSecurityWord("");
      fetchPriceList();
    } catch (error) {
      console.log("Error deleting:", error);
      neuroToast(
        "Fallo crítico",
        "error",
        "Ocurrió un error en la eliminación.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#030712] p-4 flex flex-col transition-colors duration-700">
      <div className="max-w-[1700px] mx-auto w-full flex-1 flex flex-col space-y-6">
        <CyberHeader
          phrases={[
            "Centro de Ingesta ETL",
            "Importador Masivo de Listas de Precios",
          ]}
          labelIcon={FileSpreadsheet}
          labelText="Visor de Tarifas Crudas"
          tags={[
            {
              text: `REGISTROS: ${filteredAndSortedProducts.length}`,
              icon: Tag,
              delay: "text-brand",
            },
          ]}
        />

        <div className="flex flex-col xl:flex-row items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-3 shadow-sm transition-all duration-300">
          <div className="flex-1 w-full flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar por artículo, marca o fecha..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-800/50 pl-11 pr-4 py-3 rounded-2xl text-sm font-bold text-slate-700 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/50 border border-slate-200 dark:border-slate-700 transition-all"
              />
            </div>

            <div className="relative md:w-64 shrink-0">
              <Filter
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <select
                value={selectedBrand}
                onChange={handleBrandChange}
                className="w-full bg-slate-50 dark:bg-slate-800/50 pl-11 pr-4 py-3 rounded-2xl text-sm font-bold text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/50 appearance-none cursor-pointer truncate"
              >
                <option value="ALL">Todas las Listas</option>
                {uniqueBrands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() =>
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
              className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 transition-colors border border-slate-200 dark:border-slate-700 shrink-0"
              title="Ordenar Alfabéticamente"
            >
              <ArrowUpDown size={16} />
              <span className="hidden md:inline">
                {sortOrder === "asc" ? "A-Z" : "Z-A"}
              </span>
            </button>
          </div>

          <div className="flex items-center space-x-3 w-full xl:w-auto shrink-0 mt-4 xl:mt-0">
            {/* BOTÓN 1: Borrar Selección (solo si hay casillas marcadas) */}
            {selectedIds.length > 0 && (
              <button
                onClick={() => {
                  setDeleteMode("selected");
                  setIsDeleteModalOpen(true);
                }}
                className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-sm flex items-center space-x-2 transition-all shadow-lg hover:scale-105"
                title="Eliminar lo que marcaste con tilde"
              >
                <Trash2 size={18} />
                <span className="hidden md:inline">
                  Borrar ({selectedIds.length})
                </span>
              </button>
            )}

            {/* BOTÓN 2: VACIAR TODO (Nuclear) */}
            {products.length > 0 && (
              <button
                onClick={() => {
                  setDeleteMode("all");
                  setIsDeleteModalOpen(true);
                }}
                className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm uppercase flex items-center space-x-2 transition-all shadow-lg shadow-red-600/30 hover:scale-105"
                title="Vaciar todo el directorio de precios de la base de datos"
              >
                <ShieldAlert size={18} />
                <span className="hidden md:inline">Vaciar Todo</span>
              </button>
            )}

            <button
              onClick={() => fetchPriceList()}
              className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="w-full md:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-600/30 hover:scale-105"
            >
              <CloudUpload size={18} /> <span>Subir Excel</span>
            </button>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 px-4 shadow-sm">
            <span className="text-xs font-bold text-slate-500">
              Mostrando {paginatedProducts.length} de{" "}
              {filteredAndSortedProducts.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 rounded-lg disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-black text-slate-700 dark:text-white px-2">
                Pág {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 rounded-lg disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col relative">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="animate-spin text-brand" size={48} />
            </div>
          ) : filteredAndSortedProducts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <FileSpreadsheet
                size={64}
                className="text-slate-300 dark:text-slate-700 mb-4"
              />
              <h3 className="text-xl font-black text-slate-700 dark:text-white">
                Lista Vacía
              </h3>
              <p className="text-slate-500 mt-2 max-w-md">
                No hay registros en la base de datos para esta búsqueda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4 pl-6 w-10">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.length === paginatedProducts.length &&
                          paginatedProducts.length > 0
                        }
                        onChange={toggleAll}
                        className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand accent-brand cursor-pointer"
                      />
                    </th>
                    <th className="p-4 whitespace-nowrap">SKU / Cód.</th>
                    <th className="p-4">Nombre del Artículo</th>
                    <th className="p-4 whitespace-nowrap">Proveedor / Marca</th>
                    <th className="p-4 whitespace-nowrap">
                      Últ. Actualización
                    </th>
                    <th className="p-4 text-right text-brand whitespace-nowrap">
                      Precio Lista
                    </th>
                    <th className="p-4 text-right text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      Desc. Efectivo
                    </th>
                    <th className="p-4 text-right whitespace-nowrap">
                      2 Cuotas
                    </th>
                    <th className="p-4 text-right whitespace-nowrap">
                      3 Cuotas
                    </th>
                    <th className="p-4 text-right whitespace-nowrap">
                      6 Cuotas
                    </th>
                    <th className="p-4 text-right pr-6 whitespace-nowrap">
                      Ahora 12
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {paginatedProducts.map((p) => {
                    const safeImageName = p.brand
                      ? p.brand.toLowerCase().trim().replace(/\s+/g, "_")
                      : "";
                    const isSelected = selectedIds.includes(p.id);
                    const meta = getSafeMetadata(p.metadata);

                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors group ${isSelected ? "bg-amber-50/50 dark:bg-brand/10" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/20"}`}
                      >
                        <td className="p-4 pl-6">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelection(p.id)}
                            className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand accent-brand cursor-pointer"
                          />
                        </td>
                        <td className="p-4 text-xs font-bold text-slate-500">
                          {p.sku || "-"}
                        </td>
                        <td
                          className="p-4 text-sm font-bold text-slate-800 dark:text-white max-w-xs truncate"
                          title={p.name}
                        >
                          {p.name}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            {safeImageName && (
                              <img
                                src={`/logos/${safeImageName}.png`}
                                alt=""
                                className="w-6 h-6 object-contain rounded bg-white dark:bg-white/90 p-0.5"
                                onError={(e) =>
                                  (e.currentTarget.style.display = "none")
                                }
                              />
                            )}
                            <span className="text-xs font-bold text-slate-500 truncate max-w-[120px]">
                              {p.brand || "S/M"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-bold text-slate-500 whitespace-nowrap">
                          {meta.lastListUpdate ? (
                            <div className="flex items-center space-x-1">
                              <CalendarDays size={12} className="text-brand" />
                              <span>
                                {formatDisplayDate(meta.lastListUpdate)}
                              </span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-4 text-base font-black text-slate-800 dark:text-white text-right">
                          ${Number(p.costPrice).toLocaleString("es-AR")}
                        </td>
                        <td className="p-4 text-sm font-bold text-emerald-600 text-right">
                          {meta.cashPriceRaw && Number(meta.cashPriceRaw) > 0
                            ? `$${Number(meta.cashPriceRaw).toLocaleString("es-AR")}`
                            : "-"}
                        </td>
                        <td className="p-4 text-sm font-medium text-slate-600 text-right">
                          {meta.installments2Raw &&
                          Number(meta.installments2Raw) > 0
                            ? `$${Number(meta.installments2Raw).toLocaleString("es-AR")}`
                            : "-"}
                        </td>
                        <td className="p-4 text-sm font-medium text-slate-600 text-right">
                          {meta.installments3Raw &&
                          Number(meta.installments3Raw) > 0
                            ? `$${Number(meta.installments3Raw).toLocaleString("es-AR")}`
                            : "-"}
                        </td>
                        <td className="p-4 text-sm font-medium text-slate-600 text-right">
                          {meta.installments6Raw &&
                          Number(meta.installments6Raw) > 0
                            ? `$${Number(meta.installments6Raw).toLocaleString("es-AR")}`
                            : "-"}
                        </td>
                        <td className="p-4 pr-6 text-sm font-medium text-slate-600 text-right">
                          {meta.installments12Raw &&
                          Number(meta.installments12Raw) > 0
                            ? `$${Number(meta.installments12Raw).toLocaleString("es-AR")}`
                            : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center mt-2">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-full p-2 shadow-sm">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-black text-slate-700 dark:text-white px-4">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
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
                    Borrado de Base de Datos
                  </p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 text-center">
                  Estás a punto de borrar{" "}
                  <b>
                    {deleteMode === "selected"
                      ? selectedIds.length
                      : products.length}{" "}
                    artículos
                  </b>{" "}
                  permanentemente del sistema.
                </p>
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-bold text-slate-500 mb-2 text-center">
                    Para confirmar, escribí la palabra{" "}
                    <span className="text-red-500 font-black">
                      "{deleteMode === "all" ? "VACIAR" : "ELIMINAR"}"
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
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={executeDelete}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg transition-colors"
                >
                  Confirmar Destrucción
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ExcelImportManager
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchPriceList}
        initialBrand={selectedBrand !== "ALL" ? selectedBrand : ""}
      />
    </div>
  );
};
