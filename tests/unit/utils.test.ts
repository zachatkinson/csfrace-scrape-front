import { describe, it, expect } from "vitest";
import {
  formatFileSize,
  formatRelativeTime,
  capitalize,
} from "../../src/utils/formatting";

describe("Utility Functions", () => {
  describe("formatFileSize", () => {
    it("should format bytes correctly", () => {
      expect(formatFileSize(0)).toBe("0 B");
      expect(formatFileSize(1024)).toBe("1 KB");
      expect(formatFileSize(1048576)).toBe("1 MB");
    });

    it("should handle null/undefined values", () => {
      expect(formatFileSize(null)).toBe("0 B");
      expect(formatFileSize(undefined)).toBe("0 B");
    });
  });

  describe("formatRelativeTime", () => {
    it("should format relative time correctly", () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const result = formatRelativeTime(fiveMinutesAgo.toISOString());
      expect(result).toBe("5m ago");
    });

    it("should handle invalid dates", () => {
      expect(formatRelativeTime("invalid-date")).toBe("Unknown");
    });
  });

  describe("capitalize", () => {
    it("should capitalize first letter", () => {
      expect(capitalize("hello")).toBe("Hello");
      expect(capitalize("HELLO")).toBe("Hello");
    });

    it("should handle empty strings", () => {
      expect(capitalize("")).toBe("");
    });
  });
});
