import { replicate } from '../services/replicate';
import { brandSmith } from '../terminal/brand';
import { promptConflictResolution } from '../terminal/promptConflict';
import type { ReplicateOptions } from '../types';

export async function runReplicate(options: ReplicateOptions): Promise<void> {
  const result = await replicate({
    ...options,
    conflictResolver: options.conflictResolver ?? promptConflictResolution,
  });
  for (const warning of result.warnings) {
    console.warn(warning);
  }
  console.log(brandSmith(`smith replicated ${options.template} -> ${result.outputPath}`));
}
