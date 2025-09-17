/**
 * SSE Stream Service - SOLID Open/Closed Principle
 * Handles Server-Side Events streaming for health monitoring
 * Open for extension (new event types), closed for modification
 */

export interface SSEMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface SSEConnectionMessage extends SSEMessage {
  type: 'connection';
  data: {
    message: string;
  };
}

export interface SSEServiceUpdateMessage extends SSEMessage {
  type: 'service-update';
  data: {
    service: string;
    status: string;
    timestamp: string;
    data: any;
  };
}

export interface SSEErrorMessage extends SSEMessage {
  type: 'error';
  data: {
    service: string;
    status: 'unhealthy';
    error: string;
  };
}

/**
 * Abstract base class for SSE message handlers
 * Follows Open/Closed Principle - extend for new message types
 */
export abstract class SSEMessageHandler {
  abstract handle(controller: ReadableStreamDefaultController, message: SSEMessage): void;
}

/**
 * Handler for connection messages
 */
export class ConnectionMessageHandler extends SSEMessageHandler {
  handle(controller: ReadableStreamDefaultController, message: SSEConnectionMessage): void {
    this.safeEnqueue(controller, `data: ${JSON.stringify({
      type: message.type,
      message: message.data.message,
      timestamp: message.timestamp
    })}\n\n`);
  }

  private safeEnqueue(controller: ReadableStreamDefaultController, data: string): boolean {
    try {
      if (controller.desiredSize === null) {
        return false; // Controller closed
      }
      controller.enqueue(data);
      return true;
    } catch (error) {
      return false; // Controller closed or error
    }
  }
}

/**
 * Handler for service update messages
 */
export class ServiceUpdateMessageHandler extends SSEMessageHandler {
  handle(controller: ReadableStreamDefaultController, message: SSEServiceUpdateMessage): void {
    this.safeEnqueue(controller, `event: service-update\n`);
    this.safeEnqueue(controller, `data: ${JSON.stringify(message.data)}\n\n`);
  }

  private safeEnqueue(controller: ReadableStreamDefaultController, data: string): boolean {
    try {
      if (controller.desiredSize === null) {
        return false; // Controller closed
      }
      controller.enqueue(data);
      return true;
    } catch (error) {
      return false; // Controller closed or error
    }
  }
}

/**
 * Handler for error messages
 */
export class ErrorMessageHandler extends SSEMessageHandler {
  handle(controller: ReadableStreamDefaultController, message: SSEErrorMessage): void {
    this.safeEnqueue(controller, `event: error\n`);
    this.safeEnqueue(controller, `data: ${JSON.stringify(message.data)}\n\n`);
  }

  private safeEnqueue(controller: ReadableStreamDefaultController, data: string): boolean {
    try {
      if (controller.desiredSize === null) {
        return false; // Controller closed
      }
      controller.enqueue(data);
      return true;
    } catch (error) {
      return false; // Controller closed or error
    }
  }
}

/**
 * SSE Stream Service implementation
 * Follows Interface Segregation Principle - focused on streaming
 */
export class SSEStreamService {
  private messageHandlers: Map<string, SSEMessageHandler>;

  constructor() {
    // Dependency Inversion: Register handlers (can be injected)
    this.messageHandlers = new Map<string, SSEMessageHandler>();
    this.messageHandlers.set('connection', new ConnectionMessageHandler());
    this.messageHandlers.set('service-update', new ServiceUpdateMessageHandler());
    this.messageHandlers.set('error', new ErrorMessageHandler());
  }

  /**
   * Register a new message handler (Open/Closed Principle)
   */
  registerHandler(messageType: string, handler: SSEMessageHandler): void {
    this.messageHandlers.set(messageType, handler);
  }

  /**
   * Send a message through the SSE stream
   */
  sendMessage(
    controller: ReadableStreamDefaultController,
    message: SSEMessage
  ): boolean {
    const handler = this.messageHandlers.get(message.type);
    if (!handler) {
      console.warn(`No handler found for message type: ${message.type}`);
      return false;
    }

    try {
      handler.handle(controller, message);
      return true;
    } catch (error) {
      console.error(`Error handling SSE message:`, error);
      return false;
    }
  }

  /**
   * Create connection message
   */
  createConnectionMessage(): SSEConnectionMessage {
    return {
      type: 'connection',
      data: {
        message: 'Health monitoring connected'
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create service update message
   */
  createServiceUpdateMessage(serviceData: any): SSEServiceUpdateMessage {
    return {
      type: 'service-update',
      data: serviceData,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create error message
   */
  createErrorMessage(service: string, error: string): SSEErrorMessage {
    return {
      type: 'error',
      data: {
        service,
        status: 'unhealthy',
        error
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check if controller is still open
   */
  isControllerOpen(
    controller: ReadableStreamDefaultController,
    request?: Request
  ): boolean {
    try {
      return controller.desiredSize !== null && !request?.signal?.aborted;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get SSE headers
   */
  getSSEHeaders(): Headers {
    return new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });
  }
}