const STORAGE_KEY = "lottery-manager-v2";
const LEGACY_RECORDS_KEY = "lottery-records-v1";

const DEFAULT_LOTTERIES = [
  { id: "thai", name: "หวยไทย" },
  { id: "lao", name: "หวยลาว" },
  { id: "hanoi", name: "หวยฮานอย" },
  { id: "stock", name: "หวยหุ้น" },
];

const DEFAULT_CUSTOMERS = [
  { id: "walkin", code: "WALKIN", name: "ไม่ระบุชื่อ" },
];

const state = {
  ...loadAppState(),
  editingRecordId: null,
  editingLimitId: null,
};

const elements = {
  entryForm: document.querySelector("#entryForm"),
  formTitle: document.querySelector("#formTitle"),
  submitBtn: document.querySelector("#submitBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  customer: document.querySelector("#customerInput"),
  lottery: document.querySelector("#lotteryInput"),
  date: document.querySelector("#dateInput"),
  round: document.querySelector("#roundInput"),
  type: document.querySelector("#typeInput"),
  number: document.querySelector("#numberInput"),
  amount: document.querySelector("#amountInput"),
  tag: document.querySelector("#tagInput"),
  note: document.querySelector("#noteInput"),
  limitPreview: document.querySelector("#limitPreview"),
  customerForm: document.querySelector("#customerForm"),
  customerCode: document.querySelector("#customerCodeInput"),
  customerName: document.querySelector("#customerNameInput"),
  customerList: document.querySelector("#customerList"),
  lotteryForm: document.querySelector("#lotteryForm"),
  lotteryName: document.querySelector("#lotteryNameInput"),
  lotteryChips: document.querySelector("#lotteryChips"),
  limitForm: document.querySelector("#limitForm"),
  limitFormTitle: document.querySelector("#limitFormTitle"),
  limitSubmitBtn: document.querySelector("#limitSubmitBtn"),
  resetLimitBtn: document.querySelector("#resetLimitBtn"),
  limitLottery: document.querySelector("#limitLotteryInput"),
  limitRound: document.querySelector("#limitRoundInput"),
  limitType: document.querySelector("#limitTypeInput"),
  limitNumber: document.querySelector("#limitNumberInput"),
  limitAmount: document.querySelector("#limitAmountInput"),
  totalAmount: document.querySelector("#totalAmount"),
  totalEntries: document.querySelector("#totalEntries"),
  totalCustomers: document.querySelector("#totalCustomers"),
  totalLotteries: document.querySelector("#totalLotteries"),
  totalLimits: document.querySelector("#totalLimits"),
  nearLimitCount: document.querySelector("#nearLimitCount"),
  lotteryBars: document.querySelector("#lotteryBars"),
  typeBars: document.querySelector("#typeBars"),
  topNumbers: document.querySelector("#topNumbers"),
  dailyBars: document.querySelector("#dailyBars"),
  limitWatchList: document.querySelector("#limitWatchList"),
  limitsBody: document.querySelector("#limitsBody"),
  limitsEmptyState: document.querySelector("#limitsEmptyState"),
  recordsBody: document.querySelector("#recordsBody"),
  emptyState: document.querySelector("#emptyState"),
  searchInput: document.querySelector("#searchInput"),
  filterCustomer: document.querySelector("#filterCustomer"),
  filterLottery: document.querySelector("#filterLottery"),
  filterType: document.querySelector("#filterType"),
  exportBtn: document.querySelector("#exportBtn"),
  importInput: document.querySelector("#importInput"),
  recordActionsTemplate: document.querySelector("#recordActionsTemplate"),
  limitActionsTemplate: document.querySelector("#limitActionsTemplate"),
};

initialize();

function initialize() {
  elements.date.value = getTodayLocalDate();
  elements.entryForm.addEventListener("submit", handleRecordSubmit);
  elements.resetBtn.addEventListener("click", resetRecordForm);
  elements.customerForm.addEventListener("submit", handleCustomerSubmit);
  elements.lotteryForm.addEventListener("submit", handleLotterySubmit);
  elements.limitForm.addEventListener("submit", handleLimitSubmit);
  elements.resetLimitBtn.addEventListener("click", resetLimitForm);
  elements.searchInput.addEventListener("input", renderRecords);
  elements.filterCustomer.addEventListener("change", renderRecords);
  elements.filterLottery.addEventListener("change", renderRecords);
  elements.filterType.addEventListener("change", renderRecords);
  elements.exportBtn.addEventListener("click", exportData);
  elements.importInput.addEventListener("change", importData);
  elements.type.addEventListener("change", () => {
    syncNumberLimit(elements.number, elements.type.value);
    renderLimitPreview();
  });
  elements.number.addEventListener("input", () => {
    sanitizeNumberInput(elements.number, elements.type.value);
    renderLimitPreview();
  });
  [elements.lottery, elements.round, elements.amount].forEach((input) => {
    input.addEventListener("input", renderLimitPreview);
    input.addEventListener("change", renderLimitPreview);
  });
  elements.limitType.addEventListener("change", () => syncNumberLimit(elements.limitNumber, elements.limitType.value));
  elements.limitNumber.addEventListener("input", () => sanitizeNumberInput(elements.limitNumber, elements.limitType.value));
  syncNumberLimit(elements.number, elements.type.value);
  syncNumberLimit(elements.limitNumber, elements.limitType.value);
  render();
}

function loadAppState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return normalizeAppState(JSON.parse(raw));
    }

    const legacyRaw = localStorage.getItem(LEGACY_RECORDS_KEY);
    if (legacyRaw) {
      const legacyRecords = JSON.parse(legacyRaw);
      return normalizeAppState({
        lotteries: DEFAULT_LOTTERIES,
        customers: DEFAULT_CUSTOMERS,
        records: Array.isArray(legacyRecords)
          ? legacyRecords.map((record) => ({
              ...record,
              lotteryId: "thai",
              customerId: "walkin",
            }))
          : [],
        limits: [],
      });
    }
  } catch {
    return createEmptyState();
  }

  return createEmptyState();
}

