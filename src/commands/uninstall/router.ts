import { parseAgentFlags } from '../agentFlags';
import { isHelpFlag, reportCliError } from '../cliFlags';
import { UsageError } from '../../core/errors';
import { runInstallList } from '../install/list';
import {
  printUninstallHelp,
  printUninstallMcpHelp,
  printUninstallSkillsHelp,
} from './help';
import { runUninstallMcp, runUninstallSkills } from './run';

async function routeUninstall(argv: string[]): Promise<void> {
  if (argv[0] !== 'uninstall') {
    throw new UsageError('Expected uninstall command');
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
      case 'list':
        printUninstallHelp();
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
    case 'list':
      // Same status reporter as `smith install list`.
      await runInstallList(parseAgentFlags(afterSubcommand));
      return;
    default:
      throw new UsageError(`Unknown uninstall subcommand: ${subcommand}`);
  }
}

export async function runUninstall(argv: string[]): Promise<void> {
  try {
    await routeUninstall(argv);
  } catch (error) {
    reportCliError(error);
  }
}
