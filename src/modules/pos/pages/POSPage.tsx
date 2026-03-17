import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ShoppingCart,
  Barcode,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Landmark,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ScanLine,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../../core/context/AuthContext";
import { CyberHeader } from "../../../shared/components/CyberHeader";
import type { Product } from "../../products/components/ProductModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

interface CartItem extends Product {
  cartQuantity: number;
}

export const POSPage = () => {
  const { user } = useAuth();
  const token = localStorage.getItem("club_token");
  const userName = user?.name ? user.name.split(" ")[0] : "Cajero";

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    msg: string;
    type: "success" | "error";
  }>({ show: false, msg: "", type: "success" });

  // Estado para la paginación de la grilla del mostrador
  const [posPage, setPosPage] = useState(1);
  const posItemsPerPage = 12;

  const searchInputRef = useRef<HTMLInputElement>(null);

  const phrases = [
    `Terminal de Facturación activada, ${userName}.`,
    `Escáner láser en espera. Ingresá código o SKU.`,
    `Sincronización de caja en tiempo real establecida.`,
  ];

  const tags = [
    {
      text: "Lector Activo",
      icon: ScanLine,
      delay: "animate-slide-in-left delay-100",
    },
    {
      text: "Caja Fuerte",
      icon: Landmark,
      delay: "animate-slide-in-left delay-200",
    },
  ];

  const showToast = useCallback(
    (msg: string, type: "success" | "error" = "success") => {
      setToast({ show: true, msg, type });
      setTimeout(
        () => setToast({ show: false, msg: "", type: "success" }),
        6000,
      );
    },
    [],
  );

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/products?limit=1000`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (!response.ok) throw new Error("Error fetching products");
        const json = await response.json();
        setProducts(json.data || json || []);
      } catch (error) {
        console.log(error);
        showToast("Error conectando con el catálogo.", "error");
      }
    };
    fetchProducts();
    searchInputRef.current?.focus();
  }, [token, showToast]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item,
        );
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
    setSearchTerm("");
    searchInputRef.current?.focus();
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = item.cartQuantity + delta;
          return { ...item, cartQuantity: newQty > 0 ? newQty : 1 };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim() !== "") {
      const foundProduct = products.find(
        (p) =>
          p.barcode === searchTerm ||
          p.sku?.toLowerCase() === searchTerm.toLowerCase(),
      );
      if (foundProduct) {
        addToCart(foundProduct);
      } else {
        showToast(`No se encontró el código: ${searchTerm}`, "error");
        setSearchTerm("");
      }
    }
  };

  // Reseteamos la página a 1 cada vez que el usuario busca algo
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPosPage(1);
  };

  // Filtrado de productos para la grilla
  const filteredProducts = products.filter((p) => {
    const s = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(s) ||
      p.sku?.toLowerCase().includes(s) ||
      p.barcode?.includes(s)
    );
  });

  // Lógica de paginación para la grilla
  const totalPosPages = Math.ceil(filteredProducts.length / posItemsPerPage);
  const currentPosProducts = filteredProducts.slice(
    (posPage - 1) * posItemsPerPage,
    posPage * posItemsPerPage,
  );

  const subtotal = cart.reduce(
    (acc, item) =>
      acc + (item.retailPrice || item.price || 0) * item.cartQuantity,
    0,
  );
  const total = subtotal;

  const handleCheckout = async () => {
    if (cart.length === 0) return showToast("El carrito está vacío.", "error");
    setIsProcessing(true);

    const payload = {
      branchId: 1, // OJO: Tu backend exige una sucursal. Si no existe la sucursal 1, va a dar error de ForeignKey.
      paymentMethod,
      amountPaid: total,
      items: cart.map((item) => ({
        productId: item.id,
        quantity: item.cartQuantity,
        unitPrice: item.retailPrice || item.price || 0,
      })),
    };

    try {
      const response = await fetch(`${API_URL}/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.error || "Fallo en la transacción. Verifica la consola.",
        );
      }

      showToast("¡Venta registrada con éxito!");
      setCart([]);
    } catch (error: unknown) {
      if (error instanceof Error) {
        showToast(`Alerta del Backend: ${error.message}`, "error");
      } else {
        showToast("Hubo un error inesperado al procesar la venta", "error");
      }
    } finally {
      setIsProcessing(false);
      searchInputRef.current?.focus();
    }
  };

  return (
    <div className="relative min-h-full bg-[#F4F7F9] dark:bg-[#030712] p-4 md:p-6 lg:p-8 overflow-hidden transition-colors duration-700 w-full flex flex-col">
      <div className="absolute top-[-10%] right-[-10%] w-[50rem] h-[50rem] bg-brand/10 rounded-full blur-[150px] opacity-50 pointer-events-none"></div>

      {/* TOAST NOTIFICATIONS */}
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
          <span className="font-bold text-sm tracking-wide max-w-xs">
            {toast.msg}
          </span>
        </div>
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto w-full flex-1 flex flex-col">
        <CyberHeader
          phrases={phrases}
          labelIcon={ShoppingCart}
          labelText="Punto de Venta"
          tags={tags}
        />

        <div
          className="flex flex-col lg:flex-row gap-6 flex-1 h-full opacity-0 animate-fade-in-up"
          style={{ animationDelay: "400ms" }}
        >
          {/* ZONA IZQUIERDA */}
          <div className="w-full lg:w-2/3 flex flex-col h-full space-y-4">
            <div className="relative w-full group shrink-0">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Barcode
                  size={24}
                  className="text-slate-400 group-focus-within:text-brand transition-colors"
                />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyPress}
                className="w-full pl-14 pr-6 py-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800 rounded-[1.5rem] text-lg font-black text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all shadow-lg"
                placeholder="Escanear código de barras o buscar producto (Presioná Enter)..."
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {currentPosProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white/60 dark:bg-[#0a0f1c]/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800 rounded-[1.5rem] p-4 cursor-pointer hover:border-brand hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all group flex flex-col justify-between h-48"
                  >
                    <div>
                      <span className="text-[10px] font-black text-brand uppercase tracking-widest">
                        {product.sku}
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white mt-1 line-clamp-2 leading-tight group-hover:text-brand transition-colors">
                        {product.name}
                      </h3>
                    </div>
                    <div className="flex items-end justify-between mt-4">
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        $
                        {Number(
                          product.retailPrice || product.price || 0,
                        ).toLocaleString("es-AR")}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors text-slate-400">
                        <Plus size={16} strokeWidth={3} />
                      </div>
                    </div>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="col-span-full py-10 text-center text-slate-500 font-bold">
                    No se encontraron productos. Buscá por nombre, código o SKU.
                  </div>
                )}
              </div>
            </div>

            {/* PAGINACIÓN DE LA GRILLA DEL MOSTRADOR */}
            {totalPosPages > 1 && (
              <div className="flex items-center justify-between bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-3 rounded-[1.5rem] border border-slate-200/50 dark:border-slate-800 shrink-0">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-2">
                  Mostrando {currentPosProducts.length} de{" "}
                  {filteredProducts.length}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPosPage((p) => Math.max(1, p - 1))}
                    disabled={posPage === 1}
                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:text-brand disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="px-4 py-2 bg-brand text-white font-black text-xs rounded-xl shadow-inner flex items-center">
                    Pág. {posPage} / {totalPosPages}
                  </div>
                  <button
                    onClick={() =>
                      setPosPage((p) => Math.min(totalPosPages, p + 1))
                    }
                    disabled={posPage === totalPosPages || totalPosPages === 0}
                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:text-brand disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ZONA DERECHA: LA CAJA REGISTRADORA (Carrito y Pagos) */}
          <div className="w-full lg:w-1/3 h-full flex flex-col bg-white/80 dark:bg-[#0a0f1c]/90 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden shrink-0">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-transparent">
              <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center">
                <ShoppingCart className="mr-3 text-brand" size={24} /> Resumen
                de Venta
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-slate-50/20 dark:bg-transparent">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                  <ScanLine size={64} className="mb-4" />
                  <p className="font-bold">Carrito vacío</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-bold text-slate-800 dark:text-white line-clamp-2 pr-4">
                        {item.name}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id!)}
                        className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        $
                        {Number(
                          item.retailPrice || item.price || 0,
                        ).toLocaleString("es-AR")}
                      </span>

                      <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800 rounded-xl p-1 border border-slate-100 dark:border-slate-700">
                        <button
                          onClick={() => updateQuantity(item.id!, -1)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm"
                        >
                          <Minus size={14} strokeWidth={3} />
                        </button>
                        <span className="text-sm font-black w-6 text-center dark:text-white">
                          {item.cartQuantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id!, 1)}
                          className="p-1 text-slate-400 hover:text-emerald-500 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm"
                        >
                          <Plus size={14} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
              <div className="grid grid-cols-4 gap-2 mb-6">
                {[
                  { id: "CASH", icon: Banknote, label: "Efectivo" },
                  { id: "CARD", icon: CreditCard, label: "Tarjeta" },
                  { id: "TRANSFER", icon: Landmark, label: "Transf." },
                  { id: "MERCADOPAGO", icon: Smartphone, label: "Merc.Pago" },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all ${paymentMethod === method.id ? "bg-brand/10 border-brand text-brand shadow-sm" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-brand/50"}`}
                  >
                    <method.icon size={20} className="mb-1.5" />
                    <span className="text-[9px] font-black uppercase tracking-wider">
                      {method.label}
                    </span>
                  </button>
                ))}
              </div>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm font-bold text-slate-500">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString("es-AR")}</span>
                </div>
                <div className="flex justify-between text-2xl md:text-3xl font-black text-slate-800 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>TOTAL</span>
                  <span className="text-emerald-500">
                    ${total.toLocaleString("es-AR")}
                  </span>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || isProcessing}
                className={`w-full py-4 rounded-2xl flex items-center justify-center space-x-3 text-lg font-black transition-all duration-300 ${cart.length > 0 && !isProcessing ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 transform hover:scale-[1.02]" : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"}`}
              >
                {isProcessing ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <Banknote size={24} />
                )}
                <span>
                  {isProcessing ? "PROCESANDO PAGO..." : "COBRAR E IMPRIMIR"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
