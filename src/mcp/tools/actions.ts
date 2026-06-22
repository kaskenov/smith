import { existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { loadRootConfig, loadTemplateConfig } from '../../config/loadConfig';
import { runReplicate } from '../../commands/replicate';
import { requireSmithRoot } from '../context';

function jsonResult(payload: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
  };
}

function normalizeCwd(cwd?: string): string {
  return resolve(cwd ?? process.cwd());
}

function resolveTemplateDir(root: string, template: string): string {
  return join(root, '.smith', 'templates', template);
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
        'Load and validate .smith/config.js and optional template config.js. Run after editing config. Throws if config is invalid.',
      inputSchema: {
        cwd: z.string().optional(),
        template: z.string().optional(),
      },
    },
    async ({ cwd, template }) => {
      const root = requireSmithRoot(normalizeCwd(cwd));
      await loadRootConfig(root);

      if (!template) {
        return jsonResult({
          ok: true,
          root,
          validated: ['root'],
        });
      }

      const templateDir = resolveTemplateDir(root, template);
      if (!existsSync(templateDir) || !statSync(templateDir).isDirectory()) {
        throw new Error(`Template not found: ${template}`);
      }

      await loadTemplateConfig(templateDir);
      return jsonResult({
        ok: true,
        root,
        template,
        validated: ['root', 'template'],
      });
    },
  );

  server.registerTool(
    'smith_replicate',
    {
      description:
        'Generate files from a smith template. Required: name, template. Optional: path (output root), force (overwrite), skip (keep existing). Do not use force and skip together. Hooks run: root before → template before → replicate → template after → root after.',
      inputSchema: {
        cwd: z.string().optional(),
        name: z.string(),
        template: z.string(),
        path: z.string().optional(),
        force: z.boolean().optional(),
        skip: z.boolean().optional(),
      },
    },
    async ({ cwd, name, template, path, force, skip }) => {
      const runCwd = normalizeCwd(cwd);
      const root = requireSmithRoot(runCwd);

      await withCwd(runCwd, async () => {
        await runReplicate({ name, template, path, force, skip });
      });

      return jsonResult({
        ok: true,
        root,
        name,
        template,
        path: path ?? null,
        force: force ?? false,
        skip: skip ?? false,
      });
    },
  );
}
