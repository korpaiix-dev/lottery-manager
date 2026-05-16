import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(root, ".data", "e2e-smoke.sqlite");
const port = 3099;
const baseUrl = `http://127.0.0.1:${port}`;

fs.rmSync(dbPath, { force: true });

const server = spawn(process.execPath, ["server.js"], {
  cwd: root,
  env: { ...process.env, PORT: String(port), DB_PATH: dbPath },
  stdio: "ignore",
});

let cookie = "";

try {
  await waitForServer();

  await request("/api/setup", {
    method: "POST",
    body: { username: "qa-admin", password: "qa-password-123" },
    captureCookie: true,
    expectedStatus: 201,
  });

  const initialState = await request("/api/state");
  const thai = initialState.lotteries.find((lottery) => lottery.id === "thai") || initialState.lotteries[0];
  assert(thai, "missing lottery seed");

  const customer = await request("/api/customers", {
    method: "POST",
    body: { name: "ลูกค้า QA", headHouseId: "direct" },
    expectedStatus: 201,
  });

  const round = await request("/api/rounds", {
    method: "POST",
    body: {
      lotteryId: thai.id,
      label: "QA งวดทดสอบ",
      openDate: today(),
      openTime: "00:00",
      drawDate: tomorrow(),
      drawTime: "23:59",
      closeBeforeMinutes: 5,
      status: "open",
    },
    expectedStatus: 201,
  });

  const entries = await request("/api/entries/batch", {
    method: "POST",
    body: {
      sourceChannel: "manual",
      note: "QA ticket",
      entries: [
        {
          customerId: customer.id,
          roundId: round.id,
          betTypeId: "two_top",
          number: "45",
          amount: 100,
          note: "QA ticket",
        },
        {
          customerId: customer.id,
          roundId: round.id,
          betTypeId: "two_top",
          number: "67",
          amount: 50,
          note: "QA ticket",
        },
        {
          customerId: customer.id,
          roundId: round.id,
          betTypeId: "three_top",
          number: "123",
          amount: 25,
          note: "QA ticket",
        },
      ],
    },
    expectedStatus: 201,
  });
  assert(entries.length === 3, "batch entries not created");

  let state = await request("/api/state");
  const ticket = state.tickets.find((item) => item.round_id === round.id && item.customer_id === customer.id);
  assert(ticket?.status === "pending_review", "ticket should start pending review");

  let settlement = await request(`/api/settlements?roundId=${encodeURIComponent(round.id)}`);
  assert(settlement.totalStake === 0, "pending ticket must not affect settlement");

  await request(`/api/tickets/${ticket.id}/approve`, { method: "POST" });
  state = await request("/api/state");
  assert(state.tickets.find((item) => item.id === ticket.id)?.status === "approved", "ticket approval failed");

  await request(`/api/entries/${entries[0].id}`, {
    method: "PUT",
    body: {
      customerId: customer.id,
      roundId: round.id,
      betTypeId: "two_top",
      number: "45",
      amount: 200,
      note: "should fail",
    },
    expectedStatus: 409,
  });

  await request("/api/results", {
    method: "POST",
    body: { roundId: round.id, betTypeId: "two_top", numbers: "45" },
  });

  settlement = await request(`/api/settlements?roundId=${encodeURIComponent(round.id)}`);
  assert(settlement.totalStake === 175, "approved entries missing from settlement");
  assert(settlement.winnerCount === 1, "winning entry not detected");

  await request(`/api/results/${round.id}/finalize`, { method: "POST", expectedStatus: 409 });
  await request("/api/results", {
    method: "POST",
    body: { roundId: round.id, betTypeId: "three_top", numbers: "123" },
  });
  await request(`/api/results/${round.id}/finalize`, { method: "POST" });
  state = await request("/api/state");
  assert(state.rounds.find((item) => item.id === round.id)?.result_status === "finalized", "result finalize failed");

  await request("/api/results", {
    method: "POST",
    body: { roundId: round.id, betTypeId: "two_top", numbers: "67" },
    expectedStatus: 409,
  });

  const headHouseSummary = await request("/api/head-house-summary?headHouseId=direct");
  assert(headHouseSummary.totalStake >= 175, "head house summary missing approved stake");

  assert(
    state.auditLogs.some((log) => log.action === "approve" && log.entity_type === "ticket"),
    "approve audit log missing",
  );
  assert(
    state.auditLogs.some((log) => log.action === "finalize" && log.entity_type === "result"),
    "finalize audit log missing",
  );

  console.log("E2E smoke passed");
} finally {
  server.kill();
  await waitForExit(server);
  fs.rmSync(dbPath, { force: true });
}

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/bootstrap`);
      if (response.ok) return;
    } catch {
      await sleep(100);
    }
  }
  throw new Error("server did not start");
}

async function request(url, { method = "GET", body, captureCookie = false, expectedStatus = 200 } = {}) {
  const response = await fetch(`${baseUrl}${url}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (captureCookie) {
    cookie = response.headers.get("set-cookie")?.split(";")[0] || "";
  }

  if (response.status !== expectedStatus) {
    const text = await response.text();
    throw new Error(`${method} ${url} expected ${expectedStatus}, got ${response.status}: ${text}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(date);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForExit(child) {
  if (child.exitCode !== null) return Promise.resolve();
  return new Promise((resolve) => child.once("exit", resolve));
}
