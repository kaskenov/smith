import { brandSmith } from '../../terminal/brand';
import { printTemplatesDocs } from '../docs';

export function printTemplatesHelp(): void {
  console.log(brandSmith('smith templates — global template store'));
  console.log('');
  console.log('Usage:');
  console.log('  smith templates list');
  console.log('  smith templates add <name> --from <path|git> [--path <sub>] [--ref <ref>] [--force]');
  console.log('  smith templates remove <name>');
  console.log('  smith templates update [name]');
  console.log('  smith templates init-config');
  console.log('');
  console.log('Flags:');
  console.log('  --from <src>   Local directory or git URL');
  console.log('  --path <sub>   Subdirectory inside the source that is the template');
  console.log('  --ref <ref>    Git branch or tag (git sources)');
  console.log('  --force        Overwrite an existing global template');
  console.log('  -h, --help     Show templates help');
  console.log('');
  printTemplatesDocs();
}
