import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const keyPairs = pgTable("key_pairs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  nickname: text("nickname"),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  keyInfo: json("key_info").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contactKeys = pgTable("contact_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  nickname: text("nickname"),
  publicKey: text("public_key").notNull(),
  keyId: text("key_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userRelations = relations(users, ({ many }) => ({
  keyPairs: many(keyPairs),
  contactKeys: many(contactKeys),
}));

export const keyPairRelations = relations(keyPairs, ({ one }) => ({
  user: one(users, {
    fields: [keyPairs.userId],
    references: [users.id],
  }),
}));

export const contactKeyRelations = relations(contactKeys, ({ one }) => ({
  user: one(users, {
    fields: [contactKeys.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertKeyPairSchema = createInsertSchema(keyPairs).omit({
  id: true,
  createdAt: true,
});

export const insertContactKeySchema = createInsertSchema(contactKeys).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type KeyPair = typeof keyPairs.$inferSelect;
export type InsertKeyPair = z.infer<typeof insertKeyPairSchema>;
export type ContactKey = typeof contactKeys.$inferSelect;
export type InsertContactKey = z.infer<typeof insertContactKeySchema>;
