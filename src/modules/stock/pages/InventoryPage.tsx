// Importación de dependencias estructurales y hooks de optimización de React
import { useState, useEffect, useCallback } from "react";
// Importación de iconografía vectorizada
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
// Importación de componentes especializados y lógica de negocio
import { CyberHeader } from "../../../shared/components/CyberHeader";
import { useAuth } from "../../../core/context/AuthContext";
import { StockAdjustModal } from "../components/StockAdjustModal";

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

  // ESTADOS ARQUITECTÓNICOS (El valor 0 representa "Todas las Sucursales")
  const [activeBranchId, setActiveBranchId] = useState<number>(0);
  const [inventory, setInventory] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ESTADOS DE FILTRADO Y BÚSQUEDA AVANZADA
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "OPTIMAL" | "CRITICAL" | "OUT"
  >("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // ESTADOS DE PAGINACIÓN DINÁMICA
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    msg: string;
    type: "success" | "error";
  }>({
    show: false,
    msg: "",
    type: "success",
  });

  const showToast = useCallback(
    (msg: string, type: "success" | "error" = "success") => {
      setToast({ show: false, msg: "", type: "success" });
      setTimeout(() => {
        setToast({ show: true, msg, type });
        setTimeout(
          () => setToast({ show: false, msg: "", type: "success" }),
          4500,
        );
      }, 10);
    },
    [],
  );

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      // Enviamos el ID de la sucursal (0 para traer el consolidado de todas)
      const response = await fetch(`${API_URL}/stock/${activeBranchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (response.ok) {
        setInventory(result.data || []);
      }
    } catch (error) {
      console.error("Fallo en sincronización de inventario:", error);
      showToast("Error de conexión con el almacén central.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [token, activeBranchId, showToast]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // RESET DE PAGINACIÓN
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter, activeBranchId]);

  // Extracción dinámica de categorías únicas para el filtro
  const uniqueCategories = Array.from(
    new Set(inventory.map((item) => item.product.category)),
  ).filter(Boolean);

  // MOTOR DE FILTRADO COMBINADO
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

  // MOTOR DE PAGINACIÓN
  const totalPages = Math.max(
    1,
    Math.ceil(filteredInventory.length / itemsPerPage),
  );
  const currentInventory = filteredInventory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // KPIs Estratégicos Globales
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
    <div className="min-h-screen bg-[#F4F7F9] dark:bg-[#030712] p-4 flex flex-col transition-colors duration-700">
      {/* Centro de Notificaciones */}
      <div
        className={`fixed top-6 right-6 z-[999] transition-all duration-500 transform ${toast.show ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"}`}
      >
        <div
          className={`flex items-center space-x-3 px-6 py-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border backdrop-blur-xl ${toast.type === "success" ? "bg-emerald-50/90 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400" : "bg-red-50/90 dark:bg-red-950/90 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"}`}
        >
          {toast.type === "success" ? (
            <CheckCircle size={22} className="text-emerald-500" />
          ) : (
            <AlertTriangle size={22} className="text-red-500" />
          )}
          <span className="font-extrabold text-sm tracking-tight">
            {toast.msg}
          </span>
        </div>
      </div>

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

        {/* BARRA DE HERRAMIENTAS COMPLETAS */}
        <div className="flex flex-col xl:flex-row items-center gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-2 shadow-lg">
          {/* Búsqueda */}
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

          {/* Filtro por Categoría */}
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

          {/* Filtro por Estado de Alerta (Corregido el tipado) */}
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
                Para Reponer (Crítico)
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

          {/* Selector de Sucursal */}
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

        {/* Bóveda de Inventario (Tabla Paginada) */}
        <div className="bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex-1 flex flex-col transition-all duration-300">
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
                      No se detectaron registros para estos filtros.
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
                          <div className="w-12 h-12 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                            {item.product.imageUrl ? (
                              <img
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
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
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg inline-block shadow-inner border border-slate-100 dark:border-slate-800/50">
                            {item.product.sku}
                          </p>
                        </td>
                        <td className="p-6 text-right">
                          <span
                            className={`text-3xl font-black transition-colors ${isOutOfStock ? "text-red-500" : isCritical ? "text-amber-500" : "text-emerald-500"}`}
                          >
                            {item.quantity}
                          </span>
                        </td>
                        <td className="p-6 text-center">
                          {isOutOfStock ? (
                            <div className="inline-flex items-center space-x-1.5 text-red-500 bg-red-500/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-red-500/5">
                              <XCircle size={15} /> <span>Agotado</span>
                            </div>
                          ) : isCritical ? (
                            <div className="inline-flex items-center space-x-1.5 text-amber-500 bg-amber-500/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-amber-500/5">
                              <AlertTriangle size={15} />{" "}
                              <span>Crítico (Min: {item.minStock})</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center space-x-1.5 text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-500/5">
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

          {/* CONTROLES DE PAGINACIÓN */}
          {!isLoading && filteredInventory.length > 0 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Mostrando{" "}
                <span className="text-slate-800 dark:text-white font-black">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                a{" "}
                <span className="text-slate-800 dark:text-white font-black">
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredInventory.length,
                  )}
                </span>{" "}
                de{" "}
                <span className="text-brand font-black">
                  {filteredInventory.length}
                </span>{" "}
                registros
              </p>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className={`p-2 rounded-xl border transition-all ${currentPage === 1 ? "border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed" : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-brand hover:border-brand"}`}
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-700 dark:text-white shadow-sm">
                  Página {currentPage} de {totalPages}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-xl border transition-all ${currentPage === totalPages ? "border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed" : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-brand hover:border-brand"}`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

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
                },
              }
            : null
        }
        onSuccess={(msg) => {
          showToast(msg, "success");
          fetchInventory();
        }}
        onError={(msg) => showToast(msg, "error")}
        token={token}
      />
    </div>
  );
};
