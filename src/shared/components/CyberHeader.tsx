// Importación de dependencias estructurales de React
import React, { useState, useEffect } from "react";

// Definición de estructura para etiquetas de valor (Tags)
interface ValueTag {
  text: string;
  icon: React.ElementType;
  delay: string; // Se utiliza para inyectar clases utilitarias (animaciones o colores)
}

// Definición de propiedades del componente de cabecera
interface CyberHeaderProps {
  phrases: string[];
  labelIcon: React.ElementType;
  labelText: string;
  tags: ValueTag[];
}

export const CyberHeader = ({
  phrases,
  labelIcon: LabelIcon,
  labelText,
  tags,
}: CyberHeaderProps) => {
  // Inicialización de estado para frase aleatoria
  const [phrase] = useState(
    () => phrases[Math.floor(Math.random() * phrases.length)],
  );
  // Inicialización de estado para control de renderizado progresivo (Efecto Máquina)
  const [visibleChars, setVisibleChars] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  // Ejecución de ciclo de vida para síntesis de voz y animación de texto
  useEffect(() => {
    let typingInterval: ReturnType<typeof setInterval> | null = null;
    let audioCtx: AudioContext | null = null;
    let sequenceStarted = false;

    const startSequence = () => {
      if (sequenceStarted) return;
      sequenceStarted = true;
      setIsTyping(true);

      // Despliegue de síntesis de voz nativa
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(phrase);
        utterance.lang = "es-AR";
        utterance.rate = 0.95;
        const voices = window.speechSynthesis.getVoices();
        const bestVoice =
          voices.find(
            (v) =>
              v.lang.includes("es") &&
              (v.name.includes("Google") || v.name.includes("Sabina")),
          ) || voices.find((v) => v.lang.includes("es"));
        if (bestVoice) utterance.voice = bestVoice;
        window.speechSynthesis.speak(utterance);
      }

      // Despliegue de máquina de escribir y oscilador de audio
      let currentIdx = 0;
      typingInterval = setInterval(() => {
        setVisibleChars(currentIdx + 1);

        if (phrase[currentIdx] !== " ") {
          try {
            if (!audioCtx) {
              const AudioContextClass =
                window.AudioContext ||
                (
                  window as unknown as {
                    webkitAudioContext: typeof AudioContext;
                  }
                ).webkitAudioContext;
              audioCtx = new AudioContextClass();
            }
            if (audioCtx.state === "suspended") audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = "sine";
            osc.frequency.setValueAtTime(
              500 + Math.random() * 100,
              audioCtx.currentTime,
            );
            gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(
              0.001,
              audioCtx.currentTime + 0.03,
            );
            osc.start();
            osc.stop(audioCtx.currentTime + 0.03);
          } catch (e) {
            console.log(e);
            /* Fallback silente ante bloqueo del navegador */
          }
        }

        currentIdx++;
        if (currentIdx >= phrase.length) {
          if (typingInterval) clearInterval(typingInterval);
          setIsTyping(false);
        }
      }, 45);
    };

    // Liberación de bloqueos de audio mediante interacción del usuario
    const unlockAndStart = () => {
      startSequence();
      document.removeEventListener("click", unlockAndStart);
      document.removeEventListener("keydown", unlockAndStart);
    };

    if (navigator.userActivation && navigator.userActivation.hasBeenActive) {
      setTimeout(startSequence, 300);
    } else {
      document.addEventListener("click", unlockAndStart, { once: true });
      document.addEventListener("keydown", unlockAndStart, { once: true });
    }

    // Purga de memoria en desmontaje del componente
    return () => {
      if (typingInterval) clearInterval(typingInterval);
      window.speechSynthesis.cancel();
      if (audioCtx) audioCtx.close();
      document.removeEventListener("click", unlockAndStart);
      document.removeEventListener("keydown", unlockAndStart);
    };
  }, [phrase]);

  // Renderizado del árbol DOM
  return (
    <div className="mb-10 md:mb-16 flex flex-col justify-start">
      <div className="inline-flex items-center space-x-2 px-3 py-1.5 md:space-x-2.5 md:px-4 md:py-2 rounded-lg md:rounded-xl bg-white dark:bg-brand/10 border border-slate-200 dark:border-brand/20 text-amber-600 dark:text-brand text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mb-4 md:mb-6 shadow-sm w-fit transition-colors duration-500">
        <LabelIcon
          size={14}
          className="animate-pulse md:w-[16px] md:h-[16px]"
        />
        <span>{labelText}</span>
      </div>

      <div className="relative mb-6 md:mb-10 w-full max-w-5xl">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black leading-[1.6] md:leading-[1.8] tracking-[0.05em] md:tracking-[0.08em] pr-2 md:pr-4 opacity-0 pointer-events-none break-words w-full">
          {phrase}
        </h1>
        <div className="absolute top-0 left-0 w-full h-full flex items-start">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black text-slate-800 dark:text-white leading-[1.6] md:leading-[1.8] tracking-[0.05em] md:tracking-[0.08em] pr-2 md:pr-4 drop-shadow-sm break-words w-full">
            {phrase.substring(0, visibleChars)}
            <span
              className={`inline-block align-text-bottom ml-1 w-[3px] md:w-[4px] h-[0.9em] bg-brand rounded-sm ${isTyping ? "animate-pulse" : "hidden"}`}
            ></span>
          </h1>
        </div>
      </div>

      {/* RENDERIZADO CORREGIDO DE ETIQUETAS (KPIs) */}
      <div className="flex flex-wrap gap-2 md:gap-4 mt-2">
        {tags.map((tag, idx) => {
          // INTERCEPTOR: Si la propiedad delay contiene un color, lo usamos. Si no, usamos defaults.
          const hasCustomColor = tag.delay.includes("text-");

          return (
            <div
              key={idx}
              className={`flex items-center space-x-2 bg-white dark:bg-slate-800/80 backdrop-blur-xl border border-slate-100 dark:border-slate-700/50 px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl shadow-sm hover:-translate-y-1 font-bold text-[10px] md:text-xs tracking-wide transition-all duration-300 cursor-default shrink-0 animate-fade-in ${tag.delay} ${!hasCustomColor ? "text-slate-800 dark:text-slate-200" : ""}`}
            >
              <tag.icon
                size={14}
                className={`md:w-[16px] md:h-[16px] ${!hasCustomColor ? "text-amber-600 dark:text-brand" : ""}`}
              />
              <span>{tag.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
