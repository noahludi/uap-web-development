# AI Book Advisor

Asistente conversacional para recomendaciones de lectura basado en Next.js 15 (App Router), el AI SDK de Vercel, OpenRouter y la API de Google Books. Incluye chat con streaming, tool calling completo en backend, validación con Zod y persistencia en SQLite para listas, historial y estadísticas.

## Configuración rápida
1. Crea un archivo `.env.local` con tus credenciales (no se commitea):
   ```bash
   OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
   OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
   OPENROUTER_MODEL=anthropic/claude-3-haiku
   GOOGLE_BOOKS_API_KEY=your-google-books-api-key
   DATABASE_URL=postgresql://user:password@localhost:5432/bookadvisor
   RATE_LIMIT_MAX_REQUESTS=100
   RATE_LIMIT_WINDOW_MS=900000
   ```

2. Instala dependencias y ejecuta el entorno de desarrollo:
   ```bash
   npm install
   npm run dev
   ```

## Rutas clave
- `POST /api/chat`: orquesta la conversación con OpenRouter y ejecuta tool calling en streaming.
- `GET /api/tools/[tool]`: lista de tools disponibles.
- `POST /api/tools/searchBooks`: busca libros en Google Books (requiere `query`).
- `POST /api/tools/getBookDetails`: obtiene detalles completos por `bookId`.
- `POST /api/tools/addToReadingList`: agrega un libro a la lista del usuario (`x-user-id` en headers opcional).
- `POST /api/tools/getReadingList`: recupera la lista según `filter` y `limit`.
- `POST /api/tools/markAsRead`: marca como leído con `rating`/`review` opcional.
- `POST /api/tools/getReadingStats`: genera estadísticas (persistidas en SQLite y filtradas por periodo).

Todas las rutas validan payloads con Zod, sanitizan queries y usan exclusivamente el backend para acceder a Google Books y OpenRouter, evitando exponer API keys en el frontend. Se aplica rate limiting básico en las rutas de chat y tools.

## Funcionalidades clave
- Chat con streaming usando el AI SDK de Vercel y OpenRouter (tool calling habilitado).
- Llamadas a Google Books y OpenRouter exclusivamente desde el backend para proteger claves.
- Lista de lectura, historial y estadísticas persistidas en SQLite (puedes apuntar `DATABASE_URL` a otro motor).
- Validación y sanitización de inputs con Zod, más rate limiting configurable.
- UI de chat, panel de lista de lectura y métricas de hábitos.
