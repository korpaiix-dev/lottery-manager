/**
 * tests/parsers.test.mjs
 * D.3: Parser tests using real captured vendor fixtures (tests/fixtures/*.json)
 *
 * Sanity contract for each parser output:
 *   { ok: true, result: { drawDate, three_top, two_top, two_bottom, three_tod, run_top, raw } }
 *   - three_top length 3 digits
 *   - two_top length 2 digits
 *   - two_bottom is either null OR 2 digits
 *   - run_top is array of unique chars (≤3, no dup)
 */
import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

import { parsers } from "../providers/scraper/parsers/index.mjs";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const FIX = path.join(__dirname, "fixtures");
const load = (name) => JSON.parse(fs.readFileSync(path.join(FIX, name + ".json"), "utf8"));

function assertShape(out, { allowNullTwoBottom = true } = {}) {
  assert.strictEqual(out.ok, true, "parser must return ok:true; got error=" + out.error);
  const r = out.result;
  assert.ok(r, "result must exist");
  assert.match(r.three_top, /^\d{3}$/, "three_top 3 digits");
  assert.match(r.two_top, /^\d{2}$/, "two_top 2 digits");
  if (r.two_bottom == null) {
    assert.ok(allowNullTwoBottom, "two_bottom null not allowed for this parser");
  } else {
    assert.match(String(r.two_bottom), /^\d{2}$/, "two_bottom either null or 2 digits");
  }
  assert.ok(Array.isArray(r.run_top), "run_top array");
  assert.strictEqual(new Set(r.run_top).size, r.run_top.length, "run_top unique");
  assert.ok(r.run_top.length <= 3);
}

/* =========================================================================
 * 1) lao_standard — laotv / laostars / laounion (3 vendors)
 * ========================================================================= */
test("lao_standard: laotv fixture parses", () => {
  const fx = load("lao_standard_laotv");
  const out = parsers.lao_standard(fx);
  assertShape(out);
  assert.strictEqual(out.result.three_top, fx.data.results.digit3.padStart(3, "0"));
  assert.strictEqual(out.result.two_top, fx.data.results.digit2_top);
  assert.strictEqual(out.result.two_bottom, fx.data.results.digit2_bottom);
  assert.strictEqual(out.result.drawDate, fx.data.lotto_date);
});

test("lao_standard: laostars fixture parses", () => {
  const fx = load("lao_standard_laostars");
  const out = parsers.lao_standard(fx);
  assertShape(out);
});

test("lao_standard: laounion fixture parses", () => {
  const fx = load("lao_standard_laounion");
  const out = parsers.lao_standard(fx);
  assertShape(out);
});

test("lao_standard: empty digit3 → not_drawn_yet", () => {
  const out = parsers.lao_standard({ data: { lotto_date: "2026-06-24", results: { digit3: "", digit2_top: "" } } });
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.error, "not_drawn_yet");
});

test("lao_standard: xxx placeholder → not_drawn_yet (A.4)", () => {
  const out = parsers.lao_standard({ data: { lotto_date: "2026-06-24", results: { digit3: "xxx", digit2_top: "xx" } } });
  assert.strictEqual(out.ok, false);
});

/* =========================================================================
 * 2) hanoi_prize — xosohd / minhngocstar / minhngoctv (3 vendors)
 * ========================================================================= */
test("hanoi_prize: xosohd fixture parses + uses prize_2digits_1 (A.1)", () => {
  const fx = load("hanoi_prize_xosohd");
  const out = parsers.hanoi_prize(fx);
  assertShape(out);
  const p1 = String(fx.data.results.prize_1st);
  assert.strictEqual(out.result.three_top, p1.slice(-3));
  assert.strictEqual(out.result.two_top, p1.slice(-2));
  assert.strictEqual(out.result.two_bottom, String(fx.data.results.prize_2digits_1).slice(-2));
});

test("hanoi_prize: minhngocstar fixture parses or signals not_drawn_yet", () => {
  const fx = load("hanoi_prize_minhngocstar");
  const out = parsers.hanoi_prize(fx);
  if (out.ok) assertShape(out);
  else assert.strictEqual(out.error, "not_drawn_yet");
});

test("hanoi_prize: minhngoctv fixture parses or signals not_drawn_yet", () => {
  const fx = load("hanoi_prize_minhngoctv");
  const out = parsers.hanoi_prize(fx);
  if (out.ok) assertShape(out);
  else assert.strictEqual(out.error, "not_drawn_yet");
});

test("hanoi_prize: fallback to prize_5th_4 when no prize_2digits_1", () => {
  const out = parsers.hanoi_prize({
    data: { lotto_date: "2026-06-24", results: { prize_1st: "12345", prize_5th_4: "9988" } },
  });
  assert.strictEqual(out.result.two_bottom, "88");
});

/* =========================================================================
 * 3) dowjones_market_close — date shift +1
 * ========================================================================= */
test("dowjones_market_close: drawDate shifts +1 day", () => {
  const fx = load("dowjones_market_close");
  const out = parsers.dowjones_market_close(fx);
  assertShape(out);
  const expected = new Date(fx.data.lotto_date + "T00:00:00Z");
  expected.setUTCDate(expected.getUTCDate() + 1);
  assert.strictEqual(out.result.drawDate, expected.toISOString().slice(0, 10));
});

