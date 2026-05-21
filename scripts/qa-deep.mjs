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
  const adminUser = state.users.find((user) => user.username === "qa-admin");
  assert(adminUser?.role === "admin", "admin bootstrap user missing");

  await request(`/api/users/${adminUser.id}`, {
    method: "PUT",
    cookie: "admin",
    body: { username: "qa-admin", password: "", role: "operator" },
    expectedStatus: 409,
  });

  await request(`/api/users/${adminUser.id}`, {
    method: "DELETE",
    cookie: "admin",
    expectedStatus: 409,
  });

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

  const appHtml = await requestText("/");
  const adminRedirect = await requestRaw("/admin", { redirect: "manual" });
  assert(appHtml.includes("ระบบจัดการหวย"), "main app shell should render from root");
  assert(appHtml.includes('data-view-target="markets">แทงหวย'), "main app should expose แทงหวย as the lottery selection page");
  assert(!appHtml.includes('data-view-target="intake">คีย์โพย'), "intake should not be a top-level navigation item");
  assert(appHtml.includes('data-view-target="resultLinks">ลิงก์ผล'), "main app should expose result source links");
  assert(appHtml.includes('id="lotteryBoard"'), "main app should render the lottery selection board");
  assert(appHtml.includes('id="backToMarketsBtn"'), "intake should provide a return path to the lottery board");
  assert(appHtml.includes('data-view-target="headHouseReport"'), "main app should contain head-house report view");
  assert(adminRedirect.status === 302, "/admin should redirect to the unified root app");

  await request("/api/users", {
    method: "POST",
    cookie: "operator",
    body: { username: "blocked", password: "qa-password-123", role: "operator" },
    expectedStatus: 403,
  });

  await request("/api/state", { cookie: "viewer" });
  await request("/api/export", { cookie: "viewer", expectedStatus: 403 });
  const publicState = await request("/api/public-state");
  assert(publicState.lotteries.length > 0, "public portal state should expose lotteries");
  assert(Array.isArray(publicState.rounds), "public portal state should expose rounds");
  assert(
    publicState.scheduleTemplates.every((scheduleTemplate) => scheduleTemplate.result_time !== "00:00" || scheduleTemplate.draw_time === "00:00"),
    "seeded schedules should expose meaningful result times",
  );
  assert(
    state.resultSources.some((source) => source.source_kind === "official_glo" && source.auto_confirm === 1),
    "GLO source should be available for automatic Thai result import",
  );
  assert(
    state.resultSources.some((source) => source.source_kind === "api_reserved" && source.requires_key === 1),
    "paid API provider should be prepared but key-gated",
  );
  assert(state.resultSources.some((source) => source.source_kind === "manual_link"), "manual result links should be available as fallback");

  const customer = await request("/api/customers", {
    method: "POST",
    cookie: "admin",
    body: { name: "ลูกค้า QA", headHouseId: headHouse.id },
    expectedStatus: 201,
  });

  const scheduledLottery = await request("/api/lotteries", {
    method: "POST",
    cookie: "admin",
    body: { name: "หวยทดสอบเวลา", category: "other" },
    expectedStatus: 201,
  });

  const round = await request("/api/rounds", {
    method: "POST",
    cookie: "admin",
    body: {
      lotteryId: scheduledLottery.id,
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

  const schedule = await request("/api/schedule-templates", {
    method: "POST",
    cookie: "admin",
    body: {
      lotteryId: scheduledLottery.id,
      frequency: "daily",
      weekdays: "0,1,2,3,4,5,6",
      monthDays: "",
      openDaysBefore: 0,
      openTime: "08:00",
      drawTime: "18:00",
      resultTime: "18:30",
      closeBeforeMinutes: 5,
      sourceNote: "qa",
      active: true,
    },
    expectedStatus: 201,
  });

  const toggledSchedule = await request(`/api/schedule-templates/${schedule.id}`, {
    method: "PUT",
    cookie: "admin",
    body: {
      lotteryId: schedule.lottery_id,
      frequency: schedule.frequency,
      weekdays: schedule.weekdays.join(","),
      monthDays: schedule.month_days.join(","),
      openDaysBefore: schedule.open_days_before,
      openTime: schedule.open_time,
      drawTime: schedule.draw_time,
      resultTime: schedule.result_time,
      closeBeforeMinutes: schedule.close_before_minutes,
      sourceNote: schedule.source_note,
      active: false,
    },
  });
  assert(toggledSchedule.result_time === "18:30", "schedule result time must survive active toggle");

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

  const headHouseWalkinEntries = await request("/api/entries/batch", {
    method: "POST",
    cookie: "admin",
    body: {
      sourceChannel: "manual",
      headHouseId: headHouse.id,
      note: "LINE: เจ๊แดง",
      entries: [{ customerId: "walkin", roundId: round.id, betTypeId: "two_bottom", number: "88", amount: 40, note: "LINE: เจ๊แดง" }],
    },
    expectedStatus: 201,
  });
  assert(headHouseWalkinEntries.length === 1, "head-house walkin batch create failed");

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
  const ticket = state.tickets.find((item) => item.id === entries[0].ticket_id);
  assert(ticket?.status === "pending_review", "ticket should start pending");
  assert(ticket?.note === "LINE: ลูกค้า QA", "ticket note should persist from batch create");
  const headHouseWalkinTicket = state.tickets.find((item) => item.id === headHouseWalkinEntries[0].ticket_id);
  assert(headHouseWalkinTicket?.head_house_id === headHouse.id, "ticket head-house attribution missing");

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
  await request(`/api/results/${round.id}/finalize`, { method: "POST", cookie: "operator", expectedStatus: 403 });
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

  await request(`/api/tickets/${headHouseWalkinTicket.id}/approve`, { method: "POST", cookie: "admin" });

  const summary = await request(`/api/head-house-summary?headHouseId=${encodeURIComponent(headHouse.id)}`, { cookie: "admin" });
  assert(summary.totalStake === 150, "head house stake mismatch");
  assert(summary.commissionAmount === 18.75, "head house commission mismatch");
  const viewerSummary = await request("/api/head-house-summary", { cookie: "viewer" });
  assert(viewerSummary.headHouse.id === headHouse.id, "viewer should only see own head house");
  assert(viewerSummary.totalStake === 150, "viewer head house summary mismatch");

  await request(`/api/results/${round.id}/reopen`, { method: "POST", cookie: "admin" });
  await request("/api/results", {
    method: "POST",
    cookie: "operator",
    body: { roundId: round.id, betTypeId: "two_top", numbers: "67" },
  });

  const rejectedEntries = await request("/api/entries/batch", {
    method: "POST",
    cookie: "admin",
    body: {
      sourceChannel: "manual",
      note: "LINE: ต้องคงอยู่",
      entries: [{ customerId: customer.id, roundId: round.id, betTypeId: "two_bottom", number: "89", amount: 20, note: "LINE: ต้องคงอยู่" }],
    },
    expectedStatus: 201,
  });
  state = await request("/api/state", { cookie: "admin" });
  const rejectedTicket = state.tickets.find((item) => item.id === rejectedEntries[0].ticket_id);
  await request(`/api/tickets/${rejectedTicket.id}/reject`, {
    method: "POST",
    cookie: "admin",
    body: { reason: "ข้อมูลไม่ครบ" },
  });
  state = await request("/api/state", { cookie: "admin" });
  const rejectedTicketAfterReview = state.tickets.find((item) => item.id === rejectedTicket.id);
  assert(rejectedTicketAfterReview.note === "LINE: ต้องคงอยู่", "rejecting a ticket must not overwrite customer note");
  assert(rejectedTicketAfterReview.review_note === "ข้อมูลไม่ครบ", "reject reason should be stored separately");

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

async function requestText(url, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}${url}`);
  if (response.status !== expectedStatus) {
    throw new Error(`GET ${url} expected ${expectedStatus}, got ${response.status}: ${await response.text()}`);
  }
  return response.text();
}

async function requestRaw(url, options = {}) {
  return fetch(`${baseUrl}${url}`, options);
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
