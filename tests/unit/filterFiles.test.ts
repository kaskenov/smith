import { filterFilesByPreset, matchesPathPatterns } from '../../src/core/filterFiles';

describe('filterFilesByPreset', () => {
  const files = [
    '{{name}}.vue',
    '{{name}}.spec.ts',
    '{{name}}.types.ts',
    'nested/{{name}}.store.ts',
  ];

  it('returns all files when no include or exclude are set', () => {
    expect(filterFilesByPreset(files)).toEqual(files);
  });

  it('filters by include patterns', () => {
    expect(filterFilesByPreset(files, ['{{name}}.vue', '{{name}}.types.ts'])).toEqual([
      '{{name}}.vue',
      '{{name}}.types.ts',
    ]);
  });

  it('filters by exclude patterns', () => {
    expect(filterFilesByPreset(files, undefined, ['**/*.spec.ts'])).toEqual([
      '{{name}}.vue',
      '{{name}}.types.ts',
      'nested/{{name}}.store.ts',
    ]);
  });

  it('applies include before exclude', () => {
    expect(
      filterFilesByPreset(files, ['**/*'], ['**/*.spec.ts']),
    ).toEqual([
      '{{name}}.vue',
      '{{name}}.types.ts',
      'nested/{{name}}.store.ts',
    ]);
  });

  it('matches nested paths with glob patterns', () => {
    expect(matchesPathPatterns(['nested/**'], 'nested/{{name}}.store.ts')).toBe(true);
  });
});
