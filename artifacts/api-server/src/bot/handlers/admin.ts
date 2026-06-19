import { Telegraf, Context, Telegram } from "telegraf";
import { logger } from "../../lib/logger.js";
import { t, getLang } from "../i18n.js";
import {
  adminCategoryKeyboard,
  adminTypeKeyboard,
  settingsKeyboard,
  deleteCategoryKeyboard,
  deleteProductCategoryKeyboard,
  deleteProductKeyboard,
  confirmDeleteKeyboard,
  editProductTypeCategoryKeyboard,
  editProductTypeProductKeyboard,
  editTypeKeyboard,
} from "../keyboards.js";
import {
  getUser,
  getCategories,
  getProductsByCategory,
  addCategory,
  addProduct,
  updateProduct,
  addLocation,
  getUserByUsername,
  setUserAdmin,
  getCategoryById,
  getProduct,
  deleteCategory,
  deleteProduct,
} from "../db.js";
import { setWaiting, getWaiting, clearWaiting } from "../state.js";

export function registerAdminHandlers(bot: Telegraf<Context>) {
  bot.command("admin", async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      try { await ctx.deleteMessage(); } catch {}
      if (!user?.isAdmin) {
        await ctx.reply(t[lang].notAdmin);
        return;
      }
      clearWaiting(userId);
      await ctx.reply(t[lang].settingsMenu, {
        reply_markup: settingsKeyboard(lang, true),
      });
    } catch (err) {
      logger.error({ err }, "admin command error");
    }
  });

  // ── Add category ──────────────────────────────────────────────────────────
  bot.action("admin:add_cat", async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      if (!user?.isAdmin) { await ctx.answerCbQuery(t[lang].notAdmin); return; }
      const msgId = ctx.callbackQuery.message?.message_id;
      const chatId = ctx.chat?.id;
      if (!msgId || !chatId) { await ctx.answerCbQuery(); return; }
      setWaiting(userId, { type: "admin_cat_name_en", messageId: msgId, chatId });
      await ctx.editMessageText(t[lang].enterCategoryNameEn);
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "admin:add_cat error");
    }
  });

  // ── Add product ───────────────────────────────────────────────────────────
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

  // ── Add location ──────────────────────────────────────────────────────────
  bot.action("admin:add_loc", async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      if (!user?.isAdmin) { await ctx.answerCbQuery(t[lang].notAdmin); return; }
      const msgId = ctx.callbackQuery.message?.message_id;
      const chatId = ctx.chat?.id;
      if (!msgId || !chatId) { await ctx.answerCbQuery(); return; }
      setWaiting(userId, { type: "admin_loc_name_en", messageId: msgId, chatId });
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
      const msgId = ctx.callbackQuery.message?.message_id;
      const chatId = ctx.chat?.id;
      if (!msgId || !chatId) { await ctx.answerCbQuery(); return; }
      setWaiting(userId, { type: "admin_prod_name_en", categoryId, messageId: msgId, chatId });
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
        await ctx.editMessageText(t[lang].productSaved, {
          reply_markup: settingsKeyboard(lang, true),
        });
      } else {
        setWaiting(userId, {
          type: "admin_prod_unit",
          categoryId: waiting.categoryId,
          nameEn: waiting.nameEn,
          nameSr: waiting.nameSr,
          measurementType: mType,
          messageId: waiting.messageId,
          chatId: waiting.chatId,
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
      await ctx.editMessageText(t[lang].settingsMenu, {
        reply_markup: settingsKeyboard(lang, user?.isAdmin ?? false),
      });
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "admin:cancel error");
    }
  });

  // ── Delete category ───────────────────────────────────────────────────────
  bot.action("admin:del_cat", async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      if (!user?.isAdmin) { await ctx.answerCbQuery(t[lang].notAdmin); return; }
      const categories = await getCategories();
      await ctx.editMessageText(t[lang].deleteCategory + ":", {
        reply_markup: deleteCategoryKeyboard(categories, lang),
      });
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "admin:del_cat error");
    }
  });

  bot.action(/^admin:del_cat_ask:(\d+)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      if (!user?.isAdmin) { await ctx.answerCbQuery(t[lang].notAdmin); return; }
      const categoryId = parseInt(ctx.match[1]!);
      const cat = await getCategoryById(categoryId);
      if (!cat) { await ctx.answerCbQuery(); return; }
      const catName = lang === "sr" ? cat.nameSr : cat.nameEn;
      await ctx.editMessageText(t[lang].confirmDeleteCategory(catName), {
        parse_mode: "HTML",
        reply_markup: confirmDeleteKeyboard(lang, `admin:del_cat_confirm:${categoryId}`),
      });
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "admin:del_cat_ask error");
    }
  });

  bot.action(/^admin:del_cat_confirm:(\d+)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      if (!user?.isAdmin) { await ctx.answerCbQuery(t[lang].notAdmin); return; }
      const categoryId = parseInt(ctx.match[1]!);
      await deleteCategory(categoryId);
      await ctx.answerCbQuery(t[lang].categoryDeleted);
      await ctx.editMessageText(t[lang].settingsMenu, {
        reply_markup: settingsKeyboard(lang, true),
      });
    } catch (err) {
      logger.error({ err }, "admin:del_cat_confirm error");
    }
  });

  // ── Delete product ────────────────────────────────────────────────────────
  bot.action("admin:del_prod", async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      if (!user?.isAdmin) { await ctx.answerCbQuery(t[lang].notAdmin); return; }
      const categories = await getCategories();
      await ctx.editMessageText(t[lang].deleteProduct + ":", {
        reply_markup: deleteProductCategoryKeyboard(categories, lang),
      });
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "admin:del_prod error");
    }
  });

  bot.action(/^admin:del_prod_cat:(\d+)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      if (!user?.isAdmin) { await ctx.answerCbQuery(t[lang].notAdmin); return; }
      const categoryId = parseInt(ctx.match[1]!);
      const products = await getProductsByCategory(categoryId);
      await ctx.editMessageText(t[lang].chooseProductToDelete, {
        reply_markup: deleteProductKeyboard(products, lang),
      });
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "admin:del_prod_cat error");
    }
  });

  bot.action(/^admin:del_prod_ask:(\d+)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      if (!user?.isAdmin) { await ctx.answerCbQuery(t[lang].notAdmin); return; }
      const productId = parseInt(ctx.match[1]!);
      const prod = await getProduct(productId);
      if (!prod) { await ctx.answerCbQuery(); return; }
      const prodName = lang === "sr" ? prod.nameSr : prod.nameEn;
      await ctx.editMessageText(t[lang].confirmDeleteProduct(prodName), {
        parse_mode: "HTML",
        reply_markup: confirmDeleteKeyboard(lang, `admin:del_prod_confirm:${productId}`),
      });
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "admin:del_prod_ask error");
    }
  });

  bot.action(/^admin:del_prod_confirm:(\d+)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      if (!user?.isAdmin) { await ctx.answerCbQuery(t[lang].notAdmin); return; }
      const productId = parseInt(ctx.match[1]!);
      await deleteProduct(productId);
      await ctx.answerCbQuery(t[lang].productDeleted);
      await ctx.editMessageText(t[lang].settingsMenu, {
        reply_markup: settingsKeyboard(lang, true),
      });
    } catch (err) {
      logger.error({ err }, "admin:del_prod_confirm error");
    }
  });

  // ── Assign admin ──────────────────────────────────────────────────────────
  bot.action("settings:assign_admin", async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      if (!user?.isAdmin) { await ctx.answerCbQuery(t[lang].notAdmin); return; }
      const msgId = ctx.callbackQuery.message?.message_id;
      const chatId = ctx.chat?.id;
      if (!msgId || !chatId) { await ctx.answerCbQuery(); return; }
      setWaiting(userId, { type: "admin_assign_username", messageId: msgId, chatId });
      await ctx.editMessageText(t[lang].enterAdminUsername);
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "settings:assign_admin error");
    }
  });

  // ── Edit product type ─────────────────────────────────────────────────────
  bot.action("admin:edit_prod_type", async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      if (!user?.isAdmin) { await ctx.answerCbQuery(t[lang].notAdmin); return; }
      const categories = await getCategories();
      await ctx.editMessageText(t[lang].chooseCategory, {
        reply_markup: editProductTypeCategoryKeyboard(categories),
      });
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "admin:edit_prod_type error");
    }
  });

  bot.action(/^admin:edit_pt_cat:(\d+)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      if (!user?.isAdmin) { await ctx.answerCbQuery(t[lang].notAdmin); return; }
      const categoryId = parseInt(ctx.match[1]!);
      const products = await getProductsByCategory(categoryId);
      await ctx.editMessageText(t[lang].chooseProductToEdit, {
        reply_markup: editProductTypeProductKeyboard(products, lang),
      });
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "admin:edit_pt_cat error");
    }
  });

  bot.action(/^admin:edit_pt_pick:(\d+)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      if (!user?.isAdmin) { await ctx.answerCbQuery(t[lang].notAdmin); return; }
      const productId = parseInt(ctx.match[1]!);
      const msgId = ctx.callbackQuery.message?.message_id;
      const chatId = ctx.chat?.id;
      if (!msgId || !chatId) { await ctx.answerCbQuery(); return; }
      const prod = await getProduct(productId);
      if (!prod) { await ctx.answerCbQuery(); return; }
      const prodName = lang === "sr" ? prod.nameSr : prod.nameEn;
      await ctx.editMessageText(`${t[lang].chooseType}\n<b>${prodName}</b>`, {
        parse_mode: "HTML",
        reply_markup: editTypeKeyboard(lang, productId),
      });
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "admin:edit_pt_pick error");
    }
  });

  bot.action(/^admin:type_upd:(\d+):(color|numeric|both)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      if (!user?.isAdmin) { await ctx.answerCbQuery(t[lang].notAdmin); return; }
      const productId = parseInt(ctx.match[1]!);
      const mType = ctx.match[2] as "color" | "numeric" | "both";

      if (mType === "color") {
        await updateProduct(productId, "color", null);
        await ctx.editMessageText(t[lang].productTypeUpdated, {
          reply_markup: settingsKeyboard(lang, true),
        });
      } else {
        const msgId = ctx.callbackQuery.message?.message_id;
        const chatId = ctx.chat?.id;
        if (!msgId || !chatId) { await ctx.answerCbQuery(); return; }
        setWaiting(userId, { type: "admin_edit_prod_unit", productId, measurementType: mType, messageId: msgId, chatId });
        await ctx.editMessageText(t[lang].enterUnit);
      }
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "admin:type_upd error");
    }
  });
}

