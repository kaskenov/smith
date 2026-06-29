import picomatch from 'picomatch';

export function matchesPathPatterns(patterns: string[], relPath: string): boolean {
  return patterns.some((pattern) => picomatch(pattern, { dot: true, windows: false })(relPath));
}

export function filterFilesByPreset(
  relPaths: string[],
  include?: string[],
  exclude?: string[],
): string[] {
  let result = relPaths;

  if (include && include.length > 0) {
    result = result.filter((relPath) => matchesPathPatterns(include, relPath));
  }

  if (exclude && exclude.length > 0) {
    result = result.filter((relPath) => !matchesPathPatterns(exclude, relPath));
  }

  return result;
}
