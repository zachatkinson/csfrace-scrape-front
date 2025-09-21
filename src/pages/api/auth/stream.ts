/**
 * Astro SSE Proxy for Backend Authentication Stream
 * Enterprise solution for cross-origin SSE + HTTP-only cookies
 *
 * This proxy solves Safari EventSource + cross-origin cookie limitations
 * by making the SSE stream same-origin while forwarding authentication cookies
 */

import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
  const logger = console;

  try {
    logger.info("🔄 [SSE Proxy] Proxying authentication stream to backend");

    // Get backend URL and create SSE endpoint
    // Use Docker service name for container-to-container communication
    const backendStreamUrl = "http://backend:8000/auth/stream";

    // Forward all cookies from the frontend request to the backend
    const forwardHeaders: Record<string, string> = {
      Accept: "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    };

    // Forward authentication cookies to backend
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      forwardHeaders["Cookie"] = cookieHeader;
      logger.info("🍪 [SSE Proxy] Forwarding cookies to backend", {
        cookieHeader: cookieHeader, // Show full cookie header for debugging
        cookieCount: cookieHeader.split(";").length,
        containsAuthToken: cookieHeader.includes("auth_token"),
        containsRefreshToken: cookieHeader.includes("refresh_token"),
      });
    } else {
      logger.warn("⚠️ [SSE Proxy] No cookies in request headers", {
        allHeaders: Object.fromEntries(request.headers.entries()),
        userAgent: request.headers.get("user-agent"),
        origin: request.headers.get("origin"),
        referer: request.headers.get("referer"),
      });
    }

    // Create ReadableStream to handle SSE proxy
    const stream = new ReadableStream({
      async start(controller) {
        let backendResponse: Response | null = null;
        let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

        try {
          // Connect to backend SSE stream
          logger.info("🔗 [SSE Proxy] Connecting to backend SSE stream", {
            url: backendStreamUrl,
          });

          backendResponse = await fetch(backendStreamUrl, {
            method: "GET",
            headers: forwardHeaders,
            // Note: Don't use 'credentials: include' here as we're manually forwarding cookies
          });

          if (!backendResponse.ok) {
            throw new Error(
              `Backend SSE stream failed: ${backendResponse.status} ${backendResponse.statusText}`,
            );
          }

          if (!backendResponse.body) {
            throw new Error("Backend SSE stream has no body");
          }

          logger.info(
            "✅ [SSE Proxy] Connected to backend SSE stream successfully",
          );

          // Get the backend stream reader
          reader = backendResponse.body.getReader();
          const decoder = new TextDecoder();

          // Forward all data from backend to frontend
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              logger.info("🔚 [SSE Proxy] Backend stream ended");
              break;
            }

            // Forward the chunk to the frontend
            controller.enqueue(value);

            // Log SSE events (for debugging)
            const chunk = decoder.decode(value, { stream: true });
            if (chunk.includes("data:")) {
              logger.info("📡 [SSE Proxy] Forwarding SSE event", {
                eventPreview: chunk.substring(0, 200).replace(/\n/g, "\\n"),
              });
            }
          }
        } catch (error) {
          logger.error("❌ [SSE Proxy] Stream error:", error);

          // Send error event to frontend
          const errorData = `data: ${JSON.stringify({
            type: "error",
            error:
              error instanceof Error ? error.message : "Unknown proxy error",
          })}\n\n`;

          controller.enqueue(new TextEncoder().encode(errorData));
        } finally {
          // Cleanup
          if (reader) {
            try {
              await reader.cancel();
            } catch (e) {
              logger.warn("⚠️ [SSE Proxy] Error closing reader:", e);
            }
          }
          controller.close();
        }
      },

      cancel() {
        logger.info("🛑 [SSE Proxy] Client disconnected from SSE proxy");
      },
    });

    // Return SSE response with proper headers
    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Disable nginx buffering for SSE
        // Don't set CORS headers for same-origin requests
        // EventSource with withCredentials: true requires same-origin or specific CORS setup
      },
    });
  } catch (error) {
    logger.error("💥 [SSE Proxy] Fatal error in SSE proxy:", error);

    return new Response(
      JSON.stringify({
        error: "SSE proxy failed",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};
