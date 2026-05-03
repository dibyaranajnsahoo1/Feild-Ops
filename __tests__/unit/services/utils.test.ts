/**
 * Unit tests for utility functions
 */
import { cn, formatCompact, truncate, slugify, escapeHtml } from "@/lib/utils";

describe("cn (classname utility)", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("resolves tailwind conflicts (last wins)", () => {
    expect(cn("p-4", "p-8")).toBe("p-8");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "no", true && "yes")).toBe("base yes");
  });

  it("handles undefined/null gracefully", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });
});

describe("formatCompact", () => {
  it("formats numbers below 1000 as-is", () => {
    expect(formatCompact(999)).toBe("999");
    expect(formatCompact(0)).toBe("0");
  });

  it("formats thousands with k suffix", () => {
    expect(formatCompact(1500)).toBe("1.5k");
    expect(formatCompact(10000)).toBe("10.0k");
  });

  it("formats millions with M suffix", () => {
    expect(formatCompact(2500000)).toBe("2.5M");
  });
});

describe("truncate", () => {
  it("returns full string if within limit", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates and appends ellipsis", () => {
    expect(truncate("hello world", 5)).toBe("hello...");
  });

  it("handles exact length match", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });
});

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("Acme Corp!!! #1")).toBe("acme-corp-1");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("one  -  two")).toBe("one-two");
  });

  it("limits length to 60 characters", () => {
    const long = "a".repeat(100);
    expect(slugify(long).length).toBeLessThanOrEqual(60);
  });
});

describe("escapeHtml", () => {
  it("escapes angle brackets", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes ampersands", () => {
    expect(escapeHtml("foo & bar")).toBe("foo &amp; bar");
  });

  it("escapes quotes", () => {
    expect(escapeHtml('"hello"')).toBe("&quot;hello&quot;");
  });

  it("leaves safe strings unchanged", () => {
    expect(escapeHtml("Hello World 123")).toBe("Hello World 123");
  });
});
