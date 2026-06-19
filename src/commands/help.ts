import { brandSmith } from '../terminal/brand';

export {
  printInstallHelp,
  printInstallMcpHelp,
  printInstallSkillsHelp,
  printInstallUninstallHelp,
} from './install/help';

export function printGlobalHelp(): void {
  console.log(brandSmith('smith — I replicate'));
  console.log('');
  console.log('Usage:');
  console.log('  smith [command] [flags]');
  console.log('');
  console.log('Commands:');
  console.log('  replicate, r   Create a component from a template');
  console.log('  install        Install MCP server and agent skills');
  console.log('');
  console.log('Global flags:');
  console.log('  -h, --help     Show help');
  console.log('  -v, --version  Show version');
  console.log('');
  console.log('Examples:');
  console.log('  smith replicate --name Button --template component');
  console.log('  smith r --name card-item --template ui --path src/features');
  console.log('  smith replicate --name Button --template component --force');
  console.log('  smith install mcp --local');
  console.log('  smith install skills --cursor');
}

export function printReplicateHelp(): void {
  console.log(brandSmith('smith replicate — create from template'));
  console.log('');
  console.log('Usage:');
  console.log('  smith replicate --name <name> --template <template> [--path <path>] [--force] [--skip]');
  console.log('');
  console.log('Flags:');
  console.log('  --name <name>          Name exposed to template variables');
  console.log('  --template <template>  Template folder name under .smith/templates');
  console.log('  --path <path>          Override output root for generated files');
  console.log('  --force                Overwrite conflicting files');
  console.log('  --skip                 Keep existing conflicting files');
  console.log('  -h, --help             Show replicate help');
  console.log('');
  console.log('Examples:');
  console.log('  smith replicate --name Button --template component');
  console.log('  smith replicate --name UserCard --template component --path src/components');
  console.log('  smith replicate --name Button --template component --skip');
}
