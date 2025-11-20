import { NextRequest } from 'next/server';
import { convertToCoreMessages, streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import {
  addToReadingList,
  getBookDetails,
  getReadingList,
  getReadingStats,
  markAsRead,
  searchBooks,
} from '../../../src/server/tools';
import {
  addToReadingListSchema,
  getBookDetailsSchema,
  getReadingListSchema,
  markAsReadSchema,
  readingStatsSchema,
  searchBooksSchema,
} from '../../../src/server/validation';
import { rateLimit } from '../../../src/server/rateLimit';

export const runtime = 'nodejs';

const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  headers: {
    'HTTP-Referer': 'https://example.com',
    'X-Title': 'AI Book Advisor',
  },
});

const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku';

const sanitizeUserId = (value?: string | null) => value?.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 64) || 'demo-user';

const buildTools = (userId: string) => ({
  searchBooks: tool({
    description: 'Busca libros en Google Books con un query limpio y devuelve coincidencias básicas',
    parameters: searchBooksSchema,
    execute: async ({ query, maxResults, orderBy }) => searchBooks({ query, maxResults, orderBy }),
  }),
  getBookDetails: tool({
    description: 'Obtiene la ficha completa de un libro',
    parameters: getBookDetailsSchema,
    execute: async ({ bookId }) => getBookDetails({ bookId }),
  }),
  addToReadingList: tool({
    description: 'Agrega un libro a la lista de lectura del usuario con prioridad y notas opcionales',
    parameters: addToReadingListSchema,
    execute: async ({ bookId, priority, notes }) => addToReadingList({ bookId, priority, notes }, userId),
  }),
  getReadingList: tool({
    description: 'Obtiene los libros guardados en la lista de lectura del usuario',
    parameters: getReadingListSchema,
    execute: async ({ filter, limit }) => getReadingList({ filter, limit }, userId),
  }),
  markAsRead: tool({
    description: 'Marca un libro como leído, permite adjuntar rating y review',
    parameters: markAsReadSchema,
    execute: async ({ bookId, rating, review, dateFinished }) =>
      markAsRead({ bookId, rating, review, dateFinished }, userId),
  }),
  getReadingStats: tool({
    description: 'Genera estadísticas de lectura del usuario por periodo y agrupación',
    parameters: readingStatsSchema,
    execute: async ({ period, groupBy }) => getReadingStats({ period, groupBy }, userId),
  }),
});

export async function POST(request: NextRequest) {
  const limitKey = `${request.headers.get('x-forwarded-for') || 'ip'}:${request.headers.get('user-agent') || ''}`;
  const limit = rateLimit(limitKey);
  if (!limit.success) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return new Response('Falta configurar OPENROUTER_API_KEY en el backend', { status: 500 });
  }

  const body = await request.json();
  const messages = convertToCoreMessages(body.messages || []);
  const userId = sanitizeUserId(request.headers.get('x-user-id'));

  try {
    const result = await streamText({
      model: openrouter(model),
      messages,
      maxSteps: 6,
      tools: buildTools(userId),
      temperature: 0.4,
      onError(error) {
        console.error('chat stream error', error);
      },
    });

    return result.toAIStreamResponse();
  } catch (error: any) {
    console.error('chat route error', error);
    return new Response(
      JSON.stringify({ message: 'No pudimos procesar tu mensaje, intenta nuevamente.' }),
      { status: 500 },
    );
  }
}
