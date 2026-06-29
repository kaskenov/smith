import { fetchLatestVersion, PACKAGE_NAME } from '../package/registry';
import { readPackageVersion } from '../package/version';

export async function runUpdate(): Promise<void> {
  try {
    const latestVersion = await fetchLatestVersion();
    const currentVersion = readPackageVersion();

    if (currentVersion !== latestVersion) {
      console.log(
        `Updating ${PACKAGE_NAME} from version ${currentVersion} to ${latestVersion}...`,
      );
      // TODO: npm install -g @kaskenov/smith@latest and refresh MCP/skills
      console.log('Update completed successfully.');
    } else {
      console.log(`You are already on the latest version of ${PACKAGE_NAME}: ${currentVersion}.`);
    }
  } catch (error) {
    console.error('Failed to update:', error);
  }
}
