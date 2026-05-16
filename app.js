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
  reports: { eyebrow: "กระแสเงินและผลประกอบการ", title: "บัญชีการเงิน" },
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

const LOTTERY_CATEGORIES = [
  { id: "government", label: "รัฐบาล" },
  { id: "daily", label: "หวยรายวัน" },
  { id: "thai", label: "หวยไทย" },
  { id: "foreign", label: "หวยต่างประเทศ" },
  { id: "stock", label: "หวยหุ้น" },
  { id: "stock_vip", label: "หวยหุ้น VIP" },
  { id: "other", label: "หวยอื่น ๆ" },
];

const state = {
  user: null,
  headHouses: [],
  lotteries: [],
  customers: [],
  rounds: [],
  scheduleTemplates: [],
  betTypes: [],
  payoutRates: [],
  limits: [],
  entries: [],
  results: [],
  users: [],
  editingEntryId: null,
  editingLimitId: null,
  editingHeadHouseId: null,
  editingCustomerId: null,
  editingRoundId: null,
  editingScheduleId: null,
  editingUserId: null,
  quickParsedEntries: [],
  ticketDraftEntries: [],
  ticketBetTypeId: "two_top",
  latestViewerCredentials: null,
  announcedRoundIds: new Set(),
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
  sidebarUsername: document.querySelector("#sidebarUsername"),
  sidebarRole: document.querySelector("#sidebarRole"),
  sidebarBalance: document.querySelector("#sidebarBalance"),
  sidebarProfileBtn: document.querySelector("#sidebarProfileBtn"),
  sidebarLogoutBtn: document.querySelector("#sidebarLogoutBtn"),
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
  marketSummary: document.querySelector("#marketSummary"),
  lotteryBoard: document.querySelector("#lotteryBoard"),
  closingSoonBanner: document.querySelector("#closingSoonBanner"),
  limitWatchList: document.querySelector("#limitWatchList"),
  recentEntriesList: document.querySelector("#recentEntriesList"),
  ticketCountdown: document.querySelector("#ticketCountdown"),
  ticketAcceptingState: document.querySelector("#ticketAcceptingState"),
  ticketRoundTitle: document.querySelector("#ticketRoundTitle"),
  ticketRoundDate: document.querySelector("#ticketRoundDate"),
  ticketFlag: document.querySelector("#ticketFlag"),
  ticketComposeRoundLabel: document.querySelector("#ticketComposeRoundLabel"),
  ticketComposeDate: document.querySelector("#ticketComposeDate"),
  ticketSummaryRoundLabel: document.querySelector("#ticketSummaryRoundLabel"),
  ticketCustomer: document.querySelector("#ticketCustomerInput"),
  ticketRound: document.querySelector("#ticketRoundInput"),
  ticketRateLabel: document.querySelector("#ticketRateLabel"),
  ticketBetTypeTabs: document.querySelector("#ticketBetTypeTabs"),
  ticketNumber: document.querySelector("#ticketNumberInput"),
  ticketAmount: document.querySelector("#ticketAmountInput"),
  addTicketEntryBtn: document.querySelector("#addTicketEntryBtn"),
  ticketLimitPreview: document.querySelector("#ticketLimitPreview"),
  ticketDraftBody: document.querySelector("#ticketDraftBody"),
  ticketDraftEmpty: document.querySelector("#ticketDraftEmpty"),
  clearTicketBtn: document.querySelector("#clearTicketBtn"),
  ticketNote: document.querySelector("#ticketNoteInput"),
  ticketTotalAmount: document.querySelector("#ticketTotalAmount"),
  saveTicketBtn: document.querySelector("#saveTicketBtn"),
  ticketHistoryList: document.querySelector("#ticketHistoryList"),
  ticketLimitList: document.querySelector("#ticketLimitList"),
  ticketRecentList: document.querySelector("#ticketRecentList"),
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
  entryGroups: document.querySelector("#entryGroups"),
  emptyState: document.querySelector("#emptyState"),
  filterCustomer: document.querySelector("#filterCustomer"),
  filterRound: document.querySelector("#filterRound"),
  filterBetType: document.querySelector("#filterBetType"),
  searchInput: document.querySelector("#searchInput"),
  customerForm: document.querySelector("#customerForm"),
  customerFormTitle: document.querySelector("#customerFormTitle"),
  resetCustomerBtn: document.querySelector("#resetCustomerBtn"),
  customerName: document.querySelector("#customerNameInput"),
  customerHeadHouse: document.querySelector("#customerHeadHouseInput"),
  customerSubmitBtn: document.querySelector("#customerSubmitBtn"),
  customerList: document.querySelector("#customerList"),
  headHouseForm: document.querySelector("#headHouseForm"),
  headHouseFormTitle: document.querySelector("#headHouseFormTitle"),
  resetHeadHouseBtn: document.querySelector("#resetHeadHouseBtn"),
  headHouseName: document.querySelector("#headHouseNameInput"),
  headHouseNote: document.querySelector("#headHouseNoteInput"),
  headHouseCommission: document.querySelector("#headHouseCommissionInput"),
  headHouseSubmitBtn: document.querySelector("#headHouseSubmitBtn"),
  headHouseList: document.querySelector("#headHouseList"),
  viewerCredentialCard: document.querySelector("#viewerCredentialCard"),
  viewerCredentialSummary: document.querySelector("#viewerCredentialSummary"),
  copyViewerCredentialsBtn: document.querySelector("#copyViewerCredentialsBtn"),
  lotteryForm: document.querySelector("#lotteryForm"),
  lotteryName: document.querySelector("#lotteryNameInput"),
  lotteryCategory: document.querySelector("#lotteryCategoryInput"),
  lotteryChips: document.querySelector("#lotteryChips"),
  roundForm: document.querySelector("#roundForm"),
  roundFormTitle: document.querySelector("#roundFormTitle"),
  resetRoundBtn: document.querySelector("#resetRoundBtn"),
  roundLottery: document.querySelector("#roundLotteryInput"),
  roundOpenDate: document.querySelector("#roundOpenDateInput"),
  roundOpenTime: document.querySelector("#roundOpenTimeInput"),
  roundDate: document.querySelector("#roundDateInput"),
  roundTime: document.querySelector("#roundTimeInput"),
  roundLabel: document.querySelector("#roundLabelInput"),
  roundCloseBefore: document.querySelector("#roundCloseBeforeInput"),
  roundSubmitBtn: document.querySelector("#roundSubmitBtn"),
  roundsBody: document.querySelector("#roundsBody"),
  scheduleForm: document.querySelector("#scheduleForm"),
  scheduleFormTitle: document.querySelector("#scheduleFormTitle"),
  resetScheduleBtn: document.querySelector("#resetScheduleBtn"),
  scheduleLottery: document.querySelector("#scheduleLotteryInput"),
  scheduleFrequency: document.querySelector("#scheduleFrequencyInput"),
  scheduleWeekdays: document.querySelector("#scheduleWeekdaysInput"),
  scheduleMonthDays: document.querySelector("#scheduleMonthDaysInput"),
  scheduleOpenDaysBefore: document.querySelector("#scheduleOpenDaysBeforeInput"),
  scheduleOpenTime: document.querySelector("#scheduleOpenTimeInput"),
  scheduleDrawTime: document.querySelector("#scheduleDrawTimeInput"),
  scheduleCloseBefore: document.querySelector("#scheduleCloseBeforeInput"),
  scheduleSourceNote: document.querySelector("#scheduleSourceNoteInput"),
  scheduleActive: document.querySelector("#scheduleActiveInput"),
  scheduleSubmitBtn: document.querySelector("#scheduleSubmitBtn"),
  generateRoundsBtn: document.querySelector("#generateRoundsBtn"),
  scheduleTemplatesBody: document.querySelector("#scheduleTemplatesBody"),
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
  resultsOverviewBody: document.querySelector("#resultsOverviewBody"),
  reportRound: document.querySelector("#reportRoundInput"),
  ledgerDebit: document.querySelector("#ledgerDebit"),
  ledgerCredit: document.querySelector("#ledgerCredit"),
  ledgerBalance: document.querySelector("#ledgerBalance"),
  ledgerBody: document.querySelector("#ledgerBody"),
  reportStake: document.querySelector("#reportStake"),
  reportPayout: document.querySelector("#reportPayout"),
  reportProfit: document.querySelector("#reportProfit"),
  reportWinnerCount: document.querySelector("#reportWinnerCount"),
  winnersBody: document.querySelector("#winnersBody"),
  headHouseReportPickerWrap: document.querySelector("#headHouseReportPickerWrap"),
  headHouseReportSelect: document.querySelector("#headHouseReportSelect"),
  headHouseReportStake: document.querySelector("#headHouseReportStake"),
  headHouseReportPayout: document.querySelector("#headHouseReportPayout"),
  headHouseReportCommission: document.querySelector("#headHouseReportCommission"),
  headHouseReportNetPayable: document.querySelector("#headHouseReportNetPayable"),
  headHouseReportFormula: document.querySelector("#headHouseReportFormula"),
  headHouseReportBody: document.querySelector("#headHouseReportBody"),
  userForm: document.querySelector("#userForm"),
  userFormTitle: document.querySelector("#userFormTitle"),
  resetUserBtn: document.querySelector("#resetUserBtn"),
  userUsername: document.querySelector("#userUsernameInput"),
  userPassword: document.querySelector("#userPasswordInput"),
  userPasswordHint: document.querySelector("#userPasswordHint"),
  userRole: document.querySelector("#userRoleInput"),
  userHeadHouseWrap: document.querySelector("#userHeadHouseWrap"),
  userHeadHouse: document.querySelector("#userHeadHouseInput"),
  userSubmitBtn: document.querySelector("#userSubmitBtn"),
  usersBody: document.querySelector("#usersBody"),
  recordActionsTemplate: document.querySelector("#recordActionsTemplate"),
  limitActionsTemplate: document.querySelector("#limitActionsTemplate"),
};

