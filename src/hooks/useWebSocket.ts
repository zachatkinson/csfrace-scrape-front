/**
 * useWebSocket Hook
 * Real-time WebSocket integration for job updates
 * Implements reconnection logic and event handling
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { WebSocketEvent, ConversionJob } from '../types';
import { createContextLogger } from '../utils/logger';

const logger = createContextLogger('useWebSocket');

type WebSocketSendData = 
  | string 
  | { type: string; payload?: Record<string, unknown> }
  | { action: string; data?: unknown };

interface UseWebSocketOptions {
  url: string;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onJobUpdate?: (job: ConversionJob) => void;
  onJobComplete?: (job: ConversionJob) => void;
  onJobError?: (job: ConversionJob) => void;
  onConnectionChange?: (connected: boolean) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastMessage: WebSocketEvent | null;
  send: (data: WebSocketSendData) => void;
  reconnect: () => void;
  disconnect: () => void;
}

/**
 * Custom hook for WebSocket connection with auto-reconnection
 */
export const useWebSocket = ({
  url,
  reconnectAttempts = 5,
  reconnectInterval = 3000,
  onJobUpdate,
  onJobComplete,
  onJobError,
  onConnectionChange,
}: UseWebSocketOptions): UseWebSocketReturn => {
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketEvent | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isManualClose = useRef(false);
  
  // Clean up function
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);
  
  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    
    cleanup();
    
    try {
      setConnectionState('connecting');
      wsRef.current = new WebSocket(url);
      
      wsRef.current.onopen = () => {
        logger.info('WebSocket connected');
        setConnectionState('connected');
        setReconnectCount(0);
        
        if (onConnectionChange) {
          onConnectionChange(true);
        }
        
        // Start heartbeat
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketEvent = JSON.parse(event.data);
          setLastMessage(message);
          
          // Handle different message types
          switch (message.type) {
            case 'job_update':
              if (onJobUpdate && message.payload.data) {
                onJobUpdate(message.payload.data as ConversionJob);
              }
              break;
              
            case 'job_complete':
              if (onJobComplete && message.payload.data) {
                onJobComplete(message.payload.data as ConversionJob);
              }
              break;
              
            case 'job_error':
              if (onJobError && message.payload.data) {
                onJobError(message.payload.data as ConversionJob);
              }
              break;
              
            case 'connection_status':
              logger.info('Connection status', { data: message.payload.data });
              break;
              
            default:
              logger.warn('Unknown message type', { type: message.type });
          }
        } catch (error) {
          logger.error('Failed to parse WebSocket message', { error });
        }
      };
      
      wsRef.current.onclose = (event) => {
        logger.warn('WebSocket disconnected', { code: event.code, reason: event.reason });
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        
        if (onConnectionChange) {
          onConnectionChange(false);
        }
        
        if (!isManualClose.current && reconnectCount < reconnectAttempts) {
          setConnectionState('connecting');
          const delay = reconnectInterval * Math.pow(1.5, reconnectCount);
          
          logger.info('Attempting to reconnect', { delay, attempt: reconnectCount + 1, maxAttempts: reconnectAttempts });
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectCount(prev => prev + 1);
            connect();
          }, delay);
        } else {
          setConnectionState('disconnected');
        }
      };
      
      wsRef.current.onerror = (error) => {
        logger.error('WebSocket error', { error });
        setConnectionState('error');
      };
      
    } catch (error) {
      logger.error('Failed to create WebSocket connection', { error });
      setConnectionState('error');
    }
  }, [url, reconnectCount, reconnectAttempts, reconnectInterval, onJobUpdate, onJobComplete, onJobError, onConnectionChange, cleanup]);
  
  // Send message through WebSocket
  const send = useCallback((data: WebSocketSendData) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      logger.warn('WebSocket is not connected - cannot send message', { data });
    }
  }, []);
  
  // Manual reconnect
  const reconnect = useCallback(() => {
    isManualClose.current = false;
    setReconnectCount(0);
    connect();
  }, [connect]);
  
  // Manual disconnect
  const disconnect = useCallback(() => {
    isManualClose.current = true;
    cleanup();
    setConnectionState('disconnected');
    
    if (onConnectionChange) {
      onConnectionChange(false);
    }
  }, [cleanup, onConnectionChange]);
  
  // Initialize connection on mount
  useEffect(() => {
    isManualClose.current = false;
    connect();
    
    // Cleanup on unmount
    return () => {
      isManualClose.current = true;
      cleanup();
    };
  }, [connect, cleanup]);
  
  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Page became visible, reconnect if needed
        if (connectionState === 'disconnected' && !isManualClose.current) {
          logger.info('Page became visible, attempting to reconnect');
          reconnect();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connectionState, reconnect]);
  
  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      logger.info('Browser came online, attempting to reconnect');
      if (!isManualClose.current) {
        reconnect();
      }
    };
    
    const handleOffline = () => {
      logger.warn('Browser went offline');
      setConnectionState('error');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [reconnect]);
  
  return {
    isConnected: connectionState === 'connected',
    connectionState,
    lastMessage,
    send,
    reconnect,
    disconnect,
  };
};

export default useWebSocket;