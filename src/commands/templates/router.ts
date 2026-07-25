import { printTemplatesHelp } from './help';
import { runTemplatesAdd } from './add';
import { runTemplatesInitConfig } from './initConfig';
import { runTemplatesList } from './list';
import { runTemplatesRemove } from './remove';
import { runTemplatesUpdate } from './update';

const SUBCOMMANDS = new Set(['list', 'add', 'remove', 'update', 'init-config']);

function isHelpFlag(arg: string): boolean {
  return arg === '-h' || arg === '--help';
}

function readFlag(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}

function hasFlag(args: string[], name: string): boolean {
  return args.includes(name);
}

function positionalArgs(args: string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]!;
    if (arg.startsWith('--')) {
      if (arg === '--force') continue;
      i += 1;
      continue;
    }
    if (isHelpFlag(arg)) continue;
    result.push(arg);
  }
  return result;
}

async function routeTemplates(argv: string[]): Promise<void> {
  if (argv[0] !== 'templates' && argv[0] !== 't') {
    throw new Error('Expected templates command');
  }

  const rest = argv.slice(1);

  if (rest.length === 0 || (rest.length === 1 && isHelpFlag(rest[0]!))) {
    printTemplatesHelp();
    return;
  }

  const subcommand = rest[0]!;
  if (!SUBCOMMANDS.has(subcommand)) {
    throw new Error(`Unknown templates subcommand: ${subcommand}`);
  }

  const after = rest.slice(1);
  if (after.some(isHelpFlag)) {
    printTemplatesHelp();
    return;
  }

  switch (subcommand) {
    case 'list':
      runTemplatesList();
      return;
    case 'init-config':
      await runTemplatesInitConfig();
      return;
    case 'add': {
      const [name] = positionalArgs(after);
      const from = readFlag(after, '--from');
      if (!name || !from) {
        throw new Error('Usage: smith templates add <name> --from <path|git> [--path <sub>] [--ref <ref>] [--force]');
      }
      await runTemplatesAdd({
        name,
        from,
        path: readFlag(after, '--path'),
        ref: readFlag(after, '--ref'),
        force: hasFlag(after, '--force'),
      });
      return;
    }
    case 'remove': {
      const [name] = positionalArgs(after);
      if (!name) {
        throw new Error('Usage: smith templates remove <name>');
      }
      await runTemplatesRemove(name);
      return;
    }
    case 'update': {
      const [name] = positionalArgs(after);
      await runTemplatesUpdate(name);
      return;
    }
    default:
      throw new Error(`Unknown templates subcommand: ${subcommand}`);
  }
}

export async function runTemplates(argv: string[]): Promise<void> {
  try {
    await routeTemplates(argv);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  }
}
