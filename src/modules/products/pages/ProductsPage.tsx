import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  CheckCircle,
  FileSpreadsheet,
  Info,
  TableProperties,
  X,
  AlertOctagon,
  CheckSquare,
} from "lucide-react";

import { CyberHeader } from "../../../shared/components/CyberHeader";
import { ProductModal } from "../components/ProductModal";
import { ProductViewModal } from "../components/ProductViewModal";
// IMPORTAMOS EL MOTOR NEURO-VOCAL GLOBAL
import { neuroToast } from "../../../shared/utils/neuroToast";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000/api";

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  brand: string;
  costPrice: number;
  retailPrice: number;
  imageUrl?: string;
}

export const ProductsPage = () => {
  const token = localStorage.getItem("club_token");

  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/products?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (response.ok) {
        setProducts(
          Array.isArray(result.data)
            ? result.data
            : Array.isArray(result)
              ? result
              : [],
        );
        setSelectedIds([]);
      } else {
        throw new Error(result.error || "Fallo en lectura de catálogo");
      }
    } catch (error: unknown) {
      console.log(error);
      neuroToast(
        "Error de sincronización",
        "error",
        "No se pudo leer el catálogo de productos.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDeleteProduct = async (id: number) => {
    if (
      !window.confirm(
        "¿Confirmás la eliminación de este producto? (Se archivará)",
      )
    )
      return;
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        neuroToast(
          "Producto Eliminado",
          "success",
          "El producto fue removido del catálogo.",
        );
        fetchProducts();
      } else {
        throw new Error("No se pudo eliminar el producto");
      }
    } catch (error: unknown) {
      console.log(error);

      neuroToast("Error al eliminar", "error", "No se pudo procesar la baja.");
    }
  };

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `¿Estás seguro de eliminar los ${selectedIds.length} productos seleccionados?`,
      )
    )
      return;
    setIsLoading(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`${API_URL}/products/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }),
        ),
      );
      neuroToast(
        "Selección Eliminada",
        "success",
        "Los productos fueron eliminados en bloque.",
      );
      fetchProducts();
    } catch (error) {
      console.log(error);

      neuroToast(
        "Error en lote",
        "error",
        "Hubo un problema procesando la eliminación masiva.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmptyCatalog = async () => {
    if (products.length === 0)
      return neuroToast("El catálogo ya está vacío", "warning");

    const securityCheck = window.prompt(
      `⚠️ ALERTA DE SEGURIDAD ⚠️\n\nEstás a punto de vaciar TODO el catálogo (${products.length} productos).\n\nPara continuar, escribe la palabra: VACIAR`,
    );

    if (securityCheck !== "VACIAR") {
      return neuroToast(
        "Acción Cancelada",
        "warning",
        "Vaciado cancelado por seguridad.",
      );
    }

    setIsLoading(true);
    try {
      const allIds = products.map((p) => p.id);
      await Promise.all(
        allIds.map((id) =>
          fetch(`${API_URL}/products/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }),
        ),
      );
      neuroToast(
        "Catálogo Vaciado",
        "success",
        "La base de datos ha sido reseteada por completo.",
      );
      fetchProducts();
    } catch (error) {
      console.log(error);

      neuroToast(
        "Error Crítico",
        "error",
        "Fallo al intentar vaciar el sistema.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/products/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Fallo estructural en la importación");

      neuroToast(
        "Importación Exitosa",
        "success",
        `Se importaron ${result.importedCount || "múltiples"} productos correctamente.`,
      );
      fetchProducts();
    } catch (error: unknown) {
      console.log(error);

      neuroToast(
        "Error de Excel",
        "error",
        "Revise el formato del archivo subido.",
      );
      setShowFormatModal(true);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const filteredProducts = products.filter((p) => {
    const s = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(s) ||
      p.sku.toLowerCase().includes(s) ||
      p.category.toLowerCase().includes(s) ||
      p.barcode?.toLowerCase().includes(s)
    );
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(filteredProducts.map((p) => p.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const totalProducts = products.length;
  const categoriesCount = new Set(products.map((p) => p.category)).size;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#030712] p-4 flex flex-col transition-colors duration-700">
      <div className="max-w-[1700px] mx-auto w-full flex-1 flex flex-col space-y-6">
        <CyberHeader
          phrases={[
            "Gestión de Catálogo Maestro",
            "Administración de Precios y SKUs",
          ]}
          labelIcon={Package}
          labelText="Catálogo de Productos"
          tags={[
            {
              text: `TOTAL PRODUCTOS: ${totalProducts}`,
              icon: Package,
              delay: "text-brand",
            },
            {
              text: `CATEGORÍAS ÚNICAS: ${categoriesCount}`,
              icon: CheckCircle,
              delay: "text-emerald-500",
            },
          ]}
        />

        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-3 shadow-sm transition-all duration-300">
          {selectedIds.length > 0 ? (
            <div className="flex-1 w-full flex items-center justify-between px-4 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl animate-fade-in">
              <div className="flex items-center space-x-3 text-red-600 dark:text-red-400">
                <CheckSquare size={20} />
                <span className="font-black text-sm">
                  {selectedIds.length} productos seleccionados
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black shadow-lg shadow-red-500/30 transition-all"
                >
                  <Trash2 size={14} /> <span>Eliminar Selección</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="relative flex-1 w-full">
              <Search
                className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Buscar por Nombre, SKU o Código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent pl-14 pr-4 py-3 font-bold text-slate-700 dark:text-white placeholder-slate-400 focus:outline-none"
              />
            </div>
          )}

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              ref={fileInputRef}
              onChange={handleExcelUpload}
              className="hidden"
            />
            <button
              onClick={() => setShowFormatModal(true)}
              className="p-3 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl transition-colors"
              title="Ver formato Excel"
            >
              <Info size={20} />
            </button>
            {products.length > 0 && (
              <button
                onClick={handleEmptyCatalog}
                className="flex items-center justify-center p-3 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl transition-colors border border-red-200 dark:border-red-500/20"
                title="Vaciar todo el Catálogo"
              >
                <AlertOctagon size={20} />
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-2xl font-black text-sm transition-colors border border-slate-200 dark:border-slate-700"
            >
              <FileSpreadsheet size={18} className="text-emerald-500" />{" "}
              <span className="hidden sm:inline">Importar</span>
            </button>
            <button
              onClick={() => {
                setSelectedProduct(null);
                setIsModalOpen(true);
              }}
              className="flex items-center space-x-2 px-6 py-3 bg-brand hover:bg-amber-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-brand/30"
            >
              <Plus size={18} /> <span className="hidden sm:inline">Nuevo</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-xl overflow-hidden flex-1 flex flex-col transition-all duration-300">
          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-200 dark:border-slate-800">
                  <th className="p-6 w-12 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand cursor-pointer"
                      checked={
                        filteredProducts.length > 0 &&
                        selectedIds.length === filteredProducts.length
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="p-6">Identidad Comercial</th>
                  <th className="p-6">SKU / EAN</th>
                  <th className="p-6">Clasificación</th>
                  <th className="p-6 text-right">Precio Venta</th>
                  <th className="p-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center">
                      <Loader2
                        className="animate-spin mx-auto text-brand"
                        size={32}
                      />
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs"
                    >
                      Catálogo vacío o sin coincidencias.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr
                      key={p.id}
                      className={`transition-colors group ${selectedIds.includes(p.id) ? "bg-brand/5 dark:bg-brand/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/20"}`}
                    >
                      <td className="p-6 w-12 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand cursor-pointer"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => handleSelectOne(p.id)}
                        />
                      </td>
                      <td className="p-6 flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
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
                            {p.name}
                          </p>
                          <p className="text-[10px] font-black uppercase text-slate-400 mt-1">
                            {p.brand || "Sin Marca"}
                          </p>
                        </div>
                      </td>
                      <td className="p-6">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg inline-block border border-slate-200 dark:border-slate-800">
                          {p.sku}
                        </p>
                      </td>
                      <td className="p-6">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 text-[9px] uppercase font-black px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-500">
                          ${p.retailPrice.toLocaleString("es-AR")}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              setIsViewModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-xl transition-all"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showFormatModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
            <div className="p-6 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/50 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-500 text-white rounded-xl">
                  <TableProperties size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-white">
                    Formato Requerido (Excel)
                  </h2>
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1">
                    Estructura para Importación
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFormatModal(false)}
                className="p-2 text-slate-400 hover:text-red-500 bg-white dark:bg-slate-900 rounded-xl"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50 dark:bg-transparent">
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mb-4">
                El archivo debe contener los siguientes encabezados en la
                primera fila:
              </p>
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-200 dark:border-slate-700">
                      <th className="p-4">Columna</th>
                      <th className="p-4">Requisito</th>
                      <th className="p-4">Descripción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-medium text-slate-700 dark:text-slate-300">
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                      <td className="p-4 font-black text-brand">SKU</td>
                      <td className="p-4">Obligatorio</td>
                      <td className="p-4">Código interno</td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                      <td className="p-4 font-black text-brand">NAME</td>
                      <td className="p-4">Obligatorio</td>
                      <td className="p-4">Nombre del producto</td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                      <td className="p-4 font-black text-emerald-600">
                        COST_PRICE
                      </td>
                      <td className="p-4">Obligatorio</td>
                      <td className="p-4">Precio de costo</td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                      <td className="p-4 font-black text-emerald-600">
                        RETAIL_PRICE
                      </td>
                      <td className="p-4">Obligatorio</td>
                      <td className="p-4">Precio Venta Público</td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                      <td className="p-4 font-black text-blue-600">STOCK</td>
                      <td className="p-4">Opcional</td>
                      <td className="p-4">Cantidad física inicial</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end shrink-0">
              <button
                onClick={() => setShowFormatModal(false)}
                className="px-8 py-3 bg-brand text-white font-black text-sm rounded-2xl shadow-lg shadow-brand/30 hover:scale-105 transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={
          selectedProduct
            ? { ...selectedProduct, id: String(selectedProduct.id), stock: 0 }
            : null
        }
        onSave={async () => {
          setIsModalOpen(false);
          fetchProducts();
        }}
      />
      <ProductViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        product={
          selectedProduct
            ? { ...selectedProduct, id: String(selectedProduct.id), stock: 0 }
            : null
        }
      />
    </div>
  );
};
