/**
 * Shared booking pricing rules — the single source of truth used by BOTH the
 * reservation API (server-authoritative totals) and the booking UI (display).
 * Keep this file framework-agnostic: it is imported from client components too.
 */

export interface BookingAddons {
  airportShuttle?: boolean;
  breakfast?: boolean;
  spaTreatment?: boolean;
  coffeeCeremony?: boolean;
}

/** Add-on unit prices in USD. ETB totals convert these via the exchange rate. */
export const ADDON_PRICES_USD = {
  airportShuttle: 15,
  breakfastPerAdultPerNight: 12,
  spaTreatment: 65,
  coffeeCeremonyPerAdult: 8,
} as const;

export interface AddonUnitPrices {
  airportShuttle: number;
  breakfastPerAdultPerNight: number;
  spaTreatment: number;
  coffeeCeremonyPerAdult: number;
}

export const VAT_RATE = 0.15;

/**
 * Promo codes and their discount percentages.
 * Validated server-side — the client may only *suggest* a code, never a total.
 */
export const PROMO_CODES: Record<string, number> = {
  GRANDMEMBER15: 15,
  SAVE15: 15,
  WEEKENDREBALANCE: 20,
};

export function getPromoDiscountPercent(code: unknown): number {
  if (typeof code !== 'string') return 0;
  return PROMO_CODES[code.trim().toUpperCase()] ?? 0;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeAddonsTotal(
  addons: BookingAddons | undefined | null,
  adults: number,
  nights: number,
  unitPrices: AddonUnitPrices = ADDON_PRICES_USD
): number {
  let total = 0;
  if (addons?.airportShuttle) total += unitPrices.airportShuttle;
  if (addons?.breakfast)
    total += unitPrices.breakfastPerAdultPerNight * adults * nights;
  if (addons?.spaTreatment) total += unitPrices.spaTreatment;
  if (addons?.coffeeCeremony) total += unitPrices.coffeeCeremonyPerAdult * adults;
  return round2(total);
}

export interface BookingTotals {
  roomSubtotal: number;
  discountAmount: number;
  addonsTotal: number;
  /** Room + addons − discount (pre-tax). */
  subtotal: number;
  tax: number;
  grandTotal: number;
}

/**
 * Compute the full price breakdown. Mirrors the historical client-side math:
 * the promo discount applies to the room subtotal only, VAT applies to
 * (room − discount + addons).
 */
export function computeBookingTotals({
  pricePerNight,
  nights,
  adults,
  addons,
  discountPercent = 0,
  addonUnitPrices = ADDON_PRICES_USD,
}: {
  pricePerNight: number;
  nights: number;
  adults: number;
  addons?: BookingAddons | null;
  discountPercent?: number;
  addonUnitPrices?: AddonUnitPrices;
}): BookingTotals {
  const roomSubtotal = round2(pricePerNight * nights);
  const discountAmount = round2((roomSubtotal * discountPercent) / 100);
  const addonsTotal = computeAddonsTotal(addons, adults, nights, addonUnitPrices);
  const subtotal = round2(roomSubtotal - discountAmount + addonsTotal);
  const tax = round2(subtotal * VAT_RATE);
  const grandTotal = round2(subtotal + tax);
  return { roomSubtotal, discountAmount, addonsTotal, subtotal, tax, grandTotal };
}
