import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
});

export const bins = pgTable("bins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  binType: text("bin_type").notNull(),
  color: text("color").notNull(),
  category: text("category").notNull(),
  collectionDay: text("collection_day").notNull(),
  notificationTime: text("notification_time").notNull(),
  notificationType: text("notification_type").notNull(),
  notificationInterval: integer("notification_interval"), // hours between notifications
  phoneNumber: text("phone_number"), // Only required if SMS notifications are selected
});

export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  binId: integer("bin_id").notNull(),
  collectionDate: timestamp("collection_date").notNull(),
  schedule: text("schedule").notNull(), // one-time, weekly, bi-weekly, monthly
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertBinSchema = createInsertSchema(bins).pick({
  binType: true,
  color: true,
  category: true,
  collectionDay: true,
  notificationTime: true,
  notificationType: true,
  notificationInterval: true,
  phoneNumber: true,
});

export const insertCollectionSchema = createInsertSchema(collections).pick({
  binId: true,
  collectionDate: true,
  schedule: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertBin = z.infer<typeof insertBinSchema>;
export type Bin = typeof bins.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;