import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { UsageError } from '../../core/errors';
import { getGlobalSmithDir } from '../../paths/globalSmithHome';
import { discoverTemplates } from '../../services/discover';
import { addTemplate } from '../../services/templates/add';
import { initTemplatesConfig } from '../../services/templates/initConfig';
import { removeTemplate } from '../../services/templates/remove';
import { updateTemplates } from '../../services/templates/update';
import { jsonResult, normalizeCwd } from './helpers';

export function registerTemplateTools(server: McpServer): void {
  server.registerTool(
    'smith_templates_add',
    {
      description:
        'Install a template into ~/.smith/templates from a local directory or git URL (https/ssh/git@/github: only). Requires acknowledgeExecutableConfig:true — installed templates may execute config.js and hooks on later replicate/validate. Optional path is a subdirectory inside the source (must stay inside). Symlinks in the source are rejected. Use force to overwrite.',
      inputSchema: {
        cwd: z.string().optional(),
        name: z.string(),
        from: z.string(),
        path: z.string().optional(),
        ref: z.string().optional(),
        force: z.boolean().optional(),
        acknowledgeExecutableConfig: z.boolean().optional(),
      },
    },
    async ({ cwd, name, from, path, ref, force, acknowledgeExecutableConfig }) => {
      if (acknowledgeExecutableConfig !== true) {
        throw new UsageError(
          'MCP templates_add requires acknowledgeExecutableConfig:true — installed templates may execute config.js/hooks on replicate/validate.',
        );
      }
      const runCwd = normalizeCwd(cwd);
      const result = await addTemplate({
        cwd: runCwd,
        name,
        from,
        path,
        ref,
        force,
      });
      return jsonResult({
        ok: true,
        name,
        from,
        path: path ?? null,
        ref: ref ?? null,
        force: force ?? false,
        acknowledgeExecutableConfig: true,
        targetDir: result.targetDir,
        globalSmithDir: getGlobalSmithDir(),
      });
    },
  );

  server.registerTool(
    'smith_templates_remove',
    {
      description: 'Remove a global template from ~/.smith/templates and its sources.json entry.',
      inputSchema: {
        name: z.string(),
      },
    },
    async ({ name }) => {
      await removeTemplate(name);
      return jsonResult({ ok: true, name, globalSmithDir: getGlobalSmithDir() });
    },
  );

  server.registerTool(
    'smith_templates_update',
    {
      description:
        'Re-fetch global template(s) from recorded ~/.smith/sources.json. Omit name to update all recorded templates. Updated templates may execute config.js/hooks on later replicate/validate.',
      inputSchema: {
        cwd: z.string().optional(),
        name: z.string().optional(),
      },
    },
    async ({ cwd, name }) => {
      const runCwd = normalizeCwd(cwd);
      await updateTemplates({ name, cwd: runCwd });
      return jsonResult({
        ok: true,
        name: name ?? null,
        globalSmithDir: getGlobalSmithDir(),
        templates: discoverTemplates(runCwd),
      });
    },
  );

  server.registerTool(
    'smith_templates_init_config',
    {
      description:
        'Write ~/.smith/config.js starter with shared name variables (NAME_PASCAL, NAME_KEBAB, ...) if missing.',
      inputSchema: {},
    },
    async () => {
      const result = await initTemplatesConfig();
      return jsonResult({
        ok: true,
        path: result.path,
        created: result.created,
        globalSmithDir: getGlobalSmithDir(),
      });
    },
  );
}
