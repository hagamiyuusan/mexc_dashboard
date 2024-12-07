'use client';

import { useEffect, useRef } from 'react';
import { useTradingStore } from '../store/tradingStore';

export const WebSocketConnection = () => {
  const { updatePositions, setConnectionStatus } = useTradingStore();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    console.log('WebSocketConnection effect running');
    
    const connectWebSocket = () => {
      console.log('Attempting to connect WebSocket...');
      
      // Don't create a new connection if we already have an active one
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected');
        return;
      }

      // Close existing connection if any
      if (wsRef.current) {
        console.log('Closing existing connection');
        wsRef.current.close();
        wsRef.current = null;
      }

      const ws = new WebSocket('ws://localhost:6547');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket Connected');
        setConnectionStatus({ spot: true, futures: true });
        ws.send(JSON.stringify({ type: 'subscribe' }));
      };

      ws.onclose = (event) => {
        console.log('WebSocket Disconnected', event.code, event.reason);
        setConnectionStatus({ spot: false, futures: false });
        
        // Only attempt reconnect if this is still the current websocket
        if (ws === wsRef.current) {
          console.log('Scheduling reconnection...');
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting reconnection...');
            connectWebSocket();
          }, 5000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);
          updatePositions(data);
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };
    };

    // Initial connection
    connectWebSocket();

    // Cleanup function
    return () => {
      console.log('Cleanup running');
      
      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }

      // Close and cleanup the WebSocket connection
      if (wsRef.current) {
        const ws = wsRef.current;
        wsRef.current = null; // Clear the ref first to prevent reconnection attempts
        ws.close();
      }
    };
  }, []); // Empty dependency array

  return null;
};