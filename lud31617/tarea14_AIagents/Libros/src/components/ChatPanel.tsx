'use client';

import { useChat } from 'ai/react';
import { FormEvent, useEffect, useMemo, useRef } from 'react';

const roleLabel: Record<string, string> = {
  user: 'Tú',
  assistant: 'Asistente',
  system: 'Sistema',
  tool: 'Tool',
};

export function ChatPanel() {
  const { messages, handleSubmit, handleInputChange, input, isLoading, stop, setInput } = useChat({ api: '/api/chat' });
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const friendlyMessages = useMemo(
    () =>
      messages.map((message) => ({
        ...message,
        displayName: roleLabel[message.role] || message.role,
      })),
    [messages],
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim()) return;
    handleSubmit(event);
  };

  const quickPrompts = [
    {
      label: 'Añadir libro (tool)',
      prompt: 'Agrega “Project Hail Mary” con prioridad alta y nota: revisar en grupo de lectura',
    },
    {
      label: 'Buscar y resumir',
      prompt: 'Busca en Google Books novelas de misterio y añade las dos mejores al dashboard de lectura',
    },
  ];

  const roleBorders: Record<string, string> = {
    user: 'border-slate-900',
    assistant: 'border-indigo-200',
    system: 'border-amber-200',
    tool: 'border-emerald-200',
  };

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Chat</p>
          <h2 className="text-xl font-bold text-slate-900">Recomendaciones en tiempo real</h2>
          <p className="text-sm text-slate-600">Comparte lo que quieres leer y el asistente buscará opciones.</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-xs text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-800">/api/chat</span>
          {isLoading ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800">Ejecutando tools…</span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">Listo</span>
          )}
        </div>
      </header>

      <div ref={scrollRef} className="h-[420px] space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
        {friendlyMessages.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-600">
            Pide recomendaciones por género, autor o estado de ánimo. El asistente puede buscar en Google Books, guardar libros,
            marcar como leídos y calcular estadísticas.
          </div>
        )}

        {friendlyMessages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col gap-2 rounded-xl border-2 bg-white p-3 shadow-sm ${roleBorders[message.role] || 'border-slate-200'}`}
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <span className="rounded bg-slate-900 px-2 py-1 text-white">{message.displayName}</span>
              <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">{message.role}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{message.content}</p>
          </div>
        ))}
      </div>

      <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="text-sm font-semibold text-slate-700" htmlFor="message">
          Escribe tu consulta
        </label>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setInput(item.prompt);
                queueMicrotask(() => formRef.current?.requestSubmit());
              }}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
              disabled={isLoading}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-inner">
          <textarea
            id="message"
            name="message"
            value={input}
            onChange={(event) => {
              const sanitized = event.target.value.slice(0, 800);
              if (sanitized !== event.target.value) {
                event.target.value = sanitized;
              }
              handleInputChange(event);
            }}
            className="min-h-[90px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none"
            placeholder="Ej. Recomiéndame novelas de ciencia ficción optimistas y guárdalas con prioridad alta"
            required
            maxLength={800}
          />
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>Las peticiones se gestionan directamente en el backend</span>
            <div className="flex items-center gap-2">
              {isLoading && (
                <button
                  type="button"
                  onClick={() => stop()}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Detener
                </button>
              )}
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                disabled={isLoading}
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
