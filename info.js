/* บ้านหวยเรือนเลขเศรษฐี — info pages renderer */
(function () {
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
  function nl2br(s) { return esc(s).replace(/\n/g, "<br>"); }
  function toast(msg) {
    var t = document.createElement("div");
    t.className = "info-toast"; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function() { t.remove(); }, 2400);
  }

  var page = document.querySelector(".info-page");
  if (!page) return;
  var kind = page.dataset.page;
  var box = document.querySelector("#info-content");

  function renderAccount(s) {
    /* ดึง bank จาก /api/public/bank-account/current (ระบบหมุนเวียน P3) ก่อน
       ถ้าไม่มี active → fallback ไป s.banks (เก่า) */
    fetch("/api/public/bank-account/current").then(function(r) {
      if (r.ok) return r.json();
      return null;
    }).then(function(rotating) {
      var banks = [];
      if (rotating && rotating.account_number) {
        banks = [{
          bankName: rotating.bank_name,
          bankCode: rotating.bank_code,
          accountName: rotating.account_holder,
          accountNumber: rotating.account_number,
          note: rotating.note || ""
        }];
      } else {
        banks = s.banks || [];
      }
      if (!banks.length) { box.innerHTML = '<div class="empty">ยังไม่มีเลขบัญชี — รอแอดมินตั้งค่า</div>'; return; }
      box.innerHTML = '<div class="bank-list">' + banks.map(function(b) {
        var code = ((b.bankCode || "generic")+"").toLowerCase();
        var codeUp = code.toUpperCase().slice(0,4) || "?";
        return '<div class="bank-card">' +
          '<div class="bank-header"><span class="bank-logo bank-' + code + '" title="' + codeUp + '"></span><div class="bank-name">' + esc(b.bankName || "ธนาคาร") + '</div></div>' +
          '<div class="bank-num-row">' +
            '<div class="bank-num" data-copy="' + esc(b.accountNumber) + '">' + esc(b.accountNumber || "—") + '</div>' +
            '<button type="button" class="copy-btn" data-copy="' + esc(b.accountNumber) + '">📋 คัดลอก</button>' +
          '</div>' +
          '<div class="bank-name-of">ชื่อบัญชี: <strong>' + esc(b.accountName || "—") + '</strong></div>' +
          (b.note ? '<div class="bank-note">' + esc(b.note) + '</div>' : '') +
        '</div>';
      }).join("") + '</div>' +
      (s.promoNote ? '<div class="promo-note">' + nl2br(s.promoNote) + '</div>' : '') +
      '<div class="info-tip">📌 หลังโอนแล้ว ส่ง <strong>สลิป</strong> + แจ้ง <strong>เลขบิล</strong> (เช่น P000123) กลับเข้าแชท LINE</div>';
      document.querySelectorAll("[data-copy]").forEach(function(el) {
        el.addEventListener("click", function() {
          var v = el.dataset.copy;
          if (!v) return;
          if (navigator.clipboard) {
            navigator.clipboard.writeText(v).then(function() { toast("คัดลอกแล้ว: " + v); });
          } else {
            var ta = document.createElement("textarea");
            ta.value = v; document.body.appendChild(ta); ta.select();
            try { document.execCommand("copy"); toast("คัดลอกแล้ว: " + v); } catch (e) {}
            document.body.removeChild(ta);
          }
        });
      });
    });
  }


  function renderRates(s) {
    var rates = s.payoutRates || {};
    var groups = Object.keys(rates);
    if (!groups.length) { box.innerHTML = '<div class="empty">ยังไม่มีอัตราจ่าย — รอแอดมินตั้งค่า</div>'; return; }
    box.innerHTML = groups.map(function(g) {
      var items = rates[g] || [];
      return '<section class="rates-group">' +
        '<h3>' + esc(g) + '</h3>' +
        '<ul class="rates-list">' + items.map(function(it) {
          return '<li><span class="r-type">' + esc(it.type) + '</span><span class="r-val">' + esc(it.rate) + '</span></li>';
        }).join("") + '</ul>' +
      '</section>';
    }).join("");
  }

  function renderHowTo(s) {
    var t = s.howTo || "ยังไม่มีคำอธิบาย — รอแอดมินตั้งค่า";
    box.innerHTML = '<div class="howto-box">' + nl2br(t) + '</div>';
  }

  function renderGroups(s) {
    var gs = s.groups || [];
    if (!gs.length) { box.innerHTML = '<div class="empty">ยังไม่มีกลุ่มแนวทาง — รอแอดมินตั้งค่า</div>'; return; }
    box.innerHTML = '<div class="group-list">' + gs.map(function(g) {
      var url = g.url || "#";
      return '<a class="group-link" target="_blank" rel="noopener" href="' + esc(url) + '">' +
        '<span class="g-icon">👥</span>' +
        '<span class="g-info"><strong>' + esc(g.title || "กลุ่ม") + '</strong><small>กดเพื่อเข้าร่วม</small></span>' +
        '<span class="g-arrow">›</span>' +
      '</a>';
    }).join("") + '</div>';
  }

  // Replace all /order links with LIFF URL once we know it (so customer auth survives)
  function patchOrderLinks(orderUrl) {
    if (!orderUrl || orderUrl === "/order") return;
    document.querySelectorAll('a[href="/order"], a[href$="/order"]').forEach(function(a) {
      a.href = orderUrl;
    });
  }
  fetch("/api/public/line-info").then(function(r) { return r.json(); }).then(function(s) {
    patchOrderLinks(s.orderUrl);
    if (kind === "index") return; // index page has no dynamic content beyond patching links
    if (kind === "account") return renderAccount(s);
    if (kind === "rates") return renderRates(s);
    if (kind === "howto") return renderHowTo(s);
    if (kind === "groups") return renderGroups(s);
  }).catch(function(err) {
    if (box) box.innerHTML = '<div class="empty">โหลดไม่สำเร็จ ลองรีเฟรชอีกครั้ง</div>';
  });
})();
