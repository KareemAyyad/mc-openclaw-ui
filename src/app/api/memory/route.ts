import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// This API route securely reads agent memory files from the local openclaw workspace directory.
// V2 ARCHITECTURE: It now gracefully falls back to streaming the file from the remote Render 
// persistent disk via the OpenClaw Gateway if the file is not synced locally.
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agent');
    const file = searchParams.get('file');

    if (!agentId || !file) {
        return NextResponse.json({ error: 'Missing agent or file parameter' }, { status: 400 });
    }

    // Prevent path traversal
    if (file.includes('..') || file.includes('/')) {
        return NextResponse.json({ error: 'Invalid file parameter' }, { status: 400 });
    }

    // Determine workspace base path
    const basePath = process.env.WORKSPACE_BASE_PATH
        || path.join(process.cwd(), '..', 'openclaw-kareem', 'workspaces');

    const filePath = path.join(basePath, agentId, 'memory', file);

    try {
        let content = '';
        let sourceInfo = 'Local Disk';

        // 1. ATTEMPT LOCAL READ
        if (fs.existsSync(filePath)) {
            content = fs.readFileSync(filePath, 'utf-8');
        }
        // 2. REMOTE FALLBACK VIA OPENCLAW GATEWAY
        else {
            const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN;
            const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || 'https://openclaw-teammates.onrender.com';

            if (!gatewayToken) {
                return NextResponse.json({
                    exists: false,
                    message: \`File not synced locally yet. Remote fetching is disabled because OPENCLAW_GATEWAY_TOKEN is missing.\`
                });
            }

            // We construct a secure cat command targeting the Render persistent volume (/data).
            // This requires the Gateway to be at T4 or have cat in its exec-approvals.json.
            const remotePath = \`/data/workspaces/\${agentId}/memory/\${file}\`;
            
            try {
                // Execute RPC against the Gateway
                const response = await fetch(\`\${gatewayUrl}/v1/exec\`, {
                    method: 'POST',
                    headers: {
                        'Authorization': \`Bearer \${gatewayToken}\`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        command: \`cat \${remotePath}\`,
                        timeoutSec: 10
                    })
                });

                if (!response.ok) {
                    throw new Error(\`Gateway returned \${response.status}\`);
                }

                const result = await response.json();
                
                // OpenClaw /v1/exec returns { stdout, stderr, exitCode }
                if (result.exitCode !== 0) {
                     return NextResponse.json({
                        exists: false,
                        message: \`File not synced locally and does not exist structurally on Remote Render disk yet. \n\n[\${result.stderr}]\`
                    });
                }

                content = result.stdout;
                sourceInfo = 'Remote Render Disk';
            } catch (remoteError) {
                console.error('[Remote RPC Error]', remoteError);
                 return NextResponse.json({
                    exists: false,
                    message: 'File not synced locally and OpenClaw Gateway proxy failed. Is the agent currently online or token valid?'
                });
            }
        }

        // 3. PARSE AND RETURN
        if (file.endsWith('.jsonl')) {
            const lines = content.split('\\n').filter(line => line.trim());
            const parsed = lines.map(line => {
                try {
                    return JSON.parse(line);
                } catch (e) {
                    return { error: 'Failed to parse line', raw: line };
                }
            });
            return NextResponse.json({ exists: true, data: parsed, type: 'jsonl', source: sourceInfo });
        }

        // Pass markdown/text as raw string
        return NextResponse.json({ exists: true, data: content, type: 'text', source: sourceInfo });

    } catch (error) {
        console.error('Error reading memory file:', error);
        return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
    }
}
