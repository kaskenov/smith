import { brandSmith } from '../../terminal/brand';
import { printTemplatesDocs } from '../docs';

export function printTemplatesHelp(): void {
  console.log(brandSmith('smith templates — global template store'));
  console.log('');
  console.log('Usage:');
  console.log('  smith templates list');
  console.log('  smith templates add <name> --from <path|git> [--path <sub>] [--ref <ref>] [--force] [--acknowledge-executable-config]');
  console.log('  smith templates remove <name> --confirm');
  console.log('  smith templates update [name] [--acknowledge-executable-config]');
  console.log('  smith templates init-config');
  console.log('');
  console.log('Flags:');
  console.log('  --from <src>   Local directory or git URL');
  console.log('  --path <sub>   Subdirectory inside the source that is the template');
  console.log('  --ref <ref>    Git branch or tag (git sources)');
  console.log('  --force        Overwrite an existing global template');
  console.log('  --confirm      Required for remove');
  console.log('  --acknowledge-executable-config  Required for add/update (templates may run config.js/hooks)');
  console.log('  -h, --help     Show templates help');
  console.log('');
  printTemplatesDocs();
}
