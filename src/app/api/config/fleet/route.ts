import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import JSON5 from 'json5';
import { createLogger } from '@/lib/logger';

const log = createLogger('ConfigFleet');

/**
 * Reads the actual openclaw.json config from the local workspace to serve
 * as the dynamic source of truth for the /fleet page.
 */
export async function GET() {
    try {
        // Attempt to locate openclaw.json. In local dev, it's typically a sibling to the UI repo.
        // Use an env var override if specified.
        const openclawConfigPath = process.env.OPENCLAW_CONFIG_PATH
            || path.join(process.cwd(), '..', 'openclaw-kareem', 'openclaw.json');

    let rawConfig: string;
    try {
      rawConfig = fs.readFileSync(openclawConfigPath, 'utf8');
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        log.warn('openclaw.json not found', { path: openclawConfigPath });
        return NextResponse.json({
          error: 'openclaw.json not found',
          path: openclawConfigPath,
          fallbackData: true
        });
      }
      throw err;
    }
    const config = JSON5.parse(rawConfig);

    const agentList = config.agents?.list || {};
    
    // Map the raw JSON config into a structured payload for the UI
    const fleet = Object.keys(agentList).map(id => {
      const agentData = agentList[id];
      const overrides = agentData.overrides || {};
      
      // Determine what tools are explicitly allowed/denied from the defaults
      // Fallbacks to gateway default config if missing
      const allowlist = overrides.tools?.exec?.security === 'allowlist' 
        ? config.tools?.exec?.allowlist || [] 
        : [];
      
      const disabledTools = overrides.tools || {};
      const denied = Object.keys(disabledTools)
        .filter(key => disabledTools[key] === false || disabledTools[key]?.enabled === false);

      // We default to all true unless explicitly disabled, to mimic actual openclaw behavior loosely
      const allowed = ['exec', 'read', 'write', 'edit', 'web_search', 'browser', 'sessions_send', 'gateway', 'cron']
        .filter(tool => !denied.includes(tool));

      return {
        id,
        name: agentData.name || id,
        role: agentData.description || 'Autonomous Agent',
        model: overrides.model || config.agents?.defaults?.model || 'claude-3-5-sonnet-latest',
        tools: {
          allow: allowed,
          deny: denied
        },
      };
    });

    return NextResponse.json({ fleet, source: openclawConfigPath });

  } catch (error: any) {
    log.error('Error parsing openclaw.json', error);
    return NextResponse.json({ error: error.message, fallbackData: true }, { status: 500 });
  }
}
