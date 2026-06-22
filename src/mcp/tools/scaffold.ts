import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { requireSmithRoot, resolveSmithPath } from '../context';

interface TemplateFileInput {
  path: string;
  content: string;
}

function jsonResult(payload: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
  };
}

function normalizeCwd(cwd?: string): string {
  return resolve(cwd ?? process.cwd());
}

function starterConfigContent(): string {
  return `const { createSmithConfig } = require('@kaskenov/smith/dist/config/createSmithConfig');

module.exports = createSmithConfig(() => ({
  variables: {},
}));
`;
}

function ensureConfigFile(root: string): { path: string; created: boolean } {
  const configPath = resolveSmithPath(root, 'config.js');
  if (existsSync(configPath)) {
    return { path: configPath, created: false };
  }

  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(configPath, starterConfigContent(), 'utf8');
  return { path: configPath, created: true };
}

export function registerScaffoldTools(server: McpServer): void {
  server.registerTool(
    'smith_init',
    {
      description:
        'Bootstrap a new smith project: create .smith/config.js (starter) and empty templates/ directory. Use on projects without .smith yet.',
      inputSchema: {
        cwd: z.string().optional(),
      },
    },
    async ({ cwd }) => {
      const root = normalizeCwd(cwd);
      const templatesPath = resolveSmithPath(root, 'templates');
      const config = ensureConfigFile(root);

      mkdirSync(templatesPath, { recursive: true });
      return jsonResult({
        ok: true,
        root,
        configPath: config.path,
        configCreated: config.created,
        templatesPath,
      });
    },
  );

  server.registerTool(
    'smith_create_template',
    {
      description:
        'Create .smith/templates/<name>/ with optional files. Paths may use {{name}} placeholders. Default stub: {{name}}.txt. Template config.js is not copied on replicate.',
      inputSchema: {
        cwd: z.string().optional(),
        name: z.string(),
        files: z
          .array(
            z.object({
              path: z.string(),
              content: z.string(),
            }),
          )
          .optional(),
      },
    },
    async ({ cwd, name, files }) => {
      const root = requireSmithRoot(normalizeCwd(cwd));
      const templateRoot = resolveSmithPath(root, `templates/${name}`);
      mkdirSync(templateRoot, { recursive: true });

      const writeFiles: TemplateFileInput[] =
        files && files.length > 0
          ? files.map((file) => ({ path: file.path, content: file.content }))
          : [{ path: '{{name}}.txt', content: 'Hello {{name}}\n' }];

      const writtenPaths: string[] = [];
      for (const file of writeFiles) {
        const outPath = resolveSmithPath(root, `templates/${name}/${file.path}`);
        mkdirSync(dirname(outPath), { recursive: true });
        writeFileSync(outPath, file.content, 'utf8');
        writtenPaths.push(outPath);
      }

      return jsonResult({
        ok: true,
        root,
        template: name,
        files: writtenPaths,
      });
    },
  );

  server.registerTool(
    'smith_create_config',
    {
      description:
        'Create .smith/config.js when missing (createSmithConfig starter with default variables). Project must already have .smith/.',
      inputSchema: {
        cwd: z.string().optional(),
      },
    },
    async ({ cwd }) => {
      const root = requireSmithRoot(normalizeCwd(cwd));
      const config = ensureConfigFile(root);

      return jsonResult({
        ok: true,
        root,
        configPath: config.path,
        created: config.created,
      });
    },
  );
}
