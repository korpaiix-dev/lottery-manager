/**
 * providers/scraper/parsers/index.mjs
 * Parser registry — all scraper parsers in one place.
 * Each parser takes response (JSON or any) and returns:
 *   { ok: true, result: { drawDate, three_top, two_top, two_bottom, three_tod, run_top, raw } }
 *   { ok: false, error: "reason" }
 */

/** Helper: calculate stock lotto number from price + change (หวยหุ้นมาตรฐาน) */
function calcStockNumber(date, price, change, raw) {
  if (price == null) return { ok: false, error: "no_price" };
  const priceStr = String(price);
  const [intPart, decPart = "00"] = priceStr.split(".");
  const unitDigit = intPart.slice(-1);
  const decTwo = (decPart + "00").slice(0, 2);
  const three_top = unitDigit + decTwo;
  const two_top = decTwo;
  let two_bottom = null;
  if (change != null) {
    const ch = Math.abs(parseFloat(change));
    if (Number.isFinite(ch)) {
      const chgStr = String(ch).split(".");
      if (chgStr.length > 1) two_bottom = (chgStr[1] + "00").slice(0, 2);
    }
  }
  return {
    ok: true,
    result: {
      drawDate: date, three_top, two_top, two_bottom,
      three_tod: three_top,
      run_top: [...new Set(three_top.split(""))],
      raw: { price, change, ...raw },
    },
  };
}

