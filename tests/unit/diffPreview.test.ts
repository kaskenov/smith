import { buildMergeTemplate, formatConflictPreview } from '../../src/core/diffPreview';

describe('diffPreview', () => {
  it('builds git-style merge template', () => {
    expect(buildMergeTemplate('old line\n', 'new line\n')).toBe(
      [
        '<<<<<<< existing (keep)',
        'old line',
        '=======',
        'new line',
        '>>>>>>> incoming (overwrite)',
        '',
      ].join('\n'),
    );
  });

  it('formats conflict preview with keep, incoming, and unified diff', () => {
    const preview = formatConflictPreview('/tmp/Button.txt', 'Hello old\n', 'Hello new\n');
    expect(preview).toContain('Conflict: /tmp/Button.txt');
    expect(preview).toContain('--- keep (existing)');
    expect(preview).toContain('Hello old');
    expect(preview).toContain('+++ overwrite (incoming)');
    expect(preview).toContain('Hello new');
    expect(preview).toContain('Unified diff (- keep, + overwrite):');
    expect(preview).toContain('-Hello old');
    expect(preview).toContain('+Hello new');
  });

  it('truncates long previews', () => {
    const existing = Array.from({ length: 50 }, (_, i) => `old-${i}`).join('\n');
    const incoming = Array.from({ length: 50 }, (_, i) => `new-${i}`).join('\n');
    const preview = formatConflictPreview('/tmp/long.txt', existing, incoming, 5);
    expect(preview).toContain('... (45 more lines)');
    expect(preview).toContain('... (');
  });
});
