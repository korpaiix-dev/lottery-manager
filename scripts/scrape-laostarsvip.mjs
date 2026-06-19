#!/usr/bin/env node
/* SCRAPE-LAOSTARSVIP: bypass fingerprint protection ด้วย Chrome จริง
   - navigate → JS รัน fingerprint → server set tr_uuid → redirect ไป endpoint จริง
   - capture network response ของ /result endpoint
*/
import puppeteer from 'puppeteer-core';

const URL = process.argv[2] || 'https://api.laostarsvip.com/result';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0 Safari/537.36';

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

try {
  const page = await browser.newPage();
  await page.setUserAgent(UA);

  /* intercept network — เก็บ JSON response */
  let resultJson = null;
  page.on('response', async (resp) => {
    const url = resp.url();
    if (url.includes('/result') && url.includes('fp=')) {
      try {
        const ct = resp.headers()['content-type'] || '';
        if (ct.includes('json')) resultJson = await resp.json();
      } catch (e) { /* ignore */ }
    }
  });

  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 1500));

  /* ถ้า intercept ไม่ได้ ลอง read page body */
  if (!resultJson) {
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    if (bodyText.trim().startsWith('{')) {
      try { resultJson = JSON.parse(bodyText); } catch (e) {}
    }
  }

  if (!resultJson) throw new Error("no_json_captured");

  /* normalize เหมือน lao_standard */
  const d = resultJson?.data;
  if (!d || !d.results) throw new Error("no_data");
  const r = d.results;
  if (!r.digit3 || r.digit3 === 'xxx') throw new Error("not_drawn_yet");

  const three_top = String(r.digit3).padStart(3, '0');
  console.log(JSON.stringify({
    ok: true,
    drawDate: d.lotto_date,
    three_top,
    two_top: r.digit2_top ? String(r.digit2_top).padStart(2,'0') : three_top.slice(-2),
    two_bottom: r.digit2_bottom ? String(r.digit2_bottom).padStart(2,'0') : null,
    three_tod: three_top,
    run_top: [...new Set(three_top.split(''))],
    raw: d,
  }));
} catch (e) {
  console.log(JSON.stringify({ ok: false, error: e.message }));
  process.exitCode = 1;
} finally {
  await browser.close();
}
