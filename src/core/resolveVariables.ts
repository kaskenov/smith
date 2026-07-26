import type { SmithConfigData, SmithContext, SmithHelper, VariableMap } from '../types';
import { ValidationError } from './errors';

export function resolveVariables(
  config: SmithConfigData,
  ctx: SmithContext,
  smith: SmithHelper,
): VariableMap {
  const result: VariableMap = {};
  for (const [key, fn] of Object.entries(config.variables)) {
    try {
      result[key] = fn(ctx, smith);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ValidationError(`Variable "${key}" failed: ${message}`);
    }
  }
  return result;
}