export async function handleAdminText(
  _bot: Telegraf<Context>,
  userId: number,
  text: string,
  telegram: Telegram
): Promise<boolean> {
  const waiting = getWaiting(userId);
  if (!waiting) return false;

  const user = await getUser(userId);
  if (!user?.isAdmin) return false;

  const lang = getLang(user.lang);

  const edit = async (msg: string, opts?: object) => {
    await telegram.editMessageText(waiting.chatId, waiting.messageId, undefined, msg, opts as any);
  };

  switch (waiting.type) {
    case "admin_cat_name_en": {
      setWaiting(userId, { type: "admin_cat_name_sr", nameEn: text, messageId: waiting.messageId, chatId: waiting.chatId });
      await edit(t[lang].enterCategoryNameSr);
      return true;
    }
    case "admin_cat_name_sr": {
      await addCategory(waiting.nameEn, text);
      clearWaiting(userId);
      await edit(t[lang].categorySaved, { reply_markup: settingsKeyboard(lang, true) });
      return true;
    }
    case "admin_prod_name_en": {
      setWaiting(userId, {
        type: "admin_prod_name_sr",
        categoryId: waiting.categoryId,
        nameEn: text,
        messageId: waiting.messageId,
        chatId: waiting.chatId,
      });
      await edit(t[lang].enterProductNameSr);
      return true;
    }
    case "admin_prod_name_sr": {
      setWaiting(userId, {
        type: "admin_prod_choose_type",
        categoryId: waiting.categoryId,
        nameEn: waiting.nameEn,
        nameSr: text,
        messageId: waiting.messageId,
        chatId: waiting.chatId,
      });
      await edit(t[lang].chooseType, { reply_markup: adminTypeKeyboard(lang) });
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
      await edit(t[lang].productSaved, { reply_markup: settingsKeyboard(lang, true) });
      return true;
    }
    case "admin_loc_name_en": {
      setWaiting(userId, { type: "admin_loc_name_sr", nameEn: text, messageId: waiting.messageId, chatId: waiting.chatId });
      await edit(t[lang].enterLocationNameSr);
      return true;
    }
    case "admin_loc_name_sr": {
      await addLocation(waiting.nameEn, text);
      clearWaiting(userId);
      await edit(t[lang].locationSaved, { reply_markup: settingsKeyboard(lang, true) });
      return true;
    }
    case "admin_assign_username": {
      const target = await getUserByUsername(text);
      if (!target) {
        clearWaiting(userId);
        await edit(t[lang].userNotFound, { reply_markup: settingsKeyboard(lang, true) });
        return true;
      }
      await setUserAdmin(target.id, true);
      clearWaiting(userId);
      const uname = target.username ?? String(target.id);
      await edit(t[lang].adminAssigned(uname), { reply_markup: settingsKeyboard(lang, true) });
      return true;
    }
    case "admin_edit_prod_unit": {
      await updateProduct(waiting.productId, waiting.measurementType, text);
      clearWaiting(userId);
      await edit(t[lang].productTypeUpdated, { reply_markup: settingsKeyboard(lang, true) });
      return true;
    }
    default:
      return false;
  }
}
