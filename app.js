/* === ONLINE-BILLS-LIST-FE-V1 === */
/* === OVERVIEW-CHANNEL-SPLIT-FE-V1 === */
/* === RATE-OVERRIDE-FE-V1 === */
/* === CLEANUP-PHASE23-V1 applied === */
/* === CLEANUP-PHASE1-V1 applied === */
const VIEW_META = {
  myAffiliate: { eyebrow: "Affiliate", title: "หน้ารวมของฉัน" },
  rulesAff: { eyebrow: "Affiliate", title: "กติกา · วิธีใช้" },
  bankAccounts: { eyebrow: "ตั้งค่า · บัญชีรับเงิน", title: "🏦 บัญชีรับเงิน" },
  lineSettings: { eyebrow: "ตั้งค่า · LINE OA", title: "💬 ตั้งค่า LINE OA" },

  dashboard: { eyebrow: "แดชบอร์ดเก่า (ใช้หน้ารวมแทน)", title: "แดชบอร์ดเก่า" },
  markets: { eyebrow: "เลือกงวดก่อนคีย์เลข", title: "แทงหวย" },
  intake: { eyebrow: "คีย์รายการของลูกค้า", title: "คีย์บิล" },
  overview: { eyebrow: "ภาพรวมทุกอย่างที่ต้องตัดสินใจ", title: "🏠 หน้ารวม" },
  review: { eyebrow: "ตรวจบิลก่อนคิดยอดจริง", title: "ตรวจบิล" },
  entries: { eyebrow: "รายการบิลทั้งหมด", title: "รายการบิล" },
  headHouses: { eyebrow: "เครือข่ายผู้ส่งยอด", title: "หัวบ้าน" },
  customers: { eyebrow: "ข้อมูลผู้ส่งรายการ", title: "ลูกค้า" },
  lotteries: { eyebrow: "ตั้งค่าหวยและงวด", title: "หวยและงวด" },
  limits: { eyebrow: "ควบคุมเพดานรับ", title: "อั้นเลข" },
  payouts: { eyebrow: "ตั้งค่าอัตราจ่าย", title: "อัตราจ่าย" },
  results: { eyebrow: "บันทึกผลที่ออก", title: "ผลรางวัล" },
  resultLinks: { eyebrow: "แหล่งดึงผลและลิงก์สำรอง", title: "ลิงก์ผล" },
  reports: { eyebrow: "กระแสเงินและผลประกอบการ", title: "บัญชีการเงิน" },
  headHouseReport: { eyebrow: "ยอดรวมแบบอ่านอย่างเดียว", title: "ยอดหัวบ้าน" },
    liveResults: { eyebrow: "ดึงผลหวยสดจาก apilotto", title: "📊 เช็คผลหวยสด" },
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
  payoutOverrides: {}, /* RATE-OVERRIDE-FE-V1: { hh_id: { "lottery|bet_type": rate } } */
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
  ticketSiblingEnabled: false,
  ticketRunDigits: [],
  ticketPendingNumbers: [], /* PEND-FEAT */
  latestReceiptTicketId: null,
  latestViewerCredentials: null,
  lastProvisionedHeadHouseId: null,
  announcedRoundIds: new Set(),
  announcedResultRoundIds: new Set(),
  notificationBootstrapped: false,
};
window.state = state; window.__appState = state; /* S2-N1: less-obvious alias */ // expose for patch

/* PEND-FEAT helpers */
function pushPendingNumber(num) {
  if (!num) return;
  if (!Array.isArray(state.ticketPendingNumbers)) state.ticketPendingNumbers = [];
  if (state.ticketPendingNumbers[state.ticketPendingNumbers.length - 1] !== num) {
    state.ticketPendingNumbers.push(num);
  }
  elements.ticketNumber.value = "";
  state.ticketUseDoubles = false;
  if (typeof renderTicketExpansionPreview === "function") renderTicketExpansionPreview();
  elements.ticketNumber.focus();
}
function clearPendingNumbers() {
  state.ticketPendingNumbers = [];
  if (state.pendingNumberTimer) clearTimeout(state.pendingNumberTimer);
}
window.pushPendingNumber = pushPendingNumber;
window.clearPendingNumbers = clearPendingNumbers;


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
    '[data-view-target="dashboard"], [data-view-target="markets"], [data-view-target="intake"], [data-view-target="review"], [data-view-target="entries"], [data-view-target="customers"], [data-view-target="lotteries"], [data-view-target="limits"], [data-view-target="payouts"], [data-view-target="results"], [data-view-target="resultLinks"], [data-view-target="reports"], [data-view-target="manage"], [data-view-target="auditLog"], [data-view-target="lineContacts"]',
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
  ticketCustomer: document.querySelector("#ticketCustomerInput"),
  ticketAddCustBtn: document.querySelector("#ticketAddCustBtn"),
  ticketAddCustForm: document.querySelector("#ticketAddCustForm"),
  ticketAddCustName: document.querySelector("#ticketAddCustName"),
  ticketAddCustPhone: document.querySelector("#ticketAddCustPhone"),
  ticketAddCustCancel: document.querySelector("#ticketAddCustCancel"),
  headHouseType: document.querySelector("#headHouseTypeInput"),
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
  headHouseParent: document.querySelector("#headHouseParentInput"),
  headHouseTier2: document.querySelector("#headHouseTier2Input"),
  headHouseFormTitle: document.querySelector("#headHouseFormTitle"),
  resetHeadHouseBtn: document.querySelector("#resetHeadHouseBtn"),
  headHouseName: document.querySelector("#headHouseNameInput"),
  headHouseNote: document.querySelector("#headHouseNoteInput"),
  headHouseCommission: document.querySelector("#headHouseCommissionInput"),
  headHouseSubmitBtn: document.querySelector("#headHouseSubmitBtn"),
  headHouseList: document.querySelector("#headHouseList"),
  viewerCredentialCard: document.querySelector("#viewerCredentialCard"),
  viewerCredentialSummary: document.querySelector("#viewerCredentialSummary"),
  copyViewerLineMsgBtn: document.querySelector("#copyViewerLineMsgBtn"),
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
  // Restore last view from URL hash (any view, not just intake)
  const initialHash = (window.location.hash || "").replace(/^#/, "");
  if (initialHash && document.querySelector('[data-view="' + initialHash + '"]')) {
    activateView(initialHash, false);
  } else if (window.location.hash === "#intake") {
    activateView("intake");
  }
  // Listen for browser back/forward
  window.addEventListener("hashchange", () => {
    const h = (window.location.hash || "").replace(/^#/, "");
    if (h && document.querySelector('[data-view="' + h + '"]')) {
      activateView(h, false);
    }
  });
}

async function bindEvents() {
  elements.setupForm.addEventListener("submit", handleSetup);
  elements.loginForm.addEventListener("submit", handleLogin);
  elements.logoutBtn.addEventListener("click", handleLogout);
  elements.sidebarLogoutBtn.addEventListener("click", handleLogout);
  elements.sidebarProfileBtn.addEventListener("click", () => activateView("users"));
  elements.backToMarketsBtn.addEventListener("click", async () => {
    if (!(await confirmDraftDiscard())) return;
    /* FIX post-save: clear receipt ค้าง เพื่อไม่ให้ list ยาวค้างทางขวา */
    state.latestReceiptTicketId = null;
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
  elements.ticketHeadHouse.addEventListener("change", () => {
    /* RATE-OVERRIDE-FE-V1: trigger re-render เรททั่วทุกที่ */
    renderTicketReceiptPreview();
    if (typeof renderSidebarRates === "function") renderSidebarRates();
    if (typeof renderTicketRateLabel === "function") renderTicketRateLabel();
  });
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
  /* PEND-FEAT: พิมพ์เลขครบ digits → push ลง state.ticketPendingNumbers + clear input */
  elements.ticketNumber.addEventListener("input", () => {
    const action = (typeof getIntakeAction === "function") ? getIntakeAction() : null;
    if (!action || !action.digits) return;
    if (action.target === "run_pair") return; /* วิ่ง = ใช้ keypad แยก */
    const v = elements.ticketNumber.value.replace(/\D/g, "");
    if (v.length !== action.digits) return;
    if (state.pendingNumberTimer) clearTimeout(state.pendingNumberTimer);
    state.pendingNumberTimer = setTimeout(() => {
      const cur = elements.ticketNumber.value.replace(/\D/g, "");
      if (cur.length !== action.digits) return;
      pushPendingNumber(cur);
    }, 60);
  });
  elements.ticketDoubleBtn.addEventListener("click", toggleTicketDoubles);
  elements.ticketReverseBtn.addEventListener("click", toggleTicketReverse);
  elements.clearTicketBtn.addEventListener("click", clearTicketDraft);
  elements.saveTicketBtn.addEventListener("click", saveTicketDraft);
  document.querySelectorAll("[data-intake-mode]").forEach((button) => {
    button.addEventListener("click", () => activateIntakeMode(button.dataset.intakeMode));
  });

  elements.parseQuickBtn?.addEventListener("click", parseQuickMessage);
  elements.clearQuickBtn?.addEventListener("click", clearQuickIntake);
  elements.saveQuickBatchBtn?.addEventListener("click", saveQuickBatch);
  elements.quickLottery?.addEventListener("change", renderQuickRoundOptions);
  elements.toggleQuickCustomerBtn?.addEventListener("click", toggleQuickCustomerForm);
  elements.quickCustomerForm?.addEventListener("submit", handleQuickCustomerSubmit);

  elements.entryForm?.addEventListener("submit", handleEntrySubmit);
  elements.resetBtn?.addEventListener("click", resetEntryForm);
  elements.betType?.addEventListener("change", () => {
    if (elements.number && elements.betType) syncNumberLength(elements.number, elements.betType.value);
    renderLimitPreview();
  });
  [elements.round, elements.number, elements.amount].filter(Boolean).forEach((input) => {
    input.addEventListener("input", renderLimitPreview);
    input.addEventListener("change", renderLimitPreview);
  });

  [elements.filterCustomer, elements.filterRound, elements.filterBetType].forEach((input) => {
    input.addEventListener("change", renderEntries);
  });
  elements.searchInput.addEventListener("input", renderEntries);

  /* FEAT entries-default-round: ตอนคลิกเข้าหน้า entries ครั้งแรก → auto-select งวดล่าสุด */
  document.querySelectorAll('[data-view-target="entries"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      setTimeout(() => {
        if (!state.entriesDefaultRoundSet && elements.filterRound.value === "all") {
          const latest = getLatestRoundIdWithEntries();
          if (latest && [...elements.filterRound.options].some((o) => o.value === latest)) {
            elements.filterRound.value = latest;
            elements.filterRound.dispatchEvent(new Event("change", { bubbles: true }));
            state.entriesDefaultRoundSet = true;
          }
        }
      }, 100);
    });
  });
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
  if (elements.copyViewerLineMsgBtn) elements.copyViewerLineMsgBtn.addEventListener("click", copyViewerLineMessage);
  elements.lotteryForm.addEventListener("submit", handleLotterySubmit);
  elements.roundForm.addEventListener("submit", handleRoundSubmit);
  elements.resetRoundBtn.addEventListener("click", resetRoundForm);
  elements.scheduleForm.addEventListener("submit", handleScheduleSubmit);
  elements.resetScheduleBtn.addEventListener("click", resetScheduleForm);
  elements.generateRoundsBtn.addEventListener("click", generateUpcomingRounds);
  elements.scheduleFrequency.addEventListener("change", syncScheduleFrequencyFields);

  elements.limitForm.addEventListener("submit", handleLimitSubmit);
  elements.resetLimitBtn.addEventListener("click", resetLimitForm);
  elements.limitBetType?.addEventListener("change", () => { if (elements.limitNumber && elements.limitBetType) syncNumberLength(elements.limitNumber, elements.limitBetType.value); });

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
  /* UIV2 reset — ลบ data-ui-v2 + remove UI elements ที่ใส่ */
  try {
    document.body.dataset.uiV2 = "";
    document.body.removeAttribute("data-theme");
    ["uiv2-topbar","uiv2-sidebar","uiv2-overlay","uiv2-bottom","uiv2-main"].forEach(function(id){
      var el = document.getElementById(id);
      if (el && id === "uiv2-main") {
        /* move workspace กลับมาที่ appShell */
        var ws = el.querySelector(".workspace");
        if (ws && el.parentNode) el.parentNode.insertBefore(ws, el);
      }
      if (el) el.remove();
    });
  } catch(e) {}
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
  // Respect hash from URL if present
  const hashView = (window.location.hash || "").replace(/^#/, "");
  if (hashView && document.querySelector('[data-view="' + hashView + '"]')) {
    activateView(hashView, false);
  } else {
    activateView(["head_house_viewer", "affiliate"].includes(state.user.role) ? "myAffiliate" : "overview", false);
  }
}

async function refreshState() {
  Object.assign(state, await api("/api/state"));
  render();
}


/* LOTTERY-HISTORY-TAB-V4: ผลย้อนหลัง + สถิติ ใน tab ใหม่ — pure JS append */
function ensureLotteryHistoryTab() {
  /* 1. สร้าง section ใหม่ ถ้ายังไม่มี */
  var viewStack = document.querySelector("main.view-stack");
  if (!viewStack) return;
  var section = document.querySelector('[data-view="lotteryHistory"]');
  if (!section) {
    section = document.createElement("section");
    section.className = "view";
    section.dataset.view = "lotteryHistory";
    section.hidden = true;
    section.innerHTML =
      '<section class="panel records-panel">' +
        '<div class="panel-heading" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
          '<h2 style="margin:0">📜 ผลย้อนหลัง + สถิติ</h2>' +
          '<select id="__statsLottery" class="select" style="margin-left:12px;padding:6px 10px;border-radius:8px;border:1px solid #d1d5db">' +
            '<option value="thai">หวยรัฐบาลไทย</option>' +
          '</select>' +
          '<button type="button" id="__statsReload" class="button button-secondary" style="margin-left:auto;font-size:13px">🔄 รีเฟรช</button>' +
        '</div>' +
        '<div id="__statsBody" style="padding:16px">' +
          '<div class="muted" style="text-align:center;padding:14px">⏳ กำลังโหลด...</div>' +
        '</div>' +
      '</section>';
    viewStack.appendChild(section);
  }

  /* 2. สร้าง nav button ใน primaryNav ถ้ายังไม่มี */
  var nav = document.querySelector("#primaryNav");
  if (nav && !nav.querySelector('[data-view-target="lotteryHistory"]')) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nav-button";
    btn.dataset.viewTarget = "lotteryHistory";
    btn.textContent = "📜 ผลย้อนหลัง";
    /* แทรกหลัง "ผลรางวัล" (results) */
    var resultsBtn = nav.querySelector('[data-view-target="results"]');
    if (resultsBtn && resultsBtn.nextSibling) {
      nav.insertBefore(btn, resultsBtn.nextSibling);
    } else {
      nav.appendChild(btn);
    }
  }

  /* 3. re-cache elements ใน app.js เพราะ JS append ทีหลัง */
  try {
    if (window.elements) {
      window.elements.views = document.querySelectorAll("[data-view]");
      window.elements.navButtons = document.querySelectorAll("[data-view-target]");
    }
  } catch (e) {}

  /* 4. add to VIEW_META ถ้ามี (สำหรับ header eyebrow/title) */
  try {
    if (window.VIEW_META && !window.VIEW_META.lotteryHistory) {
      window.VIEW_META.lotteryHistory = { eyebrow: "เลขออกบ่อย · เลขห่าง · สถิติแบบ", title: "ผลหวยย้อนหลัง" };
    }
  } catch (e) {}

  /* 5. populate dropdown */
  try {
    var sel = section.querySelector('#__statsLottery');
    var lotteries = (window.state && window.state.lotteries) || [];
    var sorted = lotteries.slice().sort(function(a, b) {
      return (a.display_order || 999) - (b.display_order || 999);
    });
    sel.innerHTML = sorted.map(function(l) {
      return '<option value="' + l.id + '">' + (l.name || l.id) + '</option>';
    }).join("");
  } catch (e) {}

  /* 6. หา ปุ่มใหม่ + bind click ให้เรียก activateView */
  try {
    var newBtn = document.querySelector('[data-view-target="lotteryHistory"]');
    if (newBtn && !newBtn.dataset.bound) {
      newBtn.dataset.bound = "1";
      newBtn.addEventListener("click", function() {
        if (typeof window.activateView === "function") {
          window.activateView("lotteryHistory");
        } else {
          /* fallback manual switch */
          document.querySelectorAll("[data-view]").forEach(function(v) {
            v.hidden = v.dataset.view !== "lotteryHistory";
            v.classList.toggle("is-active", v.dataset.view === "lotteryHistory");
          });
          document.querySelectorAll("[data-view-target]").forEach(function(b) {
            b.classList.toggle("is-active", b.dataset.viewTarget === "lotteryHistory");
          });
        }
        loadAdminStats();
      });
    }
  } catch (e) {}
}

function populateStatsDropdown() {
  var sel = document.getElementById("__statsLottery");
  if (!sel) return;
  var lotteries = (window.state && window.state.lotteries) || [];
  if (!lotteries.length) return; /* state ยังไม่โหลด */
  if (sel.dataset.populated === "1" && sel.options.length > 1) return; /* already done */
  var sorted = lotteries.slice().sort(function(a, b) {
    return (a.display_order || 999) - (b.display_order || 999);
  });
  var currentValue = sel.value;
  sel.innerHTML = sorted.map(function(l) {
    return '<option value="' + l.id + '">' + (l.name || l.id) + '</option>';
  }).join("");
  if (currentValue) sel.value = currentValue;
  sel.dataset.populated = "1";
}

function loadAdminStats() {
  var body = document.getElementById("__statsBody");
  var sel = document.getElementById("__statsLottery");
  if (!body || !sel) return;
  var lottery = sel.value || "thai";
  body.innerHTML = '<div class="muted" style="text-align:center;padding:14px">⏳ กำลังโหลด...</div>';
  fetch("/api/admin/lottery-stats?lottery=" + encodeURIComponent(lottery), { credentials: "same-origin", cache: "no-store" })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (!d.ok) {
        body.innerHTML = '<div class="muted" style="text-align:center;color:#c00;padding:14px">❌ ' + (d.error || "load fail") + '</div>';
        return;
      }
      body.innerHTML = renderStatsHtml(d);
    })
    .catch(function(e) {
      body.innerHTML = '<div class="muted" style="text-align:center;color:#c00;padding:14px">❌ ' + (e.message || e) + '</div>';
    });
}

function renderStatsHtml(d) {
  function esc(s) { return String(s == null ? "" : s).replace(/</g, "&lt;"); }
  var hot = d.hot_numbers || {};
  function hotSection(key, color) {
    var arr = (hot[key] || []).slice(0, 8);
    if (!arr.length) return '<div style="color:#9ca3af;font-size:13px">— ยังไม่มีข้อมูล —</div>';
    return arr.map(function(item) {
      return '<span style="display:inline-block;background:' + color + ';color:#fff;padding:4px 10px;border-radius:8px;margin:3px;font-family:monospace;font-size:14px">' +
        esc(item[0]) + ' <small style="opacity:.85">×' + item[1] + '</small></span>';
    }).join("");
  }
  var coldHtml = (d.cold_2bottom || []).slice(0, 12).map(function(c) {
    return '<span style="display:inline-block;background:#fef3c7;color:#92400e;padding:4px 10px;border-radius:8px;margin:3px;font-family:monospace;font-size:14px">' +
      esc(c.number) + ' <small style="opacity:.7">ห่าง ' + c.rounds_since + ' งวด</small></span>';
  }).join("");
  var p = d.pattern || {};
  var patternHtml =
    '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(120px, 1fr));gap:10px">' +
      '<div style="background:#eff6ff;padding:10px;border-radius:8px;text-align:center"><div style="font-size:12px;color:#1e40af">เบิ้ล</div><div style="font-size:22px;font-weight:bold;color:#1e3a8a">' + (p.berl || 0) + '</div><div style="font-size:11px;color:#6b7280">เช่น 122, 332</div></div>' +
      '<div style="background:#fef2f2;padding:10px;border-radius:8px;text-align:center"><div style="font-size:12px;color:#991b1b">ตอง</div><div style="font-size:22px;font-weight:bold;color:#7f1d1d">' + (p.tong || 0) + '</div><div style="font-size:11px;color:#6b7280">111, 222, 333</div></div>' +
      '<div style="background:#f0fdf4;padding:10px;border-radius:8px;text-align:center"><div style="font-size:12px;color:#065f46">นิ้ว (2 ล่าง)</div><div style="font-size:22px;font-weight:bold;color:#064e3b">' + (p.nyiu || 0) + '</div><div style="font-size:11px;color:#6b7280">11, 22, 33</div></div>' +
      '<div style="background:#fef3c7;padding:10px;border-radius:8px;text-align:center"><div style="font-size:12px;color:#92400e">เรียง</div><div style="font-size:22px;font-weight:bold;color:#78350f">' + (p.reung || 0) + '</div><div style="font-size:11px;color:#6b7280">123, 234, 678</div></div>' +
    '</div>';
  return '' +
    '<div style="font-size:13px;color:#6b7280;margin-bottom:14px">' +
      'หวย: <strong>' + esc(d.lottery.name) + '</strong> · ' +
      'จำนวนงวด: <strong>' + (d.rounds_count || 0) + '</strong> · ' +
      (d.date_range && d.date_range.from ? 'ช่วง: <strong>' + d.date_range.from + ' → ' + d.date_range.to + '</strong>' : '') +
    '</div>' +
    '<div style="margin-bottom:18px"><div style="font-weight:bold;color:#0f5132;margin-bottom:6px">🔥 เลข 3 ตัวบน ที่ออกบ่อย</div>' + hotSection("three_top", "#0f5132") + '</div>' +
    '<div style="margin-bottom:18px"><div style="font-weight:bold;color:#0f5132;margin-bottom:6px">🔥 เลข 3 ตัวล่าง ที่ออกบ่อย</div>' + hotSection("three_bottom", "#166a44") + '</div>' +
    '<div style="margin-bottom:18px"><div style="font-weight:bold;color:#7c2d12;margin-bottom:6px">🔥 เลข 2 ตัวล่าง ที่ออกบ่อย</div>' + hotSection("two_bottom", "#b91c1c") + '</div>' +
    '<div style="margin-bottom:18px;padding-top:14px;border-top:1px dashed #d1d5db">' +
      '<div style="font-weight:bold;color:#92400e;margin-bottom:6px">⏳ เลข 2 ตัวล่าง ที่ยังไม่ออก (เลขห่าง)</div>' +
      (coldHtml || '<div style="color:#9ca3af;font-size:13px">— ยังไม่มีข้อมูล —</div>') +
    '</div>' +
    '<div style="padding-top:14px;border-top:1px dashed #d1d5db">' +
      '<div style="font-weight:bold;color:#5b21b6;margin-bottom:10px">🎯 สถิติแบบ (จากผล 3 ตัวบน + 2 ล่าง)</div>' +
      patternHtml +
    '</div>';
}

/* hide lotteryHistory ถ้ากดปุ่ม nav อื่น (activateView ของ app.js ไม่รู้จัก section ที่ JS append) */
/* boot: ensureLotteryHistoryTab ตอน DOM ready */
(function() {
  function init() {
    try { ensureLotteryHistoryTab(); } catch (e) { console.warn("[history-tab init]", e); }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    setTimeout(init, 100);
  }
  /* delegated events */
  document.addEventListener("click", function(e) {
    if (e.target && e.target.id === "__statsReload") loadAdminStats();
  });
  document.addEventListener("change", function(e) {
    if (e.target && e.target.id === "__statsLottery") loadAdminStats();
  });
})();

/* legacy alias (ที่เคย call activateView('results') มี hook เรียกตัวเก่า) */
function ensureAdminHistoryPanel() {
  /* no-op: ย้ายไป tab ใหม่แล้ว */
}

/* REDESIGN-OVERVIEW-V2: รวม + redesign หน้ารวมใหม่หมด */
function redesignOverview() {
  var overview = document.querySelector('[data-view="overview"]');
  var dashboard = document.querySelector('[data-view="dashboard"]');
  if (!overview || overview.dataset.redesigned === "1") return;

  /* ย้าย dashboard panels เข้า overview ก่อน (ถ้าเดิม merge ไม่ทำ) */
  if (dashboard) {
    Array.from(dashboard.children).forEach(function(c) { overview.appendChild(c); });
    dashboard.style.display = "none";
  }

  /* เก็บ element id ที่ render function เดิมอ้าง — แค่ relocate, ไม่ลบ */
  function grab(id) {
    var el = overview.querySelector("#" + id);
    if (el) el.parentNode.removeChild(el);
    return el;
  }

  /* save existing key elements */
  var saved = {
    closingBanner: grab("closingSoonBanner"),
    playMarketSummary: grab("playMarketSummary"),
    taskQueueList: grab("taskQueueList"),
    limitWatchList: grab("limitWatchList"),
    recentEntriesList: grab("recentEntriesList"),
    ovRoundsContainer: grab("ovRoundsContainer"),
    ovPendingAlert: grab("ovPendingAlert"),
    ovEmpty: grab("ovEmpty"),
  };

  /* clear ทุกอย่างใน overview */
  overview.innerHTML = "";
  overview.classList.add("__redesigned");

  /* inject inline CSS เฉพาะ scope */
  if (!document.getElementById("__overview-styles")) {
    var style = document.createElement("style");
    style.id = "__overview-styles";
    style.textContent = '\
      [data-view="overview"].__redesigned:not([hidden]) { display: flex; flex-direction: column; gap: 18px; padding-bottom: 24px; }\n[data-view="overview"][hidden] { display: none !important; }\
      .ov2-greeting { background: linear-gradient(135deg, #0a3a23 0%, #0f5132 100%); color: #fff; border-radius: 16px; padding: 18px 20px; box-shadow: 0 6px 20px rgba(15,81,50,0.2); }\
      .ov2-greeting .ov2-hi { font-size: 13px; opacity: .8; }\
      .ov2-greeting .ov2-name { font-size: 20px; font-weight: 700; margin-top: 2px; }\
      .ov2-greeting .ov2-date { font-size: 13px; opacity: .9; margin-top: 6px; }\
      .ov2-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }\
      .ov2-kpi { background: #fff; border-radius: 14px; padding: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); border: 1px solid #f1f1f1; }\
      .ov2-kpi .label { font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; display: flex; align-items: center; gap: 6px; }\
      .ov2-kpi .label .icon { font-size: 18px; }\
      .ov2-kpi .value { font-size: 24px; font-weight: 800; color: #0a3a23; font-variant-numeric: tabular-nums; margin-top: 8px; line-height: 1.1; }\
      .ov2-kpi .meta { font-size: 11px; color: #6b7280; margin-top: 4px; }\
      .ov2-kpi.warn .value { color: #dc2626; }\
      .ov2-kpi.success .value { color: #065f46; }\
      .ov2-kpi.gold { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-color: #fcd34d; }\
      .ov2-kpi.gold .value { color: #78350f; }\
      .ov2-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }\
      .ov2-action-btn { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px 14px; text-align: left; cursor: pointer; font-family: inherit; font-weight: 600; color: #0a3a23; display: flex; align-items: center; gap: 10px; transition: all 0.15s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }\
      .ov2-action-btn:hover { background: #f0fdf4; border-color: #0f5132; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(15,81,50,0.12); }\
      .ov2-action-btn .icon { font-size: 22px; }\
      .ov2-action-btn .lbl { font-size: 13px; }\
      .ov2-card { background: #fff; border-radius: 14px; padding: 16px 18px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border: 1px solid #f1f1f1; }\
      .ov2-card-h { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #f3f4f6; }\
      .ov2-card-h h3 { margin: 0; font-size: 15px; color: #0a3a23; font-weight: 700; }\
      .ov2-card-h .badge { margin-left: auto; background: #d1fae5; color: #065f46; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }\
      .ov2-two-col { display: grid; grid-template-columns: 1fr; gap: 14px; }\
      @media (min-width: 768px) { .ov2-two-col { grid-template-columns: 1fr 1fr; } }\
      .ov2-empty-soft { color: #9ca3af; font-size: 13px; padding: 16px; text-align: center; }\
    ';
    document.head.appendChild(style);
  }

  function bkkDate() {
    try {
      var d = new Date();
      var th = ["อา.","จ.","อ.","พ.","พฤ.","ศ.","ส."][d.getDay()];
      var mo = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
      var y = d.getFullYear() + 543;
      return th + " " + d.getDate() + " " + mo[d.getMonth()] + " " + y + " · " + String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
    } catch(e) { return ""; }
  }

  var userName = (window.state && window.state.user && (window.state.user.username || window.state.user.name)) || "บอส";

  /* SECTION 1: GREETING */
  var greet = document.createElement("section");
  greet.className = "ov2-greeting";
  greet.innerHTML =
    '<div class="ov2-hi">สวัสดีค่ะ 👋</div>' +
    '<div class="ov2-name">' + (userName) + '</div>' +
    '<div class="ov2-date">' + bkkDate() + '</div>';
  overview.appendChild(greet);

  /* SECTION 2: closing banner ถ้ามี */
  if (saved.closingBanner) overview.appendChild(saved.closingBanner);

  /* SECTION 3: KPI Hero Cards (สร้างใหม่ + คง id เดิม) */
  var kpi = document.createElement("section");
  kpi.className = "ov2-kpi-grid";
  kpi.innerHTML =
    '<div class="ov2-kpi success">' +
      '<div class="label"><span class="icon">💰</span>ยอดรับวันนี้</div>' +
      '<div class="value" id="ovTodayStake">฿0</div>' +
      '<div class="meta" id="ovTodayMeta">— บิล · — ลูกค้า</div>' +
    '</div>' +
    '<div class="ov2-kpi warn">' +
      '<div class="label"><span class="icon">🔔</span>บิลรอตรวจ</div>' +
      '<div class="value" id="ovPending">0</div>' +
      '<div class="meta" id="ovPendingMeta">รอจากลูกค้า</div>' +
    '</div>' +
    '<div class="ov2-kpi">' +
      '<div class="label"><span class="icon">📈</span>ยอดรวมทั้งหมด</div>' +
      '<div class="value" id="totalAmount">฿0.00</div>' +
      '<div class="meta"><span id="totalEntries">0</span> บิล · <span id="totalCustomers">0</span> ลูกค้า</div>' +
    '</div>' +
    '<div class="ov2-kpi gold">' +
      '<div class="label"><span class="icon">⚠️</span>เลขใกล้เต็ม</div>' +
      '<div class="value" id="nearLimitCount">0</div>' +
      '<div class="meta">เลขที่ต้องเฝ้าระวัง</div>' +
    '</div>' +
    '<div class="ov2-kpi">' +
      '<div class="label"><span class="icon">🎰</span>งวดที่เปิดรับ</div>' +
      '<div class="value" id="ovActiveCount">0</div>' +
      '<div class="meta" id="ovUpdateTime">—</div>' +
    '</div>' +
    '<div class="ov2-kpi">' +
      '<div class="label"><span class="icon">🚨</span>เสี่ยงสูงสุด</div>' +
      '<div class="value" id="ovWorstRisk">฿0</div>' +
      '<div class="meta" id="ovWorstRiskMeta">—</div>' +
    '</div>' +
    '<div class="ov2-kpi" style="display:none">' +
      '<div class="value" id="pendingTicketCount">0</div>' +
    '</div>';
  overview.appendChild(kpi);

  /* SECTION 4: Quick Actions */
  var actions = document.createElement("section");
  actions.className = "ov2-actions";
  actions.innerHTML =
    '<button type="button" class="ov2-action-btn" data-view-target="intake"><span class="icon">✍️</span><span class="lbl">รับบิลใหม่</span></button>' +
    '<button type="button" class="ov2-action-btn" data-view-target="review"><span class="icon">🔔</span><span class="lbl">ตรวจบิลค้าง</span></button>' +
    '<button type="button" class="ov2-action-btn" data-view-target="entries"><span class="icon">📋</span><span class="lbl">รายการบิล</span></button>' +
    '<button type="button" class="ov2-action-btn" data-view-target="results"><span class="icon">🎁</span><span class="lbl">บันทึกผล</span></button>' +
    '<button type="button" class="ov2-action-btn" data-view-target="lotteryHistory"><span class="icon">📜</span><span class="lbl">ผลย้อนหลัง</span></button>' +
    '<button type="button" class="ov2-action-btn" data-view-target="reports"><span class="icon">💰</span><span class="lbl">บัญชี</span></button>';
  overview.appendChild(actions);

  /* SECTION 5: pending alert + market summary */
  if (saved.ovPendingAlert) overview.appendChild(saved.ovPendingAlert);
  if (saved.playMarketSummary) {
    var marketCard = document.createElement("section");
    marketCard.className = "ov2-card";
    marketCard.innerHTML = '<div class="ov2-card-h"><h3>📈 ภาพรวมงานรับหวย</h3></div>';
    marketCard.appendChild(saved.playMarketSummary);
    overview.appendChild(marketCard);
  }

  /* SECTION 6: งวดที่เปิดรับวันนี้ */
  if (saved.ovRoundsContainer) {
    var roundsCard = document.createElement("section");
    roundsCard.className = "ov2-card";
    roundsCard.innerHTML = '<div class="ov2-card-h"><h3>🎰 งวดที่เปิดรับวันนี้</h3><span class="badge" id="ovRoundsBadge">—</span></div>';
    roundsCard.appendChild(saved.ovRoundsContainer);
    if (saved.ovEmpty) roundsCard.appendChild(saved.ovEmpty);
    overview.appendChild(roundsCard);
  }

  /* SECTION 7: 2-column — งานที่ต้องทำ | เลขใกล้เต็ม */
  var twoCol = document.createElement("div");
  twoCol.className = "ov2-two-col";

  if (saved.taskQueueList) {
    var taskCard = document.createElement("section");
    taskCard.className = "ov2-card";
    taskCard.innerHTML = '<div class="ov2-card-h"><h3>⚡ งานที่ต้องทำตอนนี้</h3></div>';
    taskCard.appendChild(saved.taskQueueList);
    twoCol.appendChild(taskCard);
  }
  if (saved.limitWatchList) {
    var watchCard = document.createElement("section");
    watchCard.className = "ov2-card";
    watchCard.innerHTML = '<div class="ov2-card-h"><h3>🔥 เลขใกล้เต็ม</h3></div>';
    watchCard.appendChild(saved.limitWatchList);
    twoCol.appendChild(watchCard);
  }
  overview.appendChild(twoCol);

  /* SECTION 8: รายการล่าสุด */
  if (saved.recentEntriesList) {
    var recentCard = document.createElement("section");
    recentCard.className = "ov2-card";
    recentCard.innerHTML = '<div class="ov2-card-h"><h3>📃 รายการล่าสุด</h3></div>';
    recentCard.appendChild(saved.recentEntriesList);
    overview.appendChild(recentCard);
  }

  /* hide dashboard button */
  var dashBtn = document.querySelector('[data-view-target="dashboard"]');
  if (dashBtn) dashBtn.style.display = "none";

  overview.dataset.redesigned = "1";

  /* re-trigger render functions ถ้าทำได้ */
  try { if (typeof renderOverview === "function") renderOverview(); } catch(e){}
  try { if (typeof render === "function") render(); } catch(e){}
}

/* boot — รัน หลัง state load ครั้งแรก (delay สักหน่อย รอ initial render) */
(function() {
  function go() {
    try { redesignOverview(); } catch(e) { console.warn("[redesign-overview]", e); }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() { setTimeout(go, 300); });
  } else {
    setTimeout(go, 300);
  }
})();

/* OV2-CLICK-HANDLER: bind click ของ Quick Actions ใหม่ → trigger activateView */
/* ===== FULL-REDESIGN-V1: Sidebar + Bottom nav + Search + Dark mode + Manage grouping ===== */
function applyFullRedesign() {
  if (document.body.dataset.uiV2 === "1") return;
  /* UIV2-AUTH-GUARD v2: skip ถ้า user ยังไม่ login + retry counter (กัน infinite loop) */
  try {
    var authShell = document.getElementById("authShell");
    var stateUser = window.state && window.state.user;
    if (!stateUser && authShell && !authShell.classList.contains("hidden")) {
      window.__uiv2RetryCount = (window.__uiv2RetryCount || 0) + 1;
      if (window.__uiv2RetryCount < 20) { /* max 10 seconds */
        setTimeout(applyFullRedesign, 500);
      }
      return;
    }
    window.__uiv2RetryCount = 0;
  } catch(e) {}

  /* === 1. Inject CSS variables + design system === */
  if (!document.getElementById("__ui-v2-styles")) {
    var style = document.createElement("style");
    style.id = "__ui-v2-styles";
    style.textContent = [
      ":root {",
      "  --uiv2-green-dark: #0a3a23;",
      "  --uiv2-green: #0f5132;",
      "  --uiv2-green-light: #166a44;",
      "  --uiv2-gold: #ffd966;",
      "  --uiv2-bg: #f7f5ef;",
      "  --uiv2-surface: #ffffff;",
      "  --uiv2-surface-2: #faf8ee;",
      "  --uiv2-border: #e1ddd0;",
      "  --uiv2-text: #1a2e22;",
      "  --uiv2-text-soft: #6b7280;",
      "  --uiv2-text-mute: #9ca3af;",
      "  --uiv2-radius: 12px;",
      "  --uiv2-shadow: 0 2px 10px rgba(0,0,0,0.06);",
      "  --uiv2-shadow-lg: 0 8px 24px rgba(0,0,0,0.12);",
      "  --uiv2-sidebar-w: 220px;",
      "  --uiv2-topbar-h: 56px;",
      "  --uiv2-bottom-h: 60px;",
      "}",
      "body[data-theme=\"dark\"] {",
      "  --uiv2-bg: #0f1414;",
      "  --uiv2-surface: #1a2624;",
      "  --uiv2-surface-2: #14201e;",
      "  --uiv2-border: #2d3a37;",
      "  --uiv2-text: #e8f0ed;",
      "  --uiv2-text-soft: #a0b0aa;",
      "  --uiv2-text-mute: #6b7d77;",
      "  --uiv2-shadow: 0 2px 10px rgba(0,0,0,0.4);",
      "  --uiv2-shadow-lg: 0 8px 24px rgba(0,0,0,0.5);",
      "}",
      "body[data-ui-v2=\"1\"] { background: var(--uiv2-bg); color: var(--uiv2-text); }",
      "body[data-ui-v2=\"1\"] .auth-shell, body[data-ui-v2=\"1\"] header.topbar { display: none !important; }",
      "body[data-ui-v2=\"1\"] .app-frame { display: block !important; }",
      "body[data-ui-v2=\"1\"] .sidebar { display: none !important; }",
      "body[data-ui-v2=\"1\"] main.workspace { padding: 0 !important; margin: 0 !important; max-width: none !important; width: auto !important; }",
      "/* FLICKER-HIDE-V1: fade in ตอน UI v2 apply */",
      "#appShell.app-frame { opacity: 0; transition: opacity 0.18s ease-out; }",
      "body[data-ui-v2=\"1\"] #appShell.app-frame { opacity: 1 !important; }",
      "body[data-ui-v2=\"1\"] #appShell.app-frame { padding-top: var(--uiv2-topbar-h); padding-left: var(--uiv2-sidebar-w); padding-bottom: 0; transition: padding 0.2s; }",
      "body[data-ui-v2=\"1\"] #appShell.app-frame > * { background: transparent; }",
      "body[data-ui-v2=\"1\"] .workspace { background: transparent !important; padding: 18px !important; box-sizing: border-box; width: 100% !important; max-width: 1280px !important; margin: 0 auto !important; }",
      "@media (max-width: 767px) {",
      "  body[data-ui-v2=\"1\"] #appShell.app-frame { padding-left: 0 !important; padding-bottom: var(--uiv2-bottom-h) !important; }",
      "}",
      /* topbar v2 */
      "#uiv2-topbar { position: fixed; top: 0; left: 0; right: 0; height: var(--uiv2-topbar-h); background: var(--uiv2-surface); border-bottom: 1px solid var(--uiv2-border); display: flex; align-items: center; padding: 0 14px; gap: 10px; z-index: 100; box-shadow: var(--uiv2-shadow); }",
      "#uiv2-topbar .hamburger { background: none; border: none; font-size: 22px; cursor: pointer; padding: 8px; color: var(--uiv2-text); min-height: 44px; min-width: 44px; }",
      "#uiv2-topbar .logo { font-weight: 800; color: var(--uiv2-green); font-size: 16px; display: flex; align-items: center; gap: 8px; }",
      "#uiv2-topbar .logo .badge { width: 32px; height: 32px; border-radius: 8px; background: var(--uiv2-gold); color: var(--uiv2-green-dark); display: inline-flex; align-items: center; justify-content: center; font-weight: 900; font-size: 16px; }",
      "#uiv2-topbar .search-wrap { flex: 1; position: relative; max-width: 420px; }",
      "#uiv2-topbar .search-wrap input { width: 100%; padding: 8px 14px 8px 36px; border-radius: 999px; border: 1px solid var(--uiv2-border); background: var(--uiv2-surface-2); color: var(--uiv2-text); font-family: inherit; font-size: 13px; min-height: 38px; }",
      "#uiv2-topbar .search-wrap input:focus { outline: 2px solid var(--uiv2-green); border-color: transparent; }",
      "#uiv2-topbar .search-wrap::before { content: \"🔍\"; position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 14px; opacity: .7; }",
      "#uiv2-topbar .right-actions { display: flex; align-items: center; gap: 6px; }",
      "#uiv2-topbar .icon-btn { background: none; border: 1px solid var(--uiv2-border); border-radius: 10px; padding: 7px 9px; cursor: pointer; min-height: 38px; min-width: 38px; color: var(--uiv2-text); font-size: 16px; }",
      "#uiv2-topbar .icon-btn:hover { background: var(--uiv2-surface-2); }",
      "#uiv2-topbar .user-chip { background: linear-gradient(135deg, var(--uiv2-gold), #fcd34d); color: var(--uiv2-green-dark); padding: 6px 12px; border-radius: 999px; font-weight: 700; font-size: 12px; }",
      /* sidebar */
      "#uiv2-sidebar { position: fixed; top: var(--uiv2-topbar-h); left: 0; bottom: 0; width: var(--uiv2-sidebar-w); background: var(--uiv2-surface); border-right: 1px solid var(--uiv2-border); padding: 14px 8px; overflow-y: auto; z-index: 90; transition: transform 0.25s ease; }",
      "#uiv2-sidebar .item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px; cursor: pointer; color: var(--uiv2-text); font-weight: 600; font-size: 14px; margin-bottom: 4px; border: none; background: none; width: 100%; text-align: left; min-height: 44px; font-family: inherit; }",
      "#uiv2-sidebar .item:hover { background: var(--uiv2-surface-2); }",
      "#uiv2-sidebar .item.active { background: linear-gradient(135deg, var(--uiv2-green-dark), var(--uiv2-green)); color: #fff; box-shadow: var(--uiv2-shadow); }",
      "#uiv2-sidebar .item .icon { font-size: 18px; width: 22px; text-align: center; }",
      "#uiv2-sidebar .group-label { font-size: 11px; text-transform: uppercase; color: var(--uiv2-text-mute); padding: 8px 14px 4px; font-weight: 700; letter-spacing: 0.05em; }",
      /* main content area */
      "#uiv2-main { margin-top: var(--uiv2-topbar-h); margin-left: var(--uiv2-sidebar-w); padding: 18px; min-height: calc(100vh - var(--uiv2-topbar-h)); }",
      /* bottom nav (mobile only) */
      "#uiv2-bottom { display: none; }",
      "#uiv2-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 85; }",
      "#uiv2-overlay.show { display: block; }",
      /* mobile */
      "@media (max-width: 767px) {",
      "  #uiv2-sidebar { transform: translateX(-100%); width: 80%; max-width: 280px; box-shadow: var(--uiv2-shadow-lg); }",
      "  #uiv2-sidebar.open { transform: translateX(0); }",
      "  #uiv2-main { margin-left: 0; padding: 14px; padding-bottom: calc(var(--uiv2-bottom-h) + 14px); }",
      "  #uiv2-topbar .search-wrap { display: none; }",
      "  #uiv2-topbar .hamburger { display: inline-flex; }",
      "  #uiv2-bottom { display: flex; position: fixed; bottom: 0; left: 0; right: 0; height: var(--uiv2-bottom-h); background: var(--uiv2-surface); border-top: 1px solid var(--uiv2-border); z-index: 95; padding-bottom: env(safe-area-inset-bottom); }",
      "  #uiv2-bottom .b-item { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 4px; cursor: pointer; border: none; background: none; color: var(--uiv2-text-soft); font-family: inherit; min-height: 44px; }",
      "  #uiv2-bottom .b-item.active { color: var(--uiv2-green); }",
      "  #uiv2-bottom .b-item .icon { font-size: 20px; }",
      "  #uiv2-bottom .b-item .lbl { font-size: 10px; font-weight: 600; }",
      "}",
      "@media (min-width: 768px) {",
      "  #uiv2-topbar .hamburger { display: none; }",
      "}",
      /* manage hub grouping */
      ".uiv2-manage-section { background: var(--uiv2-surface); border-radius: var(--uiv2-radius); padding: 16px; margin-bottom: 14px; border: 1px solid var(--uiv2-border); }",
      ".uiv2-manage-section h3 { margin: 0 0 12px 0; font-size: 14px; color: var(--uiv2-green); display: flex; align-items: center; gap: 8px; }",
      ".uiv2-manage-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; }",
      ".uiv2-manage-card { background: var(--uiv2-surface-2); border: 1px solid var(--uiv2-border); border-radius: 10px; padding: 12px 14px; cursor: pointer; text-align: left; transition: all 0.15s; min-height: 64px; display: flex; align-items: center; gap: 10px; font-family: inherit; color: var(--uiv2-text); }",
      ".uiv2-manage-card:hover { background: var(--uiv2-surface); border-color: var(--uiv2-green); transform: translateY(-1px); box-shadow: var(--uiv2-shadow); }",
      ".uiv2-manage-card .icon { font-size: 22px; }",
      ".uiv2-manage-card .titles { display: flex; flex-direction: column; gap: 2px; }",
      ".uiv2-manage-card .t1 { font-weight: 700; font-size: 13px; color: var(--uiv2-text); }",
      ".uiv2-manage-card .t2 { font-size: 11px; color: var(--uiv2-text-soft); }",
    ].join("\n");
    document.head.appendChild(style);
  }

  /* === 2. Build navigation structure === */
  var NAV_TOP = [
    { id: "overview",      icon: "🏠", label: "หน้ารวม" },
    { id: "markets",       icon: "✍️", label: "แทงหวย" },
    { id: "review",        icon: "🔔", label: "ตรวจบิล" },
    { id: "entries",       icon: "📋", label: "รายการบิล" },
    { id: "results",       icon: "🎁", label: "ผลรางวัล" },
    { id: "lotteryHistory", icon: "📜", label: "ผลย้อนหลัง" },
    { id: "liveResults",   icon: "📊", label: "ผลสด" },
    { id: "reports",       icon: "💰", label: "บัญชี" },
  ];
  var NAV_BOTTOM = [
    { id: "overview", icon: "🏠", label: "หน้ารวม" },
    { id: "markets",  icon: "✍️", label: "แทง" },
    { id: "review",   icon: "🔔", label: "ตรวจ" },
    { id: "entries",  icon: "📋", label: "บิล" },
    { id: "manage",   icon: "⚙️", label: "เมนู" },
  ];

  /* === 3. Create topbar === */
  var topbar = document.createElement("div");
  topbar.id = "uiv2-topbar";
  topbar.innerHTML =
    '<button class="hamburger" id="uiv2-hamburger" aria-label="เมนู">☰</button>' +
    '<div class="logo"><span class="badge">฿</span><span>บ้านหวย</span></div>' +
    '<div class="search-wrap"><input type="search" id="uiv2-search" placeholder="ค้นหา…" autocomplete="off"></div>' +
    '<div class="right-actions">' +
      '<button class="icon-btn" id="uiv2-theme" title="โหมดมืด/สว่าง">🌙</button>' +
      '<span class="user-chip" id="uiv2-user-chip">—</span>' +
      '<button class="icon-btn" id="uiv2-logout" title="ออกจากระบบ">↪</button>' +
    '</div>';
  document.body.insertBefore(topbar, document.body.firstChild);

  /* set user chip */
  try {
    var u = (window.state && window.state.user) || {};
    document.getElementById("uiv2-user-chip").textContent = (u.username || u.name || "บอส").toUpperCase();
  } catch(e) {}

  /* === 4. Create sidebar === */
  var sidebar = document.createElement("aside");
  sidebar.id = "uiv2-sidebar";
  var sidebarHtml = '<div class="group-label">เมนูหลัก</div>';
  NAV_TOP.forEach(function(n) {
    sidebarHtml += '<button class="item" data-view-target="' + n.id + '" type="button"><span class="icon">' + n.icon + '</span><span>' + n.label + '</span></button>';
  });
  sidebarHtml += '<div class="group-label" style="margin-top:14px">ตั้งค่าระบบ</div>';
  sidebarHtml += '<button class="item" data-view-target="manage" type="button"><span class="icon">⚙️</span><span>ตั้งค่า</span></button>';
  sidebar.innerHTML = sidebarHtml;
  document.body.appendChild(sidebar);

  /* overlay (mobile sidebar) */
  var overlay = document.createElement("div");
  overlay.id = "uiv2-overlay";
  document.body.appendChild(overlay);

  /* === 5. Move main content (.workspace > .view-stack) into #uiv2-main === */
  var workspace = document.querySelector("main.workspace");
  if (workspace) {
    var newMain = document.createElement("main");
    newMain.id = "uiv2-main";
    workspace.parentNode.insertBefore(newMain, workspace);
    newMain.appendChild(workspace);
  }

  /* === 6. Bottom nav (mobile) === */
  var bottom = document.createElement("nav");
  bottom.id = "uiv2-bottom";
  var bottomHtml = "";
  NAV_BOTTOM.forEach(function(n) {
    bottomHtml += '<button class="b-item" data-view-target="' + n.id + '" type="button"><span class="icon">' + n.icon + '</span><span class="lbl">' + n.label + '</span></button>';
  });
  bottom.innerHTML = bottomHtml;
  document.body.appendChild(bottom);

  /* === 7. Activate body data attribute === */
  document.body.dataset.uiV2 = "1";

  /* === 8. Wire up events === */

  /* nav click — capture phase to bypass app.js cached navButtons */
  document.addEventListener("click", function(e) {
    var btn = e.target.closest && e.target.closest("[data-view-target]");
    if (!btn) return;
    var target = btn.dataset.viewTarget;
    if (!target) return;
    /* MANUAL TOGGLE: handle JS-appended sections (hhRates, lotteryHistory) ที่ไม่อยู่ใน elements.views */
    document.querySelectorAll("[data-view]").forEach(function(v) {
      v.hidden = v.dataset.view !== target;
      v.classList.toggle("is-active", v.dataset.view === target);
    });
    /* close mobile sidebar */
    var sb = document.getElementById("uiv2-sidebar"); if (sb) sb.classList.remove("open");
    var ov = document.getElementById("uiv2-overlay"); if (ov) ov.classList.remove("show");
    if (typeof window.activateView === "function") {
      try { window.activateView(target); } catch(e){}
    }
    /* highlight active in sidebar + bottom */
    document.querySelectorAll("#uiv2-sidebar .item").forEach(function(i) { i.classList.toggle("active", i.dataset.viewTarget === target); });
    document.querySelectorAll("#uiv2-bottom .b-item").forEach(function(i) { i.classList.toggle("active", i.dataset.viewTarget === target); });
  }, true);

  /* hamburger + overlay (cached DOM refs for perf) */
  var __sb = document.getElementById("uiv2-sidebar");
  var __ov = document.getElementById("uiv2-overlay");
  document.getElementById("uiv2-hamburger").addEventListener("click", function() {
    __sb.classList.toggle("open");
    __ov.classList.toggle("show");
  });
  overlay.addEventListener("click", function() {
    __sb.classList.remove("open");
    __ov.classList.remove("show");
  });

  /* theme toggle */
  var themeBtn = document.getElementById("uiv2-theme");
  function applyTheme(t) {
    document.body.dataset.theme = t;
    themeBtn.textContent = t === "dark" ? "☀️" : "🌙";
    try { localStorage.setItem("uiv2.theme", t); } catch(e){}
  }
  themeBtn.addEventListener("click", function() {
    var cur = document.body.dataset.theme || "light";
    applyTheme(cur === "dark" ? "light" : "dark");
  });
  try { applyTheme(localStorage.getItem("uiv2.theme") || "light"); } catch(e) { applyTheme("light"); }

  /* logout */
  document.getElementById("uiv2-logout").addEventListener("click", async function() {
    if (!confirm("ออกจากระบบ?")) return;
    /* call logout API — fail ก็ไม่เป็นไร session expired */
    try {
      var csrf = (typeof getCsrfToken === "function" ? getCsrfToken() : null) || "";
      var h = { "Content-Type": "application/json" };
      if (csrf) h["X-CSRF-Token"] = csrf;
      await fetch("/api/logout", { method: "POST", credentials: "same-origin", headers: h });
    } catch (e) {}
    /* ลบ cookies ทุกตัว — session + csrf + อื่นๆ */
    document.cookie.split(";").forEach(function(c) {
      var name = c.replace(/^ +/, "").split("=")[0];
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
    /* clear localStorage ของ uiv2 theme + state */
    try { localStorage.removeItem("uiv2.theme"); } catch(e){}
    /* hard reload — กลับไปหน้า login สด */
    location.href = "/";
  });

  /* search — fuzzy filter views/sub-views */
  var ALL_TARGETS = [
    { id: "overview",       label: "หน้ารวม Dashboard ภาพรวม" },
    { id: "markets",        label: "แทงหวย รับบิล intake" },
    { id: "review",         label: "ตรวจบิล รอตรวจ" },
    { id: "entries",        label: "รายการบิล tickets entries" },
    { id: "results",        label: "ผลรางวัล บันทึกผล" },
    { id: "lotteryHistory", label: "ผลย้อนหลัง สถิติ เลขออกบ่อย เลขห่าง" },
    { id: "liveResults",    label: "ผลสด live results" },
    { id: "reports",        label: "บัญชี การเงิน finance" },
    { id: "manage",         label: "ตั้งค่า settings" },
    { id: "customers",      label: "ลูกค้า customers" },
    { id: "headHouses",     label: "หัวบ้าน head house" },
    { id: "headHouseReport",label: "รายงานหัวบ้าน" },
    { id: "lotteries",      label: "หวย จัดการหวย lotteries" },
    { id: "limits",         label: "ลิมิต limits" },
    { id: "payouts",        label: "อัตราจ่าย payouts" },
    { id: "users",          label: "ผู้ใช้ users" },
    { id: "resultLinks",    label: "แหล่งผลหวย result links" },
    { id: "lineSettings",   label: "LINE settings" },
    { id: "lineContacts",   label: "LINE contacts ลูกค้า LINE" },
    { id: "affiliate",      label: "affiliate ตัวแทน" },
    { id: "bankAccounts",   label: "ธนาคาร bank accounts" },
    { id: "statsDashboard", label: "รายงานสถิติ stats" },
    { id: "promotionsAdmin",label: "โปรโมชั่น promotions" },
    { id: "auditLog",       label: "บันทึก audit log" },
  ];
  var searchInput = document.getElementById("uiv2-search");
  /* feedback toast helper */
  function __uiv2Toast(msg, kind) {
    var t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;top:70px;right:14px;background:" + (kind === "warn" ? "#fef3c7" : "#0a3a23") + ";color:" + (kind === "warn" ? "#92400e" : "#fff") + ";padding:8px 14px;border-radius:999px;font-size:12px;font-weight:600;z-index:1000;box-shadow:0 4px 12px rgba(0,0,0,0.15);opacity:0;transition:opacity 0.2s";
    document.body.appendChild(t);
    requestAnimationFrame(function(){ t.style.opacity = "1"; });
    setTimeout(function(){ t.style.opacity = "0"; setTimeout(function(){ t.remove(); }, 250); }, 1800);
  }
  /* debounce search input */
  var __searchTimer = null;
  searchInput.addEventListener("input", function(e) {
    if (__searchTimer) clearTimeout(__searchTimer);
    var q = (e.target.value || "").toLowerCase().trim();
    if (!q) return;
    __searchTimer = setTimeout(function() {
      var match = ALL_TARGETS.find(function(t) { return t.label.toLowerCase().includes(q); });
      if (match && typeof window.activateView === "function") {
        window.activateView(match.id);
        __uiv2Toast("ไปยัง: " + match.label.split(" ")[0]);
        searchInput.value = "";
      } else {
        __uiv2Toast("ไม่พบ \"" + q + "\"", "warn");
      }
    }, 350);
  });
  searchInput.addEventListener("keydown", function(e) {
    if (e.key === "Escape") { searchInput.value = ""; searchInput.blur(); }
  });

  /* === 9. Re-group manage hub === */
  var managePage = document.querySelector('[data-view="manage"]');
  if (managePage) {
    /* group definitions */
    var GROUPS = [
      { title: "👥 ลูกค้า & หัวบ้าน", items: [
        { id: "customers",       icon: "👥", t1: "ลูกค้า", t2: "จัดการรายชื่อ" },
        { id: "headHouses",      icon: "🏬", t1: "หัวบ้าน", t2: "จัดการ head house" },
        { id: "headHouseReport", icon: "📊", t1: "รายงานหัวบ้าน", t2: "ยอด · กำไร" },
      ]},
      { title: "🎰 หวย & เลขแทง", items: [
        { id: "lotteries",   icon: "🎰", t1: "หวย", t2: "จัดการรายชื่อหวย" },
        { id: "limits",      icon: "🎯", t1: "ลิมิต", t2: "วงเงินรับสูงสุด" },
        { id: "payouts",     icon: "💸", t1: "อัตราจ่าย", t2: "Rate ของแต่ละเลข" },
        { id: "resultLinks", icon: "🔗", t1: "แหล่งผลหวย", t2: "API · scraping" },
      ]},
      { title: "💰 การเงิน & การตลาด", items: [
        { id: "bankAccounts",   icon: "🏦", t1: "ธนาคาร", t2: "บัญชีรับโอน" },
        { id: "promotionsAdmin",icon: "🎁", t1: "โปรโมชั่น", t2: "สร้าง coupon" },
        { id: "affiliate",      icon: "🤝", t1: "Affiliate", t2: "ตัวแทน · referral" },
      ]},
      { title: "💬 LINE", items: [
        { id: "lineSettings", icon: "⚙️", t1: "LINE Settings", t2: "OA · webhook" },
        { id: "lineContacts", icon: "💬", t1: "LINE Contacts", t2: "ลูกค้า LINE" },
      ]},
      { title: "📊 รายงาน & ระบบ", items: [
        { id: "statsDashboard",icon: "📈", t1: "รายงานสถิติ", t2: "เลขฮิตซื้อ · กำไร" },
        { id: "users",         icon: "👤", t1: "ผู้ใช้", t2: "Admin · staff" },
        { id: "auditLog",      icon: "📜", t1: "บันทึก Audit", t2: "ประวัติการใช้งาน" },
      ]},
    ];

    /* hide existing manage-card buttons (cluttered) */
    managePage.querySelectorAll(".manage-card").forEach(function(c) { c.style.display = "none"; });

    /* check if v2 grouping already exists */
    if (!managePage.querySelector("#uiv2-manage-groups")) {
      var groupsWrap = document.createElement("div");
      groupsWrap.id = "uiv2-manage-groups";
      var html = "";
      GROUPS.forEach(function(g) {
        html += '<div class="uiv2-manage-section">';
        html += '<h3>' + g.title + '</h3>';
        html += '<div class="uiv2-manage-grid">';
        g.items.forEach(function(it) {
          html += '<button class="uiv2-manage-card" type="button" data-view-target="' + it.id + '">';
          html += '<span class="icon">' + it.icon + '</span>';
          html += '<span class="titles"><span class="t1">' + it.t1 + '</span><span class="t2">' + it.t2 + '</span></span>';
          html += '</button>';
        });
        html += '</div></div>';
      });
      groupsWrap.innerHTML = html;
      managePage.insertBefore(groupsWrap, managePage.firstChild);
    }
  }

  /* NO-FLICKER-V1: sync sidebar active state เท่านั้น ไม่เรียก activateView ซ้ำ (กัน flicker ตอน refresh) */
  try {
    var initial = (window.location.hash || "").replace("#", "");
    if (!initial) {
      var curActive = document.querySelector("[data-view].is-active");
      initial = curActive ? curActive.dataset.view : "overview";
    }
    /* sync sidebar + bottom nav active highlight */
    document.querySelectorAll("#uiv2-sidebar .item").forEach(function(i) { i.classList.toggle("active", i.dataset.viewTarget === initial); });
    document.querySelectorAll("#uiv2-bottom .b-item").forEach(function(i) { i.classList.toggle("active", i.dataset.viewTarget === initial); });
    /* เรียก activateView เฉพาะถ้า hash ระบุชัดและไม่ตรงกับที่ active ปัจจุบัน */
    var curActive2 = document.querySelector("[data-view].is-active");
    var curName = curActive2 ? curActive2.dataset.view : null;
    if (curName !== initial && window.location.hash && typeof window.activateView === "function") {
      window.activateView(initial);
    }
  } catch(e) {}
}

/* boot — apply after state load */
(function() {
  function go() { try { applyFullRedesign(); } catch(e) { console.warn("[uiv2]", e); } }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() { setTimeout(go, 400); });
  } else {
    setTimeout(go, 400);
  }
})();
/* ===== END FULL-REDESIGN-V1 ===== */

/* RATE-OVERRIDE-UI-V1: tab "อัตราจ่ายรายหัวบ้าน" */
function ensureRateOverrideTab() {
  /* CLEANUP: more robust selector — รองรับทั้ง pre/post UI v2 */
  var viewStack = document.querySelector("main.view-stack") || document.querySelector("#uiv2-main main.view-stack");
  if (!viewStack) return;
  if (document.querySelector('[data-view="hhRates"]')) return;

  /* create section */
  var section = document.createElement("section");
  section.className = "view";
  section.dataset.view = "hhRates";
  section.hidden = true;
  section.innerHTML =
    '<section class="panel records-panel">' +
      '<div class="panel-heading" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">' +
        '<h2 style="margin:0">💸 อัตราจ่ายรายหัวบ้าน</h2>' +
        '<select id="__hhrSelect" style="padding:6px 10px;border-radius:8px;border:1px solid #d1d5db;min-width:180px"><option value="">— เลือกหัวบ้าน —</option></select>' +
        '<select id="__hhrLottery" style="padding:6px 10px;border-radius:8px;border:1px solid #d1d5db;min-width:180px"><option value="">— เลือกหวย —</option></select>' +
        '<span style="margin-left:auto;font-size:13px;color:#6b7280" id="__hhrStatus"></span>' +
        '<button type="button" id="__hhrSave" class="button button-primary" style="font-size:13px">💾 บันทึก</button>' +
        '<button type="button" id="__hhrReset" class="button button-secondary" style="font-size:13px">↺ ล้าง (ใช้เรทกลาง)</button>' +
      '</div>' +
      '<div id="__hhrInfo" style="padding:12px 16px;background:#f0fdf4;border-left:4px solid #0f5132;margin:0 16px 14px;border-radius:8px;font-size:13px;color:#065f46">' +
        '💡 <strong>วิธีใช้:</strong> เลือกหัวบ้าน + หวย → กรอกอัตราจ่ายในช่อง override → บันทึก<br>' +
        '<small>ช่องที่ว่าง = ใช้อัตรากลาง (placeholder แสดง)</small>' +
      '</div>' +
      '<div id="__hhrBody" style="padding:0 16px 16px">' +
        '<div style="text-align:center;padding:30px;color:#9ca3af">— เลือกหัวบ้าน + หวย —</div>' +
      '</div>' +
    '</section>';
  viewStack.appendChild(section);

  /* re-cache app.js elements */
  try {
    if (window.elements) {
      window.elements.views = document.querySelectorAll("[data-view]");
      window.elements.navButtons = document.querySelectorAll("[data-view-target]");
    }
  } catch(e) {}

  /* VIEW_META */
  try {
    if (window.VIEW_META && !window.VIEW_META.hhRates) {
      window.VIEW_META.hhRates = { eyebrow: "เรทเฉพาะหัวบ้าน", title: "อัตราจ่ายรายหัวบ้าน" };
    }
  } catch(e) {}

  /* populate dropdowns */
  populateHhrDropdowns();
}

function populateHhrDropdowns() {
  var hhSel = document.getElementById("__hhrSelect");
  var lotSel = document.getElementById("__hhrLottery");
  if (!hhSel || !lotSel) return;
  var hh = (window.state && window.state.headHouses) || [];
  var lotteries = (window.state && window.state.lotteries) || [];
  if (hhSel.options.length > 1 && lotSel.options.length > 1) return;
  hhSel.innerHTML = '<option value="">— เลือกหัวบ้าน —</option>' + hh.map(function(h) {
    return '<option value="' + h.id + '">' + (h.name || h.code || h.id) + ' (' + (h.code || h.id) + ')</option>';
  }).join("");
  lotSel.innerHTML = '<option value="">— เลือกหวย —</option>' + lotteries.slice().sort(function(a,b){return (a.display_order||999)-(b.display_order||999);}).map(function(l) {
    return '<option value="' + l.id + '">' + (l.name || l.id) + '</option>';
  }).join("");
}

function loadHhrTable() {
  var hhId = document.getElementById("__hhrSelect").value;
  var lotId = document.getElementById("__hhrLottery").value;
  var body = document.getElementById("__hhrBody");
  if (!hhId || !lotId) {
    body.innerHTML = '<div style="text-align:center;padding:30px;color:#9ca3af">— เลือกหัวบ้าน + หวย —</div>';
    return;
  }
  body.innerHTML = '<div style="text-align:center;padding:30px;color:#9ca3af">⏳ กำลังโหลด...</div>';
  /* fetch: bet_types, payout_rates กลาง, overrides ของ hh นี้ */
  Promise.all([
    fetch("/api/state", { credentials: "same-origin" }).then(function(r){return r.json();}),
    fetch("/api/admin/head-house-rates?head_house_id=" + encodeURIComponent(hhId) + "&lottery_id=" + encodeURIComponent(lotId), { credentials: "same-origin" }).then(function(r){return r.json();}),
  ]).then(function(results) {
    var state = results[0];
    var ovData = results[1];
    var betTypes = state.betTypes || [];
    var payoutRates = state.payoutRates || [];
    var ratesByBt = {};
    payoutRates.filter(function(p){return p.lottery_id === lotId;}).forEach(function(p){ ratesByBt[p.bet_type_id] = p.rate; });
    var ovByBt = {};
    (ovData.items || []).forEach(function(o){ ovByBt[o.bet_type_id] = o.rate; });

    var rows = betTypes.map(function(bt) {
      var central = ratesByBt[bt.id];
      var override = ovByBt[bt.id];
      return '<tr>' +
        '<td style="padding:10px 12px;border-bottom:1px solid #f3f4f6">' +
          '<div style="font-weight:600;color:#0f5132">' + (bt.name || bt.id) + '</div>' +
          '<div style="font-size:11px;color:#6b7280">' + bt.id + '</div>' +
        '</td>' +
        '<td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:right;color:#6b7280;font-variant-numeric:tabular-nums">' +
          (central != null ? central.toLocaleString("th-TH") : "—") +
        '</td>' +
        '<td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:right">' +
          '<input type="number" step="0.01" min="0" class="__hhrInput" data-bet="' + bt.id + '" placeholder="' + (central != null ? central : "") + '" value="' + (override != null ? override : "") + '" style="width:120px;padding:6px 10px;border-radius:6px;border:1px solid #d1d5db;text-align:right;font-variant-numeric:tabular-nums">' +
        '</td>' +
        '<td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:13px">' +
          (override != null ? '<span style="background:#fef3c7;color:#92400e;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:600">override</span>' : '<span style="color:#9ca3af;font-size:11px">กลาง</span>') +
        '</td>' +
      '</tr>';
    }).join("");

    body.innerHTML =
      '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05)">' +
        '<thead><tr style="background:#f0fdf4">' +
          '<th style="padding:10px 12px;text-align:left;color:#065f46;font-size:12px">ประเภทเลข</th>' +
          '<th style="padding:10px 12px;text-align:right;color:#065f46;font-size:12px">เรทกลาง</th>' +
          '<th style="padding:10px 12px;text-align:right;color:#065f46;font-size:12px;min-width:140px">เรทของหัวบ้านนี้</th>' +
          '<th style="padding:10px 12px;text-align:center;color:#065f46;font-size:12px">สถานะ</th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table></div>';
  }).catch(function(e) {
    body.innerHTML = '<div style="color:#c00;padding:20px">❌ ' + (e.message || e) + '</div>';
  });
}

function saveHhrTable() {
  var hhId = document.getElementById("__hhrSelect").value;
  var lotId = document.getElementById("__hhrLottery").value;
  var statusEl = document.getElementById("__hhrStatus");
  if (!hhId || !lotId) { statusEl.textContent = "⚠️ เลือกหัวบ้าน + หวยก่อน"; return; }
  var inputs = document.querySelectorAll(".__hhrInput");
  var items = [];
  var toDelete = [];
  inputs.forEach(function(inp) {
    var v = inp.value.trim();
    var bt = inp.dataset.bet;
    if (v === "") {
      /* empty → delete override */
      toDelete.push({ bet_type_id: bt });
    } else {
      var r = Number(v);
      if (!isNaN(r) && r >= 0) {
        items.push({ head_house_id: hhId, lottery_id: lotId, bet_type_id: bt, rate: r });
      }
    }
  });
  statusEl.textContent = "⏳ กำลังบันทึก...";
  /* bulk POST */
  /* HH-CSRF-FIX-V1: ปล่อยให้ wrap fetch จัดการ token */
  var headers = { "Content-Type": "application/json" };
  Promise.all([
    items.length ? fetch("/api/admin/head-house-rates/bulk", { method: "POST", credentials: "same-origin", headers, body: JSON.stringify({ items }) }).then(function(r){return r.json();}) : Promise.resolve({ ok: true }),
    /* delete: serial */
    Promise.all(toDelete.map(function(d) {
      return fetch("/api/admin/head-house-rates", { method: "DELETE", credentials: "same-origin", headers, body: JSON.stringify({ head_house_id: hhId, lottery_id: lotId, bet_type_id: d.bet_type_id }) }).then(function(r){return r.json();});
    })),
  ]).then(function() {
    statusEl.textContent = "✅ บันทึกแล้ว";
    loadHhrTable();
    setTimeout(function(){ statusEl.textContent = ""; }, 2500);
  }).catch(function(e) {
    statusEl.textContent = "❌ " + (e.message || "บันทึกไม่สำเร็จ");
  });
}

function resetHhrTable() {
  if (!confirm("ล้างทุก override สำหรับหัวบ้าน+หวยนี้? (กลับไปใช้เรทกลาง)")) return;
  document.querySelectorAll(".__hhrInput").forEach(function(i){ i.value = ""; });
  saveHhrTable();
}

/* delegated events */
(function() {
  document.addEventListener("change", function(e) {
    if (e.target && (e.target.id === "__hhrSelect" || e.target.id === "__hhrLottery")) {
      loadHhrTable();
    }
  });
  document.addEventListener("click", function(e) {
    if (e.target && e.target.id === "__hhrSave") saveHhrTable();
    if (e.target && e.target.id === "__hhrReset") resetHhrTable();
  });
  /* boot: create tab + add nav button */
  function init() {
    try {
      ensureRateOverrideTab();
      /* register ใน sidebar UI v2 ถ้ามี */
      var sidebar = document.querySelector("#uiv2-sidebar");
      if (sidebar && !sidebar.querySelector('[data-view-target="hhRates"]')) {
        var btn = document.createElement("button");
        btn.className = "item";
        btn.type = "button";
        btn.dataset.viewTarget = "hhRates";
        btn.innerHTML = '<span class="icon">💸</span><span>เรทหัวบ้าน</span>';
        /* ใส่ก่อน "ตั้งค่า" */
        var setBtn = sidebar.querySelector('[data-view-target="manage"]');
        if (setBtn && setBtn.parentNode) setBtn.parentNode.insertBefore(btn, setBtn);
        else sidebar.appendChild(btn);
      }
      /* register ใน manage hub groups ถ้ามี */
      var manageGroups = document.querySelector("#uiv2-manage-groups");
      if (manageGroups && !manageGroups.querySelector('[data-view-target="hhRates"]')) {
        /* หา section "🎰 หวย & เลขแทง" */
        var sections = manageGroups.querySelectorAll(".uiv2-manage-section");
        for (var i = 0; i < sections.length; i++) {
          var h = sections[i].querySelector("h3");
          if (h && h.textContent.indexOf("หวย") >= 0) {
            var grid = sections[i].querySelector(".uiv2-manage-grid");
            if (grid) {
              var card = document.createElement("button");
              card.className = "uiv2-manage-card";
              card.type = "button";
              card.dataset.viewTarget = "hhRates";
              card.innerHTML = '<span class="icon">💸</span><span class="titles"><span class="t1">เรทหัวบ้าน</span><span class="t2">อัตราจ่าย override</span></span>';
              grid.appendChild(card);
            }
            break;
          }
        }
      }
    } catch(e) { console.warn("[hhr-init]", e); }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function(){ setTimeout(init, 700); });
  } else {
    setTimeout(init, 700);
  }
})();

/* HH-DELETE-INTERCEPT-V1: intercept ปุ่มลบเก่า → เรียก force-delete dialog ใหม่ */
document.addEventListener("click", function(e) {
  var btn = e.target.closest && e.target.closest(".delete-head-house-button");
  if (!btn) return;
  var id = btn.dataset.headHouseId;
  if (!id || id === "direct" || id === "line_self") return;
  e.preventDefault();
  e.stopImmediatePropagation();
  var hh = ((window.state && window.state.headHouses) || []).find(function(h){return h.id===id;});
  var name = hh ? (hh.name || hh.code || id) : id;
  if (typeof window.__hhForceDelete === "function") {
    window.__hhForceDelete(id, name);
  } else {
    alert("กรุณา refresh หน้าก่อน");
  }
}, true);

/* HH-DELETE-UI-V1: ปุ่ม "ปิดใช้งาน" + "ลบถาวร" สำหรับหัวบ้าน */
(function() {
  function csrfHeaders() {
    /* HH-CSRF-FIX-V1: ปล่อยให้ wrap fetch จัดการ token (อย่าส่ง X-CSRF-Token ว่างเอง) */
    return { "Content-Type": "application/json" };
  }

  function showHhDeleteDialog(hhId, hhName) {
    var hhList = ((window.state && window.state.headHouses) || []).filter(function(h){ return h.id !== hhId; });
    var hhOptions = hhList.map(function(h){
      return '<option value="' + h.id + '">' + (h.name || h.code || h.id) + ' (' + (h.code || h.id) + ')</option>';
    }).join("");

    var overlay = document.createElement("div");
    overlay.id = "__hhDelOverlay";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px";
    overlay.innerHTML =
      '<div style="background:#fff;border-radius:14px;max-width:480px;width:100%;padding:24px;box-shadow:0 20px 50px rgba(0,0,0,0.3)">' +
        '<h2 style="margin:0 0 8px 0;font-size:18px;color:#7f1d1d">🗑️ ลบหัวบ้าน "' + (hhName || hhId) + '"</h2>' +
        '<p style="font-size:13px;color:#374151;margin:0 0 16px 0">เลือกหัวบ้านปลายทาง — ลูกค้า + บิล + การเข้าถึง จะถูกย้ายไปหัวบ้านนี้ก่อนลบ</p>' +
        '<label style="display:block;font-size:12px;color:#6b7280;margin-bottom:6px">ย้ายไปอยู่ใต้หัวบ้าน:</label>' +
        '<select id="__hhDelTarget" style="width:100%;padding:10px;border-radius:8px;border:1px solid #d1d5db;font-size:14px;margin-bottom:16px">' +
          '<option value="direct">📦 ไม่ผ่านหัวบ้าน (direct)</option>' +
          hhOptions +
        '</select>' +
        '<div style="background:#fef2f2;border-left:4px solid #dc2626;padding:10px 12px;border-radius:6px;margin-bottom:18px;font-size:12px;color:#7f1d1d">' +
          '⚠️ <strong>เตือน:</strong> การลบทำไม่ได้ย้อนกลับ · payout overrides ของหัวบ้านนี้จะถูกลบทิ้ง · viewer accounts ก็จะถูกลบ' +
        '</div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end">' +
          '<button type="button" id="__hhDelCancel" class="button button-secondary" style="font-size:13px">ยกเลิก</button>' +
          '<button type="button" id="__hhDelConfirm" class="button" style="font-size:13px;background:#dc2626;color:#fff;border:none">🗑️ ยืนยันลบ</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    document.getElementById("__hhDelCancel").addEventListener("click", function(){ overlay.remove(); });
    overlay.addEventListener("click", function(e){ if (e.target === overlay) overlay.remove(); });
    document.getElementById("__hhDelConfirm").addEventListener("click", function() {
      var target = document.getElementById("__hhDelTarget").value;
      var btn = document.getElementById("__hhDelConfirm");
      btn.disabled = true; btn.textContent = "⏳ กำลังลบ...";
      fetch("/api/head-houses/" + encodeURIComponent(hhId) + "/force-delete", {
        method: "POST",
        credentials: "same-origin",
        headers: csrfHeaders(),
        body: JSON.stringify({ reassign_to: target })
      }).then(function(r){ return r.json(); })
        .then(function(d) {
          if (!d.ok) throw new Error(d.error || "delete_failed");
          alert("✅ ลบเสร็จ — ย้าย " + d.counts.customers + " ลูกค้า · " + d.counts.tickets + " บิล ไปยัง " + d.reassigned_to);
          overlay.remove();
          /* refresh state */
          if (typeof refreshState === "function") refreshState();
          else location.reload();
        })
        .catch(function(e) {
          btn.disabled = false; btn.textContent = "🗑️ ยืนยันลบ";
          alert("❌ " + (e.message || "ไม่สามารถลบ"));
        });
    });
  }

  function deactivateHh(hhId, hhName) {
    if (!confirm('🔒 ปิดใช้งานหัวบ้าน "' + (hhName || hhId) + '"?\n\n• ลูกค้ายังอยู่ใต้หัวบ้านนี้\n• ประวัติ + settlement ยังคงอยู่\n• กลับมาเปิดได้ทีหลัง')) return;
    fetch("/api/head-houses/" + encodeURIComponent(hhId) + "/deactivate", {
      method: "PATCH", credentials: "same-origin", headers: csrfHeaders()
    }).then(function(r){ return r.json(); })
      .then(function(d) {
        if (!d.ok) throw new Error(d.error || "fail");
        alert("🔒 ปิดใช้งานแล้ว");
        if (typeof refreshState === "function") refreshState();
      })
      .catch(function(e){ alert("❌ " + (e.message || e)); });
  }

  function activateHh(hhId, hhName) {
    if (!confirm('✅ เปิดใช้งานหัวบ้าน "' + (hhName || hhId) + '" กลับมา?')) return;
    fetch("/api/head-houses/" + encodeURIComponent(hhId) + "/activate", {
      method: "PATCH", credentials: "same-origin", headers: csrfHeaders()
    }).then(function(r){ return r.json(); })
      .then(function(d) {
        if (!d.ok) throw new Error(d.error || "fail");
        alert("✅ เปิดใช้งานแล้ว");
        if (typeof refreshState === "function") refreshState();
      })
      .catch(function(e){ alert("❌ " + (e.message || e)); });
  }

  /* expose globally */
  window.__hhForceDelete = showHhDeleteDialog;
  window.__hhDeactivate = deactivateHh;
  window.__hhActivate = activateHh;

  /* delegated click: หา data attributes */
  document.addEventListener("click", function(e) {
    var t = e.target;
    var btn;
    btn = t.closest && t.closest("[data-hh-action]");
    if (!btn) return;
    var action = btn.dataset.hhAction;
    var hhId = btn.dataset.hhId;
    var hhName = btn.dataset.hhName || hhId;
    if (action === "force-delete") showHhDeleteDialog(hhId, hhName);
    else if (action === "deactivate") deactivateHh(hhId, hhName);
    else if (action === "activate") activateHh(hhId, hhName);
  });

  /* inject 2 ปุ่มใน head_houses view (รายการหัวบ้าน) — observe DOM */
  function injectButtons() {
    var view = document.querySelector('[data-view="headHouses"]');
    if (!view) return;
    /* หา rows ที่มี data-hh-id (จาก app.js เดิม render table) */
    var rows = view.querySelectorAll("tr[data-head-house-id], tr[data-hh-id], [data-hh-id]");
    rows.forEach(function(row) {
      if (row.dataset.hhButtonsInjected) return;
      var hhId = row.dataset.headHouseId || row.dataset.hhId;
      if (!hhId || hhId === "direct" || hhId === "line_self") return;
      var hhName = row.dataset.hhName || "";
      var actionCell = row.querySelector("[data-actions], .actions, td:last-child");
      if (!actionCell) return;
      /* check if hh is active */
      var hh = ((window.state && window.state.headHouses) || []).find(function(h){ return h.id === hhId; });
      var isActive = !hh || hh.active !== 0;
      var btnHTML = isActive
        ? '<button type="button" class="button button-secondary" style="font-size:11px;margin-left:4px" data-hh-action="deactivate" data-hh-id="' + hhId + '" data-hh-name="' + (hhName||hhId).replace(/"/g,"&quot;") + '">🔒 ปิดใช้งาน</button>'
        : '<button type="button" class="button button-secondary" style="font-size:11px;margin-left:4px;background:#d1fae5;color:#065f46" data-hh-action="activate" data-hh-id="' + hhId + '" data-hh-name="' + (hhName||hhId).replace(/"/g,"&quot;") + '">✅ เปิดใช้งาน</button>';
      btnHTML += '<button type="button" class="button" style="font-size:11px;margin-left:4px;background:#dc2626;color:#fff;border:none" data-hh-action="force-delete" data-hh-id="' + hhId + '" data-hh-name="' + (hhName||hhId).replace(/"/g,"&quot;") + '">🗑️ ลบถาวร</button>';
      actionCell.insertAdjacentHTML("beforeend", btnHTML);
      row.dataset.hhButtonsInjected = "1";
    });
  }

  /* poll every 1s — light + กัน race condition */
  setInterval(injectButtons, 1500);
})();

/* TICKET-REASSIGN-UI-V1: ปุ่ม "ย้ายบิล" + popup */
(function() {
  function csrfHeaders() { return { "Content-Type": "application/json" }; }

  function showReassignDialog(ticketId, ticketCode, currentHhId) {
    var hhList = (window.state && window.state.headHouses) || [];
    var hhOptions = hhList
      .filter(function(h){ return h.id !== "direct" && h.id !== "line_self"; })
      .map(function(h){
        var sel = h.id === currentHhId ? " selected" : "";
        var label = (h.name || h.code || h.id) + (h.code ? " (" + h.code + ")" : "");
        return '<option value="' + h.id + '"' + sel + '>' + label + '</option>';
      }).join("");

    var overlay = document.createElement("div");
    overlay.id = "__tkReassignOverlay";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px";
    overlay.innerHTML =
      '<div style="background:#fff;border-radius:14px;max-width:480px;width:100%;padding:24px;box-shadow:0 20px 50px rgba(0,0,0,0.3)">' +
        '<h2 style="margin:0 0 8px 0;font-size:18px;color:#0a3a23">📦 ย้ายบิล ' + (ticketCode || ticketId) + '</h2>' +
        '<p style="font-size:13px;color:#374151;margin:0 0 16px 0">เลือกหัวบ้านปลายทาง — บิลนี้จะถูกย้ายไปอยู่ใต้หัวบ้านนี้</p>' +
        '<label style="display:block;font-size:12px;color:#6b7280;margin-bottom:6px">หัวบ้านปลายทาง:</label>' +
        '<select id="__tkReassignTarget" style="width:100%;padding:10px;border-radius:8px;border:1px solid #d1d5db;font-size:14px;margin-bottom:8px">' +
          '<option value="direct">📦 ไม่ผ่านหัวบ้าน (direct)</option>' +
          hhOptions +
        '</select>' +
        '<p style="font-size:11px;color:#9ca3af;margin:0 0 16px 0">ปัจจุบัน: <strong style="color:#0a3a23">' + (currentHhId || "—") + '</strong></p>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end">' +
          '<button type="button" id="__tkReassignCancel" class="button button-secondary" style="font-size:13px">ยกเลิก</button>' +
          '<button type="button" id="__tkReassignConfirm" class="button" style="font-size:13px;background:#0a3a23;color:#fff;border:none">✓ ยืนยันย้าย</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    document.getElementById("__tkReassignCancel").addEventListener("click", function(){ overlay.remove(); });
    overlay.addEventListener("click", function(e){ if (e.target === overlay) overlay.remove(); });
    document.getElementById("__tkReassignConfirm").addEventListener("click", function() {
      var target = document.getElementById("__tkReassignTarget").value;
      var btn = document.getElementById("__tkReassignConfirm");
      btn.disabled = true; btn.textContent = "⏳ กำลังย้าย...";
      fetch("/api/tickets/" + encodeURIComponent(ticketId) + "/reassign-head-house", {
        method: "POST",
        credentials: "same-origin",
        headers: csrfHeaders(),
        body: JSON.stringify({ head_house_id: target })
      }).then(function(r){ return r.json(); })
        .then(function(d) {
          if (!d.ok) throw new Error(d.error || "fail");
          var name = (d.head_house && (d.head_house.name || d.head_house.id)) || target;
          alert("✅ ย้าย " + (d.ticket_code || ticketCode) + " ไปอยู่ใต้ " + name + " เรียบร้อย");
          overlay.remove();
          if (typeof refreshState === "function") refreshState();
          else location.reload();
        })
        .catch(function(e) {
          btn.disabled = false; btn.textContent = "✓ ยืนยันย้าย";
          alert("❌ " + (e.message || "ย้ายไม่สำเร็จ"));
        });
    });
  }

  /* expose globally */
  window.__ticketReassign = showReassignDialog;

  /* delegated click — handle ปุ่มที่ inject */
  document.addEventListener("click", function(e) {
    var btn = e.target.closest && e.target.closest("[data-ticket-reassign]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    var tid = btn.dataset.ticketId;
    var tcode = btn.dataset.ticketCode || "";
    var curHh = btn.dataset.currentHh || "";
    showReassignDialog(tid, tcode, curHh);
  });

  /* inject ปุ่ม "📦 ย้าย" ใน review-summary-row (หน้ารายการบิล/อนุมัติ) */
  function injectButtons() {
    /* admin only */
    var u = window.state && window.state.user;
    if (!u || u.role !== "admin") return;

    var rows = document.querySelectorAll("tr[data-ticket-id]");
    rows.forEach(function(row) {
      if (row.dataset.reassignBtnInjected) return;
      var ticketId = row.dataset.ticketId;
      if (!ticketId) return;
      /* หา action cell — มี approve/reject/cancel buttons */
      var actionCell = row.querySelector(".btn-icon-approve, .approve-ticket-button");
      if (actionCell) actionCell = actionCell.parentElement;
      if (!actionCell) actionCell = row.querySelector("td:last-child");
      if (!actionCell) return;

      /* find ticket data */
      var ticket = ((window.state && window.state.tickets) || []).find(function(t){ return t.id === ticketId; });
      var ticketCode = (ticket && ticket.code) || "";
      var curHh = (ticket && ticket.head_house_id) || "";

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-icon";
      btn.style.cssText = "font-size:11px;background:#fef3c7;color:#92400e;border:1px solid #fcd34d;padding:4px 8px;border-radius:6px;margin-left:4px;cursor:pointer";
      btn.title = "ย้ายบิลไปหัวบ้านอื่น";
      btn.dataset.ticketReassign = "1";
      btn.dataset.ticketId = ticketId;
      btn.dataset.ticketCode = ticketCode;
      btn.dataset.currentHh = curHh;
      btn.textContent = "📦 ย้าย";
      actionCell.appendChild(btn);
      row.dataset.reassignBtnInjected = "1";
    });
  }

  /* poll — light + รองรับ table re-render */
  setInterval(injectButtons, 1500);
})();

function activateView(viewName, shouldScroll = true) {
  /* HOTFIX MED-4: gate affiliate-only views */
  const role = (window.state && window.state.user && window.state.user.role) || null;
  const affOnlyViews = new Set(["myAffiliate", "rulesAff"]);
  if (affOnlyViews.has(viewName) && role && role !== "affiliate" && role !== "head_house_viewer") {
    viewName = "overview";
  }
  const meta = VIEW_META[viewName] ?? VIEW_META.dashboard;
  const settingsViews = new Set(["customers", "headHouses", "headHouseReport", "lotteries", "limits", "payouts", "users", "resultLinks", "lineSettings", "affiliate", "bankAccounts"]);
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
    /* LIVE-RESULTS-TAB hook */
  if (viewName === "liveResults") {
    try { renderLiveResults(); startLiveResultsAutoRefresh(); } catch(e){}
  } else {
    try { stopLiveResultsAutoRefresh(); } catch(e){}
  }
  /* ADMIN-HIST-V2: ผลย้อนหลังหวยไทย — JS create + append, ไม่แตะ HTML structure */
  if (viewName === "results") {
    try { ensureAdminHistoryPanel(); } catch(e) { console.warn("ensureAdminHistoryPanel", e); }
  }
  if (shouldScroll) window.scrollTo({ top: 0, behavior: "smooth" });
  // Persist view in URL hash so refresh / share-link works
  try {
    const newHash = "#" + viewName;
    if (window.location.hash !== newHash) {
      history.replaceState(null, "", newHash);
    }
  } catch (e) {}
}


/* LIVE-RESULTS flag map */
const STOCK_FLAG_MAP = {
  "หุ้นไทย": "th", "หุ้นไทยปิดเย็น": "th", "หุ้นไทยปิดเช้า": "th",
  "หุ้นดาวน์โจนส์": "us", "หุ้นรัสเซีย": "ru",
  "หุ้นอินเดีย": "in", "หุ้นไต้หวัน": "tw",
  "จีนรอบบ่าย": "cn", "จีนรอบเช้า": "cn",
  "หุ้นสิงคโปร์": "sg", "หุ้นเกาหลี": "kr",
  "นิเคอิรอบเช้า": "jp", "นิเคอิรอบบ่าย": "jp",
  "ฮั่งเส็งรอบเช้า": "hk", "ฮั่งเส็งรอบบ่าย": "hk",
  "หุ้นเยอรมัน": "de", "หุ้นอังกฤษ": "gb", "หุ้นอิยิปต์": "eg",
};
/* เวลาออกของแต่ละหวย — แสดงในหน้าผลสด */
const STOCK_TIME_MAP = {
  "หุ้นไทยปิดเย็น": "16:30 น.",
  "หุ้นไทยปิดเช้า": "12:00 น.",
  "หุ้นดาวน์โจนส์": "03:05 น.",
  "หุ้นรัสเซีย": "22:50 น.",
  "หุ้นอินเดีย": "16:30 น.",
  "หุ้นไต้หวัน": "13:30 น.",
  "จีนรอบเช้า": "11:00 น.",
  "จีนรอบบ่าย": "15:00 น.",
  "หุ้นสิงคโปร์": "17:30 น.",
  "หุ้นเกาหลี": "14:30 น.",
  "นิเคอิรอบเช้า": "10:30 น.",
  "นิเคอิรอบบ่าย": "14:30 น.",
  "ฮั่งเส็งรอบเช้า": "11:00 น.",
  "ฮั่งเส็งรอบบ่าย": "15:30 น.",
  "หุ้นเยอรมัน": "22:54 น.",
  "หุ้นอังกฤษ": "22:35 น.",
  "หุ้นอิยิปต์": "20:30 น.",
};
function flagImg(code, size) {
  if (!code) return "";
  const sz = size || 22;
  return '<img src="/img/flags/' + code + '.png" style="width:' + sz + 'px;height:' + Math.round(sz*0.7) + 'px;vertical-align:middle;border-radius:3px;box-shadow:0 0 0 1px rgba(0,0,0,0.1);margin-right:6px" alt="">';
}

/* LIVE-RESULTS-TAB: render ผลสดจาก apilotto */
let __liveResultsTimer = null;
async function renderLiveResults() {
  const root = document.getElementById("liveResultsRoot");
  const updEl = document.getElementById("liveResultsUpdated");
  if (!root) return;
  if (updEl) updEl.textContent = "กำลังดึงข้อมูล...";
  try {
    const r = await fetch("/api/admin/live-results", { credentials: "include" });
    if (!r.ok) { root.innerHTML = '<div style="color:#dc2626;padding:12px">โหลดไม่สำเร็จ HTTP ' + r.status + '</div>'; return; }
    const d = await r.json();
    if (updEl) updEl.textContent = "✓ อัพเดท: " + new Date().toLocaleTimeString("th-TH");

    const isXx = (s) => !s || String(s).toLowerCase().includes("x");
    const pill = (lbl, val) => `<div style="background:#f1f5f9;padding:8px 12px;border-radius:6px;flex:1;min-width:80px;text-align:center"><div style="font-size:11px;color:#64748b;margin-bottom:2px">${lbl}</div><div style="font-size:18px;font-weight:700;color:${isXx(val)?"#94a3b8":"#0f172a"};letter-spacing:1px">${val||"--"}</div></div>`;
    const sec = (cls, title, date, body) => `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:12px"><div style="background:${cls};color:#fff;padding:10px 14px;display:flex;justify-content:space-between;align-items:center"><h3 style="font-size:14px;font-weight:700;margin:0">${title}</h3><span style="font-size:12px;opacity:0.9">${date||""}</span></div><div style="padding:12px">${body}</div></div>`;
    const row = (...pills) => `<div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap">${pills.join("")}</div>`;

    let h = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:12px">';

    if (d.thai) {
      let b = "";
      if (d.thai.first) {
        b += row(pill("รางวัลที่ 1", d.thai.first));
        b += row(pill("2 ตัวท้าย", d.thai.two_last), pill("3 ตัวท้าย", d.thai.three_last));
        b += row(pill("3 ตัวหน้า", d.thai.three_first));
      } else b = '<div style="color:#94a3b8;font-style:italic;text-align:center;padding:8px">ยังไม่มีผล</div>';
      h += sec("linear-gradient(135deg,#7c2d12,#dc2626)", flagImg("th") + "หวยรัฐบาลไทย <span style=\"font-size:11px;font-weight:400;opacity:0.85\">🕒 ออก 14:00 น. (ทุกวันที่ 1 และ 16)</span>", d.thai.date, b);
    }
    if (d.lao) {
      let b = "";
      if (d.lao.three_top || d.lao.two_top) {
        b += row(pill("4 ตัว", d.lao.four));
        b += row(pill("3 บน", d.lao.three_top), pill("2 บน", d.lao.two_top), pill("2 ล่าง", d.lao.two_bottom));
        if (d.lao.animal) b += row(pill("นามสัตว์", d.lao.animal));
      } else b = '<div style="color:#94a3b8;font-style:italic;text-align:center;padding:8px">ยังไม่มีผล (xxxx)</div>';
      h += sec("linear-gradient(135deg,#1e40af,#3b82f6)", flagImg("la") + "หวยลาวพัฒนา <span style=\"font-size:11px;font-weight:400;opacity:0.85\">🕒 ออก 20:30 น. (จันทร์-ศุกร์)</span>", d.lao.date, b);
    }
    if (d.hanoi && d.hanoi.length) {
      let b = "";
      const HANOI_TIME = { "พิเศษ": "17:30 น.", "ปกติ": "18:30 น.", "VIP": "19:30 น." };
      for (const x of d.hanoi) {
        const tm = HANOI_TIME[x.name] || "";
        b += `<div style="background:#f8fafc;padding:8px;border-radius:6px;margin-bottom:6px"><div style="font-size:12px;color:#b45309;font-weight:600;margin-bottom:4px;display:flex;justify-content:space-between"><span>${x.name}</span><span style="font-weight:400;color:#64748b">🕒 ${tm}</span></div>`;
        b += row(pill("4 ตัว", x.four), pill("3 บน", x.three_top), pill("2 บน", x.two_top), pill("2 ล่าง", x.two_bottom));
        b += "</div>";
      }
      h += sec("linear-gradient(135deg,#b45309,#f59e0b)", flagImg("vn") + "หวยฮานอย", d.hanoi[0].date, b);
    }
    if (d.malay) {
      let b = row(pill("4 ตัว", d.malay.four));
      b += row(pill("3 ตัว", d.malay.three_top), pill("2 บน", d.malay.two_top), pill("2 ล่าง", d.malay.two_bottom));
      h += sec("linear-gradient(135deg,#0f5132,#15803d)", flagImg("my") + "หวยมาเลย์ <span style=\"font-size:11px;font-weight:400;opacity:0.85\">🕒 ออก 18:00 น. (จ./พ./ส./อา.)</span>", d.malay.date, b);
    }
    h += "</div>";

    if (d.stock && d.stock.length) {
      let rows = "";
      for (const s of d.stock) {
        const xx = isXx(s.three_top);
        const badge = xx ? '<span style="background:#94a3b8;color:#fff;padding:2px 6px;border-radius:4px;font-size:10px">รอออก</span>' : '<span style="background:#22c55e;color:#fff;padding:2px 6px;border-radius:4px;font-size:10px">ออกแล้ว</span>';
        const tm = STOCK_TIME_MAP[s.name] || ""; rows += `<tr><td style="text-align:left;padding:8px 6px;border-bottom:1px solid #e2e8f0;font-weight:600;width:240px;min-width:240px"><div style="display:flex;align-items:center"><div style="width:30px;flex:0 0 30px">${flagImg(STOCK_FLAG_MAP[s.name]||"", 22)}</div><div><div>${s.name}</div>${tm?`<div style="font-size:10px;color:#64748b;font-weight:400">🕒 ${tm}</div>`:""}</div></div></td><td style="text-align:center;padding:8px;border-bottom:1px solid #e2e8f0;font-weight:700;color:${xx?"#94a3b8":"#0f172a"};letter-spacing:1px">${s.three_top||"--"}</td><td style="text-align:center;padding:8px;border-bottom:1px solid #e2e8f0;font-weight:700;color:${xx?"#94a3b8":"#0f172a"};letter-spacing:1px">${s.two_bottom||"--"}</td><td style="text-align:center;padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:12px">${s.date||""}</td><td style="text-align:center;padding:8px;border-bottom:1px solid #e2e8f0">${badge}</td></tr>`;
      }
      h += `<div style="margin-top:12px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden"><div style="background:linear-gradient(135deg,#581c87,#a855f7);color:#fff;padding:10px 14px"><h3 style="font-size:14px;font-weight:700;margin:0">📈 หวยหุ้น (${d.stock.length} ตลาด)</h3></div><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed"><colgroup><col style="width:240px"><col style="width:100px"><col style="width:100px"><col><col style="width:110px"></colgroup><thead><tr><th style="background:#f8fafc;padding:8px;text-align:left;font-size:11px;color:#64748b">ตลาด</th><th style="background:#f8fafc;padding:8px;text-align:center;font-size:11px;color:#64748b">3 บน</th><th style="background:#f8fafc;padding:8px;text-align:center;font-size:11px;color:#64748b">2 ล่าง</th><th style="background:#f8fafc;padding:8px;text-align:center;font-size:11px;color:#64748b">วันที่</th><th style="background:#f8fafc;padding:8px;text-align:center;font-size:11px;color:#64748b">สถานะ</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
    }
    root.innerHTML = h;
  } catch (e) {
    root.innerHTML = '<div style="color:#dc2626;padding:12px">Error: ' + e.message + '</div>';
  }
}
window.renderLiveResults = renderLiveResults;

function startLiveResultsAutoRefresh() {
  if (__liveResultsTimer) clearInterval(__liveResultsTimer);
  __liveResultsTimer = setInterval(renderLiveResults, 30000);
}
function stopLiveResultsAutoRefresh() {
  if (__liveResultsTimer) { clearInterval(__liveResultsTimer); __liveResultsTimer = null; }
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("liveResultsRefresh");
  if (btn) btn.addEventListener("click", renderLiveResults);
});


window.activateView = activateView;


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

  if (elements.quickCustomer) preserveSelect(elements.quickCustomer, customerOptions);
  // Smart Customer Field — walkin first, then customers sorted by activity
  if (elements.ticketCustomer) {
    const walkinOpt = '<option value="walkin">👥 ลูกค้าขาจร (ไม่ระบุชื่อ)</option>';
    const realOpts = state.customers
      .filter(c => c.id !== "walkin")
      .sort((a, b) => (a.code || "").localeCompare(b.code || ""))
      .map(c => '<option value="' + (c.id || "") + '">' + (c.code || "") + ' · ' + (c.name || "") + (c.phone ? ' (' + c.phone + ')' : '') + '</option>')
      .join("");
    preserveSelect(elements.ticketCustomer, walkinOpt + realOpts, "walkin");
  }
  if (elements.quickCustomerHeadHouse) preserveSelect(elements.quickCustomerHeadHouse, headHouseOptions, "direct");
  if (elements.quickHeadHouse) preserveSelect(elements.quickHeadHouse, headHouseOptions, "direct");
  if (elements.customer) preserveSelect(elements.customer, customerOptions);
  if (elements.customerHeadHouse) preserveSelect(elements.customerHeadHouse, headHouseOptions, "direct");
  if (elements.filterCustomer) preserveSelect(elements.filterCustomer, option("all", "ทั้งหมด") + customerOptions, "all");
  if (elements.quickLottery) preserveSelect(elements.quickLottery, lotteryOptions);
  preserveSelect(elements.roundLottery, lotteryOptions);
  preserveSelect(elements.scheduleLottery, lotteryOptions);
  if (elements.quickBetType) preserveSelect(elements.quickBetType, betTypeOptions, "two_top");
  preserveSelect(elements.betType, betTypeOptions, "two_top");
  preserveSelect(elements.filterBetType, option("all", "ทั้งหมด") + betTypeOptions, "all");
  preserveSelect(elements.round, acceptingRoundOptions || option("", "ยังไม่มีงวดที่เปิดรับ"));
  /* BUG-3 R1: keep current ticketRound at top so market-card switch sticks */
  const ticketRoundCurrent = elements.ticketRound.value;
  let ticketRoundOptions = acceptingRoundOptions;
  if (ticketRoundCurrent) {
    const isInAccepting = getAcceptingRounds().some((r) => r.id === ticketRoundCurrent);
    if (!isInAccepting) {
      const r = getRound(ticketRoundCurrent);
      if (r) ticketRoundOptions = option(r.id, formatRound(r)) + acceptingRoundOptions;
    }
  }
  preserveSelect(elements.ticketRound, ticketRoundOptions || option("", "ยังไม่มีงวดที่เปิดรับ"));
  preserveSelect(elements.ticketHeadHouse, headHouseOptions, "direct");
  preserveSelect(elements.filterRound, option("all", "ทั้งหมด") + roundOptions, "all");
  preserveSelect(elements.limitRound, acceptingRoundOptions || roundOptions);
  preserveSelect(elements.limitBetType, betTypeOptions, "two_top");
  preserveSelect(elements.resultRound, roundOptions);
  preserveSelect(elements.reportRound, roundOptions);
  preserveSelect(elements.userHeadHouse, headHouseOptions);
  preserveSelect(elements.headHouseReportSelect, headHouseOptions);

  renderQuickRoundOptions();
  if (elements.number && elements.betType) syncNumberLength(elements.number, elements.betType.value);
  if (elements.limitNumber && elements.limitBetType) syncNumberLength(elements.limitNumber, elements.limitBetType.value);
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
      title: `${pendingTickets.length.toLocaleString("th-TH")} บิลรอตรวจ`,
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
  // Inject legend bar once (above the board)
  if (elements.lotteryBoard && !elements.lotteryBoard.parentElement.querySelector('.market-legend')) {
    const legend = document.createElement('div');
    legend.className = 'market-legend';
    legend.innerHTML = '<span><span class="dot dot-open"></span> เปิดรับ</span>' +
      '<span><span class="dot dot-soon"></span> ใกล้ปิด (≤ 5 นาที)</span>' +
      '<span><span class="dot dot-upcoming"></span> ยังไม่เปิด</span>' +
      '<span><span class="dot dot-closed"></span> ปิดรับแล้ว</span>';
    elements.lotteryBoard.parentElement.insertBefore(legend, elements.lotteryBoard);
  }
  elements.lotteryBoard.innerHTML = LOTTERY_CATEGORIES.map((category) => {
    let lotteries = getPlayableLotteries(category.id);
    if (!lotteries.length) return "";
    // Sort: still-open (closing soonest first), then upcoming, then closed
    lotteries = lotteries.slice().sort((a, b) => {
      const ra = getDisplayRoundForLottery(a.id);
      const rb = getDisplayRoundForLottery(b.id);
      const sa = getRoundTimingStatus(ra);
      const sb = getRoundTimingStatus(rb);
      const order = { closing_soon: 0, open: 1, upcoming: 2, closed: 3, manual_closed: 4, unset: 5 };
      const oa = order[sa.state] ?? 9;
      const ob = order[sb.state] ?? 9;
      if (oa !== ob) return oa - ob;
      // Same status — sort by close time ASC (soonest first)
      if (ra && rb) {
        return new Date(ra.close_at).getTime() - new Date(rb.close_at).getTime();
      }
      return 0;
    });

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
        /* FIX post-save: เริ่มบิลใหม่ → clear receipt ค้าง */
        state.latestReceiptTicketId = null;
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
  /* PEND-FEAT clear on tab switch */
  if (typeof clearPendingNumbers === "function") clearPendingNumbers();
  document.querySelectorAll("[data-intake-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.intakeMode === mode);
  });
    /* FEAT single-mode: ลบ quickPanel + entryPanel แล้ว — แสดงเฉพาะ fast mode */
  document.querySelectorAll(".ticket-compose-board, #ticketDraftWrap, .ticket-finalize-panel").forEach((el) => {
    el.classList.remove("hidden");
  });

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
  const customerId = (elements.ticketCustomer && elements.ticketCustomer.value) || "walkin";
  const roundId = elements.ticketRound.value;
  /* PEND-FEAT commit: push เลขที่ค้างใน input ก่อน → commit ทุก number */
  const action = getIntakeAction();
  const inputDigits = elements.ticketNumber.value.replace(/\D/g, "");
  if (action && action.digits && inputDigits.length === action.digits) {
    if (typeof pushPendingNumber === "function") pushPendingNumber(inputDigits);
  }
  const pending = Array.isArray(state.ticketPendingNumbers) ? state.ticketPendingNumbers.slice() : [];
  const validationMessage = getIntakeValidationMessage();
  if (!pending.length) {
    if (validationMessage) {
      showTicketInlineFeedback(validationMessage, "warning");
      showToast(validationMessage, "warning");
      return;
    }
  } else {
    const topA = parseAmount(elements.ticketTopAmount.value);
    const botA = parseAmount(elements.ticketBottomAmount.value);
    const todA = parseAmount(elements.ticketTodAmount.value);
    if (!(topA > 0 || botA > 0 || todA > 0)) {
      showTicketInlineFeedback("ใส่ยอดบนหรือล่างก่อน", "warning");
      showToast("ใส่ยอดบนหรือล่างก่อน", "warning");
      return;
    }
  }
  const targets = pending.length ? pending : [elements.ticketNumber.value.trim()];
  const newEntries = targets.flatMap((n) => buildIntakeEntries({ customerId, roundId, number: n }));
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
  if (typeof clearPendingNumbers === "function") clearPendingNumbers(); /* PEND-FEAT */
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
      ...(bottomAmount > 0 ? [{ customerId, roundId, betTypeId: "three_bottom", number: entryNumber, amount: bottomAmount }] : []),
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
  const showBottom = target === "run_pair" || target === "pair" || target === "three_pair";
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
  /* sibling toggle — show only in pair mode */
  const sibBtn = document.querySelector("#ticketSiblingBtn");
  if (sibBtn) {
    sibBtn.classList.toggle("hidden", action?.target !== "pair");
    sibBtn.classList.toggle("is-active", state.ticketSiblingEnabled);
  }
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
  /* FIX: sibling_run is now an add-on toggle on top of pair (2 ตัว) mode */
  if (state.ticketSiblingEnabled && action.target === "pair") {
    return siblingRunNumbers(number);
  }
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

function siblingRunNumbers(value) {
  /* รูดพี่น้อง: ใส่ 1 หลัก → ขยายเป็น 20 ตัว
     เช่น 1 → 10-19 + 20-29
          9 → 90-99 + 00-09 (wrap)
  */
  const digit = parseInt(String(value || "").slice(0, 1), 10);
  if (isNaN(digit) || digit < 0 || digit > 9) return [];
  const partner = (digit + 1) % 10;
  const out = [];
  for (let n = 0; n <= 9; n += 1) out.push(`${digit}${n}`);
  for (let n = 0; n <= 9; n += 1) out.push(`${partner}${n}`);
  return [...new Set(out)];
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
  /* PEND-FEAT: ถ้าไม่มี draft + ไม่มี pending → exit */
  if (!state.ticketDraftEntries.length && !(state.ticketPendingNumbers || []).length) return;
  /* ถ้ามีแค่ pending ไม่มี draft → clear silent */
  if (!state.ticketDraftEntries.length) {
    if (typeof clearPendingNumbers === "function") clearPendingNumbers();
    if (typeof renderTicketExpansionPreview === "function") renderTicketExpansionPreview();
    return;
  }
  if (!(await confirmDialog({ title: "ล้างรายการในบิล", body: "เลขในบิลทั้งหมดจะถูกลบ คุณยืนยันใช่หรือไม่?", danger: true }))) return;
  state.ticketDraftEntries = [];
  if (typeof clearPendingNumbers === "function") clearPendingNumbers(); /* PEND-FEAT post-confirm */
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
    /* FIX stay-intake: clear receipt + reset form, stay หน้าคีย์บิล */
    const savedTicketId = inserted[0]?.ticket_id || null;
    state.latestReceiptTicketId = null;  /* clear → receipt preview ไม่ค้าง list ยาว */
    state.ticketDraftEntries = [];
    elements.ticketNote.value = "";
    elements.ticketNumber.value = "";
    if (elements.ticketTopAmount) elements.ticketTopAmount.value = "";
    if (elements.ticketBottomAmount) elements.ticketBottomAmount.value = "";
    if (elements.ticketTodAmount) elements.ticketTodAmount.value = "";
    if (elements.ticketCustomer) elements.ticketCustomer.value = "walkin";
    if (elements.ticketHeadHouse && elements.ticketHeadHouse.options.length) {
      elements.ticketHeadHouse.value = "direct";
      if (!elements.ticketHeadHouse.value && elements.ticketHeadHouse.options[0]) {
        elements.ticketHeadHouse.value = elements.ticketHeadHouse.options[0].value;
      }
    }
    state.ticketUseDoubles = false;
    state.ticketReverseEnabled = false;
    state.ticketSiblingEnabled = false;
    state.ticketRunDigits = [];
    await refreshState();
    /* re-render after reset เพื่อ sync UI */
    if (typeof renderTicketWorkbench === "function") renderTicketWorkbench();
    const ticketCode = getTicket(savedTicketId)?.code;
    showToast(ticketCode ? `✓ บันทึกบิล ${ticketCode} แล้ว พร้อมคีย์บิลใหม่` : "✓ บันทึกบิลแล้ว พร้อมคีย์บิลใหม่", "success");
    /* focus กลับ number input ทันที (workflow คีย์ต่อ) */
    setTimeout(() => { if (elements.ticketNumber) elements.ticketNumber.focus(); }, 100);
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
  /* FEAT receipt-payout: คำนวณ rate ของ lottery + entry */
  const getRowRate = (entry) => {
    const bt = entry.bet_type_id || entry.betTypeId;
    return round ? (typeof getPayoutRate === "function" ? getPayoutRate(round.lottery_id, bt) : 0) : 0;
  };
  const rows = draftEntries.length
    ? draftEntries
        .map(
          (entry) => {
            const rate = getRowRate(entry);
            const payout = entry.amount * rate;
            return `
            <div class="receipt-row">
              <span>${escapeHtml(getBetTypeName(entry.bet_type_id || entry.betTypeId))}</span>
              <strong>${escapeHtml(entry.number)}</strong>
              <em>${money(entry.amount)}</em>
              <em class="receipt-payout-cell" title="ราคาจ่าย ${formatRate(rate)} × ยอด ${money(entry.amount)}">→ ${money(payout)}</em>
            </div>
          `;
          },
        )
        .join("")
    : '<p class="receipt-empty">เพิ่มรายการแล้วบิลจะขึ้นตรงนี้ทันที</p>';
  const totalPayout = sum(draftEntries.map((entry) => entry.amount * getRowRate(entry)));

  /* FEAT cancel-bill: ปุ่มยกเลิกบิลที่เพิ่ง submit (เฉพาะ pending_review) */
  const canCancelSaved = savedTicket && savedTicket.status === "pending_review";
  elements.ticketReceiptPreview.innerHTML = `
      <header class="receipt-header">
        <div>
          <span>บิลยืนยันรายการ</span>
          <strong>${escapeHtml(code)}</strong>
        </div>
        <div class="receipt-header-side">
          <span class="flag ${round ? getLotteryFlagClass(round.lottery_id) : "flag-generic"} receipt-flag" aria-hidden="true"></span>
          <div class="receipt-status">${savedTicket ? ticketStatusLabel(savedTicket.status) : "รอบันทึก"}</div>
          ${canCancelSaved ? `<button class="button button-small button-danger receipt-cancel-bill" type="button" data-ticket-id="${escapeHtml(savedTicket.id)}" title="ยกเลิกบิลที่เพิ่งบันทึก">❌ ยกเลิกบิล</button>` : ""}
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
      <span>รวมรับเข้า (ลูกค้าจ่ายเรา)</span>
      <strong>${money(total)}</strong>
    </footer>
    <footer class="receipt-payout-total">
      <span>🎯 ถ้าถูกทั้งบิล ต้องจ่าย</span>
      <strong>${money(totalPayout)}</strong>
    </footer>
  `;
  /* FEAT cancel-bill: bind click ของปุ่มยกเลิก */
  const cancelBtn = elements.ticketReceiptPreview.querySelector(".receipt-cancel-bill");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", async () => {
      const id = cancelBtn.dataset.ticketId;
      const ok = await confirmDialog({
        title: "ยกเลิกบิลนี้?",
        body: "บิลจะถูกตั้งสถานะเป็น 'ยกเลิก' — ใช้สำหรับกรณีลูกค้าคีย์ผิดหรือเปลี่ยนใจ ยกเลิกแล้วยกกลับไม่ได้",
        danger: true,
        confirmLabel: "ใช่ ยกเลิกบิล",
      });
      if (!ok) return;
      try {
        await api(`/api/tickets/${encodeURIComponent(id)}/cancel`, { method: "POST" });
        state.latestReceiptTicketId = null;
        state.ticketDraftEntries = [];
        await refreshState();
        renderTicketWorkbench();
        if (window.showToast) window.showToast("✓ ยกเลิกบิลเรียบร้อย", "success");
      } catch (err) {
        const code = err?.payload?.error || err?.message || "";
        const msg = {
          ticket_already_cancelled: "บิลนี้ถูกยกเลิกไปแล้ว",
          ticket_not_found: "ไม่พบบิล — อาจถูกลบไปแล้ว",
          forbidden: "ไม่มีสิทธิ์ยกเลิกบิล",
        }[code] || ("ยกเลิกบิลไม่สำเร็จ " + code);
        if (window.showToast) window.showToast("❌ " + msg, "danger");
      }
    });
  }
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
      const overridden = isPayoutRateOverridden(round.lottery_id, betTypeId);
      return rate
        ? `
          <div class="sidebar-rate-row${overridden ? ' is-override' : ''}">
            <span>${escapeHtml(getBetTypeName(betTypeId))}${overridden ? ' <em style="color:#dc2626;font-size:10px;font-style:normal;font-weight:600">★ override</em>' : ''}</span>
            <strong${overridden ? ' style="color:#dc2626"' : ''}>${formatRate(rate)}</strong>
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
  /* FEAT red-bar: เลขปิดรับ → ข้อความเด่นชัด + ไอคอน */
  const label =
    status === "full"
      ? `<strong style="font-size: 1.05em;">🚫 เลขนี้ปิดรับ ${escapeHtml(item.limit.number)} (เต็มลิมิตแล้ว)</strong>`
      : status === "warning"
        ? `<strong>⚠️ เลข ${escapeHtml(item.limit.number)} ใกล้เต็ม</strong>`
        : `<strong>มีอั้นเลขตรงกัน</strong>`;
  elements.ticketLimitPreview.innerHTML = `
    ${label}
    <span>ปัจจุบัน ${money(item.currentAmount)} / เพดาน ${money(item.limit.max_amount)}</span>
    <span>รวมโพยนี้แล้ว ${money(projected)} (${percent(ratio)})</span>
  `;
}

function renderTicketExpansionPreview() {
  const roundId = elements.ticketRound.value;
  let number = elements.ticketNumber.value.trim();
  const action = getIntakeAction();
  /* PEND-FEAT preview override */
  const pending = Array.isArray(state.ticketPendingNumbers) ? state.ticketPendingNumbers.slice() : [];
  let previewNumbers;
  if (pending.length) {
    const expanded = pending.flatMap((n) => getIntakeNumbers(action, n));
    const seen = new Set();
    previewNumbers = expanded.filter((n) => seen.has(n) ? false : (seen.add(n), true));
  } else {
    previewNumbers = getIntakeNumbers(action, number);
  }
  /* PEND-FEAT: ถ้ามี pending → ถือว่า ready เลย (input clear แล้วก็ยังต้องโชว์ chip) */
  const isNumberReady = pending.length > 0
    ? true
    : (action?.target === "run_pair"
        ? previewNumbers.length > 0
        : state.ticketUseDoubles || isValidNumber(number, action?.digits || 0));
  if (!action || !isNumberReady || !previewNumbers.length) {
    elements.ticketExpansionPreview.classList.add("hidden");
    elements.ticketExpansionPreview.innerHTML = "";
    elements.addTicketEntryBtn.disabled = false;
    elements.addTicketEntryBtn.title = getIntakeValidationMessage();
    renderTicketInlineFeedback();
    return;
  }
  /* PEND-FEAT: ตอน build entries ก็ใช้ pending ทั้งหมด (รวมยอด) — ถ้าไม่มี pending ก็ใช้ input */
  const previewEntries = pending.length
    ? pending.flatMap((n) => buildIntakeEntries({ customerId: "walkin", roundId, number: n }))
    : buildIntakeEntries({ customerId: "walkin", roundId, number });
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

  /* BUG-7 R2: detect "บน X", "ล่าง Y", "โต๊ด Z" patterns and split entries */
  const topMatch = raw.match(/บน\s*(\d+(?:,\d{3})*)/i);
  const bottomMatch = raw.match(/ล่าง\s*(\d+(?:,\d{3})*)/i);
  const todMatch = raw.match(/โต๊ด\s*(\d+(?:,\d{3})*)/i);
  const topAmt = topMatch ? parseAmount(topMatch[1]) : 0;
  const bottomAmt = bottomMatch ? parseAmount(bottomMatch[1]) : 0;
  const todAmt = todMatch ? parseAmount(todMatch[1]) : 0;
  const hasTopBottomSplit = topAmt > 0 || bottomAmt > 0 || todAmt > 0;

  /* Strip บน/ล่าง/โต๊ด clauses BEFORE pulling numbers so we don't pick up amounts as bet numbers */
  let cleanForNumbers = raw;
  if (hasTopBottomSplit) {
    cleanForNumbers = cleanForNumbers
      .replace(/บน\s*\d+(?:,\d{3})*/gi, " ")
      .replace(/ล่าง\s*\d+(?:,\d{3})*/gi, " ")
      .replace(/โต๊ด\s*\d+(?:,\d{3})*/gi, " ");
  }

  const stripped = stripParserNoise(cleanForNumbers);
  const numbers = [...stripped.matchAll(/\b\d{1,3}\b/g)].map((match) => match[0]);

  let entries;
  if (hasTopBottomSplit) {
    /* Build entries: one per (number x bet_type) combo */
    entries = [];
    numbers.forEach((number) => {
      const len = number.length;
      if (len === 2) {
        if (topAmt > 0) entries.push({ customerId: inferredCustomer, roundId: inferredRound, betTypeId: "two_top", number, amount: topAmt, sourceText: raw });
        if (bottomAmt > 0) entries.push({ customerId: inferredCustomer, roundId: inferredRound, betTypeId: "two_bottom", number, amount: bottomAmt, sourceText: raw });
      } else if (len === 3) {
        if (topAmt > 0) entries.push({ customerId: inferredCustomer, roundId: inferredRound, betTypeId: "three_top", number, amount: topAmt, sourceText: raw });
        if (todAmt > 0) entries.push({ customerId: inferredCustomer, roundId: inferredRound, betTypeId: "three_tod", number, amount: todAmt, sourceText: raw });
        if (bottomAmt > 0) entries.push({ customerId: inferredCustomer, roundId: inferredRound, betTypeId: "three_bottom", number, amount: bottomAmt, sourceText: raw });
      } else {
        /* 1-digit run — use top */
        const amt = topAmt || bottomAmt || todAmt;
        if (amt > 0) entries.push({ customerId: inferredCustomer, roundId: inferredRound, betTypeId: "run_top", number, amount: amt, sourceText: raw });
      }
    });
  } else {
    entries = numbers.map((number) => {
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
  }

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

/* FEAT entries-default-round: หางวดล่าสุดที่มี entry */
function getLatestRoundIdWithEntries() {
  const set = new Set();
  for (const e of state.entries) if (e.round_id) set.add(e.round_id);
  if (!set.size) return null;
  const rounds = state.rounds
    .filter((r) => set.has(r.id))
    .sort((a, b) => new Date(`${b.draw_date}T${b.draw_time || "00:00"}:00`) - new Date(`${a.draw_date}T${a.draw_time || "00:00"}:00`));
  return rounds[0]?.id || null;
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
  if (!state.expandedTickets) state.expandedTickets = new Set();

  /* BUG-2 R1: group by round, then by ticket (1 บิล/โพย ต่อ row + expand) */
  const byRound = groupBy(visible, (entry) => entry.round_id);
  elements.entryGroups.innerHTML = [...byRound.entries()]
    .map(([roundId, roundEntries]) => {
      const roundInfo = getRound(roundId);
      /* BUG-1 R1: roundTotal ต้องตรงกับหน้ารวม — exclude cancelled tickets */
      const roundTotal = sum(
        roundEntries
          .filter((entry) => {
            const t = getTicket(entry.ticket_id);
            return !t || t.status !== "cancelled";
          })
          .map((entry) => entry.amount),
      );
      const byTicket = groupBy(roundEntries, (entry) => entry.ticket_id || "__unticketed__");
      const ticketRows = [...byTicket.entries()]
        .map(([ticketId, tEntries]) => {
          const ticket = ticketId !== "__unticketed__" ? getTicket(ticketId) : null;
          const ticketCode = ticket?.code || "(ไม่มีบิล)";
          const customerLabel = getCustomerDisplayLabel(tEntries[0].customer_id);
          const headHouseId = ticket?.head_house_id || getCustomer(tEntries[0].customer_id)?.head_house_id;
          const headHouseRow = headHouseId
            ? (state.headHouses.find((h) => h.id === headHouseId)?.name || "-")
            : "-";
          const ticketTotal = sum(tEntries.map((entry) => entry.amount));
          const statusKey = ticket?.status || "pending_review";
          const locked = ticket && ticket.status !== "pending_review";
          const expanded = state.expandedTickets.has(ticketId);
          const detailRow = expanded
            ? `
              <tr class="entry-detail-row">
                <td colspan="7" class="entry-detail-cell">
                  <table class="entry-detail-table">
                    <thead>
                      <tr>
                        <th>ประเภท</th>
                        <th>เลข</th>
                        <th class="amount">ยอด</th>
                        <th>บันทึก</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      ${tEntries
                        .map(
                          (entry) => `
                            <tr>
                              <td>${escapeHtml(getBetTypeName(entry.bet_type_id))}</td>
                              <td><span class="number-pill">${escapeHtml(entry.number)}</span></td>
                              <td class="amount">${money(entry.amount)}</td>
                              <td>${escapeHtml(entry.note || "-")}</td>
                              <td>
                                <div class="row-actions">
                                  <button class="icon-button edit-entry-button" type="button" data-entry-id="${escapeHtml(entry.id)}" ${locked ? "disabled" : ""}>แก้ไข</button>
                                  <button class="icon-button delete-entry-button" type="button" data-entry-id="${escapeHtml(entry.id)}" ${locked ? "disabled" : ""}>ลบ</button>
                                </div>
                              </td>
                            </tr>
                          `,
                        )
                        .join("")}
                    </tbody>
                  </table>
                </td>
              </tr>
            `
            : "";
          return `
            <tr class="ticket-summary-row${expanded ? " expanded" : ""}">
              <td class="ticket-expand-cell">
                <button type="button" class="ticket-expand-button" data-ticket-id="${escapeHtml(ticketId)}" aria-label="ดูเลขในโพย" aria-expanded="${expanded ? "true" : "false"}">${expanded ? "▼" : "▶"}</button>
              </td>
              <td class="td-code" title="${escapeHtml(ticketCode)}"><strong>${escapeHtml(ticketCode)}</strong></td>
              <td class="td-cust" title="${escapeHtml(customerLabel)}">${escapeHtml(customerLabel)}</td>
              <td class="td-head" title="${escapeHtml(headHouseRow)}">${escapeHtml(headHouseRow)}</td>
              <td class="td-count">${tEntries.length} เลข</td>
              <td class="td-amount"><strong${statusKey === "cancelled" ? ' style="opacity:0.4; text-decoration:line-through;"' : ""}>${money(ticketTotal)}</strong></td>
              <td class="td-status"><span class="status-pill ${ticketStatusClass(statusKey)}">${escapeHtml(ticketStatusLabel(statusKey))}</span></td>
            </tr>
            ${detailRow}
          `;
        })
        .join("");
      return `
        <section class="entry-group">
          <div class="entry-group-heading">
            <h3>${escapeHtml(getLotteryName(roundInfo?.lottery_id))} · ${escapeHtml(roundInfo?.label || "-")}</h3>
            <strong>${money(roundTotal)}</strong>
          </div>
          <div class="table-wrap dense-table">
            <table class="ticket-entries-table">
              <colgroup>
                <col class="col-expand">
                <col class="col-code">
                <col class="col-cust">
                <col class="col-head">
                <col class="col-count">
                <col class="col-amount">
                <col class="col-status">
              </colgroup>
              <thead>
                <tr>
                  <th></th>
                  <th>บิล/โพย</th>
                  <th>ลูกค้า</th>
                  <th>หัวบ้าน</th>
                  <th class="th-count">จำนวนเลข</th>
                  <th class="th-amount">ยอดรวม</th>
                  <th class="th-status">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                ${ticketRows}
              </tbody>
            </table>
          </div>
        </section>
      `;
    })
    .join("");

  elements.entryGroups.querySelectorAll(".ticket-expand-button").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.ticketId;
      if (state.expandedTickets.has(id)) state.expandedTickets.delete(id);
      else state.expandedTickets.add(id);
      renderEntries();
    });
  });
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
  /* BUG-8 R2: switch to classic mode so pre-filled fields are visible */
  if (typeof activateIntakeMode === "function") {
    activateIntakeMode("classic");
  }
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
      type: (elements.headHouseType && elements.headHouseType.value) || "head_house",
    parentHeadHouseId: elements.headHouseParent?.value || null,
      tier2Percent: Number(elements.headHouseTier2?.value || 0),
      lineUserId: document.querySelector("#headHouseLineUserIdInput")?.value.trim() || null,
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
      const affiliate = state.users.find((user) => user.role === "affiliate" && user.head_house_id === headHouse.id);
      const amount = sum(
        state.entries
          .filter((entry) => getCustomer(entry.customer_id)?.head_house_id === headHouse.id)
          .map((entry) => entry.amount),
      );
      return `
        <article class="customer-item">
          <div>
            <strong>${escapeHtml(headHouse.code)} · ${escapeHtml(headHouse.name)}</strong> <span class="hh-type-badge hh-type-${escapeHtml(headHouse.type || "head_house")}">${headHouse.type === "affiliate" ? "💻 Affiliate" : "🚶 หัวบ้าน"}</span>
            <span>${escapeHtml(headHouse.note || "ไม่มีหมายเหตุ")}</span>
          </div>
          <div class="head-house-actions">
            <small>${customers.toLocaleString("th-TH")} ลูกค้า · ${money(amount)}</small>
            <small>ส่วนแบ่ง ${percentValue(headHouse.commission_percent)}</small>
            ${
              viewer
                ? `<small>บัญชีหัวบ้าน: ${escapeHtml(viewer.username)}</small>`
                : `<button class="button button-secondary create-viewer-button" type="button" data-head-house-id="${escapeHtml(headHouse.id)}">สร้างบัญชีหัวบ้าน</button>`
            }
            <div class="mini-actions">
              <button class="button button-secondary hh-detail-button" type="button" data-head-house-id="${escapeHtml(headHouse.id)}">📋 ดูข้อมูล</button>
              <button class="button button-secondary view-head-house-button" type="button" data-head-house-id="${escapeHtml(headHouse.id)}">ดูยอด</button>
              <button class="button button-secondary edit-head-house-button" type="button" data-head-house-id="${escapeHtml(headHouse.id)}">แก้ไข</button>
              ${
                viewer
                  ? `<button class="button button-secondary reset-viewer-password-button" type="button" data-head-house-id="${escapeHtml(headHouse.id)}">รีเซ็ตรหัส</button>`
                  : ""
              }
              ${
                headHouse.type === "affiliate"
                  ? (affiliate
                    ? `<button class="button button-secondary view-affiliate-button" type="button" data-head-house-id="${escapeHtml(headHouse.id)}" title="ดู username/password ของ ${escapeHtml(affiliate.username)}">🔑 ดู Account (${escapeHtml(affiliate.username)})</button>
                       <button class="button button-secondary reset-affiliate-button" type="button" data-head-house-id="${escapeHtml(headHouse.id)}" title="รีเซ็ตรหัสผ่าน">🔄 รีเซ็ต</button>`
                    : `<button class="button button-secondary create-affiliate-button" type="button" data-head-house-id="${escapeHtml(headHouse.id)}">➕ สร้าง Affiliate Account</button>`)
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
  elements.headHouseList.querySelectorAll(".create-affiliate-button").forEach((button) => {
    button.addEventListener("click", () => createAffiliateAccount(button.dataset.headHouseId));
  });
  elements.headHouseList.querySelectorAll(".view-affiliate-button").forEach((button) => {
    button.addEventListener("click", () => viewAffiliateAccount(button.dataset.headHouseId));
  });
  elements.headHouseList.querySelectorAll(".reset-affiliate-button").forEach((button) => {
    button.addEventListener("click", () => resetAffiliateAccount(button.dataset.headHouseId));
  });
  elements.headHouseList.querySelectorAll(".delete-head-house-button").forEach((button) => {
    button.addEventListener("click", () => deleteHeadHouse(button.dataset.headHouseId));
  });
}

async function provisionHeadHouseViewer(headHouseId) {
  const credentials = await api(`/api/head-houses/${headHouseId}/viewer-account`, { method: "POST" });
  state.lastProvisionedHeadHouseId = headHouseId;
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
    showToast("คัดลอกข้อมูลบัญชีหัวบ้านแล้ว", "success");
  } catch {
    showToast("คัดลอกไม่สำเร็จ ใช้ข้อมูลที่แสดงในกล่องนี้ได้เลย", "warning");
  }
}

async function copyViewerLineMessage() {
  const credentials = state.latestViewerCredentials;
  if (!credentials) return;
  const headHouseName = state.headHouses.find(h => h.id === state.lastProvisionedHeadHouseId)?.name || "หัวบ้าน";
  const text =
    `🎉 ระบบ Affiliate ของคุณพร้อมแล้ว!\n\n` +
    `สวัสดีครับ/ค่ะ ${headHouseName}\n` +
    `แอดมินสร้างบัญชีเข้าระบบให้คุณเรียบร้อยแล้ว ใช้ดูยอดและรับลิงก์ชวนของตัวเองได้เลย\n\n` +
    `🔗 เปิดที่: ${credentials.url}\n` +
    `👤 Username: ${credentials.username}\n` +
    `🔑 Password: ${credentials.password}\n\n` +
    `วิธีใช้:\n` +
    `1. กดลิงก์ด้านบน → ใส่ username + password\n` +
    `2. ระบบจะพาเข้าหน้า "💰 Affiliate ของฉัน" อัตโนมัติ\n` +
    `3. กดปุ่ม "📋 คัดลอกลิงก์" แล้วส่งลิงก์ให้ลูกค้าใน LINE\n` +
    `4. ลูกค้าที่กดลิงก์จะถูกผูกกับคุณอัตโนมัติ\n\n` +
    `รบกวนเปลี่ยนรหัสผ่านหลังเข้าใช้ครั้งแรกนะครับ 🙏`;
  try {
    await navigator.clipboard.writeText(text);
    showToast("คัดลอกข้อความสำหรับ LINE แล้ว — paste ส่งให้หัวบ้านได้เลย", "success");
  } catch {
    showToast("คัดลอกไม่สำเร็จ ใช้ข้อมูลที่แสดงในกล่องนี้แทน", "warning");
  }
}


function beginHeadHouseEdit(id) {
  /* FEAT: open form dialog when editing */
  if (typeof window.openHeadHouseForm === "function") window.openHeadHouseForm();
  /* FEAT phase2: populate LINE user ID field */
  const _hh = state.headHouses.find((h) => h.id === id);
  const _lineInput = document.querySelector("#headHouseLineUserIdInput");
  if (_lineInput) _lineInput.value = _hh?.line_user_id || "";
  const headHouse = state.headHouses.find((item) => item.id === id);
  if (!headHouse) return;
  state.editingHeadHouseId = headHouse.id;
  elements.headHouseName.value = headHouse.name;
  elements.headHouseNote.value = headHouse.note;
  elements.headHouseCommission.value = headHouse.commission_percent;
  if (elements.headHouseParent) {
    // Populate options with all head_houses except self
    elements.headHouseParent.innerHTML = '<option value="">— ไม่มี —</option>' +
      state.headHouses.filter(function(h) { return h.id !== headHouse.id; })
        .map(function(h) { return '<option value="' + h.id + '">' + h.code + ' · ' + (h.name || "") + '</option>'; })
        .join("");
    elements.headHouseParent.value = headHouse.parent_head_house_id || "";
  }
  if (elements.headHouseTier2) elements.headHouseTier2.value = headHouse.tier2_percent || 0;
  if (elements.headHouseType) elements.headHouseType.value = headHouse.type || "head_house";
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
  if (!(await confirmDialog({ title: "รีเซ็ตรหัสผ่าน", body: "ระบบจะสุ่มรหัสผ่านใหม่ให้บัญชีหัวบ้านของหัวบ้านนี้ และล็อกเอาท์ทุก session ปัจจุบัน", danger: true }))) return;
  const credentials = await api(`/api/head-houses/${id}/viewer-account/reset-password`, { method: "POST" });
  state.lastProvisionedHeadHouseId = id;
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
            <span>${escapeHtml(customer.name || "ยังไม่มีชื่อ")} · ${escapeHtml(customer.head_house_code || "-")}${customer.phone ? ' · ' + escapeHtml(customer.phone) : ''}</span>
          </div>
          <div class="head-house-actions">
            <small>${count.toLocaleString("th-TH")} รายการ</small>
            ${
              customer.id !== "walkin"
                ? `
                  <div class="mini-actions">
                    <button class="button button-secondary view-customer-button" type="button" data-customer-id="${escapeHtml(customer.id)}">👁️ ดูรายละเอียด</button>
                    <span class="admin-only-wrap admin-only">
                      <button class="button button-secondary edit-customer-button" type="button" data-customer-id="${escapeHtml(customer.id)}">แก้ไข</button>
                      <button class="button button-danger delete-customer-button" type="button" data-customer-id="${escapeHtml(customer.id)}">ลบ</button>
                    </span>
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
  elements.customerList.querySelectorAll(".view-customer-button").forEach((button) => {
    button.addEventListener("click", () => window.openCustomerDetail && window.openCustomerDetail(button.dataset.customerId));
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
  /* FEAT: open schedule form dialog when editing */
  if (typeof window.openScheduleForm === "function") window.openScheduleForm();
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
  showToast(`สร้างงวดอัตโนมัติเพิ่ม ${summary.created.toLocaleString("th-TH-u-ca-buddhist")} งวด ถึงวันที่ ${longDate(summary.toDate)}`, "success");
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
  /* FILTER + LIMIT */
  const lottFilter = (document.querySelector("#roundsFilterLottery") || {}).value || "";
  const statFilter = (document.querySelector("#roundsFilterStatus") || {}).value || "";
  if (!state.roundsPage) state.roundsPage = 1;
  const PAGE_SIZE = 50;
  /* populate lottery filter once */
  const lottSel = document.querySelector("#roundsFilterLottery");
  if (lottSel && lottSel.options.length <= 1) {
    state.lotteries.forEach((l) => {
      const o = document.createElement("option");
      o.value = l.id; o.textContent = l.name;
      lottSel.appendChild(o);
    });
    lottSel.addEventListener("change", () => { state.roundsPage = 1; renderRounds(); });
    const statS = document.querySelector("#roundsFilterStatus");
    if (statS) statS.addEventListener("change", () => { state.roundsPage = 1; renderRounds(); });
  }
  /* sort newest first */
  const filteredRounds = state.rounds
    .filter((r) => (!lottFilter || r.lottery_id === lottFilter) && (!statFilter || r.status === statFilter))
    .slice()
    .sort((a, b) => new Date(`${b.draw_date}T${b.draw_time || "00:00"}:00`) - new Date(`${a.draw_date}T${a.draw_time || "00:00"}:00`));
  const totalPages = Math.max(1, Math.ceil(filteredRounds.length / PAGE_SIZE));
  if (state.roundsPage > totalPages) state.roundsPage = totalPages;
  const start = (state.roundsPage - 1) * PAGE_SIZE;
  const pageRounds = filteredRounds.slice(start, start + PAGE_SIZE);
  /* update or insert pagination info */
  let footer = document.querySelector("#roundsPagination");
  if (!footer) {
    footer = document.createElement("div");
    footer.id = "roundsPagination";
    footer.style.cssText = "padding:12px;display:flex;gap:10px;align-items:center;justify-content:flex-end;font-size:0.88em;";
    elements.roundsBody.closest(".rounds-table-panel")?.appendChild(footer);
  }
  footer.innerHTML = `
    <span>แสดง ${start + 1}-${Math.min(start + PAGE_SIZE, filteredRounds.length).toLocaleString("th-TH")} จาก ${filteredRounds.length.toLocaleString("th-TH")} งวด</span>
    <button type="button" class="icon-button" ${state.roundsPage <= 1 ? "disabled" : ""} data-action="prev">‹ ก่อนหน้า</button>
    <span>หน้า ${state.roundsPage} / ${totalPages}</span>
    <button type="button" class="icon-button" ${state.roundsPage >= totalPages ? "disabled" : ""} data-action="next">ถัดไป ›</button>
  `;
  footer.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.action === "prev") state.roundsPage--;
    else state.roundsPage++;
    renderRounds();
  }));
  pageRounds.forEach((round) => {
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
  /* FEAT: open form dialog when editing round */
  if (typeof window.openRoundForm === "function") window.openRoundForm();
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

  /* BUG-005: remember last selection so user can add multiple limits in same bet type */
  const lastBetType = elements.limitBetType.value;
  const lastRound = elements.limitRound.value;
  const wasEditing = !!state.editingLimitId;

  /* NEW-BUG-002: wrap try/catch + แปล error code เป็น toast ภาษาไทย */
  try {
    if (state.editingLimitId) {
      await api(`/api/limits/${state.editingLimitId}`, { method: "PUT", body: payload });
    } else {
      await api("/api/limits", { method: "POST", body: payload });
    }
  } catch (err) {
    const code = err?.payload?.error || err?.message || "";
    const msg = {
      limit_exists: "❌ เลขนี้มีอั้นไว้แล้วในงวด/ประเภทนี้ — กดปุ่ม 'แก้ไข' ที่ตารางถ้าต้องการเปลี่ยน",
      invalid_limit_payload: "❌ ข้อมูลไม่ครบ — กรอกงวด ประเภท เลข และยอดให้ครบ",
      invalid_number: "❌ เลขไม่ถูกต้อง — ความยาวต้องตรงกับประเภทที่เลือก",
      forbidden: "❌ ไม่มีสิทธิ์ตั้งอั้นเลข",
      round_not_found: "❌ ไม่พบงวด — รีเฟรชแล้วลองใหม่",
    }[code] || `❌ บันทึกอั้นเลขไม่สำเร็จ${code ? " (" + code + ")" : ""}`;
    if (window.showToast) window.showToast(msg, "danger");
    return;
  }

  resetLimitForm();
  await refreshState();
  /* BUG-005: restore bet type + round after refresh so add-next-limit is one click */
  if (!wasEditing) {
    if (lastBetType) elements.limitBetType.value = lastBetType;
    if (lastRound) elements.limitRound.value = lastRound;
    /* NEW-BUG-001: re-sync number input maxLen/placeholder to current bet type */
    if (typeof syncNumberLength === "function" && elements.limitNumber) {
      syncNumberLength(elements.limitNumber, elements.limitBetType.value);
    }
  }
  if (window.showToast) {
    window.showToast(wasEditing ? "✓ แก้ไขอั้นเลขแล้ว" : "✓ บันทึกอั้นเลขแล้ว", "success");
  }
}

function resetLimitForm() {
  state.editingLimitId = null;
  elements.limitForm.reset();
  elements.limitFormTitle.textContent = "ตั้งค่าอั้นเลข";
  elements.limitSubmitBtn.textContent = "บันทึกอั้นเลข";
  renderSelects();
}

function renderLimits() {
  /* NEW-BUG-001: re-sync maxLen/placeholder ของ limitNumber ทุกครั้งที่ render
     เพื่อแก้กรณี SPA re-navigation ที่ change event ไม่ fire */
  if (typeof syncNumberLength === "function" && elements.limitNumber && elements.limitBetType) {
    try { syncNumberLength(elements.limitNumber, elements.limitBetType.value); } catch (e) {}
  }
  const allStatuses = getLimitStatuses();
  // Populate filter dropdowns once (lazily)
  if (!window.__limitsFilterInit) {
    const lotSel = document.querySelector("#limitsFilterLottery");
    const rndSel = document.querySelector("#limitsFilterRound");
    const btSel = document.querySelector("#limitsFilterBetType");
    if (lotSel) {
      lotSel.innerHTML = '<option value="">— ทั้งหมด —</option>' +
        (state.lotteries || []).map(l => `<option value="${escapeHtml(l.id)}">${escapeHtml(l.name)}</option>`).join("");
      lotSel.addEventListener("change", renderLimits);
    }
    if (rndSel) {
      const rounds = (state.rounds || []).slice().sort((a, b) => (b.draw_date || "").localeCompare(a.draw_date || ""));
      rndSel.innerHTML = '<option value="">— ทั้งหมด —</option>' +
        rounds.map(r => {
          const lotName = (state.lotteries || []).find(l => l.id === r.lottery_id)?.name || "?";
          return `<option value="${escapeHtml(r.id)}">${escapeHtml(lotName + " · " + (r.label || r.draw_date))}</option>`;
        }).join("");
      if (typeof makeSelectSearchable === "function") makeSelectSearchable(rndSel, "🔍 ค้นหางวด...");
      rndSel.addEventListener("change", renderLimits);
    }
    if (btSel) {
      btSel.innerHTML = '<option value="">— ทั้งหมด —</option>' +
        (state.betTypes || []).map(b => `<option value="${escapeHtml(b.id)}">${escapeHtml(b.name)}</option>`).join("");
      btSel.addEventListener("change", renderLimits);
    }
    const clrBtn = document.querySelector("#limitsClearFilterBtn");
    if (clrBtn) clrBtn.addEventListener("click", () => {
      if (lotSel) lotSel.value = "";
      if (rndSel) { rndSel.value = ""; rndSel.dispatchEvent(new Event("change")); }
      if (btSel) btSel.value = "";
      renderLimits();
    });
    const bulkBtn = document.querySelector("#limitsBulkDeleteBtn");
    if (bulkBtn) bulkBtn.addEventListener("click", bulkDeleteLimits);
    window.__limitsFilterInit = true;
  }

  // Read current filters
  const flot = (document.querySelector("#limitsFilterLottery")?.value) || "";
  const frnd = (document.querySelector("#limitsFilterRound")?.value) || "";
  const fbt = (document.querySelector("#limitsFilterBetType")?.value) || "";

  // Apply filters
  const statuses = allStatuses.filter(item => {
    const round = getRound(item.limit.round_id);
    if (flot && round?.lottery_id !== flot) return false;
    if (frnd && item.limit.round_id !== frnd) return false;
    if (fbt && item.limit.bet_type_id !== fbt) return false;
    return true;
  });

  // Cap rendering for performance — show first 500 only
  const CAP = 500;
  const truncated = statuses.length > CAP ? statuses.slice(0, CAP) : statuses;

  const countEl = document.querySelector("#limitsTableCount");
  if (countEl) {
    const total = allStatuses.length;
    const filtered = statuses.length;
    if (flot || frnd || fbt) {
      countEl.textContent = ` · กรอง ${filtered.toLocaleString("th-TH")} จาก ${total.toLocaleString("th-TH")} รายการ` + (filtered > CAP ? ` (แสดง ${CAP} แถวแรก)` : "");
    } else {
      countEl.textContent = ` · ทั้งหมด ${total.toLocaleString("th-TH")} รายการ` + (total > CAP ? ` (แสดง ${CAP} แถวแรก — ใช้ตัวกรองเพื่อหาเฉพาะที่ต้องการ)` : "");
    }
  }

  elements.limitsBody.innerHTML = "";
  elements.limitsEmptyState.classList.toggle("hidden", statuses.length > 0);

  truncated.forEach((item) => {
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

async function bulkDeleteLimits() {
  const flot = (document.querySelector("#limitsFilterLottery")?.value) || "";
  const frnd = (document.querySelector("#limitsFilterRound")?.value) || "";
  const fbt = (document.querySelector("#limitsFilterBetType")?.value) || "";
  if (!flot && !frnd && !fbt) {
    alert("เลือกตัวกรองอย่างน้อย 1 อย่าง (หวย / งวด / ประเภท) ก่อนลบ");
    return;
  }
  const desc = [];
  if (flot) desc.push("หวย: " + ((state.lotteries||[]).find(l => l.id === flot)?.name || flot));
  if (frnd) {
    const r = (state.rounds||[]).find(x => x.id === frnd);
    desc.push("งวด: " + (r?.label || r?.draw_date || frnd));
  }
  if (fbt) desc.push("ประเภท: " + ((state.betTypes||[]).find(b => b.id === fbt)?.name || fbt));
  if (!(await confirmDialog({ title: "ลบเพดานทั้งหมด", body: "ลบเพดานทั้งหมดที่กรองอยู่?\n\n" + desc.join("\n") + "\n\nลบแล้วเอากลับไม่ได้", danger: true }))) return;
  try {
    const r = await api("/api/admin/limits/bulk-delete", {
      method: "POST",
      body: { roundId: frnd || null, lotteryId: flot || null, betTypeId: fbt || null },
    });
    if (window.showToast) window.showToast("ลบ " + r.deleted.toLocaleString("th-TH") + " เพดานแล้ว", "success");
    await refreshState();
  } catch (e) { alert("ไม่สำเร็จ: " + (e.message || "")); }
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

  /* FIX payouts-autosave: debounced auto-save + visual feedback + toast */
  elements.payoutMatrix.querySelectorAll("input").forEach((input) => {
    let saveTimer = null;
    const doSave = async () => {
      const lotteryId = input.dataset.lotteryId;
      const betTypeId = input.dataset.betTypeId;
      const rate = parseAmount(input.value);
      input.classList.add("payout-saving");
      input.classList.remove("payout-saved", "payout-error");
      try {
        await api("/api/payout-rates", {
          method: "POST",
          body: { lotteryId, betTypeId, rate },
        });
        /* optimistic local update */
        const found = state.payoutRates.find((r) => r.lottery_id === lotteryId && r.bet_type_id === betTypeId);
        if (found) found.rate = rate;
        else state.payoutRates.push({ lottery_id: lotteryId, bet_type_id: betTypeId, rate });
        input.classList.remove("payout-saving");
        input.classList.add("payout-saved");
        setTimeout(() => input.classList.remove("payout-saved"), 1500);
        if (window.showToast) {
          const lotteryName = state.lotteries.find((l) => l.id === lotteryId)?.name || lotteryId;
          const betName = state.betTypes.find((b) => b.id === betTypeId)?.name || betTypeId;
          window.showToast(`✓ ${lotteryName} · ${betName} = บาทละ ${rate}`, "success");
        }
      } catch (err) {
        input.classList.remove("payout-saving");
        input.classList.add("payout-error");
        const code = err?.payload?.error || err?.message || "";
        if (window.showToast) window.showToast(`❌ บันทึกไม่สำเร็จ ${code}`, "danger");
      }
    };
    /* debounced save บน input event (พิมพ์เสร็จ 600ms ก็ save) */
    input.addEventListener("input", () => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(doSave, 600);
    });
    /* blur หรือ Enter → save ทันที (ไม่ต้องรอ debounce) */
    input.addEventListener("blur", () => {
      if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
      doSave();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
        doSave();
        input.blur();
      }
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
        <button id="scrapeResultBtn" class="button button-secondary" type="button" data-round-id="${escapeHtml(roundId)}">
          📡 ดึงเดี๋ยวนี้ (apilotto)
        </button>
        <small class="scrape-hint">ระบบดึงให้อัตโนมัติทุก 60 วินาที — กดปุ่มนี้ถ้าต้องการดึงเดี๋ยวนี้</small>
      </div>
    `;
    elements.resultEditor.insertAdjacentHTML("afterbegin", fetchBtnHtml);
    elements.resultEditor.querySelector("#scrapeResultBtn")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      const rid = btn.dataset.roundId;
      btn.disabled = true;
      const orig = btn.textContent;
      btn.textContent = "⏳ กำลังดึง...";
      try {
        const r = await api(`/api/admin/rounds/${encodeURIComponent(rid)}/apply-apilotto`, { method: "POST" });
        if (r.ok) {
          showToast(`✓ ดึงผลสำเร็จ — ${r.inserted?.length || 0} เลข${r.finalized ? " · ปิดงานแล้ว" : ""}`, "success");
          await refreshState();
        } else {
          showToast(`ดึงไม่สำเร็จ: ${r.error || "ไม่ทราบสาเหตุ"}`, "warning");
          btn.disabled = false;
          btn.textContent = orig;
        }
      } catch (err) {
        showToast("ดึงไม่สำเร็จ — เชื่อมต่อ apilotto ไม่ได้", "danger");
        btn.disabled = false;
        btn.textContent = orig;
      }
    });
  }

  elements.resultEditor.querySelectorAll(".save-result-button").forEach((button) => {
    button.addEventListener("click", async () => {
      /* BUG-003: guard against double-click + skip full refresh (input clears) */
      if (button.dataset.saving === "1") return;
      const row = button.closest(".result-row");
      const input = row.querySelector("input");
      const numbersText = (input.value || "").trim();
      if (!numbersText) {
        showToast("กรอกเลขก่อนบันทึก", "warning");
        return;
      }
      button.dataset.saving = "1";
      const originalLabel = button.textContent;
      button.disabled = true;
      button.textContent = "กำลังบันทึก...";
      try {
        const saved = await api("/api/results", {
          method: "POST",
          body: {
            roundId,
            betTypeId: input.dataset.betTypeId,
            numbers: numbersText,
          },
        });
        /* Patch local state instead of refreshState() so other rows are not cleared */
        if (Array.isArray(saved)) {
          state.results = state.results.filter(
            (r) => !(r.round_id === roundId && r.bet_type_id === input.dataset.betTypeId),
          );
          state.results.push(...saved);
        }
        button.textContent = "✓ บันทึกแล้ว";
        button.classList.add("button-success-flash");
        showToast("บันทึกผลรางวัลแล้ว", "success");
        setTimeout(() => {
          button.disabled = false;
          button.textContent = originalLabel;
          button.dataset.saving = "0";
          button.classList.remove("button-success-flash");
        }, 1500);
      } catch (error) {
        button.disabled = false;
        button.textContent = originalLabel;
        button.dataset.saving = "0";
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


/* POLISH I4: apilotto banner — 3-state (healthy / no-draws / error) */
async function renderApilottoSummaryBanner() {
  const bn = document.querySelector("#apilottoSummaryBanner");
  if (!bn) return;
  /* fetch health */
  let health = null;
  try {
    const r = await fetch("/api/admin/apilotto/health", { credentials: "include" });
    if (r.ok) health = await r.json();
  } catch (e) {}
  /* BUG-D FIX: ใช้ Bangkok local date (apilotto + DB ทำงานบน BKK) */
  const today = (function() {
    const d = new Date();
    const bkk = new Date(d.toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }));
    return bkk.toISOString().slice(0, 10);
  })();
  const count = (state.rounds || []).filter(r =>
    r.draw_date === today && r.result_status === "finalized" && !r.result_finalized_by
  ).length;
  const cnt = document.querySelector("#apsCount");
  if (cnt) cnt.textContent = count.toLocaleString("th-TH");
  /* POLISH I4: render based on state */
  const aps = document.querySelector("#apsCount");
  const apsText = bn.querySelector(".aps-text");
  const apsIcon = bn.querySelector(".aps-icon");
  let mode = "no-draws";
  if (health && health.last_error) mode = "error";
  else if (count > 0) mode = "healthy";
  bn.classList.remove("aps-healthy","aps-empty","aps-error");
  if (mode === "healthy") {
    bn.classList.add("aps-healthy");
    if (apsIcon) apsIcon.textContent = "📡";
    if (apsText) apsText.innerHTML = `<strong>${count.toLocaleString("th-TH")}</strong> รอบที่ apilotto ดึงให้แล้ววันนี้ — ระบบ finalize ให้อัตโนมัติ`;
  } else if (mode === "error") {
    bn.classList.add("aps-error");
    if (apsIcon) apsIcon.textContent = "⚠️";
    const errTs = health.last_error.ts ? new Date(health.last_error.ts).toLocaleTimeString("th-TH") : "-";
    if (apsText) apsText.innerHTML = `<strong>apilotto error</strong> · ${errTs}: ${escapeHtml(health.last_error.msg || "")}`;
  } else {
    bn.classList.add("aps-empty");
    if (apsIcon) apsIcon.textContent = "🕐";
    if (apsText) apsText.innerHTML = "ยังไม่มีหวยออกวันนี้ — รอ apilotto ส่งเลข";
  }
  bn.hidden = false; /* always show */
}

function renderResultsOverview() {
  renderApilottoSummaryBanner();
  /* === FIX resOv filters: populate lottery dropdown, wire filters, update count === */
  const lotterySel = document.querySelector("#resOvFilterLottery");
  const statusSel  = document.querySelector("#resOvFilterStatus");
  const searchInp  = document.querySelector("#resOvSearch");
  const clearBtn   = document.querySelector("#resOvClearBtn");
  const countEl    = document.querySelector("#resOvCount");

  /* Populate lottery dropdown ONCE per state load (preserve current selection) */
  if (lotterySel && lotterySel.dataset.populatedRevs !== String(state.lotteries.length)) {
    const prev = lotterySel.value;
    const opts = ['<option value="">— ทั้งหมด —</option>'].concat(
      state.lotteries.map(l => `<option value="${escapeHtml(l.id)}">${escapeHtml(l.name)}</option>`)
    ).join("");
    lotterySel.innerHTML = opts;
    if (prev && state.lotteries.some(l => l.id === prev)) lotterySel.value = prev;
    lotterySel.dataset.populatedRevs = String(state.lotteries.length);
  }

  /* Wire change/input handlers ONCE */
  if (lotterySel && !lotterySel.dataset.boundResov) {
    lotterySel.dataset.boundResov = "1";
    lotterySel.addEventListener("change", () => { state.__resultsPage = 100; renderResultsOverview(); });
  }
  if (statusSel && !statusSel.dataset.boundResov) {
    statusSel.dataset.boundResov = "1";
    statusSel.addEventListener("change", () => { state.__resultsPage = 100; renderResultsOverview(); });
  }
  if (searchInp && !searchInp.dataset.boundResov) {
    searchInp.dataset.boundResov = "1";
    /* BUG-J FIX: debounce 200ms */
    let __searchDebounce = null;
    searchInp.addEventListener("input", () => {
      if (__searchDebounce) clearTimeout(__searchDebounce);
      __searchDebounce = setTimeout(renderResultsOverview, 200);
    });
  }
  if (clearBtn && !clearBtn.dataset.boundResov) {
    clearBtn.dataset.boundResov = "1";
    clearBtn.addEventListener("click", () => {
      if (lotterySel) lotterySel.value = "";
      if (statusSel) statusSel.value = "";
      if (searchInp) searchInp.value = "";
      renderResultsOverview();
    });
  }

  /* Apply filters */
  const lotteryFilter = lotterySel ? lotterySel.value : "";
  const statusFilter  = statusSel ? statusSel.value : "";
  const searchQ       = (searchInp ? searchInp.value : "").trim().toLowerCase();

  /* BUG-8: future rounds pushed to bottom; past/today sorted recent-first */
  const now = Date.now();
  const filtered = state.rounds.filter((round) => {
    if (lotteryFilter && round.lottery_id !== lotteryFilter) return false;
    if (statusFilter) {
      const isFinalized = round.result_status === "finalized";
      if (statusFilter === "finalized" && !isFinalized) return false;
      if (statusFilter === "draft" && isFinalized) return false;
    }
    if (searchQ) {
      const hay = (
        (getLotteryName(round.lottery_id) || "") + " " +
        (round.label || "") + " " +
        (round.draw_date || "") + " " +
        (resultNumbers(round.id, "three_top") || "") + " " +
        (resultNumbers(round.id, "two_top") || "") + " " +
        (resultNumbers(round.id, "two_bottom") || "")
      ).toLowerCase();
      if (!hay.includes(searchQ)) return false;
    }
    return true;
  });

  const rows = filtered
    .slice()
    .sort((a, b) => {
      const ta = new Date(`${a.draw_date}T${a.draw_time}:00`).getTime();
      const tb = new Date(`${b.draw_date}T${b.draw_time}:00`).getTime();
      const aFuture = ta > now;
      const bFuture = tb > now;
      if (aFuture && !bFuture) return 1;
      if (!aFuture && bFuture) return -1;
      return tb - ta;
    })
    .map((round) => {
      /* APILOTTO source badge — auto-detect: finalized โดย NULL user = apilotto auto */
      const isAuto = round.result_status === "finalized" && !round.result_finalized_by;
      const sourceBadge = isAuto
        ? '<span class="source-badge source-auto">🤖 apilotto</span>'
        : (round.result_status === "finalized"
            ? '<span class="source-badge source-manual">✋ คีย์เอง</span>'
            : '<span class="source-badge source-pending">— รอผล</span>');
      return `
        <tr data-round-id="${escapeHtml(round.id)}">
          <td>${escapeHtml(getLotteryName(round.lottery_id))}</td>
          <td>${escapeHtml(round.label)}</td>
          <td>${longDate(round.draw_date)}</td>
          <td>${escapeHtml(resultNumbers(round.id, "three_top") || "-")}</td>
          <td>${escapeHtml(resultNumbers(round.id, "three_tod") || "-")}</td>
          <td>${escapeHtml(resultNumbers(round.id, "two_top") || "-")}</td>
          <td>${escapeHtml(resultNumbers(round.id, "two_bottom") || "-")}</td>
          <td><span class="status-pill ${resultStatusClass(round)}">${resultStatusLabel(round)}</span></td>
          <td>${sourceBadge}</td>
        </tr>
      `;
    })
    .join("");

  /* POLISH I5: pagination — show 100 rows + load more button */
  const PAGE = state.__resultsPage || 100;
  const allRows = rows || "";
  const lines = allRows.split("</tr>").filter(s => s.trim());
  const total = lines.length;
  const slice = lines.slice(0, PAGE).join("</tr>") + (lines.slice(0, PAGE).length ? "</tr>" : "");
  const more = total > PAGE
    ? `<tr><td colspan="9" style="text-align:center;padding:12px;"><button type="button" class="button button-secondary" id="resOvLoadMoreBtn">โหลดเพิ่ม (เหลืออีก ${total - PAGE} รายการ)</button></td></tr>`
    : "";
  elements.resultsOverviewBody.innerHTML = slice + more || '<tr><td colspan="9">ไม่มีรายการที่ตรงกับตัวกรอง</td></tr>';
  const lm = document.querySelector("#resOvLoadMoreBtn");
  if (lm) lm.addEventListener("click", () => {
    state.__resultsPage = PAGE + 100;
    renderResultsOverview();
  });

  /* Update count badge */
  if (countEl) {
    const total = state.rounds.length;
    const showing = filtered.length;
    countEl.textContent = showing === total
      ? `(${showing.toLocaleString("th-TH")} งวด)`
      : `(แสดง ${showing.toLocaleString("th-TH")} / ${total.toLocaleString("th-TH")} งวด)`;
  }
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
  /* FIX 2026-05-25: pick "next round to receive result" — งวดถัดไปที่ใกล้ now ที่สุด
     Logic:
       1. filter: lotteryId match + not finalized
       2. prefer upcoming/today (draw >= now) sorted ascending (soonest first)
       3. fallback: if no upcoming, pick most-recent past not-yet-finalized
                   (covers "งวดเพิ่งออก รอกรอกผล")
  */
  const now = Date.now();
  const candidates = state.rounds.filter(
    (round) => round.lottery_id === lotteryId && round.result_status !== "finalized"
  );
  const tsOf = (r) => new Date(`${r.draw_date}T${r.result_time || r.draw_time}:00`).getTime();
  const upcoming = candidates.filter((r) => tsOf(r) >= now - 86400000)  /* allow today (24h slack) */
    .sort((a, b) => {
      const diff = tsOf(a) - tsOf(b);
      if (diff !== 0) return diff;
      /* same instant — prefer auto_generated + real draw_time (not legacy 00:00) */
      const aScore = (a.auto_generated ? 2 : 0) + (a.draw_time && a.draw_time !== "00:00" ? 1 : 0);
      const bScore = (b.auto_generated ? 2 : 0) + (b.draw_time && b.draw_time !== "00:00" ? 1 : 0);
      return bScore - aScore;
    });
  if (upcoming.length) return upcoming[0];
  /* fallback — latest past round still not finalized (e.g. ค้างรอกรอกผล) */
  const past = candidates.slice().sort((a, b) => tsOf(b) - tsOf(a));
  return past[0];
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
        <tr class="review-summary-row" data-ticket-id="${escapeHtml(ticket.id)}">
          <td class="review-check-cell">
            <input type="checkbox" class="ticket-checkbox" data-ticket-id="${escapeHtml(ticket.id)}" aria-label="เลือกบิล">
          </td>
          <td class="review-expand-cell">
            <button type="button" class="review-expand-btn toggle-ticket-details-button" data-ticket-id="${escapeHtml(ticket.id)}" title="ดูเลขในบิล" aria-label="ดูเลขในบิล">▶</button>
          </td>
          <td><strong>${escapeHtml(ticket.code)}</strong></td>
          <td class="review-cust-cell">
            <div class="review-cust-line1">${escapeHtml(formatTicketCustomer(ticket))}</div>
            <small class="review-cust-line2">หัวบ้าน: ${escapeHtml(ticket.head_house_code || "-")} ${escapeHtml(ticket.head_house_name ? "· " + ticket.head_house_name : "")}</small>
          </td>
          <td>${escapeHtml(ticket.lottery_name)} · ${escapeHtml(ticket.round_label)}</td>
          <td class="num">${ticket.entry_count.toLocaleString("th-TH")}</td>
          <td class="amount"><strong>${money(ticket.total_amount)}</strong></td>
          <td>${escapeHtml(ticket.created_by_username || "-")}</td>
          <td><small>${escapeHtml(formatDateTime(ticket.created_at))}</small></td>
          <td class="review-actions-cell">
            <div class="review-actions-compact">
              <button class="btn-icon btn-icon-approve approve-ticket-button" type="button" data-ticket-id="${escapeHtml(ticket.id)}" title="อนุมัติบิล">✓ อนุมัติ</button>
              <button class="btn-icon btn-icon-reject reject-ticket-button" type="button" data-ticket-id="${escapeHtml(ticket.id)}" title="ตีกลับให้แก้ — ส่งให้ลูกค้าแก้เลข/ยอด ก่อนยืนยันใหม่">↺ ตีกลับ</button>
              <button class="btn-icon btn-icon-cancel cancel-ticket-button" type="button" data-ticket-id="${escapeHtml(ticket.id)}" title="ยกเลิกบิลถาวร — กรณีลูกค้าเปลี่ยนใจ/พิมพ์ผิด">✕ ยกเลิก</button>
            </div>
          </td>
        </tr>
        <tr id="ticket-detail-${escapeHtml(ticket.id)}" class="ticket-detail-row hidden">
          <td colspan="8">
            <div class="ticket-detail-card-v2">
              <div class="tdc-block tdc-entries">
                <strong>📋 รายการเลขในโพย</strong>
                <table class="tdc-mini-table">
                  <thead><tr><th>ประเภท</th><th>เลข</th><th class="num">ยอด</th></tr></thead>
                  <tbody>
                    ${ticketEntries.map((entry) => `
                      <tr>
                        <td><span class="tdc-bet-pill">${escapeHtml(getBetTypeName(entry.bet_type_id))}</span></td>
                        <td class="tdc-num"><strong>${escapeHtml(entry.number)}</strong></td>
                        <td class="num">${escapeHtml(money(entry.amount))}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                  <tfoot><tr><td colspan="2" class="num"><strong>รวม</strong></td><td class="num tdc-total">${escapeHtml(money(ticketEntries.reduce((s, e) => s + Number(e.amount), 0)))}</td></tr></tfoot>
                </table>
              </div>
              <div class="tdc-block tdc-side">
                <div class="tdc-mini tdc-customer-card">
                  <strong>👤 ลูกค้า</strong>
                  <div class="tdc-customer-row">
                    ${ticket.customer_line_picture_url ? `<img src="${escapeHtml(ticket.customer_line_picture_url)}" class="tdc-avatar" alt="profile">` : ""}
                    <div class="tdc-customer-info">
                      ${ticket.customer_line_display_name ? `<span class="tdc-line-name">📱 ${escapeHtml(ticket.customer_line_display_name)}</span>` : ""}
                      <span>${escapeHtml(ticket.customer_name || "-")}</span>
                      <small>${escapeHtml(ticket.customer_code || "")}</small>
                    </div>
                  </div>
                </div>
                <div class="tdc-mini">
                  <strong>📡 ต้นทาง</strong>
                  <span class="tdc-source-pill ${ticket.source_channel === "line_self" ? "tdc-line" : ""}">${ticket.source_channel === "line_self" ? "📱 ลูกค้าส่งผ่าน LINE" : escapeHtml(ticket.source_channel || "manual")}</span>
                  ${ticket.source_text ? `<small>${escapeHtml(ticket.source_text)}</small>` : ""}
                </div>
                ${ticket.note ? `<div class="tdc-mini"><strong>📝 หมายเหตุ</strong><span>${escapeHtml(ticket.note)}</span></div>` : ""}
              </div>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  elements.pendingTicketsBody.querySelectorAll(".toggle-ticket-details-button").forEach((button) => {
    button.addEventListener("click", () => {
      const detail = document.querySelector(`#ticket-detail-${CSS.escape(button.dataset.ticketId)}`);
      if (!detail) return;
      const wasHidden = detail.classList.contains("hidden");
      detail.classList.toggle("hidden");
      button.textContent = wasHidden ? "▼" : "▶";
      button.closest("tr")?.classList.toggle("expanded", wasHidden);
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
      showToast("หัวบ้านนี้มีบัญชีหัวบ้านอยู่แล้ว", "warning");
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
  const role = state.user?.role;
  const canManageUsers = role === "admin";
  const isHeadHouseViewer = role === "head_house_viewer";
  const isAffiliate = role === "affiliate";
  const isAdminOnly = !canManageUsers;  // hide from non-admin

  elements.reviewNavButtons.forEach((button) => button.classList.toggle("hidden", isAdminOnly));
  elements.reviewView.hidden = isAdminOnly;
  elements.usersNavButtons.forEach((button) => button.classList.toggle("hidden", isAdminOnly));
  elements.usersView.hidden = isAdminOnly;
  elements.sidebarProfileBtn.classList.toggle("hidden", isAdminOnly);
  elements.headHousesNavButtons.forEach((button) => button.classList.toggle("hidden", isAdminOnly));
  elements.headHousesView.hidden = isAdminOnly;
  elements.headHouseReportPickerWrap.classList.toggle("hidden", isHeadHouseViewer || isAffiliate);
  elements.exportBtn.classList.toggle("hidden", isHeadHouseViewer || isAffiliate);
  elements.staffOnlyNavButtons.forEach((button) => button.classList.toggle("hidden", isHeadHouseViewer || isAffiliate));

  /* P2: body class for CSS-driven admin-only hiding */
  document.body.classList.toggle("role-affiliate", isAffiliate);
  document.body.classList.toggle("role-head-house-viewer", isHeadHouseViewer);
  document.body.classList.toggle("role-admin", role === "admin");
  document.body.classList.toggle("role-operator", role === "operator");

  /* P2: affiliate-specific nav reveal + hide admin-only top nav items */
  document.querySelectorAll(".nav-button.affiliate-only").forEach((btn) => {
    btn.classList.toggle("hidden", !isAffiliate);
  });
  if (isAffiliate) {
    /* Affiliate nav allow-list — keep ONLY these on top-nav */
    const affAllow = new Set(["overview", "markets", "entries", "results", "customers", "rulesAff"]);
    document.querySelectorAll('.nav-button[data-view-target]').forEach((btn) => {
      const t = btn.dataset.viewTarget;
      btn.classList.toggle("hidden", !affAllow.has(t));
    });
    /* Relabel overview button → myAffiliate hub */
    const ovBtn = document.querySelector('.nav-button[data-view-target="overview"]');
    if (ovBtn && !ovBtn.dataset.affRebound) {
      ovBtn.dataset.viewTarget = "myAffiliate";
      ovBtn.textContent = "🏠 หน้ารวม";
      ovBtn.dataset.affRebound = "1";
    }
  }
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
  /* BUG-5: visible feedback during export */
  const btn = elements.exportBtn;
  const origText = btn ? btn.textContent : "";
  try {
    if (btn) { btn.disabled = true; btn.textContent = "⏳ กำลังส่งออก..."; }
    const payload = await api("/api/export");
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `lottery-manager-${today()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    if (window.showToast) window.showToast(`✓ ส่งออกแล้ว — lottery-manager-${today()}.json`, "success");
  } catch (err) {
    if (window.showToast) window.showToast("ส่งออกไม่สำเร็จ: " + (err.message || ""), "warning");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = origText; }
  }
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
  if (!select) return;
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

function getPayoutRate(lotteryId, betTypeId, headHouseIdParam) {
  /* RATE-OVERRIDE-FE-V1: resolve hh จาก param หรือ ticketHeadHouse element ที่เลือก */
  let hhId = headHouseIdParam;
  if (!hhId && typeof elements === "object" && elements.ticketHeadHouse) {
    hhId = elements.ticketHeadHouse.value || null;
  }
  if (hhId && hhId !== "direct" && hhId !== "line_self") {
    const ovMap = state.payoutOverrides && state.payoutOverrides[hhId];
    if (ovMap) {
      const key = lotteryId + "|" + betTypeId;
      if (ovMap[key] != null) return ovMap[key];
    }
  }
  return state.payoutRates.find((rate) => rate.lottery_id === lotteryId && rate.bet_type_id === betTypeId)?.rate || 0;
}

/* RATE-OVERRIDE-FE-V1: เช็คว่าเรทปัจจุบันเป็น override หรือ default */
function isPayoutRateOverridden(lotteryId, betTypeId, headHouseIdParam) {
  let hhId = headHouseIdParam;
  if (!hhId && typeof elements === "object" && elements.ticketHeadHouse) {
    hhId = elements.ticketHeadHouse.value || null;
  }
  if (!hhId || hhId === "direct" || hhId === "line_self") return false;
  const ovMap = state.payoutOverrides && state.payoutOverrides[hhId];
  if (!ovMap) return false;
  return ovMap[lotteryId + "|" + betTypeId] != null;
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

function getCustomerDisplayLabel(id) {
  const c = state.customers.find((customer) => customer.id === id);
  if (!c) return "-";
  const label = c.line_display_name || c.name || "";
  return label ? (c.code + " · " + label) : c.code;
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
  /* FIX flag-mapping: map by NAME (id ใหม่เป็น lott_xxx) */
  const lott = (state.lotteries || []).find(l => l.id === id);
  const n = lott?.name || "";
  /* Thai */
  if (id === "thai" || id === "omsin" || id === "baac" || n.includes("ไทย")) return "flag-th";
  /* Vietnam / Hanoi / Danang */
  if (n.includes("ฮานอย") || n.includes("เวียดนาม") || n.includes("ดานัง") || n.startsWith("นอย")) return "flag-vn";
  /* Laos */
  if (n.includes("ลาว")) return "flag-la";
  /* Malaysia */
  if (n.includes("มาเลเซีย")) return "flag-my";
  /* Indonesia */
  if (n.includes("อินโด")) return "flag-id";
  /* Japan (นิเคอิ) */
  if (n.includes("นิเคอิ") || n.includes("ญี่ปุ่น")) return "flag-jp";
  /* China (จีน) */
  if (n.includes("จีน")) return "flag-cn";
  /* Hong Kong (ฮั่งเส็ง) */
  if (n.includes("ฮั่งเส็ง")) return "flag-hk";
  /* Korea */
  if (n.includes("เกาหลี")) return "flag-kr";
  /* Taiwan */
  if (n.includes("ไต้หวัน")) return "flag-tw";
  /* Singapore */
  if (n.includes("สิงคโปร์")) return "flag-sg";
  /* India */
  if (n.includes("อินเดีย")) return "flag-in";
  /* UK */
  if (n.includes("อังกฤษ")) return "flag-gb";
  /* Germany */
  if (n.includes("เยอรมัน")) return "flag-de";
  /* USA (ดาวโจนส์) */
  if (n.includes("ดาวโจนส์")) return "flag-us";
  /* Russia */
  if (n.includes("รัสเซีย")) return "flag-ru";
  /* Egypt */
  if (n.includes("อียิปต์")) return "flag-eg";
  /* Stock generic */
  if (id === "stock") return "flag-stock";
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
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

function shortDate(value) {
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function formatRoundCutoff(round) {
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(new Date(round.close_at));
}

function formatRoundOpenTime(round) {
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(new Date(round.open_at));
}

function formatRoundCloseTime(round) {
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
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
  const totalMinutes = Math.floor(remainingMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `อีก ${days} วัน ${hours} ชม.`;
  if (hours > 0) return `อีก ${hours} ชม. ${minutes} นาที`;
  if (totalMinutes > 5) return `อีก ${totalMinutes} นาที`;
  // < 5 min — show seconds, will be styled urgent by caller
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  return `เหลือ ${totalMinutes}:${String(seconds).padStart(2, "0")} ⚠️`;
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
    btn.textContent = "⏳ กำลังดึง...";
  }
  /* BUG-10 R2: immediate visual feedback before async work */
  if (window.showToast) window.showToast("⏳ กำลังดึงผลจากเว็บ...", "info");
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
              ⚠️ เว็บนี้ใช้ JavaScript โหลดผล — ระบบดึงเลขให้ไม่ได้ <br>
              <strong>วิธีใช้:</strong> กดปุ่ม "เปิดต้นทาง ↗" ด้านบนเพื่อเปิดเว็บ → copy เลข → กลับมาวางในช่องด้านล่าง → กด "ใส่ลงในแบบฟอร์ม"
            </div>
            <div class="manual-paste-grid">
              <label class="field">
                <span>3 ตัวบน</span>
                <input id="manualPaste3Top" type="text" inputmode="numeric" maxlength="20" placeholder="เช่น 685 (คั่นช่องว่างถ้ามีหลายเลข)" />
              </label>
              <label class="field">
                <span>3 ตัวโต๊ด (ปกติเดียวกับ 3 ตัวบน)</span>
                <input id="manualPaste3Tod" type="text" inputmode="numeric" maxlength="20" placeholder="เช่น 685" />
              </label>
              <label class="field">
                <span>2 ตัวบน</span>
                <input id="manualPaste2Top" type="text" inputmode="numeric" maxlength="20" placeholder="เช่น 85" />
              </label>
              <label class="field">
                <span>2 ตัวล่าง</span>
                <input id="manualPaste2Bottom" type="text" inputmode="numeric" maxlength="20" placeholder="เช่น 74" />
              </label>
              <button id="manualPasteApply" class="button button-primary" type="button">✓ ใส่ลงในแบบฟอร์ม</button>
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

  // Manual paste apply (for JS-app sites)
  const applyBtn = overlay.querySelector("#manualPasteApply");
  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      const fields = [
        { id: "manualPaste3Top", betType: "three_top", label: "3 ตัวบน" },
        { id: "manualPaste3Tod", betType: "three_tod", label: "3 ตัวโต๊ด" },
        { id: "manualPaste2Top", betType: "two_top", label: "2 ตัวบน" },
        { id: "manualPaste2Bottom", betType: "two_bottom", label: "2 ตัวล่าง" },
      ];
      let applied = 0;
      fields.forEach(({ id, betType, label }) => {
        const src = overlay.querySelector(`#${id}`);
        const value = src?.value?.trim();
        if (!value) return;
        const target = elements.resultEditor.querySelector(`input[data-bet-type-id="${betType}"]`);
        if (target) {
          target.value = value;
          target.classList.add("scrape-filled");
          setTimeout(() => target.classList.remove("scrape-filled"), 1200);
          applied += 1;
        }
      });
      if (applied > 0) {
        showToast(`ใส่ ${applied} ช่องเรียบร้อย — อย่าลืมกดบันทึกในแต่ละแถว`, "success");
        overlay.remove();
      } else {
        showToast("ยังไม่ได้กรอกเลขในช่องไหนเลย", "warning");
      }
    });
  }
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
  /* FIX double-wrap: filterCustomer + filterRound ใช้ combobox อยู่แล้ว ห้าม double-wrap
     filterBetType มีแค่ 7 ประเภท ไม่จำเป็นต้องค้นหา ใช้ native select เดียว */
  const targets = [
    /* resultRound: ใช้ combobox อยู่แล้ว — skip */
    elements.reportRound, // settlement round
    /* scheduleLottery: ใช้ combobox อยู่แล้ว — skip */
    /* filterRound: ใช้ combobox — skip */
    /* filterCustomer: ใช้ combobox — skip */
    /* ticketRound: ใช้ combobox + auto-select — skip (เก่าเคย HARD BLOCK) */
    /* filterBetType: แค่ 7 ประเภท ใช้ native select — skip */
  ];
  targets.forEach((sel) => sel && makeSelectSearchable(sel, sel.id?.toLowerCase().includes("customer") ? "🔍 ชื่อ/รหัสลูกค้า" : "🔍 ค้นหา..."));
}

// Hook into existing initPolish + after renderSelects

if (typeof getLotteryName === "function") window.getLotteryName = getLotteryName;
if (typeof api === "function") window.api = api;
/* ============================================================
 * UPGRADE PATCH 2026-05-22 v2 — observer-based
 * ============================================================ */
(function upgrade() {
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
  function escapeHtmlSafe(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function moneyFmt(n) {
    return Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " ฿";
  }

  // --- Lottery flag ---
  function flagForLottery(text) {
    var s = String(text || "").toLowerCase();
    if (/รัฐบาล|ไทย\b|glo|thai/.test(s)) return "🇹🇭";
    if (/hanoi|ฮานอย|vietnam|เวียดนาม|\bvn\b/.test(s)) return "🇻🇳";
    if (/ลาว|lao\b/.test(s)) return "🇱🇦";
    if (/malay|มาเลย|magnum|toto/.test(s)) return "🇲🇾";
    if (/yi.?kee|ยี่กี/.test(s)) return "🎲";
    if (/หุ้น|stock|nikkei|dow|nasdaq|hang|china|korea|taiwan|singapore|india/.test(s)) return "📈";
    if (/ออมสิน|กรุงไทย|ธ\.?ก\.?ส/.test(s)) return "🏦";
    return "🎰";
  }
  window.flagForLottery = flagForLottery;

  // --- Toast augment via MutationObserver ---
  function decorateToast(toast) {
    if (toast.dataset.upgraded === "true") return;
    toast.dataset.upgraded = "true";
    var text = toast.textContent || "";
    if (toast.classList.contains("warning") && !toast.classList.contains("toast-warning")) toast.classList.add("toast-warning");
    if (toast.classList.contains("success") && !toast.classList.contains("toast-success")) toast.classList.add("toast-success");
    if (toast.classList.contains("danger") && !toast.classList.contains("toast-danger")) toast.classList.add("toast-danger");
    if (!toast.classList.contains("toast-warning") && !toast.classList.contains("toast-success") && !toast.classList.contains("toast-danger")) {
      toast.classList.add("toast-info");
    }
    var detectedName = null;
    var lots = (window.state && window.state.lotteries) || [];
    for (var i = 0; i < lots.length; i++) {
      if (lots[i].name && text.indexOf(lots[i].name) !== -1) { detectedName = lots[i].name; break; }
    }
    var flag = detectedName ? flagForLottery(detectedName) : flagForLottery(text);
    if (flag) {
      var flagSpan = document.createElement("span");
      flagSpan.className = "toast-flag";
      flagSpan.textContent = flag;
      var msgSpan = document.createElement("span");
      msgSpan.className = "toast-msg";
      msgSpan.textContent = text;
      toast.textContent = "";
      toast.appendChild(flagSpan);
      toast.appendChild(msgSpan);
    }
  }
  function watchToastStack() {
    var stack = $("#toastStack");
    if (!stack || stack.dataset.upgraded === "true") return;
    stack.dataset.upgraded = "true";
    $$(".toast", stack).forEach(decorateToast);
    new MutationObserver(function(muts) {
      muts.forEach(function(m) {
        m.addedNodes.forEach(function(n) {
          if (n.nodeType === 1 && n.classList && n.classList.contains("toast")) decorateToast(n);
        });
      });
    }).observe(stack, { childList: true });
  }

  // --- Combobox install ---
  function installCombobox(selectEl, placeholder) {
    if (!selectEl || selectEl.dataset.combobox === "true") return;
    if (selectEl.options.length < 4) return;
    selectEl.dataset.combobox = "true";
    placeholder = placeholder || "🔍 พิมพ์ค้นหา...";

    var wrap = document.createElement("div");
    wrap.className = "combobox";
    selectEl.parentNode.insertBefore(wrap, selectEl);
    wrap.appendChild(selectEl);
    selectEl.classList.add("combobox-native");

    var input = document.createElement("input");
    input.type = "text";
    input.className = "combobox-input";
    input.placeholder = placeholder;
    input.autocomplete = "off";
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-expanded", "false");
    wrap.insertBefore(input, selectEl);

    var panel = document.createElement("div");
    panel.className = "combobox-panel";
    panel.hidden = true;
    wrap.appendChild(panel);

    var activeIdx = -1;
    var lastMatches = [];

    function syncInputFromSelect() {
      var opt = selectEl.selectedOptions[0];
      var text = opt ? (opt.textContent || "").trim() : "";
      /* FEAT placeholder-all: ถ้าเป็น "ทั้งหมด"/all → ว่าง ใช้ placeholder */
      var isAllOption = opt && (opt.value === "all" || opt.value === "" || text === "ทั้งหมด" || text === "— ทั้งหมด —");
      input.value = isAllOption ? "" : text;
    }
    function openPanel() { panel.hidden = false; input.setAttribute("aria-expanded", "true"); render(input.value.trim()); }
    function closePanel() { panel.hidden = true; input.setAttribute("aria-expanded", "false"); activeIdx = -1; }
    function highlightMatch(text, q) {
      if (!q) return escapeHtmlSafe(text);
      var i = text.toLowerCase().indexOf(q.toLowerCase());
      if (i < 0) return escapeHtmlSafe(text);
      return escapeHtmlSafe(text.slice(0, i)) + "<mark>" + escapeHtmlSafe(text.slice(i, i + q.length)) + "</mark>" + escapeHtmlSafe(text.slice(i + q.length));
    }
    function render(query) {
      var q = (query || "").trim();
      var qLower = q.toLowerCase();
      var options = Array.from(selectEl.options);
      lastMatches = options.filter(function(opt) {
        var t = (opt.textContent || "").toLowerCase();
        return !qLower || t.indexOf(qLower) !== -1;
      });
      if (!lastMatches.length) { panel.innerHTML = '<div class="combobox-empty">ไม่พบรายการ</div>'; activeIdx = -1; return; }
      panel.innerHTML = lastMatches.slice(0, 60).map(function(opt, idx) {
        var text = (opt.textContent || "").trim();
        var hasStar = opt.dataset.star;
        return '<div class="combobox-option' + (opt.value === selectEl.value ? ' is-selected' : '') + (idx === activeIdx ? ' is-active' : '') + '" data-value="' + escapeHtmlSafe(opt.value) + '" data-idx="' + idx + '" role="option">' +
          (hasStar ? '<span class="combobox-star" title="' + escapeHtmlSafe(opt.dataset.star) + '">⭐</span>' : '') +
          '<span class="combobox-text">' + highlightMatch(text, q) + '</span>' +
          '</div>';
      }).join("");
      panel.querySelectorAll(".combobox-option").forEach(function(el) {
        el.addEventListener("mousedown", function(e) { e.preventDefault(); pickOption(el); });
      });
    }
    function pickOption(el) {
      selectEl.value = el.dataset.value;
      selectEl.dispatchEvent(new Event("change", { bubbles: true }));
      syncInputFromSelect();
      closePanel();
    }
    input.addEventListener("focus", openPanel);
    input.addEventListener("input", function() { activeIdx = -1; render(input.value); });
    input.addEventListener("blur", function() { setTimeout(closePanel, 150); });
    input.addEventListener("keydown", function(e) {
      if (panel.hidden) return;
      if (e.key === "Escape") { closePanel(); input.blur(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIdx = Math.min((activeIdx < 0 ? -1 : activeIdx) + 1, lastMatches.length - 1);
        render(input.value);
        var opt = panel.querySelector(".combobox-option.is-active");
        if (opt && opt.scrollIntoView) opt.scrollIntoView({ block: "nearest" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIdx = Math.max(activeIdx - 1, 0);
        render(input.value);
        var opt = panel.querySelector(".combobox-option.is-active");
        if (opt && opt.scrollIntoView) opt.scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter") {
        e.preventDefault();
        var target = activeIdx >= 0 ? lastMatches[activeIdx] : lastMatches[0];
        if (target) {
          selectEl.value = target.value;
          selectEl.dispatchEvent(new Event("change", { bubbles: true }));
          syncInputFromSelect();
          closePanel();
        }
      }
    });
    new MutationObserver(syncInputFromSelect).observe(selectEl, { childList: true });
    selectEl.addEventListener("change", syncInputFromSelect);
    /* BUG-001 fix: intercept programmatic value assignment so combobox label re-syncs */
    try {
      var __proto = Object.getPrototypeOf(selectEl);
      var __desc = Object.getOwnPropertyDescriptor(__proto, "value") || Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
      if (__desc && __desc.set) {
        Object.defineProperty(selectEl, "value", {
          configurable: true,
          enumerable: true,
          get: function() { return __desc.get.call(this); },
          set: function(v) { __desc.set.call(this, v); try { syncInputFromSelect(); } catch (e) {} },
        });
      }
    } catch (e) { /* ignore */ }
    syncInputFromSelect();
  }
  window.installCombobox = installCombobox;
  function applyComboboxes() {
    var ids = ["ticketRoundInput", "resultRoundInput", "reportRound", "scheduleLotteryInput", "filterRound", "filterCustomer", "ticketCustomer", "ticketHeadHouse"];
    ids.forEach(function(id) {
      var el = document.getElementById(id);
      if (el && el.tagName === "SELECT") installCombobox(el, id.toLowerCase().indexOf("customer") !== -1 ? "🔍 ชื่อ/รหัสลูกค้า…" : "🔍 พิมพ์ค้นหา…");
    });
  }
  window.applyComboboxes = applyComboboxes;
  window.watchToastStack = watchToastStack;
})();

/* UPGRADE PATCH 2026-05-22 v2 — part 2 (pending panel + winners modal + bootstrap) */
(function upgradePart2() {
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.from(document.querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function money(n) {
    return Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " ฿";
  }
  var flag = window.flagForLottery || function() { return "🎰"; };

  /* BUG-I FIX: dynamic list from server (with hardcoded fallback) */
  var APILOTTO_LOTTERIES_FALLBACK = [
    "thai",
    "lott_027", "lott_032", "lott_033", "lott_035", "lott_036",
    "lott_010","lott_011","lott_012","lott_013","lott_014","lott_015","lott_016","lott_017","lott_018","lott_019","lott_020","lott_021","lott_022","lott_023","lott_024","lott_025",
    "lott_037","lott_038","lott_039","lott_040","lott_041","lott_042","lott_043","lott_044","lott_045","lott_046","lott_047","lott_048","lott_049"
  ];
  function dueRounds() {
    var s = window.state;
    if (!s || !s.rounds) return [];
    var now = Date.now();
    return s.rounds.filter(function(r) {
      if (r.result_status === "finalized" || r.result_status === "cancelled") return false;
      var due = new Date(r.result_at || r.draw_at).getTime();
      if (now < due) return false;
      var hasResult = (s.results || []).some(function(x) { return x.round_id === r.id; });
      if (hasResult) return false;
      /* APILOTTO-FILTER: ถ้าหวยอยู่ใน apilotto + overdue < 6 ชม. → ระบบกำลังจัดการ → ไม่แสดง */
      var overdueMs = now - due;
      if ((window.__apilottoLotteries || APILOTTO_LOTTERIES_FALLBACK).indexOf(r.lottery_id) !== -1 && overdueMs < 24 * 3600 * 1000) {
        return false;
      }
      return true;
    }).sort(function(a, b) {
      return new Date(a.result_at || a.draw_at) - new Date(b.result_at || b.draw_at);
    });
  }

  function renderPending() {
    var panel = $("#resultPendingPanel");
    var list = $("#resultPendingList");
    var count = $("#resultPendingCount");
    if (!panel || !list) return;
    var due = dueRounds();
    var ids = {};
    due.forEach(function(r) { ids[r.id] = true; });

    var dropdown = $("#resultRoundInput");
    if (dropdown) {
      Array.from(dropdown.options).forEach(function(opt) {
        if (ids[opt.value]) { opt.dataset.star = "ถึงคิวตรวจแล้ว"; }
        else if (opt.dataset.star) { delete opt.dataset.star; }
      });
    }
    if (!due.length) { panel.hidden = true; return; }
    panel.hidden = false;
    count.textContent = String(due.length);
    list.innerHTML = due.slice(0, 12).map(function(round) {
      var lotName = window.getLotteryName ? window.getLotteryName(round.lottery_id) : round.lottery_id;
      var f = flag(lotName);
      var overdueMs = Date.now() - new Date(round.result_at || round.draw_at).getTime();
      var overdueMin = Math.round(overdueMs / 60000);
      var overdueText = overdueMin < 60 ? ("เกินมา " + overdueMin + " นาที") :
        overdueMin < 1440 ? ("เกินมา " + Math.round(overdueMin / 60) + " ชม.") :
        ("เกินมา " + Math.round(overdueMin / 1440) + " วัน");
      return '<li><button type="button" class="result-pending-item" data-round-id="' + esc(round.id) + '">' +
        '<span class="result-pending-flag">' + f + '</span>' +
        '<span class="result-pending-info"><strong>' + esc(lotName) + '</strong><small>' + esc(round.label) + ' · <em>' + esc(overdueText) + '</em></small></span>' +
        '<span class="result-pending-arrow">›</span></button></li>';
    }).join("");
    list.querySelectorAll(".result-pending-item").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var id = btn.dataset.roundId;
        var sel = $("#resultRoundInput");
        if (sel) {
          sel.value = id;
          sel.dispatchEvent(new Event("change", { bubbles: true }));
        }
        /* FIX: ไม่ต้อง scroll editor — บอสไม่ชอบ */
      });
    });
  }
  window.renderResultPendingPanel = renderPending;

  // --- Winners modal ---
  var __winToken = 0;
  function showWinners(roundId) {
    var myT = ++__winToken;
    var round = ((window.state && window.state.rounds) || []).find(function(r) { return r.id === roundId; });
    if (!round) { if (window.showToast) window.showToast("ไม่พบงวดนี้", "danger"); return; }
    var lotName = window.getLotteryName ? window.getLotteryName(round.lottery_id) : "";
    var f = flag(lotName);
    var dialog = $("#winnersDialog");
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.id = "winnersDialog";
      dialog.className = "winners-dialog";
      dialog.innerHTML = '<header class="winners-dialog-header"><div><strong id="winnersDialogTitle">ดูใครถูก</strong><small id="winnersDialogSub"></small></div><button type="button" class="winners-dialog-close" aria-label="ปิด">✕</button></header><div id="winnersDialogBody" class="winners-dialog-body"></div>';
      document.body.appendChild(dialog);
      dialog.querySelector(".winners-dialog-close").addEventListener("click", function() { dialog.close(); });
      dialog.addEventListener("click", function(e) { if (e.target === dialog) dialog.close(); });
    }
    $("#winnersDialogTitle").innerHTML = '<span class="dialog-flag">' + f + '</span> ' + esc(lotName) + ' — ใครถูกบ้าง';
    $("#winnersDialogSub").textContent = "กำลังโหลด…";
    $("#winnersDialogBody").innerHTML = '<div class="winners-loading">⏳ กำลังคำนวณ…</div>';
    if (typeof dialog.showModal === "function") dialog.showModal();

    var fetcher = window.api || function(path) { return fetch(path, { headers: { "Content-Type": "application/json" } }).then(function(r) { if (!r.ok) throw new Error("http_" + r.status); return r.json(); }); };
    fetcher("/api/settlements?roundId=" + encodeURIComponent(roundId)).then(function(data) {
      if (myT !== __winToken) return;
      var winners = data.winners || [];
      var total = Number(data.totalPayout || 0);
      var stake = Number(data.totalStake || 0);
      var profit = Number(data.profit || 0);
      $("#winnersDialogSub").textContent = "งวด " + esc(round.label || "") + " · " + winners.length + " ลูกค้าถูกรางวัล";
      if (!winners.length) {
        $("#winnersDialogBody").innerHTML = '<div class="winners-summary"><div><span class="muted">ยอดแทงรวม</span><strong>' + money(stake) + '</strong></div><div><span class="muted">ยอดต้องจ่าย</span><strong style="color:#16a34a">' + money(0) + '</strong></div><div><span class="muted">กำไร</span><strong style="color:#16a34a">+' + money(profit) + '</strong></div></div><div class="winners-empty">🎉 ไม่มีลูกค้าถูกรางวัลในงวดนี้</div>';
        return;
      }
      var byCust = {};
      winners.forEach(function(w) {
        var key = w.customer_id || (w.customer_code + "|" + w.customer_name);
        if (!byCust[key]) byCust[key] = { customer_code: w.customer_code, customer_name: w.customer_name, items: [], totalPayout: 0 };
        byCust[key].items.push(w);
        byCust[key].totalPayout += Number(w.payout) || 0;
      });
      var grouped = Object.values(byCust).sort(function(a, b) { return b.totalPayout - a.totalPayout; });
      var rowsHtml = "";
      grouped.forEach(function(g) {
        g.items.forEach(function(it, idx) {
          rowsHtml += '<tr' + (idx === 0 ? ' class="customer-first"' : '') + '>';
          if (idx === 0) {
            rowsHtml += '<td rowspan="' + g.items.length + '" class="customer-cell"><strong>' + esc(g.customer_name || "-") + '</strong><small>' + esc(g.customer_code || "") + '</small><div class="customer-totals">รวม ' + money(g.totalPayout) + '</div></td>';
          }
          rowsHtml += '<td>' + esc(it.bet_type_name || it.bet_type_id) + '</td>';
          rowsHtml += '<td class="number-cell"><strong>' + esc(it.number) + '</strong></td>';
          rowsHtml += '<td class="num">' + money(it.amount) + '</td>';
          rowsHtml += '<td class="num">×' + Number(it.rate).toLocaleString("th-TH") + '</td>';
          rowsHtml += '<td class="num win-amt">' + money(it.payout) + '</td>';
          rowsHtml += '</tr>';
        });
      });
      $("#winnersDialogBody").innerHTML = '<div class="winners-summary"><div><span class="muted">ยอดแทงรวม</span><strong>' + money(stake) + '</strong></div><div><span class="muted">ยอดต้องจ่าย</span><strong style="color:#dc2626">' + money(total) + '</strong></div><div><span class="muted">กำไร</span><strong style="color:' + (profit >= 0 ? "#16a34a" : "#dc2626") + '">' + (profit >= 0 ? "+" : "") + money(profit) + '</strong></div></div><div class="winners-table-wrap"><table class="winners-table"><thead><tr><th>ลูกค้า</th><th>ประเภท</th><th>เลข</th><th class="num">ยอดแทง</th><th class="num">อัตรา</th><th class="num">ยอดต้องจ่าย</th></tr></thead><tbody>' + rowsHtml + '</tbody></table></div>';
    }).catch(function(err) {
      if (myT !== __winToken) return;
      $("#winnersDialogBody").innerHTML = '<div style="padding:20px;color:#dc2626">โหลดข้อมูลไม่สำเร็จ: ' + esc(err && err.message) + '</div>';
    });
  }
  window.showWinnersModal = showWinners;

  // --- Augment results overview table ---
  function augmentOverview() {
    var body = $("#resultsOverviewBody");
    if (!body) return;
    Array.from(body.querySelectorAll("tr")).forEach(function(tr) {
      if (tr.dataset.augmented === "true") return;
      var cells = tr.querySelectorAll("td");
      if (cells.length < 8) return;
      var statusCell = cells[7];
      if (!statusCell) return;
      var pillText = (statusCell.textContent || "").trim();
      var isFinal = pillText.indexOf("ยืนยันแล้ว") !== -1 || pillText.indexOf("finalized") !== -1;
      if (!isFinal) {
        tr.dataset.augmented = "true"; // no button needed
        return;
      }
      var rid = tr.dataset.roundId;
      var round = rid ? ((window.state && window.state.rounds) || []).find(function(r) { return r.id === rid; }) : null;
      if (!round) {
        var lotteryName = (cells[0].textContent || "").trim();
        var roundLabel = (cells[1].textContent || "").trim();
        round = ((window.state && window.state.rounds) || []).find(function(r) {
          var n = window.getLotteryName ? window.getLotteryName(r.lottery_id) : r.lottery_id;
          return n === lotteryName && r.label === roundLabel;
        });
      }
      if (!round) return; // try again next tick; state may not be loaded yet
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-mini btn-winners";
      btn.innerHTML = "👥 ดูใครถูก";
      btn.addEventListener("click", function() { showWinners(round.id); });
      statusCell.appendChild(document.createTextNode(" "));
      statusCell.appendChild(btn);
      tr.dataset.augmented = "true";
    });
  }
  function watchOverview() {
    var body = $("#resultsOverviewBody");
    if (!body || body.dataset.watched === "true") return;
    body.dataset.watched = "true";
    augmentOverview();
    new MutationObserver(augmentOverview).observe(body, { childList: true });
  }

  function boot() {
    if (window.watchToastStack) window.watchToastStack();
    watchOverview();
    augmentOverview();
    if (window.applyComboboxes) window.applyComboboxes();
    renderPending();
  }
  function start() {
    boot();
    setInterval(boot, 1500);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    setTimeout(start, 50);
  }
  console.log("[upgrade-patch 2026-05-22 v2] loaded");
})();

/* ===== OWNER DASHBOARD — frontend ===== */
(function ownerDashboard() {
  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.from(document.querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function money(n) {
    var v = Number(n || 0);
    if (Math.abs(v) >= 1000000) return (v / 1000000).toFixed(2).replace(/\.00$/, "") + "M ฿";
    if (Math.abs(v) >= 100000) return Math.round(v / 1000) + "K ฿";
    return v.toLocaleString("th-TH", { maximumFractionDigits: 0 }) + " ฿";
  }
  function moneyExact(n) {
    return Number(n || 0).toLocaleString("th-TH", { maximumFractionDigits: 0 }) + " ฿";
  }
  function isoToday() {
    var d = new Date();
    var bk = new Date(d.getTime() + ((d.getTimezoneOffset() + 7 * 60) * 60000));
    return bk.toISOString().slice(0, 10);
  }
  function dateShift(iso, days) {
    var parts = iso.split("-").map(Number);
    var d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + days));
    return d.toISOString().slice(0, 10);
  }

  var state = { loaded: false, lastRange: null, refreshTimer: null };

  function fillSummaryCard(prefix, data) {
    var s = (data && Number(data.stake)) || 0;
    var p = (data && Number(data.payout)) || 0;
    var profit = s - p;
    setKey(prefix + "Stake", money(s));
    setKey(prefix + "Payout", money(p));
    var pEl = document.querySelector('[data-key=\"' + prefix + 'Profit\"]');
    if (pEl) {
      pEl.textContent = (profit >= 0 ? "+" : "") + money(profit);
      pEl.style.color = profit >= 0 ? "#16a34a" : "#dc2626";
    }
    setKey(prefix + "Tickets", ((data && data.ticketCount) || 0).toLocaleString("th-TH") + " โพย");
    setKey(prefix + "Customers", ((data && data.customerCount) || 0).toLocaleString("th-TH") + " ลูกค้า");
  }
  function setKey(key, val) {
    var el = document.querySelector('[data-key=\"' + key + '\"]');
    if (el) el.textContent = val;
  }

  function fillRealtime(rt) {
    var box = $("#ownerRealtime");
    if (!box || !rt) return;
    box.innerHTML =
      '<div class="rt-item"><span>งวดเปิดอยู่</span><strong>' + (rt.openRounds || 0) + '</strong></div>' +
      '<div class="rt-item"><span>บิลรอตรวจ</span><strong>' + (rt.pendingTickets || 0) + ' <small>(' + money(rt.pendingAmount || 0) + ')</small></strong></div>' +
      '<div class="rt-item"><span>ลูกค้า 24 ชม.</span><strong>' + (rt.activeCustomers24h || 0) + '</strong></div>';
  }

  function renderTrendChart(trend) {
    var box = $("#ownerTrendChart");
    if (!box) return;
    if (!trend || !trend.length) { box.innerHTML = '<div class="empty">ยังไม่มีข้อมูล</div>'; return; }
    var w = box.clientWidth || 800;
    var h = 220;
    var pad = { l: 56, r: 12, t: 14, b: 28 };
    var profits = trend.map(function(t) { return Number(t.profit) || 0; });
    var max = Math.max.apply(null, profits.concat([0]));
    var min = Math.min.apply(null, profits.concat([0]));
    if (max === min) max = max + 1;
    var x = function(i) { return pad.l + (i / Math.max(1, trend.length - 1)) * (w - pad.l - pad.r); };
    var y = function(v) { return pad.t + (1 - (v - min) / (max - min)) * (h - pad.t - pad.b); };
    var path = trend.map(function(t, i) { return (i === 0 ? "M" : "L") + x(i) + " " + y(t.profit); }).join(" ");
    var area = path + " L" + x(trend.length - 1) + " " + (h - pad.b) + " L" + x(0) + " " + (h - pad.b) + " Z";
    var zeroY = y(0);
    var dots = trend.map(function(t, i) {
      var color = (Number(t.profit) || 0) >= 0 ? "#16a34a" : "#dc2626";
      return '<circle cx="' + x(i) + '" cy="' + y(t.profit) + '" r="3" fill="' + color + '"><title>' + t.date + ': ' + moneyExact(t.profit) + '</title></circle>';
    }).join("");
    var firstDate = trend[0].date, lastDate = trend[trend.length - 1].date;
    var ticks = [];
    [0, Math.floor(trend.length / 2), trend.length - 1].forEach(function(i) {
      if (trend[i]) ticks.push('<text x="' + x(i) + '" y="' + (h - 8) + '" text-anchor="middle" font-size="10" fill="#5a6c63">' + trend[i].date.slice(5) + '</text>');
    });
    box.innerHTML =
      '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">' +
      '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="transparent"/>' +
      '<line x1="' + pad.l + '" y1="' + zeroY + '" x2="' + (w - pad.r) + '" y2="' + zeroY + '" stroke="#d8d4c5" stroke-dasharray="3,3"/>' +
      '<path d="' + area + '" fill="rgba(15,81,50,0.10)"/>' +
      '<path d="' + path + '" fill="none" stroke="#0f5132" stroke-width="2"/>' +
      dots +
      '<text x="' + (pad.l - 6) + '" y="' + (pad.t + 8) + '" text-anchor="end" font-size="10" fill="#5a6c63">' + money(max) + '</text>' +
      '<text x="' + (pad.l - 6) + '" y="' + (h - pad.b + 2) + '" text-anchor="end" font-size="10" fill="#5a6c63">' + money(min) + '</text>' +
      ticks.join("") +
      '</svg>';
  }

  function renderTopList(targetId, items, mapFn) {
    var el = document.getElementById(targetId);
    if (!el) return;
    if (!items || !items.length) { el.innerHTML = '<div class="empty">— ยังไม่มีข้อมูล —</div>'; return; }
    el.innerHTML = items.map(function(it, i) {
      var m = mapFn(it);
      var profitColor = m.profit != null ? (m.profit >= 0 ? "#16a34a" : "#dc2626") : null;
      return (
        '<div class="owner-top-row">' +
          '<span class="rank">' + (i + 1) + '</span>' +
          '<div class="info"><strong>' + esc(m.title) + '</strong><small>' + esc(m.sub || "") + '</small></div>' +
          '<div class="num">' + (m.right || "") +
            (m.profit != null ? '<div class="profit" style="color:' + profitColor + '">' + (m.profit >= 0 ? "+" : "") + money(m.profit) + '</div>' : "") +
          '</div>' +
        '</div>'
      );
    }).join("");
  }

  function renderRangeSummary(data) {
    var box = $("#ownerRangeSummary");
    if (!box) return;
    var s = Number(data.stake) || 0;
    var p = Number(data.payout) || 0;
    var profit = s - p;
    box.innerHTML =
      '<div class="range-tiles">' +
        '<div><span class="label">ยอดแทง</span><strong>' + moneyExact(s) + '</strong></div>' +
        '<div><span class="label">ยอดต้องจ่าย</span><strong style="color:#dc2626">' + moneyExact(p) + '</strong></div>' +
        '<div><span class="label">กำไรสุทธิ</span><strong style="color:' + (profit >= 0 ? "#16a34a" : "#dc2626") + '">' + (profit >= 0 ? "+" : "") + moneyExact(profit) + '</strong></div>' +
        '<div><span class="label">จำนวนโพย</span><strong>' + (Number(data.ticketCount) || 0).toLocaleString("th-TH") + '</strong></div>' +
        '<div><span class="label">ลูกค้า</span><strong>' + (Number(data.customerCount) || 0).toLocaleString("th-TH") + '</strong></div>' +
      '</div>';
  }

  async function load(from, to) {
    var qs = (from && to) ? "?from=" + encodeURIComponent(from) + "&to=" + encodeURIComponent(to) : "";
    var status = $("#ownerRangeStatus");
    if (status) status.textContent = "กำลังโหลด…";
    try {
      var fetcher = window.api || function(p) { return fetch(p).then(function(r) { if (!r.ok) throw new Error("http_" + r.status); return r.json(); }); };
      var data = await fetcher("/api/owner/dashboard" + qs);
      state.loaded = true;
      state.lastRange = { from: data.range.from, to: data.range.to };
      fillSummaryCard("today", data.today);
      fillSummaryCard("month", data.month);
      fillRealtime(data.realtime);
      renderTrendChart(data.trend30d);
      renderRangeSummary(data.range);
      renderTopList("ownerTopCustomersProfit", data.topCustomersProfit, function(c) {
        return { title: c.name || "-", sub: (c.code || "") + " · " + c.count + " บิล", right: "ยอด " + money(c.stake), profit: c.net };
      });
      renderTopList("ownerTopCustomersLoss", data.topCustomersLoss, function(c) {
        return { title: c.name || "-", sub: (c.code || "") + " · " + c.count + " บิล", right: "ยอด " + money(c.stake), profit: c.net };
      });
      renderTopList("ownerTopHeadHouses", data.topHeadHouses, function(h) {
        return { title: h.name || h.code || "-", sub: (h.code || "") + " · " + h.count + " บิล", right: "ยอด " + money(h.stake), profit: h.profit };
      });
      renderTopList("ownerTopLotteriesProfit", data.topLotteriesProfit, function(l) {
        var flag = window.flagForLottery ? window.flagForLottery(l.name) : "🎰";
        return { title: flag + " " + (l.name || "-"), sub: l.count + " บิล", right: "ยอด " + money(l.stake), profit: l.profit };
      });
      renderTopList("ownerTopLotteriesLoss", data.topLotteriesLoss, function(l) {
        var flag = window.flagForLottery ? window.flagForLottery(l.name) : "🎰";
        return { title: flag + " " + (l.name || "-"), sub: l.count + " บิล", right: "ยอด " + money(l.stake), profit: l.profit };
      });
      if (status) status.textContent = "อัพเดทล่าสุด " + new Date().toLocaleTimeString("th-TH-u-ca-buddhist");
    } catch (err) {
      if (status) status.textContent = "โหลดไม่สำเร็จ: " + (err.message || "");
    }
  }

  function init() {
    var from = $("#ownerRangeFrom");
    var to = $("#ownerRangeTo");
    if (from && !from.value) from.value = dateShift(isoToday(), -29);
    if (to && !to.value) to.value = isoToday();

    var apply = $("#ownerRangeApply");
    if (apply && !apply.dataset.bound) {
      apply.dataset.bound = "true";
      apply.addEventListener("click", function() { load(from.value, to.value); });
    }
    $$('[data-preset]').forEach(function(btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = "true";
      btn.addEventListener("click", function() {
        var days = Number(btn.dataset.preset);
        var t = isoToday();
        var f = dateShift(t, -days + 1);
        from.value = f; to.value = t;
        load(f, t);
      });
    });
  }

  function whenViewActive() {
    var v = document.querySelector('[data-view="owner"]');
    if (v && !v.hidden) {
      init();
      if (!state.loaded) load();
      // refresh every 30s if view stays open
      if (!state.refreshTimer) {
        state.refreshTimer = setInterval(function() {
          var sv = document.querySelector('[data-view="owner"]');
          if (sv && !sv.hidden) {
            load(document.querySelector("#ownerRangeFrom")?.value, document.querySelector("#ownerRangeTo")?.value);
          } else {
            clearInterval(state.refreshTimer);
            state.refreshTimer = null;
          }
        }, 30000);
      }
    }
  }

  function startWatch() {
    // poll for view visibility every 800ms
    setInterval(whenViewActive, 800);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startWatch);
  } else {
    setTimeout(startWatch, 100);
  }
  console.log("[owner-dashboard] loaded");
})();

/* ===== ADMIN LINE SETTINGS — frontend ===== */
(function lineAdmin() {
  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.from(document.querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }

  var state = { current: null, loaded: false };

  function renderBanks() {
    var box = $("#lsBanks");
    if (!box) return;
    var banks = (state.current && state.current.banks) || [];
    box.innerHTML = banks.map(function(b, i) {
      return '<div class="ls-bank" data-idx="' + i + '">' +
        '<input class="ls-bn" data-k="bankName" placeholder="ธนาคาร (เช่น ไทยพาณิชย์)" value="' + esc(b.bankName) + '" />' +
        '<input class="ls-bn" data-k="accountName" placeholder="ชื่อบัญชี" value="' + esc(b.accountName) + '" />' +
        '<input class="ls-bn" data-k="accountNumber" placeholder="เลขที่บัญชี" value="' + esc(b.accountNumber) + '" />' +
        '<input class="ls-bn" data-k="note" placeholder="หมายเหตุ (ไม่บังคับ)" value="' + esc(b.note) + '" />' +
        '<button type="button" class="ls-del" data-act="delBank" data-idx="' + i + '">✕</button>' +
        '</div>';
    }).join("");
    box.querySelectorAll(".ls-bn").forEach(function(inp) {
      inp.addEventListener("input", function() {
        var idx = Number(inp.closest(".ls-bank").dataset.idx);
        state.current.banks[idx][inp.dataset.k] = inp.value;
      });
    });
    box.querySelectorAll('[data-act="delBank"]').forEach(function(btn) {
      btn.addEventListener("click", function() {
        var idx = Number(btn.dataset.idx);
        state.current.banks.splice(idx, 1); renderBanks();
      });
    });
  }

  function renderRates() {
    var box = $("#lsRates");
    if (!box) return;
    var groups = state.current && state.current.payoutRates ? Object.entries(state.current.payoutRates) : [];
    box.innerHTML = groups.map(function(pair, gi) {
      var name = pair[0], items = pair[1] || [];
      return '<div class="ls-rate-group" data-gname="' + esc(name) + '">' +
        '<div class="ls-rg-head">' +
          '<input class="ls-rg-name" data-orig="' + esc(name) + '" value="' + esc(name) + '" />' +
          '<button type="button" class="ls-del" data-act="delGroup" data-gi="' + gi + '">✕ ลบกลุ่ม</button>' +
        '</div>' +
        '<div class="ls-rate-items">' +
          items.map(function(it, ii) {
            return '<div class="ls-rate-row" data-gi="' + gi + '" data-ii="' + ii + '">' +
              '<input class="ls-rn" data-k="type" placeholder="ประเภท เช่น 3 ตัวบน" value="' + esc(it.type) + '" />' +
              '<input class="ls-rn" data-k="rate" placeholder="เรท เช่น บาทละ 800" value="' + esc(it.rate) + '" />' +
              '<button type="button" class="ls-del" data-act="delRate" data-gi="' + gi + '" data-ii="' + ii + '">✕</button>' +
            '</div>';
          }).join("") +
        '</div>' +
        '<button type="button" class="button-mini" data-act="addRate" data-gi="' + gi + '">+ เพิ่มประเภท</button>' +
      '</div>';
    }).join("");

    function reorderRates() {
      // Rebuild payoutRates from DOM (preserves user edits to group names)
      var rates = {};
      box.querySelectorAll(".ls-rate-group").forEach(function(g) {
        var gname = g.querySelector(".ls-rg-name").value || "ไม่ระบุ";
        var items = [];
        g.querySelectorAll(".ls-rate-row").forEach(function(r) {
          var t = r.querySelector('[data-k="type"]').value;
          var v = r.querySelector('[data-k="rate"]').value;
          items.push({ type: t, rate: v });
        });
        rates[gname] = items;
      });
      state.current.payoutRates = rates;
    }
    box.querySelectorAll(".ls-rn, .ls-rg-name").forEach(function(inp) {
      inp.addEventListener("input", reorderRates);
    });
    box.querySelectorAll('[data-act="delRate"]').forEach(function(btn) {
      btn.addEventListener("click", function() {
        var gi = Number(btn.dataset.gi), ii = Number(btn.dataset.ii);
        var keys = Object.keys(state.current.payoutRates);
        state.current.payoutRates[keys[gi]].splice(ii, 1);
        renderRates();
      });
    });
    box.querySelectorAll('[data-act="addRate"]').forEach(function(btn) {
      btn.addEventListener("click", function() {
        var gi = Number(btn.dataset.gi);
        var keys = Object.keys(state.current.payoutRates);
        state.current.payoutRates[keys[gi]].push({ type: "", rate: "" });
        renderRates();
      });
    });
    box.querySelectorAll('[data-act="delGroup"]').forEach(function(btn) {
      btn.addEventListener("click", function() {
        var gi = Number(btn.dataset.gi);
        var keys = Object.keys(state.current.payoutRates);
        delete state.current.payoutRates[keys[gi]];
        renderRates();
      });
    });
  }

  function renderGroups() {
    var box = $("#lsGroups");
    if (!box) return;
    var gs = (state.current && state.current.groups) || [];
    box.innerHTML = gs.map(function(g, i) {
      return '<div class="ls-group-row" data-idx="' + i + '">' +
        '<input class="ls-gn" data-k="title" placeholder="ชื่อกลุ่ม" value="' + esc(g.title) + '" />' +
        '<input class="ls-gn" data-k="url" placeholder="https://line.me/ti/g/..." value="' + esc(g.url) + '" />' +
        '<button type="button" class="ls-del" data-act="delGroup" data-idx="' + i + '">✕</button>' +
      '</div>';
    }).join("");
    box.querySelectorAll(".ls-gn").forEach(function(inp) {
      inp.addEventListener("input", function() {
        var idx = Number(inp.closest(".ls-group-row").dataset.idx);
        state.current.groups[idx][inp.dataset.k] = inp.value;
      });
    });
    box.querySelectorAll('[data-act="delGroup"]').forEach(function(btn) {
      btn.addEventListener("click", function() {
        state.current.groups.splice(Number(btn.dataset.idx), 1);
        renderGroups();
      });
    });
  }

  async function load() {
    try {
      var fetcher = window.api || function(p) { return fetch(p).then(function(r) { if (!r.ok) throw new Error("http"); return r.json(); }); };
      state.current = await fetcher("/api/admin/line-settings");
      if (!state.current.banks) state.current.banks = [];
      if (!state.current.payoutRates) state.current.payoutRates = {};
      if (!state.current.groups) state.current.groups = [];
      state.loaded = true;
      renderBanks(); renderRates(); renderGroups();
      $("#lsHowTo").value = state.current.howTo || "";
      $("#lsPromo").value = state.current.promoNote || "";
      $("#lsStatus").textContent = "อัพเดทล่าสุด " + new Date().toLocaleTimeString("th-TH-u-ca-buddhist");
    } catch (err) {
      $("#lsStatus").textContent = "โหลดไม่สำเร็จ: " + (err.message || "");
    }
  }

  async function save() {
    if (!state.current) return;
    state.current.howTo = $("#lsHowTo").value;
    state.current.promoNote = $("#lsPromo").value;
    $("#lsSaveBtn").disabled = true;
    $("#lsStatus").textContent = "กำลังบันทึก…";
    try {
      var fetcher = window.api || function(p, o) { return fetch(p, { method: o.method, headers: { "Content-Type": "application/json" }, body: o.body }).then(function(r) { if (!r.ok) throw new Error("http_" + r.status); return r.json(); }); };
      await fetcher("/api/admin/line-settings", { method: "PUT", body: state.current });
      $("#lsStatus").textContent = "✓ บันทึกแล้ว · " + new Date().toLocaleTimeString("th-TH-u-ca-buddhist");
      if (window.showToast) window.showToast("บันทึกการตั้งค่า LINE แล้ว", "success");
    } catch (err) {
      $("#lsStatus").textContent = "บันทึกไม่สำเร็จ: " + (err.message || "");
    } finally {
      $("#lsSaveBtn").disabled = false;
    }
  }

  function init() {
    if (init.bound) return;
    init.bound = true;
    $("#lsSaveBtn")?.addEventListener("click", save);
    $("#lsAddBank")?.addEventListener("click", function() {
      state.current.banks.push({ bankName: "", accountName: "", accountNumber: "", note: "" });
      renderBanks();
    });
    $("#lsAddRateGroup")?.addEventListener("click", function() {
      var name = "กลุ่มใหม่ " + (Object.keys(state.current.payoutRates).length + 1);
      state.current.payoutRates[name] = [{ type: "", rate: "" }];
      renderRates();
    });
    $("#lsAddGroup")?.addEventListener("click", function() {
      state.current.groups.push({ title: "", url: "" });
      renderGroups();
    });
  }

  function watch() {
    var v = document.querySelector('[data-view="lineSettings"]');
    if (v && !v.hidden) {
      init();
      if (!state.loaded) load();
    }
  }
  setInterval(watch, 800);
  console.log("[line-admin] loaded");
})();

/* ===== AFFILIATE — admin frontend ===== */
(function affiliateModule() {
  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
  function money(n) { return Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " ฿"; }

  var state = { loaded: false, summary: [] };

  async function load() {
    var fetcher = window.api || function(p) { return fetch(p).then(function(r) { if (!r.ok) throw new Error("http"); return r.json(); }); };
    state.summary = await fetcher("/api/admin/affiliate/summary");
    render();
    $("#affLastUpdate").textContent = "อัพเดท " + new Date().toLocaleTimeString("th-TH-u-ca-buddhist");
    state.loaded = true;
  }

  function getHHName(id) {
    var hh = state.summary.find(function(x) { return x.head_house_id === id; });
    return hh ? hh.code + " · " + hh.name : "-";
  }

  function render() {
    var body = $("#affTableBody");
    if (!body) return;
    if (!state.summary.length) { body.innerHTML = '<tr><td colspan="12">ยังไม่มีหัวบ้าน</td></tr>'; return; }
    body.innerHTML = state.summary.map(function(s) {
      var refLink = window.location.origin + "/order?ref=" + encodeURIComponent(s.code);
      return '<tr data-hh-id="' + esc(s.head_house_id) + '">' +
        '<td><strong>' + esc(s.code) + '</strong></td>' +
        '<td>' + esc(s.name) + '<br><small class="aff-link" data-copy="' + esc(refLink) + '" title="คลิกคัดลอกลิงก์ชวน">🔗 ลิงก์ชวน</small></td>' +
        '<td>' + (s.parent_head_house_id ? esc(getHHName(s.parent_head_house_id)) : '<span class="muted">-</span>') + '</td>' +
        '<td class="num">' + Number(s.tier1_pct).toFixed(2) + '%</td>' +
        '<td class="num">' + Number(s.tier2_pct).toFixed(2) + '%</td>' +
        '<td class="num">' + money(s.tier1_stake) + '</td>' +
        '<td class="num">' + money(s.tier1_owed) + '</td>' +
        '<td class="num">' + money(s.tier2_owed) + (s.tier2_breakdown.length ? ' <small>(' + s.tier2_breakdown.length + ' downline)</small>' : '') + '</td>' +
        '<td class="num"><strong>' + money(s.total_owed) + '</strong></td>' +
        '<td class="num">' + money(s.paid) + '</td>' +
        '<td class="num"' + (s.balance > 0 ? ' style="color:#dc2626;font-weight:700"' : '') + '>' + money(s.balance) + '</td>' +
        '<td>' +
          '<button type="button" class="button-mini btn-copy-ref" data-link="' + esc(refLink) + '" data-name="' + esc(s.name) + '">📋 คัดลอกลิงก์</button> ' +
          (s.balance > 0 ? '<button type="button" class="button-mini btn-pay" data-hh-id="' + esc(s.head_house_id) + '" data-balance="' + s.balance + '" data-name="' + esc(s.name) + '">💸 จ่าย</button> ' : '') +
          '<button type="button" class="button-mini btn-detail" data-hh-id="' + esc(s.head_house_id) + '">📊 รายละเอียด</button>' +
        '</td>' +
      '</tr>';
    }).join("");

    body.querySelectorAll(".aff-link").forEach(function(el) {
      el.addEventListener("click", function() {
        var url = el.dataset.copy;
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(function() {
          if (window.showToast) window.showToast("คัดลอกลิงก์ชวนแล้ว", "success");
        });
      });
    });
    body.querySelectorAll(".btn-pay").forEach(function(btn) {
      btn.addEventListener("click", function() { openPayoutDialog(btn.dataset.hhId, Number(btn.dataset.balance), btn.dataset.name); });
    });
    body.querySelectorAll(".btn-detail").forEach(function(btn) {
      btn.addEventListener("click", function() { openDetailDialog(btn.dataset.hhId); });
    });
    body.querySelectorAll(".btn-copy-ref").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var url = btn.dataset.link;
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(function() {
          if (window.showToast) window.showToast("คัดลอกลิงก์ของ " + btn.dataset.name + " แล้ว — ส่งใน LINE ได้เลย", "success");
        });
      });
    });
  }

  async function openPayoutDialog(hhId, balance, name) {
    var amount = window.prompt("จ่ายค่าแนะนำให้ " + name + "\n\nยอดคงค้าง: " + money(balance) + "\nกรอกจำนวนที่จะจ่าย (บาท):", String(Math.floor(balance)));
    if (!amount) return;
    var note = window.prompt("หมายเหตุ (ไม่บังคับ):", "จ่ายค่าแนะนำ " + new Date().toLocaleDateString("th-TH-u-ca-buddhist"));
    var fetcher = window.api || function(p, o) { return fetch(p, { method: o.method, headers: { "Content-Type": "application/json" }, body: o.body }).then(function(r) { if (!r.ok) throw new Error("http_" + r.status); return r.json(); }); };
    try {
      await fetcher("/api/admin/affiliate/" + encodeURIComponent(hhId) + "/payout", {
        method: "POST",
        body: { amount: Number(amount), note: note || "" },
      });
      if (window.showToast) window.showToast("บันทึกการจ่าย " + money(Number(amount)) + " ให้ " + name + " แล้ว", "success");
      await load();
    } catch (err) {
      alert("จ่ายไม่สำเร็จ: " + (err.message || ""));
    }
  }

  async function openDetailDialog(hhId) {
    var fetcher = window.api || function(p) { return fetch(p).then(function(r) { if (!r.ok) throw new Error("http"); return r.json(); }); };
    var data;
    try { data = await fetcher("/api/admin/affiliate/" + encodeURIComponent(hhId)); }
    catch (e) { alert("โหลดข้อมูลไม่สำเร็จ"); return; }

    var dialog = $("#affDetailDialog");
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.id = "affDetailDialog";
      dialog.className = "winners-dialog";
      dialog.innerHTML = '<header class="winners-dialog-header"><div><strong id="affDDTitle">รายละเอียด</strong><small id="affDDSub"></small></div><button type="button" class="winners-dialog-close" aria-label="ปิด">✕</button></header><div id="affDDBody" class="winners-dialog-body"></div>';
      document.body.appendChild(dialog);
      dialog.querySelector(".winners-dialog-close").addEventListener("click", function() { dialog.close(); });
      dialog.addEventListener("click", function(e) { if (e.target === dialog) dialog.close(); });
    }
    $("#affDDTitle").textContent = "💰 " + data.code + " · " + data.name;
    $("#affDDSub").textContent = "ยอดคงค้าง " + money(data.balance);

    var tier1Html = data.tier1Customers.length ? '<h4>👥 ลูกค้าใต้สังกัด (Affiliate — ' + Number(data.tier1_pct).toFixed(2) + '%)</h4>' +
      '<div class="winners-table-wrap"><table class="winners-table"><thead><tr><th>รหัส</th><th>ชื่อ</th><th class="num">บิล</th><th class="num">ยอดแทง</th><th class="num">ค่าแนะนำ</th></tr></thead><tbody>' +
      data.tier1Customers.map(function(c) {
        var amt = c.stake * data.tier1_pct / 100;
        return '<tr><td>' + esc(c.code) + '</td><td>' + esc(c.line_display_name || c.name) + '</td><td class="num">' + c.ticket_count + '</td><td class="num">' + money(c.stake) + '</td><td class="num win-amt">' + money(amt) + '</td></tr>';
      }).join("") + '</tbody></table></div>' : '<p class="muted">ยังไม่มีลูกค้าใต้สังกัด</p>';

    var tier2Html = data.tier2_breakdown.length ? '<h4>🏛 หัวบ้านลูก (Affiliate Tier 2)</h4>' +
      '<div class="winners-table-wrap"><table class="winners-table"><thead><tr><th>รหัส</th><th>หัวบ้านลูก</th><th class="num">ยอดรวม</th><th class="num">% Affiliate Tier 2</th><th class="num">ค่าแนะนำ</th></tr></thead><tbody>' +
      data.tier2_breakdown.map(function(b) {
        return '<tr><td>' + esc(b.child_code) + '</td><td>' + esc(b.child_name) + '</td><td class="num">' + money(b.stake) + '</td><td class="num">' + b.pct.toFixed(2) + '%</td><td class="num win-amt">' + money(b.amount) + '</td></tr>';
      }).join("") + '</tbody></table></div>' : "";

    var payHtml = data.payouts.length ? '<h4>📜 ประวัติการจ่าย</h4>' +
      '<div class="winners-table-wrap"><table class="winners-table"><thead><tr><th>วันที่</th><th class="num">จำนวน</th><th>หมายเหตุ</th><th>ผู้จ่าย</th></tr></thead><tbody>' +
      data.payouts.map(function(p) {
        return '<tr><td>' + esc(new Date(p.created_at).toLocaleString("th-TH-u-ca-buddhist")) + '</td><td class="num">' + money(p.amount) + '</td><td>' + esc(p.note || "-") + '</td><td>' + esc(p.paid_by_username || "-") + '</td></tr>';
      }).join("") + '</tbody></table></div>' : "";

    $("#affDDBody").innerHTML = '<div class="winners-summary">' +
      '<div><span class="muted">รวมต้องจ่าย</span><strong>' + money(data.total_owed) + '</strong></div>' +
      '<div><span class="muted">จ่ายแล้ว</span><strong>' + money(data.paid) + '</strong></div>' +
      '<div><span class="muted">คงค้าง</span><strong style="color:' + (data.balance > 0 ? "#dc2626" : "#16a34a") + '">' + money(data.balance) + '</strong></div>' +
      '</div>' + tier1Html + tier2Html + payHtml;

    if (typeof dialog.showModal === "function") dialog.showModal();
  }

  function watch() {
    var v = document.querySelector('[data-view="affiliate"]');
    if (v && !v.hidden) {
      if (!state.loaded) load();
      var btn = $("#affRefresh");
      if (btn && !btn.dataset.bound) { btn.dataset.bound = "1"; btn.addEventListener("click", load); }
    }
  }
  setInterval(watch, 800);
  console.log("[affiliate] loaded");
})();

/* ===== MY AFFILIATE HUB (P2 — full dashboard) ===== */
(function myAffiliateModule() {
  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
  function money(n) { return Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " ฿"; }
  var mstate = { loaded: false, lastLoad: 0 };

  function quickActions(role) {
    /* Only show quick actions for affiliate; head_house_viewer just sees stats */
    if (role !== "affiliate") return "";
    return '<div class="my-aff-quick-actions">' +
      '<button type="button" class="my-aff-action-card" data-go="intake">' +
        '<span class="ico">✍️</span><span class="lbl">คีย์บิลให้ลูกค้า</span>' +
        '<span class="sub">รับเลขแล้วบันทึกเข้าระบบ</span></button>' +
      '<button type="button" class="my-aff-action-card" data-go="entries">' +
        '<span class="ico">📋</span><span class="lbl">รายการบิล</span>' +
        '<span class="sub">บิลทั้งหมดของลูกค้าคุณ</span></button>' +
      '<button type="button" class="my-aff-action-card" data-go="customers">' +
        '<span class="ico">👥</span><span class="lbl">ลูกค้าของคุณ</span>' +
        '<span class="sub">รายชื่อลูกค้าที่ใช้ลิงก์คุณ</span></button>' +
      '<button type="button" class="my-aff-action-card" data-go="results">' +
        '<span class="ico">🎁</span><span class="lbl">ผลรางวัล</span>' +
        '<span class="sub">เช็คผลล่าสุดทุกหวย</span></button>' +
      '<button type="button" class="my-aff-action-card" data-go="rulesAff">' +
        '<span class="ico">📜</span><span class="lbl">กติกา + วิธีใช้</span>' +
        '<span class="sub">ค่าคอม · วิธีแชร์ลิงก์</span></button>' +
    '</div>';
  }

  async function load() {
    var content = $("#myAffiliateContent");
    if (!content) return;
    try {
      var fetcher = window.api || function(p) { return fetch(p).then(function(r) { if (!r.ok) throw new Error("http"); return r.json(); }); };
      var d = await fetcher("/api/me/affiliate-self");
      var role = (window.state && window.state.user && window.state.user.role) || "head_house_viewer";
      var refLink = window.location.origin + "/order?ref=" + encodeURIComponent(d.head_house_code);

      content.innerHTML =
        '<div class="my-aff-hero"><strong>' + esc(d.head_house_name) + '</strong><small>' + esc(d.head_house_code) + '</small></div>' +
        quickActions(role) +
        '<div class="my-aff-link-card">' +
          '<div class="my-aff-link-label">🔗 ลิงก์ชวนของคุณ</div>' +
          '<div class="my-aff-link-url" id="myAffLinkUrl">' + esc(refLink) + '</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            '<button type="button" class="button button-primary" id="myAffCopyBtn">📋 คัดลอกลิงก์</button>' +
            '<button type="button" class="button button-secondary" id="myAffCopyMsg">💬 คัดลอกข้อความ LINE</button>' +
          '</div>' +
        '</div>' +
        '<div class="my-aff-stats">' +
          '<div class="stat-card"><span>ลูกค้าใต้สังกัด</span><strong>' + d.customerCount.toLocaleString("th-TH") + ' คน</strong></div>' +
          '<div class="stat-card"><span>ยอดแทงสะสม</span><strong>' + money(d.tier1_stake) + '</strong></div>' +
          '<div class="stat-card"><span>ค่าคอม (' + Number(d.tier1_pct).toFixed(2) + '%)</span><strong style="color:var(--gold,#c8990b)">' + money(d.tier1_owed) + '</strong></div>' +
          (d.tier2_owed > 0 ? '<div class="stat-card"><span>Tier 2 (จากหัวบ้านลูก)</span><strong>' + money(d.tier2_owed) + ' (' + d.tier2_breakdown.length + ' หัวบ้าน)</strong></div>' : '') +
          '<div class="stat-card highlight"><span>รวมต้องจ่ายให้คุณ</span><strong style="color:var(--primary,#0f5132)">' + money(d.total_owed) + '</strong></div>' +
          '<div class="stat-card"><span>จ่ายไปแล้ว</span><strong>' + money(d.paid) + '</strong></div>' +
          '<div class="stat-card highlight"><span>คงค้าง</span><strong style="color:' + (d.balance > 0 ? "#dc2626" : "#16a34a") + '">' + money(d.balance) + '</strong></div>' +
        '</div>' +
        (d.payouts.length ? '<h3 style="margin-top:20px">📜 ประวัติการรับเงิน</h3>' +
          '<table class="affiliate-table"><thead><tr><th>วันที่</th><th class="num">จำนวน</th><th>หมายเหตุ</th></tr></thead><tbody>' +
          d.payouts.map(function(p) {
            return '<tr><td>' + esc(new Date(p.created_at).toLocaleString("th-TH-u-ca-buddhist")) + '</td><td class="num">' + money(p.amount) + '</td><td>' + esc(p.note || "-") + '</td></tr>';
          }).join("") + '</tbody></table>' : '<p class="muted" style="margin-top:20px">ยังไม่เคยมีการจ่ายเงิน</p>');

      $("#myAffCopyBtn").addEventListener("click", function() {
        if (navigator.clipboard) navigator.clipboard.writeText(refLink).then(function() {
          if (window.showToast) window.showToast("คัดลอกลิงก์แล้ว — ส่งให้ลูกค้าใน LINE ได้เลย!", "success");
        });
      });
      var msgBtn = $("#myAffCopyMsg");
      if (msgBtn) msgBtn.addEventListener("click", function() {
        var msg = "🎰 บ้านหวยเรือนเลขเศรษฐี\n\nแทงหวยผ่านระบบเรา — สะดวก จ่ายตรงเวลา\n\n👉 " + refLink + "\n\nกดเปิดลิงก์ + add LINE OA หลักของเรา แล้วคีย์เลขได้เลย";
        if (navigator.clipboard) navigator.clipboard.writeText(msg).then(function() {
          if (window.showToast) window.showToast("คัดลอกข้อความ LINE แล้ว", "success");
        });
      });
      /* Wire quick action cards */
      content.querySelectorAll(".my-aff-action-card").forEach(function(card) {
        card.addEventListener("click", function() {
          var v = card.dataset.go;
          if (v && window.activateView) window.activateView(v);
        });
      });
      mstate.loaded = true;
      mstate.lastLoad = Date.now();
    } catch (err) {
      content.innerHTML = '<div class="empty-state">โหลดข้อมูลไม่สำเร็จ: ' + esc(err.message || "") + '</div>';
    }
  }
  function watch() {
    var v = document.querySelector('[data-view="myAffiliate"]');
    /* Reload if view active AND (never loaded OR last load > 30s ago) */
    if (v && !v.hidden && (!mstate.loaded || Date.now() - mstate.lastLoad > 30000)) load();
  }
  setInterval(watch, 800);
  console.log("[my-affiliate] hub loaded");
})();


/* ===== HEAD HOUSE DETAIL DIALOG (2026-05-23) ===== */
(function headHouseDetailModule() {
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
  function money(n) { return Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " ฿"; }

  async function openDetail(hhId) {
    const fetcher = window.api || function(p) { return fetch(p).then(r => { if (!r.ok) throw new Error("http_" + r.status); return r.json(); }); };

    // Find head_house
    const hh = (window.state && window.state.headHouses || []).find(x => x.id === hhId);
    if (!hh) { alert("ไม่พบข้อมูลหัวบ้าน"); return; }

    // Fetch viewer credentials + affiliate summary in parallel
    let creds = null, affil = null;
    try { creds = await fetcher("/api/head-houses/" + encodeURIComponent(hhId) + "/viewer-credentials"); }
    catch (e) { creds = { error: e.message || "no_viewer" }; }
    try { affil = await fetcher("/api/admin/affiliate/" + encodeURIComponent(hhId)); }
    catch (e) { affil = null; }

    showDialog(hh, creds, affil);
  }

  function showDialog(hh, creds, affil) {
    let dialog = document.querySelector("#hhDetailDialog");
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.id = "hhDetailDialog";
      dialog.className = "winners-dialog hh-detail-dialog";
      dialog.innerHTML = '<header class="winners-dialog-header"><div><strong id="hhDDTitle"></strong><small id="hhDDSub"></small></div><button type="button" class="winners-dialog-close" aria-label="ปิด">✕</button></header><div id="hhDDBody" class="winners-dialog-body"></div>';
      document.body.appendChild(dialog);
      dialog.querySelector(".winners-dialog-close").addEventListener("click", () => dialog.close());
      dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });
    }
    document.querySelector("#hhDDTitle").textContent = "🏠 " + hh.code + " · " + hh.name;
    document.querySelector("#hhDDSub").textContent = hh.note || "ไม่มีหมายเหตุ";

    // --- Basic info section ---
    const basicHtml =
      '<section class="hh-detail-section">' +
        '<h4>📋 ข้อมูลพื้นฐาน</h4>' +
        '<div class="hh-info-grid">' +
          '<div><span>รหัส</span><strong>' + esc(hh.code) + '</strong></div>' +
          '<div><span>ชื่อ</span><strong>' + esc(hh.name) + '</strong></div>' +
          '<div><span>หมายเหตุ</span><strong>' + esc(hh.note || "-") + '</strong></div>' +
          '<div><span>% Affiliate</span><strong>' + Number(hh.commission_percent || 0).toFixed(2) + '%</strong></div>' +
          '<div><span>หัวบ้านพ่อ</span><strong>' + (hh.parent_head_house_id ? esc(((window.state||{}).headHouses||[]).find(x => x.id === hh.parent_head_house_id)?.name || hh.parent_head_house_id) : '<span class="muted">-</span>') + '</strong></div>' +
          '<div><span>% Affiliate Tier 2 (ให้พ่อ)</span><strong>' + Number(hh.tier2_percent || 0).toFixed(2) + '%</strong></div>' +
        '</div>' +
      '</section>';

    // --- Viewer credentials section ---
    let credsHtml = '<section class="hh-detail-section"><h4>🔑 บัญชีเข้าระบบ (สำหรับหัวบ้าน)</h4>';
    if (creds && creds.error) {
      credsHtml += '<p class="muted">ยังไม่มีบัญชี — กดปุ่ม "สร้างบัญชีหัวบ้าน" ในรายการหัวบ้าน</p>';
    } else if (creds) {
      const pwdValue = creds.password || "";
      const hasPassword = !!creds.password;
      credsHtml +=
        '<div class="hh-creds-card">' +
          '<div class="hh-creds-row"><span>🔗 ลิงก์เข้าระบบ</span><code>' + esc(window.location.origin) + '</code></div>' +
          '<div class="hh-creds-row"><span>👤 Username</span><code id="hhCredUser">' + esc(creds.username) + '</code></div>' +
          '<div class="hh-creds-row"><span>🔑 Password</span>' +
            (hasPassword
              ? '<code id="hhCredPwd" data-pwd="' + esc(pwdValue) + '" style="filter:blur(4px);transition:filter 0.2s">' + esc(pwdValue) + '</code>' +
                '<button type="button" class="button-mini" id="hhCredPwdToggle">👁 แสดง</button>'
              : '<em class="muted">เก็บไว้ก่อนระบบอัพเดท — ต้อง "รีเซ็ตรหัส" ครั้งเดียวเพื่อเก็บเข้าตู้เซฟ</em>') +
          '</div>' +
          '<div class="hh-creds-actions">' +
            (hasPassword ? '<button type="button" class="button button-primary" id="hhCredCopyLine">💬 คัดลอกข้อความ LINE</button>' : '') +
            (hasPassword ? '<button type="button" class="button button-secondary" id="hhCredCopyShort">📋 คัดลอกสั้น</button>' : '') +
            '<button type="button" class="button button-secondary" id="hhCredReset">🔄 รีเซ็ตรหัสใหม่</button>' +
          '</div>' +
        '</div>';
    } else {
      credsHtml += '<p class="muted">โหลดข้อมูลไม่สำเร็จ</p>';
    }
    credsHtml += '</section>';

    // --- Affiliate section ---
    let affilHtml = '<section class="hh-detail-section"><h4>💰 ยอด Affiliate</h4>';
    if (affil) {
      affilHtml +=
        '<div class="hh-info-grid">' +
          '<div><span>จำนวนลูกค้า</span><strong>' + (affil.tier1Customers?.length || 0).toLocaleString("th-TH") + ' คน</strong></div>' +
          '<div><span>ยอดแทงรวม (Affiliate)</span><strong>' + money(affil.tier1_stake) + '</strong></div>' +
          '<div><span>Affiliate</span><strong>' + money(affil.tier1_owed) + '</strong></div>' +
          '<div><span>Affiliate Tier 2</span><strong>' + money(affil.tier2_owed) + '</strong></div>' +
          '<div><span>รวมต้องจ่าย</span><strong>' + money(affil.total_owed) + '</strong></div>' +
          '<div><span>จ่ายแล้ว</span><strong>' + money(affil.paid) + '</strong></div>' +
          '<div class="hh-info-highlight"><span>คงค้าง</span><strong style="color:' + (affil.balance > 0 ? "#dc2626" : "#16a34a") + '">' + money(affil.balance) + '</strong></div>' +
        '</div>';
    } else {
      affilHtml += '<p class="muted">โหลดข้อมูลไม่สำเร็จ</p>';
    }
    affilHtml += '</section>';

    // --- Payouts history ---
    let payHtml = '';
    if (affil && affil.payouts && affil.payouts.length) {
      payHtml = '<section class="hh-detail-section"><h4>📜 ประวัติการจ่าย</h4>' +
        '<div class="winners-table-wrap"><table class="winners-table"><thead><tr><th>วันที่</th><th class="num">จำนวน</th><th>หมายเหตุ</th><th>ผู้จ่าย</th></tr></thead><tbody>' +
        affil.payouts.map(p => '<tr><td>' + esc(new Date(p.created_at).toLocaleString("th-TH-u-ca-buddhist")) + '</td><td class="num">' + money(p.amount) + '</td><td>' + esc(p.note || "-") + '</td><td>' + esc(p.paid_by_username || "-") + '</td></tr>').join("") +
        '</tbody></table></div></section>';
    }

    /* FEAT hh-bills: รายการบิลของหัวบ้าน */
    let billsHtml = '<section class="hh-detail-section"><h4>🧾 รายการบิลของหัวบ้าน</h4>';
    try {
      const allTickets = (window.state && window.state.tickets || []).filter(t => t.head_house_id === hh.id);
      const allEntries = (window.state && window.state.entries || []);
      const sorted = allTickets.slice().sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
      const recent = sorted.slice(0, 20);
      const totalStake = sorted.reduce((s, t) => {
        const entries = allEntries.filter(e => e.ticket_id === t.id);
        return s + entries.reduce((a, e) => a + (Number(e.amount) || 0), 0);
      }, 0);
      const approvedTotal = sorted
        .filter(t => t.status !== "cancelled")
        .reduce((s, t) => s + allEntries.filter(e => e.ticket_id === t.id).reduce((a, e) => a + (Number(e.amount) || 0), 0), 0);
      billsHtml += '<div class="hh-info-grid" style="margin-bottom:12px;">' +
        '<div><span>จำนวนบิล</span><strong>' + sorted.length.toLocaleString("th-TH") + '</strong></div>' +
        '<div><span>ยอดอนุมัติทั้งหมด</span><strong>' + money(approvedTotal) + '</strong></div>' +
        '<div><span>ยอดรวมทุกสถานะ</span><strong>' + money(totalStake) + '</strong></div>' +
        '</div>';
      if (!recent.length) {
        billsHtml += '<p class="muted">ยังไม่มีบิลในหัวบ้านนี้</p>';
      } else {
        const lookupRound = (id) => (window.state.rounds || []).find(r => r.id === id);
        const lookupLottery = (id) => (window.state.lotteries || []).find(l => l.id === id)?.name || "-";
        const lookupCust = (id) => {
          const c = (window.state.customers || []).find(x => x.id === id);
          return c?.line_display_name || c?.name || c?.code || "-";
        };
        const statusPill = (s) => {
          const map = { approved: ["success","อนุมัติแล้ว"], pending_review: ["warning","รอตรวจ"], rejected: ["danger","ตีกลับ"], cancelled: ["muted","ยกเลิก"] };
          const [cls, label] = map[s] || ["muted", s || "-"];
          return '<span class="status-pill ' + cls + '">' + label + '</span>';
        };
        billsHtml += '<div class="winners-table-wrap"><table class="winners-table"><thead><tr>' +
          '<th>บิล</th><th>งวด</th><th>ลูกค้า</th><th class="num">เลข</th><th class="num">ยอด</th><th>สถานะ</th>' +
          '</tr></thead><tbody>';
        for (const t of recent) {
          const ent = allEntries.filter(e => e.ticket_id === t.id);
          const round = lookupRound(t.round_id);
          const roundLabel = round ? (lookupLottery(round.lottery_id) + " · " + (round.label || "")) : "-";
          const total = ent.reduce((a, e) => a + (Number(e.amount) || 0), 0);
          billsHtml += '<tr>' +
            '<td><strong>' + esc(t.code) + '</strong></td>' +
            '<td>' + esc(roundLabel) + '</td>' +
            '<td>' + esc(lookupCust(t.customer_id)) + '</td>' +
            '<td class="num">' + ent.length + '</td>' +
            '<td class="num">' + money(total) + '</td>' +
            '<td>' + statusPill(t.status) + '</td>' +
            '</tr>';
        }
        billsHtml += '</tbody></table></div>';
        if (sorted.length > 20) {
          billsHtml += '<p class="muted" style="text-align:right;margin-top:8px;">แสดงล่าสุด 20 / ทั้งหมด ' + sorted.length + '</p>';
        }
      }
    } catch (e) {
      billsHtml += '<p class="muted">โหลดรายการบิลไม่สำเร็จ: ' + esc(e.message) + '</p>';
    }
    billsHtml += '</section>';

    document.querySelector("#hhDDBody").innerHTML = basicHtml + credsHtml + affilHtml + billsHtml + payHtml;

    // Wire up password toggle + copy + reset
    const pwdEl = document.querySelector("#hhCredPwd");
    const toggleBtn = document.querySelector("#hhCredPwdToggle");
    if (toggleBtn && pwdEl) {
      toggleBtn.addEventListener("click", () => {
        const shown = pwdEl.style.filter === "none" || pwdEl.style.filter === "";
        pwdEl.style.filter = shown ? "blur(4px)" : "none";
        toggleBtn.textContent = shown ? "👁 แสดง" : "🙈 ซ่อน";
      });
      // Start blurred
      pwdEl.style.filter = "blur(4px)";
    }

    const lineBtn = document.querySelector("#hhCredCopyLine");
    if (lineBtn) lineBtn.addEventListener("click", () => copyLineMessage(hh, creds));

    const shortBtn = document.querySelector("#hhCredCopyShort");
    if (shortBtn) shortBtn.addEventListener("click", () => copyShort(creds));

    const resetBtn = document.querySelector("#hhCredReset");
    if (resetBtn) resetBtn.addEventListener("click", async () => {
      if (!(await confirmDialog({ title: "รีเซ็ตรหัสผ่าน", body: "รีเซ็ตรหัสผ่านใหม่ของ " + hh.name + "?\nรหัสเดิมจะใช้ไม่ได้ทันที", danger: true }))) return;
      const fetcher = window.api || function(p, o) { return fetch(p, { method: o.method, headers: { "Content-Type": "application/json" } }).then(r => { if (!r.ok) throw new Error("http"); return r.json(); }); };
      try {
        await fetcher("/api/head-houses/" + encodeURIComponent(hh.id) + "/viewer-account/reset-password", { method: "POST" });
        if (window.showToast) window.showToast("รีเซ็ตรหัสสำเร็จ — โหลดข้อมูลใหม่...", "success");
        // Reload dialog
        setTimeout(() => openDetail(hh.id), 500);
      } catch (e) { alert("รีเซ็ตไม่สำเร็จ: " + (e.message || "")); }
    });

    if (typeof dialog.showModal === "function") dialog.showModal();
  }

  async function copyShort(creds) {
    if (!creds || !creds.password) return;
    const text = "ลิงก์: " + window.location.origin + "\nUsername: " + creds.username + "\nPassword: " + creds.password;
    try { await navigator.clipboard.writeText(text); if (window.showToast) window.showToast("คัดลอกแล้ว", "success"); }
    catch { alert("คัดลอกไม่สำเร็จ"); }
  }

  async function copyLineMessage(hh, creds) {
    if (!creds || !creds.password) return;
    const text =
      "🎉 ระบบ Affiliate ของคุณพร้อมแล้ว!\n\n" +
      "สวัสดีครับ/ค่ะ " + hh.name + "\n" +
      "แอดมินสร้างบัญชีเข้าระบบให้คุณเรียบร้อยแล้ว ใช้ดูยอดและรับลิงก์ชวนของตัวเองได้เลย\n\n" +
      "🔗 เปิดที่: " + window.location.origin + "\n" +
      "👤 Username: " + creds.username + "\n" +
      "🔑 Password: " + creds.password + "\n\n" +
      "วิธีใช้:\n" +
      "1. กดลิงก์ด้านบน → ใส่ username + password\n" +
      '2. ระบบจะพาเข้าหน้า "💰 Affiliate ของฉัน" อัตโนมัติ\n' +
      '3. กดปุ่ม "📋 คัดลอกลิงก์" แล้วส่งลิงก์ให้ลูกค้าใน LINE\n' +
      "4. ลูกค้าที่กดลิงก์จะถูกผูกกับคุณอัตโนมัติ\n\n" +
      "รบกวนเปลี่ยนรหัสผ่านหลังเข้าใช้ครั้งแรกนะครับ 🙏";
    try { await navigator.clipboard.writeText(text); if (window.showToast) window.showToast("คัดลอกข้อความ LINE แล้ว — paste ส่งให้หัวบ้านได้เลย", "success"); }
    catch { alert("คัดลอกไม่สำเร็จ"); }
  }

  // Wire up "ดูข้อมูล" button via event delegation
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".hh-detail-button");
    if (btn) openDetail(btn.dataset.headHouseId);
  });

  // Expose globally
  window.openHeadHouseDetail = openDetail;

  console.log("[hh-detail] loaded");
})();


/* ===== LIMITS TOOLS (2026-05-23) ===== */
(function limitsToolsModule() {
  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
  function money(n) { return Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " ฿"; }
  function num(n) { return Number(n || 0).toLocaleString("th-TH"); }

  const state = { loaded: false, currentRoundId: null, hotData: null, riskData: null };

  function fetcher(p, opts) {
    if (window.api) return window.api(p, opts);
    return fetch(p, opts || {}).then(r => { if (!r.ok) throw new Error("http_" + r.status); return r.json(); });
  }

  function activeRoundOptions() {
    // Active rounds = those with status pending_review/approved entries OR no result yet
    const rounds = (window.state || {}).rounds || [];
    const sorted = rounds.slice().sort((a, b) => (b.draw_date || "").localeCompare(a.draw_date || ""));
    return sorted.map(r => {
      const lotName = (window.state.lotteries || []).find(l => l.id === r.lottery_id)?.name || "?";
      return { id: r.id, label: lotName + " · " + (r.label || r.draw_date || "?") };
    });
  }

  function populateRoundSelector() {
    const sel = $("#limitToolsRound");
    if (!sel) return;
    const opts = activeRoundOptions();
    const cur = sel.value;
    sel.innerHTML = '<option value="">— เลือกงวด —</option>' + opts.map(o => '<option value="' + esc(o.id) + '">' + esc(o.label) + '</option>').join("");
    if (cur && opts.find(o => o.id === cur)) sel.value = cur;
    else if (opts.length) sel.value = opts[0].id;
    state.currentRoundId = sel.value || null;
  }

  async function loadAll() {
    if (!state.currentRoundId) return;
    try {
      const [hot, risk] = await Promise.all([
        fetcher("/api/admin/limits/top-numbers/" + encodeURIComponent(state.currentRoundId)),
        fetcher("/api/admin/limits/risk/" + encodeURIComponent(state.currentRoundId)),
      ]);
      state.hotData = hot;
      state.riskData = risk;
      renderHot();
      renderRisk();
      $("#limitHotUpdate").textContent = "อัพเดท " + new Date().toLocaleTimeString("th-TH-u-ca-buddhist");
    } catch (e) {
      console.error("[limit-tools] load failed", e);
    }
  }

  function renderHot() {
    const body = $("#limitHotBody");
    const empty = $("#limitHotEmpty");
    if (!body) return;
    const items = (state.hotData?.items || []).slice(0, 30);
    if (!items.length) { body.innerHTML = ""; empty.classList.remove("hidden"); return; }
    empty.classList.add("hidden");
    body.innerHTML = items.map((it, idx) => {
      const cap = it.current_limit;
      const pctStr = cap ? Number(it.percent_used).toFixed(0) + "%" : "—";
      const capStr = cap ? money(cap) : '<span class="muted">ไม่มี</span>';
      const alertCls = it.alert === "over" ? "alert-over" : it.alert === "near" ? "alert-near" : it.alert === "no_cap" ? "alert-nocap" : "";
      const alertLabel = it.alert === "over" ? "🔴 เกิน" : it.alert === "near" ? "🟡 ใกล้" : it.alert === "no_cap" ? "⚪ ยังไม่มี" : "🟢 ปกติ";
      return '<tr class="' + alertCls + '">' +
        '<td>' + (idx + 1) + '</td>' +
        '<td>' + esc(it.bet_type_name) + '</td>' +
        '<td><span class="number-pill">' + esc(it.number) + '</span></td>' +
        '<td class="num">' + num(it.bet_count) + '</td>' +
        '<td class="num"><strong>' + money(it.total_amount) + '</strong></td>' +
        '<td class="num">' + capStr + '</td>' +
        '<td class="num">' + pctStr + '</td>' +
        '<td>' + alertLabel + '</td>' +
        '<td><button type="button" class="button-mini btn-quick-cap" data-bt="' + esc(it.bet_type_id) + '" data-num="' + esc(it.number) + '">⚙ อั้นเลย</button></td>' +
      '</tr>';
    }).join("");
    body.querySelectorAll(".btn-quick-cap").forEach(btn => {
      btn.addEventListener("click", () => quickCap(btn.dataset.bt, btn.dataset.num));
    });
  }

  function renderRisk() {
    const body = $("#limitRiskBody");
    const empty = $("#limitRiskEmpty");
    const rev = $("#limitRiskRevenue");
    if (!body) return;
    const items = (state.riskData?.items || []).slice(0, 30);
    if (rev) rev.textContent = "รายรับงวดนี้: " + money(state.riskData?.total_revenue || 0);
    if (!items.length) { body.innerHTML = ""; empty.classList.remove("hidden"); return; }
    empty.classList.add("hidden");
    body.innerHTML = items.map((it, idx) => {
      const isLoss = it.net_risk > 0;
      const riskCls = it.net_risk > 10000 ? "risk-high" : it.net_risk > 0 ? "risk-medium" : "risk-safe";
      return '<tr class="' + riskCls + '">' +
        '<td>' + (idx + 1) + '</td>' +
        '<td>' + esc(it.bet_type_name) + '</td>' +
        '<td><span class="number-pill">' + esc(it.number) + '</span></td>' +
        '<td class="num">' + money(it.total_amount) + '</td>' +
        '<td class="num">' + Number(it.payout_rate).toLocaleString("th-TH") + '</td>' +
        '<td class="num">' + money(it.potential_payout) + '</td>' +
        '<td class="num"><strong style="color:' + (isLoss ? "#dc2626" : "#16a34a") + '">' + (isLoss ? "-" : "+") + money(Math.abs(it.net_risk)) + '</strong></td>' +
      '</tr>';
    }).join("");
  }

  async function quickCap(betTypeId, number) {
    const amountStr = window.prompt("ตั้งอั้นเลข " + number + " (" + ((window.state.betTypes || []).find(b => b.id === betTypeId)?.name || "") + ")\nกรอกยอดอั้นสูงสุด (บาท):", "500");
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (!Number.isFinite(amount) || amount <= 0) { alert("กรอกตัวเลขให้ถูกต้อง"); return; }
    try {
      await fetcher("/api/limits/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {
          roundId: state.currentRoundId,
          betTypeId,
          maxAmount: amount,
          mode: "selected",
          numbers: [number],
          overwrite: true,
        },
      });
      if (window.showToast) window.showToast("ตั้งอั้นเลข " + number + " ที่ " + money(amount) + " แล้ว", "success");
      await loadAll();
      if (window.refreshState) await window.refreshState();
    } catch (e) { alert("ตั้งอั้นไม่สำเร็จ: " + (e.message || "")); }
  }

  // --- Bulk add dialog ---
  function openBulkDialog() {
    if (!state.currentRoundId) { alert("เลือกงวดก่อน"); return; }
    const betTypes = (window.state || {}).betTypes || [];
    const btOpts = betTypes.map(b => '<option value="' + esc(b.id) + '">' + esc(b.name) + ' (' + b.digits + ' หลัก)</option>').join("");
    let dialog = $("#limitBulkDialog");
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.id = "limitBulkDialog";
      dialog.className = "winners-dialog";
      document.body.appendChild(dialog);
    }
    dialog.innerHTML = '<header class="winners-dialog-header"><div><strong>📦 🎯 อั้นทีละหลายตัว</strong><small>เลือกชุดเลข + เพดาน → กดบันทึกทีเดียวจบ</small></div><button type="button" class="winners-dialog-close" aria-label="ปิด">✕</button></header>' +
      '<div class="winners-dialog-body">' +
        '<div class="field-grid">' +
          '<label class="field"><span>ประเภทเลข</span><select id="bulkBetType">' + btOpts + '</select></label>' +
          '<label class="field"><span>เพดานต่อเลข (บาท)</span><input type="number" id="bulkMaxAmount" value="500" min="0" step="50"/></label>' +
        '</div>' +
        '<div class="field"><span>ชุดเลขที่จะตั้ง</span>' +
          '<select id="bulkMode">' +
            '<option value="all">ทุกเลข (00–99 / 000–999)</option>' +
            '<option value="doubles">เลขซ้ำ (00,11,...,99 / 000,111,...,999)</option>' +
            '<option value="previous_result">เลขที่ออกงวดก่อน</option>' +
            '<option value="selected">เลขที่พิมพ์เอง (คั่นด้วย ,)</option>' +
          '</select>' +
        '</div>' +
        '<div id="bulkSelectedWrap" class="field" style="display:none"><span>เลขที่ต้องการ (เช่น 45,99,12)</span><input type="text" id="bulkSelectedNumbers" placeholder="45,99,12"/></div>' +
        '<label class="field-checkbox"><input type="checkbox" id="bulkOverwrite"/> เขียนทับเพดานเดิม (ถ้ามี)</label>' +
        '<div class="form-actions">' +
          '<button type="button" class="button button-primary" id="bulkSubmit">บันทึกทั้งหมด</button>' +
          '<button type="button" class="button button-secondary" id="bulkCancel">ยกเลิก</button>' +
        '</div>' +
      '</div>';
    dialog.querySelector(".winners-dialog-close").addEventListener("click", () => dialog.close());
    dialog.querySelector("#bulkCancel").addEventListener("click", () => dialog.close());
    dialog.querySelector("#bulkMode").addEventListener("change", e => {
      $("#bulkSelectedWrap").style.display = e.target.value === "selected" ? "" : "none";
    });
    dialog.querySelector("#bulkSubmit").addEventListener("click", async () => {
      const betTypeId = $("#bulkBetType").value;
      const maxAmount = Number($("#bulkMaxAmount").value);
      const mode = $("#bulkMode").value;
      const overwrite = $("#bulkOverwrite").checked;
      const numbers = mode === "selected" ? $("#bulkSelectedNumbers").value.split(/[,\s]+/).filter(Boolean) : [];
      if (!Number.isFinite(maxAmount) || maxAmount < 0) { alert("กรอกเพดานให้ถูก"); return; }
      try {
        const r = await fetcher("/api/limits/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: { roundId: state.currentRoundId, betTypeId, maxAmount, mode, numbers, overwrite },
        });
        if (window.showToast) window.showToast("เพิ่ม " + r.inserted + " เลข · อัพเดท " + r.updated + " เลข", "success");
        dialog.close();
        await loadAll();
        if (window.refreshState) await window.refreshState();
      } catch (e) { alert("ไม่สำเร็จ: " + (e.message || "")); }
    });
    if (dialog.showModal) dialog.showModal();
  }

  // --- Templates dialog ---
  async function openTemplatesDialog() {
    if (!state.currentRoundId) { alert("เลือกงวดก่อน"); return; }
    const templates = await fetcher("/api/limit-templates");
    let dialog = $("#limitTemplatesDialog");
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.id = "limitTemplatesDialog";
      dialog.className = "winners-dialog";
      document.body.appendChild(dialog);
    }
    const tplRows = templates.length
      ? templates.map(t => '<tr><td><strong>' + esc(t.name) + '</strong><br><small>' + esc(t.note || "") + '</small></td><td class="num">' + t.item_count + ' เลข</td><td>' + esc(new Date(t.created_at).toLocaleString("th-TH-u-ca-buddhist")) + '</td><td><button type="button" class="button-mini btn-apply-tpl" data-id="' + esc(t.id) + '">ใช้กับงวดนี้</button> <button type="button" class="button-mini btn-del-tpl" data-id="' + esc(t.id) + '">ลบ</button></td></tr>').join("")
      : '<tr><td colspan="4"><p class="muted">ยังไม่มีเทมเพลต</p></td></tr>';
    dialog.innerHTML = '<header class="winners-dialog-header"><div><strong>📋 เทมเพลตอั้นเลข</strong><small>โหลดชุดเลขอั้นจากเทมเพลตเก่าใส่งวดนี้</small></div><button type="button" class="winners-dialog-close" aria-label="ปิด">✕</button></header>' +
      '<div class="winners-dialog-body">' +
        '<table class="winners-table"><thead><tr><th>ชื่อ</th><th class="num">จำนวน</th><th>สร้างเมื่อ</th><th></th></tr></thead><tbody>' + tplRows + '</tbody></table>' +
        '<label class="field-checkbox" style="margin-top:12px"><input type="checkbox" id="tplOverwrite"/> เขียนทับเพดานเดิมในงวดปัจจุบัน</label>' +
      '</div>';
    dialog.querySelector(".winners-dialog-close").addEventListener("click", () => dialog.close());
    dialog.querySelectorAll(".btn-apply-tpl").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!(await confirmDialog({ title: "ใช้เทมเพลต", body: "ใช้เทมเพลตนี้กับงวดที่เลือก?" }))) return;
        const overwrite = $("#tplOverwrite").checked;
        try {
          const r = await fetcher("/api/limit-templates/" + encodeURIComponent(btn.dataset.id) + "/apply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: { roundId: state.currentRoundId, overwrite },
          });
          if (window.showToast) window.showToast("เพิ่ม " + r.inserted + " · อัพเดท " + r.updated + " เลข", "success");
          dialog.close();
          await loadAll();
          if (window.refreshState) await window.refreshState();
        } catch (e) { alert("ไม่สำเร็จ: " + (e.message || "")); }
      });
    });
    dialog.querySelectorAll(".btn-del-tpl").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!(await confirmDialog({ title: "ลบเทมเพลต", body: "ลบเทมเพลตนี้?", danger: true }))) return;
        try {
          await fetcher("/api/limit-templates/" + encodeURIComponent(btn.dataset.id), { method: "DELETE" });
          if (window.showToast) window.showToast("ลบแล้ว", "success");
          openTemplatesDialog();
        } catch (e) { alert("ลบไม่สำเร็จ"); }
      });
    });
    if (dialog.showModal) dialog.showModal();
  }

  async function saveCurrentAsTemplate() {
    if (!state.currentRoundId) { alert("เลือกงวดก่อน"); return; }
    const name = prompt("ชื่อเทมเพลต:", "เลขอั้นงวด " + new Date().toLocaleDateString("th-TH-u-ca-buddhist"));
    if (!name) return;
    const note = prompt("หมายเหตุ (ออปชั่น):", "") || "";
    try {
      const r = await fetcher("/api/limit-templates/from-round/" + encodeURIComponent(state.currentRoundId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { name, note },
      });
      if (window.showToast) window.showToast("บันทึก " + r.count + " เลข เป็นเทมเพลตแล้ว", "success");
    } catch (e) {
      if (e.message && e.message.includes("404")) alert("งวดนี้ยังไม่มีเลขอั้น");
      else alert("ไม่สำเร็จ: " + (e.message || ""));
    }
  }

  // --- Watch + wire events ---
  function watch() {
    const v = document.querySelector('[data-view="limits"]');
    if (!v || v.hidden) return;
    if (!state.loaded) {
      populateRoundSelector();
      state.loaded = true;
      const sel = $("#limitToolsRound");
      if (sel) sel.addEventListener("change", e => { state.currentRoundId = e.target.value || null; loadAll(); });
      const bulkBtn = $("#limitBulkBtn");
      if (bulkBtn) bulkBtn.addEventListener("click", openBulkDialog);
      const tplBtn = $("#limitTemplateBtn");
      if (tplBtn) tplBtn.addEventListener("click", openTemplatesDialog);
      const saveBtn = $("#limitSaveTplBtn");
      if (saveBtn) saveBtn.addEventListener("click", saveCurrentAsTemplate);
      const refBtn = $("#limitRefreshBtn");
      if (refBtn) refBtn.addEventListener("click", loadAll);
      if (state.currentRoundId) loadAll();
    }
  }
  setInterval(watch, 800);
  // Auto-refresh every 30s when visible
  setInterval(() => {
    const v = document.querySelector('[data-view="limits"]');
    if (v && !v.hidden && state.loaded && state.currentRoundId) loadAll();
  }, 30000);
  console.log("[limit-tools] loaded");
})();


/* ===== NOTIFICATION SYSTEM (2026-05-23) ===== */
(function notificationModule() {
  const state = {
    lastSeenCount: null,
    lastTicketId: null,
    soundEnabled: localStorage.getItem("notif_sound") !== "false",
    desktopEnabled: localStorage.getItem("notif_desktop") === "true",
  };

  // --- Audio bell (synth, no asset needed) ---
  function playBell() {
    if (!state.soundEnabled) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const g = ctx.createGain();
      o1.frequency.value = 880;
      o2.frequency.value = 1320;
      o1.type = "sine";
      o2.type = "sine";
      g.gain.value = 0.0001;
      o1.connect(g);
      o2.connect(g);
      g.connect(ctx.destination);
      const now = ctx.currentTime;
      g.gain.exponentialRampToValueAtTime(0.3, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      o1.start(now);
      o2.start(now + 0.1);
      o1.stop(now + 0.5);
      o2.stop(now + 0.5);
    } catch (e) { console.warn("bell failed", e); }
  }

  // --- Browser notification ---
  function showDesktopNotif(title, body) {
    if (!state.desktopEnabled) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try {
      const n = new Notification(title, { body, icon: "/favicon.ico", tag: "lottery-pending" });
      n.onclick = () => { window.focus(); if (window.activateView) window.activateView("review"); n.close(); };
    } catch (e) {}
  }

  // --- Update sidebar badge ---
  function updateBadge(count) {
    let nav = document.querySelector('[data-view-target="review"]');
    if (!nav) return;
    let badge = nav.querySelector(".nav-badge");
    if (count > 0) {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "nav-badge";
        nav.appendChild(badge);
      }
      badge.textContent = count > 99 ? "99+" : String(count);
    } else if (badge) {
      badge.remove();
    }
  }

  // --- Poll ---
  async function poll() {
    /* FIX: skip poll if not admin — affiliate/viewer get 403, spams console */
    const role = (window.state && window.state.user && window.state.user.role) || null;
    if (role !== "admin" && role !== "operator") return;
    try {
      const r = await fetch("/api/admin/notifications", { credentials: "include" });
      if (!r.ok) return;
      const data = await r.json();
      const count = data.pending_review || 0;
      const latest = data.latest_pending_ticket;

      // First poll → just initialize
      if (state.lastSeenCount === null) {
        state.lastSeenCount = count;
        state.lastTicketId = latest?.id || null;
        updateBadge(count);
        return;
      }

      updateBadge(count);

      // New ticket detected?
      const newTicketArrived = latest && latest.id !== state.lastTicketId && count > state.lastSeenCount;
      if (newTicketArrived) {
        playBell();
        if (window.showToast) window.showToast(
          "🔔 มีบิลใหม่! " + (latest.code || "") + " (รวม " + count + " บิลรอตรวจ)",
          "info",
          5000
        );
        showDesktopNotif("มีบิลใหม่!", "บิล " + (latest.code || "") + " รอตรวจ — รวม " + count + " บิล");
        /* AUTO-REFRESH-V2: refresh state ทันทีให้ตารางขึ้นเอง */
        if (typeof window.refreshState === "function") {
          try { window.refreshState().catch(()=>{}); } catch (e) {}
        }
      }

      state.lastSeenCount = count;
      state.lastTicketId = latest?.id || null;
    } catch (e) {
      // Network error — just skip this poll
    }
  }

  // --- Notification settings UI (in sidebar profile area) ---
  function injectSettingsUI() {
    if (document.querySelector("#notifSettings")) return;
    const target = document.querySelector(".sidebar-footer") || document.querySelector("#sidebarProfile") || document.querySelector(".sidebar");
    if (!target) return;
    const wrap = document.createElement("div");
    wrap.id = "notifSettings";
    wrap.className = "notif-settings";
    wrap.innerHTML =
      '<label class="notif-toggle"><input type="checkbox" id="notifSoundChk"' + (state.soundEnabled ? " checked" : "") + '/> 🔔 เสียงเตือน</label>' +
      '<label class="notif-toggle"><input type="checkbox" id="notifDesktopChk"' + (state.desktopEnabled ? " checked" : "") + '/> 💻 แจ้งเตือนบนเดสก์ท็อป</label>';
    target.appendChild(wrap);
    document.querySelector("#notifSoundChk").addEventListener("change", e => {
      state.soundEnabled = e.target.checked;
      localStorage.setItem("notif_sound", String(state.soundEnabled));
      if (state.soundEnabled) playBell();  // confirm
    });
    document.querySelector("#notifDesktopChk").addEventListener("change", async e => {
      if (e.target.checked) {
        if ("Notification" in window) {
          const perm = await Notification.requestPermission();
          if (perm !== "granted") {
            e.target.checked = false;
            alert("เบราเซอร์ไม่อนุญาตให้แสดง notification");
            return;
          }
        } else {
          e.target.checked = false;
          alert("เบราเซอร์ไม่รองรับ notification");
          return;
        }
      }
      state.desktopEnabled = e.target.checked;
      localStorage.setItem("notif_desktop", String(state.desktopEnabled));
    });
  }

  // Start polling once logged in
  function start() {
    if (!document.querySelector('[data-view-target="review"]')) return;  // not admin
    injectSettingsUI();
    poll();
    setInterval(poll, 10000);  // every 10s
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(start, 1500));
  } else {
    setTimeout(start, 1500);
  }

  console.log("[notifications] loaded");
})();


/* ===== AUTO-CAP RULES UI (2026-05-23) ===== */
(function autoCapUI() {
  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
  function fetcher(p, opts) {
    if (window.api) return window.api(p, opts);
    return fetch(p, opts || {}).then(r => { if (!r.ok) throw new Error("http"); return r.json(); });
  }

  const state = { loaded: false, rules: [] };

  async function loadRules() {
    try { state.rules = await fetcher("/api/admin/default-cap-rules"); }
    catch (e) { state.rules = []; }
    render();
  }

  function render() {
    const body = $("#autoCapRulesBody");
    if (!body) return;
    if (!state.rules.length) {
      body.innerHTML = '<tr><td colspan="5"><p class="muted">ยังไม่มีกฎ — กดเพิ่มกฎด้านล่าง</p></td></tr>';
      return;
    }
    body.innerHTML = state.rules.map(r => '<tr>' +
      '<td>' + esc(r.lottery_name || r.lottery_id) + '</td>' +
      '<td>' + esc(r.bet_type_name || r.bet_type_id) + '</td>' +
      '<td class="num"><strong>' + Number(r.default_max).toLocaleString("th-TH") + ' ฿</strong></td>' +
      '<td class="num">' + (r.reduced_rate_pct != null ? Number(r.reduced_rate_pct).toFixed(0) + "%" : '<span class="muted">ปิดรับ</span>') + '</td>' +
      '<td><button class="button-mini btn-del-rule" data-id="' + esc(r.id) + '">ลบ</button></td>' +
    '</tr>').join("");
    body.querySelectorAll(".btn-del-rule").forEach(b => b.addEventListener("click", async () => {
      if (!(await confirmDialog({ title: "ลบกฎ", body: "ลบกฎนี้?", danger: true }))) return;
      await fetcher("/api/admin/default-cap-rules/" + encodeURIComponent(b.dataset.id), { method: "DELETE" });
      await loadRules();
    }));
  }

  function buildSelectors() {
    const lotSel = $("#autoCapLottery"), btSel = $("#autoCapBetType");
    if (!lotSel || !btSel) return;
    const lotteries = (window.state || {}).lotteries || [];
    const betTypes = (window.state || {}).betTypes || [];
    lotSel.innerHTML = lotteries.map(l => '<option value="' + esc(l.id) + '">' + esc(l.name) + '</option>').join("");
    btSel.innerHTML = betTypes.map(b => '<option value="' + esc(b.id) + '">' + esc(b.name) + '</option>').join("");
  }

  async function addRule() {
    const lotteryId = $("#autoCapLottery").value;
    const betTypeId = $("#autoCapBetType").value;
    const defaultMax = Number($("#autoCapDefaultMax").value);
    const reducedStr = $("#autoCapReducedPct").value;
    const reducedRatePct = reducedStr === "" ? null : Number(reducedStr);
    if (!Number.isFinite(defaultMax) || defaultMax < 0) { alert("กรอกเพดานให้ถูก"); return; }
    try {
      await fetcher("/api/admin/default-cap-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { lotteryId, betTypeId, defaultMax, reducedRatePct, enabled: true },
      });
      if (window.showToast) window.showToast("บันทึกกฎแล้ว", "success");
      $("#autoCapDefaultMax").value = "";
      $("#autoCapReducedPct").value = "";
      await loadRules();
    } catch (e) { alert("ไม่สำเร็จ: " + (e.message || "")); }
  }

  async function applyToAllOpen() {
    if (!(await confirmDialog({ title: "ใช้กฎทั้งหมด", body: "ใช้กฎทั้งหมดกับทุกงวดที่เปิดอยู่ตอนนี้?\n(เลขที่ตั้งอั้นไว้แล้ว manual จะไม่ถูกเขียนทับ)" }))) return;
    try {
      const r = await fetcher("/api/admin/default-cap-rules/apply-all-open", { method: "POST", body: {} });
      if (window.showToast) window.showToast("ใช้กับ " + r.processedRounds + " งวด · เพิ่ม " + r.totalInserted + " เลข", "success");
    } catch (e) { alert("ไม่สำเร็จ: " + (e.message || "")); }
  }

  function watch() {
    const v = document.querySelector('[data-view="limits"]');
    if (!v || v.hidden) return;
    if (!state.loaded) {
      state.loaded = true;
      buildSelectors();
      loadRules();
      const btn = $("#autoCapAddBtn"); if (btn) btn.addEventListener("click", addRule);
      const aBtn = $("#autoCapApplyAllBtn"); if (aBtn) aBtn.addEventListener("click", applyToAllOpen);
    }
  }
  setInterval(watch, 800);
  console.log("[auto-cap] loaded");
})();


/* ===== OVERVIEW (หน้ารวม) MODULE (2026-05-23) ===== */
(function overviewModule() {
  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
  function money(n) {
    const v = Number(n || 0);
    return v.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " ฿";
  }
  function num(n) { return Number(n || 0).toLocaleString("th-TH"); }

  const state = { loaded: false, timerId: null, data: null };

  async function load() {
    try {
      const data = await fetch("/api/admin/overview", { credentials: "include" }).then(r => {
        if (!r.ok) throw new Error("http_" + r.status);
        return r.json();
      });
      state.data = data;
      render();
    } catch (e) {
      console.error("[overview] load failed", e);
    }
  }

  function render() {
    const d = state.data;
    if (!d) return;

    // Top stats
    $("#ovTodayStake").textContent = money(d.today.total_stake);
    $("#ovTodayMeta").textContent = `${num(d.today.bill_count)} บิล · ${num(d.today.customer_count)} ลูกค้า`;
    $("#ovPending").textContent = num(d.today.pending_review);
    $("#ovPending").style.color = d.today.pending_review > 0 ? "#dc2626" : "var(--text-soft,#5a6c63)";
    $("#ovPendingMeta").textContent = d.today.pending_review > 0 ? "ต้องตรวจ ↓" : "ไม่มีบิลค้าง";

    if (d.worst_case) {
      $("#ovWorstRisk").textContent = "-" + money(d.worst_case.net_risk);
      $("#ovWorstRisk").style.color = "#dc2626";
      $("#ovWorstRiskMeta").textContent = `ถ้า ${d.worst_case.number} ออก (${d.worst_case.bet_type_name})`;
    } else {
      $("#ovWorstRisk").textContent = "+" + money(0);
      $("#ovWorstRisk").style.color = "#16a34a";
      $("#ovWorstRiskMeta").textContent = "ไม่มีเสี่ยงสูง";
    }

    $("#ovActiveCount").textContent = num(d.active_rounds.length);
    $("#ovUpdateTime").textContent = "อัพเดท " + new Date().toLocaleTimeString("th-TH-u-ca-buddhist");

    /* OVERVIEW-CHANNEL-SPLIT-FE-V1: แยกยอด ออนไลน์ vs หัวบ้าน */
    try {
      const online = d.today.online || { total_stake: 0, bill_count: 0 };
      const headHouse = d.today.head_house || { total_stake: 0, bill_count: 0 };
      const byHh = d.today.by_head_house || [];

      /* หา/สร้าง container */
      let split = document.getElementById("ovChannelSplit");
      if (!split) {
        split = document.createElement("div");
        split.id = "ovChannelSplit";
        split.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px;margin-bottom:14px";

        /* card ออนไลน์ */
        const onlineCard = document.createElement("div");
        onlineCard.style.cssText = "background:#fff;border:1px solid #e0e7e3;border-radius:14px;padding:18px 18px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.04)";
        onlineCard.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;color:#0a3a23;font-weight:700;font-size:13px;margin-bottom:8px">
            <span style="background:#dbeafe;color:#1d4ed8;padding:4px 10px;border-radius:999px;font-size:11px">💼 ออนไลน์</span>
            <span style="color:#6b7280;font-size:11px;font-weight:500">หน้าไลน์ + walk-in</span>
          </div>
          <div id="ovOnlineStake" style="font-size:24px;font-weight:800;color:#0a3a23">฿0</div>
          <div id="ovOnlineMeta" style="font-size:12px;color:#6b7280;margin-top:2px">0 บิล</div>
          <div id="ovOnlineBreakdown" style="margin-top:10px;padding-top:10px;border-top:1px dashed #e0e7e3;font-size:11px;color:#6b7280;max-height:120px;overflow-y:auto"></div>
        `;
        split.appendChild(onlineCard);

        /* card หัวบ้าน */
        const hhCard = document.createElement("div");
        hhCard.style.cssText = "background:#fff;border:1px solid #e0e7e3;border-radius:14px;padding:18px 18px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.04)";
        hhCard.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;color:#0a3a23;font-weight:700;font-size:13px;margin-bottom:8px">
            <span style="background:#fef3c7;color:#92400e;padding:4px 10px;border-radius:999px;font-size:11px">🏠 หัวบ้าน</span>
            <span style="color:#6b7280;font-size:11px;font-weight:500">รวมทุก HB</span>
          </div>
          <div id="ovHhStake" style="font-size:24px;font-weight:800;color:#0a3a23">฿0</div>
          <div id="ovHhMeta" style="font-size:12px;color:#6b7280;margin-top:2px">0 บิล</div>
          <div id="ovHhBreakdown" style="margin-top:10px;padding-top:10px;border-top:1px dashed #e0e7e3;font-size:11px;color:#6b7280;max-height:120px;overflow-y:auto"></div>
        `;
        split.appendChild(hhCard);

        /* insert ก่อน worst_case section หรือหลัง top stats */
        const refEl = document.getElementById("ovPendingAlert") || document.getElementById("ovActiveCount")?.closest("[class*='card']");
        if (refEl && refEl.parentNode) {
          refEl.parentNode.insertBefore(split, refEl);
        } else {
          /* fallback: append ไปท้าย view */
          const view = document.querySelector('[data-view="overview"]') || document.querySelector("#overviewView") || document.body;
          view.appendChild(split);
        }
      }

      /* อัพเดทค่า */
      const onlineStake = document.getElementById("ovOnlineStake");
      const onlineMeta = document.getElementById("ovOnlineMeta");
      const hhStake = document.getElementById("ovHhStake");
      const hhMeta = document.getElementById("ovHhMeta");
      const hhBreakdown = document.getElementById("ovHhBreakdown");
      if (onlineStake) onlineStake.textContent = money(online.total_stake);
      if (onlineMeta) onlineMeta.textContent = num(online.bill_count) + " บิล";
      /* ONLINE-BILLS-LIST-FE-V1: render list บิลออนไลน์ */
      const onlineBreakdown = document.getElementById("ovOnlineBreakdown");
      if (onlineBreakdown) {
        const bills = online.bills || [];
        if (bills.length === 0) {
          onlineBreakdown.innerHTML = '<span style="color:#9ca3af">ยังไม่มีบิลออนไลน์วันนี้</span>';
        } else {
          onlineBreakdown.innerHTML = bills.map(b => {
            const time = b.created_at ? new Date(b.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : "";
            const statusBadge = b.status === "approved"
              ? '<span style="background:#dcfce7;color:#166534;padding:1px 6px;border-radius:999px;font-size:9px;font-weight:600">อนุมัติ</span>'
              : '<span style="background:#fef3c7;color:#92400e;padding:1px 6px;border-radius:999px;font-size:9px;font-weight:600">รอ</span>';
            return `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #f3f4f6">
                <span style="flex:1;min-width:0">
                  <strong style="color:#0a3a23">${esc(b.code)}</strong>
                  <span style="color:#9ca3af;font-size:10px">· ${esc(time)}</span><br/>
                  <span style="color:#6b7280;font-size:10px">${esc(b.customer_name)} · ${num(b.entry_count)} เลข</span>
                </span>
                <span style="text-align:right;flex-shrink:0;margin-left:8px">
                  <div style="color:#0a3a23;font-weight:700">${money(b.total_amount)}</div>
                  <div>${statusBadge}</div>
                </span>
              </div>
            `;
          }).join("");
        }
      }
      if (hhStake) hhStake.textContent = money(headHouse.total_stake);
      if (hhMeta) hhMeta.textContent = num(headHouse.bill_count) + " บิล · " + byHh.length + " หัวบ้าน";
      if (hhBreakdown) {
        if (byHh.length === 0) {
          hhBreakdown.innerHTML = '<span style="color:#9ca3af">ยังไม่มีบิลของหัวบ้านวันนี้</span>';
        } else {
          hhBreakdown.innerHTML = byHh.map(h => `
            <div style="display:flex;justify-content:space-between;padding:3px 0">
              <span><strong style="color:#0a3a23">${esc(h.hh_name)}</strong> <em style="font-style:normal;color:#9ca3af">(${esc(h.hh_code || h.hh_id)})</em></span>
              <span style="color:#0a3a23;font-weight:600">${money(h.total_stake)} · ${num(h.bill_count)}บ.</span>
            </div>
          `).join("");
        }
      }
    } catch (e) { console.warn("[overview channel split]", e); }


    // Pending alert
    if (d.today.pending_review > 0) {
      $("#ovPendingAlert").classList.remove("hidden");
      $("#ovPendingTitle").textContent = `${d.today.pending_review} บิลรอตรวจ`;
      const labels = d.today.latest_pending.map(t => t.code + " " + (t.line_display_name || t.customer_name || t.customer_code || ""));
      $("#ovPendingDesc").textContent = labels.join(" · ");
    } else {
      $("#ovPendingAlert").classList.add("hidden");
    }

    // Rounds
    const container = $("#ovRoundsContainer");
    const empty = $("#ovEmpty");
    if (!d.active_rounds.length) {
      container.innerHTML = "";
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");

    // Hide rounds that are CLOSED + have ZERO bills — they're noise
    const filteredRounds = d.active_rounds.filter(r => {
      if (r.bill_count > 0) return true;
      if (r.minutes_until_close == null || r.minutes_until_close > 0) return true;
      return false;
    });
    // Sort: still-open first (closing soonest), then closed-with-bills (most recent draw first)
    filteredRounds.sort((a, b) => {
      const aOpen = a.minutes_until_close == null || a.minutes_until_close > 0;
      const bOpen = b.minutes_until_close == null || b.minutes_until_close > 0;
      if (aOpen && !bOpen) return -1;
      if (!aOpen && bOpen) return 1;
      if (aOpen && bOpen) {
        // Both open — closer to closing first
        return (a.minutes_until_close || 999999) - (b.minutes_until_close || 999999);
      }
      // Both closed — most recent draw_date first
      return (b.draw_date || '').localeCompare(a.draw_date || '');
    });
    // Update the "open rounds" stat to match filtered count
    const trulyOpenCount = filteredRounds.filter(r => r.minutes_until_close == null || r.minutes_until_close > 0).length;
    document.querySelector('#ovActiveCount').textContent = trulyOpenCount.toLocaleString('th-TH');
    if (!filteredRounds.length) {
      container.innerHTML = '';
      empty.classList.remove("hidden");
      return;
    }
    container.innerHTML = filteredRounds.map(r => renderRoundCard(r)).join("");

    // Wire quick-cap buttons
    container.querySelectorAll(".btn-ov-cap").forEach(btn => {
      btn.addEventListener("click", () => quickCap(btn.dataset.round, btn.dataset.bt, btn.dataset.num));
    });
    container.querySelectorAll(".btn-ov-goto-limits").forEach(btn => {
      btn.addEventListener("click", () => {
        if (window.activateView) window.activateView("limits");
      });
    });
  }

  function renderRoundCard(r) {
    const closeText = r.minutes_until_close == null ? "" :
      r.minutes_until_close <= 0 ? "ปิดรับแล้ว" :
      r.minutes_until_close < 60 ? `เหลือ ${r.minutes_until_close} นาที` :
      `เหลือ ${Math.floor(r.minutes_until_close / 60)} ชม. ${r.minutes_until_close % 60} นาที`;

    const hotRows = r.hot_numbers.length === 0
      ? '<div class="muted" style="padding:8px 0">ยังไม่มีบิลในงวดนี้</div>'
      : r.hot_numbers.map(h => {
        const alertCls = h.alert === "over" ? "row-over" : h.alert === "near" ? "row-near" : h.alert === "no_cap" ? "row-nocap" : "";
        const pctStr = h.current_limit ? `${Math.round(h.percent_used)}%` : "—";
        const capStr = h.current_limit ? money(h.current_limit) : '<span class="muted">ไม่อั้น</span>';
        const alertIcon = h.alert === "over" ? "🔴" : h.alert === "near" ? "🟡" : h.alert === "no_cap" ? "⚪" : "🟢";
        return `
          <div class="ov-num-row ${alertCls}">
            <div class="ov-num-pill">${esc(h.number)}</div>
            <div class="ov-num-info">
              <strong>${money(h.total_amount)}</strong>
              <small>${esc(h.bet_type_name)} · ${num(h.bet_count)} บิล · อั้น ${capStr} (${pctStr}) ${alertIcon}</small>
            </div>
            <button type="button" class="button-mini btn-ov-cap" data-round="${esc(r.round_id)}" data-bt="${esc(h.bet_type_id)}" data-num="${esc(h.number)}">ปรับอั้น</button>
          </div>`;
      }).join("");

    const riskRows = r.top_risks.length === 0
      ? ''
      : '<div class="ov-risk-section">' +
        '<small class="muted">⚠ ความเสี่ยง:</small>' +
        r.top_risks.map(rk => `
          <div class="ov-risk-row">
            <span>ถ้า <strong>${esc(rk.number)}</strong> (${esc(rk.bet_type_name)}) ออก</span>
            <strong style="color:#dc2626">-${money(rk.net_risk)}</strong>
          </div>`).join("") +
        '</div>';

    const isClosed = r.minutes_until_close != null && r.minutes_until_close <= 0;
    return `
      <section class="panel ov-round-card${isClosed ? " ov-round-closed" : ""}">
        <div class="ov-round-header">
          <div>
            <strong>🎯 ${esc(r.lottery_name)} · ${esc(r.label || r.draw_date)}</strong>
            <small class="muted">ออก ${esc(r.draw_time || "-")}${closeText ? " · " + esc(closeText) : ""}</small>
          </div>
          <div class="ov-round-stats">
            <span>${money(r.total_stake)}</span>
            <small>${num(r.bill_count)} บิล</small>
          </div>
        </div>
        <div class="ov-round-hot">${hotRows}</div>
        ${riskRows}
      </section>`;
  }

  async function quickCap(roundId, betTypeId, number) {
    const amountStr = window.prompt(`ตั้งอั้นเลข ${number}\nกรอกยอดสูงสุด (บาท):`, "500");
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (!Number.isFinite(amount) || amount <= 0) { alert("กรอกตัวเลขให้ถูกต้อง"); return; }
    try {
      await fetch("/api/limits/bulk", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId, betTypeId, maxAmount: amount, mode: "selected", numbers: [number], overwrite: true }),
      });
      if (window.showToast) window.showToast(`อั้นเลข ${number} ที่ ${money(amount)} แล้ว`, "success");
      await load();
    } catch (e) { alert("ไม่สำเร็จ: " + (e.message || "")); }
  }

  function watch() {
    const v = document.querySelector('[data-view="overview"]');
    if (!v || v.hidden) return;
    if (!state.loaded) {
      state.loaded = true;
      load();
      // Wire pending review button
      const btn = $("#ovGotoReview");
      if (btn) btn.addEventListener("click", () => {
        if (window.activateView) window.activateView("review");
      });
      // Auto-refresh every 30s
      if (state.timerId) clearInterval(state.timerId);
      state.timerId = setInterval(() => {
        const v2 = document.querySelector('[data-view="overview"]');
        if (v2 && !v2.hidden) load();
      }, 30000);
    }
  }
  setInterval(watch, 800);
  // Expose for outside (e.g., notification refresh)
  window.refreshOverview = load;
  console.log("[overview] loaded");
})();


/* ===== PATCH A: ticket quick-add customer ===== */
(function ticketAddCustModule() {
  function wire() {
    const btn = document.querySelector("#ticketAddCustBtn");
    const form = document.querySelector("#ticketAddCustForm");
    const cancel = document.querySelector("#ticketAddCustCancel");
    const nameInp = document.querySelector("#ticketAddCustName");
    const phoneInp = document.querySelector("#ticketAddCustPhone");
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", () => {
      form.classList.remove("hidden");
      btn.classList.add("hidden");
      setTimeout(() => nameInp.focus(), 50);
    });
    cancel.addEventListener("click", () => {
      form.classList.add("hidden");
      btn.classList.remove("hidden");
      nameInp.value = "";
      phoneInp.value = "";
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = nameInp.value.trim();
      const phone = phoneInp.value.trim();
      if (!name) { showToast("กรอกชื่อ", "warning"); return; }
      const headHouseId = (elements.ticketHeadHouse && elements.ticketHeadHouse.value) || "direct";
      try {
        const created = await api("/api/customers/quick-create", { method: "POST", body: { name, phone, headHouseId } });
        await refreshState();
        if (elements.ticketCustomer) elements.ticketCustomer.value = created.id;
        showToast("✓ สร้าง " + created.code + " · " + created.name, "success");
        form.classList.add("hidden");
        btn.classList.remove("hidden");
        nameInp.value = "";
        phoneInp.value = "";
      } catch (err) {
        showToast("สร้างไม่สำเร็จ: " + (err.message || ""), "warning");
      }
    });
  }
  setInterval(wire, 800);
})();

/* ===== PATCH A: head_house form type + customer detail dialog ===== */
(function headHouseTypeModule() {
  function syncType() {
    const sel = document.querySelector("#headHouseTypeInput");
    if (!sel || sel.dataset.bound) return;
    // populate on edit: set from state.editingHeadHouseId
    sel.dataset.bound = "1";
  }
  setInterval(syncType, 800);
})();


/* ===== PATCH B: affiliate account creation ===== */
async function createAffiliateAccount(headHouseId) {
  try {
    const creds = await api(`/api/head-houses/${encodeURIComponent(headHouseId)}/affiliate-account`, { method: "POST" });
    showAffiliateCredentials(creds);
    await refreshState();
  } catch (e) {
    if (e.payload?.error === "account_exists") {
      showToast("มี account สำหรับหัวบ้านนี้แล้ว", "warning");
    } else {
      showToast("สร้างไม่สำเร็จ: " + (e.message || ""), "warning");
    }
  }
}

function showAffiliateCredentials(creds) {
  const url = window.location.origin;
  const lineMsg = "🎉 Affiliate Account ของคุณพร้อมแล้ว!\n\n" +
    "🔗 เปิดที่: " + url + "\n" +
    "👤 Username: " + creds.username + "\n" +
    "🔑 Password: " + creds.password + "\n\n" +
    "ใช้บัญชีนี้ login เพื่อคีย์บิล + ดูยอดของตัวเอง\n" +
    "รบกวนเปลี่ยนรหัสผ่านหลังเข้าใช้ครั้งแรก 🙏";

  let dlg = document.querySelector("#affCredDialog");
  if (!dlg) {
    dlg = document.createElement("dialog");
    dlg.id = "affCredDialog";
    dlg.className = "aff-cred-dialog";
    document.body.appendChild(dlg);
  }
  dlg.innerHTML =
    '<div class="aff-cred-header"><strong>✓ สร้าง Affiliate Account สำเร็จ</strong></div>' +
    '<div class="aff-cred-body">' +
      '<div class="aff-cred-row"><span class="aff-cred-label">🔗 ลิงก์เข้าระบบ</span><code class="aff-cred-value" id="affCredUrl">' + url + '</code><button type="button" class="aff-cred-copy" data-copy="' + url + '">📋</button></div>' +
      '<div class="aff-cred-row"><span class="aff-cred-label">👤 Username</span><code class="aff-cred-value">' + creds.username + '</code><button type="button" class="aff-cred-copy" data-copy="' + creds.username + '">📋</button></div>' +
      '<div class="aff-cred-row"><span class="aff-cred-label">🔑 Password</span><code class="aff-cred-value mono">' + creds.password + '</code><button type="button" class="aff-cred-copy" data-copy="' + creds.password + '">📋</button></div>' +
      '<div class="aff-cred-hint">⚠️ รหัสผ่านจะแสดงครั้งเดียว — ก๊อปก่อนปิด</div>' +
    '</div>' +
    '<div class="aff-cred-footer">' +
      '<button type="button" class="button button-primary" id="affCredCopyLineMsg">💬 คัดลอกข้อความ LINE</button>' +
      '<button type="button" class="button button-secondary" id="affCredClose">ปิด</button>' +
    '</div>';

  dlg.querySelector("#affCredClose").addEventListener("click", () => dlg.close());
  dlg.querySelector("#affCredCopyLineMsg").addEventListener("click", () => {
    navigator.clipboard?.writeText(lineMsg).then(() => {
      showToast("คัดลอกข้อความสำหรับ LINE แล้ว — paste ส่งให้ affiliate ได้เลย", "success");
    });
  });
  dlg.querySelectorAll(".aff-cred-copy").forEach(btn => {
    btn.addEventListener("click", () => {
      navigator.clipboard?.writeText(btn.dataset.copy).then(() => {
        const orig = btn.textContent;
        btn.textContent = "✓";
        setTimeout(() => btn.textContent = orig, 1000);
      });
    });
  });
  if (typeof dlg.showModal === "function") dlg.showModal();
}


/* ===== PATCH C: view/reset affiliate account ===== */
async function viewAffiliateAccount(headHouseId) {
  try {
    const creds = await api(`/api/head-houses/${encodeURIComponent(headHouseId)}/affiliate-credentials`);
    if (!creds.hasStoredPassword) {
      const ok = await confirmDialog({
        title: "ไม่พบรหัสในตู้เซฟ",
        body: "บัญชีนี้สร้างก่อนระบบ vault — ต้อง 🔄 รีเซ็ตรหัสใหม่ครั้งเดียว แล้วระบบจะเก็บไว้ดูได้ตลอด",
        danger: false
      });
      if (ok) return resetAffiliateAccount(headHouseId);
      return;
    }
    showAffiliateCredentials({ username: creds.username, password: creds.password });
  } catch (e) {
    showToast("โหลดข้อมูลไม่สำเร็จ", "warning");
  }
}

async function resetAffiliateAccount(headHouseId) {
  const ok = await confirmDialog({
    title: "รีเซ็ตรหัส Affiliate Account",
    body: "ระบบจะสุ่มรหัสผ่านใหม่ และ logout ทุก session ที่ใช้รหัสเดิม — ต้องส่งรหัสใหม่ให้ affiliate",
    danger: true
  });
  if (!ok) return;
  try {
    const creds = await api(`/api/head-houses/${encodeURIComponent(headHouseId)}/affiliate-account/reset-password`, { method: "POST" });
    showAffiliateCredentials({ username: creds.username, password: creds.password });
  } catch (e) {
    showToast("รีเซ็ตไม่สำเร็จ: " + (e.message || ""), "warning");
  }
}


/* ===== P4 CUSTOMER DETAIL DIALOG (2026-05-24) ===== */
(function customerDetailModule() {
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
  function money(n) { return Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " ฿"; }
  function fmtDate(s) {
    if (!s) return "-";
    try { return new Date(s).toLocaleString("th-TH-u-ca-buddhist"); } catch (e) { return String(s); }
  }
  function statusPill(status) {
    var map = {
      "pending_review": ["รอตรวจ", "warning"],
      "approved": ["รับแล้ว", "success"],
      "rejected": ["ยกเลิก", "danger"],
      "settled": ["จ่ายแล้ว", "muted"]
    };
    var info = map[status] || [status, "muted"];
    return '<span class="status-pill ' + info[1] + '">' + esc(info[0]) + '</span>';
  }

  async function openDetail(customerId) {
    if (!customerId) return;
    var fetcher = window.api || function(p) { return fetch(p).then(function(r) { if (!r.ok) throw new Error("http_" + r.status); return r.json(); }); };

    var dialog = document.querySelector("#customerDetailDialog");
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.id = "customerDetailDialog";
      dialog.className = "winners-dialog cust-detail-dialog";
      dialog.innerHTML =
        '<header class="winners-dialog-header">' +
          '<div><strong id="custDDTitle"></strong><small id="custDDSub"></small></div>' +
          '<button type="button" class="winners-dialog-close" aria-label="ปิด">✕</button>' +
        '</header>' +
        '<div id="custDDBody" class="winners-dialog-body"><div class="empty-state">กำลังโหลด…</div></div>';
      document.body.appendChild(dialog);
      dialog.querySelector(".winners-dialog-close").addEventListener("click", function() { dialog.close(); });
      dialog.addEventListener("click", function(e) { if (e.target === dialog) dialog.close(); });
    }

    var titleEl = document.querySelector("#custDDTitle");
    var subEl   = document.querySelector("#custDDSub");
    var bodyEl  = document.querySelector("#custDDBody");
    titleEl.textContent = "ลูกค้า";
    subEl.textContent = "";
    bodyEl.innerHTML = '<div class="empty-state">กำลังโหลด…</div>';
    if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", "");

    try {
      var d = await fetcher("/api/customers/" + encodeURIComponent(customerId) + "/detail");
      titleEl.textContent = "👤 " + (d.code || "") + " · " + (d.name || "ยังไม่มีชื่อ");
      subEl.textContent = (d.head_house && d.head_house.name) ? ("หัวบ้าน: " + d.head_house.name) : "";

      var infoRows =
        '<div class="cust-info-grid">' +
          '<div><span class="lbl">เบอร์โทร</span><strong>' + esc(d.phone || "-") + '</strong></div>' +
          '<div><span class="lbl">LINE</span><strong>' + esc(d.line_display_name || "-") + '</strong></div>' +
          '<div><span class="lbl">เริ่มเป็นลูกค้า</span><strong>' + fmtDate(d.created_at) + '</strong></div>' +
          '<div><span class="lbl">บิลรวม</span><strong>' + Number(d.stats?.bill_count || 0).toLocaleString("th-TH") + '</strong></div>' +
          '<div><span class="lbl">ยอดรวม</span><strong style="color:var(--primary,#0f5132)">' + money(d.stats?.total_stake || 0) + '</strong></div>' +
          '<div><span class="lbl">บิลที่ดึงมาแสดง</span><strong>' + Number((d.bills || []).length).toLocaleString("th-TH") + ' บิล</strong></div>' +
        '</div>';

      var billsHtml;
      if (!d.bills || !d.bills.length) {
        billsHtml = '<p class="muted">ยังไม่มีบิล</p>';
      } else {
        billsHtml =
          '<table class="cust-bills-table">' +
            '<thead><tr>' +
              '<th>วันที่</th>' +
              '<th>หวย / งวด</th>' +
              '<th class="num">รายการ</th>' +
              '<th class="num">ยอด</th>' +
              '<th>สถานะ</th>' +
            '</tr></thead>' +
            '<tbody>' +
              d.bills.map(function(b) {
                return '<tr>' +
                  '<td>' + fmtDate(b.created_at) + '</td>' +
                  '<td>' + esc(b.lottery_name || "-") + ' · ' + esc(b.round_label || b.draw_date || "-") + '</td>' +
                  '<td class="num">' + Number(b.entry_count || 0).toLocaleString("th-TH") + '</td>' +
                  '<td class="num">' + money(b.total_amount || 0) + '</td>' +
                  '<td>' + statusPill(b.status) + '</td>' +
                '</tr>';
              }).join("") +
            '</tbody>' +
          '</table>';
      }

      bodyEl.innerHTML =
        '<section class="cust-detail-section">' +
          '<h4>📋 ข้อมูล</h4>' + infoRows +
        '</section>' +
        '<section class="cust-detail-section">' +
          '<h4>📜 บิลล่าสุด</h4>' + billsHtml +
        '</section>';
    } catch (err) {
      var msg = (err && err.payload && err.payload.error) || (err && err.message) || "unknown";
      bodyEl.innerHTML = '<div class="empty-state">โหลดไม่สำเร็จ: ' + esc(msg) + '</div>';
    }
  }
  window.openCustomerDetail = openDetail;
  console.log("[customer-detail] loaded");
})();


/* ===== P3 BANK ACCOUNTS MODULE (2026-05-24) ===== */
(function bankAccountsModule() {
  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
  function money(n) { return Number(n || 0).toLocaleString("th-TH", { maximumFractionDigits: 0 }) + " ฿"; }
  function pct(used, limit) { if (!limit) return 0; return Math.min(100, Math.round(100 * used / limit)); }
  var state = { loaded: false, accounts: [], editing: null };

  async function loadAll() {
    try {
      var fetcher = window.api;
      state.accounts = await fetcher("/api/admin/bank-accounts");
      render();
      renderPreview();
    } catch (err) {
      var list = $("#bankAccountsList");
      if (list) list.innerHTML = '<div class="empty-state">โหลดไม่สำเร็จ: ' + esc(err.message || "") + '</div>';
    }
  }

  function statusBadge(s) {
    var map = {
      "active":    ['🟢 พร้อมใช้',  'status-pill success'],
      "cooling":   ['🟡 พักชั่วคราว', 'status-pill warning'],
      "suspended": ['🔴 ระงับ',     'status-pill danger']
    };
    var v = map[s] || [s, 'status-pill'];
    return '<span class="' + v[1] + '">' + esc(v[0]) + '</span>';
  }

  function render() {
    var list = $("#bankAccountsList");
    var empty = $("#bankAccountsEmpty");
    if (!list) return;
    if (!state.accounts.length) {
      list.innerHTML = "";
      empty && empty.classList.remove("hidden");
      return;
    }
    empty && empty.classList.add("hidden");
    list.innerHTML = state.accounts.map(function(a) {
      var p = pct(a.total_received_today, a.daily_limit);
      var barColor = p >= 90 ? "#dc2626" : p >= 70 ? "#f59e0b" : "#16a34a";
      return '<article class="bank-card">' +
        '<div class="bank-card-head">' +
          '<div>' +
            '<strong><span class="bank-logo bank-' + esc((a.bank_code || 'generic').toLowerCase()) + '"></span>' + esc(a.bank_name) + ' · ' + esc(a.account_number) + '</strong>' +
            '<span class="bank-holder">' + esc(a.account_holder) + '</span>' +
          '</div>' +
          '<div class="bank-card-status">' +
            statusBadge(a.status) +
            '<span class="bank-priority">ลำดับ ' + a.priority + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="bank-progress-wrap">' +
          '<div class="bank-progress-label">ยอดวันนี้ <strong>' + money(a.total_received_today) + '</strong> / ' + money(a.daily_limit) + ' (' + p + '%)</div>' +
          '<div class="bank-progress"><div class="bank-progress-fill" style="width:' + p + '%;background:' + barColor + '"></div></div>' +
        '</div>' +
        (a.note ? '<p class="bank-note">📝 ' + esc(a.note) + '</p>' : '') +
        '<div class="bank-card-actions">' +
          '<button type="button" class="button button-secondary bank-log-btn" data-id="' + esc(a.id) + '">💰 บันทึกยอดโอน</button>' +
          (a.status === "active"
            ? '<button type="button" class="button button-secondary bank-toggle-btn" data-id="' + esc(a.id) + '" data-action="off">⏸️ ปิดใช้งาน</button>'
            : '<button type="button" class="button button-primary bank-toggle-btn" data-id="' + esc(a.id) + '" data-action="on">▶️ เปิดใช้งาน</button>') +
          '<button type="button" class="button button-secondary bank-edit-btn" data-id="' + esc(a.id) + '">แก้ไข</button>' +
          '<button type="button" class="button button-danger bank-delete-btn" data-id="' + esc(a.id) + '">ลบ</button>' +
        '</div>' +
      '</article>';
    }).join("");

    list.querySelectorAll(".bank-log-btn").forEach(function(b) { b.addEventListener("click", function() { logDeposit(b.dataset.id); }); });
    list.querySelectorAll(".bank-edit-btn").forEach(function(b) { b.addEventListener("click", function() { beginEdit(b.dataset.id); }); });
    list.querySelectorAll(".bank-delete-btn").forEach(function(b) { b.addEventListener("click", function() { deleteAcc(b.dataset.id); }); });
    list.querySelectorAll(".bank-toggle-btn").forEach(function(b) { b.addEventListener("click", function() { toggleAccStatus(b.dataset.id, b.dataset.action); }); });
  }

  function renderPreview() {
    var el = $("#bankRotationPreview");
    if (!el) return;
    var active = state.accounts.filter(function(a) { return a.status === "active" && a.total_received_today < a.daily_limit; });
    if (!active.length) {
      el.innerHTML = '<span style="color:#dc2626">⚠️ ไม่มีบัญชีพร้อมใช้ — /order จะส่ง 503</span>';
      return;
    }
    active.sort(function(a, b) {
      if (a.total_received_today !== b.total_received_today) return a.total_received_today - b.total_received_today;
      return a.priority - b.priority;
    });
    var next = active[0];
    el.innerHTML = '<div>ลำดับการใช้ <strong>(เรียงจาก ยอดน้อยสุด → priority น้อยสุด)</strong>:</div>' +
      '<ol style="margin:8px 0">' +
        active.map(function(a, i) {
          return '<li>' + (i === 0 ? '<strong style="color:#0f5132">→ ' : '') + esc(a.bank_name) + ' ' + esc(a.account_number) + ' (เหลือ ' + money(a.daily_limit - a.total_received_today) + ')' + (i === 0 ? ' ← ลูกค้าคนต่อไปจะได้บัญชีนี้</strong>' : '') + '</li>';
        }).join("") +
      '</ol>';
  }

  function showForm(acc) {
    state.editing = acc ? acc.id : null;
    $("#bankFormId").value = acc ? acc.id : "";
    $("#bankBankName").value = acc ? acc.bank_name : "";
    $("#bankAccountNumber").value = acc ? acc.account_number : "";
    $("#bankAccountHolder").value = acc ? acc.account_holder : "";
    $("#bankDailyLimit").value = acc ? acc.daily_limit : 100000;
    $("#bankPriority").value = acc ? acc.priority : 100;
    $("#bankStatus").value = acc ? acc.status : "active";
    $("#bankNote").value = acc ? acc.note : "";
    $("#bankForm").classList.remove("hidden");
    setTimeout(function() { $("#bankBankName").focus(); }, 50);
  }

  function hideForm() {
    state.editing = null;
    $("#bankForm").reset();
    $("#bankFormId").value = "";
    $("#bankForm").classList.add("hidden");
  }

  function beginEdit(id) {
    var acc = state.accounts.find(function(a) { return a.id === id; });
    if (acc) showForm(acc);
  }

  async function submitForm(e) {
    e.preventDefault();
    var id = $("#bankFormId").value || null;
    var body = {
      bank_name: $("#bankBankName").value.trim(),
      account_number: $("#bankAccountNumber").value.trim(),
      account_holder: $("#bankAccountHolder").value.trim(),
      daily_limit: Number($("#bankDailyLimit").value) || 0,
      priority: Number($("#bankPriority").value) || 100,
      status: $("#bankStatus").value,
      note: $("#bankNote").value.trim()
    };
    if (!body.bank_name || !body.account_number || !body.account_holder) {
      window.showToast && window.showToast("กรอกฟิลด์ * ให้ครบ", "warning");
      return;
    }
    try {
      var savedId = id;
      if (id) {
        await window.api("/api/admin/bank-accounts/" + encodeURIComponent(id), { method: "PUT", body: body });
        window.showToast && window.showToast("บันทึกแล้ว", "success");
      } else {
        var res = await window.api("/api/admin/bank-accounts", { method: "POST", body: body });
        savedId = res?.id || res?.account?.id;
        window.showToast && window.showToast("เพิ่มบัญชีแล้ว", "success");
      }
      /* FEAT bank-logo: save bank_code separately */
      var _bnInp = document.querySelector("#bankBankName");
      var _code = _bnInp?.dataset.bankCode || "";
      if (savedId && _code) {
        try { await window.api("/api/admin/bank-accounts/" + encodeURIComponent(savedId) + "/bank-code", { method: "POST", body: { code: _code } }); } catch (e) {}
      }
      hideForm();
      await loadAll();
    } catch (err) {
      window.showToast && window.showToast("บันทึกไม่สำเร็จ: " + (err.message || ""), "warning");
    }
  }

  async function logDeposit(id) {
    var acc = state.accounts.find(function(a) { return a.id === id; });
    if (!acc) return;
    /* FIX-4: custom modal instead of prompt() */
    var dlg = document.querySelector("#bankDepositDialog");
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.id = "bankDepositDialog";
      dlg.className = "winners-dialog bank-deposit-dialog";
      dlg.innerHTML =
        '<header class="winners-dialog-header">' +
          '<div><strong id="bdTitle">บันทึกยอดโอน</strong><small id="bdSub"></small></div>' +
          '<button type="button" class="winners-dialog-close" aria-label="ปิด">✕</button>' +
        '</header>' +
        '<form id="bdForm" class="winners-dialog-body">' +
          '<label class="field"><span>จำนวนเงิน (บาท) *</span>' +
            '<input id="bdAmount" type="number" min="1" step="1" required autofocus placeholder="เช่น 5000" /></label>' +
          '<div class="form-actions">' +
            '<button type="submit" class="button button-primary">บันทึก</button>' +
            '<button type="button" class="button button-secondary" id="bdCancel">ยกเลิก</button>' +
          '</div>' +
        '</form>';
      document.body.appendChild(dlg);
      dlg.querySelector(".winners-dialog-close").addEventListener("click", function() { dlg.close(); });
      dlg.querySelector("#bdCancel").addEventListener("click", function() { dlg.close(); });
      dlg.addEventListener("click", function(e) { if (e.target === dlg) dlg.close(); });
    }
    document.querySelector("#bdTitle").textContent = "บันทึกยอดโอนเข้า";
    document.querySelector("#bdSub").textContent = acc.bank_name + " · " + acc.account_number + " · เหลือ " + Number(acc.daily_limit - acc.total_received_today).toLocaleString("th-TH") + " ฿";
    var amtInput = document.querySelector("#bdAmount");
    amtInput.value = "";
    var form = document.querySelector("#bdForm");
    form.onsubmit = async function(e) {
      e.preventDefault();
      var amount = Number(amtInput.value) || 0;
      if (amount <= 0) { window.showToast && window.showToast("ยอดต้องมากกว่า 0", "warning"); return; }
      try {
        var r = await window.api("/api/admin/bank-accounts/" + encodeURIComponent(id) + "/log-deposit", { method: "POST", body: { amount: amount } });
        window.showToast && window.showToast("✓ บันทึก " + amount.toLocaleString("th-TH") + " ฿ — ยอดวันนี้: " + Number(r.total_received_today).toLocaleString("th-TH") + (r.cooled ? " (auto-cool: เต็มลิมิตแล้ว)" : ""), r.cooled ? "warning" : "success");
        dlg.close();
        await loadAll();
      } catch (err) {
        window.showToast && window.showToast("ผิดพลาด: " + (err.message || ""), "warning");
      }
    };
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    setTimeout(function() { amtInput.focus(); }, 50);
  }

  async function toggleAccStatus(id, action) {
    var acc = state.accounts.find(function(a) { return a.id === id; });
    if (!acc) return;
    var newStatus = (action === "off") ? "suspended" : "active";
    try {
      await window.api("/api/admin/bank-accounts/" + encodeURIComponent(id), { method: "PUT", body: { status: newStatus } });
      window.showToast && window.showToast(newStatus === "active" ? "▶️ เปิดใช้งาน " + acc.bank_name : "⏸️ ปิดใช้งาน " + acc.bank_name, "success");
      await loadAll();
    } catch (err) {
      window.showToast && window.showToast("เปลี่ยนสถานะไม่สำเร็จ: " + (err.message || ""), "warning");
    }
  }

  async function deleteAcc(id) {
    var acc = state.accounts.find(function(a) { return a.id === id; });
    if (!acc) return;
    var ok = window.confirmDialog
      ? await window.confirmDialog({ title: "ลบบัญชี", body: "ลบ " + acc.bank_name + " " + acc.account_number + " ?", danger: true })
      : confirm("ลบ " + acc.bank_name + " " + acc.account_number + " ?");
    if (!ok) return;
    try {
      await window.api("/api/admin/bank-accounts/" + encodeURIComponent(id), { method: "DELETE" });
      window.showToast && window.showToast("ลบแล้ว", "success");
      await loadAll();
    } catch (err) {
      window.showToast && window.showToast("ลบไม่สำเร็จ: " + (err.message || ""), "warning");
    }
  }

  async function resetAll() {
    var ok = window.confirmDialog
      ? await window.confirmDialog({ title: "รีเซ็ตยอดวันนี้", body: "รีเซ็ตยอดสะสมวันนี้ของทุกบัญชีเป็น 0 — ใช้ตอนสิ้นวัน หรือเมื่อต้องการเริ่มนับใหม่", danger: false })
      : confirm("รีเซ็ตยอดสะสมวันนี้ทุกบัญชี?");
    if (!ok) return;
    try {
      await window.api("/api/admin/bank-accounts/reset-daily", { method: "POST" });
      window.showToast && window.showToast("รีเซ็ตยอดเรียบร้อย", "success");
      await loadAll();
    } catch (err) {
      window.showToast && window.showToast("รีเซ็ตไม่สำเร็จ: " + (err.message || ""), "warning");
    }
  }

  function wire() {
    var btn = $("#bankAddBtn");
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", function() { showForm(null); });
    $("#bankCancelBtn") && $("#bankCancelBtn").addEventListener("click", hideForm);
    $("#bankForm") && $("#bankForm").addEventListener("submit", submitForm);
    $("#bankResetBtn") && $("#bankResetBtn").addEventListener("click", resetAll);
  }

  function watch() {
    var v = document.querySelector('[data-view="bankAccounts"]');
    if (v && !v.hidden) {
      wire();
      if (!state.loaded) { state.loaded = true; loadAll(); }
    }
  }
  setInterval(watch, 800);
  /* refresh every 30s when view active */
  setInterval(function() {
    var v = document.querySelector('[data-view="bankAccounts"]');
    if (v && !v.hidden && state.loaded) loadAll();
  }, 30000);

  console.log("[p3-bank] loaded");
})();


/* === BUG-1 auto-select numeric inputs (round 2: click+mouseup) === */
(function autoSelectNumericInputs() {
  function bind() {
    document.querySelectorAll('input[type="number"], input[inputmode="numeric"], input[inputmode="decimal"]').forEach(function(input) {
      if (input.dataset.autoSelectBound) return;
      input.dataset.autoSelectBound = "1";
      var doSelect = function() {
        setTimeout(function() {
          try {
            /* only select if value is "" or "0" — don't clobber real typed values */
            if (input.value === "" || input.value === "0") input.select();
          } catch(e){}
        }, 0);
      };
      input.addEventListener("focus", doSelect);
      input.addEventListener("click", doSelect);
      input.addEventListener("mouseup", function(e) {
        /* prevent the default that deselects after click */
        if (input.value === "0") { e.preventDefault(); input.select(); }
      });
    });
  }
  bind();
  setInterval(bind, 1500);
  console.log("[bug-1 r2] auto-select bound (focus+click+mouseup)");
})();


/* === BUG-2 CRIT: bulk approve handlers === */
(function reviewBulkHandlers() {
  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.from(document.querySelectorAll(s)); }

  function getRowCheckboxes() {
    /* Pending ticket rows have data-ticket-id in #pendingTicketsBody */
    return $$('#pendingTicketsBody input[type="checkbox"][data-ticket-id]');
  }

  function refreshBulkBtnState() {
    var btn = $("#reviewBulkApproveBtn");
    if (!btn) return;
    var selected = getRowCheckboxes().filter(function(c) { return c.checked; });
    btn.disabled = selected.length === 0;
    btn.textContent = selected.length ? "✓ อนุมัติที่เลือก (" + selected.length + ")" : "✓ อนุมัติที่เลือก";
  }

  function selectAll(checked) {
    getRowCheckboxes().forEach(function(c) { c.checked = checked; });
    var header = $("#reviewHeaderCheck");
    if (header) header.checked = checked;
    refreshBulkBtnState();
  }

  async function bulkApprove() {
    var ids = getRowCheckboxes().filter(function(c) { return c.checked; }).map(function(c) { return c.dataset.ticketId; });
    if (!ids.length) return;
    var ok = window.confirmDialog
      ? await window.confirmDialog({ title: "อนุมัติทีละหลายบิล", body: "อนุมัติบิล " + ids.length + " ใบ?", danger: false })
      : confirm("อนุมัติบิล " + ids.length + " ใบ?");
    if (!ok) return;
    var btn = $("#reviewBulkApproveBtn");
    if (btn) { btn.disabled = true; btn.textContent = "กำลังอนุมัติ..."; }
    var success = 0, fail = 0;
    for (var i = 0; i < ids.length; i++) {
      try {
        await window.api("/api/tickets/" + encodeURIComponent(ids[i]) + "/approve", { method: "POST" });
        success++;
      } catch (e) { fail++; }
    }
    if (window.showToast) {
      var msg = "✓ อนุมัติ " + success + " ใบ" + (fail ? " (พลาด " + fail + " ใบ)" : "");
      window.showToast(msg, fail ? "warning" : "success");
    }
    if (typeof refreshState === "function") await refreshState();
    refreshBulkBtnState();
  }

  function wire() {
    var sel = $("#reviewSelectAllBtn");
    var header = $("#reviewHeaderCheck");
    var bulk = $("#reviewBulkApproveBtn");

    if (sel && !sel.dataset.bound) {
      sel.dataset.bound = "1";
      sel.addEventListener("click", function() {
        /* toggle all */
        var anyUnchecked = getRowCheckboxes().some(function(c) { return !c.checked; });
        selectAll(anyUnchecked);
      });
    }
    if (header && !header.dataset.bound) {
      header.dataset.bound = "1";
      header.addEventListener("change", function() { selectAll(header.checked); });
    }
    if (bulk && !bulk.dataset.bound) {
      bulk.dataset.bound = "1";
      bulk.addEventListener("click", bulkApprove);
    }
    /* Listen on row checkbox changes via delegation */
    var tbody = $("#pendingTicketsBody");
    if (tbody && !tbody.dataset.bulkDelegated) {
      tbody.dataset.bulkDelegated = "1";
      tbody.addEventListener("change", function(e) {
        if (e.target && e.target.matches && e.target.matches('input[type="checkbox"][data-ticket-id]')) {
          refreshBulkBtnState();
        }
      });
    }
  }
  setInterval(wire, 800);
  console.log("[bug-2] bulk-approve wired");
})();


/* === BUG-2 add row checkboxes post-render === */
(function injectReviewCheckboxes() {
  function injectAll() {
    /* FIX double-checkbox: skip ถ้า row template มี .review-check-cell อยู่แล้ว
       (renderReview ใหม่เพิ่ม checkbox ใน template — ไม่ต้อง inject อีก) */
    var rows = document.querySelectorAll('#pendingTicketsBody tr');
    rows.forEach(function(tr) {
      if (tr.dataset.checkboxInjected) return;
      if (tr.classList && tr.classList.contains("ticket-detail-row")) return;
      if (tr.querySelector(".review-check-cell")) {
        /* template มี checkbox cell แล้ว — แค่ mark + set data-ticket-id */
        tr.dataset.checkboxInjected = "1";
        var existingInput = tr.querySelector(".review-check-cell input");
        if (existingInput && existingInput.dataset.ticketId) {
          tr.dataset.ticketId = existingInput.dataset.ticketId;
        }
        return;
      }
      var btn = tr.querySelector('.approve-ticket-button[data-ticket-id]');
      if (!btn) return;
      var ticketId = btn.dataset.ticketId;
      tr.dataset.checkboxInjected = "1";
      tr.dataset.ticketId = ticketId;
      var firstTd = tr.querySelector("td");
      if (!firstTd) return;
      var box = document.createElement("td");
      box.style.width = "30px";
      box.innerHTML = '<input type="checkbox" data-ticket-id="' + ticketId + '" aria-label="เลือกบิล">';
      tr.insertBefore(box, firstTd);
    });
  }
  setInterval(injectAll, 600);
})();


/* === BUG-2/4 (r2) currentUserLabel + sidebarProfileBtn delegated === */
(function userPillClickable() {
  function goToProfile() {
    var role = (window.state && window.state.user && window.state.user.role) || null;
    if (role === "admin" && window.activateView) {
      window.activateView("users");
    } else if ((role === "affiliate" || role === "head_house_viewer") && window.activateView) {
      window.activateView("myAffiliate");
    } else if (window.showToast) {
      window.showToast("คุณคือ: " + ((window.state && window.state.user && window.state.user.username) || "?"), "info");
    }
  }
  /* Document-level delegation — catches clicks even if direct binding raced */
  document.addEventListener("click", function(e) {
    var t = e.target;
    if (!t) return;
    var pill = t.closest && t.closest("#currentUserLabel");
    var sidebar = t.closest && t.closest("#sidebarProfileBtn");
    if (pill || sidebar) {
      e.preventDefault();
      goToProfile();
    }
  }, true);  /* capture phase — runs before any inner handler can stop it */

  /* style pill so it looks clickable */
  function style() {
    var pill = document.querySelector("#currentUserLabel");
    if (pill && !pill.dataset.styled) {
      pill.dataset.styled = "1";
      pill.style.cursor = "pointer";
      pill.title = "ดูข้อมูลผู้ใช้";
    }
  }
  setInterval(style, 1500);
  console.log("[bug-2 r2] delegated click for profile pill + sidebar btn");
})();


/* === BUG-6 force header sync on round change === */
(function ticketRoundHeaderSync() {
  function wire() {
    var sel = document.querySelector("#ticketRoundInput");
    if (sel && !sel.dataset.headerSyncBound) {
      sel.dataset.headerSyncBound = "1";
      sel.addEventListener("change", function() {
        if (typeof renderTicketWorkbench === "function") renderTicketWorkbench();
        else if (typeof renderTicketHeader === "function") renderTicketHeader();
      });
    }
  }
  setInterval(wire, 800);
})();


/* S0: CSRF helper */
(function csrfBootstrap() {
  let csrfToken = null;
  async function fetchToken() {
    try {
      const res = await fetch("/api/csrf", { credentials: "same-origin" });
      if (res.ok) {
        const data = await res.json();
        csrfToken = data.csrfToken;
        window._csrfToken = csrfToken;
      }
    } catch (e) {}
  }
  /* Wrap window.fetch to auto-inject X-CSRF-Token for same-origin write requests */
  const origFetch = window.fetch.bind(window);
  window.fetch = function(input, init) {
    init = init || {};
    const method = (init.method || "GET").toUpperCase();
    const isWrite = !["GET", "HEAD", "OPTIONS"].includes(method);
    const isApi = typeof input === "string" && input.startsWith("/api/") && !input.startsWith("/api/customer/") && !input.startsWith("/api/public/") && input !== "/api/login" && input !== "/api/logout" && input !== "/api/csrf";
    if (isWrite && isApi && csrfToken) {
      init.headers = Object.assign({}, init.headers || {}, { "X-CSRF-Token": csrfToken });
    }
    return origFetch(input, init).then(async (res) => {
      /* If CSRF rejected, fetch a fresh token and retry once */
      if (res.status === 403 && isWrite && isApi) {
        try {
          const peek = await res.clone().json();
          if (peek && peek.error === "csrf_invalid") {
            await fetchToken();
            if (csrfToken) {
              init.headers = Object.assign({}, init.headers || {}, { "X-CSRF-Token": csrfToken });
              return origFetch(input, init);
            }
          }
        } catch (e) {}
      }
      return res;
    });
  };
  window._csrfFetchToken = fetchToken;
  /* Fetch token after login / state load */
  let lastFetch = 0;
  setInterval(() => {
    if (window.state && window.state.user && Date.now() - lastFetch > 6 * 86400 * 1000) {
      lastFetch = Date.now();
      fetchToken();
    }
  }, 60000);
  /* Fetch immediately if user already present */
  setTimeout(() => {
    if (window.state && window.state.user) fetchToken();
  }, 500);
  console.log("[s0] CSRF bootstrap loaded");
})();


/* === Keyboard shortcuts intake: Space=reverse, Alt+ArrowLeft=sibling_run === */
(function intakeShortcuts() {
  document.addEventListener("keydown", function(e) {
    /* Only when intake view is active */
    var intakeView = document.querySelector('[data-view="intake"]');
    if (!intakeView || intakeView.hidden) return;

    /* BUG-004 fix: scope shortcuts to #ticketNumberInput only (or non-input focus).
       Other inputs (customer name, phone, note, modals) keep default behavior. */
    var tag = (e.target && e.target.tagName) || "";
    var isInputLike = tag === "INPUT" || tag === "TEXTAREA" || (e.target && e.target.isContentEditable);
    var isNumberInput = e.target && e.target.id === "ticketNumberInput";
    if (isInputLike && !isNumberInput) return;

    if (e.code === "Space") {
      e.preventDefault();
      /* Toggle reverse only if current action supports it */
      var act = (typeof getIntakeAction === "function") ? getIntakeAction() : null;
      var supportsReverse = act && (act.target === "pair" || act.target === "three_pair");
      if (!supportsReverse) {
        /* Switch to 2-ตัว mode first so reverse actually does something */
        state.ticketBetTypeId = "two_pair";
      }
      state.ticketReverseEnabled = !state.ticketReverseEnabled;
      if (typeof renderTicketBetTypeTabs === "function") renderTicketBetTypeTabs();
      if (typeof syncIntakeNumberLength === "function") syncIntakeNumberLength();
      if (typeof renderTicketAmountFields === "function") renderTicketAmountFields();
      if (typeof renderTicketActionTools === "function") renderTicketActionTools();
      if (typeof renderTicketExpansionPreview === "function") renderTicketExpansionPreview();
      if (window.showToast) window.showToast(state.ticketReverseEnabled ? "🔄 กลับเลข: เปิด" : "กลับเลข: ปิด", "info");
      return;
    }

    /* BUG-002 fix: รับ Alt+ArrowLeft (เดิม "AltLeft" = ปุ่ม Left Alt เปล่า — ไม่ใช่ที่ต้องการ) */
    if ((e.code === "ArrowLeft" && e.altKey) || e.code === "AltLeft") {
      e.preventDefault();
      /* Toggle sibling — auto-switch to pair (2 ตัว) mode if not already */
      var act2 = (typeof getIntakeAction === "function") ? getIntakeAction() : null;
      if (!act2 || act2.target !== "pair") {
        state.ticketBetTypeId = "two_pair";
      }
      state.ticketSiblingEnabled = !state.ticketSiblingEnabled;
      if (state.ticketSiblingEnabled) {
        state.ticketUseDoubles = false;
        state.ticketReverseEnabled = false;
      }
      if (typeof renderTicketBetTypeTabs === "function") renderTicketBetTypeTabs();
      if (typeof syncIntakeNumberLength === "function") syncIntakeNumberLength();
      if (typeof renderTicketAmountFields === "function") renderTicketAmountFields();
      if (typeof renderTicketActionTools === "function") renderTicketActionTools();
      if (typeof renderTicketExpansionPreview === "function") renderTicketExpansionPreview();
      var ni = document.querySelector("#ticketNumberInput");
      if (ni) { ni.focus(); ni.select && ni.select(); }
      if (window.showToast) window.showToast(state.ticketSiblingEnabled ? "✨ รูดพี่น้อง: เปิด" : "รูดพี่น้อง: ปิด", "info");
      return;
    }
  });
  console.log("[intake-shortcuts] Space=reverse, AltLeft=sibling_run");
})();


/* === sibling btn click handler === */
(function siblingBtnInit() {
  function bind() {
    var btn = document.querySelector("#ticketSiblingBtn");
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", function() {
      var act = (typeof getIntakeAction === "function") ? getIntakeAction() : null;
      if (!act || act.target !== "pair") {
        state.ticketBetTypeId = "two_pair";
      }
      state.ticketSiblingEnabled = !state.ticketSiblingEnabled;
      if (state.ticketSiblingEnabled) {
        state.ticketUseDoubles = false;
        state.ticketReverseEnabled = false;
      }
      if (typeof renderTicketBetTypeTabs === "function") renderTicketBetTypeTabs();
      if (typeof syncIntakeNumberLength === "function") syncIntakeNumberLength();
      if (typeof renderTicketAmountFields === "function") renderTicketAmountFields();
      if (typeof renderTicketActionTools === "function") renderTicketActionTools();
      if (typeof renderTicketExpansionPreview === "function") renderTicketExpansionPreview();
    });
  }
  setInterval(bind, 800);
})();

/* === HH form dialog open/close + auto-close === */
(function hhFormDialogModule() {
  function getDialog() { return document.querySelector("#headHouseFormDialog"); }
  function openDialog() {
    var d = getDialog();
    if (!d) return;
    if (typeof d.showModal === "function") {
      try { d.showModal(); }
      catch(e) { d.setAttribute("open", "open"); }
    } else {
      d.setAttribute("open", "open");
    }
  }
  function closeDialog() {
    var d = getDialog();
    if (!d) return;
    if (typeof d.close === "function") { try { d.close(); } catch(e) { d.removeAttribute("open"); } }
    else d.removeAttribute("open");
  }
  window.openHeadHouseForm = openDialog;
  window.closeHeadHouseForm = closeDialog;

  function bind() {
    var openBtn = document.querySelector("#openHeadHouseFormBtn");
    if (openBtn && !openBtn.dataset.bound) {
      openBtn.dataset.bound = "1";
      openBtn.addEventListener("click", function() {
        /* reset form to "create" mode if not editing */
        if (!window.state || !window.state.editingHeadHouseId) {
          var form = document.querySelector("#headHouseForm");
          if (form) form.reset();
          var title = document.querySelector("#headHouseFormTitle");
          if (title) title.textContent = "เพิ่มหัวบ้าน";
          var submit = document.querySelector("#headHouseSubmitBtn");
          if (submit) submit.textContent = "เพิ่มหัวบ้าน";
          var resetBtn = document.querySelector("#resetHeadHouseBtn");
          if (resetBtn) resetBtn.classList.add("hidden");
        }
        openDialog();
      });
    }
    var closeBtn = document.querySelector("#closeHeadHouseFormBtn");
    if (closeBtn && !closeBtn.dataset.bound) {
      closeBtn.dataset.bound = "1";
      closeBtn.addEventListener("click", function() {
        closeDialog();
        if (window.state) window.state.editingHeadHouseId = null;
        var form = document.querySelector("#headHouseForm");
        if (form) form.reset();
        if (typeof window.renderHeadHouses === "function") window.renderHeadHouses();
      });
    }
    /* Auto-open เมื่อ click "แก้ไข" (state.editingHeadHouseId ถูก set) */
    /* — render row "edit" button calls openHeadHouseDialog elsewhere; just observe */
  }
  setInterval(bind, 700);
  /* Observe form submit success → close */
  document.addEventListener("submit", function(e) {
    if (e.target && e.target.id === "headHouseForm") {
      /* form has its own async handler that calls api(); poll for completion */
      setTimeout(function() {
        /* if title reset to default, means createMode or save completed → close */
        closeDialog();
      }, 800);
    }
  }, true);
  console.log("[hh-dialog] bound");
})();

/* === Lottery dialogs (เพิ่มหวย / ตั้งเวลา) + chip click === */
(function lotteryDialogsModule() {
  function dlg(id) { return document.querySelector("#" + id); }
  function openD(id) {
    var d = dlg(id);
    if (!d) return;
    try { if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "open"); }
    catch(e) { d.setAttribute("open", "open"); }
  }
  function closeD(id) {
    var d = dlg(id);
    if (!d) return;
    try { if (typeof d.close === "function") d.close(); else d.removeAttribute("open"); }
    catch(e) { d.removeAttribute("open"); }
  }
  window.openLotteryForm = function() { openD("lotteryFormDialog"); };
  window.openScheduleForm = function() { openD("scheduleFormDialog"); };
  window.closeLotteryForm = function() { closeD("lotteryFormDialog"); };
  window.closeScheduleForm = function() { closeD("scheduleFormDialog"); };

  function bind() {
    var openLottBtn = document.querySelector("#openLotteryFormBtn");
    if (openLottBtn && !openLottBtn.dataset.bound) {
      openLottBtn.dataset.bound = "1";
      openLottBtn.addEventListener("click", function() {
        var f = document.querySelector("#lotteryForm");
        if (f) f.reset();
        openD("lotteryFormDialog");
      });
    }
    var closeLottBtn = document.querySelector("#closeLotteryFormBtn");
    if (closeLottBtn && !closeLottBtn.dataset.bound) {
      closeLottBtn.dataset.bound = "1";
      closeLottBtn.addEventListener("click", function() { closeD("lotteryFormDialog"); });
    }
    var closeSchedBtn = document.querySelector("#closeScheduleFormBtn");
    if (closeSchedBtn && !closeSchedBtn.dataset.bound) {
      closeSchedBtn.dataset.bound = "1";
      closeSchedBtn.addEventListener("click", function() {
        closeD("scheduleFormDialog");
        if (window.state) window.state.editingScheduleTemplateId = null;
      });
    }
    /* Click chip → open schedule dialog with preset lottery */
    var chips = document.querySelectorAll("#lotteryChips .chip, #lotteryChips .lottery-chip");
    chips.forEach(function(chip) {
      if (chip.dataset.scheduleBound) return;
      chip.dataset.scheduleBound = "1";
      chip.addEventListener("click", function(e) {
        if (e.target.closest("button")) return; /* let inner button handle */
        /* Try extract lottery_id from data-attribute */
        var lottId = chip.dataset.lotteryId || chip.dataset.id;
        if (!lottId) {
          /* fallback: extract from label text — find lottery by name */
          var txt = (chip.textContent || "").split("·")[0].trim();
          var lott = (window.state && window.state.lotteries || []).find(function(l) { return l.name === txt; });
          if (lott) lottId = lott.id;
        }
        var sel = document.querySelector("#scheduleLotteryInput");
        if (sel && lottId) {
          sel.value = lottId;
          sel.dispatchEvent(new Event("change", { bubbles: true }));
        }
        openD("scheduleFormDialog");
      });
    });
  }
  setInterval(bind, 700);
  /* Auto-close schedule form หลัง submit success */
  document.addEventListener("submit", function(e) {
    if (e.target && (e.target.id === "lotteryForm" || e.target.id === "scheduleForm")) {
      setTimeout(function() {
        closeD("lotteryFormDialog");
        closeD("scheduleFormDialog");
      }, 800);
    }
  }, true);
  console.log("[lottery-dialogs] bound");
})();

/* === Round form dialog bind === */
(function roundDialogMod() {
  function dlg() { return document.querySelector("#roundFormDialog"); }
  window.openRoundForm = function() {
    var d = dlg(); if (!d) return;
    try { if (d.showModal) d.showModal(); else d.setAttribute("open","open"); } catch(e) { d.setAttribute("open","open"); }
  };
  window.closeRoundForm = function() {
    var d = dlg(); if (!d) return;
    try { if (d.close) d.close(); else d.removeAttribute("open"); } catch(e) { d.removeAttribute("open"); }
  };
  function bind() {
    var openBtn = document.querySelector("#openRoundFormBtn");
    if (openBtn && !openBtn.dataset.bound) {
      openBtn.dataset.bound = "1";
      openBtn.addEventListener("click", function() {
        if (window.state) window.state.editingRoundId = null;
        var f = document.querySelector("#roundForm");
        if (f) f.reset();
        var title = document.querySelector("#roundFormTitle");
        if (title) title.textContent = "＋ สร้างงวด";
        var sub = document.querySelector("#roundSubmitBtn");
        if (sub) sub.textContent = "เพิ่มงวด";
        var reset = document.querySelector("#resetRoundBtn");
        if (reset) reset.classList.add("hidden");
        var lott = document.querySelector("#roundLotteryInput");
        if (lott) lott.disabled = false;
        window.openRoundForm();
      });
    }
    var closeBtn = document.querySelector("#closeRoundFormBtn");
    if (closeBtn && !closeBtn.dataset.bound) {
      closeBtn.dataset.bound = "1";
      closeBtn.addEventListener("click", window.closeRoundForm);
    }
  }
  setInterval(bind, 700);
  document.addEventListener("submit", function(e) {
    if (e.target && e.target.id === "roundForm") {
      setTimeout(window.closeRoundForm, 800);
    }
  }, true);
  console.log("[round-dialog] bound");
})();

/* === Result pending panel — collapse toggle === */
(function resultPendingCollapse() {
  function bind() {
    var panel = document.querySelector("#resultPendingPanel");
    if (!panel || panel.dataset.collapseBound) return;
    var head = panel.querySelector(".result-pending-head");
    if (!head) return;
    panel.dataset.collapseBound = "1";
    panel.classList.add("is-collapsed");  /* default collapsed */
    head.addEventListener("click", function() {
      panel.classList.toggle("is-collapsed");
    });
  }
  setInterval(bind, 700);
  console.log("[result-pending] collapse bound");
})();

/* === FEAT phase2.5: LINE contacts page === */
(function lineContactsModule() {
  function fmt(d) { return d ? new Date(d).toLocaleString("th-TH-u-ca-buddhist") : "-"; }
  async function load() {
    try {
      const data = await window.api("/api/line-contacts");
      render(data);
    } catch (e) { console.error("[line-contacts] load failed:", e.message); }
  }
  function render(rows) {
    const body = document.querySelector("#lineContactsBody");
    const empty = document.querySelector("#lineContactsEmpty");
    if (!body) return;
    body.innerHTML = "";
    if (empty) empty.classList.toggle("hidden", rows.length > 0);
    const hhOptions = ((window.state || {}).headHouses || []).map(h => `<option value="${h.id}">${h.code} · ${h.name}</option>`).join("");
    rows.forEach(c => {
      const tr = document.createElement("tr");
      const pic = c.picture_url ? `<img src="${c.picture_url}" alt="" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">` : "—";
      const status = c.bound_to_type === "head_house"
        ? `<span class="status-pill success">✓ ผูกกับ ${c.bound_head_house_name || c.bound_to_id}</span>`
        : `<span class="status-pill muted">ยังไม่ผูก</span>`;
      const action = c.bound_to_type === "head_house"
        ? `<button class="btn-icon btn-icon-cancel unbind-btn" data-uid="${c.user_id}">✕ ปลดผูก</button>`
        : `<button class="btn-icon btn-icon-approve bind-btn" data-uid="${c.user_id}">🔗 ผูก</button>`;
      tr.innerHTML = `
        <td>${pic}</td>
        <td><strong>${(c.display_name || "ไม่ทราบชื่อ")}</strong></td>
        <td><code style="font-size:0.78em;font-family:monospace;">${c.user_id.slice(0,20)}…</code></td>
        <td><small>${fmt(c.last_seen)}</small></td>
        <td class="num">${c.message_count}</td>
        <td>${status}</td>
        <td>${action}</td>
      `;
      body.appendChild(tr);
    });
    /* bind buttons */
    body.querySelectorAll(".bind-btn").forEach(btn => btn.addEventListener("click", async () => {
      const uid = btn.dataset.uid;
      const hh = await window.confirmDialog({
        title: "ผูกกับหัวบ้าน",
        body: `<p>เลือกหัวบ้านที่จะผูกกับ LINE User ID นี้:</p><select id="bindHHSelect" style="width:100%;padding:8px;border-radius:6px;border:1px solid #ccc;margin-top:8px;">${hhOptions}</select>`,
        confirmLabel: "✓ ผูก",
      });
      if (!hh) return;
      const targetId = document.querySelector("#bindHHSelect")?.value;
      if (!targetId) return;
      try {
        await window.api(`/api/line-contacts/${encodeURIComponent(uid)}/bind`, {
          method: "POST",
          body: { type: "head_house", targetId },
        });
        window.showToast && window.showToast("✓ ผูกเรียบร้อย", "success");
        load();
      } catch (e) { window.showToast && window.showToast("❌ ผูกไม่สำเร็จ: " + (e.payload?.error || e.message), "danger"); }
    }));
    body.querySelectorAll(".unbind-btn").forEach(btn => btn.addEventListener("click", async () => {
      const uid = btn.dataset.uid;
      const ok = await window.confirmDialog({ title: "ปลดผูก?", body: "ยืนยันปลดผูก LINE user นี้ออกจากหัวบ้าน", danger: true });
      if (!ok) return;
      await window.api(`/api/line-contacts/${encodeURIComponent(uid)}/bind`, { method: "POST", body: { type: "unbind" } });
      window.showToast && window.showToast("✓ ปลดผูกแล้ว", "success");
      load();
    }));
  }
  /* re-load when navigating to lineContacts view */
  setInterval(() => {
    const v = document.querySelector('[data-view="lineContacts"]');
    if (v && !v.hidden && !v.dataset.lastLoad) {
      v.dataset.lastLoad = "1";
      load();
    } else if (v && v.hidden) {
      delete v.dataset.lastLoad;
    }
  }, 800);
  window.refreshLineContacts = load;
  console.log("[line-contacts] module loaded");
})();

/* === FEAT bank-logo: enhance bank dropdown in admin form === */
(function bankDropdownEnhancer() {
  var BANKS = [{"code": "kbank", "name": "ธ.กสิกรไทย (KBANK)"}, {"code": "scb", "name": "ธ.ไทยพาณิชย์ (SCB)"}, {"code": "bbl", "name": "ธ.กรุงเทพ (BBL)"}, {"code": "ktb", "name": "ธ.กรุงไทย (KTB)"}, {"code": "bay", "name": "ธ.กรุงศรีอยุธยา (BAY)"}, {"code": "ttb", "name": "ธ.ทหารไทยธนชาต (TTB)"}, {"code": "gsb", "name": "ธ.ออมสิน (GSB)"}, {"code": "baac", "name": "ธ.ก.ส. (BAAC)"}, {"code": "kkp", "name": "ธ.เกียรตินาคินภัทร (KKP)"}, {"code": "ghb", "name": "ธ.อาคารสงเคราะห์ (GHB)"}, {"code": "lh", "name": "LH Bank"}, {"code": "cimb", "name": "CIMB Thai"}, {"code": "isbt", "name": "ธ.อิสลาม (ISBT)"}, {"code": "uob", "name": "UOB Thailand"}, {"code": "tisco", "name": "TISCO"}];
  function enhance() {
    var inp = document.querySelector("#bankBankName");
    if (!inp || inp.dataset.bankDropdownInit === "1") return;
    if (inp.tagName !== "INPUT") return;
    inp.dataset.bankDropdownInit = "1";
    /* Create datalist + add codes hint */
    var dl = document.createElement("datalist");
    dl.id = "bankNameDatalist";
    BANKS.forEach(function(b) {
      var opt = document.createElement("option");
      opt.value = b.name;
      opt.dataset.code = b.code;
      dl.appendChild(opt);
    });
    inp.parentNode.appendChild(dl);
    inp.setAttribute("list", "bankNameDatalist");
    inp.placeholder = "พิมพ์เพื่อค้นหา หรือเลือกจาก list (เช่น ธ.กสิกรไทย)";
    /* On select/change: auto-detect bank_code */
    inp.addEventListener("change", function() {
      var v = inp.value.trim();
      var match = BANKS.find(function(b) { return b.name === v; });
      if (match) inp.dataset.bankCode = match.code;
      else {
        var fuzzy = BANKS.find(function(b) {
          var keywords = b.name.replace(/[()].*/, "").trim().split(/\s+/);
          return keywords.some(function(k) { return k.length > 2 && v.indexOf(k) >= 0; });
        });
        inp.dataset.bankCode = fuzzy ? fuzzy.code : "";
      }
    });
  }
  setInterval(enhance, 700);
  console.log("[bank-dropdown] enhancer loaded");
})();


/* BUG-I FIX bootstrap: load apilotto coverage from server */
(async function loadApilottoCoverage() {
  try {
    const r = await fetch("/api/admin/apilotto/lotteries", { credentials: "include" });
    if (r.ok) {
      const j = await r.json();
      if (Array.isArray(j.lottery_ids)) window.__apilottoLotteries = j.lottery_ids;
    }
  } catch (e) { /* fallback to hardcoded */ }
  /* refresh in 5 min */
  setTimeout(loadApilottoCoverage, 5 * 60 * 1000);
})();

/* POLISH P4: global apilotto health pill บน topbar */
function renderApilottoHealthPill(health) {
  const tb = document.querySelector(".topbar") || document.body;
  let pill = document.querySelector("#apilottoHealthPill");
  if (!pill) {
    pill = document.createElement("div");
    pill.id = "apilottoHealthPill";
    pill.className = "apilotto-health-pill";
    pill.title = "สถานะ apilotto";
    tb.appendChild(pill);
  }
  if (!health) {
    pill.className = "apilotto-health-pill aps-unknown";
    pill.innerHTML = '<span class="aps-dot"></span> apilotto: —';
    return;
  }
  if (health.last_error) {
    pill.className = "apilotto-health-pill aps-error";
    pill.innerHTML = '<span class="aps-dot"></span> apilotto: ผิดพลาด';
    pill.title = health.last_error.msg + " @ " + (health.last_error.ts || "");
  } else if (health.last_success) {
    const mins = Math.round((Date.now() - new Date(health.last_success).getTime()) / 60000);
    pill.className = "apilotto-health-pill " + (mins < 60 ? "aps-healthy" : "aps-stale");
    pill.innerHTML = '<span class="aps-dot"></span> apilotto: ' + (mins < 1 ? "พึ่งดึง" : mins + " นาทีก่อน");
  } else {
    pill.className = "apilotto-health-pill aps-unknown";
    pill.innerHTML = '<span class="aps-dot"></span> apilotto: ไม่มีข้อมูล';
  }
}
async function pollApilottoHealth() {
  try {
    const r = await fetch("/api/admin/apilotto/health", { credentials: "include" });
    if (r.ok) renderApilottoHealthPill(await r.json());
  } catch (e) { renderApilottoHealthPill(null); }
}
setInterval(pollApilottoHealth, 60 * 1000);
setTimeout(pollApilottoHealth, 2000);


/* G1: หัวบ้านส่งสลิป — load + render section */
async function loadHHSlipsPending() {
  try {
    const r = await api("/api/admin/hh-slips?status=pending");
    return r.rows || [];
  } catch (e) { console.warn("[hh-slips load]", e); return []; }
}

async function renderHHSlipsSection() {
  const wrap = document.querySelector("#hhSlipsSection");
  if (!wrap) return;
  const rows = await loadHHSlipsPending();
  const countEl = wrap.querySelector(".hh-slips-count");
  if (countEl) countEl.textContent = rows.length ? `(${rows.length})` : "";
  const body = wrap.querySelector(".hh-slips-body");
  if (!body) return;
  if (!rows.length) {
    body.innerHTML = `<div class="empty-state">ยังไม่มีสลิปจากหัวบ้านรอตรวจ</div>`;
    return;
  }
  body.innerHTML = rows.map(r => {
    const amt = Number(r.amount).toLocaleString("th-TH");
    const when = new Date(r.created_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
    return `<div class="hh-slip-card" data-id="${r.id}">
      <div class="hh-slip-head">
        <strong>${r.head_house_name || r.head_house_id}</strong>
        <span class="muted">${when}</span>
      </div>
      <div class="hh-slip-body">
        <div>ยอด: <strong>฿${amt}</strong></div>
        ${r.sender_name ? `<div>ผู้ส่ง: ${r.sender_name}</div>` : ""}
        ${r.receiver_account ? `<div>บัญชีปลายทาง: ${r.receiver_account}</div>` : ""}
        ${r.trans_date ? `<div class="muted">วันที่โอน: ${r.trans_date}</div>` : ""}
      </div>
      <div class="hh-slip-actions">
        <button class="button button-success btn-hh-approve" data-id="${r.id}">✓ อนุมัติ (เคลียร์ยอด)</button>
        <button class="button button-secondary btn-hh-reject" data-id="${r.id}">✗ ปฏิเสธ</button>
      </div>
    </div>`;
  }).join("");
  body.querySelectorAll(".btn-hh-approve").forEach(b => b.addEventListener("click", async (e) => {
    const id = e.currentTarget.dataset.id;
    if (!(await confirmDialog({ title: "อนุมัติสลิปหัวบ้าน", body: "ยืนยันอนุมัติและเคลียร์ยอดเข้าบัญชี?" }))) return;
    try {
      const r = await api(`/api/admin/hh-slips/${encodeURIComponent(id)}/approve`, { method: "POST" });
      if (window.showToast) window.showToast(`✓ อนุมัติแล้ว ${r.bank_updated ? "+ บัญชีอัพเดท" : ""}`, "success");
      renderHHSlipsSection();
    } catch (err) { if (window.showToast) window.showToast("❌ " + (err.message || "ผิดพลาด"), "danger"); }
  }));
  body.querySelectorAll(".btn-hh-reject").forEach(b => b.addEventListener("click", async (e) => {
    const id = e.currentTarget.dataset.id;
    const r2 = await confirmDialog({ title: "ปฏิเสธสลิป", body: "เหตุผล (ไม่บังคับ)", withReason: true, danger: true });
    if (!r2) return;
    const note = typeof r2 === "object" ? (r2.reason || "") : "";
    try {
      await api(`/api/admin/hh-slips/${encodeURIComponent(id)}/reject`, { method: "POST", body: { note } });
      if (window.showToast) window.showToast("ปฏิเสธแล้ว", "info");
      renderHHSlipsSection();
    } catch (err) { if (window.showToast) window.showToast("❌ " + (err.message || "ผิดพลาด"), "danger"); }
  }));
}

/* G1: เรียก render section ตอน switch view ไป review + poll ทุก 20 วินาที */
window.renderHHSlipsSection = renderHHSlipsSection;
setInterval(() => {
  if (document.querySelector("#hhSlipsSection")) renderHHSlipsSection();
}, 20 * 1000);


/* X1: STATS DASHBOARD */
async function loadAndRenderStats() {
  const days = Number(document.querySelector("#statsDays")?.value || 30);
  try {
    const [pl, tn, tc] = await Promise.all([
      api(`/api/admin/stats/profit-loss?days=${days}`),
      api(`/api/admin/stats/top-numbers?days=${days}`),
      api(`/api/admin/stats/top-customers?days=${days}`),
    ]);
    /* summary cards */
    const sc = document.querySelector("#statsSummaryCards");
    if (sc) {
      sc.innerHTML = `
        <div class="card-stat"><div class="card-stat-label">งวดที่ปิด</div><div class="card-stat-value">${pl.summary.total_rounds}</div></div>
        <div class="card-stat"><div class="card-stat-label">ยอดเข้า</div><div class="card-stat-value">฿${Number(pl.summary.total_stake).toLocaleString("th-TH")}</div></div>
        <div class="card-stat"><div class="card-stat-label">จ่ายรางวัล</div><div class="card-stat-value">฿${Number(pl.summary.total_payout).toLocaleString("th-TH")}</div></div>
        <div class="card-stat"><div class="card-stat-label">กำไร</div><div class="card-stat-value" style="color:${pl.summary.total_profit >= 0 ? "var(--c-success)" : "var(--c-danger)"}">฿${Number(pl.summary.total_profit).toLocaleString("th-TH")}</div></div>
      `;
    }
    /* profit-loss table */
    const plBody = document.querySelector("#statsProfitLossBody");
    if (plBody) {
      plBody.innerHTML = pl.rounds.length ? `<table class="table">
        <thead><tr><th>วันที่</th><th>หวย</th><th>งวด</th><th>ยอดเข้า</th><th>จ่ายรางวัล</th><th>ผู้ถูก</th><th>กำไร</th></tr></thead>
        <tbody>${pl.rounds.map(r => `<tr><td>${r.draw_date}</td><td>${r.lottery_name}</td><td>${r.label}</td><td>฿${Number(r.total_stake).toLocaleString("th-TH")}</td><td>฿${Number(r.total_payout).toLocaleString("th-TH")}</td><td>${r.winner_count}</td><td style="color:${r.profit >= 0 ? "var(--c-success)" : "var(--c-danger)"}">฿${Number(r.profit).toLocaleString("th-TH")}</td></tr>`).join("")}</tbody>
      </table>` : `<div class="empty-state">ยังไม่มีงวดที่ปิดในช่วงนี้</div>`;
    }
    /* top numbers */
    const tnBody = document.querySelector("#statsTopNumbersBody");
    if (tnBody) {
      tnBody.innerHTML = tn.rows.length ? `<table class="table">
        <thead><tr><th>เลข</th><th>ประเภท</th><th>ใช้กี่ครั้ง</th><th>รวมยอด</th></tr></thead>
        <tbody>${tn.rows.slice(0,20).map(r => `<tr><td><strong>${r.number}</strong></td><td>${r.bet_type_name}</td><td>${r.uses}</td><td>฿${Number(r.total_amount).toLocaleString("th-TH")}</td></tr>`).join("")}</tbody>
      </table>` : `<div class="empty-state">ยังไม่มีข้อมูล</div>`;
    }
    /* top customers */
    const tcBody = document.querySelector("#statsTopCustomersBody");
    if (tcBody) {
      tcBody.innerHTML = tc.rows.length ? `<table class="table">
        <thead><tr><th>ลูกค้า</th><th>โทร</th><th>จำนวนบิล</th><th>รวมยอด</th></tr></thead>
        <tbody>${tc.rows.slice(0,20).map(r => `<tr><td>${r.name || r.code || "—"}</td><td>${r.phone || "—"}</td><td>${r.bills}</td><td>฿${Number(r.total_stake).toLocaleString("th-TH")}</td></tr>`).join("")}</tbody>
      </table>` : `<div class="empty-state">ยังไม่มีข้อมูล</div>`;
    }
  } catch (e) {
    if (window.showToast) window.showToast("❌ โหลดสถิติไม่สำเร็จ: " + e.message, "danger");
  }
}
/* trigger ตอน view = statsDashboard */
document.addEventListener("click", (e) => {
  const t = e.target.closest('[data-view-target="statsDashboard"]');
  if (t) setTimeout(loadAndRenderStats, 200);
});
document.addEventListener("change", (e) => { if (e.target?.id === "statsDays") loadAndRenderStats(); });
document.addEventListener("click", (e) => { if (e.target?.id === "statsRefreshBtn") loadAndRenderStats(); });

/* X1: PROMOTIONS */
async function loadAndRenderPromotions() {
  try {
    const r = await api("/api/admin/promotions");
    const body = document.querySelector("#promoList");
    if (!body) return;
    body.innerHTML = r.rows.length ? `<table class="table">
      <thead><tr><th>Code</th><th>ประเภท</th><th>ค่า</th><th>ใช้แล้ว/สูงสุด</th><th>หมดอายุ</th><th>สถานะ</th><th>—</th></tr></thead>
      <tbody>${r.rows.map(p => `<tr>
        <td><code>${p.code}</code></td>
        <td>${p.type === "percent" ? "เปอร์เซ็นต์" : p.type === "fixed" ? "หักคงที่" : "เครดิตเพิ่ม"}</td>
        <td>${p.type === "percent" ? p.value + "%" : "฿" + Number(p.value).toLocaleString("th-TH")}</td>
        <td>${p.used_count}/${p.max_uses || "∞"}</td>
        <td>${p.valid_to ? new Date(p.valid_to).toLocaleDateString("th-TH") : "—"}</td>
        <td>${p.enabled ? '<span class="badge badge-success">ใช้งาน</span>' : '<span class="badge badge-muted">ปิด</span>'}</td>
        <td>${p.enabled ? `<button class="button button-secondary btn-promo-disable" data-id="${p.id}">ปิด</button>` : ""}</td>
      </tr>`).join("")}</tbody>
    </table>` : `<div class="empty-state">ยังไม่มี code โปรโมชั่น</div>`;
    body.querySelectorAll(".btn-promo-disable").forEach(b => b.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      if (!(await confirmDialog({ title: "ปิด code", body: "ยืนยันปิด code นี้?", danger: true }))) return;
      try { await api(`/api/admin/promotions/${encodeURIComponent(id)}`, { method: "DELETE" }); loadAndRenderPromotions(); if (window.showToast) window.showToast("ปิดแล้ว", "info"); }
      catch (err) { if (window.showToast) window.showToast("❌ " + err.message, "danger"); }
    }));
  } catch (e) {
    if (window.showToast) window.showToast("❌ โหลด promotions ไม่สำเร็จ: " + e.message, "danger");
  }
}
document.addEventListener("click", (e) => {
  const t = e.target.closest('[data-view-target="promotionsAdmin"]');
  if (t) setTimeout(loadAndRenderPromotions, 200);
});
document.addEventListener("submit", async (e) => {
  if (e.target?.id !== "promoCreateForm") return;
  e.preventDefault();
  const body = {
    code: document.querySelector("#promoCode")?.value?.trim().toUpperCase(),
    type: document.querySelector("#promoType")?.value,
    value: Number(document.querySelector("#promoValue")?.value),
    min_amount: Number(document.querySelector("#promoMin")?.value) || 0,
    max_uses: Number(document.querySelector("#promoMaxUses")?.value) || 0,
    description: document.querySelector("#promoDesc")?.value || "",
  };
  try {
    await api("/api/admin/promotions", { method: "POST", body });
    if (window.showToast) window.showToast("✓ สร้าง code แล้ว", "success");
    e.target.reset();
    loadAndRenderPromotions();
  } catch (err) {
    if (window.showToast) window.showToast("❌ " + (err.message === "code_exists" ? "code นี้มีอยู่แล้ว" : err.message), "danger");
  }
});

window.loadAndRenderStats = loadAndRenderStats;
window.loadAndRenderPromotions = loadAndRenderPromotions;


/* F1-STABILITY: auto-refresh state ทุก 30 วินาที — กัน admin cache เก่า */
setInterval(async () => {
  /* skip ถ้า user ไม่ active หรือ tab background */
  if (document.hidden) return;
  if (typeof window.refreshState === "function") {
    try { await window.refreshState(); } catch (e) {}
  }
}, 30 * 1000);
