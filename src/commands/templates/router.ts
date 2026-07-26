import { assertKnownFlags, isHelpFlag, hasFlag, readFlag, reportCliError } from '../cliFlags';
import { UsageError } from '../../core/errors';
import { printTemplatesHelp } from './help';
import { runTemplatesAdd } from './add';
import { runTemplatesInitConfig } from './initConfig';
import { runTemplatesList } from './list';
import { runTemplatesRemove } from './remove';
import { runTemplatesUpdate } from './update';

type TemplatesSubcommand = 'list' | 'add' | 'remove' | 'update' | 'init-config';

function isTemplatesSubcommand(value: string): value is TemplatesSubcommand {
  return (
    value === 'list' ||
    value === 'add' ||
    value === 'remove' ||
    value === 'update' ||
    value === 'init-config'
  );
}

function positionalArgs(args: string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]!;
    if (arg.startsWith('--')) {
      if (
        arg === '--force' ||
        arg === '--acknowledge-executable-config' ||
        arg === '--confirm'
      ) {
        continue;
      }
      i += 1;
      continue;
    }
    result.push(arg);
  }
  return result;
}

function requireExecutableConfigAck(after: string[], command: string): void {
  if (hasFlag(after, '--acknowledge-executable-config')) return;
  throw new UsageError(
    `${command} requires --acknowledge-executable-config (installed templates may execute config.js/hooks).`,
  );
}

async function dispatchTemplates(cmd: TemplatesSubcommand, after: string[]): Promise<void> {
  if (cmd === 'list') {
    runTemplatesList();
    return;
  }
  if (cmd === 'init-config') {
    await runTemplatesInitConfig();
    return;
  }
  if (cmd === 'add') {
    assertKnownFlags(after, {
      valueFlags: ['--from', '--path', '--ref'],
      boolFlags: ['--force', '--acknowledge-executable-config'],
    });
    const [name] = positionalArgs(after);
    const from = readFlag(after, '--from');
    if (!name || !from) {
      throw new UsageError(
        'Usage: smith templates add <name> --from <path|git> [--path <sub>] [--ref <ref>] [--force] [--acknowledge-executable-config]',
      );
    }
    requireExecutableConfigAck(after, 'templates add');
    await runTemplatesAdd({
      name,
      from,
      path: readFlag(after, '--path'),
      ref: readFlag(after, '--ref'),
      force: hasFlag(after, '--force'),
      acknowledgeExecutableConfig: true,
    });
    return;
  }
  if (cmd === 'remove') {
    assertKnownFlags(after, { valueFlags: [], boolFlags: ['--confirm'] });
    const [name] = positionalArgs(after);
    if (!name) {
      throw new UsageError('Usage: smith templates remove <name> --confirm');
    }
    if (!hasFlag(after, '--confirm')) {
      throw new UsageError('templates remove requires --confirm');
    }
    await runTemplatesRemove(name);
    return;
  }

  assertKnownFlags(after, { valueFlags: [], boolFlags: ['--acknowledge-executable-config'] });
  requireExecutableConfigAck(after, 'templates update');
  const [name] = positionalArgs(after);
  await runTemplatesUpdate(name);
}

async function routeTemplates(argv: string[]): Promise<void> {
  if (argv[0] !== 'templates' && argv[0] !== 't') {
    throw new UsageError('Expected templates command');
  }

  const rest = argv.slice(1);

  if (rest.length === 0 || (rest.length === 1 && isHelpFlag(rest[0]!))) {
    printTemplatesHelp();
    return;
  }

  const subcommand = rest[0]!;
  if (!isTemplatesSubcommand(subcommand)) {
    throw new UsageError(`Unknown templates subcommand: ${subcommand}`);
  }

  const after = rest.slice(1);
  if (after.some(isHelpFlag)) {
    printTemplatesHelp();
    return;
  }

  await dispatchTemplates(subcommand, after);
}

export async function runTemplates(argv: string[]): Promise<void> {
  try {
    await routeTemplates(argv);
  } catch (error) {
    reportCliError(error);
  }
}
