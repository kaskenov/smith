import { ALL_INSTALL_AGENTS, resolveAgents } from '../../src/install/agents';
import { SMITH_SKILL_NAMES } from '../../src/install/constants';

describe('resolveAgents', () => {
  it('returns all agents when no flags', () => {
    expect(resolveAgents({})).toEqual(ALL_INSTALL_AGENTS);
  });
  it('returns cursor only', () => {
    expect(resolveAgents({ cursor: true })).toEqual(['cursor']);
  });
  it('returns claude only', () => {
    expect(resolveAgents({ claude: true })).toEqual(['claude']);
  });
  it('returns qwen only', () => {
    expect(resolveAgents({ qwen: true })).toEqual(['qwen']);
  });
  it('returns selected agents when multiple flags passed', () => {
    expect(resolveAgents({ cursor: true, qwen: true })).toEqual(['cursor', 'qwen']);
  });
});

describe('SMITH_SKILL_NAMES', () => {
  it('lists the bundled smith skill', () => {
    expect(SMITH_SKILL_NAMES).toEqual(['smith']);
  });
});
