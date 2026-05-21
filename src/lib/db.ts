import { openDB, type IDBPDatabase } from "idb";

export interface User {
  id: string;            // worker ID e.g. LB-7421
  phone: string;
  pin: string;           // 4 digit (demo only)
  createdAt: number;
  totalUnits: number;
  totalPoints: number;
  bonusGivenOn?: string; // YYYY-MM-DD when supervisor bonus added
}

export interface LogEntry {
  id?: number;
  batch: string;
  timestamp: number;
  points: number;
  tier: string;
}

const DB_NAME = "logiback";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (typeof indexedDB === "undefined") return null;
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("user")) db.createObjectStore("user");
        if (!db.objectStoreNames.contains("logs")) {
          const s = db.createObjectStore("logs", { keyPath: "id", autoIncrement: true });
          s.createIndex("by-time", "timestamp");
        }
      },
    });
  }
  return dbPromise;
}

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export async function getUser(): Promise<User | null> {
  const db = await getDB();
  if (!db) return null;
  return (await db.get("user", "current")) ?? null;
}

export async function saveUser(u: User) {
  const db = await getDB();
  if (!db) return;
  await db.put("user", u, "current");
}

export async function createUser(phone: string, pin: string): Promise<User> {
  await delay();
  const id = `LB-${Math.floor(1000 + Math.random() * 8999)}`;
  const user: User = { id, phone, pin, createdAt: Date.now(), totalUnits: 0, totalPoints: 0 };
  await saveUser(user);
  return user;
}

export async function addLog(entry: LogEntry) {
  const db = await getDB();
  if (!db) return;
  await db.add("logs", entry);
}

export async function getRecentLogs(limit = 8): Promise<LogEntry[]> {
  const db = await getDB();
  if (!db) return [];
  const tx = db.transaction("logs", "readonly");
  const idx = tx.store.index("by-time");
  const out: LogEntry[] = [];
  let cursor = await idx.openCursor(null, "prev");
  while (cursor && out.length < limit) {
    out.push(cursor.value as LogEntry);
    cursor = await cursor.continue();
  }
  return out;
}

export async function getTodayUnits(): Promise<number> {
  const db = await getDB();
  if (!db) return 0;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const tx = db.transaction("logs", "readonly");
  const idx = tx.store.index("by-time");
  let n = 0;
  let cursor = await idx.openCursor(IDBKeyRange.lowerBound(start.getTime()));
  while (cursor) { n++; cursor = await cursor.continue(); }
  return n;
}

export async function resetAll() {
  const db = await getDB();
  if (!db) return;
  await db.clear("user");
  await db.clear("logs");
}

export function generateBatch() {
  const d = new Date();
  const y = String(d.getFullYear()).slice(2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const seq = String(Math.floor(Math.random() * 9999)).padStart(4, "0");
  return `LOG-${y}${m}${day}-${seq}`;
}

export function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
