import { 
  users, habits, appLimits, journalEntries, timerSessions,
  type User, type InsertUser, type Habit, type InsertHabit,
  type AppLimit, type InsertAppLimit, type JournalEntry, type InsertJournalEntry,
  type TimerSession, type InsertTimerSession
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Habits
  getHabits(userId: number): Promise<Habit[]>;
  createHabit(habit: InsertHabit): Promise<Habit>;
  updateHabit(id: number, habit: Partial<Habit>): Promise<Habit | undefined>;
  deleteHabit(id: number): Promise<boolean>;

  // App Limits
  getAppLimits(userId: number): Promise<AppLimit[]>;
  createAppLimit(appLimit: InsertAppLimit): Promise<AppLimit>;
  updateAppLimit(id: number, appLimit: Partial<AppLimit>): Promise<AppLimit | undefined>;
  deleteAppLimit(id: number): Promise<boolean>;

  // Journal Entries
  getJournalEntries(userId: number): Promise<JournalEntry[]>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  deleteJournalEntry(id: number): Promise<boolean>;

  // Timer Sessions
  getTimerSessions(userId: number): Promise<TimerSession[]>;
  createTimerSession(session: InsertTimerSession): Promise<TimerSession>;
  getTodayTimerStats(userId: number): Promise<{ focusMinutes: number; breakMinutes: number; sessions: number }>;
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

  async getHabits(userId: number): Promise<Habit[]> {
    return await db.select().from(habits).where(eq(habits.userId, userId));
  }

  async createHabit(habit: InsertHabit): Promise<Habit> {
    const [newHabit] = await db
      .insert(habits)
      .values(habit)
      .returning();
    return newHabit;
  }

  async updateHabit(id: number, habitUpdate: Partial<Habit>): Promise<Habit | undefined> {
    const [updated] = await db
      .update(habits)
      .set(habitUpdate)
      .where(eq(habits.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteHabit(id: number): Promise<boolean> {
    const result = await db.delete(habits).where(eq(habits.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAppLimits(userId: number): Promise<AppLimit[]> {
    return await db.select().from(appLimits).where(eq(appLimits.userId, userId));
  }

  async createAppLimit(appLimit: InsertAppLimit): Promise<AppLimit> {
    const [newAppLimit] = await db
      .insert(appLimits)
      .values(appLimit)
      .returning();
    return newAppLimit;
  }

  async updateAppLimit(id: number, appLimitUpdate: Partial<AppLimit>): Promise<AppLimit | undefined> {
    const [updated] = await db
      .update(appLimits)
      .set(appLimitUpdate)
      .where(eq(appLimits.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAppLimit(id: number): Promise<boolean> {
    const result = await db.delete(appLimits).where(eq(appLimits.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getJournalEntries(userId: number): Promise<JournalEntry[]> {
    return await db.select().from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt));
  }

  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const [newEntry] = await db
      .insert(journalEntries)
      .values(entry)
      .returning();
    return newEntry;
  }

  async deleteJournalEntry(id: number): Promise<boolean> {
    const result = await db.delete(journalEntries).where(eq(journalEntries.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getTimerSessions(userId: number): Promise<TimerSession[]> {
    return await db.select().from(timerSessions)
      .where(eq(timerSessions.userId, userId))
      .orderBy(timerSessions.createdAt);
  }

  async createTimerSession(session: InsertTimerSession): Promise<TimerSession> {
    const [newSession] = await db
      .insert(timerSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async getTodayTimerStats(userId: number): Promise<{ focusMinutes: number; breakMinutes: number; sessions: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySessions = await db.select().from(timerSessions)
      .where(
        and(
          eq(timerSessions.userId, userId),
          eq(timerSessions.completed, true),
          gte(timerSessions.createdAt, today)
        )
      );

    const focusMinutes = todaySessions
      .filter(session => session.type === 'focus')
      .reduce((total, session) => total + Math.floor(session.duration / 60), 0);

    const breakMinutes = todaySessions
      .filter(session => session.type === 'break')
      .reduce((total, session) => total + Math.floor(session.duration / 60), 0);

    return {
      focusMinutes,
      breakMinutes,
      sessions: todaySessions.filter(session => session.type === 'focus').length
    };
  }
}

export const storage = new DatabaseStorage();
