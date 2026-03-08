import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { AGENTS, TEAMS } from '@/lib/agentRegistry';
import { createLogger } from '@/lib/logger';

const log = createLogger('ConfigCron');

/**
 * Reads the actual cron-setup.sh script from the local workspace to serve
 * as the dynamic source of truth for the /schedule page.
 */
export async function GET() {
  try {
    const cronScriptPath = process.env.CRON_SCRIPT_PATH
      || path.join(process.cwd(), '..', 'openclaw-kareem', 'scripts', 'cron-setup.sh');

    let scriptContent: string;
    try {
      scriptContent = fs.readFileSync(cronScriptPath, 'utf8');
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        log.warn('cron-setup.sh not found', { path: cronScriptPath });
        return NextResponse.json({
          error: 'cron-setup.sh not found',
          path: cronScriptPath,
          fallbackData: true
        });
      }
      throw err;
    }

    // We will parse the bash script by looking for `openclaw cron add` commands
    // and extracting the relevant flags via Regex.
    const jobs: any[] = [];

    // Split by openclaw cron add to process each command block
    const commandBlocks = scriptContent.split('openclaw cron add').slice(1);

    for (const block of commandBlocks) {
      // Extract --name "..."
      const nameMatch = block.match(/--name\s+"([^"]+)"/);
      const name = nameMatch ? nameMatch[1] : 'Unknown Task';

      // Extract --cron "..."
      const cronMatch = block.match(/--cron\s+"([^"]+)"/);
      const cronExpression = cronMatch ? cronMatch[1] : '* * * * *';

      // Extract --agent ...
      const agentMatch = block.match(/--agent\s+([a-zA-Z0-9_-]+)/);
      const agent = agentMatch ? agentMatch[1] : 'unknown';

      // Parse the cron expression to determine times and days
      const parts = cronExpression.split(' ');
      if (parts.length >= 5) {
        const minute = parts[0];
        const hour = parts[1];
        const daysOfWeek = parts[4];

        // Format time string (e.g., "02:30")
        // Handling basic explicit values like "2" or "14". 
        // We skip complex cases like "*/6" for the UI grid if they don't map cleanly to a daily visual.
        let timeString = 'Flexible';
        if (!hour.includes('*') && !hour.includes('/')) {
          timeString = `${hour.padStart(2, '0')}:${minute === '0' || minute === '*' ? '00' : minute.padStart(2, '0')}`;
        } else if (hour.includes('*/')) {
          timeString = `Every ${hour.replace('*/', '')}h`;
        }

        // Parse runDays (0-6 mapping to Sun-Sat)
        let runDays: number[] = [];
        if (daysOfWeek === '*') {
          runDays = [0, 1, 2, 3, 4, 5, 6];
        } else {
          // Handle explicit days like "1,2,3,6" or ranges "0-4"
          const dayParts = daysOfWeek.split(',');
          for (const dp of dayParts) {
            if (dp.includes('-')) {
              const [start, end] = dp.split('-').map(Number);
              for (let i = start; i <= end; i++) {
                if (!isNaN(i)) runDays.push(i);
              }
            } else {
              const dayNum = Number(dp);
              if (!isNaN(dayNum)) runDays.push(dayNum);
            }
          }
        }

        // Basic dedup
        runDays = Array.from(new Set(runDays));

        // Derive visual styling from centralized agent registry
        const agentMeta = AGENTS[agent.toLowerCase()];
        const teamMeta = agentMeta ? TEAMS[agentMeta.team] : null;
        const fallbackColor = 'bg-slate-50 text-slate-700 border-slate-200';

        jobs.push({
          time: timeString,
          runDays,
          agent: agent.charAt(0).toUpperCase() + agent.slice(1),
          agentId: agent.toLowerCase(),
          task: name,
          cronExpression,
          color: teamMeta ? `${teamMeta.bgClass} ${teamMeta.textClass} ${teamMeta.borderClass}` : fallbackColor
        });
      }
    }

    return NextResponse.json({ jobs, source: cronScriptPath });

  } catch (error: any) {
    log.error('Error parsing cron-setup.sh', error);
    return NextResponse.json({ error: error.message, fallbackData: true }, { status: 500 });
  }
}
