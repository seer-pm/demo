import { PAYOUT_CHAINS, watchDistributor } from "@seer-pm/rewards";
import { requireBackgroundSecret } from "./utils/backgroundAuth.ts";
import { getPublicClientByChainId } from "./utils/config.ts";
import { sendTelegramMessage } from "./utils/telegram.ts";

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Watches the weekly liquidity rewards on every payout chain (`watchDistributor` in `packages/seer-pm-rewards`):
 * recomputes each pending root, which the Safe must revoke within the distributor's timelock when it is wrong, and
 * checks the bot proposed, accepted and paid every week in time. Read-only and keyless, so a stolen updater key
 * cannot quiet it. Each run posts every problem it finds to `ADMIN_ALERTS_TELEGRAM_CHAT_ID`, so an unsolved one
 * repeats every hour until someone acts.
 */
export default async (req: Request) => {
  const unauthorized = requireBackgroundSecret(req);
  if (unauthorized) return unauthorized;

  const alerts: string[] = [];
  for (const payoutChainId of Object.keys(PAYOUT_CHAINS).map(Number)) {
    try {
      const watch = await watchDistributor({
        payoutChainId,
        payoutClient: getPublicClientByChainId(payoutChainId),
        clientFor: getPublicClientByChainId,
      });
      console.log(`rewards-watch: chain ${payoutChainId}: ${watch.status}; ${watch.alerts.length} alerts`);
      alerts.push(...watch.alerts.map((alert) => `chain ${payoutChainId}: ${alert}`));
    } catch (e) {
      console.error(`rewards-watch: chain ${payoutChainId}:`, e);
      alerts.push(
        `chain ${payoutChainId}: could not check the rewards distributor: ${e instanceof Error ? e.message : e}`,
      );
    }
  }
  if (alerts.length === 0) return;

  for (const alert of alerts) console.error(`rewards-watch: ${alert}`);
  const botToken = process.env.TELEGRAM_NOTIFICATIONS_BOT_TOKEN;
  const chatId = process.env.ADMIN_ALERTS_TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    console.error("rewards-watch: TELEGRAM_NOTIFICATIONS_BOT_TOKEN or ADMIN_ALERTS_TELEGRAM_CHAT_ID is not configured");
    return;
  }
  const message = ["<b>Liquidity rewards watch</b>", ...alerts.map((alert) => `• ${escapeHtml(alert)}`)].join("\n");
  try {
    await sendTelegramMessage(botToken, chatId, message);
  } catch (e) {
    console.error("rewards-watch: failed to send the Telegram alert:", e);
  }
};
