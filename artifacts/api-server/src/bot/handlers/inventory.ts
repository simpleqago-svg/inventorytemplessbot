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
import { userLocation } from "./start.js";

export function registerInventoryHandlers(bot: Telegraf<Context>) {
  // Category clicked → show products
  bot.action(/^cat:(\d+)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const categoryId = parseInt(ctx.match[1]!);
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      const locId = userLocation.get(userId);
      if (!locId) { await ctx.answerCbQuery(); return; }

      const session = await getOrCreateSession(userId, locId);
      const products = await getProductsByCategory(categoryId);
      const filled = await getFilledProductIds(session.id);

      // Store current category in user state for back navigation
      (ctx as any).__categoryId = categoryId;

      await ctx.editMessageText(t[lang].categoryHeader, {
        parse_mode: "Markdown",
        reply_markup: productsKeyboard(products, filled, lang),
      });
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "cat action error");
    }
  });

  // Product clicked
  bot.action(/^prod:(\d+)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const productId = parseInt(ctx.match[1]!);
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      const locId = userLocation.get(userId);
      if (!locId) { await ctx.answerCbQuery(); return; }

      const session = await getOrCreateSession(userId, locId);
      const product = await getProduct(productId);
      if (!product) { await ctx.answerCbQuery(); return; }

      const name = lang === "sr" ? product.nameSr : product.nameEn;

      if (product.measurementType === "color") {
        await ctx.editMessageText(t[lang].chooseColor(name), {
          parse_mode: "Markdown",
          reply_markup: colorKeyboard(lang, productId),
        });
      } else if (product.measurementType === "numeric") {
        const msgId = ctx.callbackQuery.message?.message_id;
        const chatId = ctx.chat?.id;
        if (!msgId || !chatId) { await ctx.answerCbQuery(); return; }
        setWaiting(userId, {
          type: "numeric",
          sessionId: session.id,
          productId,
          productName: name,
          unit: product.unit ?? "",
          messageId: msgId,
          chatId,
        });
        await ctx.editMessageText(t[lang].enterQuantity(name, product.unit ?? ""), {
          parse_mode: "Markdown",
        });
      } else {
        // both
        const msgId = ctx.callbackQuery.message?.message_id;
        const chatId = ctx.chat?.id;
        if (!msgId || !chatId) { await ctx.answerCbQuery(); return; }
        setWaiting(userId, {
          type: "numeric_then_color",
          sessionId: session.id,
          productId,
          productName: name,
          unit: product.unit ?? "",
          messageId: msgId,
          chatId,
        });
        await ctx.editMessageText(t[lang].enterQuantity(name, product.unit ?? ""), {
          parse_mode: "Markdown",
        });
      }
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "prod action error");
    }
  });

  // Color selection
  bot.action(/^color:(green|yellow|red):(\d+)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const color = ctx.match[1] as "green" | "yellow" | "red";
      const productId = parseInt(ctx.match[2]!);
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      const locId = userLocation.get(userId);
      if (!locId) { await ctx.answerCbQuery(); return; }

      const session = await getOrCreateSession(userId, locId);
      const waiting = getWaiting(userId);

      if (waiting && (waiting.type === "numeric_then_color")) {
        // Part 2 of "both": save numeric + color
        await upsertRecord(waiting.sessionId, waiting.productId, null, color);
        clearWaiting(userId);
      } else {
        await upsertRecord(session.id, productId, null, color);
      }

      // Return to products list for current category
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

  // Back from color picker to category
  bot.action(/^cat_back:(\d+)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const productId = parseInt(ctx.match[1]!);
      clearWaiting(userId);
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      const locId = userLocation.get(userId);
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

  // Reset ask
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

  // Reset confirm
  bot.action("reset_confirm", async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      clearWaiting(userId);
      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      const locId = userLocation.get(userId);
      if (!locId) { await ctx.answerCbQuery(); return; }
      const session = await getSession(userId, locId);
      if (session) await resetSession(session.id);
      await ctx.editMessageText(t[lang].resetDone);
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error({ err }, "reset_confirm error");
    }
  });

  // Text message handler — captures numeric input
  bot.on("text", async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;
      const waiting = getWaiting(userId);
      if (!waiting) return;

      if (
        waiting.type !== "numeric" &&
        waiting.type !== "numeric_then_color"
      ) {
        return;
      }

      const user = await getUser(userId);
      const lang = getLang(user?.lang);
      const text = ctx.message.text.trim().replace(",", ".");
      const value = parseFloat(text);

      // Delete user's message to keep chat clean
      try { await ctx.deleteMessage(); } catch {}

      if (isNaN(value)) {
        // Re-prompt
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

        // Return to products list
        const product = await getProduct(waiting.productId);
        if (!product) return;
        const locId = userLocation.get(userId);
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
        // numeric_then_color: save numeric part, then show color picker
        // Store numeric value temporarily by updating waiting state
        setWaiting(userId, {
          ...waiting,
          type: "numeric_then_color",
        });
        // We save numeric now, color will overwrite when color is picked
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
