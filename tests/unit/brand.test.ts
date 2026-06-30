import {
  brandSmith,
  formatSmithBanner,
  formatSmithBannerFromContext,
  FIGLET_FONT,
  printSmithBanner,
  printSmithBannerFromContext,
  shouldColorize,
  SMITH_TAGLINE,
} from '../../src/terminal/brand';

const MATRIX_GREEN_PREFIX = '\x1b[38;2;0;255;65m';

describe('shouldColorize', () => {
  const originalNoColor = process.env.NO_COLOR;
  let isTty = false;

  beforeEach(() => {
    isTty = false;
    delete process.env.NO_COLOR;
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      get: () => isTty,
    });
  });

  afterEach(() => {
    if (originalNoColor === undefined) {
      delete process.env.NO_COLOR;
    } else {
      process.env.NO_COLOR = originalNoColor;
    }
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      value: false,
    });
  });

  it('returns false when NO_COLOR is set', () => {
    process.env.NO_COLOR = '1';
    isTty = true;
    expect(shouldColorize()).toBe(false);
  });

  it('returns false when stdout is not a TTY', () => {
    expect(shouldColorize()).toBe(false);
  });

  it('returns true on an interactive TTY without NO_COLOR', () => {
    isTty = true;
    expect(shouldColorize()).toBe(true);
  });
});

describe('brandSmith', () => {
  const originalNoColor = process.env.NO_COLOR;
  let isTty = false;

  beforeEach(() => {
    isTty = false;
    delete process.env.NO_COLOR;
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      get: () => isTty,
    });
  });

  afterEach(() => {
    if (originalNoColor === undefined) {
      delete process.env.NO_COLOR;
    } else {
      process.env.NO_COLOR = originalNoColor;
    }
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      value: false,
    });
  });

  it('returns text unchanged when color is disabled', () => {
    expect(brandSmith('smith — replicate code')).toBe('smith — replicate code');
  });

  it('colors only the word smith in matrix green on a TTY', () => {
    isTty = true;
    const branded = brandSmith('smith — replicate code');
    expect(branded).toBe(`${MATRIX_GREEN_PREFIX}smith\x1b[39m — replicate code`);
  });
});

describe('formatSmithBanner', () => {
  const originalNoColor = process.env.NO_COLOR;
  let isTty = false;

  beforeEach(() => {
    isTty = false;
    delete process.env.NO_COLOR;
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      get: () => isTty,
    });
  });

  afterEach(() => {
    if (originalNoColor === undefined) {
      delete process.env.NO_COLOR;
    } else {
      process.env.NO_COLOR = originalNoColor;
    }
    Object.defineProperty(process.stdout, 'isTTY', {
      configurable: true,
      value: false,
    });
  });

  it('uses defaults when called with no options', () => {
    const banner = formatSmithBanner();

    expect(banner).toContain(SMITH_TAGLINE);
    expect(banner).toContain('Template engine for scaffolding, templating, and code generation.');
  });

  it('renders the figlet title without ANSI when color is disabled', () => {
    const banner = formatSmithBanner({
      version: '2.1.0',
      description: 'Template engine for scaffolding, templating, and code generation.',
      projectContext: 'Project: demo · templates: component',
      updateAvailable: '2.2.0',
    });

    expect(banner).toContain(SMITH_TAGLINE);
    expect(banner).toContain('Template engine for scaffolding, templating, and code generation.');
    expect(banner).toContain('Project: demo · templates: component');
    expect(banner).toContain('v2.1.0');
    expect(banner).toContain('Update available: v2.2.0 → smith update');
    expect(banner).not.toMatch(/\x1b\[/);
    expect(FIGLET_FONT).toBe('Chunky');
  });

  it('renders the figlet title and tagline in matrix green on a TTY', () => {
    isTty = true;
    const banner = formatSmithBanner();
    expect(banner.startsWith(MATRIX_GREEN_PREFIX)).toBe(true);
    expect(banner).toContain(`${MATRIX_GREEN_PREFIX}${SMITH_TAGLINE}\x1b[39m`);
  });
});

describe('formatSmithBannerFromContext', () => {
  it('uses default options when only context is provided', () => {
    const banner = formatSmithBannerFromContext({
      projectContext: 'Project: demo · templates: component',
    });

    expect(banner).toContain('Project: demo · templates: component');
    expect(banner).toContain(SMITH_TAGLINE);
  });

  it('maps banner context fields', () => {
    const banner = formatSmithBannerFromContext(
      {
        projectContext: 'Project: demo · templates: component',
        updateAvailable: '3.0.0',
      },
      {
        version: '2.1.0',
        description: 'Template engine for scaffolding, templating, and code generation.',
      },
    );

    expect(banner).toContain('Template engine for scaffolding, templating, and code generation.');
    expect(banner).toContain('Project: demo · templates: component');
    expect(banner).toContain('Update available: v3.0.0 → smith update');
  });
});

describe('printSmithBanner', () => {
  it('prints the banner with default options', () => {
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    printSmithBanner();

    expect(logs[0]).toContain(SMITH_TAGLINE);
    expect(logs[0]).toContain('Template engine for scaffolding, templating, and code generation.');
  });

  it('prints the banner to stdout', () => {
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    printSmithBanner({
      version: '1.0.0',
      description: 'Template engine for scaffolding, templating, and code generation.',
    });

    expect(logs[0]).toContain(SMITH_TAGLINE);
    expect(logs[0]).toContain('v1.0.0');
    expect(logs[0]).toContain('Template engine for scaffolding, templating, and code generation.');
  });
});

describe('printSmithBannerFromContext', () => {
  it('prints the banner from context to stdout', () => {
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    printSmithBannerFromContext({
      projectContext: 'Project: demo · templates: component',
      updateAvailable: '3.0.0',
    });

    expect(logs[0]).toContain('Project: demo · templates: component');
    expect(logs[0]).toContain('Update available: v3.0.0 → smith update');
  });
});
