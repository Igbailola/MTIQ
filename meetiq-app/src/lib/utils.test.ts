import { describe, it, expect } from 'vitest';
import { cn, getInitials } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('resolves tailwind conflicts (last wins)', () => {
    const result = cn('px-4', 'px-6');
    expect(result).not.toContain('px-4');
  });
});

describe('getInitials', () => {
  it('returns initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('returns single initial for one name', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('returns empty string for empty input', () => {
    expect(getInitials('')).toBe('');
    expect(getInitials(null as unknown as string)).toBe('');
    expect(getInitials(undefined as unknown as string)).toBe('');
  });

  it('handles multiple spaces', () => {
    expect(getInitials('  John   Doe  ')).toBe('JD');
  });
});
