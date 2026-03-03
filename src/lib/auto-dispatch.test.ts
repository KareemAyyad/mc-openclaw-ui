import { describe, it, expect } from 'vitest';
import { shouldTriggerAutoDispatch } from './auto-dispatch';

describe('shouldTriggerAutoDispatch', () => {
  it('returns true when moving to in_progress with an assigned agent', () => {
    expect(shouldTriggerAutoDispatch('assigned', 'in_progress', 'agent-123')).toBe(true);
  });

  it('returns true when moving from inbox to in_progress with assigned agent', () => {
    expect(shouldTriggerAutoDispatch('inbox', 'in_progress', 'agent-456')).toBe(true);
  });

  it('returns false when already in_progress', () => {
    expect(shouldTriggerAutoDispatch('in_progress', 'in_progress', 'agent-123')).toBe(false);
  });

  it('returns false when moving to a non-in_progress status', () => {
    expect(shouldTriggerAutoDispatch('inbox', 'assigned', 'agent-123')).toBe(false);
  });

  it('returns false when no agent is assigned', () => {
    expect(shouldTriggerAutoDispatch('assigned', 'in_progress', null)).toBe(false);
  });

  it('returns false when previous status is undefined and moving to in_progress', () => {
    expect(shouldTriggerAutoDispatch(undefined, 'in_progress', 'agent-123')).toBe(true);
  });

  it('returns false when agent_id is empty string', () => {
    expect(shouldTriggerAutoDispatch('inbox', 'in_progress', '')).toBe(false);
  });
});
