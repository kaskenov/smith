import { parseAgentFlags } from '../agentFlags';
import {
  printUninstallHelp,
  printUninstallMcpHelp,
  printUninstallSkillsHelp,
} from './help';
import { runUninstallMcp, runUninstallSkills } from './run';

function isHelpFlag(arg: string): boolean {
  return arg === '-h' || arg === '--help';
}

async function routeUninstall(argv: string[]): Promise<void> {
  if (argv[0] !== 'uninstall') {
    throw new Error('Expected uninstall command');
  }

  const rest = argv.slice(1);

  if (rest.length === 0 || (rest.length === 1 && isHelpFlag(rest[0]!))) {
    printUninstallHelp();
    return;
  }

  const subcommand = rest[0]!;
  const afterSubcommand = rest.slice(1);

  if (afterSubcommand.some(isHelpFlag)) {
    switch (subcommand) {
      case 'mcp':
        printUninstallMcpHelp();
        return;
      case 'skills':
        printUninstallSkillsHelp();
        return;
      default:
        printUninstallHelp();
        return;
    }
  }

  switch (subcommand) {
    case 'mcp':
      await runUninstallMcp(parseAgentFlags(afterSubcommand));
      return;
    case 'skills':
      await runUninstallSkills(parseAgentFlags(afterSubcommand));
      return;
    default:
      throw new Error(`Unknown uninstall subcommand: ${subcommand}`);
  }
}

export async function runUninstall(argv: string[]): Promise<void> {
  try {
    await routeUninstall(argv);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  }
}
