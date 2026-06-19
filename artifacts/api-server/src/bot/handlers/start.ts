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

// Store per-user current location in memory
export const userLocation = new Map<number, number>();

async function goToCategories(
  ctx: Context,
  userId: number,
  locationId: number,
  edit: boolean
) {
  const user = await getUser(userId);
  const lang = getLang(user?.lang);
  const location = await getLocationById(locationId);
  if (!location) return;

  userLocation.set(userId, locationId);
  await getOrCreateSession(userId, locationId);
  const categories = await getCategories();
  const text = t[lang].mainMenu(lang === "sr" ? location.nameSr : location.nameEn);
  const opts = { parse_mode: "Markdown" as const, reply_markup: categoriesKeyboard(categories, lang) };

  if (edit) {
    await ctx.editMessageText(text, opts);
  } else {
    await ctx.reply(text, opts);
  }
}

async function goToLocationPicker(ctx: Context, lang: "en" | "sr", edit: boolean) {
  const locations = await getLocations();
  const text = t[lang].chooseLocation;
  const opts = { reply_markup: locationKeyboard(locations) };
  if (edit) {
    await ctx.editMessageText(text, opts);
  } else {
    await ctx.reply(text, opts);
  }
}

export function registerStartHandlers(bot: Telegraf<Context>) {
  bot.command("start", async (ctx) => {
    try {
      const tgUser = ctx.from;
      if (!tgUser) return;
      clearWaiting(tgUser.id);
      const user = await upsertUser(tgUser.id, tgUser.username);
      const lang = getLang(user.lang);

      // No language set yet — ask first
      if (!user.lang) {
        await ctx.reply(t[lang].chooseLanguage, { reply_markup: langKeyboard() });
        return;
      }

      const locations = await getLocations();
      if (locations.length === 1) {
        await goToCategories(ctx, tgUser.id, locations[0]!.id, false);
      } else {
        await ctx.reply(t[lang].chooseLocation, { reply_markup: locationKeyboard(locations) });
      }
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
      if (locations.length === 1) {
        await goToCategories(ctx, userId, locations[0]!.id, true);
      } else {
        await goToLocationPicker(ctx, lang, true);
      }
    } catch (err) {
      logger.error({ err }, "lang action error");
    }
  });

  // Location selection (used when multiple locations exist)
  bot.action(/^loc:(\d+)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const locationId = parseInt(ctx.match[1]!);
      await goToCategories(ctx, userId, locationId, true);
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
      const locId = userLocation.get(userId);
      if (!locId) { await ctx.answerCbQuery(); return; }
      await goToCategories(ctx, userId, locId, true);
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "cats action error");
    }
  });
}