initialize();

async function initialize() {
  bindEvents();
  elements.roundDate.value = today();
  elements.roundOpenDate.value = today();
  elements.roundOpenTime.value = "00:00";
  resetScheduleForm();
  window.setInterval(renderTimeSensitiveUi, 1000);
  await bootAuth();
}

function bindEvents() {
  elements.setupForm.addEventListener("submit", handleSetup);
  elements.loginForm.addEventListener("submit", handleLogin);
  elements.logoutBtn.addEventListener("click", handleLogout);
  elements.sidebarLogoutBtn.addEventListener("click", handleLogout);
  elements.sidebarProfileBtn.addEventListener("click", () => activateView("users"));
  elements.exportBtn.addEventListener("click", exportData);

  elements.navButtons.forEach((button) => {
    button.addEventListener("click", () => activateView(button.dataset.viewTarget));
  });

  elements.ticketCustomer.addEventListener("change", renderTicketWorkbench);
  elements.ticketRound.addEventListener("change", renderTicketWorkbench);
  elements.ticketNumber.addEventListener("input", renderTicketLimitPreview);
  elements.ticketAmount.addEventListener("input", renderTicketLimitPreview);
  elements.ticketNumber.addEventListener("keydown", handleTicketNumberKeydown);
  elements.ticketAmount.addEventListener("keydown", handleTicketAmountKeydown);
  elements.addTicketEntryBtn.addEventListener("click", addTicketDraftEntry);
  elements.clearTicketBtn.addEventListener("click", clearTicketDraft);
  elements.saveTicketBtn.addEventListener("click", saveTicketDraft);

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
  elements.resetCustomerBtn.addEventListener("click", resetCustomerForm);
  elements.headHouseForm.addEventListener("submit", handleHeadHouseSubmit);
  elements.resetHeadHouseBtn.addEventListener("click", resetHeadHouseForm);
  elements.copyViewerCredentialsBtn.addEventListener("click", copyViewerCredentials);
  elements.lotteryForm.addEventListener("submit", handleLotterySubmit);
  elements.roundForm.addEventListener("submit", handleRoundSubmit);
  elements.resetRoundBtn.addEventListener("click", resetRoundForm);
  elements.scheduleForm.addEventListener("submit", handleScheduleSubmit);
  elements.resetScheduleBtn.addEventListener("click", resetScheduleForm);
  elements.generateRoundsBtn.addEventListener("click", generateUpcomingRounds);
  elements.scheduleFrequency.addEventListener("change", syncScheduleFrequencyFields);

  elements.limitForm.addEventListener("submit", handleLimitSubmit);
  elements.resetLimitBtn.addEventListener("click", resetLimitForm);
  elements.limitBetType.addEventListener("change", () => syncNumberLength(elements.limitNumber, elements.limitBetType.value));

  elements.resultRound.addEventListener("change", renderResultEditor);
  elements.reportRound.addEventListener("change", renderSettlement);
  elements.userForm.addEventListener("submit", handleUserSubmit);
  elements.resetUserBtn.addEventListener("click", resetUserForm);
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
  elements.sidebarUsername.textContent = state.user.username;
  elements.sidebarRole.textContent = state.user.role;
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
  renderTicketWorkbench();
  renderEntries();
  renderHeadHouses();
  renderCustomers();
  renderLotteries();
  renderScheduleTemplates();
  renderRounds();
  renderLimits();
  renderPayouts();
  renderResultEditor();
  renderResultsOverview();
  renderFinanceLedger();
  renderSettlement();
  renderHeadHouseReport();
  renderUsers();
  renderQuickPreview();
  renderLimitPreview();
  syncUserHeadHouseField();
  renderSidebarSummary();
}

function renderSelects() {
  const headHouseOptions = state.headHouses.map((headHouse) => option(headHouse.id, formatHeadHouse(headHouse))).join("");
  const customerOptions = state.customers.map((customer) => option(customer.id, formatCustomer(customer))).join("");
  const lotteryOptions = state.lotteries.map((lottery) => option(lottery.id, lottery.name)).join("");
  const roundOptions = state.rounds.map((round) => option(round.id, formatRound(round))).join("");
  const acceptingRoundOptions = getAcceptingRounds()
    .map((round) => option(round.id, formatRound(round)))
    .join("");
  const betTypeOptions = state.betTypes.map((betType) => option(betType.id, betType.name)).join("");

  preserveSelect(elements.quickCustomer, customerOptions);
  preserveSelect(elements.ticketCustomer, customerOptions);
  preserveSelect(elements.quickCustomerHeadHouse, headHouseOptions, "direct");
  preserveSelect(elements.customer, customerOptions);
  preserveSelect(elements.customerHeadHouse, headHouseOptions, "direct");
  preserveSelect(elements.filterCustomer, option("all", "ทั้งหมด") + customerOptions, "all");
  preserveSelect(elements.quickLottery, lotteryOptions);
  preserveSelect(elements.roundLottery, lotteryOptions);
  preserveSelect(elements.scheduleLottery, lotteryOptions);
  preserveSelect(elements.quickBetType, betTypeOptions, "two_top");
  preserveSelect(elements.betType, betTypeOptions, "two_top");
  preserveSelect(elements.filterBetType, option("all", "ทั้งหมด") + betTypeOptions, "all");
  preserveSelect(elements.round, acceptingRoundOptions || option("", "ยังไม่มีงวดที่เปิดรับ"));
  preserveSelect(elements.ticketRound, acceptingRoundOptions || option("", "ยังไม่มีงวดที่เปิดรับ"));
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
  syncNumberLength(elements.ticketNumber, state.ticketBetTypeId);
}

function renderQuickRoundOptions() {
  const lotteryId = elements.quickLottery.value || state.lotteries[0]?.id;
  const options = getAcceptingRounds(lotteryId)
    .map((round) => option(round.id, formatRound(round)))
    .join("");
  preserveSelect(elements.quickRound, options || option("", "ยังไม่มีงวดที่เปิดรับ"));
}

function renderDashboard() {
  const limitStatuses = getLimitStatuses();
  elements.totalAmount.textContent = money(sum(state.entries.map((entry) => entry.amount)));
  elements.totalEntries.textContent = state.entries.length.toLocaleString("th-TH");
  elements.totalCustomers.textContent = state.customers.length.toLocaleString("th-TH");
  elements.openRoundsCount.textContent = state.rounds.filter((round) => round.accepting).length.toLocaleString("th-TH");
  elements.totalLimits.textContent = state.limits.length.toLocaleString("th-TH");
  elements.nearLimitCount.textContent = limitStatuses.filter((item) => item.status !== "normal").length.toLocaleString("th-TH");

  renderLimitWatchList(limitStatuses);
  renderRecentEntries();
  renderMarketSummary();
  renderLotteryBoard();
  renderClosingSoonBanner();
}

function renderMarketSummary() {
  const openRounds = state.rounds.filter((round) => round.accepting);
  const closingSoon = openRounds.filter((round) => {
    const remainingMs = new Date(round.close_at).getTime() - Date.now();
    return remainingMs > 0 && remainingMs <= 60 * 60 * 1000;
  }).length;
  const closedProducts = state.lotteries.filter((lottery) => !getDisplayRoundForLottery(lottery.id)?.accepting).length;

  elements.marketSummary.innerHTML = `
    <span>เปิดรับ ${openRounds.length.toLocaleString("th-TH")} งวด</span>
    <span>ใกล้ปิด ${closingSoon.toLocaleString("th-TH")} งวด</span>
    <span>ยังไม่เปิด ${closedProducts.toLocaleString("th-TH")} หวย</span>
  `;
}

