import { IStorage } from "./storage";
import createMemoryStore from "memorystore";
import session from "express-session";
import { User, InsertUser, Bin, InsertBin, Collection, InsertCollection } from "@shared/schema";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  sessionStore: session.Store;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  getBinsForUser(userId: number): Promise<Bin[]>;
  getAllBins(): Promise<Bin[]>;
  createBin(userId: number, insertBin: InsertBin): Promise<Bin>;
  deleteBin(id: number): Promise<void>;
  getCollectionsForBin(binId: number): Promise<Collection[]>;
  createCollection(insertCollection: InsertCollection): Promise<Collection>;
  deleteCollection(id: number): Promise<void>;
  getBin(id: number): Promise<Bin | undefined>;
  updateBin(id: number, updates: InsertBin): Promise<Bin>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private bins: Map<number, Bin>;
  private collections: Map<number, Collection>;
  sessionStore: session.Store;
  currentId: { users: number; bins: number; collections: number };

  constructor() {
    this.users = new Map();
    this.bins = new Map();
    this.collections = new Map();
    this.currentId = { users: 1, bins: 1, collections: 1 };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getBinsForUser(userId: number): Promise<Bin[]> {
    return Array.from(this.bins.values()).filter(bin => bin.userId === userId);
  }

  async getAllBins(): Promise<Bin[]> {
    return Array.from(this.bins.values());
  }

  async createBin(userId: number, insertBin: InsertBin): Promise<Bin> {
    const id = this.currentId.bins++;
    const bin: Bin = { 
      ...insertBin, 
      id, 
      userId,
      notificationInterval: insertBin.notificationInterval ?? null,
      phoneNumber: insertBin.phoneNumber ?? null
    };
    this.bins.set(id, bin);
    return bin;
  }

  async deleteBin(id: number): Promise<void> {
    this.bins.delete(id);
    // Delete associated collections
    this.collections = new Map(
      Array.from(this.collections.entries())
        .filter(([_, collection]) => collection.binId !== id)
    );
  }

  async getCollectionsForBin(binId: number): Promise<Collection[]> {
    return Array.from(this.collections.values())
      .filter(collection => collection.binId === binId);
  }

  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    const id = this.currentId.collections++;
    const collection: Collection = { ...insertCollection, id };
    this.collections.set(id, collection);
    return collection;
  }

  async deleteCollection(id: number): Promise<void> {
    this.collections.delete(id);
  }

  async getBin(id: number): Promise<Bin | undefined> {
    return this.bins.get(id);
  }

  async updateBin(id: number, updates: InsertBin): Promise<Bin> {
    const existing = await this.getBin(id);
    if (!existing) {
      throw new Error('Bin not found');
    }

    const updated: Bin = {
      ...existing,
      ...updates,
      notificationInterval: updates.notificationInterval ?? null,
      phoneNumber: updates.phoneNumber ?? null
    };

    this.bins.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();