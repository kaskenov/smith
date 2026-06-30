import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface PackageJson {
  version: string;
  description: string;
}

export function readPackageVersion(): string {
  const pkgPath = join(__dirname, '../../package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as PackageJson;
  return pkg.version;
}

export function readPackageDescription(): string {
  const pkgPath = join(__dirname, '../../package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as PackageJson;
  return pkg.description;
}
