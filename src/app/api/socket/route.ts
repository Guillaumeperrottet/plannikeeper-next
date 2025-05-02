// src/app/api/socket/route.ts
import type { NextApiRequest } from "next";
import type { NextApiResponseWithSocket } from "@/lib/websocket";
import { initializeSocket } from "@/lib/websocket";
import { getUser } from "@/lib/auth-session";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  const user = await getUser();
  if (!user) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  // Initialiser Socket.IO
  initializeSocket(req, res);

  return res.status(200).json({ connected: true });
}
