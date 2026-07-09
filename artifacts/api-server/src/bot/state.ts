export type WaitingStep =
  | { type: "numeric"; sessionId: number; productId: number; productName: string; unit: string; messageId: number; chatId: number }
  | { type: "numeric_then_color"; sessionId: number; productId: number; productName: string; unit: string; messageId: number; chatId: number }
  | { type: "admin_cat_name_en"; messageId: number; chatId: number }
  | { type: "admin_cat_name_sr"; nameEn: string; messageId: number; chatId: number }
  | { type: "admin_cat_choose_schedule"; nameEn: string; nameSr: string; messageId: number; chatId: number }
  | { type: "admin_prod_name_en"; categoryId: number; messageId: number; chatId: number }
  | { type: "admin_prod_name_sr"; categoryId: number; nameEn: string; messageId: number; chatId: number }
  | { type: "admin_prod_choose_type"; categoryId: number; nameEn: string; nameSr: string; messageId: number; chatId: number }
  | { type: "admin_prod_unit"; categoryId: number; nameEn: string; nameSr: string; measurementType: "numeric" | "both"; messageId: number; chatId: number }
  | { type: "admin_loc_name_en"; messageId: number; chatId: number }
  | { type: "admin_loc_name_sr"; nameEn: string; messageId: number; chatId: number }
  | { type: "admin_assign_username"; messageId: number; chatId: number }
  | { type: "admin_edit_prod_unit"; productId: number; measurementType: "numeric" | "both"; messageId: number; chatId: number };

const waiting = new Map<number, WaitingStep>();

export function setWaiting(userId: number, step: WaitingStep) {
  waiting.set(userId, step);
}

export function getWaiting(userId: number): WaitingStep | undefined {
  return waiting.get(userId);
}

export function clearWaiting(userId: number) {
  waiting.delete(userId);
}
