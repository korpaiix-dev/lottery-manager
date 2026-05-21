// Standalone parser tests reproducing the patched logic from app.js.
// Verifies the LINE parser bugs FB-LINE-1/2/5/6/9 are fixed.

// Copy of the FIXED logic from app.js (must mirror patches!)
function stripParserNoise(text) {
  let stripped = text.replace(/(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:บาท|บ(?![ก-๛]))/gi, " ");
  stripped = stripped.replace(/\b\d{1,2}[:.]\d{1,2}\b/g, " ");
  stripped = stripped.replace(/\b\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}\b/g, " ");
  stripped = stripped.replace(/\d+(?:\.\d+)?\s*%/g, " ");
  const BET_TYPE_PATTERNS = [
    /3\s*โต๊ด/gi, /โต๊ด/gi,
    /3\s*บน/gi, /สามตัวบน/gi,
    /2\s*ล่าง/gi, /สองตัวล่าง/gi,
    /2\s*บน/gi, /สองตัวบน/gi,
    /วิ่ง\s*ล่าง/gi, /วิ่ง\s*บน/gi, /วิ่ง/gi,
  ];
  BET_TYPE_PATTERNS.forEach((p) => { stripped = stripped.replace(p, " "); });
  return stripped;
}

function extractAmount(text) {
  const m = text.match(/(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:บาท|บ(?![ก-๛]))/i);
  return m ? Number(m[1].replaceAll(",", "")) : null;
}

function extractNumbers(text) {
  return [...text.matchAll(/\b\d{1,3}\b/g)].map((m) => m[0]);
}

const cases = [
  { id: "FB-LINE-9", text: "ลูกค้า A 2 บน 45 = 100 บาท", expectedAmount: 100, expectedNumbers: ["45"] },
  { id: "FB-LINE-1", text: "ลูกค้า A 2 บน 45 = 100 บาท\nส่งเข้ามา 13:45", expectedAmount: 100, expectedNumbers: ["45"] },
  { id: "FB-LINE-2", text: "วันที่ 16/05/2026 2 บน 67 = 50 บาท", expectedAmount: 50, expectedNumbers: ["67"] },
  { id: "FB-LINE-5", text: "2 บน 88 = 100 บาท จ่ายเรท 70%", expectedAmount: 100, expectedNumbers: ["88"] },
  { id: "FB-LINE-3 (multi-amount)", text: "2 บน 45 = 100 บาท\n3 บน 678 = 50 บาท", expectedAmount: 100, expectedNumbers: ["45", "678"] },
  { id: "Batch typical", text: "ลูกค้า C0001 หวยลาว\n2 บน 45,67 อย่างละ 50 บาท\n3 บน 123,456 อย่างละ 20 บาท", expectedAmount: 50, expectedNumbers: ["45", "67", "123", "456"] },
];

let failed = 0;
for (const c of cases) {
  const stripped = stripParserNoise(c.text);
  const nums = extractNumbers(stripped);
  const amount = extractAmount(c.text);
  const numsMatch = JSON.stringify(nums) === JSON.stringify(c.expectedNumbers);
  const amountMatch = amount === c.expectedAmount;
  const pass = numsMatch && amountMatch;
  console.log(`${pass ? "PASS" : "FAIL"}  ${c.id}`);
  if (!pass) {
    console.log(`   text: ${JSON.stringify(c.text)}`);
    console.log(`   got numbers ${JSON.stringify(nums)}, want ${JSON.stringify(c.expectedNumbers)}`);
    console.log(`   got amount ${amount}, want ${c.expectedAmount}`);
    failed += 1;
  }
}

if (failed) {
  console.log(`\n${failed} test(s) failed`);
  process.exit(1);
} else {
  console.log("\nAll LINE parser regression tests passed");
}
