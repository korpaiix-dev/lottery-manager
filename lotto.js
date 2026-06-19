
(function() {
  var BG = {"thai":"thai","omsin":"thai","baac":"thai","lott_027":"lao","lott_032":"malay","lott_033":"hanoi","lott_035":"hanoi","lott_036":"hanoi","lott_023":"thai","lott_016":"china","lott_021":"china","lott_042":"china","lott_047":"china","lott_015":"nikkei","lott_020":"nikkei","lott_041":"nikkei","lott_046":"nikkei","lott_017":"hangseng","lott_022":"hangseng","lott_043":"hangseng","lott_048":"hangseng"};
  function bgUrl(id) { return "/img/lotto-bg/" + (BG[id] || "thai") + ".jpg"; }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function fmtDate(iso) {
    if (!iso) return "—";
    try {
      var d = new Date(iso + "T00:00:00");
      var mo = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
      return d.getDate() + " " + mo[d.getMonth()] + " " + ((d.getFullYear()+543)+"").slice(-2);
    } catch(e) { return iso; }
  }

  /* ========== TAB SWITCHING ========== */
  var tabs = document.querySelectorAll(".tab");
  var panels = { latest: document.getElementById("tab-latest"), history: document.getElementById("tab-history") };
  tabs.forEach(function(t) {
    t.addEventListener("click", function() {
      var name = t.dataset.tab;
      tabs.forEach(function(x) { x.classList.toggle("active", x === t); });
      Object.keys(panels).forEach(function(k) { panels[k].hidden = (k !== name); });
      if (name === "history" && !window._historyLoaded) loadHistory();
    });
  });

  /* ========== LATEST ========== */
  function numCell(label, value) {
    if (!value || value === "" || value === "xxx" || value === "xx") {
      return '<div class="num-cell status-pending"><div class="label">' + esc(label) + '</div><div class="value">รอผล</div></div>';
    }
    var v = Array.isArray(value) ? value.join("  ") : String(value);
    var cls = (Array.isArray(value) && value.length > 1) ? "value multi" : "value";
    return '<div class="num-cell"><div class="label">' + esc(label) + '</div><div class="' + cls + '">' + esc(v) + '</div></div>';
  }

  function loadLatest() {
    var root = document.getElementById("latest-root");
    fetch("/api/public/results-latest", { cache: "no-store" })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data.ok || !data.items || !data.items.length) {
          root.innerHTML = '<div class="empty">ยังไม่มีผลรางวัล</div>';
          return;
        }
        /* populate history dropdown */
        var sel = document.getElementById("hist-select");
        var seen = { thai: 1 };
        data.items.forEach(function(it) {
          if (seen[it.lottery_id]) return;
          seen[it.lottery_id] = 1;
          var o = document.createElement("option");
          o.value = it.lottery_id; o.textContent = it.lottery_name;
          sel.appendChild(o);
        });
        /* render cards */
        root.className = "lottery-grid";
        root.innerHTML = data.items.map(function(it) {
          var cells = [];
          if (it.three_top) cells.push(numCell("3 ตัวบน", it.three_top));
          if (it.three_bottom) cells.push(numCell("3 ตัวล่าง", it.three_bottom));
          if (it.two_top) cells.push(numCell("2 ตัวบน", it.two_top));
          if (it.two_bottom) cells.push(numCell("2 ตัวล่าง", it.two_bottom));
          if (!cells.length) cells.push('<div class="num-cell status-pending"><div class="label">รอผลออก</div><div class="value">—</div></div>');
          var statusBadge = it.status === "finalized"
            ? '<span class="badge badge-finalized">✓ ยืนยันแล้ว</span>'
            : '<span class="badge badge-pending">⏳ ยังไม่ยืนยัน</span>';
          return '<div class="lottery-card">' +
            '<div class="hero" style="background-image:url(\'' + bgUrl(it.lottery_id) + '\')">' +
              '<div class="hero-text">' +
                '<div class="hero-name">' + esc(it.lottery_name) + '</div>' +
                '<div class="hero-date">งวด ' + esc(fmtDate(it.draw_date)) + ' · ' + statusBadge + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="body">' + cells.join("") + '</div>' +
          '</div>';
        }).join("");
        document.getElementById("updated-at").textContent = "อัพเดท: " + new Date().toLocaleTimeString("th-TH").slice(0,5);
      })
      .catch(function(e) {
        root.innerHTML = '<div class="empty">โหลดล้มเหลว: ' + esc(e.message || e) + '<br><br><button class="refresh-btn" onclick="location.reload()">ลองอีกครั้ง</button></div>';
      });
  }
  document.getElementById("refresh-latest").addEventListener("click", function() {
    document.getElementById("latest-root").innerHTML = '<div class="skeleton"><div class="skeleton-card"><div class="sk-hero"></div><div class="sk-body"><div class="sk-pill"></div><div class="sk-pill"></div></div></div></div>';
    loadLatest();
  });

  /* ========== HISTORY ========== */
  function loadHistory() {
    var root = document.getElementById("history-root");
    var lottery = document.getElementById("hist-select").value || "thai";
    root.innerHTML = '<div class="empty">⏳ กำลังโหลด...</div>';
    fetch("/api/public/results-history?lottery=" + encodeURIComponent(lottery), { cache: "no-store" })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        window._historyLoaded = true;
        if (!data.ok || !data.items || !data.items.length) {
          root.innerHTML = '<div class="empty">ยังไม่มีข้อมูลย้อนหลัง</div>';
          return;
        }
        root.innerHTML = data.items.map(function(it) {
          var pills = [];
          if (it.no1) pills.push('<div class="pill"><div class="pl">รางวัลที่ 1</div><div class="pv" style="font-size:13px">' + esc(it.no1) + '</div></div>');
          var tt = Array.isArray(it.three_top) ? it.three_top.join(" ") : it.three_top;
          if (tt) pills.push('<div class="pill"><div class="pl">3 บน</div><div class="pv">' + esc(tt) + '</div></div>');
          var tb = Array.isArray(it.three_bottom) ? it.three_bottom.join(" ") : it.three_bottom;
          if (tb) pills.push('<div class="pill"><div class="pl">3 ล่าง</div><div class="pv">' + esc(tb) + '</div></div>');
          if (it.two_top) pills.push('<div class="pill"><div class="pl">2 บน</div><div class="pv">' + esc(it.two_top) + '</div></div>');
          if (it.two_bottom) pills.push('<div class="pill"><div class="pl">2 ล่าง</div><div class="pv">' + esc(it.two_bottom) + '</div></div>');
          var dateStr = it.date_th || fmtDate(it.draw_date);
          return '<div class="history-row"><div class="date">' + esc(dateStr) + '</div><div class="nums">' + pills.join("") + '</div></div>';
        }).join("");
      })
      .catch(function(e) {
        root.innerHTML = '<div class="empty">โหลดล้มเหลว: ' + esc(e.message || e) + '</div>';
      });
  }
  document.getElementById("hist-select").addEventListener("change", function() { window._historyLoaded = false; loadHistory(); });

  /* boot */
  loadLatest();
})();
