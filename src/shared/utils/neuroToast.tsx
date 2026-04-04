import toast from "react-hot-toast";
import { Lock, ArrowRight, Info } from "lucide-react"; // 🛡️ Agregamos el icono Info

// ============================================================================
// MOTOR NEURO-VOCAL: Sanitización y Síntesis
// ============================================================================
export const speakAlert = (text: string) => {
  if (localStorage.getItem("muted_alerts") === "true") return;

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-AR";
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
};

// 🛡️ Filtro de Seguridad y Limpieza Fonética (Traducción de $ ARS a Pesos)
const sanitizeForVoice = (msg: string, defaultVoice: string) => {
  if (!msg) return defaultVoice;

  const hasCode =
    msg.includes("<!DOCTYPE") ||
    msg.includes("<html>") ||
    msg.includes("object") ||
    msg.includes("function");

  if (hasCode || msg.length > 120) {
    return defaultVoice;
  }

  // 🧠 LIMPIEZA FONÉTICA DE MONEDA
  const cleanMsg = msg
    .replace(/\$\s?([\d.,]+)\s?ARS/gi, "$1 pesos")
    .replace(/\$\s?([\d.,]+)/g, "$1 pesos")
    .replace(/\bARS\b/g, "pesos");

  return cleanMsg;
};

// ============================================================================
// INTERCEPTOR GLOBAL DE ALERTAS (Visual + Auditivo + Acción)
// ============================================================================
// 🛡️ REFACTORIZACIÓN: Ampliamos el tipado para aceptar "info" y ajustamos el orden
// de los parámetros para que coincida con cómo lo estás llamando en PriceListsPage
export const neuroToast = (
  msg: string,
  type: "success" | "error" | "warning" | "info" = "success", // Ahora acepta "info"
  speakMsg?: string, // Cambiamos de lugar speakMsg para mantener compatibilidad con tu código viejo
  details?: string, // Agregamos un 4to parámetro opcional para el "subtítulo" (como lo usás en PriceLists)
) => {
  const msgLower = msg.toLowerCase();

  // 1. PROTOCOLO CAJA CERRADA (Se mantiene intacto)
  const isCajaError =
    type === "error" &&
    (msgLower.includes("caja") || msgLower.includes("turno"));

  if (isCajaError) {
    toast.custom(
      (t) => (
        <div
          className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-red-50 dark:bg-[#150a0d] shadow-[0_20px_50px_rgba(220,38,38,0.15)] rounded-[2rem] pointer-events-auto flex flex-col border border-red-200 dark:border-red-900/50 overflow-hidden`}
        >
          <div className="p-5 flex items-start">
            <div className="flex-shrink-0 bg-red-100 dark:bg-red-500/20 p-3 rounded-2xl">
              <Lock className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-lg font-black text-red-800 dark:text-red-300">
                Operación Bloqueada
              </p>
              <p className="mt-1 text-sm font-bold text-red-600/80 dark:text-red-400/80 leading-snug">
                El sistema detectó que la caja está cerrada. Debes abrirla para
                mover inventario o registrar dinero.
              </p>
            </div>
          </div>
          <div className="bg-red-100/50 dark:bg-red-900/20 px-5 py-4 flex justify-end border-t border-red-100 dark:border-red-900/30">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                window.location.href = "/caja"; // Redirección instantánea
              }}
              className="flex items-center space-x-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-red-600/30 hover:scale-105"
            >
              <span>Ir a Abrir la Caja</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      ),
      { duration: 8000, position: "top-right" },
    );

    speakAlert(
      "Operación bloqueada. Por favor, abra la caja registradora para continuar.",
    );
    return;
  }

  // 2. ALERTA NORMAL SANITIZADA
  const defaultVoice =
    type === "success"
      ? "Operación completada"
      : type === "error"
        ? "Se ha producido un error en el sistema"
        : type === "info"
          ? "Aviso de sistema"
          : "Atención requerida";

  // Determinamos qué texto hablar: El texto limpio explícito, o el detalle, o el mensaje base.
  const textToSpeak = speakMsg || details || msg;
  const safeSpeak = sanitizeForVoice(textToSpeak, defaultVoice);

  // Limpieza visual por si el backend mandó código basura
  const isCodeError = msg.includes("<!DOCTYPE") || msg.includes("<html>");
  const visualMsg = isCodeError
    ? "Fallo de comunicación con el servidor central."
    : msg;

  // 🛡️ REFACTORIZACIÓN VISUAL: Formateo avanzado si hay subtítulo (como en PriceListsPage)
  const formattedMsg = (
    <div className="flex flex-col">
      <span className="text-base font-black tracking-tight leading-tight">
        {visualMsg}
      </span>
      {details && (
        <span className="text-xs font-semibold opacity-80 mt-0.5">
          {details}
        </span>
      )}
      {/* Si speakMsg se usó como subtítulo (legacy) y details no existe, lo mostramos */}
      {speakMsg &&
        !details &&
        speakMsg !== safeSpeak &&
        !speakMsg.includes("pesos") && (
          <span className="text-xs font-semibold opacity-80 mt-0.5">
            {speakMsg}
          </span>
        )}
    </div>
  );

  // 3. RENDERIZADO DEL TOAST SEGÚN EL TIPO
  if (type === "success") {
    toast.success(formattedMsg);
  } else if (type === "error") {
    toast.error(formattedMsg);
  } else if (type === "info") {
    // 🛡️ IMPLEMENTACIÓN DEL TIPO "INFO"
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } max-w-sm w-full bg-blue-50 dark:bg-blue-950/40 shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-blue-500/30 overflow-hidden`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <Info className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-black text-blue-800 dark:text-blue-300">
                  {visualMsg}
                </p>
                {/* Mostramos details o speakMsg como subtítulo en info si existe */}
                {(details || speakMsg) && (
                  <p className="mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400/80">
                    {details || speakMsg}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ),
      { duration: 4000 },
    );
  } else {
    // Warning (default fall-back)
    toast(formattedMsg, { icon: "⚠️" });
  }

  // Ejecutamos la síntesis de voz
  speakAlert(safeSpeak);
};
