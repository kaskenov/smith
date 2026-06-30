import { resolveSmithBannerContext } from '../terminal/bannerContext';
import { printSmithBannerFromContext } from '../terminal/brand';
import { readPackageVersion } from '../package/version';

export async function runVersion(): Promise<void> {
  const context = await resolveSmithBannerContext({ checkForUpdate: true });
  printSmithBannerFromContext(context, { version: readPackageVersion() });
}
