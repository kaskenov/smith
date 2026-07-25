import { resolve } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { loadRootConfig, loadTemplateConfig } from '../../config/loadConfig';
import { loadGlobalConfig } from '../../config/loadGlobalConfig';
import { mergeConfigLayers } from '../../config/mergeConfig';
import { validatePresets } from '../../config/validatePresets';
import { runReplicate } from '../../commands/replicate';
import { getGlobalSmithDir, resolveTemplateDir } from '../../core/globalTemplates';
import { findSmithRoot } from '../../core/resolveRoot';

function jsonResult(payload: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
  };
}

function normalizeCwd(cwd?: string): string {
  return resolve(cwd ?? process.cwd());
}

async function withCwd<T>(cwd: string, fn: () => Promise<T>): Promise<T> {
  const previous = process.cwd();
  process.chdir(cwd);
  try {
    return await fn();
  } finally {
    process.chdir(previous);
  }
}

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
      const runCwd = normalizeCwd(cwd);
      const root = findSmithRoot(runCwd);
      const globalConfig = await loadGlobalConfig();
      const projectConfig = await loadRootConfig(root);

      const globalErrors = validatePresets(globalConfig.presets, globalConfig.defaultPreset);
      if (globalErrors.length > 0) {
        throw new Error(globalErrors.join('\n'));
      }

      const projectErrors = validatePresets(projectConfig.presets, projectConfig.defaultPreset);
      if (projectErrors.length > 0) {
        throw new Error(projectErrors.join('\n'));
      }

      if (!template) {
        return jsonResult({
          ok: true,
          root,
          globalSmithDir: getGlobalSmithDir(),
          validated: root ? ['global', 'root'] : ['global'],
        });
      }

      const { templateDir, source } = resolveTemplateDir(root, template);
      const templateConfig = await loadTemplateConfig(templateDir);
      const merged = mergeConfigLayers(globalConfig, projectConfig, templateConfig);
      const mergedErrors = validatePresets(merged.presets, merged.defaultPreset);
      if (mergedErrors.length > 0) {
        throw new Error(mergedErrors.join('\n'));
      }

      return jsonResult({
        ok: true,
        root,
        globalSmithDir: getGlobalSmithDir(),
        template,
        source,
        validated: root ? ['global', 'root', 'template'] : ['global', 'template'],
      });
    },
  );

  server.registerTool(
    'smith_replicate',
    {
      description:
        'Generate files from a local or global smith template. Required: name, template. Optional: path, preset, force, skip. Resolves project templates first, then ~/.smith/templates. Works without a project .smith when using a global template. Config merge: global → project → template. Hooks: global before → project before → template before → replicate → afters reverse.',
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
      const runCwd = normalizeCwd(cwd);
      const root = findSmithRoot(runCwd);
      const { source } = resolveTemplateDir(root, template);

      await withCwd(runCwd, async () => {
        await runReplicate({ name, template, path, preset, force, skip });
      });

      return jsonResult({
        ok: true,
        root,
        globalSmithDir: getGlobalSmithDir(),
        name,
        template,
        source,
        path: path ?? null,
        preset: preset ?? null,
        force: force ?? false,
        skip: skip ?? false,
      });
    },
  );
}
