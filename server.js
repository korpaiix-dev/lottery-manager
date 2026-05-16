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
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'operator')),
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
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS lotteries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rounds (
    id TEXT PRIMARY KEY,
    lottery_id TEXT NOT NULL REFERENCES lotteries(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    draw_date TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('open', 'closed')) DEFAULT 'open',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(lottery_id, label)
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

seedReferenceData();

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
  res.json(getFullState(req.user));
});

app.post("/api/users", requireAuth, requireAdmin, (req, res) => {
  const username = cleanText(req.body.username, 40);
  const password = String(req.body.password || "");
  const role = req.body.role === "operator" ? "operator" : "admin";

  if (!username || password.length < 8) {
    return res.status(400).json({ error: "invalid_user_payload" });
  }

  const user = {
    id: crypto.randomUUID(),
    username,
    password_hash: bcrypt.hashSync(password, 12),
    role,
    created_at: nowIso(),
  };

  try {
    db.prepare(`
      INSERT INTO users (id, username, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(user.id, user.username, user.password_hash, user.role, user.created_at);
  } catch {
    return res.status(409).json({ error: "username_exists" });
  }

  logAudit(req.user.id, "create", "user", user.id, { username: user.username, role: user.role });
  res.status(201).json(publicUser(user));
});

app.post("/api/customers", requireAuth, (req, res) => {
  const code = cleanText(req.body.code, 24).toUpperCase();
  const name = cleanText(req.body.name, 80);

  if (!code) {
    return res.status(400).json({ error: "customer_code_required" });
  }

  const now = nowIso();
  const customer = {
    id: createSlugId("customer", code),
    code,
    name,
    created_at: now,
    updated_at: now,
  };

  try {
    db.prepare(`
      INSERT INTO customers (id, code, name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(customer.id, customer.code, customer.name, customer.created_at, customer.updated_at);
  } catch {
    return res.status(409).json({ error: "customer_code_exists" });
  }

  logAudit(req.user.id, "create", "customer", customer.id, customer);
  res.status(201).json(customer);
});

app.post("/api/lotteries", requireAuth, (req, res) => {
  const name = cleanText(req.body.name, 80);
  if (!name) {
    return res.status(400).json({ error: "lottery_name_required" });
  }

  const now = nowIso();
  const lottery = {
    id: createSlugId("lottery", name),
    name,
    created_at: now,
    updated_at: now,
  };

  try {
    db.prepare(`
      INSERT INTO lotteries (id, name, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `).run(lottery.id, lottery.name, lottery.created_at, lottery.updated_at);
  } catch {
    return res.status(409).json({ error: "lottery_name_exists" });
  }

  seedPayoutRatesForLottery(lottery.id);
  logAudit(req.user.id, "create", "lottery", lottery.id, lottery);
  res.status(201).json(lottery);
});

app.post("/api/rounds", requireAuth, (req, res) => {
  const lotteryId = cleanText(req.body.lotteryId, 80);
  const label = cleanText(req.body.label, 80);
  const drawDate = cleanText(req.body.drawDate, 20);
  const status = req.body.status === "closed" ? "closed" : "open";

  if (!lotteryId || !label || !isIsoDate(drawDate) || !findLottery(lotteryId)) {
    return res.status(400).json({ error: "invalid_round_payload" });
  }

  const now = nowIso();
  const round = {
    id: crypto.randomUUID(),
    lottery_id: lotteryId,
    label,
    draw_date: drawDate,
    status,
    created_at: now,
    updated_at: now,
  };

  try {
    db.prepare(`
      INSERT INTO rounds (id, lottery_id, label, draw_date, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(round.id, round.lottery_id, round.label, round.draw_date, round.status, round.created_at, round.updated_at);
  } catch {
    return res.status(409).json({ error: "round_exists" });
  }

  logAudit(req.user.id, "create", "round", round.id, round);
  res.status(201).json(round);
});

app.put("/api/rounds/:id", requireAuth, (req, res) => {
  const round = findRound(req.params.id);
  if (!round) return res.status(404).json({ error: "round_not_found" });

  const status = req.body.status === "closed" ? "closed" : "open";
  const updatedAt = nowIso();
  db.prepare("UPDATE rounds SET status = ?, updated_at = ? WHERE id = ?").run(status, updatedAt, round.id);
  const updated = findRound(round.id);
  logAudit(req.user.id, "update", "round", round.id, { status });
  res.json(updated);
});

app.post("/api/payout-rates", requireAuth, (req, res) => {
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

app.post("/api/limits", requireAuth, (req, res) => {
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

app.put("/api/limits/:id", requireAuth, (req, res) => {
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

app.delete("/api/limits/:id", requireAuth, (req, res) => {
  const existing = findLimit(req.params.id);
  if (!existing) return res.status(404).json({ error: "limit_not_found" });
  db.prepare("DELETE FROM limits WHERE id = ?").run(existing.id);
  logAudit(req.user.id, "delete", "limit", existing.id, existing);
  res.status(204).end();
});

app.post("/api/entries", requireAuth, (req, res) => {
  const payload = normalizeEntryPayload(req.body);
  if (!payload.ok) return res.status(400).json({ error: payload.error });

  const limitError = validateLimitCapacity(payload.value);
  if (limitError) return res.status(409).json(limitError);

  const entry = insertEntry(payload.value, req.user.id);
  logAudit(req.user.id, "create", "entry", entry.id, entry);
  res.status(201).json(entry);
});

app.post("/api/entries/batch", requireAuth, (req, res) => {
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

  const inserted = withTransaction(() =>
    normalized.map((entryPayload) => insertEntry(entryPayload, req.user.id)),
  );

  logAudit(req.user.id, "create_batch", "entry", inserted.map((entry) => entry.id).join(","), inserted);
  res.status(201).json(inserted);
});

app.put("/api/entries/:id", requireAuth, (req, res) => {
  const existing = findEntry(req.params.id);
  if (!existing) return res.status(404).json({ error: "entry_not_found" });

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

app.delete("/api/entries/:id", requireAuth, (req, res) => {
  const existing = findEntry(req.params.id);
  if (!existing) return res.status(404).json({ error: "entry_not_found" });
  db.prepare("DELETE FROM entries WHERE id = ?").run(existing.id);
  logAudit(req.user.id, "delete", "entry", existing.id, existing);
  res.status(204).end();
});

app.post("/api/results", requireAuth, (req, res) => {
  const roundId = cleanText(req.body.roundId, 80);
  const betTypeId = cleanText(req.body.betTypeId, 80);
  const numbers = normalizeResultNumbers(req.body.numbers, betTypeId);

  if (!findRound(roundId) || !findBetType(betTypeId) || !numbers.length) {
    return res.status(400).json({ error: "invalid_result_payload" });
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

app.get("/api/settlements", requireAuth, (req, res) => {
  const roundId = cleanText(req.query.roundId, 80);
  if (!findRound(roundId)) return res.status(404).json({ error: "round_not_found" });
  res.json(buildSettlement(roundId));
});

app.get("/api/export", requireAuth, (req, res) => {
  res.json(getFullState(req.user));
});

app.post("/api/import", requireAuth, (req, res) => {
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
    ["thai", "หวยไทย"],
    ["lao", "หวยลาว"],
    ["hanoi", "หวยฮานอย"],
    ["stock", "หวยหุ้น"],
  ];

  const insertBetType = db.prepare(`
    INSERT OR IGNORE INTO bet_types (id, name, digits, created_at)
    VALUES (?, ?, ?, ?)
  `);
  betTypes.forEach(([id, name, digits]) => insertBetType.run(id, name, digits, now));

  const insertLottery = db.prepare(`
    INSERT OR IGNORE INTO lotteries (id, name, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `);
  lotteries.forEach(([id, name]) => insertLottery.run(id, name, now, now));

  db.prepare(`
    INSERT OR IGNORE INTO customers (id, code, name, created_at, updated_at)
    VALUES ('walkin', 'WALKIN', 'ไม่ระบุชื่อ', ?, ?)
  `).run(now, now);

  lotteries.forEach(([id]) => seedPayoutRatesForLottery(id));
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
  return {
    lotteries: db.prepare("SELECT * FROM lotteries ORDER BY name").all(),
    customers: db.prepare("SELECT * FROM customers ORDER BY code").all(),
    rounds: db.prepare(`
      SELECT rounds.*, lotteries.name AS lottery_name
      FROM rounds
      JOIN lotteries ON lotteries.id = rounds.lottery_id
      ORDER BY draw_date DESC, created_at DESC
    `).all(),
    betTypes: getBetTypes(),
    payoutRates: db.prepare("SELECT * FROM payout_rates").all(),
    limits: db.prepare("SELECT * FROM limits ORDER BY created_at DESC").all(),
    entries: db.prepare("SELECT * FROM entries ORDER BY created_at DESC").all(),
    results: db.prepare("SELECT * FROM results ORDER BY created_at DESC").all(),
    users:
      user?.role === "admin"
        ? db.prepare("SELECT id, username, role, created_at FROM users ORDER BY created_at DESC").all()
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

  if (
    !db.prepare("SELECT 1 FROM customers WHERE id = ?").get(customerId) ||
    !findRound(roundId) ||
    !betType ||
    !isNumberValidForBetType(number, betType) ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return { ok: false, error: "invalid_entry_payload" };
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

function insertEntry(payload, userId) {
  const now = nowIso();
  const entry = {
    id: crypto.randomUUID(),
    ...payload,
    created_by: userId,
    created_at: now,
    updated_at: now,
  };
  db.prepare(`
    INSERT INTO entries (id, customer_id, round_id, bet_type_id, number, amount, note, source_text, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    entry.id,
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
    WHERE entries.round_id = ?
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
      INSERT OR IGNORE INTO customers (id, code, name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
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
    SELECT sessions.*, users.username, users.role, users.created_at AS user_created_at
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
