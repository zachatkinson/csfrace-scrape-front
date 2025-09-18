// =============================================================================
// UI UPDATER UTILITY - SHARED MODULE
// =============================================================================
// Single Responsibility: Centralized UI update logic
// Used by both main page and separate metrics scripts
// =============================================================================

export type ServiceStatus = "up" | "degraded" | "down" | "error";

const CONFIG = {
  STATUS_COLORS: {
    up: "bg-green-500",
    degraded: "bg-yellow-500",
    down: "bg-red-500",
    error: "bg-gray-500",
  },
  STATUS_TEXT_COLORS: {
    up: "text-green-400",
    degraded: "text-yellow-400",
    down: "text-red-400",
    error: "text-gray-400",
  },
} as const;

export class UIUpdater {
  static updateElement(
    elementId: string,
    content: string,
    className?: string,
  ): void {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.innerHTML = content;
    if (className) {
      element.className = className;
    }
  }

  static updateTextElement(
    elementId: string,
    text: string,
    status?: ServiceStatus,
  ): void {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.textContent = text;
    if (status) {
      const colorClass = CONFIG.STATUS_TEXT_COLORS[status];
      element.className =
        `${element.className.replace(/text-\w+-\d+/g, "")} ${colorClass}`.trim();
    }
  }

  static updateStatusIndicator(elementId: string, status: ServiceStatus): void {
    const element = document.getElementById(elementId);
    if (!element) return;

    const colorClass = CONFIG.STATUS_COLORS[status];
    element.className =
      element.className.replace(/bg-\w+-\d+/g, "") + ` ${colorClass}`;

    // Remove animation classes when updating to final status
    if (status === "up") {
      element.classList.remove("animate-pulse");
    } else {
      element.classList.add("animate-pulse");
    }
  }
}
