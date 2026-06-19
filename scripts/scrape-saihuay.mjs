import puppeteer from 'puppeteer-core';
const lotto = process.argv[2] || 'baac';
const URL = `https://saihuay.com/historical?lotto=${lotto}&lang=th`;
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
try {
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0');
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 25000 });
  await new Promise(r => setTimeout(r, 2000));
  const data = await page.evaluate(() => {
    // ดู structure: หา card ของ "งวดล่าสุด" / รางวัล
    const txt = document.body.innerText;
    // หาทุกเลข 6 หลัก + เลข 2 หลัก
    const nums = txt.match(/\b\d{6}\b/g) || [];
    const date = (txt.match(/\d{1,2}[\s\/]\d{1,2}[\s\/]\d{4}|\d{1,2}\s+\S+\s+\d{4}/g) || [])[0];
    return { nums: nums.slice(0, 20), date, sample: txt.slice(0, 500) };
  });
  console.log(JSON.stringify(data, null, 2));
} catch (e) {
  console.log("ERROR:", e.message);
} finally {
  await browser.close();
}
