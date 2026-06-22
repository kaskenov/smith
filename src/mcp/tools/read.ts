import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { requireSmithRoot, resolveSmithPath } from '../context';

interface TemplateTreeNode {
  name: string;
  type: 'file' | 'directory';
  children?: TemplateTreeNode[];
}

function jsonResult(payload: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
  };
}

function normalizeCwd(cwd?: string): string {
  return resolve(cwd ?? process.cwd());
}

function listTemplates(root: string): string[] {
  const templatesDir = join(root, '.smith', 'templates');
  if (!existsSync(templatesDir)) return [];

  return readdirSync(templatesDir)
    .filter((entry) => statSync(join(templatesDir, entry)).isDirectory())
    .sort();
}

function listTemplateFiles(templateDir: string, prefix = ''): string[] {
  return readdirSync(templateDir)
    .sort()
    .flatMap((entry) => {
      const relPath = prefix ? `${prefix}/${entry}` : entry;
      const fullPath = join(templateDir, entry);
      if (statSync(fullPath).isDirectory()) {
        return listTemplateFiles(fullPath, relPath);
      }
      return [relPath];
    });
}

function readTemplateTree(templateDir: string): TemplateTreeNode[] {
  return readdirSync(templateDir)
    .sort()
    .map((entry) => {
      const fullPath = join(templateDir, entry);
      if (statSync(fullPath).isDirectory()) {
        return {
          name: entry,
          type: 'directory' as const,
          children: readTemplateTree(fullPath),
        };
      }
      return {
        name: entry,
        type: 'file' as const,
      };
    });
}

export function registerReadTools(server: McpServer): void {
  server.registerTool(
    'smith_project_info',
    {
      description:
        'Discover smith project root and template names. Walks up from cwd to find .smith/. Use first to orient in a smith project.',
      inputSchema: {
        cwd: z.string().optional(),
      },
    },
    async ({ cwd }) => {
      const root = requireSmithRoot(normalizeCwd(cwd));
      return jsonResult({
        root,
        templates: listTemplates(root),
      });
    },
  );

  server.registerTool(
    'smith_list_templates',
    {
      description:
        'List template folders under .smith/templates/. Pass template name for file paths and optional tree. Placeholders like {{name}} appear in file names.',
      inputSchema: {
        cwd: z.string().optional(),
        template: z.string().optional(),
        includeTree: z.boolean().optional(),
      },
    },
    async ({ cwd, template, includeTree }) => {
      const root = requireSmithRoot(normalizeCwd(cwd));
      const templates = listTemplates(root);

      if (!template) {
        return jsonResult({
          root,
          templates,
        });
      }

      const templateDir = join(root, '.smith', 'templates', template);
      if (!existsSync(templateDir) || !statSync(templateDir).isDirectory()) {
        throw new Error(`Template not found: ${template}`);
      }

      return jsonResult({
        root,
        template,
        files: listTemplateFiles(templateDir),
        tree: includeTree ? readTemplateTree(templateDir) : undefined,
      });
    },
  );

  server.registerTool(
    'smith_read_file',
    {
      description:
        'Read a file relative to .smith/ (e.g. config.js, templates/component/{{name}}.txt). Path must stay inside .smith/.',
      inputSchema: {
        cwd: z.string().optional(),
        path: z.string(),
      },
    },
    async ({ cwd, path }) => {
      const root = requireSmithRoot(normalizeCwd(cwd));
      const filePath = resolveSmithPath(root, path);
      if (!existsSync(filePath) || !statSync(filePath).isFile()) {
        throw new Error(`File not found: ${path}`);
      }

      return jsonResult({
        root,
        path,
        content: readFileSync(filePath, 'utf8'),
      });
    },
  );
}
