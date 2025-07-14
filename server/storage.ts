import { users, keyPairs, contactKeys, type User, type InsertUser, type KeyPair, type InsertKeyPair, type ContactKey, type InsertContactKey } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Key pair operations
  getKeyPairs(userId: number): Promise<KeyPair[]>;
  getKeyPair(id: number, userId: number): Promise<KeyPair | undefined>;
  createKeyPair(keyPair: InsertKeyPair): Promise<KeyPair>;
  deleteKeyPair(id: number, userId: number): Promise<boolean>;
  
  // Contact key operations
  getContactKeys(userId: number): Promise<ContactKey[]>;
  getContactKey(id: number, userId: number): Promise<ContactKey | undefined>;
  createContactKey(contactKey: InsertContactKey): Promise<ContactKey>;
  deleteContactKey(id: number, userId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Key pair operations
  async getKeyPairs(userId: number): Promise<KeyPair[]> {
    return await db.select().from(keyPairs).where(eq(keyPairs.userId, userId));
  }

  async getKeyPair(id: number, userId: number): Promise<KeyPair | undefined> {
    const [keyPair] = await db
      .select()
      .from(keyPairs)
      .where(and(eq(keyPairs.id, id), eq(keyPairs.userId, userId)));
    return keyPair || undefined;
  }

  async createKeyPair(keyPair: InsertKeyPair): Promise<KeyPair> {
    const [newKeyPair] = await db
      .insert(keyPairs)
      .values(keyPair)
      .returning();
    return newKeyPair;
  }

  async deleteKeyPair(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(keyPairs)
      .where(and(eq(keyPairs.id, id), eq(keyPairs.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Contact key operations
  async getContactKeys(userId: number): Promise<ContactKey[]> {
    return await db.select().from(contactKeys).where(eq(contactKeys.userId, userId));
  }

  async getContactKey(id: number, userId: number): Promise<ContactKey | undefined> {
    const [contactKey] = await db
      .select()
      .from(contactKeys)
      .where(and(eq(contactKeys.id, id), eq(contactKeys.userId, userId)));
    return contactKey || undefined;
  }

  async createContactKey(contactKey: InsertContactKey): Promise<ContactKey> {
    const [newContactKey] = await db
      .insert(contactKeys)
      .values(contactKey)
      .returning();
    return newContactKey;
  }

  async deleteContactKey(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(contactKeys)
      .where(and(eq(contactKeys.id, id), eq(contactKeys.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();