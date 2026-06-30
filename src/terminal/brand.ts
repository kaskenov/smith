import figlet from "figlet";
import { readPackageDescription } from "../package/version";
import type { SmithBannerContext } from "./bannerContext";

export const SMITH_TAGLINE = "Never Send A Human To Do A Machine's Job";
export const FIGLET_FONT = "Chunky";

const MATRIX_GREEN = "#00FF41";
const RESET = "\x1b[39m";

function hexColor(hex: string): (text: string) => string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (text: string) => `\x1b[38;2;${r};${g};${b}m${text}${RESET}`;
}

const matrixGreen = hexColor(MATRIX_GREEN);

export function shouldColorize(): boolean {
  if (process.env.NO_COLOR !== undefined) return false;
  if (!process.stdout.isTTY) return false;
  return true;
}

export function brandSmith(text: string): string {
  if (!shouldColorize()) return text;
  return text.replace(/\bsmith\b/g, (match) => matrixGreen(match));
}

function formatFigletTitle(): string {
  const title = figlet.textSync("SMITH", { font: FIGLET_FONT }).trimEnd();
  return shouldColorize() ? matrixGreen(title) : title;
}

function formatTagline(tagline: string): string {
  return shouldColorize() ? matrixGreen(tagline) : tagline;
}

export function formatSmithBanner(
  options: {
    version?: string;
    tagline?: string;
    description?: string;
    projectContext?: string;
    updateAvailable?: string;
  } = {},
): string {
  const lines = [
    formatFigletTitle(),
    "",
    formatTagline(options.tagline ?? SMITH_TAGLINE),
    "",
    options.description ?? readPackageDescription(),
  ];

  if (options.projectContext) {
    lines.push("", options.projectContext);
  }
  if (options.version) {
    lines.push("", `v${options.version}`);
  }
  if (options.updateAvailable) {
    lines.push(`Update available: v${options.updateAvailable} → smith update`);
  }

  return lines.join("\n");
}

export function formatSmithBannerFromContext(
  context: SmithBannerContext,
  options: { version?: string; tagline?: string; description?: string } = {},
): string {
  return formatSmithBanner({
    ...options,
    projectContext: context.projectContext,
    updateAvailable: context.updateAvailable,
  });
}

export function printSmithBanner(
  options: Parameters<typeof formatSmithBanner>[0] = {},
): void {
  console.log(formatSmithBanner(options));
}

export function printSmithBannerFromContext(
  context: SmithBannerContext,
  options: { version?: string; tagline?: string; description?: string } = {},
): void {
  console.log(formatSmithBannerFromContext(context, options));
}
