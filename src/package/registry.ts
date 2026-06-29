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
    throw new Error(`npm registry returned ${res.status}`);
  }
  const data = (await res.json()) as NpmPackageMetadata;
  return data['dist-tags'].latest;
}

export async function notifyIfNewerVersion(currentVersion: string): Promise<void> {
  try {
    const latestVersion = await fetchLatestVersion();
    if (currentVersion !== latestVersion) {
      console.log(
        `A newer version of ${PACKAGE_NAME} is available: ${latestVersion}. You are currently on version: ${currentVersion}.`,
      );
    }
  } catch (error) {
    console.error('Failed to check for the latest version:', error);
  }
}
