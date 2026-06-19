import { Telegraf, Context } from "telegraf";
import { logger } from "../../lib/logger.js";
import { t, getLang } from "../i18n.js";
import {
  productsKeyboard,
  colorKeyboard,
  resetConfirmKeyboard,
} from "../keyboards.js";
import {
  getUser,
  getProductsByCategory,
  getProduct,
  getSession,
  getOrCreateSession,
  getFilledProductIds,
  upsertRecord,
  resetSession,
} from "../db.js";
import { setWaiting, getWaiting, clearWaiting } from "../state.js";
import { userLocation, resolveLocation, goToCategories } from "./start.js";

export function registerInventoryHandlers(bot: Telegraf<Context>) {
  bot.action(/^cat:(\d+)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const categoryId = parseInt(ctx.match[1]!);
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      const locId = await resolveLocation(userId);
      if (!locId) { await ctx.answerCbQuery(); return; }

      const session = await getOrCreateSession(userId, locId);
      const products = await getProductsByCategory(categoryId);
      const filled = await getFilledProductIds(session.id);

      await ctx.editMessageText(t[lang].categoryHeader, {
        parse_mode: "Markdown",
        reply_markup: productsKeyboard(products, filled, lang),
      });
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "cat action error");
    }
  });

  bot.action(/^prod:(\d+)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const productId = parseInt(ctx.match[1]!);
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      const locId = await resolveLocation(userId);
      if (!locId) { await ctx.answerCbQuery(); return; }

      const session = await getOrCreateSession(userId, locId);
      const product = await getProduct(productId);
      if (!product) { await ctx.answerCbQuery(); return; }

      const pName = lang === "sr" ? product.nameSr : product.nameEn;

      if (product.measurementType === "color") {
        await ctx.editMessageText(t[lang].chooseColor(pName), {
          parse_mode: "Markdown",
          reply_markup: colorKeyboard(lang, productId),
        });
      } else {
        const msgId = ctx.callbackQuery.message?.message_id;
        const chatId = ctx.chat?.id;
        if (!msgId || !chatId) { await ctx.answerCbQuery(); return; }
        const waitType = product.measurementType === "both" ? "numeric_then_color" : "numeric";
        setWaiting(userId, {
          type: waitType,
          sessionId: session.id,
          productId,
          productName: pName,
          unit: product.unit ?? "",
          messageId: msgId,
          chatId,
        });
        await ctx.editMessageText(t[lang].enterQuantity(pName, product.unit ?? ""), {
          parse_mode: "Markdown",
        });
      }
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "prod action error");
    }
  });

  bot.action(/^color:(green|yellow|red):(\d+)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const color = ctx.match[1] as "green" | "yellow" | "red";
      const productId = parseInt(ctx.match[2]!);
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      const locId = await resolveLocation(userId);
      if (!locId) { await ctx.answerCbQuery(); return; }

      const session = await getOrCreateSession(userId, locId);
      const waiting = getWaiting(userId);

      if (waiting && waiting.type === "numeric_then_color") {
        await upsertRecord(waiting.sessionId, waiting.productId, null, color);
        clearWaiting(userId);
      } else {
        await upsertRecord(session.id, productId, null, color);
      }

      const product = await getProduct(productId);
      if (!product) { await ctx.answerCbQuery(); return; }
      const products = await getProductsByCategory(product.categoryId);
      const filled = await getFilledProductIds(session.id);
      await ctx.editMessageText(t[lang].categoryHeader, {
        parse_mode: "Markdown",
        reply_markup: productsKeyboard(products, filled, lang),
      });
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "color action error");
    }
  });

  bot.action(/^cat_back:(\d+)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const productId = parseInt(ctx.match[1]!);
      clearWaiting(userId);
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      const locId = await resolveLocation(userId);
      if (!locId) { await ctx.answerCbQuery(); return; }

      const session = await getOrCreateSession(userId, locId);
      const product = await getProduct(productId);
      if (!product) { await ctx.answerCbQuery(); return; }
      const products = await getProductsByCategory(product.categoryId);
      const filled = await getFilledProductIds(session.id);
      await ctx.editMessageText(t[lang].categoryHeader, {
        parse_mode: "Markdown",
        reply_markup: productsKeyboard(products, filled, lang),
      });
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "cat_back action error");
    }
  });

  bot.action("reset_ask", async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      await ctx.editMessageText(t[lang].resetConfirm, {
        reply_markup: resetConfirmKeyboard(lang),
      });
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "reset_ask error");
    }
  });

  bot.action("reset_confirm", async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      clearWaiting(userId);
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      const locId = await resolveLocation(userId);
      if (!locId) { await ctx.answerCbQuery(); return; }
      const session = await getSession(userId, locId);
      if (session) await resetSession(session.id);
      await ctx.answerCbQuery(t[lang].resetDone);
      await goToCategories(ctx, userId, locId, true);
    } catch (err) {
      logger.error({ err }, "reset_confirm error");
    }
  });

  bot.on("text", async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const waiting = getWaiting(userId);
      if (!waiting) return;

      if (waiting.type !== "numeric" && waiting.type !== "numeric_then_color") {
        return;
      }

      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      const text = ctx.message.text.trim().replace(",", ".");
      const value = parseFloat(text);

      try { await ctx.deleteMessage(); } catch {}

      if (isNaN(value)) {
        try {
          await ctx.telegram.editMessageText(
            waiting.chatId,
            waiting.messageId,
            undefined,
            t[lang].invalidNumber,
            { parse_mode: "Markdown" }
          );
        } catch {}
        return;
      }

      if (waiting.type === "numeric") {
        await upsertRecord(waiting.sessionId, waiting.productId, value, null);
        clearWaiting(userId);

        const product = await getProduct(waiting.productId);
        if (!product) return;
        const locId = await resolveLocation(userId);
        if (!locId) return;
        const session = await getOrCreateSession(userId, locId);
        const products = await getProductsByCategory(product.categoryId);
        const filled = await getFilledProductIds(session.id);
        try {
          await ctx.telegram.editMessageText(
            waiting.chatId,
            waiting.messageId,
            undefined,
            t[lang].categoryHeader,
            {
              parse_mode: "Markdown",
              reply_markup: productsKeyboard(products, filled, lang),
            }
          );
        } catch {}
      } else {
        await upsertRecord(waiting.sessionId, waiting.productId, value, null);
        try {
          await ctx.telegram.editMessageText(
            waiting.chatId,
            waiting.messageId,
            undefined,
            t[lang].chooseColor(waiting.productName),
            {
              parse_mode: "Markdown",
              reply_markup: colorKeyboard(lang, waiting.productId),
            }
          );
        } catch {}
      }
    } catch (err) {
      logger.error({ err }, "text handler error");
    }
  });
}
