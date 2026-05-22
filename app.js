const VIEW_META = {
  dashboard: { eyebrow: "ภาพรวมงานวันนี้", title: "วันนี้" },
  markets: { eyebrow: "เลือกงวดก่อนคีย์เลข", title: "แทงหวย" },
  intake: { eyebrow: "คีย์รายการของลูกค้า", title: "คีย์โพย" },
  review: { eyebrow: "ตรวจโพยก่อนคิดยอดจริง", title: "ตรวจโพย" },
  entries: { eyebrow: "ตรวจสอบรายการทั้งหมด", title: "รายการ" },
  headHouses: { eyebrow: "เครือข่ายผู้ส่งยอด", title: "หัวบ้าน" },
  customers: { eyebrow: "ข้อมูลผู้ส่งรายการ", title: "ลูกค้า" },
  lotteries: { eyebrow: "ตั้งค่าหวยและงวด", title: "หวยและงวด" },
  limits: { eyebrow: "ควบคุมเพดานรับ", title: "อั้นเลข" },
  payouts: { eyebrow: "ตั้งค่าอัตราจ่าย", title: "อัตราจ่าย" },
  results: { eyebrow: "บันทึกผลที่ออก", title: "ผลรางวัล" },
  resultLinks: { eyebrow: "แหล่งดึงผลและลิงก์สำรอง", title: "ลิงก์ผล" },
  reports: { eyebrow: "กระแสเงินและผลประกอบการ", title: "บัญชีการเงิน" },
  headHouseReport: { eyebrow: "ยอดรวมแบบอ่านอย่างเดียว", title: "ยอดหัวบ้าน" },
  manage: { eyebrow: "ตั้งค่าและควบคุมระบบ", title: "จัดการระบบ" },
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

const INTAKE_ACTIONS = [
  { id: "run_pair", label: "วิ่ง", digits: 1, target: "run_pair" },
  { id: "two_pair", label: "2 ตัว", digits: 2, target: "pair" },
  { id: "six_return", label: "6 กลับ", digits: 3, target: "six_return" },
  { id: "nineteen_gate", label: "19 ประตู", digits: 1, target: "nineteen_gate" },
  { id: "three_pair", label: "3 ตัว", digits: 3, target: "three_pair" },
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
  customerFilter: "",
  headHouseFilter: "",
  userFilter: "",
  headHouses: [],
  lotteries: [],
  customers: [],
  rounds: [],
  scheduleTemplates: [],
  betTypes: [],
  payoutRates: [],
  limits: [],
  tickets: [],
  entries: [],
  results: [],
  resultSources: [],
  resultImports: [],
  auditLogs: [],
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
  ticketBetTypeId: "two_pair",
  ticketReverseEnabled: false,
  ticketUseDoubles: false,
  ticketRunDigits: [],
  latestReceiptTicketId: null,
  latestViewerCredentials: null,
  announcedRoundIds: new Set(),
  announcedResultRoundIds: new Set(),
  notificationBootstrapped: false,
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
  sidebarRateRound: document.querySelector("#sidebarRateRound"),
  sidebarRateList: document.querySelector("#sidebarRateList"),
  sidebarProfileBtn: document.querySelector("#sidebarProfileBtn"),
  sidebarLogoutBtn: document.querySelector("#sidebarLogoutBtn"),
  usersNavButtons: document.querySelectorAll('[data-view-target="users"]'),
  usersView: document.querySelector('[data-view="users"]'),
  reviewNavButtons: document.querySelectorAll('[data-view-target="review"]'),
  reviewView: document.querySelector('[data-view="review"]'),
  headHousesNavButtons: document.querySelectorAll('[data-view-target="headHouses"]'),
  headHousesView: document.querySelector('[data-view="headHouses"]'),
  headHouseReportNavButton: document.querySelector('[data-view-target="headHouseReport"]'),
  staffOnlyNavButtons: document.querySelectorAll(
    '[data-view-target="dashboard"], [data-view-target="markets"], [data-view-target="intake"], [data-view-target="review"], [data-view-target="entries"], [data-view-target="customers"], [data-view-target="lotteries"], [data-view-target="limits"], [data-view-target="payouts"], [data-view-target="results"], [data-view-target="resultLinks"], [data-view-target="reports"], [data-view-target="manage"]',
  ),
  exportBtn: document.querySelector("#exportBtn"),
  logoutBtn: document.querySelector("#logoutBtn"),
  totalAmount: document.querySelector("#totalAmount"),
  totalEntries: document.querySelector("#totalEntries"),
  totalCustomers: document.querySelector("#totalCustomers"),
  openRoundsCount: document.querySelector("#openRoundsCount"),
  totalLimits: document.querySelector("#totalLimits"),
  nearLimitCount: document.querySelector("#nearLimitCount"),
  pendingTicketCount: document.querySelector("#pendingTicketCount"),
    pendingResultCount: document.querySelector("#pendingResultCount"),
    marketSummary: document.querySelector("#marketSummary"),
    playMarketSummary: document.querySelector("#playMarketSummary"),
  marketAdminSummary: document.querySelector("#marketAdminSummary"),
  lotteryBoard: document.querySelector("#lotteryBoard"),
  marketAdminBoard: document.querySelector("#marketAdminBoard"),
  closingSoonBanner: document.querySelector("#closingSoonBanner"),
  taskQueueList: document.querySelector("#taskQueueList"),
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
  ticketRound: document.querySelector("#ticketRoundInput"),
  ticketHeadHouse: document.querySelector("#ticketHeadHouseInput"),
  ticketRateLabel: document.querySelector("#ticketRateLabel"),
  ticketBetTypeTabs: document.querySelector("#ticketBetTypeTabs"),
  ticketActionHint: document.querySelector("#ticketActionHint"),
  ticketDoubleBtn: document.querySelector("#ticketDoubleBtn"),
  ticketReverseBtn: document.querySelector("#ticketReverseBtn"),
  ticketKeypad: document.querySelector("#ticketKeypad"),
  ticketNumber: document.querySelector("#ticketNumberInput"),
  ticketTopAmount: document.querySelector("#ticketTopAmountInput"),
  ticketBottomAmount: document.querySelector("#ticketBottomAmountInput"),
  ticketTodAmount: document.querySelector("#ticketTodAmountInput"),
  ticketTopAmountField: document.querySelector("#ticketTopAmountField"),
  ticketBottomAmountField: document.querySelector("#ticketBottomAmountField"),
  ticketTodAmountField: document.querySelector("#ticketTodAmountField"),
  ticketExpansionPreview: document.querySelector("#ticketExpansionPreview"),
  ticketInlineFeedback: document.querySelector("#ticketInlineFeedback"),
  addTicketEntryBtn: document.querySelector("#addTicketEntryBtn"),
  ticketLimitPreview: document.querySelector("#ticketLimitPreview"),
  ticketDraftWrap: document.querySelector("#ticketDraftWrap"),
  ticketDraftBody: document.querySelector("#ticketDraftBody"),
  ticketDraftEmpty: document.querySelector("#ticketDraftEmpty"),
  clearTicketBtn: document.querySelector("#clearTicketBtn"),
  ticketNote: document.querySelector("#ticketNoteInput"),
  ticketTotalAmount: document.querySelector("#ticketTotalAmount"),
  ticketReceiptPreview: document.querySelector("#ticketReceiptPreview"),
  saveTicketBtn: document.querySelector("#saveTicketBtn"),
  backToMarketsBtn: document.querySelector("#backToMarketsBtn"),
  ticketHistoryList: document.querySelector("#ticketHistoryList"),
  ticketLimitList: document.querySelector("#ticketLimitList"),
  ticketRecentList: document.querySelector("#ticketRecentList"),
  quickCustomer: document.querySelector("#quickCustomer"),
  toggleQuickCustomerBtn: document.querySelector("#toggleQuickCustomerBtn"),
  quickCustomerForm: document.querySelector("#quickCustomerForm"),
  quickCustomerName: document.querySelector("#quickCustomerNameInput"),
  quickCustomerHeadHouse: document.querySelector("#quickCustomerHeadHouseInput"),
  quickHeadHouse: document.querySelector("#quickHeadHouse"),
  quickLottery: document.querySelector("#quickLottery"),
  quickRound: document.querySelector("#quickRound"),
  quickBetType: document.querySelector("#quickBetType"),
  quickAmount: document.querySelector("#quickAmount"),
  quickMessage: document.querySelector("#quickMessage"),
  quickNote: document.querySelector("#quickNoteInput"),
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
  // Modal + UX additions (polish-to-10)
  confirmDialog: document.querySelector("#confirmDialog"),
  confirmDialogTitle: document.querySelector("#confirmDialogTitle"),
  confirmDialogBody: document.querySelector("#confirmDialogBody"),
  confirmDialogReason: document.querySelector("#confirmDialogReason"),
  confirmDialogYes: document.querySelector("#confirmDialogYes"),
  confirmDialogNo: document.querySelector("#confirmDialogNo"),
  copyReceiptBtn: document.querySelector("#copyReceiptBtn"),
  printReceiptBtn: document.querySelector("#printReceiptBtn"),
  themeToggleBtn: document.querySelector("#themeToggleBtn"),
  navToggleBtn: document.querySelector("#navToggleBtn"),
  primaryNav: document.querySelector("#primaryNav"),
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
  roundResultTime: document.querySelector("#roundResultTimeInput"),
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
  scheduleResultTime: document.querySelector("#scheduleResultTimeInput"),
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
  resultStatusBar: document.querySelector("#resultStatusBar"),
  resultSourcesList: document.querySelector("#resultSourcesList"),
  resultImportsBody: document.querySelector("#resultImportsBody"),
  pendingTicketsBody: document.querySelector("#pendingTicketsBody"),
  pendingTicketsEmpty: document.querySelector("#pendingTicketsEmpty"),
  pendingResultsList: document.querySelector("#pendingResultsList"),
  auditLogList: document.querySelector("#auditLogList"),
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
  toastStack: document.querySelector("#toastStack"),
  recordActionsTemplate: document.querySelector("#recordActionsTemplate"),
  limitActionsTemplate: document.querySelector("#limitActionsTemplate"),
};

initialize();

async function initialize() {
  bindEvents();
  elements.roundDate.value = today();
  elements.roundOpenDate.value = today();
  elements.roundOpenTime.value = "00:00";
  elements.roundResultTime.value = "00:00";
  resetScheduleForm();
  window.setInterval(renderTimeSensitiveUi, 1000);
  await bootAuth();
  if (window.location.hash === "#intake") activateView("intake");
}

async function bindEvents() {
  elements.setupForm.addEventListener("submit", handleSetup);
  elements.loginForm.addEventListener("submit", handleLogin);
  elements.logoutBtn.addEventListener("click", handleLogout);
  elements.sidebarLogoutBtn.addEventListener("click", handleLogout);
  elements.sidebarProfileBtn.addEventListener("click", () => activateView("users"));
  elements.backToMarketsBtn.addEventListener("click", async () => {
    if (!(await confirmDraftDiscard())) return;
    activateView("markets");
  });
  elements.exportBtn.addEventListener("click", exportData);

  elements.navButtons.forEach((button) => {
    button.addEventListener("click", () => activateView(button.dataset.viewTarget));
  });

  elements.ticketRound.addEventListener("change", async () => {
    const nextRoundId = elements.ticketRound.value;
    if (!(await prepareRoundSwitch(nextRoundId))) {
      elements.ticketRound.value = state.ticketDraftEntries[0]?.roundId || "";
      return;
    }
    renderTicketWorkbench();
  });
  elements.ticketHeadHouse.addEventListener("change", renderTicketReceiptPreview);
  elements.ticketNote.addEventListener("input", renderTicketReceiptPreview);
  elements.ticketNumber.addEventListener("input", () => {
    if (getIntakeAction()?.target === "run_pair") {
      state.ticketRunDigits = elements.ticketNumber.value
        .replace(/\D/g, "")
        .split("")
        .filter((digit, index, digits) => digits.indexOf(digit) === index);
    }
    renderTicketLimitPreview();
    renderTicketExpansionPreview();
  });
  elements.ticketTopAmount.addEventListener("input", () => {
    renderTicketLimitPreview();
    renderTicketExpansionPreview();
  });
  elements.ticketBottomAmount.addEventListener("input", () => {
    renderTicketLimitPreview();
    renderTicketExpansionPreview();
  });
  elements.ticketTodAmount.addEventListener("input", () => {
    renderTicketLimitPreview();
    renderTicketExpansionPreview();
  });
  elements.ticketNumber.addEventListener("keydown", handleTicketNumberKeydown);
  elements.ticketTopAmount.addEventListener("keydown", handleTicketAmountKeydown);
  elements.ticketBottomAmount.addEventListener("keydown", handleTicketAmountKeydown);
  elements.ticketTodAmount.addEventListener("keydown", handleTicketAmountKeydown);
  elements.addTicketEntryBtn.addEventListener("click", addTicketDraftEntry);
  elements.ticketDoubleBtn.addEventListener("click", toggleTicketDoubles);
  elements.ticketReverseBtn.addEventListener("click", toggleTicketReverse);
  elements.clearTicketBtn.addEventListener("click", clearTicketDraft);
  elements.saveTicketBtn.addEventListener("click", saveTicketDraft);
  document.querySelectorAll("[data-intake-mode]").forEach((button) => {
    button.addEventListener("click", () => activateIntakeMode(button.dataset.intakeMode));
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
  // Polish: list search filters (customers, head houses, users)
  if (elements.customerSearchInput) {
    elements.customerSearchInput.addEventListener("input", (e) => {
      state.customerFilter = e.target.value;
      renderCustomers();
    });
  }
  if (elements.headHouseSearchInput) {
    elements.headHouseSearchInput.addEventListener("input", (e) => {
      state.headHouseFilter = e.target.value;
      renderHeadHouses();
    });
  }
  if (elements.userSearchInput) {
    elements.userSearchInput.addEventListener("input", (e) => {
      state.userFilter = e.target.value;
      renderUsers();
    });
  }

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
    showToast("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", "danger");
  }
}

async function handleLogout() {
  try {
    await api("/api/logout", { method: "POST" });
  } catch {
    // Logout must always return the operator to the login screen, even if the session already expired.
  }
  state.user = null;
  state.entries = [];
  state.tickets = [];
  state.ticketDraftEntries = [];
  elements.appShell.classList.add("hidden");
  elements.authShell.classList.remove("hidden");
  elements.loginForm.classList.remove("hidden");
  elements.setupForm.classList.add("hidden");
  elements.loginPassword.value = "";
  elements.loginUsername.focus();
}

async function enterApp() {
  elements.authShell.classList.add("hidden");
  elements.appShell.classList.remove("hidden");
  elements.currentUserLabel.textContent = state.user.username;
  elements.sidebarUsername.textContent = state.user.username;
  elements.sidebarRole.textContent = state.user.role;
  configureRoleAccess();
  await refreshState();
  activateView(state.user.role === "head_house_viewer" ? "headHouseReport" : "markets", false);
}

async function refreshState() {
  Object.assign(state, await api("/api/state"));
  render();
}

function activateView(viewName, shouldScroll = true) {
  const meta = VIEW_META[viewName] ?? VIEW_META.dashboard;
  const settingsViews = new Set(["customers", "headHouses", "headHouseReport", "lotteries", "limits", "payouts", "users"]);
  elements.views.forEach((view) => {
    const isActive = view.dataset.view === viewName;
    view.hidden = !isActive;
    view.classList.toggle("is-active", isActive);
  });
  elements.navButtons.forEach((button) => {
    const target = viewName === "intake" ? "markets" : settingsViews.has(viewName) ? "manage" : viewName;
    button.classList.toggle("is-active", button.dataset.viewTarget === target);
  });
  elements.currentViewEyebrow.textContent = meta.eyebrow;
  elements.currentViewTitle.textContent = meta.title;
  if (shouldScroll) window.scrollTo({ top: 0, behavior: "smooth" });
}

function render() {
  renderSelects();
  renderDashboard();
  renderSidebarRates();
  renderTicketWorkbench();
  renderReview();
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
  renderResultLinks();
  renderFinanceLedger();
  renderSettlement();
  renderHeadHouseReport();
  renderUsers();
  renderQuickPreview();
  renderLimitPreview();
  syncUserHeadHouseField();
  renderSidebarSummary();
  renderMarketAdmin();
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
  preserveSelect(elements.quickCustomerHeadHouse, headHouseOptions, "direct");
  preserveSelect(elements.quickHeadHouse, headHouseOptions, "direct");
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
  preserveSelect(elements.ticketHeadHouse, headHouseOptions, "direct");
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
  syncIntakeNumberLength();
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
  const approvedEntries = getApprovedEntries();
  const pendingTickets = state.tickets.filter((ticket) => ticket.status === "pending_review");
  const pendingResults = getRoundsPendingResultReview();
  elements.totalAmount.textContent = money(sum(approvedEntries.map((entry) => entry.amount)));
  elements.totalEntries.textContent = approvedEntries.length.toLocaleString("th-TH");
  elements.totalCustomers.textContent = state.customers.length.toLocaleString("th-TH");
  if (elements.openRoundsCount) {
    elements.openRoundsCount.textContent = state.rounds.filter(isRoundAcceptingNow).length.toLocaleString("th-TH");
  }
  if (elements.totalLimits) {
    elements.totalLimits.textContent = state.limits.length.toLocaleString("th-TH");
  }
  elements.nearLimitCount.textContent = limitStatuses.filter((item) => item.status !== "normal").length.toLocaleString("th-TH");
  elements.pendingTicketCount.textContent = pendingTickets.length.toLocaleString("th-TH");
  if (elements.pendingResultCount) {
    elements.pendingResultCount.textContent = pendingResults.length.toLocaleString("th-TH");
  }

  renderTaskQueue(pendingTickets, pendingResults);
  renderLimitWatchList(limitStatuses);
  renderRecentEntries();
  renderMarketSummary();
  renderLotteryBoard();
  renderClosingSoonBanner();
}

function renderMarketSummary() {
  const playableLotteries = getPlayableLotteries();
  const openRounds = state.rounds.filter((round) => playableLotteries.some((lottery) => lottery.id === round.lottery_id) && isRoundAcceptingNow(round));
  const closingSoon = openRounds.filter((round) => {
    const remainingMs = new Date(round.close_at).getTime() - Date.now();
    return remainingMs > 0 && remainingMs <= 60 * 60 * 1000;
  }).length;
  const unavailableProducts = playableLotteries.filter((lottery) => !isRoundAcceptingNow(getDisplayRoundForLottery(lottery.id))).length;

  const summaryHtml = `
    <span>เปิดรับ ${openRounds.length.toLocaleString("th-TH")} งวด</span>
    <span>ใกล้ปิด ${closingSoon.toLocaleString("th-TH")} งวด</span>
    <span>รอเปิด ${unavailableProducts.toLocaleString("th-TH")} หวย</span>
  `;
  if (elements.marketSummary) elements.marketSummary.innerHTML = summaryHtml;
  if (elements.playMarketSummary) elements.playMarketSummary.innerHTML = summaryHtml;
}

function renderMarketAdmin() {
  if (!elements.marketAdminSummary || !elements.marketAdminBoard) return;
  const activeSchedules = state.scheduleTemplates.filter((schedule) => schedule.active);
  const inactiveSchedules = state.scheduleTemplates.filter((schedule) => !schedule.active);
  const unscheduledLotteries = state.lotteries.filter(
    (lottery) => !state.scheduleTemplates.some((schedule) => schedule.lottery_id === lottery.id),
  );
  elements.marketAdminSummary.innerHTML = `
    <span>ใช้งาน ${activeSchedules.length.toLocaleString("th-TH")} หวย</span>
    <span>พักไว้ ${inactiveSchedules.length.toLocaleString("th-TH")} หวย</span>
    <span>ยังไม่ตั้งเวลา ${unscheduledLotteries.length.toLocaleString("th-TH")} หวย</span>
    <span>ใกล้ปิด ${state.rounds.filter((round) => getRoundTimingStatus(round).state === "closing_soon").length.toLocaleString("th-TH")} งวด</span>
  `;

  elements.marketAdminBoard.innerHTML = LOTTERY_CATEGORIES.map((category) => {
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
              const schedule = state.scheduleTemplates.find((item) => item.lottery_id === lottery.id);
              const status = getRoundTimingStatus(round);
              return `
                <article class="lottery-card market-admin-card ${status.cardClass}">
                  <span class="lottery-card-flag ${getLotteryFlagClass(lottery.id)}" aria-hidden="true"></span>
                  <strong>${escapeHtml(lottery.name)}</strong>
                  <span>${round ? `${escapeHtml(round.label)} · ${formatRoundCloseTime(round)}` : "ยังไม่มีงวด"}</span>
                  <small>${schedule ? `${escapeHtml(formatScheduleFrequency(schedule))} · ออก ${escapeHtml(schedule.draw_time)}` : "ยังไม่ตั้งเวลา"}</small>
                  <em class="${status.state === "closing_soon" ? "danger-text" : ""}">${round ? `${status.label}${isRoundAcceptingNow(round) ? ` ${formatCountdownCompact(round)}` : ""}` : "ยังไม่ตั้งงวด"}</em>
                  <div class="market-card-actions">
                    <button class="button button-secondary configure-market-button" type="button" data-lottery-id="${escapeHtml(lottery.id)}">ตั้งค่า</button>
                    <button class="button ${schedule?.active ? "button-danger" : "button-primary"} toggle-market-button" type="button" data-schedule-id="${escapeHtml(schedule?.id || "")}" ${schedule ? "" : "disabled"}>
                      ${schedule?.active ? "ปิด" : "เปิด"}
                    </button>
                  </div>
                </article>
              `;
            })
            .join("")}
        </div>
      </section>
    `;
  }).join("");

  elements.marketAdminBoard.querySelectorAll(".configure-market-button").forEach((button) => {
    button.addEventListener("click", () => {
      const schedule = state.scheduleTemplates.find((item) => item.lottery_id === button.dataset.lotteryId);
      activateView("lotteries");
      if (schedule) beginScheduleEdit(schedule.id);
    });
  });
  elements.marketAdminBoard.querySelectorAll(".toggle-market-button").forEach((button) => {
    button.addEventListener("click", () => toggleScheduleActive(button.dataset.scheduleId));
  });
}

async function toggleScheduleActive(id) {
  const schedule = state.scheduleTemplates.find((item) => item.id === id);
  if (!schedule) return;
  await api(`/api/schedule-templates/${schedule.id}`, {
    method: "PUT",
    body: {
      lotteryId: schedule.lottery_id,
      frequency: schedule.frequency,
      weekdays: schedule.weekdays.join(","),
      monthDays: schedule.month_days.join(","),
      openDaysBefore: schedule.open_days_before,
      openTime: schedule.open_time,
      drawTime: schedule.draw_time,
      resultTime: schedule.result_time || schedule.draw_time,
      closeBeforeMinutes: schedule.close_before_minutes,
      sourceNote: schedule.source_note,
      active: !schedule.active,
    },
  });
  await refreshState();
}

function renderSidebarSummary() {
  elements.sidebarBalance.textContent = money(sum(getApprovedEntries().map((entry) => entry.amount)));
}

function renderTaskQueue(pendingTickets, pendingResults) {
  const zeroRateCount = state.payoutRates.filter((rate) => Number(rate.rate) <= 0).length;
  const unscheduledLotteries = state.lotteries.filter(
    (lottery) => !state.scheduleTemplates.some((schedule) => schedule.lottery_id === lottery.id),
  );
  const waitingForResult = state.rounds.filter(
    (round) =>
      round.result_status !== "finalized" &&
      Date.now() >= new Date(round.result_at || round.draw_at).getTime() &&
      !state.results.some((result) => result.round_id === round.id),
  );
  const tasks = [];
  if (pendingTickets.length) {
    tasks.push({
      tone: "warning",
      title: `${pendingTickets.length.toLocaleString("th-TH")} โพยรอตรวจ`,
      detail: "ตรวจและอนุมัติก่อนนำไปคิดยอดจริง",
      view: "review",
    });
  }
  if (pendingResults.length) {
    tasks.push({
      tone: "warning",
      title: `${pendingResults.length.toLocaleString("th-TH")} งวดรอยืนยันผล`,
      detail: "บันทึกผลแล้วแต่ยังไม่ปิดงาน",
      view: "results",
    });
  }
  if (waitingForResult.length) {
    tasks.push({
      tone: "danger",
      title: `${waitingForResult.length.toLocaleString("th-TH")} งวดถึงเวลาประกาศผลแล้ว`,
      detail: "ยังไม่มีผลเข้าระบบ ต้องดึงผลหรือกรอกมือ",
      view: "results",
    });
  }
  if (zeroRateCount) {
    tasks.push({
      tone: "danger",
      title: `${zeroRateCount.toLocaleString("th-TH")} อัตราจ่ายยังเป็นศูนย์`,
      detail: "ควรตั้งค่าก่อนรับยอดจริง",
      view: "payouts",
    });
  }
  if (unscheduledLotteries.length) {
    tasks.push({
      tone: "warning",
      title: `${unscheduledLotteries.length.toLocaleString("th-TH")} หวยยังไม่มีตารางอัตโนมัติ`,
      detail: unscheduledLotteries.map((lottery) => lottery.name).join(", "),
      view: "lotteries",
    });
  }
  if (!tasks.length) {
    tasks.push({
      tone: "",
      title: "ไม่มีงานค้างสำคัญ",
      detail: "ระบบพร้อมรับรายการ",
    });
  }

  elements.taskQueueList.innerHTML = tasks
    .map(
      (task) => `
        <button class="task-item ${task.tone}" type="button" ${task.view ? `data-task-view="${task.view}"` : ""}>
          <strong>${escapeHtml(task.title)}</strong>
          <span>${escapeHtml(task.detail)}</span>
        </button>
      `,
    )
    .join("");

  elements.taskQueueList.querySelectorAll("[data-task-view]").forEach((button) => {
    button.addEventListener("click", () => activateView(button.dataset.taskView));
  });
}

function renderLotteryBoard() {
  if (!elements.lotteryBoard) return;
  elements.lotteryBoard.innerHTML = LOTTERY_CATEGORIES.map((category) => {
    const lotteries = getPlayableLotteries(category.id);
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
              // Smart empty-state: show next expected draw from schedule, or prompt to set up
              const schedule = getScheduleForLottery(lottery.id);
              const nextExpected = !round ? getNextExpectedDrawFromSchedule(lottery.id) : null;
              const hasInfo = round || nextExpected;
              return `
                <button
                  class="lottery-card ${status.cardClass} ${!round && nextExpected ? "is-upcoming" : ""} ${!round && !schedule ? "is-no-schedule" : ""}"
                  type="button"
                  data-lottery-id="${escapeHtml(lottery.id)}"
                  ${round ? "" : nextExpected ? "" : !schedule ? "" : ""}
                >
                  <span class="lottery-card-flag ${getLotteryFlagClass(lottery.id)}" aria-hidden="true"></span>
                  <strong>${escapeHtml(lottery.name)}</strong>
                  <span>${
                    round
                      ? escapeHtml(round.label)
                      : nextExpected
                        ? `งวดถัดไป · ${shortDate(nextExpected.date)}`
                        : !schedule
                          ? "ยังไม่ตั้งเวลาอัตโนมัติ"
                          : "ยังไม่มีงวด"
                  }</span>
                  <small>${
                    round
                      ? `ปิดรับ ${formatRoundCloseTime(round)} · ออก ${escapeHtml(round.draw_time)}`
                      : nextExpected
                        ? `อีก ${nextExpected.daysAhead.toLocaleString("th-TH")} วัน · ออก ${escapeHtml(nextExpected.time)}`
                        : "-"
                  }</small>
                  <small>${
                    round
                      ? `ประกาศผล ${escapeHtml(round.result_time || round.draw_time)}`
                      : !schedule
                        ? "กดเพื่อตั้งเวลา →"
                        : "ระบบจะสร้างงวดอัตโนมัติเมื่อใกล้วัน"
                  }</small>
                  <em>${
                    round
                      ? `${status.label}${isRoundAcceptingNow(round) ? ` ${formatCountdownCompact(round)}` : ""}`
                      : nextExpected
                        ? "ยังไม่ถึงรอบรับ"
                        : "กดเพื่อตั้งค่า"
                  }</em>
                </button>
              `;
            })
            .join("")}
        </div>
      </section>
    `;
  }).join("");

  elements.lotteryBoard.querySelectorAll("[data-lottery-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const lotteryId = button.dataset.lotteryId;
      const round = getDisplayRoundForLottery(lotteryId);
      const schedule = getScheduleForLottery(lotteryId);
      const nextExpected = !round ? getNextExpectedDrawFromSchedule(lotteryId) : null;

      // Case 1: round exists and is open — go to intake
      if (round && isRoundAcceptingNow(round)) {
        if (!(await prepareRoundSwitch(round.id))) return;
        activateView("intake");
        elements.ticketRound.value = round.id;
        renderTicketWorkbench();
        return;
      }
      // Case 2: round exists but closed
      if (round) {
        showToast(`${getLotteryName(round.lottery_id)} ยังไม่เปิดรับหรือปิดรับแล้ว`, "warning");
        return;
      }
      // Case 3: no round but schedule exists — generate rounds + open intake for nearest
      if (nextExpected || schedule) {
        showToast("กำลังสร้างงวดล่วงหน้าให้...", "success");
        try {
          await api("/api/schedule-templates/generate", { method: "POST", body: { days: 60 } });
          await refreshState();
          const newRound = getDisplayRoundForLottery(lotteryId);
          if (newRound) {
            if (!(await prepareRoundSwitch(newRound.id))) return;
            activateView("intake");
            elements.ticketRound.value = newRound.id;
            renderTicketWorkbench();
            showToast(`เปิดงวด ${escapeHtml ? newRound.label : newRound.label} แล้ว — เริ่มคีย์ได้เลย`, "success");
            return;
          }
          showToast("ระบบไม่พบงวดถัดไปจากตารางเวลา ลองสร้างงวดมือในหน้าตั้งค่า", "warning");
          activateView("lotteries");
        } catch {
          showToast("สร้างงวดอัตโนมัติไม่สำเร็จ ลองอีกครั้ง", "danger");
        }
        return;
      }
      // Case 4: no round, no schedule — guide admin to set up
      showToast(`${getLotteryName(lotteryId)} ยังไม่ตั้งเวลาอัตโนมัติ — เปิดหน้าตั้งค่าให้`, "warning");
      activateView("lotteries");
    });
  });
}

