import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { SMITH_SKILL_NAMES } from '../../src/install/constants';
import { copyBundledSkills } from '../../src/install/copySkills';
import * as packageRoot from '../../src/install/packageRoot';

describe('copyBundledSkills', () => {
  let bundledDir: string;
  let targetRoot: string;
  let getBundledDirSpy: jest.SpyInstance;

  beforeEach(() => {
    bundledDir = mkdtempSync(join(tmpdir(), 'smith-bundled-'));
    targetRoot = mkdtempSync(join(tmpdir(), 'smith-skills-target-'));

    for (const name of SMITH_SKILL_NAMES) {
      const skillDir = join(bundledDir, 'skills', name);
      mkdirSync(skillDir, { recursive: true });
      writeFileSync(join(skillDir, 'SKILL.md'), `# ${name}\n`, 'utf8');
    }

    getBundledDirSpy = jest
      .spyOn(packageRoot, 'getBundledDir')
      .mockReturnValue(bundledDir);
  });

  afterEach(() => {
    getBundledDirSpy.mockRestore();
    rmSync(bundledDir, { recursive: true, force: true });
    rmSync(targetRoot, { recursive: true, force: true });
  });

  it('copies all bundled skills into targetRoot', () => {
    const result = copyBundledSkills({ targetRoot });

    expect(result.copied).toEqual([...SMITH_SKILL_NAMES]);
    for (const name of SMITH_SKILL_NAMES) {
      const destSkill = join(targetRoot, name, 'SKILL.md');
      expect(existsSync(destSkill)).toBe(true);
      expect(readFileSync(destSkill, 'utf8')).toBe(`# ${name}\n`);
    }
  });

  it('throws when destination exists and force is not set', () => {
    copyBundledSkills({ targetRoot });
    const existingPath = join(targetRoot, SMITH_SKILL_NAMES[0]);

    expect(() => copyBundledSkills({ targetRoot })).toThrow(existingPath);
  });

  it('overwrites existing destinations when force is true', () => {
    copyBundledSkills({ targetRoot });

    const skillName = SMITH_SKILL_NAMES[0];
    const bundledSkill = join(bundledDir, 'skills', skillName);
    writeFileSync(join(bundledSkill, 'SKILL.md'), '# updated\n', 'utf8');

    const result = copyBundledSkills({ targetRoot, force: true });

    expect(result.copied).toEqual([...SMITH_SKILL_NAMES]);
    expect(readFileSync(join(targetRoot, skillName, 'SKILL.md'), 'utf8')).toBe('# updated\n');
  });

  it('uses getBundledDir for skill sources', () => {
    copyBundledSkills({ targetRoot });

    expect(getBundledDirSpy).toHaveBeenCalled();
    for (const name of SMITH_SKILL_NAMES) {
      expect(existsSync(join(targetRoot, name))).toBe(true);
    }
  });
});
