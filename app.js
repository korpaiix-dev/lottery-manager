const VIEW_META = {
  dashboard: { eyebrow: "ศูนย์ควบคุมงานหลังบ้าน", title: "แดชบอร์ด" },
  intake: { eyebrow: "ลดงานกรอกซ้ำ", title: "รับรายการ" },
  entries: { eyebrow: "ตรวจสอบรายการทั้งหมด", title: "รายการ" },
  headHouses: { eyebrow: "เครือข่ายผู้ส่งยอด", title: "หัวบ้าน" },
  customers: { eyebrow: "ข้อมูลผู้ส่งรายการ", title: "ลูกค้า" },
  lotteries: { eyebrow: "ตั้งค่าหวยและงวด", title: "หวยและงวด" },
  limits: { eyebrow: "ควบคุมเพดานรับ", title: "อั้นเลข" },
  payouts: { eyebrow: "ตั้งค่าอัตราจ่าย", title: "อัตราจ่าย" },
  results: { eyebrow: "บันทึกผลที่ออก", title: "ผลรางวัล" },
  reports: { eyebrow: "สรุปผลกำไรขาดทุน", title: "รายงาน" },
  headHouseReport: { eyebrow: "ยอดรวมแบบอ่านอย่างเดียว", title: "ยอดหัวบ้าน" },
  users: { eyebrow: "สิทธิ์การใช้งาน", title: "ผู้ใช้" },
};

const LOTTERY_ALIASES = {
  thai: ["หวยไทย", "ไทย", "รัฐบาล"],
  lao: ["หวยลาว", "ลาว"],
  hanoi: ["หวยฮานอย", "ฮานอย"],
  stock: ["หวยหุ้น", "หุ้น"],
};

const BET_TYPE_PATTERNS = [
  { id: "three_tod", patterns: [/3\s*โต๊ด/i, /โต๊ด/i] },
  { id: "three_top", patterns: [/3\s*บน/i, /สามตัวบน/i] },
  { id: "two_bottom", patterns: [/2\s*ล่าง/i, /สองตัวล่าง/i] },
  { id: "two_top", patterns: [/2\s*บน/i, /สองตัวบน/i] },
  { id: "run_bottom", patterns: [/วิ่ง\s*ล่าง/i] },
  { id: "run_top", patterns: [/วิ่ง\s*บน/i, /วิ่ง/i] },
];

const state = {
  user: null,
  headHouses: [],
  lotteries: [],
  customers: [],
  rounds: [],
  betTypes: [],
  payoutRates: [],
  limits: [],
  entries: [],
  results: [],
  users: [],
  editingEntryId: null,
  editingLimitId: null,
  quickParsedEntries: [],
};

