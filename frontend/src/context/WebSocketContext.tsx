import React, { createContext, useContext, useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  connected: boolean;
  lastEvent: { type: string; payload: any; timestamp: number } | null;
}

const WebSocketContext = createContext<WebSocketContextType>({ connected: false, lastEvent: null });

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<{ type: string; payload: any; timestamp: number } | null>(null);

  useEffect(() => {
    if (!user) return;

    let client: Client;
    try {
      client = new Client({
        webSocketFactory: () => new SockJS('/ws'),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          setConnected(true);

          // Subscribe to organization broadcast topic
          client.subscribe('/topic/organization', (message) => {
            try {
              const body = JSON.parse(message.body);
              setLastEvent(body);
            } catch (err) {
              console.error('Error parsing org WS message:', err);
            }
          });

          // Subscribe to user personal channel
          if (user.id) {
            client.subscribe(`/topic/user/${user.id}`, (message) => {
              try {
                const body = JSON.parse(message.body);
                setLastEvent(body);
              } catch (err) {
                console.error('Error parsing user WS message:', err);
              }
            });
          }
        },
        onDisconnect: () => {
          setConnected(false);
        },
        onStompError: (frame) => {
          console.warn('STOMP protocol error:', frame.headers['message']);
        }
      });

      client.activate();
    } catch (e) {
      console.warn('WebSocket connection init failed, will retry:', e);
    }

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [user]);

  return (
    <WebSocketContext.Provider value={{ connected, lastEvent }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
