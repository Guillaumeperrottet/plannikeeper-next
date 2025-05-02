// src/app/components/socket-provider.tsx
"use client";

import {
  useEffect,
  useState,
  createContext,
  useContext,
  ReactNode,
} from "react";
import io, { Socket } from "socket.io-client";
import { toast } from "sonner";
import { Bell } from "lucide-react";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  userId: string;
  children: ReactNode;
}

export function SocketProvider({ userId, children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialiser la connexion Socket.IO
    fetch("/api/socket").then(() => {
      const socketInstance = io();
      setSocket(socketInstance);

      socketInstance.on("connect", () => {
        console.log("Socket connected");
        setIsConnected(true);

        // Rejoindre le canal spécifique à l'utilisateur
        socketInstance.emit("join-user-channel", userId);
      });

      socketInstance.on("disconnect", () => {
        console.log("Socket disconnected");
        setIsConnected(false);
      });

      socketInstance.on("notification", (notification) => {
        // Afficher une notification toast
        toast.custom((t) => (
          <div
            // Sonner handles enter/leave animations automatically.
            // The t parameter is the toast ID (string | number), not the toast object.
            className={`max-w-md w-full bg-[color:var(--card)] shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
            onClick={() => {
              if (notification.link) {
                window.location.href = notification.link;
              }
              toast.dismiss(t);
            }}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-10 w-10 rounded-full bg-[color:var(--primary)]/10 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-[color:var(--primary)]" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-[color:var(--foreground)]">
                    {notification.content}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                    Cliquez pour voir les détails
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-[color:var(--border)]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast.dismiss(t);
                }}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] focus:outline-none"
              >
                Fermer
              </button>
            </div>
          </div>
        ));

        // Mettre à jour le compteur de notifications dans l'interface
        window.dispatchEvent(new CustomEvent("new-notification"));
      });

      return () => {
        socketInstance.disconnect();
      };
    });
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