function renderSidebarSummary() {
  elements.sidebarBalance.textContent = money(sum(state.entries.map((entry) => entry.amount)));
}

function renderLotteryBoard() {
  elements.lotteryBoard.innerHTML = LOTTERY_CATEGORIES.map((category) => {
    const lotteries = state.lotteries.filter((lottery) => (lottery.category || "other") === category.id);
    if (!lotteries.length) return "";

    return `
      <section class="lottery-category">
        <div class="lottery-category-heading">
          <h2>${escapeHtml(category.label)}</h2>
          <span>${lotteries.length.toLocaleString("th-TH")} หวย</span>
        </div>
        <div class="lottery-card-grid">
          ${lotteries
            .map((lottery) => {
              const round = getDisplayRoundForLottery(lottery.id);
              const status = getRoundTimingStatus(round);
              return `
                <button
                  class="lottery-card ${status.cardClass}"
                  type="button"
                  data-lottery-id="${escapeHtml(lottery.id)}"
                  ${round ? "" : "disabled"}
                >
                  <span class="lottery-card-flag ${getLotteryFlagClass(lottery.id)}" aria-hidden="true"></span>
                  <strong>${escapeHtml(lottery.name)}</strong>
                  <span>${round ? escapeHtml(round.label) : "ยังไม่มีงวด"}</span>
                  <small>${round ? `ปิดรับ ${formatRoundCloseTime(round)}` : "-"}</small>
                  <em>${round ? `${status.label}${round.accepting ? ` ${formatCountdownCompact(round)}` : ""}` : "ยังไม่ตั้งงวด"}</em>
                </button>
              `;
            })
            .join("")}
        </div>
      </section>
    `;
  }).join("");

  elements.lotteryBoard.querySelectorAll("[data-lottery-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const round = getDisplayRoundForLottery(button.dataset.lotteryId);
      if (!round?.accepting) return;
      activateView("intake");
      elements.ticketRound.value = round.id;
      renderTicketWorkbench();
    });
  });
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

function renderTicketWorkbench() {
  renderTicketBetTypeTabs();
  renderTicketHeader();
  renderTicketDraft();
  renderTicketLimitPreview();
  renderTicketHistory();
  renderTicketLimits();
  renderTicketRecentEntries();
}

function renderTicketHeader() {
  const round = getRound(elements.ticketRound.value);
  if (!round) {
    elements.ticketRoundTitle.textContent = "เลือกงวดที่ต้องการรับรายการ";
    elements.ticketRoundDate.textContent = "-";
    elements.ticketCountdown.textContent = "ยังไม่เลือกงวด";
    elements.ticketAcceptingState.className = "status-pill warning";
    elements.ticketAcceptingState.textContent = "รอเลือกงวด";
    elements.ticketRateLabel.textContent = "-";
    elements.ticketFlag.className = "flag flag-generic large-flag";
    elements.ticketComposeRoundLabel.textContent = "-";
    elements.ticketComposeDate.textContent = "-";
    elements.ticketSummaryRoundLabel.textContent = "-";
    return;
  }

  elements.ticketRoundTitle.textContent = `${getLotteryName(round.lottery_id)} · ${round.label}`;
  elements.ticketRoundDate.textContent = `${longDate(round.draw_date)} ${round.draw_time}`;
  elements.ticketAcceptingState.className = `status-pill ${roundStatusClass(round)}`;
  elements.ticketAcceptingState.textContent = roundStatusLabel(round);
  elements.ticketCountdown.textContent = formatCountdown(round);
  elements.ticketRateLabel.textContent = `${getBetTypeName(state.ticketBetTypeId)} บาทละ ${formatRate(getPayoutRate(round.lottery_id, state.ticketBetTypeId))}`;
  elements.ticketFlag.className = `flag ${getLotteryFlagClass(round.lottery_id)} large-flag`;
  elements.ticketComposeRoundLabel.textContent = `${getLotteryName(round.lottery_id)} · ${round.label}`;
  elements.ticketComposeDate.textContent = shortDate(round.draw_date);
  elements.ticketSummaryRoundLabel.textContent = `${getLotteryName(round.lottery_id)} · ${round.label}`;
}

function renderTicketBetTypeTabs() {
  elements.ticketBetTypeTabs.innerHTML = state.betTypes
    .map(
      (betType) => `
        <button
          class="ticket-tab ${betType.id === state.ticketBetTypeId ? "is-active" : ""}"
          type="button"
          data-ticket-bet-type="${escapeHtml(betType.id)}"
        >
          ${escapeHtml(shortBetTypeName(betType))}
        </button>
      `,
    )
    .join("");

  elements.ticketBetTypeTabs.querySelectorAll("[data-ticket-bet-type]").forEach((button) => {
    button.addEventListener("click", () => {
      state.ticketBetTypeId = button.dataset.ticketBetType;
      syncNumberLength(elements.ticketNumber, state.ticketBetTypeId);
      renderTicketWorkbench();
      elements.ticketNumber.focus();
    });
  });
}

function handleTicketNumberKeydown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    if (elements.ticketAmount.value.trim()) {
      addTicketDraftEntry();
    } else {
      elements.ticketAmount.focus();
    }
  }
}

function handleTicketAmountKeydown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    addTicketDraftEntry();
  }
}

function addTicketDraftEntry() {
  const customerId = elements.ticketCustomer.value;
  const roundId = elements.ticketRound.value;
  const betTypeId = state.ticketBetTypeId;
  const number = elements.ticketNumber.value.trim();
  const amount = parseAmount(elements.ticketAmount.value);
  const issues = getDraftIssues({ customerId, roundId, betTypeId, number, amount });

  if (issues.length) {
    alert(issues.join(", "));
    return;
  }

  const firstEntry = state.ticketDraftEntries[0];
  if (firstEntry && (firstEntry.customerId !== customerId || firstEntry.roundId !== roundId)) {
    alert("หนึ่งโพยต้องเป็นลูกค้าและงวดเดียวกัน");
    return;
  }

  state.ticketDraftEntries.push({
    id: crypto.randomUUID(),
    customerId,
    roundId,
    betTypeId,
    number,
    amount,
  });
  elements.ticketNumber.value = "";
  elements.ticketNumber.focus();
  renderTicketWorkbench();
}

function getDraftIssues(entry) {
  const issues = [];
  if (!entry.customerId) issues.push("ยังไม่เลือกลูกค้า");
  if (!entry.roundId) issues.push("ยังไม่เลือกงวด");
  if (entry.roundId && !getRound(entry.roundId)?.accepting) issues.push("งวดนี้ปิดรับแล้ว");
  const betType = getBetType(entry.betTypeId);
  if (!betType || !isValidNumber(entry.number, betType.digits)) issues.push("เลขไม่ตรงประเภท");
  if (!Number.isFinite(entry.amount) || entry.amount <= 0) issues.push("ยอดต้องมากกว่า 0");
  return issues;
}

