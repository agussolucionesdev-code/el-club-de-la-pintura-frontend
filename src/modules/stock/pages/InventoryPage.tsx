import { useState, useEffect, useCallback } from "react";
import {
  PackageSearch,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  SlidersHorizontal,
  Loader2,
  Package,
  Store,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  Globe,
} from "lucide-react";

import { CyberHeader } from "../../../shared/components/CyberHeader";
import { useAuth } from "../../../core/context/AuthContext";
import { StockAdjustModal } from "../components/StockAdjustModal";
// MOTOR NEURO-VOCAL GLOBAL (Interceptor)
import { neuroToast } from "../../../shared/utils/neuroToast";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000/api";

interface ProductDetails {
  id: number;
  name: string;
  sku: string;
  category: string;
  retailPrice: number;
  imageUrl?: string;
}
interface StockItem {
  id: number;
  quantity: number;
  minStock: number;
  productId: number;
  branchId: number;
  product: ProductDetails;
}
interface ExtendedUser {
  id: number;
  name: string;
  email: string;
  role: string;
  branches?: { id: number; name: string }[];
}

export const InventoryPage = () => {
  const { user } = useAuth();
  const currentUser = user as ExtendedUser;
  const token = localStorage.getItem("club_token");

  const [activeBranchId, setActiveBranchId] = useState<number>(0);
  const [inventory, setInventory] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "OPTIMAL" | "CRITICAL" | "OUT"
  >("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/stock/${activeBranchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (response.ok) {
        setInventory(result.data || []);
      }
    } catch (error) {
      console.log(error);
      neuroToast("Error al sincronizar inventario.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [token, activeBranchId]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter, activeBranchId]);

  const uniqueCategories = Array.from(
    new Set(inventory.map((item) => item.product.category)),
  ).filter(Boolean);

  const filteredInventory = inventory.filter((item) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      item.product.name.toLowerCase().includes(s) ||
      item.product.sku.toLowerCase().includes(s) ||
      item.product.category.toLowerCase().includes(s);

    let matchesStatus = true;
    if (statusFilter === "OUT") matchesStatus = item.quantity <= 0;
    else if (statusFilter === "CRITICAL")
      matchesStatus = item.quantity > 0 && item.quantity <= item.minStock;
    else if (statusFilter === "OPTIMAL")
      matchesStatus = item.quantity > item.minStock;

    const matchesCategory =
      categoryFilter === "ALL" || item.product.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredInventory.length / itemsPerPage),
  );
  const currentInventory = filteredInventory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const totalProducts = inventory.length;
  const categoriesCount = new Set(inventory.map((i) => i.product.category))
    .size;
  const outOfStockCount = inventory.filter((i) => i.quantity <= 0).length;
  const criticalStockCount = inventory.filter(
    (i) => i.quantity > 0 && i.quantity <= i.minStock,
  ).length;
  const healthyStockCount = inventory.filter(
    (i) => i.quantity > i.minStock,
  ).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#030712] p-4 flex flex-col transition-colors duration-700">
      <div className="max-w-[1700px] mx-auto w-full flex-1 flex flex-col space-y-6">
        <CyberHeader
          phrases={[
            "Auditoría en tiempo real",
            "Control de Almacén Activo",
            "Gestión Multi-Sucursal",
          ]}
          labelIcon={PackageSearch}
          labelText="Auditoría de Inventario"
          tags={[
            {
              text: `TOTAL PRODUCTOS: ${totalProducts}`,
              icon: Package,
              delay: "text-blue-500",
            },
            {
              text: `CATEGORÍAS ÚNICAS: ${categoriesCount}`,
              icon: Layers,
              delay: "text-purple-500",
            },
            {
              text: `FUERA DE STOCK: ${outOfStockCount}`,
              icon: XCircle,
              delay: "text-red-500",
            },
            {
              text: `PARA REPONER: ${criticalStockCount}`,
              icon: AlertTriangle,
              delay: "text-amber-500",
            },
            {
              text: `STOCK SUFICIENTE: ${healthyStockCount}`,
              icon: CheckCircle,
              delay: "text-emerald-500",
            },
          ]}
        />

        {/* BARRA DE FILTROS SUPERIOR */}
        <div className="flex flex-col xl:flex-row items-center gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-2 shadow-sm">
          <div className="relative flex-1 w-full">
            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent pl-14 pr-4 py-4 font-bold text-slate-700 dark:text-white placeholder-slate-400 focus:outline-none"
            />
          </div>
          <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden xl:block"></div>

          <div className="relative shrink-0 w-full xl:w-48">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Layers size={18} />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-12 pr-10 py-4 bg-transparent border-none text-sm font-black text-slate-700 dark:text-white appearance-none focus:outline-none cursor-pointer"
            >
              <option
                value="ALL"
                className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              >
                TODAS LAS CAT.
              </option>
              {uniqueCategories.map((cat) => (
                <option
                  key={cat}
                  value={cat}
                  className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                >
                  {cat}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
              <ChevronDown size={16} />
            </div>
          </div>
          <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden xl:block"></div>

          <div className="relative shrink-0 w-full xl:w-56">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Filter size={18} />
            </div>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "ALL" | "OPTIMAL" | "CRITICAL" | "OUT",
                )
              }
              className="w-full pl-12 pr-10 py-4 bg-transparent border-none text-sm font-black text-slate-700 dark:text-white appearance-none focus:outline-none cursor-pointer"
            >
              <option
                value="ALL"
                className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              >
                TODOS LOS ESTADOS
              </option>
              <option
                value="OUT"
                className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              >
                Solo Agotados
              </option>
              <option
                value="CRITICAL"
                className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              >
                Para Reponer
              </option>
              <option
                value="OPTIMAL"
                className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              >
                Stock Saludable
              </option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
              <ChevronDown size={16} />
            </div>
          </div>
          <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden xl:block"></div>

          <div className="relative shrink-0 w-full xl:w-64">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand">
              {activeBranchId === 0 ? <Globe size={18} /> : <Store size={18} />}
            </div>
            <select
              value={activeBranchId}
              onChange={(e) => setActiveBranchId(Number(e.target.value))}
              className="w-full pl-12 pr-10 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black text-slate-700 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-brand/50 cursor-pointer transition-all"
            >
              <option
                value={0}
                className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              >
                TODAS LAS SUCURSALES
              </option>
              {currentUser?.branches?.map((branch) => (
                <option
                  key={branch.id}
                  value={branch.id}
                  className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                >
                  {branch.name.toUpperCase()}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {/* TABLA PRINCIPAL */}
        <div className="bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-xl overflow-hidden flex-1 flex flex-col transition-all duration-300">
          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-200 dark:border-slate-800">
                  <th className="p-6">Info. Producto</th>
                  <th className="p-6">Identificación (SKU)</th>
                  <th className="p-6 text-right">Cant. Fija</th>
                  <th className="p-6 text-center">Estado de Alerta</th>
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
                ) : currentInventory.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs"
                    >
                      No hay registros.
                    </td>
                  </tr>
                ) : (
                  currentInventory.map((item) => {
                    const isOutOfStock = item.quantity <= 0;
                    const isCritical =
                      item.quantity > 0 && item.quantity <= item.minStock;

                    return (
                      <tr
                        key={`${item.productId}-${item.branchId}`}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group"
                      >
                        <td className="p-6 flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                            {item.product.imageUrl ? (
                              <img
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                className="w-full h-full object-contain rounded-lg p-1"
                              />
                            ) : (
                              <Package
                                size={20}
                                className="text-slate-300 dark:text-slate-600"
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white leading-tight">
                              {item.product.name}
                            </p>
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 text-[8px] uppercase font-black px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 mt-1 inline-block">
                              {item.product.category}
                            </span>
                          </div>
                        </td>
                        <td className="p-6">
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg inline-block border border-slate-100 dark:border-slate-800/50">
                            {item.product.sku}
                          </p>
                        </td>
                        <td className="p-6 text-right">
                          <span
                            className={`text-3xl font-black ${isOutOfStock ? "text-red-500" : isCritical ? "text-amber-500" : "text-emerald-500"}`}
                          >
                            {item.quantity}
                          </span>
                        </td>
                        <td className="p-6 text-center">
                          {isOutOfStock ? (
                            <div className="inline-flex items-center space-x-1.5 text-red-500 bg-red-500/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase">
                              <XCircle size={15} /> <span>Agotado</span>
                            </div>
                          ) : isCritical ? (
                            <div className="inline-flex items-center space-x-1.5 text-amber-500 bg-amber-500/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase">
                              <AlertTriangle size={15} /> <span>Crítico</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center space-x-1.5 text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase">
                              <CheckCircle size={15} /> <span>Normal</span>
                            </div>
                          )}
                        </td>
                        <td className="p-6 text-center">
                          <button
                            onClick={() => setSelectedStock(item)}
                            className="p-3 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-2xl transition-all"
                            title="Desplegar Ajuste de Stock"
                          >
                            <SlidersHorizontal size={20} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && filteredInventory.length > 0 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                {Math.min(currentPage * itemsPerPage, filteredInventory.length)}{" "}
                de {filteredInventory.length} registros
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-700 dark:text-white">
                  Página {currentPage} de {totalPages}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LLAMADA AL MODAL CON LA SOLUCIÓN DEL INTERCEPTOR */}
      <StockAdjustModal
        isOpen={!!selectedStock}
        onClose={() => setSelectedStock(null)}
        stockItem={
          selectedStock
            ? {
                productId: selectedStock.productId,
                branchId: selectedStock.branchId,
                quantity: selectedStock.quantity,
                product: {
                  name: selectedStock.product.name,
                  sku: selectedStock.product.sku,
                  category: selectedStock.product.category,
                  imageUrl: selectedStock.product.imageUrl,
                },
              }
            : null
        }
        onSuccess={(msg) => {
          neuroToast(msg, "success");
          fetchInventory();
        }}
        // SOLUCIÓN: Pasamos el 'msg' directo para que el interceptor lea la palabra "caja"
        onError={(msg) => neuroToast(msg, "error")}
        token={token}
      />
    </div>
  );
};
