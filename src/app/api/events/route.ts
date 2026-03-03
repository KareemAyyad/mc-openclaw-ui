import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { queryAll, run } from '@/lib/db';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';
import type { Event } from '@/lib/types';

export const dynamic = 'force-dynamic';
// GET /api/events - List events (live feed)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const since = searchParams.get('since'); // ISO timestamp for polling

    let sql = `
      SELECT e.*, a.name as agent_name, a.avatar_emoji as agent_emoji, t.title as task_title
      FROM events e
      LEFT JOIN agents a ON e.agent_id = a.id
      LEFT JOIN tasks t ON e.task_id = t.id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (since) {
      sql += ' AND e.created_at > ?';
      params.push(since);
    }

    sql += ' ORDER BY e.created_at DESC LIMIT ?';
    params.push(limit);

    const events = queryAll<Event & { agent_name?: string; agent_emoji?: string; task_title?: string }>(sql, params);

    // Transform to include nested info
    const transformedEvents = events.map((event) => ({
      ...event,
      agent: event.agent_id
        ? {
            id: event.agent_id,
            name: event.agent_name,
            avatar_emoji: event.agent_emoji,
          }
        : undefined,
      task: event.task_id
        ? {
            id: event.task_id,
            title: event.task_title,
          }
        : undefined,
    }));

    return NextResponse.json(transformedEvents);
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// Valid event types
const VALID_EVENT_TYPES = [
  'task_created', 'task_assigned', 'task_status_changed', 'task_completed',
  'message_sent', 'agent_status_changed', 'agent_joined', 'system',
];

// POST /api/events - Create a manual event
export async function POST(request: NextRequest) {
  // Rate limit event creation
  const ip = getClientIP(request);
  const rateCheck = checkRateLimit(`events-write:${ip}`, RATE_LIMITS.write);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();

    if (!body.type || typeof body.type !== 'string') {
      return NextResponse.json({ error: 'type is required and must be a string' }, { status: 400 });
    }

    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json({ error: 'message is required and must be a string' }, { status: 400 });
    }

    // Validate event type
    if (!VALID_EVENT_TYPES.includes(body.type)) {
      return NextResponse.json({ error: `Invalid event type. Must be one of: ${VALID_EVENT_TYPES.join(', ')}` }, { status: 400 });
    }

    // Validate message length
    if (body.message.length > 5000) {
      return NextResponse.json({ error: 'Message must be 5000 characters or fewer' }, { status: 400 });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    run(
      `INSERT INTO events (id, type, agent_id, task_id, message, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.type,
        body.agent_id || null,
        body.task_id || null,
        body.message,
        body.metadata ? JSON.stringify(body.metadata) : null,
        now,
      ]
    );

    return NextResponse.json({ id, type: body.type, message: body.message, created_at: now }, { status: 201 });
  } catch (error) {
    console.error('Failed to create event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
