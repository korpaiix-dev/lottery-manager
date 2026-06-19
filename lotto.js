/* lotto.js — Customer-facing live results page (Redesign V2, 2026-06-20)
 * Compact list + category tabs + search + countdown for pending */
(function() {
  var state = { items: [], filter: "all", search: "", lastUpdate: 0 };
  var CAT_FLAGS = {
    government: "🏛️", daily: "🌏", stock: "📈",
    stock_vip: "⭐", foreign: "🌐", other: "🎰"
  };
  var LOTTERY_FLAGS = {
    thai: "🇹🇭", omsin: "🇹🇭", baac: "🇹🇭",
    lott_027: "🇱🇦", lott_032: "🇲🇾",
    lott_033: "🇻🇳", lott_035: "🇻🇳", lott_036: "🇻🇳",
    lott_037: "🇬🇧", lott_038: "🇩🇪", lott_039: "🇷🇺", lott_040: "🇺🇸",
    lott_010: "🇷🇺", lott_011: "🇬🇧", lott_012: "🇩🇪", lott_013: "🇺🇸",
    lott_014: "🇪🇬", lott_015: "🇯🇵", lott_016: "🇨🇳", lott_017: "🇭🇰",
    lott_018: "🇹🇼", lott_019: "🇰🇷", lott_020: "🇯🇵", lott_021: "🇨🇳",
    lott_022: "🇭🇰", lott_023: "🇹🇭", lott_024: "🇸🇬", lott_025: "🇮🇳",
    lott_041: "🇯🇵", lott_042: "🇨🇳", lott_043: "🇭🇰", lott_044: "🇹🇼",
    lott_045: "🇰🇷", lott_046: "🇯🇵", lott_047: "🇨🇳", lott_048: "🇭🇰",
    lott_049: "🇸🇬",
    lott_081: "🇺🇸", lott_082: "🇺🇸", lott_083: "🇺🇸", lott_084: "🇺🇸",
    lott_085: "🇻🇳", lott_086: "🇱🇦", lott_087: "🇱🇦", lott_088: "🇱🇦",
    lott_089: "🇻🇳", lott_090: "🇻🇳"
  };
  /* lao + hanoi prefixes */
  for (var i = 50; i <= 67; i++) {
    var id = "lott_0" + i;
    if (!LOTTERY_FLAGS[id]) LOTTERY_FLAGS[id] = (i >= 60 ? "🇻🇳" : "🇱🇦");
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    try {
      var d = new Date(iso + "T00:00:00");
      var mo = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
      return d.getDate() + " " + mo[d.getMonth()] + " " + ((d.getFullYear()+543)+"").slice(-2);
    } catch(e) { return iso; }
  }

  function countdownText(targetIso) {
    if (!targetIso) return "รอออก";
    var target = new Date(targetIso.replace(" ", "T") + "+07:00").getTime();
    var diff = target - Date.now();
    if (diff <= 0) return "กำลังประมวลผล";
    var hrs = Math.floor(diff / 3600000);
    var mins = Math.floor((diff % 3600000) / 60000);
    if (hrs >= 24) {
      var days = Math.floor(hrs / 24);
      return "อีก " + days + " วัน";
    }
    if (hrs > 0) return "อีก " + hrs + " ชม. " + mins + " นาที";
    return "อีก " + mins + " นาที";
  }

  function flagFor(id) { return LOTTERY_FLAGS[id] || "🎲"; }

  function numPill(label, value, empty) {
    if (empty || !value || value === "—") {
      return '<div class="num-pill empty"><span class="lbl">' + esc(label) +
        '</span><span class="val">—</span></div>';
    }
    var v = Array.isArray(value) ? value.join(" ") : String(value);
    return '<div class="num-pill"><span class="lbl">' + esc(label) +
      '</span><span class="val">' + esc(v) + '</span></div>';
  }

  function renderRow(it) {
    var isPending = it.status === "pending";
    var rowCls = "row " + (isPending ? "is-pending" : "is-finalized");
    var flag = flagFor(it.lottery_id);
    var nums = "";
    if (isPending) {
      nums = '<div class="row-nums">' +
        numPill("3 บน", null, true) + numPill("2 ล่าง", null, true) +
      '</div>';
    } else {
      var t3 = Array.isArray(it.three_top) ? it.three_top.join(" ") : it.three_top;
      nums = '<div class="row-nums">' +
        numPill("3 บน", t3) + numPill("2 ล่าง", it.two_bottom) +
      '</div>';
    }
    var statusHtml;
    if (isPending) {
      var time = it.next_draw_at ? it.next_draw_at.split(" ")[1].slice(0, 5) : "";
      var cd = countdownText(it.next_draw_at);
      statusHtml =
        '<span class="badge pending">⏳ รอออก</span>' +
        '<span class="row-time">' + esc(time) + ' · ' + esc(cd) + '</span>';
    } else {
      statusHtml =
        '<span class="badge finalized">✓ ออกแล้ว</span>' +
        '<span class="row-time">' + esc(fmtDate(it.draw_date)) + '</span>';
    }
    return '<div class="' + rowCls + '" data-cat="' + esc(it.category || "other") +
      '" data-name="' + esc((it.lottery_name||"").toLowerCase()) + '">' +
      '<div class="row-head">' +
        '<span class="row-flag">' + flag + '</span>' +
        '<span class="row-name">' + esc(it.lottery_name || "") + '</span>' +
      '</div>' +
      nums +
      '<div class="row-status">' + statusHtml + '</div>' +
    '</div>';
  }

  function applyFilters() {
    var rows = document.querySelectorAll("#list-root .row");
    var search = state.search.toLowerCase();
    var visible = 0;
    rows.forEach(function(r) {
      var cat = r.dataset.cat;
      var name = r.dataset.name || "";
      var catOk = state.filter === "all" || cat === state.filter;
      var srchOk = !search || name.indexOf(search) !== -1;
      var show = catOk && srchOk;
      r.style.display = show ? "" : "none";
      if (show) visible++;
    });
    var root = document.getElementById("list-root");
    var emptyEl = document.getElementById("filter-empty");
    if (visible === 0 && rows.length > 0) {
      if (!emptyEl) {
        emptyEl = document.createElement("div");
        emptyEl.id = "filter-empty";
        emptyEl.className = "empty";
        emptyEl.innerHTML = '<div class="empty-icon">🔍</div>ไม่พบหวยที่ค้นหา';
        root.appendChild(emptyEl);
      }
    } else if (emptyEl) {
      emptyEl.remove();
    }
  }

  function render() {
    var root = document.getElementById("list-root");
    if (!state.items.length) {
      root.innerHTML = '<div class="empty"><div class="empty-icon">🎲</div>ยังไม่มีผลรางวัล</div>';
      return;
    }
    /* sort: finalized โดย display_order, ตามด้วย pending */
    var fz = state.items.filter(function(x) { return x.status === "finalized"; });
    var pn = state.items.filter(function(x) { return x.status === "pending"; });
    fz.sort(function(a, b) { return (a.display_order || 999) - (b.display_order || 999); });
    pn.sort(function(a, b) {
      var ta = a.next_draw_at ? new Date(a.next_draw_at.replace(" ", "T")).getTime() : Infinity;
      var tb = b.next_draw_at ? new Date(b.next_draw_at.replace(" ", "T")).getTime() : Infinity;
      return ta - tb;
    });
    var ordered = fz.concat(pn);
    root.innerHTML = ordered.map(renderRow).join("");

    /* update tab counts */
    var counts = { all: state.items.length, government: 0, daily: 0, stock: 0, stock_vip: 0, foreign: 0, other: 0 };
    state.items.forEach(function(it) {
      var c = it.category || "other";
      if (counts[c] !== undefined) counts[c]++;
    });
    Object.keys(counts).forEach(function(c) {
      var el = document.getElementById("cnt-" + c);
      if (el) el.textContent = counts[c];
    });

    applyFilters();
  }

  function setUpdatedText(text) {
    var el = document.getElementById("updated-text");
    if (el) el.textContent = text;
  }

  function loadData() {
    setUpdatedText("กำลังโหลด...");
    fetch("/api/public/results-latest", { cache: "no-store" })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data.ok) throw new Error(data.error || "load_failed");
        state.items = data.items || [];
        state.lastUpdate = Date.now();
        render();
        setUpdatedText("อัพเดท " + new Date().toLocaleTimeString("th-TH").slice(0, 5));
      })
      .catch(function(e) {
        document.getElementById("list-root").innerHTML =
          '<div class="empty"><div class="empty-icon">⚠️</div>โหลดล้มเหลว: ' + esc(e.message || e) +
          '<br><br><button class="refresh-btn" onclick="location.reload()">ลองอีกครั้ง</button></div>';
        setUpdatedText("ผิดพลาด");
      });
  }

  /* ── Tab clicks ── */
  document.getElementById("tabs").addEventListener("click", function(e) {
    var btn = e.target.closest(".tab-btn");
    if (!btn) return;
    document.querySelectorAll(".tab-btn").forEach(function(x) {
      x.classList.toggle("active", x === btn);
    });
    state.filter = btn.dataset.cat;
    applyFilters();
  });

  /* ── Search ── */
  var searchTimer = null;
  document.getElementById("search-input").addEventListener("input", function(e) {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(function() {
      state.search = e.target.value.trim();
      applyFilters();
    }, 200);
  });

  /* ── Refresh button ── */
  document.getElementById("refresh-btn").addEventListener("click", loadData);

  /* ── Auto refresh ทุก 30 วินาที ── */
  setInterval(loadData, 30000);

  /* ── Update countdown ทุกนาที (ไม่โหลด data ใหม่) ── */
  setInterval(function() {
    document.querySelectorAll(".row.is-pending .row-time").forEach(function(el) {
      var row = el.closest(".row");
      var name = row.dataset.name;
      var item = state.items.find(function(x) {
        return (x.lottery_name || "").toLowerCase() === name;
      });
      if (item && item.next_draw_at) {
        var time = item.next_draw_at.split(" ")[1].slice(0, 5);
        el.textContent = time + " · " + countdownText(item.next_draw_at);
      }
    });
  }, 60000);

  /* ── Initial load ── */
  loadData();
})();
