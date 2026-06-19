import { resolveAgents } from '../../install/agents';
import { copyBundledSkills } from '../../install/copySkills';
import { getSkillsDir, resolveScope } from '../../install/paths';
import type { InstallFlags } from '../../install/types';
import { brandSmith } from '../../terminal/brand';

export async function runInstallSkills(flags: InstallFlags): Promise<void> {
  const cwd = flags.cwd ?? process.cwd();
  const scope = resolveScope(flags);
  const agents = resolveAgents(flags);

  for (const agent of agents) {
    const skillsDir = getSkillsDir(agent, scope, cwd);

    if (flags.dryRun) {
      console.log(`Would install skills to ${skillsDir}`);
      continue;
    }

    copyBundledSkills({ targetRoot: skillsDir, force: flags.force });
    console.log(brandSmith(`smith installed skills to ${skillsDir}`));
  }
}
