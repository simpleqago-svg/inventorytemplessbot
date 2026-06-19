import { InlineKeyboardMarkup } from "telegraf/types";
import { Lang, t } from "./i18n.js";
import type { Location, Category, Product } from "@workspace/db";

export function langKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "English 🇬🇧", callback_data: "lang:en" },
        { text: "Srpski 🇷🇸", callback_data: "lang:sr" },
      ],
    ],
  };
}

export function locationKeyboard(locations: Location[]): InlineKeyboardMarkup {
  return {
    inline_keyboard: locations.map((l) => [
      { text: l.nameSr, callback_data: `loc:${l.id}` },
    ]),
  };
}

function name(item: { nameEn: string; nameSr: string }, lang: Lang): string {
  return lang === "sr" ? item.nameSr : item.nameEn;
}

export function categoriesKeyboard(
  categories: Category[],
  lang: Lang
): InlineKeyboardMarkup {
  const rows: { text: string; callback_data: string }[][] = [];
  for (let i = 0; i < categories.length; i += 2) {
    const row = [{ text: name(categories[i]!, lang), callback_data: `cat:${categories[i]!.id}` }];
    if (categories[i + 1]) {
      row.push({ text: name(categories[i + 1]!, lang), callback_data: `cat:${categories[i + 1]!.id}` });
    }
    rows.push(row);
  }
  rows.push([{ text: t[lang].viewReport, callback_data: "report" }]);
  rows.push([{ text: t[lang].resetReport, callback_data: "reset_ask" }]);
  return { inline_keyboard: rows };
}

export function productsKeyboard(
  products: Product[],
  filledIds: Set<number>,
  lang: Lang
): InlineKeyboardMarkup {
  const rows = products.map((p) => {
    const check = filledIds.has(p.id) ? "✅ " : "";
    return [{ text: `${check}${name(p, lang)}`, callback_data: `prod:${p.id}` }];
  });
  rows.push([
    { text: t[lang].toCategories, callback_data: "cats" },
    { text: t[lang].viewReport, callback_data: "report" },
  ]);
  return { inline_keyboard: rows };
}

export function colorKeyboard(lang: Lang, productId: number): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: t[lang].colorGreen, callback_data: `color:green:${productId}` }],
      [{ text: t[lang].colorYellow, callback_data: `color:yellow:${productId}` }],
      [{ text: t[lang].colorRed, callback_data: `color:red:${productId}` }],
      [{ text: t[lang].back, callback_data: `cat_back:${productId}` }],
    ],
  };
}

export function resetConfirmKeyboard(lang: Lang): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: t[lang].resetYes, callback_data: "reset_confirm" },
        { text: t[lang].resetNo, callback_data: "cats" },
      ],
    ],
  };
}

export function reportKeyboard(lang: Lang): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: t[lang].submit, callback_data: "submit" }],
      [{ text: t[lang].edit, callback_data: "cats" }],
      [{ text: t[lang].back, callback_data: "cats" }],
    ],
  };
}

export function adminKeyboard(lang: Lang): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: t[lang].addCategory, callback_data: "admin:add_cat" }],
      [{ text: t[lang].addProduct, callback_data: "admin:add_prod" }],
      [{ text: t[lang].addLocation, callback_data: "admin:add_loc" }],
      [{ text: t[lang].cancelAdmin, callback_data: "admin:cancel" }],
    ],
  };
}

export function adminCategoryKeyboard(categories: Category[]): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      ...categories.map((c) => [
        { text: c.nameSr, callback_data: `admin:cat_pick:${c.id}` },
      ]),
      [{ text: "❌", callback_data: "admin:cancel" }],
    ],
  };
}

export function adminTypeKeyboard(lang: Lang): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: t[lang].typeColor, callback_data: "admin:type:color" }],
      [{ text: t[lang].typeNumeric, callback_data: "admin:type:numeric" }],
      [{ text: t[lang].typeBoth, callback_data: "admin:type:both" }],
      [{ text: t[lang].cancelAdmin, callback_data: "admin:cancel" }],
    ],
  };
}
