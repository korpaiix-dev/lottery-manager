#!/usr/bin/env node
/* SCRAPE-EGX-INVESTING: scrape ดัชนี EGX 30 จาก investing.com
   Output: JSON to stdout
*/
import puppeteer from 'puppeteer-core';

const URL = process.argv[2] || 'https://th.investing.com/indices/egx30';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0 Safari/537.36';

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

try {
  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 3500));

  const data = await page.evaluate(() => {
    const cleanNum = (s) => String(s || '').replace(/[,()% +]/g, '').trim();
    const lastPrice = document.querySelector('[data-test="instrument-price-last"]')?.innerText;
    const change = document.querySelector('[data-test="instrument-price-change"]')?.innerText;
    const percent = document.querySelector('[data-test="instrument-price-change-percent"]')?.innerText;
    return {
      lastPrice: cleanNum(lastPrice),
      change: cleanNum(change).replace(/^\+/, ''),
      percent: cleanNum(percent),
    };
  });

  const lp = parseFloat(data.lastPrice);
  const ch = parseFloat(data.change);
  if (!Number.isFinite(lp) || Number.isNaN(lp)) throw new Error("no_price");

  /* สูตรหวยหุ้น: 3 บน = หลักหน่วย(integer) + ทศนิยม 2 หลัก, 2 ล่าง = ทศนิยมของ Change */
  const [intP, decP = "00"] = String(lp).split(".");
  const three_top = intP.slice(-1) + (decP + "00").slice(0, 2);
  const two_top = (decP + "00").slice(0, 2);
  let two_bottom = null;
  if (Number.isFinite(ch)) {
    const [_, dec = "00"] = String(Math.abs(ch)).split(".");
    two_bottom = (dec + "00").slice(0, 2);
  }

  console.log(JSON.stringify({
    ok: true,
    drawDate: new Date().toISOString().slice(0, 10),
    three_top, two_top, two_bottom,
    three_tod: three_top,
    run_top: [...new Set(three_top.split(""))],
    raw: { lastPrice: lp, change: ch, percent: data.percent },
  }));
} catch (e) {
  console.log(JSON.stringify({ ok: false, error: e.message }));
  process.exitCode = 1;
} finally {
  await browser.close();
}
