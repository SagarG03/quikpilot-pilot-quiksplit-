import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, "..", "public", "index.html"), "utf8");

const nextButtons = [...html.matchAll(/<button\b[^>]*>\s*Next\s*<\/button>/gi)];

function isPink(color) {
  const c = color.trim().toLowerCase();
  if (/\b(pink|hotpink|lightpink|deeppink)\b/.test(c)) return true;
  const hex = c.match(/^#([0-9a-f]{6})$/);
  if (!hex) return false;
  const r = parseInt(hex[1].slice(0, 2), 16);
  const g = parseInt(hex[1].slice(2, 4), 16);
  const b = parseInt(hex[1].slice(4, 6), 16);
  return r >= g + 40 && b >= g && r >= b;
}

describe("QuikSplit Next button", () => {
  it("[QP-TEST4-18-1] Adds exactly one button labelled Next to the page", () => {
    expect(nextButtons.length).toBe(1);
  });

  it("[QP-TEST4-18-2] Gives the Next button a pink background", () => {
    expect(nextButtons.length).toBe(1);
    const tag = nextButtons[0][0];
    const openTag = tag.match(/^<button\b[^>]*>/i)[0];
    const id = (openTag.match(/\bid\s*=\s*"([^"]+)"/i) || [])[1];
    const classes = ((openTag.match(/\bclass\s*=\s*"([^"]+)"/i) || [])[1] || "")
      .split(/\s+/)
      .filter(Boolean);
    const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n");
    const selectorMatches = (sel) =>
      sel.split(",").some((s) => {
        const t = s.trim();
        return (id && t === `#${id}`) || classes.some((c) => t === `.${c}`);
      });
    let background = null;
    for (const m of styles.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      if (!selectorMatches(m[1])) continue;
      const bg = m[2].match(/background(?:-color)?\s*:\s*([^;]+)/i);
      if (bg) background = bg[1];
    }
    const inline = (openTag.match(/style\s*=\s*"([^"]*)"/i) || [])[1] || "";
    const inlineBg = inline.match(/background(?:-color)?\s*:\s*([^;]+)/i);
    if (inlineBg) background = inlineBg[1];
    expect(background).not.toBeNull();
    expect(isPink(background)).toBe(true);
  });
});
