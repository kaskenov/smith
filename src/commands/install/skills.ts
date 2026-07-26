import { installSkills } from '../../install/installSkills';
import type { InstallFlags } from '../../install/types';
import { brandSmith } from '../../terminal/brand';

export async function runInstallSkills(flags: InstallFlags): Promise<void> {
  const actions = await installSkills(flags);

  for (const action of actions) {
    if (action.type === 'dry-run') {
      console.log(`Would install skills to ${action.path}`);
    } else {
      console.log(brandSmith(`smith installed skills to ${action.path}`));
    }
  }
}
