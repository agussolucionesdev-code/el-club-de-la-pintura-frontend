import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  CheckCircle,
  AlertOctagon,
  CheckSquare,
  Filter,
} from "lucide-react";

import { CyberHeader } from "../../../shared/components/CyberHeader";
import { ProductModal } from "../components/ProductModal";
import { ProductViewModal } from "../components/ProductViewModal";
import { neuroToast } from "../../../shared/utils/neuroToast";
import { useSearchParams } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000/api";

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  brand: string;
  costPrice: number;
  profitMargin?: number;
  ivaPercentage?: number;
  retailPrice: number;
  imageUrl?: string;
}

export const ProductsPage = () => {
  const token = localStorage.getItem("club_token");
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // 🛡️ ESTADOS DE FILTROS AVANZADOS
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedBrand, setSelectedBrand] = useState(
    searchParams.get("brand") || "ALL",
  );

  // 🛡️ ESTADOS PARA EDICIÓN RÁPIDA (INLINE EDITING)
  const [editingMarginId, setEditingMarginId] = useState<number | null>(null);
  const [tempMarginValue, setTempMarginValue] = useState<string>("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/products?limit=2000`, {
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
      console.error(error);
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

  // =======================================================
  // 🛡️ MOTOR DE EDICIÓN RÁPIDA (DOBLE CLIC)
  // =======================================================
  const handleMarginDoubleClick = (p: Product) => {
    setEditingMarginId(p.id);
    setTempMarginValue(String(p.profitMargin || 0));
  };

  const handleQuickMarginSave = async (p: Product) => {
    setEditingMarginId(null);
    const newMargin = Number(tempMarginValue);

    if (
      newMargin === (p.profitMargin || 0) ||
      newMargin <= 0 ||
      isNaN(newMargin)
    )
      return;

    const cost = Number(p.costPrice) || 0;
    const iva = Number(p.ivaPercentage) || 21;
    const newRetailPrice = Math.round(
      cost * (1 + newMargin / 100) * (1 + iva / 100),
    );

    setProducts((prev) =>
      prev.map((prod) =>
        prod.id === p.id
          ? { ...prod, profitMargin: newMargin, retailPrice: newRetailPrice }
          : prod,
      ),
    );

    try {
      const response = await fetch(`${API_URL}/products/${p.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profitMargin: newMargin,
          retailPrice: newRetailPrice,
        }),
      });
      if (!response.ok) throw new Error();
      neuroToast(
        "Margen Actualizado",
        "success",
        `Nuevo precio público: $${newRetailPrice.toLocaleString("es-AR")}`,
      );
    } catch (error) {
      console.error(error);
      neuroToast(
        "Error de Guardado",
        "error",
        "No se pudo actualizar el margen en el servidor. Refrescando...",
      );
      fetchProducts();
    }
  };

  // =======================================================
  // FUNCIONES CRUD ESTÁNDAR
  // =======================================================
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
      console.error(error);
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
      console.error(error);
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
      console.error(error);
      neuroToast(
        "Error Crítico",
        "error",
        "Fallo al intentar vaciar el sistema.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =======================================================
  // 🛡️ MOTOR DE FILTROS AVANZADOS
  // =======================================================
  const uniqueCategories = Array.from(new Set(products.map((p) => p.category)))
    .filter(Boolean)
    .sort();
  const uniqueBrands = Array.from(new Set(products.map((p) => p.brand)))
    .filter(Boolean)
    .sort();

  const filteredProducts = products.filter((p) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(s) ||
      p.sku.toLowerCase().includes(s) ||
      p.barcode?.toLowerCase().includes(s);

    const matchesCategory =
      selectedCategory === "ALL" || p.category === selectedCategory;
    const matchesBrand = selectedBrand === "ALL" || p.brand === selectedBrand;

    return matchesSearch && matchesCategory && matchesBrand;
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
  const categoriesCount = uniqueCategories.length;

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

        <div className="flex flex-col xl:flex-row items-center justify-between space-y-4 xl:space-y-0 xl:space-x-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-3 shadow-sm transition-all duration-300">
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
            <div className="flex-1 w-full flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Buscar por Nombre, SKU o Código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 pl-11 pr-4 py-3 rounded-2xl text-sm font-bold text-slate-700 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                />
              </div>

              <div className="relative md:w-56 shrink-0">
                <Filter
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 pl-11 pr-4 py-3 rounded-2xl text-sm font-bold text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/50 appearance-none cursor-pointer truncate"
                >
                  <option value="ALL">Todas las Categorías</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative md:w-56 shrink-0">
                <Package
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
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
          )}

          <div className="flex items-center justify-end space-x-2 w-full xl:w-auto shrink-0 mt-4 xl:mt-0">
            {products.length > 0 && (
              <button
                onClick={handleEmptyCatalog}
                className="flex items-center justify-center p-3 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl transition-colors border border-red-200 dark:border-red-500/20"
                title="Vaciar todo el Catálogo"
              >
                <AlertOctagon size={18} />
              </button>
            )}
            {/* 🛡️ El botón de "Importar Tarifas" fue removido de acá. Ahora vive en PriceListsPage */}
            <button
              onClick={() => {
                setSelectedProduct(null);
                setIsModalOpen(true);
              }}
              className="flex items-center space-x-2 px-6 py-3 bg-brand hover:bg-amber-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-brand/30"
            >
              <Plus size={18} />{" "}
              <span className="hidden sm:inline">Nuevo Artículo</span>
            </button>
          </div>
        </div>

        {/* TABLA PRINCIPAL */}
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
                  <th className="p-6">Categoría / SKU</th>
                  <th className="p-6 text-right">Costo Base</th>
                  <th className="p-6 text-center">Rentabilidad</th>
                  <th className="p-6 text-right">Pcio. Final (Público)</th>
                  <th className="p-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center">
                      <Loader2
                        className="animate-spin mx-auto text-brand"
                        size={32}
                      />
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs"
                    >
                      Catálogo vacío o sin coincidencias de filtros.
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
                          <p
                            className="font-bold text-slate-800 dark:text-white leading-tight max-w-[280px] truncate"
                            title={p.name}
                          >
                            {p.name}
                          </p>
                          <p className="text-[10px] font-black uppercase text-slate-400 mt-1 truncate max-w-[200px]">
                            {p.brand || "Sin Marca"}
                          </p>
                        </div>
                      </td>

                      <td className="p-6">
                        <span
                          className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 text-[9px] uppercase font-black px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 block w-max mb-1 truncate max-w-[150px]"
                          title={p.category}
                        >
                          {p.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {p.sku}
                        </span>
                      </td>

                      <td className="p-6 text-right font-bold text-slate-600 dark:text-slate-300">
                        ${Number(p.costPrice || 0).toLocaleString("es-AR")}
                      </td>

                      <td className="p-6 text-center">
                        {editingMarginId === p.id ? (
                          <div className="flex flex-col items-center animate-fade-in">
                            <input
                              type="number"
                              autoFocus
                              value={tempMarginValue}
                              onChange={(e) =>
                                setTempMarginValue(e.target.value)
                              }
                              onBlur={() => handleQuickMarginSave(p)}
                              onKeyDown={(e) =>
                                e.key === "Enter" && handleQuickMarginSave(p)
                              }
                              className="w-16 bg-white dark:bg-slate-900 border-2 border-brand text-brand font-black text-center py-1 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 shadow-lg"
                            />
                            <span className="text-[8px] text-brand font-bold uppercase mt-1">
                              Enter p/ Guardar
                            </span>
                          </div>
                        ) : (
                          <div
                            onDoubleClick={() => handleMarginDoubleClick(p)}
                            className="flex flex-col items-center justify-center cursor-pointer group/edit p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Doble clic para editar margen rápidamente"
                          >
                            <span className="font-black text-blue-600 dark:text-blue-400 text-sm flex items-center">
                              {p.profitMargin || 0}%
                              <Edit
                                size={10}
                                className="ml-1 opacity-0 group-hover/edit:opacity-100 transition-opacity text-brand"
                              />
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                              + IVA {p.ivaPercentage || 21}%
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="p-6 text-right">
                        <span className="text-xl font-black text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                          ${Number(p.retailPrice || 0).toLocaleString("es-AR")}
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
                            title="Ver Radiografía Completa"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-xl transition-all"
                            title="Editar Datos"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                            title="Eliminar"
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

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={
          selectedProduct
            ? { ...selectedProduct, id: String(selectedProduct.id), stock: 0 }
            : null
        }
        onSave={async (productData) => {
          try {
            const isEditing = !!selectedProduct;
            const url = isEditing
              ? `${API_URL}/products/${selectedProduct.id}`
              : `${API_URL}/products`;
            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
              method,
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(productData),
            });

            const result = await response.json();

            if (!response.ok) {
              throw new Error(
                result.error || "Fallo en el servidor al guardar.",
              );
            }

            neuroToast(
              isEditing ? "Catálogo Actualizado" : "Nuevo Artículo Ingresado",
              "success",
              "Los cambios impactaron en la base de datos.",
            );

            setIsModalOpen(false);
            fetchProducts();
          } catch (error: unknown) {
            console.error("Error en onSave:", error);
            const msg =
              error instanceof Error
                ? error.message
                : "Fallo de conexión con el servidor.";
            neuroToast("Error de Guardado", "error", msg);
          }
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
