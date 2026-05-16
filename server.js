import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import express from "express";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3001);
const DB_PATH = path.resolve(process.env.DB_PATH || path.join(__dirname, ".data", "lottery-manager.sqlite"));
const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || 7);
const SESSION_COOKIE = "lottery_session";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA foreign_keys = ON;");
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
    round_id TEXT NOT NULL REFERENCES rounds(id) ON DELETE RESTRICT,
    source_channel TEXT NOT NULL DEFAULT 'manual',
    source_text TEXT NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT '',
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
ensureColumn("rounds", "auto_generated", "INTEGER NOT NULL DEFAULT 0");
ensureColumn("rounds", "result_status", "TEXT NOT NULL DEFAULT 'draft'");
ensureColumn("rounds", "result_finalized_by", "TEXT");
ensureColumn("rounds", "result_finalized_at", "TEXT");
ensureColumn("customers", "head_house_id", "TEXT");
ensureColumn("users", "head_house_id", "TEXT");
ensureColumn("head_houses", "commission_percent", "REAL NOT NULL DEFAULT 0");
ensureColumn("lotteries", "category", "TEXT NOT NULL DEFAULT 'other'");
ensureColumn("lotteries", "display_order", "INTEGER NOT NULL DEFAULT 999");
ensureColumn("entries", "ticket_id", "TEXT");
seedReferenceData();
db.prepare("UPDATE customers SET head_house_id = 'direct' WHERE head_house_id IS NULL OR head_house_id = ''").run();
backfillLegacyTickets();
ensureUpcomingRounds();

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));
app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/app.js", (_req, res) => res.sendFile(path.join(__dirname, "app.js")));
app.get("/styles.css", (_req, res) => res.sendFile(path.join(__dirname, "styles.css")));

app.get("/api/bootstrap", (_req, res) => {
  res.json({ setupRequired: countRows("users") === 0 });
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

app.post("/api/login", (req, res) => {
  const username = cleanText(req.body.username, 40);
  const password = String(req.body.password || "");
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "invalid_credentials" });
  }

  const session = createSession(user.id);
  setSessionCookie(res, session.token, session.expiresAt);
  logAudit(user.id, "login", "session", session.tokenHash, {});
  res.json({ user: publicUser(user) });
});

