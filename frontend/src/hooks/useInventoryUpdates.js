import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * Hook for managing real-time inventory updates via WebSocket
 * Notifies about stock changes, new products, and removed products
 */
export function useInventoryUpdates({ token, onInventoryChanged, onProductAdded, onProductRemoved }) {
  const clientRef = useRef(null);
  const subscriptionsRef = useRef([]);

  useEffect(() => {
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        // Subscribe to inventory changes (all users see this for products they viewed)
        if (onInventoryChanged) {
          const sub = client.subscribe('/topic/inventory/changed', (msg) => {
            try {
              const update = JSON.parse(msg.body);
              onInventoryChanged(update);
            } catch (err) {
              console.error('Error parsing inventory update:', err);
            }
          });
          subscriptionsRef.current.push(sub);
        }

        // Subscribe to new product notifications
        if (onProductAdded) {
          const sub = client.subscribe('/topic/products/added', (msg) => {
            try {
              const product = JSON.parse(msg.body);
              onProductAdded(product);
            } catch (err) {
              console.error('Error parsing new product:', err);
            }
          });
          subscriptionsRef.current.push(sub);
        }

        // Subscribe to product removal notifications
        if (onProductRemoved) {
          const sub = client.subscribe('/topic/products/removed', (msg) => {
            try {
              const update = JSON.parse(msg.body);
              onProductRemoved(update);
            } catch (err) {
              console.error('Error parsing product removal:', err);
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
  }, [token, onInventoryChanged, onProductAdded, onProductRemoved]);

  return clientRef;
}
