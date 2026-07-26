import { CREATE_SMITH_CONFIG_REQUIRE, smithConfigStarterContent } from '../../src/config/starterConfig';

describe('starterConfig', () => {
  it('uses the public package export path', () => {
    expect(CREATE_SMITH_CONFIG_REQUIRE).toBe('@kaskenov/smith/config');
    expect(smithConfigStarterContent()).toContain(`require('${CREATE_SMITH_CONFIG_REQUIRE}')`);
  });

  it('includes shared NAME_* variables for project and global starters', () => {
    const content = smithConfigStarterContent();
    expect(content).toContain('NAME_PASCAL');
    expect(content).toContain('NAME_KEBAB');
    expect(content).toContain('NAME_CONSTANT');
  });
});
