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

export function locationKeyboard(locations: Location[], lang: Lang = "sr"): InlineKeyboardMarkup {
  return {
    inline_keyboard: locations.map((l) => [
      { text: name(l, lang), callback_data: `loc:${l.id}` },
    ]),
  };
}

function name(item: { nameEn: string; nameSr: string }, lang: Lang): string {
  return lang === "sr" ? item.nameSr : item.nameEn;
}

function typeTag(mType: string): string {
  if (mType === "color") return "🎨";
  if (mType === "numeric") return "🔢";
  return "🔢🎨";
}

export function categoriesKeyboard(
  categories: Category[],
  lang: Lang,
  stats?: Map<number, { total: number; filled: number }>
): InlineKeyboardMarkup {
  const rows: { text: string; callback_data: string }[][] = [];
  for (let i = 0; i < categories.length; i += 2) {
    const buildBtn = (cat: Category) => {
      let prefix = "";
      if (stats) {
        const s = stats.get(cat.id);
        if (s && s.total > 0) {
          if (s.filled === s.total) prefix = "✅ ";
          else if (s.filled > 0) prefix = "⏸ ";
        }
      }
      return { text: `${prefix}${name(cat, lang)}`, callback_data: `cat:${cat.id}` };
    };
    const row = [buildBtn(categories[i]!)];
    if (categories[i + 1]) row.push(buildBtn(categories[i + 1]!));
    rows.push(row);
  }
  rows.push([
    { text: t[lang].viewReport, callback_data: "report" },
    { text: t[lang].settings, callback_data: "settings" },
  ]);
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
    ],
  };
}

export function settingsKeyboard(lang: Lang, isAdmin: boolean): InlineKeyboardMarkup {
  const rows: { text: string; callback_data: string }[][] = [
    [{ text: t[lang].changeLanguage, callback_data: "settings:lang" }],
  ];
  if (isAdmin) {
    rows.push([
      { text: t[lang].addCategory, callback_data: "admin:add_cat" },
      { text: t[lang].addProduct, callback_data: "admin:add_prod" },
    ]);
    rows.push([
      { text: t[lang].deleteCategory, callback_data: "admin:del_cat" },
      { text: t[lang].deleteProduct, callback_data: "admin:del_prod" },
    ]);
    rows.push([{ text: t[lang].editProductType, callback_data: "admin:edit_prod_type" }]);
    rows.push([{ text: t[lang].addLocation, callback_data: "admin:add_loc" }]);
    rows.push([{ text: t[lang].assignAdmin, callback_data: "settings:assign_admin" }]);
  }
  rows.push([{ text: t[lang].toCategories, callback_data: "cats" }]);
  return { inline_keyboard: rows };
}

export function deleteCategoryKeyboard(
  categories: Category[],
  lang: Lang
): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      ...categories.map((c) => [
        { text: name(c, lang), callback_data: `admin:del_cat_ask:${c.id}` },
      ]),
      [{ text: t[lang].deleteNo, callback_data: "admin:cancel" }],
    ],
  };
}

export function deleteProductCategoryKeyboard(
  categories: Category[],
  lang: Lang
): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      ...categories.map((c) => [
        { text: name(c, lang), callback_data: `admin:del_prod_cat:${c.id}` },
      ]),
      [{ text: t[lang].deleteNo, callback_data: "admin:cancel" }],
    ],
  };
}

export function deleteProductKeyboard(
  products: Product[],
  lang: Lang
): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      ...products.map((p) => [
        { text: name(p, lang), callback_data: `admin:del_prod_ask:${p.id}` },
      ]),
      [{ text: t[lang].deleteNo, callback_data: "admin:cancel" }],
    ],
  };
}

export function confirmDeleteKeyboard(
  lang: Lang,
  confirmCb: string
): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: t[lang].deleteYes, callback_data: confirmCb },
        { text: t[lang].deleteNo, callback_data: "admin:cancel" },
      ],
    ],
  };
}

export function adminKeyboard(lang: Lang): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: t[lang].addCategory, callback_data: "admin:add_cat" }],
      [{ text: t[lang].addProduct, callback_data: "admin:add_prod" }],
      [{ text: t[lang].addLocation, callback_data: "admin:add_loc" }],
      [{ text: t[lang].assignAdmin, callback_data: "settings:assign_admin" }],
      [{ text: t[lang].cancelAdmin, callback_data: "admin:cancel" }],
    ],
  };
}

export function adminCategoryKeyboard(categories: Category[], lang: Lang = "sr"): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      ...categories.map((c) => [
        { text: name(c, lang), callback_data: `admin:cat_pick:${c.id}` },
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

export function editProductTypeCategoryKeyboard(categories: Category[], lang: Lang = "sr"): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      ...categories.map((c) => [
        { text: name(c, lang), callback_data: `admin:edit_pt_cat:${c.id}` },
      ]),
      [{ text: "❌", callback_data: "admin:cancel" }],
    ],
  };
}

export function editProductTypeProductKeyboard(
  products: Product[],
  lang: Lang
): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      ...products.map((p) => [
        {
          text: `${name(p, lang)} ${typeTag(p.measurementType)}`,
          callback_data: `admin:edit_pt_pick:${p.id}`,
        },
      ]),
      [{ text: "❌", callback_data: "admin:cancel" }],
    ],
  };
}

export function editTypeKeyboard(lang: Lang, productId: number): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: t[lang].typeColor, callback_data: `admin:type_upd:${productId}:color` }],
      [{ text: t[lang].typeNumeric, callback_data: `admin:type_upd:${productId}:numeric` }],
      [{ text: t[lang].typeBoth, callback_data: `admin:type_upd:${productId}:both` }],
      [{ text: t[lang].cancelAdmin, callback_data: "admin:cancel" }],
    ],
  };
}