function createEmptyState() {
  return {
    lotteries: DEFAULT_LOTTERIES.map((lottery) => ({ ...lottery })),
    customers: DEFAULT_CUSTOMERS.map((customer) => ({ ...customer })),
    records: [],
    limits: [],
  };
}

function normalizeAppState(data) {
  if (Array.isArray(data)) {
    return normalizeAppState({
      lotteries: DEFAULT_LOTTERIES,
      customers: DEFAULT_CUSTOMERS,
      records: data.map((record) => ({
        ...record,
        lotteryId: record.lotteryId ?? "thai",
        customerId: record.customerId ?? "walkin",
      })),
      limits: [],
    });
  }

  const fallback = createEmptyState();
  const lotteries = Array.isArray(data.lotteries) && data.lotteries.length
    ? data.lotteries
        .filter((lottery) => lottery && typeof lottery.id === "string" && typeof lottery.name === "string")
        .map((lottery) => ({
          id: lottery.id,
          name: lottery.name,
        }))
    : fallback.lotteries;
  const customers = Array.isArray(data.customers) && data.customers.length
    ? data.customers
        .filter((customer) => customer && typeof customer.id === "string" && typeof customer.code === "string")
        .map((customer) => ({
          id: customer.id,
          code: customer.code,
          name: String(customer.name ?? ""),
        }))
    : fallback.customers;

  const knownLotteryIds = new Set(lotteries.map((lottery) => lottery.id));
  const knownCustomerIds = new Set(customers.map((customer) => customer.id));
  const records = Array.isArray(data.records)
    ? data.records
        .filter(isImportedRecordValid)
        .map((record) => normalizeImportedRecord(record, knownLotteryIds, knownCustomerIds))
    : [];
  const limits = Array.isArray(data.limits)
    ? data.limits.filter(isImportedLimitValid).map((limit) => normalizeImportedLimit(limit, knownLotteryIds))
    : [];

  return { lotteries, customers, records, limits };
}

function saveAppState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      lotteries: state.lotteries,
      customers: state.customers,
      records: state.records,
      limits: state.limits,
    }),
  );
}

function handleRecordSubmit(event) {
  event.preventDefault();

  const record = buildRecordFromForm();
  if (!record) return;

  const matchedLimit = findMatchingLimit(record);
  const currentAmount = matchedLimit ? getCurrentAmountForLimit(matchedLimit, state.editingRecordId) : 0;

  if (matchedLimit && currentAmount + record.amount > matchedLimit.maxAmount) {
    alert(
      `เลข ${record.number} ของ ${getLotteryName(record.lotteryId)} งวด ${record.round} เกินเพดานอั้น ${formatMoney(
        matchedLimit.maxAmount,
      )}`,
    );
    return;
  }

  if (state.editingRecordId) {
    state.records = state.records.map((item) => (item.id === state.editingRecordId ? record : item));
  } else {
    state.records.push(record);
  }

  saveAppState();
  resetRecordForm();
  render();
}