const elements = {
  authShell: document.querySelector("#authShell"),
  appShell: document.querySelector("#appShell"),
  setupForm: document.querySelector("#setupForm"),
  setupUsername: document.querySelector("#setupUsername"),
  setupPassword: document.querySelector("#setupPassword"),
  loginForm: document.querySelector("#loginForm"),
  loginUsername: document.querySelector("#loginUsername"),
  loginPassword: document.querySelector("#loginPassword"),
  navButtons: document.querySelectorAll("[data-view-target]"),
  views: document.querySelectorAll("[data-view]"),
  currentViewEyebrow: document.querySelector("#currentViewEyebrow"),
  currentViewTitle: document.querySelector("#currentViewTitle"),
  currentUserLabel: document.querySelector("#currentUserLabel"),
  usersNavButton: document.querySelector('[data-view-target="users"]'),
  usersView: document.querySelector('[data-view="users"]'),
  headHousesNavButton: document.querySelector('[data-view-target="headHouses"]'),
  headHousesView: document.querySelector('[data-view="headHouses"]'),
  headHouseReportNavButton: document.querySelector('[data-view-target="headHouseReport"]'),
  staffOnlyNavButtons: document.querySelectorAll(
    '[data-view-target="dashboard"], [data-view-target="intake"], [data-view-target="entries"], [data-view-target="customers"], [data-view-target="lotteries"], [data-view-target="limits"], [data-view-target="payouts"], [data-view-target="results"], [data-view-target="reports"]',
  ),
  exportBtn: document.querySelector("#exportBtn"),
  logoutBtn: document.querySelector("#logoutBtn"),
  totalAmount: document.querySelector("#totalAmount"),
  totalEntries: document.querySelector("#totalEntries"),
  totalCustomers: document.querySelector("#totalCustomers"),
  openRoundsCount: document.querySelector("#openRoundsCount"),
  totalLimits: document.querySelector("#totalLimits"),
  nearLimitCount: document.querySelector("#nearLimitCount"),
  limitWatchList: document.querySelector("#limitWatchList"),
  recentEntriesList: document.querySelector("#recentEntriesList"),
  quickCustomer: document.querySelector("#quickCustomer"),
  toggleQuickCustomerBtn: document.querySelector("#toggleQuickCustomerBtn"),
  quickCustomerForm: document.querySelector("#quickCustomerForm"),
  quickCustomerName: document.querySelector("#quickCustomerNameInput"),
  quickCustomerHeadHouse: document.querySelector("#quickCustomerHeadHouseInput"),
  quickLottery: document.querySelector("#quickLottery"),
  quickRound: document.querySelector("#quickRound"),
  quickBetType: document.querySelector("#quickBetType"),
  quickAmount: document.querySelector("#quickAmount"),
  quickMessage: document.querySelector("#quickMessage"),
  parseQuickBtn: document.querySelector("#parseQuickBtn"),
  clearQuickBtn: document.querySelector("#clearQuickBtn"),
  quickParseSummary: document.querySelector("#quickParseSummary"),
  quickPreviewBody: document.querySelector("#quickPreviewBody"),
  saveQuickBatchBtn: document.querySelector("#saveQuickBatchBtn"),
  entryForm: document.querySelector("#entryForm"),
  formTitle: document.querySelector("#formTitle"),
  resetBtn: document.querySelector("#resetBtn"),
  customer: document.querySelector("#customerInput"),
  round: document.querySelector("#roundInput"),
  betType: document.querySelector("#betTypeInput"),
  number: document.querySelector("#numberInput"),
  amount: document.querySelector("#amountInput"),
  note: document.querySelector("#noteInput"),
  limitPreview: document.querySelector("#limitPreview"),
  submitBtn: document.querySelector("#submitBtn"),
  recordsBody: document.querySelector("#recordsBody"),
  emptyState: document.querySelector("#emptyState"),
  filterCustomer: document.querySelector("#filterCustomer"),
  filterRound: document.querySelector("#filterRound"),
  filterBetType: document.querySelector("#filterBetType"),
  searchInput: document.querySelector("#searchInput"),
  customerForm: document.querySelector("#customerForm"),
  customerName: document.querySelector("#customerNameInput"),
  customerHeadHouse: document.querySelector("#customerHeadHouseInput"),
  customerList: document.querySelector("#customerList"),
  headHouseForm: document.querySelector("#headHouseForm"),
  headHouseName: document.querySelector("#headHouseNameInput"),
  headHouseNote: document.querySelector("#headHouseNoteInput"),
  headHouseList: document.querySelector("#headHouseList"),
  lotteryForm: document.querySelector("#lotteryForm"),
  lotteryName: document.querySelector("#lotteryNameInput"),
  lotteryChips: document.querySelector("#lotteryChips"),
  roundForm: document.querySelector("#roundForm"),
  roundLottery: document.querySelector("#roundLotteryInput"),
  roundDate: document.querySelector("#roundDateInput"),
  roundTime: document.querySelector("#roundTimeInput"),
  roundLabel: document.querySelector("#roundLabelInput"),
  roundCloseBefore: document.querySelector("#roundCloseBeforeInput"),
  roundsBody: document.querySelector("#roundsBody"),
  limitForm: document.querySelector("#limitForm"),
  limitFormTitle: document.querySelector("#limitFormTitle"),
  limitRound: document.querySelector("#limitRoundInput"),
  limitBetType: document.querySelector("#limitBetTypeInput"),
  limitNumber: document.querySelector("#limitNumberInput"),
  limitAmount: document.querySelector("#limitAmountInput"),
  resetLimitBtn: document.querySelector("#resetLimitBtn"),
  limitSubmitBtn: document.querySelector("#limitSubmitBtn"),
  limitsBody: document.querySelector("#limitsBody"),
  limitsEmptyState: document.querySelector("#limitsEmptyState"),
  payoutMatrix: document.querySelector("#payoutMatrix"),
  resultRound: document.querySelector("#resultRoundInput"),
  resultEditor: document.querySelector("#resultEditor"),
  reportRound: document.querySelector("#reportRoundInput"),
  reportStake: document.querySelector("#reportStake"),
  reportPayout: document.querySelector("#reportPayout"),
  reportProfit: document.querySelector("#reportProfit"),
  reportWinnerCount: document.querySelector("#reportWinnerCount"),
  winnersBody: document.querySelector("#winnersBody"),
  headHouseReportPickerWrap: document.querySelector("#headHouseReportPickerWrap"),
  headHouseReportSelect: document.querySelector("#headHouseReportSelect"),
  headHouseReportStake: document.querySelector("#headHouseReportStake"),
  headHouseReportPayout: document.querySelector("#headHouseReportPayout"),
  headHouseReportProfit: document.querySelector("#headHouseReportProfit"),
  headHouseReportRoundCount: document.querySelector("#headHouseReportRoundCount"),
  headHouseReportBody: document.querySelector("#headHouseReportBody"),
  userForm: document.querySelector("#userForm"),
  userUsername: document.querySelector("#userUsernameInput"),
  userPassword: document.querySelector("#userPasswordInput"),
  userRole: document.querySelector("#userRoleInput"),
  userHeadHouseWrap: document.querySelector("#userHeadHouseWrap"),
  userHeadHouse: document.querySelector("#userHeadHouseInput"),
  usersBody: document.querySelector("#usersBody"),
  recordActionsTemplate: document.querySelector("#recordActionsTemplate"),
  limitActionsTemplate: document.querySelector("#limitActionsTemplate"),
};

initialize();

async function initialize() {
  bindEvents();
  elements.roundDate.value = today();
  await bootAuth();
}

function bindEvents() {
  elements.setupForm.addEventListener("submit", handleSetup);
  elements.loginForm.addEventListener("submit", handleLogin);
  elements.logoutBtn.addEventListener("click", handleLogout);
  elements.exportBtn.addEventListener("click", exportData);

  elements.navButtons.forEach((button) => {
    button.addEventListener("click", () => activateView(button.dataset.viewTarget));
  });

  elements.parseQuickBtn.addEventListener("click", parseQuickMessage);
  elements.clearQuickBtn.addEventListener("click", clearQuickIntake);
  elements.saveQuickBatchBtn.addEventListener("click", saveQuickBatch);
  elements.quickLottery.addEventListener("change", renderQuickRoundOptions);
  elements.toggleQuickCustomerBtn.addEventListener("click", toggleQuickCustomerForm);
  elements.quickCustomerForm.addEventListener("submit", handleQuickCustomerSubmit);

  elements.entryForm.addEventListener("submit", handleEntrySubmit);
  elements.resetBtn.addEventListener("click", resetEntryForm);
  elements.betType.addEventListener("change", () => {
    syncNumberLength(elements.number, elements.betType.value);
    renderLimitPreview();
  });
  [elements.round, elements.number, elements.amount].forEach((input) => {
    input.addEventListener("input", renderLimitPreview);
    input.addEventListener("change", renderLimitPreview);
  });

  [elements.filterCustomer, elements.filterRound, elements.filterBetType].forEach((input) => {
    input.addEventListener("change", renderEntries);
  });
  elements.searchInput.addEventListener("input", renderEntries);

  elements.customerForm.addEventListener("submit", handleCustomerSubmit);
  elements.headHouseForm.addEventListener("submit", handleHeadHouseSubmit);
  elements.lotteryForm.addEventListener("submit", handleLotterySubmit);
  elements.roundForm.addEventListener("submit", handleRoundSubmit);

  elements.limitForm.addEventListener("submit", handleLimitSubmit);
  elements.resetLimitBtn.addEventListener("click", resetLimitForm);
  elements.limitBetType.addEventListener("change", () => syncNumberLength(elements.limitNumber, elements.limitBetType.value));

  elements.resultRound.addEventListener("change", renderResultEditor);
  elements.reportRound.addEventListener("change", renderSettlement);
  elements.userForm.addEventListener("submit", handleUserSubmit);
  elements.userRole.addEventListener("change", syncUserHeadHouseField);
  elements.headHouseReportSelect.addEventListener("change", renderHeadHouseReport);
}

