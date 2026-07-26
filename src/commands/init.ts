import { initProject } from '../services/scaffold';
import { brandSmith } from '../terminal/brand';

export async function runInit(cwd = process.cwd()): Promise<void> {
  const result = await initProject(cwd);
  if (result.configCreated) {
    console.log(brandSmith(`smith init -> ${result.configPath}`));
  } else {
    console.log(brandSmith(`smith init config already exists -> ${result.configPath}`));
  }
  console.log(brandSmith(`smith init templates -> ${result.templatesPath}`));
}
