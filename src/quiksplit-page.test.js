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

  it("[QP-TEST4-19-1] Reloads the browser page when Next is clicked", () => {
    expect(html).toMatch(/location\.reload\s*\(\s*\)/);
  });

  it("[QP-TEST4-19-2] Discards the current view and form state on Next", () => {
    expect(html).toMatch(/location\.reload\s*\(\s*\)/);
    expect(html).not.toMatch(/localStorage|sessionStorage/);
  });

  it("[QP-TEST4-19-3] the button text should be next", () => {
    expect(nextButtons.length).toBe(1);
  });
});

describe("QuikSplit group refresh", () => {
  it("[QP-TESTI-13-1] Refresh button is shown on the same row as the group title", () => {
    const header = html.match(/<header class="head">([\s\S]*?)<\/header>/i);
    expect(header).not.toBeNull();
    expect(header[1]).toMatch(/<h1 id="title">/);
    expect(header[1]).toMatch(/<button\b[^>]*\bid\s*=\s*"refresh"[^>]*>/i);
  });

  it("[QP-TESTI-13-2] Pressing refresh reloads balances and settle-up payments", () => {
    expect(html).toMatch(/refresh[\s\S]{0,600}loadGroup\(current\.id\)/);
    expect(html).toMatch(/fetch\(`\/api\/groups\/\$\{id\}`\)/);
  });

  it("[QP-TESTI-13-3] Refresh button shows busy state and ignores repeat presses", () => {
    expect(html).toMatch(/refresh[\s\S]{0,800}\.disabled\s*=\s*true/);
    expect(html).toMatch(/refresh[\s\S]{0,800}if \((refreshing|busy)\)\s*return/);
  });

  it("[QP-TESTI-13-4] Failed refresh keeps existing figures and shows an error", () => {
    expect(html).toMatch(/refresh[\s\S]{0,800}catch[\s\S]{0,300}showError\(/);
    expect(html).toMatch(/did not complete/);
  });
});

describe("QuikSplit Open button", () => {
  it("[QP-TESTI-15-1] Home page shows an Open button", () => {
    const openButtons = [...html.matchAll(/<button\b[^>]*>\s*Open\s*<\/button>/gi)];
    expect(openButtons.length).toBe(1);
    expect(openButtons[0][0]).not.toMatch(/display\s*:\s*none/i);
  });

  it("[QP-TESTI-15-2] Open moves to the next page of the list in the same view", () => {
    expect(html).toMatch(/page\s*(\+\+|\+=\s*1|=\s*page\s*\+\s*1)[\s\S]{0,200}loadHistory\(false\)/);
    expect(html).toMatch(/<button\b[^>]*>\s*Open\s*<\/button>/i);
    expect(html).not.toMatch(/location\.(href\s*=|assign\(|replace\()/);
  });
});
