/* MY-ORDERS-V1: หน้าบิลของฉัน — LIFF + LINE auth */
(function() {
  var LIFF_ID = "2010170072-GDDXzvaN";
  var state = { items: [], filter: "all", userId: null };

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function money(n) { return "฿" + Number(n || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 }); }
  function fmtDate(iso) {
    if (!iso) return "—";
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      var mo = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
      return d.getDate() + " " + mo[d.getMonth()] + " " + ((d.getFullYear()+543)+"").slice(-2);
    } catch(e) { return iso; }
  }

  function statusInfo(item) {
    /* UX-FIX-V3-A2: 5 status เท่านั้น — ตัดความสับสน */
    var s = item.status;
    var hasResult = item.has_result;
    var hasPrize = (item.prize_amount || 0) > 0;
    if (s === "cancelled") return { label: "ยกเลิก", cls: "b-cancel", icon: "✕" };
    if (s === "pending") return { label: "⏳ รอตรวจสลิป", cls: "b-pending", icon: "", eta: "ทีมงานตรวจสอบใน 5-10 นาที" };
    if (s === "approved") {
      if (!hasResult) return { label: "✅ รอผลออก", cls: "b-confirmed", icon: "", eta: "รอผลรางวัล" };
      if (item.checked === false) return { label: "🔍 กำลังตรวจรางวัล", cls: "b-checking", icon: "", eta: "ผลตรวจภายใน 30 นาที" };
      if (hasPrize) return { label: "🎉 ถูกรางวัล", cls: "b-won", icon: "", action: (!item.paid_out ? "claim" : null) };
      return { label: "❌ ไม่ถูก", cls: "b-lost", icon: "" };
    }
    return { label: "⏳ รอตรวจสลิป", cls: "b-pending", icon: "" };
  }

  function toast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(function() { t.classList.remove("show"); }, 1800);
  }

  function copyCodeFallback(code) {
    try {
      var ta = document.createElement("textarea");
      ta.value = code;
      ta.style.position = "fixed"; ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast("คัดลอกแล้ว ✓");
    } catch (e) {
      console.warn("[copy] fallback failed:", e);
      toast("คัดลอกไม่สำเร็จ");
    }
  }
  function copyCode(code) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code)
        .then(function() { toast("คัดลอกแล้ว ✓"); })
        .catch(function(err) { console.warn("[copy] clipboard API failed:", err); copyCodeFallback(code); });
    } else { copyCodeFallback(code); }
  }

  function renderList() {
    var c = document.getElementById("content");
    var filtered = state.items.filter(function(it) {
      if (state.filter === "all") return true;
      if (state.filter === "pending") return it.status !== "cancelled" && !it.has_result;
      if (state.filter === "done") return it.has_result;
      return true;
    });

    if (!filtered.length) {
      c.innerHTML = '<div class="empty">' +
        '<div class="icon">📋</div>' +
        '<div style="font-weight:600;margin-bottom:6px">ยังไม่มีบิล</div>' +
        '<div style="font-size:13px">เริ่มต้นซื้อหวยใบแรกของคุณได้เลย</div>' +
        '<a href="https://liff.line.me/' + LIFF_ID + '" class="cta">✍️ ซื้อหวยเลย →</a>' +
        '</div>';
      return;
    }

    c.innerHTML = filtered.map(function(it) {
      var info = statusInfo(it);
      var actionBtn = "";
      if (info.action === "claim") {
        actionBtn = '<button class="cta-btn" onclick="window.location.href=\'https://line.me/R/oaMessage/@042xplcj/?' +
          encodeURIComponent("ขอรับเงินรางวัล " + (it.code || "")) + '\'">รับเงินรางวัล →</button>';
      }
      var prizeRow = (it.prize_amount > 0) ?
        '<div class="lottery-row">รางวัล: <span class="win-amount">' + money(it.prize_amount) + '</span></div>' : '';
      var entries = (it.entries || []).slice(0, 3).map(function(e) {
        return '<div style="font-size:12px;color:#6b7280">• ' + esc(e.bet_type_name || e.bet_type_id) + ' ' + esc(e.number) + ' = ' + money(e.amount) + '</div>';
      }).join("");
      var moreEntries = (it.entries || []).length > 3 ? '<div style="font-size:12px;color:#6b7280;margin-top:4px">+' + (it.entries.length - 3) + ' รายการ</div>' : '';

      return '<div class="order-card">' +
        '<div class="top">' +
          '<span class="badge ' + info.cls + '">' + info.icon + ' ' + esc(info.label) + '</span>' +
          (it.code ? '<span class="code-chip" onclick="window.__copy(\'' + esc(it.code) + '\')">' + esc(it.code) + '</span>' : '') +
        '</div>' +
        '<div class="lottery-row"><strong>' + esc(it.lottery_name || "—") + '</strong> · งวด ' + esc(fmtDate(it.draw_date)) + '</div>' +
        (info.eta ? '<div class="eta">⏳ ' + esc(info.eta) + '</div>' : '') +
        entries + moreEntries +
        '<div class="total-row">' +
          '<span style="font-size:13px;color:#6b7280">ยอดซื้อรวม</span>' +
          '<span class="total-amount">' + money(it.total_amount) + '</span>' +
        '</div>' +
        prizeRow +
        (actionBtn ? '<div style="margin-top:12px">' + actionBtn + '</div>' : '') +
      '</div>';
    }).join("");
  }
  window.__copy = copyCode;

  function loadOrders() {
    if (!state.userId) return;
    fetch("/api/customer/my-orders?line_user_id=" + encodeURIComponent(state.userId), { cache: "no-store" })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (!d.ok) {
          document.getElementById("content").innerHTML = '<div class="empty"><div>โหลดล้มเหลว: ' + esc(d.error || "") + '</div></div>';
          return;
        }
        state.items = d.items || [];
        renderList();
      })
      .catch(function(e) {
        document.getElementById("content").innerHTML = '<div class="empty"><div>โหลดล้มเหลว: ' + esc(e.message) + '</div></div>';
      });
  }

  /* tabs */
  document.querySelectorAll(".tab").forEach(function(t) {
    t.addEventListener("click", function() {
      document.querySelectorAll(".tab").forEach(function(x) { x.classList.toggle("active", x === t); });
      state.filter = t.dataset.filter;
      renderList();
    });
  });

  /* LIFF init */
  function init() {
    if (typeof liff === "undefined") {
      setTimeout(init, 200); return;
    }
    liff.init({ liffId: LIFF_ID }).then(function() {
      if (!liff.isLoggedIn()) {
        liff.login();
        return;
      }
      return liff.getProfile();
    }).then(function(profile) {
      if (profile) {
        state.userId = profile.userId;
        loadOrders();
      }
    }).catch(function(err) {
      console.warn("liff error:", err);
      document.getElementById("content").innerHTML = '<div class="empty"><div>กรุณาเปิดผ่านแอป LINE</div></div>';
    });
  }
  init();
})();
