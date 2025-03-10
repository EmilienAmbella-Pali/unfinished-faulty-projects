import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertBinSchema, insertCollectionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Bin management routes
  app.get("/api/bins", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const bins = await storage.getBinsForUser(req.user.id);
    res.json(bins);
  });

  app.post("/api/bins", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const binData = insertBinSchema.parse(req.body);
    const bin = await storage.createBin(req.user.id, binData);
    res.status(201).json(bin);
  });

  app.patch("/api/bins/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const bin = await storage.getBin(id);

    if (!bin || bin.userId !== req.user.id) {
      return res.sendStatus(404);
    }

    const binData = insertBinSchema.parse(req.body);
    const updatedBin = await storage.updateBin(id, binData);
    res.json(updatedBin);
  });

  app.delete("/api/bins/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteBin(parseInt(req.params.id));
    res.sendStatus(200);
  });

  // Collection management routes
  app.get("/api/bins/:binId/collections", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const collections = await storage.getCollectionsForBin(parseInt(req.params.binId));
    res.json(collections);
  });

  app.post("/api/collections", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const collectionData = insertCollectionSchema.parse(req.body);
    const collection = await storage.createCollection(collectionData);
    res.status(201).json(collection);
  });

  app.delete("/api/collections/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteCollection(parseInt(req.params.id));
    res.sendStatus(200);
  });

  const httpServer = createServer(app);
  return httpServer;
}