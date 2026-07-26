import { InternalError } from '../core/errors';

export const PACKAGE_NAME = '@kaskenov/smith';

const REGISTRY_URL = `https://registry.npmjs.org/${encodeURIComponent(PACKAGE_NAME)}`;

interface NpmPackageMetadata {
  'dist-tags': {
    latest: string;
  };
}

export async function fetchLatestVersion(): Promise<string> {
  const res = await fetch(REGISTRY_URL);
  if (!res.ok) {
    throw new InternalError(`npm registry returned ${res.status}`);
  }
  const data = (await res.json()) as NpmPackageMetadata;
  return data['dist-tags'].latest;
}

export async function findNewerVersion(currentVersion: string): Promise<string | null> {
  try {
    const latestVersion = await fetchLatestVersion();
    return currentVersion !== latestVersion ? latestVersion : null;
  } catch {
    return null;
  }
}

/** Notify on stderr only — never stdout (MCP stdio uses stdout for JSON-RPC). */
export async function notifyIfNewerVersion(currentVersion: string): Promise<void> {
  try {
    const latestVersion = await findNewerVersion(currentVersion);
    if (latestVersion) {
      console.error(
        `A newer version of ${PACKAGE_NAME} is available: ${latestVersion}. You are currently on version: ${currentVersion}.`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to check for the latest version: ${message}`);
  }
}
