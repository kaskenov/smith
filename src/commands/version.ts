import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { brandSmith } from '../terminal/brand';

interface PackageJson {
  version: string;
  description: string;
}

export function runVersion(): void {
  const pkgPath = join(__dirname, '../../package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as PackageJson;
  console.log(brandSmith(`smith v${pkg.version} — ${pkg.description}`));
}
