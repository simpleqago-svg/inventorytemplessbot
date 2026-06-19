import { Telegraf, Context } from "telegraf";
import { logger } from "../../lib/logger.js";
import { t, getLang } from "../i18n.js";
import { reportKeyboard } from "../keyboards.js";
import {
  getUser,
  getSession,
  getOrCreateSession,
  closeSession,
  getLocationById,
} from "../db.js";
import { buildReportText } from "../report.js";
import { userLocation } from "./start.js";

export function registerReportHandlers(bot: Telegraf<Context>) {
  bot.action("report", async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      const locId = userLocation.get(userId);
      if (!locId) { await ctx.answerCbQuery(); return; }

      const location = await getLocationById(locId);
      if (!location) { await ctx.answerCbQuery(); return; }

      const session = await getOrCreateSession(userId, locId);
      const username = ctx.from.username
        ? `@${ctx.from.username}`
        : ctx.from.first_name ?? String(userId);

      const locationName = lang === "sr" ? location.nameSr : location.nameEn;
      const text = await buildReportText(session.id, username, locationName, lang);

      await ctx.editMessageText(text, {
        parse_mode: "Markdown",
        reply_markup: reportKeyboard(lang),
      });
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "report action error");
    }
  });

  bot.action("submit", async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      const locId = userLocation.get(userId);
      if (!locId) { await ctx.answerCbQuery(); return; }

      const session = await getSession(userId, locId);
      if (!session) {
        await ctx.answerCbQuery(t[lang].sessionClosed);
        return;
      }

      const location = await getLocationById(locId);
      if (!location) { await ctx.answerCbQuery(); return; }

      const username = ctx.from.username
        ? `@${ctx.from.username}`
        : ctx.from.first_name ?? String(userId);

      const locationName = lang === "sr" ? location.nameSr : location.nameEn;
      const text = await buildReportText(session.id, username, locationName, lang);

      const channelId = process.env["TELEGRAM_CHANNEL_ID"];
      if (channelId) {
        await ctx.telegram.sendMessage(channelId, text, {
          parse_mode: "Markdown",
        });
      }

      await closeSession(session.id);
      userLocation.delete(userId);

      await ctx.editMessageText(t[lang].submitted);
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "submit action error");
    }
  });
}
