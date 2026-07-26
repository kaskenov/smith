import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { findSmithPackageRoot } from './packageRoot';

interface PackageJson {
  version: string;
  description: string;
}

function readPackageJson(): PackageJson {
  const root = findSmithPackageRoot(__dirname);
  const pkgPath = join(root, 'package.json');
  return JSON.parse(readFileSync(pkgPath, 'utf8')) as PackageJson;
}

export function readPackageVersion(): string {
  return readPackageJson().version;
}

export function readPackageDescription(): string {
  return readPackageJson().description;
}
