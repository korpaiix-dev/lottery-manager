const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3001";
const username = process.env.ADMIN_USERNAME || "";
const password = process.env.ADMIN_PASSWORD || "";

if (!username || !password) {
  throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD are required");
}

let cookie = "";

await request("/api/login", {
  method: "POST",
  body: { username, password },
  captureCookie: true,
});

const state = await request("/api/state");
const rates = [
  ["two_top", 70],
  ["two_bottom", 70],
  ["three_top", 600],
  ["three_tod", 120],
];

for (const lottery of state.lotteries) {
  for (const [betTypeId, rate] of rates) {
    await request("/api/payout-rates", {
      method: "POST",
      body: { lotteryId: lottery.id, betTypeId, rate },
    });
  }
}

console.log(`Updated payout rates for ${state.lotteries.length} lotteries`);

async function request(url, { method = "GET", body, captureCookie = false } = {}) {
  const response = await fetch(`${baseUrl}${url}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (captureCookie) cookie = response.headers.get("set-cookie")?.split(";")[0] || "";
  if (!response.ok) throw new Error(`${method} ${url} failed: ${response.status} ${await response.text()}`);
  if (response.status === 204) return null;
  return response.json();
}
