/**
 * tests/integration.test.mjs
 * D.4: E2E pipeline integration test using fixture → parser → validate → DB insert.
 *
 * Uses node:sqlite (in-memory) to fully isolate from production DB.
 * Verifies the complete chain that produces a `results` row:
 *   fixture JSON → parser → semantic check → INSERT INTO results
 */
import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { DatabaseSync } from "node:sqlite";

import { parsers } from "../providers/scraper/parsers/index.mjs";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const FIX = path.join(__dirname, "fixtures");
const load = (n) => JSON.parse(fs.readFileSync(path.join(FIX, n + ".json"), "utf8"));

/**
 * Minimal in-memory schema mirror for `results` row.
 * (Real schema is larger; we test the contract subset Phase A/B/C cares about.)
 */
function makeDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE results (
      lottery_id   TEXT NOT NULL,
      draw_date    TEXT NOT NULL,
      three_top    TEXT NOT NULL,
      two_top      TEXT NOT NULL,
      two_bottom   TEXT,
      three_tod    TEXT,
      run_top      TEXT,
      source_id    TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (lottery_id, draw_date)
    );
  `);
  return db;
}

/** Semantic validator (mirrors Phase C.2 pre-finalize checks) */
function semanticValidate(r) {
  if (!r) return { ok: false, error: "no_result" };
  if (!/^\d{3}$/.test(r.three_top)) return { ok: false, error: "three_top_invalid" };
  if (!/^\d{2}$/.test(r.two_top)) return { ok: false, error: "two_top_invalid" };
  if (r.two_bottom != null && !/^\d{2}$/.test(String(r.two_bottom))) return { ok: false, error: "two_bottom_invalid" };
  /* Consistency: two_top must equal last 2 of three_top */
  if (r.two_top !== r.three_top.slice(-2)) return { ok: false, error: "two_top_mismatch_three_top" };
  /* Date well-formed */
  if (r.drawDate != null && !/^\d{4}-\d{2}-\d{2}$/.test(r.drawDate)) return { ok: false, error: "draw_date_invalid" };
  return { ok: true };
}

/** Pipeline: response → parser → validate → DB insert */
function runPipeline(db, { lottery_id, parserName, response, filter, source_id }) {
  const parser = parsers[parserName];
  if (!parser) throw new Error("unknown_parser:" + parserName);
  const parsed = parser(response, filter);
  if (!parsed.ok) return { stage: "parse", ok: false, error: parsed.error };
  const v = semanticValidate(parsed.result);
  if (!v.ok) return { stage: "validate", ok: false, error: v.error, result: parsed.result };
  const r = parsed.result;
  db.prepare(`
    INSERT INTO results (lottery_id, draw_date, three_top, two_top, two_bottom, three_tod, run_top, source_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    lottery_id, r.drawDate, r.three_top, r.two_top, r.two_bottom,
    r.three_tod, JSON.stringify(r.run_top || []), source_id,
  );
  return { stage: "insert", ok: true, result: r };
}

/* ============================================================== */

test("E2E pipeline: lao_standard fixture → DB row", () => {
  const db = makeDb();
  const fx = load("lao_standard_laotv");
  const out = runPipeline(db, {
    lottery_id: "lott_test_lao",
    parserName: "lao_standard",
    response: fx,
    source_id: "src_laotv",
  });
  assert.strictEqual(out.ok, true, "pipeline failed at " + out.stage + ": " + out.error);
  const row = db.prepare("SELECT * FROM results WHERE lottery_id = ?").get("lott_test_lao");
  assert.ok(row, "row inserted");
  assert.strictEqual(row.three_top, fx.data.results.digit3.padStart(3, "0"));
  assert.strictEqual(row.two_bottom, fx.data.results.digit2_bottom);
});

test("E2E pipeline: hanoi_prize fixture → DB row + two_bottom uses prize_2digits_1", () => {
  const db = makeDb();
  const fx = load("hanoi_prize_xosohd");
  const out = runPipeline(db, {
    lottery_id: "lott_test_hanoi",
    parserName: "hanoi_prize",
    response: fx,
    source_id: "src_xosohd",
  });
  assert.strictEqual(out.ok, true);
  const row = db.prepare("SELECT * FROM results WHERE lottery_id=?").get("lott_test_hanoi");
  assert.strictEqual(row.two_bottom, String(fx.data.results.prize_2digits_1).slice(-2));
});

