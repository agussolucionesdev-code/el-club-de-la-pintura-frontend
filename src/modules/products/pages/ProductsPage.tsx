// Importación de dependencias de React
import React, { useState, useEffect, useRef, useCallback } from "react";
// Importación estricta de iconografía utilizada (Lucide React)
import {
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Box,
  Layers,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Zap,
  RefreshCw,
  Eye,
  AlertCircle,
  Image as ImageIcon,
  ArrowUpCircle,
  Barcode,
  FileSpreadsheet,
  Loader2,
  CheckSquare,
  AlertOctagon,
  MinusCircle,
  PlusCircle,
} from "lucide-react";

// Importación de contextos y componentes del ecosistema
import { useAuth } from "../../../core/context/AuthContext";
import { ProductModal } from "../components/ProductModal";
import type { Product } from "../components/ProductModal";
import { ProductViewModal } from "../components/ProductViewModal";
import { CyberHeader } from "../../../shared/components/CyberHeader";

// Definición de variable de entorno para conexión a API
const API_URL = "http://127.0.0.1:4000/api";

export const ProductsPage = () => {
  // Obtención de sesión de usuario y credenciales
  const { user } = useAuth();
  const token = localStorage.getItem("club_token");

  // Extracción de nombre de usuario para personalización de UI
  const userName = user?.name ? user.name.split(" ")[0] : "Admin";

  // Configuración de textos dinámicos para CyberHeader
  const phrases = [
    `Gestión de inventario activa, ${userName}. Servidor principal operativo.`,
    `Catálogo sincronizado. ¿Qué ajustamos hoy, ${userName}?`,
    `Trazabilidad perfecta. Datos seguros y encriptados.`,
  ];

  // Configuración de etiquetas dinámicas para CyberHeader
  const tags = [
    {
      text: "Stock Inteligente",
      icon: Zap,
      delay: "animate-slide-in-left delay-100",
    },
    {
      text: "Sincronización DB",
      icon: RefreshCw,
      delay: "animate-slide-in-left delay-200",
    },
    {
      text: "Cero Quiebres",
      icon: ShieldAlert,
      delay: "animate-slide-in-bottom delay-300",
    },
    {
      text: "Categorización Real",
      icon: Layers,
      delay: "animate-slide-in-right delay-400",
    },
  ];

  // Inicialización de estados principales de datos
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Inicialización de estados de filtrado y búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Inicialización de estados para control de Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [productToView, setProductToView] = useState<Product | null>(null);

  // Inicialización de estados para confirmaciones de borrado
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);

  // Inicialización de estados para ajuste rápido de stock
  const [fastStockProduct, setFastStockProduct] = useState<Product | null>(
    null,
  );
  const [fastStockQuantity, setFastStockQuantity] = useState<number>(0);

  // Referencias y estados de carga de archivos Excel
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);

  // Inicialización de estados de paginación y selección
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Inicialización de sistema de notificaciones (Toasts)
  const [toast, setToast] = useState<{
    show: boolean;
    msg: string;
    type: "success" | "error";
  }>({ show: false, msg: "", type: "success" });

  // Implementación de disparador de notificaciones estabilizado en memoria
  const showToast = useCallback(
    (msg: string, type: "success" | "error" = "success") => {
      setToast({ show: true, msg, type });
      setTimeout(
        () => setToast({ show: false, msg: "", type: "success" }),
        4000,
      );
    },
    [],
  );

  // Petición HTTP para obtención de catálogo completo
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/products?limit=1000`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) throw new Error("Error en petición");
      const jsonResponse = await response.json();

      // Mapeo seguro de respuesta estructural
      if (jsonResponse && Array.isArray(jsonResponse.data)) {
        setProducts(jsonResponse.data);
      } else if (Array.isArray(jsonResponse)) {
        setProducts(jsonResponse);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Fallo la conexión:", error);
      showToast(
        "El servidor Backend no responde. ¿Está encendido el puerto 4000?",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  }, [token, showToast]);

  // Ejecución de sincronización inicial al montar componente
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Manejo de creación o actualización de producto desde el Modal
  const handleSaveProduct = async (productData: Product) => {
    try {
      const isEditing = !!productToEdit && !!productData.id;
      const endpoint = isEditing
        ? `${API_URL}/products/${productData.id}`
        : `${API_URL}/products`;

      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) throw new Error("Error en servidor");

      await fetchProducts();
      setIsModalOpen(false);
      showToast(
        isEditing
          ? "Catálogo actualizado con éxito"
          : "Producto ingresado con éxito!",
      );
    } catch (error) {
      console.error(error);
      showToast("Error de sincronización al guardar", "error");
    }
  };

  // Implementación de lógica de ajuste rápido de stock (Chichita verde)
  const handleFastStockUpdate = async () => {
    if (!fastStockProduct || fastStockQuantity === 0) return;

    // Cálculo de stock real utilizando fallback de seguridad
    const currentStock =
      fastStockProduct.metadata?.initialStockImported !== undefined
        ? Number(fastStockProduct.metadata.initialStockImported)
        : Number(fastStockProduct.stock || 0);

    const newStock = currentStock + fastStockQuantity;

    // Prevención de saldos negativos
    if (newStock < 0) {
      showToast("El nivel de stock no puede ser negativo.", "error");
      return;
    }

    // Recálculo automático de semáforo de inventario
    let calculatedStatus = "optimal";
    if (newStock === 0) calculatedStatus = "out";
    else if (newStock <= 5) calculatedStatus = "critical";
    else if (newStock <= 15) calculatedStatus = "warning";

    // Conformación de payload actualizado
    const updatedProduct = {
      ...fastStockProduct,
      stock: newStock,
      status: calculatedStatus,
      metadata: {
        ...fastStockProduct.metadata,
        initialStockImported: newStock,
      },
    };

    try {
      const response = await fetch(
        `${API_URL}/products/${fastStockProduct.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(updatedProduct),
        },
      );

      if (!response.ok) throw new Error("Error en actualización");

      await fetchProducts();
      setFastStockProduct(null);
      setFastStockQuantity(0);
      showToast("Niveles de inventario ajustados correctamente.");
    } catch (error) {
      console.error(error);
      showToast("Error al procesar el ajuste de stock.", "error");
    }
  };

  // Manejo de petición de archivado lógico (Borrado individual)
  const handleDeleteProduct = async (id: string) => {
    try {
      await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirm(null);
      setSelectedIds((prev) => prev.filter((selId) => selId !== id));
      showToast("Producto archivado del catálogo.");
    } catch (error) {
      console.error(error);
      showToast("Error de comunicación al eliminar", "error");
    }
  };

  // Manejo de petición de archivado lógico por lotes (Borrado masivo)
  const handleBulkDelete = async () => {
    setIsLoading(true);
    setBulkDeleteConfirm(false);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`${API_URL}/products/${id}`, {
            method: "DELETE",
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          }),
        ),
      );
      setProducts((prev) =>
        prev.filter((p) => p.id && !selectedIds.includes(p.id)),
      );
      setSelectedIds([]);
      showToast(`${selectedIds.length} productos archivados.`);
    } catch (error) {
      console.error(error);
      showToast("Error en ejecución de borrado masivo.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Manejo de petición de purga completa de base de datos visual
  const handleDeleteAll = async () => {
    setIsLoading(true);
    setDeleteAllConfirm(false);
    try {
      const allIds = products.map((p) => p.id).filter(Boolean) as string[];
      await Promise.all(
        allIds.map((id) =>
          fetch(`${API_URL}/products/${id}`, {
            method: "DELETE",
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          }),
        ),
      );
      setProducts([]);
      setSelectedIds([]);
      setCurrentPage(1);
      showToast(`Catálogo vaciado. ${allIds.length} registros archivados.`);
    } catch (error) {
      console.error(error);
      showToast("Error crítico al vaciar catálogo.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Procesamiento de importación masiva mediante archivo Excel
  const handleExcelUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;
    setIsUploadingExcel(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch(`${API_URL}/products/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) throw new Error("Error en lectura de Excel");
      await fetchProducts();
      showToast("¡Inventario maestro importado exitosamente!");
    } catch (error) {
      console.error(error);
      showToast("Error estructural en el archivo importado.", "error");
    } finally {
      setIsUploadingExcel(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Construcción visual de semáforo de estados
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "optimal":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 shadow-sm border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircle size={10} className="mr-1" /> Óptimo
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 shadow-sm border border-amber-200 dark:border-amber-500/20">
            <AlertTriangle size={10} className="mr-1" /> Precaución
          </span>
        );
      case "critical":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 shadow-sm border border-red-200 dark:border-red-500/20">
            <ShieldAlert size={10} className="mr-1" /> Crítico
          </span>
        );
      case "out":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <Box size={10} className="mr-1" /> Sin Stock
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 shadow-sm border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircle size={10} className="mr-1" /> Óptimo
          </span>
        );
    }
  };

  // Ejecución del motor de filtrado cruzado en memoria
  const filteredProducts = products.filter((p) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (p.name && p.name.toLowerCase().includes(searchLower)) ||
      (p.sku && p.sku.toLowerCase().includes(searchLower)) ||
      (p.barcode && String(p.barcode).toLowerCase().includes(searchLower));

    const matchesCategory =
      filterCategory === "" || p.category === filterCategory;

    // Extracción de saldo real
    const realStock =
      p.metadata?.initialStockImported !== undefined
        ? Number(p.metadata.initialStockImported)
        : Number(p.stock || 0);

    // Inferencia de estado ante posibles nulos
    const computedStatus =
      p.status ||
      (realStock === 0
        ? "out"
        : realStock <= 5
          ? "critical"
          : realStock <= 15
            ? "warning"
            : "optimal");

    const matchesStatus =
      filterStatus === "" || computedStatus === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Cálculo de índices de paginación
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Manejo de eventos de selección múltiple (Checkbox All)
  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedProducts.map((p) => p.id as string));
    }
  };

  // Manejo de eventos de selección individual (Checkbox Row)
  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((selId) => selId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Renderizado principal del componente (Vista)
  return (
    <div className="relative min-h-full bg-[#F4F7F9] dark:bg-[#030712] p-4 md:p-6 lg:p-10 overflow-hidden transition-colors duration-700 w-full">
      {/* Decoración de fondo */}
      <div className="absolute top-[-10%] right-[-10%] w-[50rem] h-[50rem] bg-amber-400/10 dark:bg-brand/5 rounded-full blur-[150px] opacity-70 pointer-events-none"></div>

      {/* Input oculto para subida de archivos */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleExcelUpload}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* Renderizado de Centro de Notificaciones (Toasts) */}
      <div
        className={`fixed top-6 right-6 z-[200] transition-all duration-500 transform ${toast.show ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"}`}
      >
        <div
          className={`flex items-center space-x-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl ${toast.type === "success" ? "bg-emerald-50/90 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-red-50/90 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400"}`}
        >
          {toast.type === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <AlertTriangle size={20} />
          )}
          <span className="font-bold text-sm tracking-wide">{toast.msg}</span>
        </div>
      </div>

      {/* Renderizado de Modal: Ingreso Rápido de Stock */}
      {fastStockProduct && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setFastStockProduct(null)}
          />
          <div className="relative bg-white dark:bg-[#0a0f1c] rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-fade-in-up text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowUpCircle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1">
              Ajuste de Stock Rápido
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
              {fastStockProduct.name}
            </p>

            <div className="flex items-center justify-center space-x-6 mb-8">
              <button
                onClick={() => setFastStockQuantity((q) => q - 1)}
                className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
              >
                <MinusCircle size={28} />
              </button>
              <div className="text-center">
                <span className="block text-3xl font-black text-slate-800 dark:text-white">
                  {fastStockQuantity > 0
                    ? `+${fastStockQuantity}`
                    : fastStockQuantity}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Unidades a sumar/restar
                </span>
              </div>
              <button
                onClick={() => setFastStockQuantity((q) => q + 1)}
                className="p-3 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-full transition-colors"
              >
                <PlusCircle size={28} />
              </button>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setFastStockProduct(null);
                  setFastStockQuantity(0);
                }}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleFastStockUpdate}
                disabled={fastStockQuantity === 0}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-colors disabled:opacity-50"
              >
                Aplicar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renderizado de Modal: Confirmación de Borrado Individual */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-white dark:bg-[#0a0f1c] rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-fade-in-up text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">
              ¿Archivar Producto?
            </h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8">
              El producto será retirado del catálogo activo. El historial de
              ventas está a salvo.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirm)}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renderizado de Modal: Confirmación de Borrado Masivo */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setBulkDeleteConfirm(false)}
          />
          <div className="relative bg-white dark:bg-[#0a0f1c] rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-fade-in-up text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">
              ¿Archivar Masivamente?
            </h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8">
              Estás por archivar <strong>{selectedIds.length}</strong> productos
              del catálogo. Sus ventas históricas no se verán afectadas.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setBulkDeleteConfirm(false)}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30 transition-colors"
              >
                Confirmar ({selectedIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renderizado de Modal: Purgar Catálogo Completo */}
      {deleteAllConfirm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/80 dark:bg-black/80 backdrop-blur-md"
            onClick={() => setDeleteAllConfirm(false)}
          />
          <div className="relative bg-white dark:bg-[#0a0f1c] rounded-3xl p-8 max-w-md w-full shadow-2xl border border-red-100 dark:border-red-900/30 animate-fade-in-up text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertOctagon size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3">
              ¿VACIAR CATÁLOGO COMPLETO?
            </h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 px-4">
              Estás a punto de dar de baja <strong>{products.length}</strong>{" "}
              productos. Esta acción limpiará tu pantalla principal, pero el
              historial financiero permanecerá intacto en la base de datos.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteAllConfirm(false)}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar Acción
              </button>
              <button
                onClick={handleDeleteAll}
                className="flex-1 py-3.5 rounded-2xl font-black text-sm text-white bg-red-600 hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all transform hover:scale-105"
              >
                VACIAR AHORA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor Principal de la Interfaz */}
      <div className="relative z-10 max-w-[1400px] mx-auto w-full">
        {/* Renderizado de Cabecera Personalizada */}
        <CyberHeader
          phrases={phrases}
          labelIcon={Box}
          labelText="Gestor de Inventario"
          tags={tags}
        />

        {/* Panel de Herramientas de Control Superior */}
        <div
          className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "600ms" }}
        >
          {/* Motor de Búsqueda Textual */}
          <div className="relative w-full lg:w-2/5 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search
                size={18}
                className="text-slate-400 group-focus-within:text-brand transition-colors"
              />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-4 py-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-[1.25rem] text-sm font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all shadow-sm hover:shadow-md"
              placeholder="Buscar por producto, SKU o Código..."
            />
          </div>

          {/* Botonera de Acciones Globales */}
          <div className="flex w-full lg:w-auto flex-wrap sm:flex-nowrap gap-3">
            <button
              onClick={() => setDeleteAllConfirm(true)}
              disabled={products.length === 0 || isLoading}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-4 border border-red-200 dark:border-red-500/20 bg-red-50/80 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-sm rounded-[1.25rem] hover:bg-red-100 dark:hover:bg-red-500/20 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Vaciar Catálogo Completo"
            >
              <Trash2 size={18} />
              <span className="hidden sm:inline">Vaciar Todo</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-4 border text-sm font-bold rounded-[1.25rem] transition-all shadow-sm ${
                showFilters
                  ? "bg-slate-100 dark:bg-slate-800 border-brand text-brand"
                  : "bg-white/70 dark:bg-slate-800 border-slate-200/50 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-brand"
              }`}
            >
              <Filter size={18} />
              <span className="hidden sm:inline">
                {showFilters ? "Ocultar" : "Filtros"}
              </span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingExcel}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-4 bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm rounded-[1.25rem] hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all shadow-sm disabled:opacity-50"
            >
              {isUploadingExcel ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <FileSpreadsheet size={18} />
              )}
              <span className="hidden sm:inline">
                {isUploadingExcel ? "Importando..." : "Importar Excel"}
              </span>
            </button>
            <button
              onClick={() => {
                setProductToEdit(null);
                setIsModalOpen(true);
              }}
              className="flex-[2] sm:flex-none flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-brand to-amber-500 text-white font-black text-sm rounded-[1.25rem] hover:scale-105 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all duration-300"
            >
              <Plus size={20} strokeWidth={3} />
              <span>Nuevo Artículo</span>
            </button>
          </div>
        </div>

        {/* Panel de Control de Selección Múltiple */}
        {selectedIds.length > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-white dark:from-red-900/20 dark:to-[#0a0f1c] border border-red-200 dark:border-red-800/50 rounded-2xl flex items-center justify-between animate-fade-in-up shadow-sm">
            <span className="text-sm font-black text-red-700 dark:text-red-400 flex items-center">
              <CheckSquare size={18} className="mr-2" /> {selectedIds.length}{" "}
              seleccionados
            </span>
            <button
              onClick={() => setBulkDeleteConfirm(true)}
              className="flex items-center space-x-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-red-600/20"
            >
              <Trash2 size={16} />
              <span>Eliminar Selección</span>
            </button>
          </div>
        )}

        {/* Renderizado Condicional de Filtros Avanzados */}
        {showFilters && (
          <div className="mt-2 mb-6 p-6 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-[1.5rem] shadow-lg flex flex-col sm:flex-row gap-5 animate-fade-in-up">
            <div className="flex-1">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                Categoría
              </label>
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/50 cursor-pointer shadow-sm"
              >
                <option value="">Todas las categorías</option>
                <option value="Pinturas">Pinturas</option>
                <option value="Preparación">Preparación</option>
                <option value="Herramientas">Herramientas</option>
                <option value="Impermeabilizantes">Impermeabilizantes</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                Estado de Stock
              </label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/50 cursor-pointer shadow-sm"
              >
                <option value="">Todos los estados</option>
                <option value="optimal">Óptimo</option>
                <option value="warning">Precaución</option>
                <option value="critical">Crítico</option>
                <option value="out">Sin Stock</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterCategory("");
                  setFilterStatus("");
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                className="px-5 py-3.5 text-sm font-bold text-slate-500 hover:text-brand bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        )}

        {/* Estructura Principal de la Tabla de Datos */}
        <div
          className="w-full bg-white/80 dark:bg-[#0a0f1c]/80 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden opacity-0 animate-fade-in-up"
          style={{ animationDelay: "800ms" }}
        >
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              {/* Cabecera de la Tabla */}
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-5 text-center w-12">
                    <input
                      type="checkbox"
                      checked={
                        paginatedProducts.length > 0 &&
                        selectedIds.length === paginatedProducts.length
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand cursor-pointer"
                    />
                  </th>
                  <th className="px-2 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-16">
                    Img
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Identificación
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Nombre Comercial
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Precio Venta
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
                    Stock Físico
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">
                    Panel de Control
                  </th>
                </tr>
              </thead>

              {/* Cuerpo de la Tabla */}
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <Loader2
                        size={32}
                        className="animate-spin text-brand mx-auto mb-4"
                      />
                      <p className="text-sm font-bold text-slate-500">
                        Sincronizando base de datos...
                      </p>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <Box
                        size={48}
                        className="mx-auto text-slate-300 dark:text-slate-700 mb-4"
                      />
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                        La bóveda está vacía. Utilizá "Importar Excel" para
                        rellenar.
                      </p>
                    </td>
                  </tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-16 text-center text-slate-500 dark:text-slate-400 font-bold"
                    >
                      No hay coincidencias para tu búsqueda.
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => {
                    // Verificación robusta de niveles para el renderizado
                    const realStock =
                      product.metadata?.initialStockImported !== undefined
                        ? Number(product.metadata.initialStockImported)
                        : Number(product.stock || 0);

                    const currentStatus =
                      product.status ||
                      (realStock === 0
                        ? "out"
                        : realStock <= 5
                          ? "critical"
                          : realStock <= 15
                            ? "warning"
                            : "optimal");

                    return (
                      <tr
                        key={product.id || product.sku}
                        className={`transition-all duration-300 group ${
                          selectedIds.includes(product.id as string)
                            ? "bg-amber-50/50 dark:bg-brand/10"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                        }`}
                      >
                        <td className="px-6 py-5 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(product.id as string)}
                            onChange={() => toggleSelect(product.id as string)}
                            className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand cursor-pointer"
                          />
                        </td>

                        {/* Corrección Arquitectónica: Manejo seguro de array de imágenes */}
                        <td className="px-2 py-5 whitespace-nowrap">
                          <div className="w-12 h-12 rounded-[1rem] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <ImageIcon
                                size={18}
                                className="text-slate-400 opacity-50"
                              />
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-800 dark:text-white mb-1 tracking-wide">
                              {product.sku}
                            </span>
                            <div className="flex items-center text-[10px] font-bold text-slate-400">
                              <Barcode size={10} className="mr-1 opacity-70" />{" "}
                              {product.barcode || "Sin Código"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-brand transition-colors">
                            {product.name}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                            ${" "}
                            {Number(
                              product.retailPrice || product.price || 0,
                            ).toLocaleString("es-AR")}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-black text-slate-800 dark:text-white mb-1.5">
                              {realStock}{" "}
                              <span className="text-[10px] text-slate-400 font-bold uppercase">
                                un.
                              </span>
                            </span>
                            {getStatusBadge(currentStatus)}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-right">
                          <div className="flex justify-end items-center space-x-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            {/* Disparador de Ajuste Rápido de Stock */}
                            <button
                              onClick={() =>
                                setFastStockProduct({
                                  ...product,
                                  stock: realStock,
                                })
                              }
                              className="p-2.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-colors tooltip"
                              title="Ajuste Rápido de Stock"
                            >
                              <ArrowUpCircle size={18} strokeWidth={2.5} />
                            </button>
                            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                            {/* Visualizador de Detalles */}
                            <button
                              onClick={() => {
                                setProductToView({
                                  ...product,
                                  stock: realStock,
                                });
                                setIsViewModalOpen(true);
                              }}
                              className="p-2.5 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-xl transition-colors"
                            >
                              <Eye size={18} />
                            </button>

                            {/* Disparador de Edición */}
                            <button
                              onClick={() => {
                                setProductToEdit({
                                  ...product,
                                  stock: realStock,
                                });
                                setIsModalOpen(true);
                              }}
                              className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors"
                            >
                              <Edit3 size={18} />
                            </button>

                            {/* Disparador de Borrado */}
                            <button
                              onClick={() => setDeleteConfirm(product.id!)}
                              className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Controlador de Paginación */}
          <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#050810]/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Mostrando{" "}
              {(currentPage - 1) * itemsPerPage +
                (filteredProducts.length > 0 ? 1 : 0)}{" "}
              - {Math.min(currentPage * itemsPerPage, filteredProducts.length)}{" "}
              de {filteredProducts.length} regs.
            </span>
            <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30"
              >
                Anterior
              </button>
              <div className="px-4 py-2 text-xs font-black bg-brand text-white rounded-lg shadow-inner">
                Pág. {currentPage}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Montaje de Modales Subordinados */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
      />
      <ProductViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setProductToView(null);
        }}
        product={productToView}
      />
    </div>
  );
};
