import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        // 1. Basic Authorization (Shared Secret with Agents)
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.TELEMETRY_WEBHOOK_SECRET || 'dev_secret_token';

        if (authHeader !== \`Bearer \${expectedToken}\`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { agentId, eventType, payload } = body;

    if (!agentId || !eventType) {
      return NextResponse.json({ error: 'Missing required fields (agentId, eventType)' }, { status: 400 });
    }

    // 2. Persist to SQLite
    const event = await prisma.telemetryEvent.create({
      data: {
        agentId,
        eventType,
        payload: typeof payload === 'string' ? payload : JSON.stringify(payload || {})
      }
    });

    return NextResponse.json({ success: true, id: event.id }, { status: 201 });

  } catch (error: any) {
    console.error('[Telemetry Ingest Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Support preflight if called from browser/gateway
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
