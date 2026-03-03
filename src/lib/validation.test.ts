import { describe, it, expect } from 'vitest';
import { CreateTaskSchema, UpdateTaskSchema, CreateActivitySchema, CreateDeliverableSchema } from './validation';

describe('CreateTaskSchema', () => {
  it('accepts a valid task with required fields', () => {
    const result = CreateTaskSchema.safeParse({ title: 'Test task' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty title', () => {
    const result = CreateTaskSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a title exceeding 500 characters', () => {
    const result = CreateTaskSchema.safeParse({ title: 'x'.repeat(501) });
    expect(result.success).toBe(false);
  });

  it('accepts valid optional fields', () => {
    const result = CreateTaskSchema.safeParse({
      title: 'Test task',
      description: 'A description',
      status: 'inbox',
      priority: 'high',
      due_date: '2025-01-01T00:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid status', () => {
    const result = CreateTaskSchema.safeParse({ title: 'Test', status: 'invalid_status' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid priority', () => {
    const result = CreateTaskSchema.safeParse({ title: 'Test', priority: 'critical' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid statuses', () => {
    const statuses = ['planning', 'inbox', 'assigned', 'in_progress', 'testing', 'review', 'done'];
    for (const status of statuses) {
      const result = CreateTaskSchema.safeParse({ title: 'Test', status });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all valid priorities', () => {
    const priorities = ['low', 'normal', 'high', 'urgent'];
    for (const priority of priorities) {
      const result = CreateTaskSchema.safeParse({ title: 'Test', priority });
      expect(result.success).toBe(true);
    }
  });

  it('accepts nullable assigned_agent_id', () => {
    const result = CreateTaskSchema.safeParse({ title: 'Test', assigned_agent_id: null });
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID assigned_agent_id', () => {
    const result = CreateTaskSchema.safeParse({ title: 'Test', assigned_agent_id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects a description exceeding 10000 characters', () => {
    const result = CreateTaskSchema.safeParse({ title: 'Test', description: 'x'.repeat(10001) });
    expect(result.success).toBe(false);
  });
});

describe('UpdateTaskSchema', () => {
  it('accepts an empty update (all fields optional)', () => {
    const result = UpdateTaskSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts a partial update', () => {
    const result = UpdateTaskSchema.safeParse({ status: 'in_progress' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty title when provided', () => {
    const result = UpdateTaskSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });
});

describe('CreateActivitySchema', () => {
  it('accepts a valid activity', () => {
    const result = CreateActivitySchema.safeParse({
      activity_type: 'spawned',
      message: 'Agent started',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty message', () => {
    const result = CreateActivitySchema.safeParse({
      activity_type: 'spawned',
      message: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid activity_type', () => {
    const result = CreateActivitySchema.safeParse({
      activity_type: 'unknown',
      message: 'test',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a message exceeding 5000 characters', () => {
    const result = CreateActivitySchema.safeParse({
      activity_type: 'updated',
      message: 'x'.repeat(5001),
    });
    expect(result.success).toBe(false);
  });
});

describe('CreateDeliverableSchema', () => {
  it('accepts a valid deliverable', () => {
    const result = CreateDeliverableSchema.safeParse({
      deliverable_type: 'file',
      title: 'output.txt',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty title', () => {
    const result = CreateDeliverableSchema.safeParse({
      deliverable_type: 'file',
      title: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all deliverable types', () => {
    for (const type of ['file', 'url', 'artifact']) {
      const result = CreateDeliverableSchema.safeParse({ deliverable_type: type, title: 'test' });
      expect(result.success).toBe(true);
    }
  });
});
