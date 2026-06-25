/* ====== บ้านหวยเรือนเลขเศรษฐี — Customer Order Page ====== */
(function () {
  "use strict";

  const STORAGE_KEY = "ruenlek-customer-info";

  // === LIFF INIT (2026-05-22) ===
  var lineProfile = null;
  // Referral code: ?ref=HB001 from Rich Menu link → persisted in localStorage
  var referralCode = null;
  try {
    var urlRef = new URLSearchParams(window.location.search).get("ref");
    if (urlRef) {
      referralCode = String(urlRef).trim().slice(0, 40);
      try { localStorage.setItem("ruenlek-ref", referralCode); } catch (e) {}
    } else {
      try { referralCode = localStorage.getItem("ruenlek-ref") || null; } catch (e) {}
    }
  } catch (e) {}
  async function tryLiffInit() {
    var diag = {
      ts: new Date().toISOString(),
      stage: "start",
      url: location.href,
      ua: navigator.userAgent,
      hasLiff: !!window.liff,
      liffId: window.LIFF_ID || null,
      placeholder: window.LIFF_ID === "REPLACE_WITH_LIFF_ID",
    };
    function sendDiag() {
      try {
        navigator.sendBeacon
          ? navigator.sendBeacon("/api/debug/liff-info",
              new Blob([JSON.stringify(diag)], { type: "application/json" }))
          : fetch("/api/debug/liff-info", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(diag),
              keepalive: true,
            });
      } catch (e) {}
    }
    if (!window.liff || !window.LIFF_ID || window.LIFF_ID === "REPLACE_WITH_LIFF_ID") {
      diag.stage = "no_sdk_or_id";
      sendDiag();
      return;
    }
    try {
      await liff.init({ liffId: window.LIFF_ID });
      diag.stage = "init_ok";
      diag.initOk = true;
      try { diag.isInClient = !!(liff.isInClient && liff.isInClient()); } catch (e) { diag.isInClientErr = String(e.message || e); }
      try { diag.isLoggedIn = !!(liff.isLoggedIn && liff.isLoggedIn()); } catch (e) { diag.isLoggedInErr = String(e.message || e); }
      try { diag.os = liff.getOS && liff.getOS(); } catch (e) {}
      try { diag.lang = liff.getLanguage && liff.getLanguage(); } catch (e) {}
      try { diag.lineVersion = liff.getLineVersion && liff.getLineVersion(); } catch (e) {}
      try { diag.context = liff.getContext && liff.getContext(); } catch (e) { diag.contextErr = String(e.message || e); }
      var uaHasLine = /Line\//i.test(navigator.userAgent);
      diag.uaHasLine = uaHasLine;
      // Treat as in-LINE if SDK says so OR User-Agent contains "Line/"
      var inLine = diag.isInClient || uaHasLine;
      diag.effectiveInLine = inLine;
      if (!inLine) {
        diag.stage = "external_browser";
        console.log("[LIFF] not in LINE app — skip auto-login");
        sendDiag();
        return;
      }
      if (!diag.isLoggedIn) {
        diag.stage = "not_logged_in_will_login";
        sendDiag();
        try { liff.login(); } catch (e) { console.warn("[LIFF] login err:", e); }
        return;
      }
      try {
        const p = await liff.getProfile();
        diag.userIdLen = p && p.userId ? p.userId.length : 0;
        diag.hasDisplayName = !!(p && p.displayName);
        const token = liff.getAccessToken ? liff.getAccessToken() : null;
        diag.hasToken = !!token;
        diag.tokenLen = token ? token.length : 0;
        diag.stage = diag.hasToken ? "ok_with_token" : "ok_no_token";
        lineProfile = { userId: p.userId, displayName: p.displayName, pictureUrl: p.pictureUrl, accessToken: token };
        var nameInput = document.querySelector("#custName");
        if (nameInput && !nameInput.value) nameInput.value = p.displayName || "";
        var head = document.querySelector(".topbar .brand");
        if (head && !document.querySelector(".liff-badge")) {
          var bd = document.createElement("div");
          bd.className = "liff-badge";
          bd.innerHTML = (p.pictureUrl ? '<img src="' + p.pictureUrl + '" alt="" />' : "") + '<span>เข้าระบบเป็น <strong>' + p.displayName + '</strong></span>';
          head.appendChild(bd);
        }
      } catch (e) {
        diag.stage = "get_profile_failed";
        diag.profileErr = String(e.message || e);
      }
    } catch (e) {
      diag.stage = "init_failed";
      diag.error = String(e.message || e);
      diag.stack = String(e.stack || "").slice(0, 500);
      console.warn("[LIFF] init failed:", e.message);
    }
    sendDiag();
  }
  tryLiffInit();

  const state = {
    step: 1,
    customer: { name: "", phone: "" },
    lotteries: [],
    rounds: [],
    schedules: [],
    betTypes: [],
    selectedLotteryId: null,
    selectedRoundId: null,
    selectedBetType: null,
    entries: [], // { betTypeId, betTypeName, digits, number, amount }
    note: "",
    submitting: false,
  };

  // ----- helpers -----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const fmt = (n) => Number(n || 0).toLocaleString("th-TH");

  function toast(msg, kind = "") {
    const el = $("#toast");
    el.textContent = msg;
    el.className = "toast" + (kind ? " toast-" + kind : "");
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (el.hidden = true), 3000);
  }

  function setError(inputId, msg) {
    const small = document.querySelector(`.field-error[data-for="${inputId}"]`);
    const input = document.getElementById(inputId);
    if (small) small.textContent = msg || "";
    if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  function clearAllErrors() {
    $$(".field-error").forEach((el) => (el.textContent = ""));
    $$("[aria-invalid='true']").forEach((el) => el.setAttribute("aria-invalid", "false"));
  }

  function saveLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.customer));
    } catch (e) { /* ignore */ }
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const obj = JSON.parse(raw);
      if (obj && typeof obj === "object") {
        state.customer.name = String(obj.name || "");
        state.customer.phone = String(obj.phone || "");
      }
    } catch (e) { /* ignore */ }
  }

  // ----- step navigation -----
  function setStep(n) {
    state.step = n;
    $$(".step").forEach((s) => {
      s.hidden = Number(s.dataset.step) !== n;
    });
    $$("#stepIndicator li").forEach((li) => {
      const stp = Number(li.dataset.step);
      li.classList.toggle("active", stp === n);
      li.classList.toggle("done", stp < n);
    });
    $("#restartBtn").hidden = n === 1;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ----- API -----
  async function api(path, opts = {}) {
    const res = await fetch(path, {
      method: opts.method || "GET",
      headers: { "Content-Type": "application/json" },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    let data = null;
    try { data = await res.json(); } catch (e) { /* may be empty */ }
    if (!res.ok) {
      const err = new Error((data && data.error) || `http_${res.status}`);
      err.payload = data;
      err.status = res.status;
      throw err;
    }
    return data;
  }

  async function loadOpenRounds() {
    try {
      const data = await api("/api/customer/open-rounds");
      state.lotteries = data.lotteries || [];
      state.rounds = data.rounds || [];
      state.betTypes = data.betTypes || [];
      renderLotteryGrid();
    } catch (err) {
      $("#lotteryGrid").innerHTML = `<div class="empty">โหลดข้อมูลไม่สำเร็จ — ลองรีเฟรชอีกครั้ง<br><small>${err.message}</small></div>`;
    }
  }

  // ----- render lottery grid -----
  function nextAcceptingRound(lotteryId) {
    const now = Date.now();
    const candidates = state.rounds
      .filter((r) => r.lottery_id === lotteryId && r.accepting)
      .sort((a, b) => new Date(a.draw_at) - new Date(b.draw_at));
    return candidates[0] || null;
  }

  function formatCloseTime(round) {
    if (!round || !round.close_at) return "";
    const close = new Date(round.close_at);
    const now = new Date();
    const diffMin = Math.round((close - now) / 60000);
    if (diffMin < 60) return `ปิดรับใน ${diffMin} นาที`;
    if (diffMin < 60 * 24) return `ปิดรับใน ${Math.round(diffMin / 60)} ชม.`;
    const days = Math.round(diffMin / (60 * 24));
    return `ปิดรับใน ${days} วัน`;
  }

  function formatThaiDate(iso) {
    if (!iso) return "";
    try {
      const d = new Date(iso + "T00:00:00");
      return d.toLocaleDateString("th-TH-u-ca-buddhist", { day: "2-digit", month: "short" });
    } catch (e) { return iso; }
  }

  /* FLAG-V1: ธงประเทศของแต่ละหวย — emoji ใช้ใน lottery card */
  const LOTTO_FLAG_MAP = {
    "thai": "🇹🇭", "omsin": "🇹🇭", "baac": "🇹🇭",
    "lott_023": "🇹🇭",
    "lott_027": "🇱🇦",
    "lott_032": "🇲🇾",
    "lott_033": "🇻🇳", "lott_035": "🇻🇳", "lott_036": "🇻🇳",
    "lott_010": "🇷🇺", "lott_039": "🇷🇺",
    "lott_011": "🇬🇧", "lott_037": "🇬🇧",
    "lott_012": "🇩🇪", "lott_038": "🇩🇪",
    "lott_013": "🇺🇸", "lott_040": "🇺🇸",
    "lott_014": "🇪🇬",
    "lott_015": "🇯🇵", "lott_020": "🇯🇵", "lott_041": "🇯🇵", "lott_046": "🇯🇵",
    "lott_016": "🇨🇳", "lott_021": "🇨🇳", "lott_042": "🇨🇳", "lott_047": "🇨🇳",
    "lott_017": "🇭🇰", "lott_022": "🇭🇰", "lott_043": "🇭🇰", "lott_048": "🇭🇰",
    "lott_018": "🇹🇼", "lott_044": "🇹🇼",
    "lott_019": "🇰🇷", "lott_045": "🇰🇷",
    "lott_024": "🇸🇬", "lott_049": "🇸🇬",
    "lott_025": "🇮🇳",
  };
  function lottoFlag(id) { return LOTTO_FLAG_MAP[id] || "🎰"; }
  /* LOTTO_BG_MAP: รูปประจำหวย (sync กับ server.js) */
  const LOTTO_BG_MAP = {
    "thai": "thai", "omsin": "thai", "baac": "thai",
    "lott_027": "lao", "lott_032": "malay",
    "lott_033": "hanoi", "lott_035": "hanoi", "lott_036": "hanoi",
    "lott_023": "thai",
    "lott_016": "china", "lott_021": "china", "lott_042": "china", "lott_047": "china",
    "lott_015": "nikkei", "lott_020": "nikkei", "lott_041": "nikkei", "lott_046": "nikkei",
    "lott_017": "hangseng", "lott_022": "hangseng", "lott_043": "hangseng", "lott_048": "hangseng",
  };
  function lottoBgUrl(id) { return "/img/lotto-bg/" + (LOTTO_BG_MAP[id] || "thai") + ".jpg"; }

    /* TRUST-V1-HIDE: ซ่อน trust banner ถ้าลูกค้าเก่า (เคยกรอกเบอร์) */
  try {
    var prev = localStorage.getItem("orderForm.cust") || sessionStorage.getItem("orderForm.cust");
    var prevPhone = "";
    try { prevPhone = JSON.parse(prev || "{}").phone || ""; } catch(e) {}
    if (prevPhone && prevPhone.length >= 9) {
      var tb = document.querySelector(".trust-banner");
      if (tb) tb.style.display = "none";
    }
  } catch (e) {}

  function renderLotteryGrid(filter = "") {
    const grid = $("#lotteryGrid");
    const q = filter.trim().toLowerCase();
    const items = state.lotteries
      .map((lot) => ({ lot, round: nextAcceptingRound(lot.id) }))
      .filter((x) => x.round)
      .filter((x) => !q || x.lot.name.toLowerCase().includes(q));

    if (!items.length) {
      grid.innerHTML = `<div class="empty">${q ? "ไม่พบหวยที่ค้นหา" : "ขณะนี้ยังไม่มีหวยที่เปิดรับบิล"}</div>`;
      return;
    }

    grid.innerHTML = items
      .map(({ lot, round }) => `
        <button type="button" class="lottery-card" data-lottery-id="${lot.id}" data-round-id="${round.id}" style="--lotto-bg:url('${lottoBgUrl(lot.id)}')">
          <span class="badge-status">เปิดรับ</span>
          <span class="lottery-name"><span class="lottery-flag-inline">${lottoFlag(lot.id)}</span> ${escapeHtml(lot.name)}</span>
          <span class="lottery-round">งวด ${escapeHtml(formatThaiDate(round.draw_date))}</span>
          <span class="lottery-closes">${escapeHtml(formatCloseTime(round))}</span>
        </button>
      `)
      .join("");

    grid.querySelectorAll(".lottery-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.selectedLotteryId = btn.dataset.lotteryId;
        state.selectedRoundId = btn.dataset.roundId;
        state.entries = [];
        state.selectedBetType = null;
        showBetEntryStep();
      });
    });
  }

  // ----- bet entry step -----
  function showBetEntryStep() {
    const lot = state.lotteries.find((l) => l.id === state.selectedLotteryId);
    const round = state.rounds.find((r) => r.id === state.selectedRoundId);
    $("#pickedRound").innerHTML = `
      <strong>${escapeHtml(lot?.name || "")}</strong> ·
      งวด ${escapeHtml(formatThaiDate(round?.draw_date))} ·
      <span style="color:var(--gold)">${escapeHtml(formatCloseTime(round))}</span>
    `;
    /* DETAIL-BG-V1: ใส่รูปประจำหวยเป็น background ของ step 3 + 4 */
    try {
      const bgUrl = lottoBgUrl(state.selectedLotteryId);
      document.querySelectorAll('section.step[data-step="3"], section.step[data-step="4"]').forEach(el => {
        el.style.setProperty('--lotto-bg-detail', `url('${bgUrl}')`);
      });
    } catch (e) {}
    renderBetTypeButtons();
    renderEntryList();
    setStep(3);
  }

  function renderBetTypeButtons() {
    const wrap = $("#betTypeButtons");
    wrap.innerHTML = state.betTypes
      .map((bt) => `
        <button type="button" class="bet-type-btn" data-bet-id="${bt.id}" data-digits="${bt.digits}" aria-pressed="false">
          ${escapeHtml(bt.name)}
        </button>
      `)
      .join("");
    wrap.querySelectorAll(".bet-type-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        wrap.querySelectorAll(".bet-type-btn").forEach((b) => b.setAttribute("aria-pressed", "false"));
        btn.setAttribute("aria-pressed", "true");
        const bt = state.betTypes.find((x) => x.id === btn.dataset.betId);
        state.selectedBetType = bt;
        const digits = Number(btn.dataset.digits);
        const input = $("#entryNumber");
        input.placeholder = "0".repeat(digits);
        $("#numberHint").textContent = `(${digits} หลัก)`;
        if (input.value && input.value.length > digits) input.value = input.value.slice(0, digits);
        clearAllErrors();
        input.focus();
        updateAddBtnReadyState();
      });
    });
    // Auto-select 2 ตัวบน by default
    const firstBtn = wrap.querySelector('[data-bet-id="two_top"]') || wrap.querySelector(".bet-type-btn");
    if (firstBtn) firstBtn.click();
  }

  function updateAddBtnReadyState() {
    var bt = state.selectedBetType;
    var n = (document.querySelector("#entryNumber")?.value || "").trim();
    var a = (document.querySelector("#entryAmount")?.value || "").trim();
    var ready = bt && /^\d+$/.test(n) && n.length === Number(bt.digits) && /^[1-9]\d*$/.test(a);
    var btn = document.querySelector("#addEntryBtn");
    if (btn) {
      if (ready) btn.classList.add("ready"); else btn.classList.remove("ready");
    }
  }
  function renderEntryList() {
    const list = $("#entryList");
    const total = state.entries.reduce((s, e) => s + Number(e.amount), 0);
    $("#entryCount").textContent = state.entries.length;
    $("#entryTotal").textContent = fmt(total);
    $("#step3Next").disabled = state.entries.length === 0;
    var box = document.querySelector(".entries-list");
    if (box) {
      if (state.entries.length > 0) box.classList.add("has-items");
      else box.classList.remove("has-items");
    }
    if (!state.entries.length) {
      list.innerHTML = `<li class="empty">ยังไม่มีเลข — เพิ่มเลขด้านบนได้เลย</li>`;
      return;
    }
    list.innerHTML = state.entries
      .map((e, idx) => `
        <li class="entry-item${e._justAdded ? " just-added" : ""}">
          <span class="entry-bet-type">${escapeHtml(e.betTypeName)}</span>
          <span class="entry-number">${escapeHtml(e.number)}</span>
          <span class="entry-amount">${fmt(e.amount)} ฿</span>
          <button type="button" class="entry-remove" data-idx="${idx}" aria-label="ลบเลข ${e.number}">✕</button>
        </li>
      `)
      .join("");
    list.querySelectorAll(".entry-remove").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.entries.splice(Number(btn.dataset.idx), 1);
        renderEntryList();
      });
    });
  }

  async function addEntry() {
    clearAllErrors();
    var bt = state.selectedBetType;
    if (!bt) {
      var firstBt = document.querySelector(".bet-type-btn");
      if (firstBt) { firstBt.click(); bt = state.selectedBetType; }
      if (!bt) { toast("กรุณาเลือกประเภทการแทงก่อน", "error"); return; }
    }
    const numberRaw = ($("#entryNumber").value || "").trim();
    const amountRaw = ($("#entryAmount").value || "").trim();
    const digits = Number(bt.digits);

    if (!numberRaw) {
      setError("entryNumber", `กรุณาใส่เลข ${digits} หลัก`);
      $("#entryNumber").focus();
      return;
    }
    if (!/^\d+$/.test(numberRaw)) {
      setError("entryNumber", "กรุณาใส่เฉพาะตัวเลข 0-9 เท่านั้น");
      $("#entryNumber").focus();
      return;
    }
    if (numberRaw.length !== digits) {
      setError("entryNumber", `${bt.name} ต้องใส่เลข ${digits} หลัก (พิมพ์มา ${numberRaw.length} หลัก)`);
      $("#entryNumber").focus();
      return;
    }
    const amount = Number(amountRaw);
    if (!amountRaw) {
      setError("entryAmount", "กรุณาใส่ยอดเงิน");
      $("#entryAmount").focus();
      return;
    }
    if (!Number.isInteger(amount) || amount <= 0) {
      setError("entryAmount", "ยอดต้องเป็นจำนวนเต็มบวก (เช่น 10, 50, 100)");
      $("#entryAmount").focus();
      return;
    }
    if (amount > 1000000) {
      setError("entryAmount", "ยอดต่อเลขเกิน 1,000,000 บาท ติดต่อแอดมิน");
      return;
    }

    // Limit pre-check
    try {
      var qs = "?roundId=" + encodeURIComponent(state.selectedRoundId) +
        "&betTypeId=" + encodeURIComponent(bt.id) +
        "&number=" + encodeURIComponent(numberRaw) +
        "&amount=" + encodeURIComponent(amount);
      var res = await fetch("/api/customer/check-limit" + qs);
      if (res.ok) {
        var info = await res.json();
        if (info.hasLimit && !info.ok) {
          var rem = Number(info.remaining || 0);
          var msg = bt.name + " เลข " + numberRaw + " เต็มโควต้าแล้ว";
          if (rem > 0) msg += " (เหลือรับได้อีก " + rem.toLocaleString("th-TH") + " บาท)";
          else msg += " (เต็มแล้ว 0 บาท)";
          setError("entryAmount", msg);
          toast(msg, "error");
          return;
        }
      }
    } catch (e) { /* ignore network errors, server will re-check */ }

    var newEntry = {
      betTypeId: bt.id,
      betTypeName: bt.name,
      digits,
      number: numberRaw,
      amount,
      _justAdded: true,
    };
    state.entries.push(newEntry);
    $("#entryNumber").value = "";
    $("#entryAmount").value = "";
    $("#entryNumber").focus();
    renderEntryList();
    updateAddBtnReadyState();
    // Visual feedback
    var btn = document.querySelector("#addEntryBtn");
    if (btn) {
      btn.classList.add("flash");
      setTimeout(function() { btn.classList.remove("flash"); }, 600);
    }
    if (navigator.vibrate) { try { navigator.vibrate(50); } catch (e) {} }
    toast("✓ เพิ่มเลข " + numberRaw + " ยอด " + amount.toLocaleString("th-TH") + " บาท", "success");
    // Remove _justAdded flag after animation completes
    setTimeout(function() {
      newEntry._justAdded = false;
      renderEntryList();
    }, 1200);
  }

  // ----- review step -----
  function showReview() {
    state.note = $("#orderNote").value.trim();
    const lot = state.lotteries.find((l) => l.id === state.selectedLotteryId);
    const round = state.rounds.find((r) => r.id === state.selectedRoundId);
    const total = state.entries.reduce((s, e) => s + Number(e.amount), 0);

    const html = `
      <div class="review-row"><span>ผู้สั่ง</span><strong>${escapeHtml(state.customer.name)}</strong></div>
      ${state.customer.phone ? `<div class="review-row"><span>ติดต่อ</span><span>${escapeHtml(state.customer.phone)}</span></div>` : ""}
      <div class="review-row"><span>หวย</span><strong>${escapeHtml(lot?.name || "")}</strong></div>
      <div class="review-row"><span>งวด</span><span>${escapeHtml(formatThaiDate(round?.draw_date))}</span></div>
      <h4>เลขที่แทง (${state.entries.length} รายการ)</h4>
      <ul class="review-entries">
        ${state.entries.map((e) => `
          <li>
            <span>${escapeHtml(e.betTypeName)} · <strong>${escapeHtml(e.number)}</strong></span>
            <strong>${fmt(e.amount)} ฿</strong>
          </li>
        `).join("")}
      </ul>
      ${state.note ? `<h4>หมายเหตุ</h4><div style="font-size:13px;color:var(--text-soft);background:var(--surface);padding:8px 10px;border-radius:6px">${escapeHtml(state.note)}</div>` : ""}
      <div class="review-row review-total"><span>ยอดรวมทั้งสิ้น</span><span>${fmt(total)} บาท</span></div>
    `;
    $("#reviewBlock").innerHTML = html;
    setStep(4);
  }

  // ----- submit -----
  async function submitOrder() {
    if (state.submitting) return;
    state.submitting = true;
    const btn = $("#submitBtn");
    btn.disabled = true;
    btn.textContent = "กำลังส่ง…";

    try {
      const body = {
        customer: {
          name: state.customer.name,
          phone: state.customer.phone,
        },
        lineProfile: lineProfile,
        referralCode: referralCode,
        roundId: state.selectedRoundId,
        note: state.note,
        entries: state.entries.map((e) => ({
          betTypeId: e.betTypeId,
          number: e.number,
          amount: e.amount,
        })),
      };
      const result = await api("/api/customer/orders", { method: "POST", body });
      showSuccess(result);
    } catch (err) {
      console.error(err);
      let msg = err.message || "ส่งบิลไม่สำเร็จ";
      if (err.status === 429) msg = "ส่งบิลถี่เกินไป รออีกสักครู่แล้วลองใหม่";
      else if (err.message === "limit_exceeded") {
        var p = err.payload || {};
        if (p.betTypeName && p.number != null) {
          msg = "❌ " + p.betTypeName + " เลข " + p.number + " เต็มโควต้า";
          if (p.remaining != null) msg += " (เหลือรับได้อีก " + Number(p.remaining).toLocaleString("th-TH") + " บาท)";
          msg += " — กรุณาลดยอดหรือเปลี่ยนเลข";
        } else {
          msg = "เลขใดเลขหนึ่งเต็มโควต้าแล้ว — กรุณาลดยอดหรือเปลี่ยนเลข";
        }
      }
      else if (err.message === "round_not_accepting") msg = "งวดนี้ปิดรับบิลแล้ว — กลับไปเลือกงวดอื่น";
      else if (err.message === "invalid_entry_payload") msg = "ข้อมูลเลข/ยอดผิดรูปแบบ ลองเช็คอีกครั้ง";
      else if (err.message === "pending_bill_exists") {
        var pp = err.payload || {};
        msg = "⚠️ คุณมีบิล " + (pp.pendingCode || "") + " ยังไม่ได้ส่งสลิป\n" +
              "กรุณาเคลียร์บิลเก่าก่อน (โอน + ส่งสลิป) หรือพิมพ์ 'ยกเลิก' ในแชท LINE";
      }
      toast(msg, "error");
      btn.disabled = false;
      btn.textContent = "✓ ยืนยันส่งบิล";
    } finally {
      state.submitting = false;
    }
  }

    /* PROMPTPAY-QR-V1: generate QR สำหรับโอนเงิน */
  function generatePromptPayQR(targetEl, amount, ppId) {
    /* ppId = phone or national ID 13 digits — ใช้ default จาก state ถ้าไม่ระบุ */
    var id = ppId || (state.bankInfo && state.bankInfo.promptpay_id) || "";
    if (!id || !amount) return;
    /* ใช้ public API ฟรี — promptpay.io แค่ใส่ params + QR ส่งกลับมา */
    var url = "https://promptpay.io/" + encodeURIComponent(id) + "/" + amount + ".png";
    targetEl.src = url;
  }
  /* expose ใช้ใน showSuccess */

