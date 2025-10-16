/**
 * Job Selection Hook
 * SOLID: Single Responsibility - Handles only job selection state
 * DRY: Consolidates selection patterns from DashboardManager
 */

import { useState, useCallback } from "react";

export function useJobSelection() {
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());

  const selectJob = useCallback((jobId: string) => {
    setSelectedJobs((prev) => {
      const newSelection = new Set(prev);
      newSelection.add(jobId);
      return newSelection;
    });
  }, []);

  const deselectJob = useCallback((jobId: string) => {
    setSelectedJobs((prev) => {
      const newSelection = new Set(prev);
      newSelection.delete(jobId);
      return newSelection;
    });
  }, []);

  const toggleJobSelection = useCallback(
    (jobId: string, selected: boolean) => {
      if (selected) {
        selectJob(jobId);
      } else {
        deselectJob(jobId);
      }
    },
    [selectJob, deselectJob],
  );

  const selectAll = useCallback((jobIds: string[]) => {
    setSelectedJobs(new Set(jobIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedJobs(new Set());
  }, []);

  const isSelected = useCallback(
    (jobId: string) => {
      return selectedJobs.has(jobId);
    },
    [selectedJobs],
  );

  const selectedCount = selectedJobs.size;
  const hasSelection = selectedCount > 0;

  return {
    selectedJobs,
    selectJob,
    deselectJob,
    toggleJobSelection,
    selectAll,
    clearSelection,
    isSelected,
    selectedCount,
    hasSelection,
  };
}