function renderTicketDraft() {
  elements.ticketDraftBody.innerHTML = "";
  elements.ticketDraftEmpty.classList.toggle("hidden", state.ticketDraftEntries.length > 0);
  elements.ticketTotalAmount.textContent = money(sum(state.ticketDraftEntries.map((entry) => entry.amount)));
  elements.saveTicketBtn.disabled = !state.ticketDraftEntries.length;

  state.ticketDraftEntries.forEach((entry) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><span class="number-pill">${escapeHtml(entry.number)}</span></td>
      <td>${escapeHtml(getBetTypeName(entry.betTypeId))}</td>
      <td class="amount">${money(entry.amount)}</td>
      <td><button class="icon-button remove-ticket-entry-button" type="button">ลบ</button></td>
    `;
    row.querySelector(".remove-ticket-entry-button").addEventListener("click", () => {
      state.ticketDraftEntries = state.ticketDraftEntries.filter((item) => item.id !== entry.id);
      renderTicketWorkbench();
    });
    elements.ticketDraftBody.appendChild(row);
  });
}

function clearTicketDraft() {
  if (!state.ticketDraftEntries.length) return;
  if (!confirm("ล้างรายการในโพยทั้งหมดใช่หรือไม่")) return;
  state.ticketDraftEntries = [];
  renderTicketWorkbench();
}

async function saveTicketDraft() {
  if (!state.ticketDraftEntries.length) return;

  const groupedIssues = state.ticketDraftEntries.flatMap((entry) => getDraftIssues(entry));
  if (groupedIssues.length) {
    alert("ยังมีรายการที่ข้อมูลไม่ครบ");
    return;
  }

  try {
    await api("/api/entries/batch", {
      method: "POST",
      body: {
        entries: state.ticketDraftEntries.map((entry) => ({
          customerId: entry.customerId,
          roundId: entry.roundId,
          betTypeId: entry.betTypeId,
          number: entry.number,
          amount: entry.amount,
          note: elements.ticketNote.value.trim(),
        })),
      },
    });
    state.ticketDraftEntries = [];
    elements.ticketNote.value = "";
    await refreshState();
    alert("บันทึกโพยแล้ว");
  } catch (error) {
    handleLimitError(error);
  }
}

function renderTicketLimitPreview() {
  const roundId = elements.ticketRound.value;
  const betTypeId = state.ticketBetTypeId;
  const number = elements.ticketNumber.value.trim();
  const amount = parseAmount(elements.ticketAmount.value);
  const betType = getBetType(betTypeId);

  if (!roundId || !betType || !isValidNumber(number, betType.digits)) {
    elements.ticketLimitPreview.classList.add("hidden");
    return;
  }

  const item = getLimitStatuses().find(
    (status) => status.limit.round_id === roundId && status.limit.bet_type_id === betTypeId && status.limit.number === number,
  );
  if (!item) {
    elements.ticketLimitPreview.classList.add("hidden");
    return;
  }

  const sameDraftAmount = sum(
    state.ticketDraftEntries
      .filter((entry) => entry.roundId === roundId && entry.betTypeId === betTypeId && entry.number === number)
      .map((entry) => entry.amount),
  );
  const projected = item.currentAmount + sameDraftAmount + (Number.isFinite(amount) ? amount : 0);
  const ratio = item.limit.max_amount ? projected / item.limit.max_amount : 0;
  const status = ratio >= 1 ? "full" : ratio >= 0.8 ? "warning" : "normal";
  elements.ticketLimitPreview.className = `limit-preview ${status}`;
  elements.ticketLimitPreview.innerHTML = `
    <strong>มีอั้นเลขตรงกัน</strong>
    <span>ปัจจุบัน ${money(item.currentAmount)} / เพดาน ${money(item.limit.max_amount)}</span>
    <span>รวมโพยนี้แล้ว ${money(projected)} (${percent(ratio)})</span>
  `;
}

function renderTicketHistory() {
  const round = getRound(elements.ticketRound.value);
  if (!round) {
    elements.ticketHistoryList.innerHTML = '<div class="empty-state">ยังไม่เลือกงวด</div>';
    return;
  }

  const rows = state.rounds
    .filter((item) => item.lottery_id === round.lottery_id && item.id !== round.id)
    .slice(0, 5)
    .map((item) => {
      const twoTop = resultNumbers(item.id, "two_top");
      const twoBottom = resultNumbers(item.id, "two_bottom");
      const threeTop = resultNumbers(item.id, "three_top");
      return `
        <article class="compact-row">
          <strong>${escapeHtml(item.label)}</strong>
          <span>3บน ${escapeHtml(threeTop || "-")} · 2บน ${escapeHtml(twoTop || "-")} · 2ล่าง ${escapeHtml(twoBottom || "-")}</span>
        </article>
      `;
    })
    .join("");
  elements.ticketHistoryList.innerHTML = rows || '<div class="empty-state">ยังไม่มีผลย้อนหลัง</div>';
}

function renderTicketLimits() {
  const roundId = elements.ticketRound.value;
  const statuses = getLimitStatuses().filter((item) => item.limit.round_id === roundId);
  elements.ticketLimitList.innerHTML = statuses.length
    ? statuses
        .slice(0, 6)
        .map(
          (item) => `
            <article class="compact-row">
              <strong>${escapeHtml(item.limit.number)} · ${escapeHtml(getBetTypeName(item.limit.bet_type_id))}</strong>
              <span>${money(item.currentAmount)} / ${money(item.limit.max_amount)}</span>
            </article>
          `,
        )
        .join("")
    : '<div class="empty-state">ยังไม่มีเลขอั้นในงวดนี้</div>';
}

function renderTicketRecentEntries() {
  const roundId = elements.ticketRound.value;
  const recent = state.entries.filter((entry) => entry.round_id === roundId).slice(0, 6);
  elements.ticketRecentList.innerHTML = recent.length
    ? recent
        .map(
          (entry) => `
            <article class="compact-row">
              <strong>${escapeHtml(entry.number)} · ${escapeHtml(getBetTypeName(entry.bet_type_id))}</strong>
              <span>${escapeHtml(getCustomerCode(entry.customer_id))} · ${money(entry.amount)}</span>
            </article>
          `,
        )
        .join("")
    : '<div class="empty-state">ยังไม่มีรายการในงวดนี้</div>';
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
  elements.ticketCustomer.value = created.id;
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
  elements.formTitle.textContent = "กรอก / แก้ไขรายการเดี่ยว";
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

  elements.emptyState.classList.toggle("hidden", visible.length > 0);
  const grouped = groupBy(visible, (entry) => entry.round_id);
  elements.entryGroups.innerHTML = [...grouped.entries()]
    .map(([roundId, entries]) => {
      const roundInfo = getRound(roundId);
      const total = sum(entries.map((entry) => entry.amount));
      return `
        <section class="entry-group">
          <div class="entry-group-heading">
            <h3>${escapeHtml(getLotteryName(roundInfo?.lottery_id))} · ${escapeHtml(roundInfo?.label || "-")}</h3>
            <strong>${money(total)}</strong>
          </div>
          <div class="table-wrap dense-table">
            <table>
              <thead>
                <tr>
                  <th>ลูกค้า</th>
                  <th>ประเภท</th>
                  <th>เลข</th>
                  <th>ยอดเงิน</th>
                  <th>บันทึก</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${entries
                  .map(
                    (entry) => `
                      <tr>
                        <td>${escapeHtml(getCustomerCode(entry.customer_id))}</td>
                        <td>${escapeHtml(getBetTypeName(entry.bet_type_id))}</td>
                        <td><span class="number-pill">${escapeHtml(entry.number)}</span></td>
                        <td class="amount">${money(entry.amount)}</td>
                        <td>${escapeHtml(entry.note || "-")}</td>
                        <td>
                          <div class="row-actions">
                            <button class="icon-button edit-entry-button" type="button" data-entry-id="${escapeHtml(entry.id)}">แก้ไข</button>
                            <button class="icon-button delete-entry-button" type="button" data-entry-id="${escapeHtml(entry.id)}">ลบ</button>
                          </div>
                        </td>
                      </tr>
                    `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </section>
      `;
    })
    .join("");

  elements.entryGroups.querySelectorAll(".edit-entry-button").forEach((button) => {
    button.addEventListener("click", () => beginEntryEdit(button.dataset.entryId));
  });
  elements.entryGroups.querySelectorAll(".delete-entry-button").forEach((button) => {
    button.addEventListener("click", () => deleteEntry(button.dataset.entryId));
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
  try {
    const wasEditing = Boolean(state.editingCustomerId);
    const customer = await saveCustomer(
      elements.customerName.value.trim(),
      elements.customerHeadHouse.value,
    );
    resetCustomerForm();
    await refreshState();
    alert(wasEditing ? "บันทึกข้อมูลลูกค้าแล้ว" : `สร้างลูกค้าแล้ว รหัสคือ ${customer.code}`);
  } catch (error) {
    if (error?.payload?.error === "customer_head_house_locked") {
      alert("เปลี่ยนหัวบ้านไม่ได้ เพราะลูกค้านี้มีรายการย้อนหลังแล้ว");
      return;
    }
    alert("บันทึกลูกค้าไม่สำเร็จ");
  }
}

async function createCustomer(name, headHouseId) {
  return api("/api/customers", {
    method: "POST",
    body: { name, headHouseId },
  });
}

async function saveCustomer(name, headHouseId) {
  if (state.editingCustomerId) {
    return api(`/api/customers/${state.editingCustomerId}`, {
      method: "PUT",
      body: { name, headHouseId },
    });
  }
  return createCustomer(name, headHouseId);
}

async function handleHeadHouseSubmit(event) {
  event.preventDefault();
  const saved = await api(state.editingHeadHouseId ? `/api/head-houses/${state.editingHeadHouseId}` : "/api/head-houses", {
    method: state.editingHeadHouseId ? "PUT" : "POST",
    body: {
      name: elements.headHouseName.value.trim(),
      note: elements.headHouseNote.value.trim(),
      commissionPercent: Number(elements.headHouseCommission.value),
    },
  });
  const wasEditing = Boolean(state.editingHeadHouseId);
  resetHeadHouseForm();
  await refreshState();
  alert(wasEditing ? "บันทึกข้อมูลหัวบ้านแล้ว" : `สร้างหัวบ้านแล้ว รหัสคือ ${saved.code}`);
}

function renderHeadHouses() {
  elements.headHouseList.innerHTML = state.headHouses
    .map((headHouse) => {
      const customers = state.customers.filter((customer) => customer.head_house_id === headHouse.id).length;
      const viewer = state.users.find((user) => user.role === "head_house_viewer" && user.head_house_id === headHouse.id);
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
          <div class="head-house-actions">
            <small>${customers.toLocaleString("th-TH")} ลูกค้า · ${money(amount)}</small>
            <small>ส่วนแบ่ง ${percentValue(headHouse.commission_percent)}</small>
            ${
              viewer
                ? `<small>บัญชีดูยอด: ${escapeHtml(viewer.username)}</small>`
                : `<button class="button button-secondary create-viewer-button" type="button" data-head-house-id="${escapeHtml(headHouse.id)}">สร้างบัญชีดูยอด</button>`
            }
            <div class="mini-actions">
              <button class="button button-secondary view-head-house-button" type="button" data-head-house-id="${escapeHtml(headHouse.id)}">ดูยอด</button>
              <button class="button button-secondary edit-head-house-button" type="button" data-head-house-id="${escapeHtml(headHouse.id)}">แก้ไข</button>
              ${
                viewer
                  ? `<button class="button button-secondary reset-viewer-password-button" type="button" data-head-house-id="${escapeHtml(headHouse.id)}">รีเซ็ตรหัสผ่าน</button>`
                  : ""
              }
              ${
                headHouse.id !== "direct"
                  ? `<button class="button button-danger delete-head-house-button" type="button" data-head-house-id="${escapeHtml(headHouse.id)}">ลบ</button>`
                  : ""
              }
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  elements.headHouseList.querySelectorAll(".create-viewer-button").forEach((button) => {
    button.addEventListener("click", () => provisionHeadHouseViewer(button.dataset.headHouseId));
  });
  elements.headHouseList.querySelectorAll(".view-head-house-button").forEach((button) => {
    button.addEventListener("click", () => viewHeadHouseReport(button.dataset.headHouseId));
  });
  elements.headHouseList.querySelectorAll(".edit-head-house-button").forEach((button) => {
    button.addEventListener("click", () => beginHeadHouseEdit(button.dataset.headHouseId));
  });
  elements.headHouseList.querySelectorAll(".reset-viewer-password-button").forEach((button) => {
    button.addEventListener("click", () => resetHeadHouseViewerPassword(button.dataset.headHouseId));
  });
  elements.headHouseList.querySelectorAll(".delete-head-house-button").forEach((button) => {
    button.addEventListener("click", () => deleteHeadHouse(button.dataset.headHouseId));
  });
}

async function provisionHeadHouseViewer(headHouseId) {
  const credentials = await api(`/api/head-houses/${headHouseId}/viewer-account`, { method: "POST" });
  showViewerCredentials(credentials);
  await refreshState();
}

function showViewerCredentials(credentials) {
  state.latestViewerCredentials = {
    username: credentials.username,
    password: credentials.password,
    url: window.location.origin,
  };
  elements.viewerCredentialSummary.textContent = `${credentials.username} / ${credentials.password}`;
  elements.viewerCredentialCard.classList.remove("hidden");
}

async function copyViewerCredentials() {
  const credentials = state.latestViewerCredentials;
  if (!credentials) return;
  const text = `ลิงก์เข้าใช้งาน: ${credentials.url}\nชื่อผู้ใช้: ${credentials.username}\nรหัสผ่าน: ${credentials.password}`;
  try {
    await navigator.clipboard.writeText(text);
    alert("คัดลอกข้อมูลแล้ว");
  } catch {
    alert(text);
  }
}

function beginHeadHouseEdit(id) {
  const headHouse = state.headHouses.find((item) => item.id === id);
  if (!headHouse) return;
  state.editingHeadHouseId = headHouse.id;
  elements.headHouseName.value = headHouse.name;
  elements.headHouseNote.value = headHouse.note;
  elements.headHouseCommission.value = headHouse.commission_percent;
  elements.headHouseFormTitle.textContent = `แก้ไข ${headHouse.code}`;
  elements.headHouseSubmitBtn.textContent = "บันทึกการแก้ไข";
  elements.resetHeadHouseBtn.classList.remove("hidden");
}

function resetHeadHouseForm() {
  state.editingHeadHouseId = null;
  elements.headHouseForm.reset();
  elements.headHouseCommission.value = 0;
  elements.headHouseFormTitle.textContent = "เพิ่มหัวบ้าน";
  elements.headHouseSubmitBtn.textContent = "เพิ่มหัวบ้าน";
  elements.resetHeadHouseBtn.classList.add("hidden");
}

function viewHeadHouseReport(id) {
  elements.headHouseReportSelect.value = id;
  activateView("headHouseReport");
  renderHeadHouseReport();
}

async function resetHeadHouseViewerPassword(id) {
  if (!confirm("รีเซ็ตรหัสผ่านบัญชีดูยอดของหัวบ้านนี้ใช่หรือไม่")) return;
  const credentials = await api(`/api/head-houses/${id}/viewer-account/reset-password`, { method: "POST" });
  showViewerCredentials(credentials);
}

async function deleteHeadHouse(id) {
  if (!confirm("ลบหัวบ้านนี้ใช่หรือไม่")) return;
  try {
    await api(`/api/head-houses/${id}`, { method: "DELETE" });
    await refreshState();
  } catch (error) {
    if (error?.payload?.error === "head_house_has_customers") {
      alert("ลบไม่ได้ เพราะยังมีลูกค้าอยู่ใต้หัวบ้านนี้");
      return;
    }
    alert("ลบหัวบ้านไม่สำเร็จ");
  }
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
          <div class="head-house-actions">
            <small>${count.toLocaleString("th-TH")} รายการ</small>
            ${
              customer.id !== "walkin"
                ? `
                  <div class="mini-actions">
                    <button class="button button-secondary edit-customer-button" type="button" data-customer-id="${escapeHtml(customer.id)}">แก้ไข</button>
                    <button class="button button-danger delete-customer-button" type="button" data-customer-id="${escapeHtml(customer.id)}">ลบ</button>
                  </div>
                `
                : ""
            }
          </div>
        </article>
      `;
    })
    .join("");

  elements.customerList.querySelectorAll(".edit-customer-button").forEach((button) => {
    button.addEventListener("click", () => beginCustomerEdit(button.dataset.customerId));
  });
  elements.customerList.querySelectorAll(".delete-customer-button").forEach((button) => {
    button.addEventListener("click", () => deleteCustomer(button.dataset.customerId));
  });
}

function beginCustomerEdit(id) {
  const customer = state.customers.find((item) => item.id === id);
  if (!customer) return;
  state.editingCustomerId = customer.id;
  elements.customerName.value = customer.name;
  elements.customerHeadHouse.value = customer.head_house_id;
  elements.customerFormTitle.textContent = `แก้ไข ${customer.code}`;
  elements.customerSubmitBtn.textContent = "บันทึกการแก้ไข";
  elements.resetCustomerBtn.classList.remove("hidden");
}

function resetCustomerForm() {
  state.editingCustomerId = null;
  elements.customerForm.reset();
  renderSelects();
  elements.customerFormTitle.textContent = "เพิ่มลูกค้า";
  elements.customerSubmitBtn.textContent = "เพิ่มลูกค้า";
  elements.resetCustomerBtn.classList.add("hidden");
}

async function deleteCustomer(id) {
  if (!confirm("ลบลูกค้านี้ใช่หรือไม่")) return;
  try {
    await api(`/api/customers/${id}`, { method: "DELETE" });
    await refreshState();
  } catch (error) {
    if (error?.payload?.error === "customer_has_entries") {
      alert("ลบไม่ได้ เพราะลูกค้านี้มีรายการอยู่แล้ว");
      return;
    }
    alert("ลบลูกค้าไม่สำเร็จ");
  }
}

async function handleLotterySubmit(event) {
  event.preventDefault();
  await api("/api/lotteries", {
    method: "POST",
    body: {
      name: elements.lotteryName.value.trim(),
      category: elements.lotteryCategory.value,
    },
  });
  elements.lotteryForm.reset();
  await refreshState();
}

function renderLotteries() {
  elements.lotteryChips.innerHTML = state.lotteries
    .map((lottery) => {
      const count = state.rounds.filter((round) => round.lottery_id === lottery.id).length;
      const hasSchedule = state.scheduleTemplates.some((schedule) => schedule.lottery_id === lottery.id);
      return `<span class="chip">${escapeHtml(lottery.name)} · ${escapeHtml(getLotteryCategoryLabel(lottery.category))} · ${count.toLocaleString("th-TH")} งวด${hasSchedule ? " · ตั้งเวลาแล้ว" : ""}</span>`;
    })
    .join("");
}

async function handleScheduleSubmit(event) {
  event.preventDefault();
  const payload = {
    lotteryId: elements.scheduleLottery.value,
    frequency: elements.scheduleFrequency.value,
    weekdays: elements.scheduleWeekdays.value,
    monthDays: elements.scheduleMonthDays.value,
    openDaysBefore: Number(elements.scheduleOpenDaysBefore.value),
    openTime: elements.scheduleOpenTime.value,
    drawTime: elements.scheduleDrawTime.value,
    closeBeforeMinutes: Number(elements.scheduleCloseBefore.value),
    sourceNote: elements.scheduleSourceNote.value.trim(),
    active: elements.scheduleActive.checked,
  };

  try {
    if (state.editingScheduleId) {
      await api(`/api/schedule-templates/${state.editingScheduleId}`, {
        method: "PUT",
        body: payload,
      });
    } else {
      await api("/api/schedule-templates", {
        method: "POST",
        body: payload,
      });
    }
    resetScheduleForm();
    await refreshState();
  } catch (error) {
    if (error?.payload?.error === "schedule_exists") {
      alert("หวยนี้มีตารางเวลาอยู่แล้ว ให้กดแก้ไขตารางเดิม");
      return;
    }
    alert("บันทึกตารางเวลาไม่สำเร็จ");
  }
}

function renderScheduleTemplates() {
  elements.scheduleTemplatesBody.innerHTML = "";
  state.scheduleTemplates.forEach((schedule) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(getLotteryName(schedule.lottery_id))}</td>
      <td>${escapeHtml(formatScheduleFrequency(schedule))}</td>
      <td>${escapeHtml(schedule.open_days_before ? `ก่อนออก ${schedule.open_days_before} วัน ${schedule.open_time}` : `วันออก ${schedule.open_time}`)}</td>
      <td>${escapeHtml(schedule.draw_time)}</td>
      <td>${schedule.close_before_minutes.toLocaleString("th-TH")} นาที</td>
      <td>${schedule.active ? '<span class="status-pill normal">ใช้งาน</span>' : '<span class="status-pill warning">พักไว้</span>'}</td>
      <td>${escapeHtml(schedule.source_note || "-")}</td>
      <td>
        <div class="row-actions">
          <button class="icon-button edit-schedule-button" type="button">แก้ไข</button>
        </div>
      </td>
    `;
    row.querySelector(".edit-schedule-button").addEventListener("click", () => beginScheduleEdit(schedule.id));
    elements.scheduleTemplatesBody.appendChild(row);
  });
}

function beginScheduleEdit(id) {
  const schedule = state.scheduleTemplates.find((item) => item.id === id);
  if (!schedule) return;
  state.editingScheduleId = schedule.id;
  elements.scheduleLottery.value = schedule.lottery_id;
  elements.scheduleLottery.disabled = true;
  elements.scheduleFrequency.value = schedule.frequency;
  elements.scheduleWeekdays.value = schedule.weekdays.join(",");
  elements.scheduleMonthDays.value = schedule.month_days.join(",");
  elements.scheduleOpenDaysBefore.value = schedule.open_days_before;
  elements.scheduleOpenTime.value = schedule.open_time;
  elements.scheduleDrawTime.value = schedule.draw_time;
  elements.scheduleCloseBefore.value = schedule.close_before_minutes;
  elements.scheduleSourceNote.value = schedule.source_note || "";
  elements.scheduleActive.checked = schedule.active;
  elements.scheduleFormTitle.textContent = "แก้ไขตารางเวลา";
  elements.scheduleSubmitBtn.textContent = "บันทึกการแก้ไข";
  elements.resetScheduleBtn.classList.remove("hidden");
  syncScheduleFrequencyFields();
}

function resetScheduleForm() {
  state.editingScheduleId = null;
  elements.scheduleForm.reset();
  elements.scheduleLottery.disabled = false;
  elements.scheduleFrequency.value = "daily";
  elements.scheduleWeekdays.value = "0,1,2,3,4,5,6";
  elements.scheduleMonthDays.value = "";
  elements.scheduleOpenDaysBefore.value = 0;
  elements.scheduleOpenTime.value = "00:00";
  elements.scheduleDrawTime.value = "18:00";
  elements.scheduleCloseBefore.value = 5;
  elements.scheduleActive.checked = true;
  elements.scheduleFormTitle.textContent = "ตั้งเวลารันงวดอัตโนมัติ";
  elements.scheduleSubmitBtn.textContent = "บันทึกตารางเวลา";
  elements.resetScheduleBtn.classList.add("hidden");
  renderSelects();
  syncScheduleFrequencyFields();
}

function syncScheduleFrequencyFields() {
  const isMonthly = elements.scheduleFrequency.value === "monthly";
  elements.scheduleWeekdays.closest(".field").classList.toggle("hidden", isMonthly);
  elements.scheduleMonthDays.closest(".field").classList.toggle("hidden", !isMonthly);
  elements.scheduleWeekdays.required = !isMonthly;
  elements.scheduleMonthDays.required = isMonthly;
}

async function generateUpcomingRounds() {
  const summary = await api("/api/schedule-templates/generate", {
    method: "POST",
    body: { days: 14 },
  });
  await refreshState();
  alert(`สร้างงวดอัตโนมัติเพิ่ม ${summary.created.toLocaleString("th-TH")} งวด ถึงวันที่ ${longDate(summary.toDate)}`);
}

async function handleRoundSubmit(event) {
  event.preventDefault();
  const payload = {
    lotteryId: elements.roundLottery.value,
    openDate: elements.roundOpenDate.value,
    openTime: elements.roundOpenTime.value,
    drawDate: elements.roundDate.value,
    drawTime: elements.roundTime.value,
    label: elements.roundLabel.value.trim(),
    closeBeforeMinutes: Number(elements.roundCloseBefore.value),
  };

  try {
    if (state.editingRoundId) {
      await api(`/api/rounds/${state.editingRoundId}`, {
        method: "PUT",
        body: payload,
      });
    } else {
      await api("/api/rounds", {
        method: "POST",
        body: payload,
      });
    }

    resetRoundForm();
    await refreshState();
  } catch (error) {
    if (error?.payload?.error === "round_exists") {
      alert("มีงวดชื่อนี้ในหวยเดียวกันอยู่แล้ว");
      return;
    }
    alert("บันทึกงวดไม่สำเร็จ");
  }
}

function renderRounds() {
  elements.roundsBody.innerHTML = "";
  state.rounds.forEach((round) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(getLotteryName(round.lottery_id))}</td>
      <td>${escapeHtml(round.label)}</td>
      <td>${round.auto_generated ? '<span class="status-pill normal">อัตโนมัติ</span>' : '<span class="status-pill">มือ</span>'}</td>
      <td>${escapeHtml(formatRoundOpenTime(round))}</td>
      <td>${longDate(round.draw_date)}</td>
      <td>${escapeHtml(round.draw_time)}</td>
      <td>${round.close_before_minutes.toLocaleString("th-TH")} นาที</td>
      <td>${escapeHtml(formatRoundCutoff(round))}</td>
      <td><span class="status-pill ${roundStatusClass(round)}">${roundStatusLabel(round)}</span></td>
      <td>
        <div class="row-actions">
          <button class="icon-button edit-round-button" type="button">แก้ไข</button>
          <button class="icon-button toggle-round-button" type="button">${round.status === "open" ? "ปิดงวด" : "เปิดงวด"}</button>
        </div>
      </td>
    `;
    row.querySelector(".edit-round-button").addEventListener("click", () => beginRoundEdit(round.id));
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

function beginRoundEdit(id) {
  const round = state.rounds.find((item) => item.id === id);
  if (!round) return;
  state.editingRoundId = round.id;
  elements.roundLottery.value = round.lottery_id;
  elements.roundLottery.disabled = true;
  elements.roundOpenDate.value = round.open_date || round.draw_date;
  elements.roundOpenTime.value = round.open_time || "00:00";
  elements.roundDate.value = round.draw_date;
  elements.roundTime.value = round.draw_time;
  elements.roundLabel.value = round.label;
  elements.roundCloseBefore.value = round.close_before_minutes;
  elements.roundFormTitle.textContent = "แก้ไขงวด";
  elements.roundSubmitBtn.textContent = "บันทึกการแก้ไข";
  elements.resetRoundBtn.classList.remove("hidden");
}

function resetRoundForm() {
  state.editingRoundId = null;
  elements.roundForm.reset();
  elements.roundLottery.disabled = false;
  elements.roundOpenDate.value = today();
  elements.roundOpenTime.value = "00:00";
  elements.roundDate.value = today();
  elements.roundCloseBefore.value = 15;
  renderSelects();
  elements.roundFormTitle.textContent = "สร้างงวด";
  elements.roundSubmitBtn.textContent = "เพิ่มงวด";
  elements.resetRoundBtn.classList.add("hidden");
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

function renderResultsOverview() {
  const rows = state.rounds
    .slice()
    .sort((a, b) => new Date(`${b.draw_date}T${b.draw_time}:00`) - new Date(`${a.draw_date}T${a.draw_time}:00`))
    .map((round) => {
      return `
        <tr>
          <td>${escapeHtml(getLotteryName(round.lottery_id))}</td>
          <td>${escapeHtml(round.label)}</td>
          <td>${longDate(round.draw_date)}</td>
          <td>${escapeHtml(resultNumbers(round.id, "three_top") || "-")}</td>
          <td>${escapeHtml(resultNumbers(round.id, "two_top") || "-")}</td>
          <td>${escapeHtml(resultNumbers(round.id, "two_bottom") || "-")}</td>
          <td><span class="status-pill ${roundStatusClass(round)}">${roundStatusLabel(round)}</span></td>
        </tr>
      `;
    })
    .join("");

  elements.resultsOverviewBody.innerHTML = rows || '<tr><td colspan="7">ยังไม่มีงวด</td></tr>';
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

function renderFinanceLedger() {
  const rows = buildFinanceLedger();
  const totalDebit = sum(rows.map((row) => row.debit));
  const totalCredit = sum(rows.map((row) => row.credit));
  elements.ledgerDebit.textContent = money(totalDebit);
  elements.ledgerCredit.textContent = money(totalCredit);
  elements.ledgerBalance.textContent = money(totalCredit - totalDebit);
  elements.ledgerBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(formatDateTime(row.createdAt))}</td>
          <td>${escapeHtml(row.detail)}</td>
          <td class="amount debit">${row.debit ? money(row.debit) : "-"}</td>
          <td class="amount credit">${row.credit ? money(row.credit) : "-"}</td>
          <td class="amount">${money(row.balance)}</td>
        </tr>
      `,
    )
    .join("");
}

function buildFinanceLedger() {
  const rows = [];
  state.entries.forEach((entry) => {
    const round = getRound(entry.round_id);
    rows.push({
      createdAt: entry.created_at,
      detail: `แทงหวย ${getLotteryName(round?.lottery_id)} · ${round?.label || "-"} · ${getCustomerCode(entry.customer_id)}`,
      debit: entry.amount,
      credit: 0,
    });

    const payout = getEntryPayout(entry);
    if (payout > 0) {
      rows.push({
        createdAt: entry.updated_at || entry.created_at,
        detail: `ถูกรางวัล ${getLotteryName(round?.lottery_id)} · ${entry.number} · ${getCustomerCode(entry.customer_id)}`,
        debit: 0,
        credit: payout,
      });
    }
  });

  rows.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  let running = 0;
  rows.forEach((row) => {
    running += row.credit - row.debit;
    row.balance = running;
  });
  return rows.reverse();
}

function getEntryPayout(entry) {
  const round = getRound(entry.round_id);
  if (!round) return 0;
  const matchingResults = state.results.filter(
    (result) => result.round_id === entry.round_id && result.bet_type_id === entry.bet_type_id,
  );
  if (!matchingResults.some((result) => entryWinsAgainstResult(entry, result))) return 0;
  return entry.amount * getPayoutRate(round.lottery_id, entry.bet_type_id);
}

function entryWinsAgainstResult(entry, result) {
  if (entry.bet_type_id === "three_tod") {
    return entry.number.split("").sort().join("") === result.number.split("").sort().join("");
  }
  return entry.number === result.number;
}

async function renderHeadHouseReport() {
  const headHouseId =
    state.user?.role === "head_house_viewer" ? state.user.headHouseId : elements.headHouseReportSelect.value;

  if (!headHouseId) {
    elements.headHouseReportStake.textContent = money(0);
    elements.headHouseReportPayout.textContent = money(0);
    elements.headHouseReportCommission.textContent = money(0);
    elements.headHouseReportNetPayable.textContent = money(0);
    elements.headHouseReportFormula.textContent = "";
    elements.headHouseReportBody.innerHTML = "";
    return;
  }

  try {
    const summary = await api(`/api/head-house-summary?headHouseId=${encodeURIComponent(headHouseId)}`);
    elements.headHouseReportStake.textContent = money(summary.totalStake);
    elements.headHouseReportPayout.textContent = money(summary.totalPayout);
    elements.headHouseReportCommission.textContent = money(summary.commissionAmount);
    elements.headHouseReportNetPayable.textContent = money(summary.netPayable);
    elements.headHouseReportFormula.textContent = `ส่วนแบ่งหัวบ้าน ${percentValue(summary.commissionPercent)} · สูตร: ยอดถูกรางวัล + ค่าคอมมิชชั่น - ยอดรับ`;
    elements.headHouseReportBody.innerHTML = summary.rounds
      .map(
        (round) => `
          <tr>
            <td>${escapeHtml(round.lotteryName)}</td>
            <td>${escapeHtml(round.roundLabel)}</td>
            <td>${longDate(round.drawDate)} ${escapeHtml(round.drawTime)}</td>
            <td class="amount">${money(round.totalStake)}</td>
            <td class="amount">${money(round.totalPayout)}</td>
            <td class="amount">${money(round.commissionAmount)}</td>
            <td class="amount">${money(round.netPayable)}</td>
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
  try {
    const wasEditing = Boolean(state.editingUserId);
    await api(state.editingUserId ? `/api/users/${state.editingUserId}` : "/api/users", {
      method: state.editingUserId ? "PUT" : "POST",
      body: {
        username: elements.userUsername.value.trim(),
        password: elements.userPassword.value,
        role: elements.userRole.value,
        headHouseId: elements.userRole.value === "head_house_viewer" ? elements.userHeadHouse.value : null,
      },
    });
    resetUserForm();
    await refreshState();
    alert(wasEditing ? "บันทึกข้อมูลผู้ใช้แล้ว" : "เพิ่มผู้ใช้แล้ว");
  } catch (error) {
    if (error?.payload?.error === "username_exists") {
      alert("ชื่อผู้ใช้นี้ถูกใช้แล้ว");
      return;
    }
    if (error?.payload?.error === "last_admin_required") {
      alert("ต้องเหลือผู้ดูแลระบบอย่างน้อย 1 คน");
      return;
    }
    if (error?.payload?.error === "self_role_change_blocked") {
      alert("เปลี่ยนสิทธิ์ของบัญชีที่กำลังใช้งานอยู่ไม่ได้");
      return;
    }
    if (error?.payload?.error === "viewer_account_exists") {
      alert("หัวบ้านนี้มีบัญชีดูยอดอยู่แล้ว");
      return;
    }
    alert("บันทึกผู้ใช้ไม่สำเร็จ");
  }
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
            <td>
              <div class="row-actions">
                <button class="icon-button edit-user-button" type="button" data-user-id="${escapeHtml(user.id)}">แก้ไข</button>
                ${
                  user.id !== state.user.id
                    ? `<button class="icon-button delete-user-button" type="button" data-user-id="${escapeHtml(user.id)}">ลบ</button>`
                    : ""
                }
              </div>
            </td>
          </tr>
        `,
      )
      .join("");

    elements.usersBody.querySelectorAll(".edit-user-button").forEach((button) => {
      button.addEventListener("click", () => beginUserEdit(button.dataset.userId));
    });
    elements.usersBody.querySelectorAll(".delete-user-button").forEach((button) => {
      button.addEventListener("click", () => deleteUser(button.dataset.userId));
    });
  }

function configureRoleAccess() {
  const canManageUsers = state.user?.role === "admin";
  const isHeadHouseViewer = state.user?.role === "head_house_viewer";
  elements.usersNavButton.classList.toggle("hidden", !canManageUsers);
  elements.usersView.hidden = !canManageUsers;
  elements.sidebarProfileBtn.classList.toggle("hidden", !canManageUsers);
  elements.headHousesNavButton.classList.toggle("hidden", !canManageUsers);
  elements.headHousesView.hidden = !canManageUsers;
  elements.headHouseReportPickerWrap.classList.toggle("hidden", isHeadHouseViewer);
  elements.exportBtn.classList.toggle("hidden", isHeadHouseViewer);
  elements.staffOnlyNavButtons.forEach((button) => button.classList.toggle("hidden", isHeadHouseViewer));
}

function syncUserHeadHouseField() {
  elements.userHeadHouseWrap.classList.toggle("hidden", elements.userRole.value !== "head_house_viewer");
}

function beginUserEdit(id) {
  const user = state.users.find((item) => item.id === id);
  if (!user) return;
  state.editingUserId = user.id;
  elements.userUsername.value = user.username;
  elements.userPassword.value = "";
  elements.userPassword.required = false;
  elements.userPassword.placeholder = "เว้นว่างหากไม่เปลี่ยน";
  elements.userRole.value = user.role;
  syncUserHeadHouseField();
  if (user.head_house_id) elements.userHeadHouse.value = user.head_house_id;
  elements.userPasswordHint.classList.remove("hidden");
  elements.userFormTitle.textContent = `แก้ไข ${user.username}`;
  elements.userSubmitBtn.textContent = "บันทึกการแก้ไข";
  elements.resetUserBtn.classList.remove("hidden");
}

function resetUserForm() {
  state.editingUserId = null;
  elements.userForm.reset();
  elements.userPassword.required = true;
  elements.userPassword.placeholder = "";
  elements.userPasswordHint.classList.add("hidden");
  renderSelects();
  syncUserHeadHouseField();
  elements.userFormTitle.textContent = "เพิ่มผู้ใช้";
  elements.userSubmitBtn.textContent = "เพิ่มผู้ใช้";
  elements.resetUserBtn.classList.add("hidden");
}

async function deleteUser(id) {
  if (!confirm("ลบผู้ใช้นี้ใช่หรือไม่")) return;
  try {
    await api(`/api/users/${id}`, { method: "DELETE" });
    await refreshState();
  } catch (error) {
    if (error?.payload?.error === "last_admin_required") {
      alert("ลบไม่ได้ เพราะต้องเหลือผู้ดูแลระบบอย่างน้อย 1 คน");
      return;
    }
    if (error?.payload?.error === "self_delete_blocked") {
      alert("ลบบัญชีที่กำลังใช้งานอยู่ไม่ได้");
      return;
    }
    alert("ลบผู้ใช้ไม่สำเร็จ");
  }
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

  const existing = state.entries.find((entry) => entry.id === state.editingEntryId);
  const existingAmount =
    existing &&
    existing.round_id === roundId &&
    existing.bet_type_id === betTypeId &&
    existing.number === number
      ? existing.amount
      : 0;
  const projected = item.currentAmount - existingAmount + (Number.isFinite(amount) ? amount : 0);
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

function formatScheduleFrequency(schedule) {
  if (schedule.frequency === "monthly") {
    return `ทุกเดือน วันที่ ${schedule.month_days.join(", ")}`;
  }
  const weekdayLabels = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
  const days = schedule.weekdays.map((day) => weekdayLabels[day]).join(", ");
  return schedule.frequency === "weekly" ? `ทุกสัปดาห์ ${days}` : `ทุกวัน ${days}`;
}

function findLatestOpenRound(lotteryId) {
  return getAcceptingRounds(lotteryId)[0];
}

function getDisplayRoundForLottery(lotteryId) {
  return (
    findLatestOpenRound(lotteryId) ||
    state.rounds
      .filter((round) => round.lottery_id === lotteryId)
      .sort((a, b) => new Date(`${b.draw_date}T${b.draw_time}:00`) - new Date(`${a.draw_date}T${a.draw_time}:00`))[0] ||
    null
  );
}

function getAcceptingRounds(lotteryId = "") {
  return state.rounds
    .filter((round) => round.accepting && (!lotteryId || round.lottery_id === lotteryId))
    .sort((a, b) => new Date(a.close_at) - new Date(b.close_at));
}

function getPayoutRate(lotteryId, betTypeId) {
  return state.payoutRates.find((rate) => rate.lottery_id === lotteryId && rate.bet_type_id === betTypeId)?.rate || 0;
}

function formatRate(value) {
  return Number(value || 0).toLocaleString("th-TH", {
    maximumFractionDigits: 2,
  });
}

function shortBetTypeName(betType) {
  return betType.name;
}

function resultNumbers(roundId, betTypeId) {
  return state.results
    .filter((result) => result.round_id === roundId && result.bet_type_id === betTypeId)
    .map((result) => result.number)
    .join(" ");
}

function formatCountdown(round) {
  if (!round) return "ยังไม่เลือกงวด";
  const now = Date.now();
  const openMs = new Date(round.open_at).getTime() - now;
  if (openMs > 0) return `เปิดรับในอีก ${formatDuration(openMs)}`;
  const remainingMs = new Date(round.close_at).getTime() - Date.now();
  if (remainingMs <= 0) return "ปิดรับแล้ว";
  return `เหลือเวลา ${formatDuration(remainingMs)}`;
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

function getLotteryCategoryLabel(id) {
  return LOTTERY_CATEGORIES.find((category) => category.id === id)?.label || "หวยอื่น ๆ";
}

function getLotteryFlagClass(id) {
  if (id === "thai" || id === "omsin" || id === "baac") return "flag-th";
  if (id.startsWith("lao")) return "flag-la";
  if (id.startsWith("hanoi") || id === "yamoey") return "flag-vn";
  if (id === "malaysia") return "flag-my";
  if (id === "stock") return "flag-stock";
  if (id.includes("nikkei")) return "flag-jp";
  if (id.includes("china")) return "flag-cn";
  if (id.includes("hangseng")) return "flag-hk";
  return "flag-generic";
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

function percentValue(value) {
  return `${Number(value || 0).toLocaleString("th-TH", {
    minimumFractionDigits: Number(value) % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  })}%`;
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

function formatDateTime(value) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
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

function formatRoundOpenTime(round) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(new Date(round.open_at));
}

function formatRoundCloseTime(round) {
  return new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(new Date(round.close_at));
}

function roundStatusLabel(round) {
  const timing = getRoundTimingStatus(round);
  if (timing.state === "upcoming") return "ยังไม่เปิด";
  if (timing.state === "closing_soon") return "ใกล้ปิด";
  if (timing.state === "open") return "เปิดรับ";
  return round.status === "closed" ? "ปิดงวด" : "ปิดรับแล้ว";
}

function roundStatusClass(round) {
  const timing = getRoundTimingStatus(round);
  if (timing.state === "open") return "normal";
  if (timing.state === "closing_soon" || timing.state === "upcoming") return "warning";
  return round.status === "closed" ? "full" : "warning";
}

function getRoundTimingStatus(round) {
  if (!round) return { state: "unset", label: "ยังไม่ตั้งงวด", cardClass: "is-closed" };
  if (round.status === "closed") return { state: "manual_closed", label: "ปิดงวด", cardClass: "is-closed" };

  const now = Date.now();
  const openAt = new Date(round.open_at).getTime();
  const closeAt = new Date(round.close_at).getTime();
  if (now < openAt) return { state: "upcoming", label: "ยังไม่เปิด", cardClass: "is-upcoming" };
  if (now >= closeAt) return { state: "closed", label: "ปิดรับ", cardClass: "is-closed" };
  if (closeAt - now <= 5 * 60_000) return { state: "closing_soon", label: "ใกล้ปิด", cardClass: "is-closing" };
  return { state: "open", label: "เปิดรับ", cardClass: "is-open" };
}

function renderClosingSoonBanner() {
  const rounds = state.rounds.filter((round) => getRoundTimingStatus(round).state === "closing_soon");
  elements.closingSoonBanner.classList.toggle("hidden", rounds.length === 0);
  elements.closingSoonBanner.innerHTML = rounds.length
    ? `
      <strong>เตือนก่อนปิดรับ 5 นาที</strong>
      <span>${rounds
        .map((round) => `${getLotteryName(round.lottery_id)} ${round.label} เหลือ ${formatDuration(new Date(round.close_at) - Date.now())}`)
        .join(" · ")}</span>
    `
    : "";
}

function renderTimeSensitiveUi() {
  renderTicketHeader();
  renderMarketSummary();
  renderLotteryBoard();
  renderClosingSoonBanner();
  announceClosingSoonRounds();
}

function announceClosingSoonRounds() {
  const rounds = state.rounds.filter((round) => getRoundTimingStatus(round).state === "closing_soon");
  rounds.forEach((round) => {
    if (state.announcedRoundIds.has(round.id)) return;
    state.announcedRoundIds.add(round.id);
    alert(`${getLotteryName(round.lottery_id)} ${round.label} เหลือเวลาไม่ถึง 5 นาที จะปิดรับอัตโนมัติ`);
  });
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const clock = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return days > 0 ? `${days} วัน ${clock}` : clock;
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

function groupBy(items, getKey) {
  return items.reduce((groups, item) => {
    const key = getKey(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
    return groups;
  }, new Map());
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
