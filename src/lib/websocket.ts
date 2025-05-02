// src/lib/websocket.ts
import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiRequest } from "next";
import { NextApiResponse } from "next";

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

export const initializeSocket = (
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) => {
  if (!res.socket.server.io) {
    const io = new SocketIOServer(res.socket.server);
    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("New client connected", socket.id);

      socket.on("join-user-channel", (userId: string) => {
        socket.join(`user:${userId}`);
        console.log(`Socket ${socket.id} joined channel user:${userId}`);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected", socket.id);
      });
    });
  }

  return res.socket.server.io;
};

// Fonction pour émettre un événement de notification
export interface NotificationPayload {
  // Define the expected structure of your notification object here
  // For example:
  message: string;
  [key: string]: unknown;
}

export const emitNotification = (
  io: SocketIOServer,
  userId: string,
  notification: NotificationPayload
) => {
  io.to(`user:${userId}`).emit("notification", notification);
};
