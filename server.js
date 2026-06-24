/* === PHASE-C-SOURCE-TRUTH === */
/* === MONTHLY-LOTTO-ALERT-V1 === */
/* === SCRAPER-PUPPETEER-V1 === */
/* === SCRAPER-FINAL-BATCH-V1 === */
/* === SCRAPER-EXTEND-V1 === */
/* === SCRAPER-FRAMEWORK-V1 === */
/* === NIGHTLY-CLEANUP-V1 === */
/* === PULL-THAI-FIX-V1 === */
/* === OVERVIEW-BY-ROUND-V1 === */
/* === ONLINE-BILLS-LIST-V1 === */
/* === OVERVIEW-CHANNEL-SPLIT-V1 === */
/* === PAYOUT-OVERRIDES-STATE-V1 === */
/* === RATE-OVERRIDE-APPLY-V2 === */

// === S2-J1: dashboard cache 5min ===
const _ownerDashCache = new Map();  // key = today + scope, value = { data, expireAt }
function _ownerCacheGet(key) {
  const e = _ownerDashCache.get(key);
  if (e && e.expireAt > Date.now()) return e.data;
  return null;
}
function _ownerCacheSet(key, data) {
  _ownerDashCache.set(key, { data, expireAt: Date.now() + 5 * 60 * 1000 });
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of _ownerDashCache.entries()) if (v.expireAt < now) _ownerDashCache.delete(k);
}, 5 * 60 * 1000).unref();

// PHASE-0-MARKER-V1: 10 quick wins applied 2026-06-21
import crypto from "node:crypto";
import { AsyncLocalStorage } from 'node:async_hooks';
const lineContext = new AsyncLocalStorage();
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* PHASE-B-WIRED: import scraper module */
import { getParser, parserNames } from "./providers/scraper/parsers/index.mjs";
import { notifyDiscord, makeEmbed, safeName } from "./providers/discord/notify.mjs";
import { DatabaseSync } from "node:sqlite";
import express from "express";
import helmet from "helmet";
import bcrypt from "bcryptjs";

/* F4: PROMPTPAY QR — generate QR per ticket + match ด้วย ref */
import generatePromptPayPayload from "promptpay-qr";
import QRCode from "qrcode";


/* X3: REDIS — connection pool + helper for rate-limit + login attempts */
import Redis from "ioredis";
const __redisEnabled = process.env.REDIS_URL || "redis://127.0.0.1:6380";
let __redis = null;
try {
  __redis = new Redis(__redisEnabled, { lazyConnect: true, maxRetriesPerRequest: 1, enableOfflineQueue: false });
  __redis.on("error", (e) => { /* silently fail — fall back to in-memory */ });
  __redis.connect().catch(()=>{ __redis = null; console.warn("[redis] connect failed — using in-memory fallback"); });
} catch (e) { __redis = null; console.warn("[redis] init failed"); }

/* Rate-limit counter ผ่าน Redis (atomic INCR + EXPIRE) — fallback in-memory ถ้า Redis down */
async function rateLimit(key, max, windowSec) {
  if (__redis && __redis.status === "ready") {
    try {
      const n = await __redis.incr(`rl:${key}`);
      if (n === 1) await __redis.expire(`rl:${key}`, windowSec);
      return { count: n, exceeded: n > max };
    } catch (e) { /* fall through */ }
  }
  /* fallback: in-memory Map */
  if (!globalThis.__rlMem) globalThis.__rlMem = new Map();
  const now = Date.now();
  const key2 = `${key}:${Math.floor(now / (windowSec * 1000))}`;
  const cur = (globalThis.__rlMem.get(key2) || 0) + 1;
  globalThis.__rlMem.set(key2, cur);
  /* cleanup เก่า */
  if (globalThis.__rlMem.size > 5000) {
    const cutoff = Math.floor(now / (windowSec * 1000)) - 2;
    for (const k of globalThis.__rlMem.keys()) {
      const ts = Number(k.split(":").pop());
      if (ts < cutoff) globalThis.__rlMem.delete(k);
    }
  }
  return { count: cur, exceeded: cur > max };
}


/* helper: สร้าง QR PNG dataURL — รับ bank_account.account_number หรือ promptpay_id + amount */
async function generatePromptPayQRDataURL(promptPayId, amount) {
  if (!promptPayId) throw new Error("promptpay_id required");
  const payload = generatePromptPayPayload(String(promptPayId), { amount: Number(amount) || undefined });
  return await QRCode.toDataURL(payload, { errorCorrectionLevel: "M", width: 300, margin: 1 });
}


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3001);
const DB_PATH = path.resolve(process.env.DB_PATH || path.join(__dirname, ".data", "lottery-manager.sqlite"));
const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || 7);
const SESSION_COOKIE = "lottery_session";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ALLOWED_USER_ROLES = new Set(["admin", "operator", "head_house_viewer", "affiliate"]);

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA foreign_keys = ON;");

/* X5: SCHEDULER registry — wrap setInterval ด้วย jitter + monitoring */
const __cronRegistry = new Map();
function registerCron(name, fn, intervalMs, options = {}) {
  if (__cronRegistry.has(name)) {
    console.warn();
    return;
  }
  const jitterMs = options.jitter ?? Math.floor(Math.random() * Math.min(intervalMs * 0.1, 30000));
  const entry = { name, intervalMs, jitterMs, lastRun: null, lastDurationMs: null, lastError: null, runCount: 0, running: false, startedAt: 0 };
  __cronRegistry.set(name, entry);
  const wrappedRun = async () => {
    /* L1-FIX: overlap guard — skip ถ้ายัง running + force reset ถ้าค้าง > 5 นาที */
    if (entry.running) {
      if (Date.now() - entry.startedAt > 5 * 60 * 1000) {
        console.warn(`[scheduler] ${name} ค้าง > 5 นาที — force reset`);
        entry.running = false;
      } else {
        return;
      }
    }
    entry.running = true;
    entry.startedAt = Date.now();
    const t0 = Date.now();
    entry.lastRun = new Date().toISOString();
    entry.runCount++;
    if (entry.runCount === 1 || entry.runCount % 60 === 0) console.log("[cron] " + name + " run #" + entry.runCount);
    try {
      await fn();
      entry.lastDurationMs = Date.now() - t0;
      entry.lastError = null;
    } catch (e) {
      entry.lastDurationMs = Date.now() - t0;
      entry.lastError = String(e.message).slice(0, 200);
      console.error("[scheduler] " + name + " failed:", e.message);
    } finally {
      entry.running = false;
    }
  };
  setTimeout(() => {
    wrappedRun();
    /* CRON-FIX: ไม่ใช้ unref() เพราะทำให้ interval ตายในบาง runtime */
    setInterval(wrappedRun, intervalMs);
  }, jitterMs);
}


/* A2: schema_version — track migrations */
db.exec(`CREATE TABLE IF NOT EXISTS schema_version (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL
)`);

/* P1: safeRebuildTable — กัน column หาย ตอน rebuild table
   ใช้กับ pattern: CREATE NEW → INSERT FROM OLD → DROP OLD → RENAME
   เช็คก่อนทำ: new table ต้องมี columns ครบทุกตัวที่ old มี */
function safeRebuildTable(oldTableName, newTableSql, options = {}) {
  const newName = options.tempName || (oldTableName + "_new");
  /* 1. snapshot old columns */
  const oldCols = db.prepare(`PRAGMA table_info(${oldTableName})`).all().map(c => c.name);
  if (!oldCols.length) {
    throw new Error(`safeRebuildTable: ${oldTableName} ไม่มี — abort`);
  }
  /* 2. parse new column names จาก CREATE TABLE SQL */
  const colMatch = newTableSql.match(/CREATE TABLE\s+\w+\s*\(([\s\S]+)\)\s*;?\s*$/i);
  if (!colMatch) throw new Error("safeRebuildTable: invalid CREATE TABLE sql");
  const colBody = colMatch[1];
  /* extract column names ต้นบรรทัด (skip CHECK, FOREIGN, UNIQUE, PRIMARY KEY) */
  const newCols = [];
  for (const line of colBody.split(",")) {
    const t = line.trim();
    if (!t || /^(CHECK|FOREIGN|UNIQUE|PRIMARY|CONSTRAINT)/i.test(t)) continue;
    const m = t.match(/^([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (m) newCols.push(m[1]);
  }
  /* 3. หา columns ใน old ที่ new ขาด */
  const droppedExplicit = new Set(options.dropColumns || []);
  const missing = oldCols.filter(c => !newCols.includes(c) && !droppedExplicit.has(c));
  if (missing.length) {
    const msg = `safeRebuildTable: ${oldTableName} → ${newName} จะทำให้ ${missing.length} columns หาย: ${missing.join(", ")}`;
    if (options.force) {
      console.warn("[safe-rebuild] FORCE — " + msg);
    } else {
      throw new Error(msg + ". ถ้าตั้งใจ ลบ — ใส่ options.dropColumns + options.force=true");
    }
  }
  /* 4. ทำจริง — CREATE + INSERT (ใช้ INTERSECT ของ cols) + DROP + RENAME */
  const copyCols = oldCols.filter(c => newCols.includes(c));
  db.exec(newTableSql);
  db.exec(`INSERT INTO ${newName} (${copyCols.join(", ")}) SELECT ${copyCols.join(", ")} FROM ${oldTableName};`);
  db.exec(`DROP TABLE ${oldTableName};`);
  db.exec(`ALTER TABLE ${newName} RENAME TO ${oldTableName};`);
  console.log(`[safe-rebuild] ok: ${oldTableName} (${oldCols.length} → ${newCols.length} cols, copied ${copyCols.length})`);
}

function applyMigration(name, fn) {
  const exists = db.prepare("SELECT 1 FROM schema_version WHERE name = ?").get(name);
  if (exists) return false;
  try {
    fn();
    db.prepare("INSERT INTO schema_version (name, applied_at) VALUES (?, ?)").run(name, new Date().toISOString());
    console.log(`[migration] applied ${name}`);
    return true;
  } catch (e) {
    console.error(`[migration] FAIL ${name}: ${e.message}`);
    throw e;
  }
}

db.exec("PRAGMA journal_mode = WAL;");
db.exec(`
  CREATE TABLE IF NOT EXISTS head_houses (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    commission_percent REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'operator', 'head_house_viewer')),
    head_house_id TEXT REFERENCES head_houses(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT '',
    head_house_id TEXT NOT NULL REFERENCES head_houses(id) ON DELETE RESTRICT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS lotteries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'other',
    display_order INTEGER NOT NULL DEFAULT 999,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rounds (
    id TEXT PRIMARY KEY,
    lottery_id TEXT NOT NULL REFERENCES lotteries(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    open_date TEXT,
    open_time TEXT,
    draw_date TEXT NOT NULL,
      draw_time TEXT NOT NULL DEFAULT '00:00',
      result_time TEXT NOT NULL DEFAULT '00:00',
    close_before_minutes INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK(status IN ('open', 'closed')) DEFAULT 'open',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(lottery_id, label)
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    head_house_id TEXT REFERENCES head_houses(id) ON DELETE SET NULL,
    round_id TEXT NOT NULL REFERENCES rounds(id) ON DELETE RESTRICT,
    source_channel TEXT NOT NULL DEFAULT 'manual',
    source_text TEXT NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT '',
    review_note TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL CHECK(status IN ('pending_review', 'approved', 'rejected', 'cancelled')) DEFAULT 'pending_review',
    checked_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    checked_at TEXT,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS schedule_templates (
    id TEXT PRIMARY KEY,
    lottery_id TEXT NOT NULL UNIQUE REFERENCES lotteries(id) ON DELETE CASCADE,
    frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly')),
    weekdays TEXT NOT NULL DEFAULT '0,1,2,3,4,5,6',
    month_days TEXT NOT NULL DEFAULT '',
    open_days_before INTEGER NOT NULL DEFAULT 0,
    open_time TEXT NOT NULL DEFAULT '00:00',
      draw_time TEXT NOT NULL DEFAULT '00:00',
      result_time TEXT NOT NULL DEFAULT '00:00',
    close_before_minutes INTEGER NOT NULL DEFAULT 15,
    active INTEGER NOT NULL DEFAULT 1,
    source_note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bet_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    digits INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS payout_rates (
    id TEXT PRIMARY KEY,
    lottery_id TEXT NOT NULL REFERENCES lotteries(id) ON DELETE CASCADE,
    bet_type_id TEXT NOT NULL REFERENCES bet_types(id) ON DELETE CASCADE,
    rate REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(lottery_id, bet_type_id)
  );

  CREATE TABLE IF NOT EXISTS limits (
    id TEXT PRIMARY KEY,
    round_id TEXT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    bet_type_id TEXT NOT NULL REFERENCES bet_types(id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    max_amount REAL NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(round_id, bet_type_id, number)
  );

  CREATE TABLE IF NOT EXISTS entries (
    id TEXT PRIMARY KEY,
    ticket_id TEXT REFERENCES tickets(id) ON DELETE RESTRICT,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    round_id TEXT NOT NULL REFERENCES rounds(id) ON DELETE RESTRICT,
    bet_type_id TEXT NOT NULL REFERENCES bet_types(id) ON DELETE RESTRICT,
    number TEXT NOT NULL,
    amount REAL NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    source_text TEXT NOT NULL DEFAULT '',
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS results (
    id TEXT PRIMARY KEY,
    round_id TEXT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    bet_type_id TEXT NOT NULL REFERENCES bet_types(id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(round_id, bet_type_id, number)
  );

  CREATE TABLE IF NOT EXISTS result_sources (
    id TEXT PRIMARY KEY,
    lottery_id TEXT REFERENCES lotteries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    source_kind TEXT NOT NULL CHECK(source_kind IN ('official_glo', 'api_reserved', 'manual_link')),
    provider TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL DEFAULT '',
    api_endpoint TEXT NOT NULL DEFAULT '',
    requires_key INTEGER NOT NULL DEFAULT 0,
    key_env TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    auto_confirm INTEGER NOT NULL DEFAULT 0,
    priority INTEGER NOT NULL DEFAULT 100,
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS result_imports (
    id TEXT PRIMARY KEY,
    round_id TEXT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    source_id TEXT REFERENCES result_sources(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK(status IN ('draft', 'confirmed', 'applied', 'failed', 'skipped')),
    numbers_json TEXT NOT NULL DEFAULT '{}',
    raw_json TEXT NOT NULL DEFAULT '{}',
    error TEXT NOT NULL DEFAULT '',
    fetched_at TEXT NOT NULL,
    confirmed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    confirmed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

migrateUsersTableIfNeeded();
ensureColumn("rounds", "draw_time", "TEXT NOT NULL DEFAULT '00:00'");
ensureColumn("rounds", "close_before_minutes", "INTEGER NOT NULL DEFAULT 0");
ensureColumn("rounds", "open_date", "TEXT");
ensureColumn("rounds", "open_time", "TEXT");
ensureColumn("rounds", "schedule_template_id", "TEXT");
  ensureColumn("customers", "line_user_id", "TEXT");
  ensureColumn("customers", "line_display_name", "TEXT");
  ensureColumn("customers", "line_picture_url", "TEXT");
  try { db.exec("CREATE INDEX IF NOT EXISTS idx_customers_line_user_id ON customers(line_user_id)"); } catch (e) {}
ensureColumn("rounds", "auto_generated", "INTEGER NOT NULL DEFAULT 0");
ensureColumn("rounds", "result_status", "TEXT NOT NULL DEFAULT 'draft'");
  ensureColumn("rounds", "result_finalized_by", "TEXT");
  ensureColumn("rounds", "result_finalized_at", "TEXT");
  ensureColumn("rounds", "result_time", "TEXT NOT NULL DEFAULT '00:00'");
  ensureColumn("schedule_templates", "result_time", "TEXT NOT NULL DEFAULT '00:00'");
  db.prepare(`
    UPDATE schedule_templates
    SET result_time = draw_time
    WHERE result_time = '00:00' AND draw_time <> '00:00'
  `).run();
  db.prepare(`
    UPDATE rounds
    SET result_time = draw_time
    WHERE result_time = '00:00' AND draw_time <> '00:00'
  `).run();
ensureColumn("customers", "head_house_id", "TEXT");
ensureColumn("users", "head_house_id", "TEXT");
ensureColumn("head_houses", "commission_percent", "REAL NOT NULL DEFAULT 0");
ensureColumn("lotteries", "category", "TEXT NOT NULL DEFAULT 'other'");
ensureColumn("lotteries", "display_order", "INTEGER NOT NULL DEFAULT 999");
ensureColumn("entries", "ticket_id", "TEXT");
ensureColumn("tickets", "review_note", "TEXT NOT NULL DEFAULT ''");
ensureColumn("tickets", "head_house_id", "TEXT");
/* AUDIT FIX BUG-A: blacklist หวยที่บอสลบทิ้งถาวร (เพื่อไม่ re-seed) */
const __LOTTERY_BLACKLIST = new Set([
  "lott_026","lott_028","lott_029","lott_030","lott_031","lott_034",
  "lott_050","lott_051","lott_052","lott_053","lott_054","lott_055","lott_056","lott_057","lott_058","lott_059","lott_060","lott_061","lott_062","lott_063","lott_064","lott_065","lott_066","lott_067","lott_068","lott_069","lott_070","lott_071","lott_072","lott_073","lott_074","lott_075","lott_076",
  "lott_077","lott_078","lott_079","lott_080","lott_081","lott_082","lott_083","lott_084","lott_085","lott_086",
]);

seedReferenceData();
db.prepare("UPDATE customers SET head_house_id = 'direct' WHERE head_house_id IS NULL OR head_house_id = ''").run();
db.prepare(`
  UPDATE tickets
  SET head_house_id = (
    SELECT customers.head_house_id
    FROM customers
    WHERE customers.id = tickets.customer_id
  )
  WHERE head_house_id IS NULL OR head_house_id = ''
`).run();
backfillLegacyTickets();
// Heavy startup work (round generation, GLO import) is deferred to AFTER server.listen
// so the HTTP port binds immediately and health checks pass quickly.
const __deferredStartupTasks = () => {
  ensureUpcomingRounds();
  setInterval(() => ensureUpcomingRounds(), 10 * 60 * 1000).unref();
  setInterval(() => importDueOfficialResults().catch((error) => console.error("result import failed", error)), 10 * 60 * 1000).unref();
};

const app = express();
app.disable("x-powered-by");
// PHASE-0 SECURITY-V1 — helmet + CSP + HSTS
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["\u0027self\u0027"],
      scriptSrc: ["\u0027self\u0027", "\u0027unsafe-inline\u0027", "https://static.line-scdn.net", "https://cdn.jsdelivr.net"],
      styleSrc: ["\u0027self\u0027", "\u0027unsafe-inline\u0027", "https://fonts.googleapis.com"],
      fontSrc: ["\u0027self\u0027", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["\u0027self\u0027", "data:", "https:", "blob:"],
      connectSrc: ["\u0027self\u0027", "https://api.line.me", "https://liff.line.me"],
      frameAncestors: ["\u0027self\u0027", "https://liff.line.me"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: false },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.set("trust proxy", 1); // behind nginx
app.use(express.json({ limit: "2mb", verify: (req, res, buf) => { req.rawBody = buf.toString("utf8"); } }));

/* === CRIT-1 FIX v2: register CSRF middleware EARLY (before any routes) === */
app.use(function csrfWrapper(req, res, next) {
  if (typeof requireCsrf === "function") return requireCsrf(req, res, next);
  return next();
});
console.log("[s4-fix v2] CSRF middleware installed EARLY");


// ===== AFFILIATE SYSTEM (2026-05-22) =====
// Schema migrations (idempotent — runs every boot)
ensureColumn("head_houses", "parent_head_house_id", "TEXT");
ensureColumn("head_houses", "tier2_percent", "REAL NOT NULL DEFAULT 0");
db.exec(`
  CREATE TABLE IF NOT EXISTS affiliate_payouts (
    id TEXT PRIMARY KEY,
    head_house_id TEXT NOT NULL REFERENCES head_houses(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    period_start TEXT,
    period_end TEXT,
    paid_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL
  );
`);
try { db.exec("CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_hh ON affiliate_payouts(head_house_id)"); } catch (e) {}

// ===== Indexes for performance (2026-05-23) =====
try { db.exec("CREATE INDEX IF NOT EXISTS idx_entries_round ON entries(round_id)"); } catch (e) {}
try { db.exec("CREATE INDEX IF NOT EXISTS idx_entries_ticket ON entries(ticket_id)"); } catch (e) {}
try { db.exec("CREATE INDEX IF NOT EXISTS idx_entries_lookup ON entries(round_id, bet_type_id, number)"); } catch (e) {}
try { db.exec("CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status, round_id)"); } catch (e) {}
try { db.exec("CREATE INDEX IF NOT EXISTS idx_results_round ON results(round_id)"); } catch (e) {}



// Calculate stake of all approved tickets for customers under a given head_house.
function affiliateStakeForHeadHouse(headHouseId) {
  const row = db.prepare(`
    SELECT COALESCE(SUM(entries.amount), 0) AS stake
    FROM entries
    JOIN tickets ON tickets.id = entries.ticket_id
    JOIN customers ON customers.id = entries.customer_id
    WHERE tickets.status = 'approved'
      AND COALESCE(tickets.head_house_id, customers.head_house_id) = ?
  `).get(headHouseId);
  return Number(row?.stake) || 0;
}
function affiliatePaidForHeadHouse(headHouseId) {
  const row = db.prepare(`SELECT COALESCE(SUM(amount), 0) AS s FROM affiliate_payouts WHERE head_house_id = ?`).get(headHouseId);
  return Number(row?.s) || 0;
}

function affiliateSummaryForHeadHouse(hh) {
  const tier1Stake = affiliateStakeForHeadHouse(hh.id);
  const tier1Pct = Number(hh.commission_percent) || 0;
  const tier1Owed = tier1Stake * tier1Pct / 100;

  // tier2: from each child HH whose parent = this HH
  const children = db.prepare(`SELECT id, code, name, tier2_percent FROM head_houses WHERE parent_head_house_id = ?`).all(hh.id);
  let tier2Owed = 0;
  const tier2Breakdown = [];
  for (const child of children) {
    const childStake = affiliateStakeForHeadHouse(child.id);
    const childPct = Number(child.tier2_percent) || 0;
    const owed = childStake * childPct / 100;
    tier2Owed += owed;
    tier2Breakdown.push({
      child_id: child.id,
      child_code: child.code,
      child_name: child.name,
      stake: childStake,
      pct: childPct,
      amount: owed,
    });
  }

  const totalOwed = tier1Owed + tier2Owed;
  const paid = affiliatePaidForHeadHouse(hh.id);
  const balance = totalOwed - paid;

  return {
    head_house_id: hh.id,
    code: hh.code,
    name: hh.name,
    parent_head_house_id: hh.parent_head_house_id || null,
    tier1_pct: tier1Pct,
    tier1_stake: tier1Stake,
    tier1_owed: tier1Owed,
    tier2_pct: Number(hh.tier2_percent) || 0,
    tier2_owed: tier2Owed,
    tier2_breakdown: tier2Breakdown,
    total_owed: totalOwed,
    paid,
    balance,
  };
}

app.get("/api/admin/affiliate/summary", requireAuth, requireAdmin, (_req, res) => {
  const houses = db.prepare(`SELECT * FROM head_houses ORDER BY code`).all();
  res.json(houses.map((h) => affiliateSummaryForHeadHouse(h)));
});

app.get("/api/admin/affiliate/:hhId", requireAuth, requireAdmin, (req, res) => {
  const hh = findHeadHouse(req.params.hhId);
  if (!hh) return res.status(404).json({ error: "head_house_not_found" });
  const summary = affiliateSummaryForHeadHouse(hh);
  // Include customer-level breakdown for tier1
  const tier1Customers = db.prepare(`
    SELECT customers.id, customers.code, customers.name, customers.line_display_name,
           COALESCE(SUM(entries.amount), 0) AS stake,
           COUNT(DISTINCT tickets.id) AS ticket_count
    FROM customers
    LEFT JOIN tickets ON tickets.customer_id = customers.id AND tickets.status = 'approved'
    LEFT JOIN entries ON entries.ticket_id = tickets.id
    WHERE COALESCE(tickets.head_house_id, customers.head_house_id) = ?
    GROUP BY customers.id
    HAVING ticket_count > 0
    ORDER BY stake DESC
  `).all(hh.id);
  const payouts = db.prepare(`
    SELECT affiliate_payouts.*, users.username AS paid_by_username
    FROM affiliate_payouts
    LEFT JOIN users ON users.id = affiliate_payouts.paid_by
    WHERE head_house_id = ?
    ORDER BY created_at DESC
  `).all(hh.id);
  res.json({ ...summary, tier1Customers, payouts });
});

app.post("/api/admin/affiliate/:hhId/payout", requireAuth, requireAdmin, (req, res) => {
  const hh = findHeadHouse(req.params.hhId);
  if (!hh) return res.status(404).json({ error: "head_house_not_found" });
  const amount = Number(req.body.amount);
  const note = cleanText(req.body.note, 240);
  const idemKey = cleanText(req.body.idempotencyKey, 80);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "invalid_amount" });
  }
  /* S1: idempotency — if same key submitted twice, return original instead of double-paying */
  if (idemKey) {
    const existing = db.prepare("SELECT * FROM affiliate_payouts WHERE idempotency_key = ?").get(idemKey);
    if (existing) {
      return res.status(200).json({ ...existing, idempotent_replay: true });
    }
  }
  const summary = affiliateSummaryForHeadHouse(hh);
  if (amount > summary.balance + 0.01) {
    return res.status(400).json({ error: "amount_exceeds_balance", balance: summary.balance });
  }
  const id = crypto.randomUUID();
  const now = nowIso();
  try {
    db.prepare(`
      INSERT INTO affiliate_payouts (id, head_house_id, amount, note, paid_by, created_at, idempotency_key)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, hh.id, amount, note, req.user.id, now, idemKey || null);
  } catch (e) {
    /* UNIQUE constraint on idempotency_key — concurrent request beat us; return existing */
    if (idemKey) {
      const existing = db.prepare("SELECT * FROM affiliate_payouts WHERE idempotency_key = ?").get(idemKey);
      if (existing) return res.status(200).json({ ...existing, idempotent_replay: true });
    }
    throw e;
  }
  logAudit(req.user.id, "create", "affiliate_payout", id, { head_house_id: hh.id, amount, note });
  res.status(201).json({ id, head_house_id: hh.id, amount, note, created_at: now });
});

app.get("/api/admin/affiliate/payouts/all", requireAuth, requireAdmin, (_req, res) => {
  const rows = db.prepare(`
    SELECT affiliate_payouts.*, head_houses.code AS head_house_code, head_houses.name AS head_house_name,
           users.username AS paid_by_username
    FROM affiliate_payouts
    JOIN head_houses ON head_houses.id = affiliate_payouts.head_house_id
    LEFT JOIN users ON users.id = affiliate_payouts.paid_by
    ORDER BY created_at DESC
    LIMIT 200
  `).all();
  res.json(rows);
});

// Update head_house create/update to accept new fields
// (we'll patch the existing endpoints below)




// Affiliate self-service for head_house_viewer role
app.get("/api/me/affiliate-self", requireAuth, (req, res) => {
  if ((req.user.role !== "head_house_viewer" && req.user.role !== "affiliate") || !req.user.head_house_id) {
    return res.status(403).json({ error: "not_authorized" });
  }
  const hh = findHeadHouse(req.user.head_house_id);
  if (!hh) return res.status(404).json({ error: "head_house_not_found" });
  const summary = affiliateSummaryForHeadHouse(hh);
  const payouts = db.prepare(`
    SELECT id, amount, note, created_at FROM affiliate_payouts
    WHERE head_house_id = ? ORDER BY created_at DESC LIMIT 50
  `).all(hh.id);
  const customerCount = db.prepare(`SELECT COUNT(*) AS c FROM customers WHERE head_house_id = ?`).get(hh.id).c;
  res.json({ ...summary, payouts, customerCount, head_house_code: hh.code, head_house_name: hh.name });
});



// ===== VIEWER PASSWORD VAULT (2026-05-23) =====
// Encrypted at-rest storage of viewer plaintext passwords (admin-recoverable).
// Key: 32-byte hex stored in app_settings.viewer_enc_key (auto-generated on first run).
ensureColumn("users", "password_encrypted", "TEXT");

function getOrCreateViewerEncKey() {
  // Priority 1: env var (recommended for production)
  if (process.env.VIEWER_ENC_KEY) {
    try {
      const buf = Buffer.from(process.env.VIEWER_ENC_KEY, "hex");
      if (buf.length === 32) return buf;
    } catch (e) {}
  }
  /* S1-7: warn loud if falling back to DB-stored key (less secure) */
  console.warn("[security] VIEWER_ENC_KEY env not set — falling back to DB-stored key.");
  console.warn("[security] For production: set VIEWER_ENC_KEY in /etc/systemd/system/lottery-manager.service.d/override.conf");
  let row;
  try {
    row = db.prepare("SELECT value_json FROM app_settings WHERE key = 'viewer_enc_key'").get();
  } catch (e) { row = null; }
  if (row && row.value_json) {
    try { return Buffer.from(JSON.parse(row.value_json), "hex"); } catch (e) {}
  }
  const key = crypto.randomBytes(32);
  const now = nowIso();
  db.prepare(`INSERT OR REPLACE INTO app_settings (key, value_json, updated_at) VALUES (?, ?, ?)`)
    .run("viewer_enc_key", JSON.stringify(key.toString("hex")), now);
  return key;
}
const VIEWER_ENC_KEY = getOrCreateViewerEncKey();

function encryptViewerPassword(plaintext) {
  if (!plaintext) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", VIEWER_ENC_KEY, iv);
  const enc = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv(12).tag(16).ciphertext — base64
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

function decryptViewerPassword(encoded) {
  if (!encoded) return null;
  try {
    const buf = Buffer.from(encoded, "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ciphertext = buf.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", VIEWER_ENC_KEY, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return dec.toString("utf8");
  } catch (e) {
    return null;
  }
}

// Admin endpoint: get viewer credentials (decrypted) for a head_house
app.get("/api/head-houses/:id/viewer-credentials", requireAuth, requireAdmin, (req, res) => {
  const headHouse = findHeadHouse(req.params.id);
  if (!headHouse) return res.status(404).json({ error: "head_house_not_found" });
  const viewer = db.prepare("SELECT id, username, password_encrypted, created_at FROM users WHERE role = 'head_house_viewer' AND head_house_id = ?").get(headHouse.id);
  if (!viewer) return res.status(404).json({ error: "viewer_account_not_found" });
  const password = decryptViewerPassword(viewer.password_encrypted);
  res.json({
    username: viewer.username,
    password: password,             // null if old account (created before vault)
    hasStoredPassword: !!password,
    created_at: viewer.created_at,
    loginPath: "/",
  });
});





// ===== LIMITS TOOLS (2026-05-23) =====
// Top Numbers + Risk Dashboard + Bulk-add + Limit Templates

db.exec(`
  CREATE TABLE IF NOT EXISTS limit_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    note TEXT,
    items_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

// --- Helper: get all candidate numbers for a bet_type ---
function allNumbersForBetType(betType) {
  const d = betType.digits;
  const max = Math.pow(10, d);
  const arr = [];
  for (let i = 0; i < max; i++) {
    arr.push(String(i).padStart(d, "0"));
  }
  return arr;
}

// --- Helper: doubles/triples/repeats for a bet_type ---
function repeatNumbersForBetType(betType) {
  const d = betType.digits;
  const arr = [];
  for (let i = 0; i < 10; i++) {
    arr.push(String(i).repeat(d));
  }
  return arr;
}

// --- Helper: stake-by-number aggregation for one round ---
function aggregateRoundStakes(roundId) {
  const rows = db.prepare(`
    SELECT entries.bet_type_id, entries.number,
      COUNT(*) AS bet_count,
      COALESCE(SUM(entries.amount), 0) AS total_amount
    FROM entries
    LEFT JOIN tickets ON tickets.id = entries.ticket_id
    WHERE entries.round_id = ?
      AND (entries.ticket_id IS NULL OR tickets.status IN ('pending_review','approved'))
    GROUP BY entries.bet_type_id, entries.number
  `).all(roundId);
  return rows;
}

// --- P1-1: Top Numbers Live ---
app.get("/api/admin/limits/top-numbers/:roundId", requireAuth, requireNonAffiliate, (req, res) => {
  const round = findRound(req.params.roundId);
  if (!round) return res.status(404).json({ error: "round_not_found" });
  const rows = aggregateRoundStakes(round.id);
  const limits = db.prepare("SELECT bet_type_id, number, max_amount FROM limits WHERE round_id = ?").all(round.id);
  const limitMap = {};
  for (const l of limits) limitMap[l.bet_type_id + "|" + l.number] = Number(l.max_amount);
  const betTypeMap = {};
  for (const bt of db.prepare("SELECT * FROM bet_types").all()) betTypeMap[bt.id] = bt;
  const enriched = rows.map(r => {
    const cap = limitMap[r.bet_type_id + "|" + r.number] || null;
    const pct = cap ? (r.total_amount / cap) * 100 : null;
    let alert = "ok";
    if (cap) {
      if (r.total_amount >= cap) alert = "over";
      else if (pct >= 80) alert = "near";
    } else {
      alert = "no_cap";
    }
    return {
      bet_type_id: r.bet_type_id,
      bet_type_name: betTypeMap[r.bet_type_id]?.name || r.bet_type_id,
      number: r.number,
      bet_count: r.bet_count,
      total_amount: Number(r.total_amount),
      current_limit: cap,
      percent_used: pct,
      alert,
    };
  });
  enriched.sort((a, b) => b.total_amount - a.total_amount);
  res.json({ round, items: enriched });
});

// --- P1-2: Risk Dashboard ---
app.get("/api/admin/limits/risk/:roundId", requireAuth, requireNonAffiliate, (req, res) => {
  const round = findRound(req.params.roundId);
  if (!round) return res.status(404).json({ error: "round_not_found" });
  const rates = db.prepare("SELECT bet_type_id, rate FROM payout_rates WHERE lottery_id = ?").all(round.lottery_id);
  const rateMap = {};
  for (const r of rates) rateMap[r.bet_type_id] = Number(r.rate) || 0;
  const totalRevenue = db.prepare(`
    SELECT COALESCE(SUM(entries.amount), 0) AS s
    FROM entries
    LEFT JOIN tickets ON tickets.id = entries.ticket_id
    WHERE entries.round_id = ?
      AND (entries.ticket_id IS NULL OR tickets.status IN ('pending_review','approved'))
  `).get(round.id).s;
  const rows = aggregateRoundStakes(round.id);
  const betTypeMap = {};
  for (const bt of db.prepare("SELECT * FROM bet_types").all()) betTypeMap[bt.id] = bt;
  const items = rows.map(r => {
    const rate = rateMap[r.bet_type_id] || 0;
    const potentialPayout = Number(r.total_amount) * rate;
    const netRisk = potentialPayout - totalRevenue;
    return {
      bet_type_id: r.bet_type_id,
      bet_type_name: betTypeMap[r.bet_type_id]?.name || r.bet_type_id,
      number: r.number,
      total_amount: Number(r.total_amount),
      payout_rate: rate,
      potential_payout: potentialPayout,
      net_risk: netRisk,
    };
  });
  items.sort((a, b) => b.net_risk - a.net_risk);
  res.json({
    round,
    total_revenue: totalRevenue,
    items,
  });
});

// --- P2-3: Bulk-add limits ---
app.post("/api/limits/bulk", requireAuth, requireNonAffiliate, (req, res) => {
  const roundId = String(req.body.roundId || "");
  const betTypeId = String(req.body.betTypeId || "");
  const maxAmount = Number(req.body.maxAmount);
  const mode = String(req.body.mode || "");  // "all" | "doubles" | "previous_result" | "selected"
  const selected = Array.isArray(req.body.numbers) ? req.body.numbers : [];
  const overwrite = !!req.body.overwrite;

  const round = findRound(roundId);
  const betType = findBetType(betTypeId);
  if (!round || !betType || !Number.isFinite(maxAmount) || maxAmount < 0) {
    return res.status(400).json({ error: "invalid_payload" });
  }

  let numbers = [];
  if (mode === "all") numbers = allNumbersForBetType(betType);
  else if (mode === "doubles") numbers = repeatNumbersForBetType(betType);
  else if (mode === "previous_result") {
    /* S1-5 FIX: results schema is row-per-(round,bet_type,number) — no
       result.three_top column. Query the actual table. */
    const prev = db.prepare(`
      SELECT id FROM rounds
      WHERE lottery_id = ? AND draw_date < ?
      ORDER BY draw_date DESC LIMIT 1
    `).get(round.lottery_id, round.draw_date);
    if (prev) {
      /* All result numbers for the previous round */
      const allPrevRows = db.prepare("SELECT bet_type_id, number FROM results WHERE round_id = ?").all(prev.id);
      const seen = new Set();
      if (betType.digits === 3) {
        for (const r of allPrevRows) {
          if (r.number && r.number.length === 3 && !seen.has(r.number)) {
            numbers.push(r.number); seen.add(r.number);
          }
        }
      } else if (betType.digits === 2) {
        for (const r of allPrevRows) {
          if (!r.number) continue;
          let n = r.number.length === 3 ? r.number.slice(-2) : r.number;
          if (n.length === 2 && !seen.has(n)) {
            numbers.push(n); seen.add(n);
          }
        }
      } else if (betType.digits === 1) {
        for (const r of allPrevRows) {
          if (!r.number) continue;
          for (const c of r.number) {
            if (/\d/.test(c) && !seen.has(c)) {
              numbers.push(c); seen.add(c);
            }
          }
        }
      }
    }
  } else if (mode === "selected") {
    numbers = selected.map(n => String(n).replace(/\D/g, "").padStart(betType.digits, "0")).filter(n => n.length === betType.digits);
  } else {
    return res.status(400).json({ error: "invalid_mode" });
  }

  if (!numbers.length) return res.json({ ok: true, inserted: 0, updated: 0 });

  const now = nowIso();
  let inserted = 0, updated = 0;
  db.exec("BEGIN");
  try {
    for (const num of numbers) {
      const existing = db.prepare("SELECT id FROM limits WHERE round_id = ? AND bet_type_id = ? AND number = ?").get(round.id, betType.id, num);
      if (existing) {
        if (overwrite) {
          db.prepare("UPDATE limits SET max_amount = ?, updated_at = ? WHERE id = ?").run(maxAmount, now, existing.id);
          updated++;
        }
      } else {
        const id = crypto.randomUUID();
        db.prepare("INSERT INTO limits (id, round_id, bet_type_id, number, max_amount, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, round.id, betType.id, num, maxAmount, now, now);
        inserted++;
      }
    }
    db.exec("COMMIT");
  } catch (e) { db.exec("ROLLBACK"); throw e; }

  logAudit(req.user.id, "bulk_limits", "round", round.id, { mode, count: numbers.length, maxAmount, inserted, updated });
  res.json({ ok: true, inserted, updated, total: numbers.length });
});

// --- P2-4: Limit templates ---
app.get("/api/limit-templates", requireAuth, requireNonAffiliate, (req, res) => {
  const rows = db.prepare("SELECT * FROM limit_templates ORDER BY created_at DESC").all();
  res.json(rows.map(r => ({
    id: r.id,
    name: r.name,
    note: r.note,
    items: JSON.parse(r.items_json || "[]"),
    item_count: JSON.parse(r.items_json || "[]").length,
    created_at: r.created_at,
    updated_at: r.updated_at,
  })));
});

app.post("/api/limit-templates", requireAuth, requireNonAffiliate, (req, res) => {
  const name = cleanText(req.body.name, 100);
  const note = cleanText(req.body.note, 500) || "";
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!name) return res.status(400).json({ error: "name_required" });
  const cleanItems = items
    .filter(it => it && it.bet_type_id && it.number && Number.isFinite(Number(it.max_amount)))
    .map(it => ({
      bet_type_id: String(it.bet_type_id),
      number: String(it.number),
      max_amount: Number(it.max_amount),
    }));
  if (!cleanItems.length) return res.status(400).json({ error: "items_required" });
  const id = crypto.randomUUID();
  const now = nowIso();
  db.prepare("INSERT INTO limit_templates (id, name, note, items_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, name, note, JSON.stringify(cleanItems), now, now);
  logAudit(req.user.id, "create", "limit_template", id, { name, count: cleanItems.length });
  res.status(201).json({ ok: true, id });
});

app.delete("/api/limit-templates/:id", requireAuth, requireNonAffiliate, (req, res) => {
  const existing = db.prepare("SELECT id FROM limit_templates WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "template_not_found" });
  db.prepare("DELETE FROM limit_templates WHERE id = ?").run(existing.id);
  logAudit(req.user.id, "delete", "limit_template", existing.id);
  res.json({ ok: true });
});

// Save current round's limits as a new template
app.post("/api/limit-templates/from-round/:roundId", requireAuth, requireNonAffiliate, (req, res) => {
  const round = findRound(req.params.roundId);
  if (!round) return res.status(404).json({ error: "round_not_found" });
  const name = cleanText(req.body.name, 100) || ("Template " + (new Date()).toLocaleString("th-TH-u-ca-buddhist"));
  const note = cleanText(req.body.note, 500) || "";
  const limits = db.prepare("SELECT bet_type_id, number, max_amount FROM limits WHERE round_id = ?").all(round.id);
  if (!limits.length) return res.status(400).json({ error: "round_has_no_limits" });
  const id = crypto.randomUUID();
  const now = nowIso();
  db.prepare("INSERT INTO limit_templates (id, name, note, items_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, name, note, JSON.stringify(limits), now, now);
  res.status(201).json({ ok: true, id, count: limits.length });
});

// Apply template to a round
app.post("/api/limit-templates/:id/apply", requireAuth, requireNonAffiliate, (req, res) => {
  const tpl = db.prepare("SELECT * FROM limit_templates WHERE id = ?").get(req.params.id);
  if (!tpl) return res.status(404).json({ error: "template_not_found" });
  const round = findRound(req.body.roundId);
  if (!round) return res.status(400).json({ error: "round_required" });
  const overwrite = !!req.body.overwrite;
  const items = JSON.parse(tpl.items_json || "[]");
  let inserted = 0, updated = 0;
  const now = nowIso();
  db.exec("BEGIN");
  try {
    for (const it of items) {
      const existing = db.prepare("SELECT id FROM limits WHERE round_id = ? AND bet_type_id = ? AND number = ?").get(round.id, it.bet_type_id, it.number);
      if (existing) {
        if (overwrite) {
          db.prepare("UPDATE limits SET max_amount = ?, updated_at = ? WHERE id = ?").run(it.max_amount, now, existing.id);
          updated++;
        }
      } else {
        const id = crypto.randomUUID();
        db.prepare("INSERT INTO limits (id, round_id, bet_type_id, number, max_amount, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, round.id, it.bet_type_id, it.number, it.max_amount, now, now);
        inserted++;
      }
    }
    db.exec("COMMIT");
  } catch (e) { db.exec("ROLLBACK"); throw e; }
  logAudit(req.user.id, "apply_template", "round", round.id, { templateId: tpl.id, inserted, updated });
  res.json({ ok: true, inserted, updated, total: items.length });
});





// ===== NOTIFICATION ENDPOINT (2026-05-23) =====
// Lightweight polling endpoint — returns count of pending tickets + latest ticket timestamp

/* X5: admin endpoint cron-status */

app.get("/api/admin/cron-status", requireAuth, requireAdmin, (_req, res) => {
  const rows = [];
  for (const [name, e] of __cronRegistry) {
    rows.push({ name: e.name, interval_ms: e.intervalMs, jitter_ms: e.jitterMs, last_run: e.lastRun, last_duration_ms: e.lastDurationMs, last_error: e.lastError, run_count: e.runCount });
  }
  rows.sort((a, b) => (a.last_run || "").localeCompare(b.last_run || ""));
  res.json({ rows });
});

app.get("/api/admin/notifications", requireAuth, requireNonAffiliate, (req, res) => {
  const pendingCount = db.prepare(`
    SELECT COUNT(*) AS c FROM tickets WHERE status = 'pending_review'
  `).get().c;
  const latest = db.prepare(`
    SELECT id, code, created_at, customer_id FROM tickets
    WHERE status = 'pending_review'
    ORDER BY created_at DESC LIMIT 1
  `).get();
  res.json({
    pending_review: pendingCount,
    latest_pending_ticket: latest || null,
    server_time: nowIso(),
  });
});





// ===== AUTO-CAP RULES (2026-05-23) =====
db.exec(`
  CREATE TABLE IF NOT EXISTS default_cap_rules (
    id TEXT PRIMARY KEY,
    lottery_id TEXT NOT NULL REFERENCES lotteries(id) ON DELETE CASCADE,
    bet_type_id TEXT NOT NULL REFERENCES bet_types(id) ON DELETE CASCADE,
    default_max REAL NOT NULL DEFAULT 0,
    reduced_rate_pct REAL,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(lottery_id, bet_type_id)
  )
`);
ensureColumn("limits", "reduced_rate_pct", "REAL");
ensureColumn("entries", "payout_multiplier", "REAL DEFAULT 1.0");

function applyDefaultCapsToRound(roundId) {
  const round = findRound(roundId);
  if (!round) return { inserted: 0, error: "round_not_found" };
  const rules = db.prepare("SELECT * FROM default_cap_rules WHERE lottery_id = ? AND enabled = 1").all(round.lottery_id);
  if (!rules.length) return { inserted: 0 };
  const betTypes = db.prepare("SELECT * FROM bet_types").all();
  const btMap = {};
  for (const bt of betTypes) btMap[bt.id] = bt;
  let inserted = 0, updated = 0;
  const now = nowIso();
  db.exec("BEGIN");
  try {
    for (const rule of rules) {
      const bt = btMap[rule.bet_type_id];
      if (!bt) continue;
      const max = Math.pow(10, bt.digits);
      for (let i = 0; i < max; i++) {
        const num = String(i).padStart(bt.digits, "0");
        const existing = db.prepare("SELECT id FROM limits WHERE round_id = ? AND bet_type_id = ? AND number = ?").get(round.id, rule.bet_type_id, num);
        if (existing) continue;  // skip existing (don't overwrite manual settings)
        const id = crypto.randomUUID();
        db.prepare("INSERT INTO limits (id, round_id, bet_type_id, number, max_amount, reduced_rate_pct, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
          .run(id, round.id, rule.bet_type_id, num, rule.default_max, rule.reduced_rate_pct, now, now);
        inserted++;
      }
    }
    db.exec("COMMIT");
  } catch (e) { db.exec("ROLLBACK"); throw e; }
  return { inserted, updated };
}

// CRUD endpoints
app.get("/api/admin/default-cap-rules", requireAuth, requireNonAffiliate, (req, res) => {
  const rows = db.prepare(`
    SELECT dcr.*, lotteries.name AS lottery_name, bet_types.name AS bet_type_name
    FROM default_cap_rules dcr
    LEFT JOIN lotteries ON lotteries.id = dcr.lottery_id
    LEFT JOIN bet_types ON bet_types.id = dcr.bet_type_id
    ORDER BY lotteries.name, bet_types.name
  `).all();
  res.json(rows);
});

app.post("/api/admin/default-cap-rules", requireAuth, requireNonAffiliate, (req, res) => {
  const lotteryId = cleanText(req.body.lotteryId, 80);
  const betTypeId = cleanText(req.body.betTypeId, 80);
  const defaultMax = Number(req.body.defaultMax);
  const reducedRatePct = req.body.reducedRatePct == null || req.body.reducedRatePct === "" ? null : Number(req.body.reducedRatePct);
  const enabled = req.body.enabled === false ? 0 : 1;
  if (!lotteryId || !betTypeId || !Number.isFinite(defaultMax) || defaultMax < 0) {
    return res.status(400).json({ error: "invalid_payload" });
  }
  if (reducedRatePct !== null && (!Number.isFinite(reducedRatePct) || reducedRatePct < 0 || reducedRatePct > 100)) {
    return res.status(400).json({ error: "invalid_reduced_rate" });
  }
  const now = nowIso();
  const existing = db.prepare("SELECT id FROM default_cap_rules WHERE lottery_id = ? AND bet_type_id = ?").get(lotteryId, betTypeId);
  if (existing) {
    db.prepare("UPDATE default_cap_rules SET default_max = ?, reduced_rate_pct = ?, enabled = ?, updated_at = ? WHERE id = ?")
      .run(defaultMax, reducedRatePct, enabled, now, existing.id);
    res.json({ ok: true, id: existing.id, updated: true });
  } else {
    const id = crypto.randomUUID();
    db.prepare("INSERT INTO default_cap_rules (id, lottery_id, bet_type_id, default_max, reduced_rate_pct, enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(id, lotteryId, betTypeId, defaultMax, reducedRatePct, enabled, now, now);
    res.status(201).json({ ok: true, id, created: true });
  }
});

app.delete("/api/admin/default-cap-rules/:id", requireAuth, requireNonAffiliate, (req, res) => {
  db.prepare("DELETE FROM default_cap_rules WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// Apply rules to a specific round (manual button)
app.post("/api/admin/default-cap-rules/apply", requireAuth, requireNonAffiliate, (req, res) => {
  const roundId = cleanText(req.body.roundId, 80);
  if (!roundId) return res.status(400).json({ error: "roundId_required" });
  try {
    const r = applyDefaultCapsToRound(roundId);
    logAudit(req.user.id, "apply_default_caps", "round", roundId, r);
    res.json({ ok: true, ...r });
  } catch (e) {
    res.status(500).json({ error: "internal_error", message: e.message });
  }
});

// Apply to ALL open rounds at once
app.post("/api/admin/default-cap-rules/apply-all-open", requireAuth, requireNonAffiliate, (req, res) => {
  const rounds = db.prepare("SELECT id FROM rounds WHERE status = 'open' OR status IS NULL").all();
  let totalInserted = 0, processedRounds = 0;
  for (const r of rounds) {
    try {
      const result = applyDefaultCapsToRound(r.id);
      totalInserted += result.inserted || 0;
      processedRounds++;
    } catch (e) {}
  }
  res.json({ ok: true, processedRounds, totalInserted });
});





// ===== LIMITS BULK DELETE (2026-05-23) =====
app.post("/api/admin/limits/bulk-delete", requireAuth, requireNonAffiliate, (req, res) => {
  const roundId = req.body.roundId ? String(req.body.roundId) : null;
  const lotteryId = req.body.lotteryId ? String(req.body.lotteryId) : null;
  const betTypeId = req.body.betTypeId ? String(req.body.betTypeId) : null;
  const onlyAutoApplied = !!req.body.onlyAutoApplied;  // future use

  if (!roundId && !lotteryId && !betTypeId) {
    return res.status(400).json({ error: "at_least_one_filter_required" });
  }

  const where = [];
  const args = [];
  if (roundId) { where.push("limits.round_id = ?"); args.push(roundId); }
  if (lotteryId) { where.push("rounds.lottery_id = ?"); args.push(lotteryId); }
  if (betTypeId) { where.push("limits.bet_type_id = ?"); args.push(betTypeId); }

  const sql = `
    DELETE FROM limits WHERE id IN (
      SELECT limits.id FROM limits
      JOIN rounds ON rounds.id = limits.round_id
      WHERE ${where.join(" AND ")}
    )
  `;
  const before = db.prepare("SELECT COUNT(*) AS c FROM limits").get().c;
  db.prepare(sql).run(...args);
  const after = db.prepare("SELECT COUNT(*) AS c FROM limits").get().c;
  const deleted = before - after;
  logAudit(req.user.id, "bulk_delete_limits", "limits", "", { roundId, lotteryId, betTypeId, deleted });
  res.json({ ok: true, deleted });
});





// ===== OVERVIEW (หน้ารวม) (2026-05-23) =====
app.get("/api/admin/overview", requireAuth, requireNonAffiliate, (req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartIso = todayStart.toISOString();

  // 1. OVERVIEW-BY-ROUND-V1: นับตามงวดที่ยังไม่ finalize + draw_date >= today
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const todayBills = db.prepare(`
    SELECT COUNT(DISTINCT tickets.id) AS bill_count,
           COUNT(DISTINCT tickets.customer_id) AS customer_count
    FROM tickets
    JOIN rounds ON rounds.id = tickets.round_id
    WHERE rounds.draw_date >= ?
      
      AND tickets.status IN ('pending_review', 'approved')
  `).get(todayDateStr);

  const todayStake = db.prepare(`
    SELECT COALESCE(SUM(entries.amount), 0) AS total_stake
    FROM entries
    JOIN tickets ON tickets.id = entries.ticket_id
    JOIN rounds ON rounds.id = tickets.round_id
    WHERE rounds.draw_date >= ?
      
      AND tickets.status IN ('pending_review', 'approved')
  `).get(todayDateStr).total_stake;

  /* OVERVIEW-CHANNEL-SPLIT-V1 + BY-ROUND-V1: แยกยอด online vs head_house ตามงวด */
  const channelSplit = db.prepare(`
    SELECT
      CASE WHEN tickets.head_house_id IN ('direct','line_self') OR tickets.head_house_id IS NULL
           THEN 'online' ELSE 'head_house' END AS channel,
      COUNT(DISTINCT tickets.id) AS bill_count,
      COALESCE(SUM(entries.amount), 0) AS total_stake
    FROM tickets
    JOIN rounds ON rounds.id = tickets.round_id
    LEFT JOIN entries ON entries.ticket_id = tickets.id
    WHERE rounds.draw_date >= ?
      
      AND tickets.status IN ('pending_review', 'approved')
    GROUP BY channel
  `).all(todayDateStr);
  const onlineRow = channelSplit.find(r => r.channel === 'online') || { bill_count: 0, total_stake: 0 };
  const headHouseRow = channelSplit.find(r => r.channel === 'head_house') || { bill_count: 0, total_stake: 0 };

  const byHeadHouse = db.prepare(`
    SELECT tickets.head_house_id AS hh_id,
           COALESCE(head_houses.name, tickets.head_house_id) AS hh_name,
           COALESCE(head_houses.code, '') AS hh_code,
           COUNT(DISTINCT tickets.id) AS bill_count,
           COALESCE(SUM(entries.amount), 0) AS total_stake
    FROM tickets
    JOIN rounds ON rounds.id = tickets.round_id
    LEFT JOIN entries ON entries.ticket_id = tickets.id
    LEFT JOIN head_houses ON head_houses.id = tickets.head_house_id
    WHERE rounds.draw_date >= ?
      
      AND tickets.status IN ('pending_review', 'approved')
      AND tickets.head_house_id NOT IN ('direct','line_self')
      AND tickets.head_house_id IS NOT NULL
    GROUP BY tickets.head_house_id
    ORDER BY total_stake DESC
  `).all(todayDateStr);

  /* ONLINE-BILLS-LIST-V1 + BY-ROUND-V1: list บิลออนไลน์ในงวดที่ยังไม่ปิด */
  const onlineBills = db.prepare(`
    SELECT tickets.id, tickets.code, tickets.status, tickets.created_at, tickets.head_house_id,
           COALESCE(customers.line_display_name, customers.name, customers.code, 'WALKIN') AS customer_name,
           COALESCE(SUM(entries.amount), 0) AS total_amount,
           COUNT(entries.id) AS entry_count
    FROM tickets
    JOIN rounds ON rounds.id = tickets.round_id
    LEFT JOIN entries ON entries.ticket_id = tickets.id
    LEFT JOIN customers ON customers.id = tickets.customer_id
    WHERE rounds.draw_date >= ?
      
      AND tickets.status IN ('pending_review', 'approved')
      AND (tickets.head_house_id IN ('direct','line_self') OR tickets.head_house_id IS NULL)
    GROUP BY tickets.id
    ORDER BY tickets.created_at DESC
    LIMIT 30
  `).all(todayDateStr);

  const pendingCount = db.prepare(`
    SELECT COUNT(*) AS c FROM tickets WHERE status = 'pending_review'
  `).get().c;

  const latestPending = db.prepare(`
    SELECT tickets.id, tickets.code, tickets.created_at,
           customers.code AS customer_code, customers.name AS customer_name,
           customers.line_display_name
    FROM tickets
    LEFT JOIN customers ON customers.id = tickets.customer_id
    WHERE tickets.status = 'pending_review'
    ORDER BY tickets.created_at DESC LIMIT 3
  `).all();

  // 2. Active rounds = ones with bets today OR drawing today/tomorrow
  const activeRounds = db.prepare(`
    SELECT rounds.id, rounds.label, rounds.draw_date, rounds.draw_time,
           rounds.close_before_minutes, lotteries.id AS lottery_id, lotteries.name AS lottery_name
    FROM rounds
    LEFT JOIN lotteries ON lotteries.id = rounds.lottery_id
    WHERE (rounds.result_status IS NULL OR rounds.result_status != 'finalized')
      AND rounds.draw_date BETWEEN date('now', 'localtime') AND date('now', 'localtime', '+14 day')
      AND (
        -- still accepting bets (close-time not yet passed)
        datetime(rounds.draw_date || ' ' || COALESCE(rounds.draw_time, '23:59'),
                 '-' || COALESCE(rounds.close_before_minutes, 0) || ' minutes')
              > datetime('now', 'localtime')
        OR
        -- OR has at least one bill from today (efficient subquery, no fanout)
        rounds.id IN (
          SELECT DISTINCT entries.round_id FROM entries
          JOIN tickets ON tickets.id = entries.ticket_id
          WHERE tickets.created_at >= ?
        )
      )
    ORDER BY rounds.draw_date ASC, rounds.draw_time ASC
    LIMIT 30
  `).all(todayStartIso);

  const betTypeMap = {};
  for (const bt of db.prepare("SELECT * FROM bet_types").all()) betTypeMap[bt.id] = bt;

  const roundsDetail = activeRounds.map(round => {
    // Stake aggregation for THIS round (all-time, not just today — to see total exposure)
    const rows = db.prepare(`
      SELECT entries.bet_type_id, entries.number,
        COUNT(*) AS bet_count,
        COALESCE(SUM(entries.amount), 0) AS total_amount
      FROM entries
      LEFT JOIN tickets ON tickets.id = entries.ticket_id
      WHERE entries.round_id = ?
        AND (entries.ticket_id IS NULL OR tickets.status IN ('pending_review','approved'))
      GROUP BY entries.bet_type_id, entries.number
    `).all(round.id);

    const limitRows = db.prepare("SELECT bet_type_id, number, max_amount, reduced_rate_pct FROM limits WHERE round_id = ?").all(round.id);
    const limitMap = {};
    for (const l of limitRows) limitMap[l.bet_type_id + "|" + l.number] = l;

    const enriched = rows.map(r => {
      const lim = limitMap[r.bet_type_id + "|" + r.number];
      const cap = lim ? Number(lim.max_amount) : null;
      const pct = cap ? (r.total_amount / cap) * 100 : null;
      let alert = "ok";
      if (cap) {
        if (r.total_amount >= cap) alert = "over";
        else if (pct >= 80) alert = "near";
      } else alert = "no_cap";
      return {
        bet_type_id: r.bet_type_id,
        bet_type_name: betTypeMap[r.bet_type_id]?.name || r.bet_type_id,
        number: r.number,
        bet_count: r.bet_count,
        total_amount: Number(r.total_amount),
        current_limit: cap,
        percent_used: pct,
        alert,
        reduced_rate_pct: lim?.reduced_rate_pct,
      };
    });

    enriched.sort((a, b) => b.total_amount - a.total_amount);
    const hot = enriched.slice(0, 5);

    // Risk calculation
    const rates = db.prepare("SELECT bet_type_id, rate FROM payout_rates WHERE lottery_id = ?").all(round.lottery_id);
    const rateMap = {};
    for (const r of rates) rateMap[r.bet_type_id] = Number(r.rate) || 0;
    const totalRevenue = enriched.reduce((s, e) => s + e.total_amount, 0);
    const risks = enriched.map(e => {
      const rate = rateMap[e.bet_type_id] || 0;
      // Account for reduced_rate: if over cap, the amount over cap is paid at reduced rate
      let effectivePayout;
      if (e.current_limit && e.reduced_rate_pct != null && e.total_amount > e.current_limit) {
        const overAmount = e.total_amount - e.current_limit;
        effectivePayout = (e.current_limit * rate) + (overAmount * rate * (e.reduced_rate_pct / 100));
      } else {
        effectivePayout = e.total_amount * rate;
      }
      return {
        ...e,
        payout_rate: rate,
        potential_payout: effectivePayout,
        net_risk: effectivePayout - totalRevenue,
      };
    }).sort((a, b) => b.net_risk - a.net_risk);
    const topRisks = risks.filter(r => r.net_risk > 0).slice(0, 3);

    // Minutes until close
    let minutesUntilClose = null;
    if (round.draw_date && round.draw_time) {
      try {
        const drawDt = new Date(round.draw_date + "T" + round.draw_time + ":00+07:00");
        const closeDt = new Date(drawDt.getTime() - (round.close_before_minutes || 0) * 60000);
        const ms = closeDt.getTime() - Date.now();
        minutesUntilClose = Math.round(ms / 60000);
      } catch (e) {}
    }

    return {
      round_id: round.id,
      lottery_id: round.lottery_id,
      lottery_name: round.lottery_name,
      label: round.label,
      draw_date: round.draw_date,
      draw_time: round.draw_time,
      minutes_until_close: minutesUntilClose,
      total_stake: totalRevenue,
      bill_count: enriched.reduce((s, e) => s + e.bet_count, 0),
      hot_numbers: hot,
      top_risks: topRisks,
      worst_risk: topRisks[0] || null,
    };
  });

  // 3. Worst case across all rounds
  const worstCase = roundsDetail
    .map(r => r.worst_risk ? { ...r.worst_risk, round_label: r.lottery_name + " " + r.label, round_id: r.round_id } : null)
    .filter(Boolean)
    .sort((a, b) => b.net_risk - a.net_risk)[0] || null;

  res.json({
    today: {
      date: new Date().toISOString().slice(0, 10),
      total_stake: Number(todayStake),
      bill_count: todayBills.bill_count,
      customer_count: todayBills.customer_count,
      pending_review: pendingCount,
      latest_pending: latestPending,
      /* OVERVIEW-CHANNEL-SPLIT-V1 */
      online: {
        total_stake: Number(onlineRow.total_stake),
        bill_count: onlineRow.bill_count,
        bills: onlineBills.map(b => ({
          id: b.id, code: b.code, status: b.status, customer_name: b.customer_name,
          total_amount: Number(b.total_amount), entry_count: b.entry_count, created_at: b.created_at,
        })),
      },
      head_house: { total_stake: Number(headHouseRow.total_stake), bill_count: headHouseRow.bill_count },
      by_head_house: byHeadHouse.map(r => ({
        hh_id: r.hh_id, hh_name: r.hh_name, hh_code: r.hh_code,
        bill_count: r.bill_count, total_stake: Number(r.total_stake)
      })),
    },
    worst_case: worstCase,
    active_rounds: roundsDetail,
    server_time: nowIso(),
  });
});





// ===== DELETE ENDPOINTS for schedules/rounds/lotteries (2026-05-23) =====
app.delete("/api/schedule-templates/:id", requireAuth, requireNonAffiliate, (req, res) => {
  const id = req.params.id;
  const existing = db.prepare("SELECT id FROM schedule_templates WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "schedule_template_not_found" });
  db.prepare("DELETE FROM schedule_templates WHERE id = ?").run(id);
  logAudit(req.user.id, "delete", "schedule_template", id);
  res.json({ ok: true });
});

app.delete("/api/rounds/:id", requireAuth, requireNonAffiliate, (req, res) => {
  const id = req.params.id;
  const round = db.prepare("SELECT id FROM rounds WHERE id = ?").get(id);
  if (!round) return res.status(404).json({ error: "round_not_found" });
  // Safety: refuse if has any entries
  const entryCount = db.prepare("SELECT COUNT(*) AS c FROM entries WHERE round_id = ?").get(id).c;
  if (entryCount > 0) {
    return res.status(409).json({ error: "round_has_entries", message: `งวดนี้มีบิล ${entryCount} รายการ ลบไม่ได้` });
  }
  db.prepare("DELETE FROM rounds WHERE id = ?").run(id);
  logAudit(req.user.id, "delete", "round", id);
  res.json({ ok: true });
});

app.delete("/api/lotteries/:id", requireAuth, requireAdmin, (req, res) => {
  const id = req.params.id;
  const lottery = db.prepare("SELECT id, name FROM lotteries WHERE id = ?").get(id);
  if (!lottery) return res.status(404).json({ error: "lottery_not_found" });
  // Safety: refuse if has any rounds
  const roundCount = db.prepare("SELECT COUNT(*) AS c FROM rounds WHERE lottery_id = ?").get(id).c;
  if (roundCount > 0) {
    return res.status(409).json({ error: "lottery_has_rounds", message: `หวยนี้มีงวด ${roundCount} งวด ลบไม่ได้ — ลบงวดให้หมดก่อน` });
  }
  db.prepare("DELETE FROM lotteries WHERE id = ?").run(id);
  logAudit(req.user.id, "delete", "lottery", id, { name: lottery.name });
  res.json({ ok: true });
});





// ===== MARK-PAID FEATURE (2026-05-23) =====
ensureColumn("entries", "paid_at", "TEXT");
ensureColumn("entries", "paid_by", "TEXT");
ensureColumn("entries", "paid_note", "TEXT");

app.post("/api/entries/:id/mark-paid", requireAuth, requireAdmin, (req, res) => {
  const id = req.params.id;
  const note = cleanText(req.body && req.body.note, 500) || "";
  // PHASE-0 IDEMPOTENCY-V1 — require client-supplied key (e.g. UUID per UI action) to prevent double-pay
  const idemKey = cleanText(req.body && req.body.idempotency_key, 80) || "";
  if (!idemKey || idemKey.length < 8) return res.status(400).json({ error: "missing_idempotency_key" });
  const existing = db.prepare("SELECT id, paid_at, paid_idempotency_key FROM entries WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "entry_not_found" });
  // Replay-safe: same key + already paid → return success without rewriting
  if (existing.paid_idempotency_key === idemKey && existing.paid_at) {
    return res.json({ ok: true, paid_at: existing.paid_at, replayed: true });
  }
  const now = nowIso();
  try {
    db.prepare("UPDATE entries SET paid_at = ?, paid_by = ?, paid_note = ?, paid_idempotency_key = ?, updated_at = ? WHERE id = ?")
      .run(now, req.user.id, note, idemKey, now, id);
  } catch (e) {
    if (String(e && e.message || "").includes("UNIQUE")) {
      return res.status(409).json({ error: "duplicate_idempotency_key" });
    }
    throw e;
  }
  logAudit(req.user.id, "mark_paid", "entry", id, { note, idemKey });
  res.json({ ok: true, paid_at: now });
});

app.post("/api/entries/:id/mark-unpaid", requireAuth, requireAdmin, (req, res) => {
  const id = req.params.id;
  const existing = db.prepare("SELECT id FROM entries WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "entry_not_found" });
  const now = nowIso();
  db.prepare("UPDATE entries SET paid_at = NULL, paid_by = NULL, paid_note = NULL, paid_idempotency_key = NULL, updated_at = ? WHERE id = ?")
    .run(now, id);
  logAudit(req.user.id, "mark_unpaid", "entry", id);
  res.json({ ok: true });
});









// === S1: payout idempotency ===
ensureColumn("affiliate_payouts", "idempotency_key", "TEXT");

/* MIG-REFUND: ขยาย tickets.status enum รับ 'refunded' + 'auto_cancelled' */
(function migrateTicketStatusRefund() {
  try {
    const info = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='tickets'").get();
    if (!info || info.sql.includes("'refunded'")) return;
    console.log("[migration] expand tickets.status to include refunded + auto_cancelled");
    db.exec("PRAGMA foreign_keys = OFF;");
    db.exec(`BEGIN TRANSACTION;`);
    /* extract current schema, rewrite CHECK */
    const newSql = info.sql.replace(
      /CHECK\s*\(\s*status\s+IN[^)]+\)/,
      "CHECK(status IN ('pending_review','approved','rejected','cancelled','auto_cancelled','refunded'))"
    );
    /* fallback: ถ้า regex ไม่ตรง — skip */
    if (newSql === info.sql) {
      db.exec("ROLLBACK;");
      db.exec("PRAGMA foreign_keys = ON;");
      console.warn("[migration] tickets.status regex did not match — skipped");
      return;
    }
    const colsRow = db.prepare("PRAGMA table_info(tickets)").all();
    const cols = colsRow.map(c => c.name).join(", ");
    const newSqlRename = newSql.replace(/CREATE TABLE\s+tickets\b/, "CREATE TABLE tickets_new");
    db.exec(newSqlRename + ";");
    db.exec(`INSERT INTO tickets_new (${cols}) SELECT ${cols} FROM tickets;`);
    db.exec("DROP TABLE tickets;");
    db.exec("ALTER TABLE tickets_new RENAME TO tickets;");
    db.exec("COMMIT;");
    db.exec("PRAGMA foreign_keys = ON;");
    console.log("[migration] tickets.status enum extended ✓");
  } catch (e) {
    try { db.exec("ROLLBACK;"); } catch {}
    try { db.exec("PRAGMA foreign_keys = ON;"); } catch {}
    console.error("[migration] tickets.status migration failed:", e.message);
  }
})();

try { db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_payouts_idem ON affiliate_payouts(idempotency_key) WHERE idempotency_key IS NOT NULL;"); } catch (e) {}

// ===== HOTFIX 2026-05-24: scoping indexes =====
try {
  db.exec("CREATE INDEX IF NOT EXISTS idx_customers_hh ON customers(head_house_id);");
  db.exec("CREATE INDEX IF NOT EXISTS idx_tickets_hh_created ON tickets(head_house_id, created_at DESC);");
  db.exec("CREATE INDEX IF NOT EXISTS idx_entries_ticket ON entries(ticket_id);");
  db.exec("CREATE INDEX IF NOT EXISTS idx_entries_customer ON entries(customer_id);");
  db.exec("CREATE INDEX IF NOT EXISTS idx_tickets_customer ON tickets(customer_id);");
  console.log("[hotfix] scoping indexes ensured");
} catch (e) {
  console.error("[hotfix] index creation failed:", e.message);
}

// ===== BATCH 1 SCHEMA: customer.phone + head_house.type + affiliate role =====
ensureColumn("customers", "phone", "TEXT");
ensureColumn("head_houses", "type", "TEXT NOT NULL DEFAULT 'head_house'");

// Migrate users.role CHECK constraint to allow 'affiliate'
(function migrateUsersRoleAffiliate() {
  try {
    const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get();
    if (!tableInfo || tableInfo.sql.includes("'affiliate'")) {
      return;  // already migrated
    }
    console.log("[migration] expanding users.role CHECK to include 'affiliate'");
    db.exec("PRAGMA foreign_keys = OFF;");
    db.exec(`
      BEGIN TRANSACTION;
      CREATE TABLE users_new (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'operator', 'head_house_viewer', 'affiliate')),
        head_house_id TEXT REFERENCES head_houses(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL,
        password_encrypted TEXT
      );
      INSERT INTO users_new (id, username, password_hash, role, head_house_id, created_at, password_encrypted)
      SELECT id, username, password_hash, role, head_house_id, created_at, password_encrypted FROM users;
      DROP TABLE users;
      ALTER TABLE users_new RENAME TO users;
      COMMIT;
    `);
    db.exec("PRAGMA foreign_keys = ON;");
    console.log("[migration] users.role now accepts 'affiliate'");
  } catch (e) {
    console.error("[migration] users.role migration failed:", e.message);
  }
})();





// ===== PATCH A: customer + affiliate endpoints (2026-05-24) =====

// Quick-create customer (used by Smart Customer Field)
app.post("/api/customers/quick-create", requireAuth, requireWriteAccess, (req, res) => {
  /* HOTFIX: quick-create dedupe — return existing if same name in same hh */
  try {
    const probeName = String((req.body && req.body.name) || "").trim();
    const probeHH = (req.user.role === "affiliate" && req.user.head_house_id)
      ? req.user.head_house_id
      : String((req.body && req.body.headHouseId) || "direct");
    if (probeName) {
      const existing = db.prepare(
        "SELECT * FROM customers WHERE head_house_id = ? AND LOWER(TRIM(name)) = LOWER(?) LIMIT 1"
      ).get(probeHH, probeName);
      if (existing) return res.json(existing);
    }
  } catch (e) { /* fall through */ }
  const name = cleanText(req.body && req.body.name, 80);
  const phone = cleanText(req.body && req.body.phone, 40) || null;
  // If affiliate: FORCE headHouseId to their own; if admin: accept body
  const headHouseId = req.user.role === "affiliate"
    ? req.user.head_house_id
    : (cleanText(req.body && req.body.headHouseId, 80) || "direct");
  if (!name) return res.status(400).json({ error: "name_required" });
  if (!findHeadHouse(headHouseId)) return res.status(400).json({ error: "invalid_head_house" });
  const code = nextSequentialCode("customers", "C", 4);
  const now = nowIso();
  const id = createSlugId("customer", code);
  db.prepare(`
    INSERT INTO customers (id, code, name, phone, head_house_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, code, name, phone, headHouseId, now, now);
  logAudit(req.user.id, "quick_create", "customer", id, { name, phone, headHouseId });
  const created = db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
  res.status(201).json(created);
});

// Update customer phone (and other simple fields)
app.put("/api/customers/:id/phone", requireAuth, requireNonAffiliate, (req, res) => {
  const phone = cleanText(req.body && req.body.phone, 40) || null;
  const existing = db.prepare("SELECT id FROM customers WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "customer_not_found" });
  db.prepare("UPDATE customers SET phone = ?, updated_at = ? WHERE id = ?").run(phone, nowIso(), existing.id);
  res.json({ ok: true });
});

// Customer detail with history
app.get("/api/customers/:id/detail", requireAuth, (req, res) => {
  const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(req.params.id);
  if (!customer) return res.status(404).json({ error: "customer_not_found" });
  /* P4: affiliate can only see their OWN customers */
  if (req.user.role === "affiliate" && customer.head_house_id !== req.user.head_house_id) {
    return res.status(403).json({ error: "forbidden" });
  }
  /* P4: head_house_viewer can only see their OWN customers too */
  if (req.user.role === "head_house_viewer" && customer.head_house_id !== req.user.head_house_id) {
    return res.status(403).json({ error: "forbidden" });
  }
  const headHouse = findHeadHouse(customer.head_house_id);
  // Recent bills (tickets)
  const bills = db.prepare(`
    SELECT tickets.*, rounds.label AS round_label, rounds.draw_date,
           lotteries.name AS lottery_name,
           (SELECT COUNT(*) FROM entries WHERE ticket_id = tickets.id) AS entry_count,
           (SELECT COALESCE(SUM(amount),0) FROM entries WHERE ticket_id = tickets.id) AS total_amount
    FROM tickets
    LEFT JOIN rounds ON rounds.id = tickets.round_id
    LEFT JOIN lotteries ON lotteries.id = rounds.lottery_id
    WHERE tickets.customer_id = ?
    ORDER BY tickets.created_at DESC LIMIT 50
  `).all(req.params.id);
  // Stats: total stake, win count, total payout
  const stats = db.prepare(`
    SELECT COUNT(DISTINCT tickets.id) AS bill_count,
           COALESCE(SUM(entries.amount), 0) AS total_stake
    FROM entries
    JOIN tickets ON tickets.id = entries.ticket_id
    WHERE entries.customer_id = ? AND tickets.status IN ('pending_review','approved')
  `).get(req.params.id);
  res.json({ ...customer, head_house: headHouse, bills, stats });
});





// ===== PATCH B: affiliate role endpoints (2026-05-24) =====

// Create affiliate user account (similar to viewer-account but with role='affiliate')
app.post("/api/head-houses/:id/affiliate-account", requireAuth, requireAdmin, (req, res) => {
  const headHouse = findHeadHouse(req.params.id);
  if (!headHouse) return res.status(404).json({ error: "head_house_not_found" });
  const existing = db.prepare("SELECT id, username, role FROM users WHERE role IN ('head_house_viewer','affiliate') AND head_house_id = ?").get(headHouse.id);
  if (existing) {
    return res.status(409).json({ error: "account_exists", user: publicUser(existing) });
  }
  // Generate unique aff-username with collision check across ALL users
  const baseAff = "aff" + headHouse.code.toLowerCase().replace(/^hb/i, "");
  let username = baseAff;
  let suffix = 2;
  while (db.prepare("SELECT 1 FROM users WHERE username = ?").get(username)) {
    username = baseAff + "-" + suffix;
    suffix++;
    if (suffix > 100) break;  // safety
  }
  const password = generateTemporaryPassword();
  const user = {
    id: crypto.randomUUID(),
    username,
    password_hash: bcrypt.hashSync(password, 12),
    role: "affiliate",
    head_house_id: headHouse.id,
    created_at: nowIso(),
  };
  db.prepare(`
    INSERT INTO users (id, username, password_hash, password_encrypted, role, head_house_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(user.id, user.username, user.password_hash, encryptViewerPassword(password), user.role, user.head_house_id, user.created_at);
  logAudit(req.user.id, "create", "affiliate", user.id, { username: user.username, headHouseId: headHouse.id });
  res.status(201).json({ user: publicUser(user), username, password, loginPath: "/" });
});

// Reset affiliate password
app.post("/api/head-houses/:id/affiliate-account/reset-password", requireAuth, requireAdmin, (req, res) => {
  const headHouse = findHeadHouse(req.params.id);
  if (!headHouse) return res.status(404).json({ error: "head_house_not_found" });
  const aff = db.prepare("SELECT * FROM users WHERE role = 'affiliate' AND head_house_id = ?").get(headHouse.id);
  if (!aff) return res.status(404).json({ error: "affiliate_account_not_found" });
  const password = generateTemporaryPassword();
  db.prepare("UPDATE users SET password_hash = ?, password_encrypted = ? WHERE id = ?").run(bcrypt.hashSync(password, 12), encryptViewerPassword(password), aff.id);
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(aff.id);
  res.json({ username: aff.username, password, loginPath: "/" });
});





// ===== PATCH C: affiliate credentials view =====
app.get("/api/head-houses/:id/affiliate-credentials", requireAuth, requireAdmin, (req, res) => {
  const headHouse = findHeadHouse(req.params.id);
  if (!headHouse) return res.status(404).json({ error: "head_house_not_found" });
  const aff = db.prepare("SELECT id, username, password_encrypted, created_at FROM users WHERE role = 'affiliate' AND head_house_id = ?").get(headHouse.id);
  if (!aff) return res.status(404).json({ error: "affiliate_account_not_found" });
  const password = decryptViewerPassword(aff.password_encrypted);
  res.json({
    username: aff.username,
    password: password,
    hasStoredPassword: !!password,
    created_at: aff.created_at,
    loginPath: "/",
  });
});



// Request logging middleware (must run before listen so it sits in pipeline):
//   logs JSON one-line per request to stdout (captured by systemd journald).
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    try {
      console.log(JSON.stringify({
        ts: new Date().toISOString(),
        method: req.method,
        url: req.url,
        status: res.statusCode,
        ms: Date.now() - start,
        user: req.user?.username || "anon",
        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      }));
    } catch {
      // never let logging crash the request
    }
  });
  next();
});

app.get("/favicon.ico", (_req, res) => { res.set("Cache-Control", "public, max-age=86400"); res.sendFile(path.join(__dirname, "favicon.ico")); });
app.get("/favicon.png", (_req, res) => { res.set("Cache-Control", "public, max-age=86400"); res.sendFile(path.join(__dirname, "favicon.png")); });
app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/health", (_req, res) => res.json({ ok: true, uptime: process.uptime(), memory: process.memoryUsage().heapUsed }));
app.get("/admin", (_req, res) => res.redirect("/"));
app.get("/portal", (_req, res) => res.redirect("/"));
app.get("/app.js", (_req, res) => res.sendFile(path.join(__dirname, "app.js")));
app.get("/styles.css", (_req, res) => res.sendFile(path.join(__dirname, "styles.css")));
// ===== Customer self-service order page (linked from LINE Rich Menu) =====
app.get("/order", (_req, res) => res.sendFile(path.join(__dirname, "order.html")));
app.get("/order.html", (_req, res) => res.sendFile(path.join(__dirname, "order.html")));
app.get("/order.css", (_req, res) => res.sendFile(path.join(__dirname, "order.css")));
app.get("/order.js", (_req, res) => res.sendFile(path.join(__dirname, "order.js")));

/* === FEAT bank-logo: serve /img/* static === */
app.use("/img", express.static(path.join(__dirname, "img"), {
  maxAge: "7d",
  setHeaders: (res) => { res.setHeader("Cache-Control", "public, max-age=604800"); }
}));
app.get("/order-config.js", (_req, res) => {
  const s = loadLineSettings();
  res.type("application/javascript").send(`window.LIFF_ID = ${JSON.stringify(s.liffId || "")};`);
});

// Simple in-memory rate limiter for customer orders: max 5 / 10min per IP.
const __customerOrderHits = new Map();
function customerOrderRateLimit(req, res, next) {
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const limit = 5;
  const arr = (__customerOrderHits.get(ip) || []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    res.set("Retry-After", "600");
    return res.status(429).json({ error: "too_many_orders" });
  }
  arr.push(now);
  __customerOrderHits.set(ip, arr);
  if (__customerOrderHits.size > 5000) {
    for (const [k, v] of __customerOrderHits.entries()) {
      if (!v.length || now - v[v.length - 1] > windowMs) __customerOrderHits.delete(k);
    }
  }
  next();
}

// Lenient rate-limiter for the public open-rounds read endpoint: 60/min/IP
const __openRoundsHits = new Map();
function openRoundsRateLimit(req, res, next) {
  const ip = req.ip || String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
  const now = Date.now();
  const windowMs = 60 * 1000;
  const limit = 60;
  const arr = (__openRoundsHits.get(ip) || []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    res.set("Retry-After", "60");
    return res.status(429).json({ error: "too_many_requests" });
  }
  arr.push(now);
  __openRoundsHits.set(ip, arr);
  if (__openRoundsHits.size > 5000) {
    for (const [k, v] of __openRoundsHits.entries()) {
      if (!v.length || now - v[v.length - 1] > windowMs) __openRoundsHits.delete(k);
    }
  }
  next();
}

app.get("/api/customer/open-rounds", openRoundsRateLimit, (_req, res) => {
  ensureUpcomingRounds();
  const lotteries = db.prepare("SELECT id, name, category, display_order FROM lotteries ORDER BY category, display_order, name").all();
  const roundsRaw = db
    .prepare(`
      SELECT rounds.id, rounds.lottery_id, rounds.label, rounds.draw_date,
             rounds.draw_time, rounds.open_date, rounds.open_time,
             rounds.close_before_minutes, rounds.status,
             lotteries.name AS lottery_name
      FROM rounds
      JOIN lotteries ON lotteries.id = rounds.lottery_id
      WHERE rounds.status = 'open' AND rounds.draw_date >= date('now', '-1 day')
      ORDER BY rounds.draw_date ASC, rounds.draw_time ASC
    `)
    .all()
    .map(presentRound)
    .filter((r) => r.accepting);
  const lotteryIdsWithOpen = new Set(roundsRaw.map((r) => r.lottery_id));
  const visibleLotteries = lotteries.filter((l) => lotteryIdsWithOpen.has(l.id));
  res.json({
    lotteries: visibleLotteries,
    rounds: roundsRaw,
    betTypes: getBetTypes(),
  });
});



// ===== S0: LIFF token verification =====
/* https imported via global fetch instead */

/** Verify a LIFF access token with LINE's introspection endpoint.
 *  Returns { ok: true, userId, expiresIn } on success, { ok: false, reason } otherwise.
 *  Cached per-token for 60 seconds to avoid hammering LINE on repeat orders. */
const _liffVerifyCache = new Map();
async function verifyLineAccessToken(accessToken) {
  if (!accessToken || typeof accessToken !== "string" || accessToken.length < 10) {
    return { ok: false, reason: "no_token" };
  }
  const cached = _liffVerifyCache.get(accessToken);
  if (cached && cached.expireAt > Date.now()) {
    return { ok: true, userId: cached.userId };
  }
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 5000);
    const verifyRes = await fetch("https://api.line.me/oauth2/v2.1/verify?access_token=" + encodeURIComponent(accessToken), { signal: ac.signal });
    clearTimeout(t);
    if (!verifyRes.ok) return { ok: false, reason: "token_invalid", status: verifyRes.status };
    const j = await verifyRes.json();
    if (!j.expires_in || j.expires_in <= 0) return { ok: false, reason: "token_expired" };
    const ac2 = new AbortController();
    const t2 = setTimeout(() => ac2.abort(), 5000);
    const profRes = await fetch("https://api.line.me/v2/profile", { signal: ac2.signal, headers: { Authorization: "Bearer " + accessToken } });
    clearTimeout(t2);
    if (!profRes.ok) return { ok: false, reason: "profile_failed", status: profRes.status };
    const profile = await profRes.json();
    if (!profile.userId) return { ok: false, reason: "no_userid" };
    _liffVerifyCache.set(accessToken, { userId: profile.userId, expireAt: Date.now() + 60000 });
    return { ok: true, userId: profile.userId, displayName: profile.displayName, pictureUrl: profile.pictureUrl };
  } catch (e) {
    return { ok: false, reason: "network_error_or_timeout", detail: e.message };
  }
}
/* (legacy verify removed — using global fetch above) */


/* === FEAT phase2.5: LINE contacts APIs === */
app.get("/api/line-contacts", requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT user_id, display_name, picture_url, last_seen, first_seen, message_count,
           bound_to_type, bound_to_id, bound_at,
           (SELECT name FROM head_houses WHERE id = line_contacts.bound_to_id) AS bound_head_house_name
    FROM line_contacts
    ORDER BY last_seen DESC
    LIMIT 200
  `).all();
  res.json(rows);
});

app.post("/api/line-contacts/:userId/bind", requireAuth, requireAdmin, (req, res) => {
  const userId = req.params.userId;
  const type = req.body.type;
  const targetId = req.body.targetId;
  const contact = db.prepare("SELECT * FROM line_contacts WHERE user_id = ?").get(userId);
  if (!contact) return res.status(404).json({ error: "contact_not_found" });
  if (type === "head_house") {
    const hh = db.prepare("SELECT * FROM head_houses WHERE id = ?").get(targetId);
    if (!hh) return res.status(404).json({ error: "head_house_not_found" });
    /* update both: head_houses.line_user_id + line_contacts.bound_* */
    db.prepare("UPDATE head_houses SET line_user_id = ?, updated_at = ? WHERE id = ?").run(userId, nowIso(), targetId);
    db.prepare(`UPDATE line_contacts SET bound_to_type = 'head_house', bound_to_id = ?, bound_at = ?, bound_by = ? WHERE user_id = ?`)
      .run(targetId, nowIso(), req.user.id, userId);
    return res.json({ ok: true, head_house: hh });
  }
  if (type === "unbind") {
    /* clear binding */
    if (contact.bound_to_type === "head_house" && contact.bound_to_id) {
      db.prepare("UPDATE head_houses SET line_user_id = NULL WHERE id = ?").run(contact.bound_to_id);
    }
    db.prepare(`UPDATE line_contacts SET bound_to_type = NULL, bound_to_id = NULL, bound_at = NULL WHERE user_id = ?`).run(userId);
    return res.json({ ok: true });
  }
  return res.status(400).json({ error: "invalid_bind_type" });
});

/* Periodically clean verify cache */
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of _liffVerifyCache.entries()) {
    if (v.expireAt < now) _liffVerifyCache.delete(k);
  }
}, 300000).unref();

/** Express middleware: enforces verified LIFF token when ENFORCE_LIFF is true.
 *  Sets req.verifiedLineUserId on success. */
async function verifyLiffMiddleware(req, res, next) {
  const enforce = process.env.ENFORCE_LIFF !== "false";  // default ON in production
  const profile = req.body && req.body.lineProfile;
  const accessToken = profile && profile.accessToken;
  if (!accessToken) {
    if (enforce) return res.status(401).json({ error: "liff_token_required" });
    req.verifiedLineUserId = null;
    return next();
  }
  const v = await verifyLineAccessToken(accessToken);
  if (!v.ok) {
    if (enforce) return res.status(401).json({ error: "liff_token_invalid", reason: v.reason });
    req.verifiedLineUserId = null;
    return next();
  }
  /* CRITICAL: ignore userId from body — use verified one from LINE */
  req.verifiedLineUserId = v.userId;
  req.verifiedLineDisplayName = v.displayName || (profile && profile.displayName);
  req.verifiedLinePictureUrl = v.pictureUrl || (profile && profile.pictureUrl);
  next();
}

app.post("/api/customer/orders", customerOrderRateLimit, verifyLiffMiddleware, (req, res) => {
  const body = req.body || {};
  let custName = cleanText(body.customer?.name, 60);
  const custPhone = cleanText(body.customer?.phone, 40);
  const roundId = cleanText(body.roundId, 80);
  const note = cleanText(body.note, 240);
  const entriesIn = Array.isArray(body.entries) ? body.entries : [];

  /* FIX 2026-05-25: ถ้าลูกค้าไม่กรอกชื่อ → ใช้ LINE display name (verified จาก LIFF) */
  if (!custName || custName.length < 2) {
    const fallbackName = (req.verifiedLineDisplayName || body.lineProfile?.displayName || "").trim();
    if (fallbackName.length >= 1) {
      custName = fallbackName.slice(0, 60);
    } else {
      return res.status(400).json({ error: "invalid_customer_name" });
    }
  }
  if (!entriesIn.length) return res.status(400).json({ error: "entries_required" });
  if (entriesIn.length > 50) return res.status(400).json({ error: "too_many_entries" });

  const round = findRound(roundId);
  if (!round) return res.status(400).json({ error: "invalid_round" });
  if (!roundAcceptsEntries(round)) return res.status(400).json({ error: "round_not_accepting" });

  ensureLineHeadHouse();
  /* ONE-BILL-AT-A-TIME v2: block ทุก case — ใช้ line_user_id เป็นหลัก, fallback phone */
  {
    let existingPending = null;
    if (req.verifiedLineUserId) {
      existingPending = db.prepare(`
        SELECT t.id, t.code, t.created_at,
          COALESCE((SELECT SUM(e.amount) FROM entries e WHERE e.ticket_id = t.id), 0) AS total
        FROM tickets t JOIN customers c ON c.id = t.customer_id
        WHERE c.line_user_id = ? AND t.status = 'pending_review'
        ORDER BY t.created_at DESC LIMIT 1
      `).get(req.verifiedLineUserId);
    }
    /* fallback: phone (ถ้าไม่มี LIFF token verify) */
    if (!existingPending && custPhone) {
      existingPending = db.prepare(`
        SELECT t.id, t.code, t.created_at,
          COALESCE((SELECT SUM(e.amount) FROM entries e WHERE e.ticket_id = t.id), 0) AS total
        FROM tickets t JOIN customers c ON c.id = t.customer_id
        WHERE c.phone = ? AND t.status = 'pending_review'
        ORDER BY t.created_at DESC LIMIT 1
      `).get(custPhone);
    }
    if (existingPending) {
      return res.status(409).json({
        error: "pending_bill_exists",
        pendingCode: existingPending.code,
        pendingTotal: existingPending.total,
        pendingCreatedAt: existingPending.created_at
      });
    }
  }
  // Referral: if customer is new (no LINE match) and ref code matches a head_house, assign to that head_house
  const referralCode = cleanText(body.referralCode, 40);
  let referralHeadHouseId = null;
  if (referralCode) {
    const refHh = db.prepare("SELECT id FROM head_houses WHERE code = ? AND id != 'line_self'").get(referralCode);
    if (refHh) referralHeadHouseId = refHh.id;
  }
  // LINE profile from LIFF (optional)
  /* S0: use VERIFIED userId from LIFF token, fall back to body only when ENFORCE_LIFF=false */
  const lineProfile = body.lineProfile && typeof body.lineProfile === "object" ? {
    userId: req.verifiedLineUserId || cleanText(body.lineProfile.userId, 100),
    displayName: cleanText(req.verifiedLineDisplayName || body.lineProfile.displayName, 100),
    pictureUrl: (function(u) {
      var s = cleanText(u, 500);
      return /^https:\/\/(profile|obs)\.line-scdn\.net\//.test(s) ? s : "";
    })(body.lineProfile.pictureUrl),
  } : null;
  const customer = findOrCreateLineCustomer(custName, custPhone, lineProfile, referralHeadHouseId);

  const normalized = [];
  for (const item of entriesIn) {
    const bt = findBetType(item.betTypeId);
    if (!bt) return res.status(400).json({ error: "invalid_bet_type" });
    const rawDigits = String(item.number || "").replace(/\D/g, "");
    if (rawDigits.length !== bt.digits) {
      return res.status(400).json({ error: "invalid_number_length", expected: bt.digits });
    }
    const payload = normalizeEntryPayload({
      customerId: customer.id,
      roundId,
      betTypeId: item.betTypeId,
      number: rawDigits,
      amount: item.amount,
      note: "",
      sourceText: "",
    });
    if (!payload.ok) return res.status(400).json({ error: payload.error });
    normalized.push(payload.value);
  }

  const batchLimitError = validateBatchLimitCapacity(normalized);
  if (batchLimitError) {
    // Enrich with bet-type name + number for friendly messages
    var enriched = { ...batchLimitError };
    if (batchLimitError.limit) {
      var bt = findBetType(batchLimitError.limit.bet_type_id);
      enriched.betTypeName = bt ? bt.name : batchLimitError.limit.bet_type_id;
      enriched.number = batchLimitError.limit.number;
      enriched.maxAmount = batchLimitError.limit.max_amount;
      enriched.remaining = Math.max(0, (Number(batchLimitError.limit.max_amount) || 0) - (Number(batchLimitError.currentAmount) || 0));
    }
    return res.status(409).json(enriched);
  }

  const sourceText = `customer-line: ${custName}${custPhone ? " (" + custPhone + ")" : ""}`;

  const created = withTransaction(() => {
    /* S0 TOCTOU FIX: re-validate inside transaction — SQLite serializes writes */
    const limitErrorInTx = validateBatchLimitCapacity(normalized);
    if (limitErrorInTx) throw Object.assign(new Error("limit_capacity"), { __limitError: limitErrorInTx });
    const ticket = createTicket(
      {
        customer_id: customer.id,
        head_house_id: customer.head_house_id,
        round_id: roundId,
        source_channel: "line_self",
        source_text: sourceText,
        note,
      },
      null,
    );
    const inserted = normalized.map((entry) => insertEntry(entry, null, ticket.id));
    return { ticket, inserted };
  });

  logAudit(null, "create", "ticket", created.ticket.id, { ...created.ticket, via: "line_self" });
  res.status(201).json({
    ticket: { id: created.ticket.id, code: created.ticket.code, status: created.ticket.status },
    entryCount: created.inserted.length,
  });

  /* PUSH-BANK-FIX: หลัง LIFF สร้างบิล → push เลขบัญชี+ยอดไป LINE userId เลย
     กันกรณี LIFF crash/ปิด → ลูกค้ารู้เลขบัญชีและเลขบิลที่ต้องโอน */
  (async () => {
    try {
      const lineUserId = req.verifiedLineUserId;
      if (!lineUserId) return;
      const totalAmount = created.inserted.reduce((s, e) => s + Number(e.amount || 0), 0);
      const acc = db.prepare(`SELECT bank_name, account_holder, account_number FROM bank_accounts WHERE status='active' AND COALESCE(total_received_today,0) < COALESCE(daily_limit,999999999) ORDER BY priority ASC LIMIT 1`).get();
      const accLine = acc
        ? `\n\n🏦 ${acc.bank_name}\n👤 ${acc.account_holder}\n💳 ${acc.account_number}`
        : "\n\n(แอดมินจะส่งเลขบัญชีให้ในแชทเร็ว ๆ นี้นะคะ)";
      await linePush(lineUserId,
        `✓ รับบิล ${created.ticket.code} เรียบร้อยค่ะ\n` +
        `ยอดรวม ${totalAmount.toLocaleString("th-TH")} บาท${accLine}\n\n` +
        `กรุณาโอนเงินและส่งภาพสลิปกลับมาที่แชทนี้นะคะ\n` +
        `(บิลจะถูกยกเลิกอัตโนมัติเมื่อครบ 10 นาที)`);
    } catch (e) { console.warn("[liff-order-push]", e.message); }
  })();
});


/* G1+G2: หัวบ้านส่งสลิป — admin review + update bank total */
app.get("/api/admin/hh-slips", requireAuth, requireAdmin, (req, res) => {
  const status = String(req.query.status || "pending");
  const rows = db.prepare(`
    SELECT hs.*, h.name AS head_house_name, h.code AS head_house_code
    FROM head_house_slip_ledger hs
    LEFT JOIN head_houses h ON h.id = hs.head_house_id
    WHERE hs.status = ?
    ORDER BY hs.created_at DESC LIMIT 200
  `).all(status);
  /* parse slip_raw_json sample fields for display */
  const enriched = rows.map(r => {
    let sender = null, receiver_account = null, transDate = null;
    try {
      const raw = JSON.parse(r.slip_raw_json || "{}");
      const d = raw.data || raw.result || raw;
      sender = d.sender?.account?.name?.th || d.sender?.name || d.payerName || null;
      receiver_account = (d.receiver?.account?.value || d.receiver?.account || d.receiverAccount || "").toString();
      transDate = d.transDate || d.transactionDate || d.dateTime || null;
    } catch (e) {}
    return { ...r, sender_name: sender, receiver_account, trans_date: transDate };
  });
  res.json({ rows: enriched });
});

app.post("/api/admin/hh-slips/:id/approve", requireAuth, requireAdmin, (req, res) => {
  const id = req.params.id;
  const note = String(req.body?.note || "").slice(0, 240);
  const hs = db.prepare("SELECT * FROM head_house_slip_ledger WHERE id = ?").get(id);
  if (!hs) return res.status(404).json({ error: "not_found" });
  if (hs.status !== "pending") return res.status(400).json({ error: "not_pending", status: hs.status });
  const now = nowIso();
  /* parse slip raw → receiver account + amount */
  let receiverNorm = null, amount = Number(hs.amount) || 0;
  try {
    const raw = JSON.parse(hs.slip_raw_json || "{}");
    const d = raw.data || raw.result || raw;
    const ra = (d.receiver?.account?.value || d.receiver?.account || d.receiverAccount || "").toString();
    receiverNorm = ra.replace(/[^0-9]/g, "");
    if (!amount) amount = Number(d.amount?.amount || d.amount || d.transAmount || 0);
  } catch (e) {}
  /* B2-B3 FIX: bankUpdated ออกนอก closure + r.changes guard + atomic */
  let bankUpdated = false;
  let approved = false;
  withTransaction(() => {
    const r0 = db.prepare("UPDATE head_house_slip_ledger SET status='matched', reviewed_by=?, reviewed_at=?, note=? WHERE id=? AND status='pending'")
      .run(req.user.id, now, note, id);
    if (r0.changes === 0) return; /* race: ถูก approve ไปแล้วโดยอีก admin — skip bank update */
    approved = true;
    if (receiverNorm && amount > 0) {
      const accounts = db.prepare("SELECT id, account_number FROM bank_accounts").all();
      const targetAcc = accounts.find(a => normalizeAccountNumber(a.account_number) === receiverNorm);
      if (targetAcc) {
        const r = db.prepare(`
          UPDATE bank_accounts
          SET total_received_today = total_received_today + ?,
              status = CASE WHEN status = 'active' AND total_received_today + ? >= daily_limit THEN 'cooling' ELSE status END,
              updated_at = ?
          WHERE id = ?
        `).run(roundMoney(amount), roundMoney(amount), now, targetAcc.id);
        bankUpdated = r.changes > 0;
      }
    }
  });
  if (!approved) return res.status(409).json({ error: "already_processed_by_other_admin" });
  logAudit(req.user.id, "hh_slip_approve", "head_house_slip_ledger", id, { head_house_id: hs.head_house_id, amount, receiverNorm, note });
  res.json({ ok: true, id, amount, bank_updated: bankUpdated });
});

app.post("/api/admin/hh-slips/:id/reject", requireAuth, requireAdmin, (req, res) => {
  const id = req.params.id;
  const note = String(req.body?.note || "").slice(0, 240) || "rejected by admin";
  const hs = db.prepare("SELECT * FROM head_house_slip_ledger WHERE id = ?").get(id);
  if (!hs) return res.status(404).json({ error: "not_found" });
  if (hs.status !== "pending") return res.status(400).json({ error: "not_pending", status: hs.status });
  db.prepare("UPDATE head_house_slip_ledger SET status='rejected', reviewed_by=?, reviewed_at=?, note=? WHERE id=? AND status='pending'")
    .run(req.user.id, nowIso(), note, id);
  logAudit(req.user.id, "hh_slip_reject", "head_house_slip_ledger", id, { head_house_id: hs.head_house_id, note });
  res.json({ ok: true, id });
});


/* F1: PROMOTION CODES — table + apply logic + admin endpoints */
db.exec(`CREATE TABLE IF NOT EXISTS promotion_codes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  type TEXT NOT NULL CHECK(type IN ('percent','fixed','bonus_credit')),
  value REAL NOT NULL,
  min_amount REAL DEFAULT 0,
  max_uses INTEGER DEFAULT 0,
  used_count INTEGER NOT NULL DEFAULT 0,
  valid_from TEXT,
  valid_to TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`);
db.exec(`CREATE TABLE IF NOT EXISTS promotion_uses (
  id TEXT PRIMARY KEY,
  promotion_id TEXT NOT NULL,
  ticket_id TEXT,
  customer_id TEXT,
  discount_applied REAL NOT NULL,
  created_at TEXT NOT NULL
)`);
try { db.exec("CREATE INDEX IF NOT EXISTS idx_promo_code ON promotion_codes(code)"); } catch(e){}
try { db.exec("CREATE INDEX IF NOT EXISTS idx_promo_uses_promo ON promotion_uses(promotion_id)"); } catch(e){}
try { db.exec("CREATE INDEX IF NOT EXISTS idx_promo_uses_ticket ON promotion_uses(ticket_id)"); } catch(e){}

/* helper: validate + คำนวณ discount */
function validatePromotionCode(code, baseAmount) {
  if (!code) return { ok: false, error: "empty" };
  const p = db.prepare("SELECT * FROM promotion_codes WHERE code = ? AND enabled = 1").get(String(code).trim().toUpperCase());
  if (!p) return { ok: false, error: "not_found" };
  const now = new Date().toISOString();
  if (p.valid_from && now < p.valid_from) return { ok: false, error: "not_started" };
  if (p.valid_to && now > p.valid_to) return { ok: false, error: "expired" };
  if (p.max_uses > 0 && p.used_count >= p.max_uses) return { ok: false, error: "exhausted" };
  if (baseAmount < (p.min_amount || 0)) return { ok: false, error: "below_min", min: p.min_amount };
  let discount = 0;
  if (p.type === "percent") discount = baseAmount * (p.value / 100);
  else if (p.type === "fixed") discount = Math.min(p.value, baseAmount);
  else if (p.type === "bonus_credit") discount = p.value; /* เครดิตเพิ่ม — ไม่ใช่หัก แต่ track ไว้ */
  return { ok: true, promotion: p, discount: Math.round(discount * 100) / 100 };
}

/* admin endpoints */
app.get("/api/admin/promotions", requireAuth, requireAdmin, (_req, res) => {
  const rows = db.prepare("SELECT * FROM promotion_codes ORDER BY created_at DESC LIMIT 200").all();
  res.json({ rows });
});
app.post("/api/admin/promotions", requireAuth, requireAdmin, (req, res) => {
  const b = req.body || {};
  const code = String(b.code || "").trim().toUpperCase();
  if (!code || !/^[A-Z0-9_-]{3,30}$/.test(code)) return res.status(400).json({ error: "invalid_code" });
  if (!["percent","fixed","bonus_credit"].includes(b.type)) return res.status(400).json({ error: "invalid_type" });
  const value = Number(b.value); if (!isFinite(value) || value <= 0) return res.status(400).json({ error: "invalid_value" });
  const id = crypto.randomUUID();
  const now = nowIso();
  try {
    db.prepare(`INSERT INTO promotion_codes
      (id, code, description, type, value, min_amount, max_uses, valid_from, valid_to, enabled, created_by, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,1,?,?,?)`)
      .run(id, code, String(b.description||"").slice(0,240), b.type, value,
           Number(b.min_amount)||0, Number(b.max_uses)||0,
           b.valid_from || null, b.valid_to || null,
           req.user.id, now, now);
    logAudit(req.user.id, "promo_create", "promotion_codes", id, { code, type: b.type, value });
    res.json({ ok: true, id });
  } catch (e) {
    if (String(e.message).includes("UNIQUE")) return res.status(409).json({ error: "code_exists" });
    res.status(500).json({ error: e.message });
  }
});
app.delete("/api/admin/promotions/:id", requireAuth, requireAdmin, (req, res) => {
  const r = db.prepare("UPDATE promotion_codes SET enabled = 0, updated_at = ? WHERE id = ?").run(nowIso(), req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: "not_found" });
  logAudit(req.user.id, "promo_disable", "promotion_codes", req.params.id, {});
  res.json({ ok: true });
});
app.get("/api/customer/promotions/validate", verifyLiffMiddleware, (req, res) => {
  const code = String(req.query.code || "");
  const baseAmount = Number(req.query.base_amount) || 0;
  res.json(validatePromotionCode(code, baseAmount));
});


/* F2: STATS DASHBOARD — กำไร/ขาดทุน + top เลข + top ลูกค้า */
app.get("/api/admin/stats/profit-loss", requireAuth, requireNonAffiliate, (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days)||30, 1), 365);
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();
  const rows = db.prepare(`
    SELECT r.id, r.label, l.name AS lottery_name, r.draw_date, r.draw_time,
      (SELECT COALESCE(SUM(e.amount),0) FROM entries e JOIN tickets t ON t.id=e.ticket_id
        WHERE e.round_id = r.id AND t.status='approved') AS total_stake,
      (SELECT COALESCE(SUM(amount),0) FROM entries WHERE round_id = r.id) AS gross_stake
    FROM rounds r JOIN lotteries l ON l.id = r.lottery_id
    WHERE r.draw_date >= date(?) AND r.result_status='finalized'
    ORDER BY r.draw_date DESC, r.draw_time DESC LIMIT 100
  `).all(cutoff);
  /* คำนวณ payout per round ผ่าน buildSettlement */
  const enriched = rows.map(r => {
    try {
      const s = buildSettlement(r.id);
      return { ...r, total_payout: s.totalPayout, profit: s.profit, winner_count: s.winnerCount };
    } catch (e) { return { ...r, total_payout: 0, profit: r.total_stake, winner_count: 0, error: e.message }; }
  });
  const summary = {
    total_rounds: enriched.length,
    total_stake: enriched.reduce((s, x) => s + (x.total_stake || 0), 0),
    total_payout: enriched.reduce((s, x) => s + (x.total_payout || 0), 0),
    total_profit: enriched.reduce((s, x) => s + (x.profit || 0), 0),
  };
  res.json({ summary, rounds: enriched });
});

app.get("/api/admin/stats/top-numbers", requireAuth, requireNonAffiliate, (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days)||30, 1), 365);
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();
  const rows = db.prepare(`
    SELECT e.number, e.bet_type_id, bt.name AS bet_type_name,
      COUNT(*) AS uses, SUM(e.amount) AS total_amount
    FROM entries e
    JOIN tickets t ON t.id = e.ticket_id
    JOIN bet_types bt ON bt.id = e.bet_type_id
    WHERE t.status = 'approved' AND e.created_at >= ?
    GROUP BY e.number, e.bet_type_id
    ORDER BY total_amount DESC LIMIT 50
  `).all(cutoff);
  res.json({ rows, days });
});

app.get("/api/admin/stats/top-customers", requireAuth, requireNonAffiliate, (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days)||30, 1), 365);
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();
  const rows = db.prepare(`
    SELECT c.id, c.code, c.name, c.phone,
      COUNT(DISTINCT t.id) AS bills,
      COALESCE(SUM((SELECT SUM(amount) FROM entries WHERE ticket_id = t.id)),0) AS total_stake
    FROM customers c
    JOIN tickets t ON t.customer_id = c.id
    WHERE t.status = 'approved' AND t.created_at >= ?
    GROUP BY c.id
    ORDER BY total_stake DESC LIMIT 50
  `).all(cutoff);
  res.json({ rows, days });
});


/* F3: AFFILIATE — summary + history */
app.get("/api/admin/affiliate/summary-all", requireAuth, requireAdmin, (_req, res) => {
  /* รวมยอด commission ของแต่ละหัวบ้าน */
  const rows = db.prepare(`
    SELECT h.id AS head_house_id, h.code, h.name,
      (SELECT COUNT(*) FROM customers WHERE head_house_id = h.id) AS customer_count,
      (SELECT COUNT(*) FROM tickets t JOIN customers c ON c.id = t.customer_id
        WHERE c.head_house_id = h.id AND t.status = 'approved') AS approved_bills,
      (SELECT COALESCE(SUM(e.amount),0) FROM entries e
        JOIN tickets t ON t.id = e.ticket_id
        JOIN customers c ON c.id = e.customer_id
        WHERE c.head_house_id = h.id AND t.status = 'approved') AS total_stake,
      (SELECT COALESCE(SUM(amount),0) FROM affiliate_payouts WHERE head_house_id = h.id) AS total_paid
    FROM head_houses h
    WHERE h.id != 'line_self'
    ORDER BY total_stake DESC
  `).all();
  res.json({ rows });
});

app.get("/api/admin/affiliate/payouts-recent", requireAuth, requireAdmin, (_req, res) => {
  const rows = db.prepare(`
    SELECT ap.id, ap.head_house_id, h.code AS head_house_code, h.name AS head_house_name,
      ap.amount, ap.note, ap.created_at, u.username AS paid_by_username
    FROM affiliate_payouts ap
    JOIN head_houses h ON h.id = ap.head_house_id
    LEFT JOIN users u ON u.id = ap.paid_by
    ORDER BY ap.created_at DESC LIMIT 100
  `).all();
  res.json({ rows });
});


/* F4: PROMPTPAY — generate QR per ticket */
app.get("/api/customer/tickets/:id/qr", verifyLiffMiddleware, async (req, res) => {
  const id = req.params.id;
  const t = db.prepare("SELECT t.id, t.code, t.total_amount, t.customer_id, c.line_user_id FROM tickets t JOIN customers c ON c.id = t.customer_id WHERE t.id = ?").get(id);
  if (!t) return res.status(404).json({ error: "ticket_not_found" });
  /* security: ลูกค้าดู QR ของตัวเองเท่านั้น */
  if (req.verifiedLineUserId && t.line_user_id && req.verifiedLineUserId !== t.line_user_id) {
    return res.status(403).json({ error: "forbidden" });
  }
  /* หา bank ที่มี promptpay_id */
  const bank = db.prepare(`SELECT * FROM bank_accounts WHERE status='active' AND promptpay_id IS NOT NULL AND promptpay_id != '' ORDER BY priority ASC LIMIT 1`).get();
  if (!bank) return res.status(503).json({ error: "no_promptpay_bank", message: "ยังไม่มีบัญชี PromptPay" });
  try {
    const qrDataUrl = await generatePromptPayQRDataURL(bank.promptpay_id, Number(t.total_amount));
    res.json({
      ticket_code: t.code,
      amount: t.total_amount,
      bank: { name: bank.bank_name, account_name: bank.account_holder || bank.account_name, promptpay_id: bank.promptpay_id },
      qr: qrDataUrl
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* F4: admin จัดการ promptpay_id ของบัญชี */
app.post("/api/admin/bank-accounts/:id/promptpay", requireAuth, requireAdmin, (req, res) => {
  const id = req.params.id;
  const ppid = String(req.body?.promptpay_id || "").replace(/[^0-9]/g, "");
  if (ppid && ppid.length !== 10 && ppid.length !== 13) return res.status(400).json({ error: "invalid_promptpay_id" });
  const r = db.prepare("UPDATE bank_accounts SET promptpay_id = ?, updated_at = ? WHERE id = ?").run(ppid || null, nowIso(), id);
  if (r.changes === 0) return res.status(404).json({ error: "not_found" });
  logAudit(req.user.id, "set_promptpay", "bank_account", id, { ppid });
  res.json({ ok: true });
});

function ensureLineHeadHouse() {
  const existing = db.prepare("SELECT id FROM head_houses WHERE id = 'line_self'").get();
  if (existing) return;
  const now = nowIso();
  db.prepare(`
    INSERT INTO head_houses (id, code, name, note, commission_percent, created_at, updated_at)
    VALUES ('line_self', 'LINE', 'ลูกค้าออนไลน์ (LINE)', 'หัวบ้านอัตโนมัติสำหรับลูกค้าที่สั่งผ่านหน้าเว็บ', 0, ?, ?)
  `).run(now, now);
}

function findOrCreateLineCustomer(name, phone, lineProfile, referralHeadHouseId) {
  /* FIX: ถ้าลูกค้าไม่ได้กรอกชื่อ → ใช้ชื่อจาก LINE Profile แทน */
  if (!name || !String(name).trim()) {
    name = (lineProfile && lineProfile.displayName) ? String(lineProfile.displayName).trim() : "ลูกค้า LINE";
  }
  // Priority 1: lookup by LINE userId (most reliable — unique per LINE account)
  if (lineProfile && lineProfile.userId) {
    const byLine = db.prepare(`
      SELECT * FROM customers
      WHERE line_user_id = ?
      LIMIT 1
    `).get(lineProfile.userId);
    if (byLine) {
      // Update display name + picture + phone if changed (phone goes to its own column)
      const newDisp = lineProfile.displayName || byLine.line_display_name;
      const newPic = lineProfile.pictureUrl || byLine.line_picture_url;
      const cleanName = (name || newDisp || byLine.name || "").replace(/\s*·\s*\d[\d\s-]*$/g, "").trim();
      const newName = cleanName || byLine.name;
      const newPhone = phone || byLine.phone || "";
      if (newDisp !== byLine.line_display_name || newPic !== byLine.line_picture_url || newName !== byLine.name || newPhone !== (byLine.phone || "")) {
        db.prepare(`UPDATE customers SET line_display_name = ?, line_picture_url = ?, name = ?, phone = ?, updated_at = ? WHERE id = ?`)
          .run(newDisp, newPic, newName, newPhone, nowIso(), byLine.id);
      }
      return db.prepare("SELECT * FROM customers WHERE id = ?").get(byLine.id);
    }
  }
  // Priority 2: fallback to name+phone match (legacy, no LIFF)
  /* FIX: name is just the name; phone is its own column */
  const cleanedName = (name || "").trim();
  if (!lineProfile || !lineProfile.userId) {
    const byName = db.prepare(`
      SELECT * FROM customers
      WHERE head_house_id = 'line_self' AND name = ? AND COALESCE(phone, '') = COALESCE(?, '')
      ORDER BY created_at DESC
      LIMIT 1
    `).get(cleanedName, phone || "");
    if (byName) return byName;
  }

  return withTransaction(() => {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const now = nowIso();
        const code = nextSequentialCode("customers", "LINE", 4);
        const id = createSlugId("customer", code);
        const targetHh = referralHeadHouseId || "line_self";
        db.prepare(`
          INSERT INTO customers (id, code, name, phone, head_house_id, line_user_id, line_display_name, line_picture_url, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          id, code, cleanedName, phone || null, targetHh,
          (lineProfile && lineProfile.userId) || null,
          (lineProfile && lineProfile.displayName) || null,
          (lineProfile && lineProfile.pictureUrl) || null,
          now, now,
        );
        return db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
      } catch (err) {
        if (String(err.message || "").includes("UNIQUE")) continue;
        throw err;
      }
    }
    throw new Error("customer_code_collision_after_retries");
  });
}



app.get("/api/bootstrap", (_req, res) => {
  res.json({ setupRequired: countRows("users") === 0 });
});

app.get("/api/public-state", (_req, res) => {
  ensureUpcomingRounds();
  const state = getFullState(null);
  res.json({
    lotteries: state.lotteries,
    rounds: state.rounds,
    results: state.results,
    scheduleTemplates: state.scheduleTemplates,
  });
});

app.get("/api/result-sources", requireAuth, requireStaff, requireNonAffiliate, (_req, res) => {
  res.json(getResultSources());
});

app.post("/api/setup", (req, res) => {
  if (countRows("users") > 0) {
    return res.status(409).json({ error: "setup_already_completed" });
  }

  const username = cleanText(req.body.username, 40);
  const password = String(req.body.password || "");

  if (!username || password.length < 8) {
    return res.status(400).json({ error: "invalid_setup_payload" });
  }

  const now = nowIso();
  const user = {
    id: crypto.randomUUID(),
    username,
    password_hash: bcrypt.hashSync(password, 12),
    role: "admin",
    created_at: now,
  };

  db.prepare(`
    INSERT INTO users (id, username, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(user.id, user.username, user.password_hash, user.role, user.created_at);

  const session = createSession(user.id);
  setSessionCookie(res, session.token, session.expiresAt);
  logAudit(user.id, "create", "user", user.id, { username: user.username, role: user.role });
  res.status(201).json({ user: publicUser(user) });
});



// ===== S0: CSRF protection =====
const _csrfTokens = new Map();  // sessionTokenHash -> { token, expireAt }
function generateCsrfToken() { return crypto.randomBytes(24).toString("hex"); }
function csrfFor(sessionHash) {
  const existing = _csrfTokens.get(sessionHash);
  if (existing && existing.expireAt > Date.now()) return existing.token;
  const token = generateCsrfToken();
  _csrfTokens.set(sessionHash, { token, expireAt: Date.now() + 7 * 86400 * 1000 });
  return token;
}
function csrfCleanInterval() {
  const now = Date.now();
  for (const [k, v] of _csrfTokens.entries()) if (v.expireAt < now) _csrfTokens.delete(k);
}
setInterval(csrfCleanInterval, 60 * 60 * 1000).unref();

/** Returns CSRF token for the authenticated session */
app.get("/api/csrf", requireAuth, (req, res) => {
  const cookie = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  const hash = cookie ? hashToken(cookie) : "";
  if (!hash) return res.status(401).json({ error: "no_session" });
  res.json({ csrfToken: csrfFor(hash) });
});

/** Middleware: enforce X-CSRF-Token on state-changing admin requests */
function requireCsrf(req, res, next) {
  /* Skip safe methods */
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  /* Skip public + customer endpoints (no session) */
  const url = req.path || req.url || "";
  const skip = [
    "/api/login", "/api/logout", "/api/customer/", "/api/public/", "/api/csrf", "/api/line/"
  ].some((p) => url.startsWith(p));
  if (skip) return next();
  /* Require valid token matching session */
  const cookie = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  const hash = cookie ? hashToken(cookie) : "";
  const got = req.headers["x-csrf-token"];
  const expected = hash ? _csrfTokens.get(hash) : null;
  if (!got || !expected || got !== expected.token) {
    return res.status(403).json({ error: "csrf_invalid" });
  }
  next();
}

/* Install CSRF middleware globally — must run after body parser, before routes.
   We use app.use here AFTER routes already defined; Express picks up middlewares
   in registration order. Re-attaching as a wrapper instead: */
app.use((req, res, next) => requireCsrf(req, res, next));

console.log("[s0] CSRF middleware installed");



// ===== S0: login rate limit =====
const _loginAttempts = new Map();  // ip -> { count, lockedUntil, resetAt }
const LOGIN_MAX = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
function loginRateLimit(req, res, next) {
  const ip = (req.ip || req.connection?.remoteAddress || "unknown").toString();
  const now = Date.now();
  let rec = _loginAttempts.get(ip);
  if (rec && rec.lockedUntil > now) {
    const seconds = Math.ceil((rec.lockedUntil - now) / 1000);
    return res.status(429).json({ error: "too_many_attempts", retryAfterSeconds: seconds });
  }
  if (rec && rec.resetAt < now) { _loginAttempts.delete(ip); rec = null; }
  req._loginRateRec = rec;
  req._loginIp = ip;
  next();
}
function loginRateRecordFail(req) {
  const ip = req._loginIp;
  if (!ip) return;
  const now = Date.now();
  let rec = _loginAttempts.get(ip) || { count: 0, lockedUntil: 0, resetAt: now + LOGIN_WINDOW_MS };
  rec.count += 1;
  if (rec.count >= LOGIN_MAX) {
    rec.lockedUntil = now + LOGIN_WINDOW_MS;
  }
  _loginAttempts.set(ip, rec);
}
function loginRateRecordSuccess(req) { if (req._loginIp) _loginAttempts.delete(req._loginIp); }
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of _loginAttempts.entries()) if (v.resetAt < now && v.lockedUntil < now) _loginAttempts.delete(k);
}, 5 * 60 * 1000).unref();

app.post("/api/login", loginRateLimit, (req, res) => {
  const username = cleanText(req.body.username, 40);
  const password = String(req.body.password || "");
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

  /* S2-M1+A3: always run bcrypt to equalize timing — prevents username enumeration */
  const DUMMY_HASH = '$2b$12$pDlrMxaCKHpC6Cg/k3ZSU.JdKmt6Vc7vILKXa6l99hUksOmrT59hm';
  const hashToCheck = user ? user.password_hash : DUMMY_HASH;
  const ok = bcrypt.compareSync(password, hashToCheck);
  if (!user || !ok) {
    loginRateRecordFail(req);
    return res.status(401).json({ error: "invalid_credentials" });
  }

  loginRateRecordSuccess(req);
  const session = createSession(user.id);
  setSessionCookie(res, session.token, session.expiresAt);
  logAudit(user.id, "login", "session", session.tokenHash, {});
  res.json({ user: publicUser(user) });
});

app.post("/api/logout", (req, res) => {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  const tokenHash = token ? hashToken(token) : "";
  const session = tokenHash ? db.prepare("SELECT user_id FROM sessions WHERE token_hash = ?").get(tokenHash) : null;
  if (tokenHash) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
  }
  clearSessionCookie(res);
  if (session) logAudit(session.user_id, "logout", "session", tokenHash, {});
  res.status(204).end();
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.get("/api/state", requireAuth, (req, res) => {
  ensureUpcomingRounds();
  res.json(getFullState(req.user));
});

app.post("/api/users", requireAuth, requireAdmin, (req, res) => {
  const username = cleanText(req.body.username, 40);
  const password = String(req.body.password || "");
  const role = normalizeUserRole(req.body.role);
  if (!role) return res.status(400).json({ error: "invalid_user_role" });
  const headHouseId = role === "head_house_viewer" ? cleanText(req.body.headHouseId, 80) : null;

  if (!username || password.length < 8 || (role === "head_house_viewer" && !findHeadHouse(headHouseId))) {
    return res.status(400).json({ error: "invalid_user_payload" });
  }

  if (role === "head_house_viewer" && findViewerForHeadHouse(headHouseId)) {
    return res.status(409).json({ error: "viewer_account_exists" });
  }

  const user = {
    id: crypto.randomUUID(),
    username,
    password_hash: bcrypt.hashSync(password, 12),
    role,
    head_house_id: headHouseId,
    created_at: nowIso(),
  };

  try {
    db.prepare(`
      INSERT INTO users (id, username, password_hash, role, head_house_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(user.id, user.username, user.password_hash, user.role, user.head_house_id, user.created_at);
  } catch {
    return res.status(409).json({ error: "username_exists" });
  }

  logAudit(req.user.id, "create", "user", user.id, { username: user.username, role: user.role });
  res.status(201).json(publicUser(user));
});

app.put("/api/users/:id", requireAuth, requireAdmin, (req, res) => {
  const existing = findUser(req.params.id);
  if (!existing) return res.status(404).json({ error: "user_not_found" });

  const username = cleanText(req.body.username, 40);
  const password = String(req.body.password || "");
  const role = normalizeUserRole(req.body.role);
  if (!role) return res.status(400).json({ error: "invalid_user_role" });
  const headHouseId = role === "head_house_viewer" ? cleanText(req.body.headHouseId, 80) : null;

  if (!username || (password && password.length < 8) || (role === "head_house_viewer" && !findHeadHouse(headHouseId))) {
    return res.status(400).json({ error: "invalid_user_payload" });
  }

  if (role === "head_house_viewer") {
    const existingViewer = findViewerForHeadHouse(headHouseId);
    if (existingViewer && existingViewer.id !== existing.id) {
      return res.status(409).json({ error: "viewer_account_exists" });
    }
  }

  if (existing.role === "admin" && role !== "admin" && countAdmins() <= 1) {
    return res.status(409).json({ error: "last_admin_required" });
  }

  if (existing.id === req.user.id && role !== "admin") {
    return res.status(409).json({ error: "self_role_change_blocked" });
  }

  try {
    db.prepare(`
      UPDATE users
      SET username = ?, role = ?, head_house_id = ?
      WHERE id = ?
    `).run(username, role, headHouseId, existing.id);
  } catch {
    return res.status(409).json({ error: "username_exists" });
  }

  if (password) {
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(bcrypt.hashSync(password, 12), existing.id);
    if (existing.id === req.user.id) {
      db.prepare("DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?").run(existing.id, req.session.tokenHash);
    } else {
      db.prepare("DELETE FROM sessions WHERE user_id = ?").run(existing.id);
    }
  }

  const updated = findUser(existing.id);
  logAudit(req.user.id, "update", "user", updated.id, {
    username: updated.username,
    role: updated.role,
    headHouseId: updated.head_house_id,
    passwordChanged: Boolean(password),
  });
  res.json(publicUser(updated));
});

app.delete("/api/users/:id", requireAuth, requireAdmin, (req, res) => {
  const existing = findUser(req.params.id);
  if (!existing) return res.status(404).json({ error: "user_not_found" });
  if (existing.id === req.user.id) return res.status(409).json({ error: "self_delete_blocked" });
  if (existing.role === "admin" && countAdmins() <= 1) {
    return res.status(409).json({ error: "last_admin_required" });
  }

  db.prepare("DELETE FROM users WHERE id = ?").run(existing.id);
  logAudit(req.user.id, "delete", "user", existing.id, {
    username: existing.username,
    role: existing.role,
  });
  res.status(204).end();
});

app.post("/api/head-houses", requireAuth, requireAdmin, (req, res) => {
  const name = cleanText(req.body.name, 80);
  const note = cleanText(req.body.note, 160);
  const commissionPercent = Number(req.body.commissionPercent || 0);
  const type = cleanText(req.body.type, 40) === "affiliate" ? "affiliate" : "head_house";

  if (!name || !Number.isFinite(commissionPercent) || commissionPercent < 0 || commissionPercent > 100) {
    return res.status(400).json({ error: "invalid_head_house_payload" });
  }

  const now = nowIso();
  const code = nextSequentialCode("head_houses", "HB", 3);
  const headHouse = {
    id: createSlugId("head-house", code),
    code,
    name,
    note,
    commission_percent: commissionPercent,
    created_at: now,
    updated_at: now,
  };

  try {
    db.prepare(`
      INSERT INTO head_houses (id, code, name, note, commission_percent, type, line_user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      headHouse.id,
      headHouse.code,
      headHouse.name,
      headHouse.note,
      headHouse.commission_percent,
      type,
      (req.body.lineUserId || "").trim() || null,
      headHouse.created_at,
      headHouse.updated_at,
    );
  } catch {
    return res.status(409).json({ error: "head_house_code_exists" });
  }

  logAudit(req.user.id, "create", "head_house", headHouse.id, headHouse);
  res.status(201).json(headHouse);
});

app.put("/api/head-houses/:id", requireAuth, requireAdmin, (req, res) => {
  const headHouse = findHeadHouse(req.params.id);
  if (!headHouse) return res.status(404).json({ error: "head_house_not_found" });

  const name = cleanText(req.body.name, 80);
  const note = cleanText(req.body.note, 160);
  const commissionPercent = Number(req.body.commissionPercent);
  const type = cleanText(req.body.type, 40) === "affiliate" ? "affiliate" : "head_house";
  if (!name || !Number.isFinite(commissionPercent) || commissionPercent < 0 || commissionPercent > 100) {
    return res.status(400).json({ error: "invalid_head_house_payload" });
  }

  db.prepare(`
    UPDATE head_houses
    SET name = ?, note = ?, commission_percent = ?, type = ?, updated_at = ?
    WHERE id = ?
  `).run(name, note, commissionPercent, type, nowIso(), headHouse.id);
  const updated = findHeadHouse(headHouse.id);
  logAudit(req.user.id, "update", "head_house", updated.id, updated);
  res.json(updated);
});

app.delete("/api/head-houses/:id", requireAuth, requireAdmin, (req, res) => {
  const headHouse = findHeadHouse(req.params.id);
  if (!headHouse) return res.status(404).json({ error: "head_house_not_found" });
  if (headHouse.id === "direct") return res.status(409).json({ error: "head_house_protected" });

  const customerCount = db.prepare("SELECT COUNT(*) AS count FROM customers WHERE head_house_id = ?").get(headHouse.id).count;
  if (customerCount > 0) {
    return res.status(409).json({ error: "head_house_has_customers" });
  }

  withTransaction(() => {
    db.prepare("DELETE FROM users WHERE role = 'head_house_viewer' AND head_house_id = ?").run(headHouse.id);
    db.prepare("DELETE FROM head_houses WHERE id = ?").run(headHouse.id);
  });
  logAudit(req.user.id, "delete", "head_house", headHouse.id, headHouse);
  res.status(204).end();
});

app.post("/api/head-houses/:id/viewer-account", requireAuth, requireAdmin, (req, res) => {
  const headHouse = findHeadHouse(req.params.id);
  if (!headHouse) return res.status(404).json({ error: "head_house_not_found" });

  const existing = db
    .prepare("SELECT id, username, role, head_house_id, created_at FROM users WHERE role = 'head_house_viewer' AND head_house_id = ?")
    .get(headHouse.id);
  if (existing) {
    return res.status(409).json({ error: "viewer_account_exists", user: publicUser(existing) });
  }

  const username = nextAvailableHeadHouseUsername(headHouse.code);
  const password = generateTemporaryPassword();
  const user = {
    id: crypto.randomUUID(),
    username,
    password_hash: bcrypt.hashSync(password, 12),
    role: "head_house_viewer",
    head_house_id: headHouse.id,
    created_at: nowIso(),
  };

  db.prepare(`
    INSERT INTO users (id, username, password_hash, password_encrypted, role, head_house_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(user.id, user.username, user.password_hash, encryptViewerPassword(password), user.role, user.head_house_id, user.created_at);

  logAudit(req.user.id, "create", "head_house_viewer", user.id, {
    username: user.username,
    headHouseId: headHouse.id,
  });
  res.status(201).json({
    user: publicUser(user),
    username,
    password,
    loginPath: "/",
  });
});

app.post("/api/head-houses/:id/viewer-account/reset-password", requireAuth, requireAdmin, (req, res) => {
  const headHouse = findHeadHouse(req.params.id);
  if (!headHouse) return res.status(404).json({ error: "head_house_not_found" });

  const viewer = db
    .prepare("SELECT * FROM users WHERE role = 'head_house_viewer' AND head_house_id = ?")
    .get(headHouse.id);
  if (!viewer) return res.status(404).json({ error: "viewer_account_not_found" });

  const password = generateTemporaryPassword();
  db.prepare("UPDATE users SET password_hash = ?, password_encrypted = ? WHERE id = ?").run(bcrypt.hashSync(password, 12), encryptViewerPassword(password), viewer.id);
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(viewer.id);
  logAudit(req.user.id, "reset_password", "head_house_viewer", viewer.id, { headHouseId: headHouse.id });
  res.json({
    user: publicUser(viewer),
    username: viewer.username,
    password,
    loginPath: "/",
  });
});

app.post("/api/customers", requireAuth, requireNonAffiliate, (req, res) => {
  const name = cleanText(req.body.name, 80);
  const headHouseId = cleanText(req.body.headHouseId, 80);

  if (!name || !findHeadHouse(headHouseId)) {
    return res.status(400).json({ error: "invalid_customer_payload" });
  }

  const now = nowIso();
  const code = nextSequentialCode("customers", "C", 4);
  const customer = {
    id: createSlugId("customer", code),
    code,
    name,
    head_house_id: headHouseId,
    created_at: now,
    updated_at: now,
  };

  try {
    db.prepare(`
      INSERT INTO customers (id, code, name, head_house_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      customer.id,
      customer.code,
      customer.name,
      customer.head_house_id,
      customer.created_at,
      customer.updated_at,
    );
  } catch {
    return res.status(409).json({ error: "customer_code_exists" });
  }

  logAudit(req.user.id, "create", "customer", customer.id, customer);
  res.status(201).json(customer);
});

app.put("/api/customers/:id", requireAuth, requireNonAffiliate, (req, res) => {
  const existing = findCustomer(req.params.id);
  if (!existing) return res.status(404).json({ error: "customer_not_found" });

  const name = cleanText(req.body.name, 80);
  const headHouseId = cleanText(req.body.headHouseId, 80);
  if (!name || !findHeadHouse(headHouseId)) {
    return res.status(400).json({ error: "invalid_customer_payload" });
  }

  const entryCount = db.prepare("SELECT COUNT(*) AS count FROM entries WHERE customer_id = ?").get(existing.id).count;
  if (entryCount > 0 && headHouseId !== existing.head_house_id) {
    return res.status(409).json({ error: "customer_head_house_locked" });
  }

  db.prepare(`
    UPDATE customers
    SET name = ?, head_house_id = ?, updated_at = ?
    WHERE id = ?
  `).run(name, headHouseId, nowIso(), existing.id);

  const updated = findCustomer(existing.id);
  logAudit(req.user.id, "update", "customer", updated.id, updated);
  res.json(updated);
});

app.delete("/api/customers/:id", requireAuth, requireNonAffiliate, (req, res) => {
  const existing = findCustomer(req.params.id);
  if (!existing) return res.status(404).json({ error: "customer_not_found" });

  const entryCount = db.prepare("SELECT COUNT(*) AS count FROM entries WHERE customer_id = ?").get(existing.id).count;
  if (entryCount > 0) {
    return res.status(409).json({ error: "customer_has_entries" });
  }

  db.prepare("DELETE FROM customers WHERE id = ?").run(existing.id);
  logAudit(req.user.id, "delete", "customer", existing.id, existing);
  res.status(204).end();
});

app.post("/api/lotteries", requireAuth, requireNonAffiliate, (req, res) => {
  const name = cleanText(req.body.name, 80);
  const category = cleanLotteryCategory(req.body.category);
  if (!name) {
    return res.status(400).json({ error: "lottery_name_required" });
  }

  const now = nowIso();
  const lottery = {
    id: createSlugId("lottery", name),
    name,
    category,
    display_order: nextLotteryDisplayOrder(category),
    created_at: now,
    updated_at: now,
  };

  try {
    db.prepare(`
      INSERT INTO lotteries (id, name, category, display_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      lottery.id,
      lottery.name,
      lottery.category,
      lottery.display_order,
      lottery.created_at,
      lottery.updated_at,
    );
  } catch {
    return res.status(409).json({ error: "lottery_name_exists" });
  }

  seedPayoutRatesForLottery(lottery.id);
  logAudit(req.user.id, "create", "lottery", lottery.id, lottery);
  res.status(201).json(lottery);
});

app.post("/api/schedule-templates", requireAuth, requireNonAffiliate, (req, res) => {
  const payload = normalizeSchedulePayload(req.body);
  if (!payload || !findLottery(payload.lottery_id)) {
    return res.status(400).json({ error: "invalid_schedule_payload" });
  }

  if (findScheduleTemplateByLottery(payload.lottery_id)) {
    return res.status(409).json({ error: "schedule_exists" });
  }

  const now = nowIso();
  const schedule = {
    id: crypto.randomUUID(),
    ...payload,
    created_at: now,
    updated_at: now,
  };

  db.prepare(`
    INSERT INTO schedule_templates (
      id, lottery_id, frequency, weekdays, month_days, open_days_before, open_time,
      draw_time, result_time, close_before_minutes, active, source_note, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    schedule.id,
    schedule.lottery_id,
    schedule.frequency,
    schedule.weekdays,
    schedule.month_days,
    schedule.open_days_before,
      schedule.open_time,
      schedule.draw_time,
      schedule.result_time,
    schedule.close_before_minutes,
    schedule.active,
    schedule.source_note,
    schedule.created_at,
    schedule.updated_at,
  );

  generateRoundsForSchedule(schedule, bangkokTodayIso(), shiftIsoDate(bangkokTodayIso(), 45));
  logAudit(req.user.id, "create", "schedule_template", schedule.id, schedule);
  res.status(201).json(presentScheduleTemplate(schedule));
});

app.put("/api/schedule-templates/:id", requireAuth, requireNonAffiliate, (req, res) => {
  const existing = findScheduleTemplate(req.params.id);
  if (!existing) return res.status(404).json({ error: "schedule_not_found" });

  const payload = normalizeSchedulePayload({
    lotteryId: existing.lottery_id,
    ...req.body,
  });
  if (!payload) {
    return res.status(400).json({ error: "invalid_schedule_payload" });
  }

  const updatedAt = nowIso();
  db.prepare(`
    UPDATE schedule_templates
      SET frequency = ?, weekdays = ?, month_days = ?, open_days_before = ?, open_time = ?,
          draw_time = ?, result_time = ?, close_before_minutes = ?, active = ?, source_note = ?, updated_at = ?
    WHERE id = ?
  `).run(
    payload.frequency,
    payload.weekdays,
    payload.month_days,
    payload.open_days_before,
      payload.open_time,
      payload.draw_time,
      payload.result_time,
    payload.close_before_minutes,
    payload.active,
    payload.source_note,
    updatedAt,
    existing.id,
  );

  const updated = findScheduleTemplate(existing.id);
  syncFutureGeneratedRounds(updated);
  generateRoundsForSchedule(updated, bangkokTodayIso(), shiftIsoDate(bangkokTodayIso(), 45));
  logAudit(req.user.id, "update", "schedule_template", updated.id, updated);
  res.json(presentScheduleTemplate(updated));
});

app.post("/api/schedule-templates/generate", requireAuth, requireWriteAccess, requireNonAffiliate, (req, res) => {
  const days = Number(req.body?.days ?? 14);
  if (!Number.isInteger(days) || days < 1 || days > 90) {
    return res.status(400).json({ error: "invalid_generate_days" });
  }

  const summary = ensureUpcomingRounds(days);
  logAudit(req.user.id, "generate", "rounds", "scheduled", summary);
  res.json(summary);
});

app.post("/api/rounds", requireAuth, requireNonAffiliate, (req, res) => {
  const lotteryId = cleanText(req.body.lotteryId, 80);
  const label = cleanText(req.body.label, 80);
  const openDate = cleanText(req.body.openDate || req.body.drawDate, 20);
  const openTime = cleanText(req.body.openTime || "00:00", 5);
    const drawDate = cleanText(req.body.drawDate, 20);
    const drawTime = cleanText(req.body.drawTime, 5);
    const resultTime = cleanText(req.body.resultTime || req.body.drawTime, 5);
  const closeBeforeMinutes = Number(req.body.closeBeforeMinutes);
  const status = req.body.status === "closed" ? "closed" : "open";

  if (
    !lotteryId ||
    !label ||
    !isIsoDate(openDate) ||
    !isTimeOfDay(openTime) ||
      !isIsoDate(drawDate) ||
      !isTimeOfDay(drawTime) ||
      !isTimeOfDay(resultTime) ||
    !Number.isInteger(closeBeforeMinutes) ||
    closeBeforeMinutes < 0 ||
    closeBeforeMinutes > 1440 ||
    !findLottery(lotteryId)
  ) {
    return res.status(400).json({ error: "invalid_round_payload" });
  }

  const now = nowIso();
  const round = {
    id: crypto.randomUUID(),
    lottery_id: lotteryId,
    label,
    open_date: openDate,
    open_time: openTime,
      draw_date: drawDate,
      draw_time: drawTime,
      result_time: resultTime,
    close_before_minutes: closeBeforeMinutes,
    status,
    created_at: now,
    updated_at: now,
  };

  try {
    db.prepare(`
        INSERT INTO rounds (id, lottery_id, label, open_date, open_time, draw_date, draw_time, result_time, close_before_minutes, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      round.id,
      round.lottery_id,
      round.label,
      round.open_date,
      round.open_time,
        round.draw_date,
        round.draw_time,
        round.result_time,
      round.close_before_minutes,
      round.status,
      round.created_at,
      round.updated_at,
    );
  } catch {
    return res.status(409).json({ error: "round_exists" });
  }

  logAudit(req.user.id, "create", "round", round.id, round);
  res.status(201).json(presentRound(round));
});

app.put("/api/rounds/:id", requireAuth, requireNonAffiliate, (req, res) => {
  const round = findRound(req.params.id);
  if (!round) return res.status(404).json({ error: "round_not_found" });

  const status = req.body.status === undefined ? round.status : req.body.status === "closed" ? "closed" : "open";
  const label = req.body.label ? cleanText(req.body.label, 80) : round.label;
  const openDate = req.body.openDate ? cleanText(req.body.openDate, 20) : round.open_date || round.draw_date;
  const openTime = req.body.openTime ? cleanText(req.body.openTime, 5) : round.open_time || "00:00";
    const drawDate = req.body.drawDate ? cleanText(req.body.drawDate, 20) : round.draw_date;
    const drawTime = req.body.drawTime ? cleanText(req.body.drawTime, 5) : round.draw_time;
    const resultTime = req.body.resultTime ? cleanText(req.body.resultTime, 5) : round.result_time || round.draw_time;
  const closeBeforeMinutes =
    req.body.closeBeforeMinutes === undefined ? round.close_before_minutes : Number(req.body.closeBeforeMinutes);

  if (
    !label ||
    !isIsoDate(openDate) ||
    !isTimeOfDay(openTime) ||
      !isIsoDate(drawDate) ||
      !isTimeOfDay(drawTime) ||
      !isTimeOfDay(resultTime) ||
    !Number.isInteger(closeBeforeMinutes) ||
    closeBeforeMinutes < 0 ||
    closeBeforeMinutes > 1440
  ) {
    return res.status(400).json({ error: "invalid_round_payload" });
  }

  const updatedAt = nowIso();
  try {
    db.prepare(`
      UPDATE rounds
        SET label = ?, status = ?, open_date = ?, open_time = ?, draw_date = ?, draw_time = ?, result_time = ?, close_before_minutes = ?, updated_at = ?
      WHERE id = ?
      `).run(label, status, openDate, openTime, drawDate, drawTime, resultTime, closeBeforeMinutes, updatedAt, round.id);
  } catch {
    return res.status(409).json({ error: "round_exists" });
  }
  const updated = findRound(round.id);
  logAudit(req.user.id, "update", "round", round.id, updated);
  res.json(presentRound(updated));
});

app.post("/api/payout-rates", requireAuth, requireWriteAccess, requireNonAffiliate, (req, res) => {
  const lotteryId = cleanText(req.body.lotteryId, 80);
  const betTypeId = cleanText(req.body.betTypeId, 80);
  const rate = Number(req.body.rate);

  if (!findLottery(lotteryId) || !findBetType(betTypeId) || !Number.isFinite(rate) || rate < 0) {
    return res.status(400).json({ error: "invalid_payout_rate_payload" });
  }

  const now = nowIso();
  const existing = db.prepare(`
    SELECT * FROM payout_rates WHERE lottery_id = ? AND bet_type_id = ?
  `).get(lotteryId, betTypeId);

  if (existing) {
    db.prepare(`
      UPDATE payout_rates SET rate = ?, updated_at = ? WHERE id = ?
    `).run(rate, now, existing.id);
    logAudit(req.user.id, "update", "payout_rate", existing.id, { lotteryId, betTypeId, rate });
    return res.json({ ...existing, rate, updated_at: now });
  }

  const payoutRate = {
    id: crypto.randomUUID(),
    lottery_id: lotteryId,
    bet_type_id: betTypeId,
    rate,
    created_at: now,
    updated_at: now,
  };
  db.prepare(`
    INSERT INTO payout_rates (id, lottery_id, bet_type_id, rate, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    payoutRate.id,
    payoutRate.lottery_id,
    payoutRate.bet_type_id,
    payoutRate.rate,
    payoutRate.created_at,
    payoutRate.updated_at,
  );
  logAudit(req.user.id, "create", "payout_rate", payoutRate.id, payoutRate);
  res.status(201).json(payoutRate);
});

app.post("/api/limits", requireAuth, requireNonAffiliate, (req, res) => {
  const payload = normalizeLimitPayload(req.body);
  if (!payload.ok) return res.status(400).json({ error: payload.error });

  const now = nowIso();
  const limit = {
    id: crypto.randomUUID(),
    ...payload.value,
    created_at: now,
    updated_at: now,
  };

  try {
    db.prepare(`
      INSERT INTO limits (id, round_id, bet_type_id, number, max_amount, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(limit.id, limit.round_id, limit.bet_type_id, limit.number, limit.max_amount, limit.created_at, limit.updated_at);
  } catch {
    return res.status(409).json({ error: "limit_exists" });
  }

  logAudit(req.user.id, "create", "limit", limit.id, limit);
  res.status(201).json(limit);
});

app.put("/api/limits/:id", requireAuth, requireNonAffiliate, (req, res) => {
  const existing = findLimit(req.params.id);
  if (!existing) return res.status(404).json({ error: "limit_not_found" });

  const payload = normalizeLimitPayload(req.body);
  if (!payload.ok) return res.status(400).json({ error: payload.error });

  try {
    db.prepare(`
      UPDATE limits
      SET round_id = ?, bet_type_id = ?, number = ?, max_amount = ?, updated_at = ?
      WHERE id = ?
    `).run(
      payload.value.round_id,
      payload.value.bet_type_id,
      payload.value.number,
      payload.value.max_amount,
      nowIso(),
      existing.id,
    );
  } catch {
    return res.status(409).json({ error: "limit_exists" });
  }

  const updated = findLimit(existing.id);
  logAudit(req.user.id, "update", "limit", existing.id, updated);
  res.json(updated);
});

app.delete("/api/limits/:id", requireAuth, requireNonAffiliate, (req, res) => {
  const existing = findLimit(req.params.id);
  if (!existing) return res.status(404).json({ error: "limit_not_found" });
  db.prepare("DELETE FROM limits WHERE id = ?").run(existing.id);
  logAudit(req.user.id, "delete", "limit", existing.id, existing);
  res.status(204).end();
});

app.post("/api/entries", requireAuth, requireWriteAccess, (req, res) => {
  /* HOTFIX: POST entries affiliate clamp — force head_house + verify customer */
  if (req.user.role === "affiliate" && req.user.head_house_id) {
    if (req.body && req.body.customerId && !affiliateOwnsCustomer(req.user, req.body.customerId)) {
      return res.status(403).json({ error: "customer_not_yours" });
    }
    req.body = req.body || {};
    req.body.headHouseId = req.user.head_house_id;
  }
  const payload = normalizeEntryPayload(req.body);
  if (!payload.ok) return res.status(400).json({ error: payload.error });
  const headHouseId = normalizeTicketHeadHouse(req.body.headHouseId, payload.value.customer_id);
  if (!headHouseId) return res.status(400).json({ error: "invalid_head_house_payload" });

  const limitError = validateLimitCapacity(payload.value);
  if (limitError) return res.status(409).json(limitError);

  const created = withTransaction(() => {
    const ticket = createTicket(
      {
        customer_id: payload.value.customer_id,
        head_house_id: headHouseId,
        round_id: payload.value.round_id,
        source_channel: cleanText(req.body.sourceChannel || "manual", 40),
        source_text: payload.value.source_text,
        note: payload.value.note,
      },
      req.user.id,
    );
    const entry = insertEntry(payload.value, req.user.id, ticket.id);
    return { ticket, entry };
  });

  logAudit(req.user.id, "create", "ticket", created.ticket.id, created.ticket);
  logAudit(req.user.id, "create", "entry", created.entry.id, created.entry);
  res.status(201).json(created.entry);
});

app.post("/api/entries/batch", requireAuth, requireWriteAccess, (req, res) => {
  const items = Array.isArray(req.body.entries) ? req.body.entries : [];
  if (!items.length) return res.status(400).json({ error: "entries_required" });

  const normalized = [];
  for (const item of items) {
    const payload = normalizeEntryPayload(item);
    if (!payload.ok) return res.status(400).json({ error: payload.error });
    normalized.push(payload.value);
  }

  /* S0: limit check moved INSIDE the transaction (TOCTOU fix) */

  const first = normalized[0];
  const headHouseId = req.user.role === "affiliate" && req.user.head_house_id
    ? req.user.head_house_id  // affiliate's bills always belong to their head_house
    : normalizeTicketHeadHouse(req.body.headHouseId, first.customer_id);
  // Affiliate ownership check: ensure customer is theirs (or walkin)
  if (req.user.role === "affiliate" && first.customer_id !== "walkin") {
    const cust = db.prepare("SELECT head_house_id FROM customers WHERE id = ?").get(first.customer_id);
    if (!cust || cust.head_house_id !== req.user.head_house_id) {
      return res.status(403).json({ error: "customer_not_yours" });
    }
  }
  if (!headHouseId) return res.status(400).json({ error: "invalid_head_house_payload" });
  const hasMixedTickets = normalized.some(
    (entry) => entry.customer_id !== first.customer_id || entry.round_id !== first.round_id,
  );
  if (hasMixedTickets) return res.status(400).json({ error: "ticket_must_share_customer_and_round" });

  /* C5 fix: validate batch capacity (admin endpoint was missing this check) */
  const _batchLimitErr = validateBatchLimitCapacity(normalized);
  if (_batchLimitErr) return res.status(409).json(_batchLimitErr);

  let created;
  try {
    created = withTransaction(() => {
      /* M4-FIX: re-validate limit inside tx — กัน TOCTOU race */
      const _limitErr2 = validateBatchLimitCapacity(normalized);
      if (_limitErr2) throw Object.assign(new Error("limit_capacity"), { __limitError: _limitErr2 });
      const ticket = createTicket(
      {
        customer_id: first.customer_id,
        head_house_id: headHouseId,
        round_id: first.round_id,
        source_channel: cleanText(req.body.sourceChannel || "manual", 40),
        source_text: cleanText(req.body.sourceText || first.source_text, 500),
        note: cleanText(req.body.note || first.note, 240),
      },
      req.user.id,
    );
      const inserted = normalized.map((entryPayload) => insertEntry(entryPayload, req.user.id, ticket.id));
      return { ticket, inserted };
    });
  } catch (e) {
    if (e.__limitError) return res.status(409).json(e.__limitError);
    throw e;
  }

  logAudit(req.user.id, "create", "ticket", created.ticket.id, created.ticket);
  logAudit(req.user.id, "create_batch", "entry", created.inserted.map((entry) => entry.id).join(","), created.inserted);
  res.status(201).json(created.inserted);
});

app.put("/api/entries/:id", requireAuth, requireWriteAccess, (req, res) => {
  /* HOTFIX: affiliate can only edit own entries */
  if (!affiliateOwnsEntry(req.user, req.params.id)) return res.status(403).json({ error: "not_yours" });
  const existing = findEntry(req.params.id);
  if (!existing) return res.status(404).json({ error: "entry_not_found" });
  if (ticketIsLocked(existing.ticket_id)) return res.status(409).json({ error: "ticket_locked" });

  const payload = normalizeEntryPayload(req.body);
  if (!payload.ok) return res.status(400).json({ error: payload.error });

  const limitError = validateLimitCapacity(payload.value, existing.id);
  if (limitError) return res.status(409).json(limitError);

  // B4 fix: re-check ticket status inside the transaction and abort if it was
  // approved/cancelled between our first check and the UPDATE.
  try {
    withTransaction(() => {
      const ticket = existing.ticket_id
        ? db.prepare("SELECT status FROM tickets WHERE id = ?").get(existing.ticket_id)
        : null;
      if (ticket && ticket.status !== "pending_review") {
        throw Object.assign(new Error("ticket_locked"), { code: "ticket_locked" });
      }
      db.prepare(`
        UPDATE entries
        SET customer_id = ?, round_id = ?, bet_type_id = ?, number = ?, amount = ?, note = ?, source_text = ?, updated_at = ?
        WHERE id = ?
      `).run(
        payload.value.customer_id,
        payload.value.round_id,
        payload.value.bet_type_id,
        payload.value.number,
        payload.value.amount,
        payload.value.note,
        payload.value.source_text,
        nowIso(),
        existing.id,
      );
    });
  } catch (error) {
    if (error.code === "ticket_locked") return res.status(409).json({ error: "ticket_locked" });
    throw error;
  }

  const updated = findEntry(existing.id);
  logAudit(req.user.id, "update", "entry", existing.id, updated);
  /* B5a: recompute ticket total เพราะ entry amount เปลี่ยน */
  try { if (existing.ticket_id) recomputeTicketTotal(existing.ticket_id); } catch(e) {}
  res.json(updated);
});

app.delete("/api/entries/:id", requireAuth, requireWriteAccess, (req, res) => {
  const _delTicketId = (db.prepare("SELECT ticket_id FROM entries WHERE id = ?").get(req.params.id))?.ticket_id;
  /* HOTFIX: affiliate can only delete own entries */
  if (!affiliateOwnsEntry(req.user, req.params.id)) return res.status(403).json({ error: "not_yours" });
  const existing = findEntry(req.params.id);
  if (!existing) return res.status(404).json({ error: "entry_not_found" });
  if (ticketIsLocked(existing.ticket_id)) return res.status(409).json({ error: "ticket_locked" });
  db.prepare("DELETE FROM entries WHERE id = ?").run(existing.id);
  logAudit(req.user.id, "delete", "entry", existing.id, existing);
  /* B5b: recompute ticket total หลังลบ entry */
  try { if (_delTicketId) recomputeTicketTotal(_delTicketId); } catch(e) {}
  res.status(204).end();
});

app.post("/api/tickets/:id/approve", requireAuth, requireAdmin, (req, res) => {
  const ticket = findTicket(req.params.id);
  if (!ticket) return res.status(404).json({ error: "ticket_not_found" });
  if (ticket.status !== "pending_review") return res.status(409).json({ error: "ticket_not_pending" });

  const now = nowIso();
  /* R5-1 FIX: wrap atomic guard + bank update ใน transaction เดียวกัน */
  let _appResult;
  const _bankUpdated = withTransaction(() => {
    _appResult = db.prepare(`
      UPDATE tickets
      SET status = 'approved', checked_by = ?, checked_at = ?, updated_at = ?
      WHERE id = ? AND status = 'pending_review'
    `).run(req.user.id, now, now, ticket.id);
    if (_appResult.changes === 0) return false;
    /* update bank ถ้าบิลมี slip + receiver */
    try {
    if (ticket.slip_amount && Number(ticket.slip_amount) > 0 && ticket.slip_raw_json) {
      const raw = JSON.parse(ticket.slip_raw_json);
      const d = raw.data || raw.result || raw;
      const ra = d.receiver?.account;
      let recvAcc = "";
      if (typeof ra === "string") recvAcc = ra;
      else if (ra && typeof ra === "object") recvAcc = String(ra.value || ra.number || ra.account || "");
      const recvNorm = normalizeAccountNumber(recvAcc);
      if (recvNorm) {
        const accounts = db.prepare("SELECT id, account_number FROM bank_accounts").all();
        const targetAcc = accounts.find(a => normalizeAccountNumber(a.account_number) === recvNorm);
        if (targetAcc) {
          const amt = roundMoney(Number(ticket.slip_amount));
          const r = db.prepare(`
            UPDATE bank_accounts
            SET total_received_today = total_received_today + ?,
                status = CASE WHEN status = 'active' AND total_received_today + ? >= daily_limit THEN 'cooling' ELSE status END,
                updated_at = ?
            WHERE id = ?
          `).run(amt, amt, now, targetAcc.id);
          if (r.changes > 0) console.log(`[admin-approve-bank] +${amt} → ${targetAcc.account_number}`);
        }
      }
    }
    } catch (e) { console.warn("[admin-approve-bank]", e.message); }
    return true;
  });
  if (!_bankUpdated) return res.status(409).json({ error: "race_lost_already_processed" });

  const updated = findTicket(ticket.id);
  logAudit(req.user.id, "approve", "ticket", ticket.id, updated);
  res.json(updated);
});

app.post("/api/tickets/:id/reject", requireAuth, requireAdmin, (req, res) => {
  const ticket = findTicket(req.params.id);
  if (!ticket) return res.status(404).json({ error: "ticket_not_found" });
  if (ticket.status !== "pending_review") return res.status(409).json({ error: "ticket_not_pending" });

  const now = nowIso();
  const reason = cleanText(req.body.reason, 240);
  db.prepare(`
    UPDATE tickets
    SET status = 'rejected', checked_by = ?, checked_at = ?, review_note = ?, updated_at = ?
    WHERE id = ?
  `).run(req.user.id, now, reason, now, ticket.id);

  const updated = findTicket(ticket.id);
  logAudit(req.user.id, "reject", "ticket", ticket.id, { ...updated, reason });
  res.json(updated);
});

app.post("/api/tickets/:id/cancel", requireAuth, requireAdmin, (req, res) => {
  const ticket = findTicket(req.params.id);
  if (!ticket) return res.status(404).json({ error: "ticket_not_found" });
  if (ticket.status === "cancelled") return res.status(409).json({ error: "ticket_already_cancelled" });

  const now = nowIso();
  /* M2-FIX: ถ้า approved + slip_amount → rollback bank ก่อน cancel */
  try {
    if (ticket.status === 'approved' && ticket.slip_amount && Number(ticket.slip_amount) > 0 && ticket.slip_raw_json) {
      const raw = JSON.parse(ticket.slip_raw_json);
      const d = raw.data || raw.result || raw;
      const ra = d.receiver?.account;
      let recvAcc = "";
      if (typeof ra === "string") recvAcc = ra;
      else if (ra && typeof ra === "object") recvAcc = String(ra.value || ra.number || ra.account || "");
      const recvNorm = normalizeAccountNumber(recvAcc);
      if (recvNorm) {
        const accounts = db.prepare("SELECT id, account_number, daily_limit FROM bank_accounts").all();
        const targetAcc = accounts.find(a => normalizeAccountNumber(a.account_number) === recvNorm);
        if (targetAcc) {
          const amt = roundMoney(Number(ticket.slip_amount));
          db.prepare(`UPDATE bank_accounts SET total_received_today = MAX(0, total_received_today - ?), status = CASE WHEN status = 'cooling' AND total_received_today - ? < daily_limit THEN 'active' ELSE status END, updated_at = ? WHERE id = ?`)
            .run(amt, amt, now, targetAcc.id);
          console.log("[cancel-rollback] -" + amt + " → " + targetAcc.account_number);
        }
      }
    }
  } catch(e) { console.warn("[cancel-rollback]", e.message); }
  db.prepare(`
    UPDATE tickets
    SET status = 'cancelled', checked_by = ?, checked_at = ?, updated_at = ?
    WHERE id = ?
  `).run(req.user.id, now, now, ticket.id);

  const updated = findTicket(ticket.id);
  logAudit(req.user.id, "cancel", "ticket", ticket.id, updated);
  res.json(updated);
});

app.post("/api/results", requireAuth, requireWriteAccess, requireNonAffiliate, (req, res) => {
  const roundId = cleanText(req.body.roundId, 80);
  const betTypeId = cleanText(req.body.betTypeId, 80);
  const numbers = normalizeResultNumbers(req.body.numbers, betTypeId);

  const round = findRound(roundId);
  if (!round || !findBetType(betTypeId) || !numbers.length) {
    return res.status(400).json({ error: "invalid_result_payload" });
  }
  if (round.result_status === "finalized") {
    return res.status(409).json({ error: "result_finalized" });
  }

  const now = nowIso();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO results (id, round_id, bet_type_id, number, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const inserted = withTransaction(() => {
    db.prepare("DELETE FROM results WHERE round_id = ? AND bet_type_id = ?").run(roundId, betTypeId);
    return numbers.map((number) => {
      const result = {
        id: crypto.randomUUID(),
        round_id: roundId,
        bet_type_id: betTypeId,
        number,
        created_at: now,
        updated_at: now,
      };
      insert.run(result.id, result.round_id, result.bet_type_id, result.number, result.created_at, result.updated_at);
      return result;
    });
  });

  logAudit(req.user.id, "upsert", "result", `${roundId}:${betTypeId}`, inserted);
  res.json(inserted);
});

app.post("/api/results/:roundId/finalize", requireAuth, requireAdmin, (req, res) => {
  const round = findRound(req.params.roundId);
  if (!round) return res.status(404).json({ error: "round_not_found" });
  if (round.result_status === "finalized") return res.status(409).json({ error: "result_already_finalized" });

  const resultCount = db.prepare("SELECT COUNT(*) AS count FROM results WHERE round_id = ?").get(round.id).count;
  if (!resultCount) return res.status(409).json({ error: "result_required_before_finalize" });

  const soldBetTypes = db
    .prepare(`
      SELECT DISTINCT entries.bet_type_id
      FROM entries
      JOIN tickets ON tickets.id = entries.ticket_id
      WHERE entries.round_id = ?
        AND tickets.status = 'approved'
    `)
    .all(round.id)
    .map((row) => row.bet_type_id);
  const resultBetTypes = new Set(
    db.prepare("SELECT DISTINCT bet_type_id FROM results WHERE round_id = ?").all(round.id).map((row) => row.bet_type_id),
  );
  const missingBetTypeIds = soldBetTypes.filter((betTypeId) => !resultBetTypes.has(betTypeId));
  if (missingBetTypeIds.length) {
    return res.status(409).json({ error: "result_incomplete", missingBetTypeIds });
  }

  const now = nowIso();
  db.prepare(`
    UPDATE rounds
    SET result_status = 'finalized', result_finalized_by = ?, result_finalized_at = ?, updated_at = ?
    WHERE id = ?
  `).run(req.user.id, now, now, round.id);

  const updated = findRound(round.id);
  logAudit(req.user.id, "finalize", "result", round.id, updated);

  /* === DISCORD-HOOK-1 MANUAL === */
  notifyResultFinalized(round.id, "manual").catch(() => {});

  res.json(presentRound(updated));
});

app.post("/api/results/:roundId/reopen", requireAuth, requireAdmin, (req, res) => {
  const round = findRound(req.params.roundId);
  if (!round) return res.status(404).json({ error: "round_not_found" });
  if (round.result_status !== "finalized") return res.status(409).json({ error: "result_not_finalized" });

  db.prepare(`
    UPDATE rounds
    SET result_status = 'draft', result_finalized_by = NULL, result_finalized_at = NULL, updated_at = ?
    WHERE id = ?
  `).run(nowIso(), round.id);

  /* R6-FIX: clear paid_at ของ entries ในงวด — กัน double-pay ตอน finalize ใหม่ */
  try {
    db.prepare("UPDATE entries SET paid_at = NULL, updated_at = ? WHERE round_id = ?").run(nowIso(), round.id);
  } catch(e) { console.warn("[reopen-clear-paid]", e.message); }

  const updated = findRound(round.id);
  logAudit(req.user.id, "reopen", "result", round.id, updated);
  res.json(presentRound(updated));
});

app.post("/api/result-imports/fetch", requireAuth, requireAdmin, async (req, res) => {
  const roundId = cleanText(req.body.roundId, 80);
  const sourceId = cleanText(req.body.sourceId, 80);
  const round = findRound(roundId);
  const source = findResultSource(sourceId);
  if (!round || !source) return res.status(404).json({ error: "result_target_not_found" });
  if (source.lottery_id && source.lottery_id !== round.lottery_id) {
    return res.status(400).json({ error: "source_lottery_mismatch" });
  }

  try {
    const imported = await fetchAndStoreResultImport(round, source, req.user.id, { applyIfTrusted: true });
    res.json(imported);
  } catch (error) {
    if (error.code) return res.status(error.status || 409).json({ error: error.code, message: error.message });
    throw error;
  }
});

app.post("/api/result-imports/:importId/apply", requireAuth, requireAdmin, (req, res) => {
  const imported = findResultImport(req.params.importId);
  if (!imported) return res.status(404).json({ error: "result_import_not_found" });
  const round = findRound(imported.round_id);
  if (!round) return res.status(404).json({ error: "round_not_found" });
  if (round.result_status === "finalized") return res.status(409).json({ error: "result_finalized" });

  const numbers = safeParseJson(imported.numbers_json, {});
  applyImportedResult(round, numbers);
  db.prepare(`
    UPDATE result_imports
    SET status = 'applied', confirmed_by = ?, confirmed_at = ?, updated_at = ?
    WHERE id = ?
  `).run(req.user.id, nowIso(), nowIso(), imported.id);

  logAudit(req.user.id, "apply", "result_import", imported.id, { roundId: round.id, numbers });
  res.json(findResultImport(imported.id));
});


// Scrape candidate numbers from a manual-link source page.
// Returns extracted numbers + raw text snippet; admin then picks which to use.
app.post("/api/result-imports/scrape", requireAuth, requireAdmin, async (req, res) => {
  const sourceId = cleanText(req.body.sourceId, 80);
  const source = findResultSource(sourceId);
  if (!source) return res.status(404).json({ error: "result_source_not_found" });
  if (!source.url) return res.status(400).json({ error: "result_source_no_url" });

  try {
    const result = await scrapeResultSource(source);
    res.json(result);
  } catch (error) {
    if (error.code) {
      return res.status(error.status || 502).json({ error: error.code, message: error.message });
    }
    res.status(502).json({ error: "scrape_failed", message: String(error.message || error) });
  }
});



// === S1: scrape URL allowlist (SSRF defense) ===
function isPrivateOrUnsafeUrl(u) {
  let url;
  try { url = new URL(u); } catch (e) { return true; }
  if (url.protocol !== "http:" && url.protocol !== "https:") return true;
  const h = url.hostname.toLowerCase();
  /* Block localhost */
  if (h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "0.0.0.0") return true;
  /* Block IPv4 private ranges + link-local + carrier-grade NAT */
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const o1 = +m[1], o2 = +m[2];
    if (o1 === 10) return true;
    if (o1 === 127) return true;
    if (o1 === 169 && o2 === 254) return true;
    if (o1 === 172 && o2 >= 16 && o2 <= 31) return true;
    if (o1 === 192 && o2 === 168) return true;
    if (o1 === 100 && o2 >= 64 && o2 <= 127) return true;  /* CGNAT */
    if (o1 === 0) return true;
  }
  /* Block IPv6 special ranges (basic) */
  if (h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) return true;
  /* Block our own domain to prevent scrape-loop */
  if (h.endsWith(".nip.io")) return true;
  return false;
}

async function scrapeResultSource(source) {
  /* S1-6 SSRF defense: refuse private / localhost / our-own URLs */
  if (isPrivateOrUnsafeUrl(source.url)) {
    const err = new Error("URL ไม่อนุญาต — ห้ามใช้ localhost / private IP");
    err.code = "ssrf_blocked"; err.status = 400;
    throw err;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  let html = "";
  try {
    const response = await fetch(source.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "th,en;q=0.9,vi;q=0.8",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!response.ok) {
      throw Object.assign(new Error(`HTTP ${response.status}`), { code: "scrape_http_error", status: 502 });
    }
    html = await response.text();
  } finally {
    clearTimeout(timer);
  }

  // Strip <script>, <style>, then tags. Decode minimal entities.
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

  // Extract candidate digit groups
  const digits6 = unique(text.match(/\b\d{6}\b/g) || []).slice(0, 12);
  const digits5 = unique(text.match(/\b\d{5}\b/g) || []).slice(0, 12);
  const digits3 = unique(text.match(/\b\d{3}\b/g) || []).slice(0, 30);
  const digits2 = unique(text.match(/\b\d{2}\b/g) || []).slice(0, 30);

  // Smarter heuristic: look for context-keyed prize numbers
  //   - Vietnamese (Hanoi): "Giải ĐB" / "ĐB" / "Giải đặc biệt" → 5-digit special prize
  //   - Thai (GLO): 6-digit first prize
  //   - "Giải bảy" / "Giải 7" → last 2-digit prizes (used for 2-bottom)
  let suggested = {};

  // Look for ĐB pattern: "Giải ĐB ... 12345" or "Giải đặc biệt ... 12345"
  const dbMatch = text.match(/(?:Giải\s*ĐB|Giải\s*đặc\s*biệt|ĐB)\s*[:\-]?\s*(\d{5,6})/i);
  if (dbMatch) {
    const special = dbMatch[1];
    suggested.three_top = special.slice(-3);
    suggested.two_top = special.slice(-2);
    suggested.special = special;
  } else if (digits6.length > 0) {
    // Fallback: 6-digit (Thai GLO style)
    const first = digits6[0];
    suggested.three_top = first.slice(-3);
    suggested.two_top = first.slice(-2);
  } else if (digits5.length > 0) {
    // Fallback: 5-digit (likely Hanoi style)
    const first = digits5[0];
    suggested.three_top = first.slice(-3);
    suggested.two_top = first.slice(-2);
  }

  // 2-bottom: look for Giải bảy (Hanoi style) last 2-digit prize
  const bayMatch = text.match(/(?:Giải\s*bảy|Giải\s*7|G7|รางวัลที่\s*7)\s*[:\-]?\s*([\d\s,]{4,40})/i);
  if (bayMatch) {
    const ns = bayMatch[1].match(/\b\d{2}\b/g);
    if (ns && ns.length > 0) {
      suggested.two_bottom = ns[ns.length - 1]; // last number of Giải bảy
    }
  }
  if (!suggested.two_bottom && digits2.length > 0) {
    suggested.two_bottom = suggested.two_top
      ? (digits2.find((n) => n !== suggested.two_top) || digits2[0])
      : digits2[0];
  }

  return {
    url: source.url,
    sourceName: source.name,
    confidenceNote: suggested.special
      ? `ดึงจาก "Giải ĐB ${suggested.special}" (รางวัลพิเศษหวยฮานอย)`
      : suggested.three_top
        ? "เดาจากเลขใหญ่สุดในหน้า — ตรวจให้แน่ใจก่อนบันทึก"
        : "ไม่พบเลขที่น่าจะเป็นผล — เปิดต้นทางตรวจมือ",
    found6Digit: digits6,
    found5Digit: digits5,
    found3Digit: digits3,
    found2Digit: digits2,
    suggested,
    isJavaScriptApp: text.length < 200,
    textPreview: text.slice(0, 600),
  };
}

function unique(arr) {
  return [...new Set(arr)];
}

app.get("/api/settlements", requireAuth, requireStaff, (req, res) => {
  const roundId = cleanText(req.query.roundId, 80);
  if (!findRound(roundId)) return res.status(404).json({ error: "round_not_found" });
  res.json(buildSettlement(roundId));
});

app.get("/api/head-house-summary", requireAuth, (req, res) => {
  /* HOTFIX: head-house-summary clamp — affiliate/viewer can only see own */
  if ((req.user.role === "affiliate" || req.user.role === "head_house_viewer") && req.user.head_house_id) {
    req.query.headHouseId = req.user.head_house_id;
  }
  const requestedId = cleanText(req.query.headHouseId, 80);
  const headHouseId = req.user.role === "head_house_viewer" ? req.user.head_house_id : requestedId;

  if (!headHouseId || !findHeadHouse(headHouseId)) {
    return res.status(404).json({ error: "head_house_not_found" });
  }

  res.json(buildHeadHouseSummary(headHouseId));
});

app.get("/api/export", requireAuth, requireStaff, requireNonAffiliate, (req, res) => {
  res.json(getFullState(req.user));
});

app.post("/api/import", requireAuth, requireAdmin, (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ error: "invalid_import_payload" });
  }

  const imported = importLegacyPayload(payload, req.user.id);
  res.json(imported);
});


// ===== OWNER DASHBOARD ENDPOINT =====
function ownerAggregateRange(startIso, endIso) {
  const entries = db.prepare(`
    SELECT entries.id, entries.customer_id, entries.round_id, entries.bet_type_id,
           entries.number, entries.amount, entries.ticket_id, entries.payout_multiplier,
           customers.code AS customer_code, customers.name AS customer_name,
           COALESCE(tickets.head_house_id, customers.head_house_id) AS head_house_id,
           bet_types.name AS bet_type_name,
           rounds.lottery_id, rounds.draw_date, rounds.result_status,
           lotteries.name AS lottery_name
    FROM entries
    JOIN tickets ON tickets.id = entries.ticket_id
    JOIN customers ON customers.id = entries.customer_id
    JOIN bet_types ON bet_types.id = entries.bet_type_id
    JOIN rounds ON rounds.id = entries.round_id
    JOIN lotteries ON lotteries.id = rounds.lottery_id
    WHERE tickets.status = 'approved'
      AND rounds.draw_date >= ? AND rounds.draw_date <= ?
  `).all(startIso, endIso);

  const roundIds = Array.from(new Set(entries.map((e) => e.round_id)));
  if (roundIds.length === 0) {
    return { stake: 0, payout: 0, profit: 0, ticketCount: 0, customerCount: 0, byCustomer: new Map(), byHeadHouse: new Map(), byLottery: new Map() };
  }
  const placeholders = roundIds.map(() => "?").join(",");
  const results = db.prepare(`SELECT * FROM results WHERE round_id IN (${placeholders})`).all(...roundIds);
  const payoutRates = db.prepare("SELECT * FROM payout_rates").all();
  const rateLookup = new Map();
  for (const r of payoutRates) rateLookup.set(`${r.lottery_id}|${r.bet_type_id}`, Number(r.rate) || 0);
  /* RATE-OVERRIDE-V2: load หัวบ้าน × หวย × bet_type → rate override */
  const __ovrLookup = new Map();
  try {
    const ovr = db.prepare(`SELECT head_house_id, lottery_id, bet_type_id, rate FROM head_house_payout_overrides`).all();
    for (const o of ovr) __ovrLookup.set(`${o.head_house_id}|${o.lottery_id}|${o.bet_type_id}`, Number(o.rate) || 0);
  } catch (e) { /* ignore */ }
  function __ownerResolveRate(hhId, lottId, btId) {
    if (hhId) {
      const ov = __ovrLookup.get(`${hhId}|${lottId}|${btId}`);
      if (ov != null) return ov;
    }
    return rateLookup.get(`${lottId}|${btId}`) || 0;
  }
  const resultsByRound = new Map();
  for (const r of results) {
    if (!resultsByRound.has(r.round_id)) resultsByRound.set(r.round_id, []);
    resultsByRound.get(r.round_id).push(r);
  }

  let stake = 0, payout = 0;
  const ticketIds = new Set(), customerIds = new Set();
  const byCustomer = new Map(), byHeadHouse = new Map(), byLottery = new Map();

  for (const e of entries) {
    const amt = Number(e.amount) || 0;
    stake += amt;
    if (e.ticket_id) ticketIds.add(e.ticket_id);
    customerIds.add(e.customer_id);

    const rounds = resultsByRound.get(e.round_id) || [];
    const won = e.result_status === "finalized" && rounds.some((r) => isWinningEntry(e, r));
    const rate = __ownerResolveRate(e.head_house_id, e.lottery_id, e.bet_type_id);
    const multiplier = e.payout_multiplier == null ? 1 : Number(e.payout_multiplier);
    const win = won ? amt * rate * multiplier : 0;
    payout += win;

    const cust = byCustomer.get(e.customer_id) || { id: e.customer_id, code: e.customer_code, name: e.customer_name, stake: 0, payout: 0, count: 0 };
    cust.stake += amt; cust.payout += win; cust.count += 1;
    byCustomer.set(e.customer_id, cust);

    const hh = byHeadHouse.get(e.head_house_id) || { id: e.head_house_id, stake: 0, payout: 0, count: 0 };
    hh.stake += amt; hh.payout += win; hh.count += 1;
    byHeadHouse.set(e.head_house_id, hh);

    const lot = byLottery.get(e.lottery_id) || { id: e.lottery_id, name: e.lottery_name, stake: 0, payout: 0, count: 0 };
    lot.stake += amt; lot.payout += win; lot.count += 1;
    byLottery.set(e.lottery_id, lot);
  }

  return {
    stake, payout, profit: stake - payout,
    ticketCount: ticketIds.size,
    customerCount: customerIds.size,
    byCustomer, byHeadHouse, byLottery,
  };
}

function ownerSummary(startIso, endIso) {
  const a = ownerAggregateRange(startIso, endIso);
  return { stake: a.stake, payout: a.payout, profit: a.profit, ticketCount: a.ticketCount, customerCount: a.customerCount };
}

function ownerRealtimeStats() {
  const now = Date.now();
  const openRounds = db.prepare(`
    SELECT COUNT(*) AS c FROM rounds
    WHERE status = 'open'
      AND draw_date >= date('now', '-1 day')
  `).get().c;
  const pending = db.prepare(`
    SELECT COUNT(DISTINCT tickets.id) AS c, COALESCE(SUM(entries.amount), 0) AS s
    FROM tickets
    LEFT JOIN entries ON entries.ticket_id = tickets.id
    WHERE tickets.status = 'pending_review'
  `).get();
  const since = new Date(now - 24 * 3600 * 1000).toISOString();
  const activeCust = db.prepare(`
    SELECT COUNT(DISTINCT customer_id) AS c
    FROM tickets
    WHERE created_at >= ?
  `).get(since).c;
  return {
    openRounds,
    pendingTickets: pending.c,
    pendingAmount: pending.s,
    activeCustomers24h: activeCust,
  };
}

function ownerTrend30d() {
  /* S2-J1 cache hit returns immediately */
  const _cacheKey = "trend30d:" + new Date().toISOString().slice(0,10);
  const _cached = _ownerCacheGet(_cacheKey);
  if (_cached) return _cached;
  const today = bangkokTodayIso();
  const out = [];
  for (let i = 29; i >= 0; i--) {
    const d = shiftIsoDate(today, -i);
    const a = ownerSummary(d, d);
    out.push({ date: d, stake: a.stake, payout: a.payout, profit: a.profit, ticketCount: a.ticketCount });
  }
  /* S2-J1 cache set */
  const _result = out;
  _ownerCacheSet(_cacheKey, _result);
  return _result;
}

function ownerHeadHouseNamesMap() {
  const rows = db.prepare("SELECT id, code, name FROM head_houses").all();
  const m = new Map();
  for (const r of rows) m.set(r.id, { code: r.code, name: r.name });
  return m;
}

app.get("/api/owner/dashboard", requireAuth, requireAdmin, (req, res) => {
  const today = bangkokTodayIso();
  const monthStart = today.slice(0, 7) + "-01";
  const rangeFrom = isIsoDate(String(req.query.from || "")) ? req.query.from : today;
  const rangeTo = isIsoDate(String(req.query.to || "")) ? req.query.to : today;

  const todayA = ownerAggregateRange(today, today);
  const monthA = ownerAggregateRange(monthStart, today);
  const rangeA = ownerAggregateRange(rangeFrom, rangeTo);
  const hhNames = ownerHeadHouseNamesMap();

  const topCustomersProfit = Array.from(rangeA.byCustomer.values())
    .map((c) => ({ ...c, net: c.stake - c.payout }))
    .sort((a, b) => b.net - a.net)
    .slice(0, 10);
  const topCustomersLoss = Array.from(rangeA.byCustomer.values())
    .map((c) => ({ ...c, net: c.stake - c.payout }))
    .sort((a, b) => a.net - b.net)
    .slice(0, 10);
  const topHeadHouses = Array.from(rangeA.byHeadHouse.values())
    .map((h) => ({ ...h, code: hhNames.get(h.id)?.code || h.id, name: hhNames.get(h.id)?.name || h.id, profit: h.stake - h.payout }))
    .sort((a, b) => b.stake - a.stake)
    .slice(0, 10);
  const topLotteriesProfit = Array.from(rangeA.byLottery.values())
    .map((l) => ({ ...l, profit: l.stake - l.payout }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10);
  const topLotteriesLoss = Array.from(rangeA.byLottery.values())
    .map((l) => ({ ...l, profit: l.stake - l.payout }))
    .sort((a, b) => a.profit - b.profit)
    .slice(0, 10);

  res.json({
    today: { stake: todayA.stake, payout: todayA.payout, profit: todayA.profit, ticketCount: todayA.ticketCount, customerCount: todayA.customerCount },
    month: { stake: monthA.stake, payout: monthA.payout, profit: monthA.profit, ticketCount: monthA.ticketCount, customerCount: monthA.customerCount },
    range: { from: rangeFrom, to: rangeTo, stake: rangeA.stake, payout: rangeA.payout, profit: rangeA.profit, ticketCount: rangeA.ticketCount, customerCount: rangeA.customerCount },
    realtime: ownerRealtimeStats(),
    trend30d: ownerTrend30d(),
    topCustomersProfit, topCustomersLoss,
    topHeadHouses, topLotteriesProfit, topLotteriesLoss,
  });
});



// ===== LINE OA INFO SETTINGS =====
// CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value_json TEXT NOT NULL, updated_at TEXT NOT NULL);
db.exec(`
  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

const LINE_SETTINGS_DEFAULT = {
  liffId: "",
  banks: [
    { bankName: "", accountName: "", accountNumber: "", note: "" }
  ],
  payoutRates: {
    "หวยรัฐบาลไทย / ฮานอย / ลาว / มาเลย์": [
      { type: "3 ตัวบน", rate: "บาทละ 800" },
      { type: "3 ตัวโต๊ด", rate: "บาทละ 130" },
      { type: "2 ตัวบน", rate: "บาทละ 90" },
      { type: "2 ตัวล่าง", rate: "บาทละ 90" },
      { type: "วิ่งบน", rate: "บาทละ 3" },
      { type: "วิ่งล่าง", rate: "บาทละ 4" },
    ],
  },
  howTo: "พิมพ์ในรูปแบบนี้:\n• \"45 บน 100\" = เลข 45 บน 100 บาท\n• \"123 ตรง 50 โต๊ด 30\" = เลข 123 บน 50 / โต๊ด 30\n• \"วิ่ง 7 บน 20 ล่าง 20\"\n\nหรือกดปุ่ม \"สั่งซื้อหวย\" ในเมนูเพื่อกรอกในระบบ — เร็วกว่า มีเลขบิลส่งกลับให้ทันที",
  groups: [
    { title: "กลุ่มแนวทาง 1", url: "" },
    { title: "กลุ่มแนวทาง 2", url: "" },
  ],
  promoNote: "",
};

function loadLineSettings() {
  const row = db.prepare("SELECT value_json FROM app_settings WHERE key = ?").get("line_info");
  if (!row) return LINE_SETTINGS_DEFAULT;
  try {
    const parsed = JSON.parse(row.value_json);
    return { ...LINE_SETTINGS_DEFAULT, ...parsed };
  } catch (e) {
    return LINE_SETTINGS_DEFAULT;
  }
}

function saveLineSettings(value) {
  const now = nowIso();
  const json = JSON.stringify(value);
  db.prepare(`
    INSERT INTO app_settings (key, value_json, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
  `).run("line_info", json, now);
}



// Public pre-check: รู้ก่อน submit ว่าเลขนี้+ยอดนี้จะติด limit ไหม
app.get("/api/customer/check-limit", openRoundsRateLimit, (req, res) => {
  const roundId = cleanText(req.query.roundId, 80);
  const betTypeId = cleanText(req.query.betTypeId, 80);
  const number = String(req.query.number || "").replace(/\D/g, "");
  const amount = Number(req.query.amount);
  const round = findRound(roundId);
  const bt = findBetType(betTypeId);
  if (!round || !bt || number.length !== bt.digits || !Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({ ok: false, error: "invalid_payload" });
  }
  const limit = db.prepare("SELECT * FROM limits WHERE round_id = ? AND bet_type_id = ? AND number = ?").get(roundId, betTypeId, number);
  if (!limit) {
    return res.json({ ok: true, hasLimit: false });
  }
  const current = db.prepare(`
    SELECT COALESCE(SUM(entries.amount), 0) AS amount
    FROM entries
    LEFT JOIN tickets ON tickets.id = entries.ticket_id
    WHERE entries.round_id = ? AND entries.bet_type_id = ? AND entries.number = ?
      AND (entries.ticket_id IS NULL OR tickets.status IN ('pending_review', 'approved'))
  `).get(roundId, betTypeId, number).amount;
  const max = Number(limit.max_amount) || 0;
  const remaining = Math.max(0, max - current);
  const projected = current + amount;
  res.json({
    ok: projected <= max,
    hasLimit: true,
    max,
    current,
    remaining,
    requested: amount,
    projected,
  });
});

// Public read endpoint — safe data only

/* RATES-DYNAMIC: สร้าง payoutRates groups จาก DB ตามจริง */
function buildDynamicPayoutGroups() {
  /* group ละเอียด: รัฐบาลแยก thai/omsin/baac, ลาว/ฮานอย/มาเลย์ แยก, หวยหุ้น */
  function lotteryToGroup(lotteryId, name) {
    if (lotteryId === "thai") return "หวยรัฐบาลไทย";
    if (lotteryId === "omsin") return "หวยออมสิน";
    if (lotteryId === "baac") return "หวยธ.ก.ส.";
    const n = name || "";
    if (n.includes("ลาว")) return "หวยลาว";
    if (n.includes("ฮานอย")) return "หวยฮานอย";
    if (n.includes("มาเลเซีย") || n.includes("มาเลย์")) return "หวยมาเลเซีย";
    if (n.includes("เวียดนาม") || n.includes("ดานัง")) return "หวยเวียดนาม";
    return null;
  }
  const CATEGORY_LABEL = {
    "stock": "หวยหุ้น (ต่างประเทศ)",
    "stock_vip": "หวยหุ้น VIP",
  };
  const BET_LABEL = {
    "three_top": "3 ตัวบน",
    "three_tod": "3 ตัวโต๊ด",
    "three_bottom": "3 ตัวล่าง",
    "two_top": "2 ตัวบน",
    "two_bottom": "2 ตัวล่าง",
    "run_top": "วิ่งบน",
    "run_bottom": "วิ่งล่าง",
  };
  const BET_ORDER = ["three_top","three_tod","three_bottom","two_top","two_bottom","run_top","run_bottom"];
  /* ดึงทุก rate + lottery info */
  const rows = db.prepare(`
    SELECT l.id AS lottery_id, l.name AS lottery_name, l.category, pr.bet_type_id, pr.rate
    FROM payout_rates pr
    JOIN lotteries l ON l.id = pr.lottery_id
    WHERE pr.rate > 0
    ORDER BY l.category, l.id, pr.bet_type_id
  `).all();
  /* group: รัฐบาลใช้ลoteryToGroup, หุ้นใช้ CATEGORY_LABEL */
  const groupRows = {};
  for (const row of rows) {
    let label = null;
    if (row.category === "stock" || row.category === "stock_vip") {
      label = CATEGORY_LABEL[row.category];
    } else {
      label = lotteryToGroup(row.lottery_id, row.lottery_name);
    }
    if (!label) continue;
    if (!groupRows[label]) groupRows[label] = {};
    /* per bet_type ใน group — เก็บ rate ที่พบบ่อยสุด */
    const key = row.bet_type_id;
    if (!groupRows[label][key]) groupRows[label][key] = {};
    groupRows[label][key][row.rate] = (groupRows[label][key][row.rate] || 0) + 1;
  }
  /* pick most common rate per group/bet_type */
  const groups = {};
  for (const label of Object.keys(groupRows)) {
    groups[label] = {};
    for (const bt of Object.keys(groupRows[label])) {
      const rateCounts = groupRows[label][bt];
      let bestRate = 0, bestCount = 0;
      for (const [r, c] of Object.entries(rateCounts)) {
        if (c > bestCount || (c === bestCount && Number(r) > bestRate)) {
          bestRate = Number(r);
          bestCount = c;
        }
      }
      groups[label][bt] = { rate: bestRate, cnt: bestCount };
    }
  }
  /* format → output structure */
  const result = {};
  for (const label of Object.keys(groups)) {
    const items = [];
    for (const bt of BET_ORDER) {
      const entry = groups[label][bt];
      if (entry && entry.rate > 0) {
        items.push({ type: BET_LABEL[bt] || bt, rate: `บาทละ ${entry.rate}` });
      }
    }
    if (items.length) result[label] = items;
  }
  return result;
}

app.get("/api/public/line-info", (_req, res) => {
  const s = loadLineSettings();
  // sanitize (strip empty banks)
  const banks = (s.banks || []).filter((b) => b && (b.accountNumber || b.accountName));
  /* RATES-DYNAMIC: ใช้จาก DB ถ้ามี — fallback settings หรือ default */
  let payoutRates = {};
  try {
    payoutRates = buildDynamicPayoutGroups();
    if (Object.keys(payoutRates).length === 0) payoutRates = s.payoutRates || {};
  } catch (e) {
    console.warn("[rates] dynamic build failed", e.message);
    payoutRates = s.payoutRates || {};
  }
  res.json({
    banks,
    payoutRates,
    howTo: s.howTo || "",
    groups: (s.groups || []).filter((g) => g && g.url),
    promoNote: s.promoNote || "",
    orderUrl: s.liffId ? `https://liff.line.me/${s.liffId}` : "/order",
  });
});

// Admin read
app.get("/api/admin/line-settings", requireAuth, requireAdmin, (_req, res) => {
  res.json(loadLineSettings());
});

// Admin write
app.put("/api/admin/line-settings", requireAuth, requireAdmin, (req, res) => {
  const b = req.body || {};
  if (!b || typeof b !== "object") return res.status(400).json({ error: "invalid_body" });

  const value = {
    liffId: cleanText(b.liffId, 100),
    banks: Array.isArray(b.banks) ? b.banks.slice(0, 10).map((bank) => ({
      bankName: cleanText(bank.bankName, 80),
      accountName: cleanText(bank.accountName, 120),
      accountNumber: cleanText(bank.accountNumber, 40),
      note: cleanText(bank.note, 200),
    })) : [],
    payoutRates: (b.payoutRates && typeof b.payoutRates === "object" && !Array.isArray(b.payoutRates)) ? Object.fromEntries(
      Object.entries(b.payoutRates).slice(0, 20).map(([group, items]) => [
        cleanText(group, 80),
        Array.isArray(items) ? items.slice(0, 30).map((it) => ({
          type: cleanText(it.type, 80),
          rate: cleanText(it.rate, 120),
        })) : [],
      ])
    ) : {},
    howTo: cleanText(b.howTo, 2000),
    groups: Array.isArray(b.groups) ? b.groups.slice(0, 6).map((g) => ({
      title: cleanText(g.title, 80),
      url: cleanText(g.url, 500),
    })) : [],
    promoNote: cleanText(b.promoNote, 500),
  };
  saveLineSettings(value);
  logAudit(req.user.id, "update", "line_settings", "line_info", value);
  res.json(value);
});

// Public info page routes
app.get("/info", (_req, res) => res.sendFile(path.join(__dirname, "info-index.html")));
app.get("/info/account", (_req, res) => res.sendFile(path.join(__dirname, "info-account.html")));
app.get("/info/rates", (_req, res) => res.sendFile(path.join(__dirname, "info-rates.html")));
app.get("/info/howto", (_req, res) => res.sendFile(path.join(__dirname, "info-howto.html")));
app.get("/info/groups", (_req, res) => res.sendFile(path.join(__dirname, "info-groups.html")));
app.get("/info.css", (_req, res) => res.sendFile(path.join(__dirname, "info.css")));
app.get("/info.js", (_req, res) => res.sendFile(path.join(__dirname, "info.js")));



// Global error handler (P1) — catch malformed JSON + unhandled async errors
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error("[express-error]", { url: req.url, method: req.method, message: err.message, stack: err.stack?.split("\n").slice(0, 3) });
  if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ error: "invalid_json" });
  }
  res.status(500).json({ error: "internal_error" });
});

process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason?.message || reason);
});
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err?.message, err?.stack?.split("\n").slice(0, 5));
});

// ===== P3 BANK ACCOUNTS (2026-05-24) =====
db.exec(`
  CREATE TABLE IF NOT EXISTS bank_accounts (
    id TEXT PRIMARY KEY,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_holder TEXT NOT NULL,
    daily_limit INTEGER NOT NULL DEFAULT 100000,
    priority INTEGER NOT NULL DEFAULT 100,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','cooling','suspended')),
    note TEXT,
    total_received_today INTEGER NOT NULL DEFAULT 0,
    last_reset_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_bank_status_priority ON bank_accounts(status, priority);
`);

function bankAccountTodayKey() {
  // === S1: bank rotation atomic claim + Bangkok TZ ===
  // Use Intl.DateTimeFormat for true Asia/Bangkok regardless of VPS TZ
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit"
    });
    return fmt.format(new Date());  // "YYYY-MM-DD"
  } catch (e) {
    // Fallback: explicit +7 shift
    const d = new Date(Date.now() + 7 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  }
}
function maybeResetBankAccountDaily(acc) {
  const today = bankAccountTodayKey();
  if (acc.last_reset_date !== today) {
    /* R4-FIX: atomic — กัน 2 cron tick reset พร้อมกัน */
    db.prepare("UPDATE bank_accounts SET total_received_today = 0, last_reset_date = ?, updated_at = ? WHERE id = ? AND (last_reset_date IS NULL OR last_reset_date <> ?)")
      .run(today, nowIso(), acc.id, today);
    // Also auto-uncool if was cooled by limit
    if (acc.status === "cooling") {
      db.prepare("UPDATE bank_accounts SET status = 'active', updated_at = ? WHERE id = ?")
        .run(nowIso(), acc.id);
    }
    return { ...acc, total_received_today: 0, last_reset_date: today, status: acc.status === "cooling" ? "active" : acc.status };
  }
  return acc;
}
function refreshAllBankAccountsDaily() {
  const all = db.prepare("SELECT * FROM bank_accounts").all();
  all.forEach(maybeResetBankAccountDaily);
}
// Run daily refresh on boot + every 5 min (catches the midnight rollover without timezone math)
try { refreshAllBankAccountsDaily(); } catch (e) { console.error("[bank] init refresh failed:", e.message); }
setInterval(() => { try { refreshAllBankAccountsDaily(); } catch (e) {} }, 5 * 60 * 1000);

function nextAvailableBankAccount() {
  refreshAllBankAccountsDaily();
  /* S1: atomic claim — BEGIN IMMEDIATE locks the DB for writers, so 2 concurrent
     /next requests serialize. Account isn't mutated here (log-deposit does that)
     but the lock prevents racing with manual edits / log-deposit. */
  let acc = null;
  try {
    db.exec("BEGIN IMMEDIATE");
    acc = db.prepare(`
      SELECT * FROM bank_accounts
      WHERE status = 'active' AND total_received_today < daily_limit
      ORDER BY total_received_today ASC, priority ASC
      LIMIT 1
    `).get();
    db.exec("COMMIT");
  } catch (e) {
    try { db.exec("ROLLBACK"); } catch (_) {}
    /* Fall back to non-transactional read on lock-error */
    acc = db.prepare(`
      SELECT * FROM bank_accounts
      WHERE status = 'active' AND total_received_today < daily_limit
      ORDER BY total_received_today ASC, priority ASC
      LIMIT 1
    `).get();
  }
  return acc;
}

// --- Admin endpoints ---
app.get("/api/admin/bank-accounts", requireAuth, requireAdmin, (req, res) => {
  refreshAllBankAccountsDaily();
  const rows = db.prepare("SELECT * FROM bank_accounts ORDER BY priority ASC, created_at DESC").all();
  res.json(rows);
});

app.post("/api/admin/bank-accounts", requireAuth, requireAdmin, (req, res) => {
  const b = req.body || {};
  const bank_name = String(b.bank_name || "").trim();
  const account_number = String(b.account_number || "").trim();
  const account_holder = String(b.account_holder || "").trim();
  if (!bank_name || !account_number || !account_holder) {
    return res.status(400).json({ error: "missing_fields" });
  }
  const daily_limit = Math.max(0, Number(b.daily_limit) || 100000);
  const priority = Number(b.priority) || 100;
  const note = String(b.note || "");
  const id = crypto.randomUUID();
  const now = nowIso();
  db.prepare(`
    INSERT INTO bank_accounts (id, bank_name, account_number, account_holder,
      daily_limit, priority, status, note, total_received_today, last_reset_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?, 0, ?, ?, ?)
  `).run(id, bank_name, account_number, account_holder, daily_limit, priority, note, bankAccountTodayKey(), now, now);
  const created = db.prepare("SELECT * FROM bank_accounts WHERE id = ?").get(id);
  res.status(201).json(created);
});

app.put("/api/admin/bank-accounts/:id", requireAuth, requireAdmin, (req, res) => {
  const acc = db.prepare("SELECT * FROM bank_accounts WHERE id = ?").get(req.params.id);
  if (!acc) return res.status(404).json({ error: "not_found" });
  const b = req.body || {};
  const fields = [];
  const values = [];
  for (const k of ["bank_name", "account_number", "account_holder", "note"]) {
    if (b[k] !== undefined) { fields.push(`${k} = ?`); values.push(String(b[k]).trim()); }
  }
  if (b.daily_limit !== undefined) { fields.push("daily_limit = ?"); values.push(Math.max(0, Number(b.daily_limit) || 0)); }
  if (b.priority !== undefined) { fields.push("priority = ?"); values.push(Number(b.priority) || 100); }
  if (b.status !== undefined && ["active","cooling","suspended"].includes(b.status)) {
    fields.push("status = ?"); values.push(b.status);
  }
  if (!fields.length) return res.json(acc);
  fields.push("updated_at = ?");
  values.push(nowIso());
  values.push(req.params.id);
  db.prepare(`UPDATE bank_accounts SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  res.json(db.prepare("SELECT * FROM bank_accounts WHERE id = ?").get(req.params.id));
});

app.delete("/api/admin/bank-accounts/:id", requireAuth, requireAdmin, (req, res) => {
  const result = db.prepare("DELETE FROM bank_accounts WHERE id = ?").run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: "not_found" });
  res.json({ ok: true });
});

app.post("/api/admin/bank-accounts/:id/log-deposit", requireAuth, requireAdmin, (req, res) => {
  const acc = db.prepare("SELECT * FROM bank_accounts WHERE id = ?").get(req.params.id);
  if (!acc) return res.status(404).json({ error: "not_found" });
  maybeResetBankAccountDaily(acc);
  const fresh = db.prepare("SELECT * FROM bank_accounts WHERE id = ?").get(req.params.id);
  const amount = Math.max(0, Number(req.body?.amount) || 0);
  if (!amount) return res.status(400).json({ error: "amount_required" });
  const newTotal = fresh.total_received_today + amount;
  const overLimit = newTotal >= fresh.daily_limit;
  db.prepare(`UPDATE bank_accounts SET total_received_today = ?, status = ?, updated_at = ? WHERE id = ?`)
    .run(newTotal, overLimit && fresh.status === "active" ? "cooling" : fresh.status, nowIso(), req.params.id);
  res.json({ ok: true, total_received_today: newTotal, cooled: overLimit });
});

app.post("/api/admin/bank-accounts/reset-daily", requireAuth, requireAdmin, (req, res) => {
  const today = bankAccountTodayKey();
  db.prepare("UPDATE bank_accounts SET total_received_today = 0, last_reset_date = ?, status = CASE WHEN status = 'cooling' THEN 'active' ELSE status END, updated_at = ?")
    .run(today, nowIso());
  res.json({ ok: true });
});

// Public endpoint: next available account for /order page


// === S1: public bank /next rate-limit ===
const _bankNextHits = new Map();  // ip -> { count, resetAt }
function bankNextRateLimit(req, res, next) {
  const ip = (req.ip || req.connection?.remoteAddress || "unknown").toString();
  const now = Date.now();
  let rec = _bankNextHits.get(ip);
  if (!rec || rec.resetAt < now) {
    rec = { count: 0, resetAt: now + 60 * 1000 };
    _bankNextHits.set(ip, rec);
  }
  rec.count += 1;
  if (rec.count > 30) {
    return res.status(429).json({ error: "too_many_requests" });
  }
  next();
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of _bankNextHits.entries()) if (v.resetAt < now) _bankNextHits.delete(k);
}, 5 * 60 * 1000).unref();



// === Public read-only current account (ไม่ tick rotation) ===


/* ===== PUBLIC-RESULTS-V1: หน้าผลหวย public + 2 APIs ===== */
app.get("/results", (_req, res) => { res.set("Cache-Control", "no-cache, no-store, must-revalidate"); res.sendFile(path.join(__dirname, "results.html")); });
app.get("/results.html", (_req, res) => { res.set("Cache-Control", "no-cache, no-store, must-revalidate"); res.sendFile(path.join(__dirname, "results.html")); });

/* ===== PUSH-V2: pre-close + result-announce — segment-only Push (Free tier) ===== */
/* Dedup tables */
db.exec(`CREATE TABLE IF NOT EXISTS pre_close_pushes_v2 (
  id TEXT PRIMARY KEY, round_id TEXT NOT NULL, customer_id TEXT NOT NULL, sent_at TEXT NOT NULL,
  UNIQUE(round_id, customer_id)
);`);
db.exec(`CREATE TABLE IF NOT EXISTS result_announce_pushes_v2 (
  id TEXT PRIMARY KEY, round_id TEXT NOT NULL, customer_id TEXT NOT NULL, sent_at TEXT NOT NULL,
  UNIQUE(round_id, customer_id)
);`);

/* ----- Pre-close reminder ----- */
async function preCloseReminderCron() {
  if (process.env.FEATURES_PRECLOSE_REMINDER !== "true") return;
  try {
    const now = Date.now();
    const baseUrl = process.env.BASE_URL || "https://lottery.139-59-123-146.nip.io";
    const liffUrl = process.env.LIFF_URL || "https://liff.line.me/2010170072-GDDXzvaN";
    /* หา rounds ที่กำลังจะปิดใน 25-35 นาที (window กว้างนิด กัน cron miss) */
    const rounds = db.prepare(`
      SELECT r.id, r.lottery_id, r.label, r.draw_date, r.draw_time, l.name AS lottery_name
      FROM rounds r JOIN lotteries l ON l.id = r.lottery_id
      WHERE r.status = 'open' AND r.result_status = 'draft'
      ORDER BY r.draw_date, r.draw_time LIMIT 50
    `).all();

    for (const round of rounds) {
      /* คำนวณ close time = draw_date + draw_time - close_before_minutes (ถ้ามี) */
      const drawTs = new Date(`${round.draw_date}T${round.draw_time || "00:00"}+07:00`).getTime();
      /* V2 FIX: ใช้ close_before_minutes ลบจาก draw time */
      const closeBeforeMins = round.close_before_minutes || 0;
      const closeTs = drawTs - (closeBeforeMins * 60 * 1000);
      const minsLeft = (closeTs - now) / 60000;
      if (minsLeft < 25 || minsLeft > 35) continue;

      /* หาลูกค้า active 3 งวดล่าสุด ของ lottery_id นี้ */
      const activeCusts = db.prepare(`
        SELECT DISTINCT c.id, c.line_user_id, c.name FROM customers c
        JOIN tickets t ON t.customer_id = c.id
        JOIN rounds r2 ON r2.id = t.round_id
        WHERE r2.lottery_id = ? AND r2.draw_date >= date('now', '-30 days')
          AND c.line_user_id IS NOT NULL AND c.line_user_id != ''
      `).all(round.lottery_id);

      /* filter ลูกค้าที่ยังไม่ได้ส่งงวดนี้ */
      const submittedSet = new Set(db.prepare(`SELECT customer_id FROM tickets WHERE round_id = ?`).all(round.id).map(r => r.customer_id));
      const targets = activeCusts.filter(c => !submittedSet.has(c.id));

      const insertDedup = db.prepare("INSERT OR IGNORE INTO pre_close_pushes_v2 (id, round_id, customer_id, sent_at) VALUES (?, ?, ?, ?)");
      let pushed = 0;
      for (const cust of targets) {
        try {
          const claimed = insertDedup.run(crypto.randomUUID(), round.id, cust.id, nowIso());
          if (claimed.changes === 0) continue;

          const minsRound = Math.round(minsLeft);
          const flex = {
            type: "flex",
            altText: `${round.lottery_name} ปิดรับใน ${minsRound} นาที`,
            contents: {
              type: "bubble", size: "kilo",
              header: { type: "box", layout: "vertical", backgroundColor: "#dc2626", paddingAll: "12px",
                contents: [
                  { type: "text", text: `⏰ ใกล้ปิดรับ ${minsRound} นาที`, color: "#ffffff", weight: "bold", size: "md", align: "center" }
                ]
              },
              body: { type: "box", layout: "vertical", spacing: "sm", paddingAll: "14px", contents: [
                { type: "text", text: round.lottery_name, weight: "bold", size: "lg", color: "#0a3a23" },
                { type: "text", text: `งวด ${round.label || round.draw_date}`, size: "sm", color: "#6b7280" },
                { type: "separator", margin: "md" },
                { type: "text", text: `รีบสั่งซื้อก่อนปิดรับนะคะ 🙏`, size: "sm", color: "#374151", wrap: true, margin: "sm" },
                { type: "button", style: "primary", color: "#0f5132", height: "sm", margin: "md",
                  action: { type: "uri", label: "✍️ สั่งซื้อเลย", uri: liffUrl } }
              ]}
            }
          };
          await linePush(cust.line_user_id, flex);
          pushed++;
          await new Promise(r => setTimeout(r, 150));
        } catch (e) {
          console.warn("[pre-close-push]", cust.id, e.message);
          try { db.prepare("DELETE FROM pre_close_pushes_v2 WHERE round_id=? AND customer_id=?").run(round.id, cust.id); } catch {}
        }
      }
      if (pushed > 0) console.log(JSON.stringify({ ts: nowIso(), event: "pre_close_push", round_id: round.id, lottery: round.lottery_name, mins_left: Math.round(minsLeft), pushed }));
    }
  } catch (e) { console.warn("[pre-close-cron]", e.message); }
}

/* ----- Result announcement ----- */
async function announceResultToBuyers(roundId) {
  /* === UX-FIX-V1-NO-DUPLICATE-NOTIF (B3: feature flag) === */
  /* ลูกค้าที่ซื้องวดนี้จะได้ pushWinnersToCustomers / pushLosersToCustomers อยู่แล้ว */
  /* default: ปิด (อยู่เบื้องหลัง flag) — เปิดได้ด้วย FEATURES_RESULT_ANNOUNCE=true */
  if (process.env.FEATURES_RESULT_ANNOUNCE !== "true") return;
  try {
    const round = db.prepare(`SELECT r.*, l.name AS lottery_name FROM rounds r JOIN lotteries l ON l.id=r.lottery_id WHERE r.id=?`).get(roundId);
    if (!round) return;
    const baseUrl = process.env.BASE_URL || "https://lottery.139-59-123-146.nip.io";
    /* หาลูกค้าที่ซื้องวดนี้ */
    const buyers = db.prepare(`
      SELECT DISTINCT c.id, c.line_user_id, c.name FROM customers c
      JOIN tickets t ON t.customer_id = c.id
      WHERE t.round_id = ? AND c.line_user_id IS NOT NULL AND c.line_user_id != ''
    `).all(roundId);

    const insertDedup = db.prepare("INSERT OR IGNORE INTO result_announce_pushes_v2 (id, round_id, customer_id, sent_at) VALUES (?, ?, ?, ?)");
    let pushed = 0;
    for (const cust of buyers) {
      try {
        const claimed = insertDedup.run(crypto.randomUUID(), roundId, cust.id, nowIso());
        if (claimed.changes === 0) continue;
        const flex = {
          type: "flex",
          altText: `ผลออกแล้ว: ${round.lottery_name}`,
          contents: {
            type: "bubble", size: "kilo",
            header: { type: "box", layout: "vertical", backgroundColor: "#0f5132", paddingAll: "12px",
              contents: [
                { type: "text", text: `🎯 ผลออกแล้ว`, color: "#ffd966", weight: "bold", size: "md", align: "center" }
              ]
            },
            body: { type: "box", layout: "vertical", spacing: "sm", paddingAll: "14px", contents: [
              { type: "text", text: round.lottery_name, weight: "bold", size: "lg", color: "#0a3a23" },
              { type: "text", text: `งวด ${round.label || round.draw_date}`, size: "sm", color: "#6b7280" },
              { type: "separator", margin: "md" },
              { type: "text", text: `🔍 กดดูผลและตรวจสลิปได้เลยค่ะ`, size: "sm", color: "#374151", wrap: true, margin: "sm" },
              { type: "button", style: "primary", color: "#0f5132", height: "sm", margin: "md",
                action: { type: "uri", label: "📊 ดูผลรางวัล", uri: baseUrl + "/lotto" } }
            ]}
          }
        };
        await linePush(cust.line_user_id, flex);
        pushed++;
        await new Promise(r => setTimeout(r, 150));
      } catch (e) {
        console.warn("[result-announce]", cust.id, e.message);
        try { db.prepare("DELETE FROM result_announce_pushes_v2 WHERE round_id=? AND customer_id=?").run(roundId, cust.id); } catch {}
      }
    }
    if (pushed > 0) console.log(JSON.stringify({ ts: nowIso(), event: "result_announce_push", round_id: roundId, lottery: round.lottery_name, buyers: buyers.length, pushed }));
  } catch (e) { console.warn("[announce-result]", e.message); }
}

/* register cron pre-close ทุก 5 นาที (จับ window 25-35 min before close) */
registerCron("pre-close-reminder", preCloseReminderCron, 5 * 60 * 1000);
/* ===== END PUSH-V2 ===== */

/* RESULT-PATH-V2: path ใหม่ bypass Safari LIFF cache */
app.get("/lotto", (_req, res) => { res.set("Cache-Control", "no-cache, no-store, must-revalidate"); res.sendFile(path.join(__dirname, "results.html")); });
app.get("/show", (_req, res) => { res.set("Cache-Control", "no-cache, no-store, must-revalidate"); res.sendFile(path.join(__dirname, "results.html")); });

/* API 1: ผลล่าสุด — งวด finalized ล่าสุดของแต่ละหวย */
/* V2: in-memory cache 2 นาที — ลด CPU + improve response */
const __resultsLatestCache = { ts: 0, data: null };
const __RESULTS_LATEST_TTL = 2 * 60 * 1000;

app.get("/api/public/results-latest", (_req, res) => {
  try {
    /* cache hit */
    if (__resultsLatestCache.data && (Date.now() - __resultsLatestCache.ts) < __RESULTS_LATEST_TTL) {
      return res.json({ ok: true, items: __resultsLatestCache.data, cached: true, fetched_at: nowIso() });
    }

    /* V3: ALL lotteries — finalized round (ถ้ามี) + pending placeholder (ถ้าไม่มี) */
    const finalizedRows = db.prepare(`
      SELECT r.lottery_id, r.id AS round_id, r.draw_date, r.draw_time, r.result_time, r.result_finalized_at, r.label, r.result_status AS status,
             l.name AS lottery_name, l.category, l.display_order,
             res.bet_type_id, res.number
      FROM rounds r
      JOIN lotteries l ON l.id = r.lottery_id
      LEFT JOIN results res ON res.round_id = r.id
      WHERE r.id IN (
        SELECT id FROM rounds r2
        WHERE r2.lottery_id = r.lottery_id AND r2.result_status = 'finalized'
        ORDER BY r2.draw_date DESC, r2.draw_time DESC LIMIT 1
      )
      ORDER BY l.display_order ASC
    `).all();

    const pendingLotteries = db.prepare(`
      SELECT l.id AS lottery_id, l.name AS lottery_name, l.category, l.display_order,
             (SELECT MIN(r2.draw_date || ' ' || r2.draw_time)
                FROM rounds r2
                WHERE r2.lottery_id = l.id AND r2.result_status='draft') AS next_draw
      FROM lotteries l
      WHERE NOT EXISTS (SELECT 1 FROM rounds WHERE lottery_id=l.id AND result_status='finalized')
      ORDER BY l.display_order ASC
    `).all();

    const byRound = {};
    for (const x of finalizedRows) {
      if (!byRound[x.round_id]) {
        byRound[x.round_id] = {
          lottery_id: x.lottery_id, lottery_name: x.lottery_name, category: x.category,
          display_order: x.display_order, draw_date: x.draw_date, draw_time: x.draw_time,
          result_time: x.result_time, result_finalized_at: x.result_finalized_at,
          label: x.label, status: x.status, grouped: {},
        };
      }
      if (x.bet_type_id && x.number) {
        if (!byRound[x.round_id].grouped[x.bet_type_id]) byRound[x.round_id].grouped[x.bet_type_id] = [];
        byRound[x.round_id].grouped[x.bet_type_id].push(x.number);
      }
    }
    const finalizedItems = Object.values(byRound).map(r => ({
      lottery_id: r.lottery_id, lottery_name: r.lottery_name, category: r.category,
      display_order: r.display_order, draw_date: r.draw_date, draw_time: r.draw_time,
      result_time: r.result_time, result_finalized_at: r.result_finalized_at,
      label: r.label, status: r.status,
      three_top: r.grouped.three_top || null,
      three_bottom: r.grouped.three_bottom || null,
      two_top: r.grouped.two_top ? r.grouped.two_top[0] : null,
      two_bottom: r.grouped.two_bottom ? r.grouped.two_bottom[0] : null,
    }));
    const pendingItems = pendingLotteries.map(p => ({
      lottery_id: p.lottery_id, lottery_name: p.lottery_name, category: p.category,
      display_order: p.display_order,
      draw_date: p.next_draw ? p.next_draw.split(' ')[0] : null,
      label: null, status: 'pending', next_draw_at: p.next_draw,
      three_top: null, three_bottom: null, two_top: null, two_bottom: null,
    }));
    const items = [...finalizedItems, ...pendingItems].sort((a, b) => (a.display_order || 999) - (b.display_order || 999));
    /* update cache */
    __resultsLatestCache.ts = Date.now();
    __resultsLatestCache.data = items;
    res.json({ ok: true, items, cached: false, fetched_at: nowIso() });
  } catch (e) {
    console.warn("[results-latest]", e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* API 2: ผลย้อนหลัง — proxy /thailotto/history หรือ query DB ของหวยอื่น */
const __resultsHistoryCache = new Map(); /* key=lottery_id, value={ts, items} */
const __RESULTS_HISTORY_TTL = 5 * 60 * 1000; /* 5 นาที */

app.get("/api/public/results-history", async (req, res) => {
  const lottery = String(req.query.lottery || "thai");
  const cached = __resultsHistoryCache.get(lottery);
  if (cached && (Date.now() - cached.ts) < __RESULTS_HISTORY_TTL) {
    return res.json({ ok: true, items: cached.items, cached: true });
  }
  try {
    let items = [];
    if (lottery === "thai") {
      /* V2: timeout 5s + fallback to DB ถ้า upstream down */
      const key = process.env.APILOTTO_API_KEY;
      const base = process.env.APILOTTO_BASE_URL || "https://api.apilotto.com/api/v1";
      let arr = [];
      try {
        const ctrl = new AbortController();
        const tmr = setTimeout(() => ctrl.abort(), 5000);
        const r = await fetch(base + "/thailotto/history", {
          headers: { "x-api-key": key, "Content-Type": "application/json" },
          signal: ctrl.signal,
        });
        clearTimeout(tmr);
        if (r.ok) {
          const data = await r.json();
          arr = data?.data || [];
        } else { throw new Error("upstream_" + r.status); }
      } catch (upErr) {
        console.warn("[results-history] apilotto fail, fallback to DB:", upErr.message);
      }
      if (arr.length) {
        items = arr.map(x => ({
          date_th: x.date, no1: x.no1, three_top: x.prefix3, three_bottom: x.suffix3, two_bottom: x.suffix2,
        }));
      } else {
        /* fallback ไป DB — round ของ thai ที่ finalized 12 ตัวล่าสุด */
        const rows = db.prepare(`
          SELECT r.id, r.draw_date, r.label FROM rounds r
          WHERE r.lottery_id = 'thai' AND r.result_status = 'finalized'
          ORDER BY r.draw_date DESC LIMIT 12
        `).all();
        const stmtRes = db.prepare("SELECT bet_type_id, number FROM results WHERE round_id = ?");
        items = rows.map(r => {
          const results = stmtRes.all(r.id);
          const grouped = {};
          for (const x of results) {
            if (!grouped[x.bet_type_id]) grouped[x.bet_type_id] = [];
            grouped[x.bet_type_id].push(x.number);
          }
          return {
            date_th: r.label || r.draw_date,
            three_top: grouped.three_top || null,
            three_bottom: grouped.three_bottom || null,
            two_bottom: grouped.two_bottom ? grouped.two_bottom[0] : null,
          };
        });
      }
    } else {
      /* query DB — recent finalized rounds ของหวยนี้ */
      const rows = db.prepare(`
        SELECT r.id, r.draw_date, r.label
        FROM rounds r WHERE r.lottery_id = ? AND r.result_status = 'finalized'
        ORDER BY r.draw_date DESC LIMIT 20
      `).all(lottery);
      const stmtRes = db.prepare("SELECT bet_type_id, number FROM results WHERE round_id = ?");
      items = rows.map(r => {
        const results = stmtRes.all(r.id);
        const grouped = {};
        for (const x of results) {
          if (!grouped[x.bet_type_id]) grouped[x.bet_type_id] = [];
          grouped[x.bet_type_id].push(x.number);
        }
        return {
          draw_date: r.draw_date,
          label: r.label,
          three_top: grouped.three_top || null,
          three_bottom: grouped.three_bottom || null,
          two_top: grouped.two_top ? grouped.two_top[0] : null,
          two_bottom: grouped.two_bottom ? grouped.two_bottom[0] : null,
        };
      });
    }
    __resultsHistoryCache.set(lottery, { ts: Date.now(), items });
    res.json({ ok: true, items, cached: false });
  } catch (e) {
    console.warn("[results-history]", e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});
/* ===== END PUBLIC-RESULTS-V1 ===== */



/* ===== LOTTERY-STATS-V1: สถิติย้อนหลังต่อหวย (admin) ===== */
app.get("/api/admin/lottery-stats", requireAuth, requireAdmin, (req, res) => {
  const lotteryId = String(req.query.lottery || "thai");
  try {
    const lottery = db.prepare("SELECT id, name, category FROM lotteries WHERE id = ?").get(lotteryId);
    if (!lottery) return res.status(404).json({ ok: false, error: "lottery_not_found" });

    /* ดึง rounds + results — ล่าสุด 50 งวด */
    const rounds = db.prepare(`
      SELECT r.id, r.draw_date, r.label
      FROM rounds r
      WHERE r.lottery_id = ? AND r.result_status = 'finalized'
      ORDER BY r.draw_date DESC, r.draw_time DESC
      LIMIT 50
    `).all(lotteryId);

    const stmtRes = db.prepare("SELECT bet_type_id, number FROM results WHERE round_id = ?");
    const items = rounds.map(r => {
      const grouped = {};
      for (const x of stmtRes.all(r.id)) {
        if (!grouped[x.bet_type_id]) grouped[x.bet_type_id] = [];
        grouped[x.bet_type_id].push(x.number);
      }
      return { draw_date: r.draw_date, label: r.label, grouped };
    });

    /* ถ้า lottery=thai + DB น้อย → augment ด้วย /thailotto/history */
    if (lotteryId === "thai" && items.length < 12) {
      try {
        const key = process.env.APILOTTO_API_KEY;
        const base = process.env.APILOTTO_BASE_URL || "https://api.apilotto.com/api/v1";
        /* sync — แต่เราอยู่ใน sync handler ไม่ได้ใช้ await */
        /* skip — รอ apilotto async OK in production */
      } catch {}
    }

    /* ===== compute stats ===== */
    const counter = (arr) => {
      const m = {};
      for (const v of arr) m[v] = (m[v] || 0) + 1;
      return Object.entries(m).sort((a,b) => b[1] - a[1]);
    };

    /* hot numbers — top 10 ของแต่ละ bet_type */
    const hotByBetType = {};
    const allNumbers = { three_top: [], three_bottom: [], two_top: [], two_bottom: [] };
    items.forEach(it => {
      for (const bt of Object.keys(allNumbers)) {
        if (it.grouped[bt]) allNumbers[bt].push(...it.grouped[bt]);
      }
    });
    for (const bt of Object.keys(allNumbers)) {
      hotByBetType[bt] = counter(allNumbers[bt]).slice(0, 10);
    }

    /* cold numbers — เลขที่ห่างมานาน (เฉพาะ 2 ตัวล่าง — universe 100 เลข) */
    const cold2bot = [];
    const universe2 = [];
    for (let i = 0; i < 100; i++) universe2.push(String(i).padStart(2, "0"));
    const cold2bot_obj = {};
    universe2.forEach(n => { cold2bot_obj[n] = { number: n, last_seen_round: null, rounds_since: items.length }; });
    items.forEach((it, idx) => {
      const list = it.grouped.two_bottom || [];
      list.forEach(n => {
        const key = String(n).padStart(2, "0");
        if (cold2bot_obj[key] && cold2bot_obj[key].rounds_since === items.length) {
          cold2bot_obj[key].rounds_since = idx;
          cold2bot_obj[key].last_seen_round = it.draw_date;
        }
      });
    });
    const cold2bot_sorted = Object.values(cold2bot_obj).filter(x => x.rounds_since > 0).sort((a,b) => b.rounds_since - a.rounds_since).slice(0, 15);

    /* pattern stats — เบิ้ล/ตอง/นิ้ว/เรียง */
    const isNyiu = (s) => s.length === 2 && s[0] === s[1]; /* 11, 22 ... */
    const isTong = (s) => s.length === 3 && s[0] === s[1] && s[1] === s[2]; /* 111, 222 ... */
    const isBerl = (s) => s.length === 3 && !isTong(s) && new Set(s).size === 2; /* 112, 122, 121, 322 ... */
    const isReung = (s) => {
      if (s.length !== 3) return false;
      const digits = s.split("").map(Number);
      const asc = digits[1] === digits[0] + 1 && digits[2] === digits[1] + 1;
      const dsc = digits[1] === digits[0] - 1 && digits[2] === digits[1] - 1;
      return asc || dsc;
    };
    const pattern = { nyiu: 0, tong: 0, berl: 0, reung: 0 };
    items.forEach(it => {
      (it.grouped.three_top || []).forEach(n => {
        const s = String(n);
        if (isTong(s)) pattern.tong++;
        else if (isBerl(s)) pattern.berl++;
        if (isReung(s)) pattern.reung++;
      });
      (it.grouped.two_bottom || []).forEach(n => {
        if (isNyiu(String(n).padStart(2, "0"))) pattern.nyiu++;
      });
    });

    res.json({
      ok: true,
      lottery,
      rounds_count: items.length,
      date_range: { from: items[items.length-1]?.draw_date, to: items[0]?.draw_date },
      hot_numbers: hotByBetType,
      cold_2bottom: cold2bot_sorted,
      pattern,
    });
  } catch (e) {
    console.warn("[lottery-stats]", e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});
/* ===== END LOTTERY-STATS-V1 ===== */



/* ===== MY-ORDERS-V1: หน้าบิลของฉัน — public LIFF ===== */
app.get("/my-orders", (_req, res) => { res.set("Cache-Control", "no-cache"); res.sendFile(path.join(__dirname, "my-orders.html")); });
app.get("/my-orders.html", (_req, res) => { res.set("Cache-Control", "no-cache"); res.sendFile(path.join(__dirname, "my-orders.html")); });
app.get("/my-orders.js", (_req, res) => res.sendFile(path.join(__dirname, "my-orders.js")));

app.get("/api/customer/my-orders", (req, res) => {
  try {
    const lineUserId = String(req.query.line_user_id || "");
    if (!lineUserId) return res.json({ ok: true, items: [] });
    const cust = db.prepare("SELECT id, name FROM customers WHERE line_user_id = ?").get(lineUserId);
    if (!cust) return res.json({ ok: true, items: [] });

    /* V2: single JOIN — รวม winner_notifications สำหรับ prize_amount */
    const tickets = db.prepare(`
      SELECT t.id, t.code, t.status, t.total_amount, t.created_at,
             t.slip_image_url, t.reviewed_at,
             r.id AS round_id, r.draw_date, r.label, r.result_status,
             l.id AS lottery_id, l.name AS lottery_name,
             COALESCE(wn.total_payout, 0) AS prize_amount
      FROM tickets t
      JOIN rounds r ON r.id = t.round_id
      JOIN lotteries l ON l.id = r.lottery_id
      LEFT JOIN winner_notifications wn ON wn.round_id = r.id AND wn.customer_id = t.customer_id
      WHERE t.customer_id = ?
      ORDER BY t.created_at DESC LIMIT 50
    `).all(cust.id);

    /* batch fetch entries — 1 query */
    const ticketIds = tickets.map(t => t.id);
    const entriesByTicket = {};
    if (ticketIds.length) {
      const placeholders = ticketIds.map(() => "?").join(",");
      const allEntries = db.prepare(`
        SELECT e.ticket_id, e.id, e.bet_type_id, e.number, e.amount, bt.name AS bet_type_name
        FROM entries e JOIN bet_types bt ON bt.id = e.bet_type_id
        WHERE e.ticket_id IN (${placeholders})
        ORDER BY e.created_at
      `).all(...ticketIds);
      for (const e of allEntries) {
        if (!entriesByTicket[e.ticket_id]) entriesByTicket[e.ticket_id] = [];
        entriesByTicket[e.ticket_id].push({
          bet_type_id: e.bet_type_id,
          bet_type_name: e.bet_type_name,
          number: e.number,
          amount: e.amount,
        });
      }
    }

    const items = tickets.map(t => ({
      id: t.id,
      code: t.code,
      status: t.status,
      total_amount: t.total_amount,
      created_at: t.created_at,
      slip_uploaded: !!t.slip_image_url,
      lottery_id: t.lottery_id,
      lottery_name: t.lottery_name,
      draw_date: t.draw_date,
      label: t.label,
      has_result: t.result_status === "finalized",
      checked: t.result_status === "finalized",
      prize_amount: t.prize_amount || 0,
      paid_out: false,
      entries: entriesByTicket[t.id] || [],
    }));

    res.json({ ok: true, items, customer_name: cust.name });
  } catch (e) {
    console.warn("[my-orders]", e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});
/* ===== END MY-ORDERS-V1 ===== */

app.get("/api/public/bank-account/current", bankNextRateLimit, (req, res) => {
  refreshAllBankAccountsDaily();
  const acc = db.prepare(`
    SELECT id, bank_name, bank_code, account_number, account_holder, note, daily_limit, total_received_today, promptpay_id
    FROM bank_accounts
    WHERE status = 'active' AND total_received_today < daily_limit
    ORDER BY priority ASC, total_received_today ASC LIMIT 1
  `).get();
  if (!acc) return res.status(503).json({ error: "no_account_available", message: "ระบบไม่พร้อมรับโอนตอนนี้ — โปรดติดต่อ admin" });
  res.json({
    bank_name: acc.bank_name,
    bank_code: acc.bank_code || null,
    account_number: acc.account_number,
    account_holder: acc.account_holder,
    promptpay_id: acc.promptpay_id || null,
    note: acc.note || "",
    remaining_today: Math.max(0, acc.daily_limit - acc.total_received_today),
  });
});

app.get("/api/public/bank-account/next", bankNextRateLimit, (req, res) => {
  const acc = nextAvailableBankAccount();
  if (!acc) return res.status(503).json({ error: "no_account_available", message: "ระบบไม่พร้อมรับโอนตอนนี้ — โปรดติดต่อ admin" });
  // Only expose public-safe fields
  res.json({
    bank_name: acc.bank_name,
    account_number: acc.account_number,
    account_holder: acc.account_holder,
    note: acc.note || ""
  });
});


/* APILOTTO: adapter — ดึงผลจาก apilotto.com ตาม mapping */
/* APILOTTO: per-tick cache สำหรับ endpoint ที่ส่ง array (stocklotto, hanoilotto) — ลด API call ซ้ำ */
const __apilottoCache = new Map(); /* key: endpoint, value: {ts, data} */
const __APILOTTO_CACHE_TTL = 30 * 1000; /* 30s — แต่ละ cron tick ใช้ cache ร่วม */

async function fetchApilottoEndpoint(endpoint) {
  const cached = __apilottoCache.get(endpoint);
  if (cached && (Date.now() - cached.ts) < __APILOTTO_CACHE_TTL) return cached.data;
  const key = process.env.APILOTTO_API_KEY;
  const base = process.env.APILOTTO_BASE_URL || "https://api.apilotto.com/api/v1";
  const url = base + endpoint;
  /* retry 2x with 1s/3s backoff, timeout 8s per attempt */
  const attempts = [0, 1000, 3000];
  let lastErr = null;
  for (const delay of attempts) {
    if (delay) await new Promise(rs => setTimeout(rs, delay));
    const ctrl = new AbortController();
    const tmr = setTimeout(() => ctrl.abort(), 8000);
    try {
      const r = await fetch(url, { method: "GET", headers: { "x-api-key": key, "Content-Type": "application/json" }, signal: ctrl.signal });
      clearTimeout(tmr);
      if (!r.ok) { lastErr = "http_" + r.status; continue; }
      const data = await r.json();
      __apilottoCache.set(endpoint, { ts: Date.now(), data });
      return data;
    } catch (e) {
      clearTimeout(tmr);
      lastErr = "fetch_" + (e.name === "AbortError" ? "timeout" : e.message);
    }
  }
  throw new Error(lastErr || "unknown");
}

async function pullFromApilotto(lotteryId) {
  const key = process.env.APILOTTO_API_KEY;
  if (!key) return { ok: false, error: "no_api_key" };
  const src = db.prepare(`SELECT api_endpoint, name FROM result_sources WHERE lottery_id = ? AND provider='API Lotto' AND active=1 ORDER BY priority LIMIT 1`).get(lotteryId);
  if (!src) return { ok: false, error: "no_source" };
  const [endpoint, filterName] = src.api_endpoint.split("::");
  let resp;
  try { resp = await fetchApilottoEndpoint(endpoint); }
  catch (e) { return { ok: false, error: e.message }; }

  /* normalize → unified shape */
  let result;
  if (endpoint === "/getlastestlottery") {
    /* หวยรัฐบาลไทย */
    const d = resp?.response?.data || {};
    result = {
      drawDate: resp?.response?.date,
      first: d.first?.number?.[0]?.value,
      last2: d?.last2?.number?.[0]?.value,
      last3f: d?.last3f?.number?.map(x => x.value),
      last3b: d?.last3b?.number?.map(x => x.value),
      meta: { youtube: resp?.response?.youtube_url, pdf: resp?.response?.pdf_url, period: resp?.response?.period },
      raw: resp,
    };
  } else if (endpoint === "/thailotto/history") {
    /* PULL-THAI-FIX-V1: เลขจริงอยู่ที่นี่ (no1, prefix3, suffix3, suffix2) */
    const arr = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp?.response) ? resp.response : []);
    /* หา item ของวันที่ตรง draw_date (BE thai format → ISO match) */
    let item = null;
    if (filterName) {
      /* filterName = "latest" หรือ ISO date */
      if (filterName === "latest") item = arr[0];
      else item = arr.find(x => apilottoDateToIso(x.date) === filterName);
    } else item = arr[0];
    if (!item || !item.no1) return { ok: false, error: "not_drawn_yet" };
    const no1 = String(item.no1);
    const three_top_from_no1 = no1.slice(-3);
    const two_top_from_no1 = no1.slice(-2);
    result = {
      drawDate: apilottoDateToIso(item.date),
      first: no1,
      /* 2 ตัวบน/ล่าง */
      two_top: two_top_from_no1,
      two_bottom: String(item.suffix2 || "").padStart(2, "0"),
      /* 3 ตัวบน = เลขท้าย 3 ตัวของรางวัล 1 + 3 ตัวหน้า (prefix3) — ใช้ prefix3 ตาม pattern ของระบบ */
      three_top: Array.isArray(item.prefix3) ? item.prefix3.map(x => String(x).padStart(3,"0")) : [],
      three_bottom: Array.isArray(item.suffix3) ? item.suffix3.map(x => String(x).padStart(3,"0")) : [],
      /* 3 ตัวโต๊ด = 3 ตัวท้ายรางวัล 1 (sortDigits ตอน match) */
      three_tod: three_top_from_no1,
      /* run = digit ทุกตัวใน 3 ตัวบน */
      run_top: [...new Set(three_top_from_no1.split(""))],
      raw: item,
    };
  } else if (endpoint === "/laolotto") {
    const d = resp?.data || {};
    result = { drawDate: d.date, three_top: d.laolast3, two_top: d.laolast2?.top, two_bottom: d.laolast2?.bottom, four: d.laolast4, raw: resp };
  } else if (endpoint === "/malaylotto") {
    const d = resp?.data || {};
    result = { drawDate: d.date, three_top: d.malaylast3, two_top: d.malaylast2?.top, two_bottom: d.malaylast2?.bottom, four: d.malaylast4, raw: resp };
  } else if (endpoint === "/hanoilotto") {
    const arr = resp?.data || [];
    const item = arr.find(x => String(x.name) === String(filterName));
    if (!item || item.hanoilast4 === "xxxx") return { ok: false, error: "not_drawn_yet" };
    result = { drawDate: item.date, three_top: item.hanoilast3, two_top: item.hanoilast2?.top, two_bottom: item.hanoilast2?.bottom, four: item.hanoilast4, raw: item };
  } else if (endpoint === "/stocklotto") {
    const arr = resp?.data || [];
    const item = arr.find(x => String(x.name) === String(filterName));
    if (!item || item.stocklast3 === "xxx") return { ok: false, error: "not_drawn_yet" };
    result = { drawDate: item.date, three_top: item.stocklast3, two_bottom: item.stocklast2, raw: item };
  } else {
    return { ok: false, error: "unknown_endpoint" };
  }
  return { ok: true, lotteryId, result, fetchedAt: nowIso() };
}

/* APILOTTO: admin endpoint — manual test pull */
app.get("/api/admin/apilotto/test", requireAuth, requireAdmin, async (req, res) => {
  const lid = req.query.lottery_id || "thai";
  const r = await pullFromApilotto(String(lid));
  res.json(r);
});



/* APILOTTO: Thai BE date → ISO. Returns null if not parseable */
function apilottoDateToIso(s) {
  if (!s) return null;
  const str = String(s).trim();
  /* ISO format */
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  /* Thai: "3 มิถุนายน 2569" */
  const THAI_MONTH = {
    "มกราคม":1, "กุมภาพันธ์":2, "มีนาคม":3, "เมษายน":4, "พฤษภาคม":5, "มิถุนายน":6,
    "กรกฎาคม":7, "สิงหาคม":8, "กันยายน":9, "ตุลาคม":10, "พฤศจิกายน":11, "ธันวาคม":12,
  };
  const m = str.match(/(\d{1,2})\s+(\S+)\s+(\d{4})/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = THAI_MONTH[m[2]];
  let year = parseInt(m[3], 10);
  if (year > 2400) year -= 543;
  if (!day || !month || !year) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/* ===== SCRAPER-FRAMEWORK-V1 + CRITICAL-FIX-V1 ===== */
const __scraperCache = new Map();
const __SCRAPER_CACHE_TTL = 30 * 1000;
const __SCRAPER_CACHE_MAX = 200;

function __isPrivateHostname(h) {
  h = String(h || '').toLowerCase();
  if (!h || h === 'localhost' || h === '0.0.0.0') return true;
  if (/^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[01])\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true;
  if (h === '::1' || h.startsWith('fe80:') || h.startsWith('fc') || h.startsWith('fd')) return true;
  return false;
}
function __cacheKey(url) {
  try { const u = new URL(url); u.searchParams.delete('t'); u.searchParams.delete('_'); u.searchParams.delete('ts'); return u.toString(); } catch { return url; }
}
function __scraperCacheEvictIfFull() {
  if (__scraperCache.size <= __SCRAPER_CACHE_MAX) return;
  const cutoff = __scraperCache.size - __SCRAPER_CACHE_MAX + 10;
  let i = 0;
  for (const k of __scraperCache.keys()) { __scraperCache.delete(k); if (++i >= cutoff) break; }
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of __scraperCache.entries()) if (now - v.ts > __SCRAPER_CACHE_TTL) __scraperCache.delete(k);
}, 5 * 60 * 1000).unref();

async function fetchUrl(url, headers = {}) {
  try {
    const u = new URL(url);
    if (!['http:', 'https:'].includes(u.protocol)) throw new Error('bad_protocol');
    if (__isPrivateHostname(u.hostname)) throw new Error('private_ip_blocked');
  } catch (e) {
    if (e.message === 'bad_protocol' || e.message === 'private_ip_blocked') throw new Error('ssrf_' + e.message);
    throw new Error('invalid_url');
  }
  const key = __cacheKey(url);
  const cached = __scraperCache.get(key);
  if (cached && (Date.now() - cached.ts) < __SCRAPER_CACHE_TTL) return cached.data;
  const ctrl = new AbortController();
  const tmr = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json,text/plain,*/*",
        ...headers,
      },
      signal: ctrl.signal,
    });
    clearTimeout(tmr);
    if (!r.ok) throw new Error("http_" + r.status);
    const data = await r.json();
    __scraperCache.set(key, { ts: Date.now(), data });
    __scraperCacheEvictIfFull();
    return data;
  } catch (e) {
    clearTimeout(tmr);
    throw new Error("fetch_" + (e.name === "AbortError" ? "timeout" : e.message));
  }
}

function _calcStockNumber(date, price, change, raw) {
  if (price == null) return { ok: false, error: "no_price" };
  const priceStr = String(price);
  const [intPart, decPart = "00"] = priceStr.split(".");
  const unitDigit = intPart.slice(-1); /* หลักหน่วยของ integer */
  const decTwo = (decPart + "00").slice(0, 2); /* ทศนิยม 2 หลักแรก */
  const three_top = unitDigit + decTwo; /* 3 ตัวบน */
  const two_top = decTwo; /* 2 ตัวบน = ทศนิยม 2 หลัก */
  /* 2 ตัวล่าง = ทศนิยมของ Change */
  let two_bottom = null;
  if (change != null) {
    const chgStr = String(Math.abs(parseFloat(change))).split(".");
    if (chgStr.length > 1) two_bottom = (chgStr[1] + "00").slice(0, 2);
  }
  return {
    ok: true,
    result: {
      drawDate: date,
      three_top, two_top, two_bottom,
      three_tod: three_top,
      run_top: [...new Set(three_top.split(""))],
      raw: { price, change, ...raw },
    },
  };
}

/* Parser 5: hanoi_prize — สำหรับ xoso* family (ฮานอย)
   API: api.{site}.com/result
   Response: { data: { results: { prize_1st, prize_2nd, prize_3rd_1, ..., prize_5th_X, prize_6th_X } } }
   3 บน = 3 หลักท้าย prize_1st
   2 ล่าง = 2 หลักท้าย prize_5th_4 หรือ prize_6th_3
*/
function parseHanoiPrize(resp) {
  const d = resp?.data;
  if (!d || !d.results) return { ok: false, error: "no_data" };
  const r = d.results;
  /* fallback: ถ้า prize_1st null ใช้ prize_2nd, prize_3rd_1, special_1 */
  const p1 = r.prize_1st || r.prize_2nd || r.prize_3rd_1 || r.special_1;
  if (!p1) return { ok: false, error: "not_drawn_yet" };
  const three_top = String(p1).slice(-3);
  const two_top = String(p1).slice(-2);
  /* 2 ตัวล่าง ใช้ 2 หลักท้ายของ prize_5th_4 (ตามมาตรฐานหวยฮานอยใต้ดิน) */
  const two_src = r.prize_5th_4 || r.prize_5th_1 || r.prize_6th_3 || r.consolation_1;
  const two_bottom = two_src ? String(two_src).slice(-2) : null;
  return {
    ok: true,
    result: {
      drawDate: d.lotto_date,
      first: String(p1),
      three_top, two_top, two_bottom,
      three_tod: three_top,
      run_top: [...new Set(three_top.split(""))],
      raw: d,
    },
  };
}

/* Parser 9: laostarsvip_fp — bypass fingerprint protection
   API: api.laostarsvip.com/result → return HTML with tr_uuid
   Then fetch http://api.laostarsvip.com/result?tr_uuid=XXX&fp=-3
   (fp=-3 = noscript fallback)
*/
async function fetchLaostarsVip() {
  const ctrl = new AbortController();
  const tmr = setTimeout(() => ctrl.abort(), 8000);
  try {
    /* Step 1: get HTML with tr_uuid */
    const r1 = await fetch("https://api.laostarsvip.com/result", {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "text/html" },
      signal: ctrl.signal,
    });
    const html = await r1.text();
    const m = html.match(/tr_uuid=([a-f0-9-]+)/);
    if (!m) throw new Error("no_tr_uuid");
    const trUuid = m[1];

    /* Step 2: fetch JSON with fp=-3 fallback */
    const r2 = await fetch(`http://api.laostarsvip.com/result?tr_uuid=${trUuid}&fp=-3`, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
      signal: ctrl.signal, redirect: "follow",
    });
    clearTimeout(tmr);
    if (!r2.ok) throw new Error("http_" + r2.status);
    return await r2.json();
  } catch (e) {
    clearTimeout(tmr);
    throw new Error("laostarsvip_" + (e.name === "AbortError" ? "timeout" : e.message));
  }
}

function parseLaostarsVipFp(resp) {
  /* same shape as lao_standard */
  return parseLaoStandard(resp);
}

/* Parser 10: puppeteer — spawn child process ที่ใช้ Chrome headless
   api_endpoint format: "puppeteer::script.mjs"
   url: target URL (ส่งเป็น argv[2])
*/
import { spawn } from "node:child_process";

const __PUPPETEER_ALLOWED = new Set([
  'scrape-egx-investing.mjs',
  'scrape-laostarsvip.mjs',
  'scrape-saihuay.mjs',
  'scrape-saihuay-baac.mjs',
]);
async function fetchPuppeteer(scriptName, targetUrl) {
  if (!/^[a-z0-9._-]+\.mjs$/i.test(scriptName)) throw new Error('puppeteer_invalid_script_name');
  if (!__PUPPETEER_ALLOWED.has(scriptName)) throw new Error('puppeteer_script_not_allowlisted');
  if (targetUrl) {
    try {
      const u = new URL(targetUrl);
      if (!['http:', 'https:'].includes(u.protocol)) throw new Error('puppeteer_ssrf_bad_protocol');
      if (__isPrivateHostname(u.hostname)) throw new Error('puppeteer_ssrf_private_ip');
    } catch (e) { throw new Error(e.message.startsWith('puppeteer_') ? e.message : 'puppeteer_invalid_url'); }
  }
  return new Promise((resolve, reject) => {
    const scriptPath = '/var/www/lottery-manager/scripts/' + scriptName;
    let settled = false;
    const child = spawn('node', [scriptPath, targetUrl || ''], {
      cwd: '/var/www/lottery-manager',
      env: { ...process.env, NODE_PATH: '/var/www/lottery-manager/node_modules', HOME: '/tmp' },
    });
    const killTimer = setTimeout(() => {
      if (settled) return;
      try { child.kill('SIGKILL'); } catch {}
      settled = true;
      reject(new Error('puppeteer_timeout'));
    }, 30000);
    let stdout = '', stderr = '';
    child.stdout.on('data', d => stdout += d.toString());
    child.stderr.on('data', d => stderr += d.toString());
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(killTimer);
      if (code !== 0) return reject(new Error('puppeteer_exit_' + code + ': ' + stderr.slice(0, 200)));
      try { resolve(JSON.parse(stdout.trim().split(/\n/).pop())); }
      catch (e) { reject(new Error('puppeteer_parse_error: ' + stdout.slice(0, 100))); }
    });
    child.on('error', e => {
      if (settled) return;
      settled = true;
      clearTimeout(killTimer);
      reject(new Error('puppeteer_spawn_' + e.message));
    });
  });
}

function parsePuppeteerResult(resp) {
  if (!resp || !resp.ok) return { ok: false, error: resp?.error || "puppeteer_failed" };
  return {
    ok: true,
    result: {
      drawDate: resp.drawDate,
      three_top: resp.three_top,
      two_top: resp.two_top,
      two_bottom: resp.two_bottom,
      three_tod: resp.three_tod || resp.three_top,
      run_top: resp.run_top || [],
      raw: resp.raw,
    },
  };
}

/* PHASE-B-DEAD-CODE-REMOVED */
/* Main entry: pullFromScraper(lotteryId) — ทำงานเหมือน pullFromApilotto */
async function pullFromScraper(lotteryId) {
  const src = db.prepare(`SELECT api_endpoint, url, name FROM result_sources WHERE lottery_id = ? AND provider='Scraper' AND active=1 ORDER BY priority LIMIT 1`).get(lotteryId);
  if (!src) return { ok: false, error: "no_scraper_source" };
  const [parserName, filterName] = String(src.api_endpoint || "").split("::");
  let resp;
  try {
    if (parserName === "laostarsvip_fp") {
      resp = await fetchLaostarsVip();
    } else if (parserName === "puppeteer") {
      resp = await fetchPuppeteer(filterName, src.url);
    } else {
      const headers = {};
      if (src.url.includes("stocks-vip.com")) headers["Origin"] = "https://stocks-vip.com";
      if (src.url.includes("lottosuperrich.com")) headers["Origin"] = "https://lottosuperrich.com";
      if (src.url.includes("dowjonespowerball")) headers["Origin"] = "https://dowjonespowerball.com";
      resp = await fetchUrl(src.url + (src.url.includes("?") ? "&" : "?") + "t=" + Date.now(), headers);
    }
  } catch (e) { return { ok: false, error: e.message }; }

  let parsed;
  /* PHASE-B-WIRED: use parser registry */
  const parserFn = getParser(parserName);
  if (parserFn) parsed = parserFn(resp, filterName);
  else return { ok: false, error: "unknown_parser:" + parserName };

  if (!parsed.ok) return { ok: false, error: parsed.error };
  return { ok: true, lotteryId, result: parsed.result, fetchedAt: nowIso() };
}

/* admin endpoint test */
app.get("/api/admin/scraper/test", requireAuth, requireAdmin, async (req, res) => {
  const lid = req.query.lottery_id || "";
  if (!lid) return res.status(400).json({ ok: false, error: "missing_lottery_id" });
  const r = await pullFromScraper(String(lid));
  res.json(r);
});

/* ===== END SCRAPER-FRAMEWORK-V1 ===== */

/* === DISCORD-RESULT-NOTIFIER-V2 === centralized — works for all finalize paths
 * Aggregates ผลจาก `results` table (no round_results), join lotteries
 * source: "apilotto" | "scraper" | "stock-scraper" | "manual" | "import"
 */
async function notifyResultFinalized(roundId, source) {
  try {
    const row = db.prepare(`
      SELECT r.id, r.label, r.draw_date, r.lottery_id,
             l.name AS lottery_name
      FROM rounds r
      JOIN lotteries l ON l.id = r.lottery_id
      WHERE r.id = ?
    `).get(roundId);
    if (!row) return;

    /* aggregate ผลตาม bet_type จาก results table */
    const resultRows = db.prepare(
      "SELECT bet_type_id, number FROM results WHERE round_id = ? ORDER BY bet_type_id, number"
    ).all(roundId);
    const numByBt = {};
    for (const rr of resultRows) {
      if (!numByBt[rr.bet_type_id]) numByBt[rr.bet_type_id] = [];
      numByBt[rr.bet_type_id].push(rr.number);
    }
    const three_top   = (numByBt.three_top   || []).join(", ");
    const two_bottom  = (numByBt.two_bottom  || []).join(", ");

    /* count buyers + stake สำหรับ context */
    const stats = db.prepare(`
      SELECT COUNT(DISTINCT t.customer_id) AS customers,
             COALESCE(SUM(e.amount), 0) AS total_stake
      FROM entries e
      JOIN tickets t ON t.id = e.ticket_id
      WHERE t.round_id = ? AND t.status IN ('approved','pending_review')
    `).get(roundId) || { customers: 0, total_stake: 0 };

    /* count winners — ดูจาก winner_notifications ที่ pushWinnersToCustomers บันทึก
     * (helper อาจถูกเรียกก่อน push เสร็จ — return 0 ถ้ายังไม่มี) */
    let winners = { count: 0 };
    try {
      winners = db.prepare(
        "SELECT COUNT(*) AS count FROM winner_notifications WHERE round_id = ?"
      ).get(roundId) || { count: 0 };
    } catch (_) { /* table อาจไม่มีตอน early boot */ }

    return notifyDiscord("results", {
      embeds: [makeEmbed({
        title: "🎰 ผลออก — " + safeName(row.lottery_name || row.lottery_id),
        description: "งวด " + safeName(row.label || row.draw_date || row.id),
        color: 0xffd700,
        fields: [
          { name: "3 ตัวบน", value: safeName(three_top) || "—", inline: true },
          { name: "2 ตัวล่าง", value: safeName(two_bottom) || "—", inline: true },
          { name: "ลูกค้า", value: (stats.customers || 0) + " คน · " + Number(stats.total_stake || 0).toLocaleString() + " บาท", inline: false },
          ...(winners.count > 0 ? [{ name: "🏆 ผู้ถูก", value: winners.count + " คน", inline: true }] : []),
        ],
        footer: "auto-pulled by " + safeName(source || "system"),
      })],
    }).catch(() => {});
  } catch (e) {
    console.warn("[discord-result-notify]", e.message);
  }
}
/* === VENDOR-HEALTH-V1 (B.1.2) === update health counters per pull attempt
 * Called after pullFromApilotto/pullFromScraper to track success/fail per source.
 * Looks up source_id from result_sources by lottery_id + provider.
 */
function updateVendorHealth(lotteryId, provider, success, errorMsg) {
  try {
    const src = db.prepare(
      "SELECT id FROM result_sources WHERE lottery_id = ? AND provider = ? AND active = 1 ORDER BY priority LIMIT 1"
    ).get(lotteryId, provider);
    if (!src) return;
    const now = nowIso();
    if (success) {
      db.prepare(`
        INSERT INTO vendor_health_tracker (source_id, last_success_at, consecutive_fails, total_polls, total_success, total_fail, updated_at)
        VALUES (?, ?, 0, 1, 1, 0, ?)
        ON CONFLICT(source_id) DO UPDATE SET
          last_success_at = excluded.last_success_at,
          consecutive_fails = 0,
          total_polls = total_polls + 1,
          total_success = total_success + 1,
          updated_at = excluded.updated_at
      `).run(src.id, now, now);
    } else {
      const safeErr = String(errorMsg || "unknown").slice(0, 200);
      db.prepare(`
        INSERT INTO vendor_health_tracker (source_id, last_fail_at, last_error, consecutive_fails, total_polls, total_success, total_fail, updated_at)
        VALUES (?, ?, ?, 1, 1, 0, 1, ?)
        ON CONFLICT(source_id) DO UPDATE SET
          last_fail_at = excluded.last_fail_at,
          last_error = excluded.last_error,
          consecutive_fails = consecutive_fails + 1,
          total_polls = total_polls + 1,
          total_fail = total_fail + 1,
          updated_at = excluded.updated_at
      `).run(src.id, now, safeErr, now);
    }
  } catch (e) {
    console.warn("[vendor-health]", e.message);
  }
}


/* APILOTTO Phase A: apply pulled data → upsert results into a round */
async function applyApilottoToRound(roundId) {
  const round = db.prepare("SELECT * FROM rounds WHERE id = ?").get(roundId);
  if (!round) return { ok: false, error: "round_not_found" };
  if (round.result_status === "finalized") return { ok: false, error: "result_finalized" };

  /* SCRAPER-FRAMEWORK-V1: ลอง apilotto ก่อน, ถ้าไม่มี source ลอง scraper */
  let pulled = await pullFromApilotto(round.lottery_id);
  /* B.1.2 VENDOR-HEALTH-V1: track apilotto outcome (skip no_source) */
  if (pulled.ok) updateVendorHealth(round.lottery_id, "API Lotto", true, null);
  else if (pulled.error !== "no_source") updateVendorHealth(round.lottery_id, "API Lotto", false, pulled.error);
  if (!pulled.ok && pulled.error === "no_source") {
    pulled = await pullFromScraper(round.lottery_id);
    if (pulled.ok) updateVendorHealth(round.lottery_id, "Scraper", true, null);
    else if (pulled.error !== "no_scraper_source") updateVendorHealth(round.lottery_id, "Scraper", false, pulled.error);
  }
  if (!pulled.ok) return { ok: false, error: pulled.error || "pull_failed" };
  const r = pulled.result;

  /* CRITICAL: apilotto returns latest only — must match this round's draw_date */
  const apilottoIso = apilottoDateToIso(r.drawDate);
  if (!apilottoIso) {
    return { ok: false, error: "apilotto_date_unparseable", apilottoDate: r.drawDate };
  }
  if (apilottoIso !== round.draw_date) {
    return { ok: false, error: "date_mismatch", apilottoDate: apilottoIso, roundDate: round.draw_date };
  }

  /* normalize fields → array of {bet_type_id, numbers[]} */
  const updates = [];
  const __push = (bt, val) => {
    if (val == null) return;
    const nums = Array.isArray(val) ? val : [val];
    if (nums.length) updates.push({ bt, nums });
  };
  /* universal mapping — รองรับทั้ง single + array (PULL-THAI-FIX-V1) */
  __push("three_top", r.three_top);
  __push("two_top", r.two_top);
  __push("two_bottom", r.two_bottom);
  __push("three_bottom", r.three_bottom);
  __push("three_tod", r.three_tod);
  __push("run_top", r.run_top);
  /* legacy /getlastestlottery — หวยรัฐบาล: arrays + last2 single (deprecated path) */
  if (Array.isArray(r.last3f) && r.last3f.length) updates.push({ bt: "three_top", nums: r.last3f });
  if (Array.isArray(r.last3b) && r.last3b.length) updates.push({ bt: "three_bottom", nums: r.last3b });
  if (r.last2) updates.push({ bt: "two_bottom", nums: [r.last2] });
  /* stocklotto — เลข 2 ตัวล่าง */
  /* (handled by r.two_bottom already via adapter normalization) */

  if (!updates.length) return { ok: false, error: "no_data_to_apply", raw: r };

  /* AUTO-FINALIZE: ดู source ของหวยนี้ว่า auto_confirm=1 ไหม */
  const srcRow = db.prepare("SELECT auto_confirm FROM result_sources WHERE lottery_id = ? AND active=1 ORDER BY priority ASC LIMIT 1").get(round.lottery_id);
  const shouldFinalize = !!(srcRow && srcRow.auto_confirm);

  const now = nowIso();
  const inserted = [];
  /* CRITICAL-FIX-V1: track race-safe finalize */
  let finalizedNow = 0;
  withTransaction(() => {
    for (const u of updates) {
      db.prepare("DELETE FROM results WHERE round_id = ? AND bet_type_id = ?").run(roundId, u.bt);
      const stmt = db.prepare(`INSERT OR IGNORE INTO results (id, round_id, bet_type_id, number, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)`);
      for (const n of u.nums) {
        if (!n) continue;
        const num = String(n).replace(/\D/g, "");
        if (!num) continue;
        const id = crypto.randomUUID();
        stmt.run(id, roundId, u.bt, num, now, now);
        inserted.push({ id, round_id: roundId, bet_type_id: u.bt, number: num });
      }
    }
    if (shouldFinalize && inserted.length) {
      const upd = db.prepare("UPDATE rounds SET result_status='finalized', result_finalized_by=?, result_finalized_at=?, updated_at=? WHERE id=? AND result_status='draft'")
        .run('system:apilotto', now, now, roundId);
      finalizedNow = upd.changes; /* 0 = race lost (อีก process finalize ไปแล้ว) */
    }
  });
  /* CRITICAL-FIX-V1: เช็ค finalizedNow > 0 ป้องกัน push ซ้ำเมื่อ race */
  if (shouldFinalize && inserted.length && finalizedNow > 0) {
    broadcastResultToGroups(roundId).catch(()=>{});
    /* push winners ก่อน แล้ว push losers ตามหลัง 30 วินาที (ให้ dedup winners บันทึกก่อน) */
    /* GROUP-BROADCAST-V1: broadcast ผลลงกลุ่ม */
    try { announceResultToBuyers(roundId); } catch {}
    pushWinnersToCustomers(roundId).then(() => {
      setTimeout(() => pushLosersToCustomers(roundId).catch(()=>{}), 30000);
    }).catch(()=>{});
  }
  /* === DISCORD-HOOK-1 v2 === ใช้ centralized helper (รองรับทุก finalize path) */
  if (shouldFinalize && inserted.length && finalizedNow > 0) {
    const __dProv = (r.meta && (r.meta.provider || r.meta.source)) || "apilotto";
    notifyResultFinalized(roundId, __dProv).catch(() => {});
  }
  return { ok: true, roundId, lottery_id: round.lottery_id, drawDate: r.drawDate, inserted, finalized: shouldFinalize && finalizedNow > 0, sourceMeta: r.meta || null };
}

/* ===== MONTHLY-LOTTO-ALERT-V1: แจ้งบอสตอน ออมสิน/ธ.ก.ส. ออกผล ===== */
async function sendMonthlyLottoAlert(lotteryName, lotteryId) {
  try {
    const bossId = getBossLineUserId ? getBossLineUserId() : (process.env.BOSS_LINE_USER_ID || null);
    if (!bossId) return console.warn("[monthly-alert] no BOSS_LINE_USER_ID");
    const token = process.env.LINE_CHANNEL_TOKEN;
    if (!token) return console.warn("[monthly-alert] no LINE_CHANNEL_TOKEN");

    const msg = {
      type: "text",
      text: `🎰 ${lotteryName} ออกผลแล้ว!\n\nบอสเข้าระบบกด "import ผล" ของหวยนี้ได้เลย\n\nหวย: ${lotteryName}\nรหัส: ${lotteryId}\nเวลา: ${new Date().toLocaleString('th-TH', {timeZone: 'Asia/Bangkok'})}\n\n→ https://lottery.139-59-123-146.nip.io/`,
    };

    const r = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ to: bossId, messages: [msg] }),
    });
    if (r.ok) console.log(`[monthly-alert] sent ${lotteryName}`);
    else console.warn(`[monthly-alert] LINE fail ${r.status}`);
  } catch (e) { console.warn("[monthly-alert]", e.message); }
}

/* check ทุกนาที — ตอน 11:00 ของวันที่ 1 หรือ 16 = ส่ง alert */
let __lastMonthlyAlertDate = null;
setInterval(() => {
  const now = new Date();
  const bkkOffset = 7 * 60;
  const bkk = new Date(now.getTime() + bkkOffset * 60000);
  const day = bkk.getUTCDate();
  const h = bkk.getUTCHours();
  const m = bkk.getUTCMinutes();
  const dateKey = bkk.toISOString().slice(0, 10);
  if (h === 11 && m < 5 && __lastMonthlyAlertDate !== dateKey) {
    if (day === 1) {
      __lastMonthlyAlertDate = dateKey;
      sendMonthlyLottoAlert("ออมสิน", "omsin");
    } else if (day === 16) {
      __lastMonthlyAlertDate = dateKey;
      sendMonthlyLottoAlert("ออมสิน + ธ.ก.ส.", "omsin+baac");
    }
  }
}, 60 * 1000).unref();

/* admin endpoint: test trigger */
app.post("/api/admin/monthly-alert/test", requireAuth, requireAdmin, async (req, res) => {
  const name = String(req.body?.lottery_name || "ทดสอบ");
  const id = String(req.body?.lottery_id || "test");
  await sendMonthlyLottoAlert(name, id);
  res.json({ ok: true });
});
/* ===== END MONTHLY-LOTTO-ALERT-V1 ===== */

/* ===== NIGHTLY-CLEANUP-V1: ลบ overdue rounds ที่ไม่มี bills ===== */
function cleanupOverdueRounds() {
  try {
    const r = db.prepare(`
      DELETE FROM rounds
      WHERE (result_status IS NULL OR result_status='draft')
        AND draw_date < date('now')
        AND id NOT IN (SELECT DISTINCT round_id FROM tickets WHERE round_id IS NOT NULL)
    `).run();
    if (r.changes > 0) {
      console.log(`[nightly-cleanup] deleted ${r.changes} overdue rounds`);
    }
    return { deleted: r.changes };
  } catch (e) {
    console.warn("[nightly-cleanup]", e.message);
    return { error: e.message };
  }
}

/* run nightly at 03:00 Bangkok (UTC 20:00) — check every minute */
let __lastCleanupDate = null;
setInterval(() => {
  const now = new Date();
  const bkkOffset = 7 * 60; /* +07:00 */
  const bkk = new Date(now.getTime() + bkkOffset * 60000);
  const h = bkk.getUTCHours();
  const m = bkk.getUTCMinutes();
  const dateKey = bkk.toISOString().slice(0, 10);
  if (h === 3 && m < 5 && __lastCleanupDate !== dateKey) {
    __lastCleanupDate = dateKey;
    cleanupOverdueRounds();
  }
}, 60 * 1000).unref();

/* admin endpoint: manual trigger */
app.post("/api/admin/cleanup-overdue-rounds", requireAuth, requireAdmin, (req, res) => {
  const r = cleanupOverdueRounds();
  try { logAudit(req.user.id, "cleanup", "overdue_rounds", null, r); } catch(e){}
  res.json({ ok: !r.error, ...r });
});
/* ===== END NIGHTLY-CLEANUP-V1 ===== */

/* ===== SELF-HEALING WATCHDOG V1 — 3 cron + Discord alerts ===== */

/* === WATCHDOG-AUTO-RECOVER-V1 === ทุก 3 นาที */
setInterval(async () => {
  try {
    // PHASE-0 WATCHDOG-VALIDATE-V1 — require >=3 distinct bet_types before auto-finalize
    const stuck = db.prepare(`
      SELECT r.id, r.lottery_id, l.name AS lottery_name, r.draw_date, r.draw_time,
             COUNT(DISTINCT rs.bet_type_id) AS bet_type_count,
             COUNT(rs.id) AS result_count
      FROM rounds r
      JOIN lotteries l ON l.id = r.lottery_id
      JOIN results rs ON rs.round_id = r.id
      WHERE r.result_status = 'draft'
        AND r.draw_date >= date('now', '-2 days')
      GROUP BY r.id
      HAVING bet_type_count >= 3
      LIMIT 50
    `).all();
    if (stuck.length === 0) return;

    const now = new Date().toISOString();
    let recovered = 0;
    for (const row of stuck) {
      try {
        const upd = db.prepare(`UPDATE rounds SET result_status='finalized',
          result_finalized_by='system-watchdog-recover', result_finalized_at=?, updated_at=?
          WHERE id=? AND result_status='draft'`).run(now, now, row.id);
        if (upd.changes > 0) {
          recovered++;
          notifyResultFinalized(row.id, "watchdog-recover").catch(() => {});
          try { pushWinnersToCustomers(row.id); } catch {}
          setTimeout(() => { try { pushLosersToCustomers(row.id); } catch {} }, 30000);
        }
      } catch (e) { console.warn("[watchdog-recover]", e.message); }
    }
    if (recovered > 0) {
      console.log(`[watchdog-recover] auto-finalized ${recovered} stuck rounds`);
      notifyDiscord("alerts_warnings", {
        embeds: [makeEmbed({
          title: "🛡️ Auto-Recovered Stuck Rounds",
          description: `Self-heal: finalize ${recovered} rounds ที่ค้าง draft (มี results แล้ว)`,
          color: 0xf59e0b,
          fields: stuck.slice(0, 5).map(r => ({
            name: r.lottery_name,
            value: `${r.draw_date} ${r.draw_time}`,
            inline: true
          })),
          footer: "Watchdog ทำงาน ไม่ต้องแก้มือ"
        })],
      }).catch(()=>{});
    }
  } catch (e) { console.warn("[watchdog-recover]", e.message); }
}, 3 * 60 * 1000).unref();

/* === WATCHDOG-OVERDUE-V1 === ทุก 15 นาที */
const __alertedOverdue = new Map();
setInterval(async () => {
  try {
    const now = new Date();
    const overdueMin = 30;
    const overdueTime = new Date(now.getTime() - overdueMin * 60000);
    const overdue = db.prepare(`
      SELECT r.id, r.lottery_id, l.name AS lottery_name, r.draw_date, r.draw_time,
             (SELECT COUNT(*) FROM results WHERE round_id = r.id) AS result_count
      FROM rounds r
      JOIN lotteries l ON l.id = r.lottery_id
      WHERE r.result_status = 'draft'
        AND r.draw_date = date('now', '+7 hours')
        AND datetime(r.draw_date || ' ' || r.draw_time, '+7 hours') < datetime('now')
        AND datetime(r.draw_date || ' ' || r.draw_time, '+7 hours', '+30 minutes') < datetime('now')
      ORDER BY r.draw_time
      LIMIT 20
    `).all();

    const stale = overdue.filter(r => r.result_count === 0);
    if (stale.length === 0) return;

    /* dedup 24 ชม. ต่อ round — กัน alert spam + margin 5s กัน off-by-microseconds */
    const dedupCutoff = Date.now() - 86400000;
    const toAlert = stale.filter(r => {
      const last = __alertedOverdue.get(r.id) || 0;
      return last + 5000 < dedupCutoff;
    });
    if (toAlert.length === 0) return;

    toAlert.forEach(r => __alertedOverdue.set(r.id, Date.now()));
    if (__alertedOverdue.size > 1000) {
      const cutoff2 = Date.now() - 86400000;
      for (const [k, v] of __alertedOverdue) {
        if (v < cutoff2) __alertedOverdue.delete(k);
      }
    }

    notifyDiscord("alerts_critical", {
      content: "🚨 หวยค้าง — scraper อาจมีปัญหา",
      embeds: [makeEmbed({
        title: `🚨 Overdue ${toAlert.length} หวยยังไม่ออก`,
        description: "หวยที่ draw_time ผ่านไป 30+ นาที + ไม่มี results เลย\nอาจเป็น scraper ติด / API down / source เปลี่ยน format",
        color: 0xef4444,
        fields: toAlert.slice(0, 10).map(r => ({
          name: r.lottery_name,
          value: `${r.draw_date} ${r.draw_time}`,
          inline: true
        })),
        footer: "ตรวจ scraper + manual import ถ้าจำเป็น"
      })],
    }).catch(()=>{});
    console.warn(`[watchdog-overdue] alerted ${toAlert.length} stale rounds`);
  } catch (e) { console.warn("[watchdog-overdue]", e.message); }
}, 15 * 60 * 1000).unref();

/* === WATCHDOG-HEARTBEAT-V1 === ทุก 60 นาที */
let __lastHeartbeatAlert = 0;
setInterval(async () => {
  try {
    const bkkHour = new Date(Date.now() + 7 * 3600000).getUTCHours();
    if (bkkHour >= 2 && bkkHour < 6) return;

    const recentFinalized = db.prepare(`
      SELECT COUNT(*) AS count FROM rounds
      WHERE result_finalized_at >= datetime('now', '-90 minutes')
    `).get().count;

    if (recentFinalized > 0) return;

    if (Date.now() - __lastHeartbeatAlert < 3 * 3600000) return;
    __lastHeartbeatAlert = Date.now();

    notifyDiscord("alerts_critical", {
      content: "💀 ไม่มีหวยใหม่ออกใน 90 นาที — ระบบอาจตาย",
      embeds: [makeEmbed({
        title: "💀 No Finalize Activity > 90min",
        description: `ปกติช่วง ${bkkHour}:00 ควรมีหวยออก แต่ไม่มี finalize เลย\n\nควรตรวจ:\n• Scraper running\n• API endpoints\n• Network\n• Source websites`,
        color: 0xef4444,
        footer: "Watchdog heartbeat alert"
      })],
    }).catch(()=>{});
  } catch (e) { console.warn("[watchdog-heartbeat]", e.message); }
}, 60 * 60 * 1000).unref();

/* ===== END SELF-HEALING WATCHDOG V1 ===== */

/* APILOTTO Phase B: admin endpoint */
app.post("/api/admin/rounds/:roundId/apply-apilotto", requireAuth, requireAdmin, async (req, res) => {
  const r = await applyApilottoToRound(req.params.roundId);
  if (!r.ok) return res.status(400).json(r);
  logAudit(req.user.id, "apply_apilotto", "round", req.params.roundId, r);
  res.json(r);
});

/* APILOTTO Phase C: auto-cron — scan rounds เลย draw_time มา 3 นาที + ยังเป็น draft */
let __apilottoTriedRounds = new Map(); /* roundKey → timestamp expire (24h reset) */
let __apilottoCronRunning = false;
let __apilottoCronStartedAt = 0;
async function apilottoAutoImportCron() {
  /* CRON-STUCK-FIX: ถ้า flag ค้างเกิน 5 นาที → force reset (เผื่อ promise hang) */
  if (__apilottoCronRunning && (Date.now() - __apilottoCronStartedAt) > 5 * 60 * 1000) {
    console.warn("[apilotto-cron] flag ค้าง — force reset");
    __apilottoCronRunning = false;
  }
  if (__apilottoCronRunning) return;
  __apilottoCronRunning = true;
  __apilottoCronStartedAt = Date.now();
  __apilottoLastRunMs = Date.now();
  try {
    /* TZ-FIX: ใช้ Intl กัน server TZ ผิด */
    const today = bangkokTodayIso();
    const hhmm = bangkokHHMM();
    const limit = bangkokHHMM(new Date(Date.now() - 3 * 60000));

    /* SCRAPER-FRAMEWORK-V1: รวม API Lotto + Scraper provider */
    const rounds = db.prepare(`
      SELECT DISTINCT r.id, r.lottery_id, r.draw_date, r.draw_time
      FROM rounds r
      JOIN result_sources rs ON rs.lottery_id = r.lottery_id
      WHERE rs.provider IN ('API Lotto', 'Scraper') AND rs.active = 1
        AND r.result_status = 'draft'
        AND ((r.draw_date < ?) OR (r.draw_date = ? AND r.draw_time <= ?))
      ORDER BY r.draw_date DESC, r.draw_time DESC
      LIMIT 30
    `).all(today, today, limit);

    for (const round of rounds) {
      const key = round.id + "|" + round.draw_date;
      const tried = __apilottoTriedRounds.get(key);
      if (tried && tried > Date.now()) continue; /* still in cooldown */
      const r = await applyApilottoToRound(round.id);
      if (r.ok && r.inserted && r.inserted.length) {
        __apilottoLastSuccess = new Date().toISOString();
        __apilottoLastError = null;
        try { global.__apilottoFailCount = 0; } catch {}
        console.log(`[apilotto-cron] applied ${round.id} (${round.lottery_id}) — ${r.inserted.length} numbers`);
        __apilottoTriedRounds.set(key, Date.now() + 24 * 3600 * 1000); /* 24h cooldown */
      } else if (r.error === "not_drawn_yet") {
        /* รอออก — retry ใน 2 นาที */
        __apilottoTriedRounds.set(key, Date.now() + 2 * 60 * 1000);
      } else if (r.error === "date_mismatch") {
        /* round เก่า — apilotto ส่งค่าวันใหม่ → ไม่ใช่ของเรา → 24h cooldown silently */
        __apilottoTriedRounds.set(key, Date.now() + 24 * 60 * 60 * 1000);
      } else {
        console.warn(`[apilotto-cron] skip ${round.id} (${round.lottery_id}): ${r.error}`);
        __apilottoTriedRounds.set(key, Date.now() + 10 * 60 * 1000);
      }
    }
    /* cleanup expired entries */
    const cutNow = Date.now();
    for (const [k, exp] of __apilottoTriedRounds.entries()) {
      if (exp < cutNow) __apilottoTriedRounds.delete(k);
    }
  } catch (e) {
    __apilottoLastError = { ts: new Date().toISOString(), msg: e.message };
    console.error("[apilotto-cron]", e.message);
    /* === DISCORD-HOOK-4 ALERTS-CRITICAL === */
    try {
      global.__apilottoFailCount = (global.__apilottoFailCount || 0) + 1;
      if (global.__apilottoFailCount >= 3) {
        notifyDiscord("alerts_critical", {
          content: "🚨 @Admin Dev",
          embeds: [makeEmbed({
            title: "🚨 Scraper/Cron Fail",
            color: 0xff0000,
            fields: [
              { name: "Source", value: "apilotto-cron", inline: true },
              { name: "Fail count", value: String(global.__apilottoFailCount), inline: true },
              { name: "Error", value: "```" + safeName(String(e.message || "").slice(0, 500)) + "```", inline: false },
            ],
          })],
        }).catch(() => {});
      }
    } catch {}
  }
  finally { __apilottoCronRunning = false; }
}



/* POLISH P4: apilotto health — return last successful pull timestamp */
let __apilottoLastSuccess = null;
let __apilottoLastError = null;
app.get("/api/admin/apilotto/health", requireAuth, requireAdmin, (req, res) => {
  const lastFinalized = db.prepare("SELECT MAX(result_finalized_at) AS last FROM rounds WHERE result_status='finalized' AND result_finalized_by IS NULL").get();
  res.json({
    last_success: __apilottoLastSuccess || lastFinalized?.last || null,
    last_error: __apilottoLastError,
    cron_running: typeof __apilottoCronRunning !== "undefined" ? __apilottoCronRunning : false,
  });
});

/* BUG-I FIX: dynamic apilotto coverage list */
app.get("/api/admin/apilotto/lotteries", requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare("SELECT DISTINCT lottery_id FROM result_sources WHERE provider='API Lotto' AND active=1").all();
  res.json({ lottery_ids: rows.map(r => r.lottery_id) });
});

/* APILOTTO: simple connection check */
app.get("/api/admin/apilotto/ping", requireAuth, requireAdmin, async (req, res) => {
  const key = process.env.APILOTTO_API_KEY;
  if (!key) return res.json({ ok: false, error: "no_api_key" });
  const url = (process.env.APILOTTO_BASE_URL || "https://api.apilotto.com/api/v1") + "/stocklotto";
  try {
    const r = await fetch(url, { headers: { "x-api-key": key } });
    res.json({ ok: r.ok, status: r.status, configured: true });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

console.log("[p3-bank-accounts] backend ready");


/* R5-E3: cron alert ถ้าบัญชีรับเกิน daily_limit * 1.1 — บอสรู้ทันที */
setInterval(() => {
  try {
    const overLimit = db.prepare("SELECT bank_name, account_number, total_received_today, daily_limit FROM bank_accounts WHERE total_received_today > daily_limit * 1.1").all();
    if (!overLimit.length) return;
    const bossId = getBossLineUserId && getBossLineUserId();
    if (!bossId) return;
    /* throttle 1h via cron_state */
    const lastMs = getCronState("bank_over_limit_last", 0);
    if (Date.now() - lastMs < 60 * 60 * 1000) return;
    const lines = overLimit.map(b => `• ${b.bank_name} ${b.account_number}: ${b.total_received_today}/${b.daily_limit}`).join("\n");
    setCronState("bank_over_limit_last", Date.now());
    linePush(bossId, `⚠️ บัญชีรับเกิน daily_limit\n\n${lines}\n\nควรตรวจสอบ + reset หากผิดปกติ`).catch(()=>{});
  } catch (e) { console.warn("[bank-over-limit]", e.message); }
}, 10 * 60 * 1000).unref();

/* PURGE-NEW: broadcast_log > 30d + slip_image_hashes > 90d */
setInterval(() => {
  try {
    const c1 = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
    const r1 = db.prepare("DELETE FROM broadcast_log WHERE created_at < ?").run(c1);
    if (r1.changes > 0) console.log(`[purge] broadcast_log: ${r1.changes} rows`);
    const c2 = new Date(Date.now() - 90 * 86400 * 1000).toISOString();
    const r2 = db.prepare("DELETE FROM slip_image_hashes WHERE created_at < ?").run(c2);
    if (r2.changes > 0) console.log(`[purge] slip_image_hashes: ${r2.changes} rows`);
  } catch (e) { console.warn("[purge-new]", e.message); }
}, 6 * 60 * 60 * 1000).unref(); /* 6h */


/* OUTBOX-RECOVERY: scan finalized rounds ใน 1 ชม. → ดูลูกค้าที่ยังไม่มี push entry → retry */
async function pushRecoveryScan() {
  try {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    /* finalized rounds ใน 1 ชม. */
    const rounds = db.prepare(`
      SELECT id FROM rounds
      WHERE result_status = 'finalized'
        AND result_finalized_at IS NOT NULL
        AND result_finalized_at > ?
    `).all(cutoff);
    if (!rounds.length) return;
    for (const r of rounds) {
      /* trigger push ใหม่ — pushWinners/Losers มี dedup table → ลูกค้าที่ได้ push แล้วจะ skip */
      try {
        await pushWinnersToCustomers(r.id);
        await new Promise(rr => setTimeout(rr, 1000));
        await pushLosersToCustomers(r.id);
      } catch (e) { console.warn("[push-recovery]", r.id, e.message); }
    }
  } catch (e) { console.error("[push-recovery]", e.message); }
}

/* LIVE-RESULTS-ENDPOINT: proxy apilotto endpoints ทั้งหมด + cache 30s */
const __liveResultsCache = { ts: 0, data: null };
/* STALE-V1: stale-while-revalidate — serve cache + refresh background */
let __liveResultsRefreshing = false;
async function __refreshLiveResults() {
  if (__liveResultsRefreshing) return;
  __liveResultsRefreshing = true;
  try {
    const [thai, lao, hanoi, malay, stock] = await Promise.all([
      fetchApilottoEndpoint("/getlastestlottery").catch(e => ({ _err: e.message })),
      fetchApilottoEndpoint("/laolotto").catch(e => ({ _err: e.message })),
      fetchApilottoEndpoint("/hanoilotto").catch(e => ({ _err: e.message })),
      fetchApilottoEndpoint("/malaylotto").catch(e => ({ _err: e.message })),
      fetchApilottoEndpoint("/stocklotto").catch(e => ({ _err: e.message })),
    ]);
    /* normalize */
    let dThai = null;
    try {
      const r = thai && thai.response;
      if (r) {
        const data = r.data || {};
        dThai = {
          first: data.first && data.first.number && data.first.number[0] && data.first.number[0].value,
          two_last: data.last2 && data.last2.number && data.last2.number[0] && data.last2.number[0].value,
          three_last: data.last3b && data.last3b.number && data.last3b.number.map(x=>x.value).join(" "),
          three_first: data.last3f && data.last3f.number && data.last3f.number.map(x=>x.value).join(" "),
          date: r.date,
        };
      }
    } catch(e){}
    let dLao = null;
    try {
      const ld = lao && lao.data;
      if (ld) dLao = { four: ld.laolast4, three_top: ld.laolast3, two_top: ld.laolast2 && ld.laolast2.top, two_bottom: ld.laolast2 && ld.laolast2.bottom, animal: ld.animalname, date: ld.date };
    } catch(e){}
    let dMalay = null;
    try {
      const md = malay && malay.data;
      if (md) dMalay = { four: md.malaylast4, three_top: md.malaylast3, two_top: md.malaylast2 && md.malaylast2.top, two_bottom: md.malaylast2 && md.malaylast2.bottom, date: md.date };
    } catch(e){}
    let dHanoi = [];
    try {
      const hd = hanoi && hanoi.data;
      if (Array.isArray(hd)) {
        dHanoi = hd.map(x => ({ name: x.name, four: x.hanoilast4, three_top: x.hanoilast3, two_top: x.hanoilast2 && x.hanoilast2.top, two_bottom: x.hanoilast2 && x.hanoilast2.bottom, date: x.date }));
      }
    } catch(e){}
    let dStock = [];
    try {
      /* STOCK-FULL-LIST-V1: รวมทุกตลาดหุ้นจาก DB + กรอก data จาก apilotto */
      const sd = stock && stock.data;
      const apiByName = {};
      if (Array.isArray(sd)) {
        for (const x of sd) apiByName[x.name] = x;
      }
      const dbStocks = db.prepare(`
        SELECT l.id, l.name AS db_name, l.display_order,
               substr(rs.api_endpoint, instr(rs.api_endpoint, '::')+2) AS api_name
        FROM lotteries l
        JOIN result_sources rs ON rs.lottery_id = l.id
        WHERE l.category IN ('stock','stock_vip')
          AND rs.api_endpoint LIKE '/stocklotto%'
          AND rs.active = 1
        ORDER BY l.display_order ASC
      `).all();
      const seenInApi = new Set();
      for (const ls of dbStocks) {
        const x = apiByName[ls.api_name];
        if (x && x.stocklast3 && !String(x.stocklast3).toLowerCase().includes('x')) {
          dStock.push({ name: ls.db_name, three_top: x.stocklast3, two_bottom: x.stocklast2, date: x.date, closed: false });
          seenInApi.add(ls.api_name);
        } else if (x) {
          /* apilotto มีแต่ยังไม่ออก */
          dStock.push({ name: ls.db_name, three_top: 'xxx', two_bottom: 'xx', date: x.date, closed: false, pending: true });
          seenInApi.add(ls.api_name);
        } else {
          /* apilotto ไม่ส่งมา → ตลาดปิดวันหยุด */
          dStock.push({ name: ls.db_name, three_top: 'xxx', two_bottom: 'xx', date: null, closed: true });
        }
      }
      /* extra: ถ้า apilotto มีตลาดที่ DB ไม่มี (เช่น "ตลาดปิด") → add ท้าย */
      if (Array.isArray(sd)) {
        for (const x of sd) {
          if (!seenInApi.has(x.name) && x.name !== 'ตลาดปิด') {
            dStock.push({ name: x.name, three_top: x.stocklast3, two_bottom: x.stocklast2, date: x.date, closed: false });
          }
        }
      }
    } catch(e) { console.warn('[stock-merge]', e.message); }
    __liveResultsCache.ts = Date.now();
    __liveResultsCache.data = { thai: dThai, lao: dLao, hanoi: dHanoi, malay: dMalay, stock: dStock };
  } catch (e) {
    console.warn("[live-results refresh]", e.message);
  } finally {
    __liveResultsRefreshing = false;
  }
}
/* pre-warm — refresh background ทุก 25 วิ */
setInterval(__refreshLiveResults, 25 * 1000);

app.get("/api/admin/live-results", requireAuth, requireAdmin, async (_req, res) => {
  try {
    if (!__liveResultsCache.data) { await __refreshLiveResults(); }
    else {
      const ageMs = Date.now() - __liveResultsCache.ts;
      if (ageMs > 25 * 1000) { __refreshLiveResults().catch(()=>{}); }
    }
    if (__liveResultsCache.data) return res.json(__liveResultsCache.data);
    return res.json({ thai: null, lao: null, hanoi: [], malay: null, stock: [], error: "no_data" });
  } catch (e) {
    console.warn("[live-results]", e.message);
    res.status(500).json({ error: e.message });
  }
});



/* GROUP-BROADCAST-V1: dedup table */
db.exec(`CREATE TABLE IF NOT EXISTS group_broadcasts_sent (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  key TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  UNIQUE(scope, key)
)`);




/* ===== HH-DELETE-V1: soft+force delete สำหรับหัวบ้าน ===== */
try { db.exec("ALTER TABLE head_houses ADD COLUMN active INTEGER NOT NULL DEFAULT 1"); }
catch(e) { /* column already exists */ }

/* PATCH deactivate */
app.patch("/api/head-houses/:id/deactivate", requireAuth, requireAdmin, (req, res) => {
  try {
    const hh = db.prepare("SELECT id, name FROM head_houses WHERE id=?").get(req.params.id);
    if (!hh) return res.status(404).json({ ok: false, error: "head_house_not_found" });
    if (hh.id === "direct" || hh.id === "line_self") return res.status(409).json({ ok: false, error: "head_house_protected" });
    db.prepare("UPDATE head_houses SET active=0, updated_at=? WHERE id=?").run(nowIso(), hh.id);
    try { logAudit(req.user.id, "deactivate", "head_house", hh.id, hh); } catch(e){}
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* PATCH activate */
app.patch("/api/head-houses/:id/activate", requireAuth, requireAdmin, (req, res) => {
  try {
    const hh = db.prepare("SELECT id, name FROM head_houses WHERE id=?").get(req.params.id);
    if (!hh) return res.status(404).json({ ok: false, error: "head_house_not_found" });
    db.prepare("UPDATE head_houses SET active=1, updated_at=? WHERE id=?").run(nowIso(), hh.id);
    try { logAudit(req.user.id, "activate", "head_house", hh.id, hh); } catch(e){}
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* DELETE force with reassign — body: { reassign_to: "direct" } */
app.post("/api/head-houses/:id/force-delete", requireAuth, requireAdmin, (req, res) => {
  try {
    const hh = db.prepare("SELECT * FROM head_houses WHERE id=?").get(req.params.id);
    if (!hh) return res.status(404).json({ ok: false, error: "head_house_not_found" });
    if (hh.id === "direct" || hh.id === "line_self") return res.status(409).json({ ok: false, error: "head_house_protected" });
    const reassignTo = String((req.body && req.body.reassign_to) || "direct");
    if (reassignTo === hh.id) return res.status(400).json({ ok: false, error: "cannot_reassign_to_self" });
    const target = db.prepare("SELECT id FROM head_houses WHERE id=?").get(reassignTo);
    if (!target) return res.status(400).json({ ok: false, error: "reassign_target_not_found" });

    const now = nowIso();
    let counts = { customers: 0, tickets: 0, payout_overrides: 0 };
    withTransaction(() => {
      const c1 = db.prepare("UPDATE customers SET head_house_id=?, updated_at=? WHERE head_house_id=?").run(reassignTo, now, hh.id);
      counts.customers = c1.changes;
      const c2 = db.prepare("UPDATE tickets SET head_house_id=? WHERE head_house_id=?").run(reassignTo, hh.id);
      counts.tickets = c2.changes;
      /* ลบ payout overrides ของ hh เก่า — ไม่ย้าย */
      const c3 = db.prepare("DELETE FROM head_house_payout_overrides WHERE head_house_id=?").run(hh.id);
      counts.payout_overrides = c3.changes;
      /* ลบ viewer accounts */
      db.prepare("DELETE FROM users WHERE role='head_house_viewer' AND head_house_id=?").run(hh.id);
      /* ลบ head_house */
      db.prepare("DELETE FROM head_houses WHERE id=?").run(hh.id);
    });
    try { logAudit(req.user.id, "force_delete", "head_house", hh.id, { ...hh, reassigned_to: reassignTo, counts }); } catch(e){}
    res.json({ ok: true, reassigned_to: reassignTo, counts });
  } catch (e) {
    console.warn("[hh force-delete]", e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});
/* ===== END HH-DELETE-V1 ===== */

/* ===== TICKET-REASSIGN-V1: ย้ายบิลข้ามหัวบ้าน ===== */
app.post("/api/tickets/:id/reassign-head-house", requireAuth, requireAdmin, (req, res) => {
  try {
    const ticketId = String(req.params.id || "").trim();
    const targetHh = String((req.body && req.body.head_house_id) || "").trim();
    if (!ticketId || !targetHh) return res.status(400).json({ ok: false, error: "missing_params" });

    const ticket = db.prepare("SELECT id, code, head_house_id, status, total_amount FROM tickets WHERE id=? OR code=?").get(ticketId, ticketId);
    if (!ticket) return res.status(404).json({ ok: false, error: "ticket_not_found" });

    const target = db.prepare("SELECT id, name, code FROM head_houses WHERE id=?").get(targetHh);
    if (!target) return res.status(400).json({ ok: false, error: "head_house_not_found" });

    if (ticket.head_house_id === target.id) {
      return res.json({ ok: true, unchanged: true, ticket_code: ticket.code, head_house: target });
    }

    const oldHh = ticket.head_house_id;
    const now = nowIso();
    db.prepare("UPDATE tickets SET head_house_id=?, updated_at=? WHERE id=?").run(target.id, now, ticket.id);

    try {
      logAudit(req.user.id, "reassign_head_house", "ticket", ticket.id, {
        code: ticket.code,
        from: oldHh,
        to: target.id,
        target_name: target.name,
      });
    } catch (e) { /* ignore audit fail */ }

    res.json({
      ok: true,
      ticket_code: ticket.code,
      from: oldHh,
      to: target.id,
      head_house: { id: target.id, name: target.name, code: target.code },
    });
  } catch (e) {
    console.warn("[ticket reassign]", e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});
/* ===== END TICKET-REASSIGN-V1 ===== */


/* ===== RATE-OVERRIDE-V1: เรทอัตราจ่ายต่างกันตามหัวบ้าน ===== */
db.exec(`CREATE TABLE IF NOT EXISTS head_house_payout_overrides (
  id TEXT PRIMARY KEY,
  head_house_id TEXT NOT NULL,
  lottery_id TEXT NOT NULL,
  bet_type_id TEXT NOT NULL,
  rate REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(head_house_id, lottery_id, bet_type_id)
);
CREATE INDEX IF NOT EXISTS idx_hh_payout_lookup ON head_house_payout_overrides(head_house_id, lottery_id, bet_type_id);`);

/* Resolver: หา effective rate สำหรับ (head_house, lottery, bet_type) */
function getEffectiveRate(headHouseId, lotteryId, betTypeId) {
  /* 1. ถ้ามี override → ใช้ */
  if (headHouseId) {
    const ov = db.prepare(`SELECT rate FROM head_house_payout_overrides WHERE head_house_id=? AND lottery_id=? AND bet_type_id=?`).get(headHouseId, lotteryId, betTypeId);
    if (ov) return ov.rate;
  }
  /* 2. fallback: rate กลาง */
  const base = db.prepare(`SELECT rate FROM payout_rates WHERE lottery_id=? AND bet_type_id=?`).get(lotteryId, betTypeId);
  return base ? base.rate : 0;
}

/* ===== Admin API ===== */
/* GET — list all overrides (optional: filter by head_house_id) */
app.get("/api/admin/head-house-rates", requireAuth, requireAdmin, (req, res) => {
  try {
    const hhId = req.query.head_house_id ? String(req.query.head_house_id) : null;
    const lotId = req.query.lottery_id ? String(req.query.lottery_id) : null;
    let q = `SELECT id, head_house_id, lottery_id, bet_type_id, rate, updated_at FROM head_house_payout_overrides WHERE 1=1`;
    const params = [];
    if (hhId) { q += ` AND head_house_id=?`; params.push(hhId); }
    if (lotId) { q += ` AND lottery_id=?`; params.push(lotId); }
    q += ` ORDER BY head_house_id, lottery_id, bet_type_id`;
    const rows = db.prepare(q).all(...params);
    res.json({ ok: true, items: rows });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* POST — upsert override (single) — body: { head_house_id, lottery_id, bet_type_id, rate } */
app.post("/api/admin/head-house-rates", requireAuth, requireAdmin, (req, res) => {
  try {
    const { head_house_id, lottery_id, bet_type_id, rate } = req.body || {};
    if (!head_house_id || !lottery_id || !bet_type_id || rate == null) {
      return res.status(400).json({ ok: false, error: "missing fields" });
    }
    const r = Number(rate);
    if (isNaN(r) || r < 0) return res.status(400).json({ ok: false, error: "invalid rate" });
    const existing = db.prepare(`SELECT id FROM head_house_payout_overrides WHERE head_house_id=? AND lottery_id=? AND bet_type_id=?`).get(head_house_id, lottery_id, bet_type_id);
    const now = nowIso();
    if (existing) {
      db.prepare(`UPDATE head_house_payout_overrides SET rate=?, updated_at=? WHERE id=?`).run(r, now, existing.id);
    } else {
      db.prepare(`INSERT INTO head_house_payout_overrides (id, head_house_id, lottery_id, bet_type_id, rate, created_at, updated_at) VALUES (?,?,?,?,?,?,?)`)
        .run(crypto.randomUUID(), head_house_id, lottery_id, bet_type_id, r, now, now);
    }
    res.json({ ok: true });
  } catch (e) { console.warn("[hh-rates POST]", e.message); res.status(500).json({ ok: false, error: e.message }); }
});

/* POST bulk — array of {head_house_id, lottery_id, bet_type_id, rate} */
app.post("/api/admin/head-house-rates/bulk", requireAuth, requireAdmin, (req, res) => {
  try {
    const items = Array.isArray(req.body && req.body.items) ? req.body.items : [];
    const upsert = db.prepare(`
      INSERT INTO head_house_payout_overrides (id, head_house_id, lottery_id, bet_type_id, rate, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?)
      ON CONFLICT(head_house_id, lottery_id, bet_type_id) DO UPDATE SET rate=excluded.rate, updated_at=excluded.updated_at
    `);
    /* BULK-FIX-V1: ใช้ withTransaction (node:sqlite ไม่มี db.transaction()) */
    withTransaction(() => {
      const now = nowIso();
      for (const it of items) {
        if (!it.head_house_id || !it.lottery_id || !it.bet_type_id || it.rate == null) continue;
        const r = Number(it.rate);
        if (isNaN(r) || r < 0) continue;
        upsert.run(crypto.randomUUID(), it.head_house_id, it.lottery_id, it.bet_type_id, r, now, now);
      }
    });
    res.json({ ok: true, count: items.length });
  } catch (e) { console.warn("[hh-rates bulk]", e.message); res.status(500).json({ ok: false, error: e.message }); }
});

/* DELETE — remove override (revert to กลาง) */
app.delete("/api/admin/head-house-rates", requireAuth, requireAdmin, (req, res) => {
  try {
    const { head_house_id, lottery_id, bet_type_id } = req.body || {};
    if (!head_house_id || !lottery_id || !bet_type_id) return res.status(400).json({ ok: false, error: "missing fields" });
    db.prepare(`DELETE FROM head_house_payout_overrides WHERE head_house_id=? AND lottery_id=? AND bet_type_id=?`).run(head_house_id, lottery_id, bet_type_id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* GET effective rate (for UI preview) */
app.get("/api/admin/effective-rate", requireAuth, requireAdmin, (req, res) => {
  try {
    const r = getEffectiveRate(req.query.head_house_id, req.query.lottery_id, req.query.bet_type_id);
    res.json({ ok: true, rate: r });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});
/* ===== END RATE-OVERRIDE-V1 ===== */

/* LOTTO_BG_MAP: รูปประจำหวย (pre-gen ด้วย OpenAI) — serve ผ่าน HTTPS */
const LOTTO_BG_MAP = {
  "thai": "thai", "omsin": "thai", "baac": "thai",
  "lott_027": "lao", "lott_032": "malay",
  "lott_033": "hanoi", "lott_035": "hanoi", "lott_036": "hanoi",
  /* หุ้น */
  "lott_023": "thai", /* หุ้นไทยปิดเย็น */
  "lott_016": "china", "lott_021": "china", "lott_042": "china", "lott_047": "china",
  "lott_015": "nikkei", "lott_020": "nikkei", "lott_041": "nikkei", "lott_046": "nikkei",
  "lott_017": "hangseng", "lott_022": "hangseng", "lott_043": "hangseng", "lott_048": "hangseng",
};
function getLottoBgUrl(lotteryId) {
  const key = LOTTO_BG_MAP[lotteryId] || "thai";
  const base = process.env.BASE_URL || "https://lottery.139-59-123-146.nip.io";
  return base + "/img/lotto-bg/" + key + ".jpg";
}


registerCron("push-recovery", pushRecoveryScan, 15 * 60 * 1000); /* ทุก 15 นาที */

const server = app.listen(PORT, () => {
  console.log(`lottery-manager listening on http://127.0.0.1:${PORT}`);
  // Defer heavy work so the port is ready first
  setImmediate(__deferredStartupTasks);
});



// === S2-G1: bulk approve API ===
app.post("/api/tickets/bulk-approve", requireAuth, requireAdmin, (req, res) => {
  const ids = Array.isArray(req.body.ticketIds) ? req.body.ticketIds : [];
  if (!ids.length) return res.status(400).json({ error: "no_ids" });
  if (ids.length > 200) return res.status(400).json({ error: "too_many", max: 200 });
  let approved = 0, skipped = 0, errors = [];
  withTransaction(() => {
    for (const id of ids) {
      try {
        const ticket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id);
        if (!ticket) { skipped++; errors.push({ id, reason: "not_found" }); continue; }
        if (ticket.status !== "pending_review") { skipped++; errors.push({ id, reason: "wrong_status_" + ticket.status }); continue; }
        /* M1-FIX: bulk approve ต้อง atomic guard + update bank */
        const _r = db.prepare("UPDATE tickets SET status='approved', checked_by=?, checked_at=?, updated_at=? WHERE id=? AND status='pending_review'")
          .run(req.user.id, nowIso(), nowIso(), id);
        if (_r.changes === 0) { skipped++; continue; }
        /* update bank ถ้ามี slip_amount + receiver */
        try {
          if (ticket.slip_amount && Number(ticket.slip_amount) > 0 && ticket.slip_raw_json) {
            const raw = JSON.parse(ticket.slip_raw_json);
            const d = raw.data || raw.result || raw;
            const ra = d.receiver?.account;
            let recvAcc = "";
            if (typeof ra === "string") recvAcc = ra;
            else if (ra && typeof ra === "object") recvAcc = String(ra.value || ra.number || ra.account || "");
            const recvNorm = normalizeAccountNumber(recvAcc);
            if (recvNorm) {
              const accounts = db.prepare("SELECT id, account_number FROM bank_accounts").all();
              const targetAcc = accounts.find(a => normalizeAccountNumber(a.account_number) === recvNorm);
              if (targetAcc) {
                const amt = roundMoney(Number(ticket.slip_amount));
                db.prepare(`UPDATE bank_accounts SET total_received_today = total_received_today + ?, status = CASE WHEN status = 'active' AND total_received_today + ? >= daily_limit THEN 'cooling' ELSE status END, updated_at = ? WHERE id = ?`)
                  .run(amt, amt, nowIso(), targetAcc.id);
              }
            }
          }
        } catch(e) { console.warn("[bulk-approve bank]", e.message); }
        logAudit(req.user.id, "approve", "ticket", id, { batch: true });
        approved++;
      } catch (e) {
        errors.push({ id, reason: "error:" + (e.message || "?") });
        skipped++;
      }
    }
  });
  res.json({ approved, skipped, errors });
});



// === S2-G2: audit log retention cron ===
function purgeOldAuditLogs() {
  try {
    const cutoff = new Date(Date.now() - 180 * 86400 * 1000).toISOString();
    const r = db.prepare("DELETE FROM audit_logs WHERE created_at < ?").run(cutoff);
    if (r.changes > 0) console.log(`[audit-retention] purged ${r.changes} rows older than 180d`);
  } catch (e) { console.error("[audit-retention] failed:", e.message); }
}
setInterval(purgeOldAuditLogs, 6 * 3600 * 1000).unref();  // every 6h
setTimeout(purgeOldAuditLogs, 30000).unref();  // 30s after boot



// ===== MIGRATION 2026-05-25: split name·phone =====
(function migrateNamePhoneSplit() {
  try {
    const rows = db.prepare("SELECT id, name, phone FROM customers WHERE name LIKE '% · %'").all();
    if (!rows.length) return;
    console.log(`[migrate] splitting ${rows.length} customer name·phone records...`);
    let split = 0;
    for (const r of rows) {
      const parts = String(r.name).split(/\s*·\s*/);
      if (parts.length < 2) continue;
      const last = parts[parts.length - 1];
      /* only split if last segment looks like a phone (mostly digits) */
      if (!/^[\d\s\-+()]+$/.test(last)) continue;
      const nameOnly = parts.slice(0, -1).join(" · ").trim();
      const phoneOnly = (r.phone && r.phone.length > 0) ? r.phone : last.trim();
      if (!nameOnly) continue;
      db.prepare("UPDATE customers SET name = ?, phone = ?, updated_at = ? WHERE id = ?")
        .run(nameOnly, phoneOnly, nowIso(), r.id);
      split++;
    }
    if (split > 0) console.log(`[migrate] split ${split} customers — name cleaned, phone moved to dedicated column`);
  } catch (e) {
    console.error("[migrate] name·phone split failed:", e.message);
  }
})();


// ===== SLIP AUTO-APPROVE (Phase 1) =====
// Adds slip2go integration + LINE webhook + auto-match + 10-min auto-cancel

// --- Schema columns ---
ensureColumn("tickets", "slip_transaction_id", "TEXT");
ensureColumn("tickets", "slip_amount", "REAL");
ensureColumn("tickets", "slip_sender_bank", "TEXT");
ensureColumn("tickets", "slip_sender_account", "TEXT");
ensureColumn("tickets", "slip_verified_at", "TEXT");
ensureColumn("tickets", "slip_raw_json", "TEXT");
try { db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_slip_txn ON tickets(slip_transaction_id) WHERE slip_transaction_id IS NOT NULL;"); } catch(e){}

// --- Config ---
const SLIP_AUTO_APPROVE = process.env.SLIP_AUTO_APPROVE !== "false";
const SLIP_MATCH_WINDOW_MIN = Number(process.env.SLIP_MATCH_WINDOW_MIN) || 10;
const AUTO_CANCEL_MIN = Number(process.env.AUTO_CANCEL_MIN) || (SLIP_MATCH_WINDOW_MIN + 3); /* buffer 3 นาที กัน race */
const SLIP2GO_BASE_URL = process.env.SLIP2GO_BASE_URL || "https://app.slip2go.com";
const SLIP2GO_ENDPOINT_PATH = process.env.SLIP2GO_ENDPOINT_PATH || "/api/verify-slip/qr-image/info";
const SLIP_SKIP_RECEIVER_CHECK = process.env.SLIP_SKIP_RECEIVER_CHECK === "true";
/* SLIP-SECURITY: สลิปเก่ากว่า N นาที reject กันลูกค้าใช้สลิปเก่า */
const SLIP_MAX_AGE_MIN = Number(process.env.SLIP_MAX_AGE_MIN) || 30;

// --- Reply templates ---
const SLIP_REPLY_APPROVED = (code, amount) =>
  `✓ บิล ${code} อนุมัติเรียบร้อยแล้วค่ะ\n` +
  `💰 ยอด ${Number(amount).toLocaleString("th-TH")} บาท\n` +
  `ขอบคุณที่ใช้บริการค่ะ ขอให้โชคดีนะคะ 🍀`;

const SLIP_REPLY_NO_CUSTOMER = `⚠️ ยังไม่พบข้อมูลของคุณค่ะ\nกรุณาสั่งซื้อบิลก่อนส่งสลิปนะคะ`;
const SLIP_REPLY_NO_MATCH = `⚠️ ได้รับสลิปแล้วค่ะ แต่ระบบยังไม่พบบิลที่ตรงกัน\nแอดมินจะช่วยตรวจให้ภายใน 10 นาทีนะคะ ขอบคุณที่รอค่ะ ⏳`;
const SLIP_REPLY_TOO_OLD = "⚠️ สลิปนี้เก่าเกินไปนะคะ\nกรุณาโอนเงินใหม่และส่งสลิปล่าสุดมาด้วยค่ะ";
const SLIP_REPLY_DUPLICATE = `⚠️ สลิปนี้ได้ถูกใช้ในระบบแล้วค่ะ\nหากเป็นการสั่งซื้อใหม่ กรุณาส่งสลิปการโอนใหม่อีกครั้งนะคะ`;
const SLIP_REPLY_WRONG_RECEIVER = `⚠️ สลิปนี้โอนเข้าบัญชีอื่นที่ไม่ใช่ของเราค่ะ\nกรุณาโอนใหม่เข้าบัญชีที่ระบุในระบบนะคะ`;
const SLIP_REPLY_VERIFY_FAIL = `⚠️ สลิปไม่ผ่านการตรวจสอบค่ะ\nโปรดส่งภาพสลิปที่ชัดเจนอีกครั้ง หรือติดต่อแอดมินเพื่อช่วยเหลือนะคะ`;
const SLIP_REPLY_AMBIGUOUS = (n) => `⚠️ พบบิลที่ยอดตรงกัน ${n} อันค่ะ\nกรุณาระบุเลขบิล (เช่น P000123) เพื่อยืนยัน หรือรอแอดมินช่วยตรวจให้นะคะ`;

// --- LINE API helpers ---


/* === GROUP-BOT Phase 1+2 === */

/* GROUP-BOT: บอส user_id สำหรับ alert (จะตั้งใน env BOSS_LINE_USER_ID) */
function getBossLineUserId() {
  return process.env.BOSS_LINE_USER_ID || null;
}

/* GROUP-BOT: ลงทะเบียนกลุ่มใหม่ */
function registerLineGroup(groupId, displayName) {
  const now = nowIso();
  db.prepare(`INSERT INTO line_groups (group_id, group_name, status, joined_at, last_active)
    VALUES (?, ?, 'active', ?, ?)
    ON CONFLICT(group_id) DO UPDATE SET status='active', last_active=?, group_name=COALESCE(?, line_groups.group_name)`)
    .run(groupId, displayName || "", now, now, now, displayName || null);
}

/* GROUP-BOT: mark กลุ่มที่ออก/ถูก kick */
function markGroupLeft(groupId) {
  const now = nowIso();
  db.prepare(`UPDATE line_groups SET status='left', last_active=? WHERE group_id=?`).run(now, groupId);
}

/* GROUP-BOT: welcome message + กฎกลุ่ม */
async function sendGroupWelcome(replyToken, groupName) {
  const liffUrl = process.env.LIFF_URL || "https://liff.line.me/2010170072-GDDXzvaN";
  const flex = {
    type: "flex",
    altText: "ยินดีต้อนรับสู่กลุ่ม",
    contents: {
      type: "bubble", size: "giga",
      header: {
        type: "box", layout: "vertical",
        backgroundColor: "#0f5132", paddingAll: "20px",
        contents: [
          { type: "text", text: "ยินดีต้อนรับ 🎉", color: "#ffffff", weight: "bold", size: "xl", align: "center" },
          { type: "text", text: "บ้านหวยเรือนเลขเศรษฐี", color: "#d1fae5", size: "sm", align: "center", margin: "sm" }
        ]
      },
      body: {
        type: "box", layout: "vertical", spacing: "md", paddingAll: "16px",
        contents: [
          { type: "text", text: "📌 กฎกลุ่มของเราค่ะ", weight: "bold", size: "md", color: "#0f5132" },
          { type: "separator" },
          { type: "text", text: "1. ห้ามแก้รูป/ชื่อ/ปักหมุดของกลุ่ม", size: "sm", wrap: true, margin: "sm" },
          { type: "text", text: "2. ห้ามเตะ Bot ออก (เสียบริการ auto)", size: "sm", wrap: true },
          { type: "text", text: "3. ห้ามโพสต์ลิงก์ภายนอก / โฆษณา", size: "sm", wrap: true },
          { type: "text", text: "4. ใช้คำสุภาพ ไม่ทะเลาะกัน", size: "sm", wrap: true },
          { type: "text", text: "ฝ่าฝืน admin จะออกจากกลุ่มค่ะ", size: "xs", color: "#991b1b", margin: "md" },
          { type: "separator", margin: "md" },
          { type: "text", text: "🤖 คำสั่ง Bot", weight: "bold", size: "sm", color: "#0f5132", margin: "md" },
          { type: "text", text: "/menu — ดูคำสั่งทั้งหมด\n/ผล — ผลรางวัลล่าสุด\n/สุ่ม — สุ่มเลขแนวทาง\n/หวยถัดไป — หวยที่จะออกถัดไป", size: "xs", wrap: true, color: "#4b5563" },
          { type: "separator", margin: "md" },
          { type: "text", text: "⚠️ ห้ามสั่งซื้อในกลุ่ม", weight: "bold", size: "xs", color: "#991b1b", margin: "md", align: "center" },
          { type: "text", text: "กดปุ่มด้านล่างเพื่อเปิดแชทส่วนตัวกับ Bot — บิลจะไม่ขึ้นในกลุ่มค่ะ", size: "xs", color: "#6b7280", wrap: true, align: "center" },
          { type: "button", style: "primary", color: "#0f5132", height: "sm", margin: "md",
            action: { type: "uri", label: "🛒 ซื้อหวย", uri: "https://line.me/R/oaMessage/" + (process.env.OA_BASIC_ID || "@042xplcj") + "/?" + encodeURIComponent("สวัสดีค่ะ") } }
        ]
      }
    }
  };
  await lineReplyFlex(replyToken, flex);
}

/* GROUP-BOT: handle commands ใน group */
async function handleGroupCommand(replyToken, text, groupId) {
  const t = String(text || "").trim().toLowerCase();
  if (t === "/menu" || t === "เมนู") {
    /* GROUP-MENU-FIX: Flex menu — ปุ่มสั่งซื้อพาไปแชทส่วนตัว */
    try { await lineReplyFlex(replyToken, buildFlexMenu(true)); } catch (e) {}
    return true;
  }
  if (t === "/ผล" || t === "/ผลรางวัล" || t === "ผลรางวัล") {
    try {
      const rows = db.prepare(`
        SELECT l.name AS lottery_name, r.label, r.draw_date,
          (SELECT number FROM results WHERE round_id = r.id AND bet_type_id = 'three_top' LIMIT 1) AS t3,
          (SELECT number FROM results WHERE round_id = r.id AND bet_type_id = 'two_bottom' LIMIT 1) AS t2
        FROM rounds r JOIN lotteries l ON l.id = r.lottery_id
        WHERE r.result_status = 'finalized'
        ORDER BY r.draw_date DESC, r.draw_time DESC LIMIT 5
      `).all();
      if (!rows.length) {
        await lineReply(replyToken, "ยังไม่มีผลรางวัลในระบบค่ะ");
      } else {
        const lines = rows.map(r => `• ${r.lottery_name} ${r.label}\n  3 บน: ${r.t3 || "-"} · 2 ล่าง: ${r.t2 || "-"}`);
        await lineReply(replyToken, "📊 ผลรางวัลล่าสุด 5 งวดค่ะ\n\n" + lines.join("\n\n"));
      }
    } catch (e) { await lineReply(replyToken, "⚠️ ดูผลรางวัลไม่สำเร็จ"); }
    return true;
  }
  if (t === "/สุ่ม" || t === "สุ่ม") {
    const rand2 = () => String(Math.floor(Math.random() * 100)).padStart(2, "0");
    const rand3 = () => String(Math.floor(Math.random() * 1000)).padStart(3, "0");
    const msg = `🔮 เลขแนวทางวันนี้ค่ะ\n\n2 ตัว: ${rand2()} · ${rand2()} · ${rand2()}\n3 ตัว: ${rand3()} · ${rand3()}\n\n(เพื่อความบันเทิงนะคะ ไม่รับประกันถูกค่ะ 😅)`;
    await lineReply(replyToken, msg);
    return true;
  }
  if (t === "/หวยถัดไป" || t === "หวยถัดไป") {
    try {
      const now = bangkokTodayIso();
      const nowTime = new Date().toISOString().slice(11, 16);
      const rows = db.prepare(`
        SELECT l.name AS lottery_name, r.draw_date, r.draw_time
        FROM rounds r JOIN lotteries l ON l.id = r.lottery_id
        WHERE r.result_status = 'draft'
          AND ((r.draw_date > ?) OR (r.draw_date = ? AND r.draw_time > ?))
        ORDER BY r.draw_date ASC, r.draw_time ASC LIMIT 5
      `).all(now, now, nowTime);
      if (!rows.length) {
        await lineReply(replyToken, "ไม่มีหวยที่จะออกถัดไปค่ะ");
      } else {
        const lines = rows.map(r => `• ${r.lottery_name} ${r.draw_date.split("-").reverse().join("/")} เวลา ${r.draw_time}`);
        await lineReply(replyToken, "⏰ หวยที่จะออกถัดไปค่ะ\n\n" + lines.join("\n"));
      }
    } catch (e) { await lineReply(replyToken, "⚠️ ดูข้อมูลไม่สำเร็จ"); }
    return true;
  }
  return false; /* ไม่ใช่ command */
}

/* GROUP-BOT: broadcast ผลเข้าทุก group ที่ active+enabled */
/* BROADCAST-LOG: เก็บผล broadcast ทุก group + retry pending */
db.exec(`CREATE TABLE IF NOT EXISTS broadcast_log (
  id TEXT PRIMARY KEY,
  round_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending','sent','failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(round_id, group_id)
)`);

/* ALT1: LINE Multicast helper — ส่งหลาย destination ใน 1 call (max 500) */
async function lineMulticast(destinationIds, messages) {
  const token = _currentLineToken();
  if (!token) throw new Error("LINE_CHANNEL_TOKEN not set");
  if (!destinationIds.length) return { ok: true, sent: 0 };
  const url = "https://api.line.me/v2/bot/message/multicast";
  /* chunk 500 */
  const chunks = [];
  for (let i = 0; i < destinationIds.length; i += 500) chunks.push(destinationIds.slice(i, i + 500));
  let totalSent = 0;
  const failures = [];
  for (const chunk of chunks) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ to: chunk, messages }),
      });
      if (r.ok) totalSent += chunk.length;
      else {
        const errBody = await r.text().catch(()=>"");
        failures.push({ size: chunk.length, status: r.status, body: errBody.slice(0, 200) });
      }
    } catch (e) {
      failures.push({ size: chunk.length, error: e.message });
    }
  }
  return { ok: failures.length === 0, sent: totalSent, total: destinationIds.length, failures };
}

async function broadcastResultToGroups(roundId) {
  try {
    const round = db.prepare(`SELECT r.*, l.name AS lottery_name FROM rounds r JOIN lotteries l ON l.id=r.lottery_id WHERE r.id=?`).get(roundId);
    if (!round) return;
    const t3 = db.prepare(`SELECT number FROM results WHERE round_id=? AND bet_type_id='three_top' LIMIT 1`).get(roundId);
    const t2 = db.prepare(`SELECT number FROM results WHERE round_id=? AND bet_type_id='two_bottom' LIMIT 1`).get(roundId);
    const text = `🎯 ผลออกแล้วค่ะ\n${round.lottery_name} งวด ${round.label}\n\n3 บน: ${t3?.number || "-"}\n2 ล่าง: ${t2?.number || "-"}\n\nขอแสดงความยินดีกับผู้โชคดีนะคะ 🍀`;
    const groups = db.prepare(`SELECT group_id FROM line_groups WHERE status='active' AND broadcast_enabled=1`).all();
    const upsertLog = db.prepare(`INSERT INTO broadcast_log (id, round_id, group_id, status, attempt_count, last_error, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(round_id, group_id) DO UPDATE SET status=excluded.status, attempt_count=attempt_count+1, last_error=excluded.last_error, updated_at=excluded.updated_at`);
    /* ALT1: ใช้ multicast — 1 call ส่งได้ 500 group */
    const groupIds = groups.map(g => g.group_id);
    const result = await lineMulticast(groupIds, [{ type: "text", text }]);
    const nowIsoStr = nowIso();
    if (result.ok) {
      /* mark sent ทุก group */
      for (const g of groups) {
        upsertLog.run(crypto.randomUUID(), roundId, g.group_id, "sent", 1, null, nowIsoStr, nowIsoStr);
      }
      console.log(`[group-broadcast-mcast] round=${roundId} sent=${result.sent}/${result.total}`);
    } else {
      /* partial fail → mark sent สำหรับ chunk ที่ผ่าน, failed สำหรับที่เหลือ */
      for (const g of groups) {
        upsertLog.run(crypto.randomUUID(), roundId, g.group_id, result.sent > 0 ? "sent" : "failed", 1,
          result.failures.length ? JSON.stringify(result.failures).slice(0, 500) : null, nowIsoStr, nowIsoStr);
      }
      console.warn(`[group-broadcast-mcast] round=${roundId} partial sent=${result.sent}/${result.total} fail=${JSON.stringify(result.failures).slice(0,200)}`);
    }
  } catch (e) { console.error("[group-broadcast]", e.message); }
}

/* BROADCAST-LOG: retry pending failed broadcasts ทุก 5 นาที — max 3 retries */
async function retryFailedBroadcasts() {
  try {
    const rows = db.prepare(`SELECT id, round_id, group_id, attempt_count FROM broadcast_log WHERE status='failed' AND attempt_count < 3 ORDER BY updated_at ASC LIMIT 20`).all();
    if (!rows.length) return;
    for (const row of rows) {
      const round = db.prepare(`SELECT r.*, l.name AS lottery_name FROM rounds r JOIN lotteries l ON l.id=r.lottery_id WHERE r.id=?`).get(row.round_id);
      if (!round) {
        /* abandon: ไม่ให้ loop ตลอด — set attempt = 3 ทันที */
        db.prepare("UPDATE broadcast_log SET status='failed', attempt_count=3, last_error='round_not_found', updated_at=? WHERE id=?").run(nowIso(), row.id);
        continue;
      }
      const t3 = db.prepare(`SELECT number FROM results WHERE round_id=? AND bet_type_id='three_top' LIMIT 1`).get(row.round_id);
      const t2 = db.prepare(`SELECT number FROM results WHERE round_id=? AND bet_type_id='two_bottom' LIMIT 1`).get(row.round_id);
      const text = `🎯 ผลออกแล้วค่ะ\n${round.lottery_name} งวด ${round.label}\n\n3 บน: ${t3?.number || "-"}\n2 ล่าง: ${t2?.number || "-"}\n\nขอแสดงความยินดีกับผู้โชคดีนะคะ 🍀`;
      try {
        await linePush(row.group_id, text);
        db.prepare("UPDATE broadcast_log SET status='sent', attempt_count=attempt_count+1, last_error=NULL, updated_at=? WHERE id=?").run(nowIso(), row.id);
      } catch (e) {
        db.prepare("UPDATE broadcast_log SET attempt_count=attempt_count+1, last_error=?, updated_at=? WHERE id=?").run(String(e.message).slice(0,500), nowIso(), row.id);
      }
      await new Promise(r => setTimeout(r, 200));
    }
  } catch (e) { console.error("[broadcast-retry]", e.message); }
}
registerCron("broadcast-retry", retryFailedBroadcasts, 5 * 60 * 1000);

/* WINNER-PUSH: ส่ง push หาลูกค้าที่ถูกรางวัล + dedup */
db.exec(`CREATE TABLE IF NOT EXISTS winner_notifications (
  id TEXT PRIMARY KEY,
  round_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  total_payout REAL NOT NULL,
  sent_at TEXT NOT NULL,
  UNIQUE(round_id, customer_id)
)`);
async function pushWinnersToCustomers(roundId) {
  /* === DISCORD-HOOK-3 WINNERS collector === */
  const __dWinnersList = [];

  /* FEATURE FLAG: FEATURES_PUSH_WINNERS */
  if (process.env.FEATURES_PUSH_WINNERS !== "true") return;
  try {
    const round = db.prepare(`SELECT r.*, l.name AS lottery_name FROM rounds r JOIN lotteries l ON l.id=r.lottery_id WHERE r.id=?`).get(roundId);
    if (!round) return;
    const settlement = buildSettlement(roundId);
    if (!settlement.winners || !settlement.winners.length) return;
    /* group winners by customer */
    const byCustomer = {};
    for (const w of settlement.winners) {
      if (!byCustomer[w.customer_id]) byCustomer[w.customer_id] = { entries: [], total: 0 };
      byCustomer[w.customer_id].entries.push(w);
      byCustomer[w.customer_id].total = roundMoney(byCustomer[w.customer_id].total + (Number(w.payout) || 0));
    }
    const upsertNotif = db.prepare(`INSERT OR IGNORE INTO winner_notifications (id, round_id, customer_id, total_payout, sent_at) VALUES (?, ?, ?, ?, ?)`); /* B7 FIX-V2: ใช้ OR IGNORE + check changes สำหรับ atomic dedup */
    let pushed = 0;
    for (const [custId, info] of Object.entries(byCustomer)) {
      const cust = db.prepare("SELECT line_user_id, name FROM customers WHERE id=?").get(custId);
      if (!cust?.line_user_id) continue;
      /* dedup */
      /* B7 FIX: push ก่อน → ถ้าสำเร็จค่อย INSERT dedup */
      const entryLines = info.entries.slice(0, 5).map(e => `• ${e.bet_type_name} ${e.number}: ${Number(e.amount).toLocaleString("th-TH")} → ${Number(e.payout).toLocaleString("th-TH")} บ.`).join("\n");
      const more = info.entries.length > 5 ? `\n+${info.entries.length - 5} เลขเพิ่มเติม` : "";
      const text = `🎉 ยินดีด้วยค่ะ คุณ${cust.name}\n📋 ${round.lottery_name} งวด ${round.label}\n\n${entryLines}${more}\n\n💰 รวมเงินรางวัล: ${info.total.toLocaleString("th-TH")} บาท\n\n📌 รบกวนส่งข้อมูลบัญชีสำหรับโอนเงินรางวัลด้วยนะคะ\n• ธนาคาร\n• ชื่อบัญชี\n• เลขที่บัญชี\n\nทางเราจะรีบดำเนินการโอนให้โดยเร็วที่สุดค่ะ 🙏`;
      /* B7 FIX-V2: INSERT-first atomic dedup — กัน race condition ระหว่าง cron */
      let claimed;
      try {
        claimed = upsertNotif.run(crypto.randomUUID(), roundId, custId, info.total, nowIso());
      } catch (e) {
        console.warn("[winner-push] dedup insert", custId, e.message);
        continue;
      }
      if (!claimed || claimed.changes === 0) continue; /* คนอื่นจองไปแล้ว */
      try { __dWinnersList.push({ customer_id: custId, prize: Number(info.total) || 0 }); } catch {}
      try {
        /* === UX-FIX-V3-WINNER-QR === */
        const oaId = process.env.OA_BASIC_ID || "@042xplcj";
        const winnerQuickReply = {
          items: [
            { type: "action", action: { type: "uri", label: "📞 ติดต่อแอดมิน",
                uri: "https://line.me/R/oaMessage/" + oaId + "/?" + encodeURIComponent("ขอแจ้งเลขบัญชีรับรางวัล") } },
            { type: "action", action: { type: "message", label: "📋 ส่งเลขบัญชี",
                text: "ขอแจ้งเลขบัญชีรับรางวัล" } }
          ]
        };
        const ctx = lineContext.getStore();
        const wtoken = (ctx && ctx.token) || getUserChannelToken(cust.line_user_id);
        if (wtoken) {
          const r = await fetch("https://api.line.me/v2/bot/message/push", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + wtoken },
            body: JSON.stringify({ to: cust.line_user_id, messages: [{ type: "text", text, quickReply: winnerQuickReply }] }),
          });
          if (!r.ok) throw new Error("LINE push status " + r.status);
        } else {
          await linePush(cust.line_user_id, text);
        }
        pushed++;
      } catch (e) {
        console.warn("[winner-push]", custId, e.message);
        /* rollback dedup ให้ retry ได้ */
        try { db.prepare("DELETE FROM winner_notifications WHERE round_id=? AND customer_id=?").run(roundId, custId); } catch {}
      }
      await new Promise(rr => setTimeout(rr, 120));
    }
    console.log(`[push-winners] round=${roundId} winners=${settlement.winners.length} pushed=${pushed}`);
  } catch (e) { console.error("[push-winners]", e.message); }

  /* === DISCORD-HOOK-3 WINNERS summary === */
  try {
    if (__dWinnersList.length > 0) {
      const __dRoundRow = db.prepare("SELECT r.id, r.draw_date, l.name AS lot_name FROM rounds r LEFT JOIN lotteries l ON l.id=r.lottery_id WHERE r.id=?").get(roundId);
      const __dLotName = __dRoundRow ? (__dRoundRow.lot_name || "") : "";
      const __dDrawDate = __dRoundRow ? (__dRoundRow.draw_date || "") : "";
      const __dCustIds = __dWinnersList.map(w => w.customer_id).filter(Boolean);
      const __dCustMap = {};
      if (__dCustIds.length) {
        const __dPh = __dCustIds.map(() => "?").join(",");
        const __dRows = db.prepare("SELECT id, name, line_display_name FROM customers WHERE id IN (" + __dPh + ")").all(...__dCustIds);
        for (const r2 of __dRows) __dCustMap[r2.id] = r2.name || r2.line_display_name || r2.id;
      }
      const __dTotal = __dWinnersList.reduce((s, w) => s + (Number(w.prize) || 0), 0);
      const __dSorted = __dWinnersList.slice().sort((a, b) => (b.prize || 0) - (a.prize || 0));
      const __dDesc = __dSorted.slice(0, 10).map((w, i) =>
        (i + 1) + ". " + safeName(__dCustMap[w.customer_id] || w.customer_id || "-") + " — " + Number(w.prize || 0).toLocaleString() + " บาท"
      ).join("\n") + (__dSorted.length > 10 ? "\n... และอีก " + (__dSorted.length - 10) + " คน" : "");
      notifyDiscord("winners", {
        embeds: [makeEmbed({
          title: "🏆 ผู้ถูกรางวัล — " + safeName(__dLotName) + " " + safeName(__dDrawDate),
          color: 0xffd700,
          description: __dDesc,
          fields: [
            { name: "รวมจ่าย", value: __dTotal.toLocaleString() + " บาท", inline: true },
            { name: "จำนวน", value: __dWinnersList.length + " คน", inline: true },
          ],
        })],
      }).catch(() => {});
    }
  } catch (e) { console.warn("[discord-hook-3]", e.message); }
}


/* LOSE-PUSH: ส่ง push ลูกค้าที่ไม่ถูก — แบบ C ละเอียด */
db.exec(`CREATE TABLE IF NOT EXISTS loser_notifications (
  id TEXT PRIMARY KEY,
  round_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  UNIQUE(round_id, customer_id)
)`);
async function pushLosersToCustomers(roundId) {
  /* FEATURE FLAG: FEATURES_PUSH_LOSERS */
  if (process.env.FEATURES_PUSH_LOSERS !== "true") return;
  try {
    const round = db.prepare(`SELECT r.*, l.name AS lottery_name FROM rounds r JOIN lotteries l ON l.id=r.lottery_id WHERE r.id=?`).get(roundId);
    if (!round) return;
    const t3 = db.prepare(`SELECT number FROM results WHERE round_id=? AND bet_type_id='three_top' LIMIT 1`).get(roundId);
    const t2 = db.prepare(`SELECT number FROM results WHERE round_id=? AND bet_type_id='two_bottom' LIMIT 1`).get(roundId);
    /* หาลูกค้าที่มี approved tickets ในงวดนี้ + line_user_id */
    const customers = db.prepare(`
      SELECT DISTINCT c.id, c.line_user_id, c.name
      FROM customers c
      JOIN tickets t ON t.customer_id = c.id
      WHERE t.round_id = ? AND t.status='approved' AND c.line_user_id IS NOT NULL
    `).all(roundId);
    if (!customers.length) return;
    /* skip คนที่ถูก (มีใน winner_notifications) */
    const winners = new Set(
      db.prepare(`SELECT customer_id FROM winner_notifications WHERE round_id=?`).all(roundId).map(r => r.customer_id)
    );
    /* หางวดหน้าของหวยนี้ */
    const nextRound = db.prepare(`
      SELECT label, draw_date, draw_time FROM rounds
      WHERE lottery_id=? AND status='open' AND (draw_date > ? OR (draw_date = ? AND draw_time > ?))
      ORDER BY draw_date ASC, draw_time ASC LIMIT 1
    `).get(round.lottery_id, round.draw_date, round.draw_date, round.draw_time);
    const dayNames = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัส","ศุกร์","เสาร์"];
    let nextLine = "";
    if (nextRound) {
      const [y, m, d] = nextRound.draw_date.split("-").map(Number);
      const dow = new Date(Date.UTC(y, m-1, d)).getUTCDay();
      nextLine = `\n🍀 งวดหน้า: ${dayNames[dow]} ${nextRound.label} (${nextRound.draw_time}) เปิดแล้ว`;
    }
    const upsertNotif = db.prepare(`INSERT OR IGNORE INTO loser_notifications (id, round_id, customer_id, sent_at) VALUES (?, ?, ?, ?)`);
    let pushed = 0;
    for (const cust of customers) {
      if (winners.has(cust.id)) continue;
      /* B7 FIX-L: check dedup ก่อน push */
      const already = db.prepare("SELECT 1 FROM loser_notifications WHERE round_id=? AND customer_id=?").get(roundId, cust.id);
      if (already) continue;
      /* รวม tickets + entries ของลูกค้านี้ */
      const tickets = db.prepare(`SELECT id, code, total_amount FROM tickets WHERE customer_id=? AND round_id=? AND status='approved'`).all(cust.id, roundId);
      const entriesByType = {};
      for (const t of tickets) {
        const ents = db.prepare(`
          SELECT e.number, e.amount, bt.name AS bet_type_name
          FROM entries e JOIN bet_types bt ON bt.id = e.bet_type_id
          WHERE e.ticket_id=?
        `).all(t.id);
        for (const e of ents) {
          if (!entriesByType[e.bet_type_name]) entriesByType[e.bet_type_name] = [];
          entriesByType[e.bet_type_name].push({ number: e.number, amount: Number(e.amount) });
        }
      }
      /* === UX-FIX-V1-NO-DUPLICATE-NOTIF === ตัด totalBill/billCodes/entryLines ออก คนแก่อ่านแล้วเจ็บใจ */
      void tickets; void entriesByType;
      const text = `📢 ผลออก ${round.lottery_name} งวด ${round.label}\n` +
                   `3 บน ${t3?.number || "-"} · 2 ล่าง ${t2?.number || "-"}\n\n` +
                   `คุณ${cust.name} งวดนี้ยังไม่ถูกค่ะ 🙏\n` +
                   `ขอให้โชคดีงวดหน้านะคะ 🍀` +
                   nextLine;
      try {
        await linePush(cust.line_user_id, text);
        upsertNotif.run(crypto.randomUUID(), roundId, cust.id, nowIso());
        pushed++;
      } catch (e) { console.warn("[loser-push]", cust.id, e.message); /* ไม่ insert dedup — retry ครั้งหน้าได้ */ }
      await new Promise(rr => setTimeout(rr, 120));
    }
    console.log(`[push-losers] round=${roundId} customers=${customers.length} winners=${winners.size} pushed=${pushed}`);
  } catch (e) { console.error("[push-losers]", e.message); }
}


/* JOURNEY-A: helper — reply พร้อม Quick Reply ปุ่มถาวรใต้แชท */



function ensureContactChannel(userId, channelSlug) {
  if (!userId) return;
  try {
    db.prepare("UPDATE line_contacts SET channel_slug = ? WHERE line_user_id = ? AND (channel_slug IS NULL OR channel_slug = 'main')").run(channelSlug || 'main', userId);
  } catch (e) {}
}

function getUserChannelToken(userId) {
  try {
    const row = db.prepare("SELECT channel_slug FROM line_contacts WHERE line_user_id = ? LIMIT 1").get(userId);
    const slug = row?.channel_slug || 'main';
    const ch = getLineChannel(slug);
    return (ch && ch.channel_token) || process.env.LINE_CHANNEL_TOKEN;
  } catch { return process.env.LINE_CHANNEL_TOKEN; }
}

function _currentLineToken() {
  const ctx = lineContext.getStore();
  return (ctx && ctx.token) || process.env.LINE_CHANNEL_TOKEN;
}

async function lineReplyWithMenu(replyToken, text, extraButtons) {
  const token = _currentLineToken();
  if (!token || !replyToken) return;
  const liffUrl = process.env.LIFF_URL || "https://liff.line.me/2010170072-GDDXzvaN";
  const baseUrl = process.env.BASE_URL || "https://lottery.139-59-123-146.nip.io";
  /* === UX-FIX-V1-NO-DUPLICATE-NOTIF === ลด 4 → 3 ปุ่ม + เพิ่มบิลของฉัน (ตัดบัญชี+อัตราจ่ายออก มีใน Rich menu) */
  const items = [
    { type: "action", action: { type: "uri", label: "✍️ แทงหวย", uri: liffUrl } },
    { type: "action", action: { type: "uri", label: "📋 บิลของฉัน", uri: baseUrl + "/my-orders" } },
    { type: "action", action: { type: "uri", label: "📊 ผลรางวัล", uri: baseUrl + "/lotto" } },
  ];
  if (Array.isArray(extraButtons)) items.unshift(...extraButtons);
  const messages = [{ type: "text", text: String(text), quickReply: { items: items.slice(0, 13) } }];
  try {
    await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ replyToken, messages }),
    });
  } catch (e) { console.error("[lineReplyWithMenu]", e.message); }
}


/* JOURNEY-B: Flex menu — in-chat menu (ลอย ๆ ในแชท) */
function buildFlexMenu(isGroup) {
  const liffUrl = process.env.LIFF_URL || "https://liff.line.me/2010170072-GDDXzvaN";
  const baseUrl = process.env.BASE_URL || "https://lottery.139-59-123-146.nip.io";
  /* GROUP-MENU: ถ้าอยู่ในกลุ่ม → ปุ่มสั่งซื้อพาไปแชทส่วนตัว OA */
  const oaId = process.env.OA_BASIC_ID || "@042xplcj";
  const orderUri = isGroup
    ? ("https://line.me/R/oaMessage/" + oaId + "/?" + encodeURIComponent("ขอสั่งซื้อหวยค่ะ"))
    : liffUrl;
  const subtitle = isGroup ? "กดปุ่มสั่งซื้อ → แชทส่วนตัวอัตโนมัติ" : "เลือกบริการที่ต้องการ";
  return {
    type: "flex",
    altText: "เมนูบริการ",
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box", layout: "vertical",
        backgroundColor: "#0f5132",
        paddingAll: "16px",
        contents: [
          { type: "text", text: "บ้านหวยเรือนเลขเศรษฐี", color: "#ffffff", weight: "bold", size: "md", align: "center" },
          { type: "text", text: subtitle, color: "#d1fae5", size: "xs", align: "center", margin: "sm" },
        ]
      },
      body: {
        type: "box", layout: "vertical", spacing: "sm", paddingAll: "12px",
        contents: [
          { type: "button", style: "primary", color: "#0f5132", height: "sm",
            action: { type: "uri", label: "✍️  แทงหวย", uri: orderUri } },
          { type: "button", style: "primary", color: "#1e40af", height: "sm",
            action: { type: "uri", label: "🏦  ดูเลขบัญชี", uri: baseUrl + "/info/account" } },
          { type: "button", style: "primary", color: "#b45309", height: "sm",
            action: { type: "message", label: "📊  ผลรางวัล", text: "ผลรางวัล" } },
          { type: "button", style: "primary", color: "#7c2d12", height: "sm",
            action: { type: "uri", label: "💵  อัตราจ่าย", uri: baseUrl + "/info/rates" } },
          { type: "separator", margin: "sm" },
          { type: "button", style: "secondary", height: "sm",
            action: { type: "message", label: "📋  ดูบิลของฉัน", text: "บิลของฉัน" } },
        ]
      }
    }
  };
}
async function lineReplyFlex(replyToken, flexMessage) {
  const token = _currentLineToken();
  if (!token || !replyToken) return;
  try {
    await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ replyToken, messages: [flexMessage] }),
    });
  } catch (e) { console.error("[lineReplyFlex]", e.message); }
}

/* JOURNEY-B: keywords */
/* QUIET-MODE-V2: exact-match keywords only — bot ไม่ตอบคำพูดทั่วไป */
const KW_MY_BILL = /^\s*(บิลของฉัน|สถานะ|สถานะบิล|บิลล่าสุด|ดูบิล)\s*$/i;
const KW_CANCEL  = /^\s*(ยกเลิก|ยกเลิกบิล)\s*$/i;
const KW_RESULT  = /^\s*(ผล|ผลหวย|ผลรางวัล|ตรวจหวย|ตรวจผล)\s*$/i;
const KW_MENU    = /^\s*(เมนู|menu)\s*$/i;
const KW_REGISTER= /^\s*(สมัคร|สมัครสมาชิก)\s*$/i;
const KW_GROUP   = /^\s*(กลุ่ม|กลุ่มแนวทาง)\s*$/i;
/* DISABLED keywords (ทับคำสนทนาทั่วไป) */
/* === UX-FIX-V3-FALLBACK === in-memory dedup สำหรับ fallback flex menu */
const __fallbackSent = new Map(); // userId -> timestamp ms
function shouldSendFallback(uid) {
  if (!uid) return false;
  const t = __fallbackSent.get(uid) || 0;
  if (Date.now() - t < 86400000) return false;
  __fallbackSent.set(uid, Date.now());
  /* prune ถ้าเกิน 5k entry */
  if (__fallbackSent.size > 5000) {
    const cutoff = Date.now() - 86400000;
    for (const [k, v] of __fallbackSent) if (v < cutoff) __fallbackSent.delete(k);
  }
  return true;
}
/* === UX-FIX-V3-KW === เปิด keyword routing สำหรับลูกค้าผู้สูงอายุ */
const KW_BUY  = /^\s*(ซื้อ|ซื้อหวย|แทง|แทงหวย|สั่ง|order|buy)\s*$/i;
const KW_BANK = /^\s*(บัญชี|เลขบัญชี|โอนเงิน|โอน|จ่าย|payment|bank)\s*$/i;
const KW_HELP = /^\s*(ช่วย|ช่วยด้วย|help|ทำไง|ใช้ยังไง|วิธี|how|งง)\s*$/i;

async function lineReply(replyToken, text) {
  const token = _currentLineToken();
  if (!token || !replyToken) return;
  try {
    const r = await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
      body: JSON.stringify({ replyToken, messages: [{ type: "text", text }] }),
    });
    if (!r.ok) console.error("[line-reply] failed:", r.status, await r.text().catch(()=>""));
  } catch (e) { console.error("[line-reply] error:", e.message); }
}


/* MULTI-TENANT LINE: helper resolve channel + token/secret */
function _envOrLiteral(value) {
  if (typeof value === "string" && value.startsWith("ENV:")) {
    return process.env[value.slice(4)] || "";
  }
  return value || "";
}
function getLineChannel(slugOrId) {
  /* fallback: ถ้าไม่ระบุ → main */
  const slug = slugOrId || "main";
  const row = db.prepare("SELECT * FROM line_channels WHERE (slug=? OR id=?) AND active=1").get(slug, slug);
  if (!row) return null;
  return {
    ...row,
    channel_token: _envOrLiteral(row.channel_token),
    channel_secret: _envOrLiteral(row.channel_secret),
  };
}
function getMainChannel() { return getLineChannel("main"); }

/* push ผ่าน channel ที่ระบุ — default = main */
async function linePushAs(channelSlug, userId, text) {
  const ch = getLineChannel(channelSlug);
  if (!ch || !ch.channel_token) {
    console.warn("[linePushAs] no channel/token", channelSlug);
    return;
  }
  try {
    await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + ch.channel_token },
      body: JSON.stringify({ to: userId, messages: typeof text === "string" ? [{ type: "text", text }] : text }),
    });
  } catch (e) { console.warn("[linePushAs]", channelSlug, e.message); }
}

async function linePush(userId, text) {
  /* MULTI-TENANT push: ใช้ ALS context ถ้ามี (= webhook request), else lookup channel ของ user */
  const ctx = lineContext.getStore();
  const token = (ctx && ctx.token) || getUserChannelToken(userId);
  if (!token || !userId) return;
  try {
    const r = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
      body: JSON.stringify({ to: userId, messages: [{ type: "text", text }] }),
    });
    if (!r.ok) console.error("[line-push] failed:", r.status);
  } catch (e) { console.error("[line-push] error:", e.message); }
}

async function fetchLineMessageContent(messageId, hintUserId) {
  /* MULTI-TENANT: prefer ALS, fallback user-channel */
  const ctx = lineContext.getStore();
  const token = (ctx && ctx.token) || (hintUserId ? getUserChannelToken(hintUserId) : process.env.LINE_CHANNEL_TOKEN);
  if (!token) throw new Error("LINE_CHANNEL_TOKEN not set");
  const r = await fetch(`https://api-data.line.me/v2/bot/message/${encodeURIComponent(messageId)}/content`, {
    headers: { "Authorization": "Bearer " + token },
  });
  if (!r.ok) throw new Error("LINE content fetch failed: " + r.status);
  const arrayBuf = await r.arrayBuffer();
  return Buffer.from(arrayBuf);
}

// --- slip2go ---

/* ALT3: Slip image hash table + dedup ก่อนเรียก slip2go (กัน quota burn) */
db.exec(`CREATE TABLE IF NOT EXISTS slip_image_hashes (
  hash TEXT PRIMARY KEY,
  customer_id TEXT,
  line_user_id TEXT,
  ticket_id TEXT,
  result TEXT,
  created_at TEXT NOT NULL
)`);
function computeSlipImageHash(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function verifySlipViaSlip2Go(imageBuffer, originalName = "slip.jpg") {
  const key = process.env.SLIP2GO_API_KEY;
  if (!key) throw new Error("SLIP2GO_API_KEY not set");
  const url = SLIP2GO_BASE_URL.replace(/\/$/, "") + SLIP2GO_ENDPOINT_PATH;

  /* Slip2go Base64 endpoint expects JSON body { payload: { imageBase64: "data:image/jpeg;base64,..." } } */
  const b64 = imageBuffer.toString("base64");
  const dataUri = "data:image/jpeg;base64," + b64;

  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + key,
    },
    body: JSON.stringify({ payload: { imageBase64: dataUri } }),
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error("slip2go error " + r.status);
    e.status = r.status;
    e.body = json;
    throw e;
  }
  return json;
}

/** Normalize slip2go response to standard shape — defensive across response variations */
/* SLIP-FIX-V2: safe account normalizer — handle object case (กัน "[object Object]") */
function _normSlipAccount(x) {
  if (!x) return "";
  if (typeof x === "string") return x;
  if (typeof x === "number") return String(x);
  if (typeof x === "object") {
    return String(x.value || x.number || x.account || x.id || x.acc || "");
  }
  return "";
}
function normalizeSlipData(raw) {
  if (!raw) return null;
  const d = raw.data || raw.result || raw;
  const amount = Number(d.amount?.amount || d.amount || d.transAmount || 0);
  const transactionId = d.transRef || d.transactionRef || d.transactionId || d.transaction?.ref || null;
  const senderName = d.sender?.account?.name?.th || d.sender?.name || d.payerName || null;
  const senderBank = d.sender?.bank?.id || d.sender?.bank?.name || d.payerBank || null;
  const senderAccount = _normSlipAccount(d.sender?.account) || _normSlipAccount(d.payerAccount);
  const receiverName = d.receiver?.account?.name?.th || d.receiver?.name || d.receiverName || null;
  const receiverBank = d.receiver?.bank?.id || d.receiver?.bank?.name || null;
  const receiverAccount = _normSlipAccount(d.receiver?.account) || _normSlipAccount(d.receiverAccount);
  const transDate = d.transDate || d.transactionDate || d.dateTime || null;
  const ref1 = d.ref1 || d.reference1 || d.note?.ref1 || d.transaction?.ref1 || null;
  const ref2 = d.ref2 || d.reference2 || d.note?.ref2 || d.transaction?.ref2 || null;
  return { amount, transactionId, senderName, senderBank, senderAccount, receiverName, receiverBank, receiverAccount, transDate, ref1, ref2 };
}

/** strip non-digits to compare account numbers */
function normalizeAccountNumber(s) {
  return String(s || "").replace(/[^0-9]/g, "");
}

// --- Match + approve logic ---
async function matchAndApproveSlip(customer, slipData, replyToken, lineUserId) {
  /* 1. duplicate check */
  if (slipData.transactionId) {
    const dup = db.prepare("SELECT id, code FROM tickets WHERE slip_transaction_id = ?").get(slipData.transactionId);
    if (dup) {
      await lineReply(replyToken, SLIP_REPLY_DUPLICATE);
      logAudit(null, "slip_duplicate", "ticket", dup.id, { lineUserId, txnId: slipData.transactionId });
      return { result: "duplicate", existingTicketId: dup.id };
    }
  }

  /* 2. receiver_account check — must match an active bank_account */
  const receiverNorm = normalizeAccountNumber(slipData.receiverAccount);
  if (receiverNorm && !SLIP_SKIP_RECEIVER_CHECK) {
    const allActive = db.prepare("SELECT account_number FROM bank_accounts WHERE status IN ('active','cooling')").all();
    const ok = allActive.some(b => normalizeAccountNumber(b.account_number) === receiverNorm);
    if (!ok) {
      await lineReply(replyToken, SLIP_REPLY_WRONG_RECEIVER);
      logAudit(null, "slip_wrong_receiver", "ticket", null, { lineUserId, receiverAccount: slipData.receiverAccount });
      return { result: "wrong_receiver" };
    }
  }

  /* SLIP-SECURITY v2: ตรวจอายุสลิป — รับ format ของไทย + treat naive datetime เป็น Asia/Bangkok */
  if (slipData.transDate) {
    let txnTimeMs = NaN;
    const s = String(slipData.transDate).trim();
    /* ISO with TZ — ใช้ Date.parse ตรง ๆ */
    if (/[+-]\d{2}:?\d{2}|Z$/.test(s)) {
      txnTimeMs = Date.parse(s);
    } else {
      /* naive "YYYY-MM-DD HH:MM:SS" หรือ "YYYY-MM-DDTHH:MM:SS" → assume Asia/Bangkok = +07:00 */
      const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
      if (m) {
        txnTimeMs = Date.UTC(+m[1], +m[2]-1, +m[3], +m[4]-7, +m[5], +(m[6]||0));
      } else {
        /* Thai BE format: "04/06/2567 14:33" → แปลง พ.ศ. → ค.ศ. */
        const t = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
        if (t) {
          let yr = +t[3]; if (yr > 2400) yr -= 543;
          txnTimeMs = Date.UTC(yr, +t[2]-1, +t[1], +t[4]-7, +t[5], 0);
        }
      }
    }
    if (!isNaN(txnTimeMs)) {
      const ageMin = (Date.now() - txnTimeMs) / 60000;
      if (ageMin > SLIP_MAX_AGE_MIN) {
        await lineReply(replyToken, SLIP_REPLY_TOO_OLD);
        logAudit(null, "slip_too_old", "ticket", null, { lineUserId, transDate: slipData.transDate, ageMin: Math.round(ageMin), txnId: slipData.transactionId });
        /* U-H FIX: push admin — กันลูกค้าโอนซ้ำ + admin ช่วยตรวจ */
        try {
          const bossId = getBossLineUserId && getBossLineUserId();
          if (bossId) {
            await linePush(bossId, `⚠️ ลูกค้าส่งสลิปเก่าเกิน ${Math.round(ageMin)} นาที (เกิน ${SLIP_MAX_AGE_MIN} นาที)\nLINE userId: ${lineUserId}\nยอด: ${slipData.amount}\ntxnId: ${slipData.transactionId}\n\nกรุณาเช็คก่อนแจ้งลูกค้าโอนใหม่`);
          }
        } catch (e) { console.warn("[too-old push admin]", e.message); }
        return { result: "too_old", ageMin };
      }
    } else {
      /* parse failed — log ไว้ทำ tuning, ไม่ block */
      logAudit(null, "slip_date_unparse", "ticket", null, { lineUserId, transDate: slipData.transDate, txnId: slipData.transactionId });
    }
  }

  /* 3. find matching pending tickets */
  const cutoff = new Date(Date.now() - SLIP_MATCH_WINDOW_MIN * 60 * 1000).toISOString();
  const candidates = db.prepare(`
    SELECT t.id, t.code, COALESCE((SELECT SUM(amount) FROM entries WHERE ticket_id = t.id), 0) AS total
    FROM tickets t
    WHERE t.customer_id = ?
      AND t.status = 'pending_review'
      AND t.created_at >= ?
  `).all(customer.id, cutoff);

  /* F4-MATCH: ลอง match ด้วย ref ก่อน (PromptPay QR ที่ใส่ ticket_code) */
  let matches = [];
  const refCode = String(slipData.ref1 || slipData.ref2 || "").trim().toUpperCase();
  if (refCode) {
    const byRef = candidates.find(c => c.code && refCode.includes(c.code.toUpperCase()));
    if (byRef && Math.abs(byRef.total - slipData.amount) < 0.01) {
      matches = [byRef];
      logAudit(null, "slip_match_by_ref", "ticket", byRef.id, { lineUserId, ref: refCode });
    }
  }
  /* fallback: amount match แบบเดิม */
  if (matches.length === 0) {
    matches = candidates.filter(c => Math.abs(c.total - slipData.amount) < 0.01);
  }

  if (matches.length === 0) {
    await lineReply(replyToken, SLIP_REPLY_NO_MATCH);
    logAudit(null, "slip_no_match", "ticket", null, { lineUserId, slipAmount: slipData.amount, candidates: candidates.length });
    return { result: "no_match" };
  }

  if (matches.length > 1) {
    await lineReply(replyToken, SLIP_REPLY_AMBIGUOUS(matches.length));
    logAudit(null, "slip_ambiguous", "ticket", null, { lineUserId, slipAmount: slipData.amount, matches: matches.length });
    return { result: "ambiguous", count: matches.length };
  }

  /* 4. exactly 1 match → auto-approve */
  if (!SLIP_AUTO_APPROVE) {
    await lineReply(replyToken, SLIP_REPLY_NO_MATCH);
    return { result: "auto_approve_disabled" };
  }

  const ticket = matches[0];
  let approveRowsAffected = 0;
  withTransaction(() => {
    /* C2 fix: re-check pending_review inside transaction + idempotent on slip_transaction_id */
    if (slipData.transactionId) {
      const dup2 = db.prepare("SELECT id FROM tickets WHERE slip_transaction_id = ?").get(slipData.transactionId);
      if (dup2) return; /* race: another worker approved this slip */
    }
    const r = db.prepare(`
      UPDATE tickets SET
        status='approved',
        slip_transaction_id=?,
        slip_amount=?,
        slip_sender_bank=?,
        slip_sender_account=?,
        slip_verified_at=?,
        slip_raw_json=?,
        checked_at=?,
        updated_at=?
      WHERE id=? AND status='pending_review'
    `).run(
      slipData.transactionId || null,
      slipData.amount,
      slipData.senderBank || null,
      slipData.senderAccount || null,
      nowIso(),
      JSON.stringify(slipData),
      nowIso(),
      nowIso(),
      ticket.id
    );
    approveRowsAffected = r.changes;
    if (r.changes === 0) return; /* C2: ticket no longer pending — skip deposit */
    /* SLIP-AUDIT: log approved */
    try {
      logAudit(null, "slip_approved", "ticket", ticket.id, {
        lineUserId, txnId: slipData.transactionId, amount: slipData.amount,
        senderName: slipData.senderName, senderBank: slipData.senderBank,
        receiverAccount: slipData.receiverAccount, transDate: slipData.transDate
      });
    } catch (e) {}
    /* CUST-BANK-FIX: ใช้ normalizeAccountNumber + verify match + log */
    if (receiverNorm && slipData.amount > 0) {
      const accounts = db.prepare("SELECT id, account_number FROM bank_accounts").all();
      const targetAcc = accounts.find(a => normalizeAccountNumber(a.account_number) === receiverNorm);
      if (targetAcc) {
        const amt = roundMoney(slipData.amount);
        const r = db.prepare(`
          UPDATE bank_accounts
          SET total_received_today = total_received_today + ?,
              status = CASE WHEN status = 'active' AND total_received_today + ? >= daily_limit THEN 'cooling' ELSE status END,
              updated_at = ?
          WHERE id = ?
        `).run(amt, amt, nowIso(), targetAcc.id);
        if (r.changes > 0) {
          console.log(`[bank-update] customer slip approved — +${amt} → ${targetAcc.account_number}`);
        } else {
          console.warn(`[bank-update] FAIL no rows — target=${targetAcc.id}`);
        }
      } else {
        console.warn(`[bank-update] receiverAccount "${receiverNorm}" no match in bank_accounts (${accounts.length} active)`);
        logAudit(null, "bank_no_match", "ticket", ticket.id, { receiverNorm, accounts: accounts.map(a=>a.account_number) });
      }
    } else {
      console.warn(`[bank-update] skip — receiverNorm="${receiverNorm}" amount=${slipData.amount}`);
    }
  });
  if (approveRowsAffected === 0) {
    /* C2 fix: race lost — ticket already cancelled or duplicate slip */
    await lineReply(replyToken, SLIP_REPLY_NO_MATCH);
    logAudit(null, "slip_race_lost", "ticket", ticket.id, { lineUserId, txnId: slipData.transactionId });
    return { result: "race_lost", ticketId: ticket.id };
  }
  logAudit(null, "auto_approve_slip", "ticket", ticket.id, { lineUserId, txnId: slipData.transactionId, amount: slipData.amount });
  await lineReply(replyToken, SLIP_REPLY_APPROVED(ticket.code, slipData.amount));
  return { result: "approved", ticketId: ticket.id, code: ticket.code };
}

// --- LINE webhook signature verify (HMAC-SHA256) ---
function verifyLineSignature(rawBody, signatureHeader) {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) return false;
  if (!signatureHeader || typeof signatureHeader !== "string") return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  /* C1 fix: constant-time compare (defend against timing attack) */
  const a = Buffer.from(signatureHeader, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  try { return crypto.timingSafeEqual(a, b); } catch { return false; }
}

// --- LINE webhook endpoint ---
/* Use express.raw to get unparsed body for HMAC */

/* O2: /healthz — readiness check (DB + external token reachability) */
/* CRON HEALTHZ: เช็คทุก cron ใน registry — ถ้าตัวใดค้าง interval x 3 = unhealthy */
app.get("/healthz/cron", (_req, res) => {
  try {
    const now = Date.now();
    const stuck = [];
    const running = [];
    for (const [name, entry] of __cronRegistry) {
      if (!entry.lastRun) { running.push({name, status:"never-ran"}); continue; }
      const ageMs = now - new Date(entry.lastRun).getTime();
      const stuckThreshold = entry.intervalMs * 3;
      if (ageMs > stuckThreshold) {
        stuck.push({name, ageMs, intervalMs: entry.intervalMs, runCount: entry.runCount});
      } else {
        running.push({name, lastRunAgeMs: ageMs, runCount: entry.runCount});
      }
    }
    if (stuck.length > 0) {
      return res.status(500).json({status:"unhealthy", stuck, running, ts: new Date().toISOString()});
    }
    res.json({status:"healthy", running, ts: new Date().toISOString()});
  } catch(e) { res.status(500).json({status:"error", error: e.message}); }
});

app.get("/healthz", async (_req, res) => {
  const checks = { service: "ok", db: "unknown", lineToken: "unknown", apilottoToken: "unknown", slip2goKey: "unknown" };
  try {
    db.prepare("SELECT 1").get();
    checks.db = "ok";
  } catch (e) { checks.db = "fail: " + e.message; }
  checks.lineToken = process.env.LINE_CHANNEL_TOKEN ? "configured" : "missing";
  checks.apilottoToken = process.env.APILOTTO_API_KEY ? "configured" : "missing";
  checks.slip2goKey = process.env.SLIP2GO_API_KEY ? "configured" : "missing";
  const allOk = checks.db === "ok" && checks.lineToken === "configured";
  res.status(allOk ? 200 : 503).json({ status: allOk ? "ready" : "degraded", checks, ts: nowIso() });
});

/* O2: /metrics — Prometheus-style counters */
app.get("/metrics", (_req, res) => {
  const counts = {};
  try {
    counts.tickets_total = db.prepare("SELECT COUNT(*) AS c FROM tickets").get().c;
    counts.tickets_pending = db.prepare("SELECT COUNT(*) AS c FROM tickets WHERE status='pending_review'").get().c;
    counts.tickets_approved_today = db.prepare("SELECT COUNT(*) AS c FROM tickets WHERE status='approved' AND date(updated_at) = date('now','localtime')").get().c;
    counts.rounds_open = db.prepare("SELECT COUNT(*) AS c FROM rounds WHERE status='open'").get().c;
    counts.broadcast_failed_pending = db.prepare("SELECT COUNT(*) AS c FROM broadcast_log WHERE status='failed' AND attempt_count<3").get().c;
    counts.winner_notifications_total = db.prepare("SELECT COUNT(*) AS c FROM winner_notifications").get().c;
    counts.audit_logs_today = db.prepare("SELECT COUNT(*) AS c FROM audit_logs WHERE date(created_at) = date('now','localtime')").get().c;
    counts.hh_slips_pending = db.prepare("SELECT COUNT(*) AS c FROM head_house_slip_ledger WHERE status='pending'").get().c;
    /* METRICS-V2: alert + business + cron metrics */
    counts.overdue_rounds = (() => { try { return db.prepare(`SELECT COUNT(DISTINCT r.id) AS c FROM rounds r JOIN result_sources rs ON rs.lottery_id = r.lottery_id WHERE rs.provider = 'API Lotto' AND rs.active = 1 AND r.result_status = 'draft' AND r.draw_date = date('now','+7 hours') AND r.draw_time <= time('now','+7 hours','-10 minutes')`).get().c; } catch(e) { return -1; } })();
    counts.slip_too_old_today = db.prepare("SELECT COUNT(*) AS c FROM audit_logs WHERE action='slip_too_old' AND date(created_at)=date('now','localtime')").get().c;
    counts.slip_no_match_today = db.prepare("SELECT COUNT(*) AS c FROM audit_logs WHERE action='slip_no_match' AND date(created_at)=date('now','localtime')").get().c;
    counts.broadcast_failed_today = db.prepare("SELECT COUNT(*) AS c FROM broadcast_log WHERE status='failed' AND date(created_at)=date('now','localtime')").get().c;
    counts.refund_requests_open = 0; /* feature ถูก revert ไป */
    counts.banks_active = db.prepare("SELECT COUNT(*) AS c FROM bank_accounts WHERE status='active'").get().c;
    counts.banks_cooling = db.prepare("SELECT COUNT(*) AS c FROM bank_accounts WHERE status='cooling'").get().c;
  } catch (e) {}
  /* Prometheus text format */
  const lines = [];
  for (const [k, v] of Object.entries(counts)) {
    lines.push(`# TYPE lottery_${k} gauge`);
    lines.push(`lottery_${k} ${v}`);
  }
  res.type("text/plain").send(lines.join("\n") + "\n");
});

app.post("/api/line/webhook",
  async (req, res) => {
    const signature = req.headers["x-line-signature"];
    const rawBody = req.rawBody || (req.body ? JSON.stringify(req.body) : "");
    if (!verifyLineSignature(rawBody, signature)) {
      return res.status(401).json({ error: "invalid_signature" });
    }
    /* Always respond 200 to LINE quickly; process async */
    res.status(200).end();
    let payload;
    try { payload = JSON.parse(rawBody); } catch (e) { return; }
    const events = Array.isArray(payload.events) ? payload.events : [];
    for (const event of events) {
      try { await handleLineEvent(event); }
      catch (e) { console.error("[line-webhook] event error:", e.message); }
    }
  }
);


/* MULTI-TENANT WEBHOOK: รับ webhook จาก channel อื่น (hb009, ...) */
app.post("/api/line/webhook/:slug",
  async (req, res) => {
    const slug = req.params.slug;
    const ch = getLineChannel(slug);
    if (!ch) {
      console.warn("[multi-webhook] unknown slug", slug);
      return res.status(404).json({ error: "channel_not_found" });
    }
    const signature = req.headers["x-line-signature"];
    const rawBody = req.rawBody || (req.body ? JSON.stringify(req.body) : "");
    const expected = crypto.createHmac("sha256", ch.channel_secret).update(rawBody).digest("base64");
    let ok = false;
    if (signature) {
      try {
        const a = Buffer.from(signature, "base64");
        const b = Buffer.from(expected, "base64");
        ok = a.length === b.length && crypto.timingSafeEqual(a, b);
      } catch {}
    }
    if (!ok) return res.status(401).json({ error: "invalid_signature" });
    res.status(200).end();
    let payload;
    try { payload = JSON.parse(rawBody); } catch (e) { return; }
    const events = Array.isArray(payload.events) ? payload.events : [];
    for (const event of events) {
      try {
        event.__channel_slug = ch.slug;
        event.__channel_token = ch.channel_token;
        event.__head_house_id = ch.head_house_id;
        await lineContext.run({ token: ch.channel_token, slug: ch.slug, headHouseId: ch.head_house_id }, () => handleLineEvent(event));
      } catch (e) { console.error("[multi-webhook]", ch.slug, "event error:", e.message); }
    }
  }
);


/* WEBHOOK-DEDUP: กัน LINE replay เดียวกันซ้ำ */
db.exec(`CREATE TABLE IF NOT EXISTS line_webhook_events (
  event_id TEXT PRIMARY KEY,
  processed_at TEXT NOT NULL
)`);
try { db.exec("CREATE INDEX IF NOT EXISTS idx_webhook_processed ON line_webhook_events(processed_at)"); } catch(e){}
const __webhookDedupInsert = db.prepare("INSERT OR IGNORE INTO line_webhook_events (event_id, processed_at) VALUES (?, ?)");
/* cleanup เก่ากว่า 24 ชม. ทุก ๆ ชั่วโมง */
setInterval(() => {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    db.prepare("DELETE FROM line_webhook_events WHERE processed_at < ?").run(cutoff);
  } catch (e) { console.warn("[webhook-dedup-cleanup]", e.message); }
}, 60 * 60 * 1000).unref();

async function handleLineEvent(event) {
  if (!event) return;
  /* O1: correlation id ทุก event — ตามใน log ได้ */
  const reqId = (event.webhookEventId || crypto.randomUUID()).slice(0, 12);
  event.__reqId = reqId;
  console.log(`[evt ${reqId}] type=${event.type} src=${event.source?.type}/${event.source?.userId || event.source?.groupId || "-"}`);
  /* WEBHOOK-DEDUP v2: try/catch กัน DB error → ถ้า fail ให้ proceed (fail-open ดีกว่า drop) */
  if (event.webhookEventId) {
    try {
      const r = __webhookDedupInsert.run(event.webhookEventId, new Date().toISOString());
      if (r.changes === 0) {
        console.log("[webhook-dedup] skip duplicate", event.webhookEventId);
        return;
      }
    } catch (e) {
      console.warn("[webhook-dedup] DB error — proceed anyway", e.message);
    }
  }
  const userId = event.source?.userId;
  const replyToken = event.replyToken;
  /* MULTI-TENANT: bind user → channel ที่ follow */
  if (userId && event.__channel_slug) {
    try { ensureContactChannel(userId, event.__channel_slug); } catch {}
  }

  /* U-A FIX: unfollow handler — ลูกค้า block bot */
  if (event.type === "unfollow") {
    try {
      const uid = event.source?.userId;
      if (uid) {
        /* mark inactive in customers — เก็บ row ไว้ แค่ flag null line_user_id */
        db.prepare("UPDATE customers SET line_user_id = NULL, updated_at = ? WHERE line_user_id = ?").run(nowIso(), uid);
        /* mark inactive ใน line_contacts (ถ้ามี) */
        try { db.prepare("UPDATE line_contacts SET status = 'unfollow', updated_at = ? WHERE line_user_id = ?").run(nowIso(), uid); } catch(e) {}
        logAudit(null, "unfollow", "customer", uid, { ts: nowIso() });
        console.log("[unfollow]", uid);
      }
    } catch (e) { console.warn("[unfollow]", e.message); }
    return;
  }

  /* GROUP-BOT: join — bot ถูก invite เข้ากลุ่ม */
  if (event.type === "join" && event.source?.type === "group") {
    const groupId = event.source.groupId;
    try {
      registerLineGroup(groupId, "");
      await sendGroupWelcome(replyToken, "");
      console.log("[group-join] bot joined", groupId);
    } catch (e) { console.error("[group-join]", e.message); }
    return;
  }

  /* GROUP-BOT: leave — bot ถูก kick หรือออก */
  if (event.type === "leave" && event.source?.type === "group") {
    const groupId = event.source.groupId;
    try {
      markGroupLeft(groupId);
      const boss = getBossLineUserId();
      if (boss) {
        await linePush(boss, `⚠️ Bot ถูกออกจากกลุ่มแล้วค่ะ
Group ID: ${groupId}
เวลา: ${new Date().toLocaleString("th-TH")}`);
      }
      console.log("[group-leave] bot left", groupId);
    } catch (e) { console.error("[group-leave]", e.message); }
    return;
  }

  /* GROUP-BOT: memberJoined — มีคนใหม่เข้ากลุ่ม */
  if (event.type === "memberJoined" && event.source?.type === "group") {
    try {
      await lineReply(replyToken, "ยินดีต้อนรับสมาชิกใหม่ค่ะ 🎉\nพิมพ์ /menu เพื่อดูคำสั่งทั้งหมด หรือสั่งซื้อหวยที่ Rich Menu ได้เลยนะคะ");
    } catch (e) { /* silent */ }
    return;
  }

  /* JOURNEY-A: follow event → ส่ง Flex welcome card + ทักทาย */
  if (event.type === "follow" && replyToken) {
    try {
      const liffUrl = process.env.LIFF_URL || "https://liff.line.me/2010170072-GDDXzvaN";
      const baseUrl = process.env.BASE_URL || "https://lottery.139-59-123-146.nip.io";
      const welcomeFlex = {
        type: "flex",
        altText: "ยินดีต้อนรับสู่บ้านหวยเรือนเลขเศรษฐี",
        contents: {
          type: "bubble",
          size: "giga",
          header: {
            type: "box", layout: "vertical",
            backgroundColor: "#0f5132",
            paddingAll: "20px",
            contents: [
              /* === UX-FIX-V3-WELCOME === */
              { type: "text", text: "สวัสดีค่ะ มาเลือกหวยกันนะคะ 🙏", color: "#ffffff", weight: "bold", size: "xl", align: "center", wrap: true },
              { type: "text", text: "บ้านหวยเรือนเลขเศรษฐี", color: "#d1fae5", size: "md", align: "center", margin: "sm" }
            ]
          },
          body: {
            type: "box", layout: "vertical", spacing: "md", paddingAll: "16px",
            contents: [
              { type: "text", text: "เริ่มต้นง่ายๆ 3 ขั้น", weight: "bold", size: "md", color: "#0f5132" },
              { type: "separator" },
              { type: "box", layout: "horizontal", spacing: "sm", margin: "sm", contents: [
                { type: "text", text: "1️⃣", size: "lg", flex: 0 },
                { type: "box", layout: "vertical", flex: 1, contents: [
                  { type: "text", text: "สั่งซื้อหวย", weight: "bold", size: "sm" },
                  { type: "text", text: "เลือกหวย เลข ยอดที่ต้องการ", size: "xs", color: "#6b7280", wrap: true }
                ]}
              ]},
              { type: "box", layout: "horizontal", spacing: "sm", contents: [
                { type: "text", text: "2️⃣", size: "lg", flex: 0 },
                { type: "box", layout: "vertical", flex: 1, contents: [
                  { type: "text", text: "โอนเงิน + ส่งสลิป", weight: "bold", size: "sm" },
                  { type: "text", text: "โอนตามยอด + ส่งภาพสลิปในแชท", size: "xs", color: "#6b7280", wrap: true }
                ]}
              ]},
              { type: "box", layout: "horizontal", spacing: "sm", contents: [
                { type: "text", text: "3️⃣", size: "lg", flex: 0 },
                { type: "box", layout: "vertical", flex: 1, contents: [
                  { type: "text", text: "รอผลรางวัล", weight: "bold", size: "sm" },
                  { type: "text", text: "ระบบแจ้งทันทีเมื่อถูกรางวัล", size: "xs", color: "#6b7280", wrap: true }
                ]}
              ]},
              { type: "separator", margin: "md" },
              { type: "button", style: "primary", color: "#0f5132", height: "sm", margin: "md",
                action: { type: "uri", label: "✍️  เริ่มสั่งซื้อหวย", uri: liffUrl } }
            ]
          },
          footer: {
            type: "box", layout: "vertical", spacing: "sm", paddingAll: "12px",
            contents: [
              { type: "text", text: "💡 ใช้เมนูด้านล่างเลือกบริการอื่นได้เลย", size: "xs", color: "#6b7280", align: "center", wrap: true },
              /* === UX-FIX-V3-WELCOME === */
              { type: "text", text: "ปลอดภัย · จ่ายจริง", size: "xs", color: "#9ca3af", align: "center", margin: "xs" }
            ]
          }
        }
      };
      const token = _currentLineToken();
      /* === B2: quickReply 3 ปุ่ม — แทงหวย / บิลของฉัน / ผลรางวัล === */
      const __myOrdersUrl = process.env.LIFF_URL_MY_ORDERS || liffUrl;
      const __resultsUrl = baseUrl + "/lotto";
      welcomeFlex.quickReply = {
        items: [
          { type: "action", action: { type: "uri", label: "แทงหวย", uri: liffUrl } },
          { type: "action", action: { type: "uri", label: "บิลของฉัน", uri: __myOrdersUrl } },
          { type: "action", action: { type: "uri", label: "ผลรางวัล", uri: __resultsUrl } },
        ],
      };
      if (token) {
        await fetch("https://api.line.me/v2/bot/message/reply", {
          method: "POST",
          headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
          body: JSON.stringify({ replyToken, messages: [welcomeFlex] })
        });
      }
    } catch (e) { console.error("[follow-welcome]", e.message); }
    return;
  }
  if (event.type !== "message") return;
  const msg = event.message || {};
  if (!userId) return;

  /* FEAT phase2.5: capture every sender → line_contacts */
  try {
    let displayName = null, pictureUrl = null;
    /* fetch LINE profile (best-effort; skip on error) */
    try {
      const tok = process.env.LINE_CHANNEL_TOKEN;
      if (tok) {
        const pr = await fetch("https://api.line.me/v2/bot/profile/" + encodeURIComponent(userId),
          { headers: { Authorization: "Bearer " + tok } });
        if (pr.ok) {
          const pj = await pr.json();
          displayName = pj.displayName || null;
          pictureUrl = pj.pictureUrl || null;
        }
      }
    } catch (e) { /* ignore */ }
    const nowT = nowIso();
    db.prepare(`
      INSERT INTO line_contacts (user_id, display_name, picture_url, first_seen, last_seen, message_count)
      VALUES (?, ?, ?, ?, ?, 1)
      ON CONFLICT(user_id) DO UPDATE SET
        display_name = COALESCE(excluded.display_name, line_contacts.display_name),
        picture_url = COALESCE(excluded.picture_url, line_contacts.picture_url),
        last_seen = excluded.last_seen,
        message_count = line_contacts.message_count + 1
    `).run(userId, displayName, pictureUrl, nowT, nowT);
  } catch (e) { console.warn("[line-contacts] capture failed:", e.message); }

  if (msg.type === "image") {
    /* Find customer by line_user_id */
    const customer = db.prepare("SELECT * FROM customers WHERE line_user_id = ?").get(userId);
    if (!customer) {
      /* FEAT phase1: check ถ้าเป็นหัวบ้านที่ผูก line_user_id ไว้ */
      const headHouse = db.prepare("SELECT * FROM head_houses WHERE line_user_id = ?").get(userId);
      if (headHouse) {
        /* รับสลิปจากหัวบ้าน → เก็บ ledger, แจ้ง admin ตรวจ, ไม่ match บิล */
        try {
          const imageBufferHH = await fetchLineMessageContent(msg.id);
          let slipDataHH = null;
          try {
            const slipRawHH = await verifySlipViaSlip2Go(imageBufferHH);
            slipDataHH = normalizeSlipData(slipRawHH);
          } catch (e) {
            /* R3-FIX: slip2go ล้มเหลว → log + alert admin */
            console.warn("[hh-slip slip2go fail]", e.message);
            try {
              const bossId = getBossLineUserId && getBossLineUserId();
              if (bossId) await linePush(bossId, `⚠️ slip2go อ่านสลิปจากหัวบ้าน${headHouse.name ? " (" + headHouse.name + ")" : ""} ไม่สำเร็จ\nกรุณาเช็คในระบบ admin → หน้าตรวจสลิปหัวบ้าน`);
            } catch (e2) {}
          }
          const amountHH = slipDataHH?.amount || 0;
          const txnId = slipDataHH?.transactionId || null;
          /* R5-E5 FIX: check duplicate ข้าม customer + hh slip */
          if (txnId) {
            const dupCust = db.prepare("SELECT 1 FROM tickets WHERE slip_transaction_id = ?").get(txnId);
            const dupHh = db.prepare("SELECT 1 FROM head_house_slip_ledger WHERE slip_transaction_id = ?").get(txnId);
            if (dupCust || dupHh) {
              await lineReply(replyToken, "⚠️ สลิปนี้ถูกใช้งานไปแล้วค่ะ\nกรุณาส่งสลิปใหม่ของการโอนครั้งล่าสุด");
              logAudit(null, "hh_slip_duplicate", "head_house", headHouse.id, { txnId });
              return;
            }
          }
          db.prepare(`INSERT INTO head_house_slip_ledger
            (id, head_house_id, line_user_id, amount, slip_raw_json, slip_transaction_id, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`)
            .run(crypto.randomUUID(), headHouse.id, userId, amountHH,
                 JSON.stringify(slipDataHH || {}), txnId, nowIso());
          const amtTxt = amountHH ? `฿${amountHH.toLocaleString("th-TH")}` : "(อ่านยอดไม่ได้)";
          await lineReply(replyToken, `✓ รับสลิป${headHouse.name ? " จาก " + headHouse.name : ""} ยอด ${amtTxt} เรียบร้อยแล้วค่ะ\nแอดมินจะตรวจสอบและเคลียร์ยอดให้ค่ะ ขอบคุณนะคะ 🙏`);
        } catch (e) {
          console.error("[hh-slip] failed:", e.message);
          await lineReply(replyToken, "⚠️ ขออภัยค่ะ ระบบรับสลิปไม่สำเร็จ\nกรุณาส่งใหม่อีกครั้งนะคะ");
        }
        return;
      }
      /* ไม่ใช่ลูกค้า + ไม่ใช่หัวบ้าน → ส่งลิงก์ LIFF เปิดคีย์ */
      await lineReply(replyToken, SLIP_REPLY_NO_CUSTOMER);
      return;
    }

    let imageBuffer;
    try { imageBuffer = await fetchLineMessageContent(msg.id); }
    catch (e) { console.error("[line] fetch content failed:", e.message); await lineReply(replyToken, SLIP_REPLY_VERIFY_FAIL); return; }

    /* ALT3: dedup โดย image hash ก่อน burn quota slip2go */
    const __imgHash = computeSlipImageHash(imageBuffer);
    const __hashHit = db.prepare("SELECT ticket_id, result, created_at FROM slip_image_hashes WHERE hash = ?").get(__imgHash);
    if (__hashHit) {
      console.log(`[slip-hash-dup] hash=${__imgHash.slice(0,12)} prev_ticket=${__hashHit.ticket_id} result=${__hashHit.result}`);
      await lineReply(replyToken, SLIP_REPLY_DUPLICATE);
      logAudit(null, "slip_image_dup", "ticket", __hashHit.ticket_id, { lineUserId, hash: __imgHash.slice(0,16), prevResult: __hashHit.result });
      return;
    }
    let slipRaw, slipData;
    try {
      slipRaw = await verifySlipViaSlip2Go(imageBuffer);
      slipData = normalizeSlipData(slipRaw);
      if (!slipData || !slipData.amount) { await lineReply(replyToken, SLIP_REPLY_VERIFY_FAIL); return; }
    } catch (e) {
      console.error("[slip2go] verify failed:", e.message, e.body);
      await lineReply(replyToken, SLIP_REPLY_VERIFY_FAIL);
      return;
    }

    /* ALT3: บันทึก hash หลัง verify success — กันส่งซ้ำในอนาคต */
    try {
      db.prepare("INSERT OR IGNORE INTO slip_image_hashes (hash, customer_id, line_user_id, ticket_id, result, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .run(__imgHash, customer?.id || null, userId, null, "verified", nowIso());
    } catch (e) {}
    await matchAndApproveSlip(customer, slipData, replyToken, userId);
    return;
  }

  if (msg.type === "text") {
    const text = String(msg.text || "").trim();

    /* GROUP-BOT: ถ้าเป็น message ในกลุ่ม → จัด commands แยก */
    if (event.source?.type === "group") {
      const groupId = event.source.groupId;
      /* update last_active */
      try { db.prepare("UPDATE line_groups SET last_active=? WHERE group_id=?").run(nowIso(), groupId); } catch (e) {}
      /* handle commands */
      const handled = await handleGroupCommand(replyToken, text, groupId);
      /* ถ้าไม่ใช่ command → silent (ไม่รบกวนกลุ่ม) */
      return;
    }

    /* FEAT phase1: ถ้าเป็นหัวบ้าน → ไม่ตอบ (admin จะดูใน LINE OA โดยตรง) */
    const headHouseText = db.prepare("SELECT * FROM head_houses WHERE line_user_id = ?").get(userId);
    if (headHouseText) return;

    /* JOURNEY-A: detect บิลที่ลูกค้าส่งจาก LIFF (มี "เลขบิล: P000123") → confirm + บัญชี */
    const billInText = text.match(/เลขบิล[:\s]*P(\d{6})/i);
    if (billInText) {
      const code = "P" + billInText[1];
      let accLine = "";
      try {
        const acc = db.prepare(`SELECT bank_name, account_number, account_holder FROM bank_accounts WHERE status='active' AND total_received_today < daily_limit ORDER BY priority ASC, total_received_today ASC LIMIT 1`).get();
        if (acc) accLine = `\n\n\ud83c\udfe6 ${acc.bank_name}\n${acc.account_number}\n${acc.account_holder}`;
      } catch (e) { /* ignore */ }
      await lineReplyWithMenu(replyToken,
        `\u2713 รับบิล ${code} เรียบร้อยแล้วค่ะ\nกรุณาโอนเงินตามยอดบิล แล้วส่งภาพสลิปกลับมาที่แชทนะคะ${accLine}\n\nขอบคุณที่ใช้บริการค่ะ 🙏`);
      return;
    }
    /* P000123 standalone (พิมพ์เลขบิลเดี่ยว) */
    if (/^P\d{6}$/i.test(text)) {
      await lineReplyWithMenu(replyToken, `บันทึกเลขบิล ${text.toUpperCase()} เรียบร้อยแล้วค่ะ\nกรุณาส่งภาพสลิปการโอนกลับมาที่แชทต่อได้เลยนะคะ`);
      return;
    }

    /* JOURNEY-A: keyword routing — RESULT ก่อน BUY กัน "ผลหวย" ตก KW_BUY */
    const liffUrl = (process.env.LIFF_URL || "https://liff.line.me/2010170072-GDDXzvaN");
    /* QUIET-MODE-V2 handlers (single-line strings only — no embedded newlines) */
    if (KW_MENU.test(text)) { try { await lineReplyFlex(replyToken, buildFlexMenu()); } catch(e){} return; }
    if (KW_GROUP.test(text)) { await lineReplyWithMenu(replyToken, "\uD83D\uDCE3 กลุ่มแนวทาง\nสนใจเข้ากลุ่มแนวทาง ติดต่อแอดมินทาง LINE OA นี้ได้เลยนะคะ"); return; }
    if (KW_REGISTER.test(text)) { await lineReplyWithMenu(replyToken, "\uD83D\uDCDD สมัครสมาชิก\nกรุณาส่ง ชื่อ-นามสกุล และเบอร์โทรศัพท์ ผ่านแอดมินทาง LINE OA นี้ค่ะ"); return; }
    if (KW_RESULT.test(text)) {
      try {
        const latestPerLottery = db.prepare(`
          WITH ranked AS (
            SELECT r.id, r.lottery_id, l.name AS lottery_name, l.category, r.label, r.draw_date, r.draw_time,
              (SELECT number FROM results WHERE round_id = r.id AND bet_type_id = 'three_top' LIMIT 1) AS t3,
              (SELECT number FROM results WHERE round_id = r.id AND bet_type_id = 'two_bottom' LIMIT 1) AS t2,
              ROW_NUMBER() OVER (PARTITION BY r.lottery_id ORDER BY r.draw_date DESC, r.draw_time DESC) AS rn
            FROM rounds r JOIN lotteries l ON l.id = r.lottery_id
            WHERE r.result_status = 'finalized'
          )
          SELECT * FROM ranked WHERE rn = 1 ORDER BY draw_date DESC, draw_time DESC
        `).all();
        if (!latestPerLottery.length) { await lineReplyWithMenu(replyToken, "\ud83d\udcca ยังไม่มีผลรางวัลค่ะ"); return; }
        const gov=[], daily=[], stock=[];
        for (const r of latestPerLottery) {
          if (r.category === "government" || ["thai","omsin","baac"].includes(r.lottery_id)) gov.push(r);
          else if (r.category === "daily") daily.push(r);
          else stock.push(r);
        }
        const fmt = (r) => `• ${r.lottery_name} ${r.label}\n  3บน ${r.t3 || "-"} · 2ล่าง ${r.t2 || "-"}`;
        const sections = [];
        if (gov.length) sections.push("\ud83c\uddf9\ud83c\udded หวยรัฐบาล\n" + gov.map(fmt).join("\n"));
        if (daily.length) sections.push("\ud83d\udcc5 หวยรายวัน\n" + daily.map(fmt).join("\n"));
        if (stock.length) {
          const top5 = stock.slice(0, 5);
          const more = stock.length > 5 ? `\n(+ อีก ${stock.length - 5} ตัว)` : "";
          sections.push("\ud83d\udcc8 หวยหุ้น (5 ตัวล่าสุด)\n" + top5.map(fmt).join("\n") + more);
        }
        await lineReplyWithMenu(replyToken, "\ud83d\udcca ผลรางวัลล่าสุดค่ะ\n\n" + sections.join("\n\n━━━━━━━━━━\n\n"));
      } catch (e) {
        console.error("[result-kw-priority]", e.message);
        await lineReplyWithMenu(replyToken, "\u26a0\ufe0f ดูผลรางวัลไม่สำเร็จค่ะ");
      }
      return;
    }
    if (KW_BUY.test(text)) {
      await lineReplyWithMenu(replyToken, `เปิดหน้าสั่งซื้อ →\n${liffUrl}`);
      return;
    }
    if (KW_BANK.test(text)) {
      try {
        /* U2 FIX: หา pending bill ของลูกค้านี้ → แนบยอด + เลขบิล */
        let billHint = "";
        try {
          const _cust = db.prepare("SELECT id FROM customers WHERE line_user_id = ?").get(userId);
          if (_cust) {
            const _pendingBill = db.prepare(`SELECT t.code, COALESCE((SELECT SUM(amount) FROM entries WHERE ticket_id=t.id),0) AS total FROM tickets t WHERE t.customer_id=? AND t.status='pending_review' ORDER BY t.created_at DESC LIMIT 1`).get(_cust.id);
            if (_pendingBill) {
              billHint = `\n\n💰 ยอดที่ต้องโอน: ${Number(_pendingBill.total).toLocaleString("th-TH")} บาท\n📋 บิล: ${_pendingBill.code}`;
            }
          }
        } catch (e) {}
        const acc = db.prepare(`SELECT bank_name, account_number, account_holder FROM bank_accounts WHERE status='active' AND total_received_today < daily_limit ORDER BY priority ASC, total_received_today ASC LIMIT 1`).get();
        if (acc) {
          await lineReplyWithMenu(replyToken, `\ud83c\udfe6 บัญชีรับโอนปัจจุบัน\n${acc.bank_name}\n${acc.account_number}\n${acc.account_holder}`);
          return;
        }
      } catch (e) {}
      await lineReplyWithMenu(replyToken, "⚠️ ไม่พบบัญชีพร้อมรับโอน — โปรดติดต่อแอดมิน");
      return;
    }
        if (KW_HELP.test(text)) {
      await lineReplyFlex(replyToken, buildFlexMenu());
      return;
    }
    /* JOURNEY-B: my bills */
    if (KW_MY_BILL.test(text)) {
      try {
        const cust = db.prepare("SELECT id FROM customers WHERE line_user_id = ?").get(userId);
        if (!cust) { await lineReplyWithMenu(replyToken, "ยังไม่พบข้อมูลลูกค้า — กรุณาสั่งบิลแรกก่อน"); return; }
        const tickets = db.prepare(`SELECT code, status, total_amount, created_at FROM tickets WHERE customer_id = ? ORDER BY created_at DESC LIMIT 5`).all(cust.id);
        if (!tickets.length) { await lineReplyWithMenu(replyToken, "ยังไม่มีบิลในระบบ"); return; }
        const statusMap = { pending_review: "รอตรวจสลิป ⏳", approved: "อนุมัติ ✓", rejected: "ปฏิเสธ ✗", cancelled: "ยกเลิก", auto_cancelled: "ถูกยกเลิก (ลืมส่งสลิป)" };
        const lines = tickets.map(t => `${t.code} · ${statusMap[t.status] || t.status} · ${Number(t.total_amount).toLocaleString("th-TH")}`);
        await lineReplyWithMenu(replyToken, "📋 บิลล่าสุด 5 ใบของคุณ\n" + lines.join("\n"));
      } catch (e) { console.error("[my-bill]", e.message); await lineReplyWithMenu(replyToken, "⚠️ ดูบิลไม่สำเร็จ"); }
      return;
    }
    /* JOURNEY-B: cancel latest pending bill */
    if (KW_CANCEL.test(text)) {
      try {
        const cust = db.prepare("SELECT id, name FROM customers WHERE line_user_id = ?").get(userId);
        if (!cust) { await lineReplyWithMenu(replyToken, "ยังไม่พบข้อมูลลูกค้านะคะ"); return; }
        /* CANCEL-V2: เช็คบิลล่าสุดทุก status */
        const t = db.prepare(`SELECT id, code, status, total_amount FROM tickets WHERE customer_id = ? ORDER BY created_at DESC LIMIT 1`).get(cust.id);
        if (!t) { await lineReplyWithMenu(replyToken, "ยังไม่มีบิลในระบบค่ะ"); return; }
        if (t.status === "pending_review") {
          /* U10 FIX: confirm step — กดยกเลิก 2 ครั้งภายใน 60s ถึงจะยกเลิกจริง */
          const confirmKey = "cancel_confirm:" + cust.id;
          const pending = getCronState(confirmKey, null);
          const isConfirmText = /^(ยืนยัน|confirm|ใช่)$/i.test(text.trim());
          if (pending && pending.ticket_id === t.id && (Date.now() - pending.ts < 60000)) {
            /* second tap = confirm */
            db.prepare("UPDATE tickets SET status='cancelled', updated_at=? WHERE id=? AND status='pending_review'").run(nowIso(), t.id);
            setCronState(confirmKey, null);
            await lineReplyWithMenu(replyToken, `✓ ยกเลิกบิล ${t.code} เรียบร้อยค่ะ`);
          } else {
            /* first tap = ask confirm */
            setCronState(confirmKey, { ticket_id: t.id, ts: Date.now() });
            await lineReplyWithMenu(replyToken, `⚠️ ยืนยันยกเลิกบิล ${t.code} (${Number(t.total_amount).toLocaleString("th-TH")} บาท)?\nพิมพ์ "ยืนยัน" ภายใน 60 วินาที`);
          }
        } else if (t.status === "approved") {
          /* บิลถูกอนุมัติแล้ว → reply + แจ้งบอสให้รู้ (ไม่มีปุ่มคืนเงิน — บอสจัดการเอง) */
          await lineReplyWithMenu(replyToken, `บิล ${t.code} ถูกอนุมัติเรียบร้อยแล้วค่ะ\nบิลที่ยืนยันแล้วยกเลิกในระบบไม่ได้\nหากต้องการความช่วยเหลือ ติดต่อแอดมินทางแชทนี้ได้เลยนะคะ 🙏`);
          try {
            const bossId = getBossLineUserId && getBossLineUserId();
            if (bossId) {
              await linePush(bossId, `🔔 ลูกค้าพิมพ์ "ยกเลิก" บิล approved\nลูกค้า: ${cust.name}\nบิล: ${t.code}\nยอด: ${Number(t.total_amount).toLocaleString("th-TH")} บาท`);
            }
          } catch (e) { console.warn("[cancel-bill admin notify]", e.message); }
        } else {
          /* cancelled / refunded / auto_cancelled / rejected */
          const txt = {
            cancelled: "ถูกยกเลิกไปแล้ว",
            auto_cancelled: "ถูกยกเลิกอัตโนมัติ (ไม่ส่งสลิปทันเวลา)",
            refunded: "ยกเลิก+คืนเงินไปแล้ว",
            rejected: "ถูกปฏิเสธ"
          }[t.status] || t.status;
          await lineReplyWithMenu(replyToken, `บิลล่าสุด ${t.code} ${txt}อยู่แล้วค่ะ`);
        }
      } catch (e) { console.error("[cancel-bill]", e.message); await lineReplyWithMenu(replyToken, "⚠️ ยกเลิกไม่สำเร็จ"); }
      return;
    }    /* V2 SMART-REPLY: ตอบเฉพาะ greeting + quick reply (FREE) */
    const lowerText = (msg.text || "").toLowerCase().trim();
    const greetingKW = ["สวัสดี", "หวัดดี", "hello", "hi", "ดีค่ะ", "ดีครับ"];
    if (greetingKW.some(k => lowerText.includes(k)) && replyToken) {
      try {
        const baseUrl_ = process.env.BASE_URL || "https://lottery.139-59-123-146.nip.io";
        const liffUrl_ = process.env.LIFF_URL || "https://liff.line.me/2010170072-GDDXzvaN";
        const tk_ = _currentLineToken();
        if (tk_) {
          await fetch("https://api.line.me/v2/bot/message/reply", {
            method: "POST",
            headers: { Authorization: "Bearer " + tk_, "Content-Type": "application/json" },
            body: JSON.stringify({
              replyToken,
              messages: [{
                type: "text",
                text: "สวัสดีค่ะ 🙏 ยินดีต้อนรับสู่บ้านหวยเรือนเลขเศรษฐี\nเลือกบริการได้จากปุ่มด้านล่างนะคะ 👇",
                /* === UX-FIX-V1-NO-DUPLICATE-NOTIF === ลด 6 → 3 ปุ่ม */
                quickReply: {
                  items: [
                    { type: "action", action: { type: "uri", label: "✍️ แทงหวย", uri: liffUrl_ } },
                    { type: "action", action: { type: "uri", label: "📋 บิลของฉัน", uri: baseUrl_ + "/my-orders" } },
                    { type: "action", action: { type: "uri", label: "📊 ผลรางวัล", uri: baseUrl_ + "/lotto" } }
                  ]
                }
              }]
            })
          });
        }
      } catch (e) { console.warn("[smart-reply]", e.message); }
      return;
    }
    /* === UX-FIX-V3-FALLBACK === flex menu สั้นๆ ถ้าข้อความสั้น + ไม่ match keyword + dedup 24h */
    try {
      if (replyToken && typeof text === "string" && text.length > 0 && text.length < 20 && shouldSendFallback(userId)) {
        const baseUrlFB = process.env.BASE_URL || "https://lottery.139-59-123-146.nip.io";
        const liffUrlFB = process.env.LIFF_URL || "https://liff.line.me/2010170072-GDDXzvaN";
        const tkFB = _currentLineToken();
        if (tkFB) {
          await fetch("https://api.line.me/v2/bot/message/reply", {
            method: "POST",
            headers: { Authorization: "Bearer " + tkFB, "Content-Type": "application/json" },
            body: JSON.stringify({
              replyToken,
              messages: [{
                type: "flex",
                altText: "เลือกบริการได้จากปุ่มด้านล่างนะคะ",
                contents: {
                  type: "bubble", size: "kilo",
                  body: {
                    type: "box", layout: "vertical", spacing: "sm", paddingAll: "16px",
                    contents: [
                      { type: "text", text: "สวัสดีค่ะ 🙏", weight: "bold", size: "lg", color: "#0f5132" },
                      { type: "text", text: "แตะปุ่มด้านล่างเพื่อใช้บริการนะคะ", size: "sm", color: "#374151", wrap: true, margin: "sm" },
                      { type: "separator", margin: "md" },
                      { type: "button", style: "primary", color: "#0f5132", height: "sm", margin: "md",
                        action: { type: "uri", label: "✍️ แทงหวย", uri: liffUrlFB } },
                      { type: "button", style: "secondary", height: "sm",
                        action: { type: "uri", label: "📋 บิลของฉัน", uri: baseUrlFB + "/my-orders" } },
                      { type: "button", style: "secondary", height: "sm",
                        action: { type: "uri", label: "📊 ผลรางวัล", uri: baseUrlFB + "/lotto" } }
                    ]
                  }
                }
              }]
            })
          });
        }
      }
    } catch (e) { console.warn("[fallback-flex]", e.message); }
    /* non-keyword silent */
    return;
  }
}

// --- Cron: auto-cancel pending tickets > 10 min ---

/* JOURNEY-B: push reminder cron — ลูกค้ามีบิล pending 5-9 นาที + ยังไม่ส่งสลิป */
/* REMINDER-DB-FIX: dedup ใช้ DB column reminder_sent_at แทน Set in-memory */
ensureColumn("tickets", "reminder_sent_at", "TEXT");
ensureColumn("tickets", "created_by", "TEXT");
ensureColumn("tickets", "checked_by", "TEXT");
ensureColumn("tickets", "checked_at", "TEXT");
async function pushBillReminders() {
  try {
    const now = Date.now();
    const minAge = 5 * 60 * 1000;  /* 5 นาที */
    const maxAge = 9 * 60 * 1000;  /* ก่อนถูก auto-cancel ที่ 10 นาที */
    const cutLow = new Date(now - maxAge).toISOString();
    const cutHigh = new Date(now - minAge).toISOString();
    const rows = db.prepare(`SELECT t.id, t.code, t.created_at, c.line_user_id,
        COALESCE((SELECT SUM(e.amount) FROM entries e WHERE e.ticket_id = t.id), 0) AS total_amount
      FROM tickets t JOIN customers c ON c.id = t.customer_id
      WHERE t.status = 'pending_review' AND t.source_channel = 'line_self'
        AND c.line_user_id IS NOT NULL
        AND t.reminder_sent_at IS NULL
        AND t.created_at BETWEEN ? AND ?`).all(cutLow, cutHigh);
    const markSent = db.prepare("UPDATE tickets SET reminder_sent_at = ? WHERE id = ? AND reminder_sent_at IS NULL");
    for (const t of rows) {
      /* mark ก่อน push — กัน double ถ้า cron tick ซ้อน */
      const r = markSent.run(nowIso(), t.id);
      if (r.changes === 0) continue;
      const acc = db.prepare(`SELECT bank_name, account_number FROM bank_accounts WHERE status='active' AND COALESCE(total_received_today,0) < COALESCE(daily_limit,999999999) ORDER BY priority ASC LIMIT 1`).get();
      const accLine = acc ? `\n${acc.bank_name} ${acc.account_number}` : "";
      try {
        await linePush(t.line_user_id,
          `⏰ บิล ${t.code} (${Number(t.total_amount).toLocaleString("th-TH")} บาท) กำลังรอสลิปอยู่ค่ะ\n` +
          `กรุณาโอนเงินและส่งภาพสลิปกลับมาที่แชทภายในไม่กี่นาทีนะคะ${accLine}\n` +
          `(บิลจะถูกยกเลิกอัตโนมัติเมื่อครบ 10 นาที)`);
      } catch (e) { console.warn("[push-reminder]", e.message); }
    }
  } catch (e) { console.error("[push-reminder cron]", e.message); }
}


/* ADMIN-NOTIFY: cron แจ้งบอสเมื่อบิลรอนาน */
let __adminNotifyLastPushMs = 0;
async function notifyAdminOnPendingTickets() {
  /* FEATURE FLAG: FEATURES_ADMIN_NOTIFY */
  if (process.env.FEATURES_ADMIN_NOTIFY !== "true") return;
  try {
    const bossId = getBossLineUserId();
    if (!bossId) return;
    const now = Date.now();
    /* throttle: 1 push / 5 นาที max */
    /* persist throttle 5 นาที — กัน restart spam */
    const _anLast = getCronState("admin_notify_last_push_ms", 0);
    if (now - _anLast < 5 * 60 * 1000) return;
    /* บิลที่ pending > 3 นาที (admin ยังไม่ดู) */
    const cutoff = new Date(now - 3 * 60 * 1000).toISOString();
    const rows = db.prepare(`SELECT t.code, t.created_at, t.total_amount, c.name AS customer_name
      FROM tickets t
      JOIN customers c ON c.id = t.customer_id
      WHERE t.status = 'pending_review' AND t.created_at <= ?
      ORDER BY t.created_at ASC`).all(cutoff);
    if (!rows.length) return;
    /* push summary */
    const oldest = rows[0];
    const ageMin = Math.floor((now - new Date(oldest.created_at).getTime()) / 60000);
    const sampleLines = rows.slice(0, 5).map(r =>
      `• ${r.code} · คุณ${r.customer_name} · ${Number(r.total_amount).toLocaleString("th-TH")} บ.`
    ).join("\n");
    const more = rows.length > 5 ? `\n+${rows.length - 5} บิลเพิ่ม` : "";
    const text = `🔔 มีบิลรอตรวจ ${rows.length} บิล (เก่าสุด ${ageMin} นาที)\n\n${sampleLines}${more}\n\nเข้าหน้าตรวจบิลที่:\nhttps://lottery.139-59-123-146.nip.io`;
    /* set timestamp ก่อน push — fail หรือ success ก็ไม่ spam */
    setCronState('admin_notify_last_push_ms', now);
    try {
      await linePush(bossId, text);
    } catch (e) { console.warn("[admin-notify push]", e.message); }
  } catch (e) { console.error("[admin-notify cron]", e.message); }
}
registerCron("admin-notify-pending", notifyAdminOnPendingTickets, 2 * 60 * 1000);


/* F2-V2: overdue alert — ข้ามหวยที่เก่ากว่า 24 ชม. + persist throttle ใน DB */
db.exec(`CREATE TABLE IF NOT EXISTS cron_state (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`);
function getCronState(key, defaultVal) {
  try {
    const row = db.prepare("SELECT value_json FROM cron_state WHERE key = ?").get(key);
    return row ? JSON.parse(row.value_json) : defaultVal;
  } catch (e) { return defaultVal; }
}
function setCronState(key, value) {
  try {
    db.prepare("INSERT OR REPLACE INTO cron_state (key, value_json, updated_at) VALUES (?, ?, ?)")
      .run(key, JSON.stringify(value), new Date().toISOString());
  } catch (e) { console.warn("[setCronState]", e.message); }
}

/* OVERDUE-V3: per-round dedup — alert 1 round 1 ครั้งเท่านั้น */
db.exec(`CREATE TABLE IF NOT EXISTS overdue_alerts (
  round_id TEXT PRIMARY KEY,
  alerted_at TEXT NOT NULL
)`);
async function checkOverdueRounds() {
  try {
    const bossId = getBossLineUserId && getBossLineUserId();
    if (!bossId) return;
    const today = bangkokTodayIso();
    const limitTime = bangkokHHMM(new Date(Date.now() - 10 * 60000));
    /* หา round ที่: เลย 10 นาที + draft + apilotto active + ยังไม่ alert + วันนี้ */
    const rows = db.prepare(`
      SELECT DISTINCT r.id, r.draw_date, r.draw_time, l.name AS lottery_name
      FROM rounds r
      JOIN lotteries l ON l.id = r.lottery_id
      JOIN result_sources rs ON rs.lottery_id = r.lottery_id
      WHERE rs.provider = 'API Lotto' AND rs.active = 1
        AND r.result_status = 'draft'
        AND r.draw_date = ?
        AND r.draw_time <= ?
        AND NOT EXISTS (SELECT 1 FROM overdue_alerts oa WHERE oa.round_id = r.id)
      ORDER BY r.draw_time DESC
      LIMIT 10
    `).all(today, limitTime);
    if (!rows.length) return;
    const lines = rows.map(r => `• ${r.lottery_name} ${r.draw_time}`).join("\n");
    const text = `🚨 ผลหวยค้าง — ${rows.length} งวด เลยเวลาออกวันนี้\n\n${lines}\n\n(admin คีย์ผลเองได้ที่หน้าผลรางวัล)`;
    /* mark alerted ก่อน push — ถ้า push fail ยังถือว่าเตือนแล้ว (กัน spam) */
    const insertAlert = db.prepare("INSERT OR IGNORE INTO overdue_alerts (round_id, alerted_at) VALUES (?, ?)");
    for (const r of rows) insertAlert.run(r.id, new Date().toISOString());
    try { await linePush(bossId, text); } catch (e) { console.warn("[overdue-alert push]", e.message); }
  } catch (e) { console.error("[overdue-alert]", e.message); }
}

/* cleanup overdue_alerts ทุกชั่วโมง — ลบของเก่า > 48 ชม. (สมมติ admin จัดการ ของวันก่อนหน้าไปแล้ว) */
setInterval(() => {
  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    db.prepare("DELETE FROM overdue_alerts WHERE alerted_at < ?").run(cutoff);
  } catch (e) {}
}, 60 * 60 * 1000).unref();
registerCron("check-overdue", checkOverdueRounds, 5 * 60 * 1000);

/* F3-STABILITY: cron watchdog — log apilotto health + alert ถ้า cron ไม่ run > 5 นาที */
let __apilottoLastRunMs = Date.now(); /* O1-FIX: init = now กัน watchdog blind spot */
/* hook into apilottoAutoImportCron — patch __apilottoLastRunMs ใน function (manual) */
let __cronWatchdogLastAlertMs = 0;
async function cronWatchdog() {
  try {
    const bossId = getBossLineUserId && getBossLineUserId();
    if (!bossId) return;
    const now = Date.now();
    /* persist throttle 30 นาที */
    const lastAlertMs = getCronState("cron_watchdog_last_alert_ms", 0);
    if (now - lastAlertMs < 30 * 60 * 1000) return;
    /* WATCHDOG-V2: loop ทุก cron ใน registry — ถ้า lastRun เก่ากว่า interval × 3 = stuck */
    const stuck = [];
    for (const [name, entry] of __cronRegistry) {
      if (!entry.lastRun) continue; /* ยังไม่เคย run — skip */
      const lastRunMs = new Date(entry.lastRun).getTime();
      const ageMs = now - lastRunMs;
      if (ageMs > entry.intervalMs * 3) {
        stuck.push({ name, ageMins: Math.floor(ageMs / 60000), intervalMins: Math.floor(entry.intervalMs / 60000) });
      }
    }
    if (!stuck.length) return;
    const lines = stuck.map(s => `• ${s.name} (รัน ${s.intervalMins} นาที/ครั้ง · ค้าง ${s.ageMins} นาที)`).join("\n");
    setCronState("cron_watchdog_last_alert_ms", now);
    try {
      await linePush(bossId, `⚠️ Cron ค้าง ${stuck.length} ตัว — ระบบอาจ delay\n\n${lines}\n\nลอง: systemctl restart lottery-manager`);
    } catch (e) {}
  } catch (e) { console.error("[cron-watchdog]", e.message); }
}
registerCron("cron-watchdog", cronWatchdog, 2 * 60 * 1000);

function autoCancelStalePendingTickets() {
  try {
    const cutoff = new Date(Date.now() - AUTO_CANCEL_MIN * 60 * 1000).toISOString();
    const stale = db.prepare(`
      SELECT id, code, customer_id FROM tickets
      WHERE status = 'pending_review' AND source_channel = 'line_self' AND created_at < ?
    `).all(cutoff);
    if (!stale.length) return;
    for (const t of stale) {
      db.prepare("UPDATE tickets SET status='auto_cancelled', updated_at=? WHERE id=?").run(nowIso(), t.id);
      logAudit(null, "auto_cancel_timeout", "ticket", t.id, { reason: "no_slip_within_" + AUTO_CANCEL_MIN + "_min" });
      /* Notify customer */
      const cust = db.prepare("SELECT line_user_id FROM customers WHERE id = ?").get(t.customer_id);
      if (cust && cust.line_user_id) {
        linePush(cust.line_user_id, `⏰ ขออภัยค่ะ บิล ${t.code} ถูกยกเลิกอัตโนมัติเนื่องจากไม่ได้รับสลิปภายใน ${AUTO_CANCEL_MIN} นาที\n\nหากยังต้องการสั่งซื้อ กรุณาเปิดเมนู "✍️ แทงหวย" เพื่อสั่งซื้อใหม่ได้เลยนะคะ`).catch(()=>{});
      }
    }
    console.log(`[slip-cron] auto-cancelled ${stale.length} stale pending tickets`);
  } catch (e) {
    console.error("[slip-cron] error:", e.message);
  }
}

/* STOCK-SCRAPER: ดึงผลหุ้นรัสเซีย/อังกฤษ/เยอรมัน/ดาวโจนส์ จาก raakaadee + showlek */
const STOCK_SCRAPER_MAP = {
  "lott_010": { name: "รัสเซีย",  raakUrl: "https://www.raakaadee.com/ตรวจหวย-หุ้น/หุ้นรัสเซีย/", showlekUrl: "https://showlek.com/live/stock-russia-lotto/" },
  "lott_011": { name: "อังกฤษ",   raakUrl: "https://www.raakaadee.com/ตรวจหวย-หุ้น/หุ้นอังกฤษ/",  showlekUrl: "https://showlek.com/live/stock-uk-lotto/" },
  "lott_012": { name: "เยอรมัน",  raakUrl: "https://www.raakaadee.com/ตรวจหวย-หุ้น/หุ้นเยอรมัน/", showlekUrl: "https://showlek.com/live/stock-germany-lotto/" },
  "lott_013": { name: "ดาวโจนส์", raakUrl: "https://www.raakaadee.com/ตรวจหวย-หุ้น/หุ้นดาวโจนส์/", showlekUrl: "https://showlek.com/live/stock-dowjones-lotto/" }
};
const STOCK_VIP_PAIRS = {
  "lott_010": "lott_039",
  "lott_011": "lott_037",
  "lott_012": "lott_038",
  "lott_013": "lott_040"
};

function _stripHtml(s) {
  s = String(s);
  s = s.replace(/<script[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<[^>]+>/g, " ");
  return s.replace(/\s+/g, " ");
}

async function _scrapeRaakaadee(url) {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0" },
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) return null;
    const html = await r.text();
    const txt = _stripHtml(html);
    /* pattern: เวลา HH:MM น. 3 ตัวบน NNN 2 ตัวบน NN 2 ตัวล่าง NN */
    const m = txt.match(/เวลา\s+(\d{1,2}:\d{2})\s*น\.\s*3\s*ตัวบน\s+(\d{3})\s+2\s*ตัวบน\s+(\d{2})\s+2\s*ตัวล่าง\s+(\d{2})/);
    if (!m) return null;
    return { time: m[1], three_top: m[2], two_top: m[3], two_bottom: m[4], source: "raakaadee" };
  } catch (e) { console.warn("[scraper] raakaadee fetch failed:", e.message); return null; }
}

async function _scrapeShowlek(url) {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0" },
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) return null;
    const html = await r.text();
    const txt = _stripHtml(html);
    /* showlek pattern: งวดวันที่ DD เดือน 2569 3 ตัวบน NNN 2 ตัวล่าง NN */
    const m = txt.match(/งวดวันที่\s+(\d{1,2})\s+มิถุนายน\s+2569\s+3\s*ตัวบน\s+(\d{3})\s+2\s*ตัวล่าง\s+(\d{2})/);
    if (!m) return null;
    return { day: m[1], three_top: m[2], two_bottom: m[3], source: "showlek" };
  } catch (e) { console.warn("[scraper] showlek fetch failed:", e.message); return null; }
}

/* state: ป้องกัน insert ซ้ำ - เก็บ key=lottery+date ที่ scrape สำเร็จแล้ว */
const __scraperSucceeded = new Map();

async function stockScraperCron() {
  /* ใช้ today (bkk timezone) เป็น key */
  const today = bangkokTodayIso();

  /* หา rounds ที่:
     - lottery_id อยู่ใน 4 ตัวที่ scrape ได้
     - draw_date = today
     - result_status = draft
     - draw_time ผ่านมาแล้ว >= 2 นาที (รอเว็บอัพ) */
  const candidates = db.prepare(`
    SELECT r.id, r.lottery_id, r.draw_date, r.draw_time
    FROM rounds r
    WHERE r.lottery_id IN ('lott_010','lott_011','lott_012','lott_013')
      AND r.result_status = 'draft'
      AND r.draw_date = ?
      AND datetime(r.draw_date || ' ' || r.draw_time) < datetime('now', '+7 hours', '-2 minutes')
    ORDER BY r.draw_time DESC
    LIMIT 10
  `).all(today);

  if (!candidates.length) return;

  for (const round of candidates) {
    const key = round.lottery_id + "|" + round.draw_date;
    if (__scraperSucceeded.has(key)) continue; /* dedup */

    const cfg = STOCK_SCRAPER_MAP[round.lottery_id];
    if (!cfg) continue;

    console.log(`[stock-scraper] try ${round.lottery_id} (${cfg.name}) round=${round.id}`);

    /* ดึง 2 sources ขนาน */
    const [raak, show] = await Promise.all([
      _scrapeRaakaadee(cfg.raakUrl),
      _scrapeShowlek(cfg.showlekUrl)
    ]);

    if (!raak) {
      console.log(`[stock-scraper] ${cfg.name}: raakaadee ยังไม่อัพ — รอ`);
      continue;
    }

    /* cross-check ถ้า showlek อัพรอบเดียวกัน */
    let verified = false;
    if (show) {
      const showDay = parseInt(show.day);
      const roundDay = parseInt(round.draw_date.split("-")[2]);
      if (showDay === roundDay && show.three_top === raak.three_top && show.two_bottom === raak.two_bottom) {
        verified = true;
        console.log(`[stock-scraper] ${cfg.name}: 2 sources ตรงกัน ✓`);
      } else if (showDay !== roundDay) {
        console.log(`[stock-scraper] ${cfg.name}: showlek ของวันอื่น (${showDay} vs ${roundDay}) — ใช้ raakaadee อย่างเดียว`);
      } else {
        console.warn(`[stock-scraper] ${cfg.name}: 2 sources ขัดกัน! raak=${raak.three_top}/${raak.two_bottom} vs show=${show.three_top}/${show.two_bottom} — SKIP + alert บอส`);
        try {
          const bossId = getBossLineUserId && getBossLineUserId();
          if (bossId) await linePush(bossId, `⚠️ Scraper พบเลขขัดกัน 2 แหล่ง\n${cfg.name} ${round.draw_date}:\n• raakaadee: 3บน ${raak.three_top} / 2ล่าง ${raak.two_bottom}\n• showlek: 3บน ${show.three_top} / 2ล่าง ${show.two_bottom}\n\nกรุณาคีย์ผลมือใน admin`);
        } catch {}
        __scraperSucceeded.set(key, "conflict");
        continue;
      }
    }

    /* insert results */
    try {
      const now = nowIso();
      const t3 = raak.three_top, t2 = raak.two_top, b2 = raak.two_bottom;
      const ins = db.prepare("INSERT OR IGNORE INTO results (id, round_id, bet_type_id, number, created_at, updated_at) VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?)");
      ins.run(round.id, "three_top", t3, now, now);
      ins.run(round.id, "two_top", t2, now, now);
      ins.run(round.id, "two_bottom", b2, now, now);
      /* run_top: 3 ตัวจาก three_top */
      for (const d of new Set(t3.split(""))) ins.run(round.id, "run_top", d, now, now);
      /* run_bottom: 2 ตัวจาก two_bottom */
      for (const d of new Set(b2.split(""))) ins.run(round.id, "run_bottom", d, now, now);
      /* three_bottom + three_tod = 3 บน */
      ins.run(round.id, "three_bottom", t3, now, now);
      ins.run(round.id, "three_tod", t3, now, now);

      /* finalize */
      const sysUserId = "system-scraper";
      db.prepare("UPDATE rounds SET result_status='finalized', result_finalized_by=?, result_finalized_at=?, updated_at=? WHERE id=?")
        .run(sysUserId, now, now, round.id);

      console.log(`[stock-scraper] ✓ FINALIZED ${cfg.name} ${round.draw_date}: 3บน=${t3} 2บน=${t2} 2ล่าง=${b2} (verified=${verified})`);
      __scraperSucceeded.set(key, "ok");

      /* trigger push winner */
      try { pushWinnersToCustomers(round.id); } catch {}
      try { setTimeout(() => pushLosersToCustomers(round.id).catch(()=>{}), 5000); } catch {}
      /* GROUP-BROADCAST-V1: broadcast ผลลงกลุ่ม */
      /* QUOTA-SAVE */

      /* === DISCORD-HOOK-1 SCRAPER === */
      notifyResultFinalized(round.id, "stock-scraper").catch(() => {});

      /* ping บอส ให้คีย์ VIP รอบเดียวกัน */
      const vipId = STOCK_VIP_PAIRS[round.lottery_id];
      if (vipId) {
        const vipRound = db.prepare("SELECT id, draw_time FROM rounds WHERE lottery_id=? AND draw_date=? AND result_status='draft' ORDER BY draw_time DESC LIMIT 1").get(vipId, round.draw_date);
        if (vipRound) {
          try {
            const bossId = getBossLineUserId && getBossLineUserId();
            if (bossId) await linePush(bossId, `🔔 ${cfg.name} ผลออกแล้ว (${t3}/${b2})\nกรุณาคีย์ผล VIP รอบ ${vipRound.draw_time} ในแอดมินด้วยค่ะ`);
          } catch {}
        }
      }
    } catch (e) {
      console.error(`[stock-scraper] insert failed ${cfg.name}:`, e.message);
    }
  }
}

registerCron("push-bill-reminders", pushBillReminders, 90 * 1000); /* JOURNEY-B */
registerCron("apilotto-auto-import", apilottoAutoImportCron, 60 * 1000);
registerCron("auto-cancel-stale", autoCancelStalePendingTickets, 60 * 1000);
registerCron("stock-scraper", stockScraperCron, 90 * 1000); /* every 90s */  /* every 1 minute */
setTimeout(autoCancelStalePendingTickets, 15 * 1000).unref();   /* first run after 15s */

console.log("[slip-auto-approve] Phase 1 ready — webhook + slip2go + 10min cancel");

// ===== END SLIP AUTO-APPROVE =====


// Graceful shutdown — flush DB & close server cleanly so systemd restart never corrupts state.
function gracefulShutdown(signal) {
  console.log(`[shutdown] received ${signal}, closing…`);
  server.close(() => {
    try { db.close(); } catch {}
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));




function seedReferenceData() {
  const now = nowIso();
  const betTypes = [
    ["two_top", "2 ตัวบน", 2],
    ["two_bottom", "2 ตัวล่าง", 2],
    ["three_top", "3 ตัวบน", 3],
    ["three_bottom", "3 ตัวล่าง", 3],
    ["three_tod", "3 ตัวโต๊ด", 3],
    ["run_top", "วิ่งบน", 1],
    ["run_bottom", "วิ่งล่าง", 1],
  ];
  const lotteries = [
    ["lott_010", "รัสเซีย", "stock", 10],
    ["lott_011", "อังกฤษ", "stock", 11],
    ["lott_012", "เยอรมัน", "stock", 12],
    ["lott_013", "ดาวโจนส์", "stock", 13],
    ["lott_014", "อียิปต์", "stock", 14],
    ["lott_015", "นิเคอิ เช้า", "stock", 15],
    ["lott_016", "จีน เช้า", "stock", 16],
    ["lott_017", "ฮั่งเส็ง เช้า", "stock", 17],
    ["lott_018", "ไต้หวัน", "stock", 18],
    ["lott_019", "เกาหลี", "stock", 19],
    ["lott_020", "นิเคอิ บ่าย", "stock", 20],
    ["lott_021", "จีน บ่าย", "stock", 21],
    ["lott_022", "ฮั่งเส็ง บ่าย", "stock", 22],
    ["lott_023", "ไทยเย็น", "stock", 23],
    ["lott_024", "สิงคโปร์", "stock", 24],
    ["lott_025", "อินเดีย", "stock", 25],
    ["lott_026", "หวยเวียดนาม VIP", "daily", 26],
    ["lott_027", "ลาวพัฒนา", "daily", 27],
    ["lott_028", "หวยเวียดนาม พิเศษ", "daily", 28],
    ["lott_029", "ดานัง พิเศษ", "daily", 29],
    ["lott_030", "หวยดานังปกติ", "daily", 30],
    ["lott_031", "ดานัง VIP", "daily", 31],
    ["lott_032", "มาเลเซีย", "daily", 32],
    ["lott_033", "ฮานอยพิเศษ", "daily", 33],
    ["lott_034", "เวียดนาม", "daily", 34],
    ["lott_035", "ฮานอยปกติ", "daily", 35],
    ["lott_036", "ฮานอยVIP", "daily", 36],
    ["lott_037", "อังกฤษ VIP", "stock_vip", 37],
    ["lott_038", "เยอรมัน VIP", "stock_vip", 38],
    ["lott_039", "รัสเซีย VIP", "stock_vip", 39],
    ["lott_040", "ดาวโจนส์ VIP", "stock_vip", 40],
    ["lott_041", "นิเคอิ เช้า VIP", "stock_vip", 41],
    ["lott_042", "จีน เช้า VIP", "stock_vip", 42],
    ["lott_043", "ฮั่งเส็ง เช้า VIP", "stock_vip", 43],
    ["lott_044", "ไต้หวัน VIP", "stock_vip", 44],
    ["lott_045", "เกาหลี VIP", "stock_vip", 45],
    ["lott_046", "นิเคอิ บ่าย VIP", "stock_vip", 46],
    ["lott_047", "จีน บ่าย VIP", "stock_vip", 47],
    ["lott_048", "ฮั่งเส็ง บ่าย VIP", "stock_vip", 48],
    ["lott_049", "สิงคโปร์ VIP", "stock_vip", 49],
    ["lott_050", "ฮานอยพัฒนา", "daily", 50],
    ["lott_051", "ลาวสามัคคี", "daily", 51],
    ["lott_052", "ลาวอาเซียน", "daily", 52],
    ["lott_053", "ลาวVIP", "daily", 53],
    ["lott_054", "ลาวสามัคคี VIP", "daily", 54],
    ["lott_055", "ลาวสตาร์ VIP", "daily", 55],
    ["lott_056", "ฮานอยรอบดึก", "daily", 56],
    ["lott_057", "ฮานอย EXTRA", "daily", 57],
    ["lott_058", "ลาวกาชาด", "daily", 58],
    ["lott_059", "ดาวโจนส์ STAR", "daily", 59],
    ["lott_060", "ลาวเวียงจันทร์", "daily", 60],
    ["lott_061", "ลาวดาว", "daily", 61],
    ["lott_062", "อินโด VIP", "daily", 62],
    ["lott_063", "ลาวพิเศษ", "daily", 63],
    ["lott_064", "ลาวพาณิชย์", "daily", 64],
    ["lott_065", "ลาว Extra", "daily", 65],
    ["lott_066", "ฮานอยอาเซียน", "daily", 66],
    ["lott_067", "ลาว TV", "daily", 67],
    ["lott_068", "ฮานอย HD", "online", 68],
    ["lott_069", "ฮานอยสตาร์", "online", 69],
    ["lott_070", "ลาว HD", "online", 70],
    ["lott_071", "ฮานอย TV", "online", 71],
    ["lott_072", "ลาวสตาร์", "online", 72],
    ["lott_073", "ฮานอยกาชาด", "online", 73],
    ["lott_074", "ฮานอยสามัคคี", "online", 74],
    ["lott_075", "นอย DC", "online", 75],
    ["lott_076", "ลาว DC", "online", 76],
    ["lott_077", "ลาวพัฒนา VIP", "foreign", 77],
    ["lott_078", "มาเลเซีย บ่าย", "foreign", 78],
    ["lott_079", "ฮานอยกาชาดทดแทน", "foreign", 79],
    ["lott_080", "ลาวเชียงขวาง", "foreign", 80],
    ["lott_081", "ลาวพัฒนาพิเศษ", "foreign", 81],
    ["lott_082", "ลาวล้านช้าง", "foreign", 82],
    ["lott_083", "ลาวจำปาสัก VIP", "foreign", 83],
    ["lott_084", "ลาวอินเตอร์", "foreign", 84],
    ["lott_085", "ฮานอยซุปเปอร์ VIP", "foreign", 85],
    ["lott_086", "ลาวอินเตอร์เที่ยง", "foreign", 86],
  ];

  const insertBetType = db.prepare(`
    INSERT OR IGNORE INTO bet_types (id, name, digits, created_at)
    VALUES (?, ?, ?, ?)
  `);
  betTypes.forEach(([id, name, digits]) => insertBetType.run(id, name, digits, now));

  const insertLottery = db.prepare(`
    INSERT OR IGNORE INTO lotteries (id, name, category, display_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  /* AUDIT FIX BUG-A: filter blacklist ก่อน insert (ป้องกัน re-seed หวยที่บอสลบทิ้ง) */
  lotteries.forEach(([id, name, category, displayOrder]) => {
    if (__LOTTERY_BLACKLIST.has(id)) return; /* skip blacklisted */
    insertLottery.run(id, name, category, displayOrder, now, now);
  });

  const updateLotteryMeta = db.prepare(`
    UPDATE lotteries
    SET category = ?, display_order = ?, updated_at = ?
    WHERE id = ?
  `);
  lotteries.forEach(([id, _name, category, displayOrder]) => updateLotteryMeta.run(category, displayOrder, now, id));

  db.prepare(`
    INSERT OR IGNORE INTO head_houses (id, code, name, note, commission_percent, created_at, updated_at)
    VALUES ('direct', 'DIRECT', 'ไม่ผ่านหัวบ้าน', '', 0, ?, ?)
  `).run(now, now);

  db.prepare(`
    INSERT OR IGNORE INTO customers (id, code, name, head_house_id, created_at, updated_at)
    VALUES ('walkin', 'WALKIN', 'ไม่ระบุชื่อ', 'direct', ?, ?)
  `).run(now, now);

  lotteries.forEach(([id]) => seedPayoutRatesForLottery(id));
  seedScheduleTemplates();
  seedResultSources();
}

function seedResultSources() { try {
  const now = nowIso();
  const sources = [
    {
      id: "glo_latest",
      lotteryId: "thai",
      name: "สำนักงานสลากกินแบ่งรัฐบาล - งวดล่าสุด",
      sourceKind: "official_glo",
      provider: "GLO",
      url: "https://www.glo.or.th/mission/awarding/orderby-time",
      apiEndpoint: "https://www.glo.or.th/api/lottery/getLatestLottery",
      requiresKey: 0,
      keyEnv: "",
      active: 1,
      autoConfirm: 1,
      priority: 1,
      note: "แหล่งฟรีทางการสำหรับหวยรัฐบาลไทย ดึงแล้วใช้ยืนยันอัตโนมัติได้",
    },
    {
      id: "apilotto_reserved",
      lotteryId: null,
      name: "API Lotto - รอ API Key",
      sourceKind: "api_reserved",
      provider: "API Lotto",
      url: "https://apilotto.com/Documents/",
      apiEndpoint: "https://api.apilotto.com/api/v1",
      requiresKey: 1,
      keyEnv: "APILOTTO_API_KEY",
      active: 0,
      autoConfirm: 0,
      priority: 20,
      note: "เตรียมไว้สำหรับหวยลาว ฮานอย มาเลย์ หุ้น เมื่อมี API key แล้วค่อยเปิดใช้",
    },
    ...[
      ["link_lao_tv", "ลิงก์ผลลาว TV", "lao_tv", "https://lao-tv.com", "ตรวจมือ/สำรอง"],
      ["link_lao_hd", "ลิงก์ผลลาว HD", "lao_hd", "https://xosohd.com", "ตรวจมือ/สำรอง"],
      ["link_lao_star", "ลิงก์ผลลาวสตาร์", "lao_star", "https://minhngocstar.com", "ตรวจมือ/สำรอง"],
      ["link_hanoi_tv", "ลิงก์ผลฮานอย TV", "hanoi_tv", "https://minhngoctv.com/", "ตรวจมือ/สำรอง"],
      ["link_lao_union_vip", "ลิงก์ผลลาวสามัคคี VIP", "lao_unity", "https://laounionvip.com", "ตรวจมือ/สำรอง"],
      ["link_hanoi_special", "ลิงก์ผลฮานอยพิเศษ", "hanoi_special", "http://www.xsthm.com/", "ตรวจมือ/สำรอง"],
      ["link_hanoi", "ลิงก์ผลฮานอยปกติ", "hanoi", "https://www.minhngoc.net.vn/xo-so-truc-tiep/mien-bac.html", "ตรวจมือ/สำรอง"],
    ].map(([id, name, lotteryId, url, note], index) => ({
      id,
      lotteryId,
      name,
      sourceKind: "manual_link",
      provider: "Manual",
      url,
      apiEndpoint: "",
      requiresKey: 0,
      keyEnv: "",
      active: 1,
      autoConfirm: 0,
      priority: 100 + index,
      note,
    })),
  ];

  const insert = db.prepare(`
    INSERT OR IGNORE INTO result_sources (
      id, lottery_id, name, source_kind, provider, url, api_endpoint, requires_key,
      key_env, active, auto_confirm, priority, note, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  sources.forEach((source) => {
    insert.run(
      source.id,
      source.lotteryId,
      source.name,
      source.sourceKind,
      source.provider,
      source.url,
      source.apiEndpoint,
      source.requiresKey,
      source.keyEnv,
      source.active,
      source.autoConfirm,
      source.priority,
      source.note,
      now,
      now,
    );
  });
} catch(e) { console.warn("[seed-result-sources] skip", e.message); }
}

function seedScheduleTemplates() {
  const now = nowIso();
  const schedules = [
    ["thai", "monthly", "", "1,16", 0, "00:00", "14:30", 15, 1, "อ้างอิงตารางทางการ"],
    ["omsin", "monthly", "", "16", 0, "00:00", "10:30", 15, 1, "อ้างอิงตารางทางการ"],
    ["lao_extra", "daily", "1,2,3,4,5", "", 0, "00:00", "08:30", 5, 1, "อ้างอิงตารางที่ผู้ดูแลส่งให้"],
    ["nikkei", "daily", "1,2,3,4,5", "", 0, "00:00", "09:05", 5, 1, "อ้างอิงตารางที่ผู้ดูแลส่งให้"],
    ["hanoi_special", "daily", "0,1,2,3,4,5,6", "", 0, "00:00", "17:30", 5, 1, "อ้างอิงตารางที่ผู้ดูแลส่งให้"],
    ["hanoi", "daily", "0,1,2,3,4,5,6", "", 0, "00:00", "18:30", 5, 1, "ค่าเริ่มต้นจากตารางงานที่ผู้ดูแลกำหนด"],
    ["hanoi_vip", "daily", "0,1,2,3,4,5,6", "", 0, "00:00", "19:30", 5, 1, "ค่าเริ่มต้นจากตารางงานที่ผู้ดูแลกำหนด"],
    ["hanoi_star", "daily", "0,1,2,3,4,5,6", "", 0, "00:00", "20:30", 5, 1, "ค่าเริ่มต้นจากตารางงานที่ผู้ดูแลกำหนด"],
    ["hanoi_tv", "daily", "0,1,2,3,4,5,6", "", 0, "00:00", "19:45", 5, 1, "ค่าเริ่มต้นจากตารางงานที่ผู้ดูแลกำหนด"],
    ["lao_tv", "daily", "0,1,2,3,4,5,6", "", 0, "00:00", "10:30", 5, 1, "อ้างอิงตารางที่ผู้ดูแลส่งให้"],
    ["lao_hd", "daily", "0,1,2,3,4,5,6", "", 0, "00:00", "13:45", 5, 1, "อ้างอิงตารางที่ผู้ดูแลส่งให้"],
    ["lao", "daily", "0,1,2,3,4,5,6", "", 0, "00:00", "21:00", 5, 1, "ค่าเริ่มต้นจากตารางงานที่ผู้ดูแลกำหนด"],
    ["lao_development", "daily", "0,1,2,3,4,5,6", "", 0, "00:00", "20:30", 5, 1, "ค่าเริ่มต้นจากตารางงานที่ผู้ดูแลกำหนด"],
    ["lao_unity", "daily", "0,1,2,3,4,5,6", "", 0, "00:00", "20:30", 5, 1, "ค่าเริ่มต้นจากตารางงานที่ผู้ดูแลกำหนด"],
    ["lao_star", "daily", "0,1,2,3,4,5,6", "", 0, "00:00", "15:45", 5, 1, "อ้างอิงตารางที่ผู้ดูแลส่งให้"],
    ["hanoi_hd", "daily", "0,1,2,3,4,5,6", "", 0, "00:00", "11:30", 5, 1, "อ้างอิงตารางที่ผู้ดูแลส่งให้"],
    ["hanoi_extra", "daily", "0,1,2,3,4,5,6", "", 0, "00:00", "22:30", 5, 1, "อ้างอิงตารางที่ผู้ดูแลส่งให้"],
    ["singapore_vip", "daily", "1,2,3,4,5", "", 0, "00:00", "16:23", 5, 1, "อ้างอิงตารางที่ผู้ดูแลส่งให้"],
    ["nikkei_vip", "daily", "1,2,3,4,5", "", 0, "00:00", "09:05", 5, 1, "อ้างอิงตารางที่ผู้ดูแลส่งให้"],
    ["china_vip", "daily", "1,2,3,4,5", "", 0, "00:00", "10:05", 5, 1, "อ้างอิงตารางที่ผู้ดูแลส่งให้"],
    ["hangseng_vip", "daily", "1,2,3,4,5", "", 0, "00:00", "10:35", 5, 1, "อ้างอิงตารางที่ผู้ดูแลส่งให้"],
    ["taiwan_vip", "daily", "1,2,3,4,5", "", 0, "00:00", "11:35", 5, 1, "อ้างอิงตารางที่ผู้ดูแลส่งให้"],
    ["korea_vip", "daily", "1,2,3,4,5", "", 0, "00:00", "12:35", 5, 1, "อ้างอิงตารางที่ผู้ดูแลส่งให้"],
    ["hanoi_vip_morning", "daily", "1,2,3,4,5", "", 0, "00:00", "13:35", 5, 1, "อ้างอิงตารางที่ผู้ดูแลส่งให้"],
    ["china_vip_morning", "daily", "1,2,3,4,5", "", 0, "00:00", "14:25", 5, 1, "อ้างอิงตารางที่ผู้ดูแลส่งให้"],
    ["hangseng_vip_morning", "daily", "1,2,3,4,5", "", 0, "00:00", "15:25", 5, 1, "อ้างอิงตารางที่ผู้ดูแลส่งให้"],
    ["hanoi_vip_evening", "daily", "1,2,3,4,5", "", 0, "00:00", "16:35", 5, 1, "อ้างอิงตารางที่ผู้ดูแลส่งให้"],
    ["india_vip", "daily", "1,2,3,4,5", "", 0, "00:00", "17:05", 5, 1, "อ้างอิงตารางที่ผู้ดูแลส่งให้"],
  ];

  const insert = db.prepare(`
    INSERT OR IGNORE INTO schedule_templates (
      id, lottery_id, frequency, weekdays, month_days, open_days_before, open_time,
      draw_time, result_time, close_before_minutes, active, source_note, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  schedules.forEach(
    ([lotteryId, frequency, weekdays, monthDays, openDaysBefore, openTime, drawTime, closeBeforeMinutes, active, sourceNote]) => {
      try { insert.run(
        crypto.randomUUID(),
        lotteryId,
        frequency,
        weekdays,
        monthDays,
        openDaysBefore,
        openTime,
        drawTime,
        drawTime,
        closeBeforeMinutes,
        active,
        sourceNote,
        now,
        now,
      ); } catch (e) { console.warn("[seed-schedule] skip", lotteryId, e.message); }
    },
  );
}

function seedPayoutRatesForLottery(lotteryId) {
  const now = nowIso();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO payout_rates (id, lottery_id, bet_type_id, rate, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  getBetTypes().forEach((betType) => {
    try {
      insert.run(crypto.randomUUID(), lotteryId, betType.id, defaultPayoutRate(betType.id), now, now);
    } catch (e) {
      console.warn("[seed-payout] skip", lotteryId, betType.id, e.message);
    }
  });
}

function defaultPayoutRate(betTypeId) {
  if (betTypeId === "two_top" || betTypeId === "two_bottom") return 70;
  if (betTypeId === "three_top") return 600;
  if (betTypeId === "three_bottom") return 100;
  if (betTypeId === "three_tod") return 120;
  return 0;
}

/* PAYOUT-OVERRIDES-STATE-V1: helper สร้าง map ของ overrides */
function _payoutOverridesMap(hhFilter) {
  try {
    const rows = hhFilter
      ? db.prepare("SELECT head_house_id, lottery_id, bet_type_id, rate FROM head_house_payout_overrides WHERE head_house_id = ?").all(hhFilter)
      : db.prepare("SELECT head_house_id, lottery_id, bet_type_id, rate FROM head_house_payout_overrides").all();
    const m = {};
    for (const o of rows) {
      if (!m[o.head_house_id]) m[o.head_house_id] = {};
      m[o.head_house_id][o.lottery_id + "|" + o.bet_type_id] = Number(o.rate) || 0;
    }
    return m;
  } catch (e) { return {}; }
}

/* PHASE-C-SOURCE-TRUTH: get categories ที่มีใช้จริงใน DB + label map */
function getLotteryCategories() {
  const LABELS = {
    government: 'รัฐบาล',
    daily: 'หวยรายวัน',
    thai: 'หวยไทย',
    foreign: 'หวยต่างประเทศ',
    stock: 'หวยหุ้น',
    stock_vip: 'หวยหุ้น VIP',
    online: 'หวยออนไลน์',
    other: 'หวยอื่น ๆ',
  };
  try {
    const rows = db.prepare("SELECT DISTINCT category FROM lotteries ORDER BY category").all();
    return rows.filter(r => r.category).map(r => ({
      id: r.category,
      label: LABELS[r.category] || r.category,
    }));
  } catch { return []; }
}

function getFullState(user) {
  if (user?.role === "head_house_viewer") {
    return {
      lotteryCategories: getLotteryCategories(),
      headHouses: user.head_house_id ? [findHeadHouse(user.head_house_id)].filter(Boolean) : [],
      lotteries: [],
      customers: [],
      rounds: [],
      scheduleTemplates: [],
      betTypes: [],
      payoutRates: [],
      limits: [],
      tickets: [],
      entries: [],
      results: [],
      resultSources: [],
      resultImports: [],
      auditLogs: [],
      users: [],
    };
  }
  if (user?.role === "affiliate") {
    const hhId = user.head_house_id;
    return {
      lotteryCategories: getLotteryCategories(),
      headHouses: hhId ? [findHeadHouse(hhId)].filter(Boolean) : [],
      lotteries: db.prepare("SELECT * FROM lotteries ORDER BY category, display_order, name").all(),
      customers: hhId ? db.prepare("SELECT * FROM customers WHERE head_house_id = ? ORDER BY code").all(hhId) : [],
      rounds: db.prepare("SELECT rounds.*, lotteries.name AS lottery_name FROM rounds JOIN lotteries ON lotteries.id = rounds.lottery_id ORDER BY draw_date DESC, draw_time DESC").all().map(presentRound),
      scheduleTemplates: db.prepare("SELECT * FROM schedule_templates").all().map(presentScheduleTemplate),
      betTypes: db.prepare("SELECT * FROM bet_types").all(),
      payoutRates: db.prepare("SELECT * FROM payout_rates").all(),
      payoutOverrides: _payoutOverridesMap(hhId), /* PAYOUT-OVERRIDES-STATE-V1 */
      limits: db.prepare("SELECT * FROM limits").all(),
      tickets: hhId ? db.prepare(`
        SELECT tickets.*, customers.code AS customer_code, customers.name AS customer_name,
               customers.line_display_name AS customer_line_display_name,
               rounds.label AS round_label, rounds.draw_date,
               lotteries.name AS lottery_name,
               (SELECT COUNT(*) FROM entries WHERE entries.ticket_id = tickets.id) AS entry_count,
               (SELECT COALESCE(SUM(amount),0) FROM entries WHERE entries.ticket_id = tickets.id) AS total_amount
        FROM tickets
        LEFT JOIN customers ON customers.id = tickets.customer_id
        LEFT JOIN rounds ON rounds.id = tickets.round_id
        LEFT JOIN lotteries ON lotteries.id = rounds.lottery_id
        WHERE tickets.head_house_id = ? ORDER BY tickets.created_at DESC
      `).all(hhId) : [],
      entries: hhId ? db.prepare(`SELECT entries.* FROM entries JOIN tickets ON tickets.id = entries.ticket_id WHERE tickets.head_house_id = ? ORDER BY entries.created_at DESC`).all(hhId) : [],
      results: db.prepare("SELECT * FROM results").all(),
      resultSources: [],
      resultImports: [],
      auditLogs: [],
      users: [],
    };
  }

  return {
    headHouses: db.prepare("SELECT * FROM head_houses ORDER BY code").all(),
    lotteries: db.prepare("SELECT * FROM lotteries ORDER BY category, display_order, name").all(),
    customers: db
      .prepare(`
        SELECT customers.*, head_houses.code AS head_house_code, head_houses.name AS head_house_name
        FROM customers
        JOIN head_houses ON head_houses.id = customers.head_house_id
        ORDER BY customers.code
      `)
      .all(),
    rounds: db
      .prepare(`
        SELECT rounds.*, lotteries.name AS lottery_name
        FROM rounds
        JOIN lotteries ON lotteries.id = rounds.lottery_id
        ORDER BY draw_date DESC, draw_time DESC, created_at DESC
      `)
      .all()
      .map(presentRound),
    scheduleTemplates: db
      .prepare(`
        SELECT schedule_templates.*, lotteries.name AS lottery_name
        FROM schedule_templates
        JOIN lotteries ON lotteries.id = schedule_templates.lottery_id
        ORDER BY lotteries.category, lotteries.display_order, lotteries.name
      `)
      .all()
      .map(presentScheduleTemplate),
    lotteryCategories: getLotteryCategories(),
    betTypes: getBetTypes(),
    payoutRates: db.prepare("SELECT * FROM payout_rates").all(),
    payoutOverrides: _payoutOverridesMap(null), /* PAYOUT-OVERRIDES-STATE-V1: ทั้งหมด */
    limits: db.prepare("SELECT * FROM limits ORDER BY created_at DESC").all(),
    tickets: db
      .prepare(`
        SELECT tickets.*,
               customers.code AS customer_code,
               customers.name AS customer_name,
               customers.line_user_id AS customer_line_user_id,
               customers.line_display_name AS customer_line_display_name,
               customers.line_picture_url AS customer_line_picture_url,
               COALESCE(ticket_head_houses.code, customer_head_houses.code) AS head_house_code,
               COALESCE(ticket_head_houses.name, customer_head_houses.name) AS head_house_name,
               rounds.label AS round_label,
               rounds.draw_date,
               rounds.draw_time,
               lotteries.name AS lottery_name,
               creator.username AS created_by_username,
               checker.username AS checked_by_username,
               COUNT(entries.id) AS entry_count,
               COALESCE(SUM(entries.amount), 0) AS total_amount
        FROM tickets
        JOIN customers ON customers.id = tickets.customer_id
        LEFT JOIN head_houses AS ticket_head_houses ON ticket_head_houses.id = tickets.head_house_id
        LEFT JOIN head_houses AS customer_head_houses ON customer_head_houses.id = customers.head_house_id
        JOIN rounds ON rounds.id = tickets.round_id
        JOIN lotteries ON lotteries.id = rounds.lottery_id
        LEFT JOIN users AS creator ON creator.id = tickets.created_by
        LEFT JOIN users AS checker ON checker.id = tickets.checked_by
        LEFT JOIN entries ON entries.ticket_id = tickets.id
        GROUP BY tickets.id
        ORDER BY tickets.created_at DESC
      `)
      .all(),
    entries: db.prepare("SELECT * FROM entries ORDER BY created_at DESC").all(),
    results: db.prepare("SELECT * FROM results ORDER BY created_at DESC").all(),
    resultSources: getResultSources(),
    resultImports: db
      .prepare(`
        SELECT result_imports.*, result_sources.name AS source_name, result_sources.provider,
               rounds.label AS round_label, rounds.draw_date, lotteries.name AS lottery_name
        FROM result_imports
        LEFT JOIN result_sources ON result_sources.id = result_imports.source_id
        JOIN rounds ON rounds.id = result_imports.round_id
        JOIN lotteries ON lotteries.id = rounds.lottery_id
        ORDER BY result_imports.created_at DESC
        LIMIT 80
      `)
      .all(),
    auditLogs:
      user?.role === "admin"
        ? db
            .prepare(`
              SELECT audit_logs.*, users.username
              FROM audit_logs
              LEFT JOIN users ON users.id = audit_logs.user_id
              ORDER BY audit_logs.created_at DESC
              LIMIT 80
            `)
            .all()
        : [],
    users:
      user?.role === "admin"
        ? db
            .prepare(`
              SELECT users.id, users.username, users.role, users.head_house_id, users.created_at,
                     head_houses.code AS head_house_code, head_houses.name AS head_house_name
              FROM users
              LEFT JOIN head_houses ON head_houses.id = users.head_house_id
              ORDER BY users.created_at DESC
            `)
            .all()
        : [],
  };
}

function getBetTypes() {
  return db.prepare("SELECT * FROM bet_types ORDER BY digits, name").all();
}

function getResultSources() {
  return db
    .prepare(`
      SELECT result_sources.*, lotteries.name AS lottery_name, lotteries.category AS lottery_category
      FROM result_sources
      LEFT JOIN lotteries ON lotteries.id = result_sources.lottery_id
      ORDER BY result_sources.priority, COALESCE(lotteries.display_order, 999), result_sources.name
    `)
    .all();
}

function findResultSource(id) {
  return db.prepare("SELECT * FROM result_sources WHERE id = ?").get(cleanText(id, 80));
}

function findResultImport(id) {
  return db.prepare("SELECT * FROM result_imports WHERE id = ?").get(cleanText(id, 80));
}

function countRows(table) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
}

function findLottery(id) {
  return db.prepare("SELECT * FROM lotteries WHERE id = ?").get(id);
}

function findScheduleTemplate(id) {
  return db.prepare("SELECT * FROM schedule_templates WHERE id = ?").get(id);
}

function findScheduleTemplateByLottery(lotteryId) {
  return db.prepare("SELECT * FROM schedule_templates WHERE lottery_id = ?").get(lotteryId);
}

function findHeadHouse(id) {
  return db.prepare("SELECT * FROM head_houses WHERE id = ?").get(id);
}

function findUser(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

function countAdmins() {
  return db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'").get().count;
}

function findViewerForHeadHouse(headHouseId) {
  return db
    .prepare("SELECT * FROM users WHERE role = 'head_house_viewer' AND head_house_id = ?")
    .get(headHouseId);
}

function findCustomer(id) {
  return db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
}

function normalizeTicketHeadHouse(rawHeadHouseId, customerId) {
  const requested = cleanText(rawHeadHouseId, 80);
  if (requested) return findHeadHouse(requested)?.id || "";
  return findCustomer(customerId)?.head_house_id || "direct";
}

function findRound(id) {
  return db.prepare("SELECT * FROM rounds WHERE id = ?").get(id);
}

function findBetType(id) {
  return db.prepare("SELECT * FROM bet_types WHERE id = ?").get(id);
}

function findLimit(id) {
  return db.prepare("SELECT * FROM limits WHERE id = ?").get(id);
}

function findEntry(id) {
  return db.prepare("SELECT * FROM entries WHERE id = ?").get(id);
}

function findTicket(id) {
  return db.prepare("SELECT * FROM tickets WHERE id = ?").get(id);
}

function normalizeUserRole(role) {
  const normalized = cleanText(role, 40);
  return ALLOWED_USER_ROLES.has(normalized) ? normalized : "";
}

function normalizeLimitPayload(body) {
  const roundId = cleanText(body.roundId, 80);
  const betTypeId = cleanText(body.betTypeId, 80);
  const number = cleanDigits(body.number, 3);
  const maxAmount = Number(body.maxAmount);
  const betType = findBetType(betTypeId);

  if (!findRound(roundId) || !betType || !isNumberValidForBetType(number, betType) || !Number.isFinite(maxAmount) || maxAmount <= 0) {
    return { ok: false, error: "invalid_limit_payload" };
  }

  return {
    ok: true,
    value: {
      round_id: roundId,
      bet_type_id: betTypeId,
      number,
      max_amount: maxAmount,
    },
  };
}

function normalizeEntryPayload(body) {
  const customerId = cleanText(body.customerId, 80);
  const roundId = cleanText(body.roundId, 80);
  const betTypeId = cleanText(body.betTypeId, 80);
  const number = cleanDigits(body.number, 3);
  const amount = roundMoney(Number(body.amount));
  const note = cleanText(body.note, 240);
  const sourceText = cleanText(body.sourceText, 500);
  const betType = findBetType(betTypeId);
  const round = findRound(roundId);

  if (
    !db.prepare("SELECT 1 FROM customers WHERE id = ?").get(customerId) ||
    !round ||
    !betType ||
    !isNumberValidForBetType(number, betType) ||
    !Number.isFinite(amount) ||
    !Number.isInteger(amount) ||
    amount <= 0
  ) {
    return { ok: false, error: "invalid_entry_payload" };
  }

  if (!roundAcceptsEntries(round)) {
    return { ok: false, error: "round_not_accepting" };
  }

  return {
    ok: true,
    value: {
      customer_id: customerId,
      round_id: roundId,
      bet_type_id: betTypeId,
      number,
      amount,
      note,
      source_text: sourceText,
    },
  };
}

function validateLimitCapacity(entry, excludedEntryId = null) {
  const limit = db.prepare(`
    SELECT * FROM limits
    WHERE round_id = ? AND bet_type_id = ? AND number = ?
  `).get(entry.round_id, entry.bet_type_id, entry.number);

  if (!limit) return null;

  // H1 fix: only count entries whose tickets are still pending or approved
  // (rejected / cancelled tickets release their capacity)
  const current = db.prepare(`
    SELECT COALESCE(SUM(entries.amount), 0) AS amount
    FROM entries
    LEFT JOIN tickets ON tickets.id = entries.ticket_id
    WHERE entries.round_id = ? AND entries.bet_type_id = ? AND entries.number = ?
      AND (? IS NULL OR entries.id <> ?)
      AND (entries.ticket_id IS NULL OR tickets.status IN ('pending_review', 'approved'))
  `).get(entry.round_id, entry.bet_type_id, entry.number, excludedEntryId, excludedEntryId).amount;
  const projected = current + entry.amount;

  if (projected <= limit.max_amount) return null;

  return {
    error: "limit_exceeded",
    limit,
    currentAmount: current,
    projectedAmount: projected,
  };
}

function validateBatchLimitCapacity(entries) {
  const projectedByKey = new Map();
  for (const entry of entries) {
    const key = `${entry.round_id}:${entry.bet_type_id}:${entry.number}`;
    projectedByKey.set(key, (projectedByKey.get(key) || 0) + entry.amount);
  }

  for (const [key, batchAmount] of projectedByKey.entries()) {
    const [roundId, betTypeId, number] = key.split(":");
    const limit = db.prepare(`
      SELECT * FROM limits
      WHERE round_id = ? AND bet_type_id = ? AND number = ?
    `).get(roundId, betTypeId, number);
    if (!limit) continue;

    const current = db.prepare(`
      SELECT COALESCE(SUM(entries.amount), 0) AS amount
      FROM entries
      LEFT JOIN tickets ON tickets.id = entries.ticket_id
      WHERE entries.round_id = ? AND entries.bet_type_id = ? AND entries.number = ?
        AND (entries.ticket_id IS NULL OR tickets.status IN ('pending_review', 'approved'))
    `).get(roundId, betTypeId, number).amount;

    if (current + batchAmount > limit.max_amount) {
      // Auto-cap Level 2: if reduced_rate_pct is set, allow but at reduced payout
      if (limit.reduced_rate_pct != null) {
        // accept — insertEntry will tag with multiplier
        continue;
      }
      return {
        error: "limit_exceeded",
        limit,
        currentAmount: current,
        projectedAmount: current + batchAmount,
      };
    }
  }

  return null;
}

function createTicket(payload, userId) {
  const now = nowIso();
  const ticket = {
    id: crypto.randomUUID(),
    code: nextSequentialCode("tickets", "P", 6),
    customer_id: payload.customer_id,
    head_house_id: payload.head_house_id || findCustomer(payload.customer_id)?.head_house_id || "direct",
    round_id: payload.round_id,
    source_channel: payload.source_channel || "manual",
    source_text: payload.source_text || "",
    note: payload.note || "",
    status: "pending_review",
    checked_by: null,
    checked_at: null,
    created_by: userId,
    created_at: now,
    updated_at: now,
  };
  db.prepare(`
    INSERT INTO tickets (
      id, code, customer_id, head_house_id, round_id, source_channel, source_text, note,
      status, checked_by, checked_at, created_by, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    ticket.id,
    ticket.code,
    ticket.customer_id,
    ticket.head_house_id,
    ticket.round_id,
    ticket.source_channel,
    ticket.source_text,
    ticket.note,
    ticket.status,
    ticket.checked_by,
    ticket.checked_at,
    ticket.created_by,
    ticket.created_at,
    ticket.updated_at,
  );
  /* === DISCORD-HOOK-2 NEW-TICKET v2 === delay 1.5s รอ caller insert entries ก่อน query total */
  if (ticket && ticket.id) {
    const __dTicketId = ticket.id;
    setTimeout(() => {
      try {
        const __dRow = db.prepare("SELECT t.id, t.code, t.customer_id, t.head_house_id, t.round_id, c.name AS cust_name, c.line_display_name AS line_name, hh.name AS hh_name, l.name AS lot_name, r.draw_date, COALESCE(SUM(e.amount), 0) AS total_amount, COUNT(e.id) AS entry_count FROM tickets t LEFT JOIN entries e ON e.ticket_id=t.id LEFT JOIN customers c ON c.id=t.customer_id LEFT JOIN head_houses hh ON hh.id=t.head_house_id LEFT JOIN rounds r ON r.id=t.round_id LEFT JOIN lotteries l ON l.id=r.lottery_id WHERE t.id=? GROUP BY t.id").get(__dTicketId);
        if (!__dRow) return;
        if (Number(__dRow.total_amount || 0) === 0) return;
        notifyDiscord("new_tickets", {
          embeds: [makeEmbed({
            title: "📝 บิลใหม่ " + safeName(__dRow.code || __dRow.id),
            color: 0x06c755,
            fields: [
              { name: "ลูกค้า", value: safeName(__dRow.cust_name || __dRow.line_name || __dRow.customer_id || "-"), inline: true },
              { name: "หัวบ้าน", value: safeName(__dRow.hh_name || "ออนไลน์"), inline: true },
              { name: "ยอด", value: Number(__dRow.total_amount || 0).toLocaleString() + " บาท", inline: true },
              { name: "หวย", value: safeName((__dRow.lot_name || "-") + " · งวด " + (__dRow.draw_date || "-")), inline: false },
            ],
          })],
        }).catch(() => {});
      } catch (e) { console.warn("[discord-hook-2]", e.message); }
    }, 1500);
  }
  return ticket;
}

function ticketIsLocked(ticketId) {
  if (!ticketId) return false;
  const ticket = findTicket(ticketId);
  return Boolean(ticket && ticket.status !== "pending_review");
}


/* TOTAL-AMOUNT-FIX: recompute tickets.total_amount จาก SUM(entries.amount) */
function recomputeTicketTotal(ticketId) {
  if (!ticketId) return;
  try {
    db.prepare(`UPDATE tickets SET total_amount = COALESCE((SELECT SUM(amount) FROM entries WHERE ticket_id = ?), 0), updated_at = ? WHERE id = ?`)
      .run(ticketId, nowIso(), ticketId);
  } catch (e) { console.warn("[recomputeTicketTotal]", e.message); }
}

function insertEntry(payload, userId, ticketId = null) {
  const now = nowIso();
  /* R7-FIX: wrap multiplier calc + INSERT ใน transaction เดียวกัน — กัน race */
  let payoutMultiplier = 1.0;
  try {
    const lim = db.prepare("SELECT max_amount, reduced_rate_pct FROM limits WHERE round_id = ? AND bet_type_id = ? AND number = ?")
      .get(payload.round_id, payload.bet_type_id, payload.number);
    if (lim && lim.reduced_rate_pct != null) {
      const currentSum = db.prepare(`
        SELECT COALESCE(SUM(entries.amount), 0) AS s
        FROM entries
        LEFT JOIN tickets ON tickets.id = entries.ticket_id
        WHERE entries.round_id = ? AND entries.bet_type_id = ? AND entries.number = ?
          AND (entries.ticket_id IS NULL OR tickets.status IN ('pending_review','approved'))
      `).get(payload.round_id, payload.bet_type_id, payload.number).s;
      // Weighted split: amount under cap pays full rate, amount over cap pays reduced rate.
      // E.g. cap=400, currentSum=200, bet=500 → 200 fits (rate 1.0), 300 over (rate 0.5)
      //      weighted = (200*1.0 + 300*0.5)/500 = 0.7
      const cap = Number(lim.max_amount);
      const cur = Number(currentSum);
      const amt = Number(payload.amount);
      const reducedRate = Number(lim.reduced_rate_pct) / 100;
      if (cur + amt > cap) {
        const remainingUnderCap = Math.max(0, cap - cur);
        const overAmount = amt - remainingUnderCap;
        payoutMultiplier = (remainingUnderCap * 1.0 + overAmount * reducedRate) / amt;
      }
    }
  } catch (e) { /* silent — fall back to 1.0 */ }
  const entry = {
    id: crypto.randomUUID(),
    ticket_id: ticketId,
    ...payload,
    payout_multiplier: payoutMultiplier,
    created_by: userId,
    created_at: now,
    updated_at: now,
  };
  db.prepare(`
    INSERT INTO entries (id, ticket_id, customer_id, round_id, bet_type_id, number, amount, payout_multiplier, note, source_text, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    entry.id,
    entry.ticket_id,
    entry.customer_id,
    entry.round_id,
    entry.bet_type_id,
    entry.number,
    entry.amount,
    entry.payout_multiplier,
    entry.note,
    entry.source_text,
    entry.created_by,
    entry.created_at,
    entry.updated_at,
  );
    if (ticketId) recomputeTicketTotal(ticketId);
  return entry;
}

function normalizeResultNumbers(numbers, betTypeId) {
  const betType = findBetType(betTypeId);
  if (!betType) return [];

  // H2 fix: don't silently truncate. Extract only digits, then reject anything that
  // doesn't match expected length exactly so users get clear validation feedback.
  return [...new Set(String(numbers || "")
    .split(/[\s,]+/)
    .map((item) => exactDigits(item, betType.digits))
    .filter((item) => isNumberValidForBetType(item, betType)))];
}

async function importDueOfficialResults() {
  // B3 fix: restrict auto-import to TODAY's draw_date to avoid injecting today's
  // numbers into a stale round that an admin forgot to finalize.
  const today = bangkokTodayIso();
  const dueRounds = db
    .prepare(`
      SELECT rounds.*
      FROM rounds
      JOIN result_sources ON result_sources.lottery_id = rounds.lottery_id
      WHERE rounds.result_status <> 'finalized'
        AND rounds.draw_date = ?
        AND result_sources.active = 1
        AND result_sources.auto_confirm = 1
        AND result_sources.source_kind = 'official_glo'
      LIMIT 4
    `)
    .all(today)
    .filter((round) => getRoundResultAt(round).getTime() <= Date.now());

  for (const round of dueRounds) {
    const source = db
      .prepare("SELECT * FROM result_sources WHERE lottery_id = ? AND active = 1 AND auto_confirm = 1 ORDER BY priority LIMIT 1")
      .get(round.lottery_id);
    if (!source || resultAlreadyImported(round.id, source.id)) continue;
    await fetchAndStoreResultImport(round, source, null, { applyIfTrusted: true });
  }
}

async function fetchAndStoreResultImport(round, source, userId, options = {}) {
  if (source.source_kind === "manual_link") {
    throw Object.assign(new Error("แหล่งนี้เป็นลิงก์สำหรับเปิดตรวจมือ ไม่ใช่ API"), { code: "manual_link_only", status: 409 });
  }
  if (source.requires_key && !process.env[source.key_env]) {
    throw Object.assign(new Error(`ยังไม่ได้ตั้งค่า ${source.key_env}`), { code: "api_key_not_configured", status: 409 });
  }
  if (source.source_kind === "api_reserved") {
    throw Object.assign(new Error("เตรียม provider ไว้แล้ว แต่ยังไม่เปิดใช้เพราะต้องมี API key"), { code: "paid_api_reserved", status: 409 });
  }

  const fetchedAt = nowIso();
  try {
    const raw = await fetchOfficialGloLatest(source.api_endpoint);
    const numbers = extractGloResultNumbers(raw);
    const importRow = storeResultImport({
      roundId: round.id,
      sourceId: source.id,
      status: source.auto_confirm ? "confirmed" : "draft",
      numbers,
      raw,
      error: "",
      fetchedAt,
      userId,
    });

    if (options.applyIfTrusted && source.auto_confirm) {
      applyImportedResult(round, numbers);
      db.prepare(`
        UPDATE result_imports
        SET status = 'applied', confirmed_by = ?, confirmed_at = ?, updated_at = ?
        WHERE id = ?
      `).run(userId, nowIso(), nowIso(), importRow.id);
      const updatedRound = findRound(round.id);
      if (updatedRound?.result_status !== "finalized") finalizeImportedRound(round.id, userId);
      return findResultImport(importRow.id);
    }

    return importRow;
  } catch (error) {
    return storeResultImport({
      roundId: round.id,
      sourceId: source.id,
      status: "failed",
      numbers: {},
      raw: {},
      error: error.message || String(error),
      fetchedAt,
      userId,
    });
  }
}

async function fetchOfficialGloLatest(endpoint) {
  // H4 fix: enforce a 10-second timeout so a hung GLO endpoint can't lock up the import loop.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(endpoint || "https://www.glo.or.th/api/lottery/getLatestLottery", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`GLO API ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

function extractGloResultNumbers(raw) {
  const firstPrize = findDeepValue(raw, ["first", "firstPrize", "first_prize", "รางวัลที่1"]);
  const last2 = findDeepValue(raw, ["last2", "lastTwo", "last_2", "เลขท้าย2ตัว"]);
  const firstNumber = collectDigitsFromValue(firstPrize, 6)[0] || "";
  const bottom2 = collectDigitsFromValue(last2, 2)[0] || "";

  if (firstNumber.length < 3 || bottom2.length !== 2) {
    throw new Error("อ่านผลจาก GLO ไม่ครบ ต้องตรวจมือ");
  }

  const threeTop = firstNumber.slice(-3);
  return {
    three_top: [threeTop],
    three_tod: [threeTop],
    two_top: [firstNumber.slice(-2)],
    two_bottom: [bottom2],
  };
}

function collectDigitsFromValue(value, length) {
  if (value == null) return [];
  if (typeof value === "string" || typeof value === "number") {
    const digits = exactDigits(value, length);
    return digits.length === length ? [digits] : [];
  }
  if (Array.isArray(value)) return value.flatMap((item) => collectDigitsFromValue(item, length));
  if (typeof value === "object") {
    const direct = ["number", "value", "reward", "result", "lotteryNumber", "lottery_number"]
      .flatMap((key) => collectDigitsFromValue(value[key], length));
    if (direct.length) return direct;
    return Object.values(value).flatMap((item) => collectDigitsFromValue(item, length));
  }
  return [];
}

function findDeepValue(value, keys) {
  if (!value || typeof value !== "object") return "";
  const normalizedKeys = new Set(keys.map((key) => normalizeKey(key)));
  // M7 fix: track visited nodes (defense against cycles) and skip prototype keys
  const visited = new WeakSet();
  const stack = [value];
  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== "object" || visited.has(current)) continue;
    visited.add(current);
    for (const [key, item] of Object.entries(current)) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
      if (normalizedKeys.has(normalizeKey(key))) return item;
      if (item && typeof item === "object") stack.push(item);
    }
  }
  return "";
}

function normalizeKey(value) {
  return String(value || "").toLowerCase().replace(/[\s_-]/g, "");
}

function storeResultImport({ roundId, sourceId, status, numbers, raw, error, fetchedAt, userId }) {
  const row = {
    id: crypto.randomUUID(),
    round_id: roundId,
    source_id: sourceId,
    status,
    numbers_json: JSON.stringify(numbers || {}),
    raw_json: JSON.stringify(raw || {}),
    error: cleanText(error || "", 500),
    fetched_at: fetchedAt,
    confirmed_by: status === "confirmed" ? userId : null,
    confirmed_at: status === "confirmed" ? nowIso() : null,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  db.prepare(`
    INSERT INTO result_imports (
      id, round_id, source_id, status, numbers_json, raw_json, error, fetched_at,
      confirmed_by, confirmed_at, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    row.id,
    row.round_id,
    row.source_id,
    row.status,
    row.numbers_json,
    row.raw_json,
    row.error,
    row.fetched_at,
    row.confirmed_by,
    row.confirmed_at,
    row.created_at,
    row.updated_at,
  );
  return row;
}

function applyImportedResult(round, numbers) {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO results (id, round_id, bet_type_id, number, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const now = nowIso();
  withTransaction(() => {
    for (const [betTypeId, rawNumbers] of Object.entries(numbers || {})) {
      const normalized = normalizeResultNumbers((rawNumbers || []).join(" "), betTypeId);
      db.prepare("DELETE FROM results WHERE round_id = ? AND bet_type_id = ?").run(round.id, betTypeId);
      normalized.forEach((number) => insert.run(crypto.randomUUID(), round.id, betTypeId, number, now, now));
    }
  });
}

function finalizeImportedRound(roundId, userId) {
  const round = findRound(roundId);
  if (!round || round.result_status === "finalized") return;
  const soldBetTypes = db
    .prepare(`
      SELECT DISTINCT entries.bet_type_id
      FROM entries
      JOIN tickets ON tickets.id = entries.ticket_id
      WHERE entries.round_id = ?
        AND tickets.status = 'approved'
    `)
    .all(round.id)
    .map((row) => row.bet_type_id);
  const resultBetTypes = new Set(
    db.prepare("SELECT DISTINCT bet_type_id FROM results WHERE round_id = ?").all(round.id).map((row) => row.bet_type_id),
  );
  if (soldBetTypes.some((betTypeId) => !resultBetTypes.has(betTypeId))) return;
  const now = nowIso();
  db.prepare(`
    UPDATE rounds
    SET result_status = 'finalized', result_finalized_by = ?, result_finalized_at = ?, updated_at = ?
    WHERE id = ?
  `).run(userId, now, now, round.id);

  /* WINNER-PUSH + LOSER-PUSH: push หลัง manual finalize */
  try {
    try { announceResultToBuyers(roundId); } catch {}
    pushWinnersToCustomers(roundId).then(() => {
      setTimeout(() => pushLosersToCustomers(roundId).catch(()=>{}), 30000);
    }).catch(()=>{});
  } catch (e) {}

  /* === DISCORD-HOOK-1 IMPORT === */
  notifyResultFinalized(roundId, "import").catch(() => {});
}

function resultAlreadyImported(roundId, sourceId) {
  return Boolean(
    db.prepare("SELECT 1 FROM result_imports WHERE round_id = ? AND source_id = ? AND status IN ('confirmed', 'applied')").get(roundId, sourceId),
  );
}

function safeParseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function buildSettlement(roundId) {
  const round = findRound(roundId);
  const entries = db.prepare(`
    SELECT entries.*, customers.code AS customer_code, customers.name AS customer_name, bet_types.name AS bet_type_name,
           COALESCE(tickets.head_house_id, customers.head_house_id) AS head_house_id
    FROM entries
    JOIN customers ON customers.id = entries.customer_id
    JOIN bet_types ON bet_types.id = entries.bet_type_id
    JOIN tickets ON tickets.id = entries.ticket_id
    WHERE entries.round_id = ?
      AND tickets.status = 'approved'
  `).all(roundId);
  const results = db.prepare("SELECT * FROM results WHERE round_id = ?").all(roundId);
  const payoutRates = db.prepare("SELECT * FROM payout_rates WHERE lottery_id = ?").all(round.lottery_id);
  /* RATE-OVERRIDE-V1: load overrides ของหัวบ้านที่อยู่ใน round นี้ */
  const __hhOverrides = {};
  try {
    const ovs = db.prepare(`
      SELECT DISTINCT o.head_house_id, o.bet_type_id, o.rate
      FROM head_house_payout_overrides o
      WHERE o.lottery_id = ? AND o.head_house_id IN (
        SELECT DISTINCT t.head_house_id FROM tickets t WHERE t.round_id = ?
      )
    `).all(round.lottery_id, roundId);
    for (const o of ovs) {
      if (!__hhOverrides[o.head_house_id]) __hhOverrides[o.head_house_id] = {};
      __hhOverrides[o.head_house_id][o.bet_type_id] = o.rate;
    }
  } catch (e) { console.warn("[settle hh-override]", e.message); }
  function __resolveRate(headHouseId, betTypeId) {
    if (headHouseId && __hhOverrides[headHouseId] && __hhOverrides[headHouseId][betTypeId] != null) {
      return __hhOverrides[headHouseId][betTypeId];
    }
    const pr = payoutRates.find(r => r.bet_type_id === betTypeId);
    return pr ? pr.rate : 0;
  }

  const winners = entries
    .map((entry) => {
      const matched = results.some((result) => isWinningEntry(entry, result));
      if (!matched) return null;
      /* RATE-OVERRIDE-V2: ใช้ resolver ที่ join hh override + default */
      const rate = __resolveRate(entry.head_house_id, entry.bet_type_id);
      return {
        ...entry,
        rate,
        payout: roundMoney(entry.amount * rate * (entry.payout_multiplier == null ? 1 : Number(entry.payout_multiplier))),
      };
    })
    .filter(Boolean);

  const totalStake = sum(entries.map((entry) => entry.amount));
  const totalPayout = sum(winners.map((winner) => winner.payout));

  // Add paid-status summary
  const paidWinners = winners.filter(w => w.paid_at);
  const totalPaid = sum(paidWinners.map(w => w.payout));
  return {
    round,
    totalStake,
    totalPayout,
    profit: totalStake - totalPayout,
    winnerCount: winners.length,
    paidWinnerCount: paidWinners.length,
    pendingWinnerCount: winners.length - paidWinners.length,
    totalPaid,
    totalPending: totalPayout - totalPaid,
    winners,
  };
}

function buildHeadHouseSummary(headHouseId) {
  const headHouse = findHeadHouse(headHouseId);
  const entries = db
    .prepare(`
      SELECT entries.*, customers.code AS customer_code, customers.name AS customer_name,
             rounds.label AS round_label, rounds.draw_date, rounds.draw_time,
             lotteries.id AS lottery_id, lotteries.name AS lottery_name
        FROM entries
        JOIN tickets ON tickets.id = entries.ticket_id
        JOIN customers ON customers.id = entries.customer_id
        JOIN rounds ON rounds.id = entries.round_id
        JOIN lotteries ON lotteries.id = rounds.lottery_id
        WHERE COALESCE(tickets.head_house_id, customers.head_house_id) = ?
          AND tickets.status = 'approved'
        ORDER BY rounds.draw_date DESC, rounds.draw_time DESC, entries.created_at DESC
    `)
    .all(headHouseId);
    const resultRows = db
      .prepare(`
        SELECT results.*
        FROM results
        JOIN rounds ON rounds.id = results.round_id
        WHERE rounds.result_status = 'finalized'
      `)
      .all();
  const payoutRates = db.prepare("SELECT * FROM payout_rates").all();
  /* RATE-OVERRIDE-V2: load override ของ hh นี้ */
  const __hhOvr = new Map();
  try {
    const ovr = db.prepare(`SELECT lottery_id, bet_type_id, rate FROM head_house_payout_overrides WHERE head_house_id = ?`).all(headHouseId);
    for (const o of ovr) __hhOvr.set(`${o.lottery_id}|${o.bet_type_id}`, Number(o.rate) || 0);
  } catch (e) { /* ignore */ }

  const enriched = entries.map((entry) => {
    const matched = resultRows.some((result) => result.round_id === entry.round_id && isWinningEntry(entry, result));
    /* RATE-OVERRIDE-V2: override → default */
    let rate = __hhOvr.get(`${entry.lottery_id}|${entry.bet_type_id}`);
    if (rate == null) {
      rate = payoutRates.find(
        (item) => item.lottery_id === entry.lottery_id && item.bet_type_id === entry.bet_type_id,
      )?.rate || 0;
    }
    return {
      ...entry,
      payout: matched ? entry.amount * rate * (entry.payout_multiplier == null ? 1 : Number(entry.payout_multiplier)) : 0,
    };
  });

  const summaryByRound = new Map();
  enriched.forEach((entry) => {
    const key = entry.round_id;
    const current = summaryByRound.get(key) || {
      roundId: entry.round_id,
      lotteryName: entry.lottery_name,
      roundLabel: entry.round_label,
      drawDate: entry.draw_date,
      drawTime: entry.draw_time,
      totalStake: 0,
      totalPayout: 0,
      commissionAmount: 0,
      netPayable: 0,
    };
    current.totalStake += entry.amount;
    current.totalPayout += entry.payout;
    current.commissionAmount = current.totalStake * (headHouse.commission_percent / 100);
    current.netPayable = current.totalPayout + current.commissionAmount - current.totalStake;
    summaryByRound.set(key, current);
  });

  const totalStake = sum(enriched.map((entry) => entry.amount));
  const totalPayout = sum(enriched.map((entry) => entry.payout));
  const commissionAmount = totalStake * (headHouse.commission_percent / 100);
  const netPayable = totalPayout + commissionAmount - totalStake;

  return {
    headHouse,
    totalStake,
    totalPayout,
    commissionPercent: headHouse.commission_percent,
    commissionAmount,
    netPayable,
    roundCount: summaryByRound.size,
    rounds: [...summaryByRound.values()],
  };
}

function isWinningEntry(entry, result) {
  if (entry.bet_type_id !== result.bet_type_id) return false;
  if (entry.bet_type_id === "three_tod") {
    return sortDigits(entry.number) === sortDigits(result.number);
  }
  return entry.number === result.number;
}

function importLegacyPayload(payload, userId) {
  const now = nowIso();
  const imported = { customers: 0, lotteries: 0 };

  if (Array.isArray(payload.customers)) {
    const insertCustomer = db.prepare(`
      INSERT OR IGNORE INTO customers (id, code, name, head_house_id, created_at, updated_at)
      VALUES (?, ?, ?, 'direct', ?, ?)
    `);
    payload.customers.forEach((customer) => {
      if (!customer?.id || !customer?.code) return;
      const result = insertCustomer.run(customer.id, cleanText(customer.code, 24).toUpperCase(), cleanText(customer.name, 80), now, now);
      imported.customers += result.changes;
    });
  }

  if (Array.isArray(payload.lotteries)) {
    const insertLottery = db.prepare(`
      INSERT OR IGNORE INTO lotteries (id, name, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `);
    payload.lotteries.forEach((lottery) => {
      if (!lottery?.id || !lottery?.name) return;
      const result = insertLottery.run(lottery.id, cleanText(lottery.name, 80), now, now);
      imported.lotteries += result.changes;
      seedPayoutRatesForLottery(lottery.id);
    });
  }

  logAudit(userId, "import", "legacy_payload", crypto.randomUUID(), imported);
  return imported;
}

function requireAuth(req, res, next) {
  purgeExpiredSessions();
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (!token) return res.status(401).json({ error: "unauthorized" });

  const tokenHash = hashToken(token);
  const session = db.prepare(`
    SELECT sessions.*, users.username, users.role, users.head_house_id, users.created_at AS user_created_at
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ?
  `).get(tokenHash);

  if (!session || session.expires_at <= nowIso()) {
    clearSessionCookie(res);
    return res.status(401).json({ error: "unauthorized" });
  }

  req.session = session;
  req.user = {
    id: session.user_id,
    username: session.username,
    role: session.role,
    head_house_id: session.head_house_id,
    created_at: session.user_created_at,
  };
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "forbidden" });
  }
  next();
}

function requireStaff(req, res, next) {
  if (req.user.role === "head_house_viewer") {
    return res.status(403).json({ error: "forbidden" });
  }
  next();
}


function requireNonAffiliate(req, res, next) {
  if (req.user.role === "head_house_viewer" || req.user.role === "affiliate") {
    return res.status(403).json({ error: "forbidden_role" });
  }
  next();
}

function requireWriteAccess(req, res, next) {
  if (req.user.role === "head_house_viewer") {
    return res.status(403).json({ error: "forbidden" });
  }
  next();
}

function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * ONE_DAY_MS).toISOString();

  db.prepare(`
    INSERT INTO sessions (token_hash, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `).run(tokenHash, userId, expiresAt, createdAt);

  return { token, tokenHash, expiresAt };
}

function purgeExpiredSessions() {
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(nowIso());
}

function setSessionCookie(res, token, expiresAt) {
  // PHASE-0 SECURITY-V1 — sameSite=Strict + Secure in prod
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; HttpOnly${secure}; Path=/; SameSite=Strict; Expires=${new Date(expiresAt).toUTCString()}`,
  );
}

function clearSessionCookie(res) {
  // PHASE-0 SECURITY-V1 — sameSite=Strict
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly${secure}; Path=/; SameSite=Strict; Max-Age=0`);
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [key, ...rest] = item.split("=");
        return [key, rest.join("=")];
      }),
  );
}



// ===== HOTFIX 2026-05-24: affiliate ownership helpers =====
function affiliateOwnsCustomer(user, customerId) {
  if (!user || user.role !== "affiliate" || !user.head_house_id) return true;
  if (!customerId || customerId === "walkin") return true;
  const c = db.prepare("SELECT head_house_id FROM customers WHERE id = ?").get(customerId);
  return c && c.head_house_id === user.head_house_id;
}
function affiliateOwnsTicket(user, ticketId) {
  if (!user || user.role !== "affiliate" || !user.head_house_id) return true;
  const t = db.prepare("SELECT head_house_id FROM tickets WHERE id = ?").get(ticketId);
  return t && t.head_house_id === user.head_house_id;
}
function affiliateOwnsEntry(user, entryId) {
  if (!user || user.role !== "affiliate" || !user.head_house_id) return true;
  const e = db.prepare(`SELECT tickets.head_house_id FROM entries
                        JOIN tickets ON tickets.id = entries.ticket_id
                        WHERE entries.id = ?`).get(entryId);
  return e && e.head_house_id === user.head_house_id;
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    headHouseId: user.head_house_id || null,
    createdAt: user.created_at,
  };
}

function logAudit(userId, action, entityType, entityId, payload) {
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, payload_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(crypto.randomUUID(), userId, action, entityType, entityId, JSON.stringify(payload), nowIso());
}

function cleanText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function cleanDigits(value, maxLength) {
  return String(value || "").replace(/\D/g, "").slice(0, maxLength);
}

function exactDigits(value, length) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === length ? digits : "";
}

function isNumberValidForBetType(number, betType) {
  return new RegExp(`^\\d{${betType.digits}}$`).test(number);
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function createSlugId(prefix, raw) {
  const slug = cleanText(raw, 80)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return slug || `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function nextSequentialCode(tableName, prefix, width) {
  const rows = db.prepare(`SELECT code FROM ${tableName} WHERE code GLOB ?`).all(`${prefix}[0-9]*`);
  const max = rows.reduce((currentMax, row) => {
    const match = row.code.match(new RegExp(`^${prefix}(\\d+)$`));
    return match ? Math.max(currentMax, Number(match[1])) : currentMax;
  }, 0);
  return `${prefix}${String(max + 1).padStart(width, "0")}`;
}

function nextAvailableHeadHouseUsername(code) {
  const base = cleanText(code, 24).toLowerCase();
  const existing = new Set(
    db.prepare("SELECT username FROM users WHERE username = ? OR username GLOB ?").all(base, `${base}-*`).map((row) => row.username),
  );
  if (!existing.has(base)) return base;
  let suffix = 2;
  while (existing.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function generateTemporaryPassword() {
  return crypto.randomBytes(6).toString("base64url");
}

function sortDigits(value) {
  return String(value).split("").sort().join("");
}

function sum(values) {
  return values.reduce((total, value) => total + Number(value || 0), 0);
}

function withTransaction(callback) {
  db.exec("BEGIN");
  try {
    const result = callback();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function nowIso() {
  return new Date().toISOString();
}

function ensureColumn(tableName, columnName, definition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  if (!columns.some((column) => column.name === columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition};`);
  }
}

function backfillLegacyTickets() {
  const legacyEntries = db.prepare(`
    SELECT *
    FROM entries
    WHERE ticket_id IS NULL OR ticket_id = ''
    ORDER BY created_at ASC
  `).all();
  if (!legacyEntries.length) return;

  withTransaction(() => {
    legacyEntries.forEach((entry) => {
      const ticket = createTicket(
        {
          customer_id: entry.customer_id,
          round_id: entry.round_id,
          source_channel: "legacy",
          source_text: entry.source_text,
          note: entry.note,
        },
        entry.created_by,
      );
      db.prepare(`
        UPDATE tickets
        SET status = 'approved', checked_by = ?, checked_at = ?, created_at = ?, updated_at = ?
        WHERE id = ?
      `).run(entry.created_by, entry.created_at, entry.created_at, entry.updated_at, ticket.id);
      db.prepare("UPDATE entries SET ticket_id = ? WHERE id = ?").run(ticket.id, entry.id);
    });
  });
}

function cleanLotteryCategory(value) {
  const allowed = new Set(["government", "daily", "thai", "foreign", "stock", "stock_vip", "other"]);
  return allowed.has(value) ? value : "other";
}

function nextLotteryDisplayOrder(category) {
  const row = db
    .prepare("SELECT COALESCE(MAX(display_order), 0) AS max_order FROM lotteries WHERE category = ?")
    .get(category);
  return Number(row?.max_order || 0) + 10;
}

function migrateUsersTableIfNeeded() {
  const usersSql = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'").get()?.sql || "";
  const hasViewerRole = usersSql.includes("head_house_viewer");
  const hasHeadHouseColumn = db.prepare("PRAGMA table_info(users)").all().some((column) => column.name === "head_house_id");

  if (hasViewerRole && hasHeadHouseColumn) return;

  db.exec("PRAGMA foreign_keys = OFF;");
  db.exec(`
    BEGIN TRANSACTION;
    CREATE TABLE users_new (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'operator', 'head_house_viewer')),
      head_house_id TEXT REFERENCES head_houses(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL
    );
    INSERT INTO users_new (id, username, password_hash, role, created_at)
    SELECT id, username, password_hash, role, created_at FROM users;
    DROP TABLE users;
    ALTER TABLE users_new RENAME TO users;
    COMMIT;
  `);
  db.exec("PRAGMA foreign_keys = ON;");
}

function presentRound(round) {
  const openAt = getRoundOpenAt(round);
  const drawAt = getRoundDrawAt(round);
  const resultAt = getRoundResultAt(round);
  const closeAt = getRoundCloseAt(round);
  return {
    ...round,
    open_at: openAt.toISOString(),
    draw_at: drawAt.toISOString(),
    result_at: resultAt.toISOString(),
    close_at: closeAt.toISOString(),
    accepting: roundAcceptsEntries(round),
  };
}

function presentScheduleTemplate(schedule) {
  return {
    ...schedule,
    weekdays: parseIntegerList(schedule.weekdays),
    month_days: parseIntegerList(schedule.month_days),
    active: Boolean(schedule.active),
  };
}

function roundAcceptsEntries(round) {
  const now = Date.now();
  return round.status === "open" && now >= getRoundOpenAt(round).getTime() && now < getRoundCloseAt(round).getTime();
}

function getRoundOpenAt(round) {
  return new Date(`${round.open_date || round.draw_date}T${round.open_time || "00:00"}:00+07:00`);
}

function getRoundDrawAt(round) {
  return new Date(`${round.draw_date}T${round.draw_time || "00:00"}:00+07:00`);
}

function getRoundResultAt(round) {
  return new Date(`${round.draw_date}T${round.result_time || round.draw_time || "00:00"}:00+07:00`);
}

function getRoundCloseAt(round) {
  const closeBeforeMinutes = Math.max(0, Number(round.close_before_minutes) || 0);
  return new Date(getRoundDrawAt(round).getTime() - closeBeforeMinutes * 60_000);
}

function isTimeOfDay(value) {
  return /^\d{2}:\d{2}$/.test(value) && Number(value.slice(0, 2)) < 24 && Number(value.slice(3, 5)) < 60;
}

function normalizeSchedulePayload(raw) {
  const lotteryId = cleanText(raw.lotteryId || raw.lottery_id, 80);
  const frequency = ["daily", "weekly", "monthly"].includes(raw.frequency) ? raw.frequency : "";
  const weekdays = normalizeIntegerList(raw.weekdays, 0, 6);
  const monthDays = normalizeIntegerList(raw.monthDays ?? raw.month_days, 1, 31);
    const openDaysBefore = Number(raw.openDaysBefore ?? raw.open_days_before ?? 0);
    const openTime = cleanText(raw.openTime || raw.open_time, 5);
    const drawTime = cleanText(raw.drawTime || raw.draw_time, 5);
    const resultTime = cleanText(raw.resultTime || raw.result_time || raw.drawTime || raw.draw_time, 5);
  const closeBeforeMinutes = Number(raw.closeBeforeMinutes ?? raw.close_before_minutes);
  const active = raw.active === false || raw.active === 0 || raw.active === "0" ? 0 : 1;
  const sourceNote = cleanText(raw.sourceNote || raw.source_note || "", 180);

  if (
    !lotteryId ||
    !frequency ||
    !Number.isInteger(openDaysBefore) ||
    openDaysBefore < 0 ||
    openDaysBefore > 30 ||
      !isTimeOfDay(openTime) ||
      !isTimeOfDay(drawTime) ||
      !isTimeOfDay(resultTime) ||
    !Number.isInteger(closeBeforeMinutes) ||
    closeBeforeMinutes < 0 ||
    closeBeforeMinutes > 1440
  ) {
    return null;
  }

  if (frequency === "monthly" && !monthDays.length) return null;
  if (frequency !== "monthly" && !weekdays.length) return null;

  return {
    lottery_id: lotteryId,
    frequency,
    weekdays: weekdays.join(","),
    month_days: monthDays.join(","),
      open_days_before: openDaysBefore,
      open_time: openTime,
      draw_time: drawTime,
      result_time: resultTime,
    close_before_minutes: closeBeforeMinutes,
    active,
    source_note: sourceNote,
  };
}

function normalizeIntegerList(value, min, max) {
  const raw = Array.isArray(value) ? value : String(value || "").split(",");
  return [
    ...new Set(
      raw
        .map((item) => String(item).trim())
        .filter(Boolean)
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item >= min && item <= max),
    ),
  ]
    .sort((a, b) => a - b);
}

function parseIntegerList(value) {
  return normalizeIntegerList(value, 0, 31);
}

function ensureUpcomingRounds(days = 45) {
  const fromDate = bangkokTodayIso();
  const toDate = shiftIsoDate(fromDate, days);
  const schedules = db.prepare("SELECT * FROM schedule_templates WHERE active = 1").all();
  let created = 0;
  schedules.forEach((schedule) => {
    created += generateRoundsForSchedule(schedule, fromDate, toDate);
  });
  return { created, fromDate, toDate };
}

function generateRoundsForSchedule(schedule, fromDate, toDate) {
  let created = 0;
  for (let date = fromDate; date <= toDate; date = shiftIsoDate(date, 1)) {
    if (!scheduleRunsOnDate(schedule, date)) continue;

    const label = formatGeneratedRoundLabel(date);
    const exists = db
      .prepare("SELECT 1 FROM rounds WHERE lottery_id = ? AND label = ?")
      .get(schedule.lottery_id, label);
    if (exists) continue;

    const now = nowIso();
    const openDate = shiftIsoDate(date, -Number(schedule.open_days_before || 0));
    db.prepare(`
        INSERT INTO rounds (
          id, lottery_id, label, open_date, open_time, draw_date, draw_time, result_time, close_before_minutes,
          status, schedule_template_id, auto_generated, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, 1, ?, ?)
    `).run(
      crypto.randomUUID(),
      schedule.lottery_id,
      label,
      openDate,
      schedule.open_time,
        date,
        schedule.draw_time,
        schedule.result_time || schedule.draw_time,
      schedule.close_before_minutes,
      schedule.id,
      now,
      now,
    );
    created += 1;
  }
  return created;
}

function syncFutureGeneratedRounds(schedule) {
  const today = bangkokTodayIso();
  const rounds = db
    .prepare(`
      SELECT rounds.*
      FROM rounds
      LEFT JOIN entries ON entries.round_id = rounds.id
      WHERE rounds.schedule_template_id = ?
        AND rounds.auto_generated = 1
        AND rounds.draw_date >= ?
      GROUP BY rounds.id
      HAVING COUNT(entries.id) = 0
    `)
    .all(schedule.id, today);

    const update = db.prepare(`
      UPDATE rounds
      SET open_date = ?, open_time = ?, draw_time = ?, result_time = ?, close_before_minutes = ?, updated_at = ?
      WHERE id = ?
  `);
  const remove = db.prepare("DELETE FROM rounds WHERE id = ?");

  rounds.forEach((round) => {
    if (!scheduleRunsOnDate(schedule, round.draw_date)) {
      remove.run(round.id);
      return;
    }
    const openDate = shiftIsoDate(round.draw_date, -Number(schedule.open_days_before || 0));
    update.run(openDate, schedule.open_time, schedule.draw_time, schedule.result_time || schedule.draw_time, schedule.close_before_minutes, nowIso(), round.id);
  });
}

function scheduleRunsOnDate(schedule, date) {
  if (!schedule.active) return false;
  const dayOfWeek = weekdayFromIsoDate(date);
  const dayOfMonth = Number(date.slice(-2));
  if (schedule.frequency === "monthly") {
    return parseIntegerList(schedule.month_days).includes(dayOfMonth);
  }
  return parseIntegerList(schedule.weekdays).includes(dayOfWeek);
}

function formatGeneratedRoundLabel(date) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}


/* X2: MONEY SAFETY helpers — กัน float rounding bug */
function roundMoney(n) {
  /* round 2 ตำแหน่ง — กัน 0.1 + 0.2 = 0.30000000004 */
  return Math.round(Number(n) * 100) / 100;
}
function isValidMoneyAmount(n) {
  /* ต้องเป็น number + > 0 + ทศนิยมไม่เกิน 2 ตำแหน่ง */
  const x = Number(n);
  if (!isFinite(x) || x <= 0) return false;
  return Math.round(x * 100) === x * 100;
}
function formatMoneyTH(n) {
  return roundMoney(n).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}



/* P2: Schema integrity check — scan code ตอน boot
   หา reference ของ `table.column` ใน server.js + เทียบกับ DB
   ถ้าขาด — auto ALTER ADD COLUMN + warn */
async function runSchemaIntegrityCheck() {
  try {
    const fs = await import("fs");
    const __thisFile = new URL(import.meta.url).pathname;
    const srcCode = fs.readFileSync(__thisFile, "utf8");
    /* known tables ที่ผูกกับ business — ขยายได้ */
    const tablesToCheck = ["tickets", "entries", "customers", "head_houses", "bank_accounts", "rounds", "results", "payout_rates"];
    const issues = [];
    for (const tbl of tablesToCheck) {
      const colsActual = new Set(db.prepare(`PRAGMA table_info(${tbl})`).all().map(c => c.name));
      if (!colsActual.size) continue;
      /* regex หา table.column ที่ใช้ใน SQL strings */
      const refPattern = new RegExp(`\\b${tbl}\\.([a-z_][a-z0-9_]*)\\b`, "g");
      const found = new Set();
      let m;
      while ((m = refPattern.exec(srcCode)) !== null) {
        const col = m[1];
        /* skip JavaScript methods (length, map, push ฯลฯ) */
        if (["length","map","push","forEach","filter","find","some","every","includes","slice","join","reduce","sort","reverse","indexOf","concat","keys","values","entries","prototype","constructor","hasOwnProperty","toString"].includes(col)) continue;
        found.add(col);
      }
      const missing = [...found].filter(c => !colsActual.has(c));
      if (missing.length) {
        issues.push({ table: tbl, missing });
        /* auto-add แต่ละ column ที่ขาด — TEXT default null */
        for (const col of missing) {
          try {
            db.exec(`ALTER TABLE ${tbl} ADD COLUMN ${col} TEXT`);
            console.warn(`[schema-check] auto-added ${tbl}.${col} (TEXT) — ตรวจชนิดให้ถูกหลัง`);
          } catch (e) {
            console.error(`[schema-check] ALTER ${tbl}.${col} failed:`, e.message);
          }
        }
      }
    }
    if (issues.length) {
      console.warn(`[schema-check] ⚠️ พบ ${issues.length} ตาราง มี columns ขาด — auto-added แล้ว`);
    } else {
      console.log(`[schema-check] ✓ schema integrity OK (${tablesToCheck.length} tables checked)`);
    }
  } catch (e) {
    console.error("[schema-check] failed:", e.message);
  }
}
/* run ตอน boot — หลัง migrations อื่นเสร็จ */
setTimeout(runSchemaIntegrityCheck, 3000);

function bangkokTodayIso() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

/* TZ-FIX: HH:MM ใน Asia/Bangkok */
function bangkokHHMM(date) {
  const d = date || new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(d);
  const values = Object.fromEntries(parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value]));
  return `${values.hour}:${values.minute}`;
}

/* TZ-FIX: ISO date string ใน Asia/Bangkok ของ Date ที่กำหนด */
function bangkokIsoDate(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const v = Object.fromEntries(parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value]));
  return `${v.year}-${v.month}-${v.day}`;
}

function shiftIsoDate(date, days) {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}

function weekdayFromIsoDate(date) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}


/* === FEAT bank-logo: dedicated bank_code update endpoint === */
app.post("/api/admin/bank-accounts/:id/bank-code", requireAuth, requireAdmin, (req, res) => {
  const id = req.params.id;
  const code = String(req.body.code || "").trim() || null;
  const acc = db.prepare("SELECT * FROM bank_accounts WHERE id = ?").get(id);
  if (!acc) return res.status(404).json({ error: "account_not_found" });
  db.prepare("UPDATE bank_accounts SET bank_code = ?, updated_at = ? WHERE id = ?").run(code, nowIso(), id);
  res.json({ ok: true });
});


/* ===== DISCORD-DAILY-SUMMARY-V2 — persist dedup in DB ===== */
try {
  db.exec(`CREATE TABLE IF NOT EXISTS discord_daily_log (
    date_key TEXT PRIMARY KEY,
    sent_at TEXT NOT NULL
  )`);
} catch (e) { /* ignore */ }
setInterval(() => {
  try {
    const now = new Date();
    const bkk = new Date(now.getTime() + 7 * 3600000);
    const h = bkk.getUTCHours();
    const m = bkk.getUTCMinutes();
    const dateKey = bkk.toISOString().slice(0, 10);
    if (h === 23 && m >= 30 && m < 35) {
      try {
        const exists = db.prepare("SELECT 1 FROM discord_daily_log WHERE date_key=?").get(dateKey);
        if (exists) return;
        const ins = db.prepare("INSERT OR IGNORE INTO discord_daily_log (date_key, sent_at) VALUES (?, ?)").run(dateKey, new Date().toISOString());
        if (ins && ins.changes === 0) return;
        sendDailySummaryToDiscord(dateKey).catch(() => {});
      } catch (e) { console.warn("[daily-summary-dedup]", e.message); }
    }
  } catch (e) { console.warn("[daily-summary-tick]", e.message); }
}, 60 * 1000).unref();

async function sendDailySummaryToDiscord(dateStr) {
  try {
    const todayStartIso = dateStr + "T00:00:00+07:00";
    const tomorrowStartIso = new Date(new Date(todayStartIso).getTime() + 86400000).toISOString();

    const totalRev = db.prepare(
      "SELECT COALESCE(SUM(entries.amount), 0) AS sum FROM entries JOIN tickets ON tickets.id = entries.ticket_id WHERE tickets.created_at >= ? AND tickets.created_at < ? AND tickets.status='approved'"
    ).get(todayStartIso, tomorrowStartIso).sum;

    const billCount = db.prepare(
      "SELECT COUNT(*) AS cnt FROM tickets WHERE created_at >= ? AND created_at < ? AND status IN ('approved','pending_review')"
    ).get(todayStartIso, tomorrowStartIso).cnt;

    const onlineRev = db.prepare(
      "SELECT COALESCE(SUM(entries.amount), 0) AS sum FROM entries JOIN tickets ON tickets.id = entries.ticket_id WHERE tickets.created_at >= ? AND tickets.created_at < ? AND tickets.status='approved' AND (tickets.head_house_id IN ('direct','line_self') OR tickets.head_house_id IS NULL)"
    ).get(todayStartIso, tomorrowStartIso).sum;

    const newCustomers = db.prepare(
      "SELECT COUNT(*) AS cnt FROM customers WHERE created_at >= ? AND created_at < ?"
    ).get(todayStartIso, tomorrowStartIso).cnt;

    await notifyDiscord("daily_summary", {
      embeds: [makeEmbed({
        title: "📊 สรุป " + dateStr,
        color: 0x9933cc,
        fields: [
          { name: "💰 ยอดรับรวม", value: Number(totalRev || 0).toLocaleString() + " บาท", inline: false },
          { name: "└ ออนไลน์", value: Number(onlineRev || 0).toLocaleString() + " บาท", inline: true },
          { name: "└ หัวบ้าน", value: Number((totalRev || 0) - (onlineRev || 0)).toLocaleString() + " บาท", inline: true },
          { name: "📝 บิล", value: (billCount || 0) + " บิล", inline: true },
          { name: "👥 ลูกค้าใหม่", value: (newCustomers || 0) + " คน", inline: true },
        ],
        footer: "auto-summary @ 23:30",
      })],
    });
  } catch (e) {
    console.warn("[discord-daily-summary]", e.message);
  }
}
/* ===== END DISCORD-DAILY-SUMMARY-V1 ===== */

/* ===== DISCORD-ADMIN-TEST-V1 ===== */
app.post("/api/admin/discord/test", requireAuth, requireAdmin, async (req, res) => {
  try {
    const channel = String((req.body && req.body.channel) || "results");
    const ok = await notifyDiscord(channel, {
      embeds: [makeEmbed({
        title: "🧪 Test message",
        description: "Discord integration ทำงานแล้ว",
        color: 0x06c755,
      })],
    });
    res.json({ ok, channel, flag_enabled: process.env.DISCORD_NOTIFICATIONS_ENABLED === "true" });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});
/* ===== END DISCORD-ADMIN-TEST-V1 ===== */
