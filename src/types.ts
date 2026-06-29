export interface SmithContext {
  name: string;
  path: string;
  template: string;
  cwd: string;
  root: string;
}

export type PlaceholderDelimiters = [open: string, close: string];

export type VariableFn = (ctx: SmithContext, smith: SmithHelper) => string;
export type HookFn = (ctx: SmithContext, smith: SmithHelper) => void | Promise<void>;

export interface PresetConfig {
  include?: string[];
  exclude?: string[];
}

export interface SmithConfigInput {
  rootDir?: string;
  placeholder?: PlaceholderDelimiters;
  variables?: Record<string, VariableFn>;
  before?: HookFn;
  after?: HookFn;
  defaultPreset?: string;
  presets?: Record<string, PresetConfig>;
}

export interface SmithConfig {
  rootDir?: string;
  placeholder: PlaceholderDelimiters;
  variables: Record<string, VariableFn>;
  before?: HookFn;
  after?: HookFn;
  defaultPreset?: string;
  presets?: Record<string, PresetConfig>;
}

export type VariableMap = Record<string, string>;

export type ConflictPolicy = 'prompt' | 'force' | 'skip';

export interface FormatAPI {
  pascal(input: string): string;
  camel(input: string): string;
  kebab(input: string): string;
  snake(input: string): string;
  constant(input: string): string;
  dot(input: string): string;
  path(input: string): string;
  flat(input: string): string;
  lower(input: string): string;
  upper(input: string): string;
  slug(input: string): string;
  title(input: string): string;
  sentence(input: string): string;
  plural(input: string): string;
  singular(input: string): string;
  prefix(input: string, prefix: string): string;
  suffix(input: string, suffix: string): string;
}

export interface PathAPI {
  resolve(...segments: string[]): string;
  join(...segments: string[]): string;
  relative(from: string, to: string): string;
  isInside(child: string, parent: string): boolean;
  fromRoot(...segments: string[]): string;
  fromCwd(...segments: string[]): string;
  toOutput(...segments: string[]): string;
}

export interface FsAPI {
  read(file: string): string;
  write(file: string, content: string): void;
  append(file: string, content: string): void;
  exists(file: string): boolean;
  ensureDir(dir: string): void;
  copy(src: string, dest: string): void;
}

export interface TemplateAPI {
  dir: string;
  read(file: string): string;
}

export interface SmithHelper {
  format: FormatAPI;
  path: PathAPI;
  fs: FsAPI;
  template: TemplateAPI;
}

export interface ReplicateOptions {
  name: string;
  template: string;
  path?: string;
  force?: boolean;
  skip?: boolean;
  preset?: string;
}
