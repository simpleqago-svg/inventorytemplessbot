import { Telegraf } from "telegraf";
import { logger } from "../lib/logger.js";
import { registerStartHandlers } from "./handlers/start.js";
import { registerInventoryHandlers } from "./handlers/inventory.js";
import { registerReportHandlers } from "./handlers/report.js";
import { registerAdminHandlers, handleAdminText } from "./handlers/admin.js";
import { getWaiting } from "./state.js";
import { getUser } from "./db.js";
import { getLang } from "./i18n.js";

export function createBot(): Telegraf {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is required");

  const bot = new Telegraf(token);

  registerStartHandlers(bot);
  registerInventoryHandlers(bot);
  registerReportHandlers(bot);
  registerAdminHandlers(bot);

  // Override the text handler in inventory to also handle admin text flows
  // We need to intercept BEFORE inventory's text handler.
  // Since inventory registers its own bot.on("text"), we add admin check here
  // by hooking into the middleware chain first.
  bot.use(async (ctx, next) => {
    if (ctx.updateType !== "message") return next();
    const msg = (ctx as any).message;
    if (!msg || !("text" in msg)) return next();

    const userId = ctx.from?.id;
    if (!userId) return next();

    const waiting = getWaiting(userId);
    if (!waiting) return next();

    const adminTypes = [
      "admin_cat_name_en",
      "admin_cat_name_sr",
      "admin_prod_name_en",
      "admin_prod_name_sr",
      "admin_prod_unit",
    ];

    if (!adminTypes.includes(waiting.type)) return next();

    const user = await getUser(userId);
    if (!user?.isAdmin) return next();

    const handled = await handleAdminText(
      bot,
      userId,
      msg.text,
      (text: string, opts?: object) => ctx.reply(text, opts)
    );

    if (!handled) return next();
    // Delete user message
    try { await ctx.deleteMessage(); } catch {}
  });

  bot.catch((err, ctx) => {
    logger.error({ err, update: ctx.update }, "Unhandled bot error");
  });

  return bot;
}
