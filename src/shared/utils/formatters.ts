// src/core/utils/formatters.ts

/**
 * Formatea un número a Moneda Argentina (ARS)
 * Ejemplo: 1500000.5 -> "$ 1.500.000,50"
 */
export const formatCurrency = (amount: number | string): string => {
  const numericAmount =
    typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(numericAmount)) return "$ 0,00";

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

/**
 * Formatea un DNI argentino agregando los puntos
 * Ejemplo: "38123456" -> "38.123.456"
 */
export const formatDNI = (dni: string | number): string => {
  const cleanDNI = String(dni).replace(/\D/g, ""); // Limpia cualquier cosa que no sea número
  return cleanDNI.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

/**
 * Formatea un número de teléfono (Formato genérico Argentina)
 * Ejemplo: "1155554444" -> "11 5555-4444"
 */
export const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return "-";
  const cleanPhone = phone.replace(/\D/g, "");

  // Si es un celular clásico de 10 dígitos (ej: 11 2345 6789)
  if (cleanPhone.length === 10) {
    return `${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`;
  }

  return cleanPhone; // Devuelve limpio si no coincide con el largo estándar
};

/**
 * Formatea un CUIT/CUIL agregando guiones
 * Ejemplo: "20381234568" -> "20-38123456-8"
 */
export const formatCUIT = (cuit: string | number): string => {
  const cleanCUIT = String(cuit).replace(/\D/g, "");
  if (cleanCUIT.length !== 11) return cleanCUIT;

  return `${cleanCUIT.slice(0, 2)}-${cleanCUIT.slice(2, 10)}-${cleanCUIT.slice(10)}`;
};
