const CATEGORY_LABELS = {
  government: "รัฐบาล",
  daily: "หวยรายวัน",
  thai: "หวยไทย",
  foreign: "หวยต่างประเทศ",
  stock_vip: "หวย VIP",
  stock: "หวยหุ้น",
  other: "หวยอื่น ๆ",
};

const elements = {
  clock: document.querySelector("#portalClock"),
  summary: document.querySelector("#marketSummary"),
  board: document.querySelector("#portalBoard"),
  schedule: document.querySelector("#todaySchedule"),
  results: document.querySelector("#latestResults"),
  viewLinks: Array.from(document.querySelectorAll("[data-view-link]")),
  views: Array.from(document.querySelectorAll("[data-view]")),
};

let state = { lotteries: [], rounds: [], results: [], scheduleTemplates: [] };

boot();
window.addEventListener("hashchange", syncViewFromHash);
window.setInterval(updateClock, 1000);
window.setInterval(render, 1000);
window.setInterval(refreshPublicState, 30_000);

async function boot() {
  updateClock();
  syncViewFromHash();
  await refreshPublicState();
  render();
}

async function refreshPublicState() {
  try {
    const response = await fetch("/api/public-state");
    state = await response.json();
  } catch {
    // Keep the last good snapshot on screen when the network is temporarily unavailable.
  }
}

function render() {
  const liveRounds = state.rounds.map((round) => ({ ...round, timing: getRoundTimingStatus(round) }));
  const openRounds = liveRounds.filter((round) => isRoundAcceptingNow(round));
  elements.summary.textContent = `${state.lotteries.length.toLocaleString("th-TH")} หวย · เปิดรับ ${openRounds.length.toLocaleString("th-TH")} งวด`;
  elements.board.innerHTML = Object.entries(CATEGORY_LABELS)
    .map(([category, label]) => renderCategory(category, label))
    .join("");
  renderResults();
  renderLinks();
}

function syncViewFromHash() {
  const requestedView = window.location.hash.replace("#", "") || "play";
  const knownView = elements.views.some((view) => view.dataset.view === requestedView) ? requestedView : "play";
  for (const view of elements.views) {
    view.classList.toggle("is-active", view.dataset.view === knownView);
  }
  for (const link of elements.viewLinks) {
    link.classList.toggle("is-active", link.dataset.viewLink === knownView);
  }
}

function renderCategory(category, label) {
  const lotteries = state.lotteries
    .filter((lottery) => (lottery.category || "other") === category)
    .sort(compareLotteryCards);
  if (!lotteries.length) return "";
  return `
    <section class="portal-category">
      <h2>${escapeHtml(label)}</h2>
      <div class="portal-grid">
        ${lotteries.map((lottery) => renderLotteryCard(lottery)).join("")}
      </div>
    </section>
  `;
}

function compareLotteryCards(a, b) {
  const first = getDisplayRoundForLottery(a.id);
  const second = getDisplayRoundForLottery(b.id);
  const firstStatus = getRoundTimingStatus(first);
  const secondStatus = getRoundTimingStatus(second);
  const priority = { closing_soon: 0, open: 1, upcoming: 2, finished: 3, manual_closed: 4, unset: 5 };
  return (priority[firstStatus.state] ?? 99) - (priority[secondStatus.state] ?? 99)
    || (a.display_order ?? 999) - (b.display_order ?? 999)
    || a.name.localeCompare(b.name, "th");
}

function renderLotteryCard(lottery) {
  const round = getDisplayRoundForLottery(lottery.id);
  const status = getRoundTimingStatus(round);
  return `
    <article class="portal-card ${status.cardClass}">
      <div class="portal-card-head">
        <span class="flag ${getLotteryFlagClass(lottery.id)}" aria-hidden="true"></span>
        <div>
          <strong>${escapeHtml(lottery.name)}</strong>
          <span>${round ? escapeHtml(round.label) : "ยังไม่มีงวด"}</span>
        </div>
      </div>
      <div class="portal-card-meta">
        <small>เวลาปิด</small>
        <span>${round ? escapeHtml(formatDateTime(round.close_at)) : "-"}</span>
      </div>
      <div class="portal-card-meta">
        <small>สถานะ</small>
        <em>${escapeHtml(status.label)}${isRoundAcceptingNow(round) ? ` ${formatCountdownCompact(round)}` : ""}</em>
      </div>
    </article>
  `;
}