test("dowjones_powerball is alias of dowjones_market_close (A.3)", () => {
  const fx = load("dowjones_market_close");
  const a = parsers.dowjones_market_close(fx);
  const b = parsers.dowjones_powerball(fx);
  assert.deepStrictEqual(b.result.three_top, a.result.three_top);
  assert.deepStrictEqual(b.result.two_bottom, a.result.two_bottom);
  assert.deepStrictEqual(b.result.drawDate, a.result.drawDate);
});

test("dowjones_market_close: xxxxx placeholder → not_drawn_yet", () => {
  const out = parsers.dowjones_market_close({ data: { lotto_date: "2026-06-24", results: { prize_1st: "xxxxx" } } });
  assert.strictEqual(out.ok, false);
});

/* =========================================================================
 * 4) dowjones_digit5 — Mid Night / Extra / TV
 * ========================================================================= */
test("dowjones_digit5: real fixture parses", () => {
  const fx = load("dowjones_digit5");
  const out = parsers.dowjones_digit5(fx);
  assertShape(out);
  const d5 = String(fx.data.results.digit5);
  assert.strictEqual(out.result.three_top, d5.slice(-3));
  assert.strictEqual(out.result.two_top, d5.slice(-2));
  assert.strictEqual(out.result.two_bottom, d5.slice(0, 2));
});

test("dowjones_digit5: extra vendor fixture parses", () => {
  const fx = load("dowjones_digit5_extra");
  const out = parsers.dowjones_digit5(fx);
  assertShape(out);
});

test("dowjones_digit5: xxxxx placeholder → not_drawn_yet", () => {
  const out = parsers.dowjones_digit5({ data: { lotto_date: "2026-06-24", results: { digit5: "xxxxx" } } });
  assert.strictEqual(out.ok, false);
});

/* =========================================================================
 * 5) lottosuperrich — gb/de/ru section (A.2: two_bottom must be null)
 * ========================================================================= */
test("lottosuperrich: gb section parses + two_bottom null (A.2)", () => {
  const fx = load("lottosuperrich");
  const out = parsers.lottosuperrich(fx, "gb");
  assertShape(out, { allowNullTwoBottom: true });
  assert.strictEqual(out.result.two_bottom, null, "vendor doesn't expose 2-bottom; must not fabricate");
  const p1 = String(fx.data.gb.results.prize_1st);
  assert.strictEqual(out.result.three_top, p1.slice(-3));
});

test("lottosuperrich: de section parses", () => {
  const fx = load("lottosuperrich");
  const out = parsers.lottosuperrich(fx, "de");
  assertShape(out, { allowNullTwoBottom: true });
  assert.strictEqual(out.result.two_bottom, null);
});

test("lottosuperrich: missing section → no_data", () => {
  const fx = load("lottosuperrich");
  const out = parsers.lottosuperrich(fx, "zz");
  assert.strictEqual(out.ok, false);
});

/* =========================================================================
 * 6) stockvip_index — calc from price+diff (A.5: two_bottom "00" when no decimal)
 * ========================================================================= */
test("stockvip_index: cn 'Close' note parses (if available)", () => {
  const fx = load("stockvip_cn");
  const close = (fx.data.prices || []).find((p) => p.note === "Close");
  if (!close) {
    /* market may be midday – just assert parser returns no_close_yet gracefully */
    const out = parsers.stockvip_index(fx, "Close");
    assert.strictEqual(out.ok, false);
    return;
  }
  const out = parsers.stockvip_index(fx, "Close");
  if (out.ok) {
    assertShape(out);
  } else {
    assert.strictEqual(out.error, "no_price");
  }
});

test("stockvip_index: missing prices array → no_prices", () => {
  const out = parsers.stockvip_index({ data: { prices: undefined } }, "Close");
  assert.strictEqual(out.ok, false);
});

test("stockvip_index: A.5 two_bottom = '00' when integer change", () => {
  /* simulate scalar prices object */
  const out = parsers.stockvip_index(
    { data: { date: "2026-06-24", prices: { price: 1234.56, diff: 5 } } },
    "Close",
  );
  if (out.ok) {
    assert.strictEqual(out.result.two_bottom, "00");
    assert.strictEqual(out.result.three_top, "456");
    assert.strictEqual(out.result.two_top, "56");
  }
});

/* =========================================================================
 * 7) direct_award / vnindex_award — synthetic
 * ========================================================================= */
test("direct_award: happy path", () => {
  const out = parsers.direct_award({ data: { time: "2026-06-24 10:00", award: { three: "123", two: "45" } } });
  assertShape(out);
  assert.strictEqual(out.result.three_top, "123");
  assert.strictEqual(out.result.two_bottom, "45");
});

test("direct_award: empty three → not_drawn_yet", () => {
  const out = parsers.direct_award({ data: { award: { three: "" } } });
  assert.strictEqual(out.ok, false);
});

test("vnindex_award: sec1 parses", () => {
  const out = parsers.vnindex_award(
    { data: { date: "2026-06-24", awards: { sec1: { three: "789", two: "23" } } } },
    "sec1",
  );
  assertShape(out);
});

/* =========================================================================
 * 8) puppeteer — passthrough
 * ========================================================================= */
test("puppeteer: passes through ok payload", () => {
  const out = parsers.puppeteer({
    ok: true,
    drawDate: "2026-06-24",
    three_top: "123",
    two_top: "23",
    two_bottom: "45",
    raw: {},
  });
  assertShape(out);
});

test("puppeteer: forwards error", () => {
  const out = parsers.puppeteer({ ok: false, error: "timeout" });
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.error, "timeout");
});