async function bootAuth() {
  const bootstrap = await api("/api/bootstrap");
  if (bootstrap.setupRequired) {
    elements.setupForm.classList.remove("hidden");
    elements.loginForm.classList.add("hidden");
    return;
  }

  try {
    const { user } = await api("/api/me");
    state.user = user;
    await enterApp();
  } catch {
    elements.loginForm.classList.remove("hidden");
    elements.setupForm.classList.add("hidden");
  }
}

async function handleSetup(event) {
  event.preventDefault();
  const payload = {
    username: elements.setupUsername.value.trim(),
    password: elements.setupPassword.value,
  };
  const { user } = await api("/api/setup", { method: "POST", body: payload });
  state.user = user;
  await enterApp();
}

async function handleLogin(event) {
  event.preventDefault();
  const payload = {
    username: elements.loginUsername.value.trim(),
    password: elements.loginPassword.value,
  };

  try {
    const { user } = await api("/api/login", { method: "POST", body: payload });
    state.user = user;
    await enterApp();
  } catch {
    alert("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
  }
}

async function handleLogout() {
  await api("/api/logout", { method: "POST" });
  state.user = null;
  elements.appShell.classList.add("hidden");
  elements.authShell.classList.remove("hidden");
  elements.loginForm.classList.remove("hidden");
  elements.setupForm.classList.add("hidden");
}

async function enterApp() {
  elements.authShell.classList.add("hidden");
  elements.appShell.classList.remove("hidden");
  elements.currentUserLabel.textContent = state.user.username;
  configureRoleAccess();
  await refreshState();
  activateView(state.user.role === "head_house_viewer" ? "headHouseReport" : "dashboard", false);
}

async function refreshState() {
  Object.assign(state, await api("/api/state"));
  render();
}

function activateView(viewName, shouldScroll = true) {
  const meta = VIEW_META[viewName] ?? VIEW_META.dashboard;
  elements.views.forEach((view) => {
    const isActive = view.dataset.view === viewName;
    view.hidden = !isActive;
    view.classList.toggle("is-active", isActive);
  });
  elements.navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewTarget === viewName);
  });
  elements.currentViewEyebrow.textContent = meta.eyebrow;
  elements.currentViewTitle.textContent = meta.title;
  if (shouldScroll) window.scrollTo({ top: 0, behavior: "smooth" });
}

function render() {
  renderSelects();
  renderDashboard();
  renderEntries();
  renderHeadHouses();
  renderCustomers();
  renderLotteries();
  renderRounds();
  renderLimits();
  renderPayouts();
  renderResultEditor();
  renderSettlement();
  renderHeadHouseReport();
  renderUsers();
  renderQuickPreview();
  renderLimitPreview();
  syncUserHeadHouseField();
}

function renderSelects() {
  const headHouseOptions = state.headHouses.map((headHouse) => option(headHouse.id, formatHeadHouse(headHouse))).join("");
  const customerOptions = state.customers.map((customer) => option(customer.id, formatCustomer(customer))).join("");
  const lotteryOptions = state.lotteries.map((lottery) => option(lottery.id, lottery.name)).join("");
  const roundOptions = state.rounds.map((round) => option(round.id, formatRound(round))).join("");
  const acceptingRoundOptions = state.rounds
    .filter((round) => round.accepting)
    .map((round) => option(round.id, formatRound(round)))
    .join("");
  const betTypeOptions = state.betTypes.map((betType) => option(betType.id, betType.name)).join("");

  preserveSelect(elements.quickCustomer, customerOptions);
  preserveSelect(elements.quickCustomerHeadHouse, headHouseOptions, "direct");
  preserveSelect(elements.customer, customerOptions);
  preserveSelect(elements.customerHeadHouse, headHouseOptions, "direct");
  preserveSelect(elements.filterCustomer, option("all", "ทั้งหมด") + customerOptions, "all");
  preserveSelect(elements.quickLottery, lotteryOptions);
  preserveSelect(elements.roundLottery, lotteryOptions);
  preserveSelect(elements.quickBetType, betTypeOptions, "two_top");
  preserveSelect(elements.betType, betTypeOptions, "two_top");
  preserveSelect(elements.filterBetType, option("all", "ทั้งหมด") + betTypeOptions, "all");
  preserveSelect(elements.round, acceptingRoundOptions || option("", "ยังไม่มีงวดที่เปิดรับ"));
  preserveSelect(elements.filterRound, option("all", "ทั้งหมด") + roundOptions, "all");
  preserveSelect(elements.limitRound, acceptingRoundOptions || roundOptions);
  preserveSelect(elements.limitBetType, betTypeOptions, "two_top");
  preserveSelect(elements.resultRound, roundOptions);
  preserveSelect(elements.reportRound, roundOptions);
  preserveSelect(elements.userHeadHouse, headHouseOptions);
  preserveSelect(elements.headHouseReportSelect, headHouseOptions);

  renderQuickRoundOptions();
  syncNumberLength(elements.number, elements.betType.value);
  syncNumberLength(elements.limitNumber, elements.limitBetType.value);
}

function renderQuickRoundOptions() {
  const lotteryId = elements.quickLottery.value || state.lotteries[0]?.id;
  const options = state.rounds
    .filter((round) => round.lottery_id === lotteryId && round.accepting)
    .map((round) => option(round.id, formatRound(round)))
    .join("");
  preserveSelect(elements.quickRound, options || option("", "ยังไม่มีงวดที่เปิดรับ"));
}

function renderDashboard() {
  const limitStatuses = getLimitStatuses();
  elements.totalAmount.textContent = money(sum(state.entries.map((entry) => entry.amount)));
  elements.totalEntries.textContent = state.entries.length.toLocaleString("th-TH");
  elements.totalCustomers.textContent = state.customers.length.toLocaleString("th-TH");
  elements.openRoundsCount.textContent = state.rounds.filter((round) => round.status === "open").length.toLocaleString("th-TH");
  elements.totalLimits.textContent = state.limits.length.toLocaleString("th-TH");
  elements.nearLimitCount.textContent = limitStatuses.filter((item) => item.status !== "normal").length.toLocaleString("th-TH");

  renderLimitWatchList(limitStatuses);
  renderRecentEntries();
}

