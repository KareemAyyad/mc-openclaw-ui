import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const basePath = process.env.WORKSPACE_BASE_PATH
            || path.join(process.cwd(), '..', 'openclaw-kareem', 'workspaces');

        const schemaPath = path.join(basePath, 'SCHEMAS.md');
        if (!fs.existsSync(schemaPath)) {
            return NextResponse.json({ error: 'SCHEMAS.md not found' }, { status: 404 });
        }

        const content = fs.readFileSync(schemaPath, 'utf8');

        // Split by H3 markdown header which denotes a schema
        const blocks = content.split('### `');
        blocks.shift(); // remove header preamble

        const schemas = blocks.map(block => {
            const lines = block.split('\n');
            const headerMatch = lines[0].match(/([a-zA-Z0-9_]+)` \((v[0-9]+)\)/);
            if (!headerMatch) return null;

            const [, type, version] = headerMatch;

            // Extract sender/receiver
            const metaLine = lines.find(l => l.includes('**Sender:**'));
            let sender = 'Unknown';
            let receiver = 'Unknown';
            if (metaLine) {
                // E.g. **Sender:** LeadGen | **Receiver:** Outbound
                const match = metaLine.match(/\*\*Sender:\*\* ([a-zA-Z0-9-]+) \| \*\*Receiver:\*\* ([a-zA-Z0-9-]+)/);
                if (match) {
                    sender = match[1].toLowerCase();
                    receiver = match[2].toLowerCase();
                }
            }

            const purposeLine = lines.find(l => l.includes('**Purpose:**'));
            const purpose = purposeLine ? purposeLine.replace('**Purpose:**', '').trim() : '';

            // Extract fields (JSON snippet)
            const jsonStart = lines.findIndex(l => l.trim() === '```json');
            const jsonEnd = lines.findIndex((l, i) => i > jsonStart && l.trim() === '```');
            let jsonExample = '{}';
            if (jsonStart !== -1 && jsonEnd !== -1) {
                jsonExample = lines.slice(jsonStart + 1, jsonEnd).join('\n');
            }

            return {
                id: `${sender}-${type}-${receiver}`,
                type,
                version,
                sender,
                receiver,
                purpose,
                schema: jsonExample
            };
        }).filter(Boolean);

        return NextResponse.json({ success: true, schemas });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
