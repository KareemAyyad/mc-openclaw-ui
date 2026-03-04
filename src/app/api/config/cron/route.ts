import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Reads the actual cron-setup.sh script from the local workspace to serve
 * as the dynamic source of truth for the /schedule page.
 */
export async function GET() {
    try {
        const cronScriptPath = process.env.CRON_SCRIPT_PATH
            || path.join(process.cwd(), '..', 'openclaw-kareem', 'scripts', 'cron-setup.sh');

        if (!fs.existsSync(cronScriptPath)) {
            console.warn(\`[Config API] cron-setup.sh not found at \${cronScriptPath}\`);
      return NextResponse.json({ 
        error: 'cron-setup.sh not found', 
        path: cronScriptPath,
        fallbackData: true 
      });
    }

    const scriptContent = fs.readFileSync(cronScriptPath, 'utf8');
    
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
          timeString = \`\${hour.padStart(2, '0')}:\${minute === '0' || minute === '*' ? '00' : minute.padStart(2, '0')}\`;
        } else if (hour.includes('*/')) {
           timeString = \`Every \${hour.replace('*/', '')}h\`;
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
        runDays = [...new Set(runDays)];

        // Assign visual styling based on agent
        const colorMap: Record<string, string> = {
          'leadgen': 'bg-emerald-50 text-emerald-700 border-emerald-200',
          'outbound': 'bg-blue-50 text-blue-700 border-blue-200',
          'content': 'bg-indigo-50 text-indigo-700 border-indigo-200',
          'intel': 'bg-purple-50 text-purple-700 border-purple-200',
          'onboarding': 'bg-amber-50 text-amber-700 border-amber-200',
          'fundraise': 'bg-rose-50 text-rose-700 border-rose-200',
        };

        const fallbackColor = 'bg-slate-50 text-slate-700 border-slate-200';

        jobs.push({
          time: timeString,
          runDays,
          agent: agent.charAt(0).toUpperCase() + agent.slice(1),
          agentId: agent.toLowerCase(),
          task: name,
          cronExpression,
          color: colorMap[agent.toLowerCase()] || fallbackColor
        });
      }
    }

    return NextResponse.json({ jobs, source: cronScriptPath });

  } catch (error: any) {
    console.error('[Config API] Error parsing cron-setup.sh:', error);
    return NextResponse.json({ error: error.message, fallbackData: true }, { status: 500 });
  }
}
