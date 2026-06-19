import type { InstallAgent, InstallFlags } from './types';

export const ALL_INSTALL_AGENTS: InstallAgent[] = ['cursor', 'claude', 'qwen'];

export function resolveAgents(flags: InstallFlags): InstallAgent[] {
  const selected: InstallAgent[] = [];
  if (flags.cursor) selected.push('cursor');
  if (flags.claude) selected.push('claude');
  if (flags.qwen) selected.push('qwen');
  if (selected.length > 0) return selected;
  return [...ALL_INSTALL_AGENTS];
}
