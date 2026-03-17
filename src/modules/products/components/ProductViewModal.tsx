// Importación de dependencias de React
import { useState, useEffect } from "react";
// Importación de iconografía estricta
import {
  X,
  Package,
  Hash,
  DollarSign,
  Layers,
  Activity,
  FileText,
  Building2,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  Image as ImageIcon,
} from "lucide-react";

// Definición de interfaz en espejo con ProductModal
export interface Product {
  id?: string;
  sku?: string;
  barcode?: string;
  name: string;
  brand?: string;
  category: string;
  costPrice?: number;
  ivaPercentage?: number;
  profitMargin?: number;
  retailPrice?: number;
  price?: number;
  stock?: number;
  status?: string;
  description?: string;
  supplier?: string;
  supplierId?: number;
  // Corrección: Adaptación a tipo Array
  images?: string[];
  color?: string;
  metadata?: { initialStockImported?: number; [key: string]: unknown };
}

interface ProductViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const ProductViewModal = ({
  isOpen,
  onClose,
  product,
}: ProductViewModalProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Ejecución de animaciones de entrada
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Manejo de cierre con retraso para animaciones de salida
  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 300);
  };

  // Prevención de renderizado en estado nulo
  if (!isOpen && !isAnimating) return null;
  if (!product) return null;

  // Renderizado dinámico de etiquetas de estado
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "optimal":
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircle size={14} className="mr-2" /> Óptimo
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
            <AlertTriangle size={14} className="mr-2" /> Precaución
          </span>
        );
      case "critical":
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-bold bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20">
            <ShieldAlert size={14} className="mr-2" /> Crítico
          </span>
        );
      case "out":
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-bold bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400 border border-slate-200 dark:border-slate-500/30">
            <Package size={14} className="mr-2" /> Sin Stock
          </span>
        );
      default:
        return null;
    }
  };

  // Asignación de fallbacks para evitar nulos en pantalla
  const displayPrice = product.retailPrice || product.price || 0;
  const displayStatus = product.status || "optimal";

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
      {/* Construcción de fondo desenfocado */}
      <div
        className={`absolute inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isAnimating && isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
      />

      {/* Renderizado del contenedor central */}
      <div
        className={`relative w-full max-w-2xl bg-white dark:bg-[#0a0f1c] rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col max-h-[95vh] border border-slate-100 dark:border-slate-800 transition-all duration-300 ease-out transform ${isAnimating && isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-8 opacity-0 scale-95"}`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#050810] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Package size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                Detalles del Producto
              </h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                Radiografía de Inventario
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar bg-white dark:bg-transparent">
          <div className="flex flex-col space-y-6">
            {/* Visualización de Cabecera e Imagen */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              {/* Corrección Arquitectónica: Renderizado de Imagen desde Array */}
              <div className="w-24 h-24 shrink-0 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-sm">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon
                    size={32}
                    className="text-slate-300 dark:text-slate-600"
                  />
                )}
              </div>

              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white leading-tight mb-3">
                  {product.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <Hash size={12} className="mr-1" /> {product.sku}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-brand/10 text-brand border border-brand/20">
                    <Layers size={12} className="mr-1" /> {product.category}
                  </span>
                </div>
              </div>
              <div className="shrink-0">{getStatusBadge(displayStatus)}</div>
            </div>

            {/* Panel de Métricas Rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2 mb-2 text-slate-500 dark:text-slate-400">
                  <DollarSign size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Precio
                  </span>
                </div>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  $ {Number(displayPrice).toLocaleString("es-AR")}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2 mb-2 text-slate-500 dark:text-slate-400">
                  <Activity size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Stock Actual
                  </span>
                </div>
                <p className="text-xl font-black text-slate-800 dark:text-white">
                  {product.stock}{" "}
                  <span className="text-sm font-bold text-slate-400">
                    unidades
                  </span>
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 col-span-2 md:col-span-1">
                <div className="flex items-center space-x-2 mb-2 text-slate-500 dark:text-slate-400">
                  <Building2 size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Proveedor/Marca
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                  {product.supplier || product.brand || "No especificado"}
                </p>
              </div>
            </div>

            {/* Panel de Ficha Técnica */}
            <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-slate-900/30 border border-amber-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 mb-3 text-amber-600 dark:text-brand">
                <FileText size={18} />
                <span className="text-xs font-black uppercase tracking-widest">
                  Descripción del Producto
                </span>
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {product.description ||
                  "Este producto no tiene una descripción cargada en la base de datos."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
