import { resolveSmithBannerContext } from '../terminal/bannerContext';
import { brandSmith, printSmithBannerFromContext } from '../terminal/brand';
import {
  printGlobalDocs,
  printInstallDocs,
  printInstallMcpDocs,
  printInstallSkillsDocs,
  printListDocs,
  printReplicateDocs,
  printUninstallDocs,
  printUninstallMcpDocs,
  printUninstallSkillsDocs,
} from './docs';

export {
  printInstallHelp,
  printInstallMcpHelp,
  printInstallSkillsHelp,
} from './install/help';

export { printListHelp } from './list/help';

export {
  printUninstallHelp,
  printUninstallMcpHelp,
  printUninstallSkillsHelp,
} from './uninstall/help';

export async function printGlobalHelp(): Promise<void> {
  const context = await resolveSmithBannerContext();
  printSmithBannerFromContext(context);
  console.log('');
  console.log('Usage:');
  console.log('  smith [command] [flags]');
  console.log('');
  console.log('Commands:');
  console.log('  replicate, r   Create a component from a template');
  console.log('  list           List templates in the current smith project');
  console.log('  install        Install smith MCP server (default)');
  console.log('  uninstall      Remove smith MCP server and agent skills');
  console.log('  update         Update smith, its MCP, and skills');
  console.log('');
  console.log('Global flags:');
  console.log('  -h, --help     Show help');
  console.log('  -v, --version  Show version');
  console.log('');
  printGlobalDocs();
}

export function printReplicateHelp(): void {
  console.log(brandSmith('smith replicate — create from template'));
  console.log('');
  console.log('Usage:');
  console.log('  smith replicate --name <name> --template <template> [--path <path>] [--preset <preset>] [--force] [--skip]');
  console.log('');
  console.log('Flags:');
  console.log('  --name <name>          Name exposed to template variables');
  console.log('  --template <template>  Template folder name under .smith/templates');
  console.log('  --path <path>          Override output root for generated files');
  console.log('  --preset <preset>      Preset name from template config');
  console.log('  --force                Overwrite conflicting files');
  console.log('  --skip                 Keep existing conflicting files');
  console.log('  -h, --help             Show replicate help');
  console.log('');
  printReplicateDocs();
}

export {
  printGlobalDocs,
  printInstallDocs,
  printInstallMcpDocs,
  printInstallSkillsDocs,
  printListDocs,
  printReplicateDocs,
  printUninstallDocs,
  printUninstallMcpDocs,
  printUninstallSkillsDocs,
};
