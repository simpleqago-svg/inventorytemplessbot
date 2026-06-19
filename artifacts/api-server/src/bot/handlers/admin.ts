import { Telegraf, Context } from "telegraf";
import { logger } from "../../lib/logger.js";
import { t, getLang } from "../i18n.js";
import {
  adminKeyboard,
  adminCategoryKeyboard,
  adminTypeKeyboard,
} from "../keyboards.js";
import { getUser, getCategories, addCategory, addProduct, addLocation } from "../db.js";
import { setWaiting, getWaiting, clearWaiting } from "../state.js";

export function registerAdminHandlers(bot: Telegraf<Context>) {
  bot.command("admin", async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      if (!user?.isAdmin) {
        await ctx.reply(t[lang].notAdmin);
        return;
      }
      clearWaiting(userId);
      await ctx.reply(t[lang].adminMenu, { reply_markup: adminKeyboard(lang) });
    } catch (err) {
      logger.error({ err }, "admin command error");
    }
  });

  bot.action("admin:add_cat", async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      if (!user?.isAdmin) { await ctx.answerCbQuery(t[lang].notAdmin); return; }
      setWaiting(userId, { type: "admin_cat_name_en" });
      await ctx.editMessageText(t[lang].enterCategoryNameEn);
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "admin:add_cat error");
    }
  });

  bot.action("admin:add_prod", async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      if (!user?.isAdmin) { await ctx.answerCbQuery(t[lang].notAdmin); return; }
      const categories = await getCategories();
      await ctx.editMessageText(t[lang].chooseCategory, {
        reply_markup: adminCategoryKeyboard(categories),
      });
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "admin:add_prod error");
    }
  });

  bot.action("admin:add_loc", async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      if (!user?.isAdmin) { await ctx.answerCbQuery(t[lang].notAdmin); return; }
      setWaiting(userId, { type: "admin_loc_name_en" });
      await ctx.editMessageText(t[lang].enterLocationNameEn);
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "admin:add_loc error");
    }
  });

  bot.action(/^admin:cat_pick:(\d+)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      if (!user?.isAdmin) { await ctx.answerCbQuery(t[lang].notAdmin); return; }
      const categoryId = parseInt(ctx.match[1]!);
      setWaiting(userId, { type: "admin_prod_name_en", categoryId });
      await ctx.editMessageText(t[lang].enterProductNameEn);
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "admin:cat_pick error");
    }
  });

  bot.action(/^admin:type:(color|numeric|both)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      if (!user?.isAdmin) { await ctx.answerCbQuery(t[lang].notAdmin); return; }
      const mType = ctx.match[1] as "color" | "numeric" | "both";
      const waiting = getWaiting(userId);
      if (!waiting || waiting.type !== "admin_prod_choose_type") {
        await ctx.answerCbQuery();
        return;
      }

      if (mType === "color") {
        await addProduct(waiting.categoryId, waiting.nameEn, waiting.nameSr, "color", null);
        clearWaiting(userId);
        await ctx.editMessageText(t[lang].productSaved, { reply_markup: adminKeyboard(lang) });
      } else {
        setWaiting(userId, {
          type: "admin_prod_unit",
          categoryId: waiting.categoryId,
          nameEn: waiting.nameEn,
          nameSr: waiting.nameSr,
          measurementType: mType,
        });
        await ctx.editMessageText(t[lang].enterUnit);
      }
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "admin:type error");
    }
  });

  bot.action("admin:cancel", async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      clearWaiting(userId);
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      await ctx.editMessageText(t[lang].adminMenu, { reply_markup: adminKeyboard(lang) });
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "admin:cancel error");
    }
  });
}

/**
 * Handle text messages from admins during multi-step flows.
 * Returns true if the message was consumed by admin flow.
 */
export async function handleAdminText(
  _bot: Telegraf<Context>,
  userId: number,
  text: string,
  replyFn: (msg: string, opts?: object) => Promise<unknown>
): Promise<boolean> {
  const waiting = getWaiting(userId);
  if (!waiting) return false;

  const user = await getUser(userId);
  if (!user?.isAdmin) return false;

  const lang = getLang(user.lang);

  switch (waiting.type) {
    case "admin_cat_name_en": {
      setWaiting(userId, { type: "admin_cat_name_sr", nameEn: text });
      await replyFn(t[lang].enterCategoryNameSr);
      return true;
    }
    case "admin_cat_name_sr": {
      await addCategory(waiting.nameEn, text);
      clearWaiting(userId);
      await replyFn(t[lang].categorySaved);
      return true;
    }
    case "admin_prod_name_en": {
      setWaiting(userId, { type: "admin_prod_name_sr", categoryId: waiting.categoryId, nameEn: text });
      await replyFn(t[lang].enterProductNameSr);
      return true;
    }
    case "admin_prod_name_sr": {
      setWaiting(userId, {
        type: "admin_prod_choose_type",
        categoryId: waiting.categoryId,
        nameEn: waiting.nameEn,
        nameSr: text,
      });
      await replyFn(t[lang].chooseType, { reply_markup: adminTypeKeyboard(lang) });
      return true;
    }
    case "admin_prod_unit": {
      await addProduct(
        waiting.categoryId,
        waiting.nameEn,
        waiting.nameSr,
        waiting.measurementType,
        text
      );
      clearWaiting(userId);
      await replyFn(t[lang].productSaved);
      return true;
    }
    case "admin_loc_name_en": {
      setWaiting(userId, { type: "admin_loc_name_sr", nameEn: text });
      await replyFn(t[lang].enterLocationNameSr);
      return true;
    }
    case "admin_loc_name_sr": {
      await addLocation(waiting.nameEn, text);
      clearWaiting(userId);
      await replyFn(t[lang].locationSaved);
      return true;
    }
    default:
      return false;
  }
}
