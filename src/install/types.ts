export type InstallAgent = 'cursor' | 'claude' | 'qwen';
export type InstallScope = 'local' | 'global';

export interface InstallFlags {
  cursor?: boolean;
  claude?: boolean;
  qwen?: boolean;
  global?: boolean;
  local?: boolean;
  force?: boolean;
  dryRun?: boolean;
  cwd?: string;
}
