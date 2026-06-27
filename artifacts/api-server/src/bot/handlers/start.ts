import { Telegraf, Context } from "telegraf";
import { logger } from "../../lib/logger.js";
import { t, getLang } from "../i18n.js";
import {
  langKeyboard,
  locationKeyboard,
  categoriesKeyboard,
  settingsKeyboard,
} from "../keyboards.js";
import {
  upsertUser,
  setUserLang,
  getUser,
  getLocations,
  getCategories,
  getOrCreateSession,
  getLocationById,
  getActiveSessionLocation,
  getCategoryStats,
} from "../db.js";
import { clearWaiting } from "../state.js";

export const userLocation = new Map<number, number>();

async function resolveLocation(userId: number): Promise<number | undefined> {
  let locId = userLocation.get(userId);
  if (!locId) {
    locId = await getActiveSessionLocation(userId);
    if (locId) userLocation.set(userId, locId);
  }
  return locId;
}

export async function goToCategories(
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
  const session = await getOrCreateSession(userId, locationId);
  const categories = await getCategories();
  const stats = await getCategoryStats(session.id);
  const locationName = lang === "sr" ? location.nameSr : location.nameEn;
  const text = t[lang].mainMenu(locationName);
  const opts = {
    parse_mode: "HTML" as const,
    reply_markup: categoriesKeyboard(categories, lang, stats),
  };

  if (edit) {
    await ctx.editMessageText(text, opts);
  } else {
    await ctx.reply(text, opts);
  }
}

async function goToLocationPicker(ctx: Context, lang: "en" | "sr", edit: boolean) {
  const locations = await getLocations();
  const text = t[lang].chooseLocation;
  const opts = { reply_markup: locationKeyboard(locations, lang) };
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

      try { await ctx.deleteMessage(); } catch {}

      const user = await upsertUser(tgUser.id, tgUser.username);
      const lang = getLang(user.lang);

      if (!user.lang) {
        await ctx.reply(t[lang].chooseLanguage, { reply_markup: langKeyboard() });
        return;
      }

      const locations = await getLocations();
      if (locations.length === 1) {
        await goToCategories(ctx, tgUser.id, locations[0]!.id, false);
      } else {
        await ctx.reply(t[lang].chooseLocation, { reply_markup: locationKeyboard(locations, lang) });
      }
    } catch (err) {
      logger.error({ err }, "start command error");
    }
  });

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
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "lang action error");
    }
  });

  bot.action(/^loc:(\d+)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const locationId = parseInt(ctx.match[1]!);
      await goToCategories(ctx, userId, locationId, true);
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "loc action error");
    }
  });

  bot.action("cats", async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      clearWaiting(userId);
      let locId = await resolveLocation(userId);
      if (!locId) {
        const locations = await getLocations();
        if (locations.length === 1) locId = locations[0]!.id;
      }
      if (!locId) { await ctx.answerCbQuery(); return; }
      await goToCategories(ctx, userId, locId, true);
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "cats action error");
    }
  });

  bot.action("settings", async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      await ctx.editMessageText(t[lang].settingsMenu, {
        reply_markup: settingsKeyboard(lang),
      });
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "settings action error");
    }
  });

  bot.action("settings:lang", async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      await ctx.editMessageText(t[lang].chooseLanguage, {
        reply_markup: langKeyboard(),
      });
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "settings:lang action error");
    }
  });
}

export { resolveLocation };
