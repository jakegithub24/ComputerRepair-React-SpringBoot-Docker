import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * Hook for managing real-time order status updates via WebSocket
 * Subscribes to order status change broadcasts from the server
 */
export function useOrderUpdates({ token, onOrderUpdated, onOrderCreated, onStatusChange }) {
  const clientRef = useRef(null);
  const subscriptionsRef = useRef([]);

  useEffect(() => {
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        // Subscribe to user's order updates (e.g., /user/orders/{userId})
        if (onOrderUpdated) {
          const sub = client.subscribe('/user/orders/updates', (msg) => {
            try {
              const order = JSON.parse(msg.body);
              onOrderUpdated(order);
            } catch (err) {
              console.error('Error parsing order update:', err);
            }
          });
          subscriptionsRef.current.push(sub);
        }

        // Subscribe to new order created events (for admins viewing all orders)
        if (onOrderCreated) {
          const sub = client.subscribe('/topic/orders/created', (msg) => {
            try {
              const order = JSON.parse(msg.body);
              onOrderCreated(order);
            } catch (err) {
              console.error('Error parsing new order:', err);
            }
          });
          subscriptionsRef.current.push(sub);
        }

        // Subscribe to order status changes
        if (onStatusChange) {
          const sub = client.subscribe('/user/orders/status-change', (msg) => {
            try {
              const update = JSON.parse(msg.body);
              onStatusChange(update);
            } catch (err) {
              console.error('Error parsing status change:', err);
            }
          });
          subscriptionsRef.current.push(sub);
        }
      },
      onDisconnect: () => {
        subscriptionsRef.current.forEach((sub) => sub?.unsubscribe());
        subscriptionsRef.current = [];
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      subscriptionsRef.current.forEach((sub) => sub?.unsubscribe());
      subscriptionsRef.current = [];
      client.deactivate();
    };
  }, [token, onOrderUpdated, onOrderCreated, onStatusChange]);

  return clientRef;
}