function renderLimitWatchList(statuses = getLimitStatuses()) {
  const flagged = statuses.filter((item) => item.status !== "normal").slice(0, 6);
  elements.limitWatchList.innerHTML = flagged.length
    ? flagged
        .map(
          (item) => `
            <article class="watch-item ${item.status}">
              <div>
                <strong>${escapeHtml(item.limit.number)} (${escapeHtml(getBetTypeName(item.limit.bet_type_id))})</strong>
                <span>${escapeHtml(formatRound(getRound(item.limit.round_id)))}</span>
              </div>
              <div>
                <strong>${money(item.currentAmount)}</strong>
                <span>${percent(item.percent)}</span>
              </div>
            </article>
          `,
        )
        .join("")
    : '<div class="empty-state">ยังไม่มีเลขใกล้เต็ม</div>';
}

function renderRecentEntries() {
  elements.recentEntriesList.innerHTML = state.entries.length
    ? state.entries
        .slice(0, 6)
        .map(
          (entry) => `
            <article class="recent-item">
              <div>
                <strong>${escapeHtml(entry.number)} · ${escapeHtml(getBetTypeName(entry.bet_type_id))}</strong>
                <span>${escapeHtml(getCustomerCode(entry.customer_id))} / ${escapeHtml(formatRound(getRound(entry.round_id)))}</span>
              </div>
              <strong>${money(entry.amount)}</strong>
            </article>
          `,
        )
        .join("")
    : '<div class="empty-state">ยังไม่มีรายการ</div>';
}

function parseQuickMessage() {
  const raw = elements.quickMessage.value.trim();
  if (!raw) {
    alert("วางข้อความจาก LINE ก่อน");
    return;
  }

  const inferredLottery = inferLottery(raw) || elements.quickLottery.value;
  const inferredRound = findLatestOpenRound(inferredLottery)?.id || elements.quickRound.value;
  const inferredCustomer = inferCustomer(raw) || elements.quickCustomer.value;
  const inferredBetType = inferBetType(raw);
  const amountMatch = raw.match(/(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:บาท|บ)/i);
  const inferredAmount = amountMatch ? parseAmount(amountMatch[1]) : parseAmount(elements.quickAmount.value);

  const stripped = stripParserNoise(raw);
  const numbers = [...stripped.matchAll(/\b\d{1,3}\b/g)].map((match) => match[0]);
  const entries = numbers.map((number) => {
    const betTypeId = inferredBetType || inferBetTypeFromDigits(number.length) || elements.quickBetType.value;
      return {
        customerId: inferredCustomer,
      roundId: inferredRound,
      betTypeId,
      number,
      amount: inferredAmount,
      sourceText: raw,
    };
  });

  state.quickParsedEntries = entries;
  if (inferredCustomer) {
    elements.quickCustomer.value = inferredCustomer;
  }
  renderQuickPreview({
    inferredLottery,
    inferredRound,
    inferredBetType,
    inferredAmount,
  });
}

function renderQuickPreview(meta = null) {
  const entries = state.quickParsedEntries;
  elements.quickPreviewBody.innerHTML = "";
  elements.saveQuickBatchBtn.disabled = !entries.length || entries.some((entry) => getQuickEntryIssues(entry).length);

  if (!entries.length) {
    elements.quickParseSummary.classList.add("hidden");
    return;
  }

  const issueCount = entries.filter((entry) => getQuickEntryIssues(entry).length).length;
  elements.quickParseSummary.className = `parse-summary ${issueCount ? "warning" : "success"}`;
  elements.quickParseSummary.innerHTML = issueCount
    ? `พบ ${entries.length.toLocaleString("th-TH")} รายการ แต่ยังมี ${issueCount.toLocaleString("th-TH")} รายการที่ต้องแก้ก่อนบันทึก`
    : `พร้อมบันทึก ${entries.length.toLocaleString("th-TH")} รายการ${meta?.inferredLottery ? ` จาก ${escapeHtml(getLotteryName(meta.inferredLottery))}` : ""}`;

  entries.forEach((entry) => {
    const issues = getQuickEntryIssues(entry);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><span class="number-pill">${escapeHtml(entry.number)}</span></td>
      <td>${escapeHtml(getLotteryName(getRound(entry.roundId)?.lottery_id || ""))}</td>
      <td>${escapeHtml(formatRound(getRound(entry.roundId)))}</td>
      <td>${escapeHtml(getBetTypeName(entry.betTypeId))}</td>
      <td>${money(entry.amount || 0)}</td>
      <td><span class="status-pill ${issues.length ? "warning" : "normal"}">${issues.length ? escapeHtml(issues.join(", ")) : "พร้อมบันทึก"}</span></td>
    `;
    elements.quickPreviewBody.appendChild(row);
  });
}

async function saveQuickBatch() {
  if (!state.quickParsedEntries.length) return;
  const issues = state.quickParsedEntries.flatMap((entry) => getQuickEntryIssues(entry));
  if (issues.length) {
    alert("ยังมีรายการที่ข้อมูลไม่ครบ");
    return;
  }

  const entries = state.quickParsedEntries.map((entry) => ({
    customerId: entry.customerId,
    roundId: entry.roundId,
    betTypeId: entry.betTypeId,
    number: entry.number,
    amount: entry.amount,
    sourceText: entry.sourceText,
  }));

  try {
    await api("/api/entries/batch", { method: "POST", body: { entries } });
    clearQuickIntake();
    await refreshState();
    activateView("entries");
  } catch (error) {
    handleLimitError(error);
  }
}

function clearQuickIntake() {
  elements.quickMessage.value = "";
  state.quickParsedEntries = [];
  renderQuickPreview();
}

function toggleQuickCustomerForm() {
  elements.quickCustomerForm.classList.toggle("hidden");
  if (!elements.quickCustomerForm.classList.contains("hidden")) {
    elements.quickCustomerName.focus();
  }
}

async function handleQuickCustomerSubmit(event) {
  event.preventDefault();
  const created = await createCustomer(
    elements.quickCustomerName.value.trim(),
    elements.quickCustomerHeadHouse.value,
  );
  elements.quickCustomerForm.reset();
  elements.quickCustomerForm.classList.add("hidden");
  await refreshState();
  elements.quickCustomer.value = created.id;
  elements.customer.value = created.id;
  alert(`สร้างลูกค้าแล้ว รหัสคือ ${created.code}`);
}

function getQuickEntryIssues(entry) {
  const issues = [];
  if (!entry.customerId) issues.push("ไม่มีลูกค้า");
  if (!entry.roundId) issues.push("ไม่มีงวด");
  if (entry.roundId && !getRound(entry.roundId)?.accepting) issues.push("งวดปิดรับแล้ว");
  if (!entry.betTypeId) issues.push("ไม่มีประเภท");
  const betType = getBetType(entry.betTypeId);
  if (!betType || !isValidNumber(entry.number, betType.digits)) issues.push("เลขไม่ตรงประเภท");
  if (!Number.isFinite(entry.amount) || entry.amount <= 0) issues.push("ไม่พบยอด");
  return issues;
}

async function handleEntrySubmit(event) {
  event.preventDefault();
  const payload = {
    customerId: elements.customer.value,
    roundId: elements.round.value,
    betTypeId: elements.betType.value,
    number: elements.number.value.trim(),
    amount: parseAmount(elements.amount.value),
    note: elements.note.value.trim(),
  };

  try {
    if (state.editingEntryId) {
      await api(`/api/entries/${state.editingEntryId}`, { method: "PUT", body: payload });
    } else {
      await api("/api/entries", { method: "POST", body: payload });
    }
    resetEntryForm();
    await refreshState();
    activateView("entries");
  } catch (error) {
    handleLimitError(error);
  }
}

function resetEntryForm() {
  state.editingEntryId = null;
  elements.entryForm.reset();
  elements.formTitle.textContent = "กรอกแบบละเอียด";
  elements.submitBtn.textContent = "บันทึกรายการ";
  renderSelects();
  renderLimitPreview();
}

function renderEntries() {
  const search = elements.searchInput.value.trim();
  const customer = elements.filterCustomer.value || "all";
  const round = elements.filterRound.value || "all";
  const betType = elements.filterBetType.value || "all";
  const visible = state.entries.filter((entry) => {
    return (
      (!search || entry.number.includes(search)) &&
      (customer === "all" || entry.customer_id === customer) &&
      (round === "all" || entry.round_id === round) &&
      (betType === "all" || entry.bet_type_id === betType)
    );
  });

  elements.recordsBody.innerHTML = "";
  elements.emptyState.classList.toggle("hidden", visible.length > 0);

  visible.forEach((entry) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(getCustomerCode(entry.customer_id))}</td>
      <td>${escapeHtml(getLotteryName(getRound(entry.round_id)?.lottery_id))}</td>
      <td>${escapeHtml(formatRound(getRound(entry.round_id)))}</td>
      <td>${escapeHtml(getBetTypeName(entry.bet_type_id))}</td>
      <td><span class="number-pill">${escapeHtml(entry.number)}</span></td>
      <td class="amount">${money(entry.amount)}</td>
      <td>${escapeHtml(entry.note || "-")}</td>
      <td></td>
    `;
    const actions = elements.recordActionsTemplate.content.cloneNode(true);
    actions.querySelector(".edit-button").addEventListener("click", () => beginEntryEdit(entry.id));
    actions.querySelector(".delete-button").addEventListener("click", () => deleteEntry(entry.id));
    row.lastElementChild.appendChild(actions);
    elements.recordsBody.appendChild(row);
  });
}

