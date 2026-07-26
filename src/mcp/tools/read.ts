import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { NotFoundError, UnsafePathError } from '../../core/errors';
import { assertNotSymlink, assertSafeFileInside, isRealDirectory, isRealFile } from '../../core/fsGuard';
import {
  existsSync,
  lstatSync,
  readdirSync,
  readFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { getGlobalSmithDir } from '../../paths/globalSmithHome';
import { discoverSmithRoot, discoverTemplateDir, discoverTemplates } from '../../services/discover';
import { requireSmithRoot, resolveSmithPath } from '../context';
import { jsonResult, normalizeCwd } from './helpers';

interface TemplateTreeNode {
  name: string;
  type: 'file' | 'directory';
  children?: TemplateTreeNode[];
}

function listTemplateFiles(templateDir: string, prefix = ''): string[] {
  return readdirSync(templateDir)
    .sort()
    .flatMap((entry) => {
      const relPath = prefix ? `${prefix}/${entry}` : entry;
      const fullPath = join(templateDir, entry);
      if (lstatSync(fullPath).isSymbolicLink()) {
        throw new UnsafePathError(`Template contains symlink (not allowed): ${relPath}`);
      }
      if (isRealDirectory(fullPath)) {
        return listTemplateFiles(fullPath, relPath);
      }
      return [relPath];
    });
}

function readTemplateTree(templateDir: string, prefix = ''): TemplateTreeNode[] {
  return readdirSync(templateDir)
    .sort()
    .map((entry) => {
      const relPath = prefix ? `${prefix}/${entry}` : entry;
      const fullPath = join(templateDir, entry);
      if (lstatSync(fullPath).isSymbolicLink()) {
        throw new UnsafePathError(`Template contains symlink (not allowed): ${relPath}`);
      }
      if (isRealDirectory(fullPath)) {
        return {
          name: entry,
          type: 'directory' as const,
          children: readTemplateTree(fullPath, relPath),
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
        'Discover smith project root (if any), global smith home, and template names with sources (local|global). Works without a project .smith/.',
      inputSchema: {
        cwd: z.string().optional(),
      },
    },
    async ({ cwd }) => {
      const runCwd = normalizeCwd(cwd);
      const root = discoverSmithRoot(runCwd);
      const templates = discoverTemplates(runCwd);
      return jsonResult({
        root,
        globalSmithDir: getGlobalSmithDir(),
        templates,
      });
    },
  );

  server.registerTool(
    'smith_list_templates',
    {
      description:
        'List local and global template folders with source markers. Pass template name for file paths and optional tree.',
      inputSchema: {
        cwd: z.string().optional(),
        template: z.string().optional(),
        includeTree: z.boolean().optional(),
      },
    },
    async ({ cwd, template, includeTree }) => {
      const runCwd = normalizeCwd(cwd);
      const root = discoverSmithRoot(runCwd);
      const templates = discoverTemplates(runCwd);

      if (!template) {
        return jsonResult({
          root,
          globalSmithDir: getGlobalSmithDir(),
          templates,
        });
      }

      const { templateDir, source } = discoverTemplateDir(runCwd, template);

      const tree = includeTree ? readTemplateTree(templateDir) : undefined;
      return jsonResult({
        root,
        globalSmithDir: getGlobalSmithDir(),
        template,
        source,
        files: listTemplateFiles(templateDir),
        tree,
      });
    },
  );

  server.registerTool(
    'smith_read_file',
    {
      description:
        'Read a file relative to project .smith/ (e.g. config.js, templates/component/{{name}}.txt). Path must stay inside .smith/; symlinks are rejected.',
      inputSchema: {
        cwd: z.string().optional(),
        path: z.string(),
      },
    },
    async ({ cwd, path }) => {
      const root = requireSmithRoot(normalizeCwd(cwd));
      const smithDir = resolve(root, '.smith');
      const filePath = resolveSmithPath(root, path);

      if (!existsSync(filePath)) {
        throw new NotFoundError(`File not found: ${path}`);
      }
      assertNotSymlink(filePath, 'File');
      if (!isRealFile(filePath)) {
        throw new NotFoundError(`File not found: ${path}`);
      }
      assertSafeFileInside(smithDir, filePath, 'File');

      return jsonResult({
        root,
        path,
        content: readFileSync(filePath, 'utf8'),
      });
    },
  );
}
