import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // User management routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Don't return password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Key pair management routes (would require authentication in production)
  app.get("/api/users/:userId/keypairs", async (req, res) => {
    try {
      const keyPairs = await storage.getKeyPairs(parseInt(req.params.userId));
      res.json(keyPairs);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Contact key management routes
  app.get("/api/users/:userId/contacts", async (req, res) => {
    try {
      const contacts = await storage.getContactKeys(parseInt(req.params.userId));
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
