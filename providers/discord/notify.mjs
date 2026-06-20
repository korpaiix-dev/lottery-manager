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
 * ส่งข้อความเข้า Discord channel
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
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: payload.username || "บ้านหวยเรือนเลขเศรษฐี",
        ...payload,
      }),
    });
    if (!res.ok) {
      console.warn(`[discord] ${channelKey} failed: ${res.status}`);
      return false;
    }
    return true;
  } catch (e) {
    console.warn(`[discord] ${channelKey} error:`, e.message);
    return false;
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