export const parsers = {
  /** Lao standard: api.{site}.com/result with digit3/digit2_bottom */
  lao_standard(resp) {
    const d = resp?.data;
    if (!d || !d.results) return { ok: false, error: "no_data" };
    const r = d.results;
    if (r.digit3 == null || r.digit3 === "" || r.digit3 === "xxx") return { ok: false, error: "not_drawn_yet" };
    const three_top = String(r.digit3).padStart(3, "0");
    return {
      ok: true,
      result: {
        drawDate: d.lotto_date,
        three_top,
        two_top: r.digit2_top != null ? String(r.digit2_top).padStart(2, "0") : three_top.slice(-2),
        two_bottom: r.digit2_bottom != null ? String(r.digit2_bottom).padStart(2, "0") : null,
        three_tod: three_top,
        run_top: [...new Set(three_top.split(""))],
        raw: d,
      },
    };
  },

  /** Hanoi prize: prize_1st 5 digit (XOSO family + dowjones Star) */
  hanoi_prize(resp) {
    const d = resp?.data;
    if (!d || !d.results) return { ok: false, error: "no_data" };
    const r = d.results;
    const p1 = r.prize_1st || r.prize_2nd || r.prize_3rd_1 || r.special_1;
    if (!p1) return { ok: false, error: "not_drawn_yet" };
    const three_top = String(p1).slice(-3);
    const two_src = r.prize_5th_4 || r.prize_5th_1 || r.prize_6th_3 || r.consolation_1;
    return {
      ok: true,
      result: {
        drawDate: d.lotto_date,
        first: String(p1),
        three_top,
        two_top: String(p1).slice(-2),
        two_bottom: two_src ? String(two_src).slice(-2) : null,
        three_tod: three_top,
        run_top: [...new Set(three_top.split(""))],
        raw: d,
      },
    };
  },

  /** Dowjones digit5: Mid Night/Extra/TV */
  dowjones_digit5(resp) {
    const d = resp?.data;
    if (!d || !d.results) return { ok: false, error: "no_data" };
    const digit5 = d.results.digit5;
    if (!digit5 || digit5 === "xxxxx") return { ok: false, error: "not_drawn_yet" };
    const three_top = String(digit5).slice(-3);
    return {
      ok: true,
      result: {
        drawDate: d.lotto_date,
        first: String(digit5),
        three_top,
        two_top: String(digit5).slice(-2),
        two_bottom: String(digit5).slice(0, 2),
        three_tod: three_top,
        run_top: [...new Set(three_top.split(""))],
        raw: d,
      },
    };
  },

/** Dow Jones Market Close — เหมือน powerball แต่ shift drawDate +1 day
   *  (vendor บันทึก lotto_date = market close date, ระบบเรา round = วันถัดมา 01:30 ICT) */
  dowjones_market_close(resp) {
    const d = resp?.data;
    if (!d || !d.results) return { ok: false, error: "no_data" };
    const r = d.results;
    if (!r.prize_1st || r.prize_1st === "xxxxx" || !String(r.prize_1st).trim()) {
      return { ok: false, error: "not_drawn_yet" };
    }
    const p1 = String(r.prize_1st);
    const three_top = p1.slice(-3);
    const cons = String(r.consolation_1 || "");
    /* shift drawDate +1 day */
    let drawDate = d.lotto_date;
    if (drawDate && /^\d{4}-\d{2}-\d{2}$/.test(drawDate)) {
      const dt = new Date(drawDate + "T00:00:00Z");
      dt.setUTCDate(dt.getUTCDate() + 1);
      drawDate = dt.toISOString().slice(0, 10);
    }
    return {
      ok: true,
      result: {
        drawDate, first: p1, three_top,
        two_top: p1.slice(-2),
        two_bottom: cons ? cons.padStart(2, "0").slice(-2) : null,
        three_tod: three_top,
        run_top: [...new Set(three_top.split(""))],
        raw: d,
      },
    };
  },

  /** Dow Jones Powerball */
  dowjones_powerball(resp) {
    const d = resp?.data;
    if (!d || !d.results) return { ok: false, error: "no_data" };
    const r = d.results;
    if (!r.prize_1st || r.prize_1st === "xxxxx") return { ok: false, error: "not_drawn_yet" };
    const p1 = String(r.prize_1st);
    const three_top = p1.slice(-3);
    const p2 = String(r.prize_2nd || r.consolation_1 || "");
    return {
      ok: true,
      result: {
        drawDate: d.lotto_date,
        first: p1, three_top,
        two_top: p1.slice(-2),
        two_bottom: p2 ? p2.slice(-2) : null,
        three_tod: three_top,
        run_top: [...new Set(three_top.split(""))],
        raw: d,
      },
    };
  },

  /** Lotto Super Rich: gcp.lottosuperrich.com — gb/de/ru sections */
  lottosuperrich(resp, filterName) {
    const dataSet = resp?.data?.[filterName];
    if (!dataSet || !dataSet.results) return { ok: false, error: "no_data" };
    const r = dataSet.results;
    if (r.prize_1st == null) return { ok: false, error: "not_drawn_yet" };
    const p1 = String(r.prize_1st);
    const three_top = p1.slice(-3);
    const p2 = String(r.prize_2nd || "");
    return {
      ok: true,
      result: {
        drawDate: dataSet.lotto_date,
        first: p1, three_top,
        two_top: p1.slice(-2),
        two_bottom: p2 ? p2.slice(-2) : null,
        three_tod: three_top,
        run_top: [...new Set(three_top.split(""))],
        raw: dataSet,
      },
    };
  },

  /** Stock VIP: api.stocks-vip.com — calc from Close + Change */
  stockvip_index(resp, filterName) {
    const d = resp?.data;
    if (!d) return { ok: false, error: "no_data" };
    const prices = d.prices;
    if (!Array.isArray(prices)) {
      if (prices && prices.price != null) {
        return calcStockNumber(d.date, prices.price, prices.diff, prices);
      }
      return { ok: false, error: "no_prices" };
    }
    const item = prices.find(p => p.note === (filterName || "Close"));
    if (!item) return { ok: false, error: "no_close_yet" };
    return calcStockNumber(d.date, item.price, item.diff, item);
  },

  /** Direct award: api.lsxvip.com/price — has data.award.three */
  direct_award(resp) {
    const d = resp?.data;
    if (!d || !d.award) return { ok: false, error: "no_data" };
    const a = d.award;
    if (a.three == null || a.three === "") return { ok: false, error: "not_drawn_yet" };
    const three_top = String(a.three).padStart(3, "0");
    return {
      ok: true,
      result: {
        drawDate: d.time ? String(d.time).slice(0, 10) : null,
        three_top,
        two_top: three_top.slice(-2),
        two_bottom: a.two != null ? String(a.two).padStart(2, "0") : null,
        three_tod: three_top,
        run_top: [...new Set(three_top.split(""))],
        raw: d,
      },
    };
  },

  /** Vietnam Index VIP — 3 sections (sec1/sec2/sec3) */
  vnindex_award(resp, filterName) {
    const d = resp?.data;
    if (!d || !d.awards) return { ok: false, error: "no_data" };
    const sec = d.awards[filterName || "sec3"];
    if (!sec || sec.three == null) return { ok: false, error: "not_drawn_yet" };
    const three_top = String(sec.three).padStart(3, "0");
    return {
      ok: true,
      result: {
        drawDate: d.date,
        three_top,
        two_top: three_top.slice(-2),
        two_bottom: sec.two != null ? String(sec.two).padStart(2, "0") : null,
        three_tod: three_top,
        run_top: [...new Set(three_top.split(""))],
        raw: sec,
      },
    };
  },

  /** Puppeteer result (pre-parsed from child process) */
  puppeteer(resp) {
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
  },
};

/** Lookup parser by name. Returns null if unknown. */
export function getParser(name) {
  return parsers[name] || null;
}

/** List of all parser names */
export const parserNames = Object.keys(parsers);
