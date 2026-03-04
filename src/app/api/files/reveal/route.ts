/**
 * File Reveal API
 * Opens a file's location in Finder (macOS) or Explorer (Windows)
 */

import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { existsSync, realpathSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);

export async function POST(request: NextRequest) {
  try {
    const { filePath } = await request.json();

    if (!filePath || typeof filePath !== 'string') {
      return NextResponse.json({ error: 'filePath is required and must be a string' }, { status: 400 });
    }

    // Reject paths with null bytes (path traversal attack vector)
    if (filePath.includes('\0')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // Expand tilde
    const expandedPath = filePath.replace(/^~/, process.env.HOME || '');

    // Security: Ensure path is within allowed directories (from env config)
    const allowedPaths = [
      process.env.WORKSPACE_BASE_PATH?.replace(/^~/, process.env.HOME || ''),
      process.env.PROJECTS_PATH?.replace(/^~/, process.env.HOME || ''),
    ].filter(Boolean) as string[];

    if (allowedPaths.length === 0) {
      return NextResponse.json(
        { error: 'No allowed directories configured. Set WORKSPACE_BASE_PATH or PROJECTS_PATH.' },
        { status: 500 }
      );
    }

    const normalizedPath = path.normalize(expandedPath);

    // Check if file/directory exists before resolving
    if (!existsSync(normalizedPath)) {
      return NextResponse.json(
        { error: 'File or directory not found' },
        { status: 404 }
      );
    }

    // Resolve symlinks and verify the real path is within allowed directories
    let realPath: string;
    try {
      realPath = realpathSync(normalizedPath);
    } catch {
      return NextResponse.json(
        { error: 'Unable to resolve file path' },
        { status: 400 }
      );
    }

    const isAllowed = allowedPaths.some(allowed => {
      try {
        const realAllowed = realpathSync(path.normalize(allowed));
        return realPath.startsWith(realAllowed + path.sep) || realPath === realAllowed;
      } catch {
        return false;
      }
    });

    if (!isAllowed) {
      console.warn(`[FILE] Blocked access to: ${filePath}`);
      return NextResponse.json(
        { error: 'Path not in allowed directories' },
        { status: 403 }
      );
    }

    // Open in file manager using execFile (safe from command injection)
    const platform = process.platform;

    if (platform === 'darwin') {
      await execFileAsync('open', ['-R', realPath]);
    } else if (platform === 'win32') {
      await execFileAsync('explorer', ['/select,', realPath]);
    } else {
      // Linux - open containing folder
      await execFileAsync('xdg-open', [path.dirname(realPath)]);
    }

    console.log(`[FILE] Revealed: ${realPath}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[FILE] Error revealing file:', error);
    return NextResponse.json(
      { error: 'Failed to reveal file' },
      { status: 500 }
    );
  }
}