test("E2E pipeline: dowjones_market_close drawDate shifted +1 day in DB", () => {
  const db = makeDb();
  const fx = load("dowjones_market_close");
  const out = runPipeline(db, {
    lottery_id: "lott_test_dj",
    parserName: "dowjones_market_close",
    response: fx,
    source_id: "src_dj",
  });
  assert.strictEqual(out.ok, true);
  const row = db.prepare("SELECT * FROM results WHERE lottery_id=?").get("lott_test_dj");
  const dt = new Date(fx.data.lotto_date + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + 1);
  assert.strictEqual(row.draw_date, dt.toISOString().slice(0, 10));
});

test("E2E pipeline: lottosuperrich filter='gb' inserts with two_bottom NULL", () => {
  const db = makeDb();
  const fx = load("lottosuperrich");
  const out = runPipeline(db, {
    lottery_id: "lott_test_lsr",
    parserName: "lottosuperrich",
    response: fx,
    filter: "gb",
    source_id: "src_lsr",
  });
  assert.strictEqual(out.ok, true);
  const row = db.prepare("SELECT * FROM results WHERE lottery_id=?").get("lott_test_lsr");
  assert.strictEqual(row.two_bottom, null, "vendor doesn't expose 2-bottom");
});

test("E2E pipeline: not_drawn_yet stops at parse stage (no DB row)", () => {
  const db = makeDb();
  const out = runPipeline(db, {
    lottery_id: "lott_test_skip",
    parserName: "lao_standard",
    response: { data: { lotto_date: "2026-06-24", results: { digit3: "xxx", digit2_top: "xx" } } },
    source_id: "src_x",
  });
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.stage, "parse");
  const count = db.prepare("SELECT COUNT(*) AS c FROM results").get();
  assert.strictEqual(count.c, 0, "no row should be inserted");
});

test("E2E pipeline: semantic validator catches tampered result", () => {
  const db = makeDb();
  /* Inject a faulty parser stub */
  const original = parsers.lao_standard;
  parsers.lao_standard = () => ({ ok: true, result: { drawDate: "2026-06-24", three_top: "12X", two_top: "12", two_bottom: null, three_tod: "12X", run_top: ["1","2"], raw: {} } });
  try {
    const out = runPipeline(db, {
      lottery_id: "lott_test_bad",
      parserName: "lao_standard",
      response: {},
      source_id: "src_bad",
    });
    assert.strictEqual(out.ok, false);
    assert.strictEqual(out.stage, "validate");
    assert.strictEqual(out.error, "three_top_invalid");
  } finally {
    parsers.lao_standard = original;
  }
});

test("E2E pipeline: PRIMARY KEY prevents duplicate (lottery,date) insert", () => {
  const db = makeDb();
  const fx = load("lao_standard_laotv");
  const r1 = runPipeline(db, { lottery_id: "lott_dup", parserName: "lao_standard", response: fx, source_id: "src1" });
  assert.strictEqual(r1.ok, true);
  assert.throws(
    () => runPipeline(db, { lottery_id: "lott_dup", parserName: "lao_standard", response: fx, source_id: "src2" }),
    /UNIQUE|PRIMARY/i,
    "second insert with same key must fail",
  );
});

test("E2E pipeline: dowjones_digit5 (digit5-only schema) → DB row", () => {
  const db = makeDb();
  const fx = load("dowjones_digit5");
  const out = runPipeline(db, {
    lottery_id: "lott_test_d5",
    parserName: "dowjones_digit5",
    response: fx,
    source_id: "src_d5",
  });
  assert.strictEqual(out.ok, true);
  const row = db.prepare("SELECT * FROM results WHERE lottery_id=?").get("lott_test_d5");
  const d5 = String(fx.data.results.digit5);
  assert.strictEqual(row.three_top, d5.slice(-3));
  assert.strictEqual(row.two_bottom, d5.slice(0, 2));
});