function beginEntryEdit(id) {
  const entry = state.entries.find((item) => item.id === id);
  if (!entry) return;
  state.editingEntryId = id;
  activateView("intake");
  renderSelects();
  elements.customer.value = entry.customer_id;
  elements.round.value = entry.round_id;
  elements.betType.value = entry.bet_type_id;
  elements.number.value = entry.number;
  elements.amount.value = entry.amount;
  elements.note.value = entry.note;
  elements.formTitle.textContent = "แก้ไขรายการ";
  elements.submitBtn.textContent = "บันทึกการแก้ไข";
  renderLimitPreview();
}

async function deleteEntry(id) {
  if (!confirm("ลบรายการนี้ใช่หรือไม่")) return;
  await api(`/api/entries/${id}`, { method: "DELETE" });
  await refreshState();
}

async function handleCustomerSubmit(event) {
  event.preventDefault();
  const created = await createCustomer(elements.customerName.value.trim(), elements.customerHeadHouse.value);
  elements.customerForm.reset();
  await refreshState();
  alert(`สร้างลูกค้าแล้ว รหัสคือ ${created.code}`);
}

async function createCustomer(name, headHouseId) {
  return api("/api/customers", {
    method: "POST",
    body: { name, headHouseId },
  });
}

async function handleHeadHouseSubmit(event) {
  event.preventDefault();
  const created = await api("/api/head-houses", {
    method: "POST",
    body: {
      name: elements.headHouseName.value.trim(),
      note: elements.headHouseNote.value.trim(),
    },
  });
  elements.headHouseForm.reset();
  await refreshState();
  alert(`สร้างหัวบ้านแล้ว รหัสคือ ${created.code}`);
}

function renderHeadHouses() {
  elements.headHouseList.innerHTML = state.headHouses
    .map((headHouse) => {
      const customers = state.customers.filter((customer) => customer.head_house_id === headHouse.id).length;
      const amount = sum(
        state.entries
          .filter((entry) => getCustomer(entry.customer_id)?.head_house_id === headHouse.id)
          .map((entry) => entry.amount),
      );
      return `
        <article class="customer-item">
          <div>
            <strong>${escapeHtml(headHouse.code)} · ${escapeHtml(headHouse.name)}</strong>
            <span>${escapeHtml(headHouse.note || "ไม่มีหมายเหตุ")}</span>
          </div>
          <small>${customers.toLocaleString("th-TH")} ลูกค้า · ${money(amount)}</small>
        </article>
      `;
    })
    .join("");
}

function renderCustomers() {
  elements.customerList.innerHTML = state.customers
    .map((customer) => {
      const count = state.entries.filter((entry) => entry.customer_id === customer.id).length;
      return `
        <article class="customer-item">
          <div>
            <strong>${escapeHtml(customer.code)}</strong>
            <span>${escapeHtml(customer.name || "ยังไม่มีชื่อ")} · ${escapeHtml(customer.head_house_code || "-")}</span>
          </div>
          <small>${count.toLocaleString("th-TH")} รายการ</small>
        </article>
      `;
    })
    .join("");
}

async function handleLotterySubmit(event) {
  event.preventDefault();
  await api("/api/lotteries", {
    method: "POST",
    body: { name: elements.lotteryName.value.trim() },
  });
  elements.lotteryForm.reset();
  await refreshState();
}

