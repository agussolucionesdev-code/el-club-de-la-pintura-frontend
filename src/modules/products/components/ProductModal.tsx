// Importación de dependencias de React
import React, { useState, useEffect, useRef } from "react";
// Importación de iconografía completa (Lucide React)
import {
  X,
  Save,
  PaintBucket,
  Hash,
  DollarSign,
  Layers,
  Activity,
  Box,
  Loader2,
  FileText,
  Building2,
  Image as ImageIcon,
  UploadCloud,
  Percent,
  Calculator,
  Barcode,
} from "lucide-react";

// Definición de interfaz estructural del Producto (Sincronizada con Prisma Backend)
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
  stock: number;
  status?: string;
  description?: string;
  supplier?: string;
  supplierId?: number;
  // Corrección Arquitectónica: Adaptación a Array de strings para soporte DB
  images?: string[];
  color?: string;
  metadata?: { initialStockImported?: number; [key: string]: unknown };
}

// Definición de propiedades del componente modal
interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSave: (product: Product) => Promise<void>;
}

// Extracción de variables de entorno para conexión a API
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000/api";

export const ProductModal = ({
  isOpen,
  onClose,
  productToEdit,
  onSave,
}: ProductModalProps) => {
  // Obtención de credenciales de seguridad (Token)
  const token = localStorage.getItem("club_token");

  // Inicialización de estados de interfaz de usuario
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImg, setIsUploadingImg] = useState(false);

  // Asignación de referencias del DOM
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uniqueIdRef = useRef<string>("");

  // Configuración del estado central del formulario
  const [formData, setFormData] = useState<Product>({
    name: "",
    brand: "",
    category: "",
    costPrice: 0,
    ivaPercentage: 21,
    profitMargin: 30,
    retailPrice: 0,
    stock: 0,
    status: "optimal",
    description: "",
    images: [], // Inicialización estricta como Array
    barcode: "",
    sku: "",
  });

  // Ejecución de ciclo de vida para apertura del modal y carga de datos
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsAnimating(true), 10);

      if (productToEdit) {
        // Validación de stock real basado en metadatos o fallback a stock estándar
        const realStock =
          productToEdit.metadata?.initialStockImported !== undefined
            ? Number(productToEdit.metadata.initialStockImported)
            : Number(productToEdit.stock || 0);

        setFormData({
          ...productToEdit,
          stock: realStock,
          profitMargin: productToEdit.profitMargin || 30,
          images: productToEdit.images || [], // Garantía de tipo Array
        });
      } else {
        // Generación de identificador único temporal para nuevos ingresos
        uniqueIdRef.current = Math.floor(
          1000 + Math.random() * 9000,
        ).toString();

        // Limpieza de formulario
        setFormData({
          name: "",
          brand: "",
          category: "",
          costPrice: 0,
          ivaPercentage: 21,
          profitMargin: 30,
          retailPrice: 0,
          stock: 0,
          status: "optimal",
          description: "",
          images: [],
          barcode: "",
          sku: "",
        });
      }
      return () => clearTimeout(timer);
    }
  }, [isOpen, productToEdit]);

  // Manejo del cierre del modal con animaciones sincronizadas
  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 300);
  };

  // Captura de eventos de entrada en campos del formulario
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Implementación de motor de generación automática de SKU
  const { name, category } = formData;
  useEffect(() => {
    if (!productToEdit && name && category) {
      const catCode = category.substring(0, 3).toUpperCase();
      const stopWords = [
        "DE",
        "PARA",
        "EL",
        "LA",
        "LOS",
        "LAS",
        "Y",
        "EN",
        "CON",
        "AL",
      ];
      const words = name
        .toUpperCase()
        .split(" ")
        .filter((w) => !stopWords.includes(w) && w.length > 2);
      const nameCode =
        words.length > 0
          ? words[0].substring(0, 4)
          : name.substring(0, 4).toUpperCase();

      setFormData((prev) => ({
        ...prev,
        sku: `${catCode}-${nameCode}-${uniqueIdRef.current}`.toUpperCase(),
      }));
    }
  }, [name, category, productToEdit]);

  // Implementación de cálculo automático de rentabilidad financiera
  useEffect(() => {
    if (
      formData.costPrice !== undefined &&
      formData.profitMargin !== undefined &&
      formData.ivaPercentage !== undefined
    ) {
      const cost = Number(formData.costPrice) || 0;
      const margin = Number(formData.profitMargin) || 0;
      const iva = Number(formData.ivaPercentage) || 0;
      const finalPrice = cost * (1 + margin / 100) * (1 + iva / 100);
      setFormData((prev) => ({ ...prev, retailPrice: Math.round(finalPrice) }));
    }
  }, [formData.costPrice, formData.profitMargin, formData.ivaPercentage]);

  // Procesamiento y subida de imagen al servidor (Cloudinary)
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!token) {
      alert("Error de autenticación: El token es nulo o expiró.");
      return;
    }

    setIsUploadingImg(true);
    const imgData = new FormData();
    imgData.append("image", file);

    try {
      // Petición HTTP para transferencia de archivo binario
      const response = await fetch(`${API_URL}/products/upload-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: imgData,
      });

      if (!response.ok) throw new Error("Error al subir imagen");
      const result = await response.json();

      // Inserción de la URL generada dentro del Array de imágenes
      setFormData((prev) => ({
        ...prev,
        images: result.imageUrl ? [result.imageUrl] : [],
      }));
    } catch (error) {
      console.error(error);
      alert("Hubo un problema al subir la imagen a Cloudinary.");
    } finally {
      setIsUploadingImg(false);
    }
  };

  // Verificación de validez estructural del formulario
  const isFormValid =
    formData.name.length > 2 &&
    formData.category !== "" &&
    (formData.retailPrice || 0) > 0 &&
    formData.stock >= 0;

  // Ejecución del guardado o actualización en base de datos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setIsSubmitting(true);

    let calculatedStatus = "optimal";
    const stockNum = Number(formData.stock);
    if (stockNum === 0) calculatedStatus = "out";
    else if (stockNum <= 5) calculatedStatus = "critical";
    else if (stockNum <= 15) calculatedStatus = "warning";

    // Conformación del Payload final alineado al Backend
    const finalProduct = {
      ...formData,
      price: formData.retailPrice,
      retailPrice: Number(formData.retailPrice),
      costPrice: Number(formData.costPrice),
      stock: stockNum,
      status: calculatedStatus,
      metadata: { initialStockImported: stockNum },
    };

    try {
      await onSave(finalProduct);
      handleClose();
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderizado condicional basado en estado de animación
  if (!isOpen && !isAnimating) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      {/* Construcción de la capa de desenfoque de fondo */}
      <div
        className={`absolute inset-0 bg-slate-900/70 dark:bg-black/80 backdrop-blur-md transition-opacity duration-300 ${isAnimating && isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
      />

      {/* Construcción del contenedor principal del Modal */}
      <div
        className={`relative w-full max-w-4xl bg-white dark:bg-[#0a0f1c] rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] transition-all duration-300 ease-out transform ${isAnimating && isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-8 opacity-0 scale-95"}`}
      >
        {/* Renderizado de la cabecera del Modal */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-slate-50 to-white dark:from-[#050810] dark:to-[#0a0f1c] shrink-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-brand to-amber-400 text-white rounded-2xl shadow-lg shadow-brand/20">
              <PaintBucket size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                {productToEdit ? "Editar Artículo" : "Nuevo Artículo"}
              </h2>
              <p className="text-xs font-bold text-brand uppercase tracking-widest mt-1">
                {productToEdit
                  ? `Actualizando Base de Datos`
                  : `Ingreso al Catálogo Central`}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Renderizado del formulario principal */}
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden flex flex-col flex-1"
        >
          <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar bg-slate-50/30 dark:bg-transparent">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Columna Izquierda: Fotografías y Códigos */}
              <div className="col-span-1 space-y-6">
                <div>
                  <label className="flex text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                    Fotografía
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full aspect-square rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group ${formData.images && formData.images.length > 0 ? "border-transparent bg-slate-100 dark:bg-slate-900" : "border-slate-200 dark:border-slate-800 hover:border-brand hover:bg-brand/5"}`}
                  >
                    {isUploadingImg ? (
                      <Loader2 size={32} className="animate-spin text-brand" />
                    ) : formData.images && formData.images.length > 0 ? (
                      <>
                        {/* Extracción segura de la primera imagen del array */}
                        <img
                          src={formData.images[0]}
                          alt="Preview"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                          <UploadCloud size={32} className="text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-slate-400 group-hover:text-brand transition-colors">
                        <ImageIcon
                          size={48}
                          strokeWidth={1}
                          className="mb-3 opacity-50"
                        />
                        <span className="text-xs font-bold">Subir foto</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <div className="group">
                  <label className="flex text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                    SKU Generado
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Hash size={18} />
                    </div>
                    <input
                      disabled
                      name="sku"
                      value={formData.sku || ""}
                      type="text"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-black text-slate-500 cursor-not-allowed transition-all uppercase"
                      placeholder="AUTOMÁTICO..."
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="flex text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                    Cód. Barras
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand transition-colors">
                      <Barcode size={18} />
                    </div>
                    <input
                      name="barcode"
                      value={formData.barcode || ""}
                      onChange={handleChange}
                      type="text"
                      className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all"
                      placeholder="Escanear..."
                    />
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Información Comercial y Financiera */}
              <div className="col-span-1 md:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1 md:col-span-2 group">
                    <label className="flex text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                      Nombre Comercial *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand transition-colors">
                        <Box size={18} />
                      </div>
                      <input
                        required
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        type="text"
                        className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all shadow-sm"
                        placeholder="Ej: Látex Interior Premium 20L"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="flex text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                      Categoría *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand transition-colors">
                        <Layers size={18} />
                      </div>
                      <select
                        required
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-800 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all cursor-pointer shadow-sm"
                      >
                        <option value="" disabled>
                          Seleccionar...
                        </option>
                        <option value="Pinturas">Pinturas</option>
                        <option value="Preparación">Preparación</option>
                        <option value="Herramientas">Herramientas</option>
                        <option value="Impermeabilizantes">
                          Impermeabilizantes
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="group">
                    <label className="flex text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                      Marca / Proveedor
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand transition-colors">
                        <Building2 size={18} />
                      </div>
                      <input
                        name="brand"
                        value={formData.brand || ""}
                        onChange={handleChange}
                        type="text"
                        className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all shadow-sm"
                        placeholder="Ej: Alba, Sherwin..."
                      />
                    </div>
                  </div>
                </div>

                {/* Panel de Motor de Rentabilidad */}
                <div className="p-6 rounded-[2rem] bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 dark:from-slate-900/80 dark:to-[#0a0f1c] dark:border-slate-800/80 shadow-sm">
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="p-2 bg-brand/10 text-brand rounded-lg">
                      <Calculator size={16} />
                    </div>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                      Motor de Rentabilidad
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="flex text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">
                        Costo Base
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <DollarSign size={14} />
                        </div>
                        <input
                          name="costPrice"
                          value={formData.costPrice || ""}
                          onChange={handleChange}
                          type="number"
                          min="0"
                          className="w-full pl-8 pr-2 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="flex text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">
                        Ganancia
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Percent size={14} />
                        </div>
                        <input
                          name="profitMargin"
                          value={formData.profitMargin || ""}
                          onChange={handleChange}
                          type="number"
                          min="0"
                          className="w-full pl-8 pr-2 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                          placeholder="30"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="flex text-[10px] font-bold text-emerald-500 uppercase mb-1.5 ml-1">
                        P. Venta Público *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500">
                          <DollarSign size={14} />
                        </div>
                        <input
                          name="retailPrice"
                          value={formData.retailPrice || ""}
                          onChange={handleChange}
                          type="number"
                          min="0"
                          className="w-full pl-8 pr-2 py-3 bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 rounded-xl text-sm font-black text-emerald-600 dark:text-emerald-400 focus:outline-none transition-all shadow-inner"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="flex text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                      Unidades en Stock *
                    </label>
                    <div className="relative flex items-center space-x-3">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand transition-colors">
                          <Activity size={18} />
                        </div>
                        <input
                          required
                          name="stock"
                          value={formData.stock || ""}
                          onChange={handleChange}
                          type="number"
                          min="0"
                          className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-black text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all shadow-sm"
                          placeholder="0"
                        />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Un.
                      </span>
                    </div>
                  </div>

                  <div className="group">
                    <label className="flex text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                      Ficha Técnica
                    </label>
                    <div className="relative">
                      <div className="absolute top-4 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand transition-colors">
                        <FileText size={18} />
                      </div>
                      <textarea
                        name="description"
                        value={formData.description || ""}
                        onChange={handleChange}
                        rows={2}
                        className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all resize-none shadow-sm"
                        placeholder="Características..."
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Renderizado de controles de acción (Botones de pie de modal) */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#050810] flex justify-end space-x-4 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3.5 rounded-2xl font-bold text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
              disabled={isSubmitting}
            >
              Descartar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className={`flex items-center space-x-2 px-8 py-3.5 font-black text-sm rounded-2xl transition-all duration-300 ${isFormValid ? "bg-gradient-to-r from-brand to-amber-500 text-white shadow-lg shadow-brand/30 hover:scale-105 hover:shadow-brand/50" : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"}`}
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              <span>
                {productToEdit ? "Actualizar Catálogo" : "Ingresar Producto"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
