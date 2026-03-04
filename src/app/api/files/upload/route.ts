/**
 * File Upload API
 * Accepts file content over HTTP and saves it to the server filesystem.
 * This enables remote agents to create files on
 * the Teammates.ai server.
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, mkdirSync, existsSync, realpathSync } from 'fs';
import path from 'path';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// Base directory for all uploaded project files
// Set via PROJECTS_PATH env var (e.g., ~/projects or /var/www/projects)
const PROJECTS_BASE = (process.env.PROJECTS_PATH || '~/projects').replace(/^~/, process.env.HOME || '');

// Maximum file content size: 10 MB
const MAX_CONTENT_SIZE = 10 * 1024 * 1024;

// Allowed encodings
const ALLOWED_ENCODINGS: BufferEncoding[] = ['utf-8', 'utf8', 'ascii', 'base64', 'hex', 'latin1'];

interface UploadRequest {
  // Path relative to PROJECTS_BASE (e.g., "dashboard-redesign/index.html")
  relativePath: string;
  // File content (text)
  content: string;
  // Optional: encoding (default: utf-8)
  encoding?: BufferEncoding;
}

/**
 * POST /api/files/upload
 * Upload a file to the server
 */
export async function POST(request: NextRequest) {
  // Rate limit: 20 file operations per minute per IP
  const ip = getClientIP(request);
  const rateCheck = checkRateLimit(`file-upload:${ip}`, RATE_LIMITS.fileOps);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const body: UploadRequest = await request.json();
    const { relativePath, content, encoding = 'utf-8' } = body;

    if (!relativePath || typeof relativePath !== 'string' || content === undefined || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'relativePath (string) and content (string) are required' },
        { status: 400 }
      );
    }

    // Validate encoding
    if (!ALLOWED_ENCODINGS.includes(encoding)) {
      return NextResponse.json(
        { error: `Invalid encoding. Allowed: ${ALLOWED_ENCODINGS.join(', ')}` },
        { status: 400 }
      );
    }

    // Enforce file size limit
    const contentSize = Buffer.byteLength(content, encoding);
    if (contentSize > MAX_CONTENT_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_CONTENT_SIZE / (1024 * 1024)} MB` },
        { status: 413 }
      );
    }

    // Security: Reject null bytes
    if (relativePath.includes('\0')) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      );
    }

    // Security: Prevent path traversal attacks
    const normalizedPath = path.normalize(relativePath);
    if (normalizedPath.startsWith('..') || normalizedPath.startsWith('/')) {
      return NextResponse.json(
        { error: 'Invalid path: must be relative and cannot traverse upward' },
        { status: 400 }
      );
    }

    // Build full path
    const fullPath = path.join(PROJECTS_BASE, normalizedPath);

    // Ensure base directory exists
    if (!existsSync(PROJECTS_BASE)) {
      mkdirSync(PROJECTS_BASE, { recursive: true });
    }

    // Verify resolved path stays within PROJECTS_BASE after symlink resolution
    const resolvedBase = realpathSync(PROJECTS_BASE);
    const parentDir = path.dirname(fullPath);
    if (!existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true });
    }
    const resolvedParent = realpathSync(parentDir);
    if (!resolvedParent.startsWith(resolvedBase + path.sep) && resolvedParent !== resolvedBase) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Write the file
    writeFileSync(fullPath, content, { encoding });

    console.log(`[FILE UPLOAD] Created: ${normalizedPath} (${contentSize} bytes)`);

    return NextResponse.json({
      success: true,
      relativePath: normalizedPath,
      size: contentSize,
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/files/upload
 * Get info about the upload endpoint
 */
export async function GET() {
  return NextResponse.json({
    description: 'File upload endpoint for remote agents',
    basePath: PROJECTS_BASE,
    usage: {
      method: 'POST',
      body: {
        relativePath: 'project-name/filename.html',
        content: '<html>...</html>',
        encoding: 'utf-8 (optional)',
      },
    },
  });
}
