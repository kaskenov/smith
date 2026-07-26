import type { InstallFlags } from '../../install/types';
import { uninstallMcp, type UninstallMcpAction } from '../../install/uninstallMcp';
import { uninstallSkills, type UninstallSkillsAction } from '../../install/uninstallSkills';
import { brandSmith } from '../../terminal/brand';

function reportUninstallMcpActions(actions: UninstallMcpAction[]): void {
  for (const action of actions) {
    if (action.type === 'dry-run') {
      console.log(`Would write ${action.path}`, JSON.stringify(action.content, null, 2));
      continue;
    }
    if (action.type === 'written') {
      console.log(brandSmith(`smith uninstalled MCP from ${action.path}`));
      continue;
    }
    console.log(brandSmith(`smith MCP not installed at ${action.path}`));
  }
}

function reportUninstallSkillsActions(actions: UninstallSkillsAction[]): void {
  for (const action of actions) {
    if (action.type === 'dry-run') {
      console.log(`Would remove skill ${action.path}`);
      continue;
    }
    if (action.type === 'removed') {
      console.log(brandSmith(`smith uninstalled skills from ${action.path}`));
      continue;
    }
    console.log(brandSmith(`smith skills not installed at ${action.path}`));
  }
}

export async function runUninstallMcp(flags: InstallFlags): Promise<void> {
  const actions = await uninstallMcp(flags);
  reportUninstallMcpActions(actions);
}

export async function runUninstallSkills(flags: InstallFlags): Promise<void> {
  const actions = await uninstallSkills(flags);
  reportUninstallSkillsActions(actions);
}
