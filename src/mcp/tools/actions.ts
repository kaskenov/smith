import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getGlobalSmithDir } from '../../paths/globalSmithHome';
import { discoverSmithRoot, discoverTemplateDir } from '../../services/discover';
import { replicate } from '../../services/replicate';
import { validateSmith } from '../../services/validate';
import {
  assertMcpReplicatePath,
  jsonResult,
  normalizeCwd,
  resolveMcpReplicateFlags,
} from './helpers';

export function registerActionTools(server: McpServer): void {
  server.registerTool(
    'smith_validate',
    {
      description:
        'Load and validate ~/.smith/config.js, optional project .smith/config.js, and optional template config.js. Throws if config is invalid.',
      inputSchema: {
        cwd: z.string().optional(),
        template: z.string().optional(),
      },
    },
    async ({ cwd, template }) => {
      const result = await validateSmith({
        cwd: normalizeCwd(cwd),
        template,
      });
      return jsonResult(result);
    },
  );

  server.registerTool(
    'smith_replicate',
    {
      description:
        'Generate files from a local or global smith template. Required: name, template. Optional: path (relative only), preset, force, skip. When neither force nor skip is set, force defaults to true (MCP is non-interactive). Absolute path is rejected. Resolves project templates first, then ~/.smith/templates. Config merge: global → project → template.',
      inputSchema: {
        cwd: z.string().optional(),
        name: z.string(),
        template: z.string(),
        path: z.string().optional(),
        preset: z.string().optional(),
        force: z.boolean().optional(),
        skip: z.boolean().optional(),
      },
    },
    async ({ cwd, name, template, path, preset, force, skip }) => {
      const { force: resolvedForce, skip: resolvedSkip } = resolveMcpReplicateFlags(force, skip);
      assertMcpReplicatePath(path);

      const runCwd = normalizeCwd(cwd);
      const root = discoverSmithRoot(runCwd);
      const { source } = discoverTemplateDir(runCwd, template);

      const result = await replicate({
        cwd: runCwd,
        name,
        template,
        path,
        preset,
        force: resolvedForce,
        skip: resolvedSkip,
      });

      return jsonResult({
        ok: true,
        root,
        globalSmithDir: getGlobalSmithDir(),
        name,
        template,
        source,
        path: path ?? null,
        outputPath: result.outputPath,
        preset: preset ?? null,
        force: resolvedForce,
        skip: resolvedSkip,
        written: result.written,
        skipped: result.skipped,
        warnings: result.warnings,
      });
    },
  );
}
