import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createProjectConfig, createTemplate, initProject } from '../../services/scaffold';
import { jsonResult, normalizeCwd } from './helpers';

export function registerScaffoldTools(server: McpServer): void {
  server.registerTool(
    'smith_init',
    {
      description:
        'Bootstrap a new smith project: create .smith/config.js (starter with NAME_* variables) and empty templates/ directory. Use on projects without .smith yet.',
      inputSchema: {
        cwd: z.string().optional(),
      },
    },
    async ({ cwd }) => {
      const result = await initProject(normalizeCwd(cwd));
      return jsonResult({
        ok: true,
        root: result.root,
        configPath: result.configPath,
        configCreated: result.configCreated,
        templatesPath: result.templatesPath,
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
      const result = await createTemplate(normalizeCwd(cwd), name, files);
      return jsonResult({
        ok: true,
        root: result.root,
        template: result.template,
        files: result.files,
      });
    },
  );

  server.registerTool(
    'smith_create_config',
    {
      description:
        'Create .smith/config.js when missing (createSmithConfig starter with NAME_* variables). Project must already have .smith/.',
      inputSchema: {
        cwd: z.string().optional(),
      },
    },
    async ({ cwd }) => {
      const result = await createProjectConfig(normalizeCwd(cwd));
      return jsonResult({
        ok: true,
        root: result.root,
        configPath: result.configPath,
        created: result.created,
      });
    },
  );
}
