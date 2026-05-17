const CATEGORY_LABELS = {
  government: "รัฐบาล",
  daily: "หวยรายวัน",
  thai: "หวยไทย",
  foreign: "หวยต่างประเทศ",
  stock: "หวยหุ้น",
  stock_vip: "หวยหุ้น VIP",
  other: "หวยอื่น ๆ",
};

const elements = {
  clock: document.querySelector("#portalClock"),
  summary: document.querySelector("#marketSummary"),
  board: document.querySelector("#portalBoard"),
  schedule: document.querySelector("#todaySchedule"),
  results: document.querySelector("#latestResults"),
};

let state = { lotteries: [], rounds: [], results: [], scheduleTemplates: [] };

boot();
window.setInterval(updateClock, 1000);
window.setInterval(render, 1000);

async function boot() {
  updateClock();
  const response = await fetch("/api/public-state");
  state = await response.json();
  render();
}

function render() {
  const liveRounds = state.rounds.map((round) => ({ ...round, timing: getRoundTimingStatus(round) }));
  elements.summary.textContent = `${state.lotteries.length.toLocaleString("th-TH")} หวย · เปิดรับ ${liveRounds.filter((round) => round.timing.state === "open" || round.timing.state === "closing_soon").length.toLocaleString("th-TH")} งวด`;

  elements.board.innerHTML = Object.entries(CATEGORY_LABELS)
    .map(([category, label]) => {
      const lotteries = state.lotteries.filter((lottery) => (lottery.category || "other") === category);
      if (!lotteries.length) return "";
      return `
        <section class="portal-category">
          <h2>${escapeHtml(label)}</h2>
          <div class="portal-grid">
            ${lotteries.map((lottery) => renderLotteryCard(lottery)).join("")}
          </div>
        </section>
      `;
    })
    .join("");

  renderResults();
  renderSchedule();
}

function renderLotteryCard(lottery) {
  const round = getDisplayRoundForLottery(lottery.id);
  const status = getRoundTimingStatus(round);
  const closeText = round ? formatDateTime(round.close_at) : "ยังไม่มีงวด";
  return `
    <article class="portal-card ${status.cardClass}">
      <div class="portal-card-head">
        <span class="flag ${getLotteryFlagClass(lottery.id)}" aria-hidden="true"></span>
        <div>
          <strong>${escapeHtml(lottery.name)}</strong>
          <span>${round ? escapeHtml(formatDateTime(round.draw_at)) : "ยังไม่ตั้งงวด"}</span>
        </div>
      </div>
      <div class="portal-card-meta">
        <small>เวลาปิด</small>
        <span>${escapeHtml(closeText)}</span>
      </div>
      <div class="portal-card-meta">
        <small>สถานะ</small>
        <em>${escapeHtml(status.label)}${round?.accepting ? ` ${formatCountdownCompact(round)}` : ""}</em>
      </div>
    </article>
  `;
}

function renderSchedule() {
  const today = localDateKey(new Date());
  const rounds = state.rounds
    .filter((round) => localDateKey(new Date(round.close_at)) === today)
    .sort((a, b) => new Date(a.close_at) - new Date(b.close_at));
  elements.schedule.innerHTML = rounds.length
    ? rounds
        .map((round) => {
          const lottery = state.lotteries.find((item) => item.id === round.lottery_id);
          const timing = getRoundTimingStatus(round);
          return `
            <article class="schedule-row ${timing.cardClass}">
              <strong>${escapeHtml(lottery?.name || "-")}</strong>
              <span>ปิดรับ ${escapeHtml(formatClock(round.close_at))}</span>
              <em>${escapeHtml(timing.label)}${round.accepting ? ` ${formatCountdownCompact(round)}` : ""}</em>
            </article>
          `;
        })
        .join("")
    : '<div class="empty-state">วันนี้ยังไม่มีงวด</div>';
}

function renderResults() {
  const finalizedRounds = state.rounds
    .filter((round) => round.result_status === "finalized")
    .sort((a, b) => new Date(b.result_at || b.draw_at) - new Date(a.result_at || a.draw_at))
    .slice(0, 12);
  elements.results.innerHTML = finalizedRounds.length
    ? finalizedRounds
        .map((round) => {
          const lottery = state.lotteries.find((item) => item.id === round.lottery_id);
          return `
            <article class="result-card">
              <div>
                <strong>${escapeHtml(lottery?.name || "-")}</strong>
                <span>${escapeHtml(round.label)}</span>
              </div>
              <span>3 ตัวบน ${escapeHtml(resultNumbers(round.id, "three_top") || "-")}</span>
              <span>2 ตัวบน ${escapeHtml(resultNumbers(round.id, "two_top") || "-")}</span>
              <span>2 ตัวล่าง ${escapeHtml(resultNumbers(round.id, "two_bottom") || "-")}</span>
            </article>
          `;
        })
        .join("")
    : '<div class="empty-state">ยังไม่มีผลรางวัลที่ยืนยันแล้ว</div>';
}

function getDisplayRoundForLottery(lotteryId) {
  return state.rounds
    .filter((round) => round.lottery_id === lotteryId)
    .sort((a, b) => new Date(a.close_at) - new Date(b.close_at))
    .find((round) => new Date(round.close_at).getTime() >= Date.now()) ||
    state.rounds.filter((round) => round.lottery_id === lotteryId).sort((a, b) => new Date(b.close_at) - new Date(a.close_at))[0];
}

function resultNumbers(roundId, betTypeId) {
  return state.results
    .filter((result) => result.round_id === roundId && result.bet_type_id === betTypeId)
    .map((result) => result.number)
    .join(", ");
}

function getRoundTimingStatus(round) {
  if (!round) return { state: "unset", label: "ยังไม่ตั้งงวด", cardClass: "is-upcoming" };
  const now = Date.now();
  const openAt = new Date(round.open_at).getTime();
  const closeAt = new Date(round.close_at).getTime();
  if (now < openAt) return { state: "upcoming", label: "ยังไม่เปิด", cardClass: "is-upcoming" };
  if (now >= closeAt) return { state: "finished", label: "ปิดรับ", cardClass: "is-finished" };
  if (closeAt - now <= 5 * 60_000) return { state: "closing_soon", label: "ใกล้ปิด", cardClass: "is-closing" };
  return { state: "open", label: "เปิดรับ", cardClass: "is-open" };
}

function getLotteryFlagClass(id) {
  if (id === "thai" || id === "omsin" || id === "baac") return "flag-th";
  if (id.startsWith("lao")) return "flag-la";
  if (id.startsWith("hanoi") || id === "yamoey") return "flag-vn";
  if (id === "malaysia") return "flag-my";
  if (id.includes("nikkei")) return "flag-jp";
  if (id.includes("china")) return "flag-cn";
  if (id.includes("hangseng")) return "flag-hk";
  return "flag-generic";
}

function formatCountdownCompact(round) {
  const remainingMs = new Date(round.close_at).getTime() - Date.now();
  if (remainingMs <= 0) return "";
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function formatClock(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

function localDateKey(date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function updateClock() {
  elements.clock.textContent = new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok",
  }).format(new Date());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