function getPlayableLotteries(categoryId = "") {
  return state.lotteries.filter((lottery) => {
    const matchesCategory = !categoryId || (lottery.category || "other") === categoryId;
    const hasActiveSchedule = state.scheduleTemplates.some((schedule) => schedule.lottery_id === lottery.id && schedule.active);
    return matchesCategory && hasActiveSchedule;
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
  const recentEntries = getApprovedEntries();
  elements.recentEntriesList.innerHTML = recentEntries.length
    ? recentEntries
        .slice(0, 6)
        .map(
          (entry) => `
            <article class="recent-item">
              <div>
                <strong>${escapeHtml(entry.number)} · ${escapeHtml(getBetTypeName(entry.bet_type_id))}</strong>
                <span>${escapeHtml(formatEntryCustomer(entry))} / ${escapeHtml(formatRound(getRound(entry.round_id)))}</span>
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
  renderTicketAmountFields();
  renderTicketActionTools();
  renderTicketDraft();
  renderTicketReceiptPreview();
  renderTicketLimitPreview();
  renderTicketExpansionPreview();
  renderTicketHistory();
  renderTicketLimits();
  renderTicketRecentEntries();
  renderSidebarRates();
}

function activateIntakeMode(mode) {
  document.querySelectorAll("[data-intake-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.intakeMode === mode);
  });
  document.querySelector("#quickPanel")?.classList.toggle("hidden", mode !== "paste");
  document.querySelector("#entryPanel")?.classList.toggle("hidden", mode !== "classic");

  if (mode === "paste") {
    elements.quickMessage.focus();
    return;
  }

  if (mode === "classic") {
    elements.number.focus();
    return;
  }

  elements.ticketNumber.focus();
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
  const selectedAction = getIntakeAction();
  const referenceBetType =
    selectedAction?.id === "run_pair"
      ? "run_top"
      : selectedAction?.id === "two_pair" || selectedAction?.id === "nineteen_gate"
        ? "two_top"
        : selectedAction?.id === "six_return" || selectedAction?.id === "three_pair"
          ? "three_top"
          : selectedAction?.id;
  elements.ticketRateLabel.textContent = `${selectedAction?.label || "-"} บาทละ ${formatRate(getPayoutRate(round.lottery_id, referenceBetType))}`;
  elements.ticketFlag.className = `flag ${getLotteryFlagClass(round.lottery_id)} large-flag`;
  elements.ticketComposeRoundLabel.textContent = `${getLotteryName(round.lottery_id)} · ${round.label}`;
  elements.ticketComposeDate.textContent = shortDate(round.draw_date);
  elements.ticketSummaryRoundLabel.textContent = `${getLotteryName(round.lottery_id)} · ${round.label}`;
}

function renderTicketBetTypeTabs() {
  elements.ticketBetTypeTabs.innerHTML = INTAKE_ACTIONS
    .map(
      (action) => `
        <button
          class="ticket-tab ${action.id === state.ticketBetTypeId ? "is-active" : ""}"
          type="button"
          data-ticket-bet-type="${escapeHtml(action.id)}"
        >
          ${escapeHtml(action.label)}
        </button>
      `,
    )
    .join("");

  elements.ticketBetTypeTabs.querySelectorAll("[data-ticket-bet-type]").forEach((button) => {
      button.addEventListener("click", () => {
        state.ticketBetTypeId = button.dataset.ticketBetType;
        state.ticketReverseEnabled = false;
        state.ticketUseDoubles = false;
        state.ticketRunDigits = [];
        syncIntakeNumberLength();
        renderTicketWorkbench();
      elements.ticketNumber.focus();
    });
  });
}

function handleTicketNumberKeydown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    if (elements.ticketTopAmount.value.trim() || elements.ticketBottomAmount.value.trim()) {
      addTicketDraftEntry();
    } else {
      elements.ticketTopAmount.focus();
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
  const customerId = "walkin";
  const roundId = elements.ticketRound.value;
  const number = elements.ticketNumber.value.trim();
  const validationMessage = getIntakeValidationMessage();
  if (validationMessage) {
    showTicketInlineFeedback(validationMessage, "warning");
    showToast(validationMessage, "warning");
    return;
  }
  const newEntries = buildIntakeEntries({ customerId, roundId, number });
  const issues = newEntries.length ? newEntries.flatMap((entry) => getDraftIssues(entry)) : ["ยังไม่มีรายการที่เพิ่มได้"];

  if (issues.length) {
    showTicketInlineFeedback(issues[0], "warning");
    showToast(issues.join(", "), "warning");
    return;
  }

  const firstEntry = state.ticketDraftEntries[0];
  if (firstEntry && (firstEntry.customerId !== customerId || firstEntry.roundId !== roundId)) {
    showTicketInlineFeedback("หนึ่งบิลต้องเป็นหัวบ้านและงวดเดียวกัน", "warning");
    showToast("หนึ่งโพยต้องเป็นลูกค้าและงวดเดียวกัน", "warning");
    return;
  }

  newEntries.forEach((newEntry) => {
    const duplicate = state.ticketDraftEntries.find(
      (entry) =>
        entry.customerId === customerId &&
        entry.roundId === roundId &&
        entry.betTypeId === newEntry.betTypeId &&
        entry.number === newEntry.number,
    );
    if (duplicate) duplicate.amount += newEntry.amount;
    else state.ticketDraftEntries.push({ id: createClientId(), ...newEntry });
  });
  state.latestReceiptTicketId = null;
  elements.ticketNumber.value = "";
  state.ticketUseDoubles = false;
  state.ticketRunDigits = [];
  elements.ticketNumber.focus();
  renderTicketWorkbench();
  flashTicketDraft();
  showTicketInlineFeedback(`เพิ่มเข้าในบิลแล้ว ${newEntries.length.toLocaleString("th-TH")} เลข`, "success");
  showToast(`เพิ่มเข้าในบิลแล้ว ${newEntries.length.toLocaleString("th-TH")} เลข`, "success");
}

function buildIntakeEntries({ customerId, roundId, number }) {
  const action = getIntakeAction();
  const topAmount = parseAmount(elements.ticketTopAmount.value);
  const bottomAmount = parseAmount(elements.ticketBottomAmount.value);
  const todAmount = parseAmount(elements.ticketTodAmount.value);
  if (!action) return [];
  const numbers = getIntakeNumbers(action, number);

  if (action.target === "run_pair") {
    return numbers.flatMap((entryNumber) => [
      ...(topAmount > 0 ? [{ customerId, roundId, betTypeId: "run_top", number: entryNumber, amount: topAmount }] : []),
      ...(bottomAmount > 0 ? [{ customerId, roundId, betTypeId: "run_bottom", number: entryNumber, amount: bottomAmount }] : []),
    ]);
  }
  if (action.target === "pair") {
    return numbers.flatMap((entryNumber) => [
      ...(topAmount > 0 ? [{ customerId, roundId, betTypeId: "two_top", number: entryNumber, amount: topAmount }] : []),
      ...(bottomAmount > 0 ? [{ customerId, roundId, betTypeId: "two_bottom", number: entryNumber, amount: bottomAmount }] : []),
    ]);
  }
  if (action.target === "six_return") {
    return numbers.map((item) => ({ customerId, roundId, betTypeId: "three_top", number: item, amount: topAmount }));
  }
  if (action.target === "nineteen_gate") {
    return numbers.map((item) => ({
      customerId,
      roundId,
      betTypeId: "two_top",
      number: item,
      amount: topAmount,
    }));
  }
  if (action.target === "three_pair") {
    return numbers.flatMap((entryNumber) => [
      ...(topAmount > 0 ? [{ customerId, roundId, betTypeId: "three_top", number: entryNumber, amount: topAmount }] : []),
      ...(todAmount > 0 ? [{ customerId, roundId, betTypeId: "three_tod", number: entryNumber, amount: todAmount }] : []),
    ]);
  }
  return [];
}

function getIntakeAction() {
  return INTAKE_ACTIONS.find((action) => action.id === state.ticketBetTypeId);
}

function syncIntakeNumberLength() {
  const digits = getIntakeAction()?.digits || 3;
  elements.ticketNumber.maxLength = digits;
  elements.ticketNumber.placeholder = digits === 1 ? "เช่น 5" : digits === 2 ? "เช่น 45" : "เช่น 123";
  elements.ticketNumber.value = elements.ticketNumber.value.replace(/\D/g, "").slice(0, digits);
}

function renderTicketAmountFields() {
  const target = getIntakeAction()?.target;
  const showBottom = target === "run_pair" || target === "pair";
  const showTod = target === "three_pair";
  elements.ticketBottomAmountField.classList.toggle("hidden", !showBottom);
  elements.ticketTodAmountField.classList.toggle("hidden", !showTod);
  elements.ticketTopAmountField.classList.toggle("hidden", false);
}

function renderTicketActionTools() {
  const action = getIntakeAction();
  const isRun = action?.target === "run_pair";
  const supportsDoubles = action?.target === "pair";
  const supportsReverse = action?.target === "pair" || action?.target === "three_pair";

  elements.ticketActionHint.textContent = "";
  elements.ticketActionHint.classList.add("hidden");
  elements.ticketDoubleBtn.classList.toggle("hidden", !supportsDoubles);
  elements.ticketReverseBtn.classList.toggle("hidden", !supportsReverse);
  elements.ticketDoubleBtn.classList.toggle("is-active", state.ticketUseDoubles);
  elements.ticketReverseBtn.classList.toggle("is-active", state.ticketReverseEnabled);
  elements.ticketKeypad.classList.toggle("hidden", !isRun);

  if (!isRun) {
    elements.ticketKeypad.innerHTML = "";
    return;
  }

  elements.ticketKeypad.innerHTML = Array.from({ length: 10 }, (_, index) => {
    const digit = index === 9 ? 0 : index + 1;
    const isActive = state.ticketRunDigits.includes(String(digit));
    return `<button class="${isActive ? "is-active" : ""}" type="button" data-ticket-key="${digit}">${digit}</button>`;
  }).join("");
  elements.ticketKeypad.querySelectorAll("[data-ticket-key]").forEach((button) => {
    button.addEventListener("click", () => {
      const digit = button.dataset.ticketKey;
      state.ticketRunDigits = state.ticketRunDigits.includes(digit)
        ? state.ticketRunDigits.filter((item) => item !== digit)
        : [...state.ticketRunDigits, digit];
      elements.ticketNumber.value = state.ticketRunDigits.join("");
      renderTicketLimitPreview();
      renderTicketExpansionPreview();
      elements.ticketTopAmount.focus();
    });
  });
}

function toggleTicketDoubles() {
  state.ticketUseDoubles = !state.ticketUseDoubles;
  if (state.ticketUseDoubles) {
    state.ticketReverseEnabled = false;
    elements.ticketNumber.value = "";
  }
  renderTicketWorkbench();
}

function toggleTicketReverse() {
  state.ticketReverseEnabled = !state.ticketReverseEnabled;
  if (state.ticketReverseEnabled) state.ticketUseDoubles = false;
  renderTicketWorkbench();
}

function getIntakeNumbers(action, number) {
  if (!action) return [];
  if (action.target === "run_pair") {
    return state.ticketRunDigits.length
      ? state.ticketRunDigits
      : number
          .replace(/\D/g, "")
          .split("")
          .filter((digit, index, digits) => digits.indexOf(digit) === index);
  }
  if (state.ticketUseDoubles && action.target === "pair") {
    return Array.from({ length: 10 }, (_, digit) => `${digit}${digit}`);
  }
  if (action.target === "six_return") return [...new Set(permutations(number))];
  if (action.target === "nineteen_gate") return nineteenGateNumbers(number);
  if (!number) return [];
  if (state.ticketReverseEnabled && number.length > 1) {
    return [...new Set([number, number.split("").reverse().join("")])];
  }
  return [number];
}

function permutations(value) {
  if (value.length <= 1) return [value];
  return value.split("").flatMap((char, index) =>
    permutations(value.slice(0, index) + value.slice(index + 1)).map((tail) => char + tail),
  );
}

function nineteenGateNumbers(value) {
  const digit = String(value || "").slice(0, 1);
  if (!/^\d$/.test(digit)) return [];
  const pairs = [];
  for (let n = 0; n <= 9; n += 1) pairs.push(`${digit}${n}`);
  for (let n = 0; n <= 9; n += 1) {
    const candidate = `${n}${digit}`;
    if (!pairs.includes(candidate)) pairs.push(candidate);
  }
  return pairs;
}

function getDraftIssues(entry) {
  const issues = [];
  if (!entry.customerId) issues.push("ยังไม่เลือกลูกค้า");
  if (!entry.roundId) issues.push("ยังไม่เลือกงวด");
  if (entry.roundId && !isRoundAcceptingNow(getRound(entry.roundId))) issues.push("งวดนี้ปิดรับแล้ว");
  const betType = getBetType(entry.betTypeId);
  if (!betType || !isValidNumber(entry.number, betType.digits)) issues.push("เลขไม่ตรงประเภท");
  if (!Number.isFinite(entry.amount) || entry.amount <= 0) issues.push("ยอดต้องมากกว่า 0");
  return issues;
}

function getIntakeValidationMessage() {
  const action = getIntakeAction();
  const number = elements.ticketNumber.value.trim();
  const numbers = getIntakeNumbers(action, number);
  const topAmount = parseAmount(elements.ticketTopAmount.value);
  const bottomAmount = parseAmount(elements.ticketBottomAmount.value);
  const todAmount = parseAmount(elements.ticketTodAmount.value);
  if (!elements.ticketRound.value) return "เลือกงวดก่อน";
  if (!numbers.length) return "เลือกหรือใส่เลขก่อน";
  if (action?.target === "three_pair") return topAmount > 0 || todAmount > 0 ? "" : "ใส่ยอดบนหรือยอดโต๊ดก่อน";
  if (action?.target === "run_pair" || action?.target === "pair") {
    return topAmount > 0 || bottomAmount > 0 ? "" : "ใส่ยอดบนหรือล่างก่อน";
  }
  return topAmount > 0 ? "" : "ใส่ยอดบนก่อน";
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

async function clearTicketDraft() {
  if (!state.ticketDraftEntries.length) return;
  if (!(await confirmDialog({ title: "ล้างรายการในบิล", body: "เลขในบิลทั้งหมดจะถูกลบ คุณยืนยันใช่หรือไม่?", danger: true }))) return;
  state.ticketDraftEntries = [];
  renderTicketWorkbench();
}

async function saveTicketDraft() {
  if (!state.ticketDraftEntries.length) {
    showTicketInlineFeedback("เพิ่มเลขลงบิลก่อน แล้วค่อยบันทึกบิล", "warning");
    return;
  }

  const groupedIssues = state.ticketDraftEntries.flatMap((entry) => getDraftIssues(entry));
  if (groupedIssues.length) {
    showTicketInlineFeedback(groupedIssues[0], "warning");
    showToast("ยังมีรายการที่ข้อมูลไม่ครบ", "warning");
    return;
  }

  try {
    const inserted = await api("/api/entries/batch", {
      method: "POST",
      body: {
        sourceChannel: "manual",
        headHouseId: elements.ticketHeadHouse.value,
        note: elements.ticketNote.value.trim(),
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
    state.latestReceiptTicketId = inserted[0]?.ticket_id || null;
    state.ticketDraftEntries = [];
    elements.ticketNote.value = "";
    await refreshState();
    const ticketCode = getTicket(inserted[0]?.ticket_id)?.code;
    showToast(ticketCode ? `บันทึกบิลแล้ว ${ticketCode} อยู่ในรายการแทง` : "บันทึกบิลแล้ว อยู่ในรายการแทง", "success");
    elements.ticketReceiptPreview.classList.add("is-fresh");
    window.setTimeout(() => elements.ticketReceiptPreview.classList.remove("is-fresh"), 1400);
    activateView("entries");
  } catch (error) {
    handleLimitError(error);
  }
}

function renderTicketReceiptPreview() {
  const savedTicket = getTicket(state.latestReceiptTicketId);
  const savedEntries = savedTicket ? state.entries.filter((entry) => entry.ticket_id === savedTicket.id) : [];
  const round = savedTicket ? getRound(savedTicket.round_id) : getRound(elements.ticketRound.value);
  const draftEntries = savedTicket ? savedEntries : state.ticketDraftEntries;
  const note = savedTicket?.note || elements.ticketNote.value.trim();
  const headHouseId = savedTicket?.head_house_id || elements.ticketHeadHouse.value;
  const headHouse = state.headHouses.find((item) => item.id === headHouseId);
  const code = savedTicket?.code || "รหัสบิลจะออกหลังบันทึก";
  const customerLabel = note || "ยังไม่ได้ใส่ชื่อ LINE ลูกค้า";
  const createdAt = savedTicket ? formatDateTime(savedTicket.created_at) : "ยังไม่บันทึก";
  const total = sum(draftEntries.map((entry) => entry.amount));
  const receiptRateSummary = buildReceiptRateSummary(round, draftEntries);
  const rows = draftEntries.length
    ? draftEntries
        .map(
          (entry) => `
            <div class="receipt-row">
              <span>${escapeHtml(getBetTypeName(entry.bet_type_id || entry.betTypeId))}</span>
              <strong>${escapeHtml(entry.number)}</strong>
              <em>${money(entry.amount)}</em>
            </div>
          `,
        )
        .join("")
    : '<p class="receipt-empty">เพิ่มรายการแล้วบิลจะขึ้นตรงนี้ทันที</p>';

  elements.ticketReceiptPreview.innerHTML = `
      <header class="receipt-header">
        <div>
          <span>บิลยืนยันรายการ</span>
          <strong>${escapeHtml(code)}</strong>
        </div>
        <div class="receipt-header-side">
          <span class="flag ${round ? getLotteryFlagClass(round.lottery_id) : "flag-generic"} receipt-flag" aria-hidden="true"></span>
          <div class="receipt-status">${savedTicket ? ticketStatusLabel(savedTicket.status) : "รอบันทึก"}</div>
        </div>
      </header>
    <section class="receipt-meta">
      <div>
        <span>ชื่อลูกค้า / LINE</span>
        <strong>${escapeHtml(customerLabel)}</strong>
      </div>
      <div>
        <span>หวย</span>
        <strong>${escapeHtml(round ? getLotteryName(round.lottery_id) : "-")}</strong>
      </div>
      <div>
        <span>หัวบ้าน</span>
        <strong>${escapeHtml(headHouse ? formatHeadHouse(headHouse) : "-")}</strong>
      </div>
      <div>
        <span>งวด</span>
        <strong>${escapeHtml(round ? `${round.label} · ${shortDate(round.draw_date)} ${round.draw_time}` : "-")}</strong>
      </div>
        <div>
          <span>เวลาออกบิล</span>
          <strong>${escapeHtml(createdAt)}</strong>
        </div>
        <div>
          <span>อัตราจ่าย</span>
          <strong>${escapeHtml(receiptRateSummary)}</strong>
        </div>
      </section>
    <section class="receipt-lines">${rows}</section>
    <footer class="receipt-total">
      <span>รวมทั้งบิล</span>
      <strong>${money(total)}</strong>
    </footer>
  `;
}

function buildReceiptRateSummary(round, entries) {
  if (!round) return "-";
  const fallbackBetTypeId =
    state.ticketBetTypeId === "run_pair"
      ? "run_top"
      : state.ticketBetTypeId === "three_pair"
        ? "three_top"
        : state.ticketBetTypeId === "nineteen_gate"
          ? "two_top"
          : state.ticketBetTypeId === "six_return"
            ? "three_top"
            : "two_top";
  const betTypeIds = [...new Set(entries.map((entry) => entry.bet_type_id || entry.betTypeId).filter(Boolean))];
  const visibleIds = betTypeIds.length ? betTypeIds : [fallbackBetTypeId];
  return visibleIds
    .map((betTypeId) => `${getBetTypeName(betTypeId)} บาทละ ${formatRate(getPayoutRate(round.lottery_id, betTypeId))}`)
    .join(" · ");
}

function renderSidebarRates() {
  if (!elements.sidebarRateList || !elements.sidebarRateRound) return;
  const round = getRound(elements.ticketRound.value) || getAcceptingRounds()[0] || null;
  const lottery = round ? state.lotteries.find((item) => item.id === round.lottery_id) : null;
  elements.sidebarRateRound.textContent = round ? lottery?.name || "-" : "-";
  if (!round) {
    elements.sidebarRateList.innerHTML = '<span class="sidebar-muted">ยังไม่มีงวดเปิดรับ</span>';
    return;
  }

  const visibleRates = ["two_top", "two_bottom", "three_top", "three_tod"]
    .map((betTypeId) => {
      const rate = getPayoutRate(round.lottery_id, betTypeId);
      return rate
        ? `
          <div class="sidebar-rate-row">
            <span>${escapeHtml(getBetTypeName(betTypeId))}</span>
            <strong>${formatRate(rate)}</strong>
          </div>
        `
        : "";
    })
    .join("");
  elements.sidebarRateList.innerHTML = visibleRates || '<span class="sidebar-muted">ยังไม่ตั้งอัตราจ่าย</span>';
}

function renderTicketLimitPreview() {
  const roundId = elements.ticketRound.value;
  const number = elements.ticketNumber.value.trim();
  const previewEntries = buildIntakeEntries({ customerId: "walkin", roundId, number });
  if (!roundId || !previewEntries.length) {
    elements.ticketLimitPreview.classList.add("hidden");
    return;
  }

  const item = previewEntries
    .map((entry) =>
      getLimitStatuses().find(
        (status) =>
          status.limit.round_id === roundId &&
          status.limit.bet_type_id === entry.betTypeId &&
          status.limit.number === entry.number,
      ),
    )
    .find(Boolean);
  if (!item) {
    elements.ticketLimitPreview.classList.add("hidden");
    return;
  }

  const sameDraftAmount = sum(
    state.ticketDraftEntries
      .filter(
        (entry) =>
          entry.roundId === roundId &&
          entry.betTypeId === item.limit.bet_type_id &&
          entry.number === item.limit.number,
      )
      .map((entry) => entry.amount),
  );
  const previewAmount = sum(
    previewEntries
      .filter((entry) => entry.betTypeId === item.limit.bet_type_id && entry.number === item.limit.number)
      .map((entry) => entry.amount),
  );
  const projected = item.currentAmount + sameDraftAmount + previewAmount;
  const ratio = item.limit.max_amount ? projected / item.limit.max_amount : 0;
  const status = ratio >= 1 ? "full" : ratio >= 0.8 ? "warning" : "normal";
  elements.ticketLimitPreview.className = `limit-preview ${status}`;
  elements.ticketLimitPreview.innerHTML = `
    <strong>มีอั้นเลขตรงกัน</strong>
    <span>ปัจจุบัน ${money(item.currentAmount)} / เพดาน ${money(item.limit.max_amount)}</span>
    <span>รวมโพยนี้แล้ว ${money(projected)} (${percent(ratio)})</span>
  `;
}

function renderTicketExpansionPreview() {
  const roundId = elements.ticketRound.value;
  const number = elements.ticketNumber.value.trim();
  const action = getIntakeAction();
  const previewNumbers = getIntakeNumbers(action, number);
  const isNumberReady =
    action?.target === "run_pair"
      ? previewNumbers.length > 0
      : state.ticketUseDoubles || isValidNumber(number, action?.digits || 0);
  if (!action || !isNumberReady || !previewNumbers.length) {
    elements.ticketExpansionPreview.classList.add("hidden");
    elements.ticketExpansionPreview.innerHTML = "";
    elements.addTicketEntryBtn.disabled = false;
    elements.addTicketEntryBtn.title = getIntakeValidationMessage();
    renderTicketInlineFeedback();
    return;
  }
  const previewEntries = buildIntakeEntries({ customerId: "walkin", roundId, number });
  const previewTotal = sum(previewEntries.map((entry) => entry.amount));
  const validationMessage = getIntakeValidationMessage();
  elements.addTicketEntryBtn.disabled = false;
  elements.addTicketEntryBtn.title = validationMessage;

  elements.ticketExpansionPreview.classList.remove("hidden");
  elements.ticketExpansionPreview.innerHTML = `
    <div class="ticket-preview-heading">
      <strong>เลขที่จะเพิ่ม</strong>
      <span>${previewNumbers.length} เลข · ${money(previewTotal)}</span>
    </div>
    <div>
      ${previewNumbers
        .map((entryNumber) => `<span>${escapeHtml(entryNumber)}</span>`)
        .join("")}
    </div>
    ${validationMessage ? `<small>${escapeHtml(validationMessage)}</small>` : ""}
  `;
  renderTicketInlineFeedback();
}

function renderTicketInlineFeedback() {
  if (!elements.ticketInlineFeedback) return;
  elements.ticketInlineFeedback.classList.add("hidden");
  elements.ticketInlineFeedback.textContent = "";
}

function showTicketInlineFeedback(message, tone = "warning") {
  if (!elements.ticketInlineFeedback) return;
  elements.ticketInlineFeedback.className = `ticket-inline-feedback ${tone}`;
  elements.ticketInlineFeedback.textContent = message;
}

function flashTicketDraft() {
  if (!elements.ticketDraftWrap) return;
  elements.ticketDraftWrap.classList.remove("is-updated");
  void elements.ticketDraftWrap.offsetWidth;
  elements.ticketDraftWrap.classList.add("is-updated");
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
              <span>${escapeHtml(formatEntryCustomer(entry))} · ${money(entry.amount)}</span>
            </article>
          `,
        )
        .join("")
    : '<div class="empty-state">ยังไม่มีรายการในงวดนี้</div>';
}

function parseQuickMessage() {
  const raw = elements.quickMessage.value.trim();
  if (!raw) {
    showToast("วางข้อความจาก LINE ก่อน", "warning");
    return;
  }

  const inferredLottery = inferLottery(raw) || elements.quickLottery.value;
  const inferredRound = findLatestOpenRound(inferredLottery)?.id || elements.quickRound.value;
  const inferredCustomer = inferCustomer(raw) || elements.quickCustomer.value;
  const inferredBetType = inferBetType(raw);
  const amountMatch = raw.match(/(\d+(?:,\d{3})*)\s*(?:บาท|บ(?![ก-๛]))/i);
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
    const customerHeadHouseId = getCustomer(inferredCustomer)?.head_house_id;
    if (customerHeadHouseId) elements.quickHeadHouse.value = customerHeadHouseId;
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

  const duplicateKeys = getDuplicateQuickEntryKeys(entries);
  const issueCount = entries.filter((entry) => getQuickEntryIssues(entry).length).length;
  elements.quickParseSummary.className = `parse-summary ${issueCount ? "warning" : "success"}`;
  elements.quickParseSummary.innerHTML = issueCount
    ? `พบ ${entries.length.toLocaleString("th-TH")} รายการ แต่ยังมี ${issueCount.toLocaleString("th-TH")} รายการที่ต้องแก้ก่อนบันทึก`
    : `พร้อมบันทึก ${entries.length.toLocaleString("th-TH")} รายการ${meta?.inferredLottery ? ` จาก ${escapeHtml(getLotteryName(meta.inferredLottery))}` : ""}${duplicateKeys.size ? ` · พบเลขซ้ำ ${duplicateKeys.size.toLocaleString("th-TH")} ชุด ระบบจะรวมยอดให้ตอนบันทึก` : ""}`;

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
    showToast("ยังมีรายการที่ข้อมูลไม่ครบ", "warning");
    return;
  }

  const entries = state.quickParsedEntries.map((entry) => ({
    customerId: entry.customerId,
    roundId: entry.roundId,
    betTypeId: entry.betTypeId,
    number: entry.number,
    amount: entry.amount,
    note: elements.quickNote.value.trim(),
    sourceText: entry.sourceText,
  }));
  const normalizedEntries = mergeDuplicateQuickEntries(entries);

  try {
    const inserted = await api("/api/entries/batch", {
      method: "POST",
      body: {
        sourceChannel: "line",
        headHouseId: elements.quickHeadHouse.value,
        sourceText: elements.quickMessage.value.trim(),
        note: elements.quickNote.value.trim(),
        entries: normalizedEntries,
      },
    });
    state.latestReceiptTicketId = inserted[0]?.ticket_id || null;
    clearQuickIntake();
    await refreshState();
    const ticketCode = getTicket(inserted[0]?.ticket_id)?.code;
    showToast(ticketCode ? `บันทึกโพยแล้ว รหัสโพย ${ticketCode}` : "บันทึกโพยแล้ว", "success");
    activateView("intake");
  } catch (error) {
    handleLimitError(error);
  }
}

function clearQuickIntake() {
  elements.quickMessage.value = "";
  elements.quickNote.value = "";
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
  showToast(`สร้างลูกค้าแล้ว รหัสคือ ${created.code}`, "success");
}

function getQuickEntryIssues(entry) {
  const issues = [];
  if (!entry.customerId) issues.push("ไม่มีลูกค้า");
  if (!entry.roundId) issues.push("ไม่มีงวด");
  if (entry.roundId && !isRoundAcceptingNow(getRound(entry.roundId))) issues.push("งวดปิดรับแล้ว");
  if (!entry.betTypeId) issues.push("ไม่มีประเภท");
  const betType = getBetType(entry.betTypeId);
  if (!betType || !isValidNumber(entry.number, betType.digits)) issues.push("เลขไม่ตรงประเภท");
  if (!Number.isFinite(entry.amount) || entry.amount <= 0) issues.push("ไม่พบยอด");
  return issues;
}

function getDuplicateQuickEntryKeys(entries) {
  const counts = new Map();
  entries.forEach((entry) => {
    const key = [entry.customerId, entry.roundId, entry.betTypeId, entry.number].join(":");
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key));
}

function mergeDuplicateQuickEntries(entries) {
  const merged = new Map();
  entries.forEach((entry) => {
    const key = [entry.customerId, entry.roundId, entry.betTypeId, entry.number].join(":");
    const current = merged.get(key);
    if (current) {
      current.amount += entry.amount;
    } else {
      merged.set(key, { ...entry });
    }
  });
  return [...merged.values()];
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
  const search = elements.searchInput.value.trim().toLowerCase();
  const customer = elements.filterCustomer.value || "all";
  const round = elements.filterRound.value || "all";
  const betType = elements.filterBetType.value || "all";
  const visible = state.entries.filter((entry) => {
    const ticket = getTicket(entry.ticket_id);
    const searchable = [
      entry.number,
      entry.note,
      getCustomerCode(entry.customer_id),
      getCustomerName(entry.customer_id),
      ticket?.code,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return (
      (!search || searchable.includes(search)) &&
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
                  <th>โพย</th>
                  <th>ลูกค้า</th>
                  <th>ประเภท</th>
                  <th>เลข</th>
                  <th>ยอดเงิน</th>
                  <th>สถานะตรวจ</th>
                  <th>บันทึก</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${entries
                  .map(
                    (entry) => {
                      const ticket = getTicket(entry.ticket_id);
                      const locked = ticket && ticket.status !== "pending_review";
                      return `
                      <tr>
                        <td>${escapeHtml(getTicket(entry.ticket_id)?.code || "-")}</td>
                        <td>${escapeHtml(getCustomerCode(entry.customer_id))}</td>
                        <td>${escapeHtml(getBetTypeName(entry.bet_type_id))}</td>
                        <td><span class="number-pill">${escapeHtml(entry.number)}</span></td>
                        <td class="amount">${money(entry.amount)}</td>
                        <td><span class="status-pill ${ticketStatusClass(getTicket(entry.ticket_id)?.status)}">${escapeHtml(ticketStatusLabel(getTicket(entry.ticket_id)?.status))}</span></td>
                        <td>${escapeHtml(entry.note || "-")}</td>
                        <td>
                          <div class="row-actions">
                            <button class="icon-button edit-entry-button" type="button" data-entry-id="${escapeHtml(entry.id)}" ${locked ? "disabled" : ""}>แก้ไข</button>
                            <button class="icon-button delete-entry-button" type="button" data-entry-id="${escapeHtml(entry.id)}" ${locked ? "disabled" : ""}>ลบ</button>
                          </div>
                        </td>
                      </tr>
                    `;
                    },
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
  if (!(await confirmDialog({ title: "ลบรายการ", body: "รายการนี้จะถูกลบถาวร ต้องการดำเนินการต่อหรือไม่?", danger: true }))) return;
  try {
    await api(`/api/entries/${id}`, { method: "DELETE" });
    await refreshState();
  } catch (error) {
    handleLimitError(error);
  }
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
    showToast(wasEditing ? "บันทึกข้อมูลลูกค้าแล้ว" : `สร้างลูกค้าแล้ว รหัสคือ ${customer.code}`, "success");
  } catch (error) {
    if (error?.payload?.error === "customer_head_house_locked") {
      showToast("เปลี่ยนหัวบ้านไม่ได้ เพราะลูกค้านี้มีรายการย้อนหลังแล้ว", "warning");
      return;
    }
    showToast("บันทึกลูกค้าไม่สำเร็จ", "danger");
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
  showToast(wasEditing ? "บันทึกข้อมูลหัวบ้านแล้ว" : `สร้างหัวบ้านแล้ว รหัสคือ ${saved.code}`, "success");
}

function renderHeadHouses() {
  const q = state.headHouseFilter.trim().toLowerCase();
  const filtered = state.headHouses.filter((h) => {
    if (!q) return true;
    return `${h.code || ""} ${h.name || ""} ${h.note || ""}`.toLowerCase().includes(q);
  });
  if (elements.headHouseListCount) {
    elements.headHouseListCount.textContent = q
      ? `แสดง ${filtered.length.toLocaleString("th-TH")} จาก ${state.headHouses.length.toLocaleString("th-TH")} รายการ`
      : `${state.headHouses.length.toLocaleString("th-TH")} หัวบ้าน`;
  }
  if (elements.headHouseEmpty) {
    elements.headHouseEmpty.classList.toggle("hidden", filtered.length > 0);
  }
  elements.headHouseList.innerHTML = filtered
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
    showToast("คัดลอกข้อมูลบัญชีดูยอดแล้ว", "success");
  } catch {
    showToast("คัดลอกไม่สำเร็จ ใช้ข้อมูลที่แสดงในกล่องนี้ได้เลย", "warning");
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
  if (!(await confirmDialog({ title: "รีเซ็ตรหัสผ่าน", body: "ระบบจะสุ่มรหัสผ่านใหม่ให้บัญชีดูยอดของหัวบ้านนี้ และล็อกเอาท์ทุก session ปัจจุบัน", danger: true }))) return;
  const credentials = await api(`/api/head-houses/${id}/viewer-account/reset-password`, { method: "POST" });
  showViewerCredentials(credentials);
}

async function deleteHeadHouse(id) {
  if (!(await confirmDialog({ title: "ลบหัวบ้าน", body: "หัวบ้านนี้และบัญชี viewer ที่เกี่ยวข้องจะถูกลบถาวร ดำเนินการต่อหรือไม่?", danger: true }))) return;
  try {
    await api(`/api/head-houses/${id}`, { method: "DELETE" });
    await refreshState();
  } catch (error) {
    if (error?.payload?.error === "head_house_has_customers") {
      showToast("ลบไม่ได้ เพราะยังมีลูกค้าอยู่ใต้หัวบ้านนี้", "warning");
      return;
    }
    showToast("ลบหัวบ้านไม่สำเร็จ", "danger");
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
  if (!(await confirmDialog({ title: "ลบลูกค้า", body: "ลูกค้านี้จะถูกลบถาวร (จะทำได้ก็ต่อเมื่อยังไม่มีรายการแทง)", danger: true }))) return;
  try {
    await api(`/api/customers/${id}`, { method: "DELETE" });
    await refreshState();
  } catch (error) {
    if (error?.payload?.error === "customer_has_entries") {
      showToast("ลบไม่ได้ เพราะลูกค้านี้มีรายการอยู่แล้ว", "warning");
      return;
    }
    showToast("ลบลูกค้าไม่สำเร็จ", "danger");
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
      resultTime: elements.scheduleResultTime.value,
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
      showToast("หวยนี้มีตารางเวลาอยู่แล้ว ให้กดแก้ไขตารางเดิม", "warning");
      return;
    }
    showToast("บันทึกตารางเวลาไม่สำเร็จ", "danger");
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
      <td>${escapeHtml(schedule.result_time || schedule.draw_time)}</td>
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
  elements.scheduleResultTime.value = schedule.result_time || schedule.draw_time;
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
  elements.scheduleResultTime.value = "18:00";
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
  showToast(`สร้างงวดอัตโนมัติเพิ่ม ${summary.created.toLocaleString("th-TH")} งวด ถึงวันที่ ${longDate(summary.toDate)}`, "success");
}

async function handleRoundSubmit(event) {
  event.preventDefault();
  const payload = {
    lotteryId: elements.roundLottery.value,
    openDate: elements.roundOpenDate.value,
    openTime: elements.roundOpenTime.value,
    drawDate: elements.roundDate.value,
      drawTime: elements.roundTime.value,
      resultTime: elements.roundResultTime.value,
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
      showToast("มีงวดชื่อนี้ในหวยเดียวกันอยู่แล้ว", "warning");
      return;
    }
    showToast("บันทึกงวดไม่สำเร็จ", "danger");
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
      <td>${escapeHtml(round.result_time || round.draw_time)}</td>
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
  elements.roundResultTime.value = round.result_time || round.draw_time;
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
  elements.roundResultTime.value = elements.roundTime.value || "00:00";
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
  if (!(await confirmDialog({ title: "ลบเลขอั้น", body: "เพดานของเลขนี้จะถูกลบ และระบบจะเริ่มรับใหม่โดยไม่มีลิมิต", danger: true }))) return;
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

async function renderResultEditor() {
  const roundId = elements.resultRound.value || state.rounds[0]?.id;
  if (!roundId) {
    elements.resultStatusBar.innerHTML = "";
    elements.resultEditor.innerHTML = '<div class="empty-state">ยังไม่มีงวด</div>';
    return;
  }

  const round = getRound(roundId);
  const isFinalized = round?.result_status === "finalized";
  elements.resultStatusBar.innerHTML = `
    <div class="result-status-copy">
      <strong>${isFinalized ? "ผลยืนยันแล้ว" : "ผลยังเป็นร่าง"}</strong>
      <span>${isFinalized ? `ยืนยันเมื่อ ${escapeHtml(formatDateTime(round.result_finalized_at))}` : "บันทึกผลครบแล้วจึงกดยืนยันเพื่อใช้เป็นยอดจริง"}</span>
    </div>
    <div class="review-actions">
      ${
        isFinalized
          ? '<button id="reopenResultBtn" class="button button-secondary" type="button">เปิดแก้ผลอีกครั้ง</button>'
          : '<button id="finalizeResultBtn" class="button button-primary" type="button">ยืนยันผลรางวัล</button>'
      }
    </div>
  `;

  const sourceForLottery = getSourceForLottery(round?.lottery_id);
  elements.resultEditor.innerHTML = state.betTypes
    .map((betType) => {
      const numbers = state.results
        .filter((result) => result.round_id === roundId && result.bet_type_id === betType.id)
        .map((result) => result.number)
        .join(" ");
      return `
        <label class="result-row">
          <span>${escapeHtml(betType.name)}</span>
          <input data-bet-type-id="${betType.id}" value="${escapeHtml(numbers)}" placeholder="คั่นหลายเลขด้วยช่องว่าง" ${isFinalized ? "disabled" : ""} />
          <button class="button button-secondary save-result-button" type="button" ${isFinalized ? "disabled" : ""}>บันทึก</button>
        </label>
      `;
    })
    .join("");

  // Insert "ดึงจากเว็บ" button at the top of the editor if source exists
  if (sourceForLottery && !isFinalized) {
    const fetchBtnHtml = `
      <div class="scrape-toolbar">
        <button id="scrapeResultBtn" class="button button-secondary" type="button" data-source-id="${escapeHtml(sourceForLottery.id)}">
          🌐 ดึงจากเว็บ (${escapeHtml(sourceForLottery.name)})
        </button>
        <small class="scrape-hint">ดึงเลขจาก ${escapeHtml(sourceForLottery.url)} อัตโนมัติ — คุณจะได้เลือกเลขก่อนบันทึก</small>
      </div>
    `;
    elements.resultEditor.insertAdjacentHTML("afterbegin", fetchBtnHtml);
    elements.resultEditor.querySelector("#scrapeResultBtn")?.addEventListener("click", (e) => scrapeResultFromSource(e.currentTarget.dataset.sourceId));
  }

  elements.resultEditor.querySelectorAll(".save-result-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const row = button.closest(".result-row");
      const input = row.querySelector("input");
      try {
        await api("/api/results", {
          method: "POST",
          body: {
            roundId,
            betTypeId: input.dataset.betTypeId,
            numbers: input.value,
          },
        });
        await refreshState();
      } catch (error) {
        handleLimitError(error);
      }
    });
  });

  document.querySelector("#finalizeResultBtn")?.addEventListener("click", async () => {
    try {
      await api(`/api/results/${encodeURIComponent(roundId)}/finalize`, { method: "POST" });
      await refreshState();
    } catch (error) {
      if (error?.payload?.error === "result_incomplete") {
        showToast("ยังยืนยันผลไม่ได้ เพราะยังกรอกผลไม่ครบทุกประเภทเลขที่มีการขายในงวดนี้", "warning");
        return;
      }
      showToast("ยังยืนยันผลไม่ได้ ตรวจว่ามีผลรางวัลครบแล้ว", "warning");
    }
  });
  document.querySelector("#reopenResultBtn")?.addEventListener("click", async () => {
    if (!(await confirmDialog({ title: "เปิดผลกลับมาแก้", body: "ผลรางวัลที่ยืนยันแล้วจะเปลี่ยนสถานะกลับเป็น draft เพื่อแก้ไข", danger: false }))) return;
    try {
      await api(`/api/results/${encodeURIComponent(roundId)}/reopen`, { method: "POST" });
      await refreshState();
    } catch {
      showToast("เปิดผลกลับมาแก้ไม่ได้", "danger");
    }
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
          <td>${escapeHtml(resultNumbers(round.id, "three_tod") || "-")}</td>
          <td>${escapeHtml(resultNumbers(round.id, "two_top") || "-")}</td>
          <td>${escapeHtml(resultNumbers(round.id, "two_bottom") || "-")}</td>
          <td><span class="status-pill ${resultStatusClass(round)}">${resultStatusLabel(round)}</span></td>
        </tr>
      `;
    })
    .join("");

  elements.resultsOverviewBody.innerHTML = rows || '<tr><td colspan="8">ยังไม่มีงวด</td></tr>';
}

function renderResultLinks() {
  if (!elements.resultSourcesList) return;
  const grouped = state.resultSources.reduce((groups, source) => {
    const key = source.source_kind === "official_glo" ? "ทางการ" : source.source_kind === "api_reserved" ? "API" : "ตรวจมือ";
    groups[key] = groups[key] || [];
    groups[key].push(source);
    return groups;
  }, {});

  elements.resultSourcesList.innerHTML =
    Object.entries(grouped)
      .map(([group, sources]) => {
        const cards = sources
          .map((source) => {
            const lotteryName = source.lottery_name || "หลายหวย";
            const statusText = source.source_kind === "official_glo" ? "พร้อมใช้" : source.source_kind === "api_reserved" ? "รอคีย์" : "ลิงก์";
            const sourceClass = source.source_kind === "official_glo" ? "source-auto" : source.source_kind === "api_reserved" ? "source-reserved" : "source-link";
            const nextRound = source.lottery_id ? getLatestResultTargetRound(source.lottery_id) : null;
            return `
              <article class="result-source-card ${sourceClass}">
                <div class="result-source-main">
                  <span class="lottery-card-flag ${getLotteryFlagClass(source.lottery_id || "")}" aria-hidden="true"></span>
                  <div>
                    <strong>${escapeHtml(source.name)}</strong>
                    <span>${escapeHtml(lotteryName)} · ${escapeHtml(source.provider || "-")}</span>
                  </div>
                </div>
                <div class="result-source-meta">
                  <span class="status-pill ${source.active ? "normal" : "muted"}">${source.active ? statusText : "ปิดใช้งาน"}</span>
                  ${source.requires_key ? `<span class="source-key">ENV: ${escapeHtml(source.key_env)}</span>` : ""}
                  ${
                    source.url
                      ? `<a class="button button-secondary" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">เปิดเว็บผล</a>`
                      : ""
                  }
                  ${
                    source.source_kind === "official_glo" && nextRound
                      ? `<button class="button button-primary fetch-result-button" type="button" data-source-id="${escapeHtml(source.id)}" data-round-id="${escapeHtml(nextRound.id)}">ดึงผลล่าสุด</button>`
                      : ""
                  }
                </div>
              </article>
            `;
          })
          .join("");
        return `
          <section class="result-source-group">
            <h3>${escapeHtml(group)}</h3>
            <div class="result-source-grid">${cards}</div>
          </section>
        `;
      })
      .join("") || '<div class="empty-state">ยังไม่มีแหล่งผล</div>';

  elements.resultSourcesList.querySelectorAll(".fetch-result-button").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const imported = await api("/api/result-imports/fetch", {
          method: "POST",
          body: {
            roundId: button.dataset.roundId,
            sourceId: button.dataset.sourceId,
          },
        });
        if (imported.status === "failed") {
          showToast(`ดึงผลไม่สำเร็จ: ${imported.error || "ต้องตรวจมือ"}`, "warning");
        } else {
          showToast("ดึงผลเข้าระบบแล้ว ตรวจในหน้าตรวจรางวัลได้ทันที", "success");
        }
        await refreshState();
      } catch (error) {
        showToast(error?.payload?.message || "ดึงผลจากแหล่งนี้ไม่ได้", "warning");
      }
    });
  });

  if (elements.resultImportsBody) {
    elements.resultImportsBody.innerHTML =
      state.resultImports
        .map((item) => {
          const numbers = formatImportedNumbers(item.numbers_json);
          return `
            <tr>
              <td>${escapeHtml(formatDateTime(item.fetched_at))}</td>
              <td>${escapeHtml(item.lottery_name || "-")} · ${escapeHtml(item.round_label || "-")}</td>
              <td>${escapeHtml(item.source_name || "-")}</td>
              <td><span class="status-pill ${resultImportStatusClass(item.status)}">${escapeHtml(resultImportStatusLabel(item.status))}</span></td>
              <td>${escapeHtml(numbers || "-")}</td>
              <td>${escapeHtml(item.error || "")}</td>
            </tr>
          `;
        })
        .join("") || '<tr><td colspan="6">ยังไม่มีประวัติการดึงผล</td></tr>';
  }
}

function getLatestResultTargetRound(lotteryId) {
  return state.rounds
    .filter((round) => round.lottery_id === lotteryId && round.result_status !== "finalized")
    .sort((a, b) => new Date(`${b.draw_date}T${b.result_time || b.draw_time}:00`) - new Date(`${a.draw_date}T${a.result_time || a.draw_time}:00`))[0];
}

function formatImportedNumbers(value) {
  let payload = {};
  try {
    payload = JSON.parse(value || "{}");
  } catch {
    return "";
  }
  return Object.entries(payload)
    .map(([betTypeId, numbers]) => `${getBetTypeName(betTypeId)}: ${(numbers || []).join(", ")}`)
    .join(" · ");
}

function resultImportStatusLabel(status) {
  return {
    draft: "ผลร่าง",
    confirmed: "ยืนยันจาก API",
    applied: "ลงผลแล้ว",
    failed: "ดึงไม่สำเร็จ",
    skipped: "ข้าม",
  }[status] || status;
}

function resultImportStatusClass(status) {
  if (status === "applied" || status === "confirmed") return "normal";
  if (status === "failed") return "danger";
  return "warning";
}

function renderReview() {
  const pendingTickets = state.tickets.filter((ticket) => ticket.status === "pending_review");
  elements.pendingTicketsEmpty.classList.toggle("hidden", pendingTickets.length > 0);
  elements.pendingTicketsBody.innerHTML = pendingTickets
    .map((ticket) => {
      const ticketEntries = state.entries.filter((entry) => entry.ticket_id === ticket.id);
      return `
        <tr>
          <td>${escapeHtml(ticket.code)}</td>
          <td>
            ${escapeHtml(formatTicketCustomer(ticket))}
            <small>${escapeHtml(ticket.head_house_code || "-")} · ${escapeHtml(ticket.head_house_name || "-")}</small>
          </td>
          <td>${escapeHtml(ticket.lottery_name)} · ${escapeHtml(ticket.round_label)}</td>
          <td>${ticket.entry_count.toLocaleString("th-TH")}</td>
          <td class="amount">${money(ticket.total_amount)}</td>
          <td>${escapeHtml(ticket.created_by_username || "-")}</td>
          <td>${escapeHtml(formatDateTime(ticket.created_at))}</td>
          <td>
            <div class="review-actions">
              <button class="button button-secondary toggle-ticket-details-button" type="button" data-ticket-id="${escapeHtml(ticket.id)}">ดูโพย</button>
              <button class="button button-primary approve-ticket-button" type="button" data-ticket-id="${escapeHtml(ticket.id)}">อนุมัติ</button>
              <button class="button button-secondary reject-ticket-button" type="button" data-ticket-id="${escapeHtml(ticket.id)}">ตีกลับ</button>
              <button class="button button-danger cancel-ticket-button" type="button" data-ticket-id="${escapeHtml(ticket.id)}">ยกเลิก</button>
            </div>
          </td>
        </tr>
        <tr id="ticket-detail-${escapeHtml(ticket.id)}" class="ticket-detail-row hidden">
          <td colspan="8">
            <div class="ticket-detail-card">
              <div>
                <strong>รายการในโพย</strong>
                <span>${escapeHtml(ticketEntries.map((entry) => `${entry.number} ${getBetTypeName(entry.bet_type_id)} ${money(entry.amount)}`).join(" · "))}</span>
              </div>
              <div>
                <strong>ต้นทาง</strong>
                <span>${escapeHtml(ticket.source_channel || "manual")}${ticket.source_text ? ` · ${escapeHtml(ticket.source_text)}` : ""}</span>
              </div>
              <div>
                <strong>หมายเหตุ</strong>
                <span>${escapeHtml(ticket.note || "-")}</span>
              </div>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  elements.pendingTicketsBody.querySelectorAll(".toggle-ticket-details-button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelector(`#ticket-detail-${CSS.escape(button.dataset.ticketId)}`)?.classList.toggle("hidden");
    });
  });
  elements.pendingTicketsBody.querySelectorAll(".approve-ticket-button").forEach((button) => {
    button.addEventListener("click", () => reviewTicket(button.dataset.ticketId, "approve"));
  });
  elements.pendingTicketsBody.querySelectorAll(".reject-ticket-button").forEach((button) => {
    button.addEventListener("click", () => reviewTicket(button.dataset.ticketId, "reject"));
  });
  elements.pendingTicketsBody.querySelectorAll(".cancel-ticket-button").forEach((button) => {
    button.addEventListener("click", () => reviewTicket(button.dataset.ticketId, "cancel"));
  });

  const pendingResults = getRoundsPendingResultReview();
  elements.pendingResultsList.innerHTML = pendingResults.length
    ? pendingResults
        .map(
          (round) => `
            <article class="compact-row">
              <div>
                <strong>${escapeHtml(getLotteryName(round.lottery_id))} · ${escapeHtml(round.label)}</strong>
                <span>${escapeHtml(resultNumbers(round.id, "three_top") || "-")} / ${escapeHtml(resultNumbers(round.id, "three_tod") || "-")} / ${escapeHtml(resultNumbers(round.id, "two_top") || "-")} / ${escapeHtml(resultNumbers(round.id, "two_bottom") || "-")}</span>
              </div>
              <button class="text-button review-result-button" type="button" data-round-id="${escapeHtml(round.id)}">ไปตรวจผล</button>
            </article>
          `,
        )
        .join("")
    : '<div class="empty-state">ไม่มีผลที่รอยืนยัน</div>';

  elements.pendingResultsList.querySelectorAll(".review-result-button").forEach((button) => {
    button.addEventListener("click", () => {
      elements.resultRound.value = button.dataset.roundId;
      activateView("results");
      renderResultEditor();
    });
  });

  elements.auditLogList.innerHTML = state.auditLogs.length
    ? state.auditLogs
        .slice(0, 8)
        .map(
          (log) => `
            <article class="compact-row">
              <strong>${escapeHtml(formatAuditAction(log))}</strong>
              <span>${escapeHtml(log.username || "system")} · ${escapeHtml(formatDateTime(log.created_at))}</span>
            </article>
          `,
        )
        .join("")
    : '<div class="empty-state">ยังไม่มีบันทึกกิจกรรม</div>';
}

async function reviewTicket(ticketId, action) {
  if (!ticketId) return;
  const body = {};
  if (action === "reject") {
    const _ans = await confirmDialog({ title: "ตี้กลับโพย", body: "ระบุเหตุผลเพื่อบันทึกไว้ใน audit log:", danger: true, withReason: true });
      const reason = _ans?.confirmed ? _ans.reason : null;
    if (reason === null) return;
    body.reason = reason.trim();
  }
  if (action === "cancel" && !(await confirmDialog({ title: "ยกเลิกโพย", body: "สถานะของโพยนี้จะกลายเป็น cancelled และไม่นับยอด", danger: true }))) return;
  try {
    await api(`/api/tickets/${encodeURIComponent(ticketId)}/${action}`, { method: "POST", body });
    await refreshState();
  } catch {
    showToast("ดำเนินการกับโพยไม่สำเร็จ", "danger");
  }
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
  getApprovedEntries().forEach((entry) => {
    const round = getRound(entry.round_id);
    rows.push({
      createdAt: entry.created_at,
      detail: `รับยอด ${getLotteryName(round?.lottery_id)} · ${round?.label || "-"} · ${getCustomerCode(entry.customer_id)}`,
      debit: 0,
      credit: entry.amount,
    });

    const payout = getEntryPayout(entry);
    if (payout > 0) {
      rows.push({
        createdAt: round?.result_finalized_at || entry.updated_at || entry.created_at,
        detail: `จ่ายรางวัล ${getLotteryName(round?.lottery_id)} · ${entry.number} · ${getCustomerCode(entry.customer_id)}`,
        debit: payout,
        credit: 0,
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
  if (!round || round.result_status !== "finalized") return 0;
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
    showToast(wasEditing ? "บันทึกข้อมูลผู้ใช้แล้ว" : "เพิ่มผู้ใช้แล้ว", "success");
  } catch (error) {
    if (error?.payload?.error === "username_exists") {
      showToast("ชื่อผู้ใช้นี้ถูกใช้แล้ว", "warning");
      return;
    }
    if (error?.payload?.error === "last_admin_required") {
      showToast("ต้องเหลือผู้ดูแลระบบอย่างน้อย 1 คน", "warning");
      return;
    }
    if (error?.payload?.error === "self_role_change_blocked") {
      showToast("เปลี่ยนสิทธิ์ของบัญชีที่กำลังใช้งานอยู่ไม่ได้", "warning");
      return;
    }
    if (error?.payload?.error === "viewer_account_exists") {
      showToast("หัวบ้านนี้มีบัญชีดูยอดอยู่แล้ว", "warning");
      return;
    }
    showToast("บันทึกผู้ใช้ไม่สำเร็จ", "danger");
  }
}

function renderUsers() {
  if (state.user?.role !== "admin") {
    elements.usersBody.innerHTML = "";
    if (elements.userListCount) elements.userListCount.textContent = "";
    return;
  }
  const q = state.userFilter.trim().toLowerCase();
  const filtered = state.users.filter((u) => {
    if (!q) return true;
    return `${u.username || ""} ${u.role || ""} ${u.head_house_code || ""} ${u.head_house_name || ""}`.toLowerCase().includes(q);
  });
  if (elements.userListCount) {
    elements.userListCount.textContent = q
      ? `แสดง ${filtered.length.toLocaleString("th-TH")} จาก ${state.users.length.toLocaleString("th-TH")} รายการ`
      : `${state.users.length.toLocaleString("th-TH")} ผู้ใช้`;
  }
    elements.usersBody.innerHTML = filtered
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
  elements.reviewNavButtons.forEach((button) => button.classList.toggle("hidden", !canManageUsers));
  elements.reviewView.hidden = !canManageUsers;
  elements.usersNavButtons.forEach((button) => button.classList.toggle("hidden", !canManageUsers));
  elements.usersView.hidden = !canManageUsers;
  elements.sidebarProfileBtn.classList.toggle("hidden", !canManageUsers);
  elements.headHousesNavButtons.forEach((button) => button.classList.toggle("hidden", !canManageUsers));
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
  if (!(await confirmDialog({ title: "ลบผู้ใช้", body: "บัญชีนี้จะถูกลบถาวรและ session ทั้งหมดจะถูกยกเลิก", danger: true }))) return;
  try {
    await api(`/api/users/${id}`, { method: "DELETE" });
    await refreshState();
  } catch (error) {
    if (error?.payload?.error === "last_admin_required") {
      showToast("ลบไม่ได้ เพราะต้องเหลือผู้ดูแลระบบอย่างน้อย 1 คน", "warning");
      return;
    }
    if (error?.payload?.error === "self_delete_blocked") {
      showToast("ลบบัญชีที่กำลังใช้งานอยู่ไม่ได้", "warning");
      return;
    }
    showToast("ลบผู้ใช้ไม่สำเร็จ", "danger");
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
            entry.number === limit.number &&
            (!entry.ticket_id || ["pending_review", "approved"].includes(getTicket(entry.ticket_id)?.status)),
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

function getApprovedEntries() {
  return state.entries.filter((entry) => getTicket(entry.ticket_id)?.status === "approved");
}

function getRoundsPendingResultReview() {
  return state.rounds.filter(
    (round) =>
      round.result_status !== "finalized" &&
      state.results.some((result) => result.round_id === round.id),
  );
}

function getTicket(id) {
  return state.tickets.find((ticket) => ticket.id === id);
}

function getCustomerName(id) {
  return state.customers.find((customer) => customer.id === id)?.name || "";
}

function ticketStatusLabel(status) {
  if (status === "approved") return "อนุมัติแล้ว";
  if (status === "rejected") return "ตีกลับ";
  if (status === "cancelled") return "ยกเลิก";
  return "รอตรวจ";
}

function ticketStatusClass(status) {
  if (status === "approved") return "normal";
  if (status === "rejected" || status === "cancelled") return "full";
  return "warning";
}

function resultStatusLabel(round) {
  return round?.result_status === "finalized" ? "ยืนยันแล้ว" : "รอปิดงาน";
}

function resultStatusClass(round) {
  return round?.result_status === "finalized" ? "normal" : "warning";
}

function formatAuditAction(log) {
  const labels = {
    create: "สร้าง",
    create_batch: "สร้างชุด",
    update: "แก้ไข",
    delete: "ลบ",
    approve: "อนุมัติ",
    reject: "ตีกลับ",
    cancel: "ยกเลิก",
    upsert: "บันทึก",
    finalize: "ยืนยัน",
    reopen: "เปิดแก้",
    login: "เข้าสู่ระบบ",
    logout: "ออกจากระบบ",
  };
  return `${labels[log.action] || log.action} ${log.entity_type}`;
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
  let stripped = text
    .replace(/\b\d{1,2}[:.]\d{1,2}\b/g, " ")
    .replace(/\b\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}\b/g, " ")
    .replace(/\d+(?:\.\d+)?\s*%/g, " ")
    .replace(/(\d+(?:,\d{3})*)\s*(?:บาท|บ(?![ก-๛]))/gi, " ");
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
    showToast("เลขนี้เกินเพดานอั้นแล้ว ต้องเพิ่มเพดานก่อนจึงจะรับต่อได้", "warning");
    return;
  }
  if (error?.payload?.error === "round_not_accepting") {
    showToast("งวดนี้ปิดรับแล้ว เลือกงวดที่ยังเปิดรับหรือแก้เวลาในหน้างวดก่อน", "warning");
    return;
  }
  if (error?.payload?.error === "ticket_locked") {
    showToast("โพยนี้ผ่านการตรวจแล้ว จึงแก้หรือยกเลิกรายการเดี่ยวไม่ได้", "warning");
    return;
  }
  if (error?.payload?.error === "result_finalized") {
    showToast("ผลรางวัลงวดนี้ยืนยันแล้ว หากต้องแก้ต้องเปิดผลกลับมาก่อน", "warning");
    return;
  }
  showToast("บันทึกไม่สำเร็จ", "danger");
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

function getSourceForLottery(lotteryId) {
  // Prefer active manual_link or auto_confirm source for this lottery
  const sources = state.resultSources || [];
  return sources.find((s) => s.lottery_id === lotteryId && s.active && s.url);
}

function getScheduleForLottery(lotteryId) {
  return state.scheduleTemplates.find((s) => s.lottery_id === lotteryId);
}

function getNextExpectedDrawFromSchedule(lotteryId) {
  const schedule = getScheduleForLottery(lotteryId);
  if (!schedule || !schedule.active) return null;
  const today = new Date();
  // search forward up to 90 days to find next matching date
  for (let i = 0; i < 90; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dayOfWeek = d.getDay();
    const dayOfMonth = d.getDate();
    let runs = false;
    if (schedule.frequency === "monthly") {
      const monthDays = (schedule.month_days || []).map((n) => Number(n));
      runs = monthDays.includes(dayOfMonth);
    } else {
      const weekdays = (schedule.weekdays || []).map((n) => Number(n));
      runs = weekdays.includes(dayOfWeek);
    }
    if (runs) {
      const drawTime = schedule.draw_time || "00:00";
      return { date: isoDate, time: drawTime, daysAhead: i };
    }
  }
  return null;
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
      .sort((a, b) => new Date(`${b.draw_date}T${b.draw_time}:00`) - new Date(`${a.draw_date}T${a.draw_time}:00`))[0] ||
    null
  );
}

function getAcceptingRounds(lotteryId = "") {
  return state.rounds
    .filter((round) => isRoundAcceptingNow(round) && (!lotteryId || round.lottery_id === lotteryId))
    .sort((a, b) => new Date(a.close_at) - new Date(b.close_at));
}

function isRoundAcceptingNow(round) {
  const stateNow = getRoundTimingStatus(round).state;
  return stateNow === "open" || stateNow === "closing_soon";
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

function formatTicketCustomer(ticket) {
  if (!ticket) return "-";
  if (ticket.customer_id === "walkin" && ticket.note) return ticket.note;
  return `${ticket.customer_code}${ticket.customer_name ? ` · ${ticket.customer_name}` : ""}`;
}

function formatEntryCustomer(entry) {
  if (!entry) return "-";
  if (entry.customer_id === "walkin" && entry.note) return entry.note;
  return getCustomerCode(entry.customer_id);
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
  const normalized = String(value || "").replaceAll(",", "").trim();
  if (!/^\d+$/.test(normalized)) return Number.NaN;
  return Number(normalized);
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
  if (now >= closeAt) return { state: "closed", label: "ปิดรับ", cardClass: "is-finished" };
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
  renderMarketAdmin();
  renderClosingSoonBanner();
  renderSidebarRates();
  announceClosingSoonRounds();
  announceResultDueRounds();
}

async function prepareRoundSwitch(nextRoundId) {
  const currentRoundId = state.ticketDraftEntries[0]?.roundId;
  if (!currentRoundId || currentRoundId === nextRoundId) return true;
  return confirmDraftDiscard();
}

async function confirmDraftDiscard() {
  if (!state.ticketDraftEntries.length) return true;
  const confirmed = await confirmDialog({ title: "ยังมีรายการในบิล", body: "มีเลขในบิลที่ยังไม่บันทึก หากออกตอนนี้ข้อมูลจะหายทั้งหมด", danger: true });
  if (confirmed) state.ticketDraftEntries = [];
  return confirmed;
}

function announceClosingSoonRounds() {
  const rounds = state.rounds.filter((round) => getRoundTimingStatus(round).state === "closing_soon");
  if (!state.notificationBootstrapped) {
    rounds.forEach((round) => state.announcedRoundIds.add(round.id));
    return;
  }
  rounds.forEach((round) => {
    if (state.announcedRoundIds.has(round.id)) return;
    state.announcedRoundIds.add(round.id);
    showToast(`${getLotteryName(round.lottery_id)} ${round.label} เหลือเวลาไม่ถึง 5 นาที จะปิดรับอัตโนมัติ`, "warning");
  });
}

function announceResultDueRounds() {
  const dueGraceMs = 2 * 60_000;
  const now = Date.now();
  const rounds = state.rounds.filter(
    (round) =>
      round.result_status !== "finalized" &&
      now >= new Date(round.result_at || round.draw_at).getTime() &&
      now - new Date(round.result_at || round.draw_at).getTime() <= dueGraceMs &&
      !state.results.some((result) => result.round_id === round.id),
  );
  if (!state.notificationBootstrapped) {
    state.rounds
      .filter(
        (round) =>
          round.result_status !== "finalized" &&
          now >= new Date(round.result_at || round.draw_at).getTime() &&
          !state.results.some((result) => result.round_id === round.id),
      )
      .forEach((round) => state.announcedResultRoundIds.add(round.id));
    state.notificationBootstrapped = true;
    return;
  }
  rounds.forEach((round) => {
    if (state.announcedResultRoundIds.has(round.id)) return;
    state.announcedResultRoundIds.add(round.id);
    showToast(`${getLotteryName(round.lottery_id)} ${round.label} ถึงเวลาตรวจผลแล้ว`, "warning");
  });
}

function showToast(message, tone = "") {
  if (!elements.toastStack) return;
  const maxToasts = 4;
  while (elements.toastStack.children.length >= maxToasts) {
    elements.toastStack.firstElementChild?.remove();
  }
  const toast = document.createElement("div");
  toast.className = `toast ${tone}`;
  toast.textContent = message;
  elements.toastStack.appendChild(toast);
  window.setTimeout(() => toast.remove(), 5000);
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

function createClientId() {
  return globalThis.crypto?.randomUUID?.() || `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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

/* ============================================================================
   Polish-to-10 — Modal, loading, copy/print, inline errors, dark mode, shortcuts
   ============================================================================ */

/**
 * Custom replacement for native confirm()/prompt().
 * @returns boolean (or {confirmed, reason} when withReason=true)
 */
async function confirmDialog({ title = "ยืนยัน", body = "", danger = false, withReason = false } = {}) {
  const dlg = elements.confirmDialog;
  if (!dlg || typeof dlg.showModal !== "function") {
    // Fallback to native (legacy browsers)
    if (withReason) {
      const r = prompt(body || title);
      return r != null ? { confirmed: true, reason: r } : { confirmed: false };
    }
    return confirm(body || title);
  }
  elements.confirmDialogTitle.textContent = title;
  elements.confirmDialogBody.textContent = body;
  if (elements.confirmDialogReason) {
    elements.confirmDialogReason.classList.toggle("hidden", !withReason);
    elements.confirmDialogReason.value = "";
  }
  elements.confirmDialogYes.classList.toggle("button-danger", danger);
  elements.confirmDialogYes.classList.toggle("button-primary", !danger);
  elements.confirmDialogYes.textContent = danger ? "ยืนยัน" : "ตกลง";
  return new Promise((resolve) => {
    const onClose = () => {
      const confirmed = dlg.returnValue === "confirm";
      const reason = elements.confirmDialogReason?.value || "";
      if (withReason) resolve({ confirmed, reason });
      else resolve(confirmed);
    };
    dlg.addEventListener("close", onClose, { once: true });
    dlg.showModal();
    if (withReason) {
      setTimeout(() => elements.confirmDialogReason?.focus(), 60);
    } else {
      setTimeout(() => elements.confirmDialogYes?.focus(), 60);
    }
  });
}

/**
 * Wrap an async action to show a loading state on the triggering button.
 */
async function withLoading(button, fn) {
  if (!button) return await fn();
  const wasDisabled = button.disabled;
  const original = button.textContent;
  button.disabled = true;
  button.dataset.loading = "true";
  try {
    return await fn();
  } finally {
    button.disabled = wasDisabled;
    delete button.dataset.loading;
    button.textContent = original;
  }
}

/** Inline form error helper (under each .field) */
function setFieldError(input, message) {
  const field = input?.closest?.(".field");
  if (!field) return;
  let errEl = field.querySelector(".field-error");
  if (!errEl) {
    errEl = document.createElement("span");
    errEl.className = "field-error";
    errEl.setAttribute("role", "alert");
    field.appendChild(errEl);
  }
  errEl.textContent = message || "";
  field.classList.toggle("invalid", Boolean(message));
  input.setAttribute("aria-invalid", message ? "true" : "false");
}

function clearFieldErrors(form) {
  if (!form) return;
  form.querySelectorAll(".field.invalid").forEach((f) => f.classList.remove("invalid"));
  form.querySelectorAll(".field-error").forEach((e) => (e.textContent = ""));
  form.querySelectorAll("[aria-invalid='true']").forEach((i) => i.setAttribute("aria-invalid", "false"));
}

/** Receipt actions */
async function copyReceipt() {
  if (!elements.ticketReceiptPreview) return;
  const text = elements.ticketReceiptPreview.innerText.trim();
  if (!text) {
    showToast("ยังไม่มีบิลให้คัดลอก เพิ่มรายการก่อน", "warning");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast("คัดลอกบิลแล้ว ส่งให้ลูกค้าได้เลย ✓", "success");
  } catch (e) {
    showToast("คัดลอกไม่สำเร็จ — กดเลือกข้อความเองได้", "warning");
  }
}
function printReceipt() {
  window.print();
}

/** Dark mode toggle with localStorage persistence */
function initThemeToggle() {
  let theme;
  try {
    theme = localStorage.getItem("lottery_theme");
  } catch { theme = null; }
  if (!theme) {
    theme = matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.dataset.theme = theme;
  if (elements.themeToggleBtn) {
    elements.themeToggleBtn.textContent = theme === "dark" ? "☀️" : "🌙";
    elements.themeToggleBtn.setAttribute("aria-label", theme === "dark" ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด");
    elements.themeToggleBtn.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("lottery_theme", next); } catch {}
      elements.themeToggleBtn.textContent = next === "dark" ? "☀️" : "🌙";
      elements.themeToggleBtn.setAttribute("aria-label", next === "dark" ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด");
    });
  }
}

/** Mobile hamburger toggle */
function initNavToggle() {
  if (!elements.navToggleBtn || !elements.primaryNav) return;
  elements.navToggleBtn.addEventListener("click", () => {
    const open = elements.primaryNav.classList.toggle("is-open");
    elements.navToggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  // Close drawer when a nav button is clicked
  elements.primaryNav.addEventListener("click", (e) => {
    if (e.target.classList.contains("nav-button") && elements.primaryNav.classList.contains("is-open")) {
      elements.primaryNav.classList.remove("is-open");
      elements.navToggleBtn.setAttribute("aria-expanded", "false");
    }
  });
}

/** Keyboard shortcuts — power-user productivity */
function initKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    const inField = e.target.matches?.("input, textarea, select, [contenteditable]");
    // Esc: close any open dialog or blur input
    if (e.key === "Escape") {
      const open = document.querySelector("dialog[open]");
      if (open) { open.close(); return; }
      if (inField) { e.target.blur(); return; }
    }
    if (inField) return;
    // Ctrl/Cmd+S — save current intake bill
    if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
      e.preventDefault();
      const saveBtn = elements.saveTicketBtn;
      if (saveBtn && !saveBtn.disabled && saveBtn.offsetParent) saveBtn.click();
      return;
    }
    // "/" focus search
    if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      elements.searchInput?.focus();
      return;
    }
    // Alt+1..9 — switch views
    if (e.altKey && /^[1-9]$/.test(e.key)) {
      e.preventDefault();
      const order = ["markets", "dashboard", "review", "entries", "results", "resultLinks", "reports", "manage"];
      const target = order[Number(e.key) - 1];
      if (target) activateView(target);
    }
  });
}

/** Scrape result from configured source URL */
async function scrapeResultFromSource(sourceId) {
  const btn = elements.resultEditor.querySelector("#scrapeResultBtn");
  if (btn) {
    btn.disabled = true;
    btn.dataset.loading = "true";
  }
  try {
    const data = await api("/api/result-imports/scrape", {
      method: "POST",
      body: { sourceId },
    });
    showCandidatePicker(data, sourceId);
  } catch (error) {
    showToast(`ดึงผลไม่สำเร็จ — ${error?.message || "เว็บไม่ตอบกลับ หรือใช้ JS โหลด"}`, "warning");
  } finally {
    if (btn) {
      btn.disabled = false;
      delete btn.dataset.loading;
    }
  }
}

/** Modal showing candidate numbers from scrape result; admin picks per bet type */
function showCandidatePicker(data, sourceId) {
  const overlay = document.createElement("div");
  overlay.className = "candidate-overlay";
  overlay.innerHTML = `
    <div class="candidate-modal" role="dialog" aria-label="เลือกผลจากเว็บ">
      <div class="candidate-header">
        <div>
          <strong>เลือกผลจากเว็บ</strong>
          <small>${escapeHtml(data.sourceName || "")} · <a href="${escapeHtml(data.url || "")}" target="_blank" rel="noopener">เปิดต้นทาง ↗</a></small>
        </div>
        <button class="candidate-close" type="button" aria-label="ปิด">✕</button>
      </div>
      ${
        data.isJavaScriptApp
          ? `<div class="candidate-warning">
              ⚠️ เว็บนี้ใช้ JavaScript โหลดผล (server scrape ไม่เจอตัวเลข) — เปิดต้นทางด้วยตัวเองแล้ว copy เลขมาวางในช่องด้านล่าง
            </div>`
          : ""
      }
      <div class="candidate-section">
        <h4>3 ตัวบน / โต๊ด</h4>
        <p class="candidate-hint">ถ้ามีรางวัลที่ 1 (6 หลัก) ระบบจะแนะนำเป็น 3 หลักท้ายให้</p>
        ${
          data.suggested?.three_top
            ? `<div class="candidate-suggested">แนะนำ: <button class="candidate-chip candidate-chip-primary" data-fill="three_top" data-value="${data.suggested.three_top}">${data.suggested.three_top}</button></div>`
            : ""
        }
        <div class="candidate-chips">
          ${(data.found3Digit || []).slice(0, 20).map((n) => `<button class="candidate-chip" data-fill="three_top" data-value="${n}">${n}</button>`).join("")}
        </div>
      </div>
      <div class="candidate-section">
        <h4>2 ตัวบน</h4>
        ${
          data.suggested?.two_top
            ? `<div class="candidate-suggested">แนะนำ: <button class="candidate-chip candidate-chip-primary" data-fill="two_top" data-value="${data.suggested.two_top}">${data.suggested.two_top}</button></div>`
            : ""
        }
        <div class="candidate-chips">
          ${(data.found2Digit || []).slice(0, 20).map((n) => `<button class="candidate-chip" data-fill="two_top" data-value="${n}">${n}</button>`).join("")}
        </div>
      </div>
      <div class="candidate-section">
        <h4>2 ตัวล่าง</h4>
        ${
          data.suggested?.two_bottom
            ? `<div class="candidate-suggested">แนะนำ: <button class="candidate-chip candidate-chip-primary" data-fill="two_bottom" data-value="${data.suggested.two_bottom}">${data.suggested.two_bottom}</button></div>`
            : ""
        }
        <div class="candidate-chips">
          ${(data.found2Digit || []).slice(0, 20).map((n) => `<button class="candidate-chip" data-fill="two_bottom" data-value="${n}">${n}</button>`).join("")}
        </div>
      </div>
      ${
        data.found6Digit && data.found6Digit.length > 0
          ? `<div class="candidate-section">
              <h4>เลข 6 หลัก (รางวัลที่ 1 เต็ม)</h4>
              <div class="candidate-chips">
                ${data.found6Digit.slice(0, 10).map((n) => `<span class="candidate-chip candidate-chip-info">${n}</span>`).join("")}
              </div>
            </div>`
          : ""
      }
      <div class="candidate-actions">
        <button class="button button-primary candidate-done" type="button">เสร็จแล้ว — กดบันทึกในแต่ละแถวต่อ</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Wire up
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.querySelector(".candidate-close")?.addEventListener("click", () => overlay.remove());
  overlay.querySelector(".candidate-done")?.addEventListener("click", () => overlay.remove());

  overlay.querySelectorAll(".candidate-chip[data-value]").forEach((chip) => {
    chip.addEventListener("click", () => {
      const betTypeId = chip.dataset.fill;
      const value = chip.dataset.value;
      const input = elements.resultEditor.querySelector(`input[data-bet-type-id="${betTypeId}"]`);
      if (input) {
        // Append space + value (allow multiple)
        const existing = input.value.trim();
        if (!existing.split(/\s+/).includes(value)) {
          input.value = existing ? `${existing} ${value}` : value;
          input.classList.add("scrape-filled");
          setTimeout(() => input.classList.remove("scrape-filled"), 1000);
        }
        showToast(`ใส่ ${value} ใน ${getBetTypeName(betTypeId)} แล้ว — กด "บันทึก" ที่แถวนั้น`, "success");
      }
    });
  });
}

/** Init polish features on app load */
function initPolish() {
  initThemeToggle();
  applySearchableSelects();
  initNavToggle();
  initKeyboardShortcuts();
  if (elements.copyReceiptBtn) elements.copyReceiptBtn.addEventListener("click", copyReceipt);
  if (elements.printReceiptBtn) elements.printReceiptBtn.addEventListener("click", printReceipt);
}

// Hook into the existing initialize() — call initPolish on DOMContentLoaded as a safety net
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPolish);
} else {
  setTimeout(initPolish, 0);
}

/* ============================================================================
   Searchable select — wraps a <select> with a search input that filters options
   ============================================================================ */
function makeSelectSearchable(selectEl, placeholder = "🔍 ค้นหา...") {
  if (!selectEl || selectEl.dataset.searchable === "true") return;
  selectEl.dataset.searchable = "true";

  const wrap = document.createElement("div");
  wrap.className = "searchable-select";
  selectEl.parentNode.insertBefore(wrap, selectEl);
  wrap.appendChild(selectEl);

  const search = document.createElement("input");
  search.type = "search";
  search.className = "searchable-select-input";
  search.placeholder = placeholder;
  search.autocomplete = "off";
  wrap.insertBefore(search, selectEl);

  const filter = () => {
    const q = search.value.trim().toLowerCase();
    let visible = 0;
    Array.from(selectEl.options).forEach((opt) => {
      if (!opt.value && !q) {
        opt.hidden = false;
        return;
      }
      const match = !q || opt.textContent.toLowerCase().includes(q);
      opt.hidden = !match;
      if (match) visible += 1;
    });
    selectEl.dataset.visibleCount = String(visible);
  };
  search.addEventListener("input", filter);
  // Also re-filter when select gets new options dynamically (we observe it)
  const observer = new MutationObserver(filter);
  observer.observe(selectEl, { childList: true });
}

function applySearchableSelects() {
  // Big dropdowns that benefit from search
  const targets = [
    elements.ticketRound, // intake round selector (293+ rounds)
    elements.resultRound, // result editor round
    elements.reportRound, // settlement round
    elements.scheduleLottery, // schedule form lottery
    elements.filterRound, // entries filter
    elements.filterCustomer, // entries filter customer
    elements.filterBetType, // entries filter bet type (small, skip)
  ];
  targets.forEach((sel) => sel && makeSelectSearchable(sel, sel.id?.toLowerCase().includes("customer") ? "🔍 ชื่อ/รหัสลูกค้า" : "🔍 ค้นหา..."));
}

// Hook into existing initPolish + after renderSelects
