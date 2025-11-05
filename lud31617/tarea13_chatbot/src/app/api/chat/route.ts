import { NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "ai";
import { z } from "zod";

// Schema para validar fragmentos de contenido textual
const contentFragmentValidator = z.object({
  type: z.literal("text"),
  text: z.string().max(3000), // Aumenté el límite
});

// Validador para mensajes de conversación
const conversationEntryValidator = z.object({
  id: z.string().optional(),
  role: z.enum(["system", "user", "assistant"]),
  parts: z
    .array(
      z
        .object({
          type: z.string(),
        })
        .passthrough()
        .refine(
          (fragment) =>
            typeof fragment === "object" &&
            fragment !== null &&
            "type" in fragment &&
            typeof fragment.type === "string",
        ),
    )
    .optional()
    .default([]),
});

// Schema principal para validar la petición completa
const chatRequestValidator = z.object({
  messages: z.array(conversationEntryValidator).min(1),
});

// Configuración predeterminada para el modelo y API
const AI_MODEL_DEFAULT = "anthropic/claude-3-haiku";
const API_ENDPOINT_DEFAULT = "https://openrouter.ai/api/v1";

// Cliente OpenAI configurado para OpenRouter
const aiClient = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL ?? API_ENDPOINT_DEFAULT,
  headers: {
    "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost",
    "X-Title": process.env.OPENROUTER_APP_NAME ?? "ConversaIA - Asistente Virtual",
  },
});

// Función para limpiar y normalizar texto de entrada
const cleanUserInput = (rawText: string): string =>
  rawText
    .replace(/[\u0000-\u001F\u007F]/g, "") // Remover caracteres de control
    .replace(/\s+/g, " ") // Normalizar espacios
    .trim();

export async function POST(incomingRequest: Request) {
  // Verificar que la clave de API esté configurada
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "Configuración de API incompleta - falta clave de autenticación." },
      { status: 500 },
    );
  }

  let validatedPayload;
  try {
    const requestData = await incomingRequest.json();
    validatedPayload = chatRequestValidator.parse(requestData);
  } catch (validationError) {
    return NextResponse.json(
      {
        error:
          validationError instanceof z.ZodError
            ? "Formato de datos inválido - revisa la estructura del mensaje."
            : "Error al procesar la petición - datos corruptos.",
      },
      { status: 400 },
    );
  }

  // Procesamiento y filtrado de mensajes válidos
  const processedConversation = validatedPayload.messages
    .map((conversationEntry) => {
      const validTextFragments = conversationEntry.parts
        .map((contentPart) => {
          if (contentPart.type !== "text") return null;
          const cleanedContent = cleanUserInput(String(contentPart.text ?? ""));
          if (!cleanedContent) return null;
          return { type: "text" as const, text: cleanedContent };
        })
        .filter((fragment): fragment is { type: "text"; text: string } => fragment !== null);

      return {
        role: conversationEntry.role,
        parts: validTextFragments,
      };
    })
    .filter((processedMessage) => processedMessage.parts.length > 0);

  if (processedConversation.length === 0) {
    return NextResponse.json(
      { error: "Conversación vacía - todos los mensajes fueron filtrados o están vacíos." },
      { status: 400 },
    );
  }

  try {
    const selectedModel = process.env.OPENROUTER_MODEL ?? AI_MODEL_DEFAULT;

    const aiResponse = await streamText({
      model: aiClient.chat(selectedModel),
      messages: convertToCoreMessages(processedConversation),
    });

    return aiResponse.toUIMessageStreamResponse();
  } catch (aiError) {
    console.error("Fallo en la comunicación con el servicio de IA:", aiError);
    return NextResponse.json(
      { error: "Error del servidor - no se pudo generar respuesta del asistente virtual." },
      { status: 502 },
    );
  }
}
