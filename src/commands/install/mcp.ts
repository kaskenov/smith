import { installMcp, type InstallMcpAction } from '../../install/installMcp';
import type { InstallFlags } from '../../install/types';
import { brandSmith } from '../../terminal/brand';

function reportMcpActions(actions: InstallMcpAction[]): void {
  const writtenPaths = new Set(
    actions.filter((a) => a.type === 'written').map((a) => a.path),
  );
  const unchangedPaths = new Set(
    actions.filter((a) => a.type === 'unchanged').map((a) => a.path),
  );

  for (const action of actions) {
    if (action.type === 'dry-run') {
      console.log(`Would write ${action.path}`, JSON.stringify(action.content, null, 2));
    }
  }

  for (const path of writtenPaths) {
    console.log(brandSmith(`smith installed MCP at ${path}`));
  }
  for (const path of unchangedPaths) {
    console.log(brandSmith(`smith MCP already installed at ${path}`));
  }
}

export async function runInstallMcp(flags: InstallFlags): Promise<void> {
  const actions = await installMcp(flags);
  reportMcpActions(actions);
}
