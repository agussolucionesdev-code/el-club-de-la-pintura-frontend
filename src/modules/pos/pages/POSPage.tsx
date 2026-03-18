// Importación de dependencias de React y hooks de estado
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // Inyección de navegación para seguridad
// Importación de iconografía especializada
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
  User as UserIcon,
  Search,
} from "lucide-react";
// Importación de lógica de autenticación y componentes compartidos
import { useAuth } from "../../../core/context/AuthContext";
import { CyberHeader } from "../../../shared/components/CyberHeader";
import type { Product } from "../../products/components/ProductModal";

// Definición de URL base estable (IPv4)
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000/api";

// ==========================================
// DEFINICIÓN DE INTERFACES ESTRUCTURALES
// ==========================================

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

export const POSPage = () => {
  const { user, logout } = useAuth(); // Inyección de logout para sesiones expiradas
  const navigate = useNavigate();
  const token = localStorage.getItem("club_token");
  const userName = user?.name ? user.name.split(" ")[0] : "Cajero";

  // Inicialización de estados con tipos estrictos y valores por defecto (Array vacío)
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
  const [toast, setToast] = useState<{
    show: boolean;
    msg: string;
    type: "success" | "error";
  }>({
    show: false,
    msg: "",
    type: "success",
  });

  const phrases = [
    `Terminal de Facturación activa: ${userName}`,
    "Listo para escaneo de códigos SKU/EAN",
    "Sincronización de caja en tiempo real establecida",
  ];

  const tags = [
    { text: "SISTEMA SEGURO", icon: ScanLine, delay: "animate-pulse" },
    { text: "IP ESTABLE: 127.0.0.1", icon: Landmark, delay: "" },
  ];

  const showToast = useCallback(
    (msg: string, type: "success" | "error" = "success") => {
      setToast({ show: true, msg, type });
      setTimeout(
        () => setToast({ show: false, msg: "", type: "success" }),
        5000,
      );
    },
    [],
  );

  // EJECUCIÓN DEL BOOTSTRAP: Carga de datos con manejo de errores transaccionales
  useEffect(() => {
    const bootstrapPOS = async () => {
      if (!token) {
        showToast("No se detectó una sesión activa.", "error");
        return navigate("/login");
      }

      setIsLoadingData(true);
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Obtenemos dinámicamente el ID de la sucursal del usuario logueado
      const currentUser = user as ExtendedUser;
      const currentBranchId = currentUser?.branches?.[0]?.id || 1;

      try {
        const [prodRes, custRes, regRes] = await Promise.all([
          fetch(`${API_URL}/products?limit=1000`, { headers }),
          fetch(`${API_URL}/customers`, { headers }),
          // CORRECCIÓN CRÍTICA: Llamamos al endpoint correcto del backend
          fetch(`${API_URL}/cash-registers/status/${currentBranchId}`, {
            headers,
          }),
        ]);

        // PROTECCIÓN DE SESIÓN
        if (
          prodRes.status === 403 ||
          custRes.status === 403 ||
          regRes.status === 403
        ) {
          showToast(
            "Tu sesión ha expirado. Por favor, reingresa al sistema.",
            "error",
          );
          logout();
          return navigate("/login");
        }

        const productsJson = await prodRes.json();
        const customersJson = await custRes.json();

        // VALIDACIÓN ESTRUCTURAL
        setProducts(
          Array.isArray(productsJson.data)
            ? productsJson.data
            : Array.isArray(productsJson)
              ? productsJson
              : [],
        );
        setCustomers(
          Array.isArray(customersJson.data)
            ? customersJson.data
            : Array.isArray(customersJson)
              ? customersJson
              : [],
        );

        // MANEJO DE CAJA REGISTRADORA
        if (regRes.ok) {
          const registerJson = await regRes.json();

          // 1. Extraemos el cuerpo principal de la respuesta
          let registerData = null;
          if (registerJson.data) {
            registerData = Array.isArray(registerJson.data)
              ? registerJson.data[0]
              : registerJson.data;
          } else if (Array.isArray(registerJson)) {
            registerData = registerJson[0];
          } else {
            registerData = registerJson;
          }

          // 2. ADAPTACIÓN AL PAYLOAD DEL ARQUEO:
          // Buscamos el ID en 'shiftDetails.shiftId' o como 'id' por si a futuro cambia
          const extractedId =
            registerData?.shiftDetails?.shiftId || registerData?.id;

          if (extractedId) {
            // Normalizamos el objeto para que el frontend (y Zod) tengan exactamente lo que necesitan
            setActiveRegister({
              id: Number(extractedId),
              status: "OPEN",
              expectedBalance:
                registerData?.cashAudit?.expectedCashInDrawer || 0,
            });
          } else {
            console.warn(
              "La caja fue recibida pero no tiene un ID válido.",
              registerData,
            );
            showToast(
              "ATENCIÓN: No se pudo identificar el número de turno/caja.",
              "error",
            );
          }
        } else {
          showToast("ATENCIÓN: Debes abrir caja para poder facturar.", "error");
        }
      } catch (error) {
        console.error("Fallo crítico en sincronización POS:", error);
        showToast("Error de conexión con el servidor central.", "error");
      } finally {
        setIsLoadingData(false);
        searchInputRef.current?.focus();
      }
    };
    bootstrapPOS();
  }, [token, showToast, navigate, logout, user]);
  // Manejo de Carrito (Sin cambios de lógica, solo mayor robustez)
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
        showToast(`Producto no encontrado: ${searchTerm}`, "error");
        setSearchTerm("");
      }
    }
  };

  const filteredProducts = products.filter((p) => {
    const s = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(s) ||
      p.sku?.toLowerCase().includes(s) ||
      p.barcode?.includes(s)
    );
  });

  const totalPosPages = Math.ceil(filteredProducts.length / posItemsPerPage);
  const currentPosProducts = filteredProducts.slice(
    (posPage - 1) * posItemsPerPage,
    posPage * posItemsPerPage,
  );

  const totalAmount = cart.reduce(
    (acc, item) =>
      acc + (item.retailPrice || item.price || 0) * item.cartQuantity,
    0,
  );

  // FINALIZACIÓN DE VENTA: Sincronización con el Motor de Transacciones
  const handleCheckout = async () => {
    // Validación ESTRICTA antes de empezar
    if (!activeRegister || !activeRegister.id) {
      return showToast(
        "Operación bloqueada: No se pudo identificar la caja abierta.",
        "error",
      );
    }

    if (cart.length === 0) return showToast("El carrito está vacío.", "error");

    setIsProcessing(true);

    const currentUser = user as ExtendedUser;

    // BLINDAJE DE DATOS
    const payload = {
      branchId: Number(currentUser?.branches?.[0]?.id || 1),
      userId: Number(user?.id || 1),
      cashRegisterId: Number(activeRegister.id), // Aquí ya estamos seguros de que existe
      customerId: selectedCustomerId ? Number(selectedCustomerId) : null,
      totalAmount: Number(totalAmount) > 0 ? Number(totalAmount) : 0.01,
      paymentMethod,
      status: "PAID",
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
        // INTERCEPTOR DE ERRORES ZOD: Si Zod rechaza, leemos exactamente qué campo falló
        if (result.details) {
          alert("ERROR DE ZOD:\n" + JSON.stringify(result.details, null, 2));

          // SOLUCIÓN: Reemplazamos 'any' por la interfaz exacta del error
          const camposConError = result.details
            .map((d: { path: string; message: string }) => d.path)
            .join(", ");

          throw new Error(`Datos inválidos en: ${camposConError}`);
        }
        throw new Error(result.error || "Fallo transaccional en el servidor");
      }

      showToast("¡Venta procesada, stock actualizado y dinero en caja!");
      setCart([]);
      setSelectedCustomerId(null);
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Error desconocido";
      // Mostramos el error exacto en el cartelito
      showToast(`Aduana: ${errorMsg}`, "error");
    } finally {
      setIsProcessing(false);
      searchInputRef.current?.focus();
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F4F7F9] dark:bg-[#030712] p-4 flex flex-col transition-colors duration-700">
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-brand/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* RENDERIZADO DE NOTIFICACIONES */}
      <div
        className={`fixed top-6 right-6 z-[200] transition-all duration-500 ${toast.show ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"}`}
      >
        <div
          className={`flex items-center space-x-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md ${toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}
        >
          {toast.type === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <AlertTriangle size={20} />
          )}
          <span className="font-bold text-sm">{toast.msg}</span>
        </div>
      </div>

      <div className="relative z-10 max-w-[1700px] mx-auto w-full flex-1 flex flex-col space-y-4">
        <CyberHeader
          phrases={phrases}
          labelIcon={ShoppingCart}
          labelText="Punto de Venta"
          tags={tags}
        />

        <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
          {/* SECTOR IZQUIERDO: BÚSQUEDA Y GRILLA */}
          <div className="w-full lg:w-2/3 flex flex-col space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand transition-colors">
                  <Search size={22} className="mr-2" />
                  <Barcode size={24} />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPosPage(1);
                  }}
                  onKeyDown={handleSearchKeyPress}
                  className="w-full pl-20 pr-6 py-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl text-lg font-black text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all shadow-lg"
                  placeholder="Escaneá o buscá por nombre..."
                />
              </div>
            </div>

            {/* GRILLA DE PRODUCTOS DINÁMICA */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
                {isLoadingData
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-44 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse"
                      ></div>
                    ))
                  : currentPosProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => addToCart(p)}
                        className="bg-white/60 dark:bg-[#0a0f1c]/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-5 cursor-pointer hover:border-brand hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all group flex flex-col justify-between h-44 border-b-4 border-b-transparent hover:border-b-brand"
                      >
                        <div>
                          <span className="text-[10px] font-black text-brand uppercase tracking-widest">
                            {p.sku}
                          </span>
                          <h3 className="text-sm font-bold text-slate-700 dark:text-white mt-1 line-clamp-2 leading-tight group-hover:text-brand">
                            {p.name}
                          </h3>
                        </div>
                        <div className="flex items-end justify-between">
                          <span className="text-xl font-black text-emerald-500">
                            $
                            {Number(
                              p.retailPrice || p.price || 0,
                            ).toLocaleString("es-AR")}
                          </span>
                          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors">
                            <Plus size={20} strokeWidth={3} />
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
            </div>

            {/* CONTROL DE PAGINACIÓN */}
            {totalPosPages > 1 && (
              <div className="flex items-center justify-between bg-white/60 dark:bg-slate-900/60 p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-black text-slate-400 uppercase">
                  Mostrando {currentPosProducts.length} de{" "}
                  {filteredProducts.length}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPosPage((p) => Math.max(1, p - 1))}
                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:text-brand transition-colors"
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
                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:text-brand transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTOR DERECHO: TERMINAL DE COBRO */}
          <div className="w-full lg:w-1/3 flex flex-col bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center">
                <ShoppingCart className="mr-3 text-brand" size={24} /> Ticket
                Actual
              </h2>
              {activeRegister && (
                <div className="flex items-center text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full uppercase">
                  Caja ID: {activeRegister.id}
                </div>
              )}
            </div>

            {/* SELECCIÓN DE CLIENTE */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon size={16} />
                </div>
                <select
                  value={selectedCustomerId || ""}
                  onChange={(e) =>
                    setSelectedCustomerId(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-white appearance-none focus:ring-2 focus:ring-brand/50 outline-none transition-all cursor-pointer"
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

            {/* LISTADO DEL CARRITO */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-40">
                  <ScanLine size={80} className="mb-4 animate-pulse" />
                  <p className="font-black uppercase tracking-widest text-sm">
                    Esperando ítems...
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 shadow-sm group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-black text-slate-800 dark:text-white leading-tight">
                        {item.name}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id!)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-emerald-500">
                        $
                        {Number(
                          item.retailPrice || item.price || 0,
                        ).toLocaleString("es-AR")}
                      </span>
                      <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800 rounded-xl p-1 border border-slate-100 dark:border-slate-700">
                        <button
                          onClick={() => updateQuantity(item.id!, -1)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                        >
                          <Minus size={14} strokeWidth={3} />
                        </button>
                        <span className="text-xs font-black w-5 text-center dark:text-white">
                          {item.cartQuantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id!, 1)}
                          className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                        >
                          <Plus size={14} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* SECTOR DE COBRO Y TOTALES */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
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
                    className={`flex flex-col items-center justify-center py-3 rounded-2xl border transition-all ${paymentMethod === m.id ? "bg-brand border-brand text-white shadow-lg shadow-brand/20" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-brand/40"}`}
                  >
                    <m.icon size={18} className="mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-tighter">
                      {m.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-end mb-6">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Monto Total
                </span>
                <span className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
                  <span className="text-emerald-500 text-2xl mr-1">$</span>
                  {totalAmount.toLocaleString("es-AR")}
                </span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || isProcessing || !activeRegister}
                className={`w-full py-5 rounded-3xl flex items-center justify-center space-x-3 text-lg font-black transition-all duration-300 ${cart.length > 0 && !isProcessing && activeRegister ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/20 hover:scale-[1.02]" : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"}`}
              >
                {isProcessing ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <Banknote size={24} />
                )}
                <span>
                  {isProcessing ? "PROCESANDO VENTA..." : "FINALIZAR COBRO"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
