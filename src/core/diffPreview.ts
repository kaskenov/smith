const DEFAULT_MAX_LINES = 40;

type DiffOp = { type: 'same' | 'remove' | 'add'; line: string };

function diffLines(existing: string[], incoming: string[]): DiffOp[] {
  const m = existing.length;
  const n = incoming.length;
  const lcs: number[][] = Array.from({ length: m + 1 }, () => Array<number>(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      if (existing[i] === incoming[j]) lcs[i]![j] = lcs[i + 1]![j + 1]! + 1;
      else lcs[i]![j] = Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
    }
  }

  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (existing[i] === incoming[j]) {
      ops.push({ type: 'same', line: existing[i]! });
      i += 1;
      j += 1;
    } else if (lcs[i + 1]![j]! >= lcs[i]![j + 1]!) {
      ops.push({ type: 'remove', line: existing[i]! });
      i += 1;
    } else {
      ops.push({ type: 'add', line: incoming[j]! });
      j += 1;
    }
  }
  while (i < m) {
    ops.push({ type: 'remove', line: existing[i]! });
    i += 1;
  }
  while (j < n) {
    ops.push({ type: 'add', line: incoming[j]! });
    j += 1;
  }
  return ops;
}

function truncateBlock(label: string, content: string, maxLines: number): string {
  const lines = content.split('\n');
  const truncated = lines.length > maxLines;
  const visible = lines.slice(0, maxLines);
  const suffix = truncated ? `\n... (${lines.length - maxLines} more lines)` : '';
  return `${label}\n${visible.join('\n')}${suffix}`;
}

export function buildMergeTemplate(existing: string, incoming: string): string {
  const trimExisting = existing.replace(/\n$/, '');
  const trimIncoming = incoming.replace(/\n$/, '');
  return [
    '<<<<<<< existing (keep)',
    trimExisting,
    '=======',
    trimIncoming,
    '>>>>>>> incoming (overwrite)',
    '',
  ].join('\n');
}

export function formatConflictPreview(
  target: string,
  existing: string,
  incoming: string,
  maxLines = DEFAULT_MAX_LINES,
): string {
  const existingLines = existing.split('\n');
  const incomingLines = incoming.split('\n');
  const ops = diffLines(existingLines, incomingLines);

  const diffLinesOut: string[] = [];
  for (const op of ops) {
    if (op.type === 'same') diffLinesOut.push(` ${op.line}`);
    else if (op.type === 'remove') diffLinesOut.push(`-${op.line}`);
    else diffLinesOut.push(`+${op.line}`);
  }

  const diffTruncated = diffLinesOut.length > maxLines;
  const visibleDiff = diffLinesOut.slice(0, maxLines);
  const diffSuffix = diffTruncated
    ? `\n... (${diffLinesOut.length - maxLines} more diff lines)`
    : '';

  return [
    `Conflict: ${target}`,
    '',
    truncateBlock('--- keep (existing)', existing, maxLines),
    '',
    truncateBlock('+++ overwrite (incoming)', incoming, maxLines),
    '',
    'Unified diff (- keep, + overwrite):',
    visibleDiff.join('\n') + diffSuffix,
  ].join('\n');
}
