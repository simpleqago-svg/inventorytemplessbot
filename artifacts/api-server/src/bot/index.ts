import { Telegraf } from "telegraf";
import { logger } from "../lib/logger.js";
import { registerStartHandlers } from "./handlers/start.js";
import { registerInventoryHandlers } from "./handlers/inventory.js";
import { registerReportHandlers } from "./handlers/report.js";
import { registerAdminHandlers, handleAdminText } from "./handlers/admin.js";
import { getWaiting } from "./state.js";
import { getUser } from "./db.js";

const adminTextTypes = [
  "admin_cat_name_en",
  "admin_cat_name_sr",
  "admin_prod_name_en",
  "admin_prod_name_sr",
  "admin_prod_unit",
  "admin_loc_name_en",
  "admin_loc_name_sr",
  "admin_assign_username",
  "admin_edit_prod_unit",
];

export function createBot(): Telegraf {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is required");

  const bot = new Telegraf(token);

  registerStartHandlers(bot);

  // Admin text middleware must run BEFORE inventory's bot.on("text")
  bot.use(async (ctx, next) => {
    if (ctx.updateType !== "message") return next();
    const msg = (ctx as any).message;
    if (!msg || !("text" in msg)) return next();

    const userId = ctx.from?.id;
    if (!userId) return next();

    const waiting = getWaiting(userId);
    if (!waiting) return next();

    if (!adminTextTypes.includes(waiting.type)) return next();

    const user = await getUser(userId);
    if (!user?.isAdmin) return next();

    const handled = await handleAdminText(
      bot,
      userId,
      msg.text,
      ctx.telegram
    );

    if (!handled) return next();
    try { await ctx.deleteMessage(); } catch {}
  });

  registerInventoryHandlers(bot);
  registerReportHandlers(bot);
  registerAdminHandlers(bot);

  bot.catch((err, ctx) => {
    logger.error({ err, update: ctx.update }, "Unhandled bot error");
  });

  return bot;
}
