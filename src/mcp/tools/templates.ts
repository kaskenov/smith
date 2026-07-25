import { resolve } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { runTemplatesAdd } from '../../commands/templates/add';
import { runTemplatesInitConfig } from '../../commands/templates/initConfig';
import { runTemplatesRemove } from '../../commands/templates/remove';
import { runTemplatesUpdate } from '../../commands/templates/update';
import { getGlobalSmithDir, listTemplatesWithSource } from '../../core/globalTemplates';
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

export function registerTemplateTools(server: McpServer): void {
  server.registerTool(
    'smith_templates_add',
    {
      description:
        'Install a template into ~/.smith/templates from a local directory or git URL. Ensures ~/.smith/config.js starter exists. Optional path is a subdirectory inside the source. Use force to overwrite.',
      inputSchema: {
        cwd: z.string().optional(),
        name: z.string(),
        from: z.string(),
        path: z.string().optional(),
        ref: z.string().optional(),
        force: z.boolean().optional(),
      },
    },
    async ({ cwd, name, from, path, ref, force }) => {
      await withCwd(normalizeCwd(cwd), async () => {
        await runTemplatesAdd({ name, from, path, ref, force });
      });
      return jsonResult({
        ok: true,
        name,
        from,
        path: path ?? null,
        ref: ref ?? null,
        force: force ?? false,
        globalSmithDir: getGlobalSmithDir(),
      });
    },
  );

  server.registerTool(
    'smith_templates_remove',
    {
      description: 'Remove a global template from ~/.smith/templates and its sources.json entry.',
      inputSchema: {
        cwd: z.string().optional(),
        name: z.string(),
      },
    },
    async ({ cwd, name }) => {
      await withCwd(normalizeCwd(cwd), async () => {
        await runTemplatesRemove(name);
      });
      return jsonResult({ ok: true, name, globalSmithDir: getGlobalSmithDir() });
    },
  );

  server.registerTool(
    'smith_templates_update',
    {
      description:
        'Re-fetch global template(s) from recorded ~/.smith/sources.json. Omit name to update all recorded templates.',
      inputSchema: {
        cwd: z.string().optional(),
        name: z.string().optional(),
      },
    },
    async ({ cwd, name }) => {
      const runCwd = normalizeCwd(cwd);
      await withCwd(runCwd, async () => {
        await runTemplatesUpdate(name);
      });
      return jsonResult({
        ok: true,
        name: name ?? null,
        globalSmithDir: getGlobalSmithDir(),
        templates: listTemplatesWithSource(findSmithRoot(runCwd)),
      });
    },
  );

  server.registerTool(
    'smith_templates_init_config',
    {
      description:
        'Write ~/.smith/config.js starter with shared name variables (NAME_PASCAL, NAME_KEBAB, ...) if missing.',
      inputSchema: {
        cwd: z.string().optional(),
      },
    },
    async ({ cwd }) => {
      const result = await withCwd(normalizeCwd(cwd), async () => runTemplatesInitConfig());
      return jsonResult({
        ok: true,
        path: result.path,
        created: result.created,
        globalSmithDir: getGlobalSmithDir(),
      });
    },
  );
}
