import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { queryAll, queryOne, run } from '@/lib/db';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';
import type { Agent, CreateAgentRequest } from '@/lib/types';

export const dynamic = 'force-dynamic';
// GET /api/agents - List all agents
export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.nextUrl.searchParams.get('workspace_id');

    let agents: Agent[];
    if (workspaceId) {
      agents = queryAll<Agent>(`
        SELECT * FROM agents WHERE workspace_id = ? ORDER BY is_master DESC, name ASC
      `, [workspaceId]);
    } else {
      agents = queryAll<Agent>(`
        SELECT * FROM agents ORDER BY is_master DESC, name ASC
      `);
    }
    return NextResponse.json(agents);
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

// POST /api/agents - Create a new agent
export async function POST(request: NextRequest) {
  // Rate limit write operations
  const ip = getClientIP(request);
  const rateCheck = checkRateLimit(`agents-write:${ip}`, RATE_LIMITS.write);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body: CreateAgentRequest = await request.json();

    if (!body.name || typeof body.name !== 'string' || !body.role || typeof body.role !== 'string') {
      return NextResponse.json({ error: 'Name (string) and role (string) are required' }, { status: 400 });
    }

    // Validate field lengths
    if (body.name.length > 100) {
      return NextResponse.json({ error: 'Name must be 100 characters or less' }, { status: 400 });
    }
    if (body.role.length > 200) {
      return NextResponse.json({ error: 'Role must be 200 characters or less' }, { status: 400 });
    }
    if (body.description && body.description.length > 2000) {
      return NextResponse.json({ error: 'Description must be 2000 characters or less' }, { status: 400 });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    run(
      `INSERT INTO agents (id, name, role, description, avatar_emoji, is_master, workspace_id, soul_md, user_md, agents_md, model, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.name,
        body.role,
        body.description || null,
        body.avatar_emoji || 'Bot',
        body.is_master ? 1 : 0,
        (body as { workspace_id?: string }).workspace_id || 'default',
        body.soul_md || null,
        body.user_md || null,
        body.agents_md || null,
        body.model || null,
        now,
        now,
      ]
    );

    // Log event
    run(
      `INSERT INTO events (id, type, agent_id, message, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), 'agent_joined', id, `${body.name} joined the team`, now]
    );

    const agent = queryOne<Agent>('SELECT * FROM agents WHERE id = ?', [id]);
    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error('Failed to create agent:', error);
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}
