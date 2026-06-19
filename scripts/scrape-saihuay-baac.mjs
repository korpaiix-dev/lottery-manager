#!/usr/bin/env node
/* SCRAPE-SAIHUAY-BAAC: scrape ผลหวย ธ.ก.ส. จาก saihuay.com
   ใช้ Puppeteer render → extract เลขจาก body text
*/
import puppeteer from 'puppeteer-core';

const URL = 'https://saihuay.com/historical?lotto=baac&lang=th';

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

try {
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/149.0');
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 25000 });
  await new Promise(r => setTimeout(r, 2000));

  const data = await page.evaluate(() => {
    const txt = document.body.innerText;
    /* parse: หา section "งวดวันที่ XX YYY ZZZZ" + "3 ตัวบน NNN" + "2 ตัวล่าง NN" */
    const m1 = txt.match(/งวดวันที่\s+(\d{1,2}\s+\S+\s+\d{4})/);
    /* tolerant: [\s\S]*? = match across newlines */
    const m2 = txt.match(/3\s*ตัวบน[\s\S]*?(\d{3})/);
    const m3 = txt.match(/2\s*ตัวล่าง[\s\S]*?(\d{2})/);
    const m4 = txt.match(/รางวัลที่[\s\S]*?1[\s\S]*?(\d{6,8})/);
    return {
      date: m1?.[1],
      three_top: m2?.[1],
      two_bottom: m3?.[1],
      first: m4?.[1],
    };
  });

  process.stderr.write("DEBUG data=" + JSON.stringify(data) + "\n");
  if (!data.three_top) throw new Error("not_drawn_yet");

  /* parse date - "16 มิ.ย. 2569" → ISO */
  const THAI_MONTH = { 'ม.ค.':1,'ก.พ.':2,'มี.ค.':3,'เม.ย.':4,'พ.ค.':5,'มิ.ย.':6,'ก.ค.':7,'ส.ค.':8,'ก.ย.':9,'ต.ค.':10,'พ.ย.':11,'ธ.ค.':12 };
  let drawDate = null;
  if (data.date) {
    const dm = data.date.match(/(\d+)\s+(\S+)\s+(\d+)/);
    if (dm) {
      const day = dm[1].padStart(2, '0');
      const mon = String(THAI_MONTH[dm[2]] || 1).padStart(2, '0');
      const yr = parseInt(dm[3]) - 543; /* พ.ศ. → ค.ศ. */
      drawDate = `${yr}-${mon}-${day}`;
    }
  }

  console.log(JSON.stringify({
    ok: true,
    drawDate,
    first: data.first,
    three_top: data.three_top,
    two_top: data.three_top.slice(-2),
    two_bottom: data.two_bottom,
    three_tod: data.three_top,
    run_top: [...new Set(data.three_top.split(''))],
    raw: data,
  }));
} catch (e) {
  console.log(JSON.stringify({ ok: false, error: e.message }));
  process.exitCode = 1;
} finally {
  await browser.close();
}
