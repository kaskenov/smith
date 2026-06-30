import cac from 'cac';

import { printGlobalHelp, printReplicateHelp } from './commands/help';
import { printListHelp } from './commands/list/help';
import { runInstall } from './commands/install/router';
import { runList } from './commands/list';
import { runMcpCommand } from './commands/mcp';
import { runReplicate } from './commands/replicate';
import { runUpdate } from './commands/update';
import { runUninstall } from './commands/uninstall/router';
import { runVersion } from './commands/version';
import { ReplicationAbortedError } from './core/replicateTree';
import { notifyIfNewerVersion } from './package/registry';
import { readPackageVersion } from './package/version';

interface ReplicateCliOptions {
  name?: string;
  template?: string;
  path?: string;
  force?: boolean;
  skip?: boolean;
  preset?: string;
}

function isHelpFlag(arg: string): boolean {
  return arg === '-h' || arg === '--help';
}

function isVersionFlag(arg: string): boolean {
  return arg === '-v' || arg === '--version';
}

function shouldSkipVersionCheck(argv: string[]): boolean {
  if (process.env.SMITH_SKIP_UPDATE_CHECK === '1') return true;
  if (argv.some(isVersionFlag)) return true;
  const command = argv[0];
  if (command === 'mcp' || command === 'update') return true;
  if (argv.length === 0 || argv.some(isHelpFlag)) return true;
  return false;
}

export async function run(argv = process.argv.slice(2)): Promise<void> {
  if (!shouldSkipVersionCheck(argv)) {
    void notifyIfNewerVersion(readPackageVersion());
  }

  const command = argv[0];
  const askingReplicateHelp = (command === 'replicate' || command === 'r') && argv.some(isHelpFlag);

  if (argv.some(isVersionFlag)) {
    await runVersion();
    return;
  }

  if (command === 'install') {
    await runInstall(argv);
    return;
  }

  if (command === 'uninstall') {
    await runUninstall(argv);
    return;
  }

  if (command === 'mcp') {
    await runMcpCommand();
    return;
  }

  if (command === 'update') {
    await runUpdate();
    return;
  }

  if (command === 'list') {
    if (argv.some(isHelpFlag)) {
      printListHelp();
      return;
    }
    try {
      runList();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(message);
      process.exitCode = 1;
    }
    return;
  }

  if (argv.length === 0 || (argv.some(isHelpFlag) && command !== 'install' && command !== 'uninstall')) {
    if (askingReplicateHelp) {
      printReplicateHelp();
      return;
    }
    await printGlobalHelp();
    return;
  }

  const cli = cac('smith');

  cli
    .command('replicate', 'Create a component from template')
    .alias('r')
    .option('--name <name>', 'Component name')
    .option('--template <template>', 'Template folder name')
    .option('--path <path>', 'Output root directory')
    .option('--force', 'Overwrite existing files')
    .option('--skip', 'Skip existing files')
    .option('--preset <preset>', 'Preset name from template config')
    .action(async (opts: ReplicateCliOptions) => {
      if (!opts.name || !opts.template) {
        console.error('Missing required flags: --name and --template');
        printReplicateHelp();
        process.exitCode = 1;
        return;
      }

      try {
        await runReplicate({
          name: opts.name,
          template: opts.template,
          path: opts.path,
          force: opts.force,
          skip: opts.skip,
          preset: opts.preset,
        });
      } catch (error) {
        if (error instanceof ReplicationAbortedError) {
          process.exitCode = 0;
          return;
        }
        const message = error instanceof Error ? error.message : String(error);
        console.error(message);
        process.exitCode = 1;
      }
    });

  cli.parse(['node', 'smith', ...argv]);
}

if (require.main === module) {
  void run();
}
