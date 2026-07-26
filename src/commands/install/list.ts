import { resolveAgents } from '../../install/agents';
import { getInstalledSkills, isSmithMcpInstalled } from '../../install/status';
import { resolveScope } from '../../install/paths';
import type { InstallFlags } from '../../install/types';

export async function runInstallList(flags: InstallFlags): Promise<void> {
  const cwd = flags.cwd ?? process.cwd();
  const scope = resolveScope(flags);
  const agents = resolveAgents(flags);

  for (const agent of agents) {
    const mcpInstalled = isSmithMcpInstalled(agent, scope, cwd);
    const skills = getInstalledSkills(agent, scope, cwd);

    console.log(`${agent} ${scope}:`);
    console.log(`  MCP smith: ${mcpInstalled ? 'yes' : 'no'}`);
    if (skills.length === 0) {
      console.log('  skills: (none)');
    } else {
      console.log(`  skills: ${skills.join(', ')}`);
    }
  }
}
