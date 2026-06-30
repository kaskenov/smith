import { refreshInstalledSmithTooling } from '../install/refreshInstalled';
import { detectGlobalPackageManager, formatGlobalUpdateCommand } from '../package/detectPackageManager';
import { runGlobalPackageUpdate } from '../package/globalUpdate';
import { fetchLatestVersion, PACKAGE_NAME } from '../package/registry';
import { readPackageVersion } from '../package/version';
import { brandSmith } from '../terminal/brand';

export async function runUpdate(): Promise<void> {
  try {
    const latestVersion = await fetchLatestVersion();
    const currentVersion = readPackageVersion();

    if (currentVersion === latestVersion) {
      console.log(`You are already on the latest version of ${PACKAGE_NAME}: ${currentVersion}.`);
      return;
    }

    const manager = detectGlobalPackageManager();
    console.log(`Updating ${PACKAGE_NAME} from version ${currentVersion} to ${latestVersion}...`);
    console.log(`Running: ${formatGlobalUpdateCommand(PACKAGE_NAME, latestVersion, manager)}`);

    runGlobalPackageUpdate(PACKAGE_NAME, latestVersion, manager);

    console.log('Refreshing installed MCP and skills...');
    await refreshInstalledSmithTooling();

    console.log(brandSmith(`smith updated to v${latestVersion}.`));
    console.log('Open a new shell and run smith --version to verify.');
  } catch (error) {
    console.error('Failed to update:', error);
    process.exitCode = 1;
  }
}
