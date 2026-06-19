/**
 * public/js/format.mjs
 * Pure utility formatters extracted from app.js (Phase D start, 2026-06-19)
 * No DOM/state dependencies — safe to import anywhere.
 */

/** Format number with Thai locale + currency symbol */
export function money(n) {
  const v = Number(n || 0);
  return v.toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }) + " ฿";
}

/** Format number with Thai grouping */
export function num(n) {
  return Number(n || 0).toLocaleString("th-TH");
}

/** Format payout rate */
export function formatRate(value) {
  return Number(value || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 });
}

/** HTML escape — safe for user-input rendering */
export function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Short date format: DD/MM/YYYY */
export function shortDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("th-TH-u-ca-buddhist", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  } catch { return String(iso); }
}

/** Long date format: 19 มิถุนายน 2569 */
export function longDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("th-TH-u-ca-buddhist", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch { return String(iso); }
}

/** Date + time format */
export function formatDateTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("th-TH-u-ca-buddhist", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return String(iso); }
}

/** Sort digits of a string (for 3-tod matching) */
export function sortDigits(s) {
  return String(s).split("").sort().join("");
}
