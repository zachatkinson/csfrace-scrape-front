/**
 * Enterprise Auth Wrapper Component
 * Provides SSE + HTTP-only cookies authentication context to the entire application
 * Manages auth state synchronization between React components and vanilla JS elements
 */

import React, { useEffect } from "react";
import { AuthProvider, useBasicAuth } from "../../contexts/AuthContext";
import { createContextLogger } from "../../utils/logger";

const logger = createContextLogger("AuthWrapper");

// Inner component that uses auth context
function AuthWrapperInner({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, user, connectionStatus, authReason } =
    useBasicAuth();

  // Sync auth state with manage button visibility
  useEffect(() => {
    if (!isInitialized) return;

    const manageBtn = document.getElementById("manage-btn");
    if (manageBtn) {
      if (isAuthenticated) {
        manageBtn.classList.remove("hidden");
        logger.info("✅ Manage button shown for authenticated user", {
          user: user?.email,
          reason: authReason,
          connectionStatus,
        });
      } else {
        manageBtn.classList.add("hidden");
        logger.info("❌ Manage button hidden for unauthenticated user", {
          reason: authReason,
          connectionStatus,
        });
      }
    }

    // Dispatch auth events for other components
    if (isAuthenticated) {
      window.dispatchEvent(
        new CustomEvent("auth-success", {
          detail: { user, authReason, connectionStatus },
        }),
      );
    } else {
      window.dispatchEvent(
        new CustomEvent("auth-logout", {
          detail: { authReason, connectionStatus },
        }),
      );
    }
  }, [isAuthenticated, isInitialized, user, authReason, connectionStatus]);

  // Log SSE connection status changes
  useEffect(() => {
    logger.info("SSE connection status changed", {
      connectionStatus,
      isAuthenticated,
      authReason,
    });
  }, [connectionStatus, isAuthenticated, authReason]);

  return <>{children}</>;
}

// Main wrapper component with AuthProvider
export function AuthWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthWrapperInner>{children}</AuthWrapperInner>
    </AuthProvider>
  );
}

export default AuthWrapper;
