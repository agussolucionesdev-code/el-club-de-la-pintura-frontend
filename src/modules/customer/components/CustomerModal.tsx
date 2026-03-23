import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Save,
  Loader2,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Hash,
} from "lucide-react";
import { neuroToast } from "../../../shared/utils/neuroToast";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000/api";

// 🛡️ SOLUCIÓN 1: Definimos el molde estricto del Cliente (Chau "any")
export interface CustomerProfile {
  id: number;
  name: string;
  document?: string | null;
  type: "CONSUMER" | "CONTRACTOR" | "COMPANY" | "FAMILY";
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string | null;
  customerToEdit?: CustomerProfile | null; // <-- TIPO ESTRICTO APLICADO
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  token,
  customerToEdit,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "CONSUMER",
    phone: "",
    email: "",
    address: "",
  });

  const [docType, setDocType] = useState<"DNI" | "CUIT">("CUIT");
  const [documentValue, setDocumentValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customerToEdit) {
      setFormData({
        name: customerToEdit.name,
        type: customerToEdit.type,
        phone: customerToEdit.phone || "",
        email: customerToEdit.email || "",
        address: customerToEdit.address || "",
      });
      const rawDoc = customerToEdit.document || "";
      const isDni = rawDoc.length <= 8;
      setDocType(isDni ? "DNI" : "CUIT");
      setDocumentValue(formatDocument(rawDoc, isDni ? "DNI" : "CUIT"));
    } else {
      setFormData({
        name: "",
        type: "CONSUMER",
        phone: "",
        email: "",
        address: "",
      });
      setDocType("CUIT");
      setDocumentValue("");
    }
  }, [customerToEdit, isOpen]);

  const formatDocument = (value: string, type: "DNI" | "CUIT") => {
    const raw = value.replace(/\D/g, "");

    if (type === "DNI") {
      const limited = raw.substring(0, 8);
      return limited.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    } else {
      const limited = raw.substring(0, 11);
      let formatted = limited;
      if (limited.length > 2) {
        formatted = `${limited.substring(0, 2)}-${limited.substring(2)}`;
      }
      if (limited.length > 10) {
        formatted = `${formatted.substring(0, 11)}-${limited.substring(10)}`;
      }
      return formatted;
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDocument(e.target.value, docType);
    setDocumentValue(formatted);
  };

  const handleDocTypeChange = (newType: "DNI" | "CUIT") => {
    setDocType(newType);
    setDocumentValue(formatDocument(documentValue, newType));
  };

  const isReadyToSubmit = formData.name.trim().length >= 2 && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReadyToSubmit) return;

    setIsSubmitting(true);
    try {
      const rawDocument = documentValue.replace(/\D/g, "");

      const payload = {
        ...formData,
        document: rawDocument || undefined,
      };

      const url = customerToEdit
        ? `${API_URL}/customers/${customerToEdit.id}`
        : `${API_URL}/customers`;
      const method = customerToEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok)
        throw new Error(result.error || "Fallo al guardar el cliente.");

      neuroToast(result.message || "Cliente guardado con éxito.", "success");
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Error desconocido.";
      neuroToast(errorMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-[#0a0f1c] border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
        >
          <div className="p-5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand/10 text-brand rounded-xl">
                <Building2 size={24} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                  {customerToEdit ? "Editar Cliente" : "Nuevo Cliente"}
                </h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Directorio Comercial
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-red-500 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "CONSUMER" })}
                className={`flex items-center justify-center space-x-2 py-3 rounded-xl border-2 transition-all ${formData.type === "CONSUMER" ? "border-brand bg-brand/10 text-brand" : "border-slate-200 dark:border-slate-700 text-slate-400"}`}
              >
                <User size={16} />{" "}
                <span className="font-bold text-xs uppercase">Consumidor</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "CONTRACTOR" })}
                className={`flex items-center justify-center space-x-2 py-3 rounded-xl border-2 transition-all ${formData.type === "CONTRACTOR" ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-500" : "border-slate-200 dark:border-slate-700 text-slate-400"}`}
              >
                <Building2 size={16} />{" "}
                <span className="font-bold text-xs uppercase">Contratista</span>
              </button>
            </div>

            <div>
              <label className="text-xs font-black uppercase text-slate-400 mb-1.5 block">
                Razón Social / Nombre Completo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-slate-800 dark:text-white focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                placeholder="Ej: Pinturas Martínez S.A."
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase text-slate-400 mb-1.5 block">
                Identificación Fiscal
              </label>
              <div className="flex gap-2">
                <select
                  value={docType}
                  onChange={(e) =>
                    handleDocTypeChange(e.target.value as "DNI" | "CUIT")
                  }
                  className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-slate-700 dark:text-slate-300 outline-none w-1/3 cursor-pointer"
                >
                  <option value="CUIT">CUIT</option>
                  <option value="DNI">DNI</option>
                </select>
                <div className="relative flex-1">
                  <Hash
                    className="absolute left-3 top-3.5 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={documentValue}
                    onChange={handleDocumentChange}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 font-black text-slate-800 dark:text-white tracking-widest focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                    placeholder={
                      docType === "CUIT" ? "20-12345678-9" : "38.123.456"
                    }
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black uppercase text-slate-400 mb-1.5 block">
                  Teléfono (WhatsApp)
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-3 top-3.5 text-slate-400"
                    size={16}
                  />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 font-bold text-slate-800 dark:text-white text-sm outline-none"
                    placeholder="11 1234-5678"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-black uppercase text-slate-400 mb-1.5 block">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-3.5 text-slate-400"
                    size={16}
                  />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 font-bold text-slate-800 dark:text-white text-sm outline-none"
                    placeholder="ejemplo@correo.com"
                  />
                </div>
              </div>
            </div>

            {/* 🛡️ SOLUCIÓN 2: Agregamos el campo de Dirección usando el MapPin que nos avisó el linter */}
            <div>
              <label className="text-xs font-black uppercase text-slate-400 mb-1.5 block">
                Dirección Física / Comercial
              </label>
              <div className="relative">
                <MapPin
                  className="absolute left-3 top-3.5 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 font-bold text-slate-800 dark:text-white text-sm outline-none"
                  placeholder="Calle Comercial 1234, Localidad"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!isReadyToSubmit}
              className={`w-full py-4 rounded-xl font-black text-sm flex items-center justify-center space-x-2 transition-all mt-4 ${isReadyToSubmit ? "bg-brand hover:bg-amber-600 text-white shadow-lg shadow-brand/30 hover:scale-[1.02]" : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"}`}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Save size={20} />
              )}
              <span>{isSubmitting ? "GUARDANDO..." : "GUARDAR CLIENTE"}</span>
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
