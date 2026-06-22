import { parseAgentFlags } from '../agentFlags';
import {
  printInstallHelp,
  printInstallMcpHelp,
  printInstallSkillsHelp,
} from './help';
import { runInstallList } from './list';
import { runInstallMcp } from './mcp';
import { runInstallSkills } from './skills';

export { parseAgentFlags as parseInstallFlags } from '../agentFlags';

const INSTALL_SUBCOMMANDS = new Set(['mcp', 'skills', 'list']);

function isHelpFlag(arg: string): boolean {
  return arg === '-h' || arg === '--help';
}

function isInstallSubcommand(arg: string): boolean {
  return INSTALL_SUBCOMMANDS.has(arg);
}

async function routeInstall(argv: string[]): Promise<void> {
  if (argv[0] !== 'install') {
    throw new Error('Expected install command');
  }

  const rest = argv.slice(1);

  if (rest.length === 1 && isHelpFlag(rest[0]!)) {
    printInstallHelp();
    return;
  }

  if (rest.length === 0 || !isInstallSubcommand(rest[0]!)) {
    await runInstallMcp(parseAgentFlags(rest));
    return;
  }

  const subcommand = rest[0]!;
  const afterSubcommand = rest.slice(1);

  if (afterSubcommand.some(isHelpFlag)) {
    switch (subcommand) {
      case 'mcp':
        printInstallMcpHelp();
        return;
      case 'skills':
        printInstallSkillsHelp();
        return;
      default:
        printInstallHelp();
        return;
    }
  }

  switch (subcommand) {
    case 'mcp':
      await runInstallMcp(parseAgentFlags(afterSubcommand));
      return;
    case 'skills':
      await runInstallSkills(parseAgentFlags(afterSubcommand));
      return;
    case 'list':
      await runInstallList(parseAgentFlags(afterSubcommand));
      return;
    default:
      throw new Error(`Unknown install subcommand: ${subcommand}`);
  }
}

export async function runInstall(argv: string[]): Promise<void> {
  try {
    await routeInstall(argv);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  }
}
