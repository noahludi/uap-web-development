import { NextRequest, NextResponse } from 'next/server';
import {
  addToReadingList,
  getBookDetails,
  getReadingList,
  getReadingStats,
  markAsRead,
  searchBooks,
} from '../../../../src/server/tools';
import { rateLimit } from '../../../../src/server/rateLimit';

const TOOL_MAP = {
  searchBooks,
  getBookDetails,
  addToReadingList,
  getReadingList,
  markAsRead,
  getReadingStats,
};

type ToolName = keyof typeof TOOL_MAP;

const getUserId = (request: NextRequest) =>
  (request.headers.get('x-user-id') ?? 'demo-user').replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 64) || 'demo-user';

const getRateLimitKey = (request: NextRequest) => {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown-ip';
  return `${ip}:${getUserId(request)}`;
};

export async function POST(request: NextRequest, { params }: { params: { tool: ToolName } }) {
  const toolName = params.tool;
  if (!toolName || !(toolName in TOOL_MAP)) {
    return NextResponse.json({ error: 'Herramienta no permitida' }, { status: 404 });
  }

  try {
    const limit = rateLimit(getRateLimitKey(request));
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Se alcanzó el límite de solicitudes. Intenta nuevamente más tarde.' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const userId = getUserId(request);
    const executor = TOOL_MAP[toolName];
    const result =
      toolName === 'searchBooks' || toolName === 'getBookDetails'
        ? await executor(body)
        : await executor(body, userId);

    return NextResponse.json({ tool: toolName, result });
  } catch (error: any) {
    const message =
      error?.issues?.[0]?.message ||
      error?.message ||
      'No pudimos procesar la solicitud. Verifica los parámetros e intenta nuevamente.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export function GET() {
  return NextResponse.json({
    tools: Object.keys(TOOL_MAP),
    usage: 'Envía un POST con JSON válido a /api/tools/{toolName}',
  });
}
