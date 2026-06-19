import type { InstallFlags } from '../../install/types';
import {
  printInstallHelp,
  printInstallMcpHelp,
  printInstallSkillsHelp,
  printInstallUninstallHelp,
} from './help';
import { runInstallList } from './list';
import { runInstallMcp } from './mcp';
import { runInstallSkills } from './skills';
import { runUninstallMcp, runUninstallSkills } from './uninstall';

function isHelpFlag(arg: string): boolean {
  return arg === '-h' || arg === '--help';
}

export function parseInstallFlags(args: string[]): InstallFlags {
  const flags: InstallFlags = {};

  for (const arg of args) {
    if (isHelpFlag(arg)) {
      continue;
    }

    switch (arg) {
      case '--cursor':
        flags.cursor = true;
        break;
      case '--claude':
        flags.claude = true;
        break;
      case '--qwen':
        flags.qwen = true;
        break;
      case '--global':
        flags.global = true;
        break;
      case '--local':
        flags.local = true;
        break;
      case '--force':
        flags.force = true;
        break;
      case '--dry-run':
        flags.dryRun = true;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return flags;
}

async function routeInstall(argv: string[]): Promise<void> {
  if (argv[0] !== 'install') {
    throw new Error('Expected install command');
  }

  const rest = argv.slice(1);

  if (rest.length === 0 || (rest.length === 1 && isHelpFlag(rest[0]!))) {
    printInstallHelp();
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
      case 'uninstall':
        printInstallUninstallHelp();
        return;
      default:
        printInstallHelp();
        return;
    }
  }

  switch (subcommand) {
    case 'mcp':
      await runInstallMcp(parseInstallFlags(afterSubcommand));
      return;
    case 'skills':
      await runInstallSkills(parseInstallFlags(afterSubcommand));
      return;
    case 'list':
      await runInstallList(parseInstallFlags(afterSubcommand));
      return;
    case 'uninstall': {
      const target = afterSubcommand[0];
      const flagArgs = afterSubcommand.slice(1);

      if (target === 'mcp') {
        await runUninstallMcp(parseInstallFlags(flagArgs));
        return;
      }
      if (target === 'skills') {
        await runUninstallSkills(parseInstallFlags(flagArgs));
        return;
      }

      throw new Error('Expected: smith install uninstall mcp|skills');
    }
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
