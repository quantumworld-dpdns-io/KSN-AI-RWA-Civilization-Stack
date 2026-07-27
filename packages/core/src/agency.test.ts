import { describe, it, expect } from 'vitest';
import { nextAgencyStage, describeAgencyStage } from './agency';

describe('Agency Stage Transitions', () => {
  it('should get correct descriptions for stages', () => {
    expect(describeAgencyStage('HUMAN_OWNED')).toContain('Human-owned');
    expect(describeAgencyStage('AI_MANAGED')).toContain('AI manages');
  });

  it('should advance stages in order', () => {
    expect(nextAgencyStage('HUMAN_OWNED')).toBe('AI_MANAGED');
    expect(nextAgencyStage('KARDASHEV_CONVERGENCE')).toBe('KARDASHEV_CONVERGENCE');
  });
});