function renderResults() {
  const finalizedRounds = state.rounds
    .filter((round) => round.result_status === "finalized")
    .sort((a, b) => new Date(b.result_at || b.draw_at) - new Date(a.result_at || a.draw_at));

  const sections = Object.entries(CATEGORY_LABELS)
    .map(([category, label]) => {
      const rows = finalizedRounds.filter((round) => getLottery(round.lottery_id)?.category === category);
      if (!rows.length) return "";
      return `
        <section class="portal-category">
          <h3>${escapeHtml(label)}</h3>
          <table class="result-table">
            <thead>
              <tr>
                <th>ประเภทหวย</th>
                <th>งวด</th>
                <th>วันที่</th>
                <th>3 ตัวบน</th>
                <th>2 ตัวบน</th>
                <th>2 ตัวล่าง</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (round) => `
                    <tr>
                      <td>${escapeHtml(getLottery(round.lottery_id)?.name || "-")}</td>
                      <td>${escapeHtml(round.label)}</td>
                      <td>${escapeHtml(formatDateOnly(round.draw_at))}</td>
                      <td>${escapeHtml(resultNumbers(round.id, "three_top") || "-")}</td>
                      <td>${escapeHtml(resultNumbers(round.id, "two_top") || "-")}</td>
                      <td>${escapeHtml(resultNumbers(round.id, "two_bottom") || "-")}</td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
        </section>
      `;
    })
    .join("");

  elements.results.innerHTML = sections || '<div class="empty-state">ยังไม่มีผลรางวัลที่ยืนยันแล้ว</div>';
}

function renderLinks() {
  const sections = Object.entries(CATEGORY_LABELS)
    .map(([category, label]) => {
      const templates = state.scheduleTemplates
        .filter((schedule) => getLottery(schedule.lottery_id)?.category === category)
        .sort((a, b) => (getLottery(a.lottery_id)?.display_order ?? 999) - (getLottery(b.lottery_id)?.display_order ?? 999));
      if (!templates.length) return "";
      return `
        <section class="link-category">
          <h2>${escapeHtml(label)}</h2>
          ${templates
            .map(
              (schedule) => `
                <article class="link-row">
                  <strong>${escapeHtml(getLottery(schedule.lottery_id)?.name || "-")}</strong>
                  <span>ปิดรับ ${escapeHtml(schedule.draw_time)}</span>
                  <span>ผลออก ${escapeHtml(schedule.result_time || schedule.draw_time)}</span>
                  <span>${escapeHtml(schedule.source_note || "ยังไม่ระบุแหล่งตรวจผล")}</span>
                </article>
              `,
            )
            .join("")}
        </section>
      `;
    })
    .join("");
  elements.schedule.innerHTML = sections || '<div class="empty-state">ยังไม่มีข้อมูลเวลาอ้างอิง</div>';
}

function getDisplayRoundForLottery(lotteryId) {
  return (
    findLatestOpenRound(lotteryId) ||
    state.rounds
      .filter((round) => round.lottery_id === lotteryId)
      .sort((a, b) => new Date(a.close_at) - new Date(b.close_at))
      .find((round) => new Date(round.close_at).getTime() >= Date.now()) ||
    state.rounds
      .filter((round) => round.lottery_id === lotteryId)
      .sort((a, b) => new Date(b.close_at) - new Date(a.close_at))[0]
  );
}

function getLottery(id) {
  return state.lotteries.find((lottery) => lottery.id === id);
}

function resultNumbers(roundId, betTypeId) {
  return state.results
    .filter((result) => result.round_id === roundId && result.bet_type_id === betTypeId)
    .map((result) => result.number)
    .join(", ");
}

function getRoundTimingStatus(round) {
  if (!round) return { state: "unset", label: "ยังไม่ตั้งงวด", cardClass: "is-upcoming" };
  if (round.status === "closed") return { state: "manual_closed", label: "ปิดงวด", cardClass: "is-finished" };
  const now = Date.now();
  const openAt = new Date(round.open_at).getTime();
  const closeAt = new Date(round.close_at).getTime();
  if (now < openAt) return { state: "upcoming", label: "ยังไม่เปิด", cardClass: "is-upcoming" };
  if (now >= closeAt) return { state: "finished", label: "ปิดรับ", cardClass: "is-finished" };
  if (closeAt - now <= 5 * 60_000) return { state: "closing_soon", label: "ใกล้ปิด", cardClass: "is-closing" };
  return { state: "open", label: "เปิดรับ", cardClass: "is-open" };
}

function isRoundAcceptingNow(round) {
  const stateNow = getRoundTimingStatus(round).state;
  return stateNow === "open" || stateNow === "closing_soon";
}

function findLatestOpenRound(lotteryId) {
  return state.rounds
    .filter((round) => round.lottery_id === lotteryId && isRoundAcceptingNow(round))
    .sort((a, b) => new Date(a.close_at) - new Date(b.close_at))[0];
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
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

function formatDateOnly(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
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
