import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertHabitSchema, insertAppLimitSchema, 
  insertJournalEntrySchema, insertTimerSessionSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const DEMO_USER_ID = 1; // Using demo user for simplicity

  // Habits routes
  app.get("/api/habits", async (req, res) => {
    try {
      const habits = await storage.getHabits(DEMO_USER_ID);
      res.json(habits);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch habits" });
    }
  });

  app.post("/api/habits", async (req, res) => {
    try {
      const habitData = insertHabitSchema.parse({ ...req.body, userId: DEMO_USER_ID });
      const habit = await storage.createHabit(habitData);
      res.json(habit);
    } catch (error) {
      res.status(400).json({ message: "Invalid habit data" });
    }
  });

  app.put("/api/habits/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateHabit(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Habit not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: "Failed to update habit" });
    }
  });

  app.delete("/api/habits/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteHabit(id);
      if (!deleted) {
        return res.status(404).json({ message: "Habit not found" });
      }
      res.json({ message: "Habit deleted" });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete habit" });
    }
  });

  // App limits routes
  app.get("/api/app-limits", async (req, res) => {
    try {
      const appLimits = await storage.getAppLimits(DEMO_USER_ID);
      res.json(appLimits);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch app limits" });
    }
  });

  app.post("/api/app-limits", async (req, res) => {
    try {
      const appLimitData = insertAppLimitSchema.parse({ ...req.body, userId: DEMO_USER_ID });
      const appLimit = await storage.createAppLimit(appLimitData);
      res.json(appLimit);
    } catch (error) {
      res.status(400).json({ message: "Invalid app limit data" });
    }
  });

  app.put("/api/app-limits/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateAppLimit(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "App limit not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: "Failed to update app limit" });
    }
  });

  // Journal entries routes
  app.get("/api/journal-entries", async (req, res) => {
    try {
      const entries = await storage.getJournalEntries(DEMO_USER_ID);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch journal entries" });
    }
  });

  app.post("/api/journal-entries", async (req, res) => {
    try {
      const entryData = insertJournalEntrySchema.parse({ ...req.body, userId: DEMO_USER_ID });
      const entry = await storage.createJournalEntry(entryData);
      res.json(entry);
    } catch (error) {
      res.status(400).json({ message: "Invalid journal entry data" });
    }
  });

  app.delete("/api/journal-entries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteJournalEntry(id);
      if (!deleted) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      res.json({ message: "Journal entry deleted" });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete journal entry" });
    }
  });

  // Timer sessions routes
  app.get("/api/timer-sessions", async (req, res) => {
    try {
      const sessions = await storage.getTimerSessions(DEMO_USER_ID);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch timer sessions" });
    }
  });

  app.post("/api/timer-sessions", async (req, res) => {
    try {
      const sessionData = insertTimerSessionSchema.parse({ ...req.body, userId: DEMO_USER_ID });
      const session = await storage.createTimerSession(sessionData);
      res.json(session);
    } catch (error) {
      res.status(400).json({ message: "Invalid timer session data" });
    }
  });

  app.get("/api/timer-stats/today", async (req, res) => {
    try {
      const stats = await storage.getTodayTimerStats(DEMO_USER_ID);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch timer stats" });
    }
  });

  // Generate schedule endpoint
  app.post("/api/habits/generate-schedule", async (req, res) => {
    try {
      const { workSchedule, extraActivities, goals } = req.body;
      
      // Simple schedule generation algorithm
      const schedule = [];
      
      // Parse work schedule
      if (workSchedule) {
        schedule.push({
          title: "Школа/Работа",
          schedule: workSchedule,
          color: "#10B981"
        });
      }
      
      // Parse extra activities
      if (extraActivities) {
        schedule.push({
          title: "Дополнительные занятия",
          schedule: extraActivities,
          color: "#3B82F6"
        });
      }
      
      // Generate suggestions for goals
      if (goals && goals.toLowerCase().includes("зал")) {
        schedule.push({
          title: "Тренажерный зал",
          schedule: "Вт, Чт, Сб 16:00-17:30",
          color: "#EF4444"
        });
      }
      
      if (goals && goals.toLowerCase().includes("читать")) {
        schedule.push({
          title: "Чтение книг",
          schedule: "Ежедневно, 20:00-20:30",
          color: "#8B5CF6"
        });
      }
      
      if (goals && goals.toLowerCase().includes("английский")) {
        schedule.push({
          title: "Изучение английского",
          schedule: "Пн, Ср, Пт 19:00-19:30",
          color: "#F59E0B"
        });
      }
      
      res.json({ schedule });
    } catch (error) {
      res.status(400).json({ message: "Failed to generate schedule" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