function buildRecordFromForm() {
  const type = elements.type.value;
  const number = elements.number.value.trim();
  const amount = parseAmount(elements.amount.value);
  const round = elements.round.value.trim();

  if (!isValidNumber(number, type)) {
    alert(`เลข ${type} ตัว ต้องเป็นตัวเลข ${type} หลัก`);
    elements.number.focus();
    return null;
  }

  if (!round) {
    alert("กรุณากรอกงวด");
    elements.round.focus();
    return null;
  }

  if (!Number.isFinite(amount) || amount < 0) {
    alert("กรุณากรอกยอดเงินให้ถูกต้อง");
    elements.amount.focus();
    return null;
  }

  const existing = state.records.find((item) => item.id === state.editingRecordId);
  const timestamp = new Date().toISOString();

  return {
    id: state.editingRecordId ?? crypto.randomUUID(),
    customerId: elements.customer.value,
    lotteryId: elements.lottery.value,
    date: elements.date.value,
    round,
    type,
    number,
    amount,
    tag: elements.tag.value.trim(),
    note: elements.note.value.trim(),
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

function resetRecordForm() {
  state.editingRecordId = null;
  elements.entryForm.reset();
  elements.date.value = getTodayLocalDate();
  elements.formTitle.textContent = "เพิ่มรายการ";
  elements.submitBtn.textContent = "บันทึกรายการ";
  renderSelectOptions();
  syncNumberLimit(elements.number, elements.type.value);
  renderLimitPreview();
}

function handleCustomerSubmit(event) {
  event.preventDefault();
  const code = elements.customerCode.value.trim().toUpperCase();
  const name = elements.customerName.value.trim();

  if (!code) {
    alert("กรุณากรอกรหัสลูกค้า");
    elements.customerCode.focus();
    return;
  }

  const duplicate = state.customers.some((customer) => customer.code.toLowerCase() === code.toLowerCase());
  if (duplicate) {
    alert("มีรหัสลูกค้านี้อยู่แล้ว");
    return;
  }

  state.customers.push({
    id: createCustomerId(code),
    code,
    name,
  });
  saveAppState();
  elements.customerForm.reset();
  render();
}

function handleLotterySubmit(event) {
  event.preventDefault();
  const name = elements.lotteryName.value.trim();
  if (!name) return;

  const duplicate = state.lotteries.some((lottery) => lottery.name.toLowerCase() === name.toLowerCase());
  if (duplicate) {
    alert("มีหวยชื่อนี้อยู่แล้ว");
    return;
  }

  state.lotteries.push({
    id: createLotteryId(name),
    name,
  });
  saveAppState();
  elements.lotteryForm.reset();
  render();
}

function handleLimitSubmit(event) {
  event.preventDefault();

  const limit = buildLimitFromForm();
  if (!limit) return;

  const duplicate = state.limits.find(
    (item) =>
      item.id !== state.editingLimitId &&
      item.lotteryId === limit.lotteryId &&
      item.round === limit.round &&
      item.type === limit.type &&
      item.number === limit.number,
  );

  if (duplicate) {
    alert("เลขนี้ถูกตั้งอั้นไว้แล้วในงวดเดียวกัน");
    return;
  }

  if (state.editingLimitId) {
    state.limits = state.limits.map((item) => (item.id === state.editingLimitId ? limit : item));
  } else {
    state.limits.push(limit);
  }

  saveAppState();
  resetLimitForm();
  render();
}

function buildLimitFromForm() {
  const type = elements.limitType.value;
  const number = elements.limitNumber.value.trim();
  const round = elements.limitRound.value.trim();
  const maxAmount = parseAmount(elements.limitAmount.value);

  if (!round) {
    alert("กรุณากรอกงวดสำหรับอั้นเลข");
    elements.limitRound.focus();
    return null;
  }

  if (!isValidNumber(number, type)) {
    alert(`เลข ${type} ตัว ต้องเป็นตัวเลข ${type} หลัก`);
    elements.limitNumber.focus();
    return null;
  }

  if (!Number.isFinite(maxAmount) || maxAmount <= 0) {
    alert("กรุณากรอกเพดานยอดให้ถูกต้อง");
    elements.limitAmount.focus();
    return null;
  }

  const existing = state.limits.find((item) => item.id === state.editingLimitId);
  const timestamp = new Date().toISOString();

  return {
    id: state.editingLimitId ?? crypto.randomUUID(),
    lotteryId: elements.limitLottery.value,
    round,
    type,
    number,
    maxAmount,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

function resetLimitForm() {
  state.editingLimitId = null;
  elements.limitForm.reset();
  elements.limitFormTitle.textContent = "ตั้งค่าอั้นเลข";
  elements.limitSubmitBtn.textContent = "บันทึกอั้นเลข";
  renderSelectOptions();
  syncNumberLimit(elements.limitNumber, elements.limitType.value);
}

function render() {
  renderSelectOptions();
  renderCustomerList();
  renderLotteryChips();
  renderSummary();
  renderAnalytics();
  renderLimitWatchList();
  renderLimitsTable();
  renderRecords();
  renderLimitPreview();
}

function renderSelectOptions() {
  const options = state.lotteries
    .map((lottery) => `<option value="${escapeHtml(lottery.id)}">${escapeHtml(lottery.name)}</option>`)
    .join("");
  const filterOptions = `<option value="all">ทั้งหมด</option>${options}`;
  const customerOptions = state.customers
    .map((customer) => `<option value="${escapeHtml(customer.id)}">${escapeHtml(formatCustomerLabel(customer))}</option>`)
    .join("");
  const filterCustomerOptions = `<option value="all">ทั้งหมด</option>${customerOptions}`;

  const selectedCustomer = elements.customer.value || state.customers[0]?.id;
  const selectedLottery = elements.lottery.value || state.lotteries[0]?.id;
  const selectedLimitLottery = elements.limitLottery.value || state.lotteries[0]?.id;
  const selectedFilterCustomer = elements.filterCustomer.value || "all";
  const selectedFilterLottery = elements.filterLottery.value || "all";

  elements.customer.innerHTML = customerOptions;
  elements.lottery.innerHTML = options;
  elements.limitLottery.innerHTML = options;
  elements.filterCustomer.innerHTML = filterCustomerOptions;
  elements.filterLottery.innerHTML = filterOptions;

  if (state.customers.some((customer) => customer.id === selectedCustomer)) {
    elements.customer.value = selectedCustomer;
  }
  if (state.lotteries.some((lottery) => lottery.id === selectedLottery)) {
    elements.lottery.value = selectedLottery;
  }
  if (state.lotteries.some((lottery) => lottery.id === selectedLimitLottery)) {
    elements.limitLottery.value = selectedLimitLottery;
  }
  elements.filterCustomer.value = state.customers.some((customer) => customer.id === selectedFilterCustomer)
    ? selectedFilterCustomer
    : "all";
  elements.filterLottery.value = state.lotteries.some((lottery) => lottery.id === selectedFilterLottery)
    ? selectedFilterLottery
    : "all";
}

function renderCustomerList() {
  elements.customerList.innerHTML = "";

  state.customers.forEach((customer) => {
    const row = document.createElement("article");
    row.className = "customer-item";
    const recordCount = state.records.filter((record) => record.customerId === customer.id).length;
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(customer.code)}</strong>
        <span>${escapeHtml(customer.name || "ยังไม่มีชื่อ")}</span>
      </div>
      <small>${recordCount.toLocaleString("th-TH")} รายการ</small>
    `;
    elements.customerList.appendChild(row);
  });
}

function renderLotteryChips() {
  elements.lotteryChips.innerHTML = "";
  state.lotteries.forEach((lottery) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    const recordCount = state.records.filter((record) => record.lotteryId === lottery.id).length;
    chip.textContent = `${lottery.name} ${recordCount.toLocaleString("th-TH")} รายการ`;
    elements.lotteryChips.appendChild(chip);
  });
}

function renderSummary() {
  const nearLimits = getLimitStatuses().filter((item) => item.status !== "normal");
  elements.totalAmount.textContent = formatMoney(sumBy(state.records, "amount"));
  elements.totalEntries.textContent = state.records.length.toLocaleString("th-TH");
  elements.totalCustomers.textContent = state.customers.length.toLocaleString("th-TH");
  elements.totalLotteries.textContent = state.lotteries.length.toLocaleString("th-TH");
  elements.totalLimits.textContent = state.limits.length.toLocaleString("th-TH");
  elements.nearLimitCount.textContent = nearLimits.length.toLocaleString("th-TH");
}

function renderAnalytics() {
  renderLotteryBars();
  renderTypeBars();
  renderTopNumbers();
  renderDailyBars();
}

function renderLotteryBars() {
  const totals = state.lotteries.map((lottery) => ({
    label: lottery.name,
    value: sumBy(
      state.records.filter((record) => record.lotteryId === lottery.id),
      "amount",
    ),
  }));
  const max = Math.max(...totals.map((item) => item.value), 1);

  elements.lotteryBars.innerHTML = "";
  totals.forEach((item, index) => {
    elements.lotteryBars.appendChild(createBarRow(item.label, item.value, max, `tone-${(index % 4) + 1}`));
  });
}

function renderTypeBars() {
  const totalTwo = sumBy(state.records.filter((record) => record.type === "2"), "amount");
  const totalThree = sumBy(state.records.filter((record) => record.type === "3"), "amount");
  const max = Math.max(totalTwo, totalThree, 1);

  elements.typeBars.innerHTML = "";
  elements.typeBars.appendChild(createBarRow("2 ตัว", totalTwo, max, "tone-1"));
  elements.typeBars.appendChild(createBarRow("3 ตัว", totalThree, max, "tone-2"));
}

function createBarRow(label, value, max, toneClass) {
  const row = document.createElement("div");
  row.className = "bar-row";
  row.innerHTML = `
    <div class="bar-meta">
      <span>${escapeHtml(label)}</span>
      <strong>${formatMoney(value)}</strong>
    </div>
    <div class="bar-track">
      <div class="bar-fill ${toneClass}" style="width: ${(value / max) * 100}%"></div>
    </div>
  `;
  return row;
}

function renderTopNumbers() {
  const grouped = state.records.reduce((acc, record) => {
    const key = `${record.lotteryId}-${record.type}-${record.number}`;
    if (!acc[key]) {
      acc[key] = {
        label: `${record.number} (${record.type} ตัว)`,
        lotteryName: getLotteryName(record.lotteryId),
        count: 0,
        amount: 0,
      };
    }
    acc[key].count += 1;
    acc[key].amount += record.amount;
    return acc;
  }, {});

  const top = Object.values(grouped)
    .sort((a, b) => b.count - a.count || b.amount - a.amount)
    .slice(0, 5);

  elements.topNumbers.innerHTML = "";

  if (!top.length) {
    elements.topNumbers.innerHTML = "<li><span>ยังไม่มีข้อมูล</span></li>";
    return;
  }

  top.forEach((item) => {
    const row = document.createElement("li");
    row.innerHTML = `
      <span>${escapeHtml(item.label)} <small>${escapeHtml(item.lotteryName)}</small></span>
      <strong>${item.count} ครั้ง</strong>
    `;
    elements.topNumbers.appendChild(row);
  });
}

function renderDailyBars() {
  const daily = state.records.reduce((acc, record) => {
    acc[record.date] = (acc[record.date] ?? 0) + record.amount;
    return acc;
  }, {});
  const entries = Object.entries(daily)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .slice(-7);
  const max = Math.max(...entries.map(([, value]) => value), 1);

  elements.dailyBars.innerHTML = "";
  if (!entries.length) {
    elements.dailyBars.innerHTML = '<div class="empty-state">ยังไม่มีข้อมูล</div>';
    return;
  }

  entries.forEach(([date, amount]) => {
    const column = document.createElement("div");
    column.className = "daily-column";
    const percent = Math.max((amount / max) * 100, 8);
    column.innerHTML = `
      <strong>${formatCompactMoney(amount)}</strong>
      <div class="daily-fill" style="height: ${percent}%"></div>
      <span class="daily-label">${formatShortDate(date)}</span>
    `;
    elements.dailyBars.appendChild(column);
  });
}

function renderLimitWatchList() {
  const flagged = getLimitStatuses()
    .filter((item) => item.status !== "normal")
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 6);

  elements.limitWatchList.innerHTML = "";

  if (!flagged.length) {
    elements.limitWatchList.innerHTML = '<div class="empty-state">ยังไม่มีเลขใกล้เต็ม</div>';
    return;
  }

  flagged.forEach((item) => {
    const card = document.createElement("article");
    card.className = `watch-item ${item.status}`;
    card.innerHTML = `
      <div>
        <strong>${escapeHtml(item.limit.number)} (${item.limit.type} ตัว)</strong>
        <span>${escapeHtml(getLotteryName(item.limit.lotteryId))} / ${escapeHtml(item.limit.round)}</span>
      </div>
      <div>
        <strong>${formatMoney(item.currentAmount)}</strong>
        <span>${formatPercent(item.percent)}</span>
      </div>
    `;
    elements.limitWatchList.appendChild(card);
  });
}

function renderLimitsTable() {
  const statuses = getLimitStatuses().sort(
    (a, b) => b.percent - a.percent || getSortTimestamp(b.limit).localeCompare(getSortTimestamp(a.limit)),
  );

  elements.limitsBody.innerHTML = "";
  elements.limitsEmptyState.classList.toggle("hidden", statuses.length > 0);

  statuses.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(getLotteryName(item.limit.lotteryId))}</td>
      <td>${escapeHtml(item.limit.round)}</td>
      <td>${item.limit.type} ตัว</td>
      <td><span class="number-pill">${item.limit.number}</span></td>
      <td class="amount">${formatMoney(item.currentAmount)}</td>
      <td class="amount">${formatMoney(item.limit.maxAmount)}</td>
      <td class="amount">${formatMoney(Math.max(item.remaining, 0))}</td>
      <td><span class="status-pill ${item.status}">${getStatusLabel(item.status)}</span></td>
      <td></td>
    `;

    const actions = elements.limitActionsTemplate.content.cloneNode(true);
    actions.querySelector(".edit-limit-button").addEventListener("click", () => beginLimitEdit(item.limit.id));
    actions.querySelector(".delete-limit-button").addEventListener("click", () => deleteLimit(item.limit.id));
    row.lastElementChild.appendChild(actions);
    elements.limitsBody.appendChild(row);
  });
}

function renderRecords() {
  const search = elements.searchInput.value.trim();
  const filterCustomer = elements.filterCustomer.value;
  const filterLottery = elements.filterLottery.value;
  const filterType = elements.filterType.value;
  const visible = state.records
    .filter((record) => !search || record.number.includes(search))
    .filter((record) => filterCustomer === "all" || record.customerId === filterCustomer)
    .filter((record) => filterLottery === "all" || record.lotteryId === filterLottery)
    .filter((record) => filterType === "all" || record.type === filterType)
    .sort((a, b) => b.date.localeCompare(a.date) || getSortTimestamp(b).localeCompare(getSortTimestamp(a)));

  elements.recordsBody.innerHTML = "";
  elements.emptyState.classList.toggle("hidden", visible.length > 0);

  visible.forEach((record) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatLongDate(record.date)}</td>
      <td>${escapeHtml(getCustomerCode(record.customerId))}</td>
      <td>${escapeHtml(getLotteryName(record.lotteryId))}</td>
      <td>${escapeHtml(record.round)}</td>
      <td>${record.type} ตัว</td>
      <td><span class="number-pill">${record.number}</span></td>
      <td class="amount">${formatMoney(record.amount)}</td>
      <td>${escapeHtml(record.tag || "-")}</td>
      <td></td>
    `;

    const actions = elements.recordActionsTemplate.content.cloneNode(true);
    actions.querySelector(".edit-button").addEventListener("click", () => beginRecordEdit(record.id));
    actions.querySelector(".delete-button").addEventListener("click", () => deleteRecord(record.id));
    row.lastElementChild.appendChild(actions);
    elements.recordsBody.appendChild(row);
  });
}

function renderLimitPreview() {
  const previewRecord = buildPreviewRecord();
  const matchedLimit = previewRecord ? findMatchingLimit(previewRecord) : null;

  if (!matchedLimit) {
    elements.limitPreview.classList.add("hidden");
    elements.limitPreview.innerHTML = "";
    return;
  }

  const currentAmount = getCurrentAmountForLimit(matchedLimit, state.editingRecordId);
  const requestedAmount = Number.isFinite(previewRecord.amount) ? previewRecord.amount : 0;
  const projectedAmount = currentAmount + requestedAmount;
  const percent = matchedLimit.maxAmount ? projectedAmount / matchedLimit.maxAmount : 0;
  const status = getLimitStatus(percent);
  const remaining = matchedLimit.maxAmount - projectedAmount;

  elements.limitPreview.className = `limit-preview ${status}`;
  elements.limitPreview.innerHTML = `
    <strong>อั้นเลขที่ตรงกัน</strong>
    <span>ปัจจุบัน ${formatMoney(currentAmount)} / เพดาน ${formatMoney(matchedLimit.maxAmount)}</span>
    <span>หลังบันทึก ${formatMoney(projectedAmount)} (${formatPercent(percent)})</span>
    <span>${remaining >= 0 ? `คงเหลือ ${formatMoney(remaining)}` : `เกินเพดาน ${formatMoney(Math.abs(remaining))}`}</span>
  `;
}

function buildPreviewRecord() {
  const type = elements.type.value;
  const number = elements.number.value.trim();
  const round = elements.round.value.trim();

  if (!elements.lottery.value || !round || !isValidNumber(number, type)) {
    return null;
  }

  return {
    lotteryId: elements.lottery.value,
    round,
    type,
    number,
    amount: parseAmount(elements.amount.value),
  };
}

function getLimitStatuses() {
  return state.limits.map((limit) => {
    const currentAmount = getCurrentAmountForLimit(limit);
    const percent = limit.maxAmount ? currentAmount / limit.maxAmount : 0;
    return {
      limit,
      currentAmount,
      remaining: limit.maxAmount - currentAmount,
      percent,
      status: getLimitStatus(percent),
    };
  });
}

function getCurrentAmountForLimit(limit, excludedRecordId = null) {
  return sumBy(
    state.records.filter(
      (record) =>
        record.id !== excludedRecordId &&
        record.lotteryId === limit.lotteryId &&
        record.round === limit.round &&
        record.type === limit.type &&
        record.number === limit.number,
    ),
    "amount",
  );
}

function findMatchingLimit(record) {
  return state.limits.find(
    (limit) =>
      limit.lotteryId === record.lotteryId &&
      limit.round === record.round &&
      limit.type === record.type &&
      limit.number === record.number,
  );
}

function beginRecordEdit(id) {
  const record = state.records.find((item) => item.id === id);
  if (!record) return;

  state.editingRecordId = id;
  renderSelectOptions();
  elements.lottery.value = record.lotteryId;
  elements.customer.value = record.customerId;
  elements.date.value = record.date;
  elements.round.value = record.round;
  elements.type.value = record.type;
  elements.number.value = record.number;
  elements.amount.value = record.amount;
  elements.tag.value = record.tag;
  elements.note.value = record.note;
  elements.formTitle.textContent = "แก้ไขรายการ";
  elements.submitBtn.textContent = "บันทึกการแก้ไข";
  syncNumberLimit(elements.number, elements.type.value);
  renderLimitPreview();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteRecord(id) {
  const record = state.records.find((item) => item.id === id);
  if (!record) return;

  if (!confirm(`ลบรายการเลข ${record.number} ใช่หรือไม่`)) return;
  state.records = state.records.filter((item) => item.id !== id);
  saveAppState();
  if (state.editingRecordId === id) {
    resetRecordForm();
  }
  render();
}

function beginLimitEdit(id) {
  const limit = state.limits.find((item) => item.id === id);
  if (!limit) return;

  state.editingLimitId = id;
  renderSelectOptions();
  elements.limitLottery.value = limit.lotteryId;
  elements.limitRound.value = limit.round;
  elements.limitType.value = limit.type;
  elements.limitNumber.value = limit.number;
  elements.limitAmount.value = limit.maxAmount;
  elements.limitFormTitle.textContent = "แก้ไขอั้นเลข";
  elements.limitSubmitBtn.textContent = "บันทึกการแก้ไข";
  syncNumberLimit(elements.limitNumber, elements.limitType.value);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteLimit(id) {
  const limit = state.limits.find((item) => item.id === id);
  if (!limit) return;

  if (!confirm(`ลบอั้นเลข ${limit.number} ใช่หรือไม่`)) return;
  state.limits = state.limits.filter((item) => item.id !== id);
  saveAppState();
  if (state.editingLimitId === id) {
    resetLimitForm();
  }
  render();
}

function exportData() {
  const payload = {
    lotteries: state.lotteries,
    customers: state.customers,
    records: state.records,
    limits: state.limits,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `lottery-manager-${getTodayLocalDate()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const normalized = normalizeAppState(parsed);
      state.lotteries = normalized.lotteries;
      state.customers = normalized.customers;
      state.records = normalized.records;
      state.limits = normalized.limits;
      state.editingRecordId = null;
      state.editingLimitId = null;
      saveAppState();
      resetRecordForm();
      resetLimitForm();
      render();
      alert("นำเข้าข้อมูลเรียบร้อย");
    } catch {
      alert("ไฟล์ไม่ถูกต้อง กรุณาใช้ไฟล์ JSON ที่ส่งออกจากระบบนี้");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function isImportedRecordValid(record) {
  return (
    record &&
    typeof record.id === "string" &&
    typeof record.date === "string" &&
    typeof record.round === "string" &&
    typeof record.type === "string" &&
    isValidNumber(String(record.number), record.type) &&
    Number.isFinite(Number(record.amount))
  );
}

function isImportedLimitValid(limit) {
  return (
    limit &&
    typeof limit.id === "string" &&
    typeof limit.round === "string" &&
    typeof limit.type === "string" &&
    isValidNumber(String(limit.number), limit.type) &&
    Number.isFinite(Number(limit.maxAmount))
  );
}

function normalizeImportedRecord(record, knownLotteryIds, knownCustomerIds) {
  const fallbackTimestamp = new Date().toISOString();
  return {
    id: record.id,
    customerId: knownCustomerIds.has(record.customerId) ? record.customerId : "walkin",
    lotteryId: knownLotteryIds.has(record.lotteryId) ? record.lotteryId : "thai",
    date: record.date,
    round: record.round,
    type: record.type,
    number: String(record.number),
    amount: Number(record.amount),
    tag: String(record.tag ?? ""),
    note: String(record.note ?? ""),
    createdAt: record.createdAt ?? fallbackTimestamp,
    updatedAt: record.updatedAt ?? record.createdAt ?? fallbackTimestamp,
  };
}

function normalizeImportedLimit(limit, knownLotteryIds) {
  const fallbackTimestamp = new Date().toISOString();
  return {
    id: limit.id,
    lotteryId: knownLotteryIds.has(limit.lotteryId) ? limit.lotteryId : "thai",
    round: limit.round,
    type: limit.type,
    number: String(limit.number),
    maxAmount: Number(limit.maxAmount),
    createdAt: limit.createdAt ?? fallbackTimestamp,
    updatedAt: limit.updatedAt ?? limit.createdAt ?? fallbackTimestamp,
  };
}

function syncNumberLimit(input, type) {
  input.maxLength = Number(type);
  input.placeholder = type === "2" ? "เช่น 45" : "เช่น 123";
  sanitizeNumberInput(input, type);
}

function sanitizeNumberInput(input, type) {
  input.value = input.value.replace(/\D/g, "").slice(0, Number(type));
}

function isValidNumber(number, type) {
  return new RegExp(`^\\d{${type}}$`).test(number);
}

function parseAmount(value) {
  return Number(String(value).replaceAll(",", ""));
}

function sumBy(items, key) {
  return items.reduce((sum, item) => sum + Number(item[key] || 0), 0);
}

function getLotteryName(id) {
  return state.lotteries.find((lottery) => lottery.id === id)?.name ?? "ไม่ทราบชื่อ";
}

function getCustomerCode(id) {
  return state.customers.find((customer) => customer.id === id)?.code ?? "WALKIN";
}

function formatCustomerLabel(customer) {
  return customer.name ? `${customer.code} · ${customer.name}` : customer.code;
}

function getLimitStatus(percent) {
  if (percent >= 1) return "full";
  if (percent >= 0.8) return "warning";
  return "normal";
}

function getStatusLabel(status) {
  if (status === "full") return "เต็ม";
  if (status === "warning") return "ใกล้เต็ม";
  return "ปกติ";
}

function formatMoney(value) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatCompactMoney(value) {
  return new Intl.NumberFormat("th-TH", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatPercent(value) {
  return new Intl.NumberFormat("th-TH", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T00:00:00`));
}

function getTodayLocalDate() {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  return new Date(today.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function getSortTimestamp(item) {
  return item.updatedAt ?? item.createdAt ?? `${getTodayLocalDate()}T00:00:00.000Z`;
}

function createLotteryId(name) {
  const fallback = `lottery-${crypto.randomUUID().slice(0, 8)}`;
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const base = slug || fallback;

  if (!state.lotteries.some((lottery) => lottery.id === base)) {
    return base;
  }

  let suffix = 2;
  while (state.lotteries.some((lottery) => lottery.id === `${base}-${suffix}`)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}

function createCustomerId(code) {
  const base = code
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const fallback = `customer-${crypto.randomUUID().slice(0, 8)}`;
  const safeBase = base || fallback;

  if (!state.customers.some((customer) => customer.id === safeBase)) {
    return safeBase;
  }

  let suffix = 2;
  while (state.customers.some((customer) => customer.id === `${safeBase}-${suffix}`)) {
    suffix += 1;
  }
  return `${safeBase}-${suffix}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
