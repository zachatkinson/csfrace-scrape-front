/**
 * Job Actions Hook
 * SOLID: Single Responsibility - Handles only job action operations
 * DRY: Consolidates job action patterns from DashboardManager
 */

import { useCallback } from "react";
import type { IJobData } from "../../../types/job.ts";
import * as apiClient from "../../../utils/dashboard/apiClient.ts";
import { formatErrorMessage, logError } from "../../../utils/api-utils.ts";

export interface UseJobActionsOptions {
  onJobUpdated?: () => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

export function useJobActions(options: UseJobActionsOptions = {}) {
  const { onJobUpdated, onError, onSuccess } = options;

  const retryJob = useCallback(
    async (jobId: number) => {
      try {
        await apiClient.retryJob(jobId);
        onJobUpdated?.();
        onSuccess?.("Job retry initiated successfully");
      } catch (error) {
        logError(error, "Job Retry");
        onError?.(formatErrorMessage(error, "Retry failed"));
      }
    },
    [onJobUpdated, onError, onSuccess],
  );

  const cancelJob = useCallback(
    async (jobId: number) => {
      try {
        await apiClient.cancelJob(jobId);
        onJobUpdated?.();
        onSuccess?.("Job cancelled successfully");
      } catch (error) {
        logError(error, "Job Cancel");
        onError?.(formatErrorMessage(error, "Cancel failed"));
      }
    },
    [onJobUpdated, onError, onSuccess],
  );

  const deleteJob = useCallback(
    async (jobId: number) => {
      if (!confirm("Delete this job?")) {
        return;
      }

      try {
        await apiClient.deleteJob(jobId);
        onJobUpdated?.();
        onSuccess?.("Job deleted successfully");
      } catch (error) {
        logError(error, "Job Delete");
        onError?.(formatErrorMessage(error, "Delete failed"));
      }
    },
    [onJobUpdated, onError, onSuccess],
  );

  const downloadJob = useCallback(
    async (jobId: number, jobs: IJobData[]) => {
      try {
        const job = jobs.find((j) => j.id === jobId);
        if (!job || job.status !== "completed") {
          onError?.("Job must be completed to download");
          return;
        }

        const content = await apiClient.downloadJobContent(jobId);

        const blob = new Blob([content], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `job-${jobId}-${job.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.html`;
        a.click();
        URL.revokeObjectURL(url);

        onSuccess?.("Download started successfully");
      } catch (error) {
        logError(error, "File Download");
        onError?.(formatErrorMessage(error, "Download failed"));
      }
    },
    [onError, onSuccess],
  );

  return {
    retryJob,
    cancelJob,
    deleteJob,
    downloadJob,
  };
}