function renderLotteries() {
  elements.lotteryChips.innerHTML = state.lotteries
    .map((lottery) => {
      const count = state.rounds.filter((round) => round.lottery_id === lottery.id).length;
      return `<span class="chip">${escapeHtml(lottery.name)} ${count.toLocaleString("th-TH")} งวด</span>`;
    })
    .join("");
}

async function handleRoundSubmit(event) {
  event.preventDefault();
  await api("/api/rounds", {
    method: "POST",
    body: {
      lotteryId: elements.roundLottery.value,
      drawDate: elements.roundDate.value,
      drawTime: elements.roundTime.value,
      label: elements.roundLabel.value.trim(),
      closeBeforeMinutes: Number(elements.roundCloseBefore.value),
    },
  });
  elements.roundForm.reset();
  elements.roundDate.value = today();
  elements.roundCloseBefore.value = 15;
  await refreshState();
}

function renderRounds() {
  elements.roundsBody.innerHTML = "";
  state.rounds.forEach((round) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(getLotteryName(round.lottery_id))}</td>
      <td>${escapeHtml(round.label)}</td>
      <td>${longDate(round.draw_date)}</td>
      <td>${escapeHtml(round.draw_time)}</td>
      <td>${round.close_before_minutes.toLocaleString("th-TH")} นาที</td>
      <td>${escapeHtml(formatRoundCutoff(round))}</td>
      <td><span class="status-pill ${roundStatusClass(round)}">${roundStatusLabel(round)}</span></td>
      <td><button class="icon-button toggle-round-button" type="button">${round.status === "open" ? "ปิดงวด" : "เปิดงวด"}</button></td>
    `;
    row.querySelector(".toggle-round-button").addEventListener("click", async () => {
      await api(`/api/rounds/${round.id}`, {
        method: "PUT",
        body: { status: round.status === "open" ? "closed" : "open" },
      });
      await refreshState();
    });
    elements.roundsBody.appendChild(row);
  });
}

async function handleLimitSubmit(event) {
  event.preventDefault();
  const payload = {
    roundId: elements.limitRound.value,
    betTypeId: elements.limitBetType.value,
    number: elements.limitNumber.value.trim(),
    maxAmount: parseAmount(elements.limitAmount.value),
  };

  if (state.editingLimitId) {
    await api(`/api/limits/${state.editingLimitId}`, { method: "PUT", body: payload });
  } else {
    await api("/api/limits", { method: "POST", body: payload });
  }
  resetLimitForm();
  await refreshState();
}

function resetLimitForm() {
  state.editingLimitId = null;
  elements.limitForm.reset();
  elements.limitFormTitle.textContent = "ตั้งค่าอั้นเลข";
  elements.limitSubmitBtn.textContent = "บันทึกอั้นเลข";
  renderSelects();
}

function renderLimits() {
  const statuses = getLimitStatuses();
  elements.limitsBody.innerHTML = "";
  elements.limitsEmptyState.classList.toggle("hidden", statuses.length > 0);

  statuses.forEach((item) => {
    const round = getRound(item.limit.round_id);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(getLotteryName(round?.lottery_id))}</td>
      <td>${escapeHtml(formatRound(round))}</td>
      <td>${escapeHtml(getBetTypeName(item.limit.bet_type_id))}</td>
      <td><span class="number-pill">${escapeHtml(item.limit.number)}</span></td>
      <td class="amount">${money(item.currentAmount)}</td>
      <td class="amount">${money(item.limit.max_amount)}</td>
      <td class="amount">${money(Math.max(item.remaining, 0))}</td>
      <td><span class="status-pill ${item.status}">${statusLabel(item.status)}</span></td>
      <td></td>
    `;
    const actions = elements.limitActionsTemplate.content.cloneNode(true);
    actions.querySelector(".edit-limit-button").addEventListener("click", () => beginLimitEdit(item.limit.id));
    actions.querySelector(".delete-limit-button").addEventListener("click", () => deleteLimit(item.limit.id));
    row.lastElementChild.appendChild(actions);
    elements.limitsBody.appendChild(row);
  });
}

function beginLimitEdit(id) {
  const limit = state.limits.find((item) => item.id === id);
  if (!limit) return;
  state.editingLimitId = id;
  activateView("limits");
  renderSelects();
  elements.limitRound.value = limit.round_id;
  elements.limitBetType.value = limit.bet_type_id;
  elements.limitNumber.value = limit.number;
  elements.limitAmount.value = limit.max_amount;
  elements.limitFormTitle.textContent = "แก้ไขอั้นเลข";
  elements.limitSubmitBtn.textContent = "บันทึกการแก้ไข";
}

async function deleteLimit(id) {
  if (!confirm("ลบอั้นเลขนี้ใช่หรือไม่")) return;
  await api(`/api/limits/${id}`, { method: "DELETE" });
  await refreshState();
}

function renderPayouts() {
  elements.payoutMatrix.innerHTML = state.lotteries
    .map((lottery) => {
      const rows = state.betTypes
        .map((betType) => {
          const rate = state.payoutRates.find(
            (item) => item.lottery_id === lottery.id && item.bet_type_id === betType.id,
          )?.rate ?? 0;
          return `
            <label class="payout-row">
              <span>${escapeHtml(betType.name)}</span>
              <input data-lottery-id="${lottery.id}" data-bet-type-id="${betType.id}" inputmode="decimal" value="${rate}" />
            </label>
          `;
        })
        .join("");
      return `
        <section class="chart-card">
          <h3>${escapeHtml(lottery.name)}</h3>
          <div class="payout-list">${rows}</div>
        </section>
      `;
    })
    .join("");

  elements.payoutMatrix.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", async () => {
      await api("/api/payout-rates", {
        method: "POST",
        body: {
          lotteryId: input.dataset.lotteryId,
          betTypeId: input.dataset.betTypeId,
          rate: parseAmount(input.value),
        },
      });
      await refreshState();
    });
  });
}

