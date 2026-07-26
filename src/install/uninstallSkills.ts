import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import { resolveAgents } from './agents';
import { SMITH_SKILL_NAMES } from './constants';
import { getSkillsDir, resolveScope } from './paths';
import type { InstallFlags } from './types';

export type UninstallSkillsAction =
  | { type: 'removed'; path: string }
  | { type: 'dry-run'; path: string }
  | { type: 'not-installed'; path: string };

export async function uninstallSkills(flags: InstallFlags): Promise<UninstallSkillsAction[]> {
  const cwd = flags.cwd ?? process.cwd();
  const scope = resolveScope(flags);
  const agents = resolveAgents(flags);
  const actions: UninstallSkillsAction[] = [];

  for (const agent of agents) {
    const skillsDir = getSkillsDir(agent, scope, cwd);
    let foundAny = false;

    for (const name of SMITH_SKILL_NAMES) {
      const skillPath = join(skillsDir, name);
      if (!existsSync(skillPath)) {
        continue;
      }

      foundAny = true;
      if (flags.dryRun) {
        actions.push({ type: 'dry-run', path: skillPath });
        continue;
      }

      rmSync(skillPath, { recursive: true, force: true });
    }

    if (flags.dryRun) {
      if (!foundAny) {
        actions.push({ type: 'not-installed', path: skillsDir });
      }
      continue;
    }

    if (foundAny) {
      actions.push({ type: 'removed', path: skillsDir });
    } else {
      actions.push({ type: 'not-installed', path: skillsDir });
    }
  }

  return actions;
}