function showSuccess(result) {
    var qrAmount = result && result.ticket && result.ticket.total_amount;
    const total = state.entries.reduce((s, e) => s + Number(e.amount), 0);
    const code = result?.ticket?.code || "—";
    $("#billCode").textContent = code;
    $("#successCode").textContent = code;
    $("#successTotal").textContent = fmt(total);
    // Show send-to-chat only if running in LINE in-app
    if (window.liff && liff.isInClient && liff.isInClient()) {
      var sb = document.querySelector("#sendToChatBtn");
      if (sb) sb.classList.remove("hidden");
    }
    __billCopied = false;
    setStep(5);
    /* BANK-FEAT: โหลดบัญชีและแสดงทันที */
    loadBankPayInfo(total).catch((e) => console.warn("bank load fail", e));
  }

  /* BANK-FEAT: fetch + populate bank-pay-card */
  async function loadBankPayInfo(amount) {
    const card = document.querySelector("#bankPayCard");
    if (!card) return;
    try {
      const res = await fetch("/api/public/bank-account/current", { headers: { Accept: "application/json" } });
      if (!res.ok) {
        card.hidden = true;
        return;
      }
      const acc = await res.json();
      const logo = document.querySelector("#bankPayLogo");
      logo.className = "bank-logo";
      if (acc.bank_code) logo.classList.add("bank-" + String(acc.bank_code).toLowerCase());
      document.querySelector("#bankPayName").textContent = acc.bank_name || "—";
      document.querySelector("#bankPayHolder").textContent = acc.account_holder || "—";
      document.querySelector("#bankPayAcct").textContent = acc.account_number || "—";
      document.querySelector("#bankPayAmount").textContent = "฿" + fmt(amount);
const note = document.querySelector("#bankPayNote");
      if (acc.note) {
        note.textContent = acc.note;
        note.hidden = false;
      } else {
        note.hidden = true;
      }
      card.hidden = false;
    } catch (e) {
      console.error("loadBankPayInfo error", e);
      card.hidden = true;
    }
  }

  /* BANK-FEAT: copy เลขบัญชี */
  function bindBankPayCopy() {
    const btn = document.querySelector("#bankPayAcctTap");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      const num = (document.querySelector("#bankPayAcct").textContent || "").replace(/\D/g, "");
      if (!num) return;
      const hint = document.querySelector(".bank-pay-acct-hint");
      try {
        await navigator.clipboard.writeText(num);
        if (hint) hint.textContent = "✓ คัดลอกแล้ว";
        btn.classList.add("copied");
        toast("คัดลอกเลขบัญชีแล้ว", "success");
        setTimeout(() => {
          if (hint) hint.textContent = "📋 แตะเพื่อคัดลอก";
          btn.classList.remove("copied");
        }, 2500);
      } catch (e) {
        toast("คัดลอกไม่ได้ — แตะค้างที่เลขเพื่อคัดลอก", "error");
      }
    });
  }

  function buildBillText() {
    const lot = state.lotteries.find((l) => l.id === state.selectedLotteryId);
    const round = state.rounds.find((r) => r.id === state.selectedRoundId);
    const total = state.entries.reduce((s, e) => s + Number(e.amount), 0);
    const code = $("#billCode").textContent;
    const lines = [
      `บ้านหวยเรือนเลขเศรษฐี — บิลสั่งซื้อ`,
      `เลขบิล: ${code}`,
      `ผู้สั่ง: ${state.customer.name}${state.customer.phone ? " (" + state.customer.phone + ")" : ""}`,
      `หวย: ${lot?.name || ""} · งวด ${formatThaiDate(round?.draw_date)}`,
      ``,
      `รายการแทง:`,
      ...state.entries.map((e) => `  ${e.betTypeName} ${e.number} = ${fmt(e.amount)} บาท`),
      ``,
      `ยอดรวม: ${fmt(total)} บาท`,
    ];
    if (state.note) lines.push("", "หมายเหตุ: " + state.note);
    return lines.join("\n");
  }

  async function copyBill() {
    const text = buildBillText();
    try {
      await navigator.clipboard.writeText(text);
      __billCopied = true;
      var warn = document.querySelector("#copyWarn");
      if (warn) warn.innerHTML = "✓ <strong>คัดลอกแล้ว</strong> กรุณาวาง (paste) ในแชท LINE";
      toast("คัดลอกแล้ว ส่งใน LINE ได้เลย", "success");
    } catch (err) {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); toast("คัดลอกแล้ว", "success"); }
      catch (e) { toast("คัดลอกไม่สำเร็จ ลองยาวๆ ที่ข้อความบิลแทน", "error"); }
      document.body.removeChild(ta);
    }
  }

  
  /* SIMP: submitBill — ปุ่มเดียวฉลาด: in-LINE → sendMessages, browser → copy+open LINE */
  async function submitBill() {
    const btn = document.querySelector("#submitBillBtn");
    if (!btn) return;
    const text = buildBillText();
    /* ถ้าอยู่ใน LINE → ส่งเข้าแชทอัตโนมัติ */
    if (window.liff && liff.isInClient && liff.isInClient() && liff.sendMessages) {
      try {
        await liff.sendMessages([{ type: "text", text: text }]);
        btn.textContent = "✓ ส่งแล้ว — กลับไปที่แชท";
        btn.classList.add("done");
        toast("ส่งบิลเข้าแชท LINE แล้ว — โอนแล้วส่งสลิปกลับมา", "success");
        __billCopied = true;
        return;
      } catch (e) {
        console.warn("liff.sendMessages failed, fallback to copy", e);
      }
    }
    /* fallback: คัดลอก → แจ้งให้เปิด LINE */
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = "✓ คัดลอกแล้ว — ไปวางในแชท LINE";
      btn.classList.add("done");
      toast("คัดลอกบิลแล้ว เปิด LINE แล้ววางในแชท", "success");
      __billCopied = true;
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); toast("คัดลอกบิลแล้ว", "success"); __billCopied = true; }
      catch (e2) { toast("คัดลอกไม่ได้ — แตะข้อความบิลค้างเพื่อคัดลอก", "error"); }
      document.body.removeChild(ta);
    }
  }

  var __billCopied = false;
  function newOrder() {
    if (!__billCopied) {
      if (!window.confirm("ยังไม่ได้กด \"ส่งบิลใน LINE\" — บิลจะยังอยู่ในระบบนะ\n\nสั่งใบใหม่?")) return;
    }
    state.selectedLotteryId = null;
    state.selectedRoundId = null;
    state.entries = [];
    state.note = "";
    __billCopied = false;
    $("#orderNote").value = "";
    $("#entryNumber").value = "";
    $("#entryAmount").value = "";
    loadOpenRounds();
    setStep(2);
  }
  async function sendBillToLineChat() {
    if (!window.liff || !liff.isInClient || !liff.isInClient()) {
      toast("ฟีเจอร์นี้ใช้ได้เฉพาะใน LINE", "info");
      return;
    }
    try {
      var text = buildBillText();
      await liff.sendMessages([{ type: "text", text: text }]);
      __billCopied = true;
      toast("ส่งบิลเข้าแชท LINE แล้ว ✓ กรุณาส่งสลิปตามมา", "success");
      setTimeout(function() { if (liff.closeWindow) liff.closeWindow(); }, 1500);
    } catch (e) {
      console.warn(e);
      toast("ส่งไม่สำเร็จ ลองคัดลอกแล้ววางในแชทแทน", "error");
    }
  }


  function restartAll() {
    state.selectedLotteryId = null;
    state.selectedRoundId = null;
    state.entries = [];
    state.note = "";
    setStep(1);
    $("#custName").focus();
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // ----- wire up -----
  function bind() {
    loadLocal();
    if (state.customer.name) $("#custName").value = state.customer.name;
    if (state.customer.phone) $("#custPhone").value = state.customer.phone;

    $("#step1Next").addEventListener("click", () => {
      clearAllErrors();
      /* FIX: name มาจาก LINE display name ไม่ต้องกรอก — เก็บ phone อย่างเดียว */
      const phone = $("#custPhone").value.trim();
      /* fall back name = LINE display name (set by LIFF init) → empty string ก็ได้ backend จะ map */
      state.customer.name = (lineProfile && lineProfile.displayName) || "";
      state.customer.phone = phone;
      saveLocal();
      loadOpenRounds();
      setStep(2);
    });

    $("#lotterySearch").addEventListener("input", (e) => {
      renderLotteryGrid(e.target.value);
    });

    $("#addEntryBtn").addEventListener("click", addEntry);
    // Live ready-state on input
    ["entryNumber", "entryAmount"].forEach(function(id) {
      var el = $("#" + id);
      if (el) el.addEventListener("input", updateAddBtnReadyState);
    });

    // Enter in number → focus amount; Enter in amount → add
    $("#entryNumber").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        $("#entryAmount").focus();
      }
    });
    $("#entryAmount").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addEntry();
      }
    });

    $("#step3Next").addEventListener("click", showReview);

    $("#submitBtn").addEventListener("click", submitOrder);
    if (typeof bindBankPayCopy === "function") bindBankPayCopy(); /* BANK-FEAT */

    /* SIMP: copyBillBtn removed — รวมเข้า submitBillBtn */
    document.querySelector("#submitBillBtn")?.addEventListener("click", submitBill);
    $("#newOrderBtn").addEventListener("click", newOrder);
    /* SIMP: sendToChatBtn removed — รวมเข้า submitBillBtn */
    $("#restartBtn").addEventListener("click", restartAll);

    $$("[data-back]").forEach((btn) => {
      btn.addEventListener("click", () => setStep(Number(btn.dataset.back)));
    });

    // Numeric-only input enforcement (accept Thai numerals)
    function normalizeDigits(s) {
      return String(s || "")
        .replace(/[\u0E50-\u0E59]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x0E50 + 48))
        .replace(/[\uFF10-\uFF19]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xFF10 + 48))
        .replace(/\D/g, "");
    }
    ["entryNumber", "entryAmount"].forEach((id) => {
      var el = $("#" + id);
      if (!el) return;
      el.removeAttribute("maxlength"); // so we can show error instead of silent truncate
      el.addEventListener("input", (e) => {
        var oldVal = e.target.value;
        var clean = normalizeDigits(oldVal);
        if (clean !== oldVal) e.target.value = clean;
      });
    });

    setStep(1);
    if (state.customer.name) $("#custName").select();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