function renderResultEditor() {
  const roundId = elements.resultRound.value || state.rounds[0]?.id;
  if (!roundId) {
    elements.resultEditor.innerHTML = '<div class="empty-state">ยังไม่มีงวด</div>';
    return;
  }

  elements.resultEditor.innerHTML = state.betTypes
    .map((betType) => {
      const numbers = state.results
        .filter((result) => result.round_id === roundId && result.bet_type_id === betType.id)
        .map((result) => result.number)
        .join(" ");
      return `
        <label class="result-row">
          <span>${escapeHtml(betType.name)}</span>
          <input data-bet-type-id="${betType.id}" value="${escapeHtml(numbers)}" placeholder="คั่นหลายเลขด้วยช่องว่าง" />
          <button class="button button-secondary save-result-button" type="button">บันทึก</button>
        </label>
      `;
    })
    .join("");

  elements.resultEditor.querySelectorAll(".save-result-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const row = button.closest(".result-row");
      const input = row.querySelector("input");
      await api("/api/results", {
        method: "POST",
        body: {
          roundId,
          betTypeId: input.dataset.betTypeId,
          numbers: input.value,
        },
      });
      await refreshState();
    });
  });
}

async function renderSettlement() {
  const roundId = elements.reportRound.value || state.rounds[0]?.id;
  if (!roundId) {
    elements.reportStake.textContent = money(0);
    elements.reportPayout.textContent = money(0);
    elements.reportProfit.textContent = money(0);
    elements.reportWinnerCount.textContent = "0";
    elements.winnersBody.innerHTML = "";
    return;
  }

  try {
    const settlement = await api(`/api/settlements?roundId=${encodeURIComponent(roundId)}`);
    elements.reportStake.textContent = money(settlement.totalStake);
    elements.reportPayout.textContent = money(settlement.totalPayout);
    elements.reportProfit.textContent = money(settlement.profit);
    elements.reportWinnerCount.textContent = settlement.winnerCount.toLocaleString("th-TH");
    elements.winnersBody.innerHTML = settlement.winners
      .map(
        (winner) => `
          <tr>
            <td>${escapeHtml(winner.customer_code)}</td>
            <td>${escapeHtml(winner.bet_type_name)}</td>
            <td><span class="number-pill">${escapeHtml(winner.number)}</span></td>
            <td class="amount">${money(winner.amount)}</td>
            <td class="amount">${winner.rate}</td>
            <td class="amount">${money(winner.payout)}</td>
          </tr>
        `,
      )
      .join("");
  } catch {
    elements.winnersBody.innerHTML = "";
  }
}

async function renderHeadHouseReport() {
  const headHouseId =
    state.user?.role === "head_house_viewer" ? state.user.headHouseId : elements.headHouseReportSelect.value;

  if (!headHouseId) {
    elements.headHouseReportStake.textContent = money(0);
    elements.headHouseReportPayout.textContent = money(0);
    elements.headHouseReportProfit.textContent = money(0);
    elements.headHouseReportRoundCount.textContent = "0";
    elements.headHouseReportBody.innerHTML = "";
    return;
  }

  try {
    const summary = await api(`/api/head-house-summary?headHouseId=${encodeURIComponent(headHouseId)}`);
    elements.headHouseReportStake.textContent = money(summary.totalStake);
    elements.headHouseReportPayout.textContent = money(summary.totalPayout);
    elements.headHouseReportProfit.textContent = money(summary.profit);
    elements.headHouseReportRoundCount.textContent = summary.roundCount.toLocaleString("th-TH");
    elements.headHouseReportBody.innerHTML = summary.rounds
      .map(
        (round) => `
          <tr>
            <td>${escapeHtml(round.lotteryName)}</td>
            <td>${escapeHtml(round.roundLabel)}</td>
            <td>${longDate(round.drawDate)} ${escapeHtml(round.drawTime)}</td>
            <td class="amount">${money(round.totalStake)}</td>
            <td class="amount">${money(round.totalPayout)}</td>
            <td class="amount">${money(round.profit)}</td>
          </tr>
        `,
      )
      .join("");
  } catch {
    elements.headHouseReportBody.innerHTML = "";
  }
}

async function handleUserSubmit(event) {
  event.preventDefault();
  await api("/api/users", {
    method: "POST",
    body: {
      username: elements.userUsername.value.trim(),
      password: elements.userPassword.value,
      role: elements.userRole.value,
      headHouseId: elements.userRole.value === "head_house_viewer" ? elements.userHeadHouse.value : null,
    },
  });
  elements.userForm.reset();
  syncUserHeadHouseField();
  await refreshState();
}

function renderUsers() {
  if (state.user?.role !== "admin") {
    elements.usersBody.innerHTML = "";
    return;
  }

  elements.usersBody.innerHTML = state.users
    .map(
      (user) => `
        <tr>
          <td>${escapeHtml(user.username)}</td>
          <td>${escapeHtml(user.role)}</td>
          <td>${escapeHtml(user.head_house_code || "-")}</td>
          <td>${longDate(user.created_at.slice(0, 10))}</td>
        </tr>
      `,
    )
    .join("");
}

function configureRoleAccess() {
  const canManageUsers = state.user?.role === "admin";
  const isHeadHouseViewer = state.user?.role === "head_house_viewer";
  elements.usersNavButton.classList.toggle("hidden", !canManageUsers);
  elements.usersView.hidden = !canManageUsers;
  elements.headHousesNavButton.classList.toggle("hidden", !canManageUsers);
  elements.headHousesView.hidden = !canManageUsers;
  elements.headHouseReportPickerWrap.classList.toggle("hidden", isHeadHouseViewer);
  elements.exportBtn.classList.toggle("hidden", isHeadHouseViewer);
  elements.staffOnlyNavButtons.forEach((button) => button.classList.toggle("hidden", isHeadHouseViewer));
}

function syncUserHeadHouseField() {
  elements.userHeadHouseWrap.classList.toggle("hidden", elements.userRole.value !== "head_house_viewer");
}

function renderLimitPreview() {
  const roundId = elements.round.value;
  const betTypeId = elements.betType.value;
  const number = elements.number.value.trim();
  const amount = parseAmount(elements.amount.value);
  const betType = getBetType(betTypeId);

  if (!roundId || !betType || !isValidNumber(number, betType.digits)) {
    elements.limitPreview.classList.add("hidden");
    return;
  }

  const item = getLimitStatuses().find(
    (status) => status.limit.round_id === roundId && status.limit.bet_type_id === betTypeId && status.limit.number === number,
  );

  if (!item) {
    elements.limitPreview.classList.add("hidden");
    return;
  }

  const projected = item.currentAmount + (Number.isFinite(amount) ? amount : 0);
  const ratio = item.limit.max_amount ? projected / item.limit.max_amount : 0;
  const status = ratio >= 1 ? "full" : ratio >= 0.8 ? "warning" : "normal";
  elements.limitPreview.className = `limit-preview ${status}`;
  elements.limitPreview.innerHTML = `
    <strong>มีอั้นเลขตรงกัน</strong>
    <span>ปัจจุบัน ${money(item.currentAmount)} / เพดาน ${money(item.limit.max_amount)}</span>
    <span>หลังบันทึก ${money(projected)} (${percent(ratio)})</span>
  `;
}

