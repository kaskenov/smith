import { brandSmith } from '../../terminal/brand';
import { printListDocs } from '../docs';

export function printListHelp(): void {
  console.log(brandSmith('smith list — project templates'));
  console.log('');
  console.log('Usage:');
  console.log('  smith list');
  console.log('');
  console.log('Flags:');
  console.log('  -h, --help             Show list help');
  console.log('');
  printListDocs();
}
