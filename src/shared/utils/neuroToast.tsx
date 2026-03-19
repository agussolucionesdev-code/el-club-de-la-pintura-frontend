import toast from "react-hot-toast";
import { Lock, ArrowRight } from "lucide-react"; // Nuevos íconos para el Modal

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

// Filtro de Seguridad: Evita que la voz lea código HTML, JSON o errores gigantes
const sanitizeForVoice = (msg: string, defaultVoice: string) => {
  if (!msg) return defaultVoice;

  const hasCode =
    msg.includes("<!DOCTYPE") ||
    msg.includes("<html>") ||
    msg.includes("object") ||
    msg.includes("function");
  if (hasCode || msg.length > 120) {
    return defaultVoice; // Usa un texto limpio en lugar del código
  }
  return msg;
};

// ============================================================================
// INTERCEPTOR GLOBAL DE ALERTAS (Visual + Auditivo + Acción)
// ============================================================================
export const neuroToast = (
  msg: string,
  type: "success" | "error" | "warning" = "success",
  speakMsg?: string,
) => {
  const msgLower = msg.toLowerCase();

  // 1. PROTOCOLO CAJA CERRADA: Si el error menciona la caja, armamos el Modal Interactivo
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
                window.location.href = "/caja"; // Redirección instantánea a Tesorería
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
    ); // Dura 8 segundos para que dé tiempo a leer

    speakAlert(
      "Operación bloqueada. Por favor, abra la caja registradora para continuar.",
    );
    return; // Frenamos la alerta normal
  }

  // 2. ALERTA NORMAL SANITIZADA
  const defaultVoice =
    type === "success"
      ? "Operación completada"
      : type === "error"
        ? "Se ha producido un error en el sistema"
        : "Aviso de sistema";
  const safeSpeak = sanitizeForVoice(speakMsg || msg, defaultVoice);

  // Limpieza visual por si el backend mandó código basura
  const isCodeError = msg.includes("<!DOCTYPE") || msg.includes("<html>");
  const visualMsg = isCodeError
    ? "Fallo de comunicación con el servidor central."
    : msg;

  const formattedMsg = (
    <span className="text-base font-black tracking-tight">{visualMsg}</span>
  );

  if (type === "success") {
    toast.success(formattedMsg);
  } else if (type === "error") {
    toast.error(formattedMsg);
  } else {
    toast(formattedMsg, { icon: "⚠️" });
  }

  speakAlert(safeSpeak);
};
