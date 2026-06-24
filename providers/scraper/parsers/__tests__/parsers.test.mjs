import assert from "node:assert";
import { test } from "node:test";
import { parsers } from "../index.mjs";

// A.1: hanoi_prize prefers prize_2digits_1
test("A.1 hanoi_prize uses prize_2digits_1 for two_bottom", () => {
  const r = parsers.hanoi_prize({
    data: { lotto_date: "2026-06-24",
      results: { prize_1st: "44830", prize_2digits_1: "31", prize_5th_4: "9888" } }
  });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.result.three_top, "830");
  assert.strictEqual(r.result.two_top, "30");
  assert.strictEqual(r.result.two_bottom, "31");
});

test("A.1 hanoi_prize fallback to prize_5th_4 when no prize_2digits_1", () => {
  const r = parsers.hanoi_prize({
    data: { lotto_date: "2026-06-24",
      results: { prize_1st: "12345", prize_5th_4: "9988" } }
  });
  assert.strictEqual(r.result.two_bottom, "88");
});

test("A.1 hanoi_prize two_bottom null when neither field present", () => {
  const r = parsers.hanoi_prize({
    data: { lotto_date: "2026-06-24", results: { prize_1st: "12345" } }
  });
  assert.strictEqual(r.result.two_bottom, null);
});

test("A.1 hanoi_prize not_drawn_yet when no prize_1st/2nd/3rd_1/special_1", () => {
  const r = parsers.hanoi_prize({ data: { lotto_date: "2026-06-24", results: {} } });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.error, "not_drawn_yet");
});

// A.2: lottosuperrich two_bottom = null
test("A.2 lottosuperrich two_bottom always null", () => {
  const r = parsers.lottosuperrich({
    data: { gb: { lotto_date: "2026-06-24", results: { prize_1st: "55738", prize_2nd: "99812" } } }
  }, "gb");
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.result.three_top, "738");
  assert.strictEqual(r.result.two_top, "38");
  assert.strictEqual(r.result.two_bottom, null, "must not fabricate from prize_2nd");
});

// A.3: dowjones_powerball alias dowjones_market_close (drawDate shift +1)
test("A.3 dowjones_powerball aliased to dowjones_market_close (date +1)", () => {
  const r = parsers.dowjones_powerball({
    data: { lotto_date: "2026-06-23", results: { prize_1st: "12345", consolation_1: "77" } }
  });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.result.drawDate, "2026-06-24", "must shift +1 day");
  assert.strictEqual(r.result.three_top, "345");
  assert.strictEqual(r.result.two_bottom, "77");
});

// A.4: lao_standard strict empty
test("A.4 lao_standard rejects digit2_top === xx", () => {
  const r = parsers.lao_standard({
    data: { lotto_date: "2026-06-24", results: { digit3: "123", digit2_top: "xx" } }
  });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.error, "not_drawn_yet");
});

test("A.4 lao_standard rejects digit3 === xxx", () => {
  const r = parsers.lao_standard({
    data: { lotto_date: "2026-06-24", results: { digit3: "xxx", digit2_top: "45" } }
  });
  assert.strictEqual(r.ok, false);
});

test("A.4 lao_standard accepts valid result", () => {
  const r = parsers.lao_standard({
    data: { lotto_date: "2026-06-24",
      results: { digit3: "123", digit2_top: "23", digit2_bottom: "45" } }
  });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.result.two_bottom, "45");
});

// A.5: calcStockNumber integer change → two_bottom = "00"
test("A.5 stockvip integer change → two_bottom = 00", () => {
  const r = parsers.stockvip_index({
    data: { date: "2026-06-24", prices: [{ note: "Close", price: "3456.78", diff: "5" }] }
  }, "Close");
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.result.two_bottom, "00", "integer change must yield 00");
});

test("A.5 stockvip decimal change preserved", () => {
  const r = parsers.stockvip_index({
    data: { date: "2026-06-24", prices: [{ note: "Close", price: "3456.78", diff: "5.42" }] }
  }, "Close");
  assert.strictEqual(r.result.two_bottom, "42");
});

test("A.5 stockvip three_top from unit+decimal", () => {
  const r = parsers.stockvip_index({
    data: { date: "2026-06-24", prices: [{ note: "Close", price: "3456.78", diff: "5.42" }] }
  }, "Close");
  assert.strictEqual(r.result.three_top, "678");
  assert.strictEqual(r.result.two_top, "78");
});
