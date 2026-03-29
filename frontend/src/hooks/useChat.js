import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export function useChat({ token, onMessage, onConnected, onDisconnected }) {
  const clientRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        if (onConnected) onConnected(client);
      },
      onDisconnect: () => {
        if (onDisconnected) onDisconnected();
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [token]);

  const subscribe = useCallback((destination, callback) => {
    const client = clientRef.current;
    if (!client || !client.connected) return null;
    return client.subscribe(destination, (msg) => {
      try {
        callback(JSON.parse(msg.body));
      } catch {
        callback(msg.body);
      }
    });
  }, []);

  const send = useCallback((destination, body) => {
    const client = clientRef.current;
    if (!client || !client.connected) return;
    client.publish({ destination, body: JSON.stringify(body) });
  }, []);

  return { subscribe, send, clientRef };
}
