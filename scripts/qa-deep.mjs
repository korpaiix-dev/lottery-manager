import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(root, ".data", "qa-deep-run.sqlite");
const port = 3107;
const baseUrl = `http://127.0.0.1:${port}`;

fs.rmSync(dbPath, { force: true });

const server = spawn(process.execPath, ["server.js"], {
  cwd: root,
  env: { ...process.env, PORT: String(port), DB_PATH: dbPath },
  stdio: "ignore",
});

let adminCookie = "";
let operatorCookie = "";
let viewerCookie = "";

try {
  await waitForServer();

  await request("/api/setup", {
    method: "POST",
    body: { username: "qa-admin", password: "qa-password-123" },
    capture: "admin",
    expectedStatus: 201,
  });

  let state = await request("/api/state", { cookie: "admin" });
  const thai = state.lotteries.find((lottery) => lottery.id === "thai");
  assert(thai, "missing thai lottery");

  const headHouse = await request("/api/head-houses", {
    method: "POST",
    cookie: "admin",
    body: { name: "หัวบ้าน QA", note: "qa", commissionPercent: 12.5 },
    expectedStatus: 201,
  });

  const viewerProvision = await request(`/api/head-houses/${headHouse.id}/viewer-account`, {
    method: "POST",
    cookie: "admin",
    expectedStatus: 201,
  });

  const operator = await request("/api/users", {
    method: "POST",
    cookie: "admin",
    body: { username: "qa-operator", password: "qa-password-123", role: "operator" },
    expectedStatus: 201,
  });
  assert(operator.role === "operator", "operator creation failed");

  await request("/api/login", {
    method: "POST",
    body: { username: "qa-operator", password: "qa-password-123" },
    capture: "operator",
  });

  await request("/api/login", {
    method: "POST",
    body: { username: viewerProvision.username, password: viewerProvision.password },
    capture: "viewer",
  });

  await request("/api/users", {
    method: "POST",
    cookie: "operator",
    body: { username: "blocked", password: "qa-password-123", role: "operator" },
    expectedStatus: 403,
  });

  await request("/api/state", { cookie: "viewer" });
  await request("/api/export", { cookie: "viewer", expectedStatus: 403 });

  const customer = await request("/api/customers", {
    method: "POST",
    cookie: "admin",
    body: { name: "ลูกค้า QA", headHouseId: headHouse.id },
    expectedStatus: 201,
  });

  const round = await request("/api/rounds", {
    method: "POST",
    cookie: "admin",
    body: {
      lotteryId: thai.id,
      label: "QA งวดครบ",
      openDate: today(),
      openTime: "00:00",
      drawDate: tomorrow(),
      drawTime: "23:59",
      closeBeforeMinutes: 5,
      status: "open",
    },
    expectedStatus: 201,
  });

  await request("/api/limits", {
    method: "POST",
    cookie: "admin",
    body: { roundId: round.id, betTypeId: "two_top", number: "45", maxAmount: 100 },
    expectedStatus: 201,
  });

  const entries = await request("/api/entries/batch", {
    method: "POST",
    cookie: "admin",
    body: {
      sourceChannel: "manual",
      note: "LINE: ลูกค้า QA",
      entries: [
        { customerId: customer.id, roundId: round.id, betTypeId: "two_top", number: "45", amount: 80, note: "LINE: ลูกค้า QA" },
        { customerId: customer.id, roundId: round.id, betTypeId: "three_top", number: "123", amount: 30, note: "LINE: ลูกค้า QA" },
      ],
    },
    expectedStatus: 201,
  });
  assert(entries.length === 2, "batch create failed");

  await request("/api/entries/batch", {
    method: "POST",
    cookie: "admin",
    body: {
      sourceChannel: "manual",
      entries: [{ customerId: customer.id, roundId: round.id, betTypeId: "two_top", number: "45", amount: 30 }],
    },
    expectedStatus: 409,
  });

  state = await request("/api/state", { cookie: "admin" });
  const ticket = state.tickets.find((item) => item.round_id === round.id);
  assert(ticket?.status === "pending_review", "ticket should start pending");

  await request(`/api/tickets/${ticket.id}/approve`, { method: "POST", cookie: "admin" });

  await request(`/api/entries/${entries[0].id}`, {
    method: "PUT",
    cookie: "admin",
    body: { customerId: customer.id, roundId: round.id, betTypeId: "two_top", number: "45", amount: 70 },
    expectedStatus: 409,
  });

  await request("/api/results", {
    method: "POST",
    cookie: "operator",
    body: { roundId: round.id, betTypeId: "two_top", numbers: "45" },
  });
  await request(`/api/results/${round.id}/finalize`, { method: "POST", cookie: "admin", expectedStatus: 409 });
  await request("/api/results", {
    method: "POST",
    cookie: "operator",
    body: { roundId: round.id, betTypeId: "three_top", numbers: "123" },
  });
  await request(`/api/results/${round.id}/finalize`, { method: "POST", cookie: "admin" });
  await request("/api/results", {
    method: "POST",
    cookie: "operator",
    body: { roundId: round.id, betTypeId: "two_top", numbers: "67" },
    expectedStatus: 409,
  });

  const settlement = await request(`/api/settlements?roundId=${encodeURIComponent(round.id)}`, { cookie: "admin" });
  assert(settlement.totalStake === 110, "settlement stake mismatch");
  assert(settlement.winnerCount === 2, "settlement winners mismatch");

  const summary = await request(`/api/head-house-summary?headHouseId=${encodeURIComponent(headHouse.id)}`, { cookie: "admin" });
  assert(summary.totalStake === 110, "head house stake mismatch");
  assert(summary.commissionAmount === 13.75, "head house commission mismatch");

  await request(`/api/results/${round.id}/reopen`, { method: "POST", cookie: "admin" });
  await request("/api/results", {
    method: "POST",
    cookie: "operator",
    body: { roundId: round.id, betTypeId: "two_top", numbers: "67" },
  });

  await request(`/api/users/${operator.id}`, {
    method: "PUT",
    cookie: "admin",
    body: { username: "qa-operator-renamed", password: "", role: "operator" },
  });

  await request(`/api/users/${viewerProvision.user.id}`, {
    method: "DELETE",
    cookie: "admin",
    expectedStatus: 204,
  });

  await request(`/api/head-houses/${headHouse.id}`, {
    method: "DELETE",
    cookie: "admin",
    expectedStatus: 409,
  });

  console.log("Deep QA passed");
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

async function request(url, { method = "GET", body, cookie = "", capture = "", expectedStatus = 200 } = {}) {
  const jar = cookie === "admin" ? adminCookie : cookie === "operator" ? operatorCookie : cookie === "viewer" ? viewerCookie : "";
  const response = await fetch(`${baseUrl}${url}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(jar ? { Cookie: jar } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (capture) {
    const value = response.headers.get("set-cookie")?.split(";")[0] || "";
    if (capture === "admin") adminCookie = value;
    if (capture === "operator") operatorCookie = value;
    if (capture === "viewer") viewerCookie = value;
  }

  if (response.status !== expectedStatus) {
    throw new Error(`${method} ${url} expected ${expectedStatus}, got ${response.status}: ${await response.text()}`);
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
