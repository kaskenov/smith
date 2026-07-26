import { copyBundledSkills } from './copySkills';
import { resolveAgents } from './agents';
import { getSkillsDir, resolveScope } from './paths';
import type { InstallFlags } from './types';

export type InstallSkillsAction =
  | { type: 'written'; path: string }
  | { type: 'dry-run'; path: string };

export async function installSkills(flags: InstallFlags): Promise<InstallSkillsAction[]> {
  const cwd = flags.cwd ?? process.cwd();
  const scope = resolveScope(flags);
  const agents = resolveAgents(flags);
  const actions: InstallSkillsAction[] = [];

  for (const agent of agents) {
    const skillsDir = getSkillsDir(agent, scope, cwd);

    if (flags.dryRun) {
      actions.push({ type: 'dry-run', path: skillsDir });
      continue;
    }

    copyBundledSkills({ targetRoot: skillsDir, force: flags.force });
    actions.push({ type: 'written', path: skillsDir });
  }

  return actions;
}
