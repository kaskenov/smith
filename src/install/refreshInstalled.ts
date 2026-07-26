import { ALL_INSTALL_AGENTS } from './agents';
import { installMcp } from './installMcp';
import { installSkills } from './installSkills';
import { hasInstalledSkills, isSmithMcpInstalled } from './status';
import type { InstallAgent, InstallFlags, InstallScope } from './types';

function agentFlags(agents: InstallAgent[]): InstallFlags {
  return {
    cursor: agents.includes('cursor'),
    claude: agents.includes('claude'),
    qwen: agents.includes('qwen'),
  };
}

function scopeFlags(scope: InstallScope): InstallFlags {
  return scope === 'global' ? { global: true } : { local: true };
}

export async function refreshInstalledSmithTooling(cwd = process.cwd()): Promise<void> {
  const scopes: InstallScope[] = ['local', 'global'];

  for (const scope of scopes) {
    const mcpAgents = ALL_INSTALL_AGENTS.filter((agent) => isSmithMcpInstalled(agent, scope, cwd));
    if (mcpAgents.length > 0) {
      await installMcp({
        ...scopeFlags(scope),
        ...agentFlags(mcpAgents),
        force: true,
        cwd,
      });
    }

    const skillAgents = ALL_INSTALL_AGENTS.filter((agent) => hasInstalledSkills(agent, scope, cwd));
    if (skillAgents.length > 0) {
      await installSkills({
        ...scopeFlags(scope),
        ...agentFlags(skillAgents),
        force: true,
        cwd,
      });
    }
  }
}