function getLimitStatuses() {
  return state.limits.map((limit) => {
    const currentAmount = sum(
      state.entries
        .filter(
          (entry) =>
            entry.round_id === limit.round_id &&
            entry.bet_type_id === limit.bet_type_id &&
            entry.number === limit.number,
        )
        .map((entry) => entry.amount),
    );
    const percentValue = limit.max_amount ? currentAmount / limit.max_amount : 0;
    return {
      limit,
      currentAmount,
      remaining: limit.max_amount - currentAmount,
      percent: percentValue,
      status: percentValue >= 1 ? "full" : percentValue >= 0.8 ? "warning" : "normal",
    };
  });
}

async function exportData() {
  const payload = await api("/api/export");
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `lottery-manager-${today()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function inferLottery(text) {
  const normalized = text.toLowerCase();
  for (const lottery of state.lotteries) {
    const aliases = [...(LOTTERY_ALIASES[lottery.id] || []), lottery.name];
    if (aliases.some((alias) => normalized.includes(alias.toLowerCase()))) {
      return lottery.id;
    }
  }
  return "";
}

function inferCustomer(text) {
  const normalized = text.toUpperCase();
  return state.customers.find((customer) => new RegExp(`\\b${escapeRegExp(customer.code)}\\b`, "i").test(normalized))?.id || "";
}

function inferBetType(text) {
  return BET_TYPE_PATTERNS.find((item) => item.patterns.some((pattern) => pattern.test(text)))?.id || "";
}

function inferBetTypeFromDigits(digits) {
  if (digits === 1) return "run_top";
  if (digits === 2) return "two_top";
  if (digits === 3) return "three_top";
  return "";
}

function stripParserNoise(text) {
  let stripped = text.replace(/(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:บาท|บ)/gi, " ");
  BET_TYPE_PATTERNS.forEach((item) => {
    item.patterns.forEach((pattern) => {
      stripped = stripped.replace(pattern, " ");
    });
  });
  Object.values(LOTTERY_ALIASES)
    .flat()
    .forEach((alias) => {
      stripped = stripped.replaceAll(alias, " ");
    });
  state.lotteries.forEach((lottery) => {
    stripped = stripped.replaceAll(lottery.name, " ");
  });
  state.customers.forEach((customer) => {
    stripped = stripped.replace(new RegExp(`\\b${escapeRegExp(customer.code)}\\b`, "gi"), " ");
  });
  return stripped;
}

function handleLimitError(error) {
  if (error?.payload?.error === "limit_exceeded") {
    alert("เลขนี้เกินเพดานอั้นแล้ว ต้องเพิ่มเพดานก่อนจึงจะรับต่อได้");
    return;
  }
  if (error?.payload?.error === "round_not_accepting") {
    alert("งวดนี้ปิดรับแล้ว เลือกงวดที่ยังเปิดรับหรือแก้เวลาในหน้างวดก่อน");
    return;
  }
  alert("บันทึกไม่สำเร็จ");
}

async function api(url, { method = "GET", body } = {}) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    const error = new Error(payload?.error || `http_${response.status}`);
    error.payload = payload;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

function preserveSelect(select, html, fallbackValue = "") {
  const previous = select.value;
  select.innerHTML = html;
  if ([...select.options].some((item) => item.value === previous)) {
    select.value = previous;
  } else if (fallbackValue && [...select.options].some((item) => item.value === fallbackValue)) {
    select.value = fallbackValue;
  }
}

function option(value, label) {
  return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
}

function formatCustomer(customer) {
  const headHouse = customer.head_house_code ? ` · ${customer.head_house_code}` : "";
  return customer.name ? `${customer.code} · ${customer.name}${headHouse}` : `${customer.code}${headHouse}`;
}

function formatHeadHouse(headHouse) {
  return `${headHouse.code} · ${headHouse.name}`;
}

function formatRound(round) {
  if (!round) return "-";
  return `${round.lottery_name || getLotteryName(round.lottery_id)} · ${round.label} · ${shortDate(round.draw_date)} ${round.draw_time}`;
}

function findLatestOpenRound(lotteryId) {
  return state.rounds.find((round) => round.lottery_id === lotteryId && round.accepting);
}

function getRound(id) {
  return state.rounds.find((round) => round.id === id);
}

function getCustomer(id) {
  return state.customers.find((customer) => customer.id === id);
}

function getBetType(id) {
  return state.betTypes.find((betType) => betType.id === id);
}

function getBetTypeName(id) {
  return getBetType(id)?.name || "-";
}

function getCustomerCode(id) {
  return state.customers.find((customer) => customer.id === id)?.code || "-";
}

function getLotteryName(id) {
  return state.lotteries.find((lottery) => lottery.id === id)?.name || "-";
}

function syncNumberLength(input, betTypeId) {
  const digits = getBetType(betTypeId)?.digits || 3;
  input.maxLength = digits;
  input.placeholder = digits === 1 ? "เช่น 5" : digits === 2 ? "เช่น 45" : "เช่น 123";
  input.value = input.value.replace(/\D/g, "").slice(0, digits);
}

function isValidNumber(value, digits) {
  return new RegExp(`^\\d{${digits}}$`).test(String(value));
}

function parseAmount(value) {
  return Number(String(value || "").replaceAll(",", ""));
}

function money(value) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function percent(value) {
  return new Intl.NumberFormat("th-TH", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function longDate(value) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function shortDate(value) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function formatRoundCutoff(round) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(new Date(round.close_at));
}

function roundStatusLabel(round) {
  if (round.accepting) return "เปิดรับ";
  return round.status === "closed" ? "ปิดงวด" : "ปิดรับแล้ว";
}

function roundStatusClass(round) {
  if (round.accepting) return "normal";
  return round.status === "closed" ? "full" : "warning";
}

function today() {
  const current = new Date();
  const offset = current.getTimezoneOffset();
  return new Date(current.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function statusLabel(status) {
  if (status === "full") return "เต็ม";
  if (status === "warning") return "ใกล้เต็ม";
  return "ปกติ";
}

function sum(values) {
  return values.reduce((total, value) => total + Number(value || 0), 0);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
