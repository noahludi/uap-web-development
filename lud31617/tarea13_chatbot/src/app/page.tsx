"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";

// Tipos para definir los roles de participantes en la conversación
type ConversationRole = "user" | "assistant" | "system";

// Mapeo de etiquetas personalizadas para cada tipo de participante
const participantLabels: Record<ConversationRole, string> = {
  user: "Usuario",
  assistant: "ConversaIA",
  system: "Sistema",
};

export default function ConversationInterface() {
  const { messages, sendMessage, status, error } = useChat({
    id: "conversa-ia-session",
  });

  const conversationContainerRef = useRef<HTMLDivElement | null>(null);
  const [userInput, setUserInput] = useState("");

  // Función para enviar mensaje del usuario al asistente
  const submitUserQuery = async (messageText: string) => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage) return;
    try {
      await sendMessage({ text: trimmedMessage });
    } catch (sendError) {
      console.error("Error al transmitir mensaje:", sendError);
    }
  };

  // Mantener scroll automático hacia los mensajes más recientes
  useEffect(() => {
    const scrollContainer = conversationContainerRef.current;
    if (!scrollContainer) return;
    scrollContainer.scrollTop = scrollContainer.scrollHeight;
  }, [messages, status]);

  // Procesamiento y filtrado de mensajes para mostrar en la interfaz
  const conversationHistory = useMemo(
    () =>
      messages
        .filter((msg) => msg.role !== "system")
        .map((msg) => {
          const messageContent =
            msg.parts
              ?.map((fragment) => {
                if (fragment.type !== "text") {
                  return "";
                }
                return fragment.text ?? "";
              })
              .join("")
              .trim() ?? "";

          return {
            id: msg.id,
            role: (msg.role as ConversationRole) ?? "assistant",
            text: messageContent,
          };
        })
        .filter((msg) => msg.text.length > 0),
    [messages],
  );

  const isProcessingMessage =
    status === "submitted" || status === "streaming";

  const handleFormSubmit = async (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    const inputValue = userInput.trim();
    if (!inputValue) return;
    await submitUserQuery(inputValue);
    setUserInput("");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header renovado */}
        <header className="mb-8 text-center">
          <h1 className="mb-3 bg-linear-to-r from-cyan-400 to-purple-400 bg-clip-text text-5xl font-black text-transparent">
            ConversaIA
          </h1>
          <p className="text-lg text-gray-300">
            Tu asistente virtual inteligente • Powered by OpenRouter AI
          </p>
        </header>

        {/* Contenedor principal de la conversación */}
        <div className="mx-auto max-w-3xl rounded-3xl bg-black/20 backdrop-blur-lg border border-white/10 shadow-2xl">
          <div
            ref={conversationContainerRef}
            className="h-[500px] overflow-y-auto p-4 space-y-4"
            aria-live="polite"
          >
            {conversationHistory.length === 0 ? (
              <WelcomeScreen onSampleQuery={(query) => void submitUserQuery(query)} />
            ) : (
              conversationHistory.map((msg) => (
                <MessageBubble key={msg.id} role={msg.role} content={msg.text} />
              ))
            )}

            {isProcessingMessage ? <LoadingIndicator /> : null}

            {error ? (
              <div className="rounded-2xl border border-red-400/30 bg-red-900/20 px-6 py-4 text-red-300">
                <strong className="block mb-1">Error de conexión:</strong>
                {error instanceof Error
                  ? error.message
                  : "No se pudo establecer comunicación con el asistente."}
              </div>
            ) : null}
          </div>

          {/* Formulario de entrada rediseñado */}
          <form
            className="border-t border-white/10 bg-black/10 p-6"
            onSubmit={handleFormSubmit}
          >
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="messageInput" className="sr-only">
                  Escribe tu consulta
                </label>
                <textarea
                  id="messageInput"
                  name="messageInput"
                  rows={3}
                  required
                  maxLength={3000}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="w-full resize-none rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-gray-400 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 backdrop-blur-sm"
                  placeholder="Pregúntame cualquier cosa..."
                  aria-label="Campo de mensaje para ConversaIA"
                />
              </div>
              <button
                type="submit"
                disabled={isProcessingMessage || userInput.trim().length === 0}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-r from-cyan-500 to-purple-500 text-white shadow-lg transition hover:from-cyan-400 hover:to-purple-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:from-cyan-500 disabled:hover:to-purple-500"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Componente para mostrar burbujas de mensaje individuales
function MessageBubble({ role, content }: { role: ConversationRole; content: string }) {
  const isUserMessage = role === "user";
  return (
    <div
      className={`flex w-full mb-4 px-4 ${isUserMessage ? "justify-end" : "justify-start"}`}
      role="group"
      aria-label={`Mensaje de ${participantLabels[role]}`}
    >
      <div
        className={`max-w-[60%] overflow-hidden rounded-2xl md:rounded-3xl px-6 py-5 md:px-7 md:py-6 ${isUserMessage
          ? "bg-linear-to-r from-cyan-500 to-purple-500 text-white shadow-lg"
          : "bg-white/10 text-gray-100 border border-white/20 backdrop-blur-sm"
          }`}
      >
        <div
          className={`mb-2 text-[11px] md:text-xs font-bold uppercase tracking-wider ${isUserMessage ? "text-cyan-100" : "text-cyan-300"
            }`}
        >
          {participantLabels[role]}
        </div>
        <div className="whitespace-pre-wrap leading-relaxed text-sm wrap-break-word">
          {content}
        </div>
      </div>
    </div>
  );
}

// Indicador de carga mejorado
function LoadingIndicator() {
  return (
    <div className="flex w-full mb-4 px-4 justify-start">
      <div className="flex items-center gap-3 rounded-3xl bg-white/5 border border-white/10 px-4 py-3 backdrop-blur-sm max-w-[60%]">
        <div className="flex space-x-1">
          <div className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse"></div>
          <div className="h-2 w-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
          <div className="h-2 w-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <span className="text-sm text-gray-300 font-medium">ConversaIA está pensando...</span>
      </div>
    </div>
  );
}

// Pantalla de bienvenida personalizada
function WelcomeScreen({
  onSampleQuery,
}: {
  onSampleQuery: (query: string) => void;
}) {
  const sampleQueries = [
    "¿Cómo funciona la inteligencia artificial?",
    "Crea un plan de aprendizaje de React para principiantes",
    "Explica las diferencias entre TypeScript y JavaScript",
    "¿Cuáles son las mejores prácticas de desarrollo web?",
    "Ayúdame a optimizar el rendimiento de mi aplicación",
    "¿Cómo implementar autenticación segura?",
  ];

  return (
    <div className="space-y-6 text-center">
      <div className="rounded-3xl bg-white/5 border border-white/10 p-8 backdrop-blur-sm">
        <div className="mb-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-linear-to-r from-cyan-400 to-purple-400 flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        <h2 className="mb-3 text-xl font-bold text-white">
          ¡Hola! Soy ConversaIA
        </h2>
        <p className="text-gray-300 mb-6">
          Estoy aquí para ayudarte con cualquier pregunta. Puedes preguntarme sobre programación,
          tecnología, o cualquier tema que te interese.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          {sampleQueries.map((query, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onSampleQuery(query)}
              className="rounded-2xl bg-white/10 border border-white/20 px-4 py-3 text-sm text-gray-200 transition hover:bg-white/20 hover:border-cyan-400/50 text-left backdrop-blur-sm"
            >
              <span className="text-cyan-300 mr-2">💡</span>
              {query}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}