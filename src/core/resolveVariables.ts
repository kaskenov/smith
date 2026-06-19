import type { SmithConfig, SmithContext, SmithHelper, VariableMap } from '../types';

export function resolveVariables(
  config: SmithConfig,
  ctx: SmithContext,
  smith: SmithHelper,
): VariableMap {
  const result: VariableMap = {};
  for (const [key, fn] of Object.entries(config.variables)) {
    try {
      result[key] = fn(ctx, smith);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Variable "${key}" failed: ${message}`);
    }
  }
  return result;
}
