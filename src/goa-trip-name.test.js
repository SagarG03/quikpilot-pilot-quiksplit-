import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, "..", "public", "index.html"), "utf8");
const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n");

function isBlue(color) {
  const c = color.trim().toLowerCase();
  if (/\bblue\b/.test(c)) return true;
  const hex = c.match(/^#([0-9a-f]{6})$/);
  if (!hex) return false;
  const r = parseInt(hex[1].slice(0, 2), 16);
  const g = parseInt(hex[1].slice(2, 4), 16);
  const b = parseInt(hex[1].slice(4, 6), 16);
  return b >= r + 40 && b >= g;
}

describe("Goa trip group name colour", () => {
  it("[QP-TEST4-20-1] Shows the Goa trip group name in blue", () => {
    // The group list renders each group name as a <span> inside a button under #groups.
    let color = null;
    for (const m of styles.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      const targetsName = m[1]
        .split(",")
        .some((s) => /\.groups\b/.test(s) && /\bspan\b/.test(s) && !/\.count/.test(s));
      if (!targetsName) continue;
      const c = m[2].match(/(?:^|[;\s])color\s*:\s*([^;]+)/i);
      if (c) color = c[1];
    }
    expect(color).not.toBeNull();
    expect(isBlue(color)).toBe(true);
  });
});
