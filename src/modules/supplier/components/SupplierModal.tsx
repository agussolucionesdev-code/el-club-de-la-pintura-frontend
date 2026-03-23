import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Save,
  Loader2,
  Factory,
  Phone,
  Mail,
  MapPin,
  Hash,
  UserCircle,
} from "lucide-react";
import { neuroToast } from "../../../shared/utils/neuroToast";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000/api";

// 🛡️ INTERFAZ ALINEADA CON EL BACKEND
export interface SupplierProfile {
  id: number;
  companyName: string; // 🔄 Cambiado
  cuit?: string | null; // 🔄 Cambiado
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  isActive: boolean;
}

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string | null;
  supplierToEdit?: SupplierProfile | null;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  token,
  supplierToEdit,
}) => {
  // 🛡️ ESTADO ALINEADO
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    phone: "",
    email: "",
    address: "",
  });

  const [documentValue, setDocumentValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (supplierToEdit) {
      setFormData({
        companyName: supplierToEdit.companyName,
        contactName: supplierToEdit.contactName || "",
        phone: supplierToEdit.phone || "",
        email: supplierToEdit.email || "",
        address: supplierToEdit.address || "",
      });
      setDocumentValue(formatCuit(supplierToEdit.cuit || ""));
    } else {
      setFormData({
        companyName: "",
        contactName: "",
        phone: "",
        email: "",
        address: "",
      });
      setDocumentValue("");
    }
  }, [supplierToEdit, isOpen]);

  const formatCuit = (value: string) => {
    const raw = value.replace(/\D/g, "");
    const limited = raw.substring(0, 11);
    let formatted = limited;

    if (limited.length > 2) {
      formatted = `${limited.substring(0, 2)}-${limited.substring(2)}`;
    }
    if (limited.length > 10) {
      formatted = `${formatted.substring(0, 11)}-${limited.substring(10)}`;
    }
    return formatted;
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocumentValue(formatCuit(e.target.value));
  };

  const isReadyToSubmit =
    formData.companyName.trim().length >= 2 &&
    formData.phone.trim().length >= 8 &&
    !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReadyToSubmit) return;

    setIsSubmitting(true);
    try {
      const rawDocument = documentValue.replace(/\D/g, "");

      // 🛡️ PAYLOAD PERFECTO PARA ZOD
      const payload = {
        ...formData,
        cuit: rawDocument || undefined,
        // Zod exige que si mandamos email vacío, no lo mandemos o sea null válido
        email: formData.email.trim() === "" ? undefined : formData.email,
      };

      const url = supplierToEdit
        ? `${API_URL}/suppliers/${supplierToEdit.id}`
        : `${API_URL}/suppliers`;
      const method = supplierToEdit ? "PUT" : "POST";

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
        throw new Error(result.error || "Fallo al guardar el proveedor.");

      neuroToast(
        result.message || "Fábrica/Proveedor registrado con éxito.",
        "success",
        "Proveedor guardado correctamente.",
      );
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Error desconocido.";
      neuroToast(errorMsg, "error", "Atención, ocurrió un error.");
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
              <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                <Factory size={24} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                  {supplierToEdit
                    ? "Editar Fábrica"
                    : "Nueva Fábrica / Proveedor"}
                </h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Gestión de Suministros
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
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-black uppercase text-slate-400 mb-1.5 block">
                  Razón Social de la Fábrica
                </label>
                <div className="relative">
                  <Factory
                    className="absolute left-3 top-3.5 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 font-bold text-slate-800 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                    placeholder="Ej: Pinturas Alba S.A."
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-400 mb-1.5 block">
                  CUIT Oficial
                </label>
                <div className="relative">
                  <Hash
                    className="absolute left-3 top-3.5 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={documentValue}
                    onChange={handleDocumentChange}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 font-black text-slate-800 dark:text-white tracking-widest focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                    placeholder="30-12345678-9"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-400 mb-1.5 block">
                  Viajante / Contacto
                </label>
                <div className="relative">
                  <UserCircle
                    className="absolute left-3 top-3.5 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) =>
                      setFormData({ ...formData, contactName: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 font-bold text-slate-800 dark:text-white text-sm outline-none focus:border-indigo-500"
                    placeholder="Nombre del vendedor"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-400 mb-1.5 block flex justify-between">
                  <span>Teléfono / WhatsApp</span>
                  <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-3 top-3.5 text-slate-400"
                    size={16}
                  />
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 font-bold text-slate-800 dark:text-white text-sm outline-none focus:border-indigo-500"
                    placeholder="11 1234-5678"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-400 mb-1.5 block">
                  Corréo Electrónico
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
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 font-bold text-slate-800 dark:text-white text-sm outline-none focus:border-indigo-500"
                    placeholder="ventas@fabrica.com"
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-black uppercase text-slate-400 mb-1.5 block">
                  Dirección o Parque Industrial
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
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 font-bold text-slate-800 dark:text-white text-sm outline-none focus:border-indigo-500"
                    placeholder="Ruta 202 Km 4, Polo Industrial"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isReadyToSubmit}
              className={`w-full py-4 rounded-xl font-black text-sm flex items-center justify-center space-x-2 transition-all mt-4 ${isReadyToSubmit ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 hover:scale-[1.02]" : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"}`}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Save size={20} />
              )}
              <span>
                {isSubmitting ? "REGISTRANDO..." : "GUARDAR PROVEEDOR OFICIAL"}
              </span>
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
