import { Pricing } from "@weddni/types";

export function calculateTotalPrice(items: Pricing[]): number {
  return items.reduce((total, item) => total + item.price, 0);
}
