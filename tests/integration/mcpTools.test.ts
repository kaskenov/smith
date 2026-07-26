import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTools } from '../../src/mcp/tools';

function parseToolJson(result: unknown): Record<string, unknown> {
  const value = result as { content?: Array<{ type: string; text?: string }> };
  const text = value.content?.find((item) => item.type === 'text')?.text;
  if (!text) {
    throw new Error('Tool result is missing text content.');
  }
  return JSON.parse(text) as Record<string, unknown>;
}

function patchConfigRequires(root: string): void {
  const createSmithConfigPath = require.resolve('../../dist/config/createSmithConfig');
  const files = [
    join(root, '.smith', 'config.js'),
    join(root, '.smith', 'templates', 'component', 'config.js'),
  ];

  for (const file of files) {
    if (!existsSync(file)) continue;
    const content = readFileSync(file, 'utf8');
    writeFileSync(
      file,
      content.replace(
        /require\(['"][^'"]*createSmithConfig['"]\)/g,
        `require(${JSON.stringify(createSmithConfigPath)})`,
      ),
      'utf8',
    );
  }
}

describe('mcp tools integration', () => {
  const tmpRoots: string[] = [];

  afterEach(() => {
    jest.restoreAllMocks();
    for (const root of tmpRoots.splice(0)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  function makeTmpRoot(prefix: string): string {
    const root = mkdtempSync(join(tmpdir(), prefix));
    tmpRoots.push(root);
    return root;
  }

  async function createPair() {
    const server = new McpServer({ name: 'smith-test', version: '0.0.0' });
    registerTools(server);

    const client = new Client({ name: 'smith-test-client', version: '0.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    return { server, client };
  }

  async function cleanupPair(server: McpServer, client: Client): Promise<void> {
    await Promise.all([client.close(), server.close()]);
  }

  it('registers all smith MCP tools', async () => {
    const { client, server } = await createPair();

    try {
      const listed = await client.listTools();
      const names = listed.tools.map((tool) => tool.name).sort();
      expect(names).toEqual([
        'smith_create_config',
        'smith_create_template',
        'smith_init',
        'smith_list_templates',
        'smith_project_info',
        'smith_read_file',
        'smith_replicate',
        'smith_templates_add',
        'smith_templates_init_config',
        'smith_templates_remove',
        'smith_templates_update',
        'smith_validate',
      ]);
    } finally {
      await cleanupPair(server, client);
    }
  });

  it('lists nested template files and tree', async () => {
    const fixtureRoot = join(__dirname, '../fixtures/basic-project');
    const root = makeTmpRoot('smith-mcp-nested-');
    cpSync(fixtureRoot, root, { recursive: true });
    patchConfigRequires(root);

    const templateDir = join(root, '.smith', 'templates', 'nested-only');
    const nestedDir = join(templateDir, 'nested');
    mkdirSync(nestedDir, { recursive: true });
    writeFileSync(join(nestedDir, 'child.txt'), 'child');
    writeFileSync(join(templateDir, 'root.txt'), 'root');

    const { client, server } = await createPair();

    try {
      const templates = parseToolJson(
        await client.callTool({
          name: 'smith_list_templates',
          arguments: { cwd: root, template: 'nested-only', includeTree: true },
        }),
      );
      expect(templates.files).toEqual(['nested/child.txt', 'root.txt']);
      expect(templates.tree).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'nested', type: 'directory' }),
          expect.objectContaining({ name: 'root.txt', type: 'file' }),
        ]),
      );
    } finally {
      await cleanupPair(server, client);
    }
  });

  it('lists templates without a specific template name', async () => {
    const fixtureRoot = join(__dirname, '../fixtures/basic-project');
    const root = makeTmpRoot('smith-mcp-list-');
    cpSync(fixtureRoot, root, { recursive: true });
    patchConfigRequires(root);

    const { client, server } = await createPair();

    try {
      const templates = parseToolJson(
        await client.callTool({
          name: 'smith_list_templates',
          arguments: { cwd: root },
        }),
      );
      expect(templates.templates).toEqual([{ name: 'component', source: 'local' }]);
      expect(templates.files).toBeUndefined();
    } finally {
      await cleanupPair(server, client);
    }
  });

  it('returns error when listing an unknown template', async () => {
    const fixtureRoot = join(__dirname, '../fixtures/basic-project');
    const root = makeTmpRoot('smith-mcp-missing-template-');
    cpSync(fixtureRoot, root, { recursive: true });
    patchConfigRequires(root);

    const { client, server } = await createPair();

    try {
      const result = await client.callTool({
        name: 'smith_list_templates',
        arguments: { cwd: root, template: 'missing' },
      });
      expect(result).toEqual(
        expect.objectContaining({
          isError: true,
          content: [
            expect.objectContaining({
              text: expect.stringContaining('Template not found: missing'),
            }),
          ],
        }),
      );
    } finally {
      await cleanupPair(server, client);
    }
  });

  it('returns error when reading a missing smith file', async () => {
    const fixtureRoot = join(__dirname, '../fixtures/basic-project');
    const root = makeTmpRoot('smith-mcp-missing-file-');
    cpSync(fixtureRoot, root, { recursive: true });
    patchConfigRequires(root);

    const { client, server } = await createPair();

    try {
      const result = await client.callTool({
        name: 'smith_read_file',
        arguments: { cwd: root, path: 'missing.js' },
      });
      expect(result).toEqual(
        expect.objectContaining({
          isError: true,
          content: [expect.objectContaining({ text: 'File not found: missing.js' })],
        }),
      );
    } finally {
      await cleanupPair(server, client);
    }
  });

  it('rejects smith_read_file through symlinks that escape .smith', async () => {
    const fixtureRoot = join(__dirname, '../fixtures/basic-project');
    const root = makeTmpRoot('smith-mcp-symlink-escape-');
    cpSync(fixtureRoot, root, { recursive: true });
    patchConfigRequires(root);

    const secret = join(root, 'secret.txt');
    writeFileSync(secret, 'host-secret', 'utf8');
    try {
      symlinkSync(secret, join(root, '.smith', 'escape.txt'));
    } catch {
      return;
    }

    const { client, server } = await createPair();

    try {
      const result = await client.callTool({
        name: 'smith_read_file',
        arguments: { cwd: root, path: 'escape.txt' },
      });
      expect(result).toEqual(
        expect.objectContaining({
          isError: true,
          content: [expect.objectContaining({ text: expect.stringMatching(/symlink/) })],
        }),
      );
    } finally {
      await cleanupPair(server, client);
    }
  });

  it('rejects smith_read_file when path is a directory', async () => {
    const fixtureRoot = join(__dirname, '../fixtures/basic-project');
    const root = makeTmpRoot('smith-mcp-read-dir-');
    cpSync(fixtureRoot, root, { recursive: true });
    patchConfigRequires(root);

    const { client, server } = await createPair();

    try {
      const result = await client.callTool({
        name: 'smith_read_file',
        arguments: { cwd: root, path: 'templates' },
      });
      expect(result).toEqual(
        expect.objectContaining({
          isError: true,
          content: [expect.objectContaining({ text: 'File not found: templates' })],
        }),
      );
    } finally {
      await cleanupPair(server, client);
    }
  });

  it('rejects listing a template that contains a symlink', async () => {
    const fixtureRoot = join(__dirname, '../fixtures/basic-project');
    const root = makeTmpRoot('smith-mcp-tpl-symlink-');
    cpSync(fixtureRoot, root, { recursive: true });
    patchConfigRequires(root);

    const secret = join(root, 'secret.txt');
    writeFileSync(secret, 'host-secret', 'utf8');
    try {
      symlinkSync(secret, join(root, '.smith', 'templates', 'component', 'link.txt'));
    } catch {
      return;
    }

    const { client, server } = await createPair();

    try {
      const listed = await client.callTool({
        name: 'smith_list_templates',
        arguments: { cwd: root, template: 'component' },
      });
      expect(listed).toEqual(
        expect.objectContaining({
          isError: true,
          content: [expect.objectContaining({ text: expect.stringMatching(/symlink/) })],
        }),
      );

      const tree = await client.callTool({
        name: 'smith_list_templates',
        arguments: { cwd: root, template: 'component', includeTree: true },
      });
      expect(tree).toEqual(
        expect.objectContaining({
          isError: true,
          content: [expect.objectContaining({ text: expect.stringMatching(/symlink/) })],
        }),
      );
    } finally {
      await cleanupPair(server, client);
    }
  });

  it('validates root config without a template name', async () => {
    const fixtureRoot = join(__dirname, '../fixtures/basic-project');
    const root = makeTmpRoot('smith-mcp-validate-root-');
    cpSync(fixtureRoot, root, { recursive: true });
    patchConfigRequires(root);

    const { client, server } = await createPair();

    try {
      const validate = parseToolJson(
        await client.callTool({
          name: 'smith_validate',
          arguments: { cwd: root },
        }),
      );
      expect(validate).toEqual(
        expect.objectContaining({
          ok: true,
          validated: ['global', 'root'],
        }),
      );
    } finally {
      await cleanupPair(server, client);
    }
  });

  it('validates root config using process.cwd when cwd is omitted', async () => {
    const fixtureRoot = join(__dirname, '../fixtures/basic-project');
    const root = makeTmpRoot('smith-mcp-validate-default-cwd-');
    cpSync(fixtureRoot, root, { recursive: true });
    patchConfigRequires(root);

    const previousCwd = process.cwd();
    process.chdir(root);
    const { client, server } = await createPair();

    try {
      const validate = parseToolJson(
        await client.callTool({
          name: 'smith_validate',
          arguments: {},
        }),
      );
      expect(validate.ok).toBe(true);
      expect(validate.validated).toEqual(['global', 'root']);
    } finally {
      process.chdir(previousCwd);
      await cleanupPair(server, client);
    }
  });

  it('returns error when validating an unknown template', async () => {
    const fixtureRoot = join(__dirname, '../fixtures/basic-project');
    const root = makeTmpRoot('smith-mcp-validate-missing-');
    cpSync(fixtureRoot, root, { recursive: true });
    patchConfigRequires(root);

    const { client, server } = await createPair();

    try {
      const result = await client.callTool({
        name: 'smith_validate',
        arguments: { cwd: root, template: 'missing' },
      });
      expect(result).toEqual(
        expect.objectContaining({
          isError: true,
          content: [
            expect.objectContaining({
              text: expect.stringContaining('Template not found: missing'),
            }),
          ],
        }),
      );
    } finally {
      await cleanupPair(server, client);
    }
  });

  it('returns error when root config presets are invalid', async () => {
    const fixtureRoot = join(__dirname, '../fixtures/basic-project');
    const root = makeTmpRoot('smith-mcp-validate-root-errors-');
    cpSync(fixtureRoot, root, { recursive: true });
    patchConfigRequires(root);
    writeFileSync(
      join(root, '.smith', 'config.js'),
      `module.exports = {
  placeholder: ['{{', '}}'],
  variables: {},
  defaultPreset: 'missing',
  presets: {
    core: { include: ['{{name}}.txt'] },
  },
};`,
      'utf8',
    );

    const { client, server } = await createPair();

    try {
      const result = await client.callTool({
        name: 'smith_validate',
        arguments: { cwd: root },
      });
      expect(result).toEqual(
        expect.objectContaining({
          isError: true,
          content: [
            expect.objectContaining({
              text: 'defaultPreset "missing" is not defined in presets',
            }),
          ],
        }),
      );
    } finally {
      await cleanupPair(server, client);
    }
  });

  it('returns error when merged template presets are invalid', async () => {
    const fixtureRoot = join(__dirname, '../fixtures/basic-project');
    const root = makeTmpRoot('smith-mcp-validate-template-errors-');
    cpSync(fixtureRoot, root, { recursive: true });
    patchConfigRequires(root);
    writeFileSync(
      join(root, '.smith', 'templates', 'component', 'config.js'),
      `module.exports = {
  placeholder: ['{{', '}}'],
  variables: {},
  defaultPreset: 'missing',
  presets: {
    core: { include: ['{{name}}.txt'] },
  },
};`,
      'utf8',
    );

    const { client, server } = await createPair();

    try {
      const result = await client.callTool({
        name: 'smith_validate',
        arguments: { cwd: root, template: 'component' },
      });
      expect(result).toEqual(
        expect.objectContaining({
          isError: true,
          content: [
            expect.objectContaining({
              text: 'defaultPreset "missing" is not defined in presets',
            }),
          ],
        }),
      );
    } finally {
      await cleanupPair(server, client);
    }
  });

  it('supports read and action tools against basic-project fixture', async () => {
    const fixtureRoot = join(__dirname, '../fixtures/basic-project');
    const root = makeTmpRoot('smith-mcp-read-');
    cpSync(fixtureRoot, root, { recursive: true });
    patchConfigRequires(root);

    const { client, server } = await createPair();

    try {
      jest.spyOn(console, 'log').mockImplementation(() => undefined);

      const info = parseToolJson(
        await client.callTool({
          name: 'smith_project_info',
          arguments: { cwd: root },
        }),
      );
      expect(info.root).toBe(root);
      expect(info.templates).toEqual([{ name: 'component', source: 'local' }]);

      const templates = parseToolJson(
        await client.callTool({
          name: 'smith_list_templates',
          arguments: { cwd: root, template: 'component', includeTree: true },
        }),
      );
      expect(templates.files).toEqual(['{{name}}.txt']);
      expect(templates.tree).toBeDefined();

      const config = parseToolJson(
        await client.callTool({
          name: 'smith_read_file',
          arguments: { cwd: root, path: 'config.js' },
        }),
      );
      expect(String(config.content)).toContain('createSmithConfig');

      const validate = parseToolJson(
        await client.callTool({
          name: 'smith_validate',
          arguments: { cwd: root, template: 'component' },
        }),
      );
      expect(validate.ok).toBe(true);

      const replicate = parseToolJson(
        await client.callTool({
          name: 'smith_replicate',
          arguments: { cwd: root, name: 'Button', template: 'component', skip: true },
        }),
      );
      expect(replicate.ok).toBe(true);
      expect(readFileSync(join(root, 'Button.txt'), 'utf8')).toBe('Hello Button');
    } finally {
      await cleanupPair(server, client);
    }
  });

  it('supports scaffold tools for a fresh project', async () => {
    const root = makeTmpRoot('smith-mcp-scaffold-');
    const { client, server } = await createPair();

    try {
      const init = parseToolJson(
        await client.callTool({
          name: 'smith_init',
          arguments: { cwd: root },
        }),
      );
      expect(init.ok).toBe(true);
      expect(existsSync(join(root, '.smith', 'config.js'))).toBe(true);
      expect(existsSync(join(root, '.smith', 'templates'))).toBe(true);

      const createConfig = parseToolJson(
        await client.callTool({
          name: 'smith_create_config',
          arguments: { cwd: root },
        }),
      );
      expect(createConfig.created).toBe(false);

      const createTemplate = parseToolJson(
        await client.callTool({
          name: 'smith_create_template',
          arguments: { cwd: root, name: 'service' },
        }),
      );
      expect(createTemplate.ok).toBe(true);
      expect(existsSync(join(root, '.smith', 'templates', 'service', '{{name}}.txt'))).toBe(true);
    } finally {
      await cleanupPair(server, client);
    }
  });

  it('creates a template from custom files', async () => {
    const root = makeTmpRoot('smith-mcp-scaffold-custom-');
    const { client, server } = await createPair();

    try {
      await client.callTool({
        name: 'smith_init',
        arguments: { cwd: root },
      });

      const createTemplate = parseToolJson(
        await client.callTool({
          name: 'smith_create_template',
          arguments: {
            cwd: root,
            name: 'api',
            files: [{ path: 'README.md', content: '# API\n' }],
          },
        }),
      );

      expect(createTemplate.ok).toBe(true);
      expect(readFileSync(join(root, '.smith', 'templates', 'api', 'README.md'), 'utf8')).toBe('# API\n');
    } finally {
      await cleanupPair(server, client);
    }
  });

  it('lists template files without includeTree', async () => {
    const fixtureRoot = join(__dirname, '../fixtures/basic-project');
    const root = makeTmpRoot('smith-mcp-no-tree-');
    cpSync(fixtureRoot, root, { recursive: true });
    patchConfigRequires(root);

    const { client, server } = await createPair();

    try {
      const templates = parseToolJson(
        await client.callTool({
          name: 'smith_list_templates',
          arguments: { cwd: root, template: 'component', includeTree: false },
        }),
      );
      expect(templates.files).toEqual(['{{name}}.txt']);
      expect(templates.tree).toBeUndefined();
    } finally {
      await cleanupPair(server, client);
    }
  });

  it('uses process.cwd when tool cwd is omitted', async () => {
    const fixtureRoot = join(__dirname, '../fixtures/basic-project');
    const root = makeTmpRoot('smith-mcp-default-cwd-');
    cpSync(fixtureRoot, root, { recursive: true });
    patchConfigRequires(root);

    const previousCwd = process.cwd();
    process.chdir(root);
    const { client, server } = await createPair();

    try {
      const info = parseToolJson(
        await client.callTool({
          name: 'smith_project_info',
          arguments: {},
        }),
      );
      expect(info.root).toBe(realpathSync(root));
      expect(info.templates).toEqual([{ name: 'component', source: 'local' }]);
    } finally {
      process.chdir(previousCwd);
      await cleanupPair(server, client);
    }
  });

  it('returns an empty template list when templates directory is missing', async () => {
    const root = makeTmpRoot('smith-mcp-no-templates-dir-');
    mkdirSync(join(root, '.smith'), { recursive: true });
    writeFileSync(
      join(root, '.smith', 'config.js'),
      `module.exports = { placeholder: ['{{', '}}'], variables: {} };`,
      'utf8',
    );
    patchConfigRequires(root);

    const { client, server } = await createPair();

    try {
      const info = parseToolJson(
        await client.callTool({
          name: 'smith_project_info',
          arguments: { cwd: root },
        }),
      );
      expect(info.templates).toEqual([]);
    } finally {
      await cleanupPair(server, client);
    }
  });

  it('reports replicate force and skip flags in the result payload', async () => {
    const fixtureRoot = join(__dirname, '../fixtures/basic-project');
    const root = makeTmpRoot('smith-mcp-replicate-flags-');
    cpSync(fixtureRoot, root, { recursive: true });
    patchConfigRequires(root);

    const { client, server } = await createPair();

    try {
      jest.spyOn(console, 'log').mockImplementation(() => undefined);

      const replicate = parseToolJson(
        await client.callTool({
          name: 'smith_replicate',
          arguments: {
            cwd: root,
            name: 'Forced',
            template: 'component',
            force: true,
          },
        }),
      );
      expect(replicate.force).toBe(true);
      expect(replicate.skip).toBe(false);
      expect(replicate.path).toBeNull();

      const defaulted = parseToolJson(
        await client.callTool({
          name: 'smith_replicate',
          arguments: {
            cwd: root,
            name: 'Defaulted',
            template: 'component',
          },
        }),
      );
      expect(defaulted.force).toBe(true);
      expect(defaulted.skip).toBe(false);
    } finally {
      await cleanupPair(server, client);
    }
  });

  it('initializes a project using process.cwd when cwd is omitted', async () => {
    const root = makeTmpRoot('smith-mcp-init-default-cwd-');
    const previousCwd = process.cwd();
    process.chdir(root);
    const { client, server } = await createPair();

    try {
      const init = parseToolJson(
        await client.callTool({
          name: 'smith_init',
          arguments: {},
        }),
      );
      expect(init.ok).toBe(true);
      expect(existsSync(join(root, '.smith', 'config.js'))).toBe(true);
    } finally {
      process.chdir(previousCwd);
      await cleanupPair(server, client);
    }
  });

  it('supports global template MCP tools', async () => {
    const source = makeTmpRoot('smith-mcp-tpl-src-');
    writeFileSync(join(source, '{{name}}.txt'), 'Hello {{name}}', 'utf8');
    const work = makeTmpRoot('smith-mcp-tpl-work-');
    const { client, server } = await createPair();

    try {
      jest.spyOn(console, 'log').mockImplementation(() => undefined);

      const initConfig = parseToolJson(
        await client.callTool({
          name: 'smith_templates_init_config',
          arguments: { cwd: work },
        }),
      );
      expect(initConfig.ok).toBe(true);
      expect(initConfig.created).toBe(true);

      const add = parseToolJson(
        await client.callTool({
          name: 'smith_templates_add',
          arguments: {
            cwd: work,
            name: 'frontend-app',
            from: source,
            acknowledgeExecutableConfig: true,
          },
        }),
      );
      expect(add.ok).toBe(true);
      expect(add.name).toBe('frontend-app');

      const addWithoutAck = await client.callTool({
        name: 'smith_templates_add',
        arguments: {
          cwd: work,
          name: 'no-ack',
          from: source,
        },
      });
      expect(addWithoutAck).toEqual(
        expect.objectContaining({
          isError: true,
          content: [
            expect.objectContaining({
              text: expect.stringMatching(/acknowledgeExecutableConfig/),
            }),
          ],
        }),
      );

      const update = parseToolJson(
        await client.callTool({
          name: 'smith_templates_update',
          arguments: { cwd: work, name: 'frontend-app' },
        }),
      );
      expect(update.ok).toBe(true);

      const updateAll = parseToolJson(
        await client.callTool({
          name: 'smith_templates_update',
          arguments: { cwd: work },
        }),
      );
      expect(updateAll.ok).toBe(true);
      expect(updateAll.name).toBeNull();

      const remove = parseToolJson(
        await client.callTool({
          name: 'smith_templates_remove',
          arguments: { cwd: work, name: 'frontend-app' },
        }),
      );
      expect(remove.ok).toBe(true);

      const previousCwd = process.cwd();
      process.chdir(work);
      try {
        const initDefaultCwd = parseToolJson(
          await client.callTool({
            name: 'smith_templates_init_config',
            arguments: {},
          }),
        );
        expect(initDefaultCwd.ok).toBe(true);
        expect(initDefaultCwd.created).toBe(false);
      } finally {
        process.chdir(previousCwd);
      }
    } finally {
      await cleanupPair(server, client);
    }
  });

  it('validates global-only when project root is missing', async () => {
    const work = makeTmpRoot('smith-mcp-global-only-');
    const { getGlobalTemplatesDir } = await import('../../src/paths/globalSmithHome');
    mkdirSync(join(getGlobalTemplatesDir(), 'frontend-app'), { recursive: true });
    writeFileSync(
      join(getGlobalTemplatesDir(), 'frontend-app', 'config.js'),
      `module.exports = { placeholder: ['{{', '}}'], variables: {} };`,
      'utf8',
    );
    const { client, server } = await createPair();

    try {
      const validate = parseToolJson(
        await client.callTool({
          name: 'smith_validate',
          arguments: { cwd: work },
        }),
      );
      expect(validate).toEqual(
        expect.objectContaining({
          ok: true,
          root: null,
          validated: ['global'],
        }),
      );

      const validateTemplate = parseToolJson(
        await client.callTool({
          name: 'smith_validate',
          arguments: { cwd: work, template: 'frontend-app' },
        }),
      );
      expect(validateTemplate).toEqual(
        expect.objectContaining({
          ok: true,
          root: null,
          source: 'global',
          validated: ['global', 'template'],
        }),
      );
    } finally {
      await cleanupPair(server, client);
    }
  });

  it('returns error when global config presets are invalid', async () => {
    const { getGlobalConfigPath } = await import('../../src/paths/globalSmithHome');
    writeFileSync(
      getGlobalConfigPath(),
      `module.exports = {
  placeholder: ['{{', '}}'],
  variables: {},
  defaultPreset: 'missing',
  presets: { core: { include: ['*'] } },
};`,
      'utf8',
    );
    const work = makeTmpRoot('smith-mcp-bad-global-');
    const { client, server } = await createPair();

    try {
      const result = await client.callTool({
        name: 'smith_validate',
        arguments: { cwd: work },
      });
      expect(result).toEqual(
        expect.objectContaining({
          isError: true,
          content: [
            expect.objectContaining({
              text: expect.stringContaining('defaultPreset "missing"'),
            }),
          ],
        }),
      );
    } finally {
      await cleanupPair(server, client);
    }
  });
});
