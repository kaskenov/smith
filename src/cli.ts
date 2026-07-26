import { hasFlag, isHelpFlag, isVersionFlag, readFlag, reportCliError, assertKnownFlags } from './commands/cliFlags';
import { printGlobalHelp, printListHelp, printReplicateHelp } from './commands/help';
import { runInit } from './commands/init';
import { runInstall } from './commands/install/router';
import { runList } from './commands/list';
import { runMcpCommand } from './commands/mcp';
import { runReplicate } from './commands/replicate';
import { runTemplates } from './commands/templates/router';
import { runUpdate } from './commands/update';
import { runUninstall } from './commands/uninstall/router';
import { runVersion } from './commands/version';
import { ReplicationAbortedError } from './core/errors';
import { notifyIfNewerVersion } from './package/registry';
import { readPackageVersion } from './package/version';

function shouldSkipVersionCheck(argv: string[]): boolean {
  if (process.env.SMITH_SKIP_UPDATE_CHECK === '1') return true;
  if (argv.some(isVersionFlag)) return true;
  const command = argv[0];
  if (command === 'mcp' || command === 'update') return true;
  if (argv.length === 0 || argv.some(isHelpFlag)) return true;
  return false;
}

async function runReplicateCommand(argv: string[]): Promise<void> {
  const args = argv.slice(1);
  try {
    assertKnownFlags(args, {
      valueFlags: ['--name', '--template', '--path', '--preset'],
      boolFlags: ['--force', '--skip', '--allow-absolute'],
    });
  } catch (error) {
    reportCliError(error);
    return;
  }

  const name = readFlag(args, '--name');
  const template = readFlag(args, '--template');
  const path = readFlag(args, '--path');
  const preset = readFlag(args, '--preset');
  const force = hasFlag(args, '--force');
  const skip = hasFlag(args, '--skip');
  const allowAbsolutePath = hasFlag(args, '--allow-absolute');

  if (!name || !template) {
    console.error('Missing required flags: --name and --template');
    printReplicateHelp();
    process.exitCode = 1;
    return;
  }

  try {
    await runReplicate({ name, template, path, force, skip, preset, allowAbsolutePath });
  } catch (error) {
    if (error instanceof ReplicationAbortedError) {
      process.exitCode = 0;
      return;
    }
    reportCliError(error);
  }
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

  if (command === 'init') {
    if (argv.some(isHelpFlag)) {
      console.log('Usage: smith init');
      console.log('');
      console.log('Bootstrap .smith/config.js (NAME_* variables) and .smith/templates/.');
      return;
    }
    try {
      assertKnownFlags(argv.slice(1), { valueFlags: [], boolFlags: [] });
      await runInit();
    } catch (error) {
      reportCliError(error);
    }
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
      assertKnownFlags(argv.slice(1), { valueFlags: [], boolFlags: [] });
      runList();
    } catch (error) {
      reportCliError(error);
    }
    return;
  }

  if (command === 'templates' || command === 't') {
    await runTemplates(argv);
    return;
  }

  if (
    argv.length === 0 ||
    (argv.some(isHelpFlag) &&
      command !== 'install' &&
      command !== 'uninstall' &&
      command !== 'templates' &&
      command !== 't' &&
      command !== 'init')
  ) {
    if (askingReplicateHelp) {
      printReplicateHelp();
      return;
    }
    await printGlobalHelp();
    return;
  }

  if (command === 'replicate' || command === 'r') {
    await runReplicateCommand(argv);
    return;
  }

  console.error(`Unknown command: ${command}`);
  await printGlobalHelp();
  process.exitCode = 1;
}

if (require.main === module) {
  void run();
}
