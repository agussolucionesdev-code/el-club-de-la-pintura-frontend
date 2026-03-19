import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Landmark,
  Smartphone,
  Loader2,
  ScanLine,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Search,
  PackageOpen,
} from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "../../../core/context/AuthContext";
import { CyberHeader } from "../../../shared/components/CyberHeader";
import type { Product } from "../../products/components/ProductModal";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000/api";

interface CartItem extends Product {
  cartQuantity: number;
}
interface Customer {
  id: number;
  name: string;
}
interface CashRegister {
  id: number;
  status: "OPEN" | "CLOSED";
  expectedBalance: number | null;
}
interface ExtendedUser {
  id: number;
  name: string;
  branches?: { id: number; name: string }[];
}

// ==========================================
// MOTOR NEURO-VOCAL (Síntesis de Voz)
// ==========================================
const speakAlert = (text: string) => {
  // Preparado para el futuro panel de configuración
  if (localStorage.getItem("muted_alerts") === "true") return;

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel(); // Corta cualquier audio anterior
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-AR"; // Acento local
    utterance.rate = 1.1; // Ligeramente más rápido para dinamismo
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
};

export const POSPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem("club_token");
  const userName = user?.name ? user.name.split(" ")[0] : "Cajero";

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeRegister, setActiveRegister] = useState<CashRegister | null>(
    null,
  );

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [posPage, setPosPage] = useState(1);
  const posItemsPerPage = 12;

  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentUser = user as ExtendedUser | null;
  const currentBranchId = currentUser?.branches?.[0]?.id || 1;

  const phrases = [
    `Terminal de Facturación activa: ${userName}`,
    "Escaneo rápido de SKU/EAN habilitado",
  ];

  const tags = [
    {
      text: activeRegister ? "CAJA CONECTADA" : "ESPERANDO CAJA...",
      icon: ScanLine,
      delay: activeRegister
        ? "text-emerald-500"
        : "animate-pulse text-amber-500",
    },
    { text: "SISTEMA EN TIEMPO REAL", icon: Landmark, delay: "text-blue-500" },
  ];

  // Wrapper personalizado para Toast + Voz + Neuro-Copywriting
  const neuroToast = useCallback(
    (msg: string, type: "success" | "error" | "warning", speakMsg?: string) => {
      // Letra más grande y clara (Neuro-diseño)
      const formattedMsg = (
        <span className="text-lg font-black tracking-tight">{msg}</span>
      );

      if (type === "success") toast.success(formattedMsg);
      else if (type === "error") toast.error(formattedMsg);
      else toast(formattedMsg, { icon: "⚠️" });

      // La voz puede decir algo más corto e impactante que el texto
      speakAlert(speakMsg || msg);
    },
    [],
  );

  // ==========================================
  // HEARTBEAT: Sincronización en Tiempo Real
  // ==========================================
  const checkRegisterStatus = useCallback(async () => {
    if (!token) return;
    try {
      const timestamp = new Date().getTime();
      const res = await fetch(
        `${API_URL}/cash-registers/${currentBranchId}/active?_t=${timestamp}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.id) {
          setActiveRegister({
            id: Number(json.data.id),
            status: "OPEN",
            expectedBalance: json.data.currentExpectedBalance || 0,
          });
        } else {
          setActiveRegister(null);
        }
      } else {
        setActiveRegister(null);
      }
    } catch (e) {
      console.log(e);
      // Fallo silencioso para no molestar al cajero si hay un micro-corte de internet
    }
  }, [currentBranchId, token]);

  // Carga inicial pesada (Catálogo y Clientes)
  useEffect(() => {
    const bootstrapPOS = async () => {
      if (!token) {
        neuroToast("Sesión no detectada", "error", "Atención. Inicie sesión.");
        return navigate("/login");
      }
      setIsLoadingData(true);
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      try {
        const timestamp = new Date().getTime();
        const [prodRes, custRes] = await Promise.all([
          fetch(`${API_URL}/products?limit=1000&_t=${timestamp}`, {
            headers,
            cache: "no-store",
          }),
          fetch(`${API_URL}/customers?_t=${timestamp}`, {
            headers,
            cache: "no-store",
          }),
        ]);

        if (prodRes.status === 403 || custRes.status === 403) {
          neuroToast(
            "Sesión expirada",
            "error",
            "Sesión finalizada por seguridad.",
          );
          logout();
          return navigate("/login");
        }

        if (prodRes.ok) {
          const productsJson = await prodRes.json();
          setProducts(
            Array.isArray(productsJson.data) ? productsJson.data : [],
          );
        }
        if (custRes.ok) {
          const customersJson = await custRes.json();
          setCustomers(
            Array.isArray(customersJson.data) ? customersJson.data : [],
          );
        }

        await checkRegisterStatus(); // Chequeo inicial de caja
      } catch (error) {
        console.log(error);
        neuroToast(
          "Error de conexión",
          "error",
          "Fallo de conexión al servidor.",
        );
      } finally {
        setIsLoadingData(false);
        searchInputRef.current?.focus();
      }
    };
    bootstrapPOS();
  }, [token, navigate, logout, checkRegisterStatus, neuroToast]);

  // Activación del Heartbeat (Latido cada 3 segundos y al hacer foco en la ventana)
  useEffect(() => {
    const interval = setInterval(checkRegisterStatus, 3000);
    window.addEventListener("focus", checkRegisterStatus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", checkRegisterStatus);
    };
  }, [checkRegisterStatus]);

  // ==========================================
  // LÓGICA DE CARRITO Y BÚSQUEDA
  // ==========================================
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
    // Sonido sutil opcional (se puede agregar luego)
  };

  const updateQuantity = (id: string | number, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id || Number(item.id) === Number(id)) {
          const newQty = item.cartQuantity + delta;
          return { ...item, cartQuantity: newQty > 0 ? newQty : 1 };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (id: string | number) => {
    setCart((prev) =>
      prev.filter((item) => item.id !== id && Number(item.id) !== Number(id)),
    );
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim() !== "") {
      const foundProduct = products.find(
        (p) =>
          p.barcode === searchTerm ||
          p.sku?.toLowerCase() === searchTerm.toLowerCase(),
      );
      if (foundProduct) addToCart(foundProduct);
      else {
        neuroToast("Producto no encontrado", "warning", "Código desconocido.");
        setSearchTerm("");
      }
    }
  };

  // Motor de Búsqueda
  const filteredProducts = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(s) ||
        p.sku?.toLowerCase().includes(s) ||
        p.barcode?.includes(s),
    );
  }, [products, searchTerm]);

  const totalPosPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / posItemsPerPage),
  );
  const currentPosProducts = filteredProducts.slice(
    (posPage - 1) * posItemsPerPage,
    posPage * posItemsPerPage,
  );
  const totalAmount = cart.reduce(
    (acc, item) =>
      acc + (item.retailPrice || item.price || 0) * item.cartQuantity,
    0,
  );

  // ==========================================
  // FINALIZACIÓN DE VENTA
  // ==========================================
  const handleCheckout = async () => {
    if (!activeRegister || !activeRegister.id) {
      return neuroToast(
        "Caja Bloqueada",
        "error",
        "Operación rechazada. Abra la caja registradora primero.",
      );
    }
    if (cart.length === 0)
      return neuroToast(
        "Carrito Vacío",
        "warning",
        "Por favor, ingrese productos.",
      );

    setIsProcessing(true);

    const payload = {
      branchId: currentBranchId,
      userId: Number(currentUser?.id || 1),
      cashRegisterId: Number(activeRegister.id),
      customerId: selectedCustomerId ? Number(selectedCustomerId) : null,
      totalAmount: Number(totalAmount) > 0 ? Number(totalAmount) : 0.01,
      paymentMethod,
      status: paymentMethod === "CREDIT_ACCOUNT" ? "PENDING" : "PAID",
      items: cart.map((item) => ({
        productId: Number(item.id),
        quantity: Number(item.cartQuantity),
        unitPrice: Number(item.retailPrice || item.price || 0),
        subtotal: Number(
          (item.retailPrice || item.price || 0) * item.cartQuantity,
        ),
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

      const result = await response.json();

      if (!response.ok) {
        if (result.details) throw new Error("Datos inválidos en el ticket.");
        throw new Error(result.error || "Fallo transaccional.");
      }

      neuroToast("Cobro Exitoso", "success", "Venta registrada correctamente.");
      setCart([]);
      setSelectedCustomerId(null);
      checkRegisterStatus(); // Forzamos actualización de caja instantánea tras cobrar
    } catch (error: unknown) {
      console.log(error);
      neuroToast(
        "Cobro Rechazado",
        "error",
        "Atención. Error en la transacción.",
      );
    } finally {
      setIsProcessing(false);
      searchInputRef.current?.focus();
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] dark:bg-[#030712] p-4 flex flex-col transition-colors duration-700">
      <div className="relative z-10 max-w-[1800px] mx-auto w-full flex-1 flex flex-col space-y-4">
        <CyberHeader
          phrases={phrases}
          labelIcon={ShoppingCart}
          labelText="Punto de Venta"
          tags={tags}
        />

        <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
          <div className="w-full lg:w-[60%] xl:w-[65%] flex flex-col space-y-4">
            <div className="bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-3xl p-2 shadow-sm flex items-center">
              <Search className="text-slate-400 ml-4 mr-3" size={24} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Escaneá el código de barras o buscá por nombre/SKU..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPosPage(1);
                }}
                onKeyDown={handleSearchKeyPress}
                autoFocus
                className="w-full bg-transparent py-4 font-black text-xl text-slate-800 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none"
              />
              {isLoadingData && (
                <Loader2 className="animate-spin text-brand mr-4" size={24} />
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              <AnimatePresence mode="popLayout">
                {!isLoadingData && currentPosProducts.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20 text-slate-400 font-bold"
                  >
                    <PackageOpen
                      size={48}
                      className="mx-auto mb-4 opacity-50"
                    />
                    Sin coincidencias.
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
                    {isLoadingData
                      ? Array.from({ length: 8 }).map((_, i) => (
                          <div
                            key={i}
                            className="h-44 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse"
                          ></div>
                        ))
                      : currentPosProducts.map((p) => (
                          <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            key={p.id}
                            onClick={() => addToCart(p)}
                            className="bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-3xl p-4 cursor-pointer hover:border-brand dark:hover:border-brand shadow-sm hover:shadow-md transition-all group flex flex-col justify-between h-44"
                          >
                            <div>
                              <span className="text-[10px] font-black text-brand uppercase tracking-widest bg-brand/10 px-2 py-0.5 rounded-md">
                                {p.sku}
                              </span>
                              <h3 className="text-sm font-bold text-slate-700 dark:text-white mt-2 line-clamp-2 leading-tight group-hover:text-brand transition-colors">
                                {p.name}
                              </h3>
                            </div>
                            <div className="flex items-end justify-between">
                              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                                $
                                {Number(
                                  p.retailPrice || p.price || 0,
                                ).toLocaleString("es-AR")}
                              </span>
                              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors text-slate-400">
                                <Plus size={20} strokeWidth={3} />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                  </div>
                )}
              </AnimatePresence>
            </div>

            {totalPosPages > 1 && (
              <div className="flex items-center justify-between bg-white dark:bg-slate-900/60 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                <span className="text-xs font-black text-slate-400 uppercase">
                  Mostrando {currentPosProducts.length} de{" "}
                  {filteredProducts.length}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPosPage((p) => Math.max(1, p - 1))}
                    className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:text-brand transition-colors text-slate-400"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="px-5 flex items-center bg-brand text-white font-black text-xs rounded-xl shadow-lg">
                    Pág. {posPage} / {totalPosPages}
                  </div>
                  <button
                    onClick={() =>
                      setPosPage((p) => Math.min(totalPosPages, p + 1))
                    }
                    className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:text-brand transition-colors text-slate-400"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="w-full lg:w-[40%] xl:w-[35%] flex flex-col bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-xl overflow-hidden shrink-0">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center">
                <ShoppingCart className="mr-3 text-brand" size={24} /> Ticket
                Actual
              </h2>
              {activeRegister ? (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full uppercase border border-emerald-100 dark:border-emerald-900 shadow-sm">
                  Caja ID: {activeRegister.id}
                </span>
              ) : (
                <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-500/10 px-3 py-1 rounded-full uppercase border border-red-100 dark:border-red-900 animate-pulse">
                  Caja Cerrada
                </span>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <UserIcon size={18} />
                </div>
                <select
                  value={selectedCustomerId || ""}
                  onChange={(e) =>
                    setSelectedCustomerId(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-black text-slate-700 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-brand/50 cursor-pointer shadow-sm transition-all"
                >
                  <option value="">CONSUMIDOR FINAL</option>
                  {Array.isArray(customers) &&
                    customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name.toUpperCase()}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3">
              <AnimatePresence>
                {cart.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 space-y-4"
                  >
                    <ScanLine size={64} className="animate-pulse opacity-50" />
                    <p className="font-black uppercase tracking-widest text-xs text-center">
                      Buscá o escaneá
                      <br />
                      para empezar a cobrar
                    </p>
                  </motion.div>
                ) : (
                  cart.map((item) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      key={item.id}
                      className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-bold text-slate-800 dark:text-white leading-tight pr-4 truncate">
                          {item.name}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.id!)}
                          className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm font-black text-slate-500 dark:text-slate-400">
                          $
                          {Number(
                            item.retailPrice || item.price || 0,
                          ).toLocaleString("es-AR")}{" "}
                          c/u
                        </span>
                        <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
                          <button
                            onClick={() => updateQuantity(item.id!, -1)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-all"
                          >
                            <Minus size={14} strokeWidth={3} />
                          </button>
                          <span className="text-sm font-black w-6 text-center text-slate-800 dark:text-white">
                            {item.cartQuantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id!, 1)}
                            className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-all"
                          >
                            <Plus size={14} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <div className="grid grid-cols-4 gap-2 mb-6">
                {[
                  { id: "CASH", icon: Banknote, label: "Efectivo" },
                  { id: "DEBIT", icon: CreditCard, label: "Débito" },
                  { id: "CREDIT", icon: Landmark, label: "Crédito" },
                  { id: "TRANSFER", icon: Smartphone, label: "Transf." },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex flex-col items-center justify-center py-3 rounded-2xl border-2 transition-all ${paymentMethod === m.id ? "bg-brand/10 border-brand text-brand shadow-sm" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-brand/40"}`}
                  >
                    <m.icon size={20} className="mb-1" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">
                      {m.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-end mb-6">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Total a Cobrar
                </span>
                <span className="text-5xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">
                  <span className="text-2xl text-emerald-500 mr-1">$</span>
                  {totalAmount.toLocaleString("es-AR")}
                </span>
              </div>

              {/* Botón Inteligente Neuro-UX */}
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || isProcessing || !activeRegister}
                className={`w-full py-5 rounded-2xl flex items-center justify-center space-x-3 text-lg font-black transition-all duration-300 ${cart.length > 0 && !isProcessing && activeRegister ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/30 hover:scale-[1.02]" : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"}`}
              >
                {isProcessing ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <Banknote size={24} />
                )}
                <span>
                  {isProcessing
                    ? "PROCESANDO VENTA..."
                    : !activeRegister
                      ? "ABRÍ LA CAJA PRIMERO"
                      : cart.length === 0
                        ? "AGREGÁ PRODUCTOS AL CARRITO"
                        : "FINALIZAR COBRO"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
