/* Discord webhook helper - non-blocking, error-tolerant */
const FLAG = process.env.DISCORD_NOTIFICATIONS_ENABLED === "true";

const WEBHOOKS = {
  results: process.env.DISCORD_WEBHOOK_RESULTS,
  new_tickets: process.env.DISCORD_WEBHOOK_NEW_TICKETS,
  daily_summary: process.env.DISCORD_WEBHOOK_DAILY_SUMMARY,
  alerts_critical: process.env.DISCORD_WEBHOOK_ALERTS_CRITICAL,
  alerts_warnings: process.env.DISCORD_WEBHOOK_ALERTS_WARNINGS,
  winners: process.env.DISCORD_WEBHOOK_WINNERS,
  cron_status: process.env.DISCORD_WEBHOOK_CRON_STATUS,
  deployments: process.env.DISCORD_WEBHOOK_DEPLOYMENTS,
};

/**
 * ส่งข้อความเข้า Discord channel (มี 5s timeout)
 * @param {string} channelKey
 * @param {object} payload - { content?, embeds?, username?, avatar_url? }
 * @returns {Promise<boolean>}
 */
export async function notifyDiscord(channelKey, payload) {
  if (!FLAG) return false;
  const url = WEBHOOKS[channelKey];
  if (!url) {
    console.warn(`[discord] no webhook for ${channelKey}`);
    return false;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: payload.username || "บ้านหวยเรือนเลขเศรษฐี",
        ...payload,
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      console.warn(`[discord] ${channelKey} failed: ${res.status}`);
      return false;
    }
    return true;
  } catch (e) {
    const reason = e.name === "AbortError" ? "timeout" : e.message;
    console.warn(`[discord] ${channelKey} error:`, reason);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/* helper: build embed สวยๆ */
export function makeEmbed({ title, description, color, fields, footer, timestamp }) {
  return {
    title,
    description,
    color: color || 0x06c755,
    fields,
    footer: footer ? { text: footer } : undefined,
    timestamp: timestamp || new Date().toISOString(),
  };
}

/* Sanitize ป้องกัน Discord mention injection + markdown */
export function safeName(s) {
  if (s == null) return "";
  return String(s)
    .replace(/[@`*_~|\\]/g, "")
    .replace(/everyone|here/gi, m => m + "​")
    .slice(0, 80);
}
