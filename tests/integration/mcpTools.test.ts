import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
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
      expect(templates.templates).toEqual(['component']);
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
          content: [expect.objectContaining({ text: 'Template not found: missing' })],
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
          validated: ['root'],
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
      expect(validate.validated).toEqual(['root']);
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
          content: [expect.objectContaining({ text: 'Template not found: missing' })],
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
      const info = parseToolJson(
        await client.callTool({
          name: 'smith_project_info',
          arguments: { cwd: root },
        }),
      );
      expect(info.root).toBe(root);
      expect(info.templates).toEqual(['component']);

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
      expect(info.templates).toEqual(['component']);
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
});