app.post("/api/logout", requireAuth, (req, res) => {
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(req.session.tokenHash);
  clearSessionCookie(res);
  logAudit(req.user.id, "logout", "session", req.session.tokenHash, {});
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
  const role =
    req.body.role === "operator"
      ? "operator"
      : req.body.role === "head_house_viewer"
        ? "head_house_viewer"
        : "admin";
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
  const role =
    req.body.role === "operator"
      ? "operator"
      : req.body.role === "head_house_viewer"
        ? "head_house_viewer"
        : "admin";
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
      INSERT INTO head_houses (id, code, name, note, commission_percent, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      headHouse.id,
      headHouse.code,
      headHouse.name,
      headHouse.note,
      headHouse.commission_percent,
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
  if (!name || !Number.isFinite(commissionPercent) || commissionPercent < 0 || commissionPercent > 100) {
    return res.status(400).json({ error: "invalid_head_house_payload" });
  }

  db.prepare(`
    UPDATE head_houses
    SET name = ?, note = ?, commission_percent = ?, updated_at = ?
    WHERE id = ?
  `).run(name, note, commissionPercent, nowIso(), headHouse.id);
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
    INSERT INTO users (id, username, password_hash, role, head_house_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(user.id, user.username, user.password_hash, user.role, user.head_house_id, user.created_at);

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
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(bcrypt.hashSync(password, 12), viewer.id);
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(viewer.id);
  logAudit(req.user.id, "reset_password", "head_house_viewer", viewer.id, { headHouseId: headHouse.id });
  res.json({
    user: publicUser(viewer),
    username: viewer.username,
    password,
    loginPath: "/",
  });
});

app.post("/api/customers", requireAuth, requireWriteAccess, (req, res) => {
  const name = cleanText(req.body.name, 80);
  const headHouseId = cleanText(req.body.headHouseId, 80);

  if (!findHeadHouse(headHouseId)) {
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

app.put("/api/customers/:id", requireAuth, requireWriteAccess, (req, res) => {
  const existing = findCustomer(req.params.id);
  if (!existing) return res.status(404).json({ error: "customer_not_found" });

  const name = cleanText(req.body.name, 80);
  const headHouseId = cleanText(req.body.headHouseId, 80);
  if (!findHeadHouse(headHouseId)) {
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

app.delete("/api/customers/:id", requireAuth, requireWriteAccess, (req, res) => {
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

app.post("/api/lotteries", requireAuth, requireWriteAccess, (req, res) => {
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

app.post("/api/schedule-templates", requireAuth, requireWriteAccess, (req, res) => {
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
      draw_time, close_before_minutes, active, source_note, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    schedule.id,
    schedule.lottery_id,
    schedule.frequency,
    schedule.weekdays,
    schedule.month_days,
    schedule.open_days_before,
    schedule.open_time,
    schedule.draw_time,
    schedule.close_before_minutes,
    schedule.active,
    schedule.source_note,
    schedule.created_at,
    schedule.updated_at,
  );

  generateRoundsForSchedule(schedule, bangkokTodayIso(), shiftIsoDate(bangkokTodayIso(), 14));
  logAudit(req.user.id, "create", "schedule_template", schedule.id, schedule);
  res.status(201).json(presentScheduleTemplate(schedule));
});

app.put("/api/schedule-templates/:id", requireAuth, requireWriteAccess, (req, res) => {
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
        draw_time = ?, close_before_minutes = ?, active = ?, source_note = ?, updated_at = ?
    WHERE id = ?
  `).run(
    payload.frequency,
    payload.weekdays,
    payload.month_days,
    payload.open_days_before,
    payload.open_time,
    payload.draw_time,
    payload.close_before_minutes,
    payload.active,
    payload.source_note,
    updatedAt,
    existing.id,
  );

  const updated = findScheduleTemplate(existing.id);
  syncFutureGeneratedRounds(updated);
  generateRoundsForSchedule(updated, bangkokTodayIso(), shiftIsoDate(bangkokTodayIso(), 14));
  logAudit(req.user.id, "update", "schedule_template", updated.id, updated);
  res.json(presentScheduleTemplate(updated));
});

app.post("/api/schedule-templates/generate", requireAuth, requireWriteAccess, (req, res) => {
  const days = Number(req.body?.days ?? 14);
  if (!Number.isInteger(days) || days < 1 || days > 90) {
    return res.status(400).json({ error: "invalid_generate_days" });
  }

  const summary = ensureUpcomingRounds(days);
  logAudit(req.user.id, "generate", "rounds", "scheduled", summary);
  res.json(summary);
});

app.post("/api/rounds", requireAuth, requireWriteAccess, (req, res) => {
  const lotteryId = cleanText(req.body.lotteryId, 80);
  const label = cleanText(req.body.label, 80);
  const openDate = cleanText(req.body.openDate || req.body.drawDate, 20);
  const openTime = cleanText(req.body.openTime || "00:00", 5);
  const drawDate = cleanText(req.body.drawDate, 20);
  const drawTime = cleanText(req.body.drawTime, 5);
  const closeBeforeMinutes = Number(req.body.closeBeforeMinutes);
  const status = req.body.status === "closed" ? "closed" : "open";

  if (
    !lotteryId ||
    !label ||
    !isIsoDate(openDate) ||
    !isTimeOfDay(openTime) ||
    !isIsoDate(drawDate) ||
    !isTimeOfDay(drawTime) ||
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
    close_before_minutes: closeBeforeMinutes,
    status,
    created_at: now,
    updated_at: now,
  };

  try {
    db.prepare(`
      INSERT INTO rounds (id, lottery_id, label, open_date, open_time, draw_date, draw_time, close_before_minutes, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      round.id,
      round.lottery_id,
      round.label,
      round.open_date,
      round.open_time,
      round.draw_date,
      round.draw_time,
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

app.put("/api/rounds/:id", requireAuth, requireWriteAccess, (req, res) => {
  const round = findRound(req.params.id);
  if (!round) return res.status(404).json({ error: "round_not_found" });

  const status = req.body.status === undefined ? round.status : req.body.status === "closed" ? "closed" : "open";
  const label = req.body.label ? cleanText(req.body.label, 80) : round.label;
  const openDate = req.body.openDate ? cleanText(req.body.openDate, 20) : round.open_date || round.draw_date;
  const openTime = req.body.openTime ? cleanText(req.body.openTime, 5) : round.open_time || "00:00";
  const drawDate = req.body.drawDate ? cleanText(req.body.drawDate, 20) : round.draw_date;
  const drawTime = req.body.drawTime ? cleanText(req.body.drawTime, 5) : round.draw_time;
  const closeBeforeMinutes =
    req.body.closeBeforeMinutes === undefined ? round.close_before_minutes : Number(req.body.closeBeforeMinutes);

  if (
    !label ||
    !isIsoDate(openDate) ||
    !isTimeOfDay(openTime) ||
    !isIsoDate(drawDate) ||
    !isTimeOfDay(drawTime) ||
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
      SET label = ?, status = ?, open_date = ?, open_time = ?, draw_date = ?, draw_time = ?, close_before_minutes = ?, updated_at = ?
      WHERE id = ?
    `).run(label, status, openDate, openTime, drawDate, drawTime, closeBeforeMinutes, updatedAt, round.id);
  } catch {
    return res.status(409).json({ error: "round_exists" });
  }
  const updated = findRound(round.id);
  logAudit(req.user.id, "update", "round", round.id, updated);
  res.json(presentRound(updated));
});

app.post("/api/payout-rates", requireAuth, requireWriteAccess, (req, res) => {
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

app.post("/api/limits", requireAuth, requireWriteAccess, (req, res) => {
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

app.put("/api/limits/:id", requireAuth, requireWriteAccess, (req, res) => {
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

app.delete("/api/limits/:id", requireAuth, requireWriteAccess, (req, res) => {
  const existing = findLimit(req.params.id);
  if (!existing) return res.status(404).json({ error: "limit_not_found" });
  db.prepare("DELETE FROM limits WHERE id = ?").run(existing.id);
  logAudit(req.user.id, "delete", "limit", existing.id, existing);
  res.status(204).end();
});

app.post("/api/entries", requireAuth, requireWriteAccess, (req, res) => {
  const payload = normalizeEntryPayload(req.body);
  if (!payload.ok) return res.status(400).json({ error: payload.error });

  const limitError = validateLimitCapacity(payload.value);
  if (limitError) return res.status(409).json(limitError);

  const created = withTransaction(() => {
    const ticket = createTicket(
      {
        customer_id: payload.value.customer_id,
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

  const batchLimitError = validateBatchLimitCapacity(normalized);
  if (batchLimitError) return res.status(409).json(batchLimitError);

  const first = normalized[0];
  const hasMixedTickets = normalized.some(
    (entry) => entry.customer_id !== first.customer_id || entry.round_id !== first.round_id,
  );
  if (hasMixedTickets) return res.status(400).json({ error: "ticket_must_share_customer_and_round" });

  const created = withTransaction(() => {
    const ticket = createTicket(
      {
        customer_id: first.customer_id,
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

  logAudit(req.user.id, "create", "ticket", created.ticket.id, created.ticket);
  logAudit(req.user.id, "create_batch", "entry", created.inserted.map((entry) => entry.id).join(","), created.inserted);
  res.status(201).json(created.inserted);
});

app.put("/api/entries/:id", requireAuth, requireWriteAccess, (req, res) => {
  const existing = findEntry(req.params.id);
  if (!existing) return res.status(404).json({ error: "entry_not_found" });
  if (ticketIsLocked(existing.ticket_id)) return res.status(409).json({ error: "ticket_locked" });

  const payload = normalizeEntryPayload(req.body);
  if (!payload.ok) return res.status(400).json({ error: payload.error });

  const limitError = validateLimitCapacity(payload.value, existing.id);
  if (limitError) return res.status(409).json(limitError);

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

  const updated = findEntry(existing.id);
  logAudit(req.user.id, "update", "entry", existing.id, updated);
  res.json(updated);
});

app.delete("/api/entries/:id", requireAuth, requireWriteAccess, (req, res) => {
  const existing = findEntry(req.params.id);
  if (!existing) return res.status(404).json({ error: "entry_not_found" });
  if (ticketIsLocked(existing.ticket_id)) return res.status(409).json({ error: "ticket_locked" });
  db.prepare("DELETE FROM entries WHERE id = ?").run(existing.id);
  logAudit(req.user.id, "delete", "entry", existing.id, existing);
  res.status(204).end();
});

app.post("/api/tickets/:id/approve", requireAuth, requireAdmin, (req, res) => {
  const ticket = findTicket(req.params.id);
  if (!ticket) return res.status(404).json({ error: "ticket_not_found" });
  if (ticket.status !== "pending_review") return res.status(409).json({ error: "ticket_not_pending" });

  const now = nowIso();
  db.prepare(`
    UPDATE tickets
    SET status = 'approved', checked_by = ?, checked_at = ?, updated_at = ?
    WHERE id = ?
  `).run(req.user.id, now, now, ticket.id);

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
    SET status = 'rejected', checked_by = ?, checked_at = ?, note = ?, updated_at = ?
    WHERE id = ?
  `).run(req.user.id, now, reason || ticket.note, now, ticket.id);

  const updated = findTicket(ticket.id);
  logAudit(req.user.id, "reject", "ticket", ticket.id, { ...updated, reason });
  res.json(updated);
});

app.post("/api/tickets/:id/cancel", requireAuth, requireAdmin, (req, res) => {
  const ticket = findTicket(req.params.id);
  if (!ticket) return res.status(404).json({ error: "ticket_not_found" });
  if (ticket.status === "cancelled") return res.status(409).json({ error: "ticket_already_cancelled" });

  const now = nowIso();
  db.prepare(`
    UPDATE tickets
    SET status = 'cancelled', checked_by = ?, checked_at = ?, updated_at = ?
    WHERE id = ?
  `).run(req.user.id, now, now, ticket.id);

  const updated = findTicket(ticket.id);
  logAudit(req.user.id, "cancel", "ticket", ticket.id, updated);
  res.json(updated);
});

app.post("/api/results", requireAuth, requireWriteAccess, (req, res) => {
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

  const updated = findRound(round.id);
  logAudit(req.user.id, "reopen", "result", round.id, updated);
  res.json(presentRound(updated));
});

app.get("/api/settlements", requireAuth, requireStaff, (req, res) => {
  const roundId = cleanText(req.query.roundId, 80);
  if (!findRound(roundId)) return res.status(404).json({ error: "round_not_found" });
  res.json(buildSettlement(roundId));
});

app.get("/api/head-house-summary", requireAuth, (req, res) => {
  const requestedId = cleanText(req.query.headHouseId, 80);
  const headHouseId = req.user.role === "head_house_viewer" ? req.user.head_house_id : requestedId;

  if (!headHouseId || !findHeadHouse(headHouseId)) {
    return res.status(404).json({ error: "head_house_not_found" });
  }

  res.json(buildHeadHouseSummary(headHouseId));
});

app.get("/api/export", requireAuth, requireStaff, (req, res) => {
  res.json(getFullState(req.user));
});

app.post("/api/import", requireAuth, requireWriteAccess, (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ error: "invalid_import_payload" });
  }

  const imported = importLegacyPayload(payload, req.user.id);
  res.json(imported);
});

app.listen(PORT, () => {
  console.log(`lottery-manager listening on http://127.0.0.1:${PORT}`);
});

function seedReferenceData() {
  const now = nowIso();
  const betTypes = [
    ["two_top", "2 ตัวบน", 2],
    ["two_bottom", "2 ตัวล่าง", 2],
    ["three_top", "3 ตัวบน", 3],
    ["three_tod", "3 ตัวโต๊ด", 3],
    ["run_top", "วิ่งบน", 1],
    ["run_bottom", "วิ่งล่าง", 1],
  ];
  const lotteries = [
    ["thai", "หวยไทย", "government", 10],
    ["hanoi", "หวยฮานอย", "daily", 10],
    ["hanoi_vip", "หวยฮานอย VIP", "daily", 20],
    ["hanoi_star", "หวยฮานอย STAR", "daily", 30],
    ["hanoi_tv", "หวยฮานอย TV", "daily", 40],
    ["lao", "หวยลาว", "daily", 50],
    ["lao_development", "หวยลาวพัฒนา", "daily", 60],
    ["lao_unity", "หวยลาวสามัคคี", "daily", 70],
    ["omsin", "หวยออมสิน", "thai", 10],
    ["baac", "หวย ธกส", "thai", 20],
    ["malaysia", "หวยมาเลเซีย", "foreign", 10],
    ["yamoey", "หวยยี่กี", "foreign", 20],
    ["stock", "หวยหุ้น", "stock", 10],
    ["nikkei_vip", "นิเคอิ VIP", "stock_vip", 10],
    ["china_vip", "จีน VIP", "stock_vip", 20],
    ["hangseng_vip", "ฮั่งเส็ง VIP", "stock_vip", 30],
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
  lotteries.forEach(([id, name, category, displayOrder]) =>
    insertLottery.run(id, name, category, displayOrder, now, now),
  );

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
}

function seedScheduleTemplates() {
  const now = nowIso();
  const schedules = [
    ["thai", "monthly", "", "1,16", 0, "00:00", "14:30", 15, 1, "อ้างอิงตารางทางการ"],
    ["omsin", "monthly", "", "16", 0, "00:00", "10:30", 15, 1, "อ้างอิงตารางทางการ"],
    ["hanoi", "daily", "0,1,2,3,4,5,6", "", 0, "00:00", "18:30", 5, 1, "ค่าเริ่มต้นจากตารางงานที่ผู้ดูแลกำหนด"],
    ["hanoi_vip", "daily", "0,1,2,3,4,5,6", "", 0, "00:00", "19:30", 5, 1, "ค่าเริ่มต้นจากตารางงานที่ผู้ดูแลกำหนด"],
    ["hanoi_star", "daily", "0,1,2,3,4,5,6", "", 0, "00:00", "20:30", 5, 1, "ค่าเริ่มต้นจากตารางงานที่ผู้ดูแลกำหนด"],
    ["hanoi_tv", "daily", "0,1,2,3,4,5,6", "", 0, "00:00", "19:45", 5, 1, "ค่าเริ่มต้นจากตารางงานที่ผู้ดูแลกำหนด"],
    ["lao", "daily", "0,1,2,3,4,5,6", "", 0, "00:00", "21:00", 5, 1, "ค่าเริ่มต้นจากตารางงานที่ผู้ดูแลกำหนด"],
    ["lao_development", "daily", "0,1,2,3,4,5,6", "", 0, "00:00", "20:30", 5, 1, "ค่าเริ่มต้นจากตารางงานที่ผู้ดูแลกำหนด"],
    ["lao_unity", "daily", "0,1,2,3,4,5,6", "", 0, "00:00", "20:30", 5, 1, "ค่าเริ่มต้นจากตารางงานที่ผู้ดูแลกำหนด"],
  ];

  const insert = db.prepare(`
    INSERT OR IGNORE INTO schedule_templates (
      id, lottery_id, frequency, weekdays, month_days, open_days_before, open_time,
      draw_time, close_before_minutes, active, source_note, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  schedules.forEach(
    ([lotteryId, frequency, weekdays, monthDays, openDaysBefore, openTime, drawTime, closeBeforeMinutes, active, sourceNote]) => {
      insert.run(
        crypto.randomUUID(),
        lotteryId,
        frequency,
        weekdays,
        monthDays,
        openDaysBefore,
        openTime,
        drawTime,
        closeBeforeMinutes,
        active,
        sourceNote,
        now,
        now,
      );
    },
  );
}

function seedPayoutRatesForLottery(lotteryId) {
  const now = nowIso();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO payout_rates (id, lottery_id, bet_type_id, rate, created_at, updated_at)
    VALUES (?, ?, ?, 0, ?, ?)
  `);
  getBetTypes().forEach((betType) => {
    insert.run(crypto.randomUUID(), lotteryId, betType.id, now, now);
  });
}

function getFullState(user) {
  if (user?.role === "head_house_viewer") {
    return {
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
    betTypes: getBetTypes(),
    payoutRates: db.prepare("SELECT * FROM payout_rates").all(),
    limits: db.prepare("SELECT * FROM limits ORDER BY created_at DESC").all(),
    tickets: db
      .prepare(`
        SELECT tickets.*,
               customers.code AS customer_code,
               customers.name AS customer_name,
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
  const amount = Number(body.amount);
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

  const current = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS amount
    FROM entries
    WHERE round_id = ? AND bet_type_id = ? AND number = ?
      AND (? IS NULL OR id <> ?)
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
      SELECT COALESCE(SUM(amount), 0) AS amount
      FROM entries
      WHERE round_id = ? AND bet_type_id = ? AND number = ?
    `).get(roundId, betTypeId, number).amount;

    if (current + batchAmount > limit.max_amount) {
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
      id, code, customer_id, round_id, source_channel, source_text, note,
      status, checked_by, checked_at, created_by, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    ticket.id,
    ticket.code,
    ticket.customer_id,
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
  return ticket;
}

function ticketIsLocked(ticketId) {
  if (!ticketId) return false;
  const ticket = findTicket(ticketId);
  return Boolean(ticket && ticket.status !== "pending_review");
}

function insertEntry(payload, userId, ticketId = null) {
  const now = nowIso();
  const entry = {
    id: crypto.randomUUID(),
    ticket_id: ticketId,
    ...payload,
    created_by: userId,
    created_at: now,
    updated_at: now,
  };
  db.prepare(`
    INSERT INTO entries (id, ticket_id, customer_id, round_id, bet_type_id, number, amount, note, source_text, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    entry.id,
    entry.ticket_id,
    entry.customer_id,
    entry.round_id,
    entry.bet_type_id,
    entry.number,
    entry.amount,
    entry.note,
    entry.source_text,
    entry.created_by,
    entry.created_at,
    entry.updated_at,
  );
  return entry;
}

function normalizeResultNumbers(numbers, betTypeId) {
  const betType = findBetType(betTypeId);
  if (!betType) return [];

  return [...new Set(String(numbers || "")
    .split(/[\s,]+/)
    .map((item) => cleanDigits(item, 3))
    .filter((item) => isNumberValidForBetType(item, betType)))];
}

function buildSettlement(roundId) {
  const round = findRound(roundId);
  const entries = db.prepare(`
    SELECT entries.*, customers.code AS customer_code, customers.name AS customer_name, bet_types.name AS bet_type_name
    FROM entries
    JOIN customers ON customers.id = entries.customer_id
    JOIN bet_types ON bet_types.id = entries.bet_type_id
    JOIN tickets ON tickets.id = entries.ticket_id
    WHERE entries.round_id = ?
      AND tickets.status = 'approved'
  `).all(roundId);
  const results = db.prepare("SELECT * FROM results WHERE round_id = ?").all(roundId);
  const payoutRates = db.prepare("SELECT * FROM payout_rates WHERE lottery_id = ?").all(round.lottery_id);

  const winners = entries
    .map((entry) => {
      const matched = results.some((result) => isWinningEntry(entry, result));
      if (!matched) return null;
      const rate = payoutRates.find((item) => item.bet_type_id === entry.bet_type_id)?.rate || 0;
      return {
        ...entry,
        rate,
        payout: entry.amount * rate,
      };
    })
    .filter(Boolean);

  const totalStake = sum(entries.map((entry) => entry.amount));
  const totalPayout = sum(winners.map((winner) => winner.payout));

  return {
    round,
    totalStake,
    totalPayout,
    profit: totalStake - totalPayout,
    winnerCount: winners.length,
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
        WHERE customers.head_house_id = ?
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

  const enriched = entries.map((entry) => {
    const matched = resultRows.some((result) => result.round_id === entry.round_id && isWinningEntry(entry, result));
    const rate = payoutRates.find(
      (item) => item.lottery_id === entry.lottery_id && item.bet_type_id === entry.bet_type_id,
    )?.rate || 0;
    return {
      ...entry,
      payout: matched ? entry.amount * rate : 0,
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
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Expires=${new Date(expiresAt).toUTCString()}`,
  );
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
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
  const closeAt = getRoundCloseAt(round);
  return {
    ...round,
    open_at: openAt.toISOString(),
    draw_at: drawAt.toISOString(),
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

function ensureUpcomingRounds(days = 14) {
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
        id, lottery_id, label, open_date, open_time, draw_date, draw_time, close_before_minutes,
        status, schedule_template_id, auto_generated, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, 1, ?, ?)
    `).run(
      crypto.randomUUID(),
      schedule.lottery_id,
      label,
      openDate,
      schedule.open_time,
      date,
      schedule.draw_time,
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
    SET open_date = ?, open_time = ?, draw_time = ?, close_before_minutes = ?, updated_at = ?
    WHERE id = ?
  `);
  const remove = db.prepare("DELETE FROM rounds WHERE id = ?");

  rounds.forEach((round) => {
    if (!scheduleRunsOnDate(schedule, round.draw_date)) {
      remove.run(round.id);
      return;
    }
    const openDate = shiftIsoDate(round.draw_date, -Number(schedule.open_days_before || 0));
    update.run(openDate, schedule.open_time, schedule.draw_time, schedule.close_before_minutes, nowIso(), round.id);
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

function shiftIsoDate(date, days) {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}

function weekdayFromIsoDate(date) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}
