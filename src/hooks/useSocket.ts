import { useCallback } from 'react';
import { useSocket as useSocketContext } from '@/contexts/SocketContext';

/**
 * Custom hook that wraps SocketContext for typed event emission
 * and subscription across the app.
 */
export function useSocket() {
  const { socket, isConnected } = useSocketContext();

  /**
   * Emit a socket event with optional payload.
   */
  const emit = useCallback(
    (event: string, data?: unknown) => {
      if (socket && isConnected) {
        socket.emit(event, data);
      } else {
        console.warn(`[useSocket] Cannot emit "${event}" — socket not connected.`);
      }
    },
    [socket, isConnected]
  );

  /**
   * Subscribe to a socket event. Returns a cleanup function.
   */
  const on = useCallback(
    (event: string, handler: (...args: any[]) => void) => {
      if (!socket) return () => {};
      socket.on(event, handler);
      return () => {
        socket.off(event, handler);
      };
    },
    [socket]
  );

  /**
   * Unsubscribe from a socket event.
   */
  const off = useCallback(
    (event: string, handler?: (...args: any[]) => void) => {
      if (socket) socket.off(event, handler);
    },
    [socket]
  );

  return { socket, isConnected, emit, on, off };
}
