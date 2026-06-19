import { Telegraf, Context } from "telegraf";
import { logger } from "../../lib/logger.js";
import { t, getLang } from "../i18n.js";
import {
  langKeyboard,
  locationKeyboard,
  categoriesKeyboard,
} from "../keyboards.js";
import {
  upsertUser,
  setUserLang,
  getUser,
  getLocations,
  getCategories,
  getOrCreateSession,
  getLocationById,
} from "../db.js";
import { clearWaiting } from "../state.js";

// Store per-user current location in memory (complement to DB session)
export const userLocation = new Map<number, number>();

export function registerStartHandlers(bot: Telegraf<Context>) {
  bot.command("start", async (ctx) => {
    try {
      const tgUser = ctx.from;
      if (!tgUser) return;
      clearWaiting(tgUser.id);
      const user = await upsertUser(tgUser.id, tgUser.username);
      const lang = getLang(user.lang);

      if (!user.lang) {
        await ctx.reply(t[lang].chooseLanguage, {
          reply_markup: langKeyboard(),
        });
        return;
      }

      const locations = await getLocations();
      await ctx.reply(t[lang].chooseLocation, {
        reply_markup: locationKeyboard(locations),
      });
    } catch (err) {
      logger.error({ err }, "start command error");
    }
  });

  // Language selection
  bot.action(/^lang:(en|sr)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const lang = ctx.match[1] as "en" | "sr";
      await setUserLang(userId, lang);
      const locations = await getLocations();
      await ctx.editMessageText(t[lang].chooseLocation, {
        reply_markup: locationKeyboard(locations),
      });
    } catch (err) {
      logger.error({ err }, "lang action error");
    }
  });

  // Location selection
  bot.action(/^loc:(\d+)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const locationId = parseInt(ctx.match[1]!);
      userLocation.set(userId, locationId);

      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      const location = await getLocationById(locationId);
      if (!location) return;

      await getOrCreateSession(userId, locationId);

      const categories = await getCategories();
      await ctx.editMessageText(
        t[lang].mainMenu(lang === "sr" ? location.nameSr : location.nameEn),
        {
          parse_mode: "Markdown",
          reply_markup: categoriesKeyboard(categories, lang),
        }
      );
    } catch (err) {
      logger.error({ err }, "loc action error");
    }
  });

  // Back to categories
  bot.action("cats", async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      clearWaiting(userId);
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      const locId = userLocation.get(userId);
      if (!locId) {
        await ctx.answerCbQuery();
        return;
      }
      const location = await getLocationById(locId);
      if (!location) return;
      const categories = await getCategories();
      await ctx.editMessageText(
        t[lang].mainMenu(lang === "sr" ? location.nameSr : location.nameEn),
        {
          parse_mode: "Markdown",
          reply_markup: categoriesKeyboard(categories, lang),
        }
      );
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "cats action error");
    }
  });
}
